# Case Writing Workflow

Use this workflow when starting a serious business case. The goal is clear reasoning, honest evidence, and transparent uncertainty.

## 1. Start A New Case

Create a new `.mdx` file in `src/content/cases/`. Use a short lowercase filename, for example:

```text
amazon-convenience-market-power.mdx
```

Begin with frontmatter, then write the case body below it.

## 2. Frontmatter Guide

Required fields:

- `title`: the case title.
- `summary`: one short paragraph explaining what the case is about.
- `centralQuestion`: the main question the case tries to answer.
- `quickThesis`: the current best answer in one or two sentences.
- `publishedDate`: the date assigned to the case. For drafts, use the draft start date or planned publication date.
- `author`: the author id from `src/content/authors/`, such as `site-owner`.
- `status`: `draft`, `review`, `published`, or `archived`.
- `entities`: companies, organizations, people, or markets discussed.
- `topics`: broad themes such as Strategy, Technology, Consumer Behavior, Competition.
- `concepts`: business ideas such as Market Power, Network Effects, Switching Costs.
- `caseType`: one of `company`, `industry`, `concept`, `event`, or `strategy`.
- `sources`: structured source entries.

Optional fields:

- `subtitle`: a secondary title.
- `heroImage`: an image path, if a later design needs one.
- `updatedDate`: only for meaningful public content revisions.
- `featured`: `true` or `false` for later homepage logic.
- `relatedCases`: future list of related case ids.
- `counterargumentSummary`: short version of the strongest opposing view.
- `whatWouldChangeMyMind`: evidence that would weaken or change the conclusion.

Derived or do not manually enter:

- Reading time, word count, URL, slug, table of contents, and source count should be derived later by the site, not typed into frontmatter.
- Do not use Git timestamps or file modification time as public `updatedDate`.

## 3. Body Structure

Required analytical core:

```mdx
## Problem

## Context

## Evidence

## Analysis

<KeyInsight title="Judgement">
  Your reasoned conclusion.
</KeyInsight>

## Further Questions
```

Optional modules:

- `Competing Explanation`: use when another explanation could fit the same evidence.
- `Counterargument`: use when there is a strong objection to your thesis.
- `Trade-offs`: use when a business benefit also creates a cost or risk.
- `Timeline`: use when sequence matters.
- `Comparison`: use when comparing companies, industries, or strategies.
- `Risks / Uncertainties`: use when evidence is incomplete, indirect, disputed, or outdated.
- `Stakeholder Perspective`: use when customers, workers, sellers, regulators, or investors experience the issue differently.
- `What Would Change My Mind?`: use when you want to be explicit about what evidence would change the conclusion.

Do not force every optional module into every case.

## 4. Evidence vs Analysis Standard

FACT / EVIDENCE:

- Externally verifiable.
- Should be sourced when it is specific, disputed, numerical, legal, or central to the argument.
- Example: "The FTC filed an antitrust complaint against Amazon in September 2023."

ANALYSIS:

- Your interpretation of evidence.
- Should not be written as if it is proven fact.
- Better: "This evidence is consistent with a market-power concern."
- Avoid: "This proves Amazon definitely abused market power."

JUDGEMENT:

- Your reasoned conclusion after weighing evidence, counterarguments, and uncertainty.
- Good judgement can be cautious.
- Example: "The strongest current conclusion is not that convenience is bad, but that convenience may depend on competition remaining strong."

UNCERTAINTY:

- Use when evidence is incomplete, indirect, disputed, old, or only alleged in a legal complaint.
- Example: "This allegation has not been treated here as a court finding."

COUNTERARGUMENT:

- The strongest reasonable competing explanation.
- Example: "Low prices and fast delivery may reflect operational efficiency rather than exclusionary conduct."

## 5. Source Entry Standard

Each source should use this shape:

```yaml
- id: short-source-id
  title: "Exact source title"
  publisher: "Publisher name"
  url: "https://example.com/source"
  publicationDate: 2026-07-09
  accessDate: 2026-07-09
  sourceType: company-filing
  relevanceNote: "Why this source matters for the case."
```

Field rules:

- `id`: short, unique, lowercase if possible.
- `title`: exact title. Do not invent one.
- `publisher`: organization that published it.
- `url`: only include a real URL you checked.
- `publicationDate`: filing, report, article, or publication date. Omit if unknown.
- `accessDate`: recommended for normal web sources; required for dynamic or frequently updated webpages/data pages.
- `sourceType`: use the closest allowed value.
- `relevanceNote`: explain what the source supports and what it does not prove.

Source quality priorities:

1. Official filings.
2. Government or regulatory sources.
3. Academic research.
4. Company reports.
5. Established high-quality journalism.
6. Reputable market research.

Rules:

- Never fabricate URLs.
- Never fabricate citation metadata.
- Never invent publication dates.
- Never create realistic-looking fake references.
- If a field is unknown, omit it if the schema allows.
- Do not treat search-result snippets as sufficient evidence.
- Distinguish primary and secondary sources when useful.

## 6. Editorial Status Workflow

`draft`:

- Incomplete.
- Ideas may change.
- Sources may still be under review.
- Not publicly routed.

`review`:

- Argument mostly complete.
- Source check needed.
- Structure and wording under review.
- Not publicly routed.

`published`:

- Public.
- Required sections complete.
- References reviewed.
- No known placeholders.
- Key claims appropriately sourced.

`archived`:

- Intentionally withdrawn or outdated.
- Not publicly routed.

Publication checklist:

- The central question is clear.
- The quick thesis is cautious and evidence-aware.
- Every important factual claim has a source or is clearly marked for verification.
- Legal allegations are described as allegations unless a court finding is being cited.
- The strongest counterargument is included.
- Uncertainty is named honestly.
- No placeholders remain.
- Status is changed to `published` only when the case is ready to be public.
