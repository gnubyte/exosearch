const fetch = require('node-fetch');
const fs = require('fs');

const uploadData = async (data, server, index, source) => {
  const { url, apiKey } = server;

  try {
    const formData = new FormData();
    const fileStream = fs.createReadStream(data);

    formData.append('file', fileStream);
    formData.append('index', index);
    formData.append('source', source);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'authorization': 'Bearer ' + apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload data to server: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error(`Failed to upload data to server: ${error.message}`);
  }
};

module.exports = { uploadData };
