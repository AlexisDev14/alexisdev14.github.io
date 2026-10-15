// persos.js — « Manneken-Pis, mille costumes » : marionnettes, accessoires et décors PROPRES À CETTE VIDÉO. Espace M.man (alias MAN).
// Appeler MAN.init() dans S.init (pré-rendus MAN.K.rue et MAN.K.musee). Mode d'emploi : persos.md (ne pas lire ce fichier en entier).
// Aucun texte, lettre ni chiffre. Déterministe (hash, aucun Math.random) : tout reste une fonction pure de t.
(function () {
  'use strict';
  const X = M.X, P = M.P, TAU = M.TAU, PI = Math.PI, D = 180 / PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, hash } = M;
  const MAN = (M.man = {});
  const CH = M.chars;
  const cx_ = () => M.ctx();
  const SIL = () => M._sil();
  const OFFP = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];

  // ------------------------------------------------------------ géométrie
  function ep(cx, cy, rx, ry, n, a0, a1) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; }
  function ell(cx, cy, rx, ry, n) { const o = ep(cx, cy, rx, ry, n || 16, 0, TAU); o.pop(); return o; }
  const mp = (m, p) => [m.a * p[0] + m.c * p[1] + m.e, m.b * p[0] + m.d * p[1] + m.f];
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
  function qbez(p0, p1, p2, n) { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]); } return o; }
  const normA = (a) => { while (a > PI) a -= TAU; while (a < -PI) a += TAU; return a; };
  const rect = (x0, y0, x1, y1) => [[x0, y0, 1], [x1, y0, 1], [x1, y1, 1], [x0, y1, 1]];
  const pc = (pts, base, paint, seed, o) => piece(pts, base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));
  MAN.geo = { ep, ell, ribbon, qbez, rect };

  // =====================================================================
  // HABITS — douze costumes, chacun d'une couleur ENTIÈRE différente (c = couleur, d = ombre, a = accent)
  // =====================================================================
  const HABITS = {
    dracula:   { c: '#1f1c23', d: '#121016', a: '#8e2329', forme: 'cape' },
    noel:      { c: '#a8322b', d: '#7f241f', a: '#eee8da', forme: 'manteau' },
    sax:       { c: '#c49b3c', d: '#977428', a: '#3a2c1c', forme: 'veste' },
    smoking:   { c: '#26252c', d: '#151419', a: '#f1ece0', forme: 'queue' },
    cowboy:    { c: '#a8723a', d: '#7f5428', a: '#4e321a', forme: 'gilet' },
    marin:     { c: '#2c4a76', d: '#1f3658', a: '#ece6d6', forme: 'raye' },
    chasseur:  { c: '#4f6b3a', d: '#3a5029', a: '#c9a54b', forme: 'veste' },
    brique:    { c: '#c8662d', d: '#9c4c1f', a: '#2a2420', forme: 'manteau' },
    rose:      { c: '#cc8d99', d: '#a96f7b', a: '#f2e8de', forme: 'cape' },
    turquoise: { c: '#3a8a84', d: '#2a6863', a: '#e9dfc4', forme: 'veste' },
    violet:    { c: '#5a4c8e', d: '#41366c', a: '#d9c27a', forme: 'manteau' },
    ivoire:    { c: '#ebe4d1', d: '#cbc2ab', a: '#2c2b33', forme: 'veste' },
  };
  MAN.HABITS = Object.keys(HABITS);
  MAN.HABIT_COL = HABITS;

  // cintre seul : origine = haut du crochet ; barre à y 30 ; habit jusqu'à y ≈ 200
  function drawCintre(seed) {
    pc(ribbon([[0, 32], [0, 14], [2, 5], [-3, -1], [-10, 0], [-13, 7]], 4, 3.4), '#b08d45', null, seed, { drop: false });
    pc([[-54, 42], [-6, 26], [6, 26], [54, 42], [52, 48, 1], [-52, 48, 1]], '#7a5532', () => strokePts([[-48, 42], [48, 42]], 'rgba(255,230,190,0.35)', 1), seed + 1);
  }
  function drawHabit(o) {
    const H = HABITS[o.habit] || HABITS.dracula, sd = 7000 + MAN.HABITS.indexOf(o.habit) * 17;
    const c = cx_(); c.save(); c.rotate(o.swing || 0);
    drawCintre(sd);
    const hb = (pts, base, paint, k) => pc(pts, base, paint, sd + 2 + (k || 0));
    const sleeves = (col, cuff, len) => {
      for (const sx of [-1, 1]) hb([[sx * 46, 46], [sx * 60, 58], [sx * 66, len], [sx * 50, len + 4], [sx * 46, 72]], col, () => {
        if (cuff) fillPts([[sx * 70, len - 14], [sx * 46, len - 14], [sx * 46, len + 6], [sx * 70, len + 6]], cuff);
        hatch(null, 0.9, 3.6, 0.25);
      }, sx + 3);
    };
    const f = H.forme;
    if (f === 'cape') {
      hb([[-16, 34], [16, 34], [32, 46], [82, 196, 1], [-82, 196, 1], [-32, 46]], H.c, () => {
        fillPts([[14, 36], [32, 46], [82, 196], [60, 196], [22, 52]], H.a);                          // doublure
        for (const x of [-40, -12, 18]) strokePts([[x * 0.4, 50], [x, 194]], 'rgba(0,0,0,0.35)', 1.3);
        hatch(null, 0.8, 3.8, 0.25); shade(60, 0, -60, 0, 0.3, [-90, 20, 90, 200]);
      });
      for (const sx of [-1, 1]) hb([[sx * 18, 36], [sx * 36, 4, 1], [sx * 34, 40]], sx < 0 ? H.c : H.a, null, 6 + sx);   // col haut
    } else if (f === 'manteau') {
      sleeves(H.c, H.a, 160);
      hb([[-18, 32], [18, 32], [48, 44], [54, 60], [56, 200, 1], [-56, 200, 1], [-54, 60], [-48, 44]], H.c, () => {
        fillPts(rect(-58, 184, 58, 202), H.a); fillPts(rect(-6, 30, 8, 202), H.a);                    // bordures
        fillPts(rect(-58, 112, 58, 124), o.habit === 'noel' ? '#1f1b1b' : H.d); if (o.habit === 'noel') { fillPts(rect(-9, 110, 9, 126), '#c9a54b'); fillPts(rect(-4, 114, 4, 122), '#1f1b1b'); }
        hatch(null, 0.8, 4, 0.24); shade(56, 0, -56, 0, 0.3, [-60, 20, 60, 210]);
      });
    } else if (f === 'queue') {
      sleeves(H.c, H.a, 150);
      hb([[-18, 32], [18, 32], [50, 44], [52, 60], [48, 118], [22, 124], [12, 202, 1], [-12, 202, 1], [-22, 124], [-48, 118], [-52, 60], [-50, 44]], H.c, () => {
        fillPts([[-16, 32], [16, 32], [0, 112]], H.a);                                                // plastron
        fillPts([[-10, 40], [0, 46], [10, 40], [10, 52], [0, 48], [-10, 52]], '#111014');            // nœud
        fillPts([[16, 34], [30, 44], [6, 100]], H.d); fillPts([[-16, 34], [-30, 44], [-6, 100]], H.d); // revers satin
        hatch(null, 0.8, 4, 0.2);
      });
    } else if (f === 'gilet') {
      hb([[-16, 32], [16, 32], [46, 46], [48, 150, 1], [4, 160], [-4, 160], [-48, 150, 1], [-46, 46]], H.c, () => {
        for (let x = -44; x <= 44; x += 6) strokePts([[x, 146], [x + 1, 164]], H.a, 2);               // franges
        dot(-20, 80, 3, H.a); dot(-20, 104, 3, H.a); dot(20, 80, 3, H.a); dot(20, 104, 3, H.a);
        hatch(null, 0.8, 3.6, 0.26);
      });
    } else if (f === 'raye') {
      sleeves(H.c, H.a, 130);
      hb([[-18, 32], [18, 32], [50, 44], [52, 60], [50, 170, 1], [-50, 170, 1], [-52, 60], [-50, 44]], H.c, () => {
        for (let y = 66; y < 170; y += 16) fillPts(rect(-56, y, 56, y + 7), H.a);                    // rayures
        fillPts([[-50, 42], [50, 42], [44, 74], [0, 92], [-44, 74]], H.a);                          // col marin
        fillPts([[-40, 50], [40, 50], [34, 66], [0, 82], [-34, 66]], H.c);
        hatch(null, 0.8, 3.8, 0.2);
      });
    } else {                                                                                           // veste
      sleeves(H.c, H.d, 150);
      hb([[-18, 32], [18, 32], [50, 44], [54, 60], [52, 172, 1], [-52, 172, 1], [-54, 60], [-50, 44]], H.c, () => {
        fillPts([[-16, 32], [16, 32], [6, 96], [-6, 96]], H.d);                                       // encolure
        fillPts([[16, 32], [30, 44], [8, 96]], H.d); fillPts([[-16, 32], [-30, 44], [-8, 96]], H.d);
        for (const y of [104, 126, 148]) dot(0, y, 3.2, H.a);
        hatch(null, 0.8, 3.8, 0.24); shade(52, 0, -52, 0, 0.28, [-60, 20, 60, 180]);
      });
    }
    c.restore();
  }

  // =====================================================================
  // PARAPLUIE noir : debout, poignée en bas (0,0), pointe en haut ; o.ouvert 0 (fermé, roulé) .. 1 (ouvert, 340 de large)
  // =====================================================================
  const PL = { toile: '#1d1c22', toileL: '#2e2d35', bois: '#5a3a22', boisL: '#7d5634', metal: '#9c968a' };
  const PL_APEX = -262;
  function pluieGeo(u) {
    const W = lerp(5, 170, u), Ey = lerp(-56, -192, u), Cx = lerp(30, 150, u), Cy = lerp(-150, -272, u);
    return { W, Ey, Cx, Cy };
  }
  function drawPluie(o) {
    const u = ease(clamp(o.ouvert || 0)), g = pluieGeo(u);
    // tige + poignée en crosse
    pc(rect(-2.6, PL_APEX + 6, 2.6, 4), '#2a2724', null, 8101, { drop: false });
    pc(ribbon([[0, -4], [0, 18], [-3, 30], [-14, 35], [-25, 30], [-28, 18], [-28, 12]], 9, 8), PL.bois, () => strokePts([[-2, 4], [-2, 22], [-12, 31]], 'rgba(255,220,170,0.35)', 1.4), 8102);
    // toile : côtés en arc, bord festonné
    const n = 6, side = (sx) => qbez([0, PL_APEX], [sx * g.Cx, g.Cy], [sx * g.W, g.Ey], 10);
    const R = side(1), L = side(-1).reverse();
    const bord = [];
    for (let i = n; i >= 0; i--) {
      const xa = lerp(-g.W, g.W, i / n);
      bord.push([xa, g.Ey, 1]);
      if (i > 0) { const xb = lerp(-g.W, g.W, (i - 0.5) / n); bord.push([xb, g.Ey - lerp(2, 16, u)]); }
    }
    const toile = R.concat(bord.slice(1, -1), L.slice(0, -1));
    pc(toile, PL.toile, () => {
      if (u > 0.15) {
        for (let i = 0; i < n; i++) if (i % 2) {
          const a = lerp(-g.W, g.W, i / n), b = lerp(-g.W, g.W, (i + 1) / n);
          fillPts([[0, PL_APEX], [a, g.Ey], [b, g.Ey]], 'rgba(70,68,80,0.35)');
        }
        for (let i = 0; i <= n; i++) strokePts([[0, PL_APEX], [lerp(-g.W, g.W, i / n) * 0.8, lerp(PL_APEX, g.Ey, 0.8) - 8 * u], [lerp(-g.W, g.W, i / n), g.Ey]], 'rgba(150,145,140,0.45)', 1.1);
      } else {
        for (let k = 0; k < 4; k++) strokePts([[-6, -70 - k * 40], [7, -100 - k * 40]], 'rgba(120,118,125,0.5)', 1.2);   // plis du roulé
        fillPts(rect(-10, -128, 10, -118), '#0e0d10');                                                       // sangle
      }
      hatch(null, 0.7, 3.6, 0.3); strokePts([[-g.W * 0.5, g.Ey + (PL_APEX - g.Ey) * 0.55], [-g.W * 0.15, PL_APEX + 20]], 'rgba(255,255,255,0.18)', 3);
    }, 8103);
    pc([[-2.4, PL_APEX + 2], [2.4, PL_APEX + 2], [1, PL_APEX - 26, 1], [-1, PL_APEX - 26, 1]], PL.metal, null, 8104, { drop: false });   // pointe
    if (u > 0.2) for (let i = 0; i <= n; i++) dot(lerp(-g.W, g.W, i / n), g.Ey + 1, 2.2, PL.metal);            // embouts des baleines
  }
  const pluiePts = (o) => { const g = pluieGeo(ease(clamp(o.ouvert || 0))); return { pointe: [0, PL_APEX - 26], bordG: [-g.W, g.Ey], bordD: [g.W, g.Ey], poignee: [-14, 34] }; };

  // =====================================================================
  // CADEAU : boîte enrubannée ; (x,y) = bas ; 132 × 140 local ; o.couleur 0 bleu ardoise | 1 ocre | 2 vert éteint
  // =====================================================================
  const CAD = [['#4b6176', '#384a5c'], ['#b8863a', '#94692a'], ['#6a7c50', '#51613c']], RUBAN = '#ece2c6', RUBAND = '#cbbf9d';
  function drawCadeau(o) {
    const k = ((o.couleur | 0) % 3 + 3) % 3, [col, colD] = CAD[k], sd = 8200 + k * 10;
    pc(rect(-60, -100, 60, 0), col, () => {
      fillPts(rect(-11, -100, 11, 0), RUBAN); fillPts(rect(-60, -60, 60, -44), RUBAN);
      strokePts([[-11, -100], [-11, 0]], 'rgba(120,100,60,0.4)', 1); hatch(null, 0.8, 4, 0.22); shade(60, 0, -60, 0, 0.3, [-62, -102, 62, 2]);
    }, sd);
    pc(rect(-66, -124, 66, -98), colD, () => { fillPts(rect(-12, -124, 12, -98), RUBAND); hatch(null, 0.8, 4, 0.2); }, sd + 1);
    for (const sx of [-1, 1]) pc([[0, -124], [sx * 14, -146], [sx * 34, -150, 1], [sx * 36, -134], [sx * 20, -122]], RUBAN, () => hatch(null, 0.3, 3, 0.15), sd + 2 + sx);
    pc([[0, -124], [-16, -100], [-10, -98], [0, -118], [12, -96], [18, -100]], RUBAND, null, sd + 5, { drop: false });
    pc(ell(0, -126, 8, 7, 10), RUBAN, null, sd + 6);
  }

  // registre des objets (tenus ou seuls). grip = point tenu ; base = origine de l'accessoire seul ; pts = points nommés (tableau ou fonction des options)
  const OBJ = {
    habit: { draw: drawHabit, grip: [-2, 10], pts: { bas: [0, 200], crochet: [0, 0] }, base: [0, 0] },
    parapluie: { draw: drawPluie, grip: [0, 8], pts: pluiePts, base: [0, 0] },
    cadeau: { draw: drawCadeau, grip: [0, -56], pts: { noeud: [0, -128] }, base: [0, 0] },
  };
  MAN.OBJ = OBJ;
  const gripOf = (ob, o) => (typeof ob.grip === 'function' ? ob.grip(o) : ob.grip);
  const ptsOf = (ob, o) => (typeof ob.pts === 'function' ? ob.pts(o) : ob.pts);
  function heldOpts(name, o, p) { return Object.assign({ t: p.t || 0 }, o || {}); }
  function heldDraw(name, o, p) {
    const ob = OBJ[name]; if (!ob) return;
    const oo = heldOpts(name, o, p), g = gripOf(ob, oo), c = cx_();
    c.save(); c.translate(-g[0], -g[1]); ob.draw(oo); c.restore();
  }
  const DOIGTS = [[-13, -9], [9, -11], [12, -4], [12, 6], [6, 11], [-6, 11], [-13, 4]];
  const doigtsPaint = () => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(70,40,30,0.5)', 1); hatch(null, 0.9, 3.4, 0.15); };
  const has = (v) => v && v !== 'rien';

  // =====================================================================
  // HABILLEUR — employé municipal, la quarantaine : veste prune à boutons laiton, nœud papillon jaune, cheveux gris en brosse,
  // grosses lunettes rondes écaille, mètre ruban autour du cou, brassard de laine vert mousse ; parapluie noir accroché au bras.
  // Jambes à genou (cuisse + mollet) pour s'agenouiller.
  // =====================================================================
  const HB = { peau: '#dfb894', peauD: '#c29a76', veste: '#5e3552', vesteD: '#45263d', vesteL: '#76476a', chemise: '#ece6d6', noeud: '#d9ad2f',
    pant: '#3d3c43', pantD: '#2e2d33', chaus: '#2a1d16', cheveux: '#a9a8a2', cheveuxD: '#7f7e79', monture: '#4a2d1b', laine: '#6d7b45', laineD: '#56622f',
    ruban: '#e6d9a8', laiton: '#c09a48' };
  MAN.HB = HB;
  const R_COUDE = 11.5, LA = 96, LB = Math.hypot(4, 96), PHI = Math.atan2(-4, 96), SH_F = [-2, -146], SH_B = [-10, -146];
  const LT = 112, R_GEN = 12.5;   // cuisse ; rayon du genou
  function armR(len, wt) { wt = wt || 15; return ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1, 40], [R_COUDE + 0.5, len - 6]], ep(0, len, R_COUDE, R_COUDE, 10, 0, PI), [[-R_COUDE - 0.5, len - 6], [-wt + 1, 40]]); }
  function foreR(kind) { const f = X.forePts(kind); return ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU).concat(f.slice(2)); }
  const THIGH = [[-21, -16], [21, -16], [22, 40], [R_GEN + 1, LT - 8]].concat(ep(0, LT, R_GEN, R_GEN, 10, 0, PI), [[-R_GEN - 1, LT - 8], [-22, 40]]);
  const SHIN = ep(0, 0, R_GEN, R_GEN, 10, PI, TAU).concat([[R_GEN, 12], [10, 70], [9, 102], [13, 110], [40, 114], [50, 119, 1], [48, 126, 1], [-16, 126, 1], [-14, 108], [-11, 80], [-R_GEN, 12]]);
  function ik2(S, T, pick) {
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
  const handT = (S, up, lo) => mp(new DOMMatrix().translate(S[0], S[1]).rotate(up * D).translate(0, LA).rotate(lo * D), [4, 92]);   // poing, repère du torse

  function mkHabilleur() {
    const foreDef = (back) => {
      const hk = (p) => (back ? p.handB : p.handF) || 'fist', sk = back ? HB.peauD : HB.peau;
      return { parent: back ? 'armB_up' : 'armF_up', at: [0, LA], pts: (p) => foreR(hk(p)), base: back ? HB.vesteD : HB.veste, seed: back ? 7305 : 7310, paint: (p) => {
        fillPts([[-20, 76, 1], [20, 76, 1], [24, 130, 1], [-20, 130, 1]], sk); X.handPaint(null, hk(p));
        fillPts([[-14, 62, 1], [14, 62, 1], [15, 78, 1], [-14, 78, 1]], HB.chemise);
        for (const y of [56]) dot(-6, y, 2.2, HB.laiton);
        hatch([[-14, -10], [-3, -10], [-3, 60], [-14, 60]], 0.9, 3.8, back ? 0.32 : 0.22);
      } };
    };
    const upDef = (back) => ({ parent: 'torso', at: back ? SH_B : SH_F, pts: armR(LA), base: back ? HB.vesteD : HB.veste, seed: back ? 7304 : 7309, paint: () => {
      fillPts(rect(-17, 22, 17, 44), back ? HB.laineD : HB.laine);                                     // brassard de laine
      for (let x = -14; x <= 14; x += 6) strokePts([[x - 2, 26], [x, 31], [x + 2, 26]], 'rgba(30,35,15,0.5)', 1);
      for (let x = -14; x <= 14; x += 6) strokePts([[x - 2, 34], [x, 39], [x + 2, 34]], 'rgba(30,35,15,0.5)', 1);
      hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, back ? 0.34 : 0.26);
    } });
    const legDef = (back, part) => part === 'up'
      ? { parent: 'torso', at: back ? [-6, -2] : [6, -2], pts: THIGH, base: back ? HB.pantD : HB.pant, seed: back ? 7302 : 7303, noRivet: true, paint: () => {
        hatch([[-24, -20], [-6, -20], [-6, LT + 14], [-24, LT + 14]], 0.8, 4, back ? 0.34 : 0.24); strokePts([[8, 0], [6, LT - 6]], 'rgba(255,255,255,0.10)', 1.4); } }
      : { parent: back ? 'legB_up' : 'legF_up', at: [0, LT], pts: SHIN, base: back ? HB.pantD : HB.pant, seed: back ? 7306 : 7307, noRivet: !!back, paint: () => {
        fillPts([[-40, 100, 1], [60, 100, 1], [60, 140, 1], [-40, 140, 1]], HB.chaus);
        if (!back) { strokePts([[20, 110], [42, 116]], 'rgba(255,255,255,0.25)', 1.3); hatch([[-16, 0], [-4, 0], [-4, 100], [-16, 100]], 0.8, 4, 0.24); }
        else hatch(null, 0.8, 3.6, 0.32);
      } };
    const parts = {
      torso: { parent: null, at: [0, 0], seed: 7301, base: HB.veste,
        pts: [[-14, -178], [8, -182], [17, -170], [27, -150], [34, -112], [36, -70], [37, -20], [38, 20], [41, 42, 1], [-41, 44, 1], [-41, 10], [-39, -40], [-39, -100], [-35, -148], [-27, -168]],
        paint: () => {
          fillPts([[4, -186], [17, -171], [14, -152], [2, -166]], HB.chemise);                         // col de chemise
          fillPts([[17, -170], [28, -150], [32, -112], [24, -100], [15, -140]], HB.vesteD);            // revers
          for (const y of [-96, -64, -32, 0]) { dot(30, y, 3.4, HB.laiton); dot(29, y - 1, 1.4, 'rgba(255,240,190,0.8)'); }
          strokePts([[26, -100], [30, -40], [34, 40]], 'rgba(30,10,25,0.45)', 1.3);
          fillPts(rect(-8, -6, 22, 2), HB.vesteD);                                                    // poche
          // mètre ruban autour du cou : deux bouts qui pendent sur la poitrine (graduations sans chiffre)
          for (const [x0, x1, y1] of [[4, 18, -70], [-6, 4, -46]]) {
            const band = ribbon([[x0, -176], [(x0 + x1) / 2, (y1 - 176) / 2], [x1, y1]], 9, 9);
            fillPts(band, HB.ruban);
            for (let k = 1; k < 12; k++) { const f = k / 12, xx = lerp(x0, x1, f), yy = lerp(-176, y1, f); strokePts([[xx - 4, yy], [xx, yy]], 'rgba(120,40,30,0.75)', 1); }
            fillPts(rect(x1 - 5, y1 - 2, x1 + 5, y1 + 5), HB.laiton);
          }
          fillPts([[10, -172], [3, -180], [3, -164]], HB.noeud); fillPts([[10, -172], [19, -181], [19, -163]], HB.noeud);   // nœud papillon
          dot(10, -172, 2.6, '#b38a1f');
          hatch([[-50, -172], [-14, -172], [-12, 46], [-50, 46]], 0.75, 4.2, 0.28);
          shade(40, 0, -40, 0, 0.26);
        } },
      legB_up: legDef(true, 'up'), legB_lo: legDef(true, 'lo'), legF_up: legDef(false, 'up'), legF_lo: legDef(false, 'lo'),
      armB_up: upDef(true), armB_lo: foreDef(true), armF_up: upDef(false), armF_lo: foreDef(false),
      head: { parent: 'torso', at: [6, -170], pts: X.NAP_HEAD, base: HB.peau, seed: 7308, noRivet: true, paint: (p) => {
        const f = p.face || {};
        X.earPaint(-8, -44);
        hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.26);
        dot(14, -30, 8, 'rgba(200,120,100,0.18)');
        strokePts([[30, -40], [24, -34]], 'rgba(120,70,50,0.45)', 1.1);                               // pli de la joue
        X.eye(f, 17, -52); X.brow(f, 17, -63, 'rgba(110,108,100,0.95)', 3); X.mouth(f, 27, -27);
        strokePts([[4, -48], [-2, -46]], 'rgba(120,70,50,0.35)', 1);                                  // patte d'oie
      },
      extra: (p) => {                                                                                   // grosses lunettes rondes (par-dessus le profil)
        const ring = ell(20, -51, 14.5, 14.5, 16);
        fillPts(ring, 'rgba(195,225,235,0.25)', 0, 0); strokePts(ring.concat([ring[0]]), HB.monture, 3.2);
        strokePts([[6, -52], [-26, -55]], HB.monture, 2.2); strokePts([[13, -58], [21, -62]], 'rgba(255,255,255,0.7)', 1.4);
      } },
      cheveux: { parent: 'head', at: [0, 0], noRivet: true, base: HB.cheveux, seed: 7311,
        pts: (() => { const o = [[31, -86], [31, -104, 1]]; for (let x = 28, i = 0; x >= -30; x -= 4, i++) o.push([x, i % 2 ? -106 : -113, 1]); return o.concat([[-38, -100], [-45, -80], [-46, -62], [-44, -38], [-34, -36], [-30, -58], [-14, -72], [4, -80], [22, -82]]); })(),
        paint: () => { for (let x = -40; x <= 28; x += 4) strokePts([[x, -110], [x + 0.5, -96 + (x < -30 ? 20 : 0)]], 'rgba(60,60,58,0.45)', 1); hatch(null, 1.4, 3, 0.18); } },
      // parapluie fermé accroché à l'avant-bras arrière (option pluie, défaut 'bras') : pend toujours droit à l'écran
      pluie: { parent: 'armB_lo', at: [0, 46], noRivet: true, base: '#000', seed: 7320, pts: OFFP, extra: (p) => {
        if (p._pluieBras) { const c = cx_(); c.save(); c.rotate(PI); c.translate(14, -26); drawPluie({ ouvert: 0 }); c.restore(); }
      } },
      // mètre ruban tendu entre les deux poings (option mesure)
      ruban: { parent: 'torso', at: [0, 0], noRivet: true, base: HB.ruban, seed: 7321, drop: false,
        pts: (p) => (p._ruban ? ribbon([p._ruban[0], [(p._ruban[0][0] + p._ruban[1][0]) / 2, (p._ruban[0][1] + p._ruban[1][1]) / 2 + 3], p._ruban[1]], 8, 8) : OFFP),
        paint: (p) => { if (!p._ruban) return; const [a, b] = p._ruban; for (let k = 1; k < 16; k++) { const f = k / 16, x = lerp(a[0], b[0], f), y = lerp(a[1], b[1], f) + 3 * Math.sin(PI * f); strokePts([[x, y - 4], [x, y]], 'rgba(120,40,30,0.75)', 1); } } },
      objet: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: '#000', seed: 7330, pts: OFFP, extra: (p) => { if (has(p.tenu)) heldDraw(p.tenu, p.tenuO, p); } },
      doigts: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: HB.peau, seed: 7331, pts: (p) => (has(p.tenu) ? DOIGTS : OFFP), paint: doigtsPaint },
      objetB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: '#000', seed: 7332, pts: OFFP, extra: (p) => { if (has(p.tenuB)) heldDraw(p.tenuB, p.tenuBO, p); } },
      doigtsB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: HB.peauD, seed: 7333, pts: (p) => (has(p.tenuB) || p._deux ? DOIGTS : OFFP), paint: doigtsPaint },
    };
    return { nom: 'habilleur', hipY: -238, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, parts,
      order: ['armB_up', 'armB_lo', 'objetB', 'legB_up', 'legB_lo', 'legF_up', 'legF_lo', 'pluie', 'head', 'cheveux', 'torso', 'armF_up', 'armF_lo', 'ruban', 'objet', 'doigts', 'doigtsB'] };
  }
  CH.manHabilleur = mkHabilleur();

  // ---------------- préparation de la pose (gestes → angles)
  function prep(p) { p = p || {}; return Object.assign({}, p, { ang: Object.assign({}, p.ang), hide: Object.assign({}, p.hide), face: Object.assign({}, p.face) }); }
  function armTo(q, arm, T, pick, k) {
    if (k <= 0) return;
    const sol = ik2(arm === 'armF' ? SH_F : SH_B, T, pick), A = q.ang;
    const a0 = A[arm + '_up'] || 0, b0 = A[arm + '_lo'] || 0;
    A[arm + '_up'] = a0 + normA(sol.a - a0) * k; A[arm + '_lo'] = b0 + normA(sol.b - b0) * k;
  }
  const blend = (q, n, v, k) => { q.ang[n] = lerp(q.ang[n] || 0, v, k); };
  MAN.habilleurPose = function (p) {
    const q = prep(p), A = q.ang, src = (p && p.ang) || {};
    const k = (n) => ease(clamp(q[n] || 0));
    const ge = k('genou'), te = k('tendre'), me = k('mesure'), bo = k('boutonne'), ha = k('hausse'), le = k('leve');
    const pluieTenue = q.tenu === 'parapluie' || q.tenuB === 'parapluie';
    q._pluieBras = !pluieTenue && (q.pluie == null || q.pluie === 'bras');
    const brasBLibre = src.armB_up == null && src.armB_lo == null && !has(q.tenuB) && !(me || bo || ha);
    if (q._pluieBras && brasBLibre) { A.armB_up = -0.2; A.armB_lo = -1.3; }               // avant-bras arrière à l'horizontale : le parapluie y pend
    if (q.marche != null) {                                                                 // marche : phase en cycles
      const ph = q.marche * TAU, s = Math.sin(ph);
      A.legF_up = (A.legF_up || 0) - 0.32 * s; A.legB_up = (A.legB_up || 0) + 0.32 * s;
      A.legF_lo = (A.legF_lo || 0) + 0.45 * Math.max(0, Math.sin(ph + 0.9)); A.legB_lo = (A.legB_lo || 0) + 0.45 * Math.max(0, -Math.sin(ph + 0.9));
      q.dy = (q.dy || 0) - Math.abs(Math.cos(ph)) * 6;
      if (src.armF_up == null && !(te || me || bo || ha || le)) A.armF_up = (A.armF_up || 0) + 0.22 * s;
    }
    if (ge > 0) {                                                                           // s'agenouille : genou arrière au sol, pied avant devant
      q.dy = (q.dy || 0) + 114 * ge;
      blend(q, 'legF_up', -1.5, ge); blend(q, 'legF_lo', 1.5, ge); blend(q, 'legB_up', 0.05, ge); blend(q, 'legB_lo', 1.52, ge);
      A.head = (A.head || 0) + 0.06 * ge;
    }
    if (te > 0) { blend(q, 'armF_up', -1.42, te); blend(q, 'armF_lo', -0.18, te); }
    if (me > 0) { armTo(q, 'armF', [118, -118], 'bas', me); armTo(q, 'armB', [38, -112], 'bas', me); }
    if (bo > 0) { armTo(q, 'armF', [34, -104], 'bas', bo); armTo(q, 'armB', [26, -88], 'bas', bo); A.head = (A.head || 0) + 0.28 * bo; }
    if (ha > 0) {
      blend(q, 'armF_up', 0.05, ha); blend(q, 'armF_lo', -1.8, ha); blend(q, 'armB_up', 0.3, ha); blend(q, 'armB_lo', -1.95, ha);
      A.head = (A.head || 0) + 0.12 * ha; q.dy = (q.dy || 0) - 5 * ha;
      if (ha > 0.4) { if (!q.handF && !has(q.tenu)) q.handF = 'open'; if (!q.handB && !has(q.tenuB)) q.handB = 'open'; if (!q.face.brow) q.face.brow = 'up'; if (!q.face.mouth) q.face.mouth = 'tight'; }
    }
    if (le > 0) { armTo(q, 'armF', [64, -176], 'bas', le); A.head = (A.head || 0) - 0.12 * le; }
    if (me > 0.01) q._ruban = [handT(SH_B, A.armB_up || 0, A.armB_lo || 0), handT(SH_F, A.armF_up || 0, A.armF_lo || 0)];
    // objets tenus
    const tl = q.tilt || 0;
    if (has(q.tenu) && !(q.handF && q.handF !== 'fist')) q.handF = 'fist';
    if (has(q.tenuB) && !(q.handB && q.handB !== 'fist')) q.handB = 'fist';
    if (q.droit == null && has(q.tenu)) q.droit = true;
    if (q.droitB == null && has(q.tenuB)) q.droitB = true;
    if (q.droit) A.objet = (A.objet || 0) - ((A.armF_up || 0) + (A.armF_lo || 0) + tl);
    if (q.droitB) A.objetB = (A.objetB || 0) - ((A.armB_up || 0) + (A.armB_lo || 0) + tl);
    A.pluie = -((A.armB_up || 0) + (A.armB_lo || 0) + tl) - 0.95 * ge;                  // à genou : le parapluie s'appuie au sol, pointe en avant
    q._deux = (me > 0.3 || bo > 0.3) && !(q.handB && q.handB !== 'fist');
    if (q._deux) q.handB = 'fist';
    return q;
  };
  function run(def, q, x, y, s, o) {
    const r = M.puppet(def, q, x, y, s, Object.assign({ slot: M.ST.slotF }, o || {}));
    r.tenu = q.tenu; r.tenuB = q.tenuB;
    if (OBJ[q.tenu]) r.tenuO = heldOpts(q.tenu, q.tenuO, q);
    if (OBJ[q.tenuB]) r.tenuBO = heldOpts(q.tenuB, q.tenuBO, q);
    return r;
  }
  MAN.habilleur = (pose, x, y, s, o) => run(CH.manHabilleur, MAN.habilleurPose(pose), x, y, s == null ? 0.9 : s, o);
  // point nommé de l'objet tenu (écran) : r renvoyé par MAN.habilleur
  MAN.pt = function (r, nom, arriere) {
    const name = arriere ? r.tenuB : r.tenu, ob = OBJ[name]; if (!ob) return null;
    const oo = arriere ? r.tenuBO : r.tenuO, q = ptsOf(ob, oo)[nom]; if (!q) return null;
    const g = gripOf(ob, oo);
    return r.w(arriere ? 'objetB' : 'objet', q[0] - g[0], q[1] - g[1]);
  };

  // =====================================================================
  // ACCESSOIRES SEULS — M.puppet à une pièce invisible ; l'objet se dessine dans l'extra (ombre portée possible)
  // =====================================================================
  const accDefs = {};
  function accDef(name, fn) { return accDefs[name] || (accDefs[name] = { hipY: 0, handLen: 10, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => fn(p.o) } }, order: ['o'] }); }
  function acc(name, draw, x, y, s, o) {
    o = Object.assign({ t: 0 }, o || {});
    const def = accDef(name, draw);
    return M.puppet(def, { o, tilt: o.rot || 0 }, x, y, s, { dir: o.dir || 1, rod: false, slot: o.slot != null ? o.slot : y + 6 * s, floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
  }
  MAN.cadeau = (x, y, s, o) => acc('cadeau', drawCadeau, x, y, s == null ? 1 : s, o);
  MAN.parapluie = (x, y, s, o) => acc('parapluie', drawPluie, x, y, s == null ? 0.9 : s, o);
  MAN.habit = (x, y, s, o) => acc('habit', drawHabit, x, y, s == null ? 0.9 : s, o);

  // =====================================================================
  // PORTANT DE COSTUMES — rail laiton sur montants, socle bois à roulettes ; o.n cintres (fractionnaire : le dernier apparaît en pop)
  // (x,y) = sol, milieu ; rail à y −390 ; largeur = max(420, 90 + 46·n) (ou o.long)
  // =====================================================================
  function portantL(o) { return o.long || Math.max(420, 90 + 46 * Math.ceil(clamp(o.n == null ? 6 : o.n, 0, 40))); }
  function drawPortant(o) {
    const n = clamp(o.n == null ? 6 : o.n, 0, 40), L = portantL(o), h = L / 2, t = o.t || 0, list = o.habits || MAN.HABITS;
    const lait = '#b08d45', laitD = '#7a5f2c';
    for (const sx of [-1, 1]) {                                                             // pieds à roulettes
      pc(rect(sx * h - 40, -34, sx * h + 40, -20), P.bois, () => hatch(null, 0.2, 4, 0.25), 8301 + sx);
      for (const dx of [-30, 30]) { pc(ell(sx * h + dx, -10, 10, 10, 12), '#2a2622', () => dot(0, 0, 0, '#000'), 8304 + dx); M.rivet(sx * h + dx, -10, 3); }
      pc(rect(sx * h - 5, -392, sx * h + 5, -30), lait, () => { strokePts([[sx * h - 2, -388], [sx * h - 2, -34]], 'rgba(255,240,190,0.55)', 1.4); }, 8310 + sx);
    }
    pc(rect(-h, -118, h, -106), P.boisM || P.bois, () => hatch(null, 0.2, 4, 0.2), 8320);   // traverse basse en bois
    const c = cx_();
    const k = Math.ceil(n - 1e-6);
    for (let i = 0; i < k; i++) {                                                            // cintres, du fond vers l'avant
      const pop = clamp(n - i), sc = pop >= 1 ? 1 : 0.2 + 0.8 * M.spring(pop * 0.6, 0.45, 12);
      const xi = (i - (k - 1) / 2) * Math.min(46, (L - 110) / Math.max(1, k - 1));
      const sw = (o.balance || 0) * 0.06 * Math.sin(t * 3.1 + i * 1.7);
      c.save(); c.translate(xi, -396); c.scale(sc, sc);
      drawHabit({ habit: list[i % list.length], swing: sw });
      c.restore();
    }
    pc(rect(-h - 10, -398, h + 10, -386), lait, () => strokePts([[-h - 6, -395], [h + 6, -395]], 'rgba(255,240,190,0.6)', 1.6), 8330);   // rail (devant les crochets)
    for (const sx of [-1, 1]) pc(ell(sx * (h + 10), -392, 8, 8, 10), laitD, null, 8333 + sx);
  }
  MAN.portant = (x, y, s, o) => acc('portant', drawPortant, x, y, s == null ? 1 : s, o);
  MAN.portantLargeur = (o) => portantL(o || {});

  // =====================================================================
  // MANNEKEN-PIS — statue de bronze lisse (aucune anatomie) sur socle-fontaine ; jet depuis un petit bec DEVANT la statue.
  // (x,y) = bas de la vasque. Local : vasque 0..−50, socle jusqu'à −178, statue −178..−330 (s 1 ≈ 330 px).
  // =====================================================================
  const BZ = { c: '#6f6b44', l: '#958d5c', d: '#48462c', vg: 'rgba(110,165,140,0.55)', oc: 'rgba(210,165,90,0.35)' };
  const PIERRE = { c: '#a19c90', d: '#827d72', l: '#bdb8ab', v: '#8f8a80' };
  const SOC = -178, NECK = [2, -114], BEC = [66, -146];
  const bronze = (seed) => () => {
    for (let i = 0; i < 4; i++) dot(-22 + hash(seed + i) * 46, -110 + hash(seed + i * 7 + 3) * 110, 2.5 + 3 * hash(seed + i * 13), 'rgba(110,165,140,0.28)');
    for (let i = 0; i < 3; i++) dot(-10 + hash(seed + i * 5) * 30, -110 + hash(seed + i * 11) * 100, 2.5 + 3 * hash(seed + i * 3), 'rgba(210,165,90,0.22)');
    hatch(null, 0.9, 3.6, 0.2, 1, P.encre, [-90, -200, 90, 10]);
    shade(22, 0, -22, 0, 0.32, [-90, -200, 90, 10]);
  };
  function headM(o) { return new DOMMatrix().translate(NECK[0], NECK[1]).rotate((-0.2 + (o.tete || 0)) * D).translate(-NECK[0], -NECK[1]); }
  function statueHead(o, H) {
    const c = cx_(), hum = o.humeur || 'malin';
    c.save(); const m = headM(o); c.transform(m.a, m.b, m.c, m.d, m.e, m.f);
    const HEAD = [[-6, -113], [-14, -121], [-17, -136], [-12, -149], [0, -155], [13, -152], [20, -144], [22, -138], [27, -132, 1], [22, -128], [22, -125], [20, -121], [17, -118], [8, -115]];
    if (o.habit === 'dracula') for (const sx of [0, 1]) pc([[-6, -112], [-16 - sx * 6, -146, 1], [-2 - sx * 4, -122]], sx ? H.a : H.c, null, 8401 + sx);   // col haut
    pc(HEAD, BZ.c, () => {
      hatch(null, 0.9, 3.6, 0.18, 1, P.encre, [-30, -160, 30, -100]); shade(24, 0, -20, 0, 0.3, [-30, -160, 30, -100]);
      if (o.habit !== 'noel' && o.habit !== 'smoking') {                                                             // chevelure bouclée
        fillPts([[-16, -126], [-18, -138], [-12, -150], [0, -156], [12, -153], [18, -146], [8, -147], [-2, -143], [-8, -135], [-9, -126]], 'rgba(50,48,28,0.45)');
        for (const [hx, hy] of [[-13, -131], [-14, -141], [-8, -149], [1, -153], [10, -151], [-4, -143]]) strokePts(ep(hx, hy, 3.2, 3.2, 6, PI * 0.9, PI * 2.1), 'rgba(200,180,120,0.55)', 1.1);
      }
      strokePts([[-2, -138], [-4, -132], [-1, -128]], BZ.d, 1.4);                                                       // oreille
      const ex = 13, ey = -139;
      if (hum === 'accepte') { strokePts([[ex - 4, ey], [ex + 4, ey]], '#2a2818', 1.8); strokePts([[ex - 4, ey - 2], [ex + 4, ey - 2.5]], BZ.d, 1.2); }
      else if (hum === 'dort') strokePts([[ex - 4, ey - 1], [ex, ey + 2], [ex + 4, ey - 1]], '#2a2818', 1.6);
      else if (hum === 'calme') dot(ex, ey, 2.1, '#2a2818');
      else { strokePts([[ex - 4, ey + 1], [ex, ey - 2.5], [ex + 4, ey + 1]], '#2a2818', 1.8); strokePts([[ex - 4, ey - 7], [ex + 5, ey - 9]], BZ.d, 1.4); }
      const my = -124;
      if (hum === 'malin') strokePts([[16, my - 1], [20, my + 2], [24, my - 2]], '#2a2818', 1.6);
      else if (hum === 'accepte') strokePts([[17, my], [20, my + 1.5], [23, my - 0.5]], '#2a2818', 1.4);
      else strokePts([[17, my + 0.5], [22, my + 0.5]], '#2a2818', 1.3);
      dot(15, -129, 3.5, 'rgba(210,165,90,0.35)');
      strokePts([[4, -151], [14, -149]], 'rgba(255,240,190,0.45)', 2);
    }, 8402);
    if (o.habit === 'dracula') { pc([[18, -124], [19.5, -119, 1], [21, -124]], '#f3efe4', null, 8403, { drop: false }); }
    if (o.habit === 'noel') {
      pc([[0, -130], [10, -126], [22, -123], [27, -118], [24, -108], [14, -102], [2, -104], [-6, -114]], '#efebe0', () => hatch(null, 1.3, 3, 0.15), 8404);    // barbe
      pc([[-16, -140], [16, -152], [8, -170], [-14, -176], [-34, -164, 1], [-26, -156]], H.c, () => hatch(null, 0.6, 3.5, 0.25), 8405);                     // bonnet
      pc(ribbon([[-18, -140], [0, -147], [18, -152]], 9, 9), '#efebe0', null, 8406);
      pc(ell(-36, -162, 6.5, 6.5, 10), '#efebe0', null, 8407);
    }
    if (o.habit === 'sax') pc([[-18, -146], [-6, -158], [16, -158], [26, -152], [24, -148], [0, -147], [-14, -142]], '#2b2f3e', () => { dot(4, -160, 2.4, '#2b2f3e'); hatch(null, 0.4, 3, 0.2); }, 8408);   // béret
    if (o.habit === 'smoking') {
      pc([[-14, -149], [16, -156], [16, -184, 1], [-11, -179, 1]], '#1b1a20', () => { fillPts([[-13, -155], [16, -162], [16, -158], [-13, -151]], '#5a2428'); strokePts([[-6, -176], [-6, -156]], 'rgba(255,255,255,0.18)', 2); }, 8409);
      pc([[-22, -146], [26, -158], [27, -153], [-21, -142]], '#1b1a20', null, 8410);
    }
    c.restore();
  }
  function drawStatue(o) {
    const H = HABITS[o.habit] || null, hb = o.habit && o.habit !== 'bronze' ? o.habit : null;
    const sleeve = hb === 'noel' ? H.c : (hb === 'smoking' || hb === 'dracula') ? H.c : null;
    const cuff = hb === 'noel' ? '#efebe0' : hb === 'smoking' ? H.a : null;
    if (hb === 'dracula') pc([[-4, -112], [-18, -106], [-38, -40], [-50, 0, 1], [6, 0, 1], [-2, -40], [6, -100]], H.c, () => {    // cape derrière
      fillPts([[-2, -100], [6, -100], [6, 0], [-14, 0], [-8, -50]], H.a); hatch(null, 0.8, 3.6, 0.25); }, 8420);
    // bras arrière, pendant un peu en arrière
    pc(ribbon([[-6, -104], [-14, -86], [-20, -70]], 11, 9), sleeve ? H.d : BZ.d, sleeve ? () => hatch(null, 0.8, 3.6, 0.3) : bronze(8421), 8421);
    pc(ell(-21, -64, 6.5, 6.5, 10), BZ.d, null, 8422);
    // jambes : lisses, rondes
    pc([[-18, -66], [3, -66], [2, -36], [-2, -10], [5, -5], [9, 0, 1], [-19, 0, 1], [-20, -10], [-21, -36]], BZ.d, bronze(8423), 8423);
    pc(hb === 'smoking' ? [[-16, -116], [10, -117], [16, -108], [20, -92], [22, -78], [18, -66], [-4, -62], [-14, -58], [-22, -26, 1], [-31, -26, 1], [-22, -70], [-19, -100]]
      : [[-13, -113], [8, -115], [16, -106], [21, -92], [25, -80], [22, -66], [14, -58], [-6, -55], [-20, -62], [-22, -80], [-18, -100]],
    hb === 'smoking' || hb === 'dracula' ? H.c : BZ.c, () => {
      if (hb === 'smoking') { fillPts([[6, -115], [16, -108], [20, -92], [12, -78]], H.a); fillPts([[8, -114], [18, -104], [8, -84]], H.d); }
      if (hb === 'dracula') { fillPts([[4, -114], [14, -108], [10, -92]], '#f3efe4'); }
      if (hb === 'smoking' || hb === 'dracula') hatch(null, 0.8, 3.6, 0.25); else bronze(8424)(); }, 8424);
    pc([[-8, -68], [15, -68], [17, -40], [12, -10], [20, -5], [25, 0, 1], [-1, 0, 1], [-2, -10], [-6, -40]], BZ.c, bronze(8425), 8425);
    if (hb === 'noel') pc([[-15, -116], [10, -117], [17, -108], [23, -92], [26, -76], [25, -56], [27, -40, 1], [-25, -40, 1], [-22, -60], [-21, -82], [-19, -102]], H.c, () => {
      fillPts(rect(-28, -48, 30, -38), '#efebe0'); fillPts(rect(14, -116, 22, -40), '#efebe0');
      fillPts(rect(-28, -84, 30, -76), '#1f1b1b'); fillPts(rect(4, -86, 14, -74), '#c9a54b'); fillPts(rect(7, -83, 11, -77), '#1f1b1b');
      hatch(null, 0.8, 3.6, 0.24); shade(26, 0, -26, 0, 0.3, [-30, -120, 30, -36]); }, 8426);
    if (hb === 'dracula') pc([[-8, -114], [8, -114], [12, -102], [6, -66], [-6, -60], [-16, -70], [-16, -104]], H.c, () => { strokePts([[8, -112], [6, -70]], H.a, 2.4); hatch(null, 0.8, 3.6, 0.25); }, 8427);   // pan de cape sur l'épaule
    if (hb === 'smoking') pc([[8, -116], [16, -113], [8, -110]], '#111014', null, 8428, { drop: false });
    statueHead(o, H);
    if (hb === 'smoking') pc([[8, -117], [3, -121], [3, -109], [8, -113], [13, -109], [13, -121]], '#111014', null, 8429);          // nœud papillon
    // bras avant : poing sur la hanche, coude en arrière
    const skin = (sd) => (sleeve ? () => hatch(null, 0.8, 3.6, 0.25) : bronze(sd));
    pc(ribbon([[2, -105], [-14, -98], [-31, -91]], 12, 10), sleeve || BZ.c, skin(8430), 8430);
    pc(ell(-31, -91, 6, 6, 10), sleeve || BZ.c, null, 8431, { drop: false });
    pc(ribbon([[-31, -91], [-21, -81], [-11, -75]], 10, 9), sleeve || BZ.c, () => { if (cuff) fillPts(ribbon([[-18, -78], [-12, -75]], 12, 12), cuff); skin(8432)(); }, 8432);
    pc(ell(-8, -74, 7, 6.5, 10), BZ.c, () => { strokePts([[-11, -77], [-4, -77]], BZ.d, 1); strokePts([[-11, -73], [-4, -73]], BZ.d, 1); }, 8433);
    if (hb === 'sax') {                                                                    // saxophone doré tenu devant lui, sur sa bandoulière
      const G = '#c9a23f', GD = '#8f7027';
      strokePts([[2, -114], [12, -104], [24, -96]], '#3a2a18', 1.4);
      pc(ribbon([[23, -125], [32, -121], [34, -110]], 4, 5), G, null, 8434);
      pc(ribbon([[34, -110], [33, -92], [30, -72], [27, -60]], 8, 12), G, () => { for (const y of [-104, -94, -84, -74]) dot(30, y, 2.4, GD); }, 8435);
      pc(ribbon([[27, -60], [32, -52], [41, -56], [44, -70]], 12, 14), G, null, 8436);
      pc([[36, -70], [52, -80], [54, -76], [46, -62]], G, () => fillPts([[40, -70], [51, -78], [52, -76], [44, -66]], GD), 8437);
      pc([[23, -127], [20, -126], [20, -123], [23, -122]], '#1b1a20', null, 8438, { drop: false });
    }
  }
  function drawSocle(o) {
    pc([[-46, -40], [46, -40], [42, -150], [50, -156], [54, -166], [-54, -166], [-50, -156], [-42, -150]], PIERRE.c, () => {
      for (const y of [-70, -104, -134]) strokePts([[-46, y], [46, y]], 'rgba(60,55,45,0.4)', 1.2);
      for (const [x, y0, y1] of [[-8, -70, -40], [14, -104, -70], [-20, -134, -104], [22, -150, -134]]) strokePts([[x, y0], [x, y1]], 'rgba(60,55,45,0.35)', 1.1);
      fillPts(rect(-24, -126, 24, -84), 'rgba(80,75,65,0.18)'); strokePts([[-24, -84], [-24, -126], [24, -126]], 'rgba(60,55,45,0.45)', 1.1); strokePts([[24, -126], [24, -84], [-24, -84]], 'rgba(255,255,255,0.3)', 1.1);
      hatch(null, 0.9, 4.2, 0.22); shade(46, 0, -46, 0, 0.3, [-56, -170, 56, -38]);
    }, 8440);
    pc([[-60, -164], [60, -164], [58, -178, 1], [-58, -178, 1]], PIERRE.l, () => { strokePts([[-56, -175], [56, -175]], 'rgba(255,255,255,0.4)', 1.4); hatch(null, 0.9, 4, 0.18); }, 8441);
    // bec de fontaine, devant la statue
    pc([[38, -150], [58, -151], [64, -155, 1], [68, -146, 1], [60, -140], [38, -140]], BZ.c, () => { strokePts([[40, -148], [60, -149]], 'rgba(255,240,190,0.45)', 1.2); dot(46, -145, 6, BZ.vg); }, 8442);
    pc(ell(40, -145, 5, 7, 10), BZ.d, null, 8443, { drop: false });
  }
  function drawVasque() {
    pc([[-142, -38], [-138, -48], [-128, -52], [128, -52], [138, -48], [142, -38], [134, -28], [120, -8], [112, 0, 1], [-112, 0, 1], [-120, -8], [-134, -28]], PIERRE.v, () => {
      fillPts([[-128, -52], [128, -52], [124, -46], [-124, -46]], '#9fb7c0');                        // eau
      strokePts([[-136, -44], [136, -44]], 'rgba(255,255,255,0.35)', 1.6);
      strokePts([[-132, -30], [132, -30]], 'rgba(60,55,45,0.35)', 1.2);
      hatch(null, 0.9, 4.2, 0.22); shade(140, 0, -140, 0, 0.3, [-145, -56, 145, 2]);
    }, 8450);
  }
  function jetPath(j) {                                                                     // parabole du bec à la vasque
    const vx = 50 * j, vy = -36 * j, g = 220, y0 = BEC[1], yL = -48;
    const uL = (-vy + Math.sqrt(vy * vy + 2 * g * (yL - y0))) / g;
    const pts = []; for (let i = 0; i <= 16; i++) { const u = uL * i / 16; pts.push([BEC[0] + vx * u, y0 + vy * u + 0.5 * g * u * u]); }
    return pts;
  }
  function drawJet(o) {
    const j = clamp(o.jet == null ? 1 : o.jet), t = o.t || 0;
    if (j <= 0.02 || SIL()) return;
    const c = cx_(), pts = jetPath(Math.max(0.12, j)), w = lerp(2.5, 6, j);
    c.save(); c.globalAlpha = clamp(j * 3);
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
    c.strokeStyle = 'rgba(150,185,200,0.9)'; c.lineWidth = w; c.stroke();
    c.strokeStyle = 'rgba(235,245,248,0.85)'; c.lineWidth = w * 0.35; c.stroke();
    for (let i = 0; i < 6; i++) {                                                           // gouttes qui glissent le long du jet
      const f = (t * 1.8 + i / 6) % 1, k = Math.min(15, Math.floor(f * 16)), q = pts[k];
      c.beginPath(); c.arc(q[0], q[1], w * 0.55, 0, TAU); c.fillStyle = 'rgba(245,250,252,0.9)'; c.fill();
    }
    const L = pts[pts.length - 1];
    for (let i = 0; i < 5; i++) {                                                           // éclaboussures
      const f = (t * 2.3 + i * 0.37) % 1, a = -PI / 2 + (i - 2) * 0.5;
      c.beginPath(); c.arc(L[0] + Math.cos(a) * 16 * f, L[1] - 3 + Math.sin(a) * 14 * f + 18 * f * f, 1.8 * (1 - f) + 0.6, 0, TAU);
      c.fillStyle = `rgba(225,238,244,${0.85 * (1 - f)})`; c.fill();
    }
    for (let i = 0; i < 2; i++) {                                                           // ronds dans l'eau
      const f = (t * 0.9 + i * 0.5) % 1;
      c.beginPath(); c.ellipse(L[0], -49, 6 + 22 * f, 2 + 2.5 * f, 0, 0, TAU); c.strokeStyle = `rgba(240,248,250,${0.7 * (1 - f)})`; c.lineWidth = 1.2; c.stroke();
    }
    c.restore();
  }
  function drawManneken(o) {
    drawSocle(o);
    const c = cx_(); c.save(); c.translate(0, SOC); drawStatue(o); c.restore();
    drawVasque(o);
    drawJet(o);
  }
  // points utiles (repère local, origine = bas de la vasque) : bec, tête, sommet de la tête, pieds de la statue, chute du jet
  function mannekenPts(o) {
    const m = new DOMMatrix().translate(0, SOC).multiply(headM(o));
    const L = jetPath(Math.max(0.12, clamp(o.jet == null ? 1 : o.jet))).pop();
    return { bec: BEC, tete: mp(m, [4, -134]), sommet: mp(m, [2, -158]), pieds: [0, SOC], centre: [0, SOC - 76], chute: L };
  }
  MAN.manneken = (x, y, s, o) => {
    o = Object.assign({ jet: 1, humeur: 'malin', habit: 'bronze' }, o || {});
    const r = acc('manneken', drawManneken, x, y, s == null ? 1 : s, o), q = mannekenPts(o);
    r.pt = (nom) => (q[nom] ? r.w('o', q[nom][0], q[nom][1]) : null);
    return r;
  };

  // =====================================================================
  // DÉCORS — pré-rendus par MAN.init()
  // =====================================================================
  function win(x0, y0, w, h, seed, col) {
    pc(rect(x0 - 6, y0 - 6, x0 + w + 6, y0 + h + 8), col || '#e2d8c0', null, seed);
    pc(rect(x0, y0, x0 + w, y0 + h), '#3b4552', () => {
      strokePts([[x0 + w / 2, y0], [x0 + w / 2, y0 + h]], '#e2d8c0', 2.2);
      for (let k = 1; k < 3; k++) strokePts([[x0, y0 + h * k / 3], [x0 + w, y0 + h * k / 3]], '#e2d8c0', 1.8);
      strokePts([[x0 + 4, y0 + h * 0.6], [x0 + w * 0.4, y0 + 4]], 'rgba(220,230,235,0.25)', 3);
    }, seed + 1, { drop: false });
  }
  function gable(x0, x1, yE, yA, n, yB) {
    const pts = [[x0, yB, 1], [x0, yE, 1]], half = (x1 - x0) / 2, top = half * 0.22, sw = (half - top) / n, sh = (yE - yA) / n;
    for (let i = 0; i < n; i++) { pts.push([x0 + i * sw, yE - (i + 1) * sh, 1], [x0 + (i + 1) * sw, yE - (i + 1) * sh, 1]); }
    for (let i = n - 1; i >= 0; i--) { pts.push([x1 - (i + 1) * sw, yE - (i + 1) * sh, 1], [x1 - i * sw, yE - (i + 1) * sh, 1]); }
    pts.push([x1, yE, 1], [x1, yB, 1]);
    return pts;
  }
  function briques(x0, y0, x1, y1, a) {
    for (let y = y0; y < y1; y += 12) { strokePts([[x0, y], [x1, y]], `rgba(40,20,15,${a})`, 0.8); for (let x = x0 + ((y / 12) % 2) * 14; x < x1; x += 28) strokePts([[x, y], [x, y + 12]], `rgba(40,20,15,${a * 0.8})`, 0.7); }
  }
  function makeRue() {
    const ST = M.ST, B = ST.back + 5;
    return M.pre(M.W, B, (x) => {
      const gr = x.createLinearGradient(0, 0, 0, 1000);
      gr.addColorStop(0, '#9fb0b6'); gr.addColorStop(0.5, '#c9c9bd'); gr.addColorStop(1, '#e4dbc6');
      x.fillStyle = gr; x.fillRect(0, 0, M.W, B);
      for (const [cx, cy, r] of [[230, 420, 110], [760, 330, 140]]) { x.fillStyle = 'rgba(250,245,230,0.25)'; x.beginPath(); x.ellipse(cx, cy, r * 1.6, r * 0.5, 0, 0, TAU); x.fill(); }
      // maison gauche : brique, pignon à gradins, enseigne-chope
      pc(gable(20, 330, 560, 330, 5, B), '#86503c', () => {
        briques(20, 330, 330, 1300, 0.18);
        for (const yy of [620, 820]) { win(60, yy, 70, 120, 8501 + yy); win(210, yy, 70, 120, 8503 + yy); }
        win(150, 420, 40, 70, 8511);
        hatch(null, 0.8, 4.6, 0.16, 1, P.encre, [0, 300, 340, B]);
      }, 8500);
      pc(rect(20, 1010, 330, 1290), '#3f4a3a', () => { win(50, 1050, 140, 150, 8520, '#c9b98e'); fillPts(rect(220, 1060, 300, 1290), '#2c2620'); dot(285, 1180, 3, '#c09a48'); hatch(null, 0.8, 4, 0.2); }, 8519);
      strokePts([[330, 960], [400, 960]], '#2a2622', 3); strokePts([[330, 940], [372, 960]], '#2a2622', 2);
      pc(ell(380, 1010, 34, 40, 18), '#b8954e', () => {                                     // enseigne : chope sans lettre
        pc([[366, 990], [390, 990], [392, 1036, 1], [364, 1036, 1]], '#e8dfc6', null, 8531, { drop: false });
        strokePts([[392, 1000], [404, 1006], [404, 1022], [392, 1026]], '#e8dfc6', 3);
        fillPts([[362, 984], [394, 984], [392, 994], [364, 994]], '#f6f2e8');
      }, 8530);
      strokePts([[372, 960], [366, 972]], '#2a2622', 1.4); strokePts([[388, 960], [394, 972]], '#2a2622', 1.4);
      // maison du milieu : enduit ocre
      pc(gable(330, 570, 600, 400, 4, B), '#b79a68', () => {
        for (const yy of [650, 840]) { win(372, yy, 60, 110, 8541 + yy); win(470, yy, 60, 110, 8543 + yy); }
        win(430, 480, 40, 60, 8549);
        pc(rect(350, 1040, 550, 1290), '#6c3a32', () => { win(372, 1070, 160, 130, 8551, '#c9b98e'); hatch(null, 0.8, 4, 0.2); }, 8550);
        hatch(null, 0.8, 4.6, 0.14, 1, P.encre, [320, 380, 580, B]);
      }, 8540);
      // maison d'angle en pierre grise : renfoncement avec la fontaine (centre-droit)
      const NX = MAN.RUE.niche.x;
      pc(gable(570, 900, 520, 300, 5, B), '#9d978a', () => {
        for (let y = 540; y < 1300; y += 40) strokePts([[570, y], [900, y]], 'rgba(50,45,40,0.22)', 1);
        for (const yy of [580, 760]) { win(605, yy, 70, 120, 8561 + yy); win(795, yy, 70, 120, 8563 + yy); }
        win(715, 380, 40, 70, 8569);
        hatch(null, 0.8, 4.6, 0.14, 1, P.encre, [560, 280, 910, B]);
      }, 8560);
      const niche = [[NX - 110, B, 1], [NX - 110, 1060]].concat(ep(NX, 1060, 110, 110, 16, PI, TAU), [[NX + 110, B, 1]]);
      pc(niche.map((p) => [p[0] + (p[0] < NX ? -18 : 18), p[1] - (p[1] < 1060 ? 18 : 0), p[2]]), '#b9b3a5', () => {   // encadrement de pierre
        for (let i = 0; i <= 8; i++) { const a = PI + i * PI / 8; strokePts([[NX + Math.cos(a) * 110, 1060 + Math.sin(a) * 110], [NX + Math.cos(a) * 128, 1060 + Math.sin(a) * 128]], 'rgba(50,45,40,0.4)', 1.2); }
        hatch(null, 0.8, 4, 0.16);
      }, 8570);
      pc(niche, '#4a4640', () => {
        const g2 = x.createLinearGradient(0, 950, 0, B); g2.addColorStop(0, 'rgba(20,18,16,0.55)'); g2.addColorStop(1, 'rgba(20,18,16,0.1)');
        x.fillStyle = g2; x.fillRect(NX - 120, 940, 240, B - 940);
        hatch(null, 0.8, 3.6, 0.22);
      }, 8571, { drop: false });
      pc(ep(NX, 948, 26, 20, 10, PI, TAU).concat([[NX + 22, 952], [NX - 22, 952]]), '#c7c0b0', () => { for (let i = -2; i <= 2; i++) strokePts([[NX, 950], [NX + i * 10, 932]], 'rgba(60,55,45,0.5)', 1); }, 8572);   // coquille sculptée
      // maison droite : brique sombre, lanterne, enseigne-botte
      pc(gable(900, 1080, 560, 380, 3, B), '#704536', () => {
        briques(900, 380, 1080, 1300, 0.2);
        for (const yy of [620, 820]) win(950, yy, 70, 120, 8581 + yy);
        hatch(null, 0.8, 4.6, 0.16, 1, P.encre, [890, 360, 1090, B]);
      }, 8580);
      strokePts([[905, 880], [940, 880], [940, 892]], '#2a2622', 3); strokePts([[905, 860], [930, 880]], '#2a2622', 2);
      pc([[928, 892], [952, 892], [956, 900], [950, 940], [930, 940], [924, 900]], '#2a2622', () => fillPts([[930, 900], [950, 900], [946, 934], [934, 934]], '#e9c87a'), 8590);
      pc([[924, 892], [956, 892], [940, 878]], '#2a2622', null, 8591);
      const gl = x.createRadialGradient(940, 916, 4, 940, 916, 60); gl.addColorStop(0, 'rgba(255,220,150,0.35)'); gl.addColorStop(1, 'rgba(255,220,150,0)'); x.fillStyle = gl; x.fillRect(880, 856, 120, 120);
      strokePts([[1080, 1000], [1020, 1000]], '#2a2622', 3);
      pc([[1018, 1012], [1040, 1012], [1040, 1050], [1062, 1052], [1064, 1066, 1], [1016, 1066, 1]], '#3a2a20', () => strokePts([[1022, 1016], [1022, 1060]], 'rgba(255,255,255,0.2)', 2), 8592);   // botte
      strokePts([[1028, 1000], [1028, 1012]], '#2a2622', 1.4);
      // pavés
      pc(rect(0, 1290, M.W, B), '#5f5a52', () => {
        const R = M.rng(77);
        for (let y = 1294, row = 0; y < B; row++) {
          const hgt = 12 + row * 2.2;
          for (let xx = -20 + (row % 2) * 14; xx < M.W + 20; xx += 30 + row * 3) { const v = R() * 18 | 0; fillPts(ell(xx, y + hgt / 2, (13 + row * 1.4) * (0.85 + 0.2 * R()), hgt / 2 - 1, 10), `rgba(${128 + v},${121 + v},${108 + v},0.95)`); }
          y += hgt;
        }
        hatch(null, 0.2, 5, 0.12);
      }, 8595, { drop: false });
    });
  }
  function makeMusee() {
    const Wd = 820, Hd = 1210;
    const cv = M.cutFlat(Wd, Hd, Wd / 2, Hd - 10, (x) => {
      pc(gable(-370, 370, -900, -1180, 5, 0), '#7f4a3a', () => {                            // façade de brique, pignon à gradins
        briques(-370, -1180, 370, -560, 0.18);
        for (const xx of [-260, -60, 140]) win(xx, -860, 90, 140, 8601 + xx);
        for (const xx of [-260, -60, 140]) win(xx, -700, 90, 120, 8611 + xx);
        pc(ell(0, -1040, 34, 34, 18), '#e2d8c0', () => fillPts(ell(0, -1040, 24, 24, 16), '#3b4552'), 8620);   // œil-de-bœuf
        hatch(null, 0.8, 4.6, 0.15, 1, P.encre, [-380, -1190, 380, 0]);
      }, 8600);
      pc(rect(-380, -572, 380, -540), '#c2b9a2', () => hatch(null, 0.2, 4, 0.2), 8621);      // corniche
      pc(rect(-370, -540, 370, 0), '#3f5442', () => {                                        // devanture vert éteint
        fillPts(rect(-370, -540, 370, -500), '#2f4232');
        for (const xx of [-350, 330]) fillPts(rect(xx, -500, xx + 20, 0), '#33473a');
        hatch(null, 0.8, 4.2, 0.2);
      }, 8622);
      pc(rect(-320, -480, 320, -60), '#2d3438', () => {                                       // vitrine : étagères de mini-costumes
        const cols = ['#1f1c23', '#a8322b', '#c49b3c', '#26252c', '#a8723a', '#2c4a76', '#4f6b3a', '#c8662d', '#cc8d99', '#3a8a84', '#5a4c8e', '#ebe4d1', '#8e2329', '#7a8fa0', '#d9ad2f', '#6b3d2e'];
        const R = M.rng(91); let k = 0;
        for (let row = 0; row < 6; row++) {
          const yb = -410 + row * 66;
          fillPts(rect(-320, yb, 320, yb + 7), '#8a6a44');
          for (let i = 0; i < 12; i++) {
            const xx = -292 + i * 53 + (R() - 0.5) * 6, col = cols[(k++ * 7 + row) % cols.length];
            strokePts([[xx, yb - 52], [xx, yb - 46]], '#b08d45', 1.2);
            fillPts([[xx - 15, yb - 44], [xx + 15, yb - 44], [xx + 4, yb - 47], [xx - 4, yb - 47]], '#7a5532');
            const f = R(), body = f < 0.33 ? [[xx - 6, yb - 44], [xx + 6, yb - 44], [xx + 18, yb - 4, 1], [xx - 18, yb - 4, 1]]
              : [[xx - 6, yb - 44], [xx + 6, yb - 44], [xx + 15, yb - 38], [xx + 16, yb - 18], [xx + 12, yb - 18], [xx + 12, yb - 4, 1], [xx - 12, yb - 4, 1], [xx - 12, yb - 18], [xx - 16, yb - 18], [xx - 15, yb - 38]];
            fillPts(body, col); strokePts(body.concat([body[0]]), 'rgba(15,12,10,0.6)', 0.9);
            if (f > 0.66) fillPts([[xx - 4, yb - 43], [xx + 4, yb - 43], [xx, yb - 30]], '#efe9da');
          }
        }
        for (const [a, b] of [[-300, -200], [-60, 40], [180, 260]]) { x.fillStyle = 'rgba(220,235,240,0.10)'; x.beginPath(); x.moveTo(a, -480); x.lineTo(a + 80, -480); x.lineTo(b - 40, -60); x.lineTo(b - 120, -60); x.fill(); }
      }, 8630);
      pc(rect(-330, -60, 330, -40), '#8a6a44', null, 8631);
      // enseigne-médaillon sans lettre : petit habit sur cintre
      strokePts([[370, -520], [430, -520]], '#2a2622', 3); strokePts([[370, -500], [414, -520]], '#2a2622', 2);
      pc(ell(410, -460, 48, 48, 22), '#b8954e', () => {
        fillPts(ell(410, -460, 38, 38, 20), '#3f5442');
        strokePts([[410, -486], [410, -478]], '#e8dfc6', 2); fillPts([[392, -474], [428, -474], [424, -470], [396, -470]], '#e8dfc6');
        fillPts([[402, -470], [418, -470], [428, -440, 1], [392, -440, 1]], '#a8322b');
      }, 8640);
      strokePts([[394, -520], [396, -506]], '#2a2622', 1.4); strokePts([[426, -520], [424, -506]], '#2a2622', 1.4);
    });
    cv.padB = 10;
    return M.withShadow(cv, 8);
  }
  MAN.RUE = { niche: { x: 730, y: 1395 }, fontaine: { x: 730, y: M.ST.slotB - 6 } };
  MAN.MUSEE = { largeur: 760, hauteur: 1180, vitrine: { x0: -320, x1: 320, haut: -480, bas: -60 } };
  MAN.init = function () {
    if (MAN.K) return MAN.K;
    MAN.K = { rue: makeRue(), musee: makeMusee() };
    return MAN.K;
  };
})();
