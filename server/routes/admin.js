const express = require('express');
const router = express.Router();
const { getDb, saveDb, getUserBadgesData, saveUserBadgesData } = require('../utils/db');
const { isAdmin, isCreator } = require('../middleware/auth');
const state = require('../state');

router.use(isAdmin);

router.get('/list', (req, res) => {
    res.json(getDb().admins || []);
});

router.post('/add', isCreator, (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: "Username required" });
    const db = getDb();
    if (!db.admins) db.admins = [];
    const normalized = username.toLowerCase();
    if (!db.admins.includes(normalized)) {
        db.admins.push(normalized);
        saveDb(db);
    }
    res.json({ success: true, admins: db.admins });
});

router.post('/remove', isCreator, (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: "Username required" });
    const db = getDb();
    if (db.admins) {
        db.admins = db.admins.filter(a => a !== username.toLowerCase());
        saveDb(db);
    }
    res.json({ success: true, admins: db.admins || [] });
});

router.post('/recalculate-stats', (req, res) => {
    const badges = state.badgesCache || [];
    if (badges.length === 0) return res.status(503).json({ error: 'Badges cache is empty' });
    const badgeMap = new Map(badges.map(b => [b.name, b]));
    const userBadges = getUserBadgesData();
    let updated = 0;
    Object.values(userBadges).forEach(user => {
        let free = 0, paid = 0;
        user.badges.forEach(name => {
            const b = badgeMap.get(name);
            if (b) {
                if (b.types?.includes('free') || b.cost === 'free') free++;
                if (b.types?.includes('paid') || b.cost === 'paid') paid++;
            }
        });
        user.stats = { total: user.badges.length, free, paid };
        updated++;
    });
    saveUserBadgesData(userBadges);
    res.json({ success: true, count: updated });
});

router.post('/types', (req, res) => {
    const { key, label, color, description, isTechnical } = req.body;
    if (!key || !label || !color) return res.status(400).json({ error: 'Missing fields' });
    const db = getDb();
    if (!db.type_definitions) db.type_definitions = {};
    const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
    };
    const rgb = hexToRgb(color);
    const bg = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)` : color;
    const border = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)` : color;
    db.type_definitions[key] = { label, color, bg, border, description: description || '', isTechnical: !!isTechnical };
    saveDb(db);
    res.json({ success: true, types: db.type_definitions });
});

router.delete('/types', (req, res) => {
    const { key } = req.body;
    const db = getDb();
    if (db.type_definitions && db.type_definitions[key]) {
        delete db.type_definitions[key];
        saveDb(db);
    }
    res.json({ success: true, types: db.type_definitions });
});

router.get('/users', (req, res) => {
    const users = Object.values(getUserBadgesData()).map(u => ({
        ...u, isRegistered: u.isRegistered !== false
    }));
    users.sort((a, b) => new Date(b.lastUpdated || 0) - new Date(a.lastUpdated || 0));
    res.json(users);
});

module.exports = router;
