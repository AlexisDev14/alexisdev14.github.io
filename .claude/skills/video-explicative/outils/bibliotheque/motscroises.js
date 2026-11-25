// persos.js — « Les mots croisés, le jeu que le New York Times méprisait » : marionnettes, accessoires et décors PROPRES À CETTE VIDÉO.
// Espace M.mc (alias MC). Appeler MC.init() dans S.init. Mode d'emploi : persos.md (ne pas lire ce fichier en entier).
// Aucun texte, lettre, chiffre ni logo. Déterministe (hash / M.rng, jamais Math.random) : fonction pure de t.
// INDEX : 1) géométrie, palette  2) objets (grilleLosange, grilleCarree, journalGrille, journalTimes, recueil, crayon, pincettes, note, mouchoir)
//         3) objets tenus, IK, enveloppes  4) corps communs  5) Wynne  6) rédacteur  7) joueurs A B C, bibliothécaire
//         8) accessoires seuls  9) bureau du New York Times (MC.bureauTimes / bureauTimesSol)  10) MC.init
(function () {
  const X = M.X, TAU = M.TAU, PI = Math.PI, D = 180 / PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, hash } = M;
  const MC = (M.mc = {});
  const CH = M.chars;
  const cx_ = () => M.ctx();
  const SIL = () => M._sil();
  const OFFP = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];
  const BACK = M.ST.back, W = M.W;

  // =====================================================================
  // 1) GÉOMÉTRIE, PALETTE
  // =====================================================================
  function ep(cx, cy, rx, ry, n, a0, a1) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; }
  function ell(cx, cy, rx, ry, n) { const o = ep(cx, cy, rx, ry, n || 16, 0, TAU); o.pop(); return o; }
  const rect = (x0, y0, x1, y1) => [[x0, y0, 1], [x1, y0, 1], [x1, y1, 1], [x0, y1, 1]];
  const scl = (pts, sx, sy) => { sy = sy == null ? sx : sy; return pts.map((p) => (p[2] ? [p[0] * sx, p[1] * sy, 1] : [p[0] * sx, p[1] * sy])); };
  const tr = (pts, dx, dy) => pts.map((p) => (p[2] ? [p[0] + dx, p[1] + dy, 1] : [p[0] + dx, p[1] + dy]));
  const mp = (m, p) => [m.a * p[0] + m.c * p[1] + m.e, m.b * p[0] + m.d * p[1] + m.f];
  const normA = (a) => { while (a > PI) a -= TAU; while (a < -PI) a += TAU; return a; };
  const sm = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  function qbez(p0, p1, p2, n) { n = n || 8; const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]); } return o; }
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
  const bar = (a, b, w) => ribbon([a, b], w, w).map((q) => [q[0], q[1], 1]);
  const pc = (pts, base, paint, seed, o) => piece(pts, base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));
  const flipped = () => { const m = cx_().getTransform(); return m.a * m.d - m.b * m.c < 0; };
  const big = [[-300, -500, 1], [320, -500, 1], [320, 500, 1], [-300, 500, 1]];
  const C = {
    papier: '#ede4cc', papierD: '#d6cbb0', blanc: '#f6f1e4', encre: '#1d1b1c', crayonG: 'rgba(92,92,100,0.8)',
    chemise: '#ece6d8', chemiseD: '#cfc8b8', bordeaux: '#6e2a2a', bordeauxD: '#561f20', anthra: '#3d3c40', anthraD: '#2e2d31',
    roux: '#8a4a2a', rouxL: '#a8643a', moust: '#b25a2c', visiere: '#3f7a52', visiereL: '#7fb48a',
    redingote: '#1f2328', redingoteL: '#343a42', giletG: '#7c7d7f', argent: '#c9cacb', argentD: '#9a9c9e', perle: '#bdbcb5', rayure: '#6a6a6e',
    or: '#c4a04a', orD: '#8e6c26', orL: '#e2c472',
    ocre: '#b0843a', ocreD: '#8e6a2c', paille: '#d8c07a', pailleD: '#b39a56', marine: '#2e3a5a', beige: '#a7a08e',
    vert: '#5f7a5a', vertD: '#4b6247', noirC: '#1c1a1c', bas: '#d2b596',
    brun: '#7a5434', brunD: '#5e4026', brunL: '#8a6440',
    prune: '#5a3048', pruneD: '#45243a', grisC: '#b4b1aa',
    orange: '#b5542c', orangeD: '#8e3f1f', jaune: '#d9b23a', jauneD: '#b38e24', rose: '#d98c8c', cordon: '#a8262a',
    fer: '#2a2a2c', ferL: '#5c5c60', acajou: '#5e2e1c', acajouD: '#45200f', acajouL: '#7a4028',
    boiserie: '#3e2418', boiserieL: '#55331f', mur: '#4a4636', laiton: '#b8913e', laitonD: '#8a6a28', laitonL: '#dcbd6c',
    peauW: '#e6c1a0', peauWD: '#c9a283', peauR: '#e4c3a6', peauRD: '#c6a385', peauA: '#ebc8a6', peauB: '#efcdb0', peauC: '#ddb796', peauL: '#e8c6aa',
  };
  MC.C = C;

  // =====================================================================
  // 2) OBJETS — dessinés à l'échelle 1, repère propre ; grip = prise ; plat = jamais en miroir (contre-retourné en dir −1 autour de `centre`)
  // =====================================================================
  // ---- grille carrée 9×9 (cases noires symétriques). (0,0) = centre ; cs = taille de case
  const GC_PAT = ['....#....', '....#....', '.........', '#..#.#..#', '##.....##', '#..#.#..#', '.........', '....#....', '....#....'];
  const GC_WHITE = (() => { const o = []; for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (GC_PAT[r][c] === '.') o.push([c, r, hash(r * 9 + c + 0.37)]); return o.sort((a, b) => a[2] - b[2]); })();
  function gridCarree(cx, cy, cs, rempli, papier) {
    const h = cs * 4.5;
    if (papier) pc(rect(cx - h - 6, cy - h - 6, cx + h + 6, cy + h + 6), C.blanc, () => hatch(null, 0.6, 5, 0.06, 1, M.P.encre, [cx - h - 8, cy - h - 8, cx + h + 8, cy + h + 8]), 7101, { drop: false });
    fillPts(rect(cx - h, cy - h, cx + h, cy + h), '#fbf8ef', 0, 0);
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (GC_PAT[r][c] === '#') fillPts(rect(cx - h + c * cs, cy - h + r * cs, cx - h + (c + 1) * cs, cy - h + (r + 1) * cs), C.encre, 0, 0);
    const n = Math.floor(clamp(rempli || 0) * GC_WHITE.length + 1e-6);
    for (let i = 0; i < n; i++) {
      const [c, r] = GC_WHITE[i], x0 = cx - h + c * cs, y0 = cy - h + r * cs;
      fillPts(rect(x0 + 1, y0 + 1, x0 + cs - 1, y0 + cs - 1), 'rgba(120,120,128,0.32)', 0, 0);
      for (let j = 0; j < 3; j++) { const u = (j + 1) / 4; strokePts([[x0 + cs * 0.2, y0 + cs * (u + 0.12)], [x0 + cs * 0.8, y0 + cs * (u - 0.1)]], C.crayonG, 1.1); }
    }
    for (let i = 0; i <= 9; i++) {
      strokePts([[cx - h + i * cs, cy - h], [cx - h + i * cs, cy + h]], C.encre, i % 9 ? 1.1 : 2.2);
      strokePts([[cx - h, cy - h + i * cs], [cx + h, cy - h + i * cs]], C.encre, i % 9 ? 1.1 : 2.2);
    }
  }
  function drawGrilleCarree(o) { gridCarree(0, 0, 17, o.rempli, true); }

  // ---- feuille-grille de 1913 : losange de cases, centre creux en losange ; trace 0..1 (dessin case à case)
  const GL_CELLS = (() => { const o = []; for (let r = -6; r <= 6; r++) for (let c = -6; c <= 6; c++) { const d = Math.abs(r) + Math.abs(c); if (d <= 6 && d >= 3) o.push([c, r]); } return o; })();
  const GL = { w: 120, h: 150, cy: -28, cs: 16 };
  function drawGrilleLosange(o) {
    const k = clamp(o.trace == null ? 1 : o.trace), S = GL.cs;
    pc([[-120, -150, 1], [118, -151, 1], [121, -40], [120, 150, 1], [-119, 151, 1], [-121, 40]], C.papier, () => {
      hatch(null, 0.7, 6, 0.07, 1, M.P.encre, [-130, -160, 130, 160]); shade(120, -150, -120, 150, 0.12, [-130, -160, 130, 160]);
      strokePts([[-118, 2], [118, -2]], 'rgba(120,100,70,0.18)', 1);
    }, 7201);
    const n = GL_CELLS.length, m = k * n;
    for (let i = 0; i < n; i++) {
      if (i >= m) break;
      const [c, r] = GL_CELLS[i], x0 = c * S - S / 2, y0 = GL.cy + r * S - S / 2, f = clamp(m - i);
      if (f >= 1) { fillPts(rect(x0, y0, x0 + S, y0 + S), '#fbf8ef', 0, 0); strokePts([[x0, y0, 1], [x0 + S, y0, 1], [x0 + S, y0 + S, 1], [x0, y0 + S, 1]], C.encre, 1.3, true); }
      else {   // case en cours : ses côtés se tracent l'un après l'autre
        const P = [[x0, y0], [x0 + S, y0], [x0 + S, y0 + S], [x0, y0 + S], [x0, y0]], L = f * 4, pts = [[x0, y0, 1]];
        for (let j = 0; j < 4; j++) { if (L <= j) break; const u = Math.min(1, L - j); pts.push([lerp(P[j][0], P[j + 1][0], u), lerp(P[j][1], P[j + 1][1], u), 1]); }
        strokePts(pts, C.encre, 1.3);
      }
    }
    const lk = sm(0.85, 1, k);           // indications : lignes grises (aucune lettre)
    if (lk > 0) for (let i = 0; i < 4; i++) for (const sx of [-1, 1]) { const y = 96 + i * 13, x0 = sx < 0 ? -104 : 8; strokePts([[x0, y], [x0 + lerp(0, 96 - (i * 17) % 30, lk), y]], `rgba(110,104,96,${0.7 * lk})`, 2); }
  }

  // ---- journal plié en quatre, grille carrée en haut ; face (true) | false = dos (colonnes) ; court : seulement la partie grille ; rempli
  function colonnes(x0, y0, x1, y1, n, seed, a) {
    const w = (x1 - x0) / n, R = M.rng(seed);
    for (let i = 0; i < n; i++) { const cx0 = x0 + i * w + 3, cx1 = x0 + (i + 1) * w - 3;
      for (let y = y0; y < y1; y += 5.5) { const e = R() < 0.12 ? (cx1 - cx0) * 0.4 : 0; strokePts([[cx0, y], [cx1 - e, y]], `rgba(96,92,86,${a || 0.55})`, 1.5); } }
  }
  function drawJournalGrille(o) {
    const court = !!o.court, y1 = court ? 51 : 125;
    pc([[-92, -125, 1], [91, -126, 1], [92, 0], [92, y1, 1], [-91, y1 + 1, 1], [-92, 0]], '#e6dec8', () => {
      hatch(null, 0.7, 6, 0.06, 1, M.P.encre, [-100, -130, 100, 130]); shade(92, -125, -92, y1, 0.14, [-100, -130, 100, 130]);
    }, 7301);
    if (o.face === false) {
      fillPts(rect(-84, -118, 84, -104), 'rgba(60,56,52,0.55)', 0, 0);
      colonnes(-84, -96, 84, y1 - 8, 4, 31, 0.55); fillPts(rect(-40, -60, 40, -10), 'rgba(120,112,100,0.45)', 0, 0);
    } else {
      gridCarree(0, -40, 17, o.rempli, false);
      colonnes(-90, -116, -78, 37, 1, 41, 0.45); colonnes(78, -116, 90, 37, 1, 43, 0.45);
      if (!court) { colonnes(-86, 46, 86, 118, 3, 47, 0.55); }
    }
    strokePts([[-92, court ? 48 : 0], [92, court ? 48 : 0]], 'rgba(120,104,80,0.3)', 1.2);
  }

  // ---- grand journal du Times ouvert : frise d'arabesques noires (aucune lettre), colonnes ; grille: true = grille dans le coin bas droit
  function arabesque(x, y, s, sens) {   // volute en S
    const P = []; for (let i = 0; i <= 14; i++) { const u = i / 14, a = u * TAU * 0.9; P.push([x + sens * (u * 26 - 13) * s, y + Math.sin(a) * 6 * s]); }
    strokePts(P, C.encre, 2.8); dot(x - sens * 13 * s, y, 3.2 * s, C.encre); dot(x + sens * 13 * s, y, 2.6 * s, C.encre);
    fillPts(ell(x, y - 7 * s, 3.4 * s, 1.6 * s, 8), C.encre, 0, 0); fillPts(ell(x, y + 7 * s, 3.4 * s, 1.6 * s, 8), C.encre, 0, 0);
  }
  function frise(x0, x1, y, s) {
    const mid = (x0 + x1) / 2;
    fillPts([[mid - 14 * s, y - 13 * s, 1], [mid + 14 * s, y - 13 * s, 1], [mid + 14 * s, y + 2 * s], [mid, y + 14 * s, 1], [mid - 14 * s, y + 2 * s]], C.encre, 0, 0);
    fillPts([[mid - 8 * s, y - 8 * s, 1], [mid + 8 * s, y - 8 * s, 1], [mid + 8 * s, y + 1 * s], [mid, y + 8 * s, 1], [mid - 8 * s, y + 1 * s]], '#e9e2cf', 0, 0);
    fillPts([[mid - 4 * s, y - 4 * s, 1], [mid + 4 * s, y - 4 * s, 1], [mid, y + 4 * s, 1]], C.encre, 0, 0);
    for (const sx of [-1, 1]) { fillPts(ell(mid + sx * 22 * s, y - 6 * s, 5 * s, 3 * s, 8), C.encre, 0, 0); fillPts(ell(mid + sx * 22 * s, y + 6 * s, 5 * s, 3 * s, 8), C.encre, 0, 0); }
    for (let x = mid - 50 * s, i = 0; x > x0 + 14 * s; x -= 30 * s, i++) arabesque(x, y, s, i % 2 ? 1 : -1);
    for (let x = mid + 50 * s, i = 0; x < x1 - 14 * s; x += 30 * s, i++) arabesque(x, y, s, i % 2 ? -1 : 1);
  }
  function drawJournalTimes(o) {
    const rb = o.rabat == null ? 1 : clamp(o.rabat), cc = cx_(); if (rb < 0.02) return;
    cc.save(); cc.translate(0, -110); cc.scale(1, rb); cc.translate(0, 110);
    pc([[-150, -110, 1], [-2, -112], [150, -110, 1], [151, 0], [150, 110, 1], [0, 112], [-150, 110, 1], [-151, 0]], '#e9e2cf', () => {
      hatch(null, 0.7, 6, 0.06, 1, M.P.encre, [-160, -120, 160, 120]);
      shade(-20, 0, 0, 0, 0.18, [-30, -120, 0, 120]); shade(20, 0, 0, 0, 0.12, [0, -120, 30, 120]);
    }, 7401);
    fillPts(rect(-142, -104, 142, -103), C.encre, 0, 0);
    frise(-142, 142, -88, 0.9);
    strokePts([[-142, -72], [142, -72]], C.encre, 1.6); strokePts([[-142, -69], [142, -69]], C.encre, 0.9);
    const g = !!o.grille;
    for (const [x0, x1] of [[-144, -6], [6, 144]]) {
      fillPts(rect(x0, -63, x1, -56), 'rgba(50,46,44,0.75)', 0, 0);
      if (g && x0 > 0) { colonnes(x0, -50, x1, -44, 4, 53, 0.6); continue; }
      colonnes(x0, -50, x1, 104, 4, 51 + x0, 0.6);
      fillPts(rect(x0 + 4, -8, x0 + 64, 34), 'rgba(110,104,96,0.5)', 0, 0); hatch(rect(x0 + 4, -8, x0 + 64, 34), 0.8, 3, 0.35);
    }
    strokePts([[0, -68], [0, 108]], 'rgba(100,90,74,0.35)', 1.2);
    if (g) { pc(rect(1, -41, 149, 107), '#f4efe2', null, 7402, { drop: false }); gridCarree(75, 33, 16.2, o.rempli, false); }
    if (rb < 1) fillPts(rect(-150, -110, 150, 112), `rgba(40,30,20,${0.35 * (1 - rb)})`, 0, 0);
    cc.restore();
  }

  // ---- crayon jaune (mine en bas, gomme en haut) : ≈ 90 de long ; (0,0) = milieu
  function drawCrayon() {
    pc([[-4.6, -32, 1], [4.6, -32, 1], [4.6, 27, 1], [0, 45, 1], [-4.6, 27, 1]], C.jaune, () => {
      fillPts([[-4.6, 27], [4.6, 27], [0, 45]], '#e1c08e', 0, 0); fillPts([[-1.8, 39], [1.8, 39], [0, 45]], '#2a2626', 0, 0);
      strokePts([[1.2, -32], [1.2, 27]], 'rgba(255,240,180,0.6)', 1); strokePts([[-2.4, -32], [-2.4, 27]], 'rgba(140,100,20,0.45)', 1);
    }, 7501);
    pc(rect(-5, -39, 5, -31), '#a9a8a2', () => { strokePts([[-5, -36], [5, -36]], 'rgba(60,60,60,0.5)', 1); }, 7502, { drop: false });
    pc([[-4.6, -39, 1], [4.6, -39, 1], [4.2, -44], [0, -45.5], [-4.2, -44]], C.rose, null, 7503, { drop: false });
  }

  // ---- recueil 1924 : livre relié orange brûlé, grille dorée sur la couverture ; ouvert 0..1 ; crayon pendu au cordon (pendule, temps global)
  const RC = { w: 74, h: 100 };
  function grilleDoree(cx, cy, cs, col, n) {
    const h = cs * n / 2;
    for (let i = 0; i <= n; i++) { strokePts([[cx - h + i * cs, cy - h], [cx - h + i * cs, cy + h]], col, 1.2); strokePts([[cx - h, cy - h + i * cs], [cx + h, cy - h + i * cs]], col, 1.2); }
    for (const [c, r] of [[0, 0], [4, 4], [2, 1], [2, 3], [0, 4], [4, 0]]) if (c < n && r < n) fillPts(rect(cx - h + c * cs + 1, cy - h + r * cs + 1, cx - h + (c + 1) * cs - 1, cy - h + (r + 1) * cs - 1), col, 0, 0);
  }
  function pageGrille(x0, x1, seed) {
    pc(rect(Math.min(x0, x1), -48, Math.max(x0, x1), 48), '#f2ecdc', () => hatch(null, 0.7, 5, 0.05), seed, { drop: false });
    const cx = (x0 + x1) / 2, w = Math.abs(x1 - x0);
    if (w > 30) {
      const cs = Math.min(10, w / 7), h = cs * 2.5;
      fillPts(rect(cx - h, -36, cx + h, -36 + 5 * cs), '#fbf8ef', 0, 0);
      for (const [c, r] of [[1, 1], [3, 3], [0, 4], [4, 0], [2, 2]]) fillPts(rect(cx - h + c * cs, -36 + r * cs, cx - h + (c + 1) * cs, -36 + (r + 1) * cs), C.encre, 0, 0);
      for (let i = 0; i <= 5; i++) { strokePts([[cx - h + i * cs, -36], [cx - h + i * cs, -36 + 5 * cs]], C.encre, 0.9); strokePts([[cx - h, -36 + i * cs], [cx + h, -36 + i * cs]], C.encre, 0.9); }
      for (let i = 0; i < 3; i++) strokePts([[cx - h, 22 + i * 7], [cx + h - (i * 9) % 14, 22 + i * 7]], 'rgba(110,104,96,0.6)', 1.4);
    }
  }
  function couverture(x0, x1) {
    const l = Math.min(x0, x1), r = Math.max(x0, x1), w = r - l;
    pc(rect(l, -50, r, 50), C.orange, () => {
      hatch(null, 0.8, 4, 0.18); shade(r, 0, l, 0, 0.25, [l - 2, -52, r + 2, 52]);
      if (w > 20) { strokePts([[l + 5, -45], [r - 5, -45], [r - 5, 45], [l + 5, 45]], C.or, 1.2, true); grilleDoree((l + r) / 2 + (x0 < x1 ? 3 : -3) * (w / RC.w), -6, 8 * w / RC.w, C.orL, 5); }
    }, 7601);
  }
  function crayonPendu(ax, ay, g, seed, s) {
    const th = 0.24 * Math.sin(g * 2.3 + seed) + 0.06 * Math.sin(g * 5.1 + seed * 2), L = 44;
    const ex = ax - Math.sin(th) * L, ey = ay + Math.cos(th) * L, c = cx_();
    strokePts(qbez([ax, ay], [(ax + ex) / 2 + 3, (ay + ey) / 2], [ex, ey], 8), C.cordon, 1.8);
    c.save(); c.translate(ex, ey); c.rotate(-th); c.translate(0, 45); drawCrayon(); c.restore();
  }
  function drawRecueil(o) {
    const k = clamp(o.ouvert || 0), sx = -37 + 37 * ease(k), cw = 74 * Math.cos(PI * ease(k)), g = M.tg(o.t || 0);
    if (k > 0.001) pc(rect(sx, -49, sx + 74, 49), '#e6dcc4', () => { for (let y = -46; y < 48; y += 3) strokePts([[sx + 70, y], [sx + 74, y]], 'rgba(120,100,70,0.35)', 0.8); }, 7602, { drop: false });
    if (k > 0.001) pageGrille(sx + 2, sx + 72, 7603);
    if (cw >= 0) couverture(sx, sx + cw);
    else { couverture(sx, sx + cw); pageGrille(sx - 2, sx + cw + 4, 7604); }
    pc(rect(sx - 4, -51, sx + 4, 51), C.orangeD, () => { for (const y of [-38, 38]) strokePts([[sx - 4, y], [sx + 4, y]], C.or, 1.2); }, 7605, { drop: false });
    if (o.crayon !== false) crayonPendu(sx, 50, g, (o.seed || 0) * 1.7, 1);
    else strokePts([[sx, 50], [sx + 2, 54]], C.cordon, 1.8);
  }
  const recGrip = (o) => { const k = clamp(o.ouvert || 0); if (k < 0.5) return [-33, 6]; return o.prise === 'gauche' ? [-66, -10] : [66, -10]; };

  // ---- pincettes de cheminée (fer noir, anneau) ; serre 0..1 ; tient : 'journalGrille' | 'grilleCarree' | 'note' | null ; tientO
  function drawPincettes(o) {
    const s = clamp(o.serre == null ? 1 : o.serre), e = lerp(8, 1.5, s);
    if (o.tient) { const ob = OBJ[o.tient]; if (ob && ob.haut) { const hh = ob.haut, so = Object.assign({ t: o.t }, o.tientO || {}); drawPlatAt(ob, so, -hh[0], 100 - hh[1] - 6); } }
    pc(bar([-2, -70], [-e - 2, 100], 6), C.fer, () => strokePts([[-1, -70], [-e - 1, 100]], 'rgba(200,200,210,0.35)', 1), 7701);
    pc(bar([2, -70], [e + 2, 100], 6), C.ferL, null, 7702);
    pc([[-e - 7, 92, 1], [-e + 1, 92, 1], [-e + 1, 108, 1], [-e - 7, 106, 1]], C.fer, null, 7703, { drop: false });
    pc([[e - 1, 92, 1], [e + 7, 92, 1], [e + 7, 106, 1], [e - 1, 108, 1]], C.fer, null, 7704, { drop: false });
    strokePts(ep(0, -84, 11, 11, 20, 0, TAU), C.fer, 5.5); strokePts(ep(0, -84, 11, 11, 20, PI * 1.1, PI * 1.6), '#9a9aa0', 1.4);
    pc(rect(-6, -74, 6, -64), C.ferL, () => dot(0, -69, 2.4, '#9a9aa0'), 7706, { drop: false });
  }

  // ---- note interne : feuille ivoire à lignes grises, tampon rond rouge sans signe ; (0,0) = centre
  function drawNote() {
    pc([[-55, -70, 1], [54, -71, 1], [55, 66, 1], [48, 71, 1], [-55, 70, 1]], '#efe7d2', () => {
      hatch(null, 0.7, 6, 0.06); for (let i = 0; i < 8; i++) strokePts([[-42, -50 + i * 12], [42 - (i * 13) % 30, -50 + i * 12]], 'rgba(110,104,96,0.6)', 1.6);
      fillPts([[48, 71], [55, 66], [47, 64]], '#d9cfb6');
    }, 7801);
    strokePts(ep(28, 44, 16, 16, 20, 0, TAU), 'rgba(168,38,42,0.85)', 2.4); strokePts(ep(28, 44, 11, 11, 16, 0, TAU), 'rgba(168,38,42,0.7)', 1.3);
    dot(28, 44, 3.5, 'rgba(168,38,42,0.7)');
  }
  // ---- mouchoir blanc (geste essuie) ; (0,0) = prise
  function drawMouchoir(o) {
    const w = Math.sin((o.t || 0) * 9) * 3;
    pc([[-10, -8], [14, -12], [22, 6 + w], [26, 30], [8, 34 + w], [-6, 30], [-16, 14]], '#f3efe4', () => { strokePts([[0, -6], [6, 28]], 'rgba(150,140,120,0.5)', 1); strokePts([[12, -6], [18, 26]], 'rgba(150,140,120,0.4)', 1); strokePts([[-12, 12], [24, 8]], 'rgba(170,60,60,0.35)', 1.2); }, 7901);
  }

  // dessin d'un objet plat à un point (pour pincettes, genoux) : jamais en miroir
  function drawOb(ob, oo) {
    const c = cx_();
    if (ob.plat && flipped()) { const Cc = ob.centre || [0, 0]; c.save(); c.translate(Cc[0], Cc[1]); c.scale(-1, 1); c.translate(-Cc[0], -Cc[1]); ob.draw(oo); c.restore(); }
    else ob.draw(oo);
  }
  function drawPlatAt(ob, oo, x, y) { const c = cx_(); c.save(); c.translate(x, y); drawOb(ob, oo); c.restore(); }

  const OBJ = {
    grilleLosange: { plat: true, devant: true, draw: drawGrilleLosange, grip: [96, -150], p2: () => [-96, -150], haut: [0, -150], pts: { centre: [0, GL.cy], haut: [0, -150], bas: [0, 150] }, base: [0, 150] },
    grilleCarree: { plat: true, devant: true, draw: drawGrilleCarree, grip: [64, -84], p2: () => [-64, -84], haut: [0, -84], pts: { centre: [0, 0], haut: [0, -84] }, base: [0, 84] },
    journalGrille: { plat: true, devant: true, draw: drawJournalGrille, grip: (o) => (o.prise === 'haut' ? [0, -125] : [82, -125]), p2: () => [-82, -125], haut: [0, -125], pts: { centre: [0, 0], grille: [0, -40], haut: [0, -125] }, base: (o) => [0, o.court ? 51 : 125] },
    journalTimes: { plat: true, devant: true, draw: drawJournalTimes, grip: [95, -110], p2: () => [-95, -110], haut: [0, -110], pts: { centre: [0, 0], grille: [75, 33], frise: [0, -88], haut: [0, -110] }, base: [0, 110] },
    recueil: { plat: true, devant: true, draw: drawRecueil, grip: recGrip, p2: () => [-66, -10], pts: { centre: [0, 0], attache: (o) => [-37 + 37 * ease(clamp(o.ouvert || 0)), 50], page: [37, -10] }, base: [0, 50] },
    crayon: { draw: drawCrayon, grip: [0, 14], pts: { mine: [0, 45], gomme: [0, -45], milieu: [0, 0] }, base: [0, 0] },
    pincettes: { draw: drawPincettes, grip: [0, -52], pts: { mors: [0, 100], anneau: [0, -84], feuille: [0, 219] }, base: [0, 100] },
    note: { plat: true, devant: true, draw: drawNote, grip: [42, -70], p2: () => [-42, -70], haut: [0, -70], pts: { centre: [0, 0], tampon: [28, 44] }, base: [0, 70] },
    mouchoir: { devant: true, draw: drawMouchoir, grip: [0, -4], pts: {}, base: [0, 30], held: { echelle: 1.5 } },
  };
  MC.OBJ = OBJ;
  const gripOf = (ob, o) => (typeof ob.grip === 'function' ? ob.grip(o) : ob.grip);
  const ptOf = (v, o) => (typeof v === 'function' ? v(o) : v);

  // =====================================================================
  // 3) OBJETS TENUS, IK, ENVELOPPES (principe heldParts de perenoel.js / ronald.js)
  // =====================================================================
  const G_ADULTE = { LA: 96, PG: [4, 96], SHF: [-2, -146], SHB: [-10, -146], HEAD: [6, -170], k: 1 };
  function heldOpts(name, o, p) { const ob = OBJ[name]; return Object.assign({ t: p.t || 0 }, ob.held || {}, o || {}); }
  function heldDraw(name, o, p) {
    const ob = OBJ[name]; if (!ob) return;
    const oo = heldOpts(name, o, p), g = gripOf(ob, oo), c = cx_(), e = oo.echelle || 1;
    c.save(); c.scale(e, e); c.translate(-g[0], -g[1]); drawOb(ob, oo); c.restore();
  }
  const DOIGTS = [[-13, -9], [9, -11], [12, -4], [12, 6], [6, 11], [-6, 11], [-13, 4]];
  const doigtsPaint = () => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(70,40,30,0.5)', 1); hatch(null, 0.9, 3.4, 0.15); };
  const has = (v) => v && v !== 'rien';
  const fingers = (name, k) => { const ob = OBJ[name]; return !ob || ob.doigts === 'aucun' ? OFFP : scl(DOIGTS, k || 1); };
  function heldParts(G, skin, skinB, seed) {
    const P = [G.PG[0], G.PG[1]];
    const sk = (s) => (typeof s === 'function' ? s : () => s);
    return {
      objet: { parent: 'armF_lo', at: P, noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (has(p.tenu) && !(OBJ[p.tenu] && OBJ[p.tenu].devant)) heldDraw(p.tenu, p.tenuO, p); } },
      objetDevant: { parent: 'armF_lo', at: P, noRivet: true, base: '#000', seed: seed + 6, pts: OFFP, extra: (p) => { if (has(p.tenu) && OBJ[p.tenu] && OBJ[p.tenu].devant) heldDraw(p.tenu, p.tenuO, p); } },
      doigts: { parent: 'armF_lo', at: P, noRivet: true, base: '#000', seed: seed + 2, pts: (p) => (has(p.tenu) ? fingers(p.tenu, G.k) : OFFP), paint: (p) => { fillPts(big, sk(skin)(p)); doigtsPaint(); } },
      objetB: { parent: 'armB_lo', at: P, noRivet: true, base: '#000', seed: seed + 3, pts: OFFP, extra: (p) => { if (has(p.tenuB)) heldDraw(p.tenuB, p.tenuBO, p); } },
      doigtsB: { parent: 'armB_lo', at: P, noRivet: true, base: '#000', seed: seed + 4, pts: (p) => (has(p.tenuB) ? fingers(p.tenuB, G.k) : OFFP), paint: (p) => { fillPts(big, sk(skinB)(p)); doigtsPaint(); } },
      doigtsB2: { parent: 'armB_lo', at: P, noRivet: true, base: '#000', seed: seed + 5, pts: (p) => (p._deux ? scl(DOIGTS, G.k) : OFFP), paint: (p) => { fillPts(big, sk(skinB)(p)); doigtsPaint(); } },
    };
  }
  // point écran d'un point nommé de l'objet tenu : MC.pt(r, 'mine') ; main arrière : MC.pt(r, 'attache', true) ; 'prise' = point tenu
  MC.pt = function (r, nom, arriere) {
    const name = arriere ? r.tenuB : r.tenu, ob = OBJ[name]; if (!ob) return null;
    const oo = arriere ? r.tenuBO : r.tenuO, g = gripOf(ob, oo), e = oo.echelle || 1;
    const q = nom === 'prise' ? g : ob.pts[nom] ? ptOf(ob.pts[nom], oo) : null; if (!q) return null;
    return r.w(arriere ? 'objetB' : 'objet', (q[0] - g[0]) * e, (q[1] - g[1]) * e);
  };
  function ikT(G, S, T, bend) {
    const L1 = G.LA, L2 = Math.hypot(G.PG[0], G.PG[1]), phi = Math.atan2(-G.PG[0], G.PG[1]);
    const vx = T[0] - S[0], vy = T[1] - S[1];
    const d = clamp(Math.hypot(vx, vy), Math.abs(L1 - L2) + 1, L1 + L2 - 0.5), base = Math.atan2(-vx, vy);
    const a1 = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1)), a2 = Math.acos(clamp((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1));
    return { a: normA(base + bend * a1), b: normA(-bend * (PI - a2) - phi) };
  }
  function armTo(q, arm, T, k, bend) {
    if (!(k > 0)) return;
    const G = q._G, sol = ikT(G, arm === 'armF' ? G.SHF : G.SHB, T, bend == null ? 1 : bend), A = q.ang;
    const a0 = A[arm + '_up'] || 0, b0 = A[arm + '_lo'] || 0;
    A[arm + '_up'] = a0 + normA(sol.a - a0) * k; A[arm + '_lo'] = b0 + normA(sol.b - b0) * k;
  }
  function headPt(q, hx_, hy) { const H = q._G.HEAD; return mp(new DOMMatrix().translate(H[0], H[1]).rotate((q.ang.head || 0) * D), [hx_, hy]); }
  const rot = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
  function tipVec(name, o, nom, a) { const ob = OBJ[name]; if (!ob) return [0, 0]; const oo = o || {}, g = gripOf(ob, oo), q = ptOf(ob.pts[nom], oo), e = oo.echelle || 1; return rot([(q[0] - g[0]) * e, (q[1] - g[1]) * e], a); }
  function marche(q, k) {
    if (!(k > 0)) return;
    const t = q.t || 0, w = Math.sin(t * TAU * (q.cadence || 1.1)), A = q.ang;
    if (q._robe) { q.dy = (q.dy || 0) - Math.abs(Math.cos(t * TAU * (q.cadence || 1.1))) * 3 * k; return; }
    A.legF = (A.legF || 0) - 0.34 * w * k; A.legB = (A.legB || 0) + 0.34 * w * k;
    if (!has(q.tenu) && !q._bras) A.armF_up = (A.armF_up || 0) + 0.12 * w * k;
    if (!has(q.tenuB) && !q._bras) A.armB_up = (A.armB_up || 0) - 0.1 * w * k;
    q.dy = (q.dy || 0) - Math.abs(Math.cos(t * TAU * (q.cadence || 1.1))) * 5 * k;
  }
  function prep(p) { p = p || {}; return Object.assign({}, p, { ang: Object.assign({}, p.ang), hide: Object.assign({}, p.hide), face: Object.assign({}, p.face), tenuO: Object.assign({}, p.tenuO), tenuBO: Object.assign({}, p.tenuBO) }); }
  function finish(q) {
    const A = q.ang, tl = q.tilt || 0, G = q._G;
    if (has(q.tenu) && !(q.handF && q.handF !== 'fist')) q.handF = 'fist';
    if (has(q.tenuB) && !(q.handB && q.handB !== 'fist')) q.handB = 'fist';
    if (q.droit == null && has(q.tenu)) q.droit = true;
    if (q.droitB == null && has(q.tenuB)) q.droitB = true;
    if (q.droit) A.objet = (A.objet || 0) - ((A.armF_up || 0) + (A.armF_lo || 0) + tl);
    A.objetDevant = A.objet || 0;
    if (q.droitB) A.objetB = (A.objetB || 0) - ((A.armB_up || 0) + (A.armB_lo || 0) + tl);
    q._deux = false;
    if (q.deuxMains && has(q.tenu) && OBJ[q.tenu] && OBJ[q.tenu].p2) {
      const ob = OBJ[q.tenu], oo = heldOpts(q.tenu, q.tenuO, q), g = gripOf(ob, oo), e = oo.echelle || 1;
      const Hf = new DOMMatrix().translate(G.SHF[0], G.SHF[1]).rotate((A.armF_up || 0) * D).translate(0, G.LA).rotate((A.armF_lo || 0) * D).translate(G.PG[0], G.PG[1]).rotate((A.objet || 0) * D).scale(e, e).translate(-g[0], -g[1]);
      const T = mp(Hf, ob.p2(oo)), sol = ikT(G, G.SHB, T, 1);
      A.armB_up = sol.a; A.armB_lo = sol.b; q.handB = q.handBDeux || 'fist'; q._deux = true;
    }
    return q;
  }
  function cordon(A, B, sag) {    // cordon rouge entre deux points écran (crayon tenu ↔ recueil)
    if (!A || !B || SIL()) return; const c = cx_();
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    c.beginPath(); c.moveTo(A[0], A[1]); c.quadraticCurveTo((A[0] + B[0]) / 2, Math.max(A[1], B[1]) + (sag || 40), B[0], B[1]);
    c.strokeStyle = C.cordon; c.lineWidth = 1.8; c.stroke(); c.restore();
  }
  function run(def, q, x, y, s, o) {
    const r = M.puppet(def, q, x, y, s, o);
    r.tenu = q.tenu; r.tenuB = q.tenuB; r.q = q;
    if (q.tenu && OBJ[q.tenu]) r.tenuO = heldOpts(q.tenu, q.tenuO, q);
    if (q.tenuB && OBJ[q.tenuB]) r.tenuBO = heldOpts(q.tenuB, q.tenuBO, q);
    if (q._post) q._post(r, x, y, s, o);
    return r;
  }
  // enveloppe : pose → défauts → gestes (poseFn) → marche → finish → M.puppet. fn.pose(p, x, y, s, dir) = pose finale sans dessiner
  function wrap(key, poseFn, sDef) {
    const build = (pose, x, y, s, dir) => {
      const q = prep(pose), def = CH[key]; q._G = def.G; q._hip = def.hipY; q.t = q.t || 0;
      const loc = (Pt) => { const { mats } = M.partMatrices(def, q, x, y, s, dir); const p = new DOMPoint(Pt[0], Pt[1]).matrixTransform(mats.torso.inverse()); return [p.x, p.y]; };
      poseFn(q, loc, { x, y, s, dir }); marche(q, q.marche === true ? 1 : q.marche); return finish(q);
    };
    const fn = (pose, x, y, s, o) => {
      s = s != null ? s : sDef; o = Object.assign({ slot: M.ST.slotF, nom: CH[key].nom }, o || {});
      const dir = o.dir || 1, q = build(pose, x, y, s, dir);
      return run(CH[key], q, x, y, s, o);
    };
    fn.pose = (pose, x, y, s, dir) => build(pose, x || 0, y || 0, s != null ? s : sDef, dir || 1);
    fn.def = () => CH[key];
    return fn;
  }

  // =====================================================================
  // 4) CORPS COMMUNS : bras à articulations rondes, jambes (debout / assis à hauteur de siège réglable)
  // =====================================================================
  const R_COUDE = 11.5;
  function armR(len, wt, rc) { wt = wt || 15; rc = rc || R_COUDE; return ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1, len * 0.42], [rc + 0.5, len - 6]], ep(0, len, rc, rc, 10, 0, PI), [[-rc - 0.5, len - 6], [-wt + 1, len * 0.42]]); }
  function foreR(kind) { const f = X.forePts(kind); return ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU).concat(f.slice(2)); }
  const val = (v, p) => (typeof v === 'function' ? v(p) : v);
  const upDef = (at, seed, back, o) => ({ parent: 'torso', at, pts: armR(o.len || 96, o.wt || 16), base: '#000', seed, paint: (p) => {
    fillPts(big, val(o.manche, p)); if (o.deco) o.deco(p, back);
    hatch([[-18, -20], [-3, -20], [-3, 110], [-18, 110]], 0.9, 3.8, back ? 0.32 : 0.24);
    if (back) fillPts(big, 'rgba(20,14,10,0.13)');
  } });
  function foreDef(parent, back, seed, o, len) {
    const hk = (p) => (back ? p.handB : p.handF) || 'fist';
    return { parent, at: [0, len || 96], pts: (p) => foreR(hk(p)), base: '#000', seed, paint: (p) => {
      fillPts(big, val(o.manche, p)); if (o.deco) o.deco(p, back);
      fillPts([[-20, 76, 1], [20, 76, 1], [24, 130, 1], [-20, 130, 1]], val(o.peau, p)); X.handPaint(null, hk(p));
      if (o.cuff) o.cuff(p, back);
      hatch([[-14, -10], [-3, -10], [-3, 58], [-14, 58]], 0.9, 3.8, back ? 0.3 : 0.2);
      if (back) fillPts(big, 'rgba(20,14,10,0.13)');
    } };
  }
  // jambe assise : cuisse horizontale vers l'avant, tibia vertical jusqu'au sol ; hh = hauteur du rivet de hanche au-dessus du sol
  function seatLeg(hh) { return [[-18, -14], [96, -17], [110, -12], [120, 0], [121, 40], [119, hh - 27], [121, hh - 19], [146, hh - 13], [152, hh - 3, 1], [150, hh, 1], [96, hh, 1], [96, hh - 17], [98, 60], [97, 22], [86, 15], [-20, 14]]; }
  function legDef(at, seed, back, o) {
    const sy = o.sy || 1, std = scl(X.legPts(o.th || 0.95), 1, sy);
    return { parent: 'torso', at, pts: (p) => (p.assis ? seatLeg(p._hh || 130) : std), base: '#000', seed, noRivet: !!back, paint: (p) => {
      fillPts(big, val(o.pant, p));
      if (p.assis) {
        const hh = p._hh || 130;
        if (o.deco) o.deco(p, back, null);
        if (o.bas) fillPts([[90, 40, 1], [160, 40, 1], [160, hh + 10, 1], [90, hh + 10, 1]], val(o.bas, p));
        fillPts([[90, hh - 19, 1], [160, hh - 19, 1], [160, hh + 8, 1], [90, hh + 8, 1]], val(o.shoe, p)); fillPts(rect(90, hh - 4, 160, hh + 8), 'rgba(10,6,4,0.4)');
        hatch([[-20, -20], [100, -20], [100, -4], [-20, -4]], 0.2, 4, 0.22);
      } else {
        const by = (val(o.by, p) || 214) * sy;
        if (o.bas) fillPts([[-40, (o.basY || 120) * sy, 1], [60, (o.basY || 120) * sy, 1], [60, 300, 1], [-40, 300, 1]], val(o.bas, p));
        if (o.deco) o.deco(p, back, by);
        fillPts([[-40, by, 1], [60, by, 1], [60, 300, 1], [-40, 300, 1]], val(o.shoe, p));
        fillPts(rect(-40, 231 * sy, 60, 300), 'rgba(10,6,4,0.35)');
        if (!back) { strokePts([[18, by + 10], [42, 228 * sy]], 'rgba(255,255,255,0.22)', 1.3); hatch([[-26, -20], [-6, -20], [-6, by], [-26, by]], 0.8, 4, 0.22); }
      }
      if (back) { hatch(null, 0.8, 3.6, 0.28, 1, M.P.encre, [-50, -30, 170, 300]); fillPts(big, 'rgba(20,14,10,0.14)'); }
    } };
  }
  const EXPR = {
    neutre: {}, ravi: { mouth: 'smile', eyes: 'half' }, surpris: { brow: 'up', eyes: 'wide', mouth: 'o' }, triste: { brow: 'worry', mouth: 'tight', eyes: 'half' },
    fache: { brow: 'frown', mouth: 'tight' }, fier: { brow: 'up', mouth: 'smile' }, degout: { brow: 'frown', eyes: 'half', mouth: 'tight' }, juge: { brow: 'frown', eyes: 'half', mouth: 'n' },
  };
  function expr(q, nom) { const e = EXPR[nom]; if (!e) return; for (const k in e) if (q.face[k] == null) q.face[k] = e[k]; }
  const setF = (f, o) => { for (const k in o) if (f[k] == null) f[k] = o[k]; };
  function defOf(nom, parts, G, skin, skinB, seed, order, hipY, extra) {
    Object.assign(parts, heldParts(G, skin, skinB, seed));
    return Object.assign({ nom, G, hipY: hipY || -238, parts, handLen: Math.round(Math.hypot(G.PG[0], G.PG[1])), rod: { part: 'torso', at: [-26, 18] }, order }, extra || {});
  }
  const TAIL = ['objetB', 'doigtsB', 'objet', 'armF_up', 'armF_lo', 'objetDevant', 'doigts', 'doigtsB2'];
  const kk = (q, n) => ease(clamp(q[n] === true ? 1 : q[n] || 0));
  function plier(q, th) {
    if (!th) return;
    q.tilt = (q.tilt || 0) + th; q.dx = (q.dx || 0) - 238 * Math.sin(th); q.dy = (q.dy || 0) + 238 * (1 - Math.cos(th));
    q.ang.legF = (q.ang.legF || 0) - th; q.ang.legB = (q.ang.legB || 0) - th;
  }
  // assis : siege = hauteur LOCALE du siège au-dessus des pieds (défaut 118 ; écran = siege × s) ; mains sur les genoux si rien d'autre
  function asseoir(q, mains) {
    if (!q.assis) return false;
    q.assis = 1; const S = q.siege == null ? 118 : q.siege;
    q._hh = S + 14; q.dy = (q.dy || 0) + (-q._hip + 2 - q._hh);
    if (mains) { armTo(q, 'armF', [92, -10], 1); armTo(q, 'armB', [72, -10], 1); if (!has(q.tenu)) q.handF = 'open'; if (!has(q.tenuB)) q.handB = 'open'; }
    return true;
  }
  // pièce « pan » : bas de veste / robe posé sur la cuisse quand le personnage est assis
  const panDef = (seed, col, len, paint) => ({ parent: 'torso', at: [0, 0], noRivet: true, base: '#000', seed, pts: (p) => (p.assis ? [[-34, -6], [30, -8], [len, -4, 1], [len - 4, 18, 1], [-36, 22, 1]] : OFFP), paint: (p) => { fillPts(big, val(col, p)); if (paint) paint(p); hatch(null, 0.3, 4.4, 0.2, 1, M.P.encre, [-40, -20, len + 10, 30]); } });
  const respire = (q, a, ph) => { if (q.respire !== false) q.dy = (q.dy || 0) + a * Math.sin(M.tg(q.t || 0) * 1.6 + ph); };

  // têtes de profil (cou en y 16, nez vers +x)
  const H_HOMME = [[-14, 16], [10, 16], [11, 2], [16, -6], [23, -10], [27, -16], [27, -22], [29, -26], [28, -30], [31, -35], [36, -41, 1], [32, -47], [29, -56], [29, -64], [26, -78], [14, -92], [-6, -97], [-24, -88], [-33, -68], [-32, -46], [-24, -28], [-17, -8]];
  const H_LONG = [[-14, 16], [9, 16], [11, 0], [17, -8], [25, -12], [28, -18], [27, -24], [29, -28], [28, -33], [31, -38], [37, -45, 1], [32, -51], [29, -60], [29, -68], [26, -83], [14, -97], [-6, -102], [-24, -93], [-33, -72], [-32, -48], [-24, -28], [-17, -8]];
  const H_FEMME = [[-12, 16], [9, 16], [10, 2], [15, -6], [21, -9], [25, -15], [25, -21], [27, -25], [26, -29], [29, -34], [32, -40, 1], [29, -45], [27, -54], [27, -63], [24, -77], [13, -90], [-6, -95], [-23, -86], [-31, -67], [-30, -46], [-22, -28], [-15, -8]];
  const H_ROND = [[-15, 16], [11, 16], [13, 2], [19, -6], [26, -10], [29, -16], [29, -22], [31, -26], [30, -30], [33, -35], [37, -41, 1], [33, -47], [30, -56], [30, -64], [27, -79], [14, -94], [-6, -99], [-25, -90], [-35, -69], [-34, -46], [-26, -28], [-18, -8]];
  const T_HOMME = [[-15, -178], [8, -182], [18, -170], [27, -150], [32, -116], [33, -70], [32, -30], [32, 0], [32, 22, 1], [-35, 24, 1], [-36, 0], [-38, -60], [-38, -112], [-34, -150], [-26, -168]];
  const torseHanche = (pts, yb) => pts.map((p) => (p[2] && p[1] > 0 ? [p[0], yb, 1] : p));

  // =====================================================================
  // 5) ARTHUR WYNNE (1913) — cheveux châtain roux à raie au milieu, moustache en guidon rousse, VISIÈRE VERTE de typographe,
  //    chemise blanche à fixe-manches noirs, gilet bordeaux, pantalon anthracite, bretelles, cravate noire étroite.
  // =====================================================================
  const WY_HAIR = [[27, -76], [31, -88], [22, -100], [3, -106], [-17, -103], [-33, -90], [-37, -68], [-35, -46], [-29, -42], [-25, -56], [-15, -63], [-11, -46], [-4, -42], [-3, -62], [8, -74], [18, -73]];
  const WY_MOUST = [[24, -33], [34, -34], [42, -31], [48, -33], [52, -40], [55, -36], [54, -29], [47, -24], [38, -24], [29, -25], [20, -24], [13, -26], [8, -32], [10, -36], [15, -30], [21, -30]];
  const WY_VIS = [[-35, -84], [-20, -92], [4, -96], [22, -90], [30, -86], [52, -80], [66, -73], [64, -68], [40, -70], [26, -72], [8, -76], [-14, -76], [-34, -72]];
  function mkWynne() {
    const legO = { th: 0.95, assis: true, pant: () => C.anthra, shoe: () => '#221c1a', by: () => 216,
      deco: () => { for (let x = -40; x < 160; x += 9) strokePts([[x, -20], [x + 3, 230]], 'rgba(120,118,124,0.18)', 0.9); } };
    const fixe = () => { fillPts(rect(-22, 38, 22, 50), '#1a1718'); strokePts([[-18, 41], [18, 41]], 'rgba(200,200,210,0.45)', 1); strokePts([[-18, 47], [18, 47]], 'rgba(200,200,210,0.3)', 1); };
    const manchette = (p, back) => { fillPts(rect(-20, 60, 20, 78), back ? C.chemiseD : '#f4efe4'); strokePts([[-20, 62], [20, 62]], 'rgba(120,110,96,0.5)', 1); dot(10, 70, 1.8, '#9a9890'); };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: T_HOMME, base: C.chemise, seed: 9101, paint: () => {
        fillPts(rect(-60, 4, 60, 40), C.anthra);
        fillPts([[-42, -160], [-10, -172], [12, -160], [22, -126], [28, -100], [34, -60], [34, 8], [-42, 8]], C.bordeaux, 0, 0.3);
        hatch([[-42, -160], [34, -160], [34, 8], [-42, 8]], 0.7, 4.6, 0.16);
        strokePts([[12, -160], [22, -126], [28, -100], [34, -60]], 'rgba(255,220,200,0.28)', 1.2);
        for (const y of [-92, -70, -48, -26, -6]) { dot(28, y, 2.3, '#2a1a14'); dot(27.4, y - 0.7, 0.9, 'rgba(255,230,190,0.55)'); }
        fillPts([[-6, 8], [34, 8], [34, 2], [-6, 2]], '#2a2224');                          // ceinture du pantalon
        fillPts([[-17, -177], [-9, -179], [-14, -158], [-23, -158]], '#4a3a30');          // bretelle sur l'épaule
        fillPts([[13, -172], [21, -170], [25, -134], [19, -126], [15, -134]], '#141214'); // cravate étroite noire
        fillPts([[3, -183], [17, -177], [16, -168], [5, -172]], '#f8f4ea');                // col
        hatch([[-42, -166], [-14, -166], [-14, 24], [-42, 24]], 0.75, 4.2, 0.28); shade(33, -60, -38, -40, 0.25, [-42, -190, 40, 26]);
      } },
      legB: legDef([-6, -2], 9102, true, legO), legF: legDef([6, -2], 9103, false, legO),
      armB_up: upDef([-10, -146], 9104, true, { manche: C.chemiseD, deco: fixe }),
      armB_lo: foreDef('armB_up', true, 9105, { manche: C.chemiseD, peau: C.peauWD, cuff: manchette }),
      armF_up: upDef([-2, -146], 9106, false, { manche: C.chemise, deco: fixe }),
      armF_lo: foreDef('armF_up', false, 9107, { manche: C.chemise, peau: C.peauW, cuff: manchette }),
      head: { parent: 'torso', at: [6, -170], pts: H_HOMME, base: C.peauW, seed: 9108, noRivet: true, paint: (p) => {
        const f = p.face || {};
        X.earPaint(-8, -44); hatch([[-30, -40], [-2, -28], [8, -6], [-10, 16], [-34, 4]], 0.6, 3.6, 0.28);
        dot(20, -38, 7, 'rgba(210,120,100,0.2)');
        X.eye(f, 17, -53); X.brow(f, 17, -61, 'rgba(120,60,30,0.95)', 2.8); X.mouth(f, 26, -19);
      } },
      cheveux: { parent: 'head', at: [0, 0], noRivet: true, base: C.roux, seed: 9109, pts: WY_HAIR, paint: () => {
        strokePts(qbez([26, -95], [6, -104], [-20, -100], 8), 'rgba(240,215,190,0.85)', 1.6);            // raie au milieu (vue de côté : ligne claire au sommet)
        for (let i = 0; i < 5; i++) strokePts(qbez([22 - i * 9, -99 + i * 0.6], [16 - i * 10, -86], [10 - i * 10, -70 + i * 3]), 'rgba(70,30,14,0.45)', 1.1);
        strokePts(qbez([-24, -94], [-34, -74], [-30, -50]), 'rgba(190,120,80,0.5)', 1.4);
      } },
      moustache: { parent: 'head', at: [0, 0], noRivet: true, base: C.moust, seed: 9110, pts: WY_MOUST, paint: () => {
        for (const x of [16, 24, 32, 40]) strokePts([[x - 2, -32], [x + 2, -25]], 'rgba(120,50,20,0.5)', 1);
        strokePts(qbez([44, -27], [52, -30], [52, -38]), 'rgba(240,180,130,0.5)', 1.1);
      } },
      visiere: { parent: 'head', at: [0, 0], noRivet: true, base: C.visiere, seed: 9111, texA: 0.35, pts: WY_VIS, paint: () => {
        fillPts([[-36, -86], [-20, -94], [4, -98], [24, -92], [30, -88], [28, -82], [8, -80], [-14, -80], [-34, -76]], '#24452f');   // bandeau
        fillPts([[30, -84], [52, -78], [64, -72], [40, -72]], 'rgba(150,210,160,0.35)', 0, 0);
        strokePts([[30, -82], [64, -71]], 'rgba(220,255,225,0.6)', 1.3);
        strokePts([[-34, -73], [26, -73]], 'rgba(10,30,15,0.6)', 1.2);
      } },
    };
    return defOf('wynne', parts, G_ADULTE, C.peauW, C.peauWD, 9140, ['armB_up', 'armB_lo', 'legB', 'legF', 'head', 'cheveux', 'moustache', 'visiere', 'torso'].concat(TAIL), -238);
  }
  CH.mcWynne = mkWynne();
  // poche retournée + pièce : dessinées après la marionnette (pièce en coordonnées écran, chute jusqu'au sol)
  function postWynne(r, x, y, s, o) {
    const q = r.q, po = q._poche || 0; if (!(po > 0.5)) return;
    const c = cx_(), d = o.dir || 1, P0 = r.w('torso', 24, 10), u = clamp((po - 0.5) / 0.5);
    if (!SIL()) {
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.translate(P0[0], P0[1]); c.scale(1.5 * s * d, 1.5 * s);
      M.fillPts([[-10, -4], [12, -4], [18, 18 * u + 6], [6, 30 * u + 4], [-8, 24 * u + 4]], '#ebe4d2', 3, 0.5);
      M.strokePts([[-10, -4], [-8, 24 * u + 4], [6, 30 * u + 4], [18, 18 * u + 6], [12, -4]], 'rgba(90,80,60,0.6)', 1.2);
      c.restore();
      const v = clamp((po - 0.62) / 0.3);     // la pièce tombe, rebondit
      if (v > 0) {
        const y0 = P0[1] + 30 * s, yS = y - 6, fall = Math.min(1, v * 1.25), yy = lerp(y0, yS, fall * fall) - (v > 0.8 ? Math.abs(Math.sin((v - 0.8) * 30)) * 14 * (1 - v) * 5 : 0);
        const xx = P0[0] + d * (10 + 30 * v) * s;
        c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.translate(xx, yy); c.scale(Math.cos(v * 18) * 0.9 + 0.1, 1);
        c.beginPath(); c.arc(0, 0, 9 * s + 1.5, 0, TAU); c.fillStyle = C.laiton; c.fill(); c.lineWidth = 1.2; c.strokeStyle = C.laitonD; c.stroke();
        c.beginPath(); c.arc(-1.5, -1.5, 3, 0, TAU); c.fillStyle = 'rgba(255,240,190,0.6)'; c.fill(); c.restore();
      }
    }
  }
  MC.wynne = wrap('mcWynne', function (q, loc) {
    const A = q.ang, f = q.face, g = M.tg(q.t);
    const de = kk(q, 'dessine'), mo = kk(q, 'montre'), cr = kk(q, 'croise'), po = clamp(q.poche || 0), dc = kk(q, 'decu'), fi = kk(q, 'fier');
    const assis = asseoir(q, !(de > 0) && !(mo > 0) && !(cr > 0));
    if (de > 0) {
      if (q.tenu === undefined) q.tenu = 'crayon';
      const a = -0.5, T0 = q.cible ? loc(q.cible) : [128, -40], v = q.tenu === 'crayon' ? tipVec('crayon', q.tenuO, 'mine', a) : [0, 0];
      if (q.tenu === 'crayon') A.objet = (A.objet || 0) + a * de;
      armTo(q, 'armF', [T0[0] - v[0] + 5 * Math.sin(g * 7), T0[1] - v[1] + 3 * Math.sin(g * 11)], de);
      armTo(q, 'armB', [T0[0] - 52, T0[1] + 6], de); q.handB = 'open';
      A.head = (A.head || 0) + 0.3 * de; setF(f, { eyes: 'half', brow: 'frown' });
    }
    if (mo > 0) {
      if (q.tenu === undefined) q.tenu = 'grilleLosange';
      if (q.tenuO.echelle == null) q.tenuO.echelle = 0.8;
      if (q.deuxMains == null) q.deuxMains = true;
      armTo(q, 'armF', [182, -150], mo); A.head = (A.head || 0) - 0.06 * mo; setF(f, { mouth: 'smile', brow: 'up' });
    }
    if (cr > 0) {       // deux crayons croisés en X devant lui (gag « croisés »)
      if (q.tenu === undefined) q.tenu = 'crayon'; if (q.tenuB === undefined) q.tenuB = 'crayon';
      if (q.tenu === 'crayon' && q.tenuO.echelle == null) q.tenuO.echelle = 1.3; if (q.tenuB === 'crayon' && q.tenuBO.echelle == null) q.tenuBO.echelle = 1.3;
      A.objet = (A.objet || 0) - 0.6 * cr; A.objetB = (A.objetB || 0) + 0.6 * cr;      // sommets vers l'intérieur : les crayons se croisent en X
      armTo(q, 'armF', [136, -104], cr); armTo(q, 'armB', [86, -104], cr);
      A.head = (A.head || 0) + 0.06 * cr; setF(f, { mouth: 'smile', brow: 'up', eyes: 'open' });
    }
    if (po > 0) {       // 0 → 0,5 la main va à la poche ; 0,5 → 1 poche retournée, la pièce tombe (dessinée après)
      const u = ease(clamp(po / 0.5));
      armTo(q, 'armF', [30 + 10 * u, -8 - 6 * clamp((po - 0.5) * 3)], Math.min(1, po * 2)); q.handF = 'fist';
      if (po > 0.5) { A.head = (A.head || 0) + 0.25; setF(f, { brow: 'worry', mouth: 'tight', eyes: 'half' }); armTo(q, 'armB', [30, 0], 1); q.handB = 'open'; }
      q._poche = po; q._post = postWynne;
    }
    if (dc > 0) { A.head = (A.head || 0) + 0.32 * dc; if (!assis) q.tilt = (q.tilt || 0) + 0.03 * dc; q.dy = (q.dy || 0) + 3 * dc;
      if (!(po > 0) && !has(q.tenu)) { armTo(q, 'armF', [22, 4], dc); armTo(q, 'armB', [14, 2], dc); }
      setF(f, { brow: 'worry', mouth: 'tight', eyes: 'half' }); }
    if (fi > 0) { if (!assis) q.tilt = (q.tilt || 0) - 0.05 * fi; A.head = (A.head || 0) - 0.16 * fi;
      if (!(mo > 0) && !has(q.tenu)) { armTo(q, 'armF', [34, -128], fi); armTo(q, 'armB', [22, -128], fi); }   // pouces aux emmanchures du gilet
      setF(f, { mouth: 'smile', brow: 'up', eyes: 'half' }); }
    expr(q, q.expr); respire(q, 1.2, 0.4);
  }, 0.9);

  // =====================================================================
  // 6) LE RÉDACTEUR DU NEW YORK TIMES — grand, maigre, raide : cheveux gris argent coiffés en arrière, favoris gris, glabre,
  //    pince-nez à cordon noir, haut col cassé, lavallière gris perle, redingote noire, gilet gris, chaîne de montre en or, pantalon rayé.
  // =====================================================================
  const RE_SY = 1.08, RE_HIP = -Math.round(238 * RE_SY), RE_LA = 104;
  const RE_TORSO = [[-14, -180], [7, -186], [16, -174], [24, -152], [28, -118], [28, -74], [25, -36], [27, 0], [33, 60], [37, 124, 1], [-39, 126, 1], [-35, 60], [-32, 0], [-33, -60], [-34, -112], [-31, -150], [-24, -170]];
  const RE_TORSO_ASSIS = torseHanche(RE_TORSO.filter((p) => p[1] <= 0 || p[2]), 22);
  const RE_HAIR = [[24, -86], [31, -98], [27, -110], [12, -118], [-8, -119], [-28, -112], [-41, -96], [-45, -76], [-42, -56], [-35, -48], [-29, -60], [-20, -72], [-6, -80], [10, -86]];
  const RE_FAV = [[-2, -76, 1], [6, -76], [8, -54], [9, -34], [7, -24, 1], [2, -28], [-1, -48]];
  function mkRedac() {
    const legO = { th: 0.9, sy: RE_SY, assis: true, pant: () => '#8b8a88', shoe: () => '#151314', by: () => 216,
      deco: () => { for (let x = -40; x < 170; x += 7) strokePts([[x, -20], [x + 2, 260]], 'rgba(40,40,46,0.42)', 1.1); } };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: (p) => (p.assis ? RE_TORSO_ASSIS : RE_TORSO), base: C.redingote, seed: 9201, paint: (p) => {
        fillPts([[-2, -176], [16, -172], [22, -150], [24, -104], [12, -60], [2, -104], [-2, -150]], C.giletG, 0, 0.3);       // gilet gris dans l'échancrure
        for (const y of [-130, -112, -94, -76]) dot(18, y, 1.9, '#3a3a3c');
        strokePts(qbez([4, -92], [14, -74], [22, -86], 6), C.or, 1.4); dot(4, -92, 2.2, C.orD); dot(22, -86, 1.6, C.orL);   // chaîne de montre
        fillPts([[16, -172], [26, -154], [28, -112], [24, -70], [16, -60], [20, -110], [18, -150]], C.redingoteL);           // revers de soie
        strokePts([[16, -172], [24, -112], [14, -60]], 'rgba(220,220,230,0.25)', 1.2);
        fillPts([[2, -190], [16, -184], [24, -172], [18, -168], [12, -176], [4, -178]], '#fbf8ef');                            // haut col cassé (pointes)
        fillPts([[18, -172], [24, -168], [21, -164]], '#fbf8ef');
        fillPts(ell(19, -162, 8, 9, 12), C.perle, 0, 0); fillPts([[14, -158], [24, -156], [22, -138], [15, -140]], C.perle, 0, 0);   // lavallière bouffante
        strokePts([[17, -160], [19, -142]], 'rgba(120,118,110,0.6)', 1); dot(20, -163, 1.8, '#e8e8e8');
        if (!p.assis) { strokePts([[24, -36], [36, 124]], 'rgba(0,0,0,0.5)', 1.4); strokePts([[26, -36], [22, 0]], 'rgba(200,200,210,0.18)', 1); }
        for (const y of [-56, -40]) { dot(24, y, 2.2, '#0e0f12'); }
        hatch([[-40, -170], [-10, -170], [-10, 130], [-40, 130]], 0.75, 4, 0.34); shade(30, -60, -38, -40, 0.3, [-42, -195, 40, 130]);
      } },
      pan: panDef(9212, C.redingote, 104, () => strokePts([[-30, -4], [100, -6]], 'rgba(200,200,210,0.18)', 1)),
      legB: legDef([-6, -2], 9202, true, legO), legF: legDef([6, -2], 9203, false, legO),
      armB_up: upDef([-10, -146], 9204, true, { len: RE_LA, wt: 14, manche: C.redingote }),
      armB_lo: foreDef('armB_up', true, 9205, { manche: C.redingote, peau: C.peauRD, cuff: (p, b) => fillPts(rect(-18, 66, 18, 78), b ? '#cfcabe' : '#f6f2e6') }, RE_LA),
      armF_up: upDef([-2, -146], 9206, false, { len: RE_LA, wt: 14, manche: C.redingote, deco: () => strokePts([[10, -10], [8, 100]], 'rgba(200,200,210,0.16)', 1.2) }),
      armF_lo: foreDef('armF_up', false, 9207, { manche: C.redingote, peau: C.peauR, cuff: (p, b) => fillPts(rect(-18, 66, 18, 78), b ? '#cfcabe' : '#f6f2e6') }, RE_LA),
      head: { parent: 'torso', at: [6, -172], pts: H_LONG, base: C.peauR, seed: 9208, noRivet: true, paint: (p) => {
        const f = p.face || {}, sc = p.sourcil || 0;
        X.earPaint(-10, -46); hatch([[-30, -44], [-2, -30], [8, -6], [-10, 16], [-34, 4]], 0.6, 3.6, 0.28);
        strokePts([[22, -16], [27, -18]], 'rgba(140,100,80,0.5)', 1); strokePts(qbez([12, -64], [16, -70], [24, -66]), 'rgba(150,110,90,0.3)', 1);   // rides
        fillPts(RE_FAV, '#8a8c90', 3, 0.4); for (const x of [0, 3, 6]) strokePts([[x, -74], [x + 1, -30]], 'rgba(60,60,64,0.5)', 1);   // favoris gris
        X.eye(f, 18, -57); X.brow(f, 18, -66 - 5 * sc, 'rgba(150,150,150,0.98)', 3.4); X.mouth(f, 27, -21);
        if (p.nez) strokePts([[30, -42], [34, -46], [36, -42]], 'rgba(120,70,60,0.8)', 1.2);
      } },
      cheveux: { parent: 'head', at: [0, 0], noRivet: true, base: '#b9bbbe', seed: 9209, pts: RE_HAIR, paint: () => {
        for (let i = 0; i < 6; i++) strokePts(qbez([26 - i * 3, -98 + i * 3], [-6, -116 + i * 6], [-40 + i * 2, -86 + i * 5]), 'rgba(96,98,104,0.4)', 1);
        strokePts(qbez([28, -104], [6, -118], [-26, -110]), 'rgba(255,255,255,0.7)', 1.6); shade(0, -120, 0, -60, 0.25, [-50, -130, 40, -40]);
      } },
      pinceNez: { parent: 'head', at: [0, 0], noRivet: true, base: '#000', seed: 9211, pts: OFFP, extra: (p) => {
        const ring = ell(24, -55, 7, 6.5, 14);
        fillPts(ring, 'rgba(200,225,235,0.3)', 0, 0); strokePts(ring.concat([ring[0]]), '#1a1a1c', 1.5);
        strokePts([[31, -56], [34, -54]], '#1a1a1c', 1.5);
        strokePts(qbez([18, -50], [6, -10], [16, 34]), '#141416', 1.2);        // cordon noir qui descend sur le revers
      } },
    };
    return defOf('redacteur', parts, Object.assign({}, G_ADULTE, { LA: RE_LA, HEAD: [6, -172] }), C.peauR, C.peauRD, 9240,
      ['armB_up', 'armB_lo', 'legB', 'legF', 'head', 'cheveux', 'torso', 'pan', 'pinceNez', 'genoux'].concat(TAIL), RE_HIP,
      { _x: 0 });
  }
  CH.mcRedac = mkRedac();
  // journal plié sur les genoux (gourmand) : pièce enfant du torse, de face, au-dessus des cuisses
  CH.mcRedac.parts.genoux = { parent: 'torso', at: [0, 0], noRivet: true, base: '#000', seed: 9213, pts: OFFP, extra: (p) => {
    if (!p._genoux) return; const ob = OBJ.journalGrille, oo = Object.assign({ t: p.t }, { court: true, rempli: p.rempli || 0 }, p.genouxO || {});
    drawPlatAt(ob, oo, 92, -8 - 51);
  } };
  function postRedac(r) {
    if (r.q.jette > 0.8 && r.q.lache !== false) r.lache = true;
    if (r.q._lachePt) r.lachePt = r.w('armF_lo', 4, 110);
  }
  MC.redac = wrap('mcRedac', function (q, loc) {
    const A = q.ang, f = q.face, g = M.tg(q.t);
    const ou = kk(q, 'outre'), bo = kk(q, 'bout'), je = clamp(q.jette || 0), es = kk(q, 'essuie'), li = kk(q, 'lit'), so = kk(q, 'soupir');
    const pi = kk(q, 'pincettes'), epi = kk(q, 'epie'), go = kk(q, 'gourmand'), ca = kk(q, 'cache'), ec = kk(q, 'ecrit');
    if (go > 0 || ca > 0) q.assis = true;
    const assis = asseoir(q, !(go > 0) && !(ca > 0) && !(li > 0) && !(es > 0) && !(ou > 0) && !(so > 0));
    q.sourcil = q.sourcil || 0;
    if (ou > 0) { if (!assis) q.tilt = (q.tilt || 0) - 0.07 * ou; A.head = (A.head || 0) - 0.26 * ou; armTo(q, 'armF', [64, -128], ou); q.handF = q.handF || 'open';
      armTo(q, 'armB', [10, 0], ou); q.sourcil += 0.8 * ou; setF(f, { brow: 'up', mouth: 'tight', eyes: 'half' }); q.nez = true; }
    if (bo > 0 || je > 0) {          // journal du bout des doigts, bras tendu ; jette : 0 → 0,45 lève, → 0,8 en avant, ≥ 0,8 lâche
      if (q.tenu === undefined) q.tenu = 'journalGrille';
      if (q.tenu === 'journalGrille' && q.tenuO.prise == null) q.tenuO.prise = 'haut';
      const k = Math.max(bo, je > 0 ? 1 : 0), j1 = sm(0, 0.45, je), j2 = sm(0.45, 0.8, je);
      armTo(q, 'armF', [lerp(176, 150, j1) + 30 * j2, lerp(-150, -196, j1) + 70 * j2], k);
      A.head = (A.head || 0) - 0.22 * k; if (!assis) q.tilt = (q.tilt || 0) - 0.05 * k; armTo(q, 'armB', [16, 4], k);
      q.sourcil += 0.6 * k; setF(f, { brow: 'frown', mouth: 'tight', eyes: 'half' }); q.nez = true;
      if (je >= 0.8 && q.lache !== false) { q.tenu = 'rien'; q.handF = 'open'; }
      q._lachePt = true;
    }
    if (es > 0) {
      if (q.tenu === undefined) q.tenu = 'mouchoir';
      const w = Math.sin(g * 9);
      armTo(q, 'armB', [62, -84], es); q.handB = 'open';
      armTo(q, 'armF', [80 + 6 * w, -96 + 5 * Math.cos(g * 9)], es);
      A.head = (A.head || 0) + 0.16 * es; setF(f, { brow: 'frown', mouth: 'tight', eyes: 'half' });
    }
    if (li > 0 || ca > 0) {
      if (q.tenu === undefined) q.tenu = 'journalTimes';
      if (q.deuxMains == null) q.deuxMains = true;
      const Tl = [155, -150], Tc = [187, -204];
      if (ca > 0 && q.tenu === 'journalTimes' && q.tenuO.rabat == null) q.tenuO.rabat = sm(0.35, 1, q.cache === true ? 1 : q.cache);
      armTo(q, 'armF', ca > 0 ? Tc : Tl, ca > 0 ? sm(0, 0.4, q.cache === true ? 1 : q.cache) : li);
      A.head = (A.head || 0) + lerp(0.14 * li, -0.02, ca); setF(f, ca > 0.5 ? { brow: 'up', eyes: 'wide', mouth: 'n' } : { eyes: 'half' });
      if (ca > 0) q.sourcil += 0.5 * ca;
    }
    if (so > 0) { A.head = (A.head || 0) + 0.24 * so; q.dy = (q.dy || 0) + (2 + 2 * Math.sin(g * 1.3)) * so;
      if (!has(q.tenu) && !assis) { armTo(q, 'armF', [26, 2], so); armTo(q, 'armB', [16, 2], so); }
      setF(f, { eyes: 'half', mouth: 'o', brow: 'worry' }); }
    if (pi > 0) {        // pincettes de la main AVANT, une grille au bout, bras tendu, visage détourné
      if (q.tenu === undefined) q.tenu = 'pincettes';
      if (q.tenu === 'pincettes' && q.tenuO.tient === undefined) q.tenuO.tient = 'journalGrille';
      armTo(q, 'armF', [186, -196], pi);
      armTo(q, 'armB', [24, -150], pi); q.handB = 'open';
      A.head = (A.head || 0) - 0.38 * pi; if (!assis) q.tilt = (q.tilt || 0) - 0.1 * pi;
      setF(f, { eyes: 'closed', mouth: 'tight', brow: 'frown' }); q.nez = true;
    }
    if (epi > 0) {
      if (!assis) plier(q, 0.13 * epi);
      A.head = (A.head || 0) + 0.05 * epi;
      const P = headPt(q, 30, -56); armTo(q, 'armF', [P[0] - 4, P[1] + 16], epi); q.handF = q.handF || 'fist';
      q.sourcil += 1.0 * epi; setF(f, { brow: 'up', eyes: 'half', mouth: 'tight' });
    }
    if (go > 0) {        // assis, grille sur les genoux, crayon aux lèvres (ecrit 0) puis qui écrit (ecrit → 1)
      q._genoux = true; if (q.tenu === undefined && !(ca > 0)) q.tenu = 'crayon';
      armTo(q, 'armB', [28, -64], go); q.handB = 'open';
      if (q.tenu === 'crayon') {
        const Pm = headPt(q, 30, -22), aL = -1.25, vL = tipVec('crayon', q.tenuO, 'gomme', aL), Tl = [Pm[0] - vL[0] + 2, Pm[1] - vL[1]];
        const aE = -0.5, vE = tipVec('crayon', q.tenuO, 'mine', aE), cel = [96 + 14 * Math.sin(g * 0.7), -96 + 8 * Math.sin(g * 1.1)];
        const Te = [cel[0] - vE[0] + 3 * Math.sin(g * 9), cel[1] - vE[1] + 2 * Math.sin(g * 13)];
        A.objet = (A.objet || 0) + lerp(aL, aE, ec);
        armTo(q, 'armF', [lerp(Tl[0], Te[0], ec), lerp(Tl[1], Te[1], ec)], go);
      }
      A.head = (A.head || 0) + lerp(-0.04, 0.22, ec); setF(f, { mouth: ec > 0.5 ? 'tight' : 'smile', eyes: 'half', brow: 'up' });
    }
    if (ca > 0 && go <= 0) q._genoux = true;
    expr(q, q.expr); respire(q, 1.0, 1.1);
    q._post = postRedac;
  }, 0.9);

  // =====================================================================
  // 7) JOUEURS DE 1924 (A canotier/veste ocre ; B garçonne/robe verte/sautoir ; C chauve, lunettes rondes, costume brun) + BIBLIOTHÉCAIRE
  //    gestes communs : lit, ecrit, assis, porte (pile de 5 dictionnaires), mordille ; recueil tenu d'office (main avant)
  // =====================================================================
  const DICO = ['#6e2a2a', '#2f4a3a', '#2e3a5a', '#7a5a2a', '#4a2f45'];
  function drawPile(p) {     // pile de 5 dictionnaires, dans le repère du torse, posée sur l'avant-bras (bas y +6)
    for (let i = 0; i < 5; i++) {
      const y1 = 6 - i * 60, y0 = y1 - 56, dx = [0, 6, -4, 5, -2][i], x0 = 40 + dx, x1 = 168 + dx;
      pc([[x0, y0 + 3], [x0 + 3, y0], [x1 - 3, y0], [x1, y0 + 3], [x1, y1 - 3], [x1 - 3, y1], [x0 + 3, y1], [x0, y1 - 3]], DICO[i], () => {
        hatch(null, 0.8, 4, 0.2); shade(x1, 0, x0, 0, 0.2, [x0 - 2, y0 - 2, x1 + 2, y1 + 2]);
        for (const yy of [y0 + 10, y1 - 10]) strokePts([[x0 + 4, yy], [x1 - 4, yy]], C.or, 1.4);
        fillPts(rect(x0 + 40, y0 + 18, x1 - 40, y1 - 18), 'rgba(0,0,0,0.22)', 0, 0);
        strokePts([[x0 + 46, y0 + 28], [x1 - 46, y0 + 28]], C.orL, 1.2);
      }, 9300 + i);
    }
  }
  function gestesJoueur(q, loc, robe) {
    const A = q.ang, f = q.face, g = M.tg(q.t);
    const li = kk(q, 'lit'), ec = kk(q, 'ecrit'), mo = kk(q, 'mordille'), po = kk(q, 'porte');
    const assis = asseoir(q, !(li > 0) && !(ec > 0) && !(mo > 0) && !(po > 0));
    const seed = q._seed || 0;
    if (po > 0) {
      q.tenu = q.tenu === undefined ? 'rien' : q.tenu; q._pile = true; q._bras = true;
      armTo(q, 'armF', [156, -14], po); q.handF = 'open'; armTo(q, 'armB', [52, -2], po); q.handB = 'open';
      A.head = (A.head || 0) - 0.14 * po; if (!assis) q.tilt = (q.tilt || 0) - 0.06 * po; setF(f, { brow: 'worry', mouth: 'o' });
      q.dy = (q.dy || 0) + 1.5 * Math.abs(Math.sin(g * 3));
      return;
    }
    if (li > 0) {
      if (q.tenu === undefined) q.tenu = 'recueil';
      if (q.tenu === 'recueil') { if (q.tenuO.ouvert == null) q.tenuO.ouvert = 1; q.tenuO.seed = seed; }
      if (q.deuxMains == null) q.deuxMains = true;
      armTo(q, 'armF', assis ? [150, -96] : [154, -112], li); A.head = (A.head || 0) + 0.24 * li; setF(f, { eyes: 'half' });
      return;
    }
    if (ec > 0 || mo > 0) {
      if (q.tenu === undefined) q.tenu = 'crayon';
      if (q.tenuB === undefined) q.tenuB = 'recueil';
      if (q.tenuB === 'recueil') { if (q.tenuBO.ouvert == null) q.tenuBO.ouvert = 1; if (q.tenuBO.prise == null) q.tenuBO.prise = 'gauche'; q.tenuBO.crayon = false; q.tenuBO.seed = seed; }
      const Tb = assis ? [40, -84] : [44, -104];
      armTo(q, 'armB', Tb, Math.max(ec, mo));
      if (mo > 0 && ec < 1) {
        const Pm = headPt(q, 28, -20), aL = -1.3, vL = tipVec('crayon', q.tenuO, 'gomme', aL);
        A.objet = (A.objet || 0) + aL * mo * (1 - ec);
        armTo(q, 'armF', [Pm[0] - vL[0] + 1.5 * Math.sin(g * 8), Pm[1] - vL[1] + 1.2 * Math.sin(g * 11)], mo * (1 - ec));
        A.head = (A.head || 0) - 0.1 * mo; setF(f, { eyes: 'half', brow: 'worry' });
      }
      if (ec > 0) {
        const aE = -0.5, vE = tipVec('crayon', q.tenuO, 'mine', aE), P0 = [Tb[0] + 100, Tb[1] - 4];
        const cel = [P0[0] + 8 * Math.sin(g * 0.8 + seed), P0[1] + 6 * Math.sin(g * 1.3)];
        A.objet = (A.objet || 0) + aE * ec;
        armTo(q, 'armF', [cel[0] - vE[0] + 3 * Math.sin(g * 9), cel[1] - vE[1] + 2 * Math.sin(g * 12)], ec);
        A.head = (A.head || 0) + 0.26 * ec; setF(f, { eyes: 'half', brow: 'frown' });
      }
      q._cord = true;
      return;
    }
    if (q.tenu === undefined && !robe) q.tenu = 'recueil';
    if (q.tenu === 'recueil') q.tenuO.seed = seed;
  }
  function postJoueur(r) {
    if (r.q._cord && r.tenu === 'crayon' && r.tenuB === 'recueil') cordon(MC.pt(r, 'gomme'), MC.pt(r, 'attache', true), 46);
  }
  const pileDef = { parent: 'torso', at: [0, 0], noRivet: true, base: '#000', seed: 9310, pts: OFFP, extra: (p) => { if (p._pile) drawPile(p); } };
  const ORDER_J = (head) => ['armB_up', 'armB_lo', 'legB', 'legF', 'head'].concat(head, ['torso', 'pan', 'pile']).concat(TAIL);

  // ---- joueur A : jeune homme, canotier de paille à ruban marine, veste ocre, pantalon gris clair, nœud papillon brun
  const CANOT = [[-40, -88], [-30, -92], [-28, -118, 1], [30, -120, 1], [32, -92], [46, -88], [48, -84, 1], [-42, -82, 1]];
  function mkJoueurA() {
    const legO = { th: 0.92, assis: true, pant: () => '#9c978a', shoe: () => '#5a3a22', by: () => 216, deco: () => strokePts([[26, -20], [28, 214]], 'rgba(60,56,50,0.4)', 1.1) };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: (p) => (p.assis ? torseHanche(T_HOMME, 22) : torseHanche(T_HOMME, 30)), base: C.ocre, seed: 9401, paint: () => {
        fillPts([[2, -182], [18, -172], [22, -150], [12, -120], [4, -150]], C.chemise);
        fillPts([[12, -170], [24, -176], [26, -162], [14, -164]], '#5a3424'); fillPts([[14, -170], [6, -176], [6, -162]], '#5a3424');
        fillPts([[18, -168], [28, -150], [30, -112], [20, -92], [14, -132]], C.ocreD);                          // revers
        for (const y of [-80, -50]) dot(28, y, 2.4, '#4a3418');
        fillPts([[6, -56], [26, -56], [26, -50], [6, -50]], C.ocreD); strokePts([[-30, -20], [32, -20]], 'rgba(60,40,10,0.25)', 1);
        hatch([[-42, -170], [-12, -170], [-12, 32], [-42, 32]], 0.75, 4.2, 0.3); shade(33, -60, -38, -40, 0.25, [-42, -190, 40, 32]);
      } },
      pan: panDef(9412, C.ocre, 70),
      legB: legDef([-6, -2], 9402, true, legO), legF: legDef([6, -2], 9403, false, legO),
      armB_up: upDef([-10, -146], 9404, true, { manche: C.ocreD }),
      armB_lo: foreDef('armB_up', true, 9405, { manche: C.ocreD, peau: '#cfa88a', cuff: () => fillPts(rect(-18, 68, 18, 78), C.chemiseD) }),
      armF_up: upDef([-2, -146], 9406, false, { manche: C.ocre }),
      armF_lo: foreDef('armF_up', false, 9407, { manche: C.ocre, peau: C.peauA, cuff: () => fillPts(rect(-18, 68, 18, 78), C.chemise) }),
      head: { parent: 'torso', at: [6, -170], pts: H_HOMME, base: C.peauA, seed: 9408, noRivet: true, paint: (p) => {
        const f = p.face || {}; X.earPaint(-8, -44); hatch([[-30, -40], [-2, -28], [8, -6], [-10, 16], [-34, 4]], 0.6, 3.6, 0.24);
        dot(18, -36, 7, 'rgba(220,130,110,0.22)'); X.eye(f, 17, -53); X.brow(f, 17, -61, 'rgba(80,50,26,0.9)', 2.4); X.mouth(f, 26, -21);
        fillPts([[-34, -80], [-30, -50], [-22, -48], [-16, -66], [8, -78], [26, -78], [26, -84], [-30, -86]], '#5a3a22', 2);   // cheveux bruns courts
      } },
      canotier: { parent: 'head', at: [0, 0], noRivet: true, base: C.paille, seed: 9409, pts: CANOT, paint: () => {
        fillPts([[-30, -104], [30, -106], [31, -94], [-30, -92]], C.marine);
        for (let x = -28; x < 30; x += 5) strokePts([[x, -118], [x + 2, -106]], 'rgba(140,110,50,0.5)', 1);
        for (let x = -40; x < 48; x += 6) strokePts([[x, -88], [x + 3, -83]], 'rgba(140,110,50,0.5)', 1);
        strokePts([[-28, -117], [30, -119]], 'rgba(255,240,200,0.6)', 1.3);
      } },
    };
    const d = defOf('joueurA', parts, G_ADULTE, C.peauA, '#cfa88a', 9440, ORDER_J(['canotier']), -238);
    d.parts.pile = pileDef; return d;
  }
  // ---- joueuse B : coupe garçonne noire à frange, robe vert éteint à taille basse (ceinture sur les hanches), sautoir de perles, bas clairs
  const B_HAIR = [[30, -64], [33, -80], [25, -96], [5, -104], [-17, -100], [-33, -87], [-39, -64], [-38, -34], [-32, -20], [-20, -20], [-14, -34], [-10, -48], [-2, -58], [14, -62], [24, -62]];
  const B_TORSO = [[-13, -176], [7, -180], [15, -168], [22, -150], [27, -118], [26, -84], [22, -50], [26, 0], [30, 60], [34, 118, 1], [-38, 120, 1], [-36, 60], [-32, 0], [-30, -50], [-33, -100], [-32, -146], [-24, -166]];
  function mkJoueuseB() {
    const legO = { th: 0.84, assis: true, pant: () => C.bas, shoe: () => '#2a1e1c', by: () => 220 };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: (p) => (p.assis ? torseHanche(B_TORSO.filter((q) => q[1] <= 0 || q[2]), 22) : B_TORSO), base: C.vert, seed: 9501, paint: (p) => {
        fillPts([[-40, -14], [34, -16], [34, 6], [-40, 8]], C.vertD);                                        // ceinture basse
        fillPts(ell(30, -6, 6, 8, 10), '#8a9a7a', 0, 0);
        fillPts([[4, -180], [16, -170], [12, -160], [2, -166]], C.vertD);
        const n = 20; for (let i = 0; i < n; i++) { const u = i / (n - 1), x = lerp(12, 20, Math.sin(u * PI)) + 4 * u, y = lerp(-172, -40, u); dot(x, y, 2.3, '#efe8da'); dot(x - 0.6, y - 0.6, 0.9, '#ffffff'); }
        if (!p.assis) for (const x of [-20, 0, 18]) strokePts([[x, 10], [x + 4, 118]], 'rgba(30,40,28,0.35)', 1.2);   // plis de la jupe
        hatch([[-42, -170], [-12, -170], [-12, 124], [-42, 124]], 0.75, 4.2, 0.28); shade(30, -60, -36, -40, 0.25, [-42, -190, 40, 124]);
      } },
      pan: panDef(9512, C.vert, 90),
      legB: legDef([-6, -2], 9502, true, legO), legF: legDef([6, -2], 9503, false, legO),
      armB_up: upDef([-10, -146], 9504, true, { wt: 14, manche: C.vertD }),
      armB_lo: foreDef('armB_up', true, 9505, { manche: C.vertD, peau: '#d4b094' }),
      armF_up: upDef([-2, -146], 9506, false, { wt: 14, manche: C.vert }),
      armF_lo: foreDef('armF_up', false, 9507, { manche: C.vert, peau: C.peauB, cuff: () => strokePts([[-18, 72], [18, 72]], C.vertD, 2) }),
      head: { parent: 'torso', at: [6, -170], pts: H_FEMME, base: C.peauB, seed: 9508, noRivet: true, paint: (p) => {
        const f = p.face || {}; hatch([[-30, -40], [-2, -28], [8, -6], [-10, 16], [-34, 4]], 0.6, 3.6, 0.2);
        dot(16, -34, 7, 'rgba(220,120,110,0.28)'); X.eye(f, 16, -52); X.brow(f, 16, -60, 'rgba(30,24,24,0.9)', 2);
        X.mouth(f, 24, -20, 'rgba(150,40,48,0.95)'); strokePts([[18, -52], [10, -56]], 'rgba(30,20,20,0.6)', 1.2);
      } },
      cheveux: { parent: 'head', at: [0, 0], noRivet: true, base: C.noirC, seed: 9509, pts: B_HAIR, paint: () => {
        strokePts(qbez([28, -82], [2, -100], [-30, -82]), 'rgba(150,150,170,0.45)', 1.5);
        for (let i = 0; i < 4; i++) strokePts(qbez([22 - i * 12, -96], [20 - i * 13, -70], [10 - i * 12, -30 - i * 2]), 'rgba(90,90,110,0.35)', 1);
      } },
    };
    const d = defOf('joueuseB', parts, G_ADULTE, C.peauB, '#d4b094', 9540, ORDER_J(['cheveux']), -238);
    d.parts.pile = pileDef; return d;
  }
  // ---- joueur C : homme mûr chauve (couronne grise derrière l'oreille), lunettes rondes cerclées de noir, MOUSTACHE BLANCHE,
  //      costume brun, GILET BLEU ARDOISE, cravate vert sombre (≠ WW.marston)
  const C_COUR = [[-20, -62], [-26, -72], [-34, -72], [-40, -60], [-39, -44], [-33, -36], [-27, -42], [-23, -54]];
  const C_MOUST = [[17, -33], [28, -36], [36, -32], [38, -25], [31, -23], [22, -22], [13, -25]];
  const C_TORSO = [[-15, -178], [8, -182], [18, -170], [28, -150], [36, -116], [40, -70], [40, -30], [36, 0], [34, 26, 1], [-36, 28, 1], [-38, 0], [-40, -60], [-40, -112], [-35, -150], [-26, -168]];
  function mkJoueurC() {
    const legO = { th: 1.0, assis: true, pant: () => C.brunD, shoe: () => '#1e1612', by: () => 216 };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: (p) => (p.assis ? torseHanche(C_TORSO, 22) : C_TORSO), base: C.brun, seed: 9601, paint: () => {
        fillPts([[2, -182], [18, -172], [24, -150], [30, -112], [24, -76], [8, -130]], '#5b6f86');                     // gilet bleu ardoise
        for (const y of [-140, -120, -100]) dot(22, y, 1.8, '#2a3444');
        fillPts([[4, -182], [16, -176], [14, -166], [4, -170]], C.chemise);
        fillPts([[12, -168], [20, -166], [24, -126], [18, -118], [14, -128]], '#2f3f30');                            // cravate
        fillPts([[18, -170], [30, -150], [38, -112], [30, -86], [20, -132]], C.brunD);
        for (const y of [-74, -44, -14]) dot(36, y, 2.4, '#2a1c10');
        hatch(null, 0.785, 6, 0.12, 1, M.P.encre, [-50, -190, 50, 40]); hatch(null, -0.785, 6, 0.12, 1, M.P.encre, [-50, -190, 50, 40]);   // tweed
        hatch([[-42, -170], [-12, -170], [-12, 28], [-42, 28]], 0.75, 4.2, 0.3); shade(38, -60, -40, -40, 0.28, [-44, -190, 44, 30]);
      } },
      pan: panDef(9612, C.brun, 66),
      legB: legDef([-6, -2], 9602, true, legO), legF: legDef([6, -2], 9603, false, legO),
      armB_up: upDef([-10, -146], 9604, true, { wt: 17, manche: C.brunD }),
      armB_lo: foreDef('armB_up', true, 9605, { manche: C.brunD, peau: '#c09a7c', cuff: () => fillPts(rect(-18, 68, 18, 78), C.chemiseD) }),
      armF_up: upDef([-2, -146], 9606, false, { wt: 17, manche: C.brun }),
      armF_lo: foreDef('armF_up', false, 9607, { manche: C.brun, peau: C.peauC, cuff: () => fillPts(rect(-18, 68, 18, 78), C.chemise) }),
      head: { parent: 'torso', at: [6, -170], pts: H_ROND, base: C.peauC, seed: 9608, noRivet: true, paint: (p) => {
        const f = p.face || {}; X.earPaint(-10, -44); hatch([[-30, -40], [-2, -28], [8, -6], [-10, 16], [-34, 4]], 0.6, 3.6, 0.28);
        strokePts(qbez([20, -92], [0, -100], [-20, -92]), 'rgba(255,240,220,0.6)', 2);                              // crâne luisant
        strokePts([[14, -74], [26, -72]], 'rgba(150,100,80,0.4)', 1); strokePts([[12, -68], [24, -66]], 'rgba(150,100,80,0.35)', 1);
        fillPts(C_COUR, '#a4a19a', 2, 0.4); hatch(C_COUR, 1.2, 3, 0.3);                                               // couronne grise derrière l'oreille
        X.eye(f, 19, -53); X.brow(f, 19, -63, 'rgba(110,108,104,0.95)', 2.6); X.mouth(f, 28, -18);
        const ring = ell(20, -53, 11, 11, 16); fillPts(ring, 'rgba(200,225,235,0.25)', 0, 0); strokePts(ring.concat([ring[0]]), '#141214', 2.8);
        strokePts([[9, -54], [-8, -50]], '#141214', 2); strokePts([[14, -58], [19, -61]], 'rgba(255,255,255,0.7)', 1.2);
      } },
      moustache: { parent: 'head', at: [0, 0], noRivet: true, base: '#efede6', seed: 9611, pts: C_MOUST, paint: () => { for (const x of [18, 24, 30]) strokePts([[x - 2, -33], [x + 1, -25]], 'rgba(150,146,136,0.6)', 1); } },
    };
    const d = defOf('joueurC', parts, G_ADULTE, C.peauC, '#c09a7c', 9640, ORDER_J(['moustache']), -238);
    d.parts.pile = pileDef; return d;
  }
  // ---- bibliothécaire : chignon gris, lunettes à chaîne, longue robe prune à col blanc (pas de jambes : robe jusqu'au sol)
  const L_HAIR = [[28, -70], [31, -84], [22, -98], [3, -104], [-17, -100], [-33, -86], [-36, -64], [-32, -46], [-24, -50], [-16, -64], [0, -72], [16, -74]];
  const L_TORSO = [[-13, -176], [7, -180], [15, -168], [22, -150], [27, -118], [26, -84], [22, -44], [26, 0], [38, 110], [48, 226, 1], [-52, 228, 1], [-44, 110], [-34, 0], [-30, -44], [-33, -96], [-32, -144], [-24, -166]];
  function mkBiblio() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: L_TORSO, base: C.prune, seed: 9701, paint: () => {
        fillPts([[0, -182], [20, -172], [26, -160], [12, -154], [2, -162], [-14, -168]], '#f4efe4');                // col blanc
        strokePts([[2, -162], [12, -154], [26, -160]], 'rgba(120,110,96,0.5)', 1);
        dot(20, -150, 4, C.or); dot(20, -150, 2, '#7a3050');                                                        // broche
        for (const y of [-130, -104, -78]) dot(22, y, 2, '#2e1a26');
        fillPts([[-36, -10], [28, -10], [28, -2], [-36, -2]], C.pruneD);
        for (const x of [-30, -10, 12, 30]) strokePts([[x, 10], [x * 1.3, 226]], 'rgba(30,14,24,0.35)', 1.3);
        hatch([[-56, -170], [-12, -170], [-12, 230], [-56, 230]], 0.75, 4.2, 0.3); shade(40, 0, -50, 0, 0.28, [-56, -190, 52, 232]);
        fillPts(rect(-60, 214, 60, 232), 'rgba(20,10,16,0.3)');
      } },
      armB_up: upDef([-10, -146], 9704, true, { wt: 14, manche: C.pruneD }),
      armB_lo: foreDef('armB_up', true, 9705, { manche: C.pruneD, peau: '#cfac94', cuff: () => fillPts(rect(-17, 68, 17, 78), '#d8d2c4') }),
      armF_up: upDef([-2, -146], 9706, false, { wt: 14, manche: C.prune }),
      armF_lo: foreDef('armF_up', false, 9707, { manche: C.prune, peau: C.peauL, cuff: () => fillPts(rect(-17, 68, 17, 78), '#f4efe4') }),
      head: { parent: 'torso', at: [6, -170], pts: H_FEMME, base: C.peauL, seed: 9708, noRivet: true, paint: (p) => {
        const f = p.face || {}; hatch([[-30, -40], [-2, -28], [8, -6], [-10, 16], [-34, 4]], 0.6, 3.6, 0.24);
        strokePts([[10, -40], [16, -36]], 'rgba(150,100,80,0.4)', 1); strokePts(qbez([4, -16], [12, -12], [20, -14]), 'rgba(150,100,80,0.3)', 1);
        X.eye(f, 16, -52); X.brow(f, 16, -61, 'rgba(120,118,114,0.95)', 2.2); X.mouth(f, 24, -20, 'rgba(130,60,64,0.95)');
        const ring = ell(18, -51, 8, 6.5, 14); fillPts(ring, 'rgba(200,225,235,0.25)', 0, 0); strokePts(ring.concat([ring[0]]), '#6a5a30', 1.6);
        strokePts([[10, -52], [-6, -50]], '#6a5a30', 1.4);
      } },
      cheveux: { parent: 'head', at: [0, 0], noRivet: true, base: C.grisC, seed: 9709, pts: L_HAIR, paint: () => {
        for (let i = 0; i < 5; i++) strokePts(qbez([26 - i * 4, -90 + i * 2], [0, -100 + i * 6], [-30 + i * 2, -70 + i * 4]), 'rgba(100,98,94,0.5)', 1.1);
      } },
      chignon: { parent: 'head', at: [-30, -86], noRivet: true, base: '#a8a59e', seed: 9710, pts: ell(0, 0, 17, 15, 16), paint: () => { strokePts(ep(0, 0, 10, 8, 12, 0, 4.4), 'rgba(90,88,84,0.6)', 1.2); hatch(null, 1.3, 3, 0.3); } },
      chaine: { parent: 'head', at: [0, 0], noRivet: true, base: '#000', seed: 9711, pts: OFFP, extra: () => {
        const P = qbez([10, -50], [-14, -10], [-6, 30], 12); for (let i = 0; i < P.length; i++) dot(P[i][0], P[i][1], 1.3, C.or);
      } },
    };
    const d = defOf('bibliothecaire', parts, G_ADULTE, C.peauL, '#cfac94', 9740, ['armB_up', 'armB_lo', 'chignon', 'head', 'cheveux', 'torso', 'chaine'].concat(TAIL), -238);
    return d;
  }
  CH.mcJoueurA = mkJoueurA(); CH.mcJoueuseB = mkJoueuseB(); CH.mcJoueurC = mkJoueurC(); CH.mcBiblio = mkBiblio();
  MC.joueurA = wrap('mcJoueurA', (q, loc) => { q._seed = 1; gestesJoueur(q, loc); expr(q, q.expr); respire(q, 1.1, 0.2); q._post = postJoueur; }, 0.9);
  MC.joueuseB = wrap('mcJoueuseB', (q, loc) => { q._seed = 2; gestesJoueur(q, loc); expr(q, q.expr); respire(q, 1.0, 1.4); q._post = postJoueur; }, 0.88);
  MC.joueurC = wrap('mcJoueurC', (q, loc) => { q._seed = 3; gestesJoueur(q, loc); expr(q, q.expr); respire(q, 1.3, 2.3); q._post = postJoueur; }, 0.9);
  MC.biblio = wrap('mcBiblio', function (q, loc) {
    const A = q.ang, f = q.face, g = M.tg(q.t); q._robe = true;
    const de = kk(q, 'desespoir'), ch = kk(q, 'chut');
    if (de > 0) { const w = Math.sin(g * 5) * 3;
      armTo(q, 'armF', [96, -268 + w], de); armTo(q, 'armB', [44, -282 - w], de); q.handF = 'open'; q.handB = 'open';
      A.head = (A.head || 0) + 0.2 * de; setF(f, { brow: 'worry', mouth: 'o', eyes: 'half' }); }
    if (ch > 0) { const P = headPt(q, 30, -18); armTo(q, 'armF', [P[0] + 4, P[1] + 14], ch); q.handF = 'open';
      armTo(q, 'armB', [96, -60], ch); q.handB = 'open'; A.head = (A.head || 0) - 0.04 * ch; setF(f, { brow: 'frown', mouth: 'o', eyes: 'open' }); }
    expr(q, q.expr); respire(q, 0.9, 0.7);
  }, 0.88);

  // =====================================================================
  // 8) ACCESSOIRES SEULS (sans tige) : même dessin que tenus. (x,y) = point `base` de l'objet ; o.dir, o.rot, o.alpha, o.cast, o.ombre, o.t
  // =====================================================================
  const accDefs = {};
  function accDef(name, fn) { return accDefs[name] || (accDefs[name] = { hipY: 0, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => fn(p.o) } }, order: ['o'] }); }
  function acc(name, x, y, s, o) {
    const ob = OBJ[name]; o = o || {};
    return M.puppet(accDef('o_' + name, (oo) => { const b = ptOf(ob.base, oo), c = cx_(); c.save(); c.translate(-b[0], -b[1]); drawOb(ob, Object.assign({ t: oo.t || 0 }, oo)); c.restore(); }),
      { o, tilt: o.rot || 0 }, x, y, s == null ? 1 : s, { dir: o.dir || 1, rod: false, slot: o.slot != null ? o.slot : y + 6 * (s || 1), floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
  }
  function locPt(px, py, x, y, s, o) { o = o || {}; const d = o.dir || 1, r = o.rot || 0, X0 = px * s * d, Y0 = py * s; return [x + X0 * Math.cos(r) - Y0 * Math.sin(r) * d, y + X0 * Math.sin(r) * d + Y0 * Math.cos(r)]; }
  MC.accPt = function (name, x, y, s, o, nom) { const ob = OBJ[name], oo = o || {}, b = ptOf(ob.base, oo), q = ob.pts[nom] ? ptOf(ob.pts[nom], oo) : nom === 'prise' ? gripOf(ob, oo) : [0, 0]; return locPt(q[0] - b[0], q[1] - b[1], x, y, s == null ? 1 : s, oo); };
  for (const n of ['grilleLosange', 'grilleCarree', 'journalGrille', 'journalTimes', 'recueil', 'crayon', 'pincettes', 'note']) MC[n] = (x, y, s, o) => acc(n, x, y, s, o);
  MC.BEND = { tous: { armF: [1, 1], armB: [1, 1] } };

  // =====================================================================
  // 9) BUREAU DU RÉDACTEUR DU NEW YORK TIMES (1924 / 1941) — MC.bureauTimes(t, up, o) AVANT M.drawFloor(), MC.bureauTimesSol(t, up, o) juste APRÈS
  // =====================================================================
  const BU = {
    fenetre: { x0: 380, x1: 640, y0: 262, y1: 900 }, biblio: { x0: 110, x1: 330, y0: 470 }, portrait: { x: 850, y: 270 }, portrait2: { x: 220, y: 260 },
    ephemeride: { x: 716, y: 560 }, horloge: { x: 820, y0: 700 }, tube: { x: 904, bouche: [904, 1004], panier: [904, 1074] },
    bureau: { x0: 380, x1: 712, y: 1182 }, lampe: { x: 668, y: 1182 }, telephone: { x: 418, y: 1182 }, encrier: { x: 600, y: 1182 }, radio: { x: 520, y: 1182 },
    corbeille: { x: 770, y: 1428, bord: 1300 }, fauteuil: { x: 290, siege: 112, y: 1315 }, portemanteau: { x: 990 },
    zone: { x0: 420, x1: 700 }, cheminees: [[420, 690], [470, 640], [560, 720], [612, 668]],
  };
  MC.BUREAU = BU;
  function boiserie(c) {
    // mur haut (damas olive sombre), corniche, lambris d'acajou à panneaux
    fillPts(rect(0, 0, W, BACK + 40), C.mur, 0, 0);
    for (let y = 170; y < 990; y += 46) for (let x = 0; x < W; x += 46) { const o = (Math.floor(y / 46) % 2) * 23; strokePts(ep(x + o, y, 7, 11, 10, 0, TAU), 'rgba(30,28,18,0.25)', 1); }
    hatch(rect(0, 0, W, 990), 0.8, 5, 0.12, 1, M.P.encre, [0, 0, W, 990]);
    pc(rect(0, 150, W, 196), C.boiserie, () => { strokePts([[0, 190], [W, 190]], 'rgba(255,220,170,0.2)', 1.4); for (let x = 10; x < W; x += 24) fillPts(rect(x, 176, x + 12, 186), 'rgba(0,0,0,0.25)', 0, 0); }, 8001, { drop: false });
    pc(rect(0, 978, W, BACK + 40), C.boiserie, () => {
      hatch(null, 1.45, 6, 0.18, 1, M.P.encre, [0, 978, W, BACK + 40]);
      for (let x = 20; x < W; x += 130) { pc(rect(x, 1010, x + 110, 1360), C.boiserieL, () => { shade(x, 1010, x + 110, 1360, 0.3, [x, 1010, x + 110, 1360]); strokePts([[x + 6, 1016], [x + 104, 1016]], 'rgba(255,220,170,0.18)', 1.2); }, 8002 + x); }
    }, 8003);
    pc(rect(0, 968, W, 990), C.acajouL, () => strokePts([[0, 972], [W, 972]], 'rgba(255,220,170,0.3)', 1.4), 8004);
  }
  function makeVue() {      // gratte-ciel de New York dans la fenêtre (le ciel est peint en direct)
    return M.pre(W, BACK + 40, (c) => {
      const F = BU.fenetre, R = M.rng(77);
      const tours = [[392, 640, 60, '#8a8e94'], [440, 520, 46, '#7e838a'], [486, 430, 52, '#9096a0'], [538, 590, 70, '#868b92'], [598, 470, 50, '#7c8188'], [628, 600, 40, '#8e9298']];
      for (const [x, top, w, col] of tours) {
        const pts = [[x - w / 2, F.y1, 1], [x - w / 2, top + 30, 1], [x - w / 2 + 8, top + 30, 1], [x - w / 2 + 8, top, 1], [x + w / 2 - 8, top, 1], [x + w / 2 - 8, top + 30, 1], [x + w / 2, top + 30, 1], [x + w / 2, F.y1, 1]];
        pc(pts, col, () => { for (let yy = top + 40; yy < F.y1; yy += 16) for (let xx = x - w / 2 + 6; xx < x + w / 2 - 6; xx += 10) fillPts(rect(xx, yy, xx + 5, yy + 8), R() < 0.3 ? 'rgba(240,226,180,0.55)' : 'rgba(40,44,52,0.45)', 0, 0); shade(x + w / 2, 0, x - w / 2, 0, 0.25, [x - w / 2, top, x + w / 2, F.y1]); }, 8101 + x, { drop: false });
      }
      // flèche gothique (gratte-ciel à pinacle, sans enseigne)
      pc([[486 - 10, 430, 1], [486 - 6, 380, 1], [486, 330, 1], [486 + 6, 380, 1], [486 + 10, 430, 1]], '#9aa0a8', null, 8120, { drop: false });
      for (const [x, y] of [[420, 690], [470, 640], [560, 720], [612, 668]]) { pc(rect(x - 9, y, x + 9, y + 40), '#6a5a50', null, 8130 + x, { drop: false }); }
      // château d'eau sur un toit
      pc([[530, 590, 1], [530, 560], [546, 548], [562, 560], [562, 590, 1]], '#7a6450', () => { for (let y = 560; y < 590; y += 6) strokePts([[530, y], [562, y]], 'rgba(40,30,20,0.4)', 1); }, 8140, { drop: false });
    });
  }
  function makeFond() {
    return M.pre(W, BACK + 40, (c) => {
      const F = BU.fenetre, B = BU.biblio;
      boiserie(c);
      // trou de la fenêtre (le ciel et la vue se voient au travers)
      c.save(); c.globalCompositeOperation = 'destination-out'; c.fillRect(F.x0, F.y0, F.x1 - F.x0, F.y1 - F.y0); c.restore();
      // cadre et petits bois
      const e = 18;
      pc([[F.x0 - e, F.y0 - e], [F.x1 + e, F.y0 - e], [F.x1 + e, F.y1 + e], [F.x0 - e, F.y1 + e]], C.acajou, () => { shade(F.x0 - e, 0, F.x1 + e, 0, 0.2, [F.x0 - e, F.y0 - e, F.x1 + e, F.y1 + e]); }, 8201);
      c.save(); c.globalCompositeOperation = 'destination-out'; c.fillRect(F.x0, F.y0, F.x1 - F.x0, F.y1 - F.y0); c.restore();
      for (const x of [F.x0 + (F.x1 - F.x0) / 3, F.x0 + 2 * (F.x1 - F.x0) / 3]) pc(rect(x - 3, F.y0, x + 3, F.y1), C.acajouD, null, 8202 + x, { drop: false });
      for (let i = 1; i < 6; i++) { const y = F.y0 + i * (F.y1 - F.y0) / 6; pc(rect(F.x0, y - 3, F.x1, y + 3), C.acajouD, null, 8210 + i, { drop: false }); }
      pc(rect(F.x0 - 30, F.y1 + e - 4, F.x1 + 30, F.y1 + e + 14), C.acajouL, () => strokePts([[F.x0 - 30, F.y1 + e - 2], [F.x1 + 30, F.y1 + e - 2]], 'rgba(255,220,170,0.3)', 1.3), 8220);
      // rideaux de velours vert sombre, embrasses
      for (const [x0, x1, s] of [[F.x0 - 56, F.x0 + 10, 1], [F.x1 - 10, F.x1 + 56, -1]]) {
        pc([[x0, F.y0 - 40], [x1, F.y0 - 40], [x1 - s * 6, F.y0 + 300], [x1 + s * 4, F.y1 + 40], [x0, F.y1 + 50]], '#2f4a3a', () => { for (let x = x0 + 8; x < x1; x += 12) strokePts([[x, F.y0 - 40], [x + s * 2, F.y1 + 40]], 'rgba(10,20,14,0.4)', 1.4); shade(x0, 0, x1, 0, 0.3, [x0, F.y0 - 40, x1, F.y1 + 50]); }, 8230 + x0);
        pc(rect(Math.min(x0, x1) + 4, F.y0 + 296, Math.max(x0, x1) - 4, F.y0 + 310), C.or, null, 8240 + x0, { drop: false });
      }
      pc(rect(F.x0 - 70, F.y0 - 52, F.x1 + 70, F.y0 - 38), C.laitonD, null, 8245);
      // bibliothèque vitrée
      pc(rect(B.x0, B.y0, B.x1, BACK + 6), C.acajou, () => {
        hatch(null, 1.4, 6, 0.14, 1, M.P.encre, [B.x0, B.y0, B.x1, BACK]);
        const R = M.rng(91), cols = ['#6e2a2a', '#2f4a3a', '#2e3a5a', '#7a5a2a', '#4a2f45', '#5a3e2a', '#8a6a3a', '#3a3a48'];
        for (let r = 0; r < 5; r++) { const y1 = B.y0 + 60 + r * 150, y0 = y1 - 118;
          fillPts(rect(B.x0 + 14, y0 - 8, B.x1 - 14, y1 + 10), '#2a160e', 0, 0);
          for (let x = B.x0 + 16; x < B.x1 - 18;) { const w = 10 + Math.floor(R() * 9), h = 92 + R() * 24, col = cols[Math.floor(R() * cols.length)];
            fillPts(rect(x, y1 - h, x + w, y1), col, 0, 0); strokePts([[x + 1, y1 - h + 12], [x + w - 1, y1 - h + 12]], C.or, 1); strokePts([[x + 1, y1 - 14], [x + w - 1, y1 - 14]], C.or, 1); x += w + 1; }
          fillPts(rect(B.x0 + 10, y1, B.x1 - 10, y1 + 10), C.acajouL, 0, 0); }
        for (const x of [B.x0 + 10, (B.x0 + B.x1) / 2, B.x1 - 10]) fillPts(rect(x - 4, B.y0 + 10, x + 4, BACK - 120), C.acajouL, 0, 0);
        for (const [a, b] of [[B.x0 + 14, (B.x0 + B.x1) / 2 - 4], [(B.x0 + B.x1) / 2 + 4, B.x1 - 14]]) for (let k = 0; k < 2; k++) strokePts([[a + 20 + k * 22, B.y0 + 30], [a + 70 + k * 22, B.y0 + 200]], 'rgba(230,240,255,0.22)', 3);
        fillPts(rect(B.x0, BACK - 120, B.x1, BACK), C.acajouD, 0, 0); for (const x of [B.x0 + 55, B.x1 - 55]) dot(x, BACK - 60, 4, C.laiton);
        shade(B.x1, 0, B.x0, 0, 0.3, [B.x0, B.y0, B.x1, BACK]);
      }, 8250);
      pc(rect(B.x0 - 12, B.y0 - 26, B.x1 + 12, B.y0 + 4), C.acajouL, () => strokePts([[B.x0 - 12, B.y0 - 22], [B.x1 + 12, B.y0 - 22]], 'rgba(255,220,170,0.3)', 1.3), 8251);
      // portraits encadrés (silhouettes sans visage reconnaissable)
      for (const [P, w, h, fond] of [[BU.portrait, 130, 170, '#3e3a2e'], [BU.portrait2, 110, 140, '#3a3428']]) {
        pc(rect(P.x - w / 2 - 12, P.y - 12, P.x + w / 2 + 12, P.y + h + 12), C.or, () => { strokePts([[P.x - w / 2 - 8, P.y - 8], [P.x + w / 2 + 8, P.y - 8]], C.orL, 1.4); hatch(null, 0.8, 3, 0.25); }, 8260 + P.x);
        pc(rect(P.x - w / 2, P.y, P.x + w / 2, P.y + h), fond, () => {
          fillPts([[P.x - w * 0.36, P.y + h], [P.x - w * 0.3, P.y + h * 0.66], [P.x - w * 0.12, P.y + h * 0.56], [P.x - w * 0.14, P.y + h * 0.36], [P.x, P.y + h * 0.2], [P.x + w * 0.14, P.y + h * 0.36], [P.x + w * 0.12, P.y + h * 0.56], [P.x + w * 0.3, P.y + h * 0.66], [P.x + w * 0.36, P.y + h]], '#1e1c18');
          shade(P.x - w / 2, P.y, P.x + w / 2, P.y + h, 0.3, [P.x - w / 2, P.y, P.x + w / 2, P.y + h]);
        }, 8262 + P.x, { drop: false });
      }
      // horloge de parquet (caisse ; cadran, aiguilles et balancier en direct)
      const Hx = BU.horloge.x, H0 = BU.horloge.y0;
      pc([[Hx - 50, H0 + 40], [Hx - 40, H0], [Hx + 40, H0], [Hx + 50, H0 + 40], [Hx + 50, H0 + 150], [Hx + 40, H0 + 160], [Hx + 40, BACK - 40], [Hx + 52, BACK - 30], [Hx + 52, BACK + 6, 1], [Hx - 52, BACK + 6, 1], [Hx - 52, BACK - 30], [Hx - 40, BACK - 40], [Hx - 40, H0 + 160], [Hx - 50, H0 + 150]], C.acajou, () => {
        hatch(null, 1.4, 5, 0.16); shade(Hx + 50, 0, Hx - 50, 0, 0.3, [Hx - 55, H0, Hx + 55, BACK]);
        fillPts(rect(Hx - 24, H0 + 200, Hx + 24, H0 + 520), '#1e120a', 0, 0);
        strokePts([[Hx - 24, H0 + 200], [Hx + 24, H0 + 200], [Hx + 24, H0 + 520], [Hx - 24, H0 + 520]], C.or, 1.3, true);
        fillPts(ell(Hx, H0 + 82, 38, 38, 24), C.or, 0, 0);
      }, 8270);
      // tube pneumatique en laiton (descend du plafond le long du mur)
      const T = BU.tube;
      pc(rect(T.x - 13, 150, T.x + 13, T.bouche[1] - 30), C.laiton, () => { strokePts([[T.x - 5, 150], [T.x - 5, T.bouche[1]]], 'rgba(255,240,200,0.55)', 2); shade(T.x + 13, 0, T.x - 13, 0, 0.3, [T.x - 14, 150, T.x + 14, T.bouche[1]]); for (const y of [320, 560, 800]) fillPts(rect(T.x - 15, y, T.x + 15, y + 8), C.laitonD, 0, 0); }, 8280);
      pc([[T.x - 22, T.bouche[1] - 34], [T.x + 22, T.bouche[1] - 34], [T.x + 26, T.bouche[1] + 4, 1], [T.x - 26, T.bouche[1] + 4, 1]], C.laitonD, () => fillPts(rect(T.x - 18, T.bouche[1] - 26, T.x + 18, T.bouche[1] - 20), 'rgba(255,240,200,0.4)', 0, 0), 8281);
      // porte-manteau et chapeau melon
      const Px = BU.portemanteau.x;
      pc(rect(Px - 6, 640, Px + 6, BACK + 4), C.acajouD, null, 8290);
      for (const s of [-1, 1]) pc(bar([Px, 680], [Px + s * 36, 650], 6), C.acajouD, null, 8291 + s);
      pc([[Px - 40, BACK + 4, 1], [Px, BACK - 20], [Px + 40, BACK + 4, 1]], C.acajouD, null, 8294);
      pc([[Px - 30, 646, 1], [Px - 28, 626], [Px - 18, 606], [Px, 600], [Px + 18, 606], [Px + 28, 626], [Px + 30, 646, 1]], '#1c1a1a', () => fillPts(rect(Px - 30, 638, Px + 30, 646), '#2a2626'), 8295);
      pc([[Px - 44, 652], [Px + 44, 652], [Px + 40, 646], [Px - 40, 646]], '#1c1a1a', null, 8296, { drop: false });
      pc([[Px - 26, 690], [Px + 26, 690], [Px + 34, 900], [Px - 34, 900]], '#3a3a40', () => hatch(null, 1.5, 4, 0.25), 8297);   // pardessus gris
    });
  }
  function makeBureau(annee) {
    return M.pre(W, BACK + 40, (c) => {
      const Bd = BU.bureau, y = Bd.y;
      // bureau d'acajou : plateau, caissons à tiroirs, façade
      pc(rect(Bd.x0, y + 14, Bd.x0 + 110, BACK + 6), C.acajou, () => { for (let i = 0; i < 3; i++) { const yy = y + 34 + i * 62; strokePts([[Bd.x0 + 10, yy], [Bd.x0 + 100, yy], [Bd.x0 + 100, yy + 50], [Bd.x0 + 10, yy + 50]], 'rgba(20,8,4,0.6)', 1.4, true); dot(Bd.x0 + 55, yy + 25, 3.2, C.laiton); } hatch(null, 1.4, 5, 0.15); }, 8301);
      pc(rect(Bd.x1 - 110, y + 14, Bd.x1, BACK + 6), C.acajou, () => { for (let i = 0; i < 3; i++) { const yy = y + 34 + i * 62; strokePts([[Bd.x1 - 100, yy], [Bd.x1 - 10, yy], [Bd.x1 - 10, yy + 50], [Bd.x1 - 100, yy + 50]], 'rgba(20,8,4,0.6)', 1.4, true); dot(Bd.x1 - 55, yy + 25, 3.2, C.laiton); } hatch(null, 1.4, 5, 0.15); }, 8302);
      pc(rect(Bd.x0 + 110, y + 14, Bd.x1 - 110, y + 70), C.acajouD, () => dot((Bd.x0 + Bd.x1) / 2, y + 42, 3.2, C.laiton), 8303);
      pc(rect(Bd.x0 - 14, y - 4, Bd.x1 + 14, y + 16), C.acajouL, () => { strokePts([[Bd.x0 - 14, y - 1], [Bd.x1 + 14, y - 1]], 'rgba(255,220,170,0.4)', 1.4); }, 8304);
      // sous-main de cuir vert, papiers, encrier et porte-plume
      pc(rect(450, y - 8, 590, y - 3), '#2f4a3a', null, 8305, { drop: false });
      pc([[452, y - 10], [520, y - 14], [524, y - 9], [456, y - 6]], '#ece4cc', null, 8306, { drop: false });
      pc([[586, y - 4], [588, y - 26], [596, y - 34], [610, y - 34], [616, y - 26], [618, y - 4]], '#22222a', () => strokePts([[592, y - 28], [612, y - 28]], 'rgba(255,255,255,0.3)', 1), 8307);
      pc(bar([603, y - 34], [628, y - 78], 3), '#3a2a20', null, 8308, { drop: false });
      // pile de journaux pliés (tranche grise)
      pc(rect(540, y - 30, 590, y - 8), '#d8d0bc', () => { for (let yy = y - 27; yy < y - 8; yy += 4) strokePts([[540, yy], [590, yy]], 'rgba(90,86,80,0.5)', 1); }, 8309);
      // lampe de bureau : pied et bras de laiton (abat-jour et lumière en direct)
      const L = BU.lampe;
      pc([[L.x - 22, y - 2, 1], [L.x - 16, y - 12], [L.x + 16, y - 12], [L.x + 22, y - 2, 1]], C.laitonD, null, 8310);
      pc(rect(L.x - 4, y - 92, L.x + 4, y - 12), C.laiton, () => strokePts([[L.x - 1, y - 92], [L.x - 1, y - 12]], 'rgba(255,240,200,0.6)', 1.2), 8311);
      // téléphone : chandelier (1924) | bakélite noire (1941) ; radio de table (1941)
      const Tp = BU.telephone;
      if (annee === 1941) {
        pc([[Tp.x - 30, y - 2, 1], [Tp.x - 24, y - 34], [Tp.x + 24, y - 34], [Tp.x + 30, y - 2, 1]], '#141214', () => { fillPts(ell(Tp.x, y - 18, 11, 11, 14), '#e8e2d2', 0, 0); fillPts(ell(Tp.x, y - 18, 4, 4, 10), '#141214', 0, 0); strokePts([[Tp.x - 20, y - 30], [Tp.x + 6, y - 32]], 'rgba(255,255,255,0.3)', 1.3); }, 8320);
        pc([[Tp.x - 36, y - 40], [Tp.x - 28, y - 50], [Tp.x + 28, y - 50], [Tp.x + 36, y - 40], [Tp.x + 30, y - 34], [Tp.x - 30, y - 34]], '#1c1a1c', null, 8321);
        const Rx = BU.radio.x;
        pc([[Rx - 34, y - 3, 1], [Rx - 34, y - 60], [Rx - 26, y - 78], [Rx, y - 86], [Rx + 26, y - 78], [Rx + 34, y - 60], [Rx + 34, y - 3, 1]], '#6a4428', () => {
          fillPts([[Rx - 22, y - 16], [Rx - 22, y - 58], [Rx, y - 72], [Rx + 22, y - 58], [Rx + 22, y - 16]], '#c4b28a', 0, 0);
          for (let x = Rx - 16; x <= Rx + 16; x += 8) strokePts([[x, y - 18], [x, y - 58 + Math.abs(x - Rx) * 0.2]], '#6a4428', 2);
          dot(Rx - 14, y - 10, 3, '#2a1a10'); dot(Rx + 14, y - 10, 3, '#2a1a10'); shade(Rx + 34, 0, Rx - 34, 0, 0.3, [Rx - 36, y - 90, Rx + 36, y]);
        }, 8322);
      } else {
        pc([[Tp.x - 20, y - 2, 1], [Tp.x - 14, y - 12], [Tp.x - 5, y - 14], [Tp.x - 5, y - 96], [Tp.x + 5, y - 96], [Tp.x + 5, y - 14], [Tp.x + 14, y - 12], [Tp.x + 20, y - 2, 1]], '#1c1a1c', () => strokePts([[Tp.x - 1, y - 92], [Tp.x - 1, y - 16]], 'rgba(255,255,255,0.3)', 1), 8323);
        pc(ell(Tp.x + 4, y - 102, 12, 9, 14), '#1c1a1c', null, 8324);
        pc([[Tp.x - 10, y - 70], [Tp.x - 30, y - 74], [Tp.x - 34, y - 44], [Tp.x - 26, y - 42], [Tp.x - 22, y - 64], [Tp.x - 10, y - 62]], '#1c1a1c', null, 8325);
        pc(rect(480, y - 22, 530, y - 8), '#c8bfa6', () => strokePts([[484, y - 18], [526, y - 18]], 'rgba(90,86,80,0.5)', 1), 8326, { drop: false });
      }
    });
  }
  function makeStore() {
    const F = BU.fenetre;
    return M.pre(W, BACK + 40, (c) => {
      pc(rect(F.x0 - 6, F.y0 - 6, F.x1 + 6, F.y1 - 64), '#141418', () => {
        for (let y = F.y0; y < F.y1; y += 22) strokePts([[F.x0, y], [F.x1, y]], 'rgba(90,90,110,0.35)', 1.2);
        hatch(null, 0.5, 5, 0.25, 1, M.P.encre, [F.x0, F.y0, F.x1, F.y1]);
      }, 8401, { drop: false });
      pc(rect(F.x0 - 8, F.y1 - 72, F.x1 + 8, F.y1 - 62), '#2a2a30', () => dot((F.x0 + F.x1) / 2, F.y1 - 67, 4, C.laiton), 8402, { drop: false });
    });
  }
  function makeSol() {
    return M.pre(W, M.H, (c) => {
      // tapis d'Orient (bande au bord du plancher)
      pc([[300, 1400], [780, 1400], [820, 1446], [260, 1446]], '#6a2a24', () => {
        fillPts([[316, 1406], [764, 1406], [794, 1440], [286, 1440]], '#7c3a2a', 0, 0);
        for (let x = 330; x < 760; x += 36) fillPts([[x, 1423], [x + 9, 1412], [x + 18, 1423], [x + 9, 1434]], '#c49a4a', 0, 0);
        strokePts([[300, 1409], [780, 1409]], '#c49a4a', 1.6); strokePts([[272, 1438], [808, 1438]], '#c49a4a', 1.6);
        hatch(null, 0.3, 4, 0.18);
      }, 8501, { drop: false });
      for (let x = 264; x < 818; x += 7) strokePts([[x, 1446], [x - 1, 1453]], '#d8c8a0', 1.2);
    });
  }
  function makeFauteuil() {          // fauteuil club de cuir, de profil (dossier à gauche) ; dessiné avant le personnage assis
    const Fx = BU.fauteuil.x, sy = BU.fauteuil.y;
    return M.withShadow(M.pre(W, M.H, (c) => {
      pc([[Fx - 92, 1426, 1], [Fx - 98, sy - 150], [Fx - 86, sy - 176], [Fx - 64, sy - 180], [Fx - 50, sy - 160], [Fx - 44, sy - 20], [Fx - 40, 1426, 1]], '#6a3420', () => { hatch(null, 1.4, 4, 0.2); shade(Fx - 40, 0, Fx - 98, 0, 0.3, [Fx - 100, sy - 190, Fx - 40, 1430]); for (let y = sy - 150; y < sy; y += 30) for (let x = Fx - 88; x < Fx - 50; x += 18) dot(x + (y / 30 % 2) * 9, y, 2, '#3a1a0e'); }, 8601);
      pc([[Fx - 60, sy + 6], [Fx - 56, sy - 4], [Fx + 80, sy - 8], [Fx + 92, sy + 4], [Fx + 90, 1410], [Fx - 60, 1410]], '#7a3e26', () => { hatch(null, 0.3, 4, 0.18); shade(Fx, sy, Fx, 1410, 0.3, [Fx - 60, sy - 10, Fx + 94, 1412]); strokePts([[Fx - 50, sy + 2], [Fx + 84, sy - 2]], 'rgba(255,210,170,0.3)', 1.4); }, 8602);
      pc([[Fx + 74, sy + 40], [Fx + 76, sy - 36], [Fx + 92, sy - 52], [Fx + 112, sy - 46], [Fx + 116, sy - 20], [Fx + 108, 1412], [Fx + 80, 1412]], '#6e3622', () => { hatch(null, 1.3, 4, 0.2); strokePts(ep(Fx + 96, sy - 30, 12, 12, 12, 0, TAU), 'rgba(40,16,8,0.5)', 1.3); }, 8603);
      for (const x of [Fx - 56, Fx + 100]) pc(rect(x - 6, 1410, x + 6, 1428), '#2a1a10', null, 8604 + x, { drop: false });
    }), 8);
  }
  function drawCorbeille(c, o) {
    const Co = BU.corbeille, x0 = Co.x - 62, x1 = Co.x + 62, yb = Co.bord, bas = [Co.x - 48, Co.x + 48];
    pc([[x0, yb], [x1, yb], [bas[1], Co.y], [bas[0], Co.y]], '#b08a4a', () => {
      for (let y = yb + 8; y < Co.y; y += 9) strokePts([[x0 + (y - yb) * 0.11, y], [x1 - (y - yb) * 0.11, y]], 'rgba(90,60,20,0.55)', 1.4);
      for (let x = x0; x <= x1; x += 11) strokePts([[x, yb], [lerp(bas[0], bas[1], (x - x0) / (x1 - x0)), Co.y]], 'rgba(90,60,20,0.4)', 1.2);
      shade(x1, 0, x0, 0, 0.28, [x0, yb, x1, Co.y]);
    }, 8701);
    pc(rect(x0 - 4, yb - 4, x1 + 4, yb + 8), '#9a743a', () => { for (let x = x0; x < x1; x += 8) strokePts([[x, yb - 2], [x + 6, yb + 6]], 'rgba(60,40,14,0.5)', 1.4); }, 8702, { drop: false });
  }
  function ciel(c, t, o, nuit, bk) {
    const F = BU.fenetre, g = M.tg(t);
    const sk = c.createLinearGradient(0, F.y0, 0, F.y1);
    if (nuit) { sk.addColorStop(0, '#151a2a'); sk.addColorStop(1, '#2a3044'); } else { sk.addColorStop(0, '#9fb0bc'); sk.addColorStop(0.7, '#d4d6cc'); sk.addColorStop(1, '#e6dcc4'); }
    c.fillStyle = sk; c.fillRect(F.x0, F.y0, F.x1 - F.x0, F.y1 - F.y0);
    if (nuit) {
      for (let i = 0; i < 26; i++) { const x = F.x0 + hash(i * 3.1) * (F.x1 - F.x0), y = F.y0 + hash(i * 7.7) * 300; dot(x, y, 1.2, `rgba(240,240,220,${0.4 + 0.3 * Math.sin(g * 2 + i)})`); }
    } else M.nuages(t, { y0: F.y0 + 40, y1: F.y0 + 220, n: 5, vit: 16, s: 0.6, seed: 31, col: '#eee8da', brume: 0.15 });
  }
  function projecteurs(c, t, bk) {
    const F = BU.fenetre, g = M.tg(t);
    // projecteurs de DCA qui balaient le ciel
      if (!SIL()) { c.save(); c.globalCompositeOperation = 'lighter';
        for (const [x0, ph, sp] of [[300, 0, 0.5], [720, 2.1, 0.37], [520, 4, 0.29]]) { const a = -PI / 2 + 0.85 * Math.sin(g * sp + ph), L = 1000, w = 0.06, y0 = F.y1 + 60;
          c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + Math.cos(a - w) * L, y0 + Math.sin(a - w) * L); c.lineTo(x0 + Math.cos(a + w) * L, y0 + Math.sin(a + w) * L); c.closePath();
          const gr = c.createLinearGradient(x0, y0, x0 + Math.cos(a) * L, y0 + Math.sin(a) * L); gr.addColorStop(0, `rgba(225,232,255,${0.4 + 0.3 * bk})`); gr.addColorStop(1, 'rgba(220,230,255,0)'); c.fillStyle = gr; c.fill(); }
        c.restore(); }
  }
  // MC.bureauTimes(t, up, o) : o.annee 1924 (défaut) | 1941 ; o.blackout 0..1 ; o.capsule 0..1 ; o.effeuille 0..1 ; o.lumiere 0..1 (défaut 1)
  MC.bureauTimes = function (t, up, o) {
    o = o || {}; up = up || 0; const K = MC.K, c = cx_(), g = M.tg(t), F = BU.fenetre, an = o.annee === 1941 ? 1941 : 1924;
    const bk = clamp(o.blackout || 0), nuit = an === 1941;
    c.save(); c.translate(0, -up);
    c.save(); c.beginPath(); c.rect(F.x0, F.y0, F.x1 - F.x0, F.y1 - F.y0); c.clip();
    ciel(c, t, o, nuit, bk);
    c.drawImage(K.vue, 0, 0);
    if (nuit && !SIL()) { c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = 'rgba(40,46,80,0.72)'; c.fillRect(F.x0, F.y0, F.x1 - F.x0, F.y1 - F.y0); c.restore(); }
    if (nuit) projecteurs(c, t, bk);
    for (const [x, y] of BU.cheminees) M.fumee(t, { x, y: y - 4, s: 0.22, n: 4, haut: 160, vent: 30, col: nuit ? '#4a4e5a' : '#9a968e', a: 0.5, seed: x });
    // store noir qui descend (blackout) : il laisse une fente en bas
    if (bk > 0) c.drawImage(K.store, 0, -(1 - ease(bk)) * (F.y1 - F.y0 + 10));
    c.restore();
    c.drawImage(K.fond, 0, 0);
    // horloge : cadran sans chiffre, aiguilles, balancier
    const Hx = BU.horloge.x, H0 = BU.horloge.y0, hc = [Hx, H0 + 82];
    fillPts(ell(hc[0], hc[1], 32, 32, 24), '#ece4cc', 0, 0);
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; strokePts([[hc[0] + Math.cos(a) * 25, hc[1] + Math.sin(a) * 25], [hc[0] + Math.cos(a) * 30, hc[1] + Math.sin(a) * 30]], C.encre, i % 3 ? 1 : 2.2); }
    const am = g * 0.1, ah = g * 0.1 / 12 + 1.2;
    strokePts([hc, [hc[0] + Math.sin(ah) * 16, hc[1] - Math.cos(ah) * 16]], C.encre, 2.6); strokePts([hc, [hc[0] + Math.sin(am) * 24, hc[1] - Math.cos(am) * 24]], C.encre, 1.6); dot(hc[0], hc[1], 2.5, C.laiton);
    const pa = 0.16 * Math.sin(g * PI), pv = [Hx, H0 + 210];
    strokePts([pv, [pv[0] + Math.sin(pa) * 270, pv[1] + Math.cos(pa) * 270]], C.laitonD, 2.4);
    fillPts(ell(pv[0] + Math.sin(pa) * 280, pv[1] + Math.cos(pa) * 280, 17, 17, 18), C.laiton, 0, 0); dot(pv[0] + Math.sin(pa) * 280 - 5, pv[1] + Math.cos(pa) * 280 - 5, 4, C.laitonL);
    // éphéméride murale sans chiffre (feuilles qui s'envolent : effeuille)
    ephemeride(c, t, an, clamp(o.effeuille || 0));
    // bureau + objets (lampe, téléphone, radio 1941)
    c.drawImage(an === 1941 ? K.bureau41 : K.bureau24, 0, 0);
    lampe(c, t, bk, an);
    tube(c, t, clamp(o.capsule || 0));
    // pièce assombrie (black-out) + rai de lumière par la fente du store
    const lu = o.lumiere == null ? 1 : clamp(o.lumiere), dk = clamp((nuit ? 0.25 : 0) + 0.45 * bk + 0.5 * (1 - lu));
    if (!SIL() && dk > 0) {
      c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = `rgba(36,40,66,${dk})`; c.fillRect(0, 0, W, BACK + 40); c.restore();
      if (bk > 0.6) { const a = (bk - 0.6) / 0.4 * (0.16 + 0.08 * Math.max(0, Math.sin(g * 0.5))); c.save(); c.globalCompositeOperation = 'lighter';
        c.beginPath(); c.moveTo(F.x0, F.y1 - 62); c.lineTo(F.x1, F.y1 - 62); c.lineTo(F.x1 + 260, BACK); c.lineTo(F.x0 + 120, BACK); c.closePath();
        const gr = c.createLinearGradient(0, F.y1 - 62, 0, BACK); gr.addColorStop(0, `rgba(200,210,240,${a})`); gr.addColorStop(1, 'rgba(200,210,240,0)'); c.fillStyle = gr; c.fill(); c.restore(); }
    }
    if (!SIL()) lampeLueur(c, t, bk, an);
    c.restore();
  };
  function lampe(c, t, bk, an) {
    const L = BU.lampe, y = BU.bureau.y - 92, d = 10 * ease(bk);
    pc([[L.x - 52, y + 22 + d], [L.x - 38, y - 4 + d * 0.4], [L.x + 38, y - 4 + d * 0.4], [L.x + 52, y + 22 + d]], bk > 0.5 ? '#1e2a22' : '#2f6a46', () => { strokePts([[L.x - 34, y + 2], [L.x + 30, y + 2]], 'rgba(200,255,210,0.35)', 1.4); shade(L.x, y, L.x, y + 22, 0.3, [L.x - 55, y - 6, L.x + 55, y + 30]); }, 8801);
    dot(L.x, y - 6, 3, C.laiton);
  }
  function lampeLueur(c, t, bk, an) {
    const L = BU.lampe, y = BU.bureau.y - 70, g = M.tg(t), f = 1 + 0.04 * Math.sin(g * 11) + 0.03 * Math.sin(g * 23);
    c.save(); c.globalCompositeOperation = 'lighter';
    const r = (bk > 0.5 ? 110 : 220) * f, gr = c.createRadialGradient(L.x, y + 20, 4, L.x, y + 40, r);
    gr.addColorStop(0, `rgba(255,220,150,${bk > 0.5 ? 0.34 : 0.22})`); gr.addColorStop(1, 'rgba(255,220,150,0)'); c.fillStyle = gr;
    c.fillRect(L.x - r, y, 2 * r, r + 40); c.restore();
  }
  function ephemeride(c, t, an, ef) {
    const E = BU.ephemeride, col = an === 1941 ? '#5a2a2a' : '#2f4a3a', pg = an === 1941 ? '#ece6d8' : '#efe6cc';
    pc(rect(E.x - 62, E.y - 76, E.x + 62, E.y + 84), col, () => { strokePts([[E.x - 56, E.y - 70], [E.x + 56, E.y - 70], [E.x + 56, E.y + 78], [E.x - 56, E.y + 78]], C.or, 1.2, true); hatch(null, 0.8, 4, 0.18); }, 8901);
    dot(E.x, E.y - 88, 3, C.laiton); strokePts([[E.x - 30, E.y - 76], [E.x, E.y - 88], [E.x + 30, E.y - 76]], '#2a2420', 1.2);
    const N = 9, g = M.tg(t), n = ef * N;
    const feuille = (i) => { const motif = (i + (an === 1941 ? 3 : 0)) % 4;
      pc(rect(-46, -44, 46, 56), pg, () => {
        fillPts(rect(-46, -44, 46, -24), an === 1941 ? '#8a2a2a' : '#4a6a52', 0, 0);
        if (motif === 0) { fillPts(ell(0, 14, 16, 16, 16), 'rgba(80,70,60,0.5)', 0, 0); }
        else if (motif === 1) { fillPts([[-16, 26], [0, -2], [16, 26]], 'rgba(80,70,60,0.5)', 0, 0); }
        else if (motif === 2) { fillPts(rect(-14, 0, 14, 28), 'rgba(80,70,60,0.5)', 0, 0); }
        else { for (let k = 0; k < 3; k++) strokePts([[-18, 2 + k * 10], [18, 2 + k * 10]], 'rgba(80,70,60,0.55)', 3); }
        strokePts([[-46, -24], [46, -24]], 'rgba(60,50,40,0.4)', 1);
      }, 8910 + (i % 5), { drop: false }); };
    c.save(); c.translate(E.x, E.y + 10); fillPts(rect(-48, 56, 48, 62), '#cfc6ae', 0, 0); feuille(Math.floor(n) + 1); c.restore();
    for (let i = 0; i < N; i++) {     // feuilles qui s'envolent en rafale
      const u = clamp(n - i); if (u <= 0) { if (i === Math.floor(n)) { c.save(); c.translate(E.x, E.y + 10); feuille(i); c.restore(); } continue; }
      if (u >= 1 && n - i > 1.4) continue;
      const v = clamp((n - i) / 1.4), x = E.x - 260 * v + 30 * Math.sin(v * 6 + i), y = E.y + 10 - 140 * Math.sin(v * PI * 0.8) + 300 * v * v;
      c.save(); c.translate(x, y); c.rotate(-v * 3 - i); c.scale(Math.cos(v * 9 + i) * 0.8 + 0.2, 1); c.globalAlpha = 1 - v * 0.6; feuille(i); c.restore();
    }
  }
  function tube(c, t, k) {
    const T = BU.tube, bx = T.bouche[0], by = T.bouche[1], px = T.panier[0], py = T.panier[1], g = M.tg(t);
    // panier de fil de fer
    const sh = k > 0.25 && k < 0.45 ? Math.sin(g * 60) * 1.5 : 0;
    strokePts([[px - 34, py - 30], [px - 26, py + 22], [px + 26, py + 22], [px + 34, py - 30]], '#3a3a3e', 1.6);
    for (let i = 1; i < 6; i++) { const x = px - 34 + i * 68 / 6; strokePts([[x, py - 30], [lerp(px - 26, px + 26, i / 6), py + 22]], 'rgba(58,58,62,0.7)', 1); }
    for (const yy of [py - 12, py + 6]) strokePts([[px - 31, yy], [px + 31, yy]], 'rgba(58,58,62,0.7)', 1);
    strokePts([[px - 36, py - 30], [px + 36, py - 30]], '#2a2a2e', 2.2);
    // capsule : arrive (tube qui tremble), trappe qui s'ouvre, tombe dans le panier, s'y pose
    const tr = sm(0.42, 0.52, k) * (1 - sm(0.72, 0.86, k));
    const cap = (x, y, a) => { c.save(); c.translate(x, y); c.rotate(a); pc([[-10, -26], [10, -26], [12, -20], [12, 22], [10, 26], [-10, 26], [-12, 22], [-12, -20]], '#7a6a3a', () => { fillPts(rect(-12, -26, 12, -16), C.laiton, 0, 0); fillPts(rect(-12, 16, 12, 26), C.laiton, 0, 0); strokePts([[-5, -16], [-5, 16]], 'rgba(255,240,200,0.5)', 1.5); }, 8990, { drop: false }); c.restore(); };
    if (k > 0.5) { const u = clamp((k - 0.5) / 0.22), yy = lerp(by - 10, py + 2, u * u), bou = k > 0.72 ? -Math.abs(Math.sin((k - 0.72) * 40)) * 10 * Math.max(0, 1 - (k - 0.72) * 5) : 0;
      cap(bx + (px - bx) * u, yy + bou, k > 0.72 ? 1.35 : 0.3 * u); }
    c.save(); c.translate(bx, by + sh); c.rotate(-1.3 * tr);
    pc([[-24, 0], [24, 0], [24, 8], [-24, 8]], C.laitonD, () => strokePts([[-20, 2], [20, 2]], 'rgba(255,240,200,0.5)', 1.2), 8991, { drop: false }); c.restore();
    dot(bx - 24, by + 4, 3, C.laiton);
  }
  // MC.bureauTimesSol(t, up, o) : tapis, fauteuil club (o.fauteuil, défaut true), corbeille d'osier ; o.blackout, o.annee comme bureauTimes
  MC.bureauTimesSol = function (t, up, o) {
    o = o || {}; up = up || 0; const c = cx_(), K = MC.K, bk = clamp(o.blackout || 0), nuit = o.annee === 1941;
    c.save(); c.translate(0, -up);
    c.drawImage(K.sol, 0, 0);
    if (o.fauteuil !== false) M.flat(K.fauteuil, W / 2, M.H, { cast: { a: 0.3, dx: 14, dy: 6 } });
    drawCorbeille(c, o);
    const dk = clamp((nuit ? 0.25 : 0) + 0.45 * bk);
    if (!SIL() && dk > 0) { c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = `rgba(36,40,66,${dk})`; c.fillRect(0, BACK + 2, W, 60); if (o.fauteuil !== false) c.fillRect(BU.fauteuil.x - 112, 1120, 240, BACK + 2 - 1120); c.fillRect(BU.corbeille.x - 70, BU.corbeille.bord - 8, 140, BACK + 2 - BU.corbeille.bord + 8); c.restore(); }
    c.restore();
  };

  // =====================================================================
  // 10) INIT
  // =====================================================================
  MC.init = function () {
    if (MC.K) return MC.K;
    const K = (MC.K = {});
    K.vue = makeVue(); K.fond = makeFond(); K.bureau24 = makeBureau(1924); K.bureau41 = makeBureau(1941); K.store = makeStore(); K.sol = makeSol(); K.fauteuil = makeFauteuil();
    return K;
  };
})();
