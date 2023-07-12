const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { isAdminCreated, setAdminCreated } = require('../utils/fileUtils');
const path = require('path');


const setupAdministrator = async (req, res) => {
  if (req.method === 'GET'){
    if (isAdminCreated()) {
      return res.sendFile(path.join(__dirname, '../views/adminCreated.html'));
    }
    else{
      return res.sendFile(path.join(__dirname,'../views/setup.html'));
    }
  }
  else if (req.method === 'POST'){
        const { username, password, email } = req.body;

      try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({ username, password: hashedPassword, email, role: 'admin' });
        setAdminCreated(); // Create the semaphore file
        res.sendFile(path.join(__dirname,'../views/adminCreated.html'));
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while setting up the administrator account.' });
      }
  }
};

const checkToken = (req, res, next) => {
  const authHeader = req.headers['authorization']; // Extract the authorization header from the request headers
  const token = authHeader && authHeader.split(' ')[1]; // Extract the token from the authorization header
  console.log(token)
  if (!token) {
    return res.status(401).json({ error: 'No token provided.' });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    req.user = decoded.username;
    next();
  });
};

const loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const token = jwt.sign({ username }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '168h' });
    res.status(200).json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while logging in.' });
  }
};

module.exports = { setupAdministrator, checkToken, loginUser };