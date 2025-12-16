const fs = require('fs');
const path = require('path');
const axios = require('axios');

const DB_PATH = path.join(__dirname, 'db.json');

const importDates = async () => {
    try {
        console.log('Fetching external data...');
        const data = JSON.parse(fs.readFileSync('test.json', 'utf-8'));

        const badges = data.pageProps?.twitchGlobalBadges;

        if (!badges || !Array.isArray(badges)) {
            console.error('Invalid JSON structure: expected pageProps.twitchGlobalBadges array');
            console.log('Body keys:', Object.keys(data));
            return;
        }

        console.log(`Found ${badges.length} badges in external data.`);

        let db = {};
        if (fs.existsSync(DB_PATH)) {
            db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
        }

        if (!db.added_dates) db.added_dates = {};

        let count = 0;
        badges.forEach(badge => {
            const setId = badge.current?.set_id;
            // Find "added" event in history
            const addedEvent = badge.history?.find(h => h.type === 'added');
            const date = addedEvent?.timestamp;

            if (setId && date) {
                db.added_dates[setId] = date;
                count++;
            }
        });

        console.log(`Imported and saved dates for ${count} badges.`);

        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
        console.log('Database updated successfully into db.json');

    } catch (error) {
        console.error('Error importing dates:', error.message);
    }
};

importDates();
