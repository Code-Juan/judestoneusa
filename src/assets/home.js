// Judestone homepage interactions (2026 redesign).
// Scoped to body.home; safe to load anywhere else (it just no-ops).

(function () {
    'use strict';

    var initialized = false;

    if (document.body && document.body.classList.contains('home')) {
        init();
    } else {
        document.addEventListener('DOMContentLoaded', init);
    }

    function init() {
        if (initialized || !document.body.classList.contains('home')) return;
        initialized = true;

        // Reveal-on-scroll only hides content once we know JS is running.
        document.documentElement.classList.add('js-anim');

        var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        initReveals(reduceMotion);
        initRail(reduceMotion);
    }

    function initReveals(reduceMotion) {
        var items = document.querySelectorAll('.js-reveal');
        if (!items.length) return;

        if (reduceMotion || !('IntersectionObserver' in window)) {
            items.forEach(function (el) { el.classList.add('is-in'); });
            return;
        }

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-in');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

        items.forEach(function (el) { observer.observe(el); });
    }

    function initRail(reduceMotion) {
        var rail = document.querySelector('[data-rail]');
        var prev = document.querySelector('[data-rail-prev]');
        var next = document.querySelector('[data-rail-next]');
        if (!rail || !prev || !next) return;

        function step() {
            var card = rail.querySelector('.js-rail-card');
            return card ? card.getBoundingClientRect().width + 16 : 300;
        }

        function scrollRail(direction) {
            rail.scrollBy({
                left: direction * step() * 2,
                behavior: reduceMotion ? 'auto' : 'smooth'
            });
        }

        prev.addEventListener('click', function () { scrollRail(-1); });
        next.addEventListener('click', function () { scrollRail(1); });

        function updateButtons() {
            var max = rail.scrollWidth - rail.clientWidth - 2;
            prev.disabled = rail.scrollLeft <= 2;
            next.disabled = rail.scrollLeft >= max;
        }

        rail.addEventListener('scroll', updateButtons, { passive: true });
        window.addEventListener('resize', updateButtons);
        updateButtons();
    }
})();
