const express = require('express');
const cors = require('cors');
const cookieSession = require('cookie-session');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const port = 3000;

app.use(cors({
    origin: ['http://localhost:5173', 'https://badges.news', 'http://localhost:3000'], // Allow both Local and Prod
    credentials: true
}));
app.use(express.json());
app.use(cookieSession({
    name: 'session',
    keys: [process.env.SESSION_SECRET || 'secret_key'],
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

// Database Setup
const DB_FILE = path.join(__dirname, 'db.json');
const getDb = () => {
    let data = { descriptions: {}, images: {}, relevance: {}, costs: {} };
    if (fs.existsSync(DB_FILE)) {
        try {
            const fileData = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
            data = { ...data, ...fileData };
        } catch (e) {
            console.error("Error reading DB file:", e);
        }
    }
    // Ensure structure exists
    // Ensure structure exists
    if (!data.descriptions) data.descriptions = {};
    if (!data.images) data.images = {};
    if (!data.relevance) data.relevance = {};
    if (!data.costs) data.costs = {};
    if (!data.cost_amounts) data.cost_amounts = {};
    if (!data.added_dates) data.added_dates = {};
    if (!data.availability) data.availability = {};
    if (!data.admins) data.admins = []; // List of admin usernames
    return data;
};
const saveDb = (data) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

// Auth Routes
const CLIENT_ID = 'v178x4qrgn3qncek1p7s8txmluapf3';
const CLIENT_SECRET = '795wv6ji6t6jw0g6p6lz1285blh5m2';
const REDIRECT_URI = 'https://badges.news/auth/callback';

app.get('/auth/twitch', (req, res) => {
    if (!CLIENT_ID) return res.status(500).send("Server configured without TWITCH_CLIENT_ID");
    const scope = 'user:read:email';
    const url = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${scope}`;
    res.redirect(url);
});

app.get('/auth/callback', async (req, res) => {
    const { code } = req.query;
    try {
        const tokenRes = await axios.post(`https://id.twitch.tv/oauth2/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&code=${code}&grant_type=authorization_code&redirect_uri=${REDIRECT_URI}`);
        const { access_token } = tokenRes.data;

        const userRes = await axios.get('https://api.twitch.tv/helix/users', {
            headers: {
                'Client-ID': CLIENT_ID,
                'Authorization': `Bearer ${access_token}`
            }
        });

        const twitchUser = userRes.data.data[0];

        // Fetch user chat color
        let userColor = null;
        try {
            const colorRes = await axios.get(`https://api.twitch.tv/helix/chat/color?user_id=${twitchUser.id}`, {
                headers: {
                    'Client-ID': CLIENT_ID,
                    'Authorization': `Bearer ${access_token}`
                }
            });
            if (colorRes.data.data && colorRes.data.data.length > 0) {
                userColor = colorRes.data.data[0].color || null;
            }
        } catch (colorError) {
            console.error('Error fetching user color:', colorError.message);
        }

        const db = getDb();

        const isCreator = twitchUser.login === 'rom0zzz';
        const isAdmin = isCreator || (db.admins && db.admins.includes(twitchUser.login));

        const roles = [];
        if (isCreator) roles.push('creator');
        if (isAdmin) roles.push('admin');

        req.session.user = {
            id: twitchUser.id,
            name: twitchUser.login,
            display_name: twitchUser.display_name,
            profile_image_url: twitchUser.profile_image_url,
            color: userColor,
            roles: roles
        };

        res.redirect('https://badges.news/'); // Redirect back to frontend
    } catch (error) {
        console.error('Auth Error:', error.response?.data || error.message);
        res.status(500).send('Authentication Failed');
    }
});

app.get('/auth/mock', (req, res) => {
    console.log("Mock login requested");
    // Emulate rom0zzz login
    req.session.user = {
        id: '999999999',
        name: 'rom0zzz',
        display_name: 'rom0zzz',
        profile_image_url: 'https://static-cdn.jtvnw.net/user-default-pictures-uv/cdd517fe-def4-11e9-948e-784f43822e80-profile_image-300x300.png',
        roles: ['creator', 'admin']
    };
    console.log("Session set for rom0zzz");
    res.redirect('https://badges.news/');
});

app.get('/api/me', (req, res) => {
    res.json(req.session.user || null);
});

app.post('/auth/logout', (req, res) => {
    req.session = null;
    res.send({ success: true });
});

// Caching Variables
let badgesCache = null;
let cacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Badge List API (Cached + Merged with DB)
app.get('/api/badges', async (req, res) => {
    let badges = [];
    const now = Date.now();

    // 1. Fetch from Upstreams or Cache
    if (badgesCache && (now - cacheTime < CACHE_DURATION)) {
        badges = [...badgesCache];
    } else {
        try {
            console.log("Fetching badges from APIs...");

            // Parallel fetch
            const [insightsRes, potatRes] = await Promise.all([
                axios.get('https://api.twitchinsights.net/v1/badges/global'),
                axios.get('https://api.potat.app/twitch/badges')
            ]);

            const insightsData = insightsRes.data.badges || []; // Array of { setID, title, imageURL, ... }
            if (insightsData.length > 0) {
                console.log("Sample Insights Data:", JSON.stringify(insightsData[0], null, 2));
            }
            const potatData = potatRes.data.data || []; // Array of { badge, user_count, percentage ... }

            // Create a map for fast lookup of stats
            const statsMap = new Map();
            const potatKeys = [];
            potatData.forEach(p => {
                if (p.badge) {
                    const key = p.badge.toLowerCase();
                    statsMap.set(key, { count: p.user_count, percent: p.percentage });
                    potatKeys.push(key);
                }
            });

            try {
                const fs = require('fs');
                fs.writeFileSync('debug_potat_keys.log', potatKeys.sort().join('\n'));
            } catch (e) { console.error(e); }

            // Map Insights data to internal format
            const fs = require('fs');

            // Track IDs to ensure absolute uniqueness
            const idFrequency = new Map();

            badges = insightsData.map(b => {
                const badgeId = b.setID ? b.setID.toLowerCase() : '';
                const stats = statsMap.get(badgeId);

                // Fallback to internal Insights count
                const potatCount = stats ? stats.count : 0;
                const potatPercent = stats ? stats.percent : 0;
                const insightsCount = b.users || b.user_count || b.count || 0;
                const finalCount = potatCount > 0 ? potatCount : insightsCount;

                // Construct ID
                let uniqueId = b.version ? `${b.setID}_${b.version}` : b.setID;

                // Enforce uniqueness if collision occurs
                // (e.g. if two badges have same setID and version, or same setID and no version)
                if (idFrequency.has(uniqueId)) {
                    const count = idFrequency.get(uniqueId) + 1;
                    idFrequency.set(uniqueId, count);
                    uniqueId = `${uniqueId}_${count}`;
                } else {
                    idFrequency.set(uniqueId, 1);
                }

                return {
                    badge: uniqueId, // Primary Key for Frontend Routing
                    base_id: b.setID, // Keep original setID for reference
                    name: b.title,
                    url: b.imageURL,
                    description: b.description,
                    clickAction: b.clickAction,
                    clickURL: b.clickURL,
                    user_count: finalCount,
                    percentage: potatPercent
                };
            });

            badgesCache = badges;
            cacheTime = now;
        } catch (error) {
            console.error("Error fetching badges:", error.message);
            if (badgesCache) {
                badges = [...badgesCache];
            } else {
                return res.status(502).json({ error: "Failed to fetch badges from upstream" });
            }
        }
    }

    // 2. Merge with Local DB (Costs, Dates, Availability)
    const db = getDb();
    const costs = db.costs || {};
    const costAmounts = db.cost_amounts || {};
    const addedDates = db.added_dates || {};
    const availability = db.availability || {};
    const typesMap = db.types || {}; // NEW: types array storage

    badges = badges.map(b => {
        // Calculate Relevance based on Availability
        // Lookup using specific ID first, then base ID
        const avail = availability[b.badge] || availability[b.base_id];
        const cost = costs[b.badge] || costs[b.base_id];
        const costAmount = costAmounts[b.badge] || costAmounts[b.base_id];
        const addedAt = addedDates[b.badge] || addedDates[b.base_id];

        // NEW: Get types array, migrate from cost if needed
        let types = typesMap[b.badge] || typesMap[b.base_id];
        if (!types && cost) {
            types = [cost]; // Backward compatibility: convert cost to types array
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
            types: types, // NEW: types array
            costAmount: costAmount || null,
            added_at: addedAt || null,
            availability: avail || null
        };
    });

    // 3. Sort: Relevant first, then by Date (Newest to Oldest)
    badges.sort((a, b) => {
        if (a.isRelevant !== b.isRelevant) {
            return a.isRelevant ? -1 : 1;
        }
        // Secondary Sort: Date Descending
        const dateA = a.added_at ? new Date(a.added_at).getTime() : 0;
        const dateB = b.added_at ? new Date(b.added_at).getTime() : 0;

        return dateB - dateA;
    });

    badgesCache = badges;
    cacheTime = now;
    res.json(badges);
});

// Badge Detail API (Description + Images + Relevance + Cost + Availability)
app.get('/api/badges/:id', (req, res) => {
    const db = getDb();
    const id = req.params.id;
    // Attempt to derive base ID if the current ID is a versioned composite (e.g. bits_1 -> bits)
    // We assume setID doesn't end in _\d+ unless it's part of the ID, but our generator adds it.
    // If we have uniqueId "anomaly-2_1_1", removing last _1 gives "anomaly-2_1" which is the right setID.
    const baseId = id.replace(/_\d+$/, '');

    const desc = db.descriptions[id] || db.descriptions[baseId] || null;
    const images = db.images[id] || db.images[baseId] || [];
    const cost = (db.costs && (db.costs[id] || db.costs[baseId])) || null;
    const costAmount = (db.cost_amounts && (db.cost_amounts[id] || db.cost_amounts[baseId])) || null;
    const avail = (db.availability && (db.availability[id] || db.availability[baseId])) || null;
    const types = (db.types && (db.types[id] || db.types[baseId])) || (cost ? [cost] : []); // Fallback

    // Compute current relevance for detail view too, just in case
    let isRelevant = false;
    if (avail && avail.start) {
        const now = Date.now();
        const startTime = new Date(avail.start).getTime();
        const endTime = avail.end ? new Date(avail.end).getTime() : Infinity;
        if (now >= startTime && now <= endTime) {
            isRelevant = true;
        }
    }

    // Calculate Site Stats
    let siteStats = {
        count: 0,
        total: 0,
        percentage: 0
    };

    try {
        const userData = getUserBadgesData();
        const users = Object.values(userData);
        siteStats.total = users.length;

        // We need the Badge Name (Title) to match against user data
        // Search in cache
        const cachedBadge = badgesCache ? badgesCache.find(b => b.badge === id) : null;

        if (cachedBadge && users.length > 0) {
            const badgeName = cachedBadge.name;
            const count = users.filter(u => u.badges && u.badges.includes(badgeName)).length;
            siteStats.count = count;
            siteStats.percentage = (count / siteStats.total) * 100;
        }
    } catch (e) {
        console.error("Error calculating site stats:", e);
    }

    // Find base info from cache
    const cachedBadge = (badgesCache || []).find(b => b.badge === id);

    res.json({
        ...(cachedBadge || {}),
        description: desc || (cachedBadge ? cachedBadge.description : null),
        images,
        isRelevant,
        cost,
        costAmount,
        availability: avail,
        types,
        site_stats: siteStats
    });
});

// Update Description
app.post('/api/badges/:id/description', (req, res) => {
    if (!req.session.user || !req.session.user.roles.includes('admin')) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    const { text } = req.body;
    const db = getDb();
    db.descriptions[req.params.id] = text;
    saveDb(db);
    res.json({ success: true, description: text });
});

// Update Availability (Start/End Time) - Replaces Relevance Toggle
app.post('/api/badges/:id/availability', (req, res) => {
    if (!req.session.user || !req.session.user.roles.includes('admin')) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    const { start, end } = req.body;
    const db = getDb();

    if (start) {
        db.availability[req.params.id] = { start, end };
    } else {
        // If no start time given, maybe clear it? Or just ignore.
        // Let's assume sending null start clears it.
        if (start === null) {
            delete db.availability[req.params.id];
        }
    }

    saveDb(db);
    res.json({ success: true, availability: db.availability[req.params.id] });
});

app.get('/api/badges/:id/availability', (req, res) => {
    const db = getDb();
    const avail = db.availability[req.params.id];
    if (avail) {
        res.json(avail);
    } else {
        res.status(404).json({ error: "No availability set" });
    }
});

// Add GQL Client ID
const GQL_CLIENT_ID = 'kimne78kx3ncx6brgo4mv6wki5h1ko'; // Twitch Web Client ID

app.get('/api/me/badges', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const login = req.session.user.name; // Use login name
    const channelLogin = req.session.user.name; // Use authenticated user's login
    const channelID = req.session.user.id; // Use authenticated user's ID

    try {
        console.log(`Fetching user badges via GQL (ViewerCard) for: ${login}`);

        const payload = [
            {
                "operationName": "ViewerCard",
                "variables": {
                    "channelID": channelID,
                    "channelLogin": channelLogin,
                    "targetLogin": login,
                    "hasChannelID": true,
                    "giftRecipientLogin": login,
                    "isViewerBadgeCollectionEnabled": true,
                    "withStandardGifting": true,
                    "badgeSourceChannelID": '12826',
                    "badgeSourceChannelLogin": 'twitch'
                },
                "extensions": {
                    "persistedQuery": {
                        "version": 1,
                        "sha256Hash": "d3b821f55301d3b4248b0d4312043e2e940d9ada08216f75221da7b68bcbfa0f"
                    }
                }
            }
        ];

        const response = await axios.post('https://gql.twitch.tv/gql', payload, {
            headers: {
                'Client-ID': GQL_CLIENT_ID,
                'Content-Type': 'application/json'
            }
        });

        const responseData = response.data[0];

        // Log errors but don't fail - some fields like moderationSettings require auth
        if (responseData.errors) {
            console.warn("GQL Warnings (non-critical):", JSON.stringify(responseData.errors));
        }

        const data = responseData.data;

        // Path to badges: data.channelViewer.earnedBadges
        if (!data || !data.channelViewer || !data.channelViewer.earnedBadges) {
            console.log("No channelViewer or earnedBadges found in response");
            return res.json([]);
        }

        const ownedBadges = data.channelViewer.earnedBadges.map(b => ({
            name: b.title,
            src: b.image4x || b.image2x || b.image1x
        }));

        res.json(ownedBadges);

    } catch (error) {
        console.error("Error fetching user badges from Twitch GQL:", error.message);
        res.json([]);
    }
});

// User Badges Collection Storage
const USER_BADGES_FILE = path.join(__dirname, 'user_badges.json');

const getUserBadgesData = () => {
    if (fs.existsSync(USER_BADGES_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(USER_BADGES_FILE, 'utf8'));
        } catch (e) {
            console.error("Error reading user badges file:", e);
            return {};
        }
    }
    return {};
};

