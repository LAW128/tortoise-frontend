

// ======================================================
// MAIN.JS - COMPLETE FIXED VERSION
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
    initActiveNavigation();
    initThemeToggle();
    initHamburgerMenu();
    initSmoothScroll();
    initNavbarScroll();
    initHeroCarousel();
  
    initProgrammesHero();
    initImpactSlider();
    initNewsSlider();
    initScrollIndicator();
    initNewsletter();
    initDropdowns();
    initAnimations();
});


/* ======================================================
   ACTIVE NAVIGATION
====================================================== */

function initActiveNavigation() {
    const currentPage =
        window.location.pathname.split("/").pop().toLowerCase() || "index.html";

    const currentBase = currentPage.replace(".html", "");

    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.remove("active");

        const href = link.getAttribute("href");

        if (!href) return;

        const page = href.toLowerCase();
        const base = page.replace(".html", "");

        if (page === currentPage) {
            link.classList.add("active");
            return;
        }

        if (
            (currentPage === "" || currentPage === "index.html") &&
            (page === "index.html" || page === "#home")
        ) {
            link.classList.add("active");
            return;
        }

        if (base === currentBase) {
            link.classList.add("active");
        }
    });
}


/* ======================================================
   THEME TOGGLE
====================================================== */

function initThemeToggle() {
    const button = document.getElementById("themeToggle");

    if (!button) return;

    const icon = button.querySelector("i");
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
        document.body.classList.add("dark-theme");
        if (icon) icon.className = "fas fa-sun";
    }

    button.addEventListener("click", () => {
        const darkMode = document.body.classList.toggle("dark-theme");

        localStorage.setItem("theme", darkMode ? "dark" : "light");

        if (icon) {
            icon.style.transition = "transform .35s ease";
            icon.style.transform = "rotate(180deg) scale(.75)";

            setTimeout(() => {
                icon.className = darkMode ? "fas fa-sun" : "fas fa-moon";
                icon.style.transform = "rotate(360deg) scale(1)";
            }, 170);
        }
    });
}


/* ======================================================
   HAMBURGER MENU (FIXED)
====================================================== */

function initHamburgerMenu() {
    const hamburger = document.getElementById("hamburger");
    const navMenu = document.getElementById("navMenu");

    if (!hamburger || !navMenu) return;

    hamburger.addEventListener("click", () => {
        hamburger.classList.toggle("active");
        navMenu.classList.toggle("active");

        document.body.style.overflow =
            navMenu.classList.contains("active") ? "hidden" : "";
    });

    // FIX: Only close hamburger menu for standard navigation links, NOT dropdown triggers
    navMenu.querySelectorAll("a:not(.dropdown-toggle):not(.nav-dropdown-toggle)").forEach(link => {
        link.addEventListener("click", () => {
            // Don't close for empty anchor hashes
            if (link.getAttribute("href") === "#") return;

            hamburger.classList.remove("active");
            navMenu.classList.remove("active");
            document.body.style.overflow = "";
        });
    });

    document.addEventListener("click", e => {
        if (
            navMenu.classList.contains("active") &&
            !navMenu.contains(e.target) &&
            !hamburger.contains(e.target)
        ) {
            hamburger.classList.remove("active");
            navMenu.classList.remove("active");
            document.body.style.overflow = "";
        }
    });
}


/* ======================================================
   SMOOTH SCROLL
====================================================== */

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener("click", function (e) {
            const href = this.getAttribute("href");

            if (href === "#" || !href) return;

            const target = document.querySelector(href);

            if (!target) return;

            e.preventDefault();

            const header = document.getElementById("mainHeader");
            const headerHeight = header ? header.offsetHeight : 80;

            window.scrollTo({
                top:
                    target.getBoundingClientRect().top +
                    window.scrollY -
                    headerHeight,
                behavior: "smooth"
            });

            history.pushState(null, null, href);
        });
    });
}


/* ======================================================
   NAVBAR SCROLL
====================================================== */

