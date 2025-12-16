import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import BadgeGrid from './components/BadgeGrid';
import BadgeDetailPage from './components/BadgeDetailPage';
import { AuthProvider } from './context/AuthContext';

function App() {
    return (
        <AuthProvider>
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
                        <Route path="/:badgeId" element={<BadgeDetailPage />} />
                    </Routes>
                </Layout>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
