// persos.js — « La suite de Fibonacci, née d'un problème de lapins » (Pise 1202 → Florence 1299) : marionnettes, accessoires et décor
// PROPRES À CETTE VIDÉO. Espace M.FIB (= M.fib ; alias FIB). Appeler FIB.init() dans S.init. Mode d'emploi : persos.md (ne pas lire ce fichier).
// MARIONNETTES : FIB.leonardo(pose,x,y,s,o) · FIB.marchand(pose,x,y,s,o) (pose.tenue 'pere'|'pisan'|'pisan2'|'florentin'|'florentin2') · FIB.lapin(x,y,s,o)
// ACCESSOIRES  : FIB.livre · FIB.registre · FIB.abaque · FIB.balance · FIB.pieces · FIB.plume · FIB.bourse · FIB.sceau   (x,y,s,o)
// DÉCOR        : FIB.cabinet(t,up,o) → M.drawFloor() → FIB.cabinetSol(t,o) → marionnettes → FIB.enclosAvant(t,o) ; repères FIB.CAB, FIB.ENCLOS
(function () {
  'use strict';
  const X = M.X, P = M.P, TAU = M.TAU, PI = Math.PI, D = 180 / PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, hash, smooth } = M;
  const FIB = (M.fib = M.FIB = {});
  const cx_ = () => M.ctx();
  const SIL = () => M._sil();
  const OFFP = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];

  // ------------------------------------------------------------ géométrie
  function ep(cx, cy, rx, ry, n, a0, a1) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; }
  function ell(cx, cy, rx, ry, n) { const o = ep(cx, cy, rx, ry, n || 16, 0, TAU); o.pop(); return o; }
  const mp = (m, p) => [m.a * p[0] + m.c * p[1] + m.e, m.b * p[0] + m.d * p[1] + m.f];
  const rect = (x0, y0, x1, y1) => [[x0, y0, 1], [x1, y0, 1], [x1, y1, 1], [x0, y1, 1]];
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
  const pc = (pts, base, paint, seed, o) => piece(pts, base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));
  const vif = (pts) => pts.map((p) => [p[0], p[1], 1]);
  // ligne ondulée « écriture » abstraite (jamais un chiffre ni une lettre)
  function onde(x0, x1, y, amp, per, col, lw, ph) {
    const o = []; for (let x = x0; x <= x1 + 0.1; x += 2) o.push([x, y + amp * Math.sin((x - x0) / per * TAU + (ph || 0))]);
    strokePts(o, col, lw || 1);
  }
  // disque plein frappé d'une croix (pièce, jeton) : jamais un rond vide qui lirait « 0 »
  function disque(x, y, r, col, colD, croix) {
    fillPts(ell(x, y, r, r, 14), colD, 0, 0); fillPts(ell(x - 0.6, y - 0.8, r * 0.86, r * 0.86, 14), col, 0, 0);
    if (croix !== false && r > 4) fillPts([[x, y - r * 0.42], [x + r * 0.3, y], [x, y + r * 0.42], [x - r * 0.3, y]], colD, 0, 0);   // losange frappé (pas de « + »)
    if (r > 3) dot(x - r * 0.35, y - r * 0.4, r * 0.18, 'rgba(255,250,220,0.7)');
  }
  FIB.geo = { ep, ell, rect, ribbon, qbez, rrect, onde, disque, mp, normA };

  // =====================================================================
  // OBJETS — dessinés à l'échelle 1 dans leur repère ; grip = point de prise ; p2 = seconde prise ; pts = points nommés ; base = point posé
  // =====================================================================
  const CUIR = '#6e2f1f', CUIRD = '#55231a', CUIRL = '#8a3f2a', LAITON = '#b08d45', LAITOND = '#76592a', LAITONL = '#d9bd72';
  const PAGE = '#eee3c6', PAGED = '#d9caa2', ENCRE = 'rgba(40,28,22,0.85)';

  // ---- plume d'oie : prise au milieu du fût, pointe en bas devant
  function drawPlume() {
    const tip = [30, 44], end = [-40, -96];
    pc(ribbon(qbez(tip, [0, -10], end, 10), 1.6, 3), '#e9e2cf', null, 7001);
    const v = qbez([2, -8], [-18, -46], [-42, -98], 10);                  // barbe de la plume, d'un seul côté du fût
    pc(v.concat([[-50, -92], [-34, -52], [-14, -20], [-4, -8]]), '#f2eee4', () => { for (let k = 0; k < 8; k++) strokePts([[-6 - k * 4.4, -14 - k * 11], [-14 - k * 4.4, -8 - k * 11]], 'rgba(120,110,90,0.45)', 0.9); }, 7002);
    strokePts([tip, [0, -10], end], 'rgba(150,140,115,0.9)', 1.4);
    pc([[tip[0] - 4, tip[1] - 8], [tip[0] + 2, tip[1] - 9], [tip[0] + 1, tip[1] + 1, 1]], '#1c1612', null, 7003, { drop: false });
  }

  // ---- livre de calcul (in-folio) : dos (reliure) en x = 0 ; fermé : couverture x 0..W ; ouvert : double page x −W..W ; bas en y = 0
  const LV = { W: 190, H: 240 };
  function fibRows(n) {                                   // arbre des couples : adulte → adulte + jeune ; jeune → adulte
    const rows = [[{ a: 0, p: -1 }]];
    for (let r = 1; r < n; r++) {
      const prev = rows[r - 1], row = [];
      prev.forEach((nd, i) => { row.push({ a: 1, p: i }); if (nd.a) row.push({ a: 0, p: i }); });
      rows.push(row);
    }
    return rows;
  }
  function motifPage(o, side, x0, x1, y0, y1) {          // contenu d'une page (side −1 gauche, 1 droite)
    const m = o.motif || 'colonnes', w = x1 - x0, h = y1 - y0;
    if (m === 'colonnes') {
      if (side < 0) {                                      // enluminure dorée (rinceau, sans lettre)
        pc(rect(x0 + 10, y0 + 12, x0 + 46, y0 + 48), '#8b2a22', () => { strokePts(qbez([x0 + 14, y0 + 44], [x0 + 28, y0 + 10], [x0 + 42, y0 + 30], 8), P.or, 2.4); dot(x0 + 22, y0 + 24, 3, P.or); dot(x0 + 36, y0 + 38, 3, P.or); }, 7101, { drop: false, texA: 0.3 });
        strokePts(qbez([x0 + 46, y0 + 30], [x0 + 70, y0 + 16], [x0 + 90, y0 + 30], 8), 'rgba(176,141,69,0.9)', 1.6);
      }
      const cols = 2, cw = (w - 26) / cols;
      for (let k = 0; k < cols; k++) {
        const cx0 = x0 + 12 + k * (cw + 4), top = side < 0 && k === 0 ? y0 + 56 : y0 + 14;
        for (let y = top, i = 0; y < y1 - 12; y += 11, i++) onde(cx0, cx0 + cw * (0.55 + 0.4 * hash(i * 3.1 + k + side * 7)), y, 1.6, 9, ENCRE, 1.1, i);
      }
      strokePts([[x0 + w / 2, y0 + 14], [x0 + w / 2, y1 - 14]], 'rgba(140,40,30,0.5)', 1);
    } else if (m === 'monnaies') {
      if (side < 0) {
        const R = M.rng(17);
        for (let i = 0; i < 7; i++) { const cx = x0 + 26 + (i % 3) * 32 + (i > 5 ? 16 : 0), cy = y0 + 34 + Math.floor(i / 3) * 44; disque(cx, cy, 13, i % 2 ? '#d4b25a' : '#c9c4b8', i % 2 ? '#8a6a2a' : '#7d7a72'); }
        for (let y = y0 + 160; y < y1 - 12; y += 11) onde(x0 + 12, x0 + 12 + (w - 30) * (0.5 + 0.5 * R()), y, 1.5, 9, ENCRE, 1);
      } else {                                             // balance dessinée à l'encre
        const cx = x0 + w / 2, ty = y0 + 40;
        strokePts([[cx, ty - 12], [cx, ty + 110]], ENCRE, 2); strokePts([[cx - 30, ty + 112], [cx + 30, ty + 112]], ENCRE, 2.4);
        strokePts([[cx - 56, ty + 6], [cx + 56, ty - 2]], ENCRE, 2.2);
        for (const [sx, dy] of [[-1, 6], [1, -2]]) {
          const ex = cx + sx * 56, ey = ty + dy;
          strokePts([[ex, ey], [ex - 16, ey + 46]], ENCRE, 0.9); strokePts([[ex, ey], [ex + 16, ey + 46]], ENCRE, 0.9);
          strokePts(ep(ex, ey + 46, 20, 7, 8, 0, PI), ENCRE, 1.6);
          disque(ex - 6, ey + 42, 6, '#d4b25a', '#8a6a2a'); disque(ex + 6, ey + 42, 6, '#d4b25a', '#8a6a2a');
        }
        for (let y = ty + 130; y < y1 - 12; y += 11) onde(x0 + 14, x1 - 20, y, 1.5, 9, ENCRE, 1, y);
      }
    } else if (m === 'lapins') {
      if (side < 0) {                                      // lapins dans un enclos, à l'encre
        const by = y0 + h * 0.62;
        for (let i = 0; i < 4; i++) {
          const lx = x0 + 30 + i * 34, ly = by - (i % 2) * 10;
          fillPts(ell(lx, ly, 13, 9, 10), 'rgba(110,80,55,0.85)', 0, 0); fillPts(ell(lx + 11, ly - 9, 7, 6, 8), 'rgba(110,80,55,0.85)', 0, 0);
          fillPts(ribbon([[lx + 9, ly - 13], [lx + 6, ly - 30]], 4, 2), 'rgba(110,80,55,0.85)', 0, 0);
          dot(lx - 12, ly - 3, 3, 'rgba(250,245,230,0.95)');
        }
        for (let x = x0 + 14; x <= x1 - 12; x += 16) strokePts([[x, by - 26], [x, by + 14]], ENCRE, 1.4);
        strokePts([[x0 + 12, by - 18], [x1 - 12, by - 18]], ENCRE, 1.2); strokePts([[x0 + 12, by + 2], [x1 - 12, by + 2]], ENCRE, 1.2);
        for (let y = y0 + 16; y < y0 + 60; y += 11) onde(x0 + 14, x1 - 24, y, 1.5, 9, ENCRE, 1, y);
        for (let y = by + 30; y < y1 - 12; y += 11) onde(x0 + 14, x1 - 30, y, 1.5, 9, ENCRE, 1, y);
      } else {                                             // arbre de points 1-1-2-3-5-8 qui pousse avec rangs
        const rg = clamp(o.rangs == null ? 6 : o.rangs, 0, 6), n = Math.ceil(rg), rows = fibRows(6);
        const top = y0 + 22, dy = (h - 44) / 5.4, pos = [];
        for (let r = 0; r < 6; r++) { const row = rows[r], sp = Math.min(22, (w - 24) / Math.max(1, row.length)); pos.push(row.map((nd, i) => [x0 + w / 2 + (i - (row.length - 1) / 2) * sp, top + r * dy])); }
        for (let r = 0; r < n; r++) {
          const k = clamp(rg - r), row = rows[r];
          row.forEach((nd, i) => {
            const [px, py] = pos[r][i];
            if (r > 0) { const q = pos[r - 1][nd.p]; strokePts([q, [lerp(q[0], px, k), lerp(q[1], py, k)]], 'rgba(60,40,30,0.75)', 1.2); }
            if (k > 0.6) { const rr = 6 * clamp((k - 0.6) / 0.4); fillPts(ell(px, py, rr, rr, 10), nd.a ? '#8b2a22' : '#c08a3a', 0, 0); dot(px - rr * 0.3, py - rr * 0.35, rr * 0.25, 'rgba(255,240,210,0.7)'); }
          });
        }
      }
    }
  }
  function pageBloc(x0, x1, y0, y1, side, seed) {        // une page ivoire (avec son ombre de pliure)
    pc(vif([[x0, y0 + (side < 0 ? 4 : 0)], [x1, y0 + (side < 0 ? 0 : 4)], [x1, y1], [x0, y1]]), PAGE, () => {
      hatch(null, 0.3, 6, 0.06, 1, '120,100,60', [x0, y0, x1, y1]);
      if (side < 0) shade(x1, 0, x1 - 30, 0, 0.35, [x0, y0, x1, y1]); else shade(x0, 0, x0 + 30, 0, 0.35, [x0, y0, x1, y1]);
    }, seed, { texA: 0.4 });
  }
  function drawLivre(o) {
    const e = o.echelle == null ? 1 : o.echelle, W = LV.W, H = LV.H, u = clamp(o.ouvert || 0), c = cx_();
    c.save(); c.scale(e, e);
    const fl = Math.sin(PI * u);                           // la couverture qui tourne s'évase vers le public
    if (u > 0.02) {
      // dos de couverture ouvert (cuir) + tranche de papier en bas, page droite
      pc(vif([[-W * smooth(0.5, 1, u) - 6, -H - 6], [W + 6, -H - 6], [W + 6, 6], [-W * smooth(0.5, 1, u) - 6, 6]]), CUIR, null, 7201, { drop: u > 0.5 });
      pc(rect(-W * smooth(0.5, 1, u), -6, W, 4), PAGED, () => { for (const y of [-3, 0, 2]) strokePts([[-W, y], [W, y]], 'rgba(120,100,60,0.45)', 0.7); }, 7202, { drop: false });
      pageBloc(0, W - 4, -H, -6, 1, 7203);
      c.save(); c.beginPath(); c.rect(0, -H, W - 4, H - 6); c.clip(); motifPage(o, 1, 0, W - 4, -H, -6); c.restore();
    }
    const xe = W * Math.cos(PI * u);                       // bord libre de la couverture
    if (u < 0.5) {                                         // couverture (extérieur) vue de face, qui se rétrécit
      const k = Math.max(0.02, xe / W), sw = 18 * fl;
      if (u <= 0.02) {                                     // fermé : un pavé (tranche crème à droite et en haut)
        pc(vif([[W - 2, -H + 2], [W + 20, -H - 12], [W + 20, -14], [W - 2, 0]]), '#e8dcbc', () => { for (let i = 1; i < 9; i++) strokePts([[W + i * 2.2, -H - 1 - i * 1.4], [W + i * 2.2, -1 - i * 1.4]], 'rgba(120,100,60,0.35)', 0.7); }, 7204);
        pc(vif([[2, -H], [20, -H - 14], [W + 20, -H - 14], [W - 2, -H]]), '#e3d5b2', null, 7205);
      }
      c.save(); c.scale(k, 1);
      pc(vif([[0, -H], [W, -H - sw / k * 0.1], [W, 0], [0, 0]]), CUIR, () => {
        strokePts(rect(14, -H + 14, W - 14, -14).concat([[14, -H + 14]]), 'rgba(217,189,114,0.7)', 2.4);
        strokePts(rect(24, -H + 24, W - 24, -24).concat([[24, -H + 24]]), 'rgba(217,189,114,0.45)', 1.2);
        fillPts([[W / 2, -H / 2 - 30], [W / 2 + 22, -H / 2], [W / 2, -H / 2 + 30], [W / 2 - 22, -H / 2]], 'rgba(217,189,114,0.55)', 0, 0);   // losange doré
        dot(W / 2, -H / 2, 6, '#8b2a22');
        hatch(null, 0.8, 5, 0.18, 1, '30,10,5', [0, -H, W, 0]); shade(W, 0, 0, 0, 0.3, [0, -H, W, 0]);
        strokePts([[6, -H + 4], [6, -4]], 'rgba(255,220,180,0.25)', 3);
      }, 7206);
      for (const [x, y, sx, sy] of [[0, -H, 1, 1], [W, -H, -1, 1], [W, 0, -1, -1], [0, 0, 1, -1]]) pc([[x, y, 1], [x + sx * 30, y, 1], [x, y + sy * 30, 1]], LAITON, () => dot(x + sx * 8, y + sy * 8, 2.4, LAITOND), 7207);
      pc(rect(W - 4, -H / 2 - 12, W + 14, -H / 2 + 12), LAITON, () => { dot(W + 5, -H / 2, 3.4, LAITOND); strokePts([[W - 2, -H / 2 - 8], [W + 12, -H / 2 - 8]], LAITONL, 1.2); }, 7208);   // fermoir
      c.restore();
    } else {                                               // la couverture est passée : page gauche (son revers) qui s'aplatit
      const k = -xe / W;
      c.save(); c.scale(k, 1);
      pageBloc(-(W - 4), 0, -H, -6, -1, 7209);
      c.save(); c.beginPath(); c.rect(-(W - 4), -H, W - 4, H - 6); c.clip(); motifPage(o, -1, -(W - 4), 0, -H, -6); c.restore();
      c.restore();
      strokePts([[0, -H + 2], [0, -6]], 'rgba(60,40,20,0.5)', 2);
    }
    c.restore();
  }
  const livreCx = (o) => lerp(LV.W / 2, 0, smooth(0.15, 0.85, clamp((o && o.ouvert) || 0)));

  // ---- registre de marchand : couverture souple de vélin, lacets de cuir, pages à colonnes ondulées
  const RG = { W: 130, H: 170, velin: '#d7c49a', velinD: '#b8a272' };
  function drawRegistre(o) {
    const e = o.echelle == null ? 1 : o.echelle, W = RG.W, H = RG.H, u = clamp(o.ouvert || 0), c = cx_();
    c.save(); c.scale(e, e);
    const lignes = (x0, x1) => { for (let y = -H + 14, i = 0; y < -14; y += 9, i++) { onde(x0 + 8, x0 + 8 + (x1 - x0 - 16) * 0.45, y, 1.3, 8, ENCRE, 1, i); onde(x0 + 10 + (x1 - x0) * 0.55, x1 - 8 - (x1 - x0) * 0.1 * hash(i), y, 1.3, 7, ENCRE, 1, i + 2); } strokePts([[(x0 + x1) / 2, -H + 10], [(x0 + x1) / 2, -10]], 'rgba(140,40,30,0.55)', 1); };
    if (u > 0.02) {
      pc(vif([[-W * smooth(0.5, 1, u) - 5, -H - 4], [W + 5, -H - 4], [W + 5, 4], [-W * smooth(0.5, 1, u) - 5, 4]]), RG.velinD, null, 7301, { drop: u > 0.5 });
      pc(rect(0, -H, W - 3, -3), '#efe6cc', () => { shade(0, 0, 24, 0, 0.3, [0, -H, W, 0]); lignes(0, W - 3); }, 7302, { texA: 0.4 });
    }
    const xe = W * Math.cos(PI * u);
    if (u < 0.5) {
      const k = Math.max(0.02, xe / W);
      c.save(); c.scale(k, 1);
      pc([[0, -H, 1], [W - 6, -H - 2], [W + 4, -H + 10], [W + 2, -4], [W - 8, 2], [0, 0, 1]], RG.velin, () => {
        hatch(null, 0.5, 6, 0.12, 1, '90,70,40', [0, -H, W, 0]); shade(W, 0, 0, 0, 0.22, [0, -H, W + 6, 4]);
        strokePts([[10, -H + 4], [10, -4]], 'rgba(120,90,50,0.6)', 1.6);
        for (const y of [-H * 0.72, -H * 0.28]) { strokePts([[10, y], [W + 10, y]], '#5a3a22', 3); }
      }, 7303);
      strokePts([[W + 2, -H * 0.5], [W + 16, -H * 0.5 + 10], [W + 12, -H * 0.5 + 30]], '#5a3a22', 2.4);   // lacet qui pend
      c.restore();
    } else {
      const k = -xe / W;
      c.save(); c.scale(k, 1);
      pc(rect(-(W - 3), -H, 0, -3), '#efe6cc', () => { shade(0, 0, -24, 0, 0.3, [-W, -H, 0, 0]); lignes(-(W - 3), 0); }, 7304, { texA: 0.4 });
      c.restore();
    }
    c.restore();
  }
  const regCx = (o) => lerp(RG.W / 2, 0, smooth(0.15, 0.85, clamp((o && o.ouvert) || 0)));

  // ---- bourse de cuir (prise au col, sous le lacet)
  function drawBourse(o) {
    const sw = 0.06 * Math.sin((o.t || 0) * 3);
    const c = cx_(); c.save(); c.rotate(sw);
    pc([[-8, -52], [8, -52], [10, -42], [30, -26], [36, 0], [26, 18, 1], [-26, 18, 1], [-36, 0], [-30, -26], [-10, -42]], '#6b4a2b', () => {
      for (const x of [-18, -6, 6, 18]) strokePts([[x * 0.4, -42], [x, 12]], 'rgba(40,24,12,0.45)', 1);
      hatch(null, 0.8, 4, 0.22); shade(30, 0, -30, 0, 0.3, [-40, -60, 40, 20]);
      disque(8, -6, 6, '#d4b25a', '#8a6a2a');
    }, 7401);
    strokePts([[-12, -44], [0, -40], [12, -44]], '#3a2414', 2.4); strokePts([[10, -43], [20, -30], [16, -16]], '#3a2414', 1.6);
    c.restore();
  }
  // ---- sceau (matrice de laiton à manche de bois)
  function drawSceau() {
    pc([[-6, -46], [6, -46], [8, -14], [-8, -14]], '#5a3a22', () => hatch(null, 0.9, 3, 0.25), 7501);
    dot(0, -50, 9, '#5a3a22');
    pc([[-14, -14], [14, -14], [18, 0, 1], [18, 8, 1], [-18, 8, 1], [-18, 0, 1]], LAITON, () => { strokePts([[-14, 2], [14, 2]], LAITOND, 1.2); strokePts([[-10, -10], [-8, 4]], LAITONL, 1.4); }, 7502);
  }
  // ---- balance de changeur : anneau de prise en haut ; fléau à y 24 ; plateaux à y 112 ; pied facultatif (sol à y 200)
  function drawBalance(o) {
    const a = clamp(o.incline || 0, -1, 1) * 0.2, c = cx_(), g = o.gauche == null ? 3 : o.gauche, d = o.droite == null ? 2 : o.droite;
    if (o.pied) {
      pc([[-4, 20, 1], [4, 20, 1], [5, 186, 1], [-5, 186, 1]], LAITOND, null, 7601);
      pc([[-44, 200, 1], [44, 200, 1], [36, 184], [-36, 184]], '#5a3a22', () => strokePts([[-36, 188], [36, 188]], 'rgba(255,220,170,0.3)', 1.4), 7602);
      pc([[-4, -6], [26, -14], [30, -8], [4, 4]], LAITOND, null, 7603);
    }
    pc(ell(0, -8, 9, 9, 10), LAITON, () => fillPts(ell(0, -8, 4, 4, 8), o.pied ? '#5a3a22' : 'rgba(30,20,10,0.9)', 0, 0), 7604, { drop: false });
    const L = 82, end = (sx) => [sx * L * Math.cos(a), 24 + sx * L * Math.sin(a)];
    for (const sx of [-1, 1]) {
      const e = end(sx), py = e[1] + 88, n = sx < 0 ? g : d;
      strokePts([e, [e[0] - 22, py]], 'rgba(60,45,20,0.9)', 1.1); strokePts([e, [e[0] + 22, py]], 'rgba(60,45,20,0.9)', 1.1);
      for (let i = 0; i < n; i++) { pc(ell(e[0] + (i % 3 - 1) * 9, py - 4 - Math.floor(i / 3) * 5, 8, 3, 10), '#d4b25a', () => strokePts([[e[0] - 4, py - 5], [e[0] + 4, py - 5]], 'rgba(255,250,210,0.6)', 1), 7605 + i, { drop: false }); }
      pc(ep(e[0], py, 28, 10, 10, 0, PI).concat([[e[0] - 28, py - 1]]), LAITON, () => { strokePts([[e[0] - 24, py + 2], [e[0] + 20, py + 2]], LAITONL, 1.2); shade(e[0] + 28, 0, e[0] - 28, 0, 0.3, [e[0] - 30, py - 4, e[0] + 30, py + 12]); }, 7610 + sx);
    }
    c.save(); c.translate(0, 24); c.rotate(a);
    pc([[-L - 4, -3], [L + 4, -3], [L + 6, 0], [L + 4, 3], [-L - 4, 3], [-L - 6, 0]], LAITON, () => strokePts([[-L, -1.5], [L, -1.5]], LAITONL, 1.1), 7612);
    pc([[-2.5, 0, 1], [2.5, 0, 1], [1.4, -30, 1], [-1.4, -30, 1]], '#2a2420', null, 7613, { drop: false });
    c.restore();
    pc([[-8, 16], [8, 16], [6, 32], [-6, 32]], LAITOND, null, 7614);
    M.rivet(0, 24, 3.2);
  }
  // ---- pile de pièces (de face) : n pièces, métal 'or' | 'argent' | 'cuivre'
  const METAL = { or: ['#d4b25a', '#8a6a2a', '#f0dc98'], argent: ['#c9c6bd', '#7d7a72', '#eeece6'], cuivre: ['#b8743e', '#7a4520', '#e0a878'] };
  function drawPieces(o) {
    const n = Math.max(1, Math.round(o.n == null ? 6 : o.n)), mt = METAL[o.metal || 'or'] || METAL.or, R = 17, th = 5.2;
    for (let i = 0; i < n; i++) {
      const y = -i * th, dx = (hash(i * 3.3 + (o.seed || 0)) - 0.5) * 3;
      pc([[dx - R, y - th], [dx + R, y - th], [dx + R, y, 1], [dx - R, y, 1]], mt[1], () => { strokePts([[dx - R + 2, y - th + 1.6], [dx + R - 2, y - th + 1.6]], mt[0], 1.4); for (let k = -3; k <= 3; k++) strokePts([[dx + k * 5, y - th + 2], [dx + k * 5, y - 0.5]], 'rgba(40,25,10,0.3)', 0.6); }, 7701 + i, { drop: i === 0 });
    }
    const ty = -n * th, dx = (hash((n - 1) * 3.3 + (o.seed || 0)) - 0.5) * 3;
    pc(ell(dx, ty, R, 5.5, 14), mt[0], () => { strokePts([[dx - 6, ty], [dx + 6, ty]], mt[1], 1.2); strokePts([[dx, ty - 2.5], [dx, ty + 2.5]], mt[1], 1.2); strokePts(ep(dx, ty, R - 3, 3.5, 8, PI * 1.1, PI * 1.6), mt[2], 1); }, 7720, { drop: false });
  }
  // ---- abaque à jetons (table à calculer vue de face, inclinée vers le public) ; base = milieu du bas ; jetons qui tombent : chute 0..1
  const AB = { W: 280, H: 150, lignes: 5 };
  function abaqueJetons(o) {                             // positions de repos (repère de l'abaque) ; déterministe
    const R = M.rng(o.seed || 31), out = [], n = o.n == null ? 14 : o.n;
    for (let i = 0; i < n; i++) {
      const li = Math.floor(R() * AB.lignes), y = -AB.H + 26 + li * 24 + (R() < 0.35 ? 12 : 0);
      out.push([-AB.W / 2 + 30 + R() * (AB.W - 60), y, i]);
    }
    return out;
  }
  function jetonPos(o, j) {
    const p = clamp(o.pousse || 0), ch = clamp(o.chute || 0), i = j[2];
    let x = j[0], y = j[1], r = 0;
    if (i === (o.jeton || 0)) x += 44 * ease(p);
    if (ch > 0) {
      const t0 = hash(i * 7.7) * 0.45, u = clamp((ch - t0) / (1 - t0) * 1.6);
      if (u > 0) {
        const sol = o.sol == null ? 90 : o.sol, vx = (hash(i * 2.1) - 0.5) * 140, yy = y + (sol - y) * u * u;
        x += vx * u; y = yy; r = u * (hash(i) * 6 - 3);
        if (u >= 1) { y = sol; }
      }
    }
    return [x, y, r];
  }
  function drawAbaque(o) {
    const W = AB.W, H = AB.H, c = cx_();
    pc([[-W / 2 - 14, 4, 1], [W / 2 + 14, 4, 1], [W / 2 + 4, -H - 10, 1], [-W / 2 - 4, -H - 10, 1]], '#6b4526', () => { strokePts([[-W / 2 - 10, 0], [W / 2 + 10, 0]], 'rgba(255,220,170,0.35)', 2); hatch(null, 0.15, 5, 0.2); }, 7801);
    pc([[-W / 2 + 6, -6, 1], [W / 2 - 6, -6, 1], [W / 2 - 12, -H, 1], [-W / 2 + 12, -H, 1]], '#3f5a3a', () => {
      for (let k = 0; k < AB.lignes; k++) strokePts([[-W / 2 + 10, -H + 26 + k * 24], [W / 2 - 10, -H + 26 + k * 24]], 'rgba(235,225,190,0.75)', 1.4);
      strokePts([[0, -H + 6], [0, -10]], 'rgba(235,225,190,0.5)', 1.2);
      hatch(null, 0.9, 4, 0.12, 1, '10,20,10'); shade(0, -H, 0, 0, 0.25, [-W / 2, -H, W / 2, 0]);
    }, 7802, { drop: false });
    for (const j of abaqueJetons(o)) {
      const [x, y, r] = jetonPos(o, j), col = j[2] % 3 === 0 ? ['#e8dcc0', '#9a8c6a'] : ['#c9a24e', '#7a5a22'];
      c.save(); c.translate(x, y); c.rotate(r);
      fillPts(ell(1.2, 2, 9, 9, 12), 'rgba(10,8,4,0.35)', 0, 0); disque(0, 0, 9, col[0], col[1], false);
      c.restore();
    }
  }

  const OBJ = {
    plume: { draw: drawPlume, grip: [0, 0], pts: { pointe: [30, 44], bout: [-40, -96] }, base: [0, 0] },
    livre: { plat: true, draw: drawLivre, held: { echelle: 0.72 },
      grip: (o) => { const e = o.echelle == null ? 1 : o.echelle; return o.prise === 'bas' ? [livreCx(o) * e, -12 * e] : [(LV.W - 10) * e, -LV.H / 2 * e]; },
      p2: (o) => { const e = o.echelle == null ? 1 : o.echelle; return [livreCx(o) * e, -12 * e]; },
      pts: { centre: (o) => [livreCx(o), -LV.H / 2], haut: (o) => [livreCx(o), -LV.H], base: (o) => [livreCx(o), 0], dos: [0, -LV.H / 2], tranche: [LV.W, -LV.H / 2] },
      base: (o) => [livreCx(o), 0] },
    registre: { plat: true, draw: drawRegistre, held: { echelle: 0.9 },
      grip: (o) => { const e = o.echelle == null ? 1 : o.echelle; return o.prise === 'bas' ? [regCx(o) * e, -10 * e] : [(RG.W - 8) * e, -RG.H / 2 * e]; },
      p2: (o) => { const e = o.echelle == null ? 1 : o.echelle; return [regCx(o) * e, -10 * e]; },
      pts: { centre: (o) => [regCx(o), -RG.H / 2], rabat: (o) => [RG.W * Math.cos(PI * clamp(o.ouvert || 0)), -RG.H / 2], base: (o) => [regCx(o), 0] },
      base: (o) => [regCx(o), 0] },
    bourse: { draw: drawBourse, grip: [0, -44], pts: { centre: [0, -10], bouche: [0, -50] }, base: [0, 18] },
    sceau: { draw: drawSceau, grip: [0, -32], pts: { empreinte: [0, 8] }, base: [0, 8] },
    balance: { draw: drawBalance, grip: [0, -8], held: { pied: false },
      pts: { gauche: (o) => { const a = clamp(o.incline || 0, -1, 1) * 0.2; return [-82 * Math.cos(a), 24 - 82 * Math.sin(a) + 84]; }, droite: (o) => { const a = clamp(o.incline || 0, -1, 1) * 0.2; return [82 * Math.cos(a), 24 + 82 * Math.sin(a) + 84]; }, pivot: [0, 24] },
      base: [0, 200] },
    pieces: { draw: drawPieces, grip: [0, -10], pts: { haut: (o) => [0, -5.2 * Math.max(1, Math.round(o.n == null ? 6 : o.n))] }, base: [0, 0] },
    abaque: { draw: drawAbaque, grip: [0, 0], pts: { centre: [0, -AB.H / 2], jeton: (o) => { const j = abaqueJetons(o).find((q) => q[2] === (o.jeton || 0)); const p = jetonPos(o, j); return [p[0], p[1]]; } }, base: [0, 0] },
  };
  FIB.OBJ = OBJ;
  const val = (v, o) => (typeof v === 'function' ? v(o) : v);
  const gripOf = (ob, o) => val(ob.grip, o);
  function heldOpts(name, o, p) { const ob = OBJ[name]; return Object.assign({ t: p.t || 0 }, ob.held || {}, o || {}); }
  function heldDraw(name, o, p) {
    const ob = OBJ[name]; if (!ob) return;
    const oo = heldOpts(name, o, p), g = gripOf(ob, oo), c = cx_();
    c.save(); c.translate(-g[0], -g[1]); ob.draw(oo); c.restore();
  }
  // point nommé d'un objet, dans le repère de l'objet tenu (origine = prise), échelle de prise comprise
  function ptHeld(name, oo, nom) {
    const ob = OBJ[name]; if (!ob || !ob.pts[nom]) return null;
    const q = val(ob.pts[nom], oo), g = gripOf(ob, oo), e = ob.plat ? (oo.echelle == null ? 1 : oo.echelle) : 1;
    return [q[0] * e - g[0], q[1] * e - g[1]];
  }
  const has = (v) => v && v !== 'rien';
  const DOIGTS = [[-13, -9], [9, -11], [12, -4], [12, 6], [6, 11], [-6, 11], [-13, 4]];
  const doigtsPaint = () => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(70,40,30,0.5)', 1); hatch(null, 0.9, 3.4, 0.15); };
  function heldParts(skin, seed) {
    const plat = (n) => has(n) && OBJ[n] && OBJ[n].plat;
    return {
      objetP: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (plat(p.tenu)) heldDraw(p.tenu, p.tenuO, p); } },
      objet: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 2, pts: OFFP, extra: (p) => { if (has(p.tenu) && !plat(p.tenu)) heldDraw(p.tenu, p.tenuO, p); } },
      doigts: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 3, pts: (p) => (has(p.tenu) ? DOIGTS : OFFP), paint: doigtsPaint },
      objetBP: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 4, pts: OFFP, extra: (p) => { if (plat(p.tenuB)) heldDraw(p.tenuB, p.tenuBO, p); } },
      objetB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 5, pts: OFFP, extra: (p) => { if (has(p.tenuB) && !plat(p.tenuB)) heldDraw(p.tenuB, p.tenuBO, p); } },
      doigtsBb: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 6, pts: (p) => (has(p.tenuB) && !plat(p.tenuB) && !p._deux ? DOIGTS : OFFP), paint: doigtsPaint },
      doigtsB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 7, pts: (p) => (p._deux || plat(p.tenuB) ? DOIGTS : OFFP), paint: doigtsPaint },
    };
  }
  // ordre commun : fond → avant (heads = pièces de tête, devant = pièces portées sur le torse)
  const ORDER = (fond, heads, devant) => ['armB_up', 'armB_lo', 'objetB', 'doigtsBb'].concat(fond, ['legB', 'legF', 'head'], heads, ['torso'], devant, ['objetBP', 'objetP', 'armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsB']);

  // ---------------- bras à articulations rondes
  const R_COUDE = 11.5, LA = 96, LB = Math.hypot(4, 96), PHI = Math.atan2(-4, 96), SH_F = [-2, -146], SH_B = [-10, -146];
  function armR(len, wt) { wt = wt || 15; return ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1, 40], [R_COUDE + 0.5, len - 6]], ep(0, len, R_COUDE, R_COUDE, 10, 0, PI), [[-R_COUDE - 0.5, len - 6], [-wt + 1, 40]]); }
  function foreR(kind) { const f = X.forePts(kind); return ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU).concat(f.slice(2)); }
  // IK deux segments dans le repère du torse (vise le point de prise [4,96]) ; pick 'bas' | 'avant' | 'haut'
  function ik2(S, T, pick) {
    const vx = T[0] - S[0], vy = T[1] - S[1];
    const d = clamp(Math.hypot(vx, vy), Math.abs(LA - LB) + 1, LA + LB - 0.5), tv = Math.atan2(-vx, vy);
    const a1 = Math.acos(clamp((LA * LA + d * d - LB * LB) / (2 * LA * d), -1, 1));
    let best = null;
    for (const sg of [1, -1]) {
      const a = tv + sg * a1, E = [S[0] - LA * Math.sin(a), S[1] + LA * Math.cos(a)];
      const cAbs = Math.atan2(-(T[0] - E[0]), T[1] - E[1]) - PHI;
      const b = normA(cAbs - a);
      // le coude ne plie que vers l'avant (b ≤ 0) : on écarte la solution « coude à l'envers »
      const sc = (b > 0.05 ? -1000 : 0) + (pick === 'avant' ? E[0] : pick === 'haut' ? -E[1] : E[1]);
      if (!best || sc > best.sc) best = { a: normA(a), b, sc };
    }
    return best;
  }
  function prep(p) { p = p || {}; return Object.assign({}, p, { ang: Object.assign({}, p.ang), hide: Object.assign({}, p.hide), face: Object.assign({}, p.face) }); }
  function armTo(q, arm, T, pick, k) {
    if (!(k > 0)) return;
    const sol = ik2(arm === 'armF' ? SH_F : SH_B, T, pick || 'bas'), A = q.ang;
    const a0 = A[arm + '_up'] || 0, b0 = A[arm + '_lo'] || 0;
    A[arm + '_up'] = a0 + normA(sol.a - a0) * k; A[arm + '_lo'] = b0 + normA(sol.b - b0) * k;
  }
  const blend = (q, n, v, k) => { q.ang[n] = lerp(q.ang[n] || 0, v, k); };
  // point écran → repère du torse (mêmes x, y, s, dir que l'appel à puppet)
  function toTorse(def, q, x, y, s, dir, Pt) {
    const { mats } = M.partMatrices(def, q, x, y, s, dir);
    const r = new DOMPoint(Pt[0], Pt[1]).matrixTransform(mats.torso.inverse()); return [r.x, r.y];
  }
  // décalage (repère du torse) entre la prise et un point nommé d'un objet tenu droit à l'écran
  function decalObjet(q, nom) {
    if (!has(q.tenu) || !OBJ[q.tenu]) return [0, 0];
    const oo = heldOpts(q.tenu, q.tenuO, q), v = ptHeld(q.tenu, oo, nom);
    if (!v) return [0, 0];
    const tl = q.tilt || 0;                                   // l'objet est droit à l'écran : le ramener dans le repère du torse
    return [v[0] * Math.cos(tl) + v[1] * Math.sin(tl), -v[0] * Math.sin(tl) + v[1] * Math.cos(tl)];
  }
  function finish(q) {
    const A = q.ang, tl = q.tilt || 0;
    if (has(q.tenu) && !(q.handF && q.handF !== 'fist')) q.handF = 'fist';
    if (has(q.tenuB) && !(q.handB && q.handB !== 'fist')) q.handB = 'fist';
    if (q.droit == null && has(q.tenu)) q.droit = true;
    if (q.droitB == null && has(q.tenuB)) q.droitB = true;
    if (q.droit) A.objet = (A.objet || 0) - ((A.armF_up || 0) + (A.armF_lo || 0) + tl);
    if (q.droitB) A.objetB = (A.objetB || 0) - ((A.armB_up || 0) + (A.armB_lo || 0) + tl);
    A.objetP = A.objet; A.doigts = A.objet; A.objetBP = A.objetB; A.doigtsB = A.objetB; A.doigtsBb = A.objetB;
    q._deux = false;
    if (q.deuxMains && has(q.tenu) && OBJ[q.tenu] && OBJ[q.tenu].p2) {
      const ob = OBJ[q.tenu], oo = heldOpts(q.tenu, q.tenuO, q), g = gripOf(ob, oo);
      const Hf = new DOMMatrix().translate(SH_F[0], SH_F[1]).rotate((A.armF_up || 0) * D).translate(0, LA).rotate((A.armF_lo || 0) * D).translate(4, 96).rotate((A.objet || 0) * D).translate(-g[0], -g[1]);
      const p2 = ob.p2(oo), T = mp(Hf, p2);
      const sol = ik2(SH_B, T, 'bas'), k = q.deuxMains === true ? 1 : clamp(q.deuxMains);
      A.armB_up = lerp(A.armB_up || 0, sol.a, k); A.armB_lo = lerp(A.armB_lo || 0, sol.b, k); q.handB = 'fist'; q._deux = k > 0.5;
      A.doigtsB = -((A.armB_up || 0) + (A.armB_lo || 0) + tl);
    }
    return q;
  }
  function run(def, q, x, y, s, o) {
    o = Object.assign({ slot: M.ST.slotF }, o || {});
    const r = M.puppet(def, q, x, y, s, o);
    r.q = q; r.tenu = q.tenu; r.tenuB = q.tenuB;
    if (has(q.tenu) && OBJ[q.tenu]) r.tenuO = heldOpts(q.tenu, q.tenuO, q);
    if (has(q.tenuB) && OBJ[q.tenuB]) r.tenuBO = heldOpts(q.tenuB, q.tenuBO, q);
    r.main = r.w('armF_lo', 4, 96); r.mainB = r.w('armB_lo', 4, 96);
    return r;
  }
  // point nommé de l'objet tenu, à l'écran : FIB.pt(r, 'pointe') ; main arrière : FIB.pt(r, 'nom', true)
  FIB.pt = function (r, nom, arriere) {
    const name = arriere ? r.tenuB : r.tenu; if (!has(name)) return null;
    const v = ptHeld(name, arriere ? r.tenuBO : r.tenuO, nom); if (!v) return null;
    return r.w(OBJ[name].plat ? (arriere ? 'objetBP' : 'objetP') : (arriere ? 'objetB' : 'objet'), v[0], v[1]);
  };

  // =====================================================================
  // ACCESSOIRES SEULS — M.puppet à une pièce invisible ; (x,y) = point posé (base) ; ombre portée possible
  // =====================================================================
  const accDefs = {};
  function accDef(name) {
    const ob = OBJ[name];
    return accDefs[name] || (accDefs[name] = { hipY: 0, handLen: 10, rod: null, libre: { armF: 1, armB: 1, legF: 1, legB: 1 },
      parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => { const b = val(ob.base, p.o), c = cx_(); c.save(); c.translate(-b[0], -b[1]); ob.draw(p.o); c.restore(); } } }, order: ['o'] });
  }
  function acc(name, x, y, s, o, sDef) {
    o = Object.assign({}, o || {}); s = s == null ? (sDef || 1) : s;
    if (name === 'balance' && o.pied == null) o.pied = true;
    const r = M.puppet(accDef(name), { o, tilt: o.rot || 0 }, x, y, s, { dir: o.dir || 1, rod: false, slot: o.slot != null ? o.slot : y + 4 * s, floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
    const ob = OBJ[name], b = val(ob.base, o);
    r.pt = (nom) => { const q = ob.pts[nom] ? val(ob.pts[nom], o) : null; return q ? r.w('o', q[0] - b[0], q[1] - b[1]) : null; };
    return r;
  }
  for (const n of Object.keys(OBJ)) FIB[n] = (x, y, s, o) => acc(n, x, y, s, o);

  // partagé avec les sections suivantes (marionnettes, lapins, décor)
  FIB._ = { X, P, TAU, PI, D, ep, ell, mp, rect, ribbon, qbez, normA, rrect, pc, onde, disque, OBJ, heldParts, ORDER, armR, foreR, ik2, prep, armTo, blend, toTorse, decalObjet, finish, run, has, LA, LB, SH_F, SH_B, R_COUDE, CUIR, LAITON, LAITOND, LAITONL, METAL, AB, OFFP };
})();

