 const jwt = require('jsonwebtoken');
 

  /**
  * @swagger
  * /checktoken:
  *   get:
  *     summary: Check if token is valid
  *     description: Use this endpoint to check if the provided token is valid and retrieve the user object associated with the token.
  *     security:
  *       - BearerAuth: []
  *     responses:
  *       200:
  *         description: Token is valid
  *       401:
  *         description: No token provided
  *       403:
  *         description: Invalid token
  */
 // Middleware function to authenticate a token
 const authenticateToken = (req, res, next) => {
   const authHeader = req.headers['authorization']; // Extract the authorization header from the request headers
   const token = authHeader && authHeader.split(' ')[1]; // Extract the token from the authorization header
   console.log(token)
   console.log(process.env.ACCESS_TOKEN_SECRET)
   if (!token) {
     // If no token provided, return a 401 error
     return res.status(401).json({ error: 'No token provided.' });
   }
 
   // Verify the token using the provided secret
   jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
     if (err) {
       // If the token is invalid or expired, return a 403 error
       return res.status(403).json({ error: 'Invalid token.' });
     }
 
     // If the token is valid, attach the user object to the request
     req.user = user;
     next();
   });
 };
 
 module.exports = authenticateToken;module.exports = authenticateToken;