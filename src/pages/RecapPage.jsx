import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Trophy, Star, Clock, CreditCard,
    ChevronRight, Award, Compass, Heart, Film, Gamepad2, Calendar,
    MapPin, Users, Zap, Hash, Moon, Sun, ArrowRight, User, Download, ImageIcon, Fingerprint, Send
} from 'lucide-react';
import html2canvas from 'html2canvas';

import ShareCard from '../components/ShareCard';

const formatTime = (minutes) => {
    if (!minutes) return '0 мин';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h} ч ${m > 0 ? `${m} мин` : ''}`;
    return `${m} мин`;
};



const RecapPage = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const shareCardRef = React.useRef(null);

    const handleShare = async () => {
        setIsGenerating(true);
        try {
            if (shareCardRef.current) {
                const canvas = await html2canvas(shareCardRef.current, {
                    scale: 2, // High resolution
                    backgroundColor: '#0f172a',
                    useCORS: true // Attempt to handle cross-origin images
                });

                canvas.toBlob((blob) => {
                    if (!blob) {
                        alert("Не удалось создать изображение.");
                        setIsGenerating(false);
                        return;
                    }

                    const url = URL.createObjectURL(blob);
                    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

                    if (isMobile) {
                        setPreviewUrl(url);
                    } else {
                        const link = document.createElement('a');
                        link.download = `badges-recap-2025-${new Date().getTime()}.png`;
                        link.href = url;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                    }
                    setIsGenerating(false);
                }, 'image/png');
            }
        } catch (err) {
            console.error("Failed to generate image", err);
            alert("Не удалось создать изображение. Попробуйте скриншот.");
            setIsGenerating(false);
        }
    };

    const handleClosePreview = () => {
        setPreviewUrl(null);
    };

    useEffect(() => {
        fetch('/api/recap/2025')
            .then(res => res.json())
            .then(res => {
                if (res.error) throw new Error(res.error);
                setData(res);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError(err.message);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="loader"></div>
            </div>
        );
    }

    if (error === 'Unauthorized') {
        return (
            <div style={{
                minHeight: '80vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
            }}>
                <div style={{
                    background: '#161618',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '24px',
                    padding: '48px',
                    maxWidth: '480px',
                    width: '100%',
                    textAlign: 'center',
                    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* Background decorative gradient */}
                    <div style={{
                        position: 'absolute',
                        top: '-50%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '100%',
                        height: '100%',
                        background: 'radial-gradient(circle, rgba(145, 70, 255, 0.15) 0%, rgba(0,0,0,0) 70%)',
                        zIndex: 0,
                        pointerEvents: 'none'
                    }} />

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '24px',
                            background: 'rgba(30, 30, 35, 0.5)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px',
                            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)'
                        }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, rgba(145, 70, 255, 0.2), rgba(145, 70, 255, 0.05))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#9146ff'
                            }}>
                                <Zap size={28} style={{ filter: 'drop-shadow(0 0 8px rgba(145, 70, 255, 0.5))' }} />
                            </div>
                        </div>

                        <h2 style={{
                            fontSize: '28px',
                            fontWeight: '800',
                            color: 'white',
                            marginBottom: '16px',
                            letterSpacing: '-0.5px'
                        }}>
                            Войдите для просмотра
                        </h2>

                        <p style={{
                            color: 'rgba(255, 255, 255, 0.6)',
                            fontSize: '16px',
                            lineHeight: '1.6',
                            marginBottom: '32px'
                        }}>
                            Чтобы увидеть свою уникальную статистику значков за 2025 год, необходимо авторизоваться.
                        </p>

                        <a href="/auth/twitch" style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            background: '#9146ff',
                            color: 'white',
                            padding: '16px 32px',
                            borderRadius: '12px',
                            textDecoration: 'none',
                            fontWeight: '600',
                            fontSize: '16px',
                            transition: 'all 0.2s ease',
                            border: '1px solid rgba(255,255,255,0.1)',
                            boxShadow: '0 4px 12px rgba(145, 70, 255, 0.3)'
                        }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.background = '#7c3aed';
                                e.currentTarget.style.boxShadow = '0 8px 20px rgba(145, 70, 255, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.background = '#9146ff';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(145, 70, 255, 0.3)';
                            }}>
                            Войти через Twitch
                        </a>
                    </div>
                </div>
            </div>
        );
    }


    if (error) {
        return (
            <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '20px' }}>
                <h2 style={{ color: '#ef4444' }}>Ошибка загрузки итогов</h2>
                <p style={{ color: '#9ca3af' }}>{error}</p>
            </div>
        );
    }

    if (!data || !data.hasData) {
        return (
            <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '20px' }}>
                <div style={{ background: 'rgba(147, 51, 234, 0.1)', padding: '24px', borderRadius: '50%', marginBottom: '24px' }}>
                    <Star size={48} color="#9333ea" />
                </div>
                <h2>Итоги 2025 года пока не готовы</h2>
                <p style={{ color: '#9ca3af', maxWidth: '400px', marginTop: '12px' }}>
                    Похоже, вы еще не собрали ни одного значка, вышедшего в 2025 году.
                    Продолжайте коллекционировать, и ваши итоги обязательно появятся!
                </p>
                <a href="/" style={{ marginTop: '24px', padding: '12px 24px', background: '#9333ea', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: '600' }}>
                    Найти новые значки
                </a>
            </div>
        );
    }



    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', color: '#e5e7eb' }}>
            {/* Hero Section */}
            <div style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
                borderRadius: '32px',
                padding: '40px 20px',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                marginBottom: '32px',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                {/* Decorative Elements */}
                <div style={{ position: 'absolute', top: '-100px', left: '-100px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(147, 51, 234, 0.15) 0%, transparent 70%)', borderRadius: '50%' }}></div>
                <div style={{ position: 'absolute', bottom: '-150px', right: '-150px', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(79, 70, 229, 0.15) 0%, transparent 70%)', borderRadius: '50%' }}></div>

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
                        {/* Badge History Tag */}
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: '100px', color: '#a78bfa', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px' }}>
                            <Zap size={14} /> Твоя история значков
                        </div>

                        {/* Compact Telegram Banner */}
                        <a href="https://t.me/twitchbadges" target="_blank" rel="noopener noreferrer" style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '10px',
                            background: 'rgba(36, 161, 222, 0.1)',
                            padding: '6px 16px',
                            borderRadius: '100px',
                            border: '1px solid rgba(36, 161, 222, 0.3)',
                            textDecoration: 'none',
                            transition: 'all 0.2s ease'
                        }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(36, 161, 222, 0.15)';
                                e.currentTarget.style.borderColor = 'rgba(36, 161, 222, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(36, 161, 222, 0.1)';
                                e.currentTarget.style.borderColor = 'rgba(36, 161, 222, 0.3)';
                            }}>
                            <Send size={14} color="#24A1DE" fill="#24A1DE" />
                            <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'white' }}>@twitchbadges</span>
                        </a>
                    </div>

                    <h1 style={{ fontSize: 'clamp(32px, 6vw, 64px)', fontWeight: '950', color: 'white', marginBottom: '16px', letterSpacing: '-2px', lineHeight: 1 }}>
                        Твои итоги <span style={{ background: 'linear-gradient(to right, #a78bfa, #c084fc, #9333ea)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>2025</span>
                    </h1>

                    <p style={{ color: '#d1d5db', fontSize: '16px', maxWidth: '800px', margin: '0 auto 24px', lineHeight: '1.6', fontWeight: '500' }}>
                        Год, когда твоя коллекция превратилась в легенду. Твои действия на Twitch в 2025 году оставили уникальный след. Вспомни каждое мгновение своего пути и узнай, какое место ты занимаешь среди миллионов других коллекционеров.
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '40px' }}>
                        <div style={{ padding: '12px 24px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                            <Trophy size={20} color="#fbbf24" />
                            <div>
                                <div style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 'bold', textAlign: 'left' }}>Ранг коллекционера</div>
                                <div style={{ color: 'white', fontWeight: '900', fontSize: '16px' }}>{data.stats.collectorLevel}</div>
                            </div>
                        </div>
                        <div style={{ padding: '12px 24px', background: 'rgba(147, 51, 234, 0.1)', border: '1px solid rgba(147, 51, 234, 0.3)', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 8px 32px rgba(147, 51, 234, 0.2)' }}>
                            <Star size={20} color="#c084fc" />
                            <div>
                                <div style={{ fontSize: '10px', color: '#d8b4fe', textTransform: 'uppercase', fontWeight: 'bold', textAlign: 'left' }}>Твой архетип</div>
                                <div style={{ color: 'white', fontWeight: '900', fontSize: '16px' }}>{data.stats.archetype}</div>
                            </div>
                        </div>
                    </div>

                    {data.stats.archetypeDesc && (
                        <div style={{ maxWidth: '600px', margin: '0 auto', background: 'rgba(17, 24, 39, 0.8)', padding: '24px 32px', borderRadius: '24px', borderLeft: '6px solid #9333ea', backdropFilter: 'blur(10px)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
                            <p style={{ color: '#e5e7eb', fontSize: '15px', fontStyle: 'italic', lineHeight: '1.6', textAlign: 'left' }}>
                                "{data.stats.archetypeDesc}"
                            </p>
                            <p style={{ color: '#6b7280', fontSize: '12px', marginTop: '12px', textAlign: 'left', fontWeight: 'bold' }}>
                                * Этот архетип определен на основе твоих предпочтений в 2025 году.
                            </p>
                        </div>
                    )}

                    {/* Download Button Premium Design */}
                    <div style={{ marginTop: '40px' }}>
                        <button
                            onClick={handleShare}
                            disabled={isGenerating}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '12px',
                                background: 'white',
                                color: '#0f172a',
                                border: 'none',
                                padding: '14px 32px',
                                borderRadius: '14px',
                                fontSize: '16px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                opacity: isGenerating ? 0.7 : 1
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#f1f5f9';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'white';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            {isGenerating ? (
                                <>
                                    <div className="loader" style={{ width: '18px', height: '18px', border: '2px solid #0f172a', borderTop: '2px solid transparent' }}></div>
                                    <span style={{ marginLeft: '10px' }}>Создание...</span>
                                </>
                            ) : (
                                <>
                                    <Download size={18} strokeWidth={2.5} />
                                    <span>Скачать итоги</span>
                                </>
                            )}
                        </button>
                        <p style={{ marginTop: '12px', color: 'rgba(255, 255, 255, 0.4)', fontSize: '12px', fontWeight: '500' }}>
                            Карточка для соцсетей • PNG
                        </p>
                    </div>
                </div>
            </div>

            {/* Core Stats Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '24px', padding: '24px', textAlign: 'center', transition: 'transform 0.2s', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
                        <div style={{ background: 'rgba(255, 255, 255, 0.05)', width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Hash size={14} color="#9ca3af" />
                        </div>
                        <div style={{ color: '#9ca3af', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Всего значков</div>
                    </div>
                    <div style={{ fontSize: '36px', fontWeight: '900', color: 'white', letterSpacing: '-1px' }}>{data.stats.total}</div>
                </div>

                <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '24px', padding: '24px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
                        <div style={{ background: 'rgba(52, 211, 153, 0.1)', width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Star size={14} color="#34d399" />
                        </div>
                        <div style={{ color: '#34d399', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Бесплатные</div>
                    </div>
                    <div style={{ fontSize: '36px', fontWeight: '900', color: '#34d399', letterSpacing: '-1px' }}>{data.stats.free}</div>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>Получены даром</div>
                </div>

                <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '24px', padding: '24px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
                        <div style={{ background: 'rgba(147, 51, 234, 0.1)', width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Zap size={14} color="#9333ea" />
                        </div>
                        <div style={{ color: '#9333ea', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Платные</div>
                    </div>
                    <div style={{ fontSize: '36px', fontWeight: '900', color: '#9333ea', letterSpacing: '-1px' }}>{data.stats.paid}</div>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>Куплено платных подписок</div>
                </div>

                <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '24px', padding: '24px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
                        <div style={{ background: 'rgba(236, 72, 153, 0.1)', width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CreditCard size={14} color="#ec4899" />
                        </div>
                        <div style={{ color: '#ec4899', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Потрачено</div>
                    </div>
                    <div style={{ fontSize: '30px', fontWeight: '900', color: 'white', letterSpacing: '-0.5px' }}>
                        {data.stats.financials.totalSpent} <span style={{ fontSize: '16px', color: '#6b7280', fontWeight: '700' }}>{data.stats.financials.currency}</span>
                    </div>
                </div>
            </div>



            {/* Charity Impact Highlight */}
            {data.stats.categories.charity > 0 && (
                <div style={{ marginBottom: '32px', background: 'linear-gradient(135deg, #111827 0%, #064e3b 100%)', border: '1px solid #065f46', borderRadius: '32px', padding: '40px', display: 'flex', alignItems: 'center', gap: '40px', flexWrap: 'wrap' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', width: '80px', height: '80px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Heart size={40} color="#10b981" fill="#10b981" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '24px', fontWeight: '800', color: 'white', marginBottom: '12px' }}>Твой вклад в благотворительность</h3>
                        <p style={{ color: '#a7f3d0', fontSize: '16px', lineHeight: '1.6', opacity: 0.9 }}>
                            В 2025 году ты собрал <span style={{ fontWeight: '900', color: 'white' }}>{data.stats.categories.charity}</span> благотворительных значков.
                            Твое участие помогло привлечь внимание к важным инициативам вместе с <span style={{ fontWeight: '900', color: 'white' }}>{data.visuals.totalCharityHeroes.toLocaleString()}</span> другими героями сообщества.
                            Это не просто пиксели — это реальная помощь и поддержка, за которую Twitch и нуждающиеся тебе благодарны!
                        </p>
                    </div>
                </div>
            )}

            {/* Journey Timeline */}
            <div style={{ marginBottom: '32px', background: 'rgba(17, 24, 39, 0.4)', borderRadius: '32px', padding: '40px', border: '1px solid #1f2937' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ background: 'rgba(147, 51, 234, 0.1)', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Compass size={24} color="#a78bfa" />
                    </div>
                    <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'white' }}>Твоя история 2025 года</h3>
                </div>
                <p style={{ color: '#9ca3af', fontSize: '15px', marginBottom: '32px', maxWidth: '800px', lineHeight: '1.6' }}>
                    Каждая коллекция начинается с первого шага. Давай вспомним ключевые моменты твоего пути: от самого первого обретенного значка до редчайших трофеев, которые теперь украшают твой профиль. Это была славная охота!
                </p>
                <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', overflowX: 'auto', paddingBottom: '20px' }}>
                    <div style={{ position: 'absolute', top: '32px', left: '40px', right: '40px', height: '2px', background: 'linear-gradient(90deg, #312e81, #9333ea, #312e81)', zIndex: 0 }}></div>
                    {data.highlights.milestones.map((m, i) => (
                        <div key={i} style={{ minWidth: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                            <div style={{
                                background: '#111827',
                                border: '3px solid #312e81',
                                borderRadius: '50%',
                                width: '64px',
                                height: '64px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '16px',
                                boxShadow: '0 0 15px rgba(147, 51, 234, 0.2)',
                                background: 'radial-gradient(circle at 30% 30%, #1f2937, #111827)'
                            }}>
                                <img src={m.url} style={{ width: '32px', height: '32px' }} alt="" />
                            </div>
                            <div style={{ color: '#a78bfa', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '6px', tracking: '0.1em' }}>{m.label}</div>
                            <div style={{ color: 'white', fontSize: '15px', fontWeight: '800', textAlign: 'center' }}>{m.name}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Watch Time and Status Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '32px', padding: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                        <div style={{ background: 'rgba(245, 158, 11, 0.1)', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Clock size={24} color="#f59e0b" />
                        </div>
                        <div style={{ fontSize: '14px', color: '#9ca3af', fontWeight: 'bold', textTransform: 'uppercase' }}>Время на Twitch</div>
                    </div>
                    <div style={{ fontSize: '42px', fontWeight: '900', color: 'white', marginBottom: '8px' }}>{formatTime(data.stats.watchTime)}</div>
                    <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.5' }}>
                        Именно столько времени ты провел в ожидании и фарме бесплатных значков. Каждая минута стоила того, ведь теперь у тебя есть коллекция, которой можно гордиться!
                    </p>
                </div>

                <div style={{ background: 'linear-gradient(135deg, #111827 0%, #1e1b4b 100%)', border: '1px solid #312e81', borderRadius: '32px', padding: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                        <div style={{ background: 'rgba(147, 51, 234, 0.1)', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Award size={24} color="#a78bfa" />
                        </div>
                        <div style={{ fontSize: '14px', color: '#a78bfa', fontWeight: 'bold', textTransform: 'uppercase' }}>Твой статус</div>
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: '900', color: 'white', marginBottom: '8px' }}>{data.stats.collectorLevel}</div>
                    <div style={{ fontSize: '14px', color: '#a78bfa', fontWeight: 'bold', marginBottom: '8px' }}>Ранг: {data.stats.collectorTier}</div>
                    <p style={{ fontSize: '14px', color: '#9ca3af', lineHeight: '1.5' }}>
                        {data.stats.collectorDesc}
                    </p>
                </div>
            </div>

            {/* Highlights and Completionist Row */}
            <div style={{ marginBottom: '40px' }}>
                {/* Completionist Card */}
                <div style={{
                    background: 'rgba(17, 24, 39, 0.4)',
                    borderRadius: '32px',
                    padding: '40px',
                    border: '1px solid #1f2937',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '40px',
                    flexWrap: 'wrap'
                }}>
                    <div style={{ position: 'relative', width: '120px', height: '120px', flexShrink: 0 }}>
                        <svg width="120" height="120" viewBox="0 0 120 120">
                            <circle cx="60" cy="60" r="54" fill="none" stroke="#1f2937" strokeWidth="10" />
                            <circle cx="60" cy="60" r="54" fill="none" stroke="#9333ea" strokeWidth="10"
                                strokeDasharray="339.29" strokeDashoffset={339.29 - (339.29 * data.stats.completionistScore / 100)}
                                strokeLinecap="round" />
                        </svg>
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '24px', fontWeight: '900', color: 'white' }}>
                            {data.stats.completionistScore}%
                        </div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '24px', fontWeight: '800', color: 'white', marginBottom: '12px' }}>Полнота коллекции 2025</h4>
                        <p style={{ color: '#9ca3af', fontSize: '16px', lineHeight: '1.6', opacity: 0.9 }}>
                            Ты собрал <span style={{ color: 'white', fontWeight: '900' }}>{data.stats.completionistScore}%</span> от всех глобальных значков, выпущенных в 2025 году.
                            Это значит, что ты не просто случайный зритель, а настоящий архивариус истории Twitch, который держит руку на пульсе всех важных событий.
                        </p>
                    </div>
                </div>
            </div>

            {/* Advanced Stats Row: Unlucky Miss & Rarity Distribution */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                {/* Unlucky Miss */}
                {data.highlights.unluckyMiss && (
                    <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '32px', padding: '32px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(239, 68, 68, 0.1) 0%, transparent 70%)' }}></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                            <div style={{ background: 'rgba(239, 68, 68, 0.1)', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Compass size={24} color="#ef4444" />
                            </div>
                            <div style={{ fontSize: '14px', color: '#ef4444', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Упущенный шанс</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <img src={data.highlights.unluckyMiss.url} style={{ width: '64px', height: '64px', opacity: 0.6, filter: 'grayscale(1)' }} alt="" />
                            </div>
                            <div>
                                <div style={{ fontSize: '16px', fontWeight: '800', color: 'white' }}>{data.highlights.unluckyMiss.name}</div>
                                <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>Его получили {data.highlights.unluckyMiss.user_count.toLocaleString()} человек.</div>
                            </div>
                        </div>
                        <p style={{ marginTop: '20px', fontSize: '14px', color: '#9ca3af', lineHeight: '1.6' }}>
                            Этот значок был самым популярным среди тех, что не попали в твою коллекцию в 2025 году. Кажется, ты пропустил этот стрим или просто не успел на раздачу. В следующий раз будь начеку — редкие значки не ждут!
                        </p>
                    </div>
                )}

                {/* Rarity Status */}
                <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '32px', padding: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                        <div style={{ background: 'rgba(251, 191, 36, 0.1)', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Trophy size={24} color="#fbbf24" />
                        </div>
                        <div style={{ fontSize: '14px', color: '#fbbf24', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Редкость коллекции</div>
                    </div>
                    <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '24px', lineHeight: '1.4' }}>
                        Твоя полка в 2025 году состоит из значков разной степени ценности. Вот как распределяются твои значки по их глобальной редкости:
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {[
                            { label: 'Легендарные', color: '#f59e0b', count: data.highlights.mosaic.filter(b => b.user_count < 1000).length, desc: 'Менее 1000 экз.', total: data.stats.total },
                            { label: 'Эпические', color: '#a78bfa', count: data.highlights.mosaic.filter(b => b.user_count >= 1000 && b.user_count < 10000).length, desc: 'От 1к до 10к', total: data.stats.total },
                            { label: 'Редкие', color: '#3b82f6', count: data.highlights.mosaic.filter(b => b.user_count >= 10000 && b.user_count < 50000).length, desc: 'От 10к до 50к', total: data.stats.total },
                            { label: 'Обычные', color: '#9ca3af', count: data.highlights.mosaic.filter(b => b.user_count >= 50000).length, desc: 'Более 50к', total: data.stats.total }
                        ].map((tier, i) => {
                            const percent = (tier.count / tier.total) * 100;
                            return (
                                <div key={i}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: tier.color }}></div>
                                            <div style={{ fontSize: '14px', color: 'white', fontWeight: 'bold' }}>{tier.label}</div>
                                        </div>
                                        <div style={{ fontSize: '16px', fontWeight: '900', color: tier.color }}>{tier.count}</div>
                                    </div>
                                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${percent}%`, background: tier.color, borderRadius: '3px', transition: 'width 1s ease-out' }}></div>
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>{tier.desc}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Achievements Grid */}
            <div style={{ marginBottom: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ background: 'rgba(251, 191, 36, 0.1)', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trophy size={24} color="#fbbf24" />
                    </div>
                    <h3 style={{ fontSize: '20px', color: 'white', fontWeight: '800' }}>Важные вехи года</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                    {/* First Badge */}
                    <div className="recap-card" style={{ background: 'rgba(31, 41, 55, 0.4)', borderRadius: '20px', padding: '24px', border: '1px solid #1f2937', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '16px' }}>
                            <div style={{ background: 'rgba(156, 163, 175, 0.1)', width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Clock size={14} color="#9ca3af" />
                            </div>
                            <div style={{ color: '#9ca3af', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Первый в году</div>
                        </div>
                        {data.highlights.first ? (
                            <>
                                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px', marginBottom: '12px', display: 'inline-flex' }}>
                                    <img src={data.highlights.first.url} style={{ width: '48px', height: '48px' }} alt="" />
                                </div>
                                <div style={{ color: 'white', fontWeight: '700', fontSize: '14px' }}>{data.highlights.first.name}</div>
                                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '12px', lineHeight: '1.4' }}>С этого маленького шага началось твое грандиозное приключение в 2025 году. Помнишь этот момент?</p>
                            </>
                        ) : '—'}
                    </div>

                    {/* Rarest Badge */}
                    <div className="recap-card" style={{ background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.4) 0%, rgba(245, 158, 11, 0.05) 100%)', borderRadius: '20px', padding: '24px', border: '1px solid rgba(245, 158, 11, 0.2)', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '16px' }}>
                            <div style={{ background: 'rgba(245, 158, 11, 0.1)', width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Trophy size={14} color="#f59e0b" />
                            </div>
                            <div style={{ color: '#f59e0b', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Главный трофей</div>
                        </div>
                        {data.highlights.rarest ? (
                            <>
                                <div style={{ background: 'rgba(245, 158, 11, 0.1)', borderRadius: '16px', padding: '20px', marginBottom: '12px', display: 'inline-flex' }}>
                                    <img src={data.highlights.rarest.url} style={{ width: '48px', height: '48px', filter: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.3))' }} alt="" />
                                </div>
                                <div style={{ color: 'white', fontWeight: '700', fontSize: '14px' }}>{data.highlights.rarest.name}</div>
                                <div style={{ color: '#f59e0b', fontSize: '11px', marginTop: '4px', fontWeight: 'bold' }}>У {data.highlights.rarestCount.toLocaleString()} чел.</div>
                                <p style={{ fontSize: '12px', color: '#4b5563', marginTop: '12px', lineHeight: '1.4' }}>Самый редкий и ценный экземпляр в твоей коллекции. Настоящий предмет гордости!</p>
                            </>
                        ) : '—'}
                    </div>

                    {/* Legendary Month */}
                    <div className="recap-card" style={{ background: 'rgba(31, 41, 55, 0.4)', borderRadius: '20px', padding: '24px', border: '1px solid #1f2937', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '16px' }}>
                            <div style={{ background: 'rgba(147, 51, 234, 0.1)', width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Calendar size={14} color="#9333ea" />
                            </div>
                            <div style={{ color: '#9333ea', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Лучший месяц</div>
                        </div>
                        <div style={{ height: '88px', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'rgba(147, 51, 234, 0.05)', borderRadius: '16px', marginBottom: '12px' }}>
                            <div style={{ fontSize: '26px', fontWeight: '950', color: 'white' }}>{data.visuals.legendaryMonth}</div>
                        </div>
                        <div style={{ color: '#9ca3af', fontSize: '12px', fontWeight: 'bold' }}>Пик активности</div>
                        <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '12px', lineHeight: '1.4' }}>В этом месяце твоя страсть к коллекционированию достигла максимума. Это было легендарно!</p>
                    </div>

                    {/* Popular Badge */}
                    <div className="recap-card" style={{ background: 'rgba(31, 41, 55, 0.4)', borderRadius: '20px', padding: '24px', border: '1px solid #1f2937', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '16px' }}>
                            <div style={{ background: 'rgba(59, 130, 246, 0.1)', width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Zap size={14} color="#3b82f6" />
                            </div>
                            <div style={{ color: '#3b82f6', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Хит года</div>
                        </div>
                        {data.highlights.popular ? (
                            <>
                                <div style={{ background: 'rgba(59, 130, 246, 0.05)', borderRadius: '16px', padding: '20px', marginBottom: '12px', display: 'inline-flex' }}>
                                    <img src={data.highlights.popular.url} style={{ width: '48px', height: '48px' }} alt="" />
                                </div>
                                <div style={{ color: 'white', fontWeight: '700', fontSize: '14px' }}>{data.highlights.popular.name}</div>
                                <p style={{ fontSize: '12px', color: '#4b5563', marginTop: '12px', lineHeight: '1.4' }}>Этот значок стал настоящим хитом сезона. Его хотели все, но он достался именно тебе!</p>
                            </>
                        ) : '—'}
                    </div>

                    {/* Survivor */}
                    {data.highlights.survivorBadge && (
                        <div className="recap-card" style={{ background: 'linear-gradient(to bottom, rgba(220, 38, 38, 0.1), rgba(0,0,0,0))', borderRadius: '20px', padding: '24px', border: '1px solid rgba(220, 38, 38, 0.3)', position: 'relative', overflow: 'hidden', textAlign: 'center' }}>
                            <div style={{ position: 'absolute', top: '10px', right: '-25px', background: '#ef4444', color: 'white', fontSize: '9px', fontWeight: '900', padding: '2px 30px', transform: 'rotate(45deg)', textTransform: 'uppercase' }}>Лимитка</div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '16px' }}>
                                <div style={{ background: 'rgba(239, 68, 68, 0.1)', width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Zap size={14} color="#ef4444" />
                                </div>
                                <div style={{ color: '#ef4444', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Выживший</div>
                            </div>
                            <div style={{ background: 'rgba(220, 38, 38, 0.15)', borderRadius: '16px', padding: '20px', marginBottom: '12px', display: 'inline-flex' }}>
                                <img src={data.highlights.survivorBadge.url} style={{ width: '48px', height: '48px', filter: 'drop-shadow(0 0 8px rgba(220, 38, 38, 0.4))' }} alt="" />
                            </div>
                            <div style={{ color: 'white', fontWeight: '700', fontSize: '14px' }}>{data.highlights.survivorBadge.name}</div>
                            <div style={{ fontSize: '10px', color: '#ef4444', marginTop: '4px', fontWeight: 'bold' }}>Исчез мгновенно!</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Collection Breakdown Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '32px', padding: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                        <div style={{ background: 'rgba(52, 211, 153, 0.1)', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Hash size={24} color="#34d399" />
                        </div>
                        <div style={{ fontSize: '14px', color: '#34d399', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Состав коллекции</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', height: '12px', background: '#1f2937', borderRadius: '6px', overflow: 'hidden', marginBottom: '20px' }}>
                        <div style={{ width: `${(data.stats.free / data.stats.total) * 100}%`, background: '#34d399' }}></div>
                        <div style={{ width: `${(data.stats.paid / data.stats.total) * 100}%`, background: '#9333ea' }}></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 'bold' }}>Бесплатные</div>
                            <div style={{ fontSize: '20px', fontWeight: '900', color: '#34d399' }}>{data.stats.free}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 'bold' }}>Платные</div>
                            <div style={{ fontSize: '20px', fontWeight: '900', color: '#9333ea' }}>{data.stats.paid}</div>
                        </div>
                    </div>
                    <p style={{ marginTop: '20px', fontSize: '13px', color: '#6b7280', lineHeight: '1.4' }}>
                        Большую часть твоей коллекции составляют <span style={{ color: data.stats.free > data.stats.paid ? '#34d399' : '#a78bfa', fontWeight: 'bold' }}>{data.stats.free > data.stats.paid ? 'бесплатные' : 'платные'}</span> значки. Ты знаешь цену хорошему дропу!
                    </p>
                </div>

                <div style={{ background: 'linear-gradient(135deg, #111827 0%, #1e1b4b 100%)', border: '1px solid #312e81', borderRadius: '32px', padding: '32px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '80px', height: '80px', background: 'radial-gradient(circle, rgba(147, 51, 234, 0.1) 0%, transparent 70%)' }}></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                        <div style={{ background: 'rgba(167, 139, 250, 0.1)', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Fingerprint size={24} color="#a78bfa" />
                        </div>
                        <div style={{ fontSize: '14px', color: '#a78bfa', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Стиль коллекционирования</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '16px' }}>
                        <div style={{ background: 'rgba(147, 51, 234, 0.15)', borderRadius: '20px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Award size={32} color="#a78bfa" />
                        </div>
                        <div>
                            <div style={{ fontSize: '11px', color: '#a78bfa', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '1px' }}>Твой архетип</div>
                            <div style={{ fontSize: '24px', fontWeight: '900', color: 'white' }}>{data.stats.archetype}</div>
                        </div>
                    </div>
                    <p style={{ fontSize: '14px', color: '#9ca3af', lineHeight: '1.6', opacity: 0.9 }}>
                        {data.stats.archetypeDesc}
                    </p>
                </div>
            </div>

            {/* Dashboard Row 1: Mosaic & Categories */}
            {/* Dashboard Row 1: Mosaic & Categories */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '32px', padding: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                        <div style={{ background: 'rgba(147, 51, 234, 0.1)', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ImageIcon size={24} color="#a78bfa" />
                        </div>
                        <div style={{ fontSize: '14px', color: '#a78bfa', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Цифровая галерея</div>
                    </div>
                    <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
                        Перед тобой — визуальный отпечаток твоего года. Каждый из этих значков — это история, это эмоция, это твое время, проведенное в сообществе. Посмотри, как много ты достиг за этот год!
                    </p>
                    <div className="custom-scrollbar" style={{
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(48px, 1fr))', gap: '12px',
                        maxHeight: '300px', overflowY: 'auto', paddingRight: '12px'
                    }}>
                        {data.highlights.mosaic.map((b, i) => (
                            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '8px', border: '1px solid rgba(255,255,255,0.05)' }} title={b.name}>
                                <img src={b.url} style={{ width: '100%', height: 'auto' }} alt={b.name} />
                            </div>
                        ))}
                    </div>
                </div>
                <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '32px', padding: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                        <div style={{ background: 'rgba(52, 211, 153, 0.1)', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Hash size={24} color="#34d399" />
                        </div>
                        <div style={{ fontSize: '14px', color: '#34d399', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Любимые темы</div>
                    </div>
                    <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
                        Твои значки распределены по категориям, что позволяет увидеть, какой контент захватил твоё внимание в 2025 году больше всего.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        {[
                            { icon: <Zap size={20} color="#a78bfa" />, label: 'Клипы', val: data.stats.categories.clip, desc: 'За яркие моменты' },
                            { icon: <Trophy size={20} color="#f59e0b" />, label: 'Игры', val: data.stats.categories.game, desc: 'За киберспорт и новинки' },
                            { icon: <Compass size={20} color="#3b82f6" />, label: 'События', val: data.stats.categories.event, desc: 'За участие в движе' },
                            { icon: <Heart size={20} color="#ec4899" />, label: 'Благотворительность', val: data.stats.categories.charity, desc: 'За добрые дела' }
                        ].map((cat, i) => (
                            <div key={i} style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ marginBottom: '16px' }}>{cat.icon}</div>
                                <div style={{ fontSize: '24px', fontWeight: '900', color: 'white' }}>{cat.val}</div>
                                <div style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 'bold', textTransform: 'uppercase', marginTop: '4px' }}>{cat.label}</div>
                                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>{cat.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Dashboard Row 2: Social & Influence */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                {/* Social Ranking */}
                <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '32px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ background: 'rgba(147, 51, 234, 0.1)', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Users size={24} color="#a78bfa" />
                        </div>
                        <div style={{ fontSize: '14px', color: '#a78bfa', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Твое влияние</div>
                    </div>

                    <div style={{ padding: '24px', background: 'rgba(147, 51, 234, 0.05)', borderRadius: '24px', border: '1px solid rgba(147, 51, 234, 0.1)' }}>
                        <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '4px' }}>Твой ранг</div>
                        <div style={{ fontSize: '36px', fontWeight: '900', color: 'white' }}>#{data.social.rank}</div>
                        <div style={{ marginTop: '16px', height: '10px', background: '#1f2937', borderRadius: '5px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${data.social.percentile}%`, background: 'linear-gradient(90deg, #9333ea, #a78bfa)', borderRadius: '5px' }}></div>
                        </div>
                        <p style={{ marginTop: '12px', fontSize: '14px', color: '#a78bfa', fontWeight: 'bold' }}>
                            Ты собрал больше значков, чем {data.social.percentile}% участников!
                        </p>
                    </div>

                    {data.social.soulmate && (
                        <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px dashed #312e81' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#312e81', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <User size={24} color="#a78bfa" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Родственная душа</div>
                                    <div style={{ fontSize: '16px', fontWeight: '800', color: 'white' }}>{data.social.soulmate.display_name}</div>
                                </div>
                            </div>
                            <p style={{ fontSize: '13px', color: '#9ca3af', lineHeight: '1.4' }}>
                                У вас <span style={{ color: '#9333ea', fontWeight: 'bold' }}>{data.social.soulmate.overlap} общих</span> значков 2025 года. Кажется, вы смотрите одни и те же стримы!
                            </p>
                        </div>
                    )}
                </div>


                {/* Night Owl / Streak */}
                <div style={{ display: 'grid', gridTemplateRows: '1fr 1.5fr', gap: '20px' }}>
                    <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '32px', padding: '32px', display: 'flex', alignItems: 'center', gap: '24px', transition: 'box-shadow 0.3s', boxShadow: '0 4px 25px rgba(0,0,0,0.2)' }}>
                        <div style={{ background: 'rgba(245, 158, 11, 0.1)', width: '64px', height: '64px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 0 10px rgba(245, 158, 11, 0.1)' }}>
                            <Zap size={32} color="#f59e0b" fill="rgba(245, 158, 11, 0.3)" />
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Рекордная серия</div>
                            <div style={{ fontSize: '32px', fontWeight: '900', color: 'white' }}>{data.visuals.maxStreak} недель</div>
                            <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px', lineHeight: '1.4' }}>Твое постоянство впечатляет! Столько недель подряд ты был в центре событий и не пропустил ни одного важного значка.</p>
                        </div>
                    </div>
                    <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '32px', padding: '32px', boxShadow: '0 4px 25px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                            <div style={{ background: 'rgba(129, 140, 248, 0.14)', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {data.visuals.isNightOwl ? <Moon size={24} color="#818cf8" /> : <Sun size={24} color="#fbbf24" />}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ fontSize: '14px', color: '#9ca3af', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Твой биоритм</div>
                                <h3 style={{ fontSize: '20px', fontWeight: '900', color: 'white', marginTop: '2px' }}>
                                    {data.visuals.isNightOwl ? 'Ночная сова' : 'Ранняя пташка'}
                                </h3>
                            </div>
                        </div>
                        <p style={{ fontSize: '14px', color: '#9ca3af', lineHeight: '1.6', opacity: 0.9 }}>
                            {data.visuals.isNightOwl
                                ? 'Когда большинство спит, ты на посту. Твоя коллекция — результат ночных бдений и преданности любимым стримерам. Ты настоящий хранитель ночного эфира.'
                                : 'Ты всегда в первых рядах. Большинство твоих трофеев получены, пока день еще только начинается. Твоя энергия — залог успешного сбора самых свежих значков.'}
                        </p>
                        <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '12px', fontStyle: 'italic' }}>
                            * Определено по среднему времени твоей активности в 2025 году.
                        </p>
                    </div>
                </div>
            </div>

            {/* Final Row: Activity & Colors */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '32px', padding: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                        <div style={{ background: 'rgba(147, 51, 234, 0.1)', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Zap size={24} color="#a78bfa" />
                        </div>
                        <div style={{ fontSize: '14px', color: '#a78bfa', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Ритм года</div>
                    </div>
                    <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '20px', lineHeight: '1.5' }}>
                        График ниже показывает распределение полученных значков по месяцам. Это твой пульс активности — от зимних марафонов до летних фестивалей.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '100px' }}>
                        {data.visuals.monthlyCounts.map((count, i) => {
                            const months = ['Я', 'Ф', 'М', 'А', 'М', 'И', 'И', 'А', 'С', 'О', 'Н', 'Д'];
                            const max = Math.max(...data.visuals.monthlyCounts, 1);
                            const h = (count / max) * 100;
                            return (
                                <div key={i} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '100%', height: `${Math.max(h, 4)}%`, background: count > 0 ? '#9333ea' : '#1f2937', borderRadius: '4px', opacity: count > 0 ? 1 : 0.3 }}></div>
                                    <div style={{ fontSize: '10px', color: '#4b5563' }}>{months[i]}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '32px', padding: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                        <div style={{ background: 'rgba(52, 211, 153, 0.1)', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Calendar size={24} color="#34d399" />
                        </div>
                        <div style={{ fontSize: '14px', color: '#34d399', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Сезонные итоги</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                        {[
                            { l: 'Зима', v: data.visuals.seasonalCounts.winter, c: '#60a5fa' },
                            { l: 'Весна', v: data.visuals.seasonalCounts.spring, c: '#34d399' },
                            { l: 'Лето', v: data.visuals.seasonalCounts.summer, c: '#fbbf24' },
                            { l: 'Осень', v: data.visuals.seasonalCounts.autumn, c: '#f87171' }
                        ].map((s, i) => (
                            <div key={i} style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', textAlign: 'center' }}>
                                <div style={{ fontSize: '10px', color: '#6b7280' }}>{s.l}</div>
                                <div style={{ fontSize: '18px', fontWeight: '900', color: s.c }}>{s.v}</div>
                            </div>
                        ))}
                    </div>
                    <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.4' }}>Каждый сезон приносил новые испытания и уникальные трофеи в твою коллекцию.</p>
                </div>

                <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '32px', padding: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                        <div style={{ background: 'rgba(245, 158, 11, 0.1)', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Star size={24} color="#f59e0b" />
                        </div>
                        <div style={{ fontSize: '14px', color: '#f59e0b', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Палитра года</div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', height: '64px' }}>
                        {data.visuals.colors.map((c, i) => (
                            <div key={i} style={{ flex: 1, background: c, borderRadius: '14px', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.2)' }}></div>
                        ))}
                    </div>
                    <p style={{ marginTop: '16px', color: '#9ca3af', fontSize: '13px', lineHeight: '1.5' }}>
                        Цвета твоей коллекции рассказывают историю твоих предпочтений. Эта уникальная палитра — визуальное отражение твоего года на Twitch.
                    </p>
                </div>
            </div>

            {/* Future Outlook / Prediction Section */}
            <div style={{
                marginBottom: '60px',
                background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(17, 24, 39, 0.4) 100%)',
                borderRadius: '40px',
                padding: '48px',
                border: '1px solid rgba(147, 51, 234, 0.2)',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ position: 'absolute', top: '-100px', left: '-100px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(147, 51, 234, 0.1) 0%, transparent 70%)', zIndex: 0 }}></div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'inline-flex', padding: '12px 24px', background: 'rgba(147, 51, 234, 0.2)', borderRadius: '100px', color: '#c4b5fd', fontSize: '14px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '24px' }}>
                        Взгляд в будущее
                    </div>
                    <h2 style={{ fontSize: '32px', fontWeight: '900', color: 'white', marginBottom: '16px' }}>Твой сценарий на 2026 год</h2>
                    <div style={{ fontSize: '42px', fontWeight: '950', color: 'white', marginBottom: '20px', background: 'linear-gradient(to right, #a78bfa, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {data.stats.prediction}
                    </div>
                    <p style={{ color: '#9ca3af', fontSize: '17px', maxWidth: '700px', margin: '0 auto', lineHeight: '1.6' }}>
                        Твой путь в 2025 году подготовил отличную почву для новых свершений. Основываясь на твоей активности, мы предвидим именно такую роль для тебя в следующем году. Приготовься к новым значкам!
                    </p>
                </div>
            </div>

            {/* Fun Fact */}
            {data.visuals.funFact && (
                <div style={{ marginBottom: '60px', textAlign: 'center', padding: '0 20px' }}>
                    <div style={{ display: 'inline-block', padding: '12px 24px', background: 'rgba(255,255,255,0.05)', borderRadius: '50px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '14px', color: '#9ca3af' }}>
                        🎲 <span style={{ color: 'white', fontWeight: 'bold', marginLeft: '8px' }}>Фан-факт:</span> {data.visuals.funFact}
                    </div>
                </div>
            )}


            {/* Hidden Share Card for generating image */}
            <div style={{ position: 'absolute', top: '-10000px', left: '-10000px' }}>
                <ShareCard ref={shareCardRef} data={data} />
            </div>


            {/* Mobile Image Preview Modal */}
            {previewUrl && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.9)', zIndex: 1000,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '20px'
                }} onClick={handleClosePreview}>
                    <div style={{
                        background: '#1f2937', padding: '20px', borderRadius: '20px',
                        maxWidth: '100%', maxHeight: '90%', overflow: 'auto',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', textAlign: 'center' }}>
                            Зажмите изображение, чтобы сохранить
                        </div>
                        <img src={previewUrl} alt="Recap 2025" style={{ maxWidth: '100%', borderRadius: '12px', border: '1px solid #374151' }} />
                        <button
                            onClick={handleClosePreview}
                            style={{
                                padding: '12px 24px', background: 'white', color: 'black',
                                border: 'none', borderRadius: '12px', fontWeight: 'bold', width: '100%'
                            }}
                        >
                            Закрыть
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecapPage;
