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

    // Initial check and redirect if not allowed
    useEffect(() => {
        if (!user) {
            // navigate('/'); // Wait for auth to load? user might be null initially
            return;
        }
        if (!user.roles || !user.roles.includes('admin')) {
            navigate('/');
        }
    }, [user, navigate]);

    // Fetch Admins
    useEffect(() => {
        if (user && user.roles && user.roles.includes('admin')) {
            fetchAdmins();
        }
    }, [user]);

    const fetchAdmins = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/list`);
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setAdmins(data);
        } catch (e) {
            console.error(e);
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

            <div className="admin-section" style={{ marginTop: '2rem' }}>
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
        </div>
    );
};

export default AdminPage;
