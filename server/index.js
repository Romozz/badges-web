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

        // Basic Role Logic: hardcode rom0zzz as admin for demo, or add to .env
        const isAdmin = twitchUser.login === 'rom0zzz';

        req.session.user = {
            id: twitchUser.id,
            name: twitchUser.login,
            display_name: twitchUser.display_name,
            profile_image_url: twitchUser.profile_image_url,
            roles: isAdmin ? ['admin'] : []
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
        roles: ['admin']
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
            const potatData = potatRes.data.data || []; // Array of { badge, user_count, percentage ... }

            // Create a map for fast lookup of stats
            const statsMap = new Map();
            potatData.forEach(p => {
                statsMap.set(p.badge, { count: p.user_count, percent: p.percentage });
            });

            // Map Insights data to internal format
            badges = insightsData.map(b => {
                const stats = statsMap.get(b.setID) || { count: 0, percent: 0 };
                return {
                    badge: b.setID,
                    name: b.title,
                    url: b.imageURL, // TwitchInsights provides high res usually? Let's check. 
                    // Actually it gives standard URL. Our frontend regex handles /4 replacement.
                    description: b.description,
                    clickAction: b.clickAction,
                    clickURL: b.clickURL,
                    user_count: stats.count,
                    percentage: stats.percent
                };
            });

            // Deduplicate? TwitchInsights might have multiples if it shows versions? 
            // The sample showed "bits" multiple times for different versions presumably? 
            // "cheer 1", "cheer 100". 
            // If they have same setID, we might have issues if we use setID as key.
            // Our app seems to expect unique IDs for details page. 
            // Potat API aggregates them? Potat has "bits-1", "bits-100"?
            // If Potat has "bits", it usually means the top level set. 
            // Let's stick to unique setIDs. If duplicates exist, maybe keep the first or one with highest stats? 
            // Actually, unique setID is important. Let's see if Insights gives unique setIDs for variations. 
            // Browser said: "10-years-as-twitch-staff" ... "bits" (multiple times).
            // If "bits" appears multiple times, they duplicate the ID.
            // We should arguably deduplicate by `setID` for the *list* view, or maybe create composite IDs?
            // Existing app uses `badge` as ID. 
            // Let's deduplicate by `setID` for now to match current behavior, taking the first one found.

            const uniqueBadges = [];
            const seen = new Set();
            badges.forEach(b => {
                if (!seen.has(b.badge)) {
                    seen.add(b.badge);
                    uniqueBadges.push(b);
                }
            });
            badges = uniqueBadges;

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

    badges = badges.map(b => {
        // Calculate Relevance based on Availability
        const avail = availability[b.badge];
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
            cost: costs[b.badge] || null,
            costAmount: costAmounts[b.badge] || null,
            added_at: addedDates[b.badge] || null,
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

    res.json({ data: badges });
});

// Badge Detail API (Description + Images + Relevance + Cost + Availability)
app.get('/api/badges/:id', (req, res) => {
    const db = getDb();
    const desc = db.descriptions[req.params.id] || null;
    const images = db.images[req.params.id] || [];
    const cost = (db.costs && db.costs[req.params.id]) || null;
    const costAmount = (db.cost_amounts && db.cost_amounts[req.params.id]) || null;
    const avail = (db.availability && db.availability[req.params.id]) || null;

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

    res.json({ description: desc, images, isRelevant, cost, costAmount, availability: avail });
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
    const { url } = req.body;
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

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
