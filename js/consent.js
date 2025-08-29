const KEY = 'cg_consent_v1';
const PREFERENCES_KEY = 'cg_cookie_preferences_v1';

function setConsent(val) { localStorage.setItem(KEY, JSON.stringify({ ts: Date.now(), val })); }
function getConsent() { try { return JSON.parse(localStorage.getItem(KEY)).val; } catch { return null; } }

function setCookiePreferences(preferences) { 
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify({ ts: Date.now(), ...preferences })); 
}
function getCookiePreferences() { 
  try { 
    const stored = JSON.parse(localStorage.getItem(PREFERENCES_KEY));
    return { essential: true, analytics: stored.analytics || false, marketing: stored.marketing || false };
  } catch { 
    return { essential: true, analytics: false, marketing: false }; 
  } 
}

function renderBanner() {
  if (getConsent() !== null) return;
  const div = document.createElement('div');
  div.id = 'consentBanner';
  div.style.cssText = 'position:fixed;bottom:0;left:0;right:0;padding:20px;background:#111;color:#fff;z-index:9999;box-shadow:0 -4px 20px rgba(0,0,0,0.3);';
  div.innerHTML = `
    <div style="max-width:1200px;margin:0 auto;">
      <div style="display:flex;flex-wrap:wrap;gap:20px;align-items:center;justify-content:space-between;">
        <div style="flex:1;min-width:300px;">
          <h4 style="margin:0 0 8px 0;font-size:16px;color:#fff;">Cookie Consent</h4>
          <p style="margin:0;font-size:14px;line-height:1.4;color:#ccc;">
            We use essential cookies for site functionality and optional cookies for analytics to improve your experience.
          </p>
        </div>
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          <button id="consentCustomize" class="btn btn-outline" style="padding:8px 16px;font-size:14px;">Customize</button>
          <button id="consentReject" class="btn btn-outline" style="padding:8px 16px;font-size:14px;">Reject Optional</button>
          <button id="consentAccept" class="btn" style="padding:8px 16px;font-size:14px;background:#3b82f6;">Accept All</button>
        </div>
      </div>
      <div id="cookiePreferences" style="display:none;margin-top:20px;padding-top:20px;border-top:1px solid #333;">
        <h5 style="margin:0 0 12px 0;color:#fff;">Cookie Preferences</h5>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:15px;margin-bottom:15px;">
          <label style="display:flex;align-items:center;gap:8px;color:#ccc;cursor:pointer;">
            <input type="checkbox" checked disabled style="accent-color:#3b82f6;"> 
            <span>Essential (Required)</span>
          </label>
          <label style="display:flex;align-items:center;gap:8px;color:#ccc;cursor:pointer;">
            <input type="checkbox" id="analyticsCheck" style="accent-color:#3b82f6;"> 
            <span>Analytics</span>
          </label>
          <label style="display:flex;align-items:center;gap:8px;color:#ccc;cursor:pointer;">
            <input type="checkbox" id="marketingCheck" style="accent-color:#3b82f6;"> 
            <span>Marketing</span>
          </label>
        </div>
        <div style="display:flex;gap:12px;">
          <button id="savePreferences" class="btn" style="padding:8px 16px;font-size:14px;background:#3b82f6;">Save Preferences</button>
          <a href="/privacy.html" style="color:#9cf;font-size:14px;text-decoration:none;padding:8px 0;">Learn more</a>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(div);
  
  document.getElementById('consentAccept').onclick = () => { 
    setCookiePreferences({ analytics: true, marketing: true });
    setConsent(true); 
    div.remove(); 
    loadAnalyticsIfConsented(); 
  };
  document.getElementById('consentReject').onclick = () => { 
    setCookiePreferences({ analytics: false, marketing: false });
    setConsent(false); 
    div.remove(); 
  };
  document.getElementById('consentCustomize').onclick = () => {
    const prefs = document.getElementById('cookiePreferences');
    prefs.style.display = prefs.style.display === 'none' ? 'block' : 'none';
  };
  document.getElementById('savePreferences').onclick = () => {
    const analytics = document.getElementById('analyticsCheck').checked;
    const marketing = document.getElementById('marketingCheck').checked;
    setCookiePreferences({ analytics, marketing });
    setConsent(analytics || marketing);
    div.remove();
    if (analytics) loadAnalyticsIfConsented();
  };
}

export function loadAnalyticsIfConsented() {
  const preferences = getCookiePreferences();
  if (preferences.analytics && getConsent() === true) {
    // Example: Google Analytics tag here
    // const s = document.createElement('script'); s.src='…'; document.head.appendChild(s);
    console.log('Analytics loaded - user consented');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderBanner();
  loadAnalyticsIfConsented();
});