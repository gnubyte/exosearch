const chunkUpload = (buffer, chunkSize = 1024) => {
    const chunks = [];
    let offset = 0;
  
    while (offset < buffer.length) {
      chunks.push(buffer.slice(offset, offset + chunkSize));
      offset += chunkSize;
    }
  
    return chunks;
  };
  
  module.exports = chunkUpload;
  