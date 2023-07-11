const mongoose = require('mongoose');

const textSchema = new mongoose.Schema({
  index: {
    type: String,
    required: true
  },
  name: String,
  host: {
    type: String,
    required: true
  },
  source: {
    type: String,
    required: true
  },
  data: Buffer,
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const TextModel = mongoose.model('Text', textSchema);

module.exports = TextModel;
