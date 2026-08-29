// ======================
// PUBLIC SEO – DYNAMIC META UPDATER
// ======================
(function() {
  // Get page ID from hero section
  const hero = document.querySelector('.premium-hero');
  const pageId = hero ? hero.getAttribute('data-page-id') : null;
  const pageName = document.title.split('–')[0].trim() || 'Tortoise People Project';

  async function fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  // Default meta values
  const defaults = {
    title: 'Tortoise People Project – Protecting Ghana’s Tortoises',
    description: 'Tortoise People Project is a Ghana-based conservation NGO dedicated to protecting endangered tortoise species and their habitats through community-led action, research, and education.',
    ogImage: 'images/logo.png',
    canonical: window.location.href
  };

  // Update a meta tag by selector
  function setMeta(selector, content) {
    const el = document.querySelector(selector);
    if (el && content) el.setAttribute('content', content);
  }

  // Set all meta tags from defaults
  function applyDefaults() {
    document.title = defaults.title;
    setMeta('meta[name="description"]', defaults.description);
    setMeta('meta[property="og:title"]', defaults.title);
    setMeta('meta[property="og:description"]', defaults.description);
    setMeta('meta[property="og:image"]', defaults.ogImage);
    setMeta('meta[property="og:url"]', defaults.canonical);
    setMeta('meta[name="twitter:title"]', defaults.title);
    setMeta('meta[name="twitter:description"]', defaults.description);
    setMeta('meta[name="twitter:image"]', defaults.ogImage);
    setMeta('link[rel="canonical"]', defaults.canonical);
  }

  applyDefaults();

  // Dynamic per‑page meta
  async function updateDynamicMeta() {
    try {
      // Get site settings for global info
      const settings = await fetchJSON(`${API_BASE_URL}/api/settings`);
      if (!settings) return;

      let title = `Tortoise People Project – ${pageName}`;
      let description = settings.core_purpose || defaults.description;

      // For homepage and pages with highlights, use highlight heading/description
      if (pageId === 'index' || pageId === 'education') {
        try {
          const highlight = await fetchJSON(`${API_BASE_URL}/api/highlights/${pageId}`);
          if (highlight) {
            const hHeading = highlight.heading ? highlight.heading.replace(/<br\s*\/?>/gi, ' ') : '';
            const hDesc = highlight.description || settings.core_purpose || defaults.description;
            title = `${hHeading || pageName} – Tortoise People Project`;
            description = hDesc;
          }
        } catch (err) {
          // ignore highlight errors
        }
      }

      // Update tags
      document.title = title;
      setMeta('meta[name="description"]', description);
      setMeta('meta[property="og:title"]', title);
      setMeta('meta[property="og:description"]', description);
      setMeta('meta[name="twitter:title"]', title);
      setMeta('meta[name="twitter:description"]', description);
    } catch (err) {
      console.warn('SEO dynamic update failed:', err);
    }
  }

  // Add JSON‑LD structured data for Organization
  function addOrganizationSchema() {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Tortoise People Project',
      url: window.location.origin,
      logo: `${window.location.origin}/images/logo.png`,
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+233597985119',
        contactType: 'customer service',
        availableLanguage: ['English']
      }
    });
    document.head.appendChild(script);
  }

  // Initial load
  document.addEventListener('DOMContentLoaded', () => {
    updateDynamicMeta();
    addOrganizationSchema();
  });
})();