const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const width = 256;
const height = 256;

// Create raw pixel data (RGBA) with filter byte per row
const rawData = Buffer.alloc((width * 4 + 1) * height);
const radius = 40;

for (let y = 0; y < height; y++) {
  const rowOffset = y * (width * 4 + 1);
  rawData[rowOffset] = 0; // filter: none
  for (let x = 0; x < width; x++) {
    const offset = rowOffset + 1 + x * 4;

    // Rounded rectangle
    let inside = true;
    const m = 8;
    const x1 = m, y1 = m, x2 = width - m, y2 = height - m;
    const r = radius;

    if (x < x1 || x >= x2 || y < y1 || y >= y2) {
      inside = false;
    } else {
      const corners = [[x1+r,y1+r],[x2-r,y1+r],[x1+r,y2-r],[x2-r,y2-r]];
      for (const [cx, cy] of corners) {
        const inRegion =
          (x < x1+r && y < y1+r && cx===x1+r && cy===y1+r) ||
          (x >= x2-r && y < y1+r && cx===x2-r && cy===y1+r) ||
          (x < x1+r && y >= y2-r && cx===x1+r && cy===y2-r) ||
          (x >= x2-r && y >= y2-r && cx===x2-r && cy===y2-r);
        if (inRegion) {
          const dx = x - cx, dy = y - cy;
          if (dx*dx + dy*dy > r*r) inside = false;
          break;
        }
      }
    }

    if (inside) {
      rawData[offset] = 0xE8;
      rawData[offset+1] = 0x44;
      rawData[offset+2] = 0x3A;
      rawData[offset+3] = 0xFF;
    } else {
      rawData[offset] = rawData[offset+1] = rawData[offset+2] = rawData[offset+3] = 0;
    }
  }
}

// Draw "NC" letters as block pixels
const letters = {
  N: [[1,0,0,0,1],[1,1,0,0,1],[1,0,1,0,1],[1,0,1,0,1],[1,0,0,1,1],[1,0,0,1,1],[1,0,0,0,1]],
  C: [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,1],[0,1,1,1,0]]
};

function drawLetter(letter, sx, sy, cell) {
  const d = letters[letter];
  for (let row = 0; row < d.length; row++) {
    for (let col = 0; col < d[row].length; col++) {
      if (!d[row][col]) continue;
      for (let dy = 0; dy < cell; dy++) {
        for (let dx = 0; dx < cell; dx++) {
          const px = sx + col*cell + dx;
          const py = sy + row*cell + dy;
          if (px < 0 || px >= width || py < 0 || py >= height) continue;
          const off = py*(width*4+1) + 1 + px*4;
          rawData[off] = rawData[off+1] = rawData[off+2] = rawData[off+3] = 0xFF;
        }
      }
    }
  }
}

const cell = 16;
const lw = 5*cell, gap = 12;
const sx = Math.floor((width - lw*2 - gap) / 2);
const sy = Math.floor((height - 7*cell) / 2);
drawLetter('N', sx, sy, cell);
drawLetter('C', sx + lw + gap, sy, cell);

const deflated = zlib.deflateSync(rawData);

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  const table = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c&1 ? 0xEDB88320^(c>>>1) : c>>>1;
    table[i] = c;
  }
  for (let i = 0; i < buf.length; i++) crc = table[(crc^buf[i])&0xFF] ^ (crc>>>8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const combined = Buffer.concat([t, data]);
  const c = Buffer.alloc(4);
  c.writeUInt32BE(crc32(combined));
  return Buffer.concat([len, combined, c]);
}

const sig = Buffer.from([137,80,78,71,13,10,26,10]);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(width, 0);
ihdr.writeUInt32BE(height, 4);
ihdr[8] = 8; ihdr[9] = 6;
const png = Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', deflated), chunk('IEND', Buffer.alloc(0))]);

fs.writeFileSync(path.join(__dirname, 'assets', 'icon.png'), png);

// ICO with 256x256 PNG
const icoH = Buffer.alloc(6);
icoH.writeUInt16LE(0,0); icoH.writeUInt16LE(1,2); icoH.writeUInt16LE(1,4);
const icoE = Buffer.alloc(16);
icoE[0] = 0; icoE[1] = 0; // 256 stored as 0
icoE[2] = 0; icoE[3] = 0;
icoE.writeUInt16LE(1,4); icoE.writeUInt16LE(32,6);
icoE.writeUInt32LE(png.length,8); icoE.writeUInt32LE(22,12);
const ico = Buffer.concat([icoH, icoE, png]);
fs.writeFileSync(path.join(__dirname, 'assets', 'icon.ico'), ico);

console.log(`icon.png: ${png.length} bytes (${width}x${height})`);
console.log(`icon.ico: ${ico.length} bytes`);
