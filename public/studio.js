const $ = (selector) => document.querySelector(selector);
const endpoint = "/api/studio";
const state = { documents: [], current: null };
const blank = (kind) => ({ kind, slug: "", locale: "en", title: "", status: "draft", content: kind === "case" ? { blocks: [{ type: "prose", heading: "Opening", body: "" }] } : { fields: {} } });
const request = async (path, options = {}) => {
  const response = await fetch(`${endpoint}${path}`, options);
  if (response.status === 401) { const body = await response.json(); window.location.assign(body.signInPath); throw new Error("Sign in required"); }
  if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.error || "Request failed"); }
  return response.status === 204 ? null : response.json();
};
const notice = (message) => { const node = $("[data-notice]"); node.textContent = message; node.hidden = false; };
const serialize = (document) => JSON.stringify(document.content, null, 2);
function renderDocuments() {
  const host = $("[data-documents]");
  host.innerHTML = state.documents.map((doc) => `<button class="studio__document" data-document="${doc.id}"><span>${doc.kind} · ${doc.status}</span><h2>${doc.title}</h2><p>/${doc.slug}/ · ${doc.locale.toUpperCase()} · v${doc.draft_version}</p></button>`).join("") || "<p>No documents yet. Create a page or case to begin.</p>";
  host.querySelectorAll("[data-document]").forEach((node) => node.addEventListener("click", () => openDocument(node.dataset.document)));
}
async function refresh() {
  let data = await request("/documents");
  if (!data.documents.length) {
    const seed = await fetch("/studio-seed.json").then((response) => response.json());
    await Promise.all(seed.documents.map((document) => request("/documents", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(document) })));
    data = await request("/documents");
    notice("Existing Understory pages and the Amazon case have been imported as first drafts. Nothing is public until you publish it.");
  }
  state.documents = data.documents; renderDocuments();
}
function setEditor(document) {
  state.current = document;
  const form = $("[data-editor]"); form.hidden = false; $("[data-media-panel]").hidden = true;
  $("[data-editor-title]").textContent = document.id ? `Editing ${document.title}` : `New ${document.kind}`;
  for (const name of ["title", "slug", "locale", "status"]) form.elements[name].value = document[name] || "";
  form.elements.content.value = serialize(document);
  $("[data-publish]").disabled = !document.id;
  $("[data-versions]").disabled = !document.id;
  $("[data-delete]").disabled = !document.id;
}
async function openDocument(id) { const data = await request(`/documents/${id}`); setEditor(data.document); }
function formDocument() {
  const form = $("[data-editor]"); let content;
  try { content = JSON.parse(form.elements.content.value); } catch { throw new Error("Structured content must be valid JSON."); }
  return { kind: state.current.kind, slug: form.elements.slug.value.trim(), locale: form.elements.locale.value, title: form.elements.title.value.trim(), status: form.elements.status.value, content };
}
async function showVersions() {
  const data = await request(`/documents/${state.current.id}/versions`);
  if (!data.versions.length) return notice("No published versions yet. Publish when this draft is ready.");
  const choice = window.prompt(`Published versions: ${data.versions.map((v) => `v${v.version_number} (${v.created_at.slice(0, 10)})`).join(", ")}\nEnter a version number to restore into the draft:`);
  if (!choice) return;
  const restored = await request(`/documents/${state.current.id}/restore`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ versionNumber: Number(choice) }) });
  setEditor(restored.document); await refresh(); notice("Version restored into a new unpublished draft.");
}
async function media() {
  $("[data-editor]").hidden = true; $("[data-media-panel]").hidden = false;
  const data = await request("/media");
  $("[data-media-list]").innerHTML = data.assets.map((asset) => `<article class="studio__media-item"><img src="${asset.url}" alt="${asset.alt}"><div><p><strong>${asset.filename}</strong></p><p>${asset.alt || "Missing alt text"}</p><p>${asset.caption || "No caption"}</p><a href="${asset.url}" target="_blank">Open asset</a></div></article>`).join("") || "<p>No uploaded images yet.</p>";
}
$("[data-editor]").addEventListener("submit", async (event) => { event.preventDefault(); try { const value = formDocument(); const data = state.current.id ? await request(`/documents/${state.current.id}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(value) }) : await request("/documents", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(value) }); setEditor(data.document); await refresh(); notice("Draft saved. It is not public until you publish it."); } catch (error) { notice(error.message); } });
$("[data-publish]").addEventListener("click", async () => { try { const saved = await request(`/documents/${state.current.id}/publish`, { method: "POST" }); setEditor(saved.document); await refresh(); notice(`Published version ${saved.publication.version}. Public runtime records are updated.`); } catch (error) { notice(error.message); } });
$("[data-versions]").addEventListener("click", () => showVersions().catch((error) => notice(error.message)));
$("[data-delete]").addEventListener("click", async () => { if (window.confirm("Delete this document and its history?")) { await request(`/documents/${state.current.id}`, { method: "DELETE" }); $("[data-editor]").hidden = true; await refresh(); notice("Document deleted."); } });
$("[data-close]").addEventListener("click", () => { $("[data-editor]").hidden = true; });
document.querySelectorAll("[data-new]").forEach((button) => button.addEventListener("click", () => setEditor(blank(button.dataset.new))));
$("[data-media]").addEventListener("click", () => media().catch((error) => notice(error.message)));
$("[data-close-media]").addEventListener("click", () => { $("[data-media-panel]").hidden = true; });
$("[data-media-form]").addEventListener("submit", async (event) => { event.preventDefault(); try { const form = new FormData(event.target); await request("/media", { method: "POST", body: form }); event.target.reset(); await media(); notice("Image uploaded to the media library."); } catch (error) { notice(error.message); } });
(async () => { try { const session = await request("/session"); $("[data-identity]").textContent = session.email; await refresh(); } catch (error) { notice(error.message); } })();