const saveUserBadgesData = (data) => {
    try {
        fs.writeFileSync(USER_BADGES_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Error saving user badges file:", e);
    }
};

// Save user's badge collection
app.post('/api/me/badges/save', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const { badges } = req.body; // Array of badge names
        const userId = req.session.user.id;
        const login = req.session.user.name;

        if (!badges || !Array.isArray(badges)) {
            return res.status(400).json({ error: 'Invalid badges data' });
        }

        // Load all badges to calculate stats (use cache directly)
        const allBadges = badgesCache || [];
        const badgeMap = new Map(allBadges.map(b => [b.name, b]));

        // Calculate stats
        let freeCount = 0;
        let paidCount = 0;

        badges.forEach(badgeName => {
            const badge = badgeMap.get(badgeName);
            if (badge) {
                // Check new types array (multi-select)
                if (badge.types && Array.isArray(badge.types)) {
                    if (badge.types.includes('free')) freeCount++;
                    if (badge.types.includes('paid')) paidCount++;
                }
                // Fallback to old cost field (backward compatibility)
                else if (badge.cost) {
                    if (badge.cost === 'free') freeCount++;
                    else if (badge.cost === 'paid') paidCount++;
                }
            }
        });

        const userData = getUserBadgesData();
        userData[userId] = {
            login,
            display_name: req.session.user.display_name || login,
            badges,
            lastUpdated: new Date().toISOString(),
            isRegistered: true,
            color: req.session.user.color || null,
            stats: {
                total: badges.length,
                free: freeCount,
                paid: paidCount
            }
        };

        saveUserBadgesData(userData);
        res.json({ success: true, stats: userData[userId].stats });
    } catch (error) {
        console.error("Error saving user badges:", error.message);
        res.status(500).json({ error: 'Failed to save badges' });
    }
});

