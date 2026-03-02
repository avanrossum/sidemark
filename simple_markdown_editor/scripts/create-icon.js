#!/usr/bin/env node
// Generates the app icon in all required formats.
// Uses macOS built-in tools only (qlmanage, sips, iconutil).
//
// Usage: node scripts/create-icon.js
//
// Outputs:
//   build/icon.svg   — source SVG (always regenerated)
//   build/icon.png   — 1024x1024 PNG
//   build/icon.icns  — macOS icon bundle (all sizes)

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const buildDir = path.join(__dirname, '..', 'build');
const svgPath = path.join(buildDir, 'icon.svg');
const pngPath = path.join(buildDir, 'icon.png');
const iconsetDir = path.join(buildDir, 'icon.iconset');
const icnsPath = path.join(buildDir, 'icon.icns');

// ── SVG Source ──

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2a2e38"/>
      <stop offset="100%" stop-color="#1a1d23"/>
    </linearGradient>
  </defs>
  <rect x="64" y="64" width="896" height="896" rx="180" fill="url(#bg)"/>
  <path d="M320 180 L620 180 L740 300 L740 844 L320 844 Z" fill="#242830" stroke="#3b82f6" stroke-width="4"/>
  <path d="M620 180 L620 300 L740 300" fill="#2e3340" stroke="#3b82f6" stroke-width="4"/>
  <text x="530" y="580" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="220" font-weight="700" fill="#e8e8e8" text-anchor="middle">MD</text>
  <rect x="380" y="640" width="300" height="6" rx="3" fill="#3b82f6"/>
</svg>`;

// ── Generate Files ──

fs.mkdirSync(buildDir, { recursive: true });
fs.writeFileSync(svgPath, svg);
console.log('1/4  SVG written:', svgPath);

// SVG → PNG via macOS Quick Look (qlmanage)
const tmpDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'icon-'));
execSync(`qlmanage -t -s 1024 -o "${tmpDir}" "${svgPath}"`, { stdio: 'pipe' });
const qlOutput = path.join(tmpDir, 'icon.svg.png');
fs.copyFileSync(qlOutput, pngPath);
fs.rmSync(tmpDir, { recursive: true });
console.log('2/4  PNG generated:', pngPath);

// PNG → iconset (all required sizes)
if (fs.existsSync(iconsetDir)) fs.rmSync(iconsetDir, { recursive: true });
fs.mkdirSync(iconsetDir);

const sizes = [
  [16, 'icon_16x16.png'],
  [32, 'icon_16x16@2x.png'],
  [32, 'icon_32x32.png'],
  [64, 'icon_32x32@2x.png'],
  [128, 'icon_128x128.png'],
  [256, 'icon_128x128@2x.png'],
  [256, 'icon_256x256.png'],
  [512, 'icon_256x256@2x.png'],
  [512, 'icon_512x512.png'],
  [1024, 'icon_512x512@2x.png'],
];

for (const [size, name] of sizes) {
  const outFile = path.join(iconsetDir, name);
  execSync(`sips -z ${size} ${size} "${pngPath}" --out "${outFile}"`, { stdio: 'pipe' });
}
console.log('3/4  Iconset created:', iconsetDir);

// iconset → .icns
execSync(`iconutil -c icns "${iconsetDir}" -o "${icnsPath}"`, { stdio: 'pipe' });
fs.rmSync(iconsetDir, { recursive: true });
console.log('4/4  ICNS generated:', icnsPath);

console.log('\nDone! Icon files ready for electron-builder.');
