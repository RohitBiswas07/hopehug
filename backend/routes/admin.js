const express = require('express');
const router = express.Router();
const { adminLogin, createAdmin, listAdmins, removeAdmin, registerAdmin, uploadQr, getSubscribers } = require('../controllers/adminController');
const adminProtect = require('../middleware/adminAuth');
const { uploadQrCode } = require('../utils/upload');

router.post('/login', adminLogin);
router.post('/register', registerAdmin);
router.post('/create', adminProtect, createAdmin);
router.get('/list', adminProtect, listAdmins);
router.delete('/:id', adminProtect, removeAdmin);
router.post('/upload-qr', adminProtect, uploadQrCode.single('qrCode'), uploadQr);
router.get('/subscribers', adminProtect, getSubscribers);

module.exports = router;