// Get leaderboard
app.get('/api/stats/leaderboard', async (req, res) => {
    try {
        const { type = 'total' } = req.query; // total, free, paid, rare
        const userData = getUserBadgesData();

        // Fetch badges from our own API endpoint
        const allBadges = badgesCache || [];

        let leaderboard = [];

        if (type === 'rare') {
            // For rare badges, count how many rare badges each user has
            // Rare = badges with low user_count
            const rareBadges = allBadges
                .filter(b => b.user_count < 10000) // Consider rare if < 10k users
                .map(b => b.name);

            leaderboard = Object.values(userData).map(user => {
                const rareCount = user.badges.filter(b => rareBadges.includes(b)).length;
                return {
                    login: user.login,
                    display_name: user.display_name || user.login,
                    count: rareCount,
                    total: user.stats.total,
                    isRegistered: user.isRegistered !== undefined ? user.isRegistered : true,
                    color: user.color || null
                };
            });
        } else {
            // For total, free, paid
            const statKey = type === 'total' ? 'total' : type;
            leaderboard = Object.values(userData).map(user => ({
                login: user.login,
                display_name: user.display_name || user.login,
                count: user.stats[statKey] || 0,
                total: user.stats.total,
                isRegistered: user.isRegistered !== undefined ? user.isRegistered : true,
                color: user.color || null
            }));
        }

        // Sort by count descending, then by login for stability
        leaderboard.sort((a, b) => {
            if (b.count !== a.count) return b.count - a.count;
            return a.login.localeCompare(b.login);
        });

        // Return full leaderboard (frontend handles pagination)
        res.json(leaderboard);
    } catch (error) {
        console.error("Error fetching leaderboard:", error.message);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

// Get overview statistics
app.get('/api/stats/overview', (req, res) => {
    try {
        const userData = getUserBadgesData();
        const users = Object.values(userData);

        if (users.length === 0) {
            return res.json({
                totalUsers: 0,
                averageBadges: 0,
                totalBadgesCollected: 0,
                averageFree: 0,
                averagePaid: 0
            });
        }

        const totalBadges = users.reduce((sum, u) => sum + u.stats.total, 0);
        const totalFree = users.reduce((sum, u) => sum + u.stats.free, 0);
        const totalPaid = users.reduce((sum, u) => sum + u.stats.paid, 0);

        res.json({
            totalUsers: users.length,
            averageBadges: Math.round(totalBadges / users.length),
            totalBadgesCollected: totalBadges,
            averageFree: Math.round(totalFree / users.length),
            averagePaid: Math.round(totalPaid / users.length)
        });
    } catch (error) {
        console.error("Error fetching overview:", error.message);
        res.status(500).json({ error: 'Failed to fetch overview' });
    }
});

// Get user profile by username
app.get('/api/users/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const userData = getUserBadgesData();

        // Find user by login (case-insensitive)
        let userEntry = Object.values(userData).find(
            u => u.login.toLowerCase() === username.toLowerCase()
        );

        // If user not found in DB, try to fetch from Twitch
        if (!userEntry) {
            console.log(`User ${username} not found in DB, fetching from Twitch...`);
            console.log(process.env.CLIENT_ID)
            try {
                // Fetch user ID from Twitch Helix API
                const userResponse = await axios.get('https://api.twitch.tv/helix/users', {
                    params: { login: username },
                    headers: {
                        'Client-ID': 'gp762nuuoqcoxypju8c569th9wz7q5',
                        'Authorization': `Bearer 72z5608eyqjf2ltoqkuwti0hxat3p3`
                    }
                });

                const twitchUser = userResponse.data.data[0];
                const userId = twitchUser.id;
                const login = twitchUser.login;
                // Fetch badges using GQL ViewerCard query
                const payload = [
                    {
                        "operationName": "ViewerCard",
                        "variables": {
                            "channelID": userId,
                            "channelLogin": login,
                            "hasChannelID": true,
                            "giftRecipientLogin": login,
                            "isViewerBadgeCollectionEnabled": true,
                            "withStandardGifting": true,
                            "badgeSourceChannelID": '12826',
                            "badgeSourceChannelLogin": 'twitch'
                        },
                        "extensions": {
                            "persistedQuery": {
                                "version": 1,
                                "sha256Hash": "d3b821f55301d3b4248b0d4312043e2e940d9ada08216f75221da7b68bcbfa0f"
                            }
                        }
                    }
                ];
                const gqlResponse = await axios.post('https://gql.twitch.tv/gql', payload, {
                    headers: {
                        'Client-ID': GQL_CLIENT_ID,
                        'Content-Type': 'application/json'
                    }
                });
                const data = gqlResponse.data[0].data;
                if (!data || !data.channelViewer || !data.channelViewer.earnedBadges) {
                    return res.status(404).json({ error: 'No badges found for user' });
                }

                const badges = data.channelViewer.earnedBadges.map(b => b.title);
                const displayName = data.channelViewer.user?.displayName || login;

                // Calculate stats
                const allBadges = badgesCache || [];
                const badgeMap = new Map(allBadges.map(b => [b.name, b]));

                let freeCount = 0;
                let paidCount = 0;

                badges.forEach(badgeName => {
                    const badge = badgeMap.get(badgeName);
                    if (badge) {
                        if (badge.cost === 'free') freeCount++;
                        else if (badge.cost === 'paid') paidCount++;
                    }
                });

                // Save to database
                const newUserData = getUserBadgesData();
                newUserData[userId] = {
                    login,
                    display_name: displayName,
                    badges,
                    lastUpdated: new Date().toISOString(),
                    isRegistered: false,
                    stats: {
                        total: badges.length,
                        free: freeCount,
                        paid: paidCount
                    }
                };
                saveUserBadgesData(newUserData);

                userEntry = newUserData[userId];
                console.log(`User ${username} fetched from Twitch and saved to DB`);
            } catch (twitchError) {
                console.error('Error fetching from Twitch:', twitchError.message);
                return res.status(404).json({ error: 'User not found' });
            }
        }

        res.json({
            login: userEntry.login,
            display_name: userEntry.display_name || userEntry.login,
            badges: userEntry.badges,
            stats: userEntry.stats,
            lastUpdated: userEntry.lastUpdated,
            isRegistered: userEntry.isRegistered !== undefined ? userEntry.isRegistered : true,
            color: userEntry.color || null
        });
    } catch (error) {
        console.error("Error fetching user profile:", error.message);
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
});



// Add Image URL
app.post('/api/badges/:id/images', (req, res) => {
    if (!req.session.user || !req.session.user.roles.includes('admin')) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL required" });

    const db = getDb();
    if (!db.images[req.params.id]) db.images[req.params.id] = [];

    // Simple duplicate check
    if (!db.images[req.params.id].includes(url)) {
        db.images[req.params.id].push(url);
        saveDb(db);
    }

    res.json({ success: true, images: db.images[req.params.id] });
});

// Remove Image URL
app.delete('/api/badges/:id/images', (req, res) => {
    if (!req.session.user || !req.session.user.roles.includes('admin')) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    const url = req.body.url || req.query.url;
    const db = getDb();

    if (db.images[req.params.id]) {
        db.images[req.params.id] = db.images[req.params.id].filter(u => u !== url);
        saveDb(db);
    }

    res.json({ success: true, images: db.images[req.params.id] || [] });
});

// Update Cost (Free/Paid) & Amount
app.post('/api/badges/:id/cost', (req, res) => {
    if (!req.session.user || !req.session.user.roles.includes('admin')) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    const { cost, amount } = req.body; // amount is optional
    const db = getDb();

    // Update Cost Status
    if (cost) {
        db.costs[req.params.id] = cost;
    } else {
        delete db.costs[req.params.id];
        delete db.cost_amounts[req.params.id]; // Clear amount if cost removed
    }

    // Update Amount (if provided and cost is paid)
    if (cost === 'paid' && amount !== undefined) {
        if (amount && amount > 1) {
            db.cost_amounts[req.params.id] = parseInt(amount);
        } else {
            delete db.cost_amounts[req.params.id]; // 1 or null/0 implies default
        }
    }

    saveDb(db);
    res.json({
        success: true,
        cost: db.costs[req.params.id] || null,
        costAmount: db.cost_amounts[req.params.id] || null
    });
});

// NEW: Update Badge Types (multi-select: free, paid, local, canceled, technical)
app.post('/api/badges/:id/types', (req, res) => {
    if (!req.session.user || !req.session.user.roles.includes('admin')) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    const { types, amount } = req.body;
    const db = getDb();

    // Update Types Array
    if (types && Array.isArray(types)) {
        db.types = db.types || {};
        db.types[req.params.id] = types;
    } else {
        if (db.types) {
            delete db.types[req.params.id];
        }
    }

    // Update Cost Amount
    if (amount !== undefined) {
        db.cost_amounts = db.cost_amounts || {};
        if (amount && amount > 1) {
            db.cost_amounts[req.params.id] = parseInt(amount);
        } else {
            delete db.cost_amounts[req.params.id];
        }
    }

    saveDb(db);
    res.json({ success: true, types, amount });
});

// Admin Management APIs
app.get('/api/admin/list', (req, res) => {
    // Only admins/creator can list admins? Or maybe public? Let's restrict to admins.
    if (!req.session.user || !req.session.user.roles.includes('admin')) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    const db = getDb();
    res.json(db.admins || []);
});

app.post('/api/admin/add', (req, res) => {
    // Only CREATOR can add admins
    if (!req.session.user || !req.session.user.roles.includes('creator')) {
        return res.status(403).json({ error: 'Only the creator can manage admins' });
    }
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: "Username required" });

    const db = getDb();
    if (!db.admins) db.admins = [];

    // Normalize to lowercase for storage
    const normalized = username.toLowerCase();

    if (!db.admins.includes(normalized)) {
        db.admins.push(normalized);
        saveDb(db);
    }
    res.json({ success: true, admins: db.admins });
});

