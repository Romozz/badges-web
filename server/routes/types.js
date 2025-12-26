const express = require('express');
const router = express.Router();
const { getDb } = require('../utils/db');

router.get('/', (req, res) => {
    const db = getDb();
    const types = db.type_definitions || {};
    const isAdmin = req.session.user?.roles?.includes('admin');
    if (isAdmin) return res.json(types);
    res.json(Object.fromEntries(Object.entries(types).filter(([_, t]) => !t.isTechnical)));
});

module.exports = router;
