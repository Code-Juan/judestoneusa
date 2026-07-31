// Judestone homepage interactions (2026 spec-sheet redesign).
// Scoped to body.home; safe to load anywhere else (it just no-ops).
// One job: the hero design picker - clicking a chip swaps the slab
// shown behind the headline and updates the "Shown:" annotation.

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

        var stage = document.querySelector('[data-hero-stage]');
        var picker = document.querySelector('[data-hero-picker]');
        var shown = document.querySelector('[data-hero-shown]');
        if (!stage || !picker) return;

        var slides = stage.querySelectorAll('img');
        var picks = picker.querySelectorAll('[data-pick]');

        picks.forEach(function (btn) {
            btn.addEventListener('click', function () {
                var index = parseInt(btn.getAttribute('data-pick'), 10);
                if (isNaN(index) || !slides[index]) return;

                slides.forEach(function (img, i) {
                    img.classList.toggle('is-active', i === index);
                });
                picks.forEach(function (b) {
                    b.classList.toggle('is-active', b === btn);
                });

                if (shown) {
                    var active = slides[index];
                    shown.textContent = (active.getAttribute('data-name') || '') +
                        ' · ' + (active.getAttribute('data-group') || '');
                }
            });
        });
    }
})();
