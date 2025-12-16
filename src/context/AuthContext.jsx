import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for active session from backend
        fetch('/api/me')
            .then(res => res.json())
            .then(data => {
                if (data) {
                    setUser(data);
                }
            })
            .catch(err => console.error("Failed to check auth status", err))
            .finally(() => setLoading(false));
    }, []);

    const login = () => {
        // Redirect to backend auth initiation
        window.location.href = 'https://badges.news/auth/twitch';
    };

    const loginMock = () => {
        window.location.href = 'https://badges.news/auth/mock';
    };

    const logout = () => {
        fetch('/auth/logout', { method: 'POST' })
            .then(() => setUser(null));
    };

    return (
        <AuthContext.Provider value={{ user, login, loginMock, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
