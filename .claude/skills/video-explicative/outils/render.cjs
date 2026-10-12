// Rendu image par image d'une scène HTML, puis assemblage MP4 avec ffmpeg.
// Usage :
//   node motion-lab/render.cjs diorama                 → toutes les images + MP4
//   node motion-lab/render.cjs diorama --stills 0,75,150,225  → images clés seulement
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const scene = process.argv[2] || 'diorama';
const stillsArg = process.argv.indexOf('--stills');
const stills = stillsArg > 0 ? process.argv[stillsArg + 1].split(',').map(Number) : null;
const opt = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const query = opt('--query') || '';
const name = opt('--name') || scene;
const audio = opt('--audio');
const root = path.join(__dirname, scene);
const out = path.join(__dirname, 'out', name);
fs.mkdirSync(path.join(out, 'frames'), { recursive: true });

const types = { '.html': 'text/html', '.js': 'text/javascript' };
const server = http.createServer((req, res) => {
  const file = path.join(root, decodeURIComponent(req.url.split('?')[0]).replace(/^\/$/, '/index.html'));
  if (!file.startsWith(root) || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

(async () => {
  await new Promise((r) => server.listen(0, r));
  const port = server.address().port;
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('console', (m) => m.type() === 'error' && console.error('[page]', m.text()));
  page.on('pageerror', (e) => console.error('[page]', e.message));
  await page.goto(`http://localhost:${port}/?${query}`);
  await page.waitForFunction(() => window.READY === true);
  const { FRAMES, FPS } = await page.evaluate(() => ({ FRAMES: window.FRAMES, FPS: window.FPS }));

  const list = stills || [...Array(FRAMES).keys()];
  const t0 = Date.now();
  for (const f of list) {
    const data = await page.evaluate((f) => { window.renderFrame(f); return (window.captureCanvas || document.querySelector('canvas')).toDataURL('image/png'); }, f);
    const name = stills ? `still_${String(f).padStart(4, '0')}.png` : `frames/${String(f).padStart(4, '0')}.png`;
    fs.writeFileSync(path.join(out, name), Buffer.from(data.split(',')[1], 'base64'));
    if (!stills && f % 30 === 0) console.log(`image ${f}/${FRAMES} — ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
  await browser.close();
  server.close();

  if (stills) {
    console.log('images clés :', list.length);
    return;
  }
  const mp4 = path.join(out, `${name}.mp4`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(out, 'frames', '%04d.png'),
    ...(audio ? ['-i', audio, '-c:a', 'aac', '-b:a', '192k', '-shortest'] : []),
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '17', '-preset', 'slow', '-movflags', '+faststart', mp4]);
  console.log('MP4 :', mp4);
})();
