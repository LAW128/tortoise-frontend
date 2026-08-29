// ======================
// PUBLIC COMMON – SETTINGS, NEWSLETTER, AUTO‑REFRESH
// ======================

// Helper: fetch JSON
async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Escape HTML (safe for text)
function escapeHtmlPublic(text) {
  if (text === null || text === undefined) return '';
  if (typeof text === 'object') {
    if (text.text) text = text.text;
    else if (text.content) text = text.content;
    else if (text.title) text = text.title;
    else text = '';
  }
  if (typeof text !== 'string') text = String(text);
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ======================
// 1. SITE SETTINGS + FOOTER
// ======================
async function loadSiteSettingsCommon() {
  try {
    const settings = await fetchJSON(`${API_BASE_URL}/api/settings`);
    if (!settings) return;

    // Footer contact info
    const addressEl = document.querySelector('.contact-info li:nth-child(1)');
    const phoneEl = document.querySelector('.contact-info li:nth-child(2)');
    const emailEl = document.querySelector('.contact-info li:nth-child(3)');
    if (addressEl) addressEl.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${escapeHtmlPublic(settings.contact_address)}`;
    if (phoneEl) phoneEl.innerHTML = `<i class="fas fa-phone"></i> ${escapeHtmlPublic(settings.contact_phone)}`;
    if (emailEl) emailEl.innerHTML = `<i class="fas fa-envelope"></i> ${escapeHtmlPublic(settings.contact_email)}`;

    // Social links
    const socialContainer = document.querySelector('.footer-social');
    if (socialContainer) {
      socialContainer.innerHTML = `
        <a href="${escapeHtmlPublic(settings.facebook_url)}"><i class="fab fa-facebook-f"></i></a>
        <a href="${escapeHtmlPublic(settings.twitter_url)}"><i class="fab fa-twitter"></i></a>
        <a href="${escapeHtmlPublic(settings.instagram_url)}"><i class="fab fa-instagram"></i></a>
        <a href="${escapeHtmlPublic(settings.linkedin_url)}"><i class="fab fa-linkedin-in"></i></a>
        <a href="${escapeHtmlPublic(settings.youtube_url)}"><i class="fab fa-youtube"></i></a>
      `;
    }

    // Vision / Mission / Purpose (if present)
    const visionEl = document.querySelector('.vmp-card--vision .vmp-card-text');
    const missionEl = document.querySelector('.vmp-card--mission .vmp-card-text');
    const purposeEl = document.querySelector('.vmp-card--purpose .vmp-card-text');
    if (visionEl) visionEl.textContent = settings.vision || '';
    if (missionEl) missionEl.textContent = settings.mission || '';
    if (purposeEl) purposeEl.textContent = settings.core_purpose || '';
  } catch (err) {
    console.warn('Site settings not loaded:', err);
  }
}

// ======================
// 2. NEWSLETTER FORM
// ======================
function setupNewsletterFormCommon() {
  const form = document.getElementById('newsletterForm');
  if (!form) return;

  // Remove previous listeners by cloning
  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);

  newForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const emailInput = document.getElementById('newsletterEmail');
    const successEl = document.getElementById('newsletterSuccess');
    const errorEl = document.getElementById('newsletterError');

    if (!emailInput) return;

    const email = emailInput.value.trim().toLowerCase();
    console.log('Submitting email:', email);

    if (successEl) successEl.classList.remove('visible');
    if (errorEl) errorEl.classList.remove('visible');

    if (!email) {
      if (errorEl) {
        errorEl.textContent = 'Please enter your email.';
        errorEl.classList.add('visible');
      }
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        if (successEl) successEl.classList.add('visible');
        newForm.reset();
        setTimeout(() => successEl && successEl.classList.remove('visible'), 5000);
      } else {
        if (errorEl) {
          errorEl.textContent = data.message || 'Subscription failed.';
          errorEl.classList.add('visible');
        }
      }
    } catch (err) {
      console.error('Subscription error:', err);
      if (errorEl) {
        errorEl.textContent = 'Network error. Please try again.';
        errorEl.classList.add('visible');
      }
    }
  });
}

// ======================
// 3. AUTO‑REFRESH (only settings)
// ======================
let publicRefreshInterval;
let publicIdleTimer;

function stopPublicAutoRefresh() {
  if (publicRefreshInterval) {
    clearInterval(publicRefreshInterval);
    publicRefreshInterval = null;
  }
}

function startPublicAutoRefresh() {
  stopPublicAutoRefresh();
  publicRefreshInterval = setInterval(() => {
    const activeEl = document.activeElement;
    const isTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable);
    if (!isTyping) {
      loadSiteSettingsCommon();
      // If sections file is loaded, refresh those too
      if (typeof loadNewsSliderCommon === 'function') loadNewsSliderCommon();
      if (typeof loadPartnersCommon === 'function') loadPartnersCommon();
      if (typeof loadImpactHighlightCommon === 'function') loadImpactHighlightCommon();
    }
  }, 10000);
}

function resetPublicIdleTimer() {
  stopPublicAutoRefresh();
  clearTimeout(publicIdleTimer);
  publicIdleTimer = setTimeout(() => {
    startPublicAutoRefresh();
  }, 30000);
}

// Initial start
startPublicAutoRefresh();

// Pause on user interaction
document.addEventListener('click', resetPublicIdleTimer);
document.addEventListener('keydown', resetPublicIdleTimer);
document.addEventListener('focusin', resetPublicIdleTimer);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) resetPublicIdleTimer();
});
window.addEventListener('focus', resetPublicIdleTimer);

// Initial load
document.addEventListener('DOMContentLoaded', () => {
  loadSiteSettingsCommon();
  setupNewsletterFormCommon();
});