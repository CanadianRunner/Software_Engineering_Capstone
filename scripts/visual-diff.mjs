// Visual regression check against a stored full-page baseline.
//
//   node scripts/visual-diff.mjs                       compare http://localhost:3000 at 1440 wide
//   node scripts/visual-diff.mjs --update              overwrite the baseline with a fresh capture
//   node scripts/visual-diff.mjs --url http://localhost:3001 --width 1440 --baseline docs/phases/screenshots/phase-0-v2-1440.png
//
// Options
//   --url        page to capture                       default http://localhost:3000
//   --width      viewport width in px                  default 1440
//   --baseline   PNG to compare against                default docs/phases/screenshots/phase-0-v2-<width>.png
//   --out        folder for capture and diff images     default <tmp>/visual-diff
//   --wait       ms to wait after load before capture   default 10000
//   --threshold  pixelmatch colour threshold 0..1       default 0.1
//   --ignore     x,y,w,h box to exclude; repeatable     default: the animated chevrons and desk video
//   --no-default-ignore   drop the default boxes
//   --chrome     path to a Chrome binary                default the Google Chrome app on this Mac
//   --update     save the capture as the new baseline and exit
//
// Exit code 0 when no pixels differ outside the ignored boxes, 1 otherwise.
// Dependencies live in portfolio-page/package.json (puppeteer-core, pixelmatch, pngjs).

import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(root, 'portfolio-page', 'package.json'));
const load = async (name) => {
  const m = await import(pathToFileURL(require.resolve(name)).href);
  return m.default ?? m;
};
const puppeteer = await load('puppeteer-core');
const pixelmatch = await load('pixelmatch');
const { PNG } = await load('pngjs');

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? def : args[i + 1];
};
const flag = (name) => args.includes(`--${name}`);
const all = (name) => args.flatMap((a, i) => (a === `--${name}` ? [args[i + 1]] : []));

const url = opt('url', 'http://localhost:3000');
const width = Number(opt('width', 1440));
const baselinePath = resolve(root, opt('baseline', `docs/phases/screenshots/phase-0-v2-${width}.png`));
const outDir = resolve(opt('out', join(tmpdir(), 'visual-diff')));
const wait = Number(opt('wait', 10000));
const threshold = Number(opt('threshold', 0.1));
const chrome = opt('chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');

// Regions that change between captures of the same build, measured on the 1440
// baseline: the bouncing chevrons under the splash, the desk video beside the About
// card, and the anti-aliased resize grip on the contact form textarea.
const defaultIgnore = width === 1440 ? [[660, 590, 120, 180], [760, 940, 670, 720], [1048, 5152, 20, 20]] : [];
const ignore = (flag('no-default-ignore') ? [] : defaultIgnore).concat(
  all('ignore').map((s) => s.split(',').map(Number)),
);

mkdirSync(outDir, { recursive: true });

async function capture() {
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: true,
    args: ['--ignore-certificate-errors', '--autoplay-policy=no-user-gesture-required', '--hide-scrollbars'],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height: 900 });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise((r) => setTimeout(r, wait));
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 150));
      }
      window.scrollTo(0, 0);
    });
    await new Promise((r) => setTimeout(r, 1000));
    return await page.screenshot({ fullPage: true });
  } finally {
    await browser.close();
  }
}

const shot = Buffer.from(await capture());
const capturePath = join(outDir, `capture-${width}.png`);
writeFileSync(capturePath, shot);

if (flag('update')) {
  mkdirSync(dirname(baselinePath), { recursive: true });
  writeFileSync(baselinePath, shot);
  console.log(`baseline written: ${baselinePath}`);
  process.exit(0);
}

if (!existsSync(baselinePath)) {
  console.error(`no baseline at ${baselinePath}; run with --update to create one`);
  process.exit(2);
}

const a = PNG.sync.read(readFileSync(baselinePath));
const b = PNG.sync.read(shot);
console.log(`baseline ${a.width}x${a.height}  capture ${b.width}x${b.height}`);

const w = Math.min(a.width, b.width);
const h = Math.min(a.height, b.height);
const crop = (png) => {
  const out = new PNG({ width: w, height: h });
  PNG.bitblt(png, out, 0, 0, w, h, 0, 0);
  return out;
};
const A = crop(a);
const B = crop(b);
const diff = new PNG({ width: w, height: h });
const total = pixelmatch(A.data, B.data, diff.data, w, h, { threshold, includeAA: true });

// Count differing pixels outside the ignored boxes and collect their extent.
const inIgnored = (x, y) => ignore.some(([ix, iy, iw, ih]) => x >= ix && x < ix + iw && y >= iy && y < iy + ih);
let outside = 0;
let minX = w, minY = h, maxX = -1, maxY = -1;
const rows = new Set();
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    const differs = diff.data[i] === 255 && diff.data[i + 1] === 0 && diff.data[i + 2] === 0;
    if (!differs) continue;
    if (inIgnored(x, y)) {
      // Paint ignored differences grey so the diff image shows what was excluded.
      diff.data[i] = 160; diff.data[i + 1] = 160; diff.data[i + 2] = 160;
      continue;
    }
    outside++;
    rows.add(y);
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
}
const diffPath = join(outDir, `diff-${width}.png`);
writeFileSync(diffPath, PNG.sync.write(diff));

const bands = [];
let start = null, prev = null;
for (const y of [...rows].sort((p, q) => p - q)) {
  if (start === null) { start = prev = y; continue; }
  if (y !== prev + 1) { bands.push([start, prev]); start = y; }
  prev = y;
}
if (start !== null) bands.push([start, prev]);

console.log(`ignored boxes: ${ignore.map((b) => b.join(',')).join('  ') || 'none'}`);
console.log(`differing pixels: ${total} total, ${outside} outside ignored boxes`);
if (a.height !== b.height) console.log(`height differs by ${b.height - a.height}px (compared the top ${h}px)`);
if (outside > 0) {
  console.log(`bounding box: x ${minX}-${maxX}, y ${minY}-${maxY}`);
  console.log(`row bands: ${bands.map(([p, q]) => `${p}-${q}`).join(' ')}`);
}
console.log(`capture: ${capturePath}`);
console.log(`diff:    ${diffPath}`);
process.exit(outside === 0 && a.height === b.height ? 0 : 1);
