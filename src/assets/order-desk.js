// Order desk form - posts to the Express/Postmark backend.
// Progressive: the form markup is inert without this file, so nothing
// half-submits if the script fails to load.

(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', function () {
        var form = document.getElementById('order-desk-form');
        if (!form) return;

        var status = document.getElementById('order-desk-status');
        var submitBtn = form.querySelector('[data-submit]');
        var submitLabel = submitBtn ? submitBtn.textContent : 'Send';

        var REQUIRED = {
            name: 'Please enter your name.',
            company: 'Please enter your company.',
            email: 'Please enter a valid email address.',
            message: 'Tell us a little about the project (at least 10 characters).'
        };

        function fieldEl(name) {
            return form.querySelector('[name="' + name + '"]');
        }

        function errorEl(name) {
            return form.querySelector('[data-error-for="' + name + '"]');
        }

        function setError(name, msg) {
            var input = fieldEl(name);
            var err = errorEl(name);
            if (input) input.classList.add('is-invalid');
            if (err) {
                err.textContent = msg;
                err.classList.add('is-shown');
            }
        }

        function clearError(name) {
            var input = fieldEl(name);
            var err = errorEl(name);
            if (input) input.classList.remove('is-invalid');
            if (err) {
                err.textContent = '';
                err.classList.remove('is-shown');
            }
        }

        function clearAllErrors() {
            form.querySelectorAll('.is-invalid').forEach(function (el) {
                el.classList.remove('is-invalid');
            });
            form.querySelectorAll('.js-field-error').forEach(function (el) {
                el.textContent = '';
                el.classList.remove('is-shown');
            });
        }

        function showStatus(message, kind) {
            if (!status) return;
            status.textContent = message;
            status.classList.remove('is-ok', 'is-error');
            status.classList.add('is-shown', kind === 'ok' ? 'is-ok' : 'is-error');
        }

        function hideStatus() {
            if (!status) return;
            status.classList.remove('is-shown', 'is-ok', 'is-error');
            status.textContent = '';
        }

        // Track links ("Start this track") jump to the form with that option chosen.
        var trackSelect = form.querySelector('[name="track"]');
        document.querySelectorAll('a[data-track]').forEach(function (link) {
            link.addEventListener('click', function () {
                if (!trackSelect) return;
                trackSelect.value = link.getAttribute('data-track');
            });
        });

        // Same, for arriving from another page with ?track=... in the URL.
        if (trackSelect) {
            var requested = new URLSearchParams(window.location.search).get('track');
            if (requested && trackSelect.querySelector('option[value="' + requested + '"]')) {
                trackSelect.value = requested;
            }
        }

        // Clear a field's error as soon as the user starts fixing it.
        Object.keys(REQUIRED).forEach(function (name) {
            var input = fieldEl(name);
            if (input) {
                input.addEventListener('input', function () { clearError(name); });
            }
        });

        function validate(data) {
            var firstInvalid = null;

            Object.keys(REQUIRED).forEach(function (name) {
                var value = (data[name] || '').trim();
                var invalid = !value;

                if (name === 'email' && value) {
                    invalid = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
                }
                if (name === 'message' && value) {
                    invalid = value.length < 10;
                }

                if (invalid) {
                    setError(name, REQUIRED[name]);
                    if (!firstInvalid) firstInvalid = fieldEl(name);
                }
            });

            return firstInvalid;
        }

        form.addEventListener('submit', async function (event) {
            event.preventDefault();
            clearAllErrors();
            hideStatus();

            var formData = new FormData(form);
            var data = {};
            formData.forEach(function (value, key) {
                data[key] = typeof value === 'string' ? value.trim() : value;
            });

            var firstInvalid = validate(data);
            if (firstInvalid) {
                showStatus('Please check the highlighted fields and try again.', 'error');
                firstInvalid.focus();
                return;
            }

            var base = (window.appConfig && window.appConfig.apiUrl) || '';
            var endpoint = base + ((window.appConfig && window.appConfig.endpoints && window.appConfig.endpoints.contact) || '/api/contact');

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Sending...';
            }

            try {
                var response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                var result = await response.json().catch(function () { return {}; });

                if (response.ok && result.success) {
                    form.reset();
                    showStatus(result.message || 'Thanks - your project is in. We will come back to you with next steps.', 'ok');
                    if (typeof gtag === 'function') {
                        gtag('event', 'generate_lead', {
                            event_category: 'order_desk',
                            event_label: data.track || 'general'
                        });
                    }
                } else {
                    // Surface per-field messages from express-validator when present.
                    if (Array.isArray(result.errors) && result.errors.length) {
                        result.errors.forEach(function (err) {
                            var name = err.path || err.param;
                            if (name) setError(name, err.msg);
                        });
                    }
                    showStatus(
                        result.message || 'Something went wrong sending your message. Please call (586) 208-4628 or email info@judestoneusa.com.',
                        'error'
                    );
                }
            } catch (error) {
                showStatus(
                    'We could not reach the order desk just now. Please call (586) 208-4628 or email info@judestoneusa.com.',
                    'error'
                );
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = submitLabel;
                }
            }
        });
    });
})();
