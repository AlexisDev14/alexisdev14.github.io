// persos.js — « Fleming, le désordre qui inventa la pénicilline » (Londres 1928) : marionnettes, accessoires et décors PROPRES À CETTE VIDÉO.
// Espace M.fle (alias FLE). Appeler FLE.init() dans S.init. Mode d'emploi : persos.md (ne pas lire ce fichier en entier).
// Aucun texte, lettre, chiffre ni logo. Déterministe (hash, aucun Math.random) : tout dépend de t.
(function () {
  'use strict';
  const X = M.X, P = M.P, TAU = M.TAU, PI = Math.PI, D = 180 / PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, hash } = M;
  const FLE = (M.fle = {});
  const CH = M.chars, ST = M.ST;
  const cx_ = () => M.ctx(), SIL = () => M._sil();
  const OFFP = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];
  const has = (v) => v && v !== 'rien';

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
  function rrect(x0, y0, x1, y1, r) {
    return ep(x1 - r, y0 + r, r, r, 4, -PI / 2, 0).concat(ep(x1 - r, y1 - r, r, r, 4, 0, PI / 2), ep(x0 + r, y1 - r, r, r, 4, PI / 2, PI), ep(x0 + r, y0 + r, r, r, 4, PI, PI * 1.5));
  }
  const rect = (x0, y0, x1, y1) => [[x0, y0, 1], [x1, y0, 1], [x1, y1, 1], [x0, y1, 1]];
  function blobPts(cx, cy, rx, ry, n, seed, amp) {
    const o = []; for (let i = 0; i < n; i++) { const a = i / n * TAU, k = 1 + amp * (0.55 * Math.sin(a * 5 + seed) + 0.9 * (hash(i * 3.3 + seed) - 0.5)); o.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); } return o;
  }
  FLE.geo = { ep, ell, ribbon, qbez, rrect, blobPts };
  const pc = (pts, base, paint, seed, o) => piece(pts, base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));
  function worldPt(x, y) { return mp(cx_().getTransform(), [x, y]); }

  // bras à articulations rondes (épaule et coude en demi-cercles centrés sur le pivot)
  const R_COUDE = 11.5, LA = 96;
  function armR(len, wt) { wt = wt || 14; return ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1, 40], [R_COUDE + 0.5, len - 6]], ep(0, len, R_COUDE, R_COUDE, 10, 0, PI), [[-R_COUDE - 0.5, len - 6], [-wt + 1, 40]]); }
  function foreR(kind) { const f = X.forePts(kind); return ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU).concat(f.slice(2)); }

  // =====================================================================
  // BOÎTE DE PETRI — cultures communes (vue de 3/4 et grande vue de dessus : même tirage)
  // =====================================================================
  const GEL = '#d8c27a', GELD = '#c2a85e', MOIS = '#5f8a7a', MOISD = '#4b7466', COLON = '#f6efd8';
  const COL = (() => { const a = []; for (let i = 0; i < 72; i++) { const an = hash(i * 12.97 + 3.1) * TAU, rr = 0.1 + Math.sqrt(hash(i * 7.31 + 1.7)) * 0.8; a.push({ u: Math.cos(an) * rr, v: Math.sin(an) * rr, r: 0.035 + 0.03 * hash(i * 3.77 + 5.3), th: hash(i * 5.13 + 9.1) * 0.8 }); } return a; })();
  const MOLD = { u: -0.16, v: 0.05, r: 0.4, halo: 0.26 };
  const moldR = (m) => (m > 0.005 ? MOLD.r * (0.12 + 0.88 * m) : 0);
  function cultures(o, kx, ky, cy, gros) {
    const b = clamp(o.bacteries || 0), m = clamp(o.moisissure || 0), h = clamp(o.halo || 0);
    const mr = moldR(m), hr = mr + MOLD.halo * h, mx = MOLD.u * kx, my = cy + MOLD.v * ky, ha = Math.min(1, h * 2.5);
    if (mr > 0 && h > 0.01) {
      fillPts(ell(mx, my, hr * kx, hr * ky, 36), `rgba(246,239,206,${0.92 * ha})`);
      strokePts(ell(mx, my, hr * kx, hr * ky, 36).concat([[mx + hr * kx, my]]), `rgba(140,108,40,${0.75 * ha})`, gros ? 2.2 : 1.2);
    }
    if (b > 0) for (let i = 0; i < (gros ? COL.length : 36); i++) {
      const cl = COL[i], rk = gros ? 1.25 : 1.55;
      if (b <= cl.th) continue;
      const g = clamp((b - cl.th) / 0.2), d = Math.hypot(cl.u - MOLD.u, cl.v - MOLD.v);
      if (mr > 0 && d < Math.max(mr * 0.9, h > 0.01 ? hr + cl.r * 0.6 : 0)) continue;
      const rx = rk * cl.r * kx * (0.45 + 0.55 * g), ry = rk * cl.r * ky * (0.45 + 0.55 * g), px = cl.u * kx, py = cy + cl.v * ky;
      fillPts(ell(px, py + ry * 0.3, rx * 1.12, ry * 1.12, 10), 'rgba(140,100,35,0.6)');
      fillPts(ell(px, py, rx, ry, 10), COLON);
      if (gros) dot(px - rx * 0.3, py - ry * 0.35, rx * 0.3, 'rgba(255,255,255,0.85)');
    }
    if (mr > 0) {
      const n = gros ? 44 : 24;
      fillPts(blobPts(mx, my, mr * kx * 1.17, mr * ky * 1.17, n, 2.1, 0.1), '#f5f3e8');
      fillPts(blobPts(mx, my, mr * kx, mr * ky, n, 2.1, 0.1), MOIS);
      fillPts(blobPts(mx, my, mr * kx * 0.55, mr * ky * 0.55, n, 4.3, 0.14), MOISD);
      for (let i = 0; i < (gros ? 30 : 10); i++) { const a = hash(i * 4.1) * TAU, rr = Math.sqrt(hash(i * 6.7)) * mr * 0.85; dot(mx + Math.cos(a) * rr * kx, my + Math.sin(a) * rr * ky, (gros ? 2.8 : 1.1) * (0.6 + hash(i + 0.5) * 0.6), 'rgba(178,212,196,0.85)'); }
      if (gros) for (let i = 0; i < 56; i++) { const a = i / 56 * TAU, r0 = mr * 1.0, r1 = mr * (1.16 + 0.06 * hash(i)); strokePts([[mx + Math.cos(a) * r0 * kx, my + Math.sin(a) * r0 * ky], [mx + Math.cos(a + 0.04) * r1 * kx, my + Math.sin(a + 0.04) * r1 * ky]], 'rgba(255,255,250,0.9)', 1.3); }
    }
  }
  // boîte de 3/4 : origine = centre du fond (point posé sur la table) ; 100 × 54 local
  const BX = { rx: 50, ry: 21, h: 12, agY: -5, arx: 45, ary: 18.5 };
  const LID = { rx: 53, ry: 22.5, h: 8 };
  const boiteSil = () => ep(0, -BX.h, BX.rx, BX.ry, 14, PI, TAU).concat(ep(0, 0, BX.rx, BX.ry, 14, 0, PI));
  function drawBoite(o) {
    const c = cx_();
    pc(boiteSil(), '#cfe0e5', () => {
      fillPts(ep(0, BX.agY, BX.arx, BX.ary, 14, PI, TAU).concat(ep(0, BX.agY + 5, BX.arx, BX.ary, 14, 0, PI)), GELD);
      fillPts(ell(0, BX.agY, BX.arx, BX.ary, 28), GEL);
      strokePts(ep(0, BX.agY, BX.arx - 3, BX.ary - 2, 10, PI * 1.1, PI * 1.6), 'rgba(255,245,210,0.55)', 1.4);
      cultures(o, BX.arx * 0.9, BX.ary * 0.9, BX.agY, false);
      fillPts(ep(0, -BX.h, BX.rx, BX.ry, 14, PI, 0).concat(ep(0, 0, BX.rx, BX.ry, 14, 0, PI)), 'rgba(225,242,248,0.32)');
      strokePts(ep(0, -BX.h + 5, BX.rx - 4, BX.ry - 1, 6, PI * 0.62, PI * 0.86), 'rgba(255,255,255,0.85)', 2.2);
    }, 8101, { texA: 0.15 });
    strokePts(ell(0, -BX.h, BX.rx, BX.ry, 30).concat([[BX.rx, -BX.h]]), 'rgba(255,255,255,0.95)', 1.7);
    strokePts(ep(0, -BX.h, BX.rx, BX.ry, 8, PI * 1.15, PI * 1.45), 'rgba(255,255,255,1)', 2.6);
    strokePts(ep(0, 0, BX.rx, BX.ry, 14, 0, PI), 'rgba(80,110,125,0.6)', 1.2);
    const k = clamp(o.couvercle || 0);
    if (k > 0.01) {
      c.save(); c.translate(0, -8 - (1 - k) * 40);
      if (!SIL() && k < 1) c.globalAlpha *= k;
      drawCouvercle({});
      c.restore();
    }
  }
  // couvercle seul : origine = centre du bord inférieur de la jupe ; 106 × 53 local
  function drawCouvercle(o) {
    const sil = ep(0, -LID.h, LID.rx, LID.ry, 14, PI, TAU).concat(ep(0, 0, LID.rx, LID.ry, 14, 0, PI));
    pc(sil, o.pile ? 'rgba(200,222,230,0.82)' : 'rgba(220,238,244,0.22)', () => {
      fillPts(ell(0, -LID.h, LID.rx - 2, LID.ry - 1, 24), o.pile ? 'rgba(232,244,248,0.55)' : 'rgba(240,250,252,0.1)');
      strokePts(ep(0, -LID.h + 3, LID.rx - 5, LID.ry - 2, 6, PI * 0.15, PI * 0.4), 'rgba(255,255,255,0.8)', 2);
    }, 8201, { texA: 0.1, drop: !!o.pile });
    strokePts(ell(0, -LID.h, LID.rx, LID.ry, 30).concat([[LID.rx, -LID.h]]), 'rgba(255,255,255,0.95)', 1.5);
    strokePts(ep(0, -LID.h, LID.rx, LID.ry, 8, PI * 1.12, PI * 1.42), 'rgba(255,255,255,1)', 2.4);
    strokePts(ep(0, 0, LID.rx, LID.ry, 14, 0, PI), 'rgba(80,110,125,0.65)', 1.2);
  }
  // pile de couvercles : origine = centre du bas de la pile ; ≈ 106 × 120 local (7 couvercles)
  const PILE = { pas: 10 };
  function pileOff(o, i) {
    const lean = (o.penche || 0) * 0.62 * Math.sin((o.t || 0) * 3.2);
    return { dx: 3 * Math.sin(i * 2.3 + 1) + lean * i * i * 0.9, rot: 0.035 * Math.sin(i * 1.9 + 0.4) + lean * 0.02 * i, dy: -i * PILE.pas };
  }
  function drawPile(o) {
    const c = cx_(), n = o.n == null ? 7 : o.n, vis = Math.max(0, n - (o.moins | 0));
    for (let i = 0; i < vis; i++) { const f = pileOff(o, i); c.save(); c.translate(f.dx, f.dy); c.rotate(f.rot); drawCouvercle({ pile: true }); c.restore(); }
  }
  // spore : origine = centre ; ≈ 40 local de diamètre (filaments compris)
  function drawSpore(o) {
    const t = o.t || 0;
    for (let i = 0; i < 15; i++) {
      const a = i / 15 * TAU + 0.18 * Math.sin(t * 2 + i), l = 16 + 4.5 * hash(i * 2.7 + 0.3);
      strokePts([[Math.cos(a) * 8, Math.sin(a) * 8], [Math.cos(a + 0.14) * l * 0.7, Math.sin(a + 0.14) * l * 0.7], [Math.cos(a) * l, Math.sin(a) * l]], 'rgba(205,228,216,0.95)', 1.4);
      dot(Math.cos(a) * l, Math.sin(a) * l, 1.9, '#e6f1ea');
    }
    pc(blobPts(0, 0, 11, 11, 14, 1.3, 0.12), MOIS, () => { dot(-3, -3, 4.5, 'rgba(200,232,216,0.5)'); for (let i = 0; i < 6; i++) dot(Math.cos(i * 1.1) * 6, Math.sin(i * 1.1) * 6, 1.3, 'rgba(230,245,236,0.8)'); hatch(null, 0.8, 2.6, 0.25); }, 8301, { texA: 0.3 });
  }
  // grande boîte vue de dessus : origine = centre ; disque de 346 local (rayon 165 + carton 8)
  const GB = { R: 165 };
  function drawGrande(o) {
    const R = GB.R;
    pc(ell(0, 0, R + 8, R + 8, 48), '#8a6c4c', () => hatch(null, 0.6, 3, 0.22), 8401);
    pc(ell(0, 0, R, R, 56), '#d3e2e6', () => {
      fillPts(ell(0, 0, R - 13, R - 13, 56), GELD);
      fillPts(ell(-2, -3, R - 17, R - 17, 56), GEL);
      for (const k of [0.45, 0.7, 0.9]) strokePts(ell(-2, -3, (R - 17) * k, (R - 17) * k, 40).concat([[(R - 17) * k - 2, -3]]), 'rgba(170,140,70,0.18)', 1.2);
      cultures(o, R - 24, R - 24, 0, true);
      strokePts(ell(0, 0, R - 12, R - 12, 56).concat([[R - 12, 0]]), 'rgba(255,255,255,0.75)', 1.8);
      strokePts(ep(0, 0, R - 5, R - 5, 16, PI * 1.08, PI * 1.45), 'rgba(255,255,255,0.9)', 3.2);
      strokePts(ep(0, 0, R - 5, R - 5, 8, PI * 0.08, PI * 0.24), 'rgba(255,255,255,0.65)', 2.2);
      strokePts(ep(0, 0, R * 0.7, R * 0.7, 10, PI * 1.15, PI * 1.35), 'rgba(255,255,255,0.35)', 5);
    }, 8402, { texA: 0.18 });
    for (const sx of [-1, 1]) M.rivet(sx * R * 0.62, -R * 0.8, 4);
  }

  // =====================================================================
  // VALISE, CHAPEAU, POUBELLE
  // =====================================================================
  // valise : origine = milieu du bas ; 140 × 124 local (poignée comprise)
  const CUIR = '#a8784a', CUIRD = '#6b4528', LAITON = '#c9a54e', LAITOND = '#8a6d2c';
  function drawValise() {
    pc(ribbon(qbez([-20, -100], [-20, -127], [0, -125], 8).concat(qbez([0, -125], [20, -127], [20, -100], 8).slice(1)), 7, 7), CUIRD, () => strokePts([[-14, -118], [0, -121], [14, -118]], 'rgba(255,220,180,0.3)', 1.2), 8501);
    for (const sx of [-1, 1]) pc(rect(sx * 20 - 6, -106, sx * 20 + 6, -98), LAITON, null, 8502 + sx);
    pc(rrect(-70, -100, 70, 0, 10), CUIR, () => {
      strokePts(rrect(-64, -94, 64, -6, 7).concat([[54, -94]]), 'rgba(70,40,20,0.45)', 1);
      strokePts([[-70, -76], [70, -76]], 'rgba(60,35,20,0.6)', 1.4);
      for (const sx of [-1, 1]) {
        fillPts(rect(sx * 40 - 6, -100, sx * 40 + 6, 0), CUIRD);
        fillPts(rect(sx * 40 - 8, -72, sx * 40 + 8, -60), LAITON); fillPts(rect(sx * 40 - 4, -69, sx * 40 + 4, -63), CUIRD);
        fillPts([[sx * 70, -100], [sx * 56, -100], [sx * 56, -94], [sx * 64, -94], [sx * 64, -86], [sx * 70, -86]], LAITON);
        fillPts([[sx * 70, 0], [sx * 56, 0], [sx * 56, -6], [sx * 64, -6], [sx * 64, -14], [sx * 70, -14]], LAITON);
      }
      strokePts([[-60, -90], [-20, -92]], 'rgba(255,230,190,0.35)', 2);
      hatch(null, 0.5, 4, 0.16); shade(0, -100, 0, 0, 0.22, [-72, -102, 72, 2]);
    }, 8505);
  }
  // feutre mou : origine = milieu du bas de la calotte (sur la tête : au front) ; 116 × 62 local
  const FEUTRE = '#7a5a3a', FEUTRED = '#5e442b';
  const HAT = [[-54, 5], [-50, 0], [-34, -2], [-34, -26], [-30, -42], [-16, -50], [-2, -45], [12, -52], [26, -48], [33, -36], [35, -22], [34, -2], [50, -1], [60, 4], [57, 9], [34, 8], [0, 9], [-32, 7], [-52, 10]];
  const HAT_G = [52, 3];
  function drawChapeau() {
    pc(HAT, FEUTRE, () => {
      fillPts([[-36, -3], [36, -3], [36, -15], [-35, -16]], '#1c1918');
      fillPts([[-36, -14], [-42, -20], [-40, -6], [-36, -5]], '#1c1918');
      strokePts([[-20, -46], [-2, -39], [14, -46]], 'rgba(35,22,10,0.55)', 1.4);
      strokePts([[-26, -38], [-25, -18]], 'rgba(255,230,190,0.25)', 2.2);
      strokePts([[-52, 6], [0, 7], [57, 6]], 'rgba(35,22,10,0.45)', 1.1);
      fillPts([[-54, 6], [60, 5], [57, 10], [-52, 11]], FEUTRED);
      hatch(null, 0.7, 3.6, 0.22); shade(30, 0, -34, 0, 0.25, [-60, -56, 62, 12]);
    }, 8601, { texA: 0.5 });
  }
  // poubelle à pédale : origine = milieu du bas ; 106 × 122 local (pédale comprise)
  const EMAIL = '#e6dcc0', CERCLE = '#3b4249';
  function drawPoubelle(o) {
    const c = cx_(), a = ease(clamp(o.ouvert || 0)) * 1.2;
    pc([[36, -10, 1], [60, -7, 1], [60, -2, 1], [36, -3, 1]], '#2f3438', null, 8701);
    pc([[-40, 0, 1], [40, 0, 1], [43, -98, 1], [-43, -98, 1]], EMAIL, () => {
      fillPts(rect(-48, -13, 48, 2), CERCLE); fillPts(rect(-48, -98, 48, -90), CERCLE);
      strokePts([[-26, -84], [-24, -18]], 'rgba(255,255,255,0.55)', 3.2);
      fillPts([[-38, -24], [-30, -22], [-31, -16], [-38, -18]], 'rgba(60,50,40,0.25)');
      hatch([[10, -90], [44, -90], [44, -12], [10, -12]], 0.9, 3.6, 0.18); shade(42, 0, -42, 0, 0.3, [-50, -100, 50, 2]);
    }, 8702);
    if (a > 0.02) fillPts(ell(0, -98, 41, 6.5, 16), '#221d1a');
    c.save(); c.translate(-44, -98); c.rotate(-a); c.translate(44, 98);
    pc([[-46, -97, 1], [46, -97, 1], [45, -104], [32, -114], [0, -119], [-32, -114], [-45, -104]], EMAIL, () => {
      fillPts(rect(-48, -103, 48, -96), CERCLE); strokePts([[-26, -112], [10, -117]], 'rgba(255,255,255,0.6)', 2);
      hatch([[0, -120], [48, -120], [48, -96], [0, -96]], 0.9, 3.4, 0.15);
    }, 8703);
    pc(ell(0, -121, 6, 4, 10), CERCLE, null, 8704);
    c.restore();
  }

  // =====================================================================
  // REGISTRE DES OBJETS — grip = point tenu au poing ; p2 = seconde prise ; pts = points nommés ; base = point posé (accessoire seul)
  // =====================================================================
  const OBJ = {
    boite: { draw: drawBoite, grip: [-BX.rx, -5], p2: () => [8, BX.ry - 3], pts: { centre: [0, BX.agY], haut: [0, -BX.h - 4], bord: [BX.rx, -6], fond: [0, 0] }, base: [0, 0], held: { echelle: 1.55 } },
    couvercle: { draw: drawCouvercle, grip: [-LID.rx, -4], pts: { centre: [0, 0], haut: [0, -LID.h] }, base: [0, 0], held: { echelle: 1.09 } },
    valise: { draw: drawValise, grip: [0, -111], pts: { centre: [0, -50], bas: [0, 0] }, base: [0, 0], held: { echelle: 1.09 } },
    chapeau: { draw: drawChapeau, grip: HAT_G, pts: { centre: [0, -24] }, base: (o) => (o.patere ? [0, -44] : [0, 9]) },
    pile: { draw: drawPile, grip: [0, 0], pts: {}, base: [0, 0] },
    spore: { draw: drawSpore, grip: [0, 0], pts: {}, base: [0, 0] },
    poubelle: { draw: drawPoubelle, grip: [0, -60], pts: { bouche: [0, -100] }, base: [0, 0] },
    grande: { draw: drawGrande, grip: [0, 0], pts: {}, base: [0, 0] },
  };
  FLE.OBJ = OBJ;
  const gripOf = (ob, o) => (typeof ob.grip === 'function' ? ob.grip(o) : ob.grip);
  const baseOf = (ob, o) => (typeof ob.base === 'function' ? ob.base(o) : ob.base);
  function heldOpts(name, o, p) { const ob = OBJ[name]; return Object.assign({ t: p.t || 0 }, ob.held || {}, o || {}); }
  function heldDraw(name, o, p) {
    const ob = OBJ[name]; if (!ob) return;
    const oo = heldOpts(name, o, p), g = gripOf(ob, oo), e = oo.echelle || 1, c = cx_();
    c.save(); c.scale(e, e); c.translate(-g[0], -g[1]); ob.draw(oo); c.restore();
  }
  const DOIGTS = [[-13, -9], [9, -11], [12, -4], [12, 6], [6, 11], [-6, 11], [-13, 4]];
  const doigtsPaint = () => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(70,40,30,0.5)', 1); hatch(null, 0.9, 3.4, 0.15); };
  function heldParts(skin, skinB, seed) {
    return {
      objet: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (has(p.tenu)) heldDraw(p.tenu, p.tenuO, p); } },
      doigts: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 2, pts: (p) => (has(p.tenu) ? DOIGTS : OFFP), paint: doigtsPaint },
      objetB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 3, pts: OFFP, extra: (p) => { if (has(p.tenuB)) heldDraw(p.tenuB, p.tenuBO, p); } },
      doigtsB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skinB, seed: seed + 4, pts: (p) => (has(p.tenuB) ? DOIGTS : OFFP), paint: doigtsPaint },
      doigtsD: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skinB, seed: seed + 5, pts: (p) => (p._deux ? DOIGTS : OFFP), paint: doigtsPaint },
    };
  }
  // point nommé de l'objet tenu, en coordonnées écran (r renvoyé par FLE.fleming) ; nom 'grip' = le poing
  FLE.pt = function (r, nom, arriere) {
    const name = arriere ? r.tenuB : r.tenu, ob = OBJ[name]; if (!ob) return null;
    const oo = arriere ? r.tenuBO : r.tenuO, g = gripOf(ob, oo), e = oo.echelle || 1, q = nom === 'grip' ? g : ob.pts[nom];
    if (!q) return null;
    return r.w(arriere ? 'objetB' : 'objet', (q[0] - g[0]) * e, (q[1] - g[1]) * e);
  };

  // =====================================================================
  // ALEXANDER FLEMING (1928, 47 ans) — costume trois-pièces gris-bleu ardoise, nœud papillon bordeaux à pois, cheveux gris-sable en arrière
  // =====================================================================
  const FL = { costume: '#5f6b78', costumeD: '#525d6a', costumeB: '#4b5562', gilet: '#58636f', chemise: '#ece5d3', col: '#f6f1e6', noeud: '#7a2e35', pois: '#efe2c8',
    peau: '#e8c6a4', peauD: '#cba585', cheveux: '#b8aa8b', cheveuxD: '#958a70', cheveuxL: '#dccfb1', chaus: '#5a3a24', chausL: '#80593b', chaine: '#c9a54e' };
  const FL_TORSO = [[-12, -176], [8, -180], [17, -168], [26, -150], [32, -118], [34, -80], [33, -40], [31, -8], [33, 28], [35, 54, 1], [-36, 56, 1], [-37, 20], [-35, -40], [-36, -110], [-32, -148], [-24, -168]];
  const FL_HEAD = [[-14, 16], [10, 16], [12, 2], [19, -5], [26, -11], [29, -18], [28, -23], [30, -27], [29, -31], [32, -35], [35, -40, 1], [32, -46], [29, -55], [29, -64], [26, -78], [14, -92], [-6, -97], [-24, -88], [-33, -68], [-32, -46], [-24, -28], [-17, -8]];
  const FL_HAIR = [[30, -79], [20, -100], [-4, -108], [-28, -98], [-40, -72], [-40, -48], [-31, -33, 1], [-22, -38], [-18, -52], [-12, -58], [-4, -57], [1, -50, 1], [4, -52], [6, -66], [16, -75], [24, -79]];
  const BOW = [[0, -5], [11, -14], [23, -13], [27, -3], [23, 9], [11, 13], [1, 5], [-10, 13], [-19, 9], [-21, -2], [-16, -12], [-7, -11]];
  const HAT_AT = [-4, -80];
  function legDef(at, base, seed, back) {
    return { parent: 'torso', at, pts: X.legPts(0.92), base, seed, noRivet: !!back, paint: () => {
      fillPts([[-40, 214, 1], [60, 214, 1], [60, 260, 1], [-40, 260, 1]], FL.chaus);
      if (!back) { strokePts([[18, 222], [42, 229]], 'rgba(255,220,180,0.35)', 1.4); strokePts([[0, 10], [2, 120], [0, 212]], 'rgba(30,34,40,0.35)', 1.1); hatch([[-26, -20], [-6, -20], [-6, 214], [-26, 214]], 0.8, 4, 0.24); }
      else hatch(null, 0.8, 3.6, 0.3);
    } };
  }
  function foreDef(base, skin, back, seed, cuff) {
    const hk = (p) => (back ? p.handB : p.handF) || 'fist';
    return { parent: back ? 'armB_up' : 'armF_up', at: [0, LA], pts: (p) => foreR(hk(p)), base, seed, paint: (p) => {
      fillPts([[-20, 76, 1], [20, 76, 1], [24, 130, 1], [-20, 130, 1]], skin); X.handPaint(null, hk(p));
      fillPts([[-13, 64, 1], [13, 64, 1], [14, 78, 1], [-13, 78, 1]], cuff);
      fillPts([[-12, 56, 1], [12, 56, 1], [12, 64, 1], [-12, 64, 1]], base);
      hatch([[-14, -10], [-3, -10], [-3, 58], [-14, 58]], 0.9, 3.8, 0.22);
    } };
  }
  const upDef = (at, base, seed) => ({ parent: 'torso', at, pts: armR(LA), base, seed, paint: () => hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.27) });
  function mkFleming() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: FL_TORSO, base: FL.costume, seed: 9101, paint: () => {
        fillPts([[8, -182], [20, -170], [25, -150], [19, -140], [12, -156]], FL.chemise);
        fillPts([[5, -184], [15, -181], [21, -172], [14, -170], [8, -176]], FL.col);
        fillPts([[18, -142], [26, -140], [31, -118], [33, -80], [32, -40], [30, -12], [22, -4], [16, -30], [15, -90]], FL.gilet);
        strokePts([[18, -142], [15, -90], [16, -30], [22, -4]], 'rgba(28,32,40,0.55)', 1.3);
        for (const yy of [-120, -98, -76, -54, -32]) dot(29.5, yy, 2.1, '#2c323b');
        strokePts([[29, -62], [22, -53], [13, -51], [6, -56]], FL.chaine, 1.7); dot(6, -56, 2.4, FL.chaine);
        fillPts([[12, -170], [20, -160], [26, -146], [22, -128], [18, -110], [15, -140]], FL.costumeD);
        strokePts([[20, -160], [26, -146], [18, -110]], 'rgba(220,226,234,0.35)', 1.1);
        strokePts([[-14, -116], [6, -118]], 'rgba(28,32,40,0.5)', 1.1);
        fillPts([[-16, 8, 1], [12, 6, 1], [12, 15, 1], [-16, 17, 1]], FL.costumeD); strokePts([[-16, 8], [12, 6]], 'rgba(220,226,234,0.3)', 1);
        strokePts([[22, -4], [26, 24], [34, 52]], 'rgba(28,32,40,0.5)', 1.3);
        hatch([[-50, -170], [-14, -170], [-12, 60], [-50, 60]], 0.75, 4.2, 0.26);
        shade(36, 0, -38, 0, 0.24);
      } },
      noeud: { parent: 'torso', at: [21, -163], pts: BOW, base: FL.noeud, seed: 9102, noRivet: true, paint: () => {
        for (let i = -3; i <= 4; i++) for (let j = -2; j <= 2; j++) dot(i * 6.5 + (j % 2 ? 3 : 0), j * 6, 1.8, FL.pois);
        fillPts(ell(1, 0, 5, 7, 10), '#5c2027'); dot(1, 0, 1.6, FL.pois);
        strokePts([[4, -2], [16, -8]], 'rgba(30,8,10,0.45)', 1); strokePts([[-2, 2], [-14, 6]], 'rgba(30,8,10,0.45)', 1);
      } },
      legB: legDef([-6, -2], FL.costumeB, 9103, true),
      legF: legDef([6, -2], FL.costume, 9104, false),
      armB_up: upDef([-10, -146], FL.costumeB, 9105),
      armB_lo: foreDef(FL.costumeB, FL.peauD, true, 9106, '#d4ccb8'),
      head: { parent: 'torso', at: [6, -170], pts: FL_HEAD, base: FL.peau, seed: 9107, noRivet: true, paint: (p) => {
        const f = p.face || {};
        fillPts(FL_HAIR, FL.cheveux, 3);
        for (let k = 0; k < 6; k++) strokePts([[24 - k * 2, -84 + k * 3], [4, -95 + k * 6], [-18, -91 + k * 8], [-31, -74 + k * 7]], k % 2 ? 'rgba(96,84,62,0.32)' : 'rgba(255,248,226,0.3)', 1);
        strokePts([[22, -88], [4, -98], [-14, -97]], 'rgba(255,250,235,0.9)', 1.5);
        fillPts([[2, -66], [6, -64], [4, -52], [1, -51]], FL.cheveuxD);
        X.earPaint(-8, -44);
        hatch([[-22, -40], [2, -28], [12, -8], [-6, 18], [-32, 4]], 0.6, 3.6, 0.24);
        dot(15, -28, 11, 'rgba(214,132,112,0.22)');
        strokePts([[30, -37], [25, -32], [24, -27]], 'rgba(130,80,60,0.35)', 1);
        strokePts([[10, -2], [20, -6]], 'rgba(130,80,60,0.3)', 1);
        X.eye(f, 17, -52); X.brow(f, 17, -61, 'rgba(120,104,80,0.95)', 2.4); X.mouth(f, 27, -26);
      } },
      chapeau: { parent: 'head', at: HAT_AT, noRivet: true, base: '#000', seed: 9109, pts: OFFP, extra: (p) => { if (p.coiffe && !(p._hatHeld)) drawChapeau(); } },
      armF_up: upDef([-2, -146], FL.costume, 9110),
      armF_lo: foreDef(FL.costume, FL.peau, false, 9111, FL.chemise),
    };
    Object.assign(parts, heldParts(FL.peau, FL.peauD, 9120));
    return { nom: 'fleming', hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] },
      order: ['armB_up', 'armB_lo', 'objetB', 'doigtsB', 'legB', 'legF', 'head', 'chapeau', 'torso', 'noeud', 'armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsD'] };
  }
  CH.fleFleming = mkFleming();

  // ---------------- poses : préparation, IK, gestes
  // bendSign de M.ik vérifiés au casting (pages 2 et 3) : par bras et par direction
  FLE.BEND = { armF: { 1: 1, '-1': 1 }, armB: { 1: 1, '-1': 1 } };
  const bendOf = (arm, dir) => FLE.BEND[arm][dir < 0 ? '-1' : 1];
  function prep(p) { p = p || {}; return Object.assign({}, p, { ang: Object.assign({}, p.ang), hide: Object.assign({}, p.hide), face: Object.assign({}, p.face) }); }
  function plier(q, th) {
    if (!th) return;
    q.tilt = (q.tilt || 0) + th; q.dx = (q.dx || 0) - 238 * Math.sin(th); q.dy = (q.dy || 0) + 238 * (1 - Math.cos(th));
    q.ang.legF = (q.ang.legF || 0) - th; q.ang.legB = (q.ang.legB || 0) - th;
  }
  function finish(q) {
    const A = q.ang, tl = q.tilt || 0;
    if (has(q.tenu) && !(q.handF && q.handF !== 'fist')) q.handF = 'fist';
    if (has(q.tenuB) && !(q.handB && q.handB !== 'fist')) q.handB = 'fist';
    if (q.droit == null && has(q.tenu)) q.droit = true;
    if (q.droitB == null && has(q.tenuB)) q.droitB = true;
    if (q.droit) A.objet = (A.objet || 0) - ((A.armF_up || 0) + (A.armF_lo || 0) + tl);
    if (q.droitB) A.objetB = (A.objetB || 0) - ((A.armB_up || 0) + (A.armB_lo || 0) + tl);
    return q;
  }
  // point écran de la main (poing) ou du point nommé de l'objet tenu
  function pointMain(q, mats, arm, nom) {
    const tenu = arm === 'armF' ? q.tenu : q.tenuB, ob = OBJ[tenu];
    if (nom && has(tenu) && ob && (nom === 'grip' || ob.pts[nom])) {
      const oo = heldOpts(tenu, arm === 'armF' ? q.tenuO : q.tenuBO, q), g = gripOf(ob, oo), e = oo.echelle || 1, pn = nom === 'grip' ? g : ob.pts[nom];
      return M.wpt(mats[arm === 'armF' ? 'objet' : 'objetB'], (pn[0] - g[0]) * e, (pn[1] - g[1]) * e);
    }
    return M.wpt(mats[arm + '_lo'], 4, 96);
  }
  // amène la main (ou le point nommé de l'objet tenu) sur la cible ÉCRAN par M.ik (bendSign de FLE.BEND), mélange k
  function viser(def, q, x, y, s, dir, arm, cible, k, nom) {
    if (!cible || !(k > 0)) return;
    const A = q.ang, a0 = A[arm + '_up'] || 0, b0 = A[arm + '_lo'] || 0;
    let T = cible.slice(), sol = null;
    for (let i = 0; i < 4; i++) {
      sol = M.ik(def, q, x, y, s, dir, arm, T, bendOf(arm, dir));
      const qq = prep(q); qq.ang[arm + '_up'] = sol.up; qq.ang[arm + '_lo'] = sol.lo; finish(qq);
      const Pw = pointMain(qq, M.partMatrices(def, qq, x, y, s, dir).mats, arm, nom);
      T = [T[0] + cible[0] - Pw[0], T[1] + cible[1] - Pw[1]];
    }
    A[arm + '_up'] = a0 + normA(sol.up - a0) * k; A[arm + '_lo'] = b0 + normA(sol.lo - b0) * k;
  }
  // cibles des gestes, dans le repère du torse (x vers le regard) ou de la tête
  FLE.CIBLES = { tenir: [140, -114], examine: [206, -220], brandir: [114, -282], valise: [-8, 47], menton: [28, 4] };
  function run(def, p, x, y, s, o) {
    o = Object.assign({ slot: ST.slotF, nom: 'fleming' }, o || {});
    const dir = o.dir || 1, q = prep(p), A = q.ang, t = q.t || 0;
    const k = (n) => ease(clamp(q[n] || 0));
    // corps : respiration, marche, penché, assis
    if (q.t != null && !q.fige) q.dy = (q.dy || 0) + Math.sin(t * 1.9) * 1.2;
    if (typeof q.marche === 'number') { const sp = Math.sin(q.marche); A.legF = (A.legF || 0) + 0.32 * sp; A.legB = (A.legB || 0) - 0.32 * sp; q.dy = (q.dy || 0) - Math.abs(sp) * 8; A.armB_up = (A.armB_up || 0) + 0.12 * sp; }
    const ka = k('assis');
    if (ka > 0) {
      q.dy = (q.dy || 0) + 238 * ka; q.tilt = (q.tilt || 0) - 0.5 * ka;
      A.legF = (A.legF || 0) - 0.9 * ka; A.legB = (A.legB || 0) - 0.82 * ka;
      A.armF_up = (A.armF_up || 0) + 0.05 * ka; A.armF_lo = (A.armF_lo || 0) - 0.85 * ka;
      A.armB_up = (A.armB_up || 0) + 0.1 * ka; A.armB_lo = (A.armB_lo || 0) - 0.8 * ka;
    }
    if (q.dort) { q.face.eyes = 'closed'; A.head = (A.head || 0) + (0.22 + 0.08 * Math.sin(t * 1.6)) * (q.dort === true ? 1 : clamp(q.dort)); }
    const kp = k('penche'); if (kp > 0) { plier(q, 0.3 * kp); A.head = (A.head || 0) + 0.1 * kp; }
    // objets tenus d'office
    const kt = k('tenir'), ke = k('examine'), kb = k('brandir'), kv = k('valise'), kc = k('chapeau'), ks = k('souleve'), km = k('menton'), kl = k('couvercle');
    if ((kt > 0 || ke > 0 || kb > 0) && q.tenu == null) q.tenu = 'boite';
    if (kl > 0 && q.tenu == null) q.tenu = 'couvercle';
    if (kv > 0 && q.tenuB == null) q.tenuB = 'valise';
    if (ks > 0 && q.coiffe) { q.tenu = 'chapeau'; q._hatHeld = true; A.objet = (A.objet || 0) + (q.tilt || 0) + (A.head || 0); }
    const { mats } = M.partMatrices(def, q, x, y, s, dir);
    const T = (m, pt) => M.wpt(m, pt[0], pt[1]), C = FLE.CIBLES;
    // bras avant
    if (kt > 0) viser(def, q, x, y, s, dir, 'armF', T(mats.torso, C.tenir), kt, q.tenu === 'boite' ? 'centre' : null);
    if (ke > 0) { A.objet = (A.objet || 0) - 0.22 * ke; viser(def, q, x, y, s, dir, 'armF', T(mats.torso, C.examine), ke, q.tenu === 'boite' ? 'centre' : null); }
    if (kb > 0) viser(def, q, x, y, s, dir, 'armF', T(mats.torso, C.brandir), kb, null);
    if (kc > 0 && q.coiffe) {
      const g = T(mats.chapeau, HAT_G), lift = [dir * 62 * s * ks, -34 * s * ks];
      viser(def, q, x, y, s, dir, 'armF', [g[0] + lift[0], g[1] + lift[1]], kc, ks > 0 ? 'grip' : null);
    }
    if (km > 0) viser(def, q, x, y, s, dir, 'armF', T(mats.head, C.menton), km, null);
    if (kl > 0) {
      const b = q.boite || T(mats.torso, [150, -40]), bs = q.boiteS || 1, h = lerp(8 + 7, 8 + 110, clamp(q.releve || 0)) * bs;
      viser(def, q, x, y, s, dir, 'armF', [b[0], b[1] - h], kl, q.tenu === 'couvercle' ? 'centre' : null);
    }
    if (q.cible && q.atteint > 0 && q.bras !== 'B') viser(def, q, x, y, s, dir, 'armF', q.cible, ease(clamp(q.atteint)), q.ptCible || (has(q.tenu) ? 'centre' : null));
    // bras arrière
    if (kv > 0) viser(def, q, x, y, s, dir, 'armB', T(mats.torso, C.valise), kv, null);
    if (q.cible && q.atteint > 0 && q.bras === 'B') viser(def, q, x, y, s, dir, 'armB', q.cible, ease(clamp(q.atteint)), q.ptCible || (has(q.tenuB) ? 'centre' : null));
    q._deux = false;
    const kd = q.deuxMains === true ? 1 : clamp(q.deuxMains || 0);
    if (kd > 0 && has(q.tenu) && OBJ[q.tenu] && OBJ[q.tenu].p2) {
      const qq = finish(prep(q)), mm = M.partMatrices(def, qq, x, y, s, dir).mats, ob = OBJ[q.tenu], oo = heldOpts(q.tenu, q.tenuO, q), g = gripOf(ob, oo), e = oo.echelle || 1, p2 = ob.p2(oo);
      viser(def, q, x, y, s, dir, 'armB', M.wpt(mm.objet, (p2[0] - g[0]) * e, (p2[1] - g[1]) * e), ease(kd), null);
      if (kd > 0.5 && !has(q.tenuB)) { q._deux = true; q.handB = 'fist'; }
    }
    finish(q);
    const r = M.puppet(def, q, x, y, s, o);
    r.tenu = q.tenu; r.tenuB = q.tenuB; r.pose = q;
    if (has(q.tenu) && OBJ[q.tenu]) r.tenuO = heldOpts(q.tenu, q.tenuO, q);
    if (has(q.tenuB) && OBJ[q.tenuB]) r.tenuBO = heldOpts(q.tenuB, q.tenuBO, q);
    return r;
  }
  FLE.fleming = (pose, x, y, s, o) => run(CH.fleFleming, pose, x, y, s == null ? 0.92 : s, o);

  // =====================================================================
  // ACCESSOIRES SEULS — M.puppet à une pièce invisible ; l'objet se dessine dans l'extra (ombre portée possible)
  // =====================================================================
  const accDefs = {};
  function accDef(name) {
    const ob = OBJ[name];
    return accDefs[name] || (accDefs[name] = { hipY: 0, handLen: 10, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1,
      extra: (p) => { const c = cx_(), b = baseOf(ob, p.o); c.save(); c.translate(-b[0], -b[1]); ob.draw(p.o); c.restore(); } } }, order: ['o'] });
  }
  function acc(name, x, y, s, o) {
    o = o || {}; s = s == null ? 1 : s;
    return M.puppet(accDef(name), { o, tilt: o.rot || 0 }, x, y, s, { dir: o.dir || 1, rod: false, slot: y + 6 * s, floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
  }
  FLE.boite = (x, y, s, o) => acc('boite', x, y, s, o);
  FLE.couvercle = (x, y, s, o) => acc('couvercle', x, y, s, o);
  FLE.pile = (x, y, s, o) => acc('pile', x, y, s, o);
  FLE.valise = (x, y, s, o) => acc('valise', x, y, s, o);
  FLE.poubelle = (x, y, s, o) => acc('poubelle', x, y, s, o);
  FLE.chapeau = (x, y, s, o) => { o = Object.assign({}, o); if (o.patere && o.rot == null) o.rot = -0.16; return acc('chapeau', x, y, s == null ? 0.92 : s, o); };
  // haut de la pile (centre du couvercle du dessus), écran
  FLE.pileHaut = (x, y, s, o) => { o = o || {}; s = s == null ? 1 : s; const n = o.n == null ? 7 : o.n, i = Math.max(0, n - (o.moins | 0) - 1), f = pileOff(o, i); return [x + f.dx * s * (o.dir || 1), y + f.dy * s]; };
  // spore qui flotte en se dandinant au bout d'un fil ; (x,y) = centre ; o.t ; o.fil (true) ; o.filY (y du haut du fil, 0) ; o.fixe (sans dandinement)
  FLE.spore = (x, y, s, o) => {
    o = o || {}; s = s == null ? 1 : s;
    const t = o.t || 0, fx = o.fixe ? 0 : (4 * Math.sin(t * 1.1) + 2 * Math.sin(t * 2.9)) * s, fy = o.fixe ? 0 : 5 * Math.sin(t * 1.7) * s, rot = o.fixe ? 0 : 0.35 * Math.sin(t * 2.3);
    if (o.fil !== false) { const c = cx_(); c.save(); c.strokeStyle = 'rgba(236,230,214,0.55)'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(x + fx, y + fy - 10 * s); c.lineTo(x + fx * 0.3, o.filY || 0); c.stroke(); c.restore(); }
    return acc('spore', x + fx, y + fy, s, Object.assign({}, o, { rot }));
  };
  // grande boîte vue de dessus, suspendue à deux fils ; (x,y) = centre ; o.t (balancement), o.fils (true), o.filY (0), + bacteries/moisissure/halo
  FLE.grandeBoite = (x, y, s, o) => {
    o = o || {}; s = s == null ? 1 : s;
    const rot = o.fige ? 0 : 0.02 * Math.sin((o.t || 0) * 0.9 + 0.6);
    if (o.fils !== false) {
      const c = cx_(); c.save(); c.strokeStyle = 'rgba(25,18,12,0.6)'; c.lineWidth = 1.3; c.beginPath();
      for (const sx of [-1, 1]) { const lx = sx * GB.R * 0.62, ly = -GB.R * 0.8, X0 = x + (lx * Math.cos(rot) - ly * Math.sin(rot)) * s, Y0 = y + (lx * Math.sin(rot) + ly * Math.cos(rot)) * s; c.moveTo(X0, Y0); c.lineTo(X0, o.filY || 0); }
      c.stroke(); c.restore();
    }
    return acc('grande', x, y, s, Object.assign({}, o, { rot }));
  };

  // =====================================================================
  // DÉCORS — FLE.init() (dans S.init) → FLE.K = { labo, porte, paillasse }
  // =====================================================================
  const LABO = { porte: { x0: 792, x1: 948, top: 795, gond: 948 }, patere: { x: 733, y: 884 }, poubelle: { x: 762, y: ST.back + 4 }, fenetre: { x0: 300, x1: 600, y0: 360, y1: 820 }, carreaux: 872 };
  const PAI = { x0: 180, x1: 720, cx: 450, top: 1084, front: 1110, edge: 1132, pile: { x: 236, y: 1104 }, boites: [[326, 1103], [418, 1094], [510, 1104], [602, 1095]] };
  FLE.LABO = LABO; FLE.PAI = PAI;
  function flacons(x, x0, x1, yy, seed) {
    let px = x0, i = 0;
    const cols = ['#8a6a3c', '#6e8576', '#cfc6ae', '#8f9fa6', '#9a7a5a', '#a9b49a'];
    while (px < x1 - 26) {
      const kind = (i * 7 + seed) % 4, col = cols[(i * 5 + seed) % cols.length], h = 46 + ((i * 37 + seed) % 34);
      let pts;
      if (kind === 0) pts = [[px, yy], [px + 34, yy], [px + 28, yy - h * 0.45], [px + 21, yy - h * 0.62], [px + 21, yy - h, 1], [px + 13, yy - h, 1], [px + 13, yy - h * 0.62], [px + 6, yy - h * 0.45]];
      else if (kind === 1) pts = ep(px + 18, yy - 18, 18, 18, 12, -PI * 0.25, PI * 1.25).concat([[px + 14, yy - 34], [px + 14, yy - h, 1], [px + 22, yy - h, 1], [px + 22, yy - 34]]);
      else if (kind === 2) pts = [[px, yy, 1], [px + 30, yy, 1], [px + 30, yy - h * 0.72], [px + 22, yy - h * 0.82], [px + 22, yy - h + 6, 1], [px + 25, yy - h, 1], [px + 5, yy - h, 1], [px + 8, yy - h + 6, 1], [px + 8, yy - h * 0.82], [px, yy - h * 0.72]];
      else pts = [[px + 2, yy, 1], [px + 24, yy, 1], [px + 24, yy - h * 0.7, 1], [px + 2, yy - h * 0.7, 1]];
      const kk = kind, ph = px, hh = h;
      piece(pts, col, () => {
        x.fillStyle = 'rgba(255,255,255,0.3)'; x.fillRect(ph + 5, yy - hh * 0.5, 3, hh * 0.35);
        if (kk === 2 || kk === 3) fillPts(rect(ph + 5, yy - hh * 0.5, ph + (kk === 2 ? 25 : 21), yy - hh * 0.28), '#ece4cf');
        if (kk === 1) fillPts(ep(ph + 18, yy - 18, 15, 15, 8, 0, PI).concat([[ph + 3, yy - 18]]), 'rgba(120,60,40,0.35)');
      }, { seed: 9500 + seed * 10 + i });
      px += (kind === 1 ? 44 : 38) + ((i * 13) % 10); i++;
    }
  }
  function makeLabo() {
    return M.pre(M.W, ST.back + 5, (x) => {
      const H = ST.back + 5, W = M.W, yT = LABO.carreaux, F = LABO.fenetre, Pt = LABO.porte;
      let g = x.createLinearGradient(0, 0, 0, yT); g.addColorStop(0, '#98a391'); g.addColorStop(1, '#b9c0aa');
      x.fillStyle = g; x.fillRect(0, 0, W, yT);
      for (let i = 0; i < 46; i++) { x.fillStyle = `rgba(255,255,240,${0.03 + 0.05 * hash(i)})`; x.beginPath(); x.ellipse(hash(i * 3.1) * W, hash(i * 5.7) * yT, 30 + 70 * hash(i * 2.2), 10 + 24 * hash(i * 7.7), 0, 0, TAU); x.fill(); }
      // carreaux crème (pose à joints décalés) jusqu'à mi-hauteur
      x.fillStyle = '#e6dcc2'; x.fillRect(0, yT, W, H - yT);
      const tw = 44, th = 22;
      for (let r = 0; yT + r * th < H; r++) for (let k = -1; k * tw < W; k++) {
        const x0 = k * tw + (r % 2 ? tw / 2 : 0), y0 = yT + r * th;
        x.fillStyle = `rgba(${hash(r * 31 + k) > 0.5 ? '255,250,235' : '200,186,150'},${0.12 + 0.12 * hash(r * 7 + k * 3)})`; x.fillRect(x0 + 2, y0 + 2, tw - 4, th - 4);
        x.fillStyle = 'rgba(255,255,255,0.35)'; x.fillRect(x0 + 4, y0 + 3, tw - 14, 2);
      }
      x.strokeStyle = 'rgba(120,108,80,0.45)'; x.lineWidth = 1.3; x.beginPath();
      for (let r = 0; yT + r * th <= H; r++) { x.moveTo(0, yT + r * th); x.lineTo(W, yT + r * th); for (let k = -1; k * tw < W; k++) { const xx = k * tw + (r % 2 ? tw / 2 : 0); x.moveTo(xx, yT + r * th); x.lineTo(xx, yT + (r + 1) * th); } }
      x.stroke();
      piece(rect(0, yT - 14, W, yT + 2), '#6f7d68', () => strokePts([[0, yT - 11], [W, yT - 11]], 'rgba(255,255,255,0.3)', 1.5), { seed: 9001 });
      piece(rect(0, 150, W, 178), '#c8c4b0', () => { strokePts([[0, 172], [W, 172]], 'rgba(80,70,50,0.35)', 1.5); hatch(null, 0, 3, 0.12); }, { seed: 9002 });
      // fenêtre à guillotine fermée : ciel gris, toits de briques au loin
      piece(rect(F.x0 - 24, F.y0 - 24, F.x1 + 24, F.y1 + 4), '#d8d1bc', () => hatch(null, 0.2, 4, 0.12), { seed: 9010 });
      x.save(); x.beginPath(); x.rect(F.x0, F.y0, F.x1 - F.x0, F.y1 - F.y0); x.clip();
      g = x.createLinearGradient(0, F.y0, 0, F.y1); g.addColorStop(0, '#b9bdba'); g.addColorStop(1, '#d6d6cf'); x.fillStyle = g; x.fillRect(F.x0, F.y0, F.x1 - F.x0, F.y1 - F.y0);
      for (let i = 0; i < 7; i++) { x.fillStyle = `rgba(150,154,155,${0.18 + 0.1 * hash(i)})`; x.beginPath(); x.ellipse(F.x0 + hash(i * 4.4) * 300, F.y0 + 30 + hash(i * 2.9) * 160, 60 + 50 * hash(i), 14 + 10 * hash(i * 3), 0, 0, TAU); x.fill(); }
      const roofs = (yb, sc, col, roofCol, seed) => {
        let px = F.x0 - 20, i = 0;
        while (px < F.x1 + 20) {
          const w = (50 + 40 * hash(i * 3.3 + seed)) * sc, h = (40 + 30 * hash(i * 5.1 + seed)) * sc;
          x.fillStyle = col; x.fillRect(px, yb - h, w, h + 200);
          x.fillStyle = roofCol; x.beginPath(); x.moveTo(px - 3, yb - h); x.lineTo(px + w * 0.5, yb - h - 18 * sc); x.lineTo(px + w + 3, yb - h); x.fill();
          const cxh = px + w * (0.25 + 0.5 * hash(i + seed)); x.fillStyle = col; x.fillRect(cxh, yb - h - 30 * sc, 12 * sc, 22 * sc);
          x.fillStyle = '#8f5a44'; for (let j = 0; j < 2; j++) x.fillRect(cxh + 1 + j * 5 * sc, yb - h - 36 * sc, 3.5 * sc, 7 * sc);
          x.fillStyle = 'rgba(40,30,25,0.35)'; for (let j = 0; j < 3; j++) x.fillRect(px + 6 + j * w / 3, yb - h + 12 * sc, 7 * sc, 10 * sc);
          px += w + 4; i++;
        }
      };
      roofs(F.y1 - 70, 0.8, '#9a7a6c', '#7d8186', 1); x.fillStyle = 'rgba(205,207,203,0.45)'; x.fillRect(F.x0, F.y0, F.x1 - F.x0, F.y1 - F.y0);
      roofs(F.y1 - 10, 1.1, '#8c5c4a', '#686c72', 7); x.fillStyle = 'rgba(205,207,203,0.25)'; x.fillRect(F.x0, F.y0, F.x1 - F.x0, F.y1 - F.y0);
      x.fillStyle = 'rgba(255,255,250,0.28)'; x.beginPath(); x.moveTo(F.x0, F.y1 - 60); x.lineTo(F.x0 + 140, F.y0); x.lineTo(F.x0 + 200, F.y0); x.lineTo(F.x0 + 60, F.y1); x.lineTo(F.x0, F.y1); x.fill();
      x.restore();
      const mid = (F.y0 + F.y1) / 2, sash = (y0, y1, dx) => {
        x.fillStyle = '#e4dece'; x.strokeStyle = 'rgba(90,80,60,0.6)'; x.lineWidth = 1.2;
        const fr = [[F.x0 + dx, y0, F.x1 - F.x0 - 2 * dx, 13], [F.x0 + dx, y1 - 13, F.x1 - F.x0 - 2 * dx, 13], [F.x0 + dx, y0, 13, y1 - y0], [F.x1 - dx - 13, y0, 13, y1 - y0]];
        for (const r of fr) { x.fillRect(...r); x.strokeRect(...r); }
        for (let k = 1; k < 3; k++) { const xx = lerp(F.x0 + dx + 13, F.x1 - dx - 13, k / 3) - 3; x.fillRect(xx, y0, 6, y1 - y0); x.strokeRect(xx, y0, 6, y1 - y0); }
        const ym = (y0 + y1) / 2 - 3; x.fillRect(F.x0 + dx, ym, F.x1 - F.x0 - 2 * dx, 6); x.strokeRect(F.x0 + dx, ym, F.x1 - F.x0 - 2 * dx, 6);
      };
      sash(F.y0, mid + 8, 0); sash(mid - 8, F.y1, 4);
      piece([[F.x0 - 36, F.y1, 1], [F.x1 + 36, F.y1, 1], [F.x1 + 30, F.y1 + 18, 1], [F.x0 - 30, F.y1 + 18, 1]], '#cfc7b0', () => strokePts([[F.x0 - 34, F.y1 + 3], [F.x1 + 34, F.y1 + 3]], 'rgba(255,255,255,0.5)', 1.5), { seed: 9011 });
      // sur l'appui : bec Bunsen et microscope en laiton
      const by = F.y1, bx = 372;
      piece(ribbon([[bx + 14, by - 6], [bx + 40, by + 4], [bx + 52, by + 40], [bx + 48, by + 80]], 6, 6), '#9a5a3a', null, { seed: 9020 });
      piece(rect(bx - 16, by - 8, bx + 16, by), '#2f3134', null, { seed: 9021 });
      piece(rect(bx - 5, by - 70, bx + 5, by - 8), '#9a9e9c', () => { strokePts([[bx - 2, by - 68], [bx - 2, by - 10]], 'rgba(255,255,255,0.5)', 1.4); fillPts(rect(bx - 7, by - 34, bx + 7, by - 26), '#b08d45'); }, { seed: 9022 });
      piece(rect(bx + 4, by - 16, bx + 16, by - 10), '#9a9e9c', null, { seed: 9023 });
      const mx = 530, LT = '#b08d45', LTL = '#d9bd72';
      piece([[mx - 30, by, 1], [mx + 26, by, 1], [mx + 20, by - 10, 1], [mx - 24, by - 10, 1]], '#2d2a28', null, { seed: 9030 });
      piece(ribbon(qbez([mx - 8, by - 10], [mx - 26, by - 56], [mx + 2, by - 92], 8), 13, 11), LT, () => strokePts([[mx - 14, by - 30], [mx - 16, by - 60]], 'rgba(255,240,190,0.6)', 2), { seed: 9031 });
      piece(rect(mx - 20, by - 46, mx + 26, by - 40), '#26231f', null, { seed: 9032 });
      piece(ell(mx + 2, by - 24, 7, 4, 10), '#c9cfd0', null, { seed: 9033 });
      x.save(); x.translate(mx + 6, by - 52); x.rotate(0.38);
      piece(rect(-7, -64, 7, 0), LT, () => { strokePts([[-3, -60], [-3, -4]], 'rgba(255,240,190,0.7)', 1.8); fillPts(rect(-8, -72, 8, -62), '#2a2622'); fillPts(rect(-8, -2, 8, 8), '#2a2622'); }, { seed: 9034 });
      x.restore();
      piece(ell(mx - 10, by - 68, 7, 7, 10), LTL, null, { seed: 9035 });
      // étagères de flacons (mur gauche) et au-dessus de la porte
      for (const yy of [470, 620, 770]) {
        piece(rect(130, yy, 280, yy + 12), '#7a5a3c', () => hatch(null, 0.1, 3, 0.2), { seed: 9040 + yy });
        for (const sx of [146, 264]) piece([[sx - 4, yy + 12, 1], [sx + 4, yy + 12, 1], [sx + 4, yy + 36, 1], [sx - 12, yy + 12, 1]], '#5e4530', null, { seed: 9041 + sx + yy });
        flacons(x, 136, 280, yy, yy / 10 | 0);
      }
      piece(rect(Pt.x0 - 8, 660, Pt.x1 + 10, 671), '#7a5a3c', () => hatch(null, 0.1, 3, 0.2), { seed: 9050 });
      flacons(x, Pt.x0, Pt.x1 + 6, 660, 5);
      // porte : chambranle et couloir sombre (le battant est dessiné par FLE.porte)
      g = x.createLinearGradient(Pt.x0, 0, Pt.x1, 0); g.addColorStop(0, '#2c2621'); g.addColorStop(0.6, '#3d352d'); g.addColorStop(1, '#262019');
      x.fillStyle = g; x.fillRect(Pt.x0, Pt.top, Pt.x1 - Pt.x0, ST.back - Pt.top + 5);
      x.fillStyle = 'rgba(230,210,170,0.10)'; x.fillRect(Pt.x0 + 30, Pt.top + 40, 50, ST.back - Pt.top - 40);
      x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(Pt.x0, ST.back - 60, Pt.x1 - Pt.x0, 65);
      const JB = '#6b4f3a';
      piece(rect(Pt.x0 - 16, Pt.top - 18, Pt.x1 + 16, Pt.top), JB, () => hatch(null, 0.1, 3.4, 0.2), { seed: 9060 });
      piece(rect(Pt.x0 - 16, Pt.top - 4, Pt.x0, ST.back + 5), JB, () => hatch(null, 1.4, 3.4, 0.2), { seed: 9061 });
      piece(rect(Pt.x1, Pt.top - 4, Pt.x1 + 16, ST.back + 5), JB, () => hatch(null, 1.4, 3.4, 0.2), { seed: 9062 });
      // patère murale (laiton sur platine de bois)
      const pa = LABO.patere;
      piece(rrect(pa.x - 22, pa.y - 28, pa.x - 6, pa.y + 18, 4), JB, null, { seed: 9070 });
      piece(ribbon([[pa.x - 14, pa.y - 10], [pa.x - 6, pa.y - 2], [pa.x, pa.y], [pa.x + 6, pa.y - 4], [pa.x + 7, pa.y - 11]], 5, 4), '#b08d45', () => strokePts([[pa.x - 12, pa.y - 9], [pa.x - 3, pa.y - 2]], 'rgba(255,240,190,0.7)', 1.2), { seed: 9071 });
      // toile pâlie
      x.globalCompositeOperation = 'multiply'; x.globalAlpha = 0.5; x.fillStyle = M.tex.canvasPat; x.fillRect(0, 0, W, H);
      x.globalCompositeOperation = 'source-over'; x.globalAlpha = 0.16; x.fillStyle = '#efe7d4'; x.fillRect(0, 0, W, H);
      x.globalAlpha = 1;
      const vg = x.createLinearGradient(0, H - 140, 0, H); vg.addColorStop(0, 'rgba(40,30,20,0)'); vg.addColorStop(1, 'rgba(40,30,20,0.3)'); x.fillStyle = vg; x.fillRect(0, H - 140, W, 140);
    });
  }
  // battant de porte : origine = gond bas (bord droit) ; 156 × 600
  function makePorte() {
    const Pt = LABO.porte, w = Pt.x1 - Pt.x0, h = ST.back - Pt.top;
    const cv = M.cutFlat(w + 24, h + 24, w + 8, h + 12, () => {
      piece(rect(-w, -h, 0, 0), '#7a5b40', () => {
        fillPts(rect(-w + 18, -h + 22, -18, -h + 250), '#5e4430');
        const gg = M.ctx().createLinearGradient(-w, -h, 0, -h + 240); gg.addColorStop(0, '#cfd5cd'); gg.addColorStop(1, '#b4bdb6');
        M.ctx().fillStyle = gg; M.ctx().fillRect(-w + 24, -h + 28, w - 48, 216);
        for (let i = 0; i < 26; i++) dot(-w + 30 + hash(i * 3.1) * (w - 60), -h + 34 + hash(i * 5.3) * 204, 1.2, 'rgba(255,255,255,0.35)');
        for (const [a, b] of [[-h + 280, -h + 420], [-h + 440, -24]]) { fillPts(rect(-w + 20, a, -20, b), '#6c4f37'); strokePts([[-w + 22, a + 2], [-22, a + 2]], 'rgba(255,230,190,0.25)', 1.4); strokePts([[-w + 22, b - 2], [-22, b - 2]], 'rgba(0,0,0,0.3)', 1.4); }
        hatch(null, 1.5, 4, 0.18);
      }, { seed: 9080 });
      piece(ell(-w + 18, -h + 312, 7, 7, 10), '#c9a54e', () => dot(-w + 16, -h + 310, 2.4, 'rgba(255,240,200,0.8)'), { seed: 9081 });
      piece(rrect(-w + 13, -h + 322, -w + 23, -h + 346, 3), '#a8873c', null, { seed: 9082 });
    });
    cv.padX = w + 8; cv.padY = h + 12; return M.withShadow(cv, 6);
  }
  function makePaillasse() {
    const w = 600, h = ST.back - PAI.top + 40;
    const cv = M.cutFlat(w, h, w / 2, h - 10, (x) => {
      const T = PAI.top - ST.back, F = PAI.front - ST.back, E = PAI.edge - ST.back, L = PAI.x0 - PAI.cx, R = PAI.x1 - PAI.cx;
      piece(rect(L + 12, E, R - 12, 0), '#4a3426', () => {
        const cw = (R - L - 24) / 3;
        for (let k = 0; k < 3; k++) {
          const a = L + 18 + k * cw, b = a + cw - 12;
          strokePts([[a, E + 10, 1], [b, E + 10, 1], [b, E + 54, 1], [a, E + 54, 1], [a, E + 10, 1]], 'rgba(150,100,60,0.55)', 1.6); dot((a + b) / 2, E + 32, 4, '#b08d45');
          strokePts([[a, E + 66, 1], [b, E + 66, 1], [b, -22, 1], [a, -22, 1], [a, E + 66, 1]].map((q) => [q[0], q[1], 1]), 'rgba(150,100,60,0.5)', 1.6); dot(b - 12, E + 120, 3.4, '#b08d45');
          strokePts([[a + 12, E + 78, 1], [b - 12, E + 78, 1], [b - 12, -34, 1], [a + 12, -34, 1], [a + 12, E + 78, 1]], 'rgba(0,0,0,0.3)', 1.2);
        }
        x.fillStyle = 'rgba(0,0,0,0.45)'; x.fillRect(L + 12, -16, R - L - 24, 16);
        x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(L + 12, E, R - L - 24, 6);
        hatch(null, 0.25, 4, 0.22);
      }, { seed: 9301 });
      piece([[L + 10, T, 1], [R - 10, T, 1], [R, F, 1], [L, F, 1]], '#efede6', () => {
        x.strokeStyle = 'rgba(150,146,135,0.6)'; x.lineWidth = 1; x.beginPath();
        for (let k = 0; k <= 18; k++) { const u = k / 18; x.moveTo(lerp(L + 10, R - 10, u), T); x.lineTo(lerp(L, R, u), F); }
        x.moveTo(L, (T + F) / 2); x.lineTo(R, (T + F) / 2); x.stroke();
        x.fillStyle = 'rgba(120,110,90,0.12)'; x.fillRect(L, T, R - L, 8);
      }, { seed: 9302 });
      piece(rect(L - 4, F, R + 4, E), '#e4e1d8', () => {
        x.strokeStyle = 'rgba(150,146,135,0.6)'; x.lineWidth = 1; x.beginPath();
        for (let xx = L + 26; xx < R; xx += 30) { x.moveTo(xx, F); x.lineTo(xx, E); } x.stroke();
        strokePts([[L - 2, F + 3], [R + 2, F + 3]], 'rgba(255,255,255,0.8)', 1.6);
        x.fillStyle = 'rgba(90,80,60,0.2)'; x.fillRect(L - 4, E - 6, R - L + 8, 6);
      }, { seed: 9303 });
      // portoir à éprouvettes (à droite, au fond) et carnet fermé (devant)
      const rx = 690 - PAI.cx, ry = T + 14;
      const tubes = ['#c9a96a', '#a7b89e', '#e6e0cf', '#c58a74', '#d6c58e'];
      piece(rect(rx - 30, ry - 8, rx + 30, ry), '#8a6a48', null, { seed: 9310 });
      for (const sx of [-28, 22]) piece(rect(rx + sx, ry - 52, rx + sx + 6, ry - 8), '#8a6a48', null, { seed: 9311 + sx });
      for (let i = 0; i < 5; i++) {
        const tx = rx - 21 + i * 10.5;
        piece([[tx - 4, ry - 70, 1], [tx + 4, ry - 70, 1], [tx + 4, ry - 14], [tx, ry - 10], [tx - 4, ry - 14]], 'rgba(214,232,236,0.85)', () => fillPts([[tx - 4, ry - 44], [tx + 4, ry - 44], [tx + 4, ry - 14], [tx, ry - 10], [tx - 4, ry - 14]], tubes[i]), { seed: 9320 + i });
        piece(rrect(tx - 4.5, ry - 80, tx + 4.5, ry - 68, 3), '#f2eee4', null, { seed: 9330 + i });
      }
      piece(rect(rx - 32, ry - 40, rx + 32, ry - 34), '#9a7a58', () => { for (let i = 0; i < 5; i++) dot(rx - 21 + i * 10.5, ry - 37, 2, '#3a2a1a'); }, { seed: 9312 });
      const nx = 676 - PAI.cx, ny = F - 2;
      piece([[nx - 34, ny, 1], [nx + 30, ny, 1], [nx + 38, ny - 12, 1], [nx - 24, ny - 12, 1]], '#3e4a5e', () => { strokePts([[nx - 22, ny - 10], [nx + 34, ny - 10]], 'rgba(255,255,255,0.2)', 1.2); hatch(null, 0.4, 3, 0.2); }, { seed: 9340 });
      piece(rect(nx - 34, ny, nx + 30, ny + 6), '#ece4cf', () => { for (let k = 1; k < 3; k++) strokePts([[nx - 32, ny + k * 2], [nx + 28, ny + k * 2]], 'rgba(120,100,70,0.4)', 0.8); }, { seed: 9341 });
    });
    cv.padB = 10; return M.withShadow(cv, 8);
  }
  FLE.init = function () {
    if (FLE.K) return FLE.K;
    const K = (FLE.K = {});
    K.labo = makeLabo(); K.porte = makePorte(); K.paillasse = makePaillasse();
    return K;
  };
  // battant de la porte praticable (charnières à droite) ; ouverte 0..1 (1 ≈ 75°, le battant pivote vers la salle) ; o.cast
  FLE.porte = (t, ouverte, o) => {
    const c = cx_(), K = FLE.K, Pt = LABO.porte, w = Pt.x1 - Pt.x0, th = ease(clamp(ouverte || 0)) * 1.3, co = Math.cos(th), sn = Math.sin(th);
    c.save(); c.translate(Pt.gond, ST.back); c.transform(co, -0.1 * sn, 0, 1, 0, 0);
    c.drawImage(K.porte, -K.porte.padX, -K.porte.padY);
    if (sn > 0.05) { c.fillStyle = '#4a3624'; c.fillRect(-w - 9 * sn / Math.max(co, 0.2), -(ST.back - Pt.top), 9 * sn / Math.max(co, 0.2), ST.back - Pt.top); }
    c.restore();
  };
  // décor complet : toile de fond + battant (o.ouverte 0..1 ; o.porte:false pour dessiner le battant soi-même, après un personnage qui sort)
  FLE.labo = (t, o) => { o = o || {}; const c = cx_(); c.drawImage(FLE.K.labo, 0, 0); if (o.porte !== false) FLE.porte(t, o.ouverte || 0); };
  // paillasse : plateau carrelé + pile de couvercles (o.pile = options de FLE.pile, false = sans) + boîtes PAI.boites
  // o.n (4) ; o.boites[i] = options de la boîte i (couvercle, bacteries, moisissure, halo, s) ; o.sauf = [indices non dessinés] ; o.cast
  FLE.paillasse = (t, o) => {
    o = o || {};
    M.flat(FLE.K.paillasse, PAI.cx, ST.back, { cast: o.cast });
    if (o.pile !== false) FLE.pile(PAI.pile.x, PAI.pile.y, 1, Object.assign({ t }, o.pile || {}));
    const n = o.n == null ? 4 : o.n, idx = [];
    for (let i = 0; i < Math.min(n, PAI.boites.length); i++) if (!(o.sauf || []).includes(i)) idx.push(i);
    idx.sort((a, b) => PAI.boites[a][1] - PAI.boites[b][1]);
    for (const i of idx) { const bo = (o.boites && o.boites[i]) || {}; FLE.boite(PAI.boites[i][0], PAI.boites[i][1], bo.s || 1, Object.assign({ t }, bo)); }
  };
})();