app.post('/api/admin/remove', (req, res) => {
    // Only CREATOR can remove admins
    if (!req.session.user || !req.session.user.roles.includes('creator')) {
        return res.status(403).json({ error: 'Only the creator can manage admins' });
    }
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: "Username required" });

    const db = getDb();
    if (db.admins) {
        db.admins = db.admins.filter(a => a !== username.toLowerCase());
        saveDb(db);
    }
    res.json({ success: true, admins: db.admins || [] });
});

app.post('/api/admin/recalculate-stats', (req, res) => {
    if (!req.session.user || !req.session.user.roles.includes('admin')) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    // Use global badgesCache which contains the merged data (Twitch Title -> DB types/cost)
    // badgesCache is populated by /api/badges
    const badges = badgesCache || [];

    if (badges.length === 0) {
        return res.status(503).json({ error: 'Badges cache is empty. Please visit the homepage first to load badges.' });
    }

    // Create quick lookup map for badges by Name (Title) because user_badges uses Titles
    const badgeMap = new Map(badges.map(b => [b.name, b]));

    // LOAD USER BADGES HERE
    const userBadges = getUserBadgesData();
    let updatedCount = 0;

    // Iterate over all users in userBadges
    Object.keys(userBadges).forEach(userId => {
        const user = userBadges[userId];
        if (!user.badges || !Array.isArray(user.badges)) return;

        let freeCount = 0;
        let paidCount = 0;

        user.badges.forEach(badgeName => {
            const badge = badgeMap.get(badgeName);
            if (badge) {
                // Check new types array (multi-select)
                if (badge.types && Array.isArray(badge.types)) {
                    if (badge.types.includes('free')) freeCount++;
                    if (badge.types.includes('paid')) paidCount++;
                }
                // Fallback to old cost field (backward compatibility)
                else if (badge.cost) {
                    if (badge.cost === 'free') freeCount++;
                    else if (badge.cost === 'paid') paidCount++;
                }
            }
        });

        // Update stats
        user.stats = {
            total: user.badges.length,
            free: freeCount,
            paid: paidCount
        };
        updatedCount++;
    });

    saveUserBadgesData(userBadges);
    console.log(`[Admin] Recalculated stats for ${updatedCount} users`);
    res.json({ success: true, count: updatedCount });
});

