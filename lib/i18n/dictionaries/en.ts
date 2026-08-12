// English dictionary — the canonical source of truth for all site copy.
// Other languages mirror this exact shape. Brand name "Reviewslip" is never
// translated. Keep placeholders like {year} and {email} intact in every locale.

const en = {
  common: {
    getInTouch: "Get in touch",
    tryDemo: "Try the live demo",
    brandNote: "Reviewslip only assists genuine customers with their own reviews.",
  },

  selectors: {
    language: "Language",
    country: "Country",
  },

  // Per-page <title> and meta description. Titles are kept short (~60 chars)
  // and descriptions under ~155 chars so search engines don't truncate them.
  seo: {
    home: {
      title: "Reviewslip — Get more 5-star Google reviews",
      description:
        "Reviewslip helps your happy customers write and post a genuine Google review in seconds. Scan a QR code, get a tailored draft, edit, and post.",
    },
    pricing: {
      title: "Pricing",
      description:
        "Simple Reviewslip plans for one location or many. Compare Starter, Pro and Business — every plan includes the same features.",
    },
    howItWorks: {
      title: "How it works",
      description:
        "From QR scan to posted Google review in three taps. See exactly how Reviewslip helps genuine customers leave a review in seconds.",
    },
    compliance: {
      title: "Compliance & trust",
      description:
        "How Reviewslip stays on the right side of the FTC fake review rule and platform policies — by only ever helping genuine customers.",
    },
    demo: {
      title: "Live demo",
      description:
        "Try Reviewslip yourself. Pick what stood out and watch a genuine 5-star review draft appear — no signup needed.",
    },
    faq: {
      title: "Guide & FAQ",
      description:
        "How to run a review programme without getting flagged: correct setup, the pace to keep, the red flags Google watches for, and what's actually at stake.",
    },
    contact: {
      title: "Contact",
      description:
        "Get in touch about Reviewslip for your business. Tell us about your locations and we'll help you earn more genuine Google reviews.",
    },
    privacy: {
      title: "Privacy Policy",
      description:
        "How Reviewslip collects, uses and protects data for businesses and their customers.",
    },
    terms: {
      title: "Terms of Service",
      description:
        "The terms governing use of Reviewslip, including acceptable use and prohibited conduct.",
    },
  },

  nav: {
    howItWorks: "How it works",
    features: "Features",
    pricing: "Pricing",
    trust: "Trust",
    demo: "Live demo",
    faq: "Guide & FAQ",
    contact: "Contact",
  },

  footer: {
    blurb: "Help your happy customers leave a genuine Google review in seconds.",
    colProduct: "Product",
    colCompany: "Company",
    colGetStarted: "Get started",
    complianceTrust: "Compliance & trust",
    privacy: "Privacy",
    terms: "Terms",
    rights: "© {year} Reviewslip. All rights reserved.",
  },

  home: {
    heroEyebrow: "Genuine reviews, made effortless",
    heroTitleLead: "Turn great visits into",
    heroTitleEm: "5-star reviews.",
    heroLede:
      "Reviewslip helps your happy customers write and post a genuine Google review in seconds. They scan, tap what they loved, and share — in their own words.",
    heroNote: "No fake reviews. Ever. Only real customers, in their own words.",

    proofRating: "Trusted by hospitality & local businesses",
    proofBuiltFor: "Built for cafés, lodges, salons, clinics & more",

    howEyebrow: "How it works",
    howTitle: "Three taps from visit to review.",
    steps: [
      {
        title: "Scan",
        body: "Your happy customer scans a QR code and lands on your branded review slip.",
      },
      {
        title: "Draft",
        body: "They tap what stood out; Reviewslip writes a short, genuine 5-star review they can edit.",
      },
      {
        title: "Post",
        body: "One tap copies it and opens your Google listing. The review goes live in seconds.",
      },
    ],

    featuresEyebrow: "Features",
    featuresTitle: "Everything you need to earn more honest reviews.",
    features: [
      {
        title: "QR code at the moment it matters",
        body: "Put a slip on the table, the receipt, or the room. A quick scan opens your branded review page — no app to download.",
      },
      {
        title: "Drafts tuned to your business",
        body: "The AI writes in your voice using only real, safe details about your venue. Guests pick what they loved; we phrase it.",
      },
      {
        title: "One tap to Google",
        body: "Copy the draft and open your Google review page instantly. Fewer drop-offs between wanting to review and actually posting.",
      },
      {
        title: "Regenerate for the right words",
        body: "Not quite it? A single tap offers a fresh phrasing, so every review still sounds like the guest, not a template.",
      },
      {
        title: "Real customers only",
        body: "No bulk generation, no fake accounts. One draft per genuine visit — built to keep you on the right side of platform rules.",
      },
      {
        title: "Your venue, your prompt",
        body: "Customise the categories and tone for each location, so every draft sounds like it came from your business.",
      },
    ],

    metrics: [
      { value: "3×", label: "more reviews from the same happy customers*" },
      { value: "20s", label: "average time from scan to posted review*" },
      { value: "4.9★", label: "typical star average from assisted reviews*" },
    ],
    metricsFootnote:
      "*Illustrative figures — real benchmarks to be published at launch.",

    pricingEyebrow: "Pricing",
    pricingTitle: "Simple plans that grow with you.",
    pricingCompare: "See full plan comparison →",

    trustEyebrow: "Compliance & trust",
    trustTitle: "Honest by design.",
    trustLede:
      "The FTC and every major platform ban fake and AI-fabricated reviews. Reviewslip is built the opposite way: it only ever helps a real customer express a real opinion. No bots, no bulk, no fabricated details.",
    trustCta: "Read our compliance approach",

    faqEyebrow: "Questions",
    faqTitle: "Frequently asked.",
    faqMore: "Read the full guide: setup, risks & red flags →",
    faq: [
      {
        q: "Isn't this just fake reviews?",
        a: "No — and that's the whole point. Reviewslip only helps a real customer who just had a real experience put their own thoughts into words. There's no bulk generation and no posting on anyone's behalf. The customer reviews, edits, and posts it themselves.",
      },
      {
        q: "Is this allowed under Google's policies and the FTC rules?",
        a: "Assisting a genuine customer to write their own honest review is permitted. Fabricating reviews, incentivising them, or posting fake ones is not — and Reviewslip is designed specifically to avoid all of that. See our Compliance & Trust page for details.",
      },
      {
        q: "Which review platforms are supported?",
        a: "Google, TripAdvisor, LINE, Facebook, Xiaohongshu and Wongnai. Reviewslip helps your customers post to whichever platform matters most for your business and your region.",
      },
      {
        q: "How long does setup take?",
        a: "A few minutes. We add your venue and Google review link, tweak the categories and tone to match your business, and hand you a QR code ready to place.",
      },
      {
        q: "Do I need my own AI key?",
        a: "No. Review generation is handled for you and included with every plan.",
      },
    ],

    ctaTitle: "Your happiest customers are ready to talk.",
    ctaLede: "Give them the easiest way to say it.",
  },

  pricing: {
    eyebrow: "Pricing",
    title: "Plans that grow with you.",
    lede: "Start small on a single location. Scale up as more of your happy customers start leaving reviews.",
    disclaimer: "Pricing shown is placeholder while we finalise plans.",
    monthly: "Monthly",
    yearly: "Yearly",
    savings: "2 months free",
    billedAnnually: "Billed annually · 2 months free",
    mostPopular: "Most popular",
    perMonth: "/mo",
    perYear: "/yr",
    free: "Free",
    custom: "Custom",
    faqTitle: "Pricing questions",
    faq: [
      {
        q: "Is the pricing final?",
        a: "Not yet — the numbers shown are placeholders while we finalise plans. The tiers and features are broadly what to expect; final pricing will be confirmed before launch.",
      },
      {
        q: "What counts as a generation?",
        a: "Each time the app drafts a review for a customer counts as one generation. Regenerating for a fresh phrasing during the same session uses your allowance too, so limits are generous.",
      },
      {
        q: "Can I change plans later?",
        a: "Yes. Just get in touch and we'll move you up or down a plan whenever you need.",
      },
      {
        q: "What's the difference between the plans?",
        a: "Just the number of venues you can run — 1 on Starter, up to 3 on Pro, and up to 10 on Business. Every plan includes the same features; you only pay more as you add locations.",
      },
    ],
  },

  plans: {
    starterName: "Starter",
    starterTagline: "For a single location getting started.",
    proName: "Pro",
    proTagline: "For growing businesses with a few locations.",
    businessName: "Business",
    businessTagline: "For multi-location businesses.",
    cta: "Get in touch",
    features: {
      venues1: "1 venue",
      venues3: "Up to 3 venues",
      venues10: "Up to 10 venues",
      qr: "QR code + shareable review link",
      drafts: "AI-assisted review drafts",
      oneTap: "Copy & post to Google in one tap",
      branding: "Reviewslip branding on the slip",
    },
  },

  how: {
    eyebrow: "How it works",
    title: "Three taps from visit to review.",
    lede: "Reviewslip removes the friction between a happy customer and the review they meant to leave — without ever writing a fake one.",
    steps: [
      {
        title: "Place your QR code",
        body: "Add a Reviewslip QR to your receipts, table cards, rooms, or checkout screen. Each code links to a review slip branded for that specific location.",
      },
      {
        title: "The customer scans",
        body: "No app to install. The slip opens in their browser, greets them by your business name, and asks a simple question: what stood out?",
      },
      {
        title: "They pick what they loved",
        body: "The customer taps a few things they genuinely enjoyed — friendly service, great food, a lovely location. These become the honest basis of the review.",
      },
      {
        title: "Reviewslip drafts it",
        body: "In a second or two, a short, natural 5-star review appears in your business's voice — using only safe, real details. The customer can edit every word.",
      },
      {
        title: "One tap to post",
        body: "They copy the draft and tap through to your Google review page. The review is theirs, in their words, posted from their account.",
      },
    ],
    demoNote: "A working preview — tap the chips and generate a draft yourself.",
  },

  compliance: {
    eyebrow: "Compliance & trust",
    title: "Honest by design.",
    lede: "Fake reviews are illegal and against every platform's rules. Reviewslip is built from the ground up to do the opposite: help real customers share real opinions, faster.",
    calloutLead: "The short version:",
    callout:
      "Reviewslip never writes fake reviews, never posts on a customer's behalf, and never generates reviews in bulk. A genuine customer, after a genuine visit, gets help wording their own honest review — and posts it themselves.",
    h1: "The rules we design around",
    p1: "In 2024 the U.S. Federal Trade Commission finalised a rule banning fake and AI-fabricated reviews, undisclosed incentivised reviews, and other deceptive practices, with penalties per violation. Google, Yelp, Trustpilot and others have long prohibited the same. These rules exist for good reason, and we take them seriously.",
    h2: "How Reviewslip stays compliant",
    list: [
      "Real customer, real experience. The tool is meant to be used at your location by someone who actually visited.",
      "The customer is the author. They choose what to highlight, edit the draft freely, and post it from their own account. We never post for them.",
      "No fabricated specifics. Prompts are constrained to safe, true details about your venue — the AI can't invent facts, events, or claims.",
      "No bulk or automated posting. One draft per genuine session. There is no way to mass-generate or auto-submit reviews.",
      "No incentives built in. Reviewslip does not offer or encourage rewards in exchange for reviews.",
    ],
    h3: "What Reviewslip is not",
    p3: "It is not a review farm, a bot network, or a way to buy stars. If that's what you're after, Reviewslip isn't the tool — and honestly, those approaches will get your listing penalised.",
    h4: "Your responsibility",
    p4Lead: "You agree to use Reviewslip only with genuine customers and in line with the review platforms' policies and applicable law. Full details are in our ",
    p4Link: "Terms of Service",
    p4End: ".",
    disclaimer:
      "This page is a plain-language summary, not legal advice. Review the current FTC guidance and each platform's policies for your jurisdiction.",
  },

  faqPage: {
    eyebrow: "Guide & FAQ",
    title: "How to use Reviewslip without getting flagged.",
    lede: "Reviewslip only helps if you run it the way the review platforms expect. This guide covers setting it up properly, the pace to keep, the patterns that get review campaigns filtered or penalised, and what is actually at stake if you get it wrong.",

    warningLead: "The single biggest mistake:",
    warning:
      "Handing the QR code only to customers you think are happy. That is review gating — Google prohibits it and the FTC's 2024 rule specifically targets it. Offer the same review path to everyone, and let honest opinions land where they land.",

    sections: [
      {
        title: "Setting it up",
        blurb:
          "Most problems are designed in at the start. Where and when you put the QR code decides whether the reviews that follow look natural.",
        items: [
          {
            q: "Where should the QR code go?",
            a: "Somewhere every customer passes at the end of their visit — on the receipt, a table card, the room folder, the checkout screen. The goal is that everyone gets the same opportunity to scan it, not that you choose who sees it. Avoid placements where only certain customers will ever encounter it.",
          },
          {
            q: "When is the right moment to ask?",
            a: "After the experience is finished — as they pay, check out, or leave. Early enough that the visit is fresh in mind, late enough that they have actually experienced the whole thing. Do not prompt mid-service: you would be asking someone to review something they have not finished.",
          },
          {
            q: "Should I ask every customer, or only the happy ones?",
            a: "Every customer. Selectively asking only the people you expect to be positive is review gating, and it is prohibited by Google's policies and by the FTC's 2024 rule. It is also self-defeating: a listing where every single review is five stars reads as less trustworthy to shoppers than one with a realistic spread. Make the QR available to everyone.",
          },
          {
            q: "What if someone had a bad experience?",
            a: "Let them say so — or better, fix it before they leave. Reviewslip drafts from what the customer selects, so the honest path for an unhappy visitor is to write their own words or to raise it with you directly. What you must never do is hide or withhold the review path from someone because you expect criticism. Suppressing negative reviews is exactly what the FTC rule was written to stop.",
          },
        ],
      },
      {
        title: "Pace and patterns",
        blurb:
          "Genuine reviews accumulate at a believable rate. The shape of your review history matters as much as the content.",
        items: [
          {
            q: "How many reviews is too many, too fast?",
            a: "There is no published threshold — Google does not publish one, and anyone quoting an exact number is guessing. The principle is proportionality: your review rate should look like a plausible fraction of your real customer volume, and it should not change abruptly. A café serving 500 people a week can sustain far more than a six-room guesthouse. As a working rule of thumb, if one week's reviews would grow your all-time total by more than roughly a fifth, ease off.",
          },
          {
            q: "What does a suspicious spike actually look like?",
            a: "A listing that averaged two reviews a month for three years and then collects forty in nine days is the textbook signature of bought reviews, and automated filters are tuned for precisely that shape. The reviews may never appear, may appear and then vanish days later, or may pull the whole listing into review. Ramping up gradually — a fraction of customers at first, widening over weeks — avoids the shape entirely.",
          },
          {
            q: "Is it a problem if everyone posts from my WiFi?",
            a: "Yes, and this one catches people out. If every customer scans and posts while on your guest network, a batch of reviews all originates from a single IP address. That is a strong clustering signal, and it looks a great deal like someone posting reviews from the back office. Customers on their own mobile data avoid this naturally, so do not push people onto the venue WiFi purely to leave a review.",
          },
          {
            q: "Can customers post from a tablet at the counter?",
            a: "No. Several reviews from one device — same fingerprint, often the same signed-in browser — is among the clearest artificial-review signals there is. It also puts you one short step from typing the review yourself. Reviews should always come from the customer's own phone and their own account.",
          },
          {
            q: "Can I email or text my whole customer list at once?",
            a: "Be careful. A blast to thousands of past customers produces exactly the velocity spike described above, and reviews about visits from months ago are vaguer and less credible. If you do reach out, work in small batches, to recent customers, spread over time.",
          },
        ],
      },
      {
        title: "Red flags that get you penalised",
        blurb:
          "These are the practices that turn a legitimate review programme into a liability. None of them are worth it.",
        items: [
          {
            q: "Can I offer a discount or a free item for a review?",
            a: "No. Incentivised reviews are prohibited by Google, and the FTC rule covers undisclosed incentives as well. This holds even if you would happily accept a negative review in exchange — the payment is the problem, not the sentiment. You can thank people. You cannot pay them.",
          },
          {
            q: "Can staff, friends or family leave reviews?",
            a: "No. Reviews from people connected to the business are prohibited outright and are often easy to spot. That includes staff reviewing their own workplace and asking friends to pad the count after a bad month.",
          },
          {
            q: "Will AI-drafted reviews all read the same?",
            a: "They can, and it is a real risk. Reviewslip mitigates it by drafting from the specific things each customer picks and by offering fresh phrasings on regenerate — but the genuine protection is that the customer edits the text. Encourage that. A page of reviews sharing sentence structure and vocabulary is a detectable pattern no matter who or what wrote them.",
          },
          {
            q: "Can I write the review for a customer who says they are happy?",
            a: "No. Even with verbal permission, you writing and posting it makes it a review from you, not from them — and that is the definition of a fake review under both Google's policy and the FTC rule. Hand them the QR code and let them do it.",
          },
        ],
      },
      {
        title: "What is actually at stake",
        blurb:
          "The consequences run from invisible to serious, and some of them arrive months after the fact.",
        items: [
          {
            q: "What is the worst that can happen?",
            a: "Roughly in order of severity: individual reviews get filtered and never appear; a batch is removed retroactively, sometimes months later; the listing receives a consumer alert warning visitors that suspicious activity was detected; or the listing is suspended. On the legal side, the FTC rule carries civil penalties assessed per violation — meaning per fake review, not per business. And there is the plain reputational damage of being publicly caught.",
          },
          {
            q: "What does the FTC rule actually ban?",
            a: "The 2024 rule targets fake and AI-fabricated reviews from people who never had a genuine experience, undisclosed incentivised reviews, insiders posing as customers, and the suppression or concealment of negative reviews. What it does not ban is helping a genuine customer put their own honest opinion into words — which is the whole design of Reviewslip.",
          },
          {
            q: "If reviews get removed, is that Reviewslip's fault or mine?",
            a: "Yours, in practice. Reviewslip constrains what the AI can say and never posts on anyone's behalf, but it cannot control who you hand the QR code to, how hard you push, or whether you offer incentives. The practices on this page are what determine the outcome.",
          },
          {
            q: "Does this apply outside the United States?",
            a: "The FTC rule is US law, but the platform policies are global — Google's rules on fake, incentivised and gated reviews apply wherever you operate. Many other jurisdictions have their own consumer-protection regimes covering misleading reviews, and several have been tightening them. Treat the guidance here as the floor, not the ceiling.",
          },
        ],
      },
      {
        title: "Running it well",
        blurb:
          "What a healthy, durable review programme looks like in practice.",
        items: [
          {
            q: "What does a healthy review pattern look like?",
            a: "A steady trickle rather than bursts. A mix of ratings rather than a wall of fives. Reviews of varying length — some a line, some detailed. Timing spread across days and hours instead of clustered. Owner responses to the good and the bad alike. That profile is both what the platforms expect and what actually persuades someone reading your listing.",
          },
          {
            q: "How should I handle a negative review?",
            a: "Respond publicly, without arguing. Acknowledge it, add context briefly if there is any, and say what you are changing. Prospective customers read the responses as closely as the reviews. Do not request removal unless it genuinely breaches platform policy, and never try to bury it under a rush of new positive reviews — that is the spike pattern again, this time with an obvious motive attached.",
          },
          {
            q: "How quickly will I see results?",
            a: "More slowly than you would like, and that is rather the point. A programme adding a handful of genuine reviews each week compounds into a materially stronger listing over months, and never looks anomalous at any moment. Attempts to compress that into a fortnight are what trigger everything described above.",
          },
          {
            q: "Which platforms does Reviewslip support?",
            a: "Google, TripAdvisor, LINE, Facebook, Xiaohongshu and Wongnai — so you can meet your customers on whichever platform matters most in your market. Each platform has its own rules, though, and some are stricter than Google: several restrict or prohibit soliciting reviews at all. Check the policy of any platform before you point customers at it, wherever you operate.",
          },
        ],
      },
    ],

    ctaTitle: "Set it up properly from day one.",
    ctaLede:
      "Tell us about your business and we will help you start on the right footing.",

    disclaimer:
      "This is practical guidance drawn from published platform policies and the FTC's rule — it is not legal advice. Platform rules change, and the requirements where you operate may differ. Check the current guidance for your jurisdiction, and take professional advice if you are unsure.",
  },

  demo: {
    eyebrow: "Live demo",
    title: "See it for yourself.",
    lede: "This is the customer-facing slip, exactly as your guests would see it. Tap what stood out and generate a draft. It's a safe preview — nothing is posted anywhere.",
    note: "Demo drafts are canned samples so this page needs no AI key. In the real product, drafts are generated live and tuned to your venue.",
    cta: "Set this up for my business",
  },

  contact: {
    eyebrow: "Get in touch",
    title: "Let's get you set up.",
    lede: "Tell us about your business and we'll help you start turning happy customers into genuine Google reviews.",
    h1: "Email us",
    p1: "The quickest way to reach us is email. Let us know your business name, roughly how many locations you have, and what you're hoping for — we'll take it from there.",
    button: "Email {email}",
    calloutLead: "A quick promise:",
    callout:
      "Reviewslip only ever helps genuine customers write their own reviews. We don't do fake, bulk, or automated reviews — see our Compliance & Trust page.",
    demoNote: "This is the slip your customers would see. Try it out.",
    demoVenue: "Your business",
    form: {
      heading: "Send us a message",
      name: "Your name",
      namePlaceholder: "Jane Smith",
      email: "Email",
      emailPlaceholder: "jane@yourbusiness.com",
      business: "Business name",
      businessPlaceholder: "The Riverside Café",
      locations: "Number of locations",
      message: "Message",
      messagePlaceholder: "Tell us a little about your business and what you're hoping for…",
      submit: "Send message",
      sending: "Sending…",
      successTitle: "Thanks — your message is on its way!",
      successBody: "We'll get back to you shortly.",
      errorTitle: "Something went wrong",
      errorBody: "Please try again, or email us directly.",
      orEmail: "Prefer email? Write to us at",
      errRequired: "This field is required.",
      errEmail: "Please enter a valid email address.",
    },
  },

  slip: {
    thanks: "Thanks for visiting.",
    prompt: "What stood out?",
    fiveStars: "Five stars",
    placeholder: "Pick what you loved, then generate a draft.",
    generate: "Generate my review",
    writing: "Writing…",
    regenerate: "Regenerate",
    copy: "Copy",
    copied: "Copied ✓",
    proceed: "Proceed to Google",
    categories: {
      service: "Friendly service",
      food: "Great food",
      clean: "Spotless & tidy",
      value: "Good value",
      location: "Lovely location",
      cosy: "Cosy atmosphere",
    },
  },

  legal: {
    lastUpdated: "Last updated: draft template",
    placeholderLead: "Placeholder.",
    placeholder:
      "This is a template outline, not a finished policy. Have it reviewed by a qualified professional before launch.",
    privacy: {
      eyebrow: "Legal",
      title: "Privacy Policy",
      s1: "Who we are",
      p1: "Reviewslip (“we”, “us”) provides a tool that helps businesses invite genuine customers to write and post their own reviews.",
      s2: "What we collect",
      list2: [
        "Account data for business users (name, email, organisation).",
        "Venue configuration you provide (business name, review link).",
        "Aggregate, non-identifying usage of the review slip (e.g. counts of drafts generated and copied).",
        "Billing details processed by our payment provider.",
      ],
      s3: "What we do not do",
      p3: "We do not sell your data. We do not collect personal information from your end customers through the review slip, and we do not post reviews on anyone's behalf.",
      s4: "Data processors",
      p4: "We rely on third parties for hosting, authentication, payments, and AI generation. Each processes data only as needed to provide the service.",
      s5: "Your rights",
      p5: "You may access, correct, or delete your account data. Contact us to make a request.",
      s6: "Contact",
      p6: "Questions about this policy can be sent to our support address.",
    },
    terms: {
      eyebrow: "Legal",
      title: "Terms of Service",
      s1: "Acceptable use",
      p1Lead:
        "You agree to use Reviewslip only to invite genuine customers who have had a real experience with your business to write their own honest reviews. You will comply with the FTC rules on reviews and the policies of any platform you direct customers to. See our ",
      p1Link: "Compliance & Trust",
      p1End: " page.",
      s2: "Prohibited conduct",
      list2: [
        "Generating or posting fake, fabricated, or bulk reviews.",
        "Offering incentives in exchange for reviews.",
        "Impersonating customers or posting on their behalf.",
        "Using the service to violate any law or platform policy.",
      ],
      p2: "We may suspend or terminate accounts that misuse the service.",
      s3: "Plans & billing",
      p3: "Plans are arranged directly with us. You are responsible for how the service is used for your business. Pricing is not yet finalised and may change before general availability.",
      s4: "Service “as is”",
      p4: "The service is provided as is, without warranties. We are not liable for how reviews affect your listings or for actions taken by review platforms.",
      s5: "Changes",
      p5: "We may update these terms; continued use after changes constitutes acceptance.",
      s6: "Contact",
      p6: "Questions about these terms can be sent to our support address.",
    },
  },

  demoReviews: {
    service: [
      "The team here couldn't have been more welcoming — genuinely warm from the moment we arrived. Everything was handled with a smile and nothing felt like too much trouble.",
      "Wonderful, attentive service the whole way through. The staff made us feel looked after without ever hovering. It made the visit.",
    ],
    food: [
      "The food was the highlight — fresh, generous, and full of flavour. We left happy and already planning to come back for more.",
      "Every plate that arrived looked and tasted brilliant. Clearly made with care. Hard to fault a single bite.",
    ],
    clean: [
      "Spotless from top to bottom. It's the little details that stood out — everything felt fresh, tidy, and thoughtfully kept.",
      "Impeccably clean and beautifully maintained. You can tell they take real pride in the place.",
    ],
    value: [
      "Excellent value for what you get. Quality well above what we expected for the price — we'd recommend it to anyone.",
      "Genuinely great value. We came away feeling we'd got far more than our money's worth.",
    ],
    location: [
      "Such a lovely spot — the setting alone is worth the trip. Peaceful, scenic, and exactly what we were hoping for.",
      "The location is gorgeous and easy to reach. A perfect little escape from the everyday.",
    ],
    cosy: [
      "A warm, cosy atmosphere that made us want to stay longer. Relaxed, comfortable, and full of character.",
      "Instantly comfortable — the kind of cosy where you settle in and lose track of time. Loved it.",
    ],
  },
} as const;

// Widen literal types ("English" -> string, readonly tuples -> arrays) so other
// language files can satisfy the same shape with translated values.
type DeepWiden<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
  ? readonly DeepWiden<U>[]
  : { [K in keyof T]: DeepWiden<T[K]> };

export type Dictionary = DeepWiden<typeof en>;
export default en;
