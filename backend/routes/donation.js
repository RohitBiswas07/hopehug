const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const allow = require('../middleware/role');
const { uploadScreenshot } = require('../utils/upload');
const {
    initiateDonation,
    submitProof,
    getMyDonations,
    verifyDonation,
    getAllDonations,
    getRecentDonations,
} = require('../controllers/donationController');

router.get('/recent', getRecentDonations);
router.post('/initiate', protect, allow('donor'), initiateDonation);
router.post('/submit-proof', protect, allow('donor'), uploadScreenshot.single('screenshot'), submitProof);
router.get('/my-donations', protect, allow('donor'), getMyDonations);
router.patch('/verify/:id', protect, allow('admin'), verifyDonation);
router.get('/all', protect, allow('admin'), getAllDonations);

module.exports = router;
