
// ---------------------------------------------------------------- faune et flore lointaines (scènes en extérieur)
// Petites silhouettes de carton découpé, à dessiner AVANT M.drawFloor() (elles sont au fond) : vol d'oiseaux,
// animaux qui passent sur une crête, papillons, poissons qui sautent, bande de fleurs et d'herbes.
// Toutes sont des fonctions pures de t (aucun état) et prennent `brume` (0..1) : mélange vers la couleur de l'air,
// plus c'est loin plus c'est pâle. Discrètes : elles ne passent jamais devant un visage ni sur l'action principale.
const FAUNE_AIR = '#c9c2b0';
function fCol(col, brume) { return brume > 0 ? mixc(col, FAUNE_AIR, clamp(brume)) : col; }
function fLiser(x, lw) { if (SIL) return; c.lineJoin = 'round'; c.strokeStyle = 'rgba(245,236,214,0.55)'; c.lineWidth = lw; c.stroke(); }

// Vol d'oiseaux. o : { x0, x1, y, t0=0, dur=7, n=5, s=1, seed=1, col, brume=0.35, boucle=false, fil=false, haut=40 }
// Ils traversent de x0 à x1 entre t0 et t0+dur en formation lâche, battent des ailes, ondulent. boucle:true = recommence.
M.oiseaux = function (t, o = {}) {
  const R = rng(o.seed || 1), n = o.n || 5, s = o.s || 1, dur = o.dur || 7, t0 = o.t0 || 0;
  const x0 = o.x0 == null ? -60 : o.x0, x1 = o.x1 == null ? 1140 : o.x1, y = o.y || 420;
  const col = fCol(o.col || '#2c2a2e', o.brume == null ? 0.35 : o.brume), dir = x1 >= x0 ? 1 : -1;
  for (let i = 0; i < n; i++) {
    const ox = -(i % 2 ? 1 : 0.6) * Math.ceil(i / 2) * 34 * s * (0.8 + R() * 0.4), oy = (i % 2 ? -1 : 1) * Math.ceil(i / 2) * 16 * s + (R() - 0.5) * 10 * s;
    const ph = R() * TAU, fq = 2.2 + R() * 0.9, sz = s * (0.8 + R() * 0.35), dl = R() * 0.25;
    let u = (t - t0 - dl) / dur; if (o.boucle) u = ((u % 1) + 1) % 1; if (u < 0 || u > 1) continue;
    const x = lerp(x0, x1, u) + ox * dir, yy = y + oy + Math.sin(u * 7 + ph) * (o.haut || 40) * 0.25 * s;
    const fl = Math.sin(t * fq * TAU + ph);                       // battement : +1 ailes hautes, −1 ailes basses
    c.save(); c.translate(x, yy); c.scale(dir * sz, sz);
    if (o.fil && !SIL) { c.strokeStyle = 'rgba(30,25,30,0.18)'; c.lineWidth = 0.7 / sz; c.beginPath(); c.moveTo(0, -4); c.lineTo(0, -yy / sz); c.stroke(); }
    c.beginPath();
    const wy = -fl * 13, wx = 15, tip = -fl * 6;
    c.moveTo(-9, 0); c.quadraticCurveTo(-wx * 0.6, wy * 0.8, -wx * 1.35, wy + tip);         // aile arrière
    c.quadraticCurveTo(-wx * 0.45, wy * 0.35 + 3, -2, 2);
    c.quadraticCurveTo(wx * 0.4, wy * 0.35 + 3, wx * 1.2, wy + tip);                       // aile avant
    c.quadraticCurveTo(wx * 0.5, wy * 0.8, 6, -1);
    c.quadraticCurveTo(11, -3, 13, -1); c.lineTo(10, 1.5); c.quadraticCurveTo(0, 4, -9, 0); c.closePath();
    c.fillStyle = col; c.fill(); fLiser(c, 1 / sz);
    c.restore();
  }
};

