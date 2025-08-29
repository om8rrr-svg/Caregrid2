const KEY = 'cg_consent_v1';

function setConsent(val) { localStorage.setItem(KEY, JSON.stringify({ ts: Date.now(), val })); }
function getConsent() { try { return JSON.parse(localStorage.getItem(KEY)).val; } catch { return null; } }

function renderBanner() {
  if (getConsent() !== null) return;
  const div = document.createElement('div');
  div.id = 'consentBanner';
  div.style.cssText = 'position:fixed;bottom:0;left:0;right:0;padding:12px;background:#111;color:#fff;z-index:9999;display:flex;gap:8px;align-items:center;justify-content:center;flex-wrap:wrap;';
  div.innerHTML = `
    We use cookies for analytics. 
    <button id="consentAccept" class="btn">Accept</button>
    <button id="consentReject" class="btn btn-outline">Reject</button>
    <a href="/privacy" style="color:#9cf">Learn more</a>
  `;
  document.body.appendChild(div);
  document.getElementById('consentAccept').onclick = () => { setConsent(true); div.remove(); loadAnalyticsIfConsented(); };
  document.getElementById('consentReject').onclick = () => { setConsent(false); div.remove(); };
}

export function loadAnalyticsIfConsented() {
  if (getConsent() === true) {
    // Example: Google Analytics tag here
    // const s = document.createElement('script'); s.src='…'; document.head.appendChild(s);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderBanner();
  loadAnalyticsIfConsented();
});