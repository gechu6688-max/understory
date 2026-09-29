import { normalizeCase, validateDocument } from "./cms-schema.mjs";

const json = (value, init = {}) =>
  new Response(JSON.stringify(value), { ...init, headers: { "content-type": "application/json; charset=utf-8", ...(init.headers || {}) } });

const now = () => new Date().toISOString();
const id = () => crypto.randomUUID();
const parse = async (request) => {
  try { return await request.json(); } catch { throw new Error("A JSON request body is required."); }
};

function requireOwner(request, env) {
  const email = request.headers.get("oai-authenticated-user-email")?.toLowerCase();
  const owner = env.STUDIO_OWNER_EMAIL?.toLowerCase();
  if (!email) return { error: json({ error: "sign_in_required", signInPath: "/signin-with-chatgpt?return_to=/studio/" }, { status: 401 }) };
  if (!owner) return { error: json({ error: "studio_not_configured" }, { status: 503 }) };
  if (email !== owner) return { error: json({ error: "owner_access_required" }, { status: 403 }) };
  return { email };
}

const documentRow = (row) => ({
  ...row,
  content: JSON.parse(row.content_json),
  publishedContent: row.published_json ? JSON.parse(row.published_json) : null,
  content_json: undefined,
  published_json: undefined,
});

async function listDocuments(env) {
  const result = await env.DB.prepare("SELECT * FROM content_documents ORDER BY kind, slug, locale").all();
  return result.results.map(documentRow);
}

async function getDocument(env, documentId) {
  const row = await env.DB.prepare("SELECT * FROM content_documents WHERE id = ?").bind(documentId).first();
  return row ? documentRow(row) : null;
}

