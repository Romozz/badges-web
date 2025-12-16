import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchGlobalBadges, getBadgeDescription, saveBadgeDescription, saveBadgeImage, deleteBadgeImage, saveBadgeRelevance } from '../services/twitch';

const BadgeDetailPage = () => {
    const { badgeId } = useParams();
    const { user } = useAuth();
    const [badge, setBadge] = useState(null);
    const highResUrl = badge?.url?.replace(/\/(\d)$/, '/3');
    const [description, setDescription] = useState('');
    const [images, setImages] = useState([]);
    const [isRelevant, setIsRelevant] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState('');
    const [newImageUrl, setNewImageUrl] = useState('');

    useEffect(() => {
        // We need to fetch all badges to find the specific one since the API is a flat list (cached by backend)
        fetchGlobalBadges().then(data => {
            const found = data.find(b => b.badge === badgeId);
            if (found) {
                setBadge(found);

                // Fetch details from our backend
                fetch(`/api/badges/${badgeId}`)
                    .then(res => res.json())
                    .then(data => {
                        setDescription(data.description || "Описание отсутствует");
                        setImages(data.images || []);
                        setIsRelevant(!!data.isRelevant);
                    })
                    .catch(err => console.error(err));
            }
        });
    }, [badgeId]);

    const handleEdit = () => {
        setEditValue(description);
        setIsEditing(true);
    };

    const handleSave = async () => {
        try {
            await saveBadgeDescription(badgeId, editValue);
            setDescription(editValue);
            setIsEditing(false);
        } catch (e) {
            alert("Failed to save. Are you admin?");
        }
    };

    const handleRelevanceToggle = async () => {
        try {
            const newState = !isRelevant;
            await saveBadgeRelevance(badgeId, newState);
            setIsRelevant(newState);
        } catch (e) {
            alert("Failed to update relevance.");
        }
    };

    const handleAddImage = async () => {
        if (!newImageUrl) return;
        try {
            const data = await saveBadgeImage(badgeId, newImageUrl);
            setImages(data.images);
            setNewImageUrl('');
        } catch (e) {
            alert("Failed to add image");
        }
    };

    const handleDeleteImage = async (url) => {
        if (!confirm("Remove this image?")) return;
        try {
            const data = await deleteBadgeImage(badgeId, url);
            setImages(data.images);
        } catch (e) {
            alert("Failed to delete image");
        }
    };

    if (!badge) return <div className="loading">Загрузка информации о значке...</div>;

    return (
        <div className="badge-detail-page">
            <div className="detail-layout">
                <div className="detail-images">
                    <div className="image-card">
                        <img src={highResUrl} alt={badge.name} />
                        <span className="image-label">Icon</span>
                    </div>

                    {/* Admin Image Controls */}
                    {user && user.name === 'rom0zzz' && (
                        <div className="admin-image-controls" style={{ marginTop: '1rem' }}>
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <input
                                    type="text"
                                    placeholder="Image URL..."
                                    value={newImageUrl}
                                    onChange={e => setNewImageUrl(e.target.value)}
                                    style={{
                                        padding: '5px',
                                        borderRadius: '4px',
                                        border: '1px solid #333',
                                        background: '#222',
                                        color: '#fff',
                                        width: '100%'
                                    }}
                                />
                                <button
                                    onClick={handleAddImage}
                                    style={{
                                        background: 'var(--color-accent)',
                                        border: 'none',
                                        color: 'white',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        padding: '0 10px'
                                    }}
                                >+</button>
                            </div>
                        </div>
                    )}

                    {/* Additional Images Gallery */}
                    {images.length > 0 && (
                        <div className="extra-images" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                            {images.map((imgUrl, idx) => (
                                <div key={idx} className="image-card" style={{ position: 'relative' }}>
                                    <img src={imgUrl} alt="Attached" style={{ maxWidth: '100%' }} />
                                    {user && user.name === 'rom0zzz' && (
                                        <button
                                            onClick={() => handleDeleteImage(imgUrl)}
                                            style={{
                                                position: 'absolute',
                                                top: '5px',
                                                right: '5px',
                                                background: 'rgba(0,0,0,0.7)',
                                                color: 'red',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: '24px',
                                                height: '24px',
                                                cursor: 'pointer'
                                            }}
                                        >x</button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="detail-info">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2 style={{ marginBottom: 0 }}>{badge.name}</h2>
                        {user && user.name === 'rom0zzz' && (
                            <button
                                onClick={handleRelevanceToggle}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px',
                                    border: '1px solid ' + (isRelevant ? 'var(--color-accent)' : 'rgba(255,255,255,0.2)'),
                                    background: isRelevant ? 'rgba(145, 70, 255, 0.2)' : 'transparent',
                                    color: isRelevant ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}
                            >
                                {isRelevant ? '★ Актуальный' : '☆ Пометить актуальным'}
                            </button>
                        )}
                    </div>

                    <div className="info-section">
                        <label>Как получить?</label>
                        {isEditing ? (
                            <div className="edit-container">
                                <textarea
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    rows={5}
                                />
                                <div className="edit-actions">
                                    <button onClick={handleSave} className="save-btn">Save</button>
                                    <button onClick={() => setIsEditing(false)} className="cancel-btn">Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <div className="description-display">
                                <p>{description}</p>
                                {/* Only show edit button if logged in as admin (rom0zzz) */}
                                {user && user.name === 'rom0zzz' && (
                                    <button onClick={handleEdit} className="edit-btn">Edit Description</button>
                                )}
                            </div>
                        )}
                    </div>
                    {/* 
                    <div className="info-row">
                        <span className="label">Badge ID:</span>
                        <span className="value">{badge.badge}</span>
                    </div>

                    <div className="info-row">
                        <span className="label">Click Action:</span>
                        <span className="value">{badge.clickAction || "None"}</span>
                    </div>
*/}
                    <div className="info-row">
                        <span className="label">Пользователей:</span>
                        <span className="value">{badge.user_count.toLocaleString()} ({badge.percentage.toFixed(4)}%)</span>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default BadgeDetailPage;