// Quadrupèdes (silhouettes de profil, pieds en (0,0), regard vers +x). Proportions de base pour s = 1 : ≈ 110 px de long.
const BETES = {
  chamois: { L: 54, H: 26, leg: 34, neck: 26, na: -1.05, head: 16, col: '#5a4434', col2: '#d9cdb6', horn: 'crochet', tail: 'court', ear: 7 },
  bouquetin: { L: 58, H: 30, leg: 30, neck: 22, na: -0.9, head: 17, col: '#7d6a55', col2: '#b9a98e', horn: 'arc', tail: 'court', ear: 6, barbe: 1 },
  cerf:    { L: 66, H: 30, leg: 46, neck: 34, na: -1.1, head: 20, col: '#7a5236', col2: '#c9a982', horn: 'bois', tail: 'court', ear: 9 },
  biche:   { L: 60, H: 27, leg: 44, neck: 32, na: -1.0, head: 18, col: '#8b6040', col2: '#d6bc96', tail: 'court', ear: 10 },
  vache:   { L: 76, H: 38, leg: 30, neck: 16, na: -0.35, head: 22, col: '#efe6d4', col2: '#8a4a33', horn: 'court', tail: 'long', ear: 7, taches: 1 },
  cheval:  { L: 74, H: 32, leg: 46, neck: 38, na: -0.95, head: 26, col: '#6b4630', col2: '#2a1d16', tail: 'crin', ear: 7, crin: 1 },
  mouton:  { L: 58, H: 32, leg: 22, neck: 12, na: -0.5, head: 15, col: '#ece4d2', col2: '#3a3030', tail: 'court', ear: 7, laine: 1 },
  chevre:  { L: 54, H: 26, leg: 30, neck: 20, na: -0.9, head: 16, col: '#e3dccb', col2: '#6d5a48', horn: 'arc', tail: 'court', ear: 7, barbe: 1 },
  renard:  { L: 54, H: 20, leg: 22, neck: 16, na: -0.6, head: 17, col: '#b9652f', col2: '#efe2c8', tail: 'touffe', ear: 9, museau: 1 },
  loup:    { L: 62, H: 24, leg: 30, neck: 18, na: -0.5, head: 19, col: '#6f6a64', col2: '#cfc8bb', tail: 'touffe', ear: 9, museau: 1 },
  lapin:   { L: 30, H: 20, leg: 10, neck: 6, na: -0.9, head: 12, col: '#9b8466', col2: '#efe6d4', tail: 'pompon', ear: 16, bond: 1 },
};
M.BETES = Object.keys(BETES);

// Un animal. o : { dir=1, ph (phase de pas, en tours), brume=0.3, col, col2, bond (lapin), tete (rad, + = baisse la tête pour brouter) }
M.animal = function (kind, x, y, s, o = {}) {
  const B = BETES[kind]; if (!B) throw new Error('animal inconnu : ' + kind);
  const br = o.brume == null ? 0.3 : o.brume, col = fCol(o.col || B.col, br), col2 = fCol(o.col2 || B.col2, br), dark = fCol('#2a2024', br);
  const ph = (o.ph || 0) * TAU, sw = o.immobile ? 0 : 0.42;
  const hop = B.bond ? Math.abs(Math.sin(ph / 2)) * 14 : Math.abs(Math.sin(ph)) * 1.6;
  c.save(); c.translate(x, y - hop * s); c.scale((o.dir || 1) * s, s);
  const L = B.L, Hh = B.H, lg = B.leg, by = -lg - Hh / 2;      // centre du corps
  const legY = -by - Hh * 0.25;                               // longueur hanche → sol
  const legAt = (lx, a, colL) => { c.save(); c.translate(lx, by + Hh * 0.25); c.rotate(a);
    c.beginPath(); c.moveTo(-5.5, -2); c.quadraticCurveTo(6, 0, 4.5, legY * 0.45); c.lineTo(2, legY); c.lineTo(-2, legY); c.quadraticCurveTo(-3, legY * 0.45, -5.5, -2); c.closePath();
    c.fillStyle = colL; c.fill(); c.restore(); };
  // pattes du fond (plus sombres)
  const backC = mixc(col.startsWith('#') ? col : '#888888', '#2a2024', 0.25);
  const kB = B.bond ? 0 : 1;
  legAt(-L * 0.38, -Math.sin(ph + 1.2) * sw * kB, B.laine ? dark : backC);
  legAt(L * 0.36, Math.sin(ph + 1.2) * sw * kB, B.laine ? dark : backC);
  // queue
  c.beginPath();
  const tx = -L * 0.5, ty = by - Hh * 0.2, tw = Math.sin(ph * 0.5 + 1) * 0.15;
  if (B.tail === 'long') { c.moveTo(tx, ty); c.quadraticCurveTo(tx - 8, ty + 18, tx - 6 + tw * 20, ty + 34); c.strokeStyle = col; c.lineWidth = 2.4; c.stroke(); c.beginPath(); c.ellipse(tx - 6 + tw * 20, ty + 36, 3, 5, 0, 0, TAU); c.fillStyle = dark; c.fill(); }
  else if (B.tail === 'touffe') { c.ellipse(tx - 16, ty + 6 + tw * 10, 20, 7, -0.35 + tw, 0, TAU); c.fillStyle = col; c.fill(); c.beginPath(); c.ellipse(tx - 31, ty + 11 + tw * 12, 6, 5, 0, 0, TAU); c.fillStyle = col2; c.fill(); }
  else if (B.tail === 'crin') { c.moveTo(tx, ty); c.quadraticCurveTo(tx - 16, ty + 10, tx - 12 + tw * 25, ty + 40); c.lineTo(tx - 4 + tw * 25, ty + 40); c.quadraticCurveTo(tx - 6, ty + 14, tx + 2, ty + 4); c.fillStyle = col2; c.fill(); }
  else if (B.tail === 'pompon') { c.arc(tx + 2, ty + 2, 5, 0, TAU); c.fillStyle = col2; c.fill(); }
  else { c.ellipse(tx - 2, ty + 3, 3, 6, -0.4, 0, TAU); c.fillStyle = col; c.fill(); }
  // corps
  c.beginPath();
  if (B.laine) { for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; c.moveTo(Math.cos(a) * L * 0.42 + 9, by + Math.sin(a) * Hh * 0.42); c.arc(Math.cos(a) * L * 0.42, by + Math.sin(a) * Hh * 0.42, 9, 0, TAU); } c.ellipse(0, by, L * 0.48, Hh * 0.48, 0, 0, TAU); }
  else c.ellipse(0, by, L * 0.5, Hh * 0.5, -0.04, 0, TAU);
  c.fillStyle = col; c.fill(); fLiser(c, 1.4 / s);
  if (!SIL && !B.laine) {                                      // ventre clair / taches
    c.save(); c.clip();
    if (B.taches) { c.fillStyle = col2; c.beginPath(); c.ellipse(-L * 0.15, by - 4, 13, 9, 0.4, 0, TAU); c.ellipse(L * 0.24, by + 4, 9, 7, -0.3, 0, TAU); c.fill(); }
    else { c.fillStyle = col2; c.beginPath(); c.ellipse(0, by + Hh * 0.5, L * 0.42, Hh * 0.22, 0, 0, TAU); c.fill(); }
    c.restore();
  }
  // pattes avant (plan avant)
  legAt(-L * 0.3, Math.sin(ph) * sw * kB + (B.bond ? 0.5 : 0), B.laine ? dark : col);
  legAt(L * 0.42, -Math.sin(ph) * sw * kB - (B.bond ? 0.6 : 0), B.laine ? dark : col);
  // cou + tête
  const nx = L * 0.38, ny = by - Hh * 0.18, na = B.na + (o.tete || 0) + Math.sin(ph * 2) * 0.03;
  c.save(); c.translate(nx, ny); c.rotate(na);
  c.beginPath(); c.moveTo(-7, 4); c.lineTo(B.neck + 2, -6); c.lineTo(B.neck + 3, 7); c.lineTo(-2, 12); c.closePath(); c.fillStyle = col; c.fill();
  if (B.crin && !SIL) { c.beginPath(); c.moveTo(-6, 2); c.lineTo(B.neck + 2, -7); c.lineTo(B.neck - 4, -11); c.lineTo(-8, -3); c.closePath(); c.fillStyle = col2; c.fill(); }
  c.translate(B.neck, 0); c.rotate(-na + (B.na < -0.7 ? 0.35 : 0.15));
  const hl = B.head;
  // cornes / bois (derrière l'oreille)
  c.strokeStyle = fCol('#3a2c22', br); c.lineCap = 'round';
  if (B.horn === 'crochet') { c.lineWidth = 2.2; c.beginPath(); c.moveTo(-2, -6); c.quadraticCurveTo(-1, -17, -7, -17); c.stroke(); }
  else if (B.horn === 'arc') { c.lineWidth = 3; c.beginPath(); c.moveTo(-1, -6); c.quadraticCurveTo(-4, -26, -18, -18); c.stroke(); }
  else if (B.horn === 'court') { c.lineWidth = 2.6; c.strokeStyle = fCol('#d9cba6', br); c.beginPath(); c.moveTo(-1, -7); c.quadraticCurveTo(2, -14, -3, -16); c.stroke(); }
  else if (B.horn === 'bois') { c.lineWidth = 2; c.beginPath(); c.moveTo(-1, -7); c.quadraticCurveTo(-8, -26, -2, -44); c.moveTo(-4, -18); c.lineTo(6, -26); c.moveTo(-5, -28); c.lineTo(5, -38); c.moveTo(-3, -36); c.lineTo(-12, -46); c.stroke(); }
  // tête : profil effilé vers le museau
  c.beginPath(); c.moveTo(-8, -6); c.quadraticCurveTo(hl * 0.3, -11, hl, -2 - (B.museau ? 2 : 0)); c.quadraticCurveTo(hl + 4, 2, hl - 1, 5); c.quadraticCurveTo(hl * 0.3, 9, -6, 8); c.closePath();
  c.fillStyle = col; c.fill(); fLiser(c, 1.2 / s);
  if (!SIL) {
    if (kind === 'chamois') { c.fillStyle = col2; c.beginPath(); c.moveTo(-2, -5); c.lineTo(hl - 2, -3); c.lineTo(hl - 4, 0); c.lineTo(-2, -1); c.fill(); }
    if (B.barbe) { c.fillStyle = col2; c.beginPath(); c.moveTo(hl * 0.6, 6); c.lineTo(hl * 0.45, 14); c.lineTo(hl * 0.35, 7); c.fill(); }
    if (B.museau || B.taches) { c.fillStyle = B.taches ? fCol('#d9a79a', br) : dark; c.beginPath(); c.arc(hl - 1, B.taches ? 1 : -1, B.taches ? 4.5 : 2.2, 0, TAU); c.fill(); }
    c.fillStyle = dark; c.beginPath(); c.arc(hl * 0.35, -3.5, 1.6, 0, TAU); c.fill();         // œil
  }
  // oreille
  c.beginPath(); c.moveTo(-3, -6); c.lineTo(-8 - B.ear * 0.25, -6 - B.ear); c.lineTo(2, -7); c.closePath(); c.fillStyle = col; c.fill(); fLiser(c, 1 / s);
  c.restore();
  c.restore();
};

