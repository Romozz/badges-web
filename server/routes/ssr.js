const express = require('express');
const router = express.Router();
const { getUserBadgesData } = require('../utils/db');
const { isCrawler, generateHTMLWithMeta } = require('../utils/crawler');
const state = require('../state');

router.get('/:id', async (req, res, next) => {
    if (!isCrawler(req.headers['user-agent'])) return next();
    const badge = (state.badgesCache || []).find(b => b.badge === req.params.id);
    if (!badge) return next();
    const title = `${badge.name} - Badges Tracker`;
    const desc = badge.description || `Глобальный значок Twitch: ${badge.name}`;
    const img = badge.url || 'https://badges.news/default-badge.png';
    const url = `https://badges.news/badge/${req.params.id}`;
    const meta = `
        <title>${title}</title>
        <meta name="description" content="${desc.replace(/"/g, '&quot;')}">
        <meta property="og:type" content="website"><meta property="og:url" content="${url}"><meta property="og:title" content="${title}"><meta property="og:description" content="${desc.replace(/"/g, '&quot;')}"><meta property="og:image" content="${img}">
        <meta property="twitter:card" content="summary_large_image"><meta property="twitter:url" content="${url}"><meta property="twitter:title" content="${title}"><meta property="twitter:description" content="${desc.replace(/"/g, '&quot;')}"><meta property="twitter:image" content="${img}">
    `;
    res.send(generateHTMLWithMeta(meta));
});

router.get('/stats', (req, res, next) => {
    if (!isCrawler(req.headers['user-agent'])) return next();
    const meta = `
        <title>Статистика - Badges Tracker</title>
        <meta name="description" content="Лидеры по коллекциям значков Twitch.">
        <meta property="og:title" content="Статистика - Badges Tracker"><meta property="og:image" content="https://badges.news/stats-preview.png">
    `;
    res.send(generateHTMLWithMeta(meta));
});

router.get('/user/:username', async (req, res, next) => {
    if (!isCrawler(req.headers['user-agent'])) return next();
    const user = Object.values(getUserBadgesData()).find(u => u.login.toLowerCase() === req.params.username.toLowerCase());
    if (!user) return next();
    const title = `${user.login} - Коллекция значков`;
    const desc = `Всего значков: ${user.stats.total}`;
    const meta = `
        <title>${title}</title>
        <meta property="og:title" content="${title}"><meta property="og:description" content="${desc}"><meta property="og:image" content="https://static-cdn.jtvnw.net/jtv_user_pictures/${user.login}-profile_image-300x300.png">
    `;
    res.send(generateHTMLWithMeta(meta));
});

module.exports = router;
