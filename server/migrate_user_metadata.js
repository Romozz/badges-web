const fs = require('fs');
const path = require('path');
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const CLIENT_ID = 'k2zgo9k3u1cdclwfys9of3mtmmyb7w';
const CLIENT_SECRET = 'rma2ox65hfzdewzhnpyxch6vjdyuz6';
const DB_PATH = path.join(__dirname, 'user_badges.json');

async function getAppAccessToken() {
    const response = await axios.post(`https://id.twitch.tv/oauth2/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials`);
    return response.data.access_token;
}

async function migrate() {
    console.log('Starting migration...');

    if (!CLIENT_ID || !CLIENT_SECRET) {
        console.error('Error: CLIENT_ID or CLIENT_SECRET missing in .env');
        return;
    }

    const token = await getAppAccessToken();
    const userData = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    const userIds = Object.keys(userData);

    console.log(`Found ${userIds.length} users to update.`);

    // Batch in 100s for Twitch API limits
    for (let i = 0; i < userIds.length; i += 100) {
        const batchIds = userIds.slice(i, i + 100);

        try {
            // 1. Fetch User Data (Display Name, Profile Image)
            const userRes = await axios.get(`https://api.twitch.tv/helix/users?id=${batchIds.join('&id=')}`, {
                headers: {
                    'Client-ID': CLIENT_ID,
                    'Authorization': `Bearer ${token}`
                }
            });

            // 2. Fetch User Colors
            // Note: chat/color endpoint requires user_id parameters repeated
            const colorRes = await axios.get(`https://api.twitch.tv/helix/chat/color?user_id=${batchIds.join('&user_id=')}`, {
                headers: {
                    'Client-ID': CLIENT_ID,
                    'Authorization': `Bearer ${token}`
                }
            });

            const userMap = new Map(userRes.data.data.map(u => [u.id, u]));
            const colorMap = new Map(colorRes.data.data.map(c => [c.user_id, c.color]));

            batchIds.forEach(id => {
                const twitchUser = userMap.get(id);
                const twitchColor = colorMap.get(id);

                if (twitchUser) {
                    userData[id].display_name = twitchUser.display_name;
                    userData[id].login = twitchUser.login; // Sync login just in case
                }

                if (twitchColor) {
                    userData[id].color = twitchColor;
                } else if (twitchColor === '') {
                    userData[id].color = null; // Default Twitch color
                }
            });

            console.log(`Updated batch ${Math.floor(i / 100) + 1} (${batchIds.length} users)`);
        } catch (error) {
            console.error(`Error processing batch:`, error.response?.data || error.message);
        }
    }

    fs.writeFileSync(DB_PATH, JSON.stringify(userData, null, 2));
    console.log('Migration completed successfully!');
}

migrate().catch(err => console.error('Migration failed:', err));
