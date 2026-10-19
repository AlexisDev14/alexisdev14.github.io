// =====================================================================
// marionnettes.js — kit commun « Théâtre de marionnettes à tiges »
// Petit théâtre de papier vu de face : cadre de scène, rideau de velours,
// plancher, rampe, décors en carton peint qui montent / descendent,
// marionnettes articulées (attaches parisiennes) tenues par une tige.
// Repère écran 1080 × 1920. Tout est déterministe (aucun Math.random).
// =====================================================================
(function (g) {
'use strict';
const W = 1080, H = 1920, TAU = Math.PI * 2;
let c = null;                 // contexte courant
let LW = 1;                   // 1 / échelle courante (traits constants à l'écran)
let SIL = false;              // passe « silhouette » (ombres portées)
const M = { W, H, TAU };
M.use = (ctx) => { c = ctx; };
M.ctx = () => c;

// ---------------------------------------------------------------- maths
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);
const easeIn = (t) => { t = clamp(t); return t * t * t; };
const smooth = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
function spring(t, zeta = 0.45, omega = 12) {
  if (t <= 0) return 0;
  const wd = omega * Math.sqrt(1 - zeta * zeta);
  return 1 - Math.exp(-zeta * omega * t) * (Math.cos(wd * t) + (zeta * omega / wd) * Math.sin(wd * t));
}
// Temps GLOBAL de la vidéo (début du plan + t) pour les animations d'ambiance continues (rampe, projecteurs, poussière, drapeaux,
// décors suspendus, papillons, poissons, fleurs) : avec le temps local du plan, elles repartaient de zéro à chaque coupe et la
// lumière ou le décor « sautait » d'un plan à l'autre (tulipomanie, Pompidou). M.debut() est défini dans 05_conduite.js.
const TG = (t) => (typeof M.debut === 'function' ? M.debut() : 0) + t;
M.tg = TG;                                   // dans scene.js : const g = M.tg(t) pour les balancements d'ambiance
const wob = (t, t0, amp, f = 2, k = 4) => (t < t0 ? 0 : amp * Math.sin(TAU * f * (t - t0)) * Math.exp(-k * (t - t0)));
function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function noise(t, seed = 0) { const i = Math.floor(t), f = t - i, u = f * f * (3 - 2 * f); return lerp(hash(i + seed * 57.31), hash(i + 1 + seed * 57.31), u) * 2 - 1; }
function rng(seed) { let a = seed | 0; return function () { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
Object.assign(M, { clamp, lerp, ease, easeOut, easeIn, smooth, spring, wob, hash, noise, rng });

// ---------------------------------------------------------------- palette (sourde, « gravure »)
const P = {
  nuit: '#1f2738', nuitL: '#34405a', nuitD: '#141a27',
  vert: '#33493b', vertL: '#4a6552', vertD: '#24352b',
  ocre: '#b5863f', ocreL: '#d0a75e',
  ivoire: '#ebe2cd', ivoireD: '#cfc2a3', ivoireL: '#f6f0e2',
  sang: '#7f1d1f', sangL: '#a3302c', sangD: '#55100f',
  or: '#b08d45', orL: '#d9bd72', orD: '#76592a',
  peau: '#e2c3a0', peauD: '#c49b78', joue: '#cf8f7c',
  noir: '#1d1b1f', noirL: '#3a363c',
  gris: '#86837a', grisL: '#a29f95', grisD: '#5f5d57',
  bois: '#3b2516', boisL: '#6a4428', boisM: '#53351f',
  pierre: '#d3c4a3', pierreD: '#a8977a', pierreL: '#e6dbc3',
  toile: '#e2d2ac', toileD: '#bfa97f',
  encre: '20,16,24',
  edge: '#f1e9d6',
  velours: '#6f1016', veloursL: '#a3242a', veloursD: '#2c0507',
  cheveux: '#3a2a20', chatain: '#8a5f3a', perruque: '#d3d2cb',
};
M.P = P;

// ---------------------------------------------------------------- textures (créées dans M.init)
M.tex = {};
function mkCanvas(w, h) { const cv = document.createElement('canvas'); cv.width = Math.ceil(w); cv.height = Math.ceil(h); return cv; }
M.mkCanvas = mkCanvas;
// pré-rendu : fn dessine dans un nouveau canvas (c pointe dessus pendant fn)
function pre(w, h, fn) { const cv = mkCanvas(w, h); const old = c, oldLW = LW; c = cv.getContext('2d'); LW = 1; fn(c, cv); c = old; LW = oldLW; return cv; }
M.pre = pre;

function makeTextures() {
  const R = rng(77);
  // papier : fibres et mouchetures claires (utilisé en multiply)
  M.tex.paper = pre(256, 256, (x) => {
    const img = x.createImageData(256, 256);
    for (let i = 0; i < img.data.length; i += 4) { const v = 255 - Math.floor(Math.pow(R(), 4) * 46); img.data[i] = v; img.data[i + 1] = v - 2; img.data[i + 2] = v - 8; img.data[i + 3] = 255; }
    x.putImageData(img, 0, 0);
    x.globalAlpha = 0.16; x.strokeStyle = '#6b5a40';
    for (let i = 0; i < 260; i++) { const px = R() * 256, py = R() * 256, a = R() * TAU, l = 4 + R() * 16; x.lineWidth = 0.4 + R() * 0.8; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a + 0.5) * l * 0.5, py + Math.sin(a + 0.5) * l * 0.5, px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke(); }
  });
  M.tex.paperPat = c.createPattern(M.tex.paper, 'repeat');
  // toile peinte : trame croisée
  M.tex.canvas = pre(128, 128, (x) => {
    x.fillStyle = '#fff'; x.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 128; i += 3) { x.fillStyle = `rgba(90,70,40,${0.05 + R() * 0.06})`; x.fillRect(i, 0, 1.2, 128); x.fillRect(0, i, 128, 1.2); }
    for (let i = 0; i < 300; i++) { x.fillStyle = `rgba(80,60,30,${R() * 0.12})`; x.fillRect(R() * 128, R() * 128, 1 + R() * 2, 1); }
  });
  M.tex.canvasPat = c.createPattern(M.tex.canvas, 'repeat');
  // grain final plein écran (très léger)
  M.tex.grain = pre(W / 2, H / 2, (x) => {
    const w = W / 2, h = H / 2, img = x.createImageData(w, h);
    for (let i = 0; i < img.data.length; i += 4) { const v = 255 - Math.floor(Math.pow(R(), 3) * 60); img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
    x.putImageData(img, 0, 0);
  });
  // velours : mouchetures sombres verticales
  M.tex.velvet = pre(128, 256, (x) => {
    x.fillStyle = '#fff'; x.fillRect(0, 0, 128, 256);
    for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(40,0,5,${R() * 0.18})`; x.fillRect(R() * 128, R() * 256, 1, 2 + R() * 9); }
  });
  M.tex.velvetPat = c.createPattern(M.tex.velvet, 'repeat');
}

// ---------------------------------------------------------------- tracés « découpés »
// pts : [[x,y],[x,y,1(angle vif)],…] ; léger tremblé fixe (papier découpé aux ciseaux)
function path(pts, seed = 0, jit = 0.8, closed = true) {
  const n = pts.length, q = new Array(n);
  for (let i = 0; i < n; i++) { const p = pts[i]; q[i] = [p[0] + (hash(i * 3.1 + seed) - 0.5) * 2 * jit, p[1] + (hash(i * 7.7 + seed + 3) - 0.5) * 2 * jit, p[2]]; }
  c.beginPath();
  if (!closed) {
    c.moveTo(q[0][0], q[0][1]);
    for (let i = 1; i < n - 1; i++) { const m = [(q[i][0] + q[i + 1][0]) / 2, (q[i][1] + q[i + 1][1]) / 2]; if (q[i][2]) c.lineTo(q[i][0], q[i][1]); else c.quadraticCurveTo(q[i][0], q[i][1], m[0], m[1]); }
    c.lineTo(q[n - 1][0], q[n - 1][1]); return;
  }
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const st = q[0][2] ? q[0] : mid(q[n - 1], q[0]);
  c.moveTo(st[0], st[1]);
  for (let i = 0; i < n; i++) {
    const p = q[i], nx = q[(i + 1) % n];
    if (p[2]) c.lineTo(p[0], p[1]);
    else { const m = nx[2] ? [nx[0], nx[1]] : mid(p, nx); c.quadraticCurveTo(p[0], p[1], m[0], m[1]); }
  }
  c.closePath();
}
M.path = path;
function bbox(pts) { let a = 1e9, b = 1e9, d = -1e9, e = -1e9; for (const p of pts) { a = Math.min(a, p[0]); b = Math.min(b, p[1]); d = Math.max(d, p[0]); e = Math.max(e, p[1]); } return [a - 6, b - 6, d + 6, e + 6]; }
M.bbox = bbox;

// Pièce de carton : ombre de découpe, liseré blanc, aplat, peinture interne, texture papier.
function piece(pts, base, paint, o = {}) {
  const seed = o.seed || 0;
  if (SIL) { path(pts, seed); c.fillStyle = '#000'; c.fill(); return; }
  if (o.drop !== false) { c.save(); c.translate(2.6 * LW, 3.6 * LW); path(pts, seed); c.fillStyle = 'rgba(16,9,5,0.32)'; c.fill(); c.restore(); }
  path(pts, seed);
  c.lineJoin = 'round'; c.lineCap = 'round';
  c.lineWidth = 6.6 * LW; c.strokeStyle = 'rgba(34,22,14,0.8)'; c.stroke();
  c.lineWidth = 4.4 * LW; c.strokeStyle = o.edge || P.edge; c.stroke();
  c.fillStyle = base; c.fill();
  c.save(); c.clip();
  if (paint) paint();
  const bb = bbox(pts);
  c.globalCompositeOperation = 'multiply'; c.globalAlpha = o.texA != null ? o.texA : 0.7;
  c.fillStyle = M.tex.paperPat; c.fillRect(bb[0], bb[1], bb[2] - bb[0], bb[3] - bb[1]);
  c.restore();
}
M.piece = piece;

// hachures de gravure dans la zone reg (ou dans le clip courant)
function hatch(reg, ang = 0.8, sp = 5, a = 0.32, lw = 1.05, col = P.encre, bbx) {
  if (SIL) return;
  c.save();
  if (reg) { path(reg, 0, 0); c.clip(); }
  const bb = reg ? bbox(reg) : (bbx || [-300, -300, 300, 300]);
  const cx = (bb[0] + bb[2]) / 2, cy = (bb[1] + bb[3]) / 2, R = Math.hypot(bb[2] - bb[0], bb[3] - bb[1]) / 2 + 2;
  c.translate(cx, cy); c.rotate(ang); c.beginPath();
  for (let y = -R; y <= R; y += sp) { c.moveTo(-R, y); c.lineTo(R, y + Math.sin(y) * 0.6); }
  c.strokeStyle = `rgba(${col},${a})`; c.lineWidth = lw * LW; c.stroke();
  c.restore();
}
M.hatch = hatch;
// dégradé de volume (multiply) entre deux points
function shade(x0, y0, x1, y1, a = 0.35, bb = [-400, -600, 400, 400], col = '60,40,40') {
  if (SIL) return;
  const gr = c.createLinearGradient(x0, y0, x1, y1);
  gr.addColorStop(0, `rgba(${col},0)`); gr.addColorStop(1, `rgba(${col},${a})`);
  c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = gr; c.fillRect(bb[0], bb[1], bb[2] - bb[0], bb[3] - bb[1]); c.restore();
}
M.shade = shade;
function fillPts(pts, col, seed = 0, jit = 0.5) { if (SIL) return; path(pts, seed, jit); c.fillStyle = col; c.fill(); }
function strokePts(pts, col, lw = 1.2, closed = false, seed = 0) { if (SIL) return; path(pts, seed, 0.3, closed); c.strokeStyle = col; c.lineWidth = lw * LW; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke(); }
M.fillPts = fillPts; M.strokePts = strokePts;
function dot(x, y, r, col) { if (SIL) return; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = col; c.fill(); }
M.dot = dot;
// attache parisienne (rivet laiton) — rayon en pixels écran
function rivet(x, y, r = 3.4) {
  if (SIL) return;
  const rr = r * LW;
  c.beginPath(); c.arc(x + 0.8 * LW, y + 1 * LW, rr, 0, TAU); c.fillStyle = 'rgba(20,10,5,0.45)'; c.fill();
  const gr = c.createRadialGradient(x - rr * 0.4, y - rr * 0.4, rr * 0.1, x, y, rr);
  gr.addColorStop(0, '#f3dc9a'); gr.addColorStop(0.5, '#b58f45'); gr.addColorStop(1, '#6a4e1f');
  c.beginPath(); c.arc(x, y, rr, 0, TAU); c.fillStyle = gr; c.fill();
}
M.rivet = rivet;

// ---------------------------------------------------------------- moteur de marionnette
// def = { hipY, parts:{ name:{parent, at:[x,y], pts, base, paint(pose), rest, seed} }, order:[…], rod:{part, at} }
// pose = { tilt, dy, ang:{name:rad}, hide:{name:1}, face:{…} }
function partMatrices(def, pose, x, y, s, dir) {
  const T0 = c.getTransform();
  const root = T0.translate(x, y).scale(s * dir, s).rotate((pose.tilt || 0) * 180 / Math.PI).translate(pose.dx || 0, def.hipY + (pose.dy || 0));
  const mats = {};
  const get = (n) => {
    if (mats[n]) return mats[n];
    const p = def.parts[n];
    const base = p.parent ? get(p.parent) : root;
    const a = (p.rest || 0) + ((pose.ang && pose.ang[n]) || 0);
    return (mats[n] = base.translate(p.at[0], p.at[1]).rotate(a * 180 / Math.PI));
  };
  for (const n in def.parts) get(n);
  return { T0, root, mats };
}
function wpt(m, x, y) { const p = new DOMPoint(x, y).matrixTransform(m); return [p.x, p.y]; }
M.wpt = wpt;

let scratch = null;
function drawRod(T0, x0, y0, ang, slotY, w, col) {
  // tige droite de (x0,y0) dans la direction ang (0 = vers le bas) jusqu'à slotY
  const dx = Math.sin(ang), dy = Math.cos(ang);
  if (dy <= 0.05 || y0 >= slotY) return;
  const len = (slotY - y0) / dy;
  c.save(); c.setTransform(T0); c.translate(x0, y0); c.rotate(-ang);
  if (SIL) { c.fillStyle = '#000'; c.fillRect(-w / 2, 0, w, len); c.restore(); return; }
  const gr = c.createLinearGradient(-w / 2, 0, w / 2, 0);
  gr.addColorStop(0, col[0]); gr.addColorStop(0.45, col[1]); gr.addColorStop(1, col[2]);
  c.fillStyle = gr; c.fillRect(-w / 2, 0, w, len);
  c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(w / 2 - 1, 0, 1, len);
  // entrée dans la fente du plancher
  c.restore(); c.save(); c.setTransform(T0);
  const ex = x0 + dx * len;
  c.beginPath(); c.ellipse(ex, slotY, w * 1.6, 2.6, 0, 0, TAU); c.fillStyle = 'rgba(8,4,2,0.6)'; c.fill();
  c.restore();
}
const ROD_WOOD = ['#5b3d22', '#c8a06a', '#6e4a2a'];
const ROD_WIRE = ['#1a1a1a', '#77736b', '#222'];

// Contrôle automatique des membres (leçons Barbe Noire, Oscar : bras et jambes « pas dans le bon sens », vus par l'utilisateur
// seulement). Chaque défaut est noté dans window.COUDES sous la forme « type|nom pièce » ; render.cjs l'affiche en ligne
// « ATTENTION … » avec les instants. Types :
//   coude   coude cassé à l'envers : en repère du bras, la main passe DERRIÈRE l'axe du bras (le coude ne plie que vers
//           l'avant, comme M.ik avec bendSign 1) ; ou coude au-dessus de la ligne épaule–main d'un bras plié non vertical ;
//   arriere main du bras AVANT qui travaille DERRIÈRE le personnage (dans le repère du corps, plus de 45 % du bras en arrière de
//           l'épaule, du côté opposé au regard) : pinceau, outil, geste tourné vers le dos alors qu'il fait face à l'objet ;
//   pied    pied à l'envers (pointe vers l'arrière) ou qui pique vers le bas / le haut (> 55° sous l'horizontale ou > 45° au-dessus).
// Dispense (rare, à justifier dans le rapport) : pose.libre = { armF: 1, legB: 1, … } pour ce membre dans cette pose,
// ou def.libre = { … } pour une marionnette dont le dessin ne suit pas la convention (animal, robe sans pieds).
function controleCoudes(def, pose, mats, sc, nom, root) {
  const rl = (P) => { const q = new DOMPoint(P[0], P[1]).matrixTransform(root.inverse()); return [q.x, q.y]; };   // repère du corps : +x = devant
  if (typeof window === 'undefined') return;
  const libre = (k) => (pose.libre && pose.libre[k]) || (def.libre && def.libre[k]);
  const note = (type, k) => (window.COUDES = window.COUDES || []).push(type + '|' + nom + ' ' + k);
  for (const arm of ['armF', 'armB']) {
    const up = mats[arm + '_up'], lo = mats[arm + '_lo'];
    if (!def.handLen || !up || !lo || libre(arm) || (pose.hide && (pose.hide[arm + '_up'] || pose.hide[arm + '_lo']))) continue;
    const S = wpt(up, 0, 0), E = wpt(lo, 0, 0), Hd = wpt(lo, 0, def.handLen);
    const L1 = Math.hypot(E[0] - S[0], E[1] - S[1]), L = L1 + def.handLen * sc;
    // 1. sens du coude, en repère du bras (indépendant de l'orientation)
    const hl = new DOMPoint(Hd[0], Hd[1]).matrixTransform(up.inverse());
    const a1 = Math.atan2(E[1] - S[1], E[0] - S[0]), a2 = Math.atan2(Hd[1] - E[1], Hd[0] - E[0]);
    let pli = Math.abs(a2 - a1); if (pli > Math.PI) pli = TAU - pli;
    if (pli > 0.3 && hl.x < -0.12 * def.handLen) { note('coude', arm); continue; }
    // 2. ancien contrôle : coude au-dessus de la ligne épaule–main
    const sx = Hd[0] - S[0], sy = Hd[1] - S[1], D = Math.hypot(sx, sy);
    if (D >= 1 && Math.abs(sx) >= 0.35 * D && pli >= 0.3) {
      const u = ((E[0] - S[0]) * sx + (E[1] - S[1]) * sy) / (D * D);
      if (u > 0.05 && u < 0.95 && E[1] < S[1] + u * sy - Math.max(6, 10 * sc)) { note('coude', arm); continue; }
    }
    // 3. main qui travaille derrière le dos : bras AVANT seulement (le bras arrière tendu derrière = bras écartés, permis)
    const Sb = rl(S), Hb = rl(Hd), Eb = rl(E), Lb = Math.hypot(Eb[0] - Sb[0], Eb[1] - Sb[1]) + def.handLen;
    if (arm === 'armF' && Hb[0] - Sb[0] < -0.45 * Lb) note('arriere', arm);
  }
  for (const leg of ['legF', 'legB']) {
    const k = mats[leg + '_lo'] ? leg + '_lo' : leg, m = mats[k];
    if (!m || !def.parts[k] || libre(leg) || (pose.hide && pose.hide[k])) continue;
    const A = rl(wpt(m, 0, 0)), B = rl(wpt(m, 100, 0));   // repère du corps : un personnage couché garde ses pieds justes
    const vx = B[0] - A[0], vy = B[1] - A[1];
    const ang = Math.atan2(vy, vx);            // 0 = pointe vers l'avant, > 0 = vers le bas
    if (vx < 0 || ang > 0.96 || ang < -0.79) note('pied', leg);
  }
}

function puppet(def, pose, x, y, s, o = {}) {
  const dir = o.dir || 1;
  const { T0, root, mats } = partMatrices(def, pose, x, y, s, dir);
  const sc = Math.hypot(T0.a, T0.b) * s;
  const slot = o.slot != null ? o.slot : y + 18 * s;
  if (!SIL) controleCoudes(def, pose, mats, sc, o.nom || def.nom || `x≈${Math.round(x)}`, root);
  const doDraw = () => {
    const prevLW = LW; LW = 1 / sc;
    if (!SIL && o.floorShadow !== false) {
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
      const fx = x + (pose.dx || 0) * s * dir, fy = slot - 5 * s;
      const gsh = c.createRadialGradient(fx, fy, 2, fx, fy, 70 * s);
      gsh.addColorStop(0, 'rgba(15,8,3,0.42)'); gsh.addColorStop(1, 'rgba(15,8,3,0)');
      c.translate(fx, fy); c.scale(1, 0.14); c.translate(-fx, -fy);
      c.fillStyle = gsh; c.fillRect(fx - 80 * s, fy - 80 * s, 160 * s, 160 * s); c.restore();
    }
    // tige secondaire (fil vers une main)
    if (o.handRod && !pose.hide?.[o.handRod[0]]) {
      const hp = wpt(mats[o.handRod[0]], o.handRod[1], o.handRod[2]);
      const a = o.handRodAng || 0.04 * dir;
      const T = new DOMMatrix([1, 0, 0, 1, 0, 0]);
      drawRod(T, hp[0], hp[1], a, slot + 6, 2.6 * Math.max(0.7, sc), ROD_WIRE);
    }
    // tige principale (bois) solidaire du corps
    if (def.rod && o.rod !== false) {
      const rp = wpt(mats[def.rod.part], def.rod.at[0], def.rod.at[1]);
      const rp2 = wpt(root, 0, 100);
      const rp1 = wpt(root, 0, 0);
      const ang = Math.atan2(-(rp2[0] - rp1[0]), rp2[1] - rp1[1]) - (o.rodLean ?? 0.07) * dir;
      drawRod(new DOMMatrix([1, 0, 0, 1, 0, 0]), rp[0], rp[1], ang, slot, 7.5 * Math.max(0.6, sc), ROD_WOOD);
      if (!SIL) { c.save(); c.setTransform(mats[def.rod.part]); rivet(def.rod.at[0], def.rod.at[1] - 8, 3); rivet(def.rod.at[0], def.rod.at[1] + 10, 3); c.restore(); }
    }
    for (const n of def.order) {
      if (pose.hide && pose.hide[n]) continue;
      const p = def.parts[n];
      c.save(); c.setTransform(mats[n]);
      piece(typeof p.pts === 'function' ? p.pts(pose) : p.pts, p.base, p.paint ? () => p.paint(pose) : null, { seed: p.seed || 0, texA: p.texA });
      if (p.extra) p.extra(pose);
      if (p.parent && !p.noRivet) rivet(0, 0, 3.4);
      c.restore();
    }
    LW = prevLW;
  };
  // ombre portée floue sur le décor (lumière de face haute)
  if (o.cast && !SIL) {
    if (!scratch) scratch = mkCanvas(W, H);
    const sx = scratch.getContext('2d');
    const bw = 760 * sc, bh = 760 * sc, bx = Math.max(0, x - bw / 2 - 40), by = Math.max(0, y - bh - 40);
    sx.setTransform(1, 0, 0, 1, 0, 0); sx.clearRect(bx, by, bw + 80, bh + 120);
    const oc = c; c = sx; c.setTransform(T0); SIL = true; doDraw(); SIL = false; c = oc;
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = o.cast.a != null ? o.cast.a : 0.28;
    c.filter = `blur(${o.cast.blur || 7}px)`;
    c.drawImage(scratch, bx, by, bw + 80, bh + 120, bx + (o.cast.dx || 20), by + (o.cast.dy || 8), bw + 80, bh + 120);
    c.restore();
  }
  if (o.alpha != null && o.alpha < 1) { c.save(); c.globalAlpha = o.alpha; doDraw(); c.restore(); }
  else doDraw();
  return { mats, root, w: (n, px = 0, py = 0) => wpt(mats[n], px, py) };
}
M.puppet = puppet;
M.partMatrices = partMatrices;

// IK deux segments : renvoie {up, lo} (angles locaux) pour amener la main (point lo-local [0,L2]) sur la cible écran
function ik(def, pose, x, y, s, dir, arm, target, bendSign = 1) {
  const up = def.parts[arm + '_up'], lo = def.parts[arm + '_lo'];
  const p0 = Object.assign({}, pose, { ang: Object.assign({}, pose.ang, { [arm + '_up']: 0, [arm + '_lo']: 0 }) });
  const { mats } = partMatrices(def, p0, x, y, s, dir);
  const parentM = mats[up.parent].translate(up.at[0], up.at[1]);
  const inv = parentM.inverse();
  const tp = new DOMPoint(target[0], target[1]).matrixTransform(inv);
  const L1 = lo.at[1], L2 = def.handLen || 100;
  let d = Math.hypot(tp.x, tp.y); d = clamp(d, Math.abs(L1 - L2) + 1, L1 + L2 - 0.5);
  const base = Math.atan2(-tp.x, tp.y);
  const a1 = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
  const a2 = Math.acos(clamp((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1));
  return { up: base + bendSign * a1 - (up.rest || 0), lo: -bendSign * (Math.PI - a2) - (lo.rest || 0) };
}
M.ik = ik;

