const isAdmin = (req, res, next) => {
    if (!req.session.user || !req.session.user.roles.includes('admin')) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    next();
};

const isCreator = (req, res, next) => {
    if (!req.session.user || !req.session.user.roles.includes('creator')) {
        return res.status(403).json({ error: 'Only the creator can perform this action' });
    }
    next();
};

module.exports = {
    isAdmin,
    isCreator
};
