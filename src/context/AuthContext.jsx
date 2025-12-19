import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const [userBadges, setUserBadges] = useState([]);

    useEffect(() => {
        // Check for active session from backend
        const baseUrl = import.meta.env.VITE_API_URL || '';
        fetch(`${baseUrl}/api/me`)
            .then(res => res.json())
            .then(data => {
                if (data) {
                    setUser(data);
                    // Fetch user badges
                    fetch(`${baseUrl}/api/me/badges`)
                        .then(res => res.json())
                        .then(badges => setUserBadges(badges))
                        .catch(e => console.error("Failed to fetch user badges", e));
                }
            })
            .catch(err => console.error("Failed to check auth status", err))
            .finally(() => setLoading(false));
    }, []);

    // Auto-save user badges collection when it changes
    useEffect(() => {
        if (user && userBadges.length > 0) {
            const baseUrl = import.meta.env.VITE_API_URL || '';
            const badgeNames = userBadges.map(b => b.name);

            fetch(`${baseUrl}/api/me/badges/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ badges: badgeNames }),
                credentials: 'include'
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        console.log('Badge collection saved:', data.stats);
                    }
                })
                .catch(e => console.error("Failed to save badge collection", e));
        }
    }, [userBadges, user]);


    const login = () => {
        const baseUrl = import.meta.env.VITE_API_URL || '';
        window.location.href = `${baseUrl}/auth/twitch`;
    };

    const loginMock = () => {
        const baseUrl = import.meta.env.VITE_API_URL || '';
        window.location.href = `${baseUrl}/auth/mock`;
    };

    const logout = () => {
        const baseUrl = import.meta.env.VITE_API_URL || '';
        fetch(`${baseUrl}/auth/logout`, { method: 'POST' })
            .then(() => {
                setUser(null);
                setUserBadges([]);
            });
    };

    return (
        <AuthContext.Provider value={{ user, userBadges, login, loginMock, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
