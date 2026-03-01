const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Subscriber = require('../models/Subscriber');
const Setting = require('../models/Setting');

const adminLogin = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user || user.role !== 'admin') {
        return res.status(401).json({ error: 'Invalid credentials or insufficient permissions.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials or insufficient permissions.' });
    }

    const token = jwt.sign(
        { id: user._id, role: 'admin', adminToken: true },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
    );

    res.json({
        token,
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
    });
};

const createAdmin = async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
        return res.status(400).json({ error: 'Email already in use.' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const admin = await User.create({
        name,
        email,
        password: hashed,
        role: 'admin',
    });

    res.status(201).json({
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        createdAt: admin.createdAt || new Date(),
    });
};

const listAdmins = async (req, res) => {
    const admins = await User.find({ role: 'admin' }).select('-password').sort({ createdAt: -1 });
    res.json(admins);
};

const removeAdmin = async (req, res) => {
    if (req.adminUser._id.toString() === req.params.id) {
        return res.status(400).json({ error: 'Cannot remove your own account.' });
    }
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'admin') {
        return res.status(404).json({ error: 'Admin not found.' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Admin removed.' });
};

const registerAdmin = async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    const existing = await User.findOne({ email });
    if (existing) {
        return res.status(400).json({ error: 'This email is already registered.' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const admin = await User.create({ name, email, password: hashed, role: 'admin' });
    const token = jwt.sign(
        { id: admin._id, role: 'admin', adminToken: true },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
    );
    res.status(201).json({
        token,
        user: { _id: admin._id, name: admin.name, email: admin.email, role: admin.role },
    });
};

const uploadQr = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Please upload an image file' });
        }
        const base64 = req.file.buffer.toString('base64');
        const contentType = req.file.mimetype;
        await Setting.findOneAndUpdate(
            { key: 'upi_qr' },
            { key: 'upi_qr', value: base64, contentType },
            { upsert: true, new: true }
        );
        res.status(200).json({ message: 'UPI QR Code updated successfully' });
    } catch (err) {
        console.error('Error uploading QR code:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

const getQrCode = async (req, res) => {
    try {
        const setting = await Setting.findOne({ key: 'upi_qr' });
        if (!setting) {
            return res.status(404).json({ error: 'QR code not found' });
        }
        const img = Buffer.from(setting.value, 'base64');
        res.set('Content-Type', setting.contentType);
        res.set('Cache-Control', 'public, max-age=300');
        res.send(img);
    } catch (err) {
        console.error('Error fetching QR code:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

const getSubscribers = async (req, res) => {
    try {
        const subscribers = await Subscriber.find().sort({ subscribedAt: -1 });
        res.json(subscribers);
    } catch (err) {
        console.error('Error fetching subscribers:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { adminLogin, createAdmin, listAdmins, removeAdmin, registerAdmin, uploadQr, getQrCode, getSubscribers };
