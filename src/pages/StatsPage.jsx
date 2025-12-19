import React, { useEffect, useState } from 'react';
import { Trophy, TrendingUp, Users, Award, Sparkles } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

const StatsPage = () => {
    const [leaderboards, setLeaderboards] = useState({
        total: [],
        free: [],
        paid: [],
        rare: []
    });
    const [overview, setOverview] = useState(null);
    const [activeTab, setActiveTab] = useState('total');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const baseUrl = import.meta.env.VITE_API_URL || '';

        // Fetch all leaderboards
        Promise.all([
            fetch(`${baseUrl}/api/stats/leaderboard?type=total`).then(r => r.json()),
            fetch(`${baseUrl}/api/stats/leaderboard?type=free`).then(r => r.json()),
            fetch(`${baseUrl}/api/stats/leaderboard?type=paid`).then(r => r.json()),
            fetch(`${baseUrl}/api/stats/leaderboard?type=rare`).then(r => r.json()),
            fetch(`${baseUrl}/api/stats/overview`).then(r => r.json())
        ])
            .then(([total, free, paid, rare, overviewData]) => {
                setLeaderboards({ total, free, paid, rare });
                setOverview(overviewData);
                setLoading(false);
            })
            .catch(e => {
                console.error("Failed to fetch stats", e);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <div className="loading">Загрузка статистики...</div>;
    }

    const tabs = [
        { id: 'total', label: 'Все значки', icon: Trophy, color: '#9146ff' },
        { id: 'free', label: 'Бесплатные', icon: Award, color: '#2ecc71' },
        { id: 'paid', label: 'Платные', icon: TrendingUp, color: '#e74c3c' },
        { id: 'rare', label: 'Редкие', icon: Sparkles, color: '#f39c12' }
    ];

    const currentTab = tabs.find(t => t.id === activeTab);
    const currentLeaderboard = leaderboards[activeTab];

    return (
        <>
            <Helmet>
                <title>Статистика - Badges Tracker</title>
                <meta name="description" content="Лидеры по коллекциям значков Twitch. Топ пользователей по общему количеству, бесплатным, платным и редким значкам." />
                <meta name="keywords" content="Twitch, Badges, Statistics, Leaderboard, Top Users, Badge Collection, Badges Tracker" />
                <meta property="og:title" content="Статистика значков - Badges Tracker" />
                <meta property="og:description" content="Лидеры по коллекциям значков Twitch. Топ пользователей по общему количеству, бесплатным, платным и редким значкам." />
                <meta property="og:type" content="website" />
                <meta name="twitter:card" content="summary_large_image" />
            </Helmet>
            <div className="content-header">
                <h2>Статистика</h2>
                <p>Лидеры по коллекциям значков</p>
            </div>

            {/* Overview Stats */}
            {overview && overview.totalUsers > 0 && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    marginBottom: '2rem'
                }}>
                    <div className="stat-card">
                        <Users size={24} color="#9146ff" />
                        <div className="stat-value">{overview.totalUsers}</div>
                        <div className="stat-label">Пользователей</div>
                    </div>
                    <div className="stat-card">
                        <Trophy size={24} color="#9146ff" />
                        <div className="stat-value">{overview.averageBadges}</div>
                        <div className="stat-label">Средне значков</div>
                    </div>
                    <div className="stat-card">
                        <Award size={24} color="#2ecc71" />
                        <div className="stat-value">{overview.averageFree}</div>
                        <div className="stat-label">Средне бесплатных</div>
                    </div>
                    <div className="stat-card">
                        <TrendingUp size={24} color="#e74c3c" />
                        <div className="stat-value">{overview.averagePaid}</div>
                        <div className="stat-label">Средне платных</div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '2rem',
                flexWrap: 'wrap',
                justifyContent: 'center'
            }}>
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                background: activeTab === tab.id ? `${tab.color}33` : 'rgba(255, 255, 255, 0.05)',
                                border: activeTab === tab.id ? `2px solid ${tab.color}` : '2px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '12px',
                                padding: '0.75rem 1.5rem',
                                color: activeTab === tab.id ? tab.color : 'rgba(255, 255, 255, 0.6)',
                                cursor: 'pointer',
                                fontSize: '0.95rem',
                                fontWeight: activeTab === tab.id ? '600' : '400',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <Icon size={18} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Leaderboard */}
            <div style={{
                maxWidth: '800px',
                margin: '0 auto'
            }}>
                {!currentLeaderboard || !Array.isArray(currentLeaderboard) || currentLeaderboard.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '3rem',
                        color: 'rgba(255, 255, 255, 0.5)',
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                        Пока нет данных
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {currentLeaderboard.map((entry, index) => {
                            const Icon = currentTab.icon;
                            const medals = ['🥇', '🥈', '🥉'];

                            return (
                                <div
                                    key={entry.login}
                                    style={{
                                        background: index < 3 ? 'rgba(145, 70, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                                        border: index < 3 ? `1px solid ${currentTab.color}33` : '1px solid rgba(255, 255, 255, 0.05)',
                                        borderRadius: '12px',
                                        padding: '1rem 1.5rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {/* Rank */}
                                    <div style={{
                                        fontSize: '1.5rem',
                                        fontWeight: '700',
                                        minWidth: '50px',
                                        textAlign: 'center',
                                        color: index < 3 ? currentTab.color : 'rgba(255, 255, 255, 0.3)'
                                    }}>
                                        {index < 3 ? medals[index] : `#${index + 1}`}
                                    </div>

                                    {/* User */}
                                    <div style={{ flex: 1 }}>
                                        <Link
                                            to={`/user/${entry.login}`}
                                            style={{
                                                fontSize: '1.1rem',
                                                fontWeight: '600',
                                                color: '#fff',
                                                textDecoration: 'none',
                                                transition: 'color 0.2s ease'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.color = currentTab.color}
                                            onMouseLeave={(e) => e.currentTarget.style.color = '#fff'}
                                        >
                                            {entry.login}
                                        </Link>
                                        <div style={{
                                            fontSize: '0.85rem',
                                            color: 'rgba(255, 255, 255, 0.5)'
                                        }}>
                                            Всего: {entry.total}
                                        </div>
                                    </div>

                                    {/* Count */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        background: `${currentTab.color}22`,
                                        padding: '0.5rem 1rem',
                                        borderRadius: '8px',
                                        border: `1px solid ${currentTab.color}44`
                                    }}>
                                        <Icon size={20} color={currentTab.color} />
                                        <span style={{
                                            fontSize: '1.25rem',
                                            fontWeight: '700',
                                            color: currentTab.color
                                        }}>
                                            {entry.count}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <style jsx>{`
                .stat-card {
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                    padding: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;
                    transition: all 0.2s ease;
                }

                .stat-card:hover {
                    background: rgba(255, 255, 255, 0.04);
                    border-color: rgba(145, 70, 255, 0.3);
                    transform: translateY(-2px);
                }

                .stat-value {
                    font-size: 2rem;
                    font-weight: 700;
                    color: #fff;
                }

                .stat-label {
                    font-size: 0.85rem;
                    color: rgba(255, 255, 255, 0.6);
                    text-align: center;
                }
            `}</style>
        </>
    );
};

export default StatsPage;
