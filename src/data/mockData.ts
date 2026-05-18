export type ShipmentStatus = "Новая" | "Выкуплена" | "В пути" | "На складе" | "Ожидает оплату" | "Закрыта";

export type EuropeCurrency = "EUR" | "PLN";

export type ShipmentItem = {
  name: string;
  country: string;
  status: ShipmentStatus;
  purchase: number;
  delivery: number;
  extra: number;
  cost: number;
  sale: number;
  paid: number;
  profit: number;
  rate?: number;
  foreign?: number;
  byn?: number;
  local?: number;
  dest?: number;
  method?: "" | "Авиа" | "Машина";
  weight?: number;
  kg?: number;
  europeCurrency?: EuropeCurrency;
  commission?: number;
  photoCheck?: number;
  customsValueEur?: number;
  customsRate?: number;
};

export type Shipment = {
  id?: string;
  template?: TemplateName;
  name: string;
  source: string;
  date: string;
  createdAt?: string;
  status: ShipmentStatus;
  items: number;
  revenue: number;
  paid: number;
  spent: number;
  delivery: number;
  profit: number;
  details: ShipmentItem[];
};

export type TemplateName = "Europe" | "Китай" | "Япония" | "Свой шаблон";

export type TemplatePreset = {
  title: TemplateName;
  icon: string;
  desc: string;
  savedId?: string;
  savedTitle?: string;
  userTemplate?: boolean;
};

export type ItemPreset = {
  country: string;
  product: string;
  rate: number;
  foreign: number;
  byn: number;
  local: number;
  dest: number;
  method: "" | "Авиа" | "Машина";
  weight: number;
  kg: number;
  extra: number;
  commission: number;
  photoCheck: number;
  customsValueEur: number;
  customsRate: number;
};

export const shipments: Shipment[] = [
  {
    name: "Europe Drop",
    source: "Europe",
    date: "Сегодня",
    createdAt: new Date().toISOString(),
    status: "В пути",
    items: 5,
    revenue: 4250,
    paid: 2500,
    spent: 3680,
    delivery: 520,
    profit: 570,
    details: [
      { name: "Nike ACG Jacket", country: "Europe", status: "В пути", purchase: 1180, delivery: 120, extra: 40, cost: 1340, sale: 1650, paid: 1000, profit: 310 },
      { name: "Carhartt Shoulder Bag", country: "Europe", status: "В пути", purchase: 620, delivery: 80, extra: 20, cost: 720, sale: 980, paid: 500, profit: 260 },
      { name: "Stone Island Knit", country: "Europe", status: "В пути", purchase: 880, delivery: 110, extra: 60, cost: 1050, sale: 1180, paid: 650, profit: 130 },
      { name: "Adidas Spezial", country: "Europe", status: "В пути", purchase: 370, delivery: 95, extra: 25, cost: 490, sale: 440, paid: 350, profit: -50 },
      { name: "Arc'teryx Cap", country: "Europe", status: "В пути", purchase: 200, delivery: 115, extra: 15, cost: 330, sale: 0, paid: 0, profit: -330 }
    ]
  },
  {
    name: "Japan Archive Pack",
    source: "Япония",
    date: "Вчера",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    status: "Закрыта",
    items: 3,
    revenue: 2800,
    paid: 2800,
    spent: 2140,
    delivery: 300,
    profit: 660,
    details: [
      { name: "Yeezy 700 V3", country: "Япония", status: "Закрыта", purchase: 882, delivery: 140, extra: 120, cost: 1142, sale: 2250, paid: 2250, profit: 1108 },
      { name: "Bape Tee", country: "Япония", status: "Закрыта", purchase: 420, delivery: 80, extra: 30, cost: 530, sale: 350, paid: 350, profit: -180 },
      { name: "Porter Wallet", country: "Япония", status: "Закрыта", purchase: 388, delivery: 80, extra: 0, cost: 468, sale: 200, paid: 200, profit: -268 }
    ]
  },
  {
    name: "China Outerwear",
    source: "Китай",
    date: "12 апр",
    createdAt: new Date(new Date().getFullYear(), 3, 12, 12).toISOString(),
    status: "На складе",
    items: 7,
    revenue: 3980,
    paid: 2000,
    spent: 3280,
    delivery: 460,
    profit: 700,
    details: [
      { name: "Nike ACG Jacket", country: "Китай", status: "На складе", purchase: 980, delivery: 120, extra: 60, cost: 1160, sale: 1450, paid: 800, profit: 290 },
      { name: "TNF Puffer", country: "Китай", status: "На складе", purchase: 760, delivery: 95, extra: 45, cost: 900, sale: 1180, paid: 500, profit: 280 },
      { name: "Carhartt Pants", country: "Китай", status: "На складе", purchase: 520, delivery: 70, extra: 20, cost: 610, sale: 700, paid: 300, profit: 90 },
      { name: "Stussy Hoodie", country: "Китай", status: "На складе", purchase: 430, delivery: 65, extra: 15, cost: 510, sale: 650, paid: 400, profit: 140 },
      { name: "Accessories pack", country: "Китай", status: "На складе", purchase: 230, delivery: 45, extra: 0, cost: 275, sale: 0, paid: 0, profit: -275 },
      { name: "Cargo pants", country: "Китай", status: "На складе", purchase: 210, delivery: 35, extra: 0, cost: 245, sale: 0, paid: 0, profit: -245 },
      { name: "Beanie pack", country: "Китай", status: "На складе", purchase: 150, delivery: 20, extra: 0, cost: 170, sale: 0, paid: 0, profit: -170 }
    ]
  },
  {
    name: "Europe Sneakers",
    source: "Europe",
    date: "10 апр",
    createdAt: new Date(new Date().getFullYear(), 3, 10, 12).toISOString(),
    status: "Ожидает оплату",
    items: 4,
    revenue: 3400,
    paid: 1500,
    spent: 2860,
    delivery: 380,
    profit: 540,
    details: [
      { name: "New Balance 2002R", country: "Europe", status: "Ожидает оплату", purchase: 890, delivery: 90, extra: 20, cost: 1000, sale: 1300, paid: 500, profit: 300 },
      { name: "Adidas Samba", country: "Europe", status: "Ожидает оплату", purchase: 640, delivery: 80, extra: 30, cost: 750, sale: 980, paid: 500, profit: 230 },
      { name: "Nike Vomero", country: "Europe", status: "Ожидает оплату", purchase: 710, delivery: 110, extra: 40, cost: 860, sale: 1120, paid: 500, profit: 260 },
      { name: "Asics Gel", country: "Europe", status: "Ожидает оплату", purchase: 170, delivery: 100, extra: -20, cost: 250, sale: 0, paid: 0, profit: -250 }
    ]
  }
];

