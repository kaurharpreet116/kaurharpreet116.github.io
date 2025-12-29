(function () {
  // ===== Helpers
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ===== Theme toggle (persist)
  const themeToggle = $("#themeToggle");
  const saved = localStorage.getItem("theme");
  if (saved) document.documentElement.setAttribute("data-theme", saved);

  function updateThemeIcon() {
    const theme = document.documentElement.getAttribute("data-theme") || "dark";
    const icon = theme === "light" ? "☀" : "☾";
    const label = theme === "light" ? "Light" : "Dark";
    themeToggle?.querySelector(".icon")?.replaceChildren(document.createTextNode(icon));
    themeToggle?.setAttribute("aria-label", `Theme: ${label}`);
  }
  updateThemeIcon();

  themeToggle?.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    const next = current === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    updateThemeIcon();
  });

  // ===== Mobile menu
  const hamburger = $("#hamburger");
  const mobileMenu = $("#mobileMenu");
  function setMenu(open) {
    if (!mobileMenu || !hamburger) return;
    mobileMenu.classList.toggle("open", open);
    hamburger.setAttribute("aria-expanded", String(open));
    mobileMenu.setAttribute("aria-hidden", String(!open));
  }
  hamburger?.addEventListener("click", () => {
    const isOpen = mobileMenu?.classList.contains("open");
    setMenu(!isOpen);
  });
  $$(".m-link", mobileMenu).forEach((a) => {
    a.addEventListener("click", () => setMenu(false));
  });

  // ===== Incidents: filter + search
  const chips = $$(".chip");
  const grid = $("#incidentGrid");
  const search = $("#incidentSearch");
  let activeFilter = "all";

  function matchesFilter(card) {
    if (activeFilter === "all") return true;
    const tags = (card.getAttribute("data-tags") || "").split(/\s+/);
    return tags.includes(activeFilter);
  }

  function matchesSearch(card) {
    const q = (search?.value || "").trim().toLowerCase();
    if (!q) return true;
    const title = (card.getAttribute("data-title") || "").toLowerCase();
    const text = card.textContent.toLowerCase();
    return title.includes(q) || text.includes(q);
  }

  function applyIncidentFilters() {
    if (!grid) return;
    $$(".incident", grid).forEach((card) => {
      const show = matchesFilter(card) && matchesSearch(card);
      card.style.display = show ? "" : "none";
    });
  }

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      activeFilter = chip.getAttribute("data-filter") || "all";
      applyIncidentFilters();
    });
  });

  search?.addEventListener("input", applyIncidentFilters);

  // ===== Copy-to-clipboard (contact)
  const toast = $("#toast");
  const copyBtns = $$(".copy-btn");
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => toast.classList.remove("show"), 1100);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      showToast("Copied to clipboard.");
    } catch (e) {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      showToast("Copied.");
    }
  }

  copyBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const val = btn.getAttribute("data-copy");
      if (val) copyText(val);
    });
  });

  // Also copy if user clicks the value text
  $$(".contact-value").forEach((el) => {
    el.addEventListener("click", () => {
      const val = el.getAttribute("data-copy");
      if (val) copyText(val);
    });
  });

  // ===== Footer last updated date
  const lastUpdated = $("#lastUpdated");
  if (lastUpdated) {
    const d = new Date();
    const fmt = d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    lastUpdated.textContent = fmt;
  }
})();