// --- Dynamic Badge Types Endpoints ---

// Get all defined badge types (Public)
app.get('/api/types', (req, res) => {
    const db = getDb();
    const types = db.type_definitions || {};
    res.json(types);
});

// Add or Update a badge type (Admin only)
app.post('/api/admin/types', (req, res) => {
    if (!req.session.user || !req.session.user.roles.includes('admin')) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    const { key, label, color, description } = req.body;
    if (!key || !label || !color) {
        return res.status(400).json({ error: 'Missing required fields: key, label, color' });
    }

    const db = getDb();
    if (!db.type_definitions) db.type_definitions = {};

    // Hex to RGB helper
    const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    const rgb = hexToRgb(color);
    const bg = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)` : color;
    const border = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)` : color;

    db.type_definitions[key] = {
        label,
        color,
        bg,
        border,
        description: description || ''
    };
    saveDb(db);
    res.json({ success: true, types: db.type_definitions });
});

// Delete a badge type (Admin only)
app.delete('/api/admin/types', (req, res) => {
    if (!req.session.user || !req.session.user.roles.includes('admin')) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    const { key } = req.body;
    if (!key) return res.status(400).json({ error: 'Missing key' });

    const db = getDb();
    if (db.type_definitions && db.type_definitions[key]) {
        delete db.type_definitions[key];
        saveDb(db);
    }
    res.json({ success: true, types: db.type_definitions });
});

