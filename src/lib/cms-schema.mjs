export const BLOCK_TYPES = ["prose", "image", "evidence", "timeline", "causal-chain", "debate", "trade-off", "boundary", "insight", "ecosystem", "question"];

const text = (value) => typeof value === "string" && value.trim().length > 0;
const list = (value) => Array.isArray(value);
const number = (value) => typeof value === "number" && Number.isFinite(value);
const between = (value, min, max) => number(value) && value >= min && value <= max;
const ALIGNMENTS = ["left", "center", "right"];
const WEIGHTS = [400, 500, 600, 700];
const FONTS = ["display", "sans"];
const COLORS = ["ink", "moss", "clay", "paper"];

// These are deliberately not arbitrary CSS values. They are the small set of
// desktop refinements the editorial system can safely carry into its renderer.
const textPresentation = (value) => {
  if (!value || typeof value !== "object") return true;
  return (!("fontSize" in value) || between(value.fontSize, 16, 96))
    && (!("maxWidth" in value) || between(value.maxWidth, 280, 1100))
    && (!("xOffset" in value) || between(value.xOffset, -96, 96))
    && (!("yOffset" in value) || between(value.yOffset, -64, 96))
    && (!("fontWeight" in value) || WEIGHTS.includes(value.fontWeight))
    && (!("lineHeight" in value) || between(value.lineHeight, 0.95, 1.8))
    && (!("align" in value) || ALIGNMENTS.includes(value.align))
    && (!("fontFamily" in value) || FONTS.includes(value.fontFamily))
    && (!("color" in value) || COLORS.includes(value.color));
};
const imagePresentation = (value) => {
  if (!value || typeof value !== "object") return true;
  return (!("width" in value) || between(value.width, 40, 100))
    && (!("xOffset" in value) || between(value.xOffset, -96, 96))
    && (!("yOffset" in value) || between(value.yOffset, -64, 96))
    && (!("align" in value) || ALIGNMENTS.includes(value.align));
};
const presentation = (value) => !value || (typeof value === "object" && textPresentation(value.text) && imagePresentation(value.image));
const clamp = (value, min, max, fallback) => number(value) ? Math.max(min, Math.min(max, value)) : fallback;
const normalizeTextPresentation = (value = {}, fallback = {}) => ({
  fontSize: clamp(value.fontSize, 16, 96, fallback.fontSize ?? 18), maxWidth: clamp(value.maxWidth, 280, 1100, fallback.maxWidth ?? 760),
  xOffset: clamp(value.xOffset, -96, 96, fallback.xOffset ?? 0), yOffset: clamp(value.yOffset, -64, 96, fallback.yOffset ?? 0),
  fontWeight: WEIGHTS.includes(value.fontWeight) ? value.fontWeight : (fallback.fontWeight ?? 600),
  lineHeight: clamp(value.lineHeight, 0.95, 1.8, fallback.lineHeight ?? 1.1), align: ALIGNMENTS.includes(value.align) ? value.align : (fallback.align ?? "left"),
  fontFamily: FONTS.includes(value.fontFamily) ? value.fontFamily : (fallback.fontFamily ?? "sans"), color: COLORS.includes(value.color) ? value.color : (fallback.color ?? "ink"),
});
const normalizeImagePresentation = (value = {}) => ({
  width: clamp(value.width, 40, 100, 100), xOffset: clamp(value.xOffset, -96, 96, 0),
  yOffset: clamp(value.yOffset, -64, 96, 0), align: ALIGNMENTS.includes(value.align) ? value.align : "left",
});
const blockRules = {
  prose: (block) => text(block.heading) && text(block.body),
  image: (block) => text(block.src) && text(block.alt),
  evidence: (block) => text(block.title) && text(block.finding) && text(block.comparison) && text(block.caveat) && text(block.source),
  timeline: (block) => text(block.title) && list(block.events) && block.events.every((event) => text(event.year) && text(event.title) && text(event.description) && ["company", "market", "academic", "regulatory", "publication"].includes(event.type)),
  "causal-chain": (block) => text(block.title) && list(block.steps) && block.steps.every((step) => text(step.label) && text(step.detail)),
  debate: (block) => text(block.title) && text(block.body) && text(block.visualTitle),
  "trade-off": (block) => text(block.leftLabel) && text(block.rightLabel) && list(block.leftItems) && list(block.rightItems),
  boundary: (block) => text(block.title) && list(block.items) && block.items.every((item) => text(item.label) && text(item.detail)),
  insight: (block) => text(block.title) && text(block.statement),
  ecosystem: (block) => text(block.title) && list(block.nodes) && block.nodes.every((node) => text(node.label) && text(node.title)),
  question: (block) => text(block.question),
};

export function normalizeCase(content) {
  const next = structuredClone(content);
  next.meta ??= {};
  next.meta.hero ??= {};
  next.blocks ??= [];
  next.meta.hero.presentation = normalizeTextPresentation(next.meta.hero.presentation, { fontSize: 74, maxWidth: 900, xOffset: 0, yOffset: 0, fontWeight: 600, lineHeight: 1.04, align: "left", fontFamily: "display", color: "ink" });
  next.meta.hero.subtitlePresentation = normalizeTextPresentation(next.meta.hero.subtitlePresentation, { fontSize: 22, maxWidth: 720, xOffset: 0, yOffset: 0, fontWeight: 400, lineHeight: 1.35, align: "left", fontFamily: "sans", color: "ink" });
  next.meta.hero.imagePresentation = normalizeImagePresentation(next.meta.hero.imagePresentation);
  next.blocks = next.blocks.map((block) => ({
    id: block.id || crypto.randomUUID(), visible: block.visible !== false, ...block,
    presentation: {
      text: normalizeTextPresentation(block.presentation?.text),
      image: normalizeImagePresentation(block.presentation?.image),
    },
  }));
  return next;
}

export function validateCase(content) {
  if (!content || typeof content !== "object") return "Case content must be an object.";
  if (!content.meta || !text(content.meta.summary) || !text(content.meta.centralQuestion)) return "Case metadata requires a summary and central question.";
  if (!content.meta.hero || !text(content.meta.hero.image) || !text(content.meta.hero.alt)) return "Case Hero requires an image and alt text.";
  if (!textPresentation(content.meta.hero.presentation) || !textPresentation(content.meta.hero.subtitlePresentation) || !imagePresentation(content.meta.hero.imagePresentation)) return "Hero layout values are outside the safe editorial range.";
  if (!Array.isArray(content.blocks)) return "Case content requires an ordered blocks array.";
  for (const block of content.blocks) {
    if (!block || !text(block.id) || typeof block.visible !== "boolean" || !BLOCK_TYPES.includes(block.type)) return "Every block needs an id, a supported type, and visibility.";
    if (!blockRules[block.type](block)) return `The ${block.type} block has incomplete required fields.`;
    if (!presentation(block.presentation)) return `The ${block.type} block has layout values outside the safe editorial range.`;
  }
  return null;
}

export function validateDocument(input) {
  if (!input || !["page", "case", "site"].includes(input.kind) || !text(input.slug) || !text(input.title) || !input.content || typeof input.content !== "object") return "A document needs a kind, slug, title, and structured content.";
  if (input.kind === "case") return validateCase(input.content);
  return null;
}
