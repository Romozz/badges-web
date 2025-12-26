import React from 'react';
import {
    Trophy, Zap, Moon, Sun, Clock, CreditCard, Heart, Compass, Users, User, Star, Send, Hash, Award, Film, Activity, Calendar, Fingerprint
} from 'lucide-react';

const formatTime = (minutes) => {
    if (!minutes) return '0 мин';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h} ч ${m > 0 ? `${m} мин` : ''}`;
    return `${m} мин`;
};

const ShareCard = React.forwardRef(({ data }, ref) => {
    if (!data) return null;

    return (
        <div ref={ref} style={{
            width: '1080px',
            height: '1350px', // 4:5 aspect ratio
            background: '#0f172a',
            position: 'absolute',
            top: 0,
            left: '-2000px',
            display: 'flex',
            flexDirection: 'column',
            padding: '40px', // Updated padding
            boxSizing: 'border-box',
            fontFamily: 'Inter, sans-serif',
            color: 'white',
            overflow: 'hidden'
        }}>
            {/* Background Gradients */}
            <div style={{ position: 'absolute', top: '-10%', left: '-20%', width: '80%', height: '50%', background: 'radial-gradient(circle, rgba(147, 51, 234, 0.3) 0%, transparent 70%)', filter: 'blur(80px)' }}></div>
            <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '70%', height: '60%', background: 'radial-gradient(circle, rgba(79, 70, 229, 0.3) 0%, transparent 70%)', filter: 'blur(80px)' }}></div>

            {/* Header with User Info */}
            <div style={{ marginBottom: '16px', position: 'relative', zIndex: 10, textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', padding: '8px 20px', background: 'rgba(255,255,255,0.05)', borderRadius: '100px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <Zap size={20} color="#a78bfa" fill="#a78bfa" />
                    <span style={{ fontSize: '16px', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase' }}>Twitch Badges Recap 2025</span>
                </div>

                {/* Compact User Header */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontSize: '64px', fontWeight: '900', lineHeight: 1, color: data.visuals.user.color }}>{data.visuals.user.displayName}</div>
                    <div style={{ fontSize: '48px', fontWeight: '900', lineHeight: 1, color: 'white' }}>Мои Итоги Года</div>
                </div>
            </div>

            {/* Main Content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', zIndex: 10 }}>

                {/* Global Rank & Total Stats Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '16px' }}>
                    <div style={{ padding: '12px 20px', background: 'rgba(17, 24, 39, 0.6)', borderRadius: '24px', border: '1px solid rgba(147, 51, 234, 0.3)', display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
                        <div style={{ background: 'rgba(147, 51, 234, 0.2)', padding: '12px', borderRadius: '16px' }}>
                            <Hash size={32} color="#a78bfa" />
                        </div>
                        <div>
                            <div style={{ fontSize: '18px', color: '#a78bfa', textTransform: 'uppercase', marginBottom: '2px', fontWeight: 'bold' }}>Ранг</div>
                            <div style={{ fontSize: '52px', fontWeight: '900', lineHeight: 1.1 }}>#{data.social.rank}</div>
                            <div style={{ fontSize: '14px', color: '#9ca3af' }}>Топ {100 - data.social.percentile}%</div>
                        </div>
                    </div>
                    <div style={{ padding: '12px 20px', background: 'linear-gradient(135deg, #4f46e5 0%, #9333ea 100%)', borderRadius: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: '220px' }}>
                        <div style={{ fontSize: '18px', color: 'white', textTransform: 'uppercase', marginBottom: '2px', fontWeight: 'bold', opacity: 0.9 }}>Всего значков</div>
                        <div style={{ fontSize: '56px', fontWeight: '900', color: 'white', lineHeight: 1.1 }}>{data.stats.total}</div>
                    </div>
                </div>

                {/* Archetype & Streak Row - NEW */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ padding: '20px', background: 'rgba(147, 51, 234, 0.1)', borderRadius: '24px', border: '1px solid rgba(147, 51, 234, 0.3)', display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ background: 'rgba(147, 51, 234, 0.2)', padding: '16px', borderRadius: '16px' }}>
                            <Trophy size={32} color="#c084fc" />
                        </div>
                        <div>
                            <div style={{ fontSize: '14px', color: '#c084fc', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 'bold' }}>Ранг коллекционера</div>
                            <div style={{ fontSize: '24px', fontWeight: '900', lineHeight: '1.2' }}>{data.stats.collectorLevel}</div>
                            <div style={{ fontSize: '11px', color: '#d8b4fe', marginTop: '4px', lineHeight: '1.2', opacity: 0.9 }}>{data.stats.collectorDesc}</div>
                        </div>
                    </div>
                    <div style={{ padding: '20px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '24px', border: '1px solid rgba(245, 158, 11, 0.3)', display: 'flex', alignItems: 'center', gap: '20px', gridColumn: 'span 1' }}>
                        <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Fingerprint size={32} color="#fbbf24" strokeWidth={2} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '14px', color: '#fbbf24', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 'bold' }}>Твой Архетип</div>
                            <div style={{ fontSize: '24px', fontWeight: '900', color: 'white', lineHeight: '1.2' }}>{data.stats.archetype}</div>
                            {data.stats.archetypeDesc && (
                                <div style={{ fontSize: '12px', color: '#e5e7eb', marginTop: '6px', lineHeight: '1.4', opacity: 0.9, fontStyle: 'italic' }}>
                                    "{data.stats.archetypeDesc}"
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Rarity & Breakdown Grid - REDESIGNED */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.6fr', gap: '16px' }}>
                    <div style={{ background: '#111827', borderRadius: '24px', padding: '20px', border: '1px solid #1f2937' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                            <Star size={18} color="#fbbf24" fill="#fbbf24" />
                            <div style={{ fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase', color: '#fbbf24', letterSpacing: '1px' }}>Редкость значков</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {[
                                { label: 'Легендарные', color: '#f59e0b', count: data.highlights.mosaic.filter(b => b.user_count < 1000).length, range: '< 1к' },
                                { label: 'Эпические', color: '#a78bfa', count: data.highlights.mosaic.filter(b => b.user_count >= 1000 && b.user_count < 10000).length, range: '1к - 10к' },
                                { label: 'Редкие', color: '#3b82f6', count: data.highlights.mosaic.filter(b => b.user_count >= 10000 && b.user_count < 50000).length, range: '10к - 50к' },
                                { label: 'Обычные', color: '#9ca3af', count: data.highlights.mosaic.filter(b => b.user_count >= 50000).length, range: '> 50к' }
                            ].map((tier, i) => {
                                const percent = (tier.count / data.stats.total) * 100;
                                return (
                                    <div key={i}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: tier.color }}></div>
                                                <div style={{ fontSize: '14px', color: 'white', fontWeight: 'bold' }}>{tier.label}</div>
                                                <div style={{ fontSize: '11px', color: '#4b5563', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>{tier.range}</div>
                                            </div>
                                            <div style={{ fontSize: '16px', fontWeight: '900', color: 'white' }}>{tier.count}</div>
                                        </div>
                                        <div style={{ height: '6px', background: '#1f2937', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${Math.max(percent, 2)}%`, background: tier.color, borderRadius: '3px', opacity: tier.count > 0 ? 1 : 0.2 }}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div style={{ background: 'linear-gradient(135deg, #111827 0%, #1e1b4b 100%)', borderRadius: '24px', padding: '20px', border: '1px solid rgba(147, 51, 234, 0.2)', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{ fontSize: '16px', color: '#a78bfa', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '16px', textAlign: 'center' }}>Полнота коллекции</div>
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', marginBottom: '20px' }}>
                                <svg width="160" height="160" viewBox="0 0 160 160">
                                    <circle cx="80" cy="80" r="70" fill="none" stroke="#1f2937" strokeWidth="12" />
                                    <circle cx="80" cy="80" r="70" fill="none" stroke="#9333ea" strokeWidth="12" strokeDasharray={`${data.stats.completionistScore * 4.4} 440`} transform="rotate(-90 80 80)" strokeLinecap="round" />
                                </svg>
                                <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{ fontSize: '36px', fontWeight: '900', color: 'white' }}>{data.stats.completionistScore}%</div>
                                    <div style={{ fontSize: '10px', color: '#a78bfa', fontWeight: 'bold' }}>ПОЛНОТА</div>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div style={{ background: 'rgba(52, 211, 153, 0.1)', padding: '10px', borderRadius: '12px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '10px', color: '#34d399', textTransform: 'uppercase', marginBottom: '2px' }}>Бесплатные</div>
                                    <div style={{ fontSize: '18px', fontWeight: '900', color: 'white' }}>{data.stats.free}</div>
                                </div>
                                <div style={{ background: 'rgba(147, 51, 234, 0.1)', padding: '10px', borderRadius: '12px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '10px', color: '#a78bfa', textTransform: 'uppercase', marginBottom: '2px' }}>Платные</div>
                                    <div style={{ fontSize: '18px', fontWeight: '900', color: 'white' }}>{data.stats.paid}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Secondary Stats Row - 3 COLUMNS */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    <div style={{ background: '#111827', borderRadius: '24px', padding: '16px', border: '1px solid #1f2937', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ec4899' }}>
                            <CreditCard size={14} />
                            <div style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold' }}>Потрачено</div>
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: '900', color: 'white' }}>{data.stats.financials.totalSpent}{data.stats.financials.currency}</div>
                    </div>
                    <div style={{ background: '#111827', borderRadius: '24px', padding: '16px', border: '1px solid #1f2937', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399' }}>
                            <Clock size={14} />
                            <div style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold' }}>Время</div>
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: '900', color: 'white' }}>{formatTime(data.stats.watchTime)}</div>
                    </div>
                    <div style={{ background: '#111827', borderRadius: '24px', padding: '16px', border: '1px solid #1f2937', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a78bfa' }}>
                            <Calendar size={14} />
                            <div style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold' }}>Лучший месяц по значкам</div>
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: '900', color: 'white' }}>{data.visuals.legendaryMonth}</div>
                    </div>
                </div>

                {/* Highlights Row (Rarest, Popular, First) - WITH DESCRIPTIONS */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    {data.highlights.rarest && (
                        <div style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(17, 24, 39, 0.6) 100%)', borderRadius: '24px', padding: '20px', border: '1px solid rgba(245, 158, 11, 0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', textTransform: 'uppercase', marginBottom: '16px', fontWeight: 'bold', letterSpacing: '1px' }}>
                                <Award size={16} />
                                <div style={{ fontSize: '14px' }}>Главный трофей</div>
                            </div>
                            <img src={data.highlights.rarest.url} style={{ width: '100px', height: '100px', marginBottom: '16px', filter: 'drop-shadow(0 0 15px rgba(245, 158, 11, 0.4))' }} alt="" />
                            <div style={{ fontSize: '20px', fontWeight: '900', color: 'white', marginBottom: '8px', lineHeight: '1.2' }}>{data.highlights.rarest.name}</div>
                            <p style={{ fontSize: '13px', color: '#9ca3af', lineHeight: '1.4', margin: 0 }}>Самый редкий и ценный экземпляр в твоей коллекции 2025.</p>
                        </div>
                    )}

                    {data.highlights.popular && (
                        <div style={{ background: 'rgba(17, 24, 39, 0.6)', borderRadius: '24px', padding: '20px', border: '1px solid rgba(59, 130, 246, 0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6', textTransform: 'uppercase', marginBottom: '16px', fontWeight: 'bold', letterSpacing: '1px' }}>
                                <Activity size={16} />
                                <div style={{ fontSize: '14px' }}>Хит года</div>
                            </div>
                            <img src={data.highlights.popular.url} style={{ width: '90px', height: '90px', marginBottom: '16px', filter: 'drop-shadow(0 0 15px rgba(59, 130, 246, 0.2))' }} alt="" />
                            <div style={{ fontSize: '20px', fontWeight: '900', color: 'white', marginBottom: '8px', lineHeight: '1.2' }}>{data.highlights.popular.name}</div>
                            <p style={{ fontSize: '13px', color: '#9ca3af', lineHeight: '1.4', margin: 0 }}>Этот значок стал настоящим хитом сезона и есть у многих.</p>
                        </div>
                    )}

                    {data.highlights.first && (
                        <div style={{ background: 'rgba(17, 24, 39, 0.6)', borderRadius: '24px', padding: '20px', border: '1px solid rgba(147, 51, 234, 0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a78bfa', textTransform: 'uppercase', marginBottom: '16px', fontWeight: 'bold', letterSpacing: '1px' }}>
                                <Compass size={16} />
                                <div style={{ fontSize: '14px' }}>Первый шаг</div>
                            </div>
                            <img src={data.highlights.first.url} style={{ width: '90px', height: '90px', marginBottom: '16px', filter: 'drop-shadow(0 0 15px rgba(147, 51, 234, 0.2))' }} alt="" />
                            <div style={{ fontSize: '20px', fontWeight: '900', color: 'white', marginBottom: '8px', lineHeight: '1.2' }}>{data.highlights.first.name}</div>
                            <p style={{ fontSize: '13px', color: '#9ca3af', lineHeight: '1.4', margin: 0 }}>С этого значка началось твое приключение в этом году.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer - REDESIGNED */}
            <div style={{ marginTop: 'auto', textAlign: 'center', borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', background: 'rgba(36, 161, 222, 0.05)', padding: '16px 32px', borderRadius: '20px', border: '1px solid rgba(36, 161, 222, 0.2)', maxWidth: '900px' }}>
                    <div style={{ background: '#24A1DE', padding: '12px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Send size={28} color="white" fill="white" />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2px' }}>
                            <span style={{ fontSize: '20px', fontWeight: '900', color: 'white' }}>@twitchbadges</span>
                            <div style={{ background: '#24A1DE', padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase' }}>Telegram</div>
                        </div>
                        <div style={{ fontSize: '14px', color: '#9ca3af', fontWeight: '500', lineHeight: '1.4' }}>
                            Twitch Badges — ваш лучший источник новинок о значках на Twitch!
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default ShareCard;
