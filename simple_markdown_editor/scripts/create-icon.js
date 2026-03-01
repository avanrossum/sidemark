#!/usr/bin/env node
// Generates a simple app icon for the markdown editor.
// Creates a 1024x1024 PNG using an SVG rendered to canvas.
// Requires: npm install canvas (dev dependency, run once)
//
// Usage: node scripts/create-icon.js
//
// For production, convert the output to .icns using:
//   mkdir build/icon.iconset
//   sips -z 16 16   build/icon.png --out build/icon.iconset/icon_16x16.png
//   sips -z 32 32   build/icon.png --out build/icon.iconset/icon_16x16@2x.png
//   sips -z 32 32   build/icon.png --out build/icon.iconset/icon_32x32.png
//   sips -z 64 64   build/icon.png --out build/icon.iconset/icon_32x32@2x.png
//   sips -z 128 128 build/icon.png --out build/icon.iconset/icon_128x128.png
//   sips -z 256 256 build/icon.png --out build/icon.iconset/icon_128x128@2x.png
//   sips -z 256 256 build/icon.png --out build/icon.iconset/icon_256x256.png
//   sips -z 512 512 build/icon.png --out build/icon.iconset/icon_256x256@2x.png
//   sips -z 512 512 build/icon.png --out build/icon.iconset/icon_512x512.png
//   sips -z 1024 1024 build/icon.png --out build/icon.iconset/icon_512x512@2x.png
//   iconutil -c icns build/icon.iconset -o build/icon.icns
//   rm -rf build/icon.iconset

const fs = require('fs');
const path = require('path');

// SVG icon: a simple document with "MD" text
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2a2e38"/>
      <stop offset="100%" stop-color="#1a1d23"/>
    </linearGradient>
  </defs>
  <!-- Background rounded rect -->
  <rect x="64" y="64" width="896" height="896" rx="180" fill="url(#bg)"/>
  <!-- Document shape -->
  <path d="M320 180 L620 180 L740 300 L740 844 L320 844 Z" fill="#242830" stroke="#3b82f6" stroke-width="4"/>
  <!-- Fold corner -->
  <path d="M620 180 L620 300 L740 300" fill="#2e3340" stroke="#3b82f6" stroke-width="4"/>
  <!-- MD text -->
  <text x="530" y="580" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="220" font-weight="700" fill="#e8e8e8" text-anchor="middle">MD</text>
  <!-- Accent line -->
  <rect x="380" y="640" width="300" height="6" rx="3" fill="#3b82f6"/>
</svg>`;

const outPath = path.join(__dirname, '..', 'build', 'icon.svg');
fs.writeFileSync(outPath, svg);
console.log(`Icon SVG written to ${outPath}`);
console.log('To create .icns, convert the SVG to a 1024x1024 PNG first,');
console.log('then run the iconutil commands listed in this script.');
