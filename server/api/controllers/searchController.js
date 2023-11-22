const mongoose = require('mongoose');
const TextModel = require('../models/textModel');
const db = mongoose.connection.db;
const crypto = require('crypto');
const moment = require('moment');

// Utility function to parse timestamp from event
const parseTimestamp = (eventData) => {
  const timestampRegex = /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/;
  const match = eventData.match(timestampRegex);
  if (match) {
    const timestamp = match[0];
    return moment(timestamp).format('YYYY-MM-DD HH:mm:ss');
  }
  return null;
};

const searchRecords = async (req, res) => {
  try {
    const {
      index,
      keywords,
      datetimeRange
    } = req.query;

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
        contains: (item) => {
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
        const fileData = await File.findOne({
          name: filter.name
        });

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
    const {
      page = 1, limit = 100, ids, linebreaker, keywords
    } = req.query;

    // Convert ids to an array
    const idArray = ids.split(',');

    // Fetch the files with the provided ids
    const files = await File.find({
      _id: {
        $in: idArray
      }
    }).sort({
      addedAt: 1
    });

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

const getIndexesWithRecordCount = async (req, res) => {
  try {
    const {
      page = 1, limit = 10
    } = req.query;
    const skip = (page - 1) * limit;

    // Get the distinct indexes from the collection
    const distinctIndexes = await TextModel.distinct('index');

    const indexesWithRecordCount = [];

    // Iterate over each distinct index
    for (const index of distinctIndexes) {
      // Count the number of records per index
      const recordCount = await TextModel.countDocuments({
        index
      });

      indexesWithRecordCount.push({
        index,
        recordCount,
      });
    }

    // Calculate the total number of pages
    const totalPages = Math.ceil(indexesWithRecordCount.length / limit);

    // Get the paginated results based on the skip and limit values
    const paginatedResults = indexesWithRecordCount.slice(skip, skip + limit);

    res.status(200).json({
      totalPages,
      indexes: paginatedResults,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error retrieving indexes with record count.');
  }
};


const searchEvents = async (req, res) => {

  //TODO: replace linebreaker with regex extracts
  //since events will just be uploaded to the server/saved to disk
  //linebreakers are irrelevant
  //we should switch the focus to the value extracted from the fields instead
  //let the linebreakers be on the forwarder inputs for how to break apart the events
  try {
    const {
      index = "*",
      source = "*",
      host = "*",
      keywords = [],
      startDateTime = "*",
      endDateTime = "*",
      page = 1,
      limit = 100,
      linebreaker = "[\r\n]"
    } = req.query;
    if (index == "*"){
      res.status(400).json("index field must have a valid name")
    }
    const skipAmount = (page - 1) * limit;
    const collectionName = index ? `data_${index}` : 'files';
    const Collection = mongoose.connection.collection(collectionName);

    // Create an object to represent the query conditions
    const queryConditions = {
      source: source !== '*' ? source : undefined,
      host: host !== '*' ? host : undefined,
      addedAt: {
        $gte: startDateTime !== '*' ? startDateTime : undefined,
        $lte: endDateTime !== '*' ? endDateTime : undefined
      },
    };

    if (keywords != []) {
      const regexPattern = new RegExp(keywords.map(word => `.*${word}.*`).join('|'), 'i');
      queryConditions.data = { $regex: regexPattern };
    }

    // Remove properties with value '*'
    Object.keys(queryConditions).forEach(key => queryConditions[key] === undefined && delete queryConditions[key]);
    if (startDateTime == "*" && endDateTime == "*"){
      delete queryConditions.addedAt
    }
    //console.log(queryConditions)
    const results = await Collection.find(queryConditions)
      .skip(skipAmount)
      .limit(limit)
      .toArray();

    //console.log(results);
    res.status(200).json(results);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error searching and retrieving file contents.');
  }
};


const searchAndRetrieveContents = async (req, res) => {
  //depreciated
  try {
    // Start the timer to measure the search duration
    const searchStartTime = new Date();

    var {
      index,
      source,
      host,
      keywords,
      datetimeRange,
      page = 1,
      limit = 100,
      linebreaker
    } = req.query;
    console.log(`index: ${index}, source: ${source}, host: ${host}, keywords: ${keywords}, datetimeRange: ${datetimeRange}, page: ${page}, limit: ${limit}, linebreaker: ${linebreaker}`);

    // Use a different collection if index is specified
    const collectionName = index ? `files_${index}` : 'files';
    const Collection = mongoose.connection.collection(collectionName);

    // Build the query conditions
    const queryConditions = {};
    if (!linebreaker || linebreaker === undefined) {
      linebreaker = /[\r\n]+/;
    }

    if (typeof limit === 'string') {
      limit = Number(limit);
    }
    if (typeof page === 'string') {
      page = Number(page);
    }

    if (source) {
      queryConditions.source = source;
    }

    if (host) {
      queryConditions.host = host;
    }

    // Retrieve Bloom filters from the MongoDB collection
    const filters = await Collection.find(queryConditions).toArray();
    console.log("filters");
    console.log(filters);
    const matchingFiles = [];
    console.log(matchingFiles);

    // Perform search using Bloom filters
    for (const filter of filters) {
      const bloomFilter = {
        size: process.env.BLOOM_FILTER_SIZE,
        bitArray: filter.bloomFilter.bitArray,
        hashFunctions: filter.bloomFilter.hashFunctions.map((hashFnStr) => eval(`(${hashFnStr})`)),
        contains: function (item) {
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

      // keywords might not have been passed into the HTTP GET
      if (keywords) {
        if (Array.isArray(keywords)) {
          for (const keyword of keywords) {
            if (!bloomFilter.contains(keyword)) {
              isLikelyPresent = false;
              break;
            }
          }
        } else {
          isLikelyPresent = false;
        }
        console.log(matchingFiles);
        if (isLikelyPresent) {
          // Fetch the file data from the TextModel collection
          const fileData = await TextModel.findOne({
            name: filter.name
          });

          matchingFiles.push({
            name: filter.name,
            addedAt: fileData.addedAt,
            id: fileData._id,
            host: fileData.host,
            source: fileData.source,
            index: fileData.index,
          });
        }
      } else {
        const fileData = await TextModel.findOne({
          name: filter.name
        });
        matchingFiles.push({
          name: filter.name,
          addedAt: fileData.addedAt,
          id: fileData._id,
          host: fileData.host,
          source: fileData.source,
          index: fileData.index,
        });
      }
    }

    // Convert matching file IDs to an array
    const matchingFileIds = matchingFiles.map((file) => file.id);
    console.log(`Matching file Ids: ${matchingFileIds}`);

    // Prepare the datetime filter
    const datetimeFilter = {
      $gte: new Date(datetimeRange.split(' - ')[0]),
      $lte: new Date(datetimeRange.split(' - ')[1])
    };

    // Fetch the files with the matching IDs and query conditions
    const files = await TextModel.find({
        _id: {
          $in: matchingFileIds
        },
        addedAt: datetimeFilter
      })
      .sort({
        addedAt: 1
      });

    // Extract the file content from the files array
    const fileContent = files.map((file) => file.data.toString());

    // Set the line breaker pattern (default: [\r\n]+)
    const lineBreakerPattern = linebreaker ? new RegExp(linebreaker) : /[\r\n]+/;

    const allEvents = [];

    // Iterate over each file's content and split into events
    for (let i = 0; i < fileContent.length; i++) {
      const events = fileContent[i].split(lineBreakerPattern);

      // Iterate over each event and add keywords found if provided
      for (let j = 0; j < events.length; j++) {
        const eventData = events[j];
        const timestamp = parseTimestamp(eventData); // Parse timestamp from event

        const eventObj = {
          eventNumber: i * limit + j + 1,
          eventData: eventData,
          host: files[i].host,
          source: files[i].source,
          addedAt: files[i].addedAt,
          timestamp: timestamp, // Include the parsed timestamp in the event object
        };

        allEvents.push(eventObj);
      }
    }

    // Filter events by keyword (if provided)
    const filteredEvents = keywords ?
      allEvents.filter(event => {
        const keywordFilters = Array.isArray(keywords) ?
          keywords.map(keyword => new RegExp(keyword, 'i')) :
          [new RegExp(keywords, 'i')];
        return keywordFilters.some(filter => filter.test(event.eventData)) &&
          event.addedAt >= datetimeFilter.$gte && event.addedAt <= datetimeFilter.$lte;
      }) :
      allEvents.filter(event => event.addedAt >= datetimeFilter.$gte && event.addedAt <= datetimeFilter.$lte);

    // Apply pagination to the events
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedEvents = filteredEvents.slice(startIndex, endIndex);

    // Calculate the total number of pages based on the limit and event count
    const totalPages = Math.ceil(filteredEvents.length / limit);

    // Get the search duration in milliseconds
    const searchEndTime = new Date();
    const searchDuration = searchEndTime - searchStartTime;

    res.status(200).json({
      totalPages: totalPages,
      totalCount: filteredEvents.length,
      events: paginatedEvents,
      searchDuration: searchDuration,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error searching and retrieving file contents.');
  }
};



module.exports = {
  searchRecords,
  fetchFilesContents,
  searchAndRetrieveContents,
  getIndexesWithRecordCount,
  searchEvents
};