// Animal qui traverse (sur un rail lointain, crête, prairie). o : { x0, x1, y, t0=0, dur=8, s=0.35, n=1, ecart=70, broute (0..1 : s'arrête brouter au milieu), seed, … options de M.animal }
M.passage = function (kind, t, o = {}) {
  const n = o.n || 1, R = rng(o.seed || 3), dur = o.dur || 8, t0 = o.t0 || 0, s = o.s || 0.35;
  const x0 = o.x0 == null ? -80 : o.x0, x1 = o.x1 == null ? 1160 : o.x1, dir = x1 >= x0 ? 1 : -1;
  for (let i = 0; i < n; i++) {
    const dl = i * (o.ecart || 70) / Math.abs(x1 - x0) * dur + R() * 0.3, sz = s * (0.88 + R() * 0.2);
    let u = (t - t0 - dl) / dur; if (o.boucle) u = ((u % 1) + 1) % 1; if (u < 0 || u > 1) continue;
    let k = u, pause = 0;
    if (o.broute) { const p0 = 0.5 - o.broute / 2, p1 = 0.5 + o.broute / 2; pause = smooth(p0, p0 + 0.06, u) * (1 - smooth(p1 - 0.06, p1, u)); k = u < p0 ? u : u > p1 ? u - (p1 - p0) : p0; k /= 1 - (p1 - p0); }
    const x = lerp(x0, x1, k), steps = Math.abs(x1 - x0) * k / (95 * sz);
    M.animal(kind, x, (o.y || 1150) + (R() - 0.5) * 6, sz, Object.assign({}, o, { dir, ph: steps + R(), tete: pause * 1.2, immobile: pause > 0.5 }));
  }
};

