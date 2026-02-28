const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const register = async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'All fields are required.' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    if (!['donor', 'ngo', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role.' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
        return res.status(409).json({ error: 'Email already registered.' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role });

    const token = generateToken(user._id);
    res.status(201).json({
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
};

const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
        return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = generateToken(user._id);
    res.json({
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
};

module.exports = { register, login };
