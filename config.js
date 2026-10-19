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
    { id: "rosa",      name: "Rosa",       hex: "#F2B8C6" },
    { id: "koralle",   name: "Koralle",    hex: "#EC8C7E" },
    { id: "pfirsich",  name: "Pfirsich",   hex: "#F5C7A1" },
    { id: "vanille",   name: "Vanille",    hex: "#F4E3AE" },
    { id: "senf",      name: "Senf",       hex: "#E6C26E" },
    { id: "mint",      name: "Mint",       hex: "#A8D5C2" },
    { id: "salbei",    name: "Salbei",     hex: "#B5C9A3" },
    { id: "petrol",    name: "Petrol",     hex: "#4E8C8C" },
    { id: "himmel",    name: "Himmelblau", hex: "#A9CBE8" },
    { id: "lavendel",  name: "Lavendel",   hex: "#C7B8E3" },
    { id: "weiss",     name: "Weiß",       hex: "#FBF8F3" },
    { id: "hellgrau",  name: "Hellgrau",   hex: "#C9C2BB" },
  ],
  defaultColor: "rosa",
};

// Разрешённые символы: только A–Z (для них есть 3D-модели).
// Умлауты заменяются: Ä→AE, Ö→OE, Ü→UE, ß→SS.
export const LETTER_RE = /^[A-Z]+$/;

const UMLAUTS = { "Ä": "AE", "Ö": "OE", "Ü": "UE", "ẞ": "SS", "ß": "SS" };

export function normalizeText(raw) {
  return String(raw || "")
    .replace(/[ÄÖÜäöüßẞ]/g, (ch) => UMLAUTS[ch.toUpperCase()] || UMLAUTS[ch])
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, CONFIG.maxLetters);
}

export function priceFor(sizeId, letterCount) {
  const size = CONFIG.sizes.find((s) => s.id === sizeId);
  if (!size) return null;
  const letters = size.price * letterCount;
  return { size, letters, shipping: CONFIG.shipping.price, total: letters + CONFIG.shipping.price };
}
