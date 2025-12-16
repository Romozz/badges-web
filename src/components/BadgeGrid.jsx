import React, { useEffect, useState } from 'react';
import BadgeCard from './BadgeCard';
import { fetchGlobalBadges } from '../services/twitch';
import { Search } from 'lucide-react';

const BadgeGrid = () => {
    const [badges, setBadges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchGlobalBadges().then(data => {
            setBadges(data);
            setLoading(false);
        });
    }, []);

    // Filter badges based on search query
    const filterBadges = (badgeList) => {
        if (!searchQuery.trim()) return badgeList;
        return badgeList.filter(badge =>
            badge.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    };

    const relevantBadges = filterBadges(badges.filter(b => b.isRelevant));
    const upcomingBadges = filterBadges(badges.filter(b => {
        if (!b.availability || !b.availability.start) return false;
        return new Date(b.availability.start).getTime() > Date.now();
    }));
    const allBadges = filterBadges(badges);

    if (loading) return <div className="loading">Загрузка значков...</div>;

    return (
        <div className="badge-grid-container">
            {/* Search Input */}
            <div className="search-container">
                <Search className="search-icon" size={20} />
                <input
                    type="text"
                    className="search-input"
                    placeholder="Поиск значков по названию..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                    <button
                        className="search-clear"
                        onClick={() => setSearchQuery('')}
                        aria-label="Clear search"
                    >
                        ×
                    </button>
                )}
            </div>

            {relevantBadges.length > 0 && (
                <div className="badge-section">
                    <h2 className="section-title">Можно сейчас получить</h2>
                    <div className="badge-grid">
                        {relevantBadges.map((badge) => (
                            <BadgeCard key={`relevant-${badge.badge}`} badge={badge} />
                        ))}
                    </div>
                </div>
            )}

            {upcomingBadges.length > 0 && (
                <div className="badge-section">
                    <h2 className="section-title">Скоро станут доступны</h2>
                    <div className="badge-grid">
                        {upcomingBadges.map((badge) => (
                            <BadgeCard key={`upcoming-${badge.badge}`} badge={badge} />
                        ))}
                    </div>
                </div>
            )}

            <div className="badge-section">
                <h2 className="section-title">Все значки</h2>
                <div className="badge-grid">
                    {allBadges.map((badge) => (
                        <BadgeCard key={badge.badge} badge={badge} />
                    ))}
                </div>
            </div>

            {/* No results message */}
            {searchQuery && allBadges.length === 0 && (
                <div className="no-results">
                    <p>Значки не найдены по запросу "{searchQuery}"</p>
                </div>
            )}
        </div>
    );
};

export default BadgeGrid;
