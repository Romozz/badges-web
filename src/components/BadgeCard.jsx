import React from 'react';
import { Link } from 'react-router-dom';

const BadgeCard = ({ badge }) => {
    const { name, url, user_count } = badge;
    // Force high resolution image (Twitch badges usually have versions but url here might be fixed, user pattern suggests replacing last char)
    // Using a safer regex replace to ensure we target the version number if possible, or user's slice logic if standard.
    // User used: url.slice(0, -1) + '3'
    const highResUrl = url.replace(/\/(\d)$/, '/3');

    return (
        <Link to={`/twitch/badges/${badge.badge}`} className="badge-card-link">
            <div className="badge-card">
                <div className="badge-icon-container">
                    <img src={highResUrl} alt={name} className="badge-icon" />
                </div>
                <div className="badge-info">
                    <h3 className="badge-title">{name}</h3>
                    <div className="badge-stats">
                        <span className="stat-label">Пользователей:</span>
                        <span className="stat-value">{user_count.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default BadgeCard;
