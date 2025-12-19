import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchGlobalBadges, getBadgeDescription, saveBadgeDescription, saveBadgeImage, deleteBadgeImage, saveBadgeAvailability, saveBadgeCost, saveBadgeTypes } from '../services/twitch';
import ReactMarkdown from 'react-markdown';
import { Helmet } from 'react-helmet-async';

const BadgeDetailPage = () => {
    const { badgeId } = useParams();
    const { user } = useAuth();
    const [badge, setBadge] = useState(null);
    const highResUrl = badge?.url?.slice(0, -1) + '3';
    const [description, setDescription] = useState('');
    const [images, setImages] = useState([]);
    const [isRelevant, setIsRelevant] = useState(false);
    const [availability, setAvailability] = useState({ start: null, end: null });
    const [types, setTypes] = useState([]); // NEW: array of types
    const [costAmount, setCostAmount] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState('');
    const [newImageUrl, setNewImageUrl] = useState('');
    const [isChatLightMode, setIsChatLightMode] = useState(false);

    useEffect(() => {
        fetchGlobalBadges().then(data => {
            const found = data.find(b => b.badge === badgeId);
            if (found) {
                setBadge(found);
                fetch(`${import.meta.env.VITE_API_URL || ''}/api/badges/${badgeId}`)
                    .then(res => res.json())
                    .then(data => {
                        setDescription(data.description || '');
                        setImages(data.images || []);
                        setIsRelevant(!!data.isRelevant);
                        setAvailability(data.availability || { start: null, end: null });
                        setTypes(data.types || []); // NEW: load types array
                        setCostAmount(data.costAmount || '');
                    })
                    .catch(err => console.error(err));
            }
        });
    }, [badgeId]);

    // Matomo Tracking
    useEffect(() => {
        if (badge) {
            const _paq = window._paq = window._paq || [];
            _paq.push(['setCustomUrl', window.location.href]);
            _paq.push(['setDocumentTitle', `${badge.name} Badge - Twitch Global Badges`]);
            _paq.push(['trackPageView']);
        }
    }, [badge]);

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


    const handleAvailabilityChange = async (newAvailability) => {
        try {
            await saveBadgeAvailability(badgeId, newAvailability.start, newAvailability.end);
            setAvailability(newAvailability);

            // Re-calculate isRelevant locally for immediate feedback
            const now = Date.now();
            const start = newAvailability.start ? new Date(newAvailability.start).getTime() : null;
            const end = newAvailability.end ? new Date(newAvailability.end).getTime() : Infinity;

            let relevant = false;
            // Only relevant if start time exists and we are in the range
            if (start) {
                if (now >= start && now <= end) {
                    relevant = true;
                }
            }
            setIsRelevant(relevant);

        } catch (e) {
            alert("Failed to update availability.");
        }
    }


    const handleTypeToggle = async (type) => {
        try {
            let newTypes;
            if (types.includes(type)) {
                newTypes = types.filter(t => t !== type);
            } else {
                newTypes = [...types, type];
            }

            await saveBadgeTypes(badgeId, newTypes, newTypes.includes('paid') ? costAmount : undefined);
            setTypes(newTypes);
        } catch (e) {
            alert("Failed to update types.");
        }
    };

    const handleAmountChange = async (e) => {
        setCostAmount(e.target.value);
    };

    const saveAmount = async () => {
        try {
            await saveBadgeTypes(badgeId, types, costAmount);
        } catch (e) { console.error(e); }
    }

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

    const insertText = (before, after) => {
        const textarea = document.getElementById('desc-editor');
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selected = text.substring(start, end);

        const newText = text.substring(0, start) + before + selected + after + text.substring(end);
        setEditValue(newText);

        // Restore focus
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + before.length, end + before.length);
        }, 0);
    };

    if (!badge) return <div className="loading">Загрузка информации о значке...</div>;

    return (
        <div className="badge-detail-page">
            <Helmet>
                <title>{badge.name} - Глобальный значок Twitch - Badges Tracker</title>
                <meta name="description" content={description ? description.substring(0, 160) : `Подробная информация о глобальном значке ${badge.name} на Twitch, включая количество пользователей и доступность.`} />
                <meta property="og:title" content={`${badge.name} - Глобальные значки Twitch`} />
                <meta property="og:description" content={description ? description.substring(0, 200) : `Узнайте подробности о значке ${badge.name}, количество пользователей и доступность.`} />
                <meta property="og:image" content={highResUrl || badge.url} />
                <meta name="twitter:title" content={`Значок ${badge.name}`} />
                <meta name="twitter:description" content={description ? description.substring(0, 200) : `Узнайте подробности о значке ${badge.name}.`} />
                <meta name="twitter:image" content={highResUrl || badge.url} />
            </Helmet>
            <div className="detail-layout">
                <div className="detail-images">
                    <div className="image-card">
                        <img src={highResUrl} alt={badge.name} />
                        <span className="image-label">Icon</span>
                    </div>

                    {/* Admin Image Controls */}
                    {user && user.roles && user.roles.includes('admin') && (
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
                                    {user && user.roles && user.roles.includes('admin') && (
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

                    {/* Chat Preview */}
                    <div className="chat-preview-card">
                        <div className="chat-preview-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Вид в чате</span>
                            <button
                                onClick={() => setIsChatLightMode(!isChatLightMode)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--color-text-secondary)',
                                    cursor: 'pointer',
                                    fontSize: '1.2rem',
                                    padding: '0 5px'
                                }}
                                title={isChatLightMode ? "Switch to Dark Mode" : "Switch to Light Mode"}
                            >
                                {isChatLightMode ? '🌙' : '☀️'}
                            </button>
                        </div>
                        <div className={`chat-message-line ${isChatLightMode ? 'light-mode' : ''}`}>
                            <img src={badge.url} alt="Badge" className="chat-badge" />
                            <span className="chat-username" style={{ color: user?.color || '#E91916' }}>{user?.display_name || 'Username'}</span>
                            <span className="chat-colon">:</span>
                            <span className="chat-text">Этот значок выглядит отлично!</span>
                        </div>
                    </div>
                </div>

                <div className="detail-info">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <h2 style={{ marginBottom: 0 }}>{badge.name}</h2>

                        {user && user.roles && user.roles.includes('admin') && (
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <div style={{ fontWeight: 'bold', color: isRelevant ? 'var(--color-accent)' : '#aaa' }}>
                                    {isRelevant ? '★ Актуальный' : '☆ Неактуальный'}
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '8px', alignItems: 'flex-end' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <label style={{ fontSize: '0.6rem', color: '#aaa' }}>Начало (YYYY-MM-DD HH:MM)</label>
                                        <input
                                            type="text"
                                            id="start-time-input"
                                            placeholder="YYYY-MM-DD HH:MM"
                                            style={{ background: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px', padding: '2px', fontSize: '0.8rem', minWidth: '140px' }}
                                            defaultValue={availability.start ? (() => {
                                                const d = new Date(availability.start);
                                                // Format to Local YYYY-MM-DD HH:MM
                                                const pad = n => n < 10 ? '0' + n : n;
                                                return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
                                            })() : ''}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <label style={{ fontSize: '0.6rem', color: '#aaa' }}>Конец (YYYY-MM-DD HH:MM)</label>
                                        <input
                                            type="text"
                                            id="end-time-input"
                                            placeholder="YYYY-MM-DD HH:MM"
                                            style={{ background: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px', padding: '2px', fontSize: '0.8rem', minWidth: '140px' }}
                                            defaultValue={availability.end ? (() => {
                                                const d = new Date(availability.end);
                                                const pad = n => n < 10 ? '0' + n : n;
                                                return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
                                            })() : ''}
                                        />
                                    </div>
                                    <button
                                        onClick={() => {
                                            const startVal = document.getElementById('start-time-input').value;
                                            const endVal = document.getElementById('end-time-input').value;

                                            const parseLocal = (s) => {
                                                if (!s) return null;
                                                // Create date as if local
                                                // replacing space with T helps Date.parse in some browsers, but "YYYY-MM-DD HH:MM" usually works or we manually parse.
                                                // Safest: new Date(s) often works, but let's be standardized.
                                                // If s is "2025-12-16 22:00", new Date(s) is local.
                                                const d = new Date(s);
                                                if (isNaN(d.getTime())) return null;
                                                return d.toISOString();
                                            };

                                            const startISO = parseLocal(startVal);
                                            const endISO = parseLocal(endVal);

                                            if (startVal && !startISO) return alert("Invalid Start Date");
                                            if (endVal && !endISO) return alert("Invalid End Date");

                                            handleAvailabilityChange({ start: startISO, end: endISO });
                                            alert("Saved!");
                                        }}
                                        style={{
                                            background: 'var(--color-accent)',
                                            border: 'none',
                                            color: 'white',
                                            borderRadius: '4px',
                                            padding: '4px 8px',
                                            cursor: 'pointer',
                                            fontSize: '0.8rem',
                                            height: 'fit-content',
                                            marginBottom: '2px'
                                        }}
                                    >
                                        Save
                                    </button>
                                </div>


                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', background: types.includes('free') ? 'rgba(46, 204, 113, 0.1)' : 'transparent', border: '1px solid ' + (types.includes('free') ? '#2ecc71' : 'rgba(255,255,255,0.2)') }}>
                                        <input
                                            type="checkbox"
                                            checked={types.includes('free')}
                                            onChange={() => handleTypeToggle('free')}
                                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                        />
                                        <span style={{ color: types.includes('free') ? '#2ecc71' : 'var(--color-text-secondary)', fontWeight: '600' }}>Бесплатный</span>
                                    </label>

                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', background: types.includes('paid') ? 'rgba(231, 76, 60, 0.1)' : 'transparent', border: '1px solid ' + (types.includes('paid') ? '#e74c3c' : 'rgba(255,255,255,0.2)') }}>
                                        <input
                                            type="checkbox"
                                            checked={types.includes('paid')}
                                            onChange={() => handleTypeToggle('paid')}
                                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                        />
                                        <span style={{ color: types.includes('paid') ? '#e74c3c' : 'var(--color-text-secondary)', fontWeight: '600' }}>Платный</span>
                                        {types.includes('paid') && (
                                            <input
                                                type="number"
                                                placeholder="#"
                                                value={costAmount || ''}
                                                onChange={(e) => setCostAmount(e.target.value)}
                                                onBlur={saveAmount}
                                                style={{
                                                    width: '50px',
                                                    padding: '0.3rem',
                                                    borderRadius: '4px',
                                                    border: '1px solid rgba(231, 76, 60, 0.5)',
                                                    background: 'rgba(0,0,0,0.3)',
                                                    color: '#fff',
                                                    fontWeight: '600',
                                                    textAlign: 'center'
                                                }}
                                                title="Number of subs"
                                            />
                                        )}
                                    </label>

                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', background: types.includes('local') ? 'rgba(52, 152, 219, 0.1)' : 'transparent', border: '1px solid ' + (types.includes('local') ? '#3498db' : 'rgba(255,255,255,0.2)') }}>
                                        <input
                                            type="checkbox"
                                            checked={types.includes('local')}
                                            onChange={() => handleTypeToggle('local')}
                                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                        />
                                        <span style={{ color: types.includes('local') ? '#3498db' : 'var(--color-text-secondary)', fontWeight: '600' }}>Локальный</span>
                                    </label>

                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', background: types.includes('canceled') ? 'rgba(149, 165, 166, 0.1)' : 'transparent', border: '1px solid ' + (types.includes('canceled') ? '#95a5a6' : 'rgba(255,255,255,0.2)') }}>
                                        <input
                                            type="checkbox"
                                            checked={types.includes('canceled')}
                                            onChange={() => handleTypeToggle('canceled')}
                                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                        />
                                        <span style={{ color: types.includes('canceled') ? '#95a5a6' : 'var(--color-text-secondary)', fontWeight: '600' }}>Отменённый</span>
                                    </label>

                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', background: types.includes('technical') ? 'rgba(155, 89, 182, 0.1)' : 'transparent', border: '1px solid ' + (types.includes('technical') ? '#9b59b6' : 'rgba(255,255,255,0.2)') }}>
                                        <input
                                            type="checkbox"
                                            checked={types.includes('technical')}
                                            onChange={() => handleTypeToggle('technical')}
                                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                        />
                                        <span style={{ color: types.includes('technical') ? '#9b59b6' : 'var(--color-text-secondary)', fontWeight: '600' }}>Технический</span>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="info-section">
                        <label>Как получить?</label>
                        {isEditing ? (
                            <div className="edit-container">
                                {/* Toolbar */}
                                <div style={{
                                    display: 'flex',
                                    gap: '0.5rem',
                                    marginBottom: '0.5rem',
                                    background: 'rgba(255,255,255,0.05)',
                                    padding: '0.5rem',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}>
                                    <button type="button" onClick={() => insertText('**', '**')} style={toolbarBtnStyle}><b>B</b></button>
                                    <button type="button" onClick={() => insertText('*', '*')} style={toolbarBtnStyle}><i>I</i></button>
                                    <button type="button" onClick={() => insertText('[', '](url)')} style={toolbarBtnStyle}>🔗</button>
                                    <button type="button" onClick={() => insertText('\n- ', '')} style={toolbarBtnStyle}>List</button>
                                </div>

                                <textarea
                                    id="desc-editor"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    rows={10}
                                    style={{
                                        width: '100%',
                                        background: 'rgba(0,0,0,0.3)',
                                        color: '#efeff1',
                                        border: '1px solid rgba(145, 70, 255, 0.3)',
                                        borderRadius: '8px',
                                        padding: '1rem',
                                        fontFamily: 'inherit',
                                        resize: 'vertical',
                                        marginBottom: '1rem',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                                <div className="edit-actions">
                                    <button onClick={handleSave} className="save-btn">Save</button>
                                    <button onClick={() => setIsEditing(false)} className="cancel-btn" style={{ marginLeft: '1rem', background: 'transparent', border: '1px solid #555', color: '#ccc', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <div className="description-display">
                                <div className="markdown-content" style={{ lineHeight: '1.6', color: '#dedede' }}>
                                    {description ? (
                                        <ReactMarkdown
                                            components={{
                                                a: ({ node, ...props }) => <a style={{ color: 'var(--color-accent)', textDecoration: 'underline' }} target="_blank" rel="noopener noreferrer" {...props} />,
                                                p: ({ node, ...props }) => <p style={{ margin: '0.5em 0' }} {...props} />,
                                                ul: ({ node, ...props }) => <ul style={{ paddingLeft: '1.5em' }} {...props} />,
                                                li: ({ node, ...props }) => <li style={{ marginBottom: '0.25em' }} {...props} />
                                            }}
                                        >
                                            {description}
                                        </ReactMarkdown>
                                    ) : (
                                        <span style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>{badge.description}</span>
                                    )}
                                </div>
                                {user && user.roles && user.roles.includes('admin') && (
                                    <button onClick={handleEdit} className="edit-btn" style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>Edit Description</button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Availability Display for All Users */}
                    {(availability.start || availability.end) && (
                        <div className="info-row">
                            {availability.start && (
                                <div>
                                    <span className="label">Начало: </span>
                                    <span className="value" style={{ color: '#efeff1' }}>
                                        {new Date(availability.start).toLocaleString()}
                                    </span>
                                </div>
                            )}
                            {availability.end && (
                                <div>
                                    <span className="label">Конец: </span>
                                    <span className="value" style={{ color: '#efeff1' }}>
                                        {new Date(availability.end).toLocaleString()}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="info-row">
                        <span className="label">Пользователей:</span>
                        <span className="value">{badge.user_count.toLocaleString()} ({badge.percentage.toFixed(4)}%)</span>
                    </div>

                </div>
            </div>
        </div>
    );
};

const toolbarBtnStyle = {
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.2)',
    color: '#efeff1',
    borderRadius: '4px',
    padding: '0.25rem 0.5rem',
    cursor: 'pointer',
    minWidth: '30px'
};

export default BadgeDetailPage;
