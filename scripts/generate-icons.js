const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// SVG matching the user's calendar icon: blue header, grid, orange dot with glow
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f0f1f5"/>
      <stop offset="100%" stop-color="#e8e9ed"/>
    </linearGradient>
    <linearGradient id="header" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#6B8AE8"/>
      <stop offset="100%" stop-color="#5A7DE6"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="12" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <clipPath id="rounded">
      <rect x="32" y="32" width="448" height="448" rx="88" ry="88"/>
    </clipPath>
  </defs>

  <!-- Background -->
  <rect x="32" y="32" width="448" height="448" rx="88" ry="88" fill="url(#bg)"/>

  <!-- Blue header -->
  <path d="M32 120 C32 75.8 67.8 32 120 32 L392 32 C436.2 32 480 67.8 480 120 L480 175 L32 175 Z" fill="url(#header)"/>

  <!-- Calendar binding holes -->
  <circle cx="190" cy="70" r="18" fill="#fff" opacity="0.9"/>
  <circle cx="190" cy="70" r="10" fill="url(#header)"/>
  <circle cx="322" cy="70" r="18" fill="#fff" opacity="0.9"/>
  <circle cx="322" cy="70" r="10" fill="url(#header)"/>

  <!-- Grid cells -->
  <!-- Row 1 -->
  <rect x="72" y="205" width="52" height="42" rx="8" fill="#d5d7dc"/>
  <rect x="142" y="205" width="52" height="42" rx="8" fill="#d5d7dc"/>
  <rect x="212" y="205" width="52" height="42" rx="8" fill="#d5d7dc"/>
  <rect x="282" y="205" width="52" height="42" rx="8" fill="#d5d7dc"/>
  <rect x="352" y="205" width="52" height="42" rx="8" fill="#d5d7dc"/>

  <!-- Row 2 -->
  <rect x="72" y="265" width="52" height="42" rx="8" fill="#d5d7dc"/>
  <rect x="142" y="265" width="52" height="42" rx="8" fill="#d5d7dc"/>
  <rect x="212" y="265" width="52" height="42" rx="8" fill="#d5d7dc"/>
  <rect x="282" y="265" width="52" height="42" rx="8" fill="#d5d7dc"/>
  <rect x="352" y="265" width="52" height="42" rx="8" fill="#d5d7dc"/>

  <!-- Row 3 -->
  <rect x="72" y="325" width="52" height="42" rx="8" fill="#d5d7dc"/>
  <rect x="142" y="325" width="52" height="42" rx="8" fill="#d5d7dc"/>
  <rect x="212" y="325" width="52" height="42" rx="8" fill="#d5d7dc"/>
  <rect x="282" y="325" width="52" height="42" rx="8" fill="#d5d7dc"/>
  <rect x="352" y="325" width="52" height="42" rx="8" fill="#d5d7dc"/>

  <!-- Row 4 -->
  <rect x="72" y="385" width="52" height="42" rx="8" fill="#d5d7dc"/>
  <rect x="142" y="385" width="52" height="42" rx="8" fill="#d5d7dc"/>
  <rect x="212" y="385" width="52" height="42" rx="8" fill="#d5d7dc"/>

  <!-- Orange dot glow -->
  <circle cx="340" cy="380" r="52" fill="#FFD54F" opacity="0.45" filter="url(#glow)"/>
  <!-- Orange dot -->
  <circle cx="340" cy="380" r="36" fill="#EF6C00"/>
  <circle cx="340" cy="380" r="28" fill="#F57C00"/>
  <circle cx="330" cy="370" r="8" fill="#FFB74D" opacity="0.5"/>
</svg>`;

const sizes = [72, 96, 128, 144, 192, 384, 512];
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
const publicDir = path.join(__dirname, '..', 'public');

async function generate() {
  const svgBuffer = Buffer.from(svg);

  // Generate PWA icons
  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(iconsDir, `icon-${size}x${size}.png`));
    console.log(`  Generated icon-${size}x${size}.png`);
  }

  // Generate apple-touch-icon (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('  Generated apple-touch-icon.png');

  // Generate favicon.ico (32x32 PNG served as ico)
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('  Generated favicon.png');

  // Also generate a 16x16 for favicon
  await sharp(svgBuffer)
    .resize(16, 16)
    .png()
    .toFile(path.join(publicDir, 'favicon-16x16.png'));

  console.log('Done!');
}

generate().catch(console.error);
