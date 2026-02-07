export const SHIPPING_RULES = {
  currency: "TRY",
  freeShippingThreshold: 3000,
  baseFee: 149,
  regions: [
    {
      key: "marmara",
      label: { tr: "Marmara", en: "Marmara" },
      etaDays: [1, 2],
      cities: ["Istanbul", "Edirne", "Kirklareli", "Tekirdag", "Canakkale", "Balikesir", "Bursa", "Yalova", "Kocaeli", "Sakarya", "Bilecik"],
      carriers: ["Yurtici", "MNG", "Aras"],
    },
    {
      key: "ege",
      label: { tr: "Ege", en: "Aegean" },
      etaDays: [1, 2],
      cities: ["Izmir", "Manisa", "Aydin", "Denizli", "Mugla", "Usak", "Kutahya", "Afyonkarahisar"],
      carriers: ["Yurtici", "MNG"],
    },
    {
      key: "ic-anadolu",
      label: { tr: "Ic Anadolu", en: "Central Anatolia" },
      etaDays: [2, 3],
      cities: ["Ankara", "Konya", "Eskisehir", "Kayseri", "Sivas", "Yozgat", "Kirikkale", "Kirsehir", "Aksaray", "Nigde", "Nevsehir", "Karaman", "Cankiri"],
      carriers: ["Yurtici", "Aras"],
    },
    {
      key: "akdeniz",
      label: { tr: "Akdeniz", en: "Mediterranean" },
      etaDays: [2, 3],
      cities: ["Antalya", "Isparta", "Burdur", "Mersin", "Adana", "Osmaniye", "Hatay", "Kahramanmaras"],
      carriers: ["Yurtici", "MNG", "PTT"],
    },
    {
      key: "karadeniz",
      label: { tr: "Karadeniz", en: "Black Sea" },
      etaDays: [2, 3],
      cities: ["Zonguldak", "Bartin", "Karabuk", "Kastamonu", "Sinop", "Samsun", "Amasya", "Tokat", "Ordu", "Giresun", "Trabzon", "Rize", "Artvin", "Gumushane", "Bayburt", "Bolu", "Duzce", "Corum"],
      carriers: ["Yurtici", "MNG", "PTT"],
    },
    {
      key: "dogu-anadolu",
      label: { tr: "Dogu Anadolu", en: "Eastern Anatolia" },
      etaDays: [2, 3],
      cities: ["Erzurum", "Erzincan", "Agri", "Ardahan", "Bingol", "Bitlis", "Elazig", "Hakkari", "Igdir", "Kars", "Malatya", "Mus", "Tunceli", "Van"],
      carriers: ["Yurtici", "PTT"],
    },
    {
      key: "guneydogu",
      label: { tr: "Guneydogu Anadolu", en: "Southeastern Anatolia" },
      etaDays: [2, 3],
      cities: ["Adiyaman", "Batman", "Diyarbakir", "Gaziantep", "Kilis", "Mardin", "Sanliurfa", "Siirt", "Sirnak"],
      carriers: ["Yurtici", "PTT"],
    },
  ],
  carrierDetails: {
    Yurtici: { code: "yurtici", label: { tr: "Yurtici Kargo", en: "Yurtici Cargo" } },
    MNG: { code: "mng", label: { tr: "MNG Kargo", en: "MNG Cargo" } },
    Aras: { code: "aras", label: { tr: "Aras Kargo", en: "Aras Cargo" } },
    PTT: { code: "ptt", label: { tr: "PTT Kargo", en: "PTT Cargo" } },
  },
};

export const DEFAULT_CARRIER = "Yurtici";
