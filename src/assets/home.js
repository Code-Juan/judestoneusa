// Judestone homepage interactions (2026 redesign).
// Scoped to body.home; safe to load anywhere else (it just no-ops).

(function () {
    'use strict';

    if (!document.body || !document.body.classList.contains('home')) {
        // Script tag order guarantees body exists, but guard anyway.
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    var initialized = false;

    function init() {
        if (initialized || !document.body.classList.contains('home')) return;
        initialized = true;

        // Reveal-on-scroll only hides content once we know JS is running.
        document.documentElement.classList.add('js-anim');

        var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        initReveals(reduceMotion);
        initShowcase(reduceMotion);
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
        }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

        items.forEach(function (el) { observer.observe(el); });
    }

    function initShowcase(reduceMotion) {
        var showcase = document.querySelector('[data-showcase]');
        if (!showcase) return;

        var slides = showcase.querySelectorAll('.js-stage img');
        var thumbs = showcase.querySelectorAll('.js-thumb');
        var nameEl = showcase.querySelector('.js-stage-name');
        var groupEl = showcase.querySelector('.js-stage-group');
        if (slides.length < 2) return;

        var current = 0;
        var timer = null;
        var INTERVAL = 4500;

        function show(index) {
            current = (index + slides.length) % slides.length;
            slides.forEach(function (img, i) {
                img.classList.toggle('is-active', i === current);
            });
            thumbs.forEach(function (btn, i) {
                btn.classList.toggle('is-active', i === current);
            });
            var active = slides[current];
            if (nameEl) nameEl.textContent = active.getAttribute('data-name') || '';
            if (groupEl) groupEl.textContent = active.getAttribute('data-group') || '';
        }

        function start() {
            if (reduceMotion || timer) return;
            timer = window.setInterval(function () { show(current + 1); }, INTERVAL);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        thumbs.forEach(function (btn, i) {
            btn.addEventListener('click', function () {
                show(i);
                stop();
                start();
            });
        });

        showcase.addEventListener('mouseenter', stop);
        showcase.addEventListener('mouseleave', start);
        showcase.addEventListener('focusin', stop);
        showcase.addEventListener('focusout', start);
        document.addEventListener('visibilitychange', function () {
            if (document.hidden) { stop(); } else { start(); }
        });

        start();
    }
})();
