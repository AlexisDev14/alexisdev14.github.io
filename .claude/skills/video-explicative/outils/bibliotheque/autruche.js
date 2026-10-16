// persos.js — « L'autruche qui avalait la clé de son enclos » : marionnettes, accessoires et décors PROPRES À CETTE VIDÉO. Espace M.aut (alias AUT). Appeler AUT.init() dans S.init.
// Mode d'emploi : persos.md (ne pas lire ce fichier en entier). Aucun texte, lettre, chiffre ni logo. Déterministe (aucun Math.random).
// MARIONNETTES : AUT.autruche, AUT.gardien, AUT.chercheur (pose, x, y, s, o)   ACCESSOIRES : AUT.cle, AUT.obj, AUT.tas, AUT.cuve, AUT.plateau,
// AUT.toise, AUT.journal, AUT.pince   DÉCORS : AUT.init() → AUT.K ; AUT.enclos(t, o), AUT.labo(t, o)   AIDES : AUT.pt, AUT.plateauPt, AUT.OBJETS
(function () {
  'use strict';
  const X = M.X, P = M.P, TAU = M.TAU, PI = Math.PI, D = 180 / PI, ST = M.ST;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, hash, smooth } = M;
  const AUT = (M.aut = {});
  const CH = M.chars;
  const cx_ = () => M.ctx();
  const SIL = () => M._sil();
  const OFFP = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];

  // ------------------------------------------------------------ géométrie
  function ep(cx, cy, rx, ry, n, a0, a1) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; }
  function ell(cx, cy, rx, ry, n) { const o = ep(cx, cy, rx, ry, n || 16, 0, TAU); o.pop(); return o; }
  function ring(cx, cy, R, r, n) {                                             // anneau (trou réel) : contour extérieur + intérieur à rebours, couture vive
    n = n || 20; const o = ep(cx, cy, R, R, n, 0, TAU), i = ep(cx, cy, r, r, n, TAU, 0);
    o[0].push(1); o[n].push(1); i[0].push(1); i[n].push(1); return o.concat(i);
  }
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
  const mp = (m, p) => [m.a * p[0] + m.c * p[1] + m.e, m.b * p[0] + m.d * p[1] + m.f];
  const normA = (a) => { while (a > PI) a -= TAU; while (a < -PI) a += TAU; return a; };
  const pc = (pts, base, paint, seed, o) => piece(pts, base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));
  AUT.geo = { ep, ell, ring, rrect, ribbon };

  // bras à articulations rondes (épaule et coude : demi-cercles centrés sur le rivet)
  const R_COUDE = 11.5, LA = 96, LB = Math.hypot(4, 96), PHI = Math.atan2(-4, 96), SH_F = [-2, -146], SH_B = [-10, -146];
  function armR(len, wt) { wt = wt || 15; return ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1, 40], [R_COUDE + 0.5, len - 6]], ep(0, len, R_COUDE, R_COUDE, 10, 0, PI), [[-R_COUDE - 0.5, len - 6], [-wt + 1, 40]]); }
  function foreR(kind) { const f = X.forePts(kind); return ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU).concat(f.slice(2)); }
  function ik2(S, T, pick) {                                                   // IK dans le repère du torse ; pick 'bas' | 'avant' | 'arriere'
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
  // OBJETS — chacun dans son repère, à l'échelle 1 (seul = accessoire ; tenu = pièce 'objet' de l'avant-bras)
  // =====================================================================
  const FER = { n: '#2c2a2b', l: '#625e5b', d: '#141213' };
  // ---------------- la clé de l'enclos : verticale, anneau en trèfle EN BAS, panneton EN HAUT ; 202 de long
  function cleBow() {
    const o = [];
    for (let i = 0; i < 36; i++) { const a = i / 36 * TAU, r = 25 + 9 * Math.cos(3 * (a - PI / 2)); o.push([r * Math.cos(a), -28 + r * Math.sin(a)]); }
    const n = o.length, hole = ep(0, -28, 8, 8, 14, TAU, 0); o.push([o[0][0], o[0][1], 1]); o[0].push(1); hole[0].push(1); hole[14].push(1);
    return o.concat(hole);
  }
  const CLE_BOW = cleBow();
  function drawCle(o) {
    const c = cx_(), t = o.t || 0, ch = clamp(o.chaud || 0), lu = clamp(o.lueur || 0);
    if (lu > 0 && !SIL()) {                                                    // halo doré derrière la clé
      const g = c.createRadialGradient(0, -100, 10, 0, -100, 150); g.addColorStop(0, `rgba(255,226,150,${0.55 * lu})`); g.addColorStop(1, 'rgba(255,226,150,0)');
      c.fillStyle = g; c.fillRect(-160, -260, 320, 320);
    }
    const base = ch > 0 ? M.mixc(FER.n, '#7a2e1c', ch * 0.8) : FER.n;
    // tige + collerette + panneton à dents (une seule pièce)
    pc([[-6, -46, 1], [-6, -194], [0, -198], [6, -194], [6, -184, 1], [34, -184, 1], [34, -176, 1], [26, -176, 1], [26, -170, 1], [34, -170, 1], [34, -158, 1], [22, -158, 1], [22, -150, 1], [6, -150, 1], [6, -46, 1]], base, () => {
      strokePts([[-2, -52], [-2, -190]], 'rgba(255,255,255,0.35)', 1.6); hatch(null, 0.9, 3, 0.35, 1, '255,255,255');
      if (ch > 0) shade(0, -40, 0, -200, 0.6 * ch, [-40, -210, 40, -40], '200,70,30');
    }, 9101);
    pc([[-11, -60, 1], [11, -60, 1], [11, -48, 1], [-11, -48, 1]], base, () => strokePts([[-9, -57], [9, -57]], 'rgba(255,255,255,0.35)', 1.2), 9102);
    pc([[-9, -112, 1], [9, -112, 1], [9, -104, 1], [-9, -104, 1]], base, null, 9103);
    pc(CLE_BOW, base, () => {
      for (let k = 0; k < 3; k++) { const a = PI / 2 + k * TAU / 3; strokePts(ep(22 * Math.cos(a), -28 + 22 * Math.sin(a), 8, 8, 8, a - 1.4, a + 1.4), 'rgba(255,255,255,0.4)', 1.3); }
      hatch(null, 0.5, 3, 0.3, 1, '255,255,255');
    }, 9104);
    if (lu > 0 && !SIL()) {                                                    // éclat à quatre branches
      const k = 0.6 + 0.4 * Math.sin(t * 5), sx = 10, sy = -176;
      c.save(); c.globalAlpha = lu * k; c.fillStyle = '#fff6d8'; c.beginPath();
      for (let i = 0; i < 8; i++) { const a = i * PI / 4, r = i % 2 ? 4 : 18; c.lineTo(sx + r * Math.cos(a), sy + r * Math.sin(a)); }
      c.fill(); c.restore();
    }
    if (ch > 0 && !SIL()) {                                                    // vapeur chaude : filets qui montent
      c.save(); c.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        const u = ((t * 0.55 + i * 0.25) % 1), x0 = -20 + i * 14, a = ch * (1 - u) * 0.55;
        c.strokeStyle = `rgba(240,236,228,${a})`; c.lineWidth = 6 * (1 - u * 0.5); c.beginPath();
        for (let j = 0; j <= 8; j++) { const v = j / 8, yy = -60 - u * 120 - v * 70; c.lineTo(x0 + Math.sin(v * 5 + t * 3 + i) * 7, yy); }
        c.stroke();
      }
      c.restore();
    }
  }
  // ---------------- objets métalliques (origine = centre ; chacun d'une couleur entière)
  const MET = { clou: '#5c514a', boulon: '#4f6e93', cuillere: '#cfd3d7', piece: '#b8693a', boucle: '#c9a23a', rondelle: '#7f9b78' };
  const hi = (pts, a) => strokePts(pts, `rgba(255,255,255,${a || 0.55})`, 1.5);
  function drawClou() {
    pc([[-5, -46, 1], [5, -46, 1], [5, 34], [0, 58, 1], [-5, 34]], MET.clou, () => { hi([[-1, -40], [-1, 34]]); hatch(null, 0.9, 3.2, 0.3); dot(2, 10, 2.2, 'rgba(150,80,40,0.6)'); }, 9201);
    pc([[-17, -56], [17, -56], [19, -50, 1], [-19, -50, 1]], MET.clou, () => hi([[-14, -54], [14, -54]]), 9202);
  }
  function drawBoulon() {
    pc([[-8, -34, 1], [8, -34, 1], [8, 48, 1], [-8, 48, 1]], MET.boulon, () => { for (let y = -30; y < 48; y += 5) strokePts([[-8, y], [8, y - 3]], 'rgba(20,30,45,0.6)', 1.1); hi([[-4, -30], [-4, 46]], 0.4); }, 9211);
    pc([[-22, -52, 1], [22, -52, 1], [22, -34, 1], [-22, -34, 1]], MET.boulon, () => { strokePts([[-8, -52], [-8, -34]], 'rgba(20,30,45,0.5)', 1.2); strokePts([[8, -52], [8, -34]], 'rgba(20,30,45,0.5)', 1.2); hi([[-18, -48], [-11, -48]]); }, 9212);
    pc([[-21, 12, 1], [21, 12, 1], [21, 30, 1], [-21, 30, 1]], MET.boulon, () => { strokePts([[-7, 12], [-7, 30]], 'rgba(20,30,45,0.5)', 1.2); strokePts([[7, 12], [7, 30]], 'rgba(20,30,45,0.5)', 1.2); hi([[-17, 16], [-10, 16]]); }, 9213);
  }
  function drawCuillere() {
    pc([[-3, -6], [3, -6], [7, 50], [6, 60, 1], [-6, 60, 1], [-7, 50]], MET.cuillere, () => { hi([[0, 0], [2, 54]], 0.8); hatch(null, 0.9, 3.4, 0.15); }, 9221);
    pc(ell(0, -34, 20, 30, 18), MET.cuillere, () => { shade(-20, -60, 20, -10, 0.35, [-22, -66, 22, -2]); hi(ep(0, -34, 13, 22, 8, PI * 0.95, PI * 1.45), 0.9); }, 9222);
  }
  function drawPiece() {
    pc(ell(0, 0, 42, 42, 24), MET.piece, () => {
      strokePts(ell(0, 0, 34, 34, 24).concat([[34, 0]]), 'rgba(80,35,15,0.6)', 1.6);
      for (let k = 0; k < 6; k++) { const a = k * PI / 3; fillPts(ell(13 * Math.cos(a), 13 * Math.sin(a), 7, 7, 10), 'rgba(80,35,15,0.4)'); }   // rosace en relief (sans lettre)
      dot(0, 0, 6, 'rgba(80,35,15,0.5)');
      hi(ep(0, 0, 38, 38, 8, PI * 1.05, PI * 1.45), 0.6); shade(30, 30, -30, -30, 0.2, [-44, -44, 44, 44]);
    }, 9231);
  }
  function drawBoucle() {
    const pts = rrect(-46, -36, 46, 36, 12), inn = rrect(-32, -22, 32, 22, 6).reverse();
    pts[0].push(1); inn[0].push(1);
    pc(pts.concat([[pts[0][0], pts[0][1], 1]], inn, [[inn[0][0], inn[0][1], 1]]), MET.boucle, () => { hi([[-40, -30], [40, -30]], 0.6); hatch(null, 0.7, 3.4, 0.25); }, 9241);
    pc([[-40, -3, 1], [36, -3, 1], [44, 0, 1], [36, 3, 1], [-40, 3, 1]], '#9a7a26', null, 9242);
  }
  function drawRondelle() { pc(ring(0, 0, 42, 17, 22), MET.rondelle, () => { hi(ep(0, 0, 36, 36, 8, PI * 1.05, PI * 1.5), 0.6); strokePts(ell(0, 0, 24, 24, 16).concat([[24, 0]]), 'rgba(30,45,30,0.4)', 1.2); hatch(null, 0.6, 3.4, 0.2); }, 9251); }
  const OBJ_DRAW = { clou: drawClou, boulon: drawBoulon, cuillere: drawCuillere, piece: drawPiece, boucle: drawBoucle, rondelle: drawRondelle };
  AUT.OBJETS = ['clou', 'boulon', 'cuillere', 'piece', 'boucle', 'rondelle'];
  AUT.MET = MET;
  // ---------------- tas d'objets (même disposition seul ou sur le plateau)
  const TAS = [[78, -12, 1.57], [-80, -22, -1.5], [0, -30, 1.62], [-48, -66, 0.2], [50, -62, -0.25], [0, -104, 0]];
  function tasListe(o) { const v = o.objets == null ? 6 : o.objets; return Array.isArray(v) ? v : AUT.OBJETS.slice(0, clamp(v | 0, 0, 6)); }
  function drawTas(o, dy) {
    const c = cx_(), L = tasListe(o);
    L.forEach((n, k) => { const s = TAS[k % 6]; c.save(); c.translate(s[0], s[1] + (dy || 0)); c.rotate(s[2]); (OBJ_DRAW[n] || drawClou)(); c.restore(); });
  }
  // ---------------- toise : perche de bois graduée de traits (sans chiffre), curseur horizontal ; bas en (0,0)
  function drawToise(o) {
    const L = o.long || 720, cur = o.curseur == null ? 0.88 : o.curseur;
    pc([[-24, 0, 1], [24, 0, 1], [24, -14, 1], [-24, -14, 1]], P.bois, () => hatch(null, 0.3, 3.5, 0.25), 9301);
    pc([[-9, -10, 1], [9, -10, 1], [9, -L, 1], [-9, -L, 1]], '#c49a5c', () => {
      for (let y = -30; y > -L + 6; y -= 20) { const big = (Math.round(-y / 20) % 5) === 0; strokePts([[9, y], [big ? -6 : 1, y]], 'rgba(40,25,10,0.85)', big ? 2 : 1.2); }
      strokePts([[-6, -14], [-6, -L + 4]], 'rgba(255,240,210,0.4)', 1.5); hatch(null, 1.45, 4, 0.18);
    }, 9302);
    if (cur > 0) {
      const y = -L * cur;
      pc([[-13, y - 10, 1], [13, y - 10, 1], [13, y + 10, 1], [-13, y + 10, 1]], P.boisM || '#7a5a3a', null, 9303);
      pc([[13, y - 5, 1], [92, y - 5, 1], [96, y, 1], [92, y + 3, 1], [13, y + 3, 1]], '#a8834e', () => hi([[16, y - 3], [90, y - 3]], 0.35), 9304);
    }
  }
  // ---------------- journal (au dos, sans texte : blocs gris et une vignette hachurée) ; bas-centre en (0,0)
  function drawJournal() {
    pc([[-76, 0, 1], [76, 0, 1], [78, -206, 1], [-74, -210, 1]], '#e6dec8', () => {
      fillPts([[-66, -196, 1], [66, -196, 1], [66, -178, 1], [-66, -178, 1]], 'rgba(60,50,40,0.75)');
      for (let col = 0; col < 2; col++) {
        const x0 = col ? 6 : -66, x1 = col ? 66 : -6;
        for (let y = -168; y < -12; y += 7) { if (col === 1 && y > -120 && y < -70) continue; fillPts([[x0, y, 1], [x1 - hash(y + col * 9) * 14, y, 1], [x1 - hash(y + col * 9) * 14, y + 3, 1], [x0, y + 3, 1]], 'rgba(90,80,70,0.38)'); }
      }
      fillPts([[8, -118, 1], [64, -118, 1], [64, -72, 1], [8, -72, 1]], 'rgba(70,60,50,0.25)'); hatch([[8, -118], [64, -118], [64, -72], [8, -72]], 0.7, 3, 0.4);
      strokePts([[1, -208], [1, 0]], 'rgba(60,50,40,0.45)', 1.4); shade(76, 0, 1, 0, 0.18, [-80, -212, 80, 2]);
    }, 9401);
  }
  // ---------------- pince longue du chercheur : prise en (0,0), pointe vers +x ; o.ouvre 0..1 ; o.tient = nom d'objet pris dans les mors
  const PINCE_L = 236;
  function drawPince(o) {
    const c = cx_(), a = 0.025 + 0.13 * clamp(o.ouvre || 0), H = 70;
    for (const sg of [-1, 1]) {
      c.save(); c.translate(H, 0); c.rotate(sg * a);
      const Y = (v) => v * sg;
      pc([[-H - 2, Y(2), 1], [-H + 4, Y(-2.5)], [PINCE_L - H - 20, Y(-2.5)], [PINCE_L - H - 2, Y(-7)], [PINCE_L - H + 4, Y(-7), 1], [PINCE_L - H + 2, Y(0)], [PINCE_L - H - 14, Y(3)], [-H + 4, Y(3.5)], [-H - 2, Y(6), 1]], '#767c82', () => { hi([[-H + 6, Y(-1)], [PINCE_L - H - 24, Y(-1)]], 0.45); hatch(null, 0.9, 3.4, 0.2); }, 9500 + sg);
      pc(ring(-H - 8, Y(9), 9, 5, 14), '#676d72', null, 9503 + sg);
      c.restore();
    }
    M.rivet(H, 0, 3.4);
    if (o.tient && OBJ_DRAW[o.tient]) { c.save(); c.translate(PINCE_L + 4, 0); c.rotate(o.tientRot || 0.5); c.scale(0.7, 0.7); OBJ_DRAW[o.tient](); c.restore(); }
  }
  // ---------------- registre : grip = point tenu ; p2 = seconde prise ; pts = points nommés ; base = (x,y) de l'accessoire seul
  const OBJ = {
    cle: { draw: drawCle, grip: [0, -66], pts: { bout: [0, -196], panneton: [20, -172], anneau: [0, -28], milieu: [0, -95] }, base: [0, -95] },
    toise: { draw: drawToise, grip: (o) => [0, -(o.prise || 190)], pts: { haut: [0, -720], bas: [0, 0] }, base: [0, 0] },
    journal: { draw: drawJournal, grip: [-6, -16], p2: () => [-62, -16], pts: { centre: [0, -105], haut: [0, -208] }, base: [0, 0] },
    pince: { draw: drawPince, grip: [0, 0], pts: { bout: [PINCE_L + 4, 0], charniere: [70, 0] }, base: [PINCE_L / 2, 0] },
  };
  for (const n of AUT.OBJETS) OBJ[n] = { draw: OBJ_DRAW[n], grip: n === 'piece' || n === 'rondelle' ? [0, 30] : n === 'boucle' ? [-40, 0] : [0, 24], pts: { centre: [0, 0] }, base: [0, 0] };
  AUT.OBJ = OBJ;
  const gripOf = (ob, o) => (typeof ob.grip === 'function' ? ob.grip(o) : ob.grip);
  function heldOpts(name, o, p) { const ob = OBJ[name]; return Object.assign({ t: p.t || 0 }, ob.held || {}, o || {}); }
  function heldDraw(name, o, p) {
    const ob = OBJ[name]; if (!ob) return;
    const oo = heldOpts(name, o, p), g = gripOf(ob, oo), c = cx_();
    c.save(); c.translate(-g[0], -g[1]); ob.draw(oo); c.restore();
  }
  const DOIGTS = [[-13, -9], [9, -11], [12, -4], [12, 6], [6, 11], [-6, 11], [-13, 4]];
  const doigtsPaint = () => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(40,30,30,0.5)', 1); hatch(null, 0.9, 3.4, 0.15); };
  const has = (v) => v && v !== 'rien';
  function heldParts(skin, seed) {
    return {
      objet: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (has(p.tenu)) heldDraw(p.tenu, p.tenuO, p); } },
      doigts: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 2, pts: (p) => (has(p.tenu) ? DOIGTS : OFFP), paint: doigtsPaint },
      objetB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 3, pts: OFFP, extra: (p) => { if (has(p.tenuB)) heldDraw(p.tenuB, p.tenuBO, p); } },
      doigtsB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 4, pts: (p) => (has(p.tenuB) || p._deux ? DOIGTS : OFFP), paint: doigtsPaint },
    };
  }
  AUT.pt = function (r, nom, arriere) {                                        // point nommé de l'objet tenu, à l'écran
    const name = arriere ? r.tenuB : r.tenu, ob = OBJ[name]; if (!ob || !ob.pts[nom]) return null;
    const oo = arriere ? r.tenuBO : r.tenuO, g = gripOf(ob, oo), q = ob.pts[nom];
    let qy = q[1]; if (name === 'toise' && nom === 'haut') qy = -(oo.long || 720);
    return r.w(arriere ? 'objetB' : 'objet', q[0] - g[0], qy - g[1]);
  };

  // =====================================================================
  // POSES HUMAINES — préparation commune
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
  function marcheH(q) {                                                        // pas = phase (tours) ; jambes, bras et petit rebond
    if (q.pas == null) return;
    const ph = q.pas * TAU, s = Math.sin(ph), A = q.ang, f = q.foulee == null ? 1 : q.foulee;
    A.legF = (A.legF || 0) + 0.34 * s * f; A.legB = (A.legB || 0) - 0.34 * s * f;
    A.armB_up = (A.armB_up || 0) + 0.22 * s * f; A.armF_up = (A.armF_up || 0) - 0.22 * s * f * (has(q.tenu) ? 0.3 : 1);
    q.dy = (q.dy || 0) - Math.abs(Math.cos(ph)) * 7 * f;
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
  // atteindre une cible écran (o.cible) avec M.ik, mélangé par pose.atteint (0..1) ; bendSign validé sur la planche
  function atteindre(def, q, x, y, s, dir) {
    const k = ease(clamp(q.atteint || 0)); if (k <= 0 || !q.cible) return;
    const arm = q.bras === 'B' ? 'armB' : 'armF', sol = M.ik(def, q, x, y, s, dir, arm, q.cible, BEND[arm]);
    q.ang[arm + '_up'] = lerp(q.ang[arm + '_up'] || 0, sol.up, k); q.ang[arm + '_lo'] = lerp(q.ang[arm + '_lo'] || 0, sol.lo, k);
  }
  const BEND = { armF: 1, armB: 1 };
  AUT.BEND = BEND;
  function run(def, poseFn, pose, x, y, s, o) {
    o = o || {}; const dir = o.dir || 1;
    const q = poseFn(pose, (qq) => atteindre(def, qq, x, y, s, dir));
    const r = M.puppet(def, q, x, y, s, o);
    r.tenu = q.tenu; r.tenuB = q.tenuB; r.pose = q;
    if (q.tenu && OBJ[q.tenu]) r.tenuO = heldOpts(q.tenu, q.tenuO, q);
    if (q.tenuB && OBJ[q.tenuB]) r.tenuBO = heldOpts(q.tenuB, q.tenuBO, q);
    return r;
  }
  function foreDef(parent, base, skin, back, seed, cuffCol, gant) {
    const hk = (p) => (back ? p.handB : p.handF) || 'fist';
    return { parent, at: [0, LA], pts: (p) => foreR(hk(p)), base, seed, paint: (p) => {
      fillPts([[-20, 76, 1], [20, 76, 1], [24, 130, 1], [-20, 130, 1]], skin); X.handPaint(null, hk(p));
      if (gant) { fillPts([[-18, 34, 1], [18, 34, 1], [18, 80, 1], [-17, 80, 1]], skin); strokePts([[-18, 35], [18, 35]], 'rgba(30,30,35,0.6)', 1.6); strokePts([[-12, 44], [-10, 72]], 'rgba(255,255,255,0.3)', 1.6); hatch([[-20, 76], [20, 76], [24, 130], [-20, 130]], 0.6, 3.4, 0.18); }
      else if (cuffCol) fillPts([[-14, 62, 1], [14, 62, 1], [15, 78, 1], [-14, 78, 1]], cuffCol);
      hatch([[-14, -10], [-3, -10], [-3, 56], [-14, 56]], 0.9, 3.8, 0.22);
    } };
  }
  const upDef = (at, base, seed, paint) => ({ parent: 'torso', at, pts: armR(LA), base, seed, paint: paint || (() => hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.28)) });
  function legDef(at, base, shoe, seed, back, bootTop) {
    return { parent: 'torso', at, pts: X.legPts(back ? 0.98 : 1.0), base, seed, noRivet: !!back, paint: () => {
      fillPts([[-40, bootTop || 214, 1], [60, bootTop || 214, 1], [60, 260, 1], [-40, 260, 1]], shoe);
      if (bootTop) strokePts([[-20, bootTop + 2], [24, bootTop + 2]], 'rgba(255,255,255,0.18)', 2);
      if (!back) { strokePts([[20, 224], [42, 229]], 'rgba(255,255,255,0.25)', 1.3); hatch([[-26, -20], [-6, -20], [-6, 214], [-26, 214]], 0.8, 4, 0.25); }
      else hatch(null, 0.8, 3.6, 0.3);
    } };
  }

  // =====================================================================
  // LE GARDIEN DE ZOO — bonnet de laine rouge brique à pompon, salopette vert sourd sur chemise ocre, bottes, nez rond, trousseau
  // =====================================================================
  const GA = { peau: '#e2b48f', peauD: '#c4946f', nez: '#d98f78', bonnet: '#a1452e', bonnetD: '#7f3420', salop: '#3e5a55', salopD: '#2f4642', chemise: '#c48b3f', chemiseD: '#a17032', botte: '#2a2420', cheveux: '#6a5a4a' };
  const GA_TORSO = [[-14, -176], [8, -180], [18, -168], [30, -150], [42, -112], [52, -64], [55, -20], [46, 18], [-38, 20], [-42, -30], [-42, -110], [-36, -150], [-26, -168]];
  const GA_BONNET = [[-46, 16], [-48, -6], [-42, -28], [-24, -44], [2, -50], [26, -42], [40, -24], [44, -2], [42, 16]];
  function drawTrousseau() {
    pc(ring(0, 0, 9, 5.5, 16), '#b08d45', null, 7701);
    const cols = ['#8e9296', '#b8963e', '#6b625a'];
    [-0.35, 0.05, 0.42].forEach((a, i) => {
      const c = cx_(); c.save(); c.translate(0, 7); c.rotate(a);
      pc(ring(0, 7, 7, 3, 12).concat([[0, 14, 1], [-2.5, 14, 1], [-2.5, 34, 1], [2.5, 38, 1], [8, 38, 1], [8, 33, 1], [5, 33, 1], [5, 29, 1], [2.5, 29, 1], [2.5, 14, 1], [0, 14, 1]]), cols[i], () => hi([[-1, 16], [-1, 34]], 0.4), 7702 + i);
      c.restore();
    });
  }
  function mkGardien() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: GA_TORSO, base: GA.chemise, seed: 7001, paint: () => {
        fillPts([[4, -184], [18, -168], [12, -150], [2, -166]], GA.chemiseD);                              // col
        for (let y = -160; y < 20; y += 16) strokePts([[-44, y], [50, y + 4]], 'rgba(120,80,30,0.25)', 1);  // chemise de flanelle (rayures douces)
        fillPts([[-44, -36, 1], [52, -36, 1], [52, 30, 1], [-44, 30, 1]], GA.salop);                        // bas de salopette
        fillPts([[-6, -118, 1], [40, -118, 1], [46, -36, 1], [-6, -36, 1]], GA.salop);                    // bavette
        fillPts([[-4, -100, 1], [26, -100, 1], [26, -74, 1], [-4, -74, 1]], GA.salopD);                   // poche de bavette
        strokePts([[-4, -100], [26, -100]], 'rgba(20,30,28,0.6)', 1.2);
        ribbonFill([[-2, -116], [-14, -150], [-24, -170]], 12, GA.salopD);                                // bretelle
        for (const [bx, by] of [[0, -112], [36, -112]]) { dot(bx, by, 4.4, '#7a5a26'); dot(bx, by, 3.2, '#c9a24a'); }
        strokePts([[-44, -36], [52, -36]], 'rgba(20,30,28,0.55)', 1.6);
        strokePts([[30, -30], [34, 26]], 'rgba(20,30,28,0.4)', 1.2);
        fillPts([[-36, -30, 1], [-20, -30, 1], [-20, -18, 1], [-36, -18, 1]], '#4a3424');                  // passant de ceinture
        hatch([[-50, -170], [-12, -170], [-10, 30], [-50, 30]], 0.75, 4.2, 0.3);
        shade(44, 0, -42, 0, 0.28);
      } },
      trousseau: { parent: 'torso', at: [-28, -22], noRivet: true, base: '#000', seed: 7020, pts: OFFP, extra: () => drawTrousseau() },
      legB: legDef([-6, -2], GA.salopD, GA.botte, 7002, true, 150),
      legF: legDef([6, -2], GA.salop, GA.botte, 7003, false, 150),
      armB_up: upDef([-10, -146], GA.chemiseD, 7004),
      armB_lo: foreDef('armB_up', GA.chemiseD, GA.peauD, true, 7005, null),
      head: { parent: 'torso', at: [6, -170], pts: X.NAP_HEAD, base: GA.peau, seed: 7006, noRivet: true, paint: (p) => {
        const f = p.face || {};
        fillPts([[-40, -70], [-20, -68], [-16, -52], [-22, -38], [-26, -28], [-42, -30]], GA.cheveux);
        X.earPaint(-8, -44);
        hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.28);
        dot(14, -30, 10, 'rgba(210,110,90,0.3)');
        X.eye(f, 17, -52); X.brow(f, 17, -60, 'rgba(80,55,40,0.95)', 3); X.mouth(f, 27, -24);
      } },
      nez: { parent: 'head', at: [30, -38], noRivet: true, pts: ell(0, 0, 10, 9.5, 14), base: GA.nez, seed: 7007, paint: () => { dot(-2, -3, 3, 'rgba(255,240,230,0.5)'); shade(-8, 0, 8, 6, 0.25, [-12, -12, 12, 12]); } },
      bonnet: { parent: 'head', at: [-2, -80], noRivet: true, pts: GA_BONNET, base: GA.bonnet, seed: 7008, paint: () => {
        for (let x = -42; x <= 40; x += 6) strokePts([[x, 12], [x * 0.8, -44]], 'rgba(60,20,10,0.35)', 1.2);
        fillPts([[-50, -4, 1], [46, -4, 1], [46, 18, 1], [-50, 18, 1]], GA.bonnetD);                        // revers côtelé
        for (let x = -46; x <= 44; x += 5) strokePts([[x, -3], [x, 17]], 'rgba(255,200,180,0.18)', 1);
        hatch(null, 0.5, 3.6, 0.2);
      } },
      pompon: { parent: 'bonnet', at: [-2, -50], noRivet: true, pts: (() => { const o = []; for (let i = 0; i < 18; i++) { const a = i / 18 * TAU, r = 15 + (i % 2 ? 3 : 0); o.push([r * Math.cos(a), -6 + r * Math.sin(a)]); } return o; })(), base: '#b85a3e', seed: 7009, paint: () => hatch(null, 0.4, 2.6, 0.3) },
      armF_up: upDef([-2, -146], GA.chemise, 7010),
      armF_lo: foreDef('armF_up', GA.chemise, GA.peau, false, 7011, GA.chemiseD),
    };
    Object.assign(parts, heldParts(GA.peau, 7030));
    return { nom: 'gardien', hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] },
      order: ['armB_up', 'armB_lo', 'objetB', 'legB', 'legF', 'head', 'nez', 'bonnet', 'pompon', 'torso', 'trousseau', 'armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsB'] };
  }
  function ribbonFill(line, w, col) { fillPts(ribbon(line, w, w), col); }
  CH.autGardien = mkGardien();
  AUT.gardienPose = function (p, atteindreFn) {
    const q = prep(p), A = q.ang;
    marcheH(q);
    A.trousseau = (A.trousseau || 0) + (q.pas != null ? 0.3 * Math.sin(q.pas * TAU * 2) : 0.05 * Math.sin((q.t || 0) * 2.3));
    const lv = ease(clamp(q.leve || 0)), li = ease(clamp(q.lire || 0));
    const pr = ease(clamp(q.presente == null ? (q.tenu === 'toise' && !lv && !li ? 1 : 0) : q.presente));
    if (pr > 0) armTo(q, 'armF', [104, -46], 'bas', pr);
    if (lv > 0) { blend(q, 'armF_up', -2.35, lv); blend(q, 'armF_lo', -0.35, lv); A.head = (A.head || 0) - 0.25 * lv; }
    if (li > 0) { armTo(q, 'armF', [96, -112], 'bas', li); A.head = (A.head || 0) + 0.06 * li; if (q.tenu === 'journal' && q.deuxMains == null) q.deuxMains = li > 0.5; }
    if (atteindreFn) atteindreFn(q);
    return finish(q);
  };
  AUT.gardien = (pose, x, y, s, o) => run(CH.autGardien, AUT.gardienPose, pose, x, y, s == null ? 0.9 : s, o);

  // =====================================================================
  // LE CHERCHEUR P. DEKEYSER — crâne dégarni, couronne grise, pince-nez, veste de tweed brun-roux, nœud papillon rouge sombre,
  // tablier de cuir sombre jusqu'aux genoux, gants de caoutchouc gris
  // =====================================================================
  const CR = { peau: '#e6c3a3', peauD: '#c9a283', tweed: '#9a5c33', tweedD: '#7a4526', tablier: '#30363b', tablierL: '#4a535a', noeud: '#7a2026', chemise: '#ebe5d6', gant: '#8d9297', gantD: '#71767c', cheveux: '#bdb9b1', pant: '#5a5a5c', chaus: '#231c1a' };
  const CR_TORSO = [[-14, -176], [8, -180], [16, -168], [26, -150], [33, -112], [35, -60], [36, 0], [42, 60], [48, 150, 1], [-10, 150, 1], [-10, 40], [-36, 30], [-38, -20], [-38, -110], [-33, -150], [-26, -168]];
  const CR_HEAD = [[-14, 16], [10, 16], [11, 2], [16, -6], [23, -10], [26, -16], [25, -21], [27, -25], [26, -29], [30, -33], [41, -40, 1], [32, -47], [28, -58], [29, -70], [26, -86], [14, -98], [-6, -104], [-24, -97], [-34, -80], [-32, -50], [-24, -28], [-17, -8]];
  function mkChercheur() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: CR_TORSO, base: CR.tweed, seed: 7101, paint: () => {
        for (let y = -176; y < 40; y += 14) fillPts([[-40, y, 1], [40, y + 2, 1], [40, y + 5, 1], [-40, y + 3, 1]], 'rgba(60,30,15,0.22)');   // tweed à carreaux
        for (let x = -38; x < 40; x += 14) fillPts([[x, -176, 1], [x + 3, -176, 1], [x + 5, 40, 1], [x + 2, 40, 1]], 'rgba(230,180,120,0.2)');
        fillPts([[4, -184], [16, -170], [12, -150], [2, -166]], CR.chemise);
        fillPts([[16, -176], [28, -148], [30, -118], [20, -110], [14, -140]], CR.tweedD);                          // revers
        fillPts([[2, -122, 1], [44, -122, 1], [46, 0], [48, 150, 1], [-10, 150, 1], [-8, 40], [-4, -40]], CR.tablier); // tablier de cuir
        strokePts([[4, -120], [10, -150], [8, -172]], CR.tablier, 4);                                              // lanière au cou
        strokePts([[-4, -40], [-36, -32]], CR.tablier, 4);                                                         // lien de taille
        strokePts([[6, -116], [42, -116]], 'rgba(255,255,255,0.18)', 1.6);
        for (let k = 0; k < 6; k++) strokePts([[8 + k * 6, -100 + hash(k) * 40], [12 + k * 6, 100 - hash(k + 3) * 30]], 'rgba(255,230,210,0.07)', 3);
        fillPts([[8, -172], [14, -176], [16, -170], [24, -176], [26, -164], [16, -166], [10, -162]], CR.noeud);    // nœud papillon
        dot(16, -169, 2.6, '#5a141a');
        hatch([[-50, -170], [-8, -170], [-8, 150], [-50, 150]], 0.75, 4.2, 0.3);
        shade(44, 0, -40, 0, 0.26);
      } },
      legB: legDef([-6, -2], '#3e3936', CR.chaus, 7102, true),
      legF: legDef([6, -2], CR.pant, CR.chaus, 7103, false),
      armB_up: upDef([-10, -146], CR.tweedD, 7104),
      armB_lo: foreDef('armB_up', CR.tweedD, CR.gantD, true, 7105, null, true),
      head: { parent: 'torso', at: [6, -170], pts: CR_HEAD, base: CR.peau, seed: 7106, noRivet: true, paint: (p) => {
        const f = p.face || {};
        fillPts([[-38, -86], [-22, -80], [-12, -72], [-4, -66], [-6, -58], [-16, -56], [-20, -40], [-24, -28], [-40, -30]], CR.cheveux, 3);  // couronne grise
        for (let k = 0; k < 5; k++) strokePts([[-36 + k * 3, -80 + k * 9], [-24 + k * 4, -74 + k * 9]], 'rgba(120,115,105,0.6)', 1);
        strokePts([[-14, -98], [6, -102], [20, -94]], 'rgba(255,250,240,0.6)', 2.2);                                 // reflet du crâne
        X.earPaint(-8, -44);
        hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.26);
        dot(16, -30, 8, 'rgba(205,130,110,0.2)');
        X.eye(f, 17, -52); X.brow(f, 17, -61, 'rgba(150,145,135,1)', 4); X.mouth(f, 27, -24);
        const rg = ell(22, -50, 7.5, 7.5, 14);                                                                       // pince-nez
        fillPts(rg, 'rgba(200,228,238,0.3)', 0, 0); strokePts(rg.concat([rg[0]]), '#2b2622', 1.6); strokePts([[29, -50], [33, -46]], '#2b2622', 1.6);
        strokePts([[18, -55], [22, -57]], 'rgba(255,255,255,0.8)', 1.2);
      }, extra: () => strokePts([[18, -43], [10, -24], [4, 0], [6, 12]], 'rgba(30,26,22,0.8)', 1.1) },
      armF_up: upDef([-2, -146], CR.tweed, 7107),
      armF_lo: foreDef('armF_up', CR.tweed, CR.gant, false, 7108, null, true),
    };
    Object.assign(parts, heldParts(CR.gant, 7120));
    return { nom: 'chercheur', hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] },
      order: ['armB_up', 'armB_lo', 'objetB', 'legB', 'legF', 'head', 'torso', 'armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsB'] };
  }
  CH.autChercheur = mkChercheur();
  AUT.chercheurPose = function (p, atteindreFn) {
    const q = prep(p), A = q.ang;
    marcheH(q);
    const pl = ease(clamp(q.plonge || 0)), br = ease(clamp(q.brandir || 0));
    if (pl > 0) { armTo(q, 'armF', [104, -150], 'bas', pl); A.objet = (A.objet || 0) + 1.0 * pl; q.tilt = (q.tilt || 0) + 0.06 * pl; A.head = (A.head || 0) + 0.2 * pl; }
    if (br > 0) { blend(q, 'armF_up', -2.05, br); blend(q, 'armF_lo', -0.8, br); A.head = (A.head || 0) - 0.12 * br; }
    if (atteindreFn) atteindreFn(q);
    return finish(q);
  };
  AUT.chercheur = (pose, x, y, s, o) => run(CH.autChercheur, AUT.chercheurPose, Object.assign({ tenu: 'pince' }, pose), x, y, s == null ? 0.9 : s, o);

  // =====================================================================
  // L'AUTRUCHE — profil, corps noir, ailes et queue blanches, cou long rose-gris en 3 segments (bosse d'avalement), pattes articulées
  // =====================================================================
  const AU = { plume: '#2b2725', plumeL: '#4c4541', blanc: '#ebe5d6', blancD: '#cdc4b1', cou: '#c7a6a0', couD: '#a3847f', couL: '#dcc2bb', patte: '#cf9a8c', patteD: '#a97467', bec: '#d8b68c', becD: '#a7855e' };
  const AU_HS = 1.3, HS = (pts) => pts.map((q) => (q[2] ? [q[0] * AU_HS, q[1] * AU_HS, 1] : [q[0] * AU_HS, q[1] * AU_HS]));
  const AU_L = 94, COU_W = [[32, 24], [24, 19], [19, 15]];
  const LEG = { up: 130, lo: 150, r1: 0.4, r2: -0.8, at: 10 };
  const AU_H = LEG.at + LEG.up * Math.cos(LEG.r1) + LEG.lo * Math.cos(LEG.r1 + LEG.r2) + 8;
  const AU_BODY = (() => { const o = []; for (let i = 0; i < 30; i++) { const a = i / 30 * TAU; let x = 122 * Math.cos(a), y = -34 + 66 * Math.sin(a); if (x > 0) y -= 0.12 * x * (1 - Math.sin(a)) * 0.5; else y -= 0.1 * (-x) * (1 - Math.sin(a)) * 0.4; o.push([x, y]); } return o; })();
  const AU_QUEUE = (() => { const o = [[0, -14], [6, 14]]; for (let k = 0; k < 5; k++) { const a = PI * 0.78 + k * 0.17; o.push([88 * Math.cos(a) - 4, 14 + 88 * Math.sin(a) * 0.9]); o.push([70 * Math.cos(a + 0.085) - 4, 14 + 70 * Math.sin(a + 0.085) * 0.9]); } o.push([-14, -18]); return o; })();
  const AU_AILE = [[10, -10], [14, 6], [0, 20], [-20, 30], [-46, 38], [-62, 36], [-78, 46], [-96, 40], [-86, 28], [-100, 22], [-84, 10], [-60, 2], [-30, -8]];
  function couPts(i) {
    return (p) => {
      const a = clamp(p.avale || 0), env = smooth(0, 0.07, a) * (1 - smooth(0.93, 1, a)), sc = lerp(3 * AU_L - 10, 8, a);
      const bulge = (v) => 15 * env * Math.exp(-Math.pow(i * AU_L + v - sc, 2) / (2 * 12 * 12));
      const [w0, w1] = COU_W[i], N = 12, R = [], Lf = [];
      for (let j = 0; j <= N; j++) { const v = (AU_L + 4) * j / N, hw = lerp(w0, w1, j / N) / 2, b = bulge(v); R.push([hw + b, -v]); Lf.push([-hw - b * 0.7, -v]); }
      const xr = R[0][0], xl = Lf[0][0], cxm = (xr + xl) / 2, rr = (xr - xl) / 2;
      return R.concat(Lf.reverse(), ep(cxm, 0, rr, rr, 10, PI, 0).slice(1, 10));
    };
  }
  const couPaint = (i) => (p) => {
    strokePts([[COU_W[i][0] * 0.25, 0], [COU_W[i][1] * 0.25, -AU_L]], 'rgba(255,240,235,0.35)', 2);
    hatch([[-20, 10], [-4, 10], [-3, -AU_L - 6], [-20, -AU_L - 6]], 1.2, 3.6, 0.22);
    for (let k = 0; k < 5; k++) dot(-4 + hash(k + i * 7) * 10, -10 - k * 17, 1.2, 'rgba(90,60,55,0.35)');
    const a = clamp(p.avale || 0), sc = lerp(3 * AU_L - 10, 8, a), v = sc - i * AU_L;
    if (a > 0 && a < 1 && v > -20 && v < AU_L + 20) shade(-14, -v, 14, -v, 0.25, [-30, -v - 18, 30, -v + 18]);
  };
  function eyePaint(p) {
    const e = p._oeil || { lid: 0, rx: 0, ry: 0 }, ex = 6, ey = -22, R = 11;
    fillPts(ell(ex, ey, R, R, 18), '#f3ecdc', 0, 0);
    const px = ex + e.rx * 4, py = ey + e.ry * 4;
    fillPts(ell(px, py, 7, 7, 14), '#5b3a1e', 0, 0); fillPts(ell(px, py, 4, 4, 12), '#120c08', 0, 0); dot(px + 2, py - 2.5, 1.8, 'rgba(255,255,255,0.95)');
    const lid = clamp(e.lid);
    if (lid > 0.01) {                                                          // paupière (ligne droite pour 'fière', courbe sinon)
      const yb = ey - R + 2 * R * lid, tl = e.lidTilt || 0, yl = (x) => yb + tl * (x - ex) / R;
      fillPts(ell(ex, ey, R + 0.8, R + 0.8, 24).map(([x, y]) => [x, Math.min(y, yl(x))]), AU.couD, 0, 0);
      const hw = Math.sqrt(Math.max(0, R * R - (yb - ey) * (yb - ey))); if (hw > 1) strokePts([[ex - hw, yl(ex - hw)], [ex + hw, yl(ex + hw)]], '#3a2420', 1.6);
    }
    strokePts(ep(ex, ey, R, R, 10, PI * 1.05, PI * 1.95), '#3a2420', 1.5);
    const yl = ey - R + 2 * R * lid;                                          // cils
    for (let k = 0; k < 4; k++) { const x0 = ex - 6 + k * 4.5; strokePts([[x0, Math.max(yl, ey - R + 1)], [x0 + 3 + k, Math.max(yl, ey - R + 1) - 7 + k * 0.5]], '#24160f', 1.4); }
  }
  function mkAutruche() {
    const legParts = (F) => {
      const sfx = F ? 'F' : 'B', col = F ? AU.patte : AU.patteD, sd = F ? 0 : 10;
      return {
        ['leg' + sfx]: { parent: 'torso', at: [F ? 14 : -10, LEG.at], rest: LEG.r1, base: col, seed: 7301 + sd,
          pts: ep(0, 0, 25, 25, 10, PI, TAU).concat([[26, 20], [18, 60], [10, LEG.up - 6], [-10, LEG.up - 6], [-20, 60], [-26, 20]]),
          paint: () => { strokePts([[8, 10], [5, LEG.up - 10]], 'rgba(255,235,225,0.35)', 2); hatch([[-30, 0], [-6, 0], [-6, LEG.up], [-30, LEG.up]], 0.9, 3.6, 0.26); } },
        ['leg' + sfx + '_lo']: { parent: 'leg' + sfx, at: [0, LEG.up], rest: LEG.r2, base: col, seed: 7302 + sd,
          pts: ep(0, 0, 11, 11, 10, PI, TAU).concat([[9, 30], [7, LEG.lo - 4], [-7, LEG.lo - 4], [-9, 30]]),
          paint: () => { for (let y = 20; y < LEG.lo; y += 9) strokePts([[-7, y], [7, y + 1]], 'rgba(110,60,50,0.4)', 1); hatch(null, 0.9, 3.6, 0.2); } },
        ['pied' + sfx]: { parent: 'leg' + sfx + '_lo', at: [0, LEG.lo], noRivet: true, base: col, seed: 7303 + sd,
          pts: [[-9, -6], [6, -5], [30, 0], [50, 2], [56, 8, 1], [30, 9], [18, 7], [10, 9], [-10, 8]],
          paint: () => { fillPts([[48, 1], [58, 6], [56, 9], [48, 8]], '#4a3a30'); strokePts([[10, 3], [30, 5]], 'rgba(110,60,50,0.5)', 1); fillPts([[24, 2], [32, 5], [24, 8]], 'rgba(110,60,50,0.35)'); } },
      };
    };
    const aile = (F) => ({ parent: 'torso', at: F ? [36, -66] : [20, -78], noRivet: !F, base: F ? AU.blanc : AU.blancD, seed: F ? 7311 : 7312, pts: AU_AILE, paint: () => {
      for (let k = 0; k < 5; k++) strokePts([[0, 0], [-40 - k * 12, 12 + k * 6]], 'rgba(120,110,90,0.4)', 1.1);
      hatch(null, 0.4, 3.6, 0.16); shade(0, -10, -60, 40, 0.18, [-104, -14, 18, 50]);
    } });
    const parts = Object.assign({
      torso: { parent: null, at: [0, 0], pts: AU_BODY, base: AU.plume, seed: 7300, paint: (p) => {
        for (let r = 0; r < 6; r++) for (let k = 0; k < 9; k++) {                       // écailles de plumes
          const x = -100 + k * 25 + (r % 2) * 12, y = -88 + r * 20; strokePts(ep(x, y, 11, 8, 6, 0.2, PI - 0.2), 'rgba(140,128,118,0.45)', 1.2);
        }
        hatch(null, 0.7, 4, 0.28, 1, '220,210,200'); shade(0, -100, 0, 30, 0.35, [-130, -110, 130, 40]);
        strokePts(ep(0, -34, 110, 56, 14, PI * 1.15, PI * 1.85), 'rgba(255,255,255,0.18)', 3);
        const v = clamp(p.ventre || 0);
        if (v > 0) {                                                                    // ventre translucide : on voit ce qu'il y a dedans
          const c = cx_(), cxv = 20, cyv = -18;
          fillPts(ell(cxv, cyv, 74, 42, 22), `rgba(236,214,200,${0.88 * v})`, 0, 0);
          fillPts(ell(cxv, cyv + 4, 60, 32, 18), `rgba(214,170,160,${0.6 * v})`, 0, 0);
          c.save(); c.globalAlpha = v; const obj = p.ventreObj || 'cle';
          if (obj === 'cle' || obj === 'tout') { c.save(); c.translate(cxv + 2, cyv + 2); c.rotate(-1.5); c.scale(0.62, 0.62); c.translate(0, 95); drawCle({ t: p.t || 0, lueur: p.ventreLueur || 0 }); c.restore(); }
          if (obj === 'objets' || obj === 'tout') { c.save(); c.translate(cxv + (obj === 'tout' ? -30 : 0), cyv + 6); c.scale(0.32, 0.32); drawTas({ objets: 6 }, 40); c.restore(); }
          c.restore();
          strokePts(ell(cxv, cyv, 74, 42, 22).concat([[cxv + 74, cyv]]), `rgba(255,250,240,${0.7 * v})`, 2);
          hatch(ell(cxv, cyv, 74, 42, 22), 0.7, 5, 0.12 * v, 1, '255,255,255');
        }
      } },
      queue: { parent: 'torso', at: [-110, -62], noRivet: true, base: AU.blanc, seed: 7320, pts: AU_QUEUE, paint: () => { for (let k = 0; k < 5; k++) { const a = PI * 0.82 + k * 0.17; strokePts([[-4, 12], [-4 + 78 * Math.cos(a), 14 + 78 * Math.sin(a) * 0.9]], 'rgba(120,110,90,0.45)', 1.1); } hatch(null, 0.6, 3.4, 0.18); shade(0, 0, -60, 30, 0.2, [-80, -30, 10, 60]); } },
      aileB: aile(false), aile: aile(true),
      cou1: { parent: 'torso', at: [84, -76], rest: 0.12, base: AU.cou, seed: 7331, pts: couPts(0), paint: couPaint(0) },
      cou2: { parent: 'cou1', at: [0, -AU_L], rest: -0.06, base: AU.cou, seed: 7332, pts: couPts(1), paint: couPaint(1) },
      cou3: { parent: 'cou2', at: [0, -AU_L], rest: -0.08, base: AU.cou, seed: 7333, pts: couPts(2), paint: couPaint(2) },
      head: { parent: 'cou3', at: [0, -AU_L], rest: 0.02, base: AU.couL, seed: 7334,
        pts: HS([[66, -12, 1], [52, -20], [32, -26], [24, -34], [12, -44], [-6, -44], [-20, -34], [-24, -18], [-16, -2], [-8, 8], [8, 8], [20, 0], [26, -6], [60, -7]]),
        paint: (p) => { const c = cx_(); c.save(); c.scale(AU_HS, AU_HS);
          fillPts([[24, -27], [52, -20], [66, -12, 1], [60, -7], [26, -6]], AU.bec); strokePts([[26, -8], [62, -9]], AU.becD, 1.4);
          dot(40, -18, 1.6, AU.becD);                                                         // narine
          for (let k = 0; k < 7; k++) strokePts([[-14 + k * 4, -40 + Math.abs(k - 3)], [-17 + k * 4, -50 + Math.abs(k - 3) * 2]], 'rgba(90,80,75,0.65)', 1.3);  // duvet du crâne
          if (p._oeil && p._oeil.rouge > 0) dot(14, -6, 9, `rgba(214,96,90,${0.45 * p._oeil.rouge})`);
          eyePaint(p);
          if (p._oeil && p._oeil.sourire) strokePts([[24, -6], [20, -2], [15, -1]], AU.becD, 1.4);
          hatch([[-24, -10], [10, -10], [10, 10], [-24, 10]], 0.6, 3.4, 0.2); c.restore();
        } },
      bec: { parent: 'head', at: [24 * AU_HS, -7 * AU_HS], noRivet: true, base: AU.becD, seed: 7335, pts: HS([[0, -1], [36, 0], [41, 2, 1], [32, 6], [6, 7], [-4, 4]]), paint: () => strokePts([[4, 1], [44, 2]], 'rgba(255,240,210,0.4)', 1.2) },
    }, legParts(false), legParts(true));
    return { nom: 'autruche', hipY: -AU_H, parts, handLen: 0, rod: { part: 'torso', at: [-16, 24] },
      order: ['queue', 'legB', 'legB_lo', 'piedB', 'aileB', 'torso', 'legF', 'legF_lo', 'piedF', 'aile', 'cou1', 'cou2', 'cou3', 'bec', 'head'] };
  }
  CH.autAutruche = mkAutruche();
  const EXPR = {
    innocente: { lid: 0.06, rx: 0.3, ry: -0.55, rouge: 0, sourire: true },
    genee: { lid: 0.42, rx: -0.6, ry: 0.5, rouge: 1, sourire: false, head: 0.28, rentre: 0.45, aile: -0.15 },
    fiere: { lid: 0.48, rx: 0.5, ry: -0.1, rouge: 0, sourire: true, head: -0.32, etire: 1, lidTilt: 2 },
    siffle: { lid: 0.18, rx: -0.5, ry: -0.6, rouge: 0, sourire: false, bec: 0.12, head: -0.08 },
  };
  AUT.EXPR = Object.keys(EXPR);
  AUT.autruchePose = function (p) {
    const q = prep(p), A = q.ang, e = Object.assign({}, EXPR[q.expr || 'innocente'] || EXPR.innocente);
    if (q.regard) { e.rx = q.regard[0]; e.ry = q.regard[1]; }
    if (q.cligne) e.lid = lerp(e.lid, 1, clamp(q.cligne));
    q._oeil = e;
    const pic = ease(clamp(q.picore || 0)), ren = ease(clamp(q.rentre == null ? (e.rentre || 0) : q.rentre)), eti = ease(clamp(q.etire == null ? (e.etire || 0) : q.etire));
    A.head = (A.head || 0) + (e.head || 0) * (1 - pic);
    A.cou1 = (A.cou1 || 0) + 1.7 * pic - 0.25 * ren - 0.1 * eti; A.cou2 = (A.cou2 || 0) + 0.6 * pic + 0.7 * ren + 0.06 * eti; A.cou3 = (A.cou3 || 0) + 0.3 * pic - 0.75 * ren + 0.06 * eti;
    A.head = (A.head || 0) - 1.3 * pic + 0.3 * ren;
    if (pic > 0) q.tilt = (q.tilt || 0) + 0.25 * pic;
    if (eti > 0) { q.tilt = (q.tilt || 0) - 0.04 * eti; }
    A.bec = (A.bec || 0) + 0.5 * clamp(q.bec == null ? (e.bec || 0) : q.bec);
    A.aile = (A.aile || 0) + (e.aile || 0) + 0.55 * clamp(q.ventre || 0) + 0.9 * clamp(q.ailes || 0) + (q.bat != null ? 0.35 * Math.sin(q.bat * TAU) : 0);
    A.aileB = (A.aileB || 0) + 0.9 * clamp(q.ailes || 0) + (q.bat != null ? 0.35 * Math.sin(q.bat * TAU + 0.6) : 0);
    A.queue = (A.queue || 0) + 0.06 * Math.sin((q.t || 0) * 1.7);
    // pattes : pas = phase (tours) ; la patte la plus basse reste au sol
    let uF = A.legF || 0, lF = A.legF_lo || 0, uB = A.legB || 0, lB = A.legB_lo || 0, liftF = 0, liftB = 0;
    if (q.pas != null) {
      const f = q.foulee == null ? 1 : q.foulee, ph = q.pas * TAU;
      const g = (phi) => [-0.3 * Math.sin(phi) * f, -0.6 * Math.max(0, Math.cos(phi)) * f];
      const a = g(ph), b = g(ph + PI); uF += a[0]; lF += a[1]; uB += b[0]; lB += b[1]; liftF = -a[1]; liftB = -b[1];
      A.cou1 = (A.cou1 || 0) + 0.05 * Math.sin(2 * ph);
    }
    A.legF = uF; A.legF_lo = lF; A.legB = uB; A.legB_lo = lB;
    const tl = q.tilt || 0;
    A.piedF = -(tl + LEG.r1 + uF + LEG.r2 + lF) + 0.7 * liftF; A.piedB = -(tl + LEG.r1 + uB + LEG.r2 + lB) + 0.7 * liftB;
    if (q.sol !== false) {
      const fy = (u, l) => LEG.at + LEG.up * Math.cos(LEG.r1 + u) + LEG.lo * Math.cos(LEG.r1 + u + LEG.r2 + l) + 8;
      q.dy = (q.dy || 0) + (AU_H - Math.max(fy(uF, lF), fy(uB, lB)));
    }
    return q;
  };
  AUT.autruche = (pose, x, y, s, o) => M.puppet(CH.autAutruche, AUT.autruchePose(pose), x, y, s == null ? 1 : s, o || {});

  // =====================================================================
  // ACCESSOIRES SEULS — M.puppet à une pièce invisible (ombre portée possible), sans tige
  // =====================================================================
  const accDefs = {};
  function acc(name, x, y, s, o, sDef, drawFn) {
    o = o || {}; s = s == null ? (sDef || 0.9) : s;
    const ob = OBJ[name] || { base: [0, 0] };
    const def = accDefs[name] || (accDefs[name] = { hipY: 0, handLen: 0, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1,
      extra: (p) => { const c = cx_(); c.save(); c.translate(-ob.base[0], -ob.base[1]); (drawFn || ob.draw)(p.o); c.restore(); } } }, order: ['o'] });
    return M.puppet(def, { o, tilt: o.rot || 0 }, x, y, s, { dir: o.dir || 1, rod: false, slot: o.slot != null ? o.slot : y + 6 * s, floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
  }
  AUT.cle = (x, y, s, o) => acc('cle', x, y, s, o);
  AUT.toise = (x, y, s, o) => acc('toise', x, y, s, o);
  AUT.journal = (x, y, s, o) => acc('journal', x, y, s, o);
  AUT.pince = (x, y, s, o) => acc('pince', x, y, s, o);
  AUT.obj = (nom, x, y, s, o) => acc(nom, x, y, s, o);
  AUT.tas = (x, y, s, o) => acc('_tas', x, y, s, o, 0.9, (oo) => drawTas(oo, 0));
  // ---------------- cuve de faïence blanche ébréchée ; (x,y) = bas du pied ; bord à y local −160
  AUT.CUVE = { h: 172, bord: -160, rx: 164 };
  function drawCuve(o) {
    const c = cx_(), B = AUT.CUVE.bord, rx = AUT.CUVE.rx;
    pc([[-80, 0, 1], [80, 0, 1], [74, -16, 1], [-74, -16, 1]], '#d9d3c4', () => hatch(null, 0.3, 4, 0.15), 9601);
    const body = ep(0, B, rx, 20, 14, PI, TAU).concat([[rx + 6, B + 8], [rx - 4, B + 30], [140, B + 80], [96, -14], [-96, -14], [-140, B + 80], [-rx + 4, B + 30], [-rx - 6, B + 8]]);
    pc(body, '#efeae0', () => {
      strokePts([[-rx + 4, B + 26], [-120, B + 30], [0, B + 36], [120, B + 30], [rx - 4, B + 26]], '#3d5a7a', 3);       // filet bleu
      strokePts([[-rx + 14, B + 38], [0, B + 46], [rx - 14, B + 38]], '#3d5a7a', 1.2);
      shade(-150, 0, 150, 0, 0.3, [-rx - 10, B - 30, rx + 10, 0]);
      strokePts([[-110, B + 50], [-80, -30]], 'rgba(255,255,255,0.8)', 4);
      for (let k = 0; k < 6; k++) strokePts([[-60 + k * 30, B + 60 + hash(k) * 30], [-50 + k * 30 + hash(k + 2) * 12, B + 90 + hash(k + 4) * 40]], 'rgba(120,110,100,0.25)', 1);   // craquelures
      fillPts([[52, B - 8], [80, B - 4], [74, B + 16], [60, B + 8]], '#c9a982');                                    // éclats : biscuit à nu
      fillPts([[-132, B], [-108, B + 6], [-116, B + 22]], '#c9a982'); fillPts([[100, B + 2], [116, B + 4], [110, B + 14]], '#c9a982');
    }, 9602);
    // ouverture : intérieur sombre (le contenu reste caché)
    pc(ell(0, B, rx - 12, 15, 24), '#6e665c', () => { const g = c.createLinearGradient(0, B - 15, 0, B + 15); g.addColorStop(0, 'rgba(30,25,20,0.8)'); g.addColorStop(1, 'rgba(160,150,135,0.5)'); if (!SIL()) { c.fillStyle = g; c.fillRect(-rx, B - 16, 2 * rx, 32); } }, 9603, { drop: false });
    const v = clamp(o.vapeur || 0), t = o.t || 0;
    if (v > 0 && !SIL()) {
      c.save(); c.lineCap = 'round';
      for (let i = 0; i < 5; i++) { const u = ((t * 0.4 + i * 0.2) % 1); c.strokeStyle = `rgba(240,236,228,${0.4 * v * (1 - u)})`; c.lineWidth = 10 * (1 - u * 0.4); c.beginPath();
        for (let j = 0; j <= 8; j++) { const w = j / 8; c.lineTo(-80 + i * 40 + Math.sin(w * 4 + t * 2 + i) * 10, B - 10 - u * 140 - w * 80); } c.stroke(); }
      c.restore();
    }
  }
  AUT.cuve = (x, y, s, o) => acc('_cuve', x, y, s, o, 0.9, drawCuve);
  // ---------------- plateau d'étain : (x,y) = bas ; o.objets = nombre (dans l'ordre AUT.OBJETS) ou liste de noms, empilés
  AUT.PLATEAU = { rx: 176, dessus: -22 };
  function drawPlateau(o) {
    const rx = AUT.PLATEAU.rx;
    pc(ep(0, -14, rx, 18, 16, 0, PI).concat(ep(0, -24, rx + 6, 20, 16, PI, TAU)), '#8f938f', () => {
      fillPts(ell(0, -24, rx - 12, 14, 24), '#a9ada8'); strokePts(ell(0, -24, rx - 12, 14, 24).concat([[rx - 12, -24]]), 'rgba(50,55,50,0.6)', 1.3);
      strokePts([[-rx + 20, -30], [-40, -36]], 'rgba(255,255,255,0.6)', 2); hatch(null, 0.2, 4, 0.18); shade(-rx, 0, rx, 0, 0.25, [-rx - 8, -48, rx + 8, 6]);
    }, 9701);
    drawTas(o, -22);
  }
  AUT.plateau = (x, y, s, o) => acc('_plateau', x, y, s, o, 0.9, drawPlateau);
  AUT.plateauPt = function (k, x, y, s, dir, surSol) {                          // [X, Y, rot] écran de la place k (0..5) sur le plateau (ou du tas si surSol)
    s = s == null ? 0.9 : s; dir = dir || 1; const q = TAS[k % 6];
    return [x + q[0] * s * dir, y + (q[1] + (surSol ? 0 : -22)) * s, q[2] * dir];
  };

  // =====================================================================
  // DÉCORS — AUT.init() pré-rend AUT.K ; AUT.enclos(t, o) et AUT.labo(t, o) les posent
  // =====================================================================
  AUT.PORTE = { x: 250, w: 300, h: 476, serrure: [74, -228], trou: [74, -214] };   // serrure / trou de serrure : relatifs au bas-centre de la porte (échelle 1)
  AUT.ARBRE = { x: 880 };
  AUT.TABLE = { cx: 540, top: ST.back - 200, x0: 260, x1: 820 };
  AUT.LAMPE = { x: 560, y: 470 };
  function toile(x, H) {
    x.globalCompositeOperation = 'multiply'; x.globalAlpha = 0.55; x.fillStyle = M.tex.canvasPat; x.fillRect(0, 0, M.W, H);
    x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
  }
  function makeCiel() {
    return M.pre(M.W, ST.back + 5, (x) => {
      const H = ST.back + 5, g = x.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#b9cbd0'); g.addColorStop(0.55, '#dde0d2'); g.addColorStop(1, '#ead9b4'); x.fillStyle = g; x.fillRect(0, 0, M.W, H);
      for (const [cx, cy, s] of [[230, 380, 1], [760, 300, 1.2], [560, 560, 0.7]]) {                  // nuages pâles peints
        x.fillStyle = 'rgba(250,247,238,0.75)'; x.beginPath();
        for (const [dx, dy, r] of [[-60, 10, 40], [-15, -12, 55], [40, 0, 46], [85, 14, 30]]) { x.moveTo(cx + (dx + r) * s, cy + dy * s); x.arc(cx + dx * s, cy + dy * s, r * s, 0, TAU); }
        x.fill(); x.fillStyle = 'rgba(160,170,180,0.18)'; x.fillRect(cx - 100 * s, cy + 30 * s, 210 * s, 10 * s);
      }
      x.fillStyle = '#c9c4a0'; x.beginPath(); x.moveTo(0, 1150);                                     // collines lointaines du zoo
      for (let k = 0; k <= 20; k++) x.lineTo(k * 54, 1110 - 40 * Math.sin(k * 0.7) - 25 * Math.sin(k * 1.9)); x.lineTo(M.W, H); x.lineTo(0, H); x.fill();
      x.fillStyle = '#aeb38e';
      for (let k = 0; k < 14; k++) { const tx = 40 + k * 78 + hash(k) * 30, ty = 1120 - 30 * Math.sin(k * 0.9); x.beginPath(); x.ellipse(tx, ty, 34 + hash(k + 5) * 20, 22, 0, 0, TAU); x.fill(); }
      x.fillStyle = '#d4c191'; x.fillRect(0, 1190, M.W, H - 1190);
      toile(x, H);
    });
  }
  function makeArbre() {
    const cv = M.cutFlat(460, 880, 230, 870, () => {
      pc([[-14, 0, 1], [16, 0, 1], [12, -200], [20, -420], [6, -560], [-4, -560], [6, -420], [-6, -200]], '#6b5236', () => hatch(null, 1.4, 4, 0.3), 9801);
      for (const [a, b, w] of [[[4, -420], [-150, -620], 9], [[8, -470], [160, -640], 8], [[2, -540], [-40, -700], 7], [[6, -520], [90, -720], 6]]) pc(ribbon([a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 20], b], w * 1.4, w * 0.5), '#6b5236', null, 9802 + w);
      for (const [cx, cy, rx] of [[-150, -640, 90], [160, -660, 100], [-30, -720, 80], [90, -740, 80]]) pc(ep(cx, cy, rx, 22, 14, PI, TAU).concat(ep(cx, cy, rx, 12, 10, 0, PI)), '#7f8657', () => { hatch(null, 0.2, 3.4, 0.25); for (let k = 0; k < 8; k++) dot(cx - rx + 10 + k * rx / 4, cy - 6 + hash(k + cx) * 10, 3, 'rgba(60,70,40,0.4)'); }, 9810 + cx);
    });
    cv.padB = 10; return M.withShadow(cv, 8);
  }
  function makeCloture() {
    const cv = M.cutFlat(M.W, 420, M.W / 2, 410, (x) => {
      for (let k = 0; k < 13; k++) {                                         // piquets
        const px = -520 + k * 88 + (hash(k) - 0.5) * 10, h = 330 + hash(k + 4) * 24;
        pc([[px - 10, 0, 1], [px + 10, 0, 1], [px + 9, -h + 10], [px, -h, 1], [px - 9, -h + 10]], k % 2 ? '#8a6a46' : '#7c5f3e', () => { strokePts([[px - 4, -10], [px - 3, -h + 14]], 'rgba(255,230,190,0.25)', 1.5); hatch(null, 1.5, 3.6, 0.25); }, 9900 + k);
      }
      x.save(); x.strokeStyle = 'rgba(60,60,58,0.9)'; x.lineWidth = 1.6;            // trois rangs de fil
      for (const y of [-90, -180, -270]) { x.beginPath(); for (let k = 0; k <= 24; k++) { const xx = -540 + k * 45; x.lineTo(xx, y + Math.sin(k * 1.3) * 2 + (k % 2) * 3); } x.stroke(); }
      x.restore();
    });
    cv.padB = 10; return M.withShadow(cv, 6);
  }
  function drawPorte() {
    const W2 = AUT.PORTE.w / 2, H = AUT.PORTE.h;
    for (const sx of [-1, 1]) pc([[sx * W2 - 16, 0, 1], [sx * W2 + 16, 0, 1], [sx * W2 + 14, -H, 1], [sx * W2 - 14, -H, 1]], '#6a4f33', () => hatch(null, 1.5, 3.6, 0.3), 9950 + sx);
    pc([[-W2 + 16, -20, 1], [W2 - 16, -20, 1], [W2 - 16, -H + 40, 1], [-W2 + 16, -H + 40, 1]], '#9a7a50', () => {
      for (let xx = -W2 + 16; xx < W2 - 16; xx += 38) { strokePts([[xx, -20], [xx, -H + 40]], 'rgba(50,32,15,0.6)', 1.6); strokePts([[xx + 6, -30], [xx + 7, -H + 50]], 'rgba(255,230,190,0.18)', 2); }
      hatch(null, 1.5, 4, 0.22);
    }, 9953);
    for (const y of [-80, -H + 90]) pc([[-W2 + 16, y - 14, 1], [W2 - 16, y - 14, 1], [W2 - 16, y + 14, 1], [-W2 + 16, y + 14, 1]], '#7f6140', () => hatch(null, 0.1, 3.6, 0.25), 9954 + y);
    pc(ribbon([[-W2 + 30, -94], [W2 - 30, -H + 104]], 26, 26), '#7f6140', () => hatch(null, -0.9, 3.6, 0.22), 9956);
    for (const y of [-80, -H + 90]) pc([[-W2 - 6, y - 7, 1], [-W2 + 70, y - 7, 1], [-W2 + 78, y, 1], [-W2 + 70, y + 7, 1], [-W2 - 6, y + 7, 1]], FER.n, () => { dot(-W2 + 20, y, 2.4, '#8d8a85'); dot(-W2 + 50, y, 2.4, '#8d8a85'); }, 9957 + y);   // gonds
    const [sx, sy] = AUT.PORTE.serrure;
    pc([[sx - 46, sy - 66, 1], [sx + 46, sy - 66, 1], [sx + 46, sy + 66, 1], [sx - 46, sy + 66, 1]], '#3a3836', () => {   // boîtier de serrure (132 de haut)
      strokePts([[sx - 40, sy - 60], [sx + 40, sy - 60]], 'rgba(255,255,255,0.3)', 1.6);
      for (const [a, b] of [[-36, -56], [36, -56], [-36, 56], [36, 56]]) { dot(sx + a, sy + b, 4, '#1c1b1a'); dot(sx + a - 1, sy + b - 1, 2, '#9a958c'); }
      pc(ell(AUT.PORTE.trou[0], AUT.PORTE.trou[1] - 8, 26, 30, 18), '#b08d45', () => hatch(null, 0.5, 3, 0.2), 9959, { drop: false });   // écusson laiton
      fillPts(ell(AUT.PORTE.trou[0], AUT.PORTE.trou[1] - 16, 9, 9, 12), '#0e0c0b');
      fillPts([[AUT.PORTE.trou[0] - 5, AUT.PORTE.trou[1] - 12, 1], [AUT.PORTE.trou[0] + 5, AUT.PORTE.trou[1] - 12, 1], [AUT.PORTE.trou[0] + 9, AUT.PORTE.trou[1] + 12, 1], [AUT.PORTE.trou[0] - 9, AUT.PORTE.trou[1] + 12, 1]], '#0e0c0b');
      hatch(null, 0.9, 3.4, 0.3, 1, '255,255,255');
    }, 9958);
    pc([[sx - 100, sy - 104, 1], [sx - 46, sy - 104, 1], [sx - 46, sy - 92, 1], [sx - 100, sy - 92, 1]], '#55524e', () => dot(sx - 92, sy - 98, 3, '#22201e'), 9960);   // loquet
    pc(ell(sx - 104, sy - 98, 8, 8, 10), '#55524e', null, 9961);
  }
  function makePorte() { const cv = M.cutFlat(AUT.PORTE.w + 60, AUT.PORTE.h + 30, (AUT.PORTE.w + 60) / 2, AUT.PORTE.h + 20, () => drawPorte()); cv.padB = 10; return M.withShadow(cv, 8); }
  function makeSol() {
    const cv = M.cutFlat(M.W, 160, M.W / 2, 150, (x) => {
      const top = []; for (let k = 0; k <= 30; k++) top.push([-540 + k * 36, -48 - 14 * Math.sin(k * 0.8) - 8 * hash(k)]);
      pc([[-540, 10, 1]].concat(top, [[540, 10, 1]]), '#c09a5c', () => {
        for (let k = 0; k < 40; k++) dot(-530 + hash(k) * 1060, -40 + hash(k + 9) * 40, 2 + hash(k + 3) * 3, 'rgba(120,90,50,0.45)');
        hatch(null, 0.2, 4.4, 0.18);
      }, 9970);
      x.save(); x.lineCap = 'round';
      for (let k = 0; k < 70; k++) {                                         // herbe sèche
        const gx = -530 + hash(k * 3.3) * 1060, gy = -44 - 10 * Math.sin(k), h = 18 + hash(k + 1) * 34, a = (hash(k + 2) - 0.5) * 0.7;
        x.strokeStyle = k % 3 ? 'rgba(170,140,70,0.9)' : 'rgba(205,180,110,0.9)'; x.lineWidth = 2; x.beginPath(); x.moveTo(gx, gy + 6); x.quadraticCurveTo(gx + a * 10, gy - h * 0.6, gx + a * h, gy - h); x.stroke();
      }
      x.restore();
    });
    cv.padB = 10; return cv;
  }
  function makeLabo() {
    return M.pre(M.W, ST.back + 5, (x) => {
      const H = ST.back + 5;
      x.fillStyle = '#d7e2d0'; x.fillRect(0, 0, M.W, H);
      const sz = 60;                                                          // carrelage vert pâle sur tout le mur
      for (let r = 0; r * sz < H; r++) for (let k = 0; k * sz < M.W; k++) {
        x.fillStyle = M.mixc('#cfdcc6', '#bfd0b8', hash(r * 31 + k)); x.fillRect(k * sz, r * sz, sz, sz);
        x.fillStyle = 'rgba(255,255,255,0.18)'; x.fillRect(k * sz + 4, r * sz + 4, sz - 16, 4);
      }
      x.strokeStyle = 'rgba(120,135,115,0.6)'; x.lineWidth = 2; x.beginPath();
      for (let k = 0; k * sz <= M.W; k++) { x.moveTo(k * sz, 0); x.lineTo(k * sz, H); }
      for (let r = 0; r * sz <= H; r++) { x.moveTo(0, r * sz); x.lineTo(M.W, r * sz); } x.stroke();
      x.fillStyle = '#7d977f'; x.fillRect(0, 960, M.W, 22); x.fillStyle = 'rgba(255,255,255,0.25)'; x.fillRect(0, 960, M.W, 3);   // frise vert foncé
      // étagère de bocaux sans étiquette (à gauche)
      for (const yy of [600, 780]) {
        piece([[150, yy, 1], [470, yy, 1], [470, yy + 14, 1], [150, yy + 14, 1]], '#8a8f8c', () => hatch(null, 0.1, 3, 0.2), { seed: 9990 + yy });
        for (const bx of [170, 450]) piece([[bx - 4, yy + 14, 1], [bx + 4, yy + 14, 1], [bx + 4, yy + 44, 1], [bx - 12, yy + 14, 1]], '#6e7370', null, { seed: 9991 + bx + yy });
        let px = 166, i = 0;
        while (px < 440) {
          const w = 40 + (i * 7 + yy) % 14, h = 52 + ((i * 37 + yy) % 36), col = ['#a9b9a8', '#c3b28a', '#b5a49a', '#9fb0b4'][(i + yy / 20) % 4 | 0];
          piece([[px, yy, 1], [px + w, yy, 1], [px + w, yy - h + 10], [px + w - 6, yy - h, 1], [px + 6, yy - h, 1], [px, yy - h + 10]], 'rgba(214,226,224,0.75)', () => {
            x.fillStyle = col; x.fillRect(px + 3, yy - h * 0.62, w - 6, h * 0.62);
            x.fillStyle = 'rgba(255,255,255,0.35)'; x.fillRect(px + 6, yy - h + 12, 4, h - 18);
          }, { seed: 9992 + i + yy });
          piece([[px + 4, yy - h - 8, 1], [px + w - 4, yy - h - 8, 1], [px + w - 4, yy - h + 2, 1], [px + 4, yy - h + 2, 1]], '#6f5a44', null, { seed: 9993 + i + yy });
          px += w + 14; i++;
        }
      }
      toile(x, H);
      x.globalAlpha = 0.18; x.fillStyle = '#eef0e4'; x.fillRect(0, 0, M.W, H); x.globalAlpha = 1;
      const vg = x.createLinearGradient(0, H - 120, 0, H); vg.addColorStop(0, 'rgba(40,30,20,0)'); vg.addColorStop(1, 'rgba(40,30,20,0.3)'); x.fillStyle = vg; x.fillRect(0, H - 120, M.W, 120);
    });
  }
  function makeTable() {
    const top = AUT.TABLE.top - ST.back, hw = (AUT.TABLE.x1 - AUT.TABLE.x0) / 2;
    const cv = M.cutFlat(2 * hw + 40, -top + 40, hw + 20, -top + 30, () => {
      for (const sx of [-1, 1]) pc([[sx * (hw - 30) - 7, top + 20, 1], [sx * (hw - 30) + 7, top + 20, 1], [sx * (hw - 30) + 7, -14, 1], [sx * (hw - 30) - 7, -14, 1]], '#9aa1a3', () => strokePts([[sx * (hw - 30) - 2, top + 24], [sx * (hw - 30) - 2, -16]], 'rgba(255,255,255,0.6)', 2), 9995 + sx);
      for (const sx of [-1, 1]) pc(ell(sx * (hw - 30), -7, 9, 9, 10), '#3a3a3c', null, 9997 + sx);
      pc([[-hw + 30, -70, 1], [hw - 30, -70, 1], [hw - 30, -60, 1], [-hw + 30, -60, 1]], '#9aa1a3', null, 9999);
      pc([[-hw, top, 1], [hw, top, 1], [hw - 4, top + 30, 1], [-hw + 4, top + 30, 1]], '#c4cacb', () => {
        const c = cx_(), g = c.createLinearGradient(-hw, 0, hw, 0); g.addColorStop(0, 'rgba(255,255,255,0.1)'); g.addColorStop(0.4, 'rgba(255,255,255,0.55)'); g.addColorStop(0.5, 'rgba(255,255,255,0.1)'); g.addColorStop(1, 'rgba(90,100,105,0.3)');
        c.fillStyle = g; c.fillRect(-hw, top, 2 * hw, 30); strokePts([[-hw + 4, top + 3], [hw - 4, top + 3]], 'rgba(255,255,255,0.8)', 1.6); strokePts([[-hw + 4, top + 26], [hw - 4, top + 26]], 'rgba(60,70,75,0.6)', 1.6);
      }, 10000);
    });
    cv.padB = 10; return M.withShadow(cv, 8);
  }
  function makeLampe() {
    const cv = M.cutFlat(220, 200, 110, 150, (x) => {
      x.save(); x.strokeStyle = 'rgba(30,25,20,0.7)'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, -150); x.lineTo(0, -96); x.stroke(); x.restore();
      pc([[-8, -100, 1], [8, -100, 1], [10, -84, 1], [-10, -84, 1]], '#3d4a40', null, 10010);
      pc([[-14, -86], [14, -86], [80, -10], [86, 0, 1], [-86, 0, 1], [-80, -10]], '#3f5a48', () => { strokePts([[-70, -6], [70, -6]], 'rgba(255,255,255,0.35)', 2); hatch(null, 0.3, 3.6, 0.2); }, 10011);
      const g = x.createRadialGradient(0, 6, 2, 0, 6, 40); g.addColorStop(0, 'rgba(255,248,215,1)'); g.addColorStop(1, 'rgba(255,240,190,0)'); x.fillStyle = g; x.fillRect(-60, -10, 120, 60);
      pc(ep(0, 0, 22, 18, 10, 0, PI).concat([[-22, 0]]), '#fff4cf', null, 10012, { drop: false });
    });
    cv.padB = 50; return M.withShadow(cv, 6);
  }
  AUT.init = function () {
    if (AUT.K) return AUT.K;
    const K = (AUT.K = {});
    K.ciel = makeCiel(); K.arbre = makeArbre(); K.cloture = makeCloture(); K.porte = makePorte(); K.sol = makeSol();
    K.labo = makeLabo(); K.table = makeTable(); K.lampe = makeLampe();
    return K;
  };
  // toile, oiseaux lointains, arbre, clôture, porte, sol (avant M.drawFloor) ; o.porte (true), o.oiseaux (true), o.cast
  AUT.enclos = function (t, o) {
    o = o || {}; const K = AUT.K, cast = o.cast || { dx: 16, dy: 6, a: 0.3 };
    M.ctx().drawImage(K.ciel, 0, 0);
    if (o.oiseaux !== false) M.oiseaux(t, { x0: 1150, x1: -80, y: 470, n: 2, s: 0.55, dur: 12, t0: -3, boucle: true, brume: 0.45, seed: 31 });
    M.flat(K.arbre, AUT.ARBRE.x, ST.back, { rot: 0.004 * Math.sin(t * 0.8), cast });
    M.flat(K.cloture, 540, ST.back, { cast });
    if (o.porte !== false) M.flat(K.porte, AUT.PORTE.x, ST.back, { cast });
    M.flat(K.sol, 540, ST.back + 12);
  };
  // carrelage, lampe suspendue, table (o.table:false pour la poser soi-même après le chercheur)
  AUT.labo = function (t, o) {
    o = o || {}; const K = AUT.K, cast = o.cast || { dx: 16, dy: 6, a: 0.3 };
    M.ctx().drawImage(K.labo, 0, 0);
    M.hung(K.lampe, AUT.LAMPE.x, AUT.LAMPE.y, t, { amp: 0.015, f: 0.7 });
    if (o.table !== false) M.flat(K.table, AUT.TABLE.cx, ST.back, { cast });
  };
})();