// ============================================
// SSR Metadata for Social Media Crawlers
// ============================================

// Detect if request is from a social media crawler
function isCrawler(userAgent) {
    if (!userAgent) return false;
    const crawlers = [
        'TelegramBot',
        'facebookexternalhit',
        'Twitterbot',
        'Discordbot',
        'Slackbot',
        'WhatsApp',
        'LinkedInBot',
        'Googlebot'
    ];
    return crawlers.some(crawler => userAgent.includes(crawler));
}

// Generate HTML with meta tags
function generateHTMLWithMeta(metaTags) {
    return `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    ${metaTags}
</head>
<body>
    <div id="root"></div>
</body>
</html>`;
}

// SSR for badge pages
app.get('/:id', async (req, res, next) => {
    const userAgent = req.headers['user-agent'] || '';

    if (!isCrawler(userAgent)) {
        return next(); // Let SPA handle it
    }

    try {
        const badgeId = req.params.id;
        const badges = badgesCache || [];
        const badge = badges.find(b => b.badge === badgeId);

        if (!badge) {
            return next();
        }

        const title = `${badge.name} - Badges Tracker`;
        const description = badge.description || `Глобальный значок Twitch: ${badge.name}`;
        const image = badge.url || 'https://badges.news/default-badge.png';
        const url = `https://badges.news/badge/${badgeId}`;

        const metaTags = `
    <title>${title}</title>
    <meta name="description" content="${description.replace(/"/g, '&quot;')}">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${url}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description.replace(/"/g, '&quot;')}">
    <meta property="og:image" content="${image}">
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="${url}">
    <meta property="twitter:title" content="${title}">
    <meta property="twitter:description" content="${description.replace(/"/g, '&quot;')}">
    <meta property="twitter:image" content="${image}">
        `;

        res.send(generateHTMLWithMeta(metaTags));
    } catch (error) {
        console.error('Error generating badge meta:', error);
        next();
    }
});

