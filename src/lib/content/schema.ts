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
    "Εξωραϊστικός Σύλλογος «Άγιος Νεκτάριος Βιλίων» — Κιθαιρώνας, Δυτική Αττική.",
  scene: DEFAULT_SCENE,
};

const TICKER =
  "ΚΟΙΝΟΤΗΤΑ — ΙΣΤΟΡΙΑ — ΛΑΟΓΡΑΦΙΑ — ΚΙΘΑΙΡΩΝΑΣ — ΒΙΛΙΑ — ΦΥΣΗ — ΜΝΗΜΗ — ΠΟΛΙΤΙΣΜΟΣ — ";

export const DEFAULT_HOME: HomeContent = {
  hero: {
    metaLeft: "N° 1970",
    metaCenter: "Εξωραϊστικός Σύλλογος Βιλίων",
    metaRight: "650 m alt.",
    titleTop: "ΆΓΙΟΣ",
    titleBottom: "ΝΕΚΤΆΡΙΟΣ",
    intro:
      "Τόπος ησυχίας, μνήμης και κοινότητας στους πρόποδες του Κιθαιρώνα. Δυτική Αττική.",
    ticker: TICKER,
  },
  stats: [
    { value: "1970", label: "Ίδρυση" },
    { value: "372.300", label: "Στρέμματα" },
    { value: "650m", label: "Υψόμετρο" },
    { value: "130+", label: "Κατοικίες" },
  ],
  essence: {
    lineOne: "Ένας τόπος όπου η φύση,",
    lineTwo: "η μνήμη και η κοινότητα",
    lineThree: "μιλούν με ησυχία.",
  },
  settlement: {
    label: "Τοποθεσία",
    title: "Ο Οικισμός Μας",
    paragraphs: [
      "Ο οικισμός βρίσκεται στους πρόποδες του όρους Κιθαιρώνα, απέναντι από το όρος Πατέρα, στη θέση «Μαγκούλεζα» της κτηματικής περιφέρειας του Δήμου Βιλίων, σε υψόμετρο 650–700 μέτρων.",
      "Ιδρύθηκε το 1970 σε έκταση 372.300 στρεμμάτων. Σήμερα αριθμεί πάνω από 130 κατοικίες και αποτελεί έναν ζωντανό οικισμό με αστική τηλεφωνία, ασφαλτοστρωμένους δρόμους και έναν τρισυπόστατο ναό.",
    ],
    moreLabel: "Διαβάστε περισσότερα",
    moreHref: "/readmore-index-center",
    mapEmbedUrl:
      "https://maps.google.gr/maps?hl=el&ie=UTF8&t=h&ll=38.162535,23.291316&spn=0.01181,0.018239&z=15&output=embed",
    mapLinkUrl:
      "https://maps.google.gr/maps?hl=el&ie=UTF8&t=h&ll=38.162535,23.291316&spn=0.01181,0.018239&z=15&source=embed",
  },
  folklore: {
    label: "Λαογραφικά & Ιστορία",
    title: "Τόπος & Μύθος",
    items: [
      { num: "001", title: "Ο Άγιος Νεκτάριος", sub: "Ο προστάτης του τόπου", href: "/Agios_Nektarios" },
      { num: "002", title: "Ο Άγιος Φανούριος", sub: "Λαϊκή παράδοση", href: "/Agios_Fanourios" },
      { num: "003", title: "Η Αγία Μαρίνα", sub: "Τοπική λατρεία", href: "/Agia_Marina" },
      { num: "004", title: "Ο Όσιος Μελέτιος", sub: "Ιστορία & πίστη", href: "/Under-Construction" },
      { num: "005", title: "Ο Ηρακλής", sub: "Μυθολογία Κιθαιρώνα", href: "/Hercules" },
      { num: "006", title: "Οι Ερινύες", sub: "Αρχαία μυθολογία", href: "/The-Furies" },
      { num: "007", title: "Φρούριο Αιγοσθενών", sub: "Αρχαιολογικό μνημείο", href: "/Egosthena_Fortress" },
      { num: "008", title: "Κάστρο Ελευθερών", sub: "Βυζαντινή ιστορία", href: "/Eleftheres_Castle" },
      { num: "009", title: "Ο Κιθαιρώνας", sub: "Το βουνό μας", href: "/Under-Construction" },
    ],
  },
  event: {
    label: "Εκδηλώσεις 2026",
    title: "Κοπή Πίτας",
    text: "Η ετήσια εκδήλωση του Συλλόγου που ενώνει τους οικιστούς και κρατά ζωντανή την παράδοση.",
    linkLabel: "Προσκλητήριο PDF",
    linkHref: "https://www.agiosnektarios.gr/Pita2026.pdf",
    imageUrl: "https://www.agiosnektarios.gr/Pita2026.jpg",
  },
  board: {
    label: "Διοίκηση 2024–2026",
    title: "Διοικητικό Συμβούλιο",
    members: [
      { role: "Πρόεδρος", name: "Μαρία Δεσύπρη" },
      { role: "Αντιπρόεδρος", name: "Γ. Παγώνης - Εβρενέζογλου" },
      { role: "Γεν. Γραμματέας", name: "Περδίκης Χαράλαμπος" },
      { role: "Ταμίας", name: "Παπαμελετίου Αλεξάνδρα" },
    ],
  },
  documents: {
    label: "Έγγραφα",
    title: "Πρακτικά Συλλόγου",
    text: "Ο Εξωραϊστικός Σύλλογος δημοσιεύει τα πρακτικά των συνεδριάσεών του για πλήρη διαφάνεια απέναντι στα μέλη.",
    links: [
      {
        title: "Τελευταίο πρακτικό (23ου ΔΣ)",
        href: "https://www.agiosnektarios.gr/23DS_N1.pdf",
        external: true,
      },
      { title: "Αρχείο πρακτικών", href: "/Documents" },
    ],
  },
  news: {
    label: "Νέα & Ανακοινώσεις",
    title: "Ειδήσεις",
    items: [
      { title: "Πνευματικό & Πολιτιστικό Κέντρο", href: "/PPKnews" },
      { title: "Νέα Τρίκλιτου Ναού", href: "/Church-news" },
      {
        title: "Δήμος Μάνδρας-Ειδυλλίας",
        href: "https://mandras-eidyllias.gr/",
        external: true,
      },
    ],
  },
  contact: {
    label: "Επικοινωνία",
    title: "Συμμετοχή",
    text: "Η φωνή κάθε κατοίκου μετράει. Στείλτε μας τα κείμενα, τις απόψεις και τις προτάσεις σας.",
    email: "agiosnektarios.vilia@gmail.com",
  },
};
