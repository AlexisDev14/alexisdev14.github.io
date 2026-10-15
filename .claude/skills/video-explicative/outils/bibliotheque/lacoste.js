// lacoste.js — « Le crocodile Lacoste » (Boston 1925 → 1933) : Lacoste, capitaine, journalistes J1/J2, valise alligator, reptiles croco/alligator, polo, portant, raquette, vitrine, court. Espace M.lac. Mode d emploi : lacoste.md
// persos.js — « Le crocodile Lacoste, né d'un alligator » : marionnettes, accessoires et décors PROPRES À CETTE VIDÉO. Espace M.lac (alias LAC). Appeler LAC.init() dans S.init.
// Mode d'emploi : persos.md (les plans ne lisent pas ce fichier). Aucun texte, lettre, chiffre ni logo. Déterministe (M.rng / hash) : S.draw reste une fonction pure de t.
// INDEX
//   MARIONNETTES (tige ; (x,y) = pieds ; slot: ST.slotF/slotB) : LAC.lacoste (pose.tenue 'longues'|'polo'), LAC.capitaine, LAC.journaliste (pose.qui 1|2)
//     gestes communs (0..1) : tendre montre poing dos poche epaules affaisse gratte tape pointe ; tenu/tenuB/tenuO/tenuBO/droit/droitB/deuxMains/handF/handB
//     journaliste : ecrit (J1 : calepin + crayon), vise (J2 : appareil photo aux yeux, deux mains), eclair 0..1
//   OBJETS (tenus ou seuls, sans tige) : raquette balle valise calepin crayon appareil polo portant ; LAC.pt(r, nom[, arriere]) ; LAC.crocMini(x,y,k)
//   REPTILE (tige) : LAC.reptile(x,y,s,{type 'croco'|'alligator', vue 'profil'|'dessus', gueule, queue, marche, t, tige})
//   DÉCORS : LAC.init() → LAC.K = { vitrine, vitre, reverbere, court, gradins, filet } ; repères LAC.VITRINE, LAC.COURT
(function () {
  'use strict';
  const X = M.X, P = M.P, TAU = M.TAU, PI = Math.PI, D = 180 / PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, hash } = M;
  const LAC = (M.lac = {});
  const CH = M.chars;
  const cx_ = () => M.ctx();
  const SIL = () => M._sil();
  const OFFP = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];

  // ------------------------------------------------------------ géométrie
  function ep(cx, cy, rx, ry, n, a0, a1) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; }
  function ell(cx, cy, rx, ry, n) { const o = ep(cx, cy, rx, ry, n || 16, 0, TAU); o.pop(); return o; }
  const mp = (m, p) => [m.a * p[0] + m.c * p[1] + m.e, m.b * p[0] + m.d * p[1] + m.f];
  const rect = (x0, y0, x1, y1) => [[x0, y0, 1], [x1, y0, 1], [x1, y1, 1], [x0, y1, 1]];
  const normA = (a) => { while (a > PI) a -= TAU; while (a < -PI) a += TAU; return a; };
  function rrect(x0, y0, x1, y1, r) {
    return ep(x1 - r, y0 + r, r, r, 4, -PI / 2, 0).concat(ep(x1 - r, y1 - r, r, r, 4, 0, PI / 2), ep(x0 + r, y1 - r, r, r, 4, PI / 2, PI), ep(x0 + r, y0 + r, r, r, 4, PI, PI * 1.5));
  }
  function qbez(p0, p1, p2, n) { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]); } return o; }
  function ribbon(line, w0, w1) {
    const L = [], R = [];
    for (let i = 0; i < line.length; i++) {
      const a = line[Math.max(0, i - 1)], b = line[Math.min(line.length - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      const w = lerp(w0, w1, i / (line.length - 1)) / 2;
      L.push([line[i][0] - dy * w, line[i][1] + dx * w]); R.push([line[i][0] + dy * w, line[i][1] - dx * w]);
    }
    return L.concat(R.reverse());
  }
  const pc = (pts, base, paint, seed, o) => piece(pts, base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));
  LAC.geo = { ep, ell, rect, rrect, qbez, ribbon };

  // ------------------------------------------------------------ bras à articulations rondes (rivet au centre de chaque arrondi)
  const R_COUDE = 11.5, LA = 96, LB = Math.hypot(4, 96), PHI = Math.atan2(-4, 96), SH_F = [-2, -146], SH_B = [-10, -146];
  function armR(len, lift) { const wt = 15, l = lift || 0; return ep(0, -l, wt, wt, 10, PI, TAU).concat([[wt - 1, 40], [R_COUDE + 0.5, len - 6]], ep(0, len, R_COUDE, R_COUDE, 10, 0, PI), [[-R_COUDE - 0.5, len - 6], [-wt + 1, 40]]); }
  function foreR(kind) {
    const top = ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU);
    if (kind === 'poche') return top.concat([[11, 20], [11, 64, 1], [-11, 66, 1], [-11, 20]]);       // main cachée dans la poche
    return top.concat(X.forePts(kind).slice(2));
  }
  function ik2(S, T, pick) {                                                   // IK dans le repère du torse ; pick 'bas' | 'avant' | 'arriere'
    const vx = T[0] - S[0], vy = T[1] - S[1];
    const d = clamp(Math.hypot(vx, vy), Math.abs(LA - LB) + 1, LA + LB - 0.5), tv = Math.atan2(-vx, vy);
    const a1 = Math.acos(clamp((LA * LA + d * d - LB * LB) / (2 * LA * d), -1, 1));
    let best = null;
    for (const sg of [1, -1]) {
      const a = tv + sg * a1, E = [S[0] - LA * Math.sin(a), S[1] + LA * Math.cos(a)];
      const cAbs = Math.atan2(-(T[0] - E[0]), T[1] - E[1]) - PHI;
      const sc = pick === 'avant' ? E[0] : pick === 'arriere' ? -E[0] : E[1];
      if (!best || sc > best.sc) best = { a: normA(a), b: normA(cAbs - a), sc };
    }
    return best;
  }

  // =====================================================================
  // PETIT CROCODILE (brodé sur le polo) — dessin, pas un logo écrit ; tête vers +x, ≈ 34 × 12 à k = 1
  // =====================================================================
  const CROC_MINI = [[-17, -8], [-12, -4], [-6, -4.5], [0, -5.5], [6, -5.5], [9, -7], [11, -5.5], [17.5, -4.6], [11, -2.4], [16.5, 0.6], [10, 1.6], [6, 2], [6.5, 4.2], [3.6, 4.2], [3, 2.2], [-4, 2.2], [-5, 4.2], [-7.8, 4.2], [-7.4, 2], [-11, 1], [-14, -1.2]];
  function crocMini(x, y, k, col) {
    k = k || 1; const tp = (pts) => pts.map((q) => [x + q[0] * k, y + q[1] * k]);
    fillPts(tp(CROC_MINI), col || '#3f7a3a', 0, 0);
    fillPts(tp([[11, -2.6], [17, -4.2], [15.8, 0.2]]), '#a8322a', 0, 0);
    strokePts(tp([[-12, -3.6], [-2, -4.6], [8, -4.8]]), 'rgba(20,50,20,0.55)', 0.8);
    dot(x + 8.4 * k, y - 5.4 * k, 0.9 * k, '#f2eedf');
  }
  LAC.crocMini = crocMini;

  // =====================================================================
  // OBJETS — chaque objet se dessine dans son repère : seul (accessoire) ou tenu (pièce 'objet' de l'avant-bras)
  // =====================================================================
  const BOIS = '#9a6a3c', BOISD = '#6e4a2a', BOISL = '#c4955c', LAITON = '#b08d45', LAITONL = '#dcc078', LAITOND = '#76592a';
  // ---------------- raquette en bois, cordage ivoire (tête vers le haut ; origine = milieu du manche)
  const RQ = { cy: -132, rx: 38, ry: 54, w: 8 };
  function drawRaquette(o) {
    const { cy, rx, ry, w } = RQ, CORDE = '#ece3c8';
    pc([[-8, -36], [8, -36], [9, 30], [11, 40, 1], [-11, 40, 1], [-9, 30]], '#5a3a22', () => {
      for (let y = -30; y < 38; y += 7) strokePts([[-9, y], [9, y - 5]], 'rgba(30,18,8,0.55)', 1);
      fillPts(rect(-11, 32, 11, 40), '#3b2616');
    }, 7101);
    pc([[-7, -34], [-24, cy + ry - 6], [-14, cy + ry + 4], [0, -64], [14, cy + ry + 4], [24, cy + ry - 6], [7, -34]], BOIS, () => {
      fillPts([[-5, -40], [5, -40], [0, -60]], BOISL); hatch(null, 1.2, 3.4, 0.18);
    }, 7102);
    const out = ell(0, cy, rx + w, ry + w, 30), inn = ell(0, cy, rx, ry, 30);
    pc(out, BOIS, () => {
      fillPts(inn, CORDE, 0, 0);
      for (let x = -rx + 6; x < rx; x += 7.5) { const h = ry * Math.sqrt(Math.max(0, 1 - (x / rx) ** 2)); strokePts([[x, cy - h], [x, cy + h]], 'rgba(150,130,90,0.75)', 0.9); }
      for (let y = -ry + 6; y < ry; y += 7.5) { const h = rx * Math.sqrt(Math.max(0, 1 - (y / ry) ** 2)); strokePts([[-h, cy + y], [h, cy + y]], 'rgba(150,130,90,0.75)', 0.9); }
      strokePts(inn.concat([inn[0]]), 'rgba(60,35,15,0.7)', 1.6);
      strokePts(ep(0, cy, rx + w * 0.55, ry + w * 0.55, 14, PI * 1.05, PI * 1.45), 'rgba(255,230,180,0.6)', 1.6);
      hatch([[rx - 4, cy - ry - 10], [rx + 12, cy - ry - 10], [rx + 12, cy + ry + 10], [rx - 4, cy + ry + 10]], 0.9, 3, 0.3);
    }, 7103);
  }
  // ---------------- balle blanche (origine = centre)
  function drawBalle() {
    pc(ell(0, 0, 11, 11, 16), '#f2efe4', () => {
      strokePts(ep(-14, 0, 9, 9, 8, -1.1, 1.1), 'rgba(110,100,80,0.75)', 1.1); strokePts(ep(14, 0, 9, 9, 8, PI - 1.1, PI + 1.1), 'rgba(110,100,80,0.75)', 1.1);
      shade(-6, -6, 8, 8, 0.3, [-12, -12, 12, 12]);
    }, 7111);
  }
  // ---------------- valise rigide en peau d'alligator (origine = milieu du fond) ; 200 × 128 (+ poignée 26)
  const VL = { W2: 100, H: 128 };
  function drawValise(o) {
    const { W2, H } = VL, CUIR = '#665b33', CUIRD = '#4a4124', CUIRL = '#7f7444';
    pc([[-30, -H + 3], [-27, -H - 17], [-17, -H - 26], [17, -H - 26], [27, -H - 17], [30, -H + 3], [20, -H + 3], [17, -H - 12], [-17, -H - 12], [-20, -H + 3]], '#3b2a1a', () => {
      strokePts([[-22, -H - 19], [22, -H - 19]], 'rgba(255,230,190,0.3)', 1.3); hatch(null, 0.5, 3, 0.25);
    }, 7201);
    for (const sx of [-1, 1]) pc(rrect(sx * 28 - 8, -H - 5, sx * 28 + 8, -H + 6, 2), LAITON, () => strokePts([[sx * 28 - 5, -H - 2], [sx * 28 + 5, -H - 2]], LAITONL, 1.2), 7202 + sx);
    pc(rrect(-W2, -H, W2, 0, 12), CUIRD, () => {
      const c = cx_();
      for (let r = 0, y = -H + 36; y < -6; r++, y += 13) {                      // écailles du ventre : tuiles plus larges au centre
        let x = -W2 + 4 + (r % 2) * 6;
        while (x < W2 - 4) {
          const wd = 9 + 13 * (1 - Math.abs(x) / W2) + 3 * hash(r * 7 + Math.round(x)), h = hash(r * 31 + Math.round(x));
          fillPts(ell(x + wd / 2, y + 6, wd / 2 - 1, 5.2, 10), h > 0.5 ? CUIRL : CUIR, 0, 0);
          strokePts(ep(x + wd / 2, y + 6, wd / 2 - 2.5, 3.6, 5, PI * 1.1, PI * 1.6), 'rgba(255,240,190,0.25)', 0.8);
          x += wd;
        }
      }
      for (let i = 0, x = -W2 + 6; x < W2; i++, x += 12) {                      // couvercle : petites écailles en losange
        for (const y of [-H + 10, -H + 22]) fillPts([[x, y - 5], [x + 5, y], [x, y + 5], [x - 5, y]], (i + y) % 2 ? CUIRL : CUIRD, 0, 0);
      }
      strokePts([[-W2, -H + 34], [W2, -H + 34]], 'rgba(25,20,10,0.8)', 2.2);
      strokePts([[-W2, -H + 37], [W2, -H + 37]], 'rgba(255,240,200,0.25)', 1);
      for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {           // coins de cuir sombre
        const x0 = sx * W2, y0 = sy < 0 ? -H : 0;
        fillPts([[x0, y0], [x0 - sx * 26, y0], [x0, y0 - sy * 26]].map((q) => [q[0], q[1] + (sy < 0 ? 0 : 0)]), '#2f2614', 0, 0);
      }
      strokePts(rrect(-W2 + 5, -H + 5, W2 - 5, -5, 9).concat([[W2 - 14, -H + 5]]), 'rgba(230,210,150,0.35)', 1.2);
      if (o.brille) { c.save(); c.globalAlpha = clamp(o.brille); strokePts([[-W2 + 20, -10], [-W2 + 70, -H + 8]], 'rgba(255,250,230,0.8)', 3); strokePts([[-W2 + 40, -10], [-W2 + 82, -H + 26]], 'rgba(255,250,230,0.5)', 2); c.restore(); }
      shade(W2, 0, -W2, 0, 0.25, [-W2, -H, W2, 0]);
    }, 7204);
    for (const sx of [-1, 1]) pc(rrect(sx * 58 - 8, -H + 26, sx * 58 + 8, -H + 46, 2), LAITON, () => { dot(sx * 58, -H + 39, 2.4, LAITOND); strokePts([[sx * 58 - 5, -H + 29], [sx * 58 + 5, -H + 29]], LAITONL, 1.2); }, 7206 + sx);
  }
  // ---------------- calepin de reporter (origine = bas tenu) ; o.lignes 0..1 (gribouillis écrits, pas de lettres)
  function drawCalepin(o) {
    pc(rect(-25, -70, 25, 12), '#4a3528', null, 7301);
    pc(rect(-22, -66, 22, 9), '#efe8d4', () => {
      const n = Math.round(clamp(o.lignes == null ? 0.5 : o.lignes) * 7);
      for (let i = 0; i < 7; i++) strokePts([[-18, -50 + i * 8], [18, -50 + i * 8]], 'rgba(120,140,170,0.35)', 0.7);
      for (let i = 0; i < n; i++) { const pts = []; for (let k = 0; k <= 10; k++) pts.push([-16 + k * (28 - 6 * hash(i)) / 10, -52 + i * 8 + Math.sin(k * 2.1 + i) * 2]); strokePts(pts, 'rgba(40,35,50,0.75)', 1); }
    }, 7302);
    for (let x = -18; x <= 18; x += 6) { strokePts(ep(x, -68, 3, 4, 6, PI, TAU), '#3a3a3a', 1.4); }
  }
  // ---------------- crayon (origine = prise ; pointe en bas, vers l'avant)
  function drawCrayon() {
    const a = [-12, -36], b = [12, 26], L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L, nx = -uy * 3.6, ny = ux * 3.6;
    const tip = [b[0] + ux * 12, b[1] + uy * 12];
    pc([[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], tip, [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]], '#c9a14e', () => {
      fillPts([[b[0] + nx, b[1] + ny], tip, [b[0] - nx, b[1] - ny]], '#e2c595'); fillPts([[b[0] + ux * 8 + nx * 0.4, b[1] + uy * 8 + ny * 0.4], tip, [b[0] + ux * 8 - nx * 0.4, b[1] + uy * 8 - ny * 0.4]], '#2a2a2a');
      fillPts([[a[0] + nx, a[1] + ny], [a[0] + ux * 6 + nx, a[1] + uy * 6 + ny], [a[0] + ux * 6 - nx, a[1] + uy * 6 - ny], [a[0] - nx, a[1] - ny]], '#b5615a');
    }, 7311);
  }
  // ---------------- appareil photo à soufflet, de profil, objectif vers +x (origine = prise sous le boîtier)
  function drawAppareil(o) {
    const c = cx_(), e = clamp(o.eclair || 0);
    pc([[-30, -46], [-30, -62], [-24, -66], [-36, -84], [-30, -96], [-14, -100], [-4, -94], [-6, -84], [-18, -70], [-22, -62], [-22, -46]], '#c9c4b6', () => {
      fillPts([[-30, -96], [-14, -100], [-4, -94], [-6, -84], [-18, -70]], '#eeeae0'); strokePts([[-26, -66], [-26, -48]], '#555', 2);
    }, 7321);                                                                   // réflecteur du flash (tige + coupelle)
    pc(rrect(-34, -46, 0, 2, 4), '#2b2622', () => { for (let y = -40; y < 0; y += 5) strokePts([[-32, y], [-2, y + 1]], 'rgba(255,255,255,0.08)', 1); fillPts(rect(-28, -56, -14, -46), '#3a332d'); fillPts(rect(-26, -54, -16, -48), '#9fb3b8'); }, 7322);
    pc([[0, -40], [34, -34], [34, -4], [0, 0]], '#3a2f28', () => { for (let x = 4; x < 34; x += 6) strokePts([[x, -39 + x * 0.17], [x + 3, -20], [x, -1 - x * 0.08]], 'rgba(0,0,0,0.5)', 1.2); }, 7323);
    pc(rect(34, -40, 42, 2), '#1f1b18', () => strokePts([[35, -38], [35, 0]], 'rgba(255,255,255,0.2)', 1), 7324);
    pc(ell(46, -19, 9, 11, 14), LAITON, () => { fillPts(ell(47, -19, 6, 8, 12), '#2c3a42'); strokePts([[45, -24], [47, -22]], 'rgba(255,255,255,0.8)', 1.4); }, 7325);
    strokePts([[0, 1], [44, 3]], '#8a8478', 2);
    if (e > 0.01 && !SIL()) {
      c.save(); const g = c.createRadialGradient(-20, -84, 4, -20, -84, 90 * e);
      g.addColorStop(0, `rgba(255,255,245,${0.95 * e})`); g.addColorStop(1, 'rgba(255,250,220,0)');
      c.fillStyle = g; c.beginPath(); c.arc(-20, -84, 90 * e, 0, TAU); c.fill();
      c.strokeStyle = `rgba(255,252,235,${0.9 * e})`; c.lineWidth = 3 * M._lw(); c.lineCap = 'round';
      for (let i = 0; i < 9; i++) { const a = -PI * 0.9 + i * PI * 0.22, r0 = 26, r1 = 26 + 50 * e; c.beginPath(); c.moveTo(-20 + Math.cos(a) * r0, -84 + Math.sin(a) * r0); c.lineTo(-20 + Math.cos(a) * r1, -84 + Math.sin(a) * r1); c.stroke(); }
      c.restore();
    }
  }
  // ---------------- polo / chemise sur cintre, de face (origine = crochet du cintre) ; 160 × 210
  function drawPolo(o) {
    const longues = o.manches === 'longues', croc = o.croc == null ? !longues : o.croc;
    const BL = o.couleur || '#f3f0e6', BLD = '#d9d3c2';
    strokePts([[0, 26], [0, 10], [4, 2], [10, -1], [14, 4]], '#6a665e', 2.6);
    pc([[-72, 42], [0, 22], [72, 42], [70, 48], [0, 32], [-70, 48]], BOIS, () => hatch(null, 0.2, 3, 0.2), 7401);
    if (o.vide) return;
    const sl = longues
      ? [[[-50, 38], [-70, 50], [-82, 120], [-86, 190], [-66, 192], [-62, 124], [-52, 76]], [[50, 38], [70, 50], [82, 120], [86, 190], [66, 192], [62, 124], [52, 76]]]
      : [[[-50, 38], [-74, 48], [-90, 86], [-66, 96], [-54, 74]], [[50, 38], [74, 48], [90, 86], [66, 96], [54, 74]]];
    for (const s of sl) pc(s, BLD, () => { hatch(null, 0.9, 3.4, 0.2); if (longues) strokePts([[s[3][0], 176], [s[4][0], 178]], 'rgba(90,80,60,0.6)', 1.2); else strokePts([s[2], s[3]], 'rgba(90,80,60,0.45)', 2.5); }, 7402 + s[1][0]);
    pc([[-50, 38], [-16, 30], [0, 40], [16, 30], [50, 38], [56, 80], [56, 196], [30, 202], [0, 204], [-30, 202], [-56, 196], [-56, 80]], BL, () => {
      if (longues) { strokePts([[0, 44], [0, 204]], 'rgba(90,80,60,0.45)', 1.2); for (let y = 60; y < 200; y += 26) dot(4, y, 2, '#b9b2a0'); }
      else { fillPts(rect(-6, 40, 6, 92), BLD); strokePts([[-6, 40], [-6, 92], [6, 92], [6, 40]], 'rgba(90,80,60,0.4)', 1); dot(0, 60, 2.2, '#b9b2a0'); dot(0, 80, 2.2, '#b9b2a0'); fillPts(rect(-56, 186, 56, 198), BLD); }
      if (croc) crocMini(30, 74, 0.95);
      hatch([[-56, 30], [-30, 30], [-30, 204], [-56, 204]], 0.8, 3.6, 0.22); shade(56, 0, -56, 0, 0.2, [-60, 26, 60, 206]);
    }, 7405);
    pc([[-16, 30], [0, 40], [16, 30], [22, 36], [6, 58], [0, 46], [-6, 58], [-22, 36]], longues ? '#f7f4ec' : BL, () => strokePts([[-16, 32], [0, 42], [16, 32]], 'rgba(90,80,60,0.45)', 1), 7406);
  }
  // ---------------- portant de chemises (origine = milieu du sol) ; o.chemises = [{manches, croc, couleur, vide}, …] ; o.t + o.balance
  function drawPortant(o) {
    const c = cx_(), list = o.chemises || [{ manches: 'longues' }, { manches: 'longues' }, { manches: 'courtes' }];
    pc(rect(-226, -340, 226, -328), '#4b4a48', () => strokePts([[-224, -337], [224, -337]], 'rgba(255,255,255,0.3)', 1.2), 7411);
    const n = list.length, sp = Math.min(150, 400 / Math.max(1, n));
    list.forEach((ch, i) => {
      const x = (i - (n - 1) / 2) * sp, a = (o.balance || 0) * 0.06 * Math.sin((o.t || 0) * 2.4 + i * 1.7);
      c.save(); c.translate(x, -338); c.rotate(a); drawPolo(ch || {}); c.restore();
    });
    for (const sx of [-1, 1]) {
      pc(rect(sx * 222 - 6, -346, sx * 222 + 6, -8), '#4b4a48', null, 7412 + sx);
      pc([[sx * 222 - 44, 0], [sx * 222 - 40, -10], [sx * 222 + 40, -10], [sx * 222 + 44, 0]], '#3a3936', null, 7415 + sx);
      dot(sx * 222 - 36, 0, 5, '#222'); dot(sx * 222 + 36, 0, 5, '#222');
    }
  }
  // registre : grip = point tenu ; p2 = seconde prise (deuxMains) ; pts = points nommés ; base = origine de l'accessoire seul
  const OBJ = {
    raquette: { draw: drawRaquette, grip: [0, 0], pts: { tete: [0, RQ.cy], bout: [0, RQ.cy - RQ.ry - RQ.w], manche: [0, 40] }, base: [0, 0] },
    balle: { draw: drawBalle, grip: [0, 0], pts: { centre: [0, 0] }, base: [0, 0] },
    valise: { draw: drawValise, grip: [0, -VL.H - 19], p2: () => [-VL.W2 + 20, -40], pts: { poignee: [0, -VL.H - 19], centre: [0, -VL.H / 2], fond: [0, 0] }, base: [0, 0] },
    calepin: { draw: drawCalepin, grip: [0, 4], pts: { page: [0, -28] }, base: [0, 12] },
    crayon: { draw: drawCrayon, grip: [0, 0], pts: { pointe: [17, 36] }, base: [0, 0] },
    appareil: { draw: drawAppareil, grip: [-16, 0], p2: () => [22, 4], pts: { objectif: [56, -19], eclair: [-20, -84], viseur: [-21, -51] }, base: [-16, 2] },
    polo: { draw: drawPolo, grip: [0, 0], pts: { croc: [30, 74], bas: [0, 204] }, base: [0, 0] },
    portant: { draw: drawPortant, grip: [0, -334], pts: {}, base: [0, 0] },
  };
  LAC.OBJ = OBJ;
  const gripOf = (ob, o) => (typeof ob.grip === 'function' ? ob.grip(o) : ob.grip);
  function heldOpts(name, o, p) { const ob = OBJ[name]; return Object.assign({ t: p.t || 0 }, ob.held || {}, o || {}); }
  function heldDraw(name, o, p) {
    const ob = OBJ[name]; if (!ob) return;
    const oo = heldOpts(name, o, p), g = gripOf(ob, oo), c = cx_();
    c.save(); c.translate(-g[0], -g[1]); ob.draw(oo); c.restore();
  }
  const DOIGTS = [[-13, -9], [9, -11], [12, -4], [12, 6], [6, 11], [-6, 11], [-13, 4]];
  const doigtsPaint = () => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(70,40,30,0.5)', 1); hatch(null, 0.9, 3.4, 0.15); };
  const has = (v) => v && v !== 'rien';
  function heldParts(skin, skinD, seed) {
    return {
      objet: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (has(p.tenu)) heldDraw(p.tenu, p.tenuO, p); } },
      doigts: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 2, pts: (p) => (has(p.tenu) ? DOIGTS : OFFP), paint: doigtsPaint },
      objetB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 3, pts: OFFP, extra: (p) => { if (has(p.tenuB)) heldDraw(p.tenuB, p.tenuBO, p); } },
      doigtsBk: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skinD, seed: seed + 4, pts: (p) => (has(p.tenuB) && !p._deux ? DOIGTS : OFFP), paint: doigtsPaint },
      doigtsB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skinD, seed: seed + 5, pts: (p) => (p._deux ? DOIGTS : OFFP), paint: doigtsPaint },
    };
  }
  // point nommé de l'objet tenu (écran) : r renvoyé par LAC.lacoste / capitaine / journaliste
  LAC.pt = function (r, nom, arriere) {
    const name = arriere ? r.tenuB : r.tenu, ob = OBJ[name]; if (!ob || !ob.pts[nom]) return null;
    const oo = arriere ? r.tenuBO : r.tenuO, g = gripOf(ob, oo), q = ob.pts[nom];
    return r.w(arriere ? 'objetB' : 'objet', q[0] - g[0], q[1] - g[1]);
  };

  // =====================================================================
  // POSES — préparation commune, gestes, objets tenus, seconde main
  // =====================================================================
  function prep(p) { p = p || {}; return Object.assign({}, p, { ang: Object.assign({}, p.ang), hide: Object.assign({}, p.hide), face: Object.assign({}, p.face) }); }
  function headPt(q, hx, hy) { return mp(new DOMMatrix().translate(6, -170).rotate((q.ang.head || 0) * D), [hx, hy]); }
  function armTo(q, arm, T, pick, k) {
    if (k <= 0) return;
    const sol = ik2(arm === 'armF' ? SH_F : SH_B, T, pick), A = q.ang;
    const a0 = A[arm + '_up'] || 0, b0 = A[arm + '_lo'] || 0;
    A[arm + '_up'] = a0 + normA(sol.a - a0) * k; A[arm + '_lo'] = b0 + normA(sol.b - b0) * k;
  }
  const blend = (q, n, v, k) => { q.ang[n] = lerp(q.ang[n] || 0, v, k); };
  function plier(q, th) {
    if (!th) return;
    q.tilt = (q.tilt || 0) + th; q.dx = (q.dx || 0) - 238 * Math.sin(th); q.dy = (q.dy || 0) + 238 * (1 - Math.cos(th));
    q.ang.legF = (q.ang.legF || 0) - th; q.ang.legB = (q.ang.legB || 0) - th;
  }
  // gestes communs aux trois marionnettes (valeurs 0..1, mélangées dans cet ordre)
  function gestes(q) {
    const A = q.ang, t = q.t || 0, g = (n) => ease(clamp(q[n] || 0));
    const af = g('affaisse'), te = g('tendre'), mo = g('montre'), po = g('poing'), ds = g('dos'), pk = g('poche'), sh = g('epaules'), gr = g('gratte'), pt = g('pointe');
    if (af > 0) { plier(q, 0.06 * af); A.head = (A.head || 0) + 0.32 * af; blend(q, 'armF_up', 0.1, af); blend(q, 'armB_up', 0.06, af); blend(q, 'armF_lo', -0.06, af); q.dy = (q.dy || 0) + 4 * af; if (!q.face.brow) q.face.brow = 'worry'; }
    if (te > 0) { blend(q, 'armF_up', -1.38, te); blend(q, 'armF_lo', -0.16, te); if (te > 0.4 && !has(q.tenu)) q.handF = 'open'; }
    if (mo > 0) { blend(q, 'armF_up', -1.95, mo); blend(q, 'armF_lo', -0.22, mo); if (mo > 0.4 && !has(q.tenu)) q.handF = 'open'; }
    if (pt > 0) { blend(q, 'armF_up', -1.5, pt); blend(q, 'armF_lo', -0.06, pt); q._pointe = pt; }
    if (po > 0) { armTo(q, 'armF', [54, -164], 'bas', po); if (!has(q.tenu)) q.handF = 'fist'; }
    if (ds > 0) { armTo(q, 'armB', [-52, -40], 'bas', ds); armTo(q, 'armF', [-46, -38], 'bas', ds); }   // avant-bras en travers de la taille, main derrière le dos
    if (pk > 0) { armTo(q, 'armF', [20, 8], 'arriere', pk); if (pk > 0.5 && !has(q.tenu)) q.handF = 'poche'; }
    if (sh > 0) {
      q._hausse = sh; blend(q, 'armF_up', -0.15, sh); blend(q, 'armF_lo', -1.35, sh); blend(q, 'armB_up', 0.12, sh); blend(q, 'armB_lo', -1.8, sh);
      A.head = (A.head || 0) + 0.1 * sh; if (sh > 0.4 && !has(q.tenu)) q.handF = 'open'; if (sh > 0.4 && !has(q.tenuB)) q.handB = 'open'; if (!q.face.brow) q.face.brow = 'up';
    }
    if (gr > 0) { const w = Math.sin(t * 17) * 5 * gr; armTo(q, 'armB', headPt(q, -44, -58 + w), 'avant', gr); if (!has(q.tenuB)) q.handB = 'fist'; }   // main ARRIÈRE derrière la tête : le visage reste visible
    if (q.tape) q._tape = clamp(q.tape) * 0.3 * Math.max(0, Math.sin(t * TAU * 2.2));
  }
  function finish(q) {
    const A = q.ang, tl = q.tilt || 0;
    if (has(q.tenu) && !(q.handF && q.handF !== 'fist')) q.handF = 'fist';
    if (has(q.tenuB) && !(q.handB && q.handB !== 'fist')) q.handB = 'fist';
    if (q.droit == null && has(q.tenu)) q.droit = true;
    if (q.droitB == null && has(q.tenuB)) q.droitB = true;
    if (q._pointe && has(q.tenu)) A.objet = (A.objet || 0) + q._pointe * normA((A.armF_up || 0) + (A.armF_lo || 0) + tl + PI);
    if (q.droit) A.objet = (A.objet || 0) - ((A.armF_up || 0) + (A.armF_lo || 0) + tl);
    if (q.droitB) A.objetB = (A.objetB || 0) - ((A.armB_up || 0) + (A.armB_lo || 0) + tl);
    q._deux = false;
    if (q.deuxMains && has(q.tenu) && OBJ[q.tenu] && OBJ[q.tenu].p2) {
      const ob = OBJ[q.tenu], oo = heldOpts(q.tenu, q.tenuO, q), g = gripOf(ob, oo);
      const Hf = new DOMMatrix().translate(SH_F[0], SH_F[1]).rotate((A.armF_up || 0) * D).translate(0, LA).rotate((A.armF_lo || 0) * D).translate(4, 96).rotate((A.objet || 0) * D).translate(-g[0], -g[1]);
      const sol = ik2(SH_B, mp(Hf, ob.p2(oo)), 'bas');
      A.armB_up = sol.a; A.armB_lo = sol.b; q.handB = 'fist'; q._deux = true;
    }
    return q;
  }
  function run(def, q, x, y, s, o) {
    const r = M.puppet(def, q, x, y, s, Object.assign({ slot: M.ST.slotF }, o || {}));
    r.tenu = q.tenu; r.tenuB = q.tenuB;
    if (q.tenu && OBJ[q.tenu]) r.tenuO = heldOpts(q.tenu, q.tenuO, q);
    if (q.tenuB && OBJ[q.tenuB]) r.tenuBO = heldOpts(q.tenuB, q.tenuBO, q);
    r.pose = q;
    return r;
  }

  // ---------------- pièces de corps communes
  const LEGP = X.legPts(0.95), HEEL = [-17, 236];
  function footRot(pts, a) {
    return pts.map((q) => {
      const w = clamp((q[1] - 196) / 20); if (w <= 0) return q;
      const an = -a * w, dx = q[0] - HEEL[0], dy = q[1] - HEEL[1];
      const r = [HEEL[0] + dx * Math.cos(an) - dy * Math.sin(an), HEEL[1] + dx * Math.sin(an) + dy * Math.cos(an)];
      if (q[2]) r.push(1); return r;
    });
  }
  function legDef(at, base, shoe, seed, back, extraPaint) {
    return { parent: 'torso', at, pts: (p) => (!back && p._tape ? footRot(LEGP, p._tape) : LEGP), base, seed, noRivet: !!back, paint: (p) => {
      if (extraPaint) extraPaint(p);
      const a = !back && p._tape ? p._tape : 0, c = cx_();
      c.save(); if (a) { c.translate(HEEL[0], HEEL[1]); c.rotate(-a); c.translate(-HEEL[0], -HEEL[1]); }
      shoe(back); c.restore();
      if (!back) hatch([[-26, -20], [-6, -20], [-6, 212], [-26, 212]], 0.8, 4, 0.22); else hatch(null, 0.8, 3.6, 0.3);
    } };
  }
  const upDef = (at, base, seed, paint) => ({ parent: 'torso', at, pts: (p) => armR(LA, (p._hausse || 0) * 10), base, seed, paint: paint || (() => hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.26)) });
  function foreDef(parent, base, skin, back, seed, opt) {
    opt = opt || {};
    const hk = (p) => (back ? p.handB : p.handF) || 'fist';
    return { parent, at: [0, LA], pts: (p) => foreR(hk(p)), base, seed, paint: (p) => {
      const k = hk(p);
      if (opt.peau != null) fillPts(rect(-24, opt.peau, 24, 300), skin);
      if (opt.roule) { fillPts([[-24, opt.peau - 14, 1], [24, opt.peau - 16, 1], [24, opt.peau + 2, 1], [-24, opt.peau + 4, 1]], opt.roule); strokePts([[-14, opt.peau - 6], [14, opt.peau - 8]], 'rgba(90,80,60,0.5)', 1); }
      if (k !== 'poche') { fillPts(rect(-20, 76, 24, 130), skin); X.handPaint(null, k); }
      if (opt.cuff && k !== 'poche') fillPts(rect(-14, 62, 15, 78), opt.cuff);
      if (opt.liseré && k !== 'poche') strokePts([[-13, 58], [14, 58]], opt.liseré, 2.2);
      hatch([[-14, -10], [-3, -10], [-3, 60], [-14, 60]], 0.9, 3.8, 0.2);
    } };
  }
  const pocheDef = (col, seed) => ({ parent: 'armF_lo', at: [0, 60], noRivet: true, base: col, seed, pts: (p) => (p.handF === 'poche' ? [[-16, -2], [16, -5], [17, 9, 1], [-17, 9, 1]] : OFFP), paint: () => strokePts([[-16, -1], [16, -4]], 'rgba(15,10,5,0.65)', 1.5) });
  // assemble une marionnette : cfg = { nom, seed, peau, peauD, torso, torsoBase, torsoPaint, pant, pantD, shoe, legPaint, upF, upB, foreF, foreB, head, headPaint, hats:{nom:def}, poche }
  function mkPerso(cfg) {
    const sd = cfg.seed;
    const parts = {
      torso: { parent: null, at: [0, 0], pts: cfg.torso, base: cfg.torsoBase, seed: sd + 1, paint: cfg.torsoPaint },
      legB: legDef([-6, -2], cfg.pantD, cfg.shoe, sd + 2, true),
      legF: legDef([6, -2], cfg.pant, cfg.shoe, sd + 3, false, cfg.legPaint),
      armB_up: upDef([-10, -146], cfg.upB[0], sd + 4, cfg.upB[1]),
      armB_lo: foreDef('armB_up', cfg.foreB[0], cfg.peauD, true, sd + 5, cfg.foreB[1]),
      head: { parent: 'torso', at: [6, -170], pts: cfg.head, base: cfg.peau, seed: sd + 6, noRivet: true, paint: cfg.headPaint },
      armF_up: upDef([-2, -146], cfg.upF[0], sd + 8, cfg.upF[1]),
      armF_lo: foreDef('armF_up', cfg.foreF[0], cfg.peau, false, sd + 9, cfg.foreF[1]),
      poche: pocheDef(cfg.poche, sd + 10),
    };
    const hats = cfg.hats || {};
    Object.assign(parts, hats, heldParts(cfg.peau, cfg.peauD, sd + 20));
    return { nom: cfg.nom, hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] },
      order: ['armB_up', 'armB_lo', 'objetB', 'doigtsBk', 'legB', 'legF', 'head'].concat(Object.keys(hats), ['torso', 'armF_up', 'armF_lo', 'poche', 'objet', 'doigts', 'doigtsB']) };
  }
  const shoeFn = (top, sole, back) => (isBack) => {
    fillPts(rect(-40, 212, 60, 262), isBack ? back : top);
    if (sole) fillPts(rect(-40, 229, 60, 262), sole);
    if (!isBack) strokePts([[18, 222], [40, 226]], 'rgba(255,255,255,0.3)', 1.3);
  };

  // =====================================================================
  // RENÉ LACOSTE (1927) — longiligne, cheveux bruns plaqués en arrière, long nez ; tenue 'longues' (chemise blanche manches retroussées,
  // pull sans manches crème à liseré bleu nuit) ou 'polo' (polo blanc manches courtes + petit crocodile vert brodé). Pantalon blanc, tennis blanches.
  // =====================================================================
  const LC = { peau: '#dcb48f', peauD: '#bf9470', blanc: '#f1ede2', blancD: '#d4cebd', pull: '#e0d1a6', pullD: '#c4b48a', liser: '#2f3a58', pant: '#ebe6d8', pantD: '#cfc8b6', cheveux: '#24170f', polo: '#f4f1e8' };
  const LC_TORSO = [[-14, -176], [8, -180], [16, -168], [25, -150], [32, -112], [33, -62], [29, -18], [30, 14], [-32, 16], [-33, -40], [-35, -110], [-33, -150], [-26, -168]];
  const LC_HEAD = [[-14, 16], [10, 16], [11, 2], [18, -6], [25, -9], [29, -15], [28, -21], [30, -25], [29, -29], [33, -33], [45, -39, 1], [38, -45], [32, -53], [30, -61], [29, -69], [26, -80], [14, -93], [-6, -98], [-24, -89], [-33, -70], [-32, -46], [-24, -28], [-17, -8]];
  function lacosteHead(p) {
    const f = p.face || {};
    fillPts([[28, -76], [26, -86], [12, -97], [-8, -102], [-28, -92], [-38, -70], [-38, -42], [-30, -34], [-22, -46], [-16, -62], [-4, -74], [14, -78]], LC.cheveux, 3);
    for (const [a, b] of [[[22, -84], [-24, -84]], [[16, -90], [-26, -74]], [[10, -80], [-30, -56]]]) strokePts([a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 5], b], 'rgba(255,235,210,0.28)', 1.3);
    strokePts([[18, -80], [-4, -86], [-22, -82]], 'rgba(0,0,0,0.5)', 1);
    X.earPaint(-8, -44);
    hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.26);
    strokePts([[36, -44], [34, -38], [38, -36]], 'rgba(110,70,50,0.45)', 1);
    dot(14, -30, 8, 'rgba(200,120,100,0.18)');
    X.eye(f, 18, -54); X.brow(f, 18, -63, 'rgba(30,18,12,0.98)', 3.2); X.mouth(f, 27, -24);
  }
  function lacosteTorso(tenue) {
    return () => {
      fillPts(rect(-40, -4, 40, 20), LC.pant); fillPts(rect(-40, -3, 40, 6), '#3a3346');
      if (tenue === 'polo') {
        fillPts([[4, -184], [20, -170], [16, -158], [2, -166]], '#e6e1d4');                                 // col de polo rabattu
        fillPts(rect(16, -164, 24, -128), '#e6e1d4'); dot(20, -156, 1.9, '#b9b2a0'); dot(20, -140, 1.9, '#b9b2a0');
        crocMini(10, -118, 1.0);
        fillPts(rect(-40, -14, 40, -4), '#e9e4d6');
        hatch([[-50, -170], [-12, -170], [-10, 0], [-50, 0]], 0.75, 4.2, 0.24);
      } else {
        fillPts([[4, -184], [18, -168], [22, -150], [11, -157], [2, -168]], '#faf7ef');                       // pointe du col
        const pull = [[-40, -150], [-20, -168], [-4, -166], [8, -154], [18, -132], [24, -114], [40, -110], [40, -6], [-40, -6]];
        fillPts(pull, LC.pull);
        strokePts([[-20, -166], [-4, -164], [8, -152], [18, -130], [24, -113]], LC.liser, 2.6);
        strokePts([[-18, -161], [-3, -159], [6, -148], [15, -128], [20, -113]], '#f3ead0', 1.2);
        fillPts(rect(-40, -20, 40, -6), LC.pullD);
        for (let x = -36; x < 36; x += 4) strokePts([[x, -19], [x, -7]], 'rgba(90,75,40,0.35)', 0.8);
        for (let y = -140; y < -24; y += 9) strokePts([[-34, y], [30, y + 1]], 'rgba(120,100,60,0.12)', 1);
        hatch([[-50, -170], [-12, -170], [-10, -6], [-50, -6]], 0.75, 4.2, 0.26);
      }
      shade(36, 0, -40, 0, 0.24);
    };
  }
  function mkLacoste(tenue) {
    const polo = tenue === 'polo', sleeve = polo ? LC.polo : LC.blanc, sleeveD = polo ? '#d9d4c5' : LC.blancD;
    const upPaint = (dark) => () => {
      if (polo) { fillPts(rect(-24, 44, 24, 140), dark ? LC.peauD : LC.peau); strokePts([[-14, 42], [13, 42]], 'rgba(90,80,60,0.5)', 1.6); }
      else strokePts([[-6, 20], [-2, 50], [-6, 80]], 'rgba(90,80,60,0.3)', 1.2);
      hatch([[-16, -20], [-3, -20], [-3, polo ? 42 : 100], [-16, polo ? 42 : 100]], 0.9, 3.8, 0.22);
    };
    return mkPerso({
      nom: polo ? 'lacostePolo' : 'lacoste', seed: polo ? 8100 : 8000, peau: LC.peau, peauD: LC.peauD,
      torso: LC_TORSO, torsoBase: polo ? LC.polo : LC.blanc, torsoPaint: lacosteTorso(tenue),
      pant: LC.pant, pantD: LC.pantD, shoe: shoeFn('#eeeae0', '#6a5440', '#d6d1c4'),
      legPaint: () => strokePts([[4, 60], [6, 140], [4, 208]], 'rgba(120,110,90,0.35)', 1.1),
      upF: [sleeve, upPaint(false)], upB: [sleeveD, upPaint(true)],
      foreF: [sleeve, polo ? { peau: -20 } : { peau: 18, roule: '#fbf8f0' }], foreB: [sleeveD, polo ? { peau: -20 } : { peau: 18, roule: '#e4dfd2' }],
      head: LC_HEAD, headPaint: lacosteHead, poche: LC.pant,
    });
  }
  CH.lacLacoste = mkLacoste('longues');
  CH.lacLacostePolo = mkLacoste('polo');
  LAC.lacostePose = (p) => { const q = prep(p); gestes(q); return finish(q); };
  LAC.lacosteDef = (p) => (p && p.tenue === 'polo' ? CH.lacLacostePolo : CH.lacLacoste);
  LAC.lacoste = (pose, x, y, s, o) => run(LAC.lacosteDef(pose), LAC.lacostePose(pose), x, y, s == null ? 0.9 : s, o);

  // =====================================================================
  // LE CAPITAINE DE COUPE DAVIS — blazer bleu nuit à liseré ivoire, pochette blanche, cravate rouge, pantalon crème, souliers bicolores,
  // canotier de paille à ruban rouge, fine moustache grise, petite bedaine
  // =====================================================================
  const CA = { peau: '#e2b996', peauD: '#c4997a', blazer: '#27314b', blazerD: '#1e263b', liser: '#e4d8b6', pant: '#d8c89c', pantD: '#bfae82', paille: '#d7bb74', pailleD: '#b89a55', ruban: '#9e2b25', gris: '#a8a49b' };
  const CA_TORSO = [[-14, -176], [8, -180], [16, -168], [28, -150], [38, -112], [46, -72], [49, -36], [45, 0], [40, 32], [42, 62, 1], [-38, 64, 1], [-38, 20], [-37, -40], [-39, -110], [-35, -150], [-26, -168]];
  const CA_HEAD = [[-14, 16], [12, 16], [15, 5], [23, -3], [28, -10], [30, -17], [28, -22], [30, -26], [29, -30], [32, -34], [37, -40, 1], [33, -46], [29, -56], [29, -66], [25, -78], [12, -90], [-8, -94], [-24, -86], [-32, -68], [-31, -46], [-24, -28], [-17, -8]];
  const CA_HAT = [[-54, 10, 1], [-38, 8], [-36, -26, 1], [38, -28, 1], [40, 8], [60, 8, 1], [60, 15, 1], [-54, 16, 1]];
  function mkCapitaine() {
    return mkPerso({
      nom: 'capitaine', seed: 8200, peau: CA.peau, peauD: CA.peauD, torso: CA_TORSO, torsoBase: CA.blazer,
      torsoPaint: () => {
        fillPts([[4, -184], [18, -168], [30, -134], [36, -104], [24, -100], [12, -140], [2, -166]], '#f4f1e8');
        fillPts([[13, -168], [18, -160], [27, -124], [23, -104], [18, -118], [11, -158]], CA.ruban);
        for (const y of [-156, -144, -132, -120]) strokePts([[12, y], [24, y + 6]], 'rgba(30,30,60,0.55)', 1.4);
        fillPts([[16, -176], [30, -142], [36, -104], [26, -96], [14, -140]], CA.blazerD);
        strokePts([[16, -176], [30, -142], [36, -104], [42, -66], [48, -36], [44, 0], [39, 32], [41, 60]], CA.liser, 2.4);
        strokePts([[-38, 62], [41, 60]], CA.liser, 2.4);
        for (const y of [-56, -16]) { dot(42, y, 3.2, '#5a4520'); dot(42, y, 2.4, LAITONL); }
        fillPts(rect(-6, -128, 22, -122), CA.blazerD); strokePts([[-6, -128], [22, -128]], CA.liser, 1.6);
        fillPts([[0, -128], [6, -140], [12, -131], [17, -139], [20, -128]], '#f4f1e8');
        fillPts(rect(-14, 20, 22, 26), CA.blazerD); strokePts([[-14, 20], [22, 20]], CA.liser, 1.4);
        hatch([[-50, -170], [-12, -170], [-10, 66], [-50, 66]], 0.75, 4.2, 0.32, 1.05, '220,220,235');
        shade(44, 0, -40, 0, 0.3);
      },
      pant: CA.pant, pantD: CA.pantD,
      shoe: (isBack) => { fillPts(rect(-40, 212, 60, 262), isBack ? '#cfc8b6' : '#ece6d6'); fillPts([[24, 212], [60, 212], [60, 262], [24, 262]], isBack ? '#3a2416' : '#5a3a24'); fillPts(rect(-40, 212, -6, 262), isBack ? '#3a2416' : '#5a3a24'); fillPts(rect(-40, 231, 60, 262), '#2a1a10'); },
      legPaint: () => strokePts([[4, 60], [6, 140], [4, 208]], 'rgba(90,75,40,0.4)', 1.2),
      upF: [CA.blazer, () => hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.3, 1, '220,220,235')], upB: [CA.blazerD, null],
      foreF: [CA.blazer, { cuff: '#f4f1e8', liseré: CA.liser }], foreB: [CA.blazerD, { cuff: '#d9d4c6', liseré: '#bfb393' }],
      head: CA_HEAD, poche: CA.blazerD,
      headPaint: (p) => {
        const f = p.face || {};
        fillPts([[-40, -84], [-14, -80], [-16, -60], [-22, -42], [-26, -30], [-42, -28]], CA.gris);
        strokePts([[-30, -70], [-20, -50]], 'rgba(255,255,255,0.35)', 1.3);
        X.earPaint(-8, -44);
        hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.28);
        strokePts([[14, 4], [22, -2]], 'rgba(120,70,50,0.45)', 1.1);
        dot(16, -34, 9, 'rgba(210,110,100,0.3)');
        X.eye(f, 17, -52); X.brow(f, 17, -60, 'rgba(120,115,105,0.98)', 2.8); X.mouth(f, 26, -24);
        fillPts([[33, -32], [31, -29.5], [24, -29], [16, -31], [17, -33.5], [26, -34]], '#8f8b83', 6, 0.3);
        strokePts([[16, -32], [11, -30]], '#8f8b83', 1.4);
      },
      hats: { canotier: { parent: 'head', at: [-2, -84], rest: -0.05, pts: CA_HAT, base: CA.paille, seed: 8231, noRivet: true, paint: () => {
        fillPts(rect(-37, -12, 39, 4), CA.ruban); strokePts([[-37, -11], [39, -11]], 'rgba(255,220,200,0.3)', 1);
        for (let y = -22; y < -12; y += 4) strokePts([[-35, y], [37, y]], 'rgba(120,90,40,0.45)', 0.9);
        for (let x = -50; x < 58; x += 5) strokePts([[x, 9], [x + 3, 15]], 'rgba(120,90,40,0.5)', 0.9);
        fillPts(rect(-36, -28, 38, -24), CA.pailleD); hatch(null, 0.4, 3.4, 0.18); shade(0, -30, 0, 16, 0.18, [-60, -30, 62, 18]);
      } } },
    });
  }
  CH.lacCapitaine = mkCapitaine();
  LAC.capitainePose = (p) => { const q = prep(p); gestes(q); return finish(q); };
  LAC.capitaine = (pose, x, y, s, o) => run(CH.lacCapitaine, LAC.capitainePose(pose), x, y, s == null ? 0.9 : s, o);

  // =====================================================================
  // JOURNALISTES — J1 : veste moutarde, chapeau mou gris à carte de presse (rectangle ivoire à bande rouge, SANS texte) ;
  // J2 : chemise bleu-gris à fixe-manches, gilet de laine vert éteint, casquette plate bordeaux, lunettes rondes
  // =====================================================================
  const J1 = { peau: '#dcb08a', peauD: '#bd916c', veste: '#b38a35', vesteD: '#93702a', pant: '#5e574c', pantD: '#4b453c', feutre: '#7b7e80', feutreD: '#5f6264', ruban: '#8e2a26', cheveux: '#5a3d28' };
  const J2 = { peau: '#e3bf9c', peauD: '#c69e7c', chemise: '#b9c4c6', chemiseD: '#9ea9ab', gilet: '#5f6e4c', giletD: '#4b583c', pant: '#4a494f', pantD: '#3a393e', cap: '#6c2830', capD: '#521c23', cheveux: '#7a5532' };
  const J1_TORSO = [[-14, -176], [8, -180], [16, -168], [27, -150], [36, -112], [38, -62], [37, -12], [38, 46, 1], [-37, 48, 1], [-37, 0], [-37, -60], [-38, -110], [-34, -150], [-26, -168]];
  const J2_TORSO = [[-14, -176], [8, -180], [16, -168], [26, -150], [33, -112], [35, -62], [32, -16], [32, 16], [-34, 18], [-35, -40], [-37, -110], [-34, -150], [-26, -168]];
  const FEDORA = [[-56, 12], [-44, 4], [-36, -2], [-35, -22], [-29, -36], [-12, -42], [-2, -36], [10, -42], [28, -38], [36, -24], [38, -2], [48, 4], [64, 10, 1], [50, 16], [20, 11], [-10, 11], [-40, 16]];
  const CAP = [[-40, 6], [-44, -12], [-36, -28], [-12, -37], [20, -35], [40, -26], [48, -12], [46, -2], [62, 3], [68, 9, 1], [40, 11], [10, 9], [-30, 11]];
  function mkJournaliste(n) {
    const un = n === 1, C = un ? J1 : J2;
    return mkPerso({
      nom: un ? 'journaliste1' : 'journaliste2', seed: un ? 8300 : 8400, peau: C.peau, peauD: C.peauD,
      torso: un ? J1_TORSO : J2_TORSO, torsoBase: un ? J1.veste : J2.chemise,
      torsoPaint: un ? () => {
        fillPts([[4, -184], [18, -168], [27, -136], [30, -104], [22, -100], [12, -140], [2, -166]], '#efe9dc');
        fillPts([[13, -168], [18, -160], [26, -126], [22, -108], [17, -120], [11, -158]], '#4a3324');
        fillPts([[16, -176], [28, -144], [34, -106], [24, -98], [14, -140]], J1.vesteD);
        strokePts([[24, -98], [32, -60], [36, -12], [37, 44]], 'rgba(60,40,10,0.6)', 1.4);
        dot(33, -66, 2.8, '#4a3324'); dot(35, -26, 2.8, '#4a3324');
        for (const [x0, y0] of [[-24, 4], [-30, -120]]) { fillPts(rect(x0, y0, x0 + 34, y0 + 6), J1.vesteD); strokePts([[x0, y0], [x0 + 34, y0]], 'rgba(60,40,10,0.6)', 1); }
        strokePts([[-20, -100], [-12, -60], [-24, -20]], 'rgba(80,55,15,0.35)', 1.4);
        hatch([[-50, -170], [-12, -170], [-10, 50], [-50, 50]], 0.75, 4.2, 0.3);
        shade(38, 0, -40, 0, 0.26);
      } : () => {
        fillPts(rect(-40, -2, 40, 20), J2.pant); fillPts(rect(-40, -2, 40, 5), '#2b2a2e');
        fillPts([[4, -184], [18, -170], [14, -156], [2, -166]], '#dfe5e5');
        const gil = [[-40, -152], [-22, -168], [-6, -164], [8, -150], [18, -126], [24, -110], [40, -108], [40, -2], [-40, -2]];
        fillPts(gil, J2.gilet);
        for (let i = -4; i < 5; i++) for (let j = 0; j < 7; j++) { const x = i * 20 + (j % 2) * 10, y = -134 + j * 20; fillPts([[x, y - 10], [x + 10, y], [x, y + 10], [x - 10, y]], j % 2 ? J2.giletD : '#6c7c57', 0, 0); }
        for (let k = -8; k < 8; k++) { strokePts([[k * 20 - 60, -150], [k * 20 + 80, -10]], 'rgba(130,40,50,0.7)', 1); strokePts([[k * 20 + 80, -150], [k * 20 - 60, -10]], 'rgba(130,40,50,0.7)', 1); }
        strokePts([[-22, -166], [-6, -162], [8, -148], [18, -124], [24, -110]], '#3f4a32', 2.6);
        for (const y of [-92, -66, -40, -14]) dot(30, y, 2.4, '#2e2a22');
        hatch([[-50, -170], [-12, -170], [-10, 0], [-50, 0]], 0.75, 4.2, 0.28);
        shade(36, 0, -40, 0, 0.26);
      },
      pant: C.pant, pantD: C.pantD, shoe: shoeFn(un ? '#4a2f1e' : '#1f1c1c', '#1a120c', un ? '#3a2416' : '#141212'),
      upF: un ? [J1.veste, null] : [J2.chemise, () => { fillPts(rect(-24, 30, 24, 38), '#2f2f36'); strokePts([[-8, 10], [-4, 60]], 'rgba(60,70,80,0.3)', 1.2); hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.22); }],
      upB: un ? [J1.vesteD, null] : [J2.chemiseD, () => fillPts(rect(-24, 30, 24, 38), '#26262c')],
      foreF: un ? [J1.veste, { cuff: '#efe9dc' }] : [J2.chemise, { peau: 26, roule: '#cfd7d8' }],
      foreB: un ? [J1.vesteD, { cuff: '#d2ccbe' }] : [J2.chemiseD, { peau: 26, roule: '#aab4b5' }],
      head: un ? X.AR_HEAD : X.NAP_HEAD, poche: un ? J1.vesteD : J2.pant,
      headPaint: un ? (p) => {
        const f = p.face || {};
        fillPts([[-40, -84], [-14, -80], [-14, -60], [-20, -42], [-24, -30], [-42, -28]], J1.cheveux);
        fillPts([[-10, -62], [-4, -62], [-4, -40], [-10, -42]], J1.cheveux);
        X.earPaint(-8, -44);
        hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.3);
        for (let i = 0; i < 14; i++) dot(6 + (i % 5) * 4, -14 + ((i / 5) | 0) * 5, 0.9, 'rgba(60,40,30,0.35)');
        dot(14, -34, 8, 'rgba(200,120,100,0.22)');
        X.eye(f, 17, -52); X.brow(f, 17, -60, 'rgba(60,40,25,0.95)', 3); X.mouth(f, 25, -22);
      } : (p) => {
        const f = p.face || {};
        fillPts([[-40, -84], [-14, -80], [-16, -58], [-20, -44], [-26, -30], [-42, -28]], J2.cheveux);
        X.earPaint(-8, -44);
        hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.24);
        dot(14, -32, 8, 'rgba(215,125,105,0.28)');
        X.eye(f, 18, -52); X.brow(f, 18, -62, 'rgba(90,60,35,0.95)', 2.2); X.mouth(f, 27, -27);
        const ring = ell(19, -52, 10.5, 10.5, 14);
        fillPts(ring, 'rgba(190,225,240,0.25)', 0, 0); strokePts(ring.concat([ring[0]]), '#2a2420', 2);
        strokePts([[8.5, -53], [-28, -56]], '#2a2420', 1.6); strokePts([[14, -58], [20, -60]], 'rgba(255,255,255,0.75)', 1.2);
      },
      hats: un ? { feutre: { parent: 'head', at: [-2, -80], rest: -0.06, pts: FEDORA, base: J1.feutre, seed: 8331, noRivet: true, paint: () => {
        fillPts(rect(-36, -10, 39, 2), J1.ruban);
        fillPts([[10, -30], [26, -32], [28, -10], [12, -8]], '#efe8d2'); fillPts([[10.5, -24], [26.5, -26], [26.8, -20], [11, -18]], '#b23a2e');
        strokePts([[-30, -34], [-12, -40], [-2, -33], [10, -40], [26, -36]], 'rgba(30,30,30,0.5)', 1.2);
        strokePts([[-54, 12], [-20, 9], [20, 9], [62, 9]], 'rgba(255,255,255,0.2)', 1.2);
        hatch(null, 0.5, 3.6, 0.24); shade(0, -42, 0, 16, 0.2, [-60, -44, 66, 18]);
      } } } : { casquette: { parent: 'head', at: [-2, -82], rest: -0.04, pts: CAP, base: J2.cap, seed: 8431, noRivet: true, paint: () => {
        fillPts([[44, -3], [62, 3], [68, 9], [40, 11], [36, 2]], J2.capD);
        for (const k of [-0.5, 0, 0.5]) strokePts([[10 + k * 40, -36], [8 + k * 46, -16], [6 + k * 50, 6]], 'rgba(30,10,10,0.4)', 1);
        dot(12, -37, 3.2, J2.capD);
        hatch(null, 0.5, 3.4, 0.26); shade(0, -38, 0, 10, 0.2, [-46, -40, 70, 12]);
      } } },
    });
  }
  CH.lacJ1 = mkJournaliste(1);
  CH.lacJ2 = mkJournaliste(2);
  LAC.journalisteDef = (p) => (p && (p.qui === 2 || p.qui === 'J2') ? CH.lacJ2 : CH.lacJ1);
  LAC.journalistePose = function (p) {
    const q = prep(p), A = q.ang, t = q.t || 0;
    gestes(q);
    const ec = ease(clamp(q.ecrit || 0)), vi = ease(clamp(q.vise || 0));
    if (ec > 0) {
      if (!has(q.tenuB)) q.tenuB = 'calepin'; if (!has(q.tenu)) q.tenu = 'crayon';
      q.tenuBO = Object.assign({ lignes: 0.3 + 0.7 * clamp(q.ecrit) * (0.5 + 0.5 * Math.sin(t * 0.7)) }, q.tenuBO);
      armTo(q, 'armB', [62, -72], 'bas', ec);
      armTo(q, 'armF', [44 + Math.sin(t * 11) * 5 * ec, -132 + Math.sin(t * 4.3) * 4 * ec], 'bas', ec);
      A.head = (A.head || 0) + 0.26 * ec;
    }
    if (vi > 0) {
      if (!has(q.tenu)) q.tenu = 'appareil';
      armTo(q, 'armF', [40, -196], 'bas', vi);
      if (vi > 0.5 && q.deuxMains == null) q.deuxMains = true;
      if (q.tenu === 'appareil') q.tenuO = Object.assign({ eclair: q.eclair || 0 }, q.tenuO);
    } else if (q.tenu === 'appareil' && q.eclair) q.tenuO = Object.assign({ eclair: q.eclair }, q.tenuO);
    return finish(q);
  };
  LAC.journaliste = (pose, x, y, s, o) => run(LAC.journalisteDef(pose), LAC.journalistePose(pose), x, y, s == null ? 0.9 : s, o);

  // =====================================================================
  // ACCESSOIRES SEULS — M.puppet à une pièce invisible ; l'objet se dessine dans l'extra (ombre portée possible)
  // =====================================================================
  const accDefs = {};
  function accDef(name, fn) { return accDefs[name] || (accDefs[name] = { hipY: 0, handLen: 10, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => fn(p.o) } }, order: ['o'] }); }
  function acc(name, x, y, s, o) {
    o = o || {}; s = s == null ? 0.9 : s;
    const ob = OBJ[name];
    const def = accDef(name, (oo) => { const c = cx_(); c.save(); c.translate(-ob.base[0], -ob.base[1]); ob.draw(oo); c.restore(); });
    return M.puppet(def, { o, tilt: o.rot || 0 }, x, y, s, { dir: o.dir || 1, rod: false, slot: o.slot != null ? o.slot : y + 6 * s, floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
  }
  for (const n of Object.keys(OBJ)) LAC[n] = (x, y, s, o) => acc(n, x, y, s, o);

  // =====================================================================
  // REPTILES — crocodile (museau étroit en V, vert olive, dents en scie haut ET bas) / alligator (museau large en U, vert sombre, une rangée)
  // vue 'profil' (articulé : gueule, queue, pattes) ou 'dessus' (silhouette vue de dessus, le V / U se lit). Sur tige de bois.
  // =====================================================================
  const RP = { croco: { col: '#728c4a', colD: '#5a7139', ventre: '#a9b07a' }, alligator: { col: '#3e5033', colD: '#2f3d27', ventre: '#6f7a55' } };
  const DENT = '#efe9d6';
  function backLine(x0, x1, yf, step) { const o = []; for (let x = x0, i = 0; x <= x1; x += step / 2, i++) o.push([x, yf(x) - (i % 2 ? 5 : 0), i % 2 ? 1 : 0]); return o; }
  function repBody(type) {
    const cr = type === 'croco';
    const back = backLine(-66, 58, (x) => -27 - 5 * Math.cos(x / 70), 12).map((q) => (q[2] ? [q[0], q[1], 1] : [q[0], q[1]]));
    const head = cr
      ? [[68, -26], [80, -32], [87, -36, 1], [96, -30], [110, -22], [130, -17], [150, -13], [166, -9, 1], [150, -6], [120, -6], [96, -6], [80, -5]]
      : [[68, -27], [80, -33], [87, -37, 1], [96, -31], [112, -26], [134, -24], [152, -21], [161, -16], [163, -10], [158, -5, 1], [140, -4], [110, -4], [86, -4]];
    return back.concat(head, [[62, 2], [40, 8], [10, 10], [-20, 10], [-50, 6], [-70, 0], [-72, -12]]);
  }
  function repJaw(type) {
    return type === 'croco' ? [[-4, -1], [30, -2], [60, -2], [86, -3, 1], [70, 3], [40, 6], [10, 8], [-6, 6]]
      : [[-4, -1], [40, 0], [70, 0], [80, 1], [83, 4], [78, 8], [50, 10], [10, 11], [-6, 7]];
  }
  const REP_TAIL = (() => { const top = [], bot = []; for (let i = 0; i <= 12; i++) { const x = 6 - i * 12.5, w = lerp(12, 1.5, i / 12), y = -2 - 4 * Math.sin(i / 12 * PI * 0.8); top.push([x, y - w - (i % 2 ? 4 : 0), i % 2 ? 1 : 0]); bot.unshift([x, y + w]); } return top.map((q) => (q[2] ? [q[0], q[1], 1] : [q[0], q[1]])).concat([[-146, -4, 1]], bot); })();
  const REP_LEG = [[-8, -4], [8, -4], [10, 12], [18, 22], [24, 27, 1], [-3, 28, 1], [-9, 14]];
  function teeth(x0, x1, y, h, step) { for (let x = x0; x < x1; x += step) fillPts([[x, y], [x + step * 0.5, y + h], [x + step, y]], DENT, 0, 0); }
  function mkReptile(type) {
    const C = RP[type], cr = type === 'croco';
    const legP = (dark) => () => { hatch(null, 0.8, 3, dark ? 0.35 : 0.2); for (const x of [6, 12, 18]) strokePts([[x + 2, 22], [x + 4, 28]], 'rgba(20,30,10,0.6)', 1); };
    const parts = {
      body: { parent: null, at: [0, 0], pts: repBody(type), base: C.col, seed: cr ? 8501 : 8601, paint: () => {
        fillPts([[-70, 2], [-40, 2], [0, 4], [40, 2], [62, -2], [62, 12], [-70, 12]], C.ventre);
        for (let x = -60; x < 60; x += 10) for (const y of [-20, -12]) strokePts(ep(x + (y === -12 ? 5 : 0), y, 5, 3, 5, PI, TAU), 'rgba(20,30,10,0.35)', 0.9);
        fillPts(ell(90, -28, 6, 4.4, 10), '#d8c66a', 0, 0); fillPts([[90, -31.5], [91.2, -28], [90, -24.5], [88.8, -28]], '#1c1a10', 0, 0);
        strokePts([[82, -33], [90, -35], [98, -31]], 'rgba(20,30,10,0.6)', 1.2);
        dot(cr ? 160 : 156, cr ? -11 : -15, 2.2, C.colD);
        strokePts(cr ? [[96, -7], [164, -9]] : [[90, -5], [158, -6]], 'rgba(20,20,10,0.7)', 1.2);
        hatch(null, 0.8, 3.6, 0.22); shade(0, -36, 0, 12, 0.25, [-80, -40, 170, 14]);
      }, extra: () => { if (cr) teeth(98, 160, -6.5, 6, 6); else teeth(92, 154, -4.5, 5, 7); } },
      jaw: { parent: 'body', at: [78, -5], pts: repJaw(type), base: C.colD, seed: cr ? 8502 : 8602, paint: () => { fillPts([[-6, 4], [80, 2], [80, 12], [-6, 12]], C.ventre); hatch(null, 0.8, 3.4, 0.2); },
        extra: () => { if (cr) { M.ctx().save(); M.ctx().scale(1, -1); teeth(4, 80, 1.5, 6.5, 6); M.ctx().restore(); } } },
      queue: { parent: 'body', at: [-66, -10], pts: REP_TAIL, base: C.col, seed: cr ? 8503 : 8603, paint: () => { for (let x = -12; x > -130; x -= 12) strokePts([[x, -10], [x, 6]], 'rgba(20,30,10,0.35)', 1); hatch(null, 0.8, 3.6, 0.22); } },
      patteARf: { parent: 'body', at: [-42, 2], pts: REP_LEG, base: C.colD, seed: 8510, noRivet: true, paint: legP(true) },
      patteAVf: { parent: 'body', at: [50, 2], pts: REP_LEG, base: C.colD, seed: 8511, noRivet: true, paint: legP(true) },
      patteAR: { parent: 'body', at: [-50, 4], pts: REP_LEG, base: C.col, seed: 8512, paint: legP(false) },
      patteAV: { parent: 'body', at: [42, 4], pts: REP_LEG, base: C.col, seed: 8513, paint: legP(false) },
    };
    return { nom: type, hipY: -32, handLen: 0, rod: { part: 'body', at: [0, -6] }, parts, order: ['patteARf', 'patteAVf', 'queue', 'body', 'jaw', 'patteAR', 'patteAV'] };
  }
  CH.lacCroco = mkReptile('croco');
  CH.lacAlligator = mkReptile('alligator');
  // vue de dessus (tête vers +x) : une seule pièce découpée, le museau en V ou en U se lit tout de suite
  function drawDessus(type) {
    const C = RP[type], cr = type === 'croco';
    const half = (x) => {                                                       // demi-largeur selon x
      if (x < -60) return lerp(2, 20, (x + 170) / 110);
      if (x < 70) return 20 + 14 * Math.sin((x + 60) / 130 * PI);
      if (cr) return x < 96 ? lerp(20, 16, (x - 70) / 26) : lerp(16, 3, (x - 96) / 72);
      return x < 96 ? lerp(20, 22, (x - 70) / 26) : x < 150 ? lerp(22, 19, (x - 96) / 54) : 19 * Math.sqrt(Math.max(0, 1 - ((x - 150) / 18) ** 2));
    };
    const top = [], bot = [];
    for (let x = -170; x <= (cr ? 168 : 168); x += 6) { const h = half(Math.min(x, 168)); top.push([x, -h]); bot.unshift([x, h]); }
    for (const [lx, fw] of [[-44, -1], [52, 1]]) for (const sg of [-1, 1]) {
      const k = (px, py) => [lx + px * fw, sg * py];
      pc([k(-9, 22), k(9, 22), k(14, 40), k(24, 50), k(30, 48, 1), k(32, 56), k(22, 60), k(12, 58, 1), k(2, 50), k(-6, 40)].map((q, i) => (i === 4 || i === 7 ? [q[0], q[1], 1] : q)), C.colD, () => hatch(null, 0.8, 3, 0.3), 8520 + lx + sg);
    }
    if (cr) for (let x = 112; x < 160; x += 9) for (const sg of [-1, 1]) { const h = half(x); fillPts([[x, sg * (h - 1)], [x + 3, sg * (h + 5)], [x + 6, sg * (h - 1)]], DENT, 0, 0); }
    pc(top.concat(bot), C.col, () => {
      for (let x = -150; x < 70; x += 11) for (const y of [-8, 0, 8]) fillPts([[x, y - 3], [x + 4, y], [x, y + 3], [x - 4, y]], C.colD, 0, 0);
      for (const sg of [-1, 1]) { fillPts(ell(92, sg * 13, 6, 5, 10), C.colD, 0, 0); fillPts(ell(93, sg * 13, 3.6, 2.6, 8), '#d8c66a', 0, 0); dot(93.5, sg * 13, 1.2, '#1c1a10'); }
      dot(cr ? 158 : 160, -4, 1.8, C.colD); dot(cr ? 158 : 160, 4, 1.8, C.colD);
      hatch(null, 0.8, 3.6, 0.2); shade(0, -30, 0, 30, 0.22, [-180, -40, 180, 40]);
    }, cr ? 8530 : 8630);
  }
  const dessusDefs = {};
  const dessusDef = (type) => dessusDefs[type] || (dessusDefs[type] = { hipY: -62, handLen: 0, rod: { part: 'o', at: [0, 0] }, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: () => drawDessus(type) } }, order: ['o'] });
  // LAC.reptile(x, y, s, o) — (x,y) = sous les pattes (profil) ou bas des pattes (dessus) ; la tige descend jusqu'à o.slot (défaut y + 18·s)
  LAC.reptile = function (x, y, s, o) {
    o = o || {}; s = s == null ? 0.9 : s;
    const type = o.type === 'alligator' ? 'alligator' : 'croco', t = o.t || 0;
    const ro = { dir: o.dir || 1, rod: o.tige !== false, slot: o.slot, cast: o.cast, alpha: o.alpha, floorShadow: !!o.ombre, nom: type };
    if (o.vue === 'dessus') return M.puppet(dessusDef(type), { tilt: o.rot || 0 }, x, y, s, ro);
    const mk = clamp(o.marche || 0), ph = Math.sin(t * 7);
    const A = { jaw: 0.42 * clamp(o.gueule || 0), queue: (o.queue || 0) + 0.12 * mk * Math.sin(t * 3.5),
      patteAV: 0.35 * mk * ph, patteARf: 0.35 * mk * ph, patteAR: -0.35 * mk * ph, patteAVf: -0.35 * mk * ph };
    return M.puppet(type === 'croco' ? CH.lacCroco : CH.lacAlligator, { tilt: o.rot || 0, ang: A, dy: -Math.abs(ph) * 3 * mk }, x, y, s, ro);
  };

  // =====================================================================
  // DÉCORS (pré-rendus dans LAC.init)
  // =====================================================================
  // ---------------- vitrine bostonienne : façade de briques, enseigne nue, grande vitrine éclairée, deux étagères, plateau tournant, porte
  // origine = bas-centre (poser à M.flat(K.vitrine, 540, ST.back)) ; repères écran dans LAC.VITRINE
  const VI = { x0: -222, x1: 362, y0: -872, y1: -262, et1: -704, et2: -520, plat: { x: 100, y: -298, rx: 118 }, troph: 100 };
  LAC.VITRINE = { x: 540, vitre: [540 + VI.x0, 1395 + VI.y0, 540 + VI.x1, 1395 + VI.y1], plateau: { x: 540 + VI.plat.x, y: 1395 + VI.plat.y },
    etageres: [1395 + VI.et1, 1395 + VI.et2], porte: { x: 980, y: 1395 } };
  function drawTrophee() {
    pc([[-30, 0, 1], [30, 0, 1], [24, -14], [-24, -14]], '#3a2a1c', null, 8701);
    pc([[-8, -14], [8, -14], [6, -46], [14, -56], [-14, -56], [-6, -46]], P.or, () => shade(10, 0, -10, 0, 0.3, [-16, -60, 16, -12]), 8702);
    for (const sx of [-1, 1]) pc(ribbon(qbez([sx * 34, -112], [sx * 62, -100], [sx * 18, -66], 10), 7, 6), P.orD, null, 8703 + sx);
    pc([[-40, -124], [40, -124], [36, -94], [22, -68], [0, -58], [-22, -68], [-36, -94]], P.or, () => {
      strokePts([[-26, -116], [-22, -90], [-10, -72]], 'rgba(255,245,200,0.75)', 3); fillPts(rect(-40, -126, 40, -118), P.orL);
      hatch([[10, -124], [40, -124], [40, -58], [10, -58]], 0.9, 3.2, 0.3); shade(38, 0, -38, 0, 0.3, [-42, -126, 42, -56]);
    }, 8706);
  }
  function drawVitrine() {
    const c = cx_(), R = M.rng(71);
    pc(rect(-500, -1150, 500, 0), '#8a7466', () => {                          // mur de briques (joints clairs)
      for (let row = 0; row * 26 < 1160; row++) {
        const y = -row * 26, off = (row % 2) * 28;
        for (let x = -530 + off; x < 520; x += 56) { c.fillStyle = M.mixc('#6c3426', '#90503a', R()); c.fillRect(x + 2, y - 24, 52, 22); }
      }
      c.fillStyle = 'rgba(30,15,10,0.18)'; for (let i = 0; i < 60; i++) c.fillRect(-500 + R() * 1000, -1150 + R() * 1150, 20 + R() * 40, 3);
      hatch(null, 0.9, 5, 0.12, 1, P.encre, [-500, -1150, 500, 0]);
      shade(0, -1150, 0, -900, 0.25, [-500, -1150, 500, -880]);
    }, 8601, { drop: false });
    pc(rect(-510, -1150, 510, -1088), '#5d4a3a', () => {                      // corniche à denticules
      for (let x = -500; x < 500; x += 22) fillPts(rect(x, -1100, x + 12, -1088), '#4a3a2c');
      strokePts([[-510, -1138], [510, -1138]], 'rgba(255,235,200,0.3)', 2); hatch(null, 0.3, 4, 0.25);
    }, 8602);
    pc(rect(VI.x0 - 10, -1050, VI.x1 + 10, -950), '#2b4334', () => {         // enseigne NUE (aucune lettre) : filets et volutes dorés
      strokePts(rect(VI.x0, -1040, VI.x1, -960).concat([[VI.x0, -1040]]), P.or, 2.6);
      const cxs = (VI.x0 + VI.x1) / 2;
      for (const sx of [-1, 1]) { strokePts(ep(cxs + sx * 230, -1000, 18, 18, 14, 0, TAU * 0.85), P.or, 2); strokePts([[cxs + sx * 212, -1000], [cxs + sx * 40, -1000]], P.orD, 1.6); }
      strokePts(ell(cxs, -1000, 26, 14, 16).concat([[cxs + 26, -1000]]), P.or, 2);
      hatch(null, 0.5, 4, 0.2);
    }, 8603);
    pc(rect(VI.x0 - 22, VI.y0 - 22, VI.x1 + 22, VI.y1 + 30), '#2c3d33', () => {   // cadre de vitrine vert sombre, filet or
      strokePts(rect(VI.x0 - 12, VI.y0 - 12, VI.x1 + 12, VI.y1 + 20).concat([[VI.x0 - 12, VI.y0 - 12]]), P.orD, 1.6);
      hatch(null, 0.3, 4, 0.25);
    }, 8604);
    pc(rect(VI.x0, VI.y0, VI.x1, VI.y1), '#e4c487', () => {                     // intérieur éclairé
      const g = c.createRadialGradient(100, -560, 40, 100, -560, 520); g.addColorStop(0, '#f6e2a8'); g.addColorStop(1, '#b98a4f');
      c.fillStyle = g; c.fillRect(VI.x0, VI.y0, VI.x1 - VI.x0, VI.y1 - VI.y0);
      for (let x = VI.x0; x < VI.x1; x += 34) { c.fillStyle = 'rgba(120,40,30,0.10)'; c.fillRect(x, VI.y0, 14, VI.y1 - VI.y0); }
      fillPts(rect(VI.x0, -330, VI.x1, VI.y1), '#6e2a24');
      hatch(null, 0.9, 6, 0.08);
    }, 8605, { drop: false });
    for (const [y, x0, x1] of [[VI.et1, -130, 330], [VI.et2, -180, 340]]) {   // deux étagères
      pc(rect(x0, y, x1, y + 14), BOISD, () => { strokePts([[x0, y + 2], [x1, y + 2]], 'rgba(255,220,170,0.4)', 1.4); hatch(null, 0.2, 3, 0.25); }, 8606 + y);
      for (const bx of [x0 + 30, x1 - 30]) pc([[bx - 5, y + 14], [bx + 5, y + 14], [bx + 5, y + 40], [bx - 5, y + 24]], BOISD, null, 8608 + bx);
    }
    c.save(); c.translate(VI.troph, VI.et1); drawTrophee(); c.restore();
    for (const [x, a] of [[-120, -0.22], [-44, 0.0], [32, 0.22]]) { c.save(); c.translate(x, VI.et2 - 34); c.rotate(a); c.scale(0.74, 0.74); drawRaquette({}); c.restore(); }
    for (const [x, y] of [[230, -11], [252, -11], [274, -11], [241, -30], [263, -30], [252, -49]]) { c.save(); c.translate(x, VI.et2 + y); drawBalle(); c.restore(); }
    const pl = VI.plat;                                                          // plateau tournant (velours rouge, bord doré)
    pc(ep(pl.x, pl.y, pl.rx, 16, 16, 0, PI).concat([[pl.x - pl.rx, pl.y + 26]]).reverse().concat(ep(pl.x, pl.y + 26, pl.rx, 16, 16, 0, PI)).concat([[pl.x - pl.rx, pl.y]]), '#7a2a26', () => {
      for (let x = pl.x - pl.rx + 10; x < pl.x + pl.rx; x += 14) strokePts([[x, pl.y + 4], [x, pl.y + 40]], 'rgba(30,5,5,0.35)', 1.2);
      strokePts(ep(pl.x, pl.y + 24, pl.rx, 16, 16, 0, PI), P.or, 3);
    }, 8610);
    pc(ell(pl.x, pl.y, pl.rx, 16, 24), '#93352e', () => { strokePts(ell(pl.x, pl.y, pl.rx - 4, 13, 24).concat([[pl.x + pl.rx - 4, pl.y]]), P.or, 2.2); hatch(null, 0.1, 4, 0.15); }, 8611);
    for (let i = 1; i < 6; i++) { const x = lerp(VI.x0, VI.x1, i / 6); pc(rect(x - 4, VI.y0, x + 4, VI.y0 + 80), '#2c3d33', null, 8612 + i); }
    pc(rect(VI.x0, VI.y0 + 76, VI.x1, VI.y0 + 84), '#2c3d33', null, 8619);
    pc(rect(VI.x0 - 30, VI.y1 + 28, VI.x1 + 30, VI.y1 + 44), '#8f8678', () => strokePts([[VI.x0 - 30, VI.y1 + 30], [VI.x1 + 30, VI.y1 + 30]], 'rgba(255,255,255,0.3)', 1.5), 8620);
    pc(rect(VI.x0 - 18, VI.y1 + 44, VI.x1 + 18, -40), '#2c3d33', () => {      // soubassement à panneaux
      for (let i = 0; i < 4; i++) { const x0 = lerp(VI.x0, VI.x1, i / 4) + 10, x1 = lerp(VI.x0, VI.x1, (i + 1) / 4) - 10; strokePts(rect(x0, VI.y1 + 64, x1, -60).concat([[x0, VI.y1 + 64]]), P.orD, 1.4); }
      hatch(null, 0.3, 4, 0.25);
    }, 8621);
    pc(rect(410, -800, 500, -40), '#2c3d33', () => {                           // porte (côté droit, hors zone d'action)
      fillPts(rect(424, -780, 492, -470), '#e9cf94'); strokePts([[458, -780], [458, -470]], '#2c3d33', 4);
      strokePts(rect(424, -440, 492, -80).concat([[424, -440]]), P.orD, 1.4); dot(430, -380, 5, LAITONL);
    }, 8622);
    pc(rect(-520, -40, 520, 0), '#9a948a', () => { for (let x = -500; x < 520; x += 90) strokePts([[x, -40], [x - 6, 0]], 'rgba(40,35,30,0.4)', 1.2); strokePts([[-520, -38], [520, -38]], 'rgba(255,255,255,0.3)', 1.4); }, 8623);
  }
  function drawVitre() {                                                       // reflets de la vitre : poser APRÈS la valise
    const c = cx_();
    c.save(); c.beginPath(); c.rect(VI.x0, VI.y0 + 84, VI.x1 - VI.x0, VI.y1 - VI.y0 - 84); c.clip();
    for (const [x, w, a] of [[-160, 70, 0.16], [-60, 26, 0.12], [210, 90, 0.12], [320, 30, 0.1]]) {
      c.fillStyle = `rgba(255,252,240,${a})`; c.beginPath(); c.moveTo(x, VI.y1); c.lineTo(x + w, VI.y1); c.lineTo(x + w + 260, VI.y0); c.lineTo(x + 260, VI.y0); c.closePath(); c.fill();
    }
    c.restore();
  }
  // ---------------- réverbère à gaz (origine = pied ; 900 de haut)
  function drawReverbere() {
    const c = cx_(), F = '#23292a';
    const g = c.createRadialGradient(0, -790, 10, 0, -790, 120); g.addColorStop(0, 'rgba(255,220,140,0.5)'); g.addColorStop(1, 'rgba(255,220,140,0)');
    c.fillStyle = g; c.fillRect(-120, -910, 240, 240);
    pc([[-26, 0, 1], [26, 0, 1], [20, -40], [12, -70], [8, -720], [-8, -720], [-12, -70], [-20, -40]], F, () => {
      for (const y of [-80, -300, -560]) fillPts(rect(-12, y, 12, y + 10), '#3a4446'); strokePts([[3, -60], [3, -700]], 'rgba(255,255,255,0.18)', 2);
    }, 8801);
    pc(rect(-44, -660, 44, -650), F, null, 8802);
    pc([[-30, -730], [30, -730], [40, -840], [-40, -840]], '#f2d48a', () => {
      const g2 = c.createRadialGradient(0, -790, 4, 0, -790, 50); g2.addColorStop(0, '#fff6d6'); g2.addColorStop(1, '#e3b663'); c.fillStyle = g2; c.fillRect(-40, -840, 80, 110);
      for (const x of [-12, 12]) strokePts([[x, -730], [x * 1.3, -840]], F, 2.4);
    }, 8803);
    pc([[-34, -722], [34, -722], [30, -734], [-30, -734]], F, null, 8804);
    pc([[-50, -836], [50, -836], [16, -872], [0, -890], [-16, -872]], F, () => strokePts([[-40, -840], [0, -880]], 'rgba(255,255,255,0.2)', 1.4), 8805);
  }
  // ---------------- court : toile de fond (ciel pâle cousu en lés + terre battue ocre + ligne blanche), gradins pâles, filet
  LAC.COURT = { sol: 1150, ligne: 1300, gradinsY: 1168, filetX: 700 };
  function drawCourt(x) {
    const W = M.W, B = M.ST.back + 5, R = M.rng(91);
    const g = x.createLinearGradient(0, 0, 0, LAC.COURT.sol); g.addColorStop(0, '#bfcbcf'); g.addColorStop(0.6, '#dcdcce'); g.addColorStop(1, '#ece2c6');
    x.fillStyle = g; x.fillRect(0, 0, W, B);
    for (let i = 0; i < 200; i++) { const cx = R() * W, cy = R() * LAC.COURT.sol, l = 40 + R() * 160; x.strokeStyle = `rgba(${R() < 0.5 ? '255,250,235' : '60,60,70'},${0.03 + R() * 0.03})`; x.lineWidth = 6 + R() * 16; x.lineCap = 'round'; x.beginPath(); x.moveTo(cx, cy); x.quadraticCurveTo(cx + l / 2, cy + (R() - 0.5) * 20, cx + l, cy); x.stroke(); }
    for (const [cx, cy, s] of [[260, 520, 1], [800, 420, 1.2], [560, 700, 0.8]]) for (let k = 0; k < 12; k++) { x.beginPath(); x.ellipse(cx + (R() - 0.5) * 200 * s, cy + (R() - 0.5) * 36 * s, (40 + R() * 60) * s, (14 + R() * 18) * s, 0, 0, TAU); x.fillStyle = 'rgba(250,248,240,0.10)'; x.fill(); }
    const gs = x.createLinearGradient(0, LAC.COURT.sol, 0, B); gs.addColorStop(0, '#c99c72'); gs.addColorStop(1, '#ad6a3c');
    x.fillStyle = gs; x.fillRect(0, LAC.COURT.sol, W, B - LAC.COURT.sol);
    for (let i = 0; i < 140; i++) { const yy = LAC.COURT.sol + R() * (B - LAC.COURT.sol), xx = R() * W; x.strokeStyle = `rgba(${R() < 0.5 ? '240,200,160' : '90,45,20'},0.08)`; x.lineWidth = 2 + R() * 4; x.beginPath(); x.moveTo(xx, yy); x.lineTo(xx + 60 + R() * 120, yy + (R() - 0.5) * 4); x.stroke(); }
    x.strokeStyle = 'rgba(244,240,228,0.92)'; x.lineWidth = 7; x.beginPath(); x.moveTo(0, LAC.COURT.ligne + 3); x.lineTo(W, LAC.COURT.ligne - 3); x.stroke();
    x.lineWidth = 5; x.beginPath(); x.moveTo(170, LAC.COURT.sol + 4); x.lineTo(70, B); x.stroke();
    for (let sx = 180; sx < W; sx += 300) { x.fillStyle = 'rgba(40,30,20,0.12)'; x.fillRect(sx, 0, 2, LAC.COURT.sol); }
    x.globalCompositeOperation = 'multiply'; x.fillStyle = M.tex.canvasPat; x.fillRect(0, 0, W, B); x.globalCompositeOperation = 'source-over';
  }
  function drawGradins() {                                                     // origine = bas-centre ; 1100 × 360
    const R = M.rng(93), c = cx_();
    pc([[-550, 0, 1], [-550, -300], [-470, -340], [470, -340], [550, -300], [550, 0, 1]], '#d4cab2', () => {
      for (let i = 0; i < 4; i++) {
        const y1 = -i * 78, y0 = y1 - 78;
        fillPts(rect(-560, y0, 560, y0 + 16), '#e4dcc8'); fillPts(rect(-560, y0 + 16, 560, y1), '#c9bea4');
        strokePts([[-560, y0 + 16], [560, y0 + 16]], 'rgba(90,75,50,0.35)', 1.2);
        for (let k = 0; k < 30; k++) {                                          // public pâle (silhouettes sans visage)
          const px = -530 + k * 36 + R() * 14, py = y0 + 14, col = ['#b7b2a6', '#c2b8a2', '#aeb4b6', '#c7b9a6'][(R() * 4) | 0];
          if (R() < 0.18) continue;
          fillPts([[px - 11, py], [px - 9, py - 18], [px + 9, py - 18], [px + 11, py]], col, 0, 0); dot(px, py - 26, 7.5, '#d9cbb6');
          if (R() < 0.5) fillPts([[px - 11, py - 31], [px + 11, py - 31], [px + 8, py - 36], [px - 8, py - 36]], R() < 0.5 ? '#cdbf98' : '#a9a49a', 0, 0);
        }
      }
      for (let i = 0; i < 14; i++) { const x0 = -520 + i * 80; fillPts([[x0, -330], [x0 + 26, -330], [x0 + 13, -306]], ['#c9a2a0', '#a9b7c4', '#d7cfa0'][i % 3], 0, 0); }
      strokePts([[-550, -330], [550, -330]], 'rgba(90,80,60,0.5)', 1.2);
      hatch(null, 0.9, 6, 0.1, 1, P.encre, [-560, -360, 560, 0]);
    }, 8901);
    pc(rect(-560, -26, 560, -18), '#ece6d8', null, 8902);
    for (let x = -540; x <= 540; x += 60) pc(rect(x - 3, -26, x + 3, 0), '#ece6d8', null, 8903 + x);
  }
  function drawFilet() {                                                       // origine = milieu du bas ; 500 × 300
    const top = (x) => -282 + 24 * (1 - (x / 244) ** 2);
    for (let x = -240; x <= 240; x += 8) strokePts([[x, top(x) + 4], [x, -6]], 'rgba(35,35,35,0.55)', 1);
    for (let y = -10; y > -282; y -= 8) { const pts = []; for (let x = -240; x <= 240; x += 40) if (y > top(x) + 4) pts.push([x, y]); if (pts.length > 1) strokePts(pts, 'rgba(35,35,35,0.5)', 1); }
    strokePts([[-244, -4], [244, -4]], '#2a2a2a', 2);
    const band = []; for (let x = -244; x <= 244; x += 16) band.push([x, top(x)]);
    pc(ribbon(band, 13, 13), '#f2eee2', () => strokePts(band, 'rgba(120,110,90,0.4)', 1), 8951);
    pc(rect(-5, top(0), 5, -4), '#f2eee2', null, 8952);
    for (const sx of [-1, 1]) {
      pc(rect(sx * 250 - 8, -300, sx * 250 + 8, 0), '#2f4a37', () => strokePts([[sx * 250 - 3, -296], [sx * 250 - 3, -4]], 'rgba(255,255,255,0.2)', 1.4), 8953 + sx);
      pc(ell(sx * 250, -302, 11, 6, 12), '#a88a4a', null, 8956 + sx);
    }
  }
  LAC.init = function () {
    LAC.K = {
      vitrine: M.withShadow(M.cutFlat(1060, 1180, 530, 1170, () => drawVitrine()), 8),
      vitre: M.cutFlat(1060, 1180, 530, 1170, () => drawVitre()),
      reverbere: M.withShadow(M.cutFlat(260, 930, 130, 920, () => drawReverbere()), 8),
      court: M.pre(M.W, M.ST.back + 5, (x) => drawCourt(x)),
      gradins: M.withShadow(M.cutFlat(1140, 380, 570, 370, () => drawGradins()), 6),
      filet: M.withShadow(M.cutFlat(540, 330, 270, 316, () => drawFilet()), 5),
    };
    LAC.K.vitrine.padB = 10; LAC.K.vitre.padB = 10; LAC.K.reverbere.padB = 10; LAC.K.gradins.padB = 10; LAC.K.filet.padB = 14;
    return LAC.K;
  };
})();
