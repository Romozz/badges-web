const express = require('express');
const router = express.Router();
const axios = require('axios');
const { getDb, saveDb, getUserBadgesData } = require('../utils/db');
const { isAdmin } = require('../middleware/auth');
const state = require('../state');
const { CACHE_DURATION } = require('../config');

// Helper to update badges cache
const updateBadgesCache = async () => {
    try {
        console.log("Fetching badges from APIs...");
        const [insightsRes, potatRes] = await Promise.all([
            axios.get('https://api.twitchinsights.net/v1/badges/global'),
            axios.get('https://api.potat.app/twitch/badges')
        ]);

        const insightsData = insightsRes.data.badges || [];
        const potatData = potatRes.data.data || [];

        const statsMap = new Map();
        potatData.forEach(p => {
            if (p.badge) {
                statsMap.set(p.badge.toLowerCase(), { count: p.user_count, percent: p.percentage });
            }
        });

        const idFrequency = new Map();
        const badges = insightsData.map(b => {
            const badgeId = b.setID ? b.setID.toLowerCase() : '';
            const stats = statsMap.get(badgeId);
            const potatCount = stats ? stats.count : 0;
            const potatPercent = stats ? stats.percent : 0;
            const insightsCount = b.users || b.user_count || b.count || 0;
            const finalCount = potatCount > 0 ? potatCount : insightsCount;

            let uniqueId = b.version ? `${b.setID}_${b.version}` : b.setID;
            if (idFrequency.has(uniqueId)) {
                const count = idFrequency.get(uniqueId) + 1;
                idFrequency.set(uniqueId, count);
                uniqueId = `${uniqueId}_${count}`;
            } else {
                idFrequency.set(uniqueId, 1);
            }

            return {
                badge: uniqueId,
                base_id: b.setID,
                name: b.title,
                url: b.imageURL,
                description: b.description,
                clickAction: b.clickAction,
                clickURL: b.clickURL,
                user_count: finalCount,
                percentage: potatPercent
            };
        });

        state.badgesCache = badges;
        state.cacheTime = Date.now();
        return badges;
    } catch (error) {
        console.error("Error updating badges cache:", error.message);
        throw error;
    }
};

router.get('/', async (req, res) => {
    let badges = [];
    const now = Date.now();

    if (state.badgesCache && (now - state.cacheTime < CACHE_DURATION)) {
        badges = [...state.badgesCache];
    } else {
        try {
            badges = await updateBadgesCache();
        } catch (error) {
            if (state.badgesCache) {
                badges = [...state.badgesCache];
            } else {
                return res.status(502).json({ error: "Failed to fetch badges from upstream" });
            }
        }
    }

    const db = getDb();
    const costs = db.costs || {};
    const costAmounts = db.cost_amounts || {};
    const addedDates = db.added_dates || {};
    const availability = db.availability || {};
    const typesMap = db.types || {};

    badges = badges.map(b => {
        const avail = availability[b.badge] || availability[b.base_id];
        const cost = costs[b.badge] || costs[b.base_id];
        const costAmount = costAmounts[b.badge] || costAmounts[b.base_id];
        const addedAt = addedDates[b.badge] || addedDates[b.base_id];

        let types = typesMap[b.badge] || typesMap[b.base_id];
        if (!types && cost) {
            types = [cost];
        }
        if (!types) {
            types = [];
        }

        let isRelevant = false;
        if (avail && avail.start) {
            const startTime = new Date(avail.start).getTime();
            const endTime = avail.end ? new Date(avail.end).getTime() : Infinity;
            if (now >= startTime && now <= endTime) {
                isRelevant = true;
            }
        }

        return {
            ...b,
            isRelevant,
            types: types,
            costAmount: costAmount || null,
            watchTime: db.watch_times[b.badge] || db.watch_times[b.base_id] || null,
            added_at: addedAt || null,
            availability: avail || null
        };
    });

    badges.sort((a, b) => {
        if (a.isRelevant !== b.isRelevant) {
            return a.isRelevant ? -1 : 1;
        }
        const dateA = a.added_at ? new Date(a.added_at).getTime() : 0;
        const dateB = b.added_at ? new Date(b.added_at).getTime() : 0;
        return dateB - dateA;
    });

    state.badgesCache = badges;
    state.cacheTime = now;
    res.json(badges);
});

