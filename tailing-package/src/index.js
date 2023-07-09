const tailController = require('./controllers/tailController');

// Specify the path to the config directories
const inputConfigPath = './src/config/inputs';
const outputConfigPath = './src/config/outputs';

// Start tailing the files and uploading to servers
tailController.startTailing(inputConfigPath, outputConfigPath);