function initNavbarScroll() {
    const header = document.getElementById("mainHeader");
    const progressBar = document.getElementById("progressBar");

    if (!header) return;

    let lastScroll = 0;
    let ticking = false;

    function updateNavbar() {
        const scrollY = window.scrollY;

        if (scrollY > 50) {
            header.classList.add("scrolled");
        } else {
            header.classList.remove("scrolled");
        }

        if (scrollY > 100 && scrollY > lastScroll) {
            header.style.transform = "translateY(-100%)";
        } else {
            header.style.transform = "translateY(0)";
        }

        lastScroll = scrollY;

        if (progressBar) {
            const documentHeight =
                document.documentElement.scrollHeight - window.innerHeight;
            const progress = documentHeight > 0
                ? (scrollY / documentHeight) * 100
                : 0;
            progressBar.style.width = progress + "%";
        }

        const page = window.location.pathname.split("/").pop().toLowerCase();
        if (page === "" || page === "index.html") {
            updateActiveSection(scrollY);
        }

        ticking = false;
    }

    function handleScroll() {
        if (ticking) return;
        requestAnimationFrame(() => {
            updateNavbar();
            ticking = false;
        });
        ticking = true;
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    updateNavbar();
}


/* ======================================================
   ACTIVE SECTION (SCROLL SPY)
====================================================== */

function updateActiveSection(scrollY) {
    const sections = document.querySelectorAll("section[id]");
    const navLinks = document.querySelectorAll(".nav-link:not(.dropdown-toggle)");

    if (!sections.length) return;

    sections.forEach(section => {
        const top = section.offsetTop - 150;
        const bottom = top + section.offsetHeight;

        if (scrollY >= top && scrollY < bottom) {
            navLinks.forEach(link => link.classList.remove("active"));

            const match = document.querySelector(
                `.nav-link[href="#${section.id}"]`
            );

            if (match) match.classList.add("active");
        }
    });
}


/* ======================================================
   HERO CAROUSEL (MAIN)
====================================================== */

function initHeroCarousel() {
    const slides = document.querySelectorAll(".carousel-slide");
    if (!slides.length) return;

    const dots = document.querySelectorAll(".carousel-dots .dot");
    const prevBtn = document.querySelector(".carousel-prev");
    const nextBtn = document.querySelector(".carousel-next");

    let index = 0;
    let interval;
    const AUTOPLAY = 5000;

    function show(i) {
        slides.forEach(s => s.classList.remove("active"));
        dots.forEach(d => d.classList.remove("active"));
        slides[i].classList.add("active");
        if (dots[i]) dots[i].classList.add("active");
        index = i;
    }

    function next() {
        show((index + 1) % slides.length);
    }

    function prev() {
        show((index - 1 + slides.length) % slides.length);
    }

    function start() {
        stop();
        interval = setInterval(next, AUTOPLAY);
    }

    function stop() {
        clearInterval(interval);
    }

    function reset() {
        stop();
        start();
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", () => { next(); reset(); });
    }

    if (prevBtn) {
        prevBtn.addEventListener("click", () => { prev(); reset(); });
    }

    dots.forEach((dot, i) => {
        dot.addEventListener("click", () => { show(i); reset(); });
    });

    const carousel = document.querySelector(".hero-carousel");

    if (carousel) {
        carousel.addEventListener("mouseenter", stop);
        carousel.addEventListener("mouseleave", start);
    }

    document.addEventListener("visibilitychange", () => {
        document.hidden ? stop() : start();
    });

    start();
}




/* ======================================================
   PROGRAMMES HERO SLIDER
====================================================== */

function initProgrammesHero() {
    const slides = document.querySelectorAll(".programmes-slide");

    if (!slides.length) return;

    let index = 0;
    let interval;

    function show(i) {
        slides.forEach(s => s.classList.remove("active"));
        slides[i].classList.add("active");
        index = i;
    }

    function next() {
        show((index + 1) % slides.length);
    }

    function start() {
        stop();
        interval = setInterval(next, 6000);
    }

    function stop() {
        clearInterval(interval);
    }

    start();

    const hero = document.querySelector(".programmes-hero");

    if (hero) {
        hero.addEventListener("mouseenter", stop);
        hero.addEventListener("mouseleave", start);
    }

    document.addEventListener("visibilitychange", () => {
        document.hidden ? stop() : start();
    });
}


/* ======================================================
   IMPACT SLIDER
====================================================== */

function initImpactSlider() {
    const track = document.getElementById("impactTrack");
    const prevBtn = document.getElementById("impactPrev");
    const nextBtn = document.getElementById("impactNext");
    const dotsContainer = document.getElementById("impactDots");

    if (!track || !prevBtn || !nextBtn) return;

    const cards = track.querySelectorAll(".impact-slide-card");

    if (!cards.length) return;

    let index = 0;
    let interval;
    let locked = false;

    function getVisible() {
        if (window.innerWidth <= 768) return 1;
        if (window.innerWidth <= 1024) return 2;
        return 3;
    }

    function maxIndex() {
        return Math.max(0, cards.length - getVisible());
    }

    function updateWidth() {
        const gap = 24;
        const visible = getVisible();
        const width = `calc((100% - ${(visible - 1) * gap}px) / ${visible})`;
        cards.forEach(c => { c.style.width = width; });
    }

    function move() {
        if (!cards[0]) return;
        const cardWidth = cards[0].offsetWidth;
        const gap = 24;
        track.style.transform = `translateX(-${index * (cardWidth + gap)}px)`;
    }

    function renderDots() {
        if (!dotsContainer) return;

        dotsContainer.innerHTML = "";

        const count = maxIndex() + 1;

        for (let i = 0; i < count; i++) {
            const btn = document.createElement("button");
            btn.className = "dot";

            if (i === 0) btn.classList.add("active");

            btn.addEventListener("click", () => { go(i); reset(); });

            dotsContainer.appendChild(btn);
        }
    }

    function updateDots() {
        const dots = dotsContainer ? dotsContainer.querySelectorAll(".dot") : null;

        dots?.forEach((d, i) => {
            d.classList.toggle("active", i === index);
        });
    }

    function go(i) {
        if (locked) return;

        index = Math.max(0, Math.min(i, maxIndex()));
        locked = true;

        move();
        updateDots();

        setTimeout(() => { locked = false; }, 400);
    }

    function next() {
        go(index >= maxIndex() ? 0 : index + 1);
    }

    function prev() {
        go(index <= 0 ? maxIndex() : index - 1);
    }

    function start() {
        stop();
        interval = setInterval(next, 4000);
    }

    function stop() {
        clearInterval(interval);
    }

    function reset() {
        stop();
        start();
    }

    nextBtn.addEventListener("click", () => { next(); reset(); });
    prevBtn.addEventListener("click", () => { prev(); reset(); });

    const wrapper = document.querySelector(".impact-slider-wrapper");

    if (wrapper) {
        wrapper.addEventListener("mouseenter", stop);
        wrapper.addEventListener("mouseleave", start);
    }

    document.addEventListener("visibilitychange", () => {
        document.hidden ? stop() : start();
    });

    window.addEventListener("resize", () => {
        updateWidth();
        renderDots();
        go(0);
    });

    updateWidth();
    renderDots();
    start();
}


/* ======================================================
   NEWS SLIDER
====================================================== */

function initNewsSlider() {
    const track = document.getElementById("newsTrack");
    const prevBtn = document.getElementById("newsPrev");
    const nextBtn = document.getElementById("newsNext");
    const pagination = document.getElementById("newsPagination");

    if (!track || !prevBtn || !nextBtn) return;

    const slides = track.querySelectorAll(".news-slide");

    if (!slides.length) return;

    let index = 0;
    let interval;
    let locked = false;

    function go(i) {
        if (locked) return;

        index = (i + slides.length) % slides.length;
        locked = true;

        track.style.transform = `translateX(-${index * 100}%)`;
        updateDots();

        setTimeout(() => { locked = false; }, 400);
    }

    function next() {
        go(index + 1);
    }

    function prev() {
        go(index - 1);
    }

    function renderDots() {
        if (!pagination) return;

        pagination.innerHTML = "";

        slides.forEach((_, i) => {
            const btn = document.createElement("button");
            btn.className = "news-dot";

            if (i === 0) btn.classList.add("active");

            btn.addEventListener("click", () => { go(i); reset(); });

            pagination.appendChild(btn);
        });
    }

    function updateDots() {
        const dots = pagination ? pagination.querySelectorAll(".news-dot") : null;

        dots?.forEach((d, i) => {
            d.classList.toggle("active", i === index);
        });
    }

    function start() {
        stop();
        interval = setInterval(next, 6000);
    }

    function stop() {
        clearInterval(interval);
    }

    function reset() {
        stop();
        start();
    }

    nextBtn.addEventListener("click", () => { next(); reset(); });
    prevBtn.addEventListener("click", () => { prev(); reset(); });

    const wrapper = document.querySelector(".news-carousel-wrapper");

    if (wrapper) {
        wrapper.addEventListener("mouseenter", stop);
        wrapper.addEventListener("mouseleave", start);
    }

    document.addEventListener("visibilitychange", () => {
        document.hidden ? stop() : start();
    });

    renderDots();
    start();
}


/* ======================================================
   SCROLL INDICATOR
====================================================== */

function initScrollIndicator() {
    const indicator = document.getElementById("scrollIndicator");
    const label = document.getElementById("scrollLabel");
    const ring = document.querySelector(".scroll-ring-progress");

    if (!indicator || !label) return;

    let atBottom = false;
    let busy = false;

    function update() {
        const scrollY = window.scrollY;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const percent = max > 0 ? (scrollY / max) * 100 : 0;

        if (scrollY > 300) {
            indicator.classList.remove("hidden");
        } else {
            indicator.classList.add("hidden");
        }

        if (ring) {
            const circumference = 264;
            ring.style.strokeDashoffset = circumference - (percent / 100) * circumference;
        }

        if (percent >= 98) {
            atBottom = true;
            indicator.classList.add("at-bottom");
            label.textContent = "Top";
        } else {
            atBottom = false;
            indicator.classList.remove("at-bottom");
            label.textContent = "Scroll";
        }
    }

    indicator.addEventListener("click", () => {
        if (busy) return;

        busy = true;

        const target = atBottom
            ? 0
            : document.documentElement.scrollHeight - window.innerHeight;

        window.scrollTo({ top: target, behavior: "smooth" });

        setTimeout(() => {
            busy = false;
            update();
        }, 800);
    });

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", () => { setTimeout(update, 200); });
    update();
}


/* ======================================================
   NEWSLETTER FORM
====================================================== */

function initNewsletter() {
  const form = document.getElementById("newsletterForm");
  const input = document.getElementById("newsletterEmail");
  const success = document.getElementById("newsletterSuccess");
  const error = document.getElementById("newsletterError");

  if (!form || !input) return;

  form.addEventListener("submit", e => {
    e.preventDefault();
    const email = input.value.trim();

    success?.classList.remove("visible");
    error?.classList.remove("visible");

    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!valid) {
      error?.classList.add("visible");
      setTimeout(() => error?.classList.remove("visible"), 3000);
      return;
    }

    // Save subscriber to localStorage
    const subscribers = JSON.parse(localStorage.getItem("tortoise_subscribers") || "[]");
    subscribers.push({
      email,
      date: new Date().toISOString().slice(0, 10)  // YYYY-MM-DD
    });
    localStorage.setItem("tortoise_subscribers", JSON.stringify(subscribers));

    success?.classList.add("visible");
    form.reset();
    setTimeout(() => success?.classList.remove("visible"), 5000);
  });
}


