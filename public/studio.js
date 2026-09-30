const $ = (selector) => document.querySelector(selector);
const endpoint = "/api/studio";
const state = { documents: [], current: null };
const blank = (kind) => ({ kind, slug: "", locale: "en", title: "", status: "draft", content: kind === "case" ? { blocks: [{ type: "prose", heading: "Opening", body: "" }] } : { fields: {} } });
const types = ["prose", "image", "evidence", "timeline", "causal-chain", "debate", "trade-off", "boundary", "insight", "ecosystem", "question"];
const defaults = { prose:{heading:"New section",body:""}, image:{src:"",alt:"",caption:""}, evidence:{title:"Evidence",metric:"",finding:"",comparison:"",caveat:"",source:""}, timeline:{title:"Timeline",events:[{year:"",title:"",description:"",type:"market"}]}, "causal-chain":{title:"Causal chain",steps:[{label:"",detail:""}]}, debate:{title:"Debate",body:"",visualTitle:"Evidence / Counter-evidence / Interpretation"}, "trade-off":{leftLabel:"",rightLabel:"",leftItems:[""],rightItems:[""]}, boundary:{title:"Boundary",items:[{label:"",detail:""}]}, insight:{title:"Insight",statement:""}, ecosystem:{title:"System map",nodes:[{label:"",title:"",detail:""}]}, question:{question:""} };
const esc = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[character]);
const textLayoutDefaults = { fontSize: 18, maxWidth: 760, xOffset: 0, yOffset: 0, fontWeight: 600, lineHeight: 1.35, align: "left" };
const heroLayoutDefaults = { fontSize: 74, maxWidth: 900, xOffset: 0, yOffset: 0, fontWeight: 600, lineHeight: 1.04, align: "left" };
const imageLayoutDefaults = { width: 100, xOffset: 0, yOffset: 0, align: "left" };
const numeric = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
function ensurePresentation(content) {
  content.meta ??= {}; content.meta.hero ??= {}; content.blocks ??= [];
  content.meta.hero.presentation = { ...heroLayoutDefaults, ...(content.meta.hero.presentation || {}) };
  content.meta.hero.imagePresentation = { ...imageLayoutDefaults, ...(content.meta.hero.imagePresentation || {}) };
  content.blocks.forEach((block) => { block.presentation = { text: { ...textLayoutDefaults, ...(block.presentation?.text || {}) }, image: { ...imageLayoutDefaults, ...(block.presentation?.image || {}) } }; });
}
function positionControls(layout, attribute) {
  return `<div class="studio__position"><strong>Drag position</strong><label>Left / right <input ${attribute}="xOffset" type="range" min="-96" max="96" value="${numeric(layout.xOffset, 0)}"></label><label>Up / down <input ${attribute}="yOffset" type="range" min="-64" max="96" value="${numeric(layout.yOffset, 0)}"></label></div>`;
}
function textLayoutControls(value, attribute, isHero = false) {
  const layout = { ...(isHero ? heroLayoutDefaults : textLayoutDefaults), ...value };
  const sizeMax = isHero ? 96 : 32;
  return `<fieldset class="studio__layout-controls"><legend>${isHero ? "Hero title layout" : "Evidence text layout"}</legend><p class="studio__hint">Desktop only. Mobile keeps Understory’s default reading layout.</p><div class="studio__control-grid"><label>Size <input ${attribute}="fontSize" type="range" min="16" max="${sizeMax}" value="${numeric(layout.fontSize, isHero ? 74 : 18)}"></label><label>Text box width <input ${attribute}="maxWidth" type="range" min="280" max="1100" step="10" value="${numeric(layout.maxWidth, isHero ? 900 : 760)}"></label><label>Weight <select ${attribute}="fontWeight">${[400,500,600,700].map((weight) => `<option value="${weight}" ${Number(layout.fontWeight) === weight ? "selected" : ""}>${weight}</option>`).join("")}</select></label><label>Line height <input ${attribute}="lineHeight" type="range" min="0.95" max="1.8" step="0.05" value="${numeric(layout.lineHeight, isHero ? 1.04 : 1.35)}"></label><label>Alignment <select ${attribute}="align">${["left","center","right"].map((alignment) => `<option value="${alignment}" ${layout.align === alignment ? "selected" : ""}>${alignment}</option>`).join("")}</select></label></div>${positionControls(layout, attribute)}</fieldset>`;
}
function imageLayoutControls(value, attribute, label = "Image layout") {
  const layout = { ...imageLayoutDefaults, ...value };
  return `<fieldset class="studio__layout-controls"><legend>${label}</legend><p class="studio__hint">Desktop only. Mobile keeps the image’s existing responsive layout.</p><div class="studio__control-grid"><label>Image size <input ${attribute}="width" type="range" min="40" max="100" value="${numeric(layout.width, 100)}"></label><label>Alignment <select ${attribute}="align">${["left","center","right"].map((alignment) => `<option value="${alignment}" ${layout.align === alignment ? "selected" : ""}>${alignment}</option>`).join("")}</select></label></div>${positionControls(layout, attribute)}</fieldset>`;
}
const asJson = async (response) => {
  const raw = await response.text();
  try { return raw ? JSON.parse(raw) : {}; } catch { throw new Error("Studio sign-in expired. Please refresh this page and sign in again."); }
};
const request = async (path, options = {}) => {
  const response = await fetch(`${endpoint}${path}`, options);
  if (response.status === 401) { const body = await asJson(response); window.location.assign(body.signInPath); throw new Error("Sign in required"); }
  if (!response.ok) { const body = await asJson(response).catch(() => ({})); throw new Error(body.error || "Request failed"); }
  return response.status === 204 ? null : asJson(response);
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
    const seedResponse = await fetch("/studio-seed.json");
    if (!seedResponse.ok) throw new Error("The initial content template could not be loaded.");
    const seed = await asJson(seedResponse);
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
  const isAmazon = isCase && /amazon/i.test(`${document.slug || ""} ${document.title || ""}`);
  if (isAmazon) { form.hidden = true; openVisualEditor(); return; }
  $("[data-visual-editor]").hidden = true;
  $("[data-case-fields]").hidden = !isCase;
  $("[data-raw-content]").hidden = isCase;
  if (isCase) renderCaseFields(document.content);
  $("[data-publish]").disabled = !document.id;
  $("[data-versions]").disabled = !document.id;
  $("[data-delete]").disabled = !document.id;
}
const field = (label, value, key, multiline = false) => `<label>${label}${multiline ? `<textarea data-block-field="${key}" rows="3">${String(value ?? "")}</textarea>` : `<input data-block-field="${key}" value="${String(value ?? "").replace(/\"/g, "&quot;")}">`}</label>`;
function renderCaseFields(content) {
  ensurePresentation(content);
  document.querySelector("[data-hero=title]").value = state.current.title || "";
  document.querySelector("[data-meta=summary]").value = content.meta.summary || "";
  document.querySelector("[data-meta=centralQuestion]").value = content.meta.centralQuestion || "";
  for (const key of ["image", "alt", "caption"]) document.querySelector(`[data-hero=${key}]`).value = content.meta.hero[key] || "";
  $("[data-hero-layouts]").innerHTML = `${textLayoutControls(content.meta.hero.presentation, "data-hero-layout", true)}${imageLayoutControls(content.meta.hero.imagePresentation, "data-hero-image-layout", "Hero image layout")}`;
  const host = $("[data-blocks]");
  host.innerHTML = content.blocks.map((block, index) => `<article class="studio__block" data-block-index="${index}"><header><strong>${block.type}</strong><label><input type="checkbox" data-visible ${block.visible !== false ? "checked" : ""}> Visible</label><button type="button" data-move="up">Move up</button><button type="button" data-move="down">Move down</button><button type="button" data-duplicate>Duplicate</button><button type="button" data-remove>Delete</button></header><div class="studio__block-fields">${Object.entries(block).filter(([key]) => !["id","type","visible","presentation"].includes(key)).map(([key,value]) => Array.isArray(value) || (value && typeof value === "object") ? `<label>${esc(key)}<textarea data-block-json="${esc(key)}" rows="5">${esc(JSON.stringify(value, null, 2))}</textarea></label>` : field(key, value, key, key === "body" || key === "finding" || key === "comparison" || key === "caveat" || key === "statement")).join("")}</div>${block.type === "evidence" ? textLayoutControls(block.presentation.text, "data-block-text-layout") : ""}${block.type === "image" ? imageLayoutControls(block.presentation.image, "data-block-image-layout") : ""}</article>`).join("");
  host.querySelectorAll("[data-move]").forEach((button) => button.addEventListener("click", () => { const index = Number(button.closest("[data-block-index]").dataset.blockIndex); const destination = button.dataset.move === "up" ? index - 1 : index + 1; if (destination >= 0 && destination < content.blocks.length) { [content.blocks[index], content.blocks[destination]] = [content.blocks[destination], content.blocks[index]]; renderCaseFields(content); } }));
  host.querySelectorAll("[data-duplicate]").forEach((button) => button.addEventListener("click", () => { const index = Number(button.closest("[data-block-index]").dataset.blockIndex); content.blocks.splice(index + 1, 0, { ...structuredClone(content.blocks[index]), id: crypto.randomUUID() }); renderCaseFields(content); }));
  host.querySelectorAll("[data-remove]").forEach((button) => button.addEventListener("click", () => { const index = Number(button.closest("[data-block-index]").dataset.blockIndex); if (window.confirm("Delete this editorial section?")) { content.blocks.splice(index, 1); renderCaseFields(content); } }));
}
function collectCase() {
  const content = state.current.content; ensurePresentation(content);
  state.current.title = document.querySelector("[data-hero=title]").value.trim();
  document.querySelector("[data-editor]").elements.title.value = state.current.title;
  content.meta.summary = document.querySelector("[data-meta=summary]").value;
  content.meta.centralQuestion = document.querySelector("[data-meta=centralQuestion]").value;
  for (const key of ["image", "alt", "caption"]) content.meta.hero[key] = document.querySelector(`[data-hero=${key}]`).value;
  document.querySelectorAll("[data-hero-layout]").forEach((input) => { const key = input.dataset.heroLayout; content.meta.hero.presentation[key] = key === "align" ? input.value : numeric(input.value, content.meta.hero.presentation[key]); });
  document.querySelectorAll("[data-hero-image-layout]").forEach((input) => { const key = input.dataset.heroImageLayout; content.meta.hero.imagePresentation[key] = key === "align" ? input.value : numeric(input.value, content.meta.hero.imagePresentation[key]); });
  document.querySelectorAll("[data-block-index]").forEach((node) => { const block = content.blocks[Number(node.dataset.blockIndex)]; block.visible = node.querySelector("[data-visible]").checked; node.querySelectorAll("[data-block-field]").forEach((input) => { block[input.dataset.blockField] = input.value; }); node.querySelectorAll("[data-block-json]").forEach((input) => { try { block[input.dataset.blockJson] = JSON.parse(input.value); } catch { throw new Error(`${input.dataset.blockJson} must be valid structured data.`); } }); node.querySelectorAll("[data-block-text-layout]").forEach((input) => { const key = input.dataset.blockTextLayout; block.presentation.text[key] = key === "align" ? input.value : numeric(input.value, block.presentation.text[key]); }); node.querySelectorAll("[data-block-image-layout]").forEach((input) => { const key = input.dataset.blockImageLayout; block.presentation.image[key] = key === "align" ? input.value : numeric(input.value, block.presentation.image[key]); }); });
  return content;
}
const visual = { selected: null, overlay: null, document: null };
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const visualLabels = { "hero-title": "Hero title", "hero-image": "Hero image", "evidence-text": "Evidence finding", "evidence-image": "Evidence image" };
function visualBlock(id) { return state.current.content.blocks.find((block) => block.id === id); }
function selectedLayout() {
  if (!visual.selected) return null;
  if (visual.selected.kind === "hero-title") return state.current.content.meta.hero.presentation;
  if (visual.selected.kind === "hero-image") return state.current.content.meta.hero.imagePresentation;
  const block = visualBlock(visual.selected.blockId);
  return visual.selected.kind === "evidence-text" ? block?.presentation.text : block?.presentation.image;
}
function selectedElement() {
  const doc = visual.document; if (!doc || !visual.selected) return null;
  if (visual.selected.kind === "hero-title") return doc.querySelector('[data-cms-visual="hero-title"]');
  if (visual.selected.kind === "hero-image") return doc.querySelector('[data-cms-visual="hero-image"]');
  if (visual.selected.kind === "evidence-text") return doc.querySelector(`[data-cms-block-id="${visual.selected.blockId}"] [data-cms-visual="evidence-text"]`);
  return doc.querySelector(`[data-cms-block-id="${visual.selected.blockId}"][data-cms-visual="evidence-image"]`);
}
function applySelectedLayout() {
  const element = selectedElement(); const layout = selectedLayout(); if (!element || !layout) return;
  const image = visual.selected.kind.includes("image");
  element.style.setProperty(image ? "--cms-image-x" : "--cms-text-x", `${layout.xOffset}px`);
  element.style.setProperty(image ? "--cms-image-y" : "--cms-text-y", `${layout.yOffset}px`);
  element.style.setProperty(image ? "--cms-image-align" : "--cms-text-align", layout.align);
  if (image) element.style.setProperty("--cms-image-width", `${layout.width}%`);
  else {
    element.style.setProperty("--cms-text-size", `${layout.fontSize}px`);
    element.style.setProperty("--cms-text-max-width", `${layout.maxWidth}px`);
    element.style.setProperty("--cms-text-weight", layout.fontWeight);
    element.style.setProperty("--cms-text-line-height", layout.lineHeight);
  }
  renderVisualOverlay(); renderInspector();
}
function addVisualStyles(doc) {
  if (doc.getElementById("studio-direct-styles")) return;
  const style = doc.createElement("style"); style.id = "studio-direct-styles";
  style.textContent = `body{padding-bottom:5rem!important}.studio-direct-overlay{position:fixed;z-index:2147483647;pointer-events:none;border:2px solid #355d48;box-shadow:0 0 0 1px #fff}.studio-direct-drag{position:absolute;left:0;right:0;top:-18px;height:16px;background:#355d48;color:#fff;font:600 10px/16px system-ui;text-align:center;letter-spacing:.06em;cursor:move;pointer-events:auto}.studio-direct-handle{position:absolute;width:12px;height:12px;background:#fff;border:2px solid #355d48;pointer-events:auto}.studio-direct-handle.left{left:-7px;top:calc(50% - 6px);cursor:ew-resize}.studio-direct-handle.right{right:-7px;top:calc(50% - 6px);cursor:ew-resize}.studio-direct-handle.nw{left:-7px;top:-7px;cursor:nwse-resize}.studio-direct-handle.ne{right:-7px;top:-7px;cursor:nesw-resize}.studio-direct-handle.sw{left:-7px;bottom:-7px;cursor:nesw-resize}.studio-direct-handle.se{right:-7px;bottom:-7px;cursor:nwse-resize}.studio-direct-editable{outline:0;cursor:text}`;
  doc.head.append(style);
}
function renderVisualOverlay() {
  if (!visual.document || !visual.selected) return;
  const element = selectedElement(); if (!element) return;
  const rect = element.getBoundingClientRect();
  let overlay = visual.overlay;
  if (!overlay) { overlay = visual.document.createElement("div"); overlay.className = "studio-direct-overlay"; visual.document.body.append(overlay); visual.overlay = overlay; }
  overlay.style.left = `${rect.left}px`; overlay.style.top = `${rect.top}px`; overlay.style.width = `${rect.width}px`; overlay.style.height = `${rect.height}px`;
  const image = visual.selected.kind.includes("image");
  overlay.innerHTML = `<span class="studio-direct-drag">DRAG</span>${image ? ["nw","ne","sw","se"].map((handle) => `<span class="studio-direct-handle ${handle}" data-direct-handle="${handle}"></span>`).join("") : '<span class="studio-direct-handle left" data-direct-handle="left"></span><span class="studio-direct-handle right" data-direct-handle="right"></span>'}`;
  overlay.querySelector(".studio-direct-drag").addEventListener("pointerdown", (event) => beginDirectGesture(event, "move"));
  overlay.querySelectorAll("[data-direct-handle]").forEach((handle) => handle.addEventListener("pointerdown", (event) => beginDirectGesture(event, handle.dataset.directHandle)));
}
function beginDirectGesture(event, mode) {
  event.preventDefault(); event.stopPropagation();
  const element = selectedElement(); const layout = structuredClone(selectedLayout()); if (!element || !layout) return;
  const start = { x: event.clientX, y: event.clientY, rect: element.getBoundingClientRect(), layout };
  const move = (next) => {
    const dx = next.clientX - start.x; const dy = next.clientY - start.y; const target = selectedLayout(); const image = visual.selected.kind.includes("image");
    if (mode === "move") { target.xOffset = clamp(start.layout.xOffset + dx, -96, 96); target.yOffset = clamp(start.layout.yOffset + dy, -64, 96); }
    else if (image) { const horizontal = mode.includes("w") ? -dx : dx; const vertical = mode.includes("n") ? -dy : dy; const delta = Math.abs(horizontal) >= Math.abs(vertical) ? horizontal : vertical; target.width = clamp(start.layout.width + (delta / Math.max(start.rect.width, 1)) * start.layout.width, 40, 100); if (mode.includes("w")) target.xOffset = clamp(start.layout.xOffset + dx, -96, 96); if (mode.includes("n")) target.yOffset = clamp(start.layout.yOffset + dy, -64, 96); }
    else { const horizontal = mode === "left" ? -dx : dx; target.maxWidth = clamp(start.layout.maxWidth + horizontal, 280, 1100); if (mode === "left") target.xOffset = clamp(start.layout.xOffset + dx, -96, 96); }
    applySelectedLayout();
  };
  const end = () => { visual.document.defaultView.removeEventListener("pointermove", move); visual.document.defaultView.removeEventListener("pointerup", end); };
  visual.document.defaultView.addEventListener("pointermove", move); visual.document.defaultView.addEventListener("pointerup", end, { once: true });
}
function renderInspector() {
  const host = $("[data-visual-inspector]"); const layout = selectedLayout();
  if (!visual.selected || !layout) { host.innerHTML = "<p>Select a title, evidence finding, or image in the page.</p>"; return; }
  const image = visual.selected.kind.includes("image");
  host.innerHTML = `<p class="studio__inspector-label">${visualLabels[visual.selected.kind]}</p>${image ? `<label>Size <input data-inspect="width" type="number" min="40" max="100" value="${layout.width}"></label>` : `<label>Font size <input data-inspect="fontSize" type="number" min="16" max="96" value="${layout.fontSize}"></label><label>Font weight <select data-inspect="fontWeight">${[400,500,600,700].map((weight) => `<option ${layout.fontWeight === weight ? "selected" : ""}>${weight}</option>`).join("")}</select></label><label>Line height <input data-inspect="lineHeight" type="number" min="0.95" max="1.8" step=".05" value="${layout.lineHeight}"></label>`}<label>Alignment <select data-inspect="align">${["left","center","right"].map((alignment) => `<option ${layout.align === alignment ? "selected" : ""}>${alignment}</option>`).join("")}</select></label><p class="studio__hint">Move and resize on the canvas. These fields are only for precise finishing.</p>`;
  host.querySelectorAll("[data-inspect]").forEach((input) => input.addEventListener("input", () => { const key = input.dataset.inspect; layout[key] = key === "align" ? input.value : numeric(input.value, layout[key]); applySelectedLayout(); }));
}
function selectVisual(kind, blockId) { visual.selected = { kind, blockId }; renderVisualOverlay(); renderInspector(); }
function bindVisualCanvas() {
  const frame = $("[data-visual-frame]"); const doc = frame.contentDocument; if (!doc) return;
  visual.document = doc; visual.overlay?.remove(); visual.overlay = null; addVisualStyles(doc);
  const title = doc.querySelector('[data-cms-visual="hero-title"]');
  if (title) { title.contentEditable = "true"; title.classList.add("studio-direct-editable"); title.addEventListener("focus", () => selectVisual("hero-title")); title.addEventListener("input", () => { state.current.title = title.textContent.trim(); }); }
  const hero = doc.querySelector('[data-cms-visual="hero-image"]'); if (hero) hero.addEventListener("click", () => selectVisual("hero-image"));
  doc.querySelectorAll('[data-cms-visual="evidence-text"]').forEach((node) => { const blockId = node.closest("[data-cms-block-id]")?.dataset.cmsBlockId; node.contentEditable = "true"; node.classList.add("studio-direct-editable"); node.addEventListener("focus", () => selectVisual("evidence-text", blockId)); node.addEventListener("input", () => { const block = visualBlock(blockId); if (block) block.finding = node.innerText; }); });
  doc.querySelectorAll('[data-cms-visual="evidence-image"]').forEach((node) => node.addEventListener("click", () => selectVisual("evidence-image", node.dataset.cmsBlockId)));
  doc.defaultView.addEventListener("scroll", renderVisualOverlay); doc.defaultView.addEventListener("resize", renderVisualOverlay);
}
function renderVisualNavigator() {
  const host = $("[data-visual-navigator]"); const blocks = state.current.content.blocks;
  host.innerHTML = `<p>Sections</p><button data-visual-select="hero-title">Hero title</button><button data-visual-select="hero-image">Hero image</button>${blocks.map((block, index) => `<div class="studio__nav-block"><button data-visual-select="${block.type === "evidence" ? "evidence-text" : block.type === "image" ? "evidence-image" : ""}" data-visual-block="${block.id}">${esc(block.type)}</button><label><input type="checkbox" data-visual-visible="${block.id}" ${block.visible !== false ? "checked" : ""}>Visible</label><button data-visual-move="up" data-visual-index="${index}">↑</button><button data-visual-move="down" data-visual-index="${index}">↓</button></div>`).join("")}`;
  host.querySelectorAll("[data-visual-select]").forEach((button) => button.addEventListener("click", () => button.dataset.visualSelect && selectVisual(button.dataset.visualSelect, button.dataset.visualBlock)));
  host.querySelectorAll("[data-visual-visible]").forEach((input) => input.addEventListener("change", () => { const block = visualBlock(input.dataset.visualVisible); if (block) block.visible = input.checked; }));
  host.querySelectorAll("[data-visual-move]").forEach((button) => button.addEventListener("click", () => { const index = Number(button.dataset.visualIndex); const next = button.dataset.visualMove === "up" ? index - 1 : index + 1; if (next >= 0 && next < blocks.length) { [blocks[index], blocks[next]] = [blocks[next], blocks[index]]; renderVisualNavigator(); notice("Section order changed. Save draft to update the canvas."); } }));
}
function reloadVisualCanvas() { const frame = $("[data-visual-frame]"); visual.selected = null; visual.document = null; visual.overlay?.remove(); visual.overlay = null; frame.src = `/studio/preview/amazon-convenience-market-power/?studio=${Date.now()}`; }
function openVisualEditor() { ensurePresentation(state.current.content); $("[data-visual-editor]").hidden = false; $("[data-documents]").hidden = true; renderVisualNavigator(); reloadVisualCanvas(); }
function visualDocumentValue() { return { kind: state.current.kind, slug: state.current.slug, locale: state.current.locale, title: state.current.title, status: state.current.status, content: state.current.content }; }
async function saveVisual(quiet = false) { const data = await request(`/documents/${state.current.id}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(visualDocumentValue()) }); state.current = data.document; await refresh(); renderVisualNavigator(); reloadVisualCanvas(); if (!quiet) notice("Draft saved. The public case has not changed."); return data.document; }
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
$("[data-visual-frame]").addEventListener("load", () => { bindVisualCanvas(); window.setTimeout(bindVisualCanvas, 600); });
$("[data-visual-save]").addEventListener("click", () => saveVisual().catch((error) => notice(error.message)));
$("[data-visual-preview]").addEventListener("click", async () => { try { await saveVisual(true); window.open("/studio/preview/amazon-convenience-market-power/", "_blank", "noopener"); } catch (error) { notice(error.message); } });
$("[data-visual-publish]").addEventListener("click", async () => { try { await saveVisual(true); const saved = await request(`/documents/${state.current.id}/publish`, { method: "POST" }); state.current = saved.document; await refresh(); notice(`Published version ${saved.publication.version}. The public case is updated.`); } catch (error) { notice(error.message); } });
$("[data-visual-close]").addEventListener("click", () => { $("[data-visual-editor]").hidden = true; $("[data-documents]").hidden = false; visual.overlay?.remove(); visual.overlay = null; });
(async () => { try { const session = await request("/session"); $("[data-identity]").textContent = session.email; await refresh(); } catch (error) { notice(error.message); } })();
