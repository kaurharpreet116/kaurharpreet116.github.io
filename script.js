// Project Tabs
const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

tabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.getAttribute("data-tab");

    // Reset active states
    tabButtons.forEach(b => b.classList.remove("active"));
    tabContents.forEach(c => c.classList.remove("active"));

    // Activate selected
    btn.classList.add("active");
    document.getElementById(target).classList.add("active");
  });
});

// Dark mode toggle
const toggleButton = document.getElementById('dark-mode-toggle');

// Default: enable dark mode
document.body.classList.add('dark-mode');
toggleButton.textContent = '☀️';

toggleButton.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  
  if (document.body.classList.contains('dark-mode')) {
    toggleButton.textContent = '☀️';
  } else {
    toggleButton.textContent = '🌙';
  }
});





// Animate progress bars when they enter the viewport.
// Uses IntersectionObserver with a simple fallback.

(function () {
  const bars = document.querySelectorAll('.progress-fill');
  if (!bars.length) return;

  function animateBar(bar) {
    const level = parseInt(bar.dataset.level, 10) || 0;
    bar.style.width = level + '%';

    // animate number from 0 to level
    let start = 0;
    const duration = 900; // ms
    const step = Math.max(1, Math.floor(duration / Math.max(level,1)));
    const timer = setInterval(() => {
      start++;
      bar.textContent = start + '%';
      if (start >= level) clearInterval(timer);
    }, step);
  }

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateBar(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });

    bars.forEach(bar => io.observe(bar));
  } else {
    // Fallback: animate on load and on scroll
    const animateOnView = () => {
      bars.forEach(bar => {
        const rect = bar.getBoundingClientRect();
        if (rect.top < window.innerHeight - 50 && rect.bottom >= 0 && bar.style.width === '0%') {
          animateBar(bar);
        }
      });
    };
    window.addEventListener('load', animateOnView);
    window.addEventListener('scroll', animateOnView);
  }
})();



