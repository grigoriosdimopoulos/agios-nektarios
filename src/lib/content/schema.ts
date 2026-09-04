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
  "ΚΟΙΝΟΤΗΤΑ — ΜΝΗΜΗ — ΚΙΘΑΙΡΩΝΑΣ — ΒΙΛΙΑ — ΛΑΟΓΡΑΦΙΑ — ΔΑΣΟΣ — ΠΑΡΑΔΟΣΗ — ΤΟΠΟΣ — ";

export const DEFAULT_HOME: HomeContent = {
  hero: {
    metaLeft: "Από το 1970",
    metaCenter: "Εξωραϊστικός Σύλλογος Βιλίων",
    metaRight: "650 μ. υψόμετρο",
    titleTop: "ΆΓΙΟΣ",
    titleBottom: "ΝΕΚΤΆΡΙΟΣ",
    intro:
      "Στους πρόποδες του Κιθαιρώνα, εκεί όπου το πευκοδάσος ανοίγει και φαίνεται ο κόλπος. Ένας τόπος που τον έφτιαξαν άνθρωποι με τα χέρια τους και τον κρατούν ζωντανό με τη θέλησή τους.",
    ticker: TICKER,
  },
  stats: [
    { value: "1970", label: "Ίδρυση" },
    { value: "650μ", label: "Υψόμετρο" },
    { value: "130+", label: "Κατοικίες" },
    { value: "3", label: "Άγιοι του ναού" },
  ],
  essence: {
    lineOne: "Ένας τόπος που δεν φωνάζει.",
    lineTwo: "Κρατά τη μνήμη του χαμηλόφωνα",
    lineThree: "και την παραδίδει ακέραιη.",
  },
  settlement: {
    label: "Ο τόπος",
    title: "Ο οικισμός μας",
    paragraphs: [
      "Απλώνεται στους πρόποδες του Κιθαιρώνα, απέναντι από το όρος Πατέρα, στη θέση «Μαγκούλεζα» της κτηματικής περιφέρειας των Βιλίων, σε υψόμετρο 650 έως 700 μέτρων. Ο αέρας εδώ είναι άλλος, και τον χειμώνα το χιόνι φτάνει πριν προλάβει να το ανακοινώσει κανείς.",
      "Ιδρύθηκε το 1970. Σήμερα μετρά πάνω από 130 σπίτια, τρισυπόστατο ναό, Πνευματικό και Πολιτιστικό Κέντρο, ασφαλτοστρωμένους δρόμους και έναν πυρήνα μόνιμων κατοίκων. Τίποτε από αυτά δεν χαρίστηκε: όλα έγιναν με συνδρομές, εθελοντική εργασία και επιμονή δεκαετιών.",
    ],
    moreLabel: "Η συνέχεια της ιστορίας",
    moreHref: "/readmore-index-center",
    mapEmbedUrl:
      "https://maps.google.gr/maps?hl=el&ie=UTF8&t=h&ll=38.162535,23.291316&spn=0.01181,0.018239&z=15&output=embed",
    mapLinkUrl:
      "https://maps.google.gr/maps?hl=el&ie=UTF8&t=h&ll=38.162535,23.291316&spn=0.01181,0.018239&z=15&source=embed",
  },
  folklore: {
    label: "Ιστορία & λαογραφία",
    title: "Όσα κουβαλάει αυτό το βουνό",
    items: [
      {
        num: "001",
        title: "Άγιος Νεκτάριος",
        sub: "Ο προστάτης του τόπου",
        href: "/Agios_Nektarios",
      },
      {
        num: "002",
        title: "Άγιος Φανούριος",
        sub: "Αυτός που φανερώνει",
        href: "/Agios_Fanourios",
      },
      {
        num: "003",
        title: "Αγία Μαρίνα",
        sub: "Η παρθενομάρτυς",
        href: "/Agia_Marina",
      },
      {
        num: "004",
        title: "Ο Ηρακλής",
        sub: "Έγινε άντρας στον Κιθαιρώνα",
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
        title: "Φρούριο Αιγοσθένων",
        sub: "Το καλύτερα σωζόμενο κάστρο",
        href: "/Egosthena_Fortress",
      },
      {
        num: "007",
        title: "Κάστρο Ελευθερών",
        sub: "Η γενέτειρα του Διονύσου",
        href: "/Eleftheres_Castle",
      },
      {
        num: "008",
        title: "Ο ναός μας",
        sub: "Πώς χτίστηκε, από ποιους",
        href: "/Church-news",
      },
      {
        num: "009",
        title: "Όσιος Μελέτιος & Κιθαιρώνας",
        sub: "Η σελίδα ετοιμάζεται",
        href: "/Under-Construction",
      },
    ],
  },
  event: {
    label: "Ο κύκλος της χρονιάς",
    title: "Δύο πανηγύρια και μια συνέλευση",
    text:
      "Στις 17 Ιουλίου γιορτάζει η Αγία Μαρίνα, στις 27 Αυγούστου ο Άγιος Φανούριος. Ανάμεσά τους ο οικισμός γεμίζει, ο εσπερινός τελειώνει και τα τραπέζια στήνονται στον προαύλιο χώρο του Πνευματικού Κέντρου. Στα τέλη Αυγούστου συνέρχεται η Γενική Συνέλευση — εκεί κρίνονται όσα θα γίνουν τη νέα χρονιά.",
    linkLabel: "Η τελευταία ανακοίνωση της Γενικής Συνέλευσης",
    linkHref: "http://www.agiosnektarios.gr/Pita2026.pdf",
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
      { title: "Πνευματικό & Πολιτιστικό Κέντρο", href: "/PPKnews" },
      { title: "Ο τρίκλιτος ναός μας", href: "/Church-news" },
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
      "Αυτή η ιστοσελίδα γράφεται από οικιστές, όχι από επαγγελματίες. Αν έχετε κάτι να πείτε, μια μαρτυρία, μια φωτογραφία, μια ένσταση — στείλτε το. Θα δημοσιευθεί.",
    email: "agiosnektarios.vilia@gmail.com",
  },
};
