// persos.js — « Mettre les pieds dans le plat, une histoire de mare » : marionnettes, accessoires et décors PROPRES À CETTE VIDÉO. Espace M.plat (alias PLT). Appeler PLT.init() dans S.init.
// Chargé après marionnettes.js et bibliotheque.js, avant scene.js. Tout dans une IIFE. Aucun texte, lettre, chiffre ni logo. Déterministe (hash, aucun Math.random).
//
// MARIONNETTES (avec tige ; (x,y) = pieds ; passer slot: ST.slotF ou ST.slotB). Toujours par l'enveloppe PLT.xxx(pose,x,y,s,o) (prépare gestes, objets, seconde main).
// Pièces communes : armB_up armB_lo objetB legB footB legF footF head … torso armF_up armF_lo objet doigts doigtsB. Le pied (footF/footB) est une pièce à part,
// rivetée à la cheville (ang.footF : + = pointe vers le bas). Angles : armF_up −1,57 = horizontal vers l'avant, −2,5 = au-dessus de la tête ; armF_lo négatif = plier
// le coude ; head négatif = menton levé ; legF/legB négatif = jambe vers l'avant.
// Options communes : tenu / tenuB 'rien'|'livre'|'baguette'|'canne' ; tenuO / tenuBO (options de l'objet) ; droit / droitB (true par défaut si objet tenu) ;
//   ang.objet / ang.objetB ; deuxMains (seconde main sur la prise p2 : livre) ; handF / handB 'fist'|'open' ; face{brow,mouth,eyes} ; t ; boue 0..1 ; coule 0..1.
//   Renvoie r = M.puppet(…) + r.tenu… ; PLT.pt(r,'pointe'|'bout'|'haut'|'dos', arriere) = point écran de l'objet tenu ; PLT.semelle(r) = dessous du pied avant.
//   convive   : PLT.convive — C.pltConvive, s 0,9. pied 0..1 (jambe avant levée, semelle à plat ; piedAng = angle visé de legF, −1,85 défaut ; bras en balancier
//               sauf si serviette/hausse) ; serviette 0..1 (main avant ouverte posée sur la serviette) ; hausse 0..1 (haussement : coudes au corps, paumes ouvertes).
//               boue 1 par défaut (souliers boueux), coule = pied par défaut (gouttes de boue).
//   guiraud   : PLT.guiraud — C.pltGuiraud, s 0,9. secoue 0..1 (non de la tête + main ouverte qui s'agite, rythme t) ; explique 0..1 (bras tendu ; prend la
//               baguette si tenu n'est pas donné) ; livre 0..1 (montre le gros livre ; prend tenu:'livre' si la main avant est libre) ; ajuste 0..1 (main aux lunettes).
//   promeneur : PLT.promeneur — C.pltPromeneur, s 0,9. Canne dans la main ARRIÈRE par défaut (tenuB:'canne', bout au sol calculé) ; canne 0..1 (appui marqué) ;
//               leve_pied 0..1 (jambe avant levée, botte de vase, il la regarde) ; salue_gene 0..1 (main au bord du chapeau, tête basse, sourcils inquiets).
// ACCESSOIRES (sans tige) : PLT.roti(x,y,s,o) — plat d'argent + rôti doré SANS visage ; (x,y) = dessous du plat ; o.cloche 0..1 ; o.sueur 0..1 ; o.tremble 0..1 ;
//   o.soupir 0..1 (progression d'un soupir : le rôti gonfle, un petit nuage s'échappe) ; o.fil (true : fil de la cloche) ; o.t OBLIGATOIRE. r.bouton r.dessus r.bord.
//   PLT.livre / PLT.baguette / PLT.canne (x,y,s,o) : même dessin qu'en main ; (x,y) = bas du livre / prise de la baguette / bout de la canne.
// DÉCORS : PLT.init() → PLT.K = { table, chaise } (pré-rendus, échelle 1, M.flat(…, x, ST.back, {cast})) ; repères PLT.TABLE, PLT.CHAISE, PLT.surTable(x).
(function () {
  'use strict';
  const X = M.X, P = M.P, TAU = M.TAU, PI = Math.PI, D = 180 / PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, hash, noise, smooth } = M;
  const PLT = (M.plat = {});
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
  const normA = (a) => { while (a > PI) a -= TAU; while (a < -PI) a += TAU; return a; };
  function rrect(x0, y0, x1, y1, r) {
    return ep(x1 - r, y0 + r, r, r, 4, -PI / 2, 0).concat(ep(x1 - r, y1 - r, r, r, 4, 0, PI / 2), ep(x0 + r, y1 - r, r, r, 4, PI / 2, PI), ep(x0 + r, y0 + r, r, r, 4, PI, PI * 1.5));
  }
  const pc = (pts, base, paint, seed, o) => piece(pts, base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));
  function worldPt(x, y) { return mp(cx_().getTransform(), [x, y]); }
  function goutte(x, y, r, a, el, col) {                                      // goutte (sueur, vase) : dessin brut, appelée hors passe silhouette
    if (a <= 0.01 || SIL()) return;
    const c = cx_(); el = el || 1;
    c.save(); c.globalAlpha = a;
    c.beginPath(); c.moveTo(x, y - r * 1.9 * el); c.quadraticCurveTo(x + r * 1.05, y - r * 0.4, x + r, y); c.arc(x, y, r, 0, PI); c.quadraticCurveTo(x - r * 1.05, y - r * 0.4, x, y - r * 1.9 * el); c.closePath();
    c.fillStyle = col || 'rgba(212,232,238,0.9)'; c.fill(); c.lineWidth = 1.1 * M._lw(); c.strokeStyle = col ? 'rgba(40,25,10,0.7)' : 'rgba(50,70,85,0.6)'; c.stroke();
    c.beginPath(); c.arc(x - r * 0.35, y - r * 0.2, r * 0.32, 0, TAU); c.fillStyle = col ? 'rgba(255,230,190,0.55)' : 'rgba(255,255,255,0.95)'; c.fill();
    c.restore();
  }

  // ------------------------------------------------------------ bras et jambes à articulations rondes
  const R_COUDE = 11.5, LA = 96, LB = Math.hypot(4, 96), PHI = Math.atan2(-4, 96), SH_F = [-2, -146], SH_B = [-10, -146], ANK = 212;
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
  // jambe jusqu'à la cheville (bout arrondi centré sur le rivet du pied) ; le pied est une pièce à part
  function legA(th) {
    return [[-18 * th, -12], [16 * th, -14], [22 * th, 20], [20 * th, 70], [16, 108], [19, 118], [15, 170], [13, 200]].concat(ep(0, ANK, 13, 12, 8, 0, PI),
      [[-15, 200], [-19, 180], [-21, 140], [-21, 118], [-17, 108], [-20 * th, 60], [-22 * th, 10]]);
  }
  const FOOT = (k) => ep(0, 0, 14, 14, 8, PI, TAU).concat([[16, 6], [40 * k, 10], [50 * k, 19, 1], [48 * k, 25, 1], [-18, 25, 1], [-22, 12]]);
  const MUD = '#5b4428', MUDD = '#3e2e1a', MUDL = '#7d6440';
  function legDef(at, base, seed, back, paint) {
    return { parent: 'torso', at, pts: legA(1), base, seed, noRivet: !!back, paint: (p) => {
      if (paint) paint(p);
      if (!back) hatch([[-26, -20], [-6, -20], [-6, 230], [-26, 230]], 0.8, 4, 0.25); else hatch(null, 0.8, 3.6, 0.3);
    } };
  }
  function legDefTh(at, base, seed, back, th, paint) { const d = legDef(at, base, seed, back, paint); d.pts = legA(th); return d; }
  function footDef(parent, base, seed, back, k, kind) {
    return { parent, at: [0, ANK], pts: FOOT(k), base, seed, noRivet: !!back, paint: (p) => {
      fillPts([[-26, 21, 1], [60, 21, 1], [60, 32, 1], [-26, 32, 1]], '#151110');                                  // semelle
      if (kind === 'botte') { for (const x of [4, 12, 20]) strokePts([[x - 3, 2 + x * 0.12], [x + 3, 6 + x * 0.12]], 'rgba(220,200,160,0.55)', 1.1); strokePts([[-14, -2], [-14, 18]], 'rgba(0,0,0,0.3)', 1.2); }
      else if (!back) strokePts([[20, 9], [42, 13]], 'rgba(255,255,255,0.3)', 1.3);
      const b = clamp(p.boue || 0);
      if (b > 0.01) {
        fillPts([[-24, 14], [0, 12], [26, 15], [54, 16], [56, 28], [-24, 28]], `rgba(91,68,40,${0.9 * b})`);   // bande de boue sur le bas
        for (let i = 0; i < 7; i++) { if (hash(seed + i * 3.3) > b) continue; dot(lerp(-12, 44, hash(seed + i * 1.7)), lerp(-2, 14, hash(seed + i * 2.9)), 1.8 + 2.6 * hash(seed + i * 5.1), i % 2 ? MUD : MUDD); }
      }
      hatch(null, 0.8, 3.6, back ? 0.3 : 0.18);
    }, extra: (p) => {
      const b = clamp(p.boue || 0); if (b <= 0.01) return;
      const cl = [[54, 27], [-24, 27]];                                                                          // vase collée sous la semelle (motte bosselée)
      for (let i = 0; i <= 10; i++) { const u = i / 10; cl.push([lerp(-24, 54, u), 31 + b * (3 + 6 * hash(seed + i * 1.3)) * Math.sin(PI * Math.min(1, u * 1.15 + 0.04))]); }
      fillPts(cl, MUD, seed, 0.8); strokePts(cl.concat([cl[0]]), 'rgba(30,20,10,0.6)', 1, false, seed);
      for (let i = 0; i < 4; i++) dot(lerp(-14, 44, hash(seed + i * 6.1)), 33 + 2 * hash(seed + i), 1.6 + 1.6 * hash(seed + i * 2.2), i % 2 ? MUDL : MUDD);
      const co = back ? 0 : clamp(p.coule || 0); if (co <= 0.01 || SIL()) return;
      const c = cx_(), T = c.getTransform(), sc = Math.hypot(T.a, T.b), t = p.t || 0;                             // gouttes de vase qui tombent (verticales à l'écran)
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
      for (let i = 0; i < 3; i++) {
        const u = (t * 0.8 + hash(seed + i * 4.1)) % 1, w = mp(T, [lerp(-8, 40, hash(seed + i * 2.3)), 32]);
        const r = (3 + 2 * hash(seed + i)) * sc * co, y = w[1] + (u < 0.35 ? 0 : 170 * sc * Math.pow((u - 0.35) / 0.65, 2));
        goutte(w[0], y + r, r, 1 - smooth(0.75, 1, u), u < 0.35 ? 0.6 + u * 2 : 1.3, 'rgba(84,62,34,0.95)');
      }
      c.restore();
    } };
  }
  function foreDef(parent, base, skin, back, seed, cuffCol, sleeveTop) {
    const hk = (p) => (back ? p.handB : p.handF) || 'fist';
    return { parent, at: [0, LA], pts: (p) => foreR(hk(p)), base, seed, paint: (p) => {
      const k = hk(p);
      if (sleeveTop) fillPts([[-24, sleeveTop, 1], [24, sleeveTop, 1], [24, 300, 1], [-24, 300, 1]], skin);
      fillPts([[-20, 76, 1], [20, 76, 1], [24, 130, 1], [-20, 130, 1]], skin); X.handPaint(null, k);
      if (cuffCol) fillPts([[-14, 62, 1], [14, 62, 1], [15, 78, 1], [-14, 78, 1]], cuffCol);
      hatch([[-14, -10], [-3, -10], [-3, 60], [-14, 60]], 0.9, 3.8, 0.22);
    } };
  }
  const upDef = (at, base, seed, wt, paint) => ({ parent: 'torso', at, pts: armR(LA, wt), base, seed, paint: paint || (() => hatch([[-18, -20], [-3, -20], [-3, 100], [-18, 100]], 0.9, 3.8, 0.28)) });

  // =====================================================================
  // OBJETS TENUS (origine = repère de l'objet ; grip = point tenu dans le poing)
  // =====================================================================
  // ---------------- gros livre fermé, couverture de cuir brun, SANS titre ; (0,0) = bas du livre
  function drawLivre() {                                                      // 108 × 150 local (gros in-folio)
    const k = 1.3, S = (pts) => pts.map((q) => (q[2] ? [q[0] * k, q[1] * k, 1] : [q[0] * k, q[1] * k]));
    pc(S([[38, -114, 1], [50, -108, 1], [50, -4, 1], [38, -1, 1]]), '#ece3c8', () => { for (let y = -104; y < -6; y += 4) strokePts(S([[39, y], [49, y + 1]]), 'rgba(120,100,70,0.45)', 0.8); }, 8101);
    pc(S(rrect(-40, -116, 40, 0, 4)), '#6e4a2c', () => {
      strokePts(S([[-30, -106, 1], [32, -106, 1], [32, -10, 1], [-30, -10, 1], [-30, -106, 1]]), 'rgba(40,24,12,0.6)', 1.6);   // filet à froid (cadre nu)
      strokePts(S([[-28, -104], [30, -104]]), 'rgba(255,220,170,0.25)', 1);
      hatch(null, 0.7, 3.8, 0.22, 1.05, P.encre, [-60, -160, 70, 4]); shade(52, 0, -52, 0, 0.25, [-56, -154, 56, 2]);
    }, 8102);
    for (const y of [-116, 0]) pc(S([[40, y, 1], [40, y + (y ? 14 : -14), 1], [26, y, 1]]), '#b08d45', null, 8103 + (y ? 1 : 0), { drop: false });  // coins de laiton
    pc(S([[-48, -112], [-40, -116, 1], [-40, 0, 1], [-48, -4], [-50, -58]]), '#553620', () => { for (const y of [-92, -60, -28]) strokePts(S([[-49, y], [-40, y]]), 'rgba(255,220,170,0.35)', 2); }, 8105);
    pc(S([[8, 0], [14, 0], [15, 16, 1], [11, 12], [7, 16, 1]]), '#8a2a2a', null, 8106, { drop: false });                     // signet
  }
  // ---------------- baguette de conférencier (repère : prise ; elle monte vers l'avant à ≈ 12°)
  const BAG_A = -0.22, BAG_L = 300, BAG_TIP = [BAG_L * Math.cos(BAG_A), BAG_L * Math.sin(BAG_A)];
  function drawBaguette() {
    const c = cx_(); c.save(); c.rotate(BAG_A);
    pc(ribbon([[24, 0], [120, 0], [BAG_L, 0]], 8, 3.4), '#c9a46a', () => strokePts([[26, -1.5], [BAG_L - 4, -0.5]], 'rgba(255,240,200,0.55)', 1), 8201);
    pc(rrect(-36, -6.5, 26, 6.5, 3), '#4a2e1a', () => { strokePts([[-32, -3], [22, -3]], 'rgba(255,220,170,0.25)', 1.2); hatch(null, 0.3, 3, 0.25); }, 8202);
    pc([[24, -6, 1], [32, -5.5, 1], [32, 5.5, 1], [24, 6, 1]], '#b08d45', null, 8203);
    pc(ell(BAG_L, 0, 5, 3.6, 10), '#ece4cc', null, 8204);
    c.restore();
  }
  // ---------------- canne de marche rustique (repère : prise ; bout ferré à o.long sous la prise)
  function drawCanne(o) {
    const L = o.long || 200;
    pc(ribbon([[0, -18], [1.5, 40], [-1, 100], [1, L - 8]], 11, 8), '#7a5a36', () => {
      for (const y of [30, 84, 140]) { if (y < L - 20) { dot(2, y, 3, '#4e3620'); strokePts([[-2, y - 6], [3, y + 5]], 'rgba(40,25,10,0.5)', 1); } }
      strokePts([[-2, -14], [-2, L - 12]], 'rgba(255,220,170,0.3)', 1.2); hatch(null, 1.3, 3.2, 0.2, 1.05, P.encre, [-10, -30, 10, L + 4]);
    }, 8301);
    pc(ell(0, -20, 8.5, 7.5, 12), '#6a4a2a', () => dot(-2, -23, 2.2, 'rgba(255,230,190,0.4)'), 8302);
    pc([[-4.5, L - 12, 1], [4.5, L - 12, 1], [4, L, 1], [-4, L, 1]], '#55585c', null, 8303);
  }
  const OBJ = {
    livre: { draw: drawLivre, grip: [-22, -36], p2: () => [40, -124], pts: { haut: [0, -151], dos: [-63, -75] }, base: [0, 0] },
    baguette: { draw: drawBaguette, grip: [0, 0], pts: { pointe: BAG_TIP }, base: [0, 0] },
    canne: { draw: drawCanne, grip: [0, 0], pts: { bout: (o) => [0, o.long || 200] }, base: (o) => [0, o.long || 200] },
  };
  PLT.OBJ = OBJ;
  const gripOf = (ob, o) => (typeof ob.grip === 'function' ? ob.grip(o) : ob.grip);
  const has = (v) => v && v !== 'rien';
  function heldOpts(name, o, p) { const ob = OBJ[name]; return Object.assign({ t: p.t || 0 }, ob.held || {}, o || {}); }
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
      doigtsB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 4, pts: (p) => (has(p.tenuB) && !p._deux ? DOIGTS : OFFP), paint: doigtsPaint },
      doigtsD: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 5, pts: (p) => (p._deux ? DOIGTS : OFFP), paint: doigtsPaint },   // seconde main posée sur l'objet avant
    };
  }
  PLT.pt = function (r, nom, arriere) {
    const name = arriere ? r.tenuB : r.tenu, ob = OBJ[name]; if (!ob || !ob.pts[nom]) return null;
    const oo = arriere ? r.tenuBO : r.tenuO, g = gripOf(ob, oo), q = typeof ob.pts[nom] === 'function' ? ob.pts[nom](oo) : ob.pts[nom];
    return r.w(arriere ? 'objetB' : 'objet', q[0] - g[0], q[1] - g[1]);
  };
  PLT.semelle = (r, arriere) => r.w(arriere ? 'footB' : 'footF', 14, 30);

  // =====================================================================
  // POSES — préparation commune
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
  const flatFoot = (q, leg, k) => { const n = leg === 'legF' ? 'footF' : 'footB'; q.ang[n] = lerp(q.ang[n] || 0, -((q.ang[leg] || 0) + (q.tilt || 0)), k); };
  function fistFeet(q, arm) {                                                  // poing dans le repère des pieds (y = 0 au sol)
    const A = q.ang, sh = arm === 'armF' ? SH_F : SH_B;
    const m = new DOMMatrix().rotate((q.tilt || 0) * D).translate(q.dx || 0, -238 + (q.dy || 0)).translate(sh[0], sh[1]).rotate((A[arm + '_up'] || 0) * D).translate(0, LA).rotate((A[arm + '_lo'] || 0) * D).translate(4, 96);
    return [m.e, m.f];
  }
  function finish(q) {
    const A = q.ang, tl = q.tilt || 0;
    if (has(q.tenu) && !(q.handF && q.handF !== 'fist')) q.handF = 'fist';
    if (has(q.tenuB) && !(q.handB && q.handB !== 'fist')) q.handB = 'fist';
    if (q.droit == null && has(q.tenu)) q.droit = true;
    if (q.droitB == null && has(q.tenuB)) q.droitB = true;
    if (q.droit) A.objet = (A.objet || 0) - ((A.armF_up || 0) + (A.armF_lo || 0) + tl);
    if (q.droitB) A.objetB = (A.objetB || 0) - ((A.armB_up || 0) + (A.armB_lo || 0) + tl);
    // canne droite : sa longueur est calculée pour que le bout touche le sol (tenuO.long l'impose)
    if (q.tenu === 'canne' && q.droit) q.tenuO = Object.assign({ long: Math.max(90, -fistFeet(q, 'armF')[1]) }, q.tenuO);
    if (q.tenuB === 'canne' && q.droitB) q.tenuBO = Object.assign({ long: Math.max(90, -fistFeet(q, 'armB')[1]) }, q.tenuBO);
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
  const ORDER = (avant, tete) => ['armB_up', 'armB_lo', 'objetB', 'doigtsB', 'legB', 'footB', 'legF', 'footF'].concat(avant || [], ['head'], tete || [], ['torso', 'armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsD']);

  // =====================================================================
  // LE CONVIVE — gros bonhomme, crâne dégarni, moustache en guidon, redingote bordeaux, serviette au col, souliers noirs boueux
  // =====================================================================
  const CV = { peau: '#e8b99a', peauD: '#c9977a', red: '#7a2e2e', redD: '#652626', redDD: '#4e1c1c', gilet: '#2e2a30', serv: '#f6f3ea', servD: '#d8d2c2',
    pant: '#4a4850', pantD: '#3c3a42', soulier: '#1d1a1a', cheveux: '#5a4a40', moust: '#3e3028', chemise: '#efeadf' };
  const CV_TORSO = [[-14, -176], [8, -180], [20, -168], [36, -150], [54, -120], [68, -84], [75, -44], [73, -6], [63, 20], [48, 34], [26, 42], [2, 46], [-18, 56], [-28, 96],
    [-32, 118, 1], [-54, 116, 1], [-57, 60], [-55, 0], [-53, -60], [-51, -112], [-44, -148], [-28, -168]];
  const CV_GILET = [[20, -164], [36, -150], [54, -120], [68, -84], [75, -44], [73, -6], [63, 20], [48, 34], [38, 28], [50, -8], [52, -56], [42, -108], [22, -150]];
  const CV_SERV = [[0, -184], [20, -180], [36, -158], [54, -128], [67, -98], [73, -76], [63, -66, 1], [47, -58], [31, -64], [17, -84], [8, -116], [0, -150]];
  const CV_HEAD = [[-16, 18], [12, 18], [22, 12], [29, 3], [32, -6], [31, -13], [33, -18], [32, -23], [34, -28], [36, -33], [43, -40, 1], [38, -48], [33, -57], [32, -66], [28, -80],
    [15, -94], [-6, -100], [-27, -92], [-38, -72], [-38, -48], [-32, -26], [-24, -6]];
  const CV_MOUST = [[37, -31], [33, -27], [25, -25], [15, -27], [7, -32], [2, -39], [1, -46], [5, -50], [9, -47], [7, -42], [11, -36], [19, -33], [27, -34], [32, -36]];
  const CV_MOUST2 = [[36, -31], [42, -29], [47, -32], [48, -38], [45, -40], [44, -35], [40, -34]];
  function mkConvive() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: CV_TORSO, base: CV.red, seed: 9001, paint: () => {
        fillPts(CV_GILET, CV.gilet);
        for (const [x, y] of [[68, -40], [65, -12], [55, 14]]) dot(x, y, 2.2, '#8a7f70');
        strokePts([[22, -150], [42, -108], [52, -56], [50, -8], [38, 28]], 'rgba(30,8,8,0.7)', 1.6);                     // bord de la redingote
        fillPts([[6, -178], [20, -172], [30, -150], [24, -140], [12, -160]], CV.redDD);                                       // revers
        fillPts([[-6, -184], [8, -184], [14, -172], [0, -174]], CV.chemise);                                                  // col de chemise
        fillPts(CV_SERV, CV.serv);                                                                                            // serviette glissée dans le col
        for (const l of [[[10, -172], [22, -124], [34, -74]], [[22, -174], [42, -124], [52, -72]], [[4, -160], [10, -110], [20, -82]]]) strokePts(l, 'rgba(150,140,120,0.55)', 1.2);
        fillPts([[0, -184], [20, -180], [24, -172], [4, -174]], CV.servD);                                                    // le coin rentré
        hatch([[36, -150], [76, -150], [76, -60], [36, -60]], 0.95, 4.6, 0.1);
        strokePts([[-50, 22], [-24, 30], [0, 40]], 'rgba(30,8,8,0.5)', 1.3);                                                  // couture de taille
        for (const x of [-42, -32]) dot(x, 24, 2.8, '#c9a85a');                                                              // boutons de dos
        strokePts([[-40, 30], [-36, 112]], 'rgba(30,8,8,0.5)', 1.2);                                                         // fente des basques
        hatch([[-60, -170], [-16, -170], [-14, 120], [-60, 120]], 0.75, 4.2, 0.3);
        shade(70, 0, -56, 0, 0.3, [-62, -190, 80, 125]);
      } },
      legB: legDefTh([-6, -2], CV.pantD, 9002, true, 1.3),
      footB: footDef('legB', CV.soulier, 9003, true, 1.05),
      legF: legDefTh([6, -2], CV.pant, 9004, false, 1.3, () => strokePts([[2, 30], [0, 120], [0, 205]], 'rgba(20,20,26,0.35)', 1.1)),
      footF: footDef('legF', CV.soulier, 9005, false, 1.05),
      armB_up: upDef([-10, -146], CV.redD, 9006, 18),
      armB_lo: foreDef('armB_up', CV.redD, CV.peauD, true, 9007, '#d9d3c4'),
      head: { parent: 'torso', at: [6, -170], pts: CV_HEAD, base: CV.peau, seed: 9008, noRivet: true, paint: (p) => {
        const f = p.face || {};
        fillPts([[-16, -66], [-8, -60], [-12, -38], [-22, -24], [-34, -22], [-40, -42], [-40, -66], [-30, -72]], CV.cheveux, 3);     // couronne de cheveux
        strokePts([[-20, -92], [0, -98], [16, -92]], 'rgba(255,250,235,0.6)', 2.2);                                          // reflet du crâne
        X.earPaint(-8, -44);
        hatch([[-24, -42], [2, -30], [14, -8], [-6, 20], [-34, 4]], 0.6, 3.6, 0.28);
        strokePts([[12, 8], [22, 3], [28, -5]], 'rgba(120,60,40,0.45)', 1.2);                                                // double menton
        dot(16, -32, 10, 'rgba(210,100,90,0.26)'); dot(38, -40, 4.5, 'rgba(200,80,70,0.35)');                               // joue et nez rougis
        X.eye(f, 19, -54); X.brow(f, 19, -63, 'rgba(60,45,35,0.95)', 3.2); X.mouth(f, 30, -20);
        fillPts(CV_MOUST, CV.moust, 6, 0.4); fillPts(CV_MOUST2, CV.moust, 7, 0.3);                                           // moustache en guidon
        strokePts([[30, -31], [16, -30], [6, -38]], 'rgba(200,180,160,0.35)', 1);
      } },
      armF_up: upDef([-2, -146], CV.red, 9009, 18),
      armF_lo: foreDef('armF_up', CV.red, CV.peau, false, 9010, CV.chemise),
    };
    Object.assign(parts, heldParts(CV.peau, 9020));
    return { hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, order: ORDER() };
  }
  CH.pltConvive = mkConvive();
  PLT.convivePose = function (p) {
    const q = prep(p), A = q.ang;
    if (q.boue == null) q.boue = 1;
    const pi = ease(clamp(q.pied || 0)), sv = ease(clamp(q.serviette || 0)), hs = ease(clamp(q.hausse || 0));
    if (pi > 0) {
      q.tilt = (q.tilt || 0) - 0.1 * pi;
      blend(q, 'legF', q.piedAng == null ? -1.85 : q.piedAng, pi); blend(q, 'legB', 0.04, pi);
      flatFoot(q, 'legF', pi); flatFoot(q, 'legB', pi);
      if (sv === 0 && hs === 0) { blend(q, 'armF_up', -1.95, pi); blend(q, 'armF_lo', -0.5, pi); blend(q, 'armB_up', 0.6, pi); blend(q, 'armB_lo', -0.3, pi); if (pi > 0.5 && !has(q.tenu) && !q.handF) q.handF = 'open'; }
      if (q.coule == null) q.coule = pi;
    }
    if (sv > 0) { armTo(q, 'armF', [52, -106], 'bas', sv); if (sv > 0.5 && !has(q.tenu) && !q.handF) q.handF = 'open'; }
    if (hs > 0) {
      blend(q, 'armF_up', 0.25, hs); blend(q, 'armF_lo', -2.1, hs); blend(q, 'armB_up', 0.45, hs); blend(q, 'armB_lo', -2.0, hs);
      q.dy = (q.dy || 0) - 4 * hs; A.head = (A.head || 0) + 0.08 * hs;
      if (hs > 0.4) { if (!has(q.tenu) && !q.handF) q.handF = 'open'; if (!has(q.tenuB) && !q.handB) q.handB = 'open'; if (!q.face.brow) q.face.brow = 'up'; if (!q.face.mouth) q.face.mouth = 'tight'; }
    }
    return finish(q);
  };
  PLT.convive = (pose, x, y, s, o) => run(CH.pltConvive, PLT.convivePose(pose), x, y, s == null ? 0.9 : s, o);

  // =====================================================================
  // PIERRE GUIRAUD — linguiste mince, crâne dégarni, lunettes rondes d'écaille, nœud papillon bleu nuit, veste vert-gris à coudières
  // =====================================================================
  const GU = { peau: '#e3c4a4', peauD: '#c6a483', veste: '#5d6b57', vesteD: '#4d5948', vesteDD: '#3f4a3b', chemise: '#f0ece2', noeud: '#2f3d5c',
    pant: '#6a645c', pantD: '#575149', chaus: '#5a3a26', cheveux: '#7a7066', monture: '#5a3a22' };
  const GU_TORSO = [[-12, -176], [8, -180], [14, -168], [24, -150], [30, -116], [30, -70], [28, -20], [30, 30], [32, 62, 1], [-34, 64, 1], [-34, 20], [-32, -40], [-34, -110], [-31, -148], [-24, -168]];
  const GU_HEAD = [[-12, 16], [9, 16], [10, 2], [15, -6], [22, -12], [25, -18], [24, -23], [26, -27], [25, -31], [28, -35], [37, -43, 1], [30, -51], [27, -58], [27, -68], [23, -82],
    [11, -95], [-8, -100], [-25, -90], [-32, -70], [-31, -46], [-24, -28], [-16, -8]];
  function mkGuiraud() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: GU_TORSO, base: GU.veste, seed: 9101, paint: () => {
        fillPts([[2, -184], [16, -172], [22, -150], [16, -128], [10, -150]], GU.chemise);                                     // plastron de chemise
        fillPts([[16, -170], [24, -150], [26, -118], [18, -100], [14, -136]], GU.vesteD);                                     // revers
        strokePts([[18, -100], [24, -40], [28, 60]], 'rgba(20,26,18,0.55)', 1.4);
        for (const y of [-80, -46, -12]) dot(26, y, 2.3, '#2c3328');
        fillPts([[-18, -132, 1], [6, -132, 1], [6, -126, 1], [-18, -126, 1]], GU.vesteDD);                                    // poche de poitrine (rabat)
        fillPts([[-16, 6, 1], [16, 6, 1], [16, 12, 1], [-16, 12, 1]], GU.vesteDD);                                            // poche basse
        fillPts([[8, -174], [17, -180], [23, -176], [22, -165], [16, -166]], GU.noeud);                                        // nœud papillon (profil)
        dot(11, -171, 3.2, '#253049'); for (const [x, y] of [[17, -175], [20, -169]]) dot(x, y, 1.1, '#d8d2c0');
        hatch([[-44, -170], [-10, -170], [-8, 66], [-44, 66]], 0.75, 4.2, 0.3);
        shade(32, 0, -36, 0, 0.26, [-40, -190, 36, 68]);
      } },
      legB: legDefTh([-6, -2], GU.pantD, 9102, true, 0.9),
      footB: footDef('legB', GU.chaus, 9103, true, 1),
      legF: legDefTh([6, -2], GU.pant, 9104, false, 0.9, () => strokePts([[2, 40], [0, 120], [0, 205]], 'rgba(40,36,30,0.35)', 1.1)),
      footF: footDef('legF', GU.chaus, 9105, false, 1),
      armB_up: upDef([-10, -146], GU.vesteD, 9106, 14),
      armB_lo: foreDef('armB_up', GU.vesteD, GU.peauD, true, 9107, '#d9d4c6'),
      head: { parent: 'torso', at: [6, -170], pts: GU_HEAD, base: GU.peau, seed: 9108, noRivet: true, paint: (p) => {
        const f = p.face || {};
        fillPts([[-16, -68], [-7, -62], [-11, -40], [-17, -27], [-28, -22], [-33, -44], [-33, -66], [-26, -72]], GU.cheveux, 3);    // couronne grise
        for (const [a, b] of [[[-22, -70], [-30, -62]], [[-14, -66], [-26, -50]], [[-12, -48], [-24, -32]]]) strokePts([a, b], 'rgba(230,225,215,0.4)', 1.1);
        strokePts([[-16, -94], [2, -99], [14, -94]], 'rgba(255,250,235,0.55)', 2);                                             // reflet du crâne
        X.earPaint(-8, -44);
        hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.28);
        strokePts([[14, -40], [20, -30]], 'rgba(120,80,60,0.35)', 1.1);                                                        // pli de joue
        X.eye(f, 18, -53); X.brow(f, 18, -63, 'rgba(95,88,80,0.95)', 3.2); X.mouth(f, 26, -26);
        const ring = ell(19, -53, 9.5, 10, 14);                                                                                 // lunettes rondes d'écaille
        fillPts(ring, 'rgba(190,225,240,0.25)', 0, 0); strokePts(ring.concat([ring[0]]), GU.monture, 2.6);
        strokePts([[9.5, -54], [-28, -57]], GU.monture, 2); strokePts([[13, -59], [19, -61]], 'rgba(255,255,255,0.75)', 1.2);
      } },
      armF_up: upDef([-2, -146], GU.veste, 9109, 14, () => { hatch([[-18, -20], [-3, -20], [-3, 100], [-18, 100]], 0.9, 3.8, 0.28); fillPts(ell(-1, 80, 10, 13, 12), GU.vesteDD); }),
      armF_lo: foreDef('armF_up', GU.veste, GU.peau, false, 9110, GU.chemise),
    };
    Object.assign(parts, heldParts(GU.peau, 9120));
    return { hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-24, 18] }, order: ORDER() };
  }
  CH.pltGuiraud = mkGuiraud();
  PLT.guiraudPose = function (p) {
    const q = prep(p), A = q.ang, t = q.t || 0;
    const se = ease(clamp(q.secoue || 0)), ex = ease(clamp(q.explique || 0)), aj = ease(clamp(q.ajuste || 0)), lv = ease(clamp(q.livre || 0));
    if (ex > 0 && q.tenu == null) q.tenu = 'baguette';
    if (lv > 0 && q.tenu == null && q.tenuB !== 'livre') q.tenu = 'livre';
    if (lv > 0) {
      if (q.tenu === 'livre') { blend(q, 'armF_up', -0.45, lv); blend(q, 'armF_lo', -1.3, lv); }
      else { blend(q, 'armB_up', -0.6, lv); blend(q, 'armB_lo', -1.15, lv); }
    }
    if (se > 0) {
      A.head = (A.head || 0) + 0.11 * Math.sin(t * 13) * se;
      blend(q, 'armF_up', -0.55, se); blend(q, 'armF_lo', -1.3 + 0.3 * Math.sin(t * 13 + 0.7), se);
      if (!has(q.tenu) && !q.handF) q.handF = 'open';
    }
    if (ex > 0) { blend(q, 'armF_up', -1.42 + 0.04 * Math.sin(t * 6), ex); blend(q, 'armF_lo', -0.12, ex); A.head = (A.head || 0) - 0.05 * ex; }
    if (aj > 0) { A.head = (A.head || 0) - 0.06 * aj; armTo(q, 'armF', headPt(q, 30, -38), 'avant', aj); if (aj > 0.5 && !has(q.tenu) && !q.handF) q.handF = 'open'; }
    return finish(q);
  };
  PLT.guiraud = (pose, x, y, s, o) => run(CH.pltGuiraud, PLT.guiraudPose(pose), x, y, s == null ? 0.9 : s, o);

  // =====================================================================
  // LE PROMENEUR — chapeau mou de feutre olive à large bord, foulard rouge, barbe courte, sac à dos de toile, chemise ivoire, pantalon ocre retroussé, bottes
  // =====================================================================
  const PR = { peau: '#dcb38e', peauD: '#bf946f', chap: '#6b7a3a', chapD: '#56622e', chapDD: '#444e24', ruban: '#3b3324', chemise: '#ede6d3', chemiseD: '#d3cbb5',
    foulard: '#a2352a', pant: '#b0843e', pantD: '#93692f', chaussette: '#8e8a7c', botte: '#4a3424', botteD: '#3a281a', sac: '#9a8a64', sacD: '#7d6e4c', sangle: '#5a3e26', barbe: '#7a5236' };
  const PR_TORSO = [[-14, -176], [8, -180], [16, -168], [28, -150], [34, -112], [36, -60], [34, -10], [32, 16], [-36, 18], [-38, -40], [-38, -110], [-34, -150], [-26, -168]];
  const PR_SAC = [[-2, -170], [-26, -168], [-44, -150], [-52, -110], [-54, -50], [-50, -10], [-40, 6], [-4, 8]];
  const PR_HAT = [[-74, 16], [-58, 8], [-40, 4], [-36, -12], [-32, -30], [-20, -40], [-6, -33], [8, -42], [24, -37], [34, -18], [38, 2], [58, 4], [78, 10], [74, 19], [50, 14], [0, 12], [-48, 14], [-70, 24]];
  function mkPromeneur() {
    const legPaint = (back) => () => {
      fillPts([[-30, 106, 1], [30, 106, 1], [30, 124, 1], [-30, 124, 1]], back ? '#7d5a28' : PR.pantD);                         // revers retroussé
      strokePts([[-26, 112], [26, 112]], 'rgba(60,40,15,0.5)', 1);
      fillPts([[-30, 124, 1], [30, 124, 1], [30, 168, 1], [-30, 168, 1]], back ? '#77736a' : PR.chaussette);                  // chaussettes de laine
      for (let y = 130; y < 166; y += 6) strokePts([[-20, y], [20, y]], 'rgba(40,40,30,0.25)', 1);
      fillPts([[-30, 166, 1], [30, 166, 1], [30, 260, 1], [-30, 260, 1]], back ? PR.botteD : PR.botte);                       // tige de la botte
      strokePts([[-18, 172], [18, 172]], 'rgba(255,230,190,0.25)', 1.2);
    };
    const parts = {
      sac: { parent: 'torso', at: [0, 0], pts: PR_SAC, base: PR.sac, seed: 9201, noRivet: true, paint: () => {
        fillPts([[-6, -172], [-30, -170], [-48, -150], [-52, -118], [-34, -112], [-8, -118]], PR.sacD);                         // rabat
        strokePts([[-48, -122], [-30, -116], [-8, -120]], 'rgba(40,30,15,0.5)', 1.2);
        fillPts([[-34, -126, 1], [-28, -126, 1], [-28, -96, 1], [-34, -96, 1]], PR.sangle); dot(-31, -100, 2.4, '#b08d45');      // courroie et boucle
        fillPts([[-56, -70, 1], [-46, -70, 1], [-46, -26, 1], [-56, -26, 1]], PR.sacD);                                        // poche
        hatch(null, 0.5, 3.4, 0.28); shade(-54, 0, -4, 0, 0.3, [-60, -175, 0, 12]);
      } },
      torso: { parent: null, at: [0, 0], pts: PR_TORSO, base: PR.chemise, seed: 9202, paint: () => {
        strokePts([[20, -150], [26, -60], [28, 10]], 'rgba(90,80,60,0.5)', 1.3);
        for (const y of [-120, -80, -40]) dot(27, y, 2, '#bdb39a');
        fillPts(ribbon([[-20, -174], [2, -164], [10, -136], [2, -108], [-22, -100]], 10, 9), PR.sangle);                       // bretelle du sac
        dot(6, -126, 2.4, '#b08d45');
        fillPts([[-10, -182], [12, -182], [22, -168], [26, -152], [16, -144], [12, -158], [-2, -168], [-16, -172]], PR.foulard);  // foulard rouge noué
        fillPts([[18, -160], [30, -140], [22, -134], [15, -150]], PR.foulard); dot(17, -157, 4, '#87291f');
        fillPts([[-38, 4, 1], [34, 4, 1], [34, 18, 1], [-38, 18, 1]], '#4a3020'); fillPts([[18, 3, 1], [28, 3, 1], [28, 19, 1], [18, 19, 1]], '#b08d45');   // ceinture
        hatch([[-50, -170], [-12, -170], [-10, 22], [-50, 22]], 0.75, 4.2, 0.3);
        shade(38, 0, -40, 0, 0.26, [-44, -190, 40, 22]);
      } },
      legB: legDef([-6, -2], PR.pantD, 9203, true, legPaint(true)),
      footB: footDef('legB', PR.botteD, 9204, true, 1.05, 'botte'),
      legF: legDef([6, -2], PR.pant, 9205, false, legPaint(false)),
      footF: footDef('legF', PR.botte, 9206, false, 1.05, 'botte'),
      armB_up: upDef([-10, -146], PR.chemiseD, 9207, 15),
      armB_lo: foreDef('armB_up', PR.chemiseD, PR.peauD, true, 9208, '#c4bba3'),
      head: { parent: 'torso', at: [6, -170], pts: X.NAP_HEAD, base: PR.peau, seed: 9209, noRivet: true, paint: (p) => {
        const f = p.face || {};
        fillPts([[-34, -84], [-18, -80], [-20, -58], [-24, -40], [-30, -30], [-38, -46], [-36, -72]], PR.barbe);                // cheveux sous le chapeau
        X.earPaint(-8, -44);
        fillPts([[-12, -40], [-6, -24], [6, -12], [18, -10], [28, -16], [31, -24], [27, -29], [18, -30], [12, -34], [4, -44], [-4, -48]], PR.barbe, 4, 0.5);   // barbe courte
        for (const [a, b] of [[[0, -36], [6, -22]], [[10, -28], [16, -16]], [[-6, -40], [-2, -28]]]) strokePts([a, b], 'rgba(40,25,15,0.4)', 1);
        fillPts([[36, -34], [30, -30], [22, -31], [24, -35], [31, -37]], PR.barbe, 5, 0.4);                                      // moustache courte
        hatch([[-22, -70], [2, -60], [6, -44], [-20, -44]], 0.6, 3.6, 0.2);
        dot(14, -40, 7, 'rgba(205,120,100,0.25)');
        X.eye(f, 17, -52); X.brow(f, 17, -60, 'rgba(80,50,30,0.95)', 2.8); X.mouth(f, 27, -26);
      } },
      chapeau: { parent: 'head', at: [-2, -86], pts: PR_HAT, base: PR.chap, seed: 9210, noRivet: true, paint: () => {
        fillPts([[-38, -8], [38, -8], [39, 3], [-39, 4]], PR.ruban);                                                            // ruban
        fillPts([[-6, -33], [8, -42], [6, -20], [-4, -16]], PR.chapD);                                                          // pli du feutre
        for (const k of [0.45, 0.75]) strokePts([[-70 * k - 4, 14 - 2 * k], [0, 10 + 2 * k], [74 * k + 4, 12 - 2 * k]], 'rgba(40,46,20,0.5)', 1);
        strokePts([[-30, -26], [-34, -4]], 'rgba(220,230,180,0.25)', 2);
        hatch(null, 0.5, 3.6, 0.22); shade(0, -40, 0, 24, 0.24, [-80, -45, 80, 26]);
      } },
      armF_up: upDef([-2, -146], PR.chemise, 9211, 15),
      armF_lo: foreDef('armF_up', PR.chemise, PR.peau, false, 9212, PR.chemiseD),
    };
    Object.assign(parts, heldParts(PR.peau, 9220));
    return { hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, order: ORDER(['sac'], ['chapeau']) };
  }
  CH.pltPromeneur = mkPromeneur();
  PLT.promeneurPose = function (p) {
    const q = prep(p), A = q.ang, src = (p && p.ang) || {};
    if (q.boue == null) q.boue = 1;
    if (q.tenuB === undefined) q.tenuB = 'canne';
    const ca = ease(clamp(q.canne || 0)), lp = ease(clamp(q.leve_pied || 0)), sg = ease(clamp(q.salue_gene || 0));
    if (q.tenuB === 'canne') { if (src.armB_up == null) A.armB_up = -0.32; if (src.armB_lo == null) A.armB_lo = -0.06; }
    if (ca > 0 && q.tenuB === 'canne') { blend(q, 'armB_up', -0.6, ca); blend(q, 'armB_lo', -0.12, ca); q.tilt = (q.tilt || 0) + 0.04 * ca; }
    if (lp > 0) {
      q.tilt = (q.tilt || 0) - 0.04 * lp;
      blend(q, 'legF', -1.0, lp); blend(q, 'footF', 0.5, lp); flatFoot(q, 'legB', lp);
      A.head = (A.head || 0) + 0.36 * lp;
      if (sg === 0) { blend(q, 'armF_up', -0.55, lp); blend(q, 'armF_lo', -0.5, lp); }
      if (q.coule == null) q.coule = lp;
      if (!q.face.brow) q.face.brow = 'worry';
    }
    if (sg > 0) {
      A.head = (A.head || 0) + 0.12 * sg; q.tilt = (q.tilt || 0) + 0.05 * sg;
      armTo(q, 'armF', headPt(q, 52, -70), 'avant', sg);
      if (sg > 0.5 && !has(q.tenu) && !q.handF) q.handF = 'open';
      if (sg > 0.3) { if (!q.face.brow) q.face.brow = 'worry'; if (!q.face.mouth) q.face.mouth = 'tight'; }
    }
    return finish(q);
  };
  PLT.promeneur = (pose, x, y, s, o) => run(CH.pltPromeneur, PLT.promeneurPose(pose), x, y, s == null ? 0.9 : s, o);

  // =====================================================================
  // ACCESSOIRES SEULS (M.puppet à une pièce invisible ; l'objet se dessine dans l'extra : ombre portée possible)
  // =====================================================================
  const accDefs = {};
  function accDef(name, fn) { return accDefs[name] || (accDefs[name] = { hipY: 0, handLen: 10, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => fn(p.o) } }, order: ['o'] }); }
  function acc(name, x, y, s, o) {
    o = o || {}; s = s == null ? 0.9 : s;
    const ob = OBJ[name];
    const def = accDef(name, (oo) => { const b = typeof ob.base === 'function' ? ob.base(oo) : ob.base, c = cx_(); c.save(); c.translate(-b[0], -b[1]); ob.draw(oo); c.restore(); });
    return M.puppet(def, { o, tilt: o.rot || 0 }, x, y, s, { dir: o.dir || 1, rod: false, slot: o.slot != null ? o.slot : y + 6 * s, floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
  }
  for (const n of ['livre', 'baguette', 'canne']) PLT[n] = (x, y, s, o) => acc(n, x, y, s, o);

  // ---------------- LE RÔTI SUR SON PLAT (sans visage) ; repère : (0,0) = dessous du plat
  const RO = { argent: '#b8b8b0', argentL: '#e4e4dc', argentD: '#85857e', roti: '#b0762e', rotiD: '#7c4c1c', rotiL: '#dba45a', ficelle: '#efe6cc', herbe: '#5d7040' };
  const MEAT = [[-74, -16], [-78, -32], [-70, -52], [-46, -68], [-12, -74], [22, -73], [52, -64], [72, -46], [77, -28], [72, -16]];
  function clochePos(o) {
    const k = ease(clamp(o.cloche || 0)), t = o.t || 0, so = clamp(o.soupir || 0), tb = clamp(o.tremble || 0);
    const puff = so > 0 && k < 0.3 ? 14 * Math.sin(PI * Math.min(1, so * 1.6)) * (1 - k / 0.3) : 0;
    const dy = -16 - 200 * k - puff - Math.abs(noise(t * 30, 11)) * 3 * tb * (1 - k), rot = -0.28 * k, dx = -24 * k;
    const km = new DOMMatrix().translate(dx, dy).rotate(rot * D);
    const kn = mp(km, [0, -124]);
    return { dx, dy, rot, kx: kn[0], ky: kn[1], k };
  }
  function drawRoti(o) {
    const c = cx_(), t = o.t || 0, su = clamp(o.sueur || 0), tb = clamp(o.tremble || 0), so = clamp(o.soupir || 0), cp = clochePos(o);
    if (!SIL()) {                                                                // ombre de contact sur la nappe
      c.save(); const g = c.createRadialGradient(0, 0, 8, 0, 0, 130); g.addColorStop(0, 'rgba(40,30,20,0.35)'); g.addColorStop(1, 'rgba(40,30,20,0)');
      c.scale(1, 0.12); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 130, 0, TAU); c.fill(); c.restore();
    }
    // plat ovale d'argent : pied, ventre, marli et creux
    pc([[-56, 0, 1], [56, 0, 1], [62, -7], [-62, -7]], RO.argentD, null, 8401);
    pc(ep(0, -12, 124, 14, 16, 0, PI).concat(ep(0, -14, 124, 4, 8, PI, TAU)), RO.argent, () => { strokePts([[-110, -10], [-40, -2], [40, -2], [110, -10]], 'rgba(255,255,255,0.55)', 1.6); shade(124, 0, -124, 0, 0.25, [-126, -20, 126, 2]); }, 8402);
    pc(ell(0, -15, 122, 15, 24), RO.argentL, () => {
      fillPts(ell(0, -15, 98, 10, 20), RO.argent);
      if (!SIL()) { c.save(); c.globalAlpha = 0.55; fillPts(ell(10, -16, 80, 7, 18), 'rgba(120,70,25,0.7)'); c.restore(); }             // jus
      strokePts(ep(0, -15, 110, 12.5, 12, PI * 1.1, PI * 1.9), 'rgba(255,255,255,0.8)', 1.4);
    }, 8403);
    // pommes de terre rôties de part et d'autre
    for (const [x, sd] of [[-86, 1], [88, 2], [-62, 3]]) pc(ell(x, -20, 15, 9, 12), '#c9963e', () => { dot(x - 4, -24, 3, 'rgba(255,230,170,0.6)'); hatch(null, 0.5, 3, 0.2); }, 8410 + sd);
    // le rôti (gonfle au soupir, frémit au tremblement)
    const sw = so > 0 ? Math.sin(PI * Math.min(1, so * 1.6)) : 0, jig = noise(t * 26, 4) * 0.035 * tb;
    c.save(); c.translate(0, -16); c.scale(1 + 0.03 * sw + jig, 1 + 0.08 * sw - jig); c.translate(0, 16);
    pc(MEAT, RO.roti, () => {
      fillPts([[-78, -16], [-78, -36], [-60, -30], [-30, -24], [10, -22], [50, -26], [78, -32], [78, -16]], RO.rotiD);       // dessous caramélisé
      fillPts([[-50, -62], [-14, -70], [24, -69], [48, -60], [30, -56], [-8, -58], [-38, -54]], RO.rotiL);                    // dessus luisant
      for (const x of [-48, -16, 16, 46]) {                                                                                     // ficelle de boucher
        const h = 74 * Math.sqrt(Math.max(0, 1 - (x / 80) * (x / 80)));
        strokePts([[x - 3, -16], [x + 2, -16 - h * 0.5], [x - 1, -16 - h * 0.95]], RO.ficelle, 2.4);
        strokePts([[x - 1, -16], [x + 3, -16 - h * 0.5]], 'rgba(90,60,30,0.5)', 0.8);
      }
      for (let i = 0; i < 9; i++) dot(lerp(-60, 60, hash(i * 3.1)), lerp(-60, -26, hash(i * 7.3)), 1.4 + hash(i) * 1.6, 'rgba(70,40,15,0.5)');
      strokePts([[-40, -64], [-6, -70], [30, -68]], 'rgba(255,240,200,0.7)', 2);
      hatch(null, 0.6, 3.4, 0.22); shade(70, 0, -70, 0, 0.22, [-80, -80, 80, -14]);
    }, 8420);
    // brin de romarin
    pc(ribbon([[-14, -71], [6, -75], [30, -74]], 2.6, 1.8), RO.herbe, null, 8421, { drop: false });
    for (let i = 0; i < 7; i++) { const u = i / 6, x = lerp(-12, 26, u), y = lerp(-72, -75, u), sg = i % 2 ? 1 : -1; fillPts([[x, y], [x + 6, y + sg * 5 - 1], [x + 9, y]], i % 2 ? RO.herbe : '#728850'); }
    c.restore();
    // sueur : gouttelettes sur ce qui se voit (le rôti, ou la cloche fermée)
    const surCloche = cp.k < 0.35;
    if (su > 0.01 && !surCloche) for (let i = 0; i < 8; i++) {
      if (hash(i * 9.1 + 1) > su) continue;
      const u = (t * (0.18 + 0.12 * hash(i * 2.2)) + hash(i * 4.4)) % 1;
      goutte(lerp(-58, 58, hash(i * 3.7)), -64 + 32 * hash(i * 5.3) + u * 24, 1.9 + 1.2 * hash(i * 1.3), smooth(0, 0.15, u) * (1 - smooth(0.8, 1, u)), 1 + u * 0.5);
    }
    // cloche d'argent (au-dessus, se soulève ; petit fil de manœuvre quand elle quitte le plat)
    c.save(); c.translate(cp.dx, cp.dy); c.rotate(cp.rot);
    pc(ep(0, 0, 114, 102, 18, PI, TAU).concat(ep(0, 0, 114, 12, 10, 0, PI)), RO.argent, () => {
      if (!SIL()) {
        const g = c.createLinearGradient(-114, 0, 114, 0); g.addColorStop(0, 'rgba(60,60,55,0.45)'); g.addColorStop(0.3, 'rgba(255,255,255,0.35)'); g.addColorStop(0.42, 'rgba(255,255,255,0)');
        g.addColorStop(0.75, 'rgba(70,70,64,0.15)'); g.addColorStop(1, 'rgba(50,50,45,0.5)'); c.fillStyle = g; c.fillRect(-116, -106, 232, 120);
      }
      strokePts(ep(0, 0, 96, 86, 10, PI * 1.12, PI * 1.38), 'rgba(255,255,255,0.85)', 3);
      fillPts(ep(0, -2, 114, 12, 12, 0, PI).concat(ep(0, -10, 114, 8, 12, PI, 0)), RO.argentD);                                // bourrelet du bord
      hatch([[50, -110], [118, -110], [118, 14], [50, 14]], 0.9, 3.6, 0.18);
    }, 8440);
    pc([[-5, -100, 1], [5, -100, 1], [6, -110, 1], [-6, -110, 1]], RO.argentD, null, 8441);
    pc(ell(0, -118, 10, 9, 12), RO.argentL, () => dot(-3, -121, 2.6, 'rgba(255,255,255,0.95)'), 8442);
    if (su > 0.01 && surCloche) for (let i = 0; i < 14; i++) {
      if (hash(i * 7.7 + 2) > su) continue;
      const u = (t * (0.12 + 0.1 * hash(i * 2.9)) + hash(i * 6.1)) % 1, xx = lerp(-88, 88, hash(i * 3.3));
      const top = -102 * Math.sqrt(Math.max(0, 1 - (xx / 114) * (xx / 114)));
      goutte(xx, lerp(top + 14, -12, 0.25 + 0.55 * hash(i * 5.9)) + u * 22, 2.4 + 1.6 * hash(i * 1.9), smooth(0, 0.15, u) * (1 - smooth(0.8, 1, u)), 1 + u * 0.5);
    }
    c.restore();
    if (cp.k > 0.01 && o.fil !== false && !SIL()) {
      const kn = worldPt(cp.kx, cp.ky - 8);
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.strokeStyle = 'rgba(25,20,15,0.7)'; c.lineWidth = 1.3;
      c.beginPath(); c.moveTo(kn[0], kn[1]); c.lineTo(kn[0] + 4, 0); c.stroke(); c.restore();
    }
    // soupir : petit nuage de carton qui s'échappe (de sous la cloche si elle est fermée)
    if (so > 0.3) {
      const v = (so - 0.3) / 0.7, a = 1 - smooth(0.7, 1, v), sz = lerp(0.35, 1, ease(Math.min(1, v * 1.4)));
      const x0 = surCloche ? 112 : 50, y0 = surCloche ? -24 : -80;
      const px = lerp(x0, x0 + 70, ease(v)), py = lerp(y0, y0 - 150, ease(v));
      const pts = []; for (let i = 0; i < 22; i++) { const an = i / 22 * TAU, r = 1 + 0.18 * Math.cos(an * 6); pts.push([px + 48 * sz * r * Math.cos(an), py + 34 * sz * r * Math.sin(an)]); }
      c.save(); c.globalAlpha *= a;
      pc(pts, '#efeae0', () => { strokePts([[px - 26 * sz, py - 12 * sz], [px + 8 * sz, py - 20 * sz]], 'rgba(255,255,255,0.9)', 1.6); hatch(null, 0.5, 3.6, 0.12, 1, P.encre, [px - 50, py - 40, px + 50, py + 40]); }, 8450);
      c.restore();
    }
  }
  const ROTI_DEF = { hipY: 0, handLen: 10, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => drawRoti(p.o) } }, order: ['o'] };
  PLT.roti = function (x, y, s, o) {
    o = o || {}; s = s == null ? 0.9 : s;
    const t = o.t || 0, tb = clamp(o.tremble || 0);
    const pose = { o, tilt: (o.rot || 0) + noise(t * 29, 3) * 0.015 * tb, dx: noise(t * 23, 7) * 2.5 * tb };
    const r = M.puppet(ROTI_DEF, pose, x, y, s, { dir: o.dir || 1, rod: false, slot: y + 6 * s, floorShadow: false, cast: o.cast, alpha: o.alpha });
    const cp = clochePos(o);
    r.bouton = r.w('o', cp.kx, cp.ky); r.dessus = r.w('o', 0, -76); r.bord = r.w('o', 122, -15);
    return r;
  };

  // =====================================================================
  // DÉCORS PRÉ-RENDUS — PLT.init() → PLT.K = { table, chaise } (échelle 1, origine = bas-centre, M.withShadow)
  // =====================================================================
  const ST = M.ST;
  PLT.TABLE = { dessus: 160, demiL: 188, platDx: 40 };          // dessus de la table à ST.back − 160 ; plat posé en (x + 40, ST.back − 158)
  PLT.CHAISE = { siege: 150, dossier: 330 };
  PLT.surTable = (xt, sc) => { sc = sc == null ? 1 : sc; return [xt + PLT.TABLE.platDx * sc, ST.back - (PLT.TABLE.dessus - 2) * sc]; };
  function makeTable() {
    const top = -PLT.TABLE.dessus, R = 178;
    const cv = M.cutFlat(440, 330, 220, 320, (x) => {
      // pied central à trois griffes (sous la nappe)
      pc([[-14, -50], [14, -50], [14, -26], [60, -8], [74, 0, 1], [58, 3, 1], [20, -12], [0, -14], [-20, -12], [-58, 3, 1], [-74, 0, 1], [-60, -8], [-14, -26]], P.boisM, () => hatch(null, 0.3, 3.4, 0.3), 8501);
      // nappe blanche qui tombe en plis, bord festonné
      const hem = []; for (let i = 0; i <= 20; i++) { const xx = lerp(194, -194, i / 20); hem.push([xx, -44 + (i % 2 ? 7 : -1) + 3 * Math.sin(i * 1.7)]); }
      pc([[-R, top], [R, top], [186, top + 50], [194, -44]].concat(hem, [[-186, top + 50]]), '#f3f0e8', () => {
        const g = x.createLinearGradient(-200, 0, 200, 0); g.addColorStop(0, 'rgba(120,110,90,0.4)'); g.addColorStop(0.3, 'rgba(255,255,255,0)'); g.addColorStop(0.7, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(110,100,80,0.45)');
        x.fillStyle = g; x.fillRect(-200, top - 10, 400, 140);
        for (let i = 0; i < 10; i++) { const xx = lerp(-160, 160, i / 9); strokePts([[xx * 0.97, top + 18], [xx * 1.02, top + 70], [xx * 1.07, -48]], 'rgba(140,130,110,0.45)', 1.3); }
        for (let i = 0; i < 26; i++) dot(lerp(-188, 188, i / 25), -56 + 2 * Math.sin(i), 2.2, 'rgba(150,140,120,0.45)');     // dentelle
        strokePts([[-190, -62], [0, -64], [190, -62]], 'rgba(150,140,120,0.4)', 1);
      }, 8502);
      pc(ell(0, top, R, 20, 28), '#f8f6f0', () => { strokePts(ep(0, top, R - 10, 15, 14, PI * 0.1, PI * 0.9), 'rgba(160,150,130,0.35)', 1); hatch(null, 0, 5, 0.06); }, 8503);
      // un seul couvert : verre, assiette, fourchette, couteau
      const gx = -150, gy = top - 4;
      pc([[gx - 9, gy, 1], [gx + 9, gy, 1], [gx + 2, gy - 4], [gx + 1.5, gy - 30], [gx + 14, gy - 40], [gx + 15, gy - 66, 1], [gx - 15, gy - 66, 1], [gx - 14, gy - 40], [gx - 1.5, gy - 30], [gx - 2, gy - 4]],
        'rgba(220,235,240,0.7)', () => strokePts([[gx - 9, gy - 62], [gx - 9, gy - 44]], 'rgba(255,255,255,0.9)', 1.6), 8504, { texA: 0.2 });
      pc(ell(-110, top + 2, 46, 8, 18), '#fbfaf6', () => { strokePts(ell(-110, top + 1, 34, 5, 14).concat([[-76, top + 1]]), 'rgba(70,90,130,0.5)', 1.2); }, 8505);
      pc([[-176, top + 4, 1], [-150, top + 1, 1], [-149, top + 4, 1], [-175, top + 7, 1]], '#9a9a94', null, 8506, { drop: false });
      pc([[-66, top + 5, 1], [-36, top + 2, 1], [-34, top + 5, 1], [-64, top + 8, 1]], '#a4a49e', null, 8507, { drop: false });
    });
    cv.padB = 10; return M.withShadow(cv, 8);
  }
  function makeChaise() {
    const cv = M.cutFlat(240, 400, 120, 390, (x) => {
      const wood = '#4a2e1c', woodL = '#6a4630', vel = '#2f4058';
      pc([[-56, 0, 1], [-46, 0, 1], [-46, -150], [-50, -150]], wood, null, 8601);                                               // pied arrière
      pc([[50, 0, 1], [60, 0, 1], [58, -150, 1], [48, -150, 1]], wood, () => strokePts([[52, -10], [52, -140]], 'rgba(255,220,170,0.25)', 1.4), 8602);
      pc([[-48, -66, 1], [52, -66, 1], [52, -58, 1], [-48, -58, 1]], woodL, null, 8603);                                         // barreau
      pc([[-56, -150, 1], [-46, -150, 1], [-62, -320], [-58, -334, 1], [-70, -334, 1], [-72, -320]], wood, () => hatch(null, 0.3, 3, 0.3), 8604);   // montant du dossier
      pc(ell(-64, -342, 8, 8, 10), woodL, null, 8605);                                                                          // pomme
      pc([[-70, -306], [-52, -310], [-46, -186], [-60, -180]], vel, () => { for (const y of [-290, -250, -210]) dot(-56, y, 2.2, '#b08d45'); hatch(null, 0.6, 3.4, 0.3); }, 8606);  // dossier capitonné
      pc([[-58, -150, 1], [62, -150, 1], [64, -158], [56, -170], [0, -176], [-52, -170], [-60, -160]], vel, () => { strokePts([[-50, -168], [0, -173], [54, -167]], 'rgba(255,255,255,0.25)', 1.6); hatch(null, 0.4, 3.4, 0.25); }, 8607);
      pc([[-60, -150, 1], [64, -150, 1], [64, -140, 1], [-60, -140, 1]], woodL, null, 8608);
    });
    cv.padB = 10; return M.withShadow(cv, 8);
  }
  PLT.init = function () {
    if (PLT.K) return PLT.K;
    const K = (PLT.K = {});
    K.table = makeTable(); K.chaise = makeChaise();
    return K;
  };
})();
