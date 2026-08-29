// ======================
// PUBLIC SECTIONS – NEWS, PARTNERS, HIGHLIGHTS
// ======================

// Helper: fetch JSON
async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Escape function (same as common)
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

// ---------- NEWS SLIDER ----------
async function loadNewsSliderCommon() {
  const track = document.getElementById('newsTrack');
  if (!track) return;  // Section not present

  try {
    const articles = await fetchJSON(`${API_BASE_URL}/api/news`);
    if (!articles.length) return;

    track.innerHTML = articles.map(article => `
      <div class="news-slide">
        <div class="news-slide-image">
          <img src="${escapeHtmlPublic(article.image_url)}" alt="${escapeHtmlPublic(article.title)}" />
        </div>
        <div class="news-slide-content">
          <h3 class="news-slide-heading">${escapeHtmlPublic(article.title)}</h3>
          <p class="news-slide-text">${escapeHtmlPublic(article.description)}</p>
          <a href="${escapeHtmlPublic(article.link)}" target="_blank" class="news-slide-btn">
            Read more
            <span class="news-slide-btn-arrow"><i class="fas fa-arrow-right"></i></span>
          </a>
        </div>
      </div>
    `).join('');

    // Reinitialize news slider if function exists
    if (typeof initNewsSlider === 'function') {
      initNewsSlider();
    }
  } catch (err) {
    console.warn('News slider not loaded:', err);
  }
}

// ---------- PARTNERS GRID ----------
async function loadPartnersCommon() {
  const grid = document.querySelector('.partners-grid');
  if (!grid) return;  // Section not present

  try {
    const partners = await fetchJSON(`${API_BASE_URL}/api/partners`);
    if (!partners.length) return;

    grid.innerHTML = partners.map(p => `
      <div class="partner-logo-wrapper">
        <img src="${escapeHtmlPublic(p.logo_url)}" alt="${escapeHtmlPublic(p.name)}" class="partner-logo" />
      </div>
    `).join('');
  } catch (err) {
    console.warn('Partners not loaded:', err);
  }
}

// ---------- IMPACT HIGHLIGHT ----------
async function loadImpactHighlightCommon() {
  const hero = document.querySelector('.premium-hero');
  const pageId = hero ? hero.getAttribute('data-page-id') : null;

  if (pageId !== 'index' && pageId !== 'education') return;

  try {
    const data = await fetchJSON(`${API_BASE_URL}/api/highlights/${pageId}`);
    if (!data) return;

    // ========== INDEX STYLE ==========
    const indexContainer = document.querySelector('.tortoise-impact');
    if (indexContainer) {
      const badgeEl = indexContainer.querySelector('.tortoise-impact-badge');
      if (badgeEl) badgeEl.textContent = data.badge || 'Impact Highlight';

      const headingEl = indexContainer.querySelector('.tortoise-impact-heading');
      if (headingEl) headingEl.innerHTML = data.heading || '';

      const descEl = indexContainer.querySelector('.tortoise-impact-description');
      if (descEl) descEl.textContent = data.description || '';

      const listEl = indexContainer.querySelector('.tortoise-impact-list');
      if (listEl) {
        listEl.innerHTML = '';
        if (data.bullets && data.bullets.length) {
          data.bullets.forEach(b => {
            let text = b;
            if (typeof b === 'object' && b !== null) {
              text = b.text || b.content || b.title || '';
            }
            const li = document.createElement('li');
            li.className = 'tortoise-impact-list-item';
            const checkSpan = document.createElement('span');
            checkSpan.className = 'tortoise-impact-check';
            const icon = document.createElement('i');
            icon.className = 'fas fa-check';
            checkSpan.appendChild(icon);
            const textSpan = document.createElement('span');
            textSpan.className = 'tortoise-impact-list-text';
            textSpan.textContent = text;
            li.appendChild(checkSpan);
            li.appendChild(textSpan);
            listEl.appendChild(li);
          });
        }
      }

      const topImg = indexContainer.querySelector('.tortoise-impact-image-top img');
      const bottomImg = indexContainer.querySelector('.tortoise-impact-image-bottom img');
      if (topImg) topImg.src = data.top_image || '';
      if (bottomImg) bottomImg.src = data.bottom_image || '';

      const btn = indexContainer.querySelector('.tortoise-impact-btn');
      if (btn && data.read_more_link) btn.href = data.read_more_link;
    }

    // ========== EDUCATION STYLE ==========
    const educationContainer = document.querySelector('.impact-highlight');
    if (educationContainer) {
      const labelEl = educationContainer.querySelector('.highlight-label');
      if (labelEl) labelEl.textContent = data.badge || 'Impact Highlight';

      const headingEl = educationContainer.querySelector('.highlight-heading');
      if (headingEl) headingEl.innerHTML = data.heading || '';

      const descEl = educationContainer.querySelector('.highlight-body');
      if (descEl) descEl.textContent = data.description || '';

      const topImg = educationContainer.querySelector('.highlight-image-top img');
      const bottomImg = educationContainer.querySelector('.highlight-image-bottom img');
      if (topImg) topImg.src = data.top_image || '';
      if (bottomImg) bottomImg.src = data.bottom_image || '';
    }

  } catch (err) {
    console.warn('Impact highlight not loaded:', err);
  }
}

// Auto‑load sections that are present on the page
document.addEventListener('DOMContentLoaded', () => {
  loadNewsSliderCommon();
  loadPartnersCommon();
  loadImpactHighlightCommon();
});