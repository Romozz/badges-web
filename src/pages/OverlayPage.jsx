import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchGlobalBadges, fetchBadgeTypes } from '../services/twitch';
import ReactMarkdown from 'react-markdown';
import { Clock, Check, Sparkles } from 'lucide-react';

const getHighRes = (url) => {
    if (!url) return '';
    if (url.match(/\/[123]$/)) return url.slice(0, -1) + '3';
    return url;
};

const OverlayPage = () => {
    const [searchParams] = useSearchParams();
    const featuredBadgeId = searchParams.get('badge');

    const [badges, setBadges] = useState([]);
    const [featuredBadge, setFeaturedBadge] = useState(null);
    const [typeConfig, setTypeConfig] = useState({});
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef(null);
    const [isScrolling, setIsScrolling] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [badgeData, types] = await Promise.all([
                    fetchGlobalBadges(),
                    fetchBadgeTypes()
                ]);

                const filtered = badgeData.filter(b => {
                    const now = Date.now();
                    const start = b.availability?.start ? new Date(b.availability.start).getTime() : null;
                    const isAvailable = b.isRelevant;
                    const isUpcoming = start && start > now;
                    return isAvailable || isUpcoming;
                });

                const detailedBadges = await Promise.all(filtered.map(async (b) => {
                    try {
                        const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/badges/${b.badge}`);
                        const details = await res.json();
                        return { ...b, ...details };
                    } catch (e) {
                        return b;
                    }
                }));

                // Fetch featured badge if specified
                if (featuredBadgeId) {
                    try {
                        const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/badges/${featuredBadgeId}`);
                        const details = await res.json();
                        setFeaturedBadge(details);
                    } catch (e) {
                        console.error("Failed to fetch featured badge:", e);
                    }
                } else {
                    setFeaturedBadge(null);
                }

                setBadges(detailedBadges);
                setTypeConfig(types);
                setLoading(false);
            } catch (error) {
                console.error("Failed to load overlay data:", error);
                setLoading(false);
            }
        };

        loadData();
        const interval = setInterval(loadData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [featuredBadgeId]);

    // Auto-scroll logic (Step-wise Ping-pong)
    useEffect(() => {
        if (loading || badges.length === 0 || !isScrolling) return;

        const container = scrollRef.current;
        let itemIndex = 0;
        let direction = 1; // 1 = down, -1 = up
        let timer;

        const scrollNext = () => {
            if (!container) return;

            const items = container.querySelectorAll('.badge-item');
            if (items.length <= 1) {
                timer = setTimeout(scrollNext, 5000);
                return;
            }

            // Calculate next index
            let nextIndex = itemIndex + direction;

            // Flip direction if bounds reached
            if (nextIndex >= items.length - 1) {
                nextIndex = items.length - 1;
                direction = -1;
            } else if (nextIndex <= 0) {
                nextIndex = 0;
                direction = 1;
            }

            itemIndex = nextIndex;

            const targetItem = items[itemIndex];
            if (targetItem) {
                targetItem.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                    inline: 'nearest'
                });
            }

            timer = setTimeout(scrollNext, 5000);
        };

        timer = setTimeout(scrollNext, 3000);
        return () => clearTimeout(timer);
    }, [loading, badges, isScrolling]);

    if (loading) return null;

    if (badges.length === 0 && !featuredBadge) {
        return (
            <div className="overlay-empty" style={{
                color: 'white',
                padding: '60px',
                textAlign: 'center',
                fontFamily: 'Inter, sans-serif',
                background: 'rgba(0,0,0,0.5)',
                borderRadius: '32px',
                margin: '100px auto',
                width: '1000px',
                fontSize: '2rem'
            }}>
                Актуальных значков сейчас нет
            </div>
        );
    }

    return (
        <div className="stream-overlay-container" style={{
            height: '1080px',
            width: '1920px',
            overflow: 'hidden',
            background: 'transparent',
            display: 'flex',
            fontFamily: 'Inter, Roobert, "Helvetica Neue", Helvetica, Arial, sans-serif',
            color: 'white',
            boxSizing: 'border-box'
        }}>
            <style>
                {`
                    .overlay-scroll-container::-webkit-scrollbar {
                        display: none;
                    }
                    .badge-item {
                        transition: transform 0.3s ease;
                    }
                    .markdown-content a { color: #9146ff; text-decoration: none; }
                    .markdown-content p { margin: 0.5rem 0; }
                    .markdown-content ul { padding-left: 1.2rem; }
                    @keyframes pulse-dot {
                        0% { transform: scale(1); opacity: 1; }
                        50% { transform: scale(1.2); opacity: 0.6; }
                        100% { transform: scale(1); opacity: 1; }
                    }
                    @keyframes shimmer {
                        0% { background-position: -1000px 0; }
                        100% { background-position: 1000px 0; }
                    }
                    .featured-badge-card {
                        background: linear-gradient(135deg, rgba(145, 70, 255, 0.25), rgba(145, 70, 255, 0.05));
                        position: relative;
                        overflow: hidden;
                    }
                    .featured-badge-card::after {
                        content: "";
                        position: absolute;
                        top: 0; left: 0; right: 0; bottom: 0;
                        background: linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent);
                        background-size: 1000px 100%;
                        animation: shimmer 5s infinite linear;
                        pointer-events: none;
                    }
                `}
            </style>

            {/* Left Section: Featured Badge */}
            {featuredBadge && (
                <div style={{
                    width: '750px',
                    padding: '80px 60px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    background: 'rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(25px)',
                    borderRight: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <div className="featured-badge-card" style={{
                        padding: '4rem 3rem',
                        borderRadius: '48px',
                        border: '2px solid rgba(145, 70, 255, 0.5)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        gap: '2.5rem',
                        boxShadow: '0 30px 80px rgba(0,0,0,0.9)'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            background: '#9146ff',
                            padding: '12px 28px',
                            borderRadius: '100px',
                            fontWeight: '950',
                            textTransform: 'uppercase',
                            fontSize: '1.4rem',
                            letterSpacing: '0.05em',
                            boxShadow: '0 0 20px rgba(145, 70, 255, 0.5)'
                        }}>
                            <Sparkles size={28} fill="white" />
                            Значок этого стрима
                        </div>

                        <img
                            src={getHighRes(featuredBadge.url)}
                            alt={featuredBadge.name}
                            style={{
                                width: '320px',
                                height: '320px',
                                filter: 'drop-shadow(0 20px 40px rgba(145, 70, 255, 0.8))'
                            }}
                        />

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
                            <h1 style={{ fontSize: '4.5rem', margin: 0, fontWeight: '900', color: '#fff', letterSpacing: '-0.04em', lineHeight: '1.1' }}>
                                {featuredBadge.name}
                            </h1>
                        </div>

                        <div style={{
                            marginTop: '1rem',
                            padding: '2rem',
                            background: 'rgba(255,255,255,0.07)',
                            borderRadius: '32px',
                            border: '1px solid rgba(255,255,255,0.15)',
                            width: '100%',
                            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.3)'
                        }}>
                            <div style={{ fontSize: '1.1rem', color: '#9146ff', textTransform: 'uppercase', fontWeight: '900', marginBottom: '12px', letterSpacing: '0.1em' }}>Как получить?</div>
                            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#fff' }}>
                                <div className="markdown-content" style={{
                                    fontSize: '1.6rem',
                                    color: 'rgba(255,255,255,0.75)',
                                    lineHeight: '1.6',
                                    maxHeight: '240px',
                                    overflow: 'hidden'
                                }}>
                                    {featuredBadge.description ? (
                                        <ReactMarkdown>{featuredBadge.description}</ReactMarkdown>
                                    ) : (
                                        <p style={{ fontStyle: 'italic', opacity: 0.5 }}>Описание способа получения уточняется...</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Right Section: Scrolling List */}
            <div
                className="overlay-scroll-container"
                ref={scrollRef}
                style={{
                    flex: 1,
                    overflowY: 'scroll',
                    padding: '80px 60px',
                    position: 'relative',
                    maskImage: 'linear-gradient(to bottom, transparent, black 5%, black 95%, transparent)',
                    WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 5%, black 95%, transparent)',
                    scrollBehavior: 'smooth'
                }}
            >
                <div style={{ marginBottom: '60px', borderBottom: '2px solid rgba(255,255,255,0.1)', paddingBottom: '30px' }}>
                    <h2 style={{ fontSize: '3.5rem', fontWeight: '900', margin: 0, letterSpacing: '-0.02em' }}>Актуальные значки</h2>
                    <p style={{ fontSize: '1.5rem', color: '#888', margin: '15px 0 0', fontWeight: '500' }}>Все доступные и предстоящие награды Twitch</p>
                </div>

                {badges.map((badge, index) => {
                    const isUpcoming = new Date(badge.availability?.start).getTime() > Date.now();
                    const highResUrl = getHighRes(badge.url);

                    return (
                        <div key={`${badge.badge}-${index}`} className="badge-item" style={{
                            background: 'rgba(12, 12, 14, 0.9)',
                            backdropFilter: 'blur(20px)',
                            border: `1px solid ${isUpcoming ? 'rgba(255, 170, 0, 0.2)' : 'rgba(145, 70, 255, 0.2)'}`,
                            borderRadius: '40px',
                            padding: '3rem',
                            marginBottom: '4rem',
                            boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
                            display: 'flex',
                            gap: '3rem',
                            position: 'relative'
                        }}>
                            {/* Icon Section */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center', width: '180px' }}>
                                <div style={{
                                    width: '160px',
                                    height: '160px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'rgba(255,255,255,0.04)',
                                    borderRadius: '32px',
                                    padding: '20px'
                                }}>
                                    <img src={highResUrl || badge.url} alt={badge.name} style={{ maxWidth: '100%', height: 'auto', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.7))' }} />
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
                                    {badge.types?.map(t => {
                                        const conf = typeConfig[t];
                                        if (!conf) return null;
                                        return (
                                            <span key={t} style={{
                                                fontSize: '1rem',
                                                padding: '6px 16px',
                                                borderRadius: '10px',
                                                background: conf.bg,
                                                color: conf.color,
                                                border: `1px solid ${conf.border}`,
                                                fontWeight: '900',
                                                textTransform: 'uppercase'
                                            }}>
                                                {conf.label}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Info Section */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2rem' }}>
                                    <h3 style={{ margin: 0, fontSize: '3rem', color: '#fff', fontWeight: '900', letterSpacing: '-0.02em', flex: 1 }}>{badge.name}</h3>

                                    {/* Status Chip */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '16px',
                                        padding: '10px 24px',
                                        borderRadius: '20px',
                                        background: isUpcoming ? 'rgba(255, 170, 0, 0.1)' : 'rgba(46, 204, 113, 0.1)',
                                        border: `1px solid ${isUpcoming ? 'rgba(255, 170, 0, 0.3)' : 'rgba(46, 204, 113, 0.3)'}`,
                                    }}>
                                        <div style={{
                                            width: '14px',
                                            height: '14px',
                                            borderRadius: '50%',
                                            background: isUpcoming ? '#ffaa00' : '#2ecc71',
                                            boxShadow: `0 0 20px ${isUpcoming ? '#ffaa00' : '#2ecc71'}`,
                                            animation: 'pulse-dot 2s infinite'
                                        }} />
                                        <span style={{
                                            fontSize: '1.2rem',
                                            fontWeight: '900',
                                            color: isUpcoming ? '#ffaa00' : '#2ecc71',
                                            textTransform: 'uppercase'
                                        }}>
                                            {isUpcoming ? 'Скоро' : 'Доступен'}
                                        </span>
                                    </div>
                                </div>

                                <div className="markdown-content" style={{
                                    fontSize: '1.6rem',
                                    color: 'rgba(255,255,255,0.75)',
                                    lineHeight: '1.6',
                                    maxHeight: '240px',
                                    overflow: 'hidden'
                                }}>
                                    {badge.description ? (
                                        <ReactMarkdown>{badge.description}</ReactMarkdown>
                                    ) : (
                                        <p style={{ fontStyle: 'italic', opacity: 0.5 }}>Описание способа получения уточняется...</p>
                                    )}
                                </div>

                                <div style={{
                                    display: 'flex',
                                    gap: '4rem',
                                    marginTop: '1.5rem',
                                    padding: '2rem 2.5rem',
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '28px',
                                    border: '1px solid rgba(255,255,255,0.08)'
                                }}>
                                    {badge.availability?.start && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                            <div style={{ color: '#9146ff', display: 'flex' }}><Clock size={36} /></div>
                                            <div>
                                                <div style={{ fontSize: '1.1rem', color: '#666', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '0.05em' }}>Начало</div>
                                                <div style={{ fontSize: '1.6rem', color: '#eee', fontWeight: '800' }}>
                                                    {new Date(badge.availability.start).toLocaleDateString()} {new Date(badge.availability.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {badge.availability?.end && badge.availability.end !== Infinity && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                            <div style={{ color: '#ff6b6b', display: 'flex' }}><Clock size={36} /></div>
                                            <div>
                                                <div style={{ fontSize: '1.1rem', color: '#666', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '0.05em' }}>Конец</div>
                                                <div style={{ fontSize: '1.6rem', color: '#eee', fontWeight: '800' }}>
                                                    {new Date(badge.availability.end).toLocaleDateString()} {new Date(badge.availability.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default OverlayPage;
