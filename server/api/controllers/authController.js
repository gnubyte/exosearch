const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { ACCESS_TOKEN_SECRET } = require('../utils/authUtils');
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
        await User.create({ username, password: hashedPassword, email });
        setAdminCreated(); // Create the semaphore file
        res.sendFile(path.join(__dirname,'../views/adminCreated.html'));
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while setting up the administrator account.' });
      }
  }
  

  
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

    const token = jwt.sign({ username }, ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
    res.status(200).json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while logging in.' });
  }
};
module.exports = { setupAdministrator, loginUser };
