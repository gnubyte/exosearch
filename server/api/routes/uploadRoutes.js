const express = require('express');
const uploadController = require('../controllers/uploadController');
const authenticateToken = require('../middleware/authenticateToken');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Upload a file to exofile and generate the bloom filters for its data.
 *     tags:
 *       - Upload
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: body
 *         name: index
 *         description: The index to post to
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             index:
 *               type: string
 *             source:
 *               type: string
 *           example:
 *              index: debian-cloud-inits
 *              source: file-name
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               index:
 *                 type: string
 *                 description: The index to use for storing the file (optional).
 *               file:
 *                 type: file
 *                 description: The file to upload.
 *             required:
 *               - file
 *     responses:
 *       '200':
 *         description: File uploaded successfully.
 *       '400':
 *         description: Bad request. The request is missing required parameters.
 *       '401':
 *         description: Unauthorized. The request requires authentication.
 *       '500':
 *         description: Internal server error. An error occurred while uploading the file.
 */

router.post('/upload', authenticateToken, upload.single('file'), uploadController.uploadFile);
//router.post('/uploadevent', authenticateToken, uploadController.addEvent);

module.exports = router;
