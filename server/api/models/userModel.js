const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true
  },
  password: String,
  email: String,
});

const UserModel = mongoose.model('User', userSchema);

module.exports = UserModel;
