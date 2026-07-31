// Frontend configuration for Judestone.
// The site is static; the order desk posts to the Express/Postmark backend.
const config = {
    // Local development talks to the local backend; production talks to Render.
    apiUrl: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:3000'
        : 'https://judestone-backend.onrender.com',

    isDevelopment: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',

    endpoints: {
        contact: '/api/contact',
        health: '/api/contact/health'
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = config;
} else {
    window.appConfig = config;
}
