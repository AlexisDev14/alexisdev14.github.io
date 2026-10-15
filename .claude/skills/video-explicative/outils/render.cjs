// Rendu image par image d'un plan (page Canvas 2D) puis assemblage MP4.
// Usage : node render.cjs <dossier_du_plan> [--name nom] [--out dossier] [--stills 0,30,60] [--workers 3] [--gpu]
//   --stills : PNG séparés + planche.png (toutes les images clés réduites sur une seule image, dans l'ordre) : regarder
//   d'abord la planche, puis seulement les PNG utiles en grand.
//   Un verrou (dossier temporaire du système) fait passer les rendus l'un après l'autre : deux agents peuvent travailler
//   en même temps, leurs rendus ne se chevauchent jamais.
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
const os = require('os'), LOCK = path.join(os.tmpdir(), 'marionnettes-rendu.lock');
const vivant = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };
async function verrou() {
  let dit = false;
  for (;;) {
    try { fs.writeFileSync(LOCK, String(process.pid), { flag: 'wx' }); break; }
    catch (e) {
      const pid = +fs.readFileSync(LOCK, 'utf8') || 0;
      if (!pid || !vivant(pid)) { try { fs.unlinkSync(LOCK); } catch (_) {} continue; }
      if (!dit) { console.log(`un autre rendu est en cours (pid ${pid}) : attente…`); dit = true; }
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  const lacher = () => { try { if (+fs.readFileSync(LOCK, 'utf8') === process.pid) fs.unlinkSync(LOCK); } catch (_) {} };
  process.on('exit', lacher); for (const sg of ['SIGINT', 'SIGTERM']) process.on(sg, () => { lacher(); process.exit(1); });
}
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
  await verrou();
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
  const t0 = Date.now(); let next = 0, done = 0; const COUDES = {};
  const grab = async (p, f) => {
    const [data, coudes] = await p.evaluate(([f, fmt]) => { window.COUDES = []; window.renderFrame(f); return [(window.captureCanvas || document.querySelector('canvas')).toDataURL(fmt, 0.95), [...new Set(window.COUDES)]]; }, [f, stills ? 'image/png' : 'image/jpeg']);
    for (const k of coudes) (COUDES[k] = COUDES[k] || []).push(f);
    const file = stills ? `still_${String(f).padStart(4, '0')}.png` : `frames/${String(f).padStart(4, '0')}.jpg`;
    fs.writeFileSync(path.join(out, file), Buffer.from(data.split(',')[1], 'base64'));
    if (!stills && ++done % 30 === 0) console.log(`image ${done}/${list.length} — ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  };
  // chaque page rend des images consécutives (les scènes peuvent garder un état d'une image à l'autre)
  const chunk = Math.ceil(list.length / pages.length);
  await Promise.all(pages.map(async (p, k) => { for (const f of list.slice(k * chunk, (k + 1) * chunk)) await grab(p, f); }));
  await browser.close(); server.close();
  // coudes à l'envers (contrôle du kit) : une ligne par bras, avec les plages de temps
  for (const [k, fs_] of Object.entries(COUDES)) {
    const v = [...fs_].sort((a, b) => a - b), plages = []; let a0 = v[0], b0 = v[0];
    for (const f of v.slice(1)) { if (f - b0 <= (stills ? 45 : 2)) b0 = f; else { plages.push([a0, b0]); a0 = b0 = f; } }
    plages.push([a0, b0]);
    console.log(`ATTENTION coude à l'envers : ${k} à ${plages.map(([a, b]) => a === b ? (a / FPS).toFixed(2) + ' s' : (a / FPS).toFixed(2) + '–' + (b / FPS).toFixed(2) + ' s').join(', ')} (coude au-dessus de la ligne épaule–main : essayer l'autre bendSign de M.ik)`);
  }
  if (stills) {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'planche-'));
    list.forEach((f, i) => fs.copyFileSync(path.join(out, `still_${String(f).padStart(4, '0')}.png`), path.join(tmp, `${String(i).padStart(3, '0')}.png`)));
    const cols = Math.min(6, list.length), rows = Math.ceil(list.length / cols);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', path.join(tmp, '%03d.png'), '-vf', `scale=300:-2,tile=${cols}x${rows}:padding=4:color=white`, '-frames:v', '1', path.join(out, 'planche_cles.png')]);
    fs.rmSync(tmp, { recursive: true, force: true });
    console.log('images clés :', list.length, '→', out, '| planche :', path.join(out, 'planche_cles.png'), `(${cols} par ligne, dans l'ordre : ${list.join(',')})`); return;
  }
  const mp4 = path.join(out, `${name}.mp4`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(out, 'frames', '%04d.jpg'),
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '17', '-preset', 'medium', '-movflags', '+faststart', mp4]);
  fs.rmSync(path.join(out, 'frames'), { recursive: true, force: true });
  console.log(`MP4 : ${mp4} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
})();
