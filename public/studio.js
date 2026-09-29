const $ = (selector) => document.querySelector(selector);
const endpoint = "/api/studio";
const state = { documents: [], current: null };
const blank = (kind) => ({ kind, slug: "", locale: "en", title: "", status: "draft", content: kind === "case" ? { blocks: [{ type: "prose", heading: "Opening", body: "" }] } : { fields: {} } });
const types = ["prose", "image", "evidence", "timeline", "causal-chain", "debate", "trade-off", "boundary", "insight", "ecosystem", "question"];
const defaults = { prose:{heading:"New section",body:""}, image:{src:"",alt:"",caption:""}, evidence:{title:"Evidence",metric:"",finding:"",comparison:"",caveat:"",source:""}, timeline:{title:"Timeline",events:[{year:"",title:"",description:"",type:"market"}]}, "causal-chain":{title:"Causal chain",steps:[{label:"",detail:""}]}, debate:{title:"Debate",body:"",visualTitle:"Evidence / Counter-evidence / Interpretation"}, "trade-off":{leftLabel:"",rightLabel:"",leftItems:[""],rightItems:[""]}, boundary:{title:"Boundary",items:[{label:"",detail:""}]}, insight:{title:"Insight",statement:""}, ecosystem:{title:"System map",nodes:[{label:"",title:"",detail:""}]}, question:{question:""} };
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
  const isCase = document.kind === "case";
  $("[data-case-fields]").hidden = !isCase;
  $("[data-raw-content]").hidden = isCase;
  if (isCase) renderCaseFields(document.content);
  $("[data-publish]").disabled = !document.id;
  $("[data-versions]").disabled = !document.id;
  $("[data-delete]").disabled = !document.id;
}
const field = (label, value, key, multiline = false) => `<label>${label}${multiline ? `<textarea data-block-field="${key}" rows="3">${String(value ?? "")}</textarea>` : `<input data-block-field="${key}" value="${String(value ?? "").replace(/\"/g, "&quot;")}">`}</label>`;
function renderCaseFields(content) {
  content.meta ??= {}; content.meta.hero ??= {}; content.blocks ??= [];
  document.querySelector("[data-meta=summary]").value = content.meta.summary || "";
  document.querySelector("[data-meta=centralQuestion]").value = content.meta.centralQuestion || "";
  for (const key of ["image", "alt", "caption"]) document.querySelector(`[data-hero=${key}]`).value = content.meta.hero[key] || "";
  const host = $("[data-blocks]");
  host.innerHTML = content.blocks.map((block, index) => `<article class="studio__block" data-block-index="${index}"><header><strong>${block.type}</strong><label><input type="checkbox" data-visible ${block.visible !== false ? "checked" : ""}> Visible</label><button type="button" data-move="up">↑</button><button type="button" data-move="down">↓</button><button type="button" data-duplicate>Duplicate</button><button type="button" data-remove>Delete</button></header><div class="studio__block-fields">${Object.entries(block).filter(([key]) => !["id","type","visible"].includes(key)).map(([key,value]) => Array.isArray(value) || (value && typeof value === "object") ? `<label>${key}<textarea data-block-json="${key}" rows="5">${JSON.stringify(value, null, 2)}</textarea></label>` : field(key, value, key, key === "body" || key === "finding" || key === "comparison" || key === "caveat" || key === "statement")).join("")}</div></article>`).join("");
  host.querySelectorAll("[data-move]").forEach((button) => button.addEventListener("click", () => { const index = Number(button.closest("[data-block-index]").dataset.blockIndex); const destination = button.dataset.move === "up" ? index - 1 : index + 1; if (destination >= 0 && destination < content.blocks.length) { [content.blocks[index], content.blocks[destination]] = [content.blocks[destination], content.blocks[index]]; renderCaseFields(content); } }));
  host.querySelectorAll("[data-duplicate]").forEach((button) => button.addEventListener("click", () => { const index = Number(button.closest("[data-block-index]").dataset.blockIndex); content.blocks.splice(index + 1, 0, { ...structuredClone(content.blocks[index]), id: crypto.randomUUID() }); renderCaseFields(content); }));
  host.querySelectorAll("[data-remove]").forEach((button) => button.addEventListener("click", () => { const index = Number(button.closest("[data-block-index]").dataset.blockIndex); if (window.confirm("Delete this editorial section?")) { content.blocks.splice(index, 1); renderCaseFields(content); } }));
}
function collectCase() {
  const content = state.current.content; content.meta ??= {}; content.meta.hero ??= {};
  content.meta.summary = document.querySelector("[data-meta=summary]").value;
  content.meta.centralQuestion = document.querySelector("[data-meta=centralQuestion]").value;
  for (const key of ["image", "alt", "caption"]) content.meta.hero[key] = document.querySelector(`[data-hero=${key}]`).value;
  document.querySelectorAll("[data-block-index]").forEach((node) => { const block = content.blocks[Number(node.dataset.blockIndex)]; block.visible = node.querySelector("[data-visible]").checked; node.querySelectorAll("[data-block-field]").forEach((input) => { block[input.dataset.blockField] = input.value; }); node.querySelectorAll("[data-block-json]").forEach((input) => { try { block[input.dataset.blockJson] = JSON.parse(input.value); } catch { throw new Error(`${input.dataset.blockJson} must be valid structured data.`); } }); });
  return content;
}
async function openDocument(id) { const data = await request(`/documents/${id}`); setEditor(data.document); }
function formDocument() {
  const form = $("[data-editor]"); let content;
  try { content = state.current.kind === "case" ? collectCase() : JSON.parse(form.elements.content.value); } catch { throw new Error("Structured content must be valid JSON."); }
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
$("[data-preview]").addEventListener("click", () => { if (state.current?.kind !== "case" || state.current.slug !== "amazon-convenience-market-power") return notice("Draft preview is currently connected to the Amazon CMS sample."); window.open("/studio/preview/amazon-convenience-market-power/", "_blank", "noopener"); });
$("[data-delete]").addEventListener("click", async () => { if (window.confirm("Delete this document and its history?")) { await request(`/documents/${state.current.id}`, { method: "DELETE" }); $("[data-editor]").hidden = true; await refresh(); notice("Document deleted."); } });
$("[data-close]").addEventListener("click", () => { $("[data-editor]").hidden = true; });
$("[data-add-block]").addEventListener("click", () => { const type = window.prompt(`Section type: ${types.join(", ")}`, "prose"); if (!types.includes(type)) return notice("Choose one of the supported editorial section types."); state.current.content.blocks.push({ id: crypto.randomUUID(), type, visible: true, ...structuredClone(defaults[type]) }); renderCaseFields(state.current.content); });
document.querySelectorAll("[data-new]").forEach((button) => button.addEventListener("click", () => setEditor(blank(button.dataset.new))));
$("[data-media]").addEventListener("click", () => media().catch((error) => notice(error.message)));
$("[data-close-media]").addEventListener("click", () => { $("[data-media-panel]").hidden = true; });
$("[data-media-form]").addEventListener("submit", async (event) => { event.preventDefault(); try { const form = new FormData(event.target); await request("/media", { method: "POST", body: form }); event.target.reset(); await media(); notice("Image uploaded to the media library."); } catch (error) { notice(error.message); } });
(async () => { try { const session = await request("/session"); $("[data-identity]").textContent = session.email; await refresh(); } catch (error) { notice(error.message); } })();
