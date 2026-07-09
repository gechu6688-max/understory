export const siteCopy = {
  lang: "en",
  brand: {
    name: "understory",
    displayName: "Understory",
    line: "Look beneath. Ask one more question.",
    descriptor: "Cases on business, technology, and the forces beneath them.",
    principle: "A conclusion should sharpen curiosity, not end it.",
  },
  nav: [
    { label: "Cases", href: "/cases/", section: "/cases/" },
    { label: "Topics", href: "/topics/", section: "/topics/" },
    { label: "Concepts", href: "/concepts/", section: "/concepts/" },
    { label: "Method", href: "/method/", section: "/method/" },
    { label: "About", href: "/about/", section: "/about/" },
  ],
  search: {
    label: "Search published cases",
    placeholder: "What’s your one more question?",
    helper: "Search cases, companies, topics, concepts, and ideas.",
    idle: "Search is limited to published cases.",
    empty: "No matching published content was found. This may be a question worth following.",
  },
  method: {
    steps: [
      {
        label: "Question",
        text: "Each case begins with a business question that can be argued with evidence, not a headline that already assumes the answer.",
      },
      {
        label: "Evidence",
        text: "Source material is separated from interpretation so readers can see what is known, alleged, inferred, or still uncertain.",
      },
      {
        label: "Counterargument",
        text: "The strongest reasonable competing explanation is part of the case, not an afterthought.",
      },
      {
        label: "Judgement",
        text: "A case ends with a bounded conclusion and a clear sense of what could change that conclusion.",
      },
      {
        label: "One More Question",
        text: "What remains unresolved? What evidence could change the conclusion? What should we ask next?",
      },
    ],
  },
  oneMoreQuestion: {
    label: "One More Question",
    prompt: "What would you ask next?",
  },
} as const;

export const topicDescriptions: Record<string, string> = {
  Strategy: "How companies make choices about positioning, advantage, trade-offs, and long-term direction.",
  Technology: "How new technologies reshape competition, markets, and behavior.",
};

export const conceptDescriptions: Record<string, string> = {
  "Pricing Power": "A firm's ability to sustain higher prices without losing enough demand to make the increase unprofitable.",
  "Switching Costs": "The friction that makes it harder for customers, sellers, or users to move from one option to another.",
};
