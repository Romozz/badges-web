import React, { useState } from 'react';
import { LogIn, LogOut, User, Award, BarChart3, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const Header = () => {
    const { user, login, loginMock, logout } = useAuth();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/user/${searchQuery.trim()}`);
            setSearchQuery('');
        }
    };

    return (
        <header className="header">
            <div className="header-content">
                <Link to="/" className="brand-link">
                    <div className="logo-placeholder"></div>
                    <span className="brand-name">BADGES TRACKER</span>
                </Link>

                {/* User Profile Search */}
                <form onSubmit={handleSearch} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    flex: '0 1 300px',
                    marginLeft: '2rem'
                }}>
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

                <div className="header-actions">
                    {user ? (
                        <div className="user-menu">
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
                            <Link
                                to={`/user/${user.name}`}
                                className="user-name"
                                style={{
                                    textDecoration: 'none',
                                    color: 'var(--color-text-primary)',
                                    fontWeight: '600',
                                    transition: 'color 0.2s ease'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-accent)'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-primary)'}
                            >
                                {user.name}
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
