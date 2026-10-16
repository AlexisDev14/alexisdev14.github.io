// tandem.js — « Le tandem, un mot d'esprit attelé » : chevaux A/B, cabriolet, cocher, attelage, tandem + cyclistes, étudiant farceur, décor route. Espace M.tan.
// persos.js — « Le tandem, un mot d'esprit attelé » : marionnettes, accessoires et décors PROPRES À CETTE VIDÉO. Espace M.tan (alias TAN). Appeler TAN.init() dans S.init.
// Mode d'emploi : persos.md (les plans ne lisent pas ce fichier). Aucun texte, lettre ni chiffre. Déterministe (aucun Math.random).
// MARIONNETTES : TAN.cheval(pose,x,y,s,{qui:'A'|'B'}) ; TAN.cabriolet(pose,x,y,s,o) ; TAN.cocher(pose,x,y,s,o) (x,y = hanche sur le siège) ;
//                TAN.attelage(pose,x,y,s,o) (cabriolet + B dans les brancards + A devant + cocher + rênes) ; TAN.tandem(pose,x,y,s,o) (vélo + 2 cyclistes) ;
//                TAN.etudiant(pose,x,y,s,o) (toque, toge, livre) ; TAN.badaud(pose,x,y,s,{qui:'a'|'b'|'c'}) (trois spectateurs).   DÉCOR : TAN.K.route (toile plein cadre), repères TAN.ROUTE.
(function () {
  const X = M.X, P = M.P, CH = M.chars, { fillPts, strokePts, dot, hatch, shade, piece } = M;
  const TAN = (M.tan = {});
  const TAU = M.TAU, PI = Math.PI;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), lerp = (a, b, k) => a + (b - a) * k;
  const sm = (a, b, v) => { const u = clamp((v - a) / (b - a)); return u * u * (3 - 2 * u); };
  const OFFP = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];
  const rect = (x0, y0, x1, y1) => [[x0, y0, 1], [x1, y0, 1], [x1, y1, 1], [x0, y1, 1]];
  const ell = (cx, cy, rx, ry, n = 20, a0 = 0) => { const r = []; for (let i = 0; i < n; i++) { const a = a0 + i / n * TAU; r.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return r; };
  const pc = (pts, base, paint, seed, o) => piece(pts, base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));
  const cx_ = () => M.ctx();
  // segment articulé : cercle centré sur le rivet en haut (r0), bout arrondi en bas (r1 à len)
  function capsule(len, r0, r1, n = 8) {
    const p = [];
    for (let i = 0; i <= n; i++) { const a = PI + i / n * PI; p.push([Math.cos(a) * r0, Math.sin(a) * r0]); }
    for (let i = 0; i <= n; i++) { const a = i / n * PI; p.push([Math.cos(a) * r1, len + Math.sin(a) * r1]); }
    return p;
  }
  // avant-bras + main avec articulation ronde au coude
  function foreP(kind, r = 12) { const p = []; for (let i = 0; i <= 6; i++) { const a = PI + i / 6 * PI; p.push([Math.cos(a) * r, Math.sin(a) * r]); } return p.concat(X.forePts(kind).slice(2)); }
  // anneau fendu (le trou reste vide : polygone extérieur puis intérieur à l'envers)
  function ringPts(r0, r1, n = 40) {
    const p = [];
    for (let i = 0; i <= n; i++) { const a = i / n * TAU; p.push([Math.cos(a) * r1, Math.sin(a) * r1, (i === 0 || i === n) ? 1 : 0]); }
    for (let i = n; i >= 0; i--) { const a = i / n * TAU; p.push([Math.cos(a) * r0, Math.sin(a) * r0, (i === 0 || i === n) ? 1 : 0]); }
    return p;
  }
  // bande entre deux points (tube, brancard, rayon)
  function band(a, b, w0, w1) {
    if (w1 == null) w1 = w0;
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    return [[a[0] + nx * w0 / 2, a[1] + ny * w0 / 2, 1], [b[0] + nx * w1 / 2, b[1] + ny * w1 / 2, 1], [b[0] - nx * w1 / 2, b[1] - ny * w1 / 2, 1], [a[0] - nx * w0 / 2, a[1] - ny * w0 / 2, 1]];
  }
  function normUp(a) { while (a > PI / 2) a -= TAU; while (a < -3 * PI / 2) a += TAU; return a; }
  function prep(p) { p = p || {}; return Object.assign({}, p, { ang: Object.assign({}, p.ang), hide: Object.assign({}, p.hide), face: Object.assign({}, p.face) }); }
  // amène la main de `arm` sur le point lt (repère du TORSE) avec M.ik ; k mélange (0..1) ; bend = bendSign
  function armToLocal(def, q, x, y, s, dir, arm, lt, k, bend) {
    if (!(k > 0)) return;
    const { mats } = M.partMatrices(def, q, x, y, s, dir);
    armToScreen(def, q, x, y, s, dir, arm, M.wpt(mats.torso, lt[0], lt[1]), k, bend);
  }
  function armToScreen(def, q, x, y, s, dir, arm, T, k, bend) {
    if (!(k > 0)) return;
    const sol = M.ik(def, q, x, y, s, dir, arm, T, bend == null ? 1 : bend);
    q.ang[arm + '_up'] = lerp(q.ang[arm + '_up'] || 0, normUp(sol.up), k);
    q.ang[arm + '_lo'] = lerp(q.ang[arm + '_lo'] || 0, sol.lo, k);
  }
  function plier(q, th) {                                    // plie le buste aux hanches (th > 0 = vers l'avant), jambes droites
    if (!th) return;
    q.tilt = (q.tilt || 0) + th; q.dx = (q.dx || 0) - 238 * Math.sin(th); q.dy = (q.dy || 0) + 238 * (1 - Math.cos(th));
    q.ang.legF = (q.ang.legF || 0) - th; q.ang.legB = (q.ang.legB || 0) - th;
  }
  const SKIN = '#e2bf9c', SKIND = '#c69f7e';
  const DOIGTS = [[-13, -9], [9, -11], [12, -4], [12, 6], [6, 11], [-6, 11], [-13, 4]];
  const doigtsPaint = () => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(70,40,30,0.5)', 1); hatch(null, 0.9, 3.4, 0.15); };

  // =====================================================================
  // ROUES (dessinées dans le repère de la pièce, qui tourne avec ang)
  // =====================================================================
  function roueBois(R, col, colD, sombre, seed) {          // roue de voiture : rayons de bois, jante, bandage de fer, gros moyeu
    const c1 = sombre ? M.mixc(col, '#2a2a26', 0.35) : col, c2 = sombre ? M.mixc(colD, '#2a2a26', 0.35) : colD;
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU, ca = Math.cos(a), sa = Math.sin(a);
      pc(band([ca * 16, sa * 16], [ca * (R - 12), sa * (R - 12)], 11, 7), c1, () => strokePts([[ca * 18, sa * 18], [ca * (R - 14), sa * (R - 14)]], 'rgba(255,240,200,0.35)', 1.2), seed + i, { drop: true });
    }
    pc(ringPts(R - 16, R, 44), c1, () => {
      fillPts(ringPts(R - 6, R + 2, 44), '#2b2724');
      strokePts(ell(0, 0, R - 11, R - 11, 40).concat([[R - 11, 0]]), c2, 1.4);
      hatch(null, 0.6, 5, 0.18, 1, M.P.encre, [-R, -R, R, R]);
    }, seed + 20);
    pc(ell(0, 0, 24, 24, 16), c2, () => { dot(0, 0, 13, c1); dot(-4, -4, 4, 'rgba(255,240,200,0.4)'); }, seed + 21);
    M.rivet(0, 0, 3.6);
  }
  function roueVelo(R, seed) {                             // roue de vélo : rayons fins, jante d'acier, pneu noir
    if (!M._sil()) {
      for (let i = 0; i < 24; i++) {
        const a = i / 24 * TAU + (i % 2 ? 0.08 : -0.08), b = i / 24 * TAU;
        strokePts([[Math.cos(a) * 9, Math.sin(a) * 9], [Math.cos(b) * (R - 9), Math.sin(b) * (R - 9)]], 'rgba(70,66,60,0.9)', 1.1);
      }
    }
    pc(ringPts(R - 10, R, 48), '#6e6a63', () => { fillPts(ringPts(R - 5, R + 2, 48), '#262321'); strokePts(ell(0, 0, R - 7, R - 7, 40).concat([[R - 7, 0]]), 'rgba(200,195,185,0.6)', 1.1); }, seed);
    pc(ell(0, 0, 10, 10, 12), '#8a857c', null, seed + 1);
    M.rivet(0, 0, 3);
  }

  // =====================================================================
  // CHEVAUX — repère : pieds en (0,0), regard vers +x ; corps = racine (hanche à 175 au-dessus des sabots)
  // =====================================================================
  const HY = 175;
  const sh = (pts) => pts.map((p) => [p[0], p[1] + HY, p[2]]);
  const HO_BODY = sh([[150, -240], [126, -270], [100, -292], [62, -286], [22, -272], [-30, -270], [-76, -278], [-110, -284], [-140, -268], [-158, -240], [-162, -206], [-152, -174], [-130, -152], [-100, -140], [-60, -130], [0, -127], [50, -131], [90, -139], [114, -152], [140, -172], [156, -200], [160, -224]]);
  const HO_NECK = [[-34, -22], [-16, -52], [6, -86], [28, -114], [50, -136], [66, -142], [84, -128], [86, -104], [82, -76], [72, -46], [62, -14], [54, 20], [26, 40], [-8, 32], [-30, 8]];
  const HO_CRIN = [[-38, -16], [-34, -36], [-22, -52], [-8, -74], [8, -94], [24, -112], [42, -132], [56, -148], [70, -154], [68, -140], [54, -126], [38, -106], [22, -86], [6, -66], [-8, -46], [-22, -26]];
  const HO_COLLIER = [[-48, -34], [-36, -60], [-14, -52], [8, -22], [34, 6], [58, 28], [70, 52], [54, 64], [30, 44], [2, 14], [-22, -12], [-44, -18]];
  const HO_HEAD = [[-20, 10], [-20, -10], [-18, -42, 1], [-6, -16], [2, -46, 1], [14, -14], [32, -4], [50, 18], [64, 46], [74, 74], [82, 94], [80, 108], [68, 116], [54, 112], [44, 100], [30, 84], [10, 70], [-8, 52], [-20, 32]];
  const HO_QUEUE = [[-6, -8], [8, -6], [8, 30], [4, 70], [-2, 110], [2, 150], [-10, 182], [-26, 164], [-36, 124], [-38, 82], [-30, 40], [-18, 8]];
  const HO_FU = capsule(88, 22, 12);
  const HO_FL = [[-12, 0], [-9, -8], [0, -12], [9, -8], [12, 0], [9, 30], [8, 48], [12, 56], [14, 64], [18, 70], [22, 80, 1], [22, 82, 1], [-8, 82, 1], [-8, 74], [-10, 60], [-9, 50], [-8, 30]];
  const HO_HU = [[-26, 0], [-18, -18], [0, -26], [18, -18], [26, 0], [18, 40], [2, 76], [-4, 92], [-20, 92], [-28, 78], [-24, 48]];
  const HO_HL = [[-12, 0], [-8, -10], [2, -12], [10, -6], [11, 6], [8, 30], [7, 44], [11, 52], [14, 60], [18, 68], [22, 78, 1], [22, 80, 1], [-8, 80, 1], [-8, 72], [-10, 58], [-9, 46], [-8, 24]];
  const CUIR = '#3f2a1c', CUIRL = '#5a3e2a', LAITON = '#b08d45', LAITONL = '#dcc07a';
  const ROBES = {
    A: { robe: '#7a4a2e', robeD: '#5e3822', robeL: '#94603e', crin: '#1e1714', crinL: '#3a2d26', jambe: '#2a201b', jambeF: '#211915', sabot: '#2b2420', pomme: false, seed: 4100 },
    B: { robe: '#8d8f93', robeD: '#6f7176', robeL: '#b4b6b8', crin: '#dcd6ca', crinL: '#f1ece2', jambe: '#6a6c70', jambeF: '#58595d', sabot: '#4a4038', pomme: true, seed: 4200 },
  };
  function mkCheval(C) {
    const legLo = (pts, far, front, seed) => ({
      pts, base: far ? C.jambeF : C.jambe, seed, paint: () => {
        fillPts(rect(-14, front ? 68 : 66, 26, 90), C.sabot);
        strokePts([[-8, front ? 70 : 68], [22, front ? 72 : 70]], 'rgba(255,240,220,0.25)', 1.2);
        hatch(null, 1.2, 3.6, far ? 0.32 : 0.22);
        if (C.pomme && !far) strokePts([[-4, 10], [-4, 44]], 'rgba(255,255,255,0.18)', 2);
      } });
    const legUp = (pts, far, seed) => ({
      pts, base: far ? C.robeD : C.robe, seed, paint: () => {
        hatch(null, 1.1, 4, far ? 0.34 : 0.2);
        if (C.pomme && !far) for (const [a, b] of [[-6, 20], [6, 44], [-2, 64]]) dot(a, b, 6, 'rgba(255,255,255,0.16)');
        shade(-20, 0, 20, 0, 0.25, [-40, -40, 40, 120]);
      } });
    const parts = {
      corps: { parent: null, at: [0, 0], pts: HO_BODY, base: C.robe, seed: C.seed, paint: (p) => {
        const Y = HY;
        if (C.pomme) { const R = M.rng(C.seed); for (let i = 0; i < 26; i++) { const x = -150 + R() * 290, y = -270 + R() * 130 + Y; dot(x, y, 7 + R() * 7, 'rgba(232,232,230,0.35)'); dot(x + 2, y + 1, 3 + R() * 2, 'rgba(110,112,118,0.25)'); } }
        hatch([[-170, -200 + Y], [170, -200 + Y], [170, -110 + Y], [-170, -110 + Y]], 0.5, 4.2, 0.28);
        shade(0, -290 + Y, 0, -125 + Y, 0.32, [-170, -300 + Y, 170, -120 + Y]);
        strokePts([[-150, -238 + Y], [-120, -212 + Y], [-110, -168 + Y]], 'rgba(30,18,10,0.35)', 1.4);           // cuisse
        strokePts([[128, -238 + Y], [118, -196 + Y], [116, -160 + Y]], 'rgba(30,18,10,0.3)', 1.3);             // épaule
        // harnais : croupière, avaloire, traits, sellette, sangle
        strokePts([[30, -276 + Y], [-30, -274 + Y], [-80, -281 + Y], [-118, -284 + Y], [-146, -264 + Y]], CUIR, 5);
        fillPts([[-96, -228 + Y], [-160, -226 + Y], [-162, -210 + Y], [-96, -212 + Y]], CUIR);
        strokePts([[-96, -220 + Y], [-160, -218 + Y]], 'rgba(220,190,140,0.45)', 1);
        strokePts([[-96, -276 + Y], [-100, -226 + Y]], CUIR, 4);
        fillPts([[150, -210 + Y], [56, -202 + Y], [56, -192 + Y], [150, -200 + Y]], CUIR);                   // trait (jusqu'à la sangle)
        strokePts([[150, -205 + Y], [56, -197 + Y]], 'rgba(220,190,140,0.4)', 1);
        fillPts([[46, -140 + Y], [56, -140 + Y], [60, -272 + Y], [50, -272 + Y]], CUIR);                       // sangle
        dot(56, -197 + Y, 4.5, LAITON);
        fillPts([[18, -268 + Y], [30, -296 + Y], [80, -298 + Y], [90, -268 + Y], [56, -258 + Y]], CUIRL);
        strokePts([[24, -272 + Y], [84, -274 + Y]], LAITON, 1.6);
        dot(54, -302 + Y, 6, LAITON); dot(54, -302 + Y, 3, CUIR);
      } },
      legFF_up: Object.assign({ parent: 'corps', at: [108, 7] }, legUp(HO_FU, true, C.seed + 1)),
      legFF_lo: Object.assign({ parent: 'legFF_up', at: [0, 88] }, legLo(HO_FL, true, true, C.seed + 2)),
      legRF_up: Object.assign({ parent: 'corps', at: [-112, 15] }, legUp(HO_HU, true, C.seed + 3)),
      legRF_lo: Object.assign({ parent: 'legRF_up', at: [-12, 80] }, legLo(HO_HL, true, false, C.seed + 4)),
      queue: { parent: 'corps', at: [-150, -87], pts: HO_QUEUE, base: C.crin, seed: C.seed + 5, rest: 0.25, paint: () => {
        for (let i = 0; i < 7; i++) strokePts([[-8 + i * 2, 0], [-12 + i * 2, 60], [-20 + i * 3, 120], [-14 + i * 2, 176]], C.crinL, 1.2);
        fillPts([[-8, -10], [10, -8], [8, 22], [-10, 20]], CUIR);                              // boucle de croupière
      } },
      legRN_up: Object.assign({ parent: 'corps', at: [-118, 15] }, legUp(HO_HU, false, C.seed + 6)),
      legRN_lo: Object.assign({ parent: 'legRN_up', at: [-12, 80] }, legLo(HO_HL, false, false, C.seed + 7)),
      legFN_up: Object.assign({ parent: 'corps', at: [112, 7] }, legUp(HO_FU, false, C.seed + 8)),
      legFN_lo: Object.assign({ parent: 'legFN_up', at: [0, 88] }, legLo(HO_FL, false, true, C.seed + 9)),
      cou: { parent: 'corps', at: [112, -87], pts: HO_NECK, base: C.robe, seed: C.seed + 10, paint: () => {
        if (C.pomme) for (const [a, b, r] of [[10, -40, 9], [30, -80, 8], [-10, 0, 10], [44, -20, 7]]) dot(a, b, r, 'rgba(232,232,230,0.32)');
        hatch([[30, -140], [90, -140], [90, 40], [30, 40]], 0.9, 4, 0.25);
        shade(-30, -40, 70, -60, 0.25, [-40, -150, 90, 40]);
      } },
      crin: { parent: 'cou', at: [0, 0], pts: HO_CRIN, base: C.crin, seed: C.seed + 11, noRivet: true, paint: () => {
        for (let i = 0; i < 9; i++) { const u = i / 9; strokePts([[-34 + u * 96, -30 - u * 118], [-26 + u * 96, -18 - u * 112]], C.crinL, 1.2); }
      } },
      collier: { parent: 'cou', at: [0, 0], pts: HO_COLLIER, base: CUIR, seed: C.seed + 12, noRivet: true, paint: () => {
        fillPts([[-40, -34], [-30, -52], [-12, -42], [10, -14], [34, 12], [56, 34], [62, 50], [50, 52], [30, 34], [4, 6], [-18, -18]], '#5a3e2a');   // bourrelet
        strokePts([[-36, -50], [-14, -36], [8, -8], [32, 20], [54, 44]], LAITON, 3.6);
        strokePts([[-36, -50], [-14, -36], [8, -8], [32, 20], [54, 44]], 'rgba(255,240,200,0.45)', 1);
        dot(-38, -56, 5.5, LAITONL); dot(-38, -56, 2.4, '#6a4e1f');
        dot(34, 22, 5, LAITON); dot(34, 22, 2.2, CUIR);
      } },
      tete: { parent: 'cou', at: [64, -128], pts: HO_HEAD, base: C.robe, seed: C.seed + 13, paint: (p) => {
        const k = p._renifle || 0, t = p.t || 0;
        hatch([[-20, 20], [40, 20], [50, 110], [-20, 110]], 0.8, 4, 0.22);
        fillPts([[-8, -14], [8, -16], [16, 2], [6, 14], [-4, 6]], C.crin);                      // toupet
        dot(74, 92, 4.8 + 1.8 * k * (0.5 + 0.5 * Math.sin(t * 14)), 'rgba(30,18,12,0.85)');   // naseau
        strokePts([[80, 108], [68, 112], [56, 110]], 'rgba(30,18,12,0.7)', 1.4);               // bouche
        strokePts([[-14, 36], [8, 62], [36, 90]], 'rgba(30,18,12,0.3)', 1.3);                   // ganache
        // bride : montant, frontal, muserolle, sous-gorge, mors ; œillère derrière l'œil
        strokePts([[-2, -8], [8, 30], [36, 78], [56, 106]], CUIR, 4);
        strokePts([[-6, -6], [26, 0]], CUIR, 3.4);
        strokePts([[50, 74], [70, 66], [84, 76]], CUIR, 4);
        strokePts([[-16, 26], [8, 48]], CUIR, 3.2);
        fillPts([[12, 2], [26, -2], [30, 28], [14, 32]], '#221812');
        dot(36, 16, 6.5, '#1f1612'); dot(38, 14, 2.2, 'rgba(255,255,255,0.8)');                     // œil
        strokePts([[29, 11], [36, 7], [44, 11]], 'rgba(20,12,8,0.8)', 1.4);
        dot(58, 108, 5, LAITON); dot(58, 108, 2.4, CUIR);
      }, extra: (p) => {
        const k = p._renifle || 0; if (!(k > 0.05) || M._sil()) return;
        const t = p.t || 0, u = (t * 1.6) % 1;                                                   // souffle du naseau
        for (let i = 0; i < 3; i++) strokePts([[80 + 10 * u, 98 + i * 6], [94 + 22 * u, 102 + i * 9]], `rgba(250,248,240,${0.7 * k * (1 - u)})`, 2.2);
      } },
    };
    return { hipY: -HY, parts, rod: { part: 'corps', at: [0, 30] },
      order: ['legFF_up', 'legFF_lo', 'legRF_up', 'legRF_lo', 'queue', 'corps', 'legRN_up', 'legRN_lo', 'legFN_up', 'legFN_lo', 'cou', 'crin', 'collier', 'tete'] };
  }
  CH.tanChevalA = mkCheval(ROBES.A);
  CH.tanChevalB = mkCheval(ROBES.B);
  // allures : décalages de phase (tours) par jambe
  const ALLURE = {
    pas: { f: 0.9, off: { RN: 0, FN: 0.25, RF: 0.5, FF: 0.75 }, aF: 0.3, aH: 0.24, bF: 0.75, bH: 0.55, bob: 2, nod: 0.06 },
    trot: { f: 1.45, off: { FN: 0, RF: 0, FF: 0.5, RN: 0.5 }, aF: 0.4, aH: 0.32, bF: 1.1, bH: 0.8, bob: 7, nod: 0.035 },
  };
  TAN.chevalPose = function (pose) {
    const q = prep(pose), A = q.ang, t = q.t || 0, al = ALLURE[q.allure || 'pas'];
    const ph = q.ph != null ? q.ph : t * (q.cadence || (al ? al.f : 0.9));
    const hoche = q.hoche == null ? 1 : q.hoche;
    if (al && q.allure !== 'arret') {
      for (const L of ['FN', 'FF', 'RN', 'RF']) {
        const th = TAU * (ph + al.off[L]), fr = L[0] === 'F', far = L[1] === 'F';
        const sw = Math.sin(th), fl = Math.pow(Math.max(0, Math.cos(th)), 1.4);
        A['leg' + L + '_up'] = (A['leg' + L + '_up'] || 0) - (fr ? al.aF : al.aH) * sw * (far ? 0.9 : 1);
        A['leg' + L + '_lo'] = (A['leg' + L + '_lo'] || 0) + (fr ? al.bF : -al.bH) * fl;
      }
      q.dy = (q.dy || 0) - al.bob * Math.abs(Math.sin(TAU * ph * 2));
      A.cou = (A.cou || 0) + al.nod * hoche * Math.sin(TAU * ph * 2 + 1);
      A.tete = (A.tete || 0) + al.nod * 0.7 * hoche * Math.sin(TAU * ph * 2 + 2);
    } else {
      A.cou = (A.cou || 0) + 0.025 * hoche * Math.sin(t * 0.9);
      A.tete = (A.tete || 0) + 0.03 * hoche * Math.sin(t * 1.3 + 1);
      q.dy = (q.dy || 0) - 1.2 * Math.sin(t * 1.8);
    }
    const qa = q.queue == null ? 0.3 : q.queue;
    A.queue = (A.queue || 0) + qa * 0.32 * Math.sin(t * 5.2) + 0.06 * Math.sin(t * 1.1) + 0.55 * clamp(q.queueLeve || 0);
    const rn = clamp(q.renifle || 0);
    if (rn > 0) { A.cou += 0.32 * rn; A.tete += -0.42 * rn + 0.05 * rn * Math.sin(t * 9); }
    q._renifle = rn;
    if (q.tete != null && typeof q.tete === 'number') A.tete += q.tete;
    if (q.cou != null && typeof q.cou === 'number') A.cou += q.cou;
    return q;
  };
  TAN.cheval = function (pose, x, y, s, o) {
    o = o || {}; const def = (o.qui === 'B') ? CH.tanChevalB : CH.tanChevalA;
    const r = M.puppet(def, TAN.chevalPose(pose), x, y, s == null ? 0.7 : s, Object.assign({ slot: M.ST.slotB }, o));
    r.mors = r.w('tete', 58, 108); r.queue = r.w('queue', -14, 150); r.terret = r.w('corps', 54, -302 + HY); r.anneau = r.w('collier', 34, 22); r.museau = r.w('tete', 80, 100);
    return r;
  };

  // =====================================================================
  // CABRIOLET — repère : sol sous l'essieu en (0,0), timon (brancards) vers +x. Racine décalée de CX pour l'ombre portée.
  // =====================================================================
  const CAB = { R: 125, CX: 150, siege: [-52, -296], brancard: [440, -208], fouet: [114, -262] };
  TAN.CAB = CAB;
  const VERT = '#3f5a45', VERTD = '#2c4132', VERTL = '#587560', OCRE = '#b8924a', OCRED = '#8a6a32';
  const SHAFT = [[24, -190, 1], [200, -200], [370, -208], [430, -218], [446, -214, 1], [440, -204, 1], [370, -198], [200, -190], [24, -178, 1]];
  function mkCabriolet() {
    const parts = {
      caisse: { parent: null, at: [-CAB.CX, 0], pts: [[-118, -182], [-122, -268, 1], [-104, -274], [60, -270], [96, -262, 1], [100, -204], [86, -180], [40, -170], [-90, -170]], base: VERT, seed: 5101, paint: () => {
        fillPts([[-122, -270], [98, -264], [98, -256], [-122, -262]], VERTD);
        strokePts([[-104, -250], [80, -246], [86, -200], [36, -186], [-92, -186], [-104, -250]], 'rgba(200,170,100,0.55)', 1.6, true);   // filet vieil or
        strokePts([[-96, -242], [74, -238], [78, -204], [34, -194], [-86, -194], [-96, -242]], 'rgba(20,30,22,0.45)', 1.1, true);
        hatch([[-130, -230], [110, -230], [110, -160], [-130, -160]], 0.7, 4.4, 0.25);
        shade(0, -272, 0, -168, 0.35, [-130, -280, 110, -160]);
      } },
      roueL: { parent: 'caisse', at: [-10, -128], pts: OFFP, base: '#000', seed: 5102, noRivet: true, extra: () => roueBois(CAB.R, OCRE, OCRED, true, 5200) },
      brancardL: { parent: 'caisse', at: [0, -8], pts: SHAFT, base: '#5a4026', seed: 5103, noRivet: true, paint: () => hatch(null, 0.1, 3, 0.25) },
      dossier: { parent: 'caisse', at: [0, 0], pts: [[-120, -270, 1], [-130, -330], [-118, -356], [-100, -352], [-104, -324], [-96, -286], [-60, -282], [-60, -270, 1]], base: VERTD, seed: 5104, noRivet: true, paint: () => {
        for (const y of [-340, -320, -300]) strokePts([[-126, y], [-100, y + 4]], 'rgba(10,20,12,0.5)', 1.2);
        strokePts([[-126, -350], [-112, -354], [-100, -350]], '#1d1d1b', 3);
        hatch(null, 0.8, 3.6, 0.25);
      } },
      ressort: { parent: 'caisse', at: [0, 0], pts: [[-70, -168], [-30, -146], [30, -146], [70, -168], [30, -160], [-30, -160]], base: '#2a2a28', seed: 5105, noRivet: true },
      garde: { parent: 'caisse', at: [0, 0], pts: [[90, -206], [100, -210], [118, -258], [140, -304, 1], [131, -309, 1], [108, -262]], base: '#211d1a', seed: 5106, noRivet: true, paint: () => strokePts([[102, -214], [118, -262], [136, -304]], 'rgba(160,150,130,0.5)', 1.4) },
      siege: { parent: 'caisse', at: [0, 0], pts: [[-118, -272], [12, -272], [16, -284, 1], [-112, -294, 1]], base: '#24332a', seed: 5107, noRivet: true, paint: () => { for (const x of [-90, -60, -30]) dot(x, -284, 2, 'rgba(200,170,100,0.6)'); } },
      lanterne: { parent: 'caisse', at: [0, 0], pts: [[76, -300], [96, -300], [98, -278], [92, -270], [80, -270], [74, -278]], base: '#2a2622', seed: 5108, noRivet: true, paint: () => { fillPts(rect(78, -296, 92, -276), 'rgba(240,220,160,0.75)'); strokePts([[76, -300], [96, -300]], LAITON, 2.4); strokePts([[86, -270], [86, -256]], '#2a2622', 3); } },
      fouet: { parent: 'caisse', at: [0, 0], pts: [[110, -262, 1], [118, -262, 1], [122, -300, 1], [114, -300, 1]], base: '#1f1b18', seed: 5109, noRivet: true, extra: (p) => {
        if (M._sil()) return; const t = p.t || 0, w = Math.sin(t * 1.7) * 4;
        strokePts([[118, -298], [130, -380], [140, -460], [146 + w * 0.3, -520]], '#4a3422', 2.6);
        strokePts([[146 + w * 0.3, -520], [160 + w, -514], [168 + w, -490], [160 + w * 0.6, -462]], '#2a2420', 1.3);
      } },
      roueR: { parent: 'caisse', at: [0, -125], pts: OFFP, base: '#000', seed: 5110, noRivet: true, extra: () => roueBois(CAB.R, OCRE, OCRED, false, 5300) },
      brancardR: { parent: 'caisse', at: [0, 0], pts: SHAFT, base: '#7a5634', seed: 5111, noRivet: true, paint: () => { strokePts([[30, -186], [200, -195], [370, -203], [436, -212]], 'rgba(255,230,180,0.35)', 1.4); hatch(null, 0.1, 3, 0.2); } },
    };
    return { hipY: 0, parts, rod: { part: 'caisse', at: [-14, -176] },
      order: ['roueL', 'brancardL', 'dossier', 'siege', 'ressort', 'caisse', 'garde', 'lanterne', 'fouet', 'roueR', 'brancardR'] };
  }
  CH.tanCabriolet = mkCabriolet();
  const CAB_LOIN = ['roueL', 'brancardL', 'dossier', 'siege'], CAB_PRES = ['ressort', 'caisse', 'garde', 'lanterne', 'fouet', 'roueR', 'brancardR'];
  const hideBut = (def, keep) => { const h = {}; for (const n of def.order) if (keep.indexOf(n) < 0) h[n] = 1; return h; };
  function cabPose(pose) {
    const q = prep(pose), t = q.t || 0;
    const roule = q.roule != null ? q.roule : (q.vitesse || 0) * t;
    const a = roule / CAB.R;
    q.ang.roueR = (q.ang.roueR || 0) + a; q.ang.roueL = (q.ang.roueL || 0) + a;
    q.dy = (q.dy || 0) - 1.6 * Math.abs(Math.sin(a * 2)) * (roule ? 1 : 0);
    return q;
  }
  // pass : 'tout' | 'loin' (roue et brancard du fond, dossier, siège) | 'pres' (caisse, roue et brancard du devant, fouet)
  TAN.cabriolet = function (pose, x, y, s, o) {
    o = o || {}; s = s == null ? 0.72 : s; const dir = o.dir || 1, def = CH.tanCabriolet;
    const q = cabPose(pose), pass = o.pass || 'tout';
    if (pass !== 'tout') q.hide = Object.assign(hideBut(def, pass === 'loin' ? CAB_LOIN : CAB_PRES), q.hide);
    const oo = Object.assign({ slot: M.ST.slotB }, o, { dir });
    if (pass === 'pres') oo.rod = o.rod; else if (pass === 'loin') { oo.rod = false; oo.floorShadow = false; oo.cast = null; }
    const r = M.puppet(def, q, x + dir * CAB.CX * s, y, s, oo);
    r.siege = r.w('caisse', CAB.siege[0], CAB.siege[1]); r.brancard = r.w('brancardR', CAB.brancard[0], CAB.brancard[1]);
    return r;
  };

  // =====================================================================
  // PERSONNAGES — pièces communes
  // =====================================================================
  const armUp = (at, base, seed, paint, r0 = 16) => ({ parent: 'torso', at, pts: capsule(94, r0, 13), base, seed, paint: paint || (() => hatch(null, 0.8, 3.6, 0.28)) });
  function armLo(parent, base, skin, seed, back, cuff) {
    const hk = (p) => (back ? p.handB : p.handF) || 'fist';
    return { parent, at: [0, 94], pts: (p) => foreP(hk(p)), base, seed, paint: (p) => {
      fillPts([[-24, 76], [24, 76], [26, 140], [-24, 140]], skin); X.handPaint(null, hk(p));
      if (cuff) fillPts([[-14, 64], [14, 64], [15, 78], [-14, 78]], cuff);
      hatch([[-14, -12], [0, -12], [0, 64], [-14, 64]], 0.8, 3.6, 0.28);
    } };
  }
  // jambe assise en deux segments (cuisse / jambe) + pied
  const THIGH = 116, SHIN = 112;
  const legUpS = (at, base, seed, rest, far) => ({ parent: 'torso', at, pts: capsule(THIGH, 20, 15), base, seed, rest: rest || 0, noRivet: !!far, paint: () => hatch(null, 0.9, 3.8, far ? 0.4 : 0.25) });
  const legLoS = (parent, base, seed, rest, paint) => ({ parent, at: [0, THIGH], pts: capsule(SHIN, 15, 10), base, seed, rest: rest || 0, paint: paint || (() => hatch(null, 0.9, 3.8, 0.25)) });
  const SHOE = [[-12, -8], [0, -14], [12, -8], [30, 2], [40, 8], [41, 14, 1], [-12, 15, 1], [-14, 4]];
  const footS = (parent, col, seed, rest) => ({ parent, at: [0, SHIN], pts: SHOE, base: col, seed, rest: rest || 0, noRivet: true, paint: () => { strokePts([[-12, 12], [40, 12]], 'rgba(255,240,220,0.2)', 1.2); } });
  function ik2(H, Tg, L1, L2, fwd) {                // deux segments dans un repère non tourné : angles absolus (0 = vers le bas, négatif = vers l'avant)
    const dx = Tg[0] - H[0], dy = Tg[1] - H[1];
    let d = Math.hypot(dx, dy); d = clamp(d, Math.abs(L1 - L2) + 1, L1 + L2 - 0.5);
    const base = Math.atan2(-dx, dy), a1 = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
    const at = base - fwd * a1, K = [H[0] - L1 * Math.sin(at), H[1] + L1 * Math.cos(at)];
    return { up: at, lo: Math.atan2(-(Tg[0] - K[0]), Tg[1] - K[1]), K };
  }

  // =====================================================================
  // COCHER — assis : (x,y) = hanche sur le siège ; casquette ronde brune, manteau ocre sombre, favoris
  // =====================================================================
  const CO = { manteau: '#8a6a3a', manteauD: '#6c522c', manteauL: '#a3824e', col: '#5a3d2b', casq: '#5a3d2b', casqD: '#3e2a1d', pant: '#4b3a2c', botte: '#1c1714', echarpe: '#7e2e26', favoris: '#8a7a66' };
  const CO_TORSO = [[-14, -178], [8, -182], [18, -170], [32, -150], [40, -110], [42, -60], [44, -14], [40, 12], [10, 20], [-30, 22, 1], [-46, 10], [-48, -40], [-46, -110], [-40, -150], [-26, -170]];
  function mkCocher() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: CO_TORSO, base: CO.manteau, seed: 6101, paint: () => {
        fillPts([[-16, -184], [10, -188], [22, -170], [26, -150], [12, -150], [-18, -164]], CO.col);              // grand col brun
        fillPts([[8, -176], [22, -172], [20, -158], [6, -160]], CO.echarpe);
        strokePts([[22, -150], [26, -60], [30, 14]], 'rgba(40,26,12,0.55)', 1.5);
        for (const y of [-120, -86, -52, -18]) { dot(32, y, 3, LAITON); dot(14, y, 3, LAITON); }
        hatch([[-50, -170], [-12, -170], [-10, 24], [-50, 24]], 0.75, 4.2, 0.32);
        shade(40, 0, -44, 0, 0.3);
      } },
      legB_up: legUpS([-4, 0], CO.pant, 6102, -1.45, true),
      legB_lo: legLoS('legB_up', CO.pant, 6103, 1.45, () => { fillPts(rect(-20, 60, 20, 130), CO.botte); hatch(null, 0.9, 3.6, 0.4); }),
      piedB: footS('legB_lo', CO.botte, 6104, 0),
      armB_up: armUp([-10, -146], CO.manteauD, 6105),
      armB_lo: armLo('armB_up', CO.manteauD, SKIND, 6106, true, CO.manteauD),
      head: { parent: 'torso', at: [6, -170], pts: X.NAP_HEAD, base: SKIN, seed: 6107, noRivet: true, paint: (p) => {
        const f = p.face || {};
        fillPts([[-10, -66], [6, -64], [10, -40], [6, -18], [-6, -14], [-14, -30]], CO.favoris);                    // favoris
        fillPts([[-36, -70], [-12, -76], [-12, -40], [-30, -30]], '#6f6252');
        X.earPaint(-8, -44);
        dot(16, -30, 8, 'rgba(205,110,90,0.32)'); dot(33, -38, 4, 'rgba(200,100,80,0.45)');                         // joue et nez rouges
        X.eye(f, 17, -52); X.brow(f, 17, -61, '#5a4c3c', 3); X.mouth(f, 27, -26);
        strokePts([[22, -44], [30, -45]], 'rgba(120,70,50,0.35)', 1);
      } },
      casquette: { parent: 'head', at: [0, -82], pts: [[-30, 24, 1], [-32, 8], [-42, -2], [-40, -14], [-20, -22], [10, -24], [34, -18], [44, -6], [38, 6], [38, 10], [66, 20], [64, 26, 1], [30, 24, 1]], base: CO.casq, seed: 6108, noRivet: true, paint: () => {
        fillPts([[-34, 8], [38, 8], [38, 26], [-34, 26]], CO.casqD);                                         // bandeau
        fillPts([[36, 10], [66, 20], [64, 26], [30, 24]], '#15110e');                                         // visière de cuir
        strokePts([[38, 12], [64, 21]], 'rgba(255,255,255,0.35)', 1.2);
        strokePts([[-38, -6], [-34, 4], [36, 4], [42, -6]], 'rgba(30,20,10,0.45)', 1.4);                     // calotte souple qui déborde
        strokePts([[-30, -18], [0, -23], [30, -18]], 'rgba(255,230,190,0.35)', 1.8);
        strokePts([[30, 22], [10, 30], [-8, 34]], '#15110e', 1.6);                                            // jugulaire
        dot(30, 16, 2.8, LAITON);
        hatch(null, 0.6, 3.8, 0.3);
      } },
      legF_up: legUpS([4, 0], CO.pant, 6109, -1.45),
      legF_lo: legLoS('legF_up', CO.pant, 6110, 1.45, () => { fillPts(rect(-20, 60, 20, 130), CO.botte); strokePts([[-12, 60], [12, 60]], 'rgba(255,240,220,0.25)', 1.2); hatch(null, 0.9, 3.6, 0.22); }),
      piedF: footS('legF_lo', CO.botte, 6111, 0),
      pan: { parent: 'torso', at: [0, 0], pts: [[-44, -16], [20, -20], [70, -6], [96, 18, 1], [10, 26], [-40, 22]], base: CO.manteau, seed: 6112, noRivet: true, paint: () => { strokePts([[-30, 4], [60, 6]], 'rgba(40,26,12,0.35)', 1.2); hatch(null, 0.3, 4.4, 0.25); } },
      armF_up: armUp([-2, -146], CO.manteau, 6113),
      armF_lo: armLo('armF_up', CO.manteau, SKIN, 6114, false, CO.manteauD),
    };
    return { hipY: 0, handLen: 104, parts, rod: { part: 'torso', at: [-26, 0] }, nom: 'cocher',
      order: ['armB_up', 'armB_lo', 'legB_up', 'legB_lo', 'piedB', 'torso', 'head', 'casquette', 'legF_up', 'legF_lo', 'piedF', 'pan', 'armF_up', 'armF_lo'] };
  }
  CH.tanCocher = mkCocher();
  const CO_MAINS = { base: [104, -62], tire: [62, -84], leve: [112, -140] };
  TAN.cocherPose = function (pose, x, y, s, dir) {
    const q = prep(pose), t = q.t || 0, def = CH.tanCocher;
    q.tilt = (q.tilt || 0) + 0.06;
    q.ang.head = (q.ang.head || 0) - 0.06 + 0.02 * Math.sin(t * 1.4) + (typeof q.tete === 'number' ? q.tete : 0);
    q.dy = (q.dy || 0) - 1.2 * Math.sin(t * 2.1);
    const ti = clamp(q.tire || 0), le = clamp(q.leve || 0), gr = q.renes === false ? 0 : 1;
    const T = [lerp(lerp(CO_MAINS.base[0], CO_MAINS.tire[0], ti), CO_MAINS.leve[0], le), lerp(lerp(CO_MAINS.base[1], CO_MAINS.tire[1], ti), CO_MAINS.leve[1], le)];
    armToLocal(def, q, x, y, s, dir, 'armB', [T[0] - 8, T[1] + 4], gr, 1);
    armToLocal(def, q, x, y, s, dir, 'armF', T, gr, 1);
    return q;
  };
  TAN.cocher = function (pose, x, y, s, o) {
    o = o || {}; s = s == null ? 0.44 : s; const dir = o.dir || 1;
    const r = M.puppet(CH.tanCocher, TAN.cocherPose(pose, x, y, s, dir), x, y, s, Object.assign({ rod: false, floorShadow: false }, o, { dir }));
    r.mainF = r.w('armF_lo', 4, 96); r.mainB = r.w('armB_lo', 4, 96);
    return r;
  };

  // =====================================================================
  // ATTELAGE EN TANDEM — cabriolet, B dans les brancards, A devant (museau de B contre la queue de A), cocher, rênes, traits
  // =====================================================================
  const ATT = { B: 318, A: 712, KC: 0.68 };
  TAN.ATT = ATT;
  TAN.attelage = function (pose, x, y, s, o) {
    pose = pose || {}; o = o || {}; s = s == null ? 0.66 : s; const dir = o.dir || 1, t = pose.t || 0;
    const slot = o.slot != null ? o.slot : M.ST.slotB, cast = o.cast;
    const allure = pose.allure || 'pas';
    const ch = (k) => Object.assign({ t, allure, ph: pose.ph != null ? pose.ph + (k === 'B' ? 0.37 : 0) : undefined, cadence: pose.cadence }, pose[k] || {});
    const cab = Object.assign({ t, roule: pose.roule, vitesse: pose.vitesse }, pose.cab || {});
    const base = { dir, slot, cast, alpha: o.alpha };
    TAN.cabriolet(cab, x, y, s, Object.assign({}, base, { pass: 'loin' }));
    const rA = TAN.cheval(ch('A'), x + dir * ATT.A * s, y, s, Object.assign({}, base, { qui: 'A' }));
    const rB = TAN.cheval(ch('B'), x + dir * ATT.B * s, y, s, Object.assign({}, base, { qui: 'B' }));
    const rc0 = TAN.cabriolet(cab, x, y, s, Object.assign({}, base, { pass: 'pres', rod: false, floorShadow: false, cast: null, alpha: 0 }));
    const rC = TAN.cocher(Object.assign({ t }, pose.cocher || {}), rc0.siege[0], rc0.siege[1], s * ATT.KC, { dir, cast: null, alpha: o.alpha });
    const rc = TAN.cabriolet(cab, x, y, s, Object.assign({}, base, { pass: 'pres' }));
    if (!M._sil()) {
      const c = cx_(); c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.lineCap = 'round'; c.lineJoin = 'round';
      if (o.alpha != null) c.globalAlpha = o.alpha;
      const line = (pts, col, w) => { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length - 1; i++) { const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2; c.quadraticCurveTo(pts[i][0], pts[i][1], mx, my); } c.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]); c.strokeStyle = col; c.lineWidth = w; c.stroke(); };
      const sag = (a, b, d) => [a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + d], b];
      const w = Math.max(1.6, 3.2 * s);
      // traits de A jusqu'au bout des brancards
      const tip = rc.brancard;
      for (const [col, ww] of [['rgba(20,12,6,0.85)', w + 1.6], [CUIRL, w]]) line(sag(rA.anneau, tip, 10 * s), col, ww);
      // rênes : mains du cocher → terret de B → mors de A ; mains → mors de B
      const hand = [(rC.mainF[0] + rC.mainB[0]) / 2, (rC.mainF[1] + rC.mainB[1]) / 2];
      for (const [col, ww] of [['rgba(20,12,6,0.85)', w + 1.2], ['#6b4a2e', w * 0.8]]) {
        line(sag(hand, rB.terret, 14 * s), col, ww); line(sag(rB.terret, rA.mors, 18 * s), col, ww);
        line(sag(hand, rB.mors, 24 * s), col, ww);
      }
      c.restore();
    }
    return { A: rA, B: rB, cab: rc, cocher: rC, avant: rA.museau, arriere: [x - dir * 130 * s, y] };
  };

  // =====================================================================
  // TANDEM — repère : sol au milieu des deux roues (0,0), avant vers +x. Cadre rouge sourd, deux selles, deux guidons.
  // =====================================================================
  const TD = { RW: 100, RA: [-255, -100], FA: [255, -100], BB1: [-105, -78], BB2: [130, -78], C1: [-140, -226], C2: [84, -226], H1: [212, -250], H2: [226, -198],
    S1: [-152, -252], S2: [90, -252], G1: [-18, -288], G2: [190, -292], CR: 50, RATIO: 2.2, ROUGE: '#8a3a2e', ROUGEL: '#a95646', ROUGED: '#6a2a22' };
  TAN.TD = TD;
  function drawCadre(p) {
    const T = (a, b, w, col) => pc(band(a, b, w), col || TD.ROUGE, () => strokePts([a, b], 'rgba(255,220,200,0.35)', 1.2), 7000 + Math.round(a[0] + b[1]));
    T(TD.RA, TD.BB1, 8); T(TD.RA, TD.C1, 7); T(TD.BB1, [TD.C1[0] + 2, TD.C1[1] + 4], 10);
    T(TD.BB1, TD.C2, 10); T([-122, -140], [TD.C2[0] - 2, TD.C2[1] + 34], 9);         // cadre arrière ouvert (deux tubes obliques, pour la jupe)
    T(TD.BB1, TD.BB2, 9); T(TD.BB2, TD.C2, 10); T(TD.C2, TD.H1, 10); T(TD.BB2, TD.H2, 11);
    T(TD.H1, TD.H2, 13, TD.ROUGED);
    T(TD.H2, [240, -150], 9); T([240, -150], TD.FA, 8);                                 // fourche
    // tiges de selle, potences et guidons (acier)
    const AC = '#5e5a55';
    T([TD.C1[0], TD.C1[1]], [TD.S1[0] + 2, TD.S1[1] + 12], 6, AC); T([TD.C2[0], TD.C2[1]], [TD.S2[0] + 2, TD.S2[1] + 12], 6, AC);
    T(TD.H1, [208, -290], 6, AC); pc([[208, -294, 1], [196, -296], [TD.G2[0] - 4, TD.G2[1] - 2], [TD.G2[0] - 6, TD.G2[1] + 5, 1], [196, -289], [210, -286, 1]], AC, null, 7101);
    T([TD.C2[0] + 2, TD.C2[1] - 10], [40, -280], 6, AC); pc([[42, -284, 1], [20, -290], [TD.G1[0] - 4, TD.G1[1] - 3], [TD.G1[0] - 6, TD.G1[1] + 4, 1], [20, -283], [40, -276, 1]], AC, null, 7102);
    // poignées de liège, selles de cuir à ressorts
    for (const G of [TD.G1, TD.G2]) pc(rect(G[0] - 18, G[1] - 6, G[0] + 6, G[1] + 6), '#7a5a3a', null, 7103 + G[0]);
    for (const S of [TD.S1, TD.S2]) {
      pc([[S[0] - 26, S[1] + 4], [S[0] - 20, S[1] - 6], [S[0] + 8, S[1] - 6], [S[0] + 30, S[1] + 2, 1], [S[0] + 8, S[1] + 8], [S[0] - 24, S[1] + 10]], '#4a3020', () => strokePts([[S[0] - 20, S[1] - 3], [S[0] + 20, S[1] - 2]], 'rgba(255,230,190,0.3)', 1.2), 7110 + S[0]);
      if (!M._sil()) for (const dx of [-16, -8]) strokePts([[S[0] + dx, S[1] + 10], [S[0] + dx + 4, S[1] + 14], [S[0] + dx, S[1] + 18], [S[0] + dx + 4, S[1] + 22]], '#3a3632', 1.6);
    }
    // garde-boue arrière
    pc(arcBand(TD.RA, TD.RW + 12, TD.RW + 18, -2.6, -1.0), '#2a2725', null, 7120);
    // frein à cuillère sur le pneu avant, sonnette
    const fr = clamp(p.freine || 0);
    T([214, -294], [252, -210 + 4 * fr], 3.4, AC);
    pc(rect(238, -212 + 4 * fr, 266, -204 + 4 * fr), '#2a2725', null, 7121);
    pc([[206, -296, 1], [226, -300 - 10 * fr], [228, -294 - 10 * fr], [208, -290, 1]], AC, null, 7122);   // levier de frein
    pc(ell(200, -306, 9, 7, 12), LAITON, () => dot(197, -309, 3, LAITONL), 7123);
    if (!M._sil() && p.sonnette > 0) {
      const k = clamp(p.sonnette), u = ((p.t || 0) * 5) % 1;
      for (let i = 0; i < 3; i++) { const r = 14 + (i + u) * 9; strokePts([[200 + Math.cos(-2.4) * r, -306 + Math.sin(-2.4) * r], [200 + Math.cos(-1.6) * r, -306 + Math.sin(-1.6) * r], [200 + Math.cos(-0.8) * r, -306 + Math.sin(-0.8) * r]], `rgba(255,236,170,${0.8 * k * (1 - (i + u) / 3)})`, 2); }
    }
  }
  function arcBand(C, r0, r1, a0, a1) { const p = []; const n = 14; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; p.push([C[0] + Math.cos(a) * r1, C[1] + Math.sin(a) * r1]); } for (let i = n; i >= 0; i--) { const a = a0 + (a1 - a0) * i / n; p.push([C[0] + Math.cos(a) * r0, C[1] + Math.sin(a) * r0]); } return p; }
  function drawChaines(p) {
    if (M._sil()) return;
    const th = p._th || 0;
    const ch = (A, rA, B, rB, off) => {
      const top = [[A[0], A[1] - rA], [B[0], B[1] - rB]], bot = [[A[0], A[1] + rA], [B[0], B[1] + rB]];
      strokePts(top, '#2b2926', 3); strokePts(bot, '#2b2926', 3);
      for (const [a, b, sg] of [[top[0], top[1], 1], [bot[1], bot[0], 1]]) {
        const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.floor(L / 9);
        for (let i = 0; i < n; i++) { const u = ((i + (off * sg) / 9) % n + n) % n / n; dot(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, 1.5, '#9a958c'); }
      }
    };
    ch(TD.BB2, 20, TD.BB1, 20, th * 20);
    ch(TD.BB1, 20, TD.RA, 10, th * 20);
  }
  const plateau = (r, seed) => ({ pts: () => { const q = []; for (let i = 0; i < 28; i++) { const a = i / 28 * TAU, rr = i % 2 ? r : r + 3; q.push([Math.cos(a) * rr, Math.sin(a) * rr]); } return q; }, base: '#7d7870', seed, noRivet: true, paint: () => { for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; strokePts([[0, 0], [Math.cos(a) * (r - 4), Math.sin(a) * (r - 4)]], '#4a4640', 2.4); } } });
  const maniv = (seed, far) => ({ pts: [[-5, -4, 1], [5, -4, 1], [5, TD.CR, 1], [16, TD.CR - 4, 1], [16, TD.CR + 6, 1], [-16, TD.CR + 6, 1], [-16, TD.CR - 4, 1], [-5, TD.CR, 1]], base: far ? '#4a4742' : '#76716a', seed, noRivet: far });
  function mkTandem() {
    const parts = {
      cadre: { parent: null, at: [0, 0], pts: OFFP, base: '#000', seed: 7001, noRivet: true, extra: (p) => drawCadre(p) },
      roueAR: { parent: 'cadre', at: TD.RA, pts: OFFP, base: '#000', seed: 7002, noRivet: true, extra: () => roueVelo(TD.RW, 7300) },
      roueAV: { parent: 'cadre', at: TD.FA, pts: OFFP, base: '#000', seed: 7003, noRivet: true, extra: () => roueVelo(TD.RW, 7310) },
      pignon: Object.assign({ parent: 'cadre', at: TD.RA }, plateau(10, 7004)),
      manivB1: Object.assign({ parent: 'cadre', at: TD.BB1 }, maniv(7005, true)), manivB2: Object.assign({ parent: 'cadre', at: TD.BB2 }, maniv(7006, true)),
      chaines: { parent: 'cadre', at: [0, 0], pts: OFFP, base: '#000', seed: 7007, noRivet: true, extra: (p) => drawChaines(p) },
      plateau1: Object.assign({ parent: 'cadre', at: TD.BB1 }, plateau(20, 7008)), plateau2: Object.assign({ parent: 'cadre', at: TD.BB2 }, plateau(20, 7009)),
      manivF1: Object.assign({ parent: 'cadre', at: TD.BB1 }, maniv(7010, false)), manivF2: Object.assign({ parent: 'cadre', at: TD.BB2 }, maniv(7011, false)),
    };
    return { hipY: 0, parts, rod: { part: 'cadre', at: [12, -80] },
      order: ['roueAR', 'roueAV', 'manivB1', 'manivB2', 'cadre', 'pignon', 'chaines', 'plateau1', 'plateau2', 'manivF1', 'manivF2'] };
  }
  CH.tanTandem = mkTandem();
  const TD_FOND = ['roueAR', 'roueAV', 'manivB1', 'manivB2'], TD_MILIEU = ['cadre', 'pignon', 'chaines', 'plateau1', 'plateau2', 'manivF1', 'manivF2'];

  // ---- cycliste avant : homme, moustache, casquette plate à carreaux bleu-gris, pull moutarde, dos large
  const CA = { pull: '#b08a2e', pullD: '#8c6c20', pullL: '#c9a548', culotte: '#6b665a', culotteD: '#55514a', bas: '#3f4a3a', soulier: '#3a2618', casq: '#7d8a99', casqD: '#5c6878', casqL: '#aab4bf', mous: '#4a3020', chev: '#5a3a24' };
  const CA_TORSO = [[-14, -178], [8, -182], [18, -170], [30, -150], [36, -112], [38, -62], [38, -12], [32, 12], [-8, 18], [-44, 14, 1], [-58, -16], [-66, -66], [-68, -112], [-62, -150], [-44, -172], [-28, -180]];
  const CA_CAP = [[-38, 6], [-38, -10], [-28, -24], [-6, -30], [18, -26], [38, -14], [56, -4], [66, 2], [64, 8, 1], [34, 8], [-38, 10, 1]];
  function mkCycAv() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: CA_TORSO, base: CA.pull, seed: 7501, paint: () => {
        fillPts([[-18, -186], [12, -190], [22, -172], [14, -160], [-20, -166]], CA.pullD);                              // col roulé
        for (let x = -60; x < 40; x += 6) strokePts([[x, -2], [x + 1, 16]], 'rgba(90,60,10,0.45)', 1.2);              // côtes du bas
        fillPts([[-66, -4], [38, -6], [38, 2], [-66, 4]], 'rgba(120,90,20,0.35)');
        for (let y = -150; y < -10; y += 10) strokePts([[-66, y], [36, y + 2]], 'rgba(120,90,20,0.18)', 1);          // tricot
        hatch([[-72, -176], [-24, -176], [-20, 14], [-72, 14]], 0.75, 4, 0.36);
        shade(38, 0, -66, 0, 0.32);
      } },
      legB_up: legUpS([0, 0], CA.culotteD, 7502, 0, true),
      legB_lo: legLoS('legB_up', CA.culotteD, 7503, 0, () => { fillPts(rect(-20, 18, 20, 140), M.mixc(CA.bas, '#000000', 0.25)); hatch(null, 0.9, 3.6, 0.4); }),
      piedB: footS('legB_lo', '#2a1c12', 7504, 0),
      armB_up: armUp([-10, -146], CA.pullD, 7505),
      armB_lo: armLo('armB_up', CA.pullD, SKIND, 7506, true, CA.pullD),
      head: { parent: 'torso', at: [6, -170], pts: X.NAP_HEAD, base: SKIN, seed: 7507, noRivet: true, paint: (p) => {
        const f = p.face || {};
        fillPts([[-30, -76], [-6, -80], [-12, -50], [-26, -34], [-34, -50]], CA.chev);
        fillPts([[-4, -66], [4, -64], [4, -48], [-2, -46]], CA.chev);
        X.earPaint(-8, -44);
        dot(14, -32, 8, 'rgba(205,120,95,0.3)');
        X.eye(f, 17, -52); X.brow(f, 17, -61, CA.mous, 3);
        X.mouth(f, 26, -22);
        fillPts([[16, -34], [28, -38], [38, -36], [42, -28], [38, -22], [30, -27], [22, -24], [14, -26]], CA.mous);   // moustache en guidon
        strokePts([[40, -27], [44, -32]], CA.mous, 2.2);
        strokePts([[20, -32], [34, -34]], 'rgba(255,230,200,0.25)', 1);
      } },
      casquette: { parent: 'head', at: [-2, -82], pts: CA_CAP, base: CA.casq, seed: 7508, noRivet: true, paint: () => {
        for (let x = -40; x < 70; x += 9) strokePts([[x, -32], [x + 10, 12]], CA.casqD, 1.4);
        for (let y = -28; y < 12; y += 8) strokePts([[-40, y], [66, y + 3]], CA.casqD, 1.4);
        for (let x = -36; x < 70; x += 18) strokePts([[x, -32], [x + 10, 12]], CA.casqL, 0.9);
        fillPts([[30, 2], [64, 2], [64, 9], [30, 9]], 'rgba(40,50,60,0.4)');
        dot(-6, -28, 2.6, CA.casqD);
      } },
      legF_up: legUpS([0, 0], CA.culotte, 7509, 0),
      legF_lo: legLoS('legF_up', CA.culotte, 7510, 0, () => {
        fillPts([[-22, 12], [22, 12], [22, 26], [-22, 24]], CA.culotteD);                                              // bouffant de la culotte
        fillPts(rect(-20, 24, 20, 140), CA.bas); for (let y = 34; y < 110; y += 10) strokePts([[-16, y], [16, y]], 'rgba(255,255,255,0.12)', 1);
        hatch(null, 0.9, 3.6, 0.2);
      }),
      piedF: footS('legF_lo', CA.soulier, 7511, 0),
      armF_up: armUp([-2, -146], CA.pull, 7512),
      armF_lo: armLo('armF_up', CA.pull, SKIN, 7513, false, CA.pullD),
    };
    return { hipY: 0, handLen: 104, parts, rod: { part: 'torso', at: [-26, 0] }, nom: 'cycliste avant',
      order: ['legB_up', 'legB_lo', 'piedB', 'armB_up', 'armB_lo', 'torso', 'head', 'casquette', 'legF_up', 'legF_lo', 'piedF', 'armF_up', 'armF_lo'] };
  }
  CH.tanCycAv = mkCycAv();

  // ---- cycliste arrière : femme, grand chapeau crème à ruban prune, robe longue gris-vert
  const CB = { robe: '#6f7f72', robeD: '#566459', robeL: '#8b9a8d', prune: '#6b3a55', pruneL: '#8a5574', chap: '#d9d1c6', chapD: '#b9aea0', chev: '#5b3a26', bottine: '#2a1e1a' };
  const CB_TORSO = [[-12, -178], [8, -182], [16, -168], [26, -150], [34, -128], [32, -100], [22, -72], [22, -34], [30, -2], [24, 16], [-24, 18, 1], [-38, 4], [-32, -40], [-28, -80], [-32, -120], [-30, -150], [-24, -168]];
  const CB_HAT = [[-84, 4], [-60, -2], [-34, -6], [-32, -30], [-18, -44], [8, -46], [28, -36], [34, -10], [60, -6], [92, 2], [90, 10, 1], [40, 12], [-40, 12], [-80, 12, 1]];
  // lift = { x, y, r } : chapeau soulevé (repère de la tête)
  const hatLift = (p) => p._hat || { x: 0, y: 0, r: 0 };
  const tfp = (pts, L) => { const c = Math.cos(L.r), s = Math.sin(L.r); return pts.map((q) => [q[0] * c - q[1] * s + L.x, q[0] * s + q[1] * c + L.y, q[2]]); };
  function mkCycAr() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: CB_TORSO, base: CB.robe, seed: 7601, paint: () => {
        fillPts([[-10, -188], [10, -190], [16, -170], [10, -160], [-12, -166]], CB.robeD);                      // col montant
        fillPts([[10, -168], [20, -164], [24, -146], [14, -142]], '#ece4d2');                                       // jabot ivoire
        fillPts([[-34, -46], [24, -42], [24, -30], [-34, -34]], CB.prune);                                          // ceinture prune
        dot(18, -36, 3, LAITON);
        strokePts([[22, -150], [16, -100], [18, -46]], 'rgba(40,50,40,0.4)', 1.3);
        hatch([[-40, -176], [-10, -176], [-10, 18], [-40, 18]], 0.75, 4, 0.33);
        shade(32, 0, -36, 0, 0.28);
      } },
      legB_up: legUpS([0, 0], CB.robeD, 7602, 0, true),
      legB_lo: legLoS('legB_up', '#2e2b2b', 7603, 0, () => { fillPts(rect(-20, 92, 20, 140), CB.bottine); hatch(null, 0.9, 3.6, 0.4); }),
      piedB: footS('legB_lo', CB.bottine, 7604, 0),
      armB_up: { parent: 'torso', at: [-10, -146], pts: capsule(94, 22, 12), base: CB.robeD, seed: 7605, paint: () => hatch(null, 0.8, 3.6, 0.32) },
      armB_lo: armLo('armB_up', CB.robeD, SKIND, 7606, true, CB.robeD),
      jupe: { parent: 'torso', at: [0, 0], pts: [[-38, 4], [26, -20], [98, -24], [142, -4], [156, 30], [146, 72], [134, 116], [120, 150, 1], [86, 160], [50, 154], [14, 160], [-10, 152, 1], [-30, 108], [-42, 50]], base: CB.robe, seed: 7607, noRivet: true, paint: () => {
        for (const [a, b] of [[[4, -8], [10, 152]], [[56, -18], [62, 154]], [[112, -2], [118, 152]]]) strokePts([a, [(a[0] + b[0]) / 2 + 5, (a[1] + b[1]) / 2], b], 'rgba(30,40,30,0.35)', 1.4);
        strokePts([[-8, 150], [14, 157], [50, 151], [86, 157], [118, 148]], CB.robeD, 3.4);
        strokePts([[30, -14], [100, -18], [150, 20]], 'rgba(255,255,255,0.18)', 2);
        hatch([[-40, -30], [40, -30], [40, 130], [-40, 130]], 0.9, 4.4, 0.3);
        shade(0, -20, 0, 125, 0.25, [-40, -30, 160, 130]);
      } },
      head: { parent: 'torso', at: [6, -170], pts: X.NAP_HEAD, base: SKIN, seed: 7608, noRivet: true, paint: (p) => {
        const f = p.face || {};
        fillPts([[-34, -80], [-4, -86], [6, -74], [-6, -60], [-22, -36], [-36, -46]], CB.chev);
        X.earPaint(-8, -44); dot(-6, -32, 2.6, LAITONL);
        dot(15, -30, 8, 'rgba(215,125,115,0.32)');
        X.eye(f, 17, -52); strokePts([[10, -55], [6, -58]], '#2a1a14', 1.2);
        X.brow(f, 17, -61, '#4a2e1e', 2); X.mouth(f, 27, -27, '#a04a48');
      }, extra: () => {                                                                                              // chignon
        if (M._sil()) return;
        pc(ell(-34, -54, 14, 13, 14), CB.chev, () => strokePts([[-42, -56], [-30, -60], [-26, -50]], 'rgba(255,220,180,0.25)', 1.2), 7609);
      } },
      chapeau: { parent: 'head', at: [0, -80], pts: (p) => tfp(CB_HAT, hatLift(p)), base: CB.chap, seed: 7610, noRivet: true, paint: (p) => {
        const L = hatLift(p), c = cx_(); c.save(); c.translate(L.x, L.y); c.rotate(L.r);
        fillPts([[-36, -16], [34, -14], [34, -4], [-36, -6]], CB.prune);
        fillPts([[-84, 6], [92, 6], [90, 12], [-80, 12]], CB.chapD);
        hatch(null, 0.5, 4, 0.18, 1, M.P.encre, [-90, -50, 95, 14]);
        c.restore();
      }, extra: (p) => {
        const L = hatLift(p), c = cx_(), t = p.t || 0, w = Math.sin(t * 6) * 0.08 + (p._vent || 0) * 0.3;
        c.save(); c.translate(L.x, L.y); c.rotate(L.r);
        pc([[-34, -14], [-58, -26], [-60, -6], [-36, -8]], CB.prune, null, 7611);                                // nœud
        c.save(); c.translate(-46, -10); c.rotate(-w - 0.2);
        pc([[0, -4], [-46, 6], [-62, 22, 1], [-44, 14], [0, 6]], CB.pruneL, () => strokePts([[0, 0], [-44, 10]], 'rgba(255,220,240,0.3)', 1), 7612);   // pans du ruban
        c.rotate(0.35); pc([[0, -2], [-38, 18], [-48, 34, 1], [-34, 22], [0, 6]], CB.prune, null, 7613);
        c.restore();
        pc(ell(-30, -12, 7, 7, 10), CB.pruneL, null, 7614);
        c.restore();
      } },
      legF_up: legUpS([0, 0], CB.robe, 7615, 0),
      legF_lo: legLoS('legF_up', '#3a3534', 7616, 0, () => { fillPts(rect(-20, 92, 20, 140), CB.bottine); for (let y = 96; y < 112; y += 5) dot(10, y, 1.4, LAITON); hatch(null, 0.9, 3.6, 0.2); }),
      piedF: footS('legF_lo', CB.bottine, 7617, 0),
      armF_up: { parent: 'torso', at: [-2, -146], pts: capsule(94, 22, 12), base: CB.robe, seed: 7618, paint: () => { strokePts([[-14, -6], [0, -18], [14, -8]], 'rgba(40,50,40,0.4)', 1.2); hatch([[-22, -20], [-6, -20], [-6, 100], [-22, 100]], 0.8, 3.6, 0.3); } },
      armF_lo: armLo('armF_up', CB.robe, SKIN, 7619, false, '#ece4d2'),
    };
    return { hipY: 0, handLen: 104, parts, rod: { part: 'torso', at: [-26, 0] }, nom: 'cycliste arrière',
      order: ['legB_up', 'legB_lo', 'piedB', 'armB_up', 'armB_lo', 'torso', 'head', 'chapeau', 'legF_up', 'legF_lo', 'piedF', 'jupe', 'armF_up', 'armF_lo'] };
  }
  CH.tanCycAr = mkCycAr();
  const CYC_LOIN = ['legB_up', 'legB_lo', 'piedB', 'armB_up', 'armB_lo'];

  // pose d'un cycliste : hanche H (repère vélo), pédales, guidon, gestes ; renvoie [pose, xh, yh]
  function cycPose(def, src, H, G, BB, th, Mb, s, dir, arr) {
    const q = prep(src), t = q.t || 0;
    const pen = clamp(q.penche || 0, -1, 1) * dir, fr = clamp(q.freine || 0);
    q.tilt = (arr ? 0.22 : 0.30) + 0.34 * pen + 0.12 * fr + 0.012 * Math.sin(t * 2.3 + (arr ? 1 : 0));
    const et = clamp(q.etire || 0);
    q.dy = (q.dy || 0) - 26 * et - 1.2 * Math.abs(Math.sin(th));
    q.ang.head = (q.ang.head || 0) + 0.38 * clamp(q.regard || 0, -1, 1) - 0.12 * et - 0.3 * Math.max(0, pen) * 0.5;
    const Hx = H[0] + Math.cos(q.tilt) * (q.dx || 0) - Math.sin(q.tilt) * q.dy, Hy = H[1] + Math.sin(q.tilt) * (q.dx || 0) + Math.cos(q.tilt) * q.dy;
    // jambes sur les pédales (genou en avant), pied à plat
    for (const [lg, a] of [['legF', th], ['legB', th + PI]]) {
      const Pd = [BB[0] - TD.CR * Math.sin(a), BB[1] + TD.CR * Math.cos(a)], Ank = [Pd[0] - 20, Pd[1] - 15];
      const sol = ik2([Hx, Hy], Ank, THIGH, SHIN, 1);
      q.ang[lg + '_up'] = sol.up - q.tilt; q.ang[lg + '_lo'] = sol.lo - sol.up;
      q.ang[lg === 'legF' ? 'piedF' : 'piedB'] = 0.05 - sol.lo;
    }
    const hp = M.wpt(Mb, H[0], H[1]);
    const xh = hp[0] + 0, yh = hp[1];
    const g = (pt) => M.wpt(Mb, pt[0], pt[1]);
    armToScreen(def, q, xh, yh, s, dir, 'armB', g([G[0] - 4, G[1] + 2]), 1, 1);
    armToScreen(def, q, xh, yh, s, dir, 'armF', g(G), 1, 1);
    return [q, xh, yh];
  }
  TAN.tandem = function (pose, x, y, s, o) {
    pose = pose || {}; o = o || {}; s = s == null ? 0.75 : s; const dir = o.dir || 1, t = pose.t || 0, def = CH.tanTandem;
    const roule = pose.roule != null ? pose.roule : (pose.vitesse || 0) * t;
    const wa = roule / TD.RW, th = wa / TD.RATIO;
    const bq = { t, _th: th, freine: pose.freine || 0, sonnette: pose.sonnette || 0, ang: { roueAR: wa, roueAV: wa, pignon: wa, plateau1: th, plateau2: th, manivF1: th, manivF2: th, manivB1: th + PI, manivB2: th + PI } };
    const Mb = M.partMatrices(def, bq, x, y, s, dir).mats.cadre;
    const slot = o.slot != null ? o.slot : M.ST.slotF, cast = o.cast, alpha = o.alpha;
    // cycliste avant
    const srcA = Object.assign({ t, freine: pose.freine, penche: pose.penche, regard: pose.regard, face: pose.face }, pose.avant || {});
    const [qa, xa, ya] = cycPose(CH.tanCycAv, srcA, TD.S2, TD.G2, TD.BB2, th, Mb, s, dir, false);
    const bt = clamp(pose.brasTendu || 0);
    if (bt > 0) { armToLocal(CH.tanCycAv, qa, xa, ya, s, dir, 'armF', [182, -150], bt, 1); if (bt > 0.5) qa.handF = 'open'; }
    // cycliste arrière
    const srcB = Object.assign({ t, freine: pose.freine, penche: pose.pencheB, regard: pose.regardB, etire: pose.etireB, face: pose.faceB }, pose.arriere || {});
    const [qb, xb, yb] = cycPose(CH.tanCycAr, srcB, TD.S1, TD.G1, TD.BB1, th, Mb, s, dir, true);
    qb._vent = Math.min(1, Math.abs(pose.vitesse || 0) / 300);
    const btB = clamp(pose.brasTenduB || 0);
    if (btB > 0) { armToLocal(CH.tanCycAr, qb, xb, yb, s, dir, 'armF', [182, -150], btB, 1); if (btB > 0.5) qb.handF = 'open'; }
    const ch = clamp(pose.chapeauB || 0);
    if (ch > 0) {
      const k1 = sm(0, 0.45, ch), k2 = sm(0.4, 1, ch);
      qb._hat = { x: 6 * k2, y: -62 * k2, r: -0.28 * k2 };
      qb.ang.head = (qb.ang.head || 0) + 0.12 * k2;
      const hm = M.partMatrices(CH.tanCycAr, qb, xb, yb, s, dir).mats.head;
      const bp = tfp([[48, -6]], qb._hat)[0];
      armToScreen(CH.tanCycAr, qb, xb, yb, s, dir, 'armF', M.wpt(hm, bp[0], bp[1] - 80), k1, 1);
      qb.handF = 'fist';
    }
    const hideC = (keep, D) => hideBut(D, keep);
    const base = { dir, alpha };
    // 1) roues, manivelles du fond, tige
    M.puppet(def, Object.assign({}, bq, { hide: hideBut(def, TD_FOND) }), x, y, s, Object.assign({}, base, { slot, cast: null }));
    // 2) membres du fond des cyclistes
    M.puppet(CH.tanCycAr, Object.assign({}, qb, { hide: hideC(CYC_LOIN, CH.tanCycAr) }), xb, yb, s, Object.assign({}, base, { rod: false, floorShadow: false }));
    M.puppet(CH.tanCycAv, Object.assign({}, qa, { hide: hideC(CYC_LOIN, CH.tanCycAv) }), xa, ya, s, Object.assign({}, base, { rod: false, floorShadow: false }));
    // 3) cadre, chaînes, manivelles du devant
    const rv = M.puppet(def, Object.assign({}, bq, { hide: hideBut(def, TD_MILIEU) }), x, y, s, Object.assign({}, base, { rod: false, floorShadow: false, cast }));
    // 4) corps des cyclistes (arrière d'abord : l'avant passe devant)
    const near = (D) => { const h = {}; for (const n of CYC_LOIN) h[n] = 1; return h; };
    const rb = M.puppet(CH.tanCycAr, Object.assign({}, qb, { hide: Object.assign(near(), qb.hide) }), xb, yb, s, Object.assign({}, base, { rod: false, floorShadow: false, cast }));
    const ra = M.puppet(CH.tanCycAv, Object.assign({}, qa, { hide: Object.assign(near(), qa.hide) }), xa, ya, s, Object.assign({}, base, { rod: false, floorShadow: false, cast }));
    const w = (pt) => M.wpt(Mb, pt[0], pt[1]);
    return { avant: ra, arriere: rb, velo: rv, guidon: w(TD.G2), sonnette: w([200, -306]), roueAV: w(TD.FA), roueAR: w(TD.RA), nez: w([360, -100]), queue: w([-360, -100]) };
  };

  // =====================================================================
  // ÉTUDIANT FARCEUR — debout ; toque carrée noire à gland or, toge noire, col blanc, petit livre fermé
  // =====================================================================
  const ET = { toge: '#2a2a33', togeL: '#3d3d4a', togeD: '#1c1c23', blanc: '#eeeadf', noir: '#151419', or: '#c9a347', orD: '#8f7230', chev: '#4a3424', pant: '#24232a', soulier: '#141216', livre: '#2c3a5c', livreD: '#1e2840', page: '#e8dfc6' };
  const ET_TORSO = [[-14, -178], [8, -182], [18, -170], [30, -152], [38, -118], [42, -60], [46, 0], [52, 80], [60, 160], [66, 206, 1], [-62, 210, 1], [-56, 160], [-50, 80], [-46, 0], [-44, -60], [-42, -118], [-36, -152], [-26, -170]];
  const LIVRE = [[-10, -56, 1], [44, -56, 1], [44, 18, 1], [-10, 18, 1]];
  function drawLivre() {
    pc(LIVRE, ET.livre, () => {
      fillPts(rect(-10, -56, 0, 18), ET.livreD);                                         // dos (côté main)
      fillPts(rect(40, -52, 45, 14), ET.page); for (let y = -48; y < 12; y += 4) strokePts([[40, y], [45, y]], 'rgba(120,100,70,0.4)', 0.8);
      strokePts([[6, -48], [34, -48], [34, 10], [6, 10], [6, -48]], 'rgba(201,163,71,0.55)', 1.2);     // filet doré (sans titre)
      hatch(null, 0.7, 3.6, 0.2);
    }, 8301);
  }
  function mkEtudiant() {
    const has = (v) => v && v !== 'rien';
    const parts = {
      legB: { parent: 'torso', at: [-6, -2], pts: X.legPts(0.9), base: '#1d1c22', seed: 8102, noRivet: true, paint: () => { fillPts([[-40, 214], [60, 214], [60, 260], [-40, 260]], ET.soulier); } },
      legF: { parent: 'torso', at: [6, -2], pts: X.legPts(0.9), base: ET.pant, seed: 8103, paint: () => { fillPts([[-40, 214], [60, 214], [60, 260], [-40, 260]], ET.soulier); strokePts([[-14, 222], [40, 224]], 'rgba(255,255,255,0.18)', 1.2); } },
      armB_up: armUp([-10, -146], ET.togeD, 8104, null, 18),
      armB_lo: armLo('armB_up', ET.togeD, SKIND, 8105, true, ET.blanc),
      mancheB: { parent: 'armB_lo', at: [0, 0], pts: [[-13, 26], [13, 26], [26, 70], [22, 80, 1], [-24, 82, 1], [-20, 66]], base: ET.togeD, seed: 8106, noRivet: true, paint: () => hatch(null, 0.9, 3.4, 0.3) },
      livreB: { parent: 'armB_lo', at: [4, 96], pts: OFFP, base: '#000', seed: 8107, noRivet: true, extra: (p) => { if (p.livre === 'arriere') drawLivre(); } },
      doigtsB: { parent: 'armB_lo', at: [4, 96], pts: (p) => (p.livre === 'arriere' ? DOIGTS : OFFP), base: SKIND, seed: 8108, noRivet: true, paint: doigtsPaint },
      head: { parent: 'torso', at: [6, -170], pts: X.NAP_HEAD, base: SKIN, seed: 8109, noRivet: true, paint: (p) => {
        const f = p.face || {}, mal = p.malice == null ? 1 : p.malice, so = clamp(p.souffle || 0);
        fillPts([[-34, -82], [-4, -90], [6, -78], [-4, -70], [-20, -44], [-34, -52]], ET.chev);
        fillPts([[4, -80], [14, -74], [8, -68]], ET.chev);                                                       // mèche
        X.earPaint(-8, -44);
        dot(15, -31, 8 + 2 * so, `rgba(215,125,105,${0.25 + 0.2 * so})`);
        X.eye(Object.assign({ eyes: so > 0.5 ? 'closed' : (mal > 0.5 ? 'half' : 'open') }, f), 17, -52);
        X.brow(Object.assign({ brow: mal > 0.5 ? 'up' : 'n' }, f), 17, -61, '#3a2618', 2.6);
        if (f.mouth || so > 0.5) X.mouth(Object.assign({ mouth: 'o' }, f), 27, -27);
        else if (mal > 0.3) { strokePts([[28, -27], [23, -27.5], [17, -31.5]], 'rgba(110,40,38,0.95)', 1.8); dot(15, -33, 1.3, 'rgba(110,40,38,0.6)'); }
        else X.mouth(f, 27, -27);
      }, extra: (p) => {
        const so = clamp(p.souffle || 0); if (!(so > 0.05) || M._sil()) return;
        const u = ((p.t || 0) * 1.8) % 1;
        for (let i = 0; i < 3; i++) strokePts([[34 + 18 * u, -30 + (i - 1) * 5], [46 + 34 * u, -30 + (i - 1) * 9]], `rgba(245,245,240,${0.85 * so * (1 - u)})`, 2.2);
      } },
      torso: { parent: null, at: [0, 0], pts: ET_TORSO, base: ET.toge, seed: 8101, paint: () => {
        fillPts([[-16, -184], [10, -188], [22, -172], [16, -162], [-14, -168]], ET.blanc);                     // col blanc
        fillPts([[12, -168], [24, -164], [27, -138], [19, -136], [15, -156]], ET.blanc); strokePts([[19, -164], [22, -138]], 'rgba(120,110,90,0.5)', 1);   // rabat
        fillPts([[-40, -170], [-6, -176], [-2, -150], [-42, -138]], ET.togeL);                                  // empiècement
        strokePts([[22, -150], [30, -60], [40, 60], [52, 206]], 'rgba(90,90,110,0.6)', 1.6);                    // bord de la toge ouverte
        for (const x of [-30, -10, 10]) strokePts([[x, -120], [x - 6, 40], [x - 10, 206]], 'rgba(80,80,100,0.45)', 1.3);
        hatch([[-66, -170], [-16, -170], [-16, 212], [-66, 212]], 0.75, 4, 0.32, 1.05, '200,200,220');
        shade(46, 0, -56, 0, 0.3, [-70, -200, 70, 220]);
      } },
      toque: { parent: 'head', at: [-4, -82], pts: [[-34, 16], [-36, -4], [-26, -14], [-70, -16, 1], [-12, -28, 1], [70, -20, 1], [18, -8, 1], [32, -4], [34, 14]], base: ET.noir, seed: 8110, noRivet: true, paint: () => {
        fillPts([[-70, -16], [-12, -28], [70, -20], [18, -8]], '#24232b');
        fillPts([[-70, -16], [18, -8], [18, -3], [-68, -11]], '#0c0b0f');
        strokePts([[-68, -16], [-12, -27], [68, -20]], 'rgba(200,200,220,0.25)', 1.2);
        dot(0, -18, 3.4, ET.or);
        hatch([[-36, -10], [34, -10], [34, 16], [-36, 16]], 0.6, 3.4, 0.3, 1, '200,200,220');
      } },
      gland: { parent: 'toque', at: [-58, -15], pts: [[-2, -2], [2, -2], [3, 30], [7, 34], [8, 54, 1], [-8, 54, 1], [-7, 34], [-3, 30]], base: ET.or, seed: 8111, noRivet: true, rest: 0.05, paint: () => {
        for (let x = -6; x <= 6; x += 3) strokePts([[x, 36], [x, 54]], ET.orD, 1);
        dot(0, 32, 4, '#d9b85a');
      }, extra: () => { if (M._sil()) return; strokePts([[58, -3], [20, -5], [-2, -2]], ET.or, 1.6); } },
      armF_up: armUp([-2, -146], ET.toge, 8112, () => hatch([[-18, -20], [-3, -20], [-3, 100], [-18, 100]], 0.9, 3.6, 0.3, 1.05, '200,200,220'), 18),
      armF_lo: armLo('armF_up', ET.toge, SKIN, 8113, false, ET.blanc),
      mancheF: { parent: 'armF_lo', at: [0, 0], pts: [[-13, 26], [13, 26], [26, 70], [22, 80, 1], [-24, 82, 1], [-20, 66]], base: ET.toge, seed: 8114, noRivet: true, paint: () => { strokePts([[-22, 78], [22, 76]], 'rgba(200,200,220,0.4)', 1.2); hatch(null, 0.9, 3.4, 0.25, 1.05, '200,200,220'); } },
      livre: { parent: 'armF_lo', at: [4, 96], pts: OFFP, base: '#000', seed: 8115, noRivet: true, extra: (p) => { if (!p.livre || p.livre === 'avant') drawLivre(); } },
      doigts: { parent: 'armF_lo', at: [4, 96], pts: (p) => ((!p.livre || p.livre === 'avant') ? DOIGTS : OFFP), base: SKIN, seed: 8116, noRivet: true, paint: doigtsPaint },
    };
    return { hipY: -238, handLen: 104, parts, rod: { part: 'torso', at: [-26, 18] }, nom: 'etudiant',
      order: ['armB_up', 'armB_lo', 'mancheB', 'livreB', 'doigtsB', 'legB', 'legF', 'head', 'torso', 'toque', 'gland', 'armF_up', 'armF_lo', 'mancheF', 'livre', 'doigts'] };
  }
  CH.tanEtudiant = mkEtudiant();
  const ET_CIBLE = { lever: [56, -300], salut: [34, -112], montrer: [184, -150] };
  TAN.ET_CIBLE = ET_CIBLE;
  TAN.etudiantPose = function (pose, x, y, s, dir) {
    const q = prep(pose), A = q.ang, t = q.t || 0, def = CH.tanEtudiant;
    if (q.livre == null) q.livre = 'avant';
    if (q.livre === 'avant' && !(q.handF && q.handF !== 'fist')) q.handF = 'fist';
    if (q.livre === 'arriere') q.handB = 'fist';
    q.dy = (q.dy || 0) + 1.2 * Math.sin(t * 1.9);
    A.gland = (A.gland || 0) + 0.12 * Math.sin(t * 2.4) - 0.6 * (q.tilt || 0);
    const fi = clamp(q.fier || 0), sa = clamp(q.salut || 0), le = clamp(q.lever || 0), mo = clamp(q.montrer || 0);
    if (fi > 0) { q.tilt = (q.tilt || 0) - 0.05 * fi; A.head = (A.head || 0) - 0.16 * fi; }
    if (sa > 0) { plier(q, 0.16 * sa); A.head = (A.head || 0) + 0.34 * sa; }
    if (mo > 0) { armToLocal(def, q, x, y, s, dir, 'armF', ET_CIBLE.montrer, mo, 1); if (mo > 0.5 && q.livre !== 'avant') q.handF = 'open'; }
    if (le > 0) armToLocal(def, q, x, y, s, dir, 'armF', ET_CIBLE.lever, le, 1);
    if (sa > 0) armToLocal(def, q, x, y, s, dir, 'armF', ET_CIBLE.salut, sa, 1);
    A.gland -= 0.4 * sa;
    // le livre reste droit à l'écran
    const tl = q.tilt || 0;
    if (q.droit !== false) { A.livre = (A.livre || 0) - ((A.armF_up || 0) + (A.armF_lo || 0) + tl); A.livreB = (A.livreB || 0) - ((A.armB_up || 0) + (A.armB_lo || 0) + tl); }
    return q;
  };
  TAN.etudiant = function (pose, x, y, s, o) {
    o = o || {}; s = s == null ? 0.9 : s; const dir = o.dir || 1;
    const q = TAN.etudiantPose(pose, x, y, s, dir);
    const r = M.puppet(CH.tanEtudiant, q, x, y, s, Object.assign({ slot: M.ST.slotF }, o, { dir }));
    r.main = r.w('armF_lo', 4, 96); r.mainB = r.w('armB_lo', 4, 96); r.livre = q.livre === 'arriere' ? r.w('livreB', 17, -19) : r.w('livre', 17, -19);
    return r;
  };

  // =====================================================================
  // BADAUDS — trois spectateurs du XIXe (o.qui 'a' | 'b' | 'c'), debout, visage complet ; gestes par M.ik
  //   a : homme, bonnet de laine vert, gilet rayé ocre sur chemise blanche, pantalon brun
  //   b : femme, coiffe blanche haute à ailes, fichu ocre, corsage brun, jupe rouge brique, tablier écru
  //   c : vieil homme, chapeau mou de feutre brun-noir à bord tombant, barbe blanche, foulard rouge, blouse bleue de travail, sabots
  // =====================================================================
  const BA = {
    a: { peau: '#e0b994', peauD: '#c49a76', chev: '#2c2220', haut: '#ece4d2', hautD: '#cfc6b2', jambe: '#5b4d3c', jambeD: '#463b2e', soulier: '#2a1c14', seed: 9100 },
    b: { peau: '#ecc8a8', peauD: '#cfa888', chev: '#7a4e2e', haut: '#4a3328', hautD: '#3a271f', jupe: '#8f3b2c', jupeD: '#71291e', soulier: '#1c1612', seed: 9200 },
    c: { peau: '#d9b08c', peauD: '#bb9270', chev: '#e8e4dc', haut: '#3d6a9a', hautD: '#2f5379', jambe: '#6b6a66', jambeD: '#555450', soulier: '#7a5634', seed: 9300 },
  };
  const BA_TORSO = {
    a: [[-14, -178], [8, -182], [18, -170], [30, -152], [38, -116], [40, -60], [38, -10], [34, 20], [-8, 26], [-40, 22, 1], [-42, -20], [-42, -70], [-42, -116], [-36, -152], [-26, -170]],
    b: [[-12, -178], [8, -182], [16, -168], [28, -150], [36, -126], [32, -96], [24, -66], [26, -36], [40, 40], [54, 140], [62, 226, 1], [-50, 228, 1], [-46, 140], [-38, 40], [-30, -36], [-30, -80], [-32, -120], [-30, -150], [-22, -170]],
    c: [[-14, -178], [8, -182], [18, -170], [32, -150], [42, -112], [48, -50], [54, 20], [60, 90], [62, 120, 1], [-56, 124, 1], [-52, 60], [-48, 0], [-46, -70], [-44, -118], [-38, -152], [-26, -170]],
  };
  function visage(f, V) {                                     // visage complet : sourcils, yeux (dont 'plisse'), bouche (dont 'rire')
    const ey = f.eyes || 'open', mo = f.mouth || 'n';
    if (ey === 'plisse') {
      strokePts([[10, -50], [16, -55.5], [23, -51.5]], 'rgba(28,16,14,0.95)', 2.2);
      strokePts([[8, -47], [4, -44]], 'rgba(90,50,40,0.6)', 1.1); strokePts([[8, -51], [3, -51]], 'rgba(90,50,40,0.6)', 1.1);
      strokePts([[12, -45], [20, -46]], 'rgba(90,50,40,0.45)', 1);
    } else X.eye(f, 17, -52);
    X.brow(f, 17, -61, V.chev === '#e8e4dc' ? '#b8b2a6' : '#3a2618', 2.8);
    if (mo === 'rire') {
      fillPts([[32, -32], [20, -32], [13, -27], [16, -16], [24, -12], [32, -16]], '#3a1714', 0, 0);
      fillPts([[31, -31], [20, -31], [17, -28], [31, -27.5]], '#f2ece0', 0, 0);
      fillPts([[28, -15], [20, -15], [22, -19], [28, -19]], '#b2524a', 0, 0);
      strokePts([[12, -31], [8, -34]], 'rgba(110,40,38,0.7)', 1.4);
    } else X.mouth(f, 27, -27);
  }
  function mkBadaud(k) {
    const V = BA[k], parts = {};
    const skin = V.peau, has = (v) => v && v !== 'rien';
    parts.torso = { parent: null, at: [0, 0], pts: BA_TORSO[k], base: V.haut, seed: V.seed, paint: () => {
      if (k === 'a') {
        fillPts([[-42, -160], [-4, -170], [22, -150], [34, -112], [36, -40], [34, 16], [-40, 20], [-42, -100]], '#b98c3e');                      // gilet
        for (let x = -40; x < 40; x += 8) strokePts([[x, -170], [x + 2, 22]], '#7a5524', 2.6);                                                   // rayures
        fillPts([[8, -176], [22, -168], [24, -146], [14, -144]], V.haut);                                                                        // col de chemise
        for (const y of [-120, -90, -60, -30]) dot(30, y, 2.4, '#4a3420');
        fillPts([[-42, 6], [38, 4], [38, 16], [-42, 18]], '#3a2a1c'); dot(30, 10, 3, LAITON);                                                     // ceinture
      } else if (k === 'b') {
        fillPts([[-34, -40], [24, -40], [44, 60], [56, 160], [62, 226], [-50, 228], [-44, 120], [-38, 20]], V.jupe);                             // jupe
        for (const x of [-30, -6, 20, 40]) strokePts([[x * 0.7, -30], [x, 120], [x * 1.1, 224]], 'rgba(40,10,8,0.35)', 1.4);
        fillPts([[18, -36], [30, -36], [48, 60], [60, 160], [64, 212], [6, 214], [10, 120], [12, 20]], '#e9e0c9');                             // tablier
        strokePts([[12, -38], [30, -38]], '#e9e0c9', 4);
        fillPts([[-34, -160], [-6, -172], [16, -164], [32, -140], [34, -118], [10, -96], [-20, -100], [-34, -120]], '#c99a5a');                // fichu
        strokePts([[30, -140], [16, -104], [-20, -100]], '#8e6630', 1.4); for (let i = 0; i < 6; i++) strokePts([[-28 + i * 9, -150], [-24 + i * 8, -104]], 'rgba(255,240,210,0.4)', 1);
        fillPts([[-12, -186], [10, -188], [18, -172], [-12, -170]], '#e9e0c9');                                                                   // col
      } else {
        fillPts([[-40, -160], [-4, -172], [22, -164], [36, -142], [40, -120], [-42, -118]], V.hautD);                                            // empiècement
        for (let x = -34; x < 36; x += 7) dot(x, -122, 1.6, '#e8eef4');                                                                          // broderie
        for (let x = -40; x < 56; x += 10) strokePts([[x * 0.9, -116], [x * 1.05, 118]], 'rgba(20,30,50,0.35)', 1.3);                           // fronces
        fillPts([[-12, -186], [12, -188], [24, -170], [26, -150], [14, -146], [-14, -160]], '#9a2e26');                                         // foulard rouge
        fillPts([[18, -152], [30, -150], [28, -128], [20, -132]], '#9a2e26');
      }
      hatch([[-60, -175], [-14, -175], [-14, 230], [-60, 230]], 0.75, 4.2, 0.3);
      shade(40, 0, -50, 0, 0.28, [-70, -200, 70, 240]);
    } };
    const shoe = (c) => () => { fillPts([[-40, 214], [60, 214], [60, 260], [-40, 260]], c); strokePts([[-14, 222], [40, 224]], 'rgba(255,255,255,0.18)', 1.2); };
    if (k === 'b') {
      parts.souliers = { parent: 'torso', at: [0, 0], pts: [[-26, 226], [30, 224], [50, 232], [52, 238, 1], [-26, 238, 1]], base: V.soulier, seed: V.seed + 1, noRivet: true };
    } else {
      parts.legB = { parent: 'torso', at: [-6, -2], pts: X.legPts(0.95), base: V.jambeD, seed: V.seed + 2, noRivet: true, paint: shoe(V.soulier) };
      parts.legF = { parent: 'torso', at: [6, -2], pts: X.legPts(0.95), base: V.jambe, seed: V.seed + 3, paint: () => { shoe(V.soulier)(); hatch([[-26, -20], [-6, -20], [-6, 214], [-26, 214]], 0.8, 4, 0.25); } };
    }
    const slv = k === 'a' ? V.haut : V.haut, slvD = k === 'a' ? V.hautD : V.hautD;
    parts.armB_up = armUp([-10, -146], slvD, V.seed + 4, null, k === 'c' ? 18 : 16);
    parts.armB_lo = armLo('armB_up', slvD, V.peauD, V.seed + 5, true, k === 'a' ? V.peauD : (k === 'b' ? '#e9e0c9' : slvD));
    if (k === 'a') parts.armB_lo.paint = (p) => { fillPts([[-24, 30], [24, 30], [26, 140], [-24, 140]], V.peauD); X.handPaint(null, p.handB || 'fist'); fillPts([[-13, 22], [13, 22], [14, 34], [-13, 34]], V.hautD); };
    parts.head = { parent: 'torso', at: [6, -170], pts: X.NAP_HEAD, base: skin, seed: V.seed + 6, noRivet: true, paint: (p) => {
      const f = p.face || {};
      if (k === 'a') { fillPts([[-34, -76], [-8, -82], [-6, -60], [-22, -36], [-36, -46]], V.chev); for (const [x, y] of [[-30, -70], [-24, -58], [-30, -48]]) dot(x, y, 4, '#3e3230'); fillPts([[-6, -24], [10, -6], [22, -8], [30, -18], [30, -10], [16, 4], [-6, 2]], 'rgba(60,50,46,0.25)'); }
      else if (k === 'b') { fillPts([[-34, -80], [-2, -88], [8, -76], [-6, -62], [-20, -40], [-36, -48]], V.chev); }
      else { fillPts([[-34, -72], [-10, -76], [-8, -50], [-26, -34], [-36, -46]], V.chev); }
      X.earPaint(-8, -44);
      const ri = f.mouth === 'rire' || f.eyes === 'plisse';
      dot(15, -30, ri ? 11 : 8, `rgba(210,115,95,${ri ? 0.42 : 0.28})`);
      if (k === 'a') dot(34, -38, 4.5, 'rgba(200,90,70,0.5)');                                                                                   // nez rouge
      visage(f, V);
      if (k === 'c') {                                                                                                                       // barbe blanche courte
        const ouv = f.mouth === 'rire' ? 5 : 0;
        fillPts([[-8, -40], [6, -32], [14, -22], [26, -14 + ouv], [30, -2 + ouv], [22, 12 + ouv], [4, 14], [-10, 2], [-14, -20]], '#ece8e0');
        fillPts([[14, -34], [24, -36], [32, -32], [26, -29], [16, -30]], '#ece8e0');
        hatch([[-14, -40], [32, -40], [32, 16], [-14, 16]], 1.2, 3, 0.18);
      }
    } };
    if (k === 'a') parts.coiffe = { parent: 'head', at: [-4, -82], pts: [[-36, 22], [-38, 0], [-30, -18], [-8, -26], [16, -22], [32, -6], [34, 14], [20, 18], [-4, 16], [-24, 18]], base: '#4e6b3c', seed: V.seed + 7, noRivet: true, extra: () => {
      pc([[-30, -16], [-50, -10], [-70, 6], [-76, 22], [-66, 20], [-48, 6], [-26, -4]], '#4e6b3c', () => hatch(null, 0.3, 3, 0.25), V.seed + 8);   // pointe qui retombe
      pc(ell(-74, 26, 9, 9, 12), '#d9cfb4', null, V.seed + 9);                                                                                 // pompon
    }, paint: () => { fillPts([[-38, 6], [34, 2], [34, 18], [-36, 24]], '#3c5530'); for (let x = -34; x < 34; x += 5) strokePts([[x, 6], [x, 20]], 'rgba(20,30,15,0.4)', 1); hatch(null, 0.3, 3, 0.25); } };
    if (k === 'b') parts.coiffe = { parent: 'head', at: [-4, -80], pts: [[-38, 26], [-40, 4], [-36, -20], [-32, -52], [-20, -64], [6, -62], [18, -50], [22, -22], [30, -6], [38, 8], [32, 16], [10, 12], [-16, 18], [-30, 30]], base: '#f3eee4', seed: V.seed + 7, noRivet: true, paint: () => {
      for (let y = -56; y < 0; y += 8) strokePts([[-30, y], [16, y + 2]], 'rgba(150,140,120,0.35)', 1);                                   // coiffe haute empesée
      for (let i = 0; i < 7; i++) dot(-24 + i * 7, -36 + (i % 2) * 6, 1.6, 'rgba(150,140,120,0.5)');                                         // dentelle
      for (let i = 0; i < 8; i++) { const a = -0.5 + i * 0.14; strokePts([[30 + Math.cos(a) * 4, 6 + Math.sin(a) * 4], [40 + Math.cos(a) * 8, 10 + Math.sin(a) * 8]], 'rgba(150,140,120,0.55)', 1); }   // ruché du front
      hatch(null, 0.5, 4, 0.1);
    }, extra: () => {
      pc([[-34, 4], [-60, -22], [-82, -18], [-76, 2], [-52, 22], [-36, 22]], '#f3eee4', () => { for (let i = 0; i < 5; i++) dot(-70 + i * 8, -8 + i * 4, 1.5, 'rgba(150,140,120,0.55)'); }, V.seed + 8);   // ailes de la coiffe
      if (!M._sil()) strokePts([[-2, 40], [8, 60], [22, 74]], '#e9e0c9', 3);                                                                  // bride sous le menton
    } };
    if (k === 'c') parts.coiffe = { parent: 'head', at: [-4, -80], pts: [[-74, 34], [-58, 16], [-36, 8], [-36, -10], [-28, -24], [-12, -30], [-2, -22], [10, -30], [26, -22], [34, -8], [36, 8], [58, 14], [76, 30], [70, 34, 1], [40, 22], [-36, 22], [-68, 38, 1]], base: '#3a332e', seed: V.seed + 7, noRivet: true, paint: () => {
      fillPts([[-34, -2], [34, 0], [34, 8], [-34, 8]], '#241f1c');                                                                          // ruban
      strokePts([[-26, -22], [-12, -28]], 'rgba(220,210,190,0.3)', 1.6); strokePts([[-2, -22], [0, -8]], 'rgba(0,0,0,0.5)', 1.6);   // creux du feutre
      strokePts([[-70, 34], [-40, 20], [40, 20], [72, 32]], 'rgba(0,0,0,0.4)', 1.2);
      hatch(null, 0.5, 3.6, 0.25, 1, '200,200,200');
    } };
    parts.armF_up = armUp([-2, -146], slv, V.seed + 10, null, k === 'c' ? 18 : 16);
    parts.armF_lo = armLo('armF_up', slv, skin, V.seed + 11, false, k === 'b' ? '#e9e0c9' : slvD);
    if (k === 'a') parts.armF_lo.paint = (p) => { fillPts([[-24, 30], [24, 30], [26, 140], [-24, 140]], skin); X.handPaint(null, p.handF || 'fist'); fillPts([[-13, 22], [13, 22], [14, 34], [-13, 34]], V.hautD); hatch([[-14, 34], [0, 34], [0, 76], [-14, 76]], 0.8, 3.6, 0.15); };
    const order = ['armB_up', 'armB_lo'].concat(k === 'b' ? ['souliers'] : ['legB', 'legF'], ['head', 'torso', 'coiffe', 'armF_up', 'armF_lo']);
    return { hipY: -238, handLen: 104, parts, rod: { part: 'torso', at: [-26, 18] }, nom: 'badaud ' + k, order };
  }
  CH.tanBadaudA = mkBadaud('a'); CH.tanBadaudB = mkBadaud('b'); CH.tanBadaudC = mkBadaud('c');
  const BAD_DEF = { a: CH.tanBadaudA, b: CH.tanBadaudB, c: CH.tanBadaudC };
  const BAD_CIBLE = { ventre: [34, -60], ventreB: [28, -52], hanche: [26, -12], dos: [-50, -30], mains: [76, -102] };
  TAN.BAD_CIBLE = BAD_CIBLE;
  // bras vers une cible écran ; bend 'auto' (défaut) = le coude le plus bas des deux solutions (1 devant l'épaule, −1 derrière)
  function armAuto(def, q, x, y, s, dir, arm, T, k, bend) {
    if (!(k > 0)) return;
    let b = bend;
    if (b !== 1 && b !== -1) {
      const s1 = M.ik(def, q, x, y, s, dir, arm, T, 1), s2 = M.ik(def, q, x, y, s, dir, arm, T, -1), tl = q.tilt || 0;
      b = Math.cos(normUp(s1.up) + tl) >= Math.cos(normUp(s2.up) + tl) ? 1 : -1;
    }
    (q._bend = q._bend || {})[arm] = b;
    armToScreen(def, q, x, y, s, dir, arm, T, k, b);
  }
  const torsoPt = (def, q, x, y, s, dir, lt) => M.wpt(M.partMatrices(def, q, x, y, s, dir).mats.torso, lt[0], lt[1]);
  TAN.badaudPose = function (pose, x, y, s, dir, o) {
    o = o || {}; const def = BAD_DEF[o.qui] || CH.tanBadaudA;
    const q = prep(pose), A = q.ang, t = q.t || 0;
    const fi = clamp(q.fige || 0), ri = clamp(q.rire || 0) * (1 - fi), ap = clamp(q.applaudit || 0) * (1 - fi), fr = clamp(q.fier || 0), mo = clamp(q.montre || 0);
    const vie = 1 - fi;
    q.dy = (q.dy || 0) + 1.2 * Math.sin(t * 1.9) * vie;
    const fd = {};                                                     // visage par défaut selon le geste (pose.face l'emporte)
    if (fr > 0.4) Object.assign(fd, { mouth: 'smile', eyes: 'half', brow: 'up' });
    if (ap > 0.4) Object.assign(fd, { mouth: 'smile', eyes: 'open', brow: 'up' });
    if (ri > 0.3) Object.assign(fd, { mouth: 'rire', eyes: 'plisse', brow: 'up' });
    if (fi > 0.4) Object.assign(fd, { mouth: 'tight', eyes: 'half', brow: 'n' });
    q.face = Object.assign(fd, pose.face || {});
    if (ri > 0) {                                                       // rire : secousses d'épaules, tête renversée, main sur le ventre
      const sh = Math.abs(Math.sin(t * 13));
      q.dy -= 4 * ri * sh; q.tilt = (q.tilt || 0) - 0.07 * ri; A.head = (A.head || 0) - 0.3 * ri - 0.06 * ri * sh;
      armAuto(def, q, x, y, s, dir, 'armF', torsoPt(def, q, x, y, s, dir, [BAD_CIBLE.ventre[0], BAD_CIBLE.ventre[1] + 4 * sh]), ri);
      armAuto(def, q, x, y, s, dir, 'armB', torsoPt(def, q, x, y, s, dir, BAD_CIBLE.ventreB), ri * 0.8);
    }
    if (fr > 0) {                                                       // fier : menton levé, poing sur la hanche, main dans le dos
      A.head = (A.head || 0) - 0.18 * fr; q.tilt = (q.tilt || 0) - 0.04 * fr;
      armAuto(def, q, x, y, s, dir, 'armF', torsoPt(def, q, x, y, s, dir, BAD_CIBLE.hanche), fr);
      armAuto(def, q, x, y, s, dir, 'armB', torsoPt(def, q, x, y, s, dir, BAD_CIBLE.dos), fr);
    }
    if (ap > 0) {                                                       // applaudit : les deux mains se frappent devant le buste
      const c = Math.abs(Math.sin(t * PI * 3));
      armAuto(def, q, x, y, s, dir, 'armF', torsoPt(def, q, x, y, s, dir, [BAD_CIBLE.mains[0] + 12 * c, BAD_CIBLE.mains[1]]), ap);
      armAuto(def, q, x, y, s, dir, 'armB', torsoPt(def, q, x, y, s, dir, [BAD_CIBLE.mains[0] - 12 * c, BAD_CIBLE.mains[1] + 4]), ap);
      if (ap > 0.5) { q.handF = q.handF || 'open'; q.handB = q.handB || 'open'; }
    }
    const cible = o.cible || q.cible;
    if (mo > 0 && cible) { armAuto(def, q, x, y, s, dir, 'armF', cible, mo); if (mo > 0.5) q.handF = q.handF || 'open'; }
    if (q.mainF) { armAuto(def, q, x, y, s, dir, 'armF', q.mainF, q.mainK == null ? 1 : q.mainK, q.bendF); q.handF = q.handF || 'fist'; }
    if (q.mainB) { armAuto(def, q, x, y, s, dir, 'armB', q.mainB, q.mainK == null ? 1 : q.mainK, q.bendB); q.handB = q.handB || 'fist'; }
    return q;
  };
  // o.pass : 'tout' (défaut) | 'fond' (bras arrière seul) | 'devant' (tout sauf le bras arrière) — pour glisser un objet porté entre les deux
  TAN.badaud = function (pose, x, y, s, o) {
    o = o || {}; s = s == null ? 0.88 : s; const dir = o.dir || 1, def = BAD_DEF[o.qui] || CH.tanBadaudA;
    const q = TAN.badaudPose(pose, x, y, s, dir, o), pass = o.pass || 'tout';
    if (pass === 'fond') q.hide = Object.assign(hideBut(def, ['armB_up', 'armB_lo']), q.hide);
    if (pass === 'devant') q.hide = Object.assign({ armB_up: 1, armB_lo: 1 }, q.hide);
    const oo = Object.assign({ slot: M.ST.slotF }, o, { dir });
    if (pass === 'fond') { oo.rod = false; oo.floorShadow = false; }
    const r = M.puppet(def, q, x, y, s, oo);
    r.mainF = r.w('armF_lo', 4, 96); r.mainB = r.w('armB_lo', 4, 96); r.bend = Object.assign({}, q._bend); r.tete = r.w('head', 10, -50);
    return r;
  };

  // =====================================================================
  // DÉCOR — chemin de campagne anglaise (toile plein cadre 1080 × ST.back+5)
  // =====================================================================
  const ROUTE = { haie: 1250, chemin: 1328 };
  ROUTE.collineY = (x) => 1060 + 26 * Math.sin(x * 0.0062 + 1.2) + 14 * Math.sin(x * 0.017 + 0.4);
  ROUTE.lointY = (x) => 960 + 34 * Math.sin(x * 0.0048 + 2.6) + 12 * Math.sin(x * 0.013);
  TAN.ROUTE = ROUTE;
  function makeRoute() {
    const W = M.W, H = M.ST.back + 5;
    return M.pre(W, H, (x) => {
      const g = x.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#b4c4c8'); g.addColorStop(0.42, '#d3dbd6'); g.addColorStop(0.66, '#e9e4d2'); g.addColorStop(1, '#efe6cd');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      const R = M.rng(1817);
      for (let i = 0; i < 8; i++) {                                                                    // nuages de papier
        const cx = 60 + R() * 960, cy = 260 + R() * 560, w = 200 + R() * 260, h = 30 + R() * 34, pts = [];
        for (let k = 0; k <= 14; k++) { const a = PI + k * PI / 14; pts.push([cx + Math.cos(a) * w / 2, cy + Math.sin(a) * h * (0.7 + 0.5 * M.hash(i * 17 + k))]); }
        pts.push([cx + w * 0.42, cy + 7], [cx - w * 0.42, cy + 7]);
        pc(pts, M.mixc('#e9ece6', '#f4efe2', clamp((cy - 260) / 560)), () => hatch(null, 0.2, 6, 0.06), 1817 + i, { texA: 0.45 });
      }
      const hill = (fy, col, seed, paint) => { const pts = [[-20, H + 10, 1]]; for (let xx = -20; xx <= W + 20; xx += 30) pts.push([xx, fy(xx)]); pts.push([W + 20, H + 10, 1]); pc(pts, col, paint, seed, { texA: 0.5 }); };
      // collines lointaines, champs en damier
      hill(ROUTE.lointY, '#b3bea6', 1820, () => {
        for (let k = 0; k < 9; k++) { const x0 = k * 130 - 30; strokePts([[x0, ROUTE.lointY(x0) + 4], [x0 + 60, 1100]], 'rgba(90,110,80,0.25)', 1.4); }
        for (const y of [1000, 1030]) strokePts([[0, y], [W, y + 8]], 'rgba(90,110,80,0.2)', 1.4);
        hatch(null, 0.2, 6, 0.08, 1, M.P.encre, [0, 900, W, 1100]);
      });
      // colline intermédiaire avec haies de champs et arbres ronds
      hill(ROUTE.collineY, '#97a582', 1821, () => {
        for (let k = 0; k < 7; k++) { const x0 = 40 + k * 160; strokePts([[x0, ROUTE.collineY(x0) + 6], [x0 - 40, 1240]], 'rgba(60,80,50,0.35)', 2.2); }
        strokePts([[0, 1120], [300, 1112], [700, 1126], [W, 1116]], 'rgba(60,80,50,0.3)', 2.2);
        hatch(null, 0.3, 5, 0.12, 1, M.P.encre, [0, 1000, W, 1300]);
      });
      for (const [tx, s] of [[150, 1], [236, 0.8], [820, 1.1], [905, 0.85], [660, 0.7]]) {
        const ty = ROUTE.collineY(tx) + 6;
        pc(rect(tx - 4 * s, ty - 40 * s, tx + 4 * s, ty + 4), '#5b4a36', null, 1830 + tx);
        pc(ell(tx, ty - 60 * s, 34 * s, 30 * s, 16), '#6b7d58', () => { hatch(null, 0.8, 4, 0.22); dot(tx - 10 * s, ty - 72 * s, 10 * s, 'rgba(200,215,170,0.25)'); }, 1840 + tx, { texA: 0.5 });
      }
      // petite route lointaine en ruban sur la colline intermédiaire
      { const top = [], bot = []; for (let xx = -20; xx <= W + 20; xx += 30) { const yy = ROUTE.collineY(xx) + 44 + 10 * Math.sin(xx * 0.011); top.push([xx, yy - 5 - xx * 0.004]); bot.unshift([xx, yy + 5 + xx * 0.004]); }
        pc(top.concat(bot), '#d2b884', () => strokePts(top, 'rgba(255,245,220,0.5)', 1.2), 1823, { texA: 0.4 }); }
      // colline proche
      hill((xx) => 1178 + 18 * Math.sin(xx * 0.008 + 0.3), '#83946a', 1822, () => hatch(null, 0.5, 4.6, 0.15, 1, M.P.encre, [0, 1150, W, H]));
      // haie : deux massifs bosselés, trouée au passage du chemin
      const haie = (x0, x1, seed) => {
        const pts = [[x0, 1340, 1]]; const n = Math.round((x1 - x0) / 26);
        for (let i = 0; i <= n; i++) { const xx = x0 + (x1 - x0) * i / n; pts.push([xx, ROUTE.haie - 6 - 22 * M.hash(seed + i) + (i === 0 || i === n ? 40 : 0)]); }
        pts.push([x1, 1340, 1]);
        pc(pts, '#4d5f3d', () => {
          const Rh = M.rng(seed);
          for (let i = 0; i < (x1 - x0) / 7; i++) dot(x0 + Rh() * (x1 - x0), ROUTE.haie + Rh() * 80, 4 + Rh() * 6, 'rgba(110,135,85,0.35)');
          for (let i = 0; i < (x1 - x0) / 22; i++) dot(x0 + Rh() * (x1 - x0), ROUTE.haie + 4 + Rh() * 60, 2.2, 'rgba(240,236,220,0.75)');    // aubépine
          hatch(null, 1.0, 3.6, 0.28);
        }, seed, { texA: 0.55 });
      };
      haie(-20, 560, 1850); haie(520, W + 20, 1851);
      // chemin du devant
      pc([[-20, ROUTE.chemin, 1], [W + 20, ROUTE.chemin - 4, 1], [W + 20, H + 10, 1], [-20, H + 10, 1]], '#c4a46a', () => {
        fillPts([[-20, ROUTE.chemin], [W + 20, ROUTE.chemin - 4], [W + 20, ROUTE.chemin + 10], [-20, ROUTE.chemin + 14]], '#7f9068');
        const Rg = M.rng(1860); for (let i = 0; i < 90; i++) { const gx = Rg() * W; strokePts([[gx, ROUTE.chemin + 12], [gx + 3 - Rg() * 6, ROUTE.chemin + 2 - Rg() * 8]], 'rgba(80,100,60,0.7)', 1.4); }
        for (const y of [1352, 1372]) strokePts([[0, y], [W, y - 2]], 'rgba(120,90,50,0.35)', 2);
        hatch(null, 0.15, 5, 0.12, 1, M.P.encre, [0, 1320, W, H]);
      }, 1824);
      if (M.tex && M.tex.paperPat) { x.save(); x.globalCompositeOperation = 'multiply'; x.globalAlpha = 0.35; x.fillStyle = M.tex.paperPat; x.fillRect(0, 0, W, H); x.restore(); }
      const vg = x.createLinearGradient(0, H - 120, 0, H); vg.addColorStop(0, 'rgba(30,20,10,0)'); vg.addColorStop(1, 'rgba(30,20,10,0.25)'); x.fillStyle = vg; x.fillRect(0, H - 120, W, 120);
    });
  }

  TAN.init = function () {
    if (TAN.K) return TAN.K;
    TAN.K = { route: makeRoute() };
    return TAN.K;
  };
})();