router.get('/:id', (req, res) => {
    const db = getDb();
    const id = req.params.id;
    const baseId = id.replace(/_\d+$/, '');

    const desc = db.descriptions[id] || db.descriptions[baseId] || null;
    const images = db.images[id] || db.images[baseId] || [];
    const cost = (db.costs && (db.costs[id] || db.costs[baseId])) || null;
    const costAmount = (db.cost_amounts && (db.cost_amounts[id] || db.cost_amounts[baseId])) || null;
    const avail = (db.availability && (db.availability[id] || db.availability[baseId])) || null;
    const watchTime = (db.watch_times && (db.watch_times[id] || db.watch_times[baseId])) || null;
    const types = (db.types && (db.types[id] || db.types[baseId])) || (cost ? [cost] : []);

    let isRelevant = false;
    if (avail && avail.start) {
        const now = Date.now();
        const startTime = new Date(avail.start).getTime();
        const endTime = avail.end ? new Date(avail.end).getTime() : Infinity;
        if (now >= startTime && now <= endTime) {
            isRelevant = true;
        }
    }

    let siteStats = { count: 0, total: 0, percentage: 0 };
    try {
        const userData = getUserBadgesData();
        const users = Object.values(userData);
        siteStats.total = users.length;
        const cachedBadge = state.badgesCache ? state.badgesCache.find(b => b.badge === id) : null;
        if (cachedBadge && users.length > 0) {
            const badgeName = cachedBadge.name;
            const count = users.filter(u => u.badges && u.badges.includes(badgeName)).length;
            siteStats.count = count;
            siteStats.percentage = (count / siteStats.total) * 100;
        }
    } catch (e) {
        console.error("Error calculating site stats:", e);
    }

    const cachedBadge = (state.badgesCache || []).find(b => b.badge === id);

    res.json({
        ...(cachedBadge || {}),
        description: desc || (cachedBadge ? cachedBadge.description : null),
        images,
        isRelevant,
        cost,
        costAmount,
        watchTime,
        availability: avail,
        types,
        site_stats: siteStats
    });
});

router.post('/:id/description', isAdmin, (req, res) => {
    const { text } = req.body;
    const db = getDb();
    db.descriptions[req.params.id] = text;
    saveDb(db);
    res.json({ success: true, description: text });
});

router.post('/:id/availability', isAdmin, (req, res) => {
    const { start, end } = req.body;
    const db = getDb();
    if (start) {
        db.availability[req.params.id] = { start, end };
    } else if (start === null) {
        delete db.availability[req.params.id];
    }
    saveDb(db);
    res.json({ success: true, availability: db.availability[req.params.id] });
});

router.get('/:id/availability', (req, res) => {
    const db = getDb();
    const avail = db.availability[req.params.id];
    if (avail) res.json(avail);
    else res.status(404).json({ error: "No availability set" });
});

router.post('/:id/images', isAdmin, (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL required" });
    const db = getDb();
    if (!db.images[req.params.id]) db.images[req.params.id] = [];
    if (!db.images[req.params.id].includes(url)) {
        db.images[req.params.id].push(url);
        saveDb(db);
    }
    res.json({ success: true, images: db.images[req.params.id] });
});

router.delete('/:id/images', isAdmin, (req, res) => {
    const url = req.body.url || req.query.url;
    const db = getDb();
    if (db.images[req.params.id]) {
        db.images[req.params.id] = db.images[req.params.id].filter(u => u !== url);
        saveDb(db);
    }
    res.json({ success: true, images: db.images[req.params.id] || [] });
});

router.post('/:id/cost', isAdmin, (req, res) => {
    const { cost, amount } = req.body;
    const db = getDb();
    if (cost) db.costs[req.params.id] = cost;
    else {
        delete db.costs[req.params.id];
        delete db.cost_amounts[req.params.id];
    }
    if (cost === 'paid' && amount !== undefined) {
        if (amount && amount > 1) db.cost_amounts[req.params.id] = parseInt(amount);
        else delete db.cost_amounts[req.params.id];
    }
    saveDb(db);
    res.json({ success: true, cost: db.costs[req.params.id] || null, costAmount: db.cost_amounts[req.params.id] || null });
});

router.post('/:id/types', isAdmin, (req, res) => {
    const { types, amount, watchTime } = req.body;
    const db = getDb();
    if (types && Array.isArray(types)) {
        db.types = db.types || {};
        db.types[req.params.id] = types;
    } else if (db.types) {
        delete db.types[req.params.id];
    }
    if (amount !== undefined) {
        db.cost_amounts = db.cost_amounts || {};
        if (amount && amount > 1) db.cost_amounts[req.params.id] = parseInt(amount);
        else delete db.cost_amounts[req.params.id];
    }
    if (watchTime !== undefined) {
        db.watch_times = db.watch_times || {};
        if (watchTime && parseInt(watchTime) > 0) db.watch_times[req.params.id] = parseInt(watchTime);
        else delete db.watch_times[req.params.id];
    }
    saveDb(db);
    res.json({ success: true, types, amount, watchTime });
});

module.exports = router;