// SSR for stats page
app.get('/stats', (req, res, next) => {
    const userAgent = req.headers['user-agent'] || '';

    if (!isCrawler(userAgent)) {
        return next(); // Let SPA handle it
    }

    const title = 'Статистика - Badges Tracker';
    const description = 'Лидеры по коллекциям значков Twitch. Топ пользователей по общему количеству, бесплатным, платным и редким значкам.';
    const url = 'https://badges.news/stats';
    const image = 'https://badges.news/stats-preview.png';

    const metaTags = `
    <title>${title}</title>
    <meta name="description" content="${description}">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${url}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${image}">
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="${url}">
    <meta property="twitter:title" content="${title}">
    <meta property="twitter:description" content="${description}">
    <meta property="twitter:image" content="${image}">
    `;

    res.send(generateHTMLWithMeta(metaTags));
});

// SSR for user profile pages
app.get('/user/:username', async (req, res, next) => {
    const userAgent = req.headers['user-agent'] || '';

    if (!isCrawler(userAgent)) {
        return next(); // Let SPA handle it
    }

    try {
        const username = req.params.username.toLowerCase();
        const userData = getUserBadgesData();
        const userEntry = Object.values(userData).find(u => u.login.toLowerCase() === username);

        if (!userEntry) {
            return next();
        }

        const title = `${userEntry.login} - Коллекция значков | Badges Tracker`;
        const description = `Коллекция значков Twitch пользователя ${userEntry.login}. Всего значков: ${userEntry.stats.total}, бесплатных: ${userEntry.stats.free}, платных: ${userEntry.stats.paid}`;
        const url = `https://badges.news/user/${username}`;
        const image = `https://static-cdn.jtvnw.net/jtv_user_pictures/${username}-profile_image-300x300.png`;

        const metaTags = `
    <title>${title}</title>
    <meta name="description" content="${description}">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="profile">
    <meta property="og:url" content="${url}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${image}">
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary">
    <meta property="twitter:url" content="${url}">
    <meta property="twitter:title" content="${title}">
    <meta property="twitter:description" content="${description}">
    <meta property="twitter:image" content="${image}">
        `;

        res.send(generateHTMLWithMeta(metaTags));
    } catch (error) {
        console.error('Error generating user profile meta:', error);
        next();
    }
});



// Get recent users (Admin only)
app.get('/api/admin/users', (req, res) => {
    if (!req.session.user || !req.session.user.roles.includes('admin')) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    const userData = getUserBadgesData();
    const users = Object.values(userData).map(user => ({
        ...user,
        isRegistered: user.isRegistered !== undefined ? user.isRegistered : true
    }));

    // Sort by lastUpdated desc
    users.sort((a, b) => {
        const dateA = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
        const dateB = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
        return dateB - dateA;
    });

    res.json(users);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