// ===================================================================== MARIONNETTES : Leonardo, le marchand (5 tenues)
(function () {
  'use strict';
  const FIB = M.FIB, _ = FIB._, CH = M.chars;
  const { X, P, TAU, PI, ep, ell, ribbon, qbez, pc, heldParts, ORDER, armR, foreR, prep, armTo, blend, toTorse, decalObjet, finish, run, has, LA } = _;
  const { fillPts, strokePts, dot, hatch, shade, lerp, clamp, ease, smooth } = M;
  const cx_ = () => M.ctx();
  const SIL = () => M._sil();
  FIB.BEND = { leonardo: { armF: 1, armB: 1 }, marchand: { armF: 1, armB: 1 } };   // bendSign de M.ik (vérifié sur la planche)

  // ---------------- pièces communes
  function foreDef(parent, base, skin, back, seed, cuff, cuffW) {
    const hk = (p) => (back ? p.handB : p.handF) || 'fist';
    return { parent, at: [0, LA], pts: (p) => foreR(hk(p)), base, seed, paint: (p) => {
      fillPts([[-20, 76, 1], [20, 76, 1], [24, 130, 1], [-20, 130, 1]], skin); X.handPaint(null, hk(p));
      if (cuff) fillPts([[-(cuffW || 14), 60, 1], [cuffW || 14, 60, 1], [(cuffW || 14) + 1, 78, 1], [-(cuffW || 14), 78, 1]], cuff);
      hatch([[-14, -10], [-3, -10], [-3, 58], [-14, 58]], 0.9, 3.8, back ? 0.3 : 0.22);
    } };
  }
  const upDef = (at, base, seed, wt) => ({ parent: 'torso', at, pts: armR(LA, wt), base, seed, paint: () => hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.28) });
  // jambe à soulier bas et pointu (pointe vers +x)
  function legPtsPointu(th) {
    const L = X.legPts(th);
    return L.slice(0, 9).concat([[42, 224], [64, 233, 1], [44, 237, 1]], L.slice(12));
  }
  function legDef(at, base, shoe, seed, back) {
    return { parent: 'torso', at, pts: legPtsPointu(0.9), base, seed, noRivet: !!back, paint: () => {
      fillPts([[-40, 212, 1], [80, 212, 1], [80, 260, 1], [-40, 260, 1]], shoe);
      strokePts([[-18, 214], [14, 216]], 'rgba(255,230,190,0.25)', 1.2);
      if (!back) { strokePts([[22, 224], [50, 231]], 'rgba(255,255,255,0.22)', 1.2); hatch([[-24, -20], [-6, -20], [-6, 212], [-24, 212]], 0.8, 4, 0.25); }
      else hatch(null, 0.8, 3.6, 0.3);
    } };
  }
  // geste de marche commun (jambes ou robe, bras, sautillement)
  function marche(q, mk, jambes) {
    if (!(mk > 0)) return;
    const A = q.ang, ph = (q.t || 0) * 7.2, sw = Math.sin(ph);
    if (jambes) { A.legF = (A.legF || 0) + 0.3 * sw * mk; A.legB = (A.legB || 0) - 0.3 * sw * mk; }
    A.armF_up = (A.armF_up || 0) + 0.12 * sw * mk; A.armB_up = (A.armB_up || 0) - 0.12 * sw * mk;
    q.dy = (q.dy || 0) - Math.abs(Math.cos(ph)) * 5 * mk; q.tilt = (q.tilt || 0) + 0.02 * mk;
  }
  // tête vers une cible (repère du torse)
  function regarde(q, Tl, k) {
    if (!(k > 0) || !Tl) return;
    const a = Math.atan2(Tl[1] - (-222), Math.max(20, Tl[0] - 23));
    blend(q, 'head', clamp(a, -0.55, 0.6), k);
  }
  function souffle(p) {                                   // petit souffle blanc devant la bouche (soupir), dessin brut gardé
    if (SIL() || !(p.soupir > 0.3)) return;
    const c = cx_(), u = ((p.t || 0) * 0.8) % 1, a = 0.5 * Math.sin(PI * u) * clamp((p.soupir - 0.3) / 0.4);
    c.save(); c.globalAlpha = a;
    for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(42 + u * 40 + i * 9, -20 + u * 12 - i * 3, 6 + u * 8, 4 + u * 5, 0, 0, TAU); c.fillStyle = '#f4f1ea'; c.fill(); }
    c.restore();
  }

  // =====================================================================
  // LEONARDO DE PISE (jeune, glabre, coupe au bol, cotte bleu ardoise)
  // =====================================================================
  const LE = { peau: '#e3c29d', peauD: '#c8a07c', cotte: '#3f5566', cotteD: '#33475a', col: '#ece2c8', cuir: '#6b4a2b', chausse: '#a5793a', chausseD: '#8a6430', soulier: '#4a2e1c', cheveux: '#4a3121', bonnet: '#5f6b45' };
  const LE_TORSO = [[-14, -176], [8, -180], [16, -168], [26, -150], [32, -112], [33, -60], [33, -12], [39, 40], [46, 104, 1], [-44, 106, 1], [-40, 40], [-36, -12], [-36, -60], [-36, -110], [-33, -150], [-26, -168]];
  const BOL = [[30, -64], [34, -72], [32, -84], [22, -97], [2, -104], [-18, -101], [-33, -89], [-38, -70], [-38, -48], [-34, -40, 1], [-22, -44], [-10, -52], [0, -57], [10, -60], [20, -62]];
  function mkLeonardo() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: LE_TORSO, base: LE.cotte, seed: 9001, paint: () => {
        fillPts([[-18, -182], [10, -184], [19, -170], [12, -160], [-6, -157], [-22, -164]], LE.col);               // col rond ivoire
        strokePts([[-20, -162], [-4, -156], [14, -160]], 'rgba(120,100,70,0.5)', 1.1);
        for (const x of [-22, -8, 8, 22]) strokePts([[x * 0.9, 0], [x * 1.1, 100]], 'rgba(20,30,40,0.35)', 1.2);  // plis de la cotte
        fillPts([[-40, -18, 1], [36, -18, 1], [36, -6, 1], [-40, -6, 1]], LE.cuir);                              // ceinture
        fillPts([[20, -20, 1], [30, -20, 1], [30, -4, 1], [20, -4, 1]], _.LAITON); dot(25, -12, 2, '#5a4520');
        strokePts([[-44, 100], [46, 98]], 'rgba(230,220,190,0.35)', 1.6);                                     // ourlet
        hatch([[-50, -170], [-12, -170], [-10, 106], [-50, 106]], 0.75, 4.2, 0.3, 1.05, '10,20,30');
        shade(36, 0, -40, 0, 0.28);
      } },
      bourseC: { parent: 'torso', at: [4, -8], noRivet: true, base: '#7a5530', seed: 9002,
        pts: [[-4, 0], [4, 0], [12, 14], [14, 30], [8, 40, 1], [-8, 40, 1], [-14, 30], [-12, 14]], paint: () => { strokePts([[-6, 6], [6, 6]], '#3a2414', 1.6); hatch(null, 0.8, 3.4, 0.25); } },
      ecritoire: { parent: 'torso', at: [24, -8], noRivet: true, base: '#5a3a22', seed: 9003,
        pts: [[-2, 0], [2, 0], [3, 10], [7, 12], [7, 70], [3, 74, 1], [-5, 74, 1], [-7, 70], [-7, 12], [-3, 10]],
        paint: () => { fillPts([[-7, 54], [7, 54], [6, 74], [-5, 74]], '#2a2420'); strokePts([[-5, 16], [-5, 50]], 'rgba(255,220,170,0.35)', 1.2); strokePts([[-1, 0], [0, 10]], '#3a2414', 1.4); } },
      legB: legDef([-6, -2], LE.chausseD, '#3a2416', 9004, true),
      legF: legDef([6, -2], LE.chausse, LE.soulier, 9005, false),
      armB_up: upDef([-10, -146], LE.cotteD, 9006),
      armB_lo: foreDef('armB_up', LE.cotteD, LE.peauD, true, 9007, '#2b3c4c'),
      head: { parent: 'torso', at: [6, -170], pts: X.NAP_HEAD, base: LE.peau, seed: 9008, noRivet: true, paint: (p) => {
        const f = p.face || {};
        X.earPaint(-8, -42);
        hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.22);
        dot(15, -32, 8, 'rgba(210,130,110,0.18)');
        strokePts([[28, -18], [24, -14]], 'rgba(120,70,50,0.35)', 1);                                         // menton fin
        X.eye(f, 17, -52); X.brow(f, 17, -60, 'rgba(60,38,26,0.95)', 2.2); X.mouth(f, 27, -27);
      } },
      cheveux: { parent: 'head', at: [0, 0], noRivet: true, base: LE.cheveux, seed: 9009, pts: BOL, paint: () => {
        for (let i = 0; i < 13; i++) { const a = PI * (0.98 + i * 0.075); strokePts([[-2 + Math.cos(a) * 8, -96 + Math.sin(a) * 4], [-2 + Math.cos(a) * 40, -70 + Math.sin(a) * 36]], 'rgba(150,108,72,0.55)', 1.5); }   // mèches depuis le sommet
        for (let x = -30; x <= 28; x += 5) { const y = x > 0 ? -62 + (28 - x) * 0.05 : -48 - (x + 34) * 0.3; strokePts([[x, y - 12], [x + 1, y - 1]], 'rgba(20,10,6,0.45)', 1.1); }   // frange coupée net
        strokePts([[28, -63], [-4, -56], [-34, -41]], 'rgba(20,10,6,0.6)', 1.6);
        strokePts(qbez([-24, -94], [2, -104], [22, -94], 8), 'rgba(200,160,120,0.45)', 2.2);                       // reflet
      } },
      bonnet: { parent: 'head', at: [0, 0], noRivet: true, base: LE.bonnet, seed: 9010,
        pts: (p) => (p.bonnet ? [[22, -92], [14, -104], [-4, -112], [-24, -108], [-38, -94], [-40, -82], [-20, -86], [4, -90]] : _.OFFP),
        paint: () => { strokePts([[-38, -86], [-18, -89], [20, -93]], 'rgba(30,40,20,0.6)', 2); dot(-8, -111, 3, '#4b5536'); hatch(null, 0.7, 3.4, 0.25); } },
      souffle: { parent: 'head', at: [0, 0], noRivet: true, base: '#000', seed: 9011, pts: _.OFFP, extra: souffle },
      armF_up: upDef([-2, -146], LE.cotte, 9012),
      armF_lo: foreDef('armF_up', LE.cotte, LE.peau, false, 9013, LE.cotteD),
    };
    Object.assign(parts, heldParts(LE.peau, 9020));
    return { hipY: -238, parts, handLen: 96, rod: { part: 'torso', at: [-26, 18] }, order: ORDER([], ['cheveux', 'bonnet', 'souffle'], ['bourseC', 'ecritoire']).filter((n) => parts[n]) };
  }
  CH.fibLeonardo = mkLeonardo();

  // gestes communs aux deux marionnettes (valeurs 0..1) ; x, y, s, dir servent aux cibles écran
  function gestes(def, q, x, y, s, dir, robe) {
    const A = q.ang, t = q.t || 0, f = q.face, K = (v) => ease(clamp(v === true ? 1 : v || 0));
    const loc = (P) => (P && x != null ? toTorse(def, q, x, y, s, dir, P) : null);
    if (q.marche) marche(q, K(q.marche), !robe);
    if (A.armB_up == null) A.armB_up = -0.08;
    const g = {};
    for (const n of ['soupir', 'joie', 'brandir', 'presente', 'compte', 'ecrit', 'regarde', 'surprise', 'lit', 'baille', 'claque', 'mefiance', 'tient', 'atteint']) g[n] = K(q[n]);
    // --- objets d'office
    if (g.presente && !q.tenu) q.tenu = 'livre';
    if (g.brandir && !q.tenu) q.tenu = 'livre';
    if (g.ecrit && !q.tenu) q.tenu = 'plume';
    if (g.lit && !q.tenu) { q.tenu = 'registre'; q.tenuO = Object.assign({ ouvert: 1 }, q.tenuO); }
    if (g.brandir && (q.tenu === 'livre' || q.tenu === 'registre')) q.tenuO = Object.assign({ prise: 'bas' }, q.tenuO);
    if ((g.presente || g.lit) && q.deuxMains == null && (q.tenu === 'livre' || q.tenu === 'registre')) q.deuxMains = Math.max(g.presente, g.lit);
    // --- corps
    if (g.soupir) {
      A.head = (A.head || 0) + 0.36 * g.soupir; q.dy = (q.dy || 0) + 7 * g.soupir; q.tilt = (q.tilt || 0) + 0.03 * g.soupir;
      blend(q, 'armF_up', 0.05, g.soupir); blend(q, 'armF_lo', -0.12, g.soupir); blend(q, 'armB_up', -0.04, g.soupir); blend(q, 'armB_lo', -0.12, g.soupir);
      if (!f.eyes) f.eyes = g.soupir > 0.5 ? 'closed' : 'half'; if (!f.brow) f.brow = 'worry'; if (!f.mouth) f.mouth = 'o';
    }
    if (g.mefiance) {
      q.tilt = (q.tilt || 0) - 0.08 * g.mefiance; A.head = (A.head || 0) + 0.06 * g.mefiance;
      armTo(q, 'armF', [112, -118], 'bas', g.mefiance); armTo(q, 'armB', [96, -96], 'bas', g.mefiance);
      if (g.mefiance > 0.3) { q.handF = q.handF || 'open'; q.handB = q.handB || 'open'; }
      if (!f.brow) f.brow = 'frown'; if (!f.eyes) f.eyes = 'half'; if (!f.mouth) f.mouth = 'tight';
    }
    if (g.surprise) {
      q.tilt = (q.tilt || 0) - 0.05 * g.surprise; A.head = (A.head || 0) - 0.12 * g.surprise;
      blend(q, 'armF_up', -1.6, g.surprise); blend(q, 'armF_lo', -1.1, g.surprise); blend(q, 'armB_up', -1.25, g.surprise); blend(q, 'armB_lo', -1.3, g.surprise);
      if (g.surprise > 0.3) { q.handF = q.handF || 'open'; q.handB = q.handB || 'open'; }
      if (!f.eyes) f.eyes = 'wide'; if (!f.brow) f.brow = 'up'; if (!f.mouth) f.mouth = 'o';
    }
    if (g.joie) {
      blend(q, 'armF_up', -2.35, g.joie); blend(q, 'armF_lo', -0.35, g.joie); blend(q, 'armB_up', -2.95, g.joie); blend(q, 'armB_lo', -0.25, g.joie);
      A.head = (A.head || 0) - 0.25 * g.joie; q.dy = (q.dy || 0) - Math.abs(Math.sin(t * 6)) * 6 * g.joie * (q.saut === false ? 0 : 1);
      if (g.joie > 0.3) { if (!has(q.tenu)) q.handF = q.handF || 'open'; q.handB = q.handB || 'open'; }
      if (!f.mouth) f.mouth = 'smile'; if (!f.brow) f.brow = 'up';
    }
    if (g.brandir) {
      blend(q, 'armF_up', -2.62, g.brandir); blend(q, 'armF_lo', -0.22, g.brandir); blend(q, 'armB_up', -2.25, g.brandir); blend(q, 'armB_lo', -0.3, g.brandir);
      A.head = (A.head || 0) - 0.3 * g.brandir; if (g.brandir > 0.3) q.handB = q.handB || 'open';
      if (!f.mouth) f.mouth = 'smile'; if (!f.brow) f.brow = 'up';
    }
    if (g.presente) {
      const u = clamp((q.tenuO && q.tenuO.ouvert) || 0);
      armTo(q, 'armF', [lerp(150, 176, u), lerp(-96, -66, u)], 'bas', g.presente);
      A.head = (A.head || 0) + 0.04 * g.presente; if (!f.mouth) f.mouth = 'smile';
    }
    if (g.lit) {
      armTo(q, 'armF', [150, -62], 'bas', g.lit); A.head = (A.head || 0) + 0.3 * g.lit;
      if (!f.eyes) f.eyes = 'half';
    }
    if (g.tient && !g.lit && !g.presente) {
      const T = q.tenu === 'balance' ? [104, -150] : (q.tenu === 'registre' || q.tenu === 'livre') ? [118, -84] : [84, -70];
      armTo(q, 'armF', T, 'bas', g.tient);
    }
    if (g.baille) {
      A.head = (A.head || 0) - 0.16 * g.baille; armTo(q, 'armF', [74, -192], 'bas', g.baille);
      if (g.baille > 0.3) q.handF = q.handF || 'open';
      if (!f.eyes) f.eyes = g.baille > 0.5 ? 'closed' : 'half'; q._baille = g.baille;
    }
    let Tc = loc(q.cible);
    if (g.compte) {
      const T = (Tc || [126, -36]).slice(), push = robe ? Math.sin(t * 3.2) * 12 : 0;
      T[0] += push; T[1] -= Math.abs(Math.sin(t * (robe ? 3.2 : 6.5))) * 9;
      armTo(q, 'armF', T, 'bas', g.compte); if (!has(q.tenu)) q.handF = q.handF || 'open';
      armTo(q, 'armB', loc(q.cibleB) || [66, -22], 'bas', g.compte * 0.9);
      regarde(q, Tc || [126, -36], g.compte);
      if (!f.mouth) f.mouth = 'tight';
    }
    if (g.claque) {
      const T = (Tc || [140, -20]).slice(), k = g.claque; T[1] -= 120 * (1 - k); T[0] -= 20 * (1 - k);
      armTo(q, 'armF', T, 'bas', Math.min(1, k * 3)); q.handF = q.handF || 'open';
      A.head = (A.head || 0) + 0.22 * Math.min(1, k * 2); if (!f.brow) f.brow = 'frown'; if (!f.mouth) f.mouth = 'tight';
    }
    if (g.ecrit) {
      const T = (Tc || [150, -60]).slice();
      T[0] += Math.sin(t * 16) * 3; T[1] += Math.cos(t * 11) * 2;
      const d = decalObjet(q, 'pointe'); T[0] -= d[0]; T[1] -= d[1];
      armTo(q, 'armF', T, 'bas', g.ecrit);
      armTo(q, 'armB', loc(q.cibleB) || [70, -40], 'bas', g.ecrit * 0.9);
      if (!q.cibleB && g.ecrit > 0.3) q.handB = q.handB || 'open';
      regarde(q, Tc || [150, -60], g.ecrit); if (!f.mouth) f.mouth = 'tight';
    }
    if (g.atteint && Tc) {
      const T = Tc.slice(); if (q.ptCible) { const d = decalObjet(q, q.ptCible); T[0] -= d[0]; T[1] -= d[1]; }
      armTo(q, q.bras === 'B' ? 'armB' : 'armF', T, q.pick || 'bas', g.atteint);
    }
    if (g.regarde) regarde(q, Tc, g.regarde);
  }
  FIB.leonardoPose = function (p, x, y, s, dir) {
    const q = prep(p); gestes(CH.fibLeonardo, q, x, y, s == null ? 0.9 : s, dir || 1, false); return finish(q);
  };
  FIB.leonardo = (pose, x, y, s, o) => { s = s == null ? 0.9 : s; o = o || {}; return run(CH.fibLeonardo, FIB.leonardoPose(pose, x, y, s, o.dir || 1), x, y, s, o); };

  // =====================================================================
  // LE MARCHAND — robe longue (pas de jambes), 5 tenues de couleur entière différente
  // =====================================================================
  const TENUES = {
    pere:       { robe: '#6b4a2e', robeD: '#573b23', cuff: '#e6dcc4', peau: '#d9b48e', cheveux: '#9a958c', carrure: 1.0, tete: 'NAP' },
    pisan:      { robe: '#5d6b48', robeD: '#4a5739', cuff: '#4a5739', peau: '#e2b996', cheveux: '#6a4a30', carrure: 1.12, tete: 'GR', coiffe: '#8b2a22' },
    pisan2:     { robe: '#24324a', robeD: '#1b2639', cuff: '#b08a3e', peau: '#dcb48c', cheveux: '#4a3121', carrure: 1.0, tete: 'GR', coiffe: '#b08a3e' },
    florentin:  { robe: '#5e1f2a', robeD: '#4a1820', cuff: '#9a8466', peau: '#e0bc98', cheveux: '#b9b2a6', carrure: 1.18, tete: 'NAP', coiffe: '#1f1c1d', fourrure: '#9a8466' },
    florentin2: { robe: '#5f6872', robeD: '#4c545d', cuff: '#4c545d', peau: '#d6b08a', cheveux: '#8e8a84', carrure: 0.78, tete: 'AR', coiffe: '#5a3d26', tablier: '#4f6b3a', voute: 1 },
  };
  FIB.TENUES = TENUES;
  const ROBE = [[-14, -176], [8, -180], [16, -168], [32, -150], [44, -118], [56, -74], [62, -34], [60, 8], [54, 60], [54, 130], [58, 196], [62, 228, 1], [-58, 230, 1], [-54, 180], [-50, 100], [-48, 20], [-48, -60], [-44, -110], [-38, -146], [-27, -166]];
  const robePts = (c) => ROBE.map((p) => { const k = Math.abs(p[0]) > 16 ? c : 1, o = [p[0] * k, p[1]]; if (p[2]) o.push(1); return o; });
  const SOULIERS = [[-30, 224], [24, 222], [52, 226], [76, 234, 1], [70, 238, 1], [-34, 238, 1]];
  function coiffePts(tn) {
    switch (tn) {
      case 'pere': return [[31, -66], [30, -84], [20, -98], [0, -106], [-22, -102], [-38, -86], [-42, -62], [-40, -36], [-30, -18], [-16, -12], [-10, -26], [-6, -44], [6, -60], [20, -66]];
      case 'pisan': return [[36, -72], [36, -88], [24, -106], [2, -116], [-22, -114], [-42, -100], [-48, -78], [-42, -58], [-24, -60], [-4, -66], [18, -70]];
      case 'pisan2': return [[30, -76], [32, -98, 1], [26, -104, 1], [-32, -106, 1], [-42, -98, 1], [-42, -74], [-30, -68], [0, -72]];
      case 'florentin': return [[30, -76], [30, -96], [18, -116], [-6, -124], [-30, -116], [-44, -96], [-46, -72], [-32, -64], [-6, -70]];
      default: return [[22, -86], [10, -98], [-12, -102], [-30, -94], [-38, -80], [-22, -80], [2, -84]];
    }
  }
  function mkMarchand(tn) {
    const T = TENUES[tn], HEAD = X[T.tete + '_HEAD'];
    const car = (p) => (p.carrure == null ? T.carrure : p.carrure);
    const parts = {
      souliers: { parent: 'torso', at: [0, 0], noRivet: true, base: '#3a2416', seed: 9101, pts: SOULIERS, paint: () => strokePts([[30, 228], [60, 233]], 'rgba(255,230,190,0.3)', 1.2) },
      cornette: { parent: 'head', at: [-40, -76], noRivet: true, base: T.coiffe || '#000', seed: 9102,
        pts: (p) => { if (tn !== 'pisan') return _.OFFP; const sw = 8 * Math.sin((p.t || 0) * 2.2); return ribbon([[0, 0], [-12, 50], [-18 + sw * 0.5, 130], [-14 + sw, 210]], 26, 18); },
        paint: () => { strokePts([[-4, 10], [-14, 120], [-12, 200]], 'rgba(20,5,5,0.4)', 1.4); hatch(null, 0.5, 3.6, 0.25); } },
      torso: { parent: null, at: [0, 0], pts: (p) => robePts(car(p)), base: T.robe, seed: 9103, paint: (p) => {
        const c = car(p);
        for (const x of [-30, -14, 4, 22, 38]) strokePts([[x * c * 0.8, 10], [x * c * 1.05, 224]], 'rgba(10,10,10,0.28)', 1.2);     // plis
        if (tn === 'florentin') {                                                                                          // fourrure, chaîne d'or
          fillPts([[-18, -184], [12, -186], [24, -170], [14, -150], [-6, -150], [-26, -160]], T.fourrure);
          fillPts([[30 * c, -150], [44 * c, -120], [56 * c, -40], [52 * c, 40], [50 * c, 140], [58 * c, 232], [38 * c, 232], [34 * c, 140], [36 * c, 40], [40 * c, -40], [30 * c, -120], [20, -150]], T.fourrure);
          fillPts([[-60 * c, 212], [60 * c, 212], [60 * c, 236], [-60 * c, 236]], T.fourrure);
          for (let i = 0; i < 40; i++) strokePts([[(-56 + i * 3) * c, 214], [(-55 + i * 3) * c, 222]], 'rgba(60,45,30,0.4)', 0.8);
          for (let i = 0; i < 11; i++) { const a = PI * (0.12 + i * 0.07), px = 2 + Math.cos(a) * 46 * c, py = -150 + Math.sin(a) * 70; dot(px, py, 3.4, '#d9bd72'); dot(px, py, 1.6, '#76592a'); }
          _.disque(30 * c, -78, 8, '#d9bd72', '#76592a');
        } else if (tn === 'pere') {
          fillPts([[-18, -184], [12, -186], [22, -170], [10, -158], [-8, -156], [-24, -164]], '#e6dcc4');
          fillPts([[-46 * c, -20, 1], [52 * c, -20, 1], [52 * c, -8, 1], [-46 * c, -8, 1]], '#3a2a1a');
          fillPts([[34 * c, -8], [44 * c, -8], [46 * c, 20], [32 * c, 20]], _.LAITON); dot(39 * c, 12, 3, '#76592a');   // sceau à la ceinture
        } else if (tn === 'pisan') {
          fillPts([[-46 * c, -24, 1], [52 * c, -24, 1], [52 * c, -12, 1], [-46 * c, -12, 1]], '#4a2e1c');
          fillPts([[30 * c, -12], [42 * c, -12], [50 * c, 10], [44 * c, 30, 1], [26 * c, 30, 1], [24 * c, 10]], '#7a5530');  // bourse
          strokePts([[30 * c, -6], [44 * c, -6]], '#3a2414', 1.6);
        } else if (tn === 'pisan2') {
          fillPts([[-46 * c, -22, 1], [52 * c, -22, 1], [52 * c, -10, 1], [-46 * c, -10, 1]], '#b08a3e');
          for (const y of [-130, -90, -50]) dot(34 * c, y, 3, '#b08a3e');
        } else {                                                                                                           // tablier vert de comptoir
          fillPts([[-6, -30], [44 * c, -30], [52 * c, 120], [56 * c, 200, 1], [6 * c, 204, 1], [-4, 120]], T.tablier);
          strokePts([[-40 * c, -30], [44 * c, -30]], '#3a4a2a', 3); hatch([[-6, -30], [56 * c, -30], [56 * c, 204], [-6, 204]], 0.3, 5, 0.18);
          fillPts([[-18, -184], [12, -186], [20, -170], [10, -160], [-8, -158], [-24, -166]], '#cfc8b6');
        }
        hatch([[-70, -170], [-12, -170], [-10, 236], [-70, 236]], 0.75, 4.2, 0.3, 1.05, '10,10,10');
        shade(46 * c, 0, -46 * c, 0, 0.3, [-80, -200, 80, 240]);
      } },
      armB_up: upDef([-10, -146], T.robeD, 9104, 17),
      armB_lo: foreDef('armB_up', T.robeD, M.mixc(T.peau, '#000000', 0.12), true, 9105, T.cuff, tn === 'florentin' ? 17 : 15),
      head: { parent: 'torso', at: [6, -170], pts: HEAD, base: T.peau, seed: 9106, noRivet: true, paint: (p) => {
        const f = p.face || {};
        if (tn !== 'pere') fillPts([[-42, -78], [-16, -76], [-12, -60], [-18, -44], [-24, -30], [-42, -26]], T.cheveux);
        X.earPaint(-8, -44);
        hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.3);
        strokePts([[4, -40], [12, -30], [18, -22]], 'rgba(120,70,50,0.35)', 1.2);                                   // pli de joue (âge)
        if (tn === 'florentin' || tn === 'pisan') { strokePts([[6, 6], [18, 2], [26, -6]], 'rgba(120,70,50,0.45)', 1.4); dot(16, -32, 9, 'rgba(205,110,95,0.25)'); }  // double menton, joues
        if (tn === 'florentin2') { strokePts([[8, -46], [12, -40]], 'rgba(90,50,40,0.4)', 1); strokePts([[-2, -64], [10, -66]], 'rgba(90,50,40,0.35)', 1); }
        const yb = p._baille || 0;
        X.eye(f, 17, -52); X.brow(f, 17, -61, 'rgba(70,50,40,0.95)', tn === 'florentin2' ? 2.8 : 2.4);
        if (yb > 0.35) fillPts(ell(26, -24, 5 + 2 * yb, 6 + 6 * yb, 10), '#3a1714', 0, 0); else X.mouth(f, 27, -27);
        if (tn === 'florentin') {                                                                                           // besicles
          const ring = ell(21, -50, 9, 9, 14);
          fillPts(ring, 'rgba(190,225,240,0.25)', 0, 0); strokePts(ring.concat([ring[0]]), '#4a3420', 2);
          strokePts([[30, -46], [34, -40]], '#4a3420', 2); strokePts([[16, -55], [21, -57]], 'rgba(255,255,255,0.7)', 1.1);
        }
      } },
      barbe: { parent: 'head', at: [0, 0], noRivet: true, base: tn === 'pere' ? '#a9a49a' : '#3a2416', seed: 9107,
        pts: tn === 'pere' ? [[30, -20], [33, -8], [26, 6], [10, 13], [-6, 6], [-12, -10], [-8, -26], [4, -22], [16, -16], [22, -18], [26, -24]]
          : tn === 'pisan2' ? [[30, -33], [36, -30], [35, -26], [26, -27], [18, -25], [14, -28], [20, -33]] : _.OFFP,
        paint: () => { hatch(null, 1.3, 2.6, 0.3); if (tn === 'pere') strokePts([[20, -26], [28, -26]], 'rgba(110,40,38,0.8)', 1.4); } },
      coiffe: { parent: 'head', at: [0, 0], noRivet: true, base: tn === 'pere' ? '#ece6d8' : T.coiffe, seed: 9108, pts: coiffePts(tn), paint: () => {
        if (tn === 'pere') { strokePts([[28, -70], [0, -64], [-14, -46], [-20, -20]], 'rgba(120,110,90,0.5)', 1.2); hatch(null, 0.6, 4, 0.15); }
        else if (tn === 'pisan') { for (let i = 0; i < 4; i++) strokePts(qbez([34 - i * 4, -74 - i * 9], [0, -96 - i * 6], [-44, -82 - i * 6], 8), 'rgba(30,5,5,0.45)', 1.4); hatch(null, 0.7, 3.6, 0.25); }
        else if (tn === 'pisan2') { fillPts([[-42, -80, 1], [32, -82, 1], [32, -76, 1], [-42, -74, 1]], 'rgba(90,60,20,0.6)'); strokePts([[-30, -104], [26, -102]], 'rgba(255,235,180,0.45)', 1.6); hatch(null, 0.5, 4, 0.2); }
        else if (tn === 'florentin') { strokePts(qbez([-30, -112], [-8, -120], [12, -112], 8), 'rgba(255,255,255,0.14)', 2.2); hatch(null, 0.8, 3.4, 0.25); }
        else { strokePts([[-36, -82], [20, -88]], 'rgba(30,15,5,0.5)', 1.6); dot(-6, -101, 3, '#3a2414'); hatch(null, 0.8, 3.4, 0.25); }
      } },
      lien: { parent: 'head', at: [0, 0], noRivet: true, base: '#ece6d8', seed: 9109, pts: tn === 'pere' ? ribbon([[-14, -18], [-2, 0], [14, 12], [24, 10]], 6, 5) : _.OFFP, paint: () => hatch(null, 0.6, 3, 0.15) },
      armF_up: upDef([-2, -146], T.robe, 9110, 17),
      armF_lo: foreDef('armF_up', T.robe, T.peau, false, 9111, T.cuff, tn === 'florentin' ? 17 : 15),
    };
    Object.assign(parts, heldParts(T.peau, 9120));
    return { hipY: -238, parts, handLen: 96, rod: { part: 'torso', at: [-26, 18] }, libre: { legF: 1, legB: 1 }, tenue: tn,
      order: ORDER(['souliers', 'cornette'], ['barbe', 'lien', 'coiffe'], []).filter((n) => parts[n]) };
  }
  for (const tn of Object.keys(TENUES)) CH['fibMarchand_' + tn] = mkMarchand(tn);
  FIB.marchandDef = (tenue) => CH['fibMarchand_' + (TENUES[tenue] ? tenue : 'pisan')];
  FIB.marchandPose = function (p, x, y, s, dir) {
    const q = prep(p), tn = TENUES[q.tenue] ? q.tenue : 'pisan', T = TENUES[tn], def = CH['fibMarchand_' + tn];
    const v = q.voute == null ? (T.voute || 0) : q.voute;
    if (v) { q.tilt = (q.tilt || 0) + 0.05 * v; q.ang.head = (q.ang.head || 0) + 0.16 * v; }
    gestes(def, q, x, y, s == null ? 0.9 : s, dir || 1, true); return finish(q);
  };
  FIB.marchand = (pose, x, y, s, o) => {
    s = s == null ? 0.9 : s; o = o || {};
    const def = FIB.marchandDef(pose && pose.tenue);
    return run(def, FIB.marchandPose(pose, x, y, s, o.dir || 1), x, y, s, o);
  };
})();

