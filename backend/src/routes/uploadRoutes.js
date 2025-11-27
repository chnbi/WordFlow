const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const upload = require('../middleware/upload');

// Upload routes
router.post('/image', upload.single('image'), uploadController.uploadImage);
router.post('/images', upload.array('images', 10), uploadController.batchUploadImages);
router.post('/base64', uploadController.processBase64Image);

module.exports = router;
