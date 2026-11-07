// Rasterize the rounded rectangles in our SVG mark with 8x antialiasing.
// Uses the image library already installed by Expo; no additional dependency.
const fs = require('node:fs');
const path = require('node:path');
const Jimp = require('jimp-compact');

async function main() {
  const assets = path.join(__dirname, '../assets');
  const svg = fs.readFileSync(path.join(assets, 'notification-icon.svg'), 'utf8');
  const rects = [...svg.matchAll(/<rect\s+([^>]+)\/>/g)].map((match) =>
    Object.fromEntries([...match[1].matchAll(/(\w+)="([\d.]+)"/g)]
      .map(([, key, value]) => [key, Number(value)])));
  const icon = new Jimp(96, 96, 0xffffff00);
  for (let y = 0; y < 96; y++) {
    for (let x = 0; x < 96; x++) {
      let coverage = 0;
      for (let sy = 0; sy < 8; sy++) {
        for (let sx = 0; sx < 8; sx++) {
          const px = x + 10 + (sx + 0.5) / 8;
          const py = y + 8 + (sy + 0.5) / 8;
          if (rects.some((r) => {
            const dx = Math.max(r.x + r.rx - px, 0, px - (r.x + r.width - r.rx));
            const dy = Math.max(r.y + r.rx - py, 0, py - (r.y + r.height - r.rx));
            return dx * dx + dy * dy <= r.rx * r.rx;
          })) coverage++;
        }
      }
      icon.bitmap.data[(y * 96 + x) * 4 + 3] = Math.round(coverage * 255 / 64);
    }
  }
  await icon.writeAsync(path.join(assets, 'notification-icon.png'));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
