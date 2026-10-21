// basket.js — « Le basket, inventé avec des paniers à pêches » : marionnettes, accessoires et décors PROPRES À CETTE VIDÉO. Espace M.bkt (alias BKT). Appeler BKT.init() dans S.init.
// Mode d'emploi : persos.md (les plans ne lisent pas ce fichier). Aucun texte, lettre, chiffre ni logo. Déterministe (hash, jamais Math.random).
// MARIONNETTES : BKT.naismith / BKT.concierge / BKT.directeur / BKT.eleve (pose, x, y, s, o) — pose.tenue 'a'..'h' pour l'élève.
// ACCESSOIRES : BKT.panier / ballon / ballonModerne / panierModerne / marteau / balai / montre / banc / seau / medecine (x, y, s, o) ; BKT.echelle(x, y, s, o), BKT.echellePt, BKT.echelleSous.
// DÉCORS : BKT.salle(t, up, o) (o.epoque 'springfield' | 'kansas'), BKT.salleSol(t, o), BKT.panierPt(cote, o) ; repères BKT.SALLE.
(function () {
  'use strict';
  const X = M.X, TAU = M.TAU, PI = Math.PI, D = 180 / PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, hash, smooth } = M;
  const BKT = (M.bkt = {});
  const CH = M.chars;
  const cx_ = () => M.ctx();
  const SIL = () => M._sil();
  const OFFP = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];
  const BACK = 1395, FEET = 1416;

  // =====================================================================
  // 0) OUTILS GÉOMÉTRIQUES
  // =====================================================================
  function ep(cx, cy, rx, ry, n, a0, a1) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; }
  function ell(cx, cy, rx, ry, n) { const o = ep(cx, cy, rx, ry, n || 18, 0, TAU); o.pop(); return o; }
  const tr = (pts, dx, dy) => pts.map((p) => (p[2] ? [p[0] + dx, p[1] + dy, 1] : [p[0] + dx, p[1] + dy]));
  const sc = (pts, kx, ky) => pts.map((p) => (p[2] ? [p[0] * kx, p[1] * ky, 1] : [p[0] * kx, p[1] * ky]));
  const normA = (a) => { while (a > PI) a -= TAU; while (a < -PI) a += TAU; return a; };
  function qbez(p0, p1, p2, n) { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]); } return o; }
  const rect = (x0, y0, x1, y1) => [[x0, y0, 1], [x1, y0, 1], [x1, y1, 1], [x0, y1, 1]];
  const pc = (pts, base, paint, seed, o) => piece(pts, base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));
  const has = (v) => !!v && v !== 'rien';
  function gradR(x0, y0, r0, x1, y1, r1, stops, bb) { if (SIL()) return; const c = cx_(), g = c.createRadialGradient(x0, y0, r0, x1, y1, r1); for (const [o, col] of stops) g.addColorStop(o, col); c.fillStyle = g; c.fillRect(bb[0], bb[1], bb[2] - bb[0], bb[3] - bb[1]); }
  function gradL(x0, y0, x1, y1, stops, bb) { if (SIL()) return; const c = cx_(), g = c.createLinearGradient(x0, y0, x1, y1); for (const [o, col] of stops) g.addColorStop(o, col); c.fillStyle = g; c.fillRect(bb[0], bb[1], bb[2] - bb[0], bb[3] - bb[1]); }
  const tg = (t) => M.tg(t || 0);
  const shadeHex = (h, k) => { const v = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); return '#' + v.map((x) => Math.round(clamp(x * k, 0, 255)).toString(16).padStart(2, '0')).join(''); };
  BKT.geo = { ep, ell, qbez, rect };

  // =====================================================================
  // 1) ACCESSOIRES : registre unique, dessinés à l'échelle 1 (unités des marionnettes : Naismith ≈ 533 de haut)
  // =====================================================================
  // ---- panier à pêches : origine = centre de l'OUVERTURE (bord supérieur). Ouverture 124 de large, fond 86, hauteur 92 ; anses à ±74.
  const PAN = { w: 62, wb: 43, h: 92, anse: 74 };
  const OSIER = '#c9a467', OSIERD = '#a8844a', OSIERL = '#e2c48a', CERCLE = '#8e6a34';
  function peche(x, y, r, seed) {
    pc(ell(x, y, r, r * 0.94, 16), '#e39a6a', () => { dot(x + r * 0.3, y - r * 0.2, r * 0.55, 'rgba(214,92,84,0.55)'); strokePts([[x - r * 0.1, y - r * 0.9], [x - r * 0.2, y + r * 0.2]], 'rgba(150,70,50,0.35)', 1); dot(x - r * 0.35, y - r * 0.35, r * 0.22, 'rgba(255,235,200,0.6)'); }, seed, { texA: 0.35 });
    pc([[x + 1, y - r + 2], [x + 10, y - r - 7], [x + 18, y - r - 4], [x + 9, y - r + 1]], '#6e7d45', null, seed + 1, { drop: false });
  }
  function drawPanier(o) {
    const c = cx_(), f = o.fond == null ? 1 : clamp(o.fond), np = Math.max(0, Math.round(o.peches || 0)), W = PAN.w, B = PAN.wb, H = PAN.h;
    // anses (lamelles de bois courbées sur les côtés)
    for (const sx of [-1, 1]) {
      const a = [[sx * (W - 4), -2], [sx * (W + 14), 2], [sx * (W + 18), 14], [sx * (W + 12), 28], [sx * (W - 2), 30], [sx * (W - 2), 22], [sx * (W + 8), 20], [sx * (W + 9), 12], [sx * (W + 4), 8], [sx * (W - 4), 8]];
      pc(a, OSIERL, () => strokePts([[sx * (W + 2), 2], [sx * (W + 13), 9], [sx * (W + 10), 24]], 'rgba(120,85,40,0.6)', 1), 7101 + sx, { texA: 0.4 });
    }
    // intérieur (bord arrière vu d'un peu au-dessus)
    pc(ell(0, 0, W, 11, 26), '#5e4322', () => { strokePts(ep(0, 0, W - 4, 8, 20, PI, TAU), 'rgba(230,200,140,0.5)', 1.4); }, 7103, { drop: false, texA: 0.3 });
    if (np > 0) {                                                                          // pêches qui dépassent du bord
      for (let i = 0; i < np; i++) { const u = np === 1 ? 0.5 : i / (np - 1), px = lerp(-38, 38, u) + (i % 2 ? 3 : -3), py = -8 - (i % 2) * 9 - (np > 3 && i === Math.floor(np / 2) ? 10 : 0); peche(px, py, 17, 7110 + i * 3); }
    }
    if (o.ballon) { c.save(); c.translate(0, -16); (o.ballon === 'moderne' ? drawBallonModerne : drawBallon)({ tourne: 0.4, t: o.t }); c.restore(); }
    // corps évasé : bord avant courbe (moitié avant de l'ellipse), fond arrondi
    const body = ep(0, 0, W + 2, 11, 16, PI, 0).concat([[W - 6, 40], [B + 3, H - 6], [B - 6, H + 2, 1], [-B + 6, H + 2, 1], [-B - 3, H - 6], [-W + 6, 40]]);
    pc(body, OSIER, () => {
      for (let i = -7; i <= 7; i++) { const xt = i * 8.6, xb = i * 6.2; strokePts([[xt, 6], [xb, H]], 'rgba(110,78,36,0.55)', 1.1); }        // montants
      for (let y = 8; y < H; y += 7) for (let i = -8; i <= 8; i++) { const k = y / H, x0 = (i + ((y / 7) % 2) * 0.5) * lerp(8.6, 6.2, k); strokePts([[x0 - 2.5, y + 1], [x0 + 2.5, y - 1]], 'rgba(255,240,200,0.32)', 1.6); }   // tressage
      hatch([[-W - 4, 0], [-W * 0.35, 0], [-B * 0.3, H + 4], [-B - 4, H + 4]], 0.7, 4.2, 0.24);
      shade(W, 30, -W, 30, 0.22, [-W - 6, -4, W + 6, H + 6]);
    }, 7104, { texA: 0.45 });
    for (const [y, w] of [[12, 7], [H - 22, 7]]) {                                         // deux cerclages
      const k = y / H, hw = lerp(W, B, k) + 1;
      pc([[-hw - 1, y - w / 2], [hw + 1, y - w / 2], [hw, y + w / 2], [-hw, y + w / 2]], CERCLE, () => strokePts([[-hw, y - 1.5], [hw, y - 1.5]], 'rgba(255,220,160,0.4)', 1), 7105 + y, { drop: false, texA: 0.4 });
    }
    strokePts(ep(0, 0, W + 2, 11, 24, 0, PI), '#7f5d2c', 3.2);                               // bord roulé
    strokePts(ep(0, 0, W + 2, 11, 24, 0, PI), 'rgba(255,230,170,0.6)', 1.2);
    if (o.cloue) for (const sx of [-1, 1]) { dot(sx * 40, 5, 4.6, '#3c3a38'); dot(sx * 40 - 1.2, 3.8, 1.6, '#b9b4aa'); strokePts([[sx * 40, 5], [sx * 40 + sx * 3, 12]], 'rgba(30,30,30,0.5)', 1.2); }
    if (f < 1) {                                                                           // fond arraché qui pend sur sa charnière d'osier
      fillPts(ep(0, H - 2, B - 5, 6, 14, 0, PI), '#2c2016');
      const a = (1 - f) * 1.45, hx = -B + 6, hy = H;
      c.save(); c.translate(hx, hy); c.rotate(a);
      pc([[0, -4], [20, -9], [60, -9], [84, -3], [86, 4], [60, 9], [20, 9], [0, 4]], OSIERD, () => { for (let x = 8; x < 84; x += 8) strokePts([[x, -8], [x + 2, 8]], 'rgba(90,60,25,0.6)', 1); strokePts([[82, -4], [88, 1], [83, 6]], 'rgba(90,60,25,0.8)', 1.2); }, 7109, { texA: 0.4 });
      c.restore();
      strokePts([[hx - 2, hy - 2], [hx + 2, hy + 4]], '#7f5d2c', 2.4);
    }
  }
  // ---- ballon 1891 : cuir brun à panneaux et laçage ivoire ; origine = centre, rayon 35
  const BAL_R = 35;
  function drawBallon(o) {
    const c = cx_(), a = o.tourne || 0, R = BAL_R;
    pc(ell(0, 0, R, R, 28), '#7a4a2a', () => {
      c.save(); c.rotate(a);
      for (const k of [-1, 1]) strokePts(ep(R * 1.55, 0, R * 1.22, R * 1.3, 18, PI - 1.1, PI + 1.1).map((p) => [k * p[0], p[1]]), 'rgba(40,22,12,0.85)', 1.6);
      strokePts([[-R, 2], [R, -2]], 'rgba(40,22,12,0.7)', 1.4);
      strokePts([[-4, -R + 6], [-2, -8]], 'rgba(35,20,10,0.9)', 2.4);                      // fente lacée
      for (let y = -R + 8; y < -9; y += 4.4) strokePts([[-9, y], [5, y + 2.2]], '#efe4c8', 1.6);
      c.restore();
      hatch(null, 0.8, 3.6, 0.22, 1, undefined, [-R, -R, R, R]);
      gradR(-12, -14, 2, -4, -4, R * 1.3, [[0, 'rgba(255,225,180,0.45)'], [0.4, 'rgba(255,225,180,0.08)'], [1, 'rgba(30,15,5,0.35)']], [-R, -R, R, R]);
    }, 7201, { texA: 0.5 });
  }
  function drawBallonModerne(o) {
    const c = cx_(), a = o.tourne || 0, R = BAL_R;
    pc(ell(0, 0, R, R, 28), '#c96a2b', () => {
      for (let i = 0; i < 40; i++) dot(-R + 2 * R * hash(i * 1.7), -R + 2 * R * hash(i * 3.3 + 1), 0.9, 'rgba(120,50,15,0.35)');
      c.save(); c.rotate(a);
      strokePts([[0, -R], [0, R]], '#1d1714', 2.2); strokePts([[-R, 0], [R, 0]], '#1d1714', 2.2);
      strokePts(ep(-R * 1.25, 0, R * 0.95, R * 1.05, 16, -1.2, 1.2), '#1d1714', 2.2); strokePts(ep(R * 1.25, 0, R * 0.95, R * 1.05, 16, PI - 1.2, PI + 1.2), '#1d1714', 2.2);
      c.restore();
      gradR(-12, -14, 2, -4, -4, R * 1.3, [[0, 'rgba(255,230,190,0.45)'], [0.4, 'rgba(255,220,170,0.06)'], [1, 'rgba(60,20,5,0.35)']], [-R, -R, R, R]);
    }, 7202, { texA: 0.45 });
  }
  // ---- marteau : origine = prise sur le manche ; manche vers -y, tête en haut, face de frappe vers +x
  function drawMarteau() {
    pc([[-5, 34, 1], [5, 34, 1], [4, -84], [-4, -84]], '#b78a52', () => { strokePts([[-1, 30], [-1, -80]], 'rgba(255,230,180,0.5)', 1.2); hatch(null, 1.5, 3.5, 0.2, 1, undefined, [-6, -90, 6, 36]); }, 7301);
    pc([[-26, -96], [-6, -100, 1], [24, -100, 1], [30, -96], [30, -82], [24, -78, 1], [-6, -78, 1], [-20, -80], [-30, -88]], '#5d5a58', () => { strokePts([[-4, -97], [26, -97]], 'rgba(255,255,255,0.45)', 1.4); fillPts([[-30, -88], [-22, -84], [-26, -92]], '#3a3836'); }, 7302);
  }
  // ---- balai : origine = prise haute ; seconde prise (p2) 90 plus bas ; pointe du manche en (0, -300) ; paille en bas
  function drawBalai() {
    pc([[-4.5, -296, 1], [4.5, -296, 1], [4.5, 206], [-4.5, 206]], '#a57a45', () => { strokePts([[-1, -292], [-1, 202]], 'rgba(255,230,180,0.5)', 1.2); hatch(null, 1.5, 4, 0.18, 1, undefined, [-6, -298, 6, 208]); }, 7401);
    dot(0, -296, 4.5, '#8a6438');
    pc([[-14, 198], [14, 198], [20, 214], [32, 262, 1], [-32, 262, 1], [-20, 214]], '#d6b25e', () => {
      for (let x = -30; x <= 30; x += 4) strokePts([[x * 0.45, 206], [x, 262]], 'rgba(120,85,30,0.55)', 1);
      for (const y of [212, 222]) strokePts([[-20 + (y - 212) * -0.25, y], [20 + (y - 212) * 0.25, y]], '#7a3a26', 2.2);
    }, 7402);
  }
  // ---- montre de gousset en or : origine = centre du boîtier ; anneau en haut
  function drawMontre() {
    pc(ell(0, -21, 5, 5, 10), '#b08d45', () => dot(0, -21, 2.4, '#6e5427'), 7501, { drop: false });
    pc(ell(0, 0, 17, 17, 22), '#c9a24a', () => { strokePts(ep(0, 0, 15, 15, 22, 0, TAU), '#ecc97a', 1.2); }, 7502);
    pc(ell(0, 0, 12.5, 12.5, 20), '#f3ecd8', () => {
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; strokePts([[Math.sin(a) * 9, -Math.cos(a) * 9], [Math.sin(a) * 11.5, -Math.cos(a) * 11.5]], '#2a2420', i % 3 ? 0.8 : 1.6); }
      strokePts([[0, 0], [0, -8]], '#1b1716', 1.4); strokePts([[0, 0], [5, 2]], '#1b1716', 1.6);
    }, 7503, { drop: false, texA: 0.25 });
  }
  // ---- panier moderne : origine = centre du CERCLE (bord avant) ; panneau de verre 600 × 350, cercle 150 de diamètre, filet 125 de haut
  function filetPts(o, k) {
    const t = tg(o.t || 0), a = clamp(o.filet || 0), ph = t * 11;
    const sway = (v) => a * (Math.sin(ph - v * 3) * 10 * v) * Math.exp(-0.2);
    return { x: (u, v) => lerp(-72, 72, u) * lerp(1, 0.62, v) + sway(v) + k, y: (u, v) => 8 + v * 118 + Math.sin(u * PI) * 6 * (1 - v) - a * Math.abs(Math.sin(ph * 0.5)) * 10 * v };
  }
  function drawPanierModerne(o) {
    const c = cx_(), pied = o.pied || 0;
    if (pied > 0) {                                                                         // pied : bras et poteau gainé
      pc([[-14, 40], [14, 40], [14, 60 + pied], [-14, 60 + pied]], '#2a2c30', () => strokePts([[-6, 44], [-6, 56 + pied]], 'rgba(255,255,255,0.18)', 3), 7601);
      pc([[-40, 60 + pied - 50], [40, 60 + pied - 50], [56, 60 + pied, 1], [-56, 60 + pied, 1]], '#1f6fa8', () => strokePts([[-30, 60 + pied - 44], [30, 60 + pied - 44]], 'rgba(255,255,255,0.3)', 2), 7602);
    }
    pc(rect(-300, -300, 300, 50), 'rgba(170,205,225,0.42)', () => {
      gradL(-300, -300, 300, 50, [[0, 'rgba(255,255,255,0.18)'], [0.5, 'rgba(255,255,255,0.02)'], [1, 'rgba(255,255,255,0.15)']], [-300, -300, 300, 50]);
      strokePts([[-240, -280], [-120, -60]], 'rgba(255,255,255,0.35)', 6); strokePts([[-200, -280], [-150, -190]], 'rgba(255,255,255,0.25)', 3);
    }, 7603, { texA: 0.15 });
    strokePts(rect(-296, -296, 296, 46), '#141416', 9, true);
    strokePts(rect(-98, -150, 98, -4), '#f5f2ea', 8, true);
    pc(rect(-14, -6, 14, 14), '#9a9ca0', null, 7604, { drop: false });                     // ferrure
    const F = filetPts(o, 0);
    // filet : losanges (lignes obliques entre l'anneau et le bas)
    for (let i = 0; i <= 12; i++) {
      const u0 = i / 12, a1 = [], a2 = [];
      for (let j = 0; j <= 6; j++) { const v = j / 6, du = (j % 2 ? 1 : 0) * 0.5 / 12; a1.push([F.x(clamp(u0 + du), v), F.y(u0 + du, v)]); a2.push([F.x(clamp(u0 - du), v), F.y(u0 - du, v)]); }
      strokePts(a1, 'rgba(245,242,234,0.95)', 1.6); strokePts(a2, 'rgba(225,222,214,0.8)', 1.2);
    }
    for (let j = 1; j <= 6; j++) { const v = j / 6, row = []; for (let i = 0; i <= 12; i++) row.push([F.x(i / 12, v), F.y(i / 12, v)]); strokePts(row, 'rgba(240,236,226,0.6)', 1); }
    c.save(); c.lineCap = 'round';
    strokePts(ep(0, 0, 76, 15, 30, PI, TAU), '#a5481c', 6);                                // anneau orange (moitié arrière puis avant)
    strokePts(ep(0, 0, 76, 15, 30, 0, PI), '#d9682a', 7);
    strokePts(ep(0, 0, 76, 15, 20, 0.3, 1.4), 'rgba(255,220,180,0.7)', 1.6);
    c.restore();
  }
  // ---- échelle : origine = milieu du pied ; 860 de haut, montants à ±56 en bas, ±48 en haut ; 9 barreaux tous les 86
  const ECH = { h: 860, wb: 56, wt: 48, pas: 86, n: 9 };
  function drawEchelle() {
    const H = ECH.h, wAt = (y) => lerp(ECH.wb, ECH.wt, -y / H);
    for (let k = 1; k <= ECH.n; k++) { const y = -k * ECH.pas, w = wAt(y); pc([[-w, y - 5], [w, y - 5], [w, y + 5], [-w, y + 5]], '#c39a5e', () => { strokePts([[-w, y - 2], [w, y - 2]], 'rgba(255,235,190,0.55)', 1.4); strokePts([[-w, y + 4], [w, y + 4]], 'rgba(90,60,25,0.5)', 1.4); }, 7700 + k, { texA: 0.5 }); }
    for (const sx of [-1, 1]) pc([[sx * ECH.wb - 7, 0, 1], [sx * ECH.wb + 7, 0, 1], [sx * ECH.wt + 6, -H, 1], [sx * ECH.wt - 6, -H, 1]], '#d2ac70', () => {
      strokePts([[sx * ECH.wb - 3, -4], [sx * ECH.wt - 3, -H + 4]], 'rgba(255,240,200,0.55)', 1.6);
      for (let k = 1; k <= ECH.n; k++) { const y = -k * ECH.pas, w = wAt(y); dot(sx * w, y, 2.2, '#6e4a2a'); }
      hatch(null, 1.45, 5, 0.16, 1, undefined, [-80, -H, 80, 0]);
    }, 7690 + sx, { texA: 0.55 });
  }
  // ---- banc de bois (assis) : origine = sol au milieu ; assise à 108 de haut, 300 de long
  const BANC = { h: 108, w: 150 };
  function drawBanc() {
    for (const sx of [-1, 1]) pc([[sx * 118 - 9, -100], [sx * 118 + 9, -100], [sx * 124 + 9, 0, 1], [sx * 124 - 9, 0, 1]], '#6e4a2a', () => hatch(null, 1.4, 4, 0.25, 1, undefined, [-160, -110, 160, 0]), 7801 + sx);
    pc([[-150, -BANC.h - 2, 1], [150, -BANC.h - 2, 1], [152, -BANC.h + 14, 1], [-152, -BANC.h + 14, 1]], '#9a6a3a', () => { strokePts([[-148, -BANC.h + 1], [148, -BANC.h + 1]], 'rgba(255,225,170,0.55)', 1.4); for (let x = -140; x < 150; x += 36) strokePts([[x, -BANC.h + 4], [x + 22, -BANC.h + 9]], 'rgba(70,40,20,0.3)', 1); }, 7804);
    pc([[-118, -46], [118, -46], [118, -38], [-118, -38]], '#5d3e22', null, 7805, { drop: false });
  }
  // ---- seau de bois cerclé, ballon médicinal (premier plan du gymnase)
  function drawSeau() {
    pc([[-30, -70], [30, -70], [25, 0, 1], [-25, 0, 1]], '#8a6a46', () => { for (let x = -24; x <= 24; x += 8) strokePts([[x, -68], [x * 0.85, 0]], 'rgba(60,40,20,0.45)', 1); for (const y of [-58, -16]) strokePts([[-30, y], [30, y]], '#3d3a36', 3); hatch(null, 0.8, 4, 0.2, 1, undefined, [-32, -72, 32, 2]); }, 7811);
    strokePts(ep(0, -70, 30, 6, 16, PI, TAU), '#5b4430', 2); strokePts(ep(0, -72, 28, 30, 20, PI, TAU), '#3d3a36', 1.6);
  }
  function drawMedecine() {
    pc(ell(0, -40, 42, 40, 26), '#5e3b24', () => { strokePts(ep(0, -40, 40, 12, 20, 0, PI), 'rgba(30,15,8,0.6)', 1.4); strokePts([[0, -80], [0, 0]], 'rgba(30,15,8,0.45)', 1.2); gradR(-14, -56, 2, -6, -44, 50, [[0, 'rgba(255,220,170,0.35)'], [1, 'rgba(20,10,5,0.3)']], [-44, -82, 44, 2]); }, 7821);
  }

  const OBJ = {
    panier: { draw: drawPanier, grip: (o) => [(o.anse === 'd' ? 1 : -1) * (PAN.w + 13), 15], pts: { ouverture: [0, 0], centre: [0, 46], fond: [0, PAN.h], anseG: [-PAN.w - 13, 15], anseD: [PAN.w + 13, 15] }, base: [0, PAN.h + 2] },
    ballon: { draw: drawBallon, grip: [8, 26], p2: () => [-16, 24], pts: { centre: [0, 0], haut: [0, -BAL_R], bas: [0, BAL_R] }, base: [0, BAL_R] },
    ballonModerne: { draw: drawBallonModerne, grip: [8, 26], p2: () => [-16, 24], pts: { centre: [0, 0], haut: [0, -BAL_R], bas: [0, BAL_R] }, base: [0, BAL_R] },
    marteau: { draw: drawMarteau, grip: [0, 0], held: { droit: false, angle: PI / 2 }, pts: { face: [30, -89], tete: [2, -89], centre: [0, -40] }, base: [0, 34] },
    balai: { draw: drawBalai, grip: [0, 0], p2: () => [0, 96], pts: { pointe: [0, -296], centre: [0, -60], brosse: [0, 262] }, base: [0, 262] },
    montre: { draw: drawMontre, grip: [0, 14], pts: { centre: [0, 0], anneau: [0, -21] }, base: [0, 17] },
    panierModerne: { draw: drawPanierModerne, grip: [0, 0], pts: { cercle: [0, 0], filet: [0, 126], panneau: [0, -125] }, base: (o) => [0, 60 + (o.pied || 0)] },
    banc: { draw: drawBanc, grip: [0, -108], pts: { assise: [0, -BANC.h] }, base: [0, 0] },
    seau: { draw: drawSeau, grip: [0, -72], pts: { bord: [0, -70] }, base: [0, 0] },
    medecine: { draw: drawMedecine, grip: [0, -40], pts: { centre: [0, -40] }, base: [0, 0] },
  };
  BKT.OBJ = OBJ; BKT.PAN = PAN; BKT.BAL_R = BAL_R; BKT.BANC = BANC; BKT.ECH = ECH;
  const gripOf = (ob, o) => (typeof ob.grip === 'function' ? ob.grip(o) : ob.grip);
  const ptOf = (ob, n, o) => { const v = ob.pts[n]; return v == null ? null : typeof v === 'function' ? v(o) : v; };
  function heldOpts(name, o, p) { const ob = OBJ[name]; return Object.assign({ t: (p && p.t) || 0, echelle: 1 }, o || {}); }
  function heldDraw(name, o, p) {
    const ob = OBJ[name]; if (!ob) return;
    const oo = heldOpts(name, o, p), g = gripOf(ob, oo), c = cx_();
    c.save(); c.scale(oo.echelle, oo.echelle); c.translate(-g[0], -g[1]); ob.draw(oo); c.restore();
  }

  // =====================================================================
  // 2) PIÈCES COMMUNES : bras et jambes à articulations rondes (genou articulé), mains, objets tenus (doigts par-dessus)
  // =====================================================================
  const R_COUDE = 11.5, DOIGTS = [[-13, -9], [9, -11], [12, -4], [12, 6], [6, 11], [-6, 11], [-13, 4]];
  function armR(len, wt, rc) { rc = rc || R_COUDE; const m = len * 0.42; return ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1, m], [rc + 0.5, len - 6]], ep(0, len, rc, rc, 10, 0, PI), [[-rc - 0.5, len - 6], [-wt + 1, m]]); }
  function foreR(kind) { const cap = ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU); return cap.concat(X.forePts(kind === 'open' ? 'open' : 'fist').slice(2)); }
  // cuisse : rivet de hanche en (0,0), genou rond en (0, L) ; tibia : genou en (0,0), semelle en y = L, pointe du pied vers +x
  function thighR(L, w) { return ep(0, 0, w, w, 10, PI, TAU).concat([[w - 1, L * 0.45], [16.5, L - 4]], ep(0, L, 16.5, 16.5, 10, 0, PI), [[-16.5, L - 4], [-w + 1, L * 0.45]]); }
  function shinR(L) { return ep(0, 0, 16, 16, 10, PI, TAU).concat([[15, L * 0.4], [12, L - 28], [14, L - 16], [36, L - 11], [46, L - 4, 1], [45, L, 1], [-17, L, 1], [-19, L - 14], [-15, L - 30], [-16, L * 0.4]]); }
  function heldParts(skin, seed) {
    const dP = () => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(70,40,30,0.5)', 1); hatch(null, 0.9, 3.4, 0.15); };
    const F = [4, 96], dev = (p) => has(p.tenu) && OBJ[p.tenu] && !p._derriere, der = (p) => has(p.tenu) && OBJ[p.tenu] && p._derriere;
    return {
      objetD: { parent: 'armF_lo', at: F, noRivet: true, base: '#000', seed: seed + 5, pts: OFFP, extra: (p) => { if (der(p)) heldDraw(p.tenu, p.tenuO, p); } },
      objet: { parent: 'armF_lo', at: F, noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (dev(p)) heldDraw(p.tenu, p.tenuO, p); } },
      doigts: { parent: 'armF_lo', at: F, noRivet: true, base: skin, seed: seed + 2, pts: (p) => (has(p.tenu) ? DOIGTS : OFFP), paint: dP },
      objetB: { parent: 'armB_lo', at: F, noRivet: true, base: '#000', seed: seed + 3, pts: OFFP, extra: (p) => { if (has(p.tenuB)) heldDraw(p.tenuB, p.tenuBO, p); } },
      doigtsB: { parent: 'armB_lo', at: F, noRivet: true, base: skin, seed: seed + 4, pts: (p) => (has(p.tenuB) && !p._deux ? DOIGTS : OFFP), paint: dP },
      doigtsB2: { parent: 'armB_lo', at: F, noRivet: true, base: skin, seed: seed + 6, pts: (p) => (p._deux ? DOIGTS : OFFP), paint: dP },
    };
  }

  // ---- préparation commune des poses
  function prep(p) { p = p || {}; const q = Object.assign({}, p, { ang: Object.assign({}, p.ang), hide: Object.assign({}, p.hide), face: Object.assign({}, p.face) }); q._o0 = q.ang.objet || 0; q._oB0 = q.ang.objetB || 0; q.dx = q.dx || 0; q.dy = q.dy || 0; q.tilt = q.tilt || 0; return q; }
  function defA(A, d) { for (const k in d) if (A[k] == null) A[k] = d[k]; }
  const faceSet = (q, d) => { for (const k in d) if (q.face[k] == null) q.face[k] = d[k]; };
  const blend = (q, n, v, k) => { q.ang[n] = lerp(q.ang[n] || 0, v, k); };
  function applyDroit(def, q) {
    const A = q.ang, tl = q.tilt || 0;
    A.objet = q.droit ? q._o0 - ((A.armF_up || 0) + (A.armF_lo || 0) + tl) : q._o0; A.objetD = A.objet;
    A.objetB = q.droitB ? q._oB0 - ((A.armB_up || 0) + (A.armB_lo || 0) + tl) : q._oB0;
  }
  function autoTenu(q) {
    if (has(q.tenu)) { if (!q.handF || q.handF === 'open') q.handF = 'fist'; const h = OBJ[q.tenu] && OBJ[q.tenu].held; if (q.droit == null) q.droit = h ? h.droit : true; if (h && h.angle && !q._a0) { q._o0 += h.angle; q._a0 = 1; } }
    if (has(q.tenuB)) { if (!q.handB || q.handB === 'open') q.handB = 'fist'; const h = OBJ[q.tenuB] && OBJ[q.tenuB].held; if (q.droitB == null) q.droitB = h ? h.droit : true; if (h && h.angle && !q._b0) { q._oB0 += h.angle; q._b0 = 1; } }
  }
  function locPt(def, q, x, y, s, dir, part, p) { const { mats } = M.partMatrices(def, q, x, y, s, dir); return M.wpt(mats[part], p[0], p[1]); }
  function objPt(def, q, x, y, s, dir, arm, p, raw) {
    const F = arm === 'armF', name = F ? q.tenu : q.tenuB, { mats } = M.partMatrices(def, q, x, y, s, dir), fm = mats[arm + '_lo'].translate(4, 96);
    if (Array.isArray(p) && !raw && !has(name)) return M.wpt(mats[arm + '_lo'], p[0], p[1]);
    if (!has(name) || !OBJ[name]) return M.wpt(fm, 0, 0);
    const ob = OBJ[name], oo = heldOpts(name, F ? q.tenuO : q.tenuBO, q), g = gripOf(ob, oo), e = oo.echelle;
    const pp = raw ? p : (typeof p === 'string' ? ptOf(ob, p, oo) : null); if (!pp) return M.wpt(fm, 0, 0);
    return M.wpt(fm.rotate(((F ? q.ang.objet : q.ang.objetB) || 0) * D), (pp[0] - g[0]) * e, (pp[1] - g[1]) * e);
  }
  // amène le poing (ou le point nommé de l'objet tenu) sur la cible écran par M.ik (bendSign 1 = coude vers l'avant)
  function reach(def, q, x, y, s, dir, arm, cible, k, ptName, bend) {
    if (!(k > 0) || !cible) return;
    bend = bend || 1;
    const A = q.ang, a0 = A[arm + '_up'] || 0, b0 = A[arm + '_lo'] || 0;
    const tmp = Object.assign({}, q, { ang: Object.assign({}, A) });
    let T = [cible[0], cible[1]], sol = null;
    for (let it = 0; it < (ptName ? 5 : 1); it++) {
      sol = M.ik(def, tmp, x, y, s, dir, arm, T, bend);
      tmp.ang[arm + '_up'] = sol.up; tmp.ang[arm + '_lo'] = sol.lo; applyDroit(def, tmp);
      if (!ptName) break;
      const E = objPt(def, tmp, x, y, s, dir, arm, ptName);
      T = [T[0] + cible[0] - E[0], T[1] + cible[1] - E[1]];
    }
    A[arm + '_up'] = a0 + normA(sol.up - a0) * k; A[arm + '_lo'] = b0 + normA(sol.lo - b0) * k;
  }
  // point local du torse relatif à l'épaule avant (dx vers l'avant, dy vers le bas), en coordonnées écran
  const shPt = (def, q, x, y, s, dir, dx, dy) => locPt(def, q, x, y, s, dir, 'torso', [def.sh[0] + dx, def.sh[1] + dy]);
  function finishQ(def, q, x, y, s, dir) {
    if (q.atteint > 0 && q.cible) { const arm = q.bras === 'B' ? 'armB' : 'armF'; reach(def, q, x, y, s, dir, arm, q.cible, ease(clamp(q.atteint)), q.ptCible || (has(arm === 'armF' ? q.tenu : q.tenuB) ? 'centre' : null)); }
    applyDroit(def, q); q._deux = false;
    if (q.deuxMains && has(q.tenu) && OBJ[q.tenu] && OBJ[q.tenu].p2) {
      const oo = heldOpts(q.tenu, q.tenuO, q), P2 = objPt(def, q, x, y, s, dir, 'armF', OBJ[q.tenu].p2(oo), true);
      reach(def, q, x, y, s, dir, 'armB', P2, 1, null, 1); q.handB = 'fist'; q._deux = true;
    }
    applyDroit(def, q);
    return q;
  }
  function run(def, q, x, y, s, o, nom) {
    const r = M.puppet(def, q, x, y, s, Object.assign({ slot: M.ST.slotF, nom }, o || {}));
    r.tenu = q.tenu; r.tenuB = q.tenuB; r.q = q; r.def = def; r.s = s; r.dir = (o && o.dir) || 1;
    if (has(q.tenu) && OBJ[q.tenu]) r.tenuO = heldOpts(q.tenu, q.tenuO, q);
    if (has(q.tenuB) && OBJ[q.tenuB]) r.tenuBO = heldOpts(q.tenuB, q.tenuBO, q);
    r.main = r.w('armF_lo', 4, 96); r.mainB = r.w('armB_lo', 4, 96); r.tete = r.w('head', -4, -100);
    if (def.post) def.post(r, q, o || {});
    return r;
  }
  // point nommé de l'objet tenu (main avant, ou arrière si arriere = true) → [X, Y] écran
  BKT.pt = function (r, nom, arriere) {
    const name = arriere ? r.tenuB : r.tenu, ob = OBJ[name]; if (!ob) return null;
    const oo = arriere ? r.tenuBO : r.tenuO, q = ptOf(ob, nom, oo); if (!q) return null; const g = gripOf(ob, oo), e = oo.echelle;
    return r.w(arriere ? 'objetB' : 'objet', (q[0] - g[0]) * e, (q[1] - g[1]) * e);
  };
  // marche : cuisses en opposition, genou qui fléchit, petit rebond ; balancement des bras faible (jamais la main derrière le dos)
  function marcheQ(q) {
    const m = clamp(q.marche || 0); if (m <= 0) return; const t = q.t || 0, w = Math.sin(t * 6.5 + (q.marchePh || 0));
    q.ang.legF_up = (q.ang.legF_up || 0) - 0.34 * m * w; q.ang.legB_up = (q.ang.legB_up || 0) + 0.34 * m * w;
    q.ang.legF_lo = (q.ang.legF_lo || 0) + 0.42 * m * Math.max(0, w); q.ang.legB_lo = (q.ang.legB_lo || 0) + 0.42 * m * Math.max(0, -w);
    q.dy -= Math.abs(Math.cos(t * 6.5 + (q.marchePh || 0))) * 7 * m;
    if (!has(q.tenuB) && !q._brasB) q.ang.armB_up = (q.ang.armB_up || 0) - 0.12 * m * w;
    if (!has(q.tenu) && !q._brasF) q.ang.armF_up = (q.ang.armF_up || 0) + 0.12 * m * w;
  }
  // assis 0..1 : cuisses à l'horizontale, tibias verticaux ; le corps descend de la longueur de cuisse → assise à BANC.h (108) du sol
  function assisQ(def, q, k) {
    if (!(k > 0)) return; const a = 1.5 * k;
    q.ang.legF_up = (q.ang.legF_up || 0) - a; q.ang.legB_up = (q.ang.legB_up || 0) - a * 0.96;
    q.ang.legF_lo = (q.ang.legF_lo || 0) + a; q.ang.legB_lo = (q.ang.legB_lo || 0) + a * 0.96;
    q.dy += def.thigh * (1 - Math.cos(a));
  }
  // grimpe : phase (tours) → jambes qui montent l'une après l'autre (genou haut, pied à plat)
  function grimpeJambes(q, k, ph) {
    const u = 0.5 + 0.5 * Math.sin(ph * TAU), v = 1 - u;
    q.ang.legF_up = (q.ang.legF_up || 0) - lerp(0.1, 1.05, u) * k; q.ang.legF_lo = (q.ang.legF_lo || 0) + lerp(0.1, 1.1, u) * k;
    q.ang.legB_up = (q.ang.legB_up || 0) - lerp(0.1, 1.05, v) * k; q.ang.legB_lo = (q.ang.legB_lo || 0) + lerp(0.1, 1.1, v) * k;
    return u;
  }

  // ---- fabrique d'une marionnette « humaine » : torse racine, jambes à genou, bras ronds, tête, pièces de tête et de buste en plus
  function mkHumain(K) {
    const sd = K.seed, hk = (back) => (p) => (back ? p.handB : p.handF) || 'fist';
    const fore = (back) => ({ parent: back ? 'armB_up' : 'armF_up', at: [0, 94], pts: (p) => foreR(hk(back)(p)), base: back ? K.mancheD : K.manche, seed: sd + (back ? 11 : 12), paint: (p) => {
      const k = hk(back)(p), skin = back ? K.peauD : K.peau;
      fillPts([[-20, 76, 1], [20, 76, 1], [24, 130, 1], [-20, 130, 1]], skin); X.handPaint(null, k === 'open' ? 'open' : 'fist');
      if (K.cuff) K.cuff(back, p);
      hatch([[-14, -10], [-3, -10], [-3, 60], [-14, 60]], 0.9, 3.8, back ? 0.32 : 0.22);
    } });
    const up = (back) => ({ parent: 'torso', at: back ? K.shB : K.shF, pts: armR(94, K.armW || 17), base: back ? K.mancheD : K.manche, seed: sd + (back ? 13 : 14), paint: (p) => {
      if (K.armDeco) K.armDeco(back, p); hatch([[-18, -20], [-4, -20], [-4, 100], [-18, 100]], 0.9, 3.8, back ? 0.34 : 0.24);
    } });
    const leg = (back) => {
      const pant = back ? K.pantD : K.pant, shoe = back ? K.shoeD : K.shoe;
      return [{ parent: 'torso', at: [back ? -6 : 6, -2], pts: thighR(K.thigh, K.legW || 21), base: pant, seed: sd + (back ? 21 : 22), noRivet: true, paint: (p) => {
        if (K.legDeco) K.legDeco(back, 'up', p);
        hatch([[-24, -10], [-6, -10], [-6, K.thigh + 10], [-24, K.thigh + 10]], 0.8, 4, back ? 0.36 : 0.2); M.rivet(0, K.thigh, 3.2);
      } }, { parent: back ? 'legB_up' : 'legF_up', at: [0, K.thigh], pts: shinR(K.shin), base: pant, seed: sd + (back ? 23 : 24), noRivet: true, paint: (p) => {
        if (K.legDeco) K.legDeco(back, 'lo', p);
        fillPts([[-30, K.shin - 22, 1], [60, K.shin - 22, 1], [60, K.shin + 4, 1], [-30, K.shin + 4, 1]], shoe);
        if (K.shoeDeco) K.shoeDeco(back, K.shin);
        strokePts([[14, K.shin - 15], [42, K.shin - 6]], 'rgba(255,240,220,0.3)', 1.3);
        hatch([[-22, 0], [-6, 0], [-6, K.shin - 22], [-22, K.shin - 22]], 0.8, 4, back ? 0.36 : 0.2);
      } }];
    };
    const [lbU, lbL] = leg(true), [lfU, lfL] = leg(false);
    const parts = {
      torso: { parent: null, at: [0, 0], pts: K.torso, base: K.corps, seed: sd + 1, paint: (p) => K.torsoPaint(p) },
      legB_up: lbU, legB_lo: lbL, legF_up: lfU, legF_lo: lfL,
      armB_up: up(true), armB_lo: fore(true), armF_up: up(false), armF_lo: fore(false),
      head: { parent: 'torso', at: K.neck, pts: K.headPts, base: K.peau, seed: sd + 2, noRivet: true, rest: K.headRest || 0, paint: (p) => K.headPaint(p, p.face || {}) },
    };
    Object.assign(parts, K.extra || {});
    Object.assign(parts, heldParts(K.peau, sd + 40));
    const extraB = K.orderBehind || [], extraH = K.orderHead || [], extraF = K.orderFront || [];
    return { hipY: 2 - K.thigh - K.shin, handLen: 98, bend: { armF: 1, armB: 1 }, nom: K.nom, rod: { part: 'torso', at: K.rod || [-26, 18] }, sh: K.shF, shB: K.shB, thigh: K.thigh, shin: K.shin, post: K.post,
      parts, order: ['armB_up', 'armB_lo', 'objetB', 'doigtsB', 'legB_lo', 'legB_up', 'legF_lo', 'legF_up'].concat(extraB, ['head'], extraH, ['torso'], extraF, ['objetD', 'armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsB2']) };
  }

  // ---- chevelure : contour du crâne (front → nuque) décalé vers l'extérieur selon le style ; mèches peintes le long des normales
  const CRANE = [[24, -80], [20, -88], [12, -94], [0, -98], [-12, -96], [-24, -89], [-31, -78], [-34, -64], [-33, -48], [-29, -36]];
  const CRANE_IN = [[-24, -40], [-21, -54], [-12, -66], [2, -74], [14, -78], [20, -79]];
  function crane() { const P = []; for (let i = 0; i < CRANE.length - 1; i++) for (let j = 0; j < 4; j++) { const a = CRANE[i], b = CRANE[i + 1], u = j / 4; P.push([lerp(a[0], b[0], u), lerp(a[1], b[1], u)]); } P.push(CRANE[CRANE.length - 1]); return P; }
  function epaisseur(style, u, i) {
    const front = Math.max(0, 1 - u / 0.22);
    switch (style) {
      case 'cote': return 5 + 9 * front;
      case 'plaque': return 2.5 + 2 * front;
      case 'frise': return 6 + 4 * Math.abs(Math.sin(i * 1.25));
      case 'brosse': return u < 0.55 ? (i % 2 ? 13 : 6) : 4;
      case 'raie': return 6 + 3 * Math.sin(u * PI);
      case 'court': return 4 + 2 * front;
      case 'ebouriffe': return 6 + 12 * hash(i * 7.3) * (i % 2 ? 1 : 0.35);
      case 'ondule': return 8 + 3 * Math.sin(i * 1.1) + 4 * front;
      case 'arriere': return 4 + 5 * u;
      default: return 5;
    }
  }
  function cheveuxPts(style, kx, ky) {
    const P = crane(), n = P.length, c0 = [-4, -60], out = P.map((p, i) => { const u = i / (n - 1), dx = p[0] - c0[0], dy = p[1] - c0[1], l = Math.hypot(dx, dy), th = epaisseur(style, u, i); return [p[0] + dx / l * th, p[1] + dy / l * th]; });
    if (style === 'raie' || style === 'ebouriffe' || style === 'cote') out.unshift([27, -74], [28, -79]);              // petite mèche sur le front
    return sc(out.concat(CRANE_IN), kx, ky == null ? kx : ky);
  }
  // pièce « cheveux » (enfant de la tête) ; col = couleur, k / ky = échelle de la tête
  function cheveuxPiece(style, col, seed, kx, ky) {
    ky = ky == null ? kx : ky; const pts = cheveuxPts(style, kx, ky), P = crane(), dark = shadeHex(col, 0.62), lite = shadeHex(col, 1.45);
    return { parent: 'head', at: [0, 0], noRivet: true, base: col, seed, pts, paint: () => {
      const c0 = [-4, -60];
      const radial = style === 'brosse' || style === 'ebouriffe' || style === 'frise';
      if (radial) for (let i = 0; i < P.length; i += 1) { const p = P[i], dx = p[0] - c0[0], dy = p[1] - c0[1], l = Math.hypot(dx, dy);
        strokePts([[(p[0] - dx / l * 8) * kx, (p[1] - dy / l * 8) * ky], [(p[0] + dx / l * 10) * kx, (p[1] + dy / l * 10) * ky]], i % 3 ? 'rgba(20,12,8,0.3)' : 'rgba(255,240,210,0.2)', 1); }
      else for (const off of [-3, 1, 5, 9]) {                                                                       // mèches peignées vers l'arrière
        const L = P.map((p, i) => { const dx = p[0] - c0[0], dy = p[1] - c0[1], l = Math.hypot(dx, dy), th = Math.min(off, epaisseur(style, i / (P.length - 1), i) - 1.5); return [(p[0] + dx / l * th) * kx, (p[1] + dy / l * th) * ky]; });
        strokePts(L, off === 5 ? 'rgba(255,240,210,0.25)' : 'rgba(20,12,8,0.3)', 1); }
      if (style === 'cote') strokePts([[14 * kx, -98 * ky], [-6 * kx, -104 * ky], [-22 * kx, -98 * ky]], lite, 1.6);
      if (style === 'raie') strokePts([[0, -102 * ky], [2 * kx, -92 * ky]], dark, 1.6);
      if (style === 'plaque' || style === 'arriere') strokePts([[16 * kx, -92 * ky], [-6 * kx, -101 * ky], [-26 * kx, -92 * ky]], 'rgba(255,255,255,0.4)', 1.6);
      if (style === 'frise') for (let i = 0; i < 14; i++) { const a = -0.5 - i * 0.2; strokePts(ep(-4 + 40 * Math.cos(a), -60 + 46 * Math.sin(a), 4.5, 4.5, 8, 0, PI * 1.4), 'rgba(140,130,120,0.5)', 1); }
      hatch(null, 0.5, 3.2, 0.14, 1, undefined, [-55, -120, 45, -25]);
    } };
  }
  // ---- tête de profil générique (cou en y = 16, nez vers +x) : nez 'droit' | 'retrousse' | 'aquilin' | 'rond' ; k = échelle, kx = largeur
  function tetePts(nez, k, kx) {
    const N = { droit: [[29, -26], [28, -30], [31, -34], [37, -39, 1], [33, -46]], retrousse: [[29, -26], [28, -30], [32, -33], [36, -37, 1], [34, -41], [30, -46]], aquilin: [[29, -26], [28, -30], [33, -33], [39, -38, 1], [37, -44], [32, -50]], rond: [[29, -26], [29, -29], [34, -32], [38, -37, 1], [36, -43], [31, -47]] }[nez || 'droit'];
    const H = [[-14, 16], [10, 16], [11, 2], [16, -6], [24, -10], [28, -16], [27, -22]].concat(N, [[29, -56], [29, -64], [26, -78], [14, -92], [-6, -97], [-24, -88], [-33, -68], [-32, -46], [-24, -28], [-17, -8]]);
    return sc(H, (kx || 1) * k, k);
  }

  // =====================================================================
  // 3) JAMES NAISMITH — ≈ 30 ans, cheveux bruns courts raie sur le côté, moustache brune soignée, tête nue ; pull à col roulé écru,
  //    deux rayures bordeaux aux poignets, pantalon de flanelle gris-brun, chaussures de gymnastique noires, sifflet de laiton (cordon rouge)
  // =====================================================================
  const NS = { pull: '#e3d8bd', pullD: '#c7ba98', bord: '#6e2430', pant: '#6b5a48', pantD: '#54463a', shoe: '#1f1b1a', shoeD: '#121010', peau: '#e6c3a0', peauD: '#c7a07f', chev: '#4a3324', chevD: '#33231a', laiton: '#c9a24a', cordon: '#9a2a24' };
  const NS_TORSO = [[-16, -196], [10, -198], [20, -188], [28, -170], [34, -150], [36, -120], [35, -80], [31, -40], [30, -6], [32, 26, 1], [-32, 28, 1], [-33, -6], [-35, -50], [-38, -100], [-38, -140], [-34, -170], [-26, -188]];
  const NS_MOUST = [[20, -38], [30, -40], [36, -37], [38, -32], [33, -30], [26, -32], [20, -33]];
  const SIFFLET = [[-8, -5], [9, -6], [12, -3], [12, 4], [-8, 5], [-11, 0]];
  function mkNaismith() {
    return mkHumain({ nom: 'naismith', seed: 9100, peau: NS.peau, peauD: NS.peauD, corps: NS.pull, manche: NS.pull, mancheD: NS.pullD,
      torso: NS_TORSO, neck: [6, -188], shF: [-2, -160], shB: [-10, -160], armW: 17, thigh: 118, shin: 122, pant: NS.pant, pantD: NS.pantD, shoe: NS.shoe, shoeD: NS.shoeD,
      torsoPaint: (p) => {
        fillPts([[-40, -12], [40, -12], [40, 40], [-40, 40]], NS.pant);
        strokePts([[22, 0], [26, 26]], 'rgba(40,30,20,0.4)', 1.2);
        for (let x = -30; x < 34; x += 6.5) strokePts([[x, -186], [x + 1, -14]], 'rgba(150,135,100,0.32)', 1);       // côtes du tricot
        fillPts([[-36, -22], [36, -22], [34, -8], [-36, -8]], NS.pullD); for (let x = -34; x < 34; x += 4) strokePts([[x, -21], [x, -9]], 'rgba(120,105,75,0.4)', 0.9);
        fillPts([[-22, -202], [16, -204], [24, -190], [24, -174], [-28, -172], [-32, -186]], NS.pullD);             // col roulé
        for (const y of [-196, -188, -180]) strokePts([[-26, y], [22, y - 1]], 'rgba(110,95,65,0.5)', 1.1);
        if (!(p._siffle > 0.5)) { strokePts([[-6, -174], [6, -150], [20, -126]], NS.cordon, 1.7); strokePts([[14, -175], [22, -150], [22, -126]], NS.cordon, 1.5); }
        hatch([[-40, -180], [-12, -180], [-14, -10], [-40, -10]], 0.75, 4.4, 0.26); shade(34, -90, -38, -90, 0.24);
        strokePts([[30, -150], [34, -100]], 'rgba(255,250,235,0.35)', 3);
      },
      cuff: (back) => { for (const y of [58, 66]) strokePts([[-11, y], [11, y]], back ? '#55202a' : NS.bord, 2.6); },
      headPts: tetePts('droit', 1.06),
      headPaint: (p, f) => {
        X.earPaint(-8.5, -46.6); hatch([[-24, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.24);
        dot(17, -34, 9, 'rgba(205,130,110,0.2)'); strokePts([[26, -12], [14, -2], [2, 4]], 'rgba(120,80,60,0.35)', 1.1);
        X.eye(f, 19, -55); X.brow(f, 19, -64, NS.chevD, 2.8); X.mouth(f, 29, -26);
        fillPts([[18, -37], [28, -39], [33, -36], [34, -31], [29, -30.5], [23, -32], [17, -33]], NS.chev); for (let x = 20; x < 33; x += 3) strokePts([[x, -37.5], [x + 1, -32]], 'rgba(20,12,8,0.5)', 0.8);
      },
      extra: {
        cheveux: cheveuxPiece('cote', NS.chev, 9131, 1.06),
        siffletM: { parent: 'head', at: [42, -27], noRivet: true, base: NS.laiton, seed: 9133, pts: (p) => (p._siffle > 0.5 ? SIFFLET : OFFP), paint: () => { dot(4, -1, 3, '#7a5a20'); strokePts([[-7, -3], [8, -4]], 'rgba(255,240,190,0.7)', 1.2); },
          extra: (p) => { if (p._siffle > 0.5) strokePts([[-12, 2], [-24, 22], [-34, 44]], NS.cordon, 1.5); } },
        sifflet: { parent: 'torso', at: [24, -120], noRivet: true, base: NS.laiton, seed: 9134, pts: (p) => (p._siffle > 0.5 ? OFFP : SIFFLET.map((q) => [q[1], q[0]])), paint: () => { dot(-1, 3, 2.6, '#7a5a20'); strokePts([[-3, -7], [-4, 8]], 'rgba(255,240,190,0.7)', 1.2); } },
      },
      orderHead: ['cheveux', 'siffletM'], orderFront: ['sifflet'],
    });
  }
  CH.bktNaismith = mkNaismith();
  const REST = { armF_up: -0.1, armF_lo: -0.22, armB_up: 0.04, armB_lo: -0.2, head: 0 };
  const gE = (q, n) => ease(clamp(q[n] || 0));
  // mains sur les genoux (assis)
  function mainsGenoux(def, q, x, y, s, dir, k) {
    if (!(k > 0)) return;
    reach(def, q, x, y, s, dir, 'armF', locPt(def, q, x, y, s, dir, 'legF_up', [16, def.thigh - 40]), k);
    reach(def, q, x, y, s, dir, 'armB', locPt(def, q, x, y, s, dir, 'legB_up', [12, def.thigh - 60]), k);
  }
  BKT.naismithPose = function (p, x, y, s, dir) {
    const q = prep(p), A = q.ang, def = CH.bktNaismith; x = x || 0; y = y || 0; s = s == null ? 0.9 : s; dir = dir || 1;
    defA(A, REST);
    const t = q.t || 0, g = tg(t);
    const si = gE(q, 'siffle'), so = gE(q, 'souleve'), pr = gE(q, 'presente'), no = gE(q, 'non'), cl = gE(q, 'cloue'), sp = gE(q, 'soupir'), as = gE(q, 'assis'), id = gE(q, 'idee');
    const tiU = clamp(q.tire || 0), ti = smooth(0, 0.3, tiU);
    if ((so > 0 || ti > 0) && q.tenu == null) q.tenu = 'ballon';
    if ((so > 0 || ti > 0) && (q.tenu === 'ballon' || q.tenu === 'ballonModerne') && q.deuxMains == null) q.deuxMains = true;
    if (cl > 0 && q.tenu == null) q.tenu = 'marteau';
    q._brasF = so > 0 || pr > 0 || no > 0 || cl > 0 || ti > 0 || id > 0 || si > 0; q._brasB = no > 0 || cl > 0 || q.deuxMains;
    assisQ(def, q, as);
    if (!(as > 0)) q.dy += Math.sin(g * 1.7) * 1.2;
    marcheQ(q);
    autoTenu(q);
    mainsGenoux(def, q, x, y, s, dir, as);
    if (sp > 0) {
      q.dy += 6 * sp; A.head += 0.3 * sp; q.tilt += 0.03 * sp; faceSet(q, { eyes: 'closed', brow: 'worry', mouth: 'o' });
      if (!(as > 0)) { blend(q, 'armF_up', 0.02, sp); blend(q, 'armF_lo', -0.06, sp); blend(q, 'armB_up', 0.02, sp); blend(q, 'armB_lo', -0.06, sp); }
    }
    if (si > 0) {
      q._siffle = si; A.head -= 0.06 * si; faceSet(q, { mouth: 'o', brow: 'up' });
      reach(def, q, x, y, s, dir, 'armF', locPt(def, q, x, y, s, dir, 'head', [52, -18]), si);
    }
    if (so > 0) {
      A.head -= 0.22 * so; faceSet(q, { mouth: 'smile', brow: 'up' });
      reach(def, q, x, y, s, dir, 'armF', shPt(def, q, x, y, s, dir, 34, -186), so, has(q.tenu) ? 'centre' : null);
    }
    if (pr > 0) {
      faceSet(q, { mouth: 'smile', brow: 'up' }); if (!has(q.tenu)) q.handF = 'open';
      reach(def, q, x, y, s, dir, 'armF', q.cible || shPt(def, q, x, y, s, dir, 176, 22), pr);
    }
    if (no > 0) {
      q.tilt -= 0.04 * no; A.head += 0.07 * Math.sin(g * 10) * no + 0.04 * no; faceSet(q, { brow: 'frown', mouth: 'tight' });
      if (!has(q.tenu)) q.handF = 'open'; if (!has(q.tenuB)) q.handB = 'open';
      reach(def, q, x, y, s, dir, 'armF', shPt(def, q, x, y, s, dir, 98, -4), no);
      reach(def, q, x, y, s, dir, 'armB', shPt(def, q, x, y, s, dir, 74, 18), no);
    }
    if (cl > 0) {
      const ph = q.coup != null ? ((q.coup % 1) + 1) % 1 : (g * 1.6) % 1, hit = smooth(0.55, 0.8, ph) * (1 - smooth(0.86, 1, ph));
      q.cloueHit = hit; A.head -= 0.12 * cl; faceSet(q, { brow: 'frown', mouth: 'tight' });
      const C = q.cible || shPt(def, q, x, y, s, dir, 150, -40), up = [C[0] - 34 * s * dir, C[1] - 110 * s];
      reach(def, q, x, y, s, dir, 'armF', [lerp(up[0], C[0], hit), lerp(up[1], C[1], hit)], cl, q.tenu === 'marteau' ? 'face' : null);
      reach(def, q, x, y, s, dir, 'armB', [C[0] - 16 * s * dir, C[1] + 22 * s], cl);
    }
    if (ti > 0) {
      const v = smooth(0.45, 1, tiU); A.head -= 0.16 * ti; faceSet(q, { brow: 'up', mouth: v > 0.5 ? 'o' : 'tight' });
      const P0 = shPt(def, q, x, y, s, dir, 70, 40), P1 = shPt(def, q, x, y, s, dir, 104, -150);
      reach(def, q, x, y, s, dir, 'armF', [lerp(P0[0], P1[0], v), lerp(P0[1], P1[1], v)], ti, has(q.tenu) ? 'centre' : null);
      if (!has(q.tenu)) { q.handF = 'open'; q.handB = 'open'; reach(def, q, x, y, s, dir, 'armB', [lerp(P0[0], P1[0], v) - 20 * s * dir, lerp(P0[1], P1[1], v) + 10 * s], ti); }
    }
    if (id > 0) {
      A.head -= 0.12 * id; faceSet(q, { brow: 'up', mouth: 'o', eyes: 'wide' }); if (!has(q.tenu)) q.handF = 'open';
      reach(def, q, x, y, s, dir, 'armF', shPt(def, q, x, y, s, dir, 76, -126), id);
    }
    return finishQ(def, q, x, y, s, dir);
  };
  BKT.naismith = (pose, x, y, s, o) => { s = s == null ? 0.9 : s; const dir = (o && o.dir) || 1; return run(CH.bktNaismith, BKT.naismithPose(pose, x, y, s, dir), x, y, s, o, 'naismith'); };

  // =====================================================================
  // 4) LE CONCIERGE — ≈ 60 ans, voûté, crâne chauve et luisant, couronne de cheveux blancs, gros favoris blancs (sans moustache),
  //    petites lunettes au bout d'un nez rond et rouge ; longue blouse gris ardoise boutonnée, trousseau de clés de laiton, bottines brunes
  // =====================================================================
  const CO = { blouse: '#7d8288', blouseD: '#646970', blouseL: '#959aa0', pant: '#4b4038', pantD: '#3a3129', shoe: '#5a3a22', shoeD: '#43291a', peau: '#e9c3a6', peauD: '#c99f84', blanc: '#ece9e1', blancD: '#c9c5bb', laiton: '#c29a45' };
  const CO_TORSO = [[-16, -190], [10, -192], [20, -182], [30, -164], [38, -140], [42, -100], [45, -50], [47, 0], [51, 60], [55, 112, 1], [-48, 114, 1], [-46, 60], [-44, 0], [-45, -60], [-48, -110], [-46, -150], [-38, -174], [-26, -186]];
  const CO_HAIR = sc([[-6, -76], [-20, -84], [-32, -76], [-39, -58], [-39, -38], [-34, -22], [-26, -16], [-21, -27], [-25, -40], [-24, -55], [-16, -67]], 1.04, 1.04);
  const CO_FAV = sc([[1, -64], [7, -62], [10, -50], [13, -38], [18, -28], [22, -18], [20, -10], [23, -4], [16, 0], [14, 7], [6, 4], [3, 10], [-2, 2], [-1, -16], [0, -36], [0, -52]], 1.04, 1.04);
  const CLES = () => {
    pc(ell(0, 14, 11, 11, 16).concat(ell(0, 14, 7, 7, 14).reverse()), CO.laiton, null, 9241, { drop: false });
    for (const [a, l] of [[-0.35, 30], [0.05, 36], [0.42, 28]]) {
      const c = cx_(); c.save(); c.translate(Math.sin(a) * 10, 14 + Math.cos(a) * 10); c.rotate(-a);
      pc([[-2.6, 0], [2.6, 0], [2.6, l - 8], [7, l - 6], [7, l - 2], [2.6, l - 2], [2.6, l], [-2.6, l], [-6, l - 4], [-6, l - 10], [-2.6, l - 10]], CO.laiton, () => strokePts([[-1, 2], [-1, l - 4]], 'rgba(255,240,190,0.6)', 1), 9242 + l, { drop: false });
      pc(ell(0, -1, 5, 5, 10), CO.laiton, () => dot(0, -1, 2, '#6e5427'), 9250 + l, { drop: false });
      c.restore();
    }
  };
  function mkConcierge() {
    return mkHumain({ nom: 'concierge', seed: 9200, peau: CO.peau, peauD: CO.peauD, corps: CO.blouse, manche: CO.blouse, mancheD: CO.blouseD,
      torso: CO_TORSO, neck: [8, -182], shF: [-4, -154], shB: [-12, -154], armW: 18, thigh: 118, shin: 122, pant: CO.pant, pantD: CO.pantD, shoe: CO.shoe, shoeD: CO.shoeD, headRest: 0.1,
      torsoPaint: () => {
        fillPts([[4, -192], [22, -184], [26, -170], [14, -160], [6, -172]], CO.blouseD);                              // petit col rabattu
        fillPts([[-20, -190], [2, -194], [4, -176], [-18, -170]], CO.blouseD);
        strokePts([[30, -164], [40, -110], [45, -40], [50, 40], [53, 110]], 'rgba(40,44,50,0.55)', 1.3);             // boutonnage
        for (const y of [-140, -100, -60, -20, 20, 60]) dot(41 + y * 0.03 + (y > 0 ? y * 0.05 : 0), y, 2.8, '#2f3236');
        fillPts([[-48, -40], [48, -42], [48, -30], [-48, -28]], CO.blouseD);                                             // martingale
        fillPts([[8, 18], [40, 18], [42, 52], [8, 52]], 'rgba(60,64,70,0.35)'); strokePts([[8, 18], [40, 18]], 'rgba(40,44,50,0.6)', 1.2); // poche
        for (const x of [-30, -14, 2]) strokePts([[x, -26], [x - 4, 108]], 'rgba(40,44,50,0.35)', 1.2);
        hatch([[-50, -170], [-14, -170], [-18, 112], [-50, 112]], 0.75, 4.4, 0.3); shade(44, -40, -46, -40, 0.24, [-60, -200, 60, 120]);
        strokePts([[36, -140], [42, -80]], 'rgba(230,236,240,0.25)', 3);
      },
      cuff: (back) => { fillPts([[-12, 60, 1], [12, 60, 1], [12, 72, 1], [-12, 72, 1]], back ? '#55595f' : CO.blouseD); },
      headPts: tetePts('rond', 1.04),
      headPaint: (p, f) => {
        X.earPaint(-8.3, -45.8); hatch([[-26, -44], [0, -30], [10, -10], [-8, 18], [-34, 4]], 0.6, 3.6, 0.24);
        strokePts([[-14, -94], [6, -100], [20, -90]], 'rgba(255,250,240,0.85)', 3.4); dot(-2, -92, 4, 'rgba(255,255,245,0.6)');   // crâne luisant
        for (const y of [-74, -80, -86]) strokePts([[10, y], [24, y + 3]], 'rgba(120,80,60,0.4)', 1);                           // rides du front
        dot(37, -39, 8, 'rgba(200,80,70,0.45)'); dot(14, -30, 9, 'rgba(210,110,100,0.25)');
        strokePts([[28, -48], [33, -52]], 'rgba(120,80,60,0.45)', 1); strokePts([[10, -46], [4, -50]], 'rgba(120,80,60,0.4)', 1);
        fillPts(CO_FAV, CO.blanc); for (let y = -56; y < 8; y += 5) strokePts([[1, y], [15, y + 4]], 'rgba(150,145,135,0.55)', 1); strokePts(CO_FAV.slice(2, 12), 'rgba(150,145,135,0.7)', 1.2);
        X.eye(f, 18, -54); X.brow(f, 18, -63, CO.blanc, 3.6); X.mouth(f, 29, -24);
        strokePts([[29, -46], [-4, -50]], '#3a3330', 1.2);                                                                       // branche des lunettes
      },
      extra: {
        couronne: { parent: 'head', at: [0, 0], noRivet: true, base: CO.blanc, seed: 9231, pts: CO_HAIR, paint: () => { for (let y = -78; y < -20; y += 7) strokePts([[-36, y], [-22, y + 3]], 'rgba(150,145,135,0.6)', 1); } },
        lunettes: { parent: 'head', at: [33, -45], noRivet: true, base: 'rgba(205,228,236,0.45)', seed: 9233, texA: 0.1, pts: ell(0, 0, 5.5, 4.2, 12), paint: () => { strokePts(ep(0, 0, 5, 3.8, 14, 0, TAU), '#3a3330', 1.6); strokePts([[-2, -2], [2, -3]], 'rgba(255,255,255,0.8)', 1); } },
        cles: { parent: 'torso', at: [26, -30], noRivet: true, base: '#000', seed: 9240, pts: OFFP, rest: 0, extra: () => CLES() },
      },
      orderHead: ['couronne', 'lunettes'], orderFront: ['cles'],
    });
  }
  CH.bktConcierge = mkConcierge();
  BKT.conciergePose = function (p, x, y, s, dir) {
    const q = prep(p), A = q.ang, def = CH.bktConcierge; x = x || 0; y = y || 0; s = s == null ? 0.85 : s; dir = dir || 1;
    defA(A, { armF_up: -0.08, armF_lo: -0.2, armB_up: 0.03, armB_lo: -0.18, head: 0 });
    const t = q.t || 0, g = tg(t);
    const po = gE(q, 'porte'), epa = gE(q, 'epaules'), gr = gE(q, 'grimpe'), at = gE(q, 'attrape'), ou = gE(q, 'ouf'), as = gE(q, 'assis');
    const pe = q.perce != null ? 1 : 0, peU = clamp(q.perce || 0);
    if (po > 0) { if (q.tenu == null) q.tenu = 'panier'; if (q.tenuB == null) q.tenuB = 'panier'; q.tenuO = Object.assign({ anse: 'g' }, q.tenuO); q.tenuBO = Object.assign({ anse: 'd' }, q.tenuBO); }
    if (pe > 0 && q.tenu == null) q.tenu = 'balai';
    if (pe > 0 && q.tenu === 'balai' && q.deuxMains == null) q.deuxMains = true;
    q._brasF = po > 0 || epa > 0 || gr > 0 || at > 0 || ou > 0 || pe > 0; q._brasB = q._brasF;
    A.cles = (A.cles || 0) + Math.sin(g * 2.3) * 0.08 + (q.marche ? Math.sin((q.t || 0) * 6.5) * 0.25 * clamp(q.marche) : 0);
    assisQ(def, q, as);
    if (!(as > 0)) q.dy += Math.sin(g * 1.5) * 1.3;
    marcheQ(q);
    autoTenu(q);
    mainsGenoux(def, q, x, y, s, dir, as);
    if (po > 0) {
      q.tilt += 0.025 * po; q.dy += 3 * po; faceSet(q, { brow: 'worry', mouth: 'tight' });
      blend(q, 'armF_up', -0.16, po); blend(q, 'armF_lo', -0.12, po); blend(q, 'armB_up', -0.06, po); blend(q, 'armB_lo', -0.08, po);
    }
    if (epa > 0) {
      q.dy -= 5 * epa; A.head += 0.12 * epa; faceSet(q, { brow: 'up', mouth: 'tight' });
      if (!has(q.tenu)) q.handF = 'open'; if (!has(q.tenuB)) q.handB = 'open';
      reach(def, q, x, y, s, dir, 'armF', shPt(def, q, x, y, s, dir, 96, 104), epa);
      reach(def, q, x, y, s, dir, 'armB', shPt(def, q, x, y, s, dir, 66, 112), epa);
    }
    if (gr > 0) {
      const ph = q.phase != null ? q.phase : g * 0.7, u = grimpeJambes(q, gr, ph);
      A.head -= 0.14 * gr; faceSet(q, { brow: 'worry', mouth: 'tight' });
      reach(def, q, x, y, s, dir, 'armF', q.cible || shPt(def, q, x, y, s, dir, 64, lerp(-150, -96, u)), gr);
      reach(def, q, x, y, s, dir, 'armB', q.cibleB || shPt(def, q, x, y, s, dir, 50, lerp(-96, -150, u)), gr);
    }
    if (at > 0) {
      A.head -= 0.1 * at; faceSet(q, { brow: 'up', mouth: 'o', eyes: 'wide' }); q.tilt -= 0.03 * at;
      if (has(q.tenu)) { q.deuxMains = q.deuxMains == null ? true : q.deuxMains; reach(def, q, x, y, s, dir, 'armF', shPt(def, q, x, y, s, dir, 120, -30), at, 'centre'); }
      else { q.handF = 'open'; q.handB = 'open'; reach(def, q, x, y, s, dir, 'armF', shPt(def, q, x, y, s, dir, 140, -50), at); reach(def, q, x, y, s, dir, 'armB', shPt(def, q, x, y, s, dir, 118, -20), at); }
    }
    if (pe > 0) {
      A.head -= 0.38; faceSet(q, { brow: 'frown', mouth: 'tight' });
      const P0 = shPt(def, q, x, y, s, dir, 60, -30), P1 = shPt(def, q, x, y, s, dir, 52, -176), v = ease(peU);
      reach(def, q, x, y, s, dir, 'armF', [lerp(P0[0], P1[0], v), lerp(P0[1], P1[1], v)], 1);
    }
    if (ou > 0) {
      A.head -= 0.08 * ou; faceSet(q, { eyes: 'closed', mouth: 'o', brow: 'worry' }); if (!has(q.tenu)) q.handF = 'open';
      const H = locPt(def, q, x, y, s, dir, 'head', [30 + Math.sin(g * 5) * 8, -86]);
      reach(def, q, x, y, s, dir, 'armF', H, ou);
    }
    return finishQ(def, q, x, y, s, dir);
  };
  BKT.concierge = (pose, x, y, s, o) => { s = s == null ? 0.85 : s; const dir = (o && o.dir) || 1; return run(CH.bktConcierge, BKT.conciergePose(pose, x, y, s, dir), x, y, s, o, 'concierge'); };

  // =====================================================================
  // 5) LE DIRECTEUR (Luther Gulick) — grand et mince, cheveux noirs plaqués, moustache noire en brosse, lunettes rondes cerclées d'or ;
  //    redingote bleu nuit, gilet ocre, col blanc et cravate noire, chaîne de montre en or, pantalon gris rayé
  // =====================================================================
  const DI = { coat: '#2b3550', coatD: '#1f2740', coatL: '#3c4868', gilet: '#b08a3e', giletD: '#8a6a2c', chem: '#efe8d6', pant: '#4a4b52', pantD: '#393a40', shoe: '#18161a', shoeD: '#0f0e10', peau: '#e4bf9c', peauD: '#c49c7c', chev: '#1b1a1e', or: '#c9a24a' };
  const DI_TORSO = [[-14, -206], [10, -208], [18, -198], [26, -182], [31, -160], [33, -120], [31, -80], [29, -40], [32, 0], [38, 60], [42, 118, 1], [-40, 120, 1], [-36, 60], [-33, 0], [-34, -60], [-35, -120], [-34, -160], [-30, -182], [-22, -198]];
  const DI_MOUST = [[20, -36], [31, -37], [33, -31], [21, -31]];
  function mkDirecteur() {
    return mkHumain({ nom: 'directeur', seed: 9300, peau: DI.peau, peauD: DI.peauD, corps: DI.coat, manche: DI.coat, mancheD: DI.coatD,
      torso: DI_TORSO, neck: [6, -200], shF: [-2, -172], shB: [-10, -172], armW: 16, thigh: 126, shin: 130, pant: DI.pant, pantD: DI.pantD, shoe: DI.shoe, shoeD: DI.shoeD, legW: 19,
      legDeco: (back) => { for (let x = -14; x < 18; x += 7) strokePts([[x, -10], [x * 0.8, 140]], back ? 'rgba(20,20,26,0.35)' : 'rgba(25,25,32,0.3)', 1); },
      torsoPaint: () => {
        fillPts([[8, -204], [24, -192], [31, -164], [31, -52], [20, -50], [16, -120], [10, -176]], DI.gilet);                // gilet ocre dans l'ouverture
        for (const y of [-150, -126, -102, -78]) dot(27, y, 2.2, DI.giletD);
        strokePts([[27, -126], [16, -112], [12, -96], [20, -84], [28, -80]], DI.or, 1.6);                                    // chaîne de montre
        fillPts([[10, -208], [22, -204], [26, -194], [16, -190], [10, -196]], DI.chem); fillPts([[16, -196], [24, -194], [22, -176], [16, -178]], '#1d1b1f'); // col et cravate
        strokePts([[12, -200], [22, -176], [20, -120], [18, -50], [26, 0], [34, 116]], 'rgba(10,14,26,0.7)', 1.6);       // revers / bord de la redingote
        fillPts([[12, -190], [20, -168], [16, -140], [10, -160]], DI.coatL);
        for (const x of [-26, -12, 4]) strokePts([[x, -2], [x - 2, 116]], 'rgba(10,14,26,0.55)', 1.3);
        dot(-30, -4, 2.6, '#11151f'); dot(-18, -4, 2.6, '#11151f');
        hatch([[-38, -190], [-8, -190], [-12, 118], [-40, 118]], 0.75, 4.4, 0.3); shade(30, -60, -34, -60, 0.22, [-50, -210, 50, 125]);
        strokePts([[28, -150], [30, -100]], 'rgba(200,210,240,0.22)', 3);
      },
      cuff: (back) => { fillPts([[-12, 66, 1], [12, 66, 1], [12, 76, 1], [-12, 76, 1]], back ? '#cfc6b0' : DI.chem); },
      headPts: tetePts('aquilin', 1.03, 0.94),
      headPaint: (p, f) => {
        X.earPaint(-8, -46); hatch([[-24, -42], [2, -30], [10, -10], [-6, 18], [-30, 4]], 0.6, 3.6, 0.24);
        strokePts([[24, -14], [12, -6]], 'rgba(120,80,60,0.35)', 1); strokePts([[18, -30], [16, -40]], 'rgba(120,80,60,0.3)', 1);
        X.eye(f, 17, -55); X.brow(f, 17, -64, 'rgba(25,22,24,0.95)', 2.6); X.mouth(f, 28, -25);
        fillPts([[19, -35], [30, -36], [31, -30.5], [20, -30.5]], '#1e1b1e'); for (let x = 21; x < 31; x += 2.2) strokePts([[x, -35], [x, -31]], 'rgba(150,150,160,0.5)', 0.7);
      },
      extra: {
        cheveux: cheveuxPiece('plaque', DI.chev, 9331, 0.97, 1.03),
        lunettes: { parent: 'head', at: [17, -55], noRivet: true, base: 'rgba(205,228,236,0.35)', seed: 9333, texA: 0.1, pts: ell(0, 0, 10, 10, 16), paint: () => { strokePts(ep(0, 0, 9, 9, 18, 0, TAU), DI.or, 2); strokePts([[-4, -5], [1, -7]], 'rgba(255,255,255,0.8)', 1.2); },
          extra: () => strokePts([[-10, 0], [-26, 6]], DI.or, 1.3) },
      },
      orderHead: ['cheveux', 'lunettes'],
      post: (r, q) => {                                                                                                         // chaîne tirée jusqu'à la montre tenue
        if (q.tenu !== 'montre' || SIL()) return;
        const a = r.w('torso', 26, -96), b = BKT.pt(r, 'anneau'); if (!b) return;
        const c = cx_(); c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
        const m = [(a[0] + b[0]) / 2, Math.max(a[1], b[1]) + 18 * r.s];
        c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo(m[0], m[1], b[0], b[1]); c.strokeStyle = '#8d6a26'; c.lineWidth = 2.6 * r.s; c.stroke();
        c.setLineDash([2.5 * r.s, 2 * r.s]); c.strokeStyle = '#ecc97a'; c.lineWidth = 1.6 * r.s; c.stroke(); c.restore();
      },
    });
  }
  CH.bktDirecteur = mkDirecteur();
  BKT.directeurPose = function (p, x, y, s, dir) {
    const q = prep(p), A = q.ang, def = CH.bktDirecteur; x = x || 0; y = y || 0; s = s == null ? 0.9 : s; dir = dir || 1;
    defA(A, { armF_up: -0.06, armF_lo: -0.24, armB_up: 0.03, armB_lo: -0.22, head: -0.02 });
    const t = q.t || 0, g = tg(t);
    const mo = gE(q, 'montre'), de = gE(q, 'designe'), ap = gE(q, 'applaudit'), as = gE(q, 'assis');
    if (mo > 0 && q.tenu == null) q.tenu = 'montre';
    q._brasF = mo > 0 || de > 0 || ap > 0; q._brasB = mo > 0 || ap > 0;
    assisQ(def, q, as);
    if (!(as > 0)) q.dy += Math.sin(g * 1.6) * 1.1;
    marcheQ(q);
    autoTenu(q);
    mainsGenoux(def, q, x, y, s, dir, as);
    if (mo > 0) {
      A.head += 0.26 * mo; faceSet(q, { brow: 'frown', mouth: 'tight' });
      reach(def, q, x, y, s, dir, 'armF', shPt(def, q, x, y, s, dir, 84, 54), mo, has(q.tenu) ? 'centre' : null);
      applyDroit(def, q);
      const W = has(q.tenu) ? objPt(def, q, x, y, s, dir, 'armF', 'centre') : shPt(def, q, x, y, s, dir, 84, 54);
      const tap = Math.abs(Math.sin(g * 7)) * (q.tapote == null ? 1 : q.tapote);
      q.handB = 'open';
      reach(def, q, x, y, s, dir, 'armB', [W[0] - 6 * s * dir, W[1] - (20 + 16 * tap) * s], mo);
    }
    if (de > 0) {
      A.head -= 0.04 * de; faceSet(q, { mouth: 'smile', brow: 'up' }); if (!has(q.tenu)) q.handF = 'open';
      reach(def, q, x, y, s, dir, 'armF', q.cible || shPt(def, q, x, y, s, dir, 172, 26), de);
    }
    if (ap > 0) {
      faceSet(q, { mouth: 'smile', brow: 'up' }); A.head -= 0.06 * ap; q.handF = 'open'; q.handB = 'open';
      const C = shPt(def, q, x, y, s, dir, 96, 46), gap = (6 + 22 * Math.abs(Math.sin(g * 8.5))) * s;
      reach(def, q, x, y, s, dir, 'armF', C, ap);
      reach(def, q, x, y, s, dir, 'armB', [C[0] - gap * dir, C[1] + 4 * s], ap);
    }
    return finishQ(def, q, x, y, s, dir);
  };
  BKT.directeur = (pose, x, y, s, o) => { s = s == null ? 0.9 : s; const dir = (o && o.dir) || 1; return run(CH.bktDirecteur, BKT.directeurPose(pose, x, y, s, dir), x, y, s, o, 'directeur'); };

  // =====================================================================
  // 6) L'ÉLÈVE (≈ 20 ans) — maillot de laine à manches longues et pantalon long ; une couleur ENTIÈRE et une tête par tenue
  //    Springfield : a bordeaux (brute, cheveux noirs frisés) · b vert mousse (roux en brosse) · c ocre (blond, raie au milieu)
  //    d bleu ardoise (petite moustache) · e gris perle rayé brun (châtain ébouriffé) · f brun tabac (brute, crâne rasé)
  //    Kansas : g maillot cramoisi / pantalon bleu (auburn ondulé, favoris) · h maillot gris clair / pantalon noir (blond platine)
  // =====================================================================
  const EL = {
    a: { maillot: '#7a2e2e', pant: '#7a2e2e', chev: '#16130f', style: 'frise', nez: 'aquilin', peau: '#e0b996' },
    b: { maillot: '#5d6b3f', pant: '#5d6b3f', chev: '#b4562a', style: 'brosse', nez: 'retrousse', peau: '#efcdb0', taches: 1 },
    c: { maillot: '#b08a3e', pant: '#b08a3e', chev: '#e3c36a', style: 'raie', nez: 'droit', peau: '#e8c4a2' },
    d: { maillot: '#4a5d73', pant: '#4a5d73', chev: '#5a3d26', style: 'court', nez: 'rond', peau: '#ddb08a', moust: 1 },
    e: { maillot: '#c9c8c2', pant: '#c9c8c2', chev: '#7a4a2a', style: 'ebouriffe', nez: 'droit', peau: '#e6c09c', rayures: '#6b4a32' },
    f: { maillot: '#6e4b32', pant: '#6e4b32', chev: '#5a4a3e', style: 'rase', nez: 'rond', peau: '#d6a77e' },
    g: { maillot: '#8c2a2a', pant: '#2c4a7a', chev: '#8a3f22', style: 'ondule', nez: 'aquilin', peau: '#e2b993', favoris: 1 },
    h: { maillot: '#c8c8c4', pant: '#222226', chev: '#ece0b0', style: 'arriere', nez: 'retrousse', peau: '#f0d2b8', taches: 1 },
  };
  BKT.TENUES = EL;
  const EL_TORSO = [[-16, -192], [10, -194], [20, -186], [30, -170], [38, -150], [40, -120], [36, -80], [30, -40], [29, -6], [30, 24, 1], [-30, 26, 1], [-31, -6], [-33, -50], [-38, -110], [-40, -148], [-34, -172], [-26, -186]];
  const elDefs = {};
  function mkEleve(T, carrure) {
    const C = EL[T], kx = carrure ? 1.16 : 1, mD = shadeHex(C.maillot, 0.82), pD = shadeHex(C.pant, 0.82), chD = shadeHex(C.chev, 0.7), seed = 9400 + (T.charCodeAt(0) - 97) * 60 + (carrure ? 30 : 0);
    const ray = (back) => { if (!C.rayures) return; for (let y = -6; y < 96; y += 14) fillPts([[-24, y], [24, y], [24, y + 5], [-24, y + 5]], back ? shadeHex(C.rayures, 0.8) : C.rayures); };
    const extra = {};
    if (C.style !== 'rase') extra.cheveux = cheveuxPiece(C.style, C.chev, seed + 31, 1);
    const hp = (p) => {};
    void hp;
    return mkHumain({ nom: 'eleve' + T, seed, peau: C.peau, peauD: shadeHex(C.peau, 0.86), corps: C.maillot, manche: C.maillot, mancheD: mD,
      torso: sc(EL_TORSO, kx, 1), neck: [6, -184], shF: [-2 * kx, -156], shB: [-10 * kx, -156], armW: carrure ? 20 : 17, legW: carrure ? 23 : 21, thigh: 114, shin: 120,
      pant: C.pant, pantD: pD, shoe: '#2a2420', shoeD: '#1b1714',
      armDeco: (back) => ray(back), legDeco: () => {},
      torsoPaint: () => {
        const w = 40 * kx;
        if (C.rayures) for (let y = -176; y < -12; y += 16) fillPts([[-w - 4, y], [w + 4, y], [w + 4, y + 6], [-w - 4, y + 6]], C.rayures);
        fillPts([[-w, -12], [w, -12], [w, 40], [-w, 40]], C.pant);                                                          // pantalon
        fillPts([[-w, -14], [w, -14], [w, -4], [-w, -4]], '#4a3322'); dot(26 * kx, -9, 3, '#b08d45');                         // ceinture de cuir
        fillPts([[-18, -196], [12, -198], [20, -188], [16, -182], [-20, -180]], mD);                                            // col rond côtelé
        strokePts([[16, -186], [24, -164]], 'rgba(30,20,15,0.6)', 1.2); for (const y of [-182, -176, -170]) strokePts([[17 + (y + 186) * 0.3, y], [23 + (y + 186) * 0.3, y + 1]], '#e9e1cc', 1.1); // laçage
        for (let x = -30 * kx; x < 34 * kx; x += 7) strokePts([[x, -180], [x + 1, -18]], 'rgba(20,10,10,0.12)', 1);
        hatch([[-44 * kx, -180], [-12, -180], [-14, -14], [-44 * kx, -14]], 0.75, 4.4, 0.26); shade(36 * kx, -90, -38 * kx, -90, 0.26, [-60, -200, 60, 40]);
        strokePts([[30 * kx, -150], [34 * kx, -110]], 'rgba(255,250,235,0.3)', 3);
      },
      cuff: (back) => fillPts([[-12, 62, 1], [12, 62, 1], [12, 74, 1], [-12, 74, 1]], back ? shadeHex(mD, 0.85) : mD),
      headPts: tetePts(C.nez, 1.0),
      headPaint: (p, f) => {
        X.earPaint(-8, -44); hatch([[-24, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.22);
        if (C.style === 'rase') { fillPts([[26, -70], [24, -82], [12, -94], [-6, -99], [-26, -90], [-35, -70], [-34, -50], [-24, -46], [-18, -62], [0, -72]], 'rgba(70,60,55,0.35)'); for (let i = 0; i < 40; i++) dot(-30 + 52 * hash(i * 2.1), -94 + 30 * hash(i * 5.3), 0.9, 'rgba(40,30,25,0.5)'); }
        dot(16, -32, 8, 'rgba(210,120,100,0.22)');
        if (C.taches) for (let i = 0; i < 9; i++) dot(10 + 16 * hash(i * 3.7 + T.charCodeAt(0)), -44 + 14 * hash(i * 1.9), 1.1, 'rgba(160,80,40,0.55)');
        if (C.moust) fillPts([[20, -33], [28, -34], [30, -30.5], [21, -30.5]], chD);
        if (C.favoris) fillPts([[-1, -64], [5, -64], [6, -44], [2, -38], [-1, -44]], C.chev);
        X.eye(f, 17, -52); X.brow(f, 17, -60, chD, 2.6); X.mouth(f, 27, -26);
      },
      extra, orderHead: Object.keys(extra),
    });
  }
  function eleveDef(T, carrure) { const k = T + (carrure ? 'C' : ''); return elDefs[k] || (elDefs[k] = CH['bktEleve' + k.toUpperCase()] = mkEleve(T, carrure)); }
  for (const T of Object.keys(EL)) eleveDef(T, T === 'a' || T === 'f');
  BKT.eleveDef = (pose) => { const T = (pose && pose.tenue) || 'a'; const cr = pose && pose.carrure != null ? !!pose.carrure : (T === 'a' || T === 'f'); return eleveDef(T, cr); };
  BKT.elevePose = function (p, x, y, s, dir) {
    const q = prep(p), A = q.ang, def = BKT.eleveDef(q); x = x || 0; y = y || 0; s = s == null ? 0.82 : s; dir = dir || 1;
    defA(A, { armF_up: -0.08, armF_lo: -0.24, armB_up: 0.04, armB_lo: -0.2, head: 0 });
    const t = q.t || 0, g = tg(t) + (q.tenue || 'a').charCodeAt(0) * 0.37;
    const sa = gE(q, 'saute'), ch = gE(q, 'chahute'), pl = gE(q, 'plaque'), jo = gE(q, 'joie'), po = gE(q, 'porte'), rh = gE(q, 'regardeHaut'), as = gE(q, 'assis');
    q._brasF = sa > 0 || ch > 0 || pl > 0 || jo > 0 || po > 0; q._brasB = q._brasF;
    assisQ(def, q, as);
    if (!(as > 0)) q.dy += Math.sin(g * 1.9) * 1.2;
    marcheQ(q);
    autoTenu(q);
    mainsGenoux(def, q, x, y, s, dir, as);
    if (rh > 0) { A.head -= 0.5 * rh; faceSet(q, { eyes: 'wide', mouth: 'o', brow: 'up' }); }
    if (sa > 0) {
      A.head -= 0.2 * sa; faceSet(q, { mouth: 'o', brow: 'up' }); if (!has(q.tenu)) q.handF = 'open'; if (!has(q.tenuB)) q.handB = 'open';
      A.legF_up = (A.legF_up || 0) - 0.22 * sa; A.legF_lo = (A.legF_lo || 0) + 0.42 * sa; A.legB_up = (A.legB_up || 0) + 0.06 * sa; A.legB_lo = (A.legB_lo || 0) + 0.3 * sa;
      reach(def, q, x, y, s, dir, 'armF', shPt(def, q, x, y, s, dir, 40, -186), sa);
      reach(def, q, x, y, s, dir, 'armB', shPt(def, q, x, y, s, dir, 14, -184), sa);
    }
    if (ch > 0) {
      const u = g * 1.3; faceSet(q, { mouth: 'o', brow: 'frown' }); q.dy -= Math.abs(Math.sin(u * PI * 2)) * 8 * ch;
      blend(q, 'armF_up', -1.45 + 0.95 * Math.sin(u * TAU), ch); blend(q, 'armF_lo', -0.95 + 0.5 * Math.sin(u * TAU + 1.2), ch);
      blend(q, 'armB_up', -1.25 + 0.9 * Math.sin(u * TAU + PI), ch); blend(q, 'armB_lo', -0.9 + 0.45 * Math.sin(u * TAU + PI + 1.2), ch);
    }
    if (pl > 0) {
      q.tilt += 0.15 * pl; A.head += 0.12 * pl; faceSet(q, { brow: 'frown', mouth: 'tight' });
      A.legF_up = (A.legF_up || 0) - 0.42 * pl; A.legF_lo = (A.legF_lo || 0) + 0.34 * pl; A.legB_up = (A.legB_up || 0) + 0.26 * pl; A.legB_lo = (A.legB_lo || 0) + 0.12 * pl;
      blend(q, 'armF_up', -0.55, pl); blend(q, 'armF_lo', -1.75, pl); blend(q, 'armB_up', -0.35, pl); blend(q, 'armB_lo', -0.9, pl);
    }
    if (jo > 0) {
      A.head -= 0.26 * jo; faceSet(q, { mouth: 'smile', brow: 'up', eyes: 'closed' }); q.dy -= Math.abs(Math.sin(g * 5)) * 6 * jo;
      if (!has(q.tenu)) q.handF = 'open'; if (!has(q.tenuB)) q.handB = 'open';
      reach(def, q, x, y, s, dir, 'armF', shPt(def, q, x, y, s, dir, 100, -150), jo);
      reach(def, q, x, y, s, dir, 'armB', shPt(def, q, x, y, s, dir, -20, -178), jo);
    }
    if (po > 0) {
      A.head -= 0.18 * po; faceSet(q, { brow: 'worry', mouth: 'tight' }); q.handF = 'open'; q.handB = 'open';
      A.legF_up = (A.legF_up || 0) - 0.18 * po; A.legF_lo = (A.legF_lo || 0) + 0.3 * po; A.legB_up = (A.legB_up || 0) + 0.12 * po; A.legB_lo = (A.legB_lo || 0) + 0.12 * po; q.dy += 6 * po;
      reach(def, q, x, y, s, dir, 'armF', q.cible || shPt(def, q, x, y, s, dir, 52, -176), po);
      reach(def, q, x, y, s, dir, 'armB', q.cibleB || shPt(def, q, x, y, s, dir, 26, -172), po);
    }
    return finishQ(def, q, x, y, s, dir);
  };
  BKT.eleve = (pose, x, y, s, o) => {
    pose = Object.assign({}, pose); if (o && o.tenue && !pose.tenue) pose.tenue = o.tenue;
    const def = BKT.eleveDef(pose); s = (s == null ? 0.82 : s) * (/C$/.test(def.nom) ? 1 : 1); const big = pose.carrure != null ? !!pose.carrure : (pose.tenue === 'a' || pose.tenue === 'f');
    if (big) s *= 1.1;
    const dir = (o && o.dir) || 1; return run(def, BKT.elevePose(pose, x, y, s, dir), x, y, s, o, 'eleve ' + (pose.tenue || 'a'));
  };

  // =====================================================================
  // 7) ACCESSOIRES SEULS — M.puppet à une pièce invisible ; l'objet se dessine dans l'extra (ombre portée possible)
  // =====================================================================
  OBJ.echelle = { draw: drawEchelle, grip: [0, -430], pts: { haut: [0, -ECH.h], pied: [0, 0] }, base: [0, 0] };
  OBJ.panier.base = (o) => (o.cloue || o.accroche ? [0, 0] : [0, PAN.h + 2]);
  OBJ.ballon.base = OBJ.ballonModerne.base = (o) => (o.centre ? [0, 0] : [0, BAL_R]);
  OBJ.panierModerne.base = (o) => (o.pied ? [0, 60 + o.pied] : [0, 0]);
  const accDefs = {};
  function accDef(name, fn) { return accDefs[name] || (accDefs[name] = { hipY: 0, handLen: 10, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => fn(p.o) } }, order: ['o'] }); }
  const baseOf = (ob, o) => (typeof ob.base === 'function' ? ob.base(o) : ob.base);
  function acc(name, x, y, s, o) {
    o = o || {}; s = s == null ? 1 : s;
    const ob = OBJ[name], oo = Object.assign({ t: o.t || 0 }, o);
    const def = accDef(name, (q) => { const c = cx_(), b = baseOf(ob, q); c.save(); c.translate(-b[0], -b[1]); ob.draw(q); c.restore(); });
    return M.puppet(def, { o: oo, tilt: o.rot || 0 }, x, y, s, { dir: o.dir || 1, rod: false, slot: o.slot != null ? o.slot : y + 6 * s, floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha, nom: name });
  }
  for (const n of ['panier', 'ballon', 'ballonModerne', 'panierModerne', 'marteau', 'balai', 'montre', 'banc', 'seau', 'medecine']) BKT[n] = (x, y, s, o) => acc(n, x, y, s, o);
  // point nommé d'un accessoire posé seul (mêmes x, y, s, o que l'appel) → [X, Y] écran
  BKT.accPt = function (name, x, y, s, o, nom) {
    o = o || {}; s = s == null ? 1 : s; const ob = OBJ[name], q = ptOf(ob, nom, o); if (!q) return null;
    const b = baseOf(ob, o), d = o.dir || 1, a = o.rot || 0;
    const lx = (q[0] - b[0]) * s * d, ly = (q[1] - b[1]) * s;
    return [x + lx * Math.cos(a * d) - ly * Math.sin(a * d), y + lx * Math.sin(a * d) + ly * Math.cos(a * d)];
  };
  // ---- échelle : (x, y) = milieu du pied ; o.incline (rad, > 0 = le haut penche vers +x), o.couchee 0..1 (couchée au sol, le haut vers le côté de l'inclinaison)
  function echRot(o) { const k = ease(clamp(o.couchee || 0)), i = o.incline || 0, sg = i >= 0 ? 1 : -1; const rot = lerp(i, sg * PI / 2, k); return { rot, lift: (ECH.wb + 7) * Math.abs(Math.sin(rot)) * k }; }
  BKT.echelle = (x, y, s, o) => { o = o || {}; s = s == null ? 1 : s; const R = echRot(o); return acc('echelle', x, y - R.lift * s, s, Object.assign({}, o, { rot: R.rot })); };
  // point de l'échelle : nom 'haut' | 'pied' | nombre k (barreau k, 1..9, fractions permises : pieds d'un grimpeur)
  BKT.echellePt = function (nom, x, y, s, o) {
    o = o || {}; s = s == null ? 1 : s; const R = echRot(o);
    const ly = nom === 'haut' ? -ECH.h : nom === 'pied' ? 0 : -ECH.pas * Number(nom);
    return [x - ly * Math.sin(R.rot) * s, y - R.lift * s + ly * Math.cos(R.rot) * s];
  };
  // échelle posée sous un panier cloué : haut contre la poutre du balcon, à 92 px du panier, côté extérieur → { x, y, s, incline, haut }
  BKT.echelleSous = function (cote, o) {
    o = o || {}; const P = BKT.panierPt(cote, o), sg = cote === 'd' ? 1 : -1, inc = -sg * 0.08, top = [P[0] + sg * 92, SALLE.poutre.y0 - (o.up || 0)];
    const y = SALLE.echelleSol - (o.up || 0), x = top[0] - ECH.h * Math.sin(inc);
    return { x, y, s: 1, incline: inc, haut: BKT.echellePt('haut', x, y, 1, { incline: inc }) };
  };

  // =====================================================================
  // 8) DÉCOR : GYMNASE DE SPRINGFIELD (hiver 1891) et variante KANSAS (vers 1900) — BKT.salle(t, up, o) + BKT.salleSol(t, o)
  // =====================================================================
  const SALLE = {
    panier: { g: [300, 594], d: [780, 594] }, poutre: { y0: 548, y1: 598 }, rambarde: { y0: 352, y1: 548 },
    fenetres: [{ cx: 300, x0: 205, x1: 395, y0: 690, y1: 1190 }, { cx: 780, x0: 685, x1: 875, y0: 690, y1: 1190 }],
    horloge: { x: 540, y: 732, s: 1.12 }, poele: { x: 935, y0: 1170, porte: [935, 1290] }, lampes: [[446, 868], [634, 868]], cordes: [404, 676], anneaux: [516, 564],
    espalier: { x0: 58, x1: 178 }, cheval: { x: 540 }, pieds: FEET, piedsB: 1380, echelleSol: 1404, libre: { x0: 200, x1: 880 },
  };
  BKT.SALLE = SALLE;
  BKT.panierPt = function (cote, o) { o = o || {}; const p = SALLE.panier[cote === 'd' ? 'd' : 'g']; return [p[0], p[1] - (o.up || 0)]; };

  function briques(c, x0, y0, x1, y1, base, seed, h, w) {
    h = h || 22; w = w || 58; c.fillStyle = '#6f4a38'; c.fillRect(x0, y0, x1 - x0, y1 - y0);
    for (let y = y0, r = 0; y < y1; y += h, r++) for (let x = x0 - (r % 2) * w / 2; x < x1; x += w) {
      const k = hash(x * 0.37 + y * 1.13 + seed), k2 = hash(x * 0.71 + y * 0.29 + seed * 3);
      c.fillStyle = M.mixc(base, k > 0.5 ? '#b0684a' : '#7c3f2c', Math.abs(k - 0.5) * 0.9); c.fillRect(x + 1.5, y + 1.5, w - 3, h - 3);
      if (k2 > 0.7) { c.fillStyle = 'rgba(40,20,15,0.18)'; c.fillRect(x + 1.5, y + h * 0.55, w - 3, h * 0.45 - 1.5); }
      if (k2 < 0.12) { c.fillStyle = 'rgba(255,220,190,0.12)'; c.fillRect(x + 3, y + 2, w * 0.5, 3); }
    }
  }
  function pierres(c, x0, y0, x1, y1, seed) {
    c.fillStyle = '#9d8d6c'; c.fillRect(x0, y0, x1 - x0, y1 - y0);
    for (let y = y0, r = 0; y < y1; y += 56, r++) for (let x = x0 - (r % 2) * 70; x < x1; x += 140) {
      const k = hash(x * 0.21 + y * 0.93 + seed);
      c.fillStyle = M.mixc('#cbb894', k > 0.5 ? '#d9c9a6' : '#b9a57e', Math.abs(k - 0.5) * 1.2); c.fillRect(x + 2, y + 2, 136, 52);
      c.fillStyle = 'rgba(80,60,30,0.12)'; c.fillRect(x + 2, y + 40, 136, 14);
      for (let i = 0; i < 6; i++) { c.fillStyle = 'rgba(90,70,40,0.18)'; c.fillRect(x + 8 + 120 * hash(x + i * 3.1 + y), y + 8 + 36 * hash(y + i * 1.7 + x), 3, 2); }
    }
  }
  const fenPath = (c, F, ks) => { const r = (F.x1 - F.x0) / 2, ya = F.y0 + r; c.beginPath(); if (ks) { c.rect(F.x0, F.y0, F.x1 - F.x0, F.y1 - F.y0); return; } c.moveTo(F.x0, F.y1); c.lineTo(F.x0, ya); c.arc(F.cx, ya, r, PI, TAU); c.lineTo(F.x1, F.y1); c.closePath(); };
  const clipFen = (c, ks) => { c.beginPath(); for (const F of SALLE.fenetres) { const r = (F.x1 - F.x0) / 2, ya = F.y0 + r; if (ks) c.rect(F.x0, F.y0, F.x1 - F.x0, F.y1 - F.y0); else { c.moveTo(F.x0, F.y1); c.lineTo(F.x0, ya); c.arc(F.cx, ya, r, PI, TAU); c.lineTo(F.x1, F.y1); c.closePath(); } } c.clip(); };
  // ---- vue par les fenêtres
  function makeDehors(ks) {
    return M.pre(1080, 1400, (c) => {
      const g = c.createLinearGradient(0, 680, 0, 1200);
      if (ks) { g.addColorStop(0, '#8fb4cf'); g.addColorStop(0.6, '#d8dccb'); g.addColorStop(1, '#efe2bf'); } else { g.addColorStop(0, '#8e9daa'); g.addColorStop(0.7, '#c9cfd1'); g.addColorStop(1, '#e3e4df'); }
      c.fillStyle = g; c.fillRect(0, 600, 1080, 700);
      if (ks) {
        // université au dôme, prairie d'automne, arbres roux
        for (const [cx, y, w] of [[300, 1010, 300], [780, 1000, 300]]) { c.fillStyle = 'rgba(190,180,150,0.7)'; c.beginPath(); c.ellipse(cx, y + 30, w * 0.7, 40, 0, PI, TAU); c.fill(); }
        c.fillStyle = '#e4dccb'; c.fillRect(712, 930, 150, 70); c.fillStyle = '#d6cdb9'; for (let x = 718; x < 860; x += 16) c.fillRect(x, 948, 7, 52);
        c.fillStyle = '#ece5d4'; c.beginPath(); c.ellipse(787, 930, 44, 40, 0, PI, TAU); c.fill(); c.fillRect(781, 868, 12, 24); c.beginPath(); c.arc(787, 866, 7, 0, TAU); c.fill();
        c.fillStyle = '#c9bfa8'; c.fillRect(743, 922, 88, 10);
        for (let i = 0; i < 4; i++) { c.fillStyle = ['#c4983c', '#b98a34', '#d1a74c', '#a57a2c'][i]; c.beginPath(); c.moveTo(0, 1000 + i * 45); for (let x = 0; x <= 1080; x += 40) c.lineTo(x, 1000 + i * 45 + 10 * Math.sin(x * 0.012 + i * 2)); c.lineTo(1080, 1300); c.lineTo(0, 1300); c.closePath(); c.fill(); }
        for (let i = 0; i < 9; i++) { const x = 190 + i * 90 + 30 * hash(i), y = 1010 + 20 * hash(i * 3); c.fillStyle = '#5a4030'; c.fillRect(x - 3, y - 10, 6, 40); c.fillStyle = ['#b0582a', '#c9802e', '#8e4a26'][i % 3]; c.beginPath(); c.arc(x, y - 22, 26, 0, TAU); c.arc(x - 18, y - 6, 18, 0, TAU); c.arc(x + 18, y - 8, 18, 0, TAU); c.fill(); }
        for (let i = 0; i < 70; i++) { c.strokeStyle = 'rgba(120,85,30,0.5)'; c.lineWidth = 1; const x = 1080 * hash(i * 1.3), y = 1060 + 140 * hash(i * 2.9); c.beginPath(); c.moveTo(x, y); c.lineTo(x + 3, y - 12); c.stroke(); }
      } else {
        // toits enneigés de Springfield, clocher, arbres nus
        c.fillStyle = 'rgba(235,238,240,0.8)'; c.beginPath(); c.moveTo(0, 960); for (let x = 0; x <= 1080; x += 30) c.lineTo(x, 950 - 30 * Math.sin(x * 0.006)); c.lineTo(1080, 1300); c.lineTo(0, 1300); c.fill();
        const maison = (x, y, w, h, col) => {
          c.fillStyle = col; c.fillRect(x, y, w, h);
          c.fillStyle = '#f4f5f4'; c.beginPath(); c.moveTo(x - 10, y + 2); c.lineTo(x + w / 2, y - h * 0.55); c.lineTo(x + w + 10, y + 2); c.closePath(); c.fill();
          c.fillStyle = 'rgba(120,130,140,0.35)'; c.beginPath(); c.moveTo(x + w / 2, y - h * 0.55); c.lineTo(x + w + 10, y + 2); c.lineTo(x + w / 2 + 6, y + 2); c.closePath(); c.fill();
          c.fillStyle = '#e8d9a0'; c.fillRect(x + w * 0.2, y + h * 0.35, w * 0.16, h * 0.22); c.fillRect(x + w * 0.62, y + h * 0.35, w * 0.16, h * 0.22);
          c.fillStyle = col; c.fillRect(x + w * 0.7, y - h * 0.5, 10, 26); c.fillStyle = '#f4f5f4'; c.fillRect(x + w * 0.7 - 2, y - h * 0.5 - 4, 14, 6);
        };
        maison(200, 1040, 90, 70, '#8a6a5c'); maison(300, 1060, 110, 80, '#7a5a4c'); maison(150, 1110, 120, 90, '#6e5248');
        maison(690, 1050, 100, 70, '#80645a'); maison(820, 1070, 90, 80, '#6e564a'); maison(730, 1120, 130, 90, '#7c5e50');
        c.fillStyle = '#9a9690'; c.fillRect(812, 900, 34, 150); c.fillStyle = '#f2f3f2'; c.beginPath(); c.moveTo(806, 902); c.lineTo(829, 820); c.lineTo(852, 902); c.closePath(); c.fill();
        c.fillStyle = '#6b6862'; c.beginPath(); c.arc(829, 940, 9, PI, TAU); c.fill(); c.fillRect(820, 940, 18, 16);
        c.strokeStyle = 'rgba(60,55,55,0.75)';
        for (const [x, y, h] of [[245, 1130, 110], [360, 1150, 130], [740, 1160, 120], [860, 1140, 100]]) { c.lineWidth = 3; c.beginPath(); c.moveTo(x, y + 40); c.lineTo(x, y - h); c.stroke(); c.lineWidth = 1.4; for (let i = 0; i < 6; i++) { const yy = y - h * (0.3 + i * 0.11), sg = i % 2 ? 1 : -1; c.beginPath(); c.moveTo(x, yy); c.lineTo(x + sg * (26 - i * 3), yy - 22); c.stroke(); } }
        c.fillStyle = '#f6f7f6'; c.fillRect(0, 1180, 1080, 30);
      }
    });
  }
  // ---- mur du fond (fenêtres découpées), plafond, lambris
  function makeMur(ks) {
    return M.pre(1080, 1400, (c) => {
      if (ks) pierres(c, 0, 0, 1080, 1400, 7); else briques(c, 0, 0, 1080, 1400, '#9a5a3e', 3);
      const g = c.createLinearGradient(0, 598, 0, 760); g.addColorStop(0, 'rgba(20,10,8,0.55)'); g.addColorStop(1, 'rgba(20,10,8,0)'); c.fillStyle = g; c.fillRect(0, 598, 1080, 162);   // ombre sous la galerie
      c.fillStyle = 'rgba(20,10,8,0.35)'; c.fillRect(0, 0, 1080, 548);                                                                         // fond de galerie dans l'ombre
      c.fillStyle = ks ? '#5a4a36' : '#3e2a1e'; c.fillRect(0, 0, 1080, 176); c.fillStyle = 'rgba(255,230,190,0.12)'; for (let x = 20; x < 1080; x += 120) c.fillRect(x, 0, 36, 176);  // solives
      // fenêtres : encadrement puis découpe des vitres
      for (const F of SALLE.fenetres) {
        c.save(); c.translate(0, 0);
        c.fillStyle = ks ? '#b5a27c' : '#c9b79a'; fenPath(c, { x0: F.x0 - 18, x1: F.x1 + 18, y0: F.y0 - 18, y1: F.y1 + 18, cx: F.cx }, ks); c.fill();
        c.fillStyle = ks ? '#d8ccb0' : '#ddd2bb'; c.fillRect(F.x0 - 28, F.y1 + 6, F.x1 - F.x0 + 56, 22);                                     // appui
        c.globalCompositeOperation = 'destination-out'; fenPath(c, F, ks); c.fill(); c.globalCompositeOperation = 'source-over';
        // menuiseries : petits carreaux
        c.strokeStyle = ks ? '#3e3a34' : '#4a4f45'; c.lineWidth = 8; fenPath(c, F, ks); c.stroke();
        c.lineWidth = 4; const r = (F.x1 - F.x0) / 2, ya = F.y0 + r;
        for (const x of [F.x0 + (F.x1 - F.x0) / 3, F.x0 + 2 * (F.x1 - F.x0) / 3]) { c.beginPath(); c.moveTo(x, ks ? F.y0 : F.y0 + r - Math.sqrt(Math.max(0, r * r - (x - F.cx) ** 2))); c.lineTo(x, F.y1); c.stroke(); }
        for (let y = ks ? F.y0 + 120 : ya; y < F.y1; y += 66) { c.beginPath(); c.moveTo(F.x0, y); c.lineTo(F.x1, y); c.stroke(); }
        if (ks) { c.lineWidth = 7; c.beginPath(); c.moveTo(F.x0, F.y0 + 120); c.lineTo(F.x1, F.y0 + 120); c.stroke(); }
        else { c.lineWidth = 3; for (let i = 1; i < 4; i++) { const a = PI + i * PI / 4; c.beginPath(); c.moveTo(F.cx, ya); c.lineTo(F.cx + Math.cos(a) * r, ya + Math.sin(a) * r); c.stroke(); } }
        c.restore();
      }
      // lambris
      c.fillStyle = ks ? '#6b5236' : '#4e3220'; c.fillRect(0, 1236, 1080, 164);
      c.fillStyle = ks ? '#866844' : '#6a4630'; c.fillRect(0, 1228, 1080, 14);
      for (let x = 10; x < 1080; x += 92) { c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 2; c.strokeRect(x, 1256, 76, 120); c.strokeStyle = 'rgba(255,220,170,0.12)'; c.strokeRect(x + 3, 1259, 70, 114); }
    });
  }
  // ---- plan intermédiaire : galerie (balustres de bois ou grille de fer), espalier, cheval d'arçons, massues, haltères, poêle et tuyau, appliques
  function balustre(x, y0, y1) {
    const h = y1 - y0, m = (u) => y0 + u * h;
    pc([[x - 5, m(0)], [x + 5, m(0)], [x + 5, m(0.1)], [x + 9, m(0.28)], [x + 4, m(0.5)], [x + 7, m(0.72)], [x + 11, m(0.88)], [x + 7, m(1), 1], [x - 7, m(1), 1], [x - 11, m(0.88)], [x - 7, m(0.72)], [x - 4, m(0.5)], [x - 9, m(0.28)], [x - 5, m(0.1)]], '#8a5e36', () => strokePts([[x - 2, m(0.05)], [x - 4, m(0.95)]], 'rgba(255,225,170,0.35)', 1.4), 8000 + x, { texA: 0.5 });
  }
  function makeMilieu(ks) {
    return M.pre(1080, 1400, (c) => {
      const R = SALLE.rambarde, Pt = SALLE.poutre;
      // galerie
      if (ks) { for (let x = 52; x < 1034; x += 22) pc([[x - 2.5, R.y0], [x + 2.5, R.y0], [x + 2.5, R.y1], [x - 2.5, R.y1]], '#2e2c2a', null, 8100 + x, { drop: false }); for (let x = 63; x < 1034; x += 44) pc(ell(x, R.y0 + 60, 9, 9, 10).concat(ell(x, R.y0 + 60, 5, 5, 8).reverse()), '#3a3734', null, 8200 + x, { drop: false }); }
      else for (let x = 60; x < 1034; x += 34) balustre(x, R.y0 + 18, R.y1);
      pc(rect(0, R.y0, 1080, R.y0 + 20), ks ? '#3a3734' : '#6e4a2a', () => strokePts([[0, R.y0 + 4], [1080, R.y0 + 4]], 'rgba(255,225,170,0.4)', 2), 8301);
      for (let x = 46; x < 1080; x += 245) pc(rect(x - 13, R.y0 - 14, x + 13, R.y1), ks ? '#4a4540' : '#5e3e22', () => { strokePts([[x - 8, R.y0 - 10], [x - 8, R.y1]], 'rgba(255,225,170,0.3)', 2); fillPts(rect(x - 16, R.y0 - 22, x + 16, R.y0 - 12), ks ? '#55504a' : '#4e331c'); }, 8310 + x);
      pc(rect(0, Pt.y0, 1080, Pt.y1), ks ? '#b4a07a' : '#6a4426', () => {
        strokePts([[0, Pt.y0 + 6], [1080, Pt.y0 + 6]], 'rgba(255,230,180,0.45)', 2); strokePts([[0, Pt.y1 - 8], [1080, Pt.y1 - 8]], 'rgba(0,0,0,0.35)', 3);
        for (let x = 0; x < 1080; x += 6) strokePts([[x, Pt.y0 + 14], [x + 40, Pt.y0 + 18]], 'rgba(40,20,10,0.08)', 1);
      }, 8320);
      // poêle de fonte et son tuyau
      const Po = SALLE.poele, px = Po.x;
      pc(rect(px - 12, Pt.y1 - 4, px + 12, Po.y0 + 10), '#2e2c2a', () => { for (let y = Pt.y1 + 60; y < Po.y0; y += 120) strokePts([[px - 12, y], [px + 12, y]], 'rgba(255,255,255,0.18)', 3); strokePts([[px - 5, Pt.y1], [px - 5, Po.y0]], 'rgba(255,255,255,0.12)', 3); }, 8401);
      pc([[px - 30, Po.y0], [px + 30, Po.y0], [px + 34, Po.y0 + 22], [px + 56, Po.y0 + 70], [px + 60, Po.y0 + 130], [px + 50, Po.y0 + 176], [px - 50, Po.y0 + 176], [px - 60, Po.y0 + 130], [px - 56, Po.y0 + 70], [px - 34, Po.y0 + 22]], '#2a2826', () => {
        fillPts(rect(px - 66, Po.y0 + 160, px + 66, Po.y0 + 180), '#3a3634'); fillPts(rect(px - 40, Po.y0 + 10, px + 40, Po.y0 + 24), '#3a3634');
        strokePts([[px - 40, Po.y0 + 40], [px - 50, Po.y0 + 140]], 'rgba(255,255,255,0.18)', 4); hatch(null, 0.9, 4, 0.2, 1, undefined, [px - 70, Po.y0, px + 70, Po.y0 + 190]);
        fillPts(rect(px - 28, Po.y0 + 92, px + 28, Po.y0 + 144), '#120c08');
      }, 8402);
      for (const sx of [-1, 1]) pc([[px + sx * 44, Po.y0 + 176], [px + sx * 54, Po.y0 + 176], [px + sx * 62, 1395, 1], [px + sx * 48, 1395, 1]], '#2a2826', null, 8410 + sx);
      // appliques à gaz (bras et globe ; flamme dessinée en direct)
      for (const [lx, ly] of SALLE.lampes) {
        pc(ell(lx, ly + 54, 12, 16, 12), '#8d6a26', null, 8501 + lx, { drop: false });
        pc([[lx - 3, ly + 48], [lx + 3, ly + 48], [lx + 3, ly + 14], [lx - 3, ly + 14]], '#b08d45', null, 8502 + lx, { drop: false });
        pc([[lx - 12, ly + 18], [lx + 12, ly + 18], [lx + 9, ly + 26], [lx - 9, ly + 26]], '#b08d45', null, 8503 + lx);
      }
      // espalier (Springfield)
      const Es = SALLE.espalier;
      if (!ks) for (let y = 720; y < 1390; y += 34) pc(rect(Es.x0 + 6, y - 4, Es.x1 - 6, y + 4), '#c9a46a', () => strokePts([[Es.x0 + 8, y - 1], [Es.x1 - 8, y - 1]], 'rgba(255,240,200,0.5)', 1.2), 8600 + y, { texA: 0.5 });
      if (!ks) for (const x of [Es.x0, Es.x1 - 14]) pc(rect(x, 690, x + 14, 1395), '#a9824e', () => strokePts([[x + 4, 694], [x + 4, 1390]], 'rgba(255,235,190,0.4)', 2), 8650 + x);
      if (!ks) {
        // cheval d'arçons (cuir, arçons, pied central) — à 0,8 de l'échelle des marionnettes
        const hx = SALLE.cheval.x, top = 1132;
        for (const sx of [-1, 1]) pc([[hx + sx * 50 - 7, top + 40], [hx + sx * 50 + 7, top + 40], [hx + sx * 112 + 8, 1395, 1], [hx + sx * 112 - 8, 1395, 1]], '#3a3330', null, 8701 + sx);
        pc(rect(hx - 16, top + 40, hx + 16, 1395), '#4a403a', () => strokePts([[hx - 6, top + 44], [hx - 6, 1390]], 'rgba(255,255,255,0.15)', 3), 8703);
        for (const sx of [-1, 1]) { pc([[hx + sx * 38 - 9, top + 4], [hx + sx * 38 - 9, top - 22], [hx + sx * 38 + 9, top - 22], [hx + sx * 38 + 9, top + 4], [hx + sx * 38 + 3, top + 4], [hx + sx * 38 + 3, top - 14], [hx + sx * 38 - 3, top - 14], [hx + sx * 38 - 3, top + 4]], '#b08d45', null, 8704 + sx); }
        pc([[hx - 140, top + 6], [hx - 128, top - 2, 1], [hx + 128, top - 2, 1], [hx + 140, top + 6], [hx + 142, top + 44], [hx + 130, top + 56, 1], [hx - 130, top + 56, 1], [hx - 142, top + 44]], '#6b3a22', () => {
          strokePts([[hx - 120, top + 4], [hx + 120, top + 4]], 'rgba(255,215,170,0.45)', 2); for (let x = hx - 120; x <= hx + 120; x += 24) dot(x, top + 50, 2, '#b08d45');
          hatch(null, 0.5, 4, 0.2, 1, undefined, [hx - 150, top - 4, hx + 150, top + 60]);
        }, 8706);
        // massues indiennes sur leur râtelier, sous la fenêtre de droite
        const F = SALLE.fenetres[1];
        for (let i = 0; i < 6; i++) { const x = F.x0 + 24 + i * 28, yb = 1392; pc([[x - 5, yb - 116], [x + 5, yb - 116], [x + 7, yb - 90], [x + 16, yb - 40], [x + 14, yb - 6, 1], [x - 14, yb - 6, 1], [x - 16, yb - 40], [x - 7, yb - 90]], ['#c39a5e', '#a9784a'][i % 2], () => { strokePts([[x - 12, yb - 52], [x + 12, yb - 52]], '#6e2430', 4); strokePts([[x - 3, yb - 110], [x - 6, yb - 20]], 'rgba(255,240,200,0.4)', 1.5); }, 8720 + i); }
        pc(rect(F.x0 + 6, 1316, F.x0 + 176, 1328), '#5e3e22', null, 8730);
        // haltères sous la fenêtre de gauche
        const G = SALLE.fenetres[0];
        for (const x of [G.x0 + 40, G.x0 + 128]) { pc(rect(x - 26, 1380, x + 26, 1386), '#3a3634', null, 8740 + x, { drop: false }); for (const sx of [-1, 1]) pc(ell(x + sx * 26, 1378, 12, 12, 12), '#2a2826', () => dot(x + sx * 26 - 4, 1374, 3, 'rgba(255,255,255,0.3)'), 8741 + x + sx); }
      } else {
        // gradins de bois à gauche (quatre marches)
        for (let i = 0; i < 4; i++) { const y = 1395 - (i + 1) * 44, x0 = 46, x1 = 196 - i * 26; pc(rect(x0, y, x1, y + 12), '#9a6a3a', () => strokePts([[x0, y + 2], [x1, y + 2]], 'rgba(255,225,170,0.5)', 1.4), 8760 + i); pc(rect(x0, y + 12, x1 - 4, 1395), '#6a4a2c', () => strokePts([[x1 - 10, y + 12], [x1 - 10, 1395]], 'rgba(0,0,0,0.3)', 2), 8770 + i, { drop: false }); }
      }
    });
  }
  // ---- éléments animés
  function neige(t, k) {
    if (!(k > 0) || SIL()) return; const c = cx_(), g = tg(t);
    c.save(); clipFen(c, false);
    const n = Math.round(90 * k);
    for (let i = 0; i < n; i++) {
      const F = SALLE.fenetres[i % 2], v = 40 + 40 * hash(i * 2.3), per = (F.y1 - F.y0 + 60) / v, u = ((g + per * hash(i * 7.1)) % per) / per;
      const x = F.x0 + (F.x1 - F.x0) * hash(i * 3.9) + Math.sin(g * 1.3 + i) * 10 - u * 22, y = F.y0 - 30 + u * (F.y1 - F.y0 + 60), r = 1.4 + 2.4 * hash(i * 5.7);
      c.fillStyle = `rgba(255,255,255,${0.55 + 0.4 * hash(i)})`; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    }
    c.restore();
  }
  function paquetNeige(u) {
    if (!(u > 0) || u >= 1 || SIL()) return; const c = cx_();
    const A = [292, 1006], B = [352, 1060], s1 = smooth(0, 0.45, u), f = smooth(0.45, 1, u);
    const x = lerp(A[0], B[0], s1) + f * 10, y = lerp(A[1], B[1], s1) + f * f * 140;
    c.save(); clipFen(c, false); c.fillStyle = `rgba(250,251,250,${1 - smooth(0.85, 1, u)})`;
    c.beginPath(); c.ellipse(x, y, 16 + 4 * f, 7 + 2 * f, 0.6 * (1 - f), 0, TAU); c.fill();
    if (f > 0.05) for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(x + (hash(i) - 0.5) * 30 * f, y - 8 - 20 * hash(i * 3) * f, 2.4, 0, TAU); c.fill(); }
    c.restore();
  }
  function corde(t, x, top, bot, ph, tourne) {
    const g = tg(t), sw = 10 * Math.sin(g * 0.8 + ph) + 34 * tourne * Math.sin(g * 3.1 + ph) * (1 - 0.3 * tourne), a = Math.atan2(sw, bot - top), c = cx_();
    c.save(); c.translate(x, top); c.rotate(-a);
    const L = bot - top; pc([[-5, 0], [5, 0], [5, L - 14], [9, L - 6], [8, L + 10, 1], [-8, L + 10, 1], [-9, L - 6], [-5, L - 14]], '#c8a874', () => {
      for (let y = 6; y < L - 12; y += 10) strokePts([[-5, y], [5, y + 7]], 'rgba(110,80,40,0.55)', 1.2);
      const k = Math.sin(g * 6 + ph) * tourne; strokePts([[-8, L - 2], [8 * Math.cos(k * 3), L + 2]], 'rgba(90,60,30,0.7)', 1.6);
    }, 8801 + Math.round(x), { texA: 0.5 });
    c.restore();
  }
  function anneaux(t) {
    const g = tg(t), c = cx_(), sw = 0.025 * Math.sin(g * 0.9 + 1);
    for (const x of SALLE.anneaux) {
      c.save(); c.translate(x, 150); c.rotate(sw);
      pc(rect(-3, 0, 3, 470), '#6b4a2e', null, 8850 + x, { drop: false });
      strokePts(ep(0, 490, 16, 16, 28, 0, TAU), '#7a5a30', 7.5); strokePts(ep(0, 490, 16, 16, 28, 0, TAU), '#c39a5e', 5); strokePts(ep(0, 490, 16, 16, 10, PI, PI * 1.5), 'rgba(255,240,200,0.7)', 1.6);
      c.restore();
    }
  }
  function spectateursBalcon(t) {
    const g = tg(t), cols = ['#3b3a44', '#45403a', '#383c46', '#4a3e3a', '#3a4040', '#433b44', '#3e3a36'];
    for (let i = 0; i < 7; i++) {
      const x = 170 + i * 118 + 18 * hash(i * 3.1), y = 318 + Math.sin(g * 1.3 + i) * 2, col = cols[i], hat = i % 3;
      pc([[x - 34, y + 230], [x - 30, y + 40], [x - 16, y + 22], [x + 16, y + 22], [x + 30, y + 40], [x + 34, y + 230]], col, null, 8900 + i, { texA: 0.4 });
      pc(ell(x, y, 17, 20, 14), shadeHex(col, 1.25), null, 8910 + i, { texA: 0.4 });
      if (hat === 0) pc([[x - 24, y - 10], [x + 24, y - 10], [x + 18, y - 14], [x + 14, y - 32, 1], [x - 14, y - 32, 1], [x - 18, y - 14]], '#24222a', null, 8920 + i);
      else if (hat === 1) pc([[x - 18, y - 8], [x + 26, y - 6], [x + 16, y - 24], [x - 16, y - 26]], '#2c2a26', null, 8920 + i);
      else pc(ell(x - 2, y - 14, 20, 12, 12), '#5a4a3e', null, 8920 + i);
    }
  }
  function spectateursGradins(t) {
    const g = tg(t);
    for (let i = 0; i < 3; i++) {
      const y = 1395 - (i + 2) * 44 + Math.sin(g * 1.5 + i) * 1.5, x = 70 + i * 34, col = ['#3b3a44', '#4a3e3a', '#383c46'][i];
      pc([[x - 16, y], [x - 15, y - 58], [x - 6, y - 68], [x + 8, y - 68], [x + 16, y - 56], [x + 18, y - 10], [x + 44, y - 8], [x + 46, y + 40, 1], [x + 34, y + 40, 1], [x + 32, y + 6], [x - 16, y + 6]], col, null, 8950 + i, { texA: 0.4 });
      pc(ell(x + 2, y - 84, 13, 15, 12), shadeHex(col, 1.3), null, 8960 + i, { texA: 0.4 });
      if (i !== 1) pc([[x - 16, y - 92, 1], [x + 20, y - 92, 1], [x + 12, y - 110, 1], [x - 8, y - 110, 1]], '#24222a', null, 8970 + i);
    }
  }
  function fanions(t, tombe) {
    const g = tg(t), c = cx_(), y0 = SALLE.poutre.y1 - 2;
    if (!SIL()) { c.strokeStyle = '#3a2a1e'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(46, y0); for (let x = 46; x <= 1034; x += 20) c.lineTo(x, y0 + 4 * Math.sin((x - 46) / 988 * PI)); c.stroke(); }
    for (let i = 0; i < 18; i++) {
      const x = 74 + i * 54, yy = y0 + 4 * Math.sin((x - 46) / 988 * PI), a = 0.08 * Math.sin(g * 2.4 + i * 0.9) + 0.05 * Math.sin(g * 5.3 + i);
      if ((x > 190 && x < 410) || (x > 670 && x < 890)) continue;
      const fall = i === 9 ? ease(clamp(tombe || 0)) : 0;
      c.save(); c.translate(x - 20, yy); c.rotate(a + fall * 1.15);
      pc([[0, 0, 1], [40, 0, 1], [20, 58 + 4 * Math.sin(g * 3 + i), 1]], i % 2 ? '#2c4a7a' : '#8c2a2a', () => strokePts([[4, 3], [36, 3]], 'rgba(255,255,255,0.25)', 1.4), 8980 + i, { texA: 0.5 });
      c.restore();
    }
  }
  // panier de fer à filet ouvert sur panneau de bois (Kansas) ; (x, y) = centre du cercle
  function panierFer(t, x, y) {
    const g = tg(t), c = cx_();
    pc(rect(x - 112, y - 160, x + 112, y + 34), '#9a6a3a', () => { strokePts(rect(x - 104, y - 152, x + 104, y + 26), 'rgba(60,35,15,0.6)', 4, true); for (let yy = y - 150; yy < y + 34; yy += 28) strokePts([[x - 112, yy], [x + 112, yy]], 'rgba(60,35,15,0.35)', 1.4); strokePts([[x - 108, y - 156], [x + 108, y - 156]], 'rgba(255,225,170,0.4)', 2); hatch(null, 0.3, 5, 0.16, 1, undefined, [x - 115, y - 165, x + 115, y + 40]); }, 9001);
    pc(rect(x - 8, y - 4, x + 8, y + 10), '#2e2c2a', null, 9002, { drop: false });
    const sw = 2.5 * Math.sin(g * 1.7), R = 64;
    for (let i = 0; i <= 12; i++) { const u = i / 12; strokePts([[x + lerp(-R + 4, R - 4, u), y + 6], [x + lerp(-38, 38, u) + sw, y + 104]], 'rgba(250,248,240,0.95)', 2.2); }
    for (let j = 1; j <= 4; j++) { const v = j / 4; strokePts([[x - lerp(R - 4, 38, v) + sw * v, y + 6 + 98 * v], [x + lerp(R - 4, 38, v) + sw * v, y + 6 + 98 * v]], 'rgba(245,242,232,0.85)', 1.6); }
    strokePts(ep(x, y, R, 13, 28, PI, TAU), '#1c1a19', 7); strokePts(ep(x, y, R, 13, 28, PI, TAU), '#7a3e22', 2.4);
    strokePts(ep(x, y, R, 13, 28, 0, PI), '#1c1a19', 9); strokePts(ep(x, y, R, 13, 28, 0, PI), '#9a5428', 3);
    strokePts(ep(x, y, R, 13, 12, 0.25, 1.2), 'rgba(255,210,170,0.6)', 1.6);
  }
  BKT.panierFer = (t, x, y) => panierFer(t, x, y);
  // ---- le décor complet : o = { epoque, paniers (0 | 1 | 'g' | 'd'), fond (1 | 0 | {g, d}), ballon ('g' | 'd' : ballon coincé), neige 0..1, lumiere 0..1,
  //      spectateurs 0|1, horlogeDt (s ajoutées à l'horloge), porte 0..1 (porte du poêle), moineau 0..1, paquetNeige 0..1, cordeTourne 0..1, fanionTombe 0..1 }
  BKT.salle = function (t, up, o) {
    o = o || {}; up = up || 0; const K = BKT.K, c = cx_(), g = tg(t), ks = o.epoque === 'kansas';
    const lum = o.lumiere == null ? 1 : clamp(o.lumiere);
    c.save(); c.translate(0, -up);
    c.drawImage(ks ? K.ksDehors : K.sprDehors, 0, 0);
    if (ks) { c.save(); clipFen(c, true); M.nuages(t, { y0: 720, y1: 860, n: 3, vit: 10, s: 0.35, seed: 12, brume: 0.3 }); M.oiseaux(t, { x0: 160, x1: 900, y: 780, n: 4, s: 0.45, seed: 5, dur: 9, boucle: true, brume: 0.3 }); c.restore(); }
    else { c.save(); clipFen(c, false); M.fumee(t, { x: 300 + 110 * 0.7 + 5, y: 1010, s: 0.35, n: 5, haut: 140, vent: 26, col: '#e2e4e4', a: 0.6, seed: 4 }); M.fumee(t, { x: 820 + 90 * 0.7 + 5, y: 1022, s: 0.32, n: 5, haut: 120, vent: 26, col: '#e2e4e4', a: 0.6, seed: 8 }); c.restore();
      neige(t, o.neige == null ? 1 : o.neige); paquetNeige(o.paquetNeige || 0); }
    c.drawImage(ks ? K.ksMur : K.sprMur, 0, 0);
    M.pendule(t + (o.horlogeDt || 0), { x: SALLE.horloge.x, y: SALLE.horloge.y, s: SALLE.horloge.s, per: 2, bois: ks ? '#7a5634' : '#5e3a22' });
    if (o.spectateurs && !ks) spectateursBalcon(t);
    if (o.spectateurs && ks) spectateursBalcon(t);
    c.drawImage(ks ? K.ksMilieu : K.sprMilieu, 0, 0);
    if (ks) spectateursGradins(t);
    // poêle : lueur, flamme par la porte (qui peut s'entrouvrir), fumée au joint du tuyau
    const Po = SALLE.poele, pr = ease(clamp(o.porte || 0)), dx = Po.porte[0], dy = Po.porte[1];
    if (!SIL()) { const fl = 0.75 + 0.25 * Math.sin(g * 9) * Math.sin(g * 3.3); gradR(dx, dy, 4, dx, dy, 30, [[0, `rgba(255,170,70,${0.8 * fl})`], [1, 'rgba(160,40,10,0.6)']], [dx - 28, dy - 26, dx + 28, dy + 26]); }
    M.flamme(t, { x: dx, y: dy + 22, s: 0.9 + 0.5 * pr, r: 90 + 120 * pr, seed: 11 });
    c.save(); c.translate(dx - 28, dy - 26); c.scale(Math.cos(pr * 1.25), 1);
    pc(rect(0, 0, 56, 52), '#1e1c1a', () => { for (let x = 8; x < 52; x += 9) fillPts(rect(x, 14, x + 4, 40), `rgba(255,150,60,${0.55 + 0.3 * Math.sin(g * 7 + x)})`); strokePts([[3, 3], [53, 3]], 'rgba(255,255,255,0.2)', 1.5); }, 9101, { drop: false });
    c.restore();
    M.fumee(t, { x: Po.x + 6, y: 760, s: 0.3, n: 4, haut: 150, vent: -18, col: '#c9c4b8', a: 0.35, per: 4, seed: 6 });
    for (const [lx, ly] of SALLE.lampes) { M.flamme(t, { x: lx, y: ly + 6, s: 0.62, r: 110, seed: lx }); if (!SIL()) { c.save(); c.globalAlpha = 0.5; c.beginPath(); c.ellipse(lx, ly - 4, 13, 17, 0, 0, TAU); c.fillStyle = 'rgba(250,240,215,0.45)'; c.fill(); c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 1.2; c.stroke(); c.restore(); } }
    if (!ks) { corde(t, SALLE.cordes[0], 150, 1300, 0, clamp(o.cordeTourne || 0)); corde(t, SALLE.cordes[1], 150, 1270, 2.1, 0); anneaux(t); }
    if (ks) fanions(t, o.fanionTombe);
    // paniers
    const pn = o.paniers == null ? (ks ? 1 : 0) : o.paniers;
    for (const cote of ['g', 'd']) {
      if (!(pn === 1 || pn === true || pn === cote)) continue;
      const P = SALLE.panier[cote];
      if (ks) panierFer(t, P[0], P[1]);
      else { const f = o.fond == null ? 1 : (typeof o.fond === 'object' ? (o.fond[cote] == null ? 1 : o.fond[cote]) : o.fond); BKT.panier(P[0], P[1], 0.9, { cloue: true, fond: f, ballon: o.ballon === cote ? (o.ballonType || 'cuir') : null, t, cast: { dx: 12, dy: 6, a: 0.3 } }); }
    }
    if (o.moineau > 0 && !ks) moineau(t, clamp(o.moineau));
    // rayons des fenêtres + poussière
    if (!SIL()) for (const F of SALLE.fenetres) {
      const poly = [[F.x0 + 10, F.y0 + 60], [F.x1 - 10, F.y0 + 60], [F.x1 + 170, 1395], [F.x0 + 70, 1395]];
      c.save(); c.globalCompositeOperation = 'lighter'; c.beginPath(); poly.forEach((p2, i) => (i ? c.lineTo(p2[0], p2[1]) : c.moveTo(p2[0], p2[1]))); c.closePath();
      const gr = c.createLinearGradient(F.cx, F.y0, F.cx + 100, 1395); gr.addColorStop(0, `rgba(${ks ? '255,226,170' : '220,232,245'},${0.13 * lum})`); gr.addColorStop(1, 'rgba(220,232,245,0)'); c.fillStyle = gr; c.fill(); c.clip();
      M.poussiere(t, { x: F.x0 + 20, y: F.y0 + 80, w: 300, h: 600, n: 22, a: 0.7 * lum, seed: F.cx });
      c.restore();
    }
    if (lum < 1) { c.fillStyle = `rgba(18,22,40,${0.55 * (1 - lum)})`; c.fillRect(0, 0, 1080, BACK + 2); }
    c.restore();
  };
  // moineau qui se pose sur la rambarde et repart (u 0..1)
  function moineau(t, u) {
    const g = tg(t), c = cx_(), P = [610, SALLE.rambarde.y0 - 2];
    const x = u < 0.3 ? lerp(1000, P[0], M.easeOut(u / 0.3)) : u > 0.75 ? lerp(P[0], 120, M.easeIn((u - 0.75) / 0.25)) : P[0];
    const y = u < 0.3 ? lerp(240, P[1], M.easeOut(u / 0.3)) : u > 0.75 ? lerp(P[1], 200, (u - 0.75) / 0.25) : P[1] + (Math.sin(g * 9) > 0.7 ? -2 : 0);
    const vol = u < 0.3 || u > 0.75, d = u > 0.75 ? -1 : -1, fl = Math.sin(g * 30);
    c.save(); c.translate(x, y); c.scale(d, 1);
    pc([[-14, -6], [-6, -14], [6, -16], [12, -20], [18, -18], [20, -14], [14, -10], [10, -2], [0, 2], [-10, 0], [-22, 2]], '#7a5a3e', () => { fillPts([[10, -14], [16, -10], [8, -8]], '#b8a68a'); dot(15, -16, 1.4, '#111'); }, 9201, { drop: false });
    fillPts([[20, -16], [26, -15], [20, -13]], '#6e5a3a');
    if (vol) fillPts([[-6, -8], [6, -10], [0, -30 * fl - 6], [-12, -26 * fl - 4]], '#5e4430'); else fillPts([[-12, -4], [6, -10], [8, -2], [-8, 0]], '#5e4430');
    c.restore();
  }
  // ---- premier plan (après M.drawFloor, avant les marionnettes) : parquet ciré, reflets des fenêtres, ballon médicinal, seau, banc
  BKT.salleSol = function (t, o) {
    o = o || {}; const c = cx_(), ks = o.epoque === 'kansas';
    if (!SIL()) {
      c.save(); c.globalAlpha = 0.32; c.fillStyle = ks ? '#c8a16a' : '#b98a52'; c.fillRect(46, BACK, 988, 245);
      c.globalAlpha = 1; for (let y = BACK + 12; y < 1640; y += 22) { c.fillStyle = 'rgba(70,40,15,0.18)'; c.fillRect(46, y, 988, 1.2); }
      for (let i = 0; i < 40; i++) { const y = BACK + 12 + 22 * Math.floor(i / 4), x = 46 + 988 * hash(i * 3.3); c.fillStyle = 'rgba(70,40,15,0.2)'; c.fillRect(x, y - 22, 1.2, 22); }
      c.globalCompositeOperation = 'lighter';
      for (const F of SALLE.fenetres) { const gg = c.createRadialGradient(F.cx + 90, 1520, 10, F.cx + 90, 1520, 170); gg.addColorStop(0, 'rgba(230,236,245,0.16)'); gg.addColorStop(1, 'rgba(230,236,245,0)'); c.fillStyle = gg; c.save(); c.translate(F.cx + 90, 1520); c.scale(1, 0.35); c.translate(-F.cx - 90, -1520); c.fillRect(F.cx - 100, 1350, 380, 340); c.restore(); }
      c.restore();
    }
    const cast = { dx: 12, dy: 5, a: 0.3 };
    if (o.medecine !== false) BKT.medecine(o.medecineX || 168, BACK + 8, 0.9, { cast, ombre: true });
    if (o.seau !== false) BKT.seau(o.seauX || 900, BACK + 8, 0.9, { cast, ombre: true });
    if (o.banc) BKT.banc(typeof o.banc === 'number' ? o.banc : 820, BACK + 10, 0.8, { cast, ombre: true });
  };

  // =====================================================================
  // 9) PRÉ-RENDUS
  // =====================================================================
  BKT.init = function () {
    BKT.K = { sprDehors: makeDehors(false), sprMur: makeMur(false), sprMilieu: makeMilieu(false), ksDehors: makeDehors(true), ksMur: makeMur(true), ksMilieu: makeMilieu(true) };
    return BKT.K;
  };
})();
