const express = require('express');
const uploadController = require('../controllers/uploadController');
const authenticateToken = require('../middleware/authenticateToken');

const router = express.Router();

router.post('/upload', authenticateToken, uploadController.uploadFile);

module.exports = router;
