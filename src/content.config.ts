import { defineCollection, reference } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const editorialStatuses = ["draft", "review", "published", "archived"] as const;
const caseTypes = ["company", "industry", "concept", "event", "strategy"] as const;
const sourceTypes = [
  "company-filing",
  "company-report",
  "official-announcement",
  "regulatory-source",
  "academic-paper",
  "news-article",
  "market-research",
  "book",
  "dataset",
  "interview",
  "other",
] as const;

const sourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  publisher: z.string(),
  url: z.url().optional(),
  publicationDate: z.coerce.date().optional(),
  accessDate: z.coerce.date().optional(),
  sourceType: z.enum(sourceTypes),
  relevanceNote: z.string(),
  relevanceNoteZh: z.string().optional(),
});

const localizedCaseSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  summary: z.string().optional(),
  centralQuestion: z.string().optional(),
  quickThesis: z.string().optional(),
  entities: z.array(z.string()).optional(),
  topics: z.array(z.string()).optional(),
  concepts: z.array(z.string()).optional(),
  counterargumentSummary: z.string().optional(),
  whatWouldChangeMyMind: z.string().optional(),
});

const cases = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/cases" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    centralQuestion: z.string(),
    quickThesis: z.string(),
    publishedDate: z.coerce.date(),
    author: reference("authors"),
    status: z.enum(editorialStatuses),
    entities: z.array(z.string()).min(1),
    topics: z.array(z.string()).min(1),
    concepts: z.array(z.string()).min(1),
    caseType: z.enum(caseTypes),
    sources: z.array(sourceSchema).min(1),
    subtitle: z.string().optional(),
    heroImage: z.string().optional(),
    updatedDate: z.coerce.date().optional(),
    featured: z.boolean().optional(),
    relatedCases: z.array(z.string()).optional(),
    counterargumentSummary: z.string().optional(),
    whatWouldChangeMyMind: z.string().optional(),
    localized: z
      .object({
        zh: localizedCaseSchema.optional(),
      })
      .optional(),
  }),
});

const authors = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/authors" }),
  schema: z.object({
    name: z.string(),
    role: z.string().optional(),
    shortBio: z.string().optional(),
    profileImage: z.string().optional(),
  }),
});

export const collections = { cases, authors };
