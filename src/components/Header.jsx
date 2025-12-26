import React, { useState } from 'react';
import { LogIn, LogOut, User, Award, BarChart3, Search, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const Header = () => {
    const { user, login, loginMock, logout } = useAuth();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchOpen, setSearchOpen] = useState(false);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/user/${searchQuery.trim()}`);
            setSearchQuery('');
            setSearchOpen(false); // Close search on mobile after submit
        }
    };

    return (
        <header className="header">
            <div className="header-content">
                <Link to="/" className="brand-link">
                    <div className="logo-placeholder"></div>
                    <span className="brand-name">BADGES TRACKER</span>
                </Link>

                {/* User Profile Search - Desktop */}
                <form
                    onSubmit={handleSearch}
                    className="header-search-desktop"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        flex: '0 1 300px',
                        marginLeft: '2rem'
                    }}
                >
                    <div style={{
                        position: 'relative',
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        <Search
                            size={16}
                            style={{
                                position: 'absolute',
                                left: '0.75rem',
                                color: 'rgba(255,255,255,0.5)',
                                pointerEvents: 'none'
                            }}
                        />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Поиск профиля..."
                            style={{
                                width: '100%',
                                padding: '0.5rem 0.75rem 0.5rem 2.5rem',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '8px',
                                color: 'white',
                                fontSize: '0.9rem',
                                outline: 'none',
                                transition: 'all 0.2s ease'
                            }}
                            onFocus={(e) => {
                                e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                                e.target.style.borderColor = 'var(--color-accent)';
                            }}
                            onBlur={(e) => {
                                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                            }}
                        />
                    </div>
                </form>

                {/* Mobile Search Overlay */}
                {searchOpen && (
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0, 0, 0, 0.95)',
                            zIndex: 1000,
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'center',
                            padding: '2rem 1rem'
                        }}
                        onClick={() => setSearchOpen(false)}
                    >
                        <form
                            onSubmit={handleSearch}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                width: '100%',
                                maxWidth: '500px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem'
                            }}
                        >
                            <div style={{
                                position: 'relative',
                                width: '100%'
                            }}>
                                <Search
                                    size={20}
                                    style={{
                                        position: 'absolute',
                                        left: '1rem',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: 'rgba(255,255,255,0.5)',
                                        pointerEvents: 'none'
                                    }}
                                />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Введите никнейм..."
                                    autoFocus
                                    style={{
                                        width: '100%',
                                        padding: '1rem 1rem 1rem 3rem',
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        border: '2px solid var(--color-accent)',
                                        borderRadius: '12px',
                                        color: 'white',
                                        fontSize: '1.1rem',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => setSearchOpen(false)}
                                style={{
                                    padding: '0.75rem',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: '8px',
                                    color: 'white',
                                    cursor: 'pointer'
                                }}
                            >
                                Отмена
                            </button>
                        </form>
                    </div>
                )}

                <div className="header-actions">
                    {user ? (
                        <div className="user-menu">
                            {/* Mobile Search Button */}
                            <button
                                onClick={() => setSearchOpen(true)}
                                className="header-icon-btn header-search-mobile"
                                title="Поиск профиля"
                                style={{ display: 'none' }}
                            >
                                <Search size={18} />
                            </button>

                            {user.roles && user.roles.includes('admin') && (
                                <Link to="/admin" className="header-nav-btn">
                                    <User size={16} />
                                    <span>Admin</span>
                                </Link>
                            )}
                            <Link to={`/user/${user.name}`} className="header-icon-btn" title="Мои значки">
                                <Award size={18} />
                            </Link>
                            <Link to="/stats" className="header-icon-btn" title="Статистика">
                                <BarChart3 size={18} />
                            </Link>
                            <Link to="/recap/2025" className="header-icon-btn" title="Итоги 2025" style={{ color: '#a78bfa' }}>
                                <Zap size={18} />
                            </Link>
                            <Link
                                to={`/user/${user.name}`}
                                className="user-name"
                                style={{
                                    textDecoration: 'none',
                                    color: user.color || 'var(--color-text-primary)',
                                    fontWeight: '600',
                                    transition: 'color 0.2s ease'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-accent)'}
                                onMouseLeave={(e) => e.currentTarget.style.color = user.color || 'var(--color-text-primary)'}
                            >
                                {user.display_name || user.name}
                            </Link>
                            <button onClick={logout} className="icon-btn" title="Выйти">
                                <LogOut size={20} />
                            </button>
                        </div>
                    ) : (
                        <div className="auth-buttons">
                            <button onClick={login} className="login-btn compact">
                                <LogIn size={16} style={{ marginRight: '6px' }} /> Войти
                            </button>
                            {import.meta.env.DEV && (
                                <button onClick={loginMock} className="login-btn compact mock-btn">
                                    Dev
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
