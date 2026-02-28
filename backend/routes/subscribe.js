const express = require('express');
const router = express.Router();
const Subscriber = require('../models/Subscriber');

// @route   POST /api/subscribe
// @desc    Subscribe to newsletter
// @access  Public
router.post('/', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Check if already subscribed
        const existing = await Subscriber.findOne({ email });
        if (existing) {
            return res.status(400).json({ error: 'Email is already subscribed' });
        }

        const newSubscriber = new Subscriber({ email });
        await newSubscriber.save();

        res.status(201).json({ message: 'Subscribed successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error while subscribing' });
    }
});

module.exports = router;
