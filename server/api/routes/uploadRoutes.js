const express = require('express');
const uploadController = require('../controllers/uploadController');
const authenticateToken = require('../middleware/authenticateToken');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();



router.post('/upload', authenticateToken, upload.single('file'), uploadController.uploadFile);
/**
 * @swagger
 * /uploadevent:
 *   post:
 *     summary: Upload a single lines events to Exosearch
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
 *             host:
 *               type: string
 *           example:
 *              index: dpkglog
 *              source: dpkg.pkg
 *              data: 2023-11-18 06:38:21 status unpacked intel-microcode:amd64 3.20230808.1~deb12u1
 *              host: server001
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               index:
 *                 type: string
 *                 description: The index to use for storing the file.
 *               source:
 *                 type: string
 *                 description: Usually the filename the event came from.
 *               data:
 *                 type: string
 *                 description: The text-data event contents to send to the server.
 *               host:
 *                 type: string
 *                 description: The server name the event came from.
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
router.post('/uploadevent', authenticateToken, uploadController.addEvent);

module.exports = router;
