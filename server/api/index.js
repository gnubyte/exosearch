const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const authRoutes = require('./routes/authRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const searchRoutes = require('./routes/searchRoutes');
const generalRoutes = require('./routes/generalRoutes');
require('dotenv').config();
const path = require('path')


//write unit tests for these
const app = express();
const PORT = 3000;
console.log(process.env);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set('view engine', 'ejs')


// Routes
app.use(express.static('views'));
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use('/api/auth', authRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/search', searchRoutes);
app.use('/', generalRoutes);




// Swagger setup
const swaggerOptions = {
  swaggerDefinition: {
    info: {
      title: 'API Documentation',
      description: 'API documentation for your project',
      version: '1.0.0',
    },
    basePath: '/',
  },
  apis: ['./api/routes/*.js'], // Path to the API routes files
};
const swaggerSpec = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Swagger documentation route
//const swaggerDocument = require('./swagger.json');

//app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
