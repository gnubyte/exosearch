const mongoose = require('mongoose');

const textSchema = new mongoose.Schema({
  index: {
    type: String,
    required: true
  },
  fileId: String,
  host: {
    type: String,
    required: true
  },
  source: {
    type: String,
    required: true
  },
  data: Buffer,
  bloomFilter: {
    type: Object,
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const TextModel = mongoose.model('Text', textSchema);

module.exports = TextModel;
