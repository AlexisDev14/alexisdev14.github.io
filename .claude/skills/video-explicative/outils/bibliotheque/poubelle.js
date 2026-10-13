// bibliotheque/poubelle.js — personnages VALIDÉS de « Monsieur Poubelle » (2026), réutilisables dans toute vidéo (chargés dans chaque plan). Espace de noms M.pou (POU). Tout dans une IIFE.
// pupitre / arrêté / rouleau, journal à caricature, tas d'ordures, décors rue de Paris 1880 et café. Espace de noms M.pou (POU). Tout dans une IIFE.
// Aucun texte, lettre, chiffre ou logo (arrêté, facture, journal = lignes grises ondulées). Déterministe (M.rng) : S.draw reste une fonction pure de t.
//
// MARIONNETTES (avec tige ; (x,y) = pieds ; toujours passer slot: ST.slotF / ST.slotB) — échelle conseillée 0,9–0,95 (≈ 470–500 px avec chapeau)
//   prefet      : POU.prefet(pose,x,y,s,o)  (= M.puppet(C.prefet, POU.prefetPose(pose), …) : OBLIGATOIRE pour salut/soupir)
//                 pièces epee armB_up armB_lo legB legF head bicorne torso bicorneMain armF_up armF_lo objet doigts (barbe et moustache peintes sur head)
//                 pose.tenu 'rien'|'plume'|'rouleau' (main avant ; ang.objet oriente l'objet ; bout de la plume = r.w('objet', 0, 40))
//                 pose.salut 0..1 (0→0,4 : la main avant monte prendre le bicorne ; 0,4→1 : elle le soulève et l'incline) ; pose.soupir 0..1 (épaules qui tombent,
//                 tête qui penche) ; pose.t (plumes du bicorne qui frémissent) ; face{brow,mouth,eyes} ; handF/handB ; ang.bicorne
//   proprio     : M.puppet(C.proprio, pose,…) ; pièces armB_up armB_lo legB legF head chapeau fumee torso armF_up armF_lo
//                 pose.rouge 0..1 (visage rouge brique) ; pose.fumee 0..1 (jets de vapeur en carton de l'oreille, animés par pose.t) ; pose.leve 0..1 (haut-de-forme
//                 qui se soulève de stupeur) ; face ; handF/handB
//   chiffonnier : M.puppet(C.chiffonnier, pose,…) ; pièces armB_up armB_lo legB legF hotte head casquette torso armF_up armF_lo outil doigtsF doigtsB
//                 pose.tenu 'crochet'|'pelle'|'rien' ; ang.outil ; ang.hotte (ballotte) ; pose.charge 0..1 (débris sur la pelle) ; pose.deuxMains (doigts de la main
//                 arrière sur le manche : amener armB par M.ik sur POU.manche(r, u)) ; POU.manche(r,u) = point écran du manche (u 0 = bout, 1 = lame)
// ACCESSOIRES (sans tige, ils volent ; (x,y) = bas de l'objet ; o.dir ±1, o.cast, o.alpha)
//   POU.rat(t,x,y,s,o)        o.trot 0..1 (trottine / renifle), o.tient 'croute'|'arete'|'rien', o.ph (déphasage). ≈ 90 px à s=1 (queue comprise 150).
//   POU.boite(x,y,s,o)        boîte Poubelle 1883, 140 × 120 px à s=1, face vers +x, charnière (rivet laiton) à l'arrière. o.ouvre 0..1 ; o.contenu 'putrescible'|
//                             'papiers'|'verre'|'tout'|'vide' ; o.salut 0..1 (le couvercle se soulève puis s'incline comme un chapeau) ; o.bicorne (petit bicorne à
//                             plumes sur le couvercle) ; o.bande 'vert'|'ocre'|'bleu'|'#hex' (toute la boîte teintée, couvercle plus foncé ; sans bande = bois naturel) ; o.huitre 0..1 (coquille qui bâille) ; o.mouche ; o.t ; o.angle (rad)
//   POU.bac(x,y,s,o)          bac à roulettes moderne ≈ 250 px à s=1 ; o.couleur 'jaune'|'vert' ; o.ouvre 0..1
//   POU.yaourt(x,y,s,o)       pot blanc à opercule alu ; o.rot
//   POU.mainModerne(x,y,s,o)  main + manche de sweat qui descend des cintres sur un fil ; (x,y) = fond du pot tenu ; o.pot (true) ; o.rot (balancement autour du fil) ;
//                             o.fil (true)
//   POU.pupitre(x,y,s,o)      pupitre acajou sur roulettes ≈ 310 px ; o.arrete (true), o.signe 0..1 (paraphe en 3 boucles), o.cachet 0..1, o.plume (true = plume dans
//                             l'encrier) ; POU.paraphePt(x,y,s,signe,dir) = point écran où la plume trace ; POU.PUPITRE (géométrie)
//   POU.arrete(x,y,s,o)       arrêté seul (feuille de face 150 × 200) ; o.signe, o.cachet, o.rot
//   POU.rouleau(x,y,s,o)      « facture » ; (x,y) = bord haut tenu ; o.deroule 0..1, o.longueur (620), o.sol (y écran du plancher : le rouleau y roule), o.vers ±1, o.t
//   POU.journal(x,y,s,o)      journal 300 × 210 ; o.face 'caricature' (titre « LE PETIT RÂLEUR » : seule exception au « pas de texte », voulue par l'utilisateur ;
//                             caricature du préfet sortant d'une boîte) | 'dos' ; o.rot ; (x,y) = bas-centre
//   POU.tas(x,y,s,o)          tas d'ordures 220 × 110 ; o.taille 0..1 ; o.variante 0|1|2 ; o.t
//   POU.bicorne(x,y,s,rot,o)  bicorne de préfet à plumes seul (même dessin que sur la tête) ; (x,y) = milieu du bord inférieur ; o.t, o.dir
// DÉCORS : POU.init() dans S.init → POU.K = { rue, cafe, gueridon, chaise, morris } (pré-rendus, origine bas-centre, M.withShadow)
//   rue : M.flat(K.rue, 540, ST.back, {cast}) — façades 1880, 3 portes cochères en x écran POU.RUE.portes = [210, 540, 870] ; 5 boîtes : POU.RUE.cinq ;
//         corniches (pigeons) POU.RUE.corniches (y écran) ; pavés au pied. cafe : M.flat(K.cafe, 260, ST.back) (devanture, store rayé, enseigne sans lettres) ;
//         gueridon / chaise : poser sur le plancher (y ≈ FEET) ; morris : colonne Morris aux affiches en aplats (scale 0,7–0,9).
// AIDES : POU.item(nom,x,y,rot,k,seed,param) = objet de rebut dans le repère courant (trognon epluchure chou papier feuille chiffon bouteille assiette tesson arete
//   croute huitre[param = ouverture]) ; POU.bicorneDraw(t,k) ; POU.caricature(k) ; POU.geo (ep, ell, tr, scl, xf, ribbon, qbez, resample) ; POU.PF (palette du préfet).
(function () {
  'use strict';
  const X = M.X, P = M.P, TAU = M.TAU, PI = Math.PI, D = 180 / Math.PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, easeOut, rng } = M;
  const POU = (M.pou = {});
  const CH = M.chars;
  const cx_ = () => M.ctx();
  const OFFP = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];

  // ------------------------------------------------------------ géométrie
  function ep(cx, cy, rx, ry, n, a0, a1) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; }
  function ell(cx, cy, rx, ry, n) { const o = ep(cx, cy, rx, ry, n || 16, 0, TAU); o.pop(); return o; }
  const tr = (pts, dx, dy) => pts.map((p) => (p[2] ? [p[0] + dx, p[1] + dy, 1] : [p[0] + dx, p[1] + dy]));
  const scl = (pts, sx, sy) => { sy = sy == null ? sx : sy; return pts.map((p) => (p[2] ? [p[0] * sx, p[1] * sy, 1] : [p[0] * sx, p[1] * sy])); };
  const mp = (m, p) => [m.a * p[0] + m.c * p[1] + m.e, m.b * p[0] + m.d * p[1] + m.f];
  const xf = (pts, m) => pts.map((p) => { const q = mp(m, p); if (p[2]) q.push(1); return q; });
  const ctxM = (m) => cx_().transform(m.a, m.b, m.c, m.d, m.e, m.f);
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
  function resample(pts, n) {
    const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const tot = L[L.length - 1], out = []; let j = 1;
    for (let i = 0; i < n; i++) { const d = tot * i / (n - 1); while (j < L.length - 1 && L[j] < d) j++; const u = (d - L[j - 1]) / ((L[j] - L[j - 1]) || 1); out.push([lerp(pts[j - 1][0], pts[j][0], u), lerp(pts[j - 1][1], pts[j][1], u)]); }
    return out;
  }
  const normA = (a) => { while (a > PI) a -= TAU; while (a < -PI) a += TAU; return a; };
  POU.geo = { ep, ell, tr, scl, xf, ribbon, qbez, resample };
  // bras à articulations rondes : épaule (0,0) et coude (0,len) en demi-cercles centrés sur le pivot ; l'avant-bras commence par le même cercle
  const R_COUDE = 11.5;
  function armR(len, wt) { wt = wt || 15; return ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1, 40], [R_COUDE + 0.5, len - 6]], ep(0, len, R_COUDE, R_COUDE, 10, 0, PI), [[-R_COUDE - 0.5, len - 6], [-wt + 1, 40]]); }
  function foreR(kind) { const f = X.forePts(kind); return ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU).concat(f.slice(2)); }
  POU.armR = armR; POU.foreR = foreR;

  // lignes ondulées grises (texte simulé, jamais de lettres) dans le rectangle donné
  function lignes(x0, y0, x1, y1, sp, seed, col, lw) {
    const R = rng(seed || 5); col = col || 'rgba(90,86,80,0.62)';
    for (let y = y0; y <= y1; y += sp) {
      if (R() < 0.12) continue;                                                     // saut de paragraphe
      const xe = R() < 0.2 ? lerp(x0, x1, 0.35 + R() * 0.4) : x1 - R() * 4, pts = [], ph = R() * 6;
      for (let x = x0 + (R() < 0.15 ? 8 : 0); x <= xe; x += 3) pts.push([x, y + Math.sin(x * 0.55 + ph) * 0.9 + Math.sin(x * 0.17 + ph) * 0.5]);
      if (pts.length > 1) strokePts(pts, col, lw || 1.3);
    }
  }
  // sous-dessin d'un objet (pièce à l'échelle k sans grossir les liserés)
  function sub(pts, k, base, paint, seed, o) { piece(k === 1 ? pts : scl(pts, k), base, paint ? () => { const c = cx_(); c.save(); c.scale(k, k); paint(); c.restore(); } : null, Object.assign({ seed }, o || {})); }

  // =====================================================================
  // OBJETS DE REBUT (même dessin dans le tas, la boîte, la gueule des rats) : item(nom, x, y, rot, k, seed, param)
  // =====================================================================
  const ITEMS = {
    trognon: { base: '#e9dfbe', pts: [[-9, -20], [9, -20], [7, -13], [3, -6], [3, 4], [7, 12], [10, 20, 1], [-10, 20, 1], [-7, 12], [-3, 4], [-3, -6], [-7, -13]],
      paint: () => { fillPts([[-13, -23, 1], [13, -23, 1], [9, -14, 1], [-9, -14, 1]], '#a3302c'); fillPts([[-13, 14, 1], [13, 14, 1], [13, 23, 1], [-13, 23, 1]], '#a3302c'); dot(0, -3, 1.7, '#3a2414'); dot(0, 4, 1.7, '#3a2414'); hatch(null, 0.8, 3.2, 0.2); },
      extra: () => strokePts([[0, -20], [2, -29]], '#4a3420', 2.2) },
    epluchure: { base: '#c7843e', pts: (() => { const l = []; for (let i = 0; i <= 14; i++) { const a = i * 0.62, r = 4 + i * 1.5; l.push([Math.cos(a) * r, Math.sin(a) * r * 0.7 - i * 0.9]); } return ribbon(l, 7, 5); })(),
      paint: () => { hatch(null, 0.5, 3, 0.25); fillPts(ell(0, -6, 4, 3, 8), '#e3b878'); } },
    chou: { base: '#7f9b5c', pts: [[-24, 6], [-20, -6], [-10, -15], [4, -17], [17, -12], [25, -2], [22, 8], [8, 13], [-10, 12]],
      paint: () => { strokePts([[-20, 4], [0, -1], [22, -2]], '#cfdcb0', 1.8); for (const x of [-12, -2, 9]) { strokePts([[x, 0], [x + 6, -10]], '#cfdcb0', 1.1); strokePts([[x, 0], [x + 5, 9]], '#cfdcb0', 1.1); } hatch(null, 0.7, 3.4, 0.22); } },
    papier: { base: '#e8e1cf', pts: (() => { const o = []; for (let i = 0; i < 11; i++) { const a = i / 11 * TAU, r = 14 * (0.78 + 0.22 * (((i * 7) % 3) / 2)); o.push([Math.cos(a) * r, Math.sin(a) * r, 1]); } return o; })(),
      paint: () => { for (const [a, b] of [[[-8, -6], [3, 2]], [[2, -10], [6, 4]], [[-6, 6], [8, 8]], [[3, 2], [11, -4]]]) strokePts([a, b], 'rgba(110,100,80,0.6)', 1.1); shade(10, -10, -10, 10, 0.3, [-20, -20, 20, 20]); } },
    feuille: { base: '#ece5d2', pts: [[-14, -26, 1], [14, -24, 1], [16, 20, 1], [-12, 22, 1]],
      paint: () => { lignes(-10, -18, 11, 16, 6, 9, 'rgba(90,86,80,0.55)', 1.1); hatch(null, 0.9, 4, 0.12); } },
    chiffon: { base: '#5d6f86', pts: [[-20, -8], [-8, -14], [6, -10], [18, -14], [24, -2], [16, 8], [20, 18], [4, 14], [-10, 18], [-18, 8]],
      paint: () => { for (const x of [-10, 0, 10]) strokePts([[x, -10], [x + 3, 0], [x - 1, 14]], 'rgba(20,24,34,0.5)', 1.3); strokePts([[-18, 2], [20, 4]], 'rgba(200,190,170,0.45)', 2); hatch(null, 0.8, 3.4, 0.3); } },
    bouteille: { base: '#4e6a48', pts: [[-9, 26, 1], [9, 26, 1], [10, -2], [8, -10], [3, -16], [3, -30, 1], [-3, -30, 1], [-3, -16], [-8, -10], [-10, -2]],
      paint: () => { strokePts([[-5, 22], [-6, -2], [-2, -14]], 'rgba(220,240,210,0.55)', 2); fillPts([[-4, -32, 1], [4, -32, 1], [4, -26, 1], [-4, -26, 1]], '#2f4230'); hatch(null, 0.8, 3.4, 0.25); } },
    assiette: { base: '#ece8de', pts: [[-24, 0], [-22, -10], [-14, -18], [-2, -22], [6, -14, 1], [2, -6, 1], [10, -2, 1], [4, 6, 1], [-8, 4, 1]],
      paint: () => { strokePts([[-21, -2], [-19, -10], [-12, -16], [-2, -19]], '#5d7088', 2.4); strokePts([[-14, -2], [-11, -9], [-4, -12]], 'rgba(93,112,136,0.5)', 1.1); hatch(null, 0.7, 3.6, 0.12); } },
    tesson: { base: '#b4623f', pts: [[-16, 6, 1], [-10, -10, 1], [6, -14, 1], [18, -2, 1], [12, 8, 1]],
      paint: () => { strokePts([[-12, -4], [8, -8], [16, -1]], '#d9b26a', 2.2); hatch(null, 0.9, 3.2, 0.3); } },
    arete: { base: '#ece6d6', pts: [[-38, 0], [-28, -7, 1], [-22, -1.6], [22, -1.6], [30, -9, 1], [34, -8, 1], [30, 0], [34, 8, 1], [30, 9, 1], [22, 1.6], [-22, 1.6], [-28, 7, 1]],
      paint: () => dot(-31, -1, 1.6, '#2a1f1d'),
      extra: () => { for (let x = -16; x <= 18; x += 6) for (const s of [-1, 1]) { strokePts([[x, 0], [x + 3, 9 * s]], 'rgba(60,48,40,0.7)', 3.2); strokePts([[x, 0], [x + 3, 9 * s]], '#ece6d6', 1.6); } } },
    croute: { base: '#c08a48', pts: [[-10, -4], [-4, -9], [8, -9], [14, -4], [12, 4], [-8, 5]],
      paint: () => { fillPts([[-5, -4, 1], [8, -5, 1], [9, 1, 1], [-4, 2, 1]], '#e8d4a6'); hatch(null, 0.7, 3, 0.2); } },
    huitre: { base: '#b8b1a0', pts: [[-20, 4], [-14, -4], [0, -6], [14, -4], [22, 0], [18, 8], [2, 10], [-14, 9]],
      paint: () => { for (const k of [0.4, 0.65, 0.9]) strokePts(ep(-18, 4, 38 * k, 8 * k, 8, -0.6, 0.6), 'rgba(80,72,60,0.5)', 1.1); hatch(null, 0.6, 3, 0.2); },
      extra: (op) => {                                                              // valve supérieure qui bâille (op 0..1) autour de la charnière arrière
        op = clamp(op || 0); const c = cx_();
        if (op > 0.05) piece(ell(3, -2, 15, 3 + 3 * op, 12), '#ece7dc', () => dot(8, -2, 2.5, '#d6cfc0'), { seed: 911, drop: false });
        c.save(); c.translate(-18, 0); c.rotate(-op * 0.75); c.translate(18, 0);
        piece([[-20, 0], [-12, -8], [2, -10], [16, -8], [22, -2], [14, 2], [0, 2], [-14, 2]], '#a9a291', () => { for (const k of [0.5, 0.8]) strokePts(ep(-18, 0, 38 * k, 7 * k, 8, -0.5, 0), 'rgba(80,72,60,0.5)', 1); hatch(null, 0.6, 3, 0.2); }, { seed: 912 });
        c.restore(); } },
  };
  function item(name, x, y, rot, k, seed, param) {
    const it = ITEMS[name], c = cx_(); if (!it) return;
    c.save(); c.translate(x, y); if (rot) c.rotate(rot);
    sub(it.pts, k, it.base, it.paint, seed);
    if (it.extra) { c.save(); c.scale(k, k); it.extra(param); c.restore(); }
    c.restore();
  }
  POU.item = item;

  // =====================================================================
  // LE PRÉFET EUGÈNE POUBELLE — C.prefet : ~50 ans, droit, digne. Habit bleu nuit brodé d'argent (feuilles de chêne au col, aux parements, au devant),
  // pantalon bleu nuit à bande argent, épée courte au fourreau noir, gants blancs, barbe collier blanche + moustache, crâne dégarni,
  // BICORNE DE PRÉFET bordé de plumes blanches, cocarde tricolore (plus large et plus plat que celui de Napoléon, sans or).
  // =====================================================================
  const PF = { habit: '#1f2a44', habitD: '#161e33', habitL: '#2f3d60', arg: '#c9ccd1', argD: '#8f949c', gant: '#ebe8df', gantD: '#cfcabd',
    peau: '#e3c4a2', peauD: '#c79f7c', barbe: '#dedad0', plume: '#efece4', feutre: '#1c1c24' };
  POU.PF = PF;
  const PF_TORSO = [[-14, -178], [8, -182], [17, -170], [30, -152], [40, -122], [46, -86], [47, -48], [42, -12], [34, 10], [8, 16], [-12, 14], [-18, 40], [-24, 112], [-38, 116, 1], [-42, 40], [-40, -40], [-42, -110], [-38, -148], [-28, -168]];
  const PF_HEAD = [[-14, 16], [12, 16], [22, 12], [31, 4], [35, -6], [34, -15], [31, -20], [30, -25], [29, -29], [32, -33], [38, -39, 1], [34, -46], [30, -56], [30, -64], [27, -78], [15, -92], [-6, -98], [-25, -89], [-34, -68], [-33, -46], [-25, -28], [-18, -8]];
  const PF_BEARD = [[-2, -58], [4, -58], [7, -44], [13, -33], [20, -25], [27, -20], [34, -19], [42, -16], [42, 22], [-22, 22], [-15, -8], [-7, -30], [-4, -46]];
  const PF_MOUST = [[39, -35], [37, -30], [31, -27], [24, -27], [19, -29], [21, -33], [29, -36]];
  const PF_BIC = [[-76, 6, 1], [-42, 9], [0, 11], [42, 9], [78, 4, 1], [61, -11], [30, -26], [-3, -29], [-42, -20], [-64, -7]];
  const PF_TOP = [[-75, 3], [-64, -7], [-42, -19], [-3, -28], [30, -25], [61, -11], [77, 2]];
  const PF_TOPS = resample(PF_TOP, 46);
  const PF_HATREST = -0.02;
  // petite feuille de chêne lobée (argent) le long de l'angle a
  function feuille(x, y, a, sz, col) {
    if (M._sil()) return;
    const up = [], dn = [];
    for (let i = 0; i <= 10; i++) { const u = i / 10, w = Math.sin(PI * u) * (0.5 + 0.2 * Math.cos(u * PI * 6)) * sz * 0.42; up.push([u * sz, -w]); dn.push([u * sz, w]); }
    const c = cx_(); c.save(); c.translate(x, y); c.rotate(a);
    fillPts(up.concat(dn.reverse()), col || PF.arg, 0, 0); strokePts([[0, 0], [sz * 0.85, 0]], 'rgba(50,56,70,0.6)', 0.8);
    c.restore();
  }
  function rameau(line, sz, seed, col) {
    strokePts(line, col || PF.argD, 1.3);
    const L = resample(line, Math.max(3, Math.round(line.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - line[i - 1][0], p[1] - line[i - 1][1]) : 0), 0) / (sz * 0.7))));
    for (let i = 1; i < L.length; i++) { const a = Math.atan2(L[i][1] - L[i - 1][1], L[i][0] - L[i - 1][0]); feuille(L[i][0], L[i][1], a + (i % 2 ? 0.95 : -0.95), sz, col); }
  }
  function plumesPts(t) {
    const S = PF_TOPS, out = [], inn = [];
    for (let i = 0; i < S.length; i++) {
      const a = S[Math.max(0, i - 1)], b = S[Math.min(S.length - 1, i + 1)];
      let nx = b[1] - a[1], ny = -(b[0] - a[0]); const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
      const u = i / (S.length - 1), env = Math.sin(PI * u) * 0.75 + 0.25, sc = Math.abs(Math.sin(u * PI * 11));
      const r = 3.5 + 5 * env + 3.5 * sc + Math.sin(t * 9 + i * 0.8) * 1.1 * env;
      out.push([S[i][0] + nx * r, S[i][1] + ny * r]); inn.push([S[i][0] - nx * 4, S[i][1] - ny * 4]);
    }
    return out.concat(inn.reverse());
  }
  function bicFeltPaint() {
    shade(0, -32, 0, 12, 0.32, [-80, -36, 80, 16]);
    hatch([[-80, -14], [80, -14], [80, 16], [-80, 16]], -0.3, 3.6, 0.32, 1, '150,155,175');
    strokePts([[-74, 4], [-38, 7], [0, 9], [38, 7], [76, 2]], PF.arg, 2.4);                              // galon d'argent du bord
    strokePts([[16, -11], [23, -24]], PF.arg, 3); strokePts([[16, -11], [23, -24]], 'rgba(255,255,255,0.5)', 1);   // ganse
    dot(16, -9, 8.6, '#8a2420'); dot(16, -9, 5.8, '#e9e2d0'); dot(16, -9, 3, '#24365e');                  // cocarde tricolore
  }
  function plumesPiece(t, k) {
    const pts = plumesPts(t || 0);
    sub(pts, k, PF.plume, () => {
      for (let i = 2; i < PF_TOPS.length - 2; i += 2) { const p = PF_TOPS[i], q = pts[i]; strokePts([[p[0], p[1]], [lerp(p[0], q[0], 0.95), lerp(p[1], q[1], 0.95)]], 'rgba(150,145,135,0.55)', 0.9); }
      hatch(null, 0.4, 3.4, 0.1);
    }, 2112);
  }
  // bicorne complet dans le repère courant (bord inférieur au milieu en 0,0) à l'échelle k
  function bicorneDraw(t, k) { sub(PF_BIC, k, PF.feutre, bicFeltPaint, 2111); plumesPiece(t, k); }
  POU.bicorneDraw = bicorneDraw;

  const pfSleeve = (col) => (p) => { hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.2, 1, '200,205,225'); };
  function pfFore(col, glove, back) {
    return { pts: (p) => foreR((back ? p.handB : p.handF) || (back ? 'fist' : 'open')), base: col,
      paint: (p) => {
        const kind = (back ? p.handB : p.handF) || (back ? 'fist' : 'open');
        fillPts([[-20, 76, 1], [20, 76, 1], [24, 130, 1], [-20, 130, 1]], glove); X.handPaint(null, kind);
        fillPts([[-14, 52, 1], [14, 52, 1], [15, 77, 1], [-14, 77, 1]], back ? PF.habit : PF.habitL);                 // parement brodé
        feuille(-11, 66, -0.3, 11); feuille(-2, 62, 0.2, 11); feuille(6, 68, -0.1, 10);
        strokePts([[-14, 53], [14, 53]], PF.arg, 1.6); strokePts([[-14, 77], [15, 77]], PF.arg, 1.6);
        hatch([[-14, 0], [-3, 0], [-3, 50], [-14, 50]], 0.9, 3.8, 0.2, 1, '200,205,225'); } };
  }
  const DOIGTS = [[-13, -9], [9, -11], [12, -4], [12, 6], [6, 11], [-6, 11], [-13, 4]];
  const doigtsPaint = () => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(70,60,50,0.5)', 1); hatch(null, 0.9, 3.4, 0.15); };
  const PF_PLUME = [[0, 40, 1], [2, 26], [2, -4], [9, -18], [14, -48], [12, -80], [5, -104], [0, -114, 1], [-5, -98], [-7, -62], [-5, -22], [-2, -4], [-2, 26]];
  const PF_ROUL = [[-46, -11], [46, -11], [51, 0], [46, 11], [-46, 11], [-51, 0]];
  function mkPrefet() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: PF_TORSO, base: PF.habit, seed: 2101, paint: () => {
        fillPts([[6, -184], [18, -172], [22, -160], [12, -158], [3, -170]], '#efeadf');                     // cravate blanche
        strokePts([[16, -166], [28, -150], [38, -122], [44, -86], [45, -48], [40, -14], [32, 8]], PF.arg, 3.2);   // bord avant argent
        rameau([[24, -152], [32, -132], [37, -110]], 13, 3);
        for (const [bx, by] of [[34, -136], [39, -112], [42, -88], [43, -64], [42, -40], [38, -18]]) { dot(bx + 0.6, by + 0.8, 3.4, 'rgba(10,10,20,0.5)'); dot(bx, by, 3, PF.arg); dot(bx - 0.8, by - 0.8, 1.1, '#fff'); }
        fillPts([[-16, -186], [10, -188], [20, -174], [18, -160], [-14, -162]], PF.habitL);               // col montant brodé
        rameau([[-12, -172], [2, -176], [16, -170]], 11, 4);
        strokePts([[-16, -161], [18, -160]], PF.arg, 1.6);
        fillPts([[-38, -10, 1], [-14, -10, 1], [-14, 2, 1], [-38, 2, 1]], PF.habitL); rameau([[-36, -4], [-16, -4]], 10, 6);    // rabat de poche
        strokePts([[-20, 60], [-24, 112], [-38, 115]], PF.arg, 2.4); rameau([[-36, 106], [-30, 80], [-26, 56]], 11, 5);   // pans
        hatch([[-52, -176], [-10, -176], [-8, 120], [-52, 120]], 0.75, 4.2, 0.22, 1.05, '200,205,225');
        strokePts([[-6, -150], [-10, -60], [-12, 10]], 'rgba(5,8,20,0.6)', 1.3);
        shade(46, 0, -44, 0, 0.32); } },
      epee: { parent: 'torso', at: [-28, 6], rest: 0.52, noRivet: true, base: '#18161a', seed: 2102,
        pts: [[-4, -36], [4, -36], [4, -6], [13, -6, 1], [13, 2, 1], [5, 2], [5, 96], [3, 118], [0, 126, 1], [-3, 118], [-5, 96], [-5, 2], [-13, 2, 1], [-13, -6, 1], [-4, -6]],
        paint: () => { fillPts([[-16, -8, 1], [16, -8, 1], [16, 3, 1], [-16, 3, 1]], PF.arg); fillPts([[-5, -38, 1], [5, -38, 1], [5, -8, 1], [-5, -8, 1]], '#e6dfcf'); for (let y = -32; y < -8; y += 5) strokePts([[-4, y], [4, y + 2]], 'rgba(120,110,90,0.6)', 1);
          fillPts([[-7, 102, 1], [7, 102, 1], [7, 130, 1], [-7, 130, 1]], PF.arg); strokePts([[-1, 6], [-1, 100]], 'rgba(255,255,255,0.18)', 1.4); hatch(null, 0.5, 3.4, 0.2, 1, '200,205,225'); } },
      legB: { parent: 'torso', at: [-6, -2], pts: X.legPts(1), base: PF.habitD, seed: 2103, noRivet: true, paint: () => {
        strokePts([[-2, -6], [-1, 100], [-1, 212]], PF.argD, 2.6); fillPts([[-40, 214, 1], [60, 214, 1], [60, 260, 1], [-40, 260, 1]], '#141215'); hatch(null, 0.8, 3.6, 0.2, 1, '200,205,225'); } },
      legF: { parent: 'torso', at: [6, -2], pts: X.legPts(1), base: PF.habit, seed: 2104, paint: () => {
        strokePts([[-2, -6], [-1, 100], [-1, 212]], PF.arg, 3); fillPts([[-40, 214, 1], [60, 214, 1], [60, 260, 1], [-40, 260, 1]], '#1b191d');
        strokePts([[20, 224], [42, 229]], 'rgba(255,255,255,0.3)', 1.4); hatch([[-26, -20], [-8, -20], [-8, 212], [-26, 212]], 0.8, 4, 0.2, 1, '200,205,225'); } },
      armB_up: Object.assign({ parent: 'torso', at: [-10, -146], pts: armR(98), base: PF.habitD, seed: 2105, paint: pfSleeve() }),
      armB_lo: Object.assign({ parent: 'armB_up', at: [0, 98], seed: 2106 }, pfFore(PF.habitD, PF.gantD, true)),
      head: { parent: 'torso', at: [6, -170], pts: PF_HEAD, base: PF.peau, seed: 2107, noRivet: true, paint: (p) => {
        const f = p.face || {};
        fillPts([[-36, -88], [-22, -92], [-12, -80], [-14, -62], [-17, -46], [-22, -30], [-34, -32], [-40, -60]], '#c8c4ba', 4);   // couronne grise
        for (const [a, b] of [[[-30, -80], [-20, -60]], [[-34, -62], [-24, -44]], [[-22, -84], [-16, -70]]]) strokePts([a, b], 'rgba(120,115,105,0.6)', 1);
        dot(2, -86, 9, 'rgba(255,240,222,0.4)');                                                   // reflet du crâne dégarni
        hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.26);
        dot(16, -40, 8, 'rgba(205,120,105,0.3)'); dot(37, -40, 4, 'rgba(205,120,105,0.35)');
        fillPts(PF_BEARD, PF.barbe, 5, 0.6);                                                       // barbe en collier (blanche)
        { const R = rng(21); for (let i = 0; i < 34; i++) { const x = -10 + R() * 48, y = -40 + R() * 56; strokePts([[x, y], [x + 2.5, y + 4], [x + 1, y + 8]], 'rgba(140,136,128,0.55)', 1); } }
        strokePts([[-2, -56], [6, -42], [13, -32], [20, -24], [27, -20], [36, -18]], 'rgba(150,146,138,0.6)', 1.2);
        X.earPaint(-8, -44);
        fillPts(PF_MOUST, '#ebe7dd', 6, 0.4); strokePts([[21, -31], [28, -32], [36, -32]], 'rgba(140,136,128,0.7)', 1); strokePts([[19, -29], [26, -27.5], [33, -28]], 'rgba(120,116,108,0.5)', 1);
        strokePts([[22, -47], [26, -45]], 'rgba(100,60,45,0.45)', 1);                                 // pattes d'oie
        X.eye(f, 17, -53, 1.1); X.brow(f, 17, -61, '#b0aca2', 3.6); X.mouth(f, 29, -23);
        strokePts([[31, -36], [33, -35]], 'rgba(70,35,25,0.7)', 1.3); } },
      bicorne: { parent: 'head', at: [-2, -84], pts: PF_BIC, base: PF.feutre, seed: 2111, noRivet: true, rest: PF_HATREST, paint: bicFeltPaint,
        extra: (p) => plumesPiece(p.t || 0, 1) },
      bicorneMain: { parent: 'armF_lo', at: [4, 96], noRivet: true, seed: 2111, base: PF.feutre,
        pts: (p) => (p._bic ? xf(PF_BIC, p._bic) : OFFP),
        paint: (p) => { if (!p._bic) return; const c = cx_(); c.save(); ctxM(p._bic); bicFeltPaint(); c.restore(); },
        extra: (p) => { if (!p._bic) return; const c = cx_(); c.save(); ctxM(p._bic); plumesPiece(p.t || 0, 1); c.restore(); } },
      armF_up: { parent: 'torso', at: [-2, -146], pts: armR(98), base: PF.habit, seed: 2113, paint: pfSleeve() },
      armF_lo: Object.assign({ parent: 'armF_up', at: [0, 98], seed: 2114 }, pfFore(PF.habit, PF.gant, false)),
      objet: { parent: 'armF_lo', at: [4, 96], noRivet: true, seed: 2115, base: '#ece6d6',
        pts: (p) => (p.tenu === 'plume' ? PF_PLUME : p.tenu === 'rouleau' ? PF_ROUL : OFFP),
        paint: (p) => {
          if (p.tenu === 'plume') { strokePts([[0, 36], [0, -110]], 'rgba(150,140,120,0.8)', 1.4); for (let y = -100; y < -8; y += 7) { strokePts([[0, y], [10, y - 9]], 'rgba(160,150,135,0.5)', 0.9); strokePts([[0, y], [-6, y - 7]], 'rgba(160,150,135,0.5)', 0.9); } fillPts([[-3, 26], [3, 26], [0, 41]], '#2a2230'); }
          else if (p.tenu === 'rouleau') { fillPts([[-46, -11, 1], [-40, -11, 1], [-40, 11, 1], [-46, 11, 1]], '#d8cfb6'); fillPts([[40, -11, 1], [46, -11, 1], [46, 11, 1], [40, 11, 1]], '#d8cfb6'); strokePts(ep(48, 0, 3, 9, 10, -PI / 2, PI / 2), 'rgba(120,100,70,0.6)', 1); fillPts([[-8, -12, 1], [8, -12, 1], [8, 12, 1], [-8, 12, 1]], '#8e2f2b'); dot(0, 0, 6, '#a3302c'); hatch(null, 0, 3.4, 0.15); } } },
      doigts: { parent: 'armF_lo', at: [4, 96], noRivet: true, seed: 2116, base: PF.gant, pts: (p) => ((p.tenu && p.tenu !== 'rien') || p._bic ? DOIGTS : OFFP), paint: doigtsPaint },
    };
    return { hipY: -238, parts, handLen: 104, rod: { part: 'torso', at: [-26, 18] },
      order: ['epee', 'armB_up', 'armB_lo', 'legB', 'legF', 'head', 'bicorne', 'torso', 'bicorneMain', 'armF_up', 'armF_lo', 'objet', 'doigts'] };
  }
  CH.prefet = mkPrefet();
  // IK deux segments dans le repère du torse (épaule S, cible T), coude choisi le plus bas
  const PF_L2 = Math.hypot(4, 96), PF_PHI = Math.atan2(-4, 96), PF_SH = [-2, -146];
  function ik2(S, T, L1, L2, phi) {
    const vx = T[0] - S[0], vy = T[1] - S[1];
    const d = clamp(Math.hypot(vx, vy), Math.abs(L1 - L2) + 1, L1 + L2 - 0.5), tv = Math.atan2(-vx, vy);
    const a1 = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
    let best = null;
    for (const sg of [1, -1]) {
      const a = tv + sg * a1, E = [S[0] - L1 * Math.sin(a), S[1] + L1 * Math.cos(a)];
      const cAbs = Math.atan2(-(T[0] - E[0]), T[1] - E[1]) - phi;
      if (!best || E[1] > best.ey) best = { a: normA(a), b: normA(cAbs - a), ey: E[1] };
    }
    return best;
  }
  // pose préparée : salut (la main prend et soulève le bicorne), soupir
  POU.prefetPose = function (p) {
    p = p || {};
    const q = Object.assign({}, p, { ang: Object.assign({}, p.ang), hide: Object.assign({}, p.hide), face: Object.assign({}, p.face) });
    const A = q.ang, so = clamp(q.soupir || 0);
    if (so > 0) {
      q.dy = (q.dy || 0) + 6 * so; q.tilt = (q.tilt || 0) - 0.02 * so;
      A.head = (A.head || 0) + 0.22 * so; A.armF_up = (A.armF_up || 0) + 0.06 * so; A.armB_up = (A.armB_up || 0) - 0.06 * so;
      A.armF_lo = (A.armF_lo || 0) * (1 - so); A.armB_lo = (A.armB_lo || 0) * (1 - so);
      if (!(p.face && p.face.eyes) && so > 0.45) q.face.eyes = 'half';
    }
    q._bic = null;
    const sal = clamp(q.salut || 0);
    if (sal > 0) {
      const Hm = new DOMMatrix().translate(6, -170).rotate((A.head || 0) * D).translate(-2, -84).rotate((PF_HATREST + (A.bicorne || 0)) * D);
      const G = [64, 2], g0 = mp(Hm, G);
      const s1 = ease(clamp(sal / 0.4)), s2 = ease(clamp((sal - 0.4) / 0.6));
      const a0 = A.armF_up || 0, b0 = A.armF_lo || 0;
      if (sal < 0.4) {
        const sol = ik2(PF_SH, g0, 98, PF_L2, PF_PHI);
        A.armF_up = a0 + normA(sol.a - a0) * s1; A.armF_lo = b0 + normA(sol.b - b0) * s1;
      } else {
        const Lm = new DOMMatrix().translate(16 * s2, -60 * s2).translate(g0[0], g0[1]).rotate(-0.3 * s2 * D).translate(-g0[0], -g0[1]).multiply(Hm);
        const sol = ik2(PF_SH, mp(Lm, G), 98, PF_L2, PF_PHI);
        A.armF_up = sol.a; A.armF_lo = sol.b;
        const Hf = new DOMMatrix().translate(PF_SH[0], PF_SH[1]).rotate(sol.a * D).translate(0, 98).rotate(sol.b * D).translate(4, 96);
        q._bic = Hf.inverse().multiply(Lm); q.hide.bicorne = 1;
      }
      q.handF = 'fist';
    }
    if (q.tenu && q.tenu !== 'rien') q.handF = 'fist';
    return q;
  };
  POU.prefet = function (pose, x, y, s, o) { return M.puppet(CH.prefet, POU.prefetPose(pose), x, y, s == null ? 0.93 : s, o || {}); };

  // =====================================================================
  // LE PROPRIÉTAIRE — C.proprio : bourgeois ventru, haut-de-forme, redingote brune, gilet ocre et chaîne de montre, favoris
  // =====================================================================
  const PR = { coat: '#5a3b28', coatD: '#432b1d', coatL: '#74503a', gilet: '#b5863f', giletD: '#8f6830', peau: '#e4b996', peauD: '#c7997a', rouge: '#b5452f',
    pant: '#6e6a62', pantD: '#55524c', fav: '#6a5240', hat: '#1b1a1e' };
  const PR_TORSO = [[-16, -178], [8, -182], [18, -170], [34, -150], [52, -124], [68, -94], [76, -62], [74, -30], [62, -6], [46, 8], [38, 60], [36, 120, 1], [-46, 124, 1], [-48, 60], [-46, 0], [-48, -60], [-48, -118], [-42, -152], [-30, -170]];
  const PR_HEAD = [[-14, 18], [12, 18], [18, 8], [26, 0], [31, -8], [32, -16], [30, -21], [32, -26], [31, -30], [35, -34], [42, -41, 1], [37, -49], [32, -57], [31, -66], [27, -80], [15, -93], [-6, -98], [-26, -90], [-35, -70], [-35, -46], [-28, -24], [-20, -6]];
  const PR_FAV = [[-12, -78], [-2, -76], [4, -62], [8, -48], [13, -38], [19, -30], [23, -20], [21, -10], [14, -4], [6, -6], [1, -14], [-1, -28], [-2, -36], [-14, -36], [-12, -58]];
  const PR_HAT = [[-36, 4, 1], [40, 4, 1], [42, -4], [28, -7], [30, -92, 1], [-24, -94, 1], [-22, -7], [-38, -4]];
  const prHatM = (p) => { const k = clamp(p.leve || 0); return k > 0.001 ? new DOMMatrix().translate(-4 * k, -36 * k).rotate(-0.14 * k * D) : null; };
  function mkProprio() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: PR_TORSO, base: PR.coat, seed: 2201, paint: () => {
        fillPts([[14, -166], [32, -150], [50, -124], [66, -94], [74, -62], [72, -30], [60, -6], [44, 8], [30, 2], [32, -40], [26, -100], [18, -140]], PR.gilet);
        hatch([[20, -150], [70, -150], [70, 10], [20, 10]], 0.3, 4.4, 0.2);
        for (const [bx, by] of [[48, -112], [62, -86], [68, -58], [64, -30]]) { dot(bx, by, 2.6, PR.giletD); dot(bx - 0.6, by - 0.6, 1, '#f0d9a0'); }
        const ch = qbez([46, -78], [56, -52], [70, -62], 9); for (const q of ch) { dot(q[0] + 0.5, q[1] + 0.6, 2.2, 'rgba(40,20,5,0.5)'); dot(q[0], q[1], 1.9, P.orL); }   // chaîne de montre
        fillPts([[6, -182], [18, -172], [22, -162], [12, -160], [3, -172]], '#efeadf'); fillPts([[12, -168], [24, -160], [16, -152]], '#1b1a1e');   // col et cravate
        strokePts([[16, -166], [26, -120], [30, -60], [36, 0], [40, 60], [36, 118]], 'rgba(20,10,4,0.65)', 2);             // revers de la redingote
        strokePts([[-14, -150], [-20, -60], [-24, 20], [-30, 120]], 'rgba(20,10,4,0.45)', 1.3);
        hatch([[-60, -176], [-14, -176], [-14, 126], [-60, 126]], 0.75, 4.2, 0.36);
        shade(66, 0, -48, 0, 0.3); } },
      legB: { parent: 'torso', at: [-6, -2], pts: X.legPts(1.15), base: PR.pantD, seed: 2202, noRivet: true, paint: () => { fillPts([[-40, 214, 1], [60, 214, 1], [60, 260, 1], [-40, 260, 1]], '#141215'); hatch(null, 0.8, 3.6, 0.26); } },
      legF: { parent: 'torso', at: [6, -2], pts: X.legPts(1.15), base: PR.pant, seed: 2203, paint: () => {
        for (const x of [-14, -6, 2, 10]) strokePts([[x, -10], [x * 0.7, 100], [x * 0.6, 212]], 'rgba(40,36,30,0.35)', 1);    // rayures
        fillPts([[-40, 214, 1], [60, 214, 1], [60, 260, 1], [-40, 260, 1]], '#1b191d'); fillPts([[-20, 196, 1], [22, 196, 1], [24, 216, 1], [-20, 216, 1]], '#d8cfb8');   // guêtres
        hatch([[-26, -20], [-8, -20], [-8, 200], [-26, 200]], 0.8, 4, 0.24); } },
      armB_up: { parent: 'torso', at: [-12, -146], pts: armR(96, 17), base: PR.coatD, seed: 2204, paint: () => hatch(null, 0.8, 3.8, 0.3) },
      armB_lo: { parent: 'armB_up', at: [0, 96], seed: 2205, base: PR.coatD, pts: (p) => foreR(p.handB || 'fist'), paint: (p) => {
        fillPts([[-20, 76, 1], [20, 76, 1], [24, 130, 1], [-20, 130, 1]], PR.peauD); X.handPaint(null, p.handB || 'fist'); fillPts([[-15, 64, 1], [15, 64, 1], [16, 78, 1], [-15, 78, 1]], '#e4dcc8'); } },
      head: { parent: 'torso', at: [6, -172], pts: PR_HEAD, base: PR.peau, seed: 2206, noRivet: true, paint: (p) => {
        const f = p.face || {}, rg = clamp(p.rouge || 0);
        if (rg > 0.01) { fillPts([[-50, -110, 1], [50, -110, 1], [50, 30, 1], [-50, 30, 1]], `rgba(181,69,47,${0.8 * rg})`); }
        fillPts([[-36, -84], [-22, -92], [-8, -86], [-14, -70], [-20, -52], [-26, -30], [-38, -34]], '#6a5240', 3);
        X.earPaint(-8, -46); if (rg > 0.01) dot(-8, -46, 9, `rgba(160,40,30,${0.5 * rg})`);
        fillPts(PR_FAV, '#6f5a48', 9, 0.9);                                                        // favoris (rejoignent les cheveux)
        { const R = rng(31); for (let i = 0; i < 20; i++) { const x = -2 + R() * 22, y = -66 + R() * 58; strokePts([[x, y], [x + 2, y + 6]], 'rgba(30,20,12,0.5)', 1.1); } }
        hatch([[-22, -42], [2, -30], [14, -6], [-6, 22], [-32, 4]], 0.6, 3.6, 0.28);
        strokePts([[-2, 12], [14, 14], [26, 6]], 'rgba(90,50,40,0.5)', 1.5);                         // double menton
        dot(40, -40, 5, 'rgba(200,90,80,0.5)');
        fillPts([[40, -33], [33, -27], [22, -27], [24, -33], [32, -35]], '#5c4636', 7, 0.3);           // moustache
        X.eye(f, 18, -55); X.brow(f, 18, -63, '#4a3628', 3.2); X.mouth(f, 29, -21); } },
      chapeau: { parent: 'head', at: [-4, -88], seed: 2208, noRivet: true, base: PR.hat,
        pts: (p) => { const m = prHatM(p); return m ? xf(PR_HAT, m) : PR_HAT; },
        paint: (p) => { const c = cx_(); c.save(); const m = prHatM(p); if (m) ctxM(m);
          fillPts([[-24, -26, 1], [30, -24, 1], [30, -10, 1], [-23, -12, 1]], '#2e2a2c'); strokePts([[-23, -25], [30, -23]], 'rgba(200,190,170,0.35)', 1);
          for (const x of [-12, 8, 20]) strokePts([[x, -88], [x + 1, -30]], 'rgba(255,255,255,0.12)', 2.5);
          hatch(null, 0.3, 3.6, 0.3, 1, '120,115,110'); c.restore(); } },
      fumee: { parent: 'head', at: [-8, -46], seed: 2209, noRivet: true, base: '#e6e1d6', pts: OFFP,
        extra: (p) => {
          const k = clamp(p.fumee || 0); if (k < 0.02) return; const c = cx_(), t = p.t || 0;
          for (let i = 0; i < 3; i++) {
            const u = ((t * 1.3 + i / 3) % 1 + 1) % 1, r = (8 + 16 * u) * k;
            const x = -6 - 40 * u - 5 * Math.sin(t * 7 + i), y = -4 - 70 * u;
            c.save(); if (!M._sil()) c.globalAlpha = clamp((1 - u) * 1.6);
            piece([[x - r, y + r * 0.4], [x - r * 0.9, y - r * 0.3], [x - r * 0.3, y - r * 0.8], [x + r * 0.4, y - r * 0.7], [x + r, y - r * 0.1], [x + r * 0.8, y + r * 0.5], [x, y + r * 0.6]], '#e6e1d6',
              () => hatch(null, 0.5, 3, 0.15), { seed: 2210 + i, drop: false });
            c.restore();
          } } },
      armF_up: { parent: 'torso', at: [-2, -146], pts: armR(96, 17), base: PR.coat, seed: 2211, paint: () => hatch([[-18, -20], [-3, -20], [-3, 100], [-18, 100]], 0.9, 3.8, 0.3) },
      armF_lo: { parent: 'armF_up', at: [0, 96], seed: 2212, base: PR.coat, pts: (p) => foreR(p.handF || 'open'), paint: (p) => {
        fillPts([[-20, 76, 1], [20, 76, 1], [24, 130, 1], [-20, 130, 1]], PR.peau); X.handPaint(null, p.handF || 'open'); fillPts([[-15, 64, 1], [15, 64, 1], [16, 78, 1], [-15, 78, 1]], '#ece4d0');
        hatch([[-14, 0], [-3, 0], [-3, 62], [-14, 62]], 0.9, 3.8, 0.26); } },
    };
    return { hipY: -238, parts, handLen: 104, rod: { part: 'torso', at: [-28, 18] },
      order: ['armB_up', 'armB_lo', 'legB', 'legF', 'head', 'chapeau', 'fumee', 'torso', 'armF_up', 'armF_lo'] };
  }
  CH.proprio = mkProprio();

  // =====================================================================
  // LE CHIFFONNIER — C.chiffonnier : maigre, casquette plate, veste rapiécée gris-vert à pièces ocre, hotte d'osier, crochet ou pelle à long manche
  // =====================================================================
  const CF = { veste: '#5d6650', vesteD: '#464d3c', piece: '#b5863f', pant: '#5b4a3a', pantD: '#45382b', peau: '#d2a47e', peauD: '#b38763', cap: '#4a4540',
    hotte: '#a07a45', hotteD: '#7d5d33', hotteL: '#bf9a62', foulard: '#8e3a30', fer: '#4b4a4e' };
  const CF_TORSO = [[-12, -176], [8, -180], [16, -168], [24, -150], [30, -114], [30, -70], [28, -24], [24, 10], [22, 40], [18, 70, 1], [-30, 74, 1], [-32, 40], [-32, -30], [-34, -100], [-32, -148], [-24, -168]];
  const CF_HEAD = [[-12, 16], [8, 16], [10, 2], [15, -6], [22, -10], [26, -16], [24, -21], [26, -25], [25, -29], [29, -34], [40, -42, 1], [33, -48], [28, -56], [28, -64], [25, -78], [13, -91], [-6, -96], [-24, -87], [-32, -68], [-31, -46], [-24, -28], [-17, -8]];
  const CF_CAP = [[-38, 6], [-35, -12], [-14, -24], [14, -24], [32, -14], [38, -4], [60, 0, 1], [60, 6, 1], [24, 8], [-20, 10]];
  const CF_HOTTE = [[-92, -60, 1], [14, -56, 1], [17, -44], [4, 60], [-8, 170], [-16, 186, 1], [-62, 184, 1], [-70, 170], [-84, 60], [-96, -44]];
  const SHAFT = ribbon([[0, -170], [0, 132]], 9, 9);
  const PELLE = [[-6, 124], [6, 124], [8, 136], [30, 140], [32, 196], [0, 216, 1], [-32, 196], [-30, 140], [-8, 136]];
  const CROCHET_M = ribbon([[0, -40], [0, 32]], 11, 10);
  const CROCHET_F = ribbon([[0, 30], [0, 92], [3, 106], [14, 114], [24, 108], [25, 96], [20, 90]], 5, 3.4);
  function patch(x0, y0, x1, y1) { fillPts([[x0, y0, 1], [x1, y0 + 1, 1], [x1 + 1, y1, 1], [x0 - 1, y1 - 1, 1]], CF.piece); for (let x = x0 + 2; x < x1; x += 4) { strokePts([[x, y0 + 1], [x + 1, y0 + 4]], 'rgba(40,30,10,0.6)', 0.9); strokePts([[x, y1 - 4], [x + 1, y1 - 1]], 'rgba(40,30,10,0.6)', 0.9); } }
  function mkChiffonnier() {
    const fore = (back) => ({ parent: back ? 'armB_up' : 'armF_up', at: [0, 92], seed: back ? 2304 : 2312, base: back ? CF.vesteD : CF.veste,
      pts: (p) => foreR((back ? p.handB : p.handF) || 'fist'),
      paint: (p) => { fillPts([[-20, 76, 1], [20, 76, 1], [24, 130, 1], [-20, 130, 1]], back ? CF.peauD : CF.peau); X.handPaint(null, (back ? p.handB : p.handF) || 'fist');
        for (const y of [62, 70]) strokePts([[-12, y], [12, y + 2]], 'rgba(30,30,20,0.45)', 1); hatch([[-14, 0], [-3, 0], [-3, 70], [-14, 70]], 0.9, 3.8, 0.3); } });
    const parts = {
      torso: { parent: null, at: [0, 0], pts: CF_TORSO, base: CF.veste, seed: 2301, paint: () => {
        patch(-26, -104, -6, -80); patch(4, -30, 22, -12);
        fillPts([[-14, -180], [10, -182], [20, -166], [8, -158], [-12, -162]], CF.foulard); fillPts([[14, -164, 1], [24, -150, 1], [18, -142, 1], [10, -156, 1]], CF.foulard);   // foulard
        fillPts([[10, -170, 1], [18, -164, 1], [-14, -104, 1], [-22, -110, 1]], '#4a3424');                                           // bretelle de la hotte
        for (const y of [-120, -90, -60, -30]) dot(24, y, 2.2, '#2e2a24');
        strokePts([[20, -150], [26, -110], [26, -60], [22, 10]], 'rgba(20,24,16,0.6)', 1.3);
        hatch([[-46, -176], [-10, -176], [-10, 76], [-46, 76]], 0.75, 4.2, 0.36); shade(30, 0, -34, 0, 0.3); } },
      hotte: { parent: 'torso', at: [-30, -150], rest: 0.05, pts: CF_HOTTE, base: CF.hotte, seed: 2302, noRivet: true, paint: () => {
        for (let y = -44, r = 0; y < 186; y += 11, r++) {
          strokePts([[-100, y], [20, y]], 'rgba(70,45,15,0.55)', 1.4);
          for (let x = -96 + (r % 2) * 7; x < 18; x += 14) strokePts([[x, y + 1], [x + 3, y + 10]], 'rgba(255,225,170,0.35)', 2.6);
        }
        for (let x = -86; x < 14; x += 14) strokePts([[x, -50], [x * 0.6 - 16, 186]], 'rgba(60,38,12,0.4)', 1.1);
        fillPts([[-96, -62, 1], [16, -58, 1], [16, -44, 1], [-98, -46, 1]], CF.hotteD);                                               // bord tressé
        hatch(null, 0.8, 4, 0.22); shade(10, 0, -96, 0, 0.32, [-100, -70, 20, 190]); },
        extra: () => { item('chiffon', -40, -68, -0.3, 1, 2320); item('papier', -66, -66, 0, 0.9, 2321); item('feuille', -14, -74, 0.25, 0.8, 2322); } },
      legB: { parent: 'torso', at: [-6, -2], pts: X.legPts(0.85), base: CF.pantD, seed: 2303, noRivet: true, paint: () => { fillPts([[-40, 214, 1], [60, 214, 1], [60, 260, 1], [-40, 260, 1]], '#211b17'); hatch(null, 0.8, 3.6, 0.3); } },
      legF: { parent: 'torso', at: [6, -2], pts: X.legPts(0.85), base: CF.pant, seed: 2305, paint: () => {
        patch(-12, 96, 8, 120); fillPts([[-40, 214, 1], [60, 214, 1], [60, 260, 1], [-40, 260, 1]], '#2b2420'); strokePts([[-16, 234], [46, 234]], 'rgba(200,180,150,0.35)', 1.4);
        hatch([[-24, -20], [-8, -20], [-8, 212], [-24, 212]], 0.8, 4, 0.3); } },
      armB_up: { parent: 'torso', at: [-10, -146], pts: armR(92), base: CF.vesteD, seed: 2306, paint: () => hatch(null, 0.8, 3.8, 0.34) },
      armB_lo: fore(true),
      head: { parent: 'torso', at: [6, -170], pts: CF_HEAD, base: CF.peau, seed: 2307, noRivet: true, paint: (p) => {
        const f = p.face || {};
        fillPts([[-36, -76], [-24, -78], [-18, -64], [-22, -50], [-30, -40], [-38, -48]], '#5a4e42', 4);                // mèches sous la casquette
        for (const [a, b] of [[[-32, -60], [-38, -48]], [[-24, -62], [-28, -46]]]) strokePts([a, b], 'rgba(30,24,18,0.6)', 1.2);
        X.earPaint(-8, -44);
        const R = rng(41); for (let i = 0; i < 40; i++) dot(-10 + R() * 34, -36 + R() * 44, 0.9, 'rgba(70,60,52,0.55)');   // barbe de trois jours
        hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.32);
        dot(36, -40, 4, 'rgba(200,100,90,0.45)');
        fillPts([[34, -33], [28, -27], [20, -26], [16, -30], [24, -34]], '#5a4e42', 5, 0.3);                           // moustache tombante
        X.eye(f, 17, -53); X.brow(f, 17, -61, '#4a3e34', 3.2); X.mouth(f, 25, -22);
        strokePts([[6, -42], [10, -26]], 'rgba(90,50,40,0.4)', 1.1); } },
      casquette: { parent: 'head', at: [-4, -80], pts: CF_CAP, base: CF.cap, seed: 2308, noRivet: true, paint: () => {
        fillPts([[30, -2, 1], [60, 0, 1], [60, 6, 1], [24, 8, 1]], '#3a3632'); dot(-2, -22, 2.6, '#2a2622'); strokePts([[-30, -6], [32, -10]], 'rgba(20,18,16,0.5)', 1.2);
        hatch(null, 0.6, 3.6, 0.3); } },
      armF_up: { parent: 'torso', at: [-2, -146], pts: armR(92), base: CF.veste, seed: 2309, paint: () => { patch(-12, 60, 8, 84); hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.3); } },
      armF_lo: fore(false),
      outil: { parent: 'armF_lo', at: [4, 96], noRivet: true, seed: 2310, base: '#8a6038',
        pts: (p) => (p.tenu === 'pelle' ? SHAFT : p.tenu === 'crochet' ? CROCHET_M : OFFP),
        paint: () => { strokePts([[-2, -170], [-2, 130]], 'rgba(255,220,170,0.35)', 1.6); hatch(null, 1.5, 4, 0.25); },
        extra: (p) => {
          if (p.tenu === 'pelle') {
            piece(PELLE, '#5d5f63', () => { strokePts([[-30, 142], [-31, 194], [0, 213], [31, 194]], 'rgba(220,220,225,0.5)', 1.6); strokePts([[0, 128], [0, 200]], 'rgba(20,20,24,0.5)', 1.3); hatch(null, 0.4, 3.6, 0.25); }, { seed: 2311 });
            const k = clamp(p.charge || 0); if (k > 0.02) { item('epluchure', -8, 170, 0.2, 0.7 * k, 2330); if (k > 0.5) item('tesson', 12, 182, -0.3, 0.6, 2331); }
          } else if (p.tenu === 'crochet') piece(CROCHET_F, CF.fer, () => strokePts([[-1, 34], [-1, 92]], 'rgba(220,220,225,0.45)', 1), { seed: 2313 });
        } },
      doigtsF: { parent: 'armF_lo', at: [4, 96], noRivet: true, seed: 2314, base: CF.peau, pts: (p) => (p.tenu && p.tenu !== 'rien' ? DOIGTS : OFFP), paint: doigtsPaint },
      doigtsB: { parent: 'armB_lo', at: [4, 96], noRivet: true, seed: 2315, base: CF.peauD, pts: (p) => (p.deuxMains && p.tenu === 'pelle' ? DOIGTS : OFFP), paint: doigtsPaint },
    };
    return { hipY: -238, parts, handLen: 96, rod: { part: 'torso', at: [-22, 18] },
      order: ['armB_up', 'armB_lo', 'legB', 'legF', 'hotte', 'head', 'casquette', 'torso', 'armF_up', 'armF_lo', 'outil', 'doigtsF', 'doigtsB'] };
  }
  CH.chiffonnier = mkChiffonnier();
  POU.manche = (r, u) => r.w('outil', 0, lerp(-170, 128, clamp(u)));

  // =====================================================================
  // RATS — POU.rat(t,x,y,s,o) : gris-brun, long museau, oreille rose, gros œil rieur, queue qui ondule ; trottinent (o.trot) ; croûton ou arête dans la gueule
  // =====================================================================
  const RT = { poil: '#6b625a', poilD: '#554d46', ventre: '#9a8f84', rose: '#d9aaa0', queue: '#a08a80' };
  const ratLeg = (far) => ({ pts: [[-4, -2], [4, -2], [3, 10], [7, 16, 1], [-4, 16, 1], [-3, 8]], base: far ? RT.poilD : RT.poil, noRivet: true });
  CH.rat = { hipY: -22, handLen: 20, rod: null, parts: {
    corps: { parent: null, at: [0, 0], pts: [[-34, -2], [-30, -14], [-16, -21], [2, -20], [16, -14], [24, -6], [22, 4], [8, 10], [-14, 12], [-30, 8]], base: RT.poil, seed: 2401,
      paint: () => { fillPts([[-26, 6, 1], [16, 2, 1], [12, 10, 1], [-14, 13, 1]], RT.ventre); hatch(null, 0.6, 3, 0.3); strokePts([[-20, -16], [-6, -19], [8, -16]], 'rgba(200,190,180,0.35)', 1.2); } },
    queue: { parent: 'corps', at: [-32, 2], seed: 2402, noRivet: true, base: RT.queue,
      pts: (p) => { const t = p.t || 0, l = []; for (let i = 0; i <= 12; i++) l.push([-i * 7, 1 + i * 0.6 + Math.sin(t * 6 - i * 0.6) * i * 0.7 - (i > 8 ? (i - 8) * 1.5 : 0)]); return ribbon(l, 6, 1.6); },
      paint: () => { for (let x = -4; x > -70; x -= 6) strokePts([[x, -3], [x, 5]], 'rgba(90,60,55,0.35)', 0.8); } },
    legRF: Object.assign({ parent: 'corps', at: [-20, 6], seed: 2403 }, ratLeg(true)),
    legFF: Object.assign({ parent: 'corps', at: [12, 4], seed: 2404 }, ratLeg(true)),
    legRN: Object.assign({ parent: 'corps', at: [-24, 7], seed: 2405 }, ratLeg(false)),
    legFN: Object.assign({ parent: 'corps', at: [8, 5], seed: 2406 }, ratLeg(false)),
    tete: { parent: 'corps', at: [18, -8], pts: [[-8, -8], [4, -12], [16, -9], [36, -1, 1], [32, 3], [14, 6], [-2, 7], [-9, 0]], base: RT.poil, seed: 2407, noRivet: true,
      paint: () => { dot(35, -0.5, 2.6, '#c98a86'); dot(9, -5, 3.6, '#f1ebe0'); dot(10, -5, 2.2, '#1d1712'); dot(9, -6.2, 0.8, '#fff'); strokePts([[4, -9], [12, -10]], 'rgba(30,20,15,0.6)', 1); hatch(null, 0.5, 3, 0.2); },
      extra: () => { for (const [a, b] of [[[31, 0], [46, -4]], [[31, 1], [46, 4]], [[30, 0], [43, -8]]]) strokePts([a, b], 'rgba(40,30,25,0.6)', 0.8); } },
    oreille: { parent: 'tete', at: [0, -10], pts: ell(0, -4, 5, 6, 10), base: RT.poil, seed: 2408, noRivet: true, paint: () => fillPts(ell(0.5, -3.6, 3, 3.8, 10), RT.rose) },
    objet: { parent: 'tete', at: [33, 3], noRivet: true, seed: 2409, base: '#000', pts: OFFP,
      extra: (p) => { if (p.tient === 'croute') item('croute', 6, 2, 0.2, 1, 2410); else if (p.tient === 'arete') item('arete', 4, 2, 0.05, 0.7, 2411); } },
  }, order: ['queue', 'legRF', 'legFF', 'corps', 'legRN', 'legFN', 'tete', 'oreille', 'objet'] };
  POU.rat = function (t, x, y, s, o) {
    o = o || {}; s = s == null ? 1 : s;
    const tr_ = o.trot == null ? 1 : clamp(o.trot), ph = o.ph || 0, f = t * 12 + ph * TAU, sw = Math.sin(f) * 0.75 * tr_;
    const idle = 1 - tr_;
    const pose = { t: t + ph, tient: o.tient || 'rien', dy: -Math.abs(Math.sin(f)) * 3.5 * tr_ + idle * Math.sin(t * 2.6 + ph) * 0.6, tilt: 0.05 * Math.sin(f * 2) * tr_,
      ang: { legFN: sw, legRF: sw * 0.9, legFF: -sw, legRN: -sw * 0.9, tete: 0.08 * Math.sin(f) * tr_ + idle * (0.1 * Math.sin(t * 5 + ph) - 0.05), oreille: 0.15 * Math.sin(t * 4 + ph) } };
    return M.puppet(CH.rat, pose, x, y, s, { dir: o.dir || 1, rod: false, slot: y + 4 * s, floorShadow: o.floorShadow !== false, cast: o.cast, alpha: o.alpha });
  };

  // =====================================================================
  // LA BOÎTE POUBELLE 1883 — POU.boite : bois sombre cerclé de fer, couvercle à charnière arrière (rivet laiton) qui se comporte comme un chapeau
  // repère : (0,0) = milieu du bas ; face avant vers +x ; bord du haut y -121 ; ouverture vue légèrement de dessus (fond sombre jusqu'à y -133)
  // =====================================================================
  const BX = { bois: '#6e5236', boisD: '#57402a', boisL: '#8a6a48', fer: '#3f3e42', ferL: '#77767c', int: '#1e1712' };
  const BANDES = { vert: '#4f6b45', ocre: '#b0812f', bleu: '#4a5f7a' };
  const teinte = (b) => { const c = BANDES[b] || (typeof b === 'string' && b[0] === '#' ? b : null); return c ? { corps: c, couv: M.mixc(c, '#1a120c', 0.3), clair: M.mixc(c, '#f0e6d0', 0.18) } : null; };
  POU.BOITE = { w: 140, h: 121, hinge: [-72, -128] };
  const BOX_BODY = [[-70, -121, 1], [70, -121, 1], [70, -6, 1], [62, -6, 1], [62, 0, 1], [44, 0, 1], [44, -6, 1], [-44, -6, 1], [-44, 0, 1], [-62, 0, 1], [-62, -6, 1], [-70, -6, 1]];
  const BOX_LID = [[-2, -6, 1], [62, -6, 1], [64, -13], [84, -13], [86, -6, 1], [148, -6, 1], [149, 9, 1], [-3, 9, 1]];
  const CONTENUS = {
    putrescible: [['chou', -28, -126, -0.3, 1], ['trognon', 4, -138, 0.12, 1], ['epluchure', 32, -128, 0, 1]],
    papiers: [['papier', -30, -130, 0, 1], ['feuille', 2, -140, 0.15, 1], ['papier', 32, -128, 0.8, 0.9]],
    verre: [['bouteille', -28, -142, -0.2, 1], ['assiette', 8, -130, 0.3, 1], ['huitre', 36, -128, 0, 1]],
    tout: [['trognon', -40, -132, -0.2, 0.9], ['bouteille', -12, -144, -0.12, 1], ['papier', 18, -130, 0, 0.85], ['huitre', 42, -127, 0, 0.9]],
  };
  const lidM = (p) => p._lid || null;
  CH.boitePou = { hipY: 0, handLen: 50, rod: null, parts: {
    corps: { parent: null, at: [0, 0], pts: BOX_BODY, base: BX.bois, seed: 2501, paint: (p) => {
      const R = rng(2501), T = p.teinte;
      if (T) { fillPts([[-80, -130, 1], [80, -130, 1], [80, 4, 1], [-80, 4, 1]], T.corps); fillPts([[-70, -110, 1], [70, -110, 1], [70, -100, 1], [-70, -100, 1]], T.clair); }
      for (const y of [-84, -46]) strokePts([[-70, y], [70, y + 0.5]], 'rgba(25,14,6,0.7)', 1.6);
      for (let i = 0; i < 14; i++) { const y = -118 + R() * 108, x = -66 + R() * 110; strokePts([[x, y], [x + 18 + R() * 20, y + (R() - 0.5) * 2]], 'rgba(40,24,10,0.35)', 1); }
      for (const [x0, x1] of [[-64, -54], [54, 64]]) { fillPts([[x0, -121, 1], [x1, -121, 1], [x1, -6, 1], [x0, -6, 1]], BX.fer); for (const y of [-112, -66, -16]) { dot((x0 + x1) / 2, y, 2.1, BX.ferL); } }
      fillPts([[-70, -121, 1], [70, -121, 1], [70, -112, 1], [-70, -112, 1]], BX.fer); fillPts([[-70, -16, 1], [70, -16, 1], [70, -8, 1], [-70, -8, 1]], BX.fer);
      strokePts([[-70, -120], [70, -120]], 'rgba(220,220,225,0.35)', 1.2);
      strokePts(ep(0, -64, 11, 9, 10, 0, PI), BX.ferL, 2.6); dot(-11, -64, 2.4, BX.fer); dot(11, -64, 2.4, BX.fer);   // poignée de fer
      fillPts([[-70, -6, 1], [70, -6, 1], [70, 0, 1], [-70, 0, 1]], '#3a2a1a');
      hatch(null, 0.85, 4.4, 0.28); shade(70, 0, -70, 0, 0.28, [-74, -125, 74, 2]); } },
    fond: { parent: 'corps', at: [0, 0], pts: [[-66, -121, 1], [66, -121, 1], [60, -133, 1], [-60, -133, 1]], base: BX.int, seed: 2502, noRivet: true,
      paint: () => { fillPts([[-66, -125, 1], [66, -125, 1], [66, -121, 1], [-66, -121, 1]], 'rgba(120,100,80,0.35)'); } },
    contenu: { parent: 'corps', at: [0, 0], pts: OFFP, base: '#000', seed: 2503, noRivet: true,
      extra: (p) => {
        const L = CONTENUS[p.contenu]; const op = clamp(p.open || 0); if (!L || op < 0.02) return;
        const c = cx_(), rise = (1 - easeOut(clamp(op * 1.4))) * 60;
        c.save(); c.beginPath(); c.rect(-200, -400, 400, 279); c.clip();                     // rien sous le bord avant
        L.forEach((it, i) => item(it[0], it[1], it[2] + rise + Math.sin((p.t || 0) * 3 + i) * 0.6 * op, it[3], it[4], 2510 + i, p.huitre));
        c.restore();
        if (p.mouche && op > 0.3 && !M._sil()) {
          const t = p.t || 0, fx = 6 + 26 * Math.cos(t * 6.5), fy = -168 + 12 * Math.sin(t * 9.7);
          c.save(); c.globalAlpha = clamp((op - 0.3) * 3);
          for (const s of [-1, 1]) { c.beginPath(); c.ellipse(fx + s * 2, fy - 3 - Math.abs(Math.sin(t * 60)) * 2, 3.4, 1.8, s * 0.6, 0, TAU); c.fillStyle = 'rgba(235,235,240,0.75)'; c.fill(); }
          dot(fx, fy, 2.2, '#1a1616'); c.restore();
        } } },
    pendant: { parent: 'corps', at: [0, 0], seed: 2504, noRivet: true, base: '#5d6f86',
      pts: (p) => { const k = clamp(((p.open || 0) - 0.35) / 0.4); if (!(p.contenu === 'papiers' || p.contenu === 'tout') || k <= 0) return OFFP;
        return [[8, -123], [34, -123], [38, -123 + 13 * k], [30, -123 + 31 * k], [34, -123 + 43 * k], [22, -123 + 39 * k], [14, -123 + 27 * k], [10, -123 + 13 * k]]; },
      paint: () => { for (const x of [16, 24, 30]) strokePts([[x, -122], [x + 1, -86]], 'rgba(20,24,34,0.5)', 1.2); hatch(null, 0.8, 3.4, 0.3); } },
    couvercle: { parent: 'corps', at: [-72, -128], seed: 2505, base: BX.boisL,
      pts: (p) => { const m = lidM(p); return m ? xf(BOX_LID, m) : BOX_LID; },
      paint: (p) => { const c = cx_(); c.save(); const m = lidM(p); if (m) ctxM(m);
        fillPts([[62, -13, 1], [86, -13, 1], [86, -6, 1], [62, -6, 1]], BX.fer); strokePts([[64, -12], [84, -12]], 'rgba(220,220,225,0.4)', 1);
        if (p.teinte) { fillPts([[-6, -16, 1], [152, -16, 1], [152, 12, 1], [-6, 12, 1]], p.teinte.couv); fillPts([[62, -13, 1], [86, -13, 1], [86, -6, 1], [62, -6, 1]], BX.fer); fillPts([[-3, 1, 1], [149, 1, 1], [149, 4, 1], [-3, 4, 1]], 'rgba(10,8,6,0.35)'); }
        for (const x of [36, 110]) strokePts([[x, -6], [x, 9]], 'rgba(25,14,6,0.6)', 1.2);
        strokePts([[-2, -5], [148, -5]], 'rgba(255,235,200,0.35)', 1.2);
        hatch(null, 0.85, 4, 0.24); c.restore(); },
      extra: (p) => { if (!p.bicorne) return; const c = cx_(); c.save(); const m = lidM(p); if (m) ctxM(m); c.translate(76, -11); c.rotate(-0.04); bicorneDraw(p.t || 0, 0.66); c.restore(); } },
  }, order: ['fond', 'contenu', 'corps', 'pendant', 'couvercle'] };
  POU.boite = function (x, y, s, o) {
    o = o || {}; s = s == null ? 1 : s;
    const sal = clamp(o.salut || 0), ouv = clamp(o.ouvre || 0);
    const pose = { t: o.t || 0, contenu: o.contenu || 'vide', teinte: teinte(o.bande), bicorne: !!o.bicorne, huitre: o.huitre || 0, mouche: !!o.mouche,
      open: Math.max(ouv, sal * 0.6), ang: { couvercle: -ouv * 1.55 + (o.angle || 0) }, tilt: o.tilt || 0, dy: o.dy || 0, _lid: null };
    if (sal > 0) {
      const k1 = ease(clamp(sal / 0.55)), k2 = ease(clamp((sal - 0.45) / 0.55));
      const rot = -0.12 * k1 + 0.3 * k2;
      pose._lid = new DOMMatrix().translate(8 * k2, -54 * k1 + 8 * k2).translate(74, 2).rotate(rot * D).translate(-74, -2);
    }
    return M.puppet(CH.boitePou, pose, x, y, s, { dir: o.dir || 1, rod: false, slot: y + 6 * s, floorShadow: o.floorShadow !== false, cast: o.cast, alpha: o.alpha });
  };

  // =====================================================================
  // BACS MODERNES (plan 4) — POU.bac : anthracite, couvercle jaune ou vert, roue arrière, poignée ; ≈ 250 px à s=1 ; aucun logo
  // =====================================================================
  const BAC = { corps: '#3b3d42', corpsD: '#2c2e32', jaune: '#cfa53a', vert: '#5f8a50' };
  CH.bacPou = { hipY: 0, handLen: 50, rod: null, parts: {
    corps: { parent: null, at: [0, 0], pts: [[-58, -236, 1], [-76, -236, 1], [-76, -222, 1], [-58, -222], [-46, -16, 1], [50, -16, 1], [62, -236, 1]], base: BAC.corps, seed: 2601,
      paint: () => { for (const x of [-30, 0, 30]) strokePts([[x * 1.05, -226], [x * 0.85, -24]], 'rgba(10,10,12,0.5)', 1.6);
        fillPts([[-40, -200, 1], [44, -200, 1], [42, -60, 1], [-34, -60, 1]], 'rgba(255,255,255,0.05)'); strokePts([[-40, -200, 1], [44, -200, 1], [42, -60, 1], [-34, -60, 1], [-40, -200, 1]], 'rgba(10,10,12,0.45)', 1.2);
        fillPts([[-76, -236, 1], [-58, -236, 1], [-58, -222, 1], [-76, -222, 1]], '#26272b');
        hatch(null, 0.9, 4.4, 0.18, 1, '200,200,210'); shade(62, 0, -60, 0, 0.3, [-80, -240, 66, -10]); } },
    roue: { parent: 'corps', at: [-40, -20], pts: ell(0, 0, 20, 20, 16), base: '#202124', seed: 2602, paint: () => { dot(0, 0, 9, '#55575d'); dot(0, 0, 3, '#202124'); } },
    couvercle: { parent: 'corps', at: [-62, -238], seed: 2603, base: BAC.jaune, pts: [[-4, -10, 1], [128, -10, 1], [134, -4, 1], [136, 22, 1], [126, 22, 1], [124, 6, 1], [-4, 6, 1]],
      paint: (p) => { fillPts([[-6, -12, 1], [140, -12, 1], [140, 24, 1], [-6, 24, 1]], p.couleur === 'vert' ? BAC.vert : BAC.jaune); strokePts([[-2, -7], [126, -7]], 'rgba(255,255,255,0.35)', 1.4); strokePts([[-4, 5], [124, 5]], 'rgba(0,0,0,0.3)', 1.2); hatch(null, 0.9, 4, 0.2); } },
  }, order: ['corps', 'roue', 'couvercle'] };
  POU.BAC = { h: 250, w: 140 };
  POU.bac = function (x, y, s, o) {
    o = o || {}; s = s == null ? 1 : s;
    return M.puppet(CH.bacPou, { couleur: o.couleur || 'jaune', ang: { couvercle: -clamp(o.ouvre || 0) * 1.6 }, tilt: o.tilt || 0, dy: o.dy || 0 }, x, y, s,
      { dir: o.dir || 1, rod: false, slot: y + 6 * s, floorShadow: o.floorShadow !== false, cast: o.cast, alpha: o.alpha });
  };

  // =====================================================================
  // YAOURT + MAIN MODERNE — pot blanc à opercule alu (sans texte) ; main + manche de sweat bleu-gris qui descend des cintres sur un fil, tient le pot par son corps
  // =====================================================================
  const YA_POT = [[-17, -40, 1], [17, -40, 1], [13, 0, 1], [-13, 0, 1]];
  const potPart = (parent, at) => ({ parent, at, noRivet: true, seed: 2701, base: '#f1eee6', pts: (p) => (p.pot === false ? OFFP : YA_POT),
    paint: () => { fillPts([[-18, -40, 1], [18, -40, 1], [17, -34, 1], [-17, -34, 1]], '#dcd7cc'); shade(14, 0, -14, 0, 0.3, [-20, -44, 20, 2]); strokePts([[-8, -32], [-6, -4]], 'rgba(255,255,255,0.8)', 2.2); } });
  const operPart = (parent, at) => ({ parent, at, noRivet: true, seed: 2702, base: '#c9ccd1', pts: (p) => (p.pot === false ? OFFP : ell(0, -41, 18.5, 4.5, 14)),
    paint: () => { strokePts([[-12, -42], [6, -43]], 'rgba(255,255,255,0.8)', 1.4); strokePts([[-4, -39], [12, -40]], 'rgba(120,124,130,0.6)', 1); } });
  CH.yaourtPou = { hipY: 0, handLen: 20, rod: null, parts: { pot: potPart(null, [0, 0]), opercule: operPart('pot', [0, 0]) }, order: ['pot', 'opercule'] };
  POU.yaourt = function (x, y, s, o) { o = o || {}; return M.puppet(CH.yaourtPou, { tilt: o.rot || 0 }, x, y, s == null ? 1 : s, { rod: false, floorShadow: !!o.floorShadow, cast: o.cast, dir: o.dir || 1 }); };
  const SW = { sweat: '#6f7d8c', sweatD: '#58646f', peau: '#e0b896', peauD: '#c49a78' };
  CH.mainPou = { hipY: 0, handLen: 20, rod: null, parts: {
    manche: { parent: null, at: [0, 0], seed: 2703, base: SW.sweat, pts: [[-70, -250, 1], [-48, -258], [-18, -255], [2, -246, 1], [-6, -180], [-10, -102, 1], [-56, -102, 1], [-62, -180]],
      paint: () => {
        for (const [a, b, c] of [[[-64, -220], [-40, -204], [-10, -216]], [[-60, -176], [-38, -164], [-10, -174]], [[-58, -138], [-34, -128], [-10, -136]]]) strokePts([a, b, c], 'rgba(30,36,44,0.4)', 1.6);
        strokePts([[-26, -240], [-22, -120]], 'rgba(255,255,255,0.16)', 4);
        fillPts([[-72, -260, 1], [4, -260, 1], [4, -244, 1], [-72, -244, 1]], SW.sweatD); strokePts([[-70, -246], [2, -246]], 'rgba(255,255,255,0.25)', 1.2);
        hatch(null, 1.4, 5, 0.15); shade(4, 0, -64, 0, 0.25, [-80, -264, 10, -96]); } },
    poignet: { parent: 'manche', at: [-33, -102], seed: 2707, base: SW.sweatD, pts: [[-26, -4, 1], [24, -4, 1], [22, 18, 1], [-24, 18, 1]],
      paint: () => { for (let x = -24; x < 24; x += 4) strokePts([[x, -3], [x, 17]], 'rgba(20,26,34,0.55)', 1); } },
    pouce: { parent: 'manche', at: [0, 0], noRivet: true, seed: 2706, base: SW.peauD, pts: [[12, -44], [20, -48], [24, -40], [20, -32], [14, -34]] },
    paume: { parent: 'manche', at: [-30, -88], seed: 2704, base: SW.peau, pts: tr([[-50, -92], [-16, -92], [-4, -76], [-4, -56], [-10, -36], [-28, -30], [-44, -40], [-50, -64]], 30, 88),
      paint: () => { strokePts([[-6, 10], [2, 44]], 'rgba(120,70,50,0.35)', 1.2); strokePts([[-14, 14], [-8, 50]], 'rgba(120,70,50,0.25)', 1); hatch(null, 0.9, 4, 0.16); } },
    pot: potPart('manche', [0, 0]),
    opercule: operPart('manche', [0, 0]),
    doigts: { parent: 'manche', at: [0, 0], noRivet: true, seed: 2705, base: SW.peau,
      pts: [[-20, -38], [6, -37], [13, -35], [16, -31, 1], [12, -28], [15, -24, 1], [11, -21], [14, -17, 1], [10, -14], [12, -10, 1], [7, -7], [-14, -8], [-22, -20]],
      paint: () => { for (const y of [-28, -21, -14]) strokePts([[-14, y], [11, y - 1]], 'rgba(120,70,50,0.5)', 1.1); for (const [x, y] of [[13, -32], [12, -25], [11, -18], [9, -11]]) dot(x - 1, y, 1.4, 'rgba(240,215,200,0.7)'); hatch(null, 0.9, 3.6, 0.14); } },
  }, order: ['manche', 'pouce', 'paume', 'pot', 'opercule', 'doigts', 'poignet'] };
  POU.mainModerne = function (x, y, s, o) {
    o = o || {}; s = s == null ? 1 : s; const c = cx_(), rot = o.rot || 0, ax = x - 33 * s, py = y - 256 * s;
    c.save(); c.translate(ax, py); c.rotate(rot); c.translate(-ax, -py);
    if (o.fil !== false) { c.save(); c.strokeStyle = 'rgba(20,15,10,0.7)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(ax, py + 4); c.lineTo(ax, py - 2000); c.stroke(); c.restore(); }
    const r = M.puppet(CH.mainPou, { pot: o.pot !== false }, x, y, s, { rod: false, floorShadow: false, cast: o.cast, dir: o.dir || 1 });
    if (!M._sil()) { c.save(); c.setTransform(r.mats.manche); M.rivet(-33, -252, 3.4); c.restore(); }
    c.restore(); return r;
  };

  // =====================================================================
  // PUPITRE DU PRÉFET (acajou, encrier + plume d'oie, roulettes de théâtre), ARRÊTÉ (lignes ondulées + cachet rouge), ROULEAU (« facture » qui se déroule)
  // =====================================================================
  const AC = { acajou: '#7a3b26', acajouD: '#5c2a1a', acajouL: '#9a5236', cuir: '#3f5a45', laiton: '#b8913f' };
  POU.PUPITRE = { h: 310, w: 280, feuille: [[-91, -256], [59, -256], [63, -300], [-87, -300]] };   // coins de la feuille (repère du pupitre, pieds en 0,0)
  // paraphe : 3 boucles, u 0..1 ; (x0,y0) départ, longueur l
  function paraphePts(x0, y0, l, u, n) {
    const out = []; n = n || 40;
    for (let i = 0; i <= n * u; i++) { const v = i / n; if (v < 0.75) { const w = v / 0.75, a = w * PI * 6; out.push([x0 + w * l * 0.55 + Math.sin(a) * 11, y0 - Math.cos(a) * 11 + 11 - w * 6]); } else { const w = (v - 0.75) / 0.25; out.push([x0 + l * 0.55 + 6 - w * l * 0.9, y0 + 8 + Math.sin(w * PI) * 4]); } }
    return out;
  }
  function cachet(x, y, r, k) {
    if (k < 0.02) return; const rr = r * (0.4 + 0.6 * M.spring(k * 0.6, 0.45, 14));
    const pts = []; for (let i = 0; i < 14; i++) { const a = i / 14 * TAU, w = rr * (0.9 + 0.12 * Math.sin(i * 2.7)); pts.push([x + Math.cos(a) * w, y + Math.sin(a) * w]); }
    piece(pts, '#9c2a24', () => { strokePts(ep(x, y, rr * 0.62, rr * 0.62, 18, 0, TAU), 'rgba(60,8,6,0.6)', 1.4); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; strokePts([[x + Math.cos(a) * rr * 0.2, y + Math.sin(a) * rr * 0.2], [x + Math.cos(a) * rr * 0.45, y + Math.sin(a) * rr * 0.45]], 'rgba(60,8,6,0.55)', 1.2); } dot(x - rr * 0.3, y - rr * 0.35, rr * 0.18, 'rgba(255,200,180,0.4)'); }, { seed: 2801 });
  }
  function feuilleArrete(x0, y0, x1, y1, signe, cach) {                     // rectangle de face
    lignes(x0 + 12, y0 + 30, x1 - 12, y1 - 54, 8, 11);
    strokePts([[x0 + 30, y0 + 16], [x1 - 30, y0 + 16]], 'rgba(90,86,80,0.75)', 2.4);           // titre = trait épais
    if (signe > 0.01) strokePts(paraphePts(x1 - 76, y1 - 26, 58, clamp(signe)), '#2a2230', 1.8);
    cachet(x0 + 32, y1 - 30, 16, cach || 0);
  }
  CH.pupitrePou = { hipY: 0, handLen: 50, rod: null, parts: {
    corps: { parent: null, at: [0, 0], seed: 2802, base: AC.acajou, pts: [[-128, -250, 1], [128, -250, 1], [128, -40, 1], [136, -40, 1], [136, -22, 1], [-136, -22, 1], [-136, -40, 1], [-128, -40, 1]],
      paint: () => {
        for (const [a, b] of [[-112, -8], [8, 112]]) { fillPts([[a, -228, 1], [b, -228, 1], [b, -60, 1], [a, -60, 1]], AC.acajouL); strokePts([[a, -228, 1], [b, -228, 1], [b, -60, 1], [a, -60, 1], [a, -228, 1]], 'rgba(30,10,4,0.6)', 1.6); strokePts([[a + 6, -222], [b - 6, -222]], 'rgba(255,220,180,0.3)', 1.2); }
        dot(0, -150, 3.4, AC.laiton); fillPts([[-1.5, -150, 1], [1.5, -150, 1], [1, -142, 1], [-1, -142, 1]], '#1a0c06');
        fillPts([[-136, -40, 1], [136, -40, 1], [136, -22, 1], [-136, -22, 1]], AC.acajouD);
        const R = rng(2802); for (let i = 0; i < 30; i++) { const x = -124 + R() * 240, y = -246 + R() * 200; strokePts([[x, y], [x + 2, y + 14 + R() * 20]], 'rgba(40,12,4,0.3)', 1); }
        hatch(null, 1.4, 4.6, 0.2); shade(128, 0, -128, 0, 0.26, [-140, -254, 140, -18]); },
      extra: () => { for (const wx of [-104, 104]) piece(ell(wx, -12, 12, 12, 14), '#2c2a2e', () => { dot(wx, -12, 5, AC.laiton); dot(wx - 1, -13, 1.6, '#f3dc9a'); }, { seed: 2803 + wx }); } },
    plateau: { parent: 'corps', at: [0, -250], seed: 2804, base: AC.acajouL, pts: [[-144, 2, 1], [144, 2, 1], [134, -58, 1], [-134, -58, 1]],
      paint: () => { fillPts([[-118, -6, 1], [118, -6, 1], [110, -50, 1], [-110, -50, 1]], AC.cuir); strokePts([[-112, -9, 1], [112, -9, 1], [105, -47, 1], [-105, -47, 1], [-112, -9, 1]], 'rgba(217,189,114,0.7)', 1.2);
        fillPts([[-146, 0, 1], [146, 0, 1], [146, 4, 1], [-146, 4, 1]], AC.acajouD); hatch(null, 0.2, 4, 0.18); },
      extra: (p) => {
        piece([[94, -36], [116, -36], [118, -22, 1], [92, -22, 1]], '#2b2a30', () => { fillPts([[96, -40, 1], [114, -40, 1], [114, -34, 1], [96, -34, 1]], AC.laiton); strokePts([[98, -30], [100, -24]], 'rgba(255,255,255,0.4)', 1.2); }, { seed: 2805 });
        if (p.plume !== false) { const c = cx_(); c.save(); c.translate(104, -36); c.rotate(0.42); piece(PF_PLUME.map((q) => [q[0] * 0.95, q[1] * 0.95 - 34, q[2]]), '#ece6d6', () => { strokePts([[0, 0], [0, -142]], 'rgba(150,140,120,0.8)', 1.2); }, { seed: 2806 }); c.restore(); } } },
    feuille: { parent: 'plateau', at: [0, 0], seed: 2807, noRivet: true, base: '#ece5d2', pts: (p) => (p.arrete === false ? OFFP : [[-91, -6, 1], [59, -6, 1], [63, -50, 1], [-87, -50, 1]]),
      paint: (p) => { const c = cx_(); c.save(); c.transform(1, 0, -0.02, 0.22, -1, -6); feuilleArrete(-90, -200, 60, 0, p.signe || 0, 0); c.restore(); },
      extra: (p) => { if (p.arrete === false) return; const c = cx_(); c.save(); c.translate(-58, -13); c.scale(1, 0.55); cachet(0, 0, 14, p.cachet || 0); c.restore(); } },
  }, order: ['corps', 'plateau', 'feuille'] };
  POU.pupitre = function (x, y, s, o) {
    o = o || {}; s = s == null ? 1 : s;
    return M.puppet(CH.pupitrePou, { plume: o.plume, arrete: o.arrete, signe: o.signe || 0, cachet: o.cachet || 0, dy: o.dy || 0 }, x, y, s,
      { dir: o.dir || 1, rod: false, slot: y + 6 * s, floorShadow: o.floorShadow !== false, cast: o.cast, alpha: o.alpha });
  };
  // point écran de la plume pendant le paraphe (signe 0..1), même transformation de contexte que l'appel à POU.pupitre
  POU.paraphePt = function (x, y, s, signe, dir) {
    s = s == null ? 1 : s; dir = dir || 1;
    const L = paraphePts(-16, -26, 58, 1, 40), q = L[Math.round(clamp(signe) * 40)];
    // repère feuille (plateau) : x' = x - 0.02·y - 1 ; y' = 0.22·y - 6 ; plateau en (0,-250)
    const fx = q[0] - 0.02 * q[1] - 1, fy = 0.22 * q[1] - 6 - 250;
    return [x + fx * s * dir, y + fy * s];
  };
  CH.arretePou = { hipY: 0, handLen: 50, rod: null, parts: {
    feuille: { parent: null, at: [0, 0], seed: 2810, base: '#ece5d2', pts: [[-75, -200, 1], [75, -200, 1], [75, 0, 1], [-75, 0, 1]],
      paint: (p) => { feuilleArrete(-75, -200, 75, 0, p.signe || 0, 0); hatch(null, 0.9, 5, 0.08); },
      extra: (p) => cachet(-43, -30, 16, p.cachet || 0) } }, order: ['feuille'] };
  POU.arrete = function (x, y, s, o) { o = o || {}; return M.puppet(CH.arretePou, { signe: o.signe || 0, cachet: o.cachet || 0, tilt: o.rot || 0 }, x, y, s == null ? 1 : s, { rod: false, floorShadow: false, cast: o.cast, dir: o.dir || 1 }); };

  // ROULEAU : bande de papier ivoire à lignes ondulées ; le rouleau descend, touche le plancher et roule dessus
  CH.rouleauPou = { hipY: 0, handLen: 50, rod: null, parts: {
    bande: { parent: null, at: [0, 0], seed: 2820, base: '#ece5d2', pts: (p) => (p.Lv > 2 ? p._band : OFFP),
      paint: (p) => { const c = cx_(); for (let y = 16; y < p.Lv - 8; y += 11) { const sw = p._sw(y); strokePts([[-24 + sw, y], [-6 + sw, y + 0.6], [10 + sw, y - 0.5], [24 + sw, y]], 'rgba(90,86,80,0.55)', 1.2); }
        if (p.deroule > 0.97) strokePts([[-24, p.Lv - 14], [24, p.Lv - 14]], 'rgba(160,40,30,0.7)', 2);
        hatch(null, 0.9, 5, 0.08); shade(32, 0, -32, 0, 0.18, [-40, -10, 40, p.Lv + 10]); void c; } },
    sol: { parent: null, at: [0, 0], seed: 2821, base: '#e4dcc6', pts: (p) => (p.Lh > 2 ? [[-28, p.Lv - 4, 1], [28, p.Lv - 4, 1], [28 + p.vers * p.Lh, p.Lv + 4, 1], [-28 + p.vers * p.Lh, p.Lv + 14, 1]].map((q) => [q[0], q[1], 1]) : OFFP),
      paint: (p) => { for (let i = 1; i < p.Lh / 14; i++) { const x = p.vers * i * 14; strokePts([[x - 20, p.Lv + 2], [x + 20, p.Lv + 8]], 'rgba(90,86,80,0.4)', 1); } } },
    roul: { parent: null, at: [0, 0], seed: 2822, base: '#ddd3b8', pts: (p) => tr([[-37, -p.r], [37, -p.r], [41, 0], [37, p.r], [-37, p.r], [-41, 0]], p.rx, p.ry),
      paint: (p) => { strokePts(ep(p.rx + 38, p.ry, 3, p.r * 0.85, 10, -PI / 2, PI / 2), 'rgba(120,100,70,0.6)', 1.1); strokePts(ep(p.rx + 38, p.ry, 1.5, p.r * 0.45, 8, -PI / 2, PI / 2), 'rgba(120,100,70,0.5)', 1);
        for (let k = 0; k < 3; k++) { const a = p.spin + k * 2.1, yy = p.ry + Math.sin(a) * p.r * 0.8; strokePts([[p.rx - 34, yy], [p.rx + 34, yy]], 'rgba(120,100,70,0.35)', 1); }
        shade(p.rx, p.ry - p.r, p.rx, p.ry + p.r, 0.3, [p.rx - 44, p.ry - 20, p.rx + 44, p.ry + 20]); } },
    haut: { parent: null, at: [0, 0], seed: 2823, base: '#e4dcc6', pts: [[-36, -6], [36, -6], [39, 0], [36, 6], [-36, 6], [-39, 0]],
      paint: () => strokePts([[-36, 2], [36, 2]], 'rgba(120,100,70,0.4)', 1) },
  }, order: ['bande', 'sol', 'roul', 'haut'] };
  POU.rouleau = function (x, y, s, o) {
    o = o || {}; s = s == null ? 1 : s;
    const d = clamp(o.deroule || 0), L = d * (o.longueur || 620), r = 13 * (1 - 0.4 * d), vers = o.vers || 1, t = o.t || 0;
    const solL = o.sol != null ? (o.sol - y) / s : 1e9;
    let Lv = L, Lh = 0; if (L + 2 * r > solL) { Lv = Math.max(0, solL - 2); Lh = L - Lv; }
    const sw = (yy) => Math.sin(t * 5 + yy * 0.02) * 3 * (yy / Math.max(1, Lv)) * (Lh > 0 ? 0.3 : 1);
    const band = []; for (let i = 0; i <= 10; i++) { const yy = Lv * i / 10; band.push([-32 + sw(yy), yy]); } for (let i = 10; i >= 0; i--) { const yy = Lv * i / 10; band.push([32 + sw(yy), yy]); }
    const pose = { Lv, Lh, vers, r, deroule: d, _band: band, _sw: sw, rx: Lh > 0 ? vers * Lh : sw(Lv), ry: Lh > 0 ? Lv - r + 4 : Lv + r - 2, spin: L * 0.08 };
    return M.puppet(CH.rouleauPou, pose, x, y, s, { rod: false, floorShadow: false, cast: o.cast, dir: o.dir || 1 });
  };

  // =====================================================================
  // JOURNAL — grand journal ouvert, colonnes de lignes grises ; au centre une caricature : boîte coiffée d'un bicorne à plumes (dessin à l'encre)
  // =====================================================================
  // caricature de presse (encre) : la tête du préfet (barbe collier, moustache, bicorne à plumes) sort d'une boîte à ordures, couvercle de travers sur le bicorne
  function caricature(k) {                                                    // centré en (0,0), cadre 150 × 124 · k
    const c = cx_(); if (M._sil()) return; c.save(); c.scale(k, k);
    const ink = 'rgba(32,24,24,0.95)', inkL = 'rgba(32,24,24,0.55)';
    const poly = (pts, fill, lw) => { if (fill) fillPts(pts, fill, 0, 0); strokePts(pts.concat([pts[0]]), ink, lw || 1.6); };
    const hach = (x0, y0, x1, y1, sp, a) => { c.save(); c.beginPath(); c.rect(x0, y0, x1 - x0, y1 - y0); c.clip(); c.strokeStyle = `rgba(32,24,24,${a || 0.45})`; c.lineWidth = 0.9 * M._lw(); c.beginPath(); for (let x = x0 - (y1 - y0); x < x1; x += sp) { c.moveTo(x, y1); c.lineTo(x + (y1 - y0), y0); } c.stroke(); c.restore(); };
    fillPts([[-96, -72, 1], [96, -72, 1], [96, 72, 1], [-96, 72, 1]], '#f4eddb', 0, 0);
    c.save(); c.beginPath(); c.rect(-95, -71, 190, 142); c.clip(); c.translate(0, 6); c.scale(1.2, 1.2);
    // petits bras qui sortent des côtés (derrière la boîte)
    strokePts([[-34, 22], [-50, 14], [-58, 0]], ink, 3.2); strokePts([[-34, 22], [-50, 14], [-58, 0]], '#e9cdb0', 1.4);
    poly(ell(-59, -3, 5, 5, 8), '#efe6d6', 1.2);
    strokePts([[34, 24], [52, 18], [60, 4]], ink, 3.2); strokePts([[34, 24], [52, 18], [60, 4]], '#1f2a44', 1.4);
    poly([[56, 2], [62, -6], [66, -4], [64, 4], [60, 6]], '#efe6d6', 1.2);                                   // main gantée qui salue
    // tête de profil (regard vers la droite), grosse tête de caricature
    poly([[-22, 6], [-26, -14], [-22, -32], [-8, -40], [10, -39], [21, -31], [23, -25], [32, -26], [38, -19], [35, -12], [27, -11], [28, -6], [20, 4], [0, 8]], '#ecd1b3', 1.6);
    strokePts([[-12, -26], [-15, -20], [-12, -15]], ink, 1.3);                                               // oreille
    poly([[-18, -20], [-12, -12], [2, -8], [14, -10], [26, -8], [30, 0], [24, 12], [8, 16], [-10, 14], [-22, 4]], '#fbf8f0', 1.5);   // barbe collier
    for (const [x, y] of [[-12, -4], [-4, 4], [6, 8], [16, 4], [22, -2], [-14, 6], [2, -2], [12, -4]]) strokePts([[x, y], [x + 2, y + 3], [x, y + 5]], inkL, 0.9);
    poly([[33, -15], [27, -10], [17, -11], [14, -14], [20, -17], [27, -18]], '#fbf8f0', 1.3);                 // moustache
    strokePts([[6, -31], [16, -32]], ink, 2); dot(13, -26, 2.2, ink); strokePts([[18, -25], [22, -24]], inkL, 0.9);
    strokePts([[22, -8], [25, -7]], ink, 1.2);
    // bicorne à plumes blanches
    poly([[-38, -34], [-24, -48], [-2, -54], [22, -50], [40, -34], [2, -39]], '#26222a', 1.6);
    for (let i = 0; i <= 9; i++) { const u = i / 9, x = lerp(-34, 36, u), y = -36 - Math.sin(u * PI) * 17; poly(ell(x, y, 5.2, 3.8, 8), '#ffffff', 0.9); }
    dot(12, -42, 4.2, '#a3302c'); dot(12, -42, 2.6, '#f4eddb'); dot(12, -42, 1.3, '#3a4f7a');
    // couvercle posé de travers sur le bicorne
    c.save(); c.translate(4, -57); c.rotate(-0.22); poly([[-27, -4, 1], [27, -4, 1], [27, 5, 1], [-27, 5, 1]], '#b9965f', 1.6); strokePts([[-26, 0], [26, 0]], inkL, 0.8); c.restore();
    // boîte à ordures (devant le cou)
    poly([[-36, 6, 1], [36, 6, 1], [36, 60, 1], [-36, 60, 1]], '#c9ae82', 1.8);
    for (const y of [22, 40]) strokePts([[-36, y], [36, y]], ink, 1);
    for (const x of [-30, 30]) poly([[x - 3, 6, 1], [x + 3, 6, 1], [x + 3, 58, 1], [x - 3, 58, 1]], '#5a5658', 1);
    hach(10, 7, 36, 57, 3.2, 0.5);
    // arête qui dépasse à gauche, épluchure qui pend à droite
    strokePts([[-18, 8], [-34, -8], [-48, -22]], ink, 2.2);
    for (let i = 0; i < 5; i++) { const x = -22 - i * 5.5, y = 4 - i * 5.5; strokePts([[x - 7, y - 3], [x, y], [x + 3, y - 8]], ink, 1.3); }
    poly([[-48, -22], [-58, -26], [-52, -14]], '#fbf8f0', 1.3); poly([[-16, 10], [-12, 2], [-10, 12]], '#fbf8f0', 1.1);
    const pe = []; for (let i = 0; i <= 12; i++) { const a = i * 0.9; pe.push([28 + Math.cos(a) * 4 + i * 0.6, 6 + i * 2.2 + Math.sin(a) * 2]); }
    strokePts(pe, ink, 3.6); strokePts(pe, '#d08a40', 2);
    c.restore();
    // cadre double
    strokePts([[-96, -72, 1], [96, -72, 1], [96, 72, 1], [-96, 72, 1], [-96, -72, 1]], ink, 2.4); strokePts([[-91, -67, 1], [91, -67, 1], [91, 67, 1], [-91, 67, 1], [-91, -67, 1]], ink, 0.9);
    c.restore();
  }
  POU.caricature = caricature;
  CH.journalPou = { hipY: 0, handLen: 50, rod: null, parts: {
    page: { parent: null, at: [0, 0], seed: 2901, base: '#e9e2cf', pts: [[-150, -212, 1], [-2, -206], [0, -202, 1], [2, -206], [150, -212, 1], [152, 0, 1], [0, 4, 1], [-152, 0, 1]],
      paint: (p) => {
        const car = p.face !== 'dos', c = cx_();
        if (car) {                                                                                     // TITRE (exception voulue par l'utilisateur)
          if (!M._sil()) { c.save(); c.font = 'bold 31px "Liberation Serif", "DejaVu Serif", serif'; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillStyle = '#1e1a1c';
            const w = c.measureText('LE PETIT RÂLEUR').width; const k = Math.min(1, 270 / w); c.translate(0, -177); c.scale(k, 1); c.fillText('LE PETIT RÂLEUR', 0, 0); c.restore(); }
          strokePts([[-140, -170, 1], [140, -170, 1]], 'rgba(30,26,28,0.9)', 2.6); strokePts([[-140, -165, 1], [140, -165, 1]], 'rgba(30,26,28,0.9)', 1);
          for (let col = 0; col < 6; col++) {
            const x0 = -142 + col * 48, x1 = x0 + 42;
            if (x1 > -97 && x0 < 97) lignes(x0, -12, x1, -8, 7, 300 + col * 7);
            else { lignes(x0, -156, x1, -10, 7, 340 + col * 9); strokePts([[col ? x0 - 3 : x1 + 3, -158], [col ? x0 - 3 : x1 + 3, -8]], 'rgba(60,56,52,0.35)', 0.8); }
          }
          c.save(); c.translate(0, -86); caricature(1); c.restore();
        } else {
          for (const s of [-1, 1]) {
            strokePts([[s * 12, -194], [s * 140, -197]], 'rgba(40,36,34,0.85)', 3.2); strokePts([[s * 12, -188], [s * 140, -191]], 'rgba(40,36,34,0.7)', 1);
            for (let col = 0; col < 3; col++) { const x0 = s > 0 ? 12 + col * 44 : -142 + col * 44, x1 = x0 + 38; lignes(x0, -178, x1, -10, 7, 340 + col * 9 + s * 3); if (col) strokePts([[x0 - 3, -182], [x0 - 3, -8]], 'rgba(60,56,52,0.35)', 0.8); }
          }
          fillPts([[-130, -140, 1], [-62, -140, 1], [-62, -84, 1], [-130, -84, 1]], 'rgba(110,104,96,0.45)');
          const g = c.createLinearGradient(-30, 0, 30, 0); g.addColorStop(0, 'rgba(60,40,20,0)'); g.addColorStop(0.5, 'rgba(60,40,20,0.22)'); g.addColorStop(1, 'rgba(60,40,20,0)');
          if (!M._sil()) { c.fillStyle = g; c.fillRect(-30, -220, 60, 230); }
        }
        hatch(null, 0.9, 6, 0.06); } } }, order: ['page'] };
  POU.journal = function (x, y, s, o) { o = o || {}; return M.puppet(CH.journalPou, { face: o.face || 'caricature', tilt: o.rot || 0 }, x, y, s == null ? 1 : s, { rod: false, floorShadow: false, cast: o.cast, dir: o.dir || 1 }); };

  // =====================================================================
  // TAS D'ORDURES — POU.tas : monceau sombre + épluchures, chiffon, tesson, trognon, arête, feuille de chou, papier ; o.taille 0..1 ; 3 variantes
  // =====================================================================
  const MOUND = [[-110, 0, 1], [-102, -18], [-84, -38], [-56, -56], [-18, -68], [24, -66], [62, -52], [92, -30], [110, 0, 1]];
  function mkTas(v) {
    const R = rng(500 + v * 17), fl = v === 1 ? -1 : 1;
    let lay = [['chiffon', -82, -32, -0.4], ['chou', -50, -56, -0.3], ['trognon', -14, -80, 0.15], ['epluchure', 14, -70, 0], ['arete', 40, -62, -0.2], ['papier', 72, -44, 0], ['tesson', 92, -18, 0.4]];
    if (v === 2) lay = lay.filter((q, i) => i !== 1).concat([['bouteille', -40, -70, -0.6]]);
    const items = lay.map((q, i) => [q[0], q[1] * fl + (R() - 0.5) * 10, q[2] + (R() - 0.5) * 6, q[3] * fl + (R() - 0.5) * 0.3, 0.95 + R() * 0.25, 3000 + v * 30 + i]);
    return { hipY: 0, handLen: 50, rod: null, parts: { monceau: { parent: null, at: [0, 0], seed: 2950 + v, base: '#6f604e', pts: MOUND,
      paint: () => { const RR = rng(77 + v); for (let i = 0; i < 40; i++) dot(-100 + RR() * 200, -60 + RR() * 58, 1.5 + RR() * 3, `rgba(${RR() < 0.5 ? '40,30,20' : '170,150,120'},0.35)`); hatch(null, 0.8, 4, 0.3); shade(0, -70, 0, 0, 0.3, [-112, -72, 112, 2]); },
      extra: (p) => { for (const it of items) item(it[0], it[1], it[2], it[3] + Math.sin((p.t || 0) * 2.2 + it[5]) * 0.03, it[4], it[5]); } } }, order: ['monceau'] };
  }
  CH.tasPou = [mkTas(0), mkTas(1), mkTas(2)];
  POU.tas = function (x, y, s, o) {
    o = o || {}; const k = o.taille == null ? 1 : o.taille; if (k < 0.02) return null; s = (s == null ? 1 : s) * (0.2 + 0.8 * k);
    return M.puppet(CH.tasPou[(o.variante || 0) % 3], { t: o.t || 0 }, x, y, s, { rod: false, slot: y + 6 * s, floorShadow: o.floorShadow !== false, cast: o.cast, dir: o.dir || 1, alpha: o.alpha });
  };
  // bicorne seul
  CH.bicornePou = { hipY: 0, handLen: 50, rod: null, parts: { bic: { parent: null, at: [0, 0], seed: 2111, base: PF.feutre, pts: PF_BIC, paint: bicFeltPaint, extra: (p) => plumesPiece(p.t || 0, 1) } }, order: ['bic'] };
  POU.bicorne = function (x, y, s, rot, o) { o = o || {}; return M.puppet(CH.bicornePou, { t: o.t || 0, ang: { bic: rot || 0 } }, x, y, s == null ? 1 : s, { rod: false, floorShadow: false, cast: o.cast, dir: o.dir || 1 }); };

  // =====================================================================
  // DÉCORS PRÉ-RENDUS — POU.init() (dans S.init) → POU.K
  // =====================================================================
  POU.RUE = { portes: [210, 540, 870], cinq: [210, 375, 540, 705, 870], corniches: [], w: 1200 };
  const RUE_H = { pave: 34, rez: 360, f2: [-388, -466], f3: [-494, -568], f4: [-594, -668], f5: [-698, -764], corn: -776, toit: -884 };
  POU.RUE.corniches = [M.ST.back - 372, M.ST.back - 780];
  function fenetre(x, cx, yb, yt, w) {                                       // yb = bas (appui), yt = haut
    fillPts([[cx - w / 2 - 7, yt - 6, 1], [cx + w / 2 + 7, yt - 6, 1], [cx + w / 2 + 7, yb + 4, 1], [cx - w / 2 - 7, yb + 4, 1]], '#e9dfc6');
    const g = x.createLinearGradient(cx - w / 2, yt, cx + w / 2, yb); g.addColorStop(0, '#3e4858'); g.addColorStop(0.5, '#59647a'); g.addColorStop(1, '#343c4a');
    x.fillStyle = g; x.fillRect(cx - w / 2, yt, w, yb - yt);
    x.fillStyle = 'rgba(220,225,235,0.18)'; x.beginPath(); x.moveTo(cx - w / 2, yb - 10); x.lineTo(cx - w / 2 + 14, yt); x.lineTo(cx - w / 2 + 24, yt); x.lineTo(cx - w / 2, yb - 2); x.fill();
    strokePts([[cx, yt], [cx, yb]], '#e9dfc6', 2.2); for (const f of [0.33, 0.66]) strokePts([[cx - w / 2, lerp(yt, yb, f)], [cx + w / 2, lerp(yt, yb, f)]], '#e9dfc6', 1.6);
    fillPts([[cx - w / 2 - 11, yt - 15, 1], [cx + w / 2 + 11, yt - 15, 1], [cx + w / 2 + 8, yt - 6, 1], [cx - w / 2 - 8, yt - 6, 1]], '#efe6cf');   // linteau
    x.fillStyle = 'rgba(60,45,30,0.3)'; x.fillRect(cx - w / 2 - 8, yt - 6, w + 16, 3);
    fillPts([[cx - w / 2 - 10, yb + 2, 1], [cx + w / 2 + 10, yb + 2, 1], [cx + w / 2 + 10, yb + 8, 1], [cx - w / 2 - 10, yb + 8, 1]], '#efe6cf');      // appui
  }
  function gardeCorps(x, x0, x1, ytop, ybot) {
    x.strokeStyle = '#1f1d20'; x.lineWidth = 2.6; x.beginPath(); x.moveTo(x0, ytop); x.lineTo(x1, ytop); x.moveTo(x0, ybot); x.lineTo(x1, ybot); x.stroke();
    x.lineWidth = 1.4; x.beginPath(); for (let xx = x0 + 3; xx < x1; xx += 6) { x.moveTo(xx, ytop); x.lineTo(xx, ybot); } x.stroke();
    x.lineWidth = 1.2; x.beginPath(); x.moveTo(x0, ybot - 5); x.lineTo(x1, ybot - 5); x.stroke();
  }
  function porteCochere(x, dc) {
    const y0 = -RUE_H.pave - 6, top = -262, r = 64;
    piece([[dc - 78, y0, 1], [dc + 78, y0, 1], [dc + 78, top], [dc + 74, top - 40], [dc + 50, top - 70], [dc, top - 80], [dc - 50, top - 70], [dc - 74, top - 40], [dc - 78, top]], '#e6dabe', () => {
      for (let i = 0; i <= 8; i++) { const a = PI + i / 8 * PI; strokePts([[dc + Math.cos(a) * r, top + Math.sin(a) * r], [dc + Math.cos(a) * (r + 16), top + Math.sin(a) * (r + 16)]], 'rgba(90,76,56,0.55)', 1.2); }
      fillPts([[dc - 9, top - r - 18, 1], [dc + 9, top - r - 18, 1], [dc + 7, top - r + 2, 1], [dc - 7, top - r + 2, 1]], '#efe6cf');
      hatch(null, 0.15, 5, 0.12); }, { seed: 3101 + dc, drop: false });
    const doorPts = [[dc - r, y0, 1], [dc + r, y0, 1], [dc + r, top]].concat(ep(dc, top, r, r, 12, 0, -PI).slice(1)).concat([[dc - r, top]]);
    piece(doorPts, '#36412f', () => {
      for (const s of [-1, 1]) for (const [a, b] of [[-250, -160], [-146, -56]]) { const u0 = Math.min(dc + s * 10, dc + s * 54), u1 = Math.max(dc + s * 10, dc + s * 54), q = [[u0, a, 1], [u1, a, 1], [u1, b, 1], [u0, b, 1]]; fillPts(q, '#44503b'); strokePts(q.concat([q[0]]), 'rgba(10,14,8,0.6)', 1.3); strokePts([[u0 + 2, a + 2], [u1 - 2, a + 2]], 'rgba(200,220,190,0.25)', 1); }
      strokePts([[dc, y0], [dc, top]], 'rgba(10,14,8,0.8)', 2);
      x.fillStyle = 'rgba(30,36,46,0.9)'; x.beginPath(); x.arc(dc, top, r - 8, PI, TAU); x.fill();
      x.strokeStyle = '#1b1c1f'; x.lineWidth = 2; x.beginPath(); for (let i = 1; i < 6; i++) { const a = PI + i / 6 * PI; x.moveTo(dc, top); x.lineTo(dc + Math.cos(a) * (r - 8), top + Math.sin(a) * (r - 8)); } x.stroke();
      strokePts([[dc - r, top], [dc + r, top]], '#2a2f24', 4);
      dot(dc - 8, -150, 3.2, '#b8913f'); dot(dc + 8, -150, 3.2, '#b8913f');
      hatch(null, 1.5, 4, 0.18); }, { seed: 3201 + dc });
  }
  function immeuble(x, x0, x1, col, cols, portes, seed) {
    const R = rng(seed), H = RUE_H;
    piece([[x0, -H.pave, 1], [x1, -H.pave, 1], [x1, H.corn - 10, 1], [x0, H.corn - 10, 1]], col, () => {
      for (let y = -H.pave - 26; y > -H.rez; y -= 26) { strokePts([[x0, y], [x1, y]], 'rgba(90,76,56,0.55)', 1.6); strokePts([[x0, y + 2], [x1, y + 2]], 'rgba(255,250,235,0.35)', 1); }
      for (let y = -H.rez - 22; y > H.corn; y -= 22) strokePts([[x0, y], [x1, y]], 'rgba(110,94,70,0.25)', 1);
      for (let y = -H.pave, r = 0; y > H.corn; y -= 22, r++) for (let xx = x0 + (r % 2) * 30 + R() * 10; xx < x1; xx += 60 + R() * 20) strokePts([[xx, y], [xx, y - 22]], 'rgba(110,94,70,0.18)', 1);
      for (const cx of cols) if (!portes.some((d) => Math.abs(d - cx) < 90)) {
        fillPts([[cx - 30, -92, 1], [cx + 30, -92, 1], [cx + 30, -272], [cx, -300], [cx - 30, -272]], '#e9dfc6');
        fillPts([[cx - 24, -96, 1], [cx + 24, -96, 1], [cx + 24, -268], [cx, -292], [cx - 24, -268]], '#3b3a3a');
        x.fillStyle = 'rgba(80,90,110,0.35)'; x.fillRect(cx - 20, -264, 40, 166);
        gardeCorps(x, cx - 24, cx + 24, -168, -98);
      }
      fillPts([[x0, -H.rez, 1], [x1, -H.rez, 1], [x1, -H.rez - 12, 1], [x0, -H.rez - 12, 1]], '#efe6cf'); x.fillStyle = 'rgba(60,45,30,0.3)'; x.fillRect(x0, -H.rez + 0, x1 - x0, 5);
      for (const [fl, k] of [[H.f2, 1], [H.f3, 0], [H.f4, 0], [H.f5, 2]]) for (const cx of cols) {
        fenetre(x, cx, fl[0], fl[1], 40);
        if (k === 0) gardeCorps(x, cx - 26, cx + 26, fl[0] - 26, fl[0] + 1);
      }
      for (const [y, h] of [[H.f2[0] + 2, 30], [H.f5[0] + 2, 24]]) { fillPts([[x0, y, 1], [x1, y, 1], [x1, y + 8, 1], [x0, y + 8, 1]], '#e3d8bf'); x.fillStyle = 'rgba(40,30,20,0.35)'; x.fillRect(x0, y + 8, x1 - x0, 6); gardeCorps(x, x0 + 4, x1 - 4, y - h, y); }
      fillPts([[x0, H.corn - 10, 1], [x1, H.corn - 10, 1], [x1, H.corn + 6, 1], [x0, H.corn + 6, 1]], '#efe6cf'); x.fillStyle = 'rgba(40,30,20,0.4)'; x.fillRect(x0, H.corn + 6, x1 - x0, 8);
      strokePts([[x0 + 1, -H.pave], [x0 + 1, H.corn]], 'rgba(60,50,40,0.5)', 2);
      hatch(null, 0.8, 5.5, 0.1); shade(x1, 0, x0, 0, 0.12, [x0, H.corn - 12, x1, 0]); }, { seed, drop: false });
    piece([[x0 - 6, H.corn - 8, 1], [x1 + 6, H.corn - 8, 1], [x1 - 22, H.toit, 1], [x0 + 22, H.toit, 1]], '#7d8996', () => {
      for (let xx = x0; xx < x1; xx += 14) strokePts([[xx, H.corn - 8], [xx + (xx - (x0 + x1) / 2) * -0.15, H.toit]], 'rgba(40,48,60,0.45)', 1.2);
      hatch(null, 0.5, 4.5, 0.15); shade(0, H.toit, 0, H.corn, 0.2, [x0 - 10, H.toit - 4, x1 + 10, H.corn]); }, { seed: seed + 1 });
    for (const cx of cols) piece([[cx - 20, H.corn - 14, 1], [cx + 20, H.corn - 14, 1], [cx + 20, -842], [cx, -858], [cx - 20, -842]], '#e6dbc1', () => {
      fillPts([[cx - 12, -832, 1], [cx + 12, -832, 1], [cx + 12, -794, 1], [cx - 12, -794, 1]], '#3e4858'); strokePts([[cx, -832], [cx, -794]], '#e9dfc6', 1.4);
      fillPts([[cx - 22, -842], [cx, -860], [cx + 22, -842], [cx + 22, -836], [cx, -852], [cx - 22, -836]], '#6c7684'); }, { seed: seed + 3 + cx });
    for (const cx of [x0 + 50, x1 - 60]) { piece([[cx - 26, H.toit + 4, 1], [cx + 26, H.toit + 4, 1], [cx + 26, -948, 1], [cx - 26, -948, 1]], '#b07a5a', () => {
      for (let y = H.toit; y > -948; y -= 9) strokePts([[cx - 26, y], [cx + 26, y]], 'rgba(80,40,20,0.4)', 1); fillPts([[cx - 30, -948, 1], [cx + 30, -948, 1], [cx + 30, -938, 1], [cx - 30, -938, 1]], '#d8ccb0'); }, { seed: seed + 7 + cx });
      for (const px of [-14, 0, 14]) piece([[cx + px - 4, -948, 1], [cx + px + 4, -948, 1], [cx + px + 3, -966, 1], [cx + px - 3, -966, 1]], '#c4703f', null, { seed: seed + 11 + px, drop: false }); }
  }
  function makeRue() {
    const w = 1200, h = 1010;
    const cv = M.cutFlat(w, h, w / 2, h - 10, (x) => {
      immeuble(x, -600, -165, '#dccdae', [-530, -430, -330, -230], [-330], 3301);
      immeuble(x, -165, 165, '#d2c19e', [-100, 0, 100], [0], 3401);
      immeuble(x, 165, 600, '#d9c9a8', [230, 330, 430, 530], [330], 3501);
      for (const dc of [-330, 0, 330]) porteCochere(x, dc);
      piece([[-600, 0, 1], [600, 0, 1], [600, -RUE_H.pave, 1], [-600, -RUE_H.pave, 1]], '#8f877a', () => {
        const R = rng(3601); fillPts([[-600, -RUE_H.pave, 1], [600, -RUE_H.pave, 1], [600, -RUE_H.pave + 7, 1], [-600, -RUE_H.pave + 7, 1]], '#c2b69e');
        for (let r = 0; r < 2; r++) for (let xx = -600 + r * 14; xx < 600; xx += 28) { x.fillStyle = `rgba(${R() < 0.5 ? '60,55,50' : '170,160,145'},0.35)`; x.beginPath(); x.ellipse(xx + 12, -RUE_H.pave + 13 + r * 11, 12, 4.5, 0, 0, TAU); x.fill(); }
        hatch(null, 0.2, 4, 0.15); }, { seed: 3602, drop: false });
    });
    cv.padB = 10; return M.withShadow(cv, 8);
  }
  function makeCafe() {
    const w = 640, h = 1020;
    const cv = M.cutFlat(w, h, w / 2, h - 10, (x) => {
      immeuble(x, -300, 300, '#d6c6a4', [-210, -70, 70, 210], [-70, 70, -210, 210], 3701);
      piece([[-292, -RUE_H.pave, 1], [292, -RUE_H.pave, 1], [292, -372, 1], [-292, -372, 1]], '#33493b', () => {
        for (const [a, b] of [[-270, -96], [96, 270]]) {
          const g = x.createLinearGradient(0, -300, 0, -60); g.addColorStop(0, '#e2b56a'); g.addColorStop(1, '#8a5a2a'); x.fillStyle = g; x.fillRect(a, -300, b - a, 240);
          for (let i = 0; i < 4; i++) { const lx = lerp(a + 20, b - 20, i / 3); x.fillStyle = 'rgba(255,240,190,0.5)'; x.beginPath(); x.arc(lx, -250, 6, 0, TAU); x.fill(); }
          x.fillStyle = 'rgba(255,250,235,0.2)'; x.beginPath(); x.moveTo(a + 10, -70); x.lineTo(a + 60, -300); x.lineTo(a + 80, -300); x.lineTo(a + 30, -70); x.fill();
          fillPts([[a, -140, 1], [b, -140, 1], [b, -64, 1], [a, -64, 1]], '#ece4cf'); for (let xx = a + 6; xx < b; xx += 8) strokePts([[xx, -138], [xx, -66]], 'rgba(150,130,100,0.35)', 1);
          strokePts([[a, -142], [b, -142]], '#b8913f', 2.4);
          for (const f of [1 / 3, 2 / 3]) strokePts([[lerp(a, b, f), -300], [lerp(a, b, f), -60]], '#2a3a2e', 4);
          strokePts([[a, -300, 1], [b, -300, 1], [b, -60, 1], [a, -60, 1], [a, -300, 1]], '#1f2c22', 5);
        }
        fillPts([[-58, -312, 1], [58, -312, 1], [58, -RUE_H.pave, 1], [-58, -RUE_H.pave, 1]], '#2b3d31');
        x.fillStyle = 'rgba(226,181,106,0.85)'; x.fillRect(-46, -298, 92, 140); strokePts([[0, -298], [0, -158]], '#1f2c22', 3);
        for (const s of [-1, 1]) { fillPts([[s * 8, -140, 1], [s * 46, -140, 1], [s * 46, -50, 1], [s * 8, -50, 1]], '#3a5040'); dot(s * 12, -150, 3, '#b8913f'); }
        fillPts([[-292, -372, 1], [292, -372, 1], [292, -336, 1], [-292, -336, 1]], '#26372c');
        strokePts([[-284, -366], [284, -366]], '#b8913f', 2); strokePts([[-284, -342], [284, -342]], '#b8913f', 2);
        for (const rx of [-200, 0, 200]) { dot(rx, -354, 7, '#b8913f'); dot(rx, -354, 3.6, '#26372c'); }
        hatch(null, 1.45, 5, 0.15); }, { seed: 3801 });
      const top = -338, bot = -262, n = 20;
      for (let i = 0; i < n; i++) {
        const u0 = i / n, u1 = (i + 1) / n, xa0 = lerp(-300, 300, u0), xa1 = lerp(-300, 300, u1), xb0 = lerp(-322, 322, u0), xb1 = lerp(-322, 322, u1);
        piece([[xa0, top, 1], [xa1, top, 1], [xb1, bot, 1], [xb1, bot + 14], [(xb0 + xb1) / 2, bot + 22], [xb0, bot + 14], [xb0, bot, 1]], i % 2 ? '#e7dcc3' : '#9a3b33',
          () => { shade(0, top, 0, bot + 22, 0.28, [xb0 - 4, top - 4, xb1 + 4, bot + 26]); hatch(null, 0.6, 4, 0.12); }, { seed: 3900 + i, drop: i === 0 });
      }
      x.fillStyle = 'rgba(30,15,10,0.35)'; x.fillRect(-300, bot + 22, 600, 10);
    });
    cv.padB = 10; return M.withShadow(cv, 8);
  }
  function makeGueridon() {
    const cv = M.cutFlat(140, 170, 70, 160, () => {
      piece(ribbon([[0, -130], [0, -70], [0, -14]], 8, 12), '#252326', () => hatch(null, 0.4, 3, 0.2), { seed: 4001 });
      piece([[-36, 0, 1], [36, 0, 1], [30, -6], [8, -18], [-8, -18], [-30, -6]], '#252326', null, { seed: 4002 });
      piece([[-50, -142, 1], [50, -142, 1], [48, -131, 1], [-48, -131, 1]], '#e6e1d6', () => { strokePts([[-30, -138], [-10, -136], [8, -139]], 'rgba(120,115,110,0.5)', 1); }, { seed: 4003 });
    }); cv.padB = 10; return M.withShadow(cv, 6);
  }
  function makeChaise() {
    const cv = M.cutFlat(140, 200, 70, 190, () => {
      const wood = '#4a2f1e';
      piece(ribbon([[-22, 0], [-20, -60], [-22, -100], [-30, -150], [-24, -176], [-6, -180], [2, -160], [-4, -120], [-12, -98]], 7, 7), wood, null, { seed: 4101 });
      piece(ribbon([[24, 0], [24, -50], [22, -92]], 7, 7), wood, null, { seed: 4102 });
      piece(ribbon(ep(0, -40, 26, 6, 12, 0, PI), 4, 4), wood, null, { seed: 4103, drop: false });
      piece([[-30, -100, 1], [32, -100, 1], [32, -90, 1], [-30, -90, 1]], '#5a3a26', () => { for (let xx = -28; xx < 30; xx += 5) strokePts([[xx, -99], [xx + 2, -91]], 'rgba(220,190,140,0.35)', 1); }, { seed: 4104 });
    }); cv.padB = 10; return M.withShadow(cv, 6);
  }
  function makeMorris() {
    const cv = M.cutFlat(260, 720, 130, 710, (x) => {
      piece([[-112, 0, 1], [112, 0, 1], [108, -30, 1], [-108, -30, 1]], '#2f4a38', () => hatch(null, 0.3, 4, 0.2), { seed: 4201 });
      piece([[-100, -30, 1], [100, -30, 1], [100, -540, 1], [-100, -540, 1]], '#3b5a44', () => {
        for (const [a, b, c0, d, col, fig] of [[-92, -520, -12, -400, '#c99a4a', 'rond'], [-4, -528, 92, -404, '#9a3b33', 'losange'], [-88, -388, 16, -232, '#6d7a8c', 'bande'], [24, -392, 96, -262, '#e2d6b8', 'rond2'], [-94, -220, -18, -60, '#8a9a7a', 'bande2'], [-8, -246, 90, -70, '#d4a44a', 'losange2']]) {
          fillPts([[a, b, 1], [c0, b, 1], [c0, d, 1], [a, d, 1]], col);
          const mx = (a + c0) / 2, my = (b + d) / 2;
          if (fig.startsWith('rond')) dot(mx, my, Math.min(c0 - a, d - b) * 0.28, fig === 'rond' ? '#2b2420' : '#9a3b33');
          else if (fig.startsWith('losange')) fillPts([[mx, my - 30, 1], [mx + 24, my, 1], [mx, my + 30, 1], [mx - 24, my, 1]], '#efe6cf');
          else { fillPts([[a, my - 12, 1], [c0, my - 12, 1], [c0, my + 10, 1], [a, my + 10, 1]], '#2b2420'); }
          strokePts([[a, b, 1], [c0, b, 1], [c0, d, 1], [a, d, 1], [a, b, 1]], 'rgba(30,20,10,0.4)', 1.2);
        }
        const g = x.createLinearGradient(-100, 0, 100, 0); g.addColorStop(0, 'rgba(20,10,5,0.45)'); g.addColorStop(0.35, 'rgba(255,250,230,0.12)'); g.addColorStop(1, 'rgba(20,10,5,0.55)');
        x.fillStyle = g; x.fillRect(-100, -540, 200, 510); hatch(null, 0.9, 5, 0.12); }, { seed: 4202 });
      piece([[-110, -540, 1], [110, -540, 1], [110, -572, 1], [-110, -572, 1]], '#2f4a38', () => { for (let xx = -104; xx < 110; xx += 16) dot(xx, -556, 4, '#b8913f'); }, { seed: 4203 });
      piece(ep(0, -572, 104, 92, 18, PI, TAU).concat([[104, -572]]), '#3b5a44', () => { for (const a of [-60, -30, 0, 30, 60]) strokePts([[a, -572], [a * 0.3, -660]], 'rgba(20,30,20,0.5)', 1.4); hatch(null, 0.5, 4, 0.2); }, { seed: 4204 });
      piece([[-8, -660, 1], [8, -660, 1], [6, -690, 1], [0, -700, 1], [-6, -690, 1]], '#2f4a38', null, { seed: 4205 });
    }); cv.padB = 10; return M.withShadow(cv, 8);
  }
  POU.init = function () {
    if (POU.K) return POU.K;
    const K = (POU.K = {});
    K.rue = makeRue(); K.cafe = makeCafe(); K.gueridon = makeGueridon(); K.chaise = makeChaise(); K.morris = makeMorris();
    return K;
  };
})();
