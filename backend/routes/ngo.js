const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const allow = require('../middleware/role');
const { uploadDocument } = require('../utils/upload');
const {
    registerNGO,
    getMyNGO,
    verifyNGO,
    getAllNGOs,
    getNGODonations,
} = require('../controllers/ngoController');

router.post('/register', protect, allow('ngo'), uploadDocument.array('documents', 5), registerNGO);
router.get('/me', protect, allow('ngo'), getMyNGO);
router.get('/all', protect, allow('admin'), getAllNGOs);
router.get('/donations', protect, allow('ngo'), getNGODonations);
router.patch('/verify/:id', protect, allow('admin'), verifyNGO);

module.exports = router;
