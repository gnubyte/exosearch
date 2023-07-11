const express = require('express');
const generalController = require('../controllers/generalController');

const router = express.Router();

router.all('/dashboard', generalController.dashboardView);
router.all('/', generalController.landingView);
router.all('/login', generalController.loginView);
router.all('/logout', generalController.logoutView);
router.all('/upload', generalController.uploadView);
router.all('/search', generalController.searchView);

module.exports = router;
