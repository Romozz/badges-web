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
        // Use relative path if proxied, or construct absolute URL based on window.location
        const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://badges.news';
        window.location.href = `${baseUrl}/auth/twitch`;
    };

    const loginMock = () => {
        const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://badges.news';
        window.location.href = `${baseUrl}/auth/mock`;
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
