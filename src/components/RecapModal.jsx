import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Zap, X, ChevronRight } from 'lucide-react';

const RecapModal = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const seen = localStorage.getItem('recap_2025_seen');
        const isRecapPage = window.location.pathname.includes('/recap');

        if (!seen && !isRecapPage) {
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        localStorage.setItem('recap_2025_seen', 'true');
    };

    if (!isVisible) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            opacity: isVisible ? 1 : 0,
            transition: 'opacity 0.3s ease'
        }}>
            <div style={{
                background: '#161618',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '32px',
                maxWidth: '480px',
                width: '90%',
                position: 'relative',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05)',
                textAlign: 'center',
                transform: isVisible ? 'scale(1)' : 'scale(0.95)',
                transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
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

                <button
                    onClick={handleClose}
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: 'transparent',
                        border: 'none',
                        color: 'rgba(255, 255, 255, 0.4)',
                        cursor: 'pointer',
                        padding: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '8px',
                        transition: 'all 0.2s',
                        zIndex: 2
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#fff';
                        e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)';
                        e.currentTarget.style.background = 'transparent';
                    }}
                >
                    <X size={20} />
                </button>

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
                        marginBottom: '12px',
                        letterSpacing: '-0.5px'
                    }}>
                        Итоги года <span style={{
                            background: 'linear-gradient(to right, #9146ff, #bd8aff)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>2025</span>
                    </h2>

                    <p style={{
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontSize: '15px',
                        lineHeight: '1.6',
                        marginBottom: '32px',
                        maxWidth: '360px',
                        marginLeft: 'auto',
                        marginRight: 'auto'
                    }}>
                        Взгляни на свой путь коллекционера значков за 2025 год.
                    </p>

                    <Link
                        to="/recap/2025"
                        onClick={handleClose}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            width: '100%',
                            padding: '16px',
                            background: '#9146ff',
                            color: 'white',
                            fontWeight: '600',
                            borderRadius: '12px',
                            textDecoration: 'none',
                            fontSize: '16px',
                            transition: 'all 0.2s',
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
                        }}
                    >
                        Открыть мои итоги <ChevronRight size={18} />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default RecapModal;
