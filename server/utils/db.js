const fs = require('fs');
const { DB_FILE, USER_BADGES_FILE } = require('../config');

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
    if (!data.descriptions) data.descriptions = {};
    if (!data.images) data.images = {};
    if (!data.relevance) data.relevance = {};
    if (!data.costs) data.costs = {};
    if (!data.cost_amounts) data.cost_amounts = {};
    if (!data.added_dates) data.added_dates = {};
    if (!data.availability) data.availability = {};
    if (!data.watch_times) data.watch_times = {};
    if (!data.admins) data.admins = [];
    return data;
};

const saveDb = (data) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

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

module.exports = {
    getDb,
    saveDb,
    getUserBadgesData,
    saveUserBadgesData
};