async function createDocument(env, input) {
  if (input.kind === "case") input.content = normalizeCase(input.content);
  const validation = validateDocument(input);
  if (validation) throw new Error(validation);
  const timestamp = now();
  const value = { id: id(), kind: input.kind, slug: input.slug, locale: input.locale || "en", title: input.title, status: input.status || "draft", content: input.content };
  await env.DB.prepare("INSERT INTO content_documents (id, kind, slug, locale, title, status, content_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(value.id, value.kind, value.slug, value.locale, value.title, value.status, JSON.stringify(value.content), timestamp, timestamp).run();
  return getDocument(env, value.id);
}

async function updateDocument(env, documentId, input) {
  if (input.kind === "case") input.content = normalizeCase(input.content);
  const validation = validateDocument(input);
  if (validation) throw new Error(validation);
  const existing = await getDocument(env, documentId);
  if (!existing) return null;
  await env.DB.prepare("UPDATE content_documents SET slug = ?, locale = ?, title = ?, status = ?, content_json = ?, draft_version = draft_version + 1, updated_at = ? WHERE id = ?")
    .bind(input.slug, input.locale || "en", input.title, input.status || existing.status, JSON.stringify(input.content), now(), documentId).run();
  return getDocument(env, documentId);
}

async function handleStudioApi(request, env, pathname) {
  const auth = requireOwner(request, env);
  if (auth.error) return auth.error;
  const suffix = pathname.slice("/api/studio".length) || "/";
  if (suffix === "/session" && request.method === "GET") return json({ email: auth.email, role: "owner" });
  if (suffix === "/documents" && request.method === "GET") return json({ documents: await listDocuments(env) });
  if (suffix === "/documents" && request.method === "POST") return json({ document: await createDocument(env, await parse(request)) }, { status: 201 });
  const match = suffix.match(/^\/documents\/([^/]+)(?:\/(publish|versions|restore|archive))?$/);
  if (!match) return json({ error: "not_found" }, { status: 404 });
  const [, documentId, action] = match;
  if (!action && request.method === "GET") {
    const document = await getDocument(env, documentId);
    return document ? json({ document }) : json({ error: "not_found" }, { status: 404 });
  }
  if (!action && request.method === "PUT") {
    const document = await updateDocument(env, documentId, await parse(request));
    return document ? json({ document }) : json({ error: "not_found" }, { status: 404 });
  }
  if (!action && request.method === "DELETE") {
    await env.DB.prepare("DELETE FROM content_documents WHERE id = ?").bind(documentId).run();
    return new Response(null, { status: 204 });
  }
  if (action === "versions" && request.method === "GET") {
    const result = await env.DB.prepare("SELECT id, version_number, note, created_at, created_by FROM content_versions WHERE document_id = ? ORDER BY version_number DESC").bind(documentId).all();
    return json({ versions: result.results });
  }
  if (action === "publish" && request.method === "POST") {
    const document = await getDocument(env, documentId);
    if (!document) return json({ error: "not_found" }, { status: 404 });
    const versionNumber = (document.published_version || 0) + 1;
    const timestamp = now();
    await env.DB.batch([
      env.DB.prepare("INSERT INTO content_versions (id, document_id, version_number, snapshot_json, note, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .bind(id(), documentId, versionNumber, JSON.stringify(document.content), "Published from Creator Studio", timestamp, auth.email),
      env.DB.prepare("UPDATE content_documents SET published_json = ?, published_version = ?, status = 'published', published_at = ?, updated_at = ? WHERE id = ?")
        .bind(JSON.stringify(document.content), versionNumber, timestamp, timestamp, documentId),
    ]);
    return json({ document: await getDocument(env, documentId), publication: { version: versionNumber, publishedAt: timestamp } });
  }
  if (action === "restore" && request.method === "POST") {
    const { versionNumber } = await parse(request);
    const version = await env.DB.prepare("SELECT snapshot_json FROM content_versions WHERE document_id = ? AND version_number = ?").bind(documentId, versionNumber).first();
    if (!version) return json({ error: "version_not_found" }, { status: 404 });
    await env.DB.prepare("UPDATE content_documents SET content_json = ?, draft_version = draft_version + 1, updated_at = ? WHERE id = ?").bind(version.snapshot_json, now(), documentId).run();
    return json({ document: await getDocument(env, documentId) });
  }
  if (action === "archive" && request.method === "POST") {
    await env.DB.prepare("UPDATE content_documents SET status = 'archived', updated_at = ? WHERE id = ?").bind(now(), documentId).run();
    return json({ document: await getDocument(env, documentId) });
  }
  return json({ error: "method_not_allowed" }, { status: 405 });
}

async function handlePublicApi(request, env) {
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind");
  const slug = url.searchParams.get("slug");
  const locale = url.searchParams.get("locale") || "en";
  if (!kind || !slug || !["site", "page", "case"].includes(kind)) return json({ error: "invalid_query" }, { status: 400 });
  const row = await env.DB.prepare("SELECT id, kind, slug, locale, title, published_json, published_version, published_at FROM content_documents WHERE kind = ? AND slug = ? AND locale = ? AND status = 'published'").bind(kind, slug, locale).first();
  if (!row || !row.published_json) return json({ document: null }, { headers: { "cache-control": "no-store" } });
  const document = { ...row, content: JSON.parse(row.published_json) };
  const validation = validateDocument({ ...document, status: "published" });
  if (validation) return json({ document: null }, { headers: { "cache-control": "no-store" } });
  return json({ document }, { headers: { "cache-control": "no-store" } });
}

async function handlePreviewApi(request, env) {
  const auth = requireOwner(request, env);
  if (auth.error) return auth.error;
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind");
  const slug = url.searchParams.get("slug");
  const locale = url.searchParams.get("locale") || "en";
  if (!kind || !slug || !["site", "page", "case"].includes(kind)) return json({ error: "invalid_query" }, { status: 400 });
  const row = await env.DB.prepare("SELECT * FROM content_documents WHERE kind = ? AND slug = ? AND locale = ?").bind(kind, slug, locale).first();
  if (!row) return json({ document: null });
  const document = documentRow(row);
  const validation = validateDocument({ ...document, content: document.content });
  if (validation) return json({ document: null, validation });
  return json({ document });
}

async function handleMediaApi(request, env, pathname) {
  const auth = requireOwner(request, env);
  if (auth.error) return auth.error;
  if (pathname === "/api/studio/media" && request.method === "GET") {
    const result = await env.DB.prepare("SELECT * FROM media_assets ORDER BY created_at DESC").all();
    return json({ assets: result.results.map((asset) => ({ ...asset, url: `/media/${asset.id}` })) });
  }
  if (pathname === "/api/studio/media" && request.method === "POST") {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || !file.type.startsWith("image/")) return json({ error: "An image file is required." }, { status: 400 });
    const asset = { id: id(), objectKey: `studio/${id()}-${file.name.replace(/[^a-z0-9._-]/gi, "-")}`, filename: file.name, contentType: file.type, size: file.size, alt: String(form.get("alt") || ""), caption: String(form.get("caption") || "") };
    const timestamp = now();
    await env.BUCKET.put(asset.objectKey, file.stream(), { httpMetadata: { contentType: asset.contentType } });
    await env.DB.prepare("INSERT INTO media_assets (id, object_key, filename, content_type, size_bytes, alt, caption, created_at, updated_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(asset.id, asset.objectKey, asset.filename, asset.contentType, asset.size, asset.alt, asset.caption, timestamp, timestamp, auth.email).run();
    return json({ asset: { ...asset, url: `/media/${asset.id}` } }, { status: 201 });
  }
  const assetId = pathname.match(/^\/api\/studio\/media\/([^/]+)$/)?.[1];
  if (assetId && request.method === "PUT") {
    const { alt, caption } = await parse(request);
    await env.DB.prepare("UPDATE media_assets SET alt = ?, caption = ?, updated_at = ? WHERE id = ?").bind(String(alt || ""), String(caption || ""), now(), assetId).run();
    return json({ ok: true });
  }
  if (assetId && request.method === "DELETE") {
    const asset = await env.DB.prepare("SELECT object_key FROM media_assets WHERE id = ?").bind(assetId).first();
    if (asset) await env.BUCKET.delete(asset.object_key);
    await env.DB.prepare("DELETE FROM media_assets WHERE id = ?").bind(assetId).run();
    return new Response(null, { status: 204 });
  }
  return json({ error: "not_found" }, { status: 404 });
}

async function publicMedia(_request, env, assetId) {
  const asset = await env.DB.prepare("SELECT object_key, content_type FROM media_assets WHERE id = ?").bind(assetId).first();
  if (!asset) return new Response("Not found", { status: 404 });
  const object = await env.BUCKET.get(asset.object_key);
  if (!object) return new Response("Not found", { status: 404 });
  return new Response(object.body, { headers: { "content-type": asset.content_type, "cache-control": "public, max-age=31536000, immutable" } });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname === "/api/studio/preview") return handlePreviewApi(request, env);
      if (url.pathname.startsWith("/api/studio/media")) return handleMediaApi(request, env, url.pathname);
      if (url.pathname === "/api/public/document") return handlePublicApi(request, env);
      if (url.pathname.startsWith("/api/studio")) return handleStudioApi(request, env, url.pathname);
      if (url.pathname.startsWith("/media/")) return publicMedia(request, env, url.pathname.slice(7));
      if (url.pathname === "/studio" || url.pathname.startsWith("/studio/")) {
        const auth = requireOwner(request, env);
        if (auth.error) {
          if (auth.error.status === 401) return Response.redirect(new URL("/signin-with-chatgpt?return_to=/studio/", url), 302);
          return new Response("Creator Studio access is restricted.", { status: auth.error.status });
        }
        if (url.pathname.startsWith("/studio/preview/")) return env.ASSETS.fetch(new Request(new URL("/studio-preview-amazon/", url), request));
        return env.ASSETS.fetch(new Request(new URL("/studio-shell/", url), request));
      }
      return env.ASSETS.fetch(request);
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "Unexpected server error" }, { status: 400 });
    }
  },
};
