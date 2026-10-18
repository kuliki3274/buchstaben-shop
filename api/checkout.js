// Серверная функция (Vercel): получает заказ из конструктора,
// ПЕРЕСЧИТЫВАЕТ цену сама (клиенту не доверяем) и создаёт оплату в Stripe.
// Секретный ключ берётся из настроек Vercel: STRIPE_SECRET_KEY.

import { CONFIG, LETTER_RE, priceFor } from "../config.js";

function flatten(obj, prefix = "", out = []) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}[${k}]` : k;
    if (v === undefined || v === null) continue;
    if (typeof v === "object") flatten(v, key, out);
    else out.push([key, String(v)]);
  }
  return out;
}

export function buildSession(body, origin) {
  const text = String(body?.text || "").toUpperCase();
  if (!text || text.length > CONFIG.maxLetters || !LETTER_RE.test(text)) {
    throw new Error("Bitte gib einen gültigen Namen ein (nur Buchstaben, max. " + CONFIG.maxLetters + ").");
  }
  const colors = Array.isArray(body?.colors) ? body.colors : [];
  if (colors.length !== text.length) throw new Error("Farbauswahl unvollständig.");
  const colorObjs = colors.map((id) => CONFIG.colors.find((c) => c.id === id));
  if (colorObjs.some((c) => !c)) throw new Error("Unbekannte Farbe.");
  const p = priceFor(body?.size, text.length);
  if (!p) throw new Error("Unbekannte Größe.");

  const sameColor = colorObjs.every((c) => c.id === colorObjs[0].id);
  const colorSummary = sameColor
    ? `alle ${colorObjs[0].name}`
    : [...text].map((ch, i) => `${ch}=${colorObjs[i].name}`).join(", ");
  const summary = `${text} | ${p.size.label} | ${colorSummary}`;

  const params = {
    mode: "payment",
    locale: "de",
    line_items: {
      0: {
        quantity: text.length,
        price_data: {
          currency: CONFIG.currency,
          unit_amount: p.size.price,
          product_data: {
            name: `Buchstaben „${text}" · ${p.size.label}`,
            description: `Farben: ${colorSummary}`.slice(0, 500),
          },
        },
      },
    },
    shipping_address_collection: {
      allowed_countries: Object.fromEntries(CONFIG.countries.map((c, i) => [i, c])),
    },
    shipping_options: {
      0: {
        shipping_rate_data: {
          type: "fixed_amount",
          display_name: CONFIG.shipping.label,
          fixed_amount: { amount: CONFIG.shipping.price, currency: CONFIG.currency },
        },
      },
    },
    phone_number_collection: { enabled: "true" },
    custom_fields: {
      0: {
        key: "hinweis",
        type: "text",
        optional: "true",
        label: { type: "custom", custom: "Anmerkung (optional)" },
      },
    },
    payment_intent_data: {
      description: summary.slice(0, 1000),
      metadata: { name: text, groesse: p.size.label, farben: colorSummary.slice(0, 500) },
    },
    metadata: { name: text, groesse: p.size.label, farben: colorSummary.slice(0, 500) },
    success_url: `${origin}/danke.html?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/#konfigurator`,
  };
  return new URLSearchParams(flatten(params));
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return res.status(500).json({ error: "Shop ist noch nicht eingerichtet (Stripe-Schlüssel fehlt)." });

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  let form;
  try {
    const proto = req.headers["x-forwarded-proto"] || "https";
    form = buildSession(body, `${proto}://${req.headers.host}`);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }

  try {
    const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form,
    });
    const data = await r.json();
    if (!r.ok) {
      console.error("Stripe error", data);
      return res.status(502).json({ error: "Zahlung konnte nicht gestartet werden. Bitte versuch es gleich nochmal." });
    }
    return res.status(200).json({ url: data.url });
  } catch (e) {
    console.error(e);
    return res.status(502).json({ error: "Verbindung zu Stripe fehlgeschlagen." });
  }
}
