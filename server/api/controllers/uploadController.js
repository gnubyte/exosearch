const mongoose = require('mongoose');
const Grid = require('gridfs-stream');
const { createReadStream } = require('fs');
const { promisify } = require('util');
const { BloomFilter } = require('bloom-filters');

const TextModel = require('../models/textModel');

const db = mongoose.connection.db;
Grid.mongo = mongoose.mongo;

const uploadFile = async (req, res) => {
  const { index, source, host } = req.body;
  const { file } = req.files;

  const gfs = Grid(db);
  const writestream = gfs.createWriteStream({ filename: file.name, metadata: { source, host, index } });

  // Create a promise-based version of `stream.pipeline`
  const pipeline = promisify(require('stream').pipeline);

  try {
    await pipeline(file.data, writestream);

    // Generate and store Bloom filter
    let textModel = await TextModel.findOne({ index });
    if (!textModel) {
      textModel = new TextModel({ index });
    }

    const bloomFilter = await generateBloomFilter(file.path);
    textModel.source = source;
    textModel.host = host;
    textModel.file = file.name;
    textModel.bloomFilter = bloomFilter;
    await textModel.save();

    res.status(200).json({ message: 'File uploaded successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while uploading the file.' });
  }
};

const generateBloomFilter = async (filePath) => {
  const bloomFilter = new BloomFilter(1000, 0.1);

  return new Promise((resolve, reject) => {
    const fileStream = createReadStream(filePath);

    fileStream.on('data', (data) => {
      // Generate Bloom filter based on the file data
      const content = data.toString();
      // Add content to the Bloom filter
      bloomFilter.add(content);
    });

    fileStream.on('end', () => {
      resolve(bloomFilter);
    });

    fileStream.on('error', (error) => {
      reject(error);
    });
  });
};

module.exports = { uploadFile };
