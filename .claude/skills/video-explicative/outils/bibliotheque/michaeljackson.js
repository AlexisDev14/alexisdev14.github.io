// michaeljackson.js (bibliothèque) — « Michael Jackson, le roi qui s'est couronné lui-même » : marionnettes, accessoires et décors PROPRES À CETTE VIDÉO.
// Espace M.mj (alias MJ). Appeler MJ.init() dans S.init. Mode d'emploi : persos.md (ne pas lire ce fichier en entier).
// Aucun texte, lettre, chiffre ni logo. Déterministe (hash, jamais Math.random) : fonction pure de t.
// INDEX : 1) géométrie  2) objets (couronne, coussin, note, micro, téléviseur, trône, piédestal, podium)  3) objets tenus, IK, enveloppes
//         4) Michael adulte  5) Michael enfant  6) Elizabeth Taylor  7) présentateur / présentatrice (+ buste)  8) accessoires seuls
//         9) décor « palais »  10) décor « studio91 »  11) MJ.init
(function () {
  'use strict';
  const X = M.X, TAU = M.TAU, PI = Math.PI, D = 180 / PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, hash } = M;
  const MJ = (M.mj = {});
  const CH = M.chars;
  const cx_ = () => M.ctx();
  const SIL = () => M._sil();
  const OFFP = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];
  const BACK = M.ST.back, W = M.W;

  // =====================================================================
  // 1) GÉOMÉTRIE ET PALETTE
  // =====================================================================
  function ep(cx, cy, rx, ry, n, a0, a1) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; }
  function ell(cx, cy, rx, ry, n) { const o = ep(cx, cy, rx, ry, n || 16, 0, TAU); o.pop(); return o; }
  const rect = (x0, y0, x1, y1) => [[x0, y0, 1], [x1, y0, 1], [x1, y1, 1], [x0, y1, 1]];
  function rrect(x0, y0, x1, y1, r) { return ep(x1 - r, y0 + r, r, r, 4, -PI / 2, 0).concat(ep(x1 - r, y1 - r, r, r, 4, 0, PI / 2), ep(x0 + r, y1 - r, r, r, 4, PI / 2, PI), ep(x0 + r, y0 + r, r, r, 4, PI, PI * 1.5)); }
  const scl = (pts, sx, sy) => { sy = sy == null ? sx : sy; return pts.map((p) => (p[2] ? [p[0] * sx, p[1] * sy, 1] : [p[0] * sx, p[1] * sy])); };
  const tr = (pts, dx, dy) => pts.map((p) => (p[2] ? [p[0] + dx, p[1] + dy, 1] : [p[0] + dx, p[1] + dy]));
  const mp = (m, p) => [m.a * p[0] + m.c * p[1] + m.e, m.b * p[0] + m.d * p[1] + m.f];
  const normA = (a) => { while (a > PI) a -= TAU; while (a < -PI) a += TAU; return a; };
  const rot = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
  function qbez(p0, p1, p2, n) { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]); } return o; }
  const pc = (pts, base, paint, seed, o) => piece(pts, base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));
  const hx = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  function mixA(a, b, k, al) { const A = hx(a), B = hx(b); k = clamp(k); const v = A.map((x, i) => Math.round(lerp(x, B[i], k))); return al == null ? `rgb(${v.join(',')})` : `rgba(${v.join(',')},${al})`; }
  const fr = (x) => x - Math.floor(x);
  const H = (i, k) => hash(i * 12.9898 + (k || 0) * 78.233);
  function scint(x, y, r, a, col) {                     // petite étoile de lumière à 4 branches (dessin brut, gardé)
    if (SIL() || a <= 0.01) return; const c = cx_(); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = col || `rgba(255,252,240,${a})`;
    if (col) c.globalAlpha = a;
    c.beginPath(); c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r); c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r); c.fill(); c.restore();
  }
  function glow(x, y, r, col, a) { if (SIL() || a <= 0.01) return; const c = cx_(), g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r); c.restore(); }

  const C = {
    or: '#C9A444', orD: '#8E7228', orL: '#E8CD7A', argent: '#B8BEC6', argentD: '#7F8690', argentL: '#E6EAEE', cuivre: '#B06A3A', cuivreD: '#7A4422', cuivreL: '#DC9A6A',
    sang: '#8a1e22', sangD: '#5e1216', sangL: '#b0383a', nuit: '#24304a', nuitD: '#161d2e', ivoire: '#efe6d2', ivoireD: '#d6cbb2',
    fuchsia: '#B0507A', fuchsiaD: '#8a3a5e', fuchsiaL: '#c9739a', turq: '#3E8C8A', turqD: '#2c6a68', turqL: '#62aaa6', violet: '#6B4A86', violetD: '#523868', violetL: '#8a68a4',
    ocre: '#c4923e', ocreD: '#9a7030', noir: '#1E1E24', bois: '#4a3020',
  };
  MJ.C = C;
  const MET = { or: [C.or, C.orD, C.orL], argent: [C.argent, C.argentD, C.argentL], cuivre: [C.cuivre, C.cuivreD, C.cuivreL] };

  // =====================================================================
  // 2) OBJETS (échelle 1 ; repère propre à chaque objet)
  // =====================================================================
  // ---- couronne (148 × 113 avec les perles), repère = milieu du bas de l'hermine ; o.metal 'or'|'argent'|'cuivre'|'papier', o.papier, o.eclat (true = reflet
  //      qui passe toutes les 2,8 s ; nombre 0..1 = position du reflet), o.fil (fil vertical vers les cintres)
  const CR_BODY = [[-60, -22, 1], [-63, -46], [-74, -90, 1], [-55, -62], [-38, -94, 1], [-20, -64], [0, -102, 1], [20, -64], [38, -94, 1], [55, -62], [74, -90, 1], [63, -46], [60, -22, 1]];
  const CR_TIPS = [[-74, -90], [-38, -94], [0, -102], [38, -94], [74, -90]];
  const CR_PAP = [[-60, 2, 1], [-62, -36], [-68, -86, 1], [-40, -44], [-20, -92, 1], [0, -48], [20, -92, 1], [40, -44], [68, -86, 1], [62, -36], [60, 2, 1]];
  MJ.STEP = 75;                                      // pas d'empilement d'une couronne sur l'autre (unités de la couronne)
  function eclatU(o) { if (o.eclat === true) return fr(M.tg(o.t || 0) / 2.8 + (o.ph || 0)); return typeof o.eclat === 'number' ? o.eclat : -1; }
  function drawCouronne(o) {
    if (o.fil && !SIL()) strokePts([[0, -110], [0, -4200]], 'rgba(24,20,18,0.85)', 1.3);
    const u = eclatU(o);
    if (o.papier || o.metal === 'papier') {
      pc(CR_PAP, '#f3efe4', () => {
        for (const x of [-40, 0, 40]) strokePts([[x, -46], [x * 0.95, 0]], 'rgba(120,110,90,0.45)', 1.2);
        for (const x of [-20, 20]) strokePts([[x, -90], [x * 1.4, -40]], 'rgba(255,255,255,0.7)', 1.2);
        strokePts([[-62, -36], [62, -36]], 'rgba(120,110,90,0.5)', 1.3);
        shade(-60, -40, 60, -40, 0.18, [-80, -100, 80, 10]); hatch([[-70, -100], [-30, -100], [-30, 4], [-70, 4]], 0.8, 4, 0.14);
        if (u >= 0) { const x = lerp(-110, 110, u); fillPts([[x - 16, 4], [x + 6, 4], [x + 40, -100], [x + 18, -100]], 'rgba(255,255,255,0.45)', 0, 0); }
      }, 9001);
      return;
    }
    const [m, mD, mL] = MET[o.metal] || MET.or;
    pc(CR_BODY, m, () => {
      for (let i = -3; i <= 3; i++) strokePts([[i * 17, -24], [i * 21, -78]], mixA(mD, '#000000', 0.2, 0.4), 1.1);
      hatch([[-80, -110], [-24, -110], [-24, -20], [-80, -20]], 0.8, 3.6, 0.22);
      shade(-60, -60, 60, -60, 0.26, [-80, -110, 80, 0]);
      strokePts([[-44, -36], [-48, -72]], mixA(mL, '#ffffff', 0.3, 0.7), 2.2); strokePts([[8, -40], [6, -88]], mixA(mL, '#ffffff', 0.3, 0.5), 1.6);
      for (const [x, y] of [[-38, -64], [0, -70], [38, -64]]) { fillPts([[x, y - 9], [x + 6, y], [x, y + 9], [x - 6, y]], mD, 0, 0); dot(x, y, 3.4, x === 0 ? C.sang : C.nuit); }
      if (u >= 0) { const x = lerp(-120, 120, u); fillPts([[x - 14, -18], [x + 4, -18], [x + 34, -110], [x + 16, -110]], 'rgba(255,250,225,0.55)', 0, 0); }
    }, 9002);
    pc(rrect(-63, -42, 63, -20, 4), mD, () => {
      fillPts(rect(-63, -42, 63, -36), mL);
      for (const [x, col] of [[-40, C.nuit], [0, C.sang], [40, C.nuit]]) { fillPts(ell(x, -31, x ? 7 : 9, 6, 12), col, 0, 0); dot(x - 2, -33, 1.8, 'rgba(255,255,255,0.7)'); }
      for (const x of [-20, 20]) dot(x, -31, 2.6, mL);
    }, 9003);
    pc([[-65, -22], [65, -22], [68, -10], [63, 2, 1], [-63, 2, 1], [-68, -10]], C.ivoire, () => {
      for (let x = -56; x <= 56; x += 16) { fillPts([[x, -16], [x + 2, -10], [x, -4], [x - 2, -10]], '#1d1b1f', 0, 0); dot(x, -17, 1.6, '#1d1b1f'); }
      hatch(null, 0.7, 3.4, 0.14, 1, M.P.encre, [-70, -24, 70, 4]); shade(0, -22, 0, 2, 0.2, [-70, -24, 70, 4]);
    }, 9004);
    CR_TIPS.forEach(([x, y], i) => pc(ell(x, y - 5, 6.5, 6.5, 12), mL, () => dot(x - 2, y - 7, 2, 'rgba(255,255,255,0.8)'), 9005 + i, { drop: false }));
    if (u >= 0 && u < 1) { const k = Math.sin(u * PI); scint(lerp(-60, 60, u), -96 + 20 * Math.abs(u - 0.5), 14 * k, 0.9 * k); }
  }
  // ---- coussin de velours (220 × 50, glands jusqu'à y +24), repère = milieu du dessous ; o.couronnes (liste de métaux empilés), o.couronneS (1), o.fil
  const COU = [[-104, -6], [-111, -24], [-102, -42], [-60, -49], [0, -51], [60, -49], [102, -42], [111, -24], [104, -6], [60, 0], [0, 2], [-60, 0]];
  function gland(x, y) {
    strokePts(qbez([x, y], [x + Math.sign(x) * 6, y + 4], [x + Math.sign(x) * 4, y + 12], 6), C.orD, 2);
    pc([[x + Math.sign(x) * 4 - 5, y + 10], [x + Math.sign(x) * 4 + 5, y + 10], [x + Math.sign(x) * 4 + 8, y + 28, 1], [x + Math.sign(x) * 4 - 8, y + 28, 1]], C.or, () => {
      for (let i = -6; i <= 6; i += 3) strokePts([[x + Math.sign(x) * 4 + i * 0.5, y + 12], [x + Math.sign(x) * 4 + i, y + 28]], C.orD, 1);
    }, 9020 + (x > 0 ? 1 : 0), { drop: false });
  }
  function drawCoussin(o) {
    if (o.fil && !SIL()) for (const x of [-108, 108]) strokePts([[x, -14], [x, -4200]], 'rgba(24,20,18,0.85)', 1.3);
    pc(COU, C.sang, () => {
      shade(0, -50, 0, 2, 0.35, [-115, -55, 115, 5]);
      strokePts(qbez([-90, -40], [0, -54], [90, -40], 12), 'rgba(230,140,140,0.45)', 3);
      for (const [x, y] of [[-60, -18], [60, -18], [0, -26]]) { dot(x, y, 3.2, C.orD); for (let k = 0; k < 4; k++) { const a = k * PI / 2 + 0.6; strokePts([[x, y], [x + Math.cos(a) * 22, y + Math.sin(a) * 9]], 'rgba(40,6,8,0.45)', 1.1); } }
      hatch(null, 0.9, 3.6, 0.16, 1, M.P.encre, [-115, -55, 115, 5]);
    }, 9010);
    strokePts(COU, C.or, 2.2, true);
    gland(-108, -14); gland(108, -14);
    const L = Array.isArray(o.couronnes) ? o.couronnes : o.couronnes ? [o.couronnes] : [], cs = o.couronneS || 1, c = cx_();
    L.forEach((mt, i) => { c.save(); c.translate(0, -44 - i * MJ.STEP * cs); c.scale(cs, cs); drawCouronne({ metal: mt, t: o.t, eclat: o.eclat, ph: i * 0.3 }); c.restore(); });
  }
  // ---- la note de MTV (150 × 200), repère = centre ; o.retourne 0 (dos visible, presque de chant : la feuille regarde le lecteur) → 1 (face au public)
  const noteK = (o) => Math.cos((PI / 2 + 0.3) * (1 - ease(clamp(o.retourne || 0))));
  function noteFace(seed) {
    pc(rect(-75, -100, 75, 100), '#f2ead6', () => {
      strokePts(rect(-66, -91, 66, 91), 'rgba(120,100,70,0.35)', 1.2, true);
      // fedora noir vu de face, couronne d'or posée dessus
      pc([[-68, -14, 1], [-52, -10], [-28, -12], [-26, -40], [-20, -52], [-8, -56], [0, -48], [8, -56], [20, -52], [26, -40], [28, -12], [52, -10], [68, -14, 1], [60, -2], [30, 4], [0, 6], [-30, 4], [-60, -2]], '#1E1E24', () => {
        fillPts([[-27, -26, 1], [27, -26, 1], [28, -12, 1], [-28, -12, 1]], '#6e7078'); strokePts([[-60, -6], [-30, 0], [30, 0], [60, -6]], 'rgba(255,255,255,0.25)', 1.2);
        strokePts([[0, -48], [0, -30]], 'rgba(255,255,255,0.18)', 1.2);
      }, seed + 1, { drop: false });
      const c = cx_(); c.save(); c.translate(0, -50); c.scale(0.46, 0.46); drawCouronne({ metal: 'or' }); c.restore();
      // « × 2 » dessiné : deux petites couronnes
      for (const x of [-28, 28]) { c.save(); c.translate(x, 62); c.scale(0.24, 0.24); drawCouronne({ metal: 'or' }); c.restore(); }
      hatch([[-75, 10], [75, 10], [75, 100], [-75, 100]], 0.4, 6, 0.06);
      strokePts(qbez([-60, 30], [0, 22], [60, 30], 8), 'rgba(120,100,70,0.25)', 1);
    }, seed);
  }
  function drawNote(o) {
    const k = noteK(o), c = cx_();
    c.save(); c.scale(Math.max(0.05, Math.abs(k)), 1);
    if (k > 0) noteFace(9030);
    else pc(rect(-75, -100, 75, 100), '#e4dac2', () => { fillPts([[-40, -70], [40, -70], [44, -30], [-44, -30]], 'rgba(60,50,40,0.06)'); shade(-75, 0, 75, 0, 0.22, [-80, -110, 80, 110]); }, 9031);
    c.restore();
  }
  // ---- micro à main (14 × 104), repère = milieu du manche ; o.couleur 'noir' (présentateur) | 'blanc' (présentatrice) | 'chrome' (Michael enfant)
  const MIC = { noir: ['#1c1c22', '#46484e', '#8a8e96'], blanc: ['#ece8df', '#b9bec6', '#e6eaee'], chrome: ['#9aa0a8', '#c0c6cc', '#e6eaee'] };
  function drawMicro(o) {
    const [h, t, l] = MIC[o.couleur] || MIC.noir;
    pc([[-6, -38], [6, -38], [8, -30], [5, 36, 1], [-5, 36, 1], [-8, -30]], h, () => { strokePts([[2, -30], [1, 30]], 'rgba(255,255,255,0.28)', 1.4); fillPts(rect(-8, -40, 8, -32), l); }, 9040);
    pc(ell(0, -52, 14, 15, 18), t, () => {
      for (let i = -12; i <= 12; i += 4) { strokePts([[i, -67], [i, -37]], 'rgba(20,20,24,0.45)', 1); strokePts([[-15, -52 + i], [15, -52 + i]], 'rgba(20,20,24,0.35)', 1); }
      dot(-5, -58, 3, 'rgba(255,255,255,0.55)');
    }, 9041);
  }
  // ---- téléviseur 1991 (230 × 196 ; 300 avec l'antenne), repère = milieu du dessous ; o.couleur 'gris'|'ocre'|'turquoise'|'bordeaux'|'anthracite'|hex ;
  //      o.ecran 'couronne'|'presentatrice'|'neige'|'formes'|'couleur'|'eteint' ; o.antenne (true) ; o.fil (deux câbles vers les cintres) ; o.ph (déphasage)
  const TV_COL = { gris: ['#8e9094', '#6c6e72', '#aeb0b4'], ocre: ['#b5863f', '#8e6630', '#d0a75e'], turquoise: ['#3E8C8A', '#2c6a68', '#62aaa6'], bordeaux: ['#6e1e28', '#52141c', '#8e3440'], anthracite: ['#3a3c42', '#2a2c30', '#56585e'] };
  const TVS = { x0: -94, y0: -176, x1: 48, y1: -30, r: 16 };          // vitre de l'écran
  MJ.TVS = TVS;
  const tvGlass = () => rrect(TVS.x0, TVS.y0, TVS.x1, TVS.y1, TVS.r);
  function tvCols(o) { const v = o.couleur || 'gris'; if (TV_COL[v]) return TV_COL[v]; return [v, mixA(v, '#000000', 0.25), mixA(v, '#ffffff', 0.25)]; }
  function ecranDraw(o) {                                 // contenu de l'écran (dessin brut, clippé à la vitre)
    if (SIL()) return;
    const c = cx_(), g = M.tg(o.t || 0) + (o.ph || 0) * 3.7, e = o.ecran || 'formes', cx = (TVS.x0 + TVS.x1) / 2, cy = (TVS.y0 + TVS.y1) / 2;
    c.save(); M.path(tvGlass(), 0, 0); c.clip();
    if (e === 'neige') {
      const f = Math.floor(g * 24);
      for (let y = TVS.y0; y < TVS.y1; y += 4) for (let x = TVS.x0; x < TVS.x1; x += 4) { const v = Math.floor(60 + 180 * H(x * 31 + y * 7, f)); c.fillStyle = `rgb(${v},${v},${v})`; c.fillRect(x, y, 4, 4); }
    } else if (e === 'eteint') {
      const gr = c.createLinearGradient(TVS.x0, TVS.y0, TVS.x1, TVS.y1); gr.addColorStop(0, '#3a423e'); gr.addColorStop(1, '#1e2422'); c.fillStyle = gr; c.fillRect(TVS.x0, TVS.y0, 150, 150);
    } else if (e === 'couronne' || e === 'presentatrice') {
      const gr = c.createRadialGradient(cx, cy, 10, cx, cy, 110); gr.addColorStop(0, e === 'couronne' ? '#3a5aa6' : '#5a6aa0'); gr.addColorStop(1, e === 'couronne' ? '#18264e' : '#2a3050'); c.fillStyle = gr; c.fillRect(TVS.x0, TVS.y0, 150, 150);
      if (e === 'couronne') {
        for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + g * 0.2; c.fillStyle = 'rgba(255,240,200,0.07)'; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * 140, cy + Math.sin(a) * 140); c.lineTo(cx + Math.cos(a + 0.18) * 140, cy + Math.sin(a + 0.18) * 140); c.fill(); }
        c.save(); c.translate(cx, cy + 34); c.scale(0.7, 0.7); drawCouronne({ metal: 'or', eclat: true, t: o.t, ph: o.ph }); c.restore();
      }
    } else if (e === 'couleur') {
      const P = [C.fuchsia, C.turq, C.ocre, C.violet, '#4f6a8a', C.sang], i = Math.floor(g / 5) % P.length, k = smoothK(fr(g / 5));
      c.fillStyle = mixA(P[i], P[(i + 1) % P.length], k); c.fillRect(TVS.x0, TVS.y0, 150, 150);
      for (let b = 0; b < 6; b++) { c.fillStyle = mixA(P[(i + b) % P.length], '#ffffff', 0.15, 0.55); c.fillRect(TVS.x0 + b * 24, TVS.y0 + 90, 24, 60); }
      c.fillStyle = 'rgba(255,255,255,0.18)'; c.beginPath(); c.arc(cx + 20 * Math.sin(g * 0.6), cy - 20, 30, 0, TAU); c.fill();
    } else {                                              // 'formes' : formes géométriques colorées qui dérivent (aucun logo)
      const P = [C.nuit, '#2a1e3a', '#1e3a3a'], bg = P[Math.floor(g / 7 + 9) % 3];
      c.fillStyle = bg; c.fillRect(TVS.x0, TVS.y0, 150, 150);
      const sh = [[C.fuchsia, 0], [C.turq, 1], [C.ocre, 2], [C.violetL, 3]];
      sh.forEach(([col, k]) => {
        const a = g * (0.3 + 0.1 * k) + k * 1.7, x = cx + Math.cos(a) * 36, y = cy + Math.sin(a * 1.3) * 34, r = 20 + 6 * Math.sin(g + k);
        c.fillStyle = col; c.beginPath();
        if (k === 0) { c.moveTo(x, y - r); c.lineTo(x + r, y + r * 0.8); c.lineTo(x - r, y + r * 0.8); }
        else if (k === 1) c.arc(x, y, r * 0.8, 0, TAU);
        else if (k === 2) { c.save(); c.translate(x, y); c.rotate(a); c.rect(-r * 0.7, -r * 0.7, r * 1.4, r * 1.4); c.restore(); }
        else { for (let j = 0; j < 10; j++) { const b = -PI / 2 + j * PI / 5 + a * 0.3, rr = j % 2 ? r * 0.4 : r; j ? c.lineTo(x + Math.cos(b) * rr, y + Math.sin(b) * rr) : c.moveTo(x + Math.cos(b) * rr, y + Math.sin(b) * rr); } }
        c.fill();
      });
    }
    // lignes de balayage, reflet bombé, lueur
    c.fillStyle = 'rgba(0,0,0,0.12)'; for (let y = TVS.y0 + ((g * 40) % 3); y < TVS.y1; y += 3) c.fillRect(TVS.x0, y, 150, 1);
    c.restore();
  }
  function ecranVerre(o) {                                  // reflet du verre bombé + halo (après le contenu)
    if (SIL()) return;
    const c = cx_();
    c.save(); M.path(tvGlass(), 0, 0); c.clip();
    const gr = c.createRadialGradient(-40, -140, 6, -20, -100, 110); gr.addColorStop(0, 'rgba(255,255,255,0.22)'); gr.addColorStop(0.4, 'rgba(255,255,255,0.05)'); gr.addColorStop(1, 'rgba(0,0,0,0.35)'); c.fillStyle = gr; c.fillRect(TVS.x0, TVS.y0, 150, 150);
    c.restore();
    if (o.ecran !== 'eteint') glow((TVS.x0 + TVS.x1) / 2, (TVS.y0 + TVS.y1) / 2, 120, o.ecran === 'neige' ? '200,210,220' : '150,170,230', 0.12);
  }
  function drawTele(o) {
    const [m, mD, mL] = tvCols(o);
    if (o.fil && !SIL()) for (const x of [-90, 90]) strokePts([[x, -196], [x, -4200]], 'rgba(24,20,18,0.85)', 1.4);
    if (o.antenne !== false) { strokePts([[8, -196], [-46, -296]], '#2a2a2e', 2.2); strokePts([[16, -196], [76, -288]], '#2a2a2e', 2.2); dot(-46, -296, 4, '#9aa0a8'); dot(76, -288, 4, '#9aa0a8'); pc(ell(12, -198, 16, 7, 12), '#2a2a2e', null, 9050, { drop: false }); }
    for (const x of [-84, 84]) pc(rect(x - 14, -12, x + 14, 0), '#1e1c1c', null, 9051, { drop: false });
    pc(rrect(-115, -196, 115, -8, 18), m, () => {
      shade(0, -196, 0, -8, 0.3, [-120, -200, 120, 0]); strokePts([[-106, -188], [106, -188]], mixA(mL, '#ffffff', 0.3, 0.6), 2);
      hatch([[-118, -60], [118, -60], [118, -8], [-118, -8]], 0.8, 4, 0.18);
      fillPts(rrect(TVS.x0 - 10, TVS.y0 - 10, TVS.x1 + 10, TVS.y1 + 10, 20), '#1a1a1e');
      for (const [y, r] of [[-160, 11], [-124, 9]]) { dot(84, y, r, mD); dot(84, y, r - 3, '#2a2a2e'); strokePts([[84, y], [84 + r - 4, y - 3]], mL, 1.6); }
      for (let y = -98; y <= -38; y += 7) strokePts([[68, y], [100, y]], 'rgba(20,20,20,0.55)', 1.6);
      dot(70, -186, 3, '#e8352a');
    }, 9052);
    pc(tvGlass(), '#222830', null, 9053, { drop: false, edge: 'rgba(0,0,0,0)' });
    if (o.ecran !== 'presentatrice') { ecranDraw(o); ecranVerre(o); } else ecranDraw(o);
  }
  // ---- trône (230 × 434), repère = milieu au sol ; siège à y −104
  MJ.TRONE = { siege: 104, h: 434, w: 230 };
  function griffe(x) {
    pc([[x - 12, -18], [x + 12, -18], [x + 16, -4], [x + 10, 0, 1], [x - 10, 0, 1], [x - 16, -4]], C.orD, () => { for (const d of [-8, 0, 8]) strokePts([[x + d, -14], [x + d * 1.3, 0]], '#4a3a14', 1.4); }, 9060 + x, { drop: false });
    dot(x, -24, 11, C.or);
  }
  function drawTrone(o) {
    const back = [[-88, -104], [-90, -300], [-82, -352], [-58, -386], [-22, -400], [0, -402], [22, -400], [58, -386], [82, -352], [90, -300], [88, -104]];
    pc(back, C.or, () => { shade(-90, 0, 90, 0, 0.3, [-95, -410, 95, -100]); hatch(null, 0.8, 3.8, 0.2, 1, M.P.encre, [-95, -410, 95, -100]); }, 9061);
    pc(tr(scl(tr(back, 0, 250), 0.8, 0.86), 0, -250), C.violet, () => {
      for (let y = -320; y < -110; y += 34) for (let x = -64; x <= 64; x += 32) { const xx = x + ((y / 34) % 2 ? 16 : 0); dot(xx, y, 3, C.orD); strokePts([[xx - 16, y + 17], [xx, y], [xx + 16, y + 17]], 'rgba(30,14,40,0.4)', 1.1); }
      shade(0, -380, 0, -110, 0.3, [-80, -400, 80, -100]);
    }, 9062);
    // cimier en éventail (aucune lettre) + gemme rouge
    pc(ep(0, -398, 38, 34, 12, PI, TAU).concat([[38, -398], [-38, -398]]), C.or, () => { for (let i = 1; i < 8; i++) { const a = PI + i * PI / 8; strokePts([[0, -398], [Math.cos(a) * 36, -398 + Math.sin(a) * 32]], C.orD, 1.3); } }, 9063);
    pc(ell(0, -404, 8, 8, 12), C.sang, () => dot(-2, -407, 2.4, 'rgba(255,255,255,0.7)'), 9064, { drop: false });
    // accoudoirs à volutes
    for (const s of [-1, 1]) pc([[s * 88, -104], [s * 88, -196], [s * 104, -206], [s * 118, -196], [s * 116, -176], [s * 104, -174], [s * 108, -104]].map((p) => s < 0 ? p : p), C.or, () => {
      strokePts(ep(s * 106, -190, 9, 9, 10, 0, TAU), C.orD, 1.6); hatch(null, 0.8, 3.6, 0.22, 1, M.P.encre, [-130, -210, 130, -100]);
    }, 9065 + s);
    // ceinture dorée, coussin violet, pieds griffus
    for (const x of [-88, 88]) { pc(rect(x - 9, -64, x + 9, -26), C.or, () => strokePts([[x, -60], [x, -30]], C.orD, 1.4), 9070 + x, { drop: false }); griffe(x); }
    pc(rect(-106, -88, 106, -62), C.or, () => { for (let x = -96; x <= 96; x += 16) strokePts(ep(x, -75, 6, 6, 8, 0, TAU), C.orD, 1.1); shade(0, -88, 0, -62, 0.25, [-110, -90, 110, -60]); }, 9072);
    pc([[-102, -86], [-104, -100], [-90, -108], [0, -110], [90, -108], [104, -100], [102, -86]], C.violet, () => { strokePts(qbez([-90, -104], [0, -112], [90, -104], 8), 'rgba(200,170,230,0.5)', 2.2); shade(0, -110, 0, -86, 0.3, [-110, -115, 110, -84]); }, 9073);
  }
  // ---- piédestal (100 × 196), repère = sol ; dessus à y −196
  function drawPiedestal() {
    pc(rect(-46, -22, 46, 0), C.ivoireD, () => strokePts([[-46, -12], [46, -12]], C.orD, 2), 9080);
    pc(rect(-30, -182, 30, -22), C.ivoire, () => { for (let x = -24; x <= 24; x += 8) strokePts([[x, -178], [x, -26]], 'rgba(120,100,70,0.35)', 1.6); shade(-30, 0, 30, 0, 0.3, [-32, -184, 32, -20]); fillPts(rect(-30, -40, 30, -34), C.or); fillPts(rect(-30, -170, 30, -164), C.or); }, 9081);
    pc(rect(-50, -196, 50, -182), C.or, () => { strokePts([[-48, -194], [48, -194]], C.orL, 1.6); }, 9082);
  }
  // ---- podium de remise de prix (168 × 252), repère = sol ; dessus à y −250
  function drawPodium() {
    pc([[-56, -232, 1], [56, -232, 1], [70, -18, 1], [-70, -18, 1]], C.violet, () => {
      shade(-60, 0, 60, 0, 0.3, [-75, -240, 75, -10]);
      const st = []; for (let i = 0; i < 10; i++) { const a = -PI / 2 + i * PI / 5, r = i % 2 ? 14 : 34; st.push([Math.cos(a) * r, -132 + Math.sin(a) * r]); }
      pc(st, C.or, () => dot(-4, -142, 3, 'rgba(255,255,255,0.6)'), 9090, { drop: false });
      strokePts([[-58, -200], [58, -200]], C.or, 3); strokePts([[-66, -50], [66, -50]], C.or, 3);
    }, 9091);
    pc(rect(-80, -20, 80, 0), C.orD, null, 9092);
    pc([[-84, -232, 1], [84, -232, 1], [78, -252, 1], [-78, -252, 1]], C.or, () => strokePts([[-76, -248], [76, -248]], C.orL, 1.6), 9093);
  }

  const OBJ = {
    couronne: { draw: drawCouronne, held: { echelle: 0.8 }, grip: [64, -18], p2: () => [-64, -18], pts: { base: [0, 0], sommet: [0, -108], centre: [0, -52] }, base: [0, 0] },
    coussin: { draw: drawCoussin, held: { echelle: 0.8 }, grip: [98, -22], p2: () => [-98, -22], pts: { dessus: [0, -44], base: [0, 0] }, base: [0, 0] },
    note: { devant: true, draw: drawNote, held: { echelle: 0.95 }, grip: (o) => [Math.max(4, 75 * Math.abs(noteK(o))), 8], p2: (o) => [-Math.max(4, 75 * Math.abs(noteK(o))), 8],
      pts: { centre: [0, 0], haut: [0, -100], bas: [0, 100] }, base: [0, 100] },
    micro: { draw: drawMicro, grip: [0, 6], pts: { tete: [0, -52], bas: [0, 36] }, base: [0, 36] },
    tele: { draw: drawTele, grip: [0, -100], pts: { ecran: [-23, -103], haut: [0, -196] }, base: [0, 0] },
    trone: { draw: drawTrone, grip: [0, -200], pts: { siege: [0, -104], haut: [0, -412] }, base: [0, 0] },
    piedestal: { draw: drawPiedestal, grip: [0, -100], pts: { dessus: [0, -196] }, base: [0, 0] },
    podium: { draw: drawPodium, grip: [0, -120], pts: { dessus: [0, -252] }, base: [0, 0] },
  };
  MJ.OBJ = OBJ;
  const gripOf = (ob, o) => (typeof ob.grip === 'function' ? ob.grip(o) : ob.grip);
  const ptOf = (v, o) => (typeof v === 'function' ? v(o) : v);
  function smoothK(x) { x = clamp(x); return x * x * (3 - 2 * x); }

  // =====================================================================
  // 3) OBJETS TENUS, IK, ENVELOPPES (principe heldParts de bibliotheque/ronald.js)
  //    G = géométrie du bras : LA (bras), PG (poing dans l'avant-bras), SHF/SHB (épaules), HEAD (cou), k (taille de la main)
  // =====================================================================
  const G_ADULTE = { LA: 96, PG: [4, 96], SHF: [-2, -146], SHB: [-10, -146], HEAD: [6, -170], k: 1 };
  const G_ENF = { LA: 64, PG: [3, 65], SHF: [-2, -98], SHB: [-8, -98], HEAD: [4, -114], k: 0.68, enfant: true };
  function heldOpts(name, o, p) { const ob = OBJ[name]; return Object.assign({ t: p.t || 0 }, ob.held || {}, o || {}); }
  function heldDraw(name, o, p) {
    const ob = OBJ[name]; if (!ob) return;
    const oo = heldOpts(name, o, p), g = gripOf(ob, oo), c = cx_(), e = oo.echelle || 1;
    c.save(); c.scale(e, e); c.translate(-g[0], -g[1]); ob.draw(oo); c.restore();
  }
  const DOIGTS = [[-13, -9], [9, -11], [12, -4], [12, 6], [6, 11], [-6, 11], [-13, 4]];
  const doigtsPaint = () => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(70,40,30,0.45)', 1); hatch(null, 0.9, 3.4, 0.12); };
  const has = (v) => v && v !== 'rien';
  const fingers = (name, k) => (!OBJ[name] ? OFFP : scl(DOIGTS, k || 1));
  function heldParts(G, skin, skinB, seed) {
    const P = [G.PG[0], G.PG[1]];
    return {
      objet: { parent: 'armF_lo', at: P, noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (has(p.tenu) && !(OBJ[p.tenu] && OBJ[p.tenu].devant)) heldDraw(p.tenu, p.tenuO, p); } },
      objetDevant: { parent: 'armF_lo', at: P, noRivet: true, base: '#000', seed: seed + 6, pts: OFFP, extra: (p) => { if (has(p.tenu) && OBJ[p.tenu] && OBJ[p.tenu].devant) heldDraw(p.tenu, p.tenuO, p); } },
      doigts: { parent: 'armF_lo', at: P, noRivet: true, base: skin, seed: seed + 2, pts: (p) => (has(p.tenu) ? fingers(p.tenu, G.k) : OFFP), paint: doigtsPaint },
      objetB: { parent: 'armB_lo', at: P, noRivet: true, base: '#000', seed: seed + 3, pts: OFFP, extra: (p) => { if (has(p.tenuB)) heldDraw(p.tenuB, p.tenuBO, p); } },
      doigtsB: { parent: 'armB_lo', at: P, noRivet: true, base: skinB, seed: seed + 4, pts: (p) => (has(p.tenuB) ? fingers(p.tenuB, G.k) : OFFP), paint: doigtsPaint },
      doigtsB2: { parent: 'armB_lo', at: P, noRivet: true, base: skinB, seed: seed + 5, pts: (p) => (p._deux ? scl(DOIGTS, G.k) : OFFP), paint: doigtsPaint },
    };
  }
  // point écran d'un point nommé de l'objet tenu : MJ.pt(r, 'sommet') ; main arrière : MJ.pt(r, 'nom', true) ; 'prise' = point tenu
  MJ.pt = function (r, nom, arriere) {
    const name = arriere ? r.tenuB : r.tenu, ob = OBJ[name]; if (!ob) return null;
    const oo = arriere ? r.tenuBO : r.tenuO, g = gripOf(ob, oo), e = oo.echelle || 1;
    const q = nom === 'prise' ? g : ob.pts[nom] ? ptOf(ob.pts[nom], oo) : null; if (!q) return null;
    return r.w(arriere ? 'objetB' : 'objet', (q[0] - g[0]) * e, (q[1] - g[1]) * e);
  };
  function ikT(G, S, T, bend) {       // même convention que M.ik (bend 1 = coude plié vers l'avant)
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
  const blend = (q, n, v, k) => { q.ang[n] = lerp(q.ang[n] || 0, v, k); };
  function headPt(q, hx_, hy) { const Hd = q._G.HEAD; return mp(new DOMMatrix().translate(Hd[0], Hd[1]).rotate((q.ang.head || 0) * D), [hx_, hy]); }
  // position (repère du torse) où mettre la PRISE d'un objet tenu pour que son point `nom` tombe en T, objet tourné de `ang` à l'écran
  function gripFor(name, oo, nom, T, ang) { const ob = OBJ[name], g = gripOf(ob, oo), e = oo.echelle || 1, P = ptOf(ob.pts[nom], oo), v = rot([(P[0] - g[0]) * e, (P[1] - g[1]) * e], ang || 0); return [T[0] - v[0], T[1] - v[1]]; }
  function prep(p) { p = p || {}; return Object.assign({}, p, { ang: Object.assign({}, p.ang), hide: Object.assign({}, p.hide), face: Object.assign({}, p.face), tenuO: Object.assign({}, p.tenuO), tenuBO: Object.assign({}, p.tenuBO) }); }
  function finish(q) {
    const A = q.ang, tl = q.tilt || 0, G = q._G;
    if (has(q.tenu)) { if (!(q.handF && q.handF !== 'fist')) q.handF = 'fist'; }
    if (has(q.tenuB)) { if (!(q.handB && q.handB !== 'fist')) q.handB = 'fist'; }
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
      A.armB_up = sol.a; A.armB_lo = sol.b; q.handB = 'fist'; q._deux = true;
    }
    return q;
  }
  function run(def, q, x, y, s, o) {
    const r = M.puppet(def, q, x, y, s, o);
    r.tenu = q.tenu; r.tenuB = q.tenuB; r.q = q; r.s = s; r.dir = o.dir || 1;
    if (q.tenu && OBJ[q.tenu]) r.tenuO = heldOpts(q.tenu, q.tenuO, q);
    if (q.tenuB && OBJ[q.tenuB]) r.tenuBO = heldOpts(q.tenuB, q.tenuBO, q);
    r.main = r.w('armF_lo', def.G.PG[0], def.G.PG[1]); r.mainB = r.w('armB_lo', def.G.PG[0], def.G.PG[1]);
    return r;
  }
  // enveloppe : pose → gestes (poseFn) → finish → M.puppet. fn.pose(p, x, y, s, dir) = pose finale sans dessiner (pour M.ik / M.partMatrices)
  function wrap(keyOf, poseFn, sDefOf) {
    const prepare = (pose, x, y, s, dir) => {
      const def = CH[keyOf(pose || {})], q = prep(pose); q._G = def.G; q._def = def;
      const loc = (Pt) => { const { mats } = M.partMatrices(def, q, x, y, s, dir); const p = new DOMPoint(Pt[0], Pt[1]).matrixTransform(mats.torso.inverse()); return [p.x, p.y]; };
      const env = { x, y, s, dir, def, poseAt: (patch) => fn.pose(Object.assign({}, pose, patch), x, y, s, dir) };
      poseFn(q, loc, env); finish(q);
      return { def, q, env };
    };
    const fn = (pose, x, y, s, o) => {
      pose = pose || {}; s = s == null ? sDefOf(pose) : s; o = Object.assign({ slot: M.ST.slotF }, o || {});
      const dir = o.dir || 1, { def, q, env } = prepare(pose, x, y, s, dir);
      if (!o.nom) o.nom = def.nom;
      const r = run(def, q, x, y, s, o);
      if (q._post) q._post(r, env);
      return r;
    };
    fn.pose = (pose, x, y, s, dir) => { pose = pose || {}; return prepare(pose, x || 0, y || 0, s == null ? sDefOf(pose) : s, dir || 1).q; };
    fn.def = (pose) => CH[keyOf(pose || {})];
    return fn;
  }
  const EXPR = {
    neutre: {}, ravi: { mouth: 'smile', eyes: 'half' }, surpris: { brow: 'up', eyes: 'wide', mouth: 'o' }, triste: { brow: 'worry', mouth: 'tight', eyes: 'half' },
    fache: { brow: 'frown', mouth: 'tight' }, fier: { brow: 'up', mouth: 'smile' }, gene: { brow: 'worry', eyes: 'half', mouth: 'tight' }, malin: { brow: 'up', mouth: 'smile', eyes: 'half' },
  };
  function expr(q, nom) { const e = EXPR[nom]; if (!e) return; for (const k in e) if (q.face[k] == null) q.face[k] = e[k]; }

  // ---------------- pièces de corps communes (articulations rondes, rivet au pivot)
  const R_COUDE = 10.5;
  function armR(len, wt, rc) { rc = rc || R_COUDE; return ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1, len * 0.42], [rc + 0.5, len - 6]], ep(0, len, rc, rc, 10, 0, PI), [[-rc - 0.5, len - 6], [-wt + 1, len * 0.42]]); }
  function foreR(kind, k) { k = k || 1; const f = X.forePts(kind); return scl(ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU).concat(f.slice(2)), k); }
  const DARK = (back) => { if (back) fillPts(rect(-40, -40, 40, 160), 'rgba(20,14,10,0.16)'); };
  // bras : o = { manche(back,p) : peint la manche, LA, wt }
  function upDef(at, back, seed, o) {
    const LA = o.LA || 96;
    return { parent: 'torso', at, pts: armR(LA, o.wt || 14, o.rc), base: '#000', seed, paint: (p) => {
      o.manche(back, p); hatch([[-16, -20], [-3, -20], [-3, LA + 4], [-16, LA + 4]], 0.9, 3.8, back ? 0.3 : 0.22); DARK(back);
    } };
  }
  // avant-bras : o = { manche(back,p), main(back,p) → couleur de la main, cuff(back,p) → couleur du poignet ou null, k, LA, extra(back,p) }
  function foreDef(parent, back, seed, o) {
    const k = o.k || 1, hk = (p) => (back ? p.handB : p.handF) || 'fist';
    return { parent, at: [0, o.LA || 96], pts: (p) => foreR(hk(p), k), base: '#000', seed, paint: (p) => {
      const c = cx_();
      o.manche(back, p);
      c.save(); c.scale(k, k);
      fillPts([[-20, 76, 1], [20, 76, 1], [24, 130, 1], [-20, 130, 1]], o.main(back, p)); X.handPaint(null, hk(p));
      const cf = o.cuff && o.cuff(back, p); if (cf) fillPts([[-15, 62, 1], [15, 62, 1], [16, 79, 1], [-15, 79, 1]], cf);
      c.restore();
      hatch([[-14 * k, -10], [-3 * k, -10], [-3 * k, 58 * k], [-14 * k, 58 * k]], 0.9, 3.8, back ? 0.3 : 0.2); DARK(back);
    }, extra: o.extra ? (p) => o.extra(back, p, k, hk(p)) : undefined };
  }
  // jambes en trois pièces (cuisse, tibia, pied) : L = { th, sh, hx, wt, kt, ak, fl, cuisse(back,p), tibia(back,p), pied(back,p) }
  const legC = (len, wt, rk) => ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1, len * 0.5], [rk + 0.5, len - 4]], ep(0, len, rk, rk, 10, 0, PI), [[-rk - 0.5, len - 4], [-wt + 1, len * 0.5]]);
  const FOOT = (ak, len, hh) => ep(0, 0, ak, ak, 8, PI, TAU).concat([[ak + 2, 2], [len * 0.62, 4], [len * 0.92, 8], [len, (hh || 14), 1], [-15, (hh || 14) + 2, 1], [-15, 6]]);
  function legParts(L, seed) {
    const thigh = (back) => ({ parent: 'torso', at: [back ? -L.hx : L.hx, -2], pts: legC(L.th, L.wt, L.kt), base: '#000', seed: seed + (back ? 1 : 2), noRivet: !!back,
      paint: (p) => { L.cuisse(back, p); hatch(back ? null : [[-L.wt, -10], [-4, -10], [-4, L.th], [-L.wt, L.th]], 0.8, 3.8, back ? 0.3 : 0.2); DARK(back); } });
    const shin = (back) => ({ parent: back ? 'legB_up' : 'legF_up', at: [0, L.th], pts: (p) => (L.tibiaPts ? L.tibiaPts(p) : legC(L.sh, L.kt, L.ak)), base: '#000', seed: seed + (back ? 3 : 4), noRivet: !!back,
      paint: (p) => { L.tibia(back, p); hatch(back ? null : [[-L.kt, -6], [-3, -6], [-3, L.sh], [-L.kt, L.sh]], 0.8, 3.8, back ? 0.3 : 0.2); DARK(back); } });
    const foot = (back) => ({ parent: back ? 'legB_lo' : 'legF_lo', at: [0, L.sh], pts: (p) => (L.piedPts ? L.piedPts(p) : FOOT(L.ak + 1, L.fl)), base: '#000', seed: seed + (back ? 5 : 6), noRivet: true,
      paint: (p) => { L.pied(back, p); DARK(back); } });
    return { legB_up: thigh(true), legB_lo: shin(true), piedB: foot(true), legF_up: thigh(false), legF_lo: shin(false), piedF: foot(false) };
  }
  const ORDER = (heads, mid) => ['armB_up', 'armB_lo', 'legB_up', 'legB_lo', 'piedB', 'legF_up', 'legF_lo', 'piedF'].concat(heads, ['torso'], mid || [], TAIL);
  const TAIL = ['objetB', 'doigtsB', 'objet', 'armF_up', 'armF_lo', 'objetDevant', 'doigts', 'doigtsB2'];
  function defOf(nom, parts, G, skin, skinB, seed, order, hipY, extra) {
    Object.assign(parts, heldParts(G, skin, skinB, seed));
    return Object.assign({ nom, G, hipY, parts, handLen: Math.round(Math.hypot(G.PG[0], G.PG[1])), rod: { part: 'torso', at: [-26, 18] }, order }, extra || {});
  }
  // mouvements de jambes (trois pièces)
  function plier(q, th) {                                    // plie le buste aux hanches (th > 0 = vers l'avant), jambes droites
    if (!th) return; const h = -q._def.hipY;
    q.tilt = (q.tilt || 0) + th; q.dx = (q.dx || 0) - h * Math.sin(th); q.dy = (q.dy || 0) + h * (1 - Math.cos(th));
    q.ang.legF_up = (q.ang.legF_up || 0) - th; q.ang.legB_up = (q.ang.legB_up || 0) - th;
  }
  function marche(q, k, t) {                                 // pas sur place (la scène déplace x) ; k 0..1
    if (!(k > 0)) return; const ph = t * TAU * (q.cadence || 1.2), s = Math.sin(ph), A = q.ang;
    A.legF_up = (A.legF_up || 0) + 0.32 * s * k; A.legB_up = (A.legB_up || 0) - 0.32 * s * k;
    A.legF_lo = (A.legF_lo || 0) + 0.42 * Math.max(0, Math.sin(ph - 1.3)) * k; A.legB_lo = (A.legB_lo || 0) + 0.42 * Math.max(0, Math.sin(ph + PI - 1.3)) * k;
    A.piedF = (A.piedF || 0) - 0.6 * (A.legF_up + A.legF_lo) * k; A.piedB = (A.piedB || 0) - 0.6 * (A.legB_up + A.legB_lo) * k;
    q.dy = (q.dy || 0) - Math.abs(Math.cos(ph)) * 5 * k;
    if (!has(q.tenu)) A.armF_up = (A.armF_up || 0) - 0.16 * s * k;
    if (!has(q.tenuB)) A.armB_up = (A.armB_up || 0) + 0.12 * s * k;
  }
  function assis(q, env, k) {                                // hanche posée sur un siège (q.siege = y écran du dessus du siège) ; pieds à plat
    if (!(k > 0)) return; const L = q._def._legs, A = q.ang, hip = -q._def.hipY;
    const seatH = q.siege != null ? (env.y - q.siege) / env.s + L.wt : L.sh + 25 + L.wt;
    q.dy = (q.dy || 0) + (hip - seatH) * k;
    const at = -1.48, need = seatH - 9 - 16, phi = Math.max(-0.72, -Math.acos(clamp(need / L.sh, -1, 1)));
    A.legF_up = (A.legF_up || 0) + at * k; A.legB_up = (A.legB_up || 0) + (at + 0.08) * k;
    A.legF_lo = (A.legF_lo || 0) + (phi - at) * k; A.legB_lo = (A.legB_lo || 0) + (phi - at - 0.08) * k;
    A.piedF = (A.piedF || 0) - phi * k; A.piedB = (A.piedB || 0) - phi * k;
    q.tilt = (q.tilt || 0) - 0.03 * k;
  }

  // ---------------- tête : œil (avec 'haut' et couleur d'iris), oreille teintée
  function oeil(f, x, y, sz, iris) {
    const e = f.eyes || 'open';
    if (e === 'haut') {
      fillPts([[x - 6 * sz, y], [x - 1 * sz, y - 3.8 * sz], [x + 5.5 * sz, y - 1.6 * sz], [x + 2.5 * sz, y + 1.8 * sz], [x - 4 * sz, y + 1 * sz]], '#efe8da', 0, 0);
      dot(x + 2.4 * sz, y - 2.2 * sz, 2.0 * sz, iris || '#2a1f1d'); if (iris) dot(x + 2.6 * sz, y - 2.4 * sz, 1 * sz, '#1a1214');
      strokePts([[x - 6.5 * sz, y + 0.3], [x - 1 * sz, y - 4.1 * sz], [x + 6 * sz, y - 1.8 * sz]], 'rgba(28,16,14,0.95)', 1.8); return;
    }
    X.eye(f, x, y, sz);
    if (iris && e !== 'closed') { const kk = e === 'wide' ? 1.45 : e === 'half' ? 0.55 : 1; dot(x + 2.3 * sz, y - 0.6 * sz * kk, 2.0 * sz * Math.min(1.15, kk), iris); dot(x + 2.5 * sz, y - 0.7 * sz * kk, 0.9 * sz, '#1a1214'); }
  }
  function oreille(x, y, col, colD) {
    fillPts([[x - 6, y - 9], [x + 3, y - 10], [x + 6, y - 2], [x + 4, y + 8], [x - 2, y + 11], [x - 7, y + 4]], col);
    strokePts([[x + 2, y - 6], [x - 3, y - 4], [x - 4, y + 3], [x + 1, y + 6]], colD, 1.1);
  }
  // boucles : contour festonné (n bosses) le long d'une ligne
  function festons(pts, amp, seed) { const o = []; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; o.push(p); const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], nx = -(q[1] - p[1]), ny = q[0] - p[0], l = Math.hypot(nx, ny) || 1; o.push([m[0] + nx / l * amp * (0.7 + 0.5 * H(i, seed)), m[1] + ny / l * amp * (0.7 + 0.5 * H(i, seed))]); } return o; }

  // =====================================================================
  // 4) MICHAEL ADULTE — très mince et élancé, peau brun moyen, fedora noir à ruban gris, boucles noires mi-longues, veste noire courte à sequins,
  //    chemise blanche, UN gant blanc pailleté (main avant), pantalon noir un peu court, chaussettes blanches, mocassins noirs.
  // =====================================================================
  const MI = { peau: '#8A5A3C', peauD: '#6E4630', chev: '#141012', chevL: '#3a3036', veste: '#26242c', vesteD: '#1c1a20', chem: '#ece8df', pant: '#17161b', pantD: '#111014',
    socq: '#f2efe8', socqD: '#cfcac0', mocas: '#0e0d10', chap: '#1E1E24', ruban: '#6e7078', gant: '#f1eee6', gantD: '#d4d0c6' };
  const MI_TORSO = [[-12, -178], [8, -180], [16, -170], [24, -152], [27, -120], [26, -80], [23, -40], [23, -6], [25, 14, 1], [-27, 16, 1], [-26, -10], [-27, -50], [-29, -100], [-29, -140], [-23, -166]];
  const MI_HEAD = [[-12, 16], [8, 16], [9, 4], [14, -2], [20, -6], [25, -12], [24, -18], [26, -22], [25, -26], [28, -31], [33, -38, 1], [29, -44], [26, -52], [26, -62], [23, -76], [12, -90], [-6, -96], [-24, -88], [-31, -68], [-30, -46], [-23, -27], [-15, -8]];
  const MI_HAIR = festons([[16, -76], [-2, -84], [-24, -86], [-38, -72], [-43, -50], [-45, -28], [-41, -6], [-33, 8], [-25, 2], [-22, -14], [-17, -28], [-14, -44], [-8, -58], [4, -70]], 4, 11);
  const MI_MECHE = [[16, -74], [24, -76], [28, -70], [27, -62], [23, -57], [20, -60], [23, -64], [22, -69], [18, -70]];
  const MI_HAT = [[-56, -75, 1], [-42, -78], [-30, -83], [-31, -98], [-28, -113], [-20, -123], [-8, -125], [2, -119], [12, -125], [24, -121], [30, -108], [31, -94], [30, -79], [44, -72], [60, -63, 1], [57, -59], [42, -63], [20, -70], [0, -74], [-22, -74], [-40, -71]];
  const MI_SOM = [2, -120];                                // sommet du fedora (repère de la tête) : base de la 1re couronne
  MJ.SOMMET = MI_SOM;
  const MI_L = { th: 122, sh: 112, hx: 5, wt: 13, kt: 10, ak: 7.5, fl: 44,
    cuisse: (b) => fillPts(rect(-30, -30, 30, 140), b ? MI.pantD : MI.pant),
    tibia: (b) => { fillPts(rect(-30, -30, 30, 140), b ? MI.pantD : MI.pant); fillPts(rect(-30, 94, 30, 140), b ? MI.socqD : MI.socq); strokePts([[-10, 94], [10, 94]], 'rgba(0,0,0,0.3)', 1.2); },
    pied: (b) => { fillPts(rect(-30, -20, 60, 40), MI.mocas); fillPts(rect(-20, -14, 14, 3), b ? MI.socqD : MI.socq); if (!b) { strokePts([[6, 5], [34, 8]], 'rgba(255,255,255,0.35)', 1.3); dot(18, 6, 2, 'rgba(200,200,210,0.6)'); } } };
  function miHatM(p) { const h = p._hat || { dx: 0, dy: 0, r: 0 }; return new DOMMatrix().translate(h.dx, h.dy).translate(0, -96).rotate(h.r * D).translate(0, 96); }
  const sequins = (p, x0, y0, x1, y1, sp, seed) => {
    const g = M.tg(p.t || 0);
    for (let y = y0, j = 0; y < y1; y += sp, j++) for (let x = x0 + (j % 2) * sp / 2, i = 0; x < x1; x += sp, i++) {
      const h = H(i + seed, j), a = 0.22 + 0.7 * Math.pow(Math.max(0, Math.sin(g * (2 + h * 2) + h * 40)), 10);
      dot(x, y, 1.3, `rgba(215,220,232,${a.toFixed(3)})`);
    }
  };
  function gantExtra(back, p, k, kind) {                        // paillettes du gant (main avant)
    if (back || SIL()) return; const g = M.tg(p.t || 0), ky = kind === 'open' ? 1 : 0.75;
    for (let i = 0; i < 4; i++) { const a = Math.pow(Math.max(0, Math.sin(g * (2.6 + i * 0.7) + i * 2.1)), 8); scint(k * (-4 + 4 * i % 9), k * (84 + i * 7 * ky), 4 + 3 * a, 0.9 * a); }
  }
  function mkMichael() {
    const L = MI_L;
    const parts = Object.assign(legParts(L, 8100), {
      torso: { parent: null, at: [0, 0], pts: MI_TORSO, base: MI.veste, seed: 8110, paint: (p) => {
        sequins(p, -30, -176, 28, 16, 6.5, 3);
        fillPts([[12, -176], [20, -168], [24, -150], [24, -40], [20, -36], [16, -150], [8, -170]], MI.chem);             // chemise blanche au bord avant
        fillPts([[4, -180], [16, -172], [22, -158], [12, -160], [6, -170]], MI.chem); strokePts([[16, -172], [22, -158]], 'rgba(0,0,0,0.25)', 1);
        strokePts([[16, -150], [18, -40]], 'rgba(0,0,0,0.35)', 1.2);
        fillPts(rect(-30, 6, 28, 16), '#0c0b0e'); dot(18, 11, 3, '#b8bec6');                                         // ceinture, boucle argent
        hatch([[-32, -176], [-12, -176], [-12, 16], [-32, 16]], 0.75, 4.2, 0.26); shade(24, -60, -28, -60, 0.32, [-32, -182, 30, 18]);
      } },
      armB_up: upDef([-10, -146], true, 8111, { wt: 12.5, manche: (b, p) => { fillPts(rect(-20, -20, 20, 110), MI.vesteD); sequins(p, -14, -14, 14, 100, 6.5, 9); } }),
      armB_lo: foreDef('armB_up', true, 8112, { manche: (b, p) => { fillPts(rect(-20, -20, 20, 80), MI.vesteD); sequins(p, -12, -8, 12, 60, 6.5, 13); }, main: () => MI.peauD, cuff: () => MI.chem }),
      bouclesB: { parent: 'head', at: [0, 0], noRivet: true, base: MI.chev, seed: 8113, pts: [[-20, -60], [-46, -40], [-52, -12], [-44, 14], [-30, 18], [-26, -20]], paint: () => hatch(null, 1, 3, 0.4) },
      head: { parent: 'torso', at: [6, -170], pts: MI_HEAD, base: MI.peau, seed: 8114, noRivet: true, paint: (p) => {
        const f = p.face || {}, wink = (p.clin || 0) > 0.35;
        strokePts([[22, -8], [16, 2], [8, 6]], 'rgba(60,30,20,0.4)', 1.1);                                             // mâchoire fine
        dot(16, -30, 7, 'rgba(160,80,60,0.22)');
        strokePts([[27, -31], [24, -27]], 'rgba(60,30,20,0.45)', 1.1);                                                  // aile du nez
        oeil(wink ? Object.assign({}, f, { eyes: 'closed' }) : f, 17, -50, 1.05);
        if (wink) strokePts([[10, -44], [17, -41], [24, -44]], 'rgba(60,30,20,0.5)', 1.1);
        X.brow(f, 17, -58, 'rgba(20,14,14,0.95)', 2.4);
        X.mouth(f, 25, -22, 'rgba(90,30,30,0.95)');
        hatch([[-24, -40], [0, -28], [10, -10], [-6, 16], [-28, 4]], 0.6, 3.6, 0.22);
      }, extra: (p) => { const cl = clamp(p.clin || 0); if (cl > 0.35 && cl < 1) scint(32, -56, 9 * Math.sin(PI * (cl - 0.35) / 0.65), 0.9); } },
      boucles: { parent: 'head', at: [0, 0], noRivet: true, base: MI.chev, seed: 8115, pts: MI_HAIR, paint: () => {
        for (let i = 0; i < 9; i++) { const x = -36 + (i % 3) * 9, y = -66 + Math.floor(i / 3) * 22; strokePts(ep(x, y, 5, 6, 8, 0, PI * 1.6), 'rgba(110,100,110,0.55)', 1.2); }
        hatch(null, 1.1, 3, 0.3);
      } },
      meche: { parent: 'head', at: [0, 0], noRivet: true, base: MI.chev, seed: 8116, pts: MI_MECHE, paint: () => strokePts([[24, -72], [26, -64], [22, -60]], 'rgba(120,110,120,0.6)', 1) },
      hat: { parent: 'head', at: [0, 0], noRivet: true, base: MI.chap, seed: 8117, pts: (p) => MI_HAT.map((pt) => { const v = mp(miHatM(p), pt); return pt[2] ? [v[0], v[1], 1] : v; }), paint: (p) => {
        const c = cx_(), m = miHatM(p); c.save(); c.transform(m.a, m.b, m.c, m.d, m.e, m.f);
        fillPts([[-31, -82], [30, -79], [30, -90], [-31, -93]], MI.ruban); strokePts([[-30, -91], [30, -88]], 'rgba(255,255,255,0.25)', 1);
        strokePts([[-54, -75], [-30, -80], [30, -76], [58, -63]], 'rgba(255,255,255,0.22)', 1.4);
        strokePts([[-6, -122], [2, -116], [10, -122]], 'rgba(255,255,255,0.16)', 1.4);
        hatch([[-32, -126], [-10, -126], [-10, -80], [-32, -80]], 0.8, 3.4, 0.3); shade(30, -100, -30, -100, 0.3, [-60, -130, 64, -58]);
        c.restore();
      } },
      couronnes: { parent: 'head', at: MI_SOM, noRivet: true, base: '#000', seed: 8118, pts: OFFP, extra: (p) => {
        const L2 = Array.isArray(p.couronnes) ? p.couronnes : p.couronnes ? [p.couronnes] : []; if (!L2.length) return;
        const cs = p.couronneS || 0.8, c = cx_();
        L2.forEach((mt, i) => { c.save(); c.translate(0, -i * MJ.STEP * cs); c.scale(cs, cs); drawCouronne({ metal: mt, t: p.t, eclat: p.eclat, ph: i * 0.37 }); c.restore(); });
      } },
      armF_up: upDef([-2, -146], false, 8119, { wt: 12.5, manche: (b, p) => { fillPts(rect(-20, -20, 20, 110), MI.veste); sequins(p, -14, -14, 14, 100, 6.5, 21); } }),
      armF_lo: foreDef('armF_up', false, 8120, { manche: (b, p) => { fillPts(rect(-20, -20, 20, 80), MI.veste); sequins(p, -12, -8, 12, 60, 6.5, 27); }, main: () => MI.gant, cuff: () => MI.chem, extra: gantExtra }),
    });
    return defOf('michael', parts, G_ADULTE, MI.gant, MI.peauD, 8140, ORDER(['bouclesB', 'head', 'boucles', 'meche', 'hat', 'couronnes']), -(L.th + L.sh + 14), { _legs: L });
  }
  CH.mjMichael = mkMichael();
  MJ.GLISSE = 92;                                            // vitesse de la marche arrière glissée : px/s × s (déplacer x de −dir·92·s par seconde)
  function miAdulte(q, loc, env) {
    const A = q.ang, f = q.face, t = q.t || 0, g = M.tg(t), L = MI_L;
    expr(q, q.expr);
    const k = (v) => ease(clamp(v === true ? 1 : v || 0));
    const gl = clamp(q.glisse === true ? 1 : q.glisse || 0), mar = clamp(q.marche === true ? 1 : q.marche || 0), po = k(q.pointe), sa = clamp(q.salut || 0), rh = k(q.regardeHaut),
      pe = k(q.perplexe), co = clamp(q.couronne === true ? 1 : q.couronne || 0), as = k(q.assis), cl = clamp(q.clin || 0), inc = k(q.incline);
    if (as > 0) { assis(q, env, as); blend(q, 'armF_up', -0.55, as); blend(q, 'armF_lo', -0.75, as); blend(q, 'armB_up', -0.45, as); blend(q, 'armB_lo', -0.7, as); }
    if (inc > 0) { plier(q, 0.3 * inc); A.head = (A.head || 0) + 0.2 * inc; blend(q, 'armB_up', -0.25, inc); blend(q, 'armB_lo', -1.2, inc); }
    if (mar > 0) marche(q, mar, t);
    if (gl > 0) {                                                // marche arrière glissée : un genou plié (talon à peine levé), l'autre jambe tendue qui glisse
      const ph = t * TAU * (q.cadence || 0.85), w = Math.sin(ph);
      for (const [n, b] of [['F', Math.max(0, w)], ['B', Math.max(0, -w)]]) {
        const bb = smoothK(b), up = -0.30 * bb + 0.08 * (1 - bb), lo = 0.6 * bb;
        A['leg' + n + '_up'] = (A['leg' + n + '_up'] || 0) + up * gl; A['leg' + n + '_lo'] = (A['leg' + n + '_lo'] || 0) + lo * gl;
        A['pied' + n] = (A['pied' + n] || 0) + (0.12 * bb - (up + lo)) * gl;
      }
      q.tilt = (q.tilt || 0) + 0.035 * gl; q.dy = (q.dy || 0) + 4 * Math.abs(w) * gl;
      blend(q, 'armF_up', -0.4 + 0.06 * w, gl); blend(q, 'armF_lo', -0.75, gl); blend(q, 'armB_up', -0.1 - 0.06 * w, gl); blend(q, 'armB_lo', -0.45, gl);
      A.head = (A.head || 0) + 0.06 * gl;
    }
    if (po > 0) {                                                // sur la pointe des pieds, bras levés en V
      const th = 1.12 * po;
      A.piedF = (A.piedF || 0) + th; A.piedB = (A.piedB || 0) + th;
      q.dy = (q.dy || 0) - (L.fl * Math.sin(th) + 14 * Math.cos(th) - 14);
      blend(q, 'armF_up', -2.2, po); blend(q, 'armF_lo', -0.2, po); blend(q, 'armB_up', -2.8, po); blend(q, 'armB_lo', -0.15, po);
      q.handF = 'open'; q.handB = 'open'; A.head = (A.head || 0) - 0.16 * po; if (!f.brow) f.brow = 'up'; if (!f.mouth) f.mouth = 'o';
    }
    if (sa > 0) {                                                // soulève le fedora : la main prend le bord avant puis lève le chapeau
      const a = ease(clamp(sa / 0.45)), b = ease(clamp((sa - 0.45) / 0.55));
      q._hat = { dx: 4 * b, dy: -46 * b, r: -0.3 * b };
      const Br = mp(miHatM(q), [50, -67]), P = headPt(q, Br[0] - 2, Br[1] + 9);
      armTo(q, 'armF', P, a); q.handF = 'fist'; A.head = (A.head || 0) + 0.08 * b; if (!f.mouth) f.mouth = 'smile';
    }
    if (rh > 0) { A.head = (A.head || 0) - 0.42 * rh; if (!f.eyes) f.eyes = 'haut'; if (!f.brow) f.brow = 'up'; q.tilt = (q.tilt || 0) - 0.02 * rh; }
    if (pe > 0) {                                                // perplexe : poing sous le menton, tête penchée
      A.head = (A.head || 0) + 0.14 * pe; const Cn = headPt(q, 14, 12);
      armTo(q, 'armF', [Cn[0] + 8, Cn[1] + 14], pe); q.handF = 'fist';
      if (!f.brow) f.brow = 'worry'; if (!f.mouth) f.mouth = 'tight'; if (!f.eyes) f.eyes = 'half';
    }
    if (co > 0) {                                                // se pose la couronne à deux mains : devant la poitrine → haut devant → au-dessus du chapeau → posée
      if (q.tenu == null) q.tenu = 'couronne';
      if (q.deuxMains == null) q.deuxMains = true;
      const oo = heldOpts(q.tenu, q.tenuO, q), Sm = headPt(q, MI_SOM[0], MI_SOM[1]);
      const P0 = [58, -100], Pm = [52, -280], P1 = [Sm[0], Sm[1] - 24], P2 = Sm;
      let B = co < 0.5 ? [lerp(P0[0], Pm[0], ease(co / 0.5)), lerp(P0[1], Pm[1], ease(co / 0.5))]
        : co < 0.8 ? [lerp(Pm[0], P1[0], ease((co - 0.5) / 0.3)), lerp(Pm[1], P1[1], ease((co - 0.5) / 0.3))] : [lerp(P1[0], P2[0], ease((co - 0.8) / 0.2)), lerp(P1[1], P2[1], ease((co - 0.8) / 0.2))];
      armTo(q, 'armF', gripFor(q.tenu, oo, 'base', B, 0), 1);
      const up = smoothK((co - 0.25) / 0.35) * (1 - smoothK((co - 0.85) / 0.15));
      A.head = (A.head || 0) - 0.22 * up; if (!f.eyes && up > 0.3) f.eyes = 'haut'; if (!f.mouth) f.mouth = co > 0.9 ? 'smile' : 'n';
    }
    if (cl > 0) { if (!f.mouth) f.mouth = 'smile'; A.head = (A.head || 0) - 0.05 * Math.sin(cl * PI); }
    if (!f.mouth) f.mouth = 'smile';
    A.couronnes = (A.couronnes || 0) - 0.85 * ((A.head || 0) + (q.tilt || 0));       // la pile de couronnes reste presque droite
    if (q.respire !== false && !(gl > 0)) q.dy = (q.dy || 0) + 1.2 * Math.sin(g * 1.7);
  }

  // =====================================================================
  // 5) MICHAEL ENFANT (option age:'enfant') — afro ronde noire, chemise ocre à grand col pointu, gilet fuchsia éteint, pattes d'éléphant brunes
  // =====================================================================
  const EN = { peau: '#8A5A3C', peauD: '#6E4630', chem: C.ocre, chemD: C.ocreD, col: '#e8dcc0', gilet: C.fuchsia, giletD: C.fuchsiaD, pant: '#6a4a32', pantD: '#523826', chaus: '#1e1612', afro: '#151012' };
  const EN_TORSO = [[-10, -120], [6, -122], [14, -112], [22, -96], [25, -70], [25, -40], [24, -10], [24, 12, 1], [-27, 14, 1], [-28, -10], [-29, -50], [-29, -80], [-26, -102], [-19, -116]];
  const EN_HEAD = [[-12, 14], [8, 14], [10, 2], [16, -6], [22, -12], [24, -18], [23, -24], [26, -30], [30, -34, 1], [26, -40], [24, -50], [24, -62], [18, -78], [4, -88], [-14, -90], [-28, -80], [-34, -60], [-32, -38], [-24, -20], [-16, -4]];
  const EN_AFRO = festons(ep(-14, -66, 52, 46, 14, -0.15, -PI * 1.32).concat([[-30, -10], [-20, -26], [-10, -46], [4, -64], [20, -70]]), 5, 3);
  const enLegUp = () => ep(0, 0, 13, 13, 10, PI, TAU).concat([[12, 34], [10.5, 66]], ep(0, 70, 10, 10, 10, 0, PI), [[-10.5, 66], [-13, 34]]);
  const enLegLo = () => ep(0, 0, 10, 10, 10, PI, TAU).concat([[10, 30], [15, 52], [26, 64], [34, 72], [33, 80, 1], [-18, 80, 1], [-17, 62], [-11, 36]]);
  function enLeg(back) {
    const up = { parent: 'torso', at: [back ? -5 : 5, -2], pts: enLegUp(), base: '#000', seed: 8200 + (back ? 1 : 2), noRivet: !!back, paint: () => {
      fillPts(rect(-20, -20, 20, 90), back ? EN.pantD : EN.pant); hatch(null, 0.8, 3.6, back ? 0.3 : 0.18); DARK(back); } };
    const lo = { parent: back ? 'legB' : 'legF', at: [0, 70], pts: enLegLo(), base: '#000', seed: 8203 + (back ? 1 : 2), paint: () => {
      fillPts(rect(-24, -20, 40, 90), back ? EN.pantD : EN.pant); fillPts([[12, 72], [34, 72], [34, 82], [12, 82]], EN.chaus);
      for (const x of [-8, 6]) strokePts([[x * 0.6, 4], [x * 1.4, 76]], 'rgba(30,20,10,0.35)', 1.1); DARK(back); } };
    return [up, lo];
  }
  function mkEnfant() {
    const [legB, legB_lo] = enLeg(true), [legF, legF_lo] = enLeg(false);
    const manche = (b) => fillPts(rect(-20, -20, 20, 80), b ? EN.chemD : EN.chem);
    const parts = {
      torso: { parent: null, at: [0, 0], pts: EN_TORSO, base: EN.chem, seed: 8210, paint: () => {
        fillPts([[16, -100], [24, -70], [25, -10], [24, 12], [-27, 14], [-28, -10], [-29, -50], [-28, -88], [-20, -110], [4, -112], [10, -60], [14, -80]], EN.gilet);   // gilet ouvert
        strokePts([[14, -80], [10, -60], [8, 10]], EN.giletD, 1.6); for (const y of [-50, -26]) dot(11, y, 2.2, '#e0c080');
        fillPts([[2, -122], [14, -112], [22, -86], [10, -100], [4, -112]], EN.col); strokePts([[14, -112], [22, -86]], 'rgba(0,0,0,0.3)', 1);   // grand col pointu
        fillPts(rect(-30, 6, 26, 14), '#3a2418'); dot(16, 10, 2.6, '#c9a24a');
        hatch([[-36, -116], [-10, -116], [-10, 56], [-36, 56]], 0.75, 4, 0.22); shade(24, -30, -30, -30, 0.22, [-46, -130, 46, 20]);
      } },
      legB, legB_lo, legF, legF_lo,
      armB_up: upDef([-8, -98], true, 8211, { LA: 64, wt: 10.5, rc: 8.5, manche }),
      armB_lo: foreDef('armB_up', true, 8212, { k: 0.68, LA: 64, manche, main: () => EN.peauD, cuff: () => EN.col }),
      head: { parent: 'torso', at: [4, -114], pts: EN_HEAD, base: EN.peau, seed: 8213, noRivet: true, paint: (p) => {
        const f = p.face || {};
        oreille(-10, -40, EN.peauD, 'rgba(50,25,15,0.6)');
        dot(16, -24, 7, 'rgba(170,90,70,0.25)');
        oeil(f, 14, -46, 1.12); X.brow(f, 14, -54, 'rgba(20,14,14,0.9)', 2);
        if (f.mouth === 'o') fillPts(ell(22, -20, 3.6, 4.4, 8), '#3a1714', 0, 0); else X.mouth(Object.assign({ mouth: 'smile' }, f), 23, -20, 'rgba(80,30,30,0.95)');
        hatch([[-22, -38], [0, -26], [8, -8], [-6, 14], [-28, 2]], 0.6, 3.6, 0.2);
      } },
      afro: { parent: 'head', at: [0, 0], noRivet: true, base: EN.afro, seed: 8214, pts: EN_AFRO, paint: () => {
        for (let i = 0; i < 14; i++) { const a = H(i, 5) * TAU, r = 10 + H(i, 6) * 34; strokePts(ep(-16 + Math.cos(a) * r, -70 + Math.sin(a) * r * 0.8, 4, 4, 6, 0, PI * 1.5), 'rgba(110,100,110,0.45)', 1.1); }
        hatch(null, 1, 3, 0.3); shade(20, -110, -50, -30, 0.25, [-70, -120, 40, 0]);
      } },
      armF_up: upDef([-2, -98], false, 8215, { LA: 64, wt: 10.5, rc: 8.5, manche }),
      armF_lo: foreDef('armF_up', false, 8216, { k: 0.68, LA: 64, manche, main: () => EN.peau, cuff: () => EN.col }),
    };
    return defOf('michaelEnfant', parts, G_ENF, EN.peau, EN.peauD, 8240, ['armB_up', 'armB_lo', 'legB', 'legB_lo', 'legF', 'legF_lo', 'head', 'afro', 'torso'].concat(TAIL), -150);
  }
  CH.mjEnfant = mkEnfant();
  function miEnfant(q, loc, env) {
    const A = q.ang, f = q.face, t = q.t || 0, g = M.tg(t);
    expr(q, q.expr);
    const ch = ease(clamp(q.chante === true ? 1 : q.chante || 0)), da = clamp(q.danse === true ? 1 : q.danse || 0), mar = clamp(q.marche === true ? 1 : q.marche || 0);
    if (mar > 0) { const w = Math.sin(t * TAU * (q.cadence || 1.4)); A.legF = (A.legF || 0) - 0.34 * w * mar; A.legB = (A.legB || 0) + 0.34 * w * mar;
      A.legF_lo = (A.legF_lo || 0) + 0.3 * Math.max(0, -w) * mar; A.legB_lo = (A.legB_lo || 0) + 0.3 * Math.max(0, w) * mar; q.dy = (q.dy || 0) - Math.abs(Math.cos(t * TAU * 1.4)) * 5 * mar;
      if (!has(q.tenu)) A.armF_up = (A.armF_up || 0) + 0.14 * w * mar; A.armB_up = (A.armB_up || 0) - 0.12 * w * mar; }
    if (da > 0) {                                                // danse : genou levé en alternance, bras qui balancent, petit saut
      const ph = g * TAU * 1.1, w = Math.sin(ph), h = Math.abs(w);
      A.legF = (A.legF || 0) - 0.55 * Math.max(0, w) * da; A.legF_lo = (A.legF_lo || 0) + 0.7 * Math.max(0, w) * da;
      A.legB = (A.legB || 0) - 0.5 * Math.max(0, -w) * da; A.legB_lo = (A.legB_lo || 0) + 0.65 * Math.max(0, -w) * da;
      q.dy = (q.dy || 0) - 9 * h * da; A.head = (A.head || 0) - 0.08 * w * da;
      if (!(ch > 0)) { blend(q, 'armF_up', -1.3 - 0.6 * w, da); blend(q, 'armF_lo', -0.9, da); q.handF = 'open'; }
      blend(q, 'armB_up', -1.0 + 0.6 * w, da); blend(q, 'armB_lo', -1.0, da); q.handB = 'open';
      if (!f.mouth) f.mouth = 'smile';
    }
    if (ch > 0) {                                                // chante : micro à hauteur de bouche, tête du micro inclinée vers la bouche
      if (q.tenu == null) { q.tenu = 'micro'; if (q.tenuO.couleur == null) q.tenuO.couleur = 'chrome'; if (q.tenuO.echelle == null) q.tenuO.echelle = 0.72; }
      const oo = heldOpts(q.tenu, q.tenuO, q), Mo = headPt(q, 30, -20);
      A.objet = (A.objet || 0) - 0.5 * ch;
      armTo(q, 'armF', gripFor(q.tenu, oo, 'tete', [Mo[0] + 8, Mo[1] + 2], -0.5), ch);
      if (!(da > 0)) { blend(q, 'armB_up', -0.9, ch); blend(q, 'armB_lo', -0.9, ch); q.handB = 'open'; }
      A.head = (A.head || 0) - 0.12 * ch; if (!f.mouth) f.mouth = Math.sin(g * 9) > -0.2 ? 'o' : 'smile'; if (!f.eyes) f.eyes = 'half';
    }
    if (q.respire !== false && !(da > 0)) q.dy = (q.dy || 0) + 1.1 * Math.sin(g * 2.3);
  }
  MJ.michael = wrap((p) => (p.age === 'enfant' ? 'mjEnfant' : 'mjMichael'), function (q, loc, env) { if (q.age === 'enfant') miEnfant(q, loc, env); else miAdulte(q, loc, env); },
    (p) => (p.age === 'enfant' ? 0.85 : 0.9));
  // point écran où poser la BASE de la couronne n° n (0 = directement sur le fedora, 1 = sur la 1re couronne…)
  MJ.sommet = function (r, n) { const cs = (r.q && r.q.couronneS) || 0.8; return r.w('couronnes', 0, -(n || 0) * MJ.STEP * cs); };

  // =====================================================================
  // 5b) LES QUATRE FRÈRES (Jackson Five, années 60) — MJ.frere(n, pose, x, y, s, o), n = 1..4. Mêmes gestes que Michael enfant + claque, balance, penche.
  //     Chacun sa peau, son afro, sa taille et sa tenue entière (aucun clone).
  // =====================================================================
  const FR = [null,
    { peau: '#7A4B30', haut: '#5e7556', hautD: '#4a5e44', col: '#efe8da', gilet: true, chem: '#efe8da', chemD: '#cfc6b2', pant: '#6e6e72', pantD: '#56565a', chaus: '#1e1612', ax: 46, ay: 42, flare: false, s: 0.92 },
    { peau: '#8A5A3C', haut: '#4f6a8a', hautD: '#3d5572', col: '#f2eee6', gilet: false, chem: '#4f6a8a', chemD: '#3d5572', pant: '#2e3a56', pantD: '#232c42', chaus: '#3a2418', ax: 58, ay: 50, flare: true, s: 0.88 },
    { peau: '#6B4128', haut: C.ocre, hautD: C.ocreD, col: C.ocre, gilet: false, roule: true, chem: C.ocre, chemD: C.ocreD, pant: '#4a4a36', pantD: '#3a3a2a', chaus: '#1a1410', ax: 38, ay: 36, flare: false, s: 0.93 },
    { peau: '#94643F', haut: '#6e1e28', hautD: '#52141c', col: '#e6dcc4', gilet: true, chem: '#e6dcc4', chemD: '#c8bea6', pant: '#cfc2a3', pantD: '#b0a486', chaus: '#4a2a1a', ax: 52, ay: 44, flare: true, s: 0.8 }];
  function frLeg(F, back, n) {
    const up = { parent: 'torso', at: [back ? -5 : 5, -2], pts: enLegUp(), base: '#000', seed: 8600 + n * 10 + (back ? 1 : 2), noRivet: !!back, paint: () => {
      fillPts(rect(-20, -20, 20, 90), back ? F.pantD : F.pant); hatch(null, 0.8, 3.6, back ? 0.3 : 0.18); DARK(back); } };
    const lo = { parent: back ? 'legB' : 'legF', at: [0, 70], pts: F.flare ? enLegLo() : ep(0, 0, 10, 10, 10, PI, TAU).concat([[10, 40], [9, 62], [24, 66], [32, 72], [31, 80, 1], [-12, 80, 1], [-12, 64], [-10, 40]]), base: '#000', seed: 8603 + n * 10 + (back ? 1 : 2), paint: () => {
      fillPts(rect(-24, -20, 40, 90), back ? F.pantD : F.pant); fillPts([[F.flare ? 12 : 6, F.flare ? 72 : 64], [40, F.flare ? 72 : 64], [40, 84], [F.flare ? 12 : -14, 84]], F.chaus);
      strokePts([[4, 4], [5, 60]], 'rgba(30,20,10,0.3)', 1.1); DARK(back); } };
    return [up, lo];
  }
  function mkFrere(n) {
    const F = FR[n], pD = mixA(F.peau, '#000000', 0.18), [legB, legB_lo] = frLeg(F, true, n), [legF, legF_lo] = frLeg(F, false, n);
    const manche = (b) => fillPts(rect(-20, -20, 20, 80), b ? F.chemD : F.chem);
    const afro = festons(ep(-12, -60 - (F.ay - 40) * 0.5, F.ax, F.ay, 14, -0.15, -PI * 1.32).concat([[-30, -10], [-20, -26], [-10, -46], [4, -64], [20, -70]]), 4 + n % 2, 5 + n);
    const parts = {
      torso: { parent: null, at: [0, 0], pts: EN_TORSO, base: F.chem, seed: 8610 + n * 10, paint: () => {
        if (F.gilet) { fillPts([[16, -100], [24, -70], [25, -10], [24, 12], [-27, 14], [-28, -10], [-29, -50], [-28, -88], [-20, -110], [4, -112], [10, -60], [14, -80]], F.haut);
          strokePts([[14, -80], [10, -60], [8, 10]], F.hautD, 1.6); for (const y of [-50, -30, -10]) dot(11, y, 2, '#d8d0bc'); }
        else if (F.roule) { fillPts(rect(-14, -124, 14, -108), F.hautD); for (let y = -96; y < 10; y += 8) strokePts([[-28, y], [24, y]], 'rgba(60,40,10,0.25)', 1); }
        else { for (const y of [-90, -60, -30]) dot(20, y, 2, '#e8e2d4'); strokePts([[20, -112], [21, 8]], F.hautD, 1.4); }
        if (!F.roule) { fillPts([[2, -122], [14, -112], F.gilet ? [20, -92] : [24, -98], [10, -102], [4, -112]], F.col); strokePts([[14, -112], [20, -94]], 'rgba(0,0,0,0.3)', 1); }
        fillPts(rect(-30, 6, 26, 14), '#2a1c14'); dot(16, 10, 2.4, '#b8bec6');
        hatch([[-36, -116], [-10, -116], [-10, 56], [-36, 56]], 0.75, 4, 0.22); shade(24, -30, -30, -30, 0.22, [-46, -130, 46, 20]);
      } },
      legB, legB_lo, legF, legF_lo,
      armB_up: upDef([-8, -98], true, 8611 + n * 10, { LA: 64, wt: 10.5, rc: 8.5, manche }),
      armB_lo: foreDef('armB_up', true, 8612 + n * 10, { k: 0.68, LA: 64, manche, main: () => pD, cuff: () => (F.roule ? null : F.col) }),
      head: { parent: 'torso', at: [4, -114], pts: EN_HEAD, base: F.peau, seed: 8613 + n * 10, noRivet: true, paint: (p) => {
        const f = p.face || {};
        oreille(-10, -40, pD, 'rgba(50,25,15,0.6)'); dot(16, -24, 7, 'rgba(170,90,70,0.22)');
        oeil(f, 14, -46, n === 3 ? 1 : 1.1); X.brow(f, 14, n === 2 ? -55 : -54, 'rgba(20,14,14,0.9)', n === 1 ? 2.6 : 2);
        if (f.mouth === 'o') fillPts(ell(22, -20, 3.6, 4.4, 8), '#3a1714', 0, 0); else X.mouth(Object.assign({ mouth: 'smile' }, f), 23, -20, 'rgba(80,30,30,0.95)');
        if (n === 4) strokePts([[16, -36], [20, -31]], 'rgba(40,20,10,0.4)', 1.1);
        hatch([[-22, -38], [0, -26], [8, -8], [-6, 14], [-28, 2]], 0.6, 3.6, 0.2);
      } },
      afro: { parent: 'head', at: [0, 0], noRivet: true, base: '#151012', seed: 8614 + n * 10, pts: afro, paint: () => {
        for (let i = 0; i < 12; i++) { const a = H(i, n) * TAU, r = 8 + H(i, n + 9) * F.ax * 0.6; strokePts(ep(-14 + Math.cos(a) * r, -66 + Math.sin(a) * r * 0.8, 4, 4, 6, 0, PI * 1.5), 'rgba(110,100,110,0.45)', 1.1); }
        hatch(null, 1, 3, 0.3); shade(20, -110, -50, -30, 0.25, [-80, -130, 50, 0]);
      } },
      armF_up: upDef([-2, -98], false, 8615 + n * 10, { LA: 64, wt: 10.5, rc: 8.5, manche }),
      armF_lo: foreDef('armF_up', false, 8616 + n * 10, { k: 0.68, LA: 64, manche, main: () => F.peau, cuff: () => (F.roule ? null : F.col) }),
    };
    return defOf('frere' + n, parts, G_ENF, F.peau, pD, 8640 + n * 10, ['armB_up', 'armB_lo', 'legB', 'legB_lo', 'legF', 'legF_lo', 'head', 'afro', 'torso'].concat(TAIL), -150);
  }
  for (let n = 1; n <= 4; n++) CH['mjFrere' + n] = mkFrere(n);
  const frN = (p) => Math.max(1, Math.min(4, Math.round(p._n || 1)));
  const frereFn = wrap((p) => 'mjFrere' + frN(p), function (q, loc, env) {
    const A = q.ang, f = q.face, g = M.tg(q.t || 0) + frN(q) * 0.9;
    const cq = ease(clamp(q.claque === true ? 1 : q.claque || 0)), ba = clamp(q.balance === true ? 1 : q.balance || 0), pe = ease(clamp(q.penche === true ? 1 : q.penche || 0));
    if (ba > 0) { const w = Math.sin(g * TAU * 0.9); q.tilt = (q.tilt || 0) + 0.06 * w * ba; A.head = (A.head || 0) - 0.08 * w * ba; blend(q, 'armF_up', -0.25 + 0.2 * w, ba); blend(q, 'armB_up', -0.15 - 0.2 * w, ba); blend(q, 'armF_lo', -0.6, ba); blend(q, 'armB_lo', -0.6, ba); if (!f.mouth) f.mouth = 'smile'; }
    if (pe > 0) { q.tilt = (q.tilt || 0) + 0.15 * pe; A.head = (A.head || 0) + 0.08 * pe; blend(q, 'armB_up', -0.4, pe); blend(q, 'armB_lo', -0.7, pe); }
    miEnfant(q, loc, env);
    if (cq > 0) { const s = Math.abs(Math.sin(g * 7.5)); armTo(q, 'armF', [44 + 10 * s, -96 - 3 * s], cq); armTo(q, 'armB', [36 - 4 * s, -94], cq); q.handF = 'open'; q.handB = 'open'; if (!f.mouth) f.mouth = 'smile'; }
  }, (p) => FR[frN(p)].s);
  // MJ.frere(n, pose, x, y, s, o) : n = 1..4 ; s par défaut = taille propre au frère (0,92 / 0,88 / 0,93 / 0,80 ; Michael enfant 0,85)
  MJ.frere = (n, pose, x, y, s, o) => frereFn(Object.assign({}, pose, { _n: n }), x, y, s, o);
  MJ.frere.pose = (n, pose, x, y, s, dir) => frereFn.pose(Object.assign({}, pose, { _n: n }), x, y, s, dir);
  MJ.frere.def = (n) => CH['mjFrere' + n];

  // =====================================================================
  // 6) ELIZABETH TAYLOR — cheveux noirs courts très volumineux (années 80), sourcils noirs marqués, yeux violets, robe longue violette à épaulettes,
  //    collier de diamants (scintille), boucles d'oreilles, châle argent. Robe jusqu'au sol : pas de jambes (seulement la pointe des souliers).
  // =====================================================================
  const TA = { peau: '#ecc9ae', peauD: '#cfa88c', chev: '#141016', chevL: '#3c3444', robe: C.violet, robeD: C.violetD, robeL: C.violetL, chale: '#c3c7ce', chaleD: '#9ba0a8', levres: '#9a2a3a', iris: '#8a58c0', soulier: '#b8bec6' };
  const TA_TORSO = [[-14, -176], [8, -178], [16, -170], [30, -160, 1], [30, -142], [28, -120], [22, -86], [18, -48], [22, -6], [30, 60], [44, 150], [62, 232, 1], [-58, 234, 1], [-44, 150], [-34, 60], [-28, -6], [-24, -46], [-28, -90], [-32, -130], [-37, -158, 1], [-26, -170]];
  const TA_HEAD = [[-12, 16], [8, 16], [9, 4], [14, -2], [19, -6], [23, -11], [22, -16], [25, -20], [24, -24], [27, -29], [31, -36, 1], [27, -42], [25, -50], [25, -60], [22, -74], [10, -88], [-8, -94], [-24, -86], [-30, -66], [-30, -44], [-23, -26], [-15, -8]];
  const TA_HAIR = [[22, -62], [30, -76], [31, -94], [22, -112], [4, -126], [-10, -138, 1], [-16, -127], [-32, -132, 1], [-38, -119], [-56, -116, 1], [-57, -103], [-72, -92, 1], [-64, -79], [-74, -62, 1], [-63, -53], [-64, -38], [-54, -30], [-47, -34], [-42, -20, 1], [-33, -30], [-26, -42], [-20, -54], [-10, -62], [2, -68], [14, -66]];
  const DIAM = (() => { const o = []; for (let i = 0; i < 9; i++) { const u = i / 8; o.push([lerp(-8, 21, u), -171 + 18 * u + 6 * Math.sin(u * PI)]); } return o; })();
  function mkTaylor() {
    const manche = (b) => { fillPts(rect(-24, -24, 24, 110), b ? TA.robeD : TA.robe); strokePts([[6, -10], [5, 90]], 'rgba(255,255,255,0.12)', 2); };
    const chaleM = (b, p) => { fillPts(rect(-24, -24, 24, 110), b ? TA.robeD : TA.robe); fillPts([[-24, -24], [24, -24], [24, 70], [10, 84], [-6, 74], [-24, 86]], b ? TA.chaleD : TA.chale);
      for (const x of [-12, 0, 12]) strokePts([[x, -16], [x - 2, 72]], 'rgba(90,95,105,0.5)', 1.1); const g = M.tg(p.t || 0), u = fr(g / 2.6 + (b ? 0.5 : 0)); scint(-6 + 12 * u, lerp(-10, 70, u), 4, 0.6 * Math.sin(u * PI)); };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: TA_TORSO, base: TA.robe, seed: 8310, paint: (p) => {
        fillPts([[-8, -178], [10, -178], [18, -168], [16, -154], [2, -150], [-8, -162]], TA.peau);                              // décolleté
        for (let i = 0; i < 7; i++) strokePts(qbez([-30 + i * 12, -4], [-34 + i * 14, 100], [-50 + i * 18, 232], 8), 'rgba(30,14,40,0.3)', 1.3);
        strokePts(qbez([16, -40], [34, 90], [56, 230], 8), 'rgba(220,190,240,0.3)', 3);
        fillPts([[-24, -50], [20, -50], [19, -40], [-25, -40]], TA.robeD); dot(10, -45, 4, C.argent);                          // ceinture, fermoir
        // châle argent : sur le dos et l'épaule
        fillPts([[-26, -170], [-12, -166], [-30, -100], [-36, -40], [-44, 30], [-58, 30], [-46, -60], [-40, -130]], TA.chale);
        for (let i = 0; i < 4; i++) strokePts([[-30 + i * 3, -150], [-50 + i * 3, 20]], 'rgba(90,95,105,0.45)', 1.1);
        hatch([[-60, -170], [-20, -170], [-20, 232], [-60, 232]], 0.75, 4.2, 0.24); shade(28, -40, -40, -40, 0.3, [-62, -182, 66, 236]);
      }, extra: (p) => {                                                                                                      // collier de diamants qui scintille
        const g = M.tg(p.t || 0);
        if (!SIL()) { for (let i = 0; i < DIAM.length; i++) { const [x, y] = DIAM[i]; dot(x, y, 2.6, '#f4f6fa'); dot(x - 0.6, y - 0.6, 1, '#ffffff'); }
          dot(DIAM[5][0] + 1, DIAM[5][1] + 7, 4, '#eaf0f8'); dot(DIAM[5][0], DIAM[5][1] + 6, 1.4, '#ffffff'); }
        for (let i = 0; i < 3; i++) { const a = Math.pow(Math.max(0, Math.sin(g * (2.2 + i * 0.6) + i * 2.4)), 10), d = DIAM[(i * 3 + 1) % DIAM.length]; scint(d[0], d[1], 4 + 5 * a, 0.95 * a); }
        // éclat du châle
        const u = fr(g / 3.4); if (u < 0.5) scint(-34, lerp(-140, 10, u * 2), 5, 0.5 * Math.sin(u * 2 * PI));
      } },
      souliers: { parent: 'torso', at: [0, 0], noRivet: true, base: TA.soulier, seed: 8311, pts: (p) => (p._pointe ? [[36, 222], [56, 222], [60, 254], [52, 256, 1], [40, 236]] : [[34, 226], [58, 226], [72, 236, 1], [36, 238, 1]]), paint: () => strokePts([[40, 230], [60, 232]], 'rgba(255,255,255,0.5)', 1.2) },
      armB_up: upDef([-10, -146], true, 8312, { wt: 15, manche: chaleM }),
      armB_lo: foreDef('armB_up', true, 8313, { manche, main: () => TA.peauD, cuff: () => '#e8ecf2' }),
      head: { parent: 'torso', at: [6, -170], pts: TA_HEAD, base: TA.peau, seed: 8314, noRivet: true, paint: (p) => {
        const f = p.face || {};
        dot(15, -27, 8, 'rgba(210,110,110,0.28)');
        oeil(f, 16, -50, 1.12, TA.iris);
        if ((f.eyes || 'open') !== 'closed') for (const d of [0, 3, 6]) strokePts([[9 + d, -53 - (d > 2 ? 0.5 : 0)], [8 + d * 1.2, -57]], '#141016', 1);   // cils
        else strokePts([[10, -49], [16, -47], [22, -49]], '#141016', 1.6);
        X.brow(f, 16, -60, '#141016', 3.6);
        const m = f.mouth || 'smile';
        if (m === 'o') fillPts(ell(24, -21, 4.5, 5, 10), '#3a1714', 0, 0);
        else if (m === 'rire') { fillPts([[28, -25], [18, -24], [16, -18], [22, -13], [27, -16]], '#3a1714', 0, 0); strokePts([[27, -24], [19, -23]], '#f4efe6', 1.6); }
        fillPts([[29, -24], [22, -26], [17, -23], [22, -22]], TA.levres, 0, 0); if (m !== 'o' && m !== 'rire') fillPts([[28, -21], [22, -18], [17, -21], [22, -21]], TA.levres, 0, 0);
        if (m === 'smile') strokePts([[17, -22], [14, -24]], 'rgba(120,40,40,0.6)', 1.1);
        hatch([[-22, -40], [0, -28], [10, -10], [-6, 16], [-28, 4]], 0.6, 3.6, 0.18);
      } },
      cheveux: { parent: 'head', at: [0, 0], noRivet: true, base: TA.chev, seed: 8315, pts: TA_HAIR, paint: () => {
        for (let i = 0; i < 7; i++) strokePts(qbez([26 - i * 2, -72 - i * 7], [-8 - i * 3, -118 + i * 6], [-58 + i, -104 + i * 9], 10), 'rgba(120,110,140,0.5)', 1.4);
        strokePts(qbez([28, -80], [10, -100], [-20, -110], 8), 'rgba(150,140,170,0.55)', 2.4);
        hatch(null, 0.9, 3, 0.3); shade(20, -120, -60, -40, 0.25, [-70, -135, 40, -10]);
      }, extra: (p) => {                                                                                                      // boucle d'oreille (diamant en goutte)
        const g = M.tg(p.t || 0), sw = 0.12 * Math.sin(g * 2.1);
        const x = -12 + Math.sin(sw) * 14, y = -22 + Math.cos(sw) * 14;
        strokePts([[-12, -24], [x, y]], '#d8dde4', 1.2); if (!SIL()) { dot(x, y + 3, 4, '#f0f4fa'); dot(x - 1, y + 2, 1.4, '#ffffff'); }
        scint(x, y + 3, 7, 0.8 * Math.pow(Math.max(0, Math.sin(g * 1.7 + 1)), 12));
      } },
      armF_up: upDef([-2, -146], false, 8316, { wt: 15, manche: chaleM }),
      armF_lo: foreDef('armF_up', false, 8317, { manche, main: () => TA.peau, cuff: () => '#e8ecf2', extra: (b, p, k) => { if (!SIL()) dot(k * 14, k * 98, 2, TA.levres); } }),
    };
    return defOf('taylor', parts, G_ADULTE, TA.peau, TA.peauD, 8340, ['armB_up', 'armB_lo', 'souliers', 'head', 'cheveux', 'torso'].concat(TAIL), -238);
  }
  CH.mjTaylor = mkTaylor();
  function applaudit(q, k, P0) {
    if (!(k > 0)) return;
    const s = Math.abs(Math.sin(M.tg(q.t || 0) * 7.5));
    armTo(q, 'armF', [P0[0] + 6 + 16 * s, P0[1] - 4 * s], k); armTo(q, 'armB', [P0[0] - 4 - 6 * s, P0[1] + 3], k); q.handF = 'open'; q.handB = 'open';
  }
  function trajet(P, k) {                                    // interpolation par segments sur une liste de points (k 0..1)
    const n = P.length - 1, u = clamp(k) * n, i = Math.min(n - 1, Math.floor(u)), f = ease(u - i);
    return [lerp(P[i][0], P[i + 1][0], f), lerp(P[i][1], P[i + 1][1], f)];
  }
  MJ.LACHE = 0.55;                                           // `lance` : instant (0..1) où la couronne quitte la main
  MJ.taylor = wrap(() => 'mjTaylor', function (q, loc, env) {
    const A = q.ang, f = q.face, t = q.t || 0, g = M.tg(t);
    expr(q, q.expr);
    const k = (v) => ease(clamp(v === true ? 1 : v || 0));
    const pr = k(q.presente), po = clamp(q.pose || 0), hi = clamp(q.hisse || 0), la = clamp(q.lance || 0), pc_ = k(q.porteCoussin), ap = k(q.applaudit), ri = k(q.rit), mar = clamp(q.marche === true ? 1 : q.marche || 0);
    if (mar > 0) { const ph = t * TAU * 1.2; q.dy = (q.dy || 0) - Math.abs(Math.sin(ph)) * 4 * mar; q.tilt = (q.tilt || 0) + 0.02 * Math.sin(ph) * mar;
      if (!has(q.tenu) && !(pr > 0)) A.armF_up = (A.armF_up || 0) - 0.1 * Math.sin(ph) * mar; }
    if (pr > 0) { armTo(q, 'armF', [150, -170], pr); q.handF = 'open'; A.head = (A.head || 0) - 0.06 * pr; blend(q, 'armB_up', -0.35, pr); blend(q, 'armB_lo', -0.6, pr); if (!f.mouth) f.mouth = 'smile'; }
    if (pc_ > 0) {                                           // porte le coussin à deux mains, devant elle
      if (q.tenu == null) q.tenu = 'coussin'; if (q.deuxMains == null) q.deuxMains = true;
      const oo = heldOpts(q.tenu, q.tenuO, q); armTo(q, 'armF', gripFor(q.tenu, oo, 'base', [92, -84], 0), pc_);
    }
    if (po > 0 || hi > 0) {                                  // pose (bras devant, à hauteur d'épaule) ou hisse (au-dessus de sa tête, sur la pointe des pieds) la couronne sur la cible
      if (q.tenu == null) q.tenu = 'couronne'; if (q.deuxMains == null) q.deuxMains = true;
      const oo = heldOpts(q.tenu, q.tenuO, q), hk = hi > 0, kk = hk ? hi : po;
      if (hk) { const tp = smoothK(hi / 0.3); q._pointe = tp > 0.5; q.dy = (q.dy || 0) - 18 * tp; A.head = (A.head || 0) - 0.3 * tp; if (!f.eyes) f.eyes = 'haut'; }
      const Tg = q.cible ? loc(q.cible) : (hk ? [70, -330] : [120, -190]);
      const P = hk ? [[70, -90], [40, -330], [Tg[0], Tg[1] - 34], Tg] : [[70, -90], [Tg[0] - 10, Tg[1] - 22], Tg];
      armTo(q, 'armF', gripFor(q.tenu, oo, 'base', trajet(P, kk), 0), 1);
      if (!f.mouth) f.mouth = 'smile';
    }
    if (la > 0) {                                            // lance la couronne en cloche (de dessous), main ouverte après le lâcher
      const before = la < MJ.LACHE;
      if (q.tenu == null && before) q.tenu = 'couronne';
      if (!before && q.tenu === 'couronne') q.tenu = 'rien';
      const a = la < 0.35 ? ease(la / 0.35) : 1, b = ease(clamp((la - 0.35) / 0.3)), c = ease(clamp((la - 0.75) / 0.25));
      A.armF_up = (A.armF_up || 0) + lerp(lerp(-0.3, 0.12, a), -2.1, b) * (1 - c) + -0.4 * c; A.armF_lo = (A.armF_lo || 0) + lerp(-0.25, -0.1, b) * (1 - c) + -0.5 * c;
      q.tilt = (q.tilt || 0) + lerp(0.05 * a, -0.04, b); A.head = (A.head || 0) - 0.2 * b;
      if (!before) q.handF = 'open'; if (!f.mouth) f.mouth = b > 0.5 ? 'o' : 'smile';
      if (!before && q.vers) {                               // la couronne vole du point de lâcher jusqu'à q.vers (point écran où se pose sa base)
        const mt = (q.tenuO && q.tenuO.metal) || 'or', e = (q.tenuO && q.tenuO.echelle) || 0.8;
        q._post = (r, env2) => {
          const q0 = env2.poseAt({ lance: MJ.LACHE - 0.001, vers: null, tenu: 'couronne' }), m = M.partMatrices(env2.def, q0, env2.x, env2.y, env2.s, env2.dir).mats;
          const g0 = gripOf(OBJ.couronne, {}), P0 = M.wpt(m.objet, -g0[0] * e, -g0[1] * e), u = clamp((la - MJ.LACHE) / (1 - MJ.LACHE));
          const Pv = MJ.cloche(u, P0, q.vers, 160 * env2.s);
          MJ.couronne(Pv.x, Pv.y, env2.s * e, { metal: mt, rot: Pv.rot, t: q.t });
        };
      }
    }
    applaudit(q, ap, [84, -150]);
    if (ri > 0) { A.head = (A.head || 0) - 0.34 * ri; const N = [20, -152]; armTo(q, 'armF', N, ri); q.handF = 'open'; if (!f.mouth) f.mouth = 'rire'; if (!f.eyes) f.eyes = 'closed'; q.tilt = (q.tilt || 0) - 0.03 * ri;
      q.dy = (q.dy || 0) - 2 * Math.abs(Math.sin(g * 8)) * ri; }
    if (q.respire !== false) q.dy = (q.dy || 0) + 1.1 * Math.sin(g * 1.6 + 1);
  }, () => 0.9);
  // trajectoire en cloche (u 0..1) de P0 à P1, hauteur `haut` px, un tour sur soi → { x, y, rot }
  MJ.cloche = function (u, P0, P1, haut, tours) { u = clamp(u); return { x: lerp(P0[0], P1[0], u), y: lerp(P0[1], P1[1], u) - (haut || 160) * 4 * u * (1 - u), rot: (tours || 0) * TAU * ease(u) + 0.35 * Math.sin(PI * u) }; };

  // =====================================================================
  // 7) LE PRÉSENTATEUR (tenue 'mtv') ET LA PRÉSENTATRICE (tenue 'chaine')
  // =====================================================================
  const PR = { peau: '#e2b896', peauD: '#c49a78', chev: '#7a5232', chevD: '#5a3a22', casq: C.turq, casqD: C.turqD, veste: '#e4dac4', vesteD: '#c8bea6', tshirt: '#f2eee6',
    jean: '#7d96b4', jeanD: '#62809e', jeanL: '#a4b8cc', basket: '#efece4', basketD: '#cfcac0' };
  const PF = { peau: '#ecc8aa', peauD: '#cfa88c', chev: '#d9b860', chevD: '#b8963e', chevL: '#efd890', tail: C.fuchsia, tailD: C.fuchsiaD, tailL: C.fuchsiaL, collant: '#d8b494', collantD: '#bb9878', escarpin: '#6e1e3a', or: '#d8b54a' };
  const PR_TORSO = [[-14, -178], [8, -180], [18, -170], [32, -152], [38, -120], [38, -70], [36, -20], [38, 34, 1], [-40, 36, 1], [-40, -20], [-40, -80], [-40, -130], [-34, -158], [-24, -172]];
  const PF_TORSO = [[-14, -176], [8, -178], [16, -170], [34, -160, 1], [32, -138], [28, -110], [22, -76], [18, -44], [22, -8], [28, 40], [34, 110, 1], [-40, 112, 1], [-34, 40], [-30, -8], [-26, -46], [-30, -90], [-34, -130], [-40, -158, 1], [-26, -170]];
  const PR_HEAD = [[-14, 16], [10, 16], [11, 4], [16, -4], [23, -8], [27, -14], [26, -20], [28, -24], [27, -28], [30, -33], [36, -38, 1], [31, -45], [28, -54], [28, -64], [25, -78], [12, -92], [-6, -97], [-24, -88], [-32, -68], [-31, -46], [-24, -28], [-16, -8]];
  const PR_CAP = [[28, -78], [24, -94], [12, -106], [-6, -111], [-24, -105], [-36, -92], [-40, -84], [-76, -82, 1], [-77, -76, 1], [-40, -72], [-30, -74], [0, -78], [20, -76]];
  const PR_HAIR = festons([[30, -74], [34, -62], [26, -60], [22, -70], [10, -72], [-16, -70], [-30, -68], [-34, -50], [-30, -30], [-24, -34], [-22, -52], [-6, -60]], 3, 9);
  const PF_HAIR = festons([[26, -64], [30, -82], [22, -104], [0, -118], [-26, -114], [-48, -96], [-58, -70], [-58, -40], [-52, -10], [-40, 6], [-28, 0], [-24, -20], [-20, -44], [-10, -58], [8, -66]], 6, 13);
  const prTen = (p) => (p.tenue === 'chaine' ? 'chaine' : 'mtv');
  function triangles(p, x0, y0, x1, y1, seed) {               // motif géométrique de la veste : triangles fuchsia / ocre / turquoise
    const cols = [C.fuchsia, C.ocre, C.turq];
    for (let y = y0, j = 0; y < y1; y += 22, j++) for (let x = x0 + (j % 2) * 11, i = 0; x < x1; x += 26, i++) {
      const h = H(i + seed, j + seed), col = cols[Math.floor(h * 3)], s = 7 + 3 * H(i, j + 7), up = h > 0.5 ? 1 : -1;
      fillPts([[x, y - s * up, 1], [x + s, y + s * up * 0.8, 1], [x - s, y + s * up * 0.8, 1]], col, 0, 0.2);
    }
  }
  function mkPresentateur() {
    const L = { th: 116, sh: 108, hx: 6, wt: 15, kt: 11, ak: 9, fl: 50,
      cuisse: (b) => { fillPts(rect(-30, -30, 30, 140), b ? PR.jeanD : PR.jean); strokePts([[4, 10], [6, 100]], b ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.22)', 4); },
      tibia: (b) => { fillPts(rect(-30, -30, 30, 140), b ? PR.jeanD : PR.jean); fillPts(rect(-30, 86, 30, 140), b ? PR.basketD : PR.basket); strokePts([[-12, 86], [12, 86]], PR.casq, 2.2); },
      piedPts: () => FOOT(11, 54, 16).map((p, i) => (i < 9 ? [p[0], p[1] - 4] : p)),
      pied: (b) => { fillPts(rect(-30, -24, 70, 40), b ? PR.basketD : PR.basket); fillPts(rect(-20, 12, 60, 20), b ? '#a8a49a' : '#d8d4ca'); for (const x of [4, 12, 20]) strokePts([[x, -2], [x + 4, 4]], 'rgba(60,60,70,0.5)', 1.1); strokePts([[-10, 6], [30, 4]], PR.casq, 2); } };
    const manche = (b, p) => { fillPts(rect(-24, -24, 24, 110), b ? PR.vesteD : PR.veste); triangles(p, -20, -14, 20, 100, b ? 41 : 43); };
    const parts = Object.assign(legParts(L, 8400), {
      torso: { parent: null, at: [0, 0], pts: PR_TORSO, base: PR.veste, seed: 8410, paint: (p) => {
        triangles(p, -42, -170, 40, 36, 7);
        fillPts([[8, -180], [20, -170], [30, -150], [32, -40], [24, -36], [18, -150], [6, -172]], PR.tshirt);
        strokePts([[20, -150], [24, -36]], 'rgba(60,50,40,0.4)', 1.4);
        if (p._poche) { fillPts(rect(1, -40, 9, -14), '#1c1c22'); pc(ell(5, -46, 8, 8, 12), '#6a6e76', () => { strokePts([[-3, -46], [13, -46]], 'rgba(20,20,24,0.5)', 1); strokePts([[5, -54], [5, -38]], 'rgba(20,20,24,0.5)', 1); dot(2, -49, 2, 'rgba(255,255,255,0.6)'); }, 8419, { drop: false });
          pc(rect(-8, -24, 20, -8), PR.vesteD, () => strokePts([[-8, -23], [20, -23]], 'rgba(60,50,40,0.5)', 1.2), 8418, { drop: false }); }
        fillPts([[-10, -16], [16, -16], [16, -12], [-10, -12]], 'rgba(60,50,40,0.4)');
        hatch([[-44, -176], [-14, -176], [-14, 36], [-44, 36]], 0.75, 4.2, 0.24); shade(36, -60, -40, -60, 0.3, [-44, -182, 42, 38]);
      } },
      armB_up: upDef([-10, -146], true, 8411, { wt: 17, manche }),
      armB_lo: foreDef('armB_up', true, 8412, { manche: (b, p) => { fillPts(rect(-24, -24, 24, 80), PR.vesteD); triangles(p, -16, -6, 16, 60, 47); }, main: () => PR.peauD, cuff: () => PR.tshirt }),
      head: { parent: 'torso', at: [6, -170], pts: PR_HEAD, base: PR.peau, seed: 8413, noRivet: true, paint: (p) => {
        const f = p.face || {};
        oreille(-8, -44, PR.peauD, 'rgba(80,40,30,0.6)'); dot(18, -28, 8, 'rgba(210,120,100,0.25)');
        oeil(f, 19, -52, 1.05); X.brow(f, 19, -60, 'rgba(90,60,35,0.95)', 2.4); X.mouth(f, 28, -24);
        hatch([[-24, -40], [0, -28], [10, -10], [-6, 16], [-28, 4]], 0.6, 3.6, 0.22);
      } },
      cheveux: { parent: 'head', at: [0, 0], noRivet: true, base: PR.chev, seed: 8414, pts: PR_HAIR, paint: () => { for (let i = 0; i < 5; i++) strokePts([[24 - i * 12, -70], [20 - i * 13, -56 + (i % 2) * 6]], PR.chevD, 1.4); hatch(null, 1, 3, 0.25); } },
      casquette: { parent: 'head', at: [0, 0], noRivet: true, base: PR.casq, seed: 8415, pts: PR_CAP, paint: () => {
        fillPts([[-40, -84], [-76, -82], [-77, -76], [-40, -72]], PR.casqD); strokePts([[-6, -111], [-2, -80]], PR.casqD, 1.4); strokePts([[16, -102], [10, -80]], PR.casqD, 1.4);
        dot(-6, -111, 4, PR.casqD); fillPts([[12, -80], [26, -82], [27, -76], [12, -76]], PR.chev);                          // mèche passée par l'ouverture (casquette retournée)
        hatch(null, 0.9, 3.4, 0.2); shade(20, -100, -40, -80, 0.25, [-80, -115, 30, -70]);
      } },
      armF_up: upDef([-2, -146], false, 8416, { wt: 17, manche }),
      armF_lo: foreDef('armF_up', false, 8417, { manche: (b, p) => { fillPts(rect(-24, -24, 24, 80), PR.veste); triangles(p, -16, -6, 16, 60, 49); }, main: () => PR.peau, cuff: () => PR.tshirt }),
    });
    return defOf('presentateur', parts, G_ADULTE, PR.peau, PR.peauD, 8440, ORDER(['head', 'cheveux', 'casquette']), -(L.th + L.sh + 14), { _legs: L });
  }
  function mkPresentatrice() {
    const L = { th: 116, sh: 108, hx: 5, wt: 13, kt: 9.5, ak: 7, fl: 42,
      cuisse: (b) => fillPts(rect(-30, -30, 30, 140), b ? PF.collantD : PF.collant),
      tibia: (b) => { fillPts(rect(-30, -30, 30, 140), b ? PF.collantD : PF.collant); strokePts([[3, 10], [2, 100]], 'rgba(255,255,255,0.18)', 2); },
      piedPts: () => [[-8, -6], [8, -6], [12, 6], [30, 10], [44, 16, 1], [-12, 18, 1], [-12, 22], [-14, 22], [-14, 4]],
      pied: () => { fillPts(rect(-30, -4, 60, 30), PF.escarpin); fillPts(rect(-30, -10, 60, -4), PF.collant); } };
    const manche = (b) => { fillPts(rect(-24, -24, 24, 110), b ? PF.tailD : PF.tail); strokePts([[6, -10], [5, 90]], 'rgba(255,255,255,0.14)', 2); };
    const parts = Object.assign(legParts(L, 8500), {
      torso: { parent: null, at: [0, 0], pts: PF_TORSO, base: PF.tail, seed: 8510, paint: (p) => {
        fillPts([[-6, -178], [10, -178], [16, -166], [6, -146], [-4, -160]], '#f4efe6');                                           // chemisier
        strokePts([[16, -166], [28, -120], [20, -40]], PF.tailD, 1.6); for (const y of [-100, -70]) dot(22, y, 3.2, PF.or);
        strokePts([[-30, -8], [22, -8]], PF.tailD, 1.6);
        if (p._poche) { fillPts(rect(-3, -26, 5, -4), '#ece8df'); pc(ell(1, -32, 7, 7, 12), '#b9bec6', () => dot(-1, -34, 2, 'rgba(255,255,255,0.7)'), 8519, { drop: false });
          pc(rect(-10, -10, 14, 4), PF.tailD, null, 8518, { drop: false }); }
        hatch([[-44, -176], [-14, -176], [-14, 112], [-44, 112]], 0.75, 4.2, 0.24); shade(30, -60, -40, -60, 0.3, [-44, -182, 40, 114]);
      } },
      armB_up: upDef([-10, -146], true, 8511, { wt: 14, manche }),
      armB_lo: foreDef('armB_up', true, 8512, { manche, main: () => PF.peauD, cuff: () => PF.or }),
      head: { parent: 'torso', at: [6, -170], pts: TA_HEAD, base: PF.peau, seed: 8513, noRivet: true, paint: (p) => {
        const f = p.face || {};
        dot(15, -27, 8, 'rgba(220,120,120,0.3)');
        oeil(f, 16, -50, 1.08, '#4a7aa0'); X.brow(f, 16, -59, 'rgba(150,110,50,0.95)', 2.2);
        const m = f.mouth || 'smile';
        if (m === 'o') fillPts(ell(24, -21, 4.2, 4.6, 10), '#3a1714', 0, 0);
        fillPts([[29, -24], [22, -26], [17, -23], [22, -22]], '#c04a70', 0, 0); if (m !== 'o') fillPts([[28, -21], [22, -18], [17, -21], [22, -21]], '#c04a70', 0, 0);
        hatch([[-22, -40], [0, -28], [10, -10], [-6, 16], [-28, 4]], 0.6, 3.6, 0.16);
      } },
      cheveux: { parent: 'head', at: [0, 0], noRivet: true, base: PF.chev, seed: 8514, pts: PF_HAIR, paint: () => {
        for (let i = 0; i < 6; i++) strokePts(qbez([20 - i * 4, -86 + i * 4], [-20, -112 + i * 12], [-52 + i * 2, -70 + i * 14], 10), PF.chevD, 1.5);
        strokePts(qbez([22, -96], [-4, -116], [-34, -102], 8), PF.chevL, 2.6); hatch(null, 0.9, 3, 0.2);
      }, extra: () => { strokePts(ep(-12, -14, 9, 11, 14, 0, TAU), PF.or, 2.6); } },                                            // grandes créoles dorées
      armF_up: upDef([-2, -146], false, 8515, { wt: 14, manche }),
      armF_lo: foreDef('armF_up', false, 8516, { manche, main: () => PF.peau, cuff: () => PF.or }),
    });
    return defOf('presentatrice', parts, G_ADULTE, PF.peau, PF.peauD, 8540, ORDER(['head', 'cheveux']), -(L.th + L.sh + 14), { _legs: L });
  }
  CH.mjPresentateur = mkPresentateur(); CH.mjPresentatrice = mkPresentatrice();
  MJ.presentateur = wrap((p) => (prTen(p) === 'chaine' ? 'mjPresentatrice' : 'mjPresentateur'), function (q, loc, env) {
    const A = q.ang, f = q.face, t = q.t || 0, g = M.tg(t), ten = prTen(q);
    expr(q, q.expr);
    const k = (v) => ease(clamp(v === true ? 1 : v || 0));
    const pa = k(q.parle), li = k(q.lit), mo = k(q.montre), sa = k(q.salue), ha = k(q.haussement), mar = clamp(q.marche === true ? 1 : q.marche || 0);
    const feuille = li > 0 || mo > 0;
    if (feuille) { if (q.tenu == null) q.tenu = 'note'; if (q.micro !== false) q._poche = true; }
    else if (q.tenu == null && q.micro !== false) q.tenu = 'micro';
    if (q.tenu === 'micro' && q.tenuO.couleur == null) q.tenuO.couleur = ten === 'chaine' ? 'blanc' : 'noir';
    if (mar > 0) marche(q, mar, t);
    if (sa > 0) { plier(q, 0.32 * sa); A.head = (A.head || 0) + 0.22 * sa; armTo(q, 'armB', [34, -70], sa); q.handB = 'open'; if (!f.mouth) f.mouth = 'smile'; if (!f.eyes) f.eyes = 'half'; }
    if (pa > 0 && q.tenu === 'micro') {                    // parle : tête du micro devant la bouche, l'autre main ouverte qui accompagne
      const oo = heldOpts(q.tenu, q.tenuO, q), Mo = headPt(q, 36, -22);
      A.objet = (A.objet || 0) - 0.42 * pa;
      armTo(q, 'armF', gripFor(q.tenu, oo, 'tete', [Mo[0] + 10, Mo[1] + 4], -0.42), pa);
      if (!(ha > 0)) { blend(q, 'armB_up', -0.55 - 0.12 * Math.sin(g * 2.2), pa); blend(q, 'armB_lo', -0.85 + 0.15 * Math.sin(g * 3.1), pa); q.handB = 'open'; }
      if (!f.mouth) f.mouth = Math.sin(g * 11) + Math.sin(g * 7.3) > 0 ? 'o' : 'n';
    }
    if (feuille && q.tenu === 'note') {                    // lit (feuille tenue par les bords, dos au public) → montre (retournée, face au public)
      if (q.deuxMains == null) q.deuxMains = true;
      if (q.tenuO.retourne == null) q.tenuO.retourne = mo;
      const oo = heldOpts(q.tenu, q.tenuO, q), Cn = [lerp(72, 110, mo), lerp(-88, -106, mo)];
      armTo(q, 'armF', gripFor(q.tenu, oo, 'centre', Cn, 0), Math.max(li, mo));
      A.head = (A.head || 0) + 0.16 * li * (1 - mo) - 0.04 * mo; if (!f.eyes) f.eyes = mo > 0.5 ? 'open' : 'half';
      if (!f.mouth) f.mouth = mo > 0.5 ? 'smile' : 'n';
    }
    if (ha > 0) {                                          // haussement d'épaules : avant-bras levés, paumes ouvertes, tête penchée
      if (!(pa > 0) && !feuille) { blend(q, 'armF_up', 0.05, ha); blend(q, 'armF_lo', -1.95, ha); if (!has(q.tenu)) q.handF = 'open'; }
      blend(q, 'armB_up', 0.1, ha); blend(q, 'armB_lo', -1.85, ha); q.handB = 'open';
      A.head = (A.head || 0) + 0.12 * ha; q.dy = (q.dy || 0) - 3 * ha; if (!f.brow) f.brow = 'up'; if (!f.mouth) f.mouth = 'tight';
    }
    if (!f.mouth) f.mouth = 'smile';
    if (q.respire !== false) q.dy = (q.dy || 0) + 1.2 * Math.sin(g * 1.8 + 2);
  }, () => 0.9);
  // buste (pour un écran) : (x, y) = bas du buste (mi-poitrine) ; o.tenue ('chaine' par défaut), o.pose (pose du présentateur), o.dir
  MJ.buste = function (x, y, s, o) {
    o = o || {}; const c = cx_(), p = Object.assign({ tenue: o.tenue || 'chaine', t: o.t }, o.pose || {}), def = MJ.presentateur.def(p), fy = y + (-def.hipY + 60) * s;
    c.save(); c.beginPath(); c.rect(x - 240 * s, y - 460 * s, 480 * s, 460 * s); c.clip();
    const r = MJ.presentateur(p, x, fy, s, { dir: o.dir || 1, rod: false, floorShadow: false, slot: fy });
    c.restore(); return r;
  };

  // =====================================================================
  // 8) ACCESSOIRES SEULS (sans tige) : même dessin que tenus en main
  // =====================================================================
  const accDefs = {};
  function accDef(name, fn) { return accDefs[name] || (accDefs[name] = { hipY: 0, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => fn(p.o) } }, order: ['o'], nom: name }); }
  function acc(name, x, y, s, o) {
    const ob = OBJ[name]; o = o || {};
    return M.puppet(accDef('o_' + name, (oo) => { const b = ptOf(ob.base, oo), c = cx_(); c.save(); c.translate(-b[0], -b[1]); ob.draw(Object.assign({ t: oo.t || 0 }, oo)); c.restore(); }),
      { o, tilt: o.rot || 0 }, x, y, s == null ? 1 : s, { dir: o.dir || 1, rod: false, slot: o.slot != null ? o.slot : y + 6 * (s || 1), floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
  }
  MJ.couronne = (x, y, s, o) => acc('couronne', x, y, s, o);
  MJ.coussin = (x, y, s, o) => acc('coussin', x, y, s, o);
  MJ.note = (x, y, s, o) => acc('note', x, y, s, Object.assign({ retourne: 1 }, o || {}));
  MJ.micro = (x, y, s, o) => acc('micro', x, y, s, o);
  MJ.piedestal = (x, y, s, o) => { const r = acc('piedestal', x, y, s == null ? 0.9 : s, o); r.dessus = [x, y - 196 * (s == null ? 0.9 : s)]; return r; };
  MJ.podium = (x, y, s, o) => { const r = acc('podium', x, y, s == null ? 0.9 : s, o); r.dessus = [x, y - 252 * (s == null ? 0.9 : s)]; return r; };
  MJ.trone = (x, y, s, o) => { s = s == null ? 0.9 : s; const r = acc('trone', x, y, s, o); r.siege = y - MJ.TRONE.siege * s; r.x = x; return r; };
  MJ.tele = function (x, y, s, o) {
    o = o || {}; s = s == null ? 1 : s;
    const r = acc('tele', x, y, s, o);
    if (o.ecran === 'presentatrice') {
      const c = cx_(); c.save(); c.setTransform(r.mats.o); M.path(tvGlass(), 0, 0); c.clip();
      const bp = Object.assign({ parle: 1 }, o.pose || {});
      MJ.buste((TVS.x0 + TVS.x1) / 2 + 6, TVS.y1 + 2, 0.55, { tenue: 'chaine', t: o.t, dir: o.ecranDir || 1, pose: bp });
      ecranVerre(o); c.restore();
    }
    return r;
  };
  // point écran d'un point nommé d'un accessoire seul : MJ.accPt('tele', x, y, s, o, 'ecran')
  MJ.accPt = function (name, x, y, s, o, nom) { const ob = OBJ[name], oo = o || {}, b = ptOf(ob.base, oo), q = ob.pts[nom] ? ptOf(ob.pts[nom], oo) : [0, 0], d = oo.dir || 1, rr = oo.rot || 0; s = s == null ? 1 : s;
    const X0 = (q[0] - b[0]) * s * d, Y0 = (q[1] - b[1]) * s; return [x + X0 * Math.cos(rr) - Y0 * Math.sin(rr) * d, y + X0 * Math.sin(rr) * d + Y0 * Math.cos(rr)]; };

  // =====================================================================
  // 9) DÉCOR « LE PALAIS DE LA POP » — MJ.palais(t, o) AVANT M.drawFloor() ; MJ.palaisSol(t, o) juste APRÈS (avant les marionnettes)
  // =====================================================================
  const PAL = { colX: [292, 788], colW: 58, capY: 540, apex: 330, esc: { x: 540, w: [440, 380, 320, 260], h: 28 }, hpL: [128, 252], hpR: [828, 952], hpTop: 1056,
    etagere: { x0: 128, x1: 262, y: 712 }, disques: [[892, 640], [892, 810]], boule: { x: 540, y: 470, r: 44 }, lustres: [[402, 418], [678, 418]], projos: [[150, 318], [930, 318]],
    micro: { x: 912, y: 1474 }, bouquet: { x: 176, y: 1478 }, trone: 540, piedestal: 700, podium: 720 };
  MJ.PALAIS = PAL;
  function archPt(u) { const a = PI * (1 - u), rx = (PAL.colX[1] - PAL.colX[0]) / 2; return [540 + rx * Math.cos(a), PAL.capY - (PAL.capY - PAL.apex) * Math.sin(a)]; }
  function makePalFond() {
    return M.pre(W, BACK + 40, (c) => {
      const g = c.createLinearGradient(0, 150, 0, BACK); g.addColorStop(0, '#121a30'); g.addColorStop(1, '#22305a'); c.fillStyle = g; c.fillRect(0, 0, W, BACK + 40);
      for (let x = -20, i = 0; x < W + 60; x += 64, i++) {                        // plis du rideau de fond
        const gr = c.createLinearGradient(x, 0, x + 64, 0); gr.addColorStop(0, 'rgba(0,0,0,0.28)'); gr.addColorStop(0.45, 'rgba(120,140,200,0.10)'); gr.addColorStop(1, 'rgba(0,0,0,0.3)');
        c.fillStyle = gr; c.fillRect(x, 0, 64, BACK + 40);
      }
      const R = M.rng(81); for (let i = 0; i < 260; i++) { c.fillStyle = `rgba(220,215,240,${0.15 + R() * 0.3})`; c.fillRect(R() * W, 160 + R() * (BACK - 200), 1.6, 1.6); }
      // arche dorée (porte les ampoules)
      const P = []; for (let i = 0; i <= 40; i++) P.push(archPt(i / 40));
      c.lineCap = 'round'; c.strokeStyle = '#6e5420'; c.lineWidth = 30; c.beginPath(); P.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke();
      c.strokeStyle = C.or; c.lineWidth = 22; c.stroke(); c.strokeStyle = 'rgba(255,240,190,0.4)'; c.lineWidth = 3; c.stroke();
      // fond de scène sous l'arche : rayons peints (sans lettre)
      for (let i = 0; i < 18; i++) { const a = PI + i * PI / 17; c.fillStyle = i % 2 ? 'rgba(90,100,170,0.16)' : 'rgba(220,200,255,0.09)'; c.beginPath(); c.moveTo(540, BACK - 120); c.lineTo(540 + Math.cos(a) * 520, BACK - 120 + Math.sin(a) * 820); c.lineTo(540 + Math.cos(a + PI / 17) * 520, BACK - 120 + Math.sin(a + PI / 17) * 820); c.fill(); }
    });
  }
  function colonne(x) {
    const w = PAL.colW / 2, y0 = PAL.capY + 30;
    pc(rect(x - w - 10, BACK - 34, x + w + 10, BACK), C.orD, () => strokePts([[x - w - 10, BACK - 22], [x + w + 10, BACK - 22]], C.or, 3), x + 1);
    pc(rect(x - w, y0, x + w, BACK - 34), C.or, () => { for (let k = -3; k <= 3; k++) strokePts([[x + k * 8, y0 + 6], [x + k * 8, BACK - 40]], 'rgba(90,64,20,0.45)', 2); shade(x - w, 0, x + w, 0, 0.35, [x - w - 2, y0, x + w + 2, BACK]); strokePts([[x - w * 0.4, y0 + 10], [x - w * 0.4, BACK - 44]], 'rgba(255,240,190,0.45)', 3); }, x + 2);
    pc([[x - w - 18, y0], [x + w + 18, y0], [x + w + 26, y0 - 20, 1], [x + w + 10, y0 - 34], [x - w - 10, y0 - 34], [x - w - 26, y0 - 20, 1]], C.or, () => { for (const s of [-1, 1]) strokePts(ep(x + s * (w + 14), y0 - 18, 8, 8, 10, 0, TAU * 0.85), C.orD, 2); hatch(null, 0.8, 3.4, 0.25, 1, M.P.encre, [x - 90, y0 - 40, x + 90, y0 + 2]); }, x + 3);
  }
  function enceinte(x0, x1, y0, y1, seed) {
    pc(rect(x0, y0, x1, y1), '#1a1a1e', () => { strokePts(rect(x0 + 5, y0 + 5, x1 - 5, y1 - 5), 'rgba(120,120,130,0.4)', 1.4, true); hatch(null, 0.8, 3.4, 0.2, 1, M.P.encre, [x0, y0, x1, y1]); }, seed);
    const cx = (x0 + x1) / 2, h = y1 - y0;
    for (const [yy, r] of [[y0 + h * 0.32, Math.min(46, h * 0.26)], [y0 + h * 0.75, Math.min(30, h * 0.16)]]) { pc(ell(cx, yy, r, r, 20), '#2c2c32', () => { dot(cx, yy, r * 0.62, '#151518'); dot(cx, yy, r * 0.22, '#3a3a40'); }, seed + yy, { drop: false }); }
  }
  function trophee(x, y, kind, seed) {
    pc(rect(x - 14, y - 14, x + 14, y), '#2a1e14', () => fillPts(rect(x - 14, y - 6, x + 14, y - 4), C.or), seed);
    if (kind === 0) { pc([[x - 4, y - 14], [x + 4, y - 14], [x + 6, y - 50], [x + 10, y - 58], [x, y - 70], [x - 10, y - 58], [x - 6, y - 50]], C.or, () => strokePts([[x - 2, y - 20], [x - 3, y - 60]], C.orL, 1.6), seed + 1); dot(x, y - 74, 7, C.or); }
    else if (kind === 1) { strokePts([[x, y - 14], [x, y - 40]], C.orD, 3); pc([[x - 6, y - 40], [x + 6, y - 40], [x + 30, y - 66], [x + 24, y - 76], [x - 2, y - 52]], C.or, () => strokePts([[x + 4, y - 48], [x + 22, y - 68]], C.orL, 1.4), seed + 1); }
    else if (kind === 2) { strokePts([[x, y - 14], [x, y - 44]], C.orD, 3); const st = []; for (let i = 0; i < 10; i++) { const a = -PI / 2 + i * PI / 5, r = i % 2 ? 7 : 17; st.push([x + Math.cos(a) * r, y - 58 + Math.sin(a) * r]); } pc(st, C.or, null, seed + 1); }
    else { pc([[x - 6, y - 14], [x + 6, y - 14], [x + 4, y - 26], [x + 16, y - 36], [x + 18, y - 58, 1], [x - 18, y - 58, 1], [x - 16, y - 36], [x - 4, y - 26]], C.or, () => strokePts([[x - 10, y - 52], [x - 8, y - 36]], C.orL, 1.6), seed + 1); for (const s of [-1, 1]) strokePts(ep(x + s * 20, y - 46, 6, 8, 8, -PI / 2, PI / 2), C.orD, 2.4); }
  }
  function disqueOr(x, y, seed) {
    pc(rect(x - 58, y - 58, x + 58, y + 58), '#3a2614', () => fillPts(rect(x - 50, y - 50, x + 50, y + 50), '#141a2c'), seed);
    strokePts(rect(x - 58, y - 58, x + 58, y + 58), C.or, 2.4, true);
    pc(ell(x, y, 40, 40, 28), C.or, () => { for (let r = 14; r < 40; r += 3.5) strokePts(ep(x, y, r, r, 24, 0, TAU), 'rgba(110,80,20,0.4)', 0.9); strokePts(ep(x, y, 30, 30, 10, -2.4, -1.4), 'rgba(255,245,200,0.7)', 2); }, seed + 1, { drop: false });
    dot(x, y, 12, C.sang); dot(x, y, 2.4, '#101010');
  }
  function makePalMilieu() {
    return M.pre(W, BACK + 40, (c) => {
      colonne(PAL.colX[0]); colonne(PAL.colX[1]);
      // escalier lumineux à 4 marches (corps ; les nez de marche s'allument au dessin)
      const E = PAL.esc; E.w.forEach((w, i) => pc(rect(E.x - w / 2, BACK - E.h * (i + 1), E.x + w / 2, BACK - E.h * i), i % 2 ? '#242036' : '#2c2640', () => { strokePts([[E.x - w / 2, BACK - E.h * (i + 1) + 2], [E.x + w / 2, BACK - E.h * (i + 1) + 2]], C.or, 2.4); hatch(null, 0.3, 5, 0.16, 1, M.P.encre, [E.x - w / 2, BACK - E.h * (i + 1), E.x + w / 2, BACK]); }, 9200 + i));
      // enceintes de concert (deux caissons de chaque côté)
      for (const [x0, x1] of [PAL.hpL, PAL.hpR]) { enceinte(x0, x1, PAL.hpTop, PAL.hpTop + 170, 9210 + x0); enceinte(x0 + 8, x1 - 8, PAL.hpTop + 170, BACK, 9220 + x0); }
      // étagère de statuettes-trophées (côté jardin, en hauteur) sur consoles dorées
      const Et = PAL.etagere;
      pc(rect(Et.x0, Et.y, Et.x1, Et.y + 12), C.bois, () => fillPts(rect(Et.x0, Et.y, Et.x1, Et.y + 3), C.or), 9230);
      for (const x of [Et.x0 + 16, Et.x1 - 16]) pc([[x - 6, Et.y + 12], [x + 6, Et.y + 12], [x, Et.y + 40]], C.orD, null, 9231 + x);
      [0, 1, 2, 3].forEach((k, i) => trophee(Et.x0 + 22 + i * 31, Et.y, k, 9240 + i * 3));
      pc(rect(Et.x0, Et.y - 190, Et.x1, Et.y - 178), C.bois, () => fillPts(rect(Et.x0, Et.y - 190, Et.x1, Et.y - 187), C.or), 9250);
      [3, 2, 0].forEach((k, i) => trophee(Et.x0 + 30 + i * 40, Et.y - 190, k, 9255 + i * 3));
      for (const x of [Et.x0 + 16, Et.x1 - 16]) pc([[x - 6, Et.y - 178], [x + 6, Et.y - 178], [x, Et.y - 150]], C.orD, null, 9262 + x);
      // deux disques d'or encadrés (côté cour)
      PAL.disques.forEach(([x, y], i) => disqueOr(x, y, 9270 + i * 2));
    });
  }
  function bouquet(x, y, seed, n) {
    pc([[x - 22, y], [x + 22, y], [x + 26, y - 40], [x + 16, y - 70], [x - 16, y - 70], [x - 26, y - 40]], C.or, () => { shade(x - 24, 0, x + 24, 0, 0.35, [x - 30, y - 72, x + 30, y]); strokePts([[x - 24, y - 42], [x + 24, y - 42]], C.orD, 2); }, seed);
    const R = M.rng(seed);
    for (let i = 0; i < 9; i++) { const a = -PI / 2 + (R() - 0.5) * 1.6; strokePts([[x, y - 66], [x + Math.cos(a) * 90, y - 66 + Math.sin(a) * 90]], '#3e5a34', 2.2); pc([[x + Math.cos(a) * 60, y - 66 + Math.sin(a) * 60], [x + Math.cos(a + 0.3) * 80, y - 66 + Math.sin(a + 0.3) * 80], [x + Math.cos(a) * 96, y - 66 + Math.sin(a) * 96]], '#4a6a3a', null, seed + 10 + i, { drop: false }); }
    const cols = [C.sangL, C.ivoire, C.fuchsiaL, C.sang, '#e8c060'];
    for (let i = 0; i < (n || 11); i++) { const a = -PI / 2 + (R() - 0.5) * 1.8, r = 60 + R() * 52, fx = x + Math.cos(a) * r, fy = y - 70 + Math.sin(a) * r * 0.9, col = cols[i % cols.length];
      pc(festons(ell(fx, fy, 13, 12, 6), 4, i), col, () => { dot(fx, fy, 4, mixA(col, '#000000', 0.35)); strokePts(ep(fx, fy, 8, 7, 8, 0, PI * 1.4), 'rgba(0,0,0,0.25)', 1); }, seed + 30 + i, { drop: false }); }
  }
  function makePalSol() {
    return M.pre(W, M.H, (c) => {
      // câbles qui serpentent au sol
      for (const [a, b, col] of [[[912, 1470], [252, 1404], '#141416'], [[170, 1480], [128, 1420], '#1e1e22'], [[860, 1470], [952, 1410], '#18181c']]) strokePts(qbez(a, [(a[0] + b[0]) / 2, Math.max(a[1], b[1]) + 22], b, 14), col, 4);
      bouquet(PAL.bouquet.x, PAL.bouquet.y, 9300, 12);
      // micro sur pied chromé (premier plan, côté cour)
      const M0 = PAL.micro;
      for (const s of [-1, 0, 1]) strokePts([[M0.x, M0.y - 30], [M0.x + s * 34, M0.y]], '#9aa0a8', 3.2);
      pc(rect(M0.x - 4, M0.y - 300, M0.x + 4, M0.y - 30), '#b0b6be', () => strokePts([[M0.x - 1, M0.y - 296], [M0.x - 1, M0.y - 34]], 'rgba(255,255,255,0.6)', 1.4), 9310);
      pc(ell(M0.x, M0.y - 304, 8, 8, 12), '#6a6e74', null, 9311, { drop: false });
      c.save(); c.translate(M0.x, M0.y - 304); c.rotate(-0.55); pc(rect(-4, -120, 4, 0), '#b0b6be', null, 9312); c.translate(0, -120); c.rotate(0.3); drawMicro({ couleur: 'chrome' }); c.restore();
    });
  }
  // lustre de cristal (dessiné en direct : il balance)
  function lustre(x, y, g, ph) {
    const c = cx_(), a = 0.05 * Math.sin(g * 1.1 + ph);
    strokePts([[x, 150], [x, y - 60]], '#3a2e1a', 2);
    c.save(); c.translate(x, y - 60); c.rotate(a); c.translate(-x, -(y - 60));
    strokePts([[x, y - 60], [x, y - 20]], C.orD, 3);
    pc([[x - 54, y], [x + 54, y], [x + 40, y + 12, 1], [x - 40, y + 12, 1]], C.or, () => strokePts([[x - 50, y + 2], [x + 50, y + 2]], C.orL, 1.4), 9400 + ph * 7, { drop: false });
    for (let i = -2; i <= 2; i++) { strokePts(qbez([x, y - 20], [x + i * 24, y - 30], [x + i * 26, y], 6), C.orD, 1.6); pc(rect(x + i * 26 - 3, y - 18, x + i * 26 + 3, y - 2), C.ivoire, null, 9410 + i, { drop: false }); glow(x + i * 26, y - 22, 16, '255,220,150', 0.5); }
    for (let i = -4; i <= 4; i++) { const yy = y + 14 + (4 - Math.abs(i)) * 7; strokePts([[x + i * 11, y + 10], [x + i * 11, yy]], 'rgba(220,230,245,0.6)', 1); fillPts([[x + i * 11, yy - 3], [x + i * 11 + 3.5, yy + 3], [x + i * 11, yy + 9], [x + i * 11 - 3.5, yy + 3]], 'rgba(225,235,250,0.85)', 0, 0);
      scint(x + i * 11, yy + 3, 5, 0.8 * Math.pow(Math.max(0, Math.sin(g * 2.3 + i * 1.7 + ph)), 14)); }
    c.restore();
  }
  function boule(x, y, r, ang) {                             // boule à facettes : rangées de facettes qui défilent avec la rotation
    strokePts([[x, 150], [x, y - r]], '#2a2a2e', 1.8);
    pc(ell(x, y, r, r, 28), '#7e848e', () => {
      for (let j = -5; j <= 5; j++) {
        const la = j / 6 * PI / 2, ry = y + Math.sin(la) * r, rw = Math.cos(la) * r, n = Math.max(4, Math.round(14 * Math.cos(la)));
        for (let i = 0; i < n; i++) { const lo = (i / n) * TAU + ang * (1 + j * 0.02), cxx = Math.sin(lo); if (Math.cos(lo) < 0) continue;
          const b = 0.35 + 0.65 * Math.pow(0.5 + 0.5 * Math.sin(lo * 3 + j + ang * 2), 3), fx = x + cxx * rw, w = Math.max(1.5, 5 * Math.cos(lo));
          fillPts(rect(fx - w / 2, ry - 3.4, fx + w / 2, ry + 3.4), mixA('#5a606a', '#f4f6fa', b), 0, 0); }
      }
      shade(x - r, y - r, x + r, y + r, 0.35, [x - r, y - r, x + r, y + r]);
    }, 9420, { drop: false });
  }
  function projo(x, y, a, on) {
    const c = cx_(); c.save(); c.translate(x, y); c.rotate(a);
    pc(rect(-18, -26, 18, 22), '#1c1c20', () => fillPts(rect(-18, 14, 18, 22), '#2e2e34'), 9430 + x, { drop: false });
    pc(ell(0, 24, 14, 5, 12), on > 0.1 ? '#f4ecd0' : '#4a4a50', null, 9431 + x, { drop: false });
    c.restore(); strokePts([[x, y], [x, 150]], '#2a2a2e', 2);
  }
  function faisceau(x, y, a, col, al) {
    if (SIL() || al < 0.01) return;
    const c = cx_(), L = BACK - y, E = [x - Math.sin(a) * L, BACK];
    c.save(); c.globalCompositeOperation = 'lighter';
    const gr = c.createLinearGradient(x, y, E[0], E[1]); gr.addColorStop(0, `rgba(${col},${0.22 * al})`); gr.addColorStop(1, `rgba(${col},${0.03 * al})`);
    c.fillStyle = gr; c.beginPath(); c.moveTo(x - 14, y); c.lineTo(x + 14, y); c.lineTo(E[0] + 150, E[1]); c.lineTo(E[0] - 150, E[1]); c.closePath(); c.fill(); c.restore();
  }
  // MJ.palais(t, o) : o.trone (x : trône posé à ST.back, s 0,9) ; o.piedestal (x) ; o.podium 0..1 (pupitre qui monte de la trappe, o.podiumX) ;
  //   événements (instants LOCAUX) : o.retard (une marche s'allume en retard), o.projo (un projecteur se rallume en grésillant), o.boule (la boule accélère un instant) ;
  //   o.lumiere 0..1 (assombrit) ; o.cast. Renvoie { siege, trone, piedestal:[x,y dessus], podium:[x,y dessus] }.
  MJ.palais = function (t, o) {
    o = o || {}; const K = MJ.K, c = cx_(), g = M.tg(t), out = {};
    c.drawImage(K.palFond, 0, 0);
    if (!SIL()) {
      const R = M.rng(5); for (let i = 0; i < 70; i++) { const x = R() * W, y = 170 + R() * 1150, w = 0.8 + R() * 1.6, ph = R() * TAU; scint(x, y, 3 + 3 * R(), 0.9 * Math.pow(Math.max(0, Math.sin(g * w + ph)), 12)); }
      const bk = o.boule != null ? 2.6 * smoothK((t - o.boule) / 1.4) : 0, ang = g * 0.55 + bk;
      c.save(); c.globalCompositeOperation = 'lighter';                       // reflets de la boule qui balaient le fond
      const R2 = M.rng(9); for (let i = 0; i < 34; i++) { const x0 = R2() * 1300, y = 220 + R2() * 1080, sp = 0.6 + R2() * 0.6, x = ((x0 + ang * 160 * sp) % 1300) - 110;
        c.fillStyle = `rgba(${R2() > 0.5 ? '255,250,230' : '210,220,255'},${0.16 + 0.1 * R2()})`; c.beginPath(); c.ellipse(x, y, 7, 4.5, 0.3, 0, TAU); c.fill(); }
      c.restore();
      // ampoules de l'arche : chenillard
      const n = 25, ph = Math.floor(g * 7); for (let i = 0; i <= n; i++) { const p = archPt(i / n), on = (i + ph) % 3 === 0 ? 1 : 0.35; dot(p[0], p[1], 6, on > 0.5 ? '#fff4d0' : '#d8c080'); glow(p[0], p[1], 20, '255,220,140', 0.35 * on); }
      for (const [L0, L1] of [[PAL.capY + 40, BACK - 60]]) for (const x of PAL.colX) for (let y = L0, i = 0; y < L1; y += 70, i++) { const on = (i + ph) % 4 === 0; dot(x, y, 3.6, on ? '#fff4d0' : '#a8904a'); if (on) glow(x, y, 14, '255,220,140', 0.3); }
      PAL.lustres.forEach(([x, y], i) => lustre(x, y, g, i * 2.1));
      boule(PAL.boule.x, PAL.boule.y, PAL.boule.r, ang);
      glow(PAL.boule.x, PAL.boule.y, 90, '220,230,255', 0.18 + 0.06 * Math.sin(ang * 5));
    }
    c.drawImage(K.palMilieu, 0, 0);
    if (!SIL()) {
      // escalier : les nez de marche s'allument tour à tour (o.retard : la marche du haut s'allume avec retard)
      const E = PAL.esc, st = Math.floor(g * 2.2) % 6, late = o.retard != null && t >= o.retard && t < o.retard + 1.1;
      E.w.forEach((w, i) => { let on = 0.15 + 0.85 * Math.pow(0.5 + 0.5 * Math.sin(g * 1.6 - i * 1.1), 3);   // fondu continu (pas d'allumage d'un coup : sauts.py)
        if (late && i === 3) on = t < o.retard + 0.8 ? 0.1 : (Math.sin(t * 60) > 0 ? 1 : 0.3);
        const y = BACK - E.h * i - 6; fillPts(rect(E.x - w / 2 + 6, y - 3, E.x + w / 2 - 6, y + 3), mixA('#4a3a20', '#fff0c0', on), 0, 0); if (on > 0.3) glow(E.x, y, w * 0.4, '255,220,150', 0.18 * (on - 0.3) / 0.7); });
      // membranes des enceintes qui battent
      const beat = Math.pow(Math.max(0, Math.sin(g * TAU * 1.9)), 4);
      for (const [x0, x1] of [PAL.hpL, PAL.hpR]) { const cx = (x0 + x1) / 2; strokePts(ep(cx, PAL.hpTop + 54, 18 + 4 * beat, 18 + 4 * beat, 16, 0, TAU), 'rgba(160,160,170,0.5)', 1.4); strokePts(ep(cx, PAL.hpTop + 170 + (BACK - PAL.hpTop - 170) * 0.32, 26 + 5 * beat, 26 + 5 * beat, 16, 0, TAU), 'rgba(160,160,170,0.45)', 1.4); }
      // reflet qui passe sur les trophées et les disques d'or
      const u = fr(g / 4.2); scint(lerp(PAL.etagere.x0, PAL.etagere.x1, u), PAL.etagere.y - 60, 6, 0.8 * Math.sin(u * PI)); scint(PAL.disques[(Math.floor(g / 4.2)) % 2][0] - 20 + 40 * u, PAL.disques[(Math.floor(g / 4.2)) % 2][1] - 20, 7, 0.8 * Math.sin(u * PI));
    }
    if (o.trone != null) { const r = MJ.trone(o.trone, BACK, 0.9, { cast: o.cast || { dx: 14, dy: 6, a: 0.3 }, t }); out.siege = r.siege; out.trone = o.trone; }
    if (o.piedestal != null) { const r = MJ.piedestal(o.piedestal, BACK, 0.9, { cast: o.cast || { dx: 14, dy: 6, a: 0.3 } }); out.piedestal = r.dessus; }
    if (o.podium > 0) { const p = M.easeOut(clamp(o.podium)), x = o.podiumX || PAL.podium, y = BACK + (1 - p) * 250;
      c.save(); c.beginPath(); c.rect(0, 0, W, BACK + 1); c.clip(); MJ.podium(x, y, 0.9, { cast: { dx: 14, dy: 6, a: 0.3 } }); c.restore(); out.podium = [x, y - 252 * 0.9]; }
    // projecteurs colorés qui balaient + paillettes en suspension
    const fl = o.projo != null ? (t < o.projo ? 0 : t < o.projo + 0.9 ? (Math.sin(t * 47) > 0.1 || Math.sin(t * 19) > 0.7 ? 1 : 0.1) : 1) : 1, lum = clamp(o.lumiere == null ? 1 : o.lumiere);
    const A0 = 0.42 + 0.22 * Math.sin(g * 0.37), A1 = -0.42 - 0.22 * Math.sin(g * 0.31 + 1.3);
    projo(PAL.projos[0][0], PAL.projos[0][1], A0, lum); projo(PAL.projos[1][0], PAL.projos[1][1], A1, fl * lum);
    faisceau(PAL.projos[0][0], PAL.projos[0][1] + 20, A0, '230,120,180', 0.9 * lum); faisceau(PAL.projos[1][0], PAL.projos[1][1] + 20, A1, '110,210,205', 0.9 * fl * lum);
    M.poussiere(t, { x: 140, y: 300, w: 800, h: 1050, n: 34, a: 0.6, seed: 23 });
    if (!SIL()) { const R = M.rng(31); for (let i = 0; i < 26; i++) { const x0 = R() * W, v = 18 + R() * 16, ph = R() * TAU, y = 200 + ((R() * 1100 + g * v) % 1150), x = x0 + 18 * Math.sin(g * 0.9 + ph), fl2 = Math.cos(g * 3 + ph);
      fillPts([[x - 2.6 * fl2, y], [x, y - 2.6], [x + 2.6 * fl2, y], [x, y + 2.6]], `rgba(240,210,120,${0.55 + 0.3 * fl2 * fl2})`, 0, 0); } }
    if (lum < 1 && !SIL()) { c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = `rgba(30,34,60,${0.7 * (1 - lum)})`; c.fillRect(0, 0, W, BACK + 40); c.restore(); }
    return out;
  };
  // MJ.palaisSol(t, o) : premier plan (bouquet, micro sur pied chromé, câbles) ; o.petale = instant LOCAL où un pétale tombe du bouquet
  MJ.palaisSol = function (t, o) {
    o = o || {}; const c = cx_(), g = M.tg(t);
    c.drawImage(MJ.K.palSol, 0, 0);
    if (o.petale != null && t >= o.petale) { const u = clamp((t - o.petale) / 1.8), x = PAL.bouquet.x + 60 + 40 * u + 14 * Math.sin(u * 9), y = lerp(PAL.bouquet.y - 150, PAL.bouquet.y - 4, u);
      c.save(); c.translate(x, y); c.rotate(u * 5); c.scale(Math.cos(u * 11), 1); fillPts(ell(0, 0, 7, 4, 10), C.sangL, 0, 0); c.restore(); }
    const u = fr(g / 3.1); scint(PAL.micro.x - 4, lerp(PAL.micro.y - 290, PAL.micro.y - 40, u), 5, 0.7 * Math.sin(u * PI));
  };

  // =====================================================================
  // 10) DÉCOR « PLATEAU DE TÉLÉ MUSICALE, 1991 » — MJ.studio91(t, o) AVANT M.drawFloor() ; MJ.studio91Sol(t, o) juste APRÈS
  // =====================================================================
  const STU = { mur: { x0: 318, x1: 762, y0: 410, y1: 870 }, teles: [], neonZ: { x0: 300, x1: 780, y: 352 }, neonT: { x: 222, y: 540, r: 74 }, regie: { x0: 800, x1: 956, y0: 470, y1: 690 },
    horloge: { x: 216, y: 760, r: 46 }, canape: { x0: 196, x1: 446 }, plante: 150, camera: { x: 866 }, projecteur: { x: 150, y: 1476 }, tabouret: { x: 934, y: 1476 }, ventilo: { x: 262, y: 1360 } };
  for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) STU.teles.push({ x: 392 + i * 148, y: 550 + j * 142, k: j * 3 + i });
  MJ.STUDIO = STU;
  function makeStuFond() {
    return M.pre(W, BACK + 40, (c) => {
      const g = c.createLinearGradient(0, 150, 0, BACK); g.addColorStop(0, '#171a28'); g.addColorStop(1, '#262a3e'); c.fillStyle = g; c.fillRect(0, 0, W, BACK + 40);
      for (let y = 160; y < BACK; y += 120) for (let x = -30 + (Math.floor(y / 120) % 2) * 60; x < W; x += 120) { c.fillStyle = 'rgba(255,255,255,0.025)'; c.fillRect(x + 4, y + 4, 112, 112); c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 2; c.strokeRect(x + 4, y + 4, 112, 112); }
      // rampe de projecteurs en haut (passerelle)
      pc(rect(120, 292, 960, 304), '#2a2c32', null, 9500); for (let x = 160; x < 960; x += 110) { pc(rect(x - 14, 304, x + 14, 336), '#1a1a1e', null, 9501 + x, { drop: false }); }
      // étagère métallique du mur de téléviseurs
      const Mu = STU.mur; pc(rect(Mu.x0, Mu.y0, Mu.x1, Mu.y1), '#202228', () => { for (let j = 1; j < 3; j++) fillPts(rect(Mu.x0, Mu.y0 + j * 142 - 2, Mu.x1, Mu.y0 + j * 142 + 6), '#3a3c44'); strokePts(rect(Mu.x0 + 4, Mu.y0 + 4, Mu.x1 - 4, Mu.y1 - 4), 'rgba(150,150,160,0.3)', 1.6, true); }, 9510);
      // régie vitrée (côté cour, en hauteur) : vitre, technicien de dos, pupitre
      const R = STU.regie;
      pc(rect(R.x0 - 12, R.y0 - 12, R.x1 + 12, R.y1 + 12), '#3a3c44', () => fillPts(rect(R.x0, R.y0, R.x1, R.y1), '#10161c'), 9520);
      for (const [x, w] of [[R.x0 + 14, 50], [R.x0 + 74, 64]]) fillPts(rect(x, R.y0 + 30, x + w, R.y0 + 70), '#1e2a30');
      pc([[R.x0 + 60, R.y1], [R.x0 + 56, R.y1 - 70], [R.x0 + 70, R.y1 - 96], [R.x0 + 86, R.y1 - 100], [R.x0 + 102, R.y1 - 94], [R.x0 + 112, R.y1 - 70], [R.x0 + 110, R.y1]], '#0a0c10', null, 9521, { drop: false });
      pc(ell(R.x0 + 86, R.y1 - 118, 17, 19, 14), '#0a0c10', null, 9522, { drop: false }); strokePts(ep(R.x0 + 86, R.y1 - 120, 20, 20, 12, PI, TAU), '#2a2c32', 3);
      fillPts(rect(R.x0, R.y1 - 30, R.x1, R.y1), '#1a1c22');
      // horloge de studio (cadran à traits, aucun chiffre)
      const Ho = STU.horloge; pc(ell(Ho.x, Ho.y, Ho.r + 8, Ho.r + 8, 24), '#2a2c32', () => fillPts(ell(Ho.x, Ho.y, Ho.r, Ho.r, 24), '#0e1014'), 9530);
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; strokePts([[Ho.x + Math.cos(a) * (Ho.r - 12), Ho.y + Math.sin(a) * (Ho.r - 12)], [Ho.x + Math.cos(a) * (Ho.r - 4), Ho.y + Math.sin(a) * (Ho.r - 4)]], '#e8e4da', i % 3 ? 1.6 : 3); }
      // tubes des néons (éteints ; la lueur est ajoutée au dessin)
      c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = '#3a2a34'; c.lineWidth = 5; c.beginPath(); neonZ(c); c.stroke(); c.beginPath(); neonT(c); c.stroke();
    });
  }
  function neonZ(c) { const Z = STU.neonZ; c.moveTo(Z.x0, Z.y); for (let i = 1; i <= 16; i++) c.lineTo(Z.x0 + (Z.x1 - Z.x0) * i / 16, Z.y + (i % 2 ? -18 : 18)); }
  function neonT(c) { const T = STU.neonT; for (let i = 0; i <= 3; i++) { const a = -PI / 2 + i * TAU / 3; const x = T.x + Math.cos(a) * T.r, y = T.y + Math.sin(a) * T.r; i ? c.lineTo(x, y) : c.moveTo(x, y); } }
  function neon(path, col, a) {
    if (SIL()) return; const c = cx_(); c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; c.globalCompositeOperation = 'lighter';
    for (const [w, al] of [[18, 0.10], [9, 0.28], [3.2, 0.95]]) { c.strokeStyle = `rgba(${col},${al * a})`; c.lineWidth = w; c.beginPath(); path(c); c.stroke(); }
    c.restore();
  }
  function camera91(x, y) {
    pc([[x - 40, y], [x + 40, y], [x + 8, y - 30], [x - 8, y - 30]], '#26282e', null, 9600, { drop: false });
    pc(rect(x - 10, y - 250, x + 10, y - 30), '#3a3c44', () => strokePts([[x - 3, y - 246], [x - 3, y - 34]], 'rgba(255,255,255,0.2)', 2), 9601);
    pc(rrect(x - 70, y - 352, x + 64, y - 250, 10), '#4a4e56', () => { fillPts(rect(x - 70, y - 300, x + 64, y - 290), '#3a3c44'); hatch(null, 0.8, 3.6, 0.2, 1, M.P.encre, [x - 72, y - 354, x + 66, y - 248]); }, 9602);
    pc(rect(x - 134, y - 336, x - 70, y - 270), '#1e2024', () => { for (let i = 0; i < 4; i++) strokePts([[x - 130 + i * 15, y - 334], [x - 130 + i * 15, y - 272]], 'rgba(255,255,255,0.12)', 1.2); }, 9603);
    pc(ell(x - 136, y - 303, 10, 30, 14), '#2a3a4e', () => dot(x - 138, y - 314, 4, 'rgba(255,255,255,0.4)'), 9604, { drop: false });
    pc(rect(x + 18, y - 392, x + 70, y - 352), '#2a2c32', () => fillPts(rect(x + 24, y - 386, x + 64, y - 358), '#3a4a54'), 9605);
    for (const s of [-1, 1]) strokePts([[x + 20 + s * 30, y - 262], [x + 70 + s * 34, y - 236]], '#6a6e74', 3);
  }
  function makeStuMilieu() {
    return M.pre(W, BACK + 40, (c) => {
      // plante en pot (feuilles longues)
      const px = STU.plante; pc([[px - 34, BACK], [px + 34, BACK], [px + 42, BACK - 74], [px - 42, BACK - 74]], '#c4b8a0', () => { strokePts([[px - 40, BACK - 60], [px + 40, BACK - 60]], 'rgba(0,0,0,0.25)', 2); shade(px - 40, 0, px + 40, 0, 0.3, [px - 44, BACK - 76, px + 44, BACK]); }, 9700);
      for (let i = 0; i < 9; i++) { const a = -PI / 2 + (i - 4) * 0.2, L = 180 + 80 * H(i, 3), tip = [px + Math.cos(a) * L, BACK - 74 + Math.sin(a) * L], mid = [px + Math.cos(a) * L * 0.5 + (i - 4) * 12, BACK - 74 + Math.sin(a) * L * 0.5];
        pc(qbez([px - 4, BACK - 74], mid, tip, 8).concat(qbez(tip, [mid[0] + 14, mid[1] + 6], [px + 4, BACK - 74], 8)), i % 2 ? '#3e6a40' : '#4e7a4a', () => strokePts(qbez([px, BACK - 74], mid, tip, 8), 'rgba(20,40,20,0.4)', 1), 9701 + i, { drop: false }); }
      // canapé en cuir noir
      const Ca = STU.canape;
      pc(rrect(Ca.x0 + 10, BACK - 176, Ca.x1 - 10, BACK - 80, 22), '#1c1a1e', () => { for (let x = Ca.x0 + 70; x < Ca.x1 - 40; x += 70) strokePts([[x, BACK - 170], [x, BACK - 86]], 'rgba(255,255,255,0.08)', 2); strokePts([[Ca.x0 + 24, BACK - 166], [Ca.x1 - 24, BACK - 166]], 'rgba(255,255,255,0.22)', 2.4); }, 9720);
      pc(rrect(Ca.x0, BACK - 96, Ca.x1, BACK - 40, 14), '#26232a', () => strokePts([[Ca.x0 + 12, BACK - 90], [Ca.x1 - 12, BACK - 90]], 'rgba(255,255,255,0.2)', 2), 9721);
      for (const x of [Ca.x0, Ca.x1]) pc(rrect(x - 22, BACK - 130, x + 22, BACK - 30, 16), '#18161a', () => strokePts([[x - 14, BACK - 124], [x + 10, BACK - 124]], 'rgba(255,255,255,0.25)', 2), 9722 + x);
      for (const x of [Ca.x0 + 10, Ca.x1 - 10]) pc(rect(x - 6, BACK - 30, x + 6, BACK), '#c8ccd2', null, 9724 + x, { drop: false });
      camera91(STU.camera.x, BACK);
    });
  }
  function makeStuSol() {
    return M.pre(W, M.H, (c) => {
      for (const [a, b] of [[[150, 1478], [452, 1440]], [[866, 1400], [700, 1470]], [[934, 1476], [990, 1420]]]) strokePts(qbez(a, [(a[0] + b[0]) / 2, Math.max(a[1], b[1]) + 24], b, 14), '#141416', 4);
      // projecteur sur pied (côté jardin), tourné vers la scène
      const Pj = STU.projecteur; for (const s of [-1, 0, 1]) strokePts([[Pj.x, Pj.y - 70], [Pj.x + s * 40, Pj.y]], '#3a3c44', 3.4);
      pc(rect(Pj.x - 4, Pj.y - 250, Pj.x + 4, Pj.y - 70), '#5a5e66', null, 9800);
      c.save(); c.translate(Pj.x, Pj.y - 262); c.rotate(0.5); pc(rect(-30, -30, 34, 30), '#202226', () => { fillPts(rect(26, -26, 34, 26), '#f0e6c8'); for (let i = -20; i < 24; i += 8) strokePts([[i, -30], [i, -36]], '#3a3c44', 2); }, 9801); c.restore();
      // tabouret haut (côté cour)
      const Tb = STU.tabouret; pc(ell(Tb.x, Tb.y - 226, 34, 9, 16), '#1c1c20', () => strokePts([[Tb.x - 26, Tb.y - 229], [Tb.x + 26, Tb.y - 229]], 'rgba(255,255,255,0.25)', 2), 9810);
      for (const s of [-1, 1]) strokePts([[Tb.x + s * 18, Tb.y - 220], [Tb.x + s * 30, Tb.y]], '#9aa0a8', 3.4);
      strokePts([[Tb.x - 26, Tb.y - 70], [Tb.x + 26, Tb.y - 70]], '#9aa0a8', 2.6);
      // pied du ventilateur
      const V = STU.ventilo; strokePts([[V.x, V.y + 40], [V.x, Pj.y]], '#3a3c44', 4); pc(ell(V.x, Pj.y - 4, 30, 7, 14), '#2a2c32', null, 9820, { drop: false });
    });
  }
  // MJ.studio91(t, o) : o.ecrans (9 écrans : liste de modes 'formes'|'couleur'|'couronne'|'neige'|'eteint'|'presentatrice') ; o.neige (instant LOCAL : un écran passe à la neige 0,6 s) ;
  //   o.regie 0..1 (une lampe s'allume dans la régie) ; o.tele = [{ x, y (bas du poste), s (1), couleur, ecran, p (0..1 descente des cintres), pose }] ; o.lumiere 0..1
  MJ.studio91 = function (t, o) {
    o = o || {}; const K = MJ.K, c = cx_(), g = M.tg(t);
    c.drawImage(K.stuFond, 0, 0);
    // néons qui pulsent
    neon(neonZ, '235,110,170', 0.75 + 0.25 * Math.sin(g * 2.1)); neon(neonT, '100,215,210', 0.7 + 0.3 * Math.pow(Math.abs(Math.sin(g * 0.9)), 0.5));
    // régie : écrans de contrôle qui scintillent, lampe (o.regie)
    const R = STU.regie;
    if (!SIL()) { for (const [x, w, k] of [[R.x0 + 14, 50, 0], [R.x0 + 74, 64, 1]]) fillPts(rect(x, R.y0 + 30, x + w, R.y0 + 70), mixA('#24363e', '#8ab4c0', 0.55 + 0.25 * Math.sin(g * (3 + k * 2.3)) * Math.sin(g * 7.1 + k)), 0, 0);
      const rl = clamp(o.regie || 0); if (rl > 0) { dot(R.x1 - 24, R.y0 + 26, 8, mixA('#3a2a10', '#ffd070', rl)); glow(R.x1 - 24, R.y0 + 26, 90, '255,200,110', 0.35 * rl); } }
    // horloge
    const Ho = STU.horloge, sec = Math.floor(g) + ease(clamp((g % 1) / 0.12)), am = g / 600 * TAU + 1.2, ah = am / 12 + 3.4;
    for (const [a, l, w, col] of [[ah, Ho.r * 0.5, 4.5, '#e8e4da'], [am, Ho.r * 0.78, 3, '#e8e4da'], [sec / 60 * TAU, Ho.r * 0.86, 1.6, '#e8352a']]) strokePts([[Ho.x, Ho.y], [Ho.x + Math.sin(a) * l, Ho.y - Math.cos(a) * l]], col, w);
    dot(Ho.x, Ho.y, 4, '#e8352a');
    // mur de 9 téléviseurs (aucun logo) ; leurs écrans changent lentement
    const sn = o.neige != null && t >= o.neige && t < o.neige + 0.6 ? Math.floor(H(Math.floor(o.neige * 10), 3) * 9) : -1;
    const cases = ['anthracite', 'gris', 'anthracite', 'gris', 'anthracite', 'gris', 'anthracite', 'gris', 'anthracite'];
    STU.teles.forEach((T, i) => { const mode = (o.ecrans && o.ecrans[i]) || (sn === i ? 'neige' : ['formes', 'couleur'][(i + Math.floor((g + i * 1.9) / 7)) % 2]);
      MJ.tele(T.x, T.y, 0.6, { couleur: cases[i], ecran: mode, antenne: false, t, ph: i * 0.77 }); });
    c.drawImage(K.stuMilieu, 0, 0);
    // voyant rouge de la caméra qui clignote
    const Cm = STU.camera, on = Math.sin(g * TAU * 0.7) > -0.2 ? 1 : 0;
    dot(Cm.x + 54, BACK - 340, 5, on ? '#ff3a2a' : '#4a1a18'); glow(Cm.x + 54, BACK - 340, 34, '255,60,40', 0.5 * on);
    // postes supplémentaires qui descendent des cintres
    (o.tele || []).forEach((T, i) => { const p = clamp(T.p == null ? 1 : T.p), y = (T.y || 1000) - (1 - M.easeOut(p)) * 1300, rr = 0.012 * Math.sin(g * 1.3 + i);
      MJ.tele(T.x, y, T.s || 1, { couleur: T.couleur || 'gris', ecran: T.ecran || 'formes', fil: true, t, ph: i * 1.3 + 5, rot: rr, pose: T.pose, cast: { dx: 14, dy: 6, a: 0.3 } }); });
    // deux faisceaux doux depuis la passerelle
    faisceau(380, 330, 0.12 + 0.05 * Math.sin(g * 0.4), '200,200,240', 0.6); faisceau(720, 330, -0.14 - 0.05 * Math.sin(g * 0.33 + 1), '240,200,220', 0.6);
    M.poussiere(t, { x: 240, y: 360, w: 600, h: 980, n: 26, a: 0.5, seed: 41 });
    const lum = clamp(o.lumiere == null ? 1 : o.lumiere);
    if (lum < 1 && !SIL()) { c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = `rgba(30,34,60,${0.7 * (1 - lum)})`; c.fillRect(0, 0, W, BACK + 40); c.restore(); }
  };
  // MJ.studio91Sol(t, o) : premier plan (projecteur sur pied, tabouret haut, ventilateur qui tourne, câbles)
  MJ.studio91Sol = function (t) {
    const c = cx_(), g = M.tg(t), V = STU.ventilo;
    c.drawImage(MJ.K.stuSol, 0, 0);
    const va = g * 13;
    pc(ell(V.x, V.y, 40, 40, 22), 'rgba(60,64,70,0.5)', () => { for (let k = 0; k < 3; k++) { const a = va + k * TAU / 3; fillPts([[V.x, V.y], [V.x + Math.cos(a - 0.35) * 34, V.y + Math.sin(a - 0.35) * 34], [V.x + Math.cos(a + 0.25) * 36, V.y + Math.sin(a + 0.25) * 36]], 'rgba(200,205,212,0.75)', 0, 0); } }, 9830, { drop: false });
    for (let k = 0; k < 6; k++) strokePts([[V.x, V.y], [V.x + Math.cos(k * PI / 3) * 40, V.y + Math.sin(k * PI / 3) * 40]], 'rgba(30,32,36,0.8)', 1.1);
    strokePts(ep(V.x, V.y, 40, 40, 22, 0, TAU), '#2a2c30', 2.6); dot(V.x, V.y, 6, '#2a2c30');
    glow(STU.projecteur.x + 26, STU.projecteur.y - 248, 60, '255,240,200', 0.25 + 0.05 * Math.sin(g * 5));
  };

  // =====================================================================
  // 11) INIT
  // =====================================================================
  MJ.init = function () {
    if (MJ.K) return MJ.K;
    const K = (MJ.K = {});
    K.palFond = makePalFond(); K.palMilieu = makePalMilieu(); K.palSol = makePalSol();
    K.stuFond = makeStuFond(); K.stuMilieu = makeStuMilieu(); K.stuSol = makeStuSol();
    return K;
  };
})();
