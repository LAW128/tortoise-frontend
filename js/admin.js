console.log("admin.js loaded");

// Inline placeholder image (grey box, base64 PNG)
const PLACEHOLDER_IMG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAADICAYAAABS39xVAAAKQklEQVR4Ae3cQQ0AAACFoGf+V3dAEgQeAACYExgAALgBAADgBAAApwAAAEwAAABnAAAANQAAAAMAAAAA';

// ======================
// CREDENTIALS & STATE
// ======================
const ADMIN_USER = "admin";
const ADMIN_PASS = "admin1234@";
let generatedOTP = null;
let resetEmailAddress = '';  // For forgot password
let currentAdminSection = 'dashboard';
const highlightsCache = {};  // store fetched highlights

// ======================
// DOM ELEMENTS
// ======================
const loginScreen = document.getElementById("loginScreen");
const dashboard = document.getElementById("dashboard");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const logoutBtn = document.getElementById("logoutBtn");
const navItems = document.querySelectorAll(".nav-item[data-section]");
const sectionTitle = document.getElementById("sectionTitle");
const contentArea = document.getElementById("contentArea");

// Forgot password DOM
const loginCard = document.getElementById("loginCard");
const forgotEmailCard = document.getElementById("forgotEmailCard");
const otpCard = document.getElementById("otpCard");
const newPasswordCard = document.getElementById("newPasswordCard");
const forgotPasswordLink = document.getElementById("forgotPasswordLink");
const backToLoginLinks = document.querySelectorAll(".back-to-login");

// Check if already logged in
if (sessionStorage.getItem("adminToken")) {
  showDashboard();
}

