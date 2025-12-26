const express = require('express');
const router = express.Router();
const axios = require('axios');
const { getDb } = require('../utils/db');
const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } = require('../config');

router.get('/twitch', (req, res) => {
    if (!CLIENT_ID) return res.status(500).send("Server configured without TWITCH_CLIENT_ID");
    const scope = 'user:read:email';
    const url = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${scope}`;
    res.redirect(url);
});

router.get('/callback', async (req, res) => {
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

        res.redirect('/'); // Redirect back to frontend
    } catch (error) {
        console.error('Auth Error:', error.response?.data || error.message);
        res.status(500).send('Authentication Failed');
    }
});

router.get('/mock', (req, res) => {
    console.log("Mock login requested");
    req.session.user = {
        id: '999999999',
        name: 'Mejkiz',
        display_name: 'Mejkiz',
        profile_image_url: 'https://static-cdn.jtvnw.net/user-default-pictures-uv/cdd517fe-def4-11e9-948e-784f43822e80-profile_image-300x300.png',
        roles: ['creator', 'admin']
    };
    console.log("Session set for rom0zzz");
    res.redirect('/');
});

router.get('/me', (req, res) => {
    res.json(req.session.user || null);
});

router.post('/logout', (req, res) => {
    req.session = null;
    res.send({ success: true });
});

module.exports = router;
