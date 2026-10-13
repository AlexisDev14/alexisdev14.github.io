// Rendu image par image d'un plan (page Canvas 2D) puis assemblage MP4.
// Usage : node render.cjs <dossier_du_plan> [--name nom] [--out dossier] [--stills 0,30,60] [--workers 3] [--gpu]
//   Sans --stills : toutes les images (window.FRAMES) → <out>/<nom>/<nom>.mp4
//   Rendu Canvas en raster CPU (≈ 13× plus rapide que swiftshader) ; images JPEG q=0.95 ; --workers pages en parallèle.
const http = require('http'), fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const root = path.resolve(argv[0] || '.');
const name = opt('--name', path.basename(root));
const outRoot = path.resolve(opt('--out', path.join(path.dirname(root), 'out')));
const stills = opt('--stills') ? opt('--stills').split(',').map(Number) : null;
const workers = Math.max(1, +opt('--workers', stills ? 1 : 3));
const gpu = argv.includes('--gpu');
const out = path.join(outRoot, name);
fs.mkdirSync(path.join(out, 'frames'), { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg' };
const server = http.createServer((req, res) => {
  const f = path.join(root, decodeURIComponent(req.url.split('?')[0]).replace(/^\/$/, '/index.html'));
  if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});
const args = gpu ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
  : ['--disable-gpu', '--disable-accelerated-2d-canvas', '--disable-gpu-compositing'];
(async () => {
  await new Promise((r) => server.listen(0, r));
  const url = `http://localhost:${server.address().port}/`;
  const browser = await chromium.launch({ args });
  const open = async () => {
    const p = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
    p.on('pageerror', (e) => console.error('[page]', e.message));
    p.on('console', (m) => m.type() === 'error' && console.error('[page]', m.text()));
    await p.goto(url); await p.waitForFunction(() => window.READY === true); return p;
  };
  const first = await open();
  const { FRAMES, FPS } = await first.evaluate(() => ({ FRAMES: window.FRAMES, FPS: window.FPS }));
  const list = stills || [...Array(FRAMES).keys()];
  const pages = [first]; for (let i = 1; i < Math.min(workers, list.length); i++) pages.push(await open());
  const t0 = Date.now(); let next = 0, done = 0;
  const grab = async (p, f) => {
    const data = await p.evaluate(([f, fmt]) => { window.renderFrame(f); return (window.captureCanvas || document.querySelector('canvas')).toDataURL(fmt, 0.95); }, [f, stills ? 'image/png' : 'image/jpeg']);
    const file = stills ? `still_${String(f).padStart(4, '0')}.png` : `frames/${String(f).padStart(4, '0')}.jpg`;
    fs.writeFileSync(path.join(out, file), Buffer.from(data.split(',')[1], 'base64'));
    if (!stills && ++done % 30 === 0) console.log(`image ${done}/${list.length} — ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  };
  // chaque page rend des images consécutives (les scènes peuvent garder un état d'une image à l'autre)
  const chunk = Math.ceil(list.length / pages.length);
  await Promise.all(pages.map(async (p, k) => { for (const f of list.slice(k * chunk, (k + 1) * chunk)) await grab(p, f); }));
  await browser.close(); server.close();
  if (stills) { console.log('images clés :', list.length, '→', out); return; }
  const mp4 = path.join(out, `${name}.mp4`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(out, 'frames', '%04d.jpg'),
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '17', '-preset', 'medium', '-movflags', '+faststart', mp4]);
  fs.rmSync(path.join(out, 'frames'), { recursive: true, force: true });
  console.log(`MP4 : ${mp4} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
})();