// ======================
// TOAST NOTIFICATION
// ======================
function showToast(message, type = 'success') {
  const existingToast = document.querySelector('.toast');
  if (existingToast) existingToast.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const iconClass = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
  toast.innerHTML = `
    <div class="toast-icon ${type}">
      <i class="fas ${iconClass}"></i>
    </div>
    <div class="toast-content">
      <h4>${type === 'success' ? 'Success' : 'Error'}</h4>
      <p>${message}</p>
    </div>
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 2500);
}

// ======================
// API HELPER
// ======================
async function apiRequest(url, options = {}) {
  const token = sessionStorage.getItem('adminToken');
  if (!token) {
    hideDashboard();
    throw new Error('No token found');
  }
  const headers = { ...options.headers, 'Authorization': `Bearer ${token}` };
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminUser');
    showToast('Session expired. Please log in again.', 'error');
    hideDashboard();
    throw new Error('Session expired');
  }
  return res;
}

// ======================
// SHOW/HIDE CARDS (forgot password)
// ======================
function showCard(card) {
  const cards = [loginCard, forgotEmailCard, otpCard, newPasswordCard];
  cards.forEach(c => {
    if (c) c.style.display = 'none';
  });
  if (card) {
    card.style.display = 'block';
  }
}

forgotPasswordLink.addEventListener('click', (e) => {
  e.preventDefault();
  showCard(forgotEmailCard);
});

backToLoginLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    showCard(loginCard);
  });
});

// ======================
// LOGIN HANDLER
// ======================
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    loginError.textContent = "Please enter both username and password.";
    return;
  }

  const btn = loginForm.querySelector('button');
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in…';

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (res.ok) {
      sessionStorage.setItem('adminToken', data.token);
      sessionStorage.setItem('adminUser', JSON.stringify(data.user));
      loginError.textContent = "";
      showDashboard();
      showToast('Login successful! Welcome back.', 'success');
    } else {
      loginError.textContent = data.message || 'Invalid credentials.';
    }
  } catch (err) {
    loginError.textContent = 'Network error. Please try again.';
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
});

// ======================
// FORGOT PASSWORD FLOW (API) – ROBUST
// ======================
document.getElementById('forgotEmailForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const emailInput = document.getElementById('resetEmail');
  const errorEl = document.getElementById('forgotEmailError');
  const email = emailInput ? emailInput.value.trim() : '';

  if (!email) {
    if (errorEl) errorEl.textContent = 'Please enter your email.';
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    if (res.ok) {
      resetEmailAddress = email;

      // Hide all login cards, then show OTP card
      document.querySelectorAll('.form-card, .login-card').forEach(c => c.style.display = 'none');
      const otpCard = document.getElementById('otpCard');
      if (otpCard) {
        otpCard.style.display = 'block';
      } else {
        console.error('OTP card not found');
      }

      showToast('OTP sent to your email.', 'success');
    } else {
      const data = await res.json().catch(() => ({}));
      if (errorEl) errorEl.textContent = data.message || 'Something went wrong.';
    }
  } catch (err) {
    console.error('Forgot password error:', err);
    if (errorEl) errorEl.textContent = 'Network error. Please try again.';
  }
});

document.getElementById('otpForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const otpInput = document.getElementById('otpInput');
  const errorEl = document.getElementById('otpError');
  const otp = otpInput ? otpInput.value.trim() : '';

  if (!otp) {
    if (errorEl) errorEl.textContent = 'Please enter the OTP.';
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: resetEmailAddress, otp })
    });

    if (res.ok) {
      document.querySelectorAll('.form-card, .login-card').forEach(c => c.style.display = 'none');
      const newPasswordCard = document.getElementById('newPasswordCard');
      if (newPasswordCard) {
        newPasswordCard.style.display = 'block';
      }
    } else {
      const data = await res.json().catch(() => ({}));
      if (errorEl) errorEl.textContent = data.message || 'Invalid OTP.';
    }
  } catch (err) {
    console.error('OTP verification error:', err);
    if (errorEl) errorEl.textContent = 'Network error. Please try again.';
  }
});

document.getElementById('newPasswordForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const newPasswordInput = document.getElementById('newPassword');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const errorEl = document.getElementById('newPasswordError');
  const newPassword = newPasswordInput ? newPasswordInput.value.trim() : '';
  const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value.trim() : '';

  if (newPassword !== confirmPassword) {
    if (errorEl) errorEl.textContent = 'Passwords do not match.';
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: resetEmailAddress,
        otp: document.getElementById('otpInput').value.trim(),
        newPassword
      })
    });

    if (res.ok) {
      showToast('Password changed successfully!', 'success');
      document.querySelectorAll('.form-card, .login-card').forEach(c => c.style.display = 'none');
      const loginCard = document.getElementById('loginCard');
      if (loginCard) loginCard.style.display = 'block';
    } else {
      const data = await res.json().catch(() => ({}));
      if (errorEl) errorEl.textContent = data.message || 'Error resetting password.';
    }
  } catch (err) {
    console.error('Reset password error:', err);
    if (errorEl) errorEl.textContent = 'Network error. Please try again.';
  }
});

// ======================
// MOBILE SIDEBAR TOGGLE
// ======================
const sidebarToggle = document.getElementById('sidebarToggle');
if (sidebarToggle) {
  sidebarToggle.addEventListener('click', () => {
    document.querySelector('.sidebar').classList.toggle('open');
  });
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 992 && !e.target.closest('.sidebar') && !e.target.closest('#sidebarToggle')) {
      document.querySelector('.sidebar').classList.remove('open');
    }
  });
}

// ======================
// LOGOUT & SIDEBAR NAVIGATION
// ======================
logoutBtn.addEventListener("click", (e) => {
  e.preventDefault();
  sessionStorage.removeItem("adminToken");
  sessionStorage.removeItem("adminUser");
  hideDashboard();
});

navItems.forEach(item => {
  item.addEventListener("click", (e) => {
    e.preventDefault();
    navItems.forEach(link => link.classList.remove("active"));
    item.classList.add("active");
    loadSection(item.getAttribute("data-section"));
  });
});

function showDashboard() {
  loginScreen.style.display = "none";
  dashboard.style.display = "flex";
  loadSection("dashboard");
}

function hideDashboard() {
  loginScreen.style.display = "flex";
  dashboard.style.display = "none";
  sessionStorage.removeItem("adminToken");
  sessionStorage.removeItem("adminUser");
}

// ======================
// SECTION LOADING (WITH LOADING OVERLAY)
// ======================
function loadSection(section) {
  currentAdminSection = section;
  const titles = {
    dashboard: "Dashboard",
    hero: "Manage Hero Sections",
    highlights: "Manage Highlights",
    news: "Manage News",
    partners: "Manage Partners",
    subscribers: "View Subscribers",
    settings: "Site Settings"
  };
  sectionTitle.textContent = titles[section] || "Dashboard";

  contentArea.classList.add('loading');

  if (section === "dashboard") {
    (async () => {
      try {
        const [newsRes, subscribersRes, partnersRes] = await Promise.all([
          apiRequest(`${API_BASE_URL}/api/admin/news`),
          apiRequest(`${API_BASE_URL}/api/admin/subscribers`),
          apiRequest(`${API_BASE_URL}/api/admin/partners`)
        ]);
        const newsCount = (await newsRes.json()).length;
        const subscribersCount = (await subscribersRes.json()).length;
        const partnersCount = (await partnersRes.json()).length;

        contentArea.innerHTML = `
          <div class="dashboard-home">
            <div class="welcome-header">
              <h1>Welcome back, Admin</h1>
              <p>Here’s what’s happening with your conservation website today.</p>
            </div>
            <div class="stat-cards">
              <div class="stat-card">
                <div class="card-icon"><i class="fas fa-newspaper"></i></div>
                <h3>Total News</h3>
                <p>${newsCount}</p>
              </div>
              <div class="stat-card">
                <div class="card-icon"><i class="fas fa-envelope"></i></div>
                <h3>Subscribers</h3>
                <p>${subscribersCount}</p>
              </div>
              <div class="stat-card">
                <div class="card-icon"><i class="fas fa-handshake"></i></div>
                <h3>Partners</h3>
                <p>${partnersCount}</p>
              </div>
            </div>
          </div>
        `;
      } catch (err) {
        console.error(err);
        showToast('Failed to load dashboard stats.', 'error');
      } finally {
        contentArea.classList.remove('loading');
      }
    })();
  } else if (section === "hero") {
    renderHeroManager();
  } else if (section === "highlights") {
    renderHighlightsManager();
  } else if (section === "news") {
    renderNewsManager();
  } else if (section === "partners") {
    renderPartnersManager();
  } else if (section === "subscribers") {
    renderSubscribersManager();
  } else if (section === "settings") {
    renderSiteSettings();
  } else {
    contentArea.classList.remove('loading');
    contentArea.innerHTML = `
      <div class="construction">
        <i class="fas fa-tools"></i>
        <h3>Under Construction</h3>
        <p>This section is coming soon. We're working hard to bring you this feature.</p>
      </div>
    `;
  }
}

// ======================
// HERO MANAGEMENT (API, parallel loading)
// ======================
let currentEditingPageId = null;

async function renderHeroManager() {
  const pages = [
    { id: 'index', name: 'Home Page', file: 'index.html' },
    { id: 'about', name: 'About Us', file: 'about.html' },
    { id: 'strategy', name: 'Our Strategy', file: 'strategy.html' },
    { id: 'resources', name: 'Resources', file: 'resources.html' },
    { id: 'get-involved', name: 'Get Involved', file: 'get-involved.html' },
    { id: 'education', name: 'Education & Awareness', file: 'Education_Awareness.html' },
    { id: 'community', name: 'Community Resources', file: 'Community_Resources.html' },
    { id: 'restoration', name: 'Restoration & Protection', file: 'Restoration_Protection.html' },
    { id: 'nature', name: 'Nature Friendly', file: 'Nature_Friendly.html' }
  ];

  try {
    const heroPromises = pages.map(page =>
      apiRequest(`${API_BASE_URL}/api/admin/hero/${page.id}`).then(res => res.json())
    );
    const allSlides = await Promise.all(heroPromises);

    let html = `
      <div class="hero-manager">
        <div class="section-header" style="margin-bottom: 32px;">
          <h2>Hero Sections</h2>
          <p>Edit titles, descriptions, and images for each page's hero slider.</p>
        </div>
        <div class="hero-pages-grid">
    `;

    pages.forEach((page, i) => {
      const slides = allSlides[i];
      const firstSlide = slides[0] || { image_url: PLACEHOLDER_IMG };

      html += `
        <div class="hero-page-card" data-page-id="${page.id}">
          <div class="hero-page-thumb">
            <img src="${firstSlide.image_url || PLACEHOLDER_IMG}" alt="${page.name} hero" onerror="this.src=PLACEHOLDER_IMG">
          </div>
          <div class="hero-page-info">
            <h3>${page.name}</h3>
            <p class="hero-page-file">${page.file}</p>
            <p class="hero-page-slides-count">${slides.length} slide(s)</p>
            <button class="btn-secondary edit-hero-btn" data-page-id="${page.id}" data-page-name="${page.name}">
              <i class="fas fa-edit"></i> Edit Hero
            </button>
          </div>
        </div>
      `;
    });

    html += `</div>`;

    html += `
      <div class="hero-edit-modal" id="heroEditModal" style="display: none;">
        <div class="modal-overlay"></div>
        <div class="modal-content">
          <div class="modal-header">
            <h3 id="modalPageName"></h3>
            <button class="modal-close" id="closeHeroModal"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body" id="heroSlidesContainer"></div>
          <div class="modal-footer">
            <button class="btn-secondary" id="cancelHeroEdit">Cancel</button>
            <button class="btn-primary" id="saveHeroEdit">Save Changes</button>
          </div>
        </div>
      </div>
    `;

    contentArea.innerHTML = html;
    contentArea.classList.remove('loading');

    document.querySelectorAll('.edit-hero-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const pageId = e.currentTarget.getAttribute('data-page-id');
        const pageName = e.currentTarget.getAttribute('data-page-name');
        openHeroEditor(pageId, pageName);
      });
    });

    document.getElementById('closeHeroModal').addEventListener('click', closeHeroEditor);
    document.getElementById('cancelHeroEdit').addEventListener('click', closeHeroEditor);
    document.getElementById('saveHeroEdit').addEventListener('click', saveHeroChanges);
    document.querySelector('.modal-overlay').addEventListener('click', closeHeroEditor);

  } catch (err) {
    console.error(err);
    showToast('Failed to load hero data.', 'error');
    contentArea.classList.remove('loading');
  }
}

async function openHeroEditor(pageId, pageName) {
  currentEditingPageId = pageId;
  document.getElementById('modalPageName').textContent = `Edit: ${pageName}`;

  try {
    const res = await apiRequest(`${API_BASE_URL}/api/admin/hero/${pageId}`);
    const slides = await res.json();

    const slidesContainer = document.getElementById('heroSlidesContainer');
    let slidesHtml = '';

    slides.forEach((slide, index) => {
      slidesHtml += `
        <div class="slide-editor" data-slide-index="${index}">
          <h4>Slide ${index + 1}</h4>
          <div class="form-group">
            <label>Title</label>
            <input type="text" class="slide-title" value="${escapeHtml(slide.title)}">
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea class="slide-description" rows="3">${escapeHtml(slide.description)}</textarea>
          </div>
          <div class="form-group">
            <label>Image</label>
            <div class="image-upload-group">
              <input type="file" class="slide-image-input" accept="image/*">
              <div class="image-preview">
                <img src="${slide.image_url || PLACEHOLDER_IMG}" alt="Preview" class="preview-img">
              </div>
            </div>
          </div>
        </div>
      `;
    });

    slidesContainer.innerHTML = slidesHtml;

    document.querySelectorAll('.slide-image-input').forEach(input => {
      input.addEventListener('change', handleImageUpload);
    });

    document.getElementById('heroEditModal').style.display = 'flex';
  } catch (err) {
    console.error(err);
    showToast('Failed to load hero data.', 'error');
  }
}

function closeHeroEditor() {
  document.getElementById('heroEditModal').style.display = 'none';
  currentEditingPageId = null;
}

function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const previewImg = e.target.closest('.image-upload-group').querySelector('.preview-img');
    if (previewImg) previewImg.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

async function saveHeroChanges() {
  const pageId = currentEditingPageId;
  const slideEditors = document.querySelectorAll('.slide-editor');

  try {
    for (const editor of slideEditors) {
      const slideIndex = editor.getAttribute('data-slide-index');
      const title = editor.querySelector('.slide-title').value;
      const description = editor.querySelector('.slide-description').value;
      let imageUrl = editor.querySelector('.preview-img')?.src || '';
      const imageInput = editor.querySelector('.slide-image-input');

      if (imageInput.files.length > 0) {
        const formData = new FormData();
        formData.append('image', imageInput.files[0]);
        const uploadRes = await apiRequest(`${API_BASE_URL}/api/admin/upload`, { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.image_url;
      }

      await apiRequest(`${API_BASE_URL}/api/admin/hero/${pageId}/${slideIndex}`, {
        method: 'PUT',
        body: JSON.stringify({ title, description, image_url: imageUrl })
      });
    }

    showToast('Hero section updated successfully!', 'success');
    closeHeroEditor();
    renderHeroManager();
  } catch (err) {
    console.error(err);
    showToast('Error saving hero changes.', 'error');
  }
}

// ======================
// HIGHLIGHTS MANAGEMENT (API – FIXED)
// ======================
let currentHighlightPageId = null;

async function renderHighlightsManager() {
  const pages = [
    { id: 'index', name: 'Home Page', file: 'index.html' },
    { id: 'education', name: 'Education & Awareness', file: 'Education_Awareness.html' }
  ];

  let html = `
    <div class="highlights-manager">
      <div class="section-header" style="margin-bottom: 32px;">
        <h2>Impact Highlights</h2>
        <p>Edit badge, heading, description, bullet points, and images for each page's highlight section.</p>
      </div>
      <div class="highlights-pages-grid">
  `;

  for (const page of pages) {
        let highlight = null;
    try {
      const res = await apiRequest(`${API_BASE_URL}/api/admin/highlights/${page.id}`);
      if (res.ok) {
        highlight = await res.json();
      }
    } catch (err) {
      console.warn(`Could not load highlight for ${page.id}:`, err);
    }

    // If no highlight, create an empty one
    if (!highlight) {
      highlight = {
        badge: '',
        heading: '',
        description: '',
        read_more_link: '#',
        top_image: PLACEHOLDER_IMG,
        bottom_image: PLACEHOLDER_IMG,
        bullets: []
      };
    }

    highlightsCache[page.id] = highlight;

    const topImage = highlight && highlight.top_image ? highlight.top_image : PLACEHOLDER_IMG;
    const badge = highlight && highlight.badge ? highlight.badge : 'No highlight';

    html += `
      <div class="highlight-page-card" data-page-id="${page.id}">
        <div class="highlight-page-thumb">
          <img src="${topImage}" alt="${page.name} highlight" onerror="this.src=PLACEHOLDER_IMG">
        </div>
        <div class="highlight-page-info">
          <h3>${page.name}</h3>
          <p class="highlight-page-file">${page.file}</p>
          <p class="highlight-badge">${badge}</p>
          <button class="btn-secondary edit-highlight-btn" data-page-id="${page.id}" data-page-name="${page.name}">
            <i class="fas fa-edit"></i> Edit Highlight
          </button>
        </div>
      </div>
    `;
  }

  html += `</div>`;

  html += `
    <div class="highlight-edit-modal" id="highlightEditModal" style="display: none;">
      <div class="modal-overlay"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3 id="modalHighlightPageName"></h3>
          <button class="modal-close" id="closeHighlightModal"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Badge</label>
            <input type="text" id="highlightBadge" class="form-input">
          </div>
          <div class="form-group">
            <label>Heading</label>
            <input type="text" id="highlightHeading" class="form-input">
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea id="highlightDescription" rows="4" class="form-input"></textarea>
          </div>
          <div class="form-group">
            <label>Read More Link</label>
            <input type="text" id="highlightReadMore" class="form-input">
          </div>
          <div class="form-group">
            <label>Bullet Points</label>
            <div id="bulletsContainer"></div>
            <button type="button" class="btn-add-bullet" id="addBulletBtn">
              <i class="fas fa-plus"></i> Add Bullet
            </button>
          </div>
          <div class="form-group">
            <label>Top Image</label>
            <div class="image-upload-group">
              <input type="file" id="topImageInput" accept="image/*">
              <div class="image-preview">
                <img id="topImagePreview" src="" alt="Top preview">
              </div>
            </div>
          </div>
          <div class="form-group">
            <label>Bottom Image</label>
            <div class="image-upload-group">
              <input type="file" id="bottomImageInput" accept="image/*">
              <div class="image-preview">
                <img id="bottomImagePreview" src="" alt="Bottom preview">
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" id="cancelHighlightEdit">Cancel</button>
          <button class="btn-primary" id="saveHighlightEdit">Save Changes</button>
        </div>
      </div>
    </div>
  `;

  contentArea.innerHTML = html;
  contentArea.classList.remove('loading');

  document.querySelectorAll('.edit-highlight-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const pageId = e.currentTarget.getAttribute('data-page-id');
      const pageName = e.currentTarget.getAttribute('data-page-name');
      openHighlightEditor(pageId, pageName);
    });
  });

  document.getElementById('closeHighlightModal').addEventListener('click', closeHighlightEditor);
  document.getElementById('cancelHighlightEdit').addEventListener('click', closeHighlightEditor);
  document.getElementById('saveHighlightEdit').addEventListener('click', saveHighlightChanges);
  document.querySelector('#highlightEditModal .modal-overlay').addEventListener('click', closeHighlightEditor);
  document.getElementById('addBulletBtn').addEventListener('click', addBulletField);
}

async function openHighlightEditor(pageId, pageName) {
  currentHighlightPageId = pageId;
  document.getElementById('modalHighlightPageName').textContent = `Edit: ${pageName}`;

  if (highlightsCache[pageId]) {
    populateHighlightModal(highlightsCache[pageId]);
    document.getElementById('highlightEditModal').style.display = 'flex';
    return;
  }

  let highlight = null;
  try {
    const res = await apiRequest(`${API_BASE_URL}/api/admin/highlights/${pageId}`);
    if (res.ok) {
      highlight = await res.json();
    }
  } catch (err) {
    console.warn('Could not fetch highlight (using empty):', err);
  }

  if (!highlight) {
    highlight = {
      badge: '',
      heading: '',
      description: '',
      read_more_link: '#',
      top_image: PLACEHOLDER_IMG,
      bottom_image: PLACEHOLDER_IMG,
      bullets: []
    };
  }

  populateHighlightModal(highlight);
  document.getElementById('highlightEditModal').style.display = 'flex';
}

function populateHighlightModal(highlight) {
  document.getElementById('highlightBadge').value = highlight.badge || '';
  document.getElementById('highlightHeading').value = highlight.heading || '';
  document.getElementById('highlightDescription').value = highlight.description || '';
  document.getElementById('highlightReadMore').value = highlight.read_more_link || '#';
  document.getElementById('topImagePreview').src = highlight.top_image || PLACEHOLDER_IMG;
  document.getElementById('bottomImagePreview').src = highlight.bottom_image || PLACEHOLDER_IMG;

  const bulletsContainer = document.getElementById('bulletsContainer');
  bulletsContainer.innerHTML = '';
  if (highlight.bullets && highlight.bullets.length) {
    highlight.bullets.forEach((bullet, index) => {
      let bulletText = bullet;
      if (typeof bullet === 'object' && bullet !== null) {
        bulletText = bullet.text || bullet.content || bullet.title || '';
      }
      bulletsContainer.appendChild(createBulletRow(bulletText, index));
    });
  }

  document.getElementById('topImageInput').value = '';
  document.getElementById('bottomImageInput').value = '';

  document.getElementById('topImageInput').onchange = (e) => {
    if (e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => document.getElementById('topImagePreview').src = ev.target.result;
      reader.readAsDataURL(e.target.files[0]);
    }
  };
  document.getElementById('bottomImageInput').onchange = (e) => {
    if (e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => document.getElementById('bottomImagePreview').src = ev.target.result;
      reader.readAsDataURL(e.target.files[0]);
    }
  };
}

function closeHighlightEditor() {
  document.getElementById('highlightEditModal').style.display = 'none';
  currentHighlightPageId = null;
}

function createBulletRow(text, index) {
  const div = document.createElement('div');
  div.className = 'bullet-row';
  div.innerHTML = `
    <input type="text" class="bullet-input" value="${escapeHtml(text)}">
    <button type="button" class="btn-remove-bullet" data-index="${index}">
      <i class="fas fa-trash"></i>
    </button>
  `;
  div.querySelector('.btn-remove-bullet').addEventListener('click', () => div.remove());
  return div;
}

function addBulletField() {
  const container = document.getElementById('bulletsContainer');
  container.appendChild(createBulletRow('', container.children.length));
}

async function saveHighlightChanges() {
  const pageId = currentHighlightPageId;
  const badge = document.getElementById('highlightBadge').value;
  const heading = document.getElementById('highlightHeading').value;
  const description = document.getElementById('highlightDescription').value;
  const readMoreLink = document.getElementById('highlightReadMore').value;
  const bulletInputs = document.querySelectorAll('#bulletsContainer .bullet-input');
  const bullets = Array.from(bulletInputs).map(input => input.value).filter(v => v.trim() !== '');

  let topImage = document.getElementById('topImagePreview').src;
  let bottomImage = document.getElementById('bottomImagePreview').src;

  try {
    const topInput = document.getElementById('topImageInput');
    if (topInput.files.length > 0) {
      const formData = new FormData();
      formData.append('image', topInput.files[0]);
      const uploadRes = await apiRequest(`${API_BASE_URL}/api/admin/upload`, { method: 'POST', body: formData });
      const data = await uploadRes.json();
      topImage = data.image_url;
    }

    const bottomInput = document.getElementById('bottomImageInput');
    if (bottomInput.files.length > 0) {
      const formData = new FormData();
      formData.append('image', bottomInput.files[0]);
      const uploadRes = await apiRequest(`${API_BASE_URL}/api/admin/upload`, { method: 'POST', body: formData });
      const data = await uploadRes.json();
      bottomImage = data.image_url;
    }

    await apiRequest(`${API_BASE_URL}/api/admin/highlights/${pageId}`, {
      method: 'PUT',
      body: JSON.stringify({
        badge, heading, description,
        read_more_link: readMoreLink,
        top_image: topImage,
        bottom_image: bottomImage,
        bullets
      })
    });

    showToast('Highlight updated successfully!', 'success');
    closeHighlightEditor();
    renderHighlightsManager();
  } catch (err) {
    console.error(err);
    showToast('Error saving highlight.', 'error');
  }
}

// ======================
// NEWS MANAGEMENT (API)
// ======================
let currentEditingNewsId = null;

async function renderNewsManager() {
  try {
    const res = await apiRequest(`${API_BASE_URL}/api/admin/news`);
    const articles = await res.json();

    let html = `
      <div class="news-manager">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px;">
          <div>
            <h2 style="margin:0; font-size:1.5rem; font-weight:700;">News Articles</h2>
            <p style="margin:4px 0 0; color:#64748b;">Manage news that appears in the "In the news" slider.</p>
          </div>
          <button class="add-news-btn" id="addNewsBtn">
            <i class="fas fa-plus"></i> Add News
          </button>
        </div>
        <div class="news-table-container">
          <table class="news-table">
            <thead><tr><th>Image</th><th>Title</th><th>Description</th><th>Link</th><th>Actions</th></tr></thead>
            <tbody>
    `;

    articles.forEach(article => {
      html += `
        <tr data-id="${article.id}">
          <td><img src="${article.image_url || PLACEHOLDER_IMG}" alt="thumbnail" class="news-thumb" onerror="this.src=PLACEHOLDER_IMG"></td>
          <td class="news-title-cell">${escapeHtml(article.title)}</td>
          <td class="news-desc-cell">${escapeHtml(article.description).substring(0, 80)}...</td>
          <td class="news-link-cell"><a href="${article.link}" target="_blank">🔗</a></td>
          <td>
            <button class="btn-icon edit-news-btn" data-id="${article.id}" title="Edit"><i class="fas fa-edit"></i></button>
            <button class="btn-icon delete-news-btn" data-id="${article.id}" title="Delete"><i class="fas fa-trash"></i></button>
          </td>
        </tr>
      `;
    });

    html += `</tbody></table></div></div>`;

    html += `
      <div class="news-edit-modal" id="newsEditModal" style="display: none;">
        <div class="modal-overlay"></div>
        <div class="modal-content">
          <div class="modal-header">
            <h3 id="newsModalTitle">Edit News Article</h3>
            <button class="modal-close" id="closeNewsModal"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <div class="form-group"><label>Title</label><input type="text" id="newsTitle" class="form-input"></div>
            <div class="form-group"><label>Description</label><input type="text" id="newsDescription" class="form-input"></div>
            <div class="form-group"><label>Full Article Link (URL)</label><input type="url" id="newsLink" class="form-input"></div>
            <div class="form-group">
              <label>Image</label>
              <div class="image-upload-group">
                <input type="file" id="newsImageInput" accept="image/*">
                <div class="image-preview"><img id="newsImagePreview" src="" alt="Preview"></div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" id="cancelNewsEdit">Cancel</button>
            <button class="btn-primary" id="saveNewsEdit">Save Changes</button>
          </div>
        </div>
      </div>
    `;

    contentArea.innerHTML = html;
    contentArea.classList.remove('loading');

    document.getElementById('addNewsBtn').addEventListener('click', () => openNewsEditor(null));
    document.querySelectorAll('.edit-news-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.dataset.id);
        const article = articles.find(a => a.id === id);
        if (article) openNewsEditor(article);
      });
    });
    document.querySelectorAll('.delete-news-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = parseInt(e.currentTarget.dataset.id);
        await apiRequest(`${API_BASE_URL}/api/admin/news/${id}`, { method: 'DELETE' });
        showToast('News deleted.', 'success');
        renderNewsManager();
      });
    });

    document.getElementById('closeNewsModal').addEventListener('click', closeNewsEditor);
    document.getElementById('cancelNewsEdit').addEventListener('click', closeNewsEditor);
    document.getElementById('saveNewsEdit').addEventListener('click', saveNewsChanges);
    document.querySelector('#newsEditModal .modal-overlay').addEventListener('click', closeNewsEditor);

    document.getElementById('newsImageInput').addEventListener('change', (e) => {
      if (e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = (ev) => document.getElementById('newsImagePreview').src = ev.target.result;
        reader.readAsDataURL(e.target.files[0]);
      }
    });
  } catch (err) {
    console.error(err);
    showToast('Failed to load news.', 'error');
    contentArea.classList.remove('loading');
  }
}

function openNewsEditor(article) {
  const modal = document.getElementById('newsEditModal');
  document.getElementById('newsModalTitle').textContent = article ? 'Edit News Article' : 'Add News Article';

  if (article) {
    currentEditingNewsId = article.id;
    document.getElementById('newsTitle').value = article.title;
    document.getElementById('newsDescription').value = article.description;
    document.getElementById('newsLink').value = article.link;
    document.getElementById('newsImagePreview').src = article.image_url || PLACEHOLDER_IMG;
  } else {
    currentEditingNewsId = null;
    document.getElementById('newsTitle').value = '';
    document.getElementById('newsDescription').value = '';
    document.getElementById('newsLink').value = '';
    document.getElementById('newsImagePreview').src = PLACEHOLDER_IMG;
  }
  modal.style.display = 'flex';
}

function closeNewsEditor() {
  document.getElementById('newsEditModal').style.display = 'none';
  currentEditingNewsId = null;
}

async function saveNewsChanges() {
  const title = document.getElementById('newsTitle').value.trim();
  const description = document.getElementById('newsDescription').value.trim();
  const link = document.getElementById('newsLink').value.trim();
  const imageInput = document.getElementById('newsImageInput');
  let imageUrl = document.getElementById('newsImagePreview').src;

  if (!title || !description || !link) {
    showToast('Please fill in all fields.', 'error');
    return;
  }

  try {
    if (imageInput && imageInput.files.length > 0) {
      const formData = new FormData();
      formData.append('image', imageInput.files[0]);
      const uploadRes = await apiRequest(`${API_BASE_URL}/api/admin/upload`, { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();
      imageUrl = uploadData.image_url;
    } else {
      if (!imageUrl || imageUrl.startsWith('data:')) {
        imageUrl = '';
      }
    }

    const payload = { title, description, image_url: imageUrl, link };

    if (currentEditingNewsId) {
      await apiRequest(`${API_BASE_URL}/api/admin/news/${currentEditingNewsId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
    } else {
      await apiRequest(`${API_BASE_URL}/api/admin/news`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    }

    showToast('News article saved!', 'success');
    closeNewsEditor();
    renderNewsManager();
  } catch (err) {
    console.error('Error saving news:', err);
    showToast('Error saving news.', 'error');
  }
}

