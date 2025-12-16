import React from 'react';
import { LogIn, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Header = () => {
    const { user, login, loginMock, logout } = useAuth();

    return (
        <header className="header">
            <div className="header-content">
                <Link to="/" className="brand-link">
                    <div className="logo-placeholder"></div>
                    <span className="brand-name">BADGES TRACKER</span>
                </Link>

                <div className="header-actions">
                    {user ? (
                        <div className="user-menu">
                            <span className="user-name">{user.name}</span>
                            <button onClick={logout} className="icon-btn" title="Выйти">
                                <LogOut size={20} />
                            </button>
                        </div>
                    ) : (
                        <div className="auth-buttons">
                            <button onClick={login} className="login-btn compact">
                                <LogIn size={16} style={{ marginRight: '6px' }} /> Войти
                            </button>
                            {/* 
                            Dev Mock Login
                            <button onClick={loginMock} className="login-btn compact mock-btn">
                                Dev
                            </button>
                            */}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
