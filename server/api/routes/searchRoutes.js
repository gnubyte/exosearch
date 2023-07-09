const express = require('express');
const searchController = require('../controllers/searchController');
const authenticateToken = require('../middleware/authenticateToken');

const router = express.Router();

router.post('/search', authenticateToken, searchController.searchRecords);

module.exports = router;