// ======================
// PARTNERS MANAGEMENT (API)
// ======================
let currentEditingPartnerId = null;

async function renderPartnersManager() {
  try {
    const res = await apiRequest(`${API_BASE_URL}/api/admin/partners`);
    const partners = await res.json();

    let html = `
      <div class="partners-manager">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px;">
          <div>
            <h2 style="margin:0; font-size:1.5rem; font-weight:700;">Partner Logos</h2>
            <p style="margin:4px 0 0; color:#64748b;">Add, edit, or remove partner logos displayed across the site.</p>
          </div>
          <button class="add-news-btn" id="addPartnerBtn">
            <i class="fas fa-plus"></i> Add Partner
          </button>
        </div>
        <div class="news-table-container">
          <table class="news-table">
            <thead><tr><th>Logo</th><th>Name</th><th>Website</th><th>Actions</th></tr></thead>
            <tbody>
    `;

    partners.forEach(partner => {
      html += `
        <tr data-id="${partner.id}">
          <td><img src="${partner.logo_url || PLACEHOLDER_IMG}" alt="${partner.name}" class="news-thumb" onerror="this.src=PLACEHOLDER_IMG"></td>
          <td class="news-title-cell">${escapeHtml(partner.name)}</td>
          <td><a href="${partner.website}" target="_blank" class="partner-link">${partner.website}</a></td>
          <td>
            <button class="btn-icon edit-partner-btn" data-id="${partner.id}" title="Edit"><i class="fas fa-edit"></i></button>
            <button class="btn-icon delete-partner-btn" data-id="${partner.id}" title="Delete"><i class="fas fa-trash"></i></button>
          </td>
        </tr>
      `;
    });

    html += `</tbody></table></div></div>`;

    html += `
      <div class="news-edit-modal" id="partnerEditModal" style="display: none;">
        <div class="modal-overlay"></div>
        <div class="modal-content">
          <div class="modal-header">
            <h3 id="partnerModalTitle">Edit Partner</h3>
            <button class="modal-close" id="closePartnerModal"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <div class="form-group"><label>Partner Name</label><input type="text" id="partnerName" class="form-input"></div>
            <div class="form-group"><label>Website URL (optional)</label><input type="url" id="partnerWebsite" class="form-input"></div>
            <div class="form-group">
              <label>Logo Image</label>
              <div class="image-upload-group">
                <input type="file" id="partnerImageInput" accept="image/*">
                <div class="image-preview"><img id="partnerImagePreview" src="" alt="Preview"></div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" id="cancelPartnerEdit">Cancel</button>
            <button class="btn-primary" id="savePartnerEdit">Save Changes</button>
          </div>
        </div>
      </div>
    `;

    contentArea.innerHTML = html;
    contentArea.classList.remove('loading');

    document.getElementById('addPartnerBtn').addEventListener('click', () => openPartnerEditor(null));
    document.querySelectorAll('.edit-partner-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.dataset.id);
        const partner = partners.find(p => p.id === id);
        if (partner) openPartnerEditor(partner);
      });
    });
    document.querySelectorAll('.delete-partner-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = parseInt(e.currentTarget.dataset.id);
        await apiRequest(`${API_BASE_URL}/api/admin/partners/${id}`, { method: 'DELETE' });
        showToast('Partner deleted.', 'success');
        renderPartnersManager();
      });
    });

    document.getElementById('closePartnerModal').addEventListener('click', closePartnerEditor);
    document.getElementById('cancelPartnerEdit').addEventListener('click', closePartnerEditor);
    document.getElementById('savePartnerEdit').addEventListener('click', savePartnerChanges);
    document.querySelector('#partnerEditModal .modal-overlay').addEventListener('click', closePartnerEditor);

    document.getElementById('partnerImageInput').addEventListener('change', (e) => {
      if (e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = (ev) => document.getElementById('partnerImagePreview').src = ev.target.result;
        reader.readAsDataURL(e.target.files[0]);
      }
    });
  } catch (err) {
    console.error(err);
    showToast('Failed to load partners.', 'error');
    contentArea.classList.remove('loading');
  }
}

