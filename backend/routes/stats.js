const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');
const Cause = require('../models/Cause');
const User = require('../models/User');

router.get('/', async (req, res) => {
    const totalRaisedResult = await Donation.aggregate([
        { $match: { status: 'verified' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const totalRaised = totalRaisedResult[0]?.total || 0;
    const totalDonors = await User.countDocuments({ role: 'donor' });
    const activeCauses = await Cause.countDocuments({ status: 'active' });

    res.json({ totalRaised, totalDonors, activeCauses });
});

module.exports = router;
