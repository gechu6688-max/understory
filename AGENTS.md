# Project publishing rule

- Treat the Sites project recorded in `.openai/hosting.json` as this repository's single canonical deployment.
- After completing and validating any user-requested website change, publish the updated version to that same Sites project and keep its existing live URL.
- Never create a replacement Sites project or temporary share URL for normal updates.
- Run `npm run check` and `npm run build` before publishing. If either fails, fix the failure before deployment.
