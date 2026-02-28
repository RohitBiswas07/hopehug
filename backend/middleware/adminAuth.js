const jwt = require('jsonwebtoken');
const User = require('../models/User');

const adminProtect = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No admin token provided.' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded.adminToken || decoded.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden. Admin access required.' });
        }
        const user = await User.findById(decoded.id).select('-password');
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden. Not an admin.' });
        }
        req.adminUser = user;
        next();
    } catch {
        return res.status(401).json({ error: 'Invalid or expired admin token.' });
    }
};

module.exports = adminProtect;