function openPartnerEditor(partner) {
  const modal = document.getElementById('partnerEditModal');
  document.getElementById('partnerModalTitle').textContent = partner ? 'Edit Partner' : 'Add Partner';
  if (partner) {
    currentEditingPartnerId = partner.id;
    document.getElementById('partnerName').value = partner.name;
    document.getElementById('partnerWebsite').value = partner.website;
    document.getElementById('partnerImagePreview').src = partner.logo_url || PLACEHOLDER_IMG;
  } else {
    currentEditingPartnerId = null;
    document.getElementById('partnerName').value = '';
    document.getElementById('partnerWebsite').value = '#';
    document.getElementById('partnerImagePreview').src = PLACEHOLDER_IMG;
  }
  modal.style.display = 'flex';
}

function closePartnerEditor() {
  document.getElementById('partnerEditModal').style.display = 'none';
  currentEditingPartnerId = null;
}

async function savePartnerChanges() {
  const name = document.getElementById('partnerName').value.trim();
  const website = document.getElementById('partnerWebsite').value.trim();
  let logoUrl = document.getElementById('partnerImagePreview').src;
  const imageInput = document.getElementById('partnerImageInput');

  if (!name) {
    showToast('Partner name is required.', 'error');
    return;
  }

  try {
    if (imageInput.files.length > 0) {
      const formData = new FormData();
      formData.append('image', imageInput.files[0]);
      const uploadRes = await apiRequest(`${API_BASE_URL}/api/admin/upload`, { method: 'POST', body: formData });
      const data = await uploadRes.json();
      logoUrl = data.image_url;
    }

    const payload = { name, logo_url: logoUrl, website: website || '#' };
    if (currentEditingPartnerId) {
      await apiRequest(`${API_BASE_URL}/api/admin/partners/${currentEditingPartnerId}`, { method: 'PUT', body: JSON.stringify(payload) });
    } else {
      await apiRequest(`${API_BASE_URL}/api/admin/partners`, { method: 'POST', body: JSON.stringify(payload) });
    }

    showToast('Partner saved successfully!', 'success');
    closePartnerEditor();
    renderPartnersManager();
  } catch (err) {
    console.error(err);
    showToast('Error saving partner.', 'error');
  }
}

