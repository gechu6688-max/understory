# Website Foundation

This is the V1 Astro foundation for a static case-writing site.

## Common Commands

- `npm run dev` starts the local development server.
- `npm run check` validates Astro, TypeScript, and content collection types.
- `npm run build` creates the static production build in `dist/`.
- `npm run preview` previews the built site locally.

## Where Things Live

- Cases live in `src/content/cases/`.
- Authors live in `src/content/authors/`.
- Content schemas live in `src/content.config.ts`.
- Page routes live in `src/pages/`.
- Shared layouts live in `src/layouts/`.
- Small MDX analytical components live in `src/components/mdx/`.
- References rendering lives in `src/components/References.astro`.

## Publishing Status

Cases can use `draft`, `review`, `published`, or `archived`.

Only `published` cases appear on the public homepage listing and generate normal public production routes by default. Draft, review, and archived cases validate as content but are not publicly routable unless a future approved preview system is added.

## Editing Guidance

Add or edit normal case content in `src/content/cases/`. Avoid changing `src/content.config.ts`, `astro.config.mjs`, or `package.json` casually; those files control the site foundation.

For the case-writing workflow, use `docs/case-writing-workflow.md`.
