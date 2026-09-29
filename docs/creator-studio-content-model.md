# Creator Studio content model

Creator Studio stores editorial records in D1 and image bytes in R2. It deliberately has no rich-text canvas or freeform page builder: the public design system remains in control of spacing, type, and analysis hierarchy.

## Records

- `site`: global identity, navigation, labels, and system copy.
- `page`: Home, Cases, Topics, Concepts, Method, or About page fields.
- `case`: metadata plus an explicitly ordered `blocks` array.

## Case blocks

The allowed `type` values are `prose`, `image`, `evidence`, `timeline`, `causal-chain`, `debate`, `trade-off`, `boundary`, `insight`, `ecosystem`, and `question`.

These map to the existing Understory reading components: Case Hero, Editorial Image, Evidence Map, Timeline, Mechanism/Causal Chain, Debate, Trade-off, Boundary Map, Understory Insight, Ecosystem Map, and One More Question. A future renderer reads the stored properties and passes them to the same components; it does not permit layout properties.

## Workflow

Saving creates or updates an unpublished draft. Publishing snapshots the structured draft into version history and writes the immutable published payload. Restoring a version copies it back into a new draft; it never silently changes the public version. Archiving hides a record without deleting its history. Deletion intentionally removes a record and its version history.

## Required production configuration

The deployment has `DB` (D1) and `BUCKET` (R2) bindings. Set the secret `STUDIO_OWNER_EMAIL` in the Sites environment to the owner’s ChatGPT sign-in email. The worker uses the platform’s authenticated email header on every Studio/API request, so the email is neither shipped to the browser nor hardcoded in source.
