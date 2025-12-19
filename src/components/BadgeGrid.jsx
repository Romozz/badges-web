import React, { useEffect, useState } from 'react';
import BadgeCard from './BadgeCard';
import { fetchGlobalBadges } from '../services/twitch';
import { Search, Filter, ArrowUpDown, X, ChevronDown, ChevronUp, Check, RotateCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';


const FilterDropdown = ({ label, value, options, onSelect, isOpen, onToggle, icon: Icon = Filter, onReset, isActive }) => {
    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={onToggle}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    background: isOpen ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.03)',
                    border: isOpen ? '1px solid rgba(145, 70, 255, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '0.6rem 1rem',
                    borderRadius: '12px',
                    color: '#fff',
                    cursor: 'pointer',
                    minWidth: '220px',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s ease',
                    boxShadow: isOpen ? '0 0 0 2px rgba(145, 70, 255, 0.15)' : 'none',
                    backdropFilter: 'blur(10px)'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: isOpen ? 'rgba(145, 70, 255, 0.8)' : 'rgba(255, 255, 255, 0.05)',
                        color: isOpen ? '#fff' : 'rgba(255, 255, 255, 0.7)',
                        transition: 'all 0.2s ease'
                    }}>
                        <Icon size={16} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.3 }}>
                        <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255, 255, 255, 0.4)', fontWeight: 600 }}>{label}</span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'rgba(255, 255, 255, 0.9)' }}>{value}</span>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {isActive && onReset && (
                        <div
                            role="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onReset();
                            }}
                            title="Сбросить этот фильтр"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                background: 'rgba(255, 255, 255, 0.1)',
                                color: 'rgba(255, 255, 255, 0.6)',
                                transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 100, 100, 0.2)';
                                e.currentTarget.style.color = '#ff6b6b';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
                            }}
                        >
                            <X size={12} />
                        </div>
                    )}
                    {isOpen ? <ChevronUp size={16} color="rgba(255, 255, 255, 0.5)" /> : <ChevronDown size={16} color="rgba(255, 255, 255, 0.3)" />}
                </div>
            </button>

            {isOpen && (
                <>
                    <div
                        style={{ position: 'fixed', inset: 0, zIndex: 999 }}
                        onClick={onToggle}
                    />
                    <div style={{
                        position: 'absolute',
                        top: 'calc(100% + 6px)',
                        left: 0,
                        width: '100%',
                        minWidth: '220px',
                        background: '#161618',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        padding: '0.4rem',
                        zIndex: 1000,
                        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 4px 12px rgba(0, 0, 0, 0.2)',
                        overflow: 'hidden',
                        animation: 'fadeIn 0.2s ease-out'
                    }}>
                        <style>
                            {`
                                @keyframes fadeIn {
                                    from { opacity: 0; transform: translateY(-8px); }
                                    to { opacity: 1; transform: translateY(0); }
                                }
                            `}
                        </style>
                        {options.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => {
                                    onSelect(option.value);
                                    onToggle();
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    width: '100%',
                                    padding: '0.6rem 0.8rem',
                                    borderRadius: '8px',
                                    background: option.label === value ? 'rgba(145, 70, 255, 0.1)' : 'transparent',
                                    border: 'none',
                                    color: option.label === value ? 'var(--color-accent)' : 'rgba(255, 255, 255, 0.8)',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    textAlign: 'left',
                                    transition: 'all 0.15s ease',
                                    marginBottom: '2px'
                                }}
                                onMouseEnter={(e) => {
                                    if (option.label !== value) {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                                        e.currentTarget.style.color = '#fff';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (option.label !== value) {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                                    }
                                }}
                            >
                                {option.label}
                                {option.label === value && <Check size={16} strokeWidth={3} />}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

const BadgeGrid = () => {
    const { userBadges } = useAuth();
    const [badges, setBadges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [openDropdown, setOpenDropdown] = useState(null); // 'ownership', 'cost', 'sort'

    // Filter states
    const [ownershipFilter, setOwnershipFilter] = useState('all'); // 'all', 'owned', 'not-owned'
    const [costFilter, setCostFilter] = useState('all'); // 'all', 'free', 'paid'

    // Sort state
    const [sortBy, setSortBy] = useState('default'); // 'default', 'name', 'users-desc', 'users-asc'

    const ownershipLabels = {
        'all': 'Все',
        'owned': 'Полученные',
        'not-owned': 'Не полученные'
    };

    const costLabels = {
        'all': 'Все типы',
        'free': 'Бесплатные',
        'paid': 'Платные',
        'local': 'Локальные',
        'canceled': 'Отменённые',
        'technical': 'Технические'
    };

    const sortLabels = {
        'default': 'По умолчанию',
        'name': 'По названию',
        'users-desc': 'Сначала популярные',
        'users-asc': 'Сначала редкие'
    };

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


        // Cost filter (now checks types array)
        if (costFilter === 'free') {
            filtered = filtered.filter(badge => badge.types && badge.types.includes('free'));
        } else if (costFilter === 'paid') {
            filtered = filtered.filter(badge => badge.types && badge.types.includes('paid'));
        } else if (costFilter === 'local') {
            filtered = filtered.filter(badge => badge.types && badge.types.includes('local'));
        } else if (costFilter === 'canceled') {
            filtered = filtered.filter(badge => badge.types && badge.types.includes('canceled'));
        } else if (costFilter === 'technical') {
            filtered = filtered.filter(badge => badge.types && badge.types.includes('technical'));
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
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                position: 'relative',
                zIndex: 50
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
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    alignItems: 'center'
                }}>
                    <FilterDropdown
                        label="Статус"
                        value={ownershipLabels[ownershipFilter]}
                        options={[
                            { value: 'all', label: 'Все' },
                            { value: 'owned', label: 'Полученные' },
                            { value: 'not-owned', label: 'Не полученные' }
                        ]}
                        onSelect={setOwnershipFilter}
                        isOpen={openDropdown === 'ownership'}
                        onToggle={() => setOpenDropdown(openDropdown === 'ownership' ? null : 'ownership')}
                        isActive={ownershipFilter !== 'all'}
                        onReset={() => setOwnershipFilter('all')}
                    />

                    <FilterDropdown
                        label="Тип"
                        value={costLabels[costFilter]}
                        options={[
                            { value: 'all', label: 'Все типы' },
                            { value: 'free', label: 'Бесплатные' },
                            { value: 'paid', label: 'Платные' },
                            { value: 'local', label: 'Локальные' },
                            { value: 'canceled', label: 'Отменённые' },
                            { value: 'technical', label: 'Технические' }
                        ]}
                        onSelect={setCostFilter}
                        isOpen={openDropdown === 'cost'}
                        onToggle={() => setOpenDropdown(openDropdown === 'cost' ? null : 'cost')}
                        isActive={costFilter !== 'all'}
                        onReset={() => setCostFilter('all')}
                    />

                    <FilterDropdown
                        label="Сортировка"
                        value={sortLabels[sortBy]}
                        options={[
                            { value: 'default', label: 'По умолчанию' },
                            { value: 'name', label: 'По названию (A-Z)' },
                            { value: 'users-desc', label: 'По популярности (Сначала популярные)' },
                            { value: 'users-asc', label: 'По популярности (Сначала редкие)' }
                        ]}
                        onSelect={setSortBy}
                        isOpen={openDropdown === 'sort'}
                        onToggle={() => setOpenDropdown(openDropdown === 'sort' ? null : 'sort')}
                        icon={ArrowUpDown}
                        isActive={sortBy !== 'default'}
                        onReset={() => setSortBy('default')}
                    />
                </div>


                {/* Reset Button - Only show when filters are active */}
                {
                    (ownershipFilter !== 'all' || costFilter !== 'all' || sortBy !== 'default') && (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem', width: '100%' }}>
                                <button
                                    onClick={() => {
                                        setOwnershipFilter('all');
                                        setCostFilter('all');
                                        setSortBy('default');
                                    }}
                                    title="Сбросить фильтры"
                                    style={{
                                        background: 'rgba(145, 70, 255, 0.1)',
                                        border: '1px solid rgba(145, 70, 255, 0.3)',
                                        borderRadius: '50%',
                                        width: '40px',
                                        height: '40px',
                                        padding: '0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#9146ff',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(145, 70, 255, 0.2)';
                                        e.currentTarget.style.transform = 'rotate(-90deg)';
                                        e.currentTarget.style.color = '#fff';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(145, 70, 255, 0.1)';
                                        e.currentTarget.style.transform = 'rotate(0deg)';
                                        e.currentTarget.style.color = '#9146ff';
                                    }}
                                >
                                    <RotateCcw size={20} />
                                </button>
                            </div>
                        </>
                    )
                }
            </div >

            {
                relevantBadges.length > 0 && (
                    <div className="badge-section">
                        <h2 className="section-title">Доступны к получению</h2>
                        <div className="badge-grid">
                            {relevantBadges.map((badge) => (
                                <BadgeCard key={`relevant-${badge.badge}`} badge={badge} status="available" />
                            ))}
                        </div>
                    </div>
                )
            }

            {
                upcomingBadges.length > 0 && (
                    <div className="badge-section">
                        <h2 className="section-title">Скоро станут доступны</h2>
                        <div className="badge-grid">
                            {upcomingBadges.map((badge) => (
                                <BadgeCard key={`upcoming-${badge.badge}`} badge={badge} status="upcoming" />
                            ))}
                        </div>
                    </div>
                )
            }

            <div className="badge-section">
                <h2 className="section-title">Все значки</h2>
                <div className="badge-grid">
                    {allBadges.map((badge) => (
                        <BadgeCard key={badge.badge} badge={badge} />
                    ))}
                </div>
            </div>

            {/* No results message */}
            {
                searchQuery && allBadges.length === 0 && (
                    <div className="no-results">
                        <p>Значки не найдены по запросу "{searchQuery}"</p>
                    </div>
                )
            }
        </div >
    );
};

export default BadgeGrid;

