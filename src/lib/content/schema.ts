/** Shape of every editable piece of the site, plus the built-in defaults. */

export type StatItem = { value: string; label: string };
export type LinkItem = {
  num?: string;
  title: string;
  sub?: string;
  href: string;
  external?: boolean;
};
export type BoardMember = { role: string; name: string };

export type HomeContent = {
  hero: {
    metaLeft: string;
    metaCenter: string;
    metaRight: string;
    titleTop: string;
    titleBottom: string;
    intro: string;
    ticker: string;
  };
  stats: StatItem[];
  essence: { lineOne: string; lineTwo: string; lineThree: string };
  settlement: {
    label: string;
    title: string;
    paragraphs: string[];
    moreLabel: string;
    moreHref: string;
    mapEmbedUrl: string;
    mapLinkUrl: string;
  };
  folklore: { label: string; title: string; items: LinkItem[] };
  event: {
    label: string;
    title: string;
    text: string;
    linkLabel: string;
    linkHref: string;
    imageUrl: string;
  };
  board: { label: string; title: string; members: BoardMember[] };
  documents: { label: string; title: string; text: string; links: LinkItem[] };
  news: { label: string; title: string; items: LinkItem[] };
  contact: { label: string; title: string; text: string; email: string };
};

export type PageContent = {
  slug: string;
  title: string;
  html: string;
  updatedAt: string;
  updatedBy: string;
};

export type SceneTimeOverride = "auto" | "dawn" | "day" | "dusk" | "night";
export type SceneWeatherOverride =
  | "auto"
  | "clear"
  | "clouds"
  | "rain"
  | "snow"
  | "fog"
  | "storm";
export type SceneSeasonOverride =
  | "auto"
  | "spring"
  | "summer"
  | "autumn"
  | "winter";

export type SceneSettings = {
  /** Master switch for the living background. */
  enabled: boolean;
  /** 0–1 — how loud the scene is behind the content. */
  intensity: number;
  quality: "auto" | "low" | "medium" | "high";
  /** Pull real conditions from Open-Meteo for the coordinates below. */
  liveWeather: boolean;
  latitude: number;
  longitude: number;
  wildlife: boolean;
  village: boolean;
  holidayThemes: boolean;
  /** Optional uploaded photographs used as parallax plates. */
  plates: { sky: string; far: string; mid: string; near: string };
  override: {
    time: SceneTimeOverride;
    weather: SceneWeatherOverride;
    season: SceneSeasonOverride;
    /** Force a holiday theme for previewing, "" = automatic. */
    holiday: string;
  };
};

export type SiteSettings = {
  siteTitle: string;
  tagline: string;
  email: string;
  footerNote: string;
  scene: SceneSettings;
};

export type MediaItem = {
  key: string;
  name: string;
  url: string;
  contentType: string;
  size: number;
  uploadedAt: string;
};

/** Άγιος Νεκτάριος, Κιθαιρώνας — from the map embed on the home page. */
export const SITE_LATITUDE = 38.162535;
export const SITE_LONGITUDE = 23.291316;

export const DEFAULT_SCENE: SceneSettings = {
  enabled: true,
  intensity: 0.85,
  quality: "auto",
  liveWeather: true,
  latitude: SITE_LATITUDE,
  longitude: SITE_LONGITUDE,
  wildlife: true,
  village: true,
  holidayThemes: true,
  plates: { sky: "", far: "", mid: "", near: "" },
  override: { time: "auto", weather: "auto", season: "auto", holiday: "" },
};

export const DEFAULT_SETTINGS: SiteSettings = {
  siteTitle: "Άγιος Νεκτάριος",
  tagline: "Εξωραϊστικός Σύλλογος Βιλίων",
  email: "agiosnektarios.vilia@gmail.com",
  footerNote:
    "Εξωραϊστικός Σύλλογος «Άγιος Νεκτάριος» Μαγκούλεζας Δήμου Βιλίων. Ο ιστότοπος συντάσσεται από τους οικιστές.",
  scene: DEFAULT_SCENE,
};

