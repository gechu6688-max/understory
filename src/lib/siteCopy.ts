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
    short: "先找到这个案例真正需要回答的问题。",
    text: "每个案例都从一个可以被证据检验的商业问题开始，而不是从一个已经预设答案的标题开始。",
  },
  {
    label: "让证据说话",
    short: "把已知事实和推断区分开。",
    text: "资料、数据、公开文件和解释需要分开放置，让读者看见什么是已知，什么仍只是推测、指控或有待确认。",
  },
  {
    label: "给另一种解释留位置",
    short: "认真对待最有力的相反解释。",
    text: "一个好的案例不把反方观点当作装饰，而是给最合理的另一种解释足够的空间。",
  },
  {
    label: "形成有边界的判断",
    short: "得出结论，也说清它的限度。",
    text: "判断应该是有边界的：它需要说明目前能相信什么，也需要说明什么证据会改变这个判断。",
  },
  {
    label: "再追问一步",
    short: "让结论指向尚未解决的问题。",
    text: "还有什么没有想清楚？什么证据会改变结论？下一步应该继续追问什么？",
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
      { label: "Cases", href: "/cases/", section: "/cases/" },
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
      },
      concepts: {
        eyebrow: "Business Concepts",
        title: "Idea index",
        description:
          "Concepts are analytical mechanisms and reusable lenses beneath each published case. Draft-only concepts remain private.",
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
      line: "问起于好奇，溯向未见之处。",
      descriptor: "关于商业、科技，以及那些藏在表面之下的力量。",
      principle: "一个结论，不该终止好奇；它应该让下一步追问更清晰。",
      heroLines: ["问起于好奇，", "溯向未见之处。"],
    },
    nav: [
      { label: "案例", href: "/cases/", section: "/cases/" },
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
      placeholder: "你还想再追问什么？",
      helper: "搜索案例、公司、主题、概念与想法。",
      idle: "搜索范围仅限已发布案例。",
      empty: "暂时没有匹配的已发布内容。也许这正是一个值得继续追问的问题。",
    },
    method: {
      eyebrow: "方法",
      title: "为未完成的问题，留一条思考路径",
      description: "这里的方法不是为了把问题迅速收束，而是为了让问题、证据、另一种解释和判断之间的关系更清楚。",
      sequence: "分析路径",
      standards: "写作原则",
      steps: zhMethodSteps,
    },
    oneMoreQuestion: {
      label: "再追问一步",
      prompt: "你还会问什么？",
    },
    pages: {
      cases: {
        title: "案例库",
        description: "已发布的商业与科技案例分析。",
        count: (count: number) => `${count} 个已发布案例`,
        note: "这里只展示已发布内容。草稿、审阅中和归档案例不会进入公开页面。",
        discovery: "随着案例增加，你可以从问题、公司、主题与概念进入这座案例库。",
        empty: "中文案例正在整理中。这里不会自动机器翻译已有英文案例。",
      },
      topics: {
        eyebrow: "主题",
        title: "按主题探索",
        description: "主题是较宽的探索领域，只来自已经发布的案例；没有内容的分类不会显示。",
      },
      concepts: {
        eyebrow: "商业概念",
        title: "概念索引",
        description: "概念是理解案例背后机制的分析工具，而不是宽泛主题。",
      },
      about: {
        title: "给那些不会很快结束的问题，一个地方",
        note: "Understory，起初只是源于我的一个小习惯：总忍不住再多问一句。",
        paragraphs: [
          "我一直很喜欢那些没有标准答案的问题。为什么人们会长久停留在一个平台？便利为什么有时会慢慢变成一种力量？为什么有些新技术足以重塑整个行业，而另一些却悄无声息地消失？",
          "对我来说，一个问题常常会牵出另一个问题。于是我开始做 Understory，也开始想象“问溯”——想给这种好奇心留一个更认真一点的地方：去找证据，比较不同解释，想一想得失与代价，也诚实面对那些我还没有想明白的部分。",
          "我现在还只是一个学生，也并不期待每一个案例都能通向一个漂亮而完整的答案。",
          "恰恰因为还在学习，我更愿意让这些思考保持开放：如果更好的证据出现，结论就应该改变；如果一个问题还没有想清楚，那就把它留下来，继续往前问。",
        ],
      },
      caseUnavailable: {
        title: "该案例的中文版本仍在准备中。",
        body: "英文原文已经可以阅读。这里不会自动机器翻译；中文版本会在认真改写和校对后发布。",
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
  },
  zh: {
    Strategy: "公司如何在定位、优势、取舍与长期方向之间做选择。",
    Technology: "新技术如何改变竞争、市场与人的行为。",
  },
};

export const conceptDescriptions: Record<Locale, Record<string, string>> = {
  en: {
    "Pricing Power": "A firm's ability to sustain higher prices without losing enough demand to make the increase unprofitable.",
    "Switching Costs": "The friction that makes it harder for customers, sellers, or users to move from one option to another.",
  },
  zh: {
    "Pricing Power": "企业在不流失过多需求的情况下，持续维持更高价格的能力。",
    "Switching Costs": "让消费者、卖家或用户不容易从一种选择转向另一种选择的摩擦。",
  },
};

export const translatedCaseIds: Record<Locale, Set<string>> = {
  en: new Set(["sample-foundation-case"]),
  zh: new Set([]),
};

export const hasCaseLocale = (locale: Locale, caseId: string) => translatedCaseIds[locale].has(caseId);
