import { mkdir, readdir, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

const dist = new URL("../dist/", import.meta.url);
const client = new URL("./client/", dist);
const server = new URL("./server/", dist);

await mkdir(client, { recursive: true });

for (const entry of await readdir(dist)) {
  if (entry === "client" || entry === "server" || entry === ".openai") continue;
  await rename(new URL(entry, dist), new URL(entry, client));
}

await mkdir(server, { recursive: true });
await writeFile(
  new URL("index.js", server),
  `export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  },
};
`,
);

await writeFile(
  new URL("wrangler.json", server),
  `${JSON.stringify(
    {
      compatibility_date: "2026-05-15",
      main: "index.js",
      no_bundle: true,
      assets: { directory: "../client" },
    },
    null,
    2,
  )}\n`,
);

await writeFile(
  new URL("_headers", client),
  `/_astro/*
  Cache-Control: public, max-age=31536000, immutable
`,
);

console.log(`Prepared ${join("dist", "client")} for Sites hosting.`);