// ======================
// SUBSCRIBERS MANAGEMENT (API)
// ======================
async function loadSubscribers() {
  try {
    const res = await apiRequest(`${API_BASE_URL}/api/admin/subscribers`);
    return await res.json();
  } catch (err) {
    console.error('Failed to load subscribers:', err);
    return [];
  }
}

async function updateSubscriberBadge() {
  const badge = document.getElementById('subscriberBadge');
  if (!badge) return;
  try {
    const subscribers = await loadSubscribers();
    badge.textContent = subscribers.length;
    badge.style.display = subscribers.length > 0 ? 'inline-flex' : 'none';
  } catch (err) {
    console.error(err);
  }
}

async function renderSubscribersManager() {
  const subscribers = await loadSubscribers();
  let html = `
    <div class="subscribers-manager">
      <div class="section-top">
        <div class="section-info">
          <h2>Newsletter Subscribers</h2>
          <p>Manage all email subscribers from the website newsletter form.</p>
          <span class="total-badge">${subscribers.length} subscriber${subscribers.length !== 1 ? 's' : ''}</span>
        </div>
        <div class="section-actions">
          <button class="btn-icon-action btn-export" id="exportSubscribersBtn" title="Export CSV">
            <i class="fas fa-download"></i>
          </button>
          <button class="btn-icon-action btn-clear" id="clearSubscribersBtn" title="Clear All">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      <div class="news-table-container">
        <table class="news-table">
          <thead><tr><th>#</th><th>Email</th><th>Date Subscribed</th><th>Actions</th></tr></thead>
          <tbody>`;

  if (subscribers.length === 0) {
    html += `<tr><td colspan="4" style="text-align:center; padding:40px; color:#999;">No subscribers yet.</td></tr>`;
  } else {
    subscribers.forEach((sub, index) => {
      html += `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(sub.email || 'No email')}</td>
          <td>${new Date(sub.subscribed_at).toLocaleDateString()}</td>
          <td>
            <button class="btn-icon delete-subscriber-btn" data-id="${sub.id}" title="Delete">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>`;
    });
  }

  html += `</tbody></table></div></div>`;

  contentArea.innerHTML = html;
  contentArea.classList.remove('loading');

  document.getElementById("exportSubscribersBtn").addEventListener("click", async () => {
    const subs = await loadSubscribers();
    exportSubscribersCSV(subs);
  });

  document.getElementById("clearSubscribersBtn").addEventListener("click", async () => {
    await apiRequest(`${API_BASE_URL}/api/admin/subscribers`, { method: 'DELETE' });
    showToast("All subscribers cleared.", "success");
    renderSubscribersManager();
  });

  document.querySelectorAll(".delete-subscriber-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = parseInt(e.currentTarget.getAttribute("data-id"));
      await apiRequest(`${API_BASE_URL}/api/admin/subscribers/${id}`, { method: 'DELETE' });
      showToast("Subscriber deleted.", "success");
      renderSubscribersManager();
    });
  });
}

