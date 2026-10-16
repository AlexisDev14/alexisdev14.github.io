// persos.js — « L'Oscar en plâtre » : marionnettes, accessoires et décors PROPRES À CETTE VIDÉO. Espace M.osc (alias OSC). Appeler OSC.init() dans S.init.
// Mode d'emploi : persos.md (ne pas lire ce fichier en entier).
//   OSC.oscar(x,y,s,o) / OSC.coque(x,y,s,o)            statuette-chevalier (matiere, peint, ecaille, trainee, fier, gene, epee, face) ; coque = peau dorée sans socle
//   OSC.star / OSC.academie / OSC.gibbons(pose,x,y,s,o)  marionnettes (gestes par M.ik, bendSign dans OSC.BEND)
//   OSC.pot, OSC.pinceau, OSC.enveloppe, OSC.mouchoir, OSC.crayon, OSC.piedestal(x,y,s,o) ; OSC.pt(r,'nom') ; OSC.salle(t,{guerre,ceremonie,ciel})
(function () {
  'use strict';
  const X = M.X, P = M.P, TAU = M.TAU, PI = Math.PI, ST = M.ST;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, hash } = M;
  const CH = M.chars;
  const OSC = (M.osc = {});
  const cx_ = () => M.ctx(), SIL = () => M._sil();
  const OFFP = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];
  const has = (v) => v && v !== 'rien';

  // ------------------------------------------------------------ géométrie
  function ep(cx, cy, rx, ry, n, a0, a1) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; }
  function ell(cx, cy, rx, ry, n) { const o = ep(cx, cy, rx, ry, n || 16, 0, TAU); o.pop(); return o; }
  const rect = (x0, y0, x1, y1) => [[x0, y0, 1], [x1, y0, 1], [x1, y1, 1], [x0, y1, 1]];
  const normA = (a) => { while (a > PI) a -= TAU; while (a < -PI) a += TAU; return a; };
  const pc = (pts, base, paint, seed, o) => piece(pts, base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));
  const rot = (p, a) => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];
  function capsule(A, B, r1, r2) {
    const a = Math.atan2(B[1] - A[1], B[0] - A[0]);
    return ep(B[0], B[1], r2, r2, 8, a - PI / 2, a + PI / 2).concat(ep(A[0], A[1], r1, r1, 8, a + PI / 2, a + 1.5 * PI));
  }
  function grad(x0, y0, x1, y1, stops, bb) {
    if (SIL()) return; const c = cx_(), g = c.createLinearGradient(x0, y0, x1, y1);
    for (const [u, col] of stops) g.addColorStop(u, col);
    c.fillStyle = g; c.fillRect(bb[0], bb[1], bb[2] - bb[0], bb[3] - bb[1]);
  }

  // =====================================================================
  // L'OSCAR-CHEVALIER — vu de FACE (statuette), origine = milieu du dessous du socle, y vers le haut négatif.
  // Hauteur 400 à k = 1 (socle 0 → −88, pieds −88, haut du casque −400). Tenu en main : k = 0,5 (× taille).
  // =====================================================================
  const OR = { or: '#c9a23a', orD: '#8a6a1e', orL: '#f0d77a', pl: '#ece6d8', plD: '#c9c1b0', plL: '#faf7ee' };
  OSC.COUL = OR;
  function pal(mat) {
    if (mat === 'or') return { b: OR.or, d: OR.orD, l: OR.orL, e: '#f8ebbb', eye: '#2e2006', trou: '#4a360c', mat };
    if (mat === 'peint') return { b: '#c09838', d: '#94712a', l: '#d9bd6c', e: '#efe2b4', eye: '#2e2006', trou: '#5a4416', mat };
    return { b: OR.pl, d: OR.plD, l: OR.plL, e: P.edge, eye: '#4f473e', trou: '#9d9483', mat };
  }
  // ombrage « cylindre » d'une pièce (appelé dans un paint, donc clippé)
  function metal(pl, x0, x1, y0, y1) {
    const st = pl.mat === 'or' ? [[0, pl.d], [0.28, pl.b], [0.4, pl.l], [0.52, pl.b], [1, pl.d]]
      : pl.mat === 'peint' ? [[0, pl.d], [0.35, pl.b], [0.5, pl.l], [0.65, pl.b], [1, pl.d]]
        : [[0, pl.d], [0.35, pl.b], [0.55, pl.l], [0.75, pl.b], [1, pl.d]];
    grad(x0, 0, x1, 0, st, [x0 - 4, y0 - 4, x1 + 4, y1 + 4]);
  }
  function bulles(x0, x1, y0, y1, n, k, seed) {
    for (let i = 0; i < n; i++) {
      const x = lerp(x0, x1, hash(seed + i * 3.1)), y = lerp(y0, y1, hash(seed + i * 7.7)), r = (0.9 + hash(seed + i) * 1.1) * k;
      dot(x, y, r * 1.5, 'rgba(150,140,118,0.45)'); dot(x - r * 0.3, y - r * 0.3, r, 'rgba(255,255,250,0.7)');
    }
  }
  function geomOscar(o) {
    const fier = clamp(o.fier || 0), gene = clamp(o.gene || 0), e = ease(clamp(o.epee || 0));
    const cw = 1 + 0.08 * fier - 0.07 * gene;
    const shY = -336 - 6 * gene + 2 * fier;
    const hy = -5 * fier + 9 * gene, hr = -0.2 * gene;
    let G = [lerp(0, -8, e), lerp(-294, -262, e)];
    G = [G[0], lerp(G[1], -312, gene * (1 - e))];
    const th = e * (PI - 0.3);
    const sw = (p) => { const r = rot(p, th); return [G[0] + r[0], G[1] + r[1]]; };
    return { cw, shY, hy, hr, G, th, sw, fier, gene };
  }
  OSC.geomOscar = geomOscar;
  const LEGS = [[-21, -242], [21, -242], [19, -188], [14, -136], [11, -106], [16, -96], [19, -88, 1], [-19, -88, 1], [-16, -96], [-11, -106], [-14, -136], [-19, -188]];
  function ik2d(S, T, A, B, side) {
    const dx = T[0] - S[0], dy = T[1] - S[1]; const d = clamp(Math.hypot(dx, dy), Math.abs(A - B) + 1, A + B - 0.5);
    const a = Math.atan2(dy, dx), c1 = Math.acos(clamp((A * A + d * d - B * B) / (2 * A * d), -1, 1));
    const e1 = [S[0] + A * Math.cos(a + c1), S[1] + A * Math.sin(a + c1)], e2 = [S[0] + A * Math.cos(a - c1), S[1] + A * Math.sin(a - c1)];
    const E = side < 0 ? (e1[0] < e2[0] ? e1 : e2) : (e1[0] > e2[0] ? e1 : e2);
    const l = Math.hypot(T[0] - E[0], T[1] - E[1]) || 1;
    return { E, H: [E[0] + (T[0] - E[0]) * B / l, E[1] + (T[1] - E[1]) * B / l] };
  }
  function drawSocle(k, mat) {
    const pl = pal(mat), z = (p) => (p.length > 2 ? [p[0] * k, p[1] * k, 1] : [p[0] * k, p[1] * k]), Z = (a) => a.map(z);
    pc(Z([[-62, 0, 1], [62, 0, 1], [62, -6], [58, -12], [58, -24, 1], [-58, -24, 1], [-58, -12], [-62, -6]]), pl.d, () => {
      metal(pal(mat), -62 * k, 62 * k, -26 * k, 2 * k); fillPts(Z(rect(-64, -26, 64, -14)), 'rgba(0,0,0,0.12)');
      strokePts(Z([[-58, -13], [58, -13]]), 'rgba(255,245,210,0.5)', 1.1);
    }, 9001, { edge: pl.e });
    pc(Z([[-54, -22, 1], [54, -22, 1], [55, -30], [55, -82], [54, -88, 1], [-54, -88, 1], [-55, -82], [-55, -30]]), pl.b, () => {
      metal(pl, -55 * k, 55 * k, -90 * k, -20 * k);
      fillPts(Z(ell(0, -88, 54, 6, 18)), pl.l);
      // la bobine à 5 rayons, de face
      fillPts(Z(ell(0, -55, 29, 29, 24)), pl.d);
      fillPts(Z(ell(0, -55, 26.5, 26.5, 24)), pl.l);
      for (let i = 0; i < 5; i++) {
        const a = -PI / 2 + PI / 5 + i * TAU / 5, hx = Math.cos(a) * 15.5, hy = -55 + Math.sin(a) * 15.5;
        fillPts(Z(ell(hx, hy, 7.6, 7.6, 12)), pl.trou);
        strokePts(Z(ep(hx, hy, 7.6, 7.6, 6, PI * 0.15, PI * 0.85)), 'rgba(255,250,225,0.55)', 1);
      }
      fillPts(Z(ell(0, -55, 5, 5, 10)), pl.trou); dot(0, -55 * k, 2 * k, pl.l);
      strokePts(Z(ell(0, -55, 29, 29, 24)), 'rgba(40,28,8,0.55)', 1.2, true);
      if (mat === 'platre') bulles(-50 * k, 50 * k, -84 * k, -26 * k, 7, k, 41);
      if (mat === 'or') strokePts(Z([[-36, -30], [-36, -80]]), 'rgba(255,250,220,0.75)', 1.6);
    }, 9002, { edge: pl.e });
  }
  function drawEyes(f, k, pl, H) {
    const e = f.eyes || 'open', b = f.brow || 'n';
    for (const sx of [-1, 1]) {
      const ex = 8 * sx, ey = -16;
      if (e === 'closed') strokePts([H([ex - 3.5, ey - 0.5]), H([ex, ey + 2]), H([ex + 3.5, ey - 0.5])], pl.eye, 1.6);
      else if (e === 'half') { fillPts(ell(...H([ex, ey + 0.8]), 3.2 * k, 1.8 * k, 10), pl.eye); strokePts([H([ex - 4, ey - 1.2]), H([ex + 4, ey - 1.2])], pl.eye, 1.3); }
      else if (e === 'wide' || e === 'up' || e === 'down' || e === 'side') {
        fillPts(ell(...H([ex, ey]), 4.6 * k, 5.6 * k, 12), 'rgba(255,252,235,0.9)');
        const px = e === 'side' ? 1.6 : 0, py = e === 'up' ? -2.2 : e === 'down' ? 2.2 : 0;
        dot(...H([ex + px, ey + py]), 2.6 * k, pl.eye);
      } else { fillPts(ell(...H([ex, ey]), 3.1 * k, 4.3 * k, 12), pl.eye); dot(...H([ex + 0.9, ey - 1.4]), 0.9 * k, 'rgba(255,250,225,0.9)'); }
      const by = ey - 8, bi = b === 'up' ? [-2.5, -3.5] : b === 'worry' ? [-2.5, 0.5] : b === 'frown' ? [1.5, -1.5] : [-0.5, -0.5];
      // bi[0] = bout intérieur, bi[1] = bout extérieur (décalage vertical)
      strokePts([H([ex - 4.5 * sx, by + bi[0]]), H([ex + 4.5 * sx, by + bi[1]])], pl.eye, 1.4);
    }
  }
  function drawKnight(o, k, mat, g) {
    const pl = pal(mat), f = o.face || {}, z = (p) => (p.length > 2 ? [p[0] * k, p[1] * k, 1] : [p[0] * k, p[1] * k]), Z = (a) => a.map(z);
    const sp = Math.max(2.4, 4.2 * k), cw = g.cw, sy = g.shY, gold = mat !== 'platre';
    const hiL = 'rgba(255,248,215,' + (mat === 'or' ? 0.9 : 0.45) + ')';
    // jambes jointes
    pc(Z(LEGS), pl.b, () => {
      metal(pl, -21 * k, 21 * k, -244 * k, -86 * k);
      strokePts(Z([[0, -228], [0, -94]]), 'rgba(50,34,8,0.55)', 1.3);
      for (const y of [-150, -112]) strokePts(Z([[-15, y], [-1, y + 3]]), 'rgba(50,34,8,0.35)', 1), strokePts(Z([[15, y], [1, y + 3]]), 'rgba(50,34,8,0.35)', 1);
      if (gold) strokePts(Z([[-12, -230], [-8, -140], [-6, -100]]), hiL, 1.6);
      else { hatch(Z([[6, -240], [22, -240], [20, -90], [6, -90]]), 0.8, sp, 0.18); bulles(-18 * k, 18 * k, -230 * k, -100 * k, 6, k, 51); }
    }, 9010, { edge: pl.e });
    // torse cuirassé
    const TOR = [[-11, -358], [11, -358], [30 * cw, sy - 4], [37 * cw, sy + 6], [33 * cw, sy + 24], [27, -298], [19, -268], [24, -254], [25, -238], [-25, -238], [-24, -254], [-19, -268], [-27, -298], [-33 * cw, sy + 24], [-37 * cw, sy + 6], [-30 * cw, sy - 4]];
    pc(Z(TOR), pl.b, () => {
      metal(pl, -38 * k, 38 * k, -360 * k, -236 * k);
      fillPts(Z(rect(-26, -268, 26, -256)), pl.d);                                                   // ceinture
      strokePts(Z([[-22, sy + 10], [0, -300], [22, sy + 10]]), 'rgba(50,34,8,0.5)', 1.3);           // plastron en V (Art déco)
      strokePts(Z([[-14, sy + 22], [0, -288], [14, sy + 22]]), 'rgba(50,34,8,0.35)', 1.1);
      strokePts(Z([[0, -300], [0, -270]]), 'rgba(50,34,8,0.45)', 1.2);
      if (g.fier > 0) fillPts(Z(ell(-10, -318, 9 * g.fier, 14 * g.fier, 12)), 'rgba(255,248,215,0.35)');
      if (gold) strokePts(Z([[-16, -346], [-20, -300], [-12, -272]]), hiL, 1.8);
      else { hatch(Z([[8, -360], [40, -360], [40, -236], [8, -236]]), 0.8, sp, 0.16); bulles(-30 * k, 30 * k, -350 * k, -240 * k, 9, k, 61); }
    }, 9011, { edge: pl.e });
    // tête : casque arrondi, lisse ; repère de tête = cou (0,−358), incliné de hr, décalé de hy
    const H = (p) => { const r = rot(p, g.hr); return [r[0] * k, (r[1] - 358 + g.hy) * k]; };
    pc([H([-6, 4]), H([6, 4]), H([6, -8]), H([-6, -8])], pl.d, null, 9012, { edge: pl.e });
    pc(ep(0, -22, 19, 23, 22, 0, TAU).slice(0, -1).map(H), pl.b, () => {
      const c0 = H([0, -22]);
      metal(pl, c0[0] - 20 * k, c0[0] + 20 * k, c0[1] - 26 * k, c0[1] + 26 * k);
      strokePts(ep(0, -10, 19, 17, 10, PI * 1.08, PI * 1.92).map(H), 'rgba(50,34,8,0.5)', 1.2);      // bord du casque
      strokePts([H([0, -45]), H([0, -27])], 'rgba(50,34,8,0.45)', 1.2);                              // arête
      if (gold) strokePts([H([-11, -36]), H([-6, -41])], hiL, 2); else bulles(c0[0] - 14 * k, c0[0] + 14 * k, c0[1] - 18 * k, c0[1] + 16 * k, 4, k, 71);
      if (g.gene > 0) for (const sx of [-1, 1]) dot(...H([12.5 * sx, -8]), 4.2 * k, `rgba(225,105,105,${0.6 * g.gene})`);
      drawEyes(f, k, pl, H);
    }, 9013, { edge: pl.e });
    // bras articulés (épaules → mains sur la poignée)
    const SR = [-31 * cw, sy + 8], SL = [31 * cw, sy + 8], HR = g.sw([0, -6]), HL = g.sw([0, 6]);
    const aR = ik2d(SR, HR, 48, 46, -1), aL = ik2d(SL, HL, 48, 46, 1);
    for (const [S, a, sd] of [[SR, aR, 9020], [SL, aL, 9025]]) {
      pc(Z(capsule(S, a.E, 7.5, 6.5)), pl.b, () => { metal(pl, (Math.min(S[0], a.E[0]) - 8) * k, (Math.max(S[0], a.E[0]) + 8) * k, (Math.min(S[1], a.E[1]) - 8) * k, (Math.max(S[1], a.E[1]) + 8) * k); }, sd, { edge: pl.e });
      pc(Z(capsule(a.E, a.H, 6.5, 6)), pl.b, () => { metal(pl, (Math.min(a.H[0], a.E[0]) - 8) * k, (Math.max(a.H[0], a.E[0]) + 8) * k, (Math.min(a.H[1], a.E[1]) - 8) * k, (Math.max(a.H[1], a.E[1]) + 8) * k); }, sd + 1, { edge: pl.e });
      pc(Z(ell(S[0], S[1] - 2, 12 * cw, 9.5, 14)), pl.b, () => { fillPts(Z(ell(S[0] - 2, S[1] - 5, 6, 3, 8)), pl.l); }, sd + 2, { edge: pl.e });   // épaulière
    }
    // épée de croisé (garde en croix)
    const SWP = (a) => a.map((p) => z(g.sw(p)));
    pc(SWP([[-5.5, 19], [5.5, 19], [4.2, 118], [0, 134, 1], [-4.2, 118]]), pl.b, () => {
      fillPts(SWP([[-1, 22], [1, 22], [0.6, 112], [-0.6, 112]]), pl.d); if (gold) strokePts(SWP([[-3, 24], [-2.4, 110]]), hiL, 1.3);
    }, 9030, { edge: pl.e });
    pc(SWP([[-28, 11], [28, 11], [31, 15], [28, 19], [-28, 19], [-31, 15]]), pl.b, () => strokePts(SWP([[-26, 13.5], [26, 13.5]]), hiL, 1.2), 9031, { edge: pl.e });
    pc(SWP([[-3.4, -13], [3.4, -13], [3.4, 11], [-3.4, 11]]), pl.d, null, 9032, { edge: pl.e });
    pc(Z(ell(...g.sw([0, -18]), 5.5, 5.5, 10)), pl.b, null, 9033, { edge: pl.e });
    // poings sur la poignée (par-dessus)
    for (const [Hh, sd] of [[aR.H, 9040], [aL.H, 9041]]) pc(Z(ell(Hh[0], Hh[1], 8.6, 7.8, 12)), pl.b, () => {
      metal(pl, (Hh[0] - 9) * k, (Hh[0] + 9) * k, (Hh[1] - 9) * k, (Hh[1] + 9) * k);
      strokePts(Z([[Hh[0] - 5, Hh[1] - 1], [Hh[0] + 5, Hh[1] - 1]]), 'rgba(50,34,8,0.45)', 1);
    }, sd, { edge: pl.e });
  }
  // l'Oscar complet : o.matiere 'or'|'platre', peint, ecaille, trainee, socle (true), _k (échelle interne)
  function drawOscar(o) {
    const k = o._k || 1, g = geomOscar(o), mat = o.matiere === 'platre' ? 'platre' : 'or', pt = clamp(o.peint || 0);
    if (o.socle !== false) drawSocle(k, mat);
    drawKnight(o, k, mat, g);
    if (mat === 'platre' && pt > 0 && !SIL()) {
      const c = cx_(), yP = lerp(4, -406, pt), line = [];
      for (let x = -90; x <= 90; x += 6) line.push([x * k, (yP + 4 * Math.sin(x * 0.17 + 1) + 2.5 * Math.sin(x * 0.41)) * k]);
      c.save(); c.beginPath(); c.moveTo(-95 * k, 10 * k); for (const p of line) c.lineTo(p[0], p[1]); c.lineTo(95 * k, 10 * k); c.closePath(); c.clip();
      if (o.socle !== false) drawSocle(k, 'peint');
      drawKnight(o, k, 'peint', g);
      c.restore();
    }
    const ec = clamp(o.ecaille || 0);
    if (ec > 0 && (mat === 'or' || pt > 0.25)) {
      const C0 = [27 * g.cw, g.shY + 4], r = 5 + 11 * ec, pts = [];
      for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, rr = r * (0.65 + 0.5 * hash(77 + i)); pts.push([(C0[0] + Math.cos(a) * rr) * k, (C0[1] + Math.sin(a) * rr * 0.85) * k, 1]); }
      fillPts(pts.map((p) => [p[0] + 0.8 * k, p[1] + 1.2 * k, 1]), 'rgba(60,40,10,0.6)'); fillPts(pts, OR.plL); strokePts(pts, 'rgba(110,80,30,0.8)', 1, true);
      dot((C0[0] - 1) * k, (C0[1] + 1) * k, r * 0.35 * k, 'rgba(190,180,160,0.6)');
    }
    const tr = clamp(o.trainee || 0);
    if (tr > 0) {
      const y0 = g.shY - 8, L = 135 * tr, L2 = [], R2 = [];
      for (let i = 0; i <= 10; i++) { const u = i / 10, y = y0 + L * u, w = 5 + 1.6 * Math.sin(u * 9 + 1); L2.push([(9 - w) * k, y * k]); R2.push([(9 + w) * k, y * k]); }
      const sh = L2.concat(R2.reverse());
      fillPts(sh, 'rgba(250,247,238,0.95)'); strokePts(sh, 'rgba(140,120,80,0.45)', 0.9, true);
      fillPts(ell(9 * k, (y0 + L + 3) * k, 6.5 * k, 7.5 * k, 10), 'rgba(250,247,238,0.95)');
    }
  }

  // =====================================================================
  // AUTRES OBJETS (origine = point indiqué ; dessinés à k = 1)
  // =====================================================================
  function drawPot(o) {
    const ch = clamp(o.charge == null ? 1 : o.charge);
    pc([[-36, 0, 1], [36, 0, 1], [37, -78], [-37, -78]], '#9a9b98', () => {
      grad(-37, 0, 37, 0, [[0, '#5e605e'], [0.35, '#b7b8b4'], [0.5, '#d9d9d4'], [1, '#5e605e']], [-40, -82, 40, 4]);
      for (const y of [-8, -70]) strokePts([[-37, y], [37, y]], 'rgba(40,40,40,0.5)', 1.3);
      fillPts([[-37, -78], [37, -78], [37, -70], [20, -66], [16, -40], [10, -38], [8, -64], [-37, -70]], OR.or);   // coulure d'or
      fillPts(ell(13, -38, 3.4, 4.2, 8), OR.or); strokePts([[18, -70], [16, -46]], 'rgba(255,245,200,0.7)', 1.2);
      hatch([[10, -76], [36, -76], [36, 0], [10, 0]], 0.8, 4, 0.2);
    }, 9101);
    pc(ell(0, -79, 37, 6, 18), '#6d6e6a', () => fillPts(ell(0, -79 - 2 * ch, 33, 5 + 2 * ch, 16), OR.or), 9102);
    if (ch > 0.05) fillPts(ell(-8, -82 - 2 * ch, 10, 2, 8), 'rgba(250,230,150,0.8)');
    strokePts([[-35, -66], [-30, -100], [-14, -118], [0, -121], [14, -118], [30, -100], [35, -66]], '#3c3a36', 2.6);   // anse
    for (const sx of [-1, 1]) dot(35 * sx, -66, 3.2, '#4a4844');
  }
  function drawPinceau(o) {
    const ch = clamp(o.charge == null ? 1 : o.charge);
    pc([[-3.5, 40, 1], [3.5, 40, 1], [4.5, -36], [-4.5, -36]], '#8a5a30', () => { strokePts([[-1.5, 36], [-1.5, -32]], 'rgba(255,220,170,0.4)', 1.2); fillPts(rect(-5, 30, 5, 40), '#5a3a20'); }, 9111);
    pc([[-7, -34, 1], [7, -34, 1], [8, -56, 1], [-8, -56, 1]], '#a6a7a3', () => { grad(-8, 0, 8, 0, [[0, '#5e605e'], [0.45, '#e2e2dc'], [1, '#5e605e']], [-9, -58, 9, -32]); strokePts([[-8, -42], [8, -42]], 'rgba(40,40,40,0.5)', 1); }, 9112);
    pc([[-8, -56], [8, -56], [9, -74], [6, -84, 1], [-6, -84, 1], [-9, -74]], '#6a4a2a', () => {
      for (let x = -6; x <= 6; x += 3) strokePts([[x, -56], [x * 0.9, -82]], 'rgba(30,20,10,0.5)', 1);
      if (ch > 0) fillPts([[-10, -84], [10, -84], [10, -84 + 30 * ch], [-10, -82 + 26 * ch]], OR.or);
      if (ch > 0) strokePts([[-4, -82], [-3, -84 + 24 * ch]], 'rgba(255,245,200,0.8)', 1.3);
    }, 9113);
  }
  function drawEnveloppe() {
    pc(rect(-46, -30, 46, 30), '#ece4cf', () => {
      strokePts([[-46, -30], [0, 4], [46, -30]], 'rgba(120,100,70,0.6)', 1.3);
      strokePts([[-46, 30], [-12, 4]], 'rgba(120,100,70,0.35)', 1.1); strokePts([[46, 30], [12, 4]], 'rgba(120,100,70,0.35)', 1.1);
      hatch(null, 0.7, 4.4, 0.12);
    }, 9121);
    pc(ell(0, 4, 9, 8.5, 12), '#9c1f24', () => { dot(-2, 2, 3, 'rgba(255,150,140,0.45)'); strokePts(ep(0, 4, 5, 5, 8, 0.4, 2.6), 'rgba(60,8,10,0.6)', 1); }, 9122);
  }
  function drawMouchoir(o) {
    const sw = 4 * Math.sin((o.t || 0) * 2.3);
    const pts = [[-4, -4], [5, -4], [10, 14], [22 + sw, 40], [16 + sw, 58], [4 + sw, 62], [-10 + sw, 56], [-16 + sw * 0.6, 34], [-8, 12]];
    pc(pts, '#f4f0e6', () => {
      for (let i = 0; i < 4; i++) strokePts([[0, 0], [lerp(-12, 16, i / 3) + sw, 54]], 'rgba(150,140,120,0.4)', 1);
      hatch(null, 0.5, 3.6, 0.1);
    }, 9131);
    for (let i = 0; i <= 8; i++) { const u = i / 8, x = lerp(-16 + sw * 0.6, 22 + sw, u), y = 58 + 6 * Math.sin(u * PI) - 6 * u; dot(x, y, 2.6, 'rgba(244,240,230,0.95)'); dot(x, y, 1, 'rgba(160,150,130,0.6)'); }
  }
  function drawCrayon() {
    pc([[-3.6, -38, 1], [3.6, -38, 1], [3.6, 36], [0, 52, 1], [-3.6, 36]], '#c9a043', () => {
      fillPts([[-3.6, 36], [3.6, 36], [0, 52]], '#e2c49a'); fillPts([[-1.3, 47], [1.3, 47], [0, 52]], '#2a2622');
      strokePts([[1, -36], [1, 34]], 'rgba(255,240,190,0.6)', 1); strokePts([[-1.5, -36], [-1.5, 34]], 'rgba(90,60,10,0.4)', 1);
    }, 9141);
    pc(rect(-3.8, -46, 3.8, -38), '#c98c84', () => fillPts(rect(-4, -40, 4, -37), '#a8a8a2'), 9142);
  }
  // piédestal : colonne courte de marbre vert sombre à moulures dorées, dessus plat en y = −h
  function drawPiedestal(o) {
    const h = o.h || 260, gold = (y0, y1, w) => pc([[-w, y0, 1], [w, y0, 1], [w + 3, (y0 + y1) / 2], [w, y1, 1], [-w, y1, 1], [-w - 3, (y0 + y1) / 2]], OR.or, () => {
      grad(0, y1, 0, y0, [[0, OR.orD], [0.45, OR.orL], [1, OR.orD]], [-w - 4, y1 - 2, w + 4, y0 + 2]);
    }, 9150 + Math.round(y0), { edge: '#f8ebbb' });
    pc(rect(-96, 0, 96, -30), '#26382e', () => { grad(-96, 0, 96, 0, [[0, '#15211a'], [0.5, '#355246'], [1, '#15211a']], [-98, -32, 98, 2]); }, 9151);
    gold(-30, -44, 84);
    pc(rect(-68, -44, 68, -(h - 46)), '#2f4a3c', () => {
      grad(-68, 0, 68, 0, [[0, '#18261e'], [0.4, '#3c5c4c'], [0.55, '#46695a'], [1, '#18261e']], [-70, -h, 70, -40]);
      for (let i = 0; i < 6; i++) { const x0 = -60 + hash(91 + i) * 110; strokePts([[x0, -50], [x0 + 18 * (hash(i + 5) - 0.5), -110], [x0 - 10 + 30 * hash(i + 9), -(h - 60)]], 'rgba(200,225,205,0.25)', 1.2); }
      for (const x of [-40, -14, 14, 40]) strokePts([[x, -50], [x, -(h - 52)]], 'rgba(0,0,0,0.18)', 2);
      hatch([[24, -44], [68, -44], [68, -h], [24, -h]], 0.8, 4.4, 0.25);
    }, 9152);
    gold(-(h - 46), -(h - 32), 80);
    pc(rect(-90, -(h - 32), 90, -h), '#2f4a3c', () => {
      grad(-90, 0, 90, 0, [[0, '#18261e'], [0.5, '#46695a'], [1, '#18261e']], [-92, -h - 2, 92, -(h - 34)]);
      strokePts([[-90, -h + 2], [90, -h + 2]], OR.orL, 2.2);
    }, 9153);
  }

  // registre : grip = point tenu par le poing ; hs = échelle « tenu » ; p2 = seconde prise ; pts = points nommés ; base = (x,y) de l'objet seul
  const tipOscar = (o) => geomOscar(o).sw([0, 134]);
  const OBJ = {
    oscar: { draw: drawOscar, hs: 0.5, grip: [0, -8], p2: () => [0, -276], base: [0, 0],
      pts: { tete: [0, -400], crochet: [0, -402], epaule: (o) => [27 * geomOscar(o).cw, geomOscar(o).shY + 4], poitrine: (o) => [9, geomOscar(o).shY - 8], centre: [0, -250], pointe: tipOscar, socle: [0, -8], pieds: [0, -88] } },
    coque: { draw: (o) => drawOscar(Object.assign({}, o, { matiere: 'or', socle: false, peint: 0 })), hs: 0.5, grip: [0, -150], base: [0, 0],
      pts: { tete: [0, -400], crochet: [0, -402], centre: [0, -250], pieds: [0, -88], pointe: tipOscar } },
    pot: { draw: drawPot, grip: [0, -120], pts: { bord: [0, -80], fond: [0, 0] }, base: [0, 0] },
    pinceau: { draw: drawPinceau, grip: [0, 16], pts: { pointe: [0, -84] }, base: [0, 16] },
    enveloppe: { draw: drawEnveloppe, grip: [-36, 14], pts: { cachet: [0, 4] }, base: [0, 0] },
    mouchoir: { draw: drawMouchoir, grip: [0, 2], pts: { bas: [4, 60] }, base: [0, 2] },
    crayon: { draw: drawCrayon, grip: [0, 6], pts: { pointe: [0, 52] }, base: [0, 6] },
    piedestal: { draw: drawPiedestal, grip: [0, -130], pts: { dessus: (o) => [0, -(o.h || 260)] }, base: [0, 0] },
  };
  OSC.OBJ = OBJ;
  const gripOf = (ob, o) => (typeof ob.grip === 'function' ? ob.grip(o) : ob.grip);
  const ptOf = (ob, nom, o) => { const q = ob.pts && ob.pts[nom]; return q ? (typeof q === 'function' ? q(o) : q) : null; };
  const kOf = (ob, o) => (ob.hs || 1) * ((o && o.taille) || 1);
  function heldOpts(name, o, p) { return Object.assign({ t: p.t || 0 }, o || {}); }
  function heldDraw(name, o, p) {
    const ob = OBJ[name]; if (!ob) return;
    const oo = heldOpts(name, o, p), k = kOf(ob, oo), g = gripOf(ob, oo), c = cx_();
    oo._k = k; c.save(); c.translate(-g[0] * k, -g[1] * k);
    if (ob.hs) ob.draw(oo); else { c.scale(k, k); ob.draw(oo); }
    c.restore();
  }
  const DOIGTS = [[-12, -9], [9, -11], [12, -4], [12, 6], [6, 11], [-6, 11], [-12, 4]];
  const MAINB = [[-10, 66], [10, 66], [13, 88], [13, 100], [6, 106], [-4, 106], [-10, 98], [-10, 86]];
  const doigtsPaint = () => { for (const y of [-3, 2, 7]) strokePts([[-9, y], [10, y - 1]], 'rgba(70,40,30,0.45)', 1); hatch(null, 0.9, 3.4, 0.12); };
  function heldParts(skin, seed) {
    return {
      objet: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (has(p.tenu)) heldDraw(p.tenu, p.tenuO, p); } },
      doigts: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 2, pts: (p) => (has(p.tenu) ? DOIGTS : OFFP), paint: doigtsPaint },
      objetB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 3, pts: OFFP, extra: (p) => { if (has(p.tenuB)) heldDraw(p.tenuB, p.tenuBO, p); } },
      doigtsB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 4, pts: (p) => (has(p.tenuB) || p._deux ? DOIGTS : OFFP), paint: doigtsPaint },
      // deuxMains : la main arrière repasse DEVANT l'objet (elle l'entoure)
      mainB: { parent: 'armB_lo', at: [0, 0], noRivet: true, base: skin, seed: seed + 5, pts: (p) => (p._deux ? MAINB : OFFP), paint: () => { for (const y of [90, 97]) strokePts([[-6, y], [12, y]], 'rgba(70,40,30,0.45)', 1); } },
    };
  }
  // point nommé de l'objet tenu (écran) ; OSC.pt(r,'main') = poing avant, OSC.pt(r,'main',true) = poing arrière
  OSC.pt = function (r, nom, arriere) {
    if (nom === 'main') return r.w(arriere ? 'armB_lo' : 'armF_lo', 2, 98);
    const name = arriere ? r.tenuB : r.tenu, ob = OBJ[name]; if (!ob) return null;
    const oo = (arriere ? r.tenuBO : r.tenuO) || {}, q = ptOf(ob, nom, oo); if (!q) return null;
    const g = gripOf(ob, oo), k = kOf(ob, oo);
    return r.w(arriere ? 'objetB' : 'objet', (q[0] - g[0]) * k, (q[1] - g[1]) * k);
  };

  // =====================================================================
  // MARIONNETTES — pièces communes, poses, gestes par M.ik
  // =====================================================================
  const R_COUDE = 11.5, LA = 96;
  function armR(len, wt) { wt = wt || 15; return ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1, 40], [R_COUDE + 0.5, len - 6]], ep(0, len, R_COUDE, R_COUDE, 10, 0, PI), [[-R_COUDE - 0.5, len - 6], [-wt + 1, 40]]); }
  // main 'paume' : doigts tendus dont le bout remonte (paume offerte vers le haut quand l'avant-bras est horizontal)
  const HAND_PAUME = [[-9, 78], [9, 78], [11, 86], [10, 98], [11, 108], [16, 116], [14, 122], [5, 121], [-4, 118], [-9, 106], [-9, 90]];
  function foreKind(kind) {
    if (kind === 'paume') return [[-11, -8], [11, -8], [10, 40], [9, 76], ...HAND_PAUME.slice(2, -1).map((p) => [p[0] * 1.05, p[1]]), [-9, 86], [-10, 76], [-11, 40]];
    return X.forePts(kind === 'open' ? 'open' : 'fist');
  }
  function foreR(kind) { return ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU).concat(foreKind(kind).slice(2)); }
  function foreDef(parent, base, skin, back, seed, cuffCol) {
    const hk = (p) => (back ? p.handB : p.handF) || 'fist';
    return { parent, at: [0, LA], pts: (p) => foreR(hk(p)), base, seed, paint: (p) => {
      const k = hk(p);
      fillPts([[-20, 76, 1], [20, 76, 1], [24, 130, 1], [-20, 130, 1]], skin);
      if (k === 'paume') { strokePts([[2, 100], [6, 114]], 'rgba(70,35,20,0.45)', 1); strokePts([[-3, 100], [0, 116]], 'rgba(70,35,20,0.45)', 1); }
      else X.handPaint(null, k === 'open' ? 'open' : 'fist');
      if (cuffCol) fillPts([[-14, 62, 1], [14, 62, 1], [15, 78, 1], [-14, 78, 1]], cuffCol);
      hatch([[-14, -10], [-3, -10], [-3, 60], [-14, 60]], 0.9, 3.8, 0.22);
    } };
  }
  const upDef = (at, base, seed, paint) => ({ parent: 'torso', at, pts: armR(LA), base, seed, paint: paint || (() => hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.28)) });
  function legDef(at, base, shoe, seed, back, sy) {
    sy = sy || 1;
    const pts = X.legPts(0.92).map((p) => (p.length > 2 ? [p[0], p[1] * sy, 1] : [p[0], p[1] * sy]));
    return { parent: 'torso', at, pts, base, seed, noRivet: !!back, paint: () => {
      fillPts([[-40, 214 * sy, 1], [60, 214 * sy, 1], [60, 262 * sy, 1], [-40, 262 * sy, 1]], shoe);
      if (!back) { strokePts([[20, 224 * sy], [42, 229 * sy]], 'rgba(255,255,255,0.25)', 1.3); hatch([[-26, -20], [-6, -20], [-6, 214 * sy], [-26, 214 * sy]], 0.8, 4, 0.25); }
      else hatch(null, 0.8, 3.6, 0.3);
    } };
  }

  // bendSign de M.ik par personnage, bras et direction (vérifiés sur la planche de casting : aucun « coude à l'envers »)
  OSC.BEND = {
    star: { armF: { 1: 1, '-1': 1 }, armB: { 1: 1, '-1': 1 } },
    academie: { armF: { 1: 1, '-1': 1 }, armB: { 1: 1, '-1': 1 } },
    gibbons: { armF: { 1: 1, '-1': 1 }, armB: { 1: 1, '-1': 1 } },
  };
  function prep(p) { p = p || {}; return Object.assign({}, p, { ang: Object.assign({}, p.ang), hide: Object.assign({}, p.hide), face: Object.assign({}, p.face) }); }
  // E = contexte de pose : def, q, x, y, s, dir, nom
  const matsOf = (E) => M.partMatrices(E.def, E.q, E.x, E.y, E.s, E.dir).mats;
  const ptT = (E, lx, ly) => M.wpt(matsOf(E).torso, lx, ly);           // point du torse → écran
  const ptH = (E, hx, hy) => M.wpt(matsOf(E).head, hx, hy);            // point de la tête → écran
  function reach(E, arm, T, k) {
    if (!(k > 0) || !T) return;
    const b = OSC.BEND[E.nom][arm][E.dir > 0 ? 1 : '-1'];
    const sol = M.ik(E.def, E.q, E.x, E.y, E.s, E.dir, arm, T, b), A = E.q.ang;
    const a0 = A[arm + '_up'] || 0, b0 = A[arm + '_lo'] || 0;
    A[arm + '_up'] = a0 + normA(sol.up - a0) * k; A[arm + '_lo'] = b0 + normA(sol.lo - b0) * k;
  }
  // cible donnée pour la POINTE de l'objet tenu (pinceau, crayon) → cible du poing (objet droit, tourné de angObj)
  function handForTip(E, name, oo, cible, angObj) {
    const ob = OBJ[name]; if (!ob || !ob.pts || !ob.pts.pointe) return cible;
    const kk = kOf(ob, oo), g = gripOf(ob, oo), tp = ptOf(ob, 'pointe', oo);
    const v = rot([(tp[0] - g[0]) * kk, (tp[1] - g[1]) * kk], angObj);
    return [cible[0] - v[0] * E.s * E.dir, cible[1] - v[1] * E.s];
  }
  const blend = (q, n, v, k) => { q.ang[n] = lerp(q.ang[n] || 0, v, k); };
  function finish(E) {
    const q = E.q, A = q.ang, tl = q.tilt || 0;
    if (has(q.tenu) && (!q.handF || q.handF === 'open' || q.handF === 'paume') && !q._mainLibre) q.handF = 'fist';
    if (has(q.tenuB) && (!q.handB || q.handB === 'open' || q.handB === 'paume')) q.handB = 'fist';
    if (q.droit == null && has(q.tenu)) q.droit = true;
    if (q.droitB == null && has(q.tenuB)) q.droitB = true;
    if (q.droit) A.objet = (A.objet || 0) - ((A.armF_up || 0) + (A.armF_lo || 0) + tl);
    if (q.droitB) A.objetB = (A.objetB || 0) - ((A.armB_up || 0) + (A.armB_lo || 0) + tl);
    q._deux = false;
    if (q.deuxMains && has(q.tenu) && OBJ[q.tenu] && OBJ[q.tenu].p2) {
      const ob = OBJ[q.tenu], oo = heldOpts(q.tenu, q.tenuO, q), g = gripOf(ob, oo), kk = kOf(ob, oo), p2 = ob.p2(oo);
      const T = M.wpt(matsOf(E).objet, (p2[0] - g[0]) * kk, (p2[1] - g[1]) * kk);
      const k2 = q.deuxMains === true ? 1 : clamp(q.deuxMains);
      reach(E, 'armB', T, k2); if (k2 > 0.5) { q.handB = 'fist'; q._deux = true; }
    }
    return q;
  }
  function run(def, q, x, y, s, o) {
    const r = M.puppet(def, q, x, y, s, Object.assign({ nom: def.nom }, o || {}));
    r.tenu = q.tenu; r.tenuB = q.tenuB;
    if (q.tenu && OBJ[q.tenu]) r.tenuO = heldOpts(q.tenu, q.tenuO, q);
    if (q.tenuB && OBJ[q.tenuB]) r.tenuBO = heldOpts(q.tenuB, q.tenuBO, q);
    r.q = q;
    return r;
  }
  function wrap(nom, defKey, poseFn, s0) {
    return (pose, x, y, s, o) => {
      s = s == null ? s0 : s; const dir = (o && o.dir) || 1;
      const E = { def: CH[defKey], q: prep(pose), x, y, s, dir, nom };
      poseFn(E); finish(E);
      return run(E.def, E.q, x, y, s, o);
    };
  }

  // =====================================================================
  // LA STAR (années 1940) — fourreau bordeaux, étole de fourrure ivoire, cheveux platine ondulés, longs gants blancs, mouche
  // =====================================================================
  const SR_ = { peau: '#efd1b5', peauD: '#d3ae90', robe: '#6e1f2e', robeD: '#521522', robeL: '#8e3346', gant: '#f2eee5', gantD: '#d8d1c2', etole: '#ece4cf', etoleD: '#cfc4a8', che: '#e8dcb0', cheD: '#c2b07c', cheL: '#f8f2da', levres: '#a51f2c' };
  const SR_TORSO = [[-10, -180], [8, -184], [16, -170], [22, -152], [30, -130], [31, -112], [22, -96], [17, -70], [21, -36], [27, -2], [26, 40], [22, 92], [18, 142], [21, 176], [30, 206], [42, 228], [46, 238, 1], [-78, 238, 1], [-58, 224], [-40, 198], [-29, 150], [-28, 92], [-32, 30], [-34, -2], [-28, -40], [-23, -72], [-26, -110], [-28, -142], [-24, -166], [-18, -176]];
  const SR_HEAD = [[-12, 16], [8, 16], [9, 2], [14, -6], [20, -10], [23, -15], [22, -19], [25, -22], [23, -25], [25, -29], [31, -35, 1], [27, -42], [24, -52], [25, -60], [21, -72], [10, -82], [-6, -86], [-22, -82], [-30, -66], [-30, -44], [-24, -28], [-16, -10]];
  const SR_HAIR = [[22, -62], [29, -70], [30, -80], [20, -92], [4, -100], [-14, -100], [-30, -92], [-40, -76], [-44, -56], [-46, -34], [-43, -14], [-47, 4], [-42, 20], [-30, 26], [-22, 16], [-25, 2], [-20, -12], [-23, -28], [-16, -44], [-10, -58], [0, -70], [12, -72]];
  const SR_ETOLE = [[-30, -178], [-12, -186], [6, -182], [20, -168], [28, -150], [32, -134], [24, -122], [10, -128], [-6, -134], [-22, -124], [-34, -104], [-42, -80], [-46, -56], [-40, -50], [-36, -70], [-30, -96], [-34, -128], [-38, -156]];
  function mkStar() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: SR_TORSO, base: SR_.robe, seed: 7301, paint: () => {
        fillPts([[-30, -196], [34, -196], [32, -128], [18, -122], [4, -130], [-14, -136], [-30, -140]], SR_.peau);             // épaules nues, décolleté
        strokePts([[32, -128], [18, -122], [4, -130]], 'rgba(60,10,20,0.6)', 1.4);
        for (const [a, b] of [[[24, -112], [18, -80]], [[22, -30], [24, 30]], [[18, 60], [14, 140]], [[24, 180], [36, 226]]]) strokePts([a, b], SR_.robeL, 3);   // reflets satinés
        strokePts([[20, -100], [16, -70], [20, -30], [24, 10]], 'rgba(255,190,200,0.25)', 1.4);
        for (const x of [-60, -44, -28, -10, 8, 26]) strokePts([[x * 0.5 + 6, 196], [x, 236]], 'rgba(30,5,10,0.45)', 1.3);   // évasement en sirène
        hatch([[-80, -150], [-12, -150], [-16, 240], [-80, 240]], 0.75, 4.4, 0.28);
        shade(40, 0, -60, 0, 0.28, [-90, -200, 60, 250]);
      } },
      armB_up: upDef([-10, -146], SR_.peauD, 7302, () => hatch(null, 0.9, 3.8, 0.18)),
      armB_lo: foreDef('armB_up', SR_.gantD, SR_.gantD, true, 7303),
      head: { parent: 'torso', at: [6, -170], pts: SR_HEAD, base: SR_.peau, seed: 7304, noRivet: true, paint: (p) => {
        const f = p.face || {};
        dot(-4, -32, 3, '#f6f2ea');                                                                    // perle d'oreille
        hatch([[-22, -40], [0, -28], [8, -8], [-8, 18], [-30, 4]], 0.6, 3.8, 0.16);
        dot(14, -30, 8, 'rgba(220,120,120,0.3)');
        X.eye(f, 16, -48, 0.95);
        if ((f.eyes || 'open') !== 'closed') for (const d of [0, 2.5, 5]) strokePts([[10 + d, -51.5 + d * 0.15], [8 + d * 1.2, -55.5]], 'rgba(28,16,14,0.9)', 1.1);   // cils
        else for (const d of [0, 3, 6]) strokePts([[11 + d, -47.5], [10 + d, -44]], 'rgba(28,16,14,0.8)', 1);
        X.brow(f, 16, -57, 'rgba(120,96,60,0.95)', 1.5);
        const m = f.mouth || 'n';
        if (m === 'o') fillPts(ell(24, -20, 3, 3.6, 8), '#5a1418');
        else { fillPts([[17, -22], [21, -24], [26, -23], [27, -21], [26, -18], [21, -17], [17, -19]], SR_.levres); if (m === 'smile') strokePts([[17, -20], [21, -19.5], [26, -21]], 'rgba(60,10,14,0.8)', 1); else strokePts([[17, -20.5], [26, -20.5]], 'rgba(60,10,14,0.7)', 0.9); }
        dot(19, -33, 1.7, '#2a1814');                                                                    // mouche
      }, extra: (p) => {
        const pl = clamp(p.pleure || 0) + clamp(p.larmes || 0); if (pl <= 0 || SIL()) return;
        const t = p.t || 0;
        for (let i = 0; i < 3; i++) {                                                                   // larmes bleu pâle qui coulent
          const u = (t * 0.9 + i / 3) % 1, x = 18 - 3 * u, y = -42 + 34 * u, r = 2.6 * Math.min(1, pl);
          fillPts([[x, y - r * 2.2], [x + r, y], [x, y + r], [x - r, y]], `rgba(175,210,240,${0.9 * (1 - u * 0.6)})`);
        }
        strokePts([[17, -43], [16, -34], [14, -24]], 'rgba(175,210,240,0.55)', 1.4);
      } },
      cheveux: { parent: 'head', at: [0, 0], pts: SR_HAIR, base: SR_.che, seed: 7305, noRivet: true, paint: () => {
        for (let k = 0; k < 5; k++) { const y = -84 + k * 20; strokePts([[-42 + k, y], [-30, y - 6], [-18, y + 4], [-8, y - 4]], SR_.cheD, 1.6); }
        strokePts([[26, -76], [14, -90], [-4, -94], [-20, -86]], SR_.cheD, 1.8); strokePts([[22, -70], [10, -82], [-6, -84]], SR_.cheL, 2);   // grande vague du front
        strokePts([[-34, -40], [-40, -20], [-36, 0], [-42, 14]], SR_.cheL, 2.2);
        hatch([[-48, -60], [-30, -60], [-30, 30], [-48, 30]], 0.6, 3.6, 0.16);
      } },
      etole: { parent: 'torso', at: [0, 0], pts: SR_ETOLE, base: SR_.etole, seed: 7306, noRivet: true, paint: () => {
        for (let i = 0; i < 26; i++) { const x = -44 + hash(i + 11) * 74, y = -184 + hash(i + 31) * 130; strokePts([[x, y], [x - 3, y + 6]], 'rgba(160,145,110,0.55)', 1); }
        shade(30, -150, -40, -100, 0.3, [-50, -190, 40, -40]);
      } },
      armF_up: upDef([-2, -146], SR_.peau, 7307, () => { hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.16); }),
      armF_lo: foreDef('armF_up', SR_.gant, SR_.gant, false, 7308),
    };
    parts.armF_lo.paint = ((pp) => (p) => { pp(p); strokePts([[-11, 6], [11, 6]], 'rgba(160,150,130,0.6)', 1.2); })(parts.armF_lo.paint);
    Object.assign(parts, heldParts(SR_.gant, 7320));
    return { nom: 'star', hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-14, 40] },
      order: ['armB_up', 'armB_lo', 'objetB', 'doigtsB', 'head', 'cheveux', 'torso', 'etole', 'armF_up', 'armF_lo', 'objet', 'doigts', 'mainB'] };
  }
  CH.oscStar = mkStar();
  function starPose(E) {
    const q = E.q, A = q.ang, t = q.t || 0;
    if (q.tenu == null) q.tenu = q.pleure > 0 ? 'mouchoir' : 'rien';
    const pl = ease(clamp(q.pleure || 0)), se = ease(clamp(q.serre || 0)), br = ease(clamp(q.brandir || 0)), ra = ease(clamp(q.rattrape || 0)), sa = ease(clamp(q.salut || 0));
    if (sa > 0) { q.tilt = (q.tilt || 0) + 0.09 * sa; q.dy = (q.dy || 0) + 12 * sa; blend(q, 'head', 0.32, sa); blend(q, 'armF_up', -0.5, sa); blend(q, 'armF_lo', 0.1, sa); blend(q, 'armB_up', 0.4, sa); if (!q.face.eyes) q.face.eyes = 'closed'; if (!q.face.mouth) q.face.mouth = 'smile'; }
    if (pl > 0) { blend(q, 'head', 0.12, pl); if (!q.face.eyes) q.face.eyes = 'closed'; if (!q.face.brow) q.face.brow = 'worry'; }
    if (se > 0) { blend(q, 'head', 0.16, se); if (!q.face.eyes && se > 0.5) q.face.eyes = 'closed'; if (!q.face.mouth) q.face.mouth = 'smile'; }
    if (br > 0) { blend(q, 'head', -0.1, br); if (!q.face.mouth) q.face.mouth = 'smile'; }
    if (ra > 0) { q.tilt = (q.tilt || 0) + 0.05 * ra; if (!q.face.mouth) q.face.mouth = 'o'; if (!q.face.eyes) q.face.eyes = 'wide'; }
    // gestes de bras (M.ik, cibles calculées sur le corps)
    if (pl > 0) reach(E, 'armF', ptH(E, 30, -40), pl);                          // mouchoir au coin de l'œil
    if (se > 0) { reach(E, 'armF', ptT(E, 50, 30), se); if (q.deuxMains == null && q.tenu === 'oscar') q.deuxMains = se; }
    if (br > 0) reach(E, 'armF', ptT(E, 156, -150), br);
    if (ra > 0) { reach(E, 'armF', ptT(E, 124, -66), ra); reach(E, 'armB', ptT(E, 104, -44), ra); if (ra > 0.4) { q.handF = q.handF || 'paume'; q.handB = q.handB || 'paume'; q._mainLibre = true; } }
    return q;
  }
  OSC.star = wrap('star', 'oscStar', starPose, 0.94);

  // =====================================================================
  // MONSIEUR L'ACADÉMIE — smoking noir à revers satinés, plastron et nœud papillon blancs, œillet rouge, crâne chauve luisant,
  // couronne de cheveux gris, fine moustache grise, lunettes rondes cerclées d'or, ventre rond
  // =====================================================================
  const AC = { peau: '#e6c19e', peauD: '#c99f7c', noir: '#1e1c22', noirD: '#141217', satin: '#3e3a46', plastron: '#f0ece2', plD: '#d6d0c2', gris: '#bdbab3', rouge: '#b0262e', pant: '#222027', chaus: '#0f0e10' };
  const AC_TORSO = [[-14, -176], [8, -180], [18, -168], [30, -150], [40, -122], [52, -90], [60, -54], [61, -18], [54, 12], [42, 30], [44, 70], [46, 98, 1], [-48, 100, 1], [-46, 40], [-44, -20], [-44, -80], [-42, -120], [-36, -150], [-26, -168]];
  function mkAcademie() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: AC_TORSO, base: AC.noir, seed: 7401, paint: () => {
        fillPts([[4, -182], [18, -170], [30, -148], [40, -120], [50, -92], [44, -88], [32, -118], [20, -146], [8, -166]], AC.plastron);   // plastron
        for (const y of [-150, -130, -110]) dot(22 + (y + 150) * 0.45, y, 1.8, '#2a2a2a');
        fillPts([[0, -174], [12, -152], [26, -118], [42, -84], [36, -78], [20, -114], [6, -146]], AC.satin);                            // revers satiné
        strokePts([[4, -168], [16, -144], [30, -110], [40, -86]], 'rgba(200,195,215,0.4)', 1.4);
        strokePts([[52, -60], [60, -30], [56, 0]], 'rgba(150,145,165,0.35)', 2);                                                  // ventre rond
        dot(40, -76, 2.4, '#0a090b'); strokePts([[-46, 16], [44, 14]], 'rgba(0,0,0,0.5)', 1.4);
        hatch([[-54, -170], [-12, -170], [-12, 100], [-54, 100]], 0.75, 4.2, 0.22, 1.05, '200,200,210');
        shade(56, -40, -40, -40, 0.25);
      } },
      oeillet: { parent: 'torso', at: [20, -132], pts: ell(0, 0, 7, 6.5, 12), base: AC.rouge, seed: 7402, noRivet: true, paint: () => {
        for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; strokePts([[0, 0], [Math.cos(a) * 6, Math.sin(a) * 6]], 'rgba(90,10,14,0.7)', 1); }
        fillPts([[-1, 6], [1, 6], [-2, 14], [-4, 14]], '#4a5e3a');
      } },
      noeud: { parent: 'torso', at: [16, -170], pts: [[-8, -6], [0, -2], [8, -7], [8, 6], [0, 2], [-8, 7]], base: AC.plastron, seed: 7403, noRivet: true, paint: () => fillPts(ell(0, 0, 2.6, 3, 8), AC.plD) },
      legB: legDef([-6, -2], '#18161b', AC.chaus, 7404, true),
      legF: legDef([6, -2], AC.pant, AC.chaus, 7405, false),
      armB_up: upDef([-10, -146], AC.noirD, 7406, () => hatch(null, 0.9, 3.8, 0.2, 1, '200,200,210')),
      armB_lo: foreDef('armB_up', AC.noirD, AC.peauD, true, 7407, AC.plD),
      head: { parent: 'torso', at: [6, -170], pts: X.NAP_HEAD, base: AC.peau, seed: 7408, noRivet: true, paint: (p) => {
        const f = p.face || {};
        fillPts([[-34, -66], [-22, -72], [-10, -68], [-6, -54], [-12, -32], [-22, -22], [-32, -30], [-36, -48]], AC.gris);           // couronne grise
        for (let i = 0; i < 4; i++) strokePts([[-32 + i * 5, -64], [-28 + i * 4, -34]], 'rgba(110,105,98,0.6)', 1);
        X.earPaint(-8, -46);
        strokePts([[-4, -94], [12, -91], [22, -84]], 'rgba(255,250,235,0.85)', 3); dot(4, -88, 3, 'rgba(255,250,235,0.6)');   // crâne luisant
        hatch([[-22, -40], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.22);
        dot(16, -36, 8, 'rgba(210,120,100,0.28)');
        X.eye(f, 18, -52); X.brow(f, 18, -61, 'rgba(140,135,128,0.95)', 2.4);
        fillPts([[22, -31], [30, -33], [36, -31], [34, -28], [26, -28]], AC.gris);                                                 // fine moustache
        X.mouth(f, 28, -23);
        const ring = ell(19, -52, 9.5, 9.5, 14);
        fillPts(ring, 'rgba(200,225,235,0.22)'); strokePts(ring, '#c39a36', 1.8, true); strokePts([[9.5, -53], [-8, -52]], '#c39a36', 1.4);
        strokePts([[14, -58], [20, -59]], 'rgba(255,255,255,0.7)', 1.2);
      } },
      armF_up: upDef([-2, -146], AC.noir, 7409, () => hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.2, 1, '200,200,210')),
      armF_lo: foreDef('armF_up', AC.noir, AC.peau, false, 7410, AC.plastron),
    };
    Object.assign(parts, heldParts(AC.peau, 7420));
    return { nom: 'academie', hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] },
      order: ['armB_up', 'armB_lo', 'objetB', 'doigtsB', 'legB', 'legF', 'head', 'torso', 'oeillet', 'noeud', 'armF_up', 'armF_lo', 'objet', 'doigts', 'mainB'] };
  }
  CH.oscAcademie = mkAcademie();
  function academiePose(E) {
    const q = E.q, A = q.ang, t = q.t || 0;
    const te = ease(clamp(q.tendre || 0)), ap = ease(clamp(q.appel || 0)), pe = ease(clamp(q.peindre || 0)), fi = ease(clamp(q.fier || 0)), ca = ease(clamp(q.cache || 0));
    if (q.tenu == null && pe > 0) q.tenu = 'pinceau';
    if (q.tenuB === 'pot' && E.q.ang.armB_up == null && !(ca > 0)) { A.armB_up = 0.42; A.armB_lo = -0.25; }
    if (fi > 0) { q.tilt = (q.tilt || 0) - 0.05 * fi; blend(q, 'head', -0.16, fi); if (!q.face.mouth) q.face.mouth = 'smile'; blend(q, 'armB_up', 0.25, fi); }
    if (ap > 0) { blend(q, 'head', 0.06, ap); if (!q.face.mouth) q.face.mouth = 'smile'; if (!q.face.brow) q.face.brow = 'up'; }
    if (ca > 0) { blend(q, 'head', 0.1, ca); if (!q.face.mouth) q.face.mouth = 'tight'; }
    if (te > 0) reach(E, 'armF', ptT(E, 172, -118), te);
    if (ap > 0) { reach(E, 'armF', ptT(E, 112, -44), ap); if (!has(q.tenu) && ap > 0.4) q.handF = q.handF || 'paume'; }
    if (pe > 0) {
      const oo = heldOpts(q.tenu, q.tenuO, q), ao = (A.objet || 0) + 1.2;
      A.objet = ao; q.droit = true;
      const C = q.cible || ptT(E, 150, -112), wig = 7 * Math.sin(t * TAU * 2.2) * E.s;
      reach(E, 'armF', handForTip(E, q.tenu, oo, [C[0], C[1] + wig], ao), pe);
      blend(q, 'head', 0.08, pe);
    }
    if (ca > 0) { reach(E, 'armF', ptH(E, 34, -48), ca); reach(E, 'armB', ptH(E, 42, -46), ca); if (ca > 0.4) { q.handF = 'open'; q.handB = 'open'; q._mainLibre = true; } }
    return q;
  }
  OSC.academie = wrap('academie', 'oscAcademie', academiePose, 0.93);

  // =====================================================================
  // CEDRIC GIBBONS (années 1920) — grand et mince, trois-pièces gris perle, gilet bordeaux sombre, cravate vert éteint,
  // cheveux noirs gominés raie au milieu, fine moustache noire en trait, crayon derrière l'oreille
  // =====================================================================
  const GB = { peau: '#e2c3a0', peauD: '#c5a17e', gris: '#8d8f8c', grisD: '#737571', grisL: '#a8aaa6', gilet: '#5a1f28', cravate: '#4f5e45', chemise: '#ece8de', che: '#151315', chaus: '#2c221d' };
  const GB_SY = 1.13;  // jambes allongées : hanche à −270
  const GB_TORSO = [[-14, -176], [8, -180], [16, -168], [25, -150], [31, -118], [33, -80], [31, -40], [29, 0], [33, 60], [37, 104, 1], [-37, 106, 1], [-35, 50], [-33, -10], [-33, -70], [-33, -116], [-29, -150], [-23, -168]];
  function mkGibbons() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: GB_TORSO, base: GB.gris, seed: 7501, paint: () => {
        fillPts([[8, -166], [22, -152], [28, -120], [31, -80], [29, -40], [18, -40], [16, -100], [10, -140]], GB.gilet);
        for (const y of [-120, -100, -80, -60]) dot(25, y, 1.8, '#2a0c10');
        fillPts([[4, -184], [17, -172], [14, -160], [3, -170]], GB.chemise);
        fillPts([[12, -168], [19, -160], [21, -130], [18, -112], [14, -118], [14, -150]], GB.cravate);
        fillPts([[0, -176], [10, -156], [16, -120], [20, -70], [14, -66], [8, -120], [-2, -152]], GB.grisD);       // revers
        strokePts([[18, -40], [26, 104]], 'rgba(40,40,40,0.45)', 1.3); dot(22, -10, 2.2, '#3a3a38');
        strokePts([[-10, -96], [12, -98]], 'rgba(40,40,40,0.4)', 1.2);
        fillPts([[-4, -104], [6, -104], [5, -98], [-4, -98]], '#ece8de');                                           // pochette
        hatch([[-46, -170], [-12, -170], [-12, 110], [-46, 110]], 0.75, 4.2, 0.28);
        shade(36, 0, -40, 0, 0.26);
      } },
      legB: legDef([-6, -2], GB.grisD, GB.chaus, 7502, true, GB_SY),
      legF: legDef([6, -2], GB.gris, GB.chaus, 7503, false, GB_SY),
      armB_up: upDef([-10, -146], GB.grisD, 7504),
      armB_lo: foreDef('armB_up', GB.grisD, GB.peauD, true, 7505, '#cfcabe'),
      head: { parent: 'torso', at: [6, -170], pts: X.NAP_HEAD, base: GB.peau, seed: 7506, noRivet: true, paint: (p) => {
        const f = p.face || {};
        X.earPaint(-8, -44);
        hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.24);
        X.eye(f, 17, -52); X.brow(f, 17, -61, 'rgba(20,16,16,0.95)', 2.4);
        strokePts([[22, -31.5], [35, -32.5]], '#141214', 2.2);                                                     // moustache en trait
        X.mouth(f, 28, -24);
      } },
      // cheveux gominés : raie au milieu (ligne de crâne clair sur le dessus), reflet brillant, tempe et oreille dégagées
      cheveux: { parent: 'head', at: [0, 0], noRivet: true, base: GB.che, seed: 7507,
        pts: [[28, -70], [26, -82], [16, -93], [4, -99], [-1, -96, 1], [-5, -99], [-20, -95], [-32, -82], [-36, -62], [-34, -44], [-28, -32], [-22, -36], [-20, -50], [-14, -60], [-4, -65], [10, -68], [20, -71]],
        paint: () => {
          for (let i = 0; i < 5; i++) strokePts([[24 - i * 3, -78 + i * 1.5], [6, -88 + i * 4], [-16, -86 + i * 6], [-30, -70 + i * 7]], 'rgba(120,120,140,0.45)', 1);   // traits de peigne
          strokePts([[24, -86], [10, -95], [-4, -96], [-20, -93], [-30, -84]], GB.peau, 2.2);                                     // la raie (peau du crâne)
          strokePts([[22, -84], [8, -92], [-4, -93], [-18, -90]], 'rgba(120,80,60,0.6)', 0.8);
          strokePts([[18, -80], [4, -86], [-12, -84], [-24, -76]], 'rgba(235,240,255,0.8)', 3.2);                                 // reflet gominé
          strokePts([[14, -76], [0, -79], [-10, -77]], 'rgba(235,240,255,0.45)', 1.6);
        } },
      // crayon court posé en biais derrière l'oreille : gomme rose dépassant derrière la tête, pointe taillée + mine devant l'oreille
      crayonO: { parent: 'head', at: [-24, -54], rest: -1.0, noRivet: true, base: '#c9a043', seed: 7508,
        pts: (p) => (p.tenu === 'crayon' || p.crayonOreille === false ? OFFP : [[-3.6, -32, 1], [3.6, -32, 1], [3.6, 22], [0, 33, 1], [-3.6, 22]]),
        paint: () => {
          fillPts(rect(-4, -33, 4, -26), '#d98f8a'); fillPts(rect(-4, -26, 4, -22), '#a8a8a2');
          strokePts([[1.2, -22], [1.2, 21]], 'rgba(255,240,190,0.7)', 1); strokePts([[-1.8, -22], [-1.8, 21]], 'rgba(110,70,10,0.45)', 1);
          fillPts([[-3.6, 22], [3.6, 22], [0, 33]], '#ecd2a6'); fillPts([[-1.4, 28.5], [1.4, 28.5], [0, 33.5]], '#1e1a18');
        } },
      oreille: { parent: 'head', at: [0, 0], noRivet: true, base: GB.peau, seed: 7511, pts: (p) => (p.tenu === 'crayon' || p.crayonOreille === false ? OFFP : [[-13, -52], [-5, -53], [-2, -46], [-4, -37], [-9, -34], [-13, -39]]),
        paint: () => X.earPaint(-8, -44) },
      armF_up: upDef([-2, -146], GB.gris, 7509),
      armF_lo: foreDef('armF_up', GB.gris, GB.peau, false, 7510, GB.chemise),
    };
    Object.assign(parts, heldParts(GB.peau, 7520));
    return { nom: 'gibbons', hipY: -238 * GB_SY, parts, handLen: 100, rod: { part: 'torso', at: [-24, 18] },
      order: ['armB_up', 'armB_lo', 'objetB', 'doigtsB', 'legB', 'legF', 'head', 'cheveux', 'crayonO', 'oreille', 'torso', 'armF_up', 'armF_lo', 'objet', 'doigts', 'mainB'] };
  }
  CH.oscGibbons = mkGibbons();
  function gibbonsPose(E) {
    const q = E.q, A = q.ang, t = q.t || 0;
    const de = ease(clamp(q.dessiner || 0)), ta = ease(clamp(q.tapote || 0)), sc = clamp(q.secoue || 0), fi = ease(clamp(q.fier || 0)), ba = ease(clamp(q.baille || 0)), as = clamp(q.assis || 0);
    if (q.tenu == null) q.tenu = de > 0 ? 'crayon' : 'rien';
    if (as > 0) { q.dy = (q.dy || 0) + 120 * as; if (as > 0.5) { q.hide.legF = 1; q.hide.legB = 1; } }
    if (fi > 0) { q.tilt = (q.tilt || 0) - 0.05 * fi; blend(q, 'head', -0.16, fi); if (!q.face.mouth) q.face.mouth = 'smile'; }
    if (ba > 0) { blend(q, 'head', -0.14, ba); if (!q.face.mouth) q.face.mouth = 'o'; if (!q.face.eyes) q.face.eyes = 'closed'; }
    if (sc > 0) { if (!q.face.mouth) q.face.mouth = 'tight'; if (!q.face.brow) q.face.brow = 'worry'; blend(q, 'armF_up', -0.55, sc); blend(q, 'armF_lo', -1.15 + 0.5 * Math.sin(t * 26), sc); if (!has(q.tenu)) q.handF = 'open'; }
    if (de > 0) {
      const oo = heldOpts(q.tenu, q.tenuO, q), ao = (A.objet || 0) - 0.45;
      A.objet = ao; q.droit = true;
      const C = q.cible || ptT(E, 120, -96), sx = (5 * Math.sin(t * 17) + 3 * Math.sin(t * 7)) * E.s, sy = 3 * Math.sin(t * 13) * E.s;
      reach(E, 'armF', handForTip(E, q.tenu, oo, [C[0] + sx, C[1] + sy], ao), de);
      blend(q, 'head', 0.18, de);
    }
    if (ta > 0) {
      const C = q.cible || ptT(E, 130, -150), up = 14 * Math.abs(Math.sin(t * PI * 2.5)) * E.s;
      reach(E, 'armF', [C[0], C[1] - up], ta); if (!has(q.tenu)) q.handF = 'open';
    }
    if (ba > 0) { reach(E, 'armF', ptH(E, 40, -22), ba); if (!has(q.tenu)) q.handF = 'open'; }
    return q;
  }
  OSC.gibbons = wrap('gibbons', 'oscGibbons', gibbonsPose, 0.92);

  // =====================================================================
  // ACCESSOIRES SEULS — M.puppet à une pièce invisible ; l'objet se dessine dans l'extra (ombre portée possible)
  // =====================================================================
  const accDefs = {};
  function accDef(name, tige) {
    const key = name + (tige ? '+' : '');
    if (accDefs[key]) return accDefs[key];
    const ob = OBJ[name];
    const fn = (oo) => { const c = cx_(); c.save(); c.translate(-ob.base[0], -ob.base[1]); ob.draw(Object.assign({ _k: 1 }, oo)); c.restore(); };
    return (accDefs[key] = { hipY: 0, handLen: 10, rod: tige ? { part: 'o', at: [0, -4] } : null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => fn(p.o) } }, order: ['o'] });
  }
  function acc(name, x, y, s, o) {
    o = o || {}; s = s == null ? 1 : s;
    const ob = OBJ[name], def = accDef(name, !!o.tige);
    const r = M.puppet(def, { o, tilt: o.rot || 0, dy: o.dy || 0 }, x, y, s, { dir: o.dir || 1, rod: !!o.tige, rodLean: 0, slot: o.slot != null ? o.slot : y + 6 * s, floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
    r.pt = (nom) => { const q = ptOf(ob, nom, o); return q ? r.w('o', q[0] - ob.base[0], q[1] - ob.base[1]) : null; };
    return r;
  }
  for (const n of Object.keys(OBJ)) OSC[n] = (x, y, s, o) => acc(n, x, y, s, o);

  // =====================================================================
  // DÉCOR : la salle de l'Académie (pré-rendue) — OSC.salle(t, { guerre, ceremonie, ciel })
  // =====================================================================
  const SALLE = OSC.SALLE = { fenetre: { x0: 420, x1: 660, y0: 430, y1: 900, cx: 540, cy: 550, r: 120 }, colonnes: [128, 952], tentures: [[214, 400], [680, 866]], lambris: 1000, sol: ST.back };
  function fenPath(x, F, inset) {
    const i = inset || 0; x.beginPath(); x.moveTo(F.x0 + i, F.y1 - i); x.lineTo(F.x0 + i, F.cy); x.arc(F.cx, F.cy, F.r - i, PI, TAU); x.lineTo(F.x1 - i, F.y1 - i); x.closePath();
  }
  function drawTenture(x, x0, x1, seed, flip) {
    const y0 = 300, y1 = 1000, mid = (x0 + x1) / 2, ty = 780;
    const pts = flip ? [[x0, y0, 1], [x1, y0, 1], [x1, y1, 1], [x0, y1, 1], [x0 + 30, 900], [x1 - 80, ty], [x0 + 10, 560]]
      : [[x0, y0, 1], [x1, y0, 1], [x1 - 10, 560], [x0 + 80, ty], [x1 - 30, 900], [x1, y1, 1], [x0, y1, 1]];
    piece(pts, '#b8913f', () => {
      const g = x.createLinearGradient(x0, 0, x1, 0);
      for (let i = 0; i <= 8; i++) g.addColorStop(i / 8, i % 2 ? '#d8b35a' : '#8f6c28');
      x.fillStyle = g; x.fillRect(x0 - 10, y0, x1 - x0 + 20, y1 - y0);
      // éventail Art déco en haut de la tenture (rayons, sans lettre)
      const fx = mid, fy = 420;
      for (let i = 0; i < 11; i++) {
        const a = PI + (i + 0.5) / 11 * PI, a2 = PI + (i + 1) / 11 * PI;
        x.beginPath(); x.moveTo(fx, fy); x.arc(fx, fy, 86, PI + i / 11 * PI, a2); x.closePath();
        x.fillStyle = i % 2 ? 'rgba(250,225,150,0.55)' : 'rgba(110,80,25,0.45)'; x.fill();
      }
      x.beginPath(); x.arc(fx, fy, 22, PI, TAU); x.fillStyle = '#f0d77a'; x.fill();
      x.strokeStyle = 'rgba(110,80,25,0.7)'; x.lineWidth = 3; x.beginPath(); x.arc(fx, fy, 90, PI, TAU); x.stroke();
      for (let k = 0; k < 4; k++) { x.strokeStyle = 'rgba(90,60,20,0.4)'; x.lineWidth = 2; x.beginPath(); x.moveTo(x0 + 24 + k * 40, 520); x.quadraticCurveTo(x0 + 30 + k * 34, 760, x0 + 20 + k * 44, 990); x.stroke(); }
      hatch(null, 0.9, 5, 0.18, 1, P.encre, [x0, y0, x1, y1]);
    }, { seed });
    // embrasse
    piece(ell(flip ? x1 - 80 : x0 + 80, ty, 20, 12, 12), '#7a2a2a', () => { x.fillStyle = 'rgba(240,200,120,0.6)'; x.fillRect(-2000, ty - 8, 4000, 3); }, { seed: seed + 1 });
    // franges
    x.strokeStyle = '#d8b35a'; x.lineWidth = 2; x.beginPath(); for (let px = x0 + 4; px < x1 - 4; px += 6) { x.moveTo(px, y1 - 2); x.lineTo(px, y1 + 12); } x.stroke();
  }
  function drawColonne(x, cxc, seed) {
    piece([[cxc - 62, 1400, 1], [cxc + 62, 1400, 1], [cxc + 62, 1340, 1], [cxc + 46, 1330], [cxc + 42, 360], [cxc + 60, 330], [cxc + 66, 290, 1], [cxc - 66, 290, 1], [cxc - 60, 330], [cxc - 42, 360], [cxc - 46, 1330], [cxc - 62, 1340, 1]], '#d8cbb0', () => {
      for (let k = -32; k <= 32; k += 10.5) { x.strokeStyle = 'rgba(90,75,50,0.45)'; x.lineWidth = 2.4; x.beginPath(); x.moveTo(cxc + k, 368); x.lineTo(cxc + k, 1326); x.stroke(); x.strokeStyle = 'rgba(255,250,235,0.45)'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(cxc + k + 3, 368); x.lineTo(cxc + k + 3, 1326); x.stroke(); }
      const g = x.createLinearGradient(0, 290, 0, 368); g.addColorStop(0, '#8a6a1e'); g.addColorStop(0.5, '#f0d77a'); g.addColorStop(1, '#8a6a1e');
      x.fillStyle = g; x.fillRect(cxc - 70, 290, 140, 76);
      for (let k = -50; k <= 50; k += 16) { x.beginPath(); x.moveTo(cxc + k - 7, 366); x.lineTo(cxc + k, 300); x.lineTo(cxc + k + 7, 366); x.fillStyle = 'rgba(90,60,15,0.45)'; x.fill(); }
      x.fillStyle = '#8a6a1e'; x.fillRect(cxc - 70, 1330, 140, 12);
      x.fillStyle = '#3b3530'; x.fillRect(cxc - 70, 1342, 140, 60);
      hatch([[cxc + 12, 368], [cxc + 50, 368], [cxc + 50, 1330], [cxc + 12, 1330]], 0.9, 4.2, 0.3);
      shade(cxc - 60, 0, cxc + 60, 0, 0.3, [cxc - 80, 280, cxc + 80, 1400]);
    }, { seed });
  }
  function makeSalle(ceremonie) {
    const H = ST.back + 5, F = SALLE.fenetre;
    return M.pre(M.W, H, (x) => {
      // mur brun chaud à boiseries
      x.fillStyle = '#6c4629'; x.fillRect(0, 0, M.W, H);
      for (let k = 0; k < M.W; k += 60) { x.fillStyle = 'rgba(30,15,5,0.16)'; x.fillRect(k, 320, 3, 680); x.fillStyle = 'rgba(255,220,170,0.06)'; x.fillRect(k + 3, 320, 2, 680); }
      hatch(null, 0.15, 6, 0.12, 1, P.encre, [0, 300, M.W, 1000]);
      // corniche + frise dorée à chevrons
      x.fillStyle = '#2c1d12'; x.fillRect(0, 0, M.W, 262);
      piece(rect(-10, 258, M.W + 10, 312), '#b8913f', () => {
        const g = x.createLinearGradient(0, 258, 0, 312); g.addColorStop(0, '#8a6a1e'); g.addColorStop(0.5, '#e8c96e'); g.addColorStop(1, '#8a6a1e'); x.fillStyle = g; x.fillRect(0, 256, M.W, 60);
        x.strokeStyle = 'rgba(80,55,15,0.7)'; x.lineWidth = 2.2; x.beginPath(); for (let k = 0; k <= M.W + 30; k += 30) { x.moveTo(k - 15, 300); x.lineTo(k, 272); x.lineTo(k + 15, 300); } x.stroke();
      }, { seed: 7601 });
      // fenêtre cintrée (vitres TRANSPARENTES : le ciel se dessine dessous) + éventail au-dessus
      if (!ceremonie) {
        for (let i = 0; i < 15; i++) {
          x.beginPath(); x.moveTo(F.cx, F.cy); x.arc(F.cx, F.cy, 250, PI + i / 15 * PI, PI + (i + 1) / 15 * PI); x.closePath();
          x.fillStyle = i % 2 ? 'rgba(232,200,110,0.55)' : 'rgba(150,110,40,0.5)'; x.fill();
        }
        x.save(); fenPath(x, F, -22); x.fillStyle = '#4a3020'; x.fill(); x.lineWidth = 3; x.strokeStyle = 'rgba(240,215,140,0.8)'; x.stroke(); x.restore();
        x.save(); fenPath(x, F, 0); x.globalCompositeOperation = 'destination-out'; x.fill(); x.restore();
        // meneaux et petits bois
        x.fillStyle = '#3a2618';
        x.fillRect(F.cx - 5, F.cy - F.r, 10, F.y1 - F.cy + F.r); x.fillRect(F.x0, 700, F.x1 - F.x0, 9);
        for (let a = 1; a < 4; a++) { const an = PI + a / 4 * PI; x.save(); x.translate(F.cx, F.cy); x.rotate(an); x.fillRect(0, -3, F.r, 6); x.restore(); }
        x.fillRect(F.x0, F.cy - 3, F.x1 - F.x0, 6);
        piece(rect(F.x0 - 34, F.y1, F.x1 + 34, F.y1 + 22), '#5a3a22', null, { seed: 7602 });
      } else {
        // rideau de fond étoilé (cérémonie) à la place de la fenêtre
        piece([[392, 300, 1], [688, 300, 1], [692, 1000, 1], [388, 1000, 1]], '#1c2240', () => {
          for (let k = 0; k < 8; k++) { x.strokeStyle = 'rgba(0,0,10,0.45)'; x.lineWidth = 6; x.beginPath(); x.moveTo(400 + k * 38, 300); x.quadraticCurveTo(396 + k * 38, 650, 404 + k * 38, 1000); x.stroke(); }
          const rg = M.rng(7);
          for (let i = 0; i < 46; i++) { const sx = 400 + rg() * 280, sy = 320 + rg() * 660, r = 3 + rg() * 5; x.fillStyle = 'rgba(240,215,130,0.9)'; x.beginPath(); for (let j = 0; j < 10; j++) { const a = -PI / 2 + j * PI / 5, rr = j % 2 ? r * 0.42 : r; x.lineTo(sx + Math.cos(a) * rr, sy + Math.sin(a) * rr); } x.closePath(); x.fill(); }
        }, { seed: 7603 });
      }
      drawTenture(x, SALLE.tentures[0][0], SALLE.tentures[0][1], 7610, false);
      drawTenture(x, SALLE.tentures[1][0], SALLE.tentures[1][1], 7620, true);
      // lambris couleur miel
      piece(rect(-10, 996, M.W + 10, 1020), '#7a5230', () => { x.fillStyle = 'rgba(255,225,170,0.35)'; x.fillRect(0, 998, M.W, 3); }, { seed: 7630 });
      piece(rect(-10, 1020, M.W + 10, H + 10), '#9a6a3c', () => {
        for (let k = 0; k < 8; k++) { const x0 = 14 + k * 134; x.fillStyle = '#ab7a48'; x.fillRect(x0, 1044, 112, 290); x.strokeStyle = 'rgba(60,30,10,0.55)'; x.lineWidth = 2.5; x.strokeRect(x0, 1044, 112, 290); x.strokeStyle = 'rgba(255,225,170,0.3)'; x.lineWidth = 1.5; x.strokeRect(x0 + 8, 1052, 96, 274); }
        x.fillStyle = '#5a3a20'; x.fillRect(0, 1350, M.W, 60);
        hatch(null, 0.2, 4.6, 0.14, 1, P.encre, [0, 1020, M.W, H]);
      }, { seed: 7631 });
      drawColonne(x, SALLE.colonnes[0], 7640); drawColonne(x, SALLE.colonnes[1], 7650);
      x.save(); x.globalCompositeOperation = 'multiply'; x.globalAlpha = 0.5; x.fillStyle = M.tex.canvasPat; x.fillRect(0, 0, M.W, H); x.restore();
    });
  }
  function teinte(cv, col, a, mode) {
    return M.pre(cv.width, cv.height, (x) => {
      x.drawImage(cv, 0, 0); x.globalCompositeOperation = mode || 'multiply'; x.globalAlpha = a; x.fillStyle = col; x.fillRect(0, 0, cv.width, cv.height);
      x.globalAlpha = 1; x.globalCompositeOperation = 'destination-in'; x.drawImage(cv, 0, 0);
    });
  }
  function cielDefaut(x, F, nuit, t) {
    const g = x.createLinearGradient(0, F.y0, 0, F.y1);
    if (nuit) { g.addColorStop(0, '#0e1430'); g.addColorStop(1, '#2a3050'); } else { g.addColorStop(0, '#b9d0e0'); g.addColorStop(1, '#f4ead0'); }
    x.fillStyle = g; x.fillRect(F.x0 - 30, F.y0 - 30, F.x1 - F.x0 + 60, F.y1 - F.y0 + 60);
    if (nuit) { const rg = M.rng(3); for (let i = 0; i < 18; i++) { x.fillStyle = `rgba(240,235,210,${0.4 + 0.4 * Math.sin(t * 2 + i)})`; x.fillRect(F.x0 + rg() * (F.x1 - F.x0), F.y0 + rg() * 300, 2, 2); } }
    else { x.fillStyle = 'rgba(255,255,255,0.5)'; for (const [a, b, w] of [[470, 620, 70], [600, 690, 50]]) { x.beginPath(); x.ellipse(a + 10 * Math.sin(t * 0.2), b, w, 14, 0, 0, TAU); x.fill(); } }
    x.fillStyle = nuit ? '#1a1d2a' : '#8a8c80';                                     // toits lointains
    x.beginPath(); x.moveTo(F.x0, F.y1); for (let px = F.x0; px <= F.x1; px += 20) x.lineTo(px, F.y1 - 40 - 30 * hash(px)); x.lineTo(F.x1, F.y1); x.fill();
  }
  OSC.salle = function (t, o) {
    o = o || {}; const x = M.ctx(), K = OSC.K, F = SALLE.fenetre, g = clamp(o.guerre || 0), ce = clamp(o.ceremonie || 0);
    if (ce < 1) {
      x.save(); fenPath(x, F, -2); x.clip();
      if (typeof o.ciel === 'function') o.ciel(x, F, t); else { cielDefaut(x, F, false, t); if (g > 0) { x.globalAlpha = g; cielDefaut(x, F, true, t); x.globalAlpha = 1; } }
      x.restore();
      x.drawImage(K.salle, 0, 0);
      if (g > 0) { x.save(); x.globalAlpha = g; x.drawImage(K.salleNuit, 0, 0); x.restore(); }
    }
    if (ce > 0) {
      x.save(); x.globalAlpha = ce; x.drawImage(K.salleCeremonie, 0, 0);
      // projecteurs qui balaient la toile
      x.globalCompositeOperation = 'lighter';
      for (const [sx, ph] of [[300, 0], [780, 2.1]]) {
        const a = 0.22 * Math.sin(t * 0.7 + ph), ex = sx + Math.sin(a) * 1100 + (sx < 540 ? 180 : -180);
        const gr = x.createLinearGradient(sx, 260, ex, 1300); gr.addColorStop(0, 'rgba(255,235,180,0.30)'); gr.addColorStop(1, 'rgba(255,235,180,0)');
        x.fillStyle = gr; x.beginPath(); x.moveTo(sx - 14, 262); x.lineTo(sx + 14, 262); x.lineTo(ex + 150, 1395); x.lineTo(ex - 150, 1395); x.closePath(); x.fill();
      }
      x.restore();
    }
  };

  OSC.init = function () {
    const K = (OSC.K = {});
    K.salle = makeSalle(false);
    K.salleNuit = teinte(teinte(K.salle, '#2a3a6a', 0.55, 'multiply'), '#000010', 0.25, 'source-over');
    K.salleCeremonie = teinte(makeSalle(true), '#30284a', 0.3, 'multiply');
    return K;
  };
})();
