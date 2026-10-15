// persos.js — « L'étoile Mercedes, une carte postale » : marionnettes, accessoires et décors PROPRES À CETTE VIDÉO. Espace M.mer (alias MER). Appeler MER.init() dans S.init.
// Mode d'emploi : persos.md (ne pas lire ce fichier en entier). Aucun texte, lettre, chiffre ni logo. Déterministe (aucun Math.random).
// MARIONNETTES : MER.daimler / emma / paul / adolf / pub (pose,x,y,s,o) — toujours par l'enveloppe ; tenu/tenuB, tenuO/tenuBO, droit, deuxMains,
//   gestes communs montrer, tendre, brandir, devant ; daimler : ecrire, reflechir, chapeau ; emma : joindre, tapePied, hocher, sacMain ; paul : fier ;
//   adolf : tamponner ; pub : presenter (= montrer). MER.pt(r,'nom') = point écran de l'objet tenu.
// ACCESSOIRES (x,y,s,o) : etoile, carte, voiture, maison, hautDeForme, portrait, tampon, document, bulle, usine, icone({type}), moteur, couronne,
//   croquis, chevalet, facture, sac, piedestal, plume, mallette. Renvoient r (r.pt('nom')).
// DÉCORS : MER.init() → MER.K = { salon, salonVieux, avenue, toile } ; MER.toile(k,t) ; MER.salonFumee(t).
(function () {
  'use strict';
  const X = M.X, P = M.P, TAU = M.TAU, PI = Math.PI, D = 180 / PI, ST = M.ST;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, easeOut, easeIn, hash } = M;
  const CH = M.chars;
  const MER = (M.mer = {});
  const cx_ = () => M.ctx(), SIL = () => M._sil();
  const OFFP = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];
  const has = (v) => v && v !== 'rien';
  const mixc = (a, b, t) => M.mixc(a, b, clamp(t));

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
  const normA = (a) => { while (a > PI) a -= TAU; while (a < -PI) a += TAU; return a; };
  function rrect(x0, y0, x1, y1, r) {
    return ep(x1 - r, y0 + r, r, r, 4, -PI / 2, 0).concat(ep(x1 - r, y1 - r, r, r, 4, 0, PI / 2), ep(x0 + r, y1 - r, r, r, 4, PI / 2, PI), ep(x0 + r, y0 + r, r, r, 4, PI, PI * 1.5));
  }
  // anneau plein (roue, couronne) : cercle extérieur puis intérieur à l'envers → trou au centre
  function ringPts(cx, cy, r0, r1, n) {
    const o = ep(cx, cy, r0, r0, n, 0, TAU).map((p) => [p[0], p[1]]); o[0].push(1); o[o.length - 1].push(1);
    const i = ep(cx, cy, r1, r1, n, TAU, 0).map((p) => [p[0], p[1]]); i[0].push(1); i[i.length - 1].push(1);
    return o.concat(i);
  }
  const rect = (x0, y0, x1, y1) => [[x0, y0, 1], [x1, y0, 1], [x1, y1, 1], [x0, y1, 1]];
  const cadre = (x0, y0, x1, y1, col, lw) => strokePts(rect(x0, y0, x1, y1), col, lw, true);
  const pc = (pts, base, paint, seed, o) => piece(pts, base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));
  const backOut = (k) => { k = clamp(k); const s = 1.9; return 1 + (s + 1) * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2); };

  // bras à articulations rondes (épaule et coude en demi-cercles centrés sur le rivet)
  const R_COUDE = 11.5, LA = 96, LB = Math.hypot(4, 96), PHI = Math.atan2(-4, 96), SH_F = [-2, -146], SH_B = [-10, -146];
  function armR(len, wt) { wt = wt || 15; return ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1, 40], [R_COUDE + 0.5, len - 6]], ep(0, len, R_COUDE, R_COUDE, 10, 0, PI), [[-R_COUDE - 0.5, len - 6], [-wt + 1, 40]]); }
  function foreR(kind) { const f = X.forePts(kind); return ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU).concat(f.slice(2)); }
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
  // OBJETS — chaque objet se dessine dans son repère : seul (accessoire) ou tenu (pièce 'objet' de l'avant-bras)
  // =====================================================================
  const OR = { or: '#c8a24a', orL: '#e8cf86', orD: '#8a6a28', terne: '#4f4a42', terneL: '#6e685c', laiton: '#b8913f', laitonL: '#e0c47a', laitonD: '#76592a' };
  const INK = 'rgba(92,58,32,0.92)', NUIT = '#23314f';

  // ---------------- étoile à trois branches : 0 haut, 1 bas-droite, 2 bas-gauche ; origine = centre ; R = longueur d'une branche (100)
  const BR_IDX = { h: 0, haut: 0, airs: 0, bd: 1, eau: 1, bg: 2, terre: 2 };
  function starGeom(R) {
    const ri = R * 0.21, T = [], I = [];
    for (let i = 0; i < 3; i++) { const a = -PI / 2 + i * TAU / 3, b = a + PI / 3; T.push([R * Math.cos(a), R * Math.sin(a)]); I.push([ri * Math.cos(b), ri * Math.sin(b)]); }
    return { T, I, out: [T[0], I[0], T[1], I[1], T[2], I[2]].map((p) => [p[0], p[1], 1]) };
  }
  function glow(x, y, r, col, a) {
    if (SIL() || a <= 0.01) return;
    const c = cx_(), g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`);
    c.save(); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.restore();
  }
  function drawEtoile(o) {
    const R = o.R || 100, g = starGeom(R), c = cx_(), t = o.t || 0;
    const br = o.branche == null ? 3 : clamp(o.branche, 0, 3), ordre = o.ordre || ['bg', 'bd', 'h'];
    const lit = [0, 0, 0]; ordre.forEach((n, k) => { lit[BR_IDX[n] != null ? BR_IDX[n] : k] = clamp(br - k); });
    const h = clamp(Math.max(o.halo || 0, o.eclat || 0));
    if (o.rot) { c.save(); c.rotate(o.rot); }
    if (h > 0.01 && !SIL()) {
      glow(0, 0, R * 1.9, '255,226,140', 0.55 * h);
      c.save(); c.globalAlpha = 0.5 * h; c.fillStyle = 'rgba(255,236,170,0.9)';
      for (let i = 0; i < 12; i++) { const a = i * TAU / 12 + t * 0.35, w = 0.06; c.beginPath(); c.moveTo(Math.cos(a - w) * R * 0.4, Math.sin(a - w) * R * 0.4); c.lineTo(Math.cos(a) * R * (1.5 + 0.3 * (i % 2)), Math.sin(a) * R * (1.5 + 0.3 * (i % 2))); c.lineTo(Math.cos(a + w) * R * 0.4, Math.sin(a + w) * R * 0.4); c.fill(); }
      c.restore();
    }
    for (let i = 0; i < 3; i++) { const f = lit[i]; if (f > 0 && f < 1) glow(g.T[i][0] * 0.8, g.T[i][1] * 0.8, R * 0.7, '255,230,150', 0.9 * Math.sin(PI * f)); }
    if (o.plume) {                                                                // version griffonnée à la plume (carte postale)
      fillPts(g.out, `rgba(205,165,70,${o.or == null ? 0.85 : o.or})`, 0, 0);
      strokePts(g.out, INK, 1.5, true, 3); strokePts(g.out.map((p) => [p[0] * 1.04 + 0.6, p[1] * 1.04 - 0.4, 1]), 'rgba(92,58,32,0.45)', 1, true, 7);
      for (let i = 0; i < 3; i++) strokePts([[0, 0], [g.T[i][0] * 0.9, g.T[i][1] * 0.9]], 'rgba(92,58,32,0.6)', 0.9);
      if (o.rot) c.restore(); return;
    }
    if (o.encre) {                                                                // imprimée au tampon (encre bleu nuit, cœur or)
      fillPts(g.out, `rgba(200,162,74,${o.encre})`, 0, 0.3);
      strokePts(g.out, `rgba(35,49,79,${o.encre})`, 2.6, true, 5);
      for (let i = 0; i < 3; i++) strokePts([[0, 0], [g.T[i][0] * 0.92, g.T[i][1] * 0.92]], `rgba(35,49,79,${0.7 * o.encre})`, 1.3);
      if (o.rot) c.restore(); return;
    }
    pc(g.out, OR.orD, () => {
      for (let i = 0; i < 3; i++) {
        const L = g.I[(i + 2) % 3], Rr = g.I[i], f = lit[i];
        fillPts([[g.T[i][0], g.T[i][1], 1], [L[0], L[1], 1], [0, 0, 1]], mixc(OR.terneL, OR.orL, f), 0, 0);
        fillPts([[g.T[i][0], g.T[i][1], 1], [0, 0, 1], [Rr[0], Rr[1], 1]], mixc(OR.terne, '#b08a38', f), 0, 0);
        strokePts([[g.T[i][0] * 0.96, g.T[i][1] * 0.96], [0, 0]], `rgba(255,246,214,${0.25 + 0.4 * f})`, 1.3);
      }
      hatch(null, 0.6, 4.2, 0.16, 1, P.encre, [-R, -R, R, R]);
    }, 9001, { texA: 0.35 });
    M.rivet(0, 0, Math.max(3, R * 0.065));
    if (o.rot) c.restore();
  }

  // ---------------- carte postale (1872) : 150 × 100 ; origine = centre ; o.taille agrandit dans la main
  function drawMaisonCroquis(o) {
    fillPts(rect(-36, 2, 16, 34), 'rgba(222,204,166,0.75)');
    strokePts([[-36, 34, 1], [-36, 2, 1], [16, 2, 1], [16, 34, 1]], INK, 1.4);
    fillPts([[-44, 5, 1], [-10, -20, 1], [24, 5, 1]], '#a54a34');
    strokePts([[-44, 5, 1], [-10, -20, 1], [24, 5, 1]], INK, 1.4, true);
    for (let k = 0; k < 4; k++) strokePts([[-34 + k * 6, 2 - k * 4.5], [12 - k * 6, 2 - k * 4.5]], 'rgba(92,40,24,0.45)', 0.8);
    fillPts(rect(4, -22, 11, -9), '#8f3e2c'); strokePts([[4, -10, 1], [4, -22, 1], [11, -22, 1], [11, -14, 1]], INK, 1.2);
    strokePts([[8, -25], [5, -29], [10, -32], [6, -36]], 'rgba(92,58,32,0.5)', 0.9);
    fillPts(rect(-16, 16, -6, 34), 'rgba(92,58,32,0.6)');
    for (const wx of [-30, 2]) { fillPts(rect(wx, 10, wx + 9, 19), 'rgba(110,130,140,0.55)'); cadre(wx, 10, wx + 9, 19, INK, 0.9); }
    strokePts([[-66, 36], [-30, 37], [10, 35], [66, 37]], INK, 1.2);
    strokePts([[-62, 40], [-50, 39]], 'rgba(92,58,32,0.4)', 0.8); strokePts([[40, 40], [56, 39]], 'rgba(92,58,32,0.4)', 0.8);
    const e = clamp(o.etoile || 0);
    if (e > 0.01) { const c = cx_(), k = backOut(e); c.save(); c.translate(-10, -35); c.scale(k, k); drawEtoile({ R: 15, plume: true, halo: o.halo || 0, t: o.t }); c.restore(); }
  }
  function drawCarte(o) {
    const c = cx_(), ta = o.taille || 1, rt = clamp(o.retourne || 0), f = Math.cos(PI * rt);
    const adresse = (o.face === 'adresse') !== (rt > 0.5);
    c.save(); c.scale(ta * Math.max(0.03, Math.abs(f)), ta);
    pc(rect(-75, -50, 75, 50), '#efe6d0', () => {
      cadre(-69, -44, 69, 44, 'rgba(130,90,50,0.6)', 1.2);
      if (adresse) {
        strokePts([[4, -38], [5, 0], [4, 40]], 'rgba(120,110,100,0.7)', 1.1);
        for (const y of [-26, -12, 2, 16, 30]) strokePts([[-62, y], [-46, y - 2], [-30, y + 1], [-14, y - 1], [-6, y]], 'rgba(120,115,110,0.6)', 1.1);
        for (const y of [2, 16, 30]) strokePts([[14, y], [30, y - 2], [46, y + 1], [62, y - 1]], 'rgba(120,115,110,0.65)', 1.2);
        fillPts(rect(42, -42, 64, -16), '#d79a9a', 0, 0.3);
        for (let k = 0; k <= 5; k++) { dot(42 + k * 4.4, -42, 1, '#efe6d0'); dot(42 + k * 4.4, -16, 1, '#efe6d0'); dot(42, -42 + k * 5.2, 1, '#efe6d0'); dot(64, -42 + k * 5.2, 1, '#efe6d0'); }
      } else drawMaisonCroquis(o);
      shade(60, -40, -70, 40, 0.18, [-80, -55, 80, 55]);
    }, 8101, { texA: 0.45 });
    c.restore();
  }

  // ---------------- voiture de profil (avant vers +x) : origine = sol, entre les roues
  const COUL = { vert: '#3f5d4a', ocre: '#b8863f', bleu: '#44607a', bordeaux: '#6e2b35' };
  const colOf = (v) => COUL[v] || (typeof v === 'string' && v[0] === '#' && v.length === 7 ? v : COUL.vert);
  const VOIT = { mod: { etoile: [262, -170], R: 47, avant: [282, -90], arriere: [-280, -90], roues: [[-175, 54], [175, 54]] },
    anc: { etoile: [266, -245], R: 47, avant: [280, -150], arriere: [-262, -150], roues: [[-150, 78], [170, 72]] } };
  MER.VOIT = VOIT;
  function couronneMini(R) {                                                   // couronne de lauriers autour de l'étoile du capot
    const RR = R * 1.18;
    for (const sd of [-1, 1]) for (let i = 0; i < 8; i++) {
      const a = PI / 2 + sd * (0.4 + i * 0.33), px = Math.cos(a) * RR, py = Math.sin(a) * RR, ta = a + sd * PI / 2;
      const L = R * 0.42, W = R * 0.14, ca = Math.cos(ta), sa = Math.sin(ta), q = (u, v) => [px + ca * u - sa * v, py + sa * u + ca * v];
      const lf = [q(-L * 0.5, 0), q(0, -W), q(L * 0.5, 0), q(0, W)];
      fillPts(lf, i % 2 ? '#5c6e4a' : '#6f8258'); strokePts(lf.concat([lf[0]]), 'rgba(220,180,90,0.95)', 1.2);
    }
  }
  function capot(o, xy, R) {
    const em = o.emblem || 'rien', e = clamp(o.etoile || 0), c = cx_();
    pc(rect(xy[0] - 3, xy[1] + R * 0.12, xy[0] + 3, xy[1] + R * 0.15 + 13), OR.laitonD, null, 8390);
    if (em === 'rien') { pc(ell(xy[0], xy[1] + R * 0.12, 9, 7, 12), OR.laiton, () => dot(xy[0] - 2, xy[1] + R * 0.1, 2, OR.laitonL), 8391); return; }
    const k = 1 + e; c.save(); c.translate(xy[0], xy[1] + R * 0.15); c.scale(k, k); c.translate(0, -R * 0.15);
    if (em === 'lauriers') couronneMini(R);
    drawEtoile({ R, halo: e, t: o.t, branche: o.branche });
    c.restore();
  }
  function roueMod(cx, cy, r, ang) {
    pc(ell(cx, cy, r, r, 24), '#1d1c1e', () => { strokePts(ep(cx, cy, r - 6, r - 6, 24, 0, TAU), 'rgba(255,255,255,0.12)', 1.4); }, 8310 + cx);
    pc(ell(cx, cy, r * 0.62, r * 0.62, 20), '#b6b3ab', () => {
      for (let i = 0; i < 5; i++) { const a = ang + i * TAU / 5, ca = Math.cos(a), sa = Math.sin(a); fillPts([[cx + ca * 8 - sa * 4, cy + sa * 8 + ca * 4], [cx + ca * r * 0.56 - sa * 6, cy + sa * r * 0.56 + ca * 6], [cx + ca * r * 0.56 + sa * 6, cy + sa * r * 0.56 - ca * 6], [cx + ca * 8 + sa * 4, cy + sa * 8 - ca * 4]], '#6f6c66', 0, 0); }
      shade(cx - r, cy - r, cx + r, cy + r, 0.25, [cx - r, cy - r, cx + r, cy + r]);
    }, 8320 + cx);
    M.rivet(cx, cy, 4);
  }
  function roueAnc(cx, cy, r, ang) {
    pc(ringPts(cx, cy, r, r - 8, 28), '#1e1c1c', null, 8330 + cx);
    pc(ringPts(cx, cy, r - 8, r - 15, 28), '#8a6a40', () => hatch(null, 0.4, 3, 0.2, 1, P.encre, [cx - r, cy - r, cx + r, cy + r]), 8340 + cx);
    for (let i = 0; i < 12; i++) { const a = ang + i * TAU / 12, ca = Math.cos(a), sa = Math.sin(a), r0 = 9, r1 = r - 14; fillPts([[cx + ca * r0 - sa * 2.4, cy + sa * r0 + ca * 2.4], [cx + ca * r1 - sa * 1.8, cy + sa * r1 + ca * 1.8], [cx + ca * r1 + sa * 1.8, cy + sa * r1 - ca * 1.8], [cx + ca * r0 + sa * 2.4, cy + sa * r0 - ca * 2.4]], '#7a5a34', 0, 0); }
    pc(ell(cx, cy, 13, 13, 14), OR.laiton, () => dot(cx - 3, cy - 3, 3, OR.laitonL), 8350 + cx);
  }
  function drawVoitureMod(o, col) {
    const cD = mixc(col, '#16110d', 0.38), cL = mixc(col, '#efe6d4', 0.3), V = VOIT.mod;
    const BODY = [[-272, -66], [-278, -112], [-266, -148], [-210, -160], [-150, -166], [-124, -226], [-96, -250], [8, -252], [44, -238], [92, -182], [180, -172], [248, -162], [272, -144], [280, -104], [276, -62], [256, -44, 1], [-256, -44, 1]];
    pc(BODY, col, () => {
      fillPts([[-290, -96], [290, -96], [290, -30], [-290, -30]], cD);
      for (const [wx] of V.roues) fillPts(ep(wx, -54, 66, 66, 16, PI, TAU).concat([[wx + 66, -30], [wx - 66, -30]]), '#221d1b');
      strokePts([[-262, -146], [-150, -160], [96, -176], [246, -158]], cL, 2.6);
      strokePts([[-274, -100], [278, -100]], 'rgba(230,228,220,0.75)', 2.2);
      for (const w of [[[-118, -222], [-92, -242], [-34, -242], [-34, -174], [-134, -172]], [[-20, -242], [6, -242], [40, -230], [80, -180], [-20, -176]]]) {
        fillPts(w, '#a9b8bd'); strokePts(w.concat([w[0]]), 'rgba(20,20,22,0.7)', 1.6);
      }
      fillPts([[-100, -236], [-80, -236], [-110, -180], [-122, -180]], 'rgba(255,255,255,0.35)'); fillPts([[0, -236], [14, -236], [-4, -184], [-14, -184]], 'rgba(255,255,255,0.3)');
      strokePts([[-27, -172], [-24, -110], [-30, -60]], 'rgba(15,12,10,0.55)', 1.4); strokePts([[86, -176], [92, -60]], 'rgba(15,12,10,0.55)', 1.4);
      for (const hx of [-10, 70]) fillPts(rect(hx, -150, hx + 14, -145), '#c9c6be');
      hatch(null, 0.6, 5, 0.16, 1, P.encre, [-290, -260, 290, -30]);
      shade(0, -260, 0, -40, 0.3, [-300, -270, 300, -20]);
    }, 8301);
    pc([[262, -142, 1], [282, -132, 1], [284, -78, 1], [266, -74, 1]], '#c3c0b8', () => { for (let y = -134; y < -78; y += 7) strokePts([[264, y], [282, y + 1]], 'rgba(40,40,44,0.6)', 1.2); }, 8302);
    pc(ell(250, -124, 13, 11, 14), '#f1e7c4', () => dot(247, -127, 4, '#fffaf0'), 8303);
    pc(rect(-282, -116, -268, -100), '#9c2f2a', null, 8304);
    pc([[256, -66, 1], [290, -68, 1], [290, -52, 1], [252, -48, 1]], '#c3c0b8', null, 8305);
    pc([[-290, -68, 1], [-252, -66, 1], [-256, -48, 1], [-290, -52, 1]], '#c3c0b8', null, 8306);
    const ang = (o.roule || 0) / 54;
    for (const [wx, r] of V.roues) roueMod(wx, -r, r, ang);
    capot(o, V.etoile, V.R);
  }
  function drawVoitureAnc(o, col) {
    const cD = mixc(col, '#16110d', 0.38), cL = mixc(col, '#efe6d4', 0.3), V = VOIT.anc, ang = (o.roule || 0) / 75;
    pc([[-246, -206], [-258, -282], [-238, -332], [-192, -360], [-128, -366], [-100, -356], [-98, -338], [-124, -330], [-150, -296], [-160, -250], [-164, -212]], '#2e2a26', () => {
      for (const k of [0.25, 0.5, 0.75]) strokePts([[lerp(-246, -164, k), lerp(-206, -212, k)], [lerp(-256, -150, k), lerp(-290, -300, k)], [lerp(-236, -124, k), lerp(-336, -334, k)], [lerp(-192, -110, k), lerp(-360, -350, k)]], 'rgba(200,190,170,0.28)', 1.4);
      hatch(null, 0.9, 4, 0.25, 1, P.encre, [-270, -380, -80, -190]);
    }, 8360);
    pc(rect(-250, -112, 262, -96), '#2a221c', null, 8361);
    pc([[-232, -210], [-228, -268], [-204, -284], [-172, -278], [-164, -224]], '#3a2a22', () => { for (const [a, b] of [[-214, -260], [-194, -262], [-204, -240], [-184, -238]]) dot(a, b, 2.2, '#24180f'); hatch(null, 0.3, 4, 0.2, 1, P.encre, [-240, -290, -160, -200]); }, 8362);
    pc([[-62, -196], [-60, -250], [-42, -262], [-22, -256], [-18, -198]], '#3a2a22', () => { dot(-40, -236, 2.2, '#24180f'); dot(-38, -214, 2.2, '#24180f'); }, 8363);
    pc([[-240, -110], [-246, -170], [-236, -214], [-200, -228], [-150, -228], [-130, -200], [-40, -196], [-30, -160], [60, -160], [96, -172], [96, -110, 1]], col, () => {
      strokePts([[-236, -206], [-150, -220], [-128, -196], [-34, -192]], cL, 2.4);
      fillPts([[-250, -130], [100, -130], [100, -100], [-250, -100]], cD);
      strokePts([[-124, -186], [-124, -118]], 'rgba(15,12,10,0.5)', 1.3); strokePts([[-30, -156], [-30, -116]], 'rgba(15,12,10,0.5)', 1.3);
      hatch(null, 0.6, 5, 0.18, 1, P.encre, [-260, -240, 110, -100]);
    }, 8364);
    pc([[96, -110, 1], [96, -196, 1], [106, -206, 1], [252, -206, 1], [256, -196, 1], [256, -110, 1]], col, () => {
      for (let x = 130; x < 240; x += 16) strokePts([[x, -176], [x, -136]], 'rgba(15,12,10,0.55)', 1.6);
      strokePts([[104, -200], [250, -200]], cL, 2); fillPts(rect(96, -130, 256, -110), cD);
      hatch(null, 0.6, 5, 0.18, 1, P.encre, [90, -210, 260, -100]);
    }, 8365);
    pc(rect(254, -228, 278, -100), OR.laiton, () => {
      fillPts(rect(258, -222, 274, -106), '#bdb8aa');
      for (let y = -218; y < -106; y += 6) strokePts([[258, y], [274, y]], 'rgba(60,55,45,0.5)', 0.9);
      for (let x = 261; x < 274; x += 5) strokePts([[x, -222], [x, -106]], 'rgba(60,55,45,0.4)', 0.9);
    }, 8366);
    pc([[78, -168], [86, -168], [36, -262], [28, -258]], '#3a2a1e', null, 8367);
    pc(ell(30, -264, 22, 6, 14), '#2a1e16', () => dot(30, -264, 2, OR.laiton), 8368);
    pc([[-6, -206, 1], [12, -206, 1], [14, -236, 1], [3, -246, 1], [-8, -236, 1]], OR.laiton, () => fillPts(rect(-3, -232, 9, -212), '#f3e2a8'), 8369);
    pc(ell(244, -150, 10, 12, 12), OR.laiton, () => dot(246, -150, 6, '#f3e2a8'), 8370);
    pc(rect(-70, -104, 92, -96), '#2a221c', null, 8371);
    for (const [wx, r] of V.roues) roueAnc(wx, -r, r, ang);
    for (const [wx, r] of V.roues) pc(ribbon(ep(wx, -r, r + 10, r + 10, 14, PI * 1.03, PI * 1.97), 9, 9), cD, () => strokePts(ep(wx, -r, r + 12, r + 12, 14, PI * 1.05, PI * 1.95), cL, 1.4), 8372 + wx);
    capot(o, V.etoile, V.R);
  }
  function drawVoiture(o) { const col = colOf(o.couleur); if (o.ancienne) drawVoitureAnc(o, col); else drawVoitureMod(o, col); }

  // ---------------- maison miniature en volume (la maison de la carte) : origine = sol, ≈ 130 de haut
  function drawMaison(o) {
    pc([[-62, 0, 1], [68, 0, 1], [72, -12, 1], [-56, -12, 1]], '#7a5a3c', () => hatch(null, 0.1, 3, 0.2), 8401);
    pc([[18, -12, 1], [62, -22, 1], [62, -82, 1], [18, -72, 1]], '#cfc2a4', () => {
      for (const wx of [28, 46]) { fillPts([[wx, -40 - (wx - 18) * 0.23], [wx + 9, -42 - (wx - 18) * 0.23], [wx + 9, -56 - (wx - 18) * 0.23], [wx, -54 - (wx - 18) * 0.23]], '#55666e'); }
      hatch(null, 0.9, 3.4, 0.28);
    }, 8402);
    pc([[-50, -12, 1], [18, -12, 1], [18, -72, 1], [-16, -106, 1], [-50, -72, 1]], '#e8dec8', () => {
      fillPts(rect(-24, -44, -8, -12), '#5a3a26'); dot(-11, -28, 1.6, OR.laiton);
      for (const wx of [-44, 0]) { fillPts(rect(wx, -58, wx + 12, -44), '#55666e'); strokePts([[wx + 6, -58], [wx + 6, -44]], '#e8dec8', 1.2); }
      fillPts(ell(-16, -82, 6, 6, 10), '#55666e');
      shade(18, 0, -50, 0, 0.2, [-52, -110, 20, -10]);
    }, 8403);
    pc([[-16, -110, 1], [28, -120, 1], [66, -84, 1], [22, -74, 1]], '#a54a34', () => {
      for (let k = 1; k < 5; k++) strokePts([[lerp(-16, 22, k / 5), lerp(-110, -74, k / 5)], [lerp(28, 66, k / 5), lerp(-120, -84, k / 5)]], 'rgba(60,20,10,0.5)', 1.1);
      hatch(null, -0.4, 3.6, 0.22);
    }, 8404);
    pc([[-54, -70, 1], [-16, -110, 1], [-12, -104, 1], [-50, -66, 1]], '#8f3e2c', null, 8405);
    pc([[30, -104, 1], [42, -107, 1], [42, -132, 1], [30, -129, 1]], '#8f3e2c', () => strokePts([[30, -124], [42, -127]], 'rgba(30,10,5,0.5)', 1), 8406);
    const e = clamp(o.etoile || 0);
    if (e > 0.01) { const c = cx_(), k = backOut(e); c.save(); c.translate(-12, -142); c.scale(k, k); drawEtoile({ R: 16, halo: o.halo == null ? 0.6 : o.halo, t: o.t }); c.restore(); }
  }

  // ---------------- haut-de-forme : origine = milieu du bas du bord
  const TOPHAT = [[-50, -2], [-40, -10], [-33, -12], [-31, -60], [-33, -102, 1], [33, -102, 1], [31, -60], [33, -12], [40, -10], [52, -4], [48, 4], [30, 0], [0, -2], [-30, 0], [-48, 4]];
  const hatPaint = () => {
    fillPts(rect(-33, -28, 33, -12), '#2c2a30'); strokePts([[-33, -28], [33, -28]], 'rgba(120,120,130,0.5)', 1);
    strokePts([[-14, -96], [-16, -36]], 'rgba(200,200,215,0.35)', 3); strokePts([[-6, -96], [-7, -36]], 'rgba(200,200,215,0.18)', 2);
    hatch(null, 1.2, 3.4, 0.25, 1, '200,200,210'); shade(30, 0, -30, 0, 0.3, [-60, -110, 60, 10]);
  };
  function drawHautDeForme() { pc(TOPHAT, '#1b191d', hatPaint, 8501); }

  // ---------------- portrait de Daimler encadré : origine = centre, 200 × 250 ; o.ruban 0..1 = crêpe noir qui s'attache en coin
  function drawPortrait(o) {
    const c = cx_();
    strokePts([[-70, -125], [0, -150], [70, -125]], 'rgba(40,30,20,0.8)', 1.4); dot(0, -150, 3, OR.laitonD);
    pc(rect(-100, -125, 100, 125), '#a8843c', () => {
      fillPts(rect(-90, -115, 90, 115), '#8a6a2c');
      for (const [x, y] of [[-100, -125], [100, -125], [100, 125], [-100, 125]]) fillPts(ell(x * 0.93, y * 0.94, 12, 12, 10), OR.laitonL);
      cadre(-96, -121, 96, 121, 'rgba(255,240,190,0.6)', 1.4);
      hatch(null, 0.8, 3.4, 0.2);
    }, 8601);
    pc(rect(-80, -105, 80, 105), '#3c3b2c', () => {
      const g = c.createRadialGradient(-10, -30, 10, 0, 0, 140); g.addColorStop(0, 'rgba(120,110,80,0.6)'); g.addColorStop(1, 'rgba(20,20,10,0.2)');
      c.fillStyle = g; c.fillRect(-80, -105, 160, 210);
      fillPts([[-70, 105], [-64, 50], [-40, 30], [20, 28], [52, 44], [66, 105]], DA.coat);
      fillPts([[0, 30], [18, 30], [26, 105], [8, 105]], DA.gilet); fillPts([[-6, 28], [10, 28], [8, 40], [-4, 40]], DA.chemise);
      c.save(); c.translate(-2, -4); c.scale(0.95, 0.95);
      fillPts(X.NAP_HEAD, DA.peau); daimlerHeadPaint({}); fillPts(DA_BEARD, DA.barbe); beardPaint({});
      c.restore();
      hatch(null, 0.8, 4, 0.15);
    }, 8602, { drop: false, texA: 0.5 });
    const k = clamp(o.ruban || 0);
    if (k > 0.01) {
      const a = [-98, -58], b = [-40, -123], e = [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
      pc(ribbon([a, [lerp(a[0], e[0], 0.5), lerp(a[1], e[1], 0.5)], e], 20, 20), '#141215', () => hatch(null, 0.8, 2.6, 0.35, 1, '200,200,200'), 8603);
      if (k > 0.95) pc(ell(-69, -90, 13, 13, 12), '#1d1a1e', () => { strokePts(ep(-69, -90, 7, 7, 12, 0, TAU), 'rgba(200,200,200,0.3)', 1); }, 8604);
    }
  }

  // ---------------- tampon encreur : origine = dessous (pied) ; document : origine = centre, 130 × 170
  function drawTampon() {
    pc(rect(-34, -10, 34, 0), NUIT, () => strokePts([[-30, -2], [30, -2]], 'rgba(255,255,255,0.2)', 1), 8701);
    pc([[-38, -34, 1], [38, -34, 1], [36, -10, 1], [-36, -10, 1]], '#7a5232', () => { hatch(null, 0.1, 3, 0.25); strokePts([[-34, -30], [34, -30]], 'rgba(255,220,170,0.35)', 1.4); }, 8702);
    pc([[-10, -34], [10, -34], [8, -48], [7, -66], [-7, -66], [-8, -48]], OR.laiton, () => strokePts([[-4, -36], [-3, -62]], OR.laitonL, 1.4), 8703);
    pc(ell(0, -80, 17, 16, 16), '#5e3c22', () => { dot(-5, -86, 4, 'rgba(255,220,170,0.35)'); hatch(null, 0.7, 3, 0.22); }, 8704);
  }
  function drawDocument(o) {
    const c = cx_(), cu = clamp(o.couche || 0);
    c.save(); c.scale(1, lerp(1, 0.28, cu));
    pc(rect(-65, -85, 65, 85), '#ede5d0', () => {
      strokePts([[-40, -66], [40, -66]], 'rgba(100,96,90,0.75)', 3);
      for (let i = 0; i < 6; i++) { const y = -48 + i * 12, w = 50 - (i % 3) * 8; strokePts([[-50, y], [-20, y - 1], [10, y + 1], [w, y]], 'rgba(120,116,110,0.6)', 1.1); }
      shade(60, -80, -60, 80, 0.12, [-70, -90, 70, 90]);
      const e = clamp(o.etoile || 0);
      if (e > 0.01) { const k = 1 + 0.25 * (1 - e); c.save(); c.translate(0, 48); c.scale(k, k); drawEtoile({ R: 30, encre: e }); c.restore(); }
    }, 8705, { texA: 0.45 });
    c.restore();
  }

  // ---------------- usine miniature (3 cheminées, étoile au faîte) : origine = sol, 200 × 210
  function drawUsine(o) {
    const t = o.t || 0, fu = o.fumee == null ? 1 : clamp(o.fumee);
    const CHEM = [[-78, -196], [-48, -176], [-18, -204]];
    if (fu > 0) for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) {
      const u = (t * 0.45 + i / 4 + j * 0.13) % 1, x = CHEM[j][0] + 2 + u * 34, y = CHEM[j][1] - 8 - u * 70, r = 7 + u * 13;
      fillPts(ell(x, y, r, r * 0.85, 12), `rgba(140,136,130,${0.7 * (1 - u) * fu})`, 0, 0);
    }
    for (const [x, top] of CHEM) pc(rect(x - 8, top, x + 8, -60), '#8f4a36', () => { for (let y = top + 8; y < -60; y += 14) strokePts([[x - 8, y], [x + 8, y]], 'rgba(40,15,8,0.45)', 1); fillPts(rect(x - 10, top, x + 10, top + 7), '#5e3022'); }, 8801 + x);
    const saw = [[-100, 0, 1], [24, 0, 1], [24, -64, 1]];
    for (let k = 0; k < 4; k++) { const x1 = 24 - k * 31; saw.push([x1, -88, 1], [x1 - 31, -64, 1]); }
    pc(saw, '#b98a5a', () => {
      for (let k = 0; k < 4; k++) fillPts([[24 - k * 31 - 3, -84], [24 - k * 31 - 3, -66], [24 - k * 31 - 12, -66]], '#55666e');
      for (let x = -90; x < 20; x += 22) fillPts(rect(x, -46, x + 12, -24), '#4b565c');
      hatch(null, 0.9, 3.6, 0.25);
    }, 8810);
    pc([[24, 0, 1], [100, 0, 1], [100, -92, 1], [62, -126, 1], [24, -92, 1]], '#a35e3e', () => {
      fillPts(rect(50, -40, 74, 0), '#3a2a22'); fillPts(ell(62, -96, 9, 9, 10), '#55666e');
      for (const x of [32, 84]) fillPts(rect(x, -70, x + 10, -50), '#4b565c');
      hatch(null, 0.9, 3.6, 0.22); shade(100, 0, 24, 0, 0.2, [20, -130, 104, 4]);
    }, 8811);
    const e = o.etoile == null ? 1 : clamp(o.etoile);
    if (e > 0.01) { const c = cx_(); c.save(); c.translate(62, -146); c.scale(backOut(e), backOut(e)); drawEtoile({ R: 18, halo: 0.4, t }); c.restore(); }
  }

  // ---------------- icônes des branches (médaillons ≈ 130) : origine = centre
  function drawIcone(type, o) {
    const t = o.t || 0, c = cx_();
    pc(ell(0, 0, 65, 65, 30), OR.laiton, () => { strokePts(ep(0, 0, 61, 61, 30, 0, TAU), 'rgba(255,240,190,0.6)', 1.4); hatch(null, 0.8, 3, 0.2); }, 8901);
    const bg = { terre: '#ead9b4', eau: '#dde6e4', airs: '#bfd2dc' }[type] || '#ead9b4';
    pc(ell(0, 0, 55, 55, 30), bg, () => {
      if (type === 'terre') {
        fillPts([[-70, 60], [-70, 22], [-40, 0], [-6, -10], [30, 0], [70, 26], [70, 60]], '#6d7f4e');
        fillPts([[-70, 60], [-70, 40], [-20, 26], [40, 30], [70, 44], [70, 60]], '#56683f');
        hatch([[-70, 60], [-70, 22], [-40, 0], [-6, -10], [30, 0], [70, 26], [70, 60]], 0.5, 4, 0.2);
        c.save(); c.translate(-2, -10); c.rotate(-0.06);
        fillPts([[-26, -4], [-24, -16], [-10, -18], [-4, -28], [12, -28], [18, -18], [28, -14], [30, -4]], '#b8863f'); strokePts([[-26, -4], [-24, -16], [-10, -18], [-4, -28], [12, -28], [18, -18], [28, -14], [30, -4], [-26, -4]], INK, 1.3);
        fillPts([[-2, -25], [10, -25], [14, -18], [-2, -18]], '#a9b8bd');
        for (const wx of [-14, 18]) { fillPts(ell(wx, -3, 7, 7, 10), '#1d1c1e'); dot(wx, -3, 2.6, '#b6b3ab'); }
        c.restore();
        strokePts([[-40, -30], [-30, -34], [-20, -30]], 'rgba(255,255,255,0.7)', 1.6);
      } else if (type === 'eau') {
        const bob = 2.5 * Math.sin(t * 2.4);
        c.save(); c.translate(0, bob); c.rotate(0.05 * Math.sin(t * 2.4 + 1));
        fillPts([[-2, -2], [-2, -40], [22, -6]], '#efe6d0'); strokePts([[-2, -2], [-2, -42]], '#5a3a26', 1.6);
        fillPts([[-30, -2], [30, -2], [22, 12], [-22, 12]], '#7a5a3c'); strokePts([[-30, -2], [30, -2], [22, 12], [-22, 12], [-30, -2]], INK, 1.2);
        c.restore();
        const cols = ['#5a7a92', '#3f5d78', '#263a5c'];
        for (let k = 0; k < 3; k++) { const y0 = 10 + k * 13, ph = t * (1.4 + k * 0.4) + k; const w = []; for (let x = -70; x <= 70; x += 10) w.push([x, y0 + 4 * Math.sin(x * 0.12 + ph)]); fillPts(w.concat([[70, 70], [-70, 70]]), cols[k]); strokePts(w, 'rgba(255,255,255,0.35)', 1.2); }
      } else {
        for (const [x, y, r] of [[-30, 26, 14], [-14, 30, 12], [24, 34, 13], [38, 28, 10]]) fillPts(ell(x, y, r * 1.4, r, 12), '#efe9da');
        const dx = 4 * Math.sin(t * 0.9);
        c.save(); c.translate(dx, -6);
        fillPts([[-40, -4], [-50, -18], [-42, -16]], '#cfc5ab'); fillPts([[-40, 4], [-50, 16], [-42, 14]], '#cfc5ab');
        fillPts(ell(0, 0, 40, 13, 20), '#ece4cf'); strokePts(ep(0, 0, 40, 13, 20, 0, TAU), INK, 1.3);
        for (const x of [-20, 0, 20]) strokePts([[x, -12], [x, 12]], 'rgba(92,58,32,0.35)', 0.9);
        fillPts(rect(-6, 13, 8, 19), '#7a5a3c');
        c.restore();
        fillPts(ell(30, -34, 12, 7, 10), '#efe9da');
      }
    }, 8902, { texA: 0.4 });
  }

  // ---------------- moteur (bloc de cylindres, pistons, volant) : origine = sol, ≈ 260 × 200 ; o.marche 0..1, o.tour (rad, prioritaire), o.t
  function drawMoteur(o) {
    const t = o.t || 0, ma = o.marche == null ? 1 : clamp(o.marche), a = o.tour != null ? o.tour : t * 11 * ma;
    for (let i = 0; i < 3 && ma > 0; i++) { const u = (t * 1.3 + i / 3) % 1; fillPts(ell(-104 - u * 30, -140 - u * 40, 6 + u * 10, 5 + u * 8, 10), `rgba(170,165,160,${0.6 * (1 - u) * ma})`, 0, 0); }
    pc(rect(-108, -146, -90, -132), '#3d4045', null, 8951);
    pc(ell(116, -70, 52, 52, 26), '#3d4045', () => {
      for (let i = 0; i < 6; i++) { const b = a + i * TAU / 6; strokePts([[116 + Math.cos(b) * 10, -70 + Math.sin(b) * 10], [116 + Math.cos(b) * 44, -70 + Math.sin(b) * 44]], '#8a8e94', 3); }
      strokePts(ep(116, -70, 46, 46, 26, 0, TAU), 'rgba(200,200,205,0.35)', 1.6);
    }, 8952);
    M.rivet(116, -70, 5);
    pc([[-96, 0, 1], [96, 0, 1], [100, -54, 1], [-100, -54, 1]], '#4b4f55', () => { hatch(null, 0.3, 4, 0.25); for (const x of [-70, 70]) dot(x, -12, 3, '#9aa0a4'); }, 8953);
    pc(rect(-84, -150, 84, -54), '#686c72', () => {
      for (let y = -140; y < -60; y += 12) strokePts([[-84, y], [84, y]], 'rgba(20,22,26,0.45)', 1.6);
      for (const [cx0, ph] of [[-42, 0], [42, PI]]) {
        const py = -104 + 20 * Math.sin(a + ph);
        fillPts(rect(cx0 - 26, -140, cx0 + 26, -62), '#2a2c30');
        fillPts(rect(cx0 - 22, py - 14, cx0 + 22, py + 14), '#b9bcc0'); strokePts([[cx0 - 22, py - 6], [cx0 + 22, py - 6]], 'rgba(40,40,44,0.6)', 1.2);
        strokePts([[cx0, py + 10], [cx0 + 12 * Math.cos(a + ph), -40]], '#8a8e94', 4);
      }
      shade(84, 0, -84, 0, 0.25, [-90, -160, 90, -50]);
    }, 8954);
    for (const [cx0, ph] of [[-42, 0], [42, PI]]) {
      pc([[cx0 - 34, -150, 1], [cx0 + 34, -150, 1], [cx0 + 30, -170, 1], [cx0 - 30, -170, 1]], '#55595f', null, 8955 + cx0);
      const v = -178 - 8 * Math.max(0, Math.sin(a + ph));
      pc(rect(cx0 - 4, v - 10, cx0 + 4, -170), OR.laiton, null, 8957 + cx0);
    }
  }

  // ---------------- bulle de pensée (nuage de carton) : origine = centre, 360 × 260 ; o.gonfle, o.degonfle, o.contenu, o.contenuO, o.queue [dx,dy]
  const CENTRE = { usine: [0, -105], terre: [0, 0], eau: [0, 0], airs: [0, 0], moteur: [10, -95], maison: [0, -70], etoile: [0, 0], carte: [0, 0], voiture: [0, -130] };
  function cloudPts(rx, ry, n, amp, seed) {
    const o = [];
    for (let i = 0; i < 120; i++) { const a = i / 120 * TAU, b = Math.abs(Math.sin(a * n / 2 + seed)); o.push([Math.cos(a) * (rx - amp + amp * 1.6 * Math.sqrt(b)), Math.sin(a) * (ry - amp + amp * 1.6 * Math.sqrt(b))]); }
    return o;
  }
  const BUL = cloudPts(180, 128, 9, 16, 0.3);
  function drawBulle(o) {
    const c = cx_(), g = o.gonfle == null ? 1 : clamp(o.gonfle), d = clamp(o.degonfle || 0), t = o.t || 0;
    const k = backOut(g) * (1 - easeIn(d)) * (1 + 0.012 * Math.sin(t * 2.2)); if (k < 0.01) return;
    const q = o.queue || [-120, 200];
    for (let i = 0; i < 3; i++) {
      const u = 0.72 + i * 0.16, kk = clamp(g * 3 - i * 0.6) * (1 - d), r = (16 - i * 4.5) * kk;
      if (r > 1) pc(ell(q[0] * u, q[1] * u, r, r * 0.85, 12), '#ece6d6', null, 9101 + i);
    }
    c.save(); c.scale(k, k * (1 - 0.15 * d));
    pc(BUL, '#ece6d6', () => {
      const gr = c.createRadialGradient(-30, -40, 20, 0, 0, 200); gr.addColorStop(0, 'rgba(255,255,250,0.5)'); gr.addColorStop(1, 'rgba(160,170,180,0.25)');
      c.fillStyle = gr; c.fillRect(-200, -150, 400, 300);
      hatch(null, 0.7, 5, 0.1);
    }, 9110, { texA: 0.4 });
    const ct = o.contenu, ob = OBJ[ct];
    if (ob && ct !== 'bulle') {
      const cs = o.contenuS || (ct === 'voiture' ? 0.4 : ct === 'etoile' ? 0.8 : 0.95), ce = CENTRE[ct] || [0, 0];
      c.save(); c.scale(cs, cs); c.translate(-ce[0] - (ob.base[0] || 0), -ce[1] - (ob.base[1] || 0));
      ob.draw(Object.assign({ t }, o.contenuO || {})); c.restore();
    }
    c.restore();
  }

  // ---------------- couronne de lauriers : origine = centre, Ø ≈ 230 ; o.taille
  function drawCouronne(o) {
    const c = cx_(), ta = o.taille || 1;
    c.save(); c.scale(ta, ta);
    pc(ringPts(0, 0, 100, 82, 36), '#4a5a3a', () => hatch(null, 0.5, 3, 0.25), 9201);
    for (const sd of [-1, 1]) for (let i = 0; i < 11; i++) for (const side of [-1, 1]) {
      const a = PI / 2 + sd * (0.32 + i * 0.255), RR = 91 + side * 12, px = Math.cos(a) * RR, py = Math.sin(a) * RR;
      const ta2 = a + sd * PI / 2 - side * sd * 0.5, L = 34, W = 10, ca = Math.cos(ta2), sa = Math.sin(ta2), q = (u, v) => [px + ca * u - sa * v, py + sa * u + ca * v];
      const lf = [q(-L * 0.45, 0), q(-L * 0.1, -W), q(L * 0.55, 0), q(-L * 0.1, W)];
      fillPts(lf, (i + (side > 0 ? 1 : 0)) % 2 ? '#5c6e4a' : '#6b7d57'); strokePts(lf.concat([lf[0]]), 'rgba(200,162,74,0.95)', 1.3); strokePts([q(-L * 0.4, 0), q(L * 0.45, 0)], 'rgba(30,40,20,0.5)', 0.8);
    }
    pc([[-8, 96], [8, 96], [30, 130], [18, 134], [0, 110], [-18, 134], [-30, 130]], '#6e2b2b', () => hatch(null, 0.6, 3, 0.25), 9202);
    pc(ell(0, 98, 11, 9, 12), '#7e3434', null, 9203);
    c.restore();
  }

  // ---------------- planche à croquis (origine = centre, 200 × 150) et chevalet (origine = sol, ≈ 470 de haut)
  function croquisTraits(dessin) {
    if (dessin === 'voiture') return [
      [[-70, 30], [-72, 6], [-50, 0], [-36, -26], [10, -28], [26, -6], [64, -2], [72, 24], [-70, 30]],
      ep(-40, 30, 13, 13, 14, 0, TAU), ep(44, 30, 13, 13, 14, 0, TAU), [[-30, -22], [-28, -2], [16, -4], [6, -24]]];
    if (dessin === 'griffons') return [ep(-40, -10, 26, 20, 18, 0, TAU * 1.6), [[-6, -30], [30, -6], [4, 10], [44, 34]], ep(40, -20, 18, 14, 14, 0, TAU * 1.3), [[-60, 40], [-20, 30], [20, 44], [60, 32]]];
    const g = starGeom(46), tr = (p) => [p[0], p[1] + 4];
    return [g.out.concat([g.out[0]]).map(tr), g.T.map((q) => [[0, 4], tr(q)]).flat().map((p) => [p[0], p[1], 1]), ep(0, 4, 56, 56, 28, 0, TAU).map((p, i) => [p[0] + 1.5 * Math.sin(i), p[1]]), [[-70, -50], [-50, -56]], [[52, 48], [72, 42]]];
  }
  function drawCroquis(o) {
    pc(rect(-100, -75, 100, 75), '#8a6a48', () => hatch(null, 0.2, 3, 0.25), 9301);
    pc(rect(-90, -64, 90, 68), '#efe8d6', () => {
      const tr = croquisTraits(o.dessin || 'etoile'), k = o.trace == null ? 1 : clamp(o.trace), n = tr.length;
      tr.forEach((line, i) => { const f = clamp(k * n - i); if (f <= 0) return; const m = Math.max(2, Math.round(line.length * f)); strokePts(line.slice(0, m), 'rgba(95,95,100,0.85)', 1.6); strokePts(line.slice(0, m).map((p) => [p[0] + 1.5, p[1] - 1]), 'rgba(95,95,100,0.35)', 1); });
    }, 9302, { texA: 0.4 });
    pc([[-22, -82, 1], [22, -82, 1], [26, -62, 1], [-26, -62, 1]], '#9aa0a4', () => dot(0, -72, 3, '#5d6166'), 9303);
  }
  function drawChevalet(o) {
    pc([[-6, -470, 1], [6, -470, 1], [14, 0, 1], [4, 0, 1]], '#6b4a2e', null, 9351);
    for (const sd of [-1, 1]) pc([[sd * 8, -470, 1], [sd * 18, -470, 1], [sd * 86, 0, 1], [sd * 72, 0, 1]].map((p) => sd < 0 ? [p[0], p[1], 1] : p), '#8a6440', () => hatch(null, 1.4, 3.4, 0.22), 9352 + sd);
    pc(rect(-120, -206, 120, -192), '#7a5636', () => strokePts([[-118, -204], [118, -204]], 'rgba(255,220,170,0.35)', 1.2), 9355);
    const c = cx_(); c.save(); c.translate(0, -290); c.scale(1.1, 1.1); drawCroquis(o); c.restore();
  }

  // ---------------- facture (rouleau) : origine = milieu de la barre du haut ; o.deroule 0..1 (longueur 20 → 580)
  function drawFacture(o) {
    const t = o.t || 0, L = 20 + 560 * clamp(o.deroule == null ? 1 : o.deroule), sw = 6 * Math.sin(t * 1.7) * L / 580;
    const side = (sd) => { const o2 = []; for (let i = 0; i <= 10; i++) { const y = 6 + (L - 6) * i / 10; o2.push([sd * 68 + sw * (i / 10) * (i / 10), y]); } return o2; };
    const Lp = side(-1), Rp = side(1).reverse();
    pc(Lp.concat(Rp), '#f1ead8', () => {
      for (let y = 26, i = 0; y < L - 12; y += 16, i++) {
        const dx = sw * Math.pow(y / L, 2), w = 30 + 40 * hash(i * 3.7);
        if (i % 7 === 6) { strokePts([[-58 + dx, y], [58 + dx, y]], 'rgba(110,105,100,0.6)', 1.6); strokePts([[-58 + dx, y + 3], [58 + dx, y + 3]], 'rgba(110,105,100,0.6)', 1.6); continue; }
        strokePts([[-58 + dx, y], [-58 + w + dx, y]], 'rgba(120,116,110,0.6)', 1.2); strokePts([[30 + dx, y], [58 + dx, y]], 'rgba(120,116,110,0.6)', 1.2);
      }
      shade(68, 0, -68, 0, 0.12, [-80, 0, 80, L + 10]);
    }, 9401, { texA: 0.4 });
    pc(rect(-80 + sw, L - 9, 80 + sw, L + 9), '#e6dcc4', () => { strokePts([[-78 + sw, L - 4], [78 + sw, L - 4]], 'rgba(255,255,255,0.6)', 1.2); shade(0, L - 9, 0, L + 9, 0.3, [-90 + sw, L - 12, 90 + sw, L + 12]); }, 9402);
    pc(rect(-80, -8, 80, 8), '#e6dcc4', () => { strokePts([[-78, -3], [78, -3]], 'rgba(255,255,255,0.6)', 1.2); shade(0, -8, 0, 8, 0.3, [-90, -10, 90, 10]); }, 9403);
  }

  // ---------------- sac de pièces : origine = sol ; o.gonfle 0..1 (0,8 → 1,12 de large), o.vide 0..1 (les pièces s'échappent, le sac s'affaisse)
  function piece_or(x, y, r, seed) { pc(ell(x, y, r, r * 0.9, 12), '#c8a24a', () => { strokePts(ep(x, y, r * 0.65, r * 0.6, 12, 0, TAU), 'rgba(110,80,20,0.6)', 1); dot(x - r * 0.3, y - r * 0.3, r * 0.25, 'rgba(255,240,190,0.7)'); }, seed); }
  function drawSac(o) {
    const g = lerp(0.8, 1.12, o.gonfle == null ? 1 : clamp(o.gonfle)), v = clamp(o.vide || 0), h = 1 - 0.38 * v, w = g * (1 + 0.12 * v);
    if (v < 0.6) for (const [x, y] of [[-10, -116], [8, -119], [0, -112]]) piece_or(x, y * h + 2, 9, 9500 + x);
    const body = [[-46 * w, -2], [46 * w, -2], [58 * w, -26 * h], [56 * w, -58 * h], [40 * w, -84 * h], [14, -98 * h], [-14, -98 * h], [-40 * w, -84 * h], [-56 * w, -58 * h], [-58 * w, -26 * h]];
    pc(body, '#b58a4c', () => {
      for (const x of [-30, -6, 20]) strokePts([[x * w, -6], [x * w * 0.7, -50 * h], [x * 0.3, -94 * h]], 'rgba(80,55,25,0.45)', 1.2);
      fillPts(rect(-20 * w, -46 * h, 6 * w, -24 * h), '#a87a40'); cadre(-20 * w, -46 * h, 6 * w, -24 * h, 'rgba(70,45,20,0.6)', 1);
      hatch(null, 0.9, 3.4, 0.25); shade(50, 0, -50, 0, 0.25, [-70, -110, 70, 4]);
    }, 9510);
    pc([[-18, -96 * h], [18, -96 * h], [24, -114 * h], [10, -108 * h], [0, -118 * h], [-10, -108 * h], [-24, -114 * h]], '#c09656', () => hatch(null, 0.9, 3, 0.25), 9511);
    pc(rect(-17, -102 * h, 17, -95 * h), '#5a3a22', null, 9512);
    if (v > 0) for (let i = 0; i < 6; i++) {
      const p = clamp(v * 1.7 - i * 0.12); if (p <= 0 || p >= 1) continue;
      const x = 14 + p * (40 + i * 16), y = -110 * h - 70 * p + 200 * p * p;
      piece_or(x, Math.min(y, -8), 8, 9520 + i);
    }
  }

  // ---------------- piédestal (P6) : origine = sol ; dessus à y −232
  function drawPiedestal() {
    pc(rect(-84, -26, 84, 0), '#c9bea2', () => { hatch(null, 0.2, 3.6, 0.22); strokePts([[-82, -22], [82, -22]], 'rgba(255,255,255,0.4)', 1.2); }, 9601);
    pc([[-56, -26, 1], [56, -26, 1], [50, -206, 1], [-50, -206, 1]], '#e2d9c2', () => {
      for (let x = -40; x <= 40; x += 16) strokePts([[x, -36], [x * 0.92, -198]], 'rgba(120,105,80,0.35)', 2);
      for (const y of [-40, -196]) fillPts(rect(-60, y - 3, 60, y + 3), OR.or);
      shade(56, 0, -56, 0, 0.25, [-60, -210, 60, -20]);
    }, 9602);
    pc(rect(-78, -232, 78, -206), '#d6ccb2', () => { fillPts(rect(-78, -236, 78, -228), OR.or); hatch(null, 0.2, 3.6, 0.2); }, 9603);
  }

  // ---------------- plume d'oie (tenue par Daimler) : origine = prise ; pointe en (10,38)
  function drawPlume() {
    pc([[2, -10], [-12, -40], [-30, -90], [-46, -140], [-38, -152], [-22, -118], [-8, -70], [4, -24]], '#ece6d6', () => { strokePts([[4, -6], [-40, -146]], 'rgba(150,140,120,0.85)', 1.4); for (let k = 0; k < 7; k++) strokePts([[lerp(0, -36, k / 7), lerp(-14, -132, k / 7)], [lerp(-12, -46, k / 7), lerp(-28, -138, k / 7)]], 'rgba(150,140,120,0.45)', 0.9); }, 9701);
    pc([[1, -4], [6, -4], [11, 26], [10, 38, 1], [6, 28]], '#d8cfb8', () => fillPts([[6, 22], [11, 26], [10, 38], [6, 30]], '#1e1a1c'), 9702);
  }

  // ---------------- mallette du publicitaire : origine = sol ; poignée en (0,−96)
  function drawMallette() {
    pc([[-20, -82], [-18, -102], [18, -102], [20, -82], [12, -82], [11, -94], [-11, -94], [-12, -82]], '#3e2818', null, 9801);
    pc(rrect(-64, -84, 64, 0, 8), '#5a3a24', () => {
      strokePts([[-62, -60], [62, -60]], 'rgba(20,10,5,0.55)', 1.4); cadre(-58, -80, 58, -4, 'rgba(230,200,150,0.3)', 1);
      for (const x of [-38, 38]) { fillPts(rect(x - 7, -70, x + 7, -54), OR.or); dot(x, -62, 2, OR.orD); }
      hatch(null, 0.8, 3.4, 0.22); shade(60, 0, -60, 0, 0.25, [-70, -90, 70, 4]);
    }, 9802);
  }

  // registre : grip = point tenu dans le poing ; p2 = seconde prise ; pts = points nommés ; base = origine de l'accessoire seul (repère objet)
  const OBJ = {
    etoile: { draw: drawEtoile, grip: [-43, 25], pts: { centre: [0, 0], haut: [0, -100], bg: [-86.6, 50], bd: [86.6, 50] }, base: [0, 0] },
    carte: { draw: drawCarte, grip: (o) => [60 * (o.taille || 1), 32 * (o.taille || 1)], p2: (o) => [-60 * (o.taille || 1), 32 * (o.taille || 1)], pts: { centre: [0, 0], etoile: (o) => [-10 * (o.taille || 1), -36 * (o.taille || 1)] }, base: [0, 0] },
    voiture: { draw: drawVoiture, grip: [0, -100], pts: { etoile: (o) => (o.ancienne ? VOIT.anc : VOIT.mod).etoile, avant: (o) => (o.ancienne ? VOIT.anc : VOIT.mod).avant, arriere: (o) => (o.ancienne ? VOIT.anc : VOIT.mod).arriere }, base: [0, 0] },
    maison: { draw: drawMaison, grip: [-16, -40], pts: { etoile: [-12, -142], toit: [-16, -106] }, base: [0, 0] },
    hautDeForme: { draw: drawHautDeForme, grip: [0, -60], pts: { dessus: [0, -102] }, base: [0, 0] },
    portrait: { draw: drawPortrait, grip: [0, 125], pts: { coin: [-100, -125], clou: [0, -150] }, base: [0, 0] },
    tampon: { draw: drawTampon, grip: [0, -58], pts: { pied: [0, 0] }, base: [0, 0] },
    document: { draw: drawDocument, grip: [52, 70], pts: { etoile: [0, 48] }, base: [0, 0] },
    bulle: { draw: drawBulle, grip: [0, 120], pts: { centre: [0, 0] }, base: [0, 0] },
    usine: { draw: drawUsine, grip: [0, -40], pts: { etoile: [62, -146] }, base: [0, 0] },
    terre: { draw: (o) => drawIcone('terre', o), grip: [0, 60], pts: {}, base: [0, 0] },
    eau: { draw: (o) => drawIcone('eau', o), grip: [0, 60], pts: {}, base: [0, 0] },
    airs: { draw: (o) => drawIcone('airs', o), grip: [0, 60], pts: {}, base: [0, 0] },
    moteur: { draw: drawMoteur, grip: [0, -100], pts: {}, base: [0, 0] },
    couronne: { draw: drawCouronne, grip: (o) => [0, 100 * (o.taille || 1)], pts: {}, base: [0, 0] },
    croquis: { draw: drawCroquis, grip: [0, 72], pts: { centre: [0, 0] }, base: [0, 0] },
    chevalet: { draw: drawChevalet, grip: [0, -300], pts: { planche: [0, -290] }, base: [0, 0] },
    facture: { draw: drawFacture, grip: [70, 0], p2: () => [-70, 0], pts: { bas: (o) => [0, 20 + 560 * clamp(o.deroule == null ? 1 : o.deroule)] }, base: [0, 0] },
    sac: { draw: drawSac, grip: [0, -100], pts: { bouche: [0, -110] }, base: [0, 0] },
    piedestal: { draw: drawPiedestal, grip: [0, -120], pts: { dessus: [0, -232] }, base: [0, 0] },
    plume: { draw: drawPlume, grip: [0, 0], pts: { pointe: [10, 38] }, base: [0, 0] },
    mallette: { draw: drawMallette, grip: [0, -96], pts: {}, base: [0, 0] },
  };
  MER.OBJ = OBJ;
  const gripOf = (ob, o) => (typeof ob.grip === 'function' ? ob.grip(o) : ob.grip);
  const ptOf = (ob, nom, o) => { const q = ob.pts && ob.pts[nom]; return q ? (typeof q === 'function' ? q(o) : q) : null; };
  function heldOpts(name, o, p) { return Object.assign({ t: p.t || 0 }, o || {}); }
  function heldDraw(name, o, p) {
    const ob = OBJ[name]; if (!ob) return;
    const oo = heldOpts(name, o, p), g = gripOf(ob, oo), c = cx_();
    c.save(); c.translate(-g[0], -g[1]); ob.draw(oo); c.restore();
  }
  const DOIGTS = [[-13, -9], [9, -11], [12, -4], [12, 6], [6, 11], [-6, 11], [-13, 4]];
  const doigtsPaint = () => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(70,40,30,0.5)', 1); hatch(null, 0.9, 3.4, 0.15); };
  function heldParts(skin, seed) {
    return {
      objet: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (has(p.tenu)) heldDraw(p.tenu, p.tenuO, p); } },
      doigts: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 2, pts: (p) => (has(p.tenu) ? DOIGTS : OFFP), paint: doigtsPaint },
      objetB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 3, pts: OFFP, extra: (p) => { if (has(p.tenuB)) heldDraw(p.tenuB, p.tenuBO, p); } },
      doigtsB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 4, pts: (p) => (has(p.tenuB) || p._deux ? DOIGTS : OFFP), paint: doigtsPaint },
    };
  }
  // point nommé de l'objet tenu (écran)
  MER.pt = function (r, nom, arriere) {
    const name = arriere ? r.tenuB : r.tenu, ob = OBJ[name]; if (!ob) return null;
    const oo = (arriere ? r.tenuBO : r.tenuO) || {}, q = ptOf(ob, nom, oo); if (!q) return null;
    const g = gripOf(ob, oo);
    return r.w(arriere ? 'objetB' : 'objet', q[0] - g[0], q[1] - g[1]);
  };

  // =====================================================================
  // POSES — préparation commune (objets tenus, seconde main) et gestes
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
  function gestes(q) {
    const mo = ease(clamp(Math.max(q.montrer || 0, q.presenter || 0))), te = ease(clamp(q.tendre || 0)), br = ease(clamp(q.brandir || 0)), dv = ease(clamp(q.devant || 0));
    if (te > 0) { blend(q, 'armF_up', -1.3, te); blend(q, 'armF_lo', -0.25, te); }
    if (mo > 0) { blend(q, 'armF_up', -1.15, mo); blend(q, 'armF_lo', -0.5, mo); if (mo > 0.4 && !has(q.tenu)) q.handF = 'open'; }
    if (br > 0) { blend(q, 'armF_up', -2.0, br); blend(q, 'armF_lo', -0.85, br); }
    if (dv > 0) armTo(q, 'armF', [100, -112], 'bas', dv);
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
    return r;
  }

  // ---------------- pièces de corps communes
  function foreDef(parent, base, skin, back, seed, cuffCol, lace) {
    const hk = (p) => (back ? p.handB : p.handF) || 'fist';
    return { parent, at: [0, LA], pts: (p) => foreR(hk(p)), base, seed, paint: (p) => {
      const k = hk(p);
      fillPts([[-20, 76, 1], [20, 76, 1], [24, 130, 1], [-20, 130, 1]], skin); X.handPaint(null, k);
      if (cuffCol) fillPts([[-14, 62, 1], [14, 62, 1], [15, 78, 1], [-14, 78, 1]], cuffCol);
      if (lace) for (let x = -12; x <= 12; x += 5) dot(x, 78, 2.2, cuffCol || '#ece4d0');
      hatch([[-14, -10], [-3, -10], [-3, 60], [-14, 60]], 0.9, 3.8, 0.22);
    } };
  }
  const upDef = (at, base, seed, paint) => ({ parent: 'torso', at, pts: armR(LA), base, seed, paint: paint || (() => hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.28)) });
  function legDef(at, base, shoe, seed, back, extraPaint) {
    return { parent: 'torso', at, pts: X.legPts(0.95), base, seed, noRivet: !!back, paint: () => {
      if (extraPaint) extraPaint();
      fillPts([[-40, 214, 1], [60, 214, 1], [60, 260, 1], [-40, 260, 1]], shoe);
      if (!back) { strokePts([[20, 224], [42, 229]], 'rgba(255,255,255,0.25)', 1.3); hatch([[-26, -20], [-6, -20], [-6, 214], [-26, 214]], 0.8, 4, 0.25); }
      else hatch(null, 0.8, 3.6, 0.3);
    } };
  }
  const ORDER = (heads, after) => ['armB_up', 'armB_lo', 'objetB', 'legB', 'legF', 'head'].concat(heads, ['torso'], after || [], ['armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsB']);
  const ringFace = (cx, cy, r) => ell(cx, cy, r, r, 14);

  // =====================================================================
  // GOTTLIEB DAIMLER (années 1870) — crâne dégarni, grande barbe brune, redingote brun noyer, gilet ocre, chaîne de montre
  // =====================================================================
  const DA = { peau: '#dcb48e', peauD: '#bf9672', coat: '#4a3426', coatD: '#38261b', gilet: '#b08a3c', giletD: '#8c6c2c', pant: '#5f6670', pantD: '#4e545d', chaus: '#1f1a18', barbe: '#5a3a22', barbeD: '#3c2615', chemise: '#ece6d6' };
  const DA_TORSO = [[-14, -176], [8, -180], [18, -168], [30, -150], [40, -116], [46, -74], [46, -34], [40, -2], [38, 40], [42, 96], [46, 124, 1], [-48, 126, 1], [-46, 70], [-44, 10], [-44, -60], [-42, -112], [-36, -150], [-26, -168]];
  const DA_BEARD = [[-2, -62], [6, -58], [10, -46], [16, -40], [24, -37], [32, -35], [37, -31], [34, -25], [31, -22], [35, -16], [39, -4], [39, 12], [33, 30], [22, 44], [8, 50], [-6, 44], [-16, 30], [-20, 12], [-18, -6], [-10, -22], [-4, -36], [-2, -50]];
  function daimlerHeadPaint(f) {
    fillPts([[-22, -82], [-12, -72], [-10, -58], [-14, -42], [-22, -30], [-34, -40], [-36, -62], [-30, -78]], DA.barbe, 3);
    strokePts([[-4, -93], [12, -90], [22, -84]], 'rgba(255,240,220,0.6)', 2.2);
    X.earPaint(-8, -46);
    dot(18, -40, 8, 'rgba(205,120,100,0.25)');
    X.eye(f, 17, -52); X.brow(f, 17, -61, DA.barbeD, 3.6);
  }
  function beardPaint(f) {
    for (let i = 0; i < 9; i++) { const x = -12 + i * 5.5; strokePts([[x, -30 + Math.abs(i - 4) * 3], [x + 2, 0], [x - 1, 28 - Math.abs(i - 4) * 3]], 'rgba(30,18,8,0.4)', 1.1); }
    fillPts([[16, -38], [30, -36], [38, -30], [33, -26], [24, -27], [14, -31]], DA.barbeD);
    const m = (f && f.mouth) || 'n';
    if (m === 'o') fillPts(ell(30, -21, 3.2, 3.6, 8), '#2a1410'); else if (m === 'smile') strokePts([[34, -24], [29, -21], [24, -23]], 'rgba(120,50,40,0.9)', 1.6); else strokePts([[34, -23], [26, -22]], 'rgba(120,50,40,0.85)', 1.5);
    strokePts([[0, -50], [4, -20], [10, 20]], 'rgba(150,110,70,0.35)', 1.4);
    hatch(null, 1.2, 3.2, 0.18);
  }
  function mkDaimler() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: DA_TORSO, base: DA.coat, seed: 7001, paint: () => {
        fillPts([[14, -166], [26, -152], [36, -120], [42, -80], [42, -40], [37, -8], [14, -6], [18, -60], [12, -120]], DA.gilet);
        for (const y of [-112, -84, -56, -28]) dot(33 + (y + 112) * 0.06, y, 2.3, '#6a4f1e');
        strokePts([[33, -64], [26, -52], [32, -42], [40, -40]], '#e2bf62', 2.2); dot(40, -40, 3, '#e2bf62');
        fillPts([[4, -184], [18, -170], [14, -156], [2, -168]], DA.chemise); fillPts([[10, -172], [22, -164], [17, -150], [8, -160]], '#1e1a1c');
        fillPts([[6, -176], [22, -158], [20, -128], [12, -96], [4, -132]], DA.coatD);
        strokePts([[-44, -4], [40, -2]], 'rgba(20,10,5,0.5)', 1.4); strokePts([[14, -4], [24, 120]], 'rgba(20,10,5,0.45)', 1.3);
        for (const y of [10, 50]) dot(18, y, 2.2, '#2a1c12');
        hatch([[-54, -170], [-14, -170], [-12, 130], [-54, 130]], 0.75, 4.2, 0.3);
        shade(42, 0, -44, 0, 0.3);
      } },
      legB: legDef([-6, -2], DA.pantD, DA.chaus, 7002, true),
      legF: legDef([6, -2], DA.pant, DA.chaus, 7003, false),
      armB_up: upDef([-10, -146], DA.coatD, 7004),
      armB_lo: foreDef('armB_up', DA.coatD, DA.peauD, true, 7005, '#cfc8b6'),
      head: { parent: 'torso', at: [6, -170], pts: X.NAP_HEAD, base: DA.peau, seed: 7006, noRivet: true, paint: (p) => {
        daimlerHeadPaint(p.face || {}); hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.28);
      } },
      barbe: { parent: 'head', at: [0, 0], pts: DA_BEARD, base: DA.barbe, seed: 7007, noRivet: true, paint: (p) => beardPaint(p.face || {}) },
      chapeau: { parent: 'head', at: [-6, -88], rest: -0.06, pts: (p) => (p.chapeau ? TOPHAT : OFFP), base: '#1b191d', seed: 7008, noRivet: true, paint: hatPaint },
      armF_up: upDef([-2, -146], DA.coat, 7009),
      armF_lo: foreDef('armF_up', DA.coat, DA.peau, false, 7010, DA.chemise),
    };
    Object.assign(parts, heldParts(DA.peau, 7020));
    return { hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, order: ORDER([], ['barbe', 'chapeau']) };
  }
  CH.merDaimler = mkDaimler();
  MER.daimlerPose = function (p) {
    const q = prep(p), A = q.ang, t = q.t || 0;
    if (q.tenu == null) q.tenu = 'plume';
    const ec = ease(clamp(q.ecrire || 0)), rf = ease(clamp(q.reflechir || 0));
    gestes(q);
    if (ec > 0) { const T = q.cible || [86, -146]; armTo(q, 'armF', [T[0] + 5 * Math.sin(t * 9), T[1] + 3 * Math.sin(t * 13)], 'bas', ec); A.head = (A.head || 0) + 0.2 * ec; }
    if (rf > 0) { armTo(q, 'armF', headPt(q, 22, 34), 'bas', rf); A.head = (A.head || 0) - 0.14 * rf; }
    return finish(q);
  };
  MER.daimler = (pose, x, y, s, o) => run(CH.merDaimler, MER.daimlerPose(pose), x, y, s == null ? 0.9 : s, o);

  // =====================================================================
  // EMMA DAIMLER — robe vert éteint à tournure, col et tablier ivoire, chignon haut au ruban bordeaux, petit sac à main
  // =====================================================================
  const EM = { peau: '#e8c9a8', peauD: '#cba585', robe: '#4f6b4a', robeD: '#3f573b', robeL: '#62805c', ivoire: '#ebe3cf', ivoireD: '#d3c8ae', cheveux: '#3b2a1f', ruban: '#6e2b2b', chaus: '#2c2220', bas: '#e3d6c0', sac: '#5a3a2a' };
  const EM_TORSO = [[-12, -176], [6, -180], [14, -168], [22, -150], [28, -120], [25, -90], [20, -66], [28, -20], [36, 40], [44, 110], [52, 180], [58, 226, 1], [-88, 226, 1], [-80, 176], [-80, 100], [-86, 30], [-92, -14], [-84, -40], [-60, -58], [-34, -64], [-26, -90], [-30, -122], [-30, -150], [-22, -168]];
  const EM_HEAD = [[-12, 16], [8, 16], [9, 2], [14, -6], [20, -10], [23, -15], [22, -19], [24, -22], [23, -25], [25, -29], [30, -34, 1], [27, -41], [24, -51], [25, -60], [21, -72], [10, -82], [-6, -86], [-22, -82], [-30, -66], [-30, -44], [-24, -28], [-16, -10]];
  const EM_HAIR = [[26, -66], [20, -78], [8, -88], [-8, -92], [-24, -86], [-34, -70], [-35, -52], [-30, -36], [-22, -30], [-18, -42], [-14, -58], [-4, -68], [12, -72]];
  const EM_LEG = [[-10, 150], [8, 150], [9, 232], [-11, 232]];
  const EM_SHOE = [[-6, -12], [10, -12], [22, -6], [32, 2, 1], [30, 6, 1], [-8, 6, 1], [-10, -4]];
  // petit sac à main pendu au poignet (reste vertical) ; pose.sacMain 'avant' (défaut, main avant libre) | 'arriere' | false
  function sacDef(parent, seed, vis) {
    return { parent, at: [2, 80], noRivet: true, seed, base: EM.sac, pts: (p) => (vis(p) ? [[-15, 40], [15, 40], [19, 66], [13, 78, 1], [-13, 78, 1], [-19, 66]] : OFFP),
      paint: () => { fillPts(rect(-8, 40, 8, 46), OR.laiton); hatch(null, 0.8, 3, 0.25); shade(18, 0, -18, 0, 0.25, [-20, 36, 20, 80]); },
      extra: (p) => { if (vis(p)) strokePts([[-9, 42], [-3, 6], [3, 6], [9, 42]], '#3a241a', 1.8); } };
  }
  function mkEmma() {
    const shoe = (back) => ({ base: back ? '#241c1a' : EM.chaus, pts: EM_SHOE, noRivet: true, paint: () => { strokePts([[8, -6], [26, 0]], 'rgba(255,255,255,0.22)', 1.2); fillPts(rect(-10, 0, -2, 6), '#1a1210'); } });
    const parts = {
      torso: { parent: null, at: [0, 0], pts: EM_TORSO, base: EM.robe, seed: 7101, paint: () => {
        fillPts([[-2, -64], [20, -66], [28, -20], [36, 40], [44, 110], [50, 180], [54, 214], [12, 218], [4, 140], [0, 40]], EM.ivoire);
        for (let y = -50; y < 214; y += 9) dot(lerp(1, 12, (y + 50) / 264), y, 1.8, EM.ivoireD);
        strokePts([[20, -66], [28, -20], [36, 40], [44, 110], [50, 180], [54, 214]], 'rgba(120,105,80,0.5)', 1.2);
        fillPts([[4, -128], [24, -124], [22, -70], [8, -70]], EM.ivoire); strokePts([[4, -128], [8, -70]], 'rgba(120,105,80,0.45)', 1);
        fillPts([[-36, -72, 1], [22, -72, 1], [22, -62, 1], [-36, -62, 1]], EM.robeD);
        fillPts([[0, -186], [14, -176], [12, -162], [0, -168]], EM.ivoire); for (const y of [-182, -174, -166]) dot(12, y, 1.6, EM.ivoireD);
        for (const y of [-150, -134, -118, -102, -86]) dot(20 + (y + 150) * 0.03, y, 1.8, EM.ivoireD);
        fillPts([[-34, -64], [-60, -58], [-84, -40], [-92, -14], [-88, 24], [-62, 36], [-36, 10], [-22, -30]], EM.robeL);
        for (const k of [0.25, 0.5, 0.75]) strokePts([[lerp(-34, -22, k), lerp(-64, -30, k)], [lerp(-72, -44, k), lerp(-48, -4, k)], [lerp(-90, -64, k), lerp(-10, 32, k)]], 'rgba(30,45,28,0.55)', 1.4);
        for (const x of [-76, -64, -52]) strokePts([[x - 2, 40], [x - 4, 130], [x - 8, 222]], 'rgba(30,45,28,0.4)', 1.3);
        fillPts([[-88, 206, 1], [58, 206, 1], [58, 226, 1], [-88, 226, 1]], EM.robeD);
        fillPts([[-40, -66], [-56, -80], [-60, -62], [-44, -60], [-58, -46], [-50, -40]], EM.robeD);
        for (const x of [-48, -34, -20, -6]) strokePts([[x, 120], [x - 4, 222]], 'rgba(20,30,20,0.35)', 1.2);
        fillPts([[-62, 206, 1], [58, 206, 1], [58, 226, 1], [-62, 226, 1]], EM.robeD);
        hatch([[-90, -170], [-14, -170], [-20, 228], [-90, 228]], 0.75, 4.4, 0.26, 1.05, '220,225,235');
        shade(40, 0, -60, 0, 0.26);
      } },
      legB: { parent: 'torso', at: [-6, -2], pts: EM_LEG, base: '#cbbfa8', seed: 7102, noRivet: true },
      piedB: Object.assign({ parent: 'legB', at: [-4, 234], seed: 7103 }, shoe(true)),
      legF: { parent: 'torso', at: [6, -2], pts: EM_LEG, base: EM.bas, seed: 7104, noRivet: true },
      piedF: Object.assign({ parent: 'legF', at: [-4, 234], seed: 7105 }, shoe(false)),
      armB_up: upDef([-10, -146], EM.robeD, 7106),
      armB_lo: foreDef('armB_up', EM.robeD, EM.peauD, true, 7107, EM.ivoireD, true),
      sacmain: sacDef('armB_lo', 7108, (p) => p.sacMain === 'arriere'),
      sacF: sacDef('armF_lo', 7115, (p) => (p.sacMain == null || p.sacMain === 'avant') && !has(p.tenu)),
      head: { parent: 'torso', at: [6, -170], pts: EM_HEAD, base: EM.peau, seed: 7109, noRivet: true, paint: (p) => {
        const f = p.face || {};
        X.earPaint(-6, -46); dot(-4, -36, 2.4, '#efe8da');
        hatch([[-22, -40], [0, -28], [8, -8], [-8, 18], [-30, 4]], 0.6, 3.8, 0.2);
        dot(13, -30, 8, 'rgba(215,120,110,0.28)');
        X.eye(f, 15, -47, 0.95); strokePts([[9, -50], [7, -53]], 'rgba(28,16,14,0.9)', 1.2);
        X.brow(f, 15, -55, 'rgba(60,40,28,0.9)', 1.7);
        X.mouth(f, 23, -20, 'rgba(140,45,45,0.9)');
      } },
      cheveux: { parent: 'head', at: [0, 0], pts: EM_HAIR, base: EM.cheveux, seed: 7110, noRivet: true, paint: () => {
        for (let k = 0; k < 6; k++) strokePts([[20 - k * 3, -72 + k * 2], [-6 - k * 3, -86 + k * 6], [-26 + k, -66 + k * 6]], 'rgba(200,170,140,0.18)', 1.1);
        hatch(null, 0.5, 3.4, 0.2);
      } },
      chignon: { parent: 'head', at: [-14, -100], pts: ell(0, 0, 20, 17, 16), base: EM.cheveux, seed: 7111, noRivet: true, paint: () => { strokePts(ep(0, 0, 12, 10, 14, -0.5, 4.4), 'rgba(200,170,140,0.25)', 1.3); hatch(null, 0.5, 3, 0.25); } },
      ruban: { parent: 'head', at: [-2, -90], seed: 7112, noRivet: true, base: EM.ruban,
        pts: [[0, 0], [-4, -12], [-14, -18], [-12, -4], [-2, 2], [6, 14], [2, 18], [-4, 6], [-10, 16], [-14, 12], [-4, 2], [10, -6], [14, -16], [6, -12]],
        paint: () => { dot(-1, 1, 3, '#5a2020'); hatch(null, 0.6, 2.6, 0.2); } },
      armF_up: upDef([-2, -146], EM.robe, 7113),
      armF_lo: foreDef('armF_up', EM.robe, EM.peau, false, 7114, EM.ivoire, true),
    };
    Object.assign(parts, heldParts(EM.peau, 7120));
    return { hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-20, 30] },
      order: ['armB_up', 'armB_lo', 'objetB', 'sacmain', 'legB', 'piedB', 'legF', 'piedF', 'head', 'cheveux', 'chignon', 'ruban', 'torso', 'armF_up', 'armF_lo', 'sacF', 'objet', 'doigts', 'doigtsB'] };
  }
  CH.merEmma = mkEmma();
  MER.emmaPose = function (p) {
    const q = prep(p), A = q.ang, t = q.t || 0;
    const jo = ease(clamp(q.joindre || 0)), tp = clamp(q.tapePied || 0), ho = clamp(q.hocher || 0);
    gestes(q);
    if (jo > 0) { armTo(q, 'armF', [44, -60], 'bas', jo); armTo(q, 'armB', [36, -56], 'bas', jo); if (jo > 0.5 && !has(q.tenu) && !q.handF) q.handF = 'open'; }
    if (tp > 0) A.piedF = (A.piedF || 0) - 0.42 * tp * Math.max(0, Math.sin(t * TAU * 2.2));
    if (ho > 0) A.head = (A.head || 0) + 0.26 * ho;
    finish(q);
    A.sacmain = (A.sacmain || 0) - ((A.armB_up || 0) + (A.armB_lo || 0) + (q.tilt || 0));
    A.sacF = (A.sacF || 0) - ((A.armF_up || 0) + (A.armF_lo || 0) + (q.tilt || 0));
    return q;
  };
  MER.emma = (pose, x, y, s, o) => run(CH.merEmma, MER.emmaPose(pose), x, y, s == null ? 0.88 : s, o);

  // =====================================================================
  // PAUL DAIMLER (1909) — canotier ocre à ruban bleu nuit, moustache en guidon, costume bleu nuit, nœud papillon
  // =====================================================================
  const PA = { peau: '#e0b896', peauD: '#c39a78', costume: '#263a5c', costumeD: '#1c2c48', chemise: '#ece6d6', noeud: '#1c1a20', can: '#c9a45a', canD: '#a8853f', ruban: '#1f2f4d', cheveux: '#4a3020', chaus: '#3a2418' };
  const PA_TORSO = [[-14, -176], [8, -180], [16, -168], [28, -150], [36, -112], [38, -60], [36, -10], [36, 30], [32, 46, 1], [-38, 48, 1], [-40, 0], [-40, -60], [-38, -112], [-34, -150], [-26, -168]];
  const CANOTIER = [[-50, 2, 1], [-31, 2, 1], [-31, -26, 1], [33, -26, 1], [33, 2, 1], [54, 2, 1], [54, 9, 1], [-50, 9, 1]];
  function mkPaul() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: PA_TORSO, base: PA.costume, seed: 7201, paint: () => {
        fillPts([[6, -180], [20, -166], [24, -130], [14, -112], [8, -150]], PA.chemise);
        fillPts([[12, -170], [22, -176], [20, -164], [24, -156], [12, -162]], PA.noeud);
        fillPts([[8, -178], [26, -150], [26, -112], [18, -96], [10, -140]], PA.costumeD);
        for (const y of [-80, -50, -20]) dot(30, y, 2.3, '#8d8676');
        fillPts([[-8, -126, 1], [14, -126, 1], [14, -120, 1], [-8, -120, 1]], PA.costumeD); fillPts([[-2, -132], [6, -134], [8, -126], [-2, -126]], '#ece6d6');
        strokePts([[-38, 44], [32, 44]], 'rgba(10,10,20,0.6)', 1.4);
        hatch([[-50, -170], [-12, -170], [-10, 50], [-50, 50]], 0.75, 4.2, 0.32, 1.05, '200,210,230');
        shade(38, 0, -40, 0, 0.3);
      } },
      legB: legDef([-6, -2], PA.costumeD, PA.chaus, 7202, true),
      legF: legDef([6, -2], PA.costume, PA.chaus, 7203, false, () => hatch([[-20, -10], [-8, -10], [-8, 214], [-20, 214]], 0.8, 4, 0.25, 1.05, '200,210,230')),
      armB_up: upDef([-10, -146], PA.costumeD, 7204),
      armB_lo: foreDef('armB_up', PA.costumeD, PA.peauD, true, 7205, '#cfc8b6'),
      head: { parent: 'torso', at: [6, -170], pts: X.NAP_HEAD, base: PA.peau, seed: 7206, noRivet: true, paint: (p) => {
        const f = p.face || {};
        fillPts([[-6, -82], [-26, -80], [-34, -62], [-32, -44], [-24, -32], [-18, -46], [-14, -64]], PA.cheveux, 3);
        X.earPaint(-8, -46); hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.28);
        dot(16, -36, 8, 'rgba(205,120,100,0.25)');
        X.eye(f, 17, -52); X.brow(f, 17, -61, 'rgba(60,38,22,0.95)', 2.6); X.mouth(f, 27, -23);
        fillPts([[16, -34], [26, -36], [36, -34], [44, -38], [48, -45], [45, -47], [42, -41], [34, -30], [24, -30], [16, -31]], PA.cheveux, 6, 0.3);
      } },
      canotier: { parent: 'head', at: [-2, -90], rest: -0.05, pts: CANOTIER, base: PA.can, seed: 7207, noRivet: true, paint: () => {
        fillPts(rect(-31, -11, 33, 1), PA.ruban);
        for (let x = -28; x < 32; x += 5) strokePts([[x, -25], [x + 2, -12]], 'rgba(120,90,30,0.4)', 0.9);
        for (let x = -48; x < 54; x += 6) strokePts([[x, 3], [x + 3, 8]], 'rgba(120,90,30,0.45)', 0.9);
        strokePts([[-30, -25], [32, -25]], 'rgba(255,240,200,0.5)', 1.4);
      } },
      armF_up: upDef([-2, -146], PA.costume, 7208),
      armF_lo: foreDef('armF_up', PA.costume, PA.peau, false, 7209, PA.chemise),
    };
    Object.assign(parts, heldParts(PA.peau, 7220));
    return { hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, order: ORDER([], ['canotier']) };
  }
  CH.merPaul = mkPaul();
  MER.paulPose = function (p) {
    const q = prep(p), A = q.ang, fi = ease(clamp(q.fier || 0));
    if (fi > 0) { plier(q, -0.07 * fi); A.head = (A.head || 0) - 0.16 * fi; A.armB_up = (A.armB_up || 0) + 0.3 * fi; q.dy = (q.dy || 0) - 3 * fi; }
    gestes(q);
    return finish(q);
  };
  MER.paul = (pose, x, y, s, o) => run(CH.merPaul, MER.paulPose(pose), x, y, s == null ? 0.9 : s, o);

  // =====================================================================
  // ADOLF DAIMLER (1909) — melon gris, imberbe, lunettes rondes, gilet bordeaux, costume gris-brun
  // =====================================================================
  const AD = { peau: '#e4c09e', peauD: '#c7a080', costume: '#5a5148', costumeD: '#483f37', gilet: '#7a2e35', chemise: '#ece6d6', melon: '#6b6f73', melonD: '#4f5357', cheveux: '#2e2622', monture: '#2a2420', chaus: '#1e1a18', cravate: '#2a2a30' };
  const AD_TORSO = [[-14, -176], [8, -180], [14, -168], [24, -150], [30, -112], [32, -60], [30, -10], [32, 40], [34, 64, 1], [-34, 66, 1], [-36, 10], [-35, -60], [-34, -112], [-30, -150], [-24, -168]];
  const MELON = [[-46, 6], [-38, 0], [-33, -6], [-34, -22], [-28, -36], [-12, -44], [10, -44], [26, -36], [32, -22], [32, -6], [38, 0], [48, 5], [42, 11], [0, 9], [-40, 11]];
  function mkAdolf() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: AD_TORSO, base: AD.costume, seed: 7301, paint: () => {
        fillPts([[10, -168], [20, -152], [26, -112], [28, -60], [26, -16], [12, -14], [14, -80], [8, -140]], AD.gilet);
        for (const y of [-120, -96, -72, -48, -24]) dot(22, y, 1.9, '#d8c7a0');
        fillPts([[4, -184], [16, -172], [14, -160], [4, -166]], AD.chemise); fillPts([[10, -168], [16, -164], [20, -126], [14, -118], [10, -126]], AD.cravate);
        fillPts([[6, -176], [18, -160], [16, -120], [10, -100], [4, -140]], AD.costumeD);
        strokePts([[10, -12], [14, 62]], 'rgba(20,15,10,0.5)', 1.3); dot(18, -4, 2.2, '#2a2420');
        hatch([[-46, -170], [-12, -170], [-10, 68], [-46, 68]], 0.75, 4.2, 0.3);
        shade(34, 0, -36, 0, 0.28);
      } },
      legB: legDef([-6, -2], AD.costumeD, AD.chaus, 7302, true),
      legF: legDef([6, -2], AD.costume, AD.chaus, 7303, false),
      armB_up: upDef([-10, -146], AD.costumeD, 7304),
      armB_lo: foreDef('armB_up', AD.costumeD, AD.peauD, true, 7305, '#cfc8b6'),
      head: { parent: 'torso', at: [6, -170], pts: X.NAP_HEAD, base: AD.peau, seed: 7306, noRivet: true, paint: (p) => {
        const f = p.face || {};
        fillPts([[-4, -84], [-24, -80], [-33, -62], [-31, -44], [-24, -34], [-18, -48], [-14, -66]], AD.cheveux, 3);
        X.earPaint(-8, -46); hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.26);
        dot(15, -34, 8, 'rgba(205,130,110,0.2)');
        X.eye(f, 17, -52); X.brow(f, 17, -61, 'rgba(45,30,22,0.95)', 2.2); X.mouth(f, 27, -27);
        const ring = ringFace(19, -52, 10);
        fillPts(ring, 'rgba(190,225,240,0.25)', 0, 0); strokePts(ring.concat([ring[0]]), AD.monture, 1.9);
        strokePts([[9, -53], [-28, -56]], AD.monture, 1.4); strokePts([[14, -58], [20, -60]], 'rgba(255,255,255,0.7)', 1.2);
      } },
      melon: { parent: 'head', at: [-2, -86], rest: 0.04, pts: MELON, base: AD.melon, seed: 7307, noRivet: true, paint: () => {
        fillPts([[-34, -10], [32, -10], [32, -2], [-34, -2]], AD.melonD);
        strokePts([[-20, -36], [-2, -42], [14, -40]], 'rgba(255,255,255,0.35)', 2);
        hatch(null, 0.6, 3.6, 0.22); shade(30, -40, -30, 10, 0.25, [-50, -50, 50, 14]);
      } },
      armF_up: upDef([-2, -146], AD.costume, 7308),
      armF_lo: foreDef('armF_up', AD.costume, AD.peau, false, 7309, AD.chemise),
    };
    Object.assign(parts, heldParts(AD.peau, 7320));
    return { hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-24, 18] }, order: ORDER([], ['melon']) };
  }
  CH.merAdolf = mkAdolf();
  MER.adolfPose = function (p) {
    const q = prep(p);
    gestes(q);
    if (q.tamponner != null) {
      if (q.tenu == null) q.tenu = 'tampon';
      const k = clamp(q.tamponner), T = q.cible || [96, -190];
      armTo(q, 'armF', [lerp(T[0] - 16, T[0], k), lerp(T[1] - 80, T[1], k)], 'bas', 1);
    }
    return finish(q);
  };
  MER.adolf = (pose, x, y, s, o) => run(CH.merAdolf, MER.adolfPose(pose), x, y, s == null ? 0.9 : s, o);

  // =====================================================================
  // LE PUBLICITAIRE (aujourd'hui) — cheveux plaqués gris acier, lunettes carrées, costume anthracite à fines rayures, cravate turquoise
  // =====================================================================
  const PU = { peau: '#e2c2a2', peauD: '#c6a283', costume: '#3b4048', costumeD: '#2e3238', chemise: '#eef0ee', cravate: '#3f7f86', cheveux: '#8d939a', monture: '#1c1c20', chaus: '#141416' };
  const PU_TORSO = [[-14, -176], [8, -180], [16, -168], [26, -150], [32, -112], [33, -60], [30, -10], [30, 34], [28, 48, 1], [-34, 50, 1], [-36, 0], [-36, -60], [-35, -112], [-31, -150], [-24, -168]];
  const PU_HAIR = [[30, -82], [22, -94], [6, -102], [-14, -103], [-32, -94], [-40, -76], [-40, -52], [-32, -36], [-22, -40], [-16, -58], [-6, -72], [14, -78]];
  const raies = (x0, x1, y0, y1) => { for (let x = x0; x <= x1; x += 7) strokePts([[x, y0], [x + 1, y1]], 'rgba(205,210,216,0.3)', 0.8); };
  function mkPub() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: PU_TORSO, base: PU.costume, seed: 7401, paint: () => {
        raies(-36, 34, -176, 50);
        fillPts([[6, -180], [20, -166], [22, -110], [14, -96], [8, -150]], PU.chemise);
        fillPts([[10, -170], [17, -166], [21, -120], [20, -60], [15, -52], [12, -64], [13, -120]], PU.cravate); strokePts([[13, -166], [17, -160]], 'rgba(255,255,255,0.3)', 1.2);
        fillPts([[8, -178], [24, -150], [24, -110], [16, -84], [10, -140]], PU.costumeD);
        for (const y of [-40, -10]) dot(26, y, 2.2, '#15171a');
        fillPts([[-6, -128, 1], [14, -128, 1], [14, -123, 1], [-6, -123, 1]], PU.costumeD); fillPts([[0, -134], [8, -136], [10, -128], [0, -128]], PU.cravate);
        hatch([[-46, -170], [-12, -170], [-10, 52], [-46, 52]], 0.75, 4.2, 0.3);
        shade(32, 0, -36, 0, 0.3);
      } },
      legB: legDef([-6, -2], PU.costumeD, PU.chaus, 7402, true),
      legF: legDef([6, -2], PU.costume, PU.chaus, 7403, false, () => raies(-18, 16, -10, 214)),
      armB_up: upDef([-10, -146], PU.costumeD, 7404),
      armB_lo: foreDef('armB_up', PU.costumeD, PU.peauD, true, 7405, '#dfe2e0'),
      head: { parent: 'torso', at: [6, -170], pts: X.NAP_HEAD, base: PU.peau, seed: 7406, noRivet: true, paint: (p) => {
        const f = p.face || {};
        X.earPaint(-8, -46); hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.26);
        dot(15, -34, 8, 'rgba(205,130,110,0.22)');
        X.eye(f, 17, -52); X.brow(f, 17, -63, 'rgba(70,72,78,0.95)', 2.4); X.mouth(f, 27, -26);
        if ((f.mouth || 'smile') === 'smile') strokePts([[20, -27], [17, -30]], 'rgba(110,40,38,0.9)', 1.4);
        fillPts([[8, -58], [30, -58], [30, -46], [8, -46]], 'rgba(190,225,240,0.25)', 0, 0);
        strokePts([[8, -58], [30, -58], [30, -46], [8, -46], [8, -58]], PU.monture, 2.2);
        strokePts([[8, -54], [-28, -56]], PU.monture, 1.5); strokePts([[14, -56], [22, -56]], 'rgba(255,255,255,0.7)', 1.1);
      } },
      cheveux: { parent: 'head', at: [0, 0], pts: PU_HAIR, base: PU.cheveux, seed: 7407, noRivet: true, paint: () => {
        for (let k = 0; k < 6; k++) strokePts([[26 - k * 2, -86 + k * 3], [0 - k * 3, -98 + k * 6], [-30 + k * 2, -82 + k * 8]], 'rgba(40,44,50,0.45)', 1);
        strokePts([[20, -92], [-6, -100], [-28, -90]], 'rgba(255,255,255,0.45)', 1.6);
      } },
      armF_up: upDef([-2, -146], PU.costume, 7408, () => { raies(-14, 14, -20, 100); hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.28); }),
      armF_lo: foreDef('armF_up', PU.costume, PU.peau, false, 7409, PU.chemise),
    };
    Object.assign(parts, heldParts(PU.peau, 7420));
    return { hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-24, 18] }, order: ORDER(['cheveux']) };
  }
  CH.merPub = mkPub();
  MER.pubPose = function (p) {
    const q = prep(p);
    if (!q.face.brow) q.face.brow = 'up';
    if (!q.face.mouth) q.face.mouth = 'smile';
    gestes(q);
    return finish(q);
  };
  MER.pub = (pose, x, y, s, o) => run(CH.merPub, MER.pubPose(pose), x, y, s == null ? 0.92 : s, o);

  // =====================================================================
  // ACCESSOIRES SEULS — M.puppet à une pièce invisible ; l'objet se dessine dans l'extra (ombre portée possible)
  // =====================================================================
  const accDefs = {};
  function accDef(name, fn) { return accDefs[name] || (accDefs[name] = { hipY: 0, handLen: 10, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => fn(p.o) } }, order: ['o'] }); }
  function acc(name, x, y, s, o) {
    o = o || {}; s = s == null ? 1 : s;
    const ob = OBJ[name];
    const def = accDef(name, (oo) => { const c = cx_(); c.save(); c.translate(-ob.base[0], -ob.base[1]); ob.draw(oo); c.restore(); });
    const r = M.puppet(def, { o, tilt: o.rot || 0 }, x, y, s, { dir: o.dir || 1, rod: false, slot: o.slot != null ? o.slot : y + 6 * s, floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
    r.pt = (nom) => { const q = ptOf(ob, nom, o); return q ? r.w('o', q[0] - ob.base[0], q[1] - ob.base[1]) : null; };
    return r;
  }
  for (const n of Object.keys(OBJ)) if (!['terre', 'eau', 'airs'].includes(n)) MER[n] = (x, y, s, o) => acc(n, x, y, s, o);
  MER.icone = (x, y, s, o) => acc((o && o.type) || 'terre', x, y, s, o);

  // =====================================================================
  // DÉCORS PRÉ-RENDUS — MER.init() → MER.K
  // =====================================================================
  MER.SALON = { fenetre: { x0: 712, x1: 888, y0: 452, y1: 940 }, cheminees: [[744, 776], [790, 752], [846, 768]], portrait: { x: 480, y: 520 }, applique: { x: 236, y: 640 } };
  function texToile(x, H, a) { x.save(); x.globalCompositeOperation = 'multiply'; x.globalAlpha = a; x.fillStyle = M.tex.canvasPat; x.fillRect(0, 0, M.W, H); x.restore(); }
  function makeSalon(vieux) {
    const H = ST.back + 5, S = MER.SALON, F = S.fenetre;
    return M.pre(M.W, H, (x) => {
      x.fillStyle = vieux ? '#46594a' : '#2f4636'; x.fillRect(0, 0, M.W, H);
      for (let r = 0; r < 9; r++) for (let k = 0; k < 14; k++) {
        const px = k * 84 + (r % 2) * 42, py = 400 + r * 76; if (py > 990) continue;
        x.fillStyle = vieux ? 'rgba(210,190,130,0.16)' : 'rgba(200,170,90,0.2)';
        for (let i = 0; i < 4; i++) { const a = i * PI / 2; x.beginPath(); x.ellipse(px + Math.cos(a) * 7, py + Math.sin(a) * 7, 5, 3, a, 0, TAU); x.fill(); }
        x.beginPath(); x.arc(px, py, 2.4, 0, TAU); x.fill();
      }
      x.fillStyle = 'rgba(0,0,0,0.08)'; for (let k = 0; k < M.W; k += 42) x.fillRect(k, 340, 2, 660);
      x.fillStyle = '#26271f'; x.fillRect(0, 0, M.W, 236);
      piece(rect(-10, 232, M.W + 10, 262), '#cbbf9e', () => { strokePts([[0, 240], [M.W, 240]], 'rgba(255,255,255,0.4)', 1.4); strokePts([[0, 256], [M.W, 256]], 'rgba(60,40,20,0.4)', 1.4); }, { seed: 7501 });
      piece(rect(-10, 262, M.W + 10, 330), '#5a2a2a', () => {
        for (let k = 0; k < 28; k++) { x.strokeStyle = 'rgba(200,160,80,0.7)'; x.lineWidth = 2.4; x.beginPath(); x.arc(k * 40 + 20, 310, 14, PI, TAU); x.stroke(); x.fillStyle = 'rgba(200,160,80,0.6)'; x.beginPath(); x.arc(k * 40 + 20, 288, 3, 0, TAU); x.fill(); }
        strokePts([[0, 268], [M.W, 268]], 'rgba(200,160,80,0.6)', 2); strokePts([[0, 324], [M.W, 324]], 'rgba(200,160,80,0.6)', 2);
      }, { seed: 7502 });
      piece(rect(-10, 372, M.W + 10, 380), '#5b4030', null, { seed: 7503 });
      piece(rect(-10, 990, M.W + 10, 1014), '#6b4a32', () => strokePts([[0, 994], [M.W, 994]], 'rgba(255,220,170,0.3)', 1.4), { seed: 7504 });
      piece(rect(-10, 1014, M.W + 10, H + 10), '#4e3322', () => {
        for (let k = 0; k < 7; k++) { const x0 = 20 + k * 160; fillPts(rect(x0, 1040, x0 + 136, 1320), '#5a3c28'); strokePts([[x0, 1320], [x0, 1040], [x0 + 136, 1040]], 'rgba(255,220,170,0.25)', 2); strokePts([[x0 + 136, 1040], [x0 + 136, 1320], [x0, 1320]], 'rgba(0,0,0,0.4)', 2); }
        fillPts(rect(-10, 1340, M.W + 10, H + 10), '#33221a'); hatch(null, 0.15, 4, 0.18, 1, P.encre, [0, 1010, M.W, H]);
      }, { seed: 7505 });
      // fenêtre et vue sur l'usine
      piece(rect(F.x0 - 22, F.y0 - 22, F.x1 + 22, F.y1 + 20), '#5b4030', () => {
        const g = x.createLinearGradient(0, F.y0, 0, F.y1); g.addColorStop(0, '#d9d5c4'); g.addColorStop(0.6, '#c9cdc2'); g.addColorStop(1, '#a7b39e');
        x.fillStyle = g; x.fillRect(F.x0, F.y0, F.x1 - F.x0, F.y1 - F.y0);
        fillPts([[F.x0, 860], [740, 836], [800, 846], [860, 828], [F.x1, 840], [F.x1, F.y1], [F.x0, F.y1]], '#8e9c86');
        for (const [cxh, top] of S.cheminees) fillPts(rect(cxh - 5, top, cxh + 5, 860), '#6a5a50');
        fillPts([[724, 880], [724, 846], [760, 846], [760, 830], [800, 830], [800, 846], [870, 846], [870, 880]], '#7d7064');
        for (let k = 0; k < 6; k++) fillPts(rect(732 + k * 22, 856, 740 + k * 22, 866), 'rgba(240,210,140,0.7)');
        fillPts(rect(F.x0, 880, F.x1, F.y1), '#7f8f74');
        for (const [cxh, top] of S.cheminees) for (let i = 0; i < 3; i++) fillPts(ell(cxh + 6 + i * 9, top - 10 - i * 16, 7 + i * 4, 6 + i * 3, 10), 'rgba(225,222,214,0.6)');
        x.strokeStyle = '#5b4030'; x.lineWidth = 7; x.beginPath(); x.moveTo((F.x0 + F.x1) / 2, F.y0); x.lineTo((F.x0 + F.x1) / 2, F.y1);
        x.moveTo(F.x0, 640); x.lineTo(F.x1, 640); x.moveTo(F.x0, 800); x.lineTo(F.x1, 800); x.stroke();
        x.fillStyle = 'rgba(255,255,250,0.22)'; x.beginPath(); x.moveTo(F.x0, 700); x.lineTo(F.x0 + 80, F.y0); x.lineTo(F.x0 + 120, F.y0); x.lineTo(F.x0, 760); x.fill();
      }, { seed: 7510 });
      piece(rect(F.x0 - 34, F.y1 + 14, F.x1 + 34, F.y1 + 32), '#6b4a32', null, { seed: 7511 });
      for (const sd of [-1, 1]) {
        const xa = sd < 0 ? F.x0 - 66 : F.x1 + 66, xb = sd < 0 ? F.x0 + 18 : F.x1 - 18, xm = sd < 0 ? F.x0 - 8 : F.x1 + 8;
        piece([[xa, 420], [xb, 420], [lerp(xb, xm, 0.6), 600], [xm, 760], [lerp(xb, xm, 0.3), 900], [xb, 1006], [xa, 1006]], '#8f7038', () => {
          for (let k = 1; k < 5; k++) strokePts([[lerp(xa, xb, k / 5), 424], [lerp(xa, xm, k / 5), 760], [lerp(xa, xb, k / 5), 1000]], 'rgba(60,40,10,0.45)', 2);
          hatch(null, 1.3, 4, 0.2, 1, P.encre, [Math.min(xa, xb) - 10, 420, Math.max(xa, xb) + 10, 1010]);
        }, { seed: 7520 + sd });
        piece(ell(xm, 760, 12, 9, 12), '#c8a24a', null, { seed: 7524 + sd });
      }
      piece([[F.x0 - 80, 400, 1], [F.x1 + 80, 400, 1], [F.x1 + 80, 462], [F.x1 + 20, 482], [800, 466], [F.x0 - 20, 482], [F.x0 - 80, 462]], '#5c2a2a', () => {
        strokePts([[F.x0 - 80, 458], [F.x0 - 20, 478], [800, 462], [F.x1 + 20, 478], [F.x1 + 80, 458]], '#c8a24a', 3); hatch(null, 1.4, 4, 0.2, 1, P.encre, [600, 396, 1000, 490]);
      }, { seed: 7530 });
      // applique à gaz
      const A = S.applique;
      piece([[A.x - 14, A.y + 40, 1], [A.x + 14, A.y + 40, 1], [A.x + 10, A.y + 70, 1], [A.x - 10, A.y + 70, 1]], OR.laiton, null, { seed: 7540 });
      piece([[A.x - 3, A.y + 44], [A.x + 3, A.y + 44], [A.x + 32, A.y + 12], [A.x + 26, A.y + 8]], OR.laitonD, null, { seed: 7541 });
      piece([[A.x + 16, A.y + 6], [A.x + 46, A.y + 6], [A.x + 52, A.y - 20], [A.x + 42, A.y - 44], [A.x + 20, A.y - 44], [A.x + 10, A.y - 20]], '#efe6cc', () => { x.fillStyle = 'rgba(255,220,140,0.5)'; x.fillRect(A.x + 10, A.y - 30, 44, 30); }, { seed: 7542 });
      if (vieux) { x.fillStyle = 'rgba(70,100,70,0.35)'; x.fillRect(S.portrait.x - 110, S.portrait.y - 140, 220, 280); }
      texToile(x, H, 0.4);
      if (vieux) { x.save(); x.globalAlpha = 0.2; x.fillStyle = '#d8c69a'; x.fillRect(0, 0, M.W, H); x.restore(); }
      const vg = x.createLinearGradient(0, H - 140, 0, H); vg.addColorStop(0, 'rgba(30,20,10,0)'); vg.addColorStop(1, 'rgba(30,20,10,0.35)'); x.fillStyle = vg; x.fillRect(0, H - 140, M.W, 140);
    });
  }
  MER.AVENUE = { vitrine: { x0: 250, x1: 830, y0: 650, y1: 1300 }, trottoir: 1312 };
  function makeAvenue() {
    const H = ST.back + 5, V = MER.AVENUE.vitrine;
    return M.pre(M.W, H, (x) => {
      const g = x.createLinearGradient(0, 0, 0, 600); g.addColorStop(0, '#c9d3d6'); g.addColorStop(1, '#e3e4dd'); x.fillStyle = g; x.fillRect(0, 0, M.W, H);
      piece(rect(-10, 250, 300, H + 10), '#d9ccb2', () => {
        for (let r = 0; r < 7; r++) for (let k = 0; k < 3; k++) { const wx = 20 + k * 90, wy = 300 + r * 130; if (wy > 1180) continue; fillPts(rect(wx, wy, wx + 54, wy + 82), '#5d6870'); strokePts([[wx, wy + 84], [wx + 54, wy + 84]], 'rgba(255,255,255,0.6)', 3); fillPts([[wx + 6, wy + 6], [wx + 18, wy + 6], [wx + 6, wy + 30]], 'rgba(255,255,255,0.18)'); }
        for (let y = 290; y < 1300; y += 130) strokePts([[0, y], [300, y]], 'rgba(120,100,70,0.25)', 1.4);
        hatch(null, 0.2, 5, 0.12);
      }, { seed: 7601 });
      piece(rect(800, 210, M.W + 10, H + 10), '#c8cbc7', () => {
        for (let r = 0; r < 6; r++) for (let k = 0; k < 3; k++) { const wx = 822 + k * 86, wy = 260 + r * 150; if (wy > 1150) continue; fillPts(rect(wx, wy, wx + 50, wy + 110), '#66737b'); strokePts([[wx + 25, wy], [wx + 25, wy + 110]], '#c8cbc7', 2); }
        hatch(null, 0.2, 5, 0.12);
      }, { seed: 7602 });
      piece(rect(210, 330, 860, H + 10), '#e6e3dc', () => {
        fillPts(rect(210, 330, 860, 352), '#cfcac0');
        for (const y of [400, 480]) { fillPts(rect(236, y, 834, y + 50), '#9fb0b6'); for (let k = 236; k < 834; k += 75) strokePts([[k, y], [k, y + 50]], '#e6e3dc', 3); }
        fillPts(rect(226, 566, 844, 624), '#cfd2d0'); strokePts([[226, 595], [844, 595]], 'rgba(120,125,128,0.35)', 1.4);
        const gg = x.createLinearGradient(0, V.y0, 0, V.y1); gg.addColorStop(0, '#d3d7d4'); gg.addColorStop(1, '#bfc5c2'); x.fillStyle = gg; x.fillRect(V.x0, V.y0, V.x1 - V.x0, V.y1 - V.y0);
        fillPts(rect(V.x0, 1180, V.x1, V.y1), '#e3e3dc'); strokePts([[V.x0, 1180], [V.x1, 1180]], 'rgba(90,95,100,0.4)', 1.4);
        for (let k = 0; k < 8; k++) { dot(V.x0 + 40 + k * 72, V.y0 + 22, 6, '#f6f3e6'); x.fillStyle = 'rgba(255,250,230,0.25)'; x.beginPath(); x.moveTo(V.x0 + 34 + k * 72, V.y0 + 26); x.lineTo(V.x0 + 20 + k * 72, 1180); x.lineTo(V.x0 + 60 + k * 72, 1180); x.lineTo(V.x0 + 46 + k * 72, V.y0 + 26); x.fill(); }
        x.fillStyle = 'rgba(150,175,185,0.35)'; x.fillRect(V.x0, V.y0, V.x1 - V.x0, V.y1 - V.y0);
        x.fillStyle = 'rgba(255,255,255,0.22)';
        for (const [a, w] of [[V.x0 + 40, 70], [V.x0 + 300, 40], [V.x0 + 420, 90]]) { x.beginPath(); x.moveTo(a, V.y1); x.lineTo(a + 260, V.y0); x.lineTo(a + 260 + w, V.y0); x.lineTo(a + w, V.y1); x.fill(); }
        for (const mx of [V.x0, V.x0 + 193, V.x0 + 387, V.x1]) fillPts(rect(mx - 5, V.y0, mx + 5, V.y1), '#8b9196');
        fillPts(rect(V.x0 - 8, V.y0 - 8, V.x1 + 8, V.y0), '#8b9196'); fillPts(rect(V.x0 - 8, V.y1, V.x1 + 8, V.y1 + 14), '#8b9196');
      }, { seed: 7603 });
      piece(rect(-10, MER.AVENUE.trottoir, M.W + 10, H + 10), '#bdbab2', () => {
        for (let k = 0; k < 20; k++) strokePts([[k * 60, MER.AVENUE.trottoir], [k * 60 - 20, H]], 'rgba(90,90,85,0.35)', 1.2);
        strokePts([[0, MER.AVENUE.trottoir + 4], [M.W, MER.AVENUE.trottoir + 4]], 'rgba(255,255,255,0.5)', 1.4);
      }, { seed: 7604 });
      piece(rect(924, 1220, 1000, MER.AVENUE.trottoir + 4), '#8d9094', null, { seed: 7605 });
      piece(ell(962, 1150, 54, 78, 18), '#6b7d57', () => hatch(null, 0.8, 4, 0.25), { seed: 7606 });
      texToile(x, H, 0.3);
      const vg = x.createLinearGradient(0, H - 140, 0, H); vg.addColorStop(0, 'rgba(30,20,10,0)'); vg.addColorStop(1, 'rgba(30,20,10,0.28)'); x.fillStyle = vg; x.fillRect(0, H - 140, M.W, 140);
    });
  }
  const TOILE = { w: 1000, h: 1300 };
  function makeToile() {
    const { w, h } = TOILE;
    const cv = M.pre(w, h, (x) => {
      const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#ebe3cc'); g.addColorStop(0.55, '#dfe0d4'); g.addColorStop(1, '#c4d3d8'); x.fillStyle = g; x.fillRect(0, 22, w, h - 22);
      const R = M.rng(77);
      for (let i = 0; i < 60; i++) { x.fillStyle = `rgba(${R() < 0.5 ? '255,250,235' : '170,190,200'},0.12)`; x.beginPath(); x.ellipse(R() * w, 40 + R() * (h - 60), 60 + R() * 120, 18 + R() * 30, R() - 0.5, 0, TAU); x.fill(); }
      x.strokeStyle = 'rgba(120,110,90,0.3)'; x.lineWidth = 1.5; x.setLineDash([6, 6]); x.beginPath(); for (const sx of [333, 666]) { x.moveTo(sx, 24); x.lineTo(sx, h - 20); } x.stroke(); x.setLineDash([]);
      x.save(); x.globalCompositeOperation = 'multiply'; x.globalAlpha = 0.5; x.fillStyle = M.tex.canvasPat; x.fillRect(0, 22, w, h - 22); x.restore();
      x.fillStyle = 'rgba(90,80,60,0.25)'; x.fillRect(0, h - 22, w, 22);
      piece(rect(-6, 0, w + 6, 24), '#5b4030', () => { strokePts([[0, 6], [w, 6]], 'rgba(255,220,170,0.35)', 1.6); }, { seed: 7701 });
      for (let k = 0; k < 9; k++) piece(ell(40 + k * 115, 22, 8, 6, 10), '#c9b48a', null, { seed: 7702 + k });
    });
    cv.padB = 0; return cv;
  }
  // toile de fond qui descend des cintres : k 0 (hors champ) → 1 (posée sur le plancher) ; câbles jusqu'aux cintres
  MER.toile = function (k, t, o) {
    o = o || {}; const K = MER.K.toile, y = ST.back - (1 - clamp(k)) * 1340, top = y - TOILE.h, c = cx_();
    c.save(); c.strokeStyle = 'rgba(25,18,12,0.75)'; c.lineWidth = 2; c.beginPath();
    for (const dx of [-400, 0, 400]) { c.moveTo(540 + dx, top + 2); c.lineTo(540 + dx, 0); } c.stroke(); c.restore();
    M.flat(K, 540, y, { ripple: o.ripple ? { amp: o.ripple, t: t || 0 } : undefined, alpha: o.alpha });
  };
  // fumée animée des cheminées vues par la fenêtre du salon (à dessiner juste après le salon)
  MER.salonFumee = function (t) {
    const F = MER.SALON.fenetre, c = cx_();
    c.save(); c.beginPath(); c.rect(F.x0, F.y0, F.x1 - F.x0, F.y1 - F.y0); c.clip();
    for (const [cxh, top] of MER.SALON.cheminees) for (let i = 0; i < 4; i++) {
      const u = ((t || 0) * 0.22 + i / 4 + cxh * 0.01) % 1, r = 6 + u * 16;
      c.fillStyle = `rgba(232,229,222,${0.65 * (1 - u)})`; c.beginPath(); c.ellipse(cxh + 4 + u * 40, top - 6 - u * 120, r, r * 0.8, 0, 0, TAU); c.fill();
    }
    c.restore();
  };
  MER.init = function () {
    if (MER.K) return MER.K;
    const K = (MER.K = {});
    K.salon = makeSalon(false); K.salonVieux = makeSalon(true); K.avenue = makeAvenue(); K.toile = makeToile();
    return K;
  };
})();
