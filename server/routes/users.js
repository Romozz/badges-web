const express = require('express');
const router = express.Router();
const axios = require('axios');
const { getUserBadgesData, saveUserBadgesData } = require('../utils/db');
const state = require('../state');
const { GQL_CLIENT_ID } = require('../config');

router.get('/me/badges', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id: channelID, name: login } = req.session.user;
    try {
        const payload = [{
            "operationName": "ViewerCard",
            "variables": {
                "channelID": channelID, "channelLogin": login, "targetLogin": login,
                "hasChannelID": true, "giftRecipientLogin": login, "isViewerBadgeCollectionEnabled": true,
                "withStandardGifting": true, "badgeSourceChannelID": '12826', "badgeSourceChannelLogin": 'twitch'
            },
            "extensions": { "persistedQuery": { "version": 1, "sha256Hash": "d3b821f55301d3b4248b0d4312043e2e940d9ada08216f75221da7b68bcbfa0f" } }
        }];
        const response = await axios.post('https://gql.twitch.tv/gql', payload, {
            headers: { 'Client-ID': GQL_CLIENT_ID, 'Content-Type': 'application/json' }
        });
        const data = response.data[0].data;
        if (!data || !data.channelViewer || !data.channelViewer.earnedBadges) return res.json([]);
        res.json(data.channelViewer.earnedBadges.map(b => ({ name: b.title, src: b.image4x || b.image2x || b.image1x })));
    } catch (error) {
        console.error("Error fetching user badges:", error.message);
        res.json([]);
    }
});

router.post('/me/badges/save', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const { badges } = req.body;
        const { id: userId, name: login, display_name, color } = req.session.user;
        if (!badges || !Array.isArray(badges)) return res.status(400).json({ error: 'Invalid badges data' });

        const allBadges = state.badgesCache || [];
        const badgeMap = new Map(allBadges.map(b => [b.name, b]));
        let freeCount = 0, paidCount = 0;

        badges.forEach(name => {
            const b = badgeMap.get(name);
            if (b) {
                if (b.types?.includes('free') || b.cost === 'free') freeCount++;
                if (b.types?.includes('paid') || b.cost === 'paid') paidCount++;
            }
        });

        const userData = getUserBadgesData();
        userData[userId] = {
            login, display_name: display_name || login, badges,
            lastUpdated: new Date().toISOString(), isRegistered: true, color: color || null,
            stats: { total: badges.length, free: freeCount, paid: paidCount }
        };
        saveUserBadgesData(userData);
        res.json({ success: true, stats: userData[userId].stats });
    } catch (error) {
        console.error("Error saving user badges:", error.message);
        res.status(500).json({ error: 'Failed to save badges' });
    }
});

router.get('/stats/leaderboard', (req, res) => {
    try {
        const { type = 'total' } = req.query;
        const userData = getUserBadgesData();
        const allBadges = state.badgesCache || [];
        let leaderboard = [];

        if (type === 'rare') {
            const rareBadges = allBadges.filter(b => b.user_count < 10000).map(b => b.name);
            leaderboard = Object.values(userData).map(u => ({
                login: u.login, display_name: u.display_name || u.login,
                count: u.badges.filter(b => rareBadges.includes(b)).length,
                total: u.stats.total, isRegistered: u.isRegistered !== false, color: u.color || null
            }));
        } else {
            const statKey = type === 'total' ? 'total' : type;
            leaderboard = Object.values(userData).map(u => ({
                login: u.login, display_name: u.display_name || u.login,
                count: u.stats[statKey] || 0, total: u.stats.total,
                isRegistered: u.isRegistered !== false, color: u.color || null
            }));
        }
        leaderboard.sort((a, b) => b.count - a.count || a.login.localeCompare(b.login));
        res.json(leaderboard);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

router.get('/stats/overview', (req, res) => {
    try {
        const users = Object.values(getUserBadgesData());
        if (users.length === 0) return res.json({ totalUsers: 0, averageBadges: 0, totalBadgesCollected: 0, averageFree: 0, averagePaid: 0 });
        const total = users.reduce((s, u) => s + u.stats.total, 0);
        const free = users.reduce((s, u) => s + u.stats.free, 0);
        const paid = users.reduce((s, u) => s + u.stats.paid, 0);
        res.json({
            totalUsers: users.length, averageBadges: Math.round(total / users.length),
            totalBadgesCollected: total, averageFree: Math.round(free / users.length),
            averagePaid: Math.round(paid / users.length)
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch overview' });
    }
});

router.get('/users/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const userData = getUserBadgesData();
        let userEntry = Object.values(userData).find(u => u.login.toLowerCase() === username.toLowerCase());

        if (!userEntry) {
            const userResponse = await axios.get('https://api.twitch.tv/helix/users', {
                params: { login: username },
                headers: { 'Client-ID': 'gp762nuuoqcoxypju8c569th9wz7q5', 'Authorization': `Bearer 72z5608eyqjf2ltoqkuwti0hxat3p3` }
            });
            const twitchUser = userResponse.data.data[0];
            const userId = twitchUser.id, login = twitchUser.login;
            const payload = [{
                "operationName": "ViewerCard",
                "variables": {
                    "channelID": userId, "channelLogin": login, "targetLogin": login,
                    "hasChannelID": true, "giftRecipientLogin": login, "isViewerBadgeCollectionEnabled": true,
                    "withStandardGifting": true, "badgeSourceChannelID": '12826', "badgeSourceChannelLogin": 'twitch'
                },
                "extensions": { "persistedQuery": { "version": 1, "sha256Hash": "d3b821f55301d3b4248b0d4312043e2e940d9ada08216f75221da7b68bcbfa0f" } }
            }];
            const gqlRes = await axios.post('https://gql.twitch.tv/gql', payload, { headers: { 'Client-ID': GQL_CLIENT_ID, 'Content-Type': 'application/json' } });
            const data = gqlRes.data[0].data;
            if (!data?.channelViewer?.earnedBadges) return res.status(404).json({ error: 'No badges found' });

            const badges = data.channelViewer.earnedBadges.map(b => b.title);
            const badgeMap = new Map((state.badgesCache || []).map(b => [b.name, b]));
            let free = 0, paid = 0;
            badges.forEach(n => {
                const b = badgeMap.get(n);
                if (b?.cost === 'free') free++; else if (b?.cost === 'paid') paid++;
            });

            const newUserData = getUserBadgesData();
            newUserData[userId] = {
                login, display_name: data.channelViewer.user?.displayName || login, badges,
                lastUpdated: new Date().toISOString(), isRegistered: false,
                stats: { total: badges.length, free, paid }
            };
            saveUserBadgesData(newUserData);
            userEntry = newUserData[userId];
        }
        res.json({
            login: userEntry.login, display_name: userEntry.display_name || userEntry.login,
            badges: userEntry.badges, stats: userEntry.stats, lastUpdated: userEntry.lastUpdated,
            isRegistered: userEntry.isRegistered !== false, color: userEntry.color || null
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
});

module.exports = router;
