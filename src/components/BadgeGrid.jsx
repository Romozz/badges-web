import React, { useEffect, useState } from 'react';
import BadgeCard from './BadgeCard';
import { fetchGlobalBadges } from '../services/twitch';
import { Search, Filter, ArrowUpDown, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const BadgeGrid = () => {
    const { userBadges } = useAuth();
    const [badges, setBadges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Filter states
    const [ownershipFilter, setOwnershipFilter] = useState('all'); // 'all', 'owned', 'not-owned'
    const [costFilter, setCostFilter] = useState('all'); // 'all', 'free', 'paid'

    // Sort state
    const [sortBy, setSortBy] = useState('default'); // 'default', 'name', 'users-desc', 'users-asc'

    useEffect(() => {
        fetchGlobalBadges().then(data => {
            setBadges(data);
            setLoading(false);
        });
    }, []);

    // Check if badge is owned
    const isBadgeOwned = (badge) => {
        if (!userBadges) return false;
        return userBadges.some(b => b.name === badge.name);
    };

    // Filter badges based on all criteria
    const filterBadges = (badgeList) => {
        let filtered = badgeList;

        // Search filter
        if (searchQuery.trim()) {
            filtered = filtered.filter(badge =>
                badge.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Ownership filter
        if (ownershipFilter === 'owned') {
            filtered = filtered.filter(badge => isBadgeOwned(badge));
        } else if (ownershipFilter === 'not-owned') {
            filtered = filtered.filter(badge => !isBadgeOwned(badge));
        }

        // Cost filter
        if (costFilter === 'free') {
            filtered = filtered.filter(badge => badge.cost === 'free');
        } else if (costFilter === 'paid') {
            filtered = filtered.filter(badge => badge.cost === 'paid');
        }

        return filtered;
    };

    // Sort badges
    const sortBadges = (badgeList) => {
        const sorted = [...badgeList];

        switch (sortBy) {
            case 'name':
                return sorted.sort((a, b) => a.name.localeCompare(b.name));
            case 'users-desc':
                return sorted.sort((a, b) => b.user_count - a.user_count);
            case 'users-asc':
                return sorted.sort((a, b) => a.user_count - b.user_count);
            default:
                return sorted;
        }
    };

    const relevantBadges = sortBadges(filterBadges(badges.filter(b => b.isRelevant)));
    const upcomingBadges = sortBadges(filterBadges(badges.filter(b => {
        if (!b.availability || !b.availability.start) return false;
        return new Date(b.availability.start).getTime() > Date.now();
    })));
    const allBadges = sortBadges(filterBadges(badges));

    if (loading) return <div className="loading">Загрузка значков...</div>;

    return (
        <div className="badge-grid-container">
            {/* Combined Search and Filters Block */}
            <div style={{
                maxWidth: '1000px',
                margin: '0 auto 3rem auto',
                background: 'rgba(30, 30, 35, 0.6)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
            }}>
                {/* Search Input */}
                <div className="search-container" style={{
                    position: 'relative',
                    margin: '0 0 1.25rem 0',
                    display: 'flex',
                    alignItems: 'center'
                }}>
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

                {/* Filter and Sort Controls */}
                <div className="filter-sort-controls" style={{
                    display: 'flex',
                    gap: '0.75rem',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {/* Ownership Filter Pills */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => setOwnershipFilter('all')}
                            style={{
                                background: ownershipFilter === 'all' ? 'rgba(145, 70, 255, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                                border: ownershipFilter === 'all' ? '1px solid rgba(145, 70, 255, 0.6)' : '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '20px',
                                padding: '0.4rem 0.9rem',
                                color: ownershipFilter === 'all' ? '#fff' : 'rgba(255, 255, 255, 0.6)',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: ownershipFilter === 'all' ? '600' : '400',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            Все
                        </button>
                        <button
                            onClick={() => setOwnershipFilter('owned')}
                            style={{
                                background: ownershipFilter === 'owned' ? 'rgba(145, 70, 255, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                                border: ownershipFilter === 'owned' ? '1px solid rgba(145, 70, 255, 0.6)' : '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '20px',
                                padding: '0.4rem 0.9rem',
                                color: ownershipFilter === 'owned' ? '#fff' : 'rgba(255, 255, 255, 0.6)',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: ownershipFilter === 'owned' ? '600' : '400',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            Полученные
                        </button>
                        <button
                            onClick={() => setOwnershipFilter('not-owned')}
                            style={{
                                background: ownershipFilter === 'not-owned' ? 'rgba(145, 70, 255, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                                border: ownershipFilter === 'not-owned' ? '1px solid rgba(145, 70, 255, 0.6)' : '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '20px',
                                padding: '0.4rem 0.9rem',
                                color: ownershipFilter === 'not-owned' ? '#fff' : 'rgba(255, 255, 255, 0.6)',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: ownershipFilter === 'not-owned' ? '600' : '400',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            Не полученные
                        </button>
                    </div>

                    <div style={{ width: '1px', height: '24px', background: 'rgba(255, 255, 255, 0.1)' }}></div>

                    {/* Cost Filter Pills */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => setCostFilter('all')}
                            style={{
                                background: costFilter === 'all' ? 'rgba(145, 70, 255, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                                border: costFilter === 'all' ? '1px solid rgba(145, 70, 255, 0.6)' : '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '20px',
                                padding: '0.4rem 0.9rem',
                                color: costFilter === 'all' ? '#fff' : 'rgba(255, 255, 255, 0.6)',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: costFilter === 'all' ? '600' : '400',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            Все типы
                        </button>
                        <button
                            onClick={() => setCostFilter('free')}
                            style={{
                                background: costFilter === 'free' ? 'rgba(46, 204, 113, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                border: costFilter === 'free' ? '1px solid rgba(46, 204, 113, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '20px',
                                padding: '0.4rem 0.9rem',
                                color: costFilter === 'free' ? '#2ecc71' : 'rgba(255, 255, 255, 0.6)',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: costFilter === 'free' ? '600' : '400',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            Бесплатные
                        </button>
                        <button
                            onClick={() => setCostFilter('paid')}
                            style={{
                                background: costFilter === 'paid' ? 'rgba(231, 76, 60, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                border: costFilter === 'paid' ? '1px solid rgba(231, 76, 60, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '20px',
                                padding: '0.4rem 0.9rem',
                                color: costFilter === 'paid' ? '#e74c3c' : 'rgba(255, 255, 255, 0.6)',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: costFilter === 'paid' ? '600' : '400',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            Платные
                        </button>
                    </div>

                    <div style={{ width: '1px', height: '24px', background: 'rgba(255, 255, 255, 0.1)' }}></div>

                    {/* Sort Pills */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => setSortBy('default')}
                            style={{
                                background: sortBy === 'default' ? 'rgba(145, 70, 255, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                                border: sortBy === 'default' ? '1px solid rgba(145, 70, 255, 0.6)' : '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '20px',
                                padding: '0.4rem 0.9rem',
                                color: sortBy === 'default' ? '#fff' : 'rgba(255, 255, 255, 0.6)',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: sortBy === 'default' ? '600' : '400',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            По умолчанию
                        </button>
                        <button
                            onClick={() => setSortBy('name')}
                            style={{
                                background: sortBy === 'name' ? 'rgba(145, 70, 255, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                                border: sortBy === 'name' ? '1px solid rgba(145, 70, 255, 0.6)' : '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '20px',
                                padding: '0.4rem 0.9rem',
                                color: sortBy === 'name' ? '#fff' : 'rgba(255, 255, 255, 0.6)',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: sortBy === 'name' ? '600' : '400',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            По названию
                        </button>
                        <button
                            onClick={() => setSortBy('users-desc')}
                            style={{
                                background: sortBy === 'users-desc' ? 'rgba(145, 70, 255, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                                border: sortBy === 'users-desc' ? '1px solid rgba(145, 70, 255, 0.6)' : '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '20px',
                                padding: '0.4rem 0.9rem',
                                color: sortBy === 'users-desc' ? '#fff' : 'rgba(255, 255, 255, 0.6)',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: sortBy === 'users-desc' ? '600' : '400',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            Популярные ↓
                        </button>
                        <button
                            onClick={() => setSortBy('users-asc')}
                            style={{
                                background: sortBy === 'users-asc' ? 'rgba(145, 70, 255, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                                border: sortBy === 'users-asc' ? '1px solid rgba(145, 70, 255, 0.6)' : '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '20px',
                                padding: '0.4rem 0.9rem',
                                color: sortBy === 'users-asc' ? '#fff' : 'rgba(255, 255, 255, 0.6)',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: sortBy === 'users-asc' ? '600' : '400',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            Редкие ↑
                        </button>
                    </div>

                    {/* Reset Button - Only show when filters are active */}
                    {(ownershipFilter !== 'all' || costFilter !== 'all' || sortBy !== 'default') && (
                        <>
                            <div style={{ width: '1px', height: '24px', background: 'rgba(255, 255, 255, 0.1)' }}></div>
                            <button
                                onClick={() => {
                                    setOwnershipFilter('all');
                                    setCostFilter('all');
                                    setSortBy('default');
                                }}
                                title="Сбросить фильтры"
                                style={{
                                    background: 'rgba(145, 70, 255, 0.2)',
                                    border: '1px solid rgba(145, 70, 255, 0.4)',
                                    borderRadius: '50%',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    padding: 0
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(145, 70, 255, 0.3)';
                                    e.currentTarget.style.transform = 'scale(1.1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(145, 70, 255, 0.2)';
                                    e.currentTarget.style.transform = 'scale(1)';
                                }}
                            >
                                <X size={16} color="#9146ff" />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {relevantBadges.length > 0 && (
                <div className="badge-section">
                    <h2 className="section-title">Доступны к получению</h2>
                    <div className="badge-grid">
                        {relevantBadges.map((badge) => (
                            <BadgeCard key={`relevant-${badge.badge}`} badge={badge} status="available" />
                        ))}
                    </div>
                </div>
            )}

            {upcomingBadges.length > 0 && (
                <div className="badge-section">
                    <h2 className="section-title">Скоро станут доступны</h2>
                    <div className="badge-grid">
                        {upcomingBadges.map((badge) => (
                            <BadgeCard key={`upcoming-${badge.badge}`} badge={badge} status="upcoming" />
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

