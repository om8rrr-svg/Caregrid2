const KEY = 'cg_consent_v1';
const PREFERENCES_KEY = 'cg_cookie_preferences_v1';

function setConsent(val) { 
  localStorage.setItem(KEY, JSON.stringify({ ts: Date.now(), val })); 
}

function getConsent() { 
  try { 
    const stored = localStorage.getItem(KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    
    // Consent expires after 1 year
    const oneYear = 365 * 24 * 60 * 60 * 1000;
    if (Date.now() - parsed.ts > oneYear) {
      localStorage.removeItem(KEY);
      return null;
    }
    
    return parsed.val; 
  } catch { 
    return null; 
  } 
}

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
  div.style.cssText = `
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 16px;
    background: #111;
    color: #fff;
    z-index: 9999;
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
    font-size: 14px;
    line-height: 1.4;
  `;
  
  div.innerHTML = `
    <span style="flex: 1; min-width: 200px; text-align: center;">
      🍪 We use cookies to improve your experience and for analytics.
    </span>
    <div style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: center;">
      <button id="consentAccept" class="btn" style="background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 13px;">
        Accept All
      </button>
      <button id="consentReject" class="btn btn-outline" style="background: transparent; color: #fff; border: 1px solid #666; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 13px;">
        Reject
      </button>
      <a href="/privacy" style="color: #9cf; text-decoration: none; padding: 8px 12px; font-size: 13px;">
        Learn more
      </a>
    </div>
  `;
  
  document.body.appendChild(div);
  
  // Add event listeners
  document.getElementById('consentAccept').onclick = () => { 
    setConsent(true); 
    div.remove(); 
    loadAnalyticsIfConsented();
    showConsentToast('Analytics enabled. Thank you!', 'success');
  };
  
  document.getElementById('consentReject').onclick = () => { 
    setConsent(false); 
    div.remove();
    showConsentToast('Analytics disabled. You can change this anytime.', 'info');
  };
}

export function loadAnalyticsIfConsented() {
  if (getConsent() === true) {
    // Example: Google Analytics tag here
    // const s = document.createElement('script'); s.src='…'; document.head.appendChild(s);
    console.log('Analytics loaded - user consented');
    showConsentToast('Analytics disabled. You can change this anytime.', 'info');
  };
}

function showConsentToast(message, type = 'info') {
  const toast = document.createElement('div');
  const bgColor = type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8';
  
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: ${bgColor};
    color: white;
    padding: 12px 16px;
    border-radius: 6px;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-size: 14px;
    max-width: 300px;
    transition: all 0.3s ease;
  `;
  
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

export function loadAnalyticsIfConsented() {
  if (getConsent() === true) {
    // Load Google Analytics
    if (typeof gtag !== 'undefined' && !window.analyticsLoaded) {
      window.analyticsLoaded = true;
      console.log('Analytics loaded with user consent');
      
      // Track page view
      gtag('config', 'GA_MEASUREMENT_ID', {
        page_title: document.title,
        page_location: window.location.href
      });
    }
    
    // Load other analytics services here if needed
    // Example: Hotjar, Mixpanel, etc.
  }
}

// Check if user has given consent and load analytics accordingly
export function initConsent() {
  const consent = getConsent();
  if (consent === true) {
    loadAnalyticsIfConsented();
  } else if (consent === null) {
    // Show banner after a short delay to avoid blocking initial page load
    setTimeout(renderBanner, 1000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initConsent();
});