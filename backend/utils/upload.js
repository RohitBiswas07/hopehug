const multer = require('multer');
const path = require('path');
const fs = require('fs');

const screenshotStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../../public/uploads');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `screenshot_${Date.now()}${ext}`);
    },
});

const documentStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../../public/uploads/docs');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `doc_${Date.now()}${ext}`);
    },
});

const causeImageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../../public/uploads/causes');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `cause_${Date.now()}${ext}`);
    },
});

const qrStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../../public/qr-codes');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // Force overwrite the same file so frontend doesn't need DB changes
        cb(null, 'upi-qr.png');
    },
});

const imageFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed.'), false);
    }
};

const uploadScreenshot = multer({ storage: screenshotStorage, fileFilter: imageFilter });
const uploadDocument = multer({ storage: documentStorage });
const uploadCauseImages = multer({ storage: causeImageStorage, fileFilter: imageFilter });
const uploadQrCode = multer({ storage: qrStorage, fileFilter: imageFilter });

module.exports = { uploadScreenshot, uploadDocument, uploadCauseImages, uploadQrCode };
