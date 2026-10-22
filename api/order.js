// Серверная функция (Vercel): страница «Danke» спрашивает, оплачен ли заказ и на какую сумму,
// чтобы отправить в Meta событие Purchase с настоящей суммой из Stripe.
// Если посетитель согласился на cookie и в Vercel есть META_CAPI_TOKEN, та же покупка уходит
// в Meta ещё и с сервера (Conversions API) — с зашифрованными (SHA-256) почтой, телефоном и адресом.
// Имя заказа (буквы), цвета и прочие детали в Meta не отправляются.

import { createHash } from "node:crypto";
import { CONFIG } from "../config.js";

const sha = (v) => (v ? createHash("sha256").update(String(v).trim().toLowerCase()).digest("hex") : undefined);

function userData(details, req, fbp, fbc) {
  const name = String(details?.name || "").trim().split(/\s+/);
  const addr = details?.address || {};
  const ud = {
    em: sha(details?.email),
    ph: sha(String(details?.phone || "").replace(/\D/g, "")),
    fn: sha(name[0]),
    ln: sha(name.length > 1 ? name[name.length - 1] : ""),
    ct: sha(String(addr.city || "").replace(/\s+/g, "")),
    zp: sha(addr.postal_code),
    country: sha(addr.country),
    client_ip_address: String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || undefined,
    client_user_agent: req.headers["user-agent"],
    fbp: fbp || undefined,
    fbc: fbc || undefined,
  };
  Object.keys(ud).forEach((k) => ud[k] === undefined && delete ud[k]);
  return ud;
}

async function sendCapi(session, req, q) {
  const token = process.env.META_CAPI_TOKEN;
  if (!token || !CONFIG.metaPixelId) return "skipped";
  const proto = req.headers["x-forwarded-proto"] || "https";
  const event = {
    event_name: "Purchase",
    event_time: Math.floor(Date.now() / 1000),
    event_id: session.id, // тот же ID, что у события в браузере — Meta склеит их в одну покупку
    action_source: "website",
    event_source_url: `${proto}://${req.headers.host}/danke.html`,
    user_data: userData(session.customer_details, req, q.fbp, q.fbc),
    custom_data: {
      value: session.amount_total / 100,
      currency: String(session.currency || CONFIG.currency).toUpperCase(),
      content_type: "product",
      content_ids: ["name-buchstaben"],
      num_items: q.items,
    },
  };
  const body = { data: [event] };
  // Для проверки в Events Manager → «Тестовые события»: META_TEST_EVENT_CODE в Vercel
  if (process.env.META_TEST_EVENT_CODE) body.test_event_code = process.env.META_TEST_EVENT_CODE;
  // Без номера версии Graph API Meta берёт самую старую поддерживаемую — адрес не устареет
  const r = await fetch(`https://graph.facebook.com/${CONFIG.metaPixelId}/events?access_token=${encodeURIComponent(token)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) { console.error("Meta CAPI error", await r.text()); return "error"; }
  return "sent";
}

export default async function handler(req, res) {
  const key = process.env.STRIPE_SECRET_KEY;
  const id = String(req.query?.session_id || "");
  if (!key || !/^cs_[A-Za-z0-9_]+$/.test(id)) return res.status(400).json({ error: "bad request" });

  const r = await fetch(`https://api.stripe.com/v1/checkout/sessions/${id}?expand[]=line_items`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!r.ok) return res.status(404).json({ error: "not found" });
  const session = await r.json();
  if (session.payment_status !== "paid") return res.status(200).json({ paid: false });

  const items = (session.line_items?.data || []).reduce((n, li) => n + (li.quantity || 0), 0);
  let capi = "no-consent";
  if (req.query?.consent === "1") {
    try { capi = await sendCapi(session, req, { fbp: req.query.fbp, fbc: req.query.fbc, items }); }
    catch (e) { console.error(e); capi = "error"; }
  }
  // Браузеру отдаём только сумму — никаких личных данных
  return res.status(200).json({
    paid: true,
    value: session.amount_total / 100,
    currency: String(session.currency || CONFIG.currency).toUpperCase(),
    num_items: items,
    capi,
  });
}
