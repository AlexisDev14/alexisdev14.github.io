// persos.js — « Léonard de Vinci, l'écriture en miroir » : marionnettes, accessoires et décors PROPRES À CETTE VIDÉO. Espace M.leo (alias LEO). Appeler LEO.init() dans S.init.
// Mode d'emploi : persos.md (ne pas lire ce fichier en entier). Aucun texte, lettre, chiffre ni logo ; déterministe (hash/rng, jamais Math.random).
// MARIONNETTES : LEO.leonard / LEO.savantA / LEO.savantB (pose, x, y, s, o) — (x,y) = pieds ; renvoient r (r.w, r.tenu…) ; LEO.pt(r, 'pointe'|'centre'|…).
// ACCESSOIRES  : LEO.plume, encrier, carnet, miroir, miroirMural, loupe, grandePage, mainGauche, portrait (x, y, s, o).
// DÉCORS       : LEO.init() → LEO.K ; LEO.atelier(t, up, o) / LEO.cabinet(t, up, o) ; repères LEO.AT, LEO.CAB.
(function () {
  const X = M.X, P = M.P, TAU = M.TAU, PI = Math.PI, D = 180 / PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, hash } = M;
  const LEO = (M.leo = {});
  const CH = M.chars;
  const cx_ = () => M.ctx();
  const SIL = () => M._sil();
  const OFFP = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];

  // ------------------------------------------------------------ géométrie
  function ep(cx, cy, rx, ry, n, a0, a1) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; }
  function ell(cx, cy, rx, ry, n) { const o = ep(cx, cy, rx, ry, n || 16, 0, TAU); o.pop(); return o; }
  const tr = (pts, dx, dy) => pts.map((p) => (p[2] ? [p[0] + dx, p[1] + dy, 1] : [p[0] + dx, p[1] + dy]));
  const scl = (pts, sx, sy) => { sy = sy == null ? sx : sy; return pts.map((p) => (p[2] ? [p[0] * sx, p[1] * sy, 1] : [p[0] * sx, p[1] * sy])); };
  const mp = (m, p) => [m.a * p[0] + m.c * p[1] + m.e, m.b * p[0] + m.d * p[1] + m.f];
  function qbez(p0, p1, p2, n) { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]); } return o; }
  const normA = (a) => { while (a > PI) a -= TAU; while (a < -PI) a += TAU; return a; };
  function rrect(x0, y0, x1, y1, r) {
    return ep(x1 - r, y0 + r, r, r, 4, -PI / 2, 0).concat(ep(x1 - r, y1 - r, r, r, 4, 0, PI / 2), ep(x0 + r, y1 - r, r, r, 4, PI / 2, PI), ep(x0 + r, y0 + r, r, r, 4, PI, PI * 1.5));
  }
  const pc = (pts, base, paint, seed, o) => piece(pts, base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));
  function unflip() { const c = cx_(), m = c.getTransform(); if (m.a * m.d - m.b * m.c < 0) { c.scale(-1, 1); return -1; } return 1; }   // contenu jamais lu à l'envers
  function drawStrokes(strokes, k, col, lw) {                                 // tracé progressif (k 0..1 de la longueur totale)
    let L = 0; const lens = strokes.map((s) => { let l = 0; for (let i = 1; i < s.length; i++) l += Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]); L += l; return l; });
    let rest = clamp(k) * L;
    for (let j = 0; j < strokes.length && rest > 0.5; j++) {
      const s = strokes[j];
      if (lens[j] <= rest) { strokePts(s, col, lw); rest -= lens[j]; continue; }
      const o = [s[0]]; let acc = 0;
      for (let i = 1; i < s.length; i++) { const l = Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]); if (acc + l >= rest) { const u = (rest - acc) / l; o.push([lerp(s[i - 1][0], s[i][0], u), lerp(s[i - 1][1], s[i][1], u)]); break; } acc += l; o.push(s[i]); }
      if (o.length > 1) strokePts(o, col, lw);
      rest = 0;
    }
  }

  // ------------------------------------------------------------ bras à articulations rondes
  const R_COUDE = 12.5, LA = 96, LB = Math.hypot(4, 96), PHI = Math.atan2(-4, 96), SH_F = [-2, -146], SH_B = [-10, -146];
  function armR(len, wt) { wt = wt || 16; return ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1, 40], [R_COUDE + 0.5, len - 6]], ep(0, len, R_COUDE, R_COUDE, 10, 0, PI), [[-R_COUDE - 0.5, len - 6], [-wt + 1, 40]]); }
  function foreR(kind, fl) {
    fl = fl || 0; const h = kind === 'fist' ? X.HAND_FIST : X.HAND_OPEN;
    return ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU).concat([[R_COUDE, 30], [11 + fl * 0.5, 58], [11 + fl, 79, 1]], h.slice(2, -1).map((p) => [p[0] * 1.05, p[1]]), [[-10, 86], [-11 - fl, 79, 1], [-11 - fl * 0.5, 58], [-R_COUDE, 30]]);
  }
  function ik2(S, T, pick) {                                                  // IK locale (repère du torse), cible = poing [4,96]
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
  // ÉCRITURE : « mots » ondulés (jamais de lettres), lignes pré-calculées
  // =====================================================================
  const ENCRE = '#24170f', SEPIA = 'rgba(74,46,26,0.92)';
  function motPts(w, seed) {                                                  // trait d'écriture abstrait : vague continue + petites boucles serrées (aucune lettre)
    const N = Math.ceil(w * 2.4), o = [], ph = hash(seed) * 6;
    for (let i = 0; i <= N; i++) {
      const sx = i / N * w, env = Math.min(1, sx / 5, (w - sx) / 5);
      const h = 2.6 + 2.4 * (0.5 + 0.5 * M.noise(sx / 10, seed));
      const r = 1.7 * clamp(0.15 + 1.1 * (0.5 + 0.5 * M.noise(sx / 8 + 3, seed + 1)));
      const phi = sx * TAU / 4.6 + ph;
      const y = -h * env * (0.55 + 0.28 * Math.sin(sx * TAU / 19 + ph)) + r * env * Math.sin(phi);
      o.push([sx + 1.3 * r * env * Math.cos(phi) + 0.22 * (-y), y]);
    }
    return o;
  }
  function ligneMots(len, seed) {
    const R = M.rng(seed), mots = []; let x = 0;
    while (x < len - 12) { const w = Math.min(len - x, 34 + R() * 56); mots.push(tr(motPts(w, seed * 31 + mots.length), x, 0)); x += w + 7 + R() * 6; }
    return mots;
  }
  // carnet : page droite 9 lignes, page gauche 4 lignes sous le croquis (ordre d'écriture : droite puis gauche)
  const CAR = { hw: 184, hh: 132, tw: 136 };
  const CLIGNES = (() => {
    const L = [], R = M.rng(911);
    for (let i = 0; i < 9; i++) L.push({ xr: 162, y: -94 + i * 23.5, len: i === 4 || i === 8 ? 60 + R() * 40 : CAR.tw - R() * 12 });
    for (let i = 0; i < 4; i++) L.push({ xr: -22, y: 32 + i * 23.5, len: i === 3 ? 70 : CAR.tw - R() * 12 });
    L.forEach((l, i) => { l.mots = ligneMots(l.len, 300 + i * 17); });
    return L;
  })();
  // croquis à la plume (centre du croquis en (0,0)) : machine volante à ailes de chauve-souris / corps dans un cercle
  const CRO = {
    machine: (() => {
      const S = [];
      for (const sg of [-1, 1]) {
        const root = [5 * sg, -8], ends = [[76, -42], [68, -14], [54, 6], [36, 18], [16, 24]].map(([x, y]) => [x * sg, y]);
        S.push(qbez(root, [34 * sg, -50], ends[0], 10));
        for (let i = 0; i < ends.length - 1; i++) { const a = ends[i], b = ends[i + 1], m = [lerp((a[0] + b[0]) / 2, root[0], 0.3), lerp((a[1] + b[1]) / 2, root[1], 0.3)]; S.push(qbez(a, m, b, 6)); }
        for (const e of ends) S.push([root, [lerp(root[0], e[0], 0.5), lerp(root[1], e[1], 0.5) - 3], e]);
      }
      S.push([[0, -26], [0, 34]]); S.push([[-12, 8], [12, 8]]); S.push([[-9, 34], [9, 34], [0, 50], [-9, 34]]);
      S.push(ell(0, -30, 5, 5, 10).concat([[5, -30]])); S.push(ell(-10, 20, 4, 4, 8).concat([[-6, 20]])); S.push(ell(10, 20, 4, 4, 8).concat([[14, 20]]));
      return S;
    })(),
    corps: (() => {
      const S = [];
      S.push(ell(0, 0, 54, 54, 30).concat([[54, 0]]));
      S.push(ell(0, -38, 8, 9, 12).concat([[8, -38]]));
      S.push([[-3, -29], [-5, -8], [-4, 12]]); S.push([[3, -29], [5, -8], [4, 12]]);
      S.push([[-52, -16], [-24, -20], [-4, -24]]); S.push([[4, -24], [24, -20], [52, -16]]);
      S.push([[-44, -34], [-20, -27], [-4, -25]]); S.push([[4, -25], [20, -27], [44, -34]]);
      S.push([[-4, 12], [-12, 30], [-22, 50]]); S.push([[4, 12], [12, 30], [22, 50]]);
      S.push([[-2, 12], [-4, 32], [-6, 53]]); S.push([[2, 12], [4, 32], [6, 53]]);
      return S;
    })(),
  };
  // une ligne d'écriture : xr = bord droit (début en écriture en miroir), u = abscisse le long de la ligne (sens d'écriture)
  function ligneDraw(l, frac, fromEnd, col, lw, sc) {
    const c = cx_(); sc = sc || 1;
    c.save(); c.translate(l.xr, l.y); c.scale(-sc, sc);                       // écriture en miroir : on part de la droite
    if (frac < 1) { c.beginPath(); const a = fromEnd ? l.len * (1 - frac) : -20, b = fromEnd ? l.len + 20 : l.len * frac; c.rect(a, -30, b - a, 40); c.clip(); }
    for (const m of l.mots) strokePts(m, col, lw);
    c.restore();
  }

  // =====================================================================
  // OBJETS — dessinés à l'échelle 1, origine = repère propre ; grip = prise de la main ; base = point posé en (x,y)
  // =====================================================================
  const OR = { or: '#b8913f', orL: '#e0c27a', orD: '#7a5a22' };
  // --- plume : pointe en bas devant, barbe blanche en haut derrière
  const PL_NIB = [20, 40], PL_TOP = [-36, -80];
  function drawPlume(o) {
    const v = [PL_TOP[0] - PL_NIB[0], PL_TOP[1] - PL_NIB[1]], L = Math.hypot(v[0], v[1]), d = [v[0] / L, v[1] / L], n = [-d[1], d[0]];
    const S = (u, w) => [PL_NIB[0] + d[0] * L * u + n[0] * w, PL_NIB[1] + d[1] * L * u + n[1] * w];
    const vane = []; for (let i = 0; i <= 12; i++) { const u = lerp(0.3, 1, i / 12); vane.push(S(u, 11 * Math.sin(PI * (u - 0.3) / 0.72) + 2)); }
    for (let i = 12; i >= 0; i--) { const u = lerp(0.36, 1, i / 12); vane.push(S(u, -7 * Math.sin(PI * (u - 0.36) / 0.66) - 1)); }
    pc(vane, '#f1ede2', () => {
      for (let i = 0; i < 14; i++) { const u = 0.36 + i * 0.045; strokePts([S(u, 0), S(u + 0.05, 10 * Math.sin(PI * (u - 0.3) / 0.72))], 'rgba(120,110,95,0.45)', 0.8); strokePts([S(u, 0), S(u + 0.04, -6 * Math.sin(PI * (u - 0.36) / 0.66))], 'rgba(120,110,95,0.35)', 0.8); }
      shade(S(1, 10)[0], S(1, 10)[1], S(0.3, -6)[0], S(0.3, -6)[1], 0.18, [-120, -140, 120, 120]);
    }, 7101, { texA: 0.35 });
    pc([S(0, 0), S(0.06, 2.2), S(0.62, 2.2), S(1.0, 1.0), S(1.0, -1.0), S(0.62, -2.2), S(0.06, -2.2)], '#ddd5c2', () => {
      fillPts([S(-0.02, 0), S(0.1, 3), S(0.1, -3)], ENCRE);
    }, 7102, { texA: 0.3 });
    if (!SIL()) strokePts([S(0.36, 0), S(1, 0)], 'rgba(150,140,120,0.8)', 1);
  }
  // --- encrier de verre sombre ; (0,0) = fond ; option plume (plantée)
  function drawEncrier(o) {
    if (o.plume) { const c = cx_(); c.save(); c.translate(-8, -46); c.rotate(-0.15); c.translate(-PL_NIB[0], -PL_NIB[1]); drawPlume(o); c.restore(); }
    pc([[-36, 0, 1], [36, 0, 1], [38, -10], [34, -36], [22, -46], [14, -48], [14, -60, 1], [-14, -60, 1], [-14, -48], [-22, -46], [-34, -36], [-38, -10]], '#26302f', () => {
      fillPts([[-34, -6], [34, -6], [32, -30], [-32, -30]], 'rgba(8,8,12,0.75)');
      strokePts([[-26, -38], [-30, -14]], 'rgba(220,240,240,0.55)', 2.4); strokePts([[-6, -56], [-6, -50]], 'rgba(220,240,240,0.5)', 1.6);
      fillPts([[-16, -64, 1], [16, -64, 1], [16, -58, 1], [-16, -58, 1]], '#151313');
    }, 7110, { texA: 0.3 });
  }
  // --- loupe : centre de la lentille en (0,0), manche vers le bas
  function drawLoupe(o) {
    pc([[-7, 46, 1], [7, 46, 1], [8, 60], [6, 70], [9, 82], [8, 120], [10, 130], [0, 138], [-10, 130], [-8, 120], [-9, 82], [-6, 70], [-8, 60]], '#6b4528', () => {
      fillPts([[-12, 44, 1], [12, 44, 1], [12, 62, 1], [-12, 62, 1]], OR.or); strokePts([[-10, 52], [10, 52]], OR.orD, 1);
      for (const y of [74, 96, 118]) strokePts([[-9, y], [9, y]], 'rgba(30,18,8,0.5)', 1.2);
      hatch([[-12, 60], [-3, 60], [-3, 138], [-12, 138]], 0.9, 3.2, 0.3);
    }, 7120);
    pc(ell(0, 0, 50, 50, 28), OR.or, () => { strokePts(ep(0, 0, 46, 46, 24, PI * 0.9, PI * 1.6), OR.orL, 2); }, 7121);
    if (SIL()) return;
    const c = cx_(); c.save(); c.beginPath(); c.arc(0, 0, 42, 0, TAU);
    const g = c.createRadialGradient(-12, -14, 4, 0, 0, 44); g.addColorStop(0, 'rgba(235,245,248,0.45)'); g.addColorStop(1, 'rgba(150,180,190,0.22)');
    c.fillStyle = g; c.fill(); c.restore();
    strokePts(ep(0, 0, 32, 32, 10, PI * 1.05, PI * 1.45), 'rgba(255,255,255,0.85)', 3);
    strokePts(ep(0, 0, 30, 30, 6, PI * 0.15, PI * 0.35), 'rgba(255,255,255,0.5)', 2);
  }
  // --- page aux lignes dans un reflet (lignes « remises à l'endroit »)
  function pageReflet(w, h, a) {
    if (SIL()) return;
    const c = cx_(); c.save(); c.globalAlpha *= a; c.rotate(-0.05);
    fillPts([[-w, -h, 1], [w, -h, 1], [w, h, 1], [-w, h, 1]], 'rgba(238,228,200,0.88)', 0, 0);
    const k = (1.7 * w) / CAR.tw, n = 6, dy = (1.7 * h) / n;
    for (let i = 0; i < n; i++) { const l = CLIGNES[i]; c.save(); c.translate(-0.85 * w, -0.85 * h + (i + 0.8) * dy); c.scale(k, k * 1.1); for (const m of l.mots) strokePts(m, 'rgba(40,26,16,0.9)', 1.3); c.restore(); }
    c.restore();
  }
  // --- miroir à main : ovale (0,0), manche vers le bas ; o.reflet (true|0..1)
  const MI = { rx: 70, ry: 92 };
  function miroirSurface(rx, ry, o) {
    if (SIL()) return;
    const c = cx_(); c.save(); c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, TAU); c.clip();
    const g = c.createLinearGradient(-rx, -ry, rx, ry); g.addColorStop(0, '#d9e3e6'); g.addColorStop(0.5, '#a7b8c1'); g.addColorStop(1, '#8a9ca6');
    c.fillStyle = g; c.fillRect(-rx, -ry, 2 * rx, 2 * ry);
    const rf = o.reflet === true ? 1 : +(o.reflet || 0);
    if (rf > 0) { unflip(); pageReflet(rx * 0.62, ry * 0.5, rf); }
    const sh = (o.t || 0) * 0.15 % 1;
    c.fillStyle = 'rgba(255,255,255,0.28)'; c.beginPath(); c.moveTo(-rx + sh * 20, ry * 0.2); c.lineTo(-rx * 0.2 + sh * 20, -ry); c.lineTo(-rx * 0.02 + sh * 20, -ry); c.lineTo(-rx + 18 + sh * 20, ry * 0.35); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.16)'; c.beginPath(); c.moveTo(-rx * 0.5, ry); c.lineTo(rx * 0.4, -ry); c.lineTo(rx * 0.55, -ry); c.lineTo(-rx * 0.3, ry); c.fill();
    c.restore();
  }
  function drawMiroir(o) {
    pc([[-9, 88, 1], [9, 88, 1], [10, 104], [8, 116], [11, 170], [14, 182], [0, 194], [-14, 182], [-11, 170], [-8, 116], [-10, 104]], OR.or, () => {
      for (const y of [100, 118, 172]) strokePts([[-11, y], [11, y]], OR.orD, 1.3); hatch([[-14, 90], [-3, 90], [-3, 194], [-14, 194]], 0.9, 3.2, 0.3);
    }, 7130);
    pc(ell(0, 0, MI.rx + 12, MI.ry + 12, 30), OR.or, () => {
      for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; dot(Math.cos(a) * (MI.rx + 6), Math.sin(a) * (MI.ry + 6), 2.2, i % 2 ? OR.orL : OR.orD); }
      strokePts(ep(0, 0, MI.rx + 9, MI.ry + 9, 14, PI * 1.0, PI * 1.6), 'rgba(255,240,200,0.5)', 1.5);
    }, 7131);
    miroirSurface(MI.rx, MI.ry, o);
  }
  // --- miroir mural ovale (cabinet) : centre (0,0)
  const MM = { rx: 112, ry: 150 };
  function drawMiroirMural(o) {
    pc([[-46, -MM.ry - 8], [-30, -MM.ry - 34], [0, -MM.ry - 48], [30, -MM.ry - 34], [46, -MM.ry - 8]], OR.or, () => {
      for (let i = 0; i < 7; i++) { const a = PI + (i + 0.5) / 7 * PI; strokePts([[0, -MM.ry - 6], [Math.cos(a) * 44, -MM.ry - 6 + Math.sin(a) * 40]], OR.orD, 1.4); }
    }, 7140);
    pc(ell(0, 0, MM.rx + 22, MM.ry + 22, 36), OR.or, () => {
      strokePts(ell(0, 0, MM.rx + 15, MM.ry + 15, 36).concat([[MM.rx + 15, 0]]), OR.orD, 1.6);
      for (let i = 0; i < 40; i++) { const a = i / 40 * TAU; dot(Math.cos(a) * (MM.rx + 9), Math.sin(a) * (MM.ry + 9), 2.6, i % 2 ? OR.orL : OR.orD); }
      strokePts(ep(0, 0, MM.rx + 19, MM.ry + 19, 16, PI * 1.0, PI * 1.55), 'rgba(255,240,200,0.5)', 2);
      hatch([[0, -300], [300, -300], [300, 300], [0, 300]], 0.6, 4, 0.18);
    }, 7141);
    miroirSurface(MM.rx, MM.ry, o);
  }
  // --- carnet ouvert de face : centre (0,0) ; o.lignes, o.sens, o.croquis, o.croquisK, o.miroir
  function drawCarnet(o) {
    const hw = CAR.hw, hh = CAR.hh, e = o.echelle || 1;
    pc(rrect(-hw, -hh, hw, hh, 12), '#5b3a24', () => {
      strokePts(rrect(-hw + 6, -hh + 6, hw - 6, hh - 6, 8).concat([[hw - 6, -hh + 14]]), 'rgba(230,200,150,0.35)', 1);
      hatch(null, 0.7, 4, 0.18, 1.0, P.encre, [-hw, -hh, hw, hh]);
    }, 7150);
    const fl = unflip();
    for (const sg of [-1, 1]) {
      const pg = [[sg * 4, -hh + 12, 1], [sg * 60, -hh + 7], [sg * (hw - 12), -hh + 12, 1], [sg * (hw - 10), hh - 10, 1], [sg * 60, hh - 6], [sg * 4, hh - 10, 1]];
      pc(pg, '#efe4c8', () => { shade(sg * 4, 0, sg * 50, 0, 0.32, [-hw, -hh, hw, hh], '90,60,30'); shade(sg * (hw - 10), 0, sg * (hw - 40), 0, 0.12, [-hw, -hh, hw, hh], '90,60,30'); }, 7151 + sg, { texA: 0.55, drop: false });
    }
    if (!SIL()) strokePts([[0, -hh + 10], [0, hh - 8]], 'rgba(40,25,12,0.55)', 1.6);
    if (SIL()) return;
    const c = cx_(); c.save();
    let sens = o.sens || null;
    if (o.miroir) c.scale(-1, 1);
    const nat = o.miroir ? 'gd' : 'rg', fromEnd = !!(sens && sens !== nat);
    const lw = 1.8 * Math.sqrt(e), nL = CLIGNES.length, k = (o.lignes == null ? 1 : clamp(o.lignes)) * nL;
    let tete = null;
    for (let i = 0; i < nL; i++) {
      const f = clamp(k - i); if (f <= 0) break;
      ligneDraw(CLIGNES[i], f, fromEnd, ENCRE, lw);
      if (f < 1) { const l = CLIGNES[i], u = fromEnd ? l.len * (1 - f) : l.len * f; tete = [l.xr - u, l.y - 3]; }
    }
    const cro = o.croquis && o.croquis !== 'aucun' ? CRO[o.croquis] : null;
    if (cro) { c.save(); c.translate(-92, -56); drawStrokes(cro, o.croquisK == null ? 1 : o.croquisK, SEPIA, 1.5 * Math.sqrt(e)); if ((o.croquisK == null ? 1 : o.croquisK) > 0.85 && o.croquis === 'machine') { hatch([[-60, -36], [-8, -10], [-14, 18], [-50, 0]], 0.9, 4, 0.25 * clamp(((o.croquisK == null ? 1 : o.croquisK) - 0.85) / 0.15)); hatch([[60, -36], [8, -10], [14, 18], [50, 0]], 0.9, 4, 0.25 * clamp(((o.croquisK == null ? 1 : o.croquisK) - 0.85) / 0.15)); } c.restore(); }
    c.restore();
    if (tete) o._tete = [tete[0] * (o.miroir ? -1 : 1) * fl, tete[1]];
  }
  // --- portrait de Léonard : centre (0,0), 220 × 280 ; o.clin 0..1
  function drawPortrait(o) {
    pc(rrect(-110, -140, 110, 140, 6), OR.or, () => {
      fillPts([[-96, -126, 1], [96, -126, 1], [96, 126, 1], [-96, 126, 1]], OR.orD);
      for (let i = 0; i < 18; i++) { dot(-100 + i * 11.8, -133, 2, OR.orL); dot(-100 + i * 11.8, 133, 2, OR.orL); }
      for (let i = 0; i < 22; i++) { dot(-103, -124 + i * 11.8, 2, OR.orL); dot(103, -124 + i * 11.8, 2, OR.orL); }
      strokePts([[-108, 138], [-108, -138], [108, -138]], 'rgba(255,240,200,0.45)', 2);
    }, 7160);
    pc([[-88, -118, 1], [88, -118, 1], [88, 118, 1], [-88, 118, 1]], '#3d3528', null, 7161, { drop: false, texA: 0.5 });
    if (SIL()) return;
    const c = cx_(); c.save(); c.beginPath(); c.rect(-88, -118, 176, 236); c.clip();
    const g = c.createRadialGradient(10, -30, 10, 0, 0, 150); g.addColorStop(0, 'rgba(160,140,100,0.65)'); g.addColorStop(1, 'rgba(40,34,26,0)'); c.fillStyle = g; c.fillRect(-90, -120, 180, 240);
    unflip();
    // buste peint (mêmes formes que la marionnette) : épaules, cheveux, tête, barbe, béret
    c.save(); c.translate(-8, 40); c.scale(1.05, 1.05);
    fillPts([[-90, 90], [-70, 30], [-40, 10], [10, 8], [44, 22], [70, 90]], LE.robe); fillPts([[-6, 8], [20, 12], [14, 30], [-2, 24]], LE.poignet);
    c.translate(0, -18);
    fillPts(LE_HAIR, LE.blanc); fillPts(X.NAP_HEAD, LE.peau);
    fillPts([[-6, -50], [2, -46], [4, -36]], 'rgba(150,100,80,0.4)');
    const cl = clamp(o.clin || 0);
    X.eye({ eyes: cl > 0.7 ? 'closed' : cl > 0.3 ? 'half' : 'open' }, 18, -52);
    strokePts([[10, -60 + 1.5 * cl], [18, -63 + 1.5 * cl], [27, -60 + 1.5 * cl]], LE.blanc, 4); X.mouth({ mouth: cl > 0.3 ? 'smile' : 'n' }, 27, -27);
    fillPts([[33, -34], [28, -31], [22, -26], [17, -18], [14, -10], [20, -14], [25, -22], [30, -27], [35, -30]], LE.blanc);
    c.save(); c.translate(10, -8); fillPts(LE_BEARD(0), LE.blanc); for (let i = 0; i < 6; i++) strokePts(barbeMeche(i, 0), 'rgba(150,140,125,0.6)', 1); c.restore();
    c.save(); c.translate(-4, -88); fillPts(LE_BERET, LE.beret); strokePts([[-58, 10], [-20, 12], [24, 8], [40, 2]], LE.beretD, 2.4); c.restore();
    c.restore();
    c.fillStyle = 'rgba(255,240,200,0.06)'; c.fillRect(-88, -118, 176, 236);
    c.restore();
  }
  // --- grande page de démonstration : (0,0) = MILIEU DU BAS de la feuille ; 560 × 430
  const GP = { w: 560, h: 430, x0: -240, lx: 480, y0: -380, dy: 46, n: 8, sc: 2.3 };
  const GLIGNES = (() => { const L = []; for (let i = 0; i < GP.n; i++) { const len = (i === 3 || i === 7 ? 300 : GP.lx - 16 * hash(i + 40)) / GP.sc; L.push({ len, mots: ligneMots(len, 700 + i * 13) }); } return L; })();
  function gpLigne(i, f, sensRG, col, lw, glint) {                            // dessine la ligne i (fraction f, sens de tracé) ; renvoie le point de tête (local)
    const l = GLIGNES[i], y = GP.y0 + i * GP.dy, c = cx_(), L = l.len * GP.sc;
    c.save();
    if (sensRG) { c.translate(GP.x0 + L, y); c.scale(-GP.sc, GP.sc); } else { c.translate(GP.x0, y); c.scale(GP.sc, GP.sc); }
    if (f < 1) { c.beginPath(); c.rect(-10, -30, l.len * f + 10, 40); c.clip(); }
    for (const m of l.mots) strokePts(m, col, lw);
    if (glint) for (const m of l.mots) strokePts(tr(m, -0.35, -0.5), 'rgba(255,255,255,0.55)', 1.1);
    c.restore();
    return [sensRG ? GP.x0 + L - L * f : GP.x0 + L * f, y - 6];
  }
  function drawGrandePage(o) {
    const w = GP.w / 2, h = GP.h;
    if (!SIL()) { const c = cx_(); c.save(); c.strokeStyle = 'rgba(20,15,10,0.6)'; c.lineWidth = 1.4 * M._lw(); c.beginPath(); for (const x of [-230, 230]) { c.moveTo(x, -h - 8); c.lineTo(x + (o.fil || 0), -h - 3000); } c.stroke(); c.restore(); }
    pc([[-w, -h, 1], [w, -h, 1], [w + 2, -h * 0.5], [w, -14], [w - 18, 0, 1], [-w + 22, 2, 1], [-w, -16], [-w - 2, -h * 0.5]], '#efe5c9', () => {
      shade(0, -h, 0, 0, 0.12, [-w - 10, -h - 10, w + 10, 10], '90,60,30'); shade(w, 0, w - 40, -40, 0.25, [-w - 10, -h - 10, w + 10, 10], '90,60,30');
    }, 7170, { texA: 0.5 });
    pc([[-w - 14, -h - 12, 1], [w + 14, -h - 12, 1], [w + 14, -h + 6, 1], [-w - 14, -h + 6, 1]], '#6b4a2c', () => hatch(null, 0.1, 4, 0.25, 1, P.encre, [-w - 20, -h - 20, w + 20, -h + 10]), 7171);
    if (SIL()) return;
    const c = cx_(); c.save(); unflip();
    const nOld = Math.round(clamp(o.lignes == null ? 0 : o.lignes) * GP.n), rg = o.sens === 'rg';
    for (let i = 0; i < GP.n; i++) if (i < nOld && i !== o.ligne) gpLigne(i, 1, rg, 'rgba(60,40,26,0.85)', 2.6, false);
    const li = o.ligne != null ? o.ligne : Math.min(GP.n - 1, nOld), f = clamp(o.fraiche == null ? 0 : o.fraiche);
    let tete = gpLigne(li, 0, rg, ENCRE, 3.4, false);
    if (f > 0) {
      const bv = clamp(o.bavure || 0), y = GP.y0 + li * GP.dy, L = GLIGNES[li].len * GP.sc;
      tete = gpLigne(li, f, rg, '#0a0706', 3.6, true);
      if (bv > 0) {                                                            // traînée grise : la tranche de la main a frotté l'encre fraîche
        const xa = rg ? tete[0] + 12 : GP.x0 - 6, xb = rg ? GP.x0 + L + 6 : tete[0] - 12, len = Math.max(0, xb - xa) * bv;
        const a0 = rg ? xa : xb - len, a1 = rg ? xa + len : xb;
        if (a1 > a0) {
          const g = c.createLinearGradient(a0, 0, a1, 0); const dark = 'rgba(70,66,64,0.62)', clear = 'rgba(70,66,64,0)';
          g.addColorStop(0, rg ? dark : clear); g.addColorStop(rg ? 0.25 : 0.75, dark); g.addColorStop(1, rg ? clear : dark);
          c.fillStyle = g; c.beginPath(); c.moveTo(a0, y - 16); c.bezierCurveTo(a0 + (a1 - a0) * 0.3, y - 22, a0 + (a1 - a0) * 0.7, y - 10, a1, y - 14); c.lineTo(a1, y + 26); c.bezierCurveTo(a0 + (a1 - a0) * 0.6, y + 34, a0 + (a1 - a0) * 0.3, y + 18, a0, y + 22); c.closePath(); c.fill();
          for (let k = 0; k < 7; k++) { const yy = y - 12 + k * 5.5, xs = a0 + (a1 - a0) * 0.08 * hash(k + 3), xe = a1 - (a1 - a0) * 0.12 * hash(k + 9); strokePts([[xs, yy], [(xs + xe) / 2, yy + 1.5 * Math.sin(k)], [xe, yy + 1]], 'rgba(40,36,34,0.35)', 1.6); }
        }
      }
    }
    c.restore();
    o._tete = tete;
  }
  // --- main gauche géante (démonstration) : (0,0) = POINTE DE LA PLUME. Vue de dessus : l'avant-bras (manche rose, poignet ivoire) MONTE DU BAS,
  //     presque vertical ; dos de la main, 4 doigts repliés, pouce à DROITE qui pince la plume avec l'index ; la plume part vers le bas-droite.
  //     La tranche (côté auriculaire, à gauche) touche la ligne juste à gauche de la pointe : c'est elle qui fait la bavure.
  const MG = { Wc: [-66.3, 96.7], u: [0.25, -0.97], v: [0.97, 0.25], fin: [-114, 284] };
  const mgH = (k, w) => [MG.Wc[0] + MG.u[0] * k + MG.v[0] * w, MG.Wc[1] + MG.u[1] * k + MG.v[1] * w];
  function capsule(P, Q, r0, r1) {
    const L = Math.hypot(Q[0] - P[0], Q[1] - P[1]), e = [(Q[0] - P[0]) / L, (Q[1] - P[1]) / L], p = [-e[1], e[0]], o = [[P[0] + p[0] * r0, P[1] + p[1] * r0]];
    for (let i = 0; i <= 8; i++) { const a = PI / 2 - i / 8 * PI; o.push([Q[0] + r1 * (Math.cos(a) * p[0] + Math.sin(a) * e[0]), Q[1] + r1 * (Math.cos(a) * p[1] + Math.sin(a) * e[1])]); }
    o.push([P[0] - p[0] * r0, P[1] - p[1] * r0]); return o;
  }
  const H = mgH;
  const MG_MANCHE = [H(-30, -50), H(-30, 50), H(-120, 54), H(-182, 56, 1), H(-192, 30), H(-196, 0), H(-192, -30), H(-182, -56, 1), H(-120, -54)];
  const MG_POIGNET = [H(2, -44), H(2, 44), H(-10, 50), H(-22, 46), H(-34, 52), H(-34, -52), H(-22, -46), H(-10, -50)];
  const MG_DOS = [H(0, -38), H(40, -43), H(74, -40), H(84, -22), H(86, 0), H(84, 18), H(78, 30), H(52, 38), H(22, 40), H(0, 36)];
  const MG_DOIGTS = [[-28, 70, 90, 12, -27], [-9, 74, 96, 12.5, -8], [10, 76, 98, 12.5, 11]];   // auriculaire, annulaire, majeur : w, k base, k bout, rayon, w bout
  const MG_INDEX = [H(80, 24), [-6, 14]], MG_POUCE = [H(20, 38), [15, 36]];
  function drawMainGauche(o) {
    const tk = clamp(o.tache || 0), ink = (a) => `rgba(18,14,16,${(a * tk).toFixed(3)})`;
    const plume = () => { const c = cx_(); c.save(); const a = Math.atan2(PL_TOP[1] - PL_NIB[1], PL_TOP[0] - PL_NIB[0]); c.rotate(Math.atan2(1, 0.18)); c.scale(1.25, 1.1); c.rotate(-a); c.translate(-PL_NIB[0], -PL_NIB[1]); drawPlume({}); c.restore(); };
    if (!SIL()) {                                                             // ombre portée légère sur la page
      const c = cx_(); c.save(); c.translate(14, 12); c.filter = 'blur(5px)';
      for (const pts of [MG_MANCHE, MG_POIGNET, MG_DOS, capsule(MG_INDEX[0], MG_INDEX[1], 10, 8.5), capsule(MG_POUCE[0], MG_POUCE[1], 14, 10)].concat(MG_DOIGTS.map(([w, k0, k1, r, w1]) => capsule(H(k0, w), H(k1, w1), r, r)))) fillPts(pts, 'rgba(40,24,12,0.16)', 0, 0);
      c.restore();
    }
    pc(MG_MANCHE, LE.robe, () => {
      hatch(null, 1.3, 4.2, 0.26, 1, P.encre, [-200, 0, 40, 320]);
      for (const w of [-28, 4, 30]) strokePts([H(-40, w), H(-110, w * 1.08), H(-176, w * 1.1)], 'rgba(70,30,35,0.45)', 1.5);
      strokePts([H(-176, -54), H(-190, 0), H(-176, 54)], LE.robeD, 3);
    }, 7180);
    pc(MG_POIGNET, LE.poignet, () => {
      for (let i = -3; i <= 3; i++) strokePts([H(0, i * 13), H(-32, i * 15)], 'rgba(150,130,100,0.5)', 1);
      strokePts([H(-33, -50), H(-33, 50)], 'rgba(90,70,50,0.5)', 1.4);
      if (tk > 0) { fillPts([H(4, -48), H(4, -14), H(-10, -8), H(-20, -20), H(-36, -14), H(-36, -56)], ink(0.88)); const d = H(-6, 2); dot(d[0], d[1], 5 * tk, ink(0.8)); }
    }, 7181);
    pc(MG_DOS, LE.peau, () => {
      for (const w of [-26, -10, 6, 22]) strokePts([H(10, w * 0.7), H(44, w * 0.9), H(74, w)], 'rgba(150,100,80,0.35)', 1.2);   // tendons
      shade(H(80, 30)[0], H(80, 30)[1], H(10, -30)[0], H(10, -30)[1], 0.18, [-140, -20, 40, 140]);
      if (tk > 0) fillPts([H(-2, -42), H(40, -47), H(76, -44), H(84, -26), H(72, -26), H(40, -30), H(-2, -26)], ink(0.85));
    }, 7182);
    MG_DOIGTS.forEach(([w, k0, k1, r, w1], i) => {
      const K = H(k0, w), T = H(k1, w1);
      pc(capsule(K, T, r, r), LE.peau, () => {
        const m = H((k0 + k1) / 2 + 2, (w + w1) / 2); strokePts([[m[0] - 7, m[1] + 1], [m[0], m[1] - 1.5], [m[0] + 7, m[1] + 1]], 'rgba(120,70,50,0.5)', 1.1);   // jointure
        dot(K[0], K[1] + 2, 2.6, 'rgba(255,230,210,0.5)');
        if (i === 0 && tk > 0) fillPts(capsule(K, T, r + 2, r + 2), ink(0.82));
      }, 7183 + i);
    });
    plume();
    pc(capsule(MG_POUCE[0], MG_POUCE[1], 14, 10), LE.peauD, () => {
      const m = H(46, 42); strokePts([[m[0] - 5, m[1] + 6], [m[0] + 6, m[1] - 3]], 'rgba(120,70,50,0.45)', 1);
      fillPts(ell(12, 33, 5, 4, 8), 'rgba(255,235,220,0.65)'); strokePts(ep(12, 33, 5, 4, 6, PI * 0.8, PI * 1.9), 'rgba(150,100,80,0.5)', 0.8); hatch(null, 0.5, 3.4, 0.14);
    }, 7187);
    pc(capsule(MG_INDEX[0], MG_INDEX[1], 10, 8.5), LE.peau, () => {
      const m = H(98, 20); strokePts([[m[0] - 6, m[1] + 2], [m[0] + 5, m[1] - 3]], 'rgba(120,70,50,0.5)', 1.1);
      fillPts(ell(-5, 12, 4.5, 3.6, 8), 'rgba(255,235,220,0.65)'); strokePts(ep(-5, 12, 4.5, 3.6, 6, PI * 0.9, PI * 2), 'rgba(150,100,80,0.5)', 0.8);
    }, 7188);
  }

  // =====================================================================
  // REGISTRE DES OBJETS (tenus ou seuls)
  // =====================================================================
  const OBJ = {
    plume: { draw: drawPlume, grip: [0, 0], pts: { pointe: PL_NIB, bout: PL_TOP }, base: PL_NIB },
    loupe: { draw: drawLoupe, grip: [0, 96], pts: { centre: [0, 0] }, base: [0, 0] },
    miroir: { draw: drawMiroir, grip: [0, 150], pts: { centre: [0, 0] }, base: [0, 0] },
    carnet: { draw: drawCarnet, grip: [0, 126], p2: () => [-150, 112], pts: { centre: [0, 0] }, base: [0, 0], plat: true, held: { echelle: 0.55 } },
    encrier: { draw: drawEncrier, grip: [0, -30], pts: { bouche: [0, -62] }, base: [0, 0] },
  };
  LEO.OBJ = OBJ;
  const has = (v) => v && v !== 'rien';
  const gripOf = (ob, o) => (typeof ob.grip === 'function' ? ob.grip(o) : ob.grip);
  function heldOpts(name, o, p) { const ob = OBJ[name]; return Object.assign({ t: p.t || 0 }, ob.held || {}, o || {}); }
  function heldDraw(name, o, p) {
    const ob = OBJ[name]; if (!ob) return;
    const oo = heldOpts(name, o, p), g = gripOf(ob, oo), e = oo.echelle || 1, c = cx_();
    c.save(); c.scale(e, e); c.translate(-g[0], -g[1]); ob.draw(oo); c.restore();
  }
  const DOIGTS = [[-13, -9], [9, -11], [12, -4], [12, 6], [6, 11], [-6, 11], [-13, 4]];
  function heldParts(skin, seed) {
    const plat = (v) => has(v) && OBJ[v] && OBJ[v].plat;
    const dp = (front) => (p) => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(70,40,30,0.5)', 1); hatch(null, 0.9, 3.4, 0.15); if (front && p.encre > 0) fillPts([[-16, -14, 1], [16, -14, 1], [16, 14, 1], [-16, 14, 1]], `rgba(18,14,18,${0.85 * clamp(p.encre)})`); };
    return {
      objetB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 3, pts: OFFP, extra: (p) => { if (has(p.tenuB) && !plat(p.tenuB)) heldDraw(p.tenuB, p.tenuBO, p); } },
      doigtsBb: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 5, pts: (p) => (has(p.tenuB) && !plat(p.tenuB) && !p._deux ? DOIGTS : OFFP), paint: dp(false) },
      platB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 6, pts: OFFP, extra: (p) => { if (plat(p.tenuB)) heldDraw(p.tenuB, p.tenuBO, p); } },
      plat: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 7, pts: OFFP, extra: (p) => { if (plat(p.tenu)) heldDraw(p.tenu, p.tenuO, p); } },
      objet: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (has(p.tenu) && !plat(p.tenu)) heldDraw(p.tenu, p.tenuO, p); } },
      doigts: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 2, pts: (p) => (has(p.tenu) ? DOIGTS : OFFP), paint: dp(true) },
      doigtsB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 4, pts: (p) => (plat(p.tenuB) || p._deux ? DOIGTS : OFFP), paint: dp(false) },
    };
  }
  const ORDER = (behind, front) => ['armB_up', 'armB_lo', 'objetB', 'doigtsBb', 'legB', 'legF'].concat(behind, ['torso'], front, ['platB', 'plat', 'armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsB']);
  // point nommé (écran) de l'objet tenu
  LEO.pt = function (r, nom, arriere) {
    const name = arriere ? r.tenuB : r.tenu, ob = OBJ[name]; if (!ob || !ob.pts[nom]) return null;
    const oo = arriere ? r.tenuBO : r.tenuO, g = gripOf(ob, oo), e = oo.echelle || 1, q = ob.pts[nom];
    return r.w((arriere ? (ob.plat ? 'platB' : 'objetB') : (ob.plat ? 'plat' : 'objet')), (q[0] - g[0]) * e, (q[1] - g[1]) * e);
  };

  // =====================================================================
  // POSES — préparation commune
  // =====================================================================
  function prep(p) { p = p || {}; return Object.assign({}, p, { ang: Object.assign({}, p.ang), hide: Object.assign({}, p.hide), face: Object.assign({}, p.face) }); }
  function armTo(q, arm, T, pick, k) {
    if (!(k > 0)) return;
    const sol = ik2(arm === 'armF' ? SH_F : SH_B, T, pick), A = q.ang;
    const a0 = A[arm + '_up'] || 0, b0 = A[arm + '_lo'] || 0;
    A[arm + '_up'] = a0 + normA(sol.a - a0) * k; A[arm + '_lo'] = b0 + normA(sol.b - b0) * k;
  }
  const blend = (q, n, v, k) => { q.ang[n] = lerp(q.ang[n] || 0, v, k); };
  function finish(q) {
    const A = q.ang, tl = q.tilt || 0;
    if (has(q.tenu) && !(q.handF && q.handF !== 'fist')) q.handF = 'fist';
    if (has(q.tenuB) && !(q.handB && q.handB !== 'fist')) q.handB = 'fist';
    if (q.droit == null && has(q.tenu)) q.droit = true;
    if (q.droitB == null && has(q.tenuB)) q.droitB = true;
    if (q.droit) A.objet = (A.objet || 0) - ((A.armF_up || 0) + (A.armF_lo || 0) + tl);
    if (q.droitB) A.objetB = (A.objetB || 0) - ((A.armB_up || 0) + (A.armB_lo || 0) + tl);
    A.plat = A.objet || 0; A.platB = A.objetB || 0;
    q._deux = false;
    if (q.deuxMains && has(q.tenu) && OBJ[q.tenu] && OBJ[q.tenu].p2) {
      const ob = OBJ[q.tenu], oo = heldOpts(q.tenu, q.tenuO, q), g = gripOf(ob, oo), e = oo.echelle || 1;
      const Hf = new DOMMatrix().translate(SH_F[0], SH_F[1]).rotate((A.armF_up || 0) * D).translate(0, LA).rotate((A.armF_lo || 0) * D).translate(4, 96).rotate((A.objet || 0) * D).scale(e, e).translate(-g[0], -g[1]);
      const sol = ik2(SH_B, mp(Hf, ob.p2(oo)), 'bas');
      A.armB_up = sol.a; A.armB_lo = sol.b; q.handB = 'fist'; q._deux = true;
    }
    return q;
  }
  // bendSign de M.ik vérifiés au casting (bras avant / arrière ; identiques pour dir 1 et −1)
  LEO.BEND = { leonard: { armF: 1, armB: 1 }, savantA: { armF: 1, armB: 1 }, savantB: { armF: 1, armB: 1 } };
  // amène la main (ou le point nommé `nom` de l'objet tenu) sur la cible ÉCRAN, par M.ik (3 passes de correction)
  function viser(def, q, x, y, s, dir, arm, cible, k, bend, nom) {
    if (!cible || !(k > 0)) return;
    const A = q.ang, a0 = A[arm + '_up'] || 0, b0 = A[arm + '_lo'] || 0, tenu = arm === 'armF' ? q.tenu : q.tenuB;
    let T = cible.slice(), sol = null;
    for (let i = 0; i < 4; i++) {
      sol = M.ik(def, q, x, y, s, dir, arm, T, bend);
      if (!nom || !has(tenu) || !OBJ[tenu] || !OBJ[tenu].pts[nom]) break;
      const qq = prep(q); qq.ang[arm + '_up'] = sol.up; qq.ang[arm + '_lo'] = sol.lo; finish(qq);
      const { mats } = M.partMatrices(def, qq, x, y, s, dir), ob = OBJ[tenu], oo = heldOpts(tenu, arm === 'armF' ? qq.tenuO : qq.tenuBO, qq), g = gripOf(ob, oo), e = oo.echelle || 1, pn = ob.pts[nom];
      const part = arm === 'armF' ? (ob.plat ? 'plat' : 'objet') : (ob.plat ? 'platB' : 'objetB');
      const Pw = M.wpt(mats[part], (pn[0] - g[0]) * e, (pn[1] - g[1]) * e);
      T = [T[0] + cible[0] - Pw[0], T[1] + cible[1] - Pw[1]];
    }
    A[arm + '_up'] = a0 + normA(sol.up - a0) * k; A[arm + '_lo'] = b0 + normA(sol.lo - b0) * k;
  }
  function run(def, key, q, x, y, s, o) {
    o = Object.assign({ slot: M.ST.slotF, nom: key }, o || {});
    const dir = o.dir || 1, bras = q.bras === 'B' ? 'armB' : 'armF';
    if (q.cible && q.atteint > 0) viser(def, q, x, y, s, dir, bras, q.cible, ease(clamp(q.atteint)), LEO.BEND[key][bras], q.ptCible || (has(bras === 'armF' ? q.tenu : q.tenuB) ? (q.tenu === 'plume' ? 'pointe' : 'centre') : null));
    if (q._regarde > 0) {                                                     // loupe devant l'œil
      const { mats } = M.partMatrices(def, q, x, y, s, dir);
      viser(def, q, x, y, s, dir, 'armF', M.wpt(mats.head, 96, -50), q._regarde, LEO.BEND[key].armF, 'centre');
    }
    finish(q);
    const r = M.puppet(def, q, x, y, s, o);
    r.tenu = q.tenu; r.tenuB = q.tenuB; r.pose = q;
    if (has(q.tenu) && OBJ[q.tenu]) r.tenuO = heldOpts(q.tenu, q.tenuO, q);
    if (has(q.tenuB) && OBJ[q.tenuB]) r.tenuBO = heldOpts(q.tenuB, q.tenuBO, q);
    return r;
  }

  // ---------------- pièces de corps communes
  function foreDef(parent, o) {
    const hk = (p) => (o.back ? p.handB : p.handF) || 'fist';
    return { parent, at: [0, LA], pts: (p) => foreR(hk(p), o.flare || 0), base: o.base, seed: o.seed, paint: (p) => {
      const k = hk(p);
      fillPts([[-26, 79, 1], [26, 79, 1], [26, 140, 1], [-26, 140, 1]], o.skin); X.handPaint(null, k);
      if (o.cuff) {
        const y0 = o.cuffY || 58;
        fillPts([[-26, y0], [26, y0], [26, 80], [18, 85], [10, 80], [2, 85], [-6, 80], [-14, 85], [-26, 80]], o.cuff);
        strokePts([[-20, y0 + 1], [20, y0 + 1]], 'rgba(90,70,50,0.45)', 1.1);
        for (let i = -2; i <= 2; i++) strokePts([[i * 7, y0 + 4], [i * 7 + 1, 80]], 'rgba(150,130,100,0.4)', 0.9);
        if (!o.back && p.tache > 0) { const t = clamp(p.tache); fillPts([[-12, 62], [-2, 60 - 2 * t], [6, 64], [4 + 3 * t, 72], [-4, 78 + 2 * t], [-14, 74]].map(([x, y]) => [x * (0.5 + 0.6 * t), 68 + (y - 68) * (0.5 + 0.6 * t)]), `rgba(14,10,12,${0.9 * t})`); dot(10 * t, 76, 2.6 * t, `rgba(14,10,12,${0.9 * t})`); }
      }
      if (!o.back && p.encre > 0) { const t = clamp(p.encre); fillPts([[-26, 82, 1], [26, 82, 1], [26, 140, 1], [-26, 140, 1]], `rgba(18,14,18,${0.85 * t})`); fillPts([[-12, 70], [-4, 66], [2, 74], [10, 68], [14, 82], [-12, 84]], `rgba(18,14,18,${0.7 * t})`); }
      hatch([[-16, -10], [-3, -10], [-3, 56], [-16, 56]], 0.9, 3.8, 0.24);
    } };
  }
  const upDef = (at, base, seed, wt) => ({ parent: 'torso', at, pts: armR(LA, wt), base, seed, paint: () => hatch([[-18, -20], [-3, -20], [-3, 100], [-18, 100]], 0.9, 3.8, 0.26) });
  function legDef(at, base, shoe, seed, back, th) {
    return { parent: 'torso', at, pts: X.legPts(th || 0.95), base, seed, noRivet: !!back, paint: () => {
      fillPts([[-40, 214, 1], [60, 214, 1], [60, 260, 1], [-40, 260, 1]], shoe);
      if (!back) { strokePts([[20, 224], [42, 229]], 'rgba(255,255,255,0.25)', 1.3); hatch([[-26, -20], [-6, -20], [-6, 214], [-26, 214]], 0.8, 4, 0.25); } else hatch(null, 0.8, 3.6, 0.3);
    } };
  }
  function faceOf(p) {                                                        // expr : 'n'|'smile'|'satisfait'|'clin' ; clin 0..1 (paupière)
    const f = Object.assign({}, p.face || {}), e = p.expr || 'n';
    if (e === 'smile' && !f.mouth) f.mouth = 'smile';
    if (e === 'satisfait') { if (!f.mouth) f.mouth = 'smile'; if (!f.eyes) f.eyes = 'half'; }
    let cl = p.clin != null ? clamp(p.clin) : e === 'clin' ? 1 : 0;
    if (cl > 0) { if (!f.mouth) f.mouth = 'smile'; f.eyes = cl > 0.7 ? 'closed' : cl > 0.25 ? 'half' : (f.eyes || 'open'); }
    return f;
  }

  // =====================================================================
  // LÉONARD — béret rouge-brun, barbe blanche fluviale, robe rose ancien, poignets ivoire ; GAUCHER : bras AVANT = bras gauche (de profil, dir −1)
  // =====================================================================
  const LE = { robe: '#9b5a5e', robeD: '#7c454a', robeL: '#b07076', beret: '#5e2f2a', beretD: '#45201c', poignet: '#e8dcc4', peau: '#dcb592', peauD: '#c09574', blanc: '#ece8de', blancD: '#c4beb0', ceinture: '#3b2a20', chaus: '#3a2a22', bas: '#4e4038' };
  LEO.LE = LE;
  const LE_HAIR = [[10, -92], [-12, -98], [-32, -90], [-44, -68], [-46, -50], [-51, -36], [-50, -18], [-56, -2], [-54, 16], [-59, 34], [-53, 50], [-47, 66, 1], [-41, 52], [-34, 63, 1], [-28, 46], [-20, 54, 1], [-16, 32], [-10, 10], [-14, -18], [-6, -38], [6, -64]];
  const LE_BERET = [[-68, 24], [-76, 8], [-70, -10], [-52, -27], [-26, -37], [4, -39], [28, -33], [42, -21], [46, -8], [38, 2], [20, 6], [-4, 8], [-30, 12], [-52, 21]];
  const LE_BEARD = (w) => [[-28, -20], [-14, -10], [0, -8], [10, -12], [16, -14], [22, -4], [24, 12], [21 + w, 28], [25 + w, 44], [20 + w, 60], [22 + w * 1.5, 76], [14 + w * 1.5, 92], [11 + w * 2, 104], [4 + w * 2, 120, 1], [-3 + w * 1.5, 104], [-10 + w, 94], [-15 + w, 78], [-23 + w, 62], [-20, 46], [-29, 30], [-26, 14], [-32, 0]];
  function barbeMeche(i, w) { const x0 = -22 + i * 7, o = []; for (let k = 0; k <= 9; k++) { const y = -4 + k * 12, f = 1 - k / 12; o.push([lerp(4, x0, f) + 2.4 * Math.sin(k * 1.3 + i) + w * k / 9 * 1.5, y]); } return o; }
  function leRobe(p) {
    const w = Math.sin((p.t || 0) * 1.6) * 2.5;
    return [[-14, -176], [8, -180], [18, -168], [30, -150], [38, -116], [40, -72], [37, -30], [42, 30], [52, 110], [62 + w * 0.5, 180], [68 + w, 222, 1], [30 + w, 226], [-10 + w, 224], [-64 + w, 224, 1], [-58 + w * 0.5, 170], [-50, 100], [-45, 30], [-41, -30], [-41, -104], [-36, -146], [-26, -168]];
  }
  function mkLeonard() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: leRobe, base: LE.robe, seed: 8001, paint: () => {
        fillPts([[0, -184], [16, -174], [12, -158], [0, -166]], LE.poignet);
        fillPts([[-80, -40, 1], [80, -40, 1], [80, -26, 1], [-80, -26, 1]], LE.ceinture); strokePts([[-60, -39], [60, -39]], 'rgba(255,230,200,0.2)', 1);
        fillPts([[-30, -26], [-18, -26], [-16, 6], [-24, 12], [-32, 6]], '#4a3324');                                          // aumônière de cuir
        for (const [x0, x1] of [[26, 46], [8, 14], [-12, -22], [-30, -46]]) strokePts([[x0, -24], [(x0 + x1) / 2 + 3, 90], [x1, 222]], 'rgba(70,30,35,0.45)', 1.4);
        fillPts([[-80, 210, 1], [80, 210, 1], [80, 240, 1], [-80, 240, 1]], LE.robeD);
        hatch([[-52, -170], [-14, -170], [-22, 230], [-72, 230]], 0.75, 4.2, 0.3);
        shade(44, 0, -44, 0, 0.24, [-90, -200, 90, 240]);
      } },
      legB: legDef([-6, -2], LE.bas, LE.chaus, 8002, true, 0.85),
      legF: legDef([6, -2], LE.bas, LE.chaus, 8003, false, 0.85),
      armB_up: upDef([-10, -146], LE.robeD, 8004, 17),
      armB_lo: foreDef('armB_up', { base: LE.robeD, skin: LE.peauD, back: true, seed: 8005, cuff: '#cfc2a8', flare: 4 }),
      head: { parent: 'torso', at: [6, -170], pts: X.NAP_HEAD, base: LE.peau, seed: 8006, noRivet: true, paint: (p) => {
        const f = faceOf(p);
        fillPts([[32, -84], [20, -80], [6, -80], [-10, -76], [-20, -64], [-26, -44], [-32, -30], [-48, -28], [-48, -110], [32, -110]], LE.blanc, 3);
        for (const y of [-76, -68]) strokePts([[-14, y], [-30, y + 20]], 'rgba(150,140,125,0.55)', 1);
        strokePts([[22, -73], [31, -72]], 'rgba(130,85,65,0.45)', 1); strokePts([[20, -67], [29, -66]], 'rgba(130,85,65,0.4)', 1);
        strokePts([[8, -49], [3, -46]], 'rgba(130,85,65,0.45)', 1); strokePts([[8, -53], [3, -54]], 'rgba(130,85,65,0.4)', 1);
        hatch([[-6, -42], [14, -36], [18, -20], [0, -14], [-12, -26]], 0.6, 3.6, 0.24);
        dot(16, -34, 8, 'rgba(200,120,100,0.18)');
        strokePts([[30, -44], [26, -36]], 'rgba(130,85,65,0.5)', 1.1);
        X.eye(f, 18, -52);
        strokePts([[9, -59], [18, -63], [28, -60]], LE.blanc, 4.4); strokePts([[10, -60], [18, -63.5], [27, -61]], 'rgba(150,140,125,0.6)', 1);
        X.mouth(f, 27, -27);
        fillPts([[33, -35], [28, -32], [22, -27], [17, -19], [14, -10], [20, -14], [25, -22], [30, -27], [36, -30]], LE.blanc);
        strokePts([[30, -32], [22, -24], [18, -16]], 'rgba(150,140,125,0.6)', 1);
      } },
      cheveux: { parent: 'head', at: [0, 0], pts: LE_HAIR, base: LE.blanc, seed: 8007, noRivet: true, paint: () => {
        for (let i = 0; i < 6; i++) { const o = []; for (let k = 0; k <= 8; k++) o.push([-16 - i * 6 + 2.5 * Math.sin(k * 1.4 + i), -80 + k * 18]); strokePts(o, 'rgba(150,140,125,0.6)', 1); }
        shade(-10, -60, -50, 40, 0.18, [-80, -120, 20, 80]);
      } },
      barbe: { parent: 'head', at: [10, -6], pts: (p) => LE_BEARD(Math.sin((p.t || 0) * 1.3) * 1.5), base: LE.blanc, seed: 8008, noRivet: true, paint: (p) => {
        const w = Math.sin((p.t || 0) * 1.3) * 1.5;
        for (let i = 0; i < 7; i++) strokePts(barbeMeche(i, w), 'rgba(150,140,125,0.6)', 1.1);
        shade(-20, 0, 24, 60, 0.18, [-50, -30, 50, 130]);
      } },
      beret: { parent: 'head', at: [-4, -88], pts: LE_BERET, base: LE.beret, seed: 8009, noRivet: true, paint: () => {
        strokePts([[-58, 10], [-20, 12], [24, 8], [40, 2]], LE.beretD, 3); strokePts([[-40, -22], [-6, -32], [26, -26]], 'rgba(255,220,200,0.18)', 2);
        hatch([[-80, -10], [50, -10], [50, 20], [-80, 20]], 0.4, 3.6, 0.3); shade(20, -30, -50, 10, 0.25, [-80, -50, 60, 20]);
      } },
      armF_up: upDef([-2, -146], LE.robe, 8010, 17),
      armF_lo: foreDef('armF_up', { base: LE.robe, skin: LE.peau, back: false, seed: 8011, cuff: LE.poignet, flare: 4 }),
    };
    Object.assign(parts, heldParts(LE.peau, 8020));
    return { hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, order: ORDER(['head'], ['cheveux', 'barbe', 'beret']) };
  }
  CH.leoLeonard = mkLeonard();
  LEO.leonardPose = function (p) {
    const q = prep(p), A = q.ang;
    if (q.ecrire != null && q.atteint == null) q.atteint = q.ecrire;
    if (q.tenu == null) q.tenu = 'rien';
    const lv = ease(clamp(q.leve || 0)), rp = ease(clamp(q.repousse || 0)), mo = ease(clamp(q.montre || 0));
    if (lv > 0) { armTo(q, 'armF', [92, -240], 'bas', lv); A.head = (A.head || 0) - 0.1 * lv; }
    if (rp > 0) { armTo(q, 'armF', [156, -150], 'bas', rp); q.tilt = (q.tilt || 0) - 0.04 * rp; A.head = (A.head || 0) - 0.08 * rp; if (rp > 0.4 && !has(q.tenu)) q.handF = q.handF || 'open'; }
    if (mo > 0) { armTo(q, 'armF', [72, -172], 'bas', mo); A.head = (A.head || 0) + 0.06 * mo; if (mo > 0.4 && !has(q.tenu)) q.handF = q.handF || 'open'; }
    A.barbe = (A.barbe || 0) - ((A.head || 0) + (q.tilt || 0)) + 0.03 * Math.sin((q.t || 0) * 1.3);
    return q;
  };
  LEO.leonard = (pose, x, y, s, o) => run(CH.leoLeonard, 'leonard', LEO.leonardPose(pose), x, y, s == null ? 0.95 : s, o);

  // =====================================================================
  // SAVANT A — XIXe, grand et maigre, chauve à couronne grise, pince-nez, redingote vert éteint, lavallière noire ; loupe
  // =====================================================================
  const SA = { red: '#4f5d47', redD: '#3e4a38', pant: '#7b7b80', pantD: '#66666b', chaus: '#1e1a1a', peau: '#e3c4a2', peauD: '#c7a383', gris: '#a9a59d', chemise: '#ece6d8', noir: '#1d1a1c' };
  const SA_TORSO = [[-12, -178], [8, -182], [16, -170], [24, -152], [29, -114], [30, -62], [28, -14], [30, 40], [33, 100, 1], [-36, 104, 1], [-35, 40], [-33, -14], [-32, -62], [-33, -114], [-30, -152], [-22, -170]];
  function mkSavantA() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: SA_TORSO, base: SA.red, seed: 8101, paint: () => {
        fillPts([[2, -188], [16, -176], [16, -160], [4, -168]], SA.chemise);
        fillPts([[13, -170], [24, -150], [28, -112], [18, -100], [12, -150]], SA.redD);
        strokePts([[22, -100], [26, -20], [30, 100]], 'rgba(20,30,20,0.55)', 1.4);
        for (const y of [-84, -56, -28, 0]) dot(25, y, 2.4, '#1c221a');
        strokePts([[-4, -6], [22, -6]], 'rgba(20,30,20,0.5)', 1.2);
        strokePts([[-30, 30], [-34, 102]], 'rgba(20,30,20,0.5)', 1.3);
        hatch([[-46, -170], [-10, -170], [-10, 106], [-46, 106]], 0.75, 4.2, 0.3); shade(36, 0, -36, 0, 0.26, [-60, -200, 60, 120]);
      } },
      legB: legDef([-6, -2], SA.pantD, SA.chaus, 8102, true, 0.85),
      legF: legDef([6, -2], SA.pant, SA.chaus, 8103, false, 0.85),
      armB_up: upDef([-10, -146], SA.redD, 8104, 14),
      armB_lo: foreDef('armB_up', { base: SA.redD, skin: SA.peauD, back: true, seed: 8105, cuff: '#cfc8b8', cuffY: 68 }),
      head: { parent: 'torso', at: [6, -172], pts: X.NAP_HEAD, base: SA.peau, seed: 8106, noRivet: true, paint: (p) => {
        const f = faceOf(p);
        fillPts([[-6, -64], [-18, -72], [-32, -66], [-38, -40], [-32, -20], [-18, -22], [-12, -34], [-8, -50]], SA.gris, 2);
        hatch([[-40, -70], [-6, -70], [-6, -20], [-40, -20]], 0.5, 3, 0.3);
        X.earPaint(-6, -44);
        strokePts([[-8, -90], [10, -93]], 'rgba(255,255,255,0.45)', 3);
        strokePts([[10, -40], [14, -22]], 'rgba(120,80,60,0.45)', 1.1);
        hatch([[-4, -40], [12, -36], [14, -14], [-6, -12]], 0.6, 3.6, 0.22);
        X.eye(f, 17, -52); X.brow(f, 17, -60, 'rgba(120,118,110,0.95)', 2.2); X.mouth(f, 27, -25);
        const lens = ell(24, -51, 5.5, 7.5, 12); fillPts(lens, 'rgba(190,225,240,0.3)', 0, 0); strokePts(lens.concat([lens[0]]), '#2a2420', 1.5);
        strokePts([[29, -53], [34, -51]], '#2a2420', 1.3); strokePts([[20, -45], [16, -28], [12, 2]], 'rgba(30,26,22,0.8)', 0.9);
        strokePts([[22, -56], [25, -57]], 'rgba(255,255,255,0.8)', 1.1);
      } },
      lavalliere: { parent: 'torso', at: [16, -166], noRivet: true, base: SA.noir, seed: 8107, pts: [[-6, -6], [6, -9], [16, -3], [18, 8], [9, 6], [5, 10], [12, 34, 1], [3, 28], [-2, 33, 1], [-2, 10], [-10, 8], [-12, -2]], paint: () => hatch(null, 0.3, 3, 0.25) },
      armF_up: upDef([-2, -146], SA.red, 8108, 14),
      armF_lo: foreDef('armF_up', { base: SA.red, skin: SA.peau, back: false, seed: 8109, cuff: SA.chemise, cuffY: 68 }),
    };
    Object.assign(parts, heldParts(SA.peau, 8120));
    return { hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-24, 18] }, order: ORDER(['head'], ['lavalliere']) };
  }
  CH.leoSavantA = mkSavantA();
  LEO.savantAPose = function (p) {
    const q = prep(p), A = q.ang;
    if (q.tenu == null) q.tenu = 'loupe';
    const pr = ease(clamp(q.presente || 0));
    if (pr > 0) { armTo(q, 'armF', [112, -24], 'bas', pr); if (q.tenu === 'carnet' && q.deuxMains == null) q.deuxMains = true; }
    if (q.regarde > 0 && q.tenu === 'loupe') { q._regarde = ease(clamp(q.regarde)); A.head = (A.head || 0) + 0.04 * q._regarde; }
    return q;
  };
  LEO.savantA = (pose, x, y, s, o) => run(CH.leoSavantA, 'savantA', LEO.savantAPose(pose), x, y, s == null ? 0.98 : s, o);

  // =====================================================================
  // SAVANT B — XIXe, petit et rond, grosses moustaches rousses, calotte de velours bleu nuit, gilet ocre, veste brune ; encre 0..1
  // =====================================================================
  const SB = { veste: '#5b4433', vesteD: '#4a372a', gilet: '#b08a3e', giletD: '#94722f', pant: '#6a5c4e', pantD: '#584c40', chaus: '#2a1e18', peau: '#e4b593', peauD: '#c8987a', roux: '#b5582a', rouxD: '#8a3f1c', calotte: '#2c3550', calotteD: '#1f2740', chemise: '#ece6d8', or: '#c9a54e' };
  const SB_TORSO = [[-14, -176], [8, -180], [18, -168], [32, -150], [44, -116], [56, -70], [60, -30], [56, 6], [44, 34], [30, 50], [-6, 56], [-40, 54, 1], [-46, 20], [-46, -40], [-44, -110], [-38, -150], [-26, -168]];
  function mkSavantB() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: SB_TORSO, base: SB.veste, seed: 8201, paint: () => {
        fillPts([[10, -172], [30, -150], [44, -116], [56, -70], [60, -30], [56, 6], [44, 34], [26, 44], [12, 30], [8, -60]], SB.gilet);
        for (let y = -160; y < 50; y += 11) strokePts([[0, y], [70, y]], 'rgba(90,60,20,0.35)', 1); for (let x = 6; x < 70; x += 11) strokePts([[x, -170], [x, 50]], 'rgba(90,60,20,0.35)', 1);
        for (const [x, y] of [[36, -116], [46, -86], [52, -56], [54, -26], [50, 4]]) dot(x, y, 2.4, '#6e5420');
        strokePts([[44, -30], [34, -14], [20, -12], [12, -20]], SB.or, 1.6); dot(12, -20, 3.4, SB.or);
        fillPts([[2, -186], [18, -176], [16, -162], [4, -168]], SB.chemise);
        fillPts([[-30, -176], [12, -172], [22, -150], [16, -120], [8, -146], [-20, -160], [-38, -150]], SB.calotte); hatch([[-40, -180], [24, -180], [24, -118], [-40, -118]], 0.5, 3, 0.25);
        strokePts([[10, -60], [12, 30], [22, 46]], 'rgba(30,20,10,0.6)', 1.4);
        hatch([[-56, -170], [-14, -170], [-14, 60], [-56, 60]], 0.75, 4.2, 0.3); shade(56, -40, -46, -40, 0.28, [-70, -200, 70, 70]);
      } },
      legB: legDef([-6, -2], SB.pantD, SB.chaus, 8202, true, 1.05),
      legF: legDef([6, -2], SB.pant, SB.chaus, 8203, false, 1.05),
      armB_up: upDef([-10, -146], SB.vesteD, 8204, 18),
      armB_lo: foreDef('armB_up', { base: SB.vesteD, skin: SB.peauD, back: true, seed: 8205, cuff: '#cfc8b8', cuffY: 68, flare: 1 }),
      head: { parent: 'torso', at: [6, -170], pts: X.NAP_HEAD, base: SB.peau, seed: 8206, noRivet: true, paint: (p) => {
        const f = faceOf(p);
        fillPts([[-8, -72], [-30, -68], [-38, -40], [-30, -18], [-14, -22], [-12, -44]], '#9a5a3a', 2);
        hatch([[-40, -72], [-8, -72], [-8, -18], [-40, -18]], 0.5, 3, 0.3);
        X.earPaint(-6, -44);
        dot(12, -34, 11, 'rgba(210,110,90,0.32)'); dot(30, -40, 5, 'rgba(200,100,80,0.3)');
        X.eye(f, 18, -53, 0.95); X.brow(f, 17, -61, SB.rouxD, 2.6); X.mouth(f, 25, -9);
      } },
      moust: { parent: 'head', at: [0, 0], noRivet: true, base: SB.roux, seed: 8207, pts: [[36, -37], [28, -35], [16, -33], [4, -31], [-6, -28], [-12, -20], [-8, -12], [0, -16], [8, -19], [16, -16], [24, -13], [32, -14], [40, -18], [42, -27]], paint: () => {
        for (let i = 0; i < 7; i++) strokePts([[38 - i * 6, -35], [36 - i * 6.5, -16]], 'rgba(90,40,15,0.55)', 1);
        strokePts([[38, -32], [16, -30], [-4, -24]], 'rgba(255,200,150,0.3)', 1.2);
      } },
      calotte: { parent: 'head', at: [0, 0], noRivet: true, base: SB.calotte, seed: 8208, pts: [[-36, -60], [-34, -82], [-22, -97], [-2, -103], [14, -100], [26, -91], [30, -80], [18, -78], [0, -78], [-20, -70]], paint: () => {
        strokePts([[-34, -66], [-18, -74], [2, -80], [28, -82]], SB.calotteD, 3); strokePts([[-20, -92], [0, -99], [16, -96]], 'rgba(200,210,255,0.22)', 2.2);
        hatch(null, 0.5, 3.2, 0.25, 1, P.encre, [-40, -110, 40, -60]);
      }, extra: () => { if (SIL()) return; dot(-2, -104, 4, SB.calotteD); dot(-3, -105, 1.5, 'rgba(200,210,255,0.4)'); } },
      armF_up: upDef([-2, -146], SB.veste, 8209, 18),
      armF_lo: foreDef('armF_up', { base: SB.veste, skin: SB.peau, back: false, seed: 8210, cuff: SB.chemise, cuffY: 68, flare: 1 }),
    };
    Object.assign(parts, heldParts(SB.peau, 8220));
    return { hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-28, 18] }, order: ORDER(['head', 'moust', 'calotte'], []) };
  }
  CH.leoSavantB = mkSavantB();
  LEO.savantBPose = function (p) {
    const q = prep(p), A = q.ang;
    if (q.tenu == null) q.tenu = 'rien';
    const pr = ease(clamp(q.presente || 0)), dg = ease(clamp(q.doigts || 0));
    if (pr > 0) { armTo(q, 'armF', [112, -24], 'bas', pr); if (q.tenu === 'carnet' && q.deuxMains == null) q.deuxMains = true; }
    if (dg > 0) { armTo(q, 'armF', [86, -204], 'bas', dg); A.head = (A.head || 0) + 0.05 * dg; if (dg > 0.4 && !has(q.tenu)) q.handF = q.handF || 'open'; }
    return q;
  };
  LEO.savantB = (pose, x, y, s, o) => run(CH.leoSavantB, 'savantB', LEO.savantBPose(pose), x, y, s == null ? 0.85 : s, o);

  // =====================================================================
  // ACCESSOIRES SEULS — M.puppet à une pièce invisible (ombre portée possible)
  // =====================================================================
  const accDefs = {};
  function accDef(name, fn) { return accDefs[name] || (accDefs[name] = { hipY: 0, handLen: 10, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => fn(p.o) } }, order: ['o'] }); }
  function acc(name, draw, base, x, y, s, o) {
    o = Object.assign({}, o || {});
    const def = accDef(name, (oo) => { const c = cx_(); c.save(); c.translate(-base[0], -base[1]); draw(oo); c.restore(); });
    const r = M.puppet(def, { o, tilt: o.rot || 0 }, x, y, s, { dir: o.dir || 1, rod: false, slot: o.slot != null ? o.slot : y + 6 * s, floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
    if (o._tete) r.tete = r.w('o', o._tete[0] - base[0], o._tete[1] - base[1]);
    return r;
  }
  for (const n of ['plume', 'loupe', 'miroir', 'carnet', 'encrier']) LEO[n] = (x, y, s, o) => acc(n, OBJ[n].draw, OBJ[n].base, x, y, s == null ? 1 : s, o);
  LEO.miroirMural = (x, y, s, o) => acc('miroirMural', drawMiroirMural, [0, 0], x, y, s == null ? 1 : s, o);
  LEO.portrait = (x, y, s, o) => acc('portrait', drawPortrait, [0, 0], x, y, s == null ? 1 : s, o);
  LEO.grandePage = (x, y, s, o) => acc('grandePage', drawGrandePage, [0, 0], x, y, s == null ? 1 : s, o);
  LEO.mainGauche = function (x, y, s, o) {
    o = o || {}; s = s == null ? 1.5 : s;
    const dir = o.dir || 1, rot = o.rot || 0, cs = Math.cos(rot), sn = Math.sin(rot);
    const Lp = MG.fin, ex = x + dir * s * (Lp[0] * cs - Lp[1] * sn), ey = y + s * (Lp[0] * sn + Lp[1] * cs);
    const ty = o.tigeY != null ? o.tigeY : M.ST.slotF;
    const c = cx_();
    if (ty > ey) {                                                            // tige de bois verticale jusqu'à la trappe
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
      if (!SIL()) { c.fillStyle = '#5b3d22'; c.fillRect(ex - 5 * s, ey, 10 * s, ty - ey); c.fillStyle = '#c8a06a'; c.fillRect(ex - 2 * s, ey, 3 * s, ty - ey); }
      c.restore();
    }
    return acc('mainGauche', drawMainGauche, [0, 0], x, y, s, Object.assign({}, o, { cast: null }));
  };
  LEO.pageTete = function (x, y, s, o) {                                     // point écran de la tête de la ligne fraîche, sans dessiner
    o = o || {}; s = s == null ? 1 : s;
    const nOld = Math.round(clamp(o.lignes == null ? 0 : o.lignes) * GP.n), li = o.ligne != null ? o.ligne : Math.min(GP.n - 1, nOld), f = clamp(o.fraiche || 0), L = GLIGNES[li].len * GP.sc;
    const lx = o.sens === 'rg' ? GP.x0 + L - L * f : GP.x0 + L * f, ly = GP.y0 + li * GP.dy - 6, rot = o.rot || 0;
    return [x + s * (lx * Math.cos(rot) - ly * Math.sin(rot)), y + s * (lx * Math.sin(rot) + ly * Math.cos(rot))];
  };

  // =====================================================================
  // DÉCORS — pré-rendus dans LEO.init() ; LEO.atelier(t, up, o), LEO.cabinet(t, up, o)
  // =====================================================================
  const AT = { lutrin: { x: 360 }, carnet: { x: 360, y: 1395 - 274, s: 1 }, table: { x: 868, y: 1395 - 236 }, machine: { x: 800, y: 600 }, fenetre: { x: 560, y0: 392, y1: 880 }, chandelle: { x: 972, y: 1395 - 236 - 112 } };
  const CAB = { miroir: { x: 560, y: 760 }, portrait: { x: 846, y: 640 }, bureau: { x: 846, y: 1395 - 236 }, lampe: { x: 942, y: 1395 - 236 - 150 } };
  LEO.AT = AT; LEO.CAB = CAB;
  function speckle(c, x0, y0, w, h, n, seed, col) { const R = M.rng(seed); for (let i = 0; i < n; i++) { c.fillStyle = col.replace('A', (0.03 + R() * 0.06).toFixed(3)); c.beginPath(); c.ellipse(x0 + R() * w, y0 + R() * h, 10 + R() * 50, 6 + R() * 30, R() * 3, 0, TAU); c.fill(); } }
  function makeAtelierFond() {
    const W = 1080, H = M.ST.back + 5;
    return M.pre(W, H, (c) => {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#6e4f30'); g.addColorStop(0.3, '#a9804c'); g.addColorStop(1, '#b88d57');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      speckle(c, 0, 150, W, H - 150, 260, 41, 'rgba(255,235,200,A)'); speckle(c, 0, 150, W, H - 150, 200, 42, 'rgba(70,40,20,A)');
      M.hatch([[0, 150], [W, 150], [W, 420], [0, 420]], 0.2, 6, 0.12, 1, P.encre, [0, 150, W, 420]);
      // fenêtre en arc : embrasure, vue de Toscane
      const F = AT.fenetre, hw = 165, ys = 560;
      const arch = (m) => [[F.x - hw - m, F.y1 + m * 0.4]].concat(ep(F.x, ys, hw + m, ys - F.y0 + m, 20, PI, TAU), [[F.x + hw + m, F.y1 + m * 0.4]]);
      M.piece(arch(30), '#c9ad7f', () => { M.hatch(null, 0.8, 5, 0.18, 1, P.encre, [F.x - 220, F.y0 - 60, F.x + 220, F.y1 + 40]); M.shade(F.x, F.y0, F.x, F.y1, 0.2, [F.x - 220, F.y0 - 60, F.x + 220, F.y1 + 40]); }, { seed: 4101 });
      c.save(); M.path(arch(0), 4102, 0.3); c.clip();
      const sky = c.createLinearGradient(0, F.y0, 0, F.y1); sky.addColorStop(0, '#9fb4c2'); sky.addColorStop(0.65, '#e3d9b6'); sky.addColorStop(1, '#efdcae');
      c.fillStyle = sky; c.fillRect(F.x - 200, F.y0 - 10, 400, F.y1 - F.y0 + 20);
      const hill = (yb, amp, ph, col, seed) => { const pts = [[F.x - 210, F.y1 + 20]]; for (let x = -210; x <= 210; x += 14) pts.push([F.x + x, yb - amp * (0.5 + 0.5 * Math.sin(x * 0.012 + ph)) - 10 * M.noise(x * 0.05, seed)]); pts.push([F.x + 210, F.y1 + 20]); M.fillPts(pts, col, seed, 0.4); return pts; };
      hill(720, 70, 0.5, '#9aa3a2', 1); hill(770, 60, 2.2, '#8f9468', 2);
      const h3 = hill(820, 50, 4.0, '#a39a5c', 3);
      M.hatch([[F.x - 210, 780], [F.x + 210, 780], [F.x + 210, F.y1], [F.x - 210, F.y1]], 0.15, 5, 0.18, 1, '60,50,20', [F.x - 210, 760, F.x + 210, F.y1]);
      hill(860, 30, 1.0, '#8c844c', 4);
      for (const [x, y, h] of [[F.x - 120, 790, 70], [F.x - 96, 800, 54], [F.x + 60, 760, 60], [F.x + 84, 772, 46], [F.x + 128, 812, 74], [F.x - 30, 720, 34]]) {
        M.fillPts([[x - 7, y], [x - 6, y - h * 0.5], [x, y - h], [x + 6, y - h * 0.5], [x + 7, y]], '#2f3d2a', x, 0.3);
      }
      M.fillPts([[F.x - 30, 766], [F.x - 30, 748], [F.x - 14, 740], [F.x + 2, 748], [F.x + 2, 766]], '#d9c49a', 9, 0.2); M.fillPts([[F.x - 34, 750], [F.x - 14, 736], [F.x + 6, 750]], '#9a4a32', 10, 0.2);
      c.restore();
      M.piece([[F.x - 7, F.y0 + 2], [F.x + 7, F.y0 + 2], [F.x + 7, F.y1], [F.x - 7, F.y1]], '#5b3d22', null, { seed: 4103 });
      M.piece([[F.x - hw - 10, ys - 6], [F.x + hw + 10, ys - 6], [F.x + hw + 10, ys + 6], [F.x - hw - 10, ys + 6]], '#5b3d22', null, { seed: 4104 });
      M.piece([[F.x - hw - 40, F.y1], [F.x + hw + 40, F.y1], [F.x + hw + 30, F.y1 + 22], [F.x - hw - 30, F.y1 + 22]], '#8a6a44', () => M.hatch(null, 0.1, 4, 0.25), { seed: 4105 });
      // poutres
      M.piece([[0, 150], [W, 150], [W, 214], [0, 214]], '#4a3220', () => { M.hatch(null, 0.05, 5, 0.3, 1, P.encre, [0, 140, W, 220]); }, { seed: 4106 });
      for (let x = 60; x < W; x += 190) M.piece([[x, 214], [x + 44, 214], [x + 44, 246], [x, 246]], '#3f2a1a', null, { seed: 4107 + x });
      // croquis épinglés au mur (sans aucun signe)
      for (const [x, y, r, sd] of [[150, 520, -0.06, 1], [250, 610, 0.05, 2]]) {
        c.save(); c.translate(x, y); c.rotate(r);
        M.piece([[-50, -36, 1], [50, -36, 1], [50, 36, 1], [-50, 36, 1]], '#e9dcb8', () => { if (sd === 1) { c.save(); c.scale(0.55, 0.55); drawStrokes(CRO.machine, 1, SEPIA, 1.2); c.restore(); } else { c.save(); c.scale(0.5, 0.5); drawStrokes(CRO.corps, 1, SEPIA, 1.2); c.restore(); } }, { seed: 4120 + sd });
        M.dot(0, -32, 3, '#6b4a2a'); c.restore();
      }
      // plinthe
      M.fillPts([[0, H - 60, 1], [W, H - 60, 1], [W, H, 1], [0, H, 1]], 'rgba(60,36,20,0.35)', 0, 0);
    });
  }
  function makeLutrin() {
    const cv = M.cutFlat(460, 430, 230, 422, () => {
      M.piece([[-110, 0, 1], [110, 0, 1], [96, -16], [12, -24], [12, -124], [-12, -124], [-12, -24], [-96, -16]], '#5b3d22', () => { M.hatch(null, 1.4, 4, 0.25); }, { seed: 4201 });
      M.piece([[-18, -130, 1], [18, -130, 1], [24, -120, 1], [-24, -120, 1]], '#4a3220', null, { seed: 4202 });
      M.piece([[-212, -410, 1], [212, -410, 1], [216, -138, 1], [-216, -138, 1]], '#7a5232', () => {
        for (let x = -200; x <= 200; x += 40) M.strokePts([[x, -406], [x + 4, -140]], 'rgba(40,20,10,0.25)', 1);
        M.shade(0, -410, 0, -138, 0.25, [-220, -420, 220, -130]);
      }, { seed: 4203 });
      M.piece([[-222, -142, 1], [222, -142, 1], [222, -124, 1], [-222, -124, 1]], '#4a3220', () => M.strokePts([[-220, -140], [220, -140]], 'rgba(255,220,180,0.25)', 1.2), { seed: 4204 });
    }); cv.padB = 8; return M.withShadow(cv, 8);
  }
  function makeTable() {
    const cv = M.cutFlat(420, 420, 210, 410, () => {
      for (const x of [-130, 130]) M.piece([[x - 10, 0, 1], [x + 10, 0, 1], [x + 9, -226, 1], [x - 9, -226, 1]], '#4e3420', () => M.hatch(null, 1.5, 4, 0.25), { seed: 4301 + x });
      M.piece([[-150, -60, 1], [150, -60, 1], [150, -48, 1], [-150, -48, 1]], '#4e3420', null, { seed: 4303 });
      M.piece([[-170, -240, 1], [170, -240, 1], [170, -222, 1], [-170, -222, 1]], '#6b4a2c', () => M.strokePts([[-168, -238], [168, -238]], 'rgba(255,220,180,0.3)', 1.2), { seed: 4304 });
      // rouleaux, livres, chandelier (la flamme est animée dans LEO.atelier)
      for (const [x, y, l, r] of [[-110, -254, 110, 0.0], [-60, -276, 96, -0.12], [-20, -254, 80, 0.06]]) {
        const cx = M.ctx(); cx.save(); cx.translate(x, y); cx.rotate(r);
        M.piece([[-l / 2, -12], [l / 2, -12], [l / 2 + 4, 0], [l / 2, 12], [-l / 2, 12]], '#e6d7b3', () => { M.shade(0, -12, 0, 12, 0.3, [-l, -20, l, 20]); }, { seed: 4310 + x });
        M.strokePts(ep(l / 2, 0, 4, 10, 8, -PI / 2, PI * 1.3), 'rgba(90,60,30,0.6)', 1.1); cx.restore();
      }
      M.piece([[30, -240, 1], [110, -240, 1], [110, -262, 1], [30, -262, 1]], '#6a2e28', () => M.fillPts([[30, -246], [110, -246], [110, -256], [30, -256]], '#e6d7b3'), { seed: 4320 });
      M.piece([[40, -262, 1], [100, -262, 1], [100, -278, 1], [40, -278, 1]], '#2f4a3a', () => M.fillPts([[40, -266], [100, -266], [100, -274], [40, -274]], '#e6d7b3'), { seed: 4321 });
      M.piece([[88, -240, 1], [120, -240, 1], [112, -248], [106, -256], [106, -300], [102, -306], [106, -310], [102, -300], [102, -256], [96, -248]], OR.orD, null, { seed: 4322 });
      M.piece([[96, -306], [112, -306], [112, -346], [96, -346]], '#eee6cf', () => M.shade(112, 0, 96, 0, 0.3, [90, -350, 120, -300]), { seed: 4323 });
    }); cv.padB = 10; return M.withShadow(cv, 8);
  }
  function makeMachine() {
    const cv = M.cutFlat(460, 240, 230, 230, () => {
      for (const sg of [-1, 1]) {
        const root = [8 * sg, -150], ends = [[210, -196], [196, -126], [160, -80], [110, -50], [50, -36]].map(([x, y]) => [x * sg, y]);
        const memb = [root].concat(qbez(root, [100 * sg, -230], ends[0], 8).slice(1));
        for (let i = 0; i < ends.length - 1; i++) { const a = ends[i], b = ends[i + 1]; memb.push(...qbez(a, [lerp((a[0] + b[0]) / 2, root[0], 0.28), lerp((a[1] + b[1]) / 2, root[1], 0.28)], b, 6).slice(1)); }
        M.piece(memb, '#dccaa0', () => { for (const e of ends) M.strokePts([root, e], '#6b4a2a', 3); M.hatch(null, 0.9, 6, 0.14); M.shade(root[0], root[1], ends[2][0], ends[2][1], 0.2, [-240, -240, 240, 0]); }, { seed: 4401 + sg });
      }
      M.piece([[-14, -170], [14, -170], [20, -40], [8, -10], [-8, -10], [-20, -40]], '#7a5232', () => M.hatch(null, 1.5, 4, 0.25), { seed: 4403 });
      M.piece([[-50, -60], [50, -60], [44, -50], [-44, -50]], '#5b3d22', null, { seed: 4404 });
      M.piece(ell(0, -100, 14, 14, 14), '#8a6a44', () => { for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; M.strokePts([[0, -100], [Math.cos(a) * 12, -100 + Math.sin(a) * 12]], 'rgba(40,20,10,0.6)', 1.2); } }, { seed: 4405 });
    }); cv.padB = 10; return M.withShadow(cv, 8);
  }
  function makeCabinet() {
    const W = 1080, H = M.ST.back + 5;
    const cv = M.pre(W, H, (c) => {
      c.fillStyle = '#2f4636'; c.fillRect(0, 0, W, H);
      for (let x = 0; x < W; x += 54) { c.fillStyle = 'rgba(20,34,26,0.35)'; c.fillRect(x, 0, 22, H); }
      for (let y = 180, j = 0; y < 1140; y += 64, j++) for (let x = (j % 2) * 27; x < W; x += 54) {   // damas : losanges et points (aucun signe)
        M.fillPts([[x, y - 12, 1], [x + 8, y, 1], [x, y + 12, 1], [x - 8, y, 1]], 'rgba(120,150,110,0.22)', 0, 0); M.dot(x, y + 22, 2.2, 'rgba(160,180,130,0.22)');
      }
      speckle(c, 0, 150, W, 1000, 120, 51, 'rgba(0,0,0,A)');
      M.piece([[0, 150, 1], [W, 150, 1], [W, 196, 1], [0, 196, 1]], '#5a3f2a', () => { M.strokePts([[0, 188], [W, 188]], 'rgba(255,220,170,0.3)', 1.5); for (let x = 10; x < W; x += 24) M.dot(x, 172, 2.4, 'rgba(30,18,10,0.5)'); }, { seed: 4501 });
      M.piece([[0, 1130, 1], [W, 1130, 1], [W, H, 1], [0, H, 1]], '#5e4330', () => {
        M.fillPts([[0, 1130, 1], [W, 1130, 1], [W, 1146, 1], [0, 1146, 1]], '#4a3324');
        for (let x = 30; x < W; x += 170) { M.strokePts([[x, 1170, 1], [x + 140, 1170, 1], [x + 140, 1360, 1], [x, 1360, 1]], 'rgba(30,18,10,0.55)', 1.6, true); M.strokePts([[x + 2, 1172], [x + 138, 1172]], 'rgba(255,220,170,0.25)', 1); }
      }, { seed: 4502 });
      // bibliothèque
      M.piece([[140, H, 1], [140, 560, 1], [430, 560, 1], [430, H, 1]], '#4a3122', () => {
        const R = M.rng(61), cols = ['#6a2e28', '#2f4a3a', '#7a5a2a', '#3a3f5a', '#5b3d22', '#8a6a3a', '#4e2a3a'];
        for (let sh = 0; sh < 6; sh++) {
          const yb = 690 + sh * 124; M.fillPts([[150, yb - 116, 1], [420, yb - 116, 1], [420, yb, 1], [150, yb, 1]], '#24170f');
          let x = 156; while (x < 412) { const w = 12 + R() * 14, h = 70 + R() * 38, col = cols[Math.floor(R() * cols.length)], lean = R() < 0.1 ? 0.12 : 0;
            if (x + w > 414) break; const pts = [[x, yb, 1], [x + w, yb, 1], [x + w + lean * h, yb - h, 1], [x + lean * h, yb - h, 1]]; M.fillPts(pts, col, 0, 0);
            M.strokePts([[x + 2 + lean * h * 0.8, yb - h * 0.8], [x + w - 2 + lean * h * 0.8, yb - h * 0.8]], 'rgba(220,190,120,0.55)', 1.4); M.strokePts([[x + 2 + lean * h * 0.2, yb - h * 0.2], [x + w - 2 + lean * h * 0.2, yb - h * 0.2]], 'rgba(220,190,120,0.45)', 1.2);
            x += w + 1 + (lean ? 6 : 0); }
          M.fillPts([[146, yb, 1], [424, yb, 1], [424, yb + 8, 1], [146, yb + 8, 1]], '#5b3d22');
        }
        M.shade(140, 0, 430, 0, 0.25, [130, 540, 440, H]);
      }, { seed: 4503 });
      M.piece([[124, 560, 1], [446, 560, 1], [446, 540, 1], [124, 540, 1]], '#3a2618', null, { seed: 4504 });
      // bureau + livres empilés (la flamme de la lampe est animée)
      const B = CAB.bureau;
      M.piece([[B.x - 150, H, 1], [B.x - 150, B.y, 1], [B.x + 150, B.y, 1], [B.x + 150, H, 1]], '#5b3d22', () => {
        for (const yy of [B.y + 40, B.y + 110]) { M.strokePts([[B.x - 130, yy, 1], [B.x - 20, yy, 1], [B.x - 20, yy + 56, 1], [B.x - 130, yy + 56, 1]], 'rgba(30,18,10,0.6)', 1.6, true); M.dot(B.x - 75, yy + 28, 3.4, OR.or); }
        M.hatch(null, 1.4, 4.5, 0.2); M.shade(B.x + 150, 0, B.x - 150, 0, 0.25, [B.x - 160, B.y - 10, B.x + 160, H]);
      }, { seed: 4505 });
      M.piece([[B.x - 162, B.y, 1], [B.x + 162, B.y, 1], [B.x + 162, B.y + 16, 1], [B.x - 162, B.y + 16, 1]], '#3e2a1a', () => M.strokePts([[B.x - 160, B.y + 2], [B.x + 160, B.y + 2]], 'rgba(255,220,170,0.3)', 1.2), { seed: 4506 });
      for (const [i, w, col] of [[0, 120, '#6a2e28'], [1, 104, '#3a3f5a'], [2, 112, '#2f4a3a'], [3, 92, '#7a5a2a']]) { const y = B.y - i * 22; M.piece([[B.x - 120 - w / 2 + 50, y, 1], [B.x - 120 + w / 2 + 50, y, 1], [B.x - 120 + w / 2 + 50, y - 22, 1], [B.x - 120 - w / 2 + 50, y - 22, 1]], col, () => M.fillPts([[B.x - 120 + w / 2 + 44, y - 4], [B.x - 120 + w / 2 + 50, y - 4], [B.x - 120 + w / 2 + 50, y - 18], [B.x - 120 + w / 2 + 44, y - 18]], '#e6d7b3'), { seed: 4510 + i }); }
      const Lp = CAB.lampe;
      M.piece([[Lp.x - 34, B.y, 1], [Lp.x + 34, B.y, 1], [Lp.x + 22, B.y - 14], [Lp.x + 8, B.y - 20], [Lp.x + 8, B.y - 60], [Lp.x + 26, B.y - 74], [Lp.x + 26, B.y - 92], [Lp.x - 26, B.y - 92], [Lp.x - 26, B.y - 74], [Lp.x - 8, B.y - 60], [Lp.x - 8, B.y - 20], [Lp.x - 22, B.y - 14]], OR.or, () => M.shade(Lp.x + 30, 0, Lp.x - 30, 0, 0.3, [Lp.x - 40, B.y - 100, Lp.x + 40, B.y]), { seed: 4520 });
      // portrait : clou (le tableau est dessiné par LEO.cabinet / LEO.portrait)
      M.dot(CAB.portrait.x, CAB.portrait.y - 176, 3, '#1a1410');
    });
    return cv;
  }
  function flamme(x, y, t, k) {
    const c = cx_(), f = 1 + 0.12 * Math.sin(t * 13) + 0.08 * Math.sin(t * 7.3), sw = 2.5 * Math.sin(t * 5.1);
    c.save(); const g = c.createRadialGradient(x, y - 10, 2, x, y - 10, 90 * k); g.addColorStop(0, 'rgba(255,210,120,0.35)'); g.addColorStop(1, 'rgba(255,190,90,0)'); c.fillStyle = g; c.fillRect(x - 100 * k, y - 110 * k, 200 * k, 200 * k);
    c.beginPath(); c.moveTo(x - 6 * k, y); c.quadraticCurveTo(x - 7 * k, y - 12 * k * f, x + sw, y - 26 * k * f); c.quadraticCurveTo(x + 7 * k, y - 12 * k * f, x + 6 * k, y); c.closePath(); c.fillStyle = '#ffcf6a'; c.fill();
    c.beginPath(); c.ellipse(x, y - 6 * k, 2.6 * k, 6 * k, 0, 0, TAU); c.fillStyle = '#fff4d0'; c.fill(); c.restore();
  }
  LEO.init = function () {
    LEO.K = { atelier: makeAtelierFond(), lutrin: makeLutrin(), table: makeTable(), machine: makeMachine(), cabinet: makeCabinet() };
    return LEO.K;
  };
  // atelier : up = décalage vers le haut (px) ; o.lutrin (true), o.table (true), o.machine (true), o.carnet = options du carnet posé sur le lutrin (null = pas de carnet), o.cast
  LEO.atelier = function (t, up, o) {
    o = o || {}; up = up || 0; const K = LEO.K, c = cx_(), cast = o.cast || { dx: 14, dy: 6, a: 0.3 };
    c.save(); c.translate(0, -up);
    c.drawImage(K.atelier, 0, 0);
    if (o.machine !== false) M.hung(K.machine, AT.machine.x, AT.machine.y, t, { f: 0.7, amp: 0.035, cast });
    if (o.table !== false) { M.flat(K.table, AT.table.x, M.ST.back, { cast }); flamme(AT.chandelle.x, AT.chandelle.y, t, 1); }
    let r = null;
    if (o.lutrin !== false) { M.flat(K.lutrin, AT.lutrin.x, M.ST.back, { cast }); if (o.carnet) r = LEO.carnet(AT.carnet.x, AT.carnet.y, AT.carnet.s, Object.assign({ t }, o.carnet)); }
    c.restore();
    return r;
  };
  // cabinet : up = remontée vers les cintres (0 = en place ; ≥ 1300 = disparu) ; o.portrait (true), o.clin, o.reflet (miroir mural)
  LEO.cabinet = function (t, up, o) {
    o = o || {}; up = up || 0; const K = LEO.K, c = cx_();
    c.save(); c.translate(0, -up);
    if (up > 0) { c.strokeStyle = 'rgba(20,15,10,0.6)'; c.lineWidth = 2; c.beginPath(); for (const x of [120, 960]) { c.moveTo(x, 150); c.lineTo(x, -400); } c.stroke(); }
    c.drawImage(K.cabinet, 0, 0);
    if (up > 0) { c.fillStyle = '#3a2618'; c.fillRect(0, M.ST.back - 8, 1080, 14); }
    LEO.miroirMural(CAB.miroir.x, CAB.miroir.y, 1, { reflet: o.reflet, t });
    if (o.portrait !== false) LEO.portrait(CAB.portrait.x, CAB.portrait.y, 1, { clin: o.clin || 0 });
    flamme(CAB.lampe.x, CAB.lampe.y + 50, t, 1.1);
    c.save(); c.beginPath(); c.ellipse(CAB.lampe.x, CAB.lampe.y + 40, 18, 30, 0, 0, TAU); c.fillStyle = 'rgba(235,240,230,0.35)'; c.fill(); c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 1.2; c.stroke(); c.restore();
    c.restore();
  };
})();

