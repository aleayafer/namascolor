const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const S = 256;
const rawData = Buffer.alloc((S * 4 + 1) * S);

// --- Color helpers ---
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

// Smooth rainbow based on vertical position
function getRainbow(y) {
  const t = Math.max(0, Math.min(1, (y - 30) / (S - 60)));
  const hue = t * 300; // red → violet
  return hslToRgb(hue, 80, 58);
}

// Darker version for outlines
function getRainbowDark(y) {
  const t = Math.max(0, Math.min(1, (y - 30) / (S - 60)));
  const hue = t * 300;
  return hslToRgb(hue, 70, 35);
}

// --- Drawing primitives ---
function setPixel(x, y, r, g, b, a = 255) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || x >= S || y < 0 || y >= S) return;
  const off = y * (S * 4 + 1) + 1 + x * 4;
  rawData[off] = r; rawData[off+1] = g; rawData[off+2] = b; rawData[off+3] = a;
}

function getPixel(x, y) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || x >= S || y < 0 || y >= S) return [0,0,0,0];
  const off = y * (S * 4 + 1) + 1 + x * 4;
  return [rawData[off], rawData[off+1], rawData[off+2], rawData[off+3]];
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

function fillEllipse(cx, cy, rx, ry, r, g, b) {
  for (let dy = -ry; dy <= ry; dy++) {
    for (let dx = -rx; dx <= rx; dx++) {
      if ((dx*dx)/(rx*rx) + (dy*dy)/(ry*ry) <= 1) {
        setPixel(cx+dx, cy+dy, r, g, b);
      }
    }
  }
}

function fillEllipseGradient(cx, cy, rx, ry, colorFn) {
  for (let dy = -ry; dy <= ry; dy++) {
    for (let dx = -rx; dx <= rx; dx++) {
      if ((dx*dx)/(rx*rx) + (dy*dy)/(ry*ry) <= 1) {
        const [r,g,b] = colorFn(cy + dy);
        setPixel(cx+dx, cy+dy, r, g, b);
      }
    }
  }
}

// Outlined ellipse (fill + dark border)
function fillEllipseOutlined(cx, cy, rx, ry, colorFn, borderColorFn, borderW = 3) {
  // Border first
  for (let dy = -(ry+borderW); dy <= ry+borderW; dy++) {
    for (let dx = -(rx+borderW); dx <= rx+borderW; dx++) {
      const outer = (dx*dx)/((rx+borderW)*(rx+borderW)) + (dy*dy)/((ry+borderW)*(ry+borderW));
      const inner = (dx*dx)/(rx*rx) + (dy*dy)/(ry*ry);
      if (outer <= 1) {
        if (inner > 1) {
          const [r,g,b] = borderColorFn(cy + dy);
          setPixel(cx+dx, cy+dy, r, g, b);
        } else {
          const [r,g,b] = colorFn(cy + dy);
          setPixel(cx+dx, cy+dy, r, g, b);
        }
      }
    }
  }
}

function fillRect(x1, y1, x2, y2, r, g, b) {
  for (let y = y1; y <= y2; y++) {
    for (let x = x1; x <= x2; x++) {
      setPixel(x, y, r, g, b);
    }
  }
}

// Anti-aliased thick line
function drawLine(x1, y1, x2, y2, thickness, r, g, b) {
  const dist = Math.sqrt((x2-x1)**2 + (y2-y1)**2);
  const steps = Math.ceil(dist * 2);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const cx = x1 + (x2 - x1) * t;
    const cy = y1 + (y2 - y1) * t;
    fillCircle(Math.round(cx), Math.round(cy), Math.round(thickness), r, g, b);
  }
}

// --- Initialize filter bytes ---
for (let y = 0; y < S; y++) {
  rawData[y * (S * 4 + 1)] = 0;
}

// === ROUNDED BACKGROUND ===
const margin = 8, rad = 40;
for (let y = 0; y < S; y++) {
  for (let x = 0; x < S; x++) {
    let inside = true;
    const x1 = margin, y1 = margin, x2 = S-margin, y2 = S-margin;
    if (x < x1 || x >= x2 || y < y1 || y >= y2) { inside = false; }
    else {
      const corners = [[x1+rad,y1+rad],[x2-rad,y1+rad],[x1+rad,y2-rad],[x2-rad,y2-rad]];
      for (const [cx,cy] of corners) {
        const inCorner = (x<x1+rad && y<y1+rad && cx===x1+rad && cy===y1+rad) ||
                         (x>=x2-rad && y<y1+rad && cx===x2-rad && cy===y1+rad) ||
                         (x<x1+rad && y>=y2-rad && cx===x1+rad && cy===y2-rad) ||
                         (x>=x2-rad && y>=y2-rad && cx===x2-rad && cy===y2-rad);
        if (inCorner) {
          const dx = x-cx, dy = y-cy;
          if (dx*dx + dy*dy > rad*rad) inside = false;
          break;
        }
      }
    }
    if (inside) {
      // Subtle gradient background (slightly lighter at top)
      const bgL = 22 + (y / S) * 3;
      setPixel(x, y, bgL, bgL, bgL + 12);
    }
  }
}

// === GOAT HEAD — front-facing, centered ===
const CX = 128, CY = 142; // center of head

// --- HORNS (behind head, drawn first) ---
// Left horn — curves up and left
for (let t = 0; t < 60; t++) {
  const p = t / 60;
  const hx = CX - 42 - p * 32 - Math.sin(p * Math.PI) * 18;
  const hy = CY - 55 - p * 52;
  const thickness = 11 - p * 7;
  const [r,g,b] = getRainbow(hy + 50);
  fillCircle(Math.round(hx), Math.round(hy), Math.max(2, Math.round(thickness)), r, g, b);
}
// Right horn — mirrors left
for (let t = 0; t < 60; t++) {
  const p = t / 60;
  const hx = CX + 42 + p * 32 + Math.sin(p * Math.PI) * 18;
  const hy = CY - 55 - p * 52;
  const thickness = 11 - p * 7;
  const [r,g,b] = getRainbow(hy + 50);
  fillCircle(Math.round(hx), Math.round(hy), Math.max(2, Math.round(thickness)), r, g, b);
}

// --- EARS (behind head) ---
// Left ear — tilted outward
for (let dy = -24; dy <= 24; dy++) {
  for (let dx = -15; dx <= 15; dx++) {
    const rot = dx * 0.85 + dy * 0.53;
    const rot2 = -dx * 0.53 + dy * 0.85;
    if ((rot*rot)/(15*15) + (rot2*rot2)/(24*24) <= 1) {
      const px = CX - 62 + dx;
      const py = CY - 18 + dy;
      const [r,g,b] = getRainbow(py);
      setPixel(px, py, r, g, b);
    }
  }
}
// Inner ear (pink)
for (let dy = -14; dy <= 14; dy++) {
  for (let dx = -8; dx <= 8; dx++) {
    const rot = dx * 0.85 + dy * 0.53;
    const rot2 = -dx * 0.53 + dy * 0.85;
    if ((rot*rot)/(8*8) + (rot2*rot2)/(14*14) <= 1) {
      const px = CX - 62 + dx;
      const py = CY - 18 + dy;
      setPixel(px, py, 210, 140, 155);
    }
  }
}
// Right ear
for (let dy = -24; dy <= 24; dy++) {
  for (let dx = -15; dx <= 15; dx++) {
    const rot = dx * 0.85 - dy * 0.53;
    const rot2 = dx * 0.53 + dy * 0.85;
    if ((rot*rot)/(15*15) + (rot2*rot2)/(24*24) <= 1) {
      const px = CX + 62 + dx;
      const py = CY - 18 + dy;
      const [r,g,b] = getRainbow(py);
      setPixel(px, py, r, g, b);
    }
  }
}
// Inner right ear (pink)
for (let dy = -14; dy <= 14; dy++) {
  for (let dx = -8; dx <= 8; dx++) {
    const rot = dx * 0.85 - dy * 0.53;
    const rot2 = dx * 0.53 + dy * 0.85;
    if ((rot*rot)/(8*8) + (rot2*rot2)/(14*14) <= 1) {
      const px = CX + 62 + dx;
      const py = CY - 18 + dy;
      setPixel(px, py, 210, 140, 155);
    }
  }
}

// --- HEAD (main shape) ---
// Outline
fillEllipseOutlined(CX, CY, 56, 62, getRainbow, getRainbowDark, 3);

// --- SNOUT/MUZZLE (lighter area) ---
function getSnoutColor(y) {
  const [r,g,b] = getRainbow(y);
  // Lighten
  return [Math.min(255, r + 50), Math.min(255, g + 50), Math.min(255, b + 50)];
}
fillEllipseGradient(CX, CY + 30, 30, 22, getSnoutColor);

// --- EYES ---
// Left eye — white sclera
fillCircle(CX - 22, CY - 12, 14, 255, 255, 255);
// Horizontal rectangular pupil (goat-style!)
for (let dy = -4; dy <= 4; dy++) {
  for (let dx = -10; dx <= 10; dx++) {
    setPixel(CX - 22 + dx, CY - 12 + dy, 25, 25, 40);
  }
}
// Iris ring (dark golden)
for (let a = 0; a < 360; a++) {
  const rad = a * Math.PI / 180;
  for (let r = 9; r <= 13; r++) {
    const px = CX - 22 + Math.cos(rad) * r;
    const py = CY - 12 + Math.sin(rad) * r;
    // Only color outside the pupil area
    const dx = Math.round(px) - (CX - 22);
    const dy = Math.round(py) - (CY - 12);
    if (Math.abs(dx) > 9 || Math.abs(dy) > 3) {
      setPixel(px, py, 180, 150, 50);
    }
  }
}
// Eye highlight
fillCircle(CX - 26, CY - 16, 3, 255, 255, 255);

// Right eye
fillCircle(CX + 22, CY - 12, 14, 255, 255, 255);
for (let dy = -4; dy <= 4; dy++) {
  for (let dx = -10; dx <= 10; dx++) {
    setPixel(CX + 22 + dx, CY - 12 + dy, 25, 25, 40);
  }
}
for (let a = 0; a < 360; a++) {
  const rad = a * Math.PI / 180;
  for (let r = 9; r <= 13; r++) {
    const px = CX + 22 + Math.cos(rad) * r;
    const py = CY - 12 + Math.sin(rad) * r;
    const dx = Math.round(px) - (CX + 22);
    const dy = Math.round(py) - (CY - 12);
    if (Math.abs(dx) > 9 || Math.abs(dy) > 3) {
      setPixel(px, py, 180, 150, 50);
    }
  }
}
fillCircle(CX + 18, CY - 16, 3, 255, 255, 255);

// --- NOSTRILS ---
fillCircle(CX - 10, CY + 30, 4, 40, 35, 50);
fillCircle(CX + 10, CY + 30, 4, 40, 35, 50);

// --- MOUTH ---
for (let dx = -16; dx <= 16; dx++) {
  const mx = CX + dx;
  const curve = Math.abs(dx) * 0.12;
  const my = CY + 42 + curve;
  setPixel(mx, Math.round(my), 50, 40, 55);
  setPixel(mx, Math.round(my)+1, 50, 40, 55);
}

// --- BEARD ---
for (let i = 0; i < 35; i++) {
  const by = CY + 62 + i;
  const wave = Math.sin(i * 0.25) * 4;
  const width = Math.max(1, 16 - i * 0.42);
  for (let dx = -width; dx <= width; dx++) {
    const [r,g,b] = getRainbow(by);
    setPixel(Math.round(CX + dx + wave), by, r, g, b);
  }
}
// Beard tip
for (let i = 0; i < 8; i++) {
  const by = CY + 97 + i;
  const width = Math.max(0, 3 - i * 0.4);
  for (let dx = -width; dx <= width; dx++) {
    const [r,g,b] = getRainbow(by);
    setPixel(Math.round(CX + dx), by, r, g, b);
  }
}

// === SPARKLES around the goat ===
const sparkles = [
  [38, 42],  [215, 38],  [222, 145], [35, 175],
  [200, 215], [48, 225], [185, 50],  [52, 105],
];
for (const [sx, sy] of sparkles) {
  const [cr,cg,cb] = getRainbow(sy);
  fillCircle(sx, sy, 3, cr, cg, cb);
  // 4-point star rays
  for (let d = 1; d <= 7; d++) {
    const fade = Math.max(0, 255 - d * 35);
    const fr = Math.round(cr * fade / 255);
    const fg = Math.round(cg * fade / 255);
    const fb = Math.round(cb * fade / 255);
    setPixel(sx+d, sy, fr, fg, fb);
    setPixel(sx-d, sy, fr, fg, fb);
    setPixel(sx, sy+d, fr, fg, fb);
    setPixel(sx, sy-d, fr, fg, fb);
  }
}

// === PNG ENCODING ===
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

// ICO wrapper
const icoH = Buffer.alloc(6);
icoH.writeUInt16LE(0,0); icoH.writeUInt16LE(1,2); icoH.writeUInt16LE(1,4);
const icoE = Buffer.alloc(16);
icoE[0] = 0; icoE[1] = 0; icoE[2] = 0; icoE[3] = 0;
icoE.writeUInt16LE(1,4); icoE.writeUInt16LE(32,6);
icoE.writeUInt32LE(png.length,8); icoE.writeUInt32LE(22,12);
const ico = Buffer.concat([icoH, icoE, png]);
fs.writeFileSync(path.join(__dirname, 'assets', 'icon.ico'), ico);

// pbitool.json with icon embedded (correct format for Power BI)
const pbitool = {
  version: "1.0.0",
  name: "NamasColor",
  description: "Color Picker para Power BI",
  path: "C:\\Program Files\\NamasColor\\NamasColor.exe",
  iconData: "image/png;base64," + png.toString('base64')
};
fs.writeFileSync(path.join(__dirname, 'assets', 'namascolor.pbitool.json'), JSON.stringify(pbitool, null, 2));

console.log(`icon.png: ${png.length} bytes (${S}x${S})`);
console.log(`icon.ico: ${ico.length} bytes`);
console.log(`namascolor.pbitool.json: updated with embedded PNG icon`);
