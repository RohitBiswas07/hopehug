const express = require('express');
const router = express.Router();
const adminProtect = require('../middleware/adminAuth');
const { adminLogin, createAdmin, listAdmins, removeAdmin, registerAdmin } = require('../controllers/adminController');

router.post('/login', adminLogin);
router.post('/register', registerAdmin);
router.post('/create', adminProtect, createAdmin);
router.get('/list', adminProtect, listAdmins);
router.delete('/:id', adminProtect, removeAdmin);

module.exports = router;