// Marmotte qui sort de son terrier, se dresse, puis rentre. o : { t0, t1, brume }
M.marmotte = function (t, x, y, s = 0.5, o = {}) {
  const t0 = o.t0 || 0, t1 = o.t1 == null ? t0 + 3 : o.t1;
  const up = M.easeOut((t - t0) / 0.35) * (1 - M.easeIn((t - t1) / 0.25)); const br = o.brume == null ? 0.25 : o.brume;
  c.save(); c.translate(x, y); c.scale(s, s);
  c.beginPath(); c.ellipse(0, 2, 26, 7, 0, 0, TAU); c.fillStyle = fCol('#3b2c22', br); c.fill();          // terrier
  if (up > 0.01) {
    c.save(); c.beginPath(); c.rect(-40, -120, 80, 120); c.clip();
    const h = up * 62, look = Math.sin(t * 2.3) * 0.12 * up;
    c.translate(0, 40 - h - 40 * (1 - up)); c.rotate(look);
    c.beginPath(); c.ellipse(0, 0, 13, 26, 0, 0, TAU); c.fillStyle = fCol('#8a6a48', br); c.fill(); fLiser(c, 1.2 / s);
    c.beginPath(); c.ellipse(2, -26, 10, 9, 0, 0, TAU); c.fill(); fLiser(c, 1.2 / s);
    if (!SIL) { c.fillStyle = fCol('#e3d3b2', br); c.beginPath(); c.ellipse(4, 2, 6, 15, 0, 0, TAU); c.fill(); c.fillStyle = fCol('#1f1716', br); c.beginPath(); c.arc(6, -28, 1.7, 0, TAU); c.fill(); c.beginPath(); c.arc(11, -24, 1.6, 0, TAU); c.fill(); }
    c.fillStyle = fCol('#6a4f36', br); c.beginPath(); c.ellipse(9, -6, 3, 6, -0.6, 0, TAU); c.fill();     // pattes repliées
    c.restore();
  }
  c.restore();
};

// Papillons qui volettent dans une zone. o : { x, y, rx=120, ry=60, n=3, s=1, seed, cols }
M.papillons = function (t, o = {}) {
  t = TG(t);
  const R = rng(o.seed || 7), n = o.n || 3, s = o.s || 1, cols = o.cols || ['#d8a03a', '#e9e2cf', '#b9643e', '#8fa2b8'];
  for (let i = 0; i < n; i++) {
    const a = R() * TAU, f1 = 0.35 + R() * 0.3, f2 = 0.5 + R() * 0.4, col = cols[i % cols.length];
    const x = (o.x || 540) + Math.sin(t * f1 * TAU * 0.5 + a) * (o.rx || 120), y = (o.y || 1100) + Math.sin(t * f2 * TAU * 0.5 + a * 2) * (o.ry || 60) - Math.abs(Math.sin(t * 5 + a)) * 6;
    const fl = 0.25 + 0.75 * Math.abs(Math.sin(t * 11 + a * 3));
    c.save(); c.translate(x, y); c.scale(s, s); c.rotate(Math.sin(t * 1.3 + a) * 0.3);
    for (const sd of [-1, 1]) { c.save(); c.scale(fl * sd, 1); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(10, -14, 14, -6); c.quadraticCurveTo(12, 2, 0, 1); c.quadraticCurveTo(10, 4, 8, 10); c.quadraticCurveTo(2, 8, 0, 1); c.fillStyle = col; c.fill(); fLiser(c, 0.8 / s); c.restore(); }
    c.fillStyle = '#2a2024'; c.fillRect(-0.8, -5, 1.6, 10);
    c.restore();
  }
};