const TICKER =
  "ΚΙΘΑΙΡΩΝΑΣ — ΠΕΥΚΟ — ΜΝΗΜΗ — ΒΙΛΙΑ — ΜΥΘΟΣ — ΔΑΣΟΣ — ΚΟΙΝΟΤΗΤΑ — ΒΟΥΝΟ — ";

export const DEFAULT_HOME: HomeContent = {
  hero: {
    metaLeft: "Από το 1970",
    metaCenter: "Εξωραϊστικός Σύλλογος Βιλίων",
    metaRight: "650 μ. υψόμετρο",
    titleTop: "ΆΓΙΟΣ",
    titleBottom: "ΝΕΚΤΆΡΙΟΣ",
    intro:
      "Ένας οικισμός μέσα στο πευκοδάσος, στις νότιες πλαγιές του Κιθαιρώνα. Στο βουνό που ανέθρεψε τον Ηρακλή και που δύο φορές σε πέντε χρόνια το κρατήσαμε από τη φωτιά.",
    ticker: TICKER,
  },
  stats: [
    { value: "1970", label: "Ίδρυση" },
    { value: "650μ", label: "Υψόμετρο" },
    { value: "1.409μ", label: "Κορυφή Κιθαιρώνα" },
    { value: "130+", label: "Κατοικίες" },
  ],
  essence: {
    lineOne: "Πεύκο, ασβεστόλιθος, άνεμος.",
    lineTwo: "Ένα βουνό που καίγεται και ξαναφυτρώνει",
    lineThree: "όσο του αφήνουμε χρόνο.",
  },
  settlement: {
    label: "Ο τόπος",
    title: "Ο οικισμός μας",
    paragraphs: [
      "Απλώνεται στις νότιες πλαγιές του Κιθαιρώνα, απέναντι από το όρος Πατέρα, στη θέση «Μαγκούλεζα» της κτηματικής περιφέρειας των Βιλίων, σε υψόμετρο 650 έως 700 μέτρων και περίπου 58 χιλιόμετρα από την Αθήνα. Γύρω του, από κάθε πλευρά, χαλέπιος πεύκη.",
      "Ιδρύθηκε το 1970, όταν οικοδομικός συνεταιρισμός δημοσίων υπαλλήλων και συνταξιούχων αγόρασε εδώ 372,3 στρέμματα. Σήμερα μετρά πάνω από 130 σπίτια και μερικές δεκάδες μόνιμους κατοίκους που κρατούν τον τόπο ζωντανό και τον χειμώνα. Ασφαλτοστρωμένους δρόμους, Πνευματικό Κέντρο, γήπεδο και ναό δεν τα χάρισε κανείς: τα έφτιαξαν οι ίδιοι οι οικιστές, με συνδρομές και εθελοντική δουλειά.",
    ],
    moreLabel: "Η συνέχεια της ιστορίας",
    moreHref: "/readmore-index-center",
    mapEmbedUrl:
      "https://maps.google.gr/maps?hl=el&ie=UTF8&t=h&ll=38.162535,23.291316&spn=0.01181,0.018239&z=15&output=embed",
    mapLinkUrl:
      "https://maps.google.gr/maps?hl=el&ie=UTF8&t=h&ll=38.162535,23.291316&spn=0.01181,0.018239&z=15&source=embed",
  },
  folklore: {
    label: "Το βουνό, ο μύθος, η μνήμη",
    title: "Όσα κουβαλάει αυτός ο τόπος",
    items: [
      {
        num: "001",
        title: "Ο Κιθαιρώνας",
        sub: "1.409 μέτρα, 840 είδη φυτών",
        href: "/Kithaironas",
      },
      {
        num: "002",
        title: "Το πεύκο",
        sub: "Το δέντρο που περιμένει τη φωτιά",
        href: "/Pefko",
      },
      {
        num: "003",
        title: "Η φωτιά",
        sub: "2021, 2026 — και σε ποιους χρωστάμε",
        href: "/Fotia",
      },
      {
        num: "004",
        title: "Ο Ηρακλής",
        sub: "Έγινε άντρας σε αυτό το βουνό",
        href: "/Hercules",
      },
      {
        num: "005",
        title: "Οι Ερινύες",
        sub: "Πριν από τους νόμους",
        href: "/The-Furies",
      },
      {
        num: "006",
        title: "Ελευθερές",
        sub: "Εδώ γεννήθηκε ο Διόνυσος",
        href: "/Eleftheres_Castle",
      },
      {
        num: "007",
        title: "Φρούριο Αιγοσθενών",
        sub: "Το καλύτερα σωζόμενο κάστρο",
        href: "/Egosthena_Fortress",
      },
      {
        num: "008",
        title: "Ο ναός και οι άγιοί του",
        sub: "Πώς χτίστηκε, από ποιους",
        href: "/Church-news",
      },
    ],
  },
  event: {
    label: "Ο κύκλος της χρονιάς",
    title: "Πώς μετράμε τον χρόνο εδώ",
    text:
      "Την άνοιξη οι πλαγιές γεμίζουν ορχιδέες και ο αέρας μυρίζει ρητίνη. Από την 1η Μαΐου αρχίζει η αντιπυρική περίοδος και τα οικόπεδα πρέπει να είναι καθαρά ως τις 15 Ιουνίου. Τον Ιούλιο και τον Αύγουστο ο οικισμός γεμίζει, γιορτάζουμε και κρατάμε το μάτι μας στον ορίζοντα. Στα τέλη Αυγούστου συνέρχεται η Γενική Συνέλευση. Και μετά τις πρώτες βροχές το βουνό ησυχάζει, ώσπου να χιονίσει.",
    linkLabel: "Τι πρέπει να κάνει κάθε οικιστής",
    linkHref: "/Pyroprostasia",
    imageUrl: "/legacy/oikismos-aeriki.webp",
  },
  board: {
    label: "Διοίκηση",
    title: "Το Διοικητικό Συμβούλιο",
    members: [
      { role: "Πρόεδρος", name: "Μαρία Δεσύπρη" },
      { role: "Αντιπρόεδρος", name: "Γ. Παγώνης - Εβρενέζογλου" },
      { role: "Γεν. Γραμματέας", name: "Περδίκης Χαράλαμπος" },
      { role: "Ταμίας", name: "Παπαμελετίου Αλεξάνδρα" },
    ],
  },
  documents: {
    label: "Διαφάνεια",
    title: "Καταστατικό & πρακτικά",
    text:
      "Κάθε συνεδρίαση του Διοικητικού Συμβουλίου καταγράφεται και δημοσιεύεται. Όποιος στηρίζει τον Σύλλογο δικαιούται να ξέρει τι αποφασίστηκε και γιατί — χωρίς να το ζητήσει.",
    links: [
      { title: "Το αρχείο των πρακτικών", href: "/Documents" },
      {
        title: "Το Καταστατικό του Συλλόγου",
        href: "http://www.agiosnektarios.gr/Association.pdf",
        external: true,
      },
    ],
  },
  news: {
    label: "Νέα & ανακοινώσεις",
    title: "Τι συμβαίνει",
    items: [
      { title: "Πυροπροστασία & χειμώνας — τι πρέπει να κάνουμε", href: "/Pyroprostasia" },
      { title: "Πνευματικό & Πολιτιστικό Κέντρο", href: "/PPKnews" },
      { title: "Η εφημερίδα «Κιθαιρώνας»", href: "/Newspaper" },
      {
        title: "Δήμος Μάνδρας-Ειδυλλίας",
        href: "https://mandras-eidyllias.gr/",
        external: true,
      },
    ],
  },
  contact: {
    label: "Επικοινωνία",
    title: "Ο λόγος σας μετράει",
    text:
      "Αυτή η ιστοσελίδα γράφεται από οικιστές, όχι από επαγγελματίες. Αν έχετε κάτι να πείτε, μια μαρτυρία από τις μέρες της φωτιάς, μια φωτογραφία, μια ένσταση — στείλτε το. Θα δημοσιευθεί.",
    email: "agiosnektarios.vilia@gmail.com",
  },
};
