// frontend/scripts/views/scroll-reveal.js
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const observed = new Set();

let observer = null;

function handleReveal(entries, obs) {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      obs.unobserve(entry.target);
      observed.delete(entry.target);
    }
  });
}

function getObserver() {
  if (observer) return observer;
  observer = new IntersectionObserver(handleReveal, {
    threshold: 0.15,
    rootMargin: '0px 0px -8% 0px',
  });
  return observer;
}

function observeElements(elements) {
  if (prefersReducedMotion) {
    elements.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const obs = getObserver();
  elements.forEach((el) => {
    if (!observed.has(el)) {
      observed.add(el);
      obs.observe(el);
    }
  });
}

function refresh() {
  const elements = Array.from(document.querySelectorAll('[data-reveal]:not(.is-visible)'));
  observeElements(elements);
}

refresh();

window.SavoraReveal = {
  refresh,
};
