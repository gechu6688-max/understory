import type { CaseEntry } from "./cases";
import { toSlug } from "./cases";
import type { Locale } from "./siteCopy";

export type ConceptStatus = "draft" | "published";

export interface ConceptRecord {
  slug: string;
  title: Record<Locale, string>;
  shortDefinition: Record<Locale, string>;
  keyQuestion: Record<Locale, string>;
  featured?: boolean;
  featuredOrder?: number;
  relatedCaseIds?: string[];
  image?: { src: string; alt: Record<Locale, string>; caption: Record<Locale, string>; credit: string };
  status: ConceptStatus;
}

// This is the editorial registry for concepts. Add a new published concept here,
// then attach its slug through `conceptIds` on a case. The relationship is derived
// at build time, so a concept can belong to any number of cases.
export const conceptRegistry: ConceptRecord[] = [
  {
    slug: "competitive-constraint",
    title: { en: "Competitive Constraint", zh: "竞争约束" },
    shortDefinition: {
      en: "The discipline that real alternatives place on a firm's ability to raise prices, reduce quality, or narrow choice.",
      zh: "当消费者仍有真正可用的替代选择时，企业就很难随意提高价格、降低质量，或收窄选择。",
    },
    keyQuestion: { en: "Which alternatives still keep a firm's choices in check?", zh: "眼下仍然能约束这家企业的替代选择有哪些？" },
    featured: true,
    featuredOrder: 1,
    image: {
      src: "https://images.unsplash.com/photo-1785411007575-3f85e71a2adf?auto=format&fit=crop&w=1800&q=85",
      alt: { en: "Multiple businesses listed together on a glass directory", zh: "玻璃目录牌上并列的多个商家选项" },
      caption: { en: "Alternatives matter only when they are visible and reachable in practice.", zh: "替代选择只有在真实可见、可达时，才会形成竞争压力。" },
      credit: "Unsplash · Heng Chiu · wQUJzhhJXuk",
    },
    status: "published",
  },
  {
    slug: "pricing-power",
    title: { en: "Pricing Power", zh: "定价能力" },
    shortDefinition: {
      en: "A firm's ability to sustain higher prices without losing enough demand to make the increase unprofitable.",
      zh: "企业在不流失过多需求的情况下，持续维持更高价格的能力。",
    },
    keyQuestion: { en: "What gives a firm room to raise or hold price?", zh: "企业为什么有能力提高或维持价格？" },
    featured: true,
    featuredOrder: 2,
    image: {
      src: "https://images.unsplash.com/photo-1750262727446-759032bf283f?auto=format&fit=crop&w=1800&q=85",
      alt: { en: "A payment terminal on a retail counter", zh: "零售柜台上的支付终端" },
      caption: { en: "Demand that remains after terms change creates room to act.", zh: "即使价格或条件变化，需求仍然留存，企业才会拥有更大的行动空间。" },
      credit: "Unsplash · SumUp · 5RVD3VVNWeI",
    },
    status: "published",
  },
  {
    slug: "switching-costs",
    title: { en: "Switching Costs", zh: "转换成本" },
    shortDefinition: {
      en: "The friction that makes moving from one option to another harder than it first appears.",
      zh: "让消费者、商家或用户从一个选择转向另一个选择时，比想象中更难的摩擦。",
    },
    keyQuestion: { en: "What makes leaving harder than arriving?", zh: "为什么离开一个选择，会比进入它更难？" },
    featured: true,
    featuredOrder: 3,
    image: {
      src: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1500&q=85",
      alt: { en: "Rows of goods within fulfillment infrastructure", zh: "履约基础设施中的成排货物" },
      caption: { en: "Process, data, and infrastructure can turn a choice into a difficult move.", zh: "流程、数据与基础设施，会让离开变成一场迁移。" },
      credit: "Unsplash · photo-1586528116311-ad8dd3c8310d",
    },
    status: "published",
  },
];

export type PublishedConcept = ConceptRecord & { cases: CaseEntry[] };

const conceptIdsFor = (caseEntry: CaseEntry) =>
  caseEntry.data.conceptIds?.length
    ? caseEntry.data.conceptIds
    : caseEntry.data.concepts.map(toSlug);

export const getPublishedConcepts = (cases: CaseEntry[]): PublishedConcept[] =>
  conceptRegistry
    .filter((concept) => concept.status === "published")
    .map((concept) => ({
      ...concept,
      cases: cases.filter((caseEntry) => conceptIdsFor(caseEntry).includes(concept.slug) || concept.relatedCaseIds?.includes(caseEntry.id)),
    }));

export const getFeaturedConcepts = (cases: CaseEntry[]) =>
  getPublishedConcepts(cases)
    .filter((concept) => concept.featured)
    .sort((a, b) => (a.featuredOrder ?? Number.MAX_SAFE_INTEGER) - (b.featuredOrder ?? Number.MAX_SAFE_INTEGER));

export const getConceptBySlug = (cases: CaseEntry[], slug: string) =>
  getPublishedConcepts(cases).find((concept) => concept.slug === slug);

export const formatConceptCaseCount = (locale: Locale, count: number) =>
  locale === "zh" ? `${count} 个已发布案例` : count === 1 ? "Used in 1 published case" : `Used in ${count} published cases`;
