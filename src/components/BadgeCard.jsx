// Revisit BadgeCard to match the desired "Compact" Grid Look
// If we want [Icon Title] on top row, and [Stats] on bottom row.
// Update BadgeCard.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import { User, Clock, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const BadgeCard = ({ badge, status }) => {
    const { userBadges } = useAuth();
    const { name, url, user_count, cost, costAmount } = badge;
    const highResUrl = url.replace(/\/(\d)$/, '/3');

    // Check ownership
    // badge.name is the Title (e.g. "Prime Gaming"). 
    // userBadges is an array of { name: "Prime Gaming", ... }
    const isOwned = userBadges && userBadges.some(b => b.name === name);

    // Generate deterministic gradient variant
    const getVariant = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const positions = ['top right', 'top left', 'bottom right', 'bottom left', 'center right'];
        const pos = positions[Math.abs(hash) % positions.length];

        // Slight opacity variation
        const opacity = 0.08 + (Math.abs(hash) % 5) * 0.01; // 0.08 to 0.12

        return {
            '--gradient-pos': pos,
            '--gradient-color': `rgba(145, 70, 255, ${opacity})`
        };
    };

    // Format Date Helper
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('ru-RU', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Time Until Helper
    const getTimeUntil = (dateString) => {
        if (!dateString) return '';
        const target = new Date(dateString).getTime();
        const now = Date.now();
        const diff = target - now;

        if (diff <= 0) return 'сейчас';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) return `${days} д.`;
        if (hours > 0) return `${hours} ч.`;
        return `${minutes} мин.`;
    };

    return (
        <Link to={`/${badge.badge}`} className="badge-card-link">
            <div
                className="badge-card"
                style={{
                    ...getVariant(name),
                    ...(isOwned && {
                        border: '1px solid rgba(145, 70, 255, 0.5)',
                        boxShadow: '0 0 10px rgba(145, 70, 255, 0.3), inset 0 0 20px rgba(145, 70, 255, 0.1)'
                    })
                }}
            >
                <div className="badge-top-row">
                    <div className="badge-icon-container">
                        <img src={highResUrl} alt={name} className="badge-icon" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 className="badge-title">{name}</h3>
                        {badge.types && badge.types.length > 0 && (
                            <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                                {badge.types.map(type => (
                                    <span key={type} className={`cost-badge ${type}`}>
                                        {type === 'free' ? 'Бесплатно' :
                                            type === 'paid' ? `Платно${badge.costAmount ? ` (${badge.costAmount})` : ''}` :
                                                type === 'local' ? 'Локальный' :
                                                    type === 'canceled' ? 'Отменён' :
                                                        type === 'technical' ? 'Технический' : type}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Owned badges have a purple glow border */}

                <div className="badge-stats" style={{
                    width: '100%',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    paddingTop: '0.5rem',
                    marginTop: '0.5rem',
                    justifyContent: 'space-between'
                }}>
                    <div className="stat-item">
                        <User size={16} className="stat-icon" />
                        <span className="stat-value">{user_count.toLocaleString()}</span>
                    </div>

                    {/* Availability Info */}
                    {(status === 'available' && badge.availability?.end) && (
                        <div className="stat-item" style={{ gap: '0.35rem' }}>
                            <Clock size={14} className="stat-icon" style={{ color: '#ffaaa5' }} />
                            <span className="stat-value" style={{ color: '#ffaaa5', fontSize: '0.8rem' }}>
                                {formatDate(badge.availability.end)}
                            </span>
                        </div>
                    )}

                    {(status === 'upcoming' && badge.availability?.start) && (
                        <div className="stat-item" style={{ gap: '0.35rem' }}>
                            <Clock size={14} className="stat-icon" style={{ color: '#a8d8ea' }} />
                            <span className="stat-value" style={{ color: '#a8d8ea', fontSize: '0.8rem' }}>
                                {getTimeUntil(badge.availability.start)}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
};

export default BadgeCard;
