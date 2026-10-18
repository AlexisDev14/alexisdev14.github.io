// persos.js — « Robert Downey Jr, l'acteur que personne n'assurait » : marionnettes, accessoires et décors PROPRES À CETTE VIDÉO. Espace M.dow (alias DOW). Appeler DOW.init() dans S.init.
// Mode d'emploi complet : persos.md (ne pas lire ce fichier en entier). Aucun texte, lettre, chiffre ni logo. Déterministe (hash, jamais Math.random).
// MARIONNETTES : DOW.robert / DOW.assureur / DOW.feige / DOW.dirigeant (pose, x, y, s, o) — (x,y) = pieds ; jambes en 3 pièces legX_up/_lo + piedX.
// OBJETS TENUS (tenu / tenuB) : 'parapluie' 'clap' 'sac' 'bobine' 'casque' 'billet' ou une fonction de dessin (o, ctx) ; DOW.pt(r, nom[, arriere]).
// ACCESSOIRES : DOW.parapluie clap sac bobine casque (x,y,s,o) ; DOW.armure(x,y,s,{casque,lueur,up}) ; DOW.billet ; DOW.pluie(t,o) ; DOW.pile(t,o).
// DÉCORS : DOW.hollywood(t, up, o) (+ HOU.palmiers) ; DOW.studio(t, up, o) (+ HOU.projecteurs).
(function () {
  'use strict';
  const X = M.X, TAU = M.TAU, PI = Math.PI, D = 180 / PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, hash, smooth } = M;
  const DOW = (M.dow = {});
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
  const rotP = (p, a, c) => { c = c || [0, 0]; const co = Math.cos(a), si = Math.sin(a), x = p[0] - c[0], y = p[1] - c[1]; return [c[0] + x * co - y * si, c[1] + x * si + y * co]; };
  DOW.geo = { ep, ell, ribbon, qbez, rrect, box };

  // couleurs communes
  const OR = '#b8923a', ORL = '#e2c27a', ORD = '#7e6224', ROUGE = '#8a2a22', ROUGED = '#6a1f19', ROUGEL = '#a8443a', LAITON = '#c9a24a';

  // ------------------------------------------------------------ bras et jambes à articulations rondes (rivet au centre de chaque cercle)
  const R_COUDE = 11.5, LA = 96, LB = Math.hypot(4, 96), PHI = Math.atan2(-4, 96);
  function armR(len, wt) { wt = wt || 15; return ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1, 40], [R_COUDE + 0.5, len - 6]], ep(0, len, R_COUDE, R_COUDE, 10, 0, PI), [[-R_COUDE - 0.5, len - 6], [-wt + 1, 40]]); }
  function foreR(kind) { const f = X.forePts(kind); return ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU).concat(f.slice(2)); }
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
  // OBJETS — dessinés à l'échelle 1 ; grip = point tenu (centre du poing) ; p2 = seconde prise ; pts = points nommés ; base = origine de l'objet seul
  // =====================================================================
  // ---------------- parapluie noir à crosse : axe vers le haut (−y), prise en (0,0) ; o.ouvert 0..1 (baleines qui s'écartent)
  const PS = 222;                                   // prise → sommet de la toile
  function parapluieGeo(k) { const e = ease(clamp(k)); return { w: lerp(14, 150, e), h: lerp(150, 70, e), ya: -PS }; }
  function drawParapluie(o) {
    const k = clamp(o.ouvert || 0), G = parapluieGeo(k), w = G.w, h = G.h, ya = G.ya, yr = ya + h;
    pc([[-3, ya - 6], [3, ya - 6], [3, 4, 1], [-3, 4, 1]], '#2a211c', () => strokePts([[-1, ya], [-1, 0]], 'rgba(255,255,255,0.18)', 1), 7302);
    if (k > 0.15) {                                                    // baleines intérieures (sous la toile) : coulant sur le manche → milieu des baleines
      const yc = yr + lerp(20, 46, k);
      for (const f of [-0.62, -0.3, 0.3, 0.62]) strokePts([[0, yc], [f * w, ya + h * f * f + 4]], 'rgba(150,150,160,0.85)', 1.3);
      pc(box(-4, yc - 6, 4, yc + 6), '#5d5f63', null, 7303);
    }
    const top = [], N = 10;
    for (let i = 0; i <= N; i++) { const x = -w + 2 * w * i / N; top.push([x, ya + h * (x / w) * (x / w)]); }
    const rim = [];                                                      // bord festonné entre les pointes des baleines
    const tips = [-1, -0.5, 0, 0.5, 1];
    for (let j = tips.length - 1; j > 0; j--) { const xa = tips[j] * w, xb = tips[j - 1] * w; rim.push([xa, yr, 1]); rim.push([(xa + xb) / 2, yr - lerp(0, 9, k) + (1 - k) * 22 * (1 - Math.abs(xa + xb) / (2 * w))]); }
    rim.push([-w, yr, 1]);
    pc(top.concat(rim), '#232328', () => {
      for (const f of [-0.5, 0, 0.5]) { const x = f * w; strokePts(qbez([0, ya], [x * 0.55, ya + h * 0.12], [x, yr - 2], 6), 'rgba(140,140,155,0.55)', 1.2); }
      strokePts(top.slice(1, 6).map((p) => [p[0] * 0.92, p[1] + 5]), 'rgba(255,255,255,0.16)', 2);
      hatch(null, 0.9, 3.6, 0.25, 1.05, undefined, [-w - 4, ya - 4, w + 4, yr + 30]);
    }, 7304);
    if (k > 0.2) for (const f of [-1, -0.5, 0.5, 1]) dot(f * w, yr, 2.2, '#9a9ea2');
    pc([[-2.5, ya + 2], [2.5, ya + 2], [1.2, ya - 20, 1], [-1.2, ya - 20, 1]], '#9a9ea2', null, 7305);     // embout
    if (k < 0.2) pc(box(-w * 0.9, ya + h * 0.62, w * 0.9, ya + h * 0.62 + 7), '#1a1a1e', () => dot(0, ya + h * 0.62 + 3.5, 1.8, '#8f9296'), 7306);   // sangle
    const CR = [[0, -2], [0, 12], [-3, 22], [-12, 28], [-22, 26], [-27, 17]];
    pc(ribbon(CR, 10, 9), '#4a2e1c', () => { strokePts(CR.map((p) => [p[0] - 1.5, p[1] - 1.5]), 'rgba(255,225,190,0.35)', 1.2); hatch(null, 0.6, 3.2, 0.18); }, 7301);
  }
  // ---------------- clap de cinéma (ardoise noire unie, deux barres à bandes diagonales, AUCUNE inscription) ; o.barre 0..0.8 (ouverture, rad)
  const CLAP = { x0: -62, x1: 62, hinge: [-62, -88] };
  function stripes(x0, y0, x1, y1, sl, ph) {
    fillPts(box(x0, y0, x1, y1), '#f1ede2');
    for (let x = x0 - 40 + ph; x < x1 + 40; x += 30) fillPts([[x, y1], [x + 15, y1], [x + 15 + sl, y0], [x + sl, y0]], '#141416', 0, 0);
  }
  function drawClap(o) {
    const b = clamp(o.barre || 0, 0, 0.9);
    pc(box(-62, -76, 62, 0), '#1c1c1f', () => { strokePts([[-56, -70], [56, -70], [56, -6], [-56, -6]], 'rgba(200,200,200,0.22)', 1.6, true); hatch(null, 0.8, 4, 0.2); shade(-60, -76, 60, 0, 0.2, [-64, -80, 64, 4]); }, 7401);
    pc(box(-62, -88, 62, -76), '#f1ede2', () => stripes(-62, -88, 62, -76, -12, 0), 7402);
    const c = cx_(); c.save(); c.translate(CLAP.hinge[0], CLAP.hinge[1]); c.rotate(-b);
    pc(box(0, -14, 124, 0), '#f1ede2', () => stripes(0, -14, 124, 0, 14, 8), 7403);
    c.restore();
    pc(ell(-60, -88, 6, 6, 10), '#8f9296', () => dot(-60, -88, 2, '#3a3a3e'), 7404);
  }
  const clapP2 = (o) => rotP([54, -96], -clamp(o.barre || 0, 0, 0.9), CLAP.hinge);
  // ---------------- sac d'argent : toile écrue nouée d'une corde, pièce d'or au col ; origine = milieu du fond
  function drawSac(o) {
    const body = [[-8, -104], [-30, -96], [-50, -70], [-58, -36], [-52, -8], [-34, 2, 1], [34, 2, 1], [52, -8], [58, -36], [50, -70], [30, -96], [8, -104]];
    pc(body, '#c9b38a', () => {
      for (const f of [-0.5, 0, 0.45]) strokePts(qbez([f * 12, -100], [f * 70, -50], [f * 40, -2], 6), 'rgba(110,85,50,0.35)', 1.2);
      strokePts([[-40, -16], [-10, -10], [30, -14]], 'rgba(90,70,40,0.4)', 1.2);
      for (let i = 0; i < 9; i++) strokePts([[-46 + i * 11, -6 + Math.sin(i) * 2], [-42 + i * 11, -3 + Math.sin(i) * 2]], 'rgba(90,70,40,0.5)', 1);
      hatch(null, 0.8, 3.8, 0.26); shade(40, -40, -50, -40, 0.3, [-60, -110, 60, 6]);
    }, 7501);
    pc(ell(10, -128, 13, 13, 14), '#d6aa3e', () => { strokePts(ep(10, -128, 8, 8, 10, 0, TAU), 'rgba(120,85,20,0.6)', 1.2); strokePts([[4, -134], [10, -138]], 'rgba(255,240,190,0.7)', 1.3); }, 7505);
    pc([[-8, -104], [-24, -122], [-18, -138, 1], [-8, -126], [0, -142, 1], [6, -128], [20, -136, 1], [22, -120], [8, -104]], '#bda57a', () => hatch(null, 0.9, 3.4, 0.25), 7502);
    pc(rrect(-16, -110, 16, -100, 4), '#8a6a44', () => strokePts([[-14, -105], [14, -105]], 'rgba(255,230,190,0.3)', 1), 7503);
    pc(ribbon([[6, -104], [16, -92], [12, -78]], 5, 4), '#8a6a44', null, 7504);
  }
  // ---------------- bobine de film (vue de face) : flanc de couleur, jante argent terni, 3 trous ronds, pellicule ambrée qui dépasse ; origine = centre
  const BOB_COUL = { brique: '#9a4a35', vert: '#4f6b4a', ardoise: '#4f6577', ocre: '#b08a3e', prune: '#6b3e57', gris: '#7d7d78', petrole: '#2f5d66', cuivre: '#8c5a2e', olive: '#6f6a3a', nuit: '#2e3550' };
  const BOB_LISTE = ['brique', 'vert', 'ardoise', 'ocre', 'prune', 'gris', 'petrole', 'cuivre', 'olive', 'nuit'];
  DOW.BOBINES = BOB_LISTE;
  const bobCol = (c) => (c == null ? BOB_COUL.brique : typeof c === 'number' ? BOB_COUL[BOB_LISTE[((c % 10) + 10) % 10]] : BOB_COUL[c] || c);
  function drawBobine(o) {
    const col = bobCol(o.couleur);
    pc(ribbon([[52, 30], [70, 52], [96, 60], [118, 56]], 13, 13), '#7a4a22', () => { for (let i = 0; i < 6; i++) { const p = qbez([52, 30], [70, 52], [118, 56], 6)[i]; dot(p[0], p[1] - 4, 1.6, '#3a2210'); } }, 7609);
    pc(ell(0, 0, 65, 65, 28), '#a9aaa4', () => {
      fillPts(ell(0, 0, 58, 58, 28), col);
      strokePts(ep(0, 0, 61.5, 61.5, 28, 0, TAU), 'rgba(255,255,255,0.35)', 1.4);
      for (let i = 0; i < 3; i++) { const a = -PI / 2 + i * TAU / 3, hx = Math.cos(a) * 33, hy = Math.sin(a) * 33; fillPts(ell(hx, hy, 15, 15, 14), '#7a4a22'); strokePts(ep(hx, hy, 15, 15, 14, 0, TAU), 'rgba(30,20,10,0.6)', 1.2); strokePts(ep(hx, hy, 11, 11, 10, PI * 1.1, PI * 1.6), 'rgba(230,170,100,0.5)', 1.2); }
      fillPts(ell(0, 0, 13, 13, 14), '#b8b9b3'); fillPts(box(-4, -4, 4, 4), '#3a3a3a');
      hatch(null, 0.8, 4, 0.18); shade(-50, -50, 50, 50, 0.3, [-68, -68, 68, 68]);
    }, 7601);
    for (let i = 0; i < 3; i++) { const a = PI / 6 + i * TAU / 3; dot(Math.cos(a) * 47, Math.sin(a) * 47, 2.4, LAITON); }
  }
  // pile de bobines posées à plat (vues de profil) : disques épais ; o.n (fractionnaire : la suivante tombe), o.premiere (indice de couleur), o.oscille, o.t
  const PILE_H = 32;
  function drawPile(o) {
    const n = Math.max(0, o.n == null ? 8 : o.n), full = Math.floor(n), fr = n - full, c0 = o.premiere || 0, t = o.t || 0;
    const sw = (o.oscille || 0) * 0.025 * Math.sin(t * 3.1), c = cx_();
    const disque = (i, y) => {
      const col = bobCol(c0 + i), x = sw * (-y);
      c.save(); c.translate(x, 0);
      pc([[-65, y - 4], [65, y - 4], [65, y - PILE_H + 4, 1], [-65, y - PILE_H + 4, 1]].map((p, j) => (j > 1 ? [p[0], p[1]] : p)), col, () => {
        fillPts(box(-60, y - PILE_H + 9, 60, y - 9), '#7a4a22');
        for (let k = 0; k < 4; k++) strokePts([[-60, y - 13 - k * 3], [60, y - 13 - k * 3]], 'rgba(230,170,100,0.25)', 1);
        strokePts([[-64, y - 6], [64, y - 6]], 'rgba(255,255,255,0.25)', 1.2);
        hatch(null, 0.8, 4, 0.2); shade(-64, 0, 64, 0, 0.3, [-68, y - PILE_H, 68, y]);
      }, 7700 + i * 3);
      if (i % 3 === 1) pc(ribbon([[60, y - 16], [72, y - 12], [76, y + 6]], 9, 9), '#7a4a22', null, 7701 + i * 3);
      c.restore();
    };
    for (let i = 0; i < full; i++) disque(i, -i * PILE_H);
    let yTop = -full * PILE_H;
    if (fr > 0.02) { const u = ease(clamp(fr / 0.8)), b = fr > 0.8 ? -10 * Math.sin((fr - 0.8) / 0.2 * PI) : 0; disque(full, yTop - (1 - u) * 160 + b); }
    const ct = bobCol(c0 + Math.max(0, full - 1));
    if (full > 0) {
      const y = yTop + 4, x = sw * (-y);
      c.save(); c.translate(x, 0);
      pc(ell(0, y, 65, 12, 24), ct, () => { for (let i = 0; i < 3; i++) { const a = -PI / 2 + i * TAU / 3; fillPts(ell(Math.cos(a) * 33, y + Math.sin(a) * 6, 13, 3.4, 10), '#5a3418'); } fillPts(ell(0, y, 12, 3, 10), '#b8b9b3'); strokePts(ep(0, y, 61, 10.5, 24, PI, TAU), 'rgba(255,255,255,0.3)', 1.2); }, 7799);
      c.restore();
    }
  }
  // ---------------- billet (sprite pré-rendu) : vert-de-gris pâle, bord ivoire, médaillon ovale vide
  function drawBillet(verso) {
    pc(box(-35, -17, 35, 17), verso ? '#8fa07c' : '#9fb08a', () => {
      strokePts([[-31, -13], [31, -13], [31, 13], [-31, 13]], '#ece6d2', 2.2, true);
      fillPts(ell(0, 0, 11, 9, 16), verso ? '#a4b291' : '#b6c4a0'); strokePts(ep(0, 0, 11, 9, 16, 0, TAU), 'rgba(60,80,50,0.7)', 1.1);
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) strokePts([[sx * 26, sy * 8], [sx * 20, sy * 4], [sx * 16, sy * 8]], 'rgba(60,80,50,0.5)', 1);
      strokePts([[-27, -9], [27, -9], [27, 9], [-27, 9]], 'rgba(60,80,50,0.35)', 1, true);
      hatch(null, 0.5, 2.6, 0.16);
    }, verso ? 7802 : 7801, { drop: false });
  }
  // ---------------- casque rouge et or : profil (repère de la tête de Robert : rivet du cou à l'origine, visage vers +x) ou face (origine = milieu du bas)
  const CQ_SHELL = [[36, -74], [30, -96], [12, -114], [-14, -120], [-38, -106], [-48, -80], [-50, -50], [-46, -18], [-38, 4], [-24, 12, 1], [-10, 10], [-2, -2], [2, -22], [6, -40], [8, -58], [14, -65], [26, -70]];
  const CQ_FERME = [[34, -82], [44, -62], [47, -44], [42, -26], [34, -6], [20, 10], [4, 8], [3, -38], [14, -72]];
  const CQ_LEVE = [[-4, -121, 1], [16, -129], [34, -121], [46, -104], [51, -88, 1], [42, -86, 1], [35, -99], [18, -111], [-2, -113, 1]];
  function drawCasqueProfil(o) {
    const v = clamp(o.visiere == null ? 1 : o.visiere);
    pc(CQ_SHELL, ROUGE, () => {
      strokePts([[36, -74], [26, -70], [14, -65], [8, -58], [6, -40], [2, -22], [-2, -2], [-10, 10]], OR, 5);
      fillPts(ell(-20, -46, 10, 12, 14), OR); strokePts(ep(-20, -46, 6, 8, 12, 0, TAU), ORD, 1.2); fillPts([[-12, -8], [-2, -2], [2, -22], [-8, -24]], OR);
      strokePts(qbez([30, -96], [0, -128], [-44, -84], 8), 'rgba(255,200,180,0.25)', 3);
      for (const [x, y] of [[-40, -70], [-42, -30], [-30, 2], [24, -90], [-4, -112]]) dot(x, y, 2.2, LAITON);
      hatch(null, 0.8, 3.6, 0.24); shade(30, -110, -40, -10, 0.3, [-54, -124, 50, 16]);
    }, 7901);
    const pts = CQ_FERME.map((p, i) => lerpP(p, CQ_LEVE[i], ease(v)));
    pc(pts, OR, () => {
      if (v < 0.5) { fillPts([[22, -58], [42, -56], [41, -50], [22, -52]], '#1a1210'); strokePts([[30, -34], [40, -30]], ORD, 1.2); }
      else { strokePts([[14, -120], [30, -114], [40, -102]], '#1a1210', 2.6); strokePts([[42, -94], [47, -88]], ORD, 1.4); }
      strokePts(pts.slice(0, 5).map((p) => [p[0] - 3, p[1] + 2]), 'rgba(255,240,190,0.4)', 1.4);
      hatch(null, 0.9, 3.4, 0.18);
    }, 7902);
  }
  const CQF_SHELL = [[-46, 0], [-51, -40], [-53, -80], [-45, -108], [-25, -126], [0, -131], [25, -126], [45, -108], [53, -80], [51, -40], [46, 0], [30, 7, 1], [-30, 7, 1]];
  const CQF_FACE = [[-34, -100], [0, -108], [34, -100], [39, -62], [31, -26], [15, -5], [-15, -5], [-31, -26], [-39, -62]];
  function drawCasqueFace(o) {
    const v = clamp(o.visiere == null ? 1 : o.visiere);
    pc(CQF_SHELL, ROUGE, () => {
      strokePts([[0, -130], [0, -104]], OR, 6);
      for (const sx of [-1, 1]) { fillPts(ell(sx * 46, -56, 7, 16, 12), OR); dot(sx * 40, -96, 2.2, LAITON); dot(sx * 44, -20, 2.2, LAITON); }
      hatch(null, 0.8, 3.6, 0.22); shade(-50, -120, 50, 0, 0.3, [-56, -134, 56, 10]);
    }, 7911);
    if (v > 0.02) pc([[-32, -94], [32, -94], [36, -60], [29, -27], [13, -8], [-13, -8], [-29, -27], [-36, -60]], '#1d1512', () => hatch(null, 0.8, 3, 0.3), 7913, { drop: false });
    const fy = (p) => [p[0] * lerp(1, 0.94, v), lerp(p[1], -112 + (p[1] + 108) * 0.24, ease(v))];
    pc(CQF_FACE.map(fy), OR, () => {
      if (v < 0.5) for (const sx of [-1, 1]) fillPts([[sx * 28, -70], [sx * 7, -64], [sx * 7, -58], [sx * 26, -61]], '#1a1210', 0, 0);
      strokePts([[0, -104], [0, -40]].map(fy), 'rgba(120,90,30,0.5)', 1.2);
      strokePts([[-30, -96], [30, -96]].map(fy), 'rgba(255,240,190,0.4)', 1.4);
      hatch(null, 0.9, 3.4, 0.18);
    }, 7912);
  }
  function drawCasque(o) { if (o.vue === 'face') drawCasqueFace(o); else drawCasqueProfil(o); }

  // registre : grip = point tenu ; p2 = seconde prise ; pts = points nommés ; base = origine de l'objet seul ; held = options par défaut en main
  const OBJ = {
    parapluie: { draw: drawParapluie, grip: [0, 0], p2: () => [0, -46], pts: { haut: [0, -PS], bout: [0, -PS - 20], crosse: [-27, 17], prise: [0, 0] }, base: [0, 0] },
    clap: { draw: drawClap, grip: [48, -30], p2: clapP2, pts: { claque: [60, -88], centre: [0, -40], haut: [0, -100] }, base: [0, 0] },
    sac: { draw: drawSac, grip: [0, -106], pts: { col: [0, -118], piece: [10, -128], base: [0, 0] }, base: [0, 0] },
    bobine: { draw: drawBobine, grip: [0, 58], pts: { centre: [0, 0] }, base: [0, 0] },
    casque: { draw: drawCasque, grip: [-24, 6], held: { vue: 'profil' }, pts: { centre: [0, -60] }, base: (o) => (o.vue === 'face' ? [0, 0] : [-4, 10]) },
    billet: { draw: () => drawBillet(false), grip: [-26, 4], pts: { centre: [0, 0] }, base: [0, 0] },
  };
  DOW.OBJ = OBJ;
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
  function heldParts(skin, seed) {
    return {
      objet: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (has(p.tenu)) heldDraw(p.tenu, p.tenuO, p); } },
      doigts: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 2, pts: (p) => (has(p.tenu) ? DOIGTS : OFFP), paint: doigtsPaint },
      objetB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 3, pts: OFFP, extra: (p) => { if (has(p.tenuB)) heldDraw(p.tenuB, p.tenuBO, p); } },
      doigtsB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 4, pts: (p) => (has(p.tenuB) && !p._deux ? DOIGTS : OFFP), paint: doigtsPaint },
      doigtsB2: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 6, pts: (p) => (p._deux ? DOIGTS : OFFP), paint: doigtsPaint },
    };
  }
  // point nommé de l'objet tenu → [x, y] écran (fonction de dessin : o.pts = { nom: [x,y] } dans le repère du poing)
  DOW.pt = function (r, nom, arriere) {
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
    return q;
  }
  const blend = (q, n, v, k) => { q.ang[n] = lerp(q.ang[n] || 0, v, k); };
  function armTo(q, def, arm, T, pick, k) {
    if (k <= 0) return;
    const sol = ik2(def.parts[arm + '_up'].at, T, pick), A = q.ang;
    const a0 = A[arm + '_up'] || 0, b0 = A[arm + '_lo'] || 0;
    A[arm + '_up'] = a0 + normA(sol.a - a0) * k; A[arm + '_lo'] = b0 + normA(sol.b - b0) * k;
  }
  // bras tendu vers une direction (cible écran ou défaut), coude à peine plié vers l'avant
  function tendVers(q, env, def, arm, cible, defT, k, plie) {
    if (k <= 0) return; const S = def.parts[arm + '_up'].at, T = cible ? toTorso(env, q, cible) : defT;
    const a = Math.atan2(-(T[0] - S[0]), T[1] - S[1]), pl = plie == null ? 0.35 : plie;
    blend(q, arm + '_up', a + pl * 0.5, k); blend(q, arm + '_lo', -pl, k);
  }
  function headRot(q, def) { const h = def.parts.head; return (q.ang.head || 0) + (h.rest || 0); }
  function headPt(q, def, hx, hy) { const h = def.parts.head; return mp(new DOMMatrix().translate(h.at[0], h.at[1]).rotate(headRot(q, def) * D), [hx, hy]); }
  function toTorso(env, q, P0) { const { mats } = M.partMatrices(env.def, q, env.x, env.y, env.s, env.dir); const p = new DOMPoint(P0[0], P0[1]).matrixTransform(mats.torso.inverse()); return [p.x, p.y]; }
  function plier(q, def, th) {                                    // plie le buste aux hanches (th > 0 = vers l'avant), jambes droites
    if (!th) return; const h = -def.hipY;
    q.tilt = (q.tilt || 0) + th; q.dx = (q.dx || 0) - h * Math.sin(th); q.dy = (q.dy || 0) + h * (1 - Math.cos(th));
    q.ang.legF_up = (q.ang.legF_up || 0) - th; q.ang.legB_up = (q.ang.legB_up || 0) - th;
  }
  function marche(q, k, t, amp) {                                 // pas sur place (la scène déplace x) ; k 0..1
    if (k <= 0) return; const ph = t * TAU * 1.5, s = Math.sin(ph), A = q.ang; amp = amp || 0.34;
    A.legF_up = (A.legF_up || 0) + amp * s * k; A.legB_up = (A.legB_up || 0) - amp * s * k;
    A.legF_lo = (A.legF_lo || 0) + 0.42 * Math.max(0, Math.sin(ph - 1.3)) * k; A.legB_lo = (A.legB_lo || 0) + 0.42 * Math.max(0, Math.sin(ph + PI - 1.3)) * k;
    A.piedF = (A.piedF || 0) - 0.5 * (A.legF_up + A.legF_lo) * k; A.piedB = (A.piedB || 0) - 0.5 * (A.legB_up + A.legB_lo) * k;
    q.dy = (q.dy || 0) - Math.abs(Math.cos(ph)) * 5 * k;
    A.armF_up = (A.armF_up || 0) - 0.18 * s * k; A.armB_up = (A.armB_up || 0) + 0.18 * s * k;
  }
  function assis(q, env, k) {                                     // hanche posée à `siege` (y écran) ou à hauteur de chaise ; jambes pliées
    if (k <= 0) return; const def = env.def, A = q.ang, L = def._legs, hip = -def.hipY;
    const seat = env.siege != null ? hip - (env.y - env.siege) / env.s - 14 : hip - (L.sh + 16) + 2;
    q.dy = (q.dy || 0) + seat * k;
    A.legF_up = (A.legF_up || 0) - 1.5 * k; A.legB_up = (A.legB_up || 0) - 1.42 * k;
    A.legF_lo = (A.legF_lo || 0) + 1.5 * k; A.legB_lo = (A.legB_lo || 0) + 1.36 * k; A.piedF = (A.piedF || 0) + 0.05 * k; A.piedB = (A.piedB || 0) + 0.1 * k;
    q.tilt = (q.tilt || 0) - 0.03 * k;
  }
  function applaudir(q, def, k, t, y0) {
    if (k <= 0) return; const sep = 15 * (0.5 + 0.5 * Math.cos(t * TAU * 2.6));
    armTo(q, def, 'armF', [72 + sep, y0], 'bas', k); armTo(q, def, 'armB', [68 - sep, y0 - 6], 'bas', k);
    if (k > 0.4) { if (!has(q.tenu)) q.handF = 'open'; if (!has(q.tenuB)) q.handB = 'open'; }
  }
  function finish(q, def) {
    const A = q.ang, tl = q.tilt || 0;
    if (has(q.tenu) && !(q.handF && q.handF !== 'fist')) q.handF = 'fist';
    if (has(q.tenuB) && !(q.handB && q.handB !== 'fist')) q.handB = 'fist';
    if (q.droit == null && has(q.tenu)) q.droit = true;
    if (q.droitB == null && has(q.tenuB)) q.droitB = true;
    if (q.droit) A.objet = (A.objet || 0) - ((A.armF_up || 0) + (A.armF_lo || 0) + tl);
    if (q.droitB) A.objetB = (A.objetB || 0) - ((A.armB_up || 0) + (A.armB_lo || 0) + tl);
    q._deux = false;
    if (q.deuxMains && typeof q.tenu === 'string' && OBJ[q.tenu] && OBJ[q.tenu].p2) {
      const ob = OBJ[q.tenu], oo = heldOpts(q.tenu, q.tenuO, q), g = vOf(ob.grip, oo), SF = def.parts.armF_up.at, k = oo.taille || 1;
      const Hf = new DOMMatrix().translate(SF[0], SF[1]).rotate((A.armF_up || 0) * D).translate(0, LA).rotate((A.armF_lo || 0) * D).translate(4, 96).rotate((A.objet || 0) * D).scale(k, k).translate(-g[0], -g[1]);
      const sol = ik2(def.parts.armB_up.at, mp(Hf, ob.p2(oo)), 'bas');
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
    r.tete = r.w('head', 0, -100);
    return r;
  }
  function wrap(def, poseFn, sDef) {
    return (pose, x, y, s, o) => {
      o = o || {}; s = s == null ? sDef : s;
      const q = prep(pose), env = { def, x, y, s, dir: o.dir || 1, siege: q.siege };
      poseFn(q, env);
      finish(q, def);
      const r = run(def, q, x, y, s, o);
      if (def._after) def._after(r, q, env);
      return r;
    };
  }

  // ---------------- pièces de corps communes
  function upDef(at, base, seed, wt, paint) { return { parent: 'torso', at, pts: armR(LA, wt), base, seed, paint: paint || (() => hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.28)) }; }
  function foreDef(parent, base, skin, back, seed, o) {
    o = o || {}; const hk = (p) => (back ? p.handB : p.handF) || 'fist';
    return { parent, at: [0, LA], pts: (p) => foreR(hk(p)), base, seed, paint: (p) => {
      if (o.manchette) { fillPts([[-24, -4, 1], [24, -4, 1], [24, 62, 1], [-24, 62, 1]], o.manchette); for (const y of [2, 58]) strokePts([[-14, y], [-8, y + 2], [-2, y], [4, y + 2], [10, y]], 'rgba(255,255,255,0.22)', 1); strokePts([[8, 6], [9, 54]], 'rgba(255,255,255,0.18)', 1.6); }
      fillPts([[-20, 76, 1], [20, 76, 1], [24, 130, 1], [-20, 130, 1]], skin); X.handPaint(null, hk(p));
      if (o.cuff) fillPts([[-14, 62, 1], [14, 62, 1], [15, 78, 1], [-14, 78, 1]], o.cuff);
      if (o.manchon) fillPts([[-15, 66, 1], [15, 66, 1], [15, 77, 1], [-15, 77, 1]], o.manchon);
      hatch([[-14, -10], [-3, -10], [-3, 60], [-14, 60]], 0.9, 3.8, back ? 0.3 : 0.2);
    } };
  }
  function legParts(L, seed) {
    const thigh = (back) => ({ parent: 'torso', at: [back ? -L.hx : L.hx, -2], pts: legC(L.th, L.wt, L.kt), base: back ? L.colD : L.col, seed: seed + (back ? 1 : 2), noRivet: !!back,
      paint: (p) => { if (L.thighPaint) L.thighPaint(back, p); hatch(back ? null : [[-L.wt, -10], [-4, -10], [-4, L.th], [-L.wt, L.th]], 0.8, 3.8, back ? 0.3 : 0.22); } });
    const shin = (back) => ({ parent: back ? 'legB_up' : 'legF_up', at: [0, L.th], pts: legC(L.sh, L.kt, L.ak), base: back ? (L.shinD || L.colD) : (L.shin || L.col), seed: seed + (back ? 3 : 4), noRivet: !!back,
      paint: (p) => { if (L.shinPaint) L.shinPaint(back, p); hatch(back ? null : [[-L.kt, -6], [-3, -6], [-3, L.sh], [-L.kt, L.sh]], 0.8, 3.8, back ? 0.3 : 0.2); } });
    const foot = (back) => ({ parent: back ? 'legB_lo' : 'legF_lo', at: [0, L.sh], pts: FOOT(L.ak + 1, L.fl), base: back ? L.shoeD : L.shoe, seed: seed + (back ? 5 : 6), noRivet: true,
      paint: () => { if (L.shoePaint) L.shoePaint(back); else strokePts([[4, 4], [L.fl * 0.7, 7]], 'rgba(255,255,255,0.25)', 1.2); } });
    return { legB_up: thigh(true), legB_lo: shin(true), piedB: foot(true), legF_up: thigh(false), legF_lo: shin(false), piedF: foot(false) };
  }
  const ORDER = (heads, mid) => ['armB_up', 'armB_lo', 'objetB', 'doigtsB', 'legB_up', 'legB_lo', 'piedB', 'legF_up', 'legF_lo', 'piedF', 'head'].concat(heads, ['torso'], mid || [], ['armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsB2']);

  // ---------------- visage : œil, sourcil, bouche
  function oeil(x, y, o) {
    o = o || {}; const lid = clamp(o.lid || 0), w = o.wide ? 1.35 : 1, sz = o.sz || 1;
    if (o.heureux) { strokePts([[x - 7 * sz, y + 1], [x - 1, y - 3.5 * sz], [x + 6 * sz, y]], 'rgba(30,18,16,0.95)', 2); return; }
    if (lid > 0.85) { strokePts([[x - 7 * sz, y - 0.5], [x, y + 2.4 * sz], [x + 6.5 * sz, y - 0.5]], 'rgba(30,18,16,0.95)', 2); return; }
    const h = (1 - lid) * w;
    fillPts([[x - 6.5 * sz, y], [x - 1 * sz, y - 3.6 * sz * h], [x + 6 * sz, y - 1.2 * sz * h], [x + 2.8 * sz, y + 2 * sz * w], [x - 4 * sz, y + 1.2 * sz]], '#efe8da', 0, 0);
    const lx = (o.look ? o.look[0] : 0), ly = (o.look ? o.look[1] : 0);
    if (o.iris) dot(x + 2 * sz + lx, y - 0.4 * sz * h + ly, 2.5 * sz * Math.min(1.1, w), o.iris);
    dot(x + 2.2 * sz + lx, y - 0.5 * sz * h + ly, (o.iris ? 1.2 : 2.0) * sz, '#1f1716');
    strokePts([[x - 7 * sz, y + 0.2], [x - 1 * sz, y - 3.9 * sz * h], [x + 6.5 * sz, y - 1.4 * sz * h]], 'rgba(28,16,14,0.95)', 1.9);
    if (lid > 0.2) fillPts([[x - 7 * sz, y - 4.5 * sz], [x + 7 * sz, y - 4.5 * sz], [x + 6.5 * sz, y - 1.4 * sz * h], [x - 1 * sz, y - 3.9 * sz * h], [x - 7 * sz, y + 0.2]], o.peau || M.P.peau, 0, 0);
  }
  function sourcil(x, y, o) {   // leve : sourcil haut ; fronce > 0 : bout avant abaissé (colère) ; fronce < 0 : bout avant relevé (inquiétude)
    o = o || {}; const r = o.leve || 0, f = o.fronce || 0, lw = o.lw || 2.6;
    strokePts([[x - 9, y - 1 - 2 * r + 1.5 * f], [x - 1, y - 3.5 - 4.5 * r + 0.5 * f], [x + 8, y - 1.5 - 2.5 * r + 3 * f]], o.col || 'rgba(45,28,20,0.95)', lw);
  }
  function bouche(x, y, kind, o) {
    o = o || {}; const col = o.col || 'rgba(110,40,38,0.95)';
    if (kind === 'o') { fillPts([[x - 3.5, y - 3], [x + 1.5, y - 3.5], [x + 2, y + 3], [x - 3.5, y + 3.5]], '#3a1714', 0, 0); return; }
    if (kind === 'bee') { const j = o.jaw || 10; fillPts([[x - 6, y - 2], [x + 3, y - 3], [x + 4, y + j], [x - 2, y + j + 1], [x - 7, y + j * 0.6]], '#3a1714', 0, 0); return; }
    if (kind === 'sourire') { strokePts([[x + 2, y - 1.5], [x - 4, y + 1], [x - 10, y - 3]], col, 1.9); return; }
    if (kind === 'rire') { fillPts([[x + 2, y - 2], [x - 10, y - 3], [x - 4, y + 5]], '#3a1714', 0, 0); strokePts([[x + 1, y - 2], [x - 9, y - 3]], '#f1ece0', 1.4); return; }
    if (kind === 'serre') { strokePts([[x + 1, y], [x - 9, y + 1.4]], col, 2.1); return; }
    if (kind === 'coin') { strokePts([[x + 1, y + 1], [x - 4, y + 0.5], [x - 9, y - 2.5]], col, 1.9); return; }
    if (kind === 'moue') { strokePts([[x + 1, y + 0.5], [x - 4, y + 1], [x - 9, y + 3]], col, 1.9); return; }
    strokePts([[x + 1, y], [x - 4, y + 0.8], [x - 9, y + 0.2]], col, 1.7);
  }
  const MOUTH = { n: 'n', o: 'o', smile: 'sourire', tight: 'serre' };
  function visage(p, tab, ex, eo) {        // ex : x,y œil ; sourcil ; bouche ; couleurs
    const f = p.face || {}, e = Object.assign({}, tab[p.expr || 'neutre'] || {}, f.e || {});
    oeil(ex.ox, ex.oy, { iris: eo.iris, lid: f.eyes === 'closed' ? 1 : f.eyes === 'half' ? 0.5 : e.lid || 0, wide: e.wide || f.eyes === 'wide', heureux: e.heureux, look: e.look, peau: eo.peau, sz: eo.sz });
    sourcil(ex.ox, ex.oy - 10 - (e.leve || 0) * 1.2, { leve: e.leve || 0, fronce: e.fronce || 0, lw: eo.lw || 2.8, col: eo.brow });
    bouche(ex.bx, ex.by, f.mouth ? (MOUTH[f.mouth] || f.mouth) : (e.bouche || 'n'), { jaw: e.jaw, col: eo.levres });
    return e;
  }

  // =====================================================================
  // ROBERT — costume trois-pièces bleu pétrole, chemise ivoire, pochette rouge sang ; cheveux noirs en pointe vers l'avant, bouc et moustache, lunettes rondes ambre
  // =====================================================================
  const RD = { peau: '#e0b994', peauD: '#c49a76', costume: '#2e4f5c', costumeD: '#24404b', costumeL: '#3d6574', gilet: '#284653', chemise: '#ece4d0', pochette: '#8a2a22', cravate: '#1c2b31',
    cheveux: '#1b1615', chaussure: '#171415', chaussureD: '#0f0d0e', iris: '#5a3a22', ambre: 'rgba(176,122,42,0.42)', monture: '#3a2a1a' };
  const RD_TORSO = [[-14, -178], [8, -182], [18, -170], [28, -152], [34, -114], [35, -62], [33, -14], [35, 30], [37, 46, 1], [-37, 48, 1], [-39, 10], [-37, -40], [-39, -110], [-35, -150], [-26, -170]];
  const RD_HEAD = [[-14, 16], [10, 16], [13, 4], [19, -4], [27, -8], [30, -14], [29, -20], [31, -25], [30, -29], [33, -33], [38, -40, 1], [33, -46], [30, -54], [31, -62], [29, -76], [17, -91], [-5, -97], [-24, -90], [-33, -70], [-32, -46], [-25, -28], [-17, -8]];
  const RD_HAIR = [[28, -73], [34, -84], [48, -99, 1], [32, -101], [24, -112, 1], [12, -104], [-2, -108, 1], [-14, -101], [-28, -93], [-36, -78], [-37, -62], [-33, -52], [-27, -57], [-18, -70], [0, -79], [16, -80]];
  const RD_BOUC = [[18, -19], [28, -20], [32, -14], [30, -6], [22, 2], [14, 5], [15, -6]];
  const RD_EXPR = { neutre: { bouche: 'n' }, sourire: { bouche: 'sourire', leve: 0.2 }, malicieux: { bouche: 'coin', leve: 0.9, lid: 0.25 }, ravi: { heureux: true, bouche: 'rire', leve: 0.6 }, degu: { bouche: 'moue', fronce: -0.6, lid: 0.2 } };
  function mkRobert() {
    const L = { th: 116, sh: 108, hx: 6, wt: 17, kt: 12, ak: 9, fl: 46, col: RD.costume, colD: RD.costumeD, shoe: RD.chaussure, shoeD: RD.chaussureD,
      thighPaint: (back) => { if (!back) strokePts([[10, 4], [11, 104]], 'rgba(255,255,255,0.14)', 1.2); },
      shinPaint: (back) => { if (!back) strokePts([[9, 0], [10, L.sh - 8]], 'rgba(255,255,255,0.12)', 1.2); },
      shoePaint: (back) => { strokePts([[8, 3], [34, 7]], back ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.3)', 1.6); fillPts(box(-16, 13, 47, 17), '#060505'); } };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: RD_TORSO, base: RD.costume, seed: 11001, paint: () => {
        fillPts([[0, -182], [14, -178], [24, -160], [30, -128], [33, -62], [30, -20], [16, -20], [12, -100], [6, -150], [0, -170]], RD.gilet);     // gilet
        fillPts([[2, -180], [13, -176], [17, -158], [10, -140], [5, -156]], RD.chemise);                                                           // chemise (V)
        fillPts([[9, -170], [14, -168], [15, -140], [11, -132], [8, -142]], RD.cravate);
        strokePts([[14, -150], [22, -22]], 'rgba(10,20,25,0.55)', 1.2); for (const y of [-130, -104, -78, -52]) dot(19 + (y + 130) * 0.06, y, 2, '#16262c');
        fillPts([[0, -172], [6, -150], [12, -100], [18, -112], [14, -150], [8, -174]], RD.costumeD);              // revers de la veste
        strokePts([[12, -100], [18, -30], [22, 30], [24, 46]], 'rgba(10,18,22,0.75)', 1.6);
        strokePts([[18, -112], [14, -150], [8, -174]], 'rgba(255,255,255,0.16)', 1.1);
        fillPts([[-12, -118], [2, -118], [0, -128], [-4, -122], [-7, -131], [-10, -121]], RD.pochette);           // pochette rouge
        strokePts([[-14, -118], [4, -118]], 'rgba(10,18,22,0.7)', 1.4);
        fillPts(box(-28, 4, 4, 11), RD.costumeD); strokePts([[-28, 4], [4, 4]], 'rgba(255,255,255,0.14)', 1);
        hatch([[-52, -170], [-12, -170], [-10, 48], [-52, 48]], 0.75, 4.2, 0.3);
        shade(40, 0, -40, 0, 0.26);
      } },
      armB_up: upDef([-10, -146], RD.costumeD, 11004),
      armB_lo: foreDef('armB_up', RD.costumeD, RD.peauD, true, 11005, { cuff: '#d8d0bc' }),
      head: { parent: 'torso', at: [6, -174], pts: RD_HEAD, base: RD.peau, seed: 11006, noRivet: true, paint: (p) => {
        X.earPaint(-8, -44);
        fillPts([[-4, -64], [1, -64], [2, -50], [-2, -46]], RD.cheveux);                                        // favori
        hatch([[-22, -42], [2, -32], [10, -12], [-6, 14], [-32, 4]], 0.6, 3.6, 0.22);
        strokePts([[14, -74], [25, -73]], 'rgba(120,70,55,0.25)', 1);
        visage(p, RD_EXPR, { ox: 19, oy: -52, bx: 29, by: -23 }, { iris: RD.iris, peau: RD.peau, brow: 'rgba(25,18,16,0.98)', lw: 3.2 });
        fillPts([[21, -31], [30, -32], [34, -28], [26, -27], [20, -26]], RD.cheveux);                        // moustache taillée

        const ring = ell(20, -52, 8.5, 8, 14);                                                              // lunettes rondes ambre
        fillPts(ring, RD.ambre, 0, 0); strokePts(ring.concat([ring[0]]), RD.monture, 1.6);
        strokePts([[11.5, -53], [-8, -54]], RD.monture, 1.4); strokePts([[16, -57], [21, -59]], 'rgba(255,240,210,0.7)', 1.2);
      }, extra: () => {                                                                                   // bouc taillé (déborde un peu du menton, sans liseré)
        fillPts(RD_BOUC, RD.cheveux, 0, 0); strokePts([[21, -26], [19, -17]], RD.cheveux, 2.4);
        strokePts([[18, -10], [26, -12]], 'rgba(120,110,120,0.5)', 1);
      } },
      cheveux: { parent: 'head', at: [0, 0], pts: RD_HAIR, base: RD.cheveux, seed: 11007, noRivet: true, paint: () => {
        for (const [a, b] of [[[40, -96], [10, -92]], [[22, -106], [-12, -96]], [[-4, -102], [-30, -84]], [[-14, -86], [-34, -64]]]) strokePts([a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 3], b], 'rgba(120,110,120,0.45)', 1.3);
        hatch(null, 0.5, 3.4, 0.22);
      } },
      // casque tenu ou porté : pièce du torse, position calculée par la pose (q._casque = {x, y, a, v})
      casqueT: { parent: 'torso', at: [0, 0], noRivet: true, base: '#000', seed: 11020, pts: OFFP, extra: (p) => {
        const k = p._casque; if (!k) return; const c = cx_();
        c.save(); c.translate(k.x, k.y); c.rotate(k.a); drawCasqueProfil({ visiere: k.v }); c.restore();
      } },
      armF_up: upDef([-2, -146], RD.costume, 11009),
      armF_lo: foreDef('armF_up', RD.costume, RD.peau, false, 11010, { cuff: RD.chemise }),
    };
    Object.assign(parts, legParts(L, 11030), heldParts(RD.peau, 11040));
    return { hipY: -(L.th + L.sh + 14), parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, order: ORDER(['cheveux'], ['casqueT']), nom: 'robert', _legs: L,
      _after: (r, q) => {
        if (q._charge) { const a = r.w('armF_lo', 0, 120), b = r.w('armB_lo', 0, 120); r.charge = [(a[0] + b[0]) / 2, Math.min(a[1], b[1]) + 4 * r.s]; }
        const nu = k01(q.nuage); if (nu > 0 && !SIL()) nuage(r, q, nu);
      } };
  }
  // petit nuage noir pendu à un fil au-dessus de la tête (dessiné après la marionnette, sans ombre)
  function nuage(r, q, k) {
    const t = q.t || 0, s = r.s, h = r.w('head', 0, -100), c = cx_(), sp = M.spring ? clamp(M.spring(k * 0.6, 0.5, 14), 0, 1.3) : k;
    const x = h[0] + 6 * Math.sin(t * 1.3) * s, y = h[1] - 120 * s + 4 * Math.sin(t * 2.1) * s, sc = s * 0.9 * sp;
    c.save(); c.strokeStyle = 'rgba(20,15,10,0.7)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, y - 30 * sc); c.lineTo(x + 8, -50); c.stroke();
    c.translate(x, y); c.scale(sc, sc);
    pc([[-62, 18], [-66, 0], [-50, -16], [-34, -14], [-26, -34], [-2, -40], [16, -30], [30, -38], [52, -26], [56, -6], [68, 4], [62, 20, 1]], '#2b2a30', () => {
      strokePts([[-44, -6], [-30, -12], [-14, -24], [8, -26]], 'rgba(255,255,255,0.18)', 2); hatch(null, 0.8, 3.6, 0.3);
    }, 11090);
    for (let i = 0; i < 3; i++) { const u = ((t * 1.4 + i * 0.33) % 1); strokePts([[-30 + i * 28, 24 + u * 40], [-33 + i * 28, 34 + u * 40]], `rgba(60,70,90,${0.7 * (1 - u)})`, 2); }
    c.restore();
  }
  CH.dowRobert = mkRobert();
  // trajet du casque (repère du torse) : 0 = tenu devant la poitrine, 0,45 = levé au-dessus de la tête, 0,75 = posé sur la tête, 1 = mains redescendues
  function casquePos(q, def, k) {
    const H = def.parts.head.at, ah = headRot(q, def);
    const P0 = [70, -62], a0 = 0.1, P1 = [26, -300], a1 = -0.05, P2 = [H[0], H[1]];
    const u1 = ease(smooth(0, 0.45, k)), u2 = ease(smooth(0.45, 0.75, k));
    const P = lerpP(lerpP(P0, P1, u1), P2, u2), a = lerp(lerp(a0, a1, u1), ah, u2);
    return { x: P[0], y: P[1], a };
  }
  DOW.robertPose = function (q, env) {
    const def = CH.dowRobert, A = q.ang, t = q.t || 0;
    const rv = k01(q.reverence), te = k01(q.tendre), po = k01(q.porte), br = k01(q.bras), so = k01(q.soupese), ma = k01(q.marche);
    marche(q, ma, t);
    if (te > 0) { tendVers(q, env, def, 'armF', q.cible, [180, -105], te, 0.45); if (te > 0.4 && !has(q.tenu)) q.handF = 'open'; A.head = (A.head || 0) + 0.06 * te; }
    if (so > 0) { const b = 0.2 * Math.max(0, Math.sin(t * TAU * 1.6)); blend(q, 'armF_up', -0.3 - b * 0.4, so); blend(q, 'armF_lo', -1.45 - b, so); if (!has(q.tenu)) q.handF = 'open'; A.head = (A.head || 0) + 0.12 * so; }
    if (br > 0) { blend(q, 'armF_up', -1.75, br); blend(q, 'armF_lo', -0.25, br); blend(q, 'armB_up', 1.7, br); blend(q, 'armB_lo', -0.22, br); A.head = (A.head || 0) - 0.1 * br; if (br > 0.4) { q.handF = has(q.tenu) ? q.handF : 'open'; q.handB = has(q.tenuB) ? q.handB : 'open'; } }
    if (po > 0) { armTo(q, def, 'armF', [42, -318], 'avant', po); armTo(q, def, 'armB', [12, -322], 'avant', po); A.head = (A.head || 0) - 0.16 * po; if (po > 0.4) { q.handF = 'open'; q.handB = 'open'; } q._charge = true; }
    if (rv > 0) { plier(q, def, 0.55 * rv); A.head = (A.head || 0) + 0.3 * rv; blend(q, 'armF_up', -0.3, rv); blend(q, 'armF_lo', -1.7, rv); blend(q, 'armB_up', 1.0, rv); blend(q, 'armB_lo', -0.2, rv); if (!has(q.tenuB)) q.handB = 'open'; if (!has(q.tenu)) q.handF = 'open'; }
    q._casque = null;
    if (q.casque != null && q.casque !== false) {
      const k = q.casque === true ? 1 : clamp(q.casque), C = casquePos(q, def, k);
      q._casque = { x: C.x, y: C.y, a: C.a, v: q.visiere == null ? 1 : q.visiere };
      const w = 1 - smooth(0.7, 0.95, k);
      if (w > 0) {
        const m = new DOMMatrix().translate(C.x, C.y).rotate(C.a * D);
        armTo(q, def, 'armF', mp(m, [26, -104]), 'avant', w); armTo(q, def, 'armB', mp(m, [-22, -114]), 'avant', w);
        if (w > 0.5) { q.handF = 'fist'; q.handB = 'fist'; }
      }
      if (k >= 0.74) q.hide.cheveux = 1;
    }
  };
  DOW.robert = wrap(CH.dowRobert, DOW.robertPose, 0.9);

  // =====================================================================
  // L'ASSUREUR — grand, maigre, voûté ; visière de comptable verte, cheveux gris plaqués, moustache en trait de crayon, nœud papillon bordeaux,
  // gilet gris souris sur chemise blanche, manchettes de lustrine noires, pantalon anthracite ; parapluie noir à crosse
  // =====================================================================
  const AS = { peau: '#e6cdb4', peauD: '#c9ad94', chemise: '#f0ece2', chemiseD: '#d2cdc0', gilet: '#8a8a84', giletD: '#727270', noeud: '#5e1f2a', lustrine: '#1f1f23',
    pant: '#3e3f44', pantD: '#323337', chaussure: '#1a1717', cheveux: '#a3a39d', visiere: 'rgba(70,104,64,0.72)', visiereD: '#33492f' };
  const AS_TORSO = [[-12, -180], [10, -184], [19, -172], [25, -152], [28, -112], [28, -62], [27, -14], [29, 24], [30, 38, 1], [-30, 40, 1], [-31, 10], [-29, -40], [-32, -96], [-39, -134], [-37, -164], [-26, -178]];
  const AS_HEAD = [[-12, 18], [8, 18], [10, 6], [16, -2], [24, -6], [28, -14], [27, -22], [29, -27], [28, -32], [31, -37], [38, -46, 1], [32, -52], [28, -60], [29, -70], [27, -84], [16, -98], [-4, -104], [-22, -97], [-31, -78], [-30, -52], [-23, -32], [-15, -10]];
  const AS_HAIR = [[28, -82], [24, -98], [8, -110], [-12, -110], [-30, -100], [-38, -78], [-38, -56], [-30, -44], [-25, -50], [-22, -66], [-8, -80], [12, -84]];
  const AS_EXPR = { neutre: { bouche: 'serre' }, mefiant: { lid: 0.55, fronce: 0.7, bouche: 'serre', look: [0.6, 0] }, effraye: { wide: true, leve: 1.2, fronce: -0.8, bouche: 'o' }, satisfait: { lid: 0.35, bouche: 'coin', leve: 0.2 }, boucheBee: { wide: true, leve: 1.3, bouche: 'bee', jaw: 11 }, degu: { bouche: 'moue', fronce: -0.5, lid: 0.3 } };
  function mkAssureur() {
    const L = { th: 126, sh: 118, hx: 5, wt: 14, kt: 10, ak: 8, fl: 46, col: AS.pant, colD: AS.pantD, shoe: AS.chaussure, shoeD: '#0f0d0d',
      thighPaint: (back) => { if (!back) strokePts([[8, 4], [9, 120]], 'rgba(255,255,255,0.14)', 1.2); },
      shoePaint: (back) => { strokePts([[8, 3], [34, 7]], back ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.28)', 1.5); fillPts(box(-16, 13, 47, 17), '#060505'); } };
    const sleeve = (back) => () => { strokePts([[6, 10], [8, 90]], 'rgba(150,145,130,0.5)', 1.2); hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, back ? 0.32 : 0.22); };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: AS_TORSO, base: AS.chemise, seed: 12001, paint: () => {
        fillPts([[-26, -172], [-6, -176], [2, -150], [14, -132], [26, -150], [28, -112], [28, -62], [27, -14], [29, 24], [30, 40], [-32, 40], [-31, 10], [-29, -40], [-32, -96], [-39, -134], [-36, -160]], AS.gilet);   // gilet
        strokePts([[14, -132], [26, 0], [24, 30]], 'rgba(40,40,40,0.55)', 1.3); for (const y of [-112, -84, -56, -28, 0]) dot(18 + (y + 132) * 0.055, y, 2.1, '#4e4e4b');
        fillPts([[18, -110], [26, -112], [26, -104], [18, -102]], AS.giletD);
        strokePts([[-6, -60], [6, -64], [14, -58]], LAITON, 1.4);                                           // chaîne de montre
        fillPts([[10, -176], [20, -184], [21, -170], [14, -172], [21, -164], [20, -152]], AS.noeud); dot(14, -172, 3, '#4a1820');   // nœud papillon
        hatch([[-44, -172], [-12, -172], [-10, 40], [-44, 40]], 0.75, 4.2, 0.3);
        shade(30, 0, -36, 0, 0.26);
      } },
      armB_up: upDef([-8, -150], AS.chemiseD, 12004, 13, sleeve(true)),
      armB_lo: foreDef('armB_up', AS.chemiseD, AS.peauD, true, 12005, { manchette: '#18181b' }),
      head: { parent: 'torso', at: [10, -178], rest: 0.1, pts: AS_HEAD, base: AS.peau, seed: 12006, noRivet: true, paint: (p) => {
        fillPts(AS_HAIR, AS.cheveux, 0, 0);                                                               // cheveux gris plaqués (dans la tête : pas de liseré de calotte)
        for (let i = 0; i < 7; i++) strokePts(qbez([26 - i * 2, -88 + i * 2.6], [-2, -104 + i * 5], [-32, -80 + i * 6], 8), 'rgba(60,60,58,0.55)', 1);
        strokePts([[22, -94], [-4, -104], [-24, -98]], 'rgba(245,245,240,0.6)', 1.3);
        fillPts([[18, -80], [40, -74], [36, -60], [16, -64]], 'rgba(60,95,55,0.28)', 0, 0);               // ombre verte de la visière sur le front
        X.earPaint(-8, -46);
        strokePts([[4, -40], [12, -20], [8, -8]], 'rgba(130,90,75,0.3)', 1.2);
        hatch([[-22, -44], [2, -34], [10, -12], [-6, 14], [-30, 4]], 0.6, 3.6, 0.22);
        const e = visage(p, AS_EXPR, { ox: 18, oy: -56, bx: 28, by: -26 }, { iris: '#6f8191', peau: AS.peau, brow: 'rgba(110,108,100,0.95)', lw: 2.6 });
        strokePts([[22, -32], [33, -33]], 'rgba(60,58,55,0.95)', 1.7);                                     // moustache en trait de crayon
        if (e.bouche !== 'bee') strokePts([[24, -16], [20, -12]], 'rgba(140,100,85,0.35)', 1);
        fillPts([[-12, -60], [-4, -84], [-1, -83], [-9, -58]], '#c9a24a'); fillPts([[-4, -84], [-1, -83], [-1, -88]], '#2b2420');   // crayon sur l'oreille
      } },
      visiere: { parent: 'head', at: [0, 0], noRivet: true, seed: 12008, base: AS.visiere, texA: 0.25,
        pts: [[24, -86], [40, -84], [56, -78], [57, -74, 1], [36, -76], [26, -79]], paint: () => { strokePts([[28, -83], [54, -77]], 'rgba(200,235,190,0.45)', 1.2); },
        extra: () => { strokePts([[25, -83], [4, -86], [-20, -84], [-34, -74]], AS.visiereD, 2.4); fillPts([[24, -78], [34, -76], [30, -66], [22, -68]], 'rgba(60,90,55,0.22)', 0, 0); } },
      armF_up: upDef([0, -150], AS.chemise, 12009, 13, sleeve(false)),
      armF_lo: foreDef('armF_up', AS.chemise, AS.peau, false, 12010, { manchette: AS.lustrine }),
    };
    Object.assign(parts, legParts(L, 12030), heldParts(AS.peau, 12040));
    return { hipY: -(L.th + L.sh + 14), parts, handLen: 100, rod: { part: 'torso', at: [-22, 18] }, order: ORDER(['visiere']), nom: 'assureur', _legs: L,
      _after: (r, q) => {
        r.obstacle = null;
        if (q.tenu === 'parapluie') {
          const h = DOW.pt(r, 'haut'), k = (r.tenuO && r.tenuO.ouvert) || 0, tl = (r.tenuO && r.tenuO.taille) || 1;
          r.haut = h; if (q._debout && k > 0.4) r.obstacle = { x: h[0], y: h[1], r: parapluieGeo(k).w * r.s * tl };
        }
      } };
  }
  CH.dowAssureur = mkAssureur();
  DOW.assureurPose = function (q, env) {
    const def = CH.dowAssureur, A = q.ang, t = q.t || 0;
    const ou = k01(q.ouvert), bc = k01(q.bouclier), ta = k01(q.tamponne), ef = k01(q.effraye), as = k01(q.assis), ma = k01(q.marche);
    const ferme = q.parapluie === 'ferme' || q.parapluie === true;
    if ((ferme || ou > 0 || bc > 0) && q.tenu == null) q.tenu = 'parapluie';
    if (q.expr == null && ef > 0.3) q.expr = 'effraye';
    marche(q, ma, t, 0.3);
    assis(q, env, as);
    const libreF = A.armF_up == null && A.armF_lo == null;
    if (q.tenu === 'parapluie') {
      const o = q.tenuO = Object.assign({}, q.tenuO);
      const leve = ferme ? smooth(0, 0.35, ou) : (ou > 0 ? 1 : 0);
      o.ouvert = Math.max(ferme ? smooth(0.35, 1, ou) : ou, smooth(0, 0.4, bc));
      const flip = ferme && bc <= 0 ? PI * (1 - leve) : 0;
      if (ferme && libreF && ou <= 0 && bc <= 0 && as <= 0) armTo(q, def, 'armF', [58, -def.hipY - (q.dy || 0) - (PS + 20) - 4], 'bas', 1);   // pointe au sol, main sur la crosse
      if (ou > 0 && libreF) { armTo(q, def, 'armF', [72, -248], 'avant', ferme ? ease(smooth(0, 0.4, ou)) : 1); A.head = (A.head || 0) - 0.06 * ou; }
      if (bc > 0) {
        armTo(q, def, 'armF', [44, -66], 'bas', bc); q.deuxMains = q.deuxMains == null ? bc > 0.5 : q.deuxMains;
        plier(q, def, 0.08 * bc); q.dy = (q.dy || 0) + 6 * bc; A.head = (A.head || 0) - 0.12 * bc;
      }
      A.objet = (A.objet || 0) + flip + (PI / 2) * ease(smooth(0, 0.5, bc));
      q._debout = bc < 0.3;
    }
    if (ef > 0) { q.tilt = (q.tilt || 0) - 0.07 * ef; q.dx = (q.dx || 0) - 10 * ef; A.head = (A.head || 0) - 0.08 * ef;
      if (q.tenu !== 'parapluie' || ou <= 0 && bc <= 0) { if (!has(q.tenu)) { blend(q, 'armF_up', -0.75, ef); blend(q, 'armF_lo', -1.3, ef); q.handF = 'open'; } }
      if (!has(q.tenuB) && bc <= 0.5) { blend(q, 'armB_up', -0.55, ef); blend(q, 'armB_lo', -1.25, ef); q.handB = 'open'; } }
    if (ta > 0) {
      const T = q.cible ? toTorso(env, q, q.cible) : [74, -30], lift = q.frappe != null ? clamp(q.frappe) : 0.5 + 0.5 * Math.cos(t * TAU * 1.4);
      armTo(q, def, 'armF', [T[0], T[1] - (q.sous == null ? 40 : q.sous) - 70 * lift], 'bas', ta); A.head = (A.head || 0) + 0.14 * ta;
    }
  };
  DOW.assureur = wrap(CH.dowAssureur, DOW.assureurPose, 0.9);

  // =====================================================================
  // KEVIN FEIGE — jeune, mince, cheveux châtains courts, rasé, lunettes noires rectangulaires, cardigan ocre sur chemise blanche, pantalon gris clair, baskets blanches
  // =====================================================================
  const FG = { peau: '#e8c4a2', peauD: '#cba585', cardigan: '#9a7234', cardiganD: '#7f5d29', cardiganL: '#ad8546', chemise: '#f1ede4', pant: '#b1b1ac', pantD: '#9a9a94',
    basket: '#ecebe5', basketD: '#cfcdc5', cheveux: '#6b4a2e', monture: '#141416' };
  const FG_TORSO = [[-13, -176], [8, -180], [17, -168], [25, -150], [30, -112], [30, -62], [28, -14], [30, 24], [31, 38, 1], [-31, 40, 1], [-33, 10], [-31, -40], [-33, -110], [-31, -150], [-24, -168]];
  const FG_HEAD = [[-13, 16], [9, 16], [12, 4], [18, -4], [26, -8], [29, -14], [28, -20], [30, -25], [29, -29], [32, -34], [37, -41, 1], [32, -47], [29, -55], [30, -64], [28, -77], [16, -91], [-5, -97], [-24, -90], [-32, -70], [-31, -46], [-24, -28], [-16, -8]];
  const FG_HAIR = [[29, -72], [32, -84], [26, -96], [10, -104], [-10, -104], [-27, -96], [-36, -80], [-37, -60], [-32, -48], [-26, -56], [-18, -68], [0, -76], [18, -78]];
  const FG_EXPR = { neutre: { bouche: 'n' }, resolu: { fronce: 0.6, bouche: 'serre', lid: 0.15 }, sourire: { bouche: 'sourire', leve: 0.2 }, ravi: { heureux: true, bouche: 'rire', leve: 0.6 } };
  function mkFeige() {
    const L = { th: 116, sh: 108, hx: 5, wt: 15, kt: 11, ak: 8, fl: 46, col: FG.pant, colD: FG.pantD, shoe: FG.basket, shoeD: FG.basketD,
      thighPaint: (back) => { if (!back) strokePts([[8, 4], [9, 108]], 'rgba(255,255,255,0.22)', 1.2); },
      shoePaint: (back) => { fillPts(box(-16, 11, 47, 17), back ? '#a9a8a2' : '#c2c1ba'); strokePts([[4, 2], [22, 4]], '#9d9c96', 1.6); } };
    const sleeve = (back) => () => { for (let x = -12; x <= 12; x += 6) strokePts([[x, 4], [x, 92]], 'rgba(90,65,20,0.22)', 1); hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, back ? 0.32 : 0.22); };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: FG_TORSO, base: FG.cardigan, seed: 13001, paint: () => {
        for (let x = -30; x <= 28; x += 6) strokePts([[x, -168], [x, 36]], 'rgba(90,65,20,0.18)', 1);                 // côtes du tricot
        fillPts([[0, -180], [12, -177], [22, -160], [27, -120], [28, -62], [26, -14], [28, 24], [16, 24], [14, -60], [10, -120], [4, -160]], FG.chemise);   // chemise (cardigan ouvert)
        strokePts([[4, -178], [11, -166], [17, -174]], '#d8d2c4', 1.6);
        for (const y of [-120, -80, -40, 0]) dot(22 - (y + 120) * 0.02, y, 1.6, '#cfc8b8');
        strokePts([[4, -160], [10, -120], [14, -60], [16, 24]], 'rgba(80,55,15,0.7)', 1.6);
        for (const y of [-110, -70, -30, 10]) dot(10 + (y + 110) * 0.04, y, 2.3, '#5a4318');
        fillPts(box(-33, 24, 31, 40), FG.cardiganD); for (let x = -30; x <= 28; x += 4) strokePts([[x, 25], [x, 39]], 'rgba(60,40,10,0.3)', 1);
        hatch([[-46, -168], [-12, -168], [-10, 40], [-46, 40]], 0.75, 4.2, 0.28);
        shade(30, 0, -36, 0, 0.26);
      } },
      armB_up: upDef([-10, -146], FG.cardiganD, 13004, 14, sleeve(true)),
      armB_lo: foreDef('armB_up', FG.cardiganD, FG.peauD, true, 13005, { manchon: '#7d6228' }),
      head: { parent: 'torso', at: [6, -170], pts: FG_HEAD, base: FG.peau, seed: 13006, noRivet: true, paint: (p) => {
        X.earPaint(-8, -44);
        hatch([[-22, -42], [2, -32], [10, -12], [-6, 14], [-32, 4]], 0.6, 3.6, 0.2);
        visage(p, FG_EXPR, { ox: 19, oy: -52, bx: 28, by: -23 }, { iris: '#6a5236', peau: FG.peau, brow: 'rgba(80,55,35,0.95)', lw: 2.8 });
        fillPts([[10, -58], [30, -58], [30, -46], [10, -46]], 'rgba(200,220,235,0.16)', 0, 0);
        strokePts([[10, -58], [30, -58], [30, -46], [10, -46]], FG.monture, 1.9, true);            // lunettes noires rectangulaires (verres clairs)
        strokePts([[10, -55], [-8, -54]], FG.monture, 1.6);
        strokePts([[13, -12], [22, -8]], 'rgba(150,100,80,0.3)', 1.1);
      } },
      cheveux: { parent: 'head', at: [0, 0], pts: FG_HAIR, base: FG.cheveux, seed: 13007, noRivet: true, paint: () => {
        for (const [a, b] of [[[26, -88], [0, -98]], [[6, -96], [-22, -92]], [[-18, -88], [-34, -68]]]) strokePts([a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 2], b], 'rgba(170,130,90,0.45)', 1.2);
        hatch(null, 0.5, 3.4, 0.2);
      } },
      armF_up: upDef([-2, -146], FG.cardigan, 13009, 14, sleeve(false)),
      armF_lo: foreDef('armF_up', FG.cardigan, FG.peau, false, 13010, { manchon: FG.cardiganD }),
    };
    Object.assign(parts, legParts(L, 13030), heldParts(FG.peau, 13040));
    return { hipY: -(L.th + L.sh + 14), parts, handLen: 100, rod: { part: 'torso', at: [-24, 18] }, order: ORDER(['cheveux']), nom: 'feige', _legs: L };
  }
  CH.dowFeige = mkFeige();
  DOW.feigePose = function (q, env) {
    const def = CH.dowFeige, A = q.ang, t = q.t || 0;
    const cl = k01(q.claque), pr = k01(q.presente), te = k01(q.tendre), ins = clamp(q.insiste || 0), ap = k01(q.applaudit), ma = k01(q.marche);
    if ((q.clap || cl > 0) && q.tenu == null) q.tenu = 'clap';
    if (te > 0 && q.objet != null && q.tenu == null) q.tenu = q.objet;
    marche(q, ma, t, 0.32);
    const libreF = A.armF_up == null && A.armF_lo == null;
    if (q.tenu === 'clap' && libreF && cl <= 0 && te <= 0) { A.armF_up = -0.3; A.armF_lo = -0.55; }
    if (cl > 0) {
      const o = q.tenuO = Object.assign({}, q.tenuO);
      if (o.barre == null) o.barre = 0.72 * smooth(0, 0.3, cl) * (1 - smooth(0.78, 0.92, q.claque));
      armTo(q, def, 'armF', [122, -116], 'bas', cl); if (cl > 0.3) q.deuxMains = true;
      A.head = (A.head || 0) + 0.05 * cl;
    }
    if (pr > 0) { tendVers(q, env, def, 'armF', q.cible, [190, -110], pr, 0.3); if (!has(q.tenu)) q.handF = 'open'; }
    if (te > 0) { tendVers(q, env, def, 'armF', q.cible, [190, -120], te, 0.4); }
    if (ins > 0) { const u = Math.sin(PI * ins); blend(q, 'armF_up', -1.95, u); blend(q, 'armF_lo', -1.05, u); q.handF = has(q.tenu) ? q.handF : 'fist'; A.head = (A.head || 0) - 0.06 * u; if (!q.expr) q.expr = 'resolu'; }
    applaudir(q, def, ap, t, -104);
  };
  DOW.feige = wrap(CH.dowFeige, DOW.feigePose, 0.9);

  // =====================================================================
  // DIRIGEANTS — A : âgé, couronne de cheveux blancs, costume beige sable, cravate vert éteint, ventre rond ;
  //              B : crâne dégarni brun, lunettes rondes cerclées d'or, costume bleu marine rayé, cravate rouge brique
  // =====================================================================
  const DI = {
    a: { costume: '#b9a77f', costumeD: '#9e8d67', cravate: '#4f6b4a', cheveux: '#ebe7dc', peau: '#e7c2a2', peauD: '#cba383', pant: '#a99772', pantD: '#8f7f5e', chaussure: '#4a3424', raie: null },
    b: { costume: '#2b3550', costumeD: '#222a40', cravate: '#9a4a35', cheveux: '#5a3d28', peau: '#dcb48f', peauD: '#bf9672', pant: '#2b3550', pantD: '#222a40', chaussure: '#151314', raie: 'rgba(205,210,225,0.3)' },
  };
  const DI_TORSO = { a: [[-13, -166], [8, -170], [20, -160], [33, -140], [46, -108], [54, -70], [55, -36], [49, -6], [38, 16], [26, 26, 1], [-34, 26, 1], [-41, 0], [-40, -60], [-38, -112], [-32, -146], [-24, -160]],
    b: [[-13, -168], [8, -172], [19, -162], [29, -144], [38, -110], [43, -70], [42, -34], [38, -4], [32, 18], [28, 26, 1], [-34, 26, 1], [-39, 0], [-38, -60], [-37, -112], [-32, -148], [-24, -162]] };
  const DI_HEAD = [[-15, 18], [10, 18], [14, 8], [22, 2], [29, -5], [31, -13], [29, -20], [31, -25], [30, -29], [33, -33], [39, -40, 1], [34, -46], [30, -54], [31, -64], [28, -78], [15, -92], [-6, -97], [-25, -90], [-34, -70], [-34, -46], [-27, -26], [-21, -6]];
  const DI_EXPR = { neutre: { bouche: 'n' }, inquiet: { fronce: -0.9, leve: 0.5, bouche: 'moue', look: [0.6, -0.5] }, soulage: { lid: 0.35, bouche: 'sourire', leve: 0.2 }, ravi: { heureux: true, bouche: 'rire', leve: 0.7 } };
  function mkDirigeant(k) {
    const C = DI[k];
    const L = { th: 116, sh: 108, hx: 6, wt: 18, kt: 13, ak: 9, fl: 46, col: C.pant, colD: C.pantD, shoe: C.chaussure, shoeD: '#0f0d0d',
      thighPaint: (back) => { if (C.raie) for (const x of [-10, -2, 6, 14]) strokePts([[x, 0], [x * 0.9, 110]], C.raie, 0.9); else if (!back) strokePts([[9, 4], [10, 104]], 'rgba(255,255,255,0.2)', 1.2); },
      shinPaint: () => { if (C.raie) for (const x of [-8, 0, 8]) strokePts([[x, 0], [x, 100]], C.raie, 0.9); },
      shoePaint: (back) => { strokePts([[8, 3], [34, 7]], back ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.28)', 1.5); fillPts(box(-16, 13, 47, 17), '#0b0909'); } };
    const sleeve = (back) => () => { if (C.raie) for (const x of [-10, -3, 4, 11]) strokePts([[x, -10], [x, 100]], C.raie, 0.9); hatch([[-18, -20], [-3, -20], [-3, 100], [-18, 100]], 0.9, 3.8, back ? 0.32 : 0.22); };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: DI_TORSO[k], base: C.costume, seed: 14001, paint: () => {
        if (C.raie) for (let x = -40; x <= 56; x += 8) strokePts([[x, -168], [x + 2, 26]], C.raie, 0.9);
        fillPts([[1, -172], [13, -168], [18, -152], [10, -134], [4, -150]], '#efe9dc');
        fillPts([[8, -164], [14, -162], [k === 'a' ? 26 : 22, -60], [k === 'a' ? 22 : 18, -46], [k === 'a' ? 16 : 14, -60], [8, -150]], C.cravate);
        fillPts([[0, -166], [8, -150], [16, -104], [24, -114], [16, -152], [9, -168]], C.costumeD);
        strokePts([[16, -104], [k === 'a' ? 36 : 28, -40], [k === 'a' ? 34 : 30, 20]], 'rgba(30,25,20,0.55)', 1.4);
        for (const y of [-70, -36]) dot(k === 'a' ? 40 : 31, y, 2.3, k === 'a' ? '#6e5f40' : '#121626');
        fillPts([[-6, -124], [10, -124], [10, -118], [-6, -118]], C.costumeD);
        hatch([[-50, -160], [-14, -160], [-12, 26], [-50, 26]], 0.75, 4.2, 0.28);
        shade(k === 'a' ? 50 : 38, -40, -40, -40, 0.3, [-56, -172, 60, 30]);
      } },
      armB_up: upDef([-10, -140], C.costumeD, 14004, 17, sleeve(true)),
      armB_lo: foreDef('armB_up', C.costumeD, C.peauD, true, 14005, { cuff: '#ddd6c6' }),
      head: { parent: 'torso', at: [6, -167], pts: DI_HEAD, base: C.peau, seed: 14006, noRivet: true, paint: (p) => {
        X.earPaint(-10, -44);
        if (k === 'a') { strokePts([[8, -2], [24, 6]], 'rgba(150,100,80,0.45)', 1.3); strokePts([[18, -40], [24, -30]], 'rgba(150,100,80,0.4)', 1.1); for (const y of [-78, -72]) strokePts([[2, y], [20, y + 1]], 'rgba(150,100,80,0.3)', 1); }
        dot(16, -32, 9, 'rgba(210,120,100,0.25)');
        hatch([[-24, -42], [2, -32], [10, -12], [-6, 14], [-32, 4]], 0.6, 3.6, 0.2);
        visage(p, DI_EXPR, { ox: 20, oy: -54, bx: 30, by: -22 }, { iris: k === 'a' ? '#6f7f8f' : '#4a3424', peau: C.peau, brow: k === 'a' ? 'rgba(235,232,222,1)' : 'rgba(60,40,26,0.95)', lw: k === 'a' ? 4 : 2.8 });
        if (k === 'a') strokePts([[23, -32], [33, -33]], 'rgba(235,232,222,1)', 3);
        if (k === 'b') { const ring = ell(20, -53, 9, 9, 16); fillPts(ring, 'rgba(210,230,240,0.2)', 0, 0); strokePts(ring.concat([ring[0]]), '#c9a24a', 1.8); strokePts([[11, -54], [-10, -54]], '#c9a24a', 1.5); }
        strokePts([[-4, -94], [16, -90]], 'rgba(255,255,255,0.35)', 2.5);                                   // reflet du crâne
      } },
      cheveux: { parent: 'head', at: [0, 0], noRivet: true, base: C.cheveux, seed: 14007,
        pts: k === 'a' ? [[-6, -76], [-24, -80, 1], [-38, -72], [-42, -54], [-38, -36], [-30, -30], [-26, -42], [-22, -58], [-14, -64]] : [[-12, -72], [-28, -76, 1], [-37, -64], [-37, -46], [-31, -38], [-26, -46], [-22, -60]],
        paint: () => hatch(null, 0.5, 3, k === 'a' ? 0.12 : 0.22) },
      armF_up: upDef([-2, -140], C.costume, 14009, 17, sleeve(false)),
      armF_lo: foreDef('armF_up', C.costume, C.peau, false, 14010, { cuff: '#efe9dc' }),
    };
    Object.assign(parts, legParts(L, 14030), heldParts(C.peau, 14040));
    return { hipY: -(L.th + L.sh + 14), parts, handLen: 100, rod: { part: 'torso', at: [-24, 12] }, order: ORDER(['cheveux']), nom: 'dirigeant' + k.toUpperCase(), _legs: L };
  }
  CH.dowDirigeantA = mkDirigeant('a');
  CH.dowDirigeantB = mkDirigeant('b');
  function dirigeantPose(def) {
    return function (q, env) {
      const A = q.ang, t = q.t || 0;
      const tr = k01(q.tremble), mj = k01(q.mainsJointes), ap = k01(q.applaudit), co = k01(q.compte), ma = k01(q.marche);
      marche(q, ma, t, 0.3);
      if (tr > 0) {
        const w = Math.sin(t * TAU * 9), g = Math.sin(t * TAU * 7);
        q.dx = (q.dx || 0) + 2.4 * w * tr; q.dy = (q.dy || 0) + 1.5 * Math.abs(g) * tr;
        A.legF_up = (A.legF_up || 0) + 0.07 * g * tr; A.legB_up = (A.legB_up || 0) - 0.07 * g * tr;
        A.legF_lo = (A.legF_lo || 0) + 0.06 * (1 + g) * tr; A.legB_lo = (A.legB_lo || 0) + 0.06 * (1 - g) * tr;
        A.head = (A.head || 0) + 0.035 * Math.sin(t * TAU * 11) * tr; if (!q.expr) q.expr = 'inquiet';
      }
      if (mj > 0) { armTo(q, def, 'armF', [44, -104], 'bas', mj); armTo(q, def, 'armB', [38, -100], 'bas', mj); if (mj > 0.4) { q.handF = 'fist'; q.handB = 'fist'; } }
      applaudir(q, def, ap, t, -96);
      if (co > 0) { const T = q.cible ? toTorso(env, q, q.cible) : [86, 30]; armTo(q, def, 'armF', [T[0], T[1] - 100 - 16 * Math.max(0, Math.sin(t * TAU * 2.2))], 'bas', co); if (!has(q.tenu)) q.handF = 'open'; A.head = (A.head || 0) + 0.14 * co; }
    };
  }
  const dirA = wrap(CH.dowDirigeantA, dirigeantPose(CH.dowDirigeantA), 0.85), dirB = wrap(CH.dowDirigeantB, dirigeantPose(CH.dowDirigeantB), 0.85);
  DOW.dirigeant = (pose, x, y, s, o) => ((pose && pose.tenue === 'b') ? dirB : dirA)(pose, x, y, s, o);

  // =====================================================================
  // ACCESSOIRES SEULS — M.puppet à une pièce invisible ; l'objet se dessine dans l'extra (ombre portée possible)
  // =====================================================================
  const accDefs = {}, EXTRA = {};
  function accDef(name, fn) { return accDefs[name] || (accDefs[name] = { hipY: 0, handLen: 10, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => fn(p.o) } }, order: ['o'] }); }
  function acc(name, x, y, s, o) {
    o = o || {}; s = s == null ? 1 : s;
    const ob = OBJ[name] || EXTRA[name];
    const def = accDef(name, (oo) => { const c = cx_(), b = vOf(ob.base, oo); c.save(); c.translate(-b[0], -b[1]); ob.draw(oo); c.restore(); });
    return M.puppet(def, { o: Object.assign({ t: o.t || 0 }, o), tilt: o.rot || 0 }, x, y, s, { dir: o.dir || 1, rod: false, slot: o.slot != null ? o.slot : y + 6 * s, floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
  }
  DOW.parapluie = (x, y, s, o) => acc('parapluie', x, y, s, o);
  DOW.clap = (x, y, s, o) => acc('clap', x, y, s, o);
  DOW.sac = (x, y, s, o) => { o = o || {}; return acc('sac', x, y, (s == null ? 1 : s) * (o.taille || 1), o); };
  DOW.bobine = (x, y, s, o) => acc('bobine', x, y, s, o);
  DOW.casque = (x, y, s, o) => acc('casque', x, y, s, o);
  EXTRA.pile = { draw: drawPile, base: [0, 0] };
  DOW.pile = function (t, o) {
    o = o || {}; const s = o.s == null ? 1 : o.s, x = o.x == null ? 540 : o.x, y = o.y == null ? 1420 : o.y, n = o.n == null ? 8 : o.n;
    acc('pile', x, y, s, Object.assign({}, o, { t, n, s: undefined, x: undefined, y: undefined }));
    const full = Math.floor(n), sw = (o.oscille || 0) * 0.025 * Math.sin(t * 3.1);
    return { dessus: [x + sw * full * PILE_H * s * (o.dir || 1), y - (full * PILE_H + 8) * s], hauteur: full * PILE_H * s };
  };
  // ---------------- armure sur portant (vue de face) ; (x,y) = sol sous le pied du portant ; o.casque (true) ; o.lueur 0..1 ; o.up (décalage vers les cintres, câbles)
  function drawArmure(o) {
    const lu = clamp(o.lueur || 0), c = cx_();
    if ((o.up || 0) > 0) { c.save(); c.strokeStyle = 'rgba(20,15,10,0.65)'; c.lineWidth = 2; c.beginPath(); for (const sx of [-116, 116]) { c.moveTo(sx, -418); c.lineTo(sx * 0.9, -3200); } c.stroke(); c.restore(); }
    pc([[-96, -14], [96, -14], [100, 0, 1], [-100, 0, 1]], '#6e4a2a', () => hatch(null, 0.1, 4, 0.25), 8001);
    pc(box(-7, -470, 7, -12), '#7a5532', () => { strokePts([[-3, -466], [-3, -14]], 'rgba(255,220,180,0.3)', 1.2); hatch(null, 1.4, 4, 0.2); }, 8002);
    pc(box(-122, -428, 122, -414), '#7a5532', () => hatch(null, 0.1, 4, 0.2), 8003);
    for (const sx of [-1, 1]) {                                                                    // jambes pendantes
      pc([[sx * 14, -206], [sx * 52, -206], [sx * 50, -126, 1], [sx * 18, -126, 1]], ROUGE, () => { fillPts(box(sx * 14, -150, sx * 50, -140), OR); dot(sx * 32, -186, 2.2, LAITON); hatch(null, 0.8, 3.6, 0.22); }, 8010 + sx);
      pc(ell(sx * 34, -122, 17, 14, 14), OR, () => dot(sx * 34, -122, 3, ORD), 8012 + sx);
      pc([[sx * 18, -112], [sx * 50, -112], [sx * 46, -44, 1], [sx * 22, -44, 1]], ROUGE, () => { fillPts([[sx * 26, -108], [sx * 42, -108], [sx * 40, -56], [sx * 28, -56]], OR); hatch(null, 0.8, 3.6, 0.2); }, 8014 + sx);
      pc([[sx * 20, -46], [sx * 48, -46], [sx * 54, -22, 1], [sx * 16, -22, 1]], ROUGED, () => strokePts([[sx * 20, -40], [sx * 50, -40]], OR, 2), 8016 + sx);
    }
    pc([[-60, -236], [60, -236], [64, -206, 1], [-64, -206, 1]], ROUGED, () => { for (const x of [-40, 0, 40]) strokePts([[x, -234], [x, -208]], OR, 2); }, 8020);   // tassettes
    pc([[-58, -272], [58, -272], [60, -236, 1], [-60, -236, 1]], OR, () => { for (const y of [-262, -250]) strokePts([[-58, y], [58, y]], ORD, 1.4); }, 8021);
    pc([[-74, -416], [74, -416], [80, -380], [70, -320], [58, -272, 1], [-58, -272, 1], [-70, -320], [-80, -380]], ROUGE, () => {                     // plastron
      fillPts([[-52, -406], [52, -406], [44, -330], [0, -300], [-44, -330]], ROUGEL);
      strokePts([[-52, -406], [-44, -330], [0, -300], [44, -330], [52, -406]], OR, 3);
      for (const [x, y] of [[-62, -400], [62, -400], [-60, -290], [60, -290], [-30, -312], [30, -312]]) dot(x, y, 2.4, LAITON);
      hatch(null, 0.8, 3.6, 0.2); shade(-70, -400, 70, -280, 0.3, [-82, -420, 82, -270]);
    }, 8022);
    if (lu > 0.01 && !SIL()) { c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(0, -368, 6, 0, -368, 40 + 70 * lu); g.addColorStop(0, `rgba(190,225,240,${0.7 * lu})`); g.addColorStop(1, 'rgba(190,225,240,0)'); c.fillStyle = g; c.fillRect(-120, -490, 240, 240); c.restore(); }
    pc(ell(0, -368, 20, 20, 18), '#a8aeb0', () => { fillPts(ell(0, -368, 14, 14, 16), lerp(0, 1, lu) > 0.5 ? '#eaf6fa' : '#d4e2e6'); strokePts(ep(0, -368, 9, 9, 12, 0, TAU), 'rgba(120,160,180,0.6)', 1.2); }, 8023);
    for (const sx of [-1, 1]) {                                                                    // bras pendants
      pc([[sx * 80, -392], [sx * 104, -386], [sx * 100, -322, 1], [sx * 80, -322, 1]], ROUGE, () => { fillPts(box(sx * 80, -352, sx * 104, -344), OR); hatch(null, 0.8, 3.6, 0.22); }, 8030 + sx);
      pc(ell(sx * 90, -316, 13, 12, 12), OR, () => dot(sx * 90, -316, 2.6, ORD), 8032 + sx);
      pc([[sx * 80, -308], [sx * 102, -308], [sx * 100, -246, 1], [sx * 82, -246, 1]], ROUGE, () => { fillPts(box(sx * 82, -270, sx * 100, -262), OR); hatch(null, 0.8, 3.6, 0.2); }, 8034 + sx);
      pc([[sx * 80, -248], [sx * 102, -248], [sx * 104, -222], [sx * 92, -212, 1], [sx * 80, -222]], OR, () => { for (const y of [-238, -230]) strokePts([[sx * 82, y], [sx * 102, y]], ORD, 1); }, 8036 + sx);
      pc([[sx * 64, -420], [sx * 96, -428], [sx * 116, -410], [sx * 112, -384], [sx * 78, -380, 1], [sx * 62, -396]], OR, () => { strokePts([[sx * 70, -404], [sx * 110, -398]], ROUGED, 3); dot(sx * 98, -414, 2.4, ORD); }, 8038 + sx);
    }
    pc(ell(0, -418, 30, 8, 16), OR, () => fillPts(ell(0, -419, 22, 4, 14), '#2a1d14'), 8040);       // col
    if (o.casque !== false) { c.save(); c.translate(0, -414); c.scale(0.86, 0.86); drawCasqueFace({ visiere: o.visiere == null ? 0 : o.visiere }); c.restore(); }
    else pc(box(-6, -470, 6, -418), '#7a5532', null, 8041);
  }
  EXTRA.armure = { draw: drawArmure, base: [0, 0] };
  DOW.ARMURE = { haut: 528, poitrine: -368, casque: -414 };
  DOW.armure = function (x, y, s, o) {
    o = o || {}; s = s == null ? 1 : s; const up = o.up || 0;
    const r = acc('armure', x, y - up, s, Object.assign({}, o, { cast: o.cast }));
    r.poitrine = [x, y - up - 368 * s]; r.casque = [x, y - up - 414 * s];
    return r;
  };
  // ---------------- billets
  DOW.billet = function (x, y, s, o) {
    o = o || {}; s = s == null ? 1 : s; const K = DOW.K; if (!K) return; const c = cx_();
    const f = Math.cos(o.flip || 0), w = Math.max(0.06, Math.abs(f)), img = f >= 0 ? K.billet : K.billetV;
    c.save(); c.translate(x, y); c.rotate(o.rot || 0); c.scale(s * w * 0.5 * (o.dir || 1), s * 0.5 * (o.couche ? 0.36 : 1));
    if (o.alpha != null) c.globalAlpha *= o.alpha;
    c.drawImage(img, -img.width / 2, -img.height / 2); c.restore();
  };
  // pluie de billets : tombent des cintres en tournoyant, rebondissent et glissent sur l'obstacle {x, y, r} (sommet du parapluie ouvert), se posent au sol
  DOW.pluie = function (t, o) {
    o = o || {}; const t0 = o.t0 || 0; if (t < t0) return;
    const x0 = o.x0 == null ? 160 : o.x0, x1 = o.x1 == null ? 920 : o.x1, den = o.densite == null ? 12 : o.densite, dur = o.duree == null ? 3 : o.duree;
    const sol = o.sol == null ? 1424 : o.sol, s = o.s == null ? 1.4 : o.s, v = o.vitesse == null ? 320 : o.vitesse, ob = o.obstacle, n = Math.round(den * dur), dt = 1 / 60;
    const surf = (x) => ob.y + 0.47 * ob.r * Math.pow((x - ob.x) / ob.r, 2);
    for (let i = 0; i < n; i++) {
      const h = (k) => hash(i * 13.17 + k * 7.31 + (o.seed || 0) * 101.3);
      const ts = t0 + dur * (i + 0.6 * h(1)) / n; if (t < ts) continue;
      let x = lerp(x0, x1, h(2)), y = -50 - 60 * h(3), mode = 0, tau = 0, vx = 0, vy = v * (0.8 + 0.35 * h(4)), sd = 0, th = 0, flip = 0, rot = 0;
      const vf = vy, sw = 10 + 16 * h(5), ws = 2 + 1.6 * h(6), ph = h(7) * TAU, sol_i = sol - 10 * h(8);
      const T = t - ts, steps = Math.floor(T / dt), rem = T - steps * dt;
      for (let k = 0; k <= steps; k++) {
        const d = k < steps ? dt : rem; if (d <= 0) break; tau += d;
        if (mode === 0 || mode === 2) {
          const dxs = sw * ws * Math.cos(tau * ws + ph) * d * (mode === 0 ? 1 : 0.3);
          if (mode === 2) { vx *= 1 - 1.6 * d; vy = Math.min(vf, vy + 900 * d); }
          const ny = y + vy * d, nx = x + dxs + vx * d;
          if (mode === 0 && ob && Math.abs(nx - ob.x) < ob.r && ny >= surf(nx) && y < surf(nx) + 4) { x = nx; y = surf(nx); mode = 1; th = 0; sd = Math.abs(nx - ob.x) < 3 ? (h(9) < 0.5 ? -1 : 1) : Math.sign(nx - ob.x); continue; }
          x = nx; y = ny;
          if (y >= sol_i) { y = sol_i; mode = 3; break; }
        } else if (mode === 1) {
          th += d; x += sd * (40 + 420 * th) * d; y = surf(x) - 20 * Math.exp(-9 * th) * Math.abs(Math.sin(th * 15));
          if (Math.abs(x - ob.x) >= ob.r) { mode = 2; vx = sd * Math.min(260, 40 + 420 * th) * 0.6; vy = 80; }
        }
      }
      if (mode === 3) { DOW.billet(x, y, s, { rot: (h(10) - 0.5) * 0.6, couche: true, flip: h(11) < 0.3 ? PI : 0 }); continue; }
      if (mode === 1) { const sl = 0.94 * (x - ob.x) / ob.r; rot = Math.atan(sl); flip = 0.2; }
      else { rot = 0.5 * Math.sin(tau * 1.7 + h(12) * 6); flip = tau * (4 + 3 * h(13)) + h(14) * 6; }
      DOW.billet(x, y, s, { rot, flip });
    }
  };

  // =====================================================================
  // DÉCORS
  // =====================================================================
  const W = 1080, BACK = 1395;
  function cables(xs, ytop) { const c = cx_(); c.save(); c.strokeStyle = 'rgba(20,15,10,0.6)'; c.lineWidth = 2; c.beginPath(); for (const x of xs) { c.moveTo(x, ytop); c.lineTo(x, -200); } c.stroke(); c.restore(); }
  // ---------------- rue de Hollywood au couchant
  const crete = (x) => 905 - 80 * Math.sin(PI * clamp((x - 120) / 900)) - 10 * Math.sin(x * 0.021);
  const HOLLY = { panneaux: [], soleil: { x: 760, y: 820, r: 66 }, trottoir: 1300 };
  for (let i = 0; i < 9; i++) HOLLY.panneaux.push({ x: 318 + i * 54, y: crete(318 + i * 54) + 8, rot: (hash(i * 3.7 + 1) - 0.5) * 0.14 });
  DOW.HOLLY = HOLLY;
  function hill(c, f, col, seed, paint) { const pts = [[0, 1400, 1]]; for (let x = 0; x <= W; x += 30) pts.push([x, f(x)]); pts.push([W, 1400, 1]); pc(pts, col, paint, seed, { drop: false }); }
  function drawHollywood(c) {
    const g = c.createLinearGradient(0, 100, 0, 1000); g.addColorStop(0, '#4c4363'); g.addColorStop(0.42, '#a8687a'); g.addColorStop(0.72, '#d9946a'); g.addColorStop(1, '#e8b56e');
    c.fillStyle = g; c.fillRect(0, 0, W, 1400);
    hatch(box(0, 100, W, 1000), 0.8, 7, 0.05);
    for (const [y, x0, x1, col] of [[300, 80, 560, 'rgba(240,190,170,0.55)'], [380, 520, 1020, 'rgba(230,160,150,0.5)'], [520, 40, 400, 'rgba(250,200,150,0.45)'], [610, 640, 1000, 'rgba(250,210,160,0.45)']]) {
      pc([[x0, y + 8], [x0 + 40, y - 6], [x1 - 60, y - 10], [x1, y + 2], [x1 - 30, y + 14, 1], [x0 + 20, y + 16, 1]], col, null, 8100 + y, { drop: false, texA: 0.3 });
    }
    const S = HOLLY.soleil, gs = c.createRadialGradient(S.x, S.y, S.r * 0.6, S.x, S.y, S.r * 3.2); gs.addColorStop(0, 'rgba(255,225,160,0.55)'); gs.addColorStop(1, 'rgba(255,225,160,0)');
    c.fillStyle = gs; c.fillRect(S.x - S.r * 3.3, S.y - S.r * 3.3, S.r * 6.6, S.r * 6.6);
    pc(ell(S.x, S.y, S.r, S.r, 30), '#f2cf86', () => strokePts(ep(S.x, S.y, S.r - 8, S.r - 8, 20, PI * 1.1, PI * 1.5), 'rgba(255,255,230,0.6)', 3), 8110, { drop: false });
    hill(c, (x) => 860 - 40 * Math.sin(x * 0.006 + 1) - 20 * Math.sin(x * 0.017), '#9a7480', 8111, () => hatch(null, 0.8, 6, 0.08, 1, undefined, [0, 700, W, 1400]));
    hill(c, crete, '#6f5165', 8112, () => { for (let x = 40; x < W; x += 70) strokePts([[x, crete(x) + 30], [x + 26, crete(x + 26) + 70]], 'rgba(40,25,40,0.25)', 1.4); hatch(null, 0.9, 5, 0.12, 1, undefined, [0, 700, W, 1400]); });
    for (const P of HOLLY.panneaux) { c.save(); c.translate(P.x, P.y); c.rotate(P.rot); pc([[-19, 0, 1], [19, 0, 1], [19, -50, 1], [-19, -50, 1]], '#f3efe4', () => { strokePts([[-19, -50], [19, -50]], 'rgba(255,255,255,0.8)', 1.2); shade(-19, 0, 19, -50, 0.2, [-22, -54, 22, 4]); }, 8120 + P.x); c.restore(); }
    hill(c, (x) => 1010 - 34 * Math.sin(x * 0.008 + 2.2) - 14 * Math.sin(x * 0.03), '#4f3a4c', 8113, () => hatch(null, 0.9, 5, 0.12, 1, undefined, [0, 900, W, 1400]));
    // rangée basse de la rue : façades sombres, vitrines chaudes, marquise de cinéma à ampoules (aucune lettre)
    const bl = [[0, 120, 190], [120, 150, 230], [270, 160, 170], [430, 230, 260], [660, 140, 200], [800, 150, 240], [950, 130, 180]];
    bl.forEach(([x, w, h], i) => {
      const y0 = HOLLY.trottoir - h;
      pc(box(x, y0, x + w, HOLLY.trottoir), i % 2 ? '#3d2c3b' : '#463342', () => {
        for (let wx = x + 14; wx < x + w - 20; wx += 30) for (let wy = y0 + 20; wy < HOLLY.trottoir - 70; wy += 40) fillPts(box(wx, wy, wx + 14, wy + 20), hash(wx * 3 + wy) > 0.45 ? '#e8b86a' : '#2b1f2a');
        fillPts(box(x + 10, HOLLY.trottoir - 60, x + w - 10, HOLLY.trottoir - 4), '#d99a58'); strokePts([[x + 10, HOLLY.trottoir - 60], [x + w - 10, HOLLY.trottoir - 60]], 'rgba(40,20,20,0.6)', 2);
        hatch(null, 0.9, 5, 0.18);
      }, 8130 + i);
    });
    pc([[440, 1150], [650, 1150], [670, 1186, 1], [420, 1186, 1]], '#7a2a26', () => { for (let x = 432; x <= 660; x += 16) dot(x, 1180, 3.2, '#f6dd96'); for (let x = 448; x <= 644; x += 16) dot(x, 1156, 3.2, '#f6dd96'); }, 8140);
    for (const lx of [110, 980]) { pc(box(lx - 4, 1130, lx + 4, HOLLY.trottoir), '#2b2228', null, 8150 + lx); pc(ell(lx, 1124, 12, 14, 12), '#f3d79a', null, 8152 + lx); }
    pc(box(0, HOLLY.trottoir, W, BACK + 5), '#cdbb9e', () => {
      fillPts(box(0, HOLLY.trottoir, W, HOLLY.trottoir + 10), '#a9977c');
      for (let x = 0; x < W; x += 90) strokePts([[x, HOLLY.trottoir + 12], [x - 20, BACK + 5]], 'rgba(90,70,50,0.3)', 1.2);
      strokePts([[0, 1350], [W, 1350]], 'rgba(90,70,50,0.25)', 1.2);
      hatch(null, 0.6, 6, 0.1);
    }, 8160, { drop: false });
  }
  // ---------------- plateau du studio : toile gris-bleu, grand fond vert sur cadre, passerelle, projecteurs pendus, câbles ; fauteuil de réalisateur vide (pré-rendu à part)
  const STUDIO = { ecran: { x0: 300, x1: 790, y0: 430, y1: 1330 }, fauteuil: { x: 175, y: BACK, assise: BACK - 150 }, passerelle: 236, lampes: [190, 410, 680, 900] };
  DOW.STUDIO = STUDIO;
  function drawStudio(c) {
    pc(box(0, 100, W, BACK + 5), '#38434f', () => {
      for (let x = 30; x < W; x += 90) strokePts([[x, 100], [x, BACK]], 'rgba(255,255,255,0.05)', 3);
      const g = c.createLinearGradient(0, 300, 0, BACK); g.addColorStop(0, 'rgba(10,15,25,0.0)'); g.addColorStop(1, 'rgba(10,15,25,0.35)'); c.fillStyle = g; c.fillRect(0, 100, W, BACK);
      hatch(box(0, 100, W, BACK + 5), 0.8, 7, 0.08);
    }, 8201, { drop: false });
    const E = STUDIO.ecran;
    for (const x of [E.x0 - 16, E.x1 + 6]) pc(box(x, E.y0 - 30, x + 10, BACK), '#5c6168', () => strokePts([[x + 3, E.y0 - 28], [x + 3, BACK]], 'rgba(255,255,255,0.2)', 1.2), 8202 + x);
    pc(box(E.x0 - 22, E.y0 - 34, E.x1 + 22, E.y0 - 22), '#5c6168', null, 8204);
    pc([[E.x0, E.y0, 1], [E.x1, E.y0, 1], [E.x1, E.y1, 1], [(E.x0 + E.x1) / 2, E.y1 + 12], [E.x0, E.y1, 1]], '#5f7a52', () => {
      for (let x = E.x0 + 30; x < E.x1; x += 62) { fillPts([[x, E.y0], [x + 18, E.y0], [x + 26, E.y1], [x + 6, E.y1]], 'rgba(30,50,25,0.14)'); strokePts([[x + 30, E.y0], [x + 36, E.y1]], 'rgba(220,240,200,0.08)', 4); }
      hatch(null, 0.8, 5, 0.12, 1, undefined, [E.x0, E.y0, E.x1, E.y1 + 12]);
    }, 8205);
    for (let x = E.x0 + 10; x < E.x1; x += 48) strokePts([[x, E.y0 - 22], [x + 2, E.y0 + 4]], '#cfc8b4', 1.4);
    for (let y = E.y0 + 40; y < E.y1; y += 90) { strokePts([[E.x0 - 6, y], [E.x0 + 4, y + 3]], '#cfc8b4', 1.4); strokePts([[E.x1 + 6, y], [E.x1 - 4, y + 3]], '#cfc8b4', 1.4); }
    const P = STUDIO.passerelle;                                                                  // passerelle (treillis) et projecteurs pendus
    { const z = []; for (let x = 0; x <= W; x += 36) z.push([x, (x / 36) % 2 ? P + 18 : P - 18]); strokePts(z, '#4c5158', 4); }
    pc(box(0, P - 26, W, P - 18), '#4c5158', null, 8210); pc(box(0, P + 18, W, P + 26), '#4c5158', null, 8211);
    for (const x of [120, 960]) strokePts([[x, P - 26], [x, 100]], 'rgba(20,15,10,0.6)', 2);
    STUDIO.lampes.forEach((x, i) => {
      const a = (x < 540 ? 1 : -1) * (0.35 + 0.1 * (i % 2));
      strokePts([[x, P + 26], [x, P + 54]], '#2b2d31', 3);
      c.save(); c.translate(x, P + 70); c.rotate(a);
      pc([[-14, -16], [14, -16], [18, 0, 1], [-18, 0, 1]], '#2b2d31', null, 8220 + i);
      pc([[-24, -2], [24, -2], [28, 62, 1], [-28, 62, 1]], '#3a3d43', () => { fillPts(box(-24, 8, 24, 14), '#2a2c30'); hatch(null, 0.9, 3.6, 0.25); }, 8230 + i);
      pc(ell(0, 62, 28, 8, 14), '#e8ddb8', null, 8240 + i);
      c.restore();
    });
    const cab = (pts, sd) => pc(ribbon(pts, 7, 7), '#1c1d20', () => strokePts(pts.map((p) => [p[0], p[1] - 2]), 'rgba(255,255,255,0.15)', 1), sd);   // câbles au pied
    cab(qbez([E.x0 - 10, BACK - 40], [420, BACK + 10], [620, BACK - 6], 10), 8250);
    cab(qbez([E.x1 + 10, BACK - 60], [880, BACK + 4], [1080, BACK - 12], 10), 8251);
    pc(ell(E.x0 - 40, BACK - 10, 34, 9, 18), '#1c1d20', () => strokePts(ep(E.x0 - 40, BACK - 12, 26, 6, 18, 0, TAU), 'rgba(255,255,255,0.15)', 1.2), 8252);
  }
  function drawFauteuil() {                                                       // origine = sol sous le milieu ; vu de côté (pieds en X), toile noire, bois clair
    const B = '#b08a5a';
    pc(ribbon([[-46, -150], [-48, -300]], 9, 9), B, null, 8301);
    pc(ribbon([[40, -150], [40, -196]], 8, 8), B, null, 8302);
    pc(ribbon([[-50, 0], [44, -148]], 10, 10), B, () => hatch(null, 0.9, 4, 0.2), 8303);
    pc(ribbon([[48, 0], [-46, -148]], 10, 10), B, () => hatch(null, 0.9, 4, 0.2), 8304);
    pc(box(-58, -160, 52, -146), '#262325', () => strokePts([[-56, -157], [50, -157]], 'rgba(255,255,255,0.18)', 1.2), 8305);
    pc(box(-54, -204, 50, -194), B, () => strokePts([[-52, -202], [48, -202]], 'rgba(255,240,210,0.4)', 1.2), 8306);
    pc([[-62, -296], [6, -290], [6, -246, 1], [-62, -250, 1]], '#262325', () => { strokePts([[-60, -286], [4, -282]], 'rgba(255,255,255,0.16)', 1.2); hatch(null, 0.8, 4, 0.2); }, 8307);
    for (const [x, y] of [[-48, -296], [-48, -250], [0, -74]]) dot(x, y, 2.4, LAITON);
  }
  DOW.init = function () {
    if (M.hou && !M.hou.K && M.hou.init) M.hou.init();
    const K = (DOW.K = {});
    K.hollywood = M.pre(W, 1400, (c) => drawHollywood(c));
    K.studio = M.pre(W, 1400, (c) => drawStudio(c));
    K.fauteuil = M.withShadow(M.cutFlat(180, 330, 90, 320, () => drawFauteuil()), 8); K.fauteuil.padB = 10;
    K.billet = M.cutFlat(164, 92, 82, 46, (c) => { c.scale(2, 2); drawBillet(false); });
    K.billetV = M.cutFlat(164, 92, 82, 46, (c) => { c.scale(2, 2); drawBillet(true); });
    return K;
  };
  // rue de Hollywood : up = remontée vers les cintres ; o.palmiers (true : HOU.palmiers en coulisses) ; o.palmXs ; o.palmUp (descente des palmiers)
  DOW.hollywood = function (t, up, o) {
    o = o || {}; up = up || 0; const c = cx_();
    c.save(); c.translate(0, -up); if (up > 0) cables([140, 940], 150); c.drawImage(DOW.K.hollywood, 0, 0); c.restore();
    if (o.palmiers !== false && M.hou && M.hou.palmiers) M.hou.palmiers(t, up + (o.palmUp || 0), { xs: o.palmXs, scale: o.palmScale });
  };
  // plateau du studio : up = remontée ; o.fauteuil (true) ; o.lampes 0..1 (lentilles allumées + halos) ; o.faisceaux 0..1 (HOU.projecteurs)
  DOW.studio = function (t, up, o) {
    o = o || {}; up = up || 0; const c = cx_();
    c.save(); c.translate(0, -up); if (up > 0) cables([140, 940], 150); c.drawImage(DOW.K.studio, 0, 0);
    if (o.fauteuil !== false) M.flat(DOW.K.fauteuil, STUDIO.fauteuil.x, BACK, { cast: { dx: 16, dy: 6, a: 0.3 } });
    const k = clamp(o.lampes || 0);
    if (k > 0.01) {
      c.save(); c.globalCompositeOperation = 'lighter';
      STUDIO.lampes.forEach((x, i) => {
        const a = (x < 540 ? 1 : -1) * (0.35 + 0.1 * (i % 2)), fl = 0.92 + 0.08 * Math.sin(t * 9 + i * 2);
        const lx = x - Math.sin(a) * 62, ly = STUDIO.passerelle + 70 + Math.cos(a) * 62, L = 900, dx = -Math.sin(a), dy = Math.cos(a);
        const g = c.createLinearGradient(lx, ly, lx + dx * L, ly + dy * L); g.addColorStop(0, `rgba(255,240,200,${0.22 * k * fl})`); g.addColorStop(1, 'rgba(255,240,200,0)');
        c.fillStyle = g; c.beginPath(); c.moveTo(lx - dy * 26, ly + dx * 26); c.lineTo(lx + dx * L - dy * 170, ly + dy * L + dx * 170); c.lineTo(lx + dx * L + dy * 170, ly + dy * L - dx * 170); c.lineTo(lx + dy * 26, ly - dx * 26); c.closePath(); c.fill();
        const h = c.createRadialGradient(lx, ly, 2, lx, ly, 46); h.addColorStop(0, `rgba(255,245,215,${0.9 * k})`); h.addColorStop(1, 'rgba(255,245,215,0)'); c.fillStyle = h; c.fillRect(lx - 50, ly - 50, 100, 100);
      });
      c.restore();
    }
    c.restore();
    if ((o.faisceaux || 0) > 0 && M.hou && M.hou.projecteurs) M.hou.projecteurs(t, o.faisceaux, o.faisceauxO);
  };
})();