// ===================================================================== LES LAPINS (8 pelages + le vieux) — sans tige, def.libre (animal)
(function () {
  'use strict';
  const FIB = M.FIB, _ = FIB._;
  const { TAU, PI, ep, ell, ribbon, qbez, pc } = _;
  const { fillPts, strokePts, dot, hatch, shade, lerp, clamp, ease, smooth, hash } = M;
  const cx_ = () => M.ctx();
  // pelage : [fond, sombre, ventre, intérieur d'oreille, taches (pie)]
  const PELAGES = {
    a: ['#7b5a3e', '#5c4230', '#cdb592', '#c99a8a'],          // brun de garenne
    b: ['#8d8a83', '#6a6862', '#d3cec4', '#c9a39a'],          // gris
    c: ['#ece6d8', '#c9bfac', '#f7f3ea', '#e2a8a0'],          // blanc
    d: ['#b4612c', '#8c4820', '#e4c39c', '#d39a86'],          // roux
    e: ['#2f2a28', '#1b1817', '#5e5650', '#8a6a66'],          // noir
    f: ['#c99f5c', '#a37f45', '#eedcb4', '#dcae94'],          // fauve
    g: ['#ede8dc', '#c9c1b0', '#f7f3ea', '#e2a8a0', '#2a2624'],  // pie noir et blanc
    h: ['#6f8092', '#55657a', '#c3cad4', '#b9a0a8'],          // gris bleuté
  };
  FIB.PELAGES = PELAGES;
  const OREILLE = (L, w) => [[-w * 0.5, 0], [-w * 0.62, -L * 0.35], [-w * 0.45, -L * 0.8], [0, -L, 1], [w * 0.5, -L * 0.82], [w * 0.62, -L * 0.4], [w * 0.5, 0]];

  // dessin du lapin dans son repère : origine au sol sous le corps, regard vers +x ; o : couleur, pose, phase, oreilles, vieux, t, seed
  function drawLapin(o) {
    const c = cx_(), pg = PELAGES[o.couleur] || PELAGES.a, t = o.t || 0, sd = (o.seed || 0) * 13.7;
    const pose = o.pose || (o.vieux ? 'dresse' : 'assis'), vieux = !!o.vieux;
    let oreil = o.oreilles == null ? (pose === 'couche' ? 0.15 : 1) : clamp(o.oreilles);
    const ph = clamp(o.phase || 0);
    // paramètres de corps selon la pose
    let rot = 0, sx = 1, sy = 1, lift = 0, headRot = 0, headDx = 0, headDy = 0, frontA = 0, hindA = 0, pivot = [-30, 0];
    if (pose === 'bond') { rot = lerp(-0.42, 0.34, ph); sx = 1.14; sy = 0.86; lift = -Math.sin(PI * ph) * 66; headRot = -rot * 0.6; frontA = lerp(-0.7, 0.9, ph); hindA = lerp(0.9, -0.3, ph); pivot = [0, -30]; }
    else if (pose === 'dresse') { rot = -0.62; pivot = [-40, 0]; hindA = 0.62; headRot = 0.5; frontA = 0.85; }
    else if (pose === 'couche') { sx = 1.12; sy = 0.62; headDy = 26; headDx = 4; }
    else if (pose === 'grignote') { headRot = 0.42 + 0.04 * Math.sin(t * 15 + sd); headDy = 8; }
    if (vieux && pose !== 'bond' && pose !== 'couche') frontA -= 0.75;                                   // la patte avant tient la canne
    const nez = Math.sin(t * 11 + sd) * 0.6;
    c.save(); c.translate(0, lift);
    c.translate(pivot[0], pivot[1]); c.rotate(rot); c.translate(-pivot[0], -pivot[1]);
    // oreille arrière, patte arrière lointaine
    const head = new DOMMatrix().translate(26 + headDx, -84 + headDy).rotate((headRot - (pose === 'bond' ? 0 : 0)) * 180 / PI);
    const earA = vieux ? -2.25 : lerp(-1.25, -0.28, oreil), wig = 0.05 * Math.sin(t * 2.3 + sd);
    c.save(); c.setTransform(c.getTransform().multiply(head)); c.translate(-6, -22); c.rotate(earA - 0.16 + wig);
    pc(OREILLE(52, 17), pg[1], null, 9301 + sd);
    c.restore();
    // corps
    c.save(); c.scale(sx, sy);
    const corps = [[-56, -6], [-62, -34], [-56, -62], [-36, -86], [-8, -98], [14, -96], [30, -84], [36, -60], [32, -30], [24, -6], [6, 0, 1], [-48, 0, 1]];
    pc(corps, pg[0], () => {
      fillPts([[8, -66], [30, -78], [36, -56], [30, -24], [20, -6], [4, -10], [6, -40]], pg[2]);              // poitrail / ventre clair
      if (pg[4]) { fillPts(ell(-26, -60, 22, 18, 12), pg[4], 3); fillPts(ell(-48, -24, 12, 14, 10), pg[4], 5); }
      fillPts(ep(-30, -34, 26, 30, 12, PI * 0.9, PI * 2.1), 'rgba(0,0,0,0.10)');                                // cuisse
      strokePts(ep(-30, -34, 26, 30, 12, PI * 1.05, PI * 1.95), 'rgba(0,0,0,0.25)', 1.2);
      hatch(null, 0.9, 3.4, 0.22); shade(30, -90, -50, 0, 0.25, [-70, -110, 50, 10]);
    }, 9302 + sd);
    c.restore();
    // queue (pompon blanc)
    pc(ell(-60 * sx, -40 * sy, 11, 10, 10), pg === PELAGES.e ? '#d9d2c4' : '#f4f0e6', () => hatch(null, 0.6, 3, 0.15), 9303 + sd);
    // patte arrière (long pied au sol)
    c.save(); c.translate(-26 * sx, -12 * sy); c.rotate(hindA);
    pc([[-28, -6], [4, -10], [40, -4], [46, 4, 1], [-26, 8, 1]], pg[1], () => { strokePts([[-20, 2], [40, 2]], 'rgba(255,255,255,0.18)', 1.2); }, 9304 + sd);
    c.restore();
    // patte avant
    c.save(); c.translate(24 * sx, -34 * sy); c.rotate(frontA);
    if (pose !== 'couche') pc([[-6, -6], [7, -6], [8, 26], [14, 32, 1], [-4, 34, 1], [-6, 20]], pg[2], () => strokePts([[0, 30], [10, 30]], 'rgba(0,0,0,0.25)', 1), 9305 + sd);
    c.restore();
    // tête
    c.save(); c.setTransform(c.getTransform().multiply(head));
    pc([[-14, -6], [-10, -26], [6, -34], [26, -30], [40, -18], [46, -6], [42, 4], [28, 12], [8, 14], [-8, 8]], pg[0], () => {
      fillPts([[30, -6], [46, -6], [42, 4], [28, 10], [20, 4]], pg[2]);                                       // museau clair
      if (pg[4]) fillPts(ell(4, -18, 12, 12, 10), pg[4], 7);
      strokePts([[-6, -18], [-2, 0]], 'rgba(0,0,0,0.18)', 1.2);
      hatch(null, 0.8, 3.2, 0.18);
    }, 9306 + sd);
    // œil rond vif
    const oy = -14;
    fillPts(ell(22, oy, 6.2, 6.2, 12), pg === PELAGES.e ? '#6a5a50' : '#1e1612', 0, 0);
    if (pg === PELAGES.e) fillPts(ell(22, oy, 4.6, 4.6, 10), '#140f0c', 0, 0);
    dot(20, oy - 2.4, 1.9, 'rgba(255,255,255,0.95)');
    // nez qui remue, moustaches
    fillPts([[44, -6 + nez], [47, -4 + nez], [44, -1 + nez]], '#c97a78', 0, 0);
    for (const [a, b] of [[-6, 0.5], [-2, -0.6], [2, 1]]) strokePts([[42, -2 + a * 0.3], [62, -4 + a + b * 2 + nez]], 'rgba(250,245,235,0.6)', 0.8);
    if (pose === 'grignote') {                                                                                  // brin de trèfle
      const m = Math.sin(t * 15 + sd) * 1.5;
      strokePts([[40, 6 + m], [52, 16]], '#4a6a32', 1.6);
      for (const [lx, ly] of [[50, 16 + m], [56, 13 + m], [54, 21 + m]]) fillPts(ell(lx, ly, 5, 4, 8), '#5a7d3a', 0, 0);
    }
    if (vieux) {                                                                                                 // barbe blanche, sourcil broussailleux
      pc([[26, 4], [44, 0], [50, 12], [42, 40], [32, 60, 1], [22, 38], [10, 16]], '#f6f3ec', () => { for (let i = 0; i < 6; i++) strokePts([[20 + i * 4, 8], [24 + i * 2.4, 46 - i * 3]], 'rgba(150,140,120,0.5)', 0.9); }, 9307 + sd);
      pc([[14, -24], [28, -26], [34, -20], [24, -19]], '#f2eee6', null, 9308 + sd, { drop: false });
    }
    // oreille avant
    c.save(); c.translate(-2, -26); c.rotate(earA + wig * 1.3);
    pc(OREILLE(56, 18), pg[0], () => { fillPts(OREILLE(44, 8).map((p) => [p[0], p[1] - 4]), pg[3]); hatch(null, 0.5, 3, 0.15); }, 9309 + sd);
    c.restore();
    c.restore();
    c.restore();
    // canne du vieux (tenue par la patte avant)
    if (vieux && pose !== 'bond' && pose !== 'couche') {
      const m = new DOMMatrix().translate(0, lift).translate(pivot[0], pivot[1]).rotate(rot * 180 / PI).translate(-pivot[0], -pivot[1]).translate(24 * sx, -34 * sy).rotate(frontA * 180 / PI);
      const hand = _.mp(m, [4, 30]);
      pc(ribbon([[hand[0] + 2, hand[1] - 14], [hand[0] + 16, -1]], 5, 4), '#6b4526', null, 9310 + sd);
      pc(ribbon(qbez([hand[0] + 2, hand[1] - 14], [hand[0] - 4, hand[1] - 28], [hand[0] - 14, hand[1] - 18], 6), 5, 5), '#6b4526', null, 9311 + sd);
      pc(ell(hand[0] + 2, hand[1] - 4, 7, 6, 8), (PELAGES[o.couleur] || PELAGES.a)[2], null, 9312 + sd);
    }
  }
  const LAPIN_DEF = { hipY: 0, handLen: 10, rod: null, libre: { armF: 1, armB: 1, legF: 1, legB: 1 },
    parts: { o: { parent: null, at: [0, 0], pts: _.OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => drawLapin(p.o) } }, order: ['o'] };
  M.chars.fibLapin = LAPIN_DEF;
  // FIB.lapin(x, y, s, o) — (x,y) = sol sous le lapin ; o.dir ±1, o.cast, o.ombre (ombre au sol, défaut true), o.alpha, o.rot
  FIB.lapin = function (x, y, s, o) {
    o = o || {}; s = s == null ? 1 : s;
    return M.puppet(LAPIN_DEF, { o, tilt: o.rot || 0 }, x, y, s, { dir: o.dir || 1, rod: false, slot: y + 2 * s, floorShadow: o.ombre !== false, cast: o.cast, alpha: o.alpha, nom: 'lapin' });
  };
  // gambade : phase de bond et hauteur pour un lapin qui traverse (u = temps local en s, per = durée d'un bond)
  FIB.bondPhase = (t, per) => ((t / (per || 0.45)) % 1 + 1) % 1;
})();