function exportSubscribersCSV(subscribers) {
  if (!subscribers.length) {
    showToast("No subscribers to export.", "error");
    return;
  }
  let csv = "Email,Date Subscribed\n";
  subscribers.forEach(sub => {
    csv += `"${sub.email}","${new Date(sub.subscribed_at).toLocaleDateString()}"\n`;
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "subscribers.csv";
  a.click();
  URL.revokeObjectURL(url);
  showToast("CSV exported!", "success");
}

window.addEventListener('storage', () => {
  updateSubscriberBadge();
  if (sectionTitle.textContent === 'View Subscribers') {
    renderSubscribersManager();
  }
});

updateSubscriberBadge();

// ======================
// SITE SETTINGS (API)
// ======================
async function renderSiteSettings() {
  try {
    const res = await apiRequest(`${API_BASE_URL}/api/admin/settings`);
    const s = await res.json();

    let html = `
      <div class="settings-enterprise">
        <aside class="settings-sidebar">
          <div class="settings-sidebar-header">
            <i class="fas fa-sliders-h"></i><span>Settings</span>
          </div>
          <nav class="settings-nav">
            <a href="#" class="settings-nav-item active" data-tab="vision-mission"><i class="fas fa-bullseye"></i> Vision & Mission</a>
            <a href="#" class="settings-nav-item" data-tab="contact"><i class="fas fa-address-card"></i> Contact Info</a>
            <a href="#" class="settings-nav-item" data-tab="social"><i class="fas fa-share-nodes"></i> Social Media</a>
          </nav>
        </aside>
        <div class="settings-main">
          <div class="settings-tab-content active" id="tab-vision-mission">
            <div class="settings-card premium-card">
              <div class="premium-card-header"><div class="premium-card-icon"><i class="fas fa-eye"></i></div><div><h2>Our Vision</h2><p>The future we strive to create</p></div></div>
              <div class="floating-label"><textarea id="settingsVision" class="premium-textarea" rows="4">${escapeHtml(s.vision || '')}</textarea><label>Vision statement</label></div>
            </div>
            <div class="settings-card premium-card">
              <div class="premium-card-header"><div class="premium-card-icon"><i class="fas fa-bullseye"></i></div><div><h2>Our Mission</h2><p>What we do every day</p></div></div>
              <div class="floating-label"><textarea id="settingsMission" class="premium-textarea" rows="4">${escapeHtml(s.mission || '')}</textarea><label>Mission statement</label></div>
            </div>
            <div class="settings-card premium-card">
              <div class="premium-card-header"><div class="premium-card-icon"><i class="fas fa-heart"></i></div><div><h2>Core Purpose</h2><p>Why we exist</p></div></div>
              <div class="floating-label"><textarea id="settingsCorePurpose" class="premium-textarea" rows="4">${escapeHtml(s.core_purpose || '')}</textarea><label>Core purpose statement</label></div>
            </div>
          </div>
          <div class="settings-tab-content" id="tab-contact">
            <div class="settings-card premium-card">
              <div class="premium-card-header"><div class="premium-card-icon"><i class="fas fa-map-marker-alt"></i></div><div><h2>Contact Information</h2><p>How visitors can reach you</p></div></div>
              <div class="floating-label"><textarea id="settingsAddress" class="premium-textarea" rows="3">${escapeHtml(s.contact_address || '')}</textarea><label>Physical address</label></div>
              <div class="form-row">
                <div class="floating-label"><input type="text" id="settingsPhone" class="premium-input" value="${escapeHtml(s.contact_phone || '')}"><label>Phone number</label></div>
                <div class="floating-label"><input type="email" id="settingsEmail" class="premium-input" value="${escapeHtml(s.contact_email || '')}"><label>Email address</label></div>
              </div>
            </div>
          </div>
          <div class="settings-tab-content" id="tab-social">
            <div class="settings-card premium-card">
              <div class="premium-card-header"><div class="premium-card-icon"><i class="fas fa-share-nodes"></i></div><div><h2>Social Media Links</h2><p>Connect your audiences</p></div></div>
              <div class="social-grid">
                <div class="floating-label"><div class="social-input-icon"><i class="fab fa-facebook"></i></div><input type="url" id="settingsFacebook" class="premium-input with-icon" value="${escapeHtml(s.facebook_url || '')}"><label>Facebook</label></div>
                <div class="floating-label"><div class="social-input-icon"><i class="fab fa-twitter"></i></div><input type="url" id="settingsTwitter" class="premium-input with-icon" value="${escapeHtml(s.twitter_url || '')}"><label>Twitter</label></div>
                <div class="floating-label"><div class="social-input-icon"><i class="fab fa-instagram"></i></div><input type="url" id="settingsInstagram" class="premium-input with-icon" value="${escapeHtml(s.instagram_url || '')}"><label>Instagram</label></div>
                <div class="floating-label"><div class="social-input-icon"><i class="fab fa-linkedin-in"></i></div><input type="url" id="settingsLinkedin" class="premium-input with-icon" value="${escapeHtml(s.linkedin_url || '')}"><label>LinkedIn</label></div>
                <div class="floating-label"><div class="social-input-icon"><i class="fab fa-youtube"></i></div><input type="url" id="settingsYoutube" class="premium-input with-icon" value="${escapeHtml(s.youtube_url || '')}"><label>YouTube</label></div>
              </div>
            </div>
          </div>
          <div class="settings-save-bar">
            <div class="save-status" id="saveStatus"><i class="fas fa-check-circle"></i> All changes saved</div>
            <button class="btn-save-settings" id="saveSettingsBtn"><i class="fas fa-save"></i> Save Changes</button>
          </div>
        </div>
      </div>
    `;

    contentArea.innerHTML = html;
    contentArea.classList.remove('loading');

    document.querySelectorAll('.settings-nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.settings-nav-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');
        const tabId = item.getAttribute('data-tab');
        document.querySelectorAll('.settings-tab-content').forEach(tc => tc.classList.remove('active'));
        document.getElementById(`tab-${tabId}`).classList.add('active');
      });
    });

    document.getElementById('saveSettingsBtn').addEventListener('click', saveSiteSettings);
  } catch (err) {
    console.error(err);
    showToast('Failed to load site settings.', 'error');
    contentArea.classList.remove('loading');
  }
}