/* ======================================================
   DROPDOWNS (MOBILE - FIXED)
====================================================== */

function initDropdowns() {
    // Target both potential toggle class names
    const toggles = document.querySelectorAll(".dropdown-toggle, .nav-dropdown-toggle");

    if (!toggles.length) return;

    toggles.forEach(toggle => {
        toggle.addEventListener("click", e => {
            if (window.innerWidth <= 992) {
                e.preventDefault();
                e.stopPropagation(); // Prevents document click from immediately closing it

                // Target parent regardless of whether it uses .nav-dropdown or .nav-item
                const parent = toggle.closest(".nav-dropdown") || toggle.closest(".nav-item");

                if (!parent) return;

                // Close other open sibling dropdowns for smooth accordion behavior
                const siblings = parent.parentElement?.children;
                if (siblings) {
                    Array.from(siblings).forEach(sibling => {
                        if (sibling !== parent) {
                            sibling.classList.remove("active");
                        }
                    });
                }

                // Toggle active state on current dropdown parent
                parent.classList.toggle("active");
            }
        });
    });

    // Close open dropdowns when clicking outside
    document.addEventListener("click", e => {
        if (window.innerWidth > 992) return;

        document.querySelectorAll(".nav-dropdown.active, .nav-item.active").forEach(dropdown => {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove("active");
            }
        });
    });
}


