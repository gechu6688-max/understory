export const BLOCK_TYPES = ["prose", "image", "evidence", "timeline", "causal-chain", "debate", "trade-off", "boundary", "insight", "ecosystem", "question"];

const text = (value) => typeof value === "string" && value.trim().length > 0;
const list = (value) => Array.isArray(value);
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
  next.blocks = next.blocks.map((block) => ({ id: block.id || crypto.randomUUID(), visible: block.visible !== false, ...block }));
  return next;
}

export function validateCase(content) {
  if (!content || typeof content !== "object") return "Case content must be an object.";
  if (!content.meta || !text(content.meta.summary) || !text(content.meta.centralQuestion)) return "Case metadata requires a summary and central question.";
  if (!content.meta.hero || !text(content.meta.hero.image) || !text(content.meta.hero.alt)) return "Case Hero requires an image and alt text.";
  if (!Array.isArray(content.blocks)) return "Case content requires an ordered blocks array.";
  for (const block of content.blocks) {
    if (!block || !text(block.id) || typeof block.visible !== "boolean" || !BLOCK_TYPES.includes(block.type)) return "Every block needs an id, a supported type, and visibility.";
    if (!blockRules[block.type](block)) return `The ${block.type} block has incomplete required fields.`;
  }
  return null;
}

export function validateDocument(input) {
  if (!input || !["page", "case", "site"].includes(input.kind) || !text(input.slug) || !text(input.title) || !input.content || typeof input.content !== "object") return "A document needs a kind, slug, title, and structured content.";
  if (input.kind === "case") return validateCase(input.content);
  return null;
}
