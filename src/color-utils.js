// --- Conversions ---

function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  const n = parseInt(hex, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(c => Math.round(c).toString(16).padStart(2, '0')).join('');
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb(h, s, l) {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
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
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

function hexToHsl(hex) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHsl(r, g, b);
}

function hslToHex(h, s, l) {
  const { r, g, b } = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}

// --- Harmonies ---

function shiftHue(hex, degrees) {
  const hsl = hexToHsl(hex);
  hsl.h = (hsl.h + degrees + 360) % 360;
  return hslToHex(hsl.h, hsl.s, hsl.l);
}

function complementary(hex) {
  return [hex, shiftHue(hex, 180)];
}

function analogous(hex) {
  return [shiftHue(hex, -30), hex, shiftHue(hex, 30)];
}

function triadic(hex) {
  return [hex, shiftHue(hex, 120), shiftHue(hex, 240)];
}

function splitComplementary(hex) {
  return [hex, shiftHue(hex, 150), shiftHue(hex, 210)];
}

// --- Gradient ---

function generateGradient(hex1, hex2, steps) {
  const hsl1 = hexToHsl(hex1);
  const hsl2 = hexToHsl(hex2);

  // Shortest hue path
  let dh = hsl2.h - hsl1.h;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;

  const colors = [];
  for (let i = 0; i < steps; i++) {
    const t = steps === 1 ? 0 : i / (steps - 1);
    let h = (hsl1.h + dh * t + 360) % 360;
    const s = hsl1.s + (hsl2.s - hsl1.s) * t;
    const l = hsl1.l + (hsl2.l - hsl1.l) * t;
    colors.push(hslToHex(Math.round(h), Math.round(s), Math.round(l)));
  }
  return colors;
}

// --- Validation ---

function isValidHex(hex) {
  return /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex);
}

function normalizeHex(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  return '#' + hex.toLowerCase();
}

window.ColorUtils = {
  hexToRgb, rgbToHex, rgbToHsl, hslToRgb, hexToHsl, hslToHex,
  shiftHue, complementary, analogous, triadic, splitComplementary,
  generateGradient, isValidHex, normalizeHex
};
