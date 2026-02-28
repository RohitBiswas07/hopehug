const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const allow = require('../middleware/role');
const { uploadCauseImages } = require('../utils/upload');
const {
    createCause,
    getCauses,
    getAllCauses,
    getCauseById,
    updateProgress,
    updateCause,
    deleteCause,
    getNGOCauses,
} = require('../controllers/causeController');

router.post('/', protect, allow('ngo', 'admin'), uploadCauseImages.array('images', 5), createCause);
router.get('/', getCauses);
router.get('/all', protect, allow('admin'), getAllCauses);
router.get('/my', protect, allow('ngo'), getNGOCauses);
router.get('/:id', getCauseById);
router.patch('/:id/progress', protect, allow('ngo'), uploadCauseImages.array('proofImages', 5), updateProgress);
router.patch('/:id', protect, allow('ngo', 'admin'), uploadCauseImages.array('images', 5), updateCause);
router.delete('/:id', protect, allow('admin'), deleteCause);

module.exports = router;
