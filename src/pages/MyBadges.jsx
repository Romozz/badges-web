import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchGlobalBadges } from '../services/twitch';
import BadgeCard from '../components/BadgeCard';
import { Helmet } from 'react-helmet-async';

const MyBadges = () => {
    const { user, userBadges } = useAuth();
    const [allBadges, setAllBadges] = useState([]);
    const [myBadgesData, setMyBadgesData] = useState([]);

    useEffect(() => {
        // Fetch all badges to get full badge data
        fetchGlobalBadges().then(badges => {
            setAllBadges(badges);
        });
    }, []);

    useEffect(() => {
        if (userBadges && allBadges.length > 0) {
            // Match user's badges with full badge data
            const matched = userBadges
                .map(userBadge => {
                    // Try to find matching badge by name
                    return allBadges.find(b => b.name === userBadge.name);
                })
                .filter(Boolean); // Remove nulls

            setMyBadgesData(matched);
        }
    }, [userBadges, allBadges]);

    if (!user) {
        return (
            <div className="content-header">
                <h2>Мои значки</h2>
                <p style={{ color: 'rgba(255,255,255,0.6)' }}>
                    Войдите в систему, чтобы увидеть свои значки
                </p>
            </div>
        );
    }

    if (!userBadges || userBadges.length === 0) {
        return (
            <>
                <div className="content-header">
                    <h2>Мои значки</h2>
                    <p>У вас пока нет значков</p>
                </div>
            </>
        );
    }

    return (
        <>
            <Helmet>
                <title>Мои значки - Badges Tracker</title>
                <meta name="description" content="Просмотрите свою коллекцию значков Twitch. Все ваши полученные глобальные значки в одном месте." />
                <meta name="keywords" content="Twitch, Badges, My Badges, Collection, User Badges, Badges Tracker" />
                <meta property="og:title" content="Мои значки - Badges Tracker" />
                <meta property="og:description" content="Просмотрите свою коллекцию значков Twitch. Все ваши полученные глобальные значки в одном месте." />
                <meta property="og:type" content="website" />
                <meta name="twitter:card" content="summary_large_image" />
            </Helmet>
            <div className="content-header">
                <h2>Мои значки</h2>
                <p>Всего значков: {myBadgesData.length}</p>
            </div>

            <div className="badge-grid">
                {myBadgesData.map((badge) => (
                    <BadgeCard
                        key={badge.badge}
                        badge={badge}
                        status="available"
                    />
                ))}
            </div>
        </>
    );
};

export default MyBadges;
