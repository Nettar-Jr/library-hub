import fs from 'fs';
import zlib from 'zlib';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '../public');

// CRC32 table
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[i] = c >>> 0;
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = (crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8)) >>> 0;
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcBuf = Buffer.alloc(4);
  const toCrc = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(toCrc), 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function generatePng(width, height, isMaskable = false) {
  // Render an elegant themed icon
  // Scanlines: width * 4 (RGBA) + 1 byte filter per line
  const rawData = Buffer.alloc((width * 4 + 1) * height);
  const cx = width / 2;
  const cy = height / 2;
  const rOuter = Math.min(width, height) * (isMaskable ? 0.48 : 0.42);

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter 0 (None)
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Deep navy/sapphire gradient background
      const gradT = (x + y) / (width + height);
      let r = Math.round(15 + gradT * (2 - 15));
      let g = Math.round(23 + gradT * (132 - 23));
      let b = Math.round(42 + gradT * (199 - 42));
      let a = 255;

      if (!isMaskable) {
        // Rounded squircle container
        const cornerR = width * 0.22;
        const clx = Math.max(Math.abs(dx) - (cx - cornerR), 0);
        const cly = Math.max(Math.abs(dy) - (cy - cornerR), 0);
        const cDist = Math.sqrt(clx * clx + cly * cly);
        if (cDist > cornerR) {
          a = 0;
        }
      }

      // Draw emblem in center (open book + star)
      if (a > 0) {
        const ny = dy / (height * 0.5);
        const nx = dx / (width * 0.5);

        // Book pages silhouette
        const inLeftPage = nx >= -0.65 && nx <= -0.05 && ny >= -0.25 && ny <= 0.45;
        const inRightPage = nx >= 0.05 && nx <= 0.65 && ny >= -0.25 && ny <= 0.45;
        const inSpine = Math.abs(nx) <= 0.04 && ny >= -0.35 && ny <= 0.48;
        const inStar = (Math.abs(nx) + Math.abs(ny + 0.55)) < 0.18;

        if (inSpine || inStar) {
          // Gold #F59E0B
          r = 245; g = 158; b = 11;
        } else if (inLeftPage || inRightPage) {
          // Off-white / light slate book pages
          const pageShade = (inLeftPage ? -nx : nx);
          r = Math.round(235 + pageShade * 20);
          g = Math.round(242 + pageShade * 13);
          b = 255;
        }
      }

      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // PNG Header
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', deflated);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generatePng(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generatePng(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), generatePng(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generatePng(180, 180, false));

console.log('Successfully generated PWA PNG icons in /public: 192x192, 512x512, maskable-512x512, apple-touch-icon.png');
