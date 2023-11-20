const mongoose = require('mongoose');
const TextModel = require('../models/textModel');
const db = mongoose.connection.db;
const crypto = require('crypto');
const { SourceMap } = require('module');

// Define Bloom filter parameters
const bloomFilterSize = process.env.BLOOM_FILTER_SIZE;
const numHashFunctions = 4;


// Bloom filter generation function
function generateBloomFilter(text, size, numHashFunctions) {
  const bitArray = new Array(size).fill(false);

  const hashFunctions = Array.from({ length: numHashFunctions }, (_, index) => {
    return (item) => {
      const hash = crypto.createHash('sha1').update(item + index.toString()).digest('hex');
      return parseInt(hash, 16) % process.env.BLOOM_FILTER_SIZE;
    };
  });

  const add = (item) => {
    for (let i = 0; i < numHashFunctions; i++) {
      const hash = hashFunctions[i](item);
      bitArray[hash] = true;
    }
  };

  const contains = (item) => {
    for (let i = 0; i < numHashFunctions; i++) {
      const hash = hashFunctions[i](item);
      if (!bitArray[hash]) {
        return false;
      }
    }
    return true;
  };

  const words = text.toLowerCase().match(/\w+/g);
  if (words) {
    words.forEach((word) => {
      add(word);
    });
  }

  return {
    size: size,
    bitArray: bitArray,
    hashFunctions: hashFunctions,
    add: add,
    contains: contains,
  };
}


const uploadFile = async (req, res) => {
  try {
    const { index } = req.body;

    // Use a different collection if index is specified
    const collectionName = index ? `files_${index}` : 'files';
    const Collection = mongoose.connection.collection(collectionName);

    // Convert uploaded file to Bloom filter
    const fileBuffer = req.file.buffer;
    const fileData = fileBuffer.toString();
    const bloomFilter = generateBloomFilter(fileData, bloomFilterSize, numHashFunctions);

    // Store file data and Bloom filter in MongoDB
    const file = new TextModel({
      index: "default",
      name: req.file.originalname,
      data: fileBuffer,
      host: req.body.host || req.ip,
      source: req.body.source || "default"
    });
    await file.save();

    // Store Bloom filter in a separate collection
    await Collection.insertOne({
      name: req.file.originalname,
      bloomFilter: {
        size: bloomFilter.size,
        bitArray: bloomFilter.bitArray,
        hashFunctions: bloomFilter.hashFunctions.map((hashFn) => hashFn.toString()),
      },
    });

    res.status(200).send('File uploaded successfully!');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error uploading file.');
  }
};//end uploadFile


const addEvent = async (req, res) => {
  try {
    const { index, host, source, data } = req.body;

    // Use a different collection if index is specified
    const collectionName = index ? `data_${index}` : 'files';
    const Collection = mongoose.connection.collection(collectionName);

    const insertedRecord = await Collection.insertOne({
      host: host,
      addedAt: Date.now(),
      source: source,
      data:data
    })
    res.status(200).send('Data uploaded successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error uploading file.');
  }
}

module.exports = { uploadFile,addEvent };
