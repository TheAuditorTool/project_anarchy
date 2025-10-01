#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'large_file.bin');
const fileSize = 110 * 1024 * 1024; // 110 MB
const chunkSize = 1024 * 1024; // 1 MB chunks

console.log('Generating large_file.bin (110 MB)...');

const writeStream = fs.createWriteStream(filePath);
const buffer = Buffer.alloc(chunkSize, 0);

let written = 0;
while (written < fileSize) {
  const toWrite = Math.min(chunkSize, fileSize - written);
  writeStream.write(buffer.slice(0, toWrite));
  written += toWrite;
}

writeStream.end(() => {
  console.log('✓ large_file.bin generated successfully');
});
