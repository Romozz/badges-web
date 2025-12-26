const express = require('express');
const cors = require('cors');
const cookieSession = require('cookie-session');
require('dotenv').config();

const app = express();
const config = require('./config');

app.use(cors({
    origin: ['http://localhost:5173', 'https://badges.news', 'http://localhost:3000'],
    credentials: true
}));
app.use(express.json());
app.use(cookieSession({
    name: 'session',
    keys: [process.env.SESSION_SECRET || 'secret_key'],
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

// Routes
app.use('/', require('./routes/ssr'));
app.use('/auth', require('./routes/auth'));
// Special handling for legacy /api/me which is now in auth.js as /auth/me or can stay as /api/me
app.get('/api/me', (req, res) => res.json(req.session.user || null));

app.use('/api/badges', require('./routes/badges'));
app.use('/api/recap', require('./routes/recap'));
app.use('/api/types', require('./routes/types'));
app.use('/api', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));

app.listen(config.PORT, () => {
    console.log(`Server running at http://localhost:${config.PORT}`);
});
