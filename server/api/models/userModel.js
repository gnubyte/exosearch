const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true
  },
  password: String,
  email: String,
  role: {
    type: String,
    enum: ['admin', 'read-data', 'submit-data']
  }
});

const UserModel = mongoose.model('User', userSchema);

module.exports = UserModel;