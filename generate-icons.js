// Run with: node generate-icons.js
// Generates icon.png (1024x1024) for electron-builder
const fs = require('fs');
const path = require('path');
const { createCanvas } = (() => {
  try { return require('canvas'); } catch { return { createCanvas: null }; }
})();

const assetsDir = path.join(__dirname, 'assets');

// If node-canvas is available, render the icon properly
if (createCanvas) {
  const size = 1024;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  drawIcon(ctx, size);
  fs.writeFileSync(path.join(assetsDir, 'icon.png'), canvas.toBuffer('image/png'));
  console.log('Generated assets/icon.png (1024x1024)');
} else {
  // Fallback: write SVG that can be manually converted
  const svg = generateSVG();
  fs.writeFileSync(path.join(assetsDir, 'icon.svg'), svg);
  console.log('Generated assets/icon.svg');
  console.log('To convert to PNG: open icon.svg in browser, right-click > Save Image As > icon.png');
  console.log('Or use: npx svg2png-cli assets/icon.svg -o assets/icon.png -w 1024 -h 1024');
}

function generateSVG() {
  return `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1024" y2="1024">
      <stop offset="0%" stop-color="#0c1029"/>
      <stop offset="50%" stop-color="#111540"/>
      <stop offset="100%" stop-color="#0a0e24"/>
    </linearGradient>
    <linearGradient id="logo" x1="200" y1="150" x2="824" y2="874">
      <stop offset="0%" stop-color="#60A5FA"/>
      <stop offset="50%" stop-color="#818CF8"/>
      <stop offset="100%" stop-color="#A78BFA"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" rx="228" fill="url(#bg)"/>
  <rect x="2" y="2" width="1020" height="1020" rx="226" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="2"/>
  <path d="M512 220L820 390V634L512 804L204 634V390L512 220Z" stroke="url(#logo)" stroke-width="2.5" fill="none" opacity="0.4"/>
  <path d="M280 600L512 740L744 600" stroke="url(#logo)" stroke-width="28" stroke-linecap="round" opacity="0.5"/>
  <path d="M280 520L512 660L744 520" stroke="url(#logo)" stroke-width="28" stroke-linecap="round" opacity="0.65"/>
  <path d="M280 440L512 580L744 440" stroke="url(#logo)" stroke-width="28" stroke-linecap="round" opacity="0.8"/>
  <path d="M280 360L512 500L744 360" stroke="url(#logo)" stroke-width="28" stroke-linecap="round" opacity="1.0"/>
  <circle cx="512" cy="280" r="40" fill="url(#logo)"/>
  <path d="M512 160V235" stroke="url(#logo)" stroke-width="16" stroke-linecap="round" stroke-dasharray="20 20" opacity="0.5"/>
</svg>`;
}

function drawIcon(ctx, s) {
  // Background
  ctx.fillStyle = '#0c1029';
  ctx.beginPath();
  ctx.roundRect(0, 0, s, s, s * 0.22);
  ctx.fill();

  // Print layers
  const layers = [[360, 1.0], [440, 0.85], [520, 0.7], [600, 0.55]];
  layers.forEach(([y, opacity]) => {
    ctx.strokeStyle = `rgba(96, 165, 250, ${opacity})`;
    ctx.lineWidth = 28;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(280, y);
    ctx.lineTo(512, y + 140);
    ctx.lineTo(744, y);
    ctx.stroke();
  });

  // Nozzle
  const grad = ctx.createLinearGradient(480, 240, 544, 320);
  grad.addColorStop(0, '#60A5FA');
  grad.addColorStop(1, '#A78BFA');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(512, 280, 40, 0, Math.PI * 2);
  ctx.fill();
}
