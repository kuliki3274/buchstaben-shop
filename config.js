// =====================================================================
//  НАСТРОЙКИ МАГАЗИНА — меняйте только здесь.
//  Цены в ЦЕНТАХ: 900 = 9,00 €.
//  Этот файл читают и сайт, и оплата — цена всегда считается одинаково.
// =====================================================================

export const CONFIG = {
  shopName: "KulikWerk",          // название магазина
  currency: "eur",
  maxLetters: 12,                        // максимум букв в одном заказе
  productionTime: "3–10 Werktage",       // срок изготовления

  // Размеры (высота буквы) и цена ЗА ОДНУ БУКВУ
  sizes: [
    { id: "s", label: "11 cm", price: 360 },
    { id: "m", label: "13 cm", price: 410 },
    { id: "l", label: "15 cm", price: 500 },
  ],
  defaultSize: "m",

  // Доставка (одна фиксированная цена за заказ)
  shipping: { label: "DHL Paket", price: 490 },
  // Страны, куда отправляете (коды ISO)
  countries: ["DE", "AT"],

  // Цвета: id (латиница, без пробелов), название, цвет для превью
  colors: [
    { id: "rosa",      name: "Rosa",       hex: "#F3AFC0" },
    { id: "koralle",   name: "Koralle",    hex: "#EE8676" },
    { id: "pfirsich",  name: "Pfirsich",   hex: "#F6C29C" },
    { id: "vanille",   name: "Vanille",    hex: "#F3DE98" },
    { id: "senf",      name: "Senf",       hex: "#DDAE45" },
    { id: "mint",      name: "Mint",       hex: "#9ED6C0" },
    { id: "salbei",    name: "Salbei",     hex: "#ADC09A" },
    { id: "petrol",    name: "Petrol",     hex: "#3E8789" },
    { id: "himmel",    name: "Himmelblau", hex: "#9FC8E8" },
    { id: "lavendel",  name: "Lavendel",   hex: "#C2B1E3" },
    { id: "weiss",     name: "Weiß",       hex: "#FBF8F3" },
    { id: "hellgrau",  name: "Hellgrau",   hex: "#BDB8B2" },
  ],
  defaultColor: "rosa",
};

// Разрешённые символы: латиница + немецкие умлауты
export const LETTER_RE = /^[A-ZÄÖÜ]+$/;

export function normalizeText(raw) {
  return String(raw || "")
    .toUpperCase()
    .replace(/[^A-ZÄÖÜ]/g, "")
    .slice(0, CONFIG.maxLetters);
}

export function priceFor(sizeId, letterCount) {
  const size = CONFIG.sizes.find((s) => s.id === sizeId);
  if (!size) return null;
  const letters = size.price * letterCount;
  return { size, letters, shipping: CONFIG.shipping.price, total: letters + CONFIG.shipping.price };
}
