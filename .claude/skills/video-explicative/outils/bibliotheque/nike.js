// persos.js — « Le Swoosh de Nike, payé 35 dollars » : marionnettes, accessoires et décors PROPRES À CETTE VIDÉO. Espace M.nik (alias NIK).
// Appeler NIK.init() dans S.init (pré-rendus NIK.K.bureau, NIK.K.studio). Mode d'emploi : persos.md (ne pas lire ce fichier en entier).
// Aucun texte, lettre, chiffre ni logo autre que le Swoosh. Déterministe (hash, aucun Math.random).
(function () {
  'use strict';
  const X = M.X, P = M.P, TAU = M.TAU, PI = Math.PI, D = 180 / PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, hash } = M;
  const NIK = (M.nik = {});
  const CH = M.chars;
  const cx_ = () => M.ctx();
  const SIL = () => M._sil();
  const OFFP = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];

  // ------------------------------------------------------------ géométrie
  function ep(cx, cy, rx, ry, n, a0, a1) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; }
  function ell(cx, cy, rx, ry, n) { const o = ep(cx, cy, rx, ry, n || 16, 0, TAU); o.pop(); return o; }
  const scl = (pts, sx, sy) => { sy = sy == null ? sx : sy; return pts.map((p) => (p[2] ? [p[0] * sx, p[1] * sy, 1] : [p[0] * sx, p[1] * sy])); };
  const tr = (pts, dx, dy) => pts.map((p) => (p[2] ? [p[0] + dx, p[1] + dy, 1] : [p[0] + dx, p[1] + dy]));
  const mp = (m, p) => [m.a * p[0] + m.c * p[1] + m.e, m.b * p[0] + m.d * p[1] + m.f];
  const normA = (a) => { while (a > PI) a -= TAU; while (a < -PI) a += TAU; return a; };
  const rect = (x0, y0, x1, y1) => [[x0, y0, 1], [x1, y0, 1], [x1, y1, 1], [x0, y1, 1]];
  function rrect(x0, y0, x1, y1, r) {
    return ep(x1 - r, y0 + r, r, r, 4, -PI / 2, 0).concat(ep(x1 - r, y1 - r, r, r, 4, 0, PI / 2), ep(x0 + r, y1 - r, r, r, 4, PI / 2, PI), ep(x0 + r, y0 + r, r, r, 4, PI, PI * 1.5));
  }
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
  function mirrored() { const m = cx_().getTransform(); return m.a * m.d - m.b * m.c < 0; }
  // ligne d'écriture illisible (gribouillis horizontal)
  function ecriture(x0, x1, y, seed, col, lw) {
    const o = []; for (let x = x0, i = 0; x <= x1; x += 3, i++) o.push([x, y + Math.sin(i * 1.7 + seed) * 1.6 + (hash(seed * 31 + i) - 0.5) * 1.6]);
    strokePts(o, col || 'rgba(40,48,78,0.62)', lw || 1.1);
  }
  NIK.geo = { ep, ell, rrect, ribbon, scl, tr };

  // bras à articulations rondes (épaule et coude en demi-cercles centrés sur le pivot)
  const R_COUDE = 11.5, LA = 96, LB = Math.hypot(4, 96), PHI = Math.atan2(-4, 96), SH_F = [-2, -146], SH_B = [-10, -146];
  function armR(len, wt) { wt = wt || 15; return ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1, 40], [R_COUDE + 0.5, len - 6]], ep(0, len, R_COUDE, R_COUDE, 10, 0, PI), [[-R_COUDE - 0.5, len - 6], [-wt + 1, 40]]); }
  function foreR(kind) { const f = X.forePts(kind); return ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU).concat(f.slice(2)); }
  // IK deux segments dans le repère du torse ; pick 'bas' (coude le plus bas), 'avant', 'arriere'
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

  // =====================================================================
  // LE SWOOSH — virgule effilée : ventre arrondi à gauche, pointe fine en haut à droite. Largeur W, centre (0,0).
  // =====================================================================
  const SW_N = [[0.11, 0.15, 1], [0.075, 0.19], [0.05, 0.25], [0.06, 0.31], [0.12, 0.352], [0.22, 0.366], [0.34, 0.345], [0.5, 0.29], [0.7, 0.19], [0.88, 0.08],
    [1.0, 0.0, 1], [0.8, 0.085], [0.6, 0.165], [0.44, 0.222], [0.32, 0.25], [0.23, 0.253], [0.18, 0.235], [0.15, 0.2]];
  const swPts = (W) => SW_N.map(([x, y, k]) => (k ? [(x - 0.5) * W, (y - 0.19) * W, 1] : [(x - 0.5) * W, (y - 0.19) * W]));
  const SW_TOPLINE = (W) => [[0.97, 0.02], [0.8, 0.095], [0.6, 0.175], [0.44, 0.232], [0.32, 0.26]].map(([x, y]) => [(x - 0.5) * W, (y - 0.19) * W]);
  // Swoosh plein (carton noir, liseré blanc de découpe) ; col = couleur ; brille 0..1 = reflet qui passe (t)
  function swPlein(W, col, seed, brille, t) {
    pc(swPts(W), col || '#141215', () => {
      strokePts(SW_TOPLINE(W), 'rgba(255,255,255,0.16)', 1.6);
      if (brille > 0 && !SIL()) {
        const u = ((t || 0) * 0.55) % 1, bx = lerp(-0.75 * W, 0.75 * W, u);
        fillPts([[bx - 0.01 * W, -0.4 * W], [bx + 0.03 * W, -0.4 * W], [bx - 0.09 * W, 0.4 * W], [bx - 0.13 * W, 0.4 * W]], `rgba(255,252,240,${0.8 * brille})`, 0, 0);
        fillPts([[bx + 0.05 * W, -0.4 * W], [bx + 0.065 * W, -0.4 * W], [bx - 0.055 * W, 0.4 * W], [bx - 0.07 * W, 0.4 * W]], `rgba(255,252,240,${0.6 * brille})`, 0, 0);
      }
    }, seed || 811);
  }
  // tracé au crayon (graphite) d'un contour fermé, k 0..1 = part du contour tracée ; hachures quand k > 0,7
  function croquisPoly(pts, k, seed, a) {
    a = a == null ? 1 : a; if (k <= 0) return;
    const n = pts.length, m = Math.max(2, Math.round(n * Math.min(1, k) + 1)), line = [];
    for (let i = 0; i < m; i++) line.push(pts[i % n]);
    strokePts(line, `rgba(52,52,64,${0.85 * a})`, 1.7, false, seed);
    strokePts(tr(line, 1.2, -0.8), `rgba(52,52,64,${0.35 * a})`, 0.9, false, seed + 1);
    if (k > 0.7) hatch(pts, 0.75, 4.2, 0.32 * a * clamp((k - 0.7) / 0.3), 0.9, '52,52,64');
  }
  // les 5 projets de Carolyn (variantes qui se ressemblent) : polygones + traits, largeur 200
  function marque(v) {
    const sw = swPts(200);
    if (v === 1) return { polys: [sw], traits: [[[-30, 0], [-22, -16]], [[10, -14], [20, -30]], [[48, -26], [58, -40]]] };   // aile à plumes
    if (v === 2) return { polys: [tr(scl(sw, 1, 0.5), 0, -16), tr(scl(sw, 0.86, 0.42), 12, 20)], traits: [] };                                       // double trait
    if (v === 3) return { polys: [[[-92, -10, 1], [-44, 34, 1], [98, -38, 1], [-38, 14, 1]]], traits: [] };                                             // coche anguleuse
    if (v === 4) return { polys: [sw], traits: [ep(-82, -18, 15, 15, 14, 0, TAU)] };                                                                 // boucle au talon
    return { polys: [sw], traits: [] };                                                                                                            // 0 : le Swoosh retenu
  }
  function dessinMarque(v, k, seed, a) {
    const mq = marque(((v | 0) % 5 + 5) % 5);
    mq.polys.forEach((p, i) => croquisPoly(p, k, seed + i * 7, a));
    if (k > 0.85) for (const tl of mq.traits) if (tl.length) strokePts(tl, `rgba(52,52,64,${0.8 * (a == null ? 1 : a)})`, 1.4);
  }

  // panneau lumineux suspendu (le Swoosh dessus) ; allume 0..1
  function drawPanneau(o) {
    const al = o.allume == null ? 1 : o.allume, c = cx_();
    strokePts([[-112, -96], [-112, -1600]], 'rgba(20,15,10,0.7)', 1.4); strokePts([[112, -96], [112, -1600]], 'rgba(20,15,10,0.7)', 1.4);
    if (al > 0 && !SIL()) {
      c.save(); const g = c.createRadialGradient(0, 0, 40, 0, 0, 260); g.addColorStop(0, `rgba(255,236,170,${0.35 * al})`); g.addColorStop(1, 'rgba(255,236,170,0)');
      c.fillStyle = g; c.fillRect(-280, -280, 560, 560); c.restore();
    }
    pc(rrect(-150, -96, 150, 86, 14), '#6e2a22', () => { hatch(null, 0.2, 4, 0.2); strokePts(rrect(-142, -88, 142, 78, 10), 'rgba(255,220,170,0.25)', 1.2, true); }, 821);
    pc(rrect(-128, -74, 128, 64, 8), M.mixc('#cfc3a2', '#fbf0cc', al), () => { shade(0, -74, 0, 64, 0.18, [-130, -80, 130, 70]); }, 822, { texA: 0.35 });
    for (let i = 0; i < 18; i++) {
      const per = 2 * (272 + 158), d = i / 18 * per;
      let bx, by; if (d < 272) { bx = -136 + d; by = -84; } else if (d < 430) { bx = 136; by = -84 + (d - 272); } else if (d < 702) { bx = 136 - (d - 430); by = 74; } else { bx = -136; by = 74 - (d - 702); }
      dot(bx, by, 6, M.mixc('#7d6f52', '#fff1b0', al));
      if (al > 0.3 && !SIL()) { dot(bx - 1.5, by - 1.5, 2, `rgba(255,255,255,${0.8 * al})`); }
    }
  }
  function drawSwoosh(o) {
    const c = cx_(); c.save();
    if (mirrored() && !o.miroir) c.scale(-1, 1);                // jamais à l'envers à l'écran (sauf o.miroir)
    if (o.panneau) drawPanneau(o);
    if (o.croquis) {
      pc(rrect(-118, -82, 118, 82, 3), '#efe8d6', () => hatch(null, 0.2, 7, 0.06), 831);              // la feuille
      croquisPoly(swPts(200), o.trace == null ? 1 : o.trace, 832);
    } else swPlein(200, o.couleur, 811, o.brille || 0, o.t);
    c.restore();
  }

  // =====================================================================
  // CHAUSSURE DE COURSE 1971 — toile ivoire, semelle gaufrée en gomme ocre. Pointe à GAUCHE par défaut (sens 1) : le Swoosh du flanc
  // se lit alors à l'endroit (pointe vers le talon). 200 × 86 local ; (0,0) = milieu du dessous de la semelle.
  // =====================================================================
  const CHA_SOLE = [[-100, -4], [-98, -13], [-86, -17], [-40, -17], [20, -19], [70, -23], [101, -25], [104, -12], [100, 0, 1], [-92, 0, 1]];
  const CHA_UP = [[-96, -14, 1], [-101, -27], [-92, -40], [-72, -50], [-50, -58], [-30, -67], [-14, -74], [2, -71], [22, -63], [50, -61], [78, -67], [95, -72, 1],
    [103, -52], [104, -30], [100, -21, 1], [40, -19], [-40, -17]];
  const CHA_TONGUE = [[-26, -66], [-22, -82], [-8, -88], [2, -82], [-2, -68]];
  function drawChaussure(o) {
    const c = cx_(), sens = o.sens == null ? 1 : o.sens; c.save(); c.scale(sens, 1);
    pc(CHA_TONGUE, '#d9cfb6', () => hatch(null, 0.8, 3.4, 0.2), 841);
    pc(CHA_UP, o.couleur || '#ebe2cb', () => {
      fillPts([[-104, -10], [-101, -27], [-92, -40], [-74, -50], [-66, -30], [-70, -12]], '#ddd2b6');                       // bout renforcé
      strokePts([[-74, -50], [-66, -30], [-70, -14]], 'rgba(110,95,70,0.5)', 1);
      fillPts([[80, -68], [96, -74], [106, -52], [104, -36], [86, -44]], '#9a3b2c');                                         // talon brique
      strokePts([[-60, -24], [0, -27], [60, -29], [98, -30]], 'rgba(110,95,70,0.45)', 1);                                    // couture
      const ey = [[-60, -51], [-49, -56], [-38, -61], [-27, -66], [-17, -70]];
      for (let i = 0; i < ey.length - 1; i++) { strokePts([ey[i], [ey[i + 1][0] + 4, ey[i + 1][1] + 8]], '#f6f1e2', 2.2); strokePts([[ey[i][0] + 4, ey[i][1] + 8], ey[i + 1]], '#f6f1e2', 2.2); }
      for (const [x, y] of ey) { dot(x, y, 2.4, '#5d5040'); dot(x + 4, y + 8, 2.4, '#5d5040'); }
      hatch(null, 0.8, 4.2, 0.16);
      shade(0, -74, 0, -18, 0.2, [-110, -80, 110, -10]);
      const k = clamp(o.swoosh || 0);
      if (k > 0) {                                                                                                          // le Swoosh se pose sur le flanc
        const cc = cx_(); cc.save(); cc.translate(18, -38); const z = 0.5 * (0.7 + 0.3 * ease(k)); cc.scale(z, z); cc.globalAlpha *= k;
        swPlein(200, '#141215', 842, 0, 0); cc.restore();
      }
    }, 843);
    pc(CHA_SOLE, '#c08a3c', () => {
      for (let x = -90; x <= 96; x += 8) dot(x, -3, 2.4, 'rgba(90,55,20,0.55)');
      strokePts([[-96, -9], [0, -11], [100, -15]], 'rgba(255,240,200,0.35)', 1.2);
      hatch(null, 0.2, 3, 0.18);
    }, 844);
    strokePts([[-8, -86], [-14, -94], [-2, -92]], '#f6f1e2', 1.8); strokePts([[-8, -86], [0, -97], [6, -88]], '#f6f1e2', 1.8);  // nœud
    c.restore();
  }

  // =====================================================================
  // BASKET MODERNE — montante, grosse semelle à bulle d'air, bleu ardoise et blanc, Swoosh noir sur le flanc. Pointe à gauche (sens 1).
  // 250 × 182 local ; (0,0) = milieu du dessous.
  // =====================================================================
  const BAS_UP = [[-118, -40], [-118, -58], [-102, -74], [-72, -88], [-44, -112], [-24, -144], [-10, -170], [12, -178], [40, -160], [70, -160], [100, -172], [118, -168, 1],
    [126, -120], [124, -64], [120, -42, 1]];
  function drawBasket(o) {
    const c = cx_(), sens = o.sens == null ? 1 : o.sens; c.save(); c.scale(sens, 1);
    pc([[-6, -170], [2, -184], [22, -182], [26, -164]], '#eef0ee', null, 851);                                              // languette
    pc(BAS_UP, '#eef0ee', () => {
      fillPts([[-124, -36], [-120, -60], [-102, -76], [-78, -86], [-64, -60], [-70, -36]], '#4a5f78');                    // bout ardoise
      fillPts([[56, -40], [64, -110], [100, -176], [130, -170], [130, -40]], '#4a5f78');                                  // talon ardoise
      fillPts([[-58, -96], [-40, -116], [-22, -148], [-8, -172], [6, -170], [-10, -140], [-30, -104], [-48, -84]], '#4a5f78'); // œillets
      for (let i = 0; i < 6; i++) { const x = lerp(-48, -6, i / 5), y = lerp(-92, -162, i / 5); dot(x, y, 2.6, '#1e242c'); strokePts([[x, y], [x + 16, y + 6]], '#f4f4f0', 2.6); }
      strokePts([[96, -170], [118, -164]], 'rgba(255,255,255,0.5)', 3);                                                    // col rembourré
      hatch(null, 0.8, 4.4, 0.14);
      const cc = cx_(); cc.save(); cc.translate(10, -84); cc.scale(0.82, 0.82); swPlein(200, '#141215', 852, 0, 0); cc.restore();
    }, 853);
    pc([[-120, -8], [-124, -30], [-112, -44], [-40, -44], [60, -46], [122, -48], [128, -30], [124, -8, 1], [-112, -6, 1]], '#f4f3ee', () => {   // semelle intermédiaire
      fillPts(rrect(48, -38, 108, -14, 9), 'rgba(170,205,225,0.85)');                                                       // bulle d'air
      strokePts(rrect(48, -38, 108, -14, 9), '#5d7488', 1.4, true);
      strokePts([[56, -32], [76, -34]], 'rgba(255,255,255,0.9)', 1.8); strokePts([[80, -18], [100, -20]], 'rgba(60,90,110,0.5)', 1.2);
      hatch(null, 0.2, 3.6, 0.1);
    }, 854);
    pc([[-112, -8, 1], [124, -8, 1], [122, 0, 1], [-108, 0, 1]], '#2e3742', null, 855);                                    // semelle d'usure
    c.restore();
  }

  // =====================================================================
  // FEUILLES (objets plats) — tenues DERRIÈRE la marionnette, main sur le bord. (0,0) = milieu du bord bas.
  // =====================================================================
  // calque : feuille translucide bleutée, croquis au crayon (variante 0..4 ; chaussure : dessin de basket avec la marque au flanc)
  function feuilleCalque(o, v, k, seed) {
    pc([[-75, -190, 1], [75, -190, 1], [75, -12], [62, 0, 1], [-75, 0, 1]], 'rgba(220,230,236,0.9)', () => {
      fillPts([[62, 0], [75, -12], [64, -10]], 'rgba(180,195,205,0.9)');
      const c = cx_(); c.save(); if (mirrored() && !o.miroir) c.scale(-1, 1);
      if (o.chaussure) {
        c.save(); c.translate(0, -70); c.scale(0.62, 0.62);
        croquisPoly(CHA_UP, k, seed + 3, 0.9); croquisPoly(CHA_SOLE, k, seed + 4, 0.8);
        c.translate(18, -38); c.scale(0.5, 0.5); dessinMarque(v, k, seed, 1); c.restore();
      } else { c.save(); c.translate(0, -100); c.scale(0.62, 0.62); dessinMarque(v, k, seed, 1); c.restore(); }
      c.restore();
    }, seed, { texA: 0.22 });
  }
  function drawCalque(o) {
    const n = clamp(Math.round(o.n || 1), 1, 3), v = o.variante || 0, k = o.trace == null ? 1 : o.trace, c = cx_();
    for (let i = n - 1; i >= 0; i--) {
      c.save(); if (i) { c.translate(i * 14, -i * 8); c.rotate(i * 0.07); }
      feuilleCalque(o, v + i, i ? 1 : k, 861 + i * 11); c.restore();
    }
  }
  // facture : feuille ivoire, lignes illisibles, colonne de montants en traits, cachet rouge rond sans lettre (cachet 0..1)
  function drawFacture(o) {
    pc([[-70, -180, 1], [70, -180, 1], [70, 0, 1], [-70, 0, 1]], '#efe7d2', () => {
      fillPts(rect(-58, -168, -16, -156), 'rgba(60,66,84,0.55)');
      for (let i = 0; i < 3; i++) ecriture(10, 58 - i * 8, -164 + i * 7, 900 + i, 'rgba(40,48,78,0.45)', 0.9);
      strokePts([[-58, -136], [58, -136]], 'rgba(60,60,70,0.55)', 1.2);
      for (let i = 0; i < 6; i++) { const y = -122 + i * 14; ecriture(-56, -56 + 40 + 40 * hash(i + 3), y, 910 + i); ecriture(30, 30 + 12 + 12 * hash(i + 9), y, 930 + i); }
      strokePts([[22, -132], [22, -38]], 'rgba(60,60,70,0.4)', 1);
      strokePts([[20, -32], [58, -32]], 'rgba(40,40,50,0.7)', 1.2); strokePts([[20, -29], [58, -29]], 'rgba(40,40,50,0.7)', 1.2);
      ecriture(30, 54, -22, 950, 'rgba(40,48,78,0.8)', 1.5);
      const k = o.cachet == null ? 1 : clamp(o.cachet);
      if (k > 0) {
        const z = 1 + 0.5 * (1 - ease(k)), a = 0.85 * k, cxs = -28, cys = -40;
        strokePts(ell(cxs, cys, 22 * z, 22 * z, 22), `rgba(168,40,36,${a})`, 2.6, true);
        strokePts(ell(cxs, cys, 15 * z, 15 * z, 18), `rgba(168,40,36,${a})`, 1.2, true);
        for (let i = 0; i < 12; i++) { const an = i / 12 * TAU; strokePts([[cxs + Math.cos(an) * 17 * z, cys + Math.sin(an) * 17 * z], [cxs + Math.cos(an) * 20 * z, cys + Math.sin(an) * 20 * z]], `rgba(168,40,36,${a})`, 1.2); }
        dot(cxs, cys, 5 * z, `rgba(168,40,36,${a})`);
      }
      hatch(null, 0.3, 6, 0.06);
    }, 871);
  }
  // billets : liasse verte (1..4), sans chiffre ni portrait
  function billet(seed) {
    pc([[-75, -66, 1], [75, -66, 1], [75, 0, 1], [-75, 0, 1]], '#8aa47e', () => {
      strokePts(rect(-69, -60, 69, -6), 'rgba(36,66,40,0.75)', 1.5, true);
      strokePts(rect(-64, -55, 64, -11), 'rgba(36,66,40,0.5)', 0.8, true);
      fillPts(ell(0, -33, 22, 18, 16), '#bfd0b0');
      for (const r of [0.6, 0.85, 1]) strokePts(ell(0, -33, 22 * r, 18 * r, 16), 'rgba(36,66,40,0.55)', 0.9, true);
      for (const [x, y] of [[-56, -47], [56, -47], [-56, -19], [56, -19]]) { strokePts(ell(x, y, 7, 7, 10), 'rgba(36,66,40,0.7)', 1, true); dot(x, y, 2, 'rgba(36,66,40,0.7)'); }
      hatch([[-50, -52], [-26, -52], [-26, -14], [-50, -14]], 0.9, 3, 0.18, 0.8, '30,60,34'); hatch([[26, -52], [50, -52], [50, -14], [26, -14]], -0.9, 3, 0.18, 0.8, '30,60,34');
    }, seed, { texA: 0.5 });
  }
  function drawBillets(o) {
    const n = clamp(Math.round(o.n == null ? 3 : o.n), 1, 4), c = cx_();
    for (let i = n - 1; i >= 0; i--) { c.save(); if (i) { c.translate(i * 9, -i * 7); c.rotate(-i * 0.07); } billet(881 + i); c.restore(); }
  }
  // certificat d'actions : parchemin ivoire à liseré doré, bandeau guilloché, vignette au soleil levant, lignes illisibles, sceau rouge à rubans
  function drawActions(o) {
    pc([[-85, -220, 1], [85, -220, 1], [85, 0, 1], [-85, 0, 1]], '#ece0bf', () => {
      strokePts(rect(-78, -213, 78, -7), '#b08d45', 3.2, true); strokePts(rect(-72, -207, 72, -13), '#b08d45', 1.1, true);
      for (const [x, y] of [[-72, -207], [72, -207], [-72, -13], [72, -13]]) { dot(x, y, 6, '#b08d45'); dot(x, y, 2.4, '#ece0bf'); }
      for (let j = 0; j < 3; j++) { const o2 = []; for (let x = -60; x <= 60; x += 3) o2.push([x, -192 + j * 5 + Math.sin(x * 0.25 + j) * 2.2]); strokePts(o2, 'rgba(120,90,40,0.55)', 1); }
      fillPts(ep(0, -132, 28, 22, 12, PI, TAU), 'rgba(176,141,69,0.55)');
      for (let i = 0; i <= 8; i++) { const an = PI + i / 8 * PI; strokePts([[Math.cos(an) * 32, -132 + Math.sin(an) * 26], [Math.cos(an) * 44, -132 + Math.sin(an) * 36]], 'rgba(120,90,40,0.6)', 1.2); }
      strokePts([[-40, -132], [40, -132]], 'rgba(120,90,40,0.7)', 1.2);
      for (let i = 0; i < 5; i++) ecriture(-60, 60 - 30 * hash(i + 40), -104 + i * 13, 960 + i, 'rgba(60,50,40,0.55)', 1);
      ecriture(-62, -20, -30, 980, 'rgba(30,30,60,0.75)', 1.4);
      const k = o.cachet == null ? 1 : clamp(o.cachet);
      if (k > 0) {
        const z = 1 + 0.4 * (1 - ease(k));
        fillPts([[40, -14], [34, 18], [44, 12], [50, 20], [54, -14]], `rgba(150,36,32,${k})`);
        fillPts([[54, -14], [60, 16], [66, 8], [74, 14], [66, -16]], `rgba(130,30,28,${k})`);
        const s = []; for (let i = 0; i < 18; i++) { const an = i / 18 * TAU, r = (17 + (i % 2) * 2) * z; s.push([56 + Math.cos(an) * r, -32 + Math.sin(an) * r]); }
        fillPts(s, `rgba(168,40,36,${k})`); strokePts(ell(56, -32, 11 * z, 11 * z, 14), `rgba(110,20,20,${0.8 * k})`, 1.2, true);
        dot(52, -36, 3, `rgba(255,200,190,${0.4 * k})`);
      }
      hatch(null, 0.3, 6, 0.07);
    }, 891);
  }

  // =====================================================================
  // ÉCRIN ET BAGUE — écrin de cuir rouge, couvercle doublé de satin ; bague d'or à plateau Swoosh, diamant à facettes qui brille.
  // 156 × 166 local (ouvert) ; (0,0) = milieu du dessous de l'écrin.
  // =====================================================================
  function drawBague(o, cy) {                                                   // cy = y du centre de l'anneau
    const t = o.t || 0, br = o.brille == null ? 1 : o.brille;
    pc(ribbon(ep(0, cy, 30, 32, 28, PI * 0.5 + 0.12, PI * 2.5 - 0.12), 10, 10), '#c9a14a', () => {
      strokePts(ep(0, cy, 33, 35, 20, PI * 1.1, PI * 1.6), 'rgba(255,240,190,0.7)', 1.6);
      hatch(null, 0.7, 3.2, 0.14);
    }, 901);
    pc(ell(0, cy - 34, 40, 15, 22), '#c9a14a', null, 907);                    // monture d'or
    pc(ell(0, cy - 34, 34, 11, 22), '#1d1a1c', () => {                          // plateau d'onyx, Swoosh d'or incrusté
      const c = cx_(); c.save(); c.translate(0, cy - 33); c.scale(0.3, 0.3); swPlein(200, '#f0cf6a', 902, 0, 0); c.restore();
      strokePts(ep(0, cy - 34, 32, 9, 10, PI * 1.1, PI * 1.6), 'rgba(255,255,255,0.3)', 1);
    }, 903, { edge: '#e7c873' });
    const dy = cy - 50;                                                         // diamant (couronne + culasse) dans ses griffes
    for (const sx of [-9, 9]) pc([[sx - 2, dy + 4], [sx + 2, dy + 4], [sx * 1.25 + 1, dy - 10], [sx * 1.25 - 1, dy - 10]], '#c9a14a', null, 904 + sx);
    pc([[-15, dy - 6, 1], [15, dy - 6, 1], [10, dy - 16, 1], [-10, dy - 16, 1]], '#eef6fb', () => {
      strokePts([[-10, dy - 16], [-4, dy - 6], [0, dy - 16], [4, dy - 6], [10, dy - 16]], 'rgba(120,150,170,0.7)', 1);
      fillPts([[-4, dy - 16], [4, dy - 16], [0, dy - 10]], 'rgba(200,225,240,0.9)');
    }, 905, { edge: '#ffffff' });
    pc([[-15, dy - 6, 1], [15, dy - 6, 1], [0, dy + 10, 1]], '#d6e6f0', () => { strokePts([[-6, dy - 6], [0, dy + 10], [6, dy - 6]], 'rgba(110,140,160,0.7)', 1); }, 906, { edge: '#ffffff' });
    if (br > 0 && !SIL()) {
      for (let i = 0; i < 3; i++) {
        const ph = t * 4.2 + i * 2.1, k = Math.max(0, Math.sin(ph)) * br; if (k <= 0.02) continue;
        const [sx, sy] = [[16, dy - 22], [-20, dy - 12], [4, dy - 30]][i], r = 10 + 12 * k;
        fillPts([[sx, sy - r], [sx + 2.4, sy - 2.4], [sx + r, sy], [sx + 2.4, sy + 2.4], [sx, sy + r], [sx - 2.4, sy + 2.4], [sx - r, sy], [sx - 2.4, sy - 2.4]], `rgba(255,255,255,${0.95 * k})`, 0, 0);
      }
    }
  }
  function drawEcrin(o) {
    const k = o.ouvert == null ? 1 : clamp(o.ouvert);
    if (o.ecrin === false) { drawBague(o, -40); return; }
    if (k > 0.02) {                                                             // couvercle ouvert (vu par l'intérieur), charnière derrière
      const h = 76 * ease(k);
      pc(rrect(-76, -60 - h, 76, -56, 6), '#7a1f26', () => {
        fillPts(rect(-68, -54 - h, 68, -58), '#efe6d8'); strokePts([[-68, -58 - h * 0.45], [68, -58 - h * 0.45]], 'rgba(160,140,120,0.35)', 1);
      }, 911);
    }
    pc(rrect(-76, -64, 76, 0, 7), '#7a1f26', () => {
      fillPts(rect(-76, -64, 76, -46), '#a8303a');                                  // velours
      strokePts([[-76, -46], [76, -46]], 'rgba(30,8,10,0.6)', 1.4);
      strokePts([[-68, -20], [68, -20]], 'rgba(255,200,190,0.18)', 1.2);
      hatch(null, 0.7, 3.6, 0.18); shade(0, -64, 0, 0, 0.22, [-76, -64, 76, 0]);
    }, 912);
    if (k < 0.98) pc(rrect(-78, -70 - 4 * (1 - k), 78, -58, 6), '#83252d', () => hatch(null, 0.7, 3.6, 0.2), 913);   // couvercle fermé
    else { drawBague(o, -88); pc(rect(-30, -60, 30, -48), '#a8303a', () => hatch(null, 0.7, 2.8, 0.25), 914); }      // fente de velours devant l'anneau
    pc(rrect(-8, -8, 8, 4, 2), '#c9a14a', null, 915);                                // fermoir
  }
  // crayon à papier (tenu pour dessiner) : pointe vers le bas et vers l'avant
  const CRAYON_A = 1.0;
  function drawCrayon() {
    const c = cx_(); c.save(); c.rotate(CRAYON_A);
    pc([[-46, -4.5, 1], [24, -4.5, 1], [24, 4.5, 1], [-46, 4.5, 1]], '#d4a944', () => { strokePts([[-46, -1], [24, -1]], 'rgba(120,80,20,0.6)', 1); }, 921);
    pc([[-52, -4.5, 1], [-46, -4.5, 1], [-46, 4.5, 1], [-52, 4.5, 1]], '#c27a72', null, 922);
    pc([[24, -4.5, 1], [38, -1.4], [38, 1.4], [24, 4.5, 1]], '#e2c18e', null, 923);
    pc([[36, -1.8, 1], [44, 0, 1], [36, 1.8, 1]], '#3a3a42', null, 924);
    c.restore();
  }

  // ---------------- registre des objets
  // plat : objet plat tenu DERRIÈRE la marionnette ; box = [x0,y0,x1,y1] local ; prise 'bord' (bord proche, défaut) | 'bas' | 'haut' | 'coin' | [x,y]
  const BOX = { swoosh: [-100, -38, 100, 36], calque: [-75, -190, 75, 0], facture: [-70, -180, 70, 0], billets: [-75, -66, 75, 0], actions: [-85, -220, 85, 0] };
  function gripPlat(name) {
    return (o) => {
      const b = BOX[name], pr = o.prise || 'bord';
      if (Array.isArray(pr)) return pr;
      if (pr === 'bas') return [(b[0] + b[2]) / 2, b[3] - 6];
      if (pr === 'haut') return [(b[0] + b[2]) / 2, b[1] + 6];
      if (pr === 'coin') return [b[0] + 12, b[3] - 12];
      return [b[0] + 7, (b[1] + b[3]) / 2];
    };
  }
  const OBJ = {
    swoosh: { draw: drawSwoosh, plat: true, grip: gripPlat('swoosh'), pts: { centre: [0, 0], pointe: [100, -38], crochet: [-78, -8] }, base: [0, 0] },
    calque: { draw: drawCalque, plat: true, grip: gripPlat('calque'), pts: { centre: [0, -95], haut: [0, -190] }, base: [0, 0] },
    facture: { draw: drawFacture, plat: true, grip: gripPlat('facture'), pts: { centre: [0, -90], cachet: [-28, -40] }, base: [0, 0] },
    billets: { draw: drawBillets, plat: true, grip: gripPlat('billets'), pts: { centre: [0, -33] }, base: [0, 0] },
    actions: { draw: drawActions, plat: true, grip: gripPlat('actions'), pts: { centre: [0, -110], sceau: [56, -32] }, base: [0, 0] },
    chaussure: { draw: drawChaussure, sens: true, grip: (o) => [72 * (o.sens == null ? 1 : o.sens), -40], held: { sens: -1 }, pts: { pointe: [-100, -14], talon: [104, -30], flanc: [18, -38], dessus: [-14, -74] }, base: [0, 0] },
    basket: { draw: drawBasket, sens: true, grip: (o) => [96 * (o.sens == null ? 1 : o.sens), -90], held: { sens: -1 }, pts: { pointe: [-120, -30], flanc: [10, -84], talon: [124, -60] }, base: [0, 0] },
    ecrin: { draw: drawEcrin, grip: [42, 4], p2: () => [-42, 4], pts: { diamant: [0, -144], bague: [0, -88], centre: [0, -32] }, base: [0, 0] },
    crayon: { draw: drawCrayon, grip: [-6 * Math.cos(CRAYON_A), -6 * Math.sin(CRAYON_A)], pts: { pointe: [44 * Math.cos(CRAYON_A), 44 * Math.sin(CRAYON_A)] }, base: [0, 0] },
  };
  NIK.OBJ = OBJ;
  const has = (v) => !!(v && v !== 'rien');
  const isPlat = (n) => !!(OBJ[n] && OBJ[n].plat);
  const gripOf = (ob, o) => (typeof ob.grip === 'function' ? ob.grip(o) : ob.grip);
  function heldOpts(name, o, p) { const ob = OBJ[name]; return Object.assign({ t: p.t || 0 }, ob.held || {}, o || {}); }
  function heldDraw(name, o, p) {
    const ob = OBJ[name]; if (!ob) return;
    const oo = heldOpts(name, o, p), g = gripOf(ob, oo), c = cx_();
    c.save(); c.translate(-g[0], -g[1]); ob.draw(oo); c.restore();
  }
  const DOIGTS = [[-13, -9], [9, -11], [12, -4], [12, 6], [6, 11], [-6, 11], [-13, 4]];
  const doigtsPaint = () => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(70,40,30,0.5)', 1); hatch(null, 0.9, 3.4, 0.15); };
  function heldParts(skin, seed) {
    const fF = (p) => has(p.tenu) && (p.handF || 'fist') === 'fist', fB = (p) => ((has(p.tenuB) && (p.handB || 'fist') === 'fist') || p._deux);
    return {
      plat: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 5, pts: OFFP, extra: (p) => { if (has(p.tenu) && isPlat(p.tenu)) heldDraw(p.tenu, p.tenuO, p); } },
      platB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 6, pts: OFFP, extra: (p) => { if (has(p.tenuB) && isPlat(p.tenuB)) heldDraw(p.tenuB, p.tenuBO, p); } },
      objet: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (has(p.tenu) && !isPlat(p.tenu)) heldDraw(p.tenu, p.tenuO, p); } },
      doigts: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 2, pts: (p) => (fF(p) ? DOIGTS : OFFP), paint: doigtsPaint },
      objetB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 3, pts: OFFP, extra: (p) => { if (has(p.tenuB) && !isPlat(p.tenuB)) heldDraw(p.tenuB, p.tenuBO, p); } },
      doigtsB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 4, pts: (p) => (fB(p) && !p._deux ? DOIGTS : OFFP), paint: doigtsPaint },
      doigtsB2: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 7, pts: (p) => (p._deux ? DOIGTS : OFFP), paint: doigtsPaint },
    };
  }
  // point nommé de l'objet tenu (écran) ; r = valeur renvoyée par NIK.phil / NIK.carolyn
  NIK.pt = function (r, nom, arriere) {
    const name = arriere ? r.tenuB : r.tenu, ob = OBJ[name]; if (!ob || !ob.pts[nom]) return null;
    const oo = arriere ? r.tenuBO : r.tenuO, g = gripOf(ob, oo), q = ob.pts[nom];
    const px = ob.sens ? q[0] * (oo.sens == null ? 1 : oo.sens) : q[0];
    return r.w((ob.plat ? 'plat' : 'objet') + (arriere ? 'B' : ''), px - g[0], q[1] - g[1]);
  };

  // =====================================================================
  // POSES — préparation commune (objets tenus, gestes, seconde main)
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
  // gestes communs à Phil et Carolyn (chaque option 0..1, sauf penche −1..1 et pas = phase en rad)
  function gestes(q) {
    const A = q.ang, g = (n) => ease(clamp(q[n] || 0));
    if (q.pas != null) {                                                        // marche : phase en rad (2π = deux pas)
      const sw = Math.sin(q.pas) * 0.32;
      A.legF = (A.legF || 0) + sw; A.legB = (A.legB || 0) - sw; q.dy = (q.dy || 0) - Math.abs(Math.sin(q.pas)) * 7;
      A.armF_up = (A.armF_up || 0) - sw * 0.45; A.armB_up = (A.armB_up || 0) + sw * 0.45;
    }
    const pe = clamp(q.penche || 0, -1, 1);
    if (pe) { const k = Math.sign(pe) * ease(Math.abs(pe)); A.head = (A.head || 0) + 0.35 * k; q.tilt = (q.tilt || 0) + 0.03 * k; if (!q.face.brow && Math.abs(pe) > 0.25) q.face.brow = 'frown'; }
    const fi = g('fier');
    if (fi > 0) {
      plier(q, -0.05 * fi); A.head = (A.head || 0) - 0.1 * fi; q.dy = (q.dy || 0) - 2 * fi;
      armTo(q, 'armF', [-6, -36], 'arriere', fi); armTo(q, 'armB', [-18, -38], 'arriere', fi);
      if (!has(q.tenu)) q.handF = q.handF || 'fist'; if (!has(q.tenuB)) q.handB = q.handB || 'fist';
    }
    const de = g('devant'); if (de > 0) armTo(q, 'armF', q.cibleDevant || [140, -44], 'bas', de);
    const ti = Math.max(g('tient'), g('presente'));
    if (ti > 0) armTo(q, 'armF', [162, -158], 'bas', ti);
    const te = g('tend');
    if (te > 0) { blend(q, 'armF_up', -1.36, te); blend(q, 'armF_lo', -0.14, te); if (!q.handF && !(has(q.tenu) && !isPlat(q.tenu))) q.handF = 'open'; }
    const me = g('menton');
    if (me > 0) { armTo(q, 'armF', headPt(q, 22, 6), 'bas', me); if (!has(q.tenu)) q.handF = q.handF || 'fist'; }
    const ds = g('dessine');
    if (ds > 0) {
      if (!has(q.tenu) && q.tenu !== 'rien') q.tenu = 'crayon';
      const c = q.cible || [166, -73], t = q.t || 0, gr = q.gribouille == null ? 1 : q.gribouille;
      const tip = q.tenu === 'crayon' ? OBJ.crayon.pts.pointe : [0, 0], g0 = q.tenu === 'crayon' ? OBJ.crayon.grip : [0, 0];
      const T = [c[0] - (tip[0] - g0[0]) + gr * 5 * Math.sin(t * 9), c[1] - (tip[1] - g0[1]) + gr * 2.5 * Math.sin(t * 13 + 1)];
      armTo(q, 'armF', T, 'bas', ds); A.head = (A.head || 0) + 0.18 * ds;
    }
    const epi = g('epingle');
    if (epi > 0) { armTo(q, 'armF', q.cibleMur || [62, -300], 'bas', epi); if (!q.handF && !has(q.tenu)) q.handF = 'open'; A.head = (A.head || 0) - 0.2 * epi; }
    const rc = g('recoit');
    if (rc > 0) { blend(q, 'armF_up', -1.0, rc); blend(q, 'armF_lo', -0.85, rc); blend(q, 'armB_up', -0.8, rc); blend(q, 'armB_lo', -0.95, rc); q.handF = q.handF || 'open'; q.handB = q.handB || 'open'; }
  }
  function finish(q) {
    const A = q.ang, tl = q.tilt || 0;
    if (has(q.tenu) && !q.handF) q.handF = 'fist';
    if (has(q.tenuB) && !q.handB) q.handB = 'fist';
    if (q.droit == null && has(q.tenu)) q.droit = true;
    if (q.droitB == null && has(q.tenuB)) q.droitB = true;
    const oF = (A.objet || 0) + (q.droit ? -((A.armF_up || 0) + (A.armF_lo || 0) + tl) : 0);
    const oB = (A.objetB || 0) + (q.droitB ? -((A.armB_up || 0) + (A.armB_lo || 0) + tl) : 0);
    A.objet = oF; A.plat = oF; A.objetB = oB; A.platB = oB;
    q._deux = false;
    if (q.deuxMains && has(q.tenu) && OBJ[q.tenu] && OBJ[q.tenu].p2) {
      const ob = OBJ[q.tenu], oo = heldOpts(q.tenu, q.tenuO, q), g = gripOf(ob, oo);
      const Hf = new DOMMatrix().translate(SH_F[0], SH_F[1]).rotate((A.armF_up || 0) * D).translate(0, LA).rotate((A.armF_lo || 0) * D).translate(4, 96).rotate(oF * D).translate(-g[0], -g[1]);
      const sol = ik2(SH_B, mp(Hf, ob.p2(oo)), 'bas');
      A.armB_up = sol.a; A.armB_lo = sol.b; q.handB = 'fist'; q._deux = true;
    }
    return q;
  }
  function run(def, q, x, y, s, o) {
    const r = M.puppet(def, q, x, y, s, o || {});
    r.tenu = q.tenu; r.tenuB = q.tenuB;
    if (q.tenu && OBJ[q.tenu]) r.tenuO = heldOpts(q.tenu, q.tenuO, q);
    if (q.tenuB && OBJ[q.tenuB]) r.tenuBO = heldOpts(q.tenuB, q.tenuBO, q);
    r.pose = q;
    return r;
  }

  // ---------------- pièces de corps communes
  function foreDef(parent, base, skin, back, seed, sleeveTop, cuff) {
    const hk = (p) => (back ? p.handB : p.handF) || 'fist';
    return { parent, at: [0, LA], pts: (p) => foreR(hk(p)), base, seed, paint: (p) => {
      const k = hk(p);
      fillPts([[-24, -14, 1], [24, -14, 1], [24, 300, 1], [-24, 300, 1]], skin);
      fillPts([[-24, -14, 1], [24, -14, 1], [24, sleeveTop, 1], [-24, sleeveTop, 1]], base);
      if (cuff) cuff(sleeveTop);
      fillPts([[-20, 76, 1], [20, 76, 1], [24, 130, 1], [-20, 130, 1]], skin); X.handPaint(null, k);
      hatch([[-14, -10], [-3, -10], [-3, 70], [-14, 70]], 0.9, 3.8, 0.2);
    } };
  }
  const upDef = (at, base, seed, paint) => ({ parent: 'torso', at, pts: armR(LA), base, seed, paint: paint || (() => hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.26)) });
  const ORDER = (head, afterTorso) => ['plat', 'platB', 'armB_up', 'armB_lo', 'objetB', 'doigtsB', 'legB', 'legF', 'head'].concat(head, ['torso'], afterTorso, ['armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsB2']);

  // =====================================================================
  // PHIL (1971, 33 ans) — chemise bleu ciel manches retroussées, large cravate brique, pantalon tabac, cheveux châtains à raie et
  // rouflaquettes, mâchoire carrée. Ni chapeau ni lunettes.
  // =====================================================================
  const PH = { peau: '#e0b893', peauD: '#c3946f', chemise: '#a9c2d4', chemiseD: '#8ca6ba', chemiseL: '#c8dae6', cravate: '#a6492f', cravateD: '#7d3422',
    pant: '#86643f', pantD: '#6c5032', cuir: '#3b2317', cheveux: '#6e4628', cheveuxD: '#4d2f19', ceinture: '#2d1e16' };
  const PH_TORSO = [[-14, -176], [8, -180], [18, -168], [31, -152], [40, -124], [41, -90], [35, -50], [30, -14], [34, 22, 1], [-36, 22, 1], [-34, -12], [-36, -48], [-41, -96], [-41, -132], [-35, -156], [-26, -170]];
  const PH_HEAD = [[-14, 16], [10, 16], [12, 4], [18, -3], [29, -7, 1], [31, -16], [29, -22], [31, -27], [30, -31], [33, -35], [39, -41, 1], [35, -48], [31, -57], [31, -65], [28, -79], [15, -93], [-6, -98], [-25, -89],
    [-33, -68], [-32, -46], [-27, -22, 1], [-18, -6]];
  const PH_HAIR = [[32, -78], [33, -88], [24, -100], [6, -110], [-16, -108], [-32, -98], [-41, -80], [-45, -60], [-44, -38], [-40, -18], [-32, -12, 1], [-28, -24], [-25, -38], [-18, -52], [-14, -64], [-4, -72], [8, -78], [20, -81], [28, -74, 1]];
  const PH_TIE = [[12, -168], [21, -170], [33, -150], [45, -118], [47, -84], [42, -58, 1], [32, -62], [35, -88], [33, -118], [23, -148]];
  function mkPhil() {
    const shoe = (back) => () => {
      fillPts([[-40, 214, 1], [60, 214, 1], [60, 260, 1], [-40, 260, 1]], PH.cuir);
      fillPts([[-40, 231, 1], [60, 231, 1], [60, 260, 1], [-40, 260, 1]], '#1f140e');
      if (!back) { strokePts([[18, 222], [42, 227]], 'rgba(255,255,255,0.28)', 1.4); hatch([[-24, -20], [-6, -20], [-6, 214], [-24, 214]], 0.8, 4, 0.22); }
      else hatch(null, 0.8, 3.6, 0.3);
      strokePts([[-16, 120], [-14, 200]], 'rgba(40,25,10,0.3)', 1);
    };
    const roll = (y) => { fillPts([[-16, y - 13, 1], [16, y - 13, 1], [17, y + 2, 1], [-16, y + 2, 1]], PH.chemiseL); strokePts([[-15, y - 6], [16, y - 7]], 'rgba(60,80,100,0.6)', 1); };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: PH_TORSO, base: PH.chemise, seed: 7101, paint: () => {
        fillPts([[2, -186], [22, -168], [18, -154], [4, -168]], PH.chemiseL); strokePts([[2, -186], [22, -168], [18, -154]], 'rgba(50,70,90,0.6)', 1.1);     // col pointu
        fillPts(rect(-2, -132, 20, -108), 'rgba(90,120,145,0.25)'); strokePts([[-2, -132], [20, -132], [20, -108], [-2, -108], [-2, -132]], 'rgba(50,70,90,0.5)', 1); dot(9, -126, 1.8, '#e8eef2');
        for (const x of [-20, -6, 10]) strokePts([[x, -14], [x + 3, -6]], 'rgba(50,70,90,0.45)', 1.1);                                                     // chemise rentrée
        fillPts(rect(-38, -10, 36, 2), PH.ceinture); fillPts(rect(22, -12, 32, 4), '#b08d45'); fillPts(rect(25, -8, 29, 0), PH.ceinture);
        fillPts(rect(-40, 2, 38, 30), PH.pant); strokePts([[14, 4], [20, 24]], 'rgba(40,25,10,0.4)', 1);
        hatch([[-52, -170], [-14, -170], [-12, 26], [-52, 26]], 0.75, 4.2, 0.28);
        shade(42, 0, -42, 0, 0.26);
      } },
      cravate: { parent: 'torso', at: [0, 0], pts: PH_TIE, base: PH.cravate, seed: 7102, noRivet: true, paint: () => {
        fillPts([[12, -170], [22, -171], [24, -160], [14, -158]], PH.cravateD);
        for (let k = 0; k < 5; k++) strokePts([[24, -146 + k * 18], [46, -132 + k * 18]], 'rgba(240,200,150,0.35)', 2.2);
        hatch(null, 0.9, 3.4, 0.2);
      } },
      legB: { parent: 'torso', at: [-6, -2], pts: X.legPts(1.0), base: PH.pantD, seed: 7103, noRivet: true, paint: shoe(true) },
      legF: { parent: 'torso', at: [6, -2], pts: X.legPts(1.0), base: PH.pant, seed: 7104, paint: shoe(false) },
      armB_up: upDef([-10, -146], PH.chemiseD, 7105),
      armB_lo: foreDef('armB_up', PH.chemiseD, PH.peauD, true, 7106, 16, roll),
      head: { parent: 'torso', at: [6, -170], pts: PH_HEAD, base: PH.peau, seed: 7107, noRivet: true, paint: (p) => {
        const f = p.face || {};
        X.earPaint(-10, -44);
        fillPts([[-6, -70], [4, -72], [6, -36], [0, -30], [-4, -40]], PH.cheveux);                                         // rouflaquette
        hatch([[-24, -40], [4, -26], [14, -8], [-6, 18], [-32, 2]], 0.6, 3.6, 0.28);
        strokePts([[29, -7], [10, -12], [-4, -20]], 'rgba(120,70,50,0.35)', 1.2);                                            // ligne de mâchoire
        dot(16, -30, 9, 'rgba(205,125,100,0.2)');
        strokePts([[33, -35], [30, -32]], 'rgba(90,50,35,0.6)', 1.2);
        X.eye(f, 18, -51); X.brow(f, 18, -59, 'rgba(60,36,20,0.95)', 3.4); X.mouth(f, 28, -22);
      } },
      cheveux: { parent: 'head', at: [0, 0], pts: PH_HAIR, base: PH.cheveux, seed: 7108, noRivet: true, paint: () => {
        strokePts([[-4, -108], [14, -100], [28, -88], [31, -80]], 'rgba(230,190,140,0.4)', 2);                                // mèche balayée
        strokePts([[-6, -109], [-12, -98]], 'rgba(30,18,8,0.75)', 1.6);                                                     // raie
        for (const [a, b, c2] of [[[-14, -100], [-30, -80], [-38, -50]], [[-4, -96], [-22, -70], [-30, -36]], [[8, -94], [-6, -76], [-16, -58]], [[20, -90], [12, -80], [2, -74]]]) strokePts([a, b, c2], 'rgba(40,24,12,0.5)', 1.1);
        strokePts([[-40, -24], [-34, -14]], 'rgba(230,190,140,0.3)', 1.4);
        hatch(null, 0.5, 3.6, 0.2);
      } },
      armF_up: upDef([-2, -146], PH.chemise, 7109),
      armF_lo: foreDef('armF_up', PH.chemise, PH.peau, false, 7110, 16, roll),
    };
    Object.assign(parts, heldParts(PH.peau, 7120));
    return { nom: 'Phil', hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, order: ORDER(['cheveux'], ['cravate']) };
  }
  CH.nikPhil = mkPhil();
  NIK.philPose = function (p) { const q = prep(p); gestes(q); return finish(q); };
  NIK.phil = (pose, x, y, s, o) => run(CH.nikPhil, NIK.philPose(pose), x, y, s == null ? 0.92 : s, Object.assign({ nom: 'Phil' }, o));

  // =====================================================================
  // CAROLYN (1971, étudiante) — longs cheveux noirs raides à frange, robe trapèze moutarde à col rond ivoire, collants sombres,
  // bottines ; carton à dessin sous le bras (pose.carton).
  // =====================================================================
  const CA = { peau: '#ebcaa8', peauD: '#cda585', robe: '#c49a3c', robeD: '#a47d2c', robeDD: '#8a6922', col: '#f2ebda', collant: '#3e3644', collantD: '#2f2934',
    botte: '#5a3322', cheveux: '#17151a', carton: '#38332f' };
  const CA_TORSO = [[-14, -176], [6, -180], [14, -168], [20, -150], [27, -124], [25, -96], [26, -66], [34, -20], [44, 30], [54, 72, 1], [-52, 74, 1], [-44, 30], [-36, -20], [-30, -66], [-29, -100], [-31, -132], [-29, -154], [-22, -170]];
  const CA_HEAD = [[-12, 16], [8, 16], [9, 2], [14, -6], [20, -9], [24, -14], [23, -19], [25, -22], [24, -25], [26, -29], [31, -35, 1], [28, -42], [25, -51], [25, -60], [21, -73], [10, -83], [-6, -87], [-22, -82], [-30, -66], [-30, -44], [-24, -26], [-16, -8]];
  const CA_HAIR = [[27, -58], [26, -72], [18, -86], [0, -95], [-20, -92], [-34, -78], [-40, -56], [-44, -20], [-48, 30], [-52, 82], [-44, 100, 1], [-30, 96], [-20, 100, 1], [-12, 60], [-6, 20], [-4, -10], [-2, -34], [2, -50], [12, -58]];
  const CA_LEG = [[-12, -10], [12, -12], [14, 40], [12, 110], [10, 160], [8, 200], [9, 216], [30, 222], [38, 232, 1], [-12, 236, 1], [-14, 220], [-12, 200], [-14, 160], [-16, 110], [-15, 40]];
  function mkCarolyn() {
    const legP = (back) => () => {
      fillPts([[-30, 186, 1], [50, 186, 1], [50, 250, 1], [-30, 250, 1]], CA.botte);
      fillPts([[-30, 230, 1], [50, 230, 1], [50, 250, 1], [-30, 250, 1]], '#2a1810');
      strokePts([[-12, 188], [8, 188]], 'rgba(255,230,200,0.25)', 1.4);
      hatch(back ? null : [[-20, 0], [-6, 0], [-6, 186], [-20, 186]], 0.8, 3.6, back ? 0.3 : 0.2);
    };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: CA_TORSO, base: CA.robe, seed: 7201, paint: () => {
        for (const [x0, x1] of [[-6, -14], [8, 20], [-20, -40]]) strokePts([[x0, -120], [(x0 + x1) / 2, -20], [x1, 70]], 'rgba(90,60,10,0.35)', 1.2);
        fillPts(rect(-4, -60, 18, -36), CA.robeD); strokePts([[-4, -60], [18, -60]], 'rgba(90,60,10,0.6)', 1);                    // poche
        for (const y of [-150, -126, -102]) dot(18, y, 2, '#8a6922');
        hatch([[-58, -170], [-16, -170], [-22, 76], [-58, 76]], 0.75, 4.4, 0.26, 1.05, '60,40,10');
        shade(40, 0, -48, 0, 0.24);
      } },
      col: { parent: 'torso', at: [0, 0], pts: [[-14, -174], [4, -178], [14, -170], [20, -154], [10, -148], [2, -158], [-10, -162]], base: CA.col, seed: 7202, noRivet: true,
        paint: () => strokePts([[4, -176], [6, -162], [2, -158]], 'rgba(120,100,70,0.45)', 1) },
      carton: { parent: 'torso', at: [0, 0], pts: (p) => (p.carton ? rrect(-74, -100, 58, 52, 4) : OFFP), base: CA.carton, seed: 7203, noRivet: true, paint: () => {
        fillPts(rect(-74, -100, -62, 52), '#24201d');
        strokePts([[58, -26], [76, -20], [70, -6]], '#141110', 1.8); strokePts([[58, -20], [74, -8], [64, 2]], '#141110', 1.8);
        strokePts([[-60, -92], [52, -92]], 'rgba(255,255,255,0.12)', 1.4);
        hatch(null, 0.4, 4, 0.2);
      } },
      cartonDoigts: { parent: 'armF_lo', at: [4, 96], pts: (p) => (p.carton && !has(p.tenu) ? DOIGTS : OFFP), base: CA.peau, seed: 7210, noRivet: true, paint: doigtsPaint },
      legB: { parent: 'torso', at: [-6, -2], pts: CA_LEG, base: CA.collantD, seed: 7204, noRivet: true, paint: legP(true) },
      legF: { parent: 'torso', at: [6, -2], pts: CA_LEG, base: CA.collant, seed: 7205, paint: legP(false) },
      armB_up: upDef([-10, -146], CA.robeD, 7206),
      armB_lo: foreDef('armB_up', CA.robeD, CA.peauD, true, 7207, 34),
      head: { parent: 'torso', at: [6, -170], pts: CA_HEAD, base: CA.peau, seed: 7208, noRivet: true, paint: (p) => {
        const f = p.face || {};
        hatch([[-22, -40], [0, -28], [8, -8], [-8, 18], [-30, 4]], 0.6, 3.8, 0.2);
        dot(13, -30, 8, 'rgba(215,125,110,0.28)');
        X.eye(f, 15, -45, 0.95); strokePts([[9, -48], [7, -51]], 'rgba(28,16,14,0.9)', 1.2);
        X.brow(f, 15, -53, 'rgba(20,16,18,0.9)', 1.8);
        X.mouth(f, 23, -20, 'rgba(150,60,55,0.9)');
      } },
      cheveux: { parent: 'head', at: [0, 0], pts: CA_HAIR, base: CA.cheveux, seed: 7209, noRivet: true, paint: () => {
        strokePts([[22, -76], [6, -90], [-14, -92]], 'rgba(170,180,210,0.35)', 2);                                          // reflet bleuté
        for (const x of [-36, -28, -20, -12]) strokePts([[x + 6, -70], [x - 2, 20], [x - 6, 90]], 'rgba(120,125,150,0.25)', 1.1);
        strokePts([[26, -60], [14, -60]], 'rgba(120,125,150,0.3)', 1);
        hatch(null, 0.3, 3.4, 0.15);
      } },
      armF_up: upDef([-2, -146], CA.robe, 7211),
      armF_lo: foreDef('armF_up', CA.robe, CA.peau, false, 7212, 34),
    };
    Object.assign(parts, heldParts(CA.peau, 7220));
    const order = ['plat', 'platB', 'armB_up', 'armB_lo', 'objetB', 'doigtsB', 'legB', 'legF', 'head', 'torso', 'col', 'cheveux', 'carton', 'armF_up', 'armF_lo', 'objet', 'doigts', 'cartonDoigts', 'doigtsB2'];
    return { nom: 'Carolyn', hipY: -236, parts, handLen: 100, rod: { part: 'torso', at: [-14, 40] }, order };
  }
  CH.nikCarolyn = mkCarolyn();
  NIK.carolynPose = function (p) {
    const q = prep(p);
    if (q.presente && !q.tenu) { q.tenu = 'calque'; q.tenuO = Object.assign({ n: 3 }, q.tenuO); }
    if (q.carton) {                                                              // le bras avant serre le carton contre le flanc
      const k = q.carton === true ? 1 : clamp(q.carton);
      blend(q, 'armF_up', 0.06, k); blend(q, 'armF_lo', -0.12, k); q.handF = q.handF || 'fist';
    }
    gestes(q); return finish(q);
  };
  NIK.carolyn = (pose, x, y, s, o) => run(CH.nikCarolyn, NIK.carolynPose(pose), x, y, s == null ? 0.92 : s, Object.assign({ nom: 'Carolyn' }, o));

  // =====================================================================
  // ACCESSOIRES SEULS — M.puppet à une pièce invisible ; l'objet se dessine dans l'extra (ombre portée possible)
  // =====================================================================
  const accDefs = {};
  function accDef(name, fn) { return accDefs[name] || (accDefs[name] = { hipY: 0, handLen: 10, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => fn(p.o) } }, order: ['o'] }); }
  function acc(name, x, y, s, o, sDef) {
    o = o || {}; s = s == null ? (sDef || 1) : s;
    const ob = OBJ[name];
    const def = accDef(name, (oo) => { const c = cx_(); c.save(); c.translate(-ob.base[0], -ob.base[1]); ob.draw(oo); c.restore(); });
    const r = M.puppet(def, { o, tilt: o.rot || 0 }, x, y, s, { dir: o.dir || 1, rod: false, slot: o.slot != null ? o.slot : y + 6 * s, floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
    r.pt = (nom) => { const q = ob.pts[nom]; if (!q) return null; const px = ob.sens ? q[0] * (o.sens == null ? 1 : o.sens) : q[0]; return r.w('o', px - ob.base[0], q[1] - ob.base[1]); };
    return r;
  }
  for (const n of Object.keys(OBJ)) NIK[n] = (x, y, s, o) => acc(n, x, y, s, o);
  NIK.bague = (x, y, s, o) => acc('ecrin', x, y, s, o);

  // =====================================================================
  // DÉCORS — toiles de fond plein écran (W × ST.back+5), posées par ctx.drawImage(NIK.K.xxx, 0, 0)
  // =====================================================================
  const ST = M.ST;
  NIK.BUREAU = { libre: [250, 780], fenetre: { x0: 330, x1: 700, y0: 330, y1: 820 }, pendule: { x: 190, y: 420, r: 54 },
    bureau: { x0: 790, x1: 1050, top: 1190 }, etabli: { x0: 50, x1: 240, top: 1150 }, etageres: [{ x0: 770, x1: 1010, y: 560 }, { x0: 770, x1: 1010, y: 730 }] };
  NIK.STUDIO = { fenetre: { x0: 150, x1: 410, y0: 360, y1: 780 }, liege: { x0: 470, x1: 700, y0: 420, y1: 650 },
    table: { x0: 690, y0: 1150, x1: 935, y1: 1045 }, carolyn: { x: 570, dir: 1 }, tabouret: { x: 990, top: 1215 } };
  function toile(x, H) {
    x.globalCompositeOperation = 'multiply'; x.globalAlpha = 0.5; x.fillStyle = M.tex.canvasPat; x.fillRect(0, 0, M.W, H);
    x.globalCompositeOperation = 'source-over'; x.globalAlpha = 0.16; x.fillStyle = '#efe7d4'; x.fillRect(0, 0, M.W, H); x.globalAlpha = 1;
    const vg = x.createLinearGradient(0, H - 140, 0, H); vg.addColorStop(0, 'rgba(40,30,20,0)'); vg.addColorStop(1, 'rgba(40,30,20,0.32)'); x.fillStyle = vg; x.fillRect(0, H - 140, M.W, 140);
  }
  function forme(x0, y0, k, seed) {                                              // forme de cordonnier (bois), pointe à gauche
    pc(tr(scl([[-46, 0, 1], [-50, -12], [-40, -22], [-10, -28], [14, -40], [30, -56, 1], [42, -54, 1], [44, -26], [46, 0, 1]], k), x0, y0), '#c29a68', () => hatch(null, 0.3, 4, 0.18), seed);
  }
  function makeBureau() {
    return M.pre(M.W, ST.back + 5, (x) => {
      const H = ST.back + 5, B = NIK.BUREAU;
      x.fillStyle = '#b8875a'; x.fillRect(0, 0, M.W, H);
      const bh = 34, bw = 92;                                                      // mur de brique ocre
      for (let r = 0; r * bh < H; r++) for (let k = -1; k * bw < M.W + bw; k++) {
        const bx = k * bw + (r % 2 ? bw / 2 : 0), by = r * bh, h = hash(r * 57 + k * 13);
        x.fillStyle = M.mixc('#b47d4d', '#c99a63', h); x.fillRect(bx + 2, by + 2, bw - 4, bh - 4);
        x.fillStyle = 'rgba(255,240,210,0.12)'; x.fillRect(bx + 4, by + 4, bw - 14, 3);
      }
      x.fillStyle = 'rgba(240,226,200,0.18)'; x.fillRect(0, 0, M.W, H);
      // grande fenêtre d'atelier (châssis acier)
      const F = B.fenetre;
      piece(rect(F.x0 - 20, F.y0 - 20, F.x1 + 20, F.y1 + 16), '#3f3c38', () => {
        const g = x.createLinearGradient(0, F.y0, 0, F.y1); g.addColorStop(0, '#dfe7e6'); g.addColorStop(1, '#f1ecd9'); x.fillStyle = g; x.fillRect(F.x0, F.y0, F.x1 - F.x0, F.y1 - F.y0);
        x.fillStyle = '#a9b2ae'; x.beginPath(); x.moveTo(F.x0, F.y1);
        for (let xx = F.x0; xx <= F.x1; xx += 30) x.lineTo(xx, F.y1 - 120 - 40 * hash(xx) - (xx > 520 && xx < 600 ? 90 : 0)); x.lineTo(F.x1, F.y1); x.fill();
        x.fillStyle = '#8c9a8a'; for (const [tx, ty] of [[380, 700], [650, 690]]) { x.beginPath(); x.arc(tx, ty, 46, 0, TAU); x.fill(); x.fillRect(tx - 5, ty, 10, 120); }
        x.fillStyle = 'rgba(255,255,245,0.32)'; x.beginPath(); x.moveTo(F.x0, F.y1 - 60); x.lineTo(F.x0 + 140, F.y0); x.lineTo(F.x0 + 200, F.y0); x.lineTo(F.x0 + 50, F.y1); x.lineTo(F.x0, F.y1); x.fill();
        x.strokeStyle = '#3f3c38'; x.lineWidth = 7; x.beginPath();
        for (let k = 1; k < 4; k++) { const xx = lerp(F.x0, F.x1, k / 4); x.moveTo(xx, F.y0); x.lineTo(xx, F.y1); }
        for (let k = 1; k < 5; k++) { const yy = lerp(F.y0, F.y1, k / 5); x.moveTo(F.x0, yy); x.lineTo(F.x1, yy); } x.stroke();
      }, { seed: 7301 });
      piece(rect(F.x0 - 34, F.y1 + 10, F.x1 + 34, F.y1 + 28), '#7a5a3c', () => hatch(null, 0.1, 3, 0.2), { seed: 7302 });
      // pendule murale (traits seulement)
      const Pd = B.pendule;
      piece(ell(Pd.x, Pd.y, Pd.r, Pd.r, 26), '#5e3f26', null, { seed: 7303 });
      piece(ell(Pd.x, Pd.y, Pd.r - 9, Pd.r - 9, 26), '#efe7d2', () => {
        for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, r0 = i % 3 ? Pd.r - 18 : Pd.r - 24; strokePts([[Pd.x + Math.cos(a) * r0, Pd.y + Math.sin(a) * r0], [Pd.x + Math.cos(a) * (Pd.r - 13), Pd.y + Math.sin(a) * (Pd.r - 13)]], '#2a2420', i % 3 ? 1.2 : 2.6); }
        strokePts([[Pd.x, Pd.y], [Pd.x + 18, Pd.y - 16]], '#2a2420', 3); strokePts([[Pd.x, Pd.y], [Pd.x - 6, Pd.y - 34]], '#2a2420', 2); dot(Pd.x, Pd.y, 3.5, '#2a2420');
      }, { seed: 7304 });
      // étagères de formes à chaussures (au-dessus du bureau)
      B.etageres.forEach((E, i) => {
        piece(rect(E.x0, E.y, E.x1, E.y + 14), '#6e4c30', () => hatch(null, 0.1, 3, 0.2), { seed: 7310 + i });
        for (const bx of [E.x0 + 16, E.x1 - 16]) piece([[bx - 4, E.y + 14, 1], [bx + 4, E.y + 14, 1], [bx + 4, E.y + 40, 1], [bx - 14, E.y + 14, 1]], '#5a3d26', null, { seed: 7312 + bx + i });
        for (let k = 0; k < 4; k++) forme(E.x0 + 50 + k * 56, E.y, 0.62 + 0.06 * hash(k + i * 5), 7320 + k + i * 10);
      });
      // établi de cordonnier (à gauche) : plateau épais, pied de fer avec une forme, marteau, alêne, chutes de cuir
      const T = B.etabli;
      piece(rect(T.x0 + 10, T.top, T.x0 + 30, H), '#5a3d26', null, { seed: 7330 }); piece(rect(T.x1 - 30, T.top, T.x1 - 10, H), '#5a3d26', null, { seed: 7331 });
      piece(rect(T.x0 + 10, H - 70, T.x1 - 10, H - 56), '#5a3d26', null, { seed: 7332 });
      piece(rect(T.x0, T.top - 24, T.x1, T.top + 4), '#8a6340', () => { hatch(null, 0.05, 4, 0.2); strokePts([[T.x0, T.top - 20], [T.x1, T.top - 20]], 'rgba(255,230,190,0.3)', 1.5); }, { seed: 7333 });
      piece([[T.x0 + 120, T.top - 24, 1], [T.x0 + 130, T.top - 24, 1], [T.x0 + 128, T.top - 90, 1], [T.x0 + 122, T.top - 90, 1]], '#4a4a4c', null, { seed: 7334 });
      forme(T.x0 + 126, T.top - 88, 0.85, 7335);
      piece([[T.x0 + 20, T.top - 34, 1], [T.x0 + 70, T.top - 30, 1], [T.x0 + 70, T.top - 25, 1], [T.x0 + 20, T.top - 28, 1]], '#7a5a3a', null, { seed: 7336 });
      piece([[T.x0 + 66, T.top - 40, 1], [T.x0 + 80, T.top - 40, 1], [T.x0 + 80, T.top - 24, 1], [T.x0 + 66, T.top - 24, 1]], '#4a4a4c', null, { seed: 7337 });
      piece([[T.x0 + 150, T.top - 28, 1], [T.x0 + 182, T.top - 34], [T.x0 + 186, T.top - 24, 1]], '#a0522d', null, { seed: 7338 });
      // bureau de bois (centre-droit) : tiroirs, téléphone noir, boîtes à chaussures, papiers à lignes
      const Bu = B.bureau;
      piece(rect(Bu.x0 + 12, Bu.top, Bu.x0 + 90, H), '#6a4628', () => {
        for (let k = 0; k < 3; k++) { const yy = Bu.top + 20 + k * 62; strokePts(rect(Bu.x0 + 20, yy, Bu.x0 + 82, yy + 52), 'rgba(30,18,10,0.6)', 1.4, true); dot(Bu.x0 + 51, yy + 26, 3.2, '#b08d45'); }
        hatch(null, 0.1, 4, 0.2);
      }, { seed: 7340 });
      piece(rect(Bu.x1 - 40, Bu.top, Bu.x1 - 22, H), '#5a3a20', null, { seed: 7341 });
      piece(rect(Bu.x0, Bu.top - 18, Bu.x1, Bu.top + 6), '#7d5533', () => { strokePts([[Bu.x0, Bu.top - 14], [Bu.x1, Bu.top - 14]], 'rgba(255,230,190,0.3)', 1.5); hatch(null, 0.05, 4, 0.18); }, { seed: 7342 });
      piece(rect(Bu.x0 + 120, Bu.top - 78, Bu.x0 + 220, Bu.top - 18), '#c46a2e', () => { fillPts(rect(Bu.x0 + 116, Bu.top - 84, Bu.x0 + 224, Bu.top - 66), '#a9561f'); hatch(null, 0.6, 4, 0.15); }, { seed: 7343 });
      piece(rect(Bu.x0 + 130, Bu.top - 128, Bu.x0 + 214, Bu.top - 84), '#d07a3a', () => fillPts(rect(Bu.x0 + 126, Bu.top - 134, Bu.x0 + 218, Bu.top - 120), '#a9561f'), { seed: 7344 });
      piece([[Bu.x0 + 24, Bu.top - 18, 1], [Bu.x0 + 30, Bu.top - 40], [Bu.x0 + 76, Bu.top - 40], [Bu.x0 + 82, Bu.top - 18, 1]], '#1f1c1c', () => dot(Bu.x0 + 53, Bu.top - 30, 8, '#3a3634'), { seed: 7345 });
      piece([[Bu.x0 + 20, Bu.top - 46, 1], [Bu.x0 + 86, Bu.top - 46, 1], [Bu.x0 + 90, Bu.top - 54], [Bu.x0 + 16, Bu.top - 54]], '#1f1c1c', null, { seed: 7346 });
      piece([[Bu.x0 + 90, Bu.top - 19, 1], [Bu.x0 + 116, Bu.top - 22, 1], [Bu.x0 + 118, Bu.top - 18, 1], [Bu.x0 + 92, Bu.top - 16, 1]], '#efe7d2', null, { seed: 7347 });
      toile(x, H);
    });
  }
  function makeStudio() {
    return M.pre(M.W, ST.back + 5, (x) => {
      const H = ST.back + 5, S = NIK.STUDIO;
      x.fillStyle = '#d8c7a0'; x.fillRect(0, 0, M.W, H);
      for (let k = 0; k * 54 < M.W; k++) {                                         // papier peint 1970 : bandes et fleurs rondes
        x.fillStyle = 'rgba(184,120,70,0.22)'; x.fillRect(k * 54 + 8, 0, 14, H);
        for (let r = 0; r * 80 < H; r++) { const fx = k * 54 + 38, fy = r * 80 + (k % 2) * 40 + 20; x.fillStyle = 'rgba(170,96,50,0.3)'; x.beginPath(); x.arc(fx, fy, 9, 0, TAU); x.fill(); x.fillStyle = 'rgba(236,214,160,0.6)'; x.beginPath(); x.arc(fx, fy, 3.5, 0, TAU); x.fill(); }
      }
      x.fillStyle = 'rgba(240,230,205,0.2)'; x.fillRect(0, 0, M.W, H);
      piece(rect(0, H - 40, M.W, H), '#7a5a3c', null, { seed: 7400 });           // plinthe
      // fenêtre à rideaux
      const F = S.fenetre;
      piece(rect(F.x0 - 14, F.y0 - 14, F.x1 + 14, F.y1 + 14), '#efe8d8', () => {
        const g = x.createLinearGradient(0, F.y0, 0, F.y1); g.addColorStop(0, '#cbd8dc'); g.addColorStop(1, '#eae4cf'); x.fillStyle = g; x.fillRect(F.x0, F.y0, F.x1 - F.x0, F.y1 - F.y0);
        x.fillStyle = '#9fae98'; x.beginPath(); x.moveTo(F.x0, F.y1); for (let xx = F.x0; xx <= F.x1; xx += 26) x.lineTo(xx, F.y1 - 90 - 50 * hash(xx + 3)); x.lineTo(F.x1, F.y1); x.fill();
        x.strokeStyle = '#efe8d8'; x.lineWidth = 8; x.beginPath(); x.moveTo((F.x0 + F.x1) / 2, F.y0); x.lineTo((F.x0 + F.x1) / 2, F.y1); x.moveTo(F.x0, (F.y0 + F.y1) / 2); x.lineTo(F.x1, (F.y0 + F.y1) / 2); x.stroke();
      }, { seed: 7401 });
      piece(rect(F.x0 - 50, F.y0 - 44, F.x1 + 50, F.y0 - 34), '#6a4a30', null, { seed: 7402 });
      for (const [a, b, sd] of [[F.x0 - 46, F.x0 + 40, 7403], [F.x1 - 40, F.x1 + 46, 7404]]) {
        const pts = [[a, F.y0 - 38], [b, F.y0 - 38], [b - 6, F.y0 + 200], [b + 4, F.y1 + 60], [a + 8, F.y1 + 64], [a - 4, F.y0 + 200]];
        piece(pts, '#b8693a', () => {
          for (let yy = F.y0 - 20; yy < F.y1 + 60; yy += 46) for (let xx = a + 10; xx < b; xx += 28) { x.fillStyle = 'rgba(240,200,120,0.45)'; x.beginPath(); x.arc(xx + (yy % 92 ? 14 : 0), yy, 9, 0, TAU); x.fill(); }
          for (let xx = a + 12; xx < b; xx += 16) strokePts([[xx, F.y0 - 36], [xx + 2, F.y1 + 60]], 'rgba(80,30,10,0.25)', 1.2);
        }, { seed: sd });
      }
      // panneau de liège et feuilles épinglées (croquis sans texte)
      const L = S.liege;
      piece(rect(L.x0, L.y0, L.x1, L.y1), '#b48a5c', () => { for (let i = 0; i < 160; i++) dot(L.x0 + hash(i) * (L.x1 - L.x0), L.y0 + hash(i + 400) * (L.y1 - L.y0), 1.4, 'rgba(90,60,30,0.35)'); }, { seed: 7410 });
      strokePts(rect(L.x0 + 6, L.y0 + 6, L.x1 - 6, L.y1 - 6), 'rgba(70,45,25,0.5)', 2, true);
      [[L.x0 + 20, L.y0 + 22, -0.06], [L.x0 + 128, L.y0 + 16, 0.05], [L.x0 + 66, L.y0 + 118, 0.03]].forEach(([fx, fy, rot], i) => {
        x.save(); x.translate(fx + 40, fy + 50); x.rotate(rot);
        piece(rect(-40, -50, 40, 50), '#efe8d6', () => {
          if (i === 0) { x.save(); x.translate(0, 8); x.scale(0.34, 0.34); croquisPoly(CHA_UP, 1, 7420, 0.8); croquisPoly(CHA_SOLE, 1, 7421, 0.7); x.restore(); }
          else if (i === 1) { strokePts(ep(0, 0, 24, 18, 16, 0, TAU), 'rgba(52,52,64,0.7)', 1.4, true); strokePts([[-26, 26], [26, -26]], 'rgba(52,52,64,0.6)', 1.2); }
          else { for (let k = 0; k < 4; k++) strokePts(ep(-10 + k * 6, 10, 16 + k * 4, 12 + k * 3, 10, PI, TAU), 'rgba(52,52,64,0.6)', 1.2); }
        }, { seed: 7425 + i });
        dot(0, -42, 4, '#b03a2e'); dot(-1, -43, 1.4, 'rgba(255,255,255,0.7)');
        x.restore();
      });
      // table à dessin inclinée sur tréteau, lampe d'architecte pincée au bord haut, feuille posée
      const Tb = S.table, ang = Math.atan2(Tb.y1 - Tb.y0, Tb.x1 - Tb.x0);
      const mid = [(Tb.x0 + Tb.x1) / 2, (Tb.y0 + Tb.y1) / 2];
      piece([[mid[0] - 70, H, 1], [mid[0] - 8, mid[1] + 20, 1], [mid[0] + 8, mid[1] + 20, 1], [mid[0] - 50, H, 1]], '#6e4c30', null, { seed: 7430 });
      piece([[mid[0] + 50, H, 1], [mid[0] - 8, mid[1] + 20, 1], [mid[0] + 8, mid[1] + 20, 1], [mid[0] + 70, H, 1]], '#6e4c30', null, { seed: 7431 });
      piece(rect(mid[0] - 64, H - 90, mid[0] + 64, H - 78), '#5a3d26', null, { seed: 7432 });
      x.save(); x.translate(Tb.x0, Tb.y0); x.rotate(ang);
      const Lt = Math.hypot(Tb.x1 - Tb.x0, Tb.y1 - Tb.y0);
      piece(rect(-6, 0, Lt + 6, 16), '#8a6340', () => hatch(null, 0.05, 4, 0.2), { seed: 7433 });
      piece(rect(30, -3, Lt - 40, 1), '#f1ead8', null, { seed: 7434, drop: false });
      x.restore();
      const lb = [Tb.x1 - 6, Tb.y1 - 4], j1 = [Tb.x1 + 10, Tb.y1 - 150], j2 = [Tb.x1 - 110, Tb.y1 - 190], hd = [Tb.x1 - 150, Tb.y1 - 130];
      strokePts([lb, j1, j2], '#3a3a3c', 4); strokePts([lb, j1, j2], 'rgba(200,200,200,0.4)', 1.2);
      piece([[j2[0] + 6, j2[1] - 6], [j2[0] - 8, j2[1] + 6], [hd[0] - 30, hd[1] + 18, 1], [hd[0] + 26, hd[1] + 34, 1]], '#2f5b4f', () => fillPts([[hd[0] - 26, hd[1] + 18], [hd[0] + 22, hd[1] + 32], [hd[0] - 4, hd[1] + 34]], '#fff2b8'), { seed: 7435 });
      for (const p of [lb, j1, j2]) dot(p[0], p[1], 4, '#b08d45');
      // tabouret
      const Tf = S.tabouret;
      piece(rect(Tf.x - 40, Tf.top, Tf.x + 40, Tf.top + 14), '#8a6340', null, { seed: 7440 });
      piece([[Tf.x - 34, Tf.top + 14, 1], [Tf.x - 24, Tf.top + 14, 1], [Tf.x - 40, H, 1], [Tf.x - 50, H, 1]], '#6e4c30', null, { seed: 7441 });
      piece([[Tf.x + 24, Tf.top + 14, 1], [Tf.x + 34, Tf.top + 14, 1], [Tf.x + 50, H, 1], [Tf.x + 40, H, 1]], '#6e4c30', null, { seed: 7442 });
      piece(rect(Tf.x - 40, Tf.top + 100, Tf.x + 40, Tf.top + 108), '#6e4c30', null, { seed: 7443 });
      toile(x, H);
    });
  }
  NIK.init = function () {
    if (NIK.K) return NIK.K;
    const K = (NIK.K = {});
    K.bureau = makeBureau(); K.studio = makeStudio();
    return K;
  };
})();
