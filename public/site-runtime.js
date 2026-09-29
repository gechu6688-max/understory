(() => {
  const locale = document.documentElement.lang.startsWith("zh") ? "zh" : "en";
  const path = location.pathname.replace(/^\/(en|zh)/, "").replace(/\/$/, "") || "/";
  const slug = path === "/" ? "home" : path.split("/")[1];
  const fetchDocument = async (kind, name) => (await fetch(`/api/public/document?kind=${kind}&slug=${encodeURIComponent(name)}&locale=${locale}`, { cache: "no-store" }).then((response) => response.ok ? response.json() : { document: null })).document;
  const write = (selector, value) => document.querySelectorAll(selector).forEach((node) => { if (typeof value === "string") node.textContent = value; });
  (async () => {
    try {
      const [site, page] = await Promise.all([fetchDocument("site", "global-system"), fetchDocument("page", slug)]);
      const global = site?.content?.fields;
      if (global) {
        write("[data-cms-global=brandName]", global.brandName);
        Object.entries(global).forEach(([key, value]) => write(`[data-cms-global="${key}"]`, value));
        if (Array.isArray(global.navigation)) global.navigation.forEach((label, index) => { const link = document.querySelectorAll("[data-cms-nav]")[index]; if (link && typeof label === "string") link.textContent = label; });
      }
      const fields = page?.content?.fields;
      if (fields) Object.entries(fields).forEach(([key, value]) => write(`[data-cms="${key}"]`, value));
    } catch { /* static Astro content remains the safe fallback */ }
  })();
})();
