const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const TextModel = require('../models/textModel');
const chunkUpload = require('../utils/chunkUpload');

const uploadFile = async (req, res) => {
  try {
    const { originalname, buffer } = req.file;
    const fileId = uuidv4();
    const chunks = chunkUpload(buffer);
    const keywords = extractKeywords(buffer.toString());

    for (let i = 0; i < chunks.length; i++) {
      await TextModel.create({
        fileId,
        chunkId: i + 1,
        text: chunks[i],
        keywords,
      });
    }

    res.status(200).json({ message: 'File uploaded successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while uploading the file.' });
  }
};

const extractKeywords = (text) => {
  // Perform any necessary keyword extraction logic here
  return ['keyword1', 'keyword2', 'keyword3']; // Example keywords
};

module.exports = { uploadFile };
