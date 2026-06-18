/**
 * Homepage visual layer — fade-up reveals and subtle hero parallax only.
 * Does not touch calculator, charts, or ROI logic.
 */
(function () {
  'use strict';

  var heroBg = document.querySelector('[data-hero-parallax]');
  if (heroBg && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.addEventListener(
      'scroll',
      function () {
        heroBg.style.transform = 'translate3d(0,' + window.scrollY * 0.28 + 'px,0)';
      },
      { passive: true }
    );
  }

  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.hp-fade-up').forEach(function (el) {
      el.classList.add('hp-visible');
    });
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('hp-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -32px 0px' }
  );

  document.querySelectorAll('.hp-fade-up').forEach(function (el) {
    observer.observe(el);
  });
})();