export const templates: TemplatePreset[] = [
  { title: "Europe", icon: "EU", desc: "BYN, курс, евро, доп. расходы, доставка по стране в € и до пункта в BYN" },
  { title: "Китай", icon: "CN", desc: "BYN, курс, юани, доставка по Китаю, авиа/машина и цена за кг" },
  { title: "Япония", icon: "JP", desc: "Йена, курс, комиссия, фото/проверка, доставка, таможня и продажа" },
  { title: "Свой шаблон", icon: "+", desc: "Изменяемый шаблон со своим названием и базовыми полями" }
];

export const presets: Record<TemplateName, ItemPreset> = {
  Europe: { country: "Europe", product: "Nike ACG Jacket", rate: 3.45, foreign: 980, byn: 3381, local: 12, dest: 140, method: "", weight: 0, kg: 0, extra: 120, commission: 0, photoCheck: 0, customsValueEur: 0, customsRate: 3.55 },
  Китай: { country: "Китай", product: "Nike ACG Jacket", rate: 0.128, foreign: 980, byn: 0, local: 35, dest: 0, method: "Авиа", weight: 1.2, kg: 95, extra: 120, commission: 0, photoCheck: 0, customsValueEur: 0, customsRate: 3.55 },
  Япония: { country: "Япония", product: "Yeezy 700 V3", rate: 0.021, foreign: 42000, byn: 0, local: 0, dest: 140, method: "", weight: 0, kg: 0, extra: 0, commission: 500, photoCheck: 0, customsValueEur: 0, customsRate: 3.55 },
  "Свой шаблон": { country: "Manual", product: "Новый товар", rate: 1, foreign: 0, byn: 0, local: 0, dest: 0, method: "", weight: 0, kg: 0, extra: 0, commission: 0, photoCheck: 0, customsValueEur: 0, customsRate: 3.55 }
};

export const navItems = [
  ["dashboard", "DB", "Главная"],
  ["shipments", "DL", "Сделки"],
  ["new", "+", "Новая сделка"],
  ["templates", "TP", "Шаблоны"],
  ["tools", "TL", "Утилиты"],
  ["settings", "ST", "Настройки"]
] as const;