/* ======================================================
   GENERIC INTERSECTION HELPER
====================================================== */

function revealOnScroll(selector, className = "visible", threshold = 0.1) {
    const elements = document.querySelectorAll(selector);

    if (!elements.length) return;

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add(className);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold, rootMargin: "0px 0px -50px 0px" });

    elements.forEach(el => observer.observe(el));
}


/* ======================================================
   CRG SECTION ANIMATION
====================================================== */

function initCRGAnimation() {
    const section = document.querySelector(".crg-section");

    if (!section) return;

    const show = () => { section.classList.add("visible"); };

    const rect = section.getBoundingClientRect();

    if (rect.top < window.innerHeight - 100) {
        show();
        return;
    }

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                show();
                observer.unobserve(section);
            }
        });
    }, { threshold: 0.1 });

    observer.observe(section);
    setTimeout(show, 2000);
}


/* ======================================================
   NFL SECTION ANIMATION
====================================================== */

function initNFLAnimation() {
    const section = document.querySelector(".nfl-section");

    if (!section) return;

    const intro = section.querySelector(".nfl-intro-text");
    const img = section.querySelector(".nfl-illustration");
    const what = section.querySelector(".nfl-what-we-do");
    const cards = section.querySelectorAll(".nfl-card");

    function animate() {
        if (intro) intro.classList.add("visible");
        if (img) img.classList.add("visible");
        if (what) what.classList.add("visible");

        cards.forEach((c, i) => {
            setTimeout(() => { c.classList.add("visible"); }, i * 150);
        });
    }

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animate();
                observer.unobserve(section);
            }
        });
    }, { threshold: 0.1 });

    observer.observe(section);
    setTimeout(animate, 2000);
}


