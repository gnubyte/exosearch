const express = require('express');
const searchController = require('../controllers/searchController');
const authenticateToken = require('../middleware/authenticateToken');

const router = express.Router();

/**
 * @swagger
 * /api/search/search:
 *   post:
 *     summary: Authenticate a user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *             required:
 *               - username
 *               - password
 *     responses:
 *       200:
 *         description: Successful login
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       401:
 *         description: Invalid username or password
 */
router.get('/search', authenticateToken, searchController.searchRecords);

/**
 * @swagger
 * /api/fetchFilesContents:
 *   get:
 *     summary: Fetch file contents
 *     description: |
 *       Fetches the contents of files based on the provided parameters in a paginated manner.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: The page number for paginated results. (optional)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 100
 *         description: The maximum number of results per page. (optional)
 *       - in: query
 *         name: ids
 *         schema:
 *           type: string
 *         description: A comma-separated list of file IDs to fetch the contents for.
 *       - in: query
 *         name: linebreaker
 *         schema:
 *           type: string
 *         description: The line breaker pattern used to split file contents into events. (optional)
 *       - in: query
 *         name: keywords
 *         schema:
 *           type: string
 *         description: A comma-separated list of keywords to filter the events by. (optional)
 *     responses:
 *       200:
 *         description: Successful operation. Returns the paginated file contents and search metadata.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalPages:
 *                   type: integer
 *                   description: The total number of pages for the file contents.
 *                 totalCount:
 *                   type: integer
 *                   description: The total count of events in all pages.
 *                 keywordsFoundInEvents:
 *                   type: array
 *                   items:
 *                     type: integer
 *                   description: An array of event numbers where keywords were found.
 *                 events:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       eventNumber:
 *                         type: integer
 *                         description: The event number.
 *                       eventData:
 *                         type: string
 *                         description: The content of the event.
 *                       keywordsFound:
 *                         type: array
 *                         items:
 *                           type: string
 *                         description: An array of keywords found in the event.
 *       500:
 *         description: Error fetching file content.
 */
router.get('/file', authenticateToken, searchController.fetchFilesContents);

/**
 * @swagger
 * /api/search/searchevents:
 *   get:
 *     summary: Search and retrieve event data
 *     description: |
 *       Searches for files based on the provided parameters and retrieves their contents in a paginated manner.
 *     parameters:
 *       - in: query
 *         name: index
 *         schema:
 *           type: string
 *         description: The index of the files to search in. (optional)
 *       - in: query
 *         name: keywords
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: An array of keywords to search for in the file contents.
 *       - in: query
 *         name: datetimeRange
 *         schema:
 *           type: string
 *         description: A range of datetime to filter the search results. (optional)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: The page number for paginated results. (optional)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 100
 *         description: The maximum number of results per page. (optional)
 *       - in: query
 *         name: linebreaker
 *         schema:
 *           type: string
 *         description: The line breaker pattern used to split file contents into events. (optional)
 *     responses:
 *       200:
 *         description: Successful operation. Returns the paginated file contents and search metadata.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalPages:
 *                   type: integer
 *                   description: The total number of pages for the search results.
 *                 totalCount:
 *                   type: integer
 *                   description: The total count of events in all pages.
 *                 keywordsFoundInEvents:
 *                   type: array
 *                   items:
 *                     type: integer
 *                   description: An array of event numbers where keywords were found.
 *                 events:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       eventNumber:
 *                         type: integer
 *                         description: The event number.
 *                       eventData:
 *                         type: string
 *                         description: The content of the event.
 *                       keywordsFound:
 *                         type: array
 *                         items:
 *                           type: string
 *                         description: An array of keywords found in the event.
 *       500:
 *         description: Error searching and retrieving file contents.
 */
router.get('/searchandretrieve', authenticateToken, searchController.searchAndRetrieveContents);
router.get('/searchevents', authenticateToken, searchController.searchEvents);

module.exports = router;
