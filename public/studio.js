const $ = (selector) => document.querySelector(selector);
const endpoint = "/api/studio";
const state = { documents: [], current: null };
const blank = (kind) => ({ kind, slug: "", locale: "en", title: "", status: "draft", content: kind === "case" ? { blocks: [{ type: "prose", heading: "Opening", body: "" }] } : { fields: {} } });
const types = ["prose", "image", "evidence", "timeline", "causal-chain", "debate", "trade-off", "boundary", "insight", "ecosystem", "question"];
const defaults = { prose:{heading:"New section",body:""}, image:{src:"",alt:"",caption:""}, evidence:{title:"Evidence",metric:"",finding:"",comparison:"",caveat:"",source:""}, timeline:{title:"Timeline",events:[{year:"",title:"",description:"",type:"market"}]}, "causal-chain":{title:"Causal chain",steps:[{label:"",detail:""}]}, debate:{title:"Debate",body:"",visualTitle:"Evidence / Counter-evidence / Interpretation"}, "trade-off":{leftLabel:"",rightLabel:"",leftItems:[""],rightItems:[""]}, boundary:{title:"Boundary",items:[{label:"",detail:""}]}, insight:{title:"Insight",statement:""}, ecosystem:{title:"System map",nodes:[{label:"",title:"",detail:""}]}, question:{question:""} };
const esc = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[character]);
const textLayoutDefaults = { fontSize: 18, maxWidth: 760, xOffset: 0, yOffset: 0, fontWeight: 600, lineHeight: 1.35, align: "left", fontFamily: "sans", color: "ink" };
const heroLayoutDefaults = { fontSize: 74, maxWidth: 900, xOffset: 0, yOffset: 0, fontWeight: 600, lineHeight: 1.04, align: "left", fontFamily: "display", color: "ink" };
const imageLayoutDefaults = { width: 100, xOffset: 0, yOffset: 0, align: "left" };
const numeric = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
function ensurePresentation(content) {
  content.meta ??= {}; content.meta.hero ??= {}; content.blocks ??= [];
  content.meta.hero.presentation = { ...heroLayoutDefaults, ...(content.meta.hero.presentation || {}) };
  content.meta.hero.subtitlePresentation = { ...textLayoutDefaults, fontSize: 22, maxWidth: 720, fontWeight: 400, ...(content.meta.hero.subtitlePresentation || {}) };
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
const visual = { selected: null };
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const visualLabels = { "hero-title": "Hero title", "hero-subtitle": "Hero summary", "hero-image": "Hero image", "evidence-text": "Evidence finding", "evidence-image": "Evidence image" };
const visualBlock = (id) => state.current.content.blocks.find((block) => block.id === id);
function selectedLayout() { if (!visual.selected) return null; if (visual.selected.kind === "hero-title") return state.current.content.meta.hero.presentation; if (visual.selected.kind === "hero-subtitle") return state.current.content.meta.hero.subtitlePresentation; if (visual.selected.kind === "hero-image") return state.current.content.meta.hero.imagePresentation; const block = visualBlock(visual.selected.blockId); return visual.selected.kind === "evidence-text" ? block?.presentation.text : block?.presentation.image; }
function layoutStyle(layout, image = false) { const family = layout.fontFamily === "display" ? '"Instrument Serif",Georgia,serif' : '"Source Sans 3",system-ui,sans-serif'; const color = ({ ink:"#18201d", moss:"#355d48", clay:"#9f3e2d", paper:"#f5f4ef" })[layout.color] || "#18201d"; return image ? `width:${layout.width}%;--studio-x:${layout.xOffset}px;--studio-y:${layout.yOffset}px` : `width:min(${layout.maxWidth}px,100%);--studio-x:${layout.xOffset}px;--studio-y:${layout.yOffset}px;--studio-size:${layout.fontSize}px;--studio-weight:${layout.fontWeight};--studio-line:${layout.lineHeight};--studio-align:${layout.align};--studio-family:${family};--studio-color:${color}`; }
function handles(image) { return image ? ["nw","ne","sw","se"].map((x) => `<i class="studio-object__handle studio-object__handle--${x}" data-canvas-handle="${x}"></i>`).join("") : '<i class="studio-object__handle studio-object__handle--left" data-canvas-handle="left"></i><i class="studio-object__handle studio-object__handle--right" data-canvas-handle="right"></i>'; }
function object(kind, blockId, inner, layout, image = false, className = "") { const selected = visual.selected?.kind === kind && visual.selected?.blockId === blockId; return `<div class="studio-object ${className} ${selected ? "is-selected" : ""}" data-canvas-object="${kind}" ${blockId ? `data-canvas-block="${blockId}"` : ""} style="${layoutStyle(layout, image)}">${inner}${handles(image)}</div>`; }
function renderVisualCanvas() {
  const host = $("[data-visual-canvas]"); const content = state.current.content; const hero = content.meta.hero; const evidence = content.blocks.find((block) => block.type === "evidence"); const image = content.blocks.find((block) => block.type === "image");
  host.innerHTML = `<div data-stage-toolbar></div><article class="studio-artboard"><p class="studio-artboard__kicker">AMAZON · CASE 001 · EDITING DRAFT</p>${object("hero-title", "", `<h1 class="studio-stage-title" contenteditable="true" data-canvas-text="title">${esc(state.current.title)}</h1>`, hero.presentation, false)}${object("hero-subtitle", "", `<p class="studio-stage-summary" contenteditable="true" data-canvas-text="summary">${esc(content.meta.summary)}</p>`, hero.subtitlePresentation, false)}${object("hero-image", "", `<figure class="studio-stage-image"><img src="${esc(hero.image)}" alt="${esc(hero.alt)}"><figcaption>${esc(hero.caption || "Case image")}</figcaption></figure>`, hero.imagePresentation, true)}${evidence ? object("evidence-text", evidence.id, `<section class="studio-stage-evidence"><small>EVIDENCE HIGHLIGHT · ${esc(evidence.title)}</small><p contenteditable="true" data-canvas-text="finding">${esc(evidence.finding)}</p></section>`, evidence.presentation.text, false) : ""}${image ? object("evidence-image", image.id, `<figure class="studio-stage-evidence-image"><img src="${esc(image.src)}" alt="${esc(image.alt)}"><figcaption>${esc(image.caption || image.label || "Evidence image")}</figcaption></figure>`, image.presentation.image, true) : ""}</article>`;
  bindCanvasObjects(); renderStageToolbar(); renderInspector();
}
function applySelectedToCanvas() { const item = $("[data-visual-canvas]").querySelector(".is-selected"); const layout = selectedLayout(); if (!item || !layout) return; item.setAttribute("style", layoutStyle(layout, visual.selected.kind.includes("image"))); renderInspector(); }
function renderStageToolbar() { const host = $("[data-stage-toolbar]"); const layout = selectedLayout(); if (!layout || visual.selected.kind.includes("image")) { host.hidden = true; host.innerHTML = ""; return; } host.hidden = false; host.innerHTML = `<div class="studio-stage-toolbar"><select data-stage-style="fontFamily"><option value="display" ${layout.fontFamily === "display" ? "selected" : ""}>Display</option><option value="sans" ${layout.fontFamily === "sans" ? "selected" : ""}>Sans</option></select><input data-stage-style="fontSize" aria-label="Font size" type="number" min="16" max="96" value="${layout.fontSize}"><select data-stage-style="fontWeight">${[400,500,600,700].map((x) => `<option value="${x}" ${layout.fontWeight === x ? "selected" : ""}>${x}</option>`).join("")}</select><select data-stage-style="color">${["ink","moss","clay","paper"].map((x) => `<option value="${x}" ${layout.color === x ? "selected" : ""}>${x}</option>`).join("")}</select><input data-stage-style="lineHeight" aria-label="Line height" type="number" min=".95" max="1.8" step=".05" value="${layout.lineHeight}"><select data-stage-style="align">${["left","center","right"].map((x) => `<option value="${x}" ${layout.align === x ? "selected" : ""}>${x}</option>`).join("")}</select></div>`; host.querySelectorAll("[data-stage-style]").forEach((input) => input.addEventListener("input", () => { const key = input.dataset.stageStyle; layout[key] = ["fontFamily","color","align"].includes(key) ? input.value : numeric(input.value, layout[key]); applySelectedToCanvas(); })); }
function selectVisual(kind, blockId) { visual.selected = { kind, blockId }; $("[data-visual-canvas]").querySelectorAll("[data-canvas-object]").forEach((node) => node.classList.toggle("is-selected", node.dataset.canvasObject === kind && (node.dataset.canvasBlock || "") === (blockId || ""))); renderStageToolbar(); renderInspector(); }
function startGesture(event, node, mode) { event.preventDefault(); event.stopPropagation(); const layout = selectedLayout(); if (!layout) return; const initial = structuredClone(layout); const rect = node.getBoundingClientRect(); node.setPointerCapture?.(event.pointerId); const move = (next) => { const dx = next.clientX - event.clientX; const dy = next.clientY - event.clientY; const image = visual.selected.kind.includes("image"); if (mode === "move") { layout.xOffset = clamp(initial.xOffset + dx, -96, 96); layout.yOffset = clamp(initial.yOffset + dy, -64, 96); } else if (image) { const delta = Math.abs(dx) > Math.abs(dy) ? (mode.includes("w") ? -dx : dx) : (mode.includes("n") ? -dy : dy); layout.width = clamp(initial.width + delta / Math.max(rect.width, 1) * initial.width, 40, 100); } else { layout.maxWidth = clamp(initial.maxWidth + (mode === "left" ? -dx : dx), 280, 1100); if (mode === "left") layout.xOffset = clamp(initial.xOffset + dx, -96, 96); } applySelectedToCanvas(); }; const end = () => { node.removeEventListener("pointermove", move); node.removeEventListener("pointerup", end); }; node.addEventListener("pointermove", move); node.addEventListener("pointerup", end, { once:true }); }
function bindCanvasObjects() { const host = $("[data-visual-canvas]"); host.querySelectorAll("[data-canvas-object]").forEach((node) => { const kind = node.dataset.canvasObject; const id = node.dataset.canvasBlock || undefined; node.addEventListener("pointerdown", (event) => { if (event.target.closest("[data-canvas-handle]")) return; selectVisual(kind, id); startGesture(event, node, "move"); }); node.addEventListener("dblclick", () => node.querySelector("[contenteditable]")?.focus()); node.querySelectorAll("[data-canvas-handle]").forEach((handle) => handle.addEventListener("pointerdown", (event) => { selectVisual(kind, id); startGesture(event, node, handle.dataset.canvasHandle); })); }); host.querySelectorAll("[data-canvas-text]").forEach((node) => node.addEventListener("input", () => { if (node.dataset.canvasText === "title") state.current.title = node.innerText.trim(); else if (node.dataset.canvasText === "summary") state.current.content.meta.summary = node.innerText; else { const block = visualBlock(node.closest("[data-canvas-object]").dataset.canvasBlock); if (block) block.finding = node.innerText; } })); }
function renderInspector() { const host = $("[data-visual-inspector]"); const layout = selectedLayout(); if (!layout) { host.innerHTML = "<p>Select an object on the canvas.</p>"; return; } const image = visual.selected.kind.includes("image"); host.innerHTML = `<p class="studio__inspector-label">${visualLabels[visual.selected.kind]}</p><p class="studio__hint">Drag on canvas first. Use this only for a precise value.</p><label>${image ? "Size" : "Font size"}<input data-inspect="${image ? "width" : "fontSize"}" type="number" min="${image ? 40 : 16}" max="${image ? 100 : 96}" value="${image ? layout.width : layout.fontSize}"></label>`; host.querySelector("[data-inspect]").addEventListener("input", (event) => { layout[event.target.dataset.inspect] = numeric(event.target.value, layout[event.target.dataset.inspect]); applySelectedToCanvas(); }); }
function renderVisualNavigator() { const host = $("[data-visual-navigator]"); const blocks = state.current.content.blocks; host.innerHTML = `<p>Sections</p><button data-visual-select="hero-title">Hero title</button><button data-visual-select="hero-subtitle">Hero summary</button><button data-visual-select="hero-image">Hero image</button>${blocks.map((block,index) => `<div class="studio__nav-block"><button data-visual-select="${block.type === "evidence" ? "evidence-text" : block.type === "image" ? "evidence-image" : ""}" data-visual-block="${block.id}">${esc(block.type)}</button><label><input type="checkbox" data-visual-visible="${block.id}" ${block.visible !== false ? "checked" : ""}>Visible</label><button data-visual-move="up" data-visual-index="${index}">↑</button><button data-visual-move="down" data-visual-index="${index}">↓</button></div>`).join("")}`; host.querySelectorAll("[data-visual-select]").forEach((button) => button.addEventListener("click", () => button.dataset.visualSelect && selectVisual(button.dataset.visualSelect, button.dataset.visualBlock))); host.querySelectorAll("[data-visual-visible]").forEach((input) => input.addEventListener("change", () => { const block = visualBlock(input.dataset.visualVisible); if (block) block.visible = input.checked; })); host.querySelectorAll("[data-visual-move]").forEach((button) => button.addEventListener("click", () => { const index = Number(button.dataset.visualIndex); const next = button.dataset.visualMove === "up" ? index - 1 : index + 1; if (next >= 0 && next < blocks.length) { [blocks[index],blocks[next]] = [blocks[next],blocks[index]]; renderVisualNavigator(); renderVisualCanvas(); notice("Section order changed. Save draft to update the public case."); } })); }
function reloadVisualCanvas() { visual.selected = null; renderVisualCanvas(); }
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
$("[data-visual-save]").addEventListener("click", () => saveVisual().catch((error) => notice(error.message)));
$("[data-visual-preview]").addEventListener("click", async () => { try { await saveVisual(true); window.open("/studio/preview/amazon-convenience-market-power/", "_blank", "noopener"); } catch (error) { notice(error.message); } });
$("[data-visual-publish]").addEventListener("click", async () => { try { await saveVisual(true); const saved = await request(`/documents/${state.current.id}/publish`, { method: "POST" }); state.current = saved.document; await refresh(); notice(`Published version ${saved.publication.version}. The public case is updated.`); } catch (error) { notice(error.message); } });
$("[data-visual-close]").addEventListener("click", () => { $("[data-visual-editor]").hidden = true; $("[data-documents]").hidden = false; visual.selected = null; });
(async () => { try { const session = await request("/session"); $("[data-identity]").textContent = session.email; await refresh(); } catch (error) { notice(error.message); } })();
