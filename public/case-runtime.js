(() => {
  const root = document.querySelector("[data-cms-case-slug]");
  if (!root || root.dataset.cmsCaseSlug !== "amazon-convenience-market-power") return;
  const escape = (value = "") => String(value).replace(/[&<>\"']/g, (character) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "\"":"&quot;", "'":"&#39;" })[character]);
  const text = (value = "") => escape(value).replace(/\n/g, "<br>");
  const image = (block) => `<figure class="case-editorial-image case-editorial-image--${escape(block.variant || "body")}"><div class="case-editorial-image__frame"><img src="${escape(block.src)}" alt="${escape(block.alt)}" loading="lazy"></div><figcaption><span class="case-editorial-image__label">${escape(block.label || "System View")}</span>${block.caption ? `<span class="case-editorial-image__caption">${text(block.caption)}</span>` : ""}</figcaption></figure>`;
  const renderers = {
    prose: (b) => `<section><h2>${escape(b.heading)}</h2><p>${text(b.body)}</p></section>`,
    image,
    evidence: (b) => `<aside class="evidence-highlight editorial-evidence-highlight"><header class="editorial-evidence-highlight__header"><p class="evidence-highlight__eyebrow">Evidence Highlight</p><h3>${escape(b.title)}</h3></header><div class="editorial-evidence-highlight__finding"><p class="editorial-evidence-highlight__term">Finding</p><div>${b.metric ? `<p class="editorial-evidence-highlight__metric">${escape(b.metric)}</p>` : ""}<p class="editorial-evidence-highlight__statement">${text(b.finding)}</p></div></div><div class="editorial-evidence-highlight__support"><div><p class="editorial-evidence-highlight__term">Comparison</p><p>${text(b.comparison)}</p></div><div><p class="editorial-evidence-highlight__term">Caveat</p><p>${text(b.caveat)}</p></div></div><footer class="editorial-evidence-highlight__source"><span>Source</span><cite>${escape(b.source)}</cite></footer></aside>`,
    timeline: (b) => `<section class="case-timeline"><header class="case-timeline__header"><p>Chronology</p><h3>${escape(b.title)}</h3></header><ol class="case-timeline__list">${b.events.map((e) => `<li class="case-timeline__event case-timeline__event--${escape(e.type)}"><p class="case-timeline__year">${escape(e.year)}</p><div class="case-timeline__content"><h4>${escape(e.title)}</h4><p class="case-timeline__description">${text(e.description)}</p></div></li>`).join("")}</ol></section>`,
    "causal-chain": (b) => `<section class="case-causal-chain"><header><p>Causal Path</p><h3>${escape(b.title)}</h3></header><ol>${b.steps.map((s, i) => `<li><span>${String(i + 1).padStart(2, "0")}</span><div><strong>${escape(s.label)}</strong><p>${text(s.detail)}</p></div></li>`).join("")}</ol></section>`,
    debate: (b) => `<section class="case-editorial-split case-debate-field case-editorial-split--right"><div class="case-editorial-split__text"><p>${escape(b.label || "Context")}</p><h3>${escape(b.title)}</h3><p>${text(b.body)}</p></div><figure class="case-editorial-split__visual"><figcaption><span>${escape(b.visualTitle)}</span></figcaption></figure></section>`,
    "trade-off": (b) => `<section class="case-tradeoff"><p class="case-tradeoff__eyebrow">The Trade-off</p><div class="case-tradeoff__grid"><div class="case-tradeoff__column"><p class="case-tradeoff__label">${escape(b.leftLabel)}</p><ul class="case-tradeoff__list">${b.leftItems.map((x) => `<li>${escape(x)}</li>`).join("")}</ul></div><div class="case-tradeoff__versus">↕</div><div class="case-tradeoff__column"><p class="case-tradeoff__label">${escape(b.rightLabel)}</p><ul class="case-tradeoff__list">${b.rightItems.map((x) => `<li>${escape(x)}</li>`).join("")}</ul></div></div></section>`,
    boundary: (b) => `<section class="case-boundary-map case-boundary-map--v4"><header><p>Analytical Boundary</p><h3>${escape(b.title)}</h3></header><div>${b.items.map((x, i) => `<article><span>${String(i + 1).padStart(2, "0")}</span><h4>${escape(x.label)}</h4><p>${text(x.detail)}</p></article>`).join("")}</div></section>`,
    insight: (b) => `<aside class="case-understory-insight"><p>${escape(b.label || "Research Insight")}</p><div><h3>${escape(b.title)}</h3><p>${text(b.statement)}</p></div></aside>`,
    ecosystem: (b) => `<section class="case-ecosystem"><header class="case-ecosystem__header"><p>System Map</p><h3>${escape(b.title)}</h3></header><div class="case-ecosystem__flow">${b.nodes.map((n, i) => `<article${i === Math.floor(b.nodes.length / 2) ? ' class="is-core"' : ""}><p>${escape(n.label)}</p><h4>${escape(n.title)}</h4><span>${escape(n.detail || "")}</span></article>${i < b.nodes.length - 1 ? '<span class="case-ecosystem__connector">→</span>' : ""}`).join("")}</div>${b.note ? `<p class="case-ecosystem__note">${text(b.note)}</p>` : ""}</section>`,
    question: (b) => `<aside class="one-more-question"><div class="one-more-question__mark"></div><div><p class="one-more-question__label">One More Question</p><p class="one-more-question__question">${text(b.question)}</p></div></aside>`,
  };
  const replaceHero = (content) => {
    const hero = content.meta.hero; const header = root.querySelector(".case-header");
    if (!header || !hero) return;
    const title = header.querySelector("h1"); if (title) title.textContent = root.closest("main")?.dataset.cmsDocumentTitle || title.textContent;
    const summary = header.querySelector(".case-header__deck"); if (summary) summary.textContent = content.meta.summary;
    const question = root.querySelector(".case-question-block__question"); if (question) question.textContent = content.meta.centralQuestion;
    const heroImage = header.querySelector(".case-editorial-image--hero img"); if (heroImage) { heroImage.src = hero.image; heroImage.alt = hero.alt; }
    const caption = header.querySelector(".case-editorial-image--hero .case-editorial-image__caption"); if (caption) caption.textContent = hero.caption || "";
  };
  (async () => {
    const isDraft = root.dataset.cmsCaseMode === "draft";
    const endpoint = isDraft ? `/api/studio/preview?kind=case&slug=amazon-convenience-market-power&locale=en` : `/api/public/document?kind=case&slug=amazon-convenience-market-power&locale=en`;
    try {
      const payload = await fetch(endpoint, { cache: "no-store" }).then((response) => response.ok ? response.json() : { document: null });
      const document = payload.document; if (!document?.content?.blocks) return;
      root.closest("main")?.setAttribute("data-cms-document-title", document.title);
      replaceHero(document.content);
      const body = root.querySelector(".case-body"); if (body) body.innerHTML = document.content.blocks.filter((block) => block.visible !== false).map((block) => renderers[block.type]?.(block) || "").join("");
    } catch { /* fall back to the audited Astro/MDX case */ }
  })();
})();
