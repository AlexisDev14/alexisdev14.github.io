// persos.js — « Le premier message d'Internet, LO » (UCLA, nuit du 29 octobre 1969) : marionnettes, accessoires et décors PROPRES À CETTE VIDÉO. Espace M.lo (alias LO). Appeler LO.init() dans S.init.
// Mode d'emploi complet : persos.md (ne pas lire ce fichier en entier). Aucun texte, lettre, chiffre ni logo. Déterministe (hash, jamais Math.random).
// MARIONNETTES : LO.kline / LO.duvall / LO.kleinrock (pose, x, y, s, o) — (x,y) = pieds ; jambes en 3 pièces legX_up/_lo + piedX ; option casque (Kline, Duvall).
// OBJETS TENUS (tenu / tenuB) : 'crayon' 'tournevis' 'telephone' 'cube' ou une fonction de dessin (o, ctx) ; LO.pt(r, nom[, arriere]).
// ACCESSOIRES : LO.cube(x,y,s,{n,lueur,casse,rot,alpha}) ; LO.telephone(x,y,s,{coul,sonne,lumiere,t}) ; LO.cordon(a, b, o) (fil spiralé du casque).
// DÉCORS : LO.labUCLA(t, o) (pleine scène, points LO.P.*) ; LO.labSRI(t, o) (intérieur de vignette) + LO.sriArrivee / LO.sriPt.
(function () {
  'use strict';
  const X = M.X, TAU = M.TAU, PI = Math.PI, D = 180 / PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, hash, smooth } = M;
  const LO = (M.lo = {});
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
  function rrect(x0, y0, x1, y1, r) { return ep(x1 - r, y0 + r, r, r, 4, -PI / 2, 0).concat(ep(x1 - r, y1 - r, r, r, 4, 0, PI / 2), ep(x0 + r, y1 - r, r, r, 4, PI / 2, PI), ep(x0 + r, y0 + r, r, r, 4, PI, PI * 1.5)); }
  const box = (x0, y0, x1, y1) => [[x0, y0, 1], [x1, y0, 1], [x1, y1, 1], [x0, y1, 1]];
  const pc = (pts, base, paint, seed, o) => piece(pts, base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));
  const k01 = (v) => ease(clamp(v || 0));
  const has = (v) => v && v !== 'rien';
  const lerpP = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
  LO.geo = { ep, ell, ribbon, qbez, rrect, box };

  // ------------------------------------------------------------ bras et jambes à articulations rondes (rivet au centre de chaque cercle)
  const R_COUDE = 11.5, LA = 96, LB = Math.hypot(4, 96), PHI = Math.atan2(-4, 96);
  function armR(len, wt) { wt = wt || 15; return ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1, 40], [R_COUDE + 0.5, len - 6]], ep(0, len, R_COUDE, R_COUDE, 10, 0, PI), [[-R_COUDE - 0.5, len - 6], [-wt + 1, 40]]); }
  function foreR(kind) {
    if (kind === 'paume') return ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU).concat([[11, 30], [10, 80, 1], [-9, 80, 1], [-11, 30]]);   // avant-bras sans main (main 'paume' à part)
    const f = X.forePts(kind); return ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU).concat(f.slice(2));
  }
  const legC = (len, wt, rk) => ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1, len * 0.5], [rk + 0.5, len - 4]], ep(0, len, rk, rk, 10, 0, PI), [[-rk - 0.5, len - 4], [-wt + 1, len * 0.5]]);
  const FOOT = (ak, len) => ep(0, 0, ak, ak, 8, PI, TAU).concat([[ak + 2, 2], [len * 0.62, 4], [len * 0.92, 8], [len, 14, 1], [-15, 16, 1], [-15, 6]]);
  // IK deux segments dans le repère du torse ; pick 'bas' (coude le plus bas) | 'avant' (coude devant) ; le coude plie toujours vers l'avant (b ≤ 0)
  function ik2(S, T, pick) {
    const vx = T[0] - S[0], vy = T[1] - S[1];
    const d = clamp(Math.hypot(vx, vy), Math.abs(LA - LB) + 1, LA + LB - 0.5), tv = Math.atan2(-vx, vy);
    const a1 = Math.acos(clamp((LA * LA + d * d - LB * LB) / (2 * LA * d), -1, 1));
    let best = null;
    for (const sg of [1, -1]) {
      const a = tv + sg * a1, E = [S[0] - LA * Math.sin(a), S[1] + LA * Math.cos(a)];
      const cAbs = Math.atan2(-(T[0] - E[0]), T[1] - E[1]) - PHI;
      const b = normA(cAbs - a);
      const sc = (pick === 'avant' ? E[0] : E[1]) + (b <= 0.05 ? 1000 : 0);
      if (!best || sc > best.sc) best = { a: normA(a), b, sc };
    }
    return best;
  }

  // =====================================================================
  // OBJETS — dessinés dans leur repère (origine = base ; grip = point tenu) ; seuls (accessoires) ou tenus (pièce 'objet' de l'avant-bras)
  // =====================================================================
  const NOIR = '#1d1c1e', NOIRL = '#3a383c';
  // ---------------- crayon (incliné, pointe en bas vers l'avant) ; origine = prise
  const CR_A = -0.35;
  function drawCrayon() {
    const c = cx_(); c.save(); c.rotate(CR_A);
    pc([[-4, -40], [4, -40], [4, -34, 1], [-4, -34, 1]], '#a8645a', null, 7101);
    pc([[-4.5, -34, 1], [4.5, -34, 1], [4.5, -27, 1], [-4.5, -27, 1]], '#a9a9a2', () => strokePts([[-4, -31], [4, -31]], 'rgba(60,60,60,0.5)', 0.8), 7102);
    pc([[-4, -27, 1], [4, -27, 1], [4, 20, 1], [0, 30], [-4, 20, 1]], '#c9962e', () => {
      fillPts([[-4, 19], [4, 19], [0, 30]], '#e3cb9b'); fillPts([[-1.3, 26.5], [1.3, 26.5], [0, 31]], '#2a2a2a');
      strokePts([[1.2, -26], [1.2, 18]], 'rgba(255,240,200,0.6)', 1); strokePts([[-1.8, -26], [-1.8, 18]], 'rgba(90,60,20,0.45)', 0.9);
    }, 7103);
    c.restore();
  }
  // ---------------- tournevis (manche ambré, tige d'acier ; pointe vers +x) ; origine = prise (milieu du manche)
  function drawTournevis() {
    pc([[-30, -7], [-24, -10], [12, -9], [16, -6, 1], [16, 6, 1], [12, 9], [-24, 10], [-30, 7]], '#9a4a25', () => {
      for (const y of [-5, 0, 5]) strokePts([[-26, y], [10, y]], 'rgba(60,20,10,0.45)', 1);
      strokePts([[-26, -6], [12, -6]], 'rgba(255,200,150,0.5)', 1.3);
    }, 7201);
    pc([[16, -3.2, 1], [78, -3.2], [86, -1.5, 1], [86, 1.5, 1], [78, 3.2], [16, 3.2, 1]], '#9a9ea4', () => strokePts([[18, -1.6], [80, -1.4]], 'rgba(255,255,255,0.75)', 1), 7202);
  }
  // ---------------- téléphone de bureau 1969 (cadran à trous ronds, sans chiffres) ; origine = milieu du socle
  const TEL_COUL = { beige: ['#d8cbb0', '#bcae90', '#ece2cb'], celadon: ['#9fb8a6', '#82a08b', '#bed2c3'] };
  function telCols(o) { return TEL_COUL[o.coul] || TEL_COUL.beige; }
  function drawTelephone(o) {
    const [b, bD, bL] = telCols(o), c = cx_(), t = o.t || 0, so = clamp(o.sonne || 0);
    const sh = so > 0 ? Math.sin(t * TAU * 11) * 0.035 * so : 0, hop = so > 0 ? -Math.abs(Math.sin(t * TAU * 11)) * 5 * so : 0;
    c.save(); c.rotate(sh);
    // fil spiralé du combiné (côté gauche)
    if (!SIL()) cordonLocal([[-70, -92], [-92, -50], [-66, -12]], 3, 2.0);
    pc([[-74, 0, 1], [74, 0, 1], [72, -9, 1], [-72, -9, 1]], bD, () => hatch(null, 0.1, 3.4, 0.2), 7301);                        // socle
    pc([[-68, -8], [68, -8], [60, -46], [52, -66], [36, -78], [-36, -78], [-52, -66], [-60, -46]], b, () => {                // corps
      strokePts([[-56, -48], [-46, -66], [-30, -74]], 'rgba(255,255,255,0.55)', 2);
      hatch([[30, -80], [70, -80], [70, -6], [30, -6]], 0.8, 3.6, 0.25); shade(-60, -70, 60, 0, 0.22, [-70, -82, 70, -6]);
    }, 7302);
    for (const sx of [-1, 1]) pc([[sx * 30 - 7, -76], [sx * 30 + 7, -76], [sx * 34 + 5, -92, 1], [sx * 34 - 5, -92, 1]], bD, null, 7303 + sx);   // fourches
    // cadran : couronne de trous ronds, disque central nu, butée
    pc(ell(0, -40, 32, 25, 22), bL, () => {
      for (let i = 0; i < 10; i++) { const a = -PI * 0.35 + i * 0.165 * TAU * 0.9; dot(Math.cos(a) * 22, -40 + Math.sin(a) * 17, 4.2, 'rgba(60,50,40,0.55)'); dot(Math.cos(a) * 22 + 0.8, -40 + Math.sin(a) * 17 - 0.8, 2.6, 'rgba(250,245,232,0.9)'); }
    }, 7305);
    pc(ell(0, -40, 11, 8.5, 14), '#efe8d6', () => strokePts([[-6, -43], [5, -43]], 'rgba(150,140,120,0.35)', 1), 7306);
    pc([[24, -26], [30, -24], [34, -16, 1], [30, -18]], '#9a9ea4', null, 7307);
    if ((o.lumiere || 0) > 0 && !SIL()) {                                                               // voyant de ligne
      const l = clamp(o.lumiere), g = c.createRadialGradient(52, -18, 1, 52, -18, 22);
      g.addColorStop(0, `rgba(255,190,80,${0.9 * l})`); g.addColorStop(1, 'rgba(255,190,80,0)'); c.fillStyle = g; c.fillRect(28, -42, 48, 48);
    }
    dot(52, -18, 4, (o.lumiere || 0) > 0.3 ? '#ffcf6a' : '#8b7a5a');
    // combiné posé (sautille quand ça sonne)
    c.save(); c.translate(0, hop);
    pc([[-82, -86], [-74, -100], [-58, -104], [-44, -98], [-30, -104], [30, -104], [44, -98], [58, -104], [74, -100], [82, -86], [76, -82], [56, -86], [40, -92], [-40, -92], [-56, -86], [-76, -82]], bD, () => {
      strokePts([[-70, -99], [-50, -101], [-30, -101], [30, -101], [50, -101], [70, -99]], 'rgba(255,255,255,0.45)', 1.6);
      hatch([[-82, -92], [82, -92], [82, -80], [-82, -80]], 0.1, 3, 0.22);
    }, 7308);
    c.restore();
    c.restore();
    if (so > 0 && !SIL()) {                                                                             // ondes de sonnerie (arcs)
      c.save(); c.strokeStyle = `rgba(60,40,20,${0.55 * so * (0.5 + 0.5 * Math.sin(t * TAU * 5))})`; c.lineWidth = 2.4;
      for (const sx of [-1, 1]) for (let i = 0; i < 2; i++) { c.beginPath(); c.arc(sx * 70, -96, 22 + i * 13, sx > 0 ? -0.9 : PI - 0.25, sx > 0 ? 0.25 : PI + 0.9); c.stroke(); }
      c.restore();
    }
  }
  // fil spiralé (repère courant) : boucles le long d'une courbe
  function cordonLocal(ptsC, w, lw, col) {
    const c = cx_(), P = qbez(ptsC[0], ptsC[1], ptsC[2], 40);
    let L = 0; for (let i = 1; i < P.length; i++) L += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
    const n = Math.max(6, Math.round(L / 5));
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    const line = []; for (let i = 0; i <= n * 3; i++) {
      const u = i / (n * 3), j = Math.min(P.length - 2, Math.floor(u * (P.length - 1))), f = u * (P.length - 1) - j;
      const a = P[j], b = P[j + 1], x = lerp(a[0], b[0], f), y = lerp(a[1], b[1], f), dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
      const ph = u * n * TAU; line.push([x - dy / l * Math.sin(ph) * w + dx / l * Math.cos(ph) * w * 0.6, y + dx / l * Math.sin(ph) * w + dy / l * Math.cos(ph) * w * 0.6]);
    }
    c.beginPath(); line.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
    c.strokeStyle = col || '#151416'; c.lineWidth = lw; c.stroke();
    c.strokeStyle = 'rgba(200,200,210,0.35)'; c.lineWidth = Math.max(0.6, lw * 0.35); c.stroke();
    c.restore();
  }
  // fil spiralé entre deux points ÉCRAN (casque → téléphone) : o.mou (px, 50), o.lw (2.4), o.boucle (rayon des spires, 4)
  LO.cordon = function (a, b, o) {
    if (SIL() || !a || !b) return; o = o || {};
    const mou = o.mou == null ? 50 : o.mou, m = [(a[0] + b[0]) / 2, Math.max(a[1], b[1]) + mou];
    cordonLocal([a, m, b], o.boucle || 4, o.lw || 2.4, o.col);
  };

  // ---------------- cube-lettre (bois peint de trois quarts, AUCUN signe) ; origine = CENTRE du cube
  const CUBE_COUL = ['#c9962e', '#4f6f8f', '#9a2f25', '#5d7a4a', '#6d4a6b'];
  LO.CUBES = CUBE_COUL;
  const CF = [[-44, 41], [22, 41], [22, -25], [-44, -25]];               // face avant
  const CT = [[-44, -25], [22, -25], [44, -41], [-22, -41]];             // dessus
  const CS = [[22, 41], [44, 25], [44, -41], [22, -25]];                 // flanc
  function cubeBody(col, seed) {
    const L = M.mixc(col, '#ffffff', 0.28), Dk = M.mixc(col, '#000000', 0.32);
    pc(CS.map((p) => [p[0], p[1], 1]), Dk, () => { for (const y of [-20, 0, 18]) strokePts([[24, y + 12], [42, y]], 'rgba(0,0,0,0.18)', 1); }, seed + 1);
    pc(CT.map((p) => [p[0], p[1], 1]), L, () => { strokePts([[-36, -30], [30, -30]], 'rgba(255,255,255,0.3)', 1.2); for (const x of [-30, -6, 16]) strokePts([[x, -26], [x + 18, -39]], 'rgba(90,60,30,0.16)', 1); }, seed + 2);
    pc(CF.map((p) => [p[0], p[1], 1]), col, () => {
      for (const y of [-14, -2, 12, 27]) strokePts([[-42, y], [-20, y + 2], [0, y - 1], [20, y + 1]], 'rgba(60,40,20,0.17)', 1.1);   // fil du bois
      strokePts([[-41, -21], [19, -21]], 'rgba(255,255,255,0.45)', 2); strokePts([[18, -21], [18, 37]], 'rgba(0,0,0,0.2)', 2);    // biseaux
      strokePts([[-40, -20], [-40, 37]], 'rgba(255,255,255,0.3)', 1.6); hatch([[-4, -25], [22, -25], [22, 41], [-4, 41]], 0.8, 3.8, 0.16);
    }, seed + 3);
  }
  function drawCube(o) {
    const n = ((o.n | 0) % 5 + 5) % 5, col = o.coul || CUBE_COUL[n], c = cx_(), lu = clamp(o.lueur || 0), ca = clamp(o.casse || 0), t = o.t || 0;
    if (lu > 0 && !SIL()) {
      const g = c.createRadialGradient(0, 0, 10, 0, 0, 110); g.addColorStop(0, `rgba(255,214,120,${0.75 * lu})`); g.addColorStop(0.5, `rgba(240,190,90,${0.3 * lu})`); g.addColorStop(1, 'rgba(240,190,90,0)');
      c.fillStyle = g; c.fillRect(-115, -115, 230, 230);
      c.save(); c.strokeStyle = `rgba(255,226,150,${0.55 * lu})`; c.lineWidth = 2.2;
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + t * 0.6, r0 = 62, r1 = 82 + 8 * Math.sin(t * 4 + i); c.beginPath(); c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); c.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); c.stroke(); }
      c.restore();
    }
    if (ca <= 0) { cubeBody(col, 7400 + n * 10); }
    else {
      // fente en zigzag au milieu ; deux moitiés qui s'écartent, petite bouffée de fumée
      const Z = [[-8, -44], [-2, -30], [-12, -12], [-4, 6], [-14, 22], [-6, 44]], e = ease(ca);
      const half = (side) => {
        c.save(); c.translate(side * 16 * e, 6 * e * e); c.rotate(side * 0.16 * e);
        c.beginPath(); if (side < 0) { c.moveTo(-60, -60); Z.forEach((p) => c.lineTo(p[0] + 8, p[1])); c.lineTo(-60, 60); }
        else { c.moveTo(60, -60); Z.forEach((p) => c.lineTo(p[0] + 8, p[1])); c.lineTo(60, 60); }
        c.closePath(); c.save(); c.clip(); cubeBody(col, 7400 + n * 10); c.restore();
        strokePts(Z.map((p) => [p[0] + 8, p[1]]), 'rgba(40,25,15,0.85)', 2.2);
        if (!SIL()) strokePts(Z.map((p) => [p[0] + 8 + side * 2, p[1]]), 'rgba(235,215,180,0.9)', 1.2);
        c.restore();
      };
      half(-1); half(1);
      if (!SIL()) {
        const fu = Math.sin(PI * clamp((ca - 0.05) / 0.95));
        for (let i = 0; i < 5; i++) {
          const u = clamp(ca * 1.3 - i * 0.08), r = (10 + 18 * u) * (0.7 + 0.1 * i);
          c.beginPath(); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU, rr = r * (0.82 + 0.18 * Math.sin(k * 2.1 + i)); c.lineTo(8 + (i - 2) * 8 + Math.cos(a) * rr, -30 - 34 * u - i * 4 + Math.sin(a) * rr * 0.8); }
          c.closePath(); c.fillStyle = `rgba(150,145,138,${0.55 * fu})`; c.fill();
        }
      }
    }
  }

  // registre : grip = point tenu dans le poing ; p2 = seconde prise ; pts = points nommés ; base = origine de l'accessoire seul ; held = options par défaut en main
  const OBJ = {
    crayon: { draw: drawCrayon, grip: [0, 0], pts: { pointe: [30 * Math.sin(-CR_A) * 1.03, 30 * Math.cos(CR_A)] }, base: [0, 0] },
    tournevis: { draw: drawTournevis, grip: [-8, 0], pts: { pointe: [86, 0] }, base: [0, 0] },
    telephone: { draw: drawTelephone, grip: [70, -46], p2: () => [-66, -46], held: { taille: 0.6 }, pts: { prise: [-66, -10], combine: [0, -100], centre: [0, -46] }, base: [0, 0] },
    cube: { draw: drawCube, grip: [22, 6], p2: () => [-44, 6], held: { taille: 0.7 }, pts: { centre: [0, 0], dessus: [0, -41] }, base: [0, 0] },
  };
  LO.OBJ = OBJ;
  const vOf = (v, o) => (typeof v === 'function' ? v(o) : v);
  function heldOpts(name, o, p) { const ob = typeof name === 'string' ? OBJ[name] : null; return Object.assign({ t: p.t || 0 }, (ob && ob.held) || {}, o || {}); }
  function heldDraw(name, o, p) {
    const c = cx_(), oo = heldOpts(name, o, p), k = oo.taille || 1;
    if (typeof name === 'function') { c.save(); c.scale(k, k); name(oo, c); c.restore(); return; }
    const ob = OBJ[name]; if (!ob) return;
    const g = vOf(ob.grip, oo);
    c.save(); c.scale(k, k); c.translate(-g[0], -g[1]); ob.draw(oo); c.restore();
  }
  const DOIGTS = [[-13, -9], [9, -11], [12, -4], [12, 6], [6, 11], [-6, 11], [-13, 4]];
  const doigtsPaint = () => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(70,40,30,0.5)', 1); hatch(null, 0.9, 3.4, 0.15); };
  const HAND_OPEN = [[-8, 78], [8, 78], [12, 86], [18, 95], [15, 99], [10, 94], [10, 104], [8, 114], [2, 119], [-5, 117], [-9, 105], [-9, 90]];
  // main « paume vers le haut » (voilà) : repère de la main, doigts vers +y, paume du côté +x
  const PAUME = [[-8, -2], [8, -2], [12, 4], [16, 10], [14, 16], [9, 17], [9, 26], [12, 36], [16, 43], [12, 47], [4, 45], [-4, 38], [-8, 26], [-9, 12]];
  function heldParts(skin, seed) {
    return {
      objet: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (has(p.tenu)) heldDraw(p.tenu, p.tenuO, p); } },
      doigts: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 2, pts: (p) => (has(p.tenu) ? DOIGTS : OFFP), paint: doigtsPaint },
      objetB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 3, pts: OFFP, extra: (p) => { if (has(p.tenuB)) heldDraw(p.tenuB, p.tenuBO, p); } },
      doigtsB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 4, pts: (p) => (has(p.tenuB) && !p._deux ? DOIGTS : OFFP), paint: doigtsPaint },
      doigtsB2: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 6, pts: (p) => (p._deux ? DOIGTS : OFFP), paint: doigtsPaint },
      // main arrière ouverte posée DEVANT le torse (main sur le cœur, mains en surprise) : dessinée après le torse
      mainB2: { parent: 'armB_lo', at: [0, 0], noRivet: true, base: skin, seed: seed + 7, pts: (p) => (p._mainB && !has(p.tenuB) && !p._deux ? HAND_OPEN : OFFP), paint: () => X.handPaint(null, 'open') },
      paume: { parent: 'armF_lo', at: [0, 79], noRivet: true, base: skin, seed: seed + 8, pts: (p) => (p.handF === 'paume' ? PAUME : OFFP), paint: () => {
        strokePts([[9, 26], [5, 34], [6, 40]], 'rgba(70,40,30,0.45)', 1); strokePts([[-6, 12], [6, 14]], 'rgba(70,40,30,0.35)', 1); hatch([[-10, -2], [0, -2], [0, 48], [-10, 48]], 0.9, 3.4, 0.22);
      } },
    };
  }
  // point nommé de l'objet tenu → [x, y] écran (fonction de dessin : o.pts = { nom: [x,y] } dans le repère du poing)
  LO.pt = function (r, nom, arriere) {
    const name = arriere ? r.tenuB : r.tenu, oo = (arriere ? r.tenuBO : r.tenuO) || {}, k = oo.taille || 1, part = arriere ? 'objetB' : 'objet';
    if (typeof name === 'function') { const q = oo.pts && oo.pts[nom]; return q ? r.w(part, q[0] * k, q[1] * k) : null; }
    const ob = OBJ[name]; if (!ob || !ob.pts[nom]) return null;
    const g = vOf(ob.grip, oo), q = ob.pts[nom];
    return r.w(part, (q[0] - g[0]) * k, (q[1] - g[1]) * k);
  };

  // =====================================================================
  // POSES — préparation commune, IK interne (repère du torse), objets tenus, seconde main
  // =====================================================================
  function prep(p) {
    p = p || {}; const q = Object.assign({}, p, { ang: Object.assign({}, p.ang), hide: Object.assign({}, p.hide), face: Object.assign({}, p.face) });
    const A = q.ang;
    if (A.legF != null) { A.legF_up = (A.legF_up || 0) + A.legF; delete A.legF; }
    if (A.legB != null) { A.legB_up = (A.legB_up || 0) + A.legB; delete A.legB; }
    if (q.tenuO) q.tenuO = Object.assign({}, q.tenuO);
    A.head = A.head || 0;
    return q;
  }
  const blend = (q, n, v, k) => { q.ang[n] = lerp(q.ang[n] || 0, v, k); };
  function armTo(q, def, arm, T, pick, k) {
    if (k <= 0) return;
    const sol = ik2(def.parts[arm + '_up'].at, T, pick), A = q.ang;
    const a0 = A[arm + '_up'] || 0, b0 = A[arm + '_lo'] || 0;
    A[arm + '_up'] = a0 + normA(sol.a - a0) * k; A[arm + '_lo'] = b0 + normA(sol.b - b0) * k;
  }
  function headRot(q, def) { const h = def.parts.head; return (q.ang.head || 0) + (h.rest || 0); }
  function headPt(q, def, hx, hy) { const h = def.parts.head; return mp(new DOMMatrix().translate(h.at[0], h.at[1]).rotate(headRot(q, def) * D), [hx, hy]); }
  function toTorso(env, q, P0) { const { mats } = M.partMatrices(env.def, q, env.x, env.y, env.s, env.dir); const p = new DOMPoint(P0[0], P0[1]).matrixTransform(mats.torso.inverse()); return [p.x, p.y]; }
  function marche(q, k, t, amp) {                                 // pas sur place (la scène déplace x) ; k 0..1
    if (k <= 0) return; const ph = t * TAU * 1.5, s = Math.sin(ph), A = q.ang; amp = amp || 0.34;
    A.legF_up = (A.legF_up || 0) + amp * s * k; A.legB_up = (A.legB_up || 0) - amp * s * k;
    A.legF_lo = (A.legF_lo || 0) + 0.42 * Math.max(0, Math.sin(ph - 1.3)) * k; A.legB_lo = (A.legB_lo || 0) + 0.42 * Math.max(0, Math.sin(ph + PI - 1.3)) * k;
    A.piedF = (A.piedF || 0) - 0.5 * (A.legF_up + A.legF_lo) * k; A.piedB = (A.piedB || 0) - 0.5 * (A.legB_up + A.legB_lo) * k;
    q.dy = (q.dy || 0) - Math.abs(Math.cos(ph)) * 5 * k;
    A.armF_up = (A.armF_up || 0) - 0.18 * s * k; A.armB_up = (A.armB_up || 0) + 0.18 * s * k;
  }
  function assis(q, env, k) {                                     // hanche posée sur le tabouret (`siege` = y écran de l'assise, sinon hauteur de tabouret)
    if (k <= 0) return; const def = env.def, A = q.ang, L = def._legs, hip = -def.hipY;
    const seat = env.siege != null ? hip - (env.y - env.siege) / env.s - 14 : hip - (L.sh + 30) + 2;
    q.dy = (q.dy || 0) + seat * k;
    A.legF_up = (A.legF_up || 0) - 1.45 * k; A.legB_up = (A.legB_up || 0) - 1.35 * k;
    A.legF_lo = (A.legF_lo || 0) + 1.3 * k; A.legB_lo = (A.legB_lo || 0) + 1.2 * k; A.piedF = (A.piedF || 0) + 0.15 * k; A.piedB = (A.piedB || 0) + 0.15 * k;
    q.tilt = (q.tilt || 0) + 0.02 * k;
  }
  // gestes communs (Kline et Duvall)
  function gTape(q, env, def, k, t) {                             // deux mains sur le clavier, doigts qui frappent
    if (k <= 0) return;
    let TF = [94, -44], TB = [80, -40];
    if (q.clavier) { const T = toTorso(env, q, q.clavier); TF = [T[0] + 8, T[1] - 16]; TB = [T[0] - 10, T[1] - 14]; }
    const f1 = 8 * Math.max(0, Math.sin(t * TAU * 3.1)), f2 = 8 * Math.max(0, Math.sin(t * TAU * 3.1 + 2.3));
    armTo(q, def, 'armF', [TF[0], TF[1] - f1], 'bas', k); armTo(q, def, 'armB', [TB[0], TB[1] - f2], 'bas', k);
    q.ang.head += 0.16 * k;
    if (k > 0.4) { if (!has(q.tenu)) q.handF = 'open'; if (!has(q.tenuB)) q.handB = 'open'; }
    if (q.expr == null && k > 0.5) q.expr = 'concentre';
  }
  function gEcoute(q, env, def, k) {                              // main avant posée sur l'écouteur (l'avant-bras passe derrière le visage)
    if (k <= 0) return;
    armTo(q, def, 'armF', headPt(q, def, -16, -38), 'bas', k); q.ang.head += 0.05 * k;
    if (k > 0.4 && !has(q.tenu)) { q.handF = 'open'; q._oreille = true; }
    if (q.expr == null && k > 0.5) q.expr = 'concentre';
  }
  function finish(q, def) {
    const A = q.ang, tl = q.tilt || 0;
    if (has(q.tenu) && !(q.handF && q.handF !== 'fist' && q.handF !== 'open')) q.handF = 'fist';
    if (has(q.tenu) && q.handF === 'open') q.handF = 'fist';
    if (has(q.tenuB)) q.handB = 'fist';
    if (q.droit == null && has(q.tenu)) q.droit = true;
    if (q.droitB == null && has(q.tenuB)) q.droitB = true;
    if (q.droit) A.objet = (A.objet || 0) - ((A.armF_up || 0) + (A.armF_lo || 0) + tl);
    if (q.droitB) A.objetB = (A.objetB || 0) - ((A.armB_up || 0) + (A.armB_lo || 0) + tl);
    A.armFh_lo = A.armF_lo || 0;
    if (q.handF === 'paume') A.paume = (A.paume || 0) - PI / 2 - ((A.armF_up || 0) + (A.armF_lo || 0) + tl);
    q._deux = false;
    const ob = typeof q.tenu === 'string' ? OBJ[q.tenu] : null, oo = heldOpts(q.tenu, q.tenuO, q);
    const p2 = (ob && ob.p2) ? ob.p2(oo) : (oo.p2 || null);
    if (q.deuxMains && has(q.tenu) && p2) {
      const g = ob ? vOf(ob.grip, oo) : [0, 0], SF = def.parts.armF_up.at, k = oo.taille || 1;
      const Hf = new DOMMatrix().translate(SF[0], SF[1]).rotate((A.armF_up || 0) * D).translate(0, LA).rotate((A.armF_lo || 0) * D).translate(4, 96).rotate((A.objet || 0) * D).scale(k, k).translate(-g[0], -g[1]);
      const sol = ik2(def.parts.armB_up.at, mp(Hf, p2), 'bas');
      A.armB_up = sol.a; A.armB_lo = sol.b; q.handB = 'fist'; q._deux = true;
    }
    return q;
  }
  function run(def, q, x, y, s, o) {
    const r = M.puppet(def, q, x, y, s, Object.assign({ slot: M.ST.slotF, nom: def.nom }, o || {}));
    r.tenu = q.tenu; r.tenuB = q.tenuB; r.pose = q; r.s = s;
    if (has(q.tenu)) r.tenuO = heldOpts(q.tenu, q.tenuO, q);
    if (has(q.tenuB)) r.tenuBO = heldOpts(q.tenuB, q.tenuBO, q);
    r.main = r.w('armF_lo', 2, 98); r.mainB = r.w('armB_lo', 2, 98);
    r.tete = r.w('head', 0, -108);
    if (q.casque) r.fil = r.w('head', FIL[0], FIL[1]);
    return r;
  }
  function wrap(def, poseFn, sDef) {
    return (pose, x, y, s, o) => {
      o = o || {}; s = s == null ? sDef : s;
      const q = prep(pose), env = { def, x, y, s, dir: o.dir || 1, siege: q.siege };
      poseFn(q, env);
      finish(q, def);
      if (def._before) def._before(q, env, o);
      const r = run(def, q, x, y, s, o);
      if (def._after) def._after(r, q, env);
      return r;
    };
  }

  // ---------------- pièces de corps communes
  function upDef(at, base, seed, o) {
    o = o || {};
    return { parent: 'torso', at, pts: armR(LA, o.wt), base, seed, paint: () => {
      if (o.manche != null) { fillPts([[-30, o.manche, 1], [30, o.manche, 1], [30, 130, 1], [-30, 130, 1]], o.peau); strokePts([[-15, o.manche], [15, o.manche - 1]], 'rgba(90,80,60,0.6)', 1.4); }
      if (o.coudiere) fillPts(ell(-3, 86, 10, 13, 12), o.coudiere);
      if (o.paint) o.paint();
      hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.28);
    } };
  }
  function foreDef(parent, base, skin, back, seed, o) {
    o = o || {}; const hk = (p) => (back ? p.handB : p.handF) || 'fist';
    return { parent, at: [0, LA], pts: (p) => foreR(hk(p) === 'paume' ? 'paume' : hk(p)), base, seed, paint: (p) => {
      const k = hk(p);
      if (o.coudiere) fillPts(ell(-3, 6, 10, 12, 12), o.coudiere);
      if (o.paint) o.paint(p);
      if (k !== 'paume') { fillPts([[-20, 76, 1], [20, 76, 1], [24, 130, 1], [-20, 130, 1]], skin); X.handPaint(null, k); }
      if (o.cuff) fillPts([[-14, 62, 1], [14, 62, 1], [15, 78, 1], [-14, 78, 1]], o.cuff);
      hatch([[-14, -10], [-3, -10], [-3, 60], [-14, 60]], 0.9, 3.8, back ? 0.3 : 0.2);
    } };
  }
  function legParts(L, seed) {
    const thigh = (back) => ({ parent: 'torso', at: [back ? -L.hx : L.hx, -2], pts: legC(L.th, L.wt, L.kt), base: back ? L.colD : L.col, seed: seed + (back ? 1 : 2), noRivet: !!back,
      paint: () => { strokePts([[9, 6], [10, L.th - 6]], 'rgba(255,255,255,0.12)', 1.2); hatch(back ? null : [[-L.wt, -10], [-4, -10], [-4, L.th], [-L.wt, L.th]], 0.8, 3.8, back ? 0.3 : 0.22); } });
    const shin = (back) => ({ parent: back ? 'legB_up' : 'legF_up', at: [0, L.th], pts: legC(L.sh, L.kt, L.ak), base: back ? L.colD : L.col, seed: seed + (back ? 3 : 4), noRivet: !!back,
      paint: () => { if (L.chaussette) fillPts(box(-20, L.sh - 12, 20, L.sh + 12), L.chaussette); hatch(back ? null : [[-L.kt, -6], [-3, -6], [-3, L.sh], [-L.kt, L.sh]], 0.8, 3.8, back ? 0.3 : 0.2); } });
    const foot = (back) => ({ parent: back ? 'legB_lo' : 'legF_lo', at: [0, L.sh], pts: FOOT(L.ak + 1, L.fl), base: back ? L.shoeD : L.shoe, seed: seed + (back ? 5 : 6), noRivet: true,
      paint: () => { strokePts([[6, 3], [L.fl * 0.75, 7]], back ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.3)', 1.5); if (L.mocassin) strokePts([[L.fl * 0.3, 3], [L.fl * 0.62, 5], [L.fl * 0.75, 9]], 'rgba(30,15,8,0.6)', 1.2); fillPts(box(-16, 13, L.fl + 1, 17), '#120d0a'); } });
    return { legB_up: thigh(true), legB_lo: shin(true), piedB: foot(true), legF_up: thigh(false), legF_lo: shin(false), piedF: foot(false) };
  }
  // geste `ecoute` : l'avant-bras avant (copie armFh_lo) passe DERRIÈRE la tête, la main (mainH) se pose sur l'écouteur, devant
  const oreille = (d) => { const f = d.pts; d.pts = (p) => (p._oreille ? OFFP : f(p)); return d; };
  const cache = (d) => { const f = d.pts; d.noRivet = true; d.pts = (p) => (p._oreille ? f(Object.assign({}, p, { handF: 'open' })) : OFFP); return d; };
  const mainH = (skin, seed) => ({ parent: 'armF_lo', at: [0, 0], noRivet: true, base: skin, seed, pts: (p) => (p._oreille ? HAND_OPEN : OFFP), paint: () => X.handPaint(null, 'open') });
  const ORDER = (heads, mid, behind) => ['armB_up', 'armB_lo', 'objetB', 'doigtsB', 'legB_up', 'legB_lo', 'piedB', 'legF_up', 'legF_lo', 'piedF'].concat(behind || [], ['head']).concat(heads, ['torso'], mid || [], ['mainB2', 'armF_up', 'armF_lo', 'paume', 'objet', 'doigts', 'doigtsB2']);

  // ---------------- visage : œil, sourcil, bouche
  function oeil(x, y, o) {
    o = o || {}; const lid = clamp(o.lid || 0), w = o.wide ? 1.35 : 1, sz = o.sz || 1;
    if (o.heureux) { strokePts([[x - 7 * sz, y + 1], [x - 1, y - 3.5 * sz], [x + 6 * sz, y]], 'rgba(30,18,16,0.95)', 2.1); return; }
    if (lid > 0.85) { strokePts([[x - 7 * sz, y - 0.5], [x, y + 2.4 * sz], [x + 6.5 * sz, y - 0.5]], 'rgba(30,18,16,0.95)', 2.1); return; }
    const h = (1 - lid) * w;
    fillPts([[x - 6.5 * sz, y], [x - 1 * sz, y - 3.6 * sz * h], [x + 6 * sz, y - 1.2 * sz * h], [x + 2.8 * sz, y + 2 * sz * w], [x - 4 * sz, y + 1.2 * sz]], '#efe8da', 0, 0);
    const lx = (o.look ? o.look[0] : 0), ly = (o.look ? o.look[1] : 0);
    if (o.iris) dot(x + 2 * sz + lx, y - 0.4 * sz * h + ly, 2.6 * sz * Math.min(1.1, w), o.iris);
    dot(x + 2.2 * sz + lx, y - 0.5 * sz * h + ly, (o.iris ? 1.3 : 2.0) * sz, '#1f1716');
    strokePts([[x - 7 * sz, y + 0.2], [x - 1 * sz, y - 3.9 * sz * h], [x + 6.5 * sz, y - 1.4 * sz * h]], 'rgba(28,16,14,0.95)', 1.9);
    if (lid > 0.2) fillPts([[x - 7 * sz, y - 4.5 * sz], [x + 7 * sz, y - 4.5 * sz], [x + 6.5 * sz, y - 1.4 * sz * h], [x - 1 * sz, y - 3.9 * sz * h], [x - 7 * sz, y + 0.2]], o.peau || M.P.peau, 0, 0);
  }
  function sourcil(x, y, o) {
    o = o || {}; const r = o.leve || 0, f = o.fronce || 0, lw = o.lw || 2.6;
    strokePts([[x - 9, y - 1 - 2 * r + 1.5 * f], [x - 1, y - 3.5 - 4.5 * r + 0.5 * f], [x + 8, y - 1.5 - 2.5 * r + 3 * f]], o.col || 'rgba(45,28,20,0.95)', lw);
  }
  function bouche(x, y, kind, o) {
    o = o || {}; const col = o.col || 'rgba(110,40,38,0.95)';
    if (kind === 'o') { fillPts([[x - 3.5, y - 3], [x + 1.5, y - 3.5], [x + 2, y + 3], [x - 3.5, y + 3.5]], '#3a1714', 0, 0); return; }
    if (kind === 'bee') { const j = o.jaw || 10; fillPts([[x - 6, y - 2], [x + 3, y - 3], [x + 4, y + j], [x - 2, y + j + 1], [x - 7, y + j * 0.6]], '#3a1714', 0, 0); return; }
    if (kind === 'sourire') { strokePts([[x + 2, y - 1.5], [x - 4, y + 1], [x - 10, y - 3]], col, 2); return; }
    if (kind === 'rire') { fillPts([[x + 3, y - 2], [x - 10, y - 3], [x - 4, y + 7]], '#3a1714', 0, 0); strokePts([[x + 2, y - 2], [x - 9, y - 3]], '#f1ece0', 1.5); return; }
    if (kind === 'serre') { strokePts([[x + 1, y], [x - 9, y + 1.4]], col, 2.1); return; }
    if (kind === 'moue') { strokePts([[x + 1, y + 0.5], [x - 4, y + 1], [x - 9, y + 3]], col, 1.9); return; }
    strokePts([[x + 1, y], [x - 4, y + 0.8], [x - 9, y + 0.2]], col, 1.7);
  }
  const MOUTH = { n: 'n', o: 'o', smile: 'sourire', tight: 'serre' };
  const EXPR = {
    neutre: { bouche: 'n' }, concentre: { bouche: 'serre', fronce: 0.4, look: [0.5, 0.6] }, surpris: { wide: true, leve: 1.3, bouche: 'o' },
    sourire: { bouche: 'sourire', leve: 0.2 }, ravi: { heureux: true, bouche: 'rire', leve: 0.7 }, panique: { wide: true, leve: 1.2, fronce: -0.9, bouche: 'bee', jaw: 9 },
    soulage: { lid: 0.6, bouche: 'sourire', leve: 0.4, fronce: -0.3 }, serein: { lid: 1, bouche: 'sourire', leve: 0.3 }, inquiet: { fronce: -0.8, leve: 0.5, bouche: 'moue' },
  };
  LO.EXPR = Object.keys(EXPR);
  function visage(p, ex, eo) {
    const f = p.face || {}, e = Object.assign({}, EXPR[p.expr || 'neutre'] || EXPR.neutre, f.e || {});
    oeil(ex.ox, ex.oy, { iris: eo.iris, lid: f.eyes === 'closed' ? 1 : f.eyes === 'half' ? 0.5 : e.lid || 0, wide: e.wide || f.eyes === 'wide', heureux: e.heureux, look: e.look, peau: eo.peau, sz: eo.sz });
    sourcil(ex.ox, ex.oy - 10 - (e.leve || 0) * 1.2, { leve: e.leve || 0, fronce: e.fronce || 0, lw: eo.lw || 2.8, col: eo.brow });
    bouche(ex.bx, ex.by, f.mouth ? (MOUTH[f.mouth] || f.mouth) : (e.bouche || 'n'), { jaw: e.jaw, col: eo.levres });
  }

  // ---------------- casque téléphonique 1969 (arceau noir, un écouteur, micro en tige, fil spiralé jusqu'au point `fil`)
  const FIL = [-22, 40];                     // point nommé `fil` (repère de la tête) : bout du fil spiralé, sur l'épaule arrière
  function casqueParts(seed) {
    return {
      casque: { parent: 'head', at: [0, 0], noRivet: true, base: '#000', seed, pts: OFFP, extra: (p) => {
        if (!p.casque) return;
        pc(ribbon([[-9, -50], [-11, -78], [-8, -104], [0, -114], [10, -116]], 7, 6), NOIR, () => strokePts([[-12, -60], [-12, -84], [-8, -104]], 'rgba(255,255,255,0.3)', 1.2), seed + 1);
        pc(ribbon([[-4, -38], [12, -28], [26, -22], [36, -21]], 4, 3), NOIRL, null, seed + 2, { drop: false });                     // tige du micro
        pc(ell(39, -21, 5, 4, 10), NOIR, () => dot(40, -22, 1.6, '#77747a'), seed + 3);
        pc(ell(-8, -44, 12, 14, 16), NOIR, () => { strokePts(ep(-8, -44, 8, 10, 8, -2.4, -0.6), 'rgba(255,255,255,0.35)', 1.4); dot(-8, -44, 3.5, '#4a474e'); }, seed + 4);
      } },
      casqueFil: { parent: 'head', at: [0, 0], noRivet: true, base: '#000', seed: seed + 5, pts: OFFP, extra: (p) => {
        if (!p.casque || SIL()) return;
        cordonLocal([[-10, -32], [-22, 0], [FIL[0], FIL[1]]], 3, 2.2);
      } },
    };
  }

  // =====================================================================
  // CHARLEY KLINE — étudiant de 25 ans, mince ; chemise blanche à manches courtes, cravate étroite bleu nuit, pantalon gris,
  // mocassins bruns ; cheveux bruns courts raie de côté ; grosses lunettes à monture noire épaisse
  // =====================================================================
  const KL = { peau: '#e3c09c', peauD: '#c7a07c', chemise: '#e8e2d0', chemiseD: '#cfc8b4', col: '#f4f0e6', cravate: '#23304a', pant: '#6b6a66', pantD: '#585753',
    mocassin: '#5c3a22', mocassinD: '#462c1a', cheveux: '#4a3020', monture: '#141214', iris: '#4a3626' };
  const KL_TORSO = [[-13, -176], [8, -180], [17, -168], [24, -150], [28, -112], [28, -62], [26, -14], [28, 24], [29, 42, 1], [-29, 44, 1], [-31, 10], [-29, -40], [-31, -108], [-30, -148], [-23, -168]];
  const KL_HEAD = [[-13, 16], [9, 16], [11, 4], [16, -4], [24, -8], [27, -15], [26, -21], [28, -26], [27, -30], [30, -35], [36, -43, 1], [31, -48], [28, -55], [29, -64], [27, -78], [16, -92], [-5, -98], [-24, -91], [-33, -71], [-32, -47], [-25, -29], [-17, -8]];
  const KL_HAIR = [[28, -76], [33, -88], [27, -100], [12, -108], [-6, -110], [-22, -104], [-33, -90], [-37, -72], [-35, -54], [-29, -44], [-24, -56], [-16, -70], [-2, -80], [14, -84], [24, -82]];
  function mkKline() {
    const L = { th: 120, sh: 112, hx: 6, wt: 15, kt: 11, ak: 8.5, fl: 46, col: KL.pant, colD: KL.pantD, shoe: KL.mocassin, shoeD: KL.mocassinD, mocassin: true, chaussette: '#2b2a2e' };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: KL_TORSO, base: KL.chemise, seed: 21001, paint: () => {
        fillPts([[-40, 14, 1], [40, 14, 1], [40, 60, 1], [-40, 60, 1]], KL.pant);                                       // pantalon (taille haute)
        fillPts([[-40, 8, 1], [40, 8, 1], [40, 16, 1], [-40, 16, 1]], '#2e2016'); dot(22, 12, 3, '#b49a5a');            // ceinture, boucle
        fillPts([[2, -182], [15, -176], [19, -160], [12, -150], [6, -166]], KL.col);                                      // col
        fillPts([[11, -168], [16, -166], [19, -128], [20, -60], [15, -54], [12, -62], [12, -130]], KL.cravate);          // cravate étroite
        strokePts([[13, -164], [15, -150]], 'rgba(255,255,255,0.25)', 1);
        strokePts([[20, -150], [24, -60], [25, 6]], 'rgba(90,80,60,0.45)', 1.2); for (const y of [-120, -86, -52, -18]) dot(23 + (y + 120) * 0.012, y, 1.8, '#9a9384');
        fillPts(box(-6, -128, 14, -104), 'rgba(140,130,110,0.2)'); strokePts([[-6, -128], [14, -128]], 'rgba(90,80,60,0.55)', 1.1);   // poche + stylos
        fillPts(box(-3, -138, 0, -122), '#23304a'); fillPts(box(3, -136, 6, -122), '#7a2a24'); fillPts(box(8, -134, 11, -122), '#2a2a2a');
        hatch([[-50, -170], [-12, -170], [-10, 44], [-50, 44]], 0.75, 4.2, 0.26);
        shade(40, 0, -40, 0, 0.24);
      } },
      armB_up: upDef([-10, -146], KL.chemiseD, 21004, { manche: 48, peau: KL.peauD, wt: 14 }),
      armB_lo: foreDef('armB_up', KL.peauD, KL.peauD, true, 21005),
      head: { parent: 'torso', at: [6, -174], pts: KL_HEAD, base: KL.peau, seed: 21006, noRivet: true, paint: (p) => {
        X.earPaint(-8, -44);
        hatch([[-22, -42], [2, -32], [10, -12], [-6, 14], [-32, 4]], 0.6, 3.6, 0.22);
        dot(15, -34, 7, 'rgba(205,130,110,0.16)');
        visage(p, { ox: 19, oy: -52, bx: 28, by: -24 }, { iris: KL.iris, peau: KL.peau, brow: 'rgba(55,35,22,0.95)', lw: 2.6 });
        // grosses lunettes à monture noire épaisse
        const fr = rrect(9, -60, 31, -44, 4);
        fillPts(fr, 'rgba(200,225,235,0.22)', 0, 0); strokePts(fr.concat([fr[0]]), KL.monture, 3.6);
        strokePts([[9, -56], [-7, -52]], KL.monture, 3); strokePts([[13, -57], [19, -58]], 'rgba(255,255,255,0.75)', 1.2);
      } },
      cheveux: { parent: 'head', at: [0, 0], pts: KL_HAIR, base: KL.cheveux, seed: 21007, noRivet: true, paint: () => {
        strokePts([[22, -96], [6, -104], [-12, -104]], 'rgba(230,200,170,0.5)', 1.3);                                    // raie de côté
        for (const [a, b] of [[[26, -92], [2, -96]], [[18, -86], [-10, -92]], [[-8, -98], [-28, -84]], [[-16, -84], [-32, -62]]]) strokePts([a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 3], b], 'rgba(150,110,80,0.4)', 1.2);
        hatch(null, 0.5, 3.4, 0.2);
      } },
      armF_up: upDef([-2, -146], KL.chemise, 21009, { manche: 48, peau: KL.peau, wt: 14 }),
      armF_lo: oreille(foreDef('armF_up', KL.peau, KL.peau, false, 21010)),
      armFh_lo: cache(foreDef('armF_up', KL.peau, KL.peau, false, 21011)),
      mainH: mainH(KL.peau, 21012),
    };
    Object.assign(parts, legParts(L, 21030), heldParts(KL.peau, 21040), casqueParts(21060));
    return { hipY: -(L.th + L.sh + 14), parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, order: ORDER(['cheveux', 'casque', 'mainH'], ['casqueFil'], ['armFh_lo']), nom: 'kline', _legs: L,
      _before: (q, env) => { if (q._tabouret) tabouret(env.x + (q.dx || 0) * env.s * env.dir - 6 * env.s * env.dir, env.y, env.s, env.siege, q._tabouret); } };
  }
  // tabouret de labo (pied métal, assise ronde) dessiné sous Kline assis ; (x,y) = sol
  function tabouret(x, y, s, siege, a) {
    const c = cx_(), h = siege != null ? (y - siege) / s : 132;
    c.save(); c.translate(x, y); c.scale(s, s); c.globalAlpha *= clamp(a);
    pc([[-30, -2], [30, -2], [26, 2, 1], [-26, 2, 1]], '#3d3f42', null, 21090);
    pc([[-24, 0], [-6, -h + 14], [6, -h + 14], [24, 0], [16, 0], [0, -h * 0.55], [-16, 0]], '#55585b', () => strokePts([[-18, -2], [-3, -h + 18]], 'rgba(255,255,255,0.3)', 1.2), 21091);
    pc(box(-32, -50, 32, -44), '#55585b', null, 21092);
    pc([[-40, -h + 2], [40, -h + 2], [38, -h + 14, 1], [-38, -h + 14, 1]], '#4e5d48', () => strokePts([[-36, -h + 5], [36, -h + 5]], 'rgba(255,255,255,0.3)', 1.4), 21093);
    c.restore();
  }
  CH.loKline = mkKline();
  LO.klinePose = function (q, env) {
    const def = CH.loKline, A = q.ang, t = q.t || 0;
    const ta = k01(q.tape), ec = k01(q.ecoute), su = k01(q.surprise), ecr = k01(q.ecrit), se = k01(q.serre), as = k01(q.assis), ma = k01(q.marche);
    marche(q, ma, t);
    assis(q, env, as);
    q._tabouret = q.tabouret != null ? (q.tabouret ? 1 : 0) : (as > 0 ? 1 : 0);
    gTape(q, env, def, ta, t);
    gEcoute(q, env, def, ec);
    if (su > 0) {                                                                         // surprise : mains ouvertes à hauteur d'épaules, recul
      q.tilt = (q.tilt || 0) - 0.05 * su; q.dx = (q.dx || 0) - 8 * su;
      armTo(q, def, 'armF', [104, -146], 'bas', su); armTo(q, def, 'armB', [54, -128], 'bas', su);
      A.head -= 0.1 * su; if (su > 0.3) { q.handF = has(q.tenu) ? q.handF : 'open'; q.handB = 'open'; q._mainB = true; }
      if (q.expr == null && su > 0.4) q.expr = 'surpris';
    }
    if (ecr > 0) {                                                                        // écrire au crayon : pointe sur `cible` (écran), main arrière qui tient la page
      if (q.tenu == null) q.tenu = 'crayon';
      const T = q.cible ? toTorso(env, q, q.cible) : [100, -40], k = (q.tenuO && q.tenuO.taille) || 1, pt = OBJ.crayon.pts.pointe;
      const w = [5 * Math.sin(t * TAU * 1.7) + 2 * Math.sin(t * TAU * 5.3), 2.5 * Math.sin(t * TAU * 3.4)];
      armTo(q, def, 'armF', [T[0] - pt[0] * k + w[0], T[1] - pt[1] * k + w[1] - 4], 'bas', ecr);
      if (q.tenuB == null) { armTo(q, def, 'armB', [T[0] - 28, T[1] - 10], 'bas', ecr); if (ecr > 0.4) q.handB = 'open'; }
      A.head += 0.3 * ecr; if (q.expr == null && ecr > 0.5) q.expr = 'concentre';
    }
    if (se > 0) {                                                                         // serrer le téléphone contre la poitrine, à deux mains
      if (q.tenu == null) q.tenu = 'telephone';
      armTo(q, def, 'armF', [88, -100], 'bas', se); if (q.deuxMains == null) q.deuxMains = se > 0.3;
      A.head += 0.16 * se; q.tilt = (q.tilt || 0) + 0.02 * se;
      if (q.expr == null && se > 0.5) q.expr = 'serein';
    }
  };
  LO.kline = wrap(CH.loKline, LO.klinePose, 0.9);

  // =====================================================================
  // BILL DUVALL — 26 ans ; cheveux châtain clair un peu longs sur la nuque, moustache, longues pattes ; cardigan ocre moutarde à
  // bande jacquard sur chemise à carreaux vert éteint, pantalon brun. Dessiné pour se lire à 0,5–0,6 (traits épais).
  // =====================================================================
  const DV = { peau: '#e2bf98', peauD: '#c69e78', cardigan: '#b88a2e', cardiganD: '#9a7226', cardiganL: '#cfa24a', carreau: '#5d7a4a', carreauL: '#9cb08a', pant: '#5b4632', pantD: '#4a3928',
    chaus: '#33241a', chausD: '#261a12', cheveux: '#a8774a', cheveuxD: '#7c5330', iris: '#4f5a3a' };
  const DV_TORSO = [[-13, -176], [8, -180], [18, -168], [26, -150], [31, -112], [31, -62], [30, -14], [32, 30], [33, 46, 1], [-33, 48, 1], [-35, 10], [-33, -40], [-35, -108], [-33, -148], [-24, -168]];
  const DV_HEAD = [[-13, 16], [9, 16], [12, 4], [18, -4], [26, -8], [29, -14], [28, -20], [30, -25], [29, -29], [32, -34], [37, -41, 1], [32, -47], [29, -55], [30, -64], [28, -77], [16, -91], [-5, -97], [-24, -90], [-32, -70], [-31, -46], [-24, -28], [-16, -8]];
  const DV_HAIR = [[18, -80], [27, -86], [33, -96, 1], [24, -103], [12, -112], [0, -110], [-8, -116], [-20, -109], [-32, -101], [-39, -88], [-41, -72], [-45, -58], [-41, -48], [-46, -34], [-40, -26], [-44, -12, 1], [-35, -20], [-33, -8, 1], [-27, -24], [-25, -42], [-24, -56], [-18, -68], [-6, -78], [8, -82]];
  function plaid(x0, y0, x1, y1) {
    fillPts(box(x0, y0, x1, y1), DV.carreau);
    for (let x = x0 + 2; x < x1; x += 7) strokePts([[x, y0], [x, y1]], 'rgba(200,215,170,0.55)', 1.4);
    for (let y = y0 + 3; y < y1; y += 7) strokePts([[x0, y], [x1, y]], 'rgba(35,50,30,0.6)', 1.4);
  }
  function mkDuvall() {
    const L = { th: 114, sh: 106, hx: 6, wt: 17, kt: 12, ak: 9, fl: 46, col: DV.pant, colD: DV.pantD, shoe: DV.chaus, shoeD: DV.chausD };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: DV_TORSO, base: DV.cardigan, seed: 22001, paint: () => {
        plaid(4, -184, 34, -60);                                                                                        // chemise à carreaux (encolure en V)
        fillPts([[6, -176], [20, -170], [24, -158], [14, -150]], DV.carreauL);                                         // col de chemise
        fillPts([[-40, -184], [4, -184], [10, -160], [16, -120], [22, -70], [26, -56], [-40, -56]], DV.cardigan);      // cardigan
        fillPts([[26, -56], [40, -56], [40, 60], [-40, 60], [-40, -56]], DV.cardigan);
        strokePts([[6, -176], [12, -150], [18, -112], [24, -70], [27, -50], [30, 44]], DV.cardiganD, 2.6);             // bord-côte du devant
        for (const y of [-94, -62, -30, 2, 30]) dot(26 + (y + 94) * 0.025, y, 2.6, '#5a3b1a');                         // boutons
        // bande jacquard : losanges crème et brun sur la poitrine
        fillPts(box(-40, -116, 14, -98), DV.cardiganD);
        for (let x = -36; x < 14; x += 10) { fillPts([[x, -107], [x + 5, -114], [x + 10, -107], [x + 5, -100]], '#efe2c0'); dot(x + 5, -107, 1.6, '#6b3b1a'); }
        strokePts([[-40, -118], [12, -118]], '#efe2c0', 1.6); strokePts([[-40, -96], [16, -96]], '#efe2c0', 1.6);
        for (let x = -36; x < 30; x += 4) strokePts([[x, 36], [x, 48]], 'rgba(80,55,20,0.4)', 1);                    // bord-côte du bas
        fillPts(box(-22, -10, 6, 16), 'rgba(110,80,30,0.25)'); strokePts([[-22, -10], [6, -10]], 'rgba(80,55,20,0.6)', 1.2);   // poche
        hatch([[-52, -170], [-12, -170], [-10, 48], [-52, 48]], 0.75, 4.2, 0.28);
        shade(40, 0, -40, 0, 0.26);
      } },
      armB_up: upDef([-10, -146], DV.cardiganD, 22004),
      armB_lo: foreDef('armB_up', DV.cardiganD, DV.peauD, true, 22005, { cuff: '#7f5d22' }),
      head: { parent: 'torso', at: [6, -174], pts: DV_HEAD, base: DV.peau, seed: 22006, noRivet: true, paint: (p) => {
        X.earPaint(-8, -44);
        fillPts([[0, -66], [7, -66], [8, -36], [3, -30], [0, -40]], DV.cheveux);                                         // longues pattes
        hatch([[-22, -42], [2, -32], [10, -12], [-6, 14], [-32, 4]], 0.6, 3.6, 0.22);
        visage(p, { ox: 19, oy: -52, bx: 28, by: -21 }, { iris: DV.iris, peau: DV.peau, brow: 'rgba(110,70,40,0.98)', lw: 3.2 });
      }, extra: () => {                                                                                                   // moustache épaisse (lisible en petit)
        fillPts([[18, -32], [30, -34], [36, -30], [35, -24], [28, -25], [20, -22], [15, -24]], DV.cheveuxD, 0, 0);
        strokePts([[20, -31], [32, -31]], 'rgba(220,180,130,0.4)', 1);
      } },
      cheveux: { parent: 'head', at: [0, 0], pts: DV_HAIR, base: DV.cheveux, seed: 22007, noRivet: true, paint: () => {
        for (const [a, b] of [[[28, -96], [4, -104]], [[18, -86], [-12, -98]], [[-10, -104], [-34, -84]], [[-26, -84], [-38, -44]], [[-32, -60], [-38, -20]], [[-20, -70], [-30, -30]]]) strokePts([a, [(a[0] + b[0]) / 2 - 2, (a[1] + b[1]) / 2 - 2], b], 'rgba(235,200,150,0.6)', 1.6);
        for (const [a, b] of [[[6, -100], [-20, -92]], [[-30, -90], [-40, -60]], [[-36, -50], [-40, -18]]]) strokePts([a, [(a[0] + b[0]) / 2 + 2, (a[1] + b[1]) / 2], b], 'rgba(90,55,25,0.55)', 1.4);
        hatch(null, 0.5, 3.4, 0.22);
      } },
      armF_up: upDef([-2, -146], DV.cardigan, 22009),
      armF_lo: oreille(foreDef('armF_up', DV.cardigan, DV.peau, false, 22010, { cuff: DV.cardiganD })),
      armFh_lo: cache(foreDef('armF_up', DV.cardigan, DV.peau, false, 22011, { cuff: DV.cardiganD })),
      mainH: mainH(DV.peau, 22012),
    };
    Object.assign(parts, legParts(L, 22030), heldParts(DV.peau, 22040), casqueParts(22060));
    return { hipY: -(L.th + L.sh + 14), parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, order: ORDER(['cheveux', 'casque', 'mainH'], ['casqueFil'], ['armFh_lo']), nom: 'duvall', _legs: L };
  }
  CH.loDuvall = mkDuvall();
  LO.duvallPose = function (q, env) {
    const def = CH.loDuvall, A = q.ang, t = q.t || 0;
    const ec = k01(q.ecoute), ta = k01(q.tape), br = k01(q.bras), tv = k01(q.tournevis), ou = k01(q.ouf), ma = k01(q.marche);
    marche(q, ma, t);
    gTape(q, env, def, ta, t);
    gEcoute(q, env, def, ec);
    if (br > 0) {                                                                         // panique : bras levés en V, mains ouvertes, recul
      const tr = 0.04 * Math.sin(t * TAU * 5) * br;
      blend(q, 'armF_up', -2.5 + tr, br); blend(q, 'armF_lo', -0.2, br); blend(q, 'armB_up', -3.06 - tr, br); blend(q, 'armB_lo', -0.08, br);
      q.tilt = (q.tilt || 0) - 0.06 * br; q.dx = (q.dx || 0) - 10 * br; A.head -= 0.08 * br;
      if (br > 0.4) { if (!has(q.tenu)) q.handF = 'open'; if (!has(q.tenuB)) q.handB = 'open'; }
      if (q.expr == null && br > 0.4) q.expr = 'panique';
    }
    if (tv > 0) {                                                                         // répare : tournevis tenu par le manche, pointe vers la machine (`cible` écran)
      if (q.tenu == null) q.tenu = 'tournevis';
      const k = (q.tenuO && q.tenuO.taille) || 1, P0 = OBJ.tournevis.pts.pointe, g = OBJ.tournevis.grip;
      const T = q.cible ? toTorso(env, q, q.cible) : [190, -112];
      const push = 4 * Math.sin(t * TAU * 1.4);
      armTo(q, def, 'armF', [T[0] - (P0[0] - g[0]) * k - 6 + push, T[1] + 4], 'bas', tv);
      A.objet = (A.objet || 0) + 0.1 * Math.sin(t * TAU * 1.4) * tv;
      blend(q, 'armB_up', -0.35, tv); blend(q, 'armB_lo', -0.9, tv);
      A.head += 0.08 * tv; if (q.expr == null && tv > 0.5) q.expr = 'concentre';
    }
    if (ou > 0) {                                                                         // ouf : épaules qui tombent, souffle, sourire
      q.dy = (q.dy || 0) + 5 * ou; q.tilt = (q.tilt || 0) + 0.03 * ou;
      blend(q, 'armF_up', 0.08, ou); blend(q, 'armF_lo', -0.12, ou); blend(q, 'armB_up', 0.06, ou); blend(q, 'armB_lo', -0.1, ou);
      A.head += -0.12 * ou + 0.03 * Math.sin(t * TAU * 0.6) * ou; if (ou > 0.4) { if (!has(q.tenu)) q.handF = 'open'; q.handB = 'open'; }
      if (q.expr == null && ou > 0.4) q.expr = 'soulage';
    }
  };
  LO.duvall = wrap(CH.loDuvall, LO.duvallPose, 0.55);

  // =====================================================================
  // LEONARD KLEINROCK — « le patron », 35 ans ; cheveux noirs ondulés, front dégagé, rasé de près ; veste de tweed bleu ardoise
  // à coudières brunes, chemise bleu pâle, cravate bordeaux, pantalon anthracite, souliers noirs. Pas de couvre-chef, pas de lunettes.
  // =====================================================================
  const KR = { peau: '#dcb48e', peauD: '#bf9672', tweed: '#3e5566', tweedD: '#324656', tweedL: '#5a7284', chemise: '#b9cfe0', cravate: '#6e2430', coudiere: '#6b4a32',
    pant: '#3a3a3f', pantD: '#2e2e33', chaus: '#151314', chausD: '#0e0c0d', cheveux: '#17131a', iris: '#3a2a22' };
  const KR_TORSO = [[-14, -178], [8, -182], [18, -170], [28, -152], [34, -114], [35, -62], [33, -14], [35, 30], [37, 50, 1], [-37, 52, 1], [-39, 10], [-37, -40], [-39, -110], [-35, -150], [-26, -170]];
  const KR_HEAD = [[-15, 18], [10, 18], [14, 6], [21, 0], [29, -6], [31, -14], [29, -20], [31, -25], [30, -29], [33, -34], [40, -42, 1], [34, -48], [31, -56], [32, -66], [30, -80], [18, -95], [-4, -100], [-24, -93], [-34, -72], [-33, -48], [-26, -28], [-19, -6]];
  const KR_HAIR = [[16, -92], [22, -102], [14, -112], [4, -116], [-6, -111], [-14, -118], [-26, -110], [-34, -102], [-41, -88], [-41, -70], [-38, -54], [-31, -44], [-27, -58], [-22, -72], [-10, -84], [4, -90]];
  function tweed(x0, y0, x1, y1, seed) {
    for (let i = 0; i < 70; i++) { const x = lerp(x0, x1, hash(seed + i)), y = lerp(y0, y1, hash(seed + i * 7.3)); strokePts([[x, y], [x + 2.5, y + 1.5]], i % 3 ? 'rgba(160,185,200,0.4)' : 'rgba(20,30,40,0.45)', 1.1); }
  }
  function mkKleinrock() {
    const L = { th: 118, sh: 110, hx: 6, wt: 17, kt: 12, ak: 9, fl: 47, col: KR.pant, colD: KR.pantD, shoe: KR.chaus, shoeD: KR.chausD };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: KR_TORSO, base: KR.tweed, seed: 23001, paint: () => {
        tweed(-40, -180, 38, 52, 23100);
        fillPts([[2, -182], [14, -178], [20, -160], [12, -132], [5, -156]], KR.chemise);                                // chemise bleu pâle
        fillPts([[9, -172], [14, -170], [17, -138], [13, -128], [9, -138]], KR.cravate);                                // cravate bordeaux
        fillPts([[0, -174], [6, -152], [12, -104], [20, -116], [16, -152], [8, -176]], KR.tweedD);                      // revers
        strokePts([[18, -116], [16, -152], [8, -176]], 'rgba(255,255,255,0.18)', 1.1);
        strokePts([[12, -104], [20, -30], [24, 30], [26, 50]], 'rgba(10,18,26,0.75)', 1.6); for (const y of [-80, -40]) dot(22, y, 2.6, '#1c1612');
        fillPts(box(-30, 0, 4, 8), KR.tweedD); strokePts([[-30, 0], [4, 0]], 'rgba(255,255,255,0.16)', 1);            // poche à rabat
        for (let y = -170; y < 50; y += 6) strokePts([[-36, y], [-30, y + 3], [-24, y]], 'rgba(20,30,40,0.18)', 0.9);  // chevrons
        hatch([[-52, -170], [-12, -170], [-10, 52], [-52, 52]], 0.75, 4.2, 0.28);
        shade(40, 0, -40, 0, 0.26);
      } },
      armB_up: upDef([-10, -146], KR.tweedD, 23004, { coudiere: KR.coudiere, paint: () => tweed(-14, -10, 14, 96, 23200) }),
      armB_lo: foreDef('armB_up', KR.tweedD, KR.peauD, true, 23005, { cuff: '#a9bfd0', coudiere: KR.coudiere }),
      head: { parent: 'torso', at: [6, -176], pts: KR_HEAD, base: KR.peau, seed: 23006, noRivet: true, paint: (p) => {
        X.earPaint(-8, -44);
        hatch([[-22, -42], [2, -32], [10, -12], [-6, 14], [-32, 4]], 0.6, 3.6, 0.22);
        strokePts([[20, -84], [26, -86]], 'rgba(120,70,55,0.22)', 1); strokePts([[14, -78], [24, -79]], 'rgba(120,70,55,0.18)', 1);   // front dégagé
        hatch([[14, -8], [32, -14], [28, 4], [12, 8]], 0.5, 3, 0.12);                                                    // ombre de barbe rasée
        visage(p, { ox: 21, oy: -53, bx: 30, by: -22 }, { iris: KR.iris, peau: KR.peau, brow: 'rgba(25,18,20,0.95)', lw: 2.4 });
      } },
      cheveux: { parent: 'head', at: [0, 0], pts: KR_HAIR, base: KR.cheveux, seed: 23007, noRivet: true, paint: () => {
        for (const [a, b] of [[[18, -104], [-2, -106]], [[-4, -112], [-24, -100]], [[-20, -104], [-38, -84]], [[-26, -90], [-38, -62]], [[8, -96], [-14, -94]]]) strokePts([a, [(a[0] + b[0]) / 2 - 3, (a[1] + b[1]) / 2 - 4], b], 'rgba(150,150,170,0.45)', 1.4);
        hatch(null, 0.5, 3.4, 0.2);
      } },
      armF_up: upDef([-2, -146], KR.tweed, 23009, { coudiere: KR.coudiere, paint: () => tweed(-14, -10, 14, 96, 23300) }),
      armF_lo: foreDef('armF_up', KR.tweed, KR.peau, false, 23010, { cuff: KR.chemise, coudiere: KR.coudiere, paint: () => tweed(-12, 0, 12, 70, 23400) }),
    };
    Object.assign(parts, legParts(L, 23030), heldParts(KR.peau, 23040));
    return { hipY: -(L.th + L.sh + 14), parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, order: ORDER(['cheveux']), nom: 'kleinrock', _legs: L,
      _after: (r, q) => { if (q._charge) { const a = r.w('armF_lo', 0, 110), b = r.w('armB_lo', 0, 110); r.charge = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; } } };
  }
  CH.loKleinrock = mkKleinrock();
  LO.kleinrockPose = function (q, env) {
    const def = CH.loKleinrock, A = q.ang, t = q.t || 0;
    const po = k01(q.porte), vo = k01(q.voila), ri = k01(q.rire), ma = k01(q.marche);
    marche(q, ma, t);
    if (po > 0) {                                                                         // sac tenu contre le ventre, deux mains autour
      armTo(q, def, 'armF', [84, -54], 'bas', po); armTo(q, def, 'armB', [64, -96], 'bas', po);
      A.head += 0.1 * po; q.tilt = (q.tilt || 0) - 0.03 * po; q._charge = true;
      if (po > 0.4) { if (!has(q.tenu)) q.handF = 'open'; q.handB = 'open'; q._mainB = !has(q.tenuB); }
      if (q.expr == null && po > 0.5) q.expr = 'sourire';
    }
    if (vo > 0) {                                                                         // « et voilà ! » : bras avant ouvert vers l'avant-haut paume vers le haut, main arrière sur le cœur
      blend(q, 'armF_up', -1.95, vo); blend(q, 'armF_lo', -0.32, vo);
      armTo(q, def, 'armB', [22, -116], 'bas', vo);
      A.head -= 0.16 * vo; q.tilt = (q.tilt || 0) - 0.02 * vo;
      if (vo > 0.35) { if (!has(q.tenu)) q.handF = 'paume'; q.handB = 'open'; q._mainB = true; }
      if (q.expr == null && vo > 0.4) q.expr = 'sourire';
    }
    if (ri > 0) {                                                                         // rire : tête en arrière, épaules qui sautent, main sur le ventre
      const sa = Math.abs(Math.sin(t * TAU * 2.6));
      q.dy = (q.dy || 0) - 4 * sa * ri; A.head -= (0.3 + 0.04 * sa) * ri; q.tilt = (q.tilt || 0) - 0.04 * ri;
      armTo(q, def, 'armF', [40, -36 - 3 * sa], 'bas', ri);
      blend(q, 'armB_up', 0.04, ri); blend(q, 'armB_lo', -0.25, ri);
      if (ri > 0.4) { if (!has(q.tenu)) q.handF = 'open'; q.handB = 'open'; }
      if (q.expr == null && ri > 0.4) q.expr = 'ravi';
    }
  };
  LO.kleinrock = wrap(CH.loKleinrock, LO.kleinrockPose, 0.9);

  // =====================================================================
  // ACCESSOIRES SEULS — M.puppet à une pièce invisible ; l'objet se dessine dans l'extra (ombre portée possible)
  // =====================================================================
  const accDefs = {};
  function accDef(name, fn) { return accDefs[name] || (accDefs[name] = { hipY: 0, handLen: 10, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => fn(p.o) } }, order: ['o'] }); }
  function acc(name, x, y, s, o) {
    o = o || {}; s = s == null ? 1 : s;
    const ob = OBJ[name];
    const def = accDef(name, (oo) => { const c = cx_(), b = vOf(ob.base, oo); c.save(); c.translate(-b[0], -b[1]); ob.draw(oo); c.restore(); });
    return M.puppet(def, { o: Object.assign({ t: o.t || 0 }, o), tilt: o.rot || 0 }, x, y, s, { dir: o.dir || 1, rod: false, slot: o.slot != null ? o.slot : y + 6 * s, floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
  }
  LO.cube = (x, y, s, o) => acc('cube', x, y, s, o);
  // téléphone posé ; renvoie aussi r.prise (écran) = point où se branche le fil du casque
  LO.telephone = (x, y, s, o) => {
    o = o || {}; s = s == null ? 1 : s; const r = acc('telephone', x, y, s, o);
    r.prise = [x + (o.dir || 1) * -66 * s, y - 10 * s]; r.combine = [x, y - 100 * s]; return r;
  };
  LO.telPrise = (x, y, s, dir) => [x + (dir || 1) * -66 * (s == null ? 1 : s), y - 10 * (s == null ? 1 : s)];

  // =====================================================================
  // DÉCOR 1 — LABO D'UCLA, salle d'informatique de 1969, la nuit (pleine scène). LO.labUCLA(t, o) ; t = temps LOCAL du plan (converti en temps global)
  // =====================================================================
  const BACK = M.ST.back;
  const U = {
    fen: { x0: 650, x1: 940, y0: 380, y1: 820 },
    tableau: { x0: 110, x1: 390, y0: 440, y1: 670 },
    horloge: { x: 482, y: 470, r: 40 }, calendrier: { x0: 560, x1: 640, y0: 450, y1: 600 },
    neons: [[200, 470, 346], [640, 910, 346]],
    sigma: { x: 270 }, imp: { x: 862 }, classeur: { x: 718 }, teletype: { x: 615 }, bureau: { x: 245 }, imprimante: { x: 968 }, chaise: { x: 168 }, corbeille: { x: 408 },
    etagere: { x0: 128, x1: 418, y: 822 },
  };
  LO.U = U;
  // points nommés (écran)
  LO.P = {
    clavier: [U.teletype.x - 84, BACK - 216],         // dessus du clavier du téléscripteur (les doigts de Kline)
    sortie: [U.teletype.x + 14, BACK - 334],          // fente du rouleau d'où sortent les cubes
    imp: [U.imp.x - 82, BACK - 384],                  // prise du câble, flanc gauche de l'IMP
    bureau: [U.bureau.x, BACK - 235],                 // dessus du bureau (milieu)
    bureauX: [U.bureau.x - 140, U.bureau.x + 140],    // étendue du dessus du bureau
    tel: [U.bureau.x - 38, BACK - 235],               // place du téléphone beige (pieds du téléphone, s = LO.P.telS)
    telS: 0.85,
    tasse: [U.bureau.x + 112, BACK - 268],
    lampe: [U.bureau.x - 110, BACK - 240],
    fenetre: [795, 565],
  };
  LO.P.telPrise = LO.telPrise(LO.P.tel[0], LO.P.tel[1], LO.P.telS, 1);

  // ---------- toile de fond (mur vert d'eau, plafond, tableau noir à schéma, calendrier, étagère, extincteur) ; fenêtre évidée
  function drawFondUCLA(c) {
    const W = M.W, F = U.fen;
    c.fillStyle = '#b9c4b0'; c.fillRect(0, 0, W, BACK + 5);
    // panneaux muraux
    for (let x = 60; x < W; x += 135) {
      pc(box(x + 6, 340, x + 129, 1070), '#bdc8b4', () => { strokePts([[x + 10, 344], [x + 125, 344]], 'rgba(255,255,255,0.35)', 1.4); hatch(box(x + 6, 340, x + 40, 1070), 0.8, 6, 0.08); }, 30000 + x, { drop: false, texA: 0.5 });
    }
    pc(box(0, 1070, W, 1092), '#9aa792', () => strokePts([[0, 1074], [W, 1074]], 'rgba(255,255,255,0.35)', 1.4), 30001, { drop: false });          // cimaise
    pc(box(0, 1092, W, BACK + 5), '#a8b49f', () => hatch(box(0, 1092, W, BACK + 5), 0.8, 7, 0.1, 1, undefined), 30002, { drop: false, texA: 0.5 });
    pc(box(0, BACK - 34, W, BACK + 5), '#5e6a5c', () => strokePts([[0, BACK - 32], [W, BACK - 32]], 'rgba(255,255,255,0.25)', 1.4), 30003, { drop: false });
    // plafond à dalles acoustiques
    pc(box(0, 0, W, 322), '#d9d5c6', () => {
      for (let x = 0; x < W; x += 90) strokePts([[x, 0], [x, 322]], 'rgba(120,115,100,0.45)', 2);
      for (const y of [170, 250, 322]) strokePts([[0, y], [W, y]], 'rgba(120,115,100,0.45)', 2);
      const R = M.rng(77); for (let i = 0; i < 700; i++) dot(R() * W, 150 + R() * 172, 0.9, 'rgba(90,85,70,0.35)');
    }, 30004, { drop: false, texA: 0.4 });
    pc(box(0, 318, W, 334), '#c7c2b0', () => strokePts([[0, 332], [W, 332]], 'rgba(60,55,45,0.4)', 1.4), 30005);
    // rampes de néons (corps)
    for (const [a, b, y] of U.neons) {
      for (const x of [a + 20, b - 20]) strokePts([[x, 330], [x, y - 10]], 'rgba(40,40,40,0.7)', 1.6);
      pc(box(a, y - 12, b, y + 6), '#e4e2da', () => { strokePts([[a + 4, y - 9], [b - 4, y - 9]], 'rgba(255,255,255,0.6)', 1.4); for (let x = a + 10; x < b; x += 14) strokePts([[x, y + 1], [x + 6, y + 5]], 'rgba(90,90,90,0.4)', 1); }, 30006 + a);
    }
    // tableau noir : schéma de réseau (4 cercles reliés), aucune lettre
    const T = U.tableau;
    pc(box(T.x0 - 12, T.y0 - 12, T.x1 + 12, T.y1 + 12), '#6e4a2a', () => hatch(null, 0.2, 4, 0.2, 1, undefined, [T.x0 - 12, T.y0 - 12, T.x1 + 12, T.y1 + 12]), 30010);
    pc(box(T.x0, T.y0, T.x1, T.y1), '#2f3a33', () => {
      const R = M.rng(5); for (let i = 0; i < 40; i++) { const x = T.x0 + R() * 280, y = T.y0 + R() * 240; strokePts([[x, y], [x + 30, y + 6]], 'rgba(220,225,215,0.07)', 6); }
      const N = [[T.x0 + 60, T.y0 + 70], [T.x0 + 70, T.y0 + 180], [T.x0 + 200, T.y0 + 60], [T.x0 + 210, T.y0 + 175]];
      for (const [i, j] of [[0, 1], [0, 2], [1, 3], [2, 3], [0, 3]]) strokePts([N[i], N[j]], 'rgba(235,235,225,0.75)', 2.6);
      N.forEach((n, i) => { strokePts(ell(n[0], n[1], 24, 20, 16).concat([[n[0] + 24, n[1]]]), 'rgba(240,240,232,0.85)', 2.6); if (i === 0) strokePts(ell(n[0], n[1], 30, 26, 16).concat([[n[0] + 30, n[1]]]), 'rgba(240,215,140,0.6)', 1.6); });
      strokePts([[T.x0 + 92, T.y0 + 64], [T.x0 + 170, T.y0 + 58]], 'rgba(240,215,140,0.75)', 2); strokePts([[T.x0 + 160, T.y0 + 52], [T.x0 + 172, T.y0 + 58], [T.x0 + 160, T.y0 + 66]], 'rgba(240,215,140,0.75)', 2);   // flèche de l'envoi
    }, 30011, { texA: 0.35 });
    pc(box(T.x0 - 8, T.y1 + 6, T.x1 + 8, T.y1 + 18), '#5a3b20', () => { fillPts(box(T.x0 + 40, T.y1 + 2, T.x0 + 62, T.y1 + 8), '#f0ece0'); fillPts(box(T.x1 - 70, T.y1, T.x1 - 34, T.y1 + 8), '#4a4036'); }, 30012);
    // calendrier mural : image (palmier, soleil) + grille vierge, quelques jours entourés
    const K = U.calendrier;
    strokePts([[(K.x0 + K.x1) / 2, K.y0 - 14], [K.x0 + 10, K.y0], [K.x1 - 10, K.y0]], 'rgba(40,30,20,0.6)', 1.2);
    pc(box(K.x0, K.y0, K.x1, K.y1), '#efe8d6', () => {
      fillPts(box(K.x0 + 4, K.y0 + 4, K.x1 - 4, K.y0 + 66), '#9fb7c4'); fillPts(box(K.x0 + 4, K.y0 + 50, K.x1 - 4, K.y0 + 66), '#c9b07a');
      dot(K.x1 - 22, K.y0 + 22, 9, '#e8b04a'); strokePts([[K.x0 + 28, K.y0 + 60], [K.x0 + 32, K.y0 + 36], [K.x0 + 30, K.y0 + 22]], '#5a4028', 2.4);
      for (const a of [-2.6, -1.9, -1.2, -0.5]) strokePts([[K.x0 + 30, K.y0 + 22], [K.x0 + 30 + Math.cos(a) * 16, K.y0 + 22 + Math.sin(a) * 9 + 6]], '#3e5a34', 2.4);
      for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) strokePts(box(K.x0 + 8 + j * 13, K.y0 + 74 + i * 14, K.x0 + 18 + j * 13, K.y0 + 84 + i * 14).concat([[K.x0 + 8 + j * 13, K.y0 + 74 + i * 14]]), 'rgba(90,80,60,0.45)', 0.8);
      for (const [i, j] of [[2, 1], [3, 4], [4, 2]]) dot(K.x0 + 13 + j * 13, K.y0 + 79 + i * 14, 3, 'rgba(154,47,37,0.75)');
    }, 30013);
    // étagère : boîtes de cartes perforées, bobines de rechange (la petite pile de droite est dessinée à part : elle peut glisser)
    const E = U.etagere;
    pc(box(E.x0, E.y, E.x1, E.y + 10), '#7b6a52', () => strokePts([[E.x0, E.y + 2], [E.x1, E.y + 2]], 'rgba(255,255,255,0.3)', 1.2), 30020);
    for (const x of [E.x0 + 30, E.x1 - 40]) pc([[x, E.y + 10], [x + 6, E.y + 10], [x + 6, E.y + 40], [x - 18, E.y + 10]], '#5e5244', null, 30021 + x);
    [[E.x0 + 6, '#c8b48a', 64], [E.x0 + 74, '#b9a47a', 56], [E.x0 + 134, '#c8b48a', 60]].forEach(([x, col, h], i) => {
      pc(box(x, E.y - h, x + 60, E.y), col, () => { fillPts(box(x + 4, E.y - h - 4, x + 56, E.y - h + 8), '#efe9da'); for (let k = 0; k < 6; k++) strokePts([[x + 5, E.y - h - 2 + k * 2], [x + 55, E.y - h - 2 + k * 2]], 'rgba(120,110,90,0.35)', 0.7); fillPts(box(x + 18, E.y - h / 2 - 6, x + 42, E.y - h / 2 + 6), 'rgba(255,255,255,0.45)'); hatch(null, 0.9, 4, 0.15, 1, undefined, [x, E.y - h, x + 60, E.y]); }, 30030 + i);
    });
    for (const [x, r] of [[E.x0 + 222, 34], [E.x0 + 262, 26]]) pc(ell(x, E.y - r, r, r, 22), '#6a6c70', () => { dot(x, E.y - r, r * 0.82, '#2b2420'); dot(x, E.y - r, r * 0.3, '#b8b6ae'); dot(x, E.y - r, 4, '#3a3a3a'); }, 30040 + x);
    // extincteur rouge sur son support
    pc(box(950, 1160, 990, 1176), '#3d3f42', null, 30050);
    pc([[952, 1180], [988, 1180], [990, 1320], [984, 1330, 1], [956, 1330, 1], [950, 1320]], '#9a2f25', () => { strokePts([[958, 1186], [958, 1320]], 'rgba(255,255,255,0.35)', 2); fillPts(box(950, 1230, 990, 1262), '#d8cfb4'); hatch(null, 0.8, 3.6, 0.2, 1, undefined, [948, 1178, 992, 1332]); }, 30051);
    pc([[962, 1180], [978, 1180], [976, 1164], [964, 1164]], '#2a2a2a', null, 30052);
    pc(ribbon([[976, 1170], [1000, 1176], [1004, 1230]], 5, 5), '#1d1c1e', null, 30053, { drop: false });
    // fenêtre : cadre métallique, store vénitien relevé ; vitres évidées (le ciel est dessiné dessous)
    pc(box(F.x0 - 16, F.y0 - 16, F.x1 + 16, F.y1 + 22), '#8a8f88', () => strokePts([[F.x0 - 12, F.y0 - 12], [F.x1 + 12, F.y0 - 12]], 'rgba(255,255,255,0.4)', 1.6), 30060);
    c.save(); c.globalCompositeOperation = 'destination-out';
    const xm = (F.x0 + F.x1) / 2, ym = 620;
    for (const r of [[F.x0, F.y0 + 40, xm - 5, ym - 5], [xm + 5, F.y0 + 40, F.x1, ym - 5], [F.x0, ym + 5, xm - 5, F.y1], [xm + 5, ym + 5, F.x1, F.y1]]) c.fillRect(r[0], r[1], r[2] - r[0], r[3] - r[1]);
    c.restore();
    pc(box(F.x0 - 6, F.y0 - 6, F.x1 + 6, F.y0 + 40), '#d8d2c0', () => { for (let y = F.y0 - 2; y < F.y0 + 40; y += 6) strokePts([[F.x0 - 4, y], [F.x1 + 4, y]], 'rgba(110,100,80,0.5)', 1.2); }, 30061);   // store relevé
    for (const x of [F.x0 + 40, F.x1 - 40]) strokePts([[x, F.y0 + 40], [x, F.y0 + 120]], 'rgba(60,55,45,0.8)', 1.2);
    pc(box(F.x0 - 22, F.y1 + 14, F.x1 + 22, F.y1 + 30), '#9aa098', () => strokePts([[F.x0 - 20, F.y1 + 16], [F.x1 + 20, F.y1 + 16]], 'rgba(255,255,255,0.45)', 1.4), 30062);   // appui
    // ombres portées discrètes (lumière des néons, du haut)
    c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = 'rgba(70,80,70,0.22)';
    c.fillRect(T.x0 - 4, T.y1 + 18, T.x1 - T.x0 + 24, 14); c.fillRect(E.x0 + 4, E.y + 10, E.x1 - E.x0, 10); c.restore();
  }
  // ---------- collines de Los Angeles, palmiers (couche entre le ciel et le mur)
  function drawCollines(c) {
    const F = U.fen;
    fillPts([[F.x0 - 10, 730], [690, 690], [730, 676], [770, 700], [820, 660], [870, 650], [910, 676], [950, 668], [950, 840], [F.x0 - 10, 840]], '#2a3554', 30070);
    fillPts([[F.x0 - 10, 770], [700, 748], [760, 742], [810, 760], [870, 740], [950, 752], [950, 840], [F.x0 - 10, 840]], '#1b2338', 30071);
    for (const [x, h, k] of [[700, 150, -0.06], [742, 118, 0.05], [905, 170, 0.03]]) {
      const top = [x + k * h, 762 - h];
      strokePts(qbez([x, 764], [x + k * h * 2 - 6, 764 - h * 0.6], top, 10), '#141a2a', 4.5);
      for (let i = 0; i < 7; i++) { const a = -PI + i * PI / 6.2 + 0.1, L = 30 + 8 * hash(x + i); strokePts(qbez(top, [top[0] + Math.cos(a) * L * 0.6, top[1] + Math.sin(a) * L * 0.6 - 8], [top[0] + Math.cos(a) * L, top[1] + Math.sin(a) * L * 0.5 + 10], 6), '#141a2a', 3.2); }
    }
  }
  // ---------- machines et meubles (pré-rendus à part pour l'ombre portée)
  function drawSigma() {                                                         // deux armoires bleu ardoise ; origine = sol au milieu
    for (const sx of [-1, 1]) {
      const x0 = sx < 0 ? -150 : 6, x1 = sx < 0 ? -6 : 150;
      pc(box(x0, -520, x1, 0), '#4a6076', () => {
        fillPts(box(x0, -520, x1, -500), '#36485a');
        fillPts(box(x0 + 10, -486, x1 - 10, -316), '#26313c');                                                  // vitre des bobines
        strokePts([[x0 + 14, -482], [x0 + 40, -320]], 'rgba(255,255,255,0.12)', 6);
        for (const dx of [-34, 34]) { const cx = (x0 + x1) / 2 + dx; dot(cx, -400, 31, '#8d8f92'); dot(cx, -400, 27, '#2b2420'); dot(cx, -400, 10, '#b8b6ae'); }
        fillPts(box(x0 + 10, -300, x1 - 10, -214), '#2e3a46');                                                  // panneau
        if (sx < 0) for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) dot(x0 + 22 + i * 20, -284 + j * 20, 5, '#3a2a24');
        else { for (let i = 0; i < 7; i++) { fillPts(box(x0 + 18 + i * 17, -282, x0 + 26 + i * 17, -262), '#c9c4b2'); fillPts(box(x0 + 18 + i * 17, -256, x0 + 26 + i * 17, -236), i % 2 ? '#9a2f25' : '#c9c4b2'); } }
        for (let y = -190; y < -40; y += 12) strokePts([[x0 + 16, y], [x1 - 16, y]], 'rgba(20,30,40,0.45)', 2);
        strokePts([[(x0 + x1) / 2, -200], [(x0 + x1) / 2, -20]], 'rgba(20,30,40,0.6)', 1.5); fillPts(box((x0 + x1) / 2 + 4, -130, (x0 + x1) / 2 + 9, -100), '#b8b6ae');
        strokePts([[x0 + 4, -516], [x0 + 4, -4]], 'rgba(255,255,255,0.18)', 2);
        hatch(box(x1 - 22, -520, x1, 0), 0.8, 4, 0.25); shade(x0, 0, x1, 0, 0.18, [x0, -520, x1, 0]);
      }, 31000 + sx, { texA: 0.5 });
    }
    pc(box(-152, -14, 152, 0), '#232b33', null, 31005);
  }
  function drawIMP() {                                                           // armoire grise « frigo », voyants rouges et ambre ; prise de câble au flanc gauche
    pc(box(-80, -470, 80, 0), '#8b8d88', () => {
      for (let y = -458; y < -432; y += 6) strokePts([[-70, y], [70, y]], 'rgba(40,40,40,0.5)', 2);
      fillPts(box(-66, -420, 66, -300), '#3c3d3b');
      for (let i = 0; i < 6; i++) for (let j = 0; j < 5; j++) dot(-50 + i * 20, -404 + j * 22, 5, '#4a2a24');
      fillPts(box(-66, -290, 66, -284), '#6d6f6a'); strokePts([[0, -280], [0, -10]], 'rgba(40,40,40,0.55)', 1.6);
      fillPts(box(-16, -200, -10, -150), '#c8c6be'); fillPts(box(10, -200, 16, -150), '#c8c6be');
      strokePts([[-76, -466], [-76, -4]], 'rgba(255,255,255,0.3)', 2); hatch(box(50, -470, 80, 0), 0.8, 4, 0.25); shade(-80, 0, 80, 0, 0.16, [-80, -470, 80, 0]);
    }, 31100, { texA: 0.5 });
    pc(box(-90, -394, -80, -374), '#3a3b3d', () => dot(-85, -384, 3, '#b49a5a'), 31101);                     // prise du câble
    pc(box(-82, -10, 82, 0), '#2b2c2a', null, 31102);
  }
  function drawClasseur() {
    pc(box(-52, -300, 52, 0), '#7c8577', () => {
      for (let i = 0; i < 4; i++) { const y = -292 + i * 72; strokePts(box(-46, y, 46, y + 64).concat([[-46, y]]), 'rgba(40,45,38,0.5)', 1.4); fillPts(box(-16, y + 14, 16, y + 24), '#d8d2c0'); fillPts(box(-12, y + 34, 12, y + 40), '#b8b6ae'); }
      hatch(box(26, -300, 52, 0), 0.8, 4, 0.22);
    }, 31200, { texA: 0.5 });
  }
  function drawTeletype() {                                                      // téléscripteur sur pied (type Teletype), clavier à gauche (côté Kline)
    for (const x of [-52, 48]) pc(box(x - 4, -190, x + 4, 0), '#4d4f50', () => strokePts([[x - 2, -186], [x - 2, -4]], 'rgba(255,255,255,0.25)', 1), 31300 + x);
    pc(box(-56, -70, 52, -62), '#4d4f50', null, 31303);
    pc(box(-70, -196, 68, -186), '#5b5d5e', () => strokePts([[-68, -194], [66, -194]], 'rgba(255,255,255,0.3)', 1.2), 31304);
    pc(rrect(-64, -300, 62, -194, 12), '#d9cfb4', () => {                                                        // caisson
      strokePts([[-56, -292], [54, -292]], 'rgba(255,255,255,0.55)', 2); strokePts([[-60, -246], [58, -246]], 'rgba(120,100,70,0.45)', 1.4);
      hatch(box(34, -300, 62, -194), 0.8, 3.8, 0.24); shade(-60, -300, 60, -194, 0.2, [-64, -300, 62, -194]);
      fillPts(box(-40, -236, -14, -222), '#bfb498'); dot(14, -230, 4, '#6a6050'); dot(28, -230, 4, '#6a6050');
    }, 31305);
    pc([[-62, -280], [-50, -280], [-50, -252], [-62, -252]], '#c9bfa4', null, 31310);                            // perforateur de bande
    pc(ribbon([[-58, -254], [-66, -236], [-60, -214], [-70, -200]], 6, 6), '#e0c060', () => { for (let k = 0; k < 4; k++) dot(-61 - k * 2, -246 + k * 11, 1.2, 'rgba(60,50,30,0.6)'); }, 31311, { drop: false });
    pc([[-118, -188], [-62, -192], [-62, -230], [-112, -206]], '#cfc4a8', () => {                                // clavier incliné, touches rondes
      for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { const x = -108 + i * 12 + j * 3, y = -204 + j * 6 - i * 5; dot(x, y, 3.8, '#38383a'); dot(x - 0.8, y - 1, 1.5, 'rgba(255,255,255,0.45)'); }
      strokePts([[-112, -206], [-62, -230]], 'rgba(255,255,255,0.5)', 1.4);
    }, 31306);
    pc([[-46, -298], [52, -298], [54, -318], [42, -332], [-34, -332], [-48, -318]], '#c8bd9f', () => {          // capot du rouleau
      strokePts([[-36, -328], [40, -328]], 'rgba(255,255,255,0.45)', 1.6); hatch(box(30, -332, 54, -298), 0.8, 3.6, 0.22);
    }, 31307);
    pc(ell(-50, -314, 9, 9, 12), '#5b5d5e', () => dot(-50, -314, 3, '#9a9ea4'), 31312);                         // bouton du rouleau
    pc([[-2, -330], [30, -330], [32, -372], [38, -410], [52, -434], [70, -440], [80, -430], [64, -424], [52, -406], [44, -370], [2, -338]], '#f0ead8', () => {   // papier qui sort
      for (let k = 0; k < 5; k++) strokePts([[4 + k * 2, -344 - k * 14], [14 + k * 2, -346 - k * 14], [26 + k * 2, -343 - k * 14]], 'rgba(90,90,100,0.3)', 1);
    }, 31308);
    pc(ribbon([[-58, -40], [-40, -12], [40, -6], [140, -4], [240, -6]], 6, 6), '#1d1c1e', null, 31309, { drop: false });     // câble vers l'IMP, au sol
  }
  function drawBureau() {                                                        // bureau en métal gris ; cendrier vide, tasse (la vapeur est animée)
    pc(box(-140, -235, 140, -221), '#6e7571', () => strokePts([[-138, -233], [138, -233]], 'rgba(255,255,255,0.35)', 1.6), 32000);
    pc(box(-132, -221, 48, -70), '#737a76', () => hatch(null, 0.2, 5, 0.2, 1, undefined, [-132, -221, 48, -70]), 32001, { texA: 0.5 });
    for (const x of [-132, -124]) pc(box(x, -221, x + 8, 0), '#5d6360', null, 32002 + x);
    pc(box(50, -221, 136, 0), '#7f8682', () => {
      for (let i = 0; i < 3; i++) { const y = -214 + i * 70; strokePts(box(56, y, 130, y + 62).concat([[56, y]]), 'rgba(40,45,40,0.5)', 1.3); fillPts(box(80, y + 24, 106, y + 30), '#b8b6ae'); }
      hatch(box(110, -221, 136, 0), 0.8, 4, 0.22);
    }, 32005, { texA: 0.5 });
    pc([[52, -244], [92, -244], [86, -236, 1], [58, -236, 1]], 'rgba(200,215,215,0.75)', () => strokePts([[58, -242], [86, -242]], 'rgba(255,255,255,0.6)', 1), 32006);   // cendrier vide
    pc([[98, -268], [126, -268], [124, -236, 1], [100, -236, 1]], '#ece4d0', () => { fillPts(box(100, -268, 124, -262), '#4a3020'); strokePts([[104, -264], [104, -240]], 'rgba(255,255,255,0.5)', 1.4); }, 32007);   // tasse
    pc(ribbon(ep(128, -252, 8, 9, 8, -PI / 2, PI / 2), 4, 4), '#ece4d0', null, 32008, { drop: false });
    pc(ell(-110, -238, 22, 6, 14), '#2e3133', null, 32009);                                                                    // socle de la lampe
  }
  function drawChaise() {                                                        // chaise de bureau à roulettes, poussée sous le bureau
    pc([[-46, -200], [-34, -204], [-30, -120], [-40, -118]], '#4e5d48', () => strokePts([[-42, -196], [-36, -124]], 'rgba(255,255,255,0.3)', 1.4), 32100);
    pc(box(-38, -126, -32, -100), '#3d3f42', null, 32101);
    pc([[-44, -112], [40, -112], [44, -98, 1], [-42, -96, 1]], '#4e5d48', () => strokePts([[-40, -108], [38, -108]], 'rgba(255,255,255,0.3)', 1.4), 32102);
    pc(box(-4, -96, 4, -22), '#55585b', null, 32103);
    pc([[-44, -14], [44, -14], [46, -8, 1], [-46, -8, 1]], '#3d3f42', null, 32104);
    for (const x of [-40, 0, 40]) pc(ell(x, -5, 6, 5, 10), '#1d1c1e', null, 32105 + x);
  }
  function drawCorbeille() {
    pc([[-26, -62], [26, -62], [20, 0, 1], [-20, 0, 1]], '#6b7069', () => { for (let x = -20; x < 22; x += 7) strokePts([[x, -60], [x * 0.8, -2]], 'rgba(30,30,30,0.35)', 1); }, 32200);
    for (const [x, y, r] of [[-10, -66, 10], [8, -70, 9], [0, -62, 8]]) pc(ell(x, y, r, r * 0.8, 9), '#ece6d4', () => strokePts([[x - r * 0.6, y], [x + r * 0.5, y - 2]], 'rgba(120,110,90,0.5)', 1), 32201 + x);
  }
  function drawImprimante() {                                                    // imprimante à listing, bannière en accordéon (papier zébré vert, sans caractères)
    pc(box(-66, -64, 66, 0), '#4d4f50', null, 32300);
    pc([[-70, -230], [66, -230], [70, -64, 1], [-70, -64, 1]], '#c9c4b2', () => { fillPts(box(-60, -222, 60, -206), '#3a3b3d'); strokePts([[-64, -226], [62, -226]], 'rgba(255,255,255,0.45)', 1.6); for (const x of [30, 44]) dot(x, -190, 4, '#6a6c70'); hatch(box(40, -230, 70, -64), 0.8, 4, 0.22); }, 32301);
    // bannière : sort du haut, pend devant, plis en zigzag jusqu'au tas au sol
    const Z = [[-58, -214], [-96, -200], [-84, -160], [-100, -120], [-84, -80], [-100, -40], [-88, -8]];
    for (let i = 0; i < Z.length - 1; i++) {
      const a = Z[i], b = Z[i + 1];
      pc([[a[0], a[1]], [a[0] + 46, a[1] + 2], [b[0] + 46, b[1] + 2], [b[0], b[1]]], i % 2 ? '#e2e6d0' : '#eef0de', () => {
        for (let k = 0; k < 3; k++) { const u0 = k / 3 + 0.05, u1 = u0 + 0.16; fillPts([[lerp(a[0], b[0], u0), lerp(a[1], b[1], u0)], [lerp(a[0], b[0], u0) + 46, lerp(a[1], b[1], u0) + 2], [lerp(a[0], b[0], u1) + 46, lerp(a[1], b[1], u1) + 2], [lerp(a[0], b[0], u1), lerp(a[1], b[1], u1)]], 'rgba(150,190,140,0.55)'); }
        for (const f of [0.06, 0.94]) for (let k = 0; k < 6; k++) { const u = (k + 0.5) / 6; dot(lerp(a[0], b[0], u) + 46 * f, lerp(a[1], b[1], u) + 1, 1.4, 'rgba(90,90,80,0.5)'); }
      }, 32310 + i);
    }
    pc([[-110, -10], [-40, -12], [-36, 0, 1], [-112, 0, 1]], '#e8ead6', () => { for (let y = -9; y < 0; y += 3) strokePts([[-108, y], [-38, y]], 'rgba(120,150,110,0.6)', 1); }, 32320);
  }
  // lampe de bureau à bras articulé (animée : o.lampe = angle en rad autour du socle)
  function drawLampe(a) {
    const B = LO.P.lampe, c = cx_();
    c.save(); c.translate(B[0], B[1]); c.rotate(a);
    pc(ribbon([[0, 0], [8, -70], [14, -128]], 6, 5), '#2e3133', null, 32400, { drop: false });
    pc(ribbon([[14, -128], [48, -120], [78, -104]], 5, 5), '#2e3133', null, 32401, { drop: false });
    M.rivet(14, -128, 3.4);
    pc([[72.7, -105.1], [83.3, -110.9], [117.4, -82.8], [78.6, -61.2]], '#3e5a46', () => { strokePts([[76, -102], [84, -76]], 'rgba(255,255,255,0.35)', 1.6); hatch(null, 0.8, 3.6, 0.25, 1, undefined, [70, -112, 120, -60]); }, 32402);
    if (!SIL()) { const gg = c.createRadialGradient(98, -72, 1, 98, -72, 16); gg.addColorStop(0, 'rgba(255,245,200,0.95)'); gg.addColorStop(1, 'rgba(255,245,200,0)'); c.fillStyle = gg; c.fillRect(82, -88, 32, 32); }
    c.restore();
  }
  LO.init = function () {
    if (LO.K) return LO.K;
    const K = (LO.K = {});
    K.fond = M.pre(M.W, BACK + 5, (c) => drawFondUCLA(c));
    K.collines = M.pre(M.W, 860, (c) => drawCollines(c));
    const F = (w, h, fn) => { const cv = M.cutFlat(w, h, w / 2, h - 10, fn); cv.padB = 10; return M.withShadow(cv, 8); };
    K.sigma = F(330, 560, drawSigma); K.imp = F(200, 500, drawIMP); K.classeur = F(130, 320, drawClasseur); K.teletype = F(400, 470, drawTeletype);
    K.bureau = F(310, 290, drawBureau); K.chaise = F(120, 230, drawChaise); K.corbeille = F(80, 100, drawCorbeille); K.imprimante = F(260, 260, drawImprimante);
    K.sri = M.pre(460, 600, (c) => { c.translate(230, 300); drawFondSRI(); });
    return K;
  };

  // ---------- animations (temps global)
  function ciel(g, o) {
    const c = cx_(), Fn = U.fen, au = clamp(o.aube || 0);
    const gr = c.createLinearGradient(0, Fn.y0, 0, Fn.y1);
    gr.addColorStop(0, M.mixc('#141c33', '#6f86b0', au)); gr.addColorStop(0.7, M.mixc('#22305a', '#d9a27a', au)); gr.addColorStop(1, M.mixc('#2c3a5a', '#f0c48a', au));
    c.fillStyle = gr; c.fillRect(Fn.x0 - 4, Fn.y0 - 4, Fn.x1 - Fn.x0 + 8, Fn.y1 - Fn.y0 + 8);
    const R = M.rng(901);
    for (let i = 0; i < 26; i++) { const x = lerp(Fn.x0 + 6, Fn.x1 - 6, R()), y = lerp(Fn.y0 + 44, 700, R()), ph = R() * TAU, r = 0.9 + R() * 1.4;
      dot(x, y, r, `rgba(255,250,230,${(0.35 + 0.5 * Math.abs(Math.sin(g * (0.7 + R()) + ph))) * (1 - au * 0.9)})`); }
    const lx = 880, ly = 480, lr = 22;                                                     // lune
    const hg = c.createRadialGradient(lx, ly, lr, lx, ly, lr * 3); hg.addColorStop(0, `rgba(240,235,210,${0.3 * (1 - au)})`); hg.addColorStop(1, 'rgba(240,235,210,0)'); c.fillStyle = hg; c.fillRect(lx - lr * 3, ly - lr * 3, lr * 6, lr * 6);
    dot(lx, ly, lr, M.mixc('#efe8cf', '#e6e2d6', au)); dot(lx - 7, ly - 4, 5, 'rgba(190,185,160,0.5)'); dot(lx + 6, ly + 7, 3.5, 'rgba(190,185,160,0.5)');
    const fi = o.filante; if (fi != null && fi > 0 && fi < 1) {                           // étoile filante
      const x = lerp(Fn.x0 + 30, Fn.x1 - 60, fi), y = lerp(Fn.y0 + 60, 580, fi), gg = c.createLinearGradient(x, y, x - 70, y - 40);
      gg.addColorStop(0, `rgba(255,250,225,${Math.sin(PI * fi)})`); gg.addColorStop(1, 'rgba(255,250,225,0)'); c.strokeStyle = gg; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 70, y - 40); c.stroke();
    }
    c.drawImage(LO.K.collines, 0, 0);
    const R2 = M.rng(902);                                                                  // lumières de la ville
    for (let i = 0; i < 34; i++) { const x = lerp(Fn.x0 + 4, Fn.x1 - 4, R2()), y = lerp(728, 816, R2()), ph = R2() * TAU, col = R2() < 0.7 ? '255,214,140' : '220,235,255';
      dot(x, y, 1.6, `rgba(${col},${(0.45 + 0.55 * (0.5 + 0.5 * Math.sin(g * (1.5 + R2() * 2) + ph))) * (1 - au * 0.6)})`); }
  }
  function horloge(g, o) {                                                                  // pendule murale ronde (aiguilles qui tournent, trotteuse qui saute)
    const H = U.horloge, c = cx_(), hr = 10.5 + (g / 3600) + (o.heures || 0), mn = (hr % 1) * 60, sec = Math.floor(g) % 60;
    pc(ell(H.x, H.y, H.r + 6, H.r + 6, 24), '#2a2620', null, 30100);
    pc(ell(H.x, H.y, H.r, H.r, 24), '#f1ead6', () => { for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; strokePts([[H.x + Math.sin(a) * (H.r - 8), H.y - Math.cos(a) * (H.r - 8)], [H.x + Math.sin(a) * (H.r - 2), H.y - Math.cos(a) * (H.r - 2)]], '#2a2620', k % 3 ? 1.2 : 2.6); } }, 30101);
    const aig = (a, L, w, col) => strokePts([[H.x - Math.sin(a) * 6, H.y + Math.cos(a) * 6], [H.x + Math.sin(a) * L, H.y - Math.cos(a) * L]], col, w);
    aig((hr % 12) / 12 * TAU, H.r * 0.5, 3.6, '#1d1a16'); aig(mn / 60 * TAU, H.r * 0.78, 2.4, '#1d1a16');
    aig((o.heures ? (mn * 60 % 60) : sec) / 60 * TAU, H.r * 0.85, 1.2, '#9a2f25'); dot(H.x, H.y, 3, '#9a2f25');
  }
  function neons(g, o) {                                                                    // tubes allumés ; grésillement léger de temps en temps ; o.neon 0..1 = grésillement fort
    const c = cx_();
    U.neons.forEach(([a, b, y], i) => {
      let k = 1; const ng = clamp(o.neon || 0);
      if (i === 0) { const cyc = g % 23; if (cyc > 17 && cyc < 17.5) k = 0.75 + 0.25 * Math.sign(Math.sin(cyc * 60)); }
      if (ng > 0 && i === 0) k *= 1 - ng * (0.5 + 0.5 * Math.sign(Math.sin(g * 47) + Math.sin(g * 31)));
      c.save(); c.globalCompositeOperation = 'lighter';
      const gr = c.createLinearGradient(0, y, 0, y + 150); gr.addColorStop(0, `rgba(210,235,245,${0.22 * k})`); gr.addColorStop(1, 'rgba(210,235,245,0)');
      c.fillStyle = gr; c.beginPath(); c.moveTo(a, y + 6); c.lineTo(b, y + 6); c.lineTo(b + 50, y + 150); c.lineTo(a - 50, y + 150); c.closePath(); c.fill(); c.restore();
      strokePts([[a + 8, y + 3], [b - 8, y + 3]], `rgba(${Math.round(150 + 100 * k)},${Math.round(160 + 95 * k)},${Math.round(165 + 90 * k)},1)`, 5);
    });
  }
  function bobine(x, y, r, a, on) {                                                         // rayons d'une bobine qui tourne
    const c = cx_(); c.save(); c.translate(x, y); c.rotate(a);
    c.fillStyle = 'rgba(184,182,174,0.9)'; for (let i = 0; i < 3; i++) { c.rotate(TAU / 3); c.beginPath(); c.moveTo(r * 0.36, -r * 0.16); c.lineTo(r * 0.8, -r * 0.3); c.lineTo(r * 0.8, r * 0.3); c.lineTo(r * 0.36, r * 0.16); c.closePath(); c.fill(); }
    c.restore(); dot(x, y, r * 0.3, '#b8b6ae'); dot(x, y, 3, '#3a3a3a');
  }
  const saccade = (g, sp, ph) => { const u = g * sp + ph, k = Math.floor(u), f = u - k; return (k + ease(clamp(f * 2.2))) * 1.4; };
  function voyant(x, y, r, col, on) {
    if (on <= 0.02) return; const c = cx_();
    const gr = c.createRadialGradient(x, y, 0.5, x, y, r * 2.6); gr.addColorStop(0, `rgba(${col},${0.8 * on})`); gr.addColorStop(1, `rgba(${col},0)`); c.fillStyle = gr; c.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
    dot(x, y, r * 0.8, `rgba(${col},${on})`);
  }
  function animSigma(g, on) {
    const x = U.sigma.x;
    for (const sx of [-1, 1]) for (const dx of [-34, 34]) {
      const cx = x + (sx < 0 ? -78 : 78) + dx, a = on > 0 ? saccade(g, 0.6 + 0.1 * dx / 34, sx + dx) * (dx < 0 ? 1 : -1) : 0;
      bobine(cx, BACK - 400, 27, a, on);
    }
    for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) { const h = hash(i * 7 + j * 13), b = Math.sin(g * (1.2 + h * 3) + h * 20) > 0.2 - h * 0.6 ? 1 : 0; voyant(x - 150 + 22 + i * 20, BACK - 284 + j * 20, 5, h > 0.5 ? '255,190,90' : '255,110,80', b * on); }
  }
  function animIMP(g, on) {
    const x = U.imp.x;
    for (let i = 0; i < 6; i++) for (let j = 0; j < 5; j++) { const h = hash(i * 11 + j * 5 + 3), b = Math.sin(g * (2 + h * 4) + h * 30) > 0.1 ? 1 : 0; voyant(x - 50 + i * 20, BACK - 404 + j * 22, 5, j < 2 ? '255,90,70' : '255,180,70', b * on); }
  }
  function cartes(g, k) {                                                                   // petite pile de cartes perforées au bout de l'étagère (k 0..1 : elle glisse et tombe en éventail)
    const E = U.etagere, x0 = E.x1 - 46, y0 = E.y;
    for (let i = 0; i < 9; i++) {
      const d = clamp(k * 1.6 - i * 0.06), fall = ease(d), x = x0 + 30 * clamp(d * 3) + fall * (20 + i * 9), y = y0 - 4 - i * 3.2 + fall * fall * (BACK - y0 - 8 + i * 0) - (d > 0 ? Math.sin(PI * clamp(d * 1.2)) * 20 : 0);
      const a = fall * (i % 2 ? 1.2 : -0.9) + (d > 0 ? 0.1 : 0);
      const c = cx_(); c.save(); c.translate(x + 20, Math.min(y, BACK - 6)); c.rotate(a);
      pc([[-20, -3], [18, -3], [20, -1, 1], [20, 3, 1], [-20, 3, 1]], '#efe6cc', () => { for (let j = 0; j < 4; j++) dot(-14 + j * 9, 0, 1, 'rgba(90,80,60,0.6)'); }, 30200 + i, { drop: false });
      c.restore();
    }
  }
  // o : { tel (true) téléphone beige posé, telO (options du téléphone : sonne, lumiere), neon 0..1, lampe (rad), cartes 0..1, heures (heures ajoutées à la pendule),
  //       vapeur 0..1 (1), aube 0..1, filante 0..1 (trajet de l'étoile), listing 0..1 (feuille qui s'enroule et glisse), machines 0..1 (1 = voyants et bobines en marche), cast }
  LO.labUCLA = function (t, o) {
    o = o || {}; const K = LO.K || LO.init(), g = M.tg(t), c = cx_(), cast = o.cast || { dx: 16, dy: 6, a: 0.3 }, on = o.machines == null ? 1 : clamp(o.machines);
    ciel(g, o);
    c.drawImage(K.fond, 0, 0);
    horloge(g, o);
    neons(g, o);
    cartes(g, clamp(o.cartes || 0));
    M.flat(K.sigma, U.sigma.x, BACK, { cast }); animSigma(g, on);
    M.flat(K.classeur, U.classeur.x, BACK, { cast });
    M.flat(K.imp, U.imp.x, BACK, { cast }); animIMP(g, on);
    M.flat(K.corbeille, U.corbeille.x, BACK, { cast });
    M.flat(K.teletype, U.teletype.x, BACK, { cast });
    M.flat(K.imprimante, U.imprimante.x, BACK, { cast });
    const ls = clamp(o.listing || 0);
    if (ls > 0) { c.save(); c.translate(lerp(U.imprimante.x - 70, U.imprimante.x - 190, ease(ls)), BACK - 8 - 30 * Math.sin(PI * clamp(ls * 1.4)) * (1 - ls)); c.rotate(-ls * 2.2);
      pc([[-22, -14], [22, -12], [24, 12], [-20, 14]], '#eef0de', () => { fillPts(box(-22, -6, 24, 2), 'rgba(150,190,140,0.55)'); }, 32330); c.restore(); }
    M.flat(K.bureau, U.bureau.x, BACK, { cast });
    if (o.tel !== false) LO.telephone(LO.P.tel[0], LO.P.tel[1], LO.P.telS, Object.assign({ coul: 'beige', t }, o.telO || {}));
    const va = o.vapeur == null ? 1 : clamp(o.vapeur);
    if (va > 0.01) M.fumee(t, { x: LO.P.tasse[0], y: LO.P.tasse[1] - 4, s: 0.32, n: 4, haut: 120, vent: 14, a: 0.55 * va, per: 2.6, seed: 31 });
    const la = o.lampe || 0; drawLampe(la);
    // faisceau de la lampe + poussière
    const B = LO.P.lampe, m = new DOMMatrix().translate(B[0], B[1]).rotate(la * D), p1 = mp(m, [79, -61]), p2 = mp(m, [117, -83]);
    c.save(); c.globalCompositeOperation = 'lighter';
    const gr = c.createLinearGradient(p1[0], p1[1], p1[0] + 40, B[1]); gr.addColorStop(0, 'rgba(255,230,170,0.32)'); gr.addColorStop(1, 'rgba(255,230,170,0.05)');
    c.fillStyle = gr; c.beginPath(); c.moveTo(p1[0], p1[1]); c.lineTo(p2[0], p2[1]); c.lineTo(p2[0] + 70, B[1] + 2); c.lineTo(p1[0] - 10, B[1] + 2); c.closePath(); c.fill(); c.restore();
    M.poussiere(t, { x: p1[0] - 6, y: p1[1] + 10, w: 110, h: B[1] - p1[1] - 14, n: 12, a: 0.6, seed: 23 });
    M.flat(K.chaise, U.chaise.x, BACK, { cast });
  };

  // =====================================================================
  // DÉCOR 2 — LABO DE SRI (Menlo Park), intérieur de la vignette. Dessiné au repère (cx, cy) à l'échelle k = min(rx/220, ry/280).
  // =====================================================================
  const SR = { sol: 168, pieds: [-48, 168], piedsRepare: [40, 168], arrivee: [72, 22], tel: [-120, 30], machine: [168, 40], fumee: [118, -124] };
  function drawFondSRI() {
    const c = cx_();
    pc(box(-232, -302, 232, SR.sol), '#b08850', () => {                                                    // boiseries brun miel
      for (let x = -220; x < 232; x += 46) { strokePts([[x, -300], [x, SR.sol]], 'rgba(90,55,25,0.45)', 2); strokePts([[x + 3, -300], [x + 3, SR.sol]], 'rgba(255,220,160,0.25)', 1); }
      for (let i = 0; i < 40; i++) { const x = -230 + hash(i + 3) * 460, y = -300 + hash(i * 3.1) * 460; strokePts([[x, y], [x + 4, y + 30]], 'rgba(120,75,35,0.18)', 1.2); }
    }, 33000, { drop: false, texA: 0.5 });
    pc(box(-232, 96, 232, 106), '#7a5430', null, 33001, { drop: false });
    pc(box(-232, SR.sol, 232, 302), '#6b4a2e', () => { for (let y = SR.sol + 14; y < 300; y += 18) strokePts([[-230, y], [230, y]], 'rgba(40,25,10,0.4)', 1.4); }, 33002, { drop: false });
    // fenêtre de nuit (ciel, lune ; le chêne est animé)
    pc(box(-212, -246, -62, -66), '#5e4024', null, 33010);
    const gr = c.createLinearGradient(0, -236, 0, -76); gr.addColorStop(0, '#141c33'); gr.addColorStop(1, '#2c3a5a'); c.fillStyle = gr; c.fillRect(-202, -236, 130, 160);
    dot(-96, -206, 13, '#efe8cf'); for (const [x, y] of [[-180, -220], [-150, -196], [-130, -226], [-190, -150]]) dot(x, y, 1.3, 'rgba(255,250,230,0.8)');
    pc([[-160, -76], [-150, -150], [-162, -170], [-146, -168], [-140, -150], [-136, -76]], '#2a2016', null, 33011, { drop: false });   // tronc du chêne
    strokePts([[-137, -76], [-137, -236]], '#5e4024', 5); strokePts([[-202, -156], [-72, -156]], '#5e4024', 5);                        // croisillons
    pc(box(-220, -70, -54, -60), '#7a5430', () => strokePts([[-218, -68], [-56, -68]], 'rgba(255,230,180,0.4)', 1.2), 33012);           // appui
    // tableau de liège, feuillets à dessins
    pc(box(18, -262, 156, -150), '#6e4a2a', null, 33020);
    pc(box(24, -256, 150, -156), '#b9925e', () => { const R = M.rng(8); for (let i = 0; i < 80; i++) dot(24 + R() * 126, -256 + R() * 100, 1, 'rgba(90,60,30,0.4)'); }, 33021);
    const feuille = (x, y, a, f, s) => { c.save(); c.translate(x, y); c.rotate(a); pc(box(-18, -22, 18, 22), '#f2ecdc', f, s); c.restore(); dot(x, y - 18, 3, '#9a2f25'); };
    feuille(52, -212, -0.06, () => { const N = [[-8, -10], [8, -12], [-6, 8], [9, 10]]; for (const [i, j] of [[0, 1], [0, 2], [1, 3], [2, 3]]) strokePts([N[i], N[j]], '#3e5566', 1.4); N.forEach((n) => strokePts(ell(n[0], n[1], 4, 4, 8).concat([[n[0] + 4, n[1]]]), '#3e5566', 1.4)); }, 33022);
    feuille(96, -204, 0.08, () => { const L = []; for (let i = 0; i <= 12; i++) L.push([-14 + i * 2.4, Math.sin(i * 0.9) * 8]); strokePts(L, '#9a2f25', 1.6); strokePts([[-15, 14], [15, 14]], '#555', 1); }, 33023);
    feuille(132, -214, -0.03, () => { strokePts(box(-10, -12, 10, 6).concat([[-10, -12]]), '#4a3020', 1.4); strokePts([[0, 6], [0, 14], [-8, 14]], '#4a3020', 1.4); }, 33024);
    // SDS 940 : armoires crème à bandeau rouge brique (bobines et voyants animés ; panneau inférieur droit : intérieur câblé, la porte est animée)
    for (const [x0, x1] of [[30, 120], [124, 214]]) {
      pc(box(x0, -122, x1, SR.sol), '#e6dcc4', () => {
        fillPts(box(x0, -122, x1, -100), '#9a4a35'); fillPts(box(x0, SR.sol - 12, x1, SR.sol), '#9a4a35');
        fillPts(box(x0 + 8, -92, x1 - 8, -20), '#3a3530');
        for (const dx of [-20, 20]) { dot((x0 + x1) / 2 + dx, -56, 18, '#8d8f92'); dot((x0 + x1) / 2 + dx, -56, 15, '#2b2420'); }
        strokePts([[x0 + 3, -118], [x0 + 3, SR.sol - 14]], 'rgba(255,255,255,0.4)', 2); hatch(box(x1 - 14, -122, x1, SR.sol), 0.8, 4, 0.22);
      }, 33030 + x0, { texA: 0.5 });
    }
    pc(box(132, 0, 206, 150), '#2a2622', () => {                                                               // intérieur câblé
      for (let i = 0; i < 4; i++) fillPts(box(138 + i * 17, 8, 150 + i * 17, 96), i % 2 ? '#3f6a48' : '#4a7a52');
      for (const [col, y] of [['#9a2f25', 104], ['#c9962e', 114], ['#4f6f8f', 124], ['#9a2f25', 134]]) strokePts([[136, y], [160, y + 8], [180, y - 4], [204, y + 6]], col, 2.2);
    }, 33040);
    // console (clavier incliné) devant l'armoire gauche : c'est là qu'arrivent les cubes
    pc([[22, 18], [116, 18], [124, 40], [16, 40]], '#d9cfb4', () => { for (let i = 0; i < 7; i++) dot(30 + i * 12, 30, 3, '#3a3a38'); strokePts([[24, 20], [114, 20]], 'rgba(255,255,255,0.5)', 1.4); }, 33050);
    pc(box(26, 40, 112, 50), '#bfb498', null, 33051);
    // table : cafetière, téléphone céladon
    pc(box(-222, 40, -64, 50), '#7a5430', () => strokePts([[-220, 42], [-66, 42]], 'rgba(255,230,180,0.4)', 1.2), 33060);
    for (const x of [-210, -76]) pc(box(x, 50, x + 8, SR.sol), '#6a4628', null, 33061 + x);
    pc([[-206, 40], [-170, 40], [-172, -2], [-200, -2]], 'rgba(200,215,220,0.55)', () => fillPts(box(-206, 10, -170, 40), '#3a2418'), 33064);   // cafetière
    pc([[-210, -2], [-166, -2], [-170, -16], [-206, -16]], '#2a2a2a', null, 33065);
    c.save(); c.translate(SR.tel[0], 40); c.scale(0.42, 0.42); drawTelephone({ coul: 'celadon' }); c.restore();
    // plante en pot sur l'appui de la fenêtre
    pc([[-208, -70], [-182, -70], [-185, -92], [-205, -92]], '#9a4a35', null, 33070);
    for (let i = 0; i < 6; i++) { const a = -PI / 2 + (i - 2.5) * 0.35; pc([[-195, -92], [-195 + Math.cos(a) * 34 - 5, -92 + Math.sin(a) * 34], [-195 + Math.cos(a) * 42, -92 + Math.sin(a) * 42], [-195 + Math.cos(a) * 34 + 5, -92 + Math.sin(a) * 34]], i % 2 ? '#4f6b3e' : '#5d7a4a', null, 33071 + i, { drop: false }); }
    // pied du ventilateur sur l'appui
    pc([[-120, -70], [-100, -70], [-104, -78], [-116, -78]], '#3a3c3e', null, 33080);
    pc(box(-112, -104, -108, -78), '#3a3c3e', null, 33081);
  }
  LO.SRI = SR;
  const sriK = (rx, ry) => Math.min((rx || 220) / 220, (ry || 280) / 280);
  // point nommé de la vignette → [x, y] écran : 'arrivee' (dessus de la console, où se posent les cubes), 'pieds' (pieds de Duvall), 'tel' (prise du téléphone céladon),
  // 'machine' (panneau de réparation), 'fumee' (haut de l'armoire)
  LO.sriPt = function (cx, cy, rx, ry, nom) { const k = sriK(rx, ry), p = nom === 'tel' ? [SR.tel[0] - 66 * 0.42, 40 - 10 * 0.42] : SR[nom]; return p ? [cx + p[0] * k, cy + p[1] * k] : null; };
  LO.sriArrivee = (cx, cy, rx, ry) => LO.sriPt(cx, cy, rx, ry, 'arrivee');
  LO.sriEchelle = (rx, ry) => 0.55 * sriK(rx, ry);                            // échelle conseillée de Duvall dans la vignette
  // o : { cx, cy, rx, ry, plante 0..1, repare 0..1, rallume 0..1 }
  LO.labSRI = function (t, o) {
    o = o || {}; const K = LO.K || LO.init(), g = M.tg(t), c = cx_(), cx = o.cx, cy = o.cy, k = sriK(o.rx, o.ry);
    const pl = clamp(o.plante || 0), rp = clamp(o.repare || 0), ra = clamp(o.rallume || 0);
    const on = clamp(1 - smooth(0, 0.25, pl) * (1 - ra));
    c.save(); c.translate(cx, cy); c.scale(k, k);
    c.drawImage(K.sri, -230, -300);
    // feuilles du chêne qui bougent (dans la fenêtre)
    c.save(); c.beginPath(); c.rect(-202, -236, 130, 160); c.clip();
    const R = M.rng(55);
    for (let i = 0; i < 9; i++) { const x = -196 + R() * 120, y = -232 + R() * 90, r = 18 + R() * 16, sw = Math.sin(g * 0.9 + i) * 3;
      fillPts(ell(x + sw, y, r, r * 0.75, 10), i % 2 ? '#24331f' : '#2f3d2c'); }
    c.restore();
    strokePts([[-137, -76], [-137, -236]], '#5e4024', 5); strokePts([[-202, -156], [-72, -156]], '#5e4024', 5);
    // ventilateur qui tourne
    const fx = -110, fy = -116, fa = g * 9;
    for (let i = 0; i < 3; i++) { const a = fa + i * TAU / 3; fillPts(ell(fx + Math.cos(a) * 11, fy + Math.sin(a) * 11 * 0.9, 10, 5, 8).map((p) => p), 'rgba(170,175,170,0.85)'); }
    strokePts(ell(fx, fy, 22, 22, 18).concat([[fx + 22, fy]]), '#3a3c3e', 1.8); for (let i = 0; i < 6; i++) { const a = i / 6 * PI; strokePts([[fx + Math.cos(a) * 22, fy + Math.sin(a) * 22], [fx - Math.cos(a) * 22, fy - Math.sin(a) * 22]], 'rgba(58,60,62,0.55)', 0.8); }
    dot(fx, fy, 4, '#3a3c3e');
    // bobines et voyants
    let j = 0;
    for (const [x0, x1] of [[30, 120], [124, 214]]) for (const dx of [-20, 20]) { const bx = (x0 + x1) / 2 + dx, a = on > 0.5 ? saccade(g, 0.7, j++) * (dx < 0 ? 1 : -1) : 0.4 * j++; bobine(bx, -56, 15, a, on); }
    for (let i = 0; i < 5; i++) for (let l = 0; l < 2; l++) { const h = hash(i * 5 + l * 17 + 2), b = Math.sin(g * (1.5 + h * 3) + h * 20) > 0 ? 1 : 0; dot(140 + i * 15, -10 + l * 12 - 2, 3.4, '#4a2a24'); voyant(140 + i * 15, -12 + l * 12, 3.4, h > 0.5 ? '255,190,90' : '255,100,80', b * on); }
    for (let i = 0; i < 5; i++) { const h = hash(i * 3 + 9); dot(40 + i * 15, -10, 3.4, '#4a2a24'); voyant(40 + i * 15, -10, 3.4, '120,230,140', (Math.sin(g * (2 + h * 2) + h * 9) > 0.3 ? 1 : 0) * on); }
    // porte du panneau (s'ouvre avec repare)
    const op = ease(rp), wdoor = 74 * Math.cos(op * 1.35);
    if (wdoor > 2) pc(box(206 - wdoor, 0, 206, 150), op > 0.5 ? '#cfc4aa' : '#e6dcc4', () => { strokePts([[210 - wdoor, 20], [210 - wdoor, 130]], 'rgba(60,40,20,0.3)', 1); for (let y = 30; y < 130; y += 12) strokePts([[210 - wdoor + 4, y], [202, y]], 'rgba(60,40,20,0.3)', 1.4); }, 33100);
    // rallumage : bouffée de lumière
    if (ra > 0 && ra < 1) { const gl = c.createRadialGradient(122, -40, 10, 122, -40, 150); gl.addColorStop(0, `rgba(255,236,170,${0.5 * Math.sin(PI * ra)})`); gl.addColorStop(1, 'rgba(255,236,170,0)'); c.fillStyle = gl; c.fillRect(-30, -190, 300, 300); }
    // planté : machine assombrie, fumée grise, une étincelle
    if (on < 1) { c.fillStyle = `rgba(20,15,25,${0.25 * (1 - on)})`; c.fillRect(28, -124, 188, 292); }
    const fu = pl * (1 - ra) * (1 - 0.6 * rp);
    if (fu > 0.02) M.fumee(t, { x: SR.fumee[0], y: SR.fumee[1], s: 0.6, n: 7, haut: 190, vent: 30, col: '#77726c', a: Math.min(0.95, 0.4 + 0.6 * fu), per: 2.2, seed: 41 });
    const sp = Math.max(0, 1 - Math.abs(pl - 0.32) / 0.12) * (1 - ra);
    if (sp > 0) { c.save(); c.translate(150, -112); c.rotate(g * 7); c.fillStyle = `rgba(255,240,170,${sp})`; c.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 6 : 20 * sp + 6, a = i / 10 * TAU; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill(); c.restore(); }
    // vapeur de la cafetière
    c.restore();
    M.fumee(t, { x: cx - 188 * k, y: cy - 18 * k, s: 0.22 * k, n: 4, haut: 80 * k, vent: 8, a: 0.5, per: 2.4, seed: 19 });
  };
})();
