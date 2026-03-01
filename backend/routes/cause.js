const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const allow = require('../middleware/role');
const multer = require('multer');
const causeImageUpload = multer({
    storage: multer.memoryStorage(), fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files are allowed.'), false);
    }
});
const {
    createCause,
    getCauses,
    getAllCauses,
    getCauseById,
    getCauseImage,
    updateProgress,
    updateCause,
    deleteCause,
    getNGOCauses,
} = require('../controllers/causeController');

// Public route - serve cause images from MongoDB
router.get('/:id/image/:index', getCauseImage);

router.post('/', protect, allow('ngo', 'admin'), causeImageUpload.array('images', 5), createCause);
router.get('/', getCauses);
router.get('/all', protect, allow('admin'), getAllCauses);
router.get('/my', protect, allow('ngo'), getNGOCauses);
router.get('/:id', getCauseById);
router.patch('/:id/progress', protect, allow('ngo'), causeImageUpload.array('proofImages', 5), updateProgress);
router.patch('/:id', protect, allow('ngo', 'admin'), causeImageUpload.array('images', 5), updateCause);
router.delete('/:id', protect, allow('admin'), deleteCause);

module.exports = router;
