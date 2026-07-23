# Understory Case System

The case system is a file-based editorial framework. Each case is an MDX file in
`src/content/cases`; Astro validates its metadata at build time and the shared
renderer turns it into a consistent research page.

## Architecture

```text
src/components/case/
├── CaseRenderer.astro       # page-level composition
├── CaseHero.astro           # archive identity, title, premise, taxonomy, hero image
├── QuestionBlock.astro      # central research question
├── ThesisBlock.astro        # executive thesis and scope boundary
├── CaseReadingNav.astro     # generated outline and reading progress
├── ReferenceBlock.astro     # structured source list
└── blocks/
    ├── EvidenceBlock.astro
    ├── EvidenceMap.astro
    ├── TimelineBlock.astro
    ├── MechanismBlock.astro
    ├── DebateBlock.astro
    ├── TradeoffBlock.astro
    ├── BoundaryBlock.astro
    ├── InsightBlock.astro
    ├── KeyInsight.astro
    ├── OneMoreQuestion.astro
    └── supporting editorial blocks
```

Routes only select a case and pass it to `CaseRenderer`. Company-specific logic
does not belong in routes or components.

## Content model

Required frontmatter:

- `title`, `summary`, `centralQuestion`, and `quickThesis`
- `publishedDate`, `author`, and editorial `status`
- `entities`, `topics`, `concepts`, and `caseType`
- at least one structured entry in `sources`

Optional frontmatter:

- `subtitle`, `heroImage`, `updatedDate`, `featured`, and `relatedCases`
- `presentation`: `standard` or `editorial`
- `caseNumber` and `readingTimeMinutes`
- `questionContext` and `scopeBoundary`
- `counterargumentSummary` and `whatWouldChangeMyMind`
- localized editorial fields under `localized.zh`

Use `standard` for a direct question-and-thesis header. Use `editorial` for the
archive treatment with a dedicated question and current-judgment sequence.

## Analytical sequence

MDX headings should make the reasoning visible:

1. Question
2. Context
3. Evidence
4. Mechanism or analysis
5. Debate or alternative explanations
6. Trade-off and limitations
7. Insight or conclusion

The body remains editorially flexible. Components support the sequence without
forcing every case into an identical number of sections.

## Source discipline

Each source has a stable `id`, title, publisher, source type, relevance note,
and optional URL and dates. Claims should link to the corresponding source ID
where useful. Regulatory allegations, company statements, academic findings,
and editorial inference should remain visibly distinct in the prose.
