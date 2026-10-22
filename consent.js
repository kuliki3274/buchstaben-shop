// Meta Pixel + баннер согласия на cookie.
// Пиксель загружается ТОЛЬКО после «Akzeptieren» (§ 25 TDDDG, Art. 6 Abs. 1 lit. a DSGVO).
// Пока посетитель не решил, события ждут в очереди; при отказе очередь выбрасывается.
// Если в config.js нет metaPixelId — ничего не происходит, баннер не показывается.

import { CONFIG } from "./config.js";

const KEY = "kw_consent"; // "yes" | "no"
const PIXEL = CONFIG.metaPixelId;
let queue = [];
let loaded = false;

function stored() {
  try { return localStorage.getItem(KEY); } catch (e) { return null; }
}
function store(v) {
  try { localStorage.setItem(KEY, v); } catch (e) {}
}

export function hasConsent() {
  return Boolean(PIXEL) && stored() === "yes";
}

function loadPixel() {
  if (loaded || !PIXEL) return;
  loaded = true;
  // Официальный код Meta Pixel (fbevents.js)
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version="2.0";n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
  document,"script","https://connect.facebook.net/en_US/fbevents.js");
  window.fbq("init", PIXEL);
  window.fbq("track", "PageView");
  queue.forEach(([ev, params, id]) => send(ev, params, id));
  queue = [];
}

function send(event, params, eventId) {
  try {
    window.fbq("track", event, params || {}, eventId ? { eventID: eventId } : undefined);
  } catch (e) {}
}

// Стандартное событие Meta. eventId нужен, чтобы Meta не посчитала дважды
// одну и ту же покупку из браузера и с сервера (Conversions API).
export function metaTrack(event, params, eventId) {
  if (!PIXEL) return;
  const c = stored();
  if (c === "yes") { loadPixel(); send(event, params, eventId); }
  else if (c === null) queue.push([event, params, eventId]);
}

// Куки пикселя: нужны серверу для Conversions API, чтобы связать покупку с рекламой
export function metaCookies() {
  const get = (n) => (document.cookie.match(new RegExp("(?:^|; )" + n + "=([^;]*)")) || [])[1] || "";
  return { fbp: get("_fbp"), fbc: get("_fbc") };
}

function decide(v) {
  store(v);
  document.getElementById("kwConsent")?.remove();
  if (v === "yes") loadPixel();
  else {
    queue = [];
    // Отзыв согласия: удаляем куки пикселя и перезагружаем, чтобы скрипт Meta исчез со страницы
    ["_fbp", "_fbc"].forEach((n) => { document.cookie = `${n}=; Max-Age=0; path=/; domain=${location.hostname}`; document.cookie = `${n}=; Max-Age=0; path=/`; });
    if (loaded) location.reload();
  }
}

function banner() {
  if (document.getElementById("kwConsent")) return;
  const el = document.createElement("div");
  el.id = "kwConsent";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", "Cookie-Einstellungen");
  el.innerHTML = `
    <style>
      #kwConsent{position:fixed;left:12px;right:12px;bottom:12px;z-index:1000;max-width:520px;margin:0 auto;
        background:#fff;color:#3B2F2A;border:1px solid #EADFD4;border-radius:20px;padding:16px 18px;
        box-shadow:0 10px 30px rgba(59,47,42,.18);font:15px/1.5 Nunito,system-ui,sans-serif}
      #kwConsent b{font:600 17px Fredoka,sans-serif;display:block;margin-bottom:4px}
      #kwConsent p{margin:0 0 12px}
      #kwConsent a{color:#C2506A;font-weight:700}
      #kwConsent .row{display:flex;gap:10px}
      #kwConsent button{flex:1;min-height:44px;border-radius:14px;font:700 15px Nunito,sans-serif;cursor:pointer;
        border:2px solid #3B2F2A;background:#fff;color:#3B2F2A}
    </style>
    <b>Cookies &amp; Werbung</b>
    <p>Mit deiner Einwilligung nutzen wir den Meta-Pixel (Facebook/Instagram), um zu messen, ob unsere Werbung funktioniert, und sie passenden Menschen zu zeigen. Dabei werden Daten an Meta übertragen, auch in die USA. Du kannst die Einwilligung jederzeit unten über „Cookie-Einstellungen“ widerrufen. Mehr in der <a href="datenschutz.html#meta">Datenschutzerklärung</a>.</p>
    <div class="row">
      <button type="button" data-v="no">Nur notwendige</button>
      <button type="button" data-v="yes">Akzeptieren</button>
    </div>`;
  el.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => decide(b.dataset.v)));
  document.body.appendChild(el);
}

// Ссылка «Cookie-Einstellungen» в подвале любой страницы: <a href="#" data-consent>
export function initConsent() {
  if (!PIXEL) {
    document.querySelectorAll("[data-consent]").forEach((a) => a.remove());
    return;
  }
  document.querySelectorAll("[data-consent]").forEach((a) =>
    a.addEventListener("click", (e) => { e.preventDefault(); banner(); }));
  const c = stored();
  if (c === "yes") loadPixel();
  else if (c === null) banner();
}
