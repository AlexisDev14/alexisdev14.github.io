// bibliotheque/teflon.js — personnages VALIDÉS de « Le Téflon, un frigo raté » (2026), réutilisables dans toute vidéo (chargés dans chaque plan). Espace de noms M.tef (TEF). Tout dans une IIFE.
// Chargé après marionnettes.js et bibliotheque.js, avant scene.js. Espace de noms M.tef (alias TEF). Tout dans une IIFE.
// Aucun texte, lettre, chiffre ni logo. Déterministe (hash, aucun Math.random) : S.draw reste une fonction pure de t.
// Appeler TEF.init() dans S.init (pré-rendus du labo, de la paillasse, des mors de l'étau et des poêles pendues).
//
// MARIONNETTES (avec tige ; (x,y) = pieds ; passer slot: ST.slotF ou ST.slotB). Toujours passer par l'enveloppe TEF.xxx(pose,x,y,s,o) :
// elle prépare la pose (gestes, objets tenus, seconde main). Pièces communes : armB_up armB_lo objetB legB legF head … torso armF_up armF_lo
// objet doigts doigtsB. Bras à articulations rondes (rivet au pivot). Angles : armF_up −1,57 = bras à l'horizontale vers l'avant,
// −2,5 = au-dessus de la tête ; armF_lo négatif = plier le coude ; head négatif = menton levé ; legF/legB négatif = jambe vers l'avant.
// Options de pose communes aux quatre :
//   tenu / tenuB      objet dans la main avant / arrière : 'rien'|'bouteille'|'scie'|'spatule'|'flacon'|'bocal'|'poele'|'canne'|'pinceau'
//   tenuO / tenuBO    options de l'objet tenu (les mêmes que l'accessoire seul, ex. {etat:'haut'}, {modele:'alu',oeuf:'colle',retourne:1})
//   ang.objet / ang.objetB  rotation de l'objet dans la main ; droit / droitB : true (DÉFAUT dès qu'un objet est tenu) = l'objet reste droit à l'écran ; false = il suit l'avant-bras
//   deuxMains         true = la main arrière vient d'elle-même sur la seconde prise de l'objet avant (scie : cadre près de la poignée ; bouteille : bas du corps)
//   handF / handB     'fist'|'open' (mis à 'fist' d'office quand la main tient un objet) ; face{brow,mouth,eyes} ; t (fil de pêche, vapeurs…)
//   La fonction renvoie r = M.puppet(…) + r.tenu ; TEF.pt(r,'bec'|'pointe'|'scion'|'avant'|'lame'|'robinet'|'bouche') = point écran de l'objet tenu.
//   plunkett : TEF.plunkett(pose,x,y,s,o) ; C.tefPlunkett — s 0,9 (≈ 480 px). Pièces en plus : goggles sangle (enfants de head).
//              pose.goggles 0 = lunettes de protection sur le front, 1 = sur les yeux ; pose.teteMain 0..1 (main avant posée sur le crâne,
//              perplexe) ; pose.reverence 0..1 (salut de théâtre : buste plié aux hanches, jambes droites, bras avant sur le ventre, bras arrière
//              tendu derrière, tête baissée).
//   officier : TEF.officier(pose,x,y,s,o) ; C.tefOfficier — s 0,9. Pièce en plus : casquette (enfant de head, insigne rond sans lettre).
//              pose.salut 0..1 (main avant ouverte au bord de la visière) ; tenuB:'bocal' + droitB pour tenir le bocal pendant le salut
//              (amener le bras arrière devant : ang.armB_up ≈ −1,1, armB_lo ≈ −0,5).
//   marc     : TEF.marc(pose,x,y,s,o) ; C.tefMarc — s 0,9. Pièce en plus : chapeau (bob de pêcheur). Moustache peinte.
//              pose.brandir 0..1 (bras avant levé : armF_up −2,0, armF_lo −0,85) ; pose.fier 0..1 (buste bombé, menton levé, épaules en arrière).
//              tenu 'canne' : fil vertical depuis le scion jusqu'au bouchon rouge, tenuO {fil (longueur px écran, 240), flotteY (y écran du bouchon,
//              prioritaire), t}. tenu 'pinceau' : tenuO {enduit 0..1 (pointe blanche)}.
//   colette  : TEF.colette(pose,x,y,s,o) ; C.tefColette — s 0,88. Pièce en plus : cheveux (boucles). Bouche souriante par défaut.
//              pose.hanche 0..1 (poing AVANT sur la hanche, coude en arrière) ; pose.hancheB 0..1 (poing arrière) ; pose.tendre 0..1 (bras avant
//              tendu devant, objet droit) ; la poêle tenue : tenu:'poele', tenuO {modele, oeuf, retourne 0..1 (retourner la poêle autour du manche)}.
// ACCESSOIRES (sans tige ; o.dir ±1, o.rot (rad, autour de (x,y)), o.cast, o.alpha, o.ombre (ombre au sol, false sauf frigo)) ; échelle conseillée
// 0,9 comme les marionnettes (même taille que dans la main) sauf le frigo (1).
//   TEF.frigo(x,y,s,o)      frigo « Monitor Top » de face, 230 × 430 px à s=1 ; (x,y) = bas des pieds, poser sur ST.back. SANS visage.
//                           o.porte 0..1 (pivote sur les charnières à gauche, 1 ≈ 100°) ; o.sueur 0..1 (gouttelettes qui perlent et glissent) ;
//                           o.gouttes [t0,…] ou [{t,x,r},…] (grosses gouttes : apparaissent à t0, glissent dès t0+0,7, tombent à t0+2,2) ;
//                           o.tremble 0..1 ; o.penche −1..1 (bascule sur le pied du côté penché, 1 ≈ 8°) ; o.givre 0..1 ; o.t OBLIGATOIRE.
//                           Pièces : caisson, porte, compresseur. Renvoie r (r.w('o',x,y)).
//   TEF.bouteille(x,y,s,o)  bouteille de gaz acier vert, robinet laiton (corps de vanne, buse latérale, volant à 4 rayons), 197 px local (177 px à 0,9). (x,y) = bas de la bouteille.
//                           o.etat 'entiere'|'coupee' (bas ouvert plein de poudre + haut couché à droite)|'bas'|'haut' ((x,y) = milieu de la coupe) ;
//                           o.robinet (rad, tourne le volant) ; o.poudre 0..1 (dans le bas). Coupe à y local −112 (TEF.BT.coupe).
//   TEF.balance(x,y,s,o)    balance de Roberval laiton sur socle bois, 290 × 222 local ; (x,y) = bas du socle ; o.pente −1..1 (−1 = plateau gauche en
//                           butée basse) ; aiguille sur cadran nu. Renvoie r + r.gauche / r.droite = points écran du dessus des plateaux.
//   TEF.scie(x,y,s,o)       scie à métaux, 208 local ; (x,y) = milieu de la lame. Prise de la seconde main = cadre, juste devant la poignée.
//   TEF.tas(x,y,s,o)        tas de poudre blanche lustrée ; o.taille 0..1 (largeur 160 local à 1) ; o.t. (x,y) = milieu de la base.
//   TEF.spatule(x,y,s,o)    spatule (manche bois, lame fine), 182 local ; (x,y) = prise du manche ; o.charge 0..1 (poudre sur la pointe) ;
//                           o.glisse 0..1 (la poudre file vers la pointe et tombe en grains) ; o.t.
//   TEF.bocal(x,y,s,o)      bocal en verre à bouchon de liège, 136 local ; o.poudre 0..1 ; o.acide 0..1 (liquide pâle sur la poudre) ;
//                           o.bouchon (true) ; o.vapeur 0..1 (filets de vapeur) ; o.t. (x,y) = fond.
//                           Tenu en main : la main se pose sur le flanc côté épaule (doigts couleur chair dessinés PAR-DESSUS le verre),
//                           le bocal s'étend du côté où va le bras ; forcer le flanc avec tenuO {_cote: ±1}.
//   TEF.flacon(x,y,s,o)     flacon d'acide en verre brun, étiquette nue, 122 local ; o.bouchon (true) ; o.niveau 0..1 ; o.filet 0..1 (filet qui coule
//                           du bec, toujours vertical à l'écran) ; o.filetY (y écran où le filet s'arrête) ; o.t. (x,y) = fond.
//   TEF.poele(x,y,s,o)      poêle de trois quarts, 294 local avec le manche ; (x,y) = centre de la poêle. o.modele 'alu'|'teflon' ; o.oeuf 'non'|
//                           'colle'|'glisse' ; o.oeufDx (glissement, local ±40) ; o.traine 0..1 (traînée lustrée derrière l'œuf qui glisse) ;
//                           o.oeufDy / o.oeufRot / o.oeufFlip 0..1 (saut et retournement de l'œuf) ; o.retourne 0..1 (au-delà de 0,5 on voit le DESSOUS : coque et fond ;
//                           l'œuf 'colle' dépasse sous le bord, l'œuf 'glisse' n'est plus dessiné) ; o.sens ±1 (manche vers ±x).
//   TEF.canne / TEF.pinceau (x,y,s,o)  idem, (x,y) = prise.
// DÉCORS : TEF.init() → TEF.K = { labo, paillasse, mors, poele:{alu,teflon} }
//   labo      : ctx.drawImage(TEF.K.labo, 0, 0) (toile de fond pâlie plein écran : carrelage vert d'eau et ivoire, fenêtre haute à petits
//               carreaux, étagères de fioles, tableau de cases colorées sans lettre).
//   paillasse : M.flat(TEF.K.paillasse, TEF.PAILLASSE.cx, ST.back, {cast}) — bois sombre, plateau de pierre noire x 130–560, dessus y 1150,
//               étau dont le siège est en TEF.PAILLASSE.etau = {x:290, y:1110, haut:1040} (bouteille à s 0,9 posée en (290,1110), coupe à y≈1010).
//   mors      : M.flat(TEF.K.mors, TEF.PAILLASSE.cx, ST.back) APRÈS la bouteille serrée (les mâchoires mordent ses bords).
//   poele     : poêles nues pré-rendues à ×0,9 pour M.hung(TEF.K.poele.teflon, x, y, t) ; (x,y) = bas de la cuve, x = centre
//               visuel de la poêle (cuve + manche) ; les deux fils, symétriques autour de x (±103 px), tiennent le bord de la cuve et le manche.
// AIDES : TEF.geo (ep, ell, ribbon, qbez) ; TEF.OBJ (géométrie des objets : grip, p2, points nommés).
(function () {
  'use strict';
  const X = M.X, P = M.P, TAU = M.TAU, PI = Math.PI, D = 180 / PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, hash, noise, spring, smooth } = M;
  const TEF = (M.tef = {});
  const CH = M.chars;
  const cx_ = () => M.ctx();
  const SIL = () => M._sil();
  const OFFP = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];

  // ------------------------------------------------------------ géométrie
  function ep(cx, cy, rx, ry, n, a0, a1) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; }
  function ell(cx, cy, rx, ry, n) { const o = ep(cx, cy, rx, ry, n || 16, 0, TAU); o.pop(); return o; }
  const scl = (pts, sx, sy) => { sy = sy == null ? sx : sy; return pts.map((p) => (p[2] ? [p[0] * sx, p[1] * sy, 1] : [p[0] * sx, p[1] * sy])); };
  const tr = (pts, dx, dy) => pts.map((p) => (p[2] ? [p[0] + dx, p[1] + dy, 1] : [p[0] + dx, p[1] + dy]));
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
  function rrect(x0, y0, x1, y1, r) {                                          // rectangle aux angles arrondis
    return ep(x1 - r, y0 + r, r, r, 4, -PI / 2, 0).concat(ep(x1 - r, y1 - r, r, r, 4, 0, PI / 2), ep(x0 + r, y1 - r, r, r, 4, PI / 2, PI), ep(x0 + r, y0 + r, r, r, 4, PI, PI * 1.5));
  }
  function zig(x0, x1, y, n, amp, seed) {                                      // bord dentelé (coupe de scie)
    const o = []; for (let i = 0; i <= n; i++) o.push([lerp(x0, x1, i / n), y + (i % 2 ? -amp : amp * 0.4) * (0.6 + 0.4 * hash(i + seed)), 1]); return o;
  }
  TEF.geo = { ep, ell, ribbon, qbez, rrect };
  const pc = (pts, base, paint, seed, o) => piece(pts, base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));
  function worldPt(x, y) { return mp(cx_().getTransform(), [x, y]); }

  // bras à articulations rondes (épaule et coude en demi-cercles centrés sur le pivot)
  const R_COUDE = 11.5, LA = 96, LB = Math.hypot(4, 96), PHI = Math.atan2(-4, 96), SH_F = [-2, -146], SH_B = [-10, -146];
  function armR(len, wt) { wt = wt || 15; return ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1, 40], [R_COUDE + 0.5, len - 6]], ep(0, len, R_COUDE, R_COUDE, 10, 0, PI), [[-R_COUDE - 0.5, len - 6], [-wt + 1, 40]]); }
  function foreR(kind) { const f = X.forePts(kind); return ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU).concat(f.slice(2)); }
  // IK deux segments dans le repère du torse ; pick 'bas' (coude le plus bas), 'avant' (coude devant), 'arriere' (coude derrière)
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
  // OBJETS — chaque objet se dessine dans son repère (piece + peintures) : seul (accessoire) ou tenu (pièce 'objet' de l'avant-bras)
  // =====================================================================
  const POUDRE = '#f2efe6';
  // ---------------- bouteille de gaz
  const BT = { coupe: -112, vert: P.vert, laiton: '#b08d45', laitonL: '#d9bd72', laitonD: '#76592a' };
  TEF.BT = BT;
  const BT_FULL = [[-29, -6], [-26, 0, 1], [26, 0, 1], [29, -6], [29, -116], [25, -130], [16, -140], [9, -145, 1], [-9, -145, 1], [-16, -140], [-25, -130], [-29, -116]];
  function btPaint(y0, y1) {
    return () => {
      fillPts([[-19, y0], [-12, y0], [-12, y1], [-19, y1]], 'rgba(170,200,170,0.32)');
      if (y0 > -62 && y1 < -70) { fillPts([[-32, -70, 1], [32, -70, 1], [32, -61, 1], [-32, -61, 1]], '#d9cfb2'); strokePts([[-30, -66], [30, -66]], 'rgba(120,100,70,0.35)', 1); }
      strokePts([[-30, -116], [30, -116]], 'rgba(10,20,14,0.5)', 1.2);
      hatch([[8, y1 - 10], [32, y1 - 10], [32, y0 + 6], [8, y0 + 6]], 0.9, 3.6, 0.32);
      shade(29, 0, -29, 0, 0.3, [-32, y1 - 12, 32, y0 + 8]);
    };
  }
  function btValve(o) {                                                        // robinet de bouteille : écrou, corps de vanne, buse latérale, volant à 4 rayons
    const rb = o.robinet || 0, yw = -191;
    pc([[-11, -144, 1], [11, -144, 1], [11, -151, 1], [-11, -151, 1]], BT.laitonD, () => strokePts([[-9, -147.5], [9, -147.5]], 'rgba(255,230,170,0.35)', 1), 5101);
    pc([[19, -171, 1], [26, -172, 1], [26, -160, 1], [19, -161, 1]], BT.laitonD, () => strokePts([[26, -169], [26, -163]], '#2a1e0c', 2), 5102);
    pc([[6, -170, 1], [20, -169, 1], [20, -162, 1], [6, -163, 1]], BT.laiton, () => strokePts([[8, -168], [19, -167.5]], 'rgba(255,240,190,0.6)', 1.2), 5108);
    pc([[-7, -151, 1], [7, -151, 1], [8, -156], [8, -178], [7, -182, 1], [-7, -182, 1], [-8, -178], [-8, -156]], BT.laiton, () => {
      strokePts([[-4, -154], [-4, -179]], 'rgba(255,240,190,0.65)', 1.6);
      strokePts([[-8, -158], [8, -158]], 'rgba(60,40,12,0.45)', 1); strokePts([[-8, -176], [8, -176]], 'rgba(60,40,12,0.45)', 1);
      shade(8, 0, 0, 0, 0.3, [-9, -184, 9, -150]);
    }, 5109);
    pc([[-2.5, -181, 1], [2.5, -181, 1], [2.5, yw + 2, 1], [-2.5, yw + 2, 1]], BT.laitonD, null, 5103, { drop: false });
    pc(ep(0, yw, 19, 6, 16, PI, TAU).concat(ep(0, yw + 2.6, 19, 6, 16, 0, PI)), BT.laitonD, () => {
      fillPts(ell(0, yw, 19, 6, 24), BT.laiton);
      fillPts(ell(0, yw, 14.5, 3.9, 20), '#2c2214');
      for (let k = 0; k < 4; k++) { const a = rb + k * PI / 2; strokePts([[0, yw], [14.8 * Math.cos(a), yw + 4 * Math.sin(a)]], BT.laiton, 2.4); }
      dot(0, yw, 3.2, BT.laitonL);
      strokePts(ep(0, yw, 17, 5, 10, PI * 1.1, PI * 1.6), 'rgba(255,240,190,0.75)', 1.3);
    }, 5104);
  }
  function btOpening(y, k) {                                                   // ouverture vue de trois quarts (poudre dedans si k > 0)
    fillPts(ell(0, y, 27, 5.5, 16), '#141a16');
    if (k > 0) { fillPts(ell(0, y + 1, 24, 4.4, 16), POUDRE); fillPts(ep(0, y + 1, 17 * k, 7 * k, 8, PI, TAU), POUDRE); strokePts(ep(-3, y - 1, 9 * k, 4 * k, 6, PI * 1.1, PI * 1.7), 'rgba(255,255,255,0.9)', 1.4); }
    strokePts(ell(0, y, 27, 5.5, 18).concat([[27, y]]), 'rgba(200,215,200,0.6)', 1.1);
  }
  function drawBouteille(o) {
    const c = cx_(), e = o.etat || 'entiere';
    const bas = () => {
      const pts = [[-29, -6], [-26, 0, 1], [26, 0, 1], [29, -6], [29, BT.coupe, 1]].concat(zig(29, -29, BT.coupe, 10, 3.5, 7), [[-29, BT.coupe, 1]]);
      pc(pts, BT.vert, btPaint(0, BT.coupe), 5105);
      btOpening(BT.coupe + 1, o.poudre == null ? 1 : o.poudre);
    };
    const haut = () => {                                                       // repère : milieu de la coupe en (0,0)
      c.save(); c.translate(0, -BT.coupe);
      const pts = zig(-29, 29, BT.coupe, 10, 3.5, 7).concat([[29, -116], [25, -130], [16, -140], [9, -145, 1], [-9, -145, 1], [-16, -140], [-25, -130], [-29, -116]]);
      pc(pts, BT.vert, btPaint(BT.coupe, -145), 5106);
      btValve(o);
      c.restore();
    };
    if (e === 'bas') return bas();
    if (e === 'haut') return haut();
    if (e === 'coupee') {
      bas();
      c.save(); c.translate(84, -29); c.rotate(PI / 2); haut(); fillPts(ell(0, 0, 27, 5.5, 14), '#141a16'); c.restore();
      return;
    }
    pc(BT_FULL, BT.vert, btPaint(0, -145), 5107);
    btValve(o);
  }
  // ---------------- scie à métaux (repère : début de la lame en (0,0), lame vers +x)
  const SC_HANDLE = [[-4, -30], [8, -30], [8, -6], [2, 8], [-8, 38], [-22, 46, 1], [-30, 40], [-22, 8], [-14, -8], [-16, -26]];
  function drawScie() {
    const fr = [[0, 3]].concat(qbez([0, -24], [88, -80], [176, -24], 14), [[176, 3]]);
    pc([[-2, -3, 1], [178, -3, 1], [178, 3, 1], [-2, 3, 1]], '#a3abb0', () => strokePts([[2, -1], [176, -1]], 'rgba(255,255,255,0.5)', 1), 5201, { drop: false });
    const teeth = []; for (let x = 2; x <= 176; x += 4) teeth.push([x, (x / 4) % 2 ? 6 : 3]);
    strokePts(teeth, 'rgba(60,64,70,0.9)', 1.1);
    pc(ribbon(fr, 6.5, 6.5), '#45484d', () => { strokePts(fr.map((p) => [p[0], p[1] - 1.5]), 'rgba(220,225,230,0.35)', 1); }, 5202);
    pc([[170, -22], [182, -22], [186, -15], [182, -8], [170, -8], [166, -15]], '#5a5e64', () => dot(176, -15, 2, '#2a2c30'), 5203);
    pc([[183, -18], [194, -24, 1], [196, -18], [186, -14]], '#5a5e64', null, 5204);
    dot(176, 0, 2.2, '#d9d9d9'); dot(2, 0, 2.2, '#d9d9d9');
    pc(SC_HANDLE, '#6a4428', () => { strokePts([[-12, -24], [-18, 30]], 'rgba(255,220,170,0.3)', 2); hatch(null, 0.3, 3.4, 0.3); dot(-6, -14, 2, '#c9c0a8'); dot(-12, 10, 2, '#c9c0a8'); }, 5205);
  }
  // ---------------- spatule (repère : prise du manche en (0,0), lame vers +x)
  function drawSpatule(o) {
    const c = cx_(), t = o.t || 0, ch = clamp(o.charge || 0), gl = clamp(o.glisse || 0);
    pc([[30, -3], [104, -4], [126, -8], [140, -7], [146, -2], [140, 4], [126, 5], [104, 3], [30, 3]], '#b8bcc0', () => strokePts([[34, -1], [140, -3]], 'rgba(255,255,255,0.6)', 1.2), 5301);
    pc([[20, -6, 1], [32, -6, 1], [32, 6, 1], [20, 6, 1]], BT.laiton, null, 5302);
    pc([[-40, -2], [-36, -7], [20, -7, 1], [20, 7, 1], [-36, 7], [-40, 2]], '#6a4428', () => { strokePts([[-34, -3], [18, -3]], 'rgba(255,220,170,0.3)', 1.6); hatch(null, 0.2, 3.2, 0.3); }, 5303);
    if (ch > 0.02) {                                                           // tas de poudre sur la pointe (file vers le bout quand ça glisse)
      const dx = 26 * gl, k = ch * (1 - 0.55 * gl);
      const tas = [[104 + dx, -3], [110 + dx, -3 - 9 * k], [122 + dx, -4 - 14 * k], [134 + dx + 6 * gl, -3 - 9 * k], [142 + dx + 10 * gl, -2 + 4 * gl]];
      pc(tas.concat([[142 + dx, 0], [104 + dx, 0]]), POUDRE, () => strokePts([[110 + dx, -4 - 7 * k], [121 + dx, -4 - 12 * k]], 'rgba(255,255,255,0.95)', 1.4), 5304, { texA: 0.35 });
      if (gl > 0.05 && !SIL()) {                                                // grains qui tombent de la pointe, verticaux à l'écran
        const tip = worldPt(146, 0), sc = Math.hypot(c.getTransform().a, c.getTransform().b);
        c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
        for (let i = 0; i < 9; i++) { const u = (t * 1.6 + i / 9) % 1; c.globalAlpha = gl * (1 - u); c.beginPath(); c.arc(tip[0] + (hash(i * 3.3) - 0.5) * 8 * sc, tip[1] + u * 90 * sc, (1.4 + hash(i) * 1.4) * sc, 0, TAU); c.fillStyle = POUDRE; c.fill(); }
        c.restore();
      }
    }
  }
  // ---------------- tas de poudre (repère : milieu de la base)
  function tasPts(k) {
    const w = 80 * k, h = 52 * k, o = [[-w - 4, 0, 1]];
    for (let i = 0; i <= 16; i++) { const u = i / 16, x = lerp(-w, w, u), b = Math.pow(Math.max(0, 1 - Math.pow((x / w), 2)), 0.85); o.push([x, -h * b - 2.5 * Math.sin(i * 2.1) * b]); }
    o.push([w + 4, 0, 1]); return o;
  }
  function drawTas(o) {
    const k = clamp(o.taille == null ? 1 : o.taille, 0.05, 1.4), w = 80 * k, h = 52 * k;
    pc(tasPts(k), POUDRE, () => {
      shade(w, -h, -w * 0.3, 0, 0.18, [-w - 6, -h - 6, w + 6, 4], '90,90,110');
      hatch([[w * 0.1, -h], [w + 6, -h], [w + 6, 4], [w * 0.1, 4]], 0.7, 3.4, 0.16);
      strokePts(ep(-w * 0.15, -h * 0.1, w * 0.62, h * 0.82, 10, PI * 1.08, PI * 1.45), 'rgba(255,255,255,0.95)', 2.4);
      strokePts(ep(-w * 0.1, -h * 0.05, w * 0.45, h * 0.6, 8, PI * 1.15, PI * 1.4), 'rgba(255,255,255,0.7)', 1.2);
    }, 5401, { texA: 0.35 });
    for (let i = 0; i < 9; i++) dot(lerp(-w - 14, w + 14, hash(i * 7.1 + 2)), -1 - hash(i * 3.3) * 3, 1.3 + hash(i) * 1.2, POUDRE);
  }
  // ---------------- bocal (repère : fond)
  const VERRE = 'rgba(206,226,228,0.55)';
  function drawBocal(o) {
    const c = cx_(), t = o.t || 0, q = clamp(o.poudre == null ? 1 : o.poudre), ac = clamp(o.acide || 0);
    const body = [[-42, -8], [-38, 0, 1], [38, 0, 1], [42, -8], [42, -100], [36, -110], [30, -114, 1], [-30, -114, 1], [-36, -110], [-42, -100]];
    pc(body, VERRE, () => {
      const yp = -6 - 56 * q;
      if (q > 0.02) { fillPts([[-44, 2], [44, 2], [44, yp + 4], [20, yp - 2], [-8, yp - 4], [-44, yp + 2]], POUDRE); strokePts([[-36, yp + 3], [-8, yp - 2], [20, yp]], 'rgba(255,255,255,0.9)', 1.3); hatch([[10, yp], [44, yp], [44, 2], [10, 2]], 0.7, 3.4, 0.14); }
      if (ac > 0.02) { const ya = yp - 34 * ac; fillPts([[-44, yp + 2], [44, yp + 2], [44, ya], [-44, ya]], 'rgba(214,200,120,0.45)'); strokePts([[-40, ya], [40, ya]], 'rgba(255,250,210,0.7)', 1.2); }
      strokePts([[-30, -10], [-30, -96]], 'rgba(255,255,255,0.75)', 2.6); strokePts([[-22, -20], [-22, -60]], 'rgba(255,255,255,0.4)', 1.4);
      shade(42, 0, 10, 0, 0.22, [-44, -116, 44, 4], '60,80,90');
    }, 5501, { texA: 0.18 });
    pc([[-33, -114, 1], [33, -114, 1], [33, -121, 1], [-33, -121, 1]], 'rgba(200,222,226,0.75)', null, 5502, { texA: 0.2 });
    if (o.bouchon !== false) pc([[-27, -120, 1], [27, -120, 1], [24, -136, 1], [-24, -136, 1]], '#b98b5a', () => { for (let i = 0; i < 14; i++) dot(-20 + hash(i * 2.7) * 40, -122 - hash(i * 5.1) * 12, 1.2, 'rgba(90,55,25,0.6)'); hatch(null, 0.2, 3.4, 0.2); }, 5503);
    if (o._cote) {                                                             // main posée sur le flanc, par-dessus le verre (doigts qui l'enserrent)
      const cs = o._cote, hx = 42 * cs, L = [24, 28, 27, 22], pts = [[hx + 9 * cs, -75, 1]];
      for (let i = 0; i < 4; i++) { const y0 = -75 + i * 9.25; pts.push([hx - (L[i] - 4) * cs, y0 + 0.8], [hx - L[i] * cs, y0 + 4.6], [hx - (L[i] - 4) * cs, y0 + 8.4]); }
      pts.push([hx + 9 * cs, -38, 1]);
      pc(pts, o._peau || '#e8c4a0', () => {
        for (let i = 1; i < 4; i++) { const y0 = -75 + i * 9.25; strokePts([[hx + 7 * cs, y0], [hx - (Math.min(L[i], L[i - 1]) - 5) * cs, y0]], 'rgba(90,50,35,0.6)', 1.1); }
        strokePts(pts.concat([pts[0]]), 'rgba(80,45,30,0.75)', 1.4);
        hatch(null, 0.9, 3.4, 0.15);
      }, 5904);
    }
    const va = clamp(o.vapeur || 0);
    if (va > 0.02 && !SIL()) {                                                  // vapeurs : montent à la verticale de l'écran
      const m = worldPt(0, -122), sc = Math.hypot(c.getTransform().a, c.getTransform().b);
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        const u = (t * 0.45 + i / 3) % 1, x0 = m[0] + (i - 1) * 14 * sc, y0 = m[1] - u * 70 * sc;
        c.beginPath(); for (let j = 0; j <= 8; j++) { const yy = y0 - j * 6 * sc, xx = x0 + Math.sin(t * 2.4 + i * 2 + j * 0.7) * 6 * sc * (j / 8); if (j) c.lineTo(xx, yy); else c.moveTo(xx, yy); }
        c.strokeStyle = `rgba(240,240,232,${0.55 * va * Math.sin(PI * u)})`; c.lineWidth = (5 + 4 * u) * sc; c.stroke();
      }
      c.restore();
    }
  }
  // ---------------- flacon d'acide (repère : fond)
  function filetEcran(p0, yEnd, t, w, k) {                                     // filet de liquide vertical à l'écran (dessin brut, gardé)
    if (SIL() || k <= 0.02 || yEnd <= p0[1]) return;
    const c = cx_(); c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    const n = 16, L = [];
    for (let i = 0; i <= n; i++) { const u = i / n; L.push([p0[0] + 5 * u * (1 - u) * 4 + Math.sin(t * 11 + i * 1.3) * 1.1 * u, lerp(p0[1], yEnd, u)]); }
    const R = ribbon(L, w * k, w * 0.7 * k);
    c.beginPath(); R.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
    c.fillStyle = 'rgba(218,204,128,0.9)'; c.fill();
    c.beginPath(); L.forEach((p, i) => (i ? c.lineTo(p[0] - w * 0.15, p[1]) : c.moveTo(p[0] - w * 0.15, p[1]))); c.strokeStyle = 'rgba(255,252,225,0.75)'; c.lineWidth = 1; c.stroke();
    for (let i = 0; i < 4; i++) { const a = -PI / 2 + (i - 1.5) * 0.7, r = 5 + 4 * Math.abs(Math.sin(t * 13 + i)); c.beginPath(); c.arc(L[n][0] + Math.cos(a) * r, yEnd + Math.sin(a) * r * 0.6, 1.6, 0, TAU); c.fillStyle = 'rgba(225,212,140,0.85)'; c.fill(); }
    c.restore();
  }
  function drawFlacon(o) {
    const c = cx_(), t = o.t || 0, niv = clamp(o.niveau == null ? 0.7 : o.niveau);
    const body = [[-26, -5], [-22, 0, 1], [22, 0, 1], [26, -5], [26, -74], [22, -82], [12, -90], [9, -96], [9, -100, 1], [-9, -100, 1], [-9, -96], [-12, -90], [-22, -82], [-26, -74]];
    pc(body, '#7a4a22', () => {
      fillPts([[-28, 2], [28, 2], [28, -4 - 70 * niv], [-28, -4 - 70 * niv]], 'rgba(45,22,8,0.4)');
      fillPts([[-18, -64, 1], [18, -64, 1], [18, -28, 1], [-18, -28, 1]], '#e6dcc2');
      strokePts([[-15, -61, 1], [15, -61, 1], [15, -31, 1], [-15, -31, 1], [-15, -61, 1]], '#8e2f2b', 1.6);
      strokePts([[-19, -8], [-19, -70]], 'rgba(255,230,190,0.55)', 2.4); strokePts([[-6, -86], [-4, -96]], 'rgba(255,230,190,0.5)', 1.4);
      hatch([[6, -100], [28, -100], [28, 2], [6, 2]], 0.9, 3.4, 0.3);
    }, 5601, { texA: 0.3 });
    pc([[-12, -100, 1], [12, -100, 1], [12, -106, 1], [-12, -106, 1]], '#6a3e1b', null, 5602);
    if (o.bouchon !== false) pc([[-7, -106, 1], [7, -106, 1], [10, -114], [6, -122, 1], [-6, -122, 1], [-10, -114]], '#8a5a2e', () => strokePts([[-4, -110], [-3, -119]], 'rgba(255,230,190,0.6)', 1.2), 5603, { texA: 0.3 });
    const k = clamp(o.filet || 0);
    if (k > 0.02) { const b = worldPt(12, -104), sc = Math.hypot(c.getTransform().a, c.getTransform().b); filetEcran(b, o.filetY != null ? o.filetY : b[1] + 160 * sc, t, 5.5 * sc, k); }
  }
  // ---------------- poêle (repère : centre de la poêle ; manche vers +x si sens 1)
  const EGG = [[-30, 1], [-26, -6], [-14, -10], [0, -11], [14, -9], [26, -6], [31, 0], [27, 6], [14, 9], [2, 11], [-12, 10], [-25, 7]];
  function drawPoele(o) {
    const c = cx_(), alu = o.modele === 'alu', sens = o.sens == null ? 1 : o.sens, ret = clamp(o.retourne || 0);
    const PO = alu ? { out: '#a9a7a0', inn: '#cfccc4', fond: '#dddad2', man: '#6a4428' } : { out: '#2b2b30', inn: '#34343a', fond: '#3c3c43', man: '#1e1d20' };
    c.save(); c.scale(sens, 1);
    const kf = Math.cos(PI * ret), dessous = kf < 0, oe = o.oeuf || 'non';
    if (ret > 0) { c.translate(0, -14); c.scale(1, Math.max(0.12, Math.abs(kf))); c.translate(0, 14); }
    pc([[58, -11], [120, -17], [212, -29], [224, -27], [229, -20], [223, -13], [120, -3], [58, 3]], PO.man, () => {
      strokePts([[66, -9], [120, -14], [212, -25]], alu ? 'rgba(255,220,170,0.35)' : 'rgba(255,255,255,0.18)', 1.6);
      if (alu) hatch(null, 0.15, 3.2, 0.3); dot(216, -20, 3.6, '#14110f');
    }, 5701);
    if (dessous) {                                                            // retournée : on voit le fond, le bord en bas
      if (oe === 'colle') {                                                    // l'œuf collé dépasse sous le bord, il ne tombe pas
        pc(ep(-4, 22, 40, 10, 14, 0, PI).concat(ep(-4, 22, 40, 4, 10, PI, TAU)), '#f3efe4', () => { strokePts(ep(-4, 22, 39, 9, 12, 0.05 * PI, 0.95 * PI), '#8a5626', 3.4); for (let i = 0; i < 5; i++) dot(lerp(-34, 28, hash(i * 3.1)), 26 + hash(i * 7.7) * 4, 1.6, 'rgba(150,95,40,0.6)'); }, 5705, { texA: 0.35 });
        pc(ep(6, 30, 9, 6, 10, 0, PI).concat([[-3, 26], [15, 26]]), '#e0a83a', null, 5706, { texA: 0.3 });
      }
      pc(ep(0, -22, 60, 19, 16, PI, TAU).concat(ep(0, 0, 72, 26, 16, 0, PI)), PO.out, () => {
        shade(72, 0, -72, 0, 0.32, [-74, -44, 74, 28]);
        hatch([[20, -44], [74, -44], [74, 28], [20, 28]], 0.9, 3.4, alu ? 0.2 : 0.12, 1, alu ? P.encre : '200,200,210');
      }, 5707);
      fillPts(ell(0, -22, 57, 17.5, 24), alu ? '#c3c0b8' : '#37373d');
      if (alu) { for (const k of [0.3, 0.55, 0.8]) strokePts(ell(0, -22, 57 * k, 17.5 * k, 20).concat([[57 * k, -22]]), 'rgba(90,85,75,0.35)', 1); strokePts(ep(0, -22, 50, 14, 10, PI * 1.15, PI * 1.5), 'rgba(255,255,255,0.7)', 2); }
      else strokePts(ep(0, -22, 46, 12, 10, PI * 1.1, PI * 1.5), 'rgba(255,255,255,0.18)', 2);
      strokePts(ep(0, 0, 71, 25, 16, 0, PI), alu ? 'rgba(250,250,245,0.8)' : 'rgba(150,150,160,0.55)', 2.2);
      c.restore(); return;
    }
    pc(ep(0, 0, 72, 26, 16, PI, TAU).concat(ep(0, 22, 60, 19, 16, 0, PI)), PO.out, () => {
      shade(72, 0, -72, 0, 0.32, [-74, -28, 74, 44]);
      hatch([[20, 0], [74, 0], [74, 44], [20, 44]], 0.9, 3.4, alu ? 0.2 : 0.12, 1, alu ? P.encre : '200,200,210');
    }, 5702);
    fillPts(ell(0, 0, 67, 22.5, 28), PO.inn);
    fillPts(ell(0, 7, 56, 16, 24), PO.fond);
    if (alu) { for (const k of [0.3, 0.55, 0.8]) strokePts(ell(0, 7, 56 * k, 16 * k, 20).concat([[56 * k, 7]]), 'rgba(255,255,255,0.35)', 1); strokePts(ep(0, 0, 60, 19, 10, PI * 1.15, PI * 1.55), 'rgba(255,255,255,0.8)', 2); }
    else { strokePts(ep(0, 7, 48, 12, 10, PI * 1.1, PI * 1.5), 'rgba(255,255,255,0.22)', 2.2); strokePts(ep(0, 7, 30, 8, 8, PI * 0.15, PI * 0.5), 'rgba(255,255,255,0.12)', 1.6); }
    strokePts(ell(0, 0, 70, 25, 28).concat([[70, 0]]), alu ? 'rgba(250,250,245,0.8)' : 'rgba(150,150,160,0.55)', 2.2);
    dot(62, -4, 2.4, alu ? '#e8e4da' : '#77777e'); dot(63, 3, 2.4, alu ? '#e8e4da' : '#77777e');
    if (oe !== 'non') {
      const ex = o.oeufDx || 0, ey = 7 + (o.oeufDy || 0), fl = Math.cos(PI * (o.oeufFlip || 0));
      if (oe === 'glisse' && (o.traine || 0) > 0.02) { const x0 = Math.min(0, ex) - 14; fillPts(ribbon([[x0, 8], [ex, ey + 1]], 10, 18), `rgba(255,250,232,${0.28 * clamp(o.traine)})`); }
      if (oe === 'colle') fillPts(scl(EGG, 1.14, 1.3), 'rgba(110,62,22,0.55)');
      c.save(); c.translate(ex, ey); c.rotate(o.oeufRot || 0); c.scale(1, Math.abs(fl) < 0.08 ? 0.08 * Math.sign(fl || 1) : fl);
      pc(EGG, '#f3efe4', () => {
        if (oe === 'colle') { strokePts(EGG.concat([EGG[0]]), '#8a5626', 3.6); for (let i = 0; i < 6; i++) dot(lerp(-24, 24, hash(i * 3.1)), lerp(-6, 7, hash(i * 7.7)), 1.6 + hash(i) * 1.4, 'rgba(150,95,40,0.6)'); }
        strokePts([[-18, -4], [-6, -7]], 'rgba(255,255,255,0.9)', 1.4);
      }, 5703, { texA: 0.35 });
      if (fl > 0) pc(ell(3, -3, 9.5, 6.5, 12), '#e0a83a', () => { dot(0, -5.5, 2.3, 'rgba(255,240,200,0.85)'); shade(10, 0, -6, 0, 0.25, [-8, -11, 14, 5]); }, 5704, { texA: 0.3 });
      c.restore();
    }
    c.restore();
  }
  // ---------------- canne à pêche (repère : prise, la canne monte vers l'avant à ≈ 34°)
  const CANNE_A = -0.6, CANNE_L = 430;
  function drawCanne(o) {
    const c = cx_(), t = o.t || 0;
    c.save(); c.rotate(CANNE_A);
    pc(ribbon([[-46, 0], [40, 0], [200, 0], [CANNE_L, 0]], 11, 3), '#c9a865', () => {
      for (let x = 60; x < CANNE_L; x += 62) strokePts([[x, -5], [x, 5]], 'rgba(90,60,20,0.65)', 1.6);
      strokePts([[-40, -2], [CANNE_L - 6, -0.6]], 'rgba(255,240,200,0.5)', 1.2);
      fillPts([[-50, -8], [24, -8], [24, 8], [-50, 8]], '#a77b4e'); hatch([[-50, -8], [24, -8], [24, 8], [-50, 8]], 0.4, 2.6, 0.25);
    }, 5801);
    pc(ell(-30, 11, 9, 9, 12), '#4a4d52', () => dot(-30, 11, 3, '#9aa0a4'), 5802);
    for (const x of [120, 260, 380]) strokePts([[x, 0], [x, 6]], '#5a5e64', 1.2);
    const tip = worldPt(CANNE_L, 0), sc = Math.hypot(c.getTransform().a, c.getTransform().b);
    c.restore();
    if (SIL()) return;
    const yb = (o.flotteY != null ? o.flotteY : tip[1] + (o.fil == null ? 240 : o.fil)) + 3 * Math.sin(t * 2.6);
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    c.beginPath(); c.moveTo(tip[0], tip[1]); c.quadraticCurveTo(tip[0] + 6, (tip[1] + yb) / 2, tip[0] + 2, yb - 10 * sc); c.strokeStyle = 'rgba(235,230,215,0.8)'; c.lineWidth = 1.2; c.stroke();
    const bx = tip[0] + 2, by = yb;
    c.beginPath(); c.ellipse(bx, by, 7 * sc, 9 * sc, 0, PI, TAU); c.fillStyle = '#b5332c'; c.fill();
    c.beginPath(); c.ellipse(bx, by, 7 * sc, 9 * sc, 0, 0, PI); c.fillStyle = '#ece6d6'; c.fill();
    c.strokeStyle = 'rgba(30,15,10,0.7)'; c.lineWidth = 1.4; c.beginPath(); c.ellipse(bx, by, 7 * sc, 9 * sc, 0, 0, TAU); c.stroke();
    c.beginPath(); c.moveTo(bx, by - 9 * sc); c.lineTo(bx, by - 15 * sc); c.stroke();
    c.restore();
  }
  // ---------------- pinceau (repère : prise)
  function drawPinceau(o) {
    pc([[-60, -3], [-56, -6], [40, -5, 1], [40, 5, 1], [-56, 6], [-60, 3]], '#8a5a2e', () => strokePts([[-54, -2], [38, -2]], 'rgba(255,220,170,0.35)', 1.4), 5901);
    pc([[40, -6, 1], [56, -7, 1], [56, 7, 1], [40, 6, 1]], '#b9b6ae', () => strokePts([[42, -3], [54, -4]], 'rgba(255,255,255,0.6)', 1.2), 5902);
    pc([[56, -7], [80, -8], [94, -3], [96, 0, 1], [94, 3], [80, 8], [56, 7]], '#6b5234', () => {
      for (const y of [-5, -2, 1, 4]) strokePts([[58, y], [92, y * 0.5]], 'rgba(30,20,10,0.5)', 0.9);
      const e = clamp(o.enduit == null ? 1 : o.enduit); if (e > 0) fillPts([[74, -9], [98, -5], [98, 5], [74, 9]], `rgba(242,239,230,${e})`);
    }, 5903);
  }
  // registre : grip = point tenu dans le poing ; p2 = seconde prise ; pts = points nommés ; base = origine de l'accessoire seul ; held = options par défaut en main
  const OBJ = {
    bouteille: { draw: drawBouteille, grip: [0, -74], p2: () => [0, -24], pts: { robinet: [0, -191], bouche: [0, -112] }, base: [0, 0] },
    scie: { draw: drawScie, grip: [-14, 22], p2: () => [60, -44], pts: { avant: [176, -14], lame: [88, 3] }, base: [88, 0] },
    spatule: { draw: drawSpatule, grip: [0, 0], pts: { pointe: [146, 0] }, base: [0, 0] },
    tas: { draw: drawTas, grip: [0, 0], pts: {}, base: [0, 0] },
    bocal: { draw: drawBocal, grip: (o) => [42 * (o._cote || 0), -56], pts: { bouche: [0, -122] }, base: [0, 0] },
    flacon: { draw: drawFlacon, grip: [0, -44], pts: { bec: [12, -104] }, base: [0, 0] },
    poele: { draw: drawPoele, grip: (o) => [165 * (o.sens == null ? 1 : o.sens), -14], held: { sens: -1 }, pts: { centre: [0, 0] }, base: [0, 0] },
    canne: { draw: drawCanne, grip: [0, 0], pts: { scion: [CANNE_L * Math.cos(CANNE_A), CANNE_L * Math.sin(CANNE_A)] }, base: [0, 0] },
    pinceau: { draw: drawPinceau, grip: [0, 0], pts: { pointe: [96, 0] }, base: [0, 0] },
  };
  TEF.OBJ = OBJ;
  const gripOf = (ob, o) => (typeof ob.grip === 'function' ? ob.grip(o) : ob.grip);
  function heldOpts(name, o, p) { const ob = OBJ[name]; return Object.assign({ t: p.t || 0 }, ob.held || {}, o || {}); }
  function heldDraw(name, o, p) {
    const ob = OBJ[name]; if (!ob) return;
    const oo = heldOpts(name, o, p), g = gripOf(ob, oo), c = cx_();
    c.save(); c.translate(-g[0], -g[1]); ob.draw(oo); c.restore();
  }
  const DOIGTS = [[-13, -9], [9, -11], [12, -4], [12, 6], [6, 11], [-6, 11], [-13, 4]];
  const doigtsPaint = () => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(70,40,30,0.5)', 1); hatch(null, 0.9, 3.4, 0.15); };
  function heldParts(skin, seed) {
    const has = (v) => v && v !== 'rien';
    return {
      objet: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (has(p.tenu)) heldDraw(p.tenu, Object.assign({ _peau: skin }, p.tenuO), p); } },
      doigts: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 2, pts: (p) => (has(p.tenu) && p.tenu !== 'bocal' ? DOIGTS : OFFP), paint: doigtsPaint },
      objetB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 3, pts: OFFP, extra: (p) => { if (has(p.tenuB)) heldDraw(p.tenuB, Object.assign({ _peau: skin }, p.tenuBO), p); } },
      doigtsB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 4, pts: (p) => ((has(p.tenuB) && p.tenuB !== 'bocal') || p._deux ? DOIGTS : OFFP), paint: doigtsPaint },
    };
  }
  // point nommé de l'objet tenu (écran) : r renvoyé par TEF.plunkett/officier/marc/colette
  TEF.pt = function (r, nom, arriere) {
    const name = arriere ? r.tenuB : r.tenu, ob = OBJ[name]; if (!ob || !ob.pts[nom]) return null;
    const oo = arriere ? r.tenuBO : r.tenuO, g = gripOf(ob, oo), q = ob.pts[nom];
    let px = q[0], py = q[1];
    if (name === 'poele') px *= (oo.sens == null ? 1 : oo.sens);
    return r.w(arriere ? 'objetB' : 'objet', px - g[0], py - g[1]);
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
  function plier(q, th) {                                                      // plie le buste aux hanches (th > 0 = vers l'avant), jambes droites
    if (!th) return;
    q.tilt = (q.tilt || 0) + th; q.dx = (q.dx || 0) - 238 * Math.sin(th); q.dy = (q.dy || 0) + 238 * (1 - Math.cos(th));
    q.ang.legF = (q.ang.legF || 0) - th; q.ang.legB = (q.ang.legB || 0) - th;
  }
  function finish(q) {
    const A = q.ang, tl = q.tilt || 0, has = (v) => v && v !== 'rien';
    if (has(q.tenu) && !(q.handF && q.handF !== 'fist')) q.handF = 'fist';
    if (has(q.tenuB) && !(q.handB && q.handB !== 'fist')) q.handB = 'fist';
    if (q.droit == null && has(q.tenu)) q.droit = true;
    if (q.droitB == null && has(q.tenuB)) q.droitB = true;
    const cote = (up, lo) => (-Math.sin(up || 0) - Math.sin((up || 0) + (lo || 0)) >= 0 ? -1 : 1); // main devant l'épaule : bocal plus en avant
    if (q.tenu === 'bocal') q.tenuO = Object.assign({ _cote: cote(A.armF_up, A.armF_lo) }, q.tenuO);
    if (q.tenuB === 'bocal') q.tenuBO = Object.assign({ _cote: cote(A.armB_up, A.armB_lo) }, q.tenuBO);
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
  function foreDef(parent, base, skin, back, seed, cuffCol, sleeveTop) {
    const hk = (p) => (back ? p.handB : p.handF) || 'fist';
    return { parent, at: [0, LA], pts: (p) => foreR(hk(p)), base, seed, paint: (p) => {
      const k = hk(p);
      if (sleeveTop) fillPts([[-24, -14, 1], [24, -14, 1], [24, 300, 1], [-24, 300, 1]], skin);
      if (sleeveTop) fillPts([[-24, -14, 1], [24, -14, 1], [24, sleeveTop, 1], [-24, sleeveTop, 1]], base);
      fillPts([[-20, 76, 1], [20, 76, 1], [24, 130, 1], [-20, 130, 1]], skin); X.handPaint(null, k);
      if (cuffCol) fillPts([[-14, 62, 1], [14, 62, 1], [15, 78, 1], [-14, 78, 1]], cuffCol);
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
  const ORDER = (heads) => ['armB_up', 'armB_lo', 'objetB', 'legB', 'legF', 'head'].concat(heads, ['torso', 'armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsB']);

  // =====================================================================
  // ROY PLUNKETT (1938, 27 ans) — blouse ivoire, cravate bleu nuit, lunettes rondes, lunettes de protection relevables
  // =====================================================================
  const PL = { peau: '#e2c3a0', peauD: '#c49b78', blouse: '#e9e4d6', blouseD: '#cdc6b2', cheveux: '#3b2a20', monture: '#2a2420', pant: '#6b6a70', pantD: '#57565c', chaus: '#2a2020' };
  const PL_TORSO = [[-14, -176], [8, -180], [16, -168], [26, -150], [34, -112], [36, -60], [38, 0], [42, 70], [44, 128, 1], [-42, 130, 1], [-40, 60], [-38, 0], [-38, -60], [-37, -110], [-33, -150], [-26, -168]];
  function gogM(g) { return new DOMMatrix().translate(lerp(16, 22, g), lerp(-84, -53, g)).rotate(lerp(-0.42, 0, g) * D); }
  const GOG_CUP = [[-14, -10], [6, -12], [14, -9, 1], [15, 9, 1], [6, 12], [-14, 10], [-17, 0]];
  function mkPlunkett() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: PL_TORSO, base: PL.blouse, seed: 6001, paint: () => {
        fillPts([[4, -184], [16, -170], [12, -150], [2, -166]], '#f4f1ea');                                    // col de chemise blanc
        fillPts([[12, -168], [17, -160], [22, -124], [17, -112], [13, -122], [11, -158]], P.nuit);           // cravate
        fillPts([[16, -176], [26, -150], [30, -110], [22, -100], [14, -140]], PL.blouseD);                    // revers
        strokePts([[20, -104], [24, -40], [28, 128]], 'rgba(90,80,60,0.5)', 1.4);
        for (const y of [-80, -30, 20, 70]) dot(27, y, 2.2, '#9a9384');
        fillPts([[-4, -128, 1], [18, -128, 1], [18, -104, 1], [-4, -104, 1]], 'rgba(120,110,90,0.18)'); strokePts([[-4, -128], [18, -128]], 'rgba(90,80,60,0.55)', 1.1);
        fillPts([[2, -142, 1], [6, -142, 1], [6, -122, 1], [2, -122, 1]], '#3a3a44'); fillPts([[9, -138, 1], [12, -138, 1], [12, -122, 1], [9, -122, 1]], '#7a2a24');
        fillPts([[-10, 10, 1], [22, 10, 1], [22, 40, 1], [-10, 40, 1]], 'rgba(120,110,90,0.16)'); strokePts([[-10, 10], [22, 10]], 'rgba(90,80,60,0.5)', 1.1);
        hatch([[-50, -170], [-12, -170], [-10, 132], [-50, 132]], 0.75, 4.2, 0.28);
        shade(40, 0, -40, 0, 0.26);
      } },
      legB: legDef([-6, -2], PL.pantD, PL.chaus, 6002, true),
      legF: legDef([6, -2], PL.pant, PL.chaus, 6003, false),
      armB_up: upDef([-10, -146], PL.blouseD, 6004),
      armB_lo: foreDef('armB_up', PL.blouseD, PL.peauD, true, 6005, '#bdb5a0'),
      head: { parent: 'torso', at: [6, -170], pts: X.NAP_HEAD, base: PL.peau, seed: 6006, noRivet: true, paint: (p) => {
        const f = p.face || {};
        fillPts([[36, -112], [31, -86], [24, -82], [12, -83], [1, -80], [-10, -72], [-16, -58], [-18, -42], [-24, -32], [-46, -28], [-46, -112]], PL.cheveux, 3);
        strokePts([[-4, -97], [10, -93], [24, -87]], 'rgba(235,215,190,0.55)', 1.2);                          // raie sur le côté
        for (const [a, b, cc] of [[[22, -84], [-6, -88]], [[14, -82], [-14, -80]], [[-4, -90], [-30, -78]], [[-14, -72], [-32, -60]]]) strokePts([a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 3], b], 'rgba(255,240,220,0.22)', 1.3);
        X.earPaint(-8, -44);
        hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.26);
        dot(14, -32, 8, 'rgba(205,130,110,0.2)');
        X.eye(f, 17, -52); X.brow(f, 17, -61, 'rgba(45,30,22,0.95)', 2.4); X.mouth(f, 27, -27);
        if ((p.goggles || 0) < 0.9) {
          const ring = ell(19, -52, 10, 10, 14);
          fillPts(ring, 'rgba(190,225,240,0.22)', 0, 0); strokePts(ring.concat([ring[0]]), PL.monture, 1.8);
          strokePts([[9, -53], [-28, -56]], PL.monture, 1.4); strokePts([[14, -58], [20, -60]], 'rgba(255,255,255,0.7)', 1.2);
        }
      } },
      sangle: { parent: 'head', at: [0, 0], noRivet: true, base: '#3d3a33', seed: 6007,
        pts: (p) => { const g = clamp(p.goggles || 0), m = gogM(g), a = mp(m, [-12, 0]); return ribbon([a, [-10, a[1] + 3], [-36, a[1] + 8 - 6 * (1 - g)]], 7, 8); },
        paint: () => hatch(null, 0.3, 3, 0.25) },
      goggles: { parent: 'head', at: [0, 0], noRivet: true, base: '#5d6656', seed: 6008,
        pts: (p) => { const m = gogM(clamp(p.goggles || 0)); return GOG_CUP.map((q) => mp(m, q)); },
        paint: (p) => {
          const c = cx_(), m = gogM(clamp(p.goggles || 0)); c.save(); c.transform(m.a, m.b, m.c, m.d, m.e, m.f);
          fillPts(ell(12, 0, 4, 10, 12), 'rgba(196,224,228,0.95)'); strokePts([[11, -7], [12, -2]], 'rgba(255,255,255,0.9)', 1.4);
          for (const [vx, vy] of [[-8, -5], [-8, 5], [-2, 0]]) dot(vx, vy, 1.8, '#2c3128');
          hatch([[-18, 2], [16, 2], [16, 14], [-18, 14]], 0.4, 3, 0.3); c.restore();
        } },
      armF_up: upDef([-2, -146], PL.blouse, 6009),
      armF_lo: foreDef('armF_up', PL.blouse, PL.peau, false, 6010, PL.blouseD),
    };
    Object.assign(parts, heldParts(PL.peau, 6020));
    return { hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, order: ORDER(['sangle', 'goggles']) };
  }
  CH.tefPlunkett = mkPlunkett();
  TEF.plunkettPose = function (p) {
    const q = prep(p), A = q.ang;
    const tm = ease(clamp(q.teteMain || 0)), rv = ease(clamp(q.reverence || 0));
    if (rv > 0) {
      plier(q, 0.5 * rv); A.head = (A.head || 0) + 0.32 * rv;
      blend(q, 'armF_up', -0.35, rv); blend(q, 'armF_lo', -1.75, rv);
      blend(q, 'armB_up', 1.05, rv); blend(q, 'armB_lo', -0.15, rv);
      A.legF = (A.legF || 0) - 0.12 * rv; A.legB = (A.legB || 0) + 0.12 * rv;
      if (!q.handB) q.handB = 'open';
    }
    if (tm > 0) { armTo(q, 'armF', headPt(q, 0, -100), 'avant', tm); if (tm > 0.5 && !(q.tenu && q.tenu !== 'rien')) q.handF = 'open'; }
    return finish(q);
  };
  TEF.plunkett = (pose, x, y, s, o) => run(CH.tefPlunkett, TEF.plunkettPose(pose), x, y, s == null ? 0.9 : s, o);

  // =====================================================================
  // L'OFFICIER AMÉRICAIN (1943) — uniforme kaki olive, casquette à visière, insigne rond en laiton sans lettre
  // =====================================================================
  const OF = { kaki: '#6b6a3e', kakiD: '#5d5a36', kakiDD: '#4b492c', chemise: '#8f8a62', peau: '#dfbc98', peauD: '#c29a76', cuir: '#4a2f1e', visiere: '#2a2018' };
  const OF_TORSO = [[-14, -176], [8, -180], [16, -168], [26, -150], [34, -112], [36, -60], [34, -10], [36, 40], [38, 64, 1], [-38, 66, 1], [-38, 20], [-36, -40], [-38, -110], [-34, -150], [-26, -168]];
  const OF_CAP = [[-40, 6], [-38, -10], [-46, -26], [-34, -38], [6, -42], [38, -36], [46, -26], [36, -12], [34, -2], [46, 2], [58, 8, 1], [34, 10], [20, 8]];
  function mkOfficier() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: OF_TORSO, base: OF.kaki, seed: 6101, paint: () => {
        fillPts([[4, -184], [16, -170], [12, -150], [2, -166]], OF.chemise);
        fillPts([[11, -168], [16, -160], [20, -128], [15, -118], [12, -126], [10, -158]], OF.kakiDD);
        fillPts([[16, -176], [28, -148], [32, -112], [22, -104], [14, -140]], OF.kakiD);
        strokePts([[22, -104], [28, -40], [30, 64]], 'rgba(30,28,15,0.55)', 1.4);
        for (const y of [-92, -62, -2, 30]) { dot(28, y, 3, OF.kakiDD); dot(28, y, 2.2, '#b08d45'); }
        fillPts([[-38, -42, 1], [36, -42, 1], [36, -30, 1], [-38, -30, 1]], OF.kakiDD); fillPts([[24, -44, 1], [34, -44, 1], [34, -28, 1], [24, -28, 1]], '#b08d45');
        for (const [x0, y0, w, h] of [[-6, -132, 26, 30], [-14, -18, 34, 36]]) {
          fillPts([[x0, y0, 1], [x0 + w, y0, 1], [x0 + w, y0 + h, 1], [x0, y0 + h, 1]], 'rgba(40,38,20,0.18)');
          fillPts([[x0 - 2, y0, 1], [x0 + w + 2, y0, 1], [x0 + w, y0 + 9, 1], [x0 + w / 2, y0 + 12, 1], [x0, y0 + 9, 1]], OF.kakiD); dot(x0 + w / 2, y0 + 8, 1.8, '#b08d45');
        }
        hatch([[-50, -170], [-12, -170], [-10, 70], [-50, 70]], 0.75, 4.2, 0.32, 1.05, '230,230,200');
        shade(36, 0, -40, 0, 0.3);
      } },
      legB: legDef([-6, -2], OF.kakiDD, OF.cuir, 6102, true),
      legF: legDef([6, -2], OF.kakiD, OF.cuir, 6103, false, () => strokePts([[4, 80], [6, 150], [4, 210]], 'rgba(30,28,15,0.4)', 1.2)),
      armB_up: upDef([-10, -146], OF.kakiD, 6104),
      armB_lo: foreDef('armB_up', OF.kakiD, OF.peauD, true, 6105, OF.kakiDD),
      head: { parent: 'torso', at: [6, -170], pts: X.GR_HEAD, base: OF.peau, seed: 6106, noRivet: true, paint: (p) => {
        const f = p.face || {};
        fillPts([[-40, -84], [-16, -84], [-14, -62], [-20, -44], [-24, -32], [-40, -30]], '#4a3526');
        X.earPaint(-8, -44);
        hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.3);
        strokePts([[6, -6], [18, -10], [24, -16]], 'rgba(90,60,45,0.4)', 1.2);
        dot(16, -34, 8, 'rgba(205,120,105,0.18)');
        X.eye(f, 17, -52); X.brow(f, 17, -60, 'rgba(50,34,24,0.95)', 2.8); X.mouth(f, 27, -26);
      } },
      casquette: { parent: 'head', at: [-2, -80], pts: OF_CAP, base: OF.kaki, seed: 6107, noRivet: true, paint: () => {
        fillPts([[-44, -14, 1], [40, -14, 1], [40, 2, 1], [-44, 2, 1]], '#3e2a1c');
        fillPts([[30, -4], [46, 2], [60, 8], [34, 12], [20, 10]], OF.visiere); strokePts([[34, 2], [52, 6]], 'rgba(255,255,255,0.35)', 1.3);
        strokePts([[-38, -26], [0, -38], [40, -30]], 'rgba(40,38,20,0.5)', 1.2);
        dot(18, -24, 8.4, OF.cuir); dot(18, -24, 7, '#b08d45'); dot(18, -24, 4.4, '#d9bd72'); dot(17, -25.5, 1.6, '#fff6d8');
        hatch([[-46, -40], [46, -40], [46, -14], [-46, -14]], 0.6, 3.6, 0.22, 1, '230,230,200');
      } },
      armF_up: upDef([-2, -146], OF.kaki, 6108, () => { hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.3, 1, '230,230,200'); }),
      armF_lo: foreDef('armF_up', OF.kaki, OF.peau, false, 6109, OF.kakiD),
    };
    parts.armF_up.extra = () => { fillPts([[-15, -14], [0, -18], [15, -12], [15, -4], [-15, -4]], OF.kakiD); dot(8, -10, 2.2, '#b08d45'); };
    Object.assign(parts, heldParts(OF.peau, 6120));
    return { hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, order: ORDER(['casquette']) };
  }
  CH.tefOfficier = mkOfficier();
  TEF.officierPose = function (p) {
    const q = prep(p), sa = ease(clamp(q.salut || 0));
    if (sa > 0) { armTo(q, 'armF', headPt(q, 30, -64), 'avant', sa); if (sa > 0.4) q.handF = 'open'; }
    return finish(q);
  };
  TEF.officier = (pose, x, y, s, o) => run(CH.tefOfficier, TEF.officierPose(pose), x, y, s == null ? 0.9 : s, o);

  // =====================================================================
  // MARC GRÉGOIRE (1954) — moustache, bob de pêcheur ocre, gilet de pêche vert éteint, chemise ivoire, pantalon brun, bottes
  // =====================================================================
  const MA = { peau: '#dfb894', peauD: '#c39874', chemise: '#e9e2cf', chemiseD: '#cdc4ad', gilet: '#5b6b4f', giletD: '#4a5841', pant: '#5a4330', pantD: '#47352a', botte: '#2f3328', chap: '#b5863f', moust: '#5a3c25' };
  const MA_TORSO = [[-14, -176], [8, -180], [16, -168], [28, -150], [36, -112], [38, -60], [36, -10], [32, 16], [-36, 18], [-38, -40], [-38, -110], [-34, -150], [-26, -168]];
  const MA_HAT = [[-54, 16], [-40, 2], [-35, -20], [-30, -28], [-14, -32], [14, -32], [30, -28], [35, -20], [40, 2], [56, 14], [52, 22], [30, 14], [0, 12], [-30, 14], [-50, 24]];
  function mkMarc() {
    const bootPaint = () => fillPts([[-40, 150, 1], [60, 150, 1], [60, 214, 1], [-40, 214, 1]], MA.botte);
    const parts = {
      torso: { parent: null, at: [0, 0], pts: MA_TORSO, base: MA.chemise, seed: 6201, paint: () => {
        fillPts([[4, -184], [18, -168], [12, -150], [2, -166]], MA.chemiseD);
        fillPts([[-40, -170], [-20, -172], [10, -150], [16, -100], [14, 22], [-40, 22]], MA.gilet);              // gilet ouvert devant
        strokePts([[-20, -172], [10, -150], [16, -100], [14, 20]], 'rgba(20,26,16,0.6)', 1.4);
        for (const [x0, y0, w, h] of [[-26, -128, 18, 24], [-4, -128, 16, 24], [-30, -66, 22, 30], [-6, -66, 18, 30], [-30, -16, 40, 24]]) {
          fillPts([[x0, y0, 1], [x0 + w, y0, 1], [x0 + w, y0 + h, 1], [x0, y0 + h, 1]], MA.giletD);
          strokePts([[x0, y0 + 7], [x0 + w, y0 + 7]], 'rgba(20,26,16,0.55)', 1); dot(x0 + w / 2, y0 + 4, 1.5, '#9a8f70');
        }
        for (const y of [-120, -80, -40]) dot(26, y, 2, '#bdb39a');
        fillPts([[-38, 6, 1], [34, 6, 1], [34, 18, 1], [-38, 18, 1]], '#3b2a1e');
        hatch([[-50, -170], [-12, -170], [-10, 24], [-50, 24]], 0.75, 4.2, 0.3);
        shade(38, 0, -40, 0, 0.28);
      } },
      legB: legDef([-6, -2], MA.pantD, MA.botte, 6202, true, bootPaint),
      legF: legDef([6, -2], MA.pant, MA.botte, 6203, false, () => { bootPaint(); strokePts([[-18, 150], [22, 150]], 'rgba(255,255,255,0.18)', 2); }),
      armB_up: upDef([-10, -146], MA.chemiseD, 6204),
      armB_lo: foreDef('armB_up', MA.chemiseD, MA.peauD, true, 6205, null, 14),
      head: { parent: 'torso', at: [6, -170], pts: X.NAP_HEAD, base: MA.peau, seed: 6206, noRivet: true, paint: (p) => {
        const f = p.face || {};
        fillPts([[-40, -84], [-14, -78], [-16, -56], [-22, -40], [-26, -30], [-42, -28]], '#5a3c25');
        X.earPaint(-8, -44);
        hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.3);
        dot(15, -34, 9, 'rgba(205,120,100,0.25)');
        strokePts([[22, -47], [26, -45]], 'rgba(100,60,45,0.45)', 1); strokePts([[10, -66], [24, -66]], 'rgba(100,60,45,0.3)', 1);
        X.eye(f, 17, -52); X.brow(f, 17, -60, 'rgba(70,45,28,0.95)', 3); X.mouth(f, 27, -24);
        fillPts([[37, -33], [35, -29], [30, -27], [22, -28], [17, -30], [20, -34], [29, -35]], MA.moust, 6, 0.4);
        strokePts([[20, -31], [34, -32]], 'rgba(30,18,10,0.5)', 1);
      } },
      chapeau: { parent: 'head', at: [-2, -82], pts: MA_HAT, base: MA.chap, seed: 6207, noRivet: true, paint: () => {
        fillPts([[-38, -6, 1], [40, -6, 1], [40, 3, 1], [-38, 3, 1]], '#8f6830');
        for (const k of [0.4, 0.7]) strokePts([[-52 * k - 4, 13 - 2 * k], [0, 9 + 2 * k], [54 * k + 4, 11 - 2 * k]], 'rgba(90,60,20,0.55)', 1);
        for (let x = -30; x <= 30; x += 6) strokePts([[x * 0.95, -29], [x * 1.12, -6]], 'rgba(90,60,20,0.25)', 1);
        hatch(null, 0.5, 3.6, 0.22); shade(0, -34, 0, 22, 0.2, [-56, -36, 58, 26]);
      } },
      armF_up: upDef([-2, -146], MA.chemise, 6208),
      armF_lo: foreDef('armF_up', MA.chemise, MA.peau, false, 6209, null, 14),
    };
    Object.assign(parts, heldParts(MA.peau, 6220));
    return { hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, order: ORDER(['chapeau']) };
  }
  CH.tefMarc = mkMarc();
  TEF.marcPose = function (p) {
    const q = prep(p), A = q.ang, fi = ease(clamp(q.fier || 0)), br = ease(clamp(q.brandir || 0));
    if (fi > 0) { plier(q, -0.07 * fi); A.head = (A.head || 0) - 0.16 * fi; A.armB_up = (A.armB_up || 0) + 0.3 * fi; q.dy = (q.dy || 0) - 3 * fi; }
    if (br > 0) { blend(q, 'armF_up', -2.0, br); blend(q, 'armF_lo', -0.85, br); }
    return finish(q);
  };
  TEF.marc = (pose, x, y, s, o) => run(CH.tefMarc, TEF.marcPose(pose), x, y, s == null ? 0.9 : s, o);

  // =====================================================================
  // COLETTE GRÉGOIRE (1954) — boucles châtain années 50, robe bleu ardoise à mi-mollet, tablier ivoire
  // =====================================================================
  const CO = { peau: '#e6c6a6', peauD: '#c9a283', robe: '#4a6274', robeD: '#3b4f5e', tablier: '#ebe2cd', cheveux: '#7a4f30', chaus: '#4a2f2a', bas: '#d9b796' };
  const CO_TORSO = [[-14, -176], [6, -180], [14, -168], [22, -150], [28, -118], [24, -84], [18, -62], [26, -30], [38, 40], [48, 110], [54, 170, 1], [-50, 172, 1], [-44, 110], [-34, 40], [-24, -30], [-22, -62], [-26, -90], [-30, -120], [-30, -150], [-24, -168]];
  const CO_HEAD = [[-12, 16], [8, 16], [9, 2], [14, -6], [20, -10], [23, -15], [22, -19], [24, -22], [23, -25], [25, -29], [30, -34, 1], [27, -41], [24, -51], [25, -60], [21, -72], [10, -82], [-6, -86], [-22, -82], [-30, -66], [-30, -44], [-24, -28], [-16, -10]];
  const CO_HAIR = (() => {
    const o = [], cxh = -6, cyh = -58;
    for (let i = 0; i <= 30; i++) { const a = lerp(-0.42, -3.95, i / 30), r = 1 + 0.07 * Math.abs(Math.sin(i * PI / 3)); o.push([cxh + 42 * r * Math.cos(a), cyh + 44 * r * Math.sin(a)]); }
    return o.concat([[-26, -18], [-18, -28], [-13, -42], [-4, -58], [10, -64], [22, -68]]);
  })();
  const CO_LEG = [[-12, -10], [12, -12], [14, 40], [12, 110], [10, 160], [8, 200], [9, 218], [30, 224], [36, 233, 1], [-12, 236, 1], [-14, 222], [-12, 200], [-14, 160], [-16, 110], [-15, 40]];
  function mkColette() {
    const legP = (back) => () => {
      fillPts([[-30, 214, 1], [50, 214, 1], [50, 250, 1], [-30, 250, 1]], CO.chaus);
      fillPts([[-14, 222, 1], [-4, 222, 1], [-5, 238, 1], [-14, 238, 1]], '#2a1a16');
      hatch(back ? null : [[-20, 100], [-6, 100], [-6, 214], [-20, 214]], 0.8, 3.6, back ? 0.3 : 0.2);
    };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: CO_TORSO, base: CO.robe, seed: 6301, paint: () => {
        fillPts([[2, -182], [16, -170], [10, -162], [0, -170]], '#f1ece0');                                       // col Claudine
        fillPts([[4, -128], [24, -126], [22, -66], [6, -64]], CO.tablier);                                          // bavette
        fillPts([[-2, -66], [22, -66], [36, 20], [46, 118], [6, 124]], CO.tablier);                               // tablier
        strokePts([[-2, -66], [22, -66], [36, 20], [46, 118]], 'rgba(120,105,80,0.55)', 1.2);
        fillPts([[12, 30, 1], [32, 28, 1], [34, 52, 1], [14, 54, 1]], '#ddd2b8'); strokePts([[12, 30], [32, 28]], 'rgba(120,105,80,0.6)', 1);
        fillPts([[-30, -70, 1], [24, -70, 1], [24, -60, 1], [-30, -60, 1]], CO.robeD);                            // ceinture
        strokePts([[-26, -64], [-38, -40], [-34, -30]], CO.tablier, 3); strokePts([[-26, -64], [-42, -52]], CO.tablier, 3);   // nœud du tablier
        for (const [x0, x1] of [[-14, -30], [-4, -12], [-24, -44]]) strokePts([[x0, -56], [(x0 + x1) / 2, 60], [x1, 168]], 'rgba(20,30,40,0.4)', 1.2);
        hatch([[-56, -170], [-14, -170], [-20, 174], [-56, 174]], 0.75, 4.4, 0.26, 1.05, '220,225,235');
        shade(40, 0, -44, 0, 0.26);
      } },
      legB: { parent: 'torso', at: [-6, -2], pts: CO_LEG, base: '#c9a585', seed: 6302, noRivet: true, paint: legP(true) },
      legF: { parent: 'torso', at: [6, -2], pts: CO_LEG, base: CO.bas, seed: 6303, paint: legP(false) },
      armB_up: upDef([-10, -146], CO.robeD, 6304),
      armB_lo: foreDef('armB_up', CO.robeD, CO.peauD, true, 6305, null, 22),
      head: { parent: 'torso', at: [6, -170], pts: CO_HEAD, base: CO.peau, seed: 6306, noRivet: true, paint: (p) => {
        const f = p.face || {};
        X.earPaint(-6, -44); dot(-4, -34, 2.6, '#efe8da');
        hatch([[-22, -40], [0, -28], [8, -8], [-8, 18], [-30, 4]], 0.6, 3.8, 0.2);
        dot(13, -30, 8, 'rgba(215,120,110,0.3)');
        X.eye(f, 15, -45, 0.95); strokePts([[9, -48], [7, -51]], 'rgba(28,16,14,0.9)', 1.2); strokePts([[13, -49], [12, -52]], 'rgba(28,16,14,0.9)', 1.2);
        X.brow(f, 15, -53, 'rgba(90,55,30,0.9)', 1.7);
        fillPts([[24, -22], [20, -21], [18, -19], [22, -18]], '#a24848', 0, 0);
        X.mouth(f, 23, -20, 'rgba(140,45,45,0.9)');
      } },
      cheveux: { parent: 'head', at: [0, 0], pts: CO_HAIR, base: CO.cheveux, seed: 6307, noRivet: true, paint: () => {
        for (const [x, y, r] of [[-30, -70, 9], [-38, -50, 8], [-34, -30, 7], [-18, -84, 9], [2, -90, 8], [16, -80, 7], [-24, -52, 7]]) strokePts(ep(x, y, r, r, 10, -PI * 0.2, PI * 1.4), 'rgba(50,28,14,0.6)', 1.3);
        strokePts([[20, -74], [8, -86], [-10, -92]], 'rgba(230,190,140,0.35)', 1.6);
        hatch(null, 0.5, 3.6, 0.2);
      } },
      armF_up: upDef([-2, -146], CO.robe, 6308),
      armF_lo: foreDef('armF_up', CO.robe, CO.peau, false, 6309, null, 22),
    };
    Object.assign(parts, heldParts(CO.peau, 6320));
    return { hipY: -236, parts, handLen: 100, rod: { part: 'torso', at: [-14, 40] }, order: ORDER(['cheveux']) };
  }
  CH.tefColette = mkColette();
  TEF.colettePose = function (p) {
    const q = prep(p), hf = ease(clamp(q.hanche || 0)), hb = ease(clamp(q.hancheB || 0)), te = ease(clamp(q.tendre || 0));
    if (!q.face.mouth) q.face.mouth = 'smile';
    if (te > 0) { blend(q, 'armF_up', -1.3, te); blend(q, 'armF_lo', -0.25, te); if (q.droit == null) q.droit = true; }
    if (hf > 0) { armTo(q, 'armF', [-4, -40], 'arriere', hf); if (!(q.tenu && q.tenu !== 'rien')) q.handF = 'fist'; }
    if (hb > 0) { armTo(q, 'armB', [-14, -40], 'arriere', hb); if (!(q.tenuB && q.tenuB !== 'rien')) q.handB = 'fist'; }
    return finish(q);
  };
  TEF.colette = (pose, x, y, s, o) => run(CH.tefColette, TEF.colettePose(pose), x, y, s == null ? 0.88 : s, o);

  // =====================================================================
  // ACCESSOIRES SEULS — M.puppet à une pièce invisible ; l'objet se dessine dans l'extra (ombre portée possible)
  // =====================================================================
  const accDefs = {};
  function accDef(name, fn) { return accDefs[name] || (accDefs[name] = { hipY: 0, handLen: 10, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => fn(p.o) } }, order: ['o'] }); }
  function acc(name, x, y, s, o, sDef) {
    o = o || {}; s = s == null ? (sDef || 0.9) : s;
    const ob = OBJ[name];
    const def = accDef(name, (oo) => { const c = cx_(); c.save(); c.translate(-ob.base[0], -ob.base[1]); ob.draw(oo); c.restore(); });
    return M.puppet(def, { o, tilt: o.rot || 0 }, x, y, s, { dir: o.dir || 1, rod: false, slot: o.slot != null ? o.slot : y + 6 * s, floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
  }
  for (const n of ['bouteille', 'scie', 'spatule', 'tas', 'bocal', 'flacon', 'poele', 'canne', 'pinceau']) TEF[n] = (x, y, s, o) => acc(n, x, y, s, o);

  // ---------------- balance de Roberval
  function drawBalance(o) {
    const a = clamp(o.pente || 0, -1, 1) * 0.18, PV = [0, -150];
    pc([[-145, 0, 1], [145, 0, 1], [145, -30, 1], [138, -36, 1], [-138, -36, 1], [-145, -30, 1]], P.bois, () => {
      fillPts([[-140, -36, 1], [140, -36, 1], [145, -29, 1], [-145, -29, 1]], P.boisL);
      for (const y of [-22, -14, -8]) strokePts([[-136, y], [-40, y + 1], [60, y - 1], [136, y]], 'rgba(150,100,60,0.35)', 1);
      hatch(null, 0.2, 4, 0.2);
    }, 6501);
    for (const sx of [-1, 1]) pc([[sx * 60 - 5, -36, 1], [sx * 60 + 5, -36, 1], [sx * 60 + 4, -104, 1], [sx * 60 - 4, -104, 1]], BT.laitonD, null, 6502 + sx);
    pc([[-34, -36, 1], [34, -36, 1], [26, -60], [20, -128], [26, -146], [0, -160], [-26, -146], [-20, -128], [-26, -60]], P.or, () => {
      strokePts([[-12, -44], [-8, -140]], 'rgba(255,240,190,0.6)', 2.2); hatch([[6, -160], [36, -160], [36, -34], [6, -34]], 0.9, 3.4, 0.3); shade(30, 0, -30, 0, 0.3, [-36, -162, 36, -34]);
    }, 6504);
    pc(ep(0, -150, 36, 36, 12, -PI * 0.88, -PI * 0.12).concat([[0, -150]]), '#e9e0c6', () => hatch(null, 0.6, 4, 0.1), 6505);
    const c = cx_();
    const end = (sx) => [PV[0] + sx * 118 * Math.cos(a), PV[1] + sx * 118 * Math.sin(a)];
    for (const sx of [-1, 1]) {                                                                 // montants et plateaux (restent horizontaux)
      const e = end(sx);
      pc([[e[0] - 4, e[1], 1], [e[0] + 4, e[1], 1], [e[0] + 3, e[1] - 40, 1], [e[0] - 3, e[1] - 40, 1]], BT.laitonD, null, 6506 + sx);
      pc([[e[0] - 60, e[1] - 50], [e[0] + 60, e[1] - 50], [e[0] + 52, e[1] - 42], [e[0] + 30, e[1] - 38], [e[0] - 30, e[1] - 38], [e[0] - 52, e[1] - 42]], P.or, () => { strokePts([[e[0] - 54, e[1] - 48], [e[0] + 54, e[1] - 48]], 'rgba(255,240,190,0.7)', 1.4); shade(e[0] + 60, 0, e[0] - 60, 0, 0.25, [e[0] - 62, e[1] - 54, e[0] + 62, e[1] - 34]); }, 6509 + sx);
    }
    c.save(); c.translate(PV[0], PV[1]); c.rotate(a);
    pc([[-122, -4], [122, -4], [126, 0], [122, 4], [-122, 4], [-126, 0]], BT.laiton, () => strokePts([[-118, -2], [118, -2]], 'rgba(255,240,190,0.55)', 1.2), 6512);
    pc([[-2, 0, 1], [2, 0, 1], [1.2, -36, 1], [-1.2, -36, 1]], '#2a2420', null, 6513, { drop: false });
    c.restore();
    M.rivet(PV[0], PV[1], 3.6);
    return { gauche: [end(-1)[0], end(-1)[1] - 50], droite: [end(1)[0], end(1)[1] - 50] };
  }
  const BAL_DEF = { hipY: 0, handLen: 10, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => { p._pl = drawBalance(p.o); } } }, order: ['o'] };
  TEF.balance = function (x, y, s, o) {
    o = o || {}; s = s == null ? 0.9 : s;
    const a = clamp(o.pente || 0, -1, 1) * 0.18, e = (sx) => [sx * 118 * Math.cos(a), -150 + sx * 118 * Math.sin(a) - 50];
    const r = M.puppet(BAL_DEF, { o, tilt: o.rot || 0 }, x, y, s, { dir: o.dir || 1, rod: false, slot: y + 6 * s, floorShadow: o.ombre !== false, cast: o.cast, alpha: o.alpha });
    const g = e(-1), d = e(1); r.gauche = r.w('o', g[0], g[1]); r.droite = r.w('o', d[0], d[1]); return r;
  };

  // ---------------- frigo « Monitor Top » (de face, sans visage)
  const FR = { ivoire: '#e6dfcc', ivoireD: '#cbc2aa', chrome: '#b9b6ae', int: '#36404c', or: '#a8884a', hx: -104, W: 208, yt: -308, yb: -32, Tk: 16 };
  function goutte(x, y, r, a, el) {                                             // goutte d'eau brute (gardée)
    if (SIL() || a <= 0.01) return;
    const c = cx_(); el = el || 1;
    c.save(); c.globalAlpha = a;
    c.beginPath(); c.moveTo(x, y - r * 1.9 * el); c.quadraticCurveTo(x + r * 1.05, y - r * 0.4, x + r, y); c.arc(x, y, r, 0, PI); c.quadraticCurveTo(x - r * 1.05, y - r * 0.4, x, y - r * 1.9 * el); c.closePath();
    c.fillStyle = 'rgba(212,232,238,0.9)'; c.fill(); c.lineWidth = 1.1 * M._lw(); c.strokeStyle = 'rgba(50,70,85,0.6)'; c.stroke();
    c.beginPath(); c.arc(x - r * 0.35, y - r * 0.2, r * 0.32, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.95)'; c.fill();
    c.restore();
  }
  function drawFrigo(o) {
    const c = cx_(), t = o.t || 0, th = clamp(o.porte || 0) * 1.75, cs = Math.cos(th), sn = Math.sin(th), gv = clamp(o.givre || 0);
    if (!SIL()) {                                                               // ombre de contact au sol
      c.save(); const g = c.createRadialGradient(0, 0, 10, 0, 0, 150); g.addColorStop(0, 'rgba(15,8,3,0.45)'); g.addColorStop(1, 'rgba(15,8,3,0)');
      c.scale(1, 0.09); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 150, 0, TAU); c.fill(); c.restore();
    }
    for (const sx of [-1, 1]) { pc([[sx * 74 - 6, -24, 1], [sx * 74 + 6, -24, 1], [sx * 74 + 5, -8, 1], [sx * 74 - 5, -8, 1]], '#1f1b18', null, 6601 + sx); pc([[sx * 94 - 8, -24, 1], [sx * 94 + 8, -24, 1], [sx * 94 + 6, 0, 1], [sx * 94 - 6, 0, 1]], '#2b2622', null, 6603 + sx); }
    // compresseur cylindrique à anneaux
    pc([[-84, -316, 1], [84, -316, 1], [80, -330, 1], [-80, -330, 1]], FR.ivoireD, () => hatch(null, 0.2, 3.4, 0.2), 6605);
    pc([[-56, -328], [56, -328], [58, -428], [48, -446], [22, -456], [-22, -456], [-48, -446], [-58, -428]], FR.ivoire, () => {
      for (let y = -346; y > -430; y -= 17) { fillPts([[-60, y - 3], [0, y], [60, y - 3], [60, y + 3], [0, y + 6], [-60, y + 3]], FR.or); strokePts([[-60, y + 3.5], [0, y + 6.5], [60, y + 3.5]], 'rgba(60,45,20,0.45)', 1.2); }
      const g = c.createLinearGradient(-63, 0, 63, 0); g.addColorStop(0, 'rgba(80,65,45,0.35)'); g.addColorStop(0.35, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(70,55,40,0.45)');
      if (!SIL()) { c.fillStyle = g; c.fillRect(-64, -460, 128, 134); }
      hatch([[28, -460], [64, -460], [64, -326], [28, -326]], 0.9, 3.4, 0.25);
    }, 6606);
    pc(ell(0, -456, 12, 5, 12), FR.or, null, 6607);
    // caisson
    pc(rrect(-112, -320, 112, -20, 18), FR.ivoire, () => {
      strokePts([[-104, -312], [-104, -28]], 'rgba(255,255,255,0.4)', 2);
      hatch([[70, -330], [116, -330], [116, -16], [70, -16]], 0.9, 3.6, 0.22);
      shade(112, 0, -112, 0, 0.22, [-114, -322, 114, -18]);
    }, 6608);
    // intérieur (visible quand la porte s'ouvre)
    if (th > 0.01) {
      fillPts(rrect(-100, -304, 100, -36, 8), FR.int);
      fillPts([[-64, -300, 1], [64, -300, 1], [64, -262, 1], [-64, -262, 1]], '#8e969c'); strokePts([[-60, -270], [60, -270]], 'rgba(20,25,30,0.5)', 1.2);
      for (const y of [-232, -170, -108]) { strokePts([[-98, y], [98, y]], '#a9b0b6', 2.2); for (let x = -90; x <= 90; x += 12) strokePts([[x, y], [x, y + 4]], 'rgba(169,176,182,0.7)', 1); }
      fillPts([[-100, -44, 1], [100, -44, 1], [100, -36, 1], [-100, -36, 1]], '#4e5864');
      if (gv > 0) { fillPts([[-64, -300], [64, -300], [60, -292], [30, -290], [0, -294], [-34, -289], [-64, -293]], `rgba(240,248,252,${0.9 * gv})`); }
      shade(-100, -300, 100, -40, 0.35, [-102, -306, 102, -34], '20,25,35');
    }
    // porte (pivote sur les charnières de gauche ; bord libre légèrement grandi par la perspective)
    const hx = FR.hx, W = FR.W, yt = FR.yt, yb = FR.yb, ex = 12 * sn, xf = hx + W * cs;
    if (cs >= 0) {
      if (sn > 0.02) pc([[xf, yt - ex, 1], [xf + FR.Tk * sn, yt - ex + 2, 1], [xf + FR.Tk * sn, yb + ex - 2, 1], [xf, yb + ex, 1]], FR.ivoireD, () => strokePts([[xf + 3 * sn, yt], [xf + 3 * sn, yb]], 'rgba(60,60,60,0.5)', 1.4), 6609);
      pc([[hx, yt + 6], [hx + 6 * cs, yt, 1], [xf - 6 * cs, yt - ex, 1], [xf, yt - ex + 6], [xf, yb + ex - 6], [xf - 6 * cs, yb + ex, 1], [hx + 6 * cs, yb, 1], [hx, yb - 6]], FR.ivoire, () => {
        const ix = (u) => hx + W * cs * u, iy = (u, y) => y + (y < -170 ? -1 : 1) * ex * u;
        strokePts([[ix(0.08), iy(0.08, yt + 14), 1], [ix(0.92), iy(0.92, yt + 14), 1], [ix(0.92), iy(0.92, yb - 14), 1], [ix(0.08), iy(0.08, yb - 14), 1], [ix(0.08), iy(0.08, yt + 14), 1]], 'rgba(150,135,105,0.55)', 1.4);
        strokePts([[ix(0.1), yt + 10], [ix(0.1), yb - 10]], 'rgba(255,255,255,0.45)', 2);
        hatch([[ix(0.7), yt - 20], [ix(1) + 2, yt - 20], [ix(1) + 2, yb + 20], [ix(0.7), yb + 20]], 0.9, 3.6, 0.2);
        if (sn > 0.02 && !SIL()) { c.fillStyle = `rgba(70,60,45,${0.28 * sn})`; c.fillRect(hx - 2, yt - 20, W + 4, yb - yt + 40); }
      }, 6610);
      const hxp = hx + W * cs * 0.88, hw = Math.max(3, 9 * cs + 6 * sn);
      pc([[hxp - hw, -196, 1], [hxp + hw, -196, 1], [hxp + hw, -140, 1], [hxp - hw, -140, 1]], FR.chrome, () => strokePts([[hxp - hw * 0.4, -192], [hxp - hw * 0.4, -144]], 'rgba(255,255,255,0.85)', 1.4), 6611);
    } else {
      pc([[xf, yt - ex], [hx, yt + 4], [hx, yb - 4], [xf, yb + ex]], '#d8d2c2', () => {
        strokePts([[xf + 8, yt - ex + 10, 1], [hx - 6, yt + 10, 1], [hx - 6, yb - 10, 1], [xf + 8, yb + ex - 10, 1], [xf + 8, yt - ex + 10, 1]], '#4a4a4c', 4);
        for (const y of [-240, -150]) fillPts([[xf + 14, y - ex * 0.4, 1], [hx - 12, y, 1], [hx - 12, y + 8, 1], [xf + 14, y + 8 - ex * 0.4, 1]], '#bfb8a4');
        hatch(null, 0.9, 3.8, 0.18);
      }, 6612);
    }
    for (const y of [-280, -62]) pc([[-118, y - 12, 1], [-102, y - 12, 1], [-102, y + 12, 1], [-118, y + 12, 1]], FR.chrome, () => strokePts([[-115, y - 9], [-115, y + 9]], 'rgba(255,255,255,0.8)', 1.2), 6613 + (y > -100 ? 1 : 0));
    // givre (coins et dessus)
    if (gv > 0.01) for (const [gx, gy, sx] of [[-112, -320, 1], [112, -320, -1], [-112, -20, 1], [112, -20, -1]]) {
      const up = gy < -100 ? 1 : -1;
      fillPts([[gx, gy], [gx + sx * 40 * gv, gy], [gx + sx * 26 * gv, gy + up * 8], [gx + sx * 12 * gv, gy + up * 20], [gx + sx * 6, gy + up * 36 * gv], [gx, gy + up * 30 * gv]], `rgba(242,250,252,${0.85 * gv})`);
      for (let k = 0; k < 3; k++) strokePts([[gx + sx * (6 + k * 9) * gv, gy + up * 4], [gx + sx * (10 + k * 9) * gv, gy + up * 14 * gv]], `rgba(200,225,235,${0.8 * gv})`, 1);
    }
    // sueur : gouttelettes qui perlent puis glissent (déterministes)
    const su = clamp(o.sueur || 0);
    if (su > 0.01) for (let i = 0; i < 26; i++) {
      if (hash(i * 9.1) > su) continue;
      const v = 0.05 + 0.06 * hash(i * 2.2), u = (t * v + hash(i * 4.4)) % 1;
      let x = (hash(i * 3.7) - 0.5) * 200; const y = -300 + hash(i * 5.3) * 230 + u * 70;
      if (x > hx && th > 0.01) { if (cs < 0) continue; x = hx + (x - hx) * cs; }
      goutte(x, y, 2.4 + 1.8 * hash(i * 1.3), smooth(0, 0.15, u) * (1 - smooth(0.8, 1, u)), 1 + u * 0.6);
    }
    // grosses gouttes à heure fixe
    for (const gd of (o.gouttes || [])) {
      const g = typeof gd === 'number' ? { t: gd } : gd, k = t - g.t; if (k < 0 || k > 2.6) continue;
      const gx = g.x != null ? g.x : lerp(-60, 60, hash(g.t * 13.1)), R = (g.r || 7) * spring(k, 0.5, 10);
      const sl = Math.max(0, k - 0.7), y = Math.min(-300 + 230 * sl * sl, -24);
      if (k < 2.2) goutte(gx, y, R, 1, 1 + Math.min(1, sl * 1.5) * 0.7);
      if (y >= -24 && k < 2.6) { const f = Math.max(0, k - (0.7 + Math.sqrt(276 / 230))); goutte(gx, -24 + 500 * f * f, R * 0.8, 1 - smooth(0.25, 0.4, f), 1.3); }
    }
  }
  const FRIGO_DEF = { hipY: 0, handLen: 10, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => drawFrigo(p.o) } }, order: ['o'] };
  TEF.frigo = function (x, y, s, o) {
    o = o || {}; s = s == null ? 1 : s;
    const t = o.t || 0, tb = clamp(o.tremble || 0), pe = clamp(o.penche || 0, -1, 1), dir = o.dir || 1;
    const fx = pe > 0 ? 100 : pe < 0 ? -100 : 0;
    const pose = { o, tilt: pe * 0.14 + noise(t * 31, 2) * 0.012 * tb, dx: -fx + noise(t * 25, 5) * 3 * tb };
    return M.puppet(FRIGO_DEF, pose, x + fx * s * dir, y, s, { dir, rod: false, slot: y + 6 * s, floorShadow: false, cast: o.cast, alpha: o.alpha });
  };

  // =====================================================================
  // DÉCORS PRÉ-RENDUS — TEF.init() (dans S.init) → TEF.K
  // =====================================================================
  const ST = M.ST;
  TEF.PAILLASSE = { x0: 130, x1: 560, cx: 345, top: 1150, etau: { x: 290, y: 1110, haut: 1040 } };
  function makeLabo() {
    return M.pre(M.W, ST.back + 5, (x) => {
      const H = ST.back + 5;
      const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#d6cdb6'); g.addColorStop(0.5, '#e4dbc5'); g.addColorStop(1, '#ddd3bb');
      x.fillStyle = g; x.fillRect(0, 0, M.W, H);
      // carrelage bas vert d'eau / ivoire
      const yT = 890, sz = 56;
      for (let r = 0; yT + r * sz < H; r++) for (let k = 0; k * sz < M.W; k++) {
        x.fillStyle = (r + k) % 2 ? '#b7cbbf' : '#e8e1cf'; x.fillRect(k * sz, yT + r * sz, sz, sz);
        x.fillStyle = 'rgba(255,255,255,0.12)'; x.fillRect(k * sz + 3, yT + r * sz + 3, sz - 12, 4);
      }
      x.strokeStyle = 'rgba(110,105,85,0.4)'; x.lineWidth = 1.5; x.beginPath();
      for (let k = 0; k * sz <= M.W; k++) { x.moveTo(k * sz, yT); x.lineTo(k * sz, H); }
      for (let r = 0; yT + r * sz <= H; r++) { x.moveTo(0, yT + r * sz); x.lineTo(M.W, yT + r * sz); } x.stroke();
      x.fillStyle = '#7f978a'; x.fillRect(0, yT - 16, M.W, 16); x.fillStyle = 'rgba(255,255,255,0.25)'; x.fillRect(0, yT - 16, M.W, 3);
      // tuyau au plafond
      piece([[0, 236, 1], [M.W, 236, 1], [M.W, 252, 1], [0, 252, 1]], '#9aa09a', () => { hatch(null, 0, 3, 0.2); }, { seed: 7001 });
      for (const px of [250, 830]) piece([[px - 8, 226, 1], [px + 8, 226, 1], [px + 8, 262, 1], [px - 8, 262, 1]], '#7d827c', null, { seed: 7002 + px });
      // fenêtre haute à petits carreaux
      const wx0 = 390, wx1 = 640, wy0 = 340, wy1 = 640;
      piece([[wx0 - 18, wy0 - 18, 1], [wx1 + 18, wy0 - 18, 1], [wx1 + 18, wy1 + 14, 1], [wx0 - 18, wy1 + 14, 1]], '#6f7768', () => {
        const gg = x.createLinearGradient(wx0, wy0, wx1, wy1); gg.addColorStop(0, '#dfe5e1'); gg.addColorStop(1, '#b9c6c4');
        x.fillStyle = gg; x.fillRect(wx0, wy0, wx1 - wx0, wy1 - wy0);
        x.fillStyle = 'rgba(255,255,250,0.35)'; x.beginPath(); x.moveTo(wx0, wy1 - 40); x.lineTo(wx0 + 120, wy0); x.lineTo(wx0 + 170, wy0); x.lineTo(wx0 + 30, wy1); x.lineTo(wx0, wy1); x.fill();
        x.strokeStyle = '#6f7768'; x.lineWidth = 6; x.beginPath();
        for (let k = 1; k < 4; k++) { const xx = lerp(wx0, wx1, k / 4); x.moveTo(xx, wy0); x.lineTo(xx, wy1); }
        for (let k = 1; k < 5; k++) { const yy = lerp(wy0, wy1, k / 5); x.moveTo(wx0, yy); x.lineTo(wx1, yy); } x.stroke();
      }, { seed: 7010 });
      piece([[wx0 - 30, wy1 + 10, 1], [wx1 + 30, wy1 + 10, 1], [wx1 + 24, wy1 + 26, 1], [wx0 - 24, wy1 + 26, 1]], '#d9d0b8', null, { seed: 7011 });
      // tableau de cases colorées (sans lettre)
      piece([[160, 470, 1], [340, 470, 1], [340, 640, 1], [160, 640, 1]], '#ece5d2', () => {
        const cols = ['#c9a96a', '#9fb3a6', '#c58a74', '#a7a9bf', '#d6c58e'];
        for (let r = 0; r < 6; r++) for (let k = 0; k < 9; k++) { if ((r === 0 && k > 0 && k < 8) || (r < 3 && r > 0 && k > 1 && k < 7)) continue; x.fillStyle = cols[(r * 3 + k * 7) % 5]; x.fillRect(170 + k * 18.5, 482 + r * 25, 15, 21); }
      }, { seed: 7012 });
      // étagères de fioles
      for (const yy of [640, 790]) {
        piece([[700, yy, 1], [975, yy, 1], [975, yy + 14, 1], [700, yy + 14, 1]], '#7a5a3c', () => hatch(null, 0.1, 3, 0.2), { seed: 7020 + yy });
        for (const bx of [716, 958]) piece([[bx - 4, yy + 14, 1], [bx + 4, yy + 14, 1], [bx + 4, yy + 40, 1], [bx - 14, yy + 14, 1]], '#5e4530', null, { seed: 7030 + bx + yy });
        let px = 714, i = 0;
        while (px < 950) {
          const kind = (i * 7 + yy) % 4, col = ['#7d8f86', '#8a6a48', '#cfc6ae', '#94a6a8'][(i + yy / 10) % 4 | 0], h = 50 + ((i * 37 + yy) % 40);
          let pts;
          if (kind === 0) pts = [[px, yy], [px + 30, yy], [px + 26, yy - h * 0.5], [px + 19, yy - h * 0.62], [px + 19, yy - h, 1], [px + 11, yy - h, 1], [px + 11, yy - h * 0.62], [px + 4, yy - h * 0.5]];
          else if (kind === 1) pts = ep(px + 16, yy - 16, 16, 16, 10, 0, PI).concat([[px + 2, yy - 22], [px + 12, yy - 28], [px + 12, yy - h, 1], [px + 20, yy - h, 1], [px + 20, yy - 28], [px + 30, yy - 22]]);
          else if (kind === 2) pts = [[px, yy, 1], [px + 34, yy, 1], [px + 34, yy - h * 0.75, 1], [px + 30, yy - h * 0.8, 1], [px + 4, yy - h * 0.8, 1], [px, yy - h * 0.75, 1]];
          else pts = [[px + 2, yy, 1], [px + 22, yy, 1], [px + 22, yy - h * 0.6], [px + 16, yy - h * 0.72], [px + 16, yy - h, 1], [px + 8, yy - h, 1], [px + 8, yy - h * 0.72], [px + 2, yy - h * 0.6]];
          piece(pts, col, () => { x.fillStyle = 'rgba(255,255,255,0.3)'; x.fillRect(px + 5, yy - h * 0.5, 3, h * 0.4); }, { seed: 7100 + i + yy });
          px += 40 + ((i * 13) % 12); i++;
        }
      }
      // toile pâlie
      x.globalCompositeOperation = 'multiply'; x.globalAlpha = 0.55; x.fillStyle = M.tex.canvasPat; x.fillRect(0, 0, M.W, H);
      x.globalCompositeOperation = 'source-over'; x.globalAlpha = 0.22; x.fillStyle = '#efe7d4'; x.fillRect(0, 0, M.W, H);
      x.globalAlpha = 1;
      const vg = x.createLinearGradient(0, H - 120, 0, H); vg.addColorStop(0, 'rgba(40,30,20,0)'); vg.addColorStop(1, 'rgba(40,30,20,0.3)'); x.fillStyle = vg; x.fillRect(0, H - 120, M.W, 120);
    });
  }
  const PA = { w: 470, h: 420 };
  function etauPts() {                                                         // repère paillasse : x local = x écran − 345, y local = y écran − ST.back
    const ex = TEF.PAILLASSE.etau.x - TEF.PAILLASSE.cx, sy = TEF.PAILLASSE.etau.y - ST.back, hy = TEF.PAILLASSE.etau.haut - ST.back;
    return { ex, sy, hy };
  }
  function drawMors(x) {
    const { ex, sy, hy } = etauPts();
    for (const [a, b] of [[-55, -23], [23, 55]]) piece([[ex + a, hy, 1], [ex + b, hy, 1], [ex + b, sy, 1], [ex + a, sy, 1]], '#4e5a52', () => {
      for (let yy = hy + 6; yy < sy; yy += 6) strokePts([[ex + (a < 0 ? b - 6 : a), yy], [ex + (a < 0 ? b : a + 6), yy - 2]], 'rgba(20,24,22,0.7)', 1);
      strokePts([[ex + a + 4, hy + 4], [ex + b - 4, hy + 4]], 'rgba(220,230,225,0.4)', 1.4); hatch(null, 0.9, 3.4, 0.25);
    }, { seed: 7200 + a });
  }
  function makePaillasse() {
    const cv = M.cutFlat(PA.w, PA.h, PA.w / 2, PA.h - 10, (x) => {
      const top = TEF.PAILLASSE.top - ST.back;
      piece([[-205, 0, 1], [205, 0, 1], [205, top + 16, 1], [-205, top + 16, 1]], P.bois, () => {
        for (const [a, b] of [[-196, -70], [-60, 60], [70, 196]]) { strokePts([[a, top + 40, 1], [b, top + 40, 1], [b, -26, 1], [a, -26, 1], [a, top + 40, 1]], 'rgba(150,100,60,0.5)', 1.6); dot((a + b) / 2, top + 80, 4, BT.laiton); }
        for (const [a, b] of [[-196, -70], [-60, 60], [70, 196]]) strokePts([[a, top + 32], [b, top + 32]], 'rgba(0,0,0,0.4)', 1.2);
        x.fillStyle = 'rgba(0,0,0,0.45)'; x.fillRect(-205, -18, 410, 18);
        for (let k = 0; k < 9; k++) strokePts([[-200, top + 50 + k * 22], [200, top + 52 + k * 22]], 'rgba(120,80,45,0.25)', 1);
        hatch(null, 0.25, 4, 0.22);
      }, { seed: 7301 });
      piece([[-222, top, 1], [222, top, 1], [222, top + 18, 1], [-222, top + 18, 1]], '#2b2a2c', () => {
        strokePts([[-218, top + 3], [218, top + 3]], 'rgba(255,255,255,0.3)', 1.6);
        for (let k = 0; k < 8; k++) dot(-200 + k * 55, top + 10, 1.5, 'rgba(200,200,200,0.25)');
      }, { seed: 7302 });
      // étau : socle boulonné, corps, vis et barre en T, mâchoires
      const { ex, sy, hy } = etauPts();
      piece([[ex - 62, top, 1], [ex + 62, top, 1], [ex + 56, top - 12, 1], [ex - 56, top - 12, 1]], '#3f4943', () => { dot(ex - 44, top - 6, 2.6, '#9aa0a4'); dot(ex + 44, top - 6, 2.6, '#9aa0a4'); }, { seed: 7303 });
      piece([[ex - 58, top - 12, 1], [ex + 58, top - 12, 1], [ex + 58, sy, 1], [ex - 58, sy, 1]], '#4e5a52', () => { hatch(null, 0.9, 3.6, 0.25); strokePts([[ex - 54, top - 16], [ex + 54, top - 16]], 'rgba(220,230,225,0.3)', 1.2); }, { seed: 7304 });
      piece([[ex - 110, (hy + sy) / 2 - 5, 1], [ex - 55, (hy + sy) / 2 - 5, 1], [ex - 55, (hy + sy) / 2 + 5, 1], [ex - 110, (hy + sy) / 2 + 5, 1]], '#8f969b', () => { for (let k = ex - 106; k < ex - 58; k += 5) strokePts([[k, (hy + sy) / 2 - 5], [k + 3, (hy + sy) / 2 + 5]], 'rgba(40,40,40,0.5)', 1); }, { seed: 7305 });
      piece([[ex - 116, (hy + sy) / 2 - 34, 1], [ex - 108, (hy + sy) / 2 - 34, 1], [ex - 108, (hy + sy) / 2 + 34, 1], [ex - 116, (hy + sy) / 2 + 34, 1]], '#8f969b', null, { seed: 7306 });
      for (const sgn of [-1, 1]) piece(ell(ex - 112, (hy + sy) / 2 + sgn * 36, 7, 7, 10), '#5e666b', null, { seed: 7307 + sgn });
      drawMors(x);
    });
    cv.padB = 10; return M.withShadow(cv, 8);
  }
  function makeMors() { const cv = M.cutFlat(PA.w, PA.h, PA.w / 2, PA.h - 10, (x) => drawMors(x)); cv.padB = 10; return cv; }
  // poêle pendue : centre visuel (cuve + manche, x local 50) au milieu du canevas, donc sur le x de M.hung ; M.hung tire ses fils à ±0,3·w
  // du centre : ils tombent sur le bord arrière de la cuve (x local −64) et sur le manche (x local 164). Les fils sont prolongés dans le
  // canevas jusqu'à ces points d'accroche (M.hung les arrête à 30 px du haut).
  const PH = { k: 0.9, w: 342, h: 95, cx: 50 };
  function makePoeleHung(modele) {
    const { k, w, h, cx } = PH, ox = w / 2 - cx * k, hw = 0.3 * w;
    const cv = M.cutFlat(w, h, ox, h - 10, (x) => {
      const yl = (lx) => (lx < 72 ? -26 * Math.sqrt(Math.max(0, 1 - (lx / 72) * (lx / 72))) : lerp(-17, -29, (lx - 120) / 92));
      x.save(); x.strokeStyle = 'rgba(20,15,10,0.55)'; x.lineWidth = 1.3; x.beginPath();
      for (const sx of [cx * k - hw, cx * k + hw]) { const lx = sx / k; x.moveTo(sx, -(h - 10)); x.lineTo(sx, k * (yl(lx) - 44) + 1); }
      x.stroke(); x.restore();
      x.scale(k, k); x.translate(0, -44); drawPoele({ modele, oeuf: 'non' });
    });
    cv.padB = 10; return M.withShadow(cv, 6);
  }
  TEF.init = function () {
    if (TEF.K) return TEF.K;
    const K = (TEF.K = {});
    K.labo = makeLabo(); K.paillasse = makePaillasse(); K.mors = makeMors();
    K.poele = { alu: makePoeleHung('alu'), teflon: makePoeleHung('teflon') };
    return K;
  };
})();
