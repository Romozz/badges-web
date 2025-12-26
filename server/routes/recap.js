const express = require('express');
const router = express.Router();
const geoip = require('geoip-lite');
const { getDb, getUserBadgesData } = require('../utils/db');
const state = require('../state');
const pricing = require('../data/pricing.json');

router.get('/2025', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });

    const userId = req.session.user.id;
    const userData = getUserBadgesData();
    const currentUser = userData[userId];

    if (!currentUser || !currentUser.badges) {
        return res.json({ hasData: false });
    }

    const db = getDb();
    const badgesCache = state.badgesCache || [];
    const badgeMap = new Map(badgesCache.map(b => [b.name, b]));

    const now = new Date();
    const year2025 = 2025;

    // Ensure cache is populated
    if (!state.badgesCache || state.badgesCache.length === 0) {
        return res.status(503).json({ error: 'Badge cache not ready. Please visit the gallery first.' });
    }

    // 1. Filter badges released in 2025 that user owns
    // Note: user.badges contains Names (Titles), we need to map to IDs to check added_dates
    const ownBadgeNames = currentUser.badges.map(n => n.trim().toLowerCase());
    const allAddedDates = db.added_dates || {};

    const normalize = (str) => str.replace(/[^\x00-\x7F]/g, "").trim().toLowerCase();
    const normalizedOwnNames = ownBadgeNames.map(n => normalize(n));

    const badges2025 = badgesCache.filter(b => {
        const addedDate = allAddedDates[b.badge] || allAddedDates[b.base_id];
        if (!addedDate) return false;
        const year = new Date(addedDate).getFullYear();
        const bNameNorm = normalize(b.name);
        return year === year2025 && (ownBadgeNames.includes(b.name.toLowerCase()) || normalizedOwnNames.includes(bNameNorm));
    });

    if (badges2025.length === 0) {
        return res.json({ hasData: false, message: "No badges collected from 2025" });
    }

    // 2. Basic Stats
    let freeCount = 0;
    let paidCount = 0;
    let totalWatchTime = 0;
    let clipCount = 0;
    let gameCount = 0;
    let eventCount = 0;
    let charityCount = 0;

    let rarestBadge = null;
    let popularBadge = null;
    let firstBadge = null;

    const typesMap = db.types || {};
    const watchTimes = db.watch_times || {};

    badges2025.forEach(b => {
        const types = typesMap[b.badge] || typesMap[b.base_id] || [];
        const cost = (db.costs && (db.costs[b.badge] || db.costs[b.base_id])) || null;

        // Free/Paid
        if (types.includes('free') || cost === 'free') freeCount++;
        if (types.includes('paid') || cost === 'paid') paidCount++;

        // Watch Time
        if (types.includes('free') || cost === 'free') {
            totalWatchTime += (watchTimes[b.badge] || watchTimes[b.base_id] || 0);
        }

        // Custom Types
        if (types.includes('clip')) clipCount++;
        if (types.includes('game')) gameCount++;
        if (types.includes('event')) eventCount++;
        if (types.includes('charity')) charityCount++;

        // Rarity (Min user_count)
        if (!rarestBadge || b.user_count < rarestBadge.user_count) rarestBadge = b;
        // Popular (Max user_count)
        if (!popularBadge || b.user_count > popularBadge.user_count) popularBadge = b;

        // First Badge (Earliest added_date)
        const addedDate = new Date(allAddedDates[b.badge] || allAddedDates[b.base_id]);
        if (!firstBadge || addedDate < new Date(allAddedDates[firstBadge.badge] || allAddedDates[firstBadge.base_id])) {
            firstBadge = b;
        }
    });

    // 3. Financials
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const geo = geoip.lookup(ip);
    const countryCode = geo ? geo.country : 'US';
    const countryPricing = pricing[countryCode] || pricing['DEFAULT'];

    let totalSpent = 0;
    const costAmounts = db.cost_amounts || {};

    badges2025.forEach(b => {
        const types = typesMap[b.badge] || typesMap[b.base_id] || [];
        const cost = (db.costs && (db.costs[b.badge] || db.costs[b.base_id])) || null;
        if (types.includes('paid') || cost === 'paid') {
            const amount = costAmounts[b.badge] || costAmounts[b.base_id] || 1;
            totalSpent += amount * countryPricing.price;
        }
    });

    // 4. Global Ranking & Soulmate
    const allUsers = Object.values(userData);
    const user2025Counts = allUsers.map(u => {
        const count = badgesCache.filter(b => {
            const addedDate = allAddedDates[b.badge] || allAddedDates[b.base_id];
            return addedDate && new Date(addedDate).getFullYear() === year2025 && u.badges.includes(b.name);
        }).length;
        return { login: u.login, count };
    }).filter(u => u.count > 0);

    user2025Counts.sort((a, b) => b.count - a.count);
    const rank = user2025Counts.findIndex(u => u.login === currentUser.login) + 1;
    const total2025Users = user2025Counts.length;

    // Soulmate - User with most similar 2025 badge set
    let soulmate = null;
    let maxOverlap = -1;
    const my2025BadgeNames = badges2025.map(b => b.name);

    allUsers.forEach(u => {
        if (u.login === currentUser.login) return;
        const their2025Badges = u.badges.filter(name => {
            const b = badgeMap.get(name);
            if (!b) return false;
            const addedDate = allAddedDates[b.badge] || allAddedDates[b.base_id];
            return addedDate && new Date(addedDate).getFullYear() === year2025;
        });

        const overlap = my2025BadgeNames.filter(name => their2025Badges.includes(name)).length;
        if (overlap > maxOverlap) {
            maxOverlap = overlap;
            soulmate = { login: u.login, display_name: u.display_name || u.login, overlap };
        }
    });

    // 5. Streaks, Time of Day, and Monthly Activity
    const monthlyCounts = new Array(12).fill(0);
    const seasonalCounts = { winter: 0, spring: 0, summer: 0, autumn: 0 };
    const dayNight = { day: 0, night: 0 }; // 6-18 as day, rest as night
    const weeksActive = new Set();

    badges2025.forEach(b => {
        const dateStr = allAddedDates[b.badge] || allAddedDates[b.base_id];
        const date = new Date(dateStr);

        // Monthly
        const m = date.getMonth();
        monthlyCounts[m]++;

        // Seasonal
        if (m === 11 || m <= 1) seasonalCounts.winter++;
        else if (m <= 4) seasonalCounts.spring++;
        else if (m <= 7) seasonalCounts.summer++;
        else seasonalCounts.autumn++;

        // Time of Day
        const hour = date.getHours();
        if (hour >= 6 && hour < 18) dayNight.day++;
        else dayNight.night++;

        // Streaks (Week number in year)
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
        const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        weeksActive.add(weekNum);
    });

    // Calculate Max Streak
    const sortedWeeks = Array.from(weeksActive).sort((a, b) => a - b);
    let maxStreak = 0;
    let currentStreak = 0;
    let lastWeek = -1;

    sortedWeeks.forEach(w => {
        if (lastWeek === -1 || w === lastWeek + 1) {
            currentStreak++;
        } else {
            currentStreak = 1;
        }
        maxStreak = Math.max(maxStreak, currentStreak);
        lastWeek = w;
    });

    // 2026 Prediction & Global Impact
    let speedsterCount = 0;
    badges2025.forEach(b => {
        const added = new Date(allAddedDates[b.badge] || allAddedDates[b.base_id]);
        // Proxy: If the badge is very rare (<5000) and was released in 2025, you are a "Speedster" for catching it
        if (b.user_count < 5000) speedsterCount++;
    });

    const isNightOwl = dayNight.night > dayNight.day;

    // 6. Advanced Metrics
    // Completionist Score: % of all 2025 badges
    const all2025Badges = badgesCache.filter(b => {
        const date = allAddedDates[b.badge] || allAddedDates[b.base_id];
        return date && new Date(date).getFullYear() === year2025;
    });
    const completionistScore = Math.round((badges2025.length / all2025Badges.length) * 100);

    // Unlucky Miss: Most popular 2025 badge NOT owned
    const missed2025 = all2025Badges
        .filter(b => {
            const bNameLower = b.name.toLowerCase();
            const bNameNorm = normalize(b.name);
            return !ownBadgeNames.includes(bNameLower) && !normalizedOwnNames.includes(bNameNorm);
        })
        .sort((a, b) => b.user_count - a.user_count);
    const unluckyMiss = missed2025.length > 0 ? missed2025[0] : null;

    // Survivor Badge: Owned 2025 badge with shortest availability window (if set)
    const availMap = db.availability || {};
    const survivors = badges2025.filter(b => {
        const avail = availMap[b.badge] || availMap[b.base_id];
        if (avail && avail.start && avail.end) {
            const duration = new Date(avail.end) - new Date(avail.start);
            return duration > 0 && duration < 24 * 60 * 60 * 1000; // Less than 24h
        }
        return false;
    }).sort((a, b) => {
        const durA = new Date(availMap[a.badge].end) - new Date(availMap[a.badge].start);
        const durB = new Date(availMap[b.badge].end) - new Date(availMap[b.badge].start);
        return durA - durB;
    });
    const survivorBadge = survivors.length > 0 ? survivors[0] : null;

    // Collector Level
    // Based on average user_count (rarity)
    const avgRarity = badges2025.reduce((sum, b) => sum + b.user_count, 0) / badges2025.length;
    let collectorLevel = "Новичок";
    if (avgRarity < 1000) collectorLevel = "Мифический Повелитель";
    else if (avgRarity < 3000) collectorLevel = "Алмазный Коллекционер";
    else if (avgRarity < 7000) collectorLevel = "Платиновый Охотник";
    else if (avgRarity < 15000) collectorLevel = "Элитный Искатель";
    else if (avgRarity < 30000) collectorLevel = "Золотой Профи";
    else if (avgRarity < 60000) collectorLevel = "Серебряный Зритель";
    else if (avgRarity < 100000) collectorLevel = "Бронзовый Участник";
    else if (avgRarity < 200000) collectorLevel = "Активный Зритель";

    // 2026 Prediction
    let prediction = "Будущая Легенда";
    if (charityCount >= 5) prediction = "Амбассадор Добра 2026";
    else if (charityCount > 1) prediction = "Герой Благотворительности 2026";
    else if (clipCount >= 10) prediction = "Режиссер Хайлайтов 2026";
    else if (clipCount > 3) prediction = "Мастер Клипов 2026";
    else if (gameCount >= 10) prediction = "Киберспортивный Магнат 2026";
    else if (gameCount > 3) prediction = "Геймер-Профи 2026";
    else if (rarestBadge && rarestBadge.user_count < 500) prediction = "Легенда Скрытых Дропов 2026";
    else if (rarestBadge && rarestBadge.user_count < 2000) prediction = "Охотник за Глитчами 2026";
    else if (isNightOwl && maxStreak > 10) prediction = "Ночной Хранитель Твича 2026";
    else if (totalSpent > 1000) prediction = "VIP-Меценат Платформы 2026";
    else if (completionistScore > 80) prediction = "Абсолютный Перфекционист 2026";

    // Global Impact (Total hero users for charity badges)
    let totalCharityHeroes = 0;
    if (charityCount > 0) {
        badges2025.forEach(b => {
            const types = typesMap[b.badge] || typesMap[b.base_id] || [];
            if (types.includes('charity')) totalCharityHeroes += (b.user_count || 0);
        });
    }

    // Legendary Month (Month with most rare badge or most badges)
    let legendaryMonthIdx = -1;
    let maxMonthlyRare = -1;
    monthlyCounts.forEach((count, i) => {
        if (count > maxMonthlyRare) {
            maxMonthlyRare = count;
            legendaryMonthIdx = i;
        }
    });
    const monthsRu = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    const legendaryMonth = legendaryMonthIdx !== -1 ? monthsRu[legendaryMonthIdx] : '—';

    const categories = {
        clip: clipCount,
        game: gameCount,
        event: eventCount,
        charity: charityCount
    };

    // Fun Facts & Diverse Stats
    const hours = badges2025.map(b => new Date(allAddedDates[b.badge] || allAddedDates[b.base_id]).getHours());
    const hourCounts = {};
    hours.forEach(h => hourCounts[h] = (hourCounts[h] || 0) + 1);
    const luckyHour = Object.keys(hourCounts).length > 0
        ? Object.keys(hourCounts).reduce((a, b) => hourCounts[a] > hourCounts[b] ? a : b)
        : 12;

    const diversityScore = Object.values(categories).filter(v => v > 0).length;
    const luckyHourText = `${luckyHour}:00`;
    const favoriteType = Object.keys(categories).reduce((a, b) => categories[a] > categories[b] ? a : b, 'event');

    // Collector Archetype with Descriptions
    let archetype = "Путешественник";
    let archetypeDesc = "Твое приключение только начинается. В 2025 году ты открыл для себя множество новых миров и сообществ.";

    // Define potential archetypes with scoring
    const archetypeScores = [
        {
            type: "Меценат",
            score: charityCount * 5,
            desc: "Ты стремишься сделать мир лучше, поддерживая важные инициативы. Твоя доброта не знает границ."
        },
        {
            type: "Легендарный Геймер",
            score: gameCount * 3,
            desc: "Твои навыки в играх безупречны. Ты не пропускаешь ни одного крупного игрового события и релиза."
        },
        {
            type: "Звезда Хайлайтов",
            score: clipCount * 3,
            desc: "Ты всегда в центре событий, ловишь лучшие моменты и создаешь историю Twitch."
        },
        {
            type: "Посетитель Ивентов",
            score: eventCount * 4,
            desc: "Ты настоящий фанат сообщества. Ни одно крупное событие или конвент не проходит без твоего участия."
        },
        {
            type: "Ночной Страж",
            score: dayNight.night > dayNight.day * 2 ? 15 : 0,
            desc: "Твоя стихия — свет монитора в тишине ночи. Ты знаешь всех ночных стримеров в лицо."
        },
        {
            type: "Ранняя Пташка",
            score: dayNight.day > dayNight.night * 2 ? 15 : 0,
            desc: "Ты начинаешь день с Twitch, ловя первые утренние дропы и приветствуя стримеров с рассветом."
        },
        {
            type: "Охотник за Сокровищами",
            score: rarestBadge && rarestBadge.user_count < 2000 ? 20 : 0,
            desc: "Твой глаз наметан на редчайшие артефакты. Ты владеешь тем, о чем другие только мечтают."
        },
        {
            type: "Архивариус",
            score: completionistScore > 50 ? completionistScore / 2 : 0,
            desc: "Ни один значок не проскочит мимо тебя. Ты собираешь историю платформы по крупицам."
        },
        {
            type: "Щедрый Спонсор",
            score: paidCount > 10 ? paidCount * 2 : 0,
            desc: "Твоя поддержка — топливо для прогресса любимых стримеров. Ты ценишь качественный контент."
        },
        {
            type: "Марафонец",
            score: maxStreak * 2,
            desc: "Твоя настойчивость поражает. Недели активности без перерывов сделали тебя легендой."
        }
    ];

    archetypeScores.sort((a, b) => b.score - a.score);
    if (archetypeScores[0].score > 5) {
        archetype = archetypeScores[0].type;
        archetypeDesc = archetypeScores[0].desc;
    }

    // Journey Milestones (Key badges through the year)
    const sortedBadges = [...badges2025].sort((a, b) => {
        return new Date(allAddedDates[a.badge] || allAddedDates[a.base_id]) - new Date(allAddedDates[b.badge] || allAddedDates[b.base_id]);
    });

    const milestones = [];
    if (sortedBadges.length > 0) milestones.push({ ...sortedBadges[0], label: 'С чего все началось' });
    if (sortedBadges.length > 2) milestones.push({ ...sortedBadges[Math.floor(sortedBadges.length / 2)], label: 'Экватор года' });
    if (rarestBadge && !milestones.find(m => m.name === rarestBadge.name)) milestones.push({ ...rarestBadge, label: 'Вершина коллекции' });
    if (sortedBadges.length > 1 && !milestones.find(m => m.name === sortedBadges[sortedBadges.length - 1].name)) {
        milestones.push({ ...sortedBadges[sortedBadges.length - 1], label: 'Финальный аккорд' });
    }

    // Badge Mosaic (All 2025 icons)
    const mosaic = badges2025.map(b => ({
        id: b.badge || b.base_id,
        url: b.url,
        name: b.name
    }));

    // Color Palette (Dominant colors from types)
    const typeDefs = db.type_definitions || {};
    const colors = new Set();
    badges2025.forEach(b => {
        const types = typesMap[b.badge] || typesMap[b.base_id] || [];
        types.forEach(t => {
            if (typeDefs[t] && typeDefs[t].color) colors.add(typeDefs[t].color);
        });
    });

    res.json({
        hasData: true,
        year: year2025,
        stats: {
            total: badges2025.length,
            free: freeCount,
            paid: paidCount,
            watchTime: totalWatchTime,
            completionistScore,
            collectorLevel,
            prediction,
            archetype,
            archetypeDesc,
            categories: {
                clip: clipCount,
                game: gameCount,
                event: eventCount,
                charity: charityCount
            },
            financials: {
                totalSpent: Math.round(totalSpent * 100) / 100,
                currency: countryPricing.currency,
                country: countryCode
            }
        },
        highlights: {
            rarest: rarestBadge,
            popular: popularBadge,
            first: firstBadge,
            unluckyMiss,
            survivorBadge,
            rarestCount: rarestBadge ? rarestBadge.user_count : 0,
            mosaic,
            milestones
        },
        social: {
            rank,
            totalUsers: total2025Users,
            percentile: Math.round(((total2025Users - rank + 1) / total2025Users) * 100),
            soulmate
        },
        visuals: {
            monthlyCounts,
            seasonalCounts,
            dayNight,
            isNightOwl,
            maxStreak,
            speedsterCount,
            legendaryMonth,
            totalCharityHeroes,
            luckyHour: luckyHourText,
            diversityScore,
            favoriteType,
            colors: Array.from(colors).slice(0, 5)
        }
    });
});

module.exports = router;