// --- Décor partagé de la vidéo (ex-M.dec.miroirSuspendu, plan 1) : LEO.miroirSuspendu(t, up, reflet, o)
M.leo.miroirSuspendu = function (t, up, reflet, o) {
  o = o || {};
  const LEO = M.leo, c = M.ctx(), x0 = o.x == null ? 360 : o.x, y0 = o.y == null ? 800 : o.y;
  const yc = y0 - (up || 0), phi = o.phi || 0, HOOK = 118;
  if (yc - HOOK < -4) return null;
  const sn = Math.sin(phi), cs = Math.cos(phi);
  const cx = x0 + yc * Math.tan(phi);                       // le fil part d'un point fixe (x0, 0) des cintres
  const hx = cx - HOOK * sn, hy = yc - HOOK * cs;           // anneau d'accroche, au sommet du cadre
  c.save();
  c.strokeStyle = 'rgba(38,26,16,0.8)'; c.lineWidth = 2.2; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x0, 0); c.lineTo(hx, hy); c.stroke();
  c.strokeStyle = '#b08a3e'; c.lineWidth = 3.2; c.beginPath(); c.arc(hx, hy - 3, 6, 0, M.TAU); c.stroke();
  c.restore();
  LEO.miroir(cx, yc, 1, { reflet: reflet === undefined ? true : reflet, t, rot: -phi, cast: o.cast });
  return [cx, yc];
};
