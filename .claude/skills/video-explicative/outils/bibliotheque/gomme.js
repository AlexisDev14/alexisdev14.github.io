// persos.js — « La gomme, quand on effaçait avec du pain » : Edward Nairne, la souris de l'atelier, miche et boulette de mie, caoutchouc, planche à dessin, boutique-atelier de Nairne (Londres vers 1770). Espace M.gom (alias GOM). Mode d'emploi : persos.md.
// Appeler GOM.init() dans S.init. Aucun texte, lettre, chiffre ni logo. Déterministe (aucun Math.random).
// MARIONNETTES : GOM.nairne(pose, x, y, s, o) → r ; GOM.nairnePose(pose, x, y, s, dir) ; GOM.pt(r, nom, arriere) ; GOM.main(r, arriere) ; GOM.souris(x, y, s, o)
// ACCESSOIRES  : GOM.crayon, GOM.boulette, GOM.caoutchouc, GOM.miche (x, y, s, o) ; GOM.planche(x, y, s, o) + GOM.planchePt(nom, x, y, s) ; GOM.fil(a, b, o)
// DÉCORS       : GOM.atelier(t, up, o), GOM.comptoir(t, up, o), GOM.atelierAvant(t, up, o), GOM.lumiere(t, o) ; repères GOM.AT
(function () {
  const X = M.X, CH = M.chars, TAU = M.TAU, PI = Math.PI, D = 180 / PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease } = M;
  const GOM = (M.gom = {});
  const cx_ = () => M.ctx(), SIL = () => M._sil();
  const OFFP = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];

  // ------------------------------------------------------------ géométrie
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
  const tf = (pts, T, a) => { const c = Math.cos(a), s = Math.sin(a); return pts.map((p) => { const q = [T[0] + p[0] * c - p[1] * s, T[1] + p[0] * s + p[1] * c]; return p[2] ? [q[0], q[1], 1] : q; }); };

  // ------------------------------------------------------------ couleurs
  const PEAU = '#e2c3a0', PEAUD = '#c9a07c', CHEM = '#ece6d6', CHEMD = '#cfc6b0', GILET = '#5E6B4A', GILETD = '#48543a', TABLIER = '#7A5230', TABLIERD = '#5a3b21';
  const CULOTTE = '#2C3550', BAS = '#e8e2d2', SOULIER = '#221c18', CHEV = '#c9c6bf', CHEVD = '#93908a', CHEVL = '#ecebe6';
  const LAIT = '#b8913e', LAITL = '#e2c271', LAITD = '#8a6a2a';
  const CROUTE = '#C08A4A', CROUTED = '#8f5e2c', CROUTEL = '#dcae6a', MIE = '#EFE3C4', MOISI = '#6E8B3D', MOISIB = '#3f8a7a';
  const CAOU = '#8B5A2B', CAOUL = '#c58a44', CAOUD = '#5e3a18', MIEL = '#e8b060';
  const GRAPH = 'rgba(50,50,58,0.92)';

  // ------------------------------------------------------------ bras à articulations rondes, IK (coude toujours vers l'avant)
  const R_COUDE = 11.5, LA = 96, LB = Math.hypot(4, 96), PHI = Math.atan2(-4, 96), SH_F = [-2, -146], SH_B = [-10, -146];
  function armR(len, wt) { wt = wt || 15; return ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1, 40], [R_COUDE + 0.5, len - 6]], ep(0, len, R_COUDE, R_COUDE, 10, 0, PI), [[-R_COUDE - 0.5, len - 6], [-wt + 1, 40]]); }
  function foreR(kind) { const f = X.forePts(kind); return ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU).concat(f.slice(2)); }
  function ik2(S, T) {
    const vx = T[0] - S[0], vy = T[1] - S[1];
    const d = clamp(Math.hypot(vx, vy), Math.abs(LA - LB) + 1, LA + LB - 0.5), tv = Math.atan2(-vx, vy);
    const a1 = Math.acos(clamp((LA * LA + d * d - LB * LB) / (2 * LA * d), -1, 1));
    let best = null;
    for (const sg of [1, -1]) {
      const a = tv + sg * a1, E = [S[0] - LA * Math.sin(a), S[1] + LA * Math.cos(a)];
      const cAbs = Math.atan2(-(T[0] - E[0]), T[1] - E[1]) - PHI, b = normA(cAbs - a);
      if (!best || -b > best.sc) best = { a: normA(a), b, sc: -b };
    }
    return best;
  }

  // ================================================================== OBJETS (repère : y vers le bas, échelle 1)
  // ---- crayon (bois ocre, mine noire) : pointe en bas, 122 de long
  function drawCrayon() {
    pc([[-5, -62, 1], [5, -62, 1], [5, 38], [0, 61, 1], [-5, 38]], '#c8963e', () => {
      fillPts([[-6, 36], [6, 36], [0, 62]], '#e8cc98'); fillPts([[-2, 51], [2, 51], [0, 62]], '#1e1c1e');
      strokePts([[1.8, -60], [1.8, 36]], 'rgba(255,232,170,0.7)', 1.2); strokePts([[-2.4, -60], [-2.4, 36]], 'rgba(90,55,20,0.55)', 1);
      fillPts(rect(-6, -62, 6, -56), '#a8742e');
    }, 8101);
  }
  // ---- boulette de mie : o.etat 'fraiche'|'grise'|'moisie' ; o.taille (diamètre, défaut 56) ; o.roule (rad, la mie tourne)
  function bouleR(o) { return (o.taille || 56) / 2; }
  function drawBoulette(o) {
    const r = bouleR(o), e = o.etat || 'fraiche', ro = o.roule || 0, pts = [];
    for (let i = 0; i < 20; i++) { const a = i / 20 * TAU; const rr = r * (1 + 0.05 * Math.sin(a * 3 + 1 + ro) + 0.035 * Math.sin(a * 5 - ro)); pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
    const base = e === 'grise' ? '#cfc9b8' : e === 'moisie' ? '#e2d8b6' : MIE;
    pc(pts, base, () => {
      const R = M.rng(8200);
      for (let i = 0; i < 16; i++) { const a = R() * TAU + ro, d = R() * r * 0.82; dot(Math.cos(a) * d, Math.sin(a) * d, (1.1 + R() * 1.7) * r / 28, 'rgba(165,132,82,0.5)'); }
      if (e === 'grise') {
        for (let i = 0; i < 6; i++) { const a = R() * TAU + ro, d = R() * r * 0.6, l = r * (0.4 + R() * 0.5), b = R() * PI; const x0 = Math.cos(a) * d, y0 = Math.sin(a) * d; strokePts([[x0, y0], [x0 + Math.cos(b) * l, y0 + Math.sin(b) * l]], 'rgba(62,62,70,0.62)', 2.6 * r / 28); }
        for (let i = 0; i < 4; i++) { const a = R() * TAU + ro, d = R() * r * 0.5; fillPts(ell(Math.cos(a) * d, Math.sin(a) * d, r * 0.3, r * 0.18, 10), 'rgba(80,80,88,0.3)'); }
      }
      if (e === 'moisie') {
        const S = [[-0.45, -0.35, 0.34], [0.38, -0.42, 0.26], [0.1, 0.3, 0.36], [-0.5, 0.42, 0.22], [0.58, 0.28, 0.2], [-0.05, -0.62, 0.18]];
        S.forEach(([sx, sy, sr], i) => {
          const a = Math.atan2(sy, sx) + ro, d = Math.hypot(sx, sy) * r, px = Math.cos(a) * d, py = Math.sin(a) * d, col = i % 2 ? MOISIB : MOISI;
          fillPts(ell(px, py, sr * r * 1.25, sr * r, 12), 'rgba(160,190,110,0.55)');
          fillPts(ell(px, py, sr * r, sr * r * 0.82, 12), col);
          for (let k = 0; k < 5; k++) { const b = k / 5 * TAU + i; dot(px + Math.cos(b) * sr * r * 1.1, py + Math.sin(b) * sr * r * 0.95, 1.4 * r / 28, '#9fbe62'); }
          dot(px - sr * r * 0.3, py - sr * r * 0.3, sr * r * 0.3, 'rgba(210,235,170,0.5)');
        });
      }
      shade(-r * 0.4, -r * 0.4, r * 0.7, r * 0.7, 0.32, [-r - 4, -r - 4, r + 4, r + 4]);
      strokePts(ep(0, 0, r * 0.7, r * 0.7, 6, PI * 1.1, PI * 1.45), 'rgba(255,255,255,0.65)', 1.6);
    }, 8201, { texA: 0.45 });
  }
  // ---- caoutchouc naturel : o.etat 'brut'|'cube'|'colle'|'casse' ; o.taille (côté du cube, défaut 64) ; o.fil (colle : longueur du fil sous le cube, défaut 60)
  function cubeFaces(h, sag) {
    const d = h * 0.3, b = h + (sag || 0);
    const sil = [[-h, -h + d], [-h + d, -h, 1], [h, -h, 1], [h, b - d - (sag || 0) * 0.4], [h - d, b], [-h, b]];
    return { sil, top: [[-h, -h + d], [-h + d, -h], [h, -h], [h - d, -h + d]], side: [[h - d, -h + d], [h, -h], [h, b - d - (sag || 0) * 0.4], [h - d, b]] };
  }
  function cubePaint(h, F) {
    return () => {
      fillPts(F.top, CAOUL); fillPts(F.side, CAOUD);
      if (!SIL()) { const c = cx_(), g = c.createRadialGradient(-h * 0.25, h * 0.1, 2, -h * 0.25, h * 0.1, h * 0.9); g.addColorStop(0, 'rgba(240,175,90,0.55)'); g.addColorStop(1, 'rgba(240,175,90,0)'); c.fillStyle = g; c.fillRect(-h, -h, 2 * h, 2.6 * h); }
      strokePts([[-h * 0.75, -h * 0.35], [-h * 0.75, h * 0.6]], 'rgba(255,215,150,0.55)', 2.4);
      strokePts([[-h + 6, -h + h * 0.3 + 2], [-h + h * 0.3 + 4, -h + 4]], 'rgba(255,240,200,0.8)', 2);
      for (const [x, y, r] of [[-h * 0.2, h * 0.3, 3], [h * 0.25, -h * 0.05, 2.2], [-h * 0.45, h * 0.65, 1.8]]) dot(x, y, r, 'rgba(255,220,150,0.45)');
      hatch(F.side, 1.2, 4, 0.18);
    };
  }
  function drawCaoutchouc(o) {
    const e = o.etat || 'cube', h = (o.taille || 64) / 2;
    if (e === 'brut') {
      const pts = [[-h * 1.1, -h * 0.2], [-h * 0.8, -h * 0.8], [-h * 0.1, -h * 0.95], [h * 0.6, -h * 0.75], [h * 1.15, -h * 0.15], [h * 0.95, h * 0.6], [h * 0.3, h * 0.85, 1], [-h * 0.5, h * 0.8], [-h * 1.05, h * 0.45]];
      pc(pts, CAOU, () => {
        fillPts([[-h * 0.8, -h * 0.8], [-h * 0.1, -h * 0.95], [h * 0.6, -h * 0.75], [h * 0.2, -h * 0.45], [-h * 0.5, -h * 0.5]], CAOUL);
        fillPts([[h * 0.6, h * 0.1], [h * 1.15, -h * 0.15], [h * 0.95, h * 0.6], [h * 0.3, h * 0.85]], CAOUD);
        for (let i = 0; i < 6; i++) dot(-h * 0.6 + i * h * 0.25, (i % 2 ? 0.2 : 0.45) * h, 2 + (i % 3), 'rgba(70,40,15,0.45)');
        strokePts([[-h * 0.7, -h * 0.3], [-h * 0.4, -h * 0.55]], 'rgba(255,230,180,0.8)', 2);
        hatch(null, 0.9, 4, 0.16);
      }, 8301, { texA: 0.4 });
      return;
    }
    if (e === 'casse') {
      const F = cubeFaces(h, 0);
      for (const [sg, a, seed] of [[-1, -0.16, 8302], [1, 0.12, 8303]]) {
        const c = cx_(); c.save(); c.translate(sg * h * 0.22, sg * 3); c.rotate(a);
        const crack = [[h * 0.08, -h], [-h * 0.06, -h * 0.5], [h * 0.12, -h * 0.1], [-h * 0.08, h * 0.35], [h * 0.06, h]];
        const half = sg < 0 ? [[-h, -h + h * 0.3], [-h + h * 0.3, -h, 1]].concat(crack, [[-h, h, 1]]) : crack.slice().reverse().concat([[h, -h, 1], [h, h * 0.7], [h * 0.7, h, 1]]);
        pc(half, CAOU, cubePaint(h, F), seed, { texA: 0.4 });
        strokePts(crack, 'rgba(50,28,10,0.9)', 2.2); c.restore();
      }
      for (const [x, y] of [[-4, h + 10], [8, h + 16]]) pc(ell(x, y, 4, 3, 7), CAOU, null, 8304 + x);
      return;
    }
    const sag = e === 'colle' ? h * 0.35 : 0, F = cubeFaces(h, sag);
    if (e === 'colle') {   // le bas s'étire en cou, un fil de caoutchouc descend vers la feuille
      const L = o.fil == null ? 60 : o.fil, b = h + sag;
      pc(ribbonW(qbez([0, b - 6], [-4, b + L * 0.5], [6, b + L], 10), (u) => lerp(26, 3, Math.pow(u, 0.6))), CAOUL, () => strokePts([[-3, b], [2, b + L]], 'rgba(255,230,180,0.6)', 1.4), 8305, { texA: 0.3 });
      pc(F.sil.map((p, i) => (i >= 4 ? [p[0] * 0.8, p[1] + 4] : p)), CAOU, cubePaint(h, F), 8306, { texA: 0.4 });
      return;
    }
    pc(F.sil, CAOU, cubePaint(h, F), 8307, { texA: 0.4 });
  }
  // ---- miche ronde : (x,y) = bas-centre ; 170 × 112 à s 1 ; o.entamee, o.grignotee (bool ou 0..1), o.couverte (bool ou 0..1)
  function micheSil(g) {
    const pts = [[-86, 0, 1]].concat(ep(0, -36, 86, 76, 18, PI, TAU).map((p) => [p[0], Math.min(p[1], -2)]), [[86, 0, 1]]);
    if (g > 0) return pts.map((p) => { const dx = p[0] + 86; if (dx < 70 * g && p[1] < -6) { const k = 1 - dx / (70 * g); return [p[0] + 34 * g * k + 4 * Math.sin(p[1] * 0.4), p[1] * (1 - 0.15 * k)]; } return p; });
    return pts;
  }
  function drawMiche(o) {
    const ent = o.entamee === true ? 1 : clamp(+o.entamee || 0), gri = o.grignotee === true ? 1 : clamp(+o.grignotee || 0);
    const cov = o.couverte === true ? 1 : clamp(+o.couverte || 0);
    pc(micheSil(gri), CROUTE, () => {
      shade(-40, -100, 40, 0, 0.35, [-90, -120, 90, 4]);
      for (const [x0, y0, x1, y1] of [[-50, -70, -14, -96], [-16, -62, 24, -100], [20, -56, 56, -86]]) {
        fillPts(ribbonW([[x0, y0], [(x0 + x1) / 2, (y0 + y1) / 2 - 3], [x1, y1]], 10), CROUTEL);
        strokePts([[x0, y0 + 4], [x1, y1 + 4]], 'rgba(110,60,20,0.6)', 1.4);
      }
      const R = M.rng(8401); for (let i = 0; i < 22; i++) dot(-70 + R() * 140, -100 + R() * 80, 1 + R() * 1.2, 'rgba(250,240,220,0.55)');
      fillPts(rect(-90, -8, 90, 2), CROUTED);
      hatch([[-90, -60], [-40, -110], [-40, 2], [-90, 2]], 0.8, 4, 0.18);
      if (ent > 0) {     // morceau arraché en haut à droite : mie ivoire
        const k = ent, cxm = 46, cym = -82;
        fillPts(ell(cxm, cym, 30 * k + 4, 22 * k + 3, 14).map((p, i) => [p[0] + (i % 2 ? 3 : -2), p[1] + (i % 3 ? 2 : -2)]), CROUTED);
        fillPts(ell(cxm + 2, cym + 2, 26 * k, 18 * k, 14).map((p, i) => [p[0] + (i % 2 ? 2 : -2), p[1] + (i % 3 ? 1 : -2)]), MIE);
        for (let i = 0; i < 6; i++) dot(cxm - 14 * k + i * 6 * k, cym + (i % 2 ? 4 : -4) * k, 1.6, 'rgba(170,140,90,0.55)');
      }
      if (gri > 0) {     // un tiers mangé à gauche : bord festonné de dents, mie à nu
        const x0 = -86 + 34 * gri;
        const bite = []; for (let i = 0; i <= 10; i++) { const y = -4 - i * 9.6; bite.push([x0 + 8 + (i % 2 ? 7 : 0) + 18 * Math.sin(i / 10 * PI) * gri, y]); }
        fillPts([[x0 - 30, 0]].concat(bite, [[x0 - 30, -110]]), MIE);
        strokePts(bite, CROUTED, 2.4);
        const R2 = M.rng(8402); for (let i = 0; i < 10; i++) dot(x0 - 10 + R2() * 26, -90 + R2() * 84, 1.5, 'rgba(170,140,90,0.55)');
      }
    }, 8401);
    if (gri > 0) { const R3 = M.rng(8403); for (let i = 0; i < 6; i++) pc(ell(-100 + R3() * 50, -3 - R3() * 4, 3 + R3() * 2, 2.4, 7), MIE, null, 8410 + i); }
    if (cov > 0.02) {   // serviette blanche à liseré bleu ; en se retirant, elle glisse vers le haut et la droite
      const u = 1 - cov, c = cx_(); c.save(); c.translate(70 * u, -120 * ease(u)); c.rotate(0.5 * u); if (!SIL()) c.globalAlpha = clamp(cov * 4);
      const sv = [[-104, 2, 1], [-98, -40], [-80, -84], [-40, -116], [0, -124], [44, -114], [82, -86], [100, -40], [108, 4, 1], [80, -4], [60, 6], [30, -2], [0, 8], [-30, -2], [-62, 6], [-84, -4]];
      pc(sv, '#f4f1ea', () => {
        strokePts([[-96, -10], [-84, -4], [-62, 4], [-30, -4], [0, 6], [30, -4], [60, 4], [80, -6], [100, -6]], '#4a6a9a', 3);
        strokePts([[-90, -22], [-60, -12], [-30, -18], [0, -10], [30, -18], [60, -12], [92, -20]], '#4a6a9a', 1.4);
        for (const [x0, y0, x1, y1] of [[-60, -92, -50, -20], [-10, -118, -6, -16], [42, -104, 36, -18]]) strokePts([[x0, y0], [x1, y1]], 'rgba(150,145,135,0.5)', 1.4);
        shade(-60, -110, 60, 0, 0.22, [-110, -130, 110, 10]);
      }, 8420);
      c.restore();
    }
  }

  const OBJ = {
    crayon: { draw: drawCrayon, grip: [0, -6], pts: { pointe: [0, 61], haut: [0, -62] }, base: [0, 0] },
    boulette: { draw: drawBoulette, grip: (o) => [0, bouleR(o) * 0.72], pts: { centre: [0, 0], contact: [0, 0] }, base: (o) => [0, bouleR(o)] },
    caoutchouc: { draw: drawCaoutchouc, grip: (o) => [0, (o.taille || 64) * 0.4], pts: { centre: [0, 0], contact: [0, 0], bas: [0, 32] }, base: (o) => [0, (o.taille || 64) / 2] },
    miche: { draw: drawMiche, grip: [-78, -30], pts: { haut: [0, -112], centre: [0, -50], contact: [0, -50] }, base: [0, 0] },
  };
  GOM.OBJ = OBJ;
  const gripOf = (ob, o) => (typeof ob.grip === 'function' ? ob.grip(o) : ob.grip);
  const baseOf = (ob, o) => (typeof ob.base === 'function' ? ob.base(o) : ob.base);
  function heldOpts(name, o, p) { const ob = OBJ[name]; return Object.assign({ t: p.t || 0 }, ob.held || {}, o || {}); }
  function heldDraw(name, o, p) { const ob = OBJ[name]; if (!ob) return; const oo = heldOpts(name, o, p), g = gripOf(ob, oo), c = cx_(); c.save(); c.translate(-g[0], -g[1]); ob.draw(oo); c.restore(); }
  const DOIGTS = [[-13, -9], [9, -11], [12, -4], [12, 6], [6, 11], [-6, 11], [-13, 4]];
  const doigtsPaint = () => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(70,40,30,0.5)', 1); hatch(null, 0.9, 3.4, 0.15); };
  const has = (v) => v && v !== 'rien';
  function heldParts(skin, skinB, seed) {
    return {
      objet: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (has(p.tenu)) heldDraw(p.tenu, p.tenuO, p); } },
      doigts: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 2, pts: (p) => (has(p.tenu) ? DOIGTS : OFFP), paint: doigtsPaint },
      objetB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 3, pts: OFFP, extra: (p) => { if (has(p.tenuB)) heldDraw(p.tenuB, p.tenuBO, p); } },
      doigtsB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skinB, seed: seed + 4, pts: (p) => (has(p.tenuB) ? DOIGTS : OFFP), paint: doigtsPaint },
    };
  }
  GOM.pt = function (r, nom, arriere) {
    const name = arriere ? r.tenuB : r.tenu, ob = OBJ[name]; if (!ob || !ob.pts[nom]) return null;
    const oo = arriere ? r.tenuBO : r.tenuO, g = gripOf(ob, oo), q = ob.pts[nom];
    return r.w(arriere ? 'objetB' : 'objet', q[0] - g[0], q[1] - g[1]);
  };
  GOM.main = (r, arriere) => r.w(arriere ? 'armB_lo' : 'armF_lo', 4, 96);

  // ================================================================== POSES — préparation commune
  function prep(p) { p = p || {}; return Object.assign({}, p, { ang: Object.assign({}, p.ang), hide: Object.assign({}, p.hide), face: Object.assign({}, p.face) }); }
  function toTorso(def, q, P_, x, y, s, dir) { const m = M.partMatrices(def, q, x, y, s, dir).mats.torso; const r = new DOMPoint(P_[0], P_[1]).matrixTransform(m.inverse()); return [r.x, r.y]; }
  function armTo(q, arm, T, k) {
    if (!(k > 0)) return;
    const sol = ik2(arm === 'armF' ? SH_F : SH_B, T), A = q.ang, a0 = A[arm + '_up'] || 0, b0 = A[arm + '_lo'] || 0;
    A[arm + '_up'] = a0 + normA(sol.a - a0) * k; A[arm + '_lo'] = b0 + normA(sol.b - b0) * k;
  }
  const faceDef = (q, k, f) => { if (k > 0.5) for (const n in f) if (q.face[n] == null) q.face[n] = f[n]; };
  function cibleT(def, q, cible, x, y, s, dir, off, dflt) {
    if (!cible) return dflt;
    const T = toTorso(def, q, cible, x, y, s, dir); if (!off) return T;
    const tl = q.tilt || 0, ox = off[0], oy = off[1];
    return [T[0] - (ox * Math.cos(tl) + oy * Math.sin(tl)), T[1] - (-ox * Math.sin(tl) + oy * Math.cos(tl))];
  }
  function offsetObj(name, oo, nom, rot) { const ob = OBJ[name]; if (!ob || !ob.pts[nom]) return [0, 0]; const o2 = Object.assign({}, ob.held || {}, oo || {}), g = gripOf(ob, o2), q = ob.pts[nom]; const vx = q[0] - g[0], vy = q[1] - g[1], cr = Math.cos(rot || 0), sr = Math.sin(rot || 0); return [vx * cr - vy * sr, vx * sr + vy * cr]; }
  function marche(q, k, t) {
    if (!(k > 0)) return; const ph = t * 7.2, A = q.ang;
    A.legF = (A.legF || 0) + Math.sin(ph) * 0.3 * k; A.legB = (A.legB || 0) - Math.sin(ph) * 0.3 * k;
    A.armF_up = (A.armF_up || 0) - Math.sin(ph) * 0.12 * k; A.armB_up = (A.armB_up || 0) + Math.sin(ph) * 0.1 * k;
    A.armF_lo = (A.armF_lo || 0) - 0.2 * k; A.armB_lo = (A.armB_lo || 0) - 0.2 * k;
    A.queue = (A.queue || 0) + Math.sin(ph * 2) * 0.06 * k;
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
    return q;
  }
  function run(def, q, x, y, s, o) {
    const r = M.puppet(def, q, x, y, s, Object.assign({ slot: M.ST.slotF }, o || {}));
    r.q = q; r.tenu = q.tenu; r.tenuB = q.tenuB;
    if (has(q.tenu) && OBJ[q.tenu]) r.tenuO = heldOpts(q.tenu, q.tenuO, q);
    if (has(q.tenuB) && OBJ[q.tenuB]) r.tenuBO = heldOpts(q.tenuB, q.tenuBO, q);
    return r;
  }

  // ================================================================== EDWARD NAIRNE (≈ 40 ans, mince et droit, en bras de chemise)
  const N_TORSO = [[-14, -178], [8, -182], [18, -170], [28, -152], [35, -120], [39, -84], [40, -44], [39, -10], [41, 20], [44, 46, 1], [-38, 48, 1], [-40, 10], [-38, -40], [-39, -100], [-35, -146], [-28, -168]];
  // tête : NAP_HEAD au nez plus fort (aquilin)
  const N_HEAD = [[-14, 16], [10, 16], [11, 2], [16, -6], [24, -10], [28, -16], [27, -22], [29, -26], [30, -31], [36, -35], [42, -40, 1], [36, -48], [30, -57], [29, -64], [26, -78], [14, -92], [-6, -97], [-24, -88], [-33, -68], [-32, -46], [-24, -28], [-17, -8]];
  const N_HAIR = [[24, -78], [27, -86], [16, -98], [-4, -104], [-26, -97], [-40, -80], [-44, -58], [-42, -36], [-35, -20], [-26, -14], [-22, -30], [-20, -46], [-12, -60], [0, -70], [12, -76]];
  const N_QUEUE = [[-8, -6], [8, -6], [8, 20], [5, 46], [0, 62, 1], [-6, 46], [-10, 20]];
  const N_RUBAN = [[-2, -3], [-10, -8, 1], [-11, 0], [-10, 7, 1], [-2, 3], [-3, 16, 1], [0, 13], [3, 16, 1], [2, 3], [10, 7, 1], [11, 0], [10, -8, 1], [2, -3]];
  const LOUPE = [[-10, 2], [10, 2], [13, -26], [-13, -26]];
  const N_TABLIER = [[-6, -64], [42, -66], [47, -20], [50, 40], [54, 100], [57, 138, 1], [4, 142, 1], [-1, 96], [-4, 40], [-7, -20]];
  const N_CORDON = [[-41, -69], [42, -71], [42, -62], [-41, -60]];
  const N_NOEUD = [[-38, -69], [-49, -76, 1], [-51, -66], [-46, -64], [-52, -57, 1], [-44, -61], [-47, -44, 1], [-42, -45], [-39, -60]];
  const SEAT_LEG = [[-18, -14], [96, -17], [110, -12], [120, 0], [121, 40], [119, 96], [121, 104], [146, 110], [152, 120, 1], [150, 123, 1], [96, 123, 1], [96, 106], [98, 60], [97, 22], [86, 15], [-20, 14]];
  function legDef(at, seed, back) {
    return { parent: 'torso', at, seed, noRivet: !!back, base: back ? '#232a40' : CULOTTE, pts: X.legPts(0.9),
      paint: () => {
        fillPts([[-40, 116, 1], [60, 116, 1], [60, 216, 1], [-40, 216, 1]], back ? '#c9c2b2' : BAS);
        strokePts([[-22, 118], [22, 116]], back ? '#1a2032' : '#1f263a', 3);
        fillPts([[-40, 214, 1], [60, 214, 1], [60, 260, 1], [-40, 260, 1]], SOULIER);
        if (!back) { fillPts(rect(12, 214, 28, 224), LAIT); fillPts(rect(16, 217, 24, 221), SOULIER); hatch([[-26, -20], [-6, -20], [-6, 116], [-26, 116]], 0.8, 4, 0.25); }
        else hatch(null, 0.8, 3.6, 0.3);
      } };
  }
  function mkNairne() {
    const upDef = (at, base, seed) => ({ parent: 'torso', at, pts: armR(LA, 16), base, seed, paint: () => {
      strokePts([[-6, 8], [3, 40], [-5, 74]], 'rgba(150,140,118,0.7)', 1.3); strokePts([[6, 20], [9, 60]], 'rgba(150,140,118,0.55)', 1.1);
      hatch([[-17, -20], [-4, -20], [-4, 100], [-17, 100]], 0.9, 3.8, 0.26); } });
    const foreDef = (parent, skin, sleeve, back, seed) => {
      const hk = (p) => (back ? p.handB : p.handF) || 'fist';
      return { parent, at: [0, LA], pts: (p) => foreR(hk(p)), base: skin, seed, paint: (p) => {
        X.handPaint(null, hk(p));
        fillPts(rrect(-15, -16, 15, 24, 8), sleeve);                                           // manche retroussée
        strokePts([[-13, 6], [13, 4]], 'rgba(140,128,104,0.8)', 1.4); strokePts([[-12, 16], [12, 15]], 'rgba(140,128,104,0.6)', 1.1);
        strokePts([[4, 34], [6, 60]], 'rgba(120,80,60,0.25)', 1);
        hatch([[-14, 24], [-3, 24], [-3, 74], [-14, 74]], 0.9, 3.8, 0.22);
      } };
    };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: N_TORSO, base: GILET, seed: 9501, paint: () => {
        fillPts([[4, -186], [20, -172], [31, -152], [26, -134], [14, -146], [6, -168]], CHEM);         // col de chemise et cravate
        fillPts([[24, -150], [34, -140], [30, -130], [36, -120], [28, -112], [22, -128]], '#f6f2e6');   // jabot
        strokePts([[22, -140], [33, -104], [36, -50], [37, 10], [42, 44]], GILETD, 2);
        for (let y = -124; y <= 34; y += 16) { dot(33.5, y, 2.5, LAIT); dot(33, y - 0.8, 1, LAITL); }
        for (const y of [-104, -86]) { fillPts(rect(6, y, 30, y + 7), GILETD); strokePts([[6, y], [30, y]], 'rgba(220,230,190,0.35)', 1); }
        hatch([[-56, -170], [-14, -170], [-12, 50], [-56, 50]], 0.75, 4.2, 0.3); shade(40, 0, -40, 0, 0.26);
      } },
      legB: legDef([-6, -2], 9502, true),
      legF: legDef([6, -2], 9503, false),
      armB_up: upDef(SH_B, CHEMD, 9504),
      armB_lo: foreDef('armB_up', PEAUD, '#bdb39c', true, 9505),
      head: { parent: 'torso', at: [6, -170], pts: N_HEAD, base: PEAU, seed: 9506, noRivet: true, paint: (p) => {
        const f = p.face || {};
        X.earPaint(-8, -42);
        hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.26);
        dot(16, -30, 8, 'rgba(205,130,110,0.18)');
        strokePts([[30, -40], [36, -36]], 'rgba(120,70,50,0.5)', 1.2);                               // aile du nez
        strokePts([[6, -46], [10, -40]], 'rgba(90,50,40,0.35)', 1); strokePts([[22, -16], [26, -22]], 'rgba(120,70,50,0.35)', 1);
        X.brow(f, 18, -62, 'rgba(70,62,56,0.97)', 3.6); X.eye(f, 18, -52); X.mouth(f, 27, -26);
        strokePts([[28, -84], [-36, -78]], '#2a2420', 3);                                              // bandeau de la loupe
      } },
      cheveux: { parent: 'head', at: [0, 0], noRivet: true, pts: N_HAIR, base: CHEV, seed: 9507, paint: () => {
        for (let i = 0; i < 9; i++) strokePts([[20 - i * 6, -96 + i * 1.5], [-6 - i * 4, -72 + i * 5]], CHEVD, 1);
        for (const [cx, cy] of [[-22, -66], [-24, -51]]) { fillPts(ell(cx, cy, 14, 6.5, 14), CHEVL); strokePts(ep(cx, cy, 14, 6.5, 10, 0.3, 3.0), CHEVD, 1.3); strokePts(ep(cx + 12, cy, 3, 3, 6, 0, TAU), CHEVD, 1); }
        strokePts([[28, -84], [-44, -76]], '#2a2420', 3);
        hatch(null, 0.9, 3.6, 0.18, 1, '40,36,30', [-50, -110, 30, -10]);
      } },
      queue: { parent: 'head', at: [-34, -26], rest: 0.14, noRivet: true, pts: N_QUEUE, base: CHEV, seed: 9508, paint: () => {
        for (const x of [-4, 0, 4]) strokePts([[x, -4], [x * 0.6, 56]], CHEVD, 1); hatch(null, 1.2, 3.4, 0.2); } },
      ruban: { parent: 'queue', at: [0, 10], noRivet: true, pts: N_RUBAN, base: '#18171a', seed: 9509, paint: () => strokePts([[-14, -8], [-4, -2]], 'rgba(255,255,255,0.3)', 1.2) },
      loupe: { parent: 'head', at: [0, 0], noRivet: true, pts: tf(LOUPE, [24, -78], 1.05), base: LAIT, seed: 9510, paint: () => {
        const T = (pts) => tf(pts, [24, -78], 1.05);
        fillPts(T([[-13, -22], [13, -22], [13, -27], [-13, -27]]), LAITD);
        fillPts(T(ell(0, -26, 10, 3.5, 12)), 'rgba(190,225,235,0.9)');
        for (const y of [-6, -13]) strokePts(T([[-11, y], [11, y]]), LAITD, 1.3);
        strokePts(T([[-6, 0], [-9, -22]]), LAITL, 1.8);
      } },
      cordon: { parent: 'torso', at: [0, 0], noRivet: true, pts: N_CORDON, base: TABLIERD, seed: 9511 },
      noeud: { parent: 'torso', at: [0, 0], noRivet: true, pts: N_NOEUD, base: TABLIERD, seed: 9512, paint: () => hatch(null, 1.2, 3.4, 0.2) },
      tablier: { parent: 'torso', at: [0, 0], noRivet: true, pts: N_TABLIER, base: TABLIER, seed: 9513, paint: () => {
        hatch(null, 1.3, 4.6, 0.18);
        for (const [x, y, rx, ry] of [[20, 70, 10, 6], [36, 104, 7, 5], [10, 20, 6, 4]]) fillPts(ell(x, y, rx, ry, 10), 'rgba(40,22,8,0.22)');
        fillPts(rect(14, -32, 46, 6), TABLIERD);                                                    // poche
        for (let x = 16; x < 46; x += 5) dot(x, -30, 0.9, 'rgba(240,210,160,0.6)');
        fillPts(rect(20, -50, 25, -32), '#6a4a2a'); fillPts(rect(19, -36, 26, -31), LAIT);          // manche d'outil
        fillPts(rect(32, -44, 35, -32), '#3a3a3a');                                                 // pointe de compas
        strokePts([[-4, -60], [-1, 40], [4, 140]], 'rgba(230,190,140,0.35)', 1.2);
        shade(10, -60, 50, 140, 0.25, [-10, -70, 60, 145]);
      } },
      bouleR: { parent: 'torso', at: [0, 0], noRivet: true, base: '#000', seed: 9514, pts: OFFP, extra: (p) => {
        if (!p._bR) return; const c = cx_(); c.save(); c.translate(p._bR.c[0], p._bR.c[1]); drawBoulette(p._bR.o); c.restore(); } },
      armF_up: upDef(SH_F, CHEM, 9515),
      armF_lo: foreDef('armF_up', PEAU, CHEM, false, 9516),
      souffle: { parent: 'head', at: [44, -26], noRivet: true, base: '#000', seed: 9517, pts: OFFP, extra: (p) => {
        const k = clamp(((p.soupir || 0) - 0.4) / 0.6); if (k <= 0 || SIL()) return; const c = cx_(), u = ((p.t || 0) * 0.7) % 1;
        c.save(); c.globalAlpha = 0.75 * k * (1 - u * 0.6);
        for (let i = 0; i < 3; i++) { const r = 5 + i * 3 + u * 6; c.beginPath(); c.arc(8 + i * 11 + u * 14, 8 + i * 4 + u * 6, r, 0, TAU); c.fillStyle = 'rgba(248,246,240,0.9)'; c.fill(); c.strokeStyle = 'rgba(150,145,135,0.7)'; c.lineWidth = 1.2 * (M._lw ? M._lw() : 1); c.stroke(); }
        c.restore(); } },
    };
    Object.assign(parts, heldParts(PEAU, PEAUD, 9530));
    return { nom: 'Nairne', hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] },
      order: ['armB_up', 'armB_lo', 'objetB', 'doigtsB', 'legB', 'legF', 'head', 'torso', 'cheveux', 'loupe', 'queue', 'ruban', 'noeud', 'cordon', 'tablier', 'bouleR', 'armF_up', 'armF_lo', 'objet', 'doigts', 'souffle'] };
  }
  CH.gomNairne = mkNairne();

  // ---- gestes (réglages 0..1 ; cible / cibleB en coordonnées ÉCRAN)
  const ROT_CRAYON = -0.55;
  GOM.nairnePose = function (p, x, y, s, dir) {
    const q = prep(p), A = q.ang, t = q.t || 0, def = CH.gomNairne; x = x || 0; y = y || 0; s = s || 0.9; dir = dir || 1;
    const k = (n) => ease(clamp(q[n] === true ? 1 : (+q[n] || 0)));
    if (A.armF_lo == null) A.armF_lo = -0.14; if (A.armB_lo == null) A.armB_lo = -0.14;
    if (A.armF_up == null) A.armF_up = -0.04; if (A.armB_up == null) A.armB_up = -0.02;
    marche(q, k('marche'), t);
    const so = k('soupir'); if (so > 0) {
      A.head = (A.head || 0) + 0.26 * so; q.tilt = (q.tilt || 0) + 0.025 * so; q.dy = (q.dy || 0) + 5 * so;
      A.armF_up += 0.06 * so; A.armB_up += 0.05 * so; A.armF_lo += 0.08 * so; A.armB_lo += 0.08 * so;
      faceDef(q, so, { eyes: 'closed', brow: 'worry', mouth: 'o' });
    }
    const de = k('dessine'); if (de > 0) {
      if (q.tenu == null) q.tenu = 'crayon';
      if (q.tenu === 'crayon') A.objet = (A.objet || 0) + ROT_CRAYON;
      const T = cibleT(def, q, q.cible, x, y, s, dir, q.tenu === 'crayon' ? offsetObj('crayon', q.tenuO, 'pointe', ROT_CRAYON) : null, [92, -100]);
      armTo(q, 'armF', [T[0] + 4 * Math.sin(t * 13), T[1] + 2 * Math.sin(t * 29)], de);
      armTo(q, 'armB', q.cibleB ? cibleT(def, q, q.cibleB, x, y, s, dir, null) : [52, -64], de); if (q.cibleB && q.handB == null) q.handB = 'open';
      A.head = (A.head || 0) + 0.16 * de; faceDef(q, de, { mouth: 'tight' });
    }
    const ch = k('cherche'); if (ch > 0) {
      const ph = t * 9;
      armTo(q, 'armF', [28 + 2 * Math.sin(ph), -94 + 7 * Math.abs(Math.sin(ph))], ch);
      armTo(q, 'armB', [46, -78 + 7 * Math.abs(Math.sin(ph + 1.6))], ch);
      if (q.handF == null) q.handF = 'open'; if (q.handB == null) q.handB = 'open';
      A.head = (A.head || 0) + 0.24 * ch; faceDef(q, ch, { brow: 'worry', mouth: 'tight' });
    }
    const gr = k('gratte'); if (gr > 0) {
      const w = Math.sin(t * 16);
      armTo(q, 'armF', [-16 + 3 * w, -252 + 4 * w], gr); if (q.handF == null) q.handF = 'open';
      A.head = (A.head || 0) - 0.06 * gr; faceDef(q, gr, { brow: 'worry', mouth: 'tight' });
    }
    const pr = k('prend'); if (pr > 0) {
      const T = cibleT(def, q, q.cible, x, y, s, dir, null, [104, -96]);
      armTo(q, 'armF', T, pr); if (q.handF == null) q.handF = has(q.tenu) || (q.prise || 0) > 0.5 ? 'fist' : 'open';
      q.tilt = (q.tilt || 0) + 0.04 * pr; A.head = (A.head || 0) + 0.16 * pr;
    }
    const fr = k('frotte'); if (fr > 0) {
      if (q.tenu == null) q.tenu = 'boulette';
      const amp = q.amp == null ? 12 : q.amp;
      const T = cibleT(def, q, q.cible, x, y, s, dir, has(q.tenu) ? offsetObj(q.tenu, q.tenuO, 'contact', 0) : null, [96, -100]);
      armTo(q, 'armF', [T[0] + amp * Math.sin(t * 15), T[1] + 2 * Math.sin(t * 30)], fr);
      armTo(q, 'armB', q.cibleB ? cibleT(def, q, q.cibleB, x, y, s, dir, null) : [52, -64], fr); if (q.cibleB && q.handB == null) q.handB = 'open';
      A.head = (A.head || 0) + 0.16 * fr; faceDef(q, fr, { mouth: 'tight' });
    }
    const ro = k('rouler'); if (ro > 0) {
      const bo = Object.assign({ taille: 78, etat: 'fraiche' }, q.bouleO || {}), rb = bo.taille / 2, w = Math.sin(t * 9);
      const C = [84, -112];
      armTo(q, 'armB', [C[0] - rb * 0.8, C[1] + 14 - 7 * w], ro);
      armTo(q, 'armF', [C[0] + rb * 0.8, C[1] + 14 + 7 * w], ro);
      if (q.handF == null) q.handF = 'open'; if (q.handB == null) q.handB = 'open';
      bo.roule = (bo.roule || 0) + t * 4;
      if (ro > 0.5) q._bR = { c: [C[0], C[1] + 2 * w], o: bo };
      A.head = (A.head || 0) + 0.2 * ro; faceDef(q, ro, { mouth: 'smile' });
    }
    const mo = k('montre'); if (mo > 0) {
      if (q.tenu == null) q.tenu = 'boulette';
      armTo(q, 'armF', q.cible ? cibleT(def, q, q.cible, x, y, s, dir, null) : [130, -150], mo);
      armTo(q, 'armB', [50, -66], mo);
      A.head = (A.head || 0) - 0.05 * mo; faceDef(q, mo, { mouth: 'smile', brow: 'up' });
    }
    return finish(q);
  };
  GOM.nairne = (pose, x, y, s, o) => { s = s == null ? 0.9 : s; const dir = (o && o.dir) || 1; return run(CH.gomNairne, GOM.nairnePose(pose, x, y, s, dir), x, y, s, o); };

  // ================================================================== ACCESSOIRES SEULS
  const accDefs = {};
  function accDef(name, fn, rod) { const k = name + (rod ? '_t' : ''); return accDefs[k] || (accDefs[k] = { nom: name, hipY: 0, handLen: 10, rod: rod || null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => fn(p.o) } }, order: ['o'] }); }
  function accDraw(name, draw, x, y, s, o, sDef) {
    o = o || {}; s = s == null ? (sDef || 0.9) : s;
    return M.puppet(accDef(name, draw), { o, tilt: o.rot || 0 }, x, y, s, { dir: o.dir || 1, rod: false, slot: o.slot != null ? o.slot : y + 6 * s, floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
  }
  for (const n of Object.keys(OBJ)) GOM[n] = (x, y, s, o) => accDraw(n, (oo) => { const ob = OBJ[n], b = baseOf(ob, oo), c = cx_(); c.save(); c.translate(-b[0], -b[1]); ob.draw(oo); c.restore(); }, x, y, s, Object.assign({ t: 0 }, o || {}));
  // fil de caoutchouc élastique entre deux points écran (cube collé à la feuille) ; o : { e (épaisseur px, 7), k 0..1 tension (1 = tendu) }
  GOM.fil = function (a, b, o) {
    o = o || {}; const e = o.e || 7, k = o.k == null ? 0.6 : clamp(o.k), mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 + (1 - k) * 18;
    pc(ribbonW(qbez(a, [mx, my], b, 12), (u) => e * (0.45 + 0.55 * Math.abs(1 - 2 * u)) * (0.6 + 0.4 * (1 - k))), CAOUL, null, 8350, { texA: 0.3 });
  };

  // ---- PLANCHE À DESSIN sur tréteau + feuille (dessin d'une lunette astronomique de face). (x,y) = sol sous le tréteau
  const PDY = 58, PLP = { centre: [0, -305], trait: [0, -296], traitA: [-132, -388], traitB: [132, -204], coin: [150, -420], oculaire: [-104, -242], objectif: [112, -382], rebord: [0, -172], chandelle: [-150, -528], sol: [0, 0] };
  const FAUTE = [[-132, -446], [-96, -418], [-64, -396], [-30, -380], [0, -352], [34, -334], [70, -302], [104, -288], [132, -262]];
  function telescope() {
    const E = [-104, -300], O = [92, -424], L = Math.hypot(O[0] - E[0], O[1] - E[1]), u = [(O[0] - E[0]) / L, (O[1] - E[1]) / L], n = [-u[1], u[0]];
    const P_ = (s, w) => [E[0] + u[0] * s + n[0] * w, E[1] + u[1] * s + n[1] * w];
    const tube = [P_(0, -9), P_(L, -15), P_(L, 15), P_(0, 9)];
    strokePts(tube.concat([tube[0]]), GRAPH, 2.6);
    strokePts([P_(L, -17), P_(L + 30, -18), P_(L + 30, 18), P_(L, 17)], GRAPH, 2.4);              // pare-buée
    const oc = P_(L + 30, 0), ang = Math.atan2(n[1], n[0]);
    strokePts(ell(0, 0, 18, 6, 18).map((p) => [oc[0] + p[0] * Math.cos(ang) - p[1] * Math.sin(ang), oc[1] + p[0] * Math.sin(ang) + p[1] * Math.cos(ang)]).concat([[oc[0] + 18 * Math.cos(ang), oc[1] + 18 * Math.sin(ang)]]), GRAPH, 1.6);
    strokePts([P_(0, -5), P_(-20, -5), P_(-20, 5), P_(0, 5)], GRAPH, 1.6);                          // oculaire
    for (const s of [L * 0.3, L * 0.55, L * 0.8]) strokePts([P_(s, -12), P_(s, 12)], GRAPH, 1.2);
    strokePts([P_(L * 0.35, -26), P_(L * 0.72, -28)], GRAPH, 1.4); strokePts([P_(L * 0.35, -20), P_(L * 0.72, -21)], GRAPH, 1.4);   // chercheur
    for (const s of [L * 0.42, L * 0.64]) strokePts([P_(s, -20), P_(s, -12)], GRAPH, 1.2);
    for (let s = 10; s < L; s += 9) strokePts([P_(s, 10), P_(s + 6, 13)], 'rgba(60,60,68,0.5)', 1);   // ombre hachée
    const Mt = P_(L * 0.48, 14);
    strokePts([Mt, [Mt[0] - 4, Mt[1] + 16]], GRAPH, 2);
    const F = [Mt[0] - 4, Mt[1] + 16];
    for (const pt of [[-70, -256], [-2, -252], [56, -260]]) strokePts([F, pt], GRAPH, 2.2);
    strokePts([[F[0] - 30, F[1] + 30], [F[0] + 26, F[1] + 30]], 'rgba(60,60,68,0.6)', 1.1);
    strokePts([P_(-30, 0), P_(L + 50, 0)], 'rgba(90,90,100,0.35)', 1);                                  // axe de construction
    strokePts(ell(-108, -432, 20, 20, 20).concat([[-88, -432]]), GRAPH, 1.4);                          // détail : coupe de la lentille
    strokePts(ep(-108, -432, 8, 20, 10, -PI / 2, PI / 2), GRAPH, 1.2); strokePts(ep(-108, -432, 8, 20, 10, PI / 2, PI * 1.5), GRAPH, 1.2);
    strokePts([[-140, -404], [-76, -404]], 'rgba(60,60,68,0.6)', 1); strokePts([[-140, -408], [-140, -400]], 'rgba(60,60,68,0.6)', 1); strokePts([[-76, -408], [-76, -400]], 'rgba(60,60,68,0.6)', 1);
  }
  function drawPlanche(o) {
    const etat = o.etat || 'faute';
    const trait = o.trait != null ? clamp(o.trait) : (etat === 'faute' ? 1 : etat === 'tache' ? 0.3 : 0);
    const tache = o.tache != null ? clamp(o.tache) : (etat === 'tache' ? 1 : 0);
    const dech = o.dechire != null ? !!o.dechire : etat === 'tache';
    const BOIS = '#7a5432', BOISD = '#553821';
    pc(ribbonW([[0, -330], [12, 0]], 12), BOISD, null, 8601);
    pc(ribbonW([[-128, -156], [-156, 0]], 15), BOIS, () => hatch(null, 1.5, 4, 0.2), 8602);
    pc(ribbonW([[128, -156], [156, 0]], 15), BOIS, () => hatch(null, 1.5, 4, 0.2), 8603);
    pc(ribbonW([[-142, -84], [142, -84]], 10), BOISD, null, 8604);
    const cP = cx_(); cP.save(); cP.translate(0, PDY);
    pc([[-172, -500, 1], [172, -500, 1], [186, -226, 1], [-186, -226, 1]], '#b08a5a', () => {
      for (let y = -490; y < -226; y += 17) strokePts([[-186, y], [-60, y + 3], [60, y - 2], [186, y + 2]], 'rgba(110,70,30,0.3)', 1.1);
      shade(0, -500, 0, -226, 0.25, [-190, -505, 190, -220]);
    }, 8605);
    pc(rect(-192, -230, 192, -210), BOISD, () => strokePts([[-190, -228], [190, -228]], 'rgba(255,220,170,0.4)', 1.3), 8606);
    let sh = [[-150, -478, 1], [150, -478, 1], [158, -248, 1], [-158, -248, 1]];
    if (dech) sh = [[-150, -478, 1], [100, -478], [108, -470], [116, -474], [124, -462], [134, -462], [140, -450], [152, -444], [151, -430], [158, -248, 1], [-158, -248, 1]];
    pc(sh, '#efe8d4', () => {
      telescope();
      if (tache > 0) for (let i = 0; i < FAUTE.length; i++) { const [px, py] = FAUTE[i]; fillPts(ell(px + 4, py + 2, 30, 20, 12), `rgba(105,105,112,${0.24 * tache})`); fillPts(ell(px + 14, py + 10, 18, 9, 10), `rgba(90,90,98,${0.16 * tache})`); }
      if (trait > 0.01) { const a = trait; strokePts(FAUTE, `rgba(36,36,42,${0.95 * a})`, 8); strokePts(FAUTE.map((p) => [p[0] + 2, p[1] - 3]), `rgba(70,70,80,${0.7 * a})`, 3); strokePts(FAUTE.map((p) => [p[0] - 1, p[1] + 2]), `rgba(150,150,160,${0.45 * a})`, 1.2); }
      const mi = clamp(o.miettes || 0); if (mi > 0) { const R = M.rng(8620); for (let i = 0; i < 26 * mi; i++) { const q = FAUTE[Math.floor(R() * FAUTE.length)]; const x = q[0] + (R() - 0.5) * 60, y = q[1] + (R() - 0.5) * 40; fillPts(ell(x, y, 3.2, 2.4, 7), '#8f7a52'); fillPts(ell(x, y, 2.4, 1.7, 7), MIE); } }
      shade(-150, -480, 150, -250, 0.12, [-160, -480, 160, -246]);
    }, 8607, { texA: 0.5 });
    if (dech) pc([[100, -478], [152, -444], [130, -446], [118, -456]], '#ddd4bc', () => shade(100, -478, 150, -444, 0.3), 8608);
    if (o.chandelle !== false) {
      pc(ribbonW([[-162, -498], [-150, -540]], 7), LAITD, null, 8610);
      pc(ell(-150, -541, 15, 4.5, 12), LAIT, null, 8611);
      pc(rect(-157, -584, -143, -543), '#efe6cc', () => { strokePts([[-148, -580], [-148, -546]], 'rgba(255,255,255,0.6)', 1.2); fillPts([[-157, -584], [-150, -580], [-143, -584], [-143, -578], [-157, -578]], '#f8f2e0'); }, 8612);
      strokePts([[-150, -584], [-150, -590]], '#2a2420', 1.6);
    }
    cP.restore();
  }
  GOM.PLANCHE = PLP;
  GOM.planchePt = (nom, x, y, s) => { s = s == null ? 1 : s; const q = PLP[nom] || [0, 0]; return [x + s * q[0], y + s * q[1]]; };
  // o : etat 'faute'|'tache'|'propre' ; trait 0..1, tache 0..1, dechire, miettes 0..1 (remplacent l'état) ; chandelle (true) ; t ; courant (instant : la flamme vacille)
  GOM.planche = function (x, y, s, o) {
    o = o || {}; s = s == null ? 1 : s;
    const r = M.puppet(accDef('planche', drawPlanche), { o, tilt: 0 }, x, y, s, { dir: 1, rod: false, slot: y + 6, floorShadow: false, cast: o.cast, alpha: o.alpha });
    if (o.chandelle !== false && !SIL()) {
      const t = o.t || 0, f = GOM.planchePt('chandelle', x, y, s), c = cx_();
      let lean = 0, sq = 1; if (o.courant != null && t > o.courant) { const u = t - o.courant; lean = 0.55 * Math.sin(u * 9) * Math.exp(-1.4 * u) - 0.25 * Math.exp(-2.5 * u); sq = 1 - 0.3 * Math.exp(-2 * u) * Math.abs(Math.sin(u * 11)); }
      c.save(); c.translate(f[0], f[1]); c.rotate(lean); c.scale(1, sq); c.translate(-f[0], -f[1]);
      M.flamme(t, { x: f[0], y: f[1], s: 0.9 * s, r: 110, seed: 5 }); c.restore();
    }
    return r;
  };

  // ================================================================== LA SOURIS DE L'ATELIER (≈ 150 de long à s 1, sans la queue)
  const SOU = '#8A8580', SOUD = '#6c6864', SOUL = '#aaa59e', ROSE = '#efc4c0', ROSED = '#c9908c';
  function sourisTete(o, H, rot, t, pose) {
    const c = cx_(); c.save(); c.translate(H[0], H[1]); c.rotate(rot);
    const tw = pose === 'renifle' ? Math.sin(t * 34) * 1.6 : pose === 'grignote' ? Math.sin(t * 22) * 1.2 : 0;
    const droop = pose === 'vexee';
    // oreille lointaine
    const earF = droop ? tf(ell(0, 0, 17, 9, 14), [-20, -6], 0.7) : ell(-14, -30, 16, 18, 14);
    pc(earF, SOUD, () => fillPts(droop ? tf(ell(0, 0, 11, 5, 12), [-20, -6], 0.7) : ell(-13, -30, 10, 12, 12), ROSED), 8701);
    const hd = [[-24, -4], [-20, -18], [-6, -26], [12, -22], [28, -12], [42, -1 + tw * 0.3], [47, 4 + tw * 0.3, 1], [42, 10], [26, 14], [6, 16], [-12, 13], [-24, 6]];
    pc(hd, SOU, () => {
      fillPts([[20, 6], [40, 4], [44, 10], [26, 14]], SOUL);
      if (o.yeux === 'fermes' || droop) strokePts(ep(13, -8, 5, 3, 6, 0.1, PI - 0.1).map((p) => [p[0], p[1] - 2]), '#141012', 2);
      else { dot(13, -8, 5, '#141012'); dot(14.6, -10, 1.7, '#ffffff'); }
      if (pose === 'grignote') strokePts([[34, 10], [40, 9 + 2 * Math.abs(Math.sin(t * 22))]], '#3a2a2a', 1.4);
      else strokePts([[33, 10], [39, 9]], '#3a2a2a', 1.2);
      hatch([[-24, -10], [0, -10], [0, 16], [-24, 16]], 0.8, 3.4, 0.22);
    }, 8702);
    dot(47, 4 + tw * 0.3, 3.4, ROSED);
    if (!SIL()) { const q = pose === 'renifle' ? Math.sin(t * 40) * 0.09 : Math.sin(t * 3) * 0.03; for (const [a, l] of [[-0.25, 30], [0, 32], [0.25, 28]]) strokePts([[40, 5], [40 + l * Math.cos(a + q), 5 + l * Math.sin(a + q)]], 'rgba(40,36,34,0.75)', 1); }
    // oreille proche
    const earN = droop ? tf(ell(0, 0, 20, 10, 14), [-14, 0], 0.55) : ell(-2, -32, 18, 20, 14);
    pc(earN, SOU, () => fillPts(droop ? tf(ell(0, 0, 13, 6, 12), [-13, 0], 0.55) : ell(-1, -31, 12, 14, 12), ROSE), 8703);
    c.restore();
  }
  function sourisTient(o, P_) {
    const ti = o.tient || 'rien'; if (!has(ti)) return;
    if (ti === 'miette') { pc(ell(P_[0], P_[1] - 6, 9, 7, 10), MIE, () => dot(P_[0] - 2, P_[1] - 7, 1.4, 'rgba(165,132,82,0.6)'), 8710); return; }
    if (ti === 'boulette') { const oo = Object.assign({ taille: 30 }, o.tientO || {}), c = cx_(); c.save(); c.translate(P_[0], P_[1] - oo.taille * 0.38); drawBoulette(oo); c.restore(); }
  }
  function drawSouris(o) {
    const t = o.t || 0, pose = o.pose || 'trottine', c = cx_();
    const assis = pose === 'assise' || pose === 'grignote' || pose === 'vexee';
    if (!assis) {
      const tr = pose === 'trottine', bob = tr ? -Math.abs(Math.sin(t * 14)) * 3 : 0, st = pose === 'renifle' ? 1 : 0, ph = t * 14;
      const wave = Math.sin(t * 5) * 6;
      pc(ribbonW(qbez([-54, -26 + bob], [-110, -2 + wave], [-176, -16 - wave * 0.6], 14), (u) => lerp(7, 1.6, u)), ROSED, null, 8720);
      for (const [lx, sg, col, seed] of [[-30, -1, SOUD, 8721], [24, 1, SOUD, 8722]]) { const sw = tr ? Math.sin(ph) * 7 * sg : 0; pc([[lx - 6, -22 + bob], [lx + 6, -22 + bob], [lx + 4 + sw, -2], [lx + 14 + sw, 0, 1], [lx - 4 + sw, 0, 1]], col, null, seed); }
      const B = ell(-8 + st * 4, -32 + bob + st * 4, 52 + st * 6, 28 - st * 4, 22).map((p) => [p[0], p[1] - (p[0] < -10 && p[1] < -32 ? 5 : 0)]);
      pc(B, SOU, () => { fillPts(ell(-8, -14 + bob, 40, 10, 14), SOUL); hatch([[-62, -60], [-10, -60], [-10, 0], [-62, 0]], 0.8, 4, 0.25); shade(-8, -60, -8, 0, 0.25, [-70, -70, 60, 4]); }, 8723);
      pc([[-44, -40 + bob], [-20, -36 + bob], [-18, -14 + bob], [-28, -8 + bob], [-46, -16 + bob]], SOU, () => hatch(null, 0.9, 3.6, 0.25), 8724);
      for (const [lx, sg, seed] of [[-24, 1, 8725], [30, -1, 8726]]) { const sw = tr ? Math.sin(ph) * 7 * sg : 0; pc([[lx - 6, -18 + bob], [lx + 6, -18 + bob], [lx + 4 + sw, -2], [lx + 15 + sw, 0, 1], [lx - 4 + sw, 0, 1]], SOU, () => fillPts(rect(lx - 6 + sw, -4, lx + 16 + sw, 2), ROSE), seed); }
      sourisTete(o, [44 + st * 10, -40 + bob - st * 4], st ? -0.16 : 0.04 * Math.sin(t * 4), t, pose);
      return;
    }
    const vx = pose === 'vexee', gn = pose === 'grignote';
    const tailC = vx ? qbez([-26, -6], [-90, -1], [-162, -2], 14) : qbez([-26, -8], [-96, 2], [-138, -18 + 4 * Math.sin(t * 2.4)], 14);
    pc(ribbonW(tailC, (u) => lerp(7, 1.6, u)), ROSED, null, 8730);
    const B = tf(ell(0, 0, 30, 46, 22).map((p) => [p[1] > 0 ? p[0] * 1.12 : p[0], p[1]]), [-4, -50], vx ? -0.42 : -0.3);
    pc(B, SOU, () => { fillPts(tf(ell(10, 6, 14, 32, 14), [-4, -50], -0.3), SOUL); hatch([[-40, -100], [-8, -100], [-8, 0], [-40, 0]], 0.8, 4, 0.25); shade(-30, -90, 20, -10, 0.25, [-50, -110, 40, 4]); }, 8731);
    pc([[-30, -30], [-6, -36], [10, -24], [8, -6], [-26, -6]], SOU, () => hatch(null, 0.9, 3.6, 0.25), 8732);
    pc([[-6, -10], [30, -8], [34, -2, 1], [30, 0, 1], [-8, 0, 1]], SOU, () => fillPts(rect(8, -4, 36, 2), ROSE), 8733);
    const nib = gn ? Math.sin(t * 12) * 0.06 : 0;
    const H = vx ? [-2, -100] : [8, -100], rot = vx ? -0.5 : gn ? 0.28 + nib : 0.12;
    const paw = vx ? [12, -54] : gn ? [26, -80 + 3 * Math.sin(t * 12)] : [24, -66];
    if (!vx) sourisTient(o, paw);
    sourisTete(o, H, rot, t, pose);
    for (const dx of [-3, 3]) pc(ribbonW([[6 + dx * 0.5, -76], [paw[0] + dx, paw[1]]], 8), SOU, () => dot(paw[0] + dx, paw[1], 3.5, ROSE), 8740 + dx);
    if (gn && !SIL()) { for (let i = 0; i < 3; i++) { const u = ((t * 1.3 + i / 3) % 1); dot(paw[0] + 6 + i * 4, paw[1] + 8 + u * (-paw[1] - 6), 2.2 * (1 - u * 0.4), MIE); } }
  }
  // o : pose 'trottine'|'assise'|'grignote'|'renifle'|'vexee' ; tient 'miette'|'boulette'|'rien' ; tientO (options de la boulette) ; yeux 'fermes' ; t ; dir ; tige (défaut : y > 1360) ; slot ; cast ; rot
  GOM.souris = function (x, y, s, o) {
    o = Object.assign({ t: 0 }, o || {}); s = s == null ? 0.95 : s;
    const tige = o.tige == null ? y > 1360 : !!o.tige;
    const def = accDef('souris', drawSouris, { part: 'o', at: [-6, -28] });
    return M.puppet(def, { o, tilt: o.rot || 0 }, x, y, s, { dir: o.dir || 1, rod: tige, slot: o.slot != null ? o.slot : (y >= 1400 ? M.ST.slotF : M.ST.slotB), floorShadow: o.ombre != null ? !!o.ombre : tige, cast: o.cast, alpha: o.alpha });
  };

  // ================================================================== BOUTIQUE-ATELIER DE NAIRNE (Londres, vers 1770)
  const W = 1080, SB = M.ST.back, HB = SB + 5;
  const AT = {
    vitrine: { x0: 500, x1: 860, y0: 300, y1: 760, rebord: 788 },
    horloge: { x: 400, y: 300 },
    etageres: [{ x0: 96, x1: 330, y: 520 }, { x0: 96, x1: 420, y: 700 }],
    barometre: { x: 950, y0: 320, y1: 680 },
    machine: { x: 925, y: 1000, disque: [925, 895] },
    planche: { x: 310, y: SB },
    table: { x: 835, y: 1190, x0: 715, x1: 955 },
    miche: { x: 780, y: 1190 },
    theiere: { x: 867, y: 1142 },
    comptoir: { x: 590, y: 1165, x0: 410, x1: 770 },
    trou: { x: 240, y: SB, w: 54, h: 42 },
  };
  GOM.AT = AT;
  const VW = AT.vitrine.x1 - AT.vitrine.x0, VH = AT.vitrine.y1 - AT.vitrine.y0;
  function brique(c, x0, y0, x1, y1, seed, cols) { const R = M.rng(seed); for (let y = y0, row = 0; y < y1; y += 9, row++) for (let x = x0 - (row % 2 ? 10 : 0); x < x1; x += 20) { c.fillStyle = cols[Math.floor(R() * cols.length)]; c.fillRect(x + 1, y + 1, 18, 7); } }
  function makeVue(kind) {
    return M.pre(VW, VH, (c) => {
      const g = c.createLinearGradient(0, 0, 0, VH);
      if (kind === 'soleil') { g.addColorStop(0, '#e2903e'); g.addColorStop(0.55, '#f2c272'); g.addColorStop(1, '#f6dca0'); }
      else if (kind === 'neige') { g.addColorStop(0, '#8e9aaa'); g.addColorStop(1, '#d4dae0'); }
      else { g.addColorStop(0, '#aebcc4'); g.addColorStop(1, '#e6e2d4'); }
      c.fillStyle = g; c.fillRect(0, 0, VW, VH);
      const far = kind === 'soleil' ? '#b9886a' : kind === 'neige' ? '#9ea4ae' : '#a8a8a4';
      fillPts([[-4, 300, 1], [-4, 236], [40, 226], [70, 240], [120, 220], [170, 232], [300, 222], [VW + 4, 238], [VW + 4, 300, 1]], far, 3, 0.3);
      // tour lointaine à lanternon
      fillPts(rect(222, 96, 262, 300), kind === 'soleil' ? '#a87a5c' : '#9c968a');
      fillPts(rect(216, 90, 268, 100), '#7e786e'); fillPts(rect(230, 62, 254, 92), '#9c968a');
      for (const x of [234, 242, 250]) fillPts(rect(x, 68, x + 4, 88), '#4a4a50');
      fillPts(ep(242, 62, 14, 12, 10, PI, TAU).concat([[256, 62]]), '#8a8478'); strokePts([[242, 50], [242, 28]], '#5a5650', 2.4); dot(242, 26, 3, LAITD);
      for (const y of [140, 190, 240]) fillPts(rect(234, y, 250, y + 22), '#4a4a50');
      // façades de briques à pignons, de l'autre côté de la rue
      const cols = kind === 'soleil' ? ['#a65a38', '#b8673e', '#94502f'] : ['#8a4a32', '#7a3e2a', '#94553a', '#6e3826'];
      const H = [[-10, 116, 230, 160], [116, 214, 262, 0], [214, 370, 214, 150]];
      for (const [x0, x1, top, gab] of H) {
        const mx = (x0 + x1) / 2, poly = gab ? [[x0, VH], [x0, top], [mx, top - 58], [x1, top], [x1, VH]] : [[x0, VH], [x0, top], [x1, top], [x1, VH]];
        c.save(); c.beginPath(); poly.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.clip(); brique(c, x0, top - 70, x1, VH, x0 + 900, cols); c.restore();
        strokePts(poly, 'rgba(40,20,10,0.5)', 1.4);
        if (gab) { strokePts([[x0 - 3, top + 2], [mx, top - 58], [x1 + 3, top + 2]], '#d8d0c0', 4); fillPts(rect(mx - 30, top - 74, mx - 18, top - 40), '#6e3826'); fillPts(rect(mx - 32, top - 78, mx - 16, top - 72), '#5a3a2a'); }
        else { fillPts(rect(x0, top - 6, x1, top + 4), '#d8d0c0'); fillPts(rect(x0 + 20, top - 34, x0 + 34, top - 6), '#6e3826'); }
        const nw = Math.max(1, Math.round((x1 - x0) / 56));
        for (let i = 0; i < nw; i++) for (const wy of [top + 24, top + 104]) {
          const wx = x0 + (x1 - x0) * (i + 0.5) / nw - 14;
          fillPts(rect(wx, wy, wx + 28, wy + 50), kind === 'soleil' ? '#5a3a30' : '#3a4048'); strokePts([[wx + 14, wy], [wx + 14, wy + 50]], '#e8e2d4', 1.5); strokePts([[wx, wy + 25], [wx + 28, wy + 25]], '#e8e2d4', 1.5);
          fillPts(rect(wx - 3, wy + 50, wx + 31, wy + 54), '#d8d0c0');
          if (kind === 'neige') fillPts(rect(wx - 3, wy + 46, wx + 31, wy + 51), '#f6f8fa');
        }
        if (kind === 'neige') { if (gab) fillPts(ribbonW([[x0 - 3, top], [mx, top - 60], [x1 + 3, top]], 7), '#f6f8fa'); else fillPts(rect(x0, top - 10, x1, top - 3), '#f6f8fa'); }
      }
      fillPts(rect(-4, 418, VW + 4, VH), kind === 'neige' ? '#e8ecf0' : '#8a8478');
      if (kind !== 'neige') for (let x = -4; x < VW; x += 16) for (let y = 424; y < VH; y += 10) fillPts(ell(x + ((y / 10) % 2) * 8, y, 6, 3, 6), 'rgba(60,55,50,0.3)');
      fillPts(rect(-4, 414, VW + 4, 420), '#6e6a62');
    });
  }
  function makeGivre() {        // givre : congères au bas de chaque carreau, fleurs de givre aux quatre coins de la vitrine
    return M.pre(VW, VH, (c) => {
      const pw = VW / 4, ph = VH / 6;
      for (let i = 0; i < 4; i++) for (let j = 0; j < 6; j++) {
        const x0 = i * pw + 3, x1 = (i + 1) * pw - 3, y1 = (j + 1) * ph - 3, R = M.rng(50 + i * 7 + j);
        const hl = 8 + R() * 8, hr = 6 + R() * 8;
        c.beginPath(); c.moveTo(x0, y1); c.lineTo(x0, y1 - hl); c.quadraticCurveTo(x0 + pw * 0.25, y1 - 3, (x0 + x1) / 2, y1 - 2); c.quadraticCurveTo(x1 - pw * 0.25, y1 - 3, x1, y1 - hr); c.lineTo(x1, y1); c.closePath();
        c.fillStyle = 'rgba(248,250,255,0.85)'; c.fill();
      }
      for (const [x, y] of [[0, 0], [VW, 0], [0, VH], [VW, VH]]) {
        const g = c.createRadialGradient(x, y, 4, x, y, 90); g.addColorStop(0, 'rgba(250,252,255,0.85)'); g.addColorStop(1, 'rgba(235,242,250,0)');
        c.fillStyle = g; c.fillRect(x - 90, y - 90, 180, 180);
        c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 1.2; const R = M.rng(x + y + 3);
        for (let k = 0; k < 9; k++) { const a = Math.atan2(VH / 2 - y, VW / 2 - x) + (R() - 0.5) * 1.4, l = 30 + R() * 40; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke(); }
      }
    });
  }
  // instruments
  function lunette(x0, x1, y, r, seed) {
    pc([[x0, y - r * 0.7], [x1 - 30, y - r], [x1, y - r * 1.1], [x1, y + r * 1.1], [x1 - 30, y + r], [x0, y + r * 0.7]], LAIT, () => {
      strokePts([[x0, y - r * 0.3], [x1, y - r * 0.45]], LAITL, 2); for (const f of [0.3, 0.55, 0.8]) { const x = lerp(x0, x1, f); strokePts([[x, y - r], [x, y + r]], LAITD, 1.6); }
      shade(0, y - r, 0, y + r, 0.35, [x0 - 4, y - r - 6, x1 + 4, y + r + 6]); }, seed);
    pc(ell(x1, y, 5, r * 1.1, 10), '#bcd6dc', null, seed + 1);
  }
  function makeFond() {
    return M.pre(W, HB, (c) => {
      const g = c.createLinearGradient(0, 0, 0, HB); g.addColorStop(0, '#5a3e26'); g.addColorStop(0.4, '#7a5636'); g.addColorStop(1, '#6a4a2e'); c.fillStyle = g; c.fillRect(0, 0, W, HB);
      // lambris : panneaux moulurés
      const panneau = (x0, y0, x1, y1) => { fillPts(rect(x0, y0, x1, y1), '#6e4c2e'); strokePts([[x0, y1, 1], [x0, y0, 1], [x1, y0, 1]], 'rgba(255,220,170,0.22)', 2.4); strokePts([[x1, y0, 1], [x1, y1, 1], [x0, y1, 1]], 'rgba(30,15,5,0.45)', 2.4); for (let x = x0 + 9; x < x1; x += 13) strokePts([[x, y0 + 4], [x + 3, y1 - 4]], 'rgba(60,35,15,0.16)', 1); };
      const cols = [[60, 240], [262, 470], [880, 1030]];
      for (const [x0, x1] of cols) { panneau(x0, 214, x1, 1060, 7000 + x0); }
      panneau(484, 812, 876, 1060, 7050);
      for (let x0 = 60, i = 0; x0 < 1030; x0 += 196, i++) panneau(x0, 1096, Math.min(1030, x0 + 180), 1336, 7100 + i);
      fillPts(rect(0, 1074, W, 1090), '#4e3420'); strokePts([[0, 1076], [W, 1076]], 'rgba(255,220,170,0.35)', 1.4);   // cimaise
      pc(rect(0, 150, W, 200), '#3a2616', () => { strokePts([[0, 196], [W, 196]], 'rgba(255,220,170,0.3)', 2); hatch(null, 0.05, 5, 0.25, 1, M.P.encre, [0, 140, W, 210]); }, 7151);
      // plinthe + trou de souris
      fillPts(rect(0, 1344, W, HB), '#3e2a1a'); strokePts([[0, 1346], [W, 1346]], 'rgba(255,220,170,0.35)', 1.6);
      const T = AT.trou, hole = [[T.x - T.w / 2, SB, 1]].concat(ep(T.x, SB - T.h + T.w / 2, T.w / 2, T.w / 2, 12, PI, TAU).map((p, i) => [p[0] + (i % 3 === 1 ? 2 : 0), p[1] + (i % 2 ? 1.5 : 0)]), [[T.x + T.w / 2, SB, 1]]);
      fillPts(hole.map((p) => [p[0] + (p[0] - T.x) * 0.18, p[1] - 3]), '#5e4430');
      fillPts(hole, '#0f0905'); const gh = c.createRadialGradient(T.x, SB - 10, 2, T.x, SB - 10, 40); gh.addColorStop(0, 'rgba(0,0,0,0)'); gh.addColorStop(1, 'rgba(40,25,10,0.5)');
      for (const [x, y] of [[T.x - 30, SB - 4], [T.x + 31, SB - 6], [T.x - 20, SB - 36]]) fillPts([[x, y], [x + 4, y - 3], [x + 6, y + 1]], '#8a6a48');
      // vitrine à petits carreaux (ouverture découpée : la rue animée passe dessous)
      const V = AT.vitrine;
      pc(rect(V.x0 - 22, V.y0 - 26, V.x1 + 22, V.y1 + 10), '#4a3220', () => hatch(null, 1.5, 4, 0.22), 7200);
      pc(rect(V.x0 - 40, V.y0 - 44, V.x1 + 40, V.y0 - 22), '#3a2616', () => strokePts([[V.x0 - 38, V.y0 - 24], [V.x1 + 38, V.y0 - 24]], 'rgba(255,220,170,0.35)', 1.4), 7201);
      c.clearRect(V.x0, V.y0, VW, VH);
      c.save(); c.beginPath(); c.rect(V.x0, V.y0, VW, VH); c.clip(); c.fillStyle = 'rgba(240,236,220,0.08)'; c.fillRect(V.x0, V.y0, VW, VH);
      c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 2; for (let i = 0; i < 4; i++) for (let j = 0; j < 6; j++) { const x = V.x0 + i * VW / 4 + 12, y = V.y0 + j * VH / 6 + 10; c.beginPath(); c.moveTo(x, y + 26); c.lineTo(x + 22, y); c.stroke(); }
      c.restore();
      for (let i = 1; i < 4; i++) { const x = V.x0 + i * VW / 4; fillPts(rect(x - 3.5, V.y0, x + 3.5, V.y1), '#3e2a1a'); }
      for (let j = 1; j < 6; j++) { const y = V.y0 + j * VH / 6; fillPts(rect(V.x0, y - 3, V.x1, y + 3), '#3e2a1a'); }
      pc(rect(V.x0 - 34, V.y1, V.x1 + 34, V.rebord), '#6e4a2a', () => { strokePts([[V.x0 - 32, V.y1 + 2], [V.x1 + 32, V.y1 + 2]], 'rgba(255,220,170,0.4)', 1.4); hatch(null, 0.1, 5, 0.2); }, 7202);
      // étagères de gauche
      for (const E of AT.etageres) { pc(rect(E.x0, E.y, E.x1, E.y + 12), '#4e3420', () => strokePts([[E.x0, E.y + 2], [E.x1, E.y + 2]], 'rgba(255,220,170,0.3)', 1.2), 7210 + E.y); for (const bx of [E.x0 + 16, E.x1 - 26]) pc([[bx, E.y + 12], [bx + 10, E.y + 12], [bx + 10, E.y + 46], [bx, E.y + 22]], '#3e2a1a', null, 7215 + bx); }
      // haut : grande lunette couchée sur berceaux, globe terrestre sur pied
      lunette(118, 268, 494, 13, 7220);
      for (const x of [146, 236]) pc([[x - 12, 520], [x + 12, 520], [x + 8, 504], [x + 2, 510], [x - 2, 510], [x - 8, 504]], '#3e2a1a', null, 7222 + x);
      pc([[296, 520], [316, 520], [310, 506], [302, 506]], '#2a2420', null, 7230);
      pc(ell(306, 476, 26, 26, 20), '#c9b88a', () => { for (const [x, y, rx, ry] of [[296, 466, 10, 8], [314, 484, 9, 12], [300, 490, 6, 4]]) fillPts(ell(x, y, rx, ry, 10), '#7a8a5a'); strokePts(ep(306, 476, 26, 8, 14, 0, PI), 'rgba(90,70,40,0.5)', 1); strokePts(ep(306, 476, 10, 26, 14, -PI / 2, PI / 2), 'rgba(90,70,40,0.5)', 1); shade(296, 466, 330, 500, 0.35); }, 7231);
      strokePts(ep(306, 476, 31, 31, 18, -PI * 0.85, PI * 0.15), LAIT, 2.6);
      // bas : bocaux, petite lunette sur trépied, microscope, coffret
      for (const [x, h, col] of [[118, 58, '#7a9a7a'], [156, 46, '#a08a5a']]) pc([[x - 14, 700, 1], [x + 14, 700, 1], [x + 14, 700 - h + 8], [x + 10, 700 - h], [x - 10, 700 - h], [x - 14, 700 - h + 8]], 'rgba(200,220,215,0.6)', () => { fillPts(rect(x - 14, 700 - h * 0.5, x + 14, 700), col); fillPts(rect(x - 12, 700 - h - 6, x + 12, 700 - h + 2), '#5a3a22'); strokePts([[x - 8, 700 - h + 10], [x - 8, 690]], 'rgba(255,255,255,0.5)', 1.4); }, 7240 + x, { texA: 0.2 });
      for (const [a, b] of [[[210, 700], [226, 650]], [[244, 700], [228, 650]], [[226, 700], [227, 650]]]) strokePts([a, b], '#3e2a1a', 2.4);
      c.save(); c.translate(228, 640); c.rotate(-0.45); lunette(-40, 44, 0, 7, 7250); c.restore();
      pc([[276, 700, 1], [312, 700, 1], [306, 690], [298, 690], [300, 676], [314, 676], [314, 670], [296, 670], [304, 620], [316, 612], [312, 604], [296, 614], [286, 668], [282, 690]], LAIT, () => { strokePts([[300, 618], [290, 668]], LAITL, 1.6); shade(280, 600, 316, 700, 0.3); }, 7260);
      pc(rrect(340, 664, 408, 700, 4), '#5a3a22', () => { strokePts([[340, 676], [408, 676]], 'rgba(20,10,5,0.6)', 1.4); fillPts(rect(368, 680, 380, 688), LAIT); }, 7270);
      // au mur : sextant, compas, équerre
      c.save(); c.translate(250, 776);
      pc(ep(0, -46, 70, 70, 14, PI * 0.33, PI * 0.67).concat([[0, -46]]), LAIT, () => { strokePts(ep(0, -46, 64, 64, 14, PI * 0.35, PI * 0.65), LAITD, 1.4); for (let i = 0; i < 12; i++) { const a = PI * 0.35 + i / 11 * PI * 0.3; strokePts([[Math.cos(a) * 60, -46 + Math.sin(a) * 60], [Math.cos(a) * 66, -46 + Math.sin(a) * 66]], '#4a3a1a', 1); } }, 7280);
      strokePts([[0, -46], [16, 20]], LAITD, 3); pc(ell(0, -46, 5, 5, 8), LAITL, null, 7281); c.restore();
      dot(330, 744, 3, '#2a2016'); pc([[328, 746], [332, 746], [348, 836, 1], [344, 838]], '#4a4a4e', null, 7290); pc([[328, 746], [332, 746], [318, 836], [314, 834, 1]], '#4a4a4e', null, 7291); pc(ell(330, 748, 6, 6, 8), LAIT, null, 7292);
      pc([[370, 760, 1], [384, 760, 1], [384, 840, 1], [444, 840, 1], [444, 854, 1], [370, 854, 1]], '#c9a86a', () => { for (let y = 770; y < 840; y += 10) strokePts([[370, y], [376, y]], '#5a3a1a', 1); }, 7293);
      // baromètre à colonne (mur de droite) : cadran à traits sans chiffre
      const Bm = AT.barometre;
      pc([[Bm.x - 14, Bm.y0 + 30], [Bm.x - 24, Bm.y0], [Bm.x + 24, Bm.y0], [Bm.x + 14, Bm.y0 + 30], [Bm.x + 13, Bm.y1 - 40], [Bm.x + 22, Bm.y1 - 20], [Bm.x, Bm.y1, 1], [Bm.x - 22, Bm.y1 - 20], [Bm.x - 13, Bm.y1 - 40]], '#5a2e1c', () => {
        fillPts(rect(Bm.x - 18, Bm.y0 + 6, Bm.x + 18, Bm.y0 + 90), '#e8e2d0'); for (let y = Bm.y0 + 12; y < Bm.y0 + 86; y += 6) strokePts([[Bm.x + 4, y], [Bm.x + ((y / 6) % 3 ? 10 : 15), y]], '#3a2a1a', 1);
        strokePts([[Bm.x - 2, Bm.y0 + 8], [Bm.x - 2, Bm.y1 - 40]], '#3a3a40', 2); fillPts(rect(Bm.x - 3.5, Bm.y0 + 40, Bm.x - 0.5, Bm.y1 - 44), '#8a8e96');
        fillPts(ell(Bm.x, Bm.y1 - 26, 12, 16, 12), LAIT); hatch(null, 1.4, 4, 0.2);
      }, 7300);
      // machine électrostatique à plateau de verre, sur sa console
      const Mc = AT.machine, Dq = Mc.disque;
      pc(rect(852, Mc.y, 1004, Mc.y + 12), '#4e3420', () => strokePts([[852, Mc.y + 2], [1004, Mc.y + 2]], 'rgba(255,220,170,0.3)', 1.2), 7310);
      for (const bx of [870, 986]) pc([[bx - 5, Mc.y + 12], [bx + 5, Mc.y + 12], [bx + 5, Mc.y + 50], [bx - 5, Mc.y + 22]], '#3e2a1a', null, 7311 + bx);
      pc(rect(866, Mc.y - 14, 990, Mc.y), '#5a3a22', null, 7314);
      for (const px of [884, 966]) pc(rect(px - 6, Dq[1] - 74, px + 6, Mc.y - 14), '#6a4428', () => hatch(null, 1.5, 4, 0.2), 7315 + px);
      pc(rect(878, Dq[1] - 82, 972, Dq[1] - 72), '#5a3a22', null, 7318);
      pc(ell(Dq[0], Dq[1], 62, 62, 28), 'rgba(205,230,228,0.42)', () => { strokePts(ep(Dq[0], Dq[1], 52, 52, 14, -2.4, -1.2), 'rgba(255,255,255,0.8)', 2.2); strokePts(ep(Dq[0], Dq[1], 40, 40, 10, 0.8, 1.6), 'rgba(255,255,255,0.5)', 1.6); }, 7320, { texA: 0.15 });
      pc(ell(Dq[0], Dq[1], 8, 8, 10), LAIT, null, 7321);
      pc(rect(Dq[0] - 10, Dq[1] + 48, Dq[0] + 10, Dq[1] + 66), '#8a3a24', null, 7322);
      pc(ribbonW([[966, Dq[1]], [1000, Dq[1] + 14]], 5), '#3a3634', null, 7323); pc(ell(1000, Dq[1] + 20, 5, 9, 8), '#5a3a22', null, 7324);
      pc(rect(846, Dq[1] + 4, 854, Mc.y - 14), 'rgba(205,230,228,0.7)', null, 7325, { texA: 0.15 });
      pc(rrect(826, Dq[1] - 6, 874, Dq[1] + 10, 8), LAIT, () => strokePts([[830, Dq[1] - 2], [870, Dq[1] - 2]], LAITL, 1.6), 7326);
      pc(ell(824, Dq[1] + 2, 9, 9, 10), LAITL, null, 7327);
      strokePts(qbez([826, Dq[1] + 8], [818, Dq[1] + 50], [832, Dq[1] + 84], 10), LAITD, 1.6);
      M.fillPts(rect(0, HB - 60, W, HB), 'rgba(40,25,10,0.25)', 0, 0);
    });
  }
  function makeTable() {
    const top = AT.table.y - SB;
    const cv = M.cutFlat(320, 320, 160, 310, () => {
      for (const x of [-104, 96]) pc([[x - 6, top + 30], [x + 8, top + 30], [x + 10, -40], [x + 4, -20], [x + 8, 0, 1], [x - 4, 0, 1], [x - 2, -20], [x - 8, -40]], '#6a4428', () => hatch(null, 1.5, 4, 0.2), 7400 + x);
      pc(rect(-112, top + 14, 112, top + 34), '#5a3a22', null, 7403);
      pc(rect(-122, top, 122, top + 14), '#7a5432', () => strokePts([[-120, top + 2], [120, top + 2]], 'rgba(255,220,170,0.4)', 1.4), 7404);
      // serviette pliée qui pend du bord
      pc([[-118, top + 2], [-80, top + 2], [-76, top + 44], [-96, top + 50], [-118, top + 42]], '#f4f1ea', () => { strokePts([[-116, top + 38], [-78, top + 40]], '#4a6a9a', 2.4); strokePts([[-100, top + 4], [-98, top + 46]], 'rgba(150,145,135,0.5)', 1.2); }, 7405);
      // tasse et soucoupe (faïence crème à liseré bleu)
      pc(ell(-92, top - 3, 24, 5, 14), '#efe8d6', null, 7406);
      pc([[-108, top - 26, 1], [-76, top - 26, 1], [-80, top - 8], [-92, top - 4], [-104, top - 8]], '#efe8d6', () => { strokePts([[-107, top - 21], [-77, top - 21]], '#4a6a9a', 2); fillPts(ell(-92, top - 26, 16, 3, 10), '#7a4a2a'); }, 7407);
      // théière brune à filet doré, bec vers la gauche
      const tx = 76;
      pc(ell(tx, top - 30, 32, 28, 22).map((p) => [p[0], Math.min(p[1], top - 2)]), '#3e2a20', () => { strokePts([[tx - 30, top - 40], [tx + 30, top - 40]], LAIT, 2.4); strokePts(ep(tx, top - 30, 24, 20, 8, -2.6, -1.8), 'rgba(255,255,255,0.4)', 2); }, 7408);
      pc(ribbonW(qbez([tx - 26, top - 24], [tx - 40, top - 30], [tx - 44, top - 46], 8), (u) => lerp(12, 6, u)), '#3e2a20', null, 7409);
      pc(ribbonW(ep(tx + 32, top - 32, 13, 15, 10, -PI / 2, PI / 2), 6), '#3e2a20', null, 7410);
      pc([[tx - 16, top - 56], [tx + 16, top - 56], [tx + 10, top - 62], [tx - 10, top - 62]], '#4a3428', null, 7411); pc(ell(tx, top - 66, 5, 5, 8), LAIT, null, 7412);
      // couteau à pain
      pc([[-30, top - 3], [30, top - 6], [34, top - 2], [-30, top + 1]], '#c8ccd0', null, 7413); pc(rect(-62, top - 4, -30, top + 2), '#3e2a1a', null, 7414);
    });
    cv.padB = 10; return M.withShadow(cv, 8);
  }
  function makeComptoir() {
    const C = AT.comptoir, top = C.y - SB, hw = (C.x1 - C.x0) / 2;
    const cv = M.cutFlat(hw * 2 + 60, -top + 120, hw + 30, -top + 110, () => {
      pc(rect(-hw, top + 14, hw, 0), '#6a4428', () => {
        const w = (hw * 2 - 80) / 3;
        for (let k = 0; k < 3; k++) { const px = -hw + 20 + k * (w + 20), y0 = top + 36, y1 = -34; fillPts(rect(px, y0, px + w, y1), '#5e3c22'); strokePts([[px, y1, 1], [px, y0, 1], [px + w, y0, 1]], 'rgba(255,220,170,0.3)', 2.4); strokePts([[px + w, y0, 1], [px + w, y1, 1], [px, y1, 1]], 'rgba(30,15,5,0.5)', 2.4); }
        hatch(null, 1.5, 5, 0.18); fillPts(rect(-hw, -16, hw, 0), '#3e2a1a');
      }, 7500);
      pc(rect(-hw - 14, top, hw + 14, top + 16), '#7a5432', () => strokePts([[-hw - 12, top + 2], [hw + 12, top + 2]], 'rgba(255,220,170,0.45)', 1.4), 7501);
      // balance à plateaux en laiton (sans graduation)
      const bx = -hw + 60;
      pc(rect(bx - 22, top - 8, bx + 22, top), '#5a3a22', null, 7502); pc(rect(bx - 3, top - 70, bx + 3, top - 8), LAIT, null, 7503);
      pc(rect(bx - 44, top - 74, bx + 44, top - 69), LAIT, null, 7504);
      for (const s of [-1, 1]) { strokePts([[bx + s * 42, top - 70], [bx + s * 30, top - 34]], LAITD, 1); strokePts([[bx + s * 42, top - 70], [bx + s * 54, top - 34]], LAITD, 1); pc(ep(bx + s * 42, top - 34, 16, 6, 8, 0, PI), LAIT, null, 7505 + s); }
    });
    cv.padB = 10; return M.withShadow(cv, 8);
  }
  function makeCoulisseG() {
    const cv = M.cutFlat(200, 1300, 60, 1290, () => {
      pc([[-14, -1250, 1], [96, -1250, 1], [80, -900], [44, -760], [30, -700], [52, -540], [70, -200], [74, 0, 1], [-14, 0, 1]], '#4f6040', () => {
        for (let x = -6; x < 96; x += 14) strokePts([[x, -1250], [x * 0.5, -730], [x * 0.85, 0]], 'rgba(30,40,20,0.45)', 3);
        for (let x = 0; x < 96; x += 14) strokePts([[x + 5, -1250], [x * 0.5 + 4, -730], [x * 0.85 + 5, 0]], 'rgba(190,210,160,0.25)', 1.6);
        hatch(null, 1.5, 5, 0.18);
      }, 7600);
      pc(rect(-14, -1260, 110, -1220), '#3a4a30', () => strokePts([[-12, -1224], [108, -1224]], LAIT, 2), 7601);
      pc(ribbonW([[-10, -724], [40, -730], [52, -716]], 9), LAIT, null, 7602); pc(ell(56, -706, 8, 14, 10), LAITD, null, 7603);
    });
    cv.padB = 10; return M.withShadow(cv, 8);
  }
  function makeCaisses() {
    const cv = M.cutFlat(240, 320, 120, 310, () => {
      const caisse = (x0, y0, x1, y1, seed) => pc(rect(x0, y0, x1, y1), '#a07a4a', () => { for (let y = y0 + 22; y < y1; y += 22) strokePts([[x0, y], [x1, y]], 'rgba(60,35,15,0.55)', 1.6); for (const x of [x0 + 8, x1 - 8]) fillPts(rect(x - 6, y0, x + 6, y1), '#8a6a3a'); for (const x of [x0 + 8, x1 - 8]) for (let y = y0 + 10; y < y1; y += 22) dot(x, y, 1.6, '#3a3634'); hatch(null, 1.5, 4, 0.18); }, seed);
      caisse(-80, -130, 90, 0, 7700); caisse(-60, -240, 70, -130, 7701);
      for (let i = 0; i < 9; i++) strokePts([[-50 + i * 13, -240], [-58 + i * 14 + (i % 2 ? 6 : -4), -262 - (i % 3) * 6]], '#d8b860', 1.6);
    });
    cv.padB = 10; return M.withShadow(cv, 8);
  }
  function makePanier() {
    const cv = M.cutFlat(220, 260, 110, 250, () => {
      for (const [x, h, a, col] of [[-34, 150, -0.12, '#efe8d4'], [-6, 176, 0.04, '#e8dcc0'], [22, 140, 0.15, '#efe8d4'], [44, 120, 0.3, '#ddd0b0']]) { const c = cx_(); c.save(); c.translate(x, -60); c.rotate(a); pc(rect(-9, -h, 9, 0), col, () => { fillPts(ell(0, -h, 9, 4, 10), '#cfc4a8'); strokePts(ep(0, -h, 5, 2, 6, 0, TAU), 'rgba(120,100,70,0.6)', 1); }, 7800 + x); if (x === -6) strokePts([[-9, -100], [9, -102]], '#8a3a24', 2); c.restore(); }
      pc([[-66, -74], [66, -74], [56, 0, 1], [-56, 0, 1]], '#a9824a', () => { for (let y = -70; y < 0; y += 9) strokePts([[-66, y], [66, y]], 'rgba(70,45,20,0.55)', 1.4); for (let x = -60; x < 66; x += 12) strokePts([[x, -74], [x * 0.86, 0]], 'rgba(70,45,20,0.4)', 1); }, 7810);
    });
    cv.padB = 10; return M.withShadow(cv, 8);
  }
  function makeTabouret() {
    const cv = M.cutFlat(200, 220, 100, 210, () => {
      for (const x of [-46, 40]) pc([[x - 5, -120], [x + 5, -120], [x + 9, 0, 1], [x - 1, 0, 1]], '#4e3420', null, 7901 + x);
      pc(rect(-44, -50, 44, -42), '#4e3420', null, 7903);
      pc(rrect(-60, -134, 60, -118, 5), '#6b4a2c', () => hatch(null, 0.2, 4, 0.2), 7904);
    });
    cv.padB = 10; return M.withShadow(cv, 8);
  }
  GOM.init = function () {
    GOM.K = { vue: { jour: makeVue('jour'), soleil: makeVue('soleil'), neige: makeVue('neige') }, givre: makeGivre(), fond: makeFond(), table: makeTable(), comptoir: makeComptoir(),
      coulisseG: makeCoulisseG(), caisses: makeCaisses(), panier: makePanier(), tabouret: makeTabouret() };
    return GOM.K;
  };

  // ------------------------------------------------------------ vie de la vitrine
  function pigeon(x, y, t, vol) {
    const c = cx_(); c.save(); c.translate(x, y); c.scale(-1, 1);
    const bob = vol ? 0 : Math.max(0, Math.sin(t * 2.3)) * 3;
    pc([[-20, -10], [-30, -4], [-34, 2, 1], [-16, 0], [10, 0], [20, -8], [18, -18], [6, -22], [-10, -18]], '#8e9096', () => { fillPts([[6, -22], [18, -18], [18, -10], [8, -12]], '#6e8a7a'); strokePts([[-14, -10], [4, -8]], 'rgba(40,40,46,0.6)', 1.4); }, 8001);
    pc([[14, -16 - bob], [22, -28 - bob], [30, -26 - bob], [34, -22 - bob, 1], [28, -20 - bob], [22, -12]], '#7a7c84', () => dot(27, -25 - bob, 1.6, '#c96a2a'), 8002);
    if (vol) { const fl = Math.sin(t * 22); pc([[-8, -16], [10, -16], [0, -16 - 26 * fl], [-16, -18 - 22 * fl]], '#a0a2a8', null, 8003); }
    else { strokePts([[0, 0], [-1, 6]], '#b8645a', 1.6); strokePts([[6, 0], [7, 6]], '#b8645a', 1.6); }
    c.restore();
  }
  function passantTricorne(x, y, t, s) {   // ombre au tricorne et à la canne, qui marche vers +x
    const c = cx_(), pas = Math.sin(t * 6); c.save(); c.translate(x, y - Math.abs(pas) * 3 * s); c.scale(s, s); c.fillStyle = SIL() ? '#000' : '#2e2826';
    for (const sg of [-1, 1]) { c.save(); c.translate(sg * 8, -240); c.rotate(sg * pas * 0.3); c.fillRect(-11, 0, 22, 240); c.fillRect(-11, 228, 34, 12); c.restore(); }
    c.beginPath(); c.moveTo(-40, -440); c.lineTo(36, -440); c.lineTo(52, -190); c.lineTo(-56, -190); c.closePath(); c.fill();
    c.save(); c.translate(20, -420); c.rotate(-0.5 + pas * 0.12); c.fillRect(-10, 0, 20, 150); c.fillRect(-2, 140, 5, 160); c.restore();
    c.fillRect(-10, -470, 20, 34); c.beginPath(); c.arc(6, -486, 30, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(-44, -506); c.lineTo(58, -506); c.lineTo(40, -536); c.lineTo(6, -526); c.lineTo(-28, -540); c.closePath(); c.fill();
    c.fillRect(-40, -486, 10, 50);
    c.restore();
  }
  const FLOCONS = []; { const R = M.rng(4401); for (let i = 0; i < 60; i++) FLOCONS.push({ x: R(), v: 40 + R() * 50, ph: R() * TAU, r: 1.6 + R() * 2.4, o: R() }); }
  // o : vitrine 'jour'|'soleil'|'neige' ; vitrine2 + fondu 0..1 (bascule vers vitrine2) ; soleil 0..1 (descente du soleil, défaut 1 en 'soleil') ; neige 0..1 (flocons et givre, défaut 1 en 'neige')
  //     planche (false | options de GOM.planche) ; miche (false | options de GOM.miche) ; couverte ; comptoir (bool) ; passant / courant / pigeon / rayon (instants locaux) ; cast
  GOM.atelier = function (t, up, o) {
    o = o || {}; up = up || 0; const K = GOM.K, c = cx_(), g = M.tg(t), V = AT.vitrine, cast = o.cast || { dx: 14, dy: 6, a: 0.3 };
    const kA = o.vitrine || 'jour', kB = o.vitrine2, fd = kB ? clamp(o.fondu || 0) : 0;
    const wt = (k) => (kA === k ? 1 - fd : 0) + (kB === k ? fd : 0);
    const sol = o.soleil != null ? clamp(o.soleil) : wt('soleil'), nei = o.neige != null ? clamp(o.neige) : wt('neige');
    c.save(); c.translate(0, -up);
    c.drawImage(K.vue[kA], V.x0, V.y0); if (fd > 0) { c.save(); c.globalAlpha = fd; c.drawImage(K.vue[kB], V.x0, V.y0); c.restore(); }
    c.save(); c.beginPath(); c.rect(V.x0, V.y0, VW, VH); c.clip();
    M.nuages(t, { y0: V.y0 + 30, y1: V.y0 + 110, n: 6, vit: 12, s: 0.42, seed: 23, brume: 0.1, col: nei > 0.5 ? '#e6eaee' : '#efe7d6' });
    if (sol > 0.01) M.sun(V.x0 + 250, lerp(V.y0 - 90, V.y0 + 150, ease(sol)), 62, t);
    M.passants(t, { y: V.y1 + 14, s: 0.27, n: 3, per: 13, x0: V.x0 - 40, x1: V.x1 + 40, brume: 0.35, seed: 31, femmes: true });
    if (o.passant != null) { const u = (t - o.passant) / 3.6; if (u > 0 && u < 1) passantTricorne(lerp(V.x0 - 60, V.x1 + 60, u), V.y1 + 16, t, 0.3); }
    if (nei > 0.01 && !SIL()) { const G = M.tg(t); c.save(); c.globalAlpha = nei; for (const f of FLOCONS) { const y = V.y0 + (((f.o + G * f.v / VH) % 1) * (VH + 20)) - 10, x = V.x0 + f.x * VW + Math.sin(G * 1.3 + f.ph) * 10; c.beginPath(); c.arc(x, y, f.r, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.95)'; c.fill(); } c.restore(); }
    if (o.pigeon != null) { const u = (t - o.pigeon) / 1.3; if (u > -0.05) { const e = ease(clamp(u)); pigeon(lerp(V.x1 + 40, V.x1 - 90, e), lerp(V.y0 + 160, V.y1 - 2, e), t, u < 1); } }
    c.restore();
    c.drawImage(K.fond, 0, 0);
    if (nei > 0.01) { c.save(); c.globalAlpha = nei; c.drawImage(K.givre, V.x0, V.y0); c.restore(); }
    // rayon de la vitrine et poussière
    if (!SIL()) {
      const warm = sol > 0.5 ? '#ffd090' : nei > 0.5 ? '#c8d8ff' : '#fff0c8';
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.06 + 0.015 * Math.sin(g * 0.7) + 0.05 * sol; c.fillStyle = warm;
      c.beginPath(); c.moveTo(V.x0, V.y0 + 40); c.lineTo(V.x1, V.y0 + 40); c.lineTo(760, SB); c.lineTo(360, SB); c.closePath(); c.fill();
      if (o.rayon != null) { const u = clamp((t - o.rayon) / 4), a = Math.sin(PI * u) * 0.12, xr = lerp(V.x1 - 40, V.x0 + 40, u); c.globalAlpha = a; c.fillStyle = '#fff2c0'; c.beginPath(); c.moveTo(xr - 26, V.y0); c.lineTo(xr + 26, V.y0); c.lineTo(xr - 170, SB); c.lineTo(xr - 280, SB); c.closePath(); c.fill(); }
      c.restore();
    }
    M.poussiere(t, { x: 420, y: 760, w: 380, h: 560, n: 30, a: 0.6, seed: 19 });
    M.pendule(t, { x: AT.horloge.x, y: AT.horloge.y, s: 0.95, per: 2.2, bois: '#5a3a22' });
    // table du déjeuner (ou comptoir : la table reste derrière)
    M.flat(K.table, AT.table.x, SB, { cast });
    M.fumee(t, { x: AT.theiere.x, y: AT.theiere.y, s: 0.45, n: 5, haut: 170, vent: -16, a: 0.6, per: 3, seed: 41 });
    if (o.miche !== false) GOM.miche(AT.miche.x, AT.miche.y, 1, Object.assign({ couverte: o.couverte, cast }, o.miche || {}));
    if (o.planche !== false) GOM.planche(AT.planche.x, AT.planche.y, 1, Object.assign({ t, courant: o.courant, cast }, o.planche || {}));
    M.flat(K.coulisseG, 90, SB, { rot: 0.004 * Math.sin(g * 0.8), cast });
    M.flat(K.caisses, 1040, SB, { cast });
    if (o.comptoir) M.flat(K.comptoir, AT.comptoir.x, SB, { cast });
    c.restore();
  };
  GOM.comptoir = function (t, up, o) { o = o || {}; const c = cx_(); c.save(); c.translate(0, -(up || 0)); M.flat(GOM.K.comptoir, AT.comptoir.x, SB, { cast: o.cast || { dx: 14, dy: 6, a: 0.3 } }); c.restore(); };
  // premier plan (après les marionnettes) : panier de rouleaux de papier (x 150), tabouret (x 950)
  GOM.atelierAvant = function (t, up, o) {
    o = o || {}; const c = cx_(); c.save(); c.translate(0, -(up || 0));
    M.flat(GOM.K.panier, 150, 1600, { cast: { dx: 10, dy: 4, a: 0.25 } });
    if (o.tabouret !== false) M.flat(GOM.K.tabouret, 950, 1614, { cast: { dx: 10, dy: 4, a: 0.25 } });
    c.restore();
  };
  // teinte de la lumière de la vitrine sur TOUTE l'image (après les marionnettes, avant M.stageLight) : mêmes options vitrine / vitrine2 / fondu / soleil / neige
  GOM.lumiere = function (t, o) {
    o = o || {}; if (SIL()) return; const kA = o.vitrine || 'jour', kB = o.vitrine2, fd = kB ? clamp(o.fondu || 0) : 0;
    const wt = (k) => (kA === k ? 1 - fd : 0) + (kB === k ? fd : 0);
    const sol = o.soleil != null ? clamp(o.soleil) * wt('soleil') : wt('soleil'), nei = o.neige != null ? clamp(o.neige) * wt('neige') : wt('neige');
    const c = cx_(); c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    if (sol > 0.01) { c.globalCompositeOperation = 'multiply'; c.fillStyle = `rgba(255,196,130,${0.35 * sol})`; c.fillRect(0, 0, W, M.H); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(80,40,0,${0.06 * sol})`; c.fillRect(0, 0, W, M.H); }
    if (nei > 0.01) { c.globalCompositeOperation = 'multiply'; c.fillStyle = `rgba(170,190,230,${0.4 * nei})`; c.fillRect(0, 0, W, M.H); }
    c.restore();
  };
})();

// ——— Accessoires partagés des plans (ex-M.dec, renommés M.gom) : blocCaoutchouc, blocMain (p3), plateauCubes (p4), cube3q, plateauSans, tasseAtelier, piece, eclat (p5).
// Décors/accessoires du plan 3 (« Le caoutchouc ») réutilisables par les plans suivants.
// Bloc de caoutchouc brut : morceau IRRÉGULIER brun très sombre, luisant (deux reflets blancs), bords bosselés, coulure aplatie en bas à droite.
// (x, y) = centre du bloc, s = échelle (1 → ≈ 112 px de large, ≈ 72 px de haut), ang = rotation (rad). Fonction pure, sans état.
M.gom.blocCaoutchouc = function (x, y, s, ang) {
  const c = M.ctx(); s = s == null ? 1 : s;
  const P = [[-48, -4], [-40, -24], [-22, -30], [-8, -38], [12, -30], [28, -36], [44, -22], [50, -4], [44, 10], [52, 22], [60, 30], [40, 34], [24, 26], [6, 34], [-14, 30], [-30, 36], [-44, 24], [-52, 10]];
  const path = () => {
    const n = P.length; c.beginPath();
    let m0 = [(P[n - 1][0] + P[0][0]) / 2, (P[n - 1][1] + P[0][1]) / 2]; c.moveTo(m0[0], m0[1]);
    for (let i = 0; i < n; i++) { const a = P[i], b = P[(i + 1) % n]; c.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
    c.closePath();
  };
  c.save(); c.translate(x, y); c.rotate(ang || 0); c.scale(s, s); c.lineJoin = 'round';
  // ombre portée douce
  c.save(); c.translate(10, 12); path(); c.fillStyle = 'rgba(25,14,6,0.28)'; c.fill(); c.restore();
  // corps sombre, dégradé #5A3A1E → #3A2414
  const gr = c.createLinearGradient(-40, -36, 50, 36); gr.addColorStop(0, '#4a2f19'); gr.addColorStop(0.55, '#3a2414'); gr.addColorStop(1, '#2a180c');
  path(); c.fillStyle = gr; c.fill(); c.strokeStyle = 'rgba(255,248,230,0.85)'; c.lineWidth = 2.4; c.stroke();
  // zone claire luisante en haut, bords sombres
  c.save(); path(); c.clip();
  const lg = c.createRadialGradient(-18, -20, 2, -10, -8, 52); lg.addColorStop(0, 'rgba(110,72,40,0.35)'); lg.addColorStop(1, 'rgba(90,58,30,0)');
  c.fillStyle = lg; c.fillRect(-70, -50, 140, 100);
  c.strokeStyle = 'rgba(20,10,4,0.55)'; c.lineWidth = 5; path(); c.stroke();
  // bosses : petits plis sombres
  c.strokeStyle = 'rgba(20,10,4,0.4)'; c.lineWidth = 1.6;
  c.beginPath(); c.moveTo(-6, 4); c.quadraticCurveTo(10, 10, 26, 2); c.stroke();
  c.beginPath(); c.moveTo(-34, 12); c.quadraticCurveTo(-24, 20, -10, 18); c.stroke();
  c.restore();
  // deux reflets blancs nets
  c.fillStyle = 'rgba(255,255,255,0.92)';
  c.beginPath(); c.ellipse(-20, -19, 12, 4.2, -0.5, 0, 7); c.fill();
  c.beginPath(); c.ellipse(20, -16, 6.5, 3, -0.35, 0, 7); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); c.arc(-34, -8, 2.2, 0, 7); c.fill();
  // reflet de la coulure
  c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.ellipse(50, 27, 6, 1.8, 0.25, 0, 7); c.fill();
  c.restore();
};
// Bloc tenu dans la main avant de Nairne : (pose, x, y, s, dir) = les arguments de GOM.nairne (pose avec tenu 'caoutchouc' + tenuO { taille: 2 },
// donc le poing se ferme mais aucun objet n'est dessiné) ; à appeler AVANT GOM.nairne (le poing et les doigts passent devant le bloc).
// dec = décalage écran du centre du bloc par rapport au poing (défaut [0, -42]) ; ech = échelle du bloc (défaut 1).
M.gom.blocMain = function (pose, x, y, s, dir, dec, ech) {
  const GOM = M.gom, q = GOM.nairnePose(pose, x, y, s, dir), def = M.chars.gomNairne;
  const h = M.wpt(M.partMatrices(def, q, x, y, s, dir).mats.armF_lo, 0, 96); dec = dec || [0, -42];
  M.gom.blocCaoutchouc(h[0] + dec[0], h[1] + dec[1], ech == null ? 1 : ech, 0);
  return h;
};
// Décors/accessoires du plan 4 (« Priestley l'écrit ») réutilisables par le plan 5.
// Plateau de petits cubes de caoutchouc posé sur le comptoir (plateau d'étain + 6 cubes ambrés assombris, famille du bloc brun luisant).
// (x, y) = milieu du bord avant du plateau, posé sur le dessus du comptoir (y = 1160 pour GOM.AT.comptoir : dessus 1165) ; o : { cast, t }.
// Largeur ≈ 200 px, hauteur ≈ 130 px au-dessus de y. Fonction pure ; à dessiner AVANT Nairne (sa main arrière se pose dessus).
M.gom.plateauCubes = function (x, y, o) {
  o = o || {}; const c = M.ctx(), GOM = M.gom;
  c.save(); c.lineJoin = 'round';
  // ombre sur le comptoir
  c.fillStyle = 'rgba(30,18,8,0.28)'; c.beginPath(); c.ellipse(x + 10, y + 5, 108, 9, 0, 0, 7); c.fill();
  // plateau d'étain : fond, bord arrière, lèvre avant
  c.fillStyle = '#8f8c80'; c.beginPath(); c.moveTo(x - 94, y - 16); c.lineTo(x + 94, y - 16); c.lineTo(x + 102, y + 2); c.lineTo(x - 102, y + 2); c.closePath(); c.fill();
  c.strokeStyle = '#3e3a30'; c.lineWidth = 2; c.stroke();
  c.fillStyle = '#c9c6b6'; c.beginPath(); c.moveTo(x - 102, y + 2); c.lineTo(x + 102, y + 2); c.lineTo(x + 98, y - 4); c.lineTo(x - 98, y - 4); c.closePath(); c.fill();
  c.strokeStyle = '#3e3a30'; c.stroke();
  c.strokeStyle = 'rgba(255,255,245,0.7)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x - 94, y - 1); c.lineTo(x + 94, y - 1); c.stroke();
  c.restore();
  // cubes (ambrés, assombris pour rester dans la famille du bloc brun) : rangée du fond, rangée du haut, rangée avant
  const cube = (cx, cy) => { c.save(); c.filter = 'brightness(0.74) saturate(1.1)'; GOM.caoutchouc(cx, cy, 1, { etat: 'cube', taille: 54, cast: o.cast }); c.restore(); };
  cube(x - 30, y - 22); cube(x + 30, y - 22);
  cube(x - 58, y - 8); cube(x, y - 8); cube(x + 58, y - 8);
  cube(x, y - 8 - 50);
};
// Décors/accessoires du plan 5 (« Trois shillings ») réutilisables par le plan 6 si besoin.
// Variante du plateau de cubes de decors/p4.js sans certains cubes (o.sans = numéros 1..6 dans l'ordre de dessin :
// fond gauche, fond droit, avant gauche, avant milieu, avant droit, cube du dessus). Même dessin, aucun cube recopié.
M.gom.plateauSans = function (x, y, o) {
  o = o || {}; const sans = o.sans || [], G = M.gom, orig = G.caoutchouc; let n = 0;
  G.caoutchouc = function (a, b, sc, oo) { n++; if (sans.indexOf(n) >= 0) return undefined; return orig.call(this, a, b, sc, o.alpha == null ? oo : Object.assign({}, oo, { alpha: o.alpha })); };
  try { M.gom.plateauCubes(x, y, o); } finally { G.caoutchouc = orig; }
};
// Tasse de l'atelier (identique aux plans 2 à 4). (x, y) = bas de la tasse.
M.gom.tasseAtelier = function (x, y) {
  const c = M.ctx(); c.save(); c.translate(x, y); c.lineJoin = 'round';
  c.fillStyle = 'rgba(30,18,8,0.28)'; c.beginPath(); c.ellipse(14, 2, 40, 6, 0, 0, 7); c.fill();
  c.beginPath(); c.moveTo(-36, -54); c.lineTo(36, -54); c.lineTo(28, -12); c.quadraticCurveTo(24, 0, 0, 0); c.quadraticCurveTo(-24, 0, -28, -12); c.closePath();
  c.fillStyle = '#efe8d6'; c.fill(); c.strokeStyle = 'rgba(255,250,235,0.9)'; c.lineWidth = 2; c.stroke();
  c.beginPath(); c.moveTo(34, -46); c.bezierCurveTo(60, -50, 58, -22, 28, -20); c.strokeStyle = '#efe8d6'; c.lineWidth = 7; c.stroke();
  c.strokeStyle = 'rgba(255,250,235,0.9)'; c.lineWidth = 1.4; c.stroke();
  c.beginPath(); c.moveTo(-34, -42); c.lineTo(34, -42); c.strokeStyle = '#4a6a9a'; c.lineWidth = 3; c.stroke();
  c.strokeStyle = 'rgba(120,100,70,0.25)'; c.lineWidth = 1;
  for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(-30 + i * 3, -36 + i * 5); c.lineTo(-18 + i * 3, -30 + i * 5); c.stroke(); }
  c.beginPath(); c.ellipse(0, -54, 36, 7, 0, 0, 7); c.fillStyle = '#efe8d6'; c.fill();
  c.beginPath(); c.ellipse(0, -53, 31, 5, 0, 0, 7); c.fillStyle = '#8fb0b8'; c.fill();
  c.restore();
};
// Pièce d'argent de profil (motif gravé : buste de profil, collier de perles, aucun chiffre ni lettre).
// (x, y) = centre ; d = diamètre en px ; o : { rot, plat (aplatissement vertical, défaut 0.86), ombre (bool, défaut true) }.
M.gom.piece = function (x, y, d, o) {
  o = o || {}; const c = M.ctx(), r = d / 2;
  c.save(); c.translate(x, y); c.lineJoin = 'round';
  if (o.ombre !== false) { c.fillStyle = 'rgba(25,14,6,0.3)'; c.beginPath(); c.ellipse(6, r * 0.62, r * 0.95, r * 0.3, 0, 0, 7); c.fill(); }
  c.rotate(o.rot || 0); c.scale(1, o.plat == null ? 0.86 : o.plat);
  const g = c.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r);
  g.addColorStop(0, '#f6f6f1'); g.addColorStop(0.6, '#c3c6c9'); g.addColorStop(1, '#8d9196');
  c.beginPath(); c.arc(0, 0, r, 0, 7); c.fillStyle = g; c.fill(); c.strokeStyle = '#4c4f55'; c.lineWidth = 2.4; c.stroke();
  c.beginPath(); c.arc(0, 0, r * 0.84, 0, 7); c.strokeStyle = 'rgba(70,74,82,0.7)'; c.lineWidth = 1.4; c.stroke();
  c.fillStyle = 'rgba(70,74,82,0.75)';
  for (let i = 0; i < 20; i++) { const a = i / 20 * 6.2832; c.beginPath(); c.arc(Math.cos(a) * r * 0.92, Math.sin(a) * r * 0.92, r * 0.035, 0, 7); c.fill(); }
  // buste de profil (regarde à droite)
  const P = [[-0.34, 0.62], [-0.24, 0.24], [-0.34, -0.12], [-0.2, -0.46], [0.06, -0.58], [0.26, -0.46], [0.32, -0.3], [0.46, -0.04], [0.34, 0.02], [0.38, 0.14], [0.28, 0.26], [0.22, 0.36], [0.12, 0.4], [0.2, 0.62]];
  c.beginPath(); P.forEach((p, i) => { const X = p[0] * r, Y = p[1] * r; i ? c.lineTo(X, Y) : c.moveTo(X, Y); }); c.closePath();
  c.fillStyle = '#9a9ea4'; c.fill(); c.strokeStyle = 'rgba(50,54,60,0.85)'; c.lineWidth = 1.6; c.stroke();
  c.beginPath(); c.arc(-0.02 * r, -0.28 * r, r * 0.2, 3.4, 5.2); c.strokeStyle = 'rgba(60,64,72,0.8)'; c.lineWidth = 1.6; c.stroke();
  c.beginPath(); c.arc(-r * 0.15, -r * 0.2, r * 0.82, 3.6, 4.5); c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 2.2; c.stroke();
  c.restore();
};
// Vrai cube de caoutchouc vu de 3/4 : dessus plus clair, deux côtés sombres, arêtes arrondies, brun très sombre luisant (famille du bloc brut de p3),
// un reflet blanc. (x, y) = sommet bas (arête avant), px = LARGEUR totale (≈ px de haut × 1,12). o : { etat: 'cube' | 'casse', ecart (px, casse),
// alpha, ombre (bool) }. 'casse' : deux moitiés nettes qui s'écartent, fissure claire en zigzag.
M.gom.cube3q = function (x, y, px, o) {
  o = o || {}; const c = M.ctx(), W = px, hw = W / 2, d = W * 0.24, H = W * 0.62;
  const P = {
    L: [[0, 0], [-hw, -d], [-hw, -d - H], [0, -H]], R: [[0, 0], [hw, -d], [hw, -d - H], [0, -H]],
    T: [[0, -H], [-hw, -d - H], [0, -H - 2 * d], [hw, -d - H]], S: [[0, 0], [hw, -d], [hw, -d - H], [0, -H - 2 * d], [-hw, -d - H], [-hw, -d]]
  };
  const path = (A) => { c.beginPath(); A.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); };
  const zz = [[0, -1.25 * W], [0.09 * W, -0.95 * W], [-0.07 * W, -0.66 * W], [0.1 * W, -0.38 * W], [-0.05 * W, -0.12 * W], [0.02 * W, 0.08 * W]];   // fissure (décalages en x, y)
  const body = () => {
    c.lineJoin = 'round'; c.lineCap = 'round';
    let g = c.createLinearGradient(-hw, -d - H, hw, -d); g.addColorStop(0, '#5A3A1E'); g.addColorStop(1, '#3A2414'); path(P.L); c.fillStyle = '#3A2414'; c.fill();
    g = c.createLinearGradient(0, -H, hw, 0); g.addColorStop(0, '#34200f'); g.addColorStop(1, '#241408'); path(P.R); c.fillStyle = g; c.fill();
    g = c.createLinearGradient(-hw, -H - d, hw, -H); g.addColorStop(0, '#6a4526'); g.addColorStop(1, '#5A3A1E'); path(P.T); c.fillStyle = g; c.fill();
    // arêtes arrondies : fines lignes claires le long des arêtes du dessus et de l'arête avant
    c.strokeStyle = 'rgba(150,105,60,0.75)'; c.lineWidth = Math.max(1.5, W * 0.025);
    c.beginPath(); c.moveTo(-hw, -d - H); c.lineTo(0, -H); c.lineTo(hw, -d - H); c.moveTo(0, -H); c.lineTo(0, 0); c.stroke();
    c.strokeStyle = 'rgba(15,8,3,0.55)'; c.lineWidth = Math.max(1.2, W * 0.018);
    c.beginPath(); c.moveTo(-hw, -d); c.lineTo(0, 0); c.lineTo(hw, -d); c.stroke();
    // reflets : un blanc net sur le dessus, un trait sur le côté gauche
    c.fillStyle = 'rgba(255,255,255,0.92)'; c.beginPath(); c.ellipse(-0.18 * W, -H - d * 0.95, W * 0.13, W * 0.04, -0.45, 0, 7); c.fill();
    c.strokeStyle = 'rgba(255,235,200,0.5)'; c.lineWidth = Math.max(2, W * 0.03); c.beginPath(); c.moveTo(-hw * 0.78, -d - H * 0.82); c.lineTo(-hw * 0.78, -d * 0.7 - H * 0.2); c.stroke();
    path(P.S); c.strokeStyle = 'rgba(255,248,230,0.85)'; c.lineWidth = Math.max(2, W * 0.03); c.stroke();
  };
  c.save(); c.translate(x, y); if (o.alpha != null) c.globalAlpha *= o.alpha;
  if (o.ombre) { c.fillStyle = 'rgba(25,14,6,0.28)'; c.beginPath(); c.ellipse(8, 2, hw * 1.1, d * 0.7, 0, 0, 7); c.fill(); }
  if (o.etat !== 'casse') { body(); c.restore(); return; }
  const e = o.ecart || 0;
  for (const sg of [-1, 1]) {
    c.save(); c.translate(sg * e, 0); c.rotate(sg * e * 0.007);
    c.beginPath(); c.moveTo(sg * 3 * W, -3 * W); zz.forEach((p) => c.lineTo(p[0], p[1])); c.lineTo(sg * 3 * W, 3 * W); c.closePath(); c.clip();
    body();
    c.restore();
    // fissure claire sur la tranche de chaque moitié
    c.save(); c.translate(sg * e, 0); c.rotate(sg * e * 0.007); c.strokeStyle = '#f0d9a8'; c.lineWidth = Math.max(2.4, W * 0.035); c.lineJoin = 'round';
    c.beginPath(); zz.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke(); c.restore();
  }
  c.restore();
};
// Petit éclat de caoutchouc (brun sombre, arête claire). (x, y) = centre ; sz en px.
M.gom.eclat = function (x, y, sz, rot) {
  const c = M.ctx(); c.save(); c.translate(x, y); c.rotate(rot || 0); c.lineJoin = 'round';
  c.fillStyle = 'rgba(25,14,6,0.28)'; c.beginPath(); c.ellipse(3, sz * 0.55, sz * 0.7, sz * 0.18, 0, 0, 7); c.fill();
  c.beginPath(); c.moveTo(-sz * 0.5, sz * 0.3); c.lineTo(-sz * 0.2, -sz * 0.45); c.lineTo(sz * 0.45, -sz * 0.2); c.lineTo(sz * 0.55, sz * 0.35); c.closePath();
  c.fillStyle = '#3A2414'; c.fill(); c.strokeStyle = 'rgba(255,248,230,0.85)'; c.lineWidth = 2; c.stroke();
  c.strokeStyle = '#f0d9a8'; c.lineWidth = 2; c.beginPath(); c.moveTo(-sz * 0.2, -sz * 0.45); c.lineTo(sz * 0.45, -sz * 0.2); c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.ellipse(-sz * 0.05, -sz * 0.05, sz * 0.12, sz * 0.05, -0.4, 0, 7); c.fill();
  c.restore();
};
