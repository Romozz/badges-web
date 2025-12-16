import React, { useEffect, useState } from 'react';
import BadgeCard from './BadgeCard';
import { fetchGlobalBadges } from '../services/twitch';

const BadgeGrid = () => {
    const [badges, setBadges] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchGlobalBadges().then(data => {
            setBadges(data);
            setLoading(false);
        });
    }, []);

    const relevantBadges = badges.filter(b => b.isRelevant);

    if (loading) return <div className="loading">Загрузка значков...</div>;

    return (
        <div className="badge-grid-container">
            {relevantBadges.length > 0 && (
                <div className="badge-section">
                    <h2 className="section-title">Значки которые можно сейчас получить</h2>
                    <div className="badge-grid">
                        {relevantBadges.map((badge) => (
                            <BadgeCard key={`relevant-${badge.badge}`} badge={badge} />
                        ))}
                    </div>
                </div>
            )}

            <div className="badge-section">
                <h2 className="section-title">Все значки</h2>
                <div className="badge-grid">
                    {badges.map((badge) => (
                        <BadgeCard key={badge.badge} badge={badge} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BadgeGrid;
