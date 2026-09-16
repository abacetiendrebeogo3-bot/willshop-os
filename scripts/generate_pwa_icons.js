const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = (c >>> 8) ^ crcTable[(c ^ buf[i]) & 0xff];
  }
  return (c ^ 0xffffffff) >>> 0;
}

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function writeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(8 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const typeAndData = buf.subarray(4, 8 + len);
  const chunkCrc = crc32(typeAndData);
  buf.writeUInt32BE(chunkCrc, 8 + len);
  return buf;
}

function createPng(width, height, renderPixel) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth
  ihdr[9] = 6; // Color type (RGBA)
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace
  const ihdrChunk = writeChunk('IHDR', ihdr);

  // Scanlines
  const rawData = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (width * 4 + 1);
    rawData[rowOffset] = 0; // Filter: none
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = renderPixel(x, y, width, height);
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = writeChunk('IDAT', compressedData);
  const iendChunk = writeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function renderWillShopIcon(x, y, width, height, maskable = false) {
  const nx = x / width;
  const ny = y / height;

  // Background: Deep dark #0A0A14
  let r = 0x0a, g = 0x0a, b = 0x14, a = 255;

  // Center badge: Rounded box centered
  // Maskable icons require 20% safe margin (margin = 0.2), regular icons use 0.14
  const margin = maskable ? 0.20 : 0.14;
  const boxLeft = margin;
  const boxRight = 1 - margin;
  const boxTop = margin;
  const boxBottom = 1 - margin;
  const cornerRadius = 0.16;

  // Check if pixel is inside rounded box
  const inX = nx >= boxLeft && nx <= boxRight;
  const inY = ny >= boxTop && ny <= boxBottom;

  let inBox = false;
  if (inX && inY) {
    const cx = nx < boxLeft + cornerRadius ? boxLeft + cornerRadius : (nx > boxRight - cornerRadius ? boxRight - cornerRadius : nx);
    const cy = ny < boxTop + cornerRadius ? boxTop + cornerRadius : (ny > boxBottom - cornerRadius ? boxBottom - cornerRadius : ny);
    const dist = Math.hypot(nx - cx, ny - cy);
    if (dist <= cornerRadius) {
      inBox = true;
    }
  }

  if (inBox) {
    // Purple badge #7B61FF
    r = 0x7b; g = 0x61; b = 0xff;

    // Draw White "W" logo in center
    const bx = (nx - boxLeft) / (boxRight - boxLeft);
    const by = (ny - boxTop) / (boxBottom - boxTop);

    function distToSegment(px, py, x1, y1, x2, y2) {
      const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
      if (l2 === 0) return Math.hypot(px - x1, py - y1);
      let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
      t = Math.max(0, Math.min(1, t));
      return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
    }

    const strokeWidth = 0.088;
    const d1 = distToSegment(bx, by, 0.22, 0.28, 0.36, 0.72);
    const d2 = distToSegment(bx, by, 0.36, 0.72, 0.5, 0.42);
    const d3 = distToSegment(bx, by, 0.5, 0.42, 0.64, 0.72);
    const d4 = distToSegment(bx, by, 0.64, 0.72, 0.78, 0.28);

    const minD = Math.min(d1, d2, d3, d4);
    if (minD <= strokeWidth) {
      r = 255; g = 255; b = 255; // White letter W
    }

    // Glowing Green Dot #10B981 at top right of badge
    const dotDist = Math.hypot(bx - 0.78, by - 0.25);
    if (dotDist <= 0.075) {
      r = 0x10; g = 0xb9; b = 0x81; // Green status dot
    }
  }

  return [r, g, b, a];
}

const projectRoot = path.join(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');
const iconsDir = path.join(publicDir, 'icons');
const appDir = path.join(projectRoot, 'app');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('Generating official WILLShop OS PWA Icons...');

const pwa192 = createPng(192, 192, (x, y, w, h) => renderWillShopIcon(x, y, w, h, false));
const pwa512 = createPng(512, 512, (x, y, w, h) => renderWillShopIcon(x, y, w, h, false));
const pwa512Maskable = createPng(512, 512, (x, y, w, h) => renderWillShopIcon(x, y, w, h, true));
const pwa180Apple = createPng(180, 180, (x, y, w, h) => renderWillShopIcon(x, y, w, h, false));
const pwa64Favicon = createPng(64, 64, (x, y, w, h) => renderWillShopIcon(x, y, w, h, false));

// Write to public/icons/
fs.writeFileSync(path.join(iconsDir, 'icon-192x192.png'), pwa192);
fs.writeFileSync(path.join(iconsDir, 'icon-512x512.png'), pwa512);
fs.writeFileSync(path.join(iconsDir, 'icon-512-maskable.png'), pwa512Maskable);
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), pwa180Apple);

// Write to public/ root
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), pwa64Favicon);
fs.writeFileSync(path.join(publicDir, 'icon.png'), pwa192);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), pwa180Apple);

// Write to app/ root for Next.js 14 App Router auto-detection
fs.writeFileSync(path.join(appDir, 'favicon.ico'), pwa64Favicon);
fs.writeFileSync(path.join(appDir, 'icon.png'), pwa192);
fs.writeFileSync(path.join(appDir, 'apple-icon.png'), pwa180Apple);

console.log('✅ ALL WILLShop OS PWA Icons generated cleanly in public/icons/, public/, and app/!');