// ===================================================================== DÉCOR : cabinet de Leonardo à Pise (P3, P4, P6)
// FIB.cabinet(t, up, o) → M.drawFloor() → FIB.cabinetSol(t, o) → marionnettes (lapins de l'enclos compris) → FIB.enclosAvant(t, o)
(function () {
  'use strict';
  const FIB = M.FIB, _ = FIB._;
  const { TAU, PI, ep, ell, rect, ribbon, qbez, onde, disque } = _;
  // décor : angles vifs par défaut (meubles, planches, toits) ; o.doux = contour lissé (animaux, sacs, feuilles)
  const pc = (pts, base, paint, seed, o) => M.piece(o && o.doux ? pts : pts.map((p) => [p[0], p[1], 1]), base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));
  const { fillPts, strokePts, dot, hatch, shade, lerp, clamp, ease, easeOut, smooth, hash, wob } = M;
  const W = M.W, BACK = M.ST.back;
  const cx_ = () => M.ctx();
  const K = {};
  FIB.K = K;
  const CAB = {
    fenetre: { x0: 150, x1: 490, y0: 390, appui: 930, baies: [[172, 308], [332, 468]], ressaut: 500 },
    volet: { x0: 494, x1: 624, y0: 440, y1: 924 },
    pigeon: [430, 928],
    pupitre: { x0: 196, x1: 384, haut: [204, 1040], bas: [378, 1098], ecrit: [300, 1066], feuille: [[236, 1046], [356, 1086]] },
    table: { x0: 556, x1: 904, dessus: 1170 },
    chandelle: { x: 590, y: 1170, flamme: [590, 1086] },
    abaque: { x: 700, y: 1170, s: 0.6 },
    balance: { x: 852, y: 1170, s: 0.6 },
    pieces: [[790, 1170, 6], [818, 1170, 3], [892, 1170, 4]],
    coffre: { x0: 905, x1: 1015, dessus: 1285 },
    sablier: { x: 960, y: 1285 },
    etagere: { x0: 690, x1: 964, rayons: [560, 700, 840] },
    astrolabe: { x: 622, y: 560 },
    trappe: { x0: 520, x1: 900, y: BACK },
    tapis: { x0: 280, x1: 730, y0: 1402, y1: 1446 },
    tabouret: { x: 178, assise: 1352 },
  };
  FIB.CAB = CAB;
  // enclos : planches qui montent de la trappe ; places des lapins (enclos levé), du FOND vers l'AVANT (dessiner dans cet ordre)
  const EN = { x0: 520, x1: 900, hFond: 140, hAvant: 84, H: 160 };
  EN.places = [
    { x: 650, y: 1262, s: 0.66, dir: 1 }, { x: 760, y: 1258, s: 0.66, dir: -1 }, { x: 706, y: 1270, s: 0.68, dir: 1 },
    { x: 590, y: 1302, s: 0.7, dir: 1 }, { x: 680, y: 1300, s: 0.7, dir: -1 }, { x: 770, y: 1304, s: 0.7, dir: 1 }, { x: 850, y: 1298, s: 0.7, dir: -1 },
    { x: 562, y: 1346, s: 0.74, dir: 1 }, { x: 640, y: 1344, s: 0.74, dir: -1 }, { x: 720, y: 1348, s: 0.74, dir: 1 }, { x: 800, y: 1344, s: 0.74, dir: -1 }, { x: 868, y: 1348, s: 0.74, dir: -1 },
    { x: 590, y: 1392, s: 0.78, dir: 1 }, { x: 680, y: 1392, s: 0.78, dir: -1 }, { x: 770, y: 1392, s: 0.78, dir: 1 }, { x: 850, y: 1392, s: 0.78, dir: -1 },
  ];
  EN.ordre = [12, 13, 14, 15, 7, 8, 9, 10, 11, 3, 4, 5, 6, 0, 1, 2];   // ordre de remplissage : rang de devant d'abord
  FIB.ENCLOS = EN;
  const enclosK = (o) => { const e = clamp((o && o.enclos) || 0); return e; };
  const enclosDy = (t, o) => { const e = enclosK(o); if (e <= 0) return null; return (1 - easeOut(e)) * (EN.H + 20) + (e >= 1 && o.enclosT != null ? wob(t, o.enclosT, -10, 2.6, 5.5) : 0); };
  // places des lapins à l'instant t (suivent l'enclos qui monte) : FIB.enclosPlaces(t, o)
  FIB.enclosPlaces = (t, o) => { const dy = enclosDy(t, o); return dy == null ? [] : EN.places.map((p) => Object.assign({}, p, { y: p.y + dy })); };

  function lay(x0, y0, x1, y1, fn) { const cv = M.pre(x1 - x0, y1 - y0, (c) => { c.translate(-x0, -y0); fn(c); }); cv.x0 = x0; cv.y0 = y0; return cv; }
  function ombre(cv, blur) { cv.sh = M.pre(cv.width + 40, cv.height + 40, (x) => { x.filter = `brightness(0) blur(${blur || 8}px)`; x.drawImage(cv, 20, 20); }); return cv; }
  function put(cv, sh, al, dy) {
    const c = cx_(); c.save(); if (al != null) c.globalAlpha = al; dy = dy || 0;
    if (sh && cv.sh) { const a0 = c.globalAlpha; c.globalAlpha = a0 * sh; c.drawImage(cv.sh, cv.x0 - 20 + 14, cv.y0 - 20 + 7 + dy); c.globalAlpha = a0; }
    c.drawImage(cv, cv.x0, cv.y0 + dy); c.restore();
  }
  function glow(x, y, r, col, a) { if (a <= 0) return; const c = cx_(), gr = c.createRadialGradient(x, y, 1, x, y, r); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = gr; c.fillRect(x - r, y - r, 2 * r, 2 * r); c.restore(); }
  function grad(c, x0, y0, x1, y1, stops) { const g = c.createLinearGradient(x0, y0, x1, y1); stops.forEach(([k, col]) => g.addColorStop(k, col)); return g; }
  function cut(c, pts) { c.save(); c.globalCompositeOperation = 'destination-out'; M.path(pts, 0, 0); c.fillStyle = '#000'; c.fill(); c.restore(); }
  const baie = (x0, x1) => { const cxm = (x0 + x1) / 2, r = (x1 - x0) / 2; return ep(cxm, CAB.fenetre.ressaut, r, r, 14, PI, TAU).concat([[x1, CAB.fenetre.appui, 1], [x0, CAB.fenetre.appui, 1]]); };
  function clipBaies(fn) {
    const c = cx_(); c.save(); c.beginPath();
    for (const [a, b] of CAB.fenetre.baies) { const pts = baie(a, b); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); }
    c.clip(); fn(c); c.restore();
  }
  function planches(x0, y0, x1, y1, w, col, seed) {
    const R = M.rng(seed);
    for (let x = x0; x < x1 - 1; x += w) {
      const xr = Math.min(x1, x + w - 2), top = y0 + (R() - 0.5) * 8;
      pc([[x, top + 3], [x + 4, top], [xr - 4, top + (R() - 0.5) * 4], [xr, top + 4], [xr, y1, 1], [x, y1, 1]], M.mixc(col, '#000000', R() * 0.18), () => {
        for (let k = 0; k < 3; k++) { const xx = x + 4 + R() * (w - 10); strokePts([[xx, top + 10 + R() * 20], [xx + (R() - 0.5) * 5, y1 - R() * 20]], 'rgba(50,30,14,0.3)', 0.9); }
        dot(x + w / 2, top + 14, 2, '#2a2420'); dot(x + w / 2, y1 - 14, 2, '#2a2420');
      }, seed + Math.floor(x));
    }
  }

  // ---------------- pré-rendus
  function makeCiel(soir) {
    const F = CAB.fenetre;
    return lay(F.x0, F.y0, F.x1, F.appui + 4, (c) => {
      c.fillStyle = grad(c, 0, F.y0, 0, 700, soir ? [[0, '#c98a6a'], [0.6, '#e8b27a'], [1, '#f1d6a0']] : [[0, '#8fb0c4'], [0.7, '#cfdde0'], [1, '#ece6d2']]);
      c.fillRect(F.x0, F.y0, F.x1 - F.x0, F.appui - F.y0 + 4);
    });
  }
  function makeVille() {
    const F = CAB.fenetre;
    return lay(F.x0, 560, F.x1, F.appui + 4, (c) => {
      const R = M.rng(41);
      fillPts([[F.x0, 640], [200, 606], [260, 618], [330, 596], [400, 612], [470, 600], [F.x1, 616], [F.x1, 700], [F.x0, 700]], '#8e9a86', 3);   // collines
      fillPts([[F.x0, 660], [240, 640], [320, 652], [420, 634], [F.x1, 648], [F.x1, 700], [F.x0, 700]], '#a3a98e', 5);
      const maison = (x, w, yb, h, mur, toit) => {
        pc(rect(x, yb - h, x + w, yb), mur, () => { for (let k = 0; k < 2; k++) fillPts(rect(x + 5 + k * (w / 2), yb - h + 8, x + 9 + k * (w / 2), yb - h + 16), 'rgba(40,30,20,0.55)', 0, 0); hatch(null, 0.8, 4, 0.12); }, 4100 + x, { drop: false, texA: 0.4 });
        pc([[x - 3, yb - h], [x + w / 2, yb - h - w * 0.28], [x + w + 3, yb - h]], toit, () => strokePts([[x, yb - h - 1], [x + w, yb - h - 1]], 'rgba(60,20,10,0.5)', 1), 4200 + x, { drop: false, texA: 0.4 });
      };
      for (let x = F.x0 - 10; x < F.x1; x += 18 + R() * 14) { const w = 18 + R() * 16; maison(x, w, 760, 34 + R() * 34, R() < 0.5 ? '#d8c39a' : '#e3d3b0', R() < 0.7 ? '#a2492e' : '#8e3e28'); }
      for (const [tx, th] of [[214, 120], [362, 150], [446, 104]]) {                                                    // tours carrées (droites)
        pc(rect(tx, 760 - th, tx + 22, 760), '#cdb58a', () => { fillPts(rect(tx + 8, 760 - th + 16, tx + 13, 760 - th + 30), 'rgba(40,30,20,0.6)', 0, 0); hatch(null, 0.9, 4, 0.15); }, 4300 + tx, { drop: false });
        for (let k = 0; k < 3; k++) fillPts(rect(tx + k * 8, 760 - th - 6, tx + k * 8 + 5, 760 - th), '#cdb58a', 0, 0);
      }
      fillPts(rect(F.x0, 758, F.x1, 790), '#c4ae84', 0, 0); strokePts([[F.x0, 790], [F.x1, 790]], 'rgba(60,40,20,0.5)', 1.4);   // quai
      c.fillStyle = grad(c, 0, 790, 0, 846, [[0, '#6f8f94'], [1, '#4f6f78']]); c.fillRect(F.x0, 790, F.x1 - F.x0, 56);            // l'Arno
    });
  }
  function makeVilleAvant() {
    const F = CAB.fenetre;
    return lay(F.x0, 820, F.x1, F.appui + 4, (c) => {
      const R = M.rng(43);
      fillPts(rect(F.x0, 844, F.x1, 862), '#bba57c', 0, 0);
      for (let x = F.x0 - 20; x < F.x1; x += 30 + R() * 16) {
        const w = 34 + R() * 18, h = 20 + R() * 26;
        pc([[x, 930], [x, 900 - h], [x + w / 2, 888 - h], [x + w, 900 - h], [x + w, 930]], '#9c4630', () => { for (let y = 880; y < 930; y += 7) strokePts([[x, y], [x + w, y]], 'rgba(60,20,10,0.35)', 1); }, 4400 + x, { drop: false, texA: 0.4 });
      }
    });
  }
  function makeMur() {
    const F = CAB.fenetre, E = CAB.etagere;
    return ombre(lay(46, 150, 1034, BACK + 6, (c) => {
      const R = M.rng(51);
      c.fillStyle = '#cdb58c'; c.fillRect(46, 150, 988, BACK - 144);
      for (let y = 230, row = 0; y < BACK; y += 48, row++) {                                                           // pierre blonde appareillée
        for (let x = 46 - (row % 2) * 40; x < 1034; x += 80) {
          const v = R();
          fillPts(rect(x + 2, y + 2, x + 78, y + 46), M.mixc('#d6c096', '#b79c6c', v * 0.6), 0, 0.6);
          if (v > 0.7) hatch(rect(x + 4, y + 4, x + 76, y + 44), 0.8, 5, 0.1);
          strokePts([[x + 6, y + 6], [x + 70, y + 5]], 'rgba(255,245,215,0.35)', 1.2);
        }
        strokePts([[46, y], [1034, y]], 'rgba(110,85,50,0.5)', 1.6);
      }
      c.fillStyle = grad(c, 0, 900, 0, BACK, [[0, 'rgba(60,40,20,0)'], [1, 'rgba(60,40,20,0.28)']]); c.fillRect(46, 900, 988, BACK - 900);
      // poutres du plafond
      pc(rect(46, 150, 1034, 236), '#5a3d26', () => { hatch(null, 0.1, 6, 0.2); strokePts([[46, 230], [1034, 230]], 'rgba(255,220,170,0.25)', 2); }, 5101);
      for (let x = 70; x < 1034; x += 120) pc([[x, 236], [x + 46, 236], [x + 46, 262], [x + 30, 276], [x + 16, 276], [x, 262]], '#4a3220', () => hatch(null, 0.9, 4, 0.25), 5102 + x);
      // fenêtre géminée : grand arc de décharge, colonnette, appui
      const cxm = (F.x0 + F.x1) / 2;
      pc(ep(cxm, 560, 186, 186, 20, PI, TAU).concat(ep(cxm, 560, 168, 168, 20, TAU, PI)), '#e2d2ae', () => { for (let i = 0; i < 13; i++) { const a = PI + i / 12 * PI; strokePts([[cxm + Math.cos(a) * 168, 560 + Math.sin(a) * 168], [cxm + Math.cos(a) * 186, 560 + Math.sin(a) * 186]], 'rgba(110,85,50,0.6)', 1.4); } }, 5110);
      fillPts(ep(cxm, 560, 168, 168, 20, PI, TAU).concat([[F.x1 - 2, 560], [F.x0 + 2, 560]]), '#d3bd92', 3);           // tympan
      for (const [a, b] of F.baies) pc(baie(a - 10, b + 10), '#e2d2ae', null, 5111 + a);                               // ébrasement clair
      pc([[F.x0 - 14, 560], [F.x0 + 2, 560], [F.x0 + 2, F.appui], [F.x0 - 14, F.appui]], '#e2d2ae', null, 5115);
      pc([[F.x1 - 2, 560], [F.x1 + 14, 560], [F.x1 + 14, F.appui], [F.x1 - 2, F.appui]], '#e2d2ae', null, 5116);
      for (const [a, b] of F.baies) cut(c, baie(a, b));
      pc(rect(309, 506, 331, F.appui), '#ece0c2', () => { shade(331, 0, 309, 0, 0.35, [305, 500, 335, 940]); }, 5117);   // colonnette
      pc([[300, 494], [340, 494], [334, 510], [306, 510]], '#e2d2ae', () => strokePts([[304, 500], [336, 500]], 'rgba(110,85,50,0.6)', 1.2), 5118);
      pc([[F.x0 - 22, F.appui], [F.x1 + 22, F.appui], [F.x1 + 30, F.appui + 22, 1], [F.x0 - 30, F.appui + 22, 1]], '#e6d7b4', () => { strokePts([[F.x0 - 20, F.appui + 3], [F.x1 + 20, F.appui + 3]], 'rgba(255,250,230,0.6)', 2); }, 5119);
      c.fillStyle = 'rgba(70,50,25,0.25)'; c.fillRect(F.x0 - 30, F.appui + 22, F.x1 - F.x0 + 60, 14);
      // étagère : rouleaux, registres, pots
      for (const y of E.rayons) {
        pc(rect(E.x0, y, E.x1, y + 14), '#6b4526', () => strokePts([[E.x0, y + 3], [E.x1, y + 3]], 'rgba(255,220,170,0.35)', 1.6), 5120 + y);
        for (const bx of [E.x0 + 16, E.x1 - 30]) pc([[bx, y + 14], [bx + 14, y + 14], [bx + 14, y + 40], [bx + 4, y + 30]], '#5a3a22', null, 5121 + y + bx);
      }
      const R2 = M.rng(57);
      // rayon 1 : rouleaux couchés + pot
      for (let i = 0; i < 4; i++) { const x = E.x0 + 30 + i * 46, y = E.rayons[0]; pc(rrect2(x, y - 22 - (i % 2) * 2, x + 40, y), '#e8dcbc', () => { strokePts([[x + 18, y - 24], [x + 18, y]], '#8b2a22', 2.4); hatch(null, 0.2, 5, 0.12); }, 5130 + i); }
      pc([[E.x1 - 62, E.rayons[0]], [E.x1 - 66, E.rayons[0] - 34], [E.x1 - 56, E.rayons[0] - 46], [E.x1 - 40, E.rayons[0] - 46], [E.x1 - 30, E.rayons[0] - 34], [E.x1 - 34, E.rayons[0]]], '#7a8a6a', () => hatch(null, 0.8, 4, 0.2), 5135);
      // rayon 2 : registres debout (dos de couleurs différentes)
      let x = E.x0 + 26;
      for (let i = 0; i < 8; i++) {
        const w = 18 + R2() * 10, h = 70 + R2() * 30, y = E.rayons[1], col = ['#6e2f1f', '#4f6b3a', '#8a6a3a', '#3f5566', '#7a3a2a', '#b8a272', '#5a3a22', '#6a5a3a'][i];
        const lean = i === 7 ? 14 : 0;
        pc([[x, y], [x + lean, y - h], [x + w + lean, y - h], [x + w, y]], col, () => { strokePts([[x + 3, y - h + 12], [x + w - 3 + lean, y - h + 12]], 'rgba(217,189,114,0.6)', 1.6); strokePts([[x + 3, y - 14], [x + w - 3, y - 14]], 'rgba(217,189,114,0.6)', 1.6); hatch(null, 0.9, 4, 0.2); }, 5140 + i);
        x += w + 3 + lean;
      }
      // rayon 3 : rouleaux en pile, boîte
      for (let i = 0; i < 5; i++) { const xx = E.x0 + 30 + (i % 3) * 40 + (i > 2 ? 20 : 0), y = E.rayons[2] - (i > 2 ? 22 : 0); pc(rrect2(xx, y - 22, xx + 38, y), i % 2 ? '#ddd0ae' : '#e8dcbc', () => strokePts([[xx + 30, y - 22], [xx + 30, y]], '#8b6a2a', 2), 5150 + i); }
      pc(rect(E.x1 - 90, E.rayons[2] - 50, E.x1 - 24, E.rayons[2]), '#6e4a2a', () => { strokePts([[E.x1 - 90, E.rayons[2] - 40], [E.x1 - 24, E.rayons[2] - 40]], _.LAITON, 2.4); dot(E.x1 - 57, E.rayons[2] - 24, 4, _.LAITON); }, 5160);
      dot(CAB.astrolabe.x, CAB.astrolabe.y - 70, 3.4, '#3a2a1a');                                                     // clou de l'astrolabe
    }), 10);
  }
  function rrect2(x0, y0, x1, y1) { const r = (y1 - y0) / 2; return ep(x1 - r, y0 + r, r, r, 6, -PI / 2, PI / 2).concat(ep(x0 + r, y0 + r, r, r, 6, PI / 2, PI * 1.5)); }
  function makeMeubles() {
    const Pu = CAB.pupitre, T = CAB.table, Co = CAB.coffre;
    return ombre(lay(150, 980, 1034, BACK + 6, (c) => {
      // pupitre d'écriture incliné
      pc(rect(270, 1150, 298, BACK - 18), '#5a3a22', () => hatch(null, 0.1, 4, 0.25), 5201);
      pc([[212, BACK - 20], [356, BACK - 20], [362, BACK, 1], [206, BACK, 1]], '#4a3020', null, 5202);
      pc([[Pu.haut[0] + 12, Pu.haut[1] + 14], [Pu.bas[0] - 8, Pu.bas[1] + 10], [Pu.bas[0] - 26, 1160], [Pu.haut[0] + 30, 1160]], '#6b4526', () => { strokePts([[230, 1110], [350, 1120]], 'rgba(255,220,170,0.25)', 1.4); hatch(null, 0.2, 5, 0.2); }, 5203);
      pc([[Pu.haut[0] - 4, Pu.haut[1] - 6], [Pu.bas[0] + 6, Pu.bas[1] - 4], [Pu.bas[0] + 6, Pu.bas[1] + 10, 1], [Pu.haut[0] - 4, Pu.haut[1] + 8, 1]], '#7a5232', () => strokePts([[Pu.haut[0], Pu.haut[1] - 2], [Pu.bas[0], Pu.bas[1]]], 'rgba(255,220,170,0.4)', 1.6), 5204);
      pc([[Pu.bas[0] - 2, Pu.bas[1] - 12], [Pu.bas[0] + 8, Pu.bas[1] - 10], [Pu.bas[0] + 8, Pu.bas[1] + 6], [Pu.bas[0] - 2, Pu.bas[1] + 4]], '#5a3a22', null, 5205);   // rebord
      const [f0, f1] = Pu.feuille;                                                                                       // feuille posée (lignes ondulées)
      pc([[f0[0], f0[1]], [f1[0], f1[1] - 14], [f1[0] - 4, f1[1] + 2], [f0[0] - 4, f0[1] + 16]], '#efe6cc', () => { for (let i = 0; i < 4; i++) onde(f0[0] + 6, f1[0] - 30, f0[1] + 6 + i * 4 + (i * 8), 1, 7, 'rgba(40,28,22,0.6)', 0.9, i); }, 5206, { texA: 0.4 });
      // encrier et plumes sur la tablette haute
      pc(rect(186, 1018, 236, 1030), '#5a3a22', null, 5207);
      pc([[196, 1018], [194, 1000], [200, 994], [216, 994], [222, 1000], [220, 1018]], '#2a2622', () => strokePts([[198, 998], [218, 998]], 'rgba(255,255,255,0.3)', 1.2), 5208);
      for (const [a, b] of [[[206, 996], [188, 920]], [[210, 996], [232, 930]]]) { pc(ribbon(qbez(a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], b, 6), 3, 12), '#f2eee4', null, 5209 + a[0]); strokePts([a, b], 'rgba(150,140,115,0.8)', 1.1); }
      // table
      pc(rect(T.x0, T.dessus, T.x1, T.dessus + 18), '#7a5232', () => { strokePts([[T.x0, T.dessus + 3], [T.x1, T.dessus + 3]], 'rgba(255,220,170,0.4)', 1.6); hatch(null, 0.1, 5, 0.2); }, 5210);
      pc(rect(640, T.dessus - 3, 780, T.dessus + 30), '#8b2a22', () => { for (let x = 644; x < 780; x += 6) strokePts([[x, T.dessus + 24], [x, T.dessus + 34]], '#6a1f18', 1); }, 5211);   // chemin de table
      for (const lx of [T.x0 + 24, T.x1 - 46]) { pc([[lx, T.dessus + 18], [lx + 22, T.dessus + 18], [lx + 30, BACK - 4], [lx - 8, BACK - 4]], '#5a3a22', () => hatch(null, 0.1, 4, 0.25), 5212 + lx); }
      pc(rect(T.x0 + 40, 1320, T.x1 - 40, 1334), '#4a3020', null, 5214);
      // coffre ferré
      pc([[Co.x0, Co.dessus + 14], [Co.x0 + 6, Co.dessus], [Co.x1 - 6, Co.dessus], [Co.x1, Co.dessus + 14], [Co.x1, BACK, 1], [Co.x0, BACK, 1]], '#6b4526', () => {
        strokePts([[Co.x0, Co.dessus + 30], [Co.x1, Co.dessus + 30]], 'rgba(30,20,10,0.6)', 1.6);
        for (const xx of [Co.x0 + 16, Co.x1 - 22]) { fillPts(rect(xx, Co.dessus, xx + 8, BACK), '#3a3634'); for (let y = Co.dessus + 12; y < BACK; y += 22) dot(xx + 4, y, 2, '#8a8680'); }
        fillPts(rect(Co.x0, Co.dessus + 56, Co.x1, Co.dessus + 64), '#3a3634');
        fillPts([[952, Co.dessus + 32], [968, Co.dessus + 32], [970, Co.dessus + 58], [950, Co.dessus + 58]], _.LAITON); dot(960, Co.dessus + 44, 3, '#2a2420');
        hatch(null, 0.15, 5, 0.22); shade(Co.x1, 0, Co.x0, 0, 0.3, [Co.x0, Co.dessus, Co.x1, BACK]);
      }, 5215);
    }), 9);
  }
  function makeEnclos() {
    const w = EN.x1 - EN.x0, H = EN.H;
    K.enFond = M.withShadow(M.cutFlat(w + 40, H + 30, w / 2 + 20, H + 10, () => {
      planches(-w / 2, -EN.hFond, w / 2, 0, 30, '#9a7448', 6101);
      pc(rect(-w / 2 - 8, -EN.hFond + 20, w / 2 + 8, -EN.hFond + 36), '#7a5a36', () => strokePts([[-w / 2, -EN.hFond + 23], [w / 2, -EN.hFond + 23]], 'rgba(255,220,170,0.35)', 1.4), 6102);
      for (const px of [-w / 2 - 6, w / 2 - 8]) pc([[px, -H], [px + 7, -H - 6], [px + 14, -H], [px + 14, 0, 1], [px, 0, 1]], '#6b4a2b', () => hatch(null, 0.1, 4, 0.25), 6103 + px);
      c_shadeEnclos(w);
    }), 8); K.enFond.padB = 20;
    K.enAvant = M.withShadow(M.cutFlat(w + 60, EN.hAvant + 40, w / 2 + 30, EN.hAvant + 10, () => {
      for (const [y0, h] of [[-EN.hAvant + 4, 22], [-38, 22]]) pc([[-w / 2 - 14, y0 + 2], [w / 2 + 14, y0], [w / 2 + 14, y0 + h, 1], [-w / 2 - 14, y0 + h, 1]], '#a07a4c', () => { strokePts([[-w / 2, y0 + 5], [w / 2, y0 + 4]], 'rgba(255,230,180,0.35)', 1.4); for (let x = -w / 2; x < w / 2; x += 40) strokePts([[x, y0 + 8], [x + 26, y0 + 12]], 'rgba(60,36,16,0.3)', 0.9); }, 6110 + y0);
      for (const px of [-w / 2 - 20, -10, w / 2 + 4]) pc([[px, -EN.hAvant - 10], [px + 8, -EN.hAvant - 16], [px + 16, -EN.hAvant - 10], [px + 16, 0, 1], [px, 0, 1]], '#6b4a2b', () => { hatch(null, 0.1, 4, 0.25); dot(px + 8, -EN.hAvant + 14, 2.2, '#2a2420'); dot(px + 8, -28, 2.2, '#2a2420'); }, 6120 + px);
      fillPts([[-w / 2 + 40, -12], [-w / 2 + 90, -16], [-w / 2 + 70, -2]], '#c9b05a', 0, 0);                         // brins de paille
      fillPts([[w / 2 - 80, -10], [w / 2 - 40, -14], [w / 2 - 60, 0]], '#c9b05a', 0, 0);
    }), 8); K.enAvant.padB = 30;
  }
  function c_shadeEnclos(w) { shade(0, -EN.hFond, 0, 0, 0.25, [-w / 2, -EN.hFond, w / 2, 0]); }
  function makeSol() {
    const Ta = CAB.tapis, Tb = CAB.tabouret;
    return ombre(lay(46, 1250, 1034, 1500, (c) => {
      pc([[Ta.x0 + 20, Ta.y0], [Ta.x1 - 20, Ta.y0], [Ta.x1, Ta.y1, 1], [Ta.x0, Ta.y1, 1]], '#8b2a22', () => {           // tapis à motifs géométriques
        fillPts([[Ta.x0 + 34, Ta.y0 + 6], [Ta.x1 - 34, Ta.y0 + 6], [Ta.x1 - 20, Ta.y1 - 6], [Ta.x0 + 20, Ta.y1 - 6]], '#b08a3e', 0, 0);
        fillPts([[Ta.x0 + 46, Ta.y0 + 11], [Ta.x1 - 46, Ta.y0 + 11], [Ta.x1 - 34, Ta.y1 - 11], [Ta.x0 + 34, Ta.y1 - 11]], '#24324a', 0, 0);
        for (let i = 0; i < 9; i++) { const x = lerp(Ta.x0 + 70, Ta.x1 - 70, i / 8), y = (Ta.y0 + Ta.y1) / 2; fillPts([[x, y - 7], [x + 12, y], [x, y + 7], [x - 12, y]], i % 2 ? '#b08a3e' : '#c9a24e', 0, 0); }
        hatch(null, 0.2, 4, 0.15);
      }, 5301, { texA: 0.5 });
      for (let x = Ta.x0 + 4; x < Ta.x1; x += 8) strokePts([[x, Ta.y1], [x - 1, Ta.y1 + 7]], '#d9c49a', 1.2);
      // tabouret à trois pieds
      for (const [a, b] of [[[Tb.x - 30, Tb.assise + 10], [Tb.x - 44, 1440]], [[Tb.x + 30, Tb.assise + 10], [Tb.x + 44, 1440]], [[Tb.x, Tb.assise + 10], [Tb.x + 4, 1446]]]) pc(ribbon([a, b], 10, 9), '#5a3a22', null, 5302 + a[0]);
      pc(ell(Tb.x, Tb.assise, 48, 12, 16), '#7a5232', () => strokePts(ep(Tb.x, Tb.assise - 2, 40, 7, 10, PI, TAU), 'rgba(255,220,170,0.4)', 1.4), 5305);
      // sacs de pièces (dont un qui déborde)
      pc([[862, 1446], [856, 1420], [866, 1398], [878, 1390], [872, 1380], [898, 1380], [892, 1392], [906, 1404], [912, 1428], [906, 1446]], '#8a6a3e', () => { strokePts([[872, 1388], [898, 1388]], '#3a2414', 2); hatch(null, 0.8, 4, 0.2); }, 5306, { doux: true });
      pc([[912, 1448], [908, 1426], [920, 1410], [940, 1414], [952, 1430], [950, 1448]], '#7a5a32', () => hatch(null, 0.8, 4, 0.2), 5307, { doux: true });
      for (const [x, y] of [[930, 1414], [940, 1418], [924, 1420], [952, 1446], [964, 1448]]) disque(x, y, 7, '#d4b25a', '#8a6a2a');
      // pot du basilic
      pc([[962, 1448], [958, 1404], [1022, 1404], [1018, 1448]], '#a85a32', () => { strokePts([[958, 1412], [1022, 1412]], 'rgba(0,0,0,0.3)', 2); hatch(null, 0.8, 4, 0.2); }, 5308);
    }), 8);
  }
  FIB.init = function () {
    K.ciel = makeCiel(false); K.cielSoir = makeCiel(true); K.ville = makeVille(); K.villeAvant = makeVilleAvant();
    K.mur = makeMur(); K.meubles = makeMeubles(); K.sol = makeSol(); makeEnclos();
    return K;
  };
  const ready = () => { if (!K.mur) FIB.init(); };

  // ---------------- éléments animés
  function barque(x, y, s, g, i) {
    const c = cx_(); c.save(); c.translate(x, y + Math.sin(g * 1.6 + i) * 1.2); c.scale(s, s);
    fillPts([[-22, -4], [22, -4], [16, 4], [-16, 4]], '#4a3020', 0, 0);
    if (i % 2) { strokePts([[0, -4], [0, -40]], '#3a2a1a', 1.4); fillPts([[1, -40], [20, -10], [1, -8]], '#efe6d0', 0, 0); }
    else { fillPts(ell(4, -10, 4, 6, 8), '#3a3a44', 0, 0); dot(4, -18, 3, '#d9b48e'); strokePts([[4, -10], [-16 + 4 * Math.sin(g * 2 + i), 4]], '#3a2a1a', 1.2); }
    c.restore();
  }
  function pigeon(x, y, s, g, vol, dir) {
    const c = cx_(); c.save(); c.translate(x, y); c.scale(s * dir, s);
    const bat = vol ? Math.sin(g * 26) : 0, pick = vol ? 0 : Math.max(0, Math.sin(g * 2.2)) ** 6;
    pc([[-24, -12], [-6, -22], [12, -22], [20, -16], [16, -6], [0, 0], [-22, -4], [-34, -2, 1], [-34, -8, 1]], '#8a8c94', () => { fillPts([[8, -22], [18, -18], [14, -10], [4, -12]], '#6a7a76'); hatch(null, 0.8, 3, 0.2); }, 5401, { drop: !vol, doux: true });
    c.save(); c.translate(14, -18 + pick * 6); c.rotate(pick * 0.6);
    pc([[-6, 2], [-4, -8], [4, -10], [8, -6], [6, 2]], '#7a7c84', () => { dot(2, -6, 1.6, '#c06030'); dot(2, -6, 0.8, '#111'); }, 5402, { drop: false, doux: true });
    fillPts([[7, -7], [13, -5], [7, -4]], '#d9c4a0', 0, 0);
    c.restore();
    c.save(); c.translate(-4, -18); c.rotate(vol ? -0.9 * bat - 0.2 : 0.1);
    pc([[0, 0], [-26, -4], [-30, 4], [-6, 8]], '#9a9ca4', () => { for (const k of [0, 1, 2]) strokePts([[-14 - k * 5, -2], [-16 - k * 5, 6]], 'rgba(40,40,50,0.5)', 1); }, 5403, { drop: false, doux: true });
    c.restore();
    if (!vol) { strokePts([[0, 0], [2, 6]], '#c06a5a', 1.4); strokePts([[-6, 0], [-6, 6]], '#c06a5a', 1.4); }
    c.restore();
  }
  function astrolabe(x, y, g) {
    const c = cx_(), a = 0.05 * Math.sin(g * 0.9);
    c.save(); c.translate(x, y - 70); c.rotate(a); c.translate(0, 70);
    strokePts([[0, -70], [0, -56]], '#3a2a1a', 1.6);
    pc(ell(0, -48, 8, 8, 10).concat([]), _.LAITON, () => fillPts(ell(0, -48, 3.4, 3.4, 8), '#3a2a1a', 0, 0), 5501, { drop: false });
    pc(ell(0, 0, 50, 50, 28), _.LAITON, () => {
      fillPts(ell(0, 0, 40, 40, 24), '#8a6a2e', 0, 0);
      for (let i = 0; i < 36; i++) { const b = i / 36 * TAU; strokePts([[Math.cos(b) * 42, Math.sin(b) * 42], [Math.cos(b) * (i % 3 ? 46 : 49), Math.sin(b) * (i % 3 ? 46 : 49)]], '#5a4320', 0.9); }
      const r = g * 0.03;                                                                                                // araignée (rete) ajourée qui tourne lentement
      for (let k = 0; k < 6; k++) { const b = r + k / 6 * TAU; fillPts([[Math.cos(b) * 6, Math.sin(b) * 6], [Math.cos(b + 0.12) * 36, Math.sin(b + 0.12) * 36], [Math.cos(b + 0.2) * 30, Math.sin(b + 0.2) * 30]], '#d9bd72', 0, 0); }
      strokePts(ep(6, -6, 24, 24, 16, 0, TAU), '#d9bd72', 2.2);
      strokePts([[Math.cos(-g * 0.02) * -38, Math.sin(-g * 0.02) * -38], [Math.cos(-g * 0.02) * 38, Math.sin(-g * 0.02) * 38]], '#3a2a1a', 2.4);
      dot(0, 0, 3.4, '#3a2a1a');
    }, 5502);
    c.restore();
  }
  function sablier(x, y, g) {
    const c = cx_(), lv = 0.55 + 0.25 * Math.sin(g / 40);
    pc(rect(x - 22, y - 8, x + 22, y), '#5a3a22', null, 5601); pc(rect(x - 22, y - 92, x + 22, y - 84), '#5a3a22', null, 5602);
    for (const sx of [-1, 1]) pc(rect(x + sx * 18 - 2, y - 86, x + sx * 18 + 2, y - 8), '#5a3a22', null, 5603 + sx);
    const verre = [[x - 14, y - 84], [x + 14, y - 84], [x + 12, y - 62], [x + 2, y - 47], [x + 12, y - 30], [x + 14, y - 8], [x - 14, y - 8], [x - 12, y - 30], [x - 2, y - 47], [x - 12, y - 62]];
    fillPts(verre, 'rgba(210,228,230,0.45)', 0, 0);
    const ht = 30 * lv, hb = 30 * (1 - lv);
    fillPts([[x - 11 * lv - 2, y - 47 - ht], [x + 11 * lv + 2, y - 47 - ht], [x + 2, y - 49], [x - 2, y - 49]], '#d9b878', 0, 0);
    fillPts([[x - 13, y - 9], [x + 13, y - 9], [x + 4, y - 9 - hb], [x - 4, y - 9 - hb]], '#d9b878', 0, 0);
    strokePts([[x, y - 48], [x, y - 10 - hb]], 'rgba(200,160,90,0.95)', 1.2);
    for (let i = 0; i < 3; i++) { const u = ((g * 1.7 + i / 3) % 1); dot(x, lerp(y - 48, y - 10 - hb, u), 1.2, '#b08a4a'); }
    strokePts(verre.concat([verre[0]]), 'rgba(120,140,140,0.6)', 1.2); strokePts([[x - 8, y - 78], [x - 6, y - 66]], 'rgba(255,255,255,0.7)', 1.4);
  }
  function chandelle(t, g, soir) {
    const Ch = CAB.chandelle;
    pc([[Ch.x - 26, Ch.y], [Ch.x + 26, Ch.y], [Ch.x + 18, Ch.y - 8], [Ch.x + 5, Ch.y - 12], [Ch.x + 5, Ch.y - 60], [Ch.x + 14, Ch.y - 64], [Ch.x - 14, Ch.y - 64], [Ch.x - 5, Ch.y - 60], [Ch.x - 5, Ch.y - 12], [Ch.x - 18, Ch.y - 8]], _.LAITON, () => strokePts([[Ch.x - 2, Ch.y - 58], [Ch.x - 2, Ch.y - 14]], _.LAITONL, 1.6), 5701);
    pc(rect(Ch.x - 6, Ch.flamme[1] + 2, Ch.x + 6, Ch.y - 64), '#efe8d6', () => { strokePts([[Ch.x + 2, Ch.flamme[1] + 6], [Ch.x + 3, Ch.flamme[1] + 22]], 'rgba(220,210,180,0.8)', 2); }, 5702);
    strokePts([[Ch.x, Ch.flamme[1] + 2], [Ch.x, Ch.flamme[1] - 2]], '#2a2420', 1.4);
    M.flamme(t, { x: Ch.x, y: Ch.flamme[1] - 1, s: 0.9, r: 110 + 60 * soir, seed: 23 });
  }
  function volet(t, g, o) {
    const V = CAB.volet, c = cx_();
    let k = 1; if (o.volet != null) k = 1 - Math.min(0.75, Math.abs(wob(t, o.volet, 0.75, 1.5, 2.2)));
    k *= 1 - 0.015 * (1 + Math.sin(g * 0.7));                                                                          // courant d'air
    const w = (V.x1 - V.x0) * k;
    c.save(); c.translate(V.x0, 0);
    pc([[0, V.y0], [w, V.y0 + 10 * (1 - k)], [w, V.y1 - 10 * (1 - k)], [0, V.y1]], '#6b4a2b', () => {
      for (let i = 1; i < 4; i++) strokePts([[w * i / 4, V.y0 + 4], [w * i / 4, V.y1 - 4]], 'rgba(30,18,8,0.5)', 1.2);
      for (const y of [V.y0 + 60, V.y1 - 60]) { fillPts(rect(0, y - 6, w * 0.8, y + 6), '#3a3634'); dot(w * 0.78, y, 2.4, '#8a8680'); }
      hatch(null, 0.1, 5, 0.22); shade(w, 0, 0, 0, 0.3 + 0.3 * (1 - k), [0, V.y0, w + 2, V.y1]);
    }, 5801);
    c.restore();
  }
  // ---------------- fond + intermédiaire
  FIB.cabinet = function (t, up, o) {
    ready(); o = o || {}; up = up || 0;
    const c = cx_(), g = M.tg(t), soir = clamp(o.soir || 0), F = CAB.fenetre;
    c.save(); c.translate(0, -up);
    // dehors : ciel, nuages, toits de Pise, l'Arno et ses barques
    clipBaies(() => {
      put(K.ciel); if (soir > 0) put(K.cielSoir, null, soir);
      M.nuages(t, { y0: 440, y1: 560, n: 7, vit: 9, s: 0.38, seed: 71 });
      put(K.ville);
      for (let i = 0; i < 3; i++) { const per = 46 + i * 9, u = ((g / per + i * 0.37) % 1 + 1) % 1; barque(lerp(F.x1 + 30, F.x0 - 30, u), 806 + i * 12, 0.7 + i * 0.12, g, i); }
      for (let i = 0; i < 6; i++) { const yy = 798 + i * 8, ph = g * (0.6 + i * 0.1); strokePts([[F.x0 + ((ph * 20 + i * 57) % 340), yy], [F.x0 + ((ph * 20 + i * 57) % 340) + 26, yy]], 'rgba(230,240,240,0.4)', 1.2); }
      put(K.villeAvant);
      if (soir > 0) { c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = `rgba(240,160,110,${0.35 * soir})`; c.fillRect(F.x0, F.y0, F.x1 - F.x0, F.appui - F.y0); c.restore(); }
    });
    put(K.mur, 0.25);
    M.voilage(t, { x: 168, y: 470, w: 64, h: 440, cote: 1, amp: 8, col: 'rgba(242,236,222,0.5)' });
    M.voilage(t + 1.7, { x: 410, y: 470, w: 64, h: 440, cote: -1, amp: 8, col: 'rgba(242,236,222,0.5)' });
    volet(t, g, o);
    astrolabe(CAB.astrolabe.x, CAB.astrolabe.y, g);
    // rayon de soleil poussiéreux depuis la fenêtre
    const ra = (1 - 0.6 * soir) * (o.rayon == null ? 1 : o.rayon);
    if (ra > 0) {
      c.save(); c.beginPath(); c.moveTo(180, 520); c.lineTo(468, 520); c.lineTo(900, BACK); c.lineTo(430, BACK); c.closePath();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = grad(c, 0, 520, 0, BACK, [[0, `rgba(255,236,190,${0.12 * ra})`], [1, 'rgba(255,236,190,0)']]); c.fill(); c.clip();
      M.poussiere(t, { x: 200, y: 520, w: 680, h: 860, n: 44, a: 0.75 * ra, seed: 77 }); c.restore();
    }
    put(K.meubles, 0.3);
    chandelle(t, g, soir);
    const tb = CAB.table.dessus;
    if (o.abaque !== false) FIB.abaque(CAB.abaque.x, tb, CAB.abaque.s, Object.assign({ n: 12, seed: 33 }, o.abaque || {}));
    for (const [px, py, n] of CAB.pieces) FIB.pieces(px, py, 0.8, { n, seed: px, metal: px === 818 ? 'argent' : 'or' });
    FIB.balance(CAB.balance.x, tb, CAB.balance.s, { incline: 0.25 * Math.sin(g * 0.5), gauche: 3, droite: 2 });
    sablier(CAB.sablier.x, CAB.sablier.y, g);
    // enclos qui monte de la trappe (planches du fond)
    const dy = enclosDy(t, o);
    if (dy != null) M.flat(K.enFond, (EN.x0 + EN.x1) / 2, BACK + dy, { clipY: BACK + 1, cast: { dx: 14, dy: 6, a: 0.35 } });
    // pigeon (événement) : se pose sur l'appui à o.pigeon (temps local)
    if (o.pigeon != null && t > o.pigeon - 1.4) {
      const u = clamp((t - (o.pigeon - 1.4)) / 1.4), Pg = CAB.pigeon;
      if (u < 1) { const e = easeOut(u); pigeon(lerp(-40, Pg[0], e), lerp(360, Pg[1], e) - Math.sin(PI * u) * 60, 0.9, g, true, 1); }
      else { const hop = Math.abs(Math.sin(Math.max(0, t - o.pigeon) * 1.3)) < 0.08 ? -4 : 0; pigeon(Pg[0], Pg[1] + hop, 0.9, g, false, Math.sin((t - o.pigeon) * 0.4) > 0.6 ? -1 : 1); }
    }
    // lumière du soir (plus chaude), lueur de la chandelle
    if (soir > 0) {
      c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = `rgba(235,165,105,${0.4 * soir})`; c.fillRect(46, 150, 988, BACK - 144); c.restore();
      glow(CAB.chandelle.x, CAB.chandelle.flamme[1], 380, '255,180,90', 0.18 * soir);
    }
    c.restore();
  };
  // premier plan au sol (après M.drawFloor)
  FIB.cabinetSol = function (t, o) {
    ready(); o = o || {};
    const c = cx_(), g = M.tg(t), up = o.up || 0, soir = clamp(o.soir || 0);
    c.save(); c.translate(0, -up);
    put(K.sol, 0.3);
    for (let i = 0; i < 7; i++) {                                                                                      // basilic qui frémit
      const a = -1.1 + i * 0.36 + 0.06 * Math.sin(g * 1.4 + i * 1.3), L = 34 + 10 * hash(i * 3.1);
      c.save(); c.translate(990, 1404); c.rotate(a + PI / 2 - PI / 2);
      strokePts([[0, 0], [Math.sin(a) * L * 0.8, -Math.cos(a) * L * 0.8]], '#4a6a32', 1.6);
      pc(ell(Math.sin(a) * L, -Math.cos(a) * L, 9, 6, 10).map((p) => p), i % 2 ? '#5a8a3a' : '#4f7d34', () => strokePts([[Math.sin(a) * (L - 7), -Math.cos(a) * (L - 7)], [Math.sin(a) * (L + 7), -Math.cos(a) * (L + 7)]], 'rgba(220,240,190,0.5)', 0.9), 5901 + i, { drop: false, doux: true });
      c.restore();
    }
    if (soir > 0) { c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = `rgba(235,165,105,${0.3 * soir})`; c.fillRect(46, 1250, 988, 250); c.restore(); }
    c.restore();
  };
  // planches de devant de l'enclos (après les lapins)
  FIB.enclosAvant = function (t, o) {
    ready(); o = o || {};
    const dy = enclosDy(t, o); if (dy == null) return;
    const c = cx_(); c.save(); c.translate(0, -(o.up || 0));
    M.flat(K.enAvant, (EN.x0 + EN.x1) / 2, BACK + 4 + dy, { clipY: BACK + 5, cast: { dx: 14, dy: 6, a: 0.35 } });
    if (o.soir > 0) { c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = `rgba(235,165,105,${0.3 * o.soir})`; c.fillRect(EN.x0 - 40, BACK - 140, EN.x1 - EN.x0 + 80, 150); c.restore(); }
    c.restore();
  };
})();
