import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';

const AdminPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [admins, setAdmins] = useState([]);
    const [newAdmin, setNewAdmin] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);



    const [recalculating, setRecalculating] = useState(false);

    useEffect(() => {
        if (user && user.roles.includes('admin')) {
            fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/list`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) setAdmins(data);
                })
                .catch(err => console.error("Failed to fetch admins", err));
        }
    }, [user]);

    const handleRecalculateStats = async () => {
        if (!confirm("Вы уверены, что хотите пересчитать статистику для всех пользователей? Это может занять некоторое время.")) return;
        setRecalculating(true);
        setError(null);
        setSuccess(null);
        try {
            // Note: credentials include is important if the API expects cookies
            const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/recalculate-stats`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // credentials: 'include' // If you are using cookie based auth, usually fetch defaults to not include. 
                // However, previous admin calls didn't explicitly set it, relying on global config or same-origin. 
                // Assuming same-origin or configured elsewhere. If issues arise, check credentials.
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setSuccess(`Статистика успешно обновлена для ${data.count} пользователей.`);
        } catch (e) {
            setError(e.message || "Ошибка при обновлении статистики");
        } finally {
            setRecalculating(false);
        }
    };

    const handleAddAdmin = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: newAdmin })
            });
            const data = await res.json();
            if (data.error) {
                setError(data.error);
            } else {
                setSuccess(`Пользователь ${newAdmin} добавлен как администратор.`);
                setAdmins(data.admins);
                setNewAdmin('');
            }
        } catch (e) {
            setError("Ошибка запроса");
        }
    };

    const handleRemoveAdmin = async (username) => {
        if (!confirm(`Вы уверены, что хотите убрать права администратора у пользователя ${username}?`)) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/remove`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });
            const data = await res.json();
            if (data.error) {
                alert(data.error);
            } else {
                setAdmins(data.admins);
            }
        } catch (e) {
            alert("Ошибка запроса");
        }
    };

    if (!user || !user.roles.includes('admin')) return <div className="loading">Загрузка...</div>;

    const isCreator = user.roles.includes('creator');

    return (
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
            <Helmet>
                <title>Панель Администратора - Badges Tracker</title>
                <meta name="description" content="Административная панель для управления администраторами сайта Badges Tracker." />
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>

            <h1 style={{ borderBottom: '1px solid #333', paddingBottom: '1rem' }}>Панель Администратора</h1>

            {error && <div style={{ background: 'rgba(231, 76, 60, 0.2)', color: '#e74c3c', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}
            {success && <div style={{ background: 'rgba(46, 204, 113, 0.2)', color: '#2ecc71', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{success}</div>}

            <div className="admin-section" style={{ marginTop: '2rem' }}>
                <h2>Обслуживание системы</h2>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <p style={{ marginBottom: '1rem', color: '#aaa' }}>
                        Пересчитать статистику значков (Total, Free, Paid) для всех пользователей на основе актуальных данных из базы значков.
                        Полезно, если метаданные значков изменились или статистика рассинхронизирована.
                    </p>
                    <button
                        onClick={handleRecalculateStats}
                        disabled={recalculating}
                        style={{
                            background: recalculating ? '#555' : 'var(--color-accent)',
                            color: '#fff',
                            border: 'none',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '8px',
                            cursor: recalculating ? 'not-allowed' : 'pointer',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        {recalculating ? 'Выполняется...' : 'Пересчитать статистику для всех пользователей'}
                    </button>
                </div>
            </div>

            <div className="admin-section" style={{ marginTop: '3rem' }}>
                <h2>Имперсонация (Вход под другим пользователем)</h2>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <p style={{ marginBottom: '1.5rem', color: '#aaa', fontSize: '0.95rem', lineHeight: '1.5' }}>
                        Введите никнейм пользователя, чтобы временно войти в систему от его лица.
                        Это позволит вам увидеть его итоги года и статистику так, как их видит он.
                        <br />
                        <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>⚠️ Внимание:</span> Ваш текущий сеанс администратора будет завершен. Чтобы вернуться, вам нужно будет войти заново через Twitch.
                    </p>
                    <ImpersonateForm />
                </div>
            </div>

            <div className="admin-section" style={{ marginTop: '3rem' }}>
                <h2>Управление Администраторами</h2>
                <p style={{ color: '#aaa', marginBottom: '1rem' }}>
                    {isCreator
                        ? "Вы Создатель. Вы можете добавлять или удалять других администраторов."
                        : "Вы Администратор. Вы можете просматривать список администраторов."}
                </p>

                {isCreator && (
                    <form onSubmit={handleAddAdmin} style={{ display: 'flex', gap: '10px', marginBottom: '2rem' }}>
                        <input
                            type="text"
                            placeholder="Юзернейм Twitch"
                            value={newAdmin}
                            onChange={e => setNewAdmin(e.target.value)}
                            style={{
                                padding: '10px',
                                borderRadius: '4px',
                                border: '1px solid #333',
                                background: '#18181b',
                                color: 'white',
                                flex: 1
                            }}
                        />
                        <button
                            type="submit"
                            style={{
                                background: 'var(--color-accent)',
                                color: 'white',
                                border: 'none',
                                padding: '0 20px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            Добавить
                        </button>
                    </form>
                )}

                {error && <div style={{ color: '#e74c3c', marginBottom: '1rem', background: 'rgba(231, 76, 60, 0.1)', padding: '10px', borderRadius: '4px' }}>{error}</div>}
                {success && <div style={{ color: '#2ecc71', marginBottom: '1rem', background: 'rgba(46, 204, 113, 0.1)', padding: '10px', borderRadius: '4px' }}>{success}</div>}

                <div className="admin-list" style={{ background: '#18181b', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ padding: '15px', background: '#25252b', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Пользователь</span>
                        <span>Действие</span>
                    </div>
                    {/* Always show rom0zzz (Creator) */}
                    <div style={{ padding: '15px', borderTop: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--color-accent)', fontWeight: 'bold' }}>rom0zzz (Создатель)</span>
                        <span style={{ color: '#aaa', fontSize: '0.8rem' }}>Нельзя удалить</span>
                    </div>

                    {admins.map(adminUser => (
                        <div key={adminUser} style={{ padding: '15px', borderTop: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{adminUser}</span>
                            {isCreator ? (
                                <button
                                    onClick={() => handleRemoveAdmin(adminUser)}
                                    style={{
                                        background: 'transparent',
                                        border: '1px solid #e74c3c',
                                        color: '#e74c3c',
                                        borderRadius: '4px',
                                        padding: '5px 10px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Удалить
                                </button>
                            ) : (
                                <span style={{ color: '#aaa', fontSize: '0.8rem' }}>Только просмотр</span>
                            )}
                        </div>
                    ))}

                    {admins.length === 0 && (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#555' }}>Нет назначенных администраторов.</div>
                    )}
                </div>
            </div>

            <div className="admin-section" style={{ marginTop: '3rem' }}>
                <h2>Последние пользователи</h2>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <p style={{ marginBottom: '1rem', color: '#aaa' }}>
                        Список пользователей, недавно обновивших свою коллекцию.
                    </p>
                    <RecentUsersList />
                </div>
            </div>

            <div className="admin-section" style={{ marginTop: '3rem' }}>
                <h2>Управление типами значков</h2>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <p style={{ marginBottom: '1rem', color: '#aaa' }}>
                        Добавление новых категорий значков (типов) для классификации.
                    </p>

                    <BadgeTypesManager />
                </div>
            </div>
        </div>
    );
};

const BadgeTypesManager = () => {
    const [types, setTypes] = useState({});
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ key: '', label: '', color: '#3498db', isTechnical: false });
    const [msg, setMsg] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchTypes();
    }, []);

    const fetchTypes = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/types`);
            const data = await res.json();
            setTypes(data);
        } catch (e) {
            console.error("Failed to load types");
        } finally {
            setLoading(false);
        }
    };

    const handleAddType = async (e) => {
        e.preventDefault();
        setMsg({ type: '', text: '' });

        if (!formData.key || !formData.label) {
            setMsg({ type: 'error', text: 'ID и Название обязательны' });
            return;
        }

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/types`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            setTypes(data.types);
            setMsg({ type: 'success', text: `Тип "${formData.label}" успешно добавлен` });
            setFormData({ key: '', label: '', color: '#3498db', description: '', isTechnical: false });
        } catch (e) {
            setMsg({ type: 'error', text: e.message || "Ошибка при добавлении" });
        }
    };

    const handleDelete = async (key) => {
        if (!confirm(`Удалить тип "${types[key].label}"?`)) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/types`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key })
            });
            const data = await res.json();
            if (data.success) {
                setTypes(data.types);
            }
        } catch (e) {
            alert("Ошибка удаления");
        }
    };

    if (loading) return <div>Загрузка типов...</div>;

    return (
        <div>
            {msg.text && (
                <div style={{
                    padding: '10px',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    background: msg.type === 'error' ? 'rgba(231, 76, 60, 0.2)' : 'rgba(46, 204, 113, 0.2)',
                    color: msg.type === 'error' ? '#e74c3c' : '#2ecc71'
                }}>
                    {msg.text}
                </div>
            )}

            <form onSubmit={handleAddType} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ fontSize: '0.8rem', color: '#aaa' }}>ID (ключ, англ)</label>
                    <input
                        type="text"
                        value={formData.key}
                        onChange={e => setFormData({ ...formData, key: e.target.value })}
                        placeholder="e.g. event-2025"
                        style={{ padding: '8px', background: '#25252b', border: '1px solid #444', color: 'white', borderRadius: '4px' }}
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ fontSize: '0.8rem', color: '#aaa' }}>Название (отображаемое)</label>
                    <input
                        type="text"
                        value={formData.label}
                        onChange={e => setFormData({ ...formData, label: e.target.value })}
                        placeholder="Например: Event 2025"
                        style={{ padding: '8px', background: '#25252b', border: '1px solid #444', color: 'white', borderRadius: '4px' }}
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ fontSize: '0.8rem', color: '#aaa' }}>Цвет</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                            type="color"
                            value={formData.color}
                            onChange={e => setFormData({ ...formData, color: e.target.value })}
                            style={{ width: '40px', height: '40px', border: 'none', padding: 0, background: 'none', cursor: 'pointer' }}
                        />
                        <input
                            type="text"
                            value={formData.color}
                            onChange={e => setFormData({ ...formData, color: e.target.value })}
                            style={{ flex: 1, padding: '8px', background: '#25252b', border: '1px solid #444', color: 'white', borderRadius: '4px' }}
                        />
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', gridColumn: '1 / -1' }}>
                    <input
                        type="checkbox"
                        id="isTechnical"
                        checked={formData.isTechnical}
                        onChange={e => setFormData({ ...formData, isTechnical: e.target.checked })}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label htmlFor="isTechnical" style={{ cursor: 'pointer', fontSize: '0.9rem' }}>Технический тип (скрыт от пользователей)</label>
                </div>
                <button
                    type="submit"
                    style={{
                        gridColumn: '1 / -1',
                        padding: '10px',
                        background: 'var(--color-accent)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        opacity: (!formData.key || !formData.label) ? 0.5 : 1
                    }}
                    disabled={!formData.key || !formData.label}
                >
                    Добавить новый тип
                </button>
            </form>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {Object.entries(types).map(([key, t]) => (
                    <div key={key} style={{
                        padding: '1rem',
                        background: '#25252b',
                        borderRadius: '8px',
                        border: `1px solid ${t.color}`,
                        position: 'relative'
                    }}>
                        <div style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: t.bg || t.color,
                            color: t.color,
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            border: `1px solid ${t.border || t.color}`,
                            marginBottom: '0.5rem'
                        }}>
                            {t.label}
                        </div>
                        {t.isTechnical && (
                            <div style={{
                                display: 'inline-block',
                                padding: '2px 6px',
                                background: 'rgba(255,255,255,0.1)',
                                borderRadius: '4px',
                                fontSize: '0.65rem',
                                color: '#eee',
                                marginLeft: '8px',
                                border: '1px solid rgba(255,255,255,0.2)',
                                verticalAlign: 'middle'
                            }}>
                                ТЕХНИЧЕСКИЙ
                            </div>
                        )}
                        <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.5rem' }}>ID: {key}</div>
                        {t.description && <div style={{ fontSize: '0.8rem', color: '#ccc' }}>{t.description}</div>}

                        <button
                            onClick={() => handleDelete(key)}
                            style={{
                                position: 'absolute',
                                top: '5px',
                                right: '5px',
                                background: 'transparent',
                                border: 'none',
                                color: '#e74c3c',
                                cursor: 'pointer',
                                fontSize: '1.2rem'
                            }}
                            title="Удалить"
                        >
                            &times;
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const RecentUsersList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/users`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setUsers(data);
            })
            .catch(e => console.error("Failed to load users", e))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div>Загрузка пользователей...</div>;

    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                    <tr style={{ background: '#25252b', textAlign: 'left' }}>
                        <th style={{ padding: '10px', borderRadius: '8px 0 0 0' }}>Пользователь</th>
                        <th style={{ padding: '10px' }}>Обновлен</th>
                        <th style={{ padding: '10px' }}>Значков</th>
                        <th style={{ padding: '10px', borderRadius: '0 8px 0 0' }}>Stats (T/F/P)</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u.login} style={{ borderBottom: '1px solid #333' }}>
                            <td style={{ padding: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{
                                        fontWeight: 'bold',
                                        color: u.color || (u.isRegistered ? 'var(--color-accent)' : '#aaa')
                                    }}>{u.display_name || u.login}</span>
                                </div>
                            </td>
                            <td style={{ padding: '10px', color: '#aaa' }}>
                                {u.lastUpdated ? new Date(u.lastUpdated).toLocaleString() : '-'}
                            </td>
                            <td style={{ padding: '10px' }}>{u.stats?.total || 0}</td>
                            <td style={{ padding: '10px', fontFamily: 'monospace' }}>
                                {u.stats?.total}/{u.stats?.free}/{u.stats?.paid}
                            </td>
                        </tr>
                    ))}
                    {users.length === 0 && (
                        <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#555' }}>Нет данных</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

const ImpersonateForm = () => {
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleImpersonate = async (e) => {
        e.preventDefault();
        if (!username.trim()) return;

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/impersonate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username.trim() })
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            // Success - reload page to apply new session
            window.location.href = '/recap';
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleImpersonate}>
            <div style={{ display: 'flex', gap: '12px' }}>
                <input
                    type="text"
                    placeholder="Никнейм Twitch (например, rom0zzz)"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    style={{
                        flex: 1,
                        padding: '12px 16px',
                        background: '#1a1a1e',
                        border: '1px solid #333',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '1rem'
                    }}
                />
                <button
                    type="submit"
                    disabled={loading || !username.trim()}
                    style={{
                        background: loading ? '#444' : '#9147ff',
                        color: 'white',
                        border: 'none',
                        padding: '0 24px',
                        borderRadius: '8px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold',
                        transition: 'all 0.2s ease'
                    }}
                >
                    {loading ? 'Вход...' : 'Войти за пользователя'}
                </button>
            </div>
            {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '10px', fontWeight: '500' }}>{error}</div>}
        </form>
    );
};

export default AdminPage;