// Poissons qui sautent hors de l'eau (mer, lac, rivière). o : { x0, x1, y (surface), n=3, periode=3.2, s=1, seed, col }
M.poissons = function (t, o = {}) {
  t = TG(t);
  const R = rng(o.seed || 9), n = o.n || 3, per = o.periode || 3.2, s = o.s || 1, col = fCol(o.col || '#7e8f98', o.brume || 0);
  for (let i = 0; i < n; i++) {
    const x = lerp(o.x0 || 300, o.x1 || 800, R()), off = R() * per, dir = R() < 0.5 ? -1 : 1;
    const u = (((t + off) % per) + per) % per / 0.75; if (u > 1) continue;
    const px = x + dir * (u - 0.5) * 70 * s, py = (o.y || 1300) - Math.sin(u * Math.PI) * 60 * s, rot = dir * (u - 0.5) * 2.2;
    c.save(); c.translate(px, py); c.rotate(rot); c.scale(dir * s, s);
    c.beginPath(); c.moveTo(16, 0); c.quadraticCurveTo(4, -8, -10, 0); c.lineTo(-18, -7); c.lineTo(-16, 0); c.lineTo(-18, 7); c.lineTo(-10, 0); c.quadraticCurveTo(4, 8, 16, 0); c.fillStyle = col; c.fill(); fLiser(c, 1 / s);
    c.restore();
    if (!SIL && (u < 0.12 || u > 0.88)) {                                   // éclaboussure au départ et à l'arrivée
      const e = u < 0.5 ? u / 0.12 : (1 - u) / 0.12, ex = x + dir * ((u < 0.5 ? -0.5 : 0.5) * 70 * s);
      c.strokeStyle = `rgba(235,240,240,${0.7 * (1 - e)})`; c.lineWidth = 1.6;
      c.beginPath(); c.ellipse(ex, o.y || 1300, 6 + 14 * (1 - e) * s, 3 * s, 0, 0, TAU); c.stroke();
    }
  }
};

// Bande de fleurs et d'herbes qui ondulent (pied de coulisse, prairie, bord de chemin). o : { x0, x1, y, n=30, h=40, seed, cols, brume=0, herbe=true }
M.fleurs = function (t, o = {}) {
  t = TG(t);
  const R = rng(o.seed || 11), n = o.n || 30, x0 = o.x0 == null ? 140 : o.x0, x1 = o.x1 == null ? 940 : o.x1, y = o.y || 1390, h = o.h || 40, br = o.brume || 0;
  const cols = (o.cols || ['#c9b45a', '#e8e0cc', '#b46a6a', '#8b8fb8', '#d89a4a']).map((k) => fCol(k, br)), vert = fCol('#5f6b45', br), vertL = fCol('#7d8a5a', br);
  for (let i = 0; i < n; i++) {
    const x = lerp(x0, x1, (i + R()) / n), hh = h * (0.55 + R() * 0.7), ph = R() * TAU, sw = Math.sin(t * (1.1 + R() * 0.6) + ph + x * 0.01) * 0.12;
    const tx = x + Math.sin(sw) * hh, ty = y - Math.cos(sw) * hh;
    if (o.herbe !== false) for (let g = 0; g < 3; g++) {
      const gx = x + (g - 1) * 4, gh = hh * (0.5 + 0.2 * g), gs = sw * 1.3 + (g - 1) * 0.25;
      c.beginPath(); c.moveTo(gx - 1.8, y); c.quadraticCurveTo(gx + Math.sin(gs) * gh * 0.5, y - gh * 0.6, gx + Math.sin(gs) * gh, y - gh); c.quadraticCurveTo(gx + Math.sin(gs) * gh * 0.5 + 1, y - gh * 0.55, gx + 1.8, y); c.fillStyle = g === 1 ? vertL : vert; c.fill();
    }
    if (R() < 0.6) {
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.sin(sw) * hh * 0.4, y - hh * 0.5, tx, ty); c.strokeStyle = vert; c.lineWidth = 1.4; c.stroke();
      const col = cols[Math.floor(R() * cols.length)], r = 3.2 + R() * 2.6;
      for (let p = 0; p < 5; p++) { const a = p / 5 * TAU + sw; c.beginPath(); c.ellipse(tx + Math.cos(a) * r, ty + Math.sin(a) * r, r * 0.8, r * 0.5, a, 0, TAU); c.fillStyle = col; c.fill(); }
      c.beginPath(); c.arc(tx, ty, r * 0.45, 0, TAU); c.fillStyle = fCol('#e2b23a', br); c.fill();
    }
  }
};
