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
        b.url = b.url.slice(0, -1) + '3'
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

        // Popular (Max user_count) - Try to pick one different from firstBadge if counts are equal
        if (!popularBadge || b.user_count > popularBadge.user_count) {
            popularBadge = b;
        } else if (popularBadge && b.user_count === popularBadge.user_count && firstBadge && b.badge !== firstBadge.badge) {
            popularBadge = b;
        }

        // First Badge (Earliest added_date)
        const addedDate = new Date(allAddedDates[b.badge] || allAddedDates[b.base_id]);
        if (!firstBadge || addedDate < new Date(allAddedDates[firstBadge.badge] || allAddedDates[firstBadge.base_id])) {
            firstBadge = b;
        }
    });

    // 3. Financials
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    let geo = geoip.lookup(ip);

    // Default to RU if geo lookup fails or if IP is private/local
    let countryCode = geo ? geo.country : 'RU';

    // Explicitly force RU for private networks, empty IPs, OR if browser language is Russian
    const acceptLanguage = req.headers['accept-language'] || req.ip || '';
    if (!ip || ip === '::1' || ip.includes('127.') || ip.includes('192.168.') || ip.includes('10.') || ip.startsWith('172.') || acceptLanguage.toLowerCase().includes('ru')) {
        countryCode = 'RU';
    }

    console.log(`Detected IP: "${ip}", Language: "${acceptLanguage}", Geo: ${JSON.stringify(geo)}, Final Country: ${countryCode}`);

    let countryPricing = pricing[countryCode];
    // Fallback to RU pricing if specific country not found in pricing.json
    if (!countryPricing) {
        countryPricing = pricing['RU'] || { price: 130, currency: 'RUB' };
    }

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

    Object.entries(userData).forEach(([uid, u]) => {
        // Strict ID check to prevent self-match
        if (String(uid) === String(userId)) return;

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

    // Collector Level - Point Based System
    let totalPoints = 0;
    badges2025.forEach(b => {
        if (b.user_count < 1000) totalPoints += 200;
        else if (b.user_count < 10000) totalPoints += 75;
        else if (b.user_count < 50000) totalPoints += 25;
        else totalPoints += 10;
    });

    let collectorData = { title: "Активный Зритель", tier: "Начинающий", desc: "Ты только начинаешь свой путь в мире значков. Впереди тысячи стримов, сотни значков и множество редких наград. Главное — не останавливаться!" };
    if (totalPoints >= 3000) collectorData = { title: "Мифический Повелитель", tier: "Божественный", desc: "Ты достиг вершины, недоступной для простых смертных. Твоя коллекция — это музей истории Twitch, а твое имя шепотом передают в чатах. Ты — живая легенда." };
    else if (totalPoints >= 2000) collectorData = { title: "Алмазный Коллекционер", tier: "Элитный", desc: "Твоя коллекция сияет ярче алмазов. Ты собрал самые редкие и ценные экземпляры, вызывая зависть и уважение у всего сообщества." };
    else if (totalPoints >= 1200) collectorData = { title: "Платиновый Охотник", tier: "Высокий", desc: "Ты входишь в элиту коллекционеров. Твоя настойчивость и внимание к деталям позволили собрать внушительный арсенал наград." };
    else if (totalPoints >= 600) collectorData = { title: "Элитный Искатель", tier: "Продвинутый", desc: "Ты уже понял, как работает эта система. Твоя коллекция растет с каждым днем, и ты точно знаешь, какой значок заберешь следующим." };
    else if (totalPoints >= 300) collectorData = { title: "Золотой Профи", tier: "Средний", desc: "Уверенная середина пройдена. У тебя отличный вкус на значки, и ты не пропускаешь важные события. Так держать!" };
    else if (totalPoints >= 150) collectorData = { title: "Серебряный Зритель", tier: "Базовый", desc: "Ты уже не новичок и знаешь цену редким значкам. Твоя коллекция начинает обретать форму, и самые крутые значки еще впереди." };
    else if (totalPoints >= 80) collectorData = { title: "Бронзовый Участник", tier: "Начинающий", desc: "Первые важные шаги сделаны. Твоя коллекция начала расти, и это только начало большого приключения!" };

    // 2026 Prediction
    let prediction = "Будущая Легенда";
    if (charityCount >= 5) prediction = "Амбассадор Добра 2026";
    else if (charityCount > 1) prediction = "Герой Благотворительности 2026";
    else if (clipCount >= 10) prediction = "Режиссер Хайлайтов 2026";
    else if (clipCount > 3) prediction = "Мастер Клипов 2026";
    else if (gameCount >= 10) prediction = "Киберспортивный Магнат 2026";
    else if (gameCount > 3) prediction = "Геймер-Профи 2026";
    else if (rarestBadge && rarestBadge.user_count < 500) prediction = "Легенда Скрытых Значков 2026";
    else if (rarestBadge && rarestBadge.user_count < 2000) prediction = "Охотник за Глитчами 2026";
    else if (totalSpent > 1000) prediction = "VIP-Меценат Твича 2026";
    else if (completionistScore > 70) prediction = "Абсолютный Перфекционист 2026";

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
    const diversityScore = Object.values(categories).filter(v => v > 0).length;
    const favoriteType = Object.keys(categories).reduce((a, b) => categories[a] > categories[b] ? a : b, 'event');

    // Collector Archetype with Descriptions
    let archetype = "Путешественник";
    let archetypeDesc = "Твое приключение только начинается. В 2025 году ты открыл для себя множество новых миров и сообществ.";

    // Define potential archetypes with scoring
    const archetypeScores = [
        {
            type: "Абсолютный Фанат",
            score: completionistScore > 60 ? (completionistScore / 2) : 0,
            desc: "Твоя преданность поражает. Ты собрал больше половины всех значков года, став живой энциклопедий событий Twitch 2025."
        },
        {
            type: "Охотник за Сокровищами",
            score: rarestBadge && rarestBadge.user_count < 1500 ? 25 : 0,
            desc: "Ты охотишься за тем, что другие даже не замечают. В твоем арсенале есть значки, обладателями которых являются лишь единицы."
        },
        {
            type: "Халявщик",
            score: freeCount / (paidCount + 1) > 5 ? 20 : 0,
            desc: "Ты — мастер бесплатного фарма. Твоя коллекция огромна, и ты не потратил на неё ни копейки, используя лишь свою выдержку."
        },
        {
            type: "Коллекционный Шейх",
            score: paidCount > 20 ? 30 : 0,
            desc: "Ты ценишь эксклюзивнось. Твоя коллекция наполнена платными значками и сабками, что делает тебя одним из самых влиятельных зрителей."
        },
        {
            type: "Марафонец",
            score: maxStreak * 3,
            desc: "Твое постоянство — твоя суперсила. Ты неделя за неделей забирал значки без пропусков, показав невероятную дисциплину."
        }, ,
        {
            type: "Зимний Страж",
            score: seasonalCounts.winter > (badges2025.length * 0.5) ? 25 : 0,
            desc: "Твоя активность зашкаливает, когда на улице холодно. Ты согреваешься свежими значками и уютными стримами."
        },
        {
            type: "Летний Вайб",
            score: seasonalCounts.summer > (badges2025.length * 0.5) ? 25 : 0,
            desc: "Твое лето прошло на Твиче. Жаркие дни, горячие значки и солнечные коллекции — это твой стиль 2025 года."
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
        url: b.url.slice(0, -1) + '3',
        name: b.name,
        user_count: b.user_count || 0
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
            collectorLevel: collectorData.title,
            collectorTier: collectorData.tier,
            collectorDesc: collectorData.desc,
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
            diversityScore,
            favoriteType,
            colors: Array.from(colors).slice(0, 5),
            user: {
                displayName: req.session.user.display_name || req.session.user.login,
                color: req.session.user.color || '#9147ff'
            }
        }
    });
});

module.exports = router;
