const mongoose = require('mongoose');
const TextModel = require('../models/textModel');
const db = mongoose.connection.db;
const crypto = require('crypto');


const searchRecords = async (req, res) => {
  try {
    const { index, keywords, datetimeRange } = req.query;

    // Use a different collection if index is specified
    const collectionName = index ? `files_${index}` : 'files';
    const Collection = mongoose.connection.collection(collectionName);

    // Retrieve Bloom filters from the MongoDB collection
    const filters = await Collection.find({}).toArray();

    const matchingFiles = [];

       // Perform search using Bloom filters
       for (const filter of filters) {
        const bloomFilter = {
          size: filter.bloomFilter.size,
          bitArray: filter.bloomFilter.bitArray,
          hashFunctions: filter.bloomFilter.hashFunctions.map((hashFnStr) => eval(`(${hashFnStr})`)),
          contains:  (item) => {
              for (let i = 0; i < this.numHashFunctions; i++) {
                const hash = this.hashFunctions[i](item);
                if (!this.bitArray[hash]) {
                  return false;
                }
              }
              return true;
            }
        };

      // Check if keywords are likely to be present using Bloom filter
      let isLikelyPresent = true;
      for (const keyword of keywords) {
        if (!bloomFilter.contains(keyword)) {
          isLikelyPresent = false;
          break;
        }
      }

      if (isLikelyPresent) {
        // Fetch the file data from the File collection
        const fileData = await File.findOne({ name: filter.name });

        matchingFiles.push({
          name: filter.name,
          addedAt: fileData.addedAt,
          id: fileData._id,
        });
      }
    }

    res.status(200).json(matchingFiles);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error searching for files.');
  }
};


const fetchFilesContents = async (req, res) => {
  try {
    const { page = 1, limit = 100, ids, linebreaker, keywords } = req.query;

    // Convert ids to an array
    const idArray = ids.split(',');

    // Fetch the files with the provided ids
    const files = await File.find({ _id: { $in: idArray } }).sort({ addedAt: 1 });

    // Extract the file content from the files array
    const fileContent = files.map((file) => file.data.toString());

    // Set the line breaker pattern (default: [\r\n]+)
    const lineBreakerPattern = linebreaker ? new RegExp(linebreaker) : /[\r\n]+/;

    const allEvents = [];
    const keywordsFoundEvents = new Set();

    // Iterate over each file's content and split into events
    for (let i = 0; i < fileContent.length; i++) {
      const events = fileContent[i].split(lineBreakerPattern);

      // Iterate over each event and add keywords found if provided
      for (let j = 0; j < events.length; j++) {
        const eventObj = {
          eventNumber: i * limit + j + 1,
          eventData: events[j],
        };

        // Check for keywords and add "keywordsFound" attribute if found
        if (keywords) {
          const eventKeywords = [];
          for (const keyword of keywords.split(',')) {
            if (events[j].includes(keyword)) {
              eventKeywords.push(keyword);
              keywordsFoundEvents.add(i * limit + j + 1);
            }
          }
          eventObj.keywordsFound = eventKeywords;
        }

        allEvents.push(eventObj);
      }
    }

    // Calculate the total number of pages based on the limit and event count
    const totalPages = Math.ceil(allEvents.length / limit);

    // Apply pagination to the events
    const paginatedEvents = allEvents.slice((page - 1) * limit, page * limit);

    res.status(200).json({
      totalPages: totalPages,
      totalCount: allEvents.length,
      keywordsFoundInEvents: Array.from(keywordsFoundEvents),
      events: paginatedEvents,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching file content.');
  }

}



const searchAndRetrieveContents = async (req, res) => {
  try {
    const { index, keywords, datetimeRange, page = 1, limit = 100, linebreaker } = req.query;

    // Use a different collection if index is specified
    const collectionName = index ? `files_${index}` : 'files';
    const Collection = mongoose.connection.collection(collectionName);

    // Retrieve Bloom filters from the MongoDB collection
    const filters = await Collection.find({}).toArray();
    console.log("filters")
    console.log(filters)
    const matchingFiles = [];

    // Perform search using Bloom filters
    for (const filter of filters) {
      const bloomFilter = {
        size: process.env.BLOOM_FILTER_SIZE,  //filter.bloomFilter.size ,
        bitArray: filter.bloomFilter.bitArray,
        hashFunctions: filter.bloomFilter.hashFunctions.map((hashFnStr) => eval(`(${hashFnStr})`)),
        contains: function(item) {
          for (let i = 0; i < this.hashFunctions.length; i++) {
            const hash = this.hashFunctions[i](item);
            if (!this.bitArray[hash]) {
              return false;
            }
          }
          return true;
        },
      };

      // Check if keywords are likely to be present using Bloom filter
      let isLikelyPresent = true;
      for (const keyword of keywords) {
        if (!bloomFilter.contains(keyword)) {
          isLikelyPresent = false;
          break;
        }
      }

      if (isLikelyPresent) {
        // Fetch the file data from the File collection
        const fileData = await TextModel.findOne({ name: filter.name });

        matchingFiles.push({
          name: filter.name,
          addedAt: fileData.addedAt,
          id: fileData._id,
        });
      }
    }

    // Convert matching file IDs to an array
    const matchingFileIds = matchingFiles.map((file) => file.id);

    // Fetch the files with the matching IDs
    const files = await TextModel.find({ _id: { $in: matchingFileIds } })
      .sort({ addedAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Extract the file content from the files array
    const fileContent = files.map((file) => file.data.toString());

    // Set the line breaker pattern (default: [\r\n]+)
    const lineBreakerPattern = linebreaker ? new RegExp(linebreaker) : /[\r\n]+/;

    const allEvents = [];
    const keywordsFoundEvents = new Set();

    // Iterate over each file's content and split into events
    for (let i = 0; i < fileContent.length; i++) {
      const events = fileContent[i].split(lineBreakerPattern);

      // Iterate over each event and add keywords found if provided
      for (let j = 0; j < events.length; j++) {
        const eventObj = {
          eventNumber: (page - 1) * limit + i * limit + j + 1,
          eventData: events[j],
          index: index,
          host: files[i].host,
          source: files[i].source,
          addedAt: files[i].addedAt,
        };

        // Check for keywords and add "keywordsFound" attribute if found
        if (keywords) {
          const eventKeywords = [];
          for (const keyword of keywords) {
            if (events[j].includes(keyword)) {
              eventKeywords.push(keyword);
              keywordsFoundEvents.add((page - 1) * limit + i * limit + j + 1);
            }
          }
          eventObj.keywordsFound = eventKeywords;
        }

        allEvents.push(eventObj);
      }
    }

    // Calculate the total number of pages based on the limit and event count
    const totalPages = Math.ceil(allEvents.length / limit);

    // Apply pagination to the events
    const paginatedEvents = allEvents.slice((page - 1) * limit, page * limit);

    res.status(200).json({
      totalPages: totalPages,
      totalCount: allEvents.length,
      keywordsFoundInEvents: Array.from(keywordsFoundEvents),
      events: paginatedEvents,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error searching and retrieving file contents.');
  }
};

module.exports = { searchRecords, fetchFilesContents, searchAndRetrieveContents };
