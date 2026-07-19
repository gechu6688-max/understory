export const locales = ["en", "zh"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const isLocale = (value: string | undefined): value is Locale =>
  locales.includes(value as Locale);

export const localizedPath = (locale: Locale, path = "/") => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${normalizedPath === "/" ? "/" : normalizedPath}`;
};

export const switchLocalePath = (targetLocale: Locale, pathname: string) => {
  if (pathname === "/preview/" || pathname.startsWith("/preview/")) return pathname;

  const parts = pathname.split("/").filter(Boolean);
  const rest = isLocale(parts[0]) ? parts.slice(1) : parts;
  const suffix = rest.length ? `/${rest.join("/")}/` : "/";
  return localizedPath(targetLocale, suffix);
};

const enMethodSteps = [
  {
    label: "Question",
    short: "Begin with the question the case needs to answer.",
    text: "Each case begins with a business question that can be argued with evidence, not a headline that already assumes the answer.",
  },
  {
    label: "Evidence",
    short: "Separate what is known from what is inferred.",
    text: "Source material is separated from interpretation so readers can see what is known, alleged, inferred, or still uncertain.",
  },
  {
    label: "Counterargument",
    short: "Give the strongest alternative explanation room.",
    text: "The strongest reasonable competing explanation is part of the case, not an afterthought.",
  },
  {
    label: "Judgement",
    short: "Reach a bounded conclusion and name its limits.",
    text: "A case ends with a bounded conclusion and a clear sense of what could change that conclusion.",
  },
  {
    label: "One More Question",
    short: "Let the conclusion point toward what remains unresolved.",
    text: "What remains unresolved? What evidence could change the conclusion? What should we ask next?",
  },
];

const zhMethodSteps = [
  {
    label: "从问题开始",
    short: "先问清楚，这个案例真正值得回答的问题是什么。",
    text: "有时候，一个看似简单的问题，往往会把人带到更深的地方。",
  },
  {
    label: "让证据说话",
    short: "我会先把知道的、推测的和暂时无法确认的分开。",
    text: "证据不一定替我们作决定，但至少能让判断少一点想当然。",
  },
  {
    label: "给另一种解释留位置",
    short: "一个答案看起来再合理，也不代表只有这一种解释。",
    text: "我想给最有力量的另一种可能，留一点真正的空间。",
  },
  {
    label: "形成有边界的判断",
    short: "最后，我还是会试着给出自己的判断。",
    text: "但它不必装作永远正确；更重要的是说清楚，我现在相信什么，又是什么可能让我改主意。",
  },
  {
    label: "让问题继续",
    short: "一个答案如果真的有用，往往不会把好奇心关上。",
    text: "它会留下一点新的线索，让我们继续看见更深一层的问题。",
  },
];

export const siteCopy = {
  en: {
    lang: "en",
    brand: {
      name: "understory",
      displayName: "Understory",
      localName: "understory",
      line: "Look beneath. Ask one more question.",
      descriptor: "Cases on business, technology, and the forces beneath them.",
      principle: "A conclusion should sharpen curiosity, not end it.",
      heroLines: ["Look beneath.", "Ask one more question."],
    },
    nav: [
      { label: "Archive", href: "/cases/", section: "/cases/" },
      { label: "Topics", href: "/topics/", section: "/topics/" },
      { label: "Concepts", href: "/concepts/", section: "/concepts/" },
      { label: "Method", href: "/method/", section: "/method/" },
      { label: "About", href: "/about/", section: "/about/" },
    ],
    menu: {
      label: "Menu",
      language: "Language",
      development: "Development-only",
      localPreview: "Local Preview",
    },
    language: {
      en: "EN",
      zh: "中文",
    },
    search: {
      label: "Search published cases",
      placeholder: "What’s your one more question?",
      heading: "What’s your one more question?",
      helper: "Search cases, companies, topics, concepts, and ideas.",
      idle: "Search is limited to published cases.",
      empty: "No matching published content was found. This may be a question worth following.",
    },
    method: {
      eyebrow: "Method",
      title: "A thinking path for unfinished questions",
      description:
        "The method is designed for readable business thinking: clear questions, visible evidence, serious alternatives, careful judgement, and curiosity that continues after the conclusion.",
      sequence: "Analytical Sequence",
      standards: "Working standards",
      steps: enMethodSteps,
    },
    oneMoreQuestion: {
      label: "One More Question",
      prompt: "What would you ask next?",
    },
    pages: {
      cases: {
        title: "Analysis library",
        description: "Published business analysis cases.",
        count: (count: number) => (count === 1 ? "1 published case" : `${count} published cases`),
        note: "Public entries only. Drafts, reviews, and archived cases stay out of this library.",
        discovery: "Browse the public library by question, company, topic, and concept as it grows.",
        empty: "No matching published content was found. This may be a question worth following.",
      },
      topics: {
        eyebrow: "Topics",
        title: "Explore by topic",
        description:
          "Topics are broad fields of exploration. They are generated only from currently published cases, so empty categories are not shown.",
        empty: "No published topics are available yet.",
      },
      concepts: {
        eyebrow: "Business Concepts",
        title: "Idea index",
        description:
          "Concepts are analytical mechanisms and reusable lenses beneath each published case. Draft-only concepts remain private.",
        empty: "No published concepts are available yet.",
      },
      about: {
        title: "A place for questions that do not end quickly",
        note: "Understory began with a habit I have never really been able to stop: asking one more question.",
        paragraphs: [
          "I have always been drawn to questions without obvious answers. Why do people stay with one platform? Why can convenience become a source of power? Why does one new technology reshape an industry while another disappears almost unnoticed?",
          "One question usually leads me to another. I started Understory because I wanted a place to follow that curiosity more carefully: to look at evidence, compare explanations, think about trade-offs, and stay honest about what I still do not know.",
          "I am still a student, so I do not expect every case to end with a perfect answer. I am interested in companies, markets, consumer choices, platforms, AI, innovation, and the ways competition changes when technology changes.",
          "The goal is to make my thinking visible enough that it can improve. If better evidence changes the picture, the conclusion should change too. Over time, I hope Understory can become a place where other curious students think alongside me.",
        ],
      },
      caseUnavailable: {
        title: "This case is not yet available in Chinese.",
        body: "The original English version is available. A Chinese version will appear here when it has been carefully edited rather than machine-translated.",
        action: "Continue in English",
      },
    },
    labels: {
      latestCase: "Latest case",
      featuredCase: "Featured Case",
      case: "case",
      publicCase: "public case",
      publishedAnalysis: "Published analysis",
      read: "Read ->",
      exploreCases: "Explore published cases",
      entities: "Entities",
      topics: "Topics",
      concepts: "Concepts",
      centralQuestion: "Central Question",
      quickThesis: "Quick Thesis",
      caseStatus: "Case status",
    },
  },
  zh: {
    lang: "zh-CN",
    brand: {
      name: "understory",
      displayName: "Understory",
      localName: "问溯",
      line: "问有所起，思有所往",
      descriptor: "从商业与科技出发，看看那些不总在第一眼里出现的力量。",
      principle: "好的结论，不是把问题关上，而是让下一步更清楚。",
      heroLines: ["问有所起，", "思有所往"],
    },
    nav: [
      { label: "档案", href: "/cases/", section: "/cases/" },
      { label: "主题", href: "/topics/", section: "/topics/" },
      { label: "概念", href: "/concepts/", section: "/concepts/" },
      { label: "方法", href: "/method/", section: "/method/" },
      { label: "关于", href: "/about/", section: "/about/" },
    ],
    menu: {
      label: "菜单",
      language: "语言",
      development: "开发预览",
      localPreview: "本地预览",
    },
    language: {
      en: "EN",
      zh: "中文",
    },
    search: {
      label: "搜索已发布案例",
      placeholder: "输入一个问题、公司或想法……",
      heading: "还有什么，让你好奇？",
      helper: "搜索案例、公司、主题、概念与想法。",
      idle: "搜索范围仅限已发布案例。",
      empty: "暂时还没有匹配的已发布内容。也许，这正是一个值得继续想下去的问题。",
    },
    method: {
      eyebrow: "方法",
      title: "让问题慢慢变清楚",
      description: "我不想急着给每个问题下结论。更重要的是，把问题问清楚，把证据看清楚，也把自己还不确定的地方留下来。",
      sequence: "分析路径",
      standards: "写作原则",
      steps: zhMethodSteps,
    },
    oneMoreQuestion: {
      label: "问题还在继续",
      prompt: "这个答案，让你想到了些什么？",
    },
    pages: {
      cases: {
        title: "案例库",
        description: "真正用中文写好的案例，会慢慢出现在这里。",
        count: (count: number) => (count === 0 ? "中文案例正在准备中" : `${count} 个中文案例`),
        note: "等第一篇完整的中文案例完成后，它会出现在这里。",
        discovery: "以后你可以从问题、公司、主题和概念进入这座案例库。",
        empty: "中文案例还在慢慢整理。等第一篇真正用中文写好的案例完成后，它会出现在这里。",
      },
      topics: {
        eyebrow: "主题",
        title: "按主题探索",
        description: "每一个主题，都会从真正完成的中文案例里慢慢长出来。",
        empty: "每一个主题，都会从真正完成的中文案例里慢慢长出来。",
      },
      concepts: {
        eyebrow: "商业概念",
        title: "概念索引",
        description: "概念不是漂亮词汇，而是帮助我理解一个商业现象为什么会发生的工具。",
        empty: "中文概念索引会随着真实完成的中文案例慢慢长出来。",
      },
      about: {
        title: "有些问题，不必急着结束",
        note: "每当遇到一件让我好奇的事，我总会多问一句，再多问一句。也是在这些一次次往下问的时刻里，我慢慢长出了自己的思考和想法。",
        paragraphs: [
          "我一直很喜欢那些没有标准答案的问题。为什么人会越来越离不开一个平台？为什么一件原本只是“方便”的事，慢慢会变成一种力量？为什么有些新技术能改变一个行业，而另一些很快就被忘记？",
          "这些问题一开始可能很小：一个产品为什么突然流行，一家公司为什么能涨价，用户为什么明明有别的选择却不离开。可是往下想，它们又会牵出竞争、技术、选择、习惯和代价。",
          "我做 Understory，也给它取中文名字“问溯”，是想给这种好奇心留一个更认真的地方。在这里，我会试着找证据，比较不同解释，看见一个选择背后的取舍，也诚实承认自己还没有想明白的地方。",
          "我现在还只是一个学生，所以并不期待每个案例都能得到完美答案。如果更好的证据出现，我当然愿意改主意。",
          "我关心商业，也关心新技术，尤其是 AI、平台、消费选择和市场变化怎样影响真实的人。Understory / 问溯不是一份冷冰冰的公司分析，更像是一个慢慢练习思考的地方。也许有一天，它也能成为其他好奇的学生一起想问题的地方。",
        ],
      },
      caseUnavailable: {
        title: "该案例的中文版本仍在准备中。",
        body: "英文原文已经可以阅读。等中文版本真正写好后，会再放到这里。",
        action: "继续阅读英文",
      },
    },
    labels: {
      latestCase: "最新案例",
      featuredCase: "精选案例",
      case: "案例",
      publicCase: "公开案例",
      publishedAnalysis: "已发布分析",
      read: "阅读 ->",
      exploreCases: "查看已发布案例",
      entities: "对象",
      topics: "主题",
      concepts: "概念",
      centralQuestion: "核心问题",
      quickThesis: "简要判断",
      caseStatus: "案例状态",
    },
  },
} as const;

export const getSiteCopy = (locale: Locale) => siteCopy[locale];

export const topicDescriptions: Record<Locale, Record<string, string>> = {
  en: {
    Strategy: "How companies make choices about positioning, advantage, trade-offs, and long-term direction.",
    Technology: "How new technologies reshape competition, markets, and behavior.",
    "Market Power": "How firms gain room to influence prices, quality, access, or market rules.",
    Competition: "How rival pressure shapes prices, choices, innovation, and consumer outcomes.",
    "Consumer Choice": "How market structure changes what consumers can realistically choose.",
  },
  zh: {
    Strategy: "公司如何在定位、优势、取舍与长期方向之间做选择。",
    Technology: "新技术如何改变竞争、市场与人的行为。",
    "Market Power": "企业如何获得影响价格、质量、渠道或市场规则的空间。",
    Competition: "竞争压力如何影响价格、选择、创新和消费者结果。",
    "Consumer Choice": "市场结构如何改变消费者真正能选择什么。",
  },
};

export const conceptDescriptions: Record<Locale, Record<string, string>> = {
  en: {
    "Pricing Power": "A firm's ability to sustain higher prices without losing enough demand to make the increase unprofitable.",
    "Switching Costs": "The friction that makes it harder for customers, sellers, or users to move from one option to another.",
    "Network Effects": "A mechanism where a product or platform becomes more valuable as more people or sellers use it.",
    "Market Competition": "The pressure created when rivals can meaningfully challenge a firm's price, quality, or service.",
    "Competitive Constraint": "The discipline rivals place on a firm's ability to raise prices, reduce quality, or narrow consumer choice.",
  },
  zh: {
    "Pricing Power": "企业在不流失过多需求的情况下，持续维持更高价格的能力。",
    "Switching Costs": "让消费者、卖家或用户不容易从一种选择转向另一种选择的摩擦。",
    "Network Effects": "当使用者或卖家越多，产品或平台本身就越有价值的机制。",
    "Market Competition": "当竞争者能够真正挑战一家公司的价格、质量或服务时形成的压力。",
    "Competitive Constraint": "竞争者对企业涨价、降低质量或缩小消费者选择空间形成的约束。",
  },
};

export const translatedCaseIds: Record<Locale, Set<string>> = {
  en: new Set(["sample-foundation-case", "amazon-convenience-market-power"]),
  zh: new Set(["amazon-convenience-market-power"]),
};

export const hasCaseLocale = (locale: Locale, caseId: string) => translatedCaseIds[locale].has(caseId);
