const path = require('path');

module.exports = {
    PORT: 3000,
    CLIENT_ID: 'v178x4qrgn3qncek1p7s8txmluapf3',
    CLIENT_SECRET: '795wv6ji6t6jw0g6p6lz1285blh5m2',
    REDIRECT_URI: 'https://badges.news/auth/callback',
    GQL_CLIENT_ID: 'kimne78kx3ncx6brgo4mv6wki5h1ko',
    DB_FILE: path.join(__dirname, 'db.json'),
    USER_BADGES_FILE: path.join(__dirname, 'user_badges.json'),
    CACHE_DURATION: 5 * 60 * 1000 // 5 minutes
};
