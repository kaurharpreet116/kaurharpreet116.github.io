/* script.js */
/* Vanilla JS enhancements: dark mode persistence, mobile nav, scroll progress, reveal, active links, contact form */

(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function safeAddEvent(el, type, handler, opts) {
    if (!el) return;
    el.addEventListener(type, handler, opts);
  }

  /* Year */
  function setYear() {
    const yearEl = $("#year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  }

  /* Dark mode with persistence */
  function initTheme() {
    const toggleButton = $("#dark-mode-toggle");
    if (!toggleButton) return;

    const storageKey = "hk_theme";
    const saved = localStorage.getItem(storageKey);

    const systemPrefersDark =
      window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

    const shouldBeDark = saved ? saved === "dark" : systemPrefersDark;

    document.body.classList.toggle("dark-mode", shouldBeDark);
    toggleButton.textContent = shouldBeDark ? "☀️" : "🌙";

    safeAddEvent(toggleButton, "click", () => {
      const isDark = document.body.classList.toggle("dark-mode");
      localStorage.setItem(storageKey, isDark ? "dark" : "light");
      toggleButton.textContent = isDark ? "☀️" : "🌙";
    });
  }

  /* Mobile navigation */
  function initMobileNav() {
    const toggle = $("#nav-toggle");
    const menu = $("#nav-menu");
    const overlay = $("#nav-overlay");

    if (!toggle || !menu || !overlay) return;

    const focusableSelector =
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    function openNav() {
      document.body.classList.add("nav-open");
      toggle.setAttribute("aria-expanded", "true");
      overlay.hidden = false;

      // lock scroll to avoid background scrolling
      document.body.style.overflow = "hidden";

      // focus first link for accessibility
      const first = menu.querySelector("a");
      if (first) first.focus();
    }

    function closeNav() {
      document.body.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
      overlay.hidden = true;
      document.body.style.overflow = "";

      // return focus to toggle
      toggle.focus();
    }

    function isOpen() {
      return document.body.classList.contains("nav-open");
    }

    safeAddEvent(toggle, "click", () => {
      if (isOpen()) closeNav();
      else openNav();
    });

    safeAddEvent(overlay, "click", closeNav);

    // close on Escape
    safeAddEvent(document, "keydown", (e) => {
      if (e.key === "Escape" && isOpen()) closeNav();
    });

    // close when clicking a menu link
    $$("#nav-menu a").forEach((a) => {
      safeAddEvent(a, "click", () => {
        if (isOpen()) closeNav();
      });
    });

    // basic focus trap when menu open
    safeAddEvent(document, "keydown", (e) => {
      if (!isOpen()) return;
      if (e.key !== "Tab") return;

      const focusables = $$(focusableSelector, menu);
      if (!focusables.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  /* Scroll progress + back-to-top */
  function initScrollUI() {
    const progress = $(".scroll-progress");
    const backToTop = $("#back-to-top");

    function updateProgress() {
      if (!progress) return;
      const doc = document.documentElement;
      const scrollTop = doc.scrollTop || document.body.scrollTop;
      const scrollHeight = doc.scrollHeight - doc.clientHeight;
      const pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      progress.style.width = pct.toFixed(2) + "%";
    }

    function updateBackToTop() {
      if (!backToTop) return;
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      backToTop.hidden = y < 500;
    }

    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        updateProgress();
        updateBackToTop();
        ticking = false;
      });
    }

    safeAddEvent(window, "scroll", onScroll, { passive: true });
    safeAddEvent(window, "resize", onScroll);
    onScroll();

    safeAddEvent(backToTop, "click", () => {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
    });
  }

  /* Active nav highlight while scrolling */
  function initActiveLinks() {
    const links = $$("#nav-menu a");
    if (!links.length) return;

    const sections = links
      .map((a) => {
        const id = a.getAttribute("href");
        if (!id || !id.startsWith("#")) return null;
        const el = $(id);
        return el ? { id, el, link: a } : null;
      })
      .filter(Boolean);

    if (!sections.length) return;

    function setActive(id) {
      links.forEach((a) => a.removeAttribute("aria-current"));
      const active = links.find((a) => a.getAttribute("href") === id);
      if (active) active.setAttribute("aria-current", "page");
    }

    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((e) => e.isIntersecting)
            .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0))[0];

          if (visible && visible.target && visible.target.id) {
            setActive("#" + visible.target.id);
          }
        },
        { root: null, threshold: [0.25, 0.4, 0.6], rootMargin: "-20% 0px -65% 0px" }
      );

      sections.forEach((s) => io.observe(s.el));
    } else {
      // fallback on scroll
      function onScroll() {
        const y = window.scrollY || 0;
        let current = sections[0].id;
        sections.forEach((s) => {
          if (s.el.offsetTop - 140 <= y) current = s.id;
        });
        setActive(current);
      }
      safeAddEvent(window, "scroll", onScroll, { passive: true });
      onScroll();
    }
  }

  /* Reveal on scroll animations */
  function initReveal() {
    if (prefersReducedMotion) return;

    const targets = [
      ...$$(".section"),
      ...$$(".content-card"),
      ...$$(".timeline-card"),
      ...$$(".project-card"),
      ...$$(".edu-item"),
      ...$$(".contact-form")
    ];

    if (!targets.length) return;

    targets.forEach((el) => el.classList.add("reveal"));

    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("reveal-in");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12 }
      );

      targets.forEach((el) => io.observe(el));
    } else {
      // fallback: show all
      targets.forEach((el) => el.classList.add("reveal-in"));
    }
  }

  /* Contact form behavior */
  function initContactForm() {
    const form = $("#contact-form");
    const note = $("#form-note");
    if (!form) return;

    function setNote(msg) {
      if (!note) return;
      note.textContent = msg;
    }

    safeAddEvent(form, "submit", (e) => {
      e.preventDefault();

      const name = $("#name");
      const email = $("#email");
      const message = $("#message");

      const n = name ? name.value.trim() : "";
      const em = email ? email.value.trim() : "";
      const msg = message ? message.value.trim() : "";

      if (!n || !em || !msg) {
        setNote("Please fill in all fields.");
        return;
      }

      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em);
      if (!emailOk) {
        setNote("Please enter a valid email address.");
        return;
      }

      setNote("Opening your email app to send the message.");

      const subject = encodeURIComponent("Portfolio Contact");
      const body = encodeURIComponent(
        "Name: " + n + "\n" +
        "Email: " + em + "\n\n" +
        msg
      );

      // mailto fallback without external services
      window.location.href = "mailto:kaurpreethar1208@gmail.com?subject=" + subject + "&body=" + body;

      form.reset();
    });
  }

  /* Optional: project tabs (kept for compatibility if you re-add tabs later) */
  function initTabs() {
    const tabButtons = $$(".tab-btn");
    const tabContents = $$(".tab-content");
    if (!tabButtons.length || !tabContents.length) return;

    tabButtons.forEach((btn) => {
      safeAddEvent(btn, "click", () => {
        const target = btn.getAttribute("data-tab");
        if (!target) return;

        tabButtons.forEach((b) => b.classList.remove("active"));
        tabContents.forEach((c) => c.classList.remove("active"));

        btn.classList.add("active");
        const panel = $("#" + target);
        if (panel) panel.classList.add("active");
      });
    });
  }

  /* Init */
  function init() {
    setYear();
    initTheme();
    initMobileNav();
    initScrollUI();
    initActiveLinks();
    initReveal();
    initContactForm();
    initTabs();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
