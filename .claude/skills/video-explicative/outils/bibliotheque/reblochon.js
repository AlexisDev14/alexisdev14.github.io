// bibliotheque/reblochon.js — personnages VALIDÉS de « Le reblochon » (2026), réutilisables dans toute vidéo (chargés dans chaque plan). Espace de noms M.reb (REB). Tout dans une IIFE.
// Aucun texte, lettre, chiffre ou logo. Tout est déterministe (M.rng / M.hash) : S.draw reste une fonction pure de t.
//
// MARIONNETTES (M.chars.*, à dessiner avec M.puppet(def, pose, x, y, s, {dir, slot, cast})) — (x,y) = pieds (ou bas du buste / de la robe)
//   vache, vacheTete   : REB.vache(pose,x,y,s,o) / REB.vacheTete(pose,x,y,s,o) (ajoutent pose.slot pour la 2e tige) ; pièces head jaw earN earF hornN hornF queue clarine
//                        legFN/FF/RN/RF _up/_lo pis ; pose.lid lidB lidF tq clarineK face.mouth
//   paysan             : torso head capuchon corde armB/F_up/_lo legB/F_up/_lo ; REB.assis(pose) ; pose.tenu 'rien'|'louche'|'seau' (+vert, niveau, creme) ; handF/handB
//   controleur, controleurMini : torso head chaperon cornette armB/F_* legB/F_* ; pose.tenu 'jauge'|'couteau'|'rien', tenuB 'taille'|'rien', encoches, encoche, mouille
//   seigneur (buste)   : torso head toque armB/F_* + gobelet (gob_corps, gob_pied) ; pose.lait 0..1 = moustache de lait ; pose.tenu 'gobelet'|'rien' ; niveau
//   moine              : capuche torso cordon head armB/F_up/_lo + fromage (pose.fromage, fromageK) ; face.eyes 'up'|'side'|…
// ACCESSOIRES (M.chars.* + REB.prop(name,pose,x,y,s,o)) : reblochon (etat 'entier'|'entame'|'petit'|'mini', coule, part/partDx/partDy, sq), seau, gobelet, pot, moule, tabouret,
//   plat, panier, couteau*, fourchette*, louche, taille, jauge, clarine, main* (* sur tige : rod:true), portrait (REB.portrait)
// EFFETS : REB.jet, REB.coulee, REB.vapeur, REB.bulle.   AIDES : REB.pose, wink, tourne, respire, marche, vacheMarche, vacheIdle, trayon, assis, cheminPt.
// DÉCORS : REB.init() (dans S.init) remplit REB.K = { aravis{aube,couchant}, prairie, sapinL, sapinR, colline, collineCrete, cuisine{fond,montagnes,montagnesChaud,rebord}, table, tableBois, chalet, chateau, chateauBalcon }
//   + constantes REB.FEN, TABLE, TABLEBOIS, CHALET, CHATEAU, CHEMIN, SEAU, GOB, POT, MOULE, PLAT, PANIER, TABOURET, CLA.
(function () {
  'use strict';
  const X = M.X, P = M.P, TAU = M.TAU, PI = Math.PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, smooth, ease, easeOut, rng, hash } = M;
  const REB = (M.reb = {});
  const CH = M.chars;
  const cx_ = () => M.ctx();

  // ------------------------------------------------------------ palette locale (sourde)
  const Q = {
    acajou: '#8A4A33', acajouD: '#6E3826', acajouL: '#A25E42', ivoire: '#E9DCC0', ivoireD: '#CDBE9C', ivoireL: '#F4EBD6',
    rose: '#C98F8F', roseD: '#A56D6E', roseL: '#DDAAA6', cuir: '#5B3A29', cuirL: '#7B523A', cuirD: '#3E261A',
    laiton: '#B8913F', laitonL: '#E0C478', laitonD: '#7C5F25', encre: '#201018',
    croute: '#C98A4A', crouteD: '#A8692F', crouteL: '#DDA566', pate: '#EFE2C2', pateD: '#D8C592', pateY: '#E9D391',
    epicea: '#D9C18C', epiceaD: '#B49A62', epiceaL: '#E8D6A8',
    lait: '#F4EFE2', laitD: '#DCD3BC', creme: '#F0DE9A', cremeD: '#D2B968', cremeL: '#FBF0C4',
    bois: '#8C6038', boisL: '#B58650', boisD: '#5E3F24', boisDD: '#3F2A18', fer: '#4B4A4E', ferL: '#85848A', ferD: '#2E2D31',
    peau: '#D9A57A', peauD: '#B98259', joue: '#CC857A', ivoireMur: '#E8DDBF',
    sang: '#8E2F2B', sangD: '#6A1F1D', nuit: '#2F4466', nuitD: '#22324E', corde: '#B08A4E', chausse: '#5E4630', chausseD: '#46321F',
    prune: '#5A2E4C', pruneD: '#40203A', pruneL: '#7A4668', slate: '#566C86', slateD: '#3E5068',
    pierre: '#D6C9A9', pierreD: '#A99A7A', pierreL: '#E8DEC6', terre: '#B4623F', terreD: '#8A4630', terreL: '#CF7F57',
  };
  REB.Q = Q;

  // ------------------------------------------------------------ géométrie
  // arc d'ellipse (angles croissants = sens horaire à l'écran) ; n segments → n+1 points
  function ep(cx, cy, rx, ry, n, a0, a1) {
    const out = []; n = n || 16; a0 = a0 || 0; a1 = a1 == null ? TAU : a1;
    for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); }
    return out;
  }
  function ell(cx, cy, rx, ry, n) { const o = ep(cx, cy, rx, ry, n || 16, 0, TAU); o.pop(); return o; }
  const tr = (pts, dx, dy) => pts.map((p) => (p[2] ? [p[0] + dx, p[1] + dy, 1] : [p[0] + dx, p[1] + dy]));
  const scl = (pts, sx, sy) => { sy = sy == null ? sx : sy; return pts.map((p) => (p[2] ? [p[0] * sx, p[1] * sy, 1] : [p[0] * sx, p[1] * sy])); };
  const rotp = (pts, a) => { const c = Math.cos(a), s = Math.sin(a); return pts.map((p) => { const q = [p[0] * c - p[1] * s, p[0] * s + p[1] * c]; if (p[2]) q.push(1); return q; }); };
  const mir = (pts) => pts.map((p) => (p[2] ? [-p[0], p[1], 1] : [-p[0], p[1]]));
  function hull(pts) {
    const p = pts.map((q) => [q[0], q[1]]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = []; for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    const up = []; for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    lo.pop(); up.pop(); return lo.concat(up);
  }
  // ruban épais le long d'une polyligne (épaisseur w0 → w1)
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
  function bez(p0, p1, p2, p3, n) { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]); } return o; }
  function qbez(p0, p1, p2, n) { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]); } return o; }
  REB.geo = { ep, ell, tr, scl, rotp, mir, hull, ribbon, bez, qbez };

  // ------------------------------------------------------------ outils de peinture (dans un paint / extra)
  const lwc = () => M._lw();
  function cpath(pts) { const c = cx_(); c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); }
  function cfill(pts, col) { cpath(pts); const c = cx_(); c.fillStyle = col; c.fill(); }
  function cline(pts, col, w) { const c = cx_(); c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.strokeStyle = col; c.lineWidth = (w || 1) * lwc(); c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke(); }
  function lgrad(x0, y0, x1, y1, stops) { const g = cx_().createLinearGradient(x0, y0, x1, y1); stops.forEach((s) => g.addColorStop(s[0], s[1])); return g; }
  function rgrad(x0, y0, r0, x1, y1, r1, stops) { const g = cx_().createRadialGradient(x0, y0, r0, x1, y1, r1); stops.forEach((s) => g.addColorStop(s[0], s[1])); return g; }
  function fillG(pts, g) { cpath(pts); const c = cx_(); c.fillStyle = g; c.fill(); }
  // mouchetis déterministes dans une ellipse
  function speckle(seed, n, cx, cy, rx, ry, rmin, rmax, cols, a0, a1) {
    const R = rng(seed), c = cx_();
    for (let i = 0; i < n; i++) {
      const a = R() * TAU, r = Math.sqrt(R()), px = cx + Math.cos(a) * rx * r, py = cy + Math.sin(a) * ry * r, rad = lerp(rmin, rmax, R());
      c.globalAlpha = lerp(a0, a1, R()); c.beginPath(); c.ellipse(px, py, rad, rad * 0.7, R() * 3, 0, TAU); c.fillStyle = cols[(R() * cols.length) | 0]; c.fill();
    }
    c.globalAlpha = 1;
  }
  function grainLines(seed, n, x0, y0, x1, y1, col, a, len, ang) {
    const R = rng(seed), c = cx_(); c.save(); c.strokeStyle = col; c.lineWidth = 1 * lwc(); c.globalAlpha = a; c.beginPath();
    for (let i = 0; i < n; i++) { const px = lerp(x0, x1, R()), py = lerp(y0, y1, R()), l = len * (0.4 + R()); const an = (ang || 0) + (R() - 0.5) * 0.12; c.moveTo(px, py); c.quadraticCurveTo(px + Math.cos(an) * l * 0.5, py + Math.sin(an) * l * 0.5 + (R() - 0.5) * 2, px + Math.cos(an) * l, py + Math.sin(an) * l); }
    c.stroke(); c.restore();
  }

  // silhouette d'un cylindre / tronc de cône vu de 3/4 haut : (cx,yT) centre haut, (cx,yB) centre bas
  function frustumPts(yT, Rt, rt, yB, Rb, rb, n) {
    n = n || 14;
    return ep(0, yT, Rt, rt, n, PI, TAU).concat(ep(0, yB, Rb, rb, n, 0, PI));
  }
  // zone avant (flanc visible) : arc avant haut (0→π) puis arc avant bas retour
  function frontBand(yT, Rt, rt, yB, Rb, rb, n) {
    n = n || 14;
    return ep(0, yT, Rt, rt, n, 0, PI).concat(ep(0, yB, Rb, rb, n, PI, 0));
  }

  // ------------------------------------------------------------ fabrique générique d'accessoire simple (un « marionnette » d'une pièce ou plus)
  function propDef(parts, order, extra) {
    return Object.assign({ hipY: 0, parts, order, handLen: 80 }, extra || {});
  }
  // dessine un accessoire (M.chars[name]) comme une marionnette posée : (x,y) = point d'ancrage (pied / centre de la base)
  REB.prop = function (name, pose, x, y, s, o) {
    const d = CH[name];
    const opt = Object.assign({ rod: !!d.rodOn, floorShadow: false }, o || {});
    return M.puppet(d, pose || {}, x, y, s == null ? 1 : s, opt);
  };

  // =====================================================================
  // RÉCIPIENTS (seau, gobelet, pot, moule…) : tronc de cône vu de 3/4 haut, contenu à niveau variable
  // pose.niveau (0..1) : niveau « visuel » ; pose.contenu : 'lait' | 'creme' | 'rien'
  // =====================================================================
  function vessel(o) {
    const oy = o.oy || 0, H = o.H, yT = -H + oy, yB = oy, wall = o.wall || 7;
    const sil = () => frustumPts(yT, o.Rt, o.rt, yB, o.Rb, o.rb, 14);
    const innerR = (d) => { const u = clamp(d / H); return [lerp(o.Rt, o.Rb, u) - wall, lerp(o.rt, o.rb, u) - wall * o.rt / o.Rt]; };
    function paint(pose) {
      const c = cx_(), lw = lwc();
      // flanc : dégradé gauche clair → droite sombre
      const bd = frontBand(yT, o.Rt, o.rt, yB, o.Rb, o.rb, 14);
      cfill(sil(), o.base);
      fillG(bd, lgrad(-o.Rt, 0, o.Rt, 0, [[0, o.light], [0.4, o.base], [1, o.dark]]));
      // douelles
      if (o.staves) {
        const n = o.staves;
        for (let i = 0; i <= n; i++) {
          const a = PI * i / n;
          const p0 = [Math.cos(a) * o.Rt, yT + Math.sin(a) * o.rt], p1 = [Math.cos(a) * o.Rb, yB + Math.sin(a) * o.rb];
          cline([p0, p1], 'rgba(40,24,12,0.55)', 1.3);
          if (i < n) {
            const a2 = PI * (i + 0.5) / n; const q0 = [Math.cos(a2) * o.Rt, yT + Math.sin(a2) * o.rt];
            if (i % 2) { const q1 = [Math.cos(a2) * o.Rb, yB + Math.sin(a2) * o.rb]; cline([q0, q1], 'rgba(255,230,180,0.14)', 5); }
          }
        }
        grainLines(o.seed || 5, 26, -o.Rb, yT + o.rt, o.Rb, yB + o.rb, 'rgba(40,24,10,0.5)', 0.5, 22, PI / 2);
      } else if (o.glaze) {
        o.glaze(c);
      }
      // cerclages (arcs avant à hauteur u)
      for (const b of (o.bands || [])) {
        const u0 = b.u, u1 = b.u + b.h / H;
        const R0 = lerp(o.Rt, o.Rb, u0), r0 = lerp(o.rt, o.rb, u0), R1 = lerp(o.Rt, o.Rb, u1), r1 = lerp(o.rt, o.rb, u1);
        const y0 = lerp(yT, yB, u0), y1 = lerp(yT, yB, u1);
        const band = ep(0, y0, R0, r0, 12, 0, PI).concat(ep(0, y1, R1, r1, 12, PI, 0));
        fillG(band, lgrad(-o.Rt, 0, o.Rt, 0, [[0, b.l], [0.35, b.c], [1, b.d]]));
        cline(ep(0, y0, R0, r0, 12, 0.05, PI - 0.05), 'rgba(0,0,0,0.45)', 1.2);
        cline(ep(0, y1, R1, r1, 12, 0.05, PI - 0.05), 'rgba(0,0,0,0.35)', 1.2);
        cline(ep(0, y0 + 2, R0 - 2, r0, 10, 0.6, 1.5), 'rgba(255,255,255,0.35)', 1.6);
        if (b.rivets) for (let k = 1; k < 6; k++) { const a = PI * k / 6; dot(Math.cos(a) * (R0 + R1) / 2, (y0 + y1) / 2 + Math.sin(a) * (r0 + r1) / 2, 1.6, 'rgba(255,255,255,0.4)'); }
      }
      hatch(bd, 1.35, 4.2, 0.22, 1, M.P.encre);
      shade(o.Rt, 0, -o.Rt * 0.6, 0, 0.3, [-o.Rt - 5, yT - o.rt, o.Rt + 5, yB + o.rb + 5]);
      // ouverture
      if (o.open !== false) {
        const [Ri, ri] = innerR(0);
        const hole = ell(0, yT, Ri, ri, 22);
        c.save(); cpath(hole); c.clip();
        c.fillStyle = lgrad(0, yT - ri, 0, yT + ri, [[0, o.inner0 || '#2a1a10'], [1, o.inner1 || '#5a3d26']]); c.fillRect(-Ri - 2, yT - ri - 2, 2 * Ri + 4, 2 * ri + 4);
        // contenu
        const kind = pose.contenu || o.contenu || 'lait', L = pose.niveau != null ? pose.niveau : (o.niveau != null ? o.niveau : 0);
        if (o.fill) o.fill(c, Ri, ri, yT, pose);
        else if (kind !== 'rien' && L > 0.02) {
          const dmax = 2 * ri * 0.92, d = (1 - clamp(L)) * dmax;
          const [Rs, rs] = innerR(d * H / dmax * 0.35);
          const sy = yT + d;
          const cr = kind === 'creme';
          cfill(ell(0, sy, Rs, rs, 22), cr ? Q.cremeD : Q.laitD);
          c.fillStyle = rgrad(-Rs * 0.25, sy - rs * 0.2, 2, 0, sy, Rs, [[0, cr ? Q.cremeL : '#FFFFFF'], [0.55, cr ? Q.creme : Q.lait], [1, cr ? Q.cremeD : Q.laitD]]);
          cpath(ell(0, sy, Rs * 0.97, rs * 0.97, 22)); c.fill();
          // reflets
          cline(ep(0, sy, Rs * 0.62, rs * 0.55, 8, PI * 1.1, PI * 1.6), 'rgba(255,255,255,0.8)', 1.8);
          if (cr) { cline(ep(0, sy, Rs * 0.38, rs * 0.32, 8, PI * 0.1, PI * 1.2), 'rgba(160,120,40,0.45)', 1.4); cline(ep(0, sy, Rs * 0.7, rs * 0.65, 8, PI * 0.2, PI * 0.9), 'rgba(160,120,40,0.35)', 1.2); }
        }
        c.restore();
      }
      // bord
      cline(ell(0, yT, o.Rt - wall * 0.45, o.rt - wall * 0.45 * o.rt / o.Rt, 24), 'rgba(30,16,8,0.55)', 1.2);
      cline(ell(0, yT, o.Rt - wall * 0.1, o.rt - wall * 0.1 * o.rt / o.Rt, 24), o.rimCol || 'rgba(255,225,170,0.5)', 2.2);
    }
    return { sil, paint, innerR, yT, yB };
  }

  // ------------------------------------------------------------ SEAU À TRAIRE (douelles, 2 cerclages de fer, anse)
  const SEAU = { Rt: 74, rt: 36, Rb: 60, rb: 27, H: 118 };
  function seauParts(pf, parent, at, oy, rest) {
    const o = Object.assign({}, SEAU, { oy: oy || 0, staves: 11, base: Q.bois, light: Q.boisL, dark: Q.boisD, seed: 9,
      bands: [{ u: 0.2, h: 13, l: Q.ferL, c: Q.fer, d: Q.ferD, rivets: 1 }, { u: 0.7, h: 13, l: Q.ferL, c: Q.fer, d: Q.ferD, rivets: 1 }] });
    const V = vessel(o), yT = V.yT;
    const parts = {};
    parts[pf + 'anse'] = { parent: parent, at: at, noRivet: true, seed: 912, base: Q.fer, texA: 0.35,
      pts: (p) => {
        const k = p.anseK != null ? p.anseK : 1, ax = SEAU.Rt - 4;
        return ribbon(qbez([-ax, yT + 4], [0, yT - 180 * k - 4], [ax, yT + 4], 16), 6, 6);
      },
      paint: () => { hatch(null, 0.5, 3, 0.35); }, rest: rest || 0 };
    parts[pf + 'corps'] = { parent: parent, at: at, noRivet: true, seed: 911, base: Q.bois, pts: () => V.sil(), paint: (p) => V.paint(p), rest: rest || 0,
      extra: (p) => {
        if (M._sil()) return;
        // monticule de crème qui dépasse du bord
        if ((p.contenu === 'creme') && (p.niveau || 0) > 0.9) {
          const m = clamp(((p.niveau || 0) - 0.9) * 10);
          fillPts([[-58, yT - 1], [-50, yT - 10 * m], [-26, yT - 20 * m], [0, yT - 24 * m, 0], [28, yT - 18 * m], [52, yT - 8 * m], [60, yT - 1], [0, yT + 8]], Q.creme, 7);
          strokePts([[-36, yT - 8 * m], [-12, yT - 16 * m], [14, yT - 14 * m]], 'rgba(255,255,240,0.9)', 2);
          strokePts([[-20, yT - 2], [10, yT - 8 * m], [34, yT - 3]], 'rgba(160,120,40,0.45)', 1.2);
        }
      } };
    return parts;
  }
  CH.seau = propDef(Object.assign({}, seauParts('', null, [0, 0], 0)), ['anse', 'corps']);
  REB.SEAU = SEAU;

  // ------------------------------------------------------------ GOBELET DE BOIS
  const GOB = { Rt: 38, rt: 15, Rb: 29, rb: 11, H: 88 };
  function gobParts(pf, parent, at, oy, rest) {
    const o = Object.assign({}, GOB, { oy: oy || 0, staves: 8, base: Q.bois, light: Q.boisL, dark: Q.boisD, seed: 21, wall: 5,
      bands: [{ u: 0.12, h: 7, l: Q.laitonL, c: Q.laiton, d: Q.laitonD }, { u: 0.82, h: 7, l: Q.laitonL, c: Q.laiton, d: Q.laitonD }] });
    const V = vessel(o), parts = {};
    // petit pied
    parts[pf + 'pied'] = { parent: parent, at: at, noRivet: true, seed: 921, base: Q.boisD, rest: rest || 0,
      pts: () => frustumPts((oy || 0) - 2, GOB.Rb - 2, GOB.rb - 1, (oy || 0) + 6, GOB.Rb + 4, GOB.rb + 2, 10), paint: () => hatch(null, 0.5, 3, 0.3) };
    parts[pf + 'corps'] = { parent: parent, at: at, noRivet: true, seed: 922, base: Q.bois, pts: () => V.sil(), paint: (p) => V.paint(p), rest: rest || 0 };
    return parts;
  }
  CH.gobelet = propDef(gobParts('', null, [0, 0], 0), ['pied', 'corps']);
  REB.GOB = GOB;

  // ------------------------------------------------------------ POT DE CRÈME (grès sans étiquette) + anse
  const POT = { Rt: 44, rt: 17, Rb: 46, rb: 18, H: 96 };
  function potParts(pf, parent, at, oy, rest) {
    const o = Object.assign({}, POT, { oy: oy || 0, base: '#BBA98A', light: '#D8C8A6', dark: '#8E7C60', wall: 6, rimCol: 'rgba(255,240,200,0.55)', inner0: '#3a2a1c', inner1: '#6a5238',
      glaze: (c) => {
        // épaule vernissée brun-roux (haut) + grès clair (bas)
        const yTn = -POT.H + (oy || 0);
        const top = ep(0, yTn, POT.Rt, POT.rt, 12, 0, PI).concat(ep(0, yTn + 34, POT.Rt + 1, POT.rt, 12, PI, 0));
        fillG(top, lgrad(-POT.Rt, 0, POT.Rt, 0, [[0, '#9a6a42'], [0.4, '#7a4a2c'], [1, '#4f2e1b']]));
        cline(ep(0, yTn + 34, POT.Rt + 1, POT.rt, 12, 0.05, PI - 0.05), 'rgba(60,35,20,0.7)', 2);
        // coulures
        for (const [dx, l] of [[-24, 14], [-6, 22], [18, 12], [32, 18]]) { const a = Math.asin(clamp(dx / POT.Rt)); cline([[dx, yTn + 30 + POT.rt * Math.cos(a)], [dx, yTn + 40 + l]], '#7a4a2c', 4); }
        // stries de tournage
        for (const k of [0.45, 0.6, 0.78]) cline(ep(0, lerp(yTn, oy || 0, k), lerp(POT.Rt, POT.Rb, k), lerp(POT.rt, POT.rb, k), 12, 0.1, PI - 0.1), 'rgba(80,60,35,0.3)', 1.2);
        cline([[-24, yTn + 52], [-26, yTn + 80]], 'rgba(255,250,230,0.5)', 3);
      } });
    const V = vessel(o), parts = {}, yT = V.yT, yM = (oy || 0) - POT.H * 0.55;
    parts[pf + 'anse'] = { parent: parent, at: at, noRivet: true, seed: 931, base: '#A8966F', rest: rest || 0,
      pts: () => mir(ribbon(bez([POT.Rt - 3, yT + 14], [POT.Rt + 40, yT + 6], [POT.Rt + 42, yM + 24], [POT.Rt - 2, yM + 26], 10), 14, 11)), paint: () => hatch(null, 0.6, 3.2, 0.3) };
    // l'anse est à gauche pour un pot tenu de la main droite versant vers +x ; mir() ci-dessus place l'anse à gauche
    parts[pf + 'corps'] = { parent: parent, at: at, noRivet: true, seed: 932, base: '#BBA98A', pts: () => V.sil(), paint: (p) => V.paint(p), rest: rest || 0 };
    return parts;
  }
  CH.pot = propDef(potParts('', null, [0, 0], 0), ['anse', 'corps']);
  REB.POT = POT;

  // ------------------------------------------------------------ MOULE ROND EN BOIS (cercle sans fond) + couvercle (follower)
  const MOU = { Rt: 66, rt: 25, Rb: 66, rb: 25, H: 74 };
  function mouleParts(pf, parent, at, oy, rest) {
    const o = Object.assign({}, MOU, { oy: oy || 0, staves: 0, base: '#B98C55', light: '#D5A872', dark: '#7C5632', wall: 7, rimCol: 'rgba(255,230,180,0.55)', inner0: '#4a3220', inner1: '#7a5836', seed: 31,
      bands: [{ u: 0.12, h: 6, l: '#D5A872', c: '#9a6a3a', d: '#5e3f22' }, { u: 0.78, h: 6, l: '#D5A872', c: '#9a6a3a', d: '#5e3f22' }],
      glaze: (c) => { grainLines(33, 40, -MOU.Rb, -MOU.H + (oy || 0), MOU.Rb, (oy || 0) + 20, 'rgba(70,40,15,0.55)', 0.55, 40, 0.05);
        // trous d'égouttage
        for (let k = 0; k < 9; k++) { const a = PI * (k + 0.5) / 9; dot(Math.cos(a) * MOU.Rb * 0.98, (oy || 0) - MOU.H * 0.5 + Math.sin(a) * MOU.rb * 0.98, 2.2, 'rgba(25,12,5,0.85)'); } } });
    const V = vessel(o), parts = {}, yT = V.yT;
    parts[pf + 'corps'] = { parent: parent, at: at, noRivet: true, seed: 941, base: '#B98C55', pts: () => V.sil(), paint: (p) => V.paint(p), rest: rest || 0 };
    // couvercle / presse : disque de bois avec bouton, monte et descend avec pose.couvY (négatif = haut)
    parts[pf + 'couvercle'] = { parent: parent, at: at, noRivet: true, seed: 942, base: '#C69A62', rest: rest || 0,
      pts: (p) => { const dy = (p.couvY || 0) + yT - 6; return frustumPts(dy - 8, MOU.Rt - 9, MOU.rt - 4, dy + 4, MOU.Rt - 9, MOU.rt - 4, 12).concat([]); },
      paint: (p) => { const dy = (p.couvY || 0) + yT - 6; cfill(ell(0, dy - 8, MOU.Rt - 10, MOU.rt - 5, 18), '#D5AA74'); cline(ell(0, dy - 8, MOU.Rt - 22, MOU.rt - 11, 16), 'rgba(110,70,30,0.4)', 1); grainLines(35, 12, -50, dy - 14, 50, dy + 2, 'rgba(80,50,20,0.5)', 0.5, 30, 0.04); },
      extra: (p) => { if (M._sil()) return; const dy = (p.couvY || 0) + yT - 6; piece([[-9, dy - 8, 1], [9, dy - 8, 1], [8, dy - 24], [-8, dy - 24]], '#9A6A3A', () => hatch(null, 0.6, 3, 0.3), { seed: 943 }); piece(ell(0, dy - 25, 14, 5, 10), '#C69A62', null, { seed: 944 }); } };
    return parts;
  }
  CH.moule = propDef(mouleParts('', null, [0, 0], 0), ['corps', 'couvercle']);
  REB.MOULE = MOU;

  // ------------------------------------------------------------ TABOURET À TROIS PIEDS
  CH.tabouret = (function () {
    const SH = 100;
    const leg = (x0, x1, y0, w0, w1) => [[x0 - w0, y0], [x0 + w0, y0], [x1 + w1, 0, 1], [x1 - w1, 0, 1]];
    const parts = {
      legB: { parent: null, at: [0, 0], noRivet: true, seed: 951, base: Q.boisD, pts: leg(10, 22, -SH + 8, 7, 5), paint: () => hatch(null, 1.4, 3.2, 0.32) },
      legL: { parent: null, at: [0, 0], noRivet: true, seed: 952, base: Q.bois, pts: leg(-44, -64, -SH + 6, 8, 6), paint: () => { hatch(null, 1.4, 3.2, 0.3); shade(10, 0, -10, 0, 0.2, [-90, -130, 0, 5]); } },
      legR: { parent: null, at: [0, 0], noRivet: true, seed: 953, base: Q.boisL, pts: leg(46, 66, -SH + 6, 8, 6), paint: () => { hatch(null, 1.4, 3.2, 0.3); shade(-10, 0, 10, 0, 0.3, [0, -130, 90, 5]); } },
      seat: { parent: null, at: [0, 0], noRivet: true, seed: 954, base: Q.boisL, pts: frustumPts(-SH, 66, 16, -SH + 14, 64, 15, 12), paint: () => {
        const c = cx_(); cfill(ell(0, -SH, 64, 15, 20), '#C99A62');
        cline(ell(0, -SH, 44, 10, 16), 'rgba(90,55,25,0.35)', 1); cline(ell(0, -SH, 24, 5.5, 14), 'rgba(90,55,25,0.3)', 1);
        grainLines(956, 14, -56, -SH - 10, 56, -SH + 8, 'rgba(70,40,15,0.5)', 0.5, 26, 0.04);
        const bd = frontBand(-SH, 66, 16, -SH + 14, 64, 15, 10); fillG(bd, lgrad(-66, 0, 66, 0, [[0, Q.boisL], [1, Q.boisD]])); hatch(bd, 1.2, 3.5, 0.3);
        cline(ell(0, -SH, 64, 15, 20), 'rgba(255,235,190,0.45)', 1.6); } },
    };
    return propDef(parts, ['legB', 'legL', 'legR', 'seat']);
  })();
  REB.TABOURET = { h: 100 };

  // =====================================================================
  // REBLOCHON — 3 états : pose.etat = 'entier' | 'entame' | 'petit'
  // origine = centre de la base (point de contact avec la table) ; grand R = 100 px (diamètre ≈ 2,8 × épaisseur)
  // pose.coule 0..1 (pâte qui coule), pose.partDx/partDy/ang.part (la part retirée), pose.sq (étirement vertical)
  // =====================================================================
  const CHE = { R: 100, ry: 37, T: 60, tb: 8, a1: 0.98, a2: 2.16 };
  const OFF = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];
  function cg(pose) {
    const f = pose.etat === 'petit' ? 0.52 : pose.etat === 'mini' ? 0.34 : 1;
    return { f, R: CHE.R * f, ry: CHE.ry * f, T: CHE.T * f, tb: CHE.tb * f, sy: 1 + (pose.sq || 0), ent: pose.etat === 'entame', a1: CHE.a1, a2: CHE.a2 };
  }
  const squashPts = (pts, g) => (g.sy === 1 ? pts : pts.map((p) => (p[2] ? [p[0], p[1] * g.sy, 1] : [p[0], p[1] * g.sy])));
  // pièces de géométrie du reblochon
  function cheTopC(g) { return -g.tb - g.T; }
  function cheSilhouette(g) { return frustumPts(cheTopC(g), g.R, g.ry, -g.tb, g.R, g.ry, 14); }
  function cheSector(g) {
    const yt = cheTopC(g), yf = -g.tb;
    const topArc = ep(0, yt, g.R, g.ry, 8, g.a1, g.a2), floorArc = ep(0, yf, g.R, g.ry, 8, g.a1, g.a2);
    return { O: [0, yt], F0: [0, yf], topArc, floorArc, hull: hull([[0, yt], ...topArc, [0, yf], ...floorArc]) };
  }
  // la croûte : safran éteint voilé de blanc
  function paintRindTop(g, c) {
    const yt = cheTopC(g);
    cfill(ell(0, yt, g.R, g.ry, 26), Q.croute);
    c.fillStyle = rgrad(-g.R * 0.3, yt - g.ry * 0.3, 4, 0, yt, g.R * 1.05, [[0, '#F4CC90'], [0.55, '#E4A55C'], [1, '#CC8744']]);
    cpath(ell(0, yt, g.R, g.ry, 26)); c.fill();
    // voile blanc : nuages poudrés + mouchetis
    c.save(); cpath(ell(0, yt, g.R, g.ry, 26)); c.clip();
    c.fillStyle = rgrad(-g.R * 0.15, yt - g.ry * 0.15, 4, 0, yt, g.R * 0.9, [[0, 'rgba(248,242,226,0.78)'], [0.6, 'rgba(244,234,214,0.42)'], [1, 'rgba(240,230,210,0.12)']]);
    c.fillRect(-g.R, yt - g.ry, 2 * g.R, 2 * g.ry);
    speckle(77, 260, 0, yt, g.R * 0.97, g.ry * 0.97, 0.9 * g.f, 3.2 * g.f, ['#F7F0DE', '#EFE3C6', '#FBF6E8'], 0.4, 0.9);
    speckle(79, 14, 0, yt, g.R * 0.9, g.ry * 0.9, 5 * g.f, 12 * g.f, ['#F4EAD0'], 0.12, 0.25);
    speckle(78, 60, 0, yt, g.R * 0.95, g.ry * 0.95, 1 * g.f, 3.5 * g.f, ['#C7843F', '#B5702F'], 0.25, 0.5);
    // fines stries de moule (croûte lavée)
    for (let i = 1; i < 5; i++) cline(ell(0, yt, g.R * i / 5.2, g.ry * i / 5.2, 22), 'rgba(120,70,25,0.14)', 1);
    c.restore();
    // arête arrondie
    cline(ep(0, yt, g.R - 3, g.ry - 1.5, 16, PI * 0.08, PI * 0.92), 'rgba(255,236,190,0.7)', 2.6);
    cline(ell(0, yt, g.R, g.ry, 26), 'rgba(90,50,20,0.55)', 1.2);
  }
  function paintRindSide(g, c) {
    const yt = cheTopC(g), yb = -g.tb;
    const band = frontBand(yt, g.R, g.ry, yb, g.R, g.ry, 16);
    fillG(band, lgrad(-g.R, 0, g.R, 0, [[0, '#EAB06C'], [0.45, '#D89A50'], [1, '#A86B35']]));
    c.save(); cpath(band); c.clip();
    // stries verticales de croûte + mouchetis blancs
    for (let i = 0; i <= 38; i++) { const a = PI * i / 38; const x = Math.cos(a) * g.R; const y0 = yt + Math.sin(a) * g.ry; cline([[x, y0], [x + (hash(i) - 0.5) * 2, y0 + g.T]], 'rgba(80,40,12,0.09)', 1); }
    speckle(81, 170, 0, (yt + yb) / 2 + g.ry * 0.5, g.R * 0.97, g.T * 0.47, 0.8 * g.f, 3 * g.f, ['#F4EBD3', '#E9DAB8'], 0.3, 0.8);
    // ligne de joint « voile » à mi-hauteur
    cline(ep(0, (yt + yb) / 2, g.R, g.ry, 16, 0.05, PI - 0.05), 'rgba(250,240,220,0.22)', 2.4);
    c.restore();
    hatch(band, 1.3, 4, 0.2);
    cline(ep(0, yb, g.R, g.ry, 16, 0.05, PI - 0.05), 'rgba(50,25,8,0.55)', 1.3);
  }
  function paintNotch(g, c, pose) {
    const S = cheSector(g), yt = cheTopC(g), yf = -g.tb;
    // fond de l'entaille : rondelle d'épicéa, puis les deux faces de coupe en V
    cfill(S.hull, Q.pateD);
    const floorS = [S.F0, ...S.floorArc];
    fillG(floorS, rgrad(0, yf, 2, 0, yf, g.R, [[0, Q.epiceaL], [1, Q.epicea]]));
    grainLines(83, 8, -g.R * 0.6, yf, g.R * 0.6, yf + g.ry, 'rgba(90,60,25,0.45)', 0.5, 20, 0.08);
    const faces = [[S.topArc[0], S.floorArc[0], 0], [S.topArc[S.topArc.length - 1], S.floorArc[S.floorArc.length - 1], 1]];
    for (const [Pt, Pf, k] of faces) {
      const q = [S.O, Pt, Pf, S.F0];
      fillG(q, lgrad(0, yt, 0, yf, k ? [[0, '#EBD9A0'], [1, '#F1E3B4']] : [[0, '#F7EBC0'], [1, '#FBF1D2']]));
      c.save(); cpath(q); c.clip();
      for (let i = 1; i < 5; i++) cline([[lerp(S.O[0], Pt[0], i / 5), lerp(S.O[1], Pt[1], i / 5)], [lerp(S.F0[0], Pf[0], i / 5), lerp(S.F0[1], Pf[1], i / 5)]], 'rgba(190,160,90,0.16)', 1);
      speckle(85 + k, 8, (S.O[0] + Pt[0]) / 2, (yt + yf) / 2 + 6, 20 * g.f, 22 * g.f, 1 * g.f, 2.2 * g.f, ['#D6BE82'], 0.35, 0.65);
      if (k) shade(0, 0, -g.R * 0.6, 0, 0.22, [-g.R, yt - 10, g.R, yf + 20]);
      c.restore();
      cline([S.O, Pt], Q.croute, 3.4); cline([Pt, Pf], Q.crouteD, 3.2);
    }
    cline([S.O, S.F0], 'rgba(150,115,50,0.55)', 1.4);
  }

  function cheParts() {
    const parts = {};
    parts.rondelle = { parent: null, at: [0, 0], noRivet: true, seed: 961, base: Q.epicea,
      pts: (p) => { const g = cg(p), R2 = g.R + 10 * g.f; return squashPts(frustumPts(-g.tb, R2, R2 * 0.4, 0, R2, R2 * 0.4, 16), g); },
      paint: (p) => { const g = cg(p), R2 = g.R + 10 * g.f, r2 = R2 * 0.4, c = cx_(); c.save(); c.scale(1, g.sy);
        const bd = frontBand(-g.tb, R2, r2, 0, R2, r2, 14); fillG(bd, lgrad(-R2, 0, R2, 0, [[0, Q.epiceaL], [1, Q.epiceaD]]));
        cfill(ell(0, -g.tb, R2, r2, 24), Q.epicea);
        for (const k of [0.3, 0.55, 0.8]) cline(ell(0, -g.tb, R2 * k, r2 * k, 20), 'rgba(110,75,30,0.3)', 1);
        grainLines(962, 16, -R2, -g.tb - r2, R2, -g.tb + r2, 'rgba(100,65,25,0.5)', 0.5, 40, 0.04);
        cline(ep(0, 0, R2, r2, 14, 0.05, PI - 0.05), 'rgba(60,35,12,0.45)', 1.2);
        c.restore(); } };
    parts.corps = { parent: null, at: [0, 0], noRivet: true, seed: 963, base: Q.croute,
      pts: (p) => squashPts(cheSilhouette(cg(p)), cg(p)),
      paint: (p) => { const g = cg(p), c = cx_(); c.save(); c.scale(1, g.sy);
        paintRindSide(g, c); paintRindTop(g, c); if (g.ent) paintNotch(g, c, p);
        shade(g.R, 0, -g.R * 0.8, 0, 0.28, [-g.R - 5, -g.T - g.ry - 20, g.R + 5, g.ry + 5]);
        c.restore(); } };
    // la part retirée (visible seulement pour etat 'entame' ; sinon masquer par pose.hide.part ; elle glisse avec pose.partDx/partDy)
    parts.part = { parent: null, at: [0, 0], noRivet: true, seed: 964, base: Q.croute,
      pts: (p) => { const g = cg(p), S = cheSector(g); if (!g.ent || !p.part) return OFF; const h = tr(S.hull, p.partDx || 0, p.partDy || 0).map((q) => [q[0], q[1], 1]); return squashPts(h, g); },
      paint: (p) => { const g = cg(p), S = cheSector(g), c = cx_(); if (!g.ent || !p.part) return; c.save(); c.translate(p.partDx || 0, p.partDy || 0); c.scale(1, g.sy);
        const flat = !!(p.partDx || p.partDy || p.partFlat);          // part sortie : posée à plat, face de coupe vers le haut
        const band = ep(0, cheTopC(g), g.R, g.ry, 8, g.a1, g.a2).concat(ep(0, -g.tb, g.R, g.ry, 8, g.a2, g.a1));
        const P1 = S.topArc[0], P2 = S.topArc[S.topArc.length - 1], P1f = S.floorArc[0], P2f = S.floorArc[S.floorArc.length - 1];
        fillG(S.hull, Q.pateD);
        fillG(band, lgrad(-g.R, 0, g.R, 0, [[0, '#EAB06C'], [1, '#A86B35']]));                       // croûte : seulement l'arc extérieur
        speckle(87, 14, g.R * 0.45, -g.T * 0.45, g.R * 0.4, g.T * 0.3, 1.2, 3.5, ['#F0E4CC'], 0.3, 0.7);
        const topS = [S.O, ...S.topArc];
        if (flat) { fillG(topS, lgrad(0, S.O[1], 0, S.O[1] + g.ry, [[0, '#F8EDC8'], [1, Q.pate]]));
          for (let i = 1; i < 5; i++) cline([S.O, [lerp(P1[0], P2[0], i / 5), lerp(P1[1], P2[1], i / 5)]], 'rgba(190,160,90,0.18)', 1);
          cline(S.topArc, Q.croute, 3.4); cline([S.O, P1], Q.pateD, 1.6); cline([S.O, P2], Q.pateD, 1.6); }
        else { fillG(topS, lgrad(0, S.O[1], 0, S.O[1] + g.ry, [[0, '#E0A769'], [1, Q.croute]]));
          speckle(88, 22, g.R * 0.5, S.O[1] + g.ry * 0.5, g.R * 0.4, g.ry * 0.4, 1.4, 4, ['#F2E8D2', '#E9D9B8'], 0.4, 0.8); }
        fillG([S.O, P2, P2f, S.F0], lgrad(0, S.O[1], 0, S.F0[1], [[0, Q.pate], [1, Q.pateD]]));
        cline([S.O, P2], flat ? Q.pateD : Q.croute, 2.5);
        hatch(null, 1.3, 6, 0.08, 1, M.P.encre, [-g.R, -g.T - g.ry, g.R, g.ry]);
        c.restore(); } };
    // pâte qui coule sur la rondelle : mare irrégulière + langues, pose.coule 0..1
    parts.coulee = { parent: null, at: [0, 0], noRivet: true, seed: 965, base: Q.pate,
      pts: (p) => { const g = cg(p), k = clamp(p.coule || 0); if (!g.ent || k < 0.02) return OFF; return pateBlob(g, k); },
      paint: (p) => { const g = cg(p), k = clamp(p.coule || 0), c = cx_(); if (!g.ent || k < 0.02) return;
        const S = cheSector(g), mx = 0;
        fillG(pateBlob(g, k), rgrad(mx, -g.tb + g.ry * 0.5, 2, mx, -g.tb + g.ry * 0.5, g.R * (0.3 + 0.7 * k), [[0, '#FBF0CF'], [0.6, Q.pate], [1, Q.pateY]]));
        cline(ep(mx, -g.tb + g.ry * 0.6, g.R * 0.25 * (0.4 + k), g.ry * 0.28, 8, PI * 1.05, PI * 1.7), 'rgba(255,255,240,0.9)', 1.8);
        hatch(null, 0.2, 7, 0.05, 1, M.P.encre, [-g.R, -g.T, g.R, g.ry + 30]); } };
    function pateBlob(g, k) {
            const S = cheSector(g), am = (g.a1 + g.a2) / 2, bx = 0, by = -g.tb + Math.sin(am) * g.ry * 0.7;
      const pts = [], n = 14, Rr = g.R * (0.18 + 0.55 * k);
      for (let i = 0; i < n; i++) {
        const a = TAU * i / n, rr = Rr * (0.72 + 0.35 * hash(i * 1.7 + 3)) * (1 + (Math.sin(a) > 0.3 ? 0.35 * k : 0));
        pts.push([bx + Math.cos(a) * rr * 1.1, by + Math.sin(a) * rr * 0.42 * (1 + 0.5 * (Math.sin(a) > 0 ? k : 0))]);
      }
      return pts;
    }
    return parts;
  }
  CH.reblochon = propDef(cheParts(), ['rondelle', 'corps', 'coulee', 'part']);
  REB.CHEESE = CHE;

  // ------------------------------------------------------------ PLAT À TARTIFLETTE (terre cuite, gratin) — pose.creme 0..1 (crème versée, déborde)
  const PLAT = { Rt: 152, rt: 62, Rb: 120, rb: 46, H: 62 };
  function platParts(pf, parent, at, oy, rest) {
    oy = oy || 0;
    const o = Object.assign({}, PLAT, { oy, base: Q.terre, light: Q.terreL, dark: Q.terreD, wall: 13, rimCol: 'rgba(255,215,170,0.6)', inner0: '#7a3a1c', inner1: '#9a5028', seed: 41,
      bands: [{ u: 0.06, h: 8, l: '#D88E64', c: '#B4623F', d: '#7C3A22' }],
      glaze: (c) => { grainLines(43, 24, -PLAT.Rb, -PLAT.H + oy, PLAT.Rb, oy, 'rgba(70,30,15,0.5)', 0.4, 36, 0.05); },
      fill: (c, Ri, ri, yT, p) => {
        const y0 = yT + 5;
        // gratin : croûte de fromage dorée, taches brûlées, bulles, lardons
        c.fillStyle = rgrad(-Ri * 0.2, y0 - ri * 0.2, 4, 0, y0, Ri, [[0, '#EBC067'], [0.6, '#D7A04C'], [1, '#B27632']]); c.fillRect(-Ri, y0 - ri, 2 * Ri, 2 * ri);
        speckle(45, 26, 0, y0, Ri * 0.9, ri * 0.88, 4, 12, ['#8a4a1e', '#a5622a', '#6e3a18'], 0.35, 0.7);
        speckle(46, 28, 0, y0, Ri * 0.9, ri * 0.88, 3, 8, ['#F3DE9A', '#F7E8B4'], 0.5, 0.85);
        for (let i = 0; i < 18; i++) { const R = rng(47 + i); const a = R() * TAU, r = Math.sqrt(R()); const bx = Math.cos(a) * Ri * 0.85 * r, by = y0 + Math.sin(a) * ri * 0.8 * r, rr = 4 + R() * 7; cfill(ell(bx, by, rr, rr * 0.7, 8), 'rgba(250,225,150,0.6)'); cline(ep(bx, by, rr, rr * 0.7, 6, PI * 1.1, PI * 1.9), 'rgba(110,60,20,0.55)', 1.2); }
        for (let i = 0; i < 7; i++) { const R = rng(60 + i), px = (R() - 0.5) * Ri * 1.5, py = y0 + (R() - 0.5) * ri * 1.2, a = R() * 3; piece(rotp([[-14, -4], [14, -4], [14, 4], [-14, 4]], a).map((q) => [q[0] + px, q[1] + py]), '#B9695A', null, { seed: 70 + i, drop: false, edge: 'rgba(120,60,50,0.0)', texA: 0.4 }); }
        const k = clamp(p.creme || 0);
        if (k > 0.02) {
          // nappe de crème versée : mare qui s'étale depuis le centre
          const pts = []; for (let i = 0; i < 18; i++) { const a = TAU * i / 18, r = (0.25 + 0.7 * k) * (0.82 + 0.28 * hash(i * 2.3 + 1)); pts.push([Math.cos(a) * Ri * r, y0 + Math.sin(a) * ri * r]); }
          fillG(pts, rgrad(-Ri * 0.15, y0 - ri * 0.2, 4, 0, y0, Ri * (0.3 + 0.7 * k), [[0, Q.cremeL], [0.6, Q.creme], [1, Q.cremeD]]));
          cline(ep(-Ri * 0.1 * k, y0 - ri * 0.1, Ri * 0.45 * k, ri * 0.4 * k, 8, PI * 1.1, PI * 1.8), 'rgba(255,255,245,0.95)', 2.4);
        }
      } });
    const V = vessel(o), parts = {}, yT = V.yT;
    for (const sd of [-1, 1]) parts[pf + (sd < 0 ? 'oreilleL' : 'oreilleR')] = { parent, at, noRivet: true, seed: 971 + sd, base: Q.terre, rest: rest || 0,
      pts: [[sd * (PLAT.Rt - 6), yT + 2], [sd * (PLAT.Rt + 30), yT - 4], [sd * (PLAT.Rt + 40), yT + 14], [sd * (PLAT.Rt + 26), yT + 26], [sd * (PLAT.Rt - 6), yT + 28]],
      paint: () => { hatch(null, 0.8, 3.4, 0.28); shade(sd * 40, 0, -sd * 5, 0, 0.25, [yT - 40, yT - 20, PLAT.Rt + 50, yT + 40].map((v, i) => (i % 2 ? v : sd * v))); } };
    parts[pf + 'corps'] = { parent, at, noRivet: true, seed: 973, base: Q.terre, pts: () => V.sil(), paint: (p) => V.paint(p), rest: rest || 0,
      extra: (p) => {
        if (M._sil()) return; const k = clamp(((p.creme || 0) - 0.55) / 0.45); if (k <= 0) return;
        // la crème déborde sur le bord avant
        for (const [dx, len] of [[-60, 24], [-10, 38], [44, 28], [92, 16]]) {
          const l = len * k, a = Math.asin(clamp(dx / PLAT.Rt)), yy = yT + PLAT.rt * Math.cos(a) + 2;
          piece([[dx - 11, yy - 6], [dx + 11, yy - 6], [dx + 9, yy + l - 6], [dx, yy + l + 6], [dx - 9, yy + l - 6]], Q.creme, () => { cline([[dx - 4, yy], [dx - 4, yy + l - 2]], 'rgba(255,255,245,0.9)', 2); }, { seed: dx + 980, drop: false });
        }
      } };
    return parts;
  }
  CH.plat = propDef(platParts('', null, [0, 0], 0), ['oreilleL', 'oreilleR', 'corps']);
  REB.PLAT = PLAT;

  // ------------------------------------------------------------ PANIER d'osier + LINGE blanc ; pose.dedans 0..1 (le petit fromage dedans), pose.linge 0..1 (recouvrement)
  const PAN = { Rt: 104, rt: 36, Rb: 82, rb: 28, H: 92 };
  function panierParts(pf, parent, at, oy, rest) {
    oy = oy || 0; const yT = oy - PAN.H;
    const sil = () => frustumPts(yT, PAN.Rt, PAN.rt, oy, PAN.Rb, PAN.rb, 14);
    const parts = {};
    parts[pf + 'anse'] = { parent, at, noRivet: true, seed: 981, base: '#B58A52', rest: rest || 0, texA: 0.5,
      pts: () => ribbon(qbez([-PAN.Rt + 6, yT + 4], [0, yT - 230], [PAN.Rt - 6, yT + 4], 18), 15, 15),
      paint: () => { for (let i = -10; i < 12; i++) { const u = i * 14; cline([[u - 6, -400 + oy], [u + 6, 200 + oy]], 'rgba(70,40,15,0.45)', 1.4); } hatch(null, 1.0, 3, 0.25); } };
    parts[pf + 'corps'] = { parent, at, noRivet: true, seed: 982, base: '#C2955A', pts: sil, rest: rest || 0,
      paint: (p) => {
        const c = cx_(), bd = frontBand(yT, PAN.Rt, PAN.rt, oy, PAN.Rb, PAN.rb, 14);
        cfill(sil(), '#C2955A'); fillG(bd, lgrad(-PAN.Rt, 0, PAN.Rt, 0, [[0, '#DDB57A'], [0.5, '#C2955A'], [1, '#8C6232']]));
        // vannerie : rangs de brins verticaux + tresse horizontale
        c.save(); cpath(bd); c.clip();
        for (let r = 0; r < 7; r++) {
          const u = r / 7, u2 = (r + 1) / 7;
          const rows = ep(0, lerp(yT, oy, u), lerp(PAN.Rt, PAN.Rb, u), lerp(PAN.rt, PAN.rb, u), 18, 0, PI);
          const rows2 = ep(0, lerp(yT, oy, u2), lerp(PAN.Rt, PAN.Rb, u2), lerp(PAN.rt, PAN.rb, u2), 18, 0, PI);
          for (let i = 0; i < 18; i++) {
            const a = rows[i], b = rows[i + 1], a2 = rows2[i], b2 = rows2[i + 1];
            const col = (i + r) % 2 ? '#CFA466' : '#B58650';
            cfill([a, b, b2, a2], col); cline([a, b], 'rgba(60,35,12,0.45)', 1.2);
            cline([[(a[0] + a2[0]) / 2, (a[1] + a2[1]) / 2], [(b[0] + b2[0]) / 2, (b[1] + b2[1]) / 2]], 'rgba(255,230,170,0.25)', 1);
          }
          cline(rows2.slice(0, 19), 'rgba(60,35,12,0.5)', 1.6);
        }
        c.restore();
        hatch(bd, 1.3, 4.5, 0.2);
        // ouverture + intérieur
        const Ri = PAN.Rt - 8, ri = PAN.rt - 5;
        c.save(); cpath(ell(0, yT, Ri, ri, 22)); c.clip();
        c.fillStyle = lgrad(0, yT - ri, 0, yT + ri, [[0, '#3b2512'], [1, '#6a4824']]); c.fillRect(-Ri, yT - ri, 2 * Ri, 2 * ri);
        const dd = clamp(p.dedans || 0);
        if (dd > 0.02) { // petit fromage dans le panier : calotte de croûte
          const cy = yT + ri * 0.35 - (1 - dd) * 30;
          cfill(ell(0, cy, 44, 17, 16), '#DDA25D'); speckle(131, 30, 0, cy, 40, 15, 1, 3, ['#F4EBD3'], 0.4, 0.8); cline(ep(0, cy, 44, 17, 12, 0.1, PI - 0.1), 'rgba(90,50,20,0.5)', 1.4);
        }
        c.restore();
        cline(ell(0, yT, PAN.Rt - 3, PAN.rt - 1, 26), '#7b5528', 5); cline(ell(0, yT, PAN.Rt - 3, PAN.rt - 1, 26), 'rgba(255,225,160,0.4)', 1.6);
        shade(PAN.Rt, 0, -PAN.Rt * 0.5, 0, 0.28, [-PAN.Rt - 4, yT - 40, PAN.Rt + 4, oy + 40]);
      } };
    // linge blanc : recouvre l'ouverture de gauche à droite (pose.linge 0..1) et retombe sur le bord avant
    const lingePts = (p) => {
      const k = clamp(p.linge != null ? p.linge : 0); if (k < 0.02) return OFFP;
      const L = -PAN.Rt - 6, Rr = lerp(L + 10, PAN.Rt + 6, k);
      const top = [[L, yT + 2], [L + 30, yT - 14 - 8 * k], [(L + Rr) / 2, yT - 22 - 10 * k], [Rr - 30, yT - 14 - 6 * k], [Rr, yT + 2]];
      const front = [[Rr + 4, yT + 22 + 10 * k], [lerp(Rr, L, 0.2), yT + 52 + 8 * k], [(L + Rr) / 2 + 20, yT + 60 + 12 * k, 0], [(L + Rr) / 2 - 40, yT + 50], [L + 28, yT + 62 + 6 * k], [L - 4, yT + 30]];
      return top.concat(front);
    };
    parts[pf + 'linge'] = { parent, at, noRivet: true, seed: 983, base: '#F2EEE2', rest: rest || 0, pts: lingePts,
      paint: (p) => { if (clamp(p.linge || 0) < 0.02) return; const c = cx_(); const k = clamp(p.linge), L = -PAN.Rt - 6, Rr = lerp(L + 10, PAN.Rt + 6, k);
        for (let i = 0; i < 6; i++) { const xx = lerp(L, Rr, (i + 0.5) / 6); cline([[xx, yT - 10], [xx + (i % 2 ? 6 : -6), yT + 46], [xx + (i % 2 ? -4 : 5), yT + 66]], 'rgba(120,125,140,0.38)', 1.6); }
        cline([[L + 6, yT + 36], [Rr - 6, yT + 38]], 'rgba(150,150,165,0.5)', 1.3);
        hatch(null, 1.35, 6, 0.1, 1, '70,74,90'); shade(0, yT + 60, 0, yT - 20, 0.2, [L - 10, yT - 60, Rr + 10, yT + 90], '110,100,100'); } };
    return parts;
  }
  const OFFP = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];
  CH.panier = propDef(panierParts('', null, [0, 0], 0), ['anse', 'corps', 'linge']);
  REB.PANIER = PAN;

  // ------------------------------------------------------------ COUTEAU DE CUISINE sur tige (rodOn) ; origine = bout du manche
  const COU_BLADE = [[-8, 0, 1], [9, 0, 1], [11, 12], [10, 50], [7, 95], [2, 132], [-4, 168, 1], [-7, 125], [-8, 60]];
  function couteauParts(pf, parent, at, rest) {
    const parts = {};
    parts[pf + 'manche'] = { parent, at, noRivet: true, seed: 991, base: Q.boisD, rest: rest || 0,
      pts: [[-9, -4], [9, -4], [11, 8], [10, 64], [8, 74, 1], [-8, 74, 1], [-10, 64], [-11, 8]],
      paint: () => { grainLines(992, 10, -10, 0, 10, 70, 'rgba(30,15,5,0.55)', 0.5, 40, PI / 2); hatch(null, 1.4, 3.4, 0.25); shade(10, 0, -10, 0, 0.3, [-14, -6, 14, 80]);
        fillPts([[-12, 66], [12, 66], [12, 76], [-12, 76]], Q.laiton); }, extra: () => { if (M._sil()) return; M.rivet(0, 14, 2.6); M.rivet(0, 36, 2.6); M.rivet(0, 56, 2.6); } };
    parts[pf + 'lame'] = { parent: pf + 'manche', at: [0, 74], noRivet: true, seed: 993, base: '#C9CBD0', pts: COU_BLADE,
      paint: () => { fillPts([[-8, 0], [-4, 0], [-4, 60], [-3, 125], [-4, 168], [-7, 125], [-8, 60]], '#7d818a', 1, 0);
        fillPts([[2, 12], [11, 12], [10, 50], [7, 95], [2, 132], [-4, 168], [-2, 120], [0, 60]], '#EEF0F3', 2, 0);          // tranchant clair
        fillPts([[-9, 0], [10, 0], [10, 11], [-9, 11]], Q.laiton, 3, 0); strokePts([[-1, 16], [-1, 120]], 'rgba(255,255,255,0.8)', 1.4); shade(12, 0, -8, 0, 0.18, [-14, -4, 14, 172]); } };
    return parts;
  }
  CH.couteau = propDef(couteauParts('', null, [0, 0], 0.7), ['manche', 'lame'], { rod: { part: 'manche', at: [0, -2] }, rodOn: true });
  REB.COUTEAU = { len: 242 };

  // ------------------------------------------------------------ FOURCHETTE + POMME DE TERRE sur tige ; pose.pate 0..1 (coulée de fromage sur la patate) ; hide.patate
  function fourchetteParts(pf, parent, at, rest) {
    const parts = {};
    parts[pf + 'manche'] = { parent, at, noRivet: true, seed: 1001, base: Q.boisD, rest: rest || 0,
      pts: [[-8, -4], [8, -4], [10, 10], [8, 96, 1], [-8, 96, 1], [-10, 10]], paint: () => { grainLines(1002, 8, -10, 0, 10, 96, 'rgba(30,15,5,0.55)', 0.5, 40, PI / 2); hatch(null, 1.4, 3.4, 0.25); shade(10, 0, -10, 0, 0.3, [-14, -6, 14, 100]); },
      extra: () => { if (M._sil()) return; M.rivet(0, 12, 2.4); M.rivet(0, 80, 2.4); } };
    parts[pf + 'dents'] = { parent: pf + 'manche', at: [0, 96], noRivet: true, seed: 1003, base: '#C9CBD0',
      pts: [[-5, -4], [5, -4], [7, 18], [20, 40], [21, 118, 1], [16, 120, 1], [14, 54], [8, 54], [8, 124, 1], [3, 124, 1], [3, 58], [-3, 58], [-3, 124, 1], [-8, 124, 1], [-8, 54], [-14, 54], [-16, 120, 1], [-21, 118, 1], [-20, 40], [-7, 18]],
      paint: () => { fillPts([[-5, -4], [-1, -4], [-3, 90], [-9, 60]], '#E8EAEE'); strokePts([[-18, 70], [-18, 112]], 'rgba(255,255,255,0.8)', 1.4); hatch(null, 1.3, 4.5, 0.15); } };
    parts[pf + 'patate'] = { parent: pf + 'manche', at: [0, 96], noRivet: true, seed: 1004, base: '#C9A25F',
      pts: [[-34, 30], [-30, 62], [-6, 76], [26, 72], [40, 48], [34, 22], [10, 16], [-18, 16]].map((q) => [q[0], q[1] + 12]),
      paint: (p) => { const c = cx_(); fillG([[-34, 30], [-30, 62], [-6, 76], [26, 72], [40, 48], [34, 22], [10, 16], [-18, 16]].map((q) => [q[0], q[1] + 12]), rgrad(-8, 40, 4, 0, 52, 44, [[0, '#E0BC72'], [1, '#A47B3C']]));
        for (const [x, y] of [[-14, 60], [12, 52], [18, 78], [-6, 82]]) { dot(x, y, 2.4, 'rgba(70,45,15,0.7)'); strokePts([[x - 3, y + 2], [x + 3, y + 3]], 'rgba(70,45,15,0.5)', 1); }
        speckle(1005, 14, 0, 64, 30, 24, 1, 2.4, ['#8a6a30'], 0.3, 0.6);
        const k = clamp(p.pate || 0); if (k > 0.02) { fillPts([[-30, 40], [36, 38], [38, 52 + 26 * k], [24, 56 + 38 * k], [10, 52 + 20 * k], [-6, 60 + 34 * k], [-20, 54 + 18 * k], [-34, 58 + 12 * k]], Q.pate, 5, 0);
          strokePts([[-18, 46], [10, 44]], 'rgba(255,255,240,0.9)', 2); }
        hatch(null, 0.9, 4.4, 0.18); shade(40, 62, -30, 72, 0.3, [-40, 30, 44, 100]); } };
    return parts;
  }
  CH.fourchette = propDef(fourchetteParts('', null, [0, 0], 0.5), ['manche', 'dents', 'patate'], { rod: { part: 'manche', at: [0, -2] }, rodOn: true });

  // ------------------------------------------------------------ LOUCHE DE BOIS ; pose.creme 0..1 (crème dans le creux) ; origine = prise de main, le manche descend vers +y
  function loucheParts(pf, parent, at, rest) {
    const parts = {};
    parts[pf + 'louche'] = { parent, at, noRivet: true, seed: 1011, base: Q.boisL, rest: rest || 0,
      pts: ribbon(qbez([0, -50], [2, 40], [-4, 130], 12), 12, 9).concat([]),
      paint: () => { grainLines(1012, 8, -8, -50, 8, 130, 'rgba(60,35,12,0.55)', 0.5, 50, PI / 2); hatch(null, 1.4, 3.4, 0.25); shade(8, 0, -8, 0, 0.25, [-12, -52, 12, 134]); } };
    parts[pf + 'cuilleron'] = { parent: pf + 'louche', at: [-4, 130], noRivet: true, seed: 1013, base: Q.boisL,
      pts: ell(0, 22, 36, 24, 14), paint: (p) => { const c = cx_(); cfill(ell(0, 18, 30, 19, 14), '#6b4a2a'); const k = clamp(p.creme != null ? p.creme : 0);
        if (k > 0.02) { fillG(ell(0, 18 - 2 * k, 28, 17.5, 14), rgrad(-6, 14, 2, 0, 18, 30, [[0, Q.cremeL], [0.7, Q.creme], [1, Q.cremeD]])); cline(ep(0, 16, 15, 9, 6, PI * 1.1, PI * 1.7), 'rgba(255,255,245,0.9)', 1.8); }
        grainLines(1014, 6, -30, 0, 30, 40, 'rgba(60,35,12,0.5)', 0.4, 26, 0.2); cline(ell(0, 18, 31, 19.5, 14), 'rgba(255,225,170,0.45)', 1.6); hatch(null, 1.2, 4, 0.16); } };
    return parts;
  }
  CH.louche = propDef(loucheParts('', null, [0, 0], 0), ['louche', 'cuilleron']);

  // ------------------------------------------------------------ TAILLE (bâton de comptage à encoches) et JAUGE (règle à crans, sans chiffres)
  // taille : origine = prise de main ; elle monte (-y) de 120 et descend de 40. pose.encoches = nombre d'encoches (0..8), pose.encoche = avancement 0..1 de la dernière.
  function tailleParts(pf, parent, at, rest) {
    const parts = {}; const L0 = -120, L1 = 40;
    parts[pf + 'taille'] = { parent, at, noRivet: true, seed: 1021, base: '#DCC08A', rest: rest || 0,
      pts: [[-9, L0, 1], [10, L0 + 4, 1], [11, L1 - 4], [8, L1, 1], [-8, L1, 1], [-11, L1 - 8], [-10, L0 + 12]],
      paint: (p) => {
        fillPts([[-12, L0], [-6, L0], [-7, L1], [-12, L1]], '#8b6a3a');                       // écorce côté arrière
        grainLines(1022, 10, -8, L0, 10, L1, 'rgba(90,60,25,0.6)', 0.5, 40, PI / 2);
        const n = Math.floor(p.encoches != null ? p.encoches : 4), part = clamp(p.encoche || 0);
        for (let i = 0; i < n + (part > 0 ? 1 : 0); i++) { const y = L0 + 16 + i * 15, w = i < n ? 1 : part; strokePts([[11, y - 7 * w], [-3 + (1 - w) * 12, y], [11, y + 7 * w]], 'rgba(50,28,10,0.95)', 2.6); }
        hatch(null, 1.4, 4, 0.18); shade(10, 0, -9, 0, 0.2, [-14, L0 - 4, 14, L1 + 4]); } };
    return parts;
  }
  function jaugeParts(pf, parent, at, rest) {
    const parts = {}; const L0 = -70, L1 = 230;
    parts[pf + 'jauge'] = { parent, at, noRivet: true, seed: 1031, base: '#C9A56A', rest: rest || 0,
      pts: [[-7, L0, 1], [7, L0, 1], [8, L1 - 6], [5, L1, 1], [-5, L1, 1], [-8, L1 - 6]],
      paint: (p) => {
        grainLines(1032, 8, -8, L0, 8, L1, 'rgba(90,60,25,0.55)', 0.5, 60, PI / 2);
        for (let i = 0; i < 17; i++) { const y = L0 + 24 + i * 15, big = i % 4 === 0; strokePts([[8, y], [big ? -6 : 0, y]], 'rgba(50,28,10,0.85)', big ? 1.8 : 1.3); }
        const w = clamp(p.mouille || 0); if (w > 0.02) { fillPts([[-9, L1 - 120 * w], [9, L1 - 120 * w - 2], [9, L1 + 2], [-9, L1 + 2]], 'rgba(246,240,224,0.9)', 3, 0); strokePts([[-8, L1 - 120 * w], [8, L1 - 120 * w - 1]], 'rgba(255,255,255,0.9)', 1.6); }
        fillPts([[-8, L1 - 14], [8, L1 - 14], [8, L1 + 2], [-8, L1 + 2]], 'rgba(120,120,125,0.0)');
        hatch(null, 1.45, 4, 0.14); shade(8, 0, -7, 0, 0.2, [-12, L0 - 4, 12, L1 + 4]); } };
    parts[pf + 'anneau'] = { parent: pf + 'jauge', at: [0, L0 + 2], noRivet: true, seed: 1033, base: Q.laiton, pts: ribbon(ep(0, -10, 11, 12, 16, PI * 0.5, PI * 2.5).concat([]), 5, 5), paint: () => hatch(null, 0.6, 3, 0.3) };
    return parts;
  }
  CH.taille = propDef(tailleParts('', null, [0, 0], 0), ['taille']);
  CH.jauge = propDef(jaugeParts('', null, [0, 0], 0), ['jauge', 'anneau']);

  // ------------------------------------------------------------ CLARINE (grosse cloche en laiton vieilli) — UNE seule fonction de dessin, réutilisée
  // origine = point d'accroche (haut de la boucle de cuir) ; la cloche pend vers +y ; pose.clarineK = agrandissement (1,3 au plan 6)
  const CLA_BELL = [[-17, 0], [17, 0], [23, 10], [28, 34], [33, 62], [41, 80, 1], [-41, 80, 1], [-33, 62], [-28, 34], [-23, 10]];
  function claParts(pf, parent, at, rest, base) {
    const kk = (p) => (base || 1) * (p.clarineK != null ? p.clarineK : (p.k != null ? p.k : 1));
    const parts = {};
    parts[pf + 'boucle'] = { parent, at, noRivet: true, seed: 1041, base: Q.cuir, rest: rest || 0, texA: 0.5,
      pts: (p) => scl([[-9, -14], [9, -14], [10, 8], [-10, 8]], kk(p)), paint: (p) => { const k = kk(p); hatch(null, 0.9, 3, 0.3); strokePts([[0, -10 * k], [0, 6 * k]], 'rgba(20,10,5,0.5)', 1.2); } };
    parts[pf + 'cloche'] = { parent: pf + 'boucle', at: [0, 4], noRivet: false, seed: 1042, base: Q.laiton,
      pts: (p) => scl(CLA_BELL, kk(p)),
      paint: (p) => {
        const k = kk(p), c = cx_(); c.save(); c.scale(k, k);
        fillG(CLA_BELL, lgrad(-40, 0, 40, 0, [[0, '#F6E2A0'], [0.25, '#E2BE62'], [0.6, '#C09A44'], [1, '#7C5A1E']]));
        // rainures et patine
        cline([[-22, 16], [23, 16]], 'rgba(80,55,15,0.7)', 1.8); cline([[-28, 42], [29, 42]], 'rgba(80,55,15,0.6)', 1.6);
        cline([[-37, 70], [37, 70]], 'rgba(255,235,170,0.6)', 2.4); cline([[-40, 76], [40, 76]], 'rgba(70,45,10,0.7)', 2.4); cfill(ell(0, 80, 40, 5, 14), '#4a3412'); cline(ell(0, 80, 40, 5, 14), 'rgba(255,230,160,0.5)', 1.2);
        cline([[-14, 6], [-22, 66]], 'rgba(255,248,215,0.85)', 3);
        speckle(1043, 10, 0, 42, 24, 30, 2, 6, ['#8a6a2a', '#a98a3c'], 0.15, 0.3);
        hatch(null, 1.3, 5.5, 0.13); shade(34, 0, -34, 0, 0.35, [-42, -4, 42, 84]);
        c.restore(); },
      extra: (p) => { if (M._sil()) return; const k = kk(p); piece(ell(0, 86 * k, 8 * k, 8 * k, 10), '#34333a', () => { dot(-2 * k, 83 * k, 2.4 * k, 'rgba(255,255,255,0.6)'); }, { seed: 1044, drop: false }); } };
    return parts;
  }
  CH.clarine = propDef(claParts('', null, [0, 0], 0), ['boucle', 'cloche']);
  REB.clarine = function (x, y, s, rot, o) { o = o || {}; return M.puppet(CH.clarine, { clarineK: o.k || 1, ang: { boucle: rot || 0 }, t: o.t }, x, y, s == null ? 1 : s, { rod: false, floorShadow: false, cast: o.cast, dir: o.dir || 1 }); };
  REB.CLA = { w: 78, h: 90 };

  // ------------------------------------------------------------ MAIN ANONYME sur tige (manche ivoire) — arrive de la coulisse, tient le pot de crème
  // conçue vers +x (main à droite) ; pour entrer par la droite : dir:-1. Pièces : bras (épaule hors-champ) > avbras (coude) ; pot_* ; poing.
  // pose.hide.pot_corps/pot_anse pour la main vide ; ang.pot incline le pot (verser) ; pose.creme n'est pas utilisé ici (la coulée se dessine avec REB.coulee).
  const SKINM = '#D9AE86';
  CH.main = (function () {
    const parts = {};
    parts.bras = { parent: null, at: [0, 0], noRivet: true, seed: 1051, base: Q.ivoire,
      pts: [[-40, -36, 1], [226, -26], [236, -2, 1], [226, 28], [-40, 38, 1]],
      paint: () => {
        for (const [x, y, l] of [[30, -24, 60], [90, -26, 50], [150, -24, 56]]) strokePts([[x, y], [x + 8, y + l * 0.5], [x - 4, y + l]], 'rgba(120,100,70,0.5)', 1.4);
        hatch([[-50, 0], [240, 6], [240, 40], [-50, 44]], 0.4, 4.2, 0.28); hatch(null, 1.3, 7, 0.1); shade(0, 40, 0, -30, 0.3, [-50, -40, 240, 44]);
        fillPts([[210, -30], [240, -30], [240, 32], [210, 30]], 'rgba(150,130,95,0.45)'); } };
    parts.avbras = { parent: 'bras', at: [226, 0], seed: 1052, base: Q.ivoire,
      pts: [[-20, -28, 1], [150, -22], [160, -24, 1], [166, 0, 1], [160, 24, 1], [150, 22], [-20, 30, 1]],
      paint: () => {
        for (const [x, y] of [[20, -20], [66, -20], [112, -18]]) strokePts([[x, y], [x + 6, y + 22], [x - 3, y + 42]], 'rgba(120,100,70,0.5)', 1.4);
        hatch([[-30, 0], [160, 4], [160, 30], [-30, 34]], 0.4, 4.2, 0.28); shade(0, 32, 0, -26, 0.28, [-30, -30, 170, 34]);
        // manchette froncée au poignet
        fillPts([[132, -26], [160, -28], [166, 0], [160, 26], [132, 24]], '#F4EBD6'); for (let i = -22; i < 24; i += 6) strokePts([[134, i], [162, i + 1]], 'rgba(120,100,70,0.45)', 1.2); } };
    Object.assign(parts, potParts('pot_', 'avbras', [196, 8], 46, 0));
    parts.poing = { parent: 'avbras', at: [196, 8], seed: 1053, base: SKINM, noRivet: true,
      pts: [[-52, -14], [-30, -28], [-6, -30], [8, -22], [10, 4], [8, 28], [-8, 34], [-34, 30], [-54, 18]],
      paint: () => { for (let i = 0; i < 4; i++) strokePts([[8, -18 + i * 12], [-14, -16 + i * 12]], 'rgba(90,50,30,0.55)', 1.4); strokePts([[-50, -8], [-36, -22]], 'rgba(90,50,30,0.5)', 1.2); hatch(null, 0.9, 4, 0.2); shade(10, 0, -50, 0, 0.2, [-60, -34, 14, 36]); } };
    return propDef(parts, ['bras', 'avbras', 'pot_anse', 'pot_corps', 'poing'], { rod: { part: 'avbras', at: [50, 20] }, rodOn: true, handLen: 170 });
  })();

  // =====================================================================
  // EFFETS (dessinés directement ; fonctions pures de t)
  // =====================================================================
  // jet de lait d'un trayon (x0,y0) vers le seau (x1,y1) ; k 0..1 = longueur du jet ; t = temps (pulsation)
  REB.jet = function (x0, y0, x1, y1, t, k, o) {
    o = o || {}; k = clamp(k == null ? 1 : k); if (k < 0.02) return;
    const c = M.ctx(), w = o.w || 7, n = 16, L = [];
    for (let i = 0; i <= n; i++) { const u = i / n * k; L.push([lerp(x0, x1, u) + Math.sin(u * 5 + t * 9) * 0.8, lerp(y0, y1, u * u * 0.35 + u * 0.65)]); }
    const poly = ribbon(L, w, w * 0.6);
    c.save(); c.beginPath(); poly.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
    c.fillStyle = 'rgba(20,12,6,0.18)'; c.translate(1.5, 2); c.fill(); c.translate(-1.5, -2);
    c.fillStyle = Q.lait; c.fill(); c.lineWidth = 1.4; c.strokeStyle = 'rgba(120,96,60,0.55)'; c.stroke();
    c.beginPath(); L.forEach((p, i) => (i ? c.lineTo(p[0] - w * 0.15, p[1]) : c.moveTo(p[0] - w * 0.15, p[1]))); c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 1.6; c.stroke();
    // petites gouttes à l'arrivée
    const e = L[L.length - 1];
    for (let i = 0; i < 4; i++) { const a = ((t * 3.1 + i * 0.27) % 1), px = e[0] + (i - 1.5) * 9 * a, py = e[1] - 6 * Math.sin(a * PI) * 2 - 4 + a * 6; c.beginPath(); c.ellipse(px, py, 2.4 * (1 - a * 0.4), 3.2 * (1 - a * 0.4), 0, 0, TAU); c.fillStyle = Q.lait; c.fill(); c.strokeStyle = 'rgba(120,96,60,0.5)'; c.lineWidth = 1; c.stroke(); }
    c.restore();
  };
  // coulée de crème épaisse (pot → plat) ; k 0..1 = épaisseur/longueur ; col facultatif
  REB.coulee = function (x0, y0, x1, y1, t, k, o) {
    o = o || {}; k = clamp(k == null ? 1 : k); if (k < 0.02) return;
    const c = M.ctx(), w = (o.w || 30) * (0.4 + 0.6 * k), n = 20, L = [];
    for (let i = 0; i <= n; i++) { const u = i / n * (0.25 + 0.75 * k); L.push([x0 + (x1 - x0) * (1 - (1 - u) * (1 - u)) + Math.sin(u * 7 + t * 5) * 1.2, y0 + (y1 - y0) * u * u]); }
    const poly = ribbon(L, w * 1.05, w * 0.7);
    c.save(); c.beginPath(); poly.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
    c.fillStyle = 'rgba(20,12,6,0.2)'; c.translate(2, 3); c.fill(); c.translate(-2, -3);
    c.fillStyle = Q.creme; c.fill();
    c.lineWidth = 1.6; c.strokeStyle = 'rgba(150,115,45,0.75)'; c.stroke();
    c.beginPath(); L.forEach((p, i) => (i ? c.lineTo(p[0] - w * 0.2, p[1]) : c.moveTo(p[0] - w * 0.2, p[1]))); c.strokeStyle = 'rgba(255,255,248,0.95)'; c.lineWidth = 2.4; c.stroke();
    c.restore();
  };
  // vapeur de papier : quelques volutes ivoire qui montent de (x,y) ; w = largeur
  REB.vapeur = function (x, y, t, k, w) {
    k = clamp(k == null ? 1 : k); if (k < 0.02) return; w = w || 60;
    const c = M.ctx();
    for (let i = 0; i < 4; i++) {
      const ph = (t * 0.55 + i * 0.26) % 1, hh = 130 * k, px = x + (i - 1.5) * w * 0.3 + Math.sin(ph * 6 + i * 2) * 10, py = y - ph * hh;
      const a = Math.sin(ph * PI) * 0.7 * k, sz = (14 + 16 * ph) * (0.8 + 0.3 * k);
      c.save(); c.globalAlpha = a; c.translate(px, py); c.rotate(Math.sin(ph * 5 + i) * 0.4);
      const pts = [[-sz, 0], [-sz * 0.5, -sz * 0.9], [sz * 0.4, -sz * 1.1], [sz, -sz * 0.2], [sz * 0.3, sz * 0.7], [-sz * 0.6, sz * 0.5]];
      c.beginPath(); pts.forEach((p, j) => (j ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
      c.fillStyle = '#F4EFE2'; c.fill(); c.strokeStyle = 'rgba(150,140,120,0.7)'; c.lineWidth = 1.4; c.stroke();
      c.restore();
    }
  };
  // bulle de carton au bout d'un fil (gratinée) ; k 0..1 = éclosion, s = rayon
  REB.bulle = function (x, y, r, k) {
    k = clamp(k == null ? 1 : k); if (k <= 0) return; const rr = r * (0.2 + 0.8 * M.spring(k * 0.5, 0.5, 14)), c = M.ctx();
    c.save(); c.strokeStyle = 'rgba(20,15,10,0.5)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x, y - rr); c.lineTo(x, y - rr - 160); c.stroke();
    c.beginPath(); c.ellipse(x + 2, y + 3, rr, rr * 0.92, 0, 0, TAU); c.fillStyle = 'rgba(20,10,5,0.28)'; c.fill();
    c.beginPath(); c.ellipse(x, y, rr, rr * 0.92, 0, 0, TAU); c.fillStyle = rgrad(x - rr * 0.3, y - rr * 0.35, 1, x, y, rr, [[0, '#F7E6A8'], [0.6, '#E2B35E'], [1, '#B98138']]); c.fill();
    c.lineWidth = 2; c.strokeStyle = 'rgba(244,236,214,0.9)'; c.stroke(); c.lineWidth = 1; c.strokeStyle = 'rgba(60,30,10,0.6)'; c.stroke();
    c.beginPath(); c.arc(x - rr * 0.3, y - rr * 0.35, rr * 0.28, PI * 1.05, PI * 1.6); c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 2; c.stroke();
    c.restore();
  };

  // =====================================================================
  // HUMAINS — outils communs : jambes à genou (cuisse-robe + mollet), bras, mains
  // convention : repère de la pièce = rivet ; pieds en (0,0) ; hipY = -232 ; la tête regarde vers +x
  // genou : cuisse (legX_up) angle négatif = vers l'avant ; mollet (legX_lo) angle POSITIF = plie le genou (pied vers l'arrière)
  // assis : legX_up ≈ -1.5, legX_lo ≈ +1.5 (voir REB.assis)
  // =====================================================================
  const L1 = 108, L2 = 126;
  function manLegs(c) {
    // c : { robe, robeD, robeL, tw (demi-largeur), hem (y du bas de la robe sur la cuisse), hose, hoseD, shoe, shoeD, trim, seed, mini }
    const hem = c.hem || 114, tw = c.tw || 26;
    const thigh = [[-tw, -12], [tw, -12], [tw + 4, 40], [tw + 6, hem - 8], [tw + 4, hem, 1], [-tw - 4, hem, 1], [-tw - 6, hem - 8], [-tw - 2, 40]];
    const shin = [[-11, -6], [11, -6], [10, 30], [8, 80], [7, 102], [10, 112], [36, 116], [47, 122, 1], [45, 128, 1], [-16, 128, 1], [-14, 108], [-9, 92], [-10, 40]];
    const mkThigh = (back) => ({ parent: 'torso', at: [back ? -6 : 6, -2], noRivet: !!back, seed: c.seed + (back ? 1 : 2), base: back ? c.robeD : c.robe, pts: thigh,
      paint: () => {
        if (c.mini) { return; }
        fillPts([[-tw - 8, hem - 14], [tw + 8, hem - 14], [tw + 8, hem + 4], [-tw - 8, hem + 4]], c.trim || (back ? c.robeD : c.robeL || c.robe));
        for (const x of [-tw * 0.5, 0, tw * 0.5]) strokePts([[x, 6], [x + 3, hem - 20]], 'rgba(20,14,24,0.38)', 1.3);
        hatch([[-tw - 10, -20], [-4, -20], [-4, hem + 6], [-tw - 10, hem + 6]], 0.8, 4.2, back ? 0.3 : 0.26);
        shade(tw, 0, -tw, 0, back ? 0.4 : 0.28, [-tw - 10, -20, tw + 10, hem + 6]);
      } });
    const mkShin = (back) => ({ parent: back ? 'legB_up' : 'legF_up', at: [0, L1], noRivet: !!back, seed: c.seed + (back ? 3 : 4), base: back ? c.hoseD : c.hose, pts: shin,
      paint: () => {
        fillPts([[-30, 104], [60, 104], [60, 140], [-30, 140]], back ? c.shoeD : c.shoe);
        if (c.mini) return;
        strokePts([[-6, 100], [24, 102]], 'rgba(220,200,170,0.35)', 1.4); strokePts([[16, 108], [40, 114]], 'rgba(255,240,210,0.25)', 1.2);
        hatch([[-14, 0], [-3, 0], [-3, 104], [-14, 104]], 0.85, 4, back ? 0.34 : 0.26); } });
    return { legB_up: mkThigh(true), legB_lo: mkShin(true), legF_up: mkThigh(false), legF_lo: mkShin(false) };
  }
  // bras : manche large + main (peau). kind de main via pose.handF / handB : 'fist' | 'open'
  function manArms(c) {
    const out = {};
    const arm = (back) => {
      const pre = back ? 'armB' : 'armF', col = back ? c.sleeveD : c.sleeve;
      out[pre + '_up'] = { parent: 'torso', at: back ? [-10, -146] : [-2, -146], noRivet: false, seed: c.seed + (back ? 11 : 12), base: col, pts: X.armPts(c.armLen || 94),
        paint: () => { if (c.mini) return; hatch(null, 0.8, 3.8, back ? 0.34 : 0.3); if (!back) hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.12);
          if (c.upper) c.upper(back); } };
      out[pre + '_lo'] = { parent: pre + '_up', at: [0, c.armLen || 94], seed: c.seed + (back ? 13 : 14), base: col,
        pts: (p) => X.forePts((back ? p.handB : p.handF) || (back ? 'fist' : 'open')),
        paint: (p) => {
          const kind = (back ? p.handB : p.handF) || (back ? 'fist' : 'open');
          fillPts([[-20, 76], [20, 76], [24, 130], [-20, 130]], back ? c.skinD : c.skin); X.handPaint(null, kind);
          if (c.mini) return;
          fillPts([[-15, 58], [15, 58], [17, 80], [-15, 80]], c.cuff || col);
          strokePts([[-14, 79], [14, 79]], 'rgba(30,20,20,0.45)', 1.2);
          hatch([[-14, 10], [-3, 10], [-3, 70], [-14, 70]], 0.9, 3.8, 0.26); } };
    };
    arm(true); arm(false); return out;
  }

  // ---- convenance : poses « assis » pour une marionnette à cuisses-robe (paysan)
  REB.assis = function (pose, o) {
    o = o || {}; const base = { dy: o.dy != null ? o.dy : 106, tilt: -0.03, ang: { legF_up: -1.52, legF_lo: 1.52, legB_up: -1.46, legB_lo: 1.46 } };
    const out = REB.pose(base, pose); out.dy = base.dy + ((pose && pose.dy) || 0); if (pose && pose.tilt != null) out.tilt = pose.tilt; return out;
  };

  // =====================================================================
  // LE PAYSAN — C.paysan : rond, quarantaine, capuchon rouge à pointe molle, tunique bleu nuit, corde ocre
  // pièces : torso head capuchon corde armB_up armB_lo armF_up armF_lo legB_up legB_lo legF_up legF_lo + tenus : seauM louche
  // pose : face{brow,mouth,eyes} ; handF/handB 'open'|'fist' ; tenu : 'rien'|'louche'|'seau' (main avant) ; ang.capuchon (pointe), ang.corde ; seauNiveau…
  // =====================================================================
  const PA = { skin: '#D9A57A', skinD: '#B98259', tun: Q.nuit, tunD: Q.nuitD, tunL: '#3F5780', hood: Q.sang, hoodD: Q.sangD, hoodL: '#A4403A', rope: Q.corde, hose: Q.chausse, hoseD: Q.chausseD };
  const PA_TORSO = [[-14, -176], [8, -180], [16, -168], [26, -152], [44, -122], [62, -84], [74, -40], [76, 0], [66, 18], [20, 22], [-20, 20], [-42, 18], [-48, -20], [-46, -70], [-42, -112], [-34, -150], [-26, -168]];
  const PA_HEAD = [[-14, 16], [10, 16], [14, 5], [21, -3], [28, -8], [31, -14], [30, -20], [31, -25], [30, -30], [34, -35], [39, -40], [37, -46], [32, -52], [31, -62], [27, -78], [15, -92], [-6, -97], [-24, -88], [-34, -68], [-34, -46], [-26, -26], [-18, -8]];
  const PA_HOOD = tr([[28, -74, 1], [14, -92], [-6, -103], [-28, -102], [-46, -90], [-66, -84], [-86, -66], [-102, -38], [-114, -4, 1], [-96, -24], [-80, -50], [-66, -64], [-54, -68], [-50, -50], [-52, -24], [-46, 6], [-28, 22], [-8, 20], [-4, -2], [-8, -26], [-8, -50], [4, -64], [20, -72]], 10, 100);
  function mkPaysan() {
    const c = { seed: 1100, robe: PA.tun, robeD: PA.tunD, robeL: PA.tunL, trim: '#2a3a58', tw: 28, hem: 118, hose: PA.hose, hoseD: PA.hoseD, shoe: '#3a2a1e', shoeD: '#2a1d14', sleeve: PA.tun, sleeveD: PA.tunD, cuff: '#E4D9BE', skin: PA.skin, skinD: PA.skinD };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: PA_TORSO, base: PA.tun, seed: 1101, paint: () => {
        for (const x of [-26, -6, 14, 34]) strokePts([[x, -60], [x + 3, -10], [x + 6, 14]], 'rgba(10,16,34,0.5)', 1.3);
        fillPts([[8, -178], [20, -164], [28, -150], [16, -140], [4, -158]], '#E4D9BE');                         // col de chemise
        strokePts([[18, -150], [26, -122], [40, -86]], 'rgba(10,16,34,0.5)', 1.3);
        hatch([[-52, -170], [-12, -170], [-10, 24], [-52, 24]], 0.75, 4.2, 0.38);
        hatch([[22, -50], [76, -40], [76, 20], [22, 20]], 0.2, 4.6, 0.22);
        strokePts([[46, -60], [66, -20], [60, 8]], 'rgba(10,16,34,0.4)', 1.4);
        shade(78, 0, -44, 0, 0.34);
        // corde de ceinture
        fillPts([[-46, -6], [-20, -6], [20, -2], [76, 0], [72, 14], [20, 14], [-20, 14], [-46, 14]], PA.rope);
        for (let x = -42; x < 74; x += 6) strokePts([[x, -4], [x + 3, 13]], 'rgba(70,45,15,0.55)', 1.3);
        strokePts([[-46, -6], [76, 0]], 'rgba(255,235,170,0.4)', 1.2); } },
      corde: { parent: 'torso', at: [58, 8], noRivet: true, seed: 1102, base: PA.rope,
        pts: [[-5, -2], [6, -2], [8, 50], [5, 76, 1], [9, 94, 1], [-9, 96, 1], [-4, 76, 1], [-7, 50]], paint: () => { for (let y = 4; y < 70; y += 6) strokePts([[-6, y], [6, y + 3]], 'rgba(70,45,15,0.55)', 1.2); fillPts([[-9, 74], [9, 74], [10, 96], [-10, 96]], '#8A6A36'); hatch(null, 0.9, 3.2, 0.25); } },
      head: { parent: 'torso', at: [6, -170], pts: PA_HEAD, base: PA.skin, seed: 1103, noRivet: true, paint: (p) => {
        const f = p.face || {};
        X.earPaint(-8, -44);
        hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.3);
        dot(15, -32, 11, 'rgba(206,108,98,0.38)'); dot(37, -40, 5.5, 'rgba(206,108,98,0.5)');
        // moustache brune
        fillPts([[36, -33], [30, -26], [20, -24], [8, -26], [12, -33], [24, -37]], '#4A2F1C', 3, 0.3); strokePts([[12, -30], [24, -31], [33, -33]], 'rgba(120,80,50,0.6)', 1);
        X.eye(f, 17, -52); X.brow(f, 17, -60, '#4A2F1C', 3.4); X.mouth(f, 26, -19);
        strokePts([[26, -24], [18, -17]], 'rgba(90,50,40,0.4)', 1);
      } },
      capuchon: { parent: 'head', at: [-10, -100], pts: PA_HOOD, base: PA.hood, seed: 1104, noRivet: true, paint: () => {
        cx_().translate(10, 100);
        fillPts([[28, -74], [14, -90], [4, -64], [20, -70]], PA.hoodL);                                      // bord roulé
        strokePts([[20, -72], [4, -64], [-8, -50], [-8, -26], [-4, 0]], 'rgba(255,200,180,0.35)', 2.4);
        for (const [a, b] of [[[-30, -98], [-48, -60]], [[-60, -84], [-74, -50]], [[-84, -62], [-96, -28]]]) strokePts([a, b], 'rgba(40,6,6,0.4)', 1.3);
        hatch([[-100, -130], [-30, -130], [-30, 24], [-60, 24]], 0.7, 4, 0.34); shade(30, -60, -90, -90, 0.3, [-100, -130, 40, 30]); } },
    };
    Object.assign(parts, manLegs(c), manArms(c));
    // objets tenus dans la main avant (poing en [4,96])
    const lou = loucheParts('lou_', 'armF_lo', [4, 92], 0); Object.assign(parts, lou);
    parts.lou_louche.pts = (p) => (p.tenu === 'louche' ? ribbon(qbez([0, -50], [2, 40], [-4, 130], 12), 12, 9) : OFFP);
    parts.lou_cuilleron.pts = (p) => (p.tenu === 'louche' ? ell(0, 22, 36, 24, 14) : OFFP);
    const sm = seauParts('sm_', 'armF_lo', [4, 98], 206, 0); Object.assign(parts, sm);
    const seauPts = { sm_corps: parts.sm_corps.pts, sm_anse: parts.sm_anse.pts };
    const hr = (p) => (p.vert ? -(((p.ang && p.ang.armF_up) || 0) + ((p.ang && p.ang.armF_lo) || 0)) : 0);   // pose.vert : le seau reste vertical
    parts.sm_corps.pts = (p) => (p.tenu === 'seau' ? rotp(seauPts.sm_corps(p), hr(p)) : OFFP);
    parts.sm_anse.pts = (p) => (p.tenu === 'seau' ? rotp(seauPts.sm_anse(p), hr(p)) : OFFP);
    for (const n of ['sm_corps', 'sm_anse']) { const o = parts[n].paint, e = parts[n].extra; parts[n].paint = (p) => { const c = cx_(); c.save(); c.rotate(hr(p)); o(p); c.restore(); }; if (e) parts[n].extra = (p) => { const c = cx_(); c.save(); c.rotate(hr(p)); e(p); c.restore(); }; }
    const w = (n, fn) => { const o = parts[n].paint; parts[n].paint = (p) => { if (p.tenu !== fn) return; o && o(p); }; const e = parts[n].extra; if (e) parts[n].extra = (p) => { if (p.tenu !== fn) return; e(p); }; };
    w('lou_louche', 'louche'); w('lou_cuilleron', 'louche'); w('sm_corps', 'seau'); w('sm_anse', 'seau');
    return { hipY: -232, parts, handLen: 104, rod: { part: 'torso', at: [-22, 14] },
      order: ['armB_up', 'armB_lo', 'legB_lo', 'legB_up', 'legF_lo', 'legF_up', 'head', 'capuchon', 'torso', 'corde', 'armF_up', 'armF_lo', 'lou_louche', 'lou_cuilleron', 'sm_anse', 'sm_corps'] };
  }
  CH.paysan = mkPaysan();

  // =====================================================================
  // yeux étendus (monk) : eyes 'up' (regard au ciel) / 'side' (en coin)
  // =====================================================================
  function eyeX(f, x, y, sz) {
    sz = sz || 1; const e = f.eyes || 'open';
    if (e !== 'up' && e !== 'side') return X.eye(f, x, y, sz);
    fillPts([[x - 6 * sz, y], [x - 1 * sz, y - 3.3 * sz], [x + 5.5 * sz, y - 1.2 * sz], [x + 2.5 * sz, y + 1.8 * sz], [x - 4 * sz, y + 1 * sz]], '#efe8da', 0, 0);
    if (e === 'up') dot(x + 1.2 * sz, y - 2.4 * sz, 2.0 * sz, '#2a1f1d'); else dot(x + 4.4 * sz, y - 0.2 * sz, 2.1 * sz, '#2a1f1d');
    strokePts([[x - 6.5 * sz, y + 0.3], [x - 1 * sz, y - 3.6 * sz], [x + 6 * sz, y - 1.4 * sz]], 'rgba(28,16,14,0.95)', 1.8);
  }

  // =====================================================================
  // LE CONTRÔLEUR — C.controleur (et C.controleurMini, silhouette simplifiée à échelle ≈ 0,3 pour le fond)
  // grand, maigre, long nez pointu, barbiche grise, houppelande prune, chaperon à cornette ; démarche raide, menton haut
  // pose.tenu (main avant) : 'jauge' | 'couteau' | 'rien' ; pose.tenuB (main arrière) : 'taille' | 'rien' ; taille : encoches, encoche ; jauge : mouille
  // ang : head, chaperon (cornette), armF_*, armB_*, legX_up/lo, jauge, couteauC, taille
  // =====================================================================
  const CT = { skin: '#E0B892', skinD: '#C49A74', rob: Q.prune, robD: Q.pruneD, robL: Q.pruneL, hose: '#4a3f46', hoseD: '#383038' };
  const CT_TORSO = [[-14, -176], [8, -180], [16, -168], [24, -150], [31, -112], [33, -60], [31, -8], [28, 14], [-28, 16], [-35, -8], [-36, -60], [-35, -112], [-31, -150], [-24, -168]];
  const CT_HEAD = [[-12, 16], [8, 16], [10, 6], [16, -2], [24, -6], [28, -10], [27, -16], [28, -20], [27, -26], [29, -29], [52, -33, 1], [35, -47], [31, -56], [30, -66], [27, -78], [14, -92], [-6, -97], [-24, -88], [-33, -68], [-32, -46], [-24, -28], [-16, -8]];
  const CT_CHAP = tr([[26, -80, 1], [12, -98], [-8, -108], [-30, -104], [-44, -90], [-48, -60], [-44, -34], [-30, -20], [-18, -26], [-16, -52], [-6, -66], [8, -68], [22, -72]], 8, 92);
  function mkControleur(mini) {
    const c = { seed: 1200, robe: CT.rob, robeD: CT.robD, robeL: CT.robL, trim: '#2f2230', tw: 28, hem: 156, hose: CT.hose, hoseD: CT.hoseD, shoe: '#2a2024', shoeD: '#1c161a', sleeve: CT.rob, sleeveD: CT.robD, cuff: '#C9B48A', skin: CT.skin, skinD: CT.skinD, mini, armLen: 98 };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: CT_TORSO, base: CT.rob, seed: 1201, paint: () => {
        if (mini) return;
        fillPts([[8, -178], [18, -168], [26, -150], [20, -140], [8, -160]], '#2f2230');                       // haut col
        for (const x of [-22, -4, 14]) strokePts([[x, -90], [x + 2, -20], [x + 4, 12]], 'rgba(20,6,20,0.45)', 1.3);
        fillPts([[-36, -2], [32, -2], [31, 10], [-35, 10]], '#2c2024');                                           // ceinture de cuir
        fillPts([[20, -4], [32, -4], [32, 12], [20, 12]], Q.laiton);
        hatch([[-46, -170], [-12, -170], [-10, 16], [-46, 16]], 0.75, 4.2, 0.4); shade(36, 0, -38, 0, 0.32); } },
      head: { parent: 'torso', at: [6, -170], pts: CT_HEAD, base: CT.skin, seed: 1203, noRivet: true, paint: (p) => {
        const f = p.face || {}; if (mini) { fillPts([[-30, -110], [-30, -20], [-20, -20], [-4, -62], [-4, -110]], '#3a2a30'); return; }
        X.earPaint(-8, -44);
        hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.3);
        fillPts([[27, -4], [22, 4], [14, 22], [6, 10], [10, 0]], '#9a9890', 5, 0.3);                          // barbiche grise
        strokePts([[16, 2], [14, 16]], 'rgba(255,255,255,0.5)', 1);
        fillPts([[30, -28], [24, -23], [12, -24], [16, -30], [26, -33]], '#A9A7A0', 3, 0.3);                 // moustache fine
        strokePts([[36, -42], [30, -34]], 'rgba(120,70,50,0.45)', 1.2);                                         // arête du nez
        X.eye(f, 17, -53, 0.95); X.brow(f, 17, -61, '#8d8b84', 3); X.mouth(f, 25, -17); } },
      chaperon: { parent: 'head', at: [-8, -92], pts: CT_CHAP.concat([]), base: CT.rob, seed: 1204, noRivet: true, paint: () => {
        if (mini) return; cx_().translate(8, 92);
        fillPts([[26, -80], [12, -98], [-8, -108], [-30, -104], [-44, -90]], '#7A4668'); hatch(null, 0.6, 3.8, 0.3); shade(20, -60, -40, -30, 0.3, [-60, -120, 40, -10]); } },
      cornette: { parent: 'head', at: [-40, -50], seed: 1205, base: CT.rob, noRivet: true,
        pts: [[-4, -4], [6, -2], [8, 40], [4, 104], [0, 150, 1], [-8, 96], [-10, 40]], paint: () => { if (mini) return; for (const y of [30, 70, 110]) strokePts([[-8, y], [6, y + 4]], 'rgba(20,6,20,0.4)', 1.2); hatch(null, 1.2, 4, 0.28); } },
    };
    Object.assign(parts, manLegs(c), manArms(c));
    // taille (main arrière), jauge et couteau (main avant)
    const ta = tailleParts('tl_', 'armB_lo', [2, 98], 0.2), ja = jaugeParts('jg_', 'armF_lo', [4, 98], -0.1);
    Object.assign(parts, ta, ja);
    const gate = (name, test) => { const pp = parts[name], o = pp.pts, pa = pp.paint, ex = pp.extra; pp.pts = (p) => (test(p) ? (typeof o === 'function' ? o(p) : o) : OFFP); if (pa) pp.paint = (p) => { if (test(p)) pa(p); }; if (ex) pp.extra = (p) => { if (test(p)) ex(p); }; };
    const tj = (p) => (p.tenu || (mini ? 'rien' : 'jauge')) === 'jauge', tt = (p) => (p.tenuB || (mini ? 'rien' : 'taille')) === 'taille';
    gate('tl_taille', tt); gate('jg_jauge', tj); gate('jg_anneau', tj);
    // petit couteau : pièces réduites de moitié
    const cp = couteauParts('pc_', 'armF_lo', [4, 98], 0.1); const K = 0.5;
    const sp = (n, par) => { const pp = cp[n], o = pp.pts, pa = pp.paint, ex = pp.extra; pp.pts = (p) => ((p.tenu === 'couteau') ? scl(typeof o === 'function' ? o(p) : o, K) : OFFP); pp.paint = (p) => { if (p.tenu !== 'couteau') return; const c = cx_(); c.save(); c.scale(K, K); pa && pa(p); c.restore(); }; if (ex) pp.extra = (p) => { if (p.tenu !== 'couteau') return; const c = cx_(); c.save(); c.scale(K, K); ex(p); c.restore(); }; };
    sp('pc_manche'); sp('pc_lame'); cp.pc_lame.at = [0, 74 * K]; Object.assign(parts, cp);
    return { hipY: -232, parts, handLen: 106, rod: { part: 'torso', at: [-24, 14] },
      order: ['armB_up', 'armB_lo', 'tl_taille', 'legB_lo', 'legB_up', 'legF_lo', 'legF_up', 'cornette', 'head', 'chaperon', 'torso', 'armF_up', 'armF_lo', 'jg_jauge', 'jg_anneau', 'pc_manche', 'pc_lame'] };
  }
  CH.controleur = mkControleur(false);
  CH.controleurMini = mkControleur(true);

  // =====================================================================
  // LE SEIGNEUR — C.seigneur : en BUSTE (pas de jambes) : (x,y) = bord bas du buste (le balcon le cache) ; gros, double menton, petite barbe,
  // robe de velours rouge sang à fourrure, chaîne d'or, toque rouge. Gobelet tenu au poing (pose.tenu 'gobelet' par défaut) ; pose.lait 0..1 = moustache de lait.
  // ang : head (renversée pour boire : ≈ -0.5), toque, armF_*, armB_*, gob_corps/gob_pied (incliner le gobelet)
  // =====================================================================
  const SE = { skin: '#D9A57A', skinD: '#B98259', robe: Q.sang, robeD: Q.sangD, robeL: '#A4403A', fur: '#EFE6D0', furD: '#CDBF9F' };
  const SE_TORSO = [[-18, -176], [10, -182], [22, -170], [38, -148], [60, -108], [72, -54], [74, 6], [70, 62, 1], [-70, 62, 1], [-74, 6], [-72, -54], [-60, -110], [-42, -150], [-30, -168]];
  const SE_HEAD = [[-14, 16], [12, 20], [24, 14], [32, 4], [35, -6], [32, -15], [33, -21], [34, -27], [37, -33], [42, -38], [37, -45], [33, -52], [32, -62], [29, -78], [17, -92], [-6, -97], [-25, -88], [-35, -68], [-35, -46], [-29, -24], [-21, -4]];
  const SE_TOQUE = tr([[-40, 6], [32, 4], [38, -14], [30, -40], [8, -56], [-20, -52], [-42, -30]], 0, 0);
  function mkSeigneur() {
    const c = { seed: 1300, sleeve: SE.robe, sleeveD: SE.robeD, cuff: SE.fur, skin: SE.skin, skinD: SE.skinD, armLen: 92 };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: SE_TORSO, base: SE.robe, seed: 1301, paint: () => {
        for (const x of [-52, -30, -8, 14, 36, 56]) strokePts([[x, -110], [x + 3, -20], [x + 5, 60]], 'rgba(30,4,4,0.45)', 1.5);
        // collet de fourrure (hermine : petites queues sombres) le long de l'encolure et du devant
        fillPts([[-24, -178], [10, -184], [24, -172], [42, -150], [38, -120], [24, -110], [26, -60], [34, 62], [18, 62], [10, -60], [8, -120], [-8, -150]], SE.fur);
        for (const [x, y] of [[20, -168], [34, -146], [30, -118], [20, -92], [26, -64], [24, -34], [26, -4], [28, 26], [28, 52]]) { strokePts([[x, y - 4], [x + 2, y + 5]], '#2a1c1c', 2.2); }
        hatch([[-80, -180], [-14, -180], [-10, 66], [-80, 66]], 0.75, 4.4, 0.4); shade(80, 0, -76, 0, 0.34);
        // galon d'or
        strokePts([[-70, 54], [70, 54]], Q.laiton, 4); strokePts([[-70, 46], [70, 46]], 'rgba(255,230,160,0.4)', 1.4);
        // chaîne d'or : deux rangs de maillons autour du col
        for (let i = 0; i < 12; i++) { const a = PI * 0.05 + i * PI * 0.085, x = -24 + Math.cos(a) * 60, y = -150 + Math.sin(a) * 66; dot(x + 0.8, y + 1, 6.4, 'rgba(20,8,2,0.4)'); dot(x, y, 5.6, Q.laiton); dot(x, y, 3, Q.laitonL); }
        piece(ell(24, -76, 10, 12, 10), Q.laiton, () => dot(22, -80, 3, Q.laitonL), { seed: 1302, drop: false }); } },
      head: { parent: 'torso', at: [6, -172], pts: scl(SE_HEAD, 1.12), base: SE.skin, seed: 1303, noRivet: true, paint: (p) => {
        const f = p.face || {}; cx_().scale(1.12, 1.12);
        X.earPaint(-8, -44);
        fillPts([[-34, -70], [-33, -44], [-26, -20], [-18, -2], [-26, -24], [-40, -60]], '#6b4a30', 2);          // cheveux sur la nuque
        hatch([[-22, -42], [2, -30], [14, -6], [-6, 22], [-32, 4]], 0.6, 3.6, 0.32);
        strokePts([[-4, 10], [14, 14], [28, 6]], 'rgba(90,50,40,0.5)', 1.5);                                     // pli du double menton
        dot(18, -30, 12, 'rgba(210,110,100,0.4)'); dot(40, -37, 5.5, 'rgba(210,110,100,0.55)');
        // petite barbe en pointe + moustache
        fillPts([[30, -4], [30, 6], [22, 22], [8, 20], [10, 6], [18, -2]], '#6b4a30', 7, 0.3);
        fillPts([[38, -32], [30, -26], [18, -26], [20, -33], [30, -36]], '#6b4a30', 8, 0.3);
        X.eye(f, 18, -52, 0.95); X.brow(f, 18, -60, '#5b3c26', 2.6); X.mouth(f, 27, -17); },
        extra: (p) => {
          if (M._sil()) return; const k = clamp(p.lait || 0); if (k < 0.02) return;      // MOUSTACHE DE LAIT : volute blanche sur la lèvre + gouttes
          const s = 0.6 + 0.4 * M.spring(k * 0.5, 0.5, 14), H = 1.12;       // vraie moustache : bande épaisse et ondulée sur la lèvre, sous le nez, sans coulure
          const top = [[14, -33], [22, -39], [30, -35], [38, -40], [47, -37]].map((q) => [q[0] * 1, q[1] - 1 * s]);
          const bot = [[49, -30], [42, -25 + 2 * s], [34, -29], [26, -24 + 2 * s], [18, -28], [12, -29]];
          fillPts(top.concat(bot), '#FFFFFF', 11, 0.2);
          strokePts(top.concat(bot.slice(0, 1)), 'rgba(120,95,60,0.85)', 1.3); strokePts(bot, 'rgba(120,95,60,0.85)', 1.3);
          strokePts([[20, -35], [30, -31], [40, -34]], 'rgba(225,215,195,0.9)', 2); } },
      toque: { parent: 'head', at: [-2, -95], pts: SE_TOQUE, base: SE.robe, seed: 1304, noRivet: true, paint: () => {
        fillPts([[-44, -6], [36, -8], [38, 8], [-44, 10]], SE.fur); for (let x = -36; x < 36; x += 12) strokePts([[x, -4], [x + 2, 6]], '#2a1c1c', 2);
        for (const x of [-26, -4, 18]) strokePts([[x, -10], [x + 4, -50]], 'rgba(30,4,4,0.45)', 1.3);
        hatch(null, 0.6, 4, 0.34); shade(34, -30, -30, -30, 0.3, [-50, -60, 44, 12]); } },
    };
    Object.assign(parts, { armB_up: manArms(c).armB_up, armB_lo: manArms(c).armB_lo, armF_up: manArms(c).armF_up, armF_lo: manArms(c).armF_lo });
    parts.armF_up.pts = scl(X.armPts(92), 1.5, 1); parts.armB_up.pts = scl(X.armPts(92), 1.5, 1);
    // bras plus larges (manches de velours) : l'armPts du kit reste ; on ajoute du volume en peinture
    Object.assign(parts, gobParts('gob_', 'armF_lo', [4, 98], 36, 0));
    for (const n of ['gob_corps', 'gob_pied']) { const sp = parts[n], o = sp.pts, pa = sp.paint; const KG = 0.8; sp.pts = (p) => scl(typeof o === 'function' ? o(p) : o, KG); if (pa) sp.paint = (p) => { const c = cx_(); c.save(); c.scale(KG, KG); pa(p); c.restore(); }; }
    parts.gob_corps.pts = ((o) => (p) => ((p.tenu || 'gobelet') === 'gobelet' ? o(p) : OFFP))(parts.gob_corps.pts);
    parts.gob_pied.pts = ((o) => (p) => ((p.tenu || 'gobelet') === 'gobelet' ? o(p) : OFFP))(parts.gob_pied.pts);
    for (const n of ['gob_corps', 'gob_pied']) { const o = parts[n].paint; parts[n].paint = (p) => { if ((p.tenu || 'gobelet') === 'gobelet') o(p); }; }
    return { hipY: -62, parts, handLen: 100, rod: { part: 'torso', at: [-34, 30] },
      order: ['armB_up', 'armB_lo', 'head', 'toque', 'torso', 'armF_up', 'armF_lo', 'gob_pied', 'gob_corps'] };
  }
  CH.seigneur = mkSeigneur();

  // =====================================================================
  // LE MOINE CHARTREUX — C.moine : robe longue et capuche (rabattue) ivoire contourée, tonsure, ceinture de cuir, grande manche
  // (x,y) = bas de la robe (au sol).  Pas de jambes.  pose.face.eyes : 'open'|'closed'|'wide'|'half'|'up'|'side'
  // pièces : capuche torso head cordon armB_up armB_lo armF_up armF_lo fromage
  // pose.fromage (vrai) : montre le petit fromage dans la grande manche avant ; pose.fromageK 0..1 : 0 = au bout de la manche (visible), 1 = glissé dedans (caché)
  // handF / handB : 'open' | 'fist' ; ang.cordon (balancement du bout de corde)
  // =====================================================================
  const MO = { robe: '#EDE4CE', robeD: '#D6CAAC', robeL: '#F7F0DE', line: 'rgba(96,68,32,0.95)', fold: 'rgba(120,86,40,0.55)', ocre: '120,88,40', skin: '#E0B792', skinD: '#C79B78', belt: '#5E3E26' };
  const MO_TORSO = [[-16, -178], [8, -182], [18, -170], [28, -150], [36, -110], [40, -50], [44, 20], [52, 120], [60, 200], [68, 252, 1], [-68, 254, 1], [-60, 200], [-52, 120], [-44, 20], [-42, -50], [-40, -110], [-34, -150], [-24, -168]];
  const MO_COWL = [[-18, -166], [10, -170], [34, -152], [46, -122], [34, -100], [10, -118], [-18, -112], [-56, -100], [-70, -124], [-54, -158]];
  const MO_HEAD = [[-14, 16], [10, 16], [14, 6], [22, -2], [28, -8], [30, -14], [29, -20], [30, -25], [30, -30], [34, -35], [38, -39], [35, -46], [31, -54], [30, -64], [28, -78], [16, -90], [-6, -95], [-24, -88], [-34, -68], [-34, -46], [-26, -26], [-18, -8]];
  function sleeveHandPts(kind) {
    const h = (kind === 'fist' ? X.HAND_FIST : X.HAND_OPEN).slice(2, -1).map((q) => [q[0] * 1.05, q[1]]);
    return [[-28, -10], [28, -10], [33, 40], [39, 74, 1], [17, 84, 1], ...h, [-9, 86], [-17, 84, 1], [-39, 74, 1], [-33, 40]];
  }
  function mkMoine() {
    const sleeve = (back) => ({ up: { parent: 'torso', at: back ? [-10, -146] : [-2, -146], seed: back ? 1411 : 1412, base: back ? MO.robeD : MO.robe, pts: scl(X.armPts(94), 1.55, 1),
        paint: () => { for (const x of [-20, 0, 20]) strokePts([[x, -4], [x * 1.1, 50], [x * 1.3, 96]], MO.fold, 1.3); hatch(null, 0.8, 4, 0.3, 1, MO.ocre); shade(26, 0, -20, 0, 0.25, [-34, -24, 34, 100]); strokePts(scl(X.armPts(94), 1.55, 1), MO.line, 3, true); } },
      lo: { parent: back ? 'armB_up' : 'armF_up', at: [0, 94], seed: back ? 1413 : 1414, base: back ? MO.robeD : MO.robe,
        pts: (p) => sleeveHandPts((back ? p.handB : p.handF) || 'open'),
        paint: (p) => {
          const kind = (back ? p.handB : p.handF) || 'open';
          fillPts([[-24, 84], [24, 84], [26, 140], [-22, 140]], MO.skin); X.handPaint(null, kind);
          for (const x of [-18, 0, 18]) strokePts([[x, -4], [x * 1.25, 36], [x * 1.45, 72]], MO.fold, 1.3);
          cline([[-37, 74], [-17, 84]], MO.line, 2.4); cline([[39, 74], [17, 84]], MO.line, 2.4);
          fillPts([[-37, 72], [-17, 82], [17, 82], [39, 72], [30, 62], [-30, 62]], 'rgba(96,68,32,0.28)', 3, 0);              // ombre du bord de manche
          hatch([[-34, -10], [34, -10], [34, 70], [-34, 70]], 0.8, 4.2, 0.3, 1, MO.ocre); shade(30, 0, -26, 0, 0.22, [-40, -12, 40, 90]);
          strokePts(sleeveHandPts(kind), MO.line, 3, true); } } });
    const sb = sleeve(true), sf = sleeve(false);
    const parts = {
      capuche: { parent: 'torso', at: [0, 0], noRivet: true, pts: MO_COWL, base: MO.robeL, seed: 1401, paint: () => {
        for (const [a, b] of [[[-50, -150], [-40, -110]], [[-30, -164], [-34, -112]], [[20, -160], [26, -120]]]) strokePts([a, b], MO.fold, 1.5);
        hatch(null, 0.7, 4, 0.3, 1, MO.ocre); shade(40, -140, -50, -100, 0.28, [-80, -180, 60, -90]); strokePts(MO_COWL, MO.line, 3, true); } },
      torso: { parent: null, at: [0, 0], pts: MO_TORSO, base: MO.robe, seed: 1402, paint: () => {
        // scapulaire (panneau de devant, plus clair) et plis longs
        fillPts([[8, -150], [34, -120], [38, -50], [42, 20], [52, 120], [60, 200], [64, 254], [12, 254], [6, 120], [8, 20], [4, -50]], MO.robeL, 2, 0);
        strokePts([[8, -148], [4, -50], [8, 20], [6, 120], [10, 254]], MO.line, 2);
        for (const [x0, x1] of [[-30, -44], [-14, -22], [-2, -8], [22, 30], [34, 44]]) strokePts([[x0 * 0.6, -60], [x0, 60], [x1 * 1.2, 250]], MO.fold, 1.6);
        hatch([[-76, -180], [-10, -180], [-10, 256], [-76, 256]], 0.8, 4.4, 0.24, 1, MO.ocre); hatch([[-76, 120], [80, 120], [80, 256], [-76, 256]], -0.5, 6, 0.1, 1, MO.ocre);
        shade(76, 0, -50, 0, 0.2, [-80, -180, 80, 258]);
        // ceinture de cuir + boucle
        fillPts([[-46, -14], [46, -12], [47, 2], [-47, 4]], MO.belt); fillPts([[18, -15], [32, -14], [32, 4], [18, 4]], Q.laiton); strokePts([[-46, -10], [46, -9]], 'rgba(255,220,160,0.3)', 1.2);
        // ourlet
        fillPts([[-70, 240], [70, 240], [70, 256], [-70, 256]], 'rgba(120,88,40,0.28)', 3, 0);
        strokePts(MO_TORSO, MO.line, 3.2, true); } },
      cordon: { parent: 'torso', at: [24, 0], noRivet: true, seed: 1403, base: '#7b5a3a', pts: [[-4, -2], [5, -2], [7, 60], [5, 118, 1], [10, 138, 1], [-10, 140, 1], [-5, 118, 1], [-6, 60]],
        paint: () => { for (let y = 4; y < 112; y += 6) strokePts([[-5, y], [5, y + 3]], 'rgba(30,18,8,0.5)', 1.2); fillPts([[-10, 118], [10, 118], [11, 140], [-11, 140]], '#5E3E26'); hatch(null, 0.9, 3.2, 0.25); } },
      head: { parent: 'torso', at: [6, -172], pts: MO_HEAD, base: MO.skin, seed: 1404, noRivet: true, paint: (p) => {
        const f = p.face || {};
        // tonsure : calotte nue, couronne de cheveux bruns
        fillPts([[22, -84], [8, -80], [-6, -72], [-4, -52], [-10, -30], [-16, -8], [-26, -24], [-34, -46], [-34, -70], [-28, -84]], '#6b4a30', 6, 0.3);
        for (let k = 0; k < 7; k++) strokePts([[-30 + k * 4, -76 + k * 4], [-26 + k * 3, -60 + k * 5]], 'rgba(30,18,8,0.45)', 1);
        strokePts([[24, -80], [8, -76], [-6, -70]], 'rgba(90,55,30,0.5)', 1.4);
        strokePts([[-2, -92], [8, -90]], 'rgba(255,255,255,0.7)', 2.4);                                      // reflet sur le crâne
        X.earPaint(-8, -44);
        hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.28);
        dot(15, -31, 11, 'rgba(206,108,98,0.35)'); dot(36, -41, 4.5, 'rgba(206,108,98,0.45)');
        eyeX(f, 17, -52, 1); X.brow(f, 17, -60, 'rgba(70,45,30,0.9)', 2.4); X.mouth(f, 26, -22); } },
      armB_up: { parent: 'torso', at: [-10, -146], seed: 1411, base: MO.robeD, pts: sb.up.pts, paint: sb.up.paint },
      armB_lo: Object.assign({ at: [0, 94] }, sb.lo),
      armF_up: sf.up,
      armF_lo: sf.lo,
    };
    parts.armB_lo.parent = 'armB_up'; parts.armF_lo.parent = 'armF_up';
    // petit fromage caché dans la grande manche avant (dessiné AVANT la manche : elle le recouvre)
    const ch = cheParts().corps;
    const fy = (p) => lerp(124, 10, clamp(p.fromageK || 0));
    parts.fromage = { parent: 'armF_lo', at: [0, 0], noRivet: true, seed: 1405, base: Q.croute,
      pts: (p) => (p.fromage ? tr(ch.pts({ etat: 'mini' }), 0, fy(p)) : OFFP),
      paint: (p) => { if (!p.fromage) return; const c = cx_(); c.save(); c.translate(0, fy(p)); ch.paint({ etat: 'mini' }); c.restore(); } };
    return { hipY: -254, parts, handLen: 110, rod: { part: 'torso', at: [-34, 40] },
      order: ['armB_up', 'armB_lo', 'torso', 'cordon', 'capuche', 'head', 'fromage', 'armF_up', 'armF_lo'] };
  }
  CH.moine = mkMoine();

  // =====================================================================
  // LA VACHE ABONDANCE — C.vache (corps entier, de profil, regarde vers +x) et C.vacheTete (tête + encolure seules)
  // Repère : origine = milieu du ventre ; sol à y = +210 ; corps ≈ 585 px de long, garrot ≈ 330 px ; tête ≈ 180 px.
  // Deux tiges en bois (épaule et croupe) dans la même fente → utiliser REB.vache(...) (ajoute pose.slot) ou passer pose.slot = ST.slotF / slotB.
  // Pièces articulées (pose.ang.* ; rest + ang) :
  //   head (pivot au cou ; négatif = relève le museau), jaw (mâchoire : positif = ouvre), earN/earF (oreilles), hornN/hornF (cornes), queue,
  //   clarine (balance autour du collier), legFN_up/_lo (avant proche), legFF_* (avant lointaine), legRN_* (arrière proche), legRF_*, pis.
  //   genou avant : *_lo POSITIF = plie (sabot vers l'arrière) ; jarret arrière : *_lo NÉGATIF = plie (sabot vers l'avant)
  // pose : lid 0..1 (paupière haute de l'œil proche ; 1 = fermé = clin d'œil), lidB 0..1 (paupière basse : yeux mi-clos), lidF (œil lointain, vue de face),
  //        humeur -1..1 (0 = œil de référence, >0 fâchée : sourcil en V, paupière en biais ; <0 très heureuse : yeux plissés), tq 0..1 (tête tournée vers le public : dessin de face), face.mouth 'n'|'smile'|'tight', clarineK (×1,3 au plan 6), slot.
  // =====================================================================
  const CWC = { ac: Q.acajou, acD: Q.acajouD, acL: Q.acajouL, iv: Q.ivoire, ivD: Q.ivoireD, ivL: Q.ivoireL, ro: Q.rose, roD: Q.roseD, hoof: '#3A2A22' };
  const CW_TORSO = [[-286, -116, 1], [-250, -132], [-206, -142], [-160, -130], [-110, -118], [-40, -118], [30, -122], [100, -132], [170, -143], [228, -126], [272, -106], [312, -92], [336, -60], [332, -24], [312, 4], [300, 30], [282, 56], [246, 72], [196, 82], [130, 87], [60, 84], [0, 78], [-60, 62], [-114, 46], [-166, 26], [-218, 0], [-264, -28], [-296, -66], [-302, -100]];
  const FL_UP = [[-23, -22], [23, -24], [26, 8], [20, 54], [15, 98], [-15, 98], [-19, 54], [-26, 8]];
  const FL_LO = [[-14, -6], [14, -6], [13, 40], [12, 74], [19, 82], [21, 90, 1], [-18, 90, 1], [-16, 82], [-12, 74], [-13, 40]];
  const RL_UP = [[-36, -22], [34, -22], [32, 30], [24, 74], [16, 110], [-15, 110], [-22, 74], [-32, 30]];
  const RL_LO = [[-13, -6], [13, -6], [12, 40], [11, 76], [18, 84], [20, 91, 1], [-17, 91, 1], [-15, 84], [-11, 76], [-12, 40]];
  function legCow(far, hind, name, parent, at, rest, restLo) {
    const sh = far ? 'rgba(40,18,10,0.22)' : null, out = {};
    out[name + '_up'] = { parent, at, noRivet: far, seed: 1500 + (hind ? 10 : 0) + (far ? 1 : 0), base: far ? CWC.acD : CWC.ac, rest, pts: hind ? RL_UP : FL_UP,
      paint: () => {
        fillPts([[-40, hind ? 62 : 44], [40, hind ? 62 : 44], [40, 130], [-40, 130]], CWC.ivD, 2, 0);
        for (const x of [-12, 0, 12]) strokePts([[x, hind ? 74 : 52], [x + 2, hind ? 100 : 94]], 'rgba(120,100,70,0.35)', 1);
        strokePts(hind ? [[-30, 10], [-10, 50], [4, 90]] : [[-18, 0], [-8, 40], [-4, 80]], 'rgba(40,16,8,0.4)', 1.4);
        hatch(null, 1.3, 4, 0.26); shade(26, 0, -24, 0, 0.3, [-40, -26, 40, 118]); if (sh) fillPts([[-40, -30], [40, -30], [40, 120], [-40, 120]], sh, 0, 0); } };
    out[name + '_lo'] = { parent: name + '_up', at: [0, hind ? 110 : 98], noRivet: false, seed: 1503 + (hind ? 10 : 0) + (far ? 1 : 0), base: CWC.iv, rest: restLo, pts: hind ? RL_LO : FL_LO,
      paint: () => {
        fillPts([[-30, -10], [30, -10], [30, 70], [-30, 70]], CWC.iv, 3, 0);
        fillPts([[-30, 70], [30, 70], [30, 100], [-30, 100]], CWC.hoof, 4, 0.2); strokePts([[-12, 78], [-12, 88]], 'rgba(255,255,255,0.2)', 1.2);
        strokePts([[-10, 20], [-9, 56]], 'rgba(120,100,70,0.35)', 1);
        hatch(null, 1.3, 4, 0.2); shade(18, 0, -14, 0, 0.26, [-30, -10, 30, 100]); if (sh) fillPts([[-30, -10], [30, -10], [30, 100], [-30, 100]], sh, 0, 0); } };
    return out;
  }

  // ---- tête
  const CWH_REST = 0.62;
  const CH_P = [[-46, -14], [-24, -40], [12, -50], [54, -50], [92, -40], [118, -26], [136, -12], [148, 0], [151, 20], [147, 36], [135, 45], [110, 47], [90, 52], [70, 64], [38, 72], [0, 76], [-34, 78], [-52, 56], [-56, 22]];
  // vue de face : tête + oreilles + cornes en UNE silhouette (carton découpé)
  const CH_F = [[0, -44], [18, -46], [36, -60], [56, -80], [68, -104, 1], [48, -92], [38, -66], [44, -46], [58, -38], [82, -46], [98, -36, 1], [88, -16], [66, -8], [47, 2], [46, 30], [42, 62], [36, 90], [39, 112], [41, 130], [30, 147], [0, 154], [-30, 147], [-41, 130], [-39, 112], [-36, 90], [-42, 62], [-46, 30], [-47, 2], [-66, -8], [-88, -16], [-98, -36, 1], [-82, -46], [-58, -38], [-44, -46], [-38, -66], [-48, -92], [-68, -104, 1], [-56, -80], [-36, -60], [-18, -46]];
  function hq(p) {
    const q = clamp(p.tq || 0), a = CWH_REST + ((p.ang && p.ang.head) || 0);
    const s = q < 0.5 ? Math.max(0.07, 1 - 1.86 * q) : Math.max(0.07, (q - 0.5) * 2);
    return { q, a, s, front: q >= 0.5 };
  }
  function headPts(p) {
    const h = hq(p); if (h.q <= 0.001) return CH_P;
    return h.front ? rotp(scl(CH_F, h.s, 1), -h.a) : rotp(scl(rotp(CH_P, h.a), h.s, 1), -h.a);
  }
  function eyeCow(c, x, y, rx, ry, lid, lidB, look, lashBack, mood, sgn) {
    mood = clamp(mood || 0); sgn = sgn || 1; look = [look[0] + sgn * 3 * mood, look[1] + 0.8 * mood];
    fillPts(ell(x, y, rx + 1.6, ry + 1.6, 16), 'rgba(40,20,14,0.9)', 0, 0);
    fillPts(ell(x, y, rx, ry, 16), '#F6F0DE', 0, 0);
    const ir = ry * (0.74 - 0.24 * mood);
    c.save(); cpath(ell(x, y, rx, ry, 16)); c.clip();
    fillPts(ell(x + look[0], y + look[1], ir, ir, 14), '#4a2a1a', 0, 0); fillPts(ell(x + look[0], y + look[1], ir * 0.58, ir * 0.58, 12), '#150c0a', 0, 0);
    dot(x + look[0] - ir * 0.32, y + look[1] - ir * 0.36, ir * 0.24, 'rgba(255,255,255,0.95)'); dot(x + look[0] + ir * 0.3, y + look[1] + ir * 0.32, ir * 0.1, 'rgba(255,255,255,0.7)');
    const topY = y - ry + 2 * ry * clamp(lid) * 1.1, botY = y + ry - 2 * ry * clamp(lidB) * 0.75;
    if (lid > 0.01) {
      fillPts([[x - rx - 6, y - ry - 8], [x + rx + 6, y - ry - 8], [x + rx + 6, topY - 2], [x + rx * 0.5, topY + 2], [x, topY + 4], [x - rx * 0.5, topY + 2], [x - rx - 6, topY - 2]], '#9a5a3f', 0, 0);
      cline([[x - rx - 2, topY - 2], [x - rx * 0.5, topY + 3], [x, topY + 4], [x + rx * 0.5, topY + 3], [x + rx + 2, topY - 2]], 'rgba(30,14,10,0.95)', 2.6);
    }
    if (lidB > 0.01) { fillPts([[x - rx - 6, y + ry + 8], [x + rx + 6, y + ry + 8], [x + rx + 6, botY + 2], [x, botY - 3], [x - rx - 6, botY + 2]], '#8a4a33', 0, 0); cline([[x - rx - 2, botY + 1], [x, botY - 3], [x + rx + 2, botY + 1]], 'rgba(30,14,10,0.8)', 1.8); }
    if (mood > 0.02) {       // fâchée : paupière haute abaissée en biais (côté museau plus bas)
      const xb = x - sgn * (rx + 6), xf = x + sgn * (rx + 6), yb = lerp(y - ry - 10, y - ry * 0.5, mood), yf = lerp(y - ry - 10, y + ry * 0.2, mood);
      fillPts([[xb, y - ry - 14], [xf, y - ry - 14], [xf, yf], [xb, yb]], '#6a3222', 0, 0); cline([[xb, yb], [xf, yf]], 'rgba(25,10,6,0.95)', 3.4);
    }
    c.restore();
    if (lid >= 0.93) {
      // paupière fermée : arc sombre en « sourire » et cils vers le bas (clin d'œil)
      cline(ep(x, y - ry * 0.35, rx * 0.95, ry * 0.8, 12, PI * 0.12, PI * 0.88), 'rgba(30,14,10,0.97)', 3.2);
      for (let i = 0; i < 5; i++) { const a = PI * (0.2 + i * 0.15), x0 = x + Math.cos(a) * rx * 0.95, y0 = y - ry * 0.35 + Math.sin(a) * ry * 0.8; cline([[x0, y0], [x0 + Math.cos(a) * 7, y0 + 8]], 'rgba(30,14,10,0.95)', 1.8); }
      cline(ep(x, y - ry * 0.55, rx * 0.8, ry * 0.5, 8, PI * 1.15, PI * 1.85), 'rgba(205,140,105,0.5)', 1.6);
    } else if (lid < 0.85 && lashBack && mood < 0.5) {
      for (let i = 0; i < 6; i++) { const a = PI * (1.2 + i * 0.12), x0 = x + Math.cos(a) * (rx + 1), y0 = y + Math.sin(a) * (ry + 1); cline([[x0, y0], [x0 + Math.cos(a) * 9, y0 + Math.sin(a) * 9]], 'rgba(30,14,10,0.9)', 1.7); }
    } else if (lid < 0.85 && mood < 0.5) for (let i = 0; i < 5; i++) { const a = PI * (1.18 + i * 0.16), x0 = x + Math.cos(a) * (rx + 1), y0 = y + Math.sin(a) * (ry + 1); cline([[x0, y0], [x0 + Math.cos(a) * 9, y0 + Math.sin(a) * 9 - 1]], 'rgba(30,14,10,0.9)', 1.7); }
    else if (lid < 0.93) for (let i = 0; i < 5; i++) { const xx = x - rx * 0.9 + i * rx * 0.45; cline([[xx, topY + 2.5 - (i === 0 || i === 4 ? 3 : 0)], [xx + (i - 2) * 1.8, topY + 11]], 'rgba(30,14,10,0.9)', 1.7); }
  }
  function mouthLine(c, face, x0, y0, x1, y1, hm) {
    hm = hm || 0; const m = (face && face.mouth) || (hm > 0.5 ? 'grr' : 'n');
    if (m === 'grr') { cline([[x1 + 1, y1 + 5], [(x0 + x1) / 2, y1 + 1], [x0, y1 - 1]], 'rgba(60,24,24,0.95)', 3); return; }
    if (m === 'n' && hm < 0) y1 -= 5 * -hm;
    if (m === 'tight') cline([[x1, y1 + 1], [(x0 + x1) / 2, y1 + 2.5], [x0, y1 + 1]], 'rgba(60,24,24,0.95)', 3.6);
    else if (m === 'smile') cline([[x1 + 4, y1 - 9], [x1 - 6, y1 - 1], [(x0 + x1) / 2, y1 + 2.5], [x0, y1 + 1]], 'rgba(60,24,24,0.95)', 2.8);
    else cline([[x1 + 4, y1 - 10], [x1 - 6, y1 - 1], [(x0 + x1) / 2, y1 + 3], [x0, y1 + 1]], 'rgba(60,24,24,0.9)', 2.3);
  }
  function headPaint(p) {
    const c = cx_(), f = p.face || {}, h = hq(p), hum = clamp(p.humeur || 0, -1, 1), ang = Math.max(0, hum), hap = Math.max(0, -hum);
    c.save();
    if (h.q > 0.001) { if (!h.front) { c.rotate(-h.a); c.scale(h.s, 1); c.rotate(h.a); } else { c.rotate(-h.a); c.scale(h.s, 1); } }
    if (!h.front) {
      // ----- profil : lunettes acajou, touffe du front, mufle rose, grand œil rond
      fillPts([[24, -52], [70, -52], [108, -42], [100, -22], [78, -30], [40, -24], [20, -32]], CWC.ac, 4, 0.4);
      fillPts(ell(76, -3, 27, 27, 18), CWC.ac, 3, 0.4);
      hatch(ell(76, -4, 29, 26, 18), 0.9, 3.4, 0.28);
      fillPts([[-4, -44], [20, -54], [50, -52], [54, -38], [24, -34], [0, -34]], CWC.acL, 5, 0.6);
      for (const [x, y] of [[8, -44], [24, -46], [42, -44]]) strokePts([[x - 6, y + 1], [x, y - 7], [x + 6, y + 1]], 'rgba(50,20,10,0.6)', 1.3);
      fillPts([[100, -12], [126, -14], [144, -6], [152, 8], [151, 34], [140, 46], [106, 48], [98, 16]], CWC.ro, 6, 0.4);
      fillPts([[104, 32], [148, 32], [140, 47], [106, 48]], 'rgba(120,60,60,0.4)', 0, 0);
      hatch([[98, -16], [156, -12], [156, 50], [98, 50]], 0.5, 3.2, 0.2); shade(156, 10, 98, 10, 0.25, [92, -20, 160, 52]);
      fillPts(ell(138, 2, 7, 4.5, 8), CWC.hoof, 0, 0); fillPts(ell(138, 17, 6, 4, 8), CWC.hoof, 0, 0);
      for (const [x, y] of [[122, 26], [132, 28], [126, 8]]) dot(x, y, 1.3, 'rgba(90,40,40,0.5)');
      mouthLine(c, f, 98, 47, 142, 43, hum);
      hatch([[30, 18], [80, 36], [66, 66], [10, 74], [-20, 60]], 0.6, 3.6, 0.26);
      hatch([[-60, -20], [-10, -36], [-6, 60], [-52, 60]], 0.7, 3.8, 0.2);
      dot(66, 26, 10, 'rgba(226,120,120,' + (0.5 * (1 - ang) + 0.25 * hap) + ')');
      eyeCow(c, 76, -3, 17.5, 17.5, Math.max(clamp(p.lid || 0), 0.04 * hap), Math.max(clamp(p.lidB || 0), 0.44 * hap), [0, 0], true, ang, 1);
      if (ang > 0.02) cline([[60, lerp(-40, -38, ang)], [76, lerp(-40, -33, ang)], [93, lerp(-40, -20, ang)]], 'rgba(30,12,6,' + Math.min(1, ang * 1.3) + ')', 3 + 3 * ang);
      shade(110, 0, -40, 0, 0.12, [-60, -50, 180, 80]);
    } else {
      // ----- de face (vue du public) : tête, oreilles et cornes d'une seule pièce
      const sy = 1;
      // cornes (ivoire, pointe sombre)
      for (const sd of [-1, 1]) {
        fillPts([[sd * 44, -46], [sd * 38, -66], [sd * 48, -92], [sd * 68, -104], [sd * 56, -80], [sd * 36, -60]], CWC.iv, 0, 0);
        fillPts([[sd * 56, -94], [sd * 68, -104], [sd * 52, -86]], '#4a3a32', 0, 0);
        strokePts([[sd * 44, -50], [sd * 40, -68], [sd * 48, -88]], 'rgba(80,60,40,0.45)', 1.3);
        // oreilles
        fillPts([[sd * 47, 2], [sd * 58, -38], [sd * 82, -46], [sd * 98, -36], [sd * 88, -16], [sd * 66, -8]], CWC.ac, 0, 0.4);
        fillPts([[sd * 54, -6], [sd * 62, -30], [sd * 80, -38], [sd * 90, -32], [sd * 82, -20], [sd * 66, -14]], CWC.ro, 0, 0.4);
        hatch([[sd * 47, 2], [sd * 58, -38], [sd * 98, -36], [sd * 88, -16]], 0.5, 3.4, 0.25);
        strokePts([[sd * 50, 0], [sd * 60, -36], [sd * 82, -44]], 'rgba(40,18,10,0.55)', 1.4);
      }
      fillPts([[-44, -32], [-30, -42], [0, -46], [30, -42], [44, -32], [40, 8], [20, -4], [0, 0], [-20, -4], [-40, 8]], CWC.ac, 3, 0.4);
      fillPts(ell(-26, 14, 31, 28, 16), CWC.ac, 5, 0.4); fillPts(ell(26, 14, 31, 28, 16), CWC.ac, 6, 0.4);
      hatch(ell(-26, 14, 31, 28, 16), 0.9, 3.4, 0.28); hatch(ell(26, 14, 31, 28, 16), 0.9, 3.4, 0.28);
      fillPts([[-14, -42], [0, -56], [14, -42], [0, -34]], CWC.acL, 7, 0.5); strokePts([[-7, -44], [0, -51], [7, -44]], 'rgba(50,20,10,0.6)', 1.3);
      const lb = Math.max(clamp(p.lidB || 0), 0.44 * hap);
      eyeCow(c, -26, 14, 17.5, 19, Math.max(clamp(p.lid || 0), 0.04 * hap), lb, [0, 1.5], false, ang, 1);
      eyeCow(c, 26, 14, 17.5, 19, Math.max(clamp(p.lidF || 0), 0.04 * hap), lb, [0, 1.5], false, ang, -1);
      for (const sd of [-1, 1]) cline([[sd * 46, -4], [sd * 30, lerp(-15, -8, ang)], [sd * 10, lerp(-13, 6, ang)]], ang > 0.02 ? 'rgba(30,12,6,' + Math.min(1, ang * 1.3) + ')' : 'rgba(60,30,20,0.6)', 2.2 + 3 * ang);
      hatch([[-46, 40], [46, 40], [38, 100], [-38, 100]], 0.6, 3.8, 0.14);
      fillPts(ell(0, 126, 37, 29, 18), CWC.ro, 8, 0.5); hatch(ell(0, 126, 37, 29, 18), 0.6, 3.2, 0.2);
      fillPts(ell(-13, 120, 8.5, 6.5, 8), CWC.hoof, 0, 0); fillPts(ell(13, 120, 8.5, 6.5, 8), CWC.hoof, 0, 0);
      const m = f.mouth || (ang > 0.5 ? 'grr' : 'n');
      if (m === 'grr') cline([[-24, 143], [0, 140], [24, 143]], 'rgba(60,24,24,0.95)', 3.4);
      else if (m === 'tight') cline([[-25, 140], [0, 141], [25, 140]], 'rgba(60,24,24,0.95)', 3.6);
      else if (m === 'smile') cline([[-28, 131], [-17, 141], [0, 143], [17, 141], [28, 131]], 'rgba(60,24,24,0.95)', 2.8);
      else cline([[-22, 140 - 5 * hap], [0, 143], [22, 140 - 5 * hap]], 'rgba(60,24,24,0.9)', 2.3);
    }
    c.restore();
  }
  const EAR = [[0, -8], [-34, -28], [-70, -28], [-92, -14], [-74, 5], [-40, 13], [-6, 10]];
  const OFFH = (p) => hq(p).q > 0.12;
  function headParts(parent, at) {
    const P = {};
    P.jaw = { parent: 'head', at: [56, 48], noRivet: true, seed: 1521, base: CWC.iv,
      pts: (p) => (OFFH(p) ? OFFP : [[78, -22], [88, -12], [94, -6], [96, 6], [90, 18], [70, 25], [26, 21], [-6, 2], [-10, -20], [44, -26]]),
      paint: (p) => { if (OFFH(p)) return; fillPts([[-20, -40], [140, -40], [140, -13], [-20, -13]], '#4a1818', 3, 0);  hatch([[-10, 4], [130, 4], [130, 26], [-10, 26]], 0.6, 3.4, 0.22); shade(0, 22, 0, 0, 0.2, [-30, -40, 140, 30]); } };
    P.earF = { parent: 'head', at: [-6, -38], noRivet: true, seed: 1522, base: CWC.acD, rest: -0.1,
      pts: (p) => (OFFH(p) ? OFFP : scl(EAR, 0.55)),
      paint: (p) => { if (OFFH(p)) return; fillPts(scl([[-4, -2], [-30, -18], [-60, -20], [-76, -10], [-62, 2], [-34, 8], [-6, 6]], 0.55), CWC.ro, 3, 0.3); hatch(null, 0.5, 3.2, 0.3); shade(0, -20, 0, 14, 0.25, [-100, -40, 10, 20]); } };
    P.hornF = { parent: 'head', at: [22, -42], noRivet: true, seed: 1523, base: CWC.iv,
      pts: (p) => (OFFH(p) ? OFFP : ribbon(bez([0, 0], [-6, -22], [0, -44], [22, -54], 12), 24, 8)),
      paint: (p) => { if (OFFH(p)) return; fillPts([[6, -80], [50, -80], [50, -42], [6, -42]], '#4a3a32', 0, 0); strokePts([[0, -8], [-4, -26], [10, -44]], 'rgba(80,60,40,0.4)', 1.2); hatch(null, 0.9, 3, 0.25); } };
    P.hornN = { parent: 'head', at: [8, -42], noRivet: true, seed: 1524, base: CWC.iv,
      pts: (p) => (OFFH(p) ? OFFP : ribbon(bez([0, 0], [-8, -24], [-2, -48], [22, -58], 12), 28, 9)),
      paint: (p) => { if (OFFH(p)) return; fillPts([[6, -84], [50, -84], [50, -46], [6, -46]], '#4a3a32', 0, 0); strokePts([[0, -8], [-6, -28], [10, -48]], 'rgba(80,60,40,0.4)', 1.2); hatch(null, 0.9, 3, 0.25); shade(20, 0, -10, 0, 0.2, [-30, -80, 70, 10]); } };
    P.earN = { parent: 'head', at: [-2, -30], noRivet: false, seed: 1525, base: CWC.ac, rest: 0.18,
      pts: (p) => (OFFH(p) ? OFFP : scl(EAR, 0.65)),
      paint: (p) => { if (OFFH(p)) return; fillPts(scl([[-4, -2], [-34, -20], [-68, -21], [-84, -11], [-70, 1], [-40, 7], [-8, 5]], 0.65), CWC.ro, 3, 0.3);
        for (let i = 0; i < 5; i++) strokePts([[-10 - i * 8, -3 - (i % 2) * 2], [-13 - i * 8, 3]], 'rgba(255,240,220,0.5)', 1.2);
        hatch(null, 0.5, 3.2, 0.3); shade(0, -20, 0, 14, 0.28, [-100, -40, 10, 20]); } };
    return P;
  }

  // ---- le corps
  function cowTorsoPaint() {
    // ventre ivoire à bord irrégulier
    const belly = [[330, 8], [300, 20], [270, 22], [246, 36], [222, 16], [182, 32], [140, 18], [100, 36], [60, 20], [20, 38], [-20, 24], [-60, 40], [-100, 26], [-140, 36], [-180, 16], [-224, 8], [-262, -14], [-306, -22], [-306, 140], [340, 140]];
    fillPts(belly, CWC.iv, 11, 0.8);
    for (let i = 0; i < belly.length - 3; i++) { const a = belly[i], b = belly[i + 1]; for (let k = 0; k < 4; k++) { const u = (k + 0.3) / 4, x = lerp(a[0], b[0], u), y = lerp(a[1], b[1], u); strokePts([[x, y], [x + 1.5, y - 7]], 'rgba(233,220,192,0.85)', 1.1); } }
    // muscles, côtes, épaule, hanche
    strokePts([[150, -116], [200, -40], [232, 24]], 'rgba(60,24,12,0.5)', 1.8);
    strokePts([[-200, -112], [-170, -50], [-200, 6]], 'rgba(60,24,12,0.45)', 1.8);
    for (let i = 0; i < 7; i++) strokePts([[40 + i * 14, -90 + i * 2], [34 + i * 14, 16]], 'rgba(60,24,12,0.14)', 1.3);
    strokePts([[-250, -131], [-206, -140], [-152, -128], [-92, -122], [-30, -126], [40, -128], [110, -134], [168, -141]], 'rgba(214,150,110,0.5)', 1.8);       // ligne de dos éclairée
    fillPts(ell(-200, -122, 22, 8, 10), 'rgba(205,140,100,0.35)', 3, 0);
    hatch([[-300, -130], [340, -130], [340, 80], [-300, 80]], 1.25, 5, 0.12, 1, M.P.encre);
    hatch([[-300, -20], [-120, -20], [-120, 80], [-300, 80]], 0.7, 4.2, 0.2); hatch([[180, -60], [340, -60], [340, 40], [180, 40]], 1.0, 4.2, 0.2);
    shade(-300, 0, 330, 0, 0.1, [-310, -140, 340, 80], '30,10,6'); shade(0, -140, 0, 80, 0.18, [-310, -140, 340, 80]);
    // plis du cou et fanon
    for (const [a, b, c2] of [[[280, -90], [300, -50], [290, -10]], [[250, -100], [276, -52], [270, 8]], [[220, 24], [250, 40], [280, 36]]]) strokePts([a, b, c2], 'rgba(60,24,12,0.35)', 1.3);
  }
  function cowSpec(o) {
    const parts = {};
    const full = !o.neckOnly;
    parts.torso = { parent: null, at: [0, 0], seed: 1511, base: CWC.ac, pts: o.neckOnly ? CWN_NECK : CW_TORSO.map((q) => (q[2] ? [336 - (336 - q[0]) * 0.77, q[1], 1] : [336 - (336 - q[0]) * 0.77, q[1]])), paint: o.neckOnly ? neckPaint : (p) => { const c = cx_(); c.save(); c.translate(336, 0); c.scale(0.77, 1); c.translate(-336, 0); cowTorsoPaint(p); c.restore(); } };
    const hAt = o.neckOnly ? CWN_HEAD_AT : [311, -84];
    parts.head = { parent: 'torso', at: hAt, noRivet: false, seed: 1520, base: CWC.iv, rest: CWH_REST, pts: headPts, paint: headPaint };
    Object.assign(parts, headParts('head', hAt));
    const HK = 1.16;                                        // la tête est un peu agrandie (lisibilité, comme un dessin animé)
    for (const n of ['head', 'jaw', 'earF', 'earN', 'hornF', 'hornN']) {
      const sp = parts[n], o = sp.pts, pa = sp.paint;
      sp.pts = (p) => scl(typeof o === 'function' ? o(p) : o, HK);
      if (pa) sp.paint = (p) => { const c = cx_(); c.save(); c.scale(HK, HK); pa(p); c.restore(); };
      if (n !== 'head') sp.at = [sp.at[0] * HK, sp.at[1] * HK];
    }
    // collier de cuir + clarine (UNE fonction : claParts)
    const cAt = o.neckOnly ? CWN_COLLAR : [288, 44];
    parts.collier = { parent: 'torso', at: [0, 0], noRivet: true, seed: 1530, base: Q.cuir, pts: o.neckOnly ? CWN_COLLAR_PTS : [[265, -116], [288, -110], [308, 24], [304, 60], [276, 62], [279, 22]],
      paint: () => { hatch(null, 1.0, 3.2, 0.3); for (let i = 0; i < 8; i++) { const u = i / 7; const pt = o.neckOnly ? [lerp(CWN_COLLAR_PTS[0][0], CWN_COLLAR_PTS[3][0], u), lerp(CWN_COLLAR_PTS[0][1], CWN_COLLAR_PTS[3][1], u)] : [lerp(256, 274, u), lerp(-106, 46, u)]; dot(pt[0] + 3, pt[1], 1.4, 'rgba(255,230,180,0.5)'); } shade(10, 0, -10, 0, 0.3, [230, -130, 300, 70]); } };
    Object.assign(parts, claParts('cl_', 'torso', cAt, 0, 1.15));
    if (full) {
      Object.assign(parts, legCow(true, false, 'legFF', 'torso', [259, 24], 0, 0), legCow(true, true, 'legRF', 'torso', [-66, -6], 0.3, -0.3), legCow(false, false, 'legFN', 'torso', [234, 24], 0, 0), legCow(false, true, 'legRN', 'torso', [-97, -8], 0.3, -0.3));
      parts.pis = { parent: 'torso', at: [-24, 20], noRivet: true, seed: 1540, base: CWC.ro,
        pts: [[-46, -16], [44, -16], [50, 20], [48, 50], [38, 68, 1], [32, 90, 1], [24, 90, 1], [18, 72], [10, 94, 1], [2, 94, 1], [-2, 74], [-12, 94, 1], [-20, 94, 1], [-22, 72], [-32, 88, 1], [-40, 88, 1], [-42, 64, 1], [-50, 50], [-50, 20]],
        paint: () => { hatch(null, 0.7, 3.6, 0.22); for (const x of [-30, 8, 28]) strokePts([[x, 10], [x + 3, 50]], 'rgba(150,80,80,0.35)', 1.2); fillPts([[-50, 60], [50, 60], [50, 100], [-50, 100]], 'rgba(150,80,80,0.18)', 0, 0); shade(50, 0, -40, 0, 0.28, [-56, -20, 56, 100]); } };
      parts.queue = { parent: 'torso', at: [-148, -112], noRivet: false, seed: 1541, base: CWC.acD, rest: 0.06,
        pts: [[-6, -2], [6, -2], [7, 60], [6, 124], [15, 138], [17, 170], [9, 196, 1], [-2, 212, 1], [-14, 192], [-18, 162], [-12, 136], [-5, 122], [-6, 60]],
        paint: () => { fillPts([[-20, 126], [20, 126], [20, 220], [-20, 220]], '#3a1c12', 4, 0.3); fillPts([[-18, 190], [18, 190], [18, 220], [-18, 220]], '#CDBE9C', 5, 0.4);
          for (let k = 0; k < 8; k++) strokePts([[-12 + k * 3.4, 132], [-14 + k * 3.8, 196]], 'rgba(255,230,200,0.25)', 1); hatch(null, 1.3, 3.4, 0.3); } };
      // seconde tige (croupe) : dessinée par une pièce hors-champ (voir extra) pour rester dans la même fente
      parts.rodC = { parent: 'torso', at: [0, 0], noRivet: true, seed: 1542, base: '#000', pts: OFFP, paint: null, extra: rodCExtra };
    } else {
      parts.rodC = { parent: 'torso', at: [0, 0], noRivet: true, seed: 1542, base: '#000', pts: OFFP, paint: null, extra: () => {} };
    }
    return parts;
  }
  // seconde tige en bois (croupe), tracée en repère écran jusqu'à la fente pose.slot
  function rodCExtra(p) {
    const c = cx_(), T = c.getTransform(), sc = Math.hypot(T.a, T.b), dir = T.a < 0 ? -1 : 1;
    const at = p.rodCAt || [-38, -50], pt = new DOMPoint(at[0], at[1]).matrixTransform(T);
    const slot = p.slot != null ? p.slot : M.ST.slotF, ang = Math.atan2(-T.c, T.d) - 0.07 * dir;
    const dx = Math.sin(ang), dy = Math.cos(ang); if (dy <= 0.05 || pt.y >= slot) return;
    const len = (slot - pt.y) / dy, w = 7.5 * Math.max(0.6, sc);
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.translate(pt.x, pt.y); c.rotate(-ang);
    if (M._sil()) { c.fillStyle = '#000'; c.fillRect(-w / 2, 0, w, len); c.restore(); return; }
    const gr = c.createLinearGradient(-w / 2, 0, w / 2, 0); gr.addColorStop(0, '#5b3d22'); gr.addColorStop(0.45, '#c8a06a'); gr.addColorStop(1, '#6e4a2a');
    c.fillStyle = gr; c.fillRect(-w / 2, 0, w, len); c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(w / 2 - 1, 0, 1, len);
    c.restore(); c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    c.beginPath(); c.ellipse(pt.x + dx * len, slot, w * 1.6, 2.6, 0, 0, TAU); c.fillStyle = 'rgba(8,4,2,0.6)'; c.fill(); c.restore();
  }
  // encolure seule (variante tête) : repère = base de l'encolure (coupe) en (0,0), l'encolure monte vers le haut-droite
  const CWN_NECK = [[-96, 0, 1], [-70, -90], [-40, -190], [-6, -270], [34, -330], [92, -352], [128, -316], [136, -240], [130, -150], [112, -60], [110, 0, 1]];
  const CWN_HEAD_AT = [96, -318];
  const CWN_COLLAR_PTS = [[-60, -98, 1], [-20, -90], [40, -88], [114, -94, 1], [112, -68, 1], [40, -62], [-20, -64], [-64, -72, 1]];
  const CWN_COLLAR = [30, -64];
  function neckPaint() {
    for (const [a, b, c2] of [[[-60, -60], [-30, -170], [10, -250]], [[0, -20], [40, -140], [80, -240]], [[60, -10], [92, -120], [110, -220]]]) strokePts([a, b, c2], 'rgba(60,24,12,0.35)', 1.4);
    strokePts([[-20, -250], [20, -310], [80, -336]], 'rgba(214,150,110,0.5)', 1.8);
    hatch([[-100, -360], [140, -360], [140, 0], [-100, 0]], 1.25, 5, 0.14); hatch([[40, -360], [140, -360], [140, 0], [40, 0]], 1.0, 4.4, 0.2);
    shade(-100, 0, 140, 0, 0.2, [-110, -370, 150, 4]); shade(0, -360, 0, 0, 0.2, [-110, -370, 150, 4]);
  }
  CH.vache = { hipY: -210, parts: cowSpec({}), handLen: 80, rod: { part: 'torso', at: [193, -10] },
    order: ['rodC', 'legFF_lo', 'legFF_up', 'legRF_lo', 'legRF_up', 'pis', 'queue', 'torso', 'legRN_lo', 'legRN_up', 'legFN_lo', 'legFN_up', 'collier', 'cl_boucle', 'cl_cloche', 'jaw', 'earF', 'hornF', 'head', 'hornN', 'earN'] };
  CH.vacheTete = { hipY: 0, parts: cowSpec({ neckOnly: true }), handLen: 80, rod: { part: 'torso', at: [20, -60] },
    order: ['rodC', 'torso', 'collier', 'cl_boucle', 'cl_cloche', 'jaw', 'earF', 'hornF', 'head', 'hornN', 'earN'] };
  // un appel qui ajoute pose.slot (2e tige dans la même fente) ; o = options de M.puppet
  REB.vache = function (pose, x, y, s, o) {
    o = o || {}; const slot = o.slot != null ? o.slot : M.ST.slotF;
    return M.puppet(CH.vache, Object.assign({ slot }, pose), x, y, s == null ? 1 : s, Object.assign({ slot }, o));
  };
  REB.vacheTete = function (pose, x, y, s, o) {
    o = o || {}; const slot = o.slot != null ? o.slot : M.ST.slotB;
    return M.puppet(CH.vacheTete, Object.assign({ slot }, pose), x, y, s == null ? 1 : s, Object.assign({ slot }, o));
  };

  // =====================================================================
  // DÉCORS (carton peint découpé) — fabriqués UNE fois par REB.init() (à appeler dans S.init, après M.init) ; résultat : REB.K
  //   K.aravis('aube'|'couchant') : toile de fond (W × ST.back+5) ; K.prairie : ferme basse ; K.sapinL / K.sapinR : coulisses-sapins (≈ makeTreeWing)
  //   K.colline + K.collineCrete (+ REB.cheminPt) ; K.cuisine.{fond, montagnes, montagnesChaud, rebord, volets} ; K.table ; K.tableBois ; K.chalet ; K.chateau + K.chateauBalcon
  // Toutes les flats ont leur origine au bas-centre (M.flat) et une ombre portée (M.withShadow).
  // =====================================================================
  const ST = M.ST, W = M.W;
  function jitterRidge(seed, x0, x1, step, y0, amp, sharp) {
    const R = rng(seed), pts = []; let ph = R() * 10;
    for (let x = x0; x <= x1; x += step) {
      const n = Math.sin(x * 0.0061 + ph) * 0.45 + Math.sin(x * 0.0143 + ph * 2) * 0.3 + Math.sin(x * 0.031 + ph * 3) * 0.18 + (R() - 0.5) * 0.3 * sharp;
      pts.push([x, y0 - amp * (0.5 + n)]);
    }
    return pts;
  }
  function mountainLayer(x, o) {
    const ridge = jitterRidge(o.seed, o.x0, o.x1, o.step || 54, o.y0, o.amp, o.sharp == null ? 1 : o.sharp);
    const poly = [[o.x0 - 20, o.yb, 1]].concat(ridge.map((p, i) => [p[0], p[1], (i % 2) ? 1 : 0]), [[o.x1 + 20, o.yb, 1]]);
    M.piece(poly, o.base, () => {
      hatch(null, 1.05, 6, o.hatchA || 0.16, 1, M.P.encre, [o.x0, o.y0 - o.amp * 1.2, o.x1, o.yb]);
      // faces à l'ombre (côté droit de chaque pic) en hachures plus serrées
      for (let i = 1; i < ridge.length - 1; i++) if (ridge[i][1] < ridge[i - 1][1] && ridge[i][1] < ridge[i + 1][1]) {
        const p = ridge[i], n = ridge[i + 1];
        hatch([[p[0], p[1]], [n[0] + 6, n[1] + 4], [n[0] + 6, p[1] + 260], [p[0] + 4, p[1] + 260]], 1.0, 3.4, (o.hatchA || 0.16) * 1.9);
      }
      shade(0, o.y0 - o.amp, 0, o.yb, o.fade == null ? 0.18 : o.fade, [o.x0, o.y0 - o.amp * 1.3, o.x1, o.yb], o.fadeCol || '60,70,90');
    }, { seed: o.seed, edge: o.edge });
    if (o.snow) {
      for (let i = 1; i < ridge.length - 1; i++) {
        const p = ridge[i];
        if (!(p[1] < ridge[i - 1][1] && p[1] < ridge[i + 1][1]) || p[1] > o.y0 - o.amp * 0.55) continue;
        const d = 54 + 40 * hash(i + o.seed), l = ridge[i - 1], r = ridge[i + 1];
        const lx = lerp(p[0], l[0], 0.55), ly = lerp(p[1], l[1], 0.55) + d * 0.3, rx = lerp(p[0], r[0], 0.55), ry = lerp(p[1], r[1], 0.55) + d * 0.3;
        const cap = [[lx, ly, 1], [p[0] - 4, p[1] + 2, 1], [p[0] + 3, p[1] + 1, 1], [rx, ry, 1], [rx - 10, ry + d * 0.4, 1], [p[0] + 14, p[1] + d * 0.7 + 8, 1], [p[0] + 2, p[1] + d * 0.45, 1], [p[0] - 14, p[1] + d * 0.8 + 6, 1], [lx + 8, ly + d * 0.35, 1]];
        M.piece(cap, '#EEE9DC', () => { hatch(null, 1.0, 4.4, 0.16, 1, '70,80,110', [lx, p[1], rx, p[1] + d]); }, { seed: o.seed + i, drop: false });
      }
    }
  }
  function makeAravis(kind) {
    const warm = kind === 'couchant';
    const sky = M.makeSky(kind);
    return M.pre(W, ST.back + 5, (x) => {
      x.drawImage(sky, 0, 0);
      const cols = warm ? ['#8f7a8a', '#755f74', '#5a4a62'] : ['#a3b1c2', '#7f92a8', '#5e7189'];
      mountainLayer(x, { seed: 31, x0: -40, x1: W + 40, y0: 880, amp: 330, yb: ST.back + 6, base: cols[0], snow: true, hatchA: 0.12, fade: 0.1, fadeCol: warm ? '90,50,60' : '80,90,110' });
      mountainLayer(x, { seed: 52, x0: -40, x1: W + 40, y0: 1010, amp: 360, yb: ST.back + 6, base: cols[1], snow: true, hatchA: 0.16, fade: 0.2, step: 40, sharp: 2.4, fadeCol: warm ? '80,40,50' : '50,64,90' });
      mountainLayer(x, { seed: 73, x0: -40, x1: W + 40, y0: 1150, amp: 250, yb: ST.back + 6, base: cols[2], snow: false, hatchA: 0.2, fade: 0.28, step: 70, fadeCol: warm ? '60,30,40' : '40,52,76' });
      // nuages posés sur les crêtes
      x.globalCompositeOperation = 'multiply'; x.fillStyle = M.tex.canvasPat; x.globalAlpha = 0.55; x.fillRect(0, 0, W, ST.back + 5); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
    });
  }
  // montagnes vues par la fenêtre de la cuisine (plus petites, plus pâles) ; warm = lumière dorée
  function makeFenetreMontagnes(warm) {
    return M.pre(W, ST.back + 5, (x) => {
      const g = x.createLinearGradient(0, 640, 0, 1200);
      if (warm) { g.addColorStop(0, '#E9C98F'); g.addColorStop(0.55, '#F2DDB0'); g.addColorStop(1, '#E9D5A6'); } else { g.addColorStop(0, '#8FA3B6'); g.addColorStop(0.55, '#BCC6C8'); g.addColorStop(1, '#D2D0B8'); }
      x.fillStyle = g; x.fillRect(0, 0, W, ST.back + 5);
      const cols = warm ? ['#C9A98A', '#A98E78', '#7E8458'] : ['#8DA0B4', '#6F8499', '#6C7C55'];
      mountainLayer(x, { seed: 91, x0: 120, x1: 760, y0: 960, amp: 250, yb: 1260, base: cols[0], snow: true, hatchA: 0.1, step: 40, fade: 0.1, edge: 'rgba(0,0,0,0)' });
      mountainLayer(x, { seed: 92, x0: 120, x1: 760, y0: 1080, amp: 190, yb: 1260, base: cols[1], snow: true, hatchA: 0.14, step: 44, fade: 0.2, edge: 'rgba(0,0,0,0)' });
      // prairie au pied
      M.piece([[100, 1260, 1], [100, 1140], [260, 1118], [420, 1128], [600, 1110], [780, 1130], [780, 1260, 1]], cols[2], () => { hatch(null, 0.2, 5, 0.2, 1, M.P.encre, [100, 1100, 780, 1260]); }, { seed: 93, edge: 'rgba(0,0,0,0)', drop: false });
      if (warm) { x.globalCompositeOperation = 'screen'; x.fillStyle = 'rgba(255,200,110,0.22)'; x.fillRect(0, 600, W, 700); x.globalCompositeOperation = 'source-over'; }
    });
  }

  // ---- ferme basse de prairie (collines, sapins minuscules, clôture)
  function makePrairie() {
    const w = W + 80, h = 340;
    return M.withShadow(M.cutFlat(w, h, w / 2, h - 6, (x) => {
      const R = rng(61);
      const far = [[-560, 0, 1], [-560, -90]]; for (let i = -10; i <= 10; i++) far.push([i * 60, -120 - 26 * Math.sin(i * 0.8) - 14 * Math.sin(i * 2.1)]); far.push([560, -80], [560, 0, 1]);
      M.piece(far, '#8c9a62', () => { hatch(null, 0.25, 5, 0.18, 1, M.P.encre, [-560, -180, 560, 0]); shade(0, -160, 0, 0, 0.12, [-560, -180, 560, 0], '60,70,40'); }, { seed: 61 });
      // sapins lointains
      for (let i = 0; i < 14; i++) { const tx = -520 + i * 78 + R() * 40, ty = -96 - 20 * Math.sin(tx * 0.013) - R() * 16, hh = 40 + R() * 30;
        M.piece([[tx, ty - hh, 1], [tx + 14, ty - hh * 0.4, 1], [tx + 8, ty - hh * 0.4, 1], [tx + 18, ty, 1], [tx - 18, ty, 1], [tx - 8, ty - hh * 0.4, 1], [tx - 14, ty - hh * 0.4, 1]], '#3e5a40', () => hatch(null, 0.9, 3.4, 0.3), { seed: 70 + i, drop: false }); }
      const near = [[-560, 0, 1], [-560, -40]]; for (let i = -10; i <= 10; i++) near.push([i * 60, -60 - 20 * Math.sin(i * 1.1 + 1) - 10 * Math.sin(i * 2.7)]); near.push([560, -34], [560, 0, 1]);
      M.piece(near, '#74834f', () => { hatch(null, 0.15, 5, 0.2, 1, M.P.encre, [-560, -100, 560, 0]); for (let i = 0; i < 30; i++) { const fx = -540 + R() * 1080, fy = -50 + R() * 40; M.dot(fx, fy, 2.6, R() < 0.5 ? '#E9DFC2' : '#C9A4A0'); } }, { seed: 62 });
      // clôture de piquets
      for (let i = 0; i < 14; i++) { const fx = -300 + i * 36, fy = -52 - 10 * Math.sin(fx * 0.01); M.piece([[fx - 3, fy, 1], [fx + 3, fy, 1], [fx + 3, fy - 34, 1], [fx, fy - 40, 1], [fx - 3, fy - 34, 1]], '#8C6038', () => hatch(null, 1.4, 3, 0.3), { seed: 80 + i, drop: false, edge: 'rgba(0,0,0,0)' }); }
      M.piece([[-306, -76, 1], [200, -86, 1], [200, -80, 1], [-306, -70, 1]], '#7a5330', null, { seed: 99, drop: false, edge: 'rgba(0,0,0,0)' });
    }), 6);
  }

  // ---- coulisses-sapins (≈ makeTreeWing) : 300 × 1300, origine bas-centre
  function makeSapinWing(seed, flip) {
    const cv = M.cutFlat(320, 1300, 160, 1290, (x) => {
      if (flip) x.scale(-1, 1);
      const R = rng(seed);
      M.piece([[-14, 0], [-11, -260], [-8, -1000], [8, -1000], [11, -260], [14, 0]], '#4a3626', () => hatch(null, 0.15, 3.5, 0.3), { seed });
      const tiers = 8;
      for (let k = 0; k < tiers; k++) {
        const u = k / (tiers - 1), yb = -70 - k * 140, w = lerp(150, 46, u) * (0.94 + 0.1 * R()), h = lerp(260, 170, u);
        const hem = [];                                      // ourlet déchiqueté, de droite à gauche
        for (let s = 0; s <= 8; s++) { const t = 1 - s / 8; hem.push([w * (2 * t - 1) * 1, yb + (s % 2 ? -14 : 8) + (R() - 0.5) * 6, 1]); }
        // sens : sommet → flanc droit → ourlet (droite→gauche) → flanc gauche
        const poly = [[0, yb - h, 1], [w * 0.5, yb - h * 0.5, 1], [w * 0.62, yb - h * 0.3, 1]].concat(hem.map((p) => [p[0], p[1], 1]), [[-w * 0.62, yb - h * 0.3, 1], [-w * 0.5, yb - h * 0.5, 1]]);
        M.piece(poly, k % 2 ? '#34503c' : '#2d4635', () => {
          hatch(null, 0.85, 3.6, 0.4); shade(w, 0, -w * 0.4, 0, 0.3, [-w - 4, yb - h, w + 4, yb + 20]);
          for (let j = 0; j < 9; j++) { const bx = (R() - 0.5) * w * 1.5, by = yb - R() * h * 0.5; M.strokePts([[bx, by], [bx + (bx > 0 ? 18 : -18), by + 26]], 'rgba(8,22,10,0.45)', 1.4); }
          M.strokePts([[0, yb - h + 10], [0, yb - 10]], 'rgba(8,22,10,0.35)', 1.4);
        }, { seed: seed + k });
      }
    });
    return M.withShadow(cv, 8);
  }

  // ---- colline avec chemin (plan 4) : K.colline (fond, avec le chemin) + K.collineCrete (premier plan, cache la fin du chemin)
  const CHEMIN = [[-520, -22], [-420, -48], [-300, -66], [-200, -98], [-80, -148], [20, -178], [120, -214], [200, -236]];
  REB.CHEMIN = CHEMIN;
  // point du chemin à l'abscisse curviligne u 0..1 (repère de la flat colline : origine bas-centre) → position écran si (x0,y0) = pose de la flat
  REB.cheminPt = function (u, x0, y0) {
    u = clamp(u); const n = CHEMIN.length - 1, f = u * n, i = Math.min(n - 1, Math.floor(f)), t = f - i;
    return [x0 + lerp(CHEMIN[i][0], CHEMIN[i + 1][0], t), y0 + lerp(CHEMIN[i][1], CHEMIN[i + 1][1], t)];
  };
  function makeColline() {
    const w = W + 40, h = 420, ox = w / 2, oy = h - 6;
    const back = M.cutFlat(w, h, ox, oy, (x) => {
      const far = [[-560, 0, 1], [-560, -120], [-420, -160], [-280, -150], [-120, -210], [60, -250], [180, -262], [300, -250], [450, -210], [560, -170], [560, 0, 1]];
      M.piece(far, '#82905C', () => {
        hatch(null, 0.25, 5, 0.18, 1, M.P.encre, [-560, -280, 560, 0]); shade(0, -270, 0, 0, 0.14, [-560, -280, 560, 0], '60,70,40');
        // chemin : ruban ocre qui monte en lacets, plus étroit en s'éloignant
        const L = [], Rr = []; CHEMIN.forEach((p, i) => { const wd = lerp(34, 12, i / (CHEMIN.length - 1)); L.push([p[0], p[1] - wd * 0.35]); Rr.push([p[0], p[1] + wd * 0.35]); });
        const path = L.concat(Rr.reverse());
        M.fillPts(path, 'rgba(60,36,14,0.35)', 3, 0.3); M.fillPts(path.map((q) => [q[0], q[1] - 2]), '#CDAA6E', 4, 0.3);
        M.strokePts(L, 'rgba(255,238,190,0.55)', 1.6);
      }, { seed: 111 });
      // quelques sapins sur la colline
      const R = rng(112);
      for (const tx of [-470, -380, -250, -140, 40, 120, 250, 330, 400, 470]) { const ty = -34 - (tx > -300 ? Math.min(180, (tx + 300) * 0.3) : 0) - R() * 20, hh = 54 + R() * 30;
        if (Math.abs(ty - (-100)) < 0) continue;
        M.piece([[tx, ty - hh, 1], [tx + 16, ty - hh * 0.4, 1], [tx + 9, ty - hh * 0.4, 1], [tx + 20, ty, 1], [tx - 20, ty, 1], [tx - 9, ty - hh * 0.4, 1], [tx - 16, ty - hh * 0.4, 1]], '#3e5a40', () => hatch(null, 0.9, 3.4, 0.3), { seed: tx + 600, drop: false }); }
    });
    const crete = M.cutFlat(w, h, ox, oy, (x) => {
      const near = [[40, 0, 1], [90, -150], [190, -248], [300, -268], [420, -228], [560, -178], [560, 0, 1]];
      M.piece(near, '#687a47', () => { hatch(null, 0.15, 5, 0.22, 1, M.P.encre, [0, -290, 560, 0]); shade(0, -280, 0, 0, 0.16, [0, -290, 560, 0], '50,60,30');
        const R = rng(115); for (let i = 0; i < 40; i++) { const fx = 100 + R() * 450, fy = -R() * 200; M.dot(fx, fy, 2.4, R() < 0.5 ? '#E9DFC2' : '#C9A4A0'); } }, { seed: 113 });
    });
    return { back: M.withShadow(back, 6), crete: M.withShadow(crete, 6) };
  }

  // ---- CUISINE : toile de fond mur ivoire avec fenêtre ouverte découpée (REB.FEN), montagnes derrière, rebord, table à nappe à carreaux, portrait pendu
  const FEN = { x0: 230, x1: 610, y0: 700, y1: 1160 };
  REB.FEN = FEN;
  function makeCuisineFond() {
    return M.pre(W, ST.back + 5, (x) => {
      const R = rng(201);
      const g = x.createLinearGradient(0, 0, 0, ST.back); g.addColorStop(0, '#D6C9A6'); g.addColorStop(0.45, '#E8DDBF'); g.addColorStop(1, '#E4D7B5');
      x.fillStyle = g; x.fillRect(0, 0, W, ST.back + 5);
      for (let i = 0; i < 240; i++) { const cx = R() * W, cy = R() * ST.back, l = 50 + R() * 170; x.strokeStyle = `rgba(${R() < 0.5 ? '255,248,228' : '120,96,60'},${0.04 + R() * 0.05})`; x.lineWidth = 8 + R() * 22; x.lineCap = 'round'; x.beginPath(); x.moveTo(cx, cy); x.quadraticCurveTo(cx + l / 2, cy + (R() - 0.5) * 16, cx + l, cy + (R() - 0.5) * 10); x.stroke(); }
      // taches d'enduit, fissures fines
      for (let i = 0; i < 26; i++) { const cx = R() * W, cy = 300 + R() * 900; x.fillStyle = `rgba(150,120,80,${0.04 + R() * 0.05})`; x.beginPath(); x.ellipse(cx, cy, 30 + R() * 60, 14 + R() * 30, R() * 3, 0, TAU); x.fill(); }
      // poutres du plafond (haut, caché par le lambrequin) et plinthe
      x.fillStyle = '#6a4428'; x.fillRect(0, 150, W, 70); x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(0, 214, W, 8);
      // lambris bas : planches verticales brunes
      const LY = 1250; x.fillStyle = '#8C6038'; x.fillRect(0, LY, W, ST.back + 5 - LY);
      for (let px = 0; px < W; px += 54) { x.fillStyle = (px / 54) % 2 ? 'rgba(0,0,0,0.12)' : 'rgba(255,230,180,0.06)'; x.fillRect(px, LY, 54, ST.back - LY); x.fillStyle = 'rgba(20,10,4,0.5)'; x.fillRect(px, LY, 2, ST.back - LY); }
      x.fillStyle = '#A97A48'; x.fillRect(0, LY - 14, W, 16); x.fillStyle = 'rgba(0,0,0,0.3)'; x.fillRect(0, LY + 2, W, 4);
      // étagère à pots (gauche), batterie de casseroles (droite) : petits, hors zones d'action
      const shelf = (sx, sy, w) => { x.fillStyle = '#6a4428'; x.fillRect(sx, sy, w, 14); x.fillStyle = 'rgba(0,0,0,0.3)'; x.fillRect(sx, sy + 14, w, 6); for (const bx of [sx + 14, sx + w - 26]) { x.fillStyle = '#5a3a20'; x.beginPath(); x.moveTo(bx, sy + 14); x.lineTo(bx + 10, sy + 14); x.lineTo(bx, sy + 50); x.closePath(); x.fill(); } };
      shelf(60, 560, 170);
      for (const [px, py, pw, ph, col] of [[84, 560, 40, 56, '#B4623F'], [134, 560, 34, 40, '#BBA98A'], [178, 560, 36, 62, '#8E7C60']]) { x.fillStyle = col; x.beginPath(); x.moveTo(px, py); x.lineTo(px + pw, py); x.lineTo(px + pw - 4, py - ph); x.lineTo(px + 4, py - ph); x.closePath(); x.fill(); x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(px + pw * 0.62, py - ph, pw * 0.38, ph); x.strokeStyle = 'rgba(30,16,8,0.6)'; x.lineWidth = 1.5; x.stroke(); }
      x.strokeStyle = '#5a3a20'; x.lineWidth = 4; x.beginPath(); x.moveTo(690, 290); x.lineTo(990, 290); x.stroke();
      for (const [px, py, r, col] of [[730, 290, 34, '#B9792F'], [810, 290, 28, '#A66A2A'], [880, 290, 38, '#C28A3E'], [950, 290, 26, '#A66A2A']]) { x.fillStyle = '#4a3020'; x.fillRect(px - 2, py, 4, 30); x.beginPath(); x.arc(px, py + 30 + r, r, 0, TAU); x.fillStyle = col; x.fill(); x.strokeStyle = 'rgba(40,20,5,0.7)'; x.lineWidth = 2; x.stroke(); x.beginPath(); x.arc(px - r * 0.3, py + 30 + r - r * 0.25, r * 0.3, PI, PI * 1.6); x.strokeStyle = 'rgba(255,240,200,0.6)'; x.lineWidth = 3; x.stroke(); x.beginPath(); x.arc(px, py + 30 + r, r * 0.6, 0, TAU); x.fillStyle = 'rgba(60,30,10,0.25)'; x.fill(); }
      // volets de bois (ouverts à plat contre le mur)
      for (const [vx, vw] of [[FEN.x0 - 122, 110], [FEN.x1 + 12, 110]]) {
        x.fillStyle = '#6F826A'; x.fillRect(vx, FEN.y0 - 20, vw, FEN.y1 - FEN.y0 + 40); x.strokeStyle = 'rgba(20,30,20,0.7)'; x.lineWidth = 2.5; x.strokeRect(vx, FEN.y0 - 20, vw, FEN.y1 - FEN.y0 + 40);
        for (let sy = FEN.y0 - 6; sy < FEN.y1 + 14; sy += 22) { x.fillStyle = 'rgba(0,0,0,0.18)'; x.fillRect(vx + 8, sy + 12, vw - 16, 4); x.fillStyle = 'rgba(255,255,230,0.12)'; x.fillRect(vx + 8, sy + 8, vw - 16, 3); }
        x.fillStyle = '#4e5e4a'; x.fillRect(vx, FEN.y0 + 40, vw, 14); x.fillRect(vx, FEN.y1 - 54, vw, 14);
      }
      // cadre de la fenêtre (bois) puis ouverture découpée
      const fw = 30; x.fillStyle = '#7A5030'; x.fillRect(FEN.x0 - fw, FEN.y0 - fw, FEN.x1 - FEN.x0 + 2 * fw, FEN.y1 - FEN.y0 + 2 * fw);
      x.strokeStyle = 'rgba(30,14,4,0.7)'; x.lineWidth = 3; x.strokeRect(FEN.x0 - fw, FEN.y0 - fw, FEN.x1 - FEN.x0 + 2 * fw, FEN.y1 - FEN.y0 + 2 * fw);
      x.fillStyle = 'rgba(255,225,170,0.18)'; x.fillRect(FEN.x0 - fw, FEN.y0 - fw, FEN.x1 - FEN.x0 + 2 * fw, 8);
      for (let i = 0; i < 40; i++) { const gy = FEN.y0 - fw + R() * (FEN.y1 - FEN.y0 + 2 * fw); x.strokeStyle = 'rgba(40,18,6,0.35)'; x.lineWidth = 1; x.beginPath(); x.moveTo(FEN.x0 - fw, gy); x.lineTo(FEN.x1 + fw, gy + (R() - 0.5) * 6); x.stroke(); }
      x.globalCompositeOperation = 'multiply'; x.fillStyle = M.tex.canvasPat; x.globalAlpha = 0.6; x.fillRect(0, 0, W, ST.back + 5); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
      // lés de toile cousus (très discrets)
      for (let sx = 210; sx < W; sx += 330) { x.fillStyle = 'rgba(40,30,20,0.1)'; x.fillRect(sx, 0, 2, ST.back); }
      x.globalCompositeOperation = 'destination-out'; x.fillStyle = '#000'; x.fillRect(FEN.x0, FEN.y0, FEN.x1 - FEN.x0, FEN.y1 - FEN.y0); x.globalCompositeOperation = 'source-over';
      // embrasure : épaisseur du mur (haut et gauche plus sombres)
      let gr = x.createLinearGradient(0, FEN.y0, 0, FEN.y0 + 26); gr.addColorStop(0, 'rgba(60,40,20,0.65)'); gr.addColorStop(1, 'rgba(60,40,20,0)'); x.fillStyle = gr; x.fillRect(FEN.x0, FEN.y0, FEN.x1 - FEN.x0, 26);
      gr = x.createLinearGradient(FEN.x0, 0, FEN.x0 + 20, 0); gr.addColorStop(0, 'rgba(60,40,20,0.55)'); gr.addColorStop(1, 'rgba(60,40,20,0)'); x.fillStyle = gr; x.fillRect(FEN.x0, FEN.y0, 20, FEN.y1 - FEN.y0);
    });
  }
  function makeRebord() {
    const w = FEN.x1 - FEN.x0 + 150, h = 80;
    return M.withShadow(M.cutFlat(w, h, w / 2, h - 4, (x) => {
      const hw = w / 2 - 6;
      M.piece([[-hw, -40, 1], [hw, -40, 1], [hw + 12, -26, 1], [hw + 12, 0, 1], [-hw - 12, 0, 1], [-hw - 12, -26, 1]], '#CFC3A6', () => { M.hatch(null, 0.1, 5, 0.18); x.fillStyle = 'rgba(255,250,235,0.35)'; x.fillRect(-hw - 20, -42, 2 * hw + 40, 8); M.shade(0, -40, 0, 0, 0.3, [-hw - 20, -42, hw + 20, 4]); for (let i = -6; i <= 6; i++) M.strokePts([[i * 50, -34], [i * 50 + 6, -2]], 'rgba(90,76,52,0.35)', 1.2); }, { seed: 205 });
      for (const sx of [-hw * 0.6, hw * 0.6]) M.piece([[sx - 24, 0, 1], [sx + 24, 0, 1], [sx + 10, 40, 1], [sx - 10, 40, 1]].map((p) => [p[0], p[1] + 0, 1]).reverse(), '#BDB192', () => M.hatch(null, 0.8, 4, 0.25), { seed: sx });
    }), 6);
  }
  // ---- TABLE praticable à nappe à carreaux (rouge sang éteint / ivoire), vue de face ; origine = bas-centre (le bas de la nappe touche le plancher)
  const TABLE = { w: 712, h: 352, standY: -334, halfW: 356 };
  REB.TABLE = TABLE;
  function makeTable() {
    const w = 800, h = 400;
    return M.withShadow(M.cutFlat(w, h, w / 2, h - 10, (x) => {
      const hw = 346, top = -TABLE.h;
      // plateau vu de dessus (ivoire à carreaux en perspective)
      const topPts = [[-hw, top, 1], [hw, top, 1], [hw + 14, top + 28, 1], [-hw - 14, top + 28, 1]];
      M.piece(topPts, '#EFE5CC', () => {
        const wf = (px, py, i, j) => px;
        for (let j = 0; j < 2; j++) for (let i = -12; i < 12; i++) if ((i + j) % 2 === 0) { const x0 = i * 30, y0 = top + j * 14; M.fillPts([[x0, y0, 1], [x0 + 30, y0, 1], [x0 + 30 + 2 * (j + 1) * (x0 > 0 ? 0.3 : -0.3), y0 + 14, 1], [x0 + 2 * (j) * (x0 > 0 ? 0.3 : -0.3), y0 + 14, 1]], 'rgba(142,47,43,0.78)', 1, 0); }
        M.hatch(null, 0.1, 6, 0.1); M.shade(0, top, 0, top + 28, 0.14, [-hw - 20, top - 4, hw + 20, top + 32]);
      }, { seed: 301 });
      // nappe pendante : carreaux, plis, ourlet festonné
      const hem = []; hem.push([-hw - 14, top + 28, 1]); for (let i = 0; i <= 14; i++) { const hx = -hw - 14 + i * (2 * hw + 28) / 14; hem.push([hx, -4 + (i % 2 ? 10 : 0) + 3 * Math.sin(i * 1.7), 1]); } hem.push([hw + 14, top + 28, 1]);
      M.piece(hem, '#EFE5CC', () => {
        const cs = 56;
        for (let j = 0; j < 7; j++) for (let i = -8; i < 8; i++) if ((i + j) % 2 === 0) x.fillRect(0, 0, 0, 0), M.fillPts([[i * cs, top + 28 + j * cs, 1], [i * cs + cs, top + 28 + j * cs, 1], [i * cs + cs, top + 28 + (j + 1) * cs, 1], [i * cs, top + 28 + (j + 1) * cs, 1]], 'rgba(142,47,43,0.8)', 2, 0);
        // plis verticaux (ombres douces) et lumière
        for (let k = -6; k <= 6; k++) { const fx = k * 56 + Math.sin(k * 2.1) * 8; const gr = x.createLinearGradient(fx - 22, 0, fx + 22, 0); gr.addColorStop(0, 'rgba(60,30,20,0)'); gr.addColorStop(0.5, k % 2 ? 'rgba(60,30,20,0.28)' : 'rgba(255,250,235,0.18)'); gr.addColorStop(1, 'rgba(60,30,20,0)'); x.fillStyle = gr; x.fillRect(fx - 22, top + 20, 44, TABLE.h); }
        M.hatch(null, 1.35, 6, 0.1); M.shade(0, top + 28, 0, 0, 0.22, [-hw - 20, top + 28, hw + 20, 8]);
      }, { seed: 302 });
      M.strokePts(topPts.concat([topPts[0]]).slice(0, 4), 'rgba(255,250,235,0.0)', 1);
    }), 8);
  }
  // table de bois rustique (plan 5) : plateau de planches sur tréteaux ; origine = bas-centre
  const TABLEBOIS = { w: 420, h: 250, standY: -240 };
  REB.TABLEBOIS = TABLEBOIS;
  function makeTableBois() {
    const w = 460, h = 280;
    return M.withShadow(M.cutFlat(w, h, w / 2, h - 8, (x) => {
      const hw = 200, top = -TABLEBOIS.h;
      for (const sd of [-1, 1]) {
        const leg = (a, b) => M.piece(a, '#6a4428', () => M.hatch(null, 1.4, 3.4, 0.3), { seed: b });
        leg([[sd * 150 - 12, top + 20], [sd * 150 + 12, top + 20], [sd * 190 + 12, 0, 1], [sd * 190 - 12, 0, 1]], sd + 400);
        leg([[sd * 150 - 12, top + 20], [sd * 150 + 12, top + 20], [sd * 116 + 10, 0, 1], [sd * 116 - 14, 0, 1]], sd + 410);
      }
      M.piece([[-170, top + 120, 1], [170, top + 120, 1], [170, top + 140, 1], [-170, top + 140, 1]], '#7a5330', () => M.hatch(null, 0.05, 3.4, 0.3), { seed: 421, drop: false });
      M.piece([[-hw, top, 1], [hw, top, 1], [hw + 4, top + 22, 1], [-hw - 4, top + 22, 1]], '#B58650', () => {
        for (let i = -5; i <= 5; i++) M.strokePts([[i * 40, top + 1], [i * 40 + 2, top + 21]], 'rgba(40,20,8,0.5)', 1.3);
        for (const gx of [-150, -60, 30, 120]) M.strokePts([[gx, top + 6], [gx + 50, top + 5], [gx + 90, top + 7]], 'rgba(80,45,15,0.45)', 1.1);
        M.hatch(null, 0.04, 3.6, 0.2); M.shade(0, top, 0, top + 22, 0.25, [-hw - 10, top - 2, hw + 10, top + 24]); }, { seed: 422 });
    }), 8);
  }

  // ---- PORTRAIT PENDU à deux fils, deux faces : flip 0 = grand-mère ancienne (chignon, châle) ; flip 1 = grand-mère années 80 (brushing, lunettes rondes, bandeau éponge)
  // REB.portrait(x, y, s, flip, t, o) : (x,y) = point d'accrochage au centre du haut du cadre ; flip 0..1 : le cadre pivote sur ses fils (cos) ; fils tracés jusqu'en haut
  const POR = { rx: 165, ry: 215, cy: 215 };
  function portraitArtA(c) {
    c.save(); cpath(ell(0, POR.cy, 128, 178, 36)); c.clip();
    c.fillStyle = lgrad(0, 40, 0, 400, [[0, '#55503a'], [0.6, '#3a3726'], [1, '#2a281c']]); c.fillRect(-140, 30, 280, 380);
    for (let i = 0; i < 18; i++) { const R = rng(500 + i); const px = -120 + R() * 240, py = 60 + R() * 330; cline([[px, py], [px + 18 + R() * 20, py + 10 + R() * 14], [px + 36 + R() * 20, py + 8]], 'rgba(20,16,8,0.22)', 1); }
    // châle sombre à franges et col de dentelle
    M.fillPts([[-120, 400], [-118, 322], [-84, 288], [-44, 270], [0, 266], [44, 270], [84, 288], [118, 322], [120, 400]], '#222d2a', 3, 0.6);
    for (let k = -5; k <= 5; k++) cline([[k * 20, 300], [k * 22, 400]], 'rgba(120,150,130,0.16)', 1.6);
    M.hatch([[-120, 280], [120, 280], [120, 400], [-120, 400]], 0.7, 4.4, 0.22);
    M.fillPts([[-58, 282], [-36, 262], [0, 252], [36, 262], [58, 282], [44, 314], [0, 330], [-44, 314]], '#EAE3D0', 4, 0.5);
    for (let k = -4; k <= 4; k++) { dot(k * 12, 318 - Math.abs(k) * 1.4 + 4, 4.4, '#EAE3D0'); }
    dot(0, 308, 7, Q.laiton); dot(0, 308, 3.6, '#8E2F2B'); dot(-2, 306, 1.4, 'rgba(255,255,255,0.8)');
    // cou et visage
    M.fillPts([[-22, 250], [22, 250], [26, 276], [0, 286], [-26, 276]], '#D6B590', 5, 0.4);
    M.fillPts(ell(0, 188, 54, 66, 22), '#E6C8A6', 6, 0.5);
    // cheveux gris, raie, chignon
    M.fillPts([[-58, 196], [-60, 150], [-48, 118], [-20, 104], [14, 104], [46, 120], [58, 152], [56, 196], [44, 160], [20, 138], [-6, 134], [-34, 142], [-48, 168]], '#BAB7AE', 7, 0.6);
    M.fillPts(ell(2, 94, 30, 24, 14), '#B2AFA6', 8, 0.5); for (let a = 0; a < 3; a++) cline(ep(2, 94, 8 + a * 7, 6 + a * 5, 10, 0.3 * a, PI * 1.6), 'rgba(80,80,76,0.55)', 1.2);
    for (let k = 0; k < 8; k++) cline([[-44 + k * 12, 128 + Math.abs(k - 3.5) * 3], [-50 + k * 13, 160]], 'rgba(90,90,84,0.4)', 1);
    cline([[0, 108], [-4, 140]], 'rgba(90,90,84,0.55)', 1.6);
    // visage : yeux, sourcils, nez, sourire, joues, rides
    for (const sx of [-20, 20]) { M.fillPts(ell(sx, 186, 7, 4.6, 8), '#F4EEDC', 0, 0); dot(sx, 186, 3.2, '#3a2a20'); dot(sx - 1, 184.6, 1, 'rgba(255,255,255,0.9)'); cline([[sx - 9, 183], [sx, 180], [sx + 9, 183]], 'rgba(60,50,40,0.9)', 1.6); cline([[sx - 10, 170], [sx, 166], [sx + 10, 169]], 'rgba(130,128,120,0.9)', 2); cline([[sx + sx / 20 * 10, 190], [sx + sx / 20 * 14, 196]], 'rgba(150,100,80,0.45)', 1); }
    cline([[0, 188], [-4, 206], [4, 210]], 'rgba(150,100,80,0.6)', 1.6);
    cline([[-22, 224], [0, 232], [22, 224]], 'rgba(150,60,60,0.95)', 2.4); cline([[-26, 220], [-22, 224]], 'rgba(150,100,80,0.6)', 1.2); cline([[26, 220], [22, 224]], 'rgba(150,100,80,0.6)', 1.2);
    dot(-30, 212, 9, 'rgba(210,120,110,0.4)'); dot(30, 212, 9, 'rgba(210,120,110,0.4)');
    M.hatch(ell(0, 188, 54, 66, 22), 0.9, 5, 0.12);
    // vernis : reflet diagonal
    c.globalCompositeOperation = 'screen'; c.fillStyle = lgrad(-120, 40, 40, 200, [[0, 'rgba(255,245,215,0.16)'], [1, 'rgba(255,245,215,0)']]); c.fillRect(-140, 30, 280, 380); c.globalCompositeOperation = 'source-over';
    c.restore();
  }
  function portraitArtB(c) {
    c.save(); cpath(ell(0, POR.cy, 128, 178, 36)); c.clip();
    c.fillStyle = lgrad(-100, 40, 100, 400, [[0, '#EBC2A6'], [1, '#D99E8A']]); c.fillRect(-140, 30, 280, 380);
    // fond « années 80 » : bandes et triangles assourdis
    M.fillPts([[-130, 90], [-40, 40], [-130, 40]], '#5F9C9A', 1, 0); M.fillPts([[130, 60], [70, 40], [130, 40]], '#C9A04A', 2, 0); M.fillPts([[130, 350], [60, 400], [130, 400]], '#9C84B2', 3, 0);
    for (let k = 0; k < 4; k++) cline([[-120 + k * 18, 340 + k * 10], [-100 + k * 18, 326 + k * 10], [-80 + k * 18, 340 + k * 10]], '#4F8C8A', 3);
    for (let k = 0; k < 3; k++) cline([[70 + k * 14, 110], [80 + k * 14, 100], [90 + k * 14, 110], [100 + k * 14, 100]], '#C26A5C', 2.6);
    // sweat à épaulettes : épaules carrées, chevrons colorés
    M.fillPts([[-124, 400], [-124, 306], [-96, 280], [-60, 276], [-30, 268], [30, 268], [60, 276], [96, 280], [124, 306], [124, 400]], '#3F8C8C', 4, 0.5);
    M.fillPts([[-124, 306], [-96, 280], [-74, 282], [-86, 322], [-124, 330]], '#2C6E70', 5, 0.3); M.fillPts([[124, 306], [96, 280], [74, 282], [86, 322], [124, 330]], '#2C6E70', 6, 0.3);
    for (const [y, col] of [[330, '#C9695B'], [352, '#D1A441'], [374, '#9C84B2']]) M.fillPts([[-124, y + 12], [-60, y - 8], [0, y + 12], [60, y - 8], [124, y + 12], [124, y + 26], [60, y + 6], [0, y + 26], [-60, y + 6], [-124, y + 26]], col, y, 0);
    M.fillPts([[-40, 268], [-22, 292], [0, 300], [22, 292], [40, 268], [26, 262], [-26, 262]], '#D2A888', 7, 0.4);       // grande encolure : peau
    M.hatch([[-124, 270], [124, 270], [124, 400], [-124, 400]], 0.8, 5, 0.12);
    // cou, visage, oreille
    M.fillPts(ell(0, 190, 52, 64, 22), '#EBC9A6', 8, 0.5);
    M.fillPts([[-20, 244], [20, 244], [24, 270], [-24, 270]], '#E2BC98', 9, 0.4);
    // brushing volumineux (gros nuage de cheveux) + mèches
    M.fillPts([[-96, 218], [-104, 160], [-92, 104], [-58, 66], [-14, 52], [34, 58], [76, 84], [102, 130], [100, 190], [84, 230], [66, 200], [52, 160], [20, 128], [-20, 124], [-50, 140], [-68, 180], [-72, 226]], '#A8714A', 10, 0.8);
    for (let k = 0; k < 9; k++) { const a = PI * (1.05 + k * 0.1); cline(ep(0, 150, 68 + (k % 3) * 8, 72 + (k % 3) * 6, 8, a, a + 0.5), 'rgba(222,174,122,0.7)', 2.4); }
    for (let k = 0; k < 8; k++) cline([[-80 + k * 22, 90 + (k % 2) * 16], [-76 + k * 22, 140]], 'rgba(60,30,10,0.32)', 1.3);
    // bandeau éponge (rayures turquoise / corail)
    M.fillPts([[-62, 152], [-48, 138], [0, 130], [48, 138], [64, 152], [62, 168], [48, 154], [0, 148], [-48, 154], [-60, 168]], '#4F9A9A', 11, 0.4);
    for (let k = -4; k <= 4; k++) cline([[k * 14, 132 + Math.abs(k) * 2.6], [k * 14 + 3, 160 + Math.abs(k) * 2]], k % 2 ? '#E4DCC6' : '#C9695B', 3.4);
    // visage
    for (const sx of [-26, 26]) { dot(sx, 190, 20, 'rgba(255,215,215,0.28)'); }
    M.fillPts([[-56, 188], [-52, 196], [-56, 218], [-60, 214]], '#E4BE9A', 12, 0.3);
    dot(-58, 224, 11, 'rgba(0,0,0,0)'); cline(ep(-60, 232, 9, 11, 12, 0, TAU), '#D1A441', 2.6); dot(-60, 222, 2.6, '#D1A441');   // boucle d'oreille
    // grosses lunettes rondes à monture épaisse
    for (const sx of [-27, 27]) { M.fillPts(ell(sx, 186, 26, 26, 18), 'rgba(222,196,214,0.4)', 0, 0); cline(ell(sx, 186, 26, 26, 20).concat([ell(sx, 186, 26, 26, 20)[0]]), '#7A3F52', 4.6); dot(sx, 188, 3.4, '#3a2a20'); dot(sx - 1, 186.6, 1.1, 'rgba(255,255,255,0.9)'); cline([[sx - 14, 178], [sx - 6, 172]], 'rgba(255,255,255,0.8)', 2); cline([[sx - 14, 168], [sx, 162], [sx + 14, 168]], 'rgba(110,60,40,0.85)', 2.6); }
    cline([[-3, 184], [3, 184]], '#7A3F52', 3.4); cline([[-54, 184], [-64, 180]], '#7A3F52', 3); cline([[54, 184], [62, 180]], '#7A3F52', 3);
    cline([[0, 196], [-3, 212], [4, 214]], 'rgba(150,100,80,0.6)', 1.6);
    // grand sourire avec dents
    M.fillPts([[-26, 224], [-12, 232], [0, 234], [12, 232], [26, 224], [18, 240], [0, 246], [-18, 240]], '#9C3A3A', 13, 0.3); M.fillPts([[-20, 227], [-8, 232], [8, 232], [20, 227], [14, 235], [0, 238], [-14, 235]], '#FBF6EA', 14, 0.3);
    cline([[-8, 233], [-8, 238]], 'rgba(150,130,110,0.5)', 1); cline([[0, 233], [0, 238]], 'rgba(150,130,110,0.5)', 1); cline([[8, 233], [8, 238]], 'rgba(150,130,110,0.5)', 1);
    dot(-36, 216, 8, 'rgba(210,100,100,0.4)'); dot(36, 216, 8, 'rgba(210,100,100,0.4)');
    c.globalCompositeOperation = 'screen'; c.fillStyle = lgrad(-120, 40, 40, 200, [[0, 'rgba(255,245,215,0.2)'], [1, 'rgba(255,245,215,0)']]); c.fillRect(-140, 30, 280, 380); c.globalCompositeOperation = 'source-over';
    c.restore();
  }
  CH.portrait = (function () {
    const sxf = (p) => Math.max(0.06, Math.abs(Math.cos(PI * clamp(p.flip || 0))));
    const parts = {
      cadre: { parent: null, at: [0, 0], noRivet: true, seed: 1601, base: '#C9A556',
        pts: (p) => scl(ell(0, POR.cy, POR.rx, POR.ry, 36), sxf(p), 1),
        paint: (p) => {
          const c = cx_(), sx = sxf(p), B = clamp(p.flip || 0) > 0.5;
          c.save(); c.scale(sx, 1);
          if (!B) {
            fillG(ell(0, POR.cy, POR.rx, POR.ry, 36), lgrad(-POR.rx, 40, POR.rx, 400, [[0, '#F0D88E'], [0.35, '#C9A556'], [0.7, '#8E6E2C'], [1, '#D9BD72']]));
            for (let i = 0; i < 40; i++) { const a = TAU * i / 40; dot(Math.cos(a) * (POR.rx - 12), POR.cy + Math.sin(a) * (POR.ry - 12), 3.6, i % 2 ? '#F3E3AE' : '#7A5A22'); }
            cline(ell(0, POR.cy, POR.rx - 26, POR.ry - 26, 36).concat([ell(0, POR.cy, POR.rx - 26, POR.ry - 26, 36)[0]]), 'rgba(70,45,10,0.7)', 2.4);
            cline(ell(0, POR.cy, 136, 186, 36).concat([ell(0, POR.cy, 136, 186, 36)[0]]), 'rgba(255,240,190,0.7)', 2);
            for (const a of [-PI / 2, PI / 2, 0, PI]) { const px = Math.cos(a) * (POR.rx - 12), py = POR.cy + Math.sin(a) * (POR.ry - 12); fillPts(ell(px, py, 12, 12, 10), '#F3E3AE', 0, 0); dot(px, py, 4.5, '#8E2F2B'); }
          } else {
            fillG(ell(0, POR.cy, POR.rx, POR.ry, 36), lgrad(-POR.rx, 40, POR.rx, 400, [[0, '#5FA3A0'], [0.5, '#3F8481'], [1, '#2C6362']]));
            cline(ell(0, POR.cy, POR.rx - 8, POR.ry - 8, 36).concat([ell(0, POR.cy, POR.rx - 8, POR.ry - 8, 36)[0]]), '#E9DFC6', 3);
            cline(ell(0, POR.cy, 140, 190, 36).concat([ell(0, POR.cy, 140, 190, 36)[0]]), '#C9695B', 4);
            cline(ell(0, POR.cy, 134, 184, 36).concat([ell(0, POR.cy, 134, 184, 36)[0]]), 'rgba(255,255,255,0.45)', 2);
          }
          hatch(ell(0, POR.cy, POR.rx, POR.ry, 36), 0.8, 5, 0.1);
          c.restore();
          c.save(); c.scale(sx, 1); if (!B) portraitArtA(c); else portraitArtB(c); c.restore();
          // reflet glissant sur le verre quand il pivote
          c.save(); c.scale(sx, 1); c.globalCompositeOperation = 'screen'; const fl = 1 - sx; c.fillStyle = lgrad(-150 + 300 * (p.flip || 0), 0, -90 + 300 * (p.flip || 0), 0, [[0, 'rgba(255,245,215,0)'], [0.5, `rgba(255,245,215,${0.35 * fl})`], [1, 'rgba(255,245,215,0)']]); c.fillRect(-170, 20, 340, 420); c.restore();
        } },
      clou: { parent: 'cadre', at: [0, 4], noRivet: true, seed: 1602, base: Q.laiton, pts: [[-8, -4], [8, -4], [9, 12], [0, 20, 1], [-9, 12]], paint: () => hatch(null, 0.6, 3, 0.3) },
    };
    return propDef(parts, ['cadre', 'clou']);
  })();
  REB.portrait = function (x, y, s, flip, t, o) {
    o = o || {}; const c = M.ctx(), sw = (o.swing != null ? o.swing : 0.012 * Math.sin((t || 0) * 1.1)), sx = Math.max(0.06, Math.abs(Math.cos(PI * clamp(flip || 0))));
    c.save(); c.strokeStyle = 'rgba(20,15,10,0.62)'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(x - 118 * s * sx, y + 84 * s); c.lineTo(x, y - 20); c.lineTo(x + 118 * s * sx, y + 84 * s);
    c.moveTo(x, y - 20); c.lineTo(x + Math.sin(sw) * 20, 0); c.stroke(); c.restore();
    c.save(); c.translate(x, y); c.rotate(sw); c.translate(-x, -y);
    const r = M.puppet(CH.portrait, { flip }, x, y, s == null ? 1 : s, Object.assign({ rod: false, floorShadow: false }, o)); c.restore(); return r;
  };

  // ---- CHALET D'ALPAGE : façade en planches #8C6038, soubassement de pierres, toit de bardeaux gris, fenêtre à volets rouge sang, porte ; origine bas-centre
  const CHALET = { w: 790, h: 850, porteX0: 72, porteX1: 204, porteTop: -478, porteBas: -75, seuilY: -38, seuilX0: 36, seuilX1: 235, fenX0: -204, fenX1: -74, fenY0: -478, fenY1: -310 };
  REB.CHALET = CHALET;
  function makeChalet() {
    const w = 800, h = 910;
    return M.withShadow(M.cutFlat(w, h, w / 2, h - 8, (x) => {
      x.scale(1.2, 1.45);
      const R = rng(701), wallTop = -380;
      // pignon (planches verticales plus claires)
      M.piece([[-236, wallTop, 1], [0, -534, 1], [236, wallTop, 1]], '#9B6D40', () => { for (let i = -6; i <= 6; i++) M.strokePts([[i * 38, -540], [i * 38, wallTop + 4]], 'rgba(40,20,8,0.5)', 1.4); M.hatch(null, 1.45, 4, 0.2); M.shade(240, 0, -240, 0, 0.18, [-240, -540, 240, wallTop + 10]); }, { seed: 702, drop: false });
      // mur : planches #8C6038, clous, grain
      M.piece([[-226, wallTop, 1], [226, wallTop, 1], [226, -56, 1], [-226, -56, 1]], '#8C6038', () => {
        for (let i = -8; i <= 8; i++) { const px = i * 28; M.strokePts([[px, wallTop - 2], [px + 1, -54]], 'rgba(30,14,4,0.55)', 1.5); for (let k = 0; k < 3; k++) { const gy = wallTop + R() * 320; M.strokePts([[px + 4, gy], [px + 6, gy + 40 + R() * 40]], 'rgba(60,30,10,0.35)', 1); } }
        for (const ny of [-340, -200, -90]) for (let i = -8; i <= 8; i++) M.dot(i * 28 + 14, ny, 1.3, 'rgba(255,225,170,0.45)');
        M.hatch(null, 1.45, 5, 0.16); M.shade(226, 0, -226, 0, 0.2, [-230, wallTop, 230, -50]); }, { seed: 703 });
      // soubassement de pierres
      M.piece([[-236, -56, 1], [236, -56, 1], [240, 0, 1], [-240, 0, 1]], '#BDB297', () => {
        for (let r = 0; r < 3; r++) { let sx = -250 + (r % 2) * 20; while (sx < 250) { const sw = 44 + R() * 36; x.strokeStyle = 'rgba(70,58,40,0.6)'; x.lineWidth = 1.6; x.strokeRect(sx, -56 + r * 19, sw, 19); x.fillStyle = `rgba(${R() < 0.5 ? '255,248,230' : '80,66,46'},${0.05 + R() * 0.1})`; x.fillRect(sx + 2, -54 + r * 19, sw - 4, 15); sx += sw; } }
        M.hatch(null, 0.15, 5, 0.14); }, { seed: 704 });
      // fenêtre à volets rouge sang ouverts
      M.piece([[-160, -330, 1], [-62, -330, 1], [-62, -214, 1], [-160, -214, 1]], '#2a2220', () => { x.fillStyle = 'rgba(255,214,140,0.22)'; x.fillRect(-160, -330, 98, 116); M.strokePts([[-111, -330], [-111, -214]], 'rgba(120,80,40,0.8)', 3); M.strokePts([[-160, -272], [-62, -272]], 'rgba(120,80,40,0.8)', 3); }, { seed: 705 });
      for (const [vx0, vx1] of [[-212, -166], [-56, -10]]) M.piece([[vx0, -336, 1], [vx1, -336, 1], [vx1, -208, 1], [vx0, -208, 1]], '#8E2F2B', () => { for (let sy = -330; sy < -208; sy += 14) M.strokePts([[vx0, sy], [vx1, sy + 2]], 'rgba(30,5,5,0.5)', 1.4); M.hatch(null, 1.45, 4, 0.22); M.strokePts([[vx0 + 4, -330], [vx1 - 4, -214]], 'rgba(30,5,5,0.35)', 1.2); }, { seed: vx0 + 800 });
      // jardinière fleurie sous la fenêtre
      M.piece([[-176, -208, 1], [-46, -208, 1], [-52, -178, 1], [-170, -178, 1]], '#6a4428', () => { M.hatch(null, 1.4, 3.4, 0.3); }, { seed: 706 });
      for (let i = 0; i < 12; i++) { const fx = -168 + i * 11, fy = -214 - 8 * Math.sin(i * 2.1); M.dot(fx, fy + 1.4, 7, 'rgba(20,10,5,0.35)'); M.dot(fx, fy, 6.4, i % 3 ? '#B33A34' : '#D77C73'); M.dot(fx - 1, fy - 1, 2, 'rgba(255,225,200,0.7)'); }
      for (let i = 0; i < 8; i++) M.strokePts([[-160 + i * 15, -206], [-164 + i * 15, -222]], '#3b5a38', 2.4);
      // porte à planches verticales, ferrures, seuil de pierre
      M.piece([[60, -330, 1], [170, -330, 1], [170, -56, 1], [60, -56, 1]], '#6a4428', () => { for (let i = 0; i < 4; i++) M.strokePts([[72 + i * 27, -330], [72 + i * 27, -56]], 'rgba(20,8,2,0.6)', 1.6); for (const hy of [-300, -110]) { x.fillStyle = '#2f2f33'; x.fillRect(60, hy, 76, 10); M.dot(140, hy + 5, 3, '#5b5b60'); } M.dot(150, -190, 5, Q.laiton); M.hatch(null, 1.45, 4, 0.26); M.shade(170, 0, 60, 0, 0.2, [56, -334, 174, -50]); }, { seed: 707 });
      M.piece([[40, -56, 1], [186, -56, 1], [196, -28, 1], [30, -28, 1]], '#CFC4A8', () => M.hatch(null, 0.1, 5, 0.2), { seed: 708 });
      // lucarne du grenier
      M.piece([[-36, -480, 1], [36, -480, 1], [36, -420, 1], [-36, -420, 1]], '#2a2220', () => { x.fillStyle = 'rgba(255,214,140,0.2)'; x.fillRect(-36, -480, 72, 60); M.strokePts([[0, -480], [0, -420]], 'rgba(120,80,40,0.8)', 2.4); }, { seed: 709 });
      M.piece([[-44, -488, 1], [44, -488, 1], [44, -412, 1], [-44, -412, 1]].map((p, i) => p), 'rgba(0,0,0,0)', null, { seed: 710, drop: false, edge: 'rgba(110,70,36,0.9)' });
      // toit de bardeaux gris : deux pans en bande autour du pignon, débord large
      const outer = [[-320, -362, 1], [0, -574, 1], [320, -362, 1], [300, -340, 1], [0, -540, 1], [-300, -340, 1]];
      M.piece([[-320, -364, 1], [0, -578, 1], [320, -364, 1], [302, -318, 1], [0, -516, 1], [-302, -318, 1]], '#77777c', () => {
        for (let r = 0; r < 6; r++) for (let i = -14; i <= 14; i++) { const ex = i * 24 + (r % 2) * 12; x.beginPath(); x.arc(ex, -330 - r * 34 + 20 * (1 - Math.abs(ex) / 320) * 0, 13, 0, PI); x.fillStyle = (i + r) % 2 ? '#6c6c71' : '#82828a'; x.fill(); x.strokeStyle = 'rgba(30,30,36,0.5)'; x.lineWidth = 1.2; x.stroke(); }
        M.hatch(null, 0.5, 4, 0.2); M.shade(0, -580, 0, -320, 0.2, [-330, -580, 330, -310]); }, { seed: 711 });
      // rives de toit (planches de rive) en bois sombre
      M.piece([[-324, -366, 1], [0, -584, 1], [8, -574, 1], [-312, -354, 1]], '#4a3020', () => M.hatch(null, 0.6, 3, 0.3), { seed: 712, drop: false });
      M.piece([[324, -366, 1], [0, -584, 1], [-8, -574, 1], [312, -354, 1]], '#4a3020', () => M.hatch(null, 0.6, 3, 0.3), { seed: 713, drop: false });
    }), 8);
  }

  // ---- CHÂTEAU SAVOYARD sur sa colline (+ balcon) : K.chateau (colline, tours rondes à toits coniques ardoise, donjon, porte-fenêtre) et K.chateauBalcon (balustrade, à poser APRÈS le seigneur)
  // origine = bas-centre de la colline ; le buste du seigneur se pose en (x + CHATEAU.bustX, y + CHATEAU.bustY) ; aucune ressemblance avec un monument connu, pas de drapeau
  const CHATEAU = { w: 860, h: 1160, bustX: 0, bustY: -300, balconW: 300, doorW: 190, doorTop: -640, topBal: -392 };
  REB.CHATEAU = CHATEAU;
  function stoneFace(x, x0, y0, x1, y1, seed, ch) {
    const R = rng(seed); ch = ch || 34;
    x.strokeStyle = 'rgba(95,80,58,0.55)'; x.lineWidth = 1.4; x.beginPath();
    for (let y = y1 - ch; y > y0; y -= ch) { x.moveTo(x0, y); x.lineTo(x1, y + (R() - 0.5) * 1.5); }
    let row = 0; for (let y = y1; y > y0; y -= ch, row++) { let xx = x0 + (row % 2) * 30 + R() * 20; while (xx < x1) { x.moveTo(xx, y); x.lineTo(xx, Math.max(y0, y - ch)); xx += 52 + R() * 36; } }
    x.stroke();
    for (let i = 0; i < ((x1 - x0) * (y1 - y0)) / 700; i++) { x.fillStyle = `rgba(${R() < 0.5 ? '255,250,232' : '90,74,52'},${R() * 0.14})`; x.fillRect(x0 + R() * (x1 - x0), y0 + R() * (y1 - y0), 2 + R() * 4, 1.5 + R() * 2.5); }
  }
  function slateCone(cx, yb, wd, hh, seed) {
    const pts = [[cx - wd, yb, 1], [cx - wd * 0.2, yb - hh * 0.92, 1], [cx, yb - hh, 1], [cx + wd * 0.2, yb - hh * 0.92, 1], [cx + wd, yb, 1]];
    for (let i = 0; i < 6; i++) pts.push([cx + wd - (i + 0.5) * wd * 2 / 6 + (i % 2 ? -4 : 4), yb + (i % 2 ? 6 : 0), 1]);
    M.piece(pts, Q.slate, () => {
      const x = M.ctx(); for (let r = 0; r < Math.floor(hh / 18); r++) { const y = yb - r * 18, ww = wd * (1 - r * 18 / hh); for (let i = -Math.ceil(ww / 14); i <= Math.ceil(ww / 14); i++) { x.beginPath(); x.arc(cx + i * 14 + (r % 2) * 7, y - 6, 8, 0, PI); x.strokeStyle = 'rgba(25,36,52,0.5)'; x.lineWidth = 1.2; x.stroke(); } }
      M.hatch(null, 1.2, 4, 0.2); M.shade(cx + wd, 0, cx - wd, 0, 0.35, [cx - wd - 6, yb - hh, cx + wd + 6, yb + 10]); }, { seed });
  }
  function roundTower(cx, yb, wd, hh, seed, roofH) {
    // fût cylindrique
    M.piece([[cx - wd, yb, 1], [cx + wd, yb, 1], [cx + wd, yb - hh, 1], [cx - wd, yb - hh, 1]], Q.pierre, () => {
      const x = M.ctx(); stoneFace(x, cx - wd, yb - hh, cx + wd, yb, seed);
      const g = x.createLinearGradient(cx - wd, 0, cx + wd, 0); g.addColorStop(0, 'rgba(255,250,232,0.28)'); g.addColorStop(0.45, 'rgba(255,250,232,0)'); g.addColorStop(1, 'rgba(70,56,36,0.45)'); x.fillStyle = g; x.fillRect(cx - wd, yb - hh, 2 * wd, hh);
      M.hatch([[cx + wd * 0.2, yb - hh], [cx + wd, yb - hh], [cx + wd, yb], [cx + wd * 0.2, yb]], 1.0, 4.4, 0.2);
      // meurtrières
      for (const [ox, oy] of [[0, 0.62], [-wd * 0.45, 0.32]]) { M.fillPts([[cx + ox - 4, yb - hh * oy - 24], [cx + ox + 4, yb - hh * oy - 24], [cx + ox + 4, yb - hh * oy + 24], [cx + ox - 4, yb - hh * oy + 24]], '#1c1612', 0, 0); }
    }, { seed });
    // corniche + chemin de ronde saillant
    M.piece([[cx - wd - 14, yb - hh, 1], [cx + wd + 14, yb - hh, 1], [cx + wd + 14, yb - hh - 22, 1], [cx - wd - 14, yb - hh - 22, 1]], Q.pierreL, () => { const x = M.ctx(); for (let i = -wd; i <= wd; i += 18) { x.fillStyle = 'rgba(70,56,36,0.45)'; x.fillRect(cx + i, yb - hh - 4, 8, 4); } M.hatch(null, 0.1, 4, 0.2); }, { seed: seed + 3 });
    slateCone(cx, yb - hh - 22, wd + 18, roofH, seed + 5);
  }
  function makeChateau() {
    const w = CHATEAU.w, h = CHATEAU.h, ox = w / 2, oy = h - 10;
    const back = M.cutFlat(w, h, ox, oy, (x) => {
      const R = rng(801);
      // colline herbeuse
      M.piece([[-420, 0, 1], [-380, -50], [-300, -108], [-190, -150], [-80, -172], [0, -178], [120, -166], [250, -132], [340, -82], [410, -30], [430, 0, 1]], '#7C8B55', () => {
        M.hatch(null, 0.25, 5, 0.2, 1, M.P.encre, [-430, -190, 430, 0]); M.shade(0, -190, 0, 0, 0.16, [-430, -190, 430, 0], '50,64,30');
        for (let i = 0; i < 40; i++) M.dot(-400 + R() * 800, -R() * 110, 2.4, R() < 0.5 ? '#E9DFC2' : '#C9A4A0');
        // chemin sinueux jusqu'à la porte
        const L = [[-330, -14], [-220, -36], [-120, -62], [-50, -100], [-22, -140], [-14, -176]], pw = [30, 26, 22, 18, 14, 10], a = [], b = []; L.forEach((p, i) => { a.push([p[0], p[1] - pw[i] * 0.3]); b.push([p[0], p[1] + pw[i] * 0.3]); });
        M.fillPts(a.concat(b.reverse()), '#CDAA6E', 5, 0.3); }, { seed: 801 });
      // courtines (murs d'enceinte) et créneaux
      const wall = (x0, x1, yb, hh, sd) => { const pts = [[x0, yb, 1], [x1, yb, 1], [x1, yb - hh, 1]]; for (let i = Math.floor((x1 - x0) / 44); i >= 0; i--) { const mx = x0 + i * 44; pts.push([Math.min(mx + 30, x1), yb - hh, 1], [Math.min(mx + 30, x1), yb - hh - 26, 1], [mx + 4, yb - hh - 26, 1], [mx + 4, yb - hh, 1]); } pts.push([x0, yb - hh, 1]);
        M.piece(pts, Q.pierre, () => { stoneFace(x, x0, yb - hh - 28, x1, yb, sd); M.hatch([[x0 + (x1 - x0) * 0.6, yb - hh - 28], [x1, yb - hh - 28], [x1, yb], [x0 + (x1 - x0) * 0.6, yb]], 1.0, 4.4, 0.2); M.shade(x1, 0, x0, 0, 0.2, [x0, yb - hh - 28, x1, yb]); }, { seed: sd }); };
      wall(-300, -150, -138, 150, 811); wall(150, 320, -126, 160, 812);
      // donjon
      const kw = 175, ky0 = -150, ky1 = -840;
      M.piece([[-kw, ky0, 1], [kw, ky0, 1], [kw, ky1, 1], [-kw, ky1, 1]], Q.pierre, () => {
        stoneFace(x, -kw, ky1, kw, ky0, 813, 38); const g = x.createLinearGradient(-kw, 0, kw, 0); g.addColorStop(0, 'rgba(255,250,232,0.25)'); g.addColorStop(0.5, 'rgba(255,250,232,0)'); g.addColorStop(1, 'rgba(70,56,36,0.4)'); x.fillStyle = g; x.fillRect(-kw, ky1, 2 * kw, ky0 - ky1);
        M.hatch([[kw * 0.35, ky1], [kw, ky1], [kw, ky0], [kw * 0.35, ky0]], 1.0, 4.4, 0.2); M.shade(kw, 0, -kw, 0, 0.18, [-kw, ky1, kw, ky0]);
        // fenêtres hautes en arc, meurtrières
        for (const [wx, wy] of [[-84, -770], [84, -770], [0, -720]]) { M.fillPts([[wx - 14, wy + 36], [wx - 14, wy - 10], [wx - 8, wy - 24], [wx, wy - 28], [wx + 8, wy - 24], [wx + 14, wy - 10], [wx + 14, wy + 36]], '#241b17', 0, 0.3); M.strokePts([[wx - 18, wy + 38], [wx - 18, wy - 10], [wx - 10, wy - 28], [wx, wy - 33], [wx + 10, wy - 28], [wx + 18, wy - 10], [wx + 18, wy + 38]], 'rgba(255,250,232,0.5)', 2); }
      }, { seed: 813 });
      // mâchicoulis + toit pyramidal en ardoise
      M.piece([[-kw - 24, ky1, 1], [kw + 24, ky1, 1], [kw + 24, ky1 - 26, 1], [-kw - 24, ky1 - 26, 1]], Q.pierreL, () => { for (let i = -kw; i <= kw; i += 20) { M.fillPts([[i, ky1 - 2], [i + 10, ky1 - 2], [i + 8, ky1 + 12], [i + 2, ky1 + 12]], 'rgba(60,46,30,0.45)', 0, 0); } M.hatch(null, 0.1, 4, 0.2); }, { seed: 814 });
      slateCone(0, ky1 - 26, kw + 30, 250, 815);
      // tours rondes
      roundTower(-250, -146, 74, 480, 821, 190); roundTower(268, -132, 84, 430, 822, 200);
      // porte-fenêtre (arc) du balcon + intérieur chaud
      const dw = CHATEAU.doorW / 2, dtop = CHATEAU.doorTop, dfl = -306;
      M.piece([[-dw, dfl, 1], [-dw, dtop + 90], [-dw * 0.8, dtop + 30], [-dw * 0.4, dtop + 4], [0, dtop], [dw * 0.4, dtop + 4], [dw * 0.8, dtop + 30], [dw, dtop + 90], [dw, dfl, 1]], '#2a1e19', () => {
        const g = x.createLinearGradient(0, dtop, 0, dfl); g.addColorStop(0, 'rgba(255,196,110,0.12)'); g.addColorStop(1, 'rgba(255,196,110,0.4)'); x.fillStyle = g; x.fillRect(-dw, dtop, 2 * dw, dfl - dtop);
        // tenture de velours rouge au fond
        M.fillPts([[-dw, dfl], [-dw, dtop + 90], [-dw * 0.55, dtop + 120], [-dw * 0.5, dfl]], 'rgba(110,22,24,0.85)', 6, 0.3); M.fillPts([[dw, dfl], [dw, dtop + 90], [dw * 0.55, dtop + 120], [dw * 0.5, dfl]], 'rgba(110,22,24,0.85)', 7, 0.3);
        M.hatch(null, 1.2, 5, 0.12); }, { seed: 817, edge: 'rgba(250,240,215,0.7)' });
      for (const sg of [-1, 1]) for (const r of [dw + 12, dw + 26]) { x.beginPath(); x.moveTo(sg * r, dfl); x.lineTo(sg * r, dtop + 90); x.strokeStyle = r === dw + 12 ? Q.pierreL : 'rgba(90,76,52,0.5)'; x.lineWidth = r === dw + 12 ? 10 : 2; x.stroke(); }
      x.beginPath(); x.arc(0, dtop + 90, dw + 12, PI, TAU); x.strokeStyle = Q.pierreL; x.lineWidth = 10; x.stroke(); x.beginPath(); x.arc(0, dtop + 90, dw + 26, PI, TAU); x.strokeStyle = 'rgba(90,76,52,0.5)'; x.lineWidth = 2; x.stroke();
      // dalle du balcon + consoles de pierre en encorbellement
      const bw = CHATEAU.balconW / 2;
      for (const cxk of [-bw * 0.7, -bw * 0.25, bw * 0.25, bw * 0.7]) M.piece([[cxk - 22, -300, 1], [cxk + 22, -300, 1], [cxk + 22, -284, 1], [cxk + 12, -284, 1], [cxk + 12, -262, 1], [cxk - 12, -262, 1], [cxk - 12, -284, 1], [cxk - 22, -284, 1]], Q.pierreD, () => M.hatch(null, 0.8, 3.6, 0.25), { seed: cxk + 900, drop: false });
      M.piece([[-bw - 12, -306, 1], [bw + 12, -306, 1], [bw + 12, -300, 1], [bw + 12, -280, 1], [-bw - 12, -280, 1]], Q.pierreL, () => { M.hatch(null, 0.1, 4, 0.2); x.fillStyle = 'rgba(70,56,36,0.35)'; x.fillRect(-bw - 14, -296, 2 * bw + 28, 4); }, { seed: 818 });
    });
    // avant : balustrade de pierre (à poser après le seigneur) — alignée sur le même repère
    const front = M.cutFlat(w, h, ox, oy, (x) => {
      const bw = CHATEAU.balconW / 2, yt = CHATEAU.topBal, yb = -298;
      M.piece([[-bw - 20, yt, 1], [bw + 20, yt, 1], [bw + 20, yt + 20, 1], [-bw - 20, yt + 20, 1]], Q.pierreL, () => { M.hatch(null, 0.1, 4, 0.2); M.shade(0, yt, 0, yt + 20, 0.22, [-bw - 20, yt, bw + 20, yt + 20]); }, { seed: 831 });
      M.piece([[-bw - 14, yb, 1], [bw + 14, yb, 1], [bw + 14, yb - 14, 1], [-bw - 14, yb - 14, 1]], Q.pierreL, () => M.hatch(null, 0.1, 4, 0.2), { seed: 832 });
      for (let i = -6; i <= 6; i++) { const bx = i * (bw / 6.4); M.piece([[bx - 9, yb - 14, 1], [bx + 9, yb - 14, 1], [bx + 12, yb - 32], [bx + 7, yb - 46], [bx + 10, yb - 62], [bx, yb - 70, 1], [bx - 10, yb - 62], [bx - 7, yb - 46], [bx - 12, yb - 32]], Q.pierre, () => { M.hatch([[bx + 1, yb - 70], [bx + 12, yb - 70], [bx + 12, yb - 14], [bx + 1, yb - 14]], 1.0, 3.4, 0.28); }, { seed: 840 + i }); }
      for (const sg of [-1, 1]) M.piece([[sg * (bw + 26) - 14, yb, 1], [sg * (bw + 26) + 14, yb, 1], [sg * (bw + 26) + 14, yt - 28, 1], [sg * (bw + 26) - 14, yt - 28, 1]], Q.pierre, () => { M.hatch(null, 1.0, 3.6, 0.22); M.shade(14, 0, -14, 0, 0.2, [sg * (bw + 26) - 16, yt - 30, sg * (bw + 26) + 16, yb]); }, { seed: sg + 850 });
      for (const sg of [-1, 1]) M.piece(ell(sg * (bw + 26), yt - 38, 17, 12, 10), Q.pierreL, () => M.hatch(null, 0.6, 3.4, 0.2), { seed: sg + 860 });
    });
    return { back: M.withShadow(back, 10), front };
  }

  // =====================================================================
  // INIT : fabrique tous les décors. À appeler dans S.init (après M.init). Idempotent. Retourne REB.K
  // =====================================================================
  REB.init = function () {
    if (REB.K) return REB.K;
    const K = REB.K = {};
    K.aravis = { aube: makeAravis('aube'), couchant: makeAravis('couchant') };
    K.prairie = makePrairie(); K.sapinL = makeSapinWing(5, false); K.sapinR = makeSapinWing(9, true);
    const co = makeColline(); K.colline = co.back; K.collineCrete = co.crete;
    K.cuisine = { fond: makeCuisineFond(), montagnes: makeFenetreMontagnes(false), montagnesChaud: makeFenetreMontagnes(true), rebord: makeRebord() };
    K.table = makeTable(); K.tableBois = makeTableBois();
    K.chalet = makeChalet();
    const ch = makeChateau(); K.chateau = ch.back; K.chateauBalcon = ch.front;
    return K;
  };

  // =====================================================================
  // AIDES D'ANIMATION (fonctions pures de t) — pas indispensables, mais évitent de réécrire les cycles
  // =====================================================================
  // fusion de poses (les ang sont fusionnés, les autres champs écrasés) : REB.pose(a, b, …)
  REB.pose = function () {
    const out = { ang: {}, face: {}, hide: {} };
    for (const p of arguments) { if (!p) continue; for (const k in p) { if (k === 'ang' || k === 'face' || k === 'hide') Object.assign(out[k], p[k]); else out[k] = p[k]; } }
    return out;
  };
  // clin d'œil : valeur de paupière 0..1 — ferme en 0,12 s, tient `hold` s, rouvre en 0,18 s
  REB.wink = function (t, t0, hold) { hold = hold == null ? 0.6 : hold; const a = clamp((t - t0) / 0.12), b = clamp((t - t0 - 0.12 - hold) / 0.18); return ease(a) * (1 - ease(b)); };
  // tête tournée vers le public : tq 0..1 (t0 début, d durée)
  REB.tourne = function (t, t0, d) { return ease((t - t0) / (d || 0.5)); };
  // respiration / sautillement léger (px dans l'unité du personnage)
  REB.respire = (t, a) => Math.sin(t * 1.9) * 1.2 * (a == null ? 1 : a);
  // marche d'un humain (ph en cycles) : jambes à genou, bras qui balancent, petit sautillement ; pose partielle à fusionner
  REB.marche = function (ph, o) {
    o = o || {}; const A = o.amp == null ? 1 : o.amp, f = TAU * ph, s = Math.sin(f), c = Math.cos(f);
    return { dy: -Math.abs(c) * 4 * A, ang: {
      legF_up: -0.42 * s * A, legB_up: 0.42 * s * A, legF_lo: 0.85 * Math.max(0, c) * A, legB_lo: 0.85 * Math.max(0, -c) * A,
      armF_up: 0.35 * s * A * (o.arms == null ? 1 : o.arms), armB_up: -0.35 * s * A * (o.arms == null ? 1 : o.arms), armF_lo: -0.12 * A, armB_lo: -0.12 * A } };
  };
  // marche de la vache (ph en cycles) : séquence latérale des 4 pattes (genou avant : lo positif ; jarret arrière : lo négatif), tête qui dodeline
  REB.vacheMarche = function (ph, o) {
    o = o || {}; const A = o.amp == null ? 1 : o.amp;
    const leg = (p0, hind) => { const f = TAU * (ph + p0), s = Math.sin(f), c = Math.cos(f); return hind ? [-0.26 * s * A, -0.7 * Math.max(0, c) * A] : [-0.3 * s * A, 0.7 * Math.max(0, c) * A]; };
    const RN = leg(0, true), FN = leg(0.25, false), RF = leg(0.5, true), FF = leg(0.75, false);
    return { dy: -Math.abs(Math.sin(TAU * ph * 2)) * 3 * A, ang: {
      legRN_up: RN[0], legRN_lo: RN[1], legFN_up: FN[0], legFN_lo: FN[1], legRF_up: RF[0], legRF_lo: RF[1], legFF_up: FF[0], legFF_lo: FF[1],
      head: 0.05 * Math.sin(TAU * ph * 2 + 1), queue: 0.16 * Math.sin(TAU * ph + 1), clarine: 0.16 * Math.sin(TAU * ph * 2 + 2), earN: 0.06 * Math.sin(TAU * ph * 2) } };
  };
  // vache au repos : rumination, queue qui balance, oreille qui frémit, clarine, respiration — (o.clarine = amplitude, 0 = clarine immobile ; o.noChew)
  REB.vacheIdle = function (t, o) {
    o = o || {}; const fl = Math.max(0, Math.sin(t * 0.9 + 0.5)) ** 8;
    return { dy: Math.sin(t * 1.7) * 1.1, ang: {
      jaw: o.noChew ? 0 : 0.04 + 0.05 * Math.sin(t * 9.4), queue: 0.1 * Math.sin(t * 1.25) + 0.04 * Math.sin(t * 3.1),
      clarine: (o.clarine == null ? 0.07 : o.clarine) * Math.sin(t * 3.3), earN: 0.1 * Math.sin(t * 2.2 + 1) + 0.25 * fl, earF: 0.1 * Math.sin(t * 2.1), head: 0.02 * Math.sin(t * 1.1) } };
  };
  // position écran d'un trayon (i = 0..3) d'une vache déjà posée : r = valeur de retour de M.puppet / REB.vache
  REB.trayon = function (r, i) { const T = [[-30, 90], [-10, 94], [10, 94], [28, 88]]; return r.w('pis', T[i][0], T[i][1]); };

})();
