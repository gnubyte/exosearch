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



/*

To analyze the time complexity of the `searchAndRetrieveContents` function, let's break it down into its major components:

1. Retrieving Bloom filters from the MongoDB collection: This operation depends on the number of filters in the collection and has a complexity of O(N), where N is the number of filters.

2. Performing search using Bloom filters: This step involves iterating over the filters and checking if the keywords are likely present using the Bloom filter. Since the Bloom filter size is typically small and constant, the complexity can be considered constant, O(1).

3. Fetching file data from the TextModel collection: This operation depends on the number of matching filters and has a complexity of O(M), where M is the number of matching filters.

4. Building query conditions for events: The complexity of this step depends on the number of keywords provided and has a complexity of O(K), where K is the number of keywords.

5. Fetching files with matching IDs and query conditions: This operation depends on the number of files matching the query conditions and has a complexity of O(P), where P is the number of matching files.

6. Extracting file content and splitting into events: This step involves iterating over the file content and splitting it into events. The complexity depends on the total number of events and can be considered O(E), where E is the total number of events.

7. Calculating the total number of pages: This step involves dividing the total number of events by the limit and has a complexity of O(1).

8. Applying pagination to the events: The complexity depends on the limit and has a complexity of O(L), where L is the limit.

Considering all these components, the overall time complexity of the `searchAndRetrieveContents` function can be approximated as:

O(N) + O(1) + O(M) + O(K) + O(P) + O(E) + O(1) + O(L)

Simplifying the expression, we can approximate it as:

O(N + M + K + P + E + L)

Keep in mind that this analysis assumes that the individual database operations (e.g., finding filters, finding file data, querying events) have a time complexity that aligns with their typical behavior. The actual performance may vary based on factors such as database indexing, data size, and hardware resources.
*/


const searchAndRetrieveContents = async (req, res) => {
  try {
    const { index, source, host, keywords, datetimeRange, page = 1, limit = 100, linebreaker } = req.query;

    // Use a different collection if index is specified
    const collectionName = index ? `files_${index}` : 'files';
    const Collection = mongoose.connection.collection(collectionName);

    // Build the query conditions
    const queryConditions = {};

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
      if (keywords && Array.isArray(keywords)) {
        for (const keyword of keywords) {
          if (!bloomFilter.contains(keyword)) {
            isLikelyPresent = false;
            break;
          }
        }
      } else {
        isLikelyPresent = false;
      }

      if (isLikelyPresent) {
        // Fetch the file data from the TextModel collection
        const fileData = await TextModel.findOne({ name: filter.name });

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
    
    // Prepare the keyword filters
    const keywordFilters = (keywords && Array.isArray(keywords) && keywords.length > 0)
      ? keywords.map(keyword => ({ "eventData": { $regex: keyword, $options: "i" } }))
      : [];

    // Prepare the datetime filter
    const datetimeFilter = {
      $gte: new Date(datetimeRange.split(' - ')[0]),
      $lte: new Date(datetimeRange.split(' - ')[1])
    };

    // Build the query conditions for events
    const eventQueryConditions = {
      _id: { $in: matchingFileIds },
      addedAt: datetimeFilter,
    };

    if (keywordFilters.length > 0) {
      eventQueryConditions.$or = keywordFilters;
    }

    // Fetch the files with the matching IDs and query conditions
    const files = await TextModel.find(eventQueryConditions)
      .sort({ addedAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

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
        const eventObj = {
          eventNumber: (page - 1) * limit + i * limit + j + 1,
          eventData: events[j],
          host: files[i].host,
          addedAt: files[i].addedAt,
        };

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
      events: paginatedEvents,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error searching and retrieving file contents.');
  }
};





module.exports = { searchRecords, fetchFilesContents, searchAndRetrieveContents };
