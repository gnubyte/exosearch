const fs = require('fs');
const readline = require('readline');
const uploadController = require('./uploadController');
const chunkUpload = require('../utils/chunkUpload');
const crypto = require('crypto');

const log = (message) => {
  fs.appendFileSync('runtime.log', `${new Date().toISOString()} - ${message}\n`);
};

const CHUNK_SIZE = 10000;

const startTailing = (inputConfigPath, outputConfigPath) => {
  const inputConfigFiles = fs.readdirSync(inputConfigPath);
  const outputConfigFiles = fs.readdirSync(outputConfigPath);

  for (const inputFile of inputConfigFiles) {
    const inputFilePath = `${inputConfigPath}/${inputFile}`;
    const inputConfig = JSON.parse(fs.readFileSync(inputFilePath, 'utf8'));

    const outputFilePath = `${outputConfigPath}/${inputConfig.output}`;
    const outputConfig = JSON.parse(fs.readFileSync(outputFilePath, 'utf8'));

    const processedData = loadProcessedData(inputConfig.file);
    tailAndUploadFile(inputConfig.file, inputConfig.delimiter, outputConfig.servers, processedData);
  }
};

const loadProcessedData = (filePath) => {
  const hashFilePath = `${filePath}.hash`;
  if (fs.existsSync(hashFilePath)) {
    return fs.readFileSync(hashFilePath, 'utf8').trim();
  }
  return '';
};

const saveProcessedData = (filePath, hash) => {
  const hashFilePath = `${filePath}.hash`;
  fs.writeFileSync(hashFilePath, hash);
};

const tailAndUploadFile = (filePath, delimiter, servers, processedData) => {
  const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: stream });

  let buffer = '';
  let keywords = [];

  let lineCount = 0;

  rl.on('line', async (line) => {
    buffer += line + '\n';
    lineCount++;

    if (lineCount >= CHUNK_SIZE) {
      const chunks = buffer.split(new RegExp(delimiter));
      buffer = chunks.pop();

      const dataChunks = chunkUpload(chunks);

      for (const server of servers) {
        try {
          await uploadChunks(dataChunks, server, keywords);
          log(`Uploaded ${dataChunks.length} chunk(s) to server: ${server.url}`);
        } catch (error) {
          log(`Failed to upload data to server: ${server.url}`);
          log(`Error: ${error.message}`);
        }
      }

      lineCount = 0;
    }
  });

  rl.on('close', async () => {
    const dataChunks = chunkUpload([buffer]);

    for (const server of servers) {
      try {
        await uploadChunks(dataChunks, server, keywords);
        log(`Uploaded last chunk to server: ${server.url}`);
      } catch (error) {
        log(`Failed to upload data to server: ${server.url}`);
        log(`Error: ${error.message}`);
      }
    }

    const hash = crypto.createHash('md5').update(buffer).digest('hex');
    if (hash !== processedData) {
      saveProcessedData(filePath, hash);
    }
  });
};

const uploadChunks = async (dataChunks, server, keywords) => {
  const { url, apiKey } = server;

  for (let i = 0; i < dataChunks.length; i++) {
    const data = dataChunks[i];
    const isLastChunk = i === dataChunks.length - 1;

    try {
      await uploadController.uploadData(data, server, keywords, isLastChunk);
    } catch (error) {
      throw new Error(`Failed to upload data to server: ${server.url}`);
    }
  }
};

module.exports = { startTailing };
