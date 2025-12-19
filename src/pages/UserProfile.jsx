import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Award, DollarSign, Gift } from 'lucide-react';
import BadgeCard from '../components/BadgeCard';

const UserProfile = () => {
    const { username } = useParams();
    const [userData, setUserData] = useState(null);
    const [allBadges, setAllBadges] = useState([]);
    const [userBadgesData, setUserBadgesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const baseUrl = import.meta.env.VITE_API_URL || '';

        // Fetch user data
        Promise.all([
            fetch(`${baseUrl}/api/users/${username}`).then(r => r.json()),
            fetch(`${baseUrl}/api/badges`).then(r => r.json())
        ])
            .then(([user, badges]) => {
                if (user.error) {
                    setError(user.error);
                    setLoading(false);
                    return;
                }

                setUserData(user);
                setAllBadges(Array.isArray(badges) ? badges : []);

                // Match user's badges with full badge data
                const matched = user.badges
                    .map(badgeName => badges.find(b => b.name === badgeName))
                    .filter(Boolean);

                setUserBadgesData(matched);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching user profile:', err);
                setError('Не удалось загрузить профиль');
                setLoading(false);
            });
    }, [username]);

    if (loading) {
        return <div className="loading">Загрузка профиля...</div>;
    }

    if (error) {
        return (
            <>
                <Helmet>
                    <title>Пользователь не найден - Badges Tracker</title>
                </Helmet>
                <div className="content-header">
                    <Link to="/stats" style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: 'rgba(255, 255, 255, 0.6)',
                        textDecoration: 'none',
                        marginBottom: '1rem',
                        transition: 'color 0.2s'
                    }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#9146ff'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'}
                    >
                        <ArrowLeft size={20} />
                        Назад к статистике
                    </Link>
                    <h2>Пользователь не найден</h2>
                    <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        Пользователь {username} не найден в базе данных
                    </p>
                </div>
            </>
        );
    }

    return (
        <>
            <Helmet>
                <title>{userData.login} - Профиль - Badges Tracker</title>
                <meta name="description" content={`Коллекция значков Twitch пользователя ${userData.login}. Всего значков: ${userData.stats.total}`} />
                <meta property="og:title" content={`${userData.login} - Профиль`} />
                <meta property="og:description" content={`Коллекция значков Twitch пользователя ${userData.login}. Всего значков: ${userData.stats.total}`} />
            </Helmet>

            <div className="content-header">
                <Link to="/stats" style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'rgba(255, 255, 255, 0.6)',
                    textDecoration: 'none',
                    marginBottom: '1rem',
                    transition: 'color 0.2s'
                }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#9146ff'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'}
                >
                    <ArrowLeft size={20} />
                    Назад к статистике
                </Link>
                <h2>Профиль {userData.login}</h2>
                <p>Коллекция значков Twitch</p>
            </div>

            {/* Stats Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                <div className="stat-card">
                    <Award size={24} color="#9146ff" />
                    <div className="stat-value">{userData.stats.total}</div>
                    <div className="stat-label">Всего значков</div>
                </div>
                <div className="stat-card">
                    <Gift size={24} color="#2ecc71" />
                    <div className="stat-value">{userData.stats.free}</div>
                    <div className="stat-label">Бесплатных</div>
                </div>
                <div className="stat-card">
                    <DollarSign size={24} color="#e74c3c" />
                    <div className="stat-value">{userData.stats.paid}</div>
                    <div className="stat-label">Платных</div>
                </div>
            </div>

            {/* Badges Grid */}
            {userBadgesData.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '3rem',
                    color: 'rgba(255, 255, 255, 0.5)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                    У пользователя пока нет значков
                </div>
            ) : (
                <div className="badge-grid">
                    {userBadgesData.map((badge) => (
                        <BadgeCard
                            key={badge.badge}
                            badge={badge}
                            status="available"
                        />
                    ))}
                </div>
            )}

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

export default UserProfile;
