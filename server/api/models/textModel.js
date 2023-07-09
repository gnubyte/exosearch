const mongoose = require('mongoose');

const textSchema = new mongoose.Schema({
  fileId: String,
  chunkId: Number,
  text: String,
  keywords: [String],
}, { timestamps: true });

const TextModel = mongoose.model('Text', textSchema);

module.exports = TextModel;