async function saveSiteSettings() {
  try {
    const payload = {
      vision: document.getElementById('settingsVision').value.trim(),
      mission: document.getElementById('settingsMission').value.trim(),
      core_purpose: document.getElementById('settingsCorePurpose').value.trim(),
      contact_address: document.getElementById('settingsAddress').value.trim(),
      contact_phone: document.getElementById('settingsPhone').value.trim(),
      contact_email: document.getElementById('settingsEmail').value.trim(),
      facebook_url: document.getElementById('settingsFacebook').value.trim(),
      twitter_url: document.getElementById('settingsTwitter').value.trim(),
      instagram_url: document.getElementById('settingsInstagram').value.trim(),
      linkedin_url: document.getElementById('settingsLinkedin').value.trim(),
      youtube_url: document.getElementById('settingsYoutube').value.trim()
    };

    await apiRequest(`${API_BASE_URL}/api/admin/settings`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });

    showToast('Site settings updated successfully!', 'success');
    const status = document.getElementById('saveStatus');
    if (status) {
      status.classList.add('show');
      setTimeout(() => status.classList.remove('show'), 2500);
    }
  } catch (err) {
    console.error(err);
    showToast('Error saving settings.', 'error');
  }
}

// ======================
// HELPERS
// ======================
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  if (typeof text !== 'string') text = String(text);
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Smart auto‑refresh – only when user is idle
let adminRefreshInterval;
let adminIdleTimer;

