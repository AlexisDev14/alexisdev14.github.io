// cocotte.js — « La Cocotte-Minute, la marmite de Denis Papin » : Papin, cuisinier, savants 1682, digesteur, cocotte, cuisine et atelier (espace M.pap). Mode d emploi : cocotte.md.
// Espace M.pap (alias PAP). Appeler PAP.init() dans S.init. Mode d'emploi : persos.md (ne pas lire ce fichier en entier).
// Aucun texte, lettre, chiffre ni logo. Déterministe (aucun Math.random).
// MARIONNETTES : PAP.papin, PAP.papinDos, PAP.cuisinier, PAP.savantA/B/C (pose, x, y, s, o) → r (+ r.tenu) ; PAP.pt(r, nom, arriere) ; PAP.main(r, arriere)
// ACCESSOIRES  : PAP.digesteur, PAP.cocotte, PAP.os, PAP.broc, PAP.soupape, PAP.fourchette, PAP.pigeon, PAP.verre, PAP.cuillere, PAP.bourse,
//                PAP.plume, PAP.chaise (x, y, s, o) ; PAP.digPt / PAP.cocPt (nom, x, y, s, o) → point écran
// DÉCORS       : PAP.cuisine(t, up, o) + PAP.cuisineAvant(t, up, o) ; PAP.atelier(t, up, o) + PAP.atelierAvant(t, up, o) + PAP.nuit(t, k)
//                repères PAP.CUI, PAP.AT
(function () {
  const X = M.X, P = M.P, CH = M.chars, TAU = M.TAU, PI = Math.PI, D = 180 / PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, hash, smooth } = M;
  const PAP = (M.pap = {});
  const cx_ = () => M.ctx(), SIL = () => M._sil();
  const OFFP = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];

  // ------------------------------------------------------------ géométrie (reprise du Téflon)
  function ep(cx, cy, rx, ry, n, a0, a1) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; }
  function ell(cx, cy, rx, ry, n) { const o = ep(cx, cy, rx, ry, n || 16, 0, TAU); o.pop(); return o; }
  const mp = (m, p) => [m.a * p[0] + m.c * p[1] + m.e, m.b * p[0] + m.d * p[1] + m.f];
  const normA = (a) => { while (a > PI) a -= TAU; while (a < -PI) a += TAU; return a; };
  function ribbonW(line, wf) {
    const L = [], R = [];
    for (let i = 0; i < line.length; i++) {
      const a = line[Math.max(0, i - 1)], b = line[Math.min(line.length - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      const w = (typeof wf === 'function' ? wf(i / (line.length - 1)) : wf) / 2;
      L.push([line[i][0] - dy * w, line[i][1] + dx * w]); R.push([line[i][0] + dy * w, line[i][1] - dx * w]);
    }
    return L.concat(R.reverse());
  }
  function qbez(p0, p1, p2, n) { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]); } return o; }
  function rrect(x0, y0, x1, y1, r) { return ep(x1 - r, y0 + r, r, r, 4, -PI / 2, 0).concat(ep(x1 - r, y1 - r, r, r, 4, 0, PI / 2), ep(x0 + r, y1 - r, r, r, 4, PI / 2, PI), ep(x0 + r, y0 + r, r, r, 4, PI, PI * 1.5)); }
  const rect = (x0, y0, x1, y1) => [[x0, y0, 1], [x1, y0, 1], [x1, y1, 1], [x0, y1, 1]];
  const pc = (pts, base, paint, seed, o) => piece(pts, base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));
  function worldPt(x, y) { return mp(cx_().getTransform(), [x, y]); }
  // contour bouclé (perruques) : points alternés repoussés vers l'extérieur → festons une fois lissés par M.path
  function boucle(pts, amp, step, sansIdx) {
    let cx = 0, cy = 0; for (const p of pts) { cx += p[0]; cy += p[1]; } cx /= pts.length; cy /= pts.length;
    const o = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / step));
      for (let k = 0; k < n; k++) {
        const u = k / n, x = lerp(a[0], b[0], u), y = lerp(a[1], b[1], u);
        if (k === 0 && a[2]) { o.push([x, y, 1]); continue; }
        const push = (sansIdx && sansIdx.includes(i)) ? 0 : ((k % 2) ? amp : 0);
        const dx = x - cx, dy = y - cy, l = Math.hypot(dx, dy) || 1;
        o.push([x + dx / l * push, y + dy / l * push]);
      }
    }
    return o;
  }
  // vapeur en volutes aux bords courbes irréguliers (jamais un bord droit). o : {x, y, k, haut, vent, per, n, r, seed, col}
  function vapeur(t, o) {
    if (SIL() || !(o.k > 0.01)) return;
    const c = cx_(), n = o.n || 7, per = o.per || 1.6, k = clamp(o.k), haut = (o.haut || 160) * (0.5 + 0.5 * k), R = M.rng(o.seed || 7);
    for (let i = 0; i < n; i++) {
      const ph = R() * TAU, off = i / n + R() * 0.08;
      const u = (((t / per + off) % 1) + 1) % 1;
      const px = o.x + (o.vent == null ? 18 : o.vent) * Math.pow(u, 1.4) + Math.sin(u * 6 + ph) * 7 * u, py = o.y - haut * Math.pow(u, 0.8);
      const r = (4 + (o.r || 30) * Math.pow(u, 0.8)) * (0.6 + 0.4 * k), al = Math.min(1, k * 1.3) * Math.pow(1 - u, 0.7) * Math.min(1, u * 9) * (o.a || 0.95);
      // volute = grappe de 4 boules (bords tout en arcs, jamais droits) qui tourne en montant
      const B = []; for (let j = 0; j < 4; j++) { const a = j / 4 * TAU + ph + u * 2.4; B.push([px + Math.cos(a) * r * 0.42, py + Math.sin(a) * r * 0.34, r * (0.5 + 0.16 * Math.sin(j * 2.1 + ph))]); }
      c.save(); c.globalAlpha = al;
      c.strokeStyle = 'rgba(140,136,130,0.8)'; c.lineWidth = 2.2 * (M._lw ? M._lw() : 1);
      for (const b of B) { c.beginPath(); c.arc(b[0], b[1], b[2], 0, TAU); c.stroke(); }
      c.fillStyle = o.col || 'rgba(248,247,242,1)'; for (const b of B) { c.beginPath(); c.arc(b[0], b[1], b[2], 0, TAU); c.fill(); }
      c.fillStyle = 'rgba(215,212,205,0.55)'; for (const b of B) { c.beginPath(); c.arc(b[0] + b[2] * 0.25, b[1] + b[2] * 0.3, b[2] * 0.55, 0, TAU); c.fill(); }
      c.restore();
    }
  }
  PAP.vapeur = vapeur;

  // ------------------------------------------------------------ bras à articulations rondes, IK
  const R_COUDE = 11.5, LA = 96, LB = Math.hypot(4, 96), PHI = Math.atan2(-4, 96), SH_F = [-2, -146], SH_B = [-10, -146];
  function armR(len, wt) { wt = wt || 15; return ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1, 40], [R_COUDE + 0.5, len - 6]], ep(0, len, R_COUDE, R_COUDE, 10, 0, PI), [[-R_COUDE - 0.5, len - 6], [-wt + 1, 40]]); }
  function foreR(kind) { const f = X.forePts(kind); return ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU).concat(f.slice(2)); }
  // IK dans le repère du torse : toujours la solution « coude vers l'avant » (avant-bras plié vers l'avant, angle bas ≤ 0)
  function ik2(S, T) {
    const vx = T[0] - S[0], vy = T[1] - S[1];
    const d = clamp(Math.hypot(vx, vy), Math.abs(LA - LB) + 1, LA + LB - 0.5), tv = Math.atan2(-vx, vy);
    const a1 = Math.acos(clamp((LA * LA + d * d - LB * LB) / (2 * LA * d), -1, 1));
    let best = null;
    for (const sg of [1, -1]) {
      const a = tv + sg * a1, E = [S[0] - LA * Math.sin(a), S[1] + LA * Math.cos(a)];
      const cAbs = Math.atan2(-(T[0] - E[0]), T[1] - E[1]) - PHI, b = normA(cAbs - a);
      const sc = -b;                                                             // le plus plié vers l'avant
      if (!best || sc > best.sc) best = { a: normA(a), b, sc };
    }
    return best;
  }

  // ================================================================== OBJETS (repère : y vers le bas, échelle 1)
  const IVO = '#ece4cc', FER = '#3b3a38', FERL = '#5a5955', FERD = '#262523', LAIT = '#b8913e', LAITL = '#e2c271', LAITD = '#8a6a2a';
  // ---- os de bœuf (repère : centre), ≈ 150 de long
  function osLine(m) { const o = []; for (let i = 0; i <= 14; i++) { const x = lerp(-54, 54, i / 14); o.push([x, m * 40 * Math.pow(x / 54, 2) - m * 12]); } return o; }
  const osY = (x, o) => { const m = clamp(o.mou || 0); return m * 40 * Math.pow(x / 54, 2) - m * 12; };
  function drawOs(o) {
    const m = clamp(o.mou || 0), f = clamp(o.fromage || 0), col = M.mixc(IVO, '#ead27c', f), colD = M.mixc('#c9bd9c', '#c7a548', f);
    const L = osLine(m);
    pc(ribbonW(L, (u) => 22 - 7 * Math.sin(PI * u)), col, () => {
      strokePts(L.map((p) => [p[0], p[1] - 5]), 'rgba(255,255,255,0.55)', 1.4);
      hatch(null, 0.3, 4, 0.18, 1, '90,70,40', [-70, -60, 70, 60]);
      if (f > 0.15) for (const [i, r] of [[3, 2.6], [6, 3.4], [9, 2.2], [11, 3]]) { const p = L[i]; fillPts(ell(p[0], p[1] + (i % 2 ? 3 : -2), r * 1.3, r, 8), `rgba(150,110,30,${0.7 * f})`); }
      if (m > 0.3) for (const i of [5, 9]) strokePts([[L[i][0] - 3, L[i][1] - 8], [L[i][0] + 2, L[i][1] + 8]], `rgba(120,100,60,${0.4 * m})`, 1);
    }, 7101);
    for (const end of [0, 1]) {
      const p = end ? L[L.length - 1] : L[0], q = end ? L[L.length - 2] : L[1];
      const a = Math.atan2(p[1] - q[1], p[0] - q[0]), nx = -Math.sin(a), ny = Math.cos(a), ox = Math.cos(a) * 5, oy = Math.sin(a) * 5;
      for (const sg of [-1, 1]) pc(ell(p[0] + ox + nx * 9 * sg, p[1] + oy + ny * 9 * sg, 13, 12, 12), col, () => { dot(p[0] + ox + nx * 9 * sg - 3, p[1] + oy + ny * 9 * sg - 4, 3.5, 'rgba(255,255,255,0.5)'); shade(p[0], p[1] - 12, p[0], p[1] + 14, 0.25, [-90, -80, 90, 80]); if (f > 0.2) dot(p[0] + ox + nx * 9 * sg + 3, p[1] + oy + ny * 9 * sg + 3, 2.5, `rgba(150,110,30,${0.7 * f})`); }, 7110 + end * 2 + (sg > 0 ? 1 : 0));
      strokePts([[p[0] + ox, p[1] + oy], [p[0] + ox + Math.cos(a) * 8, p[1] + oy + Math.sin(a) * 8]], colD, 1.4);
    }
  }
  // ---- broc d'étain (repère : fond), 120 de haut ; bec à l'avant (+x), anse à l'arrière
  function drawBroc(o) {
    const c = cx_();
    pc(ribbonW(qbez([-26, -104], [-66, -86], [-30, -36], 10), 9), '#7d817f', () => hatch(null, 0.9, 3.5, 0.25), 7201);
    pc([[-26, 0, 1], [26, 0, 1], [34, -30], [36, -62], [28, -88], [22, -100], [30, -112], [44, -120, 1], [30, -122], [-24, -122], [-28, -110], [-22, -98], [-32, -70], [-34, -34]], '#8d918f', () => {
      fillPts([[-34, -112], [34, -112], [34, -106], [-34, -106]], 'rgba(60,62,60,0.35)');
      fillPts([[-36, -14], [36, -14], [36, -8], [-36, -8]], 'rgba(60,62,60,0.35)');
      strokePts([[14, -90], [20, -62], [16, -24]], 'rgba(255,255,255,0.6)', 2.2);
      hatch([[-40, -120], [-6, -120], [-6, 0], [-40, 0]], 0.8, 3.6, 0.28); shade(30, 0, -34, 0, 0.3, [-50, -130, 50, 10]);
    }, 7202);
    const k = clamp(o.filet || 0);
    if (k > 0.02 && !SIL()) {
      const b = worldPt(44, -120), sc = Math.hypot(c.getTransform().a, c.getTransform().b), yb = o.filetY != null ? o.filetY : b[1] + 160 * sc, t = o.t || 0;
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 0.85;
      c.beginPath(); c.moveTo(b[0] - 2 * sc, b[1]); c.quadraticCurveTo(b[0] + 8 * sc, b[1] + 20 * sc, b[0] + 6 * sc + Math.sin(t * 9) * sc, b[1] + (yb - b[1]) * k);
      c.lineTo(b[0] + 6 * sc + 4 * sc * k, b[1] + (yb - b[1]) * k); c.quadraticCurveTo(b[0] + 12 * sc, b[1] + 18 * sc, b[0] + 3 * sc, b[1]); c.closePath();
      c.fillStyle = o.liquide || 'rgba(214,222,226,0.9)'; c.fill(); c.restore();
    }
  }
  // ---- soupape : levier, œil de pivot, clapet, poids rond en laiton (repère : milieu du levier), 150 de long
  function drawSoupape(o) {
    const sens = o.sens || 1, p = o.poids == null ? 0.7 : clamp(o.poids), wx = sens * lerp(-10, 62, p);
    pc([[sens * -52 - 6, 0], [sens * -52 + 6, 0], [sens * -52 + 5, 12], [sens * -52, 17, 1], [sens * -52 - 5, 12]], LAITD, null, 7301);
    pc(rrect(-72, -3, 72, 3, 2), FERL, () => strokePts([[-68, -1.5], [68, -1.5]], 'rgba(255,255,255,0.3)', 1), 7302);
    pc(ell(sens * -70, 0, 7.5, 7.5, 12), FER, () => dot(sens * -70, 0, 2.6, '#c9c2b0'), 7303);
    pc(ell(wx, 4, 13, 13, 16), LAIT, () => { dot(wx - 4, 0, 4, 'rgba(255,240,190,0.7)'); shade(wx, -9, wx, 17, 0.35, [-90, -30, 90, 30]); }, 7304);
    pc(ell(wx, -9, 4, 4, 8), LAITD, null, 7305);
  }
  // ---- fourchette à deux dents (repère : bout du manche en bas), dents vers le haut, 128 de long
  function drawFourchette(o) {
    pc([[-5, 40], [-4, 6], [-2.5, 0, 1], [2.5, 0, 1], [4, 6], [5, 40], [0, 44]], '#5a3a22', () => strokePts([[-1, 38], [-1, 6]], 'rgba(255,220,170,0.35)', 1), 7401);
    pc([[-3, 2, 1], [3, 2, 1], [2, -40], [6, -46], [6, -88], [4, -88], [3, -50], [0, -48], [-3, -50], [-4, -88], [-6, -88], [-6, -46], [-2, -40]], '#b9b6ae', () => strokePts([[-1, -2], [-1, -38]], 'rgba(255,255,255,0.6)', 1), 7402);
    if (o.bouchee) pc([[-12, -64], [-6, -76], [6, -80], [13, -70], [10, -58], [-2, -54]], '#c99a72', () => { strokePts([[-6, -70], [6, -64]], 'rgba(120,70,40,0.5)', 1.2); dot(2, -74, 3, 'rgba(255,240,210,0.5)'); }, 7403);
  }
  // ---- pigeon rôti (repère : centre du corps), 96 de long ; prise par la cuisse (côté −x)
  function drawPigeon(o) {
    pc([[-48, 6], [-36, 2], [-24, 8], [-30, 16], [-46, 14]], '#efe3c8', null, 7501);
    pc([[-30, 8], [-14, -6], [4, 0], [-6, 16], [-26, 18]], '#9a5426', () => hatch(null, 0.8, 3, 0.25), 7502);
    pc([[40, -4], [54, -14], [56, 0], [50, 10]], '#8a4a20', null, 7504);
    pc(ell(10, 0, 36, 22, 18), '#a8612c', () => { fillPts(ell(14, -10, 22, 8, 12), 'rgba(240,190,110,0.5)'); strokePts([[-4, -6], [14, 2], [32, -2]], 'rgba(70,30,10,0.6)', 1.6); for (const [x, y] of [[0, 8], [20, 10], [28, -10]]) dot(x, y, 2.2, 'rgba(80,35,10,0.6)'); hatch(null, 0.5, 3.6, 0.22); shade(10, -22, 10, 22, 0.35, [-40, -30, 60, 30]); strokePts([[-6, 4], [8, 8], [26, 4]], 'rgba(70,30,10,0.5)', 1.2); }, 7503);
  }
  // ---- verre à pied (repère : pied), vin rouge, 82 de haut
  function drawVerre(o) {
    pc([[-22, -82], [22, -82], [20, -60], [12, -46], [3, -40], [3, -8], [16, -3], [18, 0, 1], [-18, 0, 1], [-16, -3], [-3, -8], [-3, -40], [-12, -46], [-20, -60]], 'rgba(214,232,236,0.6)', () => {
      const n = o.niveau == null ? 0.7 : clamp(o.niveau); if (n > 0) fillPts([[-30, lerp(-44, -76, n)], [30, lerp(-44, -76, n)], [30, -40], [-30, -40]], '#7a1f2a');
      strokePts([[-14, -76], [-12, -58]], 'rgba(255,255,255,0.8)', 1.6);
    }, 7601, { texA: 0.2 });
  }
  // ---- cuillère en bois (repère : bout du manche en haut), cuilleron en bas, 140 de long
  function drawCuillere(o) {
    pc([[-4.5, -110], [4.5, -110], [4, -8], [-4, -8]], '#b88a52', () => { strokePts([[-1, -106], [-1, -10]], 'rgba(255,230,190,0.45)', 1.2); hatch(null, 1.5, 4, 0.2); }, 7701);
    pc(ell(0, 14, 13, 20, 14), '#a97a44', () => { fillPts(ell(2, 16, 8, 13, 10), 'rgba(80,50,20,0.25)'); shade(0, -6, 0, 34, 0.25, [-20, -10, 20, 40]); }, 7702);
  }
  // ---- bourse de cuir (repère : col noué) ; o.vide (true par défaut), o.retourne 0..1 (ouverture vers le bas)
  function drawBourse(o) {
    const c = cx_(), r = clamp(o.retourne || 0), vide = o.vide !== false, w = vide ? 20 : 30;
    c.save(); c.rotate(PI * ease(r));
    pc([[-7, 2], [7, 2], [w * 0.7, 22], [w, 44], [w * 0.8, 60], [0, 66], [-w * 0.8, 60], [-w, 44], [-w * 0.7, 22]], '#6e4a2c', () => {
      if (vide) for (const [a, b] of [[[-10, 30], [4, 46]], [[8, 24], [-2, 54]], [[-14, 50], [10, 58]]]) strokePts([a, b], 'rgba(40,22,10,0.5)', 1.2);
      hatch(null, 0.8, 3.6, 0.25); shade(w, 0, -w, 0, 0.3, [-40, 0, 40, 70]);
    }, 7801);
    pc([[-10, -6], [10, -6], [12, 0], [8, 6], [-8, 6], [-12, 0]], '#5a3a22', () => strokePts([[-9, 0], [9, 0]], '#c8a870', 1.4), 7802);
    strokePts([[6, 2], [16, 12], [12, 22]], '#c8a870', 1.4); strokePts([[-6, 2], [-14, 14]], '#c8a870', 1.4);
    c.restore();
  }
  // ---- plume d'oie (repère : prise), bec vers le bas
  function drawPlume(o) {
    pc([[0, 22, 1], [3, 6], [2, -30], [-8, -70], [-20, -112], [-14, -114], [-4, -96], [6, -60], [8, -28], [4, 6]], '#eee8d8', () => { strokePts([[2, 18], [0, -20], [-14, -110]], 'rgba(120,110,90,0.7)', 1); hatch(null, 0.4, 3, 0.2); }, 7901);
    fillPts([[-1, 22], [1.5, 12], [3, 14], [1, 24]], '#1e1a18');
  }
  const OBJ = {
    os: { draw: drawOs, grip: (o) => [30, osY(30, o)], p2: (o) => [-30, osY(-30, o)], pts: { centre: [0, 0], bout: [62, 0], boutB: [-62, 0] }, base: [0, 0] },
    broc: { draw: drawBroc, grip: [-50, -74], p2: () => [14, -6], pts: { bec: [44, -120], fond: [0, 0] }, base: [0, 0] },
    soupape: { draw: drawSoupape, grip: [24, 0], p2: () => [-36, 0], pts: { pivot: [-70, 0], clapet: [-52, 17], poids: [40, 4] }, base: [0, 0] },
    fourchette: { draw: drawFourchette, grip: [0, 20], pts: { pointe: [0, -88], bouchee: [0, -68] }, base: [0, 44] },
    pigeon: { draw: drawPigeon, grip: [-42, 9], pts: { centre: [10, 0] }, base: [0, 0] },
    verre: { draw: drawVerre, grip: [0, -22], pts: { bord: [0, -82] }, base: [0, 0] },
    cuillere: { draw: drawCuillere, grip: [0, -74], pts: { bout: [0, 22], haut: [0, -110] }, base: [0, 0] },
    bourse: { draw: drawBourse, grip: (o) => [0, -58 * ease(clamp(o.retourne || 0))], pts: { bouche: [0, -6] }, base: [0, 0] },
    plume: { draw: drawPlume, grip: [0, 2], pts: { bec: [0, 23] }, base: [0, 0] },
  };
  PAP.OBJ = OBJ;
  const gripOf = (ob, o) => (typeof ob.grip === 'function' ? ob.grip(o) : ob.grip);
  function heldOpts(name, o, p) { const ob = OBJ[name]; return Object.assign({ t: p.t || 0 }, ob.held || {}, o || {}); }
  function heldDraw(name, o, p) { const ob = OBJ[name]; if (!ob) return; const oo = heldOpts(name, o, p), g = gripOf(ob, oo), c = cx_(); c.save(); c.translate(-g[0], -g[1]); ob.draw(oo); c.restore(); }
  const DOIGTS = [[-13, -9], [9, -11], [12, -4], [12, 6], [6, 11], [-6, 11], [-13, 4]];
  const doigtsPaint = () => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(70,40,30,0.5)', 1); hatch(null, 0.9, 3.4, 0.15); };
  const has = (v) => v && v !== 'rien';
  function heldParts(skin, seed) {
    return {
      objet: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (has(p.tenu)) heldDraw(p.tenu, p.tenuO, p); } },
      doigts: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 2, pts: (p) => (has(p.tenu) ? DOIGTS : OFFP), paint: doigtsPaint },
      objetB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 3, pts: OFFP, extra: (p) => { if (has(p.tenuB)) heldDraw(p.tenuB, p.tenuBO, p); } },
      doigtsB0: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 4, pts: (p) => (has(p.tenuB) && !p._deux ? DOIGTS : OFFP), paint: doigtsPaint },
      doigtsB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 5, pts: (p) => (p._deux ? DOIGTS : OFFP), paint: doigtsPaint },
    };
  }
  // point nommé de l'objet tenu, en coordonnées écran
  PAP.pt = function (r, nom, arriere) {
    const name = arriere ? r.tenuB : r.tenu, ob = OBJ[name]; if (!ob || !ob.pts[nom]) return null;
    const oo = arriere ? r.tenuBO : r.tenuO, g = gripOf(ob, oo); let q = ob.pts[nom];
    if (name === 'soupape') q = nom === 'poids' ? [(oo.sens || 1) * lerp(-10, 62, oo.poids == null ? 0.7 : oo.poids), 4] : [q[0] * (oo.sens || 1), q[1]];
    if (name === 'os') { const L = osLine(clamp(oo.mou || 0)); if (nom === 'bout') q = [62, L[14][1]]; if (nom === 'boutB') q = [-62, L[0][1]]; if (nom === 'centre') q = [0, L[7][1]]; }
    return r.w(arriere ? 'objetB' : 'objet', q[0] - g[0], q[1] - g[1]);
  };
  PAP.main = (r, arriere) => r.w(arriere ? 'armB_lo' : 'armF_lo', 4, 96);

  // ================================================================== POSES — préparation commune
  function prep(p) { p = p || {}; return Object.assign({}, p, { ang: Object.assign({}, p.ang), hide: Object.assign({}, p.hide), face: Object.assign({}, p.face) }); }
  function toTorso(def, q, P_, x, y, s, dir) { const m = M.partMatrices(def, q, x, y, s, dir).mats.torso; const r = new DOMPoint(P_[0], P_[1]).matrixTransform(m.inverse()); return [r.x, r.y]; }
  function armTo(q, arm, T, k) {
    if (!(k > 0)) return;
    const sol = ik2(arm === 'armF' ? SH_F : SH_B, T), A = q.ang, a0 = A[arm + '_up'] || 0, b0 = A[arm + '_lo'] || 0;
    A[arm + '_up'] = a0 + normA(sol.a - a0) * k; A[arm + '_lo'] = b0 + normA(sol.b - b0) * k;
  }
  const faceDef = (q, k, f) => { if (k > 0.5) for (const n in f) if (q.face[n] == null) q.face[n] = f[n]; };
  const lp2 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
  // cible écran → repère du torse, corrigée d'un décalage objet (point nommé − prise, objet droit à l'écran)
  function cibleT(def, q, cible, x, y, s, dir, off, dflt) {
    if (!cible) return dflt;
    const T = toTorso(def, q, cible, x, y, s, dir); if (!off) return T;
    const tl = q.tilt || 0, ox = off[0], oy = off[1];                          // off en unités objet, écran-droit → repère torse (rotation −tilt)
    return [T[0] - (ox * Math.cos(tl) + oy * Math.sin(tl)), T[1] - (-ox * Math.sin(tl) + oy * Math.cos(tl))];
  }
  function offsetObj(name, oo, nom, rot) { const ob = OBJ[name]; if (!ob || !ob.pts[nom]) return [0, 0]; const g = gripOf(ob, oo || {}), q = ob.pts[nom]; const vx = q[0] - g[0], vy = q[1] - g[1], cr = Math.cos(rot || 0), sr = Math.sin(rot || 0); return [vx * cr - vy * sr, vx * sr + vy * cr]; }
  function marche(q, k, t) {
    if (!(k > 0)) return; const ph = t * 7.2, A = q.ang;
    A.legF = (A.legF || 0) + Math.sin(ph) * 0.3 * k; A.legB = (A.legB || 0) - Math.sin(ph) * 0.3 * k;
    A.armF_up = (A.armF_up || 0) - Math.sin(ph) * 0.12 * k; A.armB_up = (A.armB_up || 0) + Math.sin(ph) * 0.1 * k;
    A.armF_lo = (A.armF_lo || 0) - 0.2 * k; A.armB_lo = (A.armB_lo || 0) - 0.2 * k;
    q.dy = (q.dy || 0) - Math.abs(Math.sin(ph)) * 7 * k;
  }
  function finish(q) {
    const A = q.ang, tl = q.tilt || 0;
    if (has(q.tenu) && !(q.handF && q.handF !== 'fist')) q.handF = 'fist';
    if (has(q.tenuB) && !(q.handB && q.handB !== 'fist')) q.handB = 'fist';
    if (q.droit == null && has(q.tenu)) q.droit = true;
    if (q.droitB == null && has(q.tenuB)) q.droitB = true;
    if (q.droit) A.objet = (A.objet || 0) - ((A.armF_up || 0) + (A.armF_lo || 0) + tl);
    if (q.droitB) A.objetB = (A.objetB || 0) - ((A.armB_up || 0) + (A.armB_lo || 0) + tl);
    q._deux = false;
    if (q.deuxMains && has(q.tenu) && OBJ[q.tenu] && OBJ[q.tenu].p2) {
      const ob = OBJ[q.tenu], oo = heldOpts(q.tenu, q.tenuO, q), g = gripOf(ob, oo);
      const Hf = new DOMMatrix().translate(SH_F[0], SH_F[1]).rotate((A.armF_up || 0) * D).translate(0, LA).rotate((A.armF_lo || 0) * D).translate(4, 96).rotate((A.objet || 0) * D).translate(-g[0], -g[1]);
      const sol = ik2(SH_B, mp(Hf, ob.p2(oo)));
      A.armB_up = sol.a; A.armB_lo = sol.b; q.handB = 'fist'; q._deux = true;
    }
    return q;
  }
  function run(def, q, x, y, s, o) {
    const r = M.puppet(def, q, x, y, s, Object.assign({ slot: M.ST.slotF }, o || {}));
    r.q = q; r.tenu = q.tenu; r.tenuB = q.tenuB;
    if (has(q.tenu) && OBJ[q.tenu]) r.tenuO = heldOpts(q.tenu, q.tenuO, q);
    if (has(q.tenuB) && OBJ[q.tenuB]) r.tenuBO = heldOpts(q.tenuB, q.tenuBO, q);
    return r;
  }

  // ================================================================== PIÈCES DE CORPS
  const upDef = (at, base, seed) => ({ parent: 'torso', at, pts: armR(LA), base, seed, paint: () => hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.28) });
  function foreDef(parent, base, skin, back, seed, cuff) {
    const hk = (p) => (back ? p.handB : p.handF) || 'fist';
    return { parent, at: [0, LA], pts: (p) => foreR(hk(p)), base, seed, paint: (p) => {
      fillPts([[-20, 76, 1], [20, 76, 1], [24, 130, 1], [-20, 130, 1]], skin); X.handPaint(null, hk(p));
      if (cuff) fillPts([[-14, 64, 1], [14, 64, 1], [15, 78, 1], [-14, 78, 1]], cuff);
      hatch([[-14, -10], [-3, -10], [-3, 60], [-14, 60]], 0.9, 3.8, 0.22);
    } };
  }
  // parement large (1680) : manchette retournée plus large que la manche + dentelle au poignet
  const parDef = (parent, col, colD, seed) => ({ parent, at: [0, 0], noRivet: true, base: col, seed,
    pts: [[-17, 30], [0, 26], [17, 30], [18, 70, 1], [-16, 72, 1]],
    paint: () => { strokePts([[-15, 36], [16, 34]], colD, 1.6); hatch(null, 1.2, 3.6, 0.22); for (let y = 42; y < 70; y += 9) dot(12, y, 1.6, 'rgba(90,60,20,0.6)'); fillPts([[-12, 70], [12, 70], [14, 79], [8, 76], [4, 81], [-2, 77], [-7, 81], [-12, 77]], '#f1ebdc'); } });
  // jambes debout (legPts) ou assis (cuisse à l'horizontale, tibia vertical, pied pointe vers l'avant)
  const SEAT_LEG = [[-18, -14], [96, -17], [110, -12], [120, 0], [121, 40], [119, 96], [121, 104], [146, 110], [152, 120, 1], [150, 123, 1], [96, 123, 1], [96, 106], [98, 60], [97, 22], [86, 15], [-20, 14]];
  function legDef(at, cfg, seed, back) {
    return { parent: 'torso', at, seed, noRivet: !!back, base: cfg.culotte, pts: (p) => (p.assis ? SEAT_LEG : X.legPts(cfg.th || 0.95)),
      paint: (p) => {
        if (p.assis) {
          if (cfg.bas) fillPts([[100, 4, 1], [140, 4, 1], [140, 106, 1], [100, 106, 1]], back ? M.mixc(cfg.bas, '#000000', 0.18) : cfg.bas);
          fillPts([[90, 104, 1], [160, 104, 1], [160, 130, 1], [90, 130, 1]], cfg.soulier);
          if (cfg.boucle && !back) fillPts(rect(120, 104, 130, 110), '#c9c2b0');
          if (cfg.semelle) fillPts(rect(90, 119, 160, 130), cfg.semelle);
          hatch([[-20, -20], [100, -20], [100, -4], [-20, -4]], 0.2, 4, 0.22);
        } else {
          if (cfg.bas) fillPts([[-40, 116, 1], [60, 116, 1], [60, 216, 1], [-40, 216, 1]], back ? M.mixc(cfg.bas, '#000000', 0.18) : cfg.bas);
          fillPts([[-40, 214, 1], [60, 214, 1], [60, 260, 1], [-40, 260, 1]], cfg.soulier);
          if (cfg.semelle) fillPts(rect(-40, 231, 60, 260), cfg.semelle);
          if (cfg.boucle && !back) { fillPts(rect(14, 216, 26, 223), '#c9c2b0'); fillPts(rect(17, 218, 23, 221), cfg.soulier); }
          if (cfg.lacets && !back) for (const x of [16, 24, 32]) strokePts([[x, 216], [x + 3, 224]], 'rgba(120,120,120,0.7)', 1);
          if (cfg.couture) strokePts([[16, -8], [17, 100], [15, 210]], cfg.couture, 1.1);
          if (!back) hatch([[-26, -20], [-6, -20], [-6, 214], [-26, 214]], 0.8, 4, 0.25); else hatch(null, 0.8, 3.6, 0.3);
        }
      } };
  }
  function bodyFace(f, cfg) { X.eye(f, 17, -52); X.brow(f, 17, -61, cfg.sourcil || 'rgba(45,30,22,0.95)', 2.4); X.mouth(f, 27, -27); }

  // ================================================================== HOMMES DE 1680 (Papin, savants) : constructeur commun
  // perruques (repère de la tête) : contour + festons
  const WIG = {
    papin: { pts: [[24, -92], [12, -84], [6, -68], [2, -50, 1], [2, -36], [4, -14], [4, 16], [2, 56], [-2, 92], [-8, 110], [-16, 112], [-42, 106], [-62, 84], [-70, 44], [-70, 0], [-66, -40], [-58, -80], [-42, -106], [-18, -120], [6, -118], [18, -106]], amp: 6, step: 9, sans: [2, 3] },
    A: { pts: [[24, -92], [12, -86], [6, -70], [2, -50, 1], [2, -34], [6, -10], [10, 30], [12, 80], [8, 126, 1], [-8, 84], [-20, 60], [-30, 84], [-44, 124, 1], [-52, 80], [-60, 30], [-62, -20], [-58, -70], [-44, -102], [-20, -116], [6, -114], [18, -104]], amp: 4, step: 10, sans: [2, 3, 7, 8, 12, 13] },
    B: { pts: [[24, -92], [12, -86], [4, -70], [0, -52, 1], [2, -34], [-6, -14], [-28, -4], [-48, -10], [-58, -38], [-56, -78], [-40, -106], [-14, -118], [8, -112], [18, -102]], amp: 3, step: 8, sans: [2, 3] },
    C: { pts: [[24, -92], [12, -84], [6, -68], [2, -50, 1], [2, -36], [6, -10], [10, 22], [10, 52], [-6, 64], [-30, 62], [-52, 50], [-64, 20], [-66, -24], [-60, -70], [-44, -104], [-18, -118], [6, -116], [18, -104]], amp: 7, step: 11, sans: [2, 3] },
  };
  for (const k in WIG) WIG[k].poly = boucle(WIG[k].pts, WIG[k].amp, WIG[k].step, WIG[k].sans);
  function wigPaint(cfg) {
    const W = WIG[cfg.wig];
    return () => {
      const R = M.rng(cfg.seed);
      for (let i = 0; i < 70; i++) {                                              // boucles : spirales claires ombrées dessous
        const x = lerp(-66, 14, R()), y = lerp(-112, cfg.wig === 'B' ? 0 : 118, R()), r = 3 + R() * 3.5;
        strokePts(ep(x, y + 1, r, r * 0.75, 6, 0.2, 2.9), cfg.wigD, 1); strokePts(ep(x, y, r * 0.9, r * 0.7, 6, 3.3, 6.0), cfg.wigL, 1.1);
      }
      if (cfg.wig === 'B') for (const y of [-46, -26]) { fillPts(rrect(-50, y - 7, 2, y + 7, 7), cfg.wigL); strokePts([[-48, y + 4], [0, y + 4]], cfg.wigD, 1.2); for (let x = -44; x < 0; x += 9) strokePts(ep(x, y, 4, 6, 5, -1.2, 1.4), cfg.wigD, 0.9); }
      strokePts([[20, -102], [0, -112], [-26, -110]], cfg.wigL, 1.6);
      hatch(null, 0.9, 3.4, 0.22, 1, '30,20,10', [-80, -130, 30, 130]);
      shade(10, 0, -60, 0, 0.3, [-80, -130, 30, 130]);
    };
  }
  function mk1680(cfg) {
    const parts = {
      torso: { parent: null, at: [0, 0], base: cfg.habit, seed: cfg.seed, pts: (p) => (p.assis ? cfg.torsoAssis : cfg.torso), paint: (p) => {
        fillPts(cfg.veste, cfg.vesteCol);                                         // veste (gilet) visible dans l'ouverture
        for (let y = -140; y < (p.assis ? 0 : 30); y += 16) dot(cfg.boutonX, y, 2, cfg.bouton);
        strokePts(cfg.bord, cfg.bordCol, 3);                                      // bord de l'habit (doublure)
        if (!p.assis) { fillPts(cfg.poche, cfg.habitD); for (const dx of [6, 18, 30]) dot(cfg.poche[0][0] + dx, cfg.poche[0][1] + 6, 2, cfg.bouton); }
        fillPts(cfg.rabat, '#f1ebdc'); strokePts(cfg.rabat.slice(2, 5), 'rgba(150,140,120,0.6)', 1);
        hatch(cfg.dos, 0.75, 4.2, 0.3); shade(40, 0, -40, 0, 0.26);
        if (cfg.ventre) shade(cfg.ventre, -70, 0, -70, 0.2);
      } },
      legB: legDef([-6, -2], cfg.jambe, cfg.seed + 2, true),
      legF: legDef([6, -2], cfg.jambe, cfg.seed + 3, false),
      armB_up: upDef([-10, -146], cfg.habitD, cfg.seed + 4),
      armB_lo: foreDef('armB_up', cfg.habitD, cfg.peauD, true, cfg.seed + 5),
      parB: parDef('armB_lo', M.mixc(cfg.parement, '#000000', 0.15), cfg.habitD, cfg.seed + 6),
      head: { parent: 'torso', at: [6, -170], pts: X.NAP_HEAD, base: cfg.peau, seed: cfg.seed + 7, noRivet: true, paint: (p) => {
        const f = p.face || {};
        fillPts([[30, -96], [26, -82], [10, -82], [-20, -78], [-34, -60], [-40, -100]], cfg.crane);   // crâne rasé (visible si la perruque saute)
        hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.26);
        dot(14, -32, 8, cfg.joue || 'rgba(205,130,110,0.2)');
        if (cfg.rides) { strokePts([[8, -44], [12, -36]], 'rgba(90,50,40,0.45)', 1); strokePts([[18, -70], [28, -72]], 'rgba(90,50,40,0.35)', 1); }
        if (cfg.menton) strokePts([[6, 6], [18, 2], [26, -6]], 'rgba(120,70,50,0.5)', 1.3);
        if (cfg.rase) { fillPts([[4, -36], [14, -28], [24, -20], [30, -12], [24, -2], [12, 6], [2, -8]], 'rgba(90,95,110,0.16)'); strokePts([[30, -40], [34, -36]], 'rgba(120,70,50,0.5)', 1.2); }
        X.brow(f, 17, -61, cfg.sourcil || 'rgba(45,30,22,0.95)', cfg.sourcilLw || 2.4); X.eye(f, 17, -52); X.mouth(f, 27, -27);
        if (cfg.lunettes) { const ring = ell(19, -52, 10, 10, 14); fillPts(ring, 'rgba(190,225,240,0.25)', 0, 0); strokePts(ring.concat([ring[0]]), '#3a3028', 1.8); strokePts([[9, -53], [-2, -55]], '#3a3028', 1.4); strokePts([[14, -58], [20, -60]], 'rgba(255,255,255,0.7)', 1.2); }
      } },
      torsoFront: null,
      perruque: { parent: 'head', at: [0, 0], noRivet: true, base: cfg.wigCol, seed: cfg.seed + 8,
        pts: (p) => { const sj = clamp(p.saut || 0), dy = -16 * sj, rot = -0.08 * sj; return WIG[cfg.wig].poly.map((q) => { const x = q[0] + 20, y = q[1]; const xr = x * Math.cos(rot) - y * Math.sin(rot) - 20, yr = x * Math.sin(rot) + y * Math.cos(rot); return q[2] ? [xr, yr + dy, 1] : [xr, yr + dy]; }); },
        paint: wigPaint(cfg) },
      armF_up: upDef([-2, -146], cfg.habit, cfg.seed + 9),
      armF_lo: foreDef('armF_up', cfg.habit, cfg.peau, false, cfg.seed + 10),
      parF: parDef('armF_lo', cfg.parement, cfg.habitD, cfg.seed + 11),
    };
    delete parts.torsoFront;
    Object.assign(parts, heldParts(cfg.peau, cfg.seed + 20));
    return { hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] },
      order: ['armB_up', 'armB_lo', 'parB', 'objetB', 'doigtsB0', 'legB', 'legF', 'head', 'torso', 'perruque', 'armF_up', 'armF_lo', 'parF', 'objet', 'doigts', 'doigtsB'] };
  }
  const T1680 = (fx, bx, low) => [[-14, -178], [8, -182], [18, -170], [30, -150], [fx * 0.92, -116], [fx, -80], [fx, -40], [fx - 2, -6], [fx + 2, 40], [fx + 8, 90], [fx + 12, low, 1], [bx - 4, low + 4, 1], [bx + 2, 70], [bx + 6, 20], [bx + 8, -30], [bx + 8, -90], [bx + 10, -140], [-30, -166]];
  const T1680A = (fx, bx) => [[-14, -178], [8, -182], [18, -170], [30, -150], [fx * 0.92, -116], [fx, -80], [fx, -40], [fx - 2, -6], [fx + 4, 24], [fx + 6, 36, 1], [bx - 2, 38, 1], [bx + 4, 20], [bx + 8, -30], [bx + 8, -90], [bx + 10, -140], [-30, -166]];
  const ventre = (T) => T.map((p) => { if (p[0] <= 10 || p[1] < -150 || p[1] > 50) return p; const b = 26 * Math.exp(-Math.pow((p[1] + 50) / 70, 2)); return [p[0] + b, p[1]]; });
  function cfg1680(o) {
    const fx = o.fx || 42, bx = o.bx || -48;
    return Object.assign({
      torso: o.ventre ? ventre(T1680(fx, bx, o.low || 114)) : T1680(fx, bx, o.low || 114), torsoAssis: o.ventre ? ventre(T1680A(fx, bx)) : T1680A(fx, bx),
      veste: [[22, -170], [30, -150], [fx * 0.92, -116], [fx, -80], [fx, -40], [fx - 2, -6], [fx + 2, 30], [fx - 10, 34], [fx - 12, -6], [fx - 14, -60], [16, -120], [14, -160]],
      boutonX: fx - 6, bord: [[16, -150], [fx - 14, -100], [fx - 12, -20], [fx - 10, 40], [fx - 2, 112]],
      poche: [[fx - 44, 30], [fx - 4, 28], [fx - 2, 44], [fx - 44, 46]],
      rabat: [[14, -180], [26, -174], [34, -156], [34, -126], [20, -122], [18, -154]],
      dos: [[-60, -170], [-14, -170], [-12, 130], [-60, 130]], peauD: '#c9a07c', peau: '#e2c3a0', crane: '#8d8478', bouton: LAITL,
      jambe: { th: 0.95, culotte: '#5b4532', bas: '#8e8c88', soulier: '#211c1a', boucle: true },
    }, o);
  }
  const PAPIN = cfg1680({ seed: 9100, habit: '#2E3A55', habitD: '#232c42', vesteCol: '#6e5a3a', bordCol: '#B8893A', parement: '#B8893A', wig: 'papin', wigCol: '#6b4a2e', wigD: '#3e2a1a', wigL: '#9a7650', menton: true, rase: true, sourcil: 'rgba(60,36,20,0.95)', sourcilLw: 3.2 });
  const SAV_A = cfg1680({ seed: 9200, fx: 34, bx: -40, low: 118, habit: '#7A2E2E', habitD: '#5e2222', vesteCol: '#c9b48a', bordCol: '#4a1a1a', parement: '#4e1c1c', wig: 'A', wigCol: '#a9a59c', wigD: '#6e6a62', wigL: '#d6d2c8', rides: true, jambe: { th: 0.85, culotte: '#3a2a26', bas: '#d8d2c4', soulier: '#211c1a', boucle: true } });
  const SAV_B = cfg1680({ seed: 9300, fx: 48, bx: -50, low: 104, ventre: 66, habit: '#55684A', habitD: '#435338', vesteCol: '#d9cba2', bordCol: '#2f3a28', parement: '#3a4830', wig: 'B', wigCol: '#ece8de', wigD: '#b8b2a4', wigL: '#ffffff', menton: true, joue: 'rgba(210,110,100,0.35)', jambe: { th: 1.05, culotte: '#2f3a28', bas: '#e8e2d4', soulier: '#2a1e18', boucle: true } });
  const SAV_C = cfg1680({ seed: 9400, habit: '#A9824A', habitD: '#87683a', vesteCol: '#5a3a2a', bordCol: '#6b4a24', parement: '#6b4a24', wig: 'C', wigCol: '#2a2420', wigD: '#0f0c0a', wigL: '#5a5048', lunettes: true, jambe: { th: 0.95, culotte: '#6b4a24', bas: '#6e6a62', soulier: '#1c1816', boucle: true } });
  CH.papPapin = mk1680(PAPIN); CH.papSavantA = mk1680(SAV_A); CH.papSavantB = mk1680(SAV_B); CH.papSavantC = mk1680(SAV_C);

  // ---- Papin : gestes
  PAP.papinPose = function (p, x, y, s, dir) {
    const q = prep(p), A = q.ang, t = q.t || 0, def = CH.papPapin; x = x || 0; y = y || 0; s = s || 0.9; dir = dir || 1;
    const k = (n) => ease(clamp(q[n] || 0));
    if (q.assis) { q.dy = (q.dy || 0) + 118; if (A.armB_up == null) { armTo(q, 'armB', [64, -8], 1); if (q.handB == null) q.handB = 'open'; } if (A.armF_up == null && !q.ecrire) { armTo(q, 'armF', [78, -10], 1); if (q.handF == null) q.handF = 'open'; } }
    marche(q, q.marche ? 1 : 0, t);
    const rc = k('recul'); if (rc > 0) { q.tilt = (q.tilt || 0) - 0.14 * rc; q.dx = (q.dx || 0) - 12 * rc; A.head = (A.head || 0) - 0.15 * rc; faceDef(q, rc, { eyes: 'wide', brow: 'up', mouth: 'o' }); }
    // la main du geste
    const ten = k('tenir'); if (ten > 0) { armTo(q, 'armF', [96, -48], ten); if (q.deuxMains == null && has(q.tenu) && OBJ[q.tenu].p2) q.deuxMains = true; if (!q.deuxMains) armTo(q, 'armB', [56, -46], ten); }
    const vs = k('verser'); if (vs > 0) { armTo(q, 'armF', [76, -118], vs); A.objet = (A.objet || 0) + 1.0 * vs; if (q.deuxMains == null && q.tenu === 'broc') q.deuxMains = true; }
    const vi = k('visser'); if (vi > 0) {
      const T = cibleT(def, q, q.cible, x, y, s, dir, null, [86, -150]);
      armTo(q, 'armF', [T[0] + 5 * Math.cos(t * 9), T[1] + 3 * Math.sin(t * 9)], vi);
      armTo(q, 'armB', cibleT(def, q, q.cibleB, x, y, s, dir, null, [70, -118]), vi); if (q.handB == null) q.handB = 'open';
    }
    if (rc > 0) { armTo(q, 'armF', [108, -184], rc); armTo(q, 'armB', [90, -198], rc); if (q.handF == null) q.handF = 'open'; if (q.handB == null) q.handB = 'open'; }
    const ch = k('chaud'); if (ch > 0) { armTo(q, 'armF', [30 + 3 * Math.sin(t * 27), -150 + 5 * Math.sin(t * 31)], ch); if (q.handF == null) q.handF = 'open'; faceDef(q, ch, { eyes: 'closed', mouth: 'o', brow: 'worry' }); q.tilt = (q.tilt || 0) - 0.05 * ch; }
    const fr = k('frotte'); if (fr > 0) { const w = Math.sin(t * 14) * 6; armTo(q, 'armF', [56 + w, -112], fr); armTo(q, 'armB', [50 - w, -108], fr); if (q.handF == null) q.handF = 'open'; if (q.handB == null) q.handB = 'open'; faceDef(q, fr, { mouth: 'smile' }); A.head = (A.head || 0) - 0.06 * fr; }
    const ec = k('ecrire'); if (ec > 0) {
      if (q.tenu == null) q.tenu = 'plume'; if (q.tenu === 'plume') A.objet = (A.objet || 0) + 0.55;
      const T = cibleT(def, q, q.cible, x, y, s, dir, offsetObj('plume', q.tenuO, 'bec', 0.55), [88, -70]);
      armTo(q, 'armF', [T[0] + 3 * Math.sin(t * 11), T[1] + 1.5 * Math.sin(t * 23)], ec); armTo(q, 'armB', [72, -70], ec); if (q.handB == null) q.handB = 'open';
      A.head = (A.head || 0) + 0.28 * ec;
    }
    const bo = k('bourse'); if (bo > 0) { if (q.tenu == null) q.tenu = 'bourse'; q.tenuO = Object.assign({ retourne: 1 }, q.tenuO); armTo(q, 'armF', [74, -126], bo); armTo(q, 'armB', [70, -66], bo); if (q.handB == null) q.handB = 'open'; faceDef(q, bo, { brow: 'worry', mouth: 'tight' }); A.head = (A.head || 0) - 0.04 * bo; }
    const rq = k('reclame'); if (rq > 0) { const u = ease(clamp(q.paume == null ? 0 : q.paume)); armTo(q, 'armF', lp2([22, -120], [96, -104], u), rq); if (q.handF == null) q.handF = 'open'; A.head = (A.head || 0) - 0.06 * rq; }
    return finish(q);
  };
  PAP.papin = (pose, x, y, s, o) => { s = s == null ? 0.9 : s; const dir = (o && o.dir) || 1; return run(CH.papPapin, PAP.papinPose(pose, x, y, s, dir), x, y, s, o); };

  // ---- savants : gestes communs
  function savantPose(def) {
    return function (p, x, y, s, dir) {
      const q = prep(p), A = q.ang, t = q.t || 0; x = x || 0; y = y || 0; s = s || 0.9; dir = dir || 1;
      const k = (n) => ease(clamp(q[n] || 0));
      if (q.assis) { q.dy = (q.dy || 0) + 118; if (A.armB_up == null) { armTo(q, 'armB', [64, -8], 1); if (q.handB == null) q.handB = 'open'; } if (A.armF_up == null) { armTo(q, 'armF', [78, -10], 1); if (q.handF == null) q.handF = 'open'; } }
      marche(q, q.marche ? 1 : 0, t);
      const fo = k('fourchette'); if (fo > 0) {
        if (q.tenu == null) q.tenu = 'fourchette'; A.objet = (A.objet || 0) + PI * fo;
        const pq = ease(clamp(q.pique || 0)), T = cibleT(def, q, q.cible, x, y, s, dir, offsetObj('fourchette', q.tenuO, 'pointe', PI), [84, -60]);
        armTo(q, 'armF', [T[0], T[1] - 26 * (1 - pq)], fo);
      }
      const go = k('goute'); if (go > 0) { if (q.tenu == null) q.tenu = 'fourchette'; q.tenuO = Object.assign({ bouchee: true }, q.tenuO); A.objet = (A.objet || 0) - 0.35 * go; armTo(q, 'armF', [74, -100], go); faceDef(q, go, { eyes: 'closed', mouth: 'smile' }); A.head = (A.head || 0) - 0.1 * go; }
      const ve = k('verre'); if (ve > 0) { if (q.tenu == null) q.tenu = 'verre'; armTo(q, 'armF', [100, -196], ve); faceDef(q, ve, { mouth: 'smile', brow: 'up' }); A.head = (A.head || 0) - 0.08 * ve; }
      const su = k('surpris'); if (su > 0) { if (!q.assis) q.tilt = (q.tilt || 0) - 0.08 * su; A.head = (A.head || 0) - 0.12 * su; faceDef(q, su, { eyes: 'wide', brow: 'up', mouth: 'o' }); if (!has(q.tenu)) { armTo(q, 'armF', [110, -140], su); if (q.handF == null) q.handF = 'open'; } armTo(q, 'armB', [94, -150], su); if (q.handB == null) q.handB = 'open'; }
      return finish(q);
    };
  }
  PAP.savantAPose = savantPose(CH.papSavantA); PAP.savantBPose = savantPose(CH.papSavantB); PAP.savantCPose = savantPose(CH.papSavantC);
  const SAV_S = { A: 0.98, B: 0.8, C: 0.88 };
  for (const L of ['A', 'B', 'C']) PAP['savant' + L] = (pose, x, y, s, o) => { s = s == null ? SAV_S[L] : s; const dir = (o && o.dir) || 1; return run(CH['papSavant' + L], PAP['savant' + L + 'Pose'](pose, x, y, s, dir), x, y, s, o); };

  // ================================================================== PAPIN DE DOS (sortie vers le fond)
  function mkPapinDos() {
    const C = PAPIN, legPaint = () => { fillPts(rect(-20, 116, 20, 214), C.jambe.bas); fillPts(rect(-20, 214, 20, 245), C.jambe.soulier); fillPts(rect(-9, 226, 9, 240), '#5a3a22'); hatch(null, 0.8, 3.8, 0.25); };
    const LEG = [[-13, -12], [13, -12], [12, 110], [10, 200], [12, 226], [13, 238, 1], [-13, 238, 1], [-12, 226], [-10, 200], [-12, 110]];
    const ARM = [[-12, -14], [12, -14], [13, 70], [12, 104], [16, 112], [12, 128], [0, 134], [-10, 128], [-14, 112], [-12, 70]];
    const armPaint = (col) => () => { fillPts([[-18, 50], [18, 50], [20, 98], [-18, 100]], col); fillPts(rect(-20, 100, 20, 140), C.peauD); hatch(null, 0.9, 3.6, 0.25); };
    const parts = {
      legL: { parent: 'torso', at: [-14, -2], pts: LEG, base: C.jambe.culotte, seed: 9501, paint: legPaint },
      legR: { parent: 'torso', at: [14, -2], pts: LEG, base: C.jambe.culotte, seed: 9502, paint: legPaint },
      torso: { parent: null, at: [0, 0], base: C.habit, seed: 9503, pts: [[-40, -172], [40, -172], [44, -140], [40, -60], [38, -8], [46, 60], [54, 114, 1], [-54, 114, 1], [-46, 60], [-38, -8], [-40, -60], [-44, -140]],
        paint: () => { strokePts([[0, 10], [0, 114]], 'rgba(10,14,24,0.7)', 2); for (const y of [16, 34]) { dot(-6, y, 2.2, LAITL); dot(6, y, 2.2, LAITL); } strokePts([[-38, -8], [38, -8]], 'rgba(10,14,24,0.4)', 1.4); hatch(null, 0.75, 4.2, 0.25); shade(-40, 0, 40, 0, 0.2); } },
      armL: { parent: 'torso', at: [-40, -146], pts: ARM, base: C.habitD, seed: 9504, paint: armPaint(C.parement) },
      armR: { parent: 'torso', at: [40, -146], pts: ARM, base: C.habitD, seed: 9505, paint: armPaint(C.parement) },
      perruque: { parent: 'torso', at: [0, -176], noRivet: true, base: C.wigCol, seed: 9506,
        pts: boucle([[-36, -110], [-10, -124], [10, -124], [36, -110], [52, -60], [58, 0], [56, 60], [44, 92], [0, 98], [-44, 92], [-56, 60], [-58, 0], [-52, -60]], 6, 10),
        paint: () => { const R = M.rng(951); for (let i = 0; i < 50; i++) { const x = lerp(-50, 50, R()), y = lerp(-110, 90, R()), r = 4 + R() * 4; strokePts(ep(x, y, r, r * 0.8, 6, 0.3, 4.4), C.wigD, 1.2); strokePts(ep(x - 1, y - 1, r * 0.6, r * 0.5, 4, 3.6, 5.4), C.wigL, 1); } strokePts([[0, -122], [0, -80]], C.wigD, 1.6); hatch(null, 0.9, 3.4, 0.2); } },
    };
    return { hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [0, 30] }, libre: { armF: 1, armB: 1, legF: 1, legB: 1 }, order: ['legL', 'legR', 'armL', 'armR', 'torso', 'perruque'] };
  }
  CH.papPapinDos = mkPapinDos();
  PAP.papinDos = (pose, x, y, s, o) => {
    const q = prep(pose), A = q.ang, t = q.t || 0, ph = t * 7.2;
    if (q.marche) { A.legL = (A.legL || 0) + Math.sin(ph) * 0.1; A.legR = (A.legR || 0) - Math.sin(ph) * 0.1; A.armL = (A.armL || 0) - Math.sin(ph) * 0.07; A.armR = (A.armR || 0) + Math.sin(ph) * 0.07; q.dy = (q.dy || 0) - Math.abs(Math.sin(ph)) * 7; }
    return run(CH.papPapinDos, q, x, y, s == null ? 0.9 : s, o);
  };

  // ================================================================== CUISINIER D'AUJOURD'HUI
  const CU = { peau: '#dcb894', peauD: '#bf9a76', pull: '#7C8F6A', pullD: '#647556', cheveux: '#3b2a1e', barbe: '#4a3424', jean: '#6d88a6', jeanD: '#56708c', ardoise: '#4f6276', ivoire: '#ece4d0' };
  function mkCuisinier() {
    const TORSO = [[-14, -176], [8, -180], [18, -170], [28, -150], [34, -112], [36, -60], [36, -10], [34, 14], [30, 26, 1], [-36, 28, 1], [-38, 0], [-38, -60], [-37, -110], [-33, -150], [-26, -168]];
    const TAB = [[14, -150], [30, -150], [36, -112], [40, -60], [42, 0], [46, 60], [48, 120, 1], [-6, 122, 1], [-12, 60], [-8, 0], [2, -60], [8, -112]];
    const parts = {
      torso: { parent: null, at: [0, 0], pts: TORSO, base: CU.pull, seed: 9601, paint: () => {
        fillPts([[4, -184], [16, -172], [10, -164], [0, -172]], CU.pullD); for (let y = 16; y < 28; y += 4) strokePts([[-36, y], [34, y]], 'rgba(40,50,30,0.3)', 1);
        hatch([[-50, -170], [-12, -170], [-10, 30], [-50, 30]], 0.75, 4.2, 0.3); shade(40, 0, -40, 0, 0.24);
      } },
      tablier: { parent: 'torso', at: [0, 0], pts: TAB, base: CU.ivoire, seed: 9602, noRivet: true, paint: () => {
        for (let x = -14; x < 52; x += 12) fillPts([[x, -160, 1], [x + 6, -160, 1], [x + 6, 130, 1], [x, 130, 1]], CU.ardoise);
        hatch(null, 0.3, 5, 0.12); shade(48, 0, -10, 0, 0.2, [-20, -160, 60, 130]);
      }, extra: () => { strokePts([[14, -150], [2, -178]], CU.ivoire, 3); strokePts([[-6, -18], [-40, -16]], CU.ivoire, 3); } },
      legB: legDef([-6, -2], { th: 0.95, culotte: CU.jeanD, soulier: '#e8e6e0', semelle: '#9a9a96', couture: 'rgba(200,170,90,0.6)' }, 9603, true),
      legF: legDef([6, -2], { th: 0.95, culotte: CU.jean, soulier: '#f2f0ea', semelle: '#a6a6a2', lacets: true, couture: 'rgba(200,170,90,0.7)' }, 9604, false),
      armB_up: upDef([-10, -146], CU.pullD, 9605),
      armB_lo: foreDef('armB_up', CU.pullD, CU.peauD, true, 9606, M.mixc(CU.pullD, '#000000', 0.15)),
      head: { parent: 'torso', at: [6, -170], pts: X.NAP_HEAD, base: CU.peau, seed: 9607, noRivet: true, paint: (p) => {
        const f = p.face || {};
        fillPts([[34, -84], [38, -100, 1], [26, -94], [24, -114, 1], [12, -102], [4, -124, 1], [-6, -106], [-20, -120, 1], [-24, -102], [-40, -108, 1], [-38, -90], [-52, -84, 1], [-40, -72], [-48, -58, 1], [-36, -56], [-32, -46, 1], [-24, -60], [-14, -74], [4, -80], [22, -78]], CU.cheveux, 3);
        for (const [a, b] of [[[20, -96], [6, -88]], [[2, -110], [-8, -94]], [[-22, -110], [-26, -92]], [[-38, -96], [-34, -78]]]) strokePts([a, b], 'rgba(150,110,80,0.6)', 1.4);
        X.earPaint(-8, -44);
        fillPts([[-4, -52], [2, -42], [10, -34], [16, -36], [22, -32], [32, -24], [34, -14], [28, -6], [18, -2], [8, 4], [-4, -6], [-12, -22], [-14, -40]], CU.barbe, 4);
        hatch([[-14, -52], [34, -52], [34, 6], [-14, 6]], 0.4, 2.6, 0.25, 1, '20,10,5');
        strokePts([[22, -33], [30, -30]], CU.barbe, 2.6);
        X.eye(f, 17, -52); X.brow(f, 17, -61, 'rgba(40,26,18,0.95)', 2.6); X.mouth(f, 27, -27, 'rgba(150,70,60,0.95)');
      } },
      armF_up: upDef([-2, -146], CU.pull, 9608),
      armF_lo: foreDef('armF_up', CU.pull, CU.peau, false, 9609, CU.pullD),
    };
    Object.assign(parts, heldParts(CU.peau, 9620));
    return { hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] },
      order: ['armB_up', 'armB_lo', 'objetB', 'doigtsB0', 'legB', 'legF', 'head', 'torso', 'tablier', 'armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsB'] };
  }
  CH.papCuisinier = mkCuisinier();
  PAP.cuisinierPose = function (p, x, y, s, dir) {
    const q = prep(p), A = q.ang, t = q.t || 0, def = CH.papCuisinier; x = x || 0; y = y || 0; s = s || 0.9; dir = dir || 1;
    const k = (n) => ease(clamp(q[n] || 0));
    marche(q, q.marche ? 1 : 0, t);
    const sr = k('sursaut'); if (sr > 0) { q.tilt = (q.tilt || 0) - 0.16 * sr; q.dx = (q.dx || 0) - 18 * sr; q.dy = (q.dy || 0) - 14 * sr; A.head = (A.head || 0) + 0.06 * sr; faceDef(q, sr, { eyes: 'wide', brow: 'up', mouth: 'o' }); }
    const re = k('remue'); if (re > 0) {
      if (q.tenu == null) q.tenu = 'cuillere';
      const T = cibleT(def, q, q.cible, x, y, s, dir, offsetObj('cuillere', q.tenuO, 'bout'), [90, -60]);
      armTo(q, 'armF', [T[0] + 9 * Math.cos(t * 6), T[1] + 3 * Math.sin(t * 6)], re); A.head = (A.head || 0) + 0.12 * re;
    }
    if (sr > 0) { armTo(q, 'armF', [70, -150], sr); armTo(q, 'armB', [50, -160], sr); if (q.handF == null) q.handF = 'open'; if (q.handB == null) q.handB = 'open'; }
    const ep_ = k('epaules'); if (ep_ > 0) { armTo(q, 'armF', [58, -44], ep_); armTo(q, 'armB', [46, -46], ep_); if (q.handF == null) q.handF = 'open'; if (q.handB == null) q.handB = 'open'; A.head = (A.head || 0) + 0.12 * ep_; q.dy = (q.dy || 0) - 3 * ep_; faceDef(q, ep_, { brow: 'up', mouth: 'tight' }); }
    const pr = k('presente'); if (pr > 0) { armTo(q, 'armF', [120, -118], pr); if (q.handF == null) q.handF = 'open'; q.tilt = (q.tilt || 0) - 0.04 * pr; A.head = (A.head || 0) - 0.1 * pr; faceDef(q, pr, { mouth: 'smile' }); }
    const rg = k('regarde'); if (rg > 0) { A.head = (A.head || 0) - 0.42 * rg; q.tilt = (q.tilt || 0) - 0.03 * rg; }
    return finish(q);
  };
  PAP.cuisinier = (pose, x, y, s, o) => { s = s == null ? 0.9 : s; const dir = (o && o.dir) || 1; return run(CH.papCuisinier, PAP.cuisinierPose(pose, x, y, s, dir), x, y, s, o); };

  // ================================================================== ACCESSOIRES SEULS (M.puppet à une pièce invisible : ombre portée possible)
  const accDefs = {};
  function accDef(name, fn) { return accDefs[name] || (accDefs[name] = { hipY: 0, handLen: 10, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => fn(p.o) } }, order: ['o'] }); }
  function accDraw(name, draw, x, y, s, o, sDef) {
    o = o || {}; s = s == null ? (sDef || 0.9) : s;
    return M.puppet(accDef(name, draw), { o, tilt: o.rot || 0 }, x, y, s, { dir: o.dir || 1, rod: false, slot: o.slot != null ? o.slot : y + 6 * s, floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
  }
  for (const n of Object.keys(OBJ)) PAP[n] = (x, y, s, o) => accDraw(n, (oo) => { const ob = OBJ[n], c = cx_(); c.save(); c.translate(-ob.base[0], -ob.base[1]); ob.draw(oo); c.restore(); }, x, y, s, o);

  // ---- LE DIGESTEUR (repère : bas des pieds), ≈ 205 de haut à s 1
  const DIG = { vis: [0, -196], etrier: [66, -150], soupape: [-25, -150], couvercle: [0, -138], bouche: [0, -120], base: [0, 0], anse: [74, -112] };
  function digBody(g) { const b = 11 * g; return [[-50, -12], [-62, -28], [-68 - b, -60], [-66 - b * 0.7, -94], [-60, -112], [60, -112], [66 + b * 0.7, -94], [68 + b, -60], [62, -28], [50, -12], [0, -6]]; }
  function drawDigesteur(o) {
    const c = cx_(), t = o.t || 0, tr = clamp(o.tremble || 0), g = clamp(o.gonfle || 0), jet = clamp(o.jet || 0), rouge = clamp(o.rouge || 0), vis = clamp(o.vis == null ? 1 : o.vis);
    c.save();
    if (tr > 0) c.translate((Math.sin(t * 47) * 1.6 + Math.sin(t * 31) * 0.9) * tr, -Math.abs(Math.sin(t * 53)) * 1.4 * tr);
    if (rouge > 0 && !SIL()) { const gr = c.createRadialGradient(0, -6, 4, 0, -6, 110); gr.addColorStop(0, `rgba(255,120,40,${0.55 * rouge})`); gr.addColorStop(1, 'rgba(255,90,30,0)'); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = gr; c.fillRect(-120, -100, 240, 130); c.restore(); }
    for (const fx of [-44, 44]) pc([[fx - 9, -16], [fx + 9, -16], [fx + 7, 0, 1], [fx - 7, 0, 1]], FERD, null, 8001 + fx);
    pc([[-8, -14], [8, -14], [7, 2, 1], [-7, 2, 1]], FER, null, 8003);
    pc(digBody(g), FER, () => {
      for (const y of [-34, -84]) strokePts([[-70, y], [70, y]], 'rgba(20,20,18,0.6)', 3);
      for (const y of [-34, -84]) for (let x = -56; x <= 56; x += 16) dot(x, y, 2, 'rgba(120,118,112,0.8)');
      strokePts([[30, -100], [38, -60], [30, -22]], 'rgba(220,220,210,0.35)', 3);
      hatch([[-80, -120], [-10, -120], [-10, 0], [-80, 0]], 0.8, 3.4, 0.35); shade(40, 0, -60, 0, 0.35, [-90, -130, 90, 10]);
      if (rouge > 0) { fillPts([[-80, -40], [80, -40], [80, 0], [-80, 0]], `rgba(200,60,20,${0.3 * rouge})`); fillPts([[-80, -20], [80, -20], [80, 0], [-80, 0]], `rgba(255,120,40,${0.3 * rouge})`); }
      if (g > 0.3) for (const [x, y] of [[-40, -70], [46, -54]]) strokePts([[x, y], [x + 6, y + 8], [x + 2, y + 16]], `rgba(255,160,90,${g * 0.7})`, 1.4);
    }, 8004);
    for (const sx of [-1, 1]) pc([[sx * 60, -104], [sx * 80, -106], [sx * 80, -118], [sx * 60, -120]], FERD, () => dot(sx * 74, -112, 3, '#7a7870'), 8005 + sx);
    pc(rect(-68, -122, 68, -112), FERL, () => strokePts([[-66, -120], [66, -120]], 'rgba(255,255,255,0.25)', 1.2), 8008);
    if (o.ouvert) {
      if (!SIL()) { fillPts(ell(0, -121, 58, 6, 14), '#141312'); }
      if (o.os) { c.save(); c.beginPath(); c.rect(-200, -400, 400, 279); c.clip(); for (const [x, a, sc] of [[-26, -0.45, 0.6], [6, 0.12, 0.66], [30, 0.6, 0.56]]) { c.save(); c.translate(x, -112); c.rotate(-PI / 2 + a); c.scale(sc, sc); c.translate(62, 0); drawOs({ mou: o.mou || 0, fromage: o.fromage || 0 }); c.restore(); } c.restore(); }
      c.save(); c.translate(-48, -74); c.rotate(PI / 2 - 0.1); drawCouvercle(o, true); c.restore();
      vapeur(t, { x: 0, y: -126, k: jet, haut: 140, r: 26, n: 6, per: 2.2, seed: 81, vent: 14 });
    } else {
      const lift = -8 * g - (jet > 0.5 ? Math.abs(Math.sin(t * 22)) * 1.5 * jet : 0);
      c.save(); c.translate(0, lift); drawCouvercle(o, false);
      // étrier : arceau de fer qui passe par-dessus, vis à volant au centre
      const ARC = qbez([-74, -112], [-74, -196], [0, -184], 10).concat(qbez([0, -184], [74, -196], [74, -112], 10).slice(1));
      pc(ribbonW(ARC, 10), FERD, () => strokePts(ARC.map((p) => [p[0], p[1] - 2]), 'rgba(160,158,150,0.35)', 1.2), 8010);
      const top = -196 - 18 * (1 - vis);
      pc(rect(-5, top, 5, -140), FERL, () => { for (let y = top + 4; y < -140; y += 5) strokePts([[-5, y], [5, y + 2]], 'rgba(20,20,18,0.6)', 1); }, 8011);
      const ph = vis * 9 + (o.tourne || 0), w = 34 * Math.abs(Math.cos(ph)) + 6;
      pc(rrect(-w, top - 8, w, top, 3), FER, () => strokePts([[-w + 2, top - 6], [w - 2, top - 6]], 'rgba(220,220,210,0.4)', 1.2), 8012);
      for (const sx of [-1, 1]) pc(ell(sx * w, top - 4, 6.5, 6.5, 10), FER, () => dot(sx * w - 2, top - 6, 2, 'rgba(220,220,210,0.6)'), 8013 + sx);
      pc(ell(0, top - 4, 7, 7, 10), FERD, null, 8016);
      if (o.soupape) {
        pc([[-17, -138], [-9, -138], [-10, -156, 1], [-16, -156, 1]], FERD, null, 8017);           // montant du pivot
        pc(rect(-31, -146, -19, -138), LAITD, null, 8018);                                        // siège du clapet
        c.save(); c.translate(-12, -152); c.rotate(-(0.06 * jet + 0.03 * jet * Math.sin(t * 30))); c.scale(0.72, 0.72); c.translate(-70, 0);
        drawSoupape({ sens: -1, poids: o.poids == null ? 0.7 : o.poids }); c.restore();
      }
      c.restore();
      if (o.soupape) vapeur(t, { x: -25, y: -160, k: jet, haut: 240, r: 46, n: 10, per: 1.1, seed: 82, vent: -24 });
      if (g > 0.4) for (const sx of [-1, 1]) vapeur(t, { x: sx * 64, y: -126, k: (g - 0.4) * 1.4, haut: 70, r: 12, n: 4, per: 0.8, seed: 83 + sx, vent: sx * 34 });
    }
    c.restore();
  }
  function drawCouvercle(o, pose) {
    pc([[-66, -122], [-60, -132], [-36, -139], [0, -142], [36, -139], [60, -132], [66, -122]], FER, () => { strokePts([[-40, -136], [0, -140], [30, -137]], 'rgba(200,200,190,0.35)', 2); hatch(null, 0.6, 3.4, 0.3); }, 8020);
    if (pose) pc(ell(0, -144, 8, 4, 8), FERD, null, 8021);
  }
  PAP.digesteur = (x, y, s, o) => accDraw('digesteur', drawDigesteur, x, y, s, o, 1);
  PAP.DIG = DIG;
  PAP.digPt = (nom, x, y, s, o) => { o = o || {}; s = s == null ? 1 : s; const d = o.dir || 1; let q = DIG[nom] || [0, 0]; if (nom === 'vis') q = [0, -196 - 18 * (1 - clamp(o.vis == null ? 1 : o.vis)) - 8]; if (nom === 'poids') q = [-12 - 0.72 * (70 + lerp(-10, 62, o.poids == null ? 0.7 : o.poids)), -150]; return [x + d * s * q[0], y + s * q[1]]; };

  // ---- LA COCOTTE D'AUJOURD'HUI (repère : fond), ≈ 172 de haut, 252 de large avec les poignées, à s 1
  const COC = { soupape: [0, -186], poignee: [100, -104], poigneeB: [-100, -104], couvercle: [0, -132], base: [0, 0] };
  function drawCocotte(o) {
    const c = cx_(), t = o.t || 0, si = clamp(o.siffle || 0), br = clamp(o.brille || 0), va = clamp(o.vapeur || 0);
    c.save(); if (si > 0) c.translate(Math.sin(t * 43) * 1.3 * si, -Math.abs(Math.sin(t * 37)) * 1.2 * si);
    const INOX = '#C9D1D8';
    for (const sx of [-1, 1]) pc(rrect(sx > 0 ? 74 : -108, -112, sx > 0 ? 108 : -74, -96, 7), '#1e1e20', () => strokePts([[sx * 96, -109], [sx * 120, -109]], 'rgba(255,255,255,0.25)', 1.2), 8101 + sx);
    pc([[-80, -118], [80, -118], [82, -20], [76, -6], [60, 0, 1], [-60, 0, 1], [-76, -6], [-82, -20]], INOX, () => {
      const g = c.createLinearGradient(-96, 0, 96, 0); g.addColorStop(0, 'rgba(70,90,110,0.45)'); g.addColorStop(0.3, 'rgba(255,255,255,0.35)'); g.addColorStop(0.42, 'rgba(120,140,160,0.1)'); g.addColorStop(0.75, 'rgba(255,255,255,0.25)'); g.addColorStop(1, 'rgba(50,70,90,0.5)');
      if (!SIL()) { c.fillStyle = g; c.fillRect(-100, -120, 200, 124); }
      strokePts([[-40, -108], [-38, -14]], 'rgba(255,255,255,0.8)', 3); strokePts([[48, -104], [50, -18]], 'rgba(255,255,255,0.45)', 2);
      strokePts([[-82, -22], [82, -22]], 'rgba(90,100,110,0.45)', 1.4);
    }, 8104);
    pc([[-86, -114], [-82, -124], [-50, -132], [0, -134], [50, -132], [82, -124], [86, -114]], '#d4dbe1', () => { strokePts([[-78, -118], [78, -118]], 'rgba(80,95,110,0.5)', 1.4); strokePts([[-50, -128], [20, -131]], 'rgba(255,255,255,0.8)', 2); }, 8105);
    pc([[-58, -130], [-40, -146], [0, -150], [40, -146], [58, -130]], '#c2cbd3', () => { strokePts([[-30, -144], [10, -147]], 'rgba(255,255,255,0.75)', 2); shade(0, -150, 0, -130, 0.2, [-60, -152, 60, -128]); }, 8106);
    pc(rect(-6, -160, 6, -148), '#8e979f', null, 8107);
    const ph = t * 14 * si, w = 15 * Math.abs(Math.cos(ph)) + 6;
    pc([[-w, -158, 1], [w, -158, 1], [w, -176], [w * 0.6, -184], [-w * 0.6, -184], [-w, -176]], '#2a2a2c', () => { strokePts([[-w * 0.5, -178], [w * 0.4, -180]], 'rgba(255,255,255,0.45)', 1.2); fillPts(rect(-w, -166, w, -163), '#b8322c'); }, 8108);
    c.restore();
    vapeur(t, { x: 0, y: -188, k: Math.max(si, va * 0.35), haut: 120 + 140 * si, r: 18 + 20 * si, n: 6 + Math.round(4 * si), per: si > 0.3 ? 1.0 : 2.6, seed: 91, vent: 18 });
    if (br > 0 && !SIL()) {
      c.save(); c.globalCompositeOperation = 'lighter';
      const halo = c.createRadialGradient(0, -80, 10, 0, -80, 170); halo.addColorStop(0, `rgba(255,250,220,${0.25 * br})`); halo.addColorStop(1, 'rgba(255,250,220,0)'); c.fillStyle = halo; c.fillRect(-180, -260, 360, 300);
      for (const [x, y, ph2, r] of [[-36, -96, 0, 34], [50, -60, 1.7, 26], [-62, -124, 3.1, 20], [30, -150, 4.4, 24]]) {
        const a = Math.min(1, br * (0.6 + 0.6 * Math.max(0, Math.sin(t * 5 + ph2)))), rr = r * (0.7 + 0.3 * a);
        c.fillStyle = `rgba(255,255,240,${a})`; c.beginPath();
        for (let j = 0; j < 8; j++) { const an = j / 8 * TAU, l = j % 2 ? rr * 0.18 : rr; c.lineTo(x + Math.cos(an) * l, y + Math.sin(an) * l); }
        c.closePath(); c.fill();
      }
      c.restore();
    }
  }
  PAP.cocotte = (x, y, s, o) => accDraw('cocotte', drawCocotte, x, y, s, o, 1);
  PAP.COC = COC;
  PAP.cocPt = (nom, x, y, s, o) => { o = o || {}; s = s == null ? 1 : s; const d = o.dir || 1, q = COC[nom] || [0, 0]; return [x + d * s * q[0], y + s * q[1]]; };

  // ---- chaise Louis XIV (dossier haut, velours) ou tabouret ; même (x, y, s, dir) que la marionnette assise
  function drawChaise(o) {
    const tab = o.modele === 'tabouret';
    for (const lx of tab ? [-30, 50] : [-44, 54]) pc([[lx - 5, -100], [lx + 5, -100], [lx + 4, 0, 1], [lx - 4, 0, 1]], '#4e3420', () => hatch(null, 1.4, 4, 0.25), 8201 + lx);
    pc([[-44, -40], [54, -40], [54, -34], [-44, -34]], '#4e3420', null, 8203);
    if (!tab) pc([[-52, -100], [-38, -100], [-34, -310], [-40, -322], [-50, -318], [-54, -300]], '#5b3d22', () => hatch(null, 1.4, 4, 0.25), 8204);
    if (!tab) pc(rrect(-50, -296, -36, -150, 4), '#6a2a2c', () => { hatch(null, 0.8, 3, 0.3); for (let y = -280; y < -150; y += 22) dot(-43, y, 1.6, LAITL); }, 8205);
    pc(rrect(tab ? -40 : -54, -112, tab ? 60 : 66, -98, 5), tab ? '#6b4a2c' : '#6a2a2c', () => hatch(null, 0.2, 4, 0.25), 8206);
  }
  PAP.chaise = (x, y, s, o) => accDraw('chaise', drawChaise, x, y, s, o, 0.9);

  // ================================================================== DÉCORS
  const W = 1080, HB = M.ST.back + 5, SB = M.ST.back;
  const CUI = { plaque: { x: 520, y: 1176 }, comptoir: { y: 1180, x0: 40, x1: 1040 }, cadre: { x: 300, y: 520, rx: 92, ry: 114, rxi: 72, ryi: 94 }, fenetre: { x0: 750, x1: 910, y0: 300, y1: 760, rebord: 762 }, lampe: { x: 690, y: 572 }, horloge: { x: 150, y: 470, r: 46 }, hotte: { x: 520, y: 740 } };
  const AT = { fourneau: { x: 520, y: 1228 }, foyer: { x: 520, y: 1380 }, table: { x: 860, y: 1180, x0: 735, x1: 985 }, chandelle: { x: 930, y: 1092 }, fenetre: { x0: 236, x1: 374, y0: 334, y1: 596, rebord: 602 }, etagere: { x0: 690, x1: 970, y: [520, 720] }, fiole: { x: 770, y: 720 }, hotte: { y: 760 } };
  PAP.CUI = CUI; PAP.AT = AT;
  function speckle(c, x0, y0, w, h, n, seed, col) { const R = M.rng(seed); for (let i = 0; i < n; i++) { c.fillStyle = col.replace('A', (0.02 + R() * 0.035).toFixed(3)); c.beginPath(); c.ellipse(x0 + R() * w, y0 + R() * h, 10 + R() * 50, 6 + R() * 30, R() * 3, 0, TAU); c.fill(); } }
  function livre(x, y, w, h, col, seed) { pc(rect(x - w / 2, y - h, x + w / 2, y), col, () => { for (const yy of [y - h + 8, y - 10]) strokePts([[x - w / 2, yy], [x + w / 2, yy]], LAIT, 1.4); hatch(null, 1.4, 3.6, 0.2); }, seed); }
  function bocal(x, y, w, h, contenu, seed) {
    const c = cx_();
    pc(rrect(x - w / 2, y - h, x + w / 2, y, 6), 'rgba(220,232,234,0.55)', () => {
      const R = M.rng(seed);
      if (contenu === 'pates') for (let i = 0; i < 26; i++) { const px = x - w / 2 + 4 + R() * (w - 8), py = y - 4 - R() * (h * 0.75); c.save(); c.translate(px, py); c.rotate(R() * 3); fillPts(rect(-5, -2, 5, 2), '#e3b85a'); c.restore(); }
      if (contenu === 'lentilles') { fillPts(rect(x - w, y - h * 0.7, x + w, y), '#b0623a'); for (let i = 0; i < 40; i++) dot(x - w / 2 + R() * w, y - R() * h * 0.7, 1.6, '#7a3a20'); }
      if (contenu === 'riz') { fillPts(rect(x - w, y - h * 0.6, x + w, y), '#efe9da'); for (let i = 0; i < 30; i++) dot(x - w / 2 + R() * w, y - R() * h * 0.6, 1, '#c9c0a8'); }
      strokePts([[x - w / 2 + 5, y - h + 8], [x - w / 2 + 5, y - 8]], 'rgba(255,255,255,0.7)', 2);
    }, seed, { texA: 0.2 });
    pc(rrect(x - w / 2 - 2, y - h - 10, x + w / 2 + 2, y - h + 2, 3), contenu === 'riz' ? '#b8bfc4' : '#9a6a3a', null, seed + 1);
  }
  function fiole(x, y, s, col, kind, seed) {
    const c = cx_(); c.save(); c.translate(x, y); c.scale(s, s);
    const verre = 'rgba(206,226,228,0.55)';
    if (kind === 'cornue') { pc(ell(0, -26, 26, 24, 16), verre, () => fillPts(rect(-30, -22, 30, 0), col), seed, { texA: 0.2 }); pc(ribbonW(qbez([12, -44], [30, -70], [70, -50], 8), (u) => 12 - 7 * u), verre, null, seed + 1, { texA: 0.2 }); }
    else if (kind === 'ronde') { pc(ell(0, -22, 22, 22, 16), verre, () => fillPts(rect(-24, -20, 24, 0), col), seed, { texA: 0.2 }); pc(rect(-5, -78, 5, -40), verre, null, seed + 1, { texA: 0.2 }); pc(rect(-7, -84, 7, -78), '#8a6a44', null, seed + 2); }
    else if (kind === 'alambic') { pc([[-24, 0, 1], [24, 0, 1], [28, -30], [16, -50], [-16, -50], [-28, -30]], LAITD, () => { strokePts([[-14, -40], [-12, -8]], 'rgba(255,230,170,0.6)', 2); hatch(null, 0.8, 3.4, 0.25); }, seed); pc(ell(0, -62, 18, 14, 14), LAIT, () => dot(-6, -66, 3, 'rgba(255,240,190,0.7)'), seed + 1); pc(ribbonW(qbez([10, -70], [40, -84], [62, -40], 10), 6), LAITD, null, seed + 2); }
    else { pc([[-8, 0, 1], [8, 0, 1], [9, -30], [4, -40], [4, -50], [-4, -50], [-4, -40], [-9, -30]], verre, () => fillPts(rect(-10, -24, 10, 0), col), seed, { texA: 0.2 }); pc(rect(-5, -56, 5, -50), '#8a6a44', null, seed + 1); }
    c.restore();
  }
  function etagere(x0, x1, y, seed) { pc(rect(x0, y, x1, y + 12), '#5b3d22', () => strokePts([[x0, y + 2], [x1, y + 2]], 'rgba(255,220,180,0.3)', 1.2), seed); for (const bx of [x0 + 20, x1 - 30]) pc([[bx, y + 12], [bx + 10, y + 12], [bx + 10, y + 50], [bx, y + 22]], '#4a3220', null, seed + bx); }
  function toileAraignee(cx, cy, r, a, seed) { if (a <= 0.01) return; const c = cx_(), R = M.rng(seed); c.save(); c.globalAlpha = a; c.strokeStyle = 'rgba(250,248,242,0.95)'; c.lineWidth = 1.4; const n = 9, A0 = []; for (let i = 0; i < n; i++) A0.push(-PI * 0.95 + i / (n - 1) * PI * 0.9 + (R() - 0.5) * 0.15); for (const an of A0) { c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(an) * r, cy - Math.sin(-an) * r); c.stroke(); } for (let k = 1; k <= 6; k++) { const rr = r * k / 6; c.beginPath(); A0.forEach((an, i) => { const px = cx + Math.cos(an) * rr, py = cy + Math.sin(an) * rr; if (i) c.quadraticCurveTo(cx + Math.cos(an - 0.15) * rr * 0.9, cy + Math.sin(an - 0.15) * rr * 0.9, px, py); else c.moveTo(px, py); }); c.stroke(); } c.restore(); }

  // toile du cadre (cuisine) : k 0→0,3 un fil descend du coin haut gauche avec l'araignée ; 0,25→0,85 la toile rayonnante se déploie
  // (9 rayons + spirale, couvre les deux tiers du cadre) ; 0,55→1 voile de poussière grise sur le cadre. k qui revient à 0 = elle se replie et disparaît.
  function toileCadre(C, k, g) {
    if (k <= 0.005 || SIL()) return;
    const c = cx_(), hx = C.x - C.rx - 4, hy = C.y - C.ry - 2, R = 300;
    const p1 = smooth(0, 0.3, k), e = smooth(0.25, 0.85, k), d = smooth(0.55, 1, k);
    if (d > 0) {                                                                    // poussière : ternit l'or et le portrait
      c.save(); c.beginPath(); c.ellipse(C.x, C.y, C.rx + 2, C.ry + 2, 0, 0, TAU); c.clip();
      c.fillStyle = `rgba(138,134,126,${0.42 * d})`; c.fillRect(C.x - C.rx - 4, C.y - C.ry - 4, C.rx * 2 + 8, C.ry * 2 + 8);
      const Rr = M.rng(77); for (let i = 0; i < 70; i++) { c.fillStyle = `rgba(95,90,82,${0.35 * d * Rr()})`; c.beginPath(); c.arc(C.x + (Rr() - 0.5) * C.rx * 2, C.y + (Rr() - 0.5) * C.ry * 2, 1 + Rr() * 3, 0, TAU); c.fill(); }
      c.restore();
    }
    const fil = (pts, quad) => {                                                     // fil : liseré sombre puis gris clair opaque
      for (const [col, lw] of [['rgba(45,40,36,0.75)', 5], ['rgba(232,230,224,1)', 2.7]]) {
        c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) { if (quad) { const a = pts[i - 1], b = pts[i], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2; c.quadraticCurveTo(mx + (hx - mx) * 0.1, my + (hy - my) * 0.1, b[0], b[1]); } else c.lineTo(pts[i][0], pts[i][1]); }
        c.stroke();
      }
    };
    c.save();
    // le fil qui descend (et l'araignée au bout tant que la toile n'est pas faite)
    const sw = 6 * Math.sin(g * 1.3), fy = hy + 40 + 230 * p1 * (1 - e * 0.85), fx = hx + 30 + sw * p1;
    if (e < 0.98) { fil([[hx + 30, 150], [fx, fy]], false); c.fillStyle = '#1e1a18'; c.beginPath(); c.ellipse(fx, fy + 6, 6, 8, 0, 0, TAU); c.fill(); c.beginPath(); c.arc(fx, fy - 3, 4, 0, TAU); c.fill(); c.strokeStyle = '#1e1a18'; c.lineWidth = 1.6; for (const sg of [-1, 1]) for (const dy of [-2, 3, 8]) { c.beginPath(); c.moveTo(fx, fy + dy); c.quadraticCurveTo(fx + sg * 9, fy + dy - 5, fx + sg * 12, fy + dy + 4); c.stroke(); } }
    if (e > 0.01) {
      const N = 9, A = [], L = [];
      for (let j = 0; j < N; j++) { A.push(-0.12 + j / (N - 1) * (PI / 2 + 0.24)); L.push(R * (0.82 + 0.18 * hash(j * 3.7 + 1)) * e); }
      const P = (j, r) => [hx + Math.cos(A[j]) * Math.min(r, L[j]), hy + Math.sin(A[j]) * Math.min(r, L[j])];
      for (let j = 0; j < N; j++) fil([[hx, hy], P(j, L[j])], false);
      for (let i = 0; i < 8; i++) {                                                  // spirale : le rayon grandit d'un rayon à l'autre
        const r0 = R * (0.12 + 0.105 * i); if (r0 > R * e * 0.95) break;
        const pts = []; for (let j = 0; j < N; j++) pts.push(P(j, r0 + R * 0.105 * j / N));
        fil(pts, true);
      }
      dot(hx + 4, hy + 4, 5 * e, '#1e1a18');
    }
    c.restore();
  }
  // -------------------------------------------------- CUISINE D'AUJOURD'HUI
  function makeCuisineVue() {
    const F = CUI.fenetre, w = F.x1 - F.x0, h = F.y1 - F.y0;
    return M.pre(w, h, (c) => {
      const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#8f97b8'); g.addColorStop(0.55, '#d9a986'); g.addColorStop(1, '#f0c48e'); c.fillStyle = g; c.fillRect(0, 0, w, h);
      const sun = c.createRadialGradient(110, 330, 4, 110, 330, 120); sun.addColorStop(0, 'rgba(255,230,170,0.9)'); sun.addColorStop(1, 'rgba(255,200,140,0)'); c.fillStyle = sun; c.fillRect(0, 200, w, 260);
      const toit = (yb, col, seed) => { const R = M.rng(seed), pts = [[-5, h + 5, 1]]; let x = -5; while (x < w + 10) { const ww = 30 + R() * 30, hh = 20 + R() * 40; pts.push([x, yb - hh * 0.4], [x + 6, yb - hh, 1], [x + ww - 6, yb - hh, 1], [x + ww, yb - hh * 0.4]); x += ww; } pts.push([w + 5, h + 5, 1]); M.fillPts(pts, col, seed, 0.3); };
      toit(380, '#8a8aa0', 3);
      for (const [x, y] of [[22, 330], [70, 318], [128, 340]]) { M.fillPts(rect(x, y - 26, x + 9, y), '#6e6a80'); M.fillPts(rect(x - 1, y - 30, x + 10, y - 26), '#5a566a'); }
      strokePts([[96, 300], [96, 270]], '#4e4a5e', 1.4); strokePts([[86, 278], [106, 278]], '#4e4a5e', 1.4); strokePts([[89, 286], [103, 286]], '#4e4a5e', 1.2);
      toit(430, '#6e6e86', 4);
      M.fillPts(rect(0, 430, w, h), '#5d5d74');
    });
  }
  function makeCuisineFond() {
    return M.pre(W, HB, (c) => {
      c.fillStyle = '#d8d1c0'; c.fillRect(0, 0, W, HB);
      const R = M.rng(5);
      for (let y = 150; y < HB; y += 24) for (let x = ((y - 150) / 24) % 2 ? -12 : 0; x < W; x += 24) { const v = R(); c.fillStyle = v < 0.08 ? '#cfc7b4' : v < 0.16 ? '#e4ddcc' : '#ddd6c5'; c.fillRect(x + 1, y + 1, 22, 22); }
      c.strokeStyle = 'rgba(140,132,118,0.55)'; c.lineWidth = 1; c.beginPath(); for (let y = 150; y < HB; y += 24) { c.moveTo(0, y + 0.5); c.lineTo(W, y + 0.5); } c.stroke();
      c.beginPath(); for (let y = 150; y < HB; y += 24) for (let x = ((y - 150) / 24) % 2 ? -12 : 0; x < W; x += 24) { c.moveTo(x + 0.5, y); c.lineTo(x + 0.5, y + 24); } c.stroke();
      const sh = c.createLinearGradient(0, 150, 0, HB); sh.addColorStop(0, 'rgba(60,50,40,0.3)'); sh.addColorStop(0.4, 'rgba(60,50,40,0.05)'); sh.addColorStop(1, 'rgba(60,50,40,0.18)'); c.fillStyle = sh; c.fillRect(0, 150, W, HB);
      // fenêtre (embrasure, cadre blanc, croisillon) ; l'ouverture est découpée pour laisser voir la vue animée
      const F = CUI.fenetre;
      pc(rect(F.x0 - 22, F.y0 - 22, F.x1 + 22, F.y1 + 6), '#e9e4d8', () => M.shade(F.x0, F.y0, F.x1, F.y1, 0.15, [F.x0 - 30, F.y0 - 30, F.x1 + 30, F.y1 + 10]), 5001);
      c.clearRect(F.x0, F.y0, F.x1 - F.x0, F.y1 - F.y0);
      pc(rect((F.x0 + F.x1) / 2 - 5, F.y0, (F.x0 + F.x1) / 2 + 5, F.y1), '#f1ede4', null, 5002);
      pc(rect(F.x0, F.y0 + 150 - 5, F.x1, F.y0 + 150 + 5), '#f1ede4', null, 5003);
      pc(rect(F.x0 - 34, F.y1, F.x1 + 34, F.y1 + 16), '#cfc6b4', () => strokePts([[F.x0 - 32, F.y1 + 2], [F.x1 + 32, F.y1 + 2]], 'rgba(255,255,255,0.6)', 1.4), 5004);
      // étagère murale gauche : bocaux (pâtes, lentilles, riz) + livre de cuisine sans titre
      etagere(60, 250, 700, 5010);
      bocal(92, 700, 40, 70, 'pates', 5020); bocal(142, 700, 38, 58, 'lentilles', 5022); bocal(188, 700, 34, 50, 'riz', 5024);
      livre(228, 700, 20, 74, '#8a3a2a', 5026);
      // horloge ronde sans chiffres (aiguilles animées dans PAP.cuisine)
      const Hh = CUI.horloge;
      pc(ell(Hh.x, Hh.y, Hh.r + 6, Hh.r + 6, 24), '#2e2e30', null, 5030);
      pc(ell(Hh.x, Hh.y, Hh.r, Hh.r, 24), '#f3efe4', () => { for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; strokePts([[Hh.x + Math.sin(a) * (Hh.r - 4), Hh.y - Math.cos(a) * (Hh.r - 4)], [Hh.x + Math.sin(a) * (Hh.r - (k % 3 ? 9 : 14)), Hh.y - Math.cos(a) * (Hh.r - (k % 3 ? 9 : 14))]], '#2a2a2a', k % 3 ? 1.4 : 2.6); } }, 5031);
      // barre d'ustensiles : louche, fouet, spatule
      pc(rect(66, 852, 246, 858), '#9aa0a6', null, 5040);
      for (const x of [80, 238]) dot(x, 855, 4, '#7a8086');
      pc([[96, 860], [100, 860], [100, 950], [112, 952], [114, 970], [96, 978], [84, 966], [86, 952], [96, 950]], '#a9b0b6', null, 5041);
      for (let k = 0; k < 4; k++) strokePts(qbez([150, 940], [134 + k * 11, 980], [150, 1004], 8), '#b9c0c6', 1.4);
      pc(rect(148, 860, 152, 940), '#7a5a3a', null, 5042);
      pc([[198, 860], [203, 860], [203, 940], [214, 944], [214, 984], [188, 984], [188, 944], [198, 940]], '#3a3a3c', null, 5043);
      // hotte inox au-dessus de la plaque
      const Ho = CUI.hotte;
      pc(rect(Ho.x - 34, 150, Ho.x + 34, 610), '#b9c1c8', () => { strokePts([[Ho.x - 18, 150], [Ho.x - 18, 610]], 'rgba(255,255,255,0.6)', 3); shade(Ho.x - 34, 0, Ho.x + 34, 0, 0.25, [Ho.x - 40, 140, Ho.x + 40, 620]); }, 5050);
      pc([[Ho.x - 70, 600, 1], [Ho.x + 70, 600, 1], [Ho.x + 104, Ho.y - 14, 1], [Ho.x + 104, Ho.y, 1], [Ho.x - 104, Ho.y, 1], [Ho.x - 104, Ho.y - 14, 1]], '#c3cbd2', () => { strokePts([[Ho.x - 50, 606], [Ho.x - 86, Ho.y - 12]], 'rgba(255,255,255,0.7)', 3); fillPts(rect(Ho.x - 104, Ho.y - 6, Ho.x + 104, Ho.y), '#8e979f'); shade(Ho.x - 104, 0, Ho.x + 104, 0, 0.2, [Ho.x - 110, 590, Ho.x + 110, Ho.y + 4]); }, 5051);
    });
  }
  function makeCadre() {
    const C = CUI.cadre;
    return M.pre(C.rx * 2 + 30, C.ry * 2 + 30, (c) => {
      c.translate(C.rx + 15, C.ry + 15);
      pc(ell(0, 0, C.rx, C.ry, 40), P.or, () => { hatch(null, 0.6, 3.4, 0.2); M.shade(-C.rx, -C.ry, C.rx, C.ry, 0.35, [-C.rx, -C.ry, C.rx, C.ry]); for (let k = 0; k < 24; k++) { const a = k / 24 * TAU; dot(Math.cos(a) * (C.rx - 9), Math.sin(a) * (C.ry - 9), 2.6, k % 2 ? P.orL : P.orD); } }, 5101);
      for (const sy of [-1, 1]) pc([[-16, sy * C.ry - 6 * sy], [0, sy * C.ry + 10 * sy], [16, sy * C.ry - 6 * sy], [0, sy * C.ry - 14 * sy]], P.orL, null, 5102 + sy);
      M.fillPts(ell(0, 0, C.rxi, C.ryi, 36), '#2a2118', 0, 0);
    });
  }
  function makePortrait(kind) {
    const C = CUI.cadre, w = C.rxi * 2, h = C.ryi * 2;
    const bust = M.pre(w, h, () => { M.puppet(CH.papPapin, PAP.papinPose({ ang: { armF_up: 0.05, armF_lo: -0.6, head: -0.05 } }, 0, 0, 0.62, 1), w * 0.5 + 6, 24 + 0.62 * 530, 0.62, { dir: 1, rod: false, floorShadow: false }); });
    return M.pre(w, h, (c) => {
      if (kind === 'ombre') {
        c.fillStyle = '#e8dfc8'; c.fillRect(0, 0, w, h);
        const b2 = M.pre(w, h, (c2) => { c2.drawImage(bust, 0, 0); c2.globalCompositeOperation = 'source-in'; c2.fillStyle = '#121010'; c2.fillRect(0, 0, w, h); });
        c.drawImage(b2, 0, 0);
      } else {
        const g = c.createRadialGradient(w * 0.6, h * 0.35, 10, w * 0.5, h * 0.5, h * 0.7); g.addColorStop(0, '#6b5a3a'); g.addColorStop(1, '#241c12'); c.fillStyle = g; c.fillRect(0, 0, w, h);
        c.drawImage(bust, 0, 0);
      }
    });
  }
  function makeComptoir() {
    const cv = M.cutFlat(W, 360, W / 2, 350, () => {
      const top = CUI.comptoir.y - SB;                                               // −215
      pc(rect(-500, top + 22, 500, 0), '#4f6276', () => {
        for (let x = -500; x < 500; x += 125) { strokePts([[x, top + 30], [x, 0]], 'rgba(20,28,38,0.7)', 2); fillPts(rect(x + 10, top + 40, x + 115, -16), 'rgba(255,255,255,0.05)'); strokePts([[x + 10, top + 40], [x + 115, top + 40], [x + 115, -16]], 'rgba(20,28,38,0.35)', 1.2); }
        for (let x = -500; x < 500; x += 125) fillPts(rect(x + 100, top + 50, x + 106, top + 80), '#c9cfd4');
        fillPts(rect(-500, -14, 500, 0), '#2e3a48'); hatch(null, 0.2, 5, 0.12);
      }, 5201);
      const px = CUI.plaque.x - W / 2;
      pc(rect(px - 90, top + 34, px + 90, top + 160), '#2a2c30', () => { fillPts(rect(px - 76, top + 50, px + 76, top + 140), '#141518'); strokePts([[px - 70, top + 56], [px - 30, top + 56]], 'rgba(255,255,255,0.25)', 2); fillPts(rect(px - 60, top + 40, px + 60, top + 45), '#9aa0a6'); }, 5202);
      pc(rect(-512, top, 512, top + 22), '#c9a97a', () => { strokePts([[-510, top + 3], [510, top + 3]], 'rgba(255,240,210,0.6)', 1.4); hatch(null, 0.05, 4, 0.18); }, 5203);
      pc(rect(px - 96, top - 5, px + 96, top + 1), '#18191c', () => { for (const dx of [-46, 46]) M.strokePts(ell(px + dx, top - 2, 30, 2.2, 12).concat([[px + dx + 30, top - 2]]), 'rgba(160,160,170,0.5)', 1); }, 5204);
      // planche à découper et carottes, moulin à poivre, corbeille de fruits, torchon, pot d'ustensiles, bouteille d'huile
      pc(rect(170, top - 8, 260, top), '#d8b482', null, 5210);
      for (const [x, r] of [[190, -0.1], [222, 0.05]]) { const cc = M.ctx(); cc.save(); cc.translate(x, top - 14); cc.rotate(r); pc([[-22, -5], [20, -2, 1], [20, 2, 1], [-22, 5]], '#e07a2e', () => strokePts([[-14, -2], [-10, 2]], 'rgba(120,50,10,0.5)', 1), 5211 + x); fillPts([[-22, -3], [-34, -9], [-30, 0], [-34, 8], [-22, 3]], '#5f8a3a'); cc.restore(); }
      pc([[284, top], [300, top], [298, top - 50], [304, top - 58], [292, top - 70], [280, top - 58], [286, top - 50]], '#3a2a20', () => strokePts([[288, top - 6], [288, top - 48]], 'rgba(255,220,180,0.3)', 1.4), 5215);
      pc([[320, top], [420, top], [430, top - 36], [310, top - 36]], '#a9824a', () => { for (let x = 316; x < 430; x += 10) strokePts([[x, top - 34], [x + 4, top - 2]], 'rgba(60,40,20,0.5)', 1); }, 5216);
      for (const [x, y, r, col] of [[340, -48, 16, '#b8322c'], [370, -54, 17, '#c8a23a'], [400, -46, 15, '#8a9a3a']]) pc(ell(x, top + y, r, r * 0.95, 12), col, () => dot(x - 5, top + y - 6, 4, 'rgba(255,255,255,0.4)'), 5217 + x);
      pc([[352, top - 64], [372, top - 76], [400, top - 70], [376, top - 62]], '#e3c24a', null, 5220);
      pc([[300, top + 22], [340, top + 22], [342, top + 110], [298, top + 108]], '#efe9dc', () => { for (let x = 300; x < 344; x += 11) fillPts(rect(x, top + 20, x + 5, top + 112), 'rgba(180,50,40,0.55)'); for (let y = top + 28; y < top + 112; y += 11) fillPts(rect(296, y, 346, y + 5), 'rgba(180,50,40,0.45)'); }, 5221);
      pc([[-430, top], [-390, top], [-392, top - 46], [-428, top - 46]], '#c6ccd0', null, 5222);
      for (const [x, h, col] of [[-420, 92, '#7a5a3a'], [-408, 104, '#3a3a3c'], [-398, 84, '#b88a52']]) pc(rect(x - 3, top - h, x + 3, top - 40), col, null, 5223 + x);
      pc([[-350, top], [-326, top], [-326, top - 60], [-332, top - 72], [-332, top - 90], [-344, top - 90], [-344, top - 72], [-350, top - 60]], 'rgba(170,150,60,0.7)', () => fillPts(rect(-352, top - 40, -324, top), 'rgba(200,170,40,0.6)'), 5226, { texA: 0.2 });
    });
    cv.padB = 10; return M.withShadow(cv, 8);
  }
  function makeBasilic() { const cv = M.cutFlat(200, 260, 100, 250, () => { pc([[-40, -70], [40, -70], [32, 0, 1], [-32, 0, 1]], '#b0603a', () => { fillPts(rect(-44, -78, 44, -64), '#9a4e2e'); hatch(null, 0.8, 4, 0.2); }, 5301); const R = M.rng(53); for (let i = 0; i < 14; i++) { const a = -PI / 2 + (R() - 0.5) * 2.2, l = 50 + R() * 90, bx = Math.cos(a) * l * 0.5, by = -70 + Math.sin(a) * l; strokePts([[0, -70], [bx, by]], '#3f5a2a', 2); pc(ell(bx, by, 16, 10, 10).map((p) => [p[0], p[1]]), i % 2 ? '#5f8a3a' : '#4d7a30', () => strokePts([[bx - 12, by], [bx + 12, by]], 'rgba(30,50,20,0.5)', 1), 5310 + i); } }); cv.padB = 10; return M.withShadow(cv, 8); }
  function makeTabouretCuisine() { const cv = M.cutFlat(200, 260, 100, 250, () => { for (const x of [-50, 46]) pc([[x - 6, -180], [x + 6, -180], [x + 10, 0, 1], [x - 2, 0, 1]], '#c9a97a', null, 5401 + x); pc(rect(-50, -70, 50, -62), '#b8935e', null, 5403); pc(rrect(-66, -196, 66, -178, 8), '#d4b484', () => strokePts([[-60, -192], [60, -192]], 'rgba(255,240,210,0.6)', 1.4), 5404); }); cv.padB = 10; return M.withShadow(cv, 8); }

  // -------------------------------------------------- ATELIER DE PAPIN, LONDRES 1679
  function makeAtelierVue(nuit) {
    const F = AT.fenetre, w = F.x1 - F.x0, h = F.y1 - F.y0;
    return M.pre(w, h, (c) => {
      const g = c.createLinearGradient(0, 0, 0, h);
      if (nuit) { g.addColorStop(0, '#141a30'); g.addColorStop(1, '#2c3450'); } else { g.addColorStop(0, '#a9aca6'); g.addColorStop(1, '#d8d2c2'); }
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      if (nuit) { const R = M.rng(61); for (let i = 0; i < 18; i++) dot(R() * w, R() * h * 0.5, 0.9 + R(), 'rgba(240,236,210,0.8)'); pc(ell(90, 62, 22, 22, 18), '#f1ead0', () => { dot(84, 56, 5, 'rgba(200,190,160,0.5)'); dot(98, 70, 4, 'rgba(200,190,160,0.4)'); }, 6001); }
      const col1 = nuit ? '#1c2034' : '#7a6a62', col2 = nuit ? '#10131f' : '#5a4a44';
      const R = M.rng(62); let x = -6; const pts = [[-6, h + 4, 1]];
      while (x < w + 10) { const ww = 24 + R() * 22, top = 150 + R() * 40; pts.push([x, top + 26], [x + ww / 2, top, 1], [x + ww, top + 26]); x += ww; }
      pts.push([w + 6, h + 4, 1]); M.fillPts(pts, col1, 3, 0.3);
      for (const [cx, cy] of AT_CHEM) { const lx = cx - F.x0, ly = cy - F.y0; M.fillPts(rect(lx - 6, ly, lx + 6, ly + 40), col2); M.fillPts(rect(lx - 8, ly - 4, lx + 8, ly + 2), col2); if (nuit) dot(lx + 14, ly + 60, 2.5, 'rgba(255,200,120,0.6)'); }
      M.fillPts([[-6, h + 4, 1], [-6, 220], [40, 206], [70, 224], [110, 210], [w + 6, 228], [w + 6, h + 4, 1]], col2, 4, 0.3);
    });
  }
  const AT_CHEM = [[262, 488], [318, 470], [356, 498]];
  function brique(x0, y0, x1, y1, seed) { const R = M.rng(seed), c = cx_(); for (let y = y0, row = 0; y < y1; y += 14, row++) for (let x = x0 - (row % 2 ? 16 : 0); x < x1; x += 32) { c.fillStyle = ['#8a4a32', '#7a3e2a', '#94553a', '#6e3826'][Math.floor(R() * 4)]; c.fillRect(x + 1, y + 1, 30, 12); } }
  function makeAtelierFond(pauvre) {
    return M.pre(W, HB, (c) => {
      const g = c.createLinearGradient(0, 0, 0, HB); g.addColorStop(0, '#9c8a68'); g.addColorStop(0.3, '#cbb994'); g.addColorStop(1, '#bba782'); c.fillStyle = g; c.fillRect(0, 0, W, HB);
      speckle(c, 0, 150, W, HB - 150, 160, 71, 'rgba(255,240,210,A)'); speckle(c, 0, 150, W, HB - 150, 120, 72, 'rgba(70,50,30,A)');
      if (pauvre) speckle(c, 0, 150, W, HB - 150, 120, 73, 'rgba(40,30,20,A)');
      // hotte de briques au-dessus du fourneau
      const hb = AT.hotte.y;
      pc([[440, hb, 1], [600, hb, 1], [568, 206, 1], [472, 206, 1]], '#7a3e2a', () => { brique(430, 200, 610, hb, 74); strokePts([[440, hb - 2], [600, hb - 2]], 'rgba(30,15,10,0.5)', 3); shade(440, 0, 600, 0, 0.3, [430, 200, 610, hb]); hatch(null, 0.9, 5, 0.12); }, 6101);
      pc(rect(424, hb - 6, 616, hb + 14), '#5e4a3a', null, 6102);
      // poutres et poteaux
      pc(rect(0, 150, W, 208), '#3f2a1a', () => hatch(null, 0.05, 5, 0.3, 1, P.encre, [0, 140, W, 220]), 6103);
      for (const [x0, x1] of [[52, 92], [988, 1028]]) pc(rect(x0, 208, x1, HB), '#4a3220', () => hatch(null, 1.5, 5, 0.3), 6104 + x0);
      pc(ribbonW([[92, 330], [210, 212]], 26), '#4a3220', null, 6106); pc(ribbonW([[988, 330], [870, 212]], 26), '#4a3220', null, 6107);
      // fenêtre à losanges (l'ouverture est découpée : vue animée dessous)
      const F = AT.fenetre;
      pc(rect(F.x0 - 16, F.y0 - 16, F.x1 + 16, F.y1 + 6), '#5b3d22', () => hatch(null, 1.5, 4, 0.25), 6110);
      c.clearRect(F.x0, F.y0, F.x1 - F.x0, F.y1 - F.y0);
      c.save(); c.beginPath(); c.rect(F.x0, F.y0, F.x1 - F.x0, F.y1 - F.y0); c.clip();
      c.fillStyle = pauvre ? 'rgba(200,210,220,0.06)' : 'rgba(240,236,220,0.1)'; c.fillRect(F.x0, F.y0, F.x1 - F.x0, F.y1 - F.y0);
      c.strokeStyle = '#3a3634'; c.lineWidth = 2; c.beginPath();
      for (let d = -300; d < 300; d += 26) { c.moveTo(F.x0 + d, F.y0); c.lineTo(F.x0 + d + 300, F.y0 + 300); c.moveTo(F.x1 - d, F.y0); c.lineTo(F.x1 - d - 300, F.y0 + 300); }
      c.stroke(); c.restore();
      pc(rect((F.x0 + F.x1) / 2 - 5, F.y0, (F.x0 + F.x1) / 2 + 5, F.y1), '#5b3d22', null, 6111);
      pc(rect(F.x0, F.y0 + 120, F.x1, F.y0 + 128), '#5b3d22', null, 6112);
      pc(rect(F.x0 - 28, F.y1, F.x1 + 28, F.y1 + 14), '#6e4a2a', () => strokePts([[F.x0 - 26, F.y1 + 2], [F.x1 + 26, F.y1 + 2]], 'rgba(255,220,180,0.3)', 1.2), 6113);
      // étagères de cornues, fioles, alambic, sablier, livres, globe céleste
      const E = AT.etagere;
      for (const y of E.y) etagere(E.x0, E.x1, y, 6120 + y);
      if (!pauvre) {
        fiole(712, 520, 1, '#7a9a5a', 'cornue', 6130); fiole(800, 520, 1, '#a04a3a', 'ronde', 6133); fiole(842, 520, 0.9, '#3a6a8a', 'fiole', 6136);
        fiole(900, 520, 1, null, 'alambic', 6139);
        // globe céleste sur son pied, sur l'étagère du haut
        pc([[940, 520], [960, 520], [954, 506], [946, 506]], LAITD, null, 6142);
        pc(ell(950, 478, 26, 26, 20), '#3a4a6a', () => { strokePts(ep(950, 478, 26, 8, 14, 0, TAU), LAITL, 1.2); strokePts(ep(950, 478, 8, 26, 14, 0, TAU), LAITL, 1); for (const [sx, sy] of [[942, 466], [958, 472], [948, 490], [962, 486]]) dot(sx, sy, 1.6, '#f1e6c0'); }, 6143);
        strokePts(ep(950, 478, 30, 30, 18, -PI * 0.8, PI * 0.2), LAIT, 2.2);
        livre(818, 720, 18, 66, '#6a2a2a', 6150); livre(838, 720, 16, 60, '#3a4a3a', 6151); livre(856, 720, 20, 70, '#5a4a2a', 6152);
        pc([[870, 720], [930, 720], [930, 704], [870, 704]], '#4a3a2a', null, 6153); pc([[874, 704], [926, 704], [926, 690], [874, 690]], '#7a3a2a', null, 6154);
        // sablier
        pc(rect(940, 650, 966, 656), '#5b3d22', null, 6155); pc(rect(940, 714, 966, 720), '#5b3d22', null, 6156);
        pc([[944, 656], [962, 656], [955, 685], [962, 714], [944, 714], [951, 685]], 'rgba(214,230,232,0.6)', () => { fillPts([[947, 700], [959, 700], [962, 714], [944, 714]], '#d8b46a'); fillPts([[946, 660], [960, 660], [955, 674], [951, 674]], '#d8b46a'); }, 6157, { texA: 0.2 });
        for (const x of [942, 964]) strokePts([[x, 656], [x, 714]], '#5b3d22', 2);
        fiole(726, 720, 0.8, '#c9a23a', 'fiole', 6160);
        // bouquet d'herbes pendu à la poutre
        for (let i = 0; i < 6; i++) strokePts([[140 + i * 3, 212], [128 + i * 6, 300 + (i % 2) * 14]], '#6a7a44', 2.2);
        pc([[134, 208], [160, 208], [156, 222], [138, 222]], '#8a6a44', null, 6170);
      } else {
        fiole(760, 520, 0.9, 'rgba(0,0,0,0)', 'fiole', 6180); livre(900, 720, 18, 52, '#4a3a2a', 6181);
        toileAraignee(E.x0 + 8, E.y[0] + 12, 60, 0.6, 6182); toileAraignee(E.x1 - 8, E.y[1] + 12, 50, 0.5, 6183);
      }
      M.fillPts(rect(0, HB - 50, W, HB), 'rgba(60,40,20,0.3)', 0, 0);
    });
  }
  function makeFourneau(pauvre) {
    const cv = M.cutFlat(420, 200, 210, 190, () => {
      const top = AT.fourneau.y - SB;                                              // −167
      pc(rect(-128, top + 10, 128, 0), '#8a4a32', () => {
        brique(-130, top + 8, 130, 0, pauvre ? 76 : 75);
        fillPts([[-46, -8], [-46, -70], [-30, -88], [0, -94], [30, -88], [46, -70], [46, -8]], '#1a0e08');
        strokePts([[-48, -72], [-32, -90], [0, -96], [32, -90], [48, -72]], '#c9b08a', 4);
        if (pauvre) { fillPts([[-40, -8], [-20, -22], [10, -26], [36, -14], [40, -8]], '#6a6460'); dot(6, -18, 2.4, 'rgba(255,120,40,0.7)'); }
        hatch(null, 0.9, 5, 0.12); shade(-128, 0, 128, 0, 0.3, [-130, top, 130, 0]);
      }, 6201);
      pc(rect(-138, top, 138, top + 12), '#8e8678', () => { strokePts([[-136, top + 2], [136, top + 2]], 'rgba(255,255,255,0.35)', 1.4); hatch(null, 0.2, 4, 0.2); }, 6202);
      // soufflet de forge appuyé contre le flanc droit
      pc([[134, -4], [150, -90], [178, -100], [190, -86], [166, -4]], '#6b4a2c', () => { for (const y of [-30, -50, -70]) strokePts([[146, y], [182, y - 6]], 'rgba(30,15,5,0.5)', 1.2); }, 6203);
      pc(ribbonW([[140, -14], [116, -26]], 6), '#8a6a44', null, 6204);
    });
    cv.padB = 10; return M.withShadow(cv, 8);
  }
  function makeTable(pauvre) {
    const cv = M.cutFlat(320, 420, 160, 410, () => {
      const top = AT.table.y - SB;                                                 // −215
      for (const x of [-112, 112]) pc([[x - 9, 0, 1], [x + 9, 0, 1], [x + 8, top + 18, 1], [x - 8, top + 18, 1]], '#4e3420', () => hatch(null, 1.5, 4, 0.25), 6301 + x);
      pc(rect(-120, -56, 120, -46), '#4e3420', null, 6303);
      pc(rect(-130, top, 130, top + 18), '#6b4a2c', () => strokePts([[-128, top + 2], [128, top + 2]], 'rgba(255,220,180,0.3)', 1.2), 6304);
      // chandelier (flamme animée dans PAP.atelier)
      const cx = AT.chandelle.x - AT.table.x;
      pc([[cx - 18, top], [cx + 18, top], [cx + 6, top - 10], [cx + 4, top - 50], [cx + 10, top - 56], [cx - 10, top - 56], [cx - 4, top - 50], [cx - 6, top - 10]], LAITD, () => strokePts([[cx - 2, top - 48], [cx - 2, top - 12]], 'rgba(255,230,170,0.6)', 1.4), 6305);
      pc(rect(cx - 5, top - 86, cx + 5, top - 56), '#efe6cc', null, 6306);
      // encrier et plume
      pc([[-20, top], [4, top], [2, top - 18], [-18, top - 18]], '#1e1a18', null, 6307);
      pc([[-8, top - 16], [0, top - 22], [-30, top - 92], [-36, top - 90]], '#eee8d8', null, 6308);
      if (!pauvre) {
        // pompe à air en laiton sous sa cloche de verre (clin d'œil à Boyle)
        pc(rect(-120, top - 10, -40, top), '#5b3d22', null, 6310);
        pc(rect(-90, top - 90, -70, top - 10), LAIT, () => { strokePts([[-86, top - 86], [-86, top - 14]], 'rgba(255,240,190,0.7)', 2); hatch(null, 0.8, 3.4, 0.2); }, 6311);
        pc(rect(-92, top - 96, -68, top - 90), LAITD, null, 6312);
        strokePts([[-80, top - 96], [-80, top - 126]], LAITD, 3); strokePts([[-96, top - 126], [-64, top - 126]], LAITD, 3);
        pc([[-64, top - 10], [-64, top - 60], [-58, top - 80], [-46, top - 88], [-34, top - 80], [-28, top - 60], [-28, top - 10]], 'rgba(214,230,232,0.5)', () => strokePts([[-60, top - 60], [-56, top - 76]], 'rgba(255,255,255,0.8)', 1.6), 6313, { texA: 0.2 });
        // mortier et pilon
        pc([[18, top], [56, top], [62, top - 30], [12, top - 30]], '#8e8678', () => hatch(null, 0.8, 3.4, 0.25), 6314);
        pc(ribbonW([[40, top - 26], [62, top - 64]], 8), '#b8ac94', null, 6315);
        // livres reliés en pile
        pc(rect(70, top - 14, 120, top), '#6a2a2a', null, 6316); pc(rect(74, top - 26, 118, top - 14), '#3a4a3a', null, 6317); pc(rect(68, top - 38, 114, top - 26), '#5a4a2a', null, 6318);
      }
    });
    cv.padB = 10; return M.withShadow(cv, 8);
  }
  function makeCoffre() { const cv = M.cutFlat(220, 200, 110, 190, () => { pc([[-80, 0, 1], [80, 0, 1], [80, -90], [70, -104], [-70, -104], [-80, -90]], '#5b3d22', () => { for (const x of [-50, 50]) fillPts(rect(x - 6, -104, x + 6, 0), '#3a3634'); hatch(null, 1.5, 4, 0.25); }, 6401); pc(rect(-10, -70, 10, -50), '#3a3634', () => dot(0, -60, 3, LAIT), 6402); }); cv.padB = 10; return M.withShadow(cv, 8); }
  function makeSeau() { const cv = M.cutFlat(160, 160, 80, 150, () => { pc([[-46, -96], [46, -96], [38, 0, 1], [-38, 0, 1]], '#7a5232', () => { for (let x = -40; x < 46; x += 13) strokePts([[x, -96], [x * 0.84, 0]], 'rgba(40,20,10,0.5)', 1.2); for (const y of [-80, -20]) fillPts(rect(-50, y, 50, y + 7), '#3a3634'); }, 6501); fillPts(ell(0, -96, 44, 7, 14), '#5a7a8a'); strokePts([[-30, -97], [10, -95]], 'rgba(255,255,255,0.5)', 1.4); strokePts(qbez([-46, -90], [0, -170], [46, -90], 12), '#3a3634', 2.4); }); cv.padB = 10; return M.withShadow(cv, 8); }
  function makePanier() { const cv = M.cutFlat(220, 180, 110, 170, () => { const cc = M.ctx(); for (const [x, y, a] of [[-30, -84, -0.5], [10, -90, 0.3], [40, -80, 0.9], [-6, -96, -1.2]]) { cc.save(); cc.translate(x, y); cc.rotate(a); cc.scale(0.5, 0.5); drawOs({}); cc.restore(); } pc([[-70, -70], [70, -70], [60, 0, 1], [-60, 0, 1]], '#a9824a', () => { for (let y = -66; y < 0; y += 9) strokePts([[-70, y], [70, y]], 'rgba(70,45,20,0.55)', 1.4); for (let x = -64; x < 70; x += 12) strokePts([[x, -70], [x * 0.88, 0]], 'rgba(70,45,20,0.4)', 1); }, 6601); }); cv.padB = 10; return M.withShadow(cv, 8); }
  function makeTabouretAtelier() { const cv = M.cutFlat(200, 200, 100, 190, () => { for (const x of [-46, 40]) pc([[x - 5, -100], [x + 5, -100], [x + 9, 0, 1], [x - 1, 0, 1]], '#4e3420', null, 6701 + x); pc(rrect(-58, -112, 58, -98, 4), '#6b4a2c', () => hatch(null, 0.2, 4, 0.2), 6703); }); cv.padB = 10; return M.withShadow(cv, 8); }

  // ------------------------------------------------------------ pré-rendus
  PAP.init = function () {
    PAP.K = {
      cVue: makeCuisineVue(), cFond: makeCuisineFond(), cadre: makeCadre(), portrait: { ombre: makePortrait('ombre'), papin: makePortrait('papin') },
      comptoir: makeComptoir(), basilic: makeBasilic(), tabouretC: makeTabouretCuisine(),
      aVue: makeAtelierVue(false), aVueN: makeAtelierVue(true), aFond: makeAtelierFond(false), aFondP: makeAtelierFond(true),
      fourneau: makeFourneau(false), fourneauP: makeFourneau(true), table: makeTable(false), tableP: makeTable(true), coffre: makeCoffre(), seau: makeSeau(), panier: makePanier(), tabouretA: makeTabouretAtelier(),
    };
    return PAP.K;
  };

  // ------------------------------------------------------------ animations des décors
  function chat(x, y, t) {                                                         // chat roux de profil qui marche (vers −x), (x, y) = pattes
    const c = cx_(), ph = t * 9; c.save(); c.translate(x, y); c.scale(-1, 1);
    for (const [lx, o] of [[-22, 0], [-14, PI], [18, PI / 2], [26, PI * 1.5]]) { const a = Math.sin(ph + o) * 0.35; c.save(); c.translate(lx, -18); c.rotate(a); pc(rect(-2.5, 0, 2.5, 18), '#b8642a', null, 7001); c.restore(); }
    pc(ribbonW(qbez([-30, -26], [-52, -40], [-46, -66 + 4 * Math.sin(t * 3)], 8), 6), '#c8743a', null, 7002);
    pc([[-32, -34], [-10, -38], [20, -36], [32, -30], [30, -18], [-30, -16]], '#c8743a', () => { for (const x of [-20, -8, 6]) strokePts([[x, -36], [x + 3, -22]], 'rgba(120,50,10,0.6)', 2); }, 7003);
    pc([[26, -36], [30, -48, 1], [36, -42], [42, -48, 1], [46, -34], [44, -26], [32, -24]], '#c8743a', () => { dot(40, -36, 1.6, '#1a1a10'); }, 7004);
    c.restore();
  }
  function pigeonVivant(x, y, t, vol, sens) {                                      // pigeon gris : vol 1 = ailes battantes ; sens 1 = tête vers +x
    const c = cx_(); c.save(); c.translate(x, y); c.scale(sens === 1 ? 1 : -1, 1);
    const bob = vol ? 0 : Math.max(0, Math.sin(t * 2.3)) * 3;
    pc([[-20, -10], [-30, -4], [-34, 2, 1], [-16, 0], [10, 0], [20, -8], [18, -18], [6, -22], [-10, -18]], '#8e9096', () => { fillPts([[6, -22], [18, -18], [18, -10], [8, -12]], '#6e8a7a'); strokePts([[-14, -10], [4, -8]], 'rgba(40,40,46,0.6)', 1.4); }, 7101);
    pc([[14, -16 - bob], [22, -28 - bob], [30, -26 - bob], [34, -22 - bob, 1], [28, -20 - bob], [22, -12]], '#7a7c84', () => dot(27, -25 - bob, 1.6, '#c96a2a'), 7102);
    if (vol) { const fl = Math.sin(t * 22); pc([[-8, -16], [10, -16], [0, -16 - 26 * fl], [-16, -18 - 22 * fl]], '#a0a2a8', null, 7103); }
    else { strokePts([[0, 0], [-1, 6]], '#b8645a', 1.6); strokePts([[6, 0], [7, 6]], '#b8645a', 1.6); }
    c.restore();
  }
  // cuisine : o.portrait 'ombre'|'papin' (défaut 'ombre') ; o.toile 0..1 ; o.eclaire 0..1 ; o.lampe 0..1 ; o.chat (instant de départ, s) ; o.cast
  PAP.cuisine = function (t, up, o) {
    o = o || {}; up = up || 0; const K = PAP.K, c = cx_(), g = M.tg(t), F = CUI.fenetre, cast = o.cast || { dx: 14, dy: 6, a: 0.3 };
    c.save(); c.translate(0, -up);
    c.drawImage(K.cVue, F.x0, F.y0);
    c.save(); c.beginPath(); c.rect(F.x0, F.y0, F.x1 - F.x0, F.y1 - F.y0); c.clip();
    for (let i = 0; i < 3; i++) { const x = F.x0 - 60 + (((g * 7 + i * 80) % 280) + 280) % 280, y = F.y0 + 50 + i * 55; c.save(); c.globalAlpha = 0.85; M.path(ell(x, y, 34, 11, 10), i, 0.6, true); c.fillStyle = '#f3dccb'; c.fill(); M.path(ell(x + 18, y - 7, 18, 9, 9), i + 5, 0.6, true); c.fill(); c.restore(); }
    M.oiseaux(g % 9, { x0: F.x1 + 20, x1: F.x0 - 20, y: F.y0 + 140, t0: 0, dur: 6, n: 3, s: 0.45, brume: 0.4, seed: 4 });
    const R = M.rng(17); for (let i = 0; i < 6; i++) { const wx = F.x0 + 8 + R() * 140, wy = F.y0 + 340 + R() * 70, on = hash(Math.floor(g / 3 + i * 1.7)) > 0.35; if (on) M.fillPts(rect(wx, wy, wx + 5, wy + 6), 'rgba(255,214,140,0.9)'); }
    c.restore();
    c.drawImage(K.cFond, 0, 0);
    if (o.chat != null) { const u = (t - o.chat) / 3.2; if (u > 0 && u < 1) { c.save(); c.beginPath(); c.rect(F.x0 - 34, 0, F.x1 - F.x0 + 68, 2000); c.clip(); chat(lerp(F.x1 + 60, F.x0 - 60, u), F.rebord, t); c.restore(); } }
    M.voilage(t, { x: F.x0 - 4, y: F.y0 - 8, w: 62, h: F.y1 - F.y0, cote: 1, amp: 7, col: 'rgba(244,238,226,0.6)' });
    M.voilage(t + 1.3, { x: F.x1 - 58, y: F.y0 - 8, w: 62, h: F.y1 - F.y0, cote: -1, amp: 7, col: 'rgba(244,238,226,0.6)' });
    // lumière du soir qui scintille, de la fenêtre vers le mur et le sol
    const fl = 0.75 + 0.15 * Math.sin(g * 1.7) + 0.1 * M.noise(g * 0.8, 3);
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.09 * fl; c.fillStyle = '#ffcf90';
    c.beginPath(); c.moveTo(F.x0, F.y0 + 40); c.lineTo(F.x0, F.y1); c.lineTo(560, 1395); c.lineTo(380, 1395); c.closePath(); c.fill(); c.restore();
    // horloge : trotteuse et aiguilles
    const Hh = CUI.horloge, aig = (a, L, w, col) => { c.save(); c.translate(Hh.x, Hh.y); c.rotate(a); c.beginPath(); c.moveTo(-w, 6); c.lineTo(0, -L); c.lineTo(w, 6); c.closePath(); c.fillStyle = col; c.fill(); c.restore(); };
    aig(1.9 + g * 0.0015, 24, 2.6, '#1e1e1e'); aig(5.2 + g * 0.018, 36, 1.8, '#1e1e1e'); aig(Math.floor(g) / 60 * TAU, 38, 0.8, '#b8322c'); dot(Hh.x, Hh.y, 3, '#b8322c');
    // cadre ovale doré et portrait
    const C = CUI.cadre;
    c.drawImage(K.cadre, C.x - C.rx - 15, C.y - C.ry - 15);
    c.save(); c.beginPath(); c.ellipse(C.x, C.y, C.rxi, C.ryi, 0, 0, TAU); c.clip();
    c.drawImage(K.portrait[o.portrait || 'ombre'], C.x - C.rxi, C.y - C.ryi);
    const ec = clamp(o.eclaire || 0);
    if (ec > 0) { const gg = c.createRadialGradient(C.x + 10, C.y - 30, 5, C.x, C.y, C.ryi * 1.2); gg.addColorStop(0, `rgba(255,236,190,${0.35 * ec})`); gg.addColorStop(1, 'rgba(255,220,160,0)'); c.globalCompositeOperation = 'lighter'; c.fillStyle = gg; c.fillRect(C.x - C.rx, C.y - C.ry, C.rx * 2, C.ry * 2); }
    c.restore();
    if (ec > 0) { c.save(); c.globalCompositeOperation = 'lighter'; const gl = c.createRadialGradient(C.x, C.y, C.ryi, C.x, C.y, C.ry + 60); gl.addColorStop(0, `rgba(255,220,140,${0.3 * ec * (0.85 + 0.15 * Math.sin(g * 3))})`); gl.addColorStop(1, 'rgba(255,220,140,0)'); c.fillStyle = gl; c.fillRect(C.x - C.rx - 70, C.y - C.ry - 70, C.rx * 2 + 140, C.ry * 2 + 140); c.restore(); }
    toileCadre(C, clamp(o.toile || 0), g);
    // lampe suspendue
    const L = CUI.lampe, sw = 0.015 * Math.sin(g * 0.9), lx = L.x + sw * (L.y - 150), lp = clamp(o.lampe || 0);
    strokePts([[L.x, 150], [lx, L.y - 52]], '#2a2a2a', 2);
    if (lp > 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.16 * lp; c.fillStyle = '#ffe2a8'; c.beginPath(); c.moveTo(lx - 34, L.y); c.lineTo(lx + 34, L.y); c.lineTo(lx + 210, 1395); c.lineTo(lx - 210, 1395); c.closePath(); c.fill(); c.restore(); dot(lx, L.y - 2, 12, `rgba(255,240,200,${0.9 * lp})`); }
    pc([[lx - 12, L.y - 54], [lx + 12, L.y - 54], [lx + 40, L.y - 4], [lx + 40, L.y, 1], [lx - 40, L.y, 1], [lx - 40, L.y - 4]], '#3f5a52', () => { strokePts([[lx - 6, L.y - 50], [lx - 28, L.y - 6]], 'rgba(255,255,255,0.35)', 2); if (lp > 0) fillPts(rect(lx - 40, L.y - 6, lx + 40, L.y), `rgba(255,230,170,${0.8 * lp})`); }, 7201);
    M.flat(K.comptoir, W / 2, SB, { cast });
    c.restore();
  };
  // premier plan de la cuisine (après les marionnettes) : basilic qui frémit, tabouret
  PAP.cuisineAvant = function (t, up, o) {
    o = o || {}; const K = PAP.K, c = cx_(), g = M.tg(t); c.save(); c.translate(0, -(up || 0));
    if (o.tabouret !== false) M.flat(K.tabouretC, 965, 1600, { cast: { dx: 10, dy: 4, a: 0.25 } });
    M.flat(K.basilic, 120, 1590, { rot: 0.02 * Math.sin(g * 1.4), cast: { dx: 10, dy: 4, a: 0.25 } });
    c.restore();
  };
  // atelier : o.misere 0..1 (nuit pauvre du plan 5) ; o.pigeon (instant où il se pose, s) ; o.tinte 0..1 (la fiole tinte) ; o.feu 0..1 (défaut 1 − misere) ; o.cast
  PAP.atelier = function (t, up, o) {
    o = o || {}; up = up || 0; const K = PAP.K, c = cx_(), g = M.tg(t), F = AT.fenetre, m = clamp(o.misere || 0), feu = o.feu == null ? 1 - m : clamp(o.feu), cast = o.cast || { dx: 14, dy: 6, a: 0.3 };
    c.save(); c.translate(0, -up);
    c.drawImage(K.aVue, F.x0, F.y0); if (m > 0) { c.save(); c.globalAlpha = m; c.drawImage(K.aVueN, F.x0, F.y0); c.restore(); }
    c.save(); c.beginPath(); c.rect(F.x0, F.y0, F.x1 - F.x0, F.y1 - F.y0); c.clip();
    if (o.pigeon != null) { const u = (t - o.pigeon) / 1.3, e = ease(clamp(u)); if (u > -0.05) pigeonVivant(lerp(F.x0 - 50, F.x0 + 92, e), lerp(F.y0 + 110, F.y1 - 2, e), t, u < 1, 1); }
    for (const [i, [x, y]] of AT_CHEM.entries()) M.fumee(t, { x, y: y - 4, s: 0.32, n: 5, haut: 150, vent: 26, a: 0.55 * (1 - 0.6 * m), per: 3.6, seed: 31 + i, col: m > 0.5 ? '#6a6e80' : '#d9d2c4' });
    c.restore();
    c.drawImage(K.aFond, 0, 0); if (m > 0) { c.save(); c.globalAlpha = m; c.drawImage(K.aFondP, 0, 0); c.restore(); }
    // rayon de la fenêtre et poussière
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = (0.07 + 0.02 * Math.sin(g * 0.7)) * (1 - 0.5 * m); c.fillStyle = m > 0.5 ? '#9fb0e0' : '#fff0c8';
    c.beginPath(); c.moveTo(F.x0, F.y0); c.lineTo(F.x1, F.y0); c.lineTo(760, 1395); c.lineTo(470, 1395); c.closePath(); c.fill(); c.restore();
    M.poussiere(t, { x: 330, y: 640, w: 300, h: 640, n: 30, a: 0.6 * (1 - 0.5 * m), seed: 19 });
    // la fiole qui tinte (plan 3)
    if (m < 1) { const ti = clamp(o.tinte || 0), a = ti * 0.12 * Math.sin(t * 34); c.save(); c.globalAlpha = 1 - m; c.translate(AT.fiole.x, AT.fiole.y); c.rotate(a); fiole(0, 0, 0.9, '#5a8aa0', 'ronde', 6190); c.restore(); }
    // pigeon qui se pose sur le rebord (plan 2)
    M.flat(K.coffre, 165, SB, { cast });
    // fourneau et feu
    M.flat(K.fourneau, AT.fourneau.x, SB, { cast }); if (m > 0) { c.save(); c.globalAlpha = m; M.flat(K.fourneauP, AT.fourneau.x, SB); c.restore(); }
    if (feu > 0.02) { c.save(); c.beginPath(); c.rect(AT.foyer.x - 46, AT.foyer.y - 96, 92, 90); c.clip(); c.globalAlpha = feu; for (const [dx, s, sd] of [[-22, 1.1, 1], [0, 1.5, 2], [22, 1.05, 3]]) M.flamme(t, { x: AT.foyer.x + dx, y: AT.foyer.y, s, r: 120, seed: sd }); c.restore(); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = feu * (0.22 + 0.06 * Math.sin(g * 9)); const gr = c.createRadialGradient(AT.foyer.x, AT.foyer.y - 30, 10, AT.foyer.x, AT.foyer.y - 30, 220); gr.addColorStop(0, '#ff9a40'); gr.addColorStop(1, 'rgba(255,120,40,0)'); c.fillStyle = gr; c.fillRect(AT.foyer.x - 220, AT.foyer.y - 250, 440, 300); c.restore(); }
    // table et chandelle
    M.flat(K.table, AT.table.x, SB, { cast }); if (m > 0) { c.save(); c.globalAlpha = m; M.flat(K.tableP, AT.table.x, SB); c.restore(); }
    M.flamme(t, { x: AT.chandelle.x, y: AT.chandelle.y, s: 1, r: 110 + 60 * m, seed: 7 });
    c.restore();
  };
  // premier plan de l'atelier (après les marionnettes) : seau d'eau, tabouret, panier d'os
  PAP.atelierAvant = function (t, up, o) {
    o = o || {}; const K = PAP.K, c = cx_(), g = M.tg(t); c.save(); c.translate(0, -(up || 0));
    M.flat(K.seau, 140, 1590, { cast: { dx: 10, dy: 4, a: 0.25 } });
    if (!SIL()) { c.save(); c.globalAlpha = 0.5 + 0.3 * Math.sin(g * 2.2); strokePts([[120, 1495], [150, 1493]], 'rgba(255,255,255,0.8)', 1.4); c.restore(); }
    M.flat(K.tabouretA, 270, 1610, { cast: { dx: 10, dy: 4, a: 0.25 } });
    M.flat(K.panier, 920, 1595, { cast: { dx: 10, dy: 4, a: 0.25 } });
    c.restore();
  };
  // nuit du plan 5 : voile bleu nuit par-dessus TOUT (après les marionnettes), sauf autour de la chandelle et dans le rayon de lune
  PAP.nuit = function (t, k, o) {
    k = clamp(k || 0); if (k <= 0) return; o = o || {}; const c = cx_(), g = M.tg(t), up = o.up || 0, cx = o.x == null ? AT.chandelle.x : o.x, cy = (o.y == null ? AT.chandelle.y : o.y) - up;
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    const r = 420 + 14 * Math.sin(g * 11) + 8 * Math.sin(g * 23);
    const gr = c.createRadialGradient(cx, cy, 20, cx, cy, r); gr.addColorStop(0, 'rgba(10,14,34,0)'); gr.addColorStop(0.45, `rgba(10,14,34,${0.25 * k})`); gr.addColorStop(1, `rgba(10,14,34,${0.62 * k})`);
    c.fillStyle = gr; c.fillRect(0, 0, W, M.H);
    c.restore();
  };
})();
