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
    origin: 'https://badges.news', // Frontend URL
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
    let data = { descriptions: {}, images: {}, relevance: {} };
    if (fs.existsSync(DB_FILE)) {
        try {
            const fileData = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
            data = { ...data, ...fileData };
        } catch (e) {
            console.error("Error reading DB file:", e);
        }
    }
    // Ensure structure exists
    if (!data.descriptions) data.descriptions = {};
    if (!data.images) data.images = {};
    if (!data.relevance) data.relevance = {};
    return data;
};
const saveDb = (data) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

// Auth Routes
const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
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
        display_name: 'rom0zzz (Mock)',
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

    // 1. Fetch from Upstream or Cache
    if (badgesCache && (now - cacheTime < CACHE_DURATION)) {
        // console.log("Serving badges from cache");
        badges = [...badgesCache];
    } else {
        try {
            console.log("Fetching badges from Potat API...");
            const response = await axios.get('https://api.potat.app/twitch/badges');
            badgesCache = response.data.data;
            cacheTime = now;
            badges = [...badgesCache];
        } catch (error) {
            console.error("Error fetching badges:", error.message);
            if (badgesCache) {
                badges = [...badgesCache];
            } else {
                return res.status(502).json({ error: "Failed to fetch badges from upstream" });
            }
        }
    }

    // 2. Merge with Local DB (Relevance)
    const db = getDb();
    const relevance = db.relevance || {};

    badges = badges.map(b => ({
        ...b,
        isRelevant: !!relevance[b.badge]
    }));

    // 3. Sort: Relevant first
    badges.sort((a, b) => {
        if (a.isRelevant === b.isRelevant) return 0;
        return a.isRelevant ? -1 : 1;
    });

    res.json({ data: badges });
});

// Badge Detail API (Description + Images + Relevance)
app.get('/api/badges/:id', (req, res) => {
    const db = getDb();
    const desc = db.descriptions[req.params.id] || null;
    const images = db.images[req.params.id] || [];
    const isRelevant = !!(db.relevance && db.relevance[req.params.id]);
    res.json({ description: desc, images, isRelevant });
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

// Toggle Relevance
app.post('/api/badges/:id/relevance', (req, res) => {
    if (!req.session.user || !req.session.user.roles.includes('admin')) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    const { isRelevant } = req.body;
    const db = getDb();
    if (isRelevant) {
        db.relevance[req.params.id] = true;
    } else {
        delete db.relevance[req.params.id];
    }
    saveDb(db);
    res.json({ success: true, isRelevant: !!db.relevance[req.params.id] });
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

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