/* ======================================================
   LIVELIHOOD IMPACT ANIMATION
====================================================== */

function initLivelihoodAnimation() {
    const stats = document.querySelector(".li-stats-card");
    const story = document.querySelector(".li-story-card");
    const images = document.querySelectorAll(".li-story-image");

    if (!stats) return;

    function showStats() {
        stats.classList.add("visible");
    }

    function showStory() {
        if (story) story.classList.add("visible");

        images.forEach((img, i) => {
            setTimeout(() => { img.classList.add("visible"); }, i * 150);
        });
    }

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.target === stats && entry.isIntersecting) {
                showStats();
            }

            if (entry.target === story && entry.isIntersecting) {
                showStory();
            }
        });
    }, { threshold: 0.1 });

    observer.observe(stats);
    if (story) observer.observe(story);

    setTimeout(() => {
        showStats();
        setTimeout(showStory, 400);
    }, 2000);
}


/* ======================================================
   MASTER INIT CALL (SAFE ENTRY POINT)
====================================================== */

function initAnimations() {
    if (document.querySelector(".crg-section")) {
        initCRGAnimation();
    }

    if (document.querySelector(".nfl-section")) {
        initNFLAnimation();
    }

    if (document.querySelector(".li-stats-card")) {
        initLivelihoodAnimation();
    }

    revealOnScroll(".fade-in");
    revealOnScroll(".slide-up");
    revealOnScroll(".zoom-in");
}