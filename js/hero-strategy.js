// ======================
// HERO SLIDES – STRATEGY PAGE
// ======================
(function() {
  const pageId = 'strategy';
  const heroSection = document.querySelector('.premium-hero[data-page-id="strategy"]');
  if (!heroSection) return;

  function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    if (typeof text !== 'string') text = String(text);
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  async function loadHero() {
    try {
      // Use API_BASE_URL from config.js
      const res = await fetch(`${API_BASE_URL}/api/hero/${pageId}`);
      if (!res.ok) return;
      const slides = await res.json();
      if (!slides.length) return;

      const pagination = heroSection.querySelector('.premium-pagination');
      const existingSlides = heroSection.querySelectorAll('.premium-slide');
      existingSlides.forEach(s => s.remove());

      slides.forEach((slide, i) => {
        const slideDiv = document.createElement('div');
        slideDiv.className = `premium-slide ${i === 0 ? 'active' : ''}`;
        slideDiv.innerHTML = `
          <div class="premium-bg">
            <img src="${escapeHtml(slide.image_url)}" alt="${escapeHtml(slide.title)}" />
          </div>
          <div class="premium-overlay"></div>
          <div class="premium-container">
            <div class="premium-content">
              <h1 class="premium-title">${escapeHtml(slide.title)}</h1>
              <div class="premium-divider">
                <span class="premium-divider-left"></span>
                <span class="premium-divider-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C8 6 2 10 2 14C2 18 6 22 12 22C18 22 22 18 22 14C22 10 16 6 12 2Z" fill="#84BD26"/>
                    <path d="M12 2C12 6 12 10 12 22" stroke="#6A9E1E" stroke-width="1.5"/>
                  </svg>
                </span>
                <span class="premium-divider-right"></span>
              </div>
              <p class="premium-description">${escapeHtml(slide.description)}</p>
            </div>
          </div>
        `;
        heroSection.insertBefore(slideDiv, pagination);
      });

      if (pagination) {
        pagination.innerHTML = slides.map((_, i) =>
          `<button class="premium-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></button>`
        ).join('');
      }

      initCarousel(heroSection);
    } catch (err) {
      console.error('Hero load failed:', err);
    }
  }

  function initCarousel(hero) {
    const slides = hero.querySelectorAll('.premium-slide');
    const dots = hero.querySelectorAll('.premium-dot');
    if (!slides.length) return;

    let current = 0;
    let timer;

    function show(i) {
      slides.forEach(s => s.classList.remove('active'));
      dots.forEach(d => d.classList.remove('active'));
      slides[i].classList.add('active');
      if (dots[i]) dots[i].classList.add('active');
      current = i;
    }

    function next() {
      show((current + 1) % slides.length);
      timer = setTimeout(next, 5000);
    }

    function start() {
      clearTimeout(timer);
      show(0);
      timer = setTimeout(next, 5000);
    }

    function stop() {
      clearTimeout(timer);
    }

    const pagination = hero.querySelector('.premium-pagination');
    if (pagination) {
      pagination.addEventListener('click', (e) => {
        const dot = e.target.closest('.premium-dot');
        if (!dot) return;
        const idx = parseInt(dot.getAttribute('data-index'));
        if (!isNaN(idx)) {
          stop();
          show(idx);
          timer = setTimeout(next, 5000);
        }
      });
    }

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', () => {
      stop();
      timer = setTimeout(next, 5000);
    });

    start();
  }

  loadHero();
})();