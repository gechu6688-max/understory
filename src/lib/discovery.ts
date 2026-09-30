import type { Locale } from "./siteCopy";

export type DiscoveryKind = "market-power" | "competition" | "technology" | "strategy" | "pricing-power" | "switching-costs" | "competitive-constraint";

const normalized: Record<string, DiscoveryKind> = {
  "market-power": "market-power", "市场力量": "market-power",
  competition: "competition", "竞争": "competition",
  technology: "technology", "技术": "technology",
  strategy: "strategy", "策略": "strategy",
  "pricing-power": "pricing-power", "定价权": "pricing-power", "定价能力": "pricing-power",
  "switching-costs": "switching-costs", "转换成本": "switching-costs",
  "competitive-constraint": "competitive-constraint", "竞争约束": "competitive-constraint",
};

export const discoveryKind = (slugOrName: string): DiscoveryKind => normalized[slugOrName.toLowerCase().replace(/\s+/g, "-")] ?? "strategy";

const content: Record<Locale, Record<DiscoveryKind, { framing: string; question: string; signals: string[]; caution: string }>> = {
  en: {
    "market-power": { framing: "The room a firm has to influence prices, access, quality, or market rules.", question: "Where does a firm gain room to make choices others cannot easily resist?", signals: ["Persistent room to change terms", "Dependence across a market relationship", "A meaningful alternative becoming weaker"], caution: "Scale or popularity alone does not establish market power." },
    competition: { framing: "The pressure that keeps a firm's choices answerable to alternatives.", question: "What changes when a meaningful competitive constraint weakens?", signals: ["Rivals that customers can actually use", "Changes after a rival enters or exits", "Differences across comparable markets"], caution: "A price change by itself does not explain why it happened." },
    technology: { framing: "The systems and tools that alter how markets work and what people can do.", question: "Which technical changes are reshaping the choices available to firms and users?", signals: ["New ways to coordinate or deliver", "Changed search, matching, or access", "Dependencies created by an infrastructure"], caution: "New technology is not automatically an advantage or a harm." },
    strategy: { framing: "The choices through which a firm positions itself, makes trade-offs, and pursues advantage.", question: "What choice is a business making, and what does that choice make possible?", signals: ["A stated direction", "A visible trade-off", "Capabilities that support a position"], caution: "A stated strategy is not evidence that it worked." },
    "pricing-power": { framing: "The ability to sustain higher prices without losing enough demand to make the increase unprofitable.", question: "What gives a firm room to raise or hold price?", signals: ["Demand that remains after a price change", "Few credible alternatives", "Value or friction that changes buyer response"], caution: "Higher prices can also reflect costs, quality, mix, or seasonality." },
    "switching-costs": { framing: "The friction that makes moving from one option to another harder than it first appears.", question: "What makes leaving harder than arriving?", signals: ["Time, data, or learning invested", "Operational disruption", "Relationships or complementary services"], caution: "Repeat use does not by itself prove a switching cost." },
    "competitive-constraint": { framing: "The discipline alternatives place on a firm's room to raise prices, reduce quality, or narrow choice.", question: "Which alternatives still keep a firm's choices in check?", signals: ["Comparable rivals", "The ability to switch in practice", "A change in behavior when pressure shifts"], caution: "The presence of competitors does not show that constraint is meaningful." },
  },
  zh: {
    "market-power": { framing: "企业影响价格、进入、质量或市场规则的空间。", question: "一家企业的哪些选择，别人其实很难拒绝？", signals: ["持续改变交易条件的空间", "市场关系中的依赖", "有意义的替代选择变弱"], caution: "规模或受欢迎程度本身，并不能证明市场力量。" },
    competition: { framing: "让企业必须回应替代选择的压力。", question: "当重要的竞争约束减弱时，会发生什么变化？", signals: ["用户真正能够使用的替代者", "竞争者进入或退出后的变化", "可比较市场之间的差异"], caution: "一次价格变化本身，不能解释它为什么发生。" },
    technology: { framing: "改变市场如何运作、人与企业能够做什么的系统和工具。", question: "哪些技术变化正在重塑企业和用户可作出的选择？", signals: ["新的协同或交付方式", "搜索、匹配或进入方式的变化", "基础设施带来的依赖"], caution: "新技术并不天然等于优势或伤害。" },
    strategy: { framing: "企业定位、取舍与追求优势的选择。", question: "企业正在作出什么选择，这个选择又带来了什么可能？", signals: ["明确的方向", "可见的取舍", "支撑定位的能力"], caution: "说出了策略，不等于策略已经奏效。" },
    "pricing-power": { framing: "企业在不流失过多需求的情况下，持续维持更高价格的能力。", question: "什么给了企业提价或维持价格的空间？", signals: ["价格变化后仍然存在的需求", "可信的替代选择很少", "改变买方反应的价值或摩擦"], caution: "更高价格也可能来自成本、质量、组合或季节性。" },
    "switching-costs": { framing: "让人从一种选择转向另一种选择时，比想象中更难的摩擦。", question: "为什么离开往往比开始更难？", signals: ["已经投入的时间、数据或学习", "运营上的中断", "关系或配套服务"], caution: "重复使用本身，不能证明存在转换成本。" },
    "competitive-constraint": { framing: "替代选择对企业涨价、降低质量或缩小选择空间形成的约束。", question: "哪些替代选择仍在约束企业的决策？", signals: ["可比较的竞争者", "实际可行的转向能力", "压力变化后的行为变化"], caution: "有竞争者存在，不等于约束一定有意义。" },
  },
};

export const discoveryContent = (locale: Locale, value: string) => content[locale][discoveryKind(value)];
