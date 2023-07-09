const fs = require('fs');
const readline = require('readline');
const uploadController = require('./uploadController');
const chunkUpload = require('../utils/chunkUpload');

const startTailing = (inputConfigPath, outputConfigPath) => {
  const inputConfigFiles = fs.readdirSync(inputConfigPath);
  const outputConfigFiles = fs.readdirSync(outputConfigPath);

  for (const inputFile of inputConfigFiles) {
    const inputFilePath = `${inputConfigPath}/${inputFile}`;
    const inputConfig = JSON.parse(fs.readFileSync(inputFilePath, 'utf8'));

    const outputFilePath = `${outputConfigPath}/${inputConfig.output}`;
    const outputConfig = JSON.parse(fs.readFileSync(outputFilePath, 'utf8'));

    tailAndUploadFile(inputConfig.file, inputConfig.delimiter, outputConfig.servers);
  }
};

const tailAndUploadFile = (filePath, delimiter, servers) => {
  const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: stream });

  let buffer = '';
  let keywords = [];

  rl.on('line', async (line) => {
    buffer += line + '\n';
    const chunks = buffer.split(delimiter);
    buffer = chunks.pop();

    const dataChunks = chunkUpload(chunks);

    for (const server of servers) {
      await uploadChunks(dataChunks, server, keywords);
    }
  });

  rl.on('close', async () => {
    const dataChunks = chunkUpload([buffer]);

    for (const server of servers) {
      await uploadChunks(dataChunks, server, keywords);
    }
  });
};

const uploadChunks = async (dataChunks, server, keywords) => {
  const { url, apiKey } = server;

  for (let i = 0; i < dataChunks.length; i++) {
    const data = dataChunks[i];
    const isLastChunk = i === dataChunks.length - 1;

    await uploadController.uploadData(data, server, keywords, isLastChunk);
  }
};

module.exports = { startTailing };
