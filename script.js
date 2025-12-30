/* script.js */
/* Cloud Support Engineer portfolio interactions (vanilla JS, lightweight) */

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

  /* Theme: persist choice */
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

  /* Mobile nav */
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

  /* Scroll progress and back-to-top */
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

  /* Active nav highlight */
  function initActiveLinks() {
    const links = $$("#nav-menu a");
    if (!links.length) return;

    const map = links
      .map((a) => {
        const href = a.getAttribute("href") || "";
        if (!href.startsWith("#")) return null;
        const sec = $(href);
        if (!sec) return null;
        return { href, sec, a };
      })
      .filter(Boolean);

    if (!map.length) return;

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
      map.forEach((m) => io.observe(m.sec));
    } else {
      function onScroll() {
        const y = window.scrollY || 0;
        let current = map[0].href;
        map.forEach((m) => {
          if (m.sec.offsetTop - 140 <= y) current = m.href;
        });
        setActive(current);
      }
      safeAdd(window, "scroll", onScroll, { passive: true });
      onScroll();
    }
  }

  /* Reveal animation */
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

  /* Incident data */
  const incidents = [
    {
      id: "ec2-unreachable",
      title: "EC2 unreachable after security hardening",
      category: "networking",
      sev: "SEV-1",
      summary: "Production instance became unreachable from bastion and ALB health checks failed.",
      impact: "Customers could not access the service. Full outage for one environment.",
      symptoms: [
        "SSH timeout to instance private IP",
        "ALB target group shows unhealthy targets",
        "No new application logs after a specific time"
      ],
      investigation: [
        "Checked ALB target health and unhealthy host count in CloudWatch.",
        "Reviewed Security Group inbound rules and confirmed SSH rule removed.",
        "Reviewed subnet NACL and found inbound ephemeral ports blocked.",
        "Verified route tables for the subnet and confirmed expected routing.",
        "Used Reachability Analyzer to confirm blocked return path."
      ],
      rootCause: "Subnet NACL was updated to block ephemeral ports, breaking return traffic for SSH and health checks.",
      resolution: [
        "Updated NACL to allow required ephemeral port range for return traffic.",
        "Restored Security Group SSH from bastion CIDR.",
        "Validated ALB targets healthy and traffic restored."
      ],
      prevention: [
        "Add a change checklist for NACL updates including ephemeral port behavior.",
        "Alarm on ALB unhealthy host count and 5xx spikes.",
        "Runbook decision tree: SG, NACL, routes, OS firewall."
      ],
      tools: ["AWS Console", "AWS CLI", "CloudWatch", "Reachability Analyzer", "ALB target health", "Linux SSH"]
    },
    {
      id: "alb-503",
      title: "Application down behind ALB due to wrong health check path",
      category: "lb",
      sev: "SEV-1",
      summary: "Deployment succeeded but users received 503 because targets were marked unhealthy.",
      impact: "Most requests failed. Service effectively down behind the load balancer.",
      symptoms: [
        "ALB returns 503",
        "Targets in the target group show unhealthy",
        "App responds normally when tested locally on the instance"
      ],
      investigation: [
        "Confirmed 503 from ALB and checked target group health status.",
        "Compared health check path with application routes.",
        "Used curl on instance to validate correct health endpoint.",
        "Found endpoint changed from /health to /healthz."
      ],
      rootCause: "Health check path did not match the new application health endpoint, causing targets to fail checks.",
      resolution: [
        "Updated target group health check path to /healthz.",
        "Verified targets became healthy.",
        "Confirmed 200 responses from ALB."
      ],
      prevention: [
        "Keep health endpoint stable or versioned.",
        "Deployment gate: target health must be green before rollout completion.",
        "Alarm for unhealthy host count and elevated 5xx."
      ],
      tools: ["ALB", "CloudWatch", "curl", "app logs"]
    },
    {
      id: "iam-accessdenied",
      title: "IAM AccessDenied broke production automation",
      category: "iam",
      sev: "SEV-2",
      summary: "Scheduled job failed with AccessDenied after IAM policy change.",
      impact: "Automation did not run, causing backlog and delayed processing for internal users.",
      symptoms: [
        "Job logs show AccessDenied for s3:PutObject and kms:Encrypt",
        "Failures started right after IAM policy change",
        "No application code changes deployed"
      ],
      investigation: [
        "Checked CloudWatch Logs for failing API calls.",
        "Used CloudTrail to confirm denied events and role identity.",
        "Compared IAM policy versions and found removed prefix permissions.",
        "Verified KMS permissions were missing for the role."
      ],
      rootCause: "IAM policy update removed least-privilege permissions for required S3 prefix and KMS encrypt operation.",
      resolution: [
        "Restored s3:PutObject to the exact bucket and prefix.",
        "Restored kms:Encrypt permission on the required key.",
        "Re-ran job and cleared backlog."
      ],
      prevention: [
        "Policy changes reviewed like code with rollback plan.",
        "Preflight test for critical jobs using policy simulation.",
        "Alert on job failure rate and AccessDenied spikes in CloudTrail."
      ],
      tools: ["CloudTrail", "CloudWatch Logs", "IAM policy simulator", "AWS CLI"]
    },
    {
      id: "s3-403",
      title: "S3 AccessDenied after bucket policy update",
      category: "storage",
      sev: "SEV-1",
      summary: "Downloads failed due to an overly broad Deny statement in bucket policy.",
      impact: "File downloads failed for customers. High ticket volume and immediate impact.",
      symptoms: [
        "S3 returns 403 AccessDenied",
        "Spike in 4xx responses for object requests",
        "Compute and app layer appear healthy"
      ],
      investigation: [
        "Confirmed 403 on known object request path.",
        "Reviewed whether access uses pre-signed URLs or identity-based access.",
        "Reviewed recent bucket policy changes and found added Deny statement.",
        "Validated Deny matched legitimate requests due to wildcard condition."
      ],
      rootCause: "Bucket policy Deny statement incorrectly matched valid requests and blocked access.",
      resolution: [
        "Narrowed Deny condition to intended sources only.",
        "Validated access for legitimate identities and access paths.",
        "Confirmed downloads recovered."
      ],
      prevention: [
        "Test bucket policy changes with representative access paths.",
        "Alarm on sudden increase in 4xx for bucket access.",
        "Document safe rollout plan for policy changes."
      ],
      tools: ["S3 policy", "AWS CLI", "CloudWatch metrics", "access logs"]
    },
    {
      id: "dns-ttl",
      title: "DNS misconfiguration caused partial outage",
      category: "dns",
      sev: "SEV-2",
      summary: "Some users resolved an old endpoint due to DNS TTL and record change.",
      impact: "Partial outage. Users in some regions reached an old environment and saw errors.",
      symptoms: [
        "Inconsistent behavior by region or ISP",
        "Some resolvers return old record value",
        "Reports vary across locations"
      ],
      investigation: [
        "Verified Route 53 record values and type.",
        "Checked TTL and found high TTL causing caching.",
        "Ran dig and nslookup against multiple resolvers to confirm mixed results.",
        "Confirmed record updated but cache persisted."
      ],
      rootCause: "High TTL combined with record change caused long caching of the old endpoint.",
      resolution: [
        "Reduced TTL for future planned changes.",
        "Kept both endpoints valid temporarily to reduce impact during cache period.",
        "Performed staged cutover approach."
      ],
      prevention: [
        "Reduce TTL before planned DNS changes.",
        "Use weighted routing for gradual cutovers when possible.",
        "Document DNS change playbook including validation steps."
      ],
      tools: ["Route 53", "dig", "nslookup", "CloudWatch metrics"]
    },
    {
      id: "cert-expired",
      title: "TLS certificate expired and broke HTTPS",
      category: "dns",
      sev: "SEV-1",
      summary: "Users received certificate errors due to ACM certificate expiration and failed renewal validation.",
      impact: "High-severity customer impact and trust issue for HTTPS access.",
      symptoms: [
        "Browser shows certificate expired",
        "Handshake failures and client validation errors",
        "Spike in connection errors"
      ],
      investigation: [
        "Checked ALB listener certificate mapping and expiration dates.",
        "Confirmed ACM certificate expired and renewal did not complete.",
        "Reviewed validation method and found missing DNS validation record."
      ],
      rootCause: "ACM renewal failed due to missing DNS validation record.",
      resolution: [
        "Restored DNS validation record and requested new certificate.",
        "Attached new certificate to ALB listener.",
        "Validated HTTPS restored."
      ],
      prevention: [
        "Alarm for certificate expiration at 30 days and 7 days.",
        "Protect validation records and document ownership.",
        "Monthly reliability checklist includes certificate status."
      ],
      tools: ["ACM", "ALB", "Route 53", "CloudWatch alarms"]
    },
    {
      id: "linux-crash",
      title: "Linux service crash caused intermittent 502 errors",
      category: "linux",
      sev: "SEV-2",
      summary: "Backend service restarted repeatedly due to OOM kills after concurrency increase.",
      impact: "Degraded performance with intermittent failures.",
      symptoms: [
        "Intermittent 502 from ALB",
        "CPU spikes then drops",
        "systemd shows service restarting",
        "OOM events in logs"
      ],
      investigation: [
        "Checked ALB target health and noted intermittent unhealthy states.",
        "Reviewed journalctl logs and found OOM kill messages.",
        "Checked memory usage with free and top and confirmed memory pressure.",
        "Reviewed recent service config and found increased worker count."
      ],
      rootCause: "Service configuration increased worker count beyond available memory, causing OOM kills and restarts.",
      resolution: [
        "Reduced worker count and adjusted memory limits.",
        "Restarted service and validated stability.",
        "Confirmed error rate returned to baseline."
      ],
      prevention: [
        "Add memory alarms and dashboards.",
        "Document capacity notes and safe concurrency changes.",
        "Use scaling or right-sizing before increasing concurrency."
      ],
      tools: ["systemd", "journalctl", "top", "free", "CloudWatch", "ALB metrics"]
    }
  ];

  /* Render incidents */
  function sevClass(sev) {
    const s = (sev || "").toUpperCase();
    if (s.includes("SEV-1") || s.includes("SEV 1")) return "sev1";
    if (s.includes("SEV-2") || s.includes("SEV 2")) return "sev2";
    return "sev3";
  }

  function categoryLabel(cat) {
    const map = {
      networking: "Networking",
      iam: "IAM and Security",
      lb: "Load Balancing",
      storage: "Storage",
      dns: "DNS and TLS",
      linux: "Linux"
    };
    return map[cat] || "General";
  }

  function renderIncidents() {
    const grid = $("#incident-grid");
    if (!grid) return;

    grid.innerHTML = incidents
      .map((i) => {
        const sevCls = sevClass(i.sev);
        const cat = categoryLabel(i.category);
        return `
          <article class="incident-card reveal" data-category="${i.category}">
            <div class="incident-top">
              <h3 class="incident-title">${escapeHtml(i.title)}</h3>
              <div class="incident-tags">
                <span class="tag">${escapeHtml(cat)}</span>
                <span class="tag sev ${sevCls}">${escapeHtml(i.sev)}</span>
              </div>
            </div>
            <p class="incident-desc">${escapeHtml(i.summary)}</p>
            <div class="incident-actions">
              <button class="btn btn-secondary" type="button" data-open="${escapeHtml(i.id)}">Open RCA</button>
              <button class="btn btn-ghost" type="button" data-copy="${escapeHtml(i.id)}">Copy summary</button>
            </div>
          </article>
        `;
      })
      .join("");
  }

  /* Filter incidents */
  function initFilters() {
    const buttons = $$(".filter-btn");
    const grid = $("#incident-grid");
    if (!buttons.length || !grid) return;

    function apply(filter) {
      const cards = $$(".incident-card", grid);
      cards.forEach((c) => {
        const cat = c.getAttribute("data-category");
        const show = filter === "all" || cat === filter;
        c.style.display = show ? "" : "none";
      });
    }

    buttons.forEach((btn) => {
      safeAdd(btn, "click", () => {
        buttons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        apply(btn.getAttribute("data-filter") || "all");
      });
    });
  }

  /* Modal */
  function initModal() {
    const modal = $("#incident-modal");
    const modalBody = $("#modal-body");
    const title = $("#modal-title");
    const subtitle = $("#modal-subtitle");

    if (!modal || !modalBody || !title || !subtitle) return;

    let lastFocus = null;

    function openIncident(id) {
      const incident = incidents.find((x) => x.id === id);
      if (!incident) return;

      lastFocus = document.activeElement;

      title.textContent = incident.title;
      subtitle.textContent = categoryLabel(incident.category) + " | " + incident.sev;

      modalBody.innerHTML = buildIncidentHtml(incident);

      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";

      const closeBtn = modal.querySelector("[data-close='true']");
      if (closeBtn) closeBtn.focus();
    }

    function closeModal() {
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
    }

    safeAdd(document, "click", (e) => {
      const openBtn = e.target && e.target.closest && e.target.closest("[data-open]");
      if (openBtn) {
        const id = openBtn.getAttribute("data-open");
        if (id) openIncident(id);
        return;
      }

      const closeBtn = e.target && e.target.closest && e.target.closest("[data-close='true']");
      if (closeBtn) {
        closeModal();
        return;
      }

      const copyBtn = e.target && e.target.closest && e.target.closest("[data-copy]");
      if (copyBtn) {
        const id = copyBtn.getAttribute("data-copy");
        if (id) copySummary(id, copyBtn);
      }
    });

    safeAdd(document, "keydown", (e) => {
      if (e.key !== "Escape") return;
      if (modal.getAttribute("aria-hidden") === "false") closeModal();
    });
  }

  function buildIncidentHtml(i) {
    const tools = (i.tools || []).map((t) => `<span class="tool-chip">${escapeHtml(t)}</span>`).join("");
    return `
      <section class="modal-section">
        <h4>Incident Summary</h4>
        <p>${escapeHtml(i.summary)}</p>
      </section>

      <section class="modal-section">
        <h4>Impact</h4>
        <p>${escapeHtml(i.impact)}</p>
      </section>

      <section class="modal-section">
        <h4>Symptoms</h4>
        <ul>
          ${(i.symptoms || []).map((s) => `<li>${escapeHtml(s)}</li>`).join("")}
        </ul>
      </section>

      <section class="modal-section">
        <h4>Investigation steps</h4>
        <ul>
          ${(i.investigation || []).map((s) => `<li>${escapeHtml(s)}</li>`).join("")}
        </ul>
      </section>

      <section class="modal-section">
        <h4>Root cause</h4>
        <p>${escapeHtml(i.rootCause)}</p>
      </section>

      <section class="modal-section">
        <h4>Resolution</h4>
        <ul>
          ${(i.resolution || []).map((s) => `<li>${escapeHtml(s)}</li>`).join("")}
        </ul>
      </section>

      <section class="modal-section">
        <h4>Prevention and learnings</h4>
        <ul>
          ${(i.prevention || []).map((s) => `<li>${escapeHtml(s)}</li>`).join("")}
        </ul>
      </section>

      <section class="modal-section">
        <h4>Tools used</h4>
        <div class="tool-row">${tools}</div>
      </section>
    `;
  }

  /* Copy summary */
  function copySummary(id, btn) {
    const i = incidents.find((x) => x.id === id);
    if (!i) return;

    const text =
      "Incident: " + i.title + "\n" +
      "Severity: " + i.sev + "\n" +
      "Summary: " + i.summary + "\n" +
      "Root cause: " + i.rootCause + "\n" +
      "Resolution: " + (i.resolution && i.resolution[0] ? i.resolution[0] : "");

    const doneLabel = "Copied";
    const original = btn.textContent;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        btn.textContent = doneLabel;
        setTimeout(() => (btn.textContent = original), 900);
      }).catch(() => {
        fallbackCopy(text, btn, original, doneLabel);
      });
    } else {
      fallbackCopy(text, btn, original, doneLabel);
    }
  }

  function fallbackCopy(text, btn, original, doneLabel) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "absolute";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      btn.textContent = doneLabel;
      setTimeout(() => (btn.textContent = original), 900);
    } catch (_) {
      btn.textContent = "Copy failed";
      setTimeout(() => (btn.textContent = original), 900);
    } finally {
      document.body.removeChild(ta);
    }
  }

  /* Escape HTML */
  function escapeHtml(str) {
    return String(str || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  /* Reveal: after dynamic render */
  function refreshReveal() {
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
      items.forEach((el) => {
        if (!el.classList.contains("reveal-in")) io.observe(el);
      });
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

    renderIncidents();
    initFilters();
    initModal();

    initReveal();
    refreshReveal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
