import type { Dictionary } from "./en";

const fr: Dictionary = {
  common: {
    getInTouch: "Contactez-nous",
    tryDemo: "Essayer la démo en direct",
    brandNote: "Reviewslip aide uniquement les vrais clients à rédiger leurs propres avis.",
  },

  selectors: {
    language: "Langue",
    country: "Pays",
  },

  nav: {
    howItWorks: "Comment ça marche",
    features: "Fonctionnalités",
    pricing: "Tarifs",
    trust: "Confiance",
    demo: "Démo en direct",
    contact: "Contact",
  },

  footer: {
    blurb: "Aidez vos clients satisfaits à laisser un véritable avis Google en quelques secondes.",
    colProduct: "Produit",
    colCompany: "Entreprise",
    colGetStarted: "Commencer",
    complianceTrust: "Conformité et confiance",
    privacy: "Confidentialité",
    terms: "Conditions",
    rights: "© {year} Reviewslip. Tous droits réservés.",
  },

  home: {
    heroEyebrow: "De vrais avis, en toute simplicité",
    heroTitleLead: "Transformez vos belles visites en",
    heroTitleEm: "avis 5 étoiles.",
    heroLede:
      "Reviewslip aide vos clients satisfaits à rédiger et publier un véritable avis Google en quelques secondes. Ils scannent, sélectionnent ce qu'ils ont aimé et partagent — avec leurs propres mots.",
    heroNote: "Jamais de faux avis. Uniquement de vrais clients, avec leurs propres mots.",

    proofRating: "La confiance de l'hôtellerie et des commerces de proximité",
    proofBuiltFor: "Conçu pour les cafés, gîtes, salons, cliniques et bien plus",

    howEyebrow: "Comment ça marche",
    howTitle: "Trois taps entre la visite et l'avis.",
    steps: [
      {
        title: "Scanner",
        body: "Votre client satisfait scanne un QR code et arrive sur votre fiche d'avis personnalisée.",
      },
      {
        title: "Rédiger",
        body: "Il sélectionne ce qui l'a marqué ; Reviewslip rédige un court et véritable avis 5 étoiles qu'il peut modifier.",
      },
      {
        title: "Publier",
        body: "Un tap le copie et ouvre votre fiche Google. L'avis est publié en quelques secondes.",
      },
    ],

    featuresEyebrow: "Fonctionnalités",
    featuresTitle: "Tout ce qu'il vous faut pour obtenir plus d'avis authentiques.",
    features: [
      {
        title: "Un QR code au moment qui compte",
        body: "Placez une fiche sur la table, le reçu ou dans la chambre. Un simple scan ouvre votre page d'avis personnalisée — aucune application à télécharger.",
      },
      {
        title: "Des brouillons adaptés à votre établissement",
        body: "L'IA rédige dans votre ton en utilisant uniquement des détails réels et sûrs sur votre établissement. Les clients choisissent ce qu'ils ont aimé ; nous le formulons.",
      },
      {
        title: "Un tap vers Google",
        body: "Copiez le brouillon et ouvrez instantanément votre page d'avis Google. Moins d'abandons entre l'envie de laisser un avis et sa publication.",
      },
      {
        title: "Régénérer pour trouver les bons mots",
        body: "Pas tout à fait ça ? Un simple tap propose une nouvelle formulation, pour que chaque avis ressemble au client, et non à un modèle.",
      },
      {
        title: "Uniquement de vrais clients",
        body: "Pas de génération en masse, pas de faux comptes. Un brouillon par visite authentique — conçu pour vous garder du bon côté des règles des plateformes.",
      },
      {
        title: "Votre établissement, votre message",
        body: "Personnalisez les catégories et le ton pour chaque emplacement, afin que chaque brouillon semble provenir de votre établissement.",
      },
    ],

    metrics: [
      { value: "3×", label: "d'avis en plus des mêmes clients satisfaits*" },
      { value: "20s", label: "de temps moyen entre le scan et la publication de l'avis*" },
      { value: "4.9★", label: "moyenne typique des avis assistés*" },
    ],
    metricsFootnote:
      "*Chiffres illustratifs — de véritables références seront publiées au lancement.",

    pricingEyebrow: "Tarifs",
    pricingTitle: "Des offres simples qui évoluent avec vous.",
    pricingCompare: "Voir la comparaison complète des offres →",

    trustEyebrow: "Conformité et confiance",
    trustTitle: "Honnête par conception.",
    trustLede:
      "La FTC et toutes les grandes plateformes interdisent les faux avis et les avis fabriqués par IA. Reviewslip est conçu à l'opposé : il aide uniquement un vrai client à exprimer une véritable opinion. Pas de bots, pas de masse, pas de détails inventés.",
    trustCta: "Découvrir notre approche de la conformité",

    faqEyebrow: "Questions",
    faqTitle: "Questions fréquentes.",
    faq: [
      {
        q: "N'est-ce pas simplement de faux avis ?",
        a: "Non — et c'est tout l'intérêt. Reviewslip aide uniquement un vrai client qui vient de vivre une véritable expérience à mettre ses propres pensées en mots. Il n'y a aucune génération en masse ni aucune publication au nom de quiconque. Le client rédige, modifie et publie lui-même.",
      },
      {
        q: "Est-ce autorisé par les politiques de Google et les règles de la FTC ?",
        a: "Aider un vrai client à rédiger son propre avis honnête est permis. Fabriquer des avis, les inciter ou en publier de faux ne l'est pas — et Reviewslip est spécialement conçu pour éviter tout cela. Consultez notre page Conformité et confiance pour plus de détails.",
      },
      {
        q: "Quelles plateformes d'avis sont prises en charge ?",
        a: "Les avis Google au lancement. C'est là que la plupart des commerces de proximité constatent le plus grand impact. D'autres plateformes pourront suivre en fonction de la demande.",
      },
      {
        q: "Combien de temps prend la configuration ?",
        a: "Quelques minutes. Nous ajoutons votre établissement et votre lien d'avis Google, ajustons les catégories et le ton à votre activité, et vous remettons un QR code prêt à être placé.",
      },
      {
        q: "Ai-je besoin de ma propre clé IA ?",
        a: "Non. La génération des avis est prise en charge pour vous et incluse dans chaque offre.",
      },
    ],

    ctaTitle: "Vos clients les plus satisfaits n'attendent que de s'exprimer.",
    ctaLede: "Offrez-leur le moyen le plus simple de le dire.",
  },

  pricing: {
    eyebrow: "Tarifs",
    title: "Des offres qui évoluent avec vous.",
    lede: "Commencez modestement avec un seul emplacement. Développez-vous à mesure que davantage de vos clients satisfaits laissent des avis.",
    disclaimer: "Les tarifs affichés sont provisoires pendant que nous finalisons les offres.",
    monthly: "Mensuel",
    yearly: "Annuel",
    savings: "2 mois offerts",
    billedAnnually: "Facturé annuellement · 2 mois offerts",
    mostPopular: "Le plus populaire",
    perMonth: "/mois",
    perYear: "/an",
    free: "Gratuit",
    custom: "Sur mesure",
    faqTitle: "Questions sur les tarifs",
    faq: [
      {
        q: "Les tarifs sont-ils définitifs ?",
        a: "Pas encore — les chiffres affichés sont provisoires pendant que nous finalisons les offres. Les niveaux et les fonctionnalités correspondent globalement à ce qui est prévu ; les tarifs définitifs seront confirmés avant le lancement.",
      },
      {
        q: "Qu'est-ce qui compte comme une génération ?",
        a: "Chaque fois que l'application rédige un avis pour un client compte comme une génération. Régénérer pour obtenir une nouvelle formulation au cours de la même session utilise aussi votre quota, mais les limites restent généreuses.",
      },
      {
        q: "Puis-je changer d'offre plus tard ?",
        a: "Oui. Contactez-nous simplement et nous vous ferons passer à une offre supérieure ou inférieure quand vous le souhaitez.",
      },
      {
        q: "Quelle est la différence entre les offres ?",
        a: "Uniquement le nombre d'établissements que vous pouvez gérer — 1 avec Starter, jusqu'à 3 avec Pro et jusqu'à 10 avec Business. Chaque offre inclut les mêmes fonctionnalités ; vous ne payez plus qu'en ajoutant des emplacements.",
      },
    ],
  },

  plans: {
    starterName: "Starter",
    starterTagline: "Pour un établissement unique qui débute.",
    proName: "Pro",
    proTagline: "Pour les entreprises en croissance avec quelques établissements.",
    businessName: "Business",
    businessTagline: "Pour les entreprises multi-établissements.",
    cta: "Contactez-nous",
    features: {
      venues1: "1 établissement",
      venues3: "Jusqu'à 3 établissements",
      venues10: "Jusqu'à 10 établissements",
      qr: "QR code + lien d'avis partageable",
      drafts: "Brouillons d'avis assistés par IA",
      oneTap: "Copier et publier sur Google en un tap",
      branding: "Marque Reviewslip sur la fiche",
    },
  },

  how: {
    eyebrow: "Comment ça marche",
    title: "Trois taps entre la visite et l'avis.",
    lede: "Reviewslip supprime les frictions entre un client satisfait et l'avis qu'il comptait laisser — sans jamais en rédiger un faux.",
    steps: [
      {
        title: "Placez votre QR code",
        body: "Ajoutez un QR code Reviewslip à vos reçus, chevalets de table, chambres ou écran de paiement. Chaque code renvoie vers une fiche d'avis personnalisée pour cet emplacement précis.",
      },
      {
        title: "Le client scanne",
        body: "Aucune application à installer. La fiche s'ouvre dans son navigateur, l'accueille au nom de votre établissement et lui pose une question simple : qu'est-ce qui vous a marqué ?",
      },
      {
        title: "Il choisit ce qu'il a aimé",
        body: "Le client sélectionne quelques éléments qu'il a réellement appréciés — un service chaleureux, une excellente cuisine, un cadre agréable. Ceux-ci deviennent la base honnête de l'avis.",
      },
      {
        title: "Reviewslip le rédige",
        body: "En une ou deux secondes, un court avis 5 étoiles naturel apparaît dans le ton de votre établissement — en utilisant uniquement des détails réels et sûrs. Le client peut modifier chaque mot.",
      },
      {
        title: "Un tap pour publier",
        body: "Il copie le brouillon et accède à votre page d'avis Google. L'avis est le sien, avec ses mots, publié depuis son compte.",
      },
    ],
    demoNote: "Un aperçu fonctionnel — appuyez sur les puces et générez un brouillon vous-même.",
  },

  compliance: {
    eyebrow: "Conformité et confiance",
    title: "Honnête par conception.",
    lede: "Les faux avis sont illégaux et contraires aux règles de toutes les plateformes. Reviewslip est conçu de fond en comble pour faire l'inverse : aider de vrais clients à partager de vraies opinions, plus rapidement.",
    calloutLead: "En bref :",
    callout:
      "Reviewslip ne rédige jamais de faux avis, ne publie jamais au nom d'un client et ne génère jamais d'avis en masse. Un vrai client, après une véritable visite, est aidé à formuler son propre avis honnête — et le publie lui-même.",
    h1: "Les règles autour desquelles nous concevons",
    p1: "En 2024, la Federal Trade Commission des États-Unis a finalisé une règle interdisant les faux avis et les avis fabriqués par IA, les avis incités non divulgués et d'autres pratiques trompeuses, avec des sanctions par infraction. Google, Yelp, Trustpilot et d'autres interdisent depuis longtemps les mêmes pratiques. Ces règles existent pour de bonnes raisons, et nous les prenons au sérieux.",
    h2: "Comment Reviewslip reste conforme",
    list: [
      "Vrai client, véritable expérience. L'outil est destiné à être utilisé dans votre établissement par une personne qui l'a réellement visité.",
      "Le client est l'auteur. Il choisit ce qu'il souhaite mettre en avant, modifie librement le brouillon et le publie depuis son propre compte. Nous ne publions jamais à sa place.",
      "Aucun détail inventé. Les instructions sont limitées à des détails sûrs et véridiques sur votre établissement — l'IA ne peut pas inventer de faits, d'événements ou d'affirmations.",
      "Aucune publication en masse ou automatisée. Un brouillon par session authentique. Il n'existe aucun moyen de générer ou de soumettre des avis en masse.",
      "Aucune incitation intégrée. Reviewslip n'offre ni n'encourage de récompenses en échange d'avis.",
    ],
    h3: "Ce que Reviewslip n'est pas",
    p3: "Ce n'est pas une ferme à avis, un réseau de bots ni un moyen d'acheter des étoiles. Si c'est ce que vous recherchez, Reviewslip n'est pas l'outil — et honnêtement, ces approches feront pénaliser votre fiche.",
    h4: "Votre responsabilité",
    p4Lead: "Vous vous engagez à utiliser Reviewslip uniquement avec de vrais clients et conformément aux politiques des plateformes d'avis et à la loi applicable. Tous les détails figurent dans nos ",
    p4Link: "Conditions d'utilisation",
    p4End: ".",
    disclaimer:
      "Cette page est un résumé en langage clair, et non un conseil juridique. Consultez les directives actuelles de la FTC et les politiques de chaque plateforme pour votre juridiction.",
  },

  demo: {
    eyebrow: "Démo en direct",
    title: "Constatez-le par vous-même.",
    lede: "Voici la fiche destinée au client, exactement telle que vos visiteurs la verraient. Sélectionnez ce qui vous a marqué et générez un brouillon. C'est un aperçu sûr — rien n'est publié où que ce soit.",
    note: "Les brouillons de démo sont des exemples préenregistrés afin que cette page ne nécessite aucune clé IA. Dans le produit réel, les brouillons sont générés en direct et adaptés à votre établissement.",
    cta: "Configurer cela pour mon établissement",
  },

  contact: {
    eyebrow: "Contactez-nous",
    title: "Mettons-vous en route.",
    lede: "Parlez-nous de votre établissement et nous vous aiderons à commencer à transformer vos clients satisfaits en véritables avis Google.",
    h1: "Écrivez-nous",
    p1: "Le moyen le plus rapide de nous joindre est l'e-mail. Indiquez-nous le nom de votre établissement, environ combien d'emplacements vous avez et ce que vous espérez — nous nous occupons du reste.",
    button: "Écrire à {email}",
    calloutLead: "Une promesse rapide :",
    callout:
      "Reviewslip aide uniquement les vrais clients à rédiger leurs propres avis. Nous ne faisons pas d'avis faux, en masse ou automatisés — consultez notre page Conformité et confiance.",
    demoNote: "Voici la fiche que vos clients verraient. Essayez-la.",
    demoVenue: "Votre établissement",
  },

  slip: {
    thanks: "Merci de votre visite.",
    prompt: "Qu'est-ce qui vous a marqué ?",
    fiveStars: "Cinq étoiles",
    placeholder: "Choisissez ce que vous avez aimé, puis générez un brouillon.",
    generate: "Générer mon avis",
    writing: "Rédaction…",
    regenerate: "Régénérer",
    copy: "Copier",
    copied: "Copié ✓",
    proceed: "Continuer vers Google",
    categories: {
      service: "Service chaleureux",
      food: "Excellente cuisine",
      clean: "Impeccable et soigné",
      value: "Bon rapport qualité-prix",
      location: "Cadre agréable",
      cosy: "Ambiance chaleureuse",
    },
  },

  legal: {
    lastUpdated: "Dernière mise à jour : modèle provisoire",
    placeholderLead: "Provisoire.",
    placeholder:
      "Ceci est une trame de modèle, et non une politique définitive. Faites-la relire par un professionnel qualifié avant le lancement.",
    privacy: {
      eyebrow: "Mentions légales",
      title: "Politique de confidentialité",
      s1: "Qui nous sommes",
      p1: "Reviewslip (« nous ») fournit un outil qui aide les entreprises à inviter de vrais clients à rédiger et publier leurs propres avis.",
      s2: "Ce que nous collectons",
      list2: [
        "Les données de compte des utilisateurs professionnels (nom, e-mail, organisation).",
        "La configuration de l'établissement que vous fournissez (nom de l'entreprise, lien d'avis).",
        "L'utilisation agrégée et non identifiante de la fiche d'avis (par ex. le nombre de brouillons générés et copiés).",
        "Les informations de facturation traitées par notre prestataire de paiement.",
      ],
      s3: "Ce que nous ne faisons pas",
      p3: "Nous ne vendons pas vos données. Nous ne collectons pas d'informations personnelles auprès de vos clients finaux via la fiche d'avis, et nous ne publions pas d'avis au nom de quiconque.",
      s4: "Sous-traitants de données",
      p4: "Nous faisons appel à des tiers pour l'hébergement, l'authentification, les paiements et la génération par IA. Chacun ne traite les données que dans la mesure nécessaire à la fourniture du service.",
      s5: "Vos droits",
      p5: "Vous pouvez accéder à vos données de compte, les corriger ou les supprimer. Contactez-nous pour faire une demande.",
      s6: "Contact",
      p6: "Les questions concernant cette politique peuvent être envoyées à notre adresse d'assistance.",
    },
    terms: {
      eyebrow: "Mentions légales",
      title: "Conditions d'utilisation",
      s1: "Utilisation acceptable",
      p1Lead:
        "Vous vous engagez à utiliser Reviewslip uniquement pour inviter de vrais clients ayant vécu une véritable expérience avec votre établissement à rédiger leurs propres avis honnêtes. Vous respecterez les règles de la FTC sur les avis ainsi que les politiques de toute plateforme vers laquelle vous dirigez les clients. Consultez notre page ",
      p1Link: "Conformité et confiance",
      p1End: ".",
      s2: "Conduite interdite",
      list2: [
        "Générer ou publier des avis faux, fabriqués ou en masse.",
        "Offrir des incitations en échange d'avis.",
        "Se faire passer pour des clients ou publier en leur nom.",
        "Utiliser le service pour enfreindre une loi ou une politique de plateforme.",
      ],
      p2: "Nous pouvons suspendre ou résilier les comptes qui abusent du service.",
      s3: "Offres et facturation",
      p3: "Les offres sont convenues directement avec nous. Vous êtes responsable de la manière dont le service est utilisé pour votre établissement. Les tarifs ne sont pas encore définitifs et peuvent changer avant la disponibilité générale.",
      s4: "Service « en l'état »",
      p4: "Le service est fourni en l'état, sans garanties. Nous ne sommes pas responsables de la manière dont les avis affectent vos fiches ni des actions entreprises par les plateformes d'avis.",
      s5: "Modifications",
      p5: "Nous pouvons mettre à jour ces conditions ; la poursuite de l'utilisation après modifications vaut acceptation.",
      s6: "Contact",
      p6: "Les questions concernant ces conditions peuvent être envoyées à notre adresse d'assistance.",
    },
  },

  demoReviews: {
    service: [
      "L'équipe n'aurait pas pu être plus accueillante — sincèrement chaleureuse dès notre arrivée. Tout a été géré avec le sourire et rien ne semblait poser problème.",
      "Un service merveilleux et attentionné du début à la fin. Le personnel nous a fait nous sentir bien pris en charge sans jamais être envahissant. Cela a fait toute la visite.",
    ],
    food: [
      "La cuisine était le point fort — fraîche, généreuse et pleine de saveurs. Nous sommes repartis ravis et prévoyons déjà de revenir pour en profiter davantage.",
      "Chaque assiette qui arrivait était magnifique et délicieuse. Manifestement préparée avec soin. Difficile de reprocher la moindre bouchée.",
    ],
    clean: [
      "Impeccable de haut en bas. Ce sont les petits détails qui se remarquent — tout semblait frais, soigné et entretenu avec attention.",
      "Impeccablement propre et magnifiquement entretenu. On sent qu'ils sont réellement fiers de l'endroit.",
    ],
    value: [
      "Un excellent rapport qualité-prix pour ce que l'on obtient. Une qualité bien supérieure à ce que nous attendions pour le prix — nous le recommanderions à tout le monde.",
      "Un rapport qualité-prix vraiment excellent. Nous sommes repartis avec le sentiment d'en avoir eu bien plus que pour notre argent.",
    ],
    location: [
      "Un endroit si charmant — le cadre à lui seul vaut le déplacement. Paisible, pittoresque et exactement ce que nous espérions.",
      "L'emplacement est magnifique et facile d'accès. Une parfaite petite évasion du quotidien.",
    ],
    cosy: [
      "Une ambiance chaleureuse et cosy qui nous a donné envie de rester plus longtemps. Détendue, confortable et pleine de caractère.",
      "Immédiatement confortable — le genre de cocon où l'on s'installe et où l'on perd la notion du temps. Nous avons adoré.",
    ],
  },
};

export default fr;
