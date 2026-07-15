import type { CollectionEntry } from "astro:content";
import { getCollection } from "astro:content";
import type { Locale } from "./siteCopy";

export type CaseEntry = CollectionEntry<"cases">;

export const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);

export const toSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const sortCasesByDate = (cases: CaseEntry[]) =>
  [...cases].sort((a, b) => b.data.publishedDate.valueOf() - a.data.publishedDate.valueOf());

export const getPublishedCases = async () =>
  sortCasesByDate(await getCollection("cases", ({ data }) => data.status === "published"));

export const getPreviewCases = async () =>
  sortCasesByDate(await getCollection("cases", ({ data }) => data.status !== "published"));

export const getTaxonomyItems = (cases: CaseEntry[], field: "topics" | "concepts") =>
  Array.from(
    cases.reduce((items, caseEntry) => {
      for (const name of caseEntry.data[field]) {
        const slug = toSlug(name);
        const existing = items.get(slug);

        if (existing) {
          existing.cases.push(caseEntry);
        } else {
          items.set(slug, { name, slug, cases: [caseEntry] });
        }
      }

      return items;
    }, new Map<string, { name: string; slug: string; cases: CaseEntry[] }>()),
  )
    .map(([, item]) => item)
    .sort((a, b) => a.name.localeCompare(b.name));

export const getCaseDisplayData = (caseEntry: CaseEntry, locale: Locale) => {
  const localized = locale === "zh" ? caseEntry.data.localized?.zh : undefined;

  return {
    ...caseEntry.data,
    ...localized,
    entities: localized?.entities ?? caseEntry.data.entities,
    topics: localized?.topics ?? caseEntry.data.topics,
    concepts: localized?.concepts ?? caseEntry.data.concepts,
  };
};

export const formatCaseType = (caseType: CaseEntry["data"]["caseType"], locale: Locale) => {
  if (locale === "zh") {
    const zhLabels: Record<CaseEntry["data"]["caseType"], string> = {
      company: "公司",
      industry: "行业",
      concept: "概念",
      event: "事件",
      strategy: "策略",
    };

    return zhLabels[caseType];
  }

  return caseType;
};

export const formatCaseStatus = (status: CaseEntry["data"]["status"], locale: Locale) => {
  if (locale === "zh") {
    const zhLabels: Record<CaseEntry["data"]["status"], string> = {
      draft: "草稿",
      review: "审核中",
      published: "已发布",
      archived: "已归档",
    };

    return zhLabels[status];
  }

  return status;
};
