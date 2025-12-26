import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import BadgeGrid from './components/BadgeGrid';
import BadgeDetailPage from './components/BadgeDetailPage';
import { AuthProvider } from './context/AuthContext';
import { Helmet } from 'react-helmet-async';
import AdminPage from './pages/AdminPage';
import StatsPage from './pages/StatsPage';
import UserProfile from './pages/UserProfile';
import OverlayPage from './pages/OverlayPage';
import RecapPage from './pages/RecapPage';
import RecapModal from './components/RecapModal';

function App() {
    return (
        <AuthProvider>
            <Helmet>
                <title>Badges Tracker</title>
                <meta name="description" content="Исследуйте все глобальные значки Twitch, проверяйте доступность, количество пользователей и многое другое." />
                <meta name="keywords" content="Twitch, Значки, Глобальные значки, Stream Database, Список значков Twitch, Badges Tracker, Badges News" />
                <meta property="og:title" content="Глобальные значки Twitch" />
                <meta property="og:description" content="Исследуйте все глобальные значки Twitch, проверяйте доступность, количество пользователей и многое другое." />
                <meta property="og:type" content="website" />
                <meta name="twitter:card" content="summary_large_image" />
            </Helmet>
            <BrowserRouter>
                <Layout>
                    <Routes>
                        <Route path="/" element={
                            <>
                                <div className="content-header">
                                    <h2>Глобальные значки</h2>
                                    <p>Список всех глобальных значков на Twitch</p>
                                </div>
                                <BadgeGrid />
                            </>
                        } />
                        <Route path="/overlay" element={<OverlayPage />} />
                        <Route path="/stats" element={<StatsPage />} />
                        <Route path="/user/:username" element={<UserProfile />} />
                        <Route path="/admin" element={<AdminPage />} />
                        <Route path="/recap/2025" element={<RecapPage />} />
                        <Route path="/:badgeId" element={<BadgeDetailPage />} />
                    </Routes>
                </Layout>
                <RecapModal />
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
