/* script.js */
/* Lightweight interactions: dark mode persistence, mobile nav, scroll progress, active link, reveal */

(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const prefersReducedMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function safeAdd(el, evt, fn, opts) {
    if (!el) return;
    el.addEventListener(evt, fn, opts);
  }

  function setYear() {
    const el = $("#year");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  function initTheme() {
    const toggle = $("#dark-mode-toggle");
    if (!toggle) return;

    const key = "hk_theme";
    const saved = localStorage.getItem(key);
    const systemDark =
      window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

    const isDark = saved ? saved === "dark" : systemDark;

    document.body.classList.toggle("dark-mode", isDark);
    toggle.textContent = isDark ? "☀️" : "🌙";

    safeAdd(toggle, "click", () => {
      const next = !document.body.classList.contains("dark-mode");
      document.body.classList.toggle("dark-mode", next);
      localStorage.setItem(key, next ? "dark" : "light");
      toggle.textContent = next ? "☀️" : "🌙";
    });
  }

  function initMobileNav() {
    const toggle = $("#nav-toggle");
    const overlay = $("#nav-overlay");
    const menu = $("#nav-menu");

    if (!toggle || !overlay || !menu) return;

    function open() {
      document.body.classList.add("nav-open");
      toggle.setAttribute("aria-expanded", "true");
      overlay.hidden = false;
      document.body.style.overflow = "hidden";
      const first = menu.querySelector("a");
      if (first) first.focus();
    }

    function close() {
      document.body.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
      overlay.hidden = true;
      document.body.style.overflow = "";
      toggle.focus();
    }

    function isOpen() {
      return document.body.classList.contains("nav-open");
    }

    safeAdd(toggle, "click", () => (isOpen() ? close() : open()));
    safeAdd(overlay, "click", close);

    safeAdd(document, "keydown", (e) => {
      if (e.key === "Escape" && isOpen()) close();
    });

    $$("#nav-menu a").forEach((a) => {
      safeAdd(a, "click", () => {
        if (isOpen()) close();
      });
    });
  }

  function initScrollUI() {
    const progress = $(".scroll-progress");
    const backToTop = $("#back-to-top");

    function update() {
      const doc = document.documentElement;
      const top = doc.scrollTop || document.body.scrollTop;
      const height = doc.scrollHeight - doc.clientHeight;
      const pct = height > 0 ? (top / height) * 100 : 0;

      if (progress) progress.style.width = pct.toFixed(2) + "%";
      if (backToTop) backToTop.hidden = top < 500;
    }

    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        update();
        ticking = false;
      });
    }

    safeAdd(window, "scroll", onScroll, { passive: true });
    safeAdd(window, "resize", onScroll);
    onScroll();

    safeAdd(backToTop, "click", () => {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
    });
  }

  function initActiveLinks() {
    const links = $$("#nav-menu a");
    if (!links.length) return;

    const sections = links
      .map((a) => {
        const href = a.getAttribute("href") || "";
        if (!href.startsWith("#")) return null;
        const sec = $(href);
        if (!sec) return null;
        return { href, sec, a };
      })
      .filter(Boolean);

    if (!sections.length) return;

    function setActive(href) {
      links.forEach((a) => a.removeAttribute("aria-current"));
      const active = links.find((a) => a.getAttribute("href") === href);
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
        { threshold: [0.25, 0.4, 0.6], rootMargin: "-20% 0px -65% 0px" }
      );

      sections.forEach((s) => io.observe(s.sec));
    } else {
      function onScroll() {
        const y = window.scrollY || 0;
        let current = sections[0].href;
        sections.forEach((s) => {
          if (s.sec.offsetTop - 140 <= y) current = s.href;
        });
        setActive(current);
      }
      safeAdd(window, "scroll", onScroll, { passive: true });
      onScroll();
    }
  }

  function initReveal() {
    if (prefersReducedMotion) return;
    const items = $$(".reveal");
    if (!items.length) return;

    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add("reveal-in");
              obs.unobserve(e.target);
            }
          });
        },
        { threshold: 0.12 }
      );
      items.forEach((el) => io.observe(el));
    } else {
      items.forEach((el) => el.classList.add("reveal-in"));
    }
  }

  function init() {
    setYear();
    initTheme();
    initMobileNav();
    initScrollUI();
    initActiveLinks();
    initReveal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
