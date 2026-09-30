import type { CaseEntry } from "./cases";
import { getCaseDisplayData, getTaxonomyItems, toSlug } from "./cases";
import type { Locale } from "./siteCopy";

type LocalizedText = Record<Locale, string>;

/** Editorial metadata enriches topics already present in published cases. */
const topicEditorial: Record<string, { category: string; categoryLabel: LocalizedText; featured: boolean; featuredOrder: number; shortDescription: LocalizedText; keyQuestion: LocalizedText; image: string; imageAlt: LocalizedText }> = {
  "market-power": { category: "market-structure", categoryLabel: { en: "Market Structure", zh: "市场结构" }, featured: true, featuredOrder: 1, shortDescription: { en: "How firms gain room to influence prices, quality, access, or market rules.", zh: "企业如何获得影响价格、质量、准入或市场规则的行动空间。" }, keyQuestion: { en: "How does a firm gain room to influence the terms of a market?", zh: "企业如何获得影响市场条件的行动空间？" }, image: "https://images.unsplash.com/photo-1555529771-835f59fc5efe?auto=format&fit=crop&w=1400&q=85", imageAlt: { en: "Products and visible prices in a store.", zh: "商店里陈列的商品与可见价格。" } },
  competition: { category: "market-structure", categoryLabel: { en: "Market Structure", zh: "市场结构" }, featured: true, featuredOrder: 2, shortDescription: { en: "How rival pressure shapes prices, choices, innovation, and consumer outcomes.", zh: "竞争压力如何影响价格、选择、创新与消费者结果。" }, keyQuestion: { en: "When do alternatives genuinely constrain a firm’s behaviour?", zh: "替代选择在什么情况下会真正约束企业的行为？" }, image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1400&q=85", imageAlt: { en: "Several competing choices on a grocery shelf.", zh: "超市货架上并列的不同商品选择。" } },
};

const fallbackImage = "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1400&q=85";

export type PublishedTopic = { id: string; slug: string; title: string; shortDescription: string; keyQuestion: string; category: string; categoryLabel: string; featured: boolean; featuredOrder: number; relatedCaseIds: string[]; relatedConceptIds: string[]; image: string; imageAlt: string; status: "published"; published: true; updatedAt: Date };

export const getPublishedTopics = (cases: CaseEntry[], locale: Locale): PublishedTopic[] =>
  getTaxonomyItems(cases, "topics", locale).map((taxonomyItem) => {
    const editorial = topicEditorial[taxonomyItem.slug];
    const caseEntries = taxonomyItem.cases;
    const conceptIds = Array.from(new Set(caseEntries.flatMap((entry) => entry.data.conceptIds ?? entry.data.concepts.map(toSlug))));
    const updatedAt = caseEntries.reduce((latest, entry) => { const current = entry.data.updatedDate ?? entry.data.publishedDate; return current > latest ? current : latest; }, caseEntries[0].data.updatedDate ?? caseEntries[0].data.publishedDate);
    const fallbackQuestion = getCaseDisplayData(caseEntries[0], locale).centralQuestion;
    return { id: taxonomyItem.slug, slug: taxonomyItem.slug, title: taxonomyItem.name, shortDescription: editorial?.shortDescription[locale] ?? fallbackQuestion, keyQuestion: editorial?.keyQuestion[locale] ?? fallbackQuestion, category: editorial?.category ?? "other", categoryLabel: editorial?.categoryLabel[locale] ?? (locale === "zh" ? "其他" : "Other"), featured: editorial?.featured ?? false, featuredOrder: editorial?.featuredOrder ?? Number.MAX_SAFE_INTEGER, relatedCaseIds: caseEntries.map((entry) => entry.id), relatedConceptIds: conceptIds, image: editorial?.image ?? fallbackImage, imageAlt: editorial?.imageAlt[locale] ?? (locale === "zh" ? "城市街道与建筑。" : "A city street and its buildings."), status: "published", published: true, updatedAt };
  }).sort((a, b) => a.featuredOrder - b.featuredOrder || a.title.localeCompare(b.title));

export const getTopicCategories = (topics: PublishedTopic[]) => Array.from(new Map(topics.map((topic) => [topic.category, topic.categoryLabel])).entries()).map(([id, label]) => ({ id, label }));
