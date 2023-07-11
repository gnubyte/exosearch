const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication
 */

//write swagger documentation here for the /setup controller

/**
 * @swagger
 * /setup:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Check if administrator is already set up
 *     description: Returns the appropriate HTML file based on whether the administrator is already set up or not.
 *     responses:
 *       200:
 *         description: HTML file returned successfully
 *       500:
 *         description: An error occurred while setting up the administrator account.
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Set up the administrator
 *     description: Creates the administrator account with the provided credentials and returns an HTML file indicating the successful setup.
 *     parameters:
 *       - in: body
 *         name: setupCredentials
 *         description: The credentials for setting up the administrator account.
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             username:
 *               type: string
 *             password:
 *               type: string
 *             email:
 *               type: string
 *           example:
 *             username: admin
 *             password: admin123
 *             email: admin@example.com
 *     responses:
 *       200:
 *         description: Administrator account created successfully
 *       500:
 *         description: An error occurred while setting up the administrator account.
 */
router.all('/setup', authController.setupAdministrator);


/**
 * @swagger
 * /login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Log in the user
 *     description: Authenticates the user with the provided credentials and returns a JWT token for accessing protected routes.
 *     parameters:
 *       - in: body
 *         name: loginCredentials
 *         description: The credentials for logging in the user.
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             username:
 *               type: string
 *             password:
 *               type: string
 *           example:
 *             username: admin
 *             password: admin123
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       401:
 *         description: Invalid username or password.
 *       500:
 *         description: An error occurred while logging in.
 */

router.post('/login', authController.loginUser);

/**
 * @swagger
 * /checktoken:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Check token validity
 *     description: Checks the validity of the provided JWT token.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *       401:
 *         description: Invalid token.
 */
router.get('/checktoken', authController.checkToken);

module.exports = router;
