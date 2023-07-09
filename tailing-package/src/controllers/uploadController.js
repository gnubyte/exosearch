const axios = require('axios');

const uploadData = async (data, server) => {
  const { url, apiKey } = server;

  try {
    await axios.post(url, { data }, { headers: { 'X-API-Key': apiKey } });
  } catch (error) {
    console.error(`Failed to upload data to server: ${error.message}`);
  }
};

module.exports = { uploadData };
