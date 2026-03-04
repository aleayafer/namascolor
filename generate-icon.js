const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const S = 256;
const rawData = Buffer.alloc((S * 4 + 1) * S);

// Rainbow color palette for the goat
const colors = [
  [232,68,58],   // red
  [245,166,35],  // orange
  [251,219,91],  // yellow
  [80,200,120],  // green
  [110,164,195], // blue
  [50,50,130],   // indigo
  [160,90,180],  // violet
  [232,68,58],   // red again
];

function hslToRgb(h, s, l) {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;
  if (s === 0) { r = g = b = l; }
  else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// Get rainbow color based on y position (0-255)
function getRainbow(y) {
  const hue = (y / S) * 360;
  return hslToRgb(hue, 85, 55);
}

function setPixel(x, y, r, g, b, a = 255) {
  if (x < 0 || x >= S || y < 0 || y >= S) return;
  const off = y * (S * 4 + 1) + 1 + x * 4;
  rawData[off] = r; rawData[off+1] = g; rawData[off+2] = b; rawData[off+3] = a;
}

function fillCircle(cx, cy, radius, r, g, b) {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx*dx + dy*dy <= radius*radius) {
        setPixel(cx+dx, cy+dy, r, g, b);
      }
    }
  }
}

function fillEllipse(cx, cy, rx, ry, colorFn) {
  for (let dy = -ry; dy <= ry; dy++) {
    for (let dx = -rx; dx <= rx; dx++) {
      if ((dx*dx)/(rx*rx) + (dy*dy)/(ry*ry) <= 1) {
        const [r,g,b] = colorFn(cy + dy);
        setPixel(cx+dx, cy+dy, r, g, b);
      }
    }
  }
}

// Initialize all pixels with filter byte
for (let y = 0; y < S; y++) {
  rawData[y * (S * 4 + 1)] = 0;
}

// === Draw rounded background ===
const margin = 6, rad = 36;
for (let y = 0; y < S; y++) {
  for (let x = 0; x < S; x++) {
    let inside = true;
    const x1 = margin, y1 = margin, x2 = S-margin, y2 = S-margin;
    if (x < x1 || x >= x2 || y < y1 || y >= y2) { inside = false; }
    else {
      const cns = [[x1+rad,y1+rad],[x2-rad,y1+rad],[x1+rad,y2-rad],[x2-rad,y2-rad]];
      for (const [cx,cy] of cns) {
        const inR = (x<x1+rad&&y<y1+rad&&cx===x1+rad&&cy===y1+rad) ||
                    (x>=x2-rad&&y<y1+rad&&cx===x2-rad&&cy===y1+rad) ||
                    (x<x1+rad&&y>=y2-rad&&cx===x1+rad&&cy===y2-rad) ||
                    (x>=x2-rad&&y>=y2-rad&&cx===x2-rad&&cy===y2-rad);
        if (inR) { const dx=x-cx, dy=y-cy; if(dx*dx+dy*dy>rad*rad) inside=false; break; }
      }
    }
    if (inside) setPixel(x, y, 35, 35, 55);
  }
}

// === GOAT HEAD — stylized, facing left ===

// Head (main oval) — rainbow colored
fillEllipse(128, 138, 62, 68, getRainbow);

// Snout (lower, slightly forward)
fillEllipse(108, 178, 32, 24, getRainbow);

// Beard (triangular strands below chin)
for (let i = 0; i < 30; i++) {
  const bx = 108 + Math.sin(i * 0.3) * 12;
  const by = 200 + i;
  const bw = Math.max(2, 14 - i * 0.4);
  for (let dx = -bw; dx <= bw; dx++) {
    const [r,g,b] = getRainbow(by);
    setPixel(Math.round(bx+dx), by, r, g, b);
  }
}

// Left horn (curved up and back)
for (let t = 0; t < 50; t++) {
  const progress = t / 50;
  const hx = 90 - progress * 30 + Math.sin(progress * 2.5) * 15;
  const hy = 85 - progress * 50;
  const thickness = 10 - progress * 5;
  const [r,g,b] = getRainbow(hy + 60);
  fillCircle(Math.round(hx), Math.round(hy), Math.max(2, Math.round(thickness)), r, g, b);
}

// Right horn (curved up and forward)
for (let t = 0; t < 50; t++) {
  const progress = t / 50;
  const hx = 160 + progress * 25 + Math.sin(progress * 2.5) * 12;
  const hy = 85 - progress * 48;
  const thickness = 10 - progress * 5;
  const [r,g,b] = getRainbow(hy + 60);
  fillCircle(Math.round(hx), Math.round(hy), Math.max(2, Math.round(thickness)), r, g, b);
}

// Left ear
fillEllipse(78, 100, 14, 22, (y) => getRainbow(y - 20));

// Right ear
fillEllipse(175, 100, 14, 22, (y) => getRainbow(y - 20));

// Eye (white with dark pupil)
fillCircle(110, 125, 12, 255, 255, 255);
fillCircle(108, 125, 6, 30, 30, 50);
fillCircle(106, 123, 2, 255, 255, 255); // eye highlight

// Nose dots
fillCircle(95, 175, 4, 50, 40, 60);
fillCircle(115, 175, 4, 50, 40, 60);

// Mouth line
for (let dx = -18; dx <= 18; dx++) {
  const mx = 105 + dx;
  const my = 188 + Math.abs(dx) * 0.15;
  setPixel(mx, Math.round(my), 50, 40, 60);
  setPixel(mx, Math.round(my)+1, 50, 40, 60);
}

// === Add sparkle/color dots around the goat ===
const sparkles = [
  [42, 50, [232,68,58]], [210, 45, [251,219,91]], [220, 140, [80,200,120]],
  [38, 170, [110,164,195]], [195, 210, [245,166,35]], [50, 220, [160,90,180]],
  [180, 55, [232,68,58]], [55, 100, [251,219,91]],
];
for (const [sx, sy, [r,g,b]] of sparkles) {
  fillCircle(sx, sy, 5, r, g, b);
  // 4-point star
  for (let d = 1; d <= 8; d++) {
    const a = Math.max(255 - d * 30, 80);
    setPixel(sx+d, sy, r, g, b); setPixel(sx-d, sy, r, g, b);
    setPixel(sx, sy+d, r, g, b); setPixel(sx, sy-d, r, g, b);
  }
}

// === PNG encoding ===
const deflated = zlib.deflateSync(rawData, { level: 9 });

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
ihdr.writeUInt32BE(S, 0); ihdr.writeUInt32BE(S, 4);
ihdr[8] = 8; ihdr[9] = 6;
const png = Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', deflated), chunk('IEND', Buffer.alloc(0))]);
fs.writeFileSync(path.join(__dirname, 'assets', 'icon.png'), png);

// ICO
const icoH = Buffer.alloc(6);
icoH.writeUInt16LE(0,0); icoH.writeUInt16LE(1,2); icoH.writeUInt16LE(1,4);
const icoE = Buffer.alloc(16);
icoE[0] = 0; icoE[1] = 0;
icoE[2] = 0; icoE[3] = 0;
icoE.writeUInt16LE(1,4); icoE.writeUInt16LE(32,6);
icoE.writeUInt32LE(png.length,8); icoE.writeUInt32LE(22,12);
const ico = Buffer.concat([icoH, icoE, png]);
fs.writeFileSync(path.join(__dirname, 'assets', 'icon.ico'), ico);

console.log(`icon.png: ${png.length} bytes (${S}x${S})`);
console.log(`icon.ico: ${ico.length} bytes`);