function stopAdminAutoRefresh() {
  if (adminRefreshInterval) {
    clearInterval(adminRefreshInterval);
    adminRefreshInterval = null;
  }
}

function startAdminAutoRefresh() {
  stopAdminAutoRefresh();
  adminRefreshInterval = setInterval(() => {
    const hasModal = document.querySelector('.modal-content[style*="display: flex"], .modal-content[style*="display: block"]');
    const activeEl = document.activeElement;
    const isTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable);
    const isFormFocused = activeEl && activeEl.closest('form');

    if (!hasModal && !isTyping && !isFormFocused) {
      updateSubscriberBadge();
      loadSection(currentAdminSection);
    }
  }, 15000);
}

// Pause refresh on user interaction, resume after 5 seconds of idle
function resetAdminIdleTimer() {
  stopAdminAutoRefresh();
  clearTimeout(adminIdleTimer);
  adminIdleTimer = setTimeout(() => {
    startAdminAutoRefresh();
  }, 5000);
}

// Initial start
startAdminAutoRefresh();

// Events that indicate user activity
document.addEventListener('click', resetAdminIdleTimer);
document.addEventListener('keydown', resetAdminIdleTimer);
document.addEventListener('focusin', resetAdminIdleTimer);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    resetAdminIdleTimer();
  }
});
window.addEventListener('focus', resetAdminIdleTimer);