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

  // Цвета = филаменты Bambu Lab, из которых печатаются буквы.
  // id (латиница, без пробелов), название для покупателя, цвет для превью.
  // hex — официальные коды Bambu Lab; в комментарии — точное название филамента.
  colors: [
    { id: "babyblau",     name: "Babyblau",    hex: "#A4DBE8" }, // PLA Pure  · Baby Blue
    { id: "milchrosa",    name: "Milchrosa",   hex: "#F7CED7" }, // PLA Pure  · Milky Pink
    { id: "eisblau",      name: "Eisblau",     hex: "#A3D8E1" }, // PLA Matte · Ice Blue
    { id: "sakurarosa",   name: "Sakura-Rosa", hex: "#E8AFCF" }, // PLA Matte · Sakura Pink
    { id: "aprikose",     name: "Aprikose",    hex: "#FFB673" }, // PLA Pure  · Apricot
    { id: "fliederlila",  name: "Fliederlila", hex: "#AE96D4" }, // PLA Matte · Lilac Purple
    { id: "apfelgruen",   name: "Apfelgrün",   hex: "#C2E189" }, // PLA Matte · Apple Green
    { id: "aschgrau",     name: "Aschgrau",    hex: "#9B9EA0" }, // PLA Matte · Ash Gray
    { id: "wuestengelb",  name: "Wüstengelb",  hex: "#E8DBB7" }, // PLA Matte · Desert Tan
  ],
  defaultColor: "milchrosa",
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
