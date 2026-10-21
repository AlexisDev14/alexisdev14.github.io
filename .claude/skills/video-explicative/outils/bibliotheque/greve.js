// greve.js — « Faire grève, quand c'était chercher du travail » (port de Grève 1750, place 1840, aujourd'hui), espace M.grv
// persos.js — « Faire grève, quand c'était chercher du travail » : marionnettes, accessoires et décors PROPRES À CETTE VIDÉO.
// Espace M.grv (alias GRV). Appeler GRV.init() dans S.init. Mode d'emploi : persos.md (ne pas lire ce fichier en entier).
// Aucun texte, lettre ni chiffre. Déterministe (hash, aucun Math.random). Tout dans une IIFE.
(function () {
  'use strict';
  const X = M.X, P = M.P, TAU = M.TAU, PI = Math.PI, D = 180 / PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, hash, noise, smooth } = M;
  const GRV = (M.grv = {});
  const CH = M.chars;
  const cx_ = () => M.ctx();
  const SIL = () => M._sil();
  const OFFP = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];

  // ------------------------------------------------------------ géométrie
  function ep(cx, cy, rx, ry, n, a0, a1) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; }
  function ell(cx, cy, rx, ry, n) { const o = ep(cx, cy, rx, ry, n || 16, 0, TAU); o.pop(); return o; }
  const mp = (m, p) => [m.a * p[0] + m.c * p[1] + m.e, m.b * p[0] + m.d * p[1] + m.f];
  const rot = (p, a) => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];
  const normA = (a) => { while (a > PI) a -= TAU; while (a < -PI) a += TAU; return a; };
  function rrect(x0, y0, x1, y1, r) {
    return ep(x1 - r, y0 + r, r, r, 4, -PI / 2, 0).concat(ep(x1 - r, y1 - r, r, r, 4, 0, PI / 2), ep(x0 + r, y1 - r, r, r, 4, PI / 2, PI), ep(x0 + r, y0 + r, r, r, 4, PI, PI * 1.5));
  }
  const box = (x0, y0, x1, y1) => [[x0, y0, 1], [x1, y0, 1], [x1, y1, 1], [x0, y1, 1]];
  const pc = (pts, base, paint, seed, o) => piece(pts, base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));
  const rgba = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
  GRV.geo = { ep, ell, rrect, box, mp, rot };

  // =====================================================================
  // OBJETS — chaque objet se dessine dans son repère, à l'échelle 1 (seul, tenu en main, ou « charge » portée à deux mains)
  // =====================================================================
  const BOIS = '#7a5a3a', BOISL = '#a07a52', BOISD = '#55402a', FER = '#5d6066', FERL = '#8e9298', FERD = '#3a3c40';
  const manche = (x0, y0, x1, y1, w, col, seed) => {                       // manche de bois (de (x0,y0) à (x1,y1), largeur w)
    const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy), nx = -dy / l * w / 2, ny = dx / l * w / 2;
    pc([[x0 + nx, y0 + ny], [x1 + nx, y1 + ny], [x1 - nx, y1 - ny], [x0 - nx, y0 - ny]], col || BOIS, () => {
      strokePts([[x0 + nx * 0.4, y0 + ny * 0.4], [x1 + nx * 0.4, y1 + ny * 0.4]], 'rgba(255,225,180,0.35)', 1.2);
      hatch(null, Math.atan2(dy, dx) + 0.4, 4, 0.18, 1, undefined, [Math.min(x0, x1) - 10, Math.min(y0, y1) - 10, Math.max(x0, x1) + 10, Math.max(y0, y1) + 10]);
    }, seed);
  };
  // ---- pelle (Jacques) : repère = bout de la lame en (0,0), manche vers le haut, poignée en T à y −392
  function drawPelle() {
    manche(0, -96, 0, -380, 13, BOIS, 7101);
    pc([[-22, -380, 1], [22, -380, 1], [22, -394, 1], [-22, -394, 1]], BOISD, null, 7102);
    pc([[-8, -96], [8, -96], [10, -118, 1], [-10, -118, 1]], FERD, null, 7103);
    pc([[-30, -100], [-10, -104], [10, -104], [30, -100], [32, -30], [22, -8], [0, 2, 1], [-22, -8], [-32, -30]], FER, () => {
      strokePts([[-18, -94], [-16, -20]], 'rgba(255,255,255,0.3)', 2); strokePts([[0, -98], [0, -14]], 'rgba(20,20,25,0.35)', 1.4);
      hatch(null, 0.9, 3.4, 0.2); shade(32, -50, -32, -50, 0.25);
      fillPts([[-26, -30], [26, -30], [20, -8], [0, 0], [-20, -8]], 'rgba(120,90,60,0.35)');     // terre sur la lame
    }, 7104);
  }
  // ---- maillet de tailleur de pierre (Martin) : repère = bas du manche (prise) en (0,0), tête ronde en haut
  function drawMaillet() {
    manche(0, 8, 0, -118, 12, BOISL, 7111);
    pc(ell(0, -146, 32, 34, 18), '#9a7650', () => { for (const r of [24, 16, 8]) strokePts(ep(0, -146, r, r * 1.05, 14, 0, TAU), 'rgba(80,50,25,0.35)', 1); hatch(null, 0.6, 3.6, 0.2); shade(30, -170, -30, -120, 0.35, [-40, -190, 40, -100]); }, 7112);
    pc(box(-8, -114, 8, -106), FERD, null, 7113);
  }
  // ---- scie à cadre (Paulin) : repère = poignée (0,0) ; lame vers +x
  function drawScie() {                                                         // égoïne : poignée fermée en bois, lame trapèze dentée vers +x
    pc([[14, -30], [236, -6], [240, 4, 1], [14, 30, 1]], FERL, () => { strokePts([[20, -20], [220, -4]], 'rgba(255,255,255,0.4)', 2); for (let x = 16; x < 238; x += 7) strokePts([[x, 30 - (x - 14) * 0.116], [x + 3.5, 35 - (x - 14) * 0.116], [x + 7, 30 - (x + 7 - 14) * 0.116]], FERD, 1); hatch(null, 0.2, 4, 0.12); }, 7121);
    pc([[-22, -40], [18, -38], [26, -24], [24, 34, 1], [-8, 36], [-26, 20], [-30, -10]], BOIS, () => { fillPts(rrect(-14, -24, 10, 18, 9), '#3a2a1c'); strokePts([[-24, -34], [16, -34]], 'rgba(255,225,180,0.35)', 1.4); for (const y of [-26, 22]) dot(20, y, 2.4, '#c9a24a'); }, 7122);
  }
  // ---- marteau de forgeron (1840) : repère = bas du manche (0,0)
  function drawMarteau() {
    manche(0, 10, 0, -150, 13, BOIS, 7131);
    pc([[-40, -176, 1], [34, -176], [44, -172, 1], [44, -146, 1], [34, -142], [-40, -142, 1], [-46, -150], [-46, -168]], FERD, () => {
      strokePts([[-38, -170], [40, -170]], 'rgba(255,255,255,0.25)', 2); hatch(null, 0.3, 3.4, 0.25); }, 7132);
  }
  // ---- varlope de menuisier (1840) : repère = poignée arrière (0,0) ; semelle vers le bas, long fût vers +x
  function drawVarlope() {
    pc([[-30, 40, 1], [200, 40, 1], [204, 30], [200, 6, 1], [-26, 6, 1], [-32, 18]], '#b48a56', () => {
      for (const y of [14, 24, 32]) strokePts([[-26, y], [196, y + 1]], 'rgba(90,60,30,0.3)', 1);
      fillPts([[60, 6], [74, 6], [70, 40], [62, 40]], '#4a3a2a'); hatch(null, 0.1, 4, 0.15); }, 7141);
    pc([[54, 8], [72, -26, 1], [80, -24, 1], [66, 8]], FERL, null, 7142);           // fer
    pc([[56, 8], [66, -18, 1], [74, -14], [70, 8]], BOISD, null, 7143);              // coin
    pc([[-22, 8], [-26, -28], [-14, -42], [12, -42], [18, -30], [16, 8]], '#9b7446', () => { fillPts(ell(-4, -18, 9, 13, 10), '#3a2a1c'); strokePts([[-20, -34], [12, -38]], 'rgba(255,225,180,0.35)', 1.2); }, 7144);  // poignée ajourée
    pc(ell(168, -6, 14, 14, 12), '#9b7446', null, 7145);                              // bouton avant
  }
  // ---- truelle de maçon (1840) : repère = manche (0,0) ; lame vers l'avant et le bas
  function drawTruelle() {
    pc(rrect(-46, -8, 12, 8, 7), BOIS, () => strokePts([[-40, -3], [6, -3]], 'rgba(255,225,180,0.35)', 1.2), 7151);
    strokePts([[12, 0], [24, 2], [30, 14]], FERD, 4);
    pc([[24, 12, 1], [84, 0], [150, 26, 1], [84, 52], [24, 40, 1]], FERL, () => { strokePts([[30, 22], [140, 26]], 'rgba(40,40,45,0.35)', 1.2); strokePts([[34, 16], [84, 6]], 'rgba(255,255,255,0.45)', 2); fillPts([[70, 36], [120, 34], [96, 44], [64, 44]], 'rgba(200,190,170,0.6)'); }, 7152);
  }
  // ---- canne à pommeau (patron) : repère = pommeau (0,0) en haut, embout en (0,250)
  function drawCanne() {
    manche(0, 6, 0, 246, 9, '#3a2418', 7161);
    pc(box(-5, 238, 5, 252), '#b08d45', null, 7162);
    pc(ell(0, -4, 13, 12, 14), '#b08d45', () => { strokePts([[-6, -10], [2, -12]], 'rgba(255,240,190,0.8)', 2); shade(10, -14, -10, 8, 0.4, [-16, -20, 16, 12]); }, 7163);
    pc(box(-7, 6, 7, 14), '#8a6a30', null, 7164);
  }
  // ---- carnet du gendarme (repère : dos du carnet, centre) — ouvert, pages sans écriture ; crayon
  function drawCarnet() {
    pc([[-44, -30, 1], [44, -30, 1], [44, 30, 1], [-44, 30, 1]], '#2e2a26', null, 7171);
    pc([[-40, -27, 1], [-2, -25, 1], [-2, 27, 1], [-40, 27, 1]], '#efe8d6', () => { for (let y = -16; y < 22; y += 7) strokePts([[-36, y], [-6, y]], 'rgba(120,120,140,0.35)', 0.9); }, 7172);
    pc([[2, -25, 1], [40, -27, 1], [40, 27, 1], [2, 27, 1]], '#f4eee0', () => { for (let y = -16; y < 22; y += 7) strokePts([[6, y], [36, y]], 'rgba(120,120,140,0.35)', 0.9); }, 7173);
  }
  function drawCrayon() { pc([[-6, -60, 1], [6, -60, 1], [6, 14, 1], [0, 30, 1], [-6, 14, 1]], '#c9a43c', () => { fillPts([[-6, 14], [6, 14], [0, 30]], '#e2c9a0'); dot(0, 28, 2, '#333'); }, 7174); }
  // ---- dossier ocre fermé (Hugo) : repère = centre
  function drawDossier() {
    pc(rrect(-52, -36, 52, 36, 4), '#c08d3e', () => { fillPts(box(-52, -36, 52, -30), '#a8772e'); strokePts([[-44, 26], [44, 26]], 'rgba(90,60,20,0.4)', 1); dot(44, 0, 3.5, '#7a5520'); hatch(null, 0.5, 5, 0.12); }, 7181);
    strokePts([[44, -36], [44, 36]], 'rgba(110,70,20,0.5)', 1.2);
  }
  // ---- marchandises : (0,0) = milieu du bas
  function drawFoin() {                                                          // botte de foin 128 × 86
    pc([[-64, 0, 1], [64, 0, 1], [66, -10], [62, -80], [50, -88], [-50, -88], [-62, -80], [-66, -10]], '#c9a84e', () => {
      const R = M.rng(77); for (let i = 0; i < 70; i++) { const x = -60 + R() * 120, y = -84 + R() * 80; strokePts([[x, y], [x + 10 + R() * 12, y - 2 + R() * 4]], i % 3 ? 'rgba(120,90,30,0.5)' : 'rgba(255,240,170,0.55)', 1); }
      for (const x of [-26, 26]) strokePts([[x, 0], [x + 2, -88]], '#7a5a2e', 2.4);
      shade(0, -88, 0, 0, 0.3, [-70, -95, 70, 5]);
    }, 7201);
    for (const [x, y, a] of [[-66, -40, 2.6], [64, -60, 0.4], [-50, -88, -1.8], [30, -88, -1.2]]) strokePts([[x, y], [x + Math.cos(a) * 14, y + Math.sin(a) * 14]], '#b3933c', 1.3);
  }
  function drawSac(o) {                                                          // sac de blé (toile, épis peints) ou de charbon (toile sombre, boulets) 110 × 150
    const ch = o.charbon;
    pc([[-50, -2], [-56, -60], [-50, -118], [-26, -134], [-12, -146], [12, -146], [26, -134], [50, -118], [56, -60], [50, -2], [0, 2]], ch ? '#4a4540' : '#cdba92', () => {
      if (!ch) {                                                                 // épis de blé peints (sans lettre)
        strokePts([[0, -30], [0, -100]], '#9a7a3a', 2);
        for (let i = 0; i < 6; i++) { const y = -96 + i * 10; fillPts(ell(-7, y, 6, 3.4, 8).map((p) => rot([p[0] + 7, p[1] - y], -0.5)).map((p) => [p[0] - 7, p[1] + y]), '#b98f3a'); fillPts(ell(7, y + 4, 6, 3.4, 8), '#b98f3a'); }
        for (const a of [-0.5, 0.5]) strokePts([[0, -40], [Math.sin(a) * 40, -40 - 30]], '#9a7a3a', 1.6);
      } else for (let i = 0; i < 10; i++) dot(-40 + hash(i) * 80, -100 + hash(i + 9) * 90, 2 + hash(i + 3) * 2, 'rgba(10,10,10,0.5)');
      strokePts([[-30, -128], [0, -122], [30, -128]], ch ? '#25211e' : '#8a6a3a', 2.4);
      hatch(null, 0.8, 4, ch ? 0.3 : 0.2); shade(50, -60, -50, -60, 0.3, [-60, -150, 60, 5]);
    }, 7211);
    if (ch) for (let i = 0; i < 6; i++) pc(ell(-24 + i * 10 + hash(i + 40) * 4, -146 - (i % 2) * 8 - hash(i) * 6, 9, 8, 10), '#151515', () => strokePts([[-4, -3], [2, -5]], 'rgba(255,255,255,0.35)', 1.2), 7212 + i);
    else pc([[-12, -146], [-18, -168], [-4, -158], [0, -172], [6, -158], [18, -166], [12, -146]], '#cdba92', null, 7219);
  }
  function drawTonneau(o) {                                                      // tonneau de vin 96 × 124, debout ; o.couche = vu par le fond (rond), o.roule (rad)
    if (o.couche) {
      const r = 50; c_save(); cx_().translate(0, -r); cx_().rotate(o.roule || 0);
      pc(ell(0, 0, r, r, 24), '#7a5a3a', () => { for (let i = -3; i <= 3; i++) strokePts([[i * 13, -r], [i * 13, r]], 'rgba(40,25,10,0.45)', 1.2); fillPts(ell(14, 18, 12, 8, 10), 'rgba(110,30,40,0.55)'); dot(-20, -20, 4, '#3a2a1a'); hatch(null, 1.2, 4, 0.18); }, 7221);
      strokePts(ell(0, 0, r - 5, r - 5, 24).concat([[r - 5, 0]]), '#3a3c40', 3.2);
      cx_().restore(); return;
    }
    pc([[-40, 0, 1], [40, 0, 1], [48, -30], [50, -62], [48, -94], [40, -124, 1], [-40, -124, 1], [-48, -94], [-50, -62], [-48, -30]], '#7a5a3a', () => {
      for (const x of [-30, -15, 0, 15, 30]) strokePts([[x * 0.85, 0], [x * 1.1, -62], [x * 0.85, -124]], 'rgba(40,25,10,0.45)', 1.1);
      for (const y of [-12, -32, -92, -112]) strokePts([[-50, y], [0, y + 3], [50, y]], '#3a3c40', 3.4);
      fillPts([[8, -70], [22, -66], [26, -52], [16, -44], [6, -52]], 'rgba(110,25,40,0.65)');   // tache bordeaux
      dot(-20, -62, 4, '#3a2a1a'); shade(48, -62, -48, -62, 0.35, [-55, -130, 55, 5]); hatch(null, 1.2, 4.5, 0.15);
    }, 7222);
  }
  const c_save = () => cx_().save();
  // ---- parchemin (loi de 1864) : (0,0) = centre ; o.deroule 0 = roulé, 1 = déroulé ; ruban + sceau de cire rouge ; lignes ondulées sans lettre
  function drawParchemin(o) {
    const d = clamp(o.deroule == null ? 0 : o.deroule), h = lerp(0, 230, ease(d));
    if (h > 8) pc([[-92, -h / 2, 1], [92, -h / 2, 1], [94, h / 2, 1], [-94, h / 2, 1]], '#e8d9b0', () => {
      for (let y = -h / 2 + 26; y < h / 2 - 50; y += 15) { const pts = []; for (let x = -72; x <= 72; x += 8) pts.push([x, y + Math.sin(x * 0.25 + y) * 1.6]); strokePts(pts, 'rgba(110,100,90,0.55)', 1.3); }
      shade(-94, 0, 94, 0, 0.18, [-100, -h / 2, 100, h / 2]); hatch(null, 0.5, 6, 0.1);
    }, 7231);
    for (const sy of (h > 8 ? [-1, 1] : [0])) pc(rrect(-104, sy * h / 2 - 18, 104, sy * h / 2 + 18, 16), '#dcc89a', () => { strokePts([[-98, sy * h / 2 - 8], [98, sy * h / 2 - 8]], 'rgba(255,250,230,0.6)', 2); shade(0, sy * h / 2 - 18, 0, sy * h / 2 + 18, 0.35, [-110, sy * h / 2 - 20, 110, sy * h / 2 + 20]); }, 7232 + sy);
    const sy = h > 8 ? h / 2 : 0;
    pc([[-14, sy], [-30, sy + 54, 1], [-18, sy + 48], [-10, sy + 58, 1], [-2, sy + 6]], '#7a2a3a', null, 7235);       // rubans
    pc([[2, sy + 6], [14, sy + 60, 1], [22, sy + 50], [34, sy + 58, 1], [14, sy]], '#8a3040', null, 7236);
    pc(ell(0, sy + 6, 26, 25, 18), '#a3261f', () => { strokePts(ep(0, sy + 6, 16, 16, 16, 0, TAU), 'rgba(60,10,8,0.5)', 1.6); strokePts([[-8, sy - 6], [4, sy - 10]], 'rgba(255,200,180,0.6)', 2); dot(0, sy + 6, 5, '#7e1a15'); }, 7237);
  }
  // ---- livre de 1946 : (0,0) = centre ; couverture bleu nuit, Marianne de profil (chignon, couronne de laurier, SANS bonnet) en médaillon doré, liseré tricolore
  function drawLivre() {
    pc([[-96, -126, 1], [96, -126, 1], [104, -118, 1], [104, 132, 1], [-88, 132, 1], [-96, 124, 1]], '#ece4d0', () => { for (let y = -110; y < 130; y += 5) strokePts([[96, y], [104, y + 6]], 'rgba(120,100,70,0.35)', 0.8); }, 7241);
    pc(rrect(-100, -130, 98, 126, 6), '#1f2b4a', () => {
      fillPts(box(-100, -130, -78, 126), '#17203a');
      for (const [x, col] of [[-74, '#2e4a8c'], [-68, '#efe8d8'], [-62, '#b0302a']]) fillPts(box(x, -120, x + 6, 116), col);   // liseré tricolore
      strokePts(rrect(-50, -112, 86, 108, 4).concat([[86, -108]]), 'rgba(190,150,70,0.8)', 1.6);
      hatch(null, 0.9, 5, 0.12); shade(98, -130, -100, 126, 0.25, [-100, -130, 100, 130]);
    }, 7242);
    pc(ell(18, -10, 52, 52, 28), '#b8923e', () => { strokePts(ep(18, -10, 45, 45, 28, 0, TAU), 'rgba(90,60,10,0.6)', 1.4); }, 7243);
    // profil de Marianne (regarde vers la gauche) : chignon, couronne de laurier, SANS bonnet
    const MX = 18, MY = -10, mf = (pts) => pts.map(([x, y]) => [x + MX, y + MY]);
    pc(mf([[24, -40], [8, -44], [-6, -38], [-12, -28], [-13, -20], [-22, -10, 1], [-14, -7], [-15, -2], [-11, 1], [-14, 5], [-10, 8], [-11, 14], [-4, 20], [6, 20], [8, 32], [4, 42, 1], [30, 42, 1], [26, 26], [32, 12], [40, -6], [38, -28]]), '#e0bf6a', () => {
      fillPts(mf([[26, -42], [8, -46], [-6, -40], [-8, -30], [4, -34], [16, -30], [24, -18], [28, 4], [30, 16], [38, 8], [44, -10], [42, -30], [34, -42]]), '#c79a3c');
      fillPts(ell(42 + MX, -8 + MY, 10, 9, 10), '#b98a30');
      for (let i = 0; i < 6; i++) { const a = -2.6 + i * 0.36; fillPts(ell(MX + 14 + Math.cos(a) * 26, MY - 12 + Math.sin(a) * 26, 4.5, 2.2, 6), '#6b7a30'); }
      dot(MX - 4, MY - 24, 1.5, 'rgba(80,50,10,0.85)'); strokePts(mf([[-10, -26], [-2, -28]]), 'rgba(80,50,10,0.6)', 1); strokePts(mf([[-13, 2], [-8, 2]]), 'rgba(80,50,10,0.6)', 1);
      shade(MX - 14, MY, MX + 40, MY, 0.25, [MX - 30, MY - 50, MX + 50, MY + 50]);
    }, 7244);
  }

  // registre : grip = point tenu dans le poing ; p2 = seconde prise ; pts = points nommés ; base = point posé au sol (accessoire seul) ; held = options en main
  const OBJ = {
    pelle: { draw: drawPelle, grip: [0, -330], p2: () => [0, -190], pts: { lame: [0, -40], bout: [0, 0] }, base: [0, 0], ang: 0 },
    maillet: { draw: drawMaillet, grip: [0, -6], pts: { tete: [0, -146] }, base: [0, 0], ang: 0 },
    scie: { draw: drawScie, grip: [-6, -2], pts: { avant: [240, 0], lame: [120, 20] }, base: [100, 36], ang: 0 },
    marteau: { draw: drawMarteau, grip: [0, -8], pts: { tete: [0, -160] }, base: [0, 0], ang: 0 },
    varlope: { draw: drawVarlope, grip: [-4, -26], pts: { avant: [200, 24] }, base: [80, 40], ang: 0 },
    truelle: { draw: drawTruelle, grip: [-16, 0], pts: { pointe: [150, 26] }, base: [40, 52], ang: 0 },
    canne: { draw: drawCanne, grip: (o) => [0, lerp(14, 210, clamp(o.glisse || 0))], pts: { pommeau: [0, -6], embout: [0, 250] }, base: [0, 252] },
    carnet: { draw: drawCarnet, grip: [-30, 26], pts: { page: [20, 0] }, base: [0, 30] },
    crayon: { draw: drawCrayon, grip: [0, -12], pts: { mine: [0, 30] }, base: [0, 30] },
    dossier: { draw: drawDossier, grip: [-36, 28], pts: {}, base: [0, 36] },
    ble: { draw: (o) => drawSac(o), grip: [44, -110], p2: () => [-44, -40], pts: { col: [0, -146] }, base: [0, 0] },
    charbon: { draw: (o) => drawSac(Object.assign({ charbon: true }, o)), grip: [44, -110], p2: () => [-44, -40], pts: { col: [0, -146] }, base: [0, 0] },
    foin: { draw: drawFoin, grip: [50, -60], p2: () => [-50, -30], pts: {}, base: [0, 0] },
    tonneau: { draw: drawTonneau, grip: [44, -80], p2: () => [-44, -40], pts: {}, base: [0, 0] },
    parchemin: { draw: drawParchemin, grip: [-96, 0], pts: { sceau: [0, 6] }, base: [0, 0] },
    livre: { draw: drawLivre, grip: [-90, 60], pts: { medaillon: [18, -10] }, base: [0, 0] },
  };
  GRV.OBJ = OBJ;
  const gripOf = (ob, o) => (typeof ob.grip === 'function' ? ob.grip(o) : ob.grip);
  function heldOpts(name, o, p) { const ob = OBJ[name]; return Object.assign({ t: p.t || 0 }, ob.held || {}, o || {}); }
  function heldDraw(name, o, p) {
    const ob = OBJ[name]; if (!ob) return;
    const oo = heldOpts(name, o, p), g = gripOf(ob, oo), c = cx_();
    c.save(); c.translate(-g[0], -g[1]); ob.draw(oo); c.restore();
  }

  // ---- accessoire seul : M.puppet à une pièce invisible (ombre portée possible), l'objet se dessine dans l'extra
  const accDefs = {};
  function accDef(name, fn) { return accDefs[name] || (accDefs[name] = { hipY: 0, handLen: 10, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => fn(p.o) } }, order: ['o'] }); }
  function accRaw(key, fn, x, y, s, o) {
    o = o || {};
    return M.puppet(accDef(key, fn), { o, tilt: o.rot || 0 }, x, y, s == null ? 1 : s, { dir: o.dir || 1, rod: false, slot: o.slot != null ? o.slot : y + 6 * (s || 1), floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
  }
  function acc(name, x, y, s, o) {
    const ob = OBJ[name];
    return accRaw(name, (oo) => { const c = cx_(); c.save(); c.translate(-ob.base[0], -ob.base[1]); ob.draw(Object.assign({ t: 0 }, oo)); c.restore(); }, x, y, s == null ? 0.9 : s, o);
  }
  GRV.outil = (nom, x, y, s, o) => acc(nom, x, y, s, o);
  GRV.marchandise = (nom, x, y, s, o) => acc(nom, x, y, s, o);
  for (const n of ['parchemin', 'livre', 'carnet', 'dossier', 'canne']) GRV[n] = (x, y, s, o) => acc(n, x, y, s == null ? 1 : s, o);

  // =====================================================================
  // LE CAILLOU — galet gris-beige 130 × 95 (s = 1), yeux peints, paupières, sourcils ; (x,y) = milieu du dessous
  // =====================================================================
  const CA = { base: '#9C9283', ombre: '#6F675B', reflet: '#C9C0B0' };
  const CA_PTS = [[-64, -8], [-66, -34], [-56, -64], [-34, -86], [-4, -95], [28, -91], [52, -76], [64, -52], [66, -24], [60, -6], [40, 0, 1], [-44, 0, 1]];
  const CA_EYES = [[6, -58], [34, -56]];
  function drawCaillou(o) {
    const t = o.t || 0, lid = clamp(o.dort ? 1 : (o.lid || 0)), hu = clamp(o.humeur || 0, -1, 1), nb = clamp(o.noirci || 0);
    const rg = o.regard || [0.4, 0], sq = o.sursaut ? Math.sin(clamp(o.sursaut) * PI) : 0;
    const c = cx_(); c.save();
    c.translate(0, -sq * 34); c.scale(1 - sq * 0.08, 1 + sq * 0.1);
    if (o.dort) c.scale(1 + 0.02 * Math.sin(t * 2.2), 1 - 0.02 * Math.sin(t * 2.2));          // respiration du dormeur
    pc(CA_PTS, CA.base, () => {
      fillPts([[-58, -40], [-50, -70], [-26, -88], [8, -94], [-14, -80], [-38, -60]], CA.reflet);
      fillPts([[-60, -10], [60, -8], [64, -30], [40, -14], [0, -10], [-40, -14]], CA.ombre);
      for (let i = 0; i < 14; i++) dot(-50 + hash(i * 3.1) * 100, -80 + hash(i * 7.7) * 70, 1 + hash(i) * 1.2, 'rgba(70,62,52,0.45)');
      hatch([[10, -8], [66, -8], [66, -60], [30, -40]], 0.8, 4, 0.18);
      shade(-40, -80, 50, 0, 0.3, [-70, -100, 70, 5]);
      if (nb > 0) {                                                               // noirci par le charbon
        c.save(); c.globalAlpha = nb;
        fillPts([[-66, -30], [-40, -56], [-10, -40], [20, -70], [50, -60], [66, -30], [50, -6], [-50, -6]], 'rgba(30,28,26,0.65)');
        fillPts([[-30, -84], [-6, -92], [12, -80], [-10, -70]], 'rgba(30,28,26,0.55)');
        for (let i = 0; i < 18; i++) dot(-56 + hash(i * 5.3) * 112, -88 + hash(i * 2.9) * 84, 1.5 + hash(i + 2) * 2.5, 'rgba(10,10,10,0.7)');
        c.restore();
      }
      // yeux : points noirs peints (reflet), paupières couleur pierre qui descendent du haut
      for (const [ex, ey] of CA_EYES) {
        if (lid < 0.98) { dot(ex + rg[0] * 3, ey + rg[1] * 3, 6.2, '#141210'); dot(ex + rg[0] * 3 + 2, ey + rg[1] * 3 - 2.2, 1.8, 'rgba(255,255,255,0.85)'); }
        if (lid > 0.02) {
          const yb = ey - 8 + 16 * lid;
          fillPts([[ex - 9, ey - 9], [ex + 9, ey - 9], [ex + 9, yb], [ex, yb + 1.5], [ex - 9, yb]], nb > 0.5 ? '#55504a' : CA.base, 0, 0);
          strokePts([[ex - 8, yb - 0.5], [ex, yb + 1.5], [ex + 8, yb - 0.5]], 'rgba(40,34,28,0.9)', 1.6);
        }
      }
      // sourcils : humeur −1 contents (arqués hauts), 0 neutres, 1 vexés (en V)
      for (let k = 0; k < 2; k++) {
        const [ex, ey] = CA_EYES[k], sg = k === 0 ? -1 : 1, by = ey - 15 - (hu < 0 ? -hu * 3 : 0);
        const inner = [ex - sg * 7, by + hu * 5], outer = [ex + sg * 8, by - hu * 3], mid = [ex, by - 2 - (hu < 0 ? -hu * 3 : 0)];
        strokePts(sg < 0 ? [outer, mid, inner] : [inner, mid, outer], 'rgba(40,34,28,0.9)', 2.4);
      }
      if (hu < -0.4) strokePts([[12, -34], [20, -31], [28, -34]], 'rgba(40,34,28,0.7)', 1.6);       // petit sourire peint (content)
    }, 7301);
    c.restore();
    if (o.dort && !SIL()) {                                                       // bulle de souffle (sans lettre) : gonfle puis éclate, en boucle
      const per = 2.6, u = ((t % per) + per) % per / per, r = 4 + 15 * ease(Math.min(1, u / 0.85)), a = u < 0.85 ? 0.85 : 0.85 * (1 - (u - 0.85) / 0.15);
      c.save(); c.globalAlpha = a; c.beginPath(); c.arc(54 + r * 0.8, -44 - r * 0.6, r, 0, TAU);
      c.fillStyle = 'rgba(220,235,245,0.45)'; c.fill(); c.strokeStyle = 'rgba(90,110,130,0.8)'; c.lineWidth = 1.4; c.stroke();
      c.beginPath(); c.arc(54 + r * 0.5, -44 - r * 0.95, r * 0.25, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.8)'; c.fill(); c.restore();
    }
  }
  OBJ.caillou = { draw: drawCaillou, grip: [0, -47], pts: { yeux: [20, -57], bulle: [70, -60] }, base: [0, 0] };
  // GRV.caillou(x,y,s,o) : o.lid 0..1, o.humeur −1..1, o.regard [dx,dy] (−1..1), o.sursaut 0..1 (bond), o.dort (paupières closes + bulle, o.t), o.noirci 0..1
  GRV.caillou = (x, y, s, o) => accRaw('caillou', (oo) => drawCaillou(oo), x, y, s == null ? 1 : s, o);
  GRV.CAILLOU = { w: 130, h: 95, yeux: [20, -57] };

  // =====================================================================
  // CORPS — bras et jambes à articulations rondes (rivet au centre), genoux et chevilles articulés
  // =====================================================================
  const R_COUDE = 11.5, LA = 96, LB = Math.hypot(4, 96), PHI = Math.atan2(-4, 96), SH_F = [-2, -146], SH_B = [-10, -146];
  const KNEE = 108, ANK = 117, HIPY = -238;
  function armR(len, wt) { wt = wt || 15; return ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1, 40], [R_COUDE + 0.5, len - 6]], ep(0, len, R_COUDE, R_COUDE, 10, 0, PI), [[-R_COUDE - 0.5, len - 6], [-wt + 1, 40]]); }
  const HAND_CUP = [[-8, 78], [8, 78], [12, 86], [17, 92], [14, 96], [9, 93], [8, 104], [11, 111], [15, 113], [12, 119], [3, 119], [-5, 114], [-9, 102], [-9, 90]];
  function foreR(kind) {
    if (kind === 'cup') return ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU).concat([[11, 0], [10, 40], [9, 76]], HAND_CUP.slice(2, -1).map((p) => [p[0] * 1.05, p[1]]), [[-9, 86], [-10, 76], [-11, 40]]);
    const f = X.forePts(kind); return ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU).concat(f.slice(2));
  }
  function ik2(S, T, pick) {
    const vx = T[0] - S[0], vy = T[1] - S[1];
    const d = clamp(Math.hypot(vx, vy), Math.abs(LA - LB) + 1, LA + LB - 0.5), tv = Math.atan2(-vx, vy);
    const a1 = Math.acos(clamp((LA * LA + d * d - LB * LB) / (2 * LA * d), -1, 1));
    let best = null;
    for (const sg of [1, -1]) {
      const a = tv + sg * a1, E = [S[0] - LA * Math.sin(a), S[1] + LA * Math.cos(a)];
      const cAbs = Math.atan2(-(T[0] - E[0]), T[1] - E[1]) - PHI;
      const b = normA(cAbs - a);
      if (b > 0.05) continue;                                                   // coude toujours plié vers l'avant (jamais cassé)
      const sc = pick === 'avant' ? E[0] : pick === 'arriere' ? -E[0] : E[1];
      if (!best || sc > best.sc) best = { a: normA(a), b, sc };
    }
    if (!best) { const a = tv; best = { a: normA(a), b: 0 }; }
    return best;
  }
  const thighPts = (th) => [[-19 * th, -12], [17 * th, -14], [22 * th, 20], [20 * th, 70], [17, KNEE - 6]].concat(ep(0, KNEE, 17, 17, 8, 0, PI), [[-17, KNEE - 6], [-21 * th, 60], [-22 * th, 10]]);
  const shinPts = () => ep(0, 0, 16, 16, 8, PI, TAU).concat([[16, 12], [15, 60], [12, ANK - 14], [13, ANK + 3], [-15, ANK + 3], [-16, 70], [-17, 20], [-16, 8]]);
  const FOOT = {
    soulier: [[-16, -6], [12, -6], [22, -1], [38, 3], [46, 11, 1], [45, 15, 1], [-17, 15, 1], [-19, 5]],
    sabot: [[-17, -9], [8, -9], [26, -4], [44, -1], [54, -8, 1], [53, 4], [46, 15, 1], [-17, 15, 1], [-20, 2]],
    basket: [[-17, -8], [10, -8], [24, -2], [40, 2], [49, 9], [48, 15, 1], [-18, 15, 1], [-20, 3]],
    botte: [[-17, -6], [14, -6], [24, -1], [40, 3], [47, 11, 1], [46, 15, 1], [-18, 15, 1], [-20, 5]],
  };
  function footPaint(kind, col) {
    return () => {
      if (kind === 'basket') { fillPts([[-20, 8], [50, 8], [50, 16], [-20, 16]], '#cfc8b9'); strokePts([[0, -4], [24, 0]], 'rgba(120,110,100,0.6)', 1.2); strokePts([[-10, 4], [36, 6]], '#b98a5a', 1.4); return; }
      if (kind === 'sabot') { strokePts([[-14, -2], [40, 2]], 'rgba(255,230,180,0.35)', 1.4); hatch(null, 0.4, 4, 0.2); return; }
      fillPts([[-20, 11], [50, 11], [50, 16], [-20, 16]], 'rgba(10,8,6,0.55)'); strokePts([[16, -2], [36, 3]], 'rgba(255,255,255,0.22)', 1.3);
      if (kind === 'boucle') { fillPts(box(14, -4, 24, 4), '#c9a24a'); }
    };
  }
  // pièces « objet tenu » (TEF) + « charge » portée à deux mains (dessinée dans le repère du torse, devant ou dans le dos)
  const DOIGTS = [[-13, -9], [9, -11], [12, -4], [12, 6], [6, 11], [-6, 11], [-13, 4]];
  const doigtsPaint = () => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(70,40,30,0.5)', 1); hatch(null, 0.9, 3.4, 0.15); };
  function chargeDraw(p, dos) {
    const ch = p._charge; if (!ch || !!ch.dos !== dos) return;
    const ob = OBJ[ch.nom], c = cx_(); c.save(); c.translate(ch.pos[0], ch.pos[1]); c.rotate(ch.angT); c.translate(-ob.base[0], -ob.base[1]); ob.draw(Object.assign({ t: p.t || 0 }, ch.o)); c.restore();
  }
  function heldParts(skin, seed) {
    const has = (v) => v && v !== 'rien';
    return {
      objet: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (has(p.tenu)) heldDraw(p.tenu, p.tenuO, p); } },
      doigts: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 2, pts: (p) => (has(p.tenu) || (p._charge && p._charge.tient) ? DOIGTS : OFFP), paint: doigtsPaint },
      objetB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 3, pts: OFFP, extra: (p) => { if (has(p.tenuB)) heldDraw(p.tenuB, p.tenuBO, p); } },
      doigtsB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 4, pts: (p) => (has(p.tenuB) || p._deux ? DOIGTS : OFFP), paint: doigtsPaint },
      charge: { parent: 'torso', at: [0, 0], noRivet: true, base: '#000', seed: seed + 5, pts: OFFP, extra: (p) => chargeDraw(p, false) },
      chargeDos: { parent: 'torso', at: [0, 0], noRivet: true, base: '#000', seed: seed + 6, pts: OFFP, extra: (p) => chargeDraw(p, true) },
    };
  }
  function foreDef(parent, base, skin, back, seed, o) {
    const hk = (p) => (back ? p.handB : p.handF) || 'fist';
    return { parent, at: [0, LA], pts: (p) => foreR(hk(p)), base, seed, paint: (p) => {
      const k = hk(p);
      if (o.roule != null) fillPts([[-24, o.roule, 1], [24, o.roule, 1], [24, 140, 1], [-24, 140, 1]], skin);
      fillPts([[-20, 76, 1], [20, 76, 1], [24, 130, 1], [-20, 130, 1]], skin);
      if (k === 'cup') { strokePts([[2, 100], [6, 110]], 'rgba(70,35,20,0.45)', 1); hatch([[-12, 76], [-2, 76], [-2, 122], [-12, 122]], 0.9, 3.4, 0.22); } else X.handPaint(null, k);
      if (o.roule != null) fillPts([[-15, o.roule - 8, 1], [15, o.roule - 8, 1], [15, o.roule + 4, 1], [-15, o.roule + 4, 1]], o.cuff || base);
      else if (o.cuff) fillPts([[-14, 62, 1], [14, 62, 1], [15, 78, 1], [-14, 78, 1]], o.cuff);
      if (o.lo) o.lo(p, back);
      hatch([[-14, -10], [-3, -10], [-3, Math.min(60, o.roule || 60)], [-14, Math.min(60, o.roule || 60)]], 0.9, 3.8, 0.22);
    } };
  }
  // torse générique : w largeur, hem bas de l'habit (y local), belly ventre, tails pans arrière
  function torsoPts(w, hem, belly, tails) {
    belly = belly || 0;
    const back = tails ? [[-40 * w, tails, 1], [-26 * w, tails - 6], [-30 * w, hem + 10]] : [[-40 * w, hem + 2, 1]];
    return [[-14, -176], [8, -180], [16, -168], [26 * w, -150], [34 * w, -112], [36 * w + belly * 0.7, -70], [36 * w + belly, -30], [36 * w + belly * 0.6, 4], [38 * w, hem * 0.55], [40 * w, hem, 1], [0, hem + 2]]
      .concat(back, [[-38 * w, hem * 0.4], [-38 * w, -60], [-37 * w, -110], [-33 * w, -150], [-26, -168]]);
  }
  // fabrique d'une marionnette : o = { seed, torso, coat, torsoPaint, sleeve, sleeveB, skin, skinD, cuff, roule, armW, thigh, thighB, shin, shinB, shinPaint,
  //   shoe, foot, head, headPaint, parts (pièces en plus), backs / heads / fronts (ordre) }
  function body(o) {
    const sd = o.seed, th = o.th || 1;
    const legPaint = (back, lo) => () => { if (lo && o.shinPaint) o.shinPaint(back); if (!lo && o.thighPaint) o.thighPaint(back); hatch(back ? null : [[-26, -20], [-6, -20], [-6, 130], [-26, 130]], 0.8, 3.8, back ? 0.3 : 0.22); };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: o.torso, base: o.coat, seed: sd, paint: o.torsoPaint },
      legB: { parent: 'torso', at: [-6, -2], pts: thighPts(th), base: o.thighB || o.thigh, seed: sd + 1, noRivet: true, paint: legPaint(true, false) },
      legB_lo: { parent: 'legB', at: [0, KNEE], pts: shinPts(), base: o.shinB || o.shin || o.thighB || o.thigh, seed: sd + 2, noRivet: true, paint: legPaint(true, true) },
      footB: { parent: 'legB_lo', at: [0, ANK], pts: FOOT[o.foot === 'boucle' ? 'soulier' : (o.foot || 'soulier')], base: o.shoeB || o.shoe, seed: sd + 3, noRivet: true, paint: footPaint(o.foot, o.shoe) },
      legF: { parent: 'torso', at: [6, -2], pts: thighPts(th), base: o.thigh, seed: sd + 4, paint: legPaint(false, false) },
      legF_lo: { parent: 'legF', at: [0, KNEE], pts: shinPts(), base: o.shin || o.thigh, seed: sd + 5, paint: legPaint(false, true) },
      footF: { parent: 'legF_lo', at: [0, ANK], pts: FOOT[o.foot === 'boucle' ? 'soulier' : (o.foot || 'soulier')], base: o.shoe, seed: sd + 6, noRivet: true, paint: footPaint(o.foot, o.shoe) },
      armB_up: { parent: 'torso', at: SH_B, pts: armR(LA, o.armW), base: o.sleeveB || o.sleeve, seed: sd + 7, paint: () => hatch(null, 0.8, 3.6, 0.3) },
      armB_lo: foreDef('armB_up', o.sleeveB || o.sleeve, o.skinD, true, sd + 8, o),
      head: { parent: 'torso', at: [6, -170], pts: o.head || X.NAP_HEAD, base: o.skin, seed: sd + 9, noRivet: true, paint: o.headPaint },
      armF_up: { parent: 'torso', at: SH_F, pts: armR(LA, o.armW), base: o.sleeve, seed: sd + 10, paint: () => hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.26) },
      armF_lo: foreDef('armF_up', o.sleeve, o.skin, false, sd + 11, o),
    };
    Object.assign(parts, heldParts(o.skin, sd + 20), o.parts || {});
    const order = ['armB_up', 'armB_lo', 'objetB', 'legB', 'legB_lo', 'footB', 'legF', 'legF_lo', 'footF'].concat(o.backs || [], ['chargeDos', 'head'], o.heads || [], ['torso'], o.fronts || [],
      ['charge', 'armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsB']);
    return { hipY: HIPY, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, parts, order };
  }
  // visage commun
  function face(p, o) {
    const f = p.face || {};
    X.earPaint(o.ear ? o.ear[0] : -8, o.ear ? o.ear[1] : -44);
    hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.26);
    if (o.joue) dot(14, -32, 8, o.joue);
    X.eye(f, 17, -52, o.eyeSz || 1); X.brow(f, 17, o.browY || -60, o.browCol || 'rgba(45,30,22,0.95)', o.browW || 2.4); X.mouth(f, 27, -27, o.lip);
  }

  // =====================================================================
  // POSES — aides communes
  // =====================================================================
  function prep(p) { p = p || {}; return Object.assign({}, p, { ang: Object.assign({}, p.ang), hide: Object.assign({}, p.hide), face: Object.assign({}, p.face) }); }
  const toTorso = (q, P_) => { const r = rot(P_, -(q.tilt || 0)); return [r[0] - (q.dx || 0), r[1] - (HIPY + (q.dy || 0))]; };
  const toWorld = (q, T) => rot([T[0] + (q.dx || 0), T[1] + HIPY + (q.dy || 0)], q.tilt || 0);
  function headPt(q, hx, hy) { return mp(new DOMMatrix().translate(6, -170).rotate((q.ang.head || 0) * D), [hx, hy]); }
  function armTo(q, arm, T, pick, k) {
    if (k <= 0) return;
    const sol = ik2(arm === 'armF' ? SH_F : SH_B, T, pick), A = q.ang;
    const a0 = A[arm + '_up'] || 0, b0 = A[arm + '_lo'] || 0;
    A[arm + '_up'] = a0 + normA(sol.a - a0) * k; A[arm + '_lo'] = b0 + normA(sol.b - b0) * k;
  }
  const blend = (q, n, v, k) => { q.ang[n] = lerp(q.ang[n] || 0, v, k); };
  const add = (q, n, v) => { q.ang[n] = (q.ang[n] || 0) + v; };
  function plier(q, th) {                                                      // plie le buste aux hanches (th > 0 = vers l'avant), jambes verticales
    if (!th) return;
    q.tilt = (q.tilt || 0) + th; q.dx = (q.dx || 0) - 238 * Math.sin(th); q.dy = (q.dy || 0) + 238 * (1 - Math.cos(th));
    add(q, 'legF', -th); add(q, 'legB', -th);
  }
  // jambes à deux segments : amène la cheville sur A (repère des pieds), genou vers le haut / l'avant ; pied à plat
  function legTo(q, leg, Aw, k) {
    const H = toWorld(q, [leg === 'legF' ? 6 : -6, -2]), vx = Aw[0] - H[0], vy = Aw[1] - H[1];
    const d = clamp(Math.hypot(vx, vy), Math.abs(KNEE - ANK) + 1, KNEE + ANK - 0.5), tv = Math.atan2(-vx, vy);
    const a1 = Math.acos(clamp((KNEE * KNEE + d * d - ANK * ANK) / (2 * KNEE * d), -1, 1));
    let best = null;
    for (const sg of [1, -1]) { const a = tv + sg * a1, E = [H[0] - KNEE * Math.sin(a), H[1] + KNEE * Math.cos(a)]; if (!best || E[1] < best.E[1]) best = { a, E }; }
    const sAbs = Math.atan2(-(Aw[0] - best.E[0]), Aw[1] - best.E[1]), tl = q.tilt || 0;
    blend(q, leg, normA(best.a - tl), k); blend(q, leg + '_lo', normA(sAbs - best.a), k); blend(q, leg === 'legF' ? 'footF' : 'footB', normA(-sAbs), k);
  }
  const has = (v) => v && v !== 'rien';

  // gestes communs à toutes les marionnettes (valeurs 0..1)
  function gestes(q) {
    const A = q.ang, t = q.t || 0;
    if (q.marche) {                                                             // pas sur place (le plan déplace x) ; q.t obligatoire
      const k = clamp(q.marche), ph = t * (q.cadence || 6), sw = Math.sin(ph) * 0.3 * k;
      add(q, 'legF', -sw); add(q, 'legB', sw);
      add(q, 'legF_lo', Math.max(0, Math.sin(ph + 1.9)) * 0.45 * k); add(q, 'legB_lo', Math.max(0, -Math.sin(ph + 1.9)) * 0.45 * k);
      add(q, 'footF', -(-sw + Math.max(0, Math.sin(ph + 1.9)) * 0.45 * k) * 0.8); add(q, 'footB', -(sw + Math.max(0, -Math.sin(ph + 1.9)) * 0.45 * k) * 0.8);
      if (!q._brasPris) { add(q, 'armF_up', sw * 0.45); add(q, 'armB_up', -sw * 0.45); add(q, 'armF_lo', -0.15 * k); add(q, 'armB_lo', -0.15 * k); }
      q.dy = (q.dy || 0) - Math.abs(Math.cos(ph)) * 5 * k;
    }
    if (q.assis) {                                                              // assis sur un siège de hauteur q.siege (local, défaut 100 = le caillou à 1,1)
      const k = ease(clamp(q.assis)), h = q.siege == null ? 100 : q.siege;
      q.dy = (q.dy || 0) + (238 - h) * k; q.tilt = (q.tilt || 0) + 0.06 * k;
      const fw = q.pieds == null ? (h < 70 ? 150 : 84) : q.pieds;
      legTo(q, 'legF', [fw, -16], k); legTo(q, 'legB', [fw - 14, -16], k);
      if (q.mainsGenoux !== false && !has(q.tenu) && !q._brasPris) {
        const kn = toTorso(q, [fw + 20, -150]); armTo(q, 'armF', [kn[0] - 8, kn[1] + 6], 'bas', k); armTo(q, 'armB', [kn[0] - 20, kn[1] + 10], 'bas', k);
        if (k > 0.5) { q.handF = q.handF || 'open'; q.handB = q.handB || 'open'; }
      }
    }
    if (q.attendre) {                                                           // attendre : poids sur une jambe, mains jointes DEVANT le ventre
      const k = ease(clamp(q.attendre));
      add(q, 'legB', 0.05 * k); add(q, 'legF', -0.1 * k); add(q, 'legF_lo', 0.14 * k); add(q, 'footF', -0.04 * k);
      q.tilt = (q.tilt || 0) - 0.015 * k; add(q, 'head', 0.04 * k);
      armTo(q, 'armF', [34, -52], 'bas', k); armTo(q, 'armB', [30, -46], 'bas', k);
      if (k > 0.5) { q.handF = q.handF || 'open'; q.handB = q.handB || 'fist'; }
    }
    if (q.croise) {                                                             // bras repliés devant la poitrine (se lit mal de profil : préférer attendre / hanche)
      const k = ease(clamp(q.croise));
      armTo(q, 'armF', [44, -96], 'bas', k); armTo(q, 'armB', [40, -104], 'bas', k);
    }
    if (q.pointes) {                                                            // sur la pointe des pieds pour être vu
      const k = ease(clamp(q.pointes)), a = 0.55 * k, lift = 46 * Math.sin(a) + 15 * Math.cos(a) - 15;
      add(q, 'footF', a); add(q, 'footB', a); q.dy = (q.dy || 0) - lift; add(q, 'head', -0.14 * k); q.tilt = (q.tilt || 0) + 0.015 * k;
    }
    if (q.leve) {                                                               // bras levé, main ouverte tendue paume vers le bas (« moi ! »)
      const k = ease(clamp(q.leve));
      blend(q, 'armF_up', -2.85, k); blend(q, 'armF_lo', -0.38, k); if (k > 0.3) q.handF = 'open';
    }
    if (q.tendre) {                                                             // tendre la main paume ouverte (demande)
      const k = ease(clamp(q.tendre));
      blend(q, 'armF_up', -1.25, k); blend(q, 'armF_lo', -0.32, k); add(q, 'head', 0.05 * k); if (k > 0.3) q.handF = 'cup';
    }
    if (q.epaules) {                                                            // haussement d'épaules : avant-bras ouverts, paumes en l'air
      const k = ease(clamp(q.epaules));
      blend(q, 'armF_up', 0.1, k); blend(q, 'armF_lo', -1.45, k); blend(q, 'armB_up', -0.05, k); blend(q, 'armB_lo', -1.3, k);
      add(q, 'head', 0.1 * k); q.dy = (q.dy || 0) - 4 * k;
      if (k > 0.3) { q.handF = 'cup'; q.handB = 'cup'; }
      if (!q.face.brow) q.face.brow = 'up';
    }
    if (q.hanche) {                                                             // poing avant sur la hanche, coude en arrière
      const k = ease(clamp(q.hanche)); armTo(q, 'armF', [10, -14], 'arriere', k); if (k > 0.5) q.handF = 'fist';
    }
    if (q.menton) {                                                             // main au menton (examiner, perplexe)
      const k = ease(clamp(q.menton)); armTo(q, 'armF', headPt(q, 24, -2), 'bas', k); add(q, 'head', -0.05 * k); if (k > 0.5) q.handF = 'fist';
    }
    if (q.essuie) {                                                             // s'essuyer le front (q.t anime le geste)
      const k = ease(clamp(q.essuie)); armTo(q, 'armF', headPt(q, 14 + 8 * Math.sin(t * 7), -86), 'bas', k); add(q, 'head', 0.08 * k); if (k > 0.5) q.handF = 'open';
    }
    if (q.soupir) { const k = ease(clamp(q.soupir)); add(q, 'head', 0.2 * k); q.dy = (q.dy || 0) + 3 * k; q.tilt = (q.tilt || 0) - 0.02 * k; if (k > 0.5 && !q.face.eyes) q.face.eyes = 'half'; if (!q.face.brow) q.face.brow = 'worry'; }
    if (q.surpris) { const k = ease(clamp(q.surpris)); add(q, 'head', -0.12 * k); q.tilt = (q.tilt || 0) - 0.04 * k; q.dy = (q.dy || 0) - 6 * k;
      blend(q, 'armF_up', -0.6, k); blend(q, 'armF_lo', -1.6, k); if (k > 0.3) q.handF = 'open';
      if (k > 0.3) { q.face.brow = q.face.brow || 'up'; q.face.eyes = q.face.eyes || 'wide'; q.face.mouth = q.face.mouth || 'o'; } }
    if (q.penche) { add(q, 'head', -0.16 * clamp(q.penche, -1, 1)); }            // tête qui penche (perplexe) : menton levé de côté
  }
  // poser au sol une charge (sac, outil) par étapes : k 0 → kSol (se pencher, déposer), kSol → 1 (lâcher, se relever)
  function deposer(q, nom, o, k, from, sol, kSol) {
    const ob = OBJ[nom], s1 = smooth(0, kSol, k), s2 = smooth(kSol + 0.02, 1, k);
    const bend = (q.penchePose == null ? 0.62 : q.penchePose) * Math.sin(Math.min(1, k / kSol) * PI / 2) * (1 - s2);
    plier(q, bend);
    const base = [lerp(from.base[0], sol.base[0], ease(s1)), lerp(from.base[1], sol.base[1], ease(s1))];
    if (from.via && s1 < 1) { const u = Math.sin(s1 * PI); base[0] += from.via[0] * u; base[1] += from.via[1] * u; }
    const ang = lerp(from.ang, sol.ang, ease(s1));
    q._charge = { nom, o: o || {}, w: base, ang, dos: !!from.dos && s1 < (from.swap || 0.3), libre: s2 };
  }
  // positions et grips → angles de bras ; objets droits ; seconde main
  function finish(q) {
    const A = q.ang, tl = q.tilt || 0;
    if (q._charge) {
      const ch = q._charge, ob = OBJ[ch.nom];
      if (ch.posT) { ch.pos = ch.posT; ch.angT = ch.ang; } else { ch.pos = toTorso(q, ch.w); ch.angT = ch.ang - tl; }
      const gp = (g) => { const r = rot([g[0] - ob.base[0], g[1] - ob.base[1]], ch.angT); return [ch.pos[0] + r[0], ch.pos[1] + r[1]]; };
      const k = 1 - ease(clamp(ch.libre || 0));
      const g1 = ch.g1 === null ? null : (ch.g1 || gripOf(ob, ch.o || {})), g2 = ch.g2 === null ? null : (ch.g2 || (ob.p2 ? ob.p2(ch.o || {}) : null));
      const a0 = [A.armF_up || 0, A.armF_lo || 0, A.armB_up || 0, A.armB_lo || 0];
      if (g1) { armTo(q, 'armF', gp(g1), 'bas', 1); A.armF_up = lerp(a0[0], A.armF_up, k); A.armF_lo = lerp(a0[1], A.armF_lo, k); }
      const kb = k * (ch.kB == null ? 1 : ch.kB);
      if (g2) { armTo(q, 'armB', gp(g2), 'bas', 1); A.armB_up = lerp(a0[2], A.armB_up, kb); A.armB_lo = lerp(a0[3], A.armB_lo, kb); }
      if (g2 && kb > 0.5) { q.handB = 'fist'; q._deux = true; }
      if (k > 0.5) { if (g1) q.handF = 'fist'; ch.tient = !!g1; } else ch.tient = false;
    }
    if (has(q.tenu) && !(q.handF && q.handF !== 'fist')) q.handF = 'fist';
    if (has(q.tenuB) && !(q.handB && q.handB !== 'fist')) q.handB = 'fist';
    if (q.droit == null && has(q.tenu)) q.droit = true;
    if (q.droitB == null && has(q.tenuB)) q.droitB = true;
    if (q.droit) A.objet = (A.objet || 0) - ((A.armF_up || 0) + (A.armF_lo || 0) + tl);
    if (q.droitB) A.objetB = (A.objetB || 0) - ((A.armB_up || 0) + (A.armB_lo || 0) + tl);
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
    r.q = q; r.tenu = q.tenu; r.tenuB = q.tenuB;
    if (has(q.tenu) && OBJ[q.tenu]) r.tenuO = heldOpts(q.tenu, q.tenuO, q);
    if (has(q.tenuB) && OBJ[q.tenuB]) r.tenuBO = heldOpts(q.tenuB, q.tenuBO, q);
    return r;
  }
  // point nommé de l'objet tenu (écran) ; GRV.pt(r, 'tete') ; arriere = main arrière
  GRV.pt = function (r, nom, arriere) {
    const name = arriere ? r.tenuB : r.tenu, ob = OBJ[name]; if (!ob || !ob.pts[nom]) return null;
    const oo = arriere ? r.tenuBO : r.tenuO, g = gripOf(ob, oo), q = ob.pts[nom];
    return r.w(arriere ? 'objetB' : 'objet', q[0] - g[0], q[1] - g[1]);
  };
  // enveloppe : pose → gestes communs → gestes propres → finish ; GRV.nom.pose(p) = pose finale sans dessiner
  function mkWrap(chName, own, sDef) {
    const pose = (p) => { const q = prep(p); if (own) own(q, 'avant'); gestes(q); if (own) own(q, 'apres'); return finish(q); };
    const f = (p, x, y, s, o) => run(CH[chName], pose(p), x, y, s == null ? sDef : s, o);
    f.pose = pose; f.def = () => CH[chName];
    return f;
  }
  GRV._ = { body, torsoPts, face, mkWrap, armTo, headPt, plier, deposer, blend, add, has, toTorso, toWorld, ik2 };

  // =====================================================================
  // GESTES D'OUTIL communs : outil sur l'épaule, poser l'outil au sol par étapes
  // =====================================================================
  const BB = { pelle: [-32, -394, 32, 2], maillet: [-32, -180, 32, 8], scie: [-12, -122, 254, 24], marteau: [-46, -176, 44, 10], varlope: [-32, -42, 204, 40],
    truelle: [-46, -8, 138, 38], ble: [-56, -172, 56, 2], charbon: [-56, -172, 56, 2], foin: [-66, -88, 66, 0], tonneau: [-50, -124, 50, 0] };
  const COUCHE = { pelle: PI / 2, maillet: PI / 2, marteau: PI / 2, scie: 0, varlope: 0, truelle: 0.18, ble: 0, charbon: 0, foin: 0, tonneau: 0 };
  const TETE_HAUT = { maillet: 1, marteau: 1 };                                 // outils dont la tête est vers −y depuis la prise
  function liftOf(nom, ang) {
    const b = BB[nom], ob = OBJ[nom]; let m = -1e9;
    for (const [x, y] of [[b[0], b[1]], [b[2], b[1]], [b[0], b[3]], [b[2], b[3]]]) m = Math.max(m, rot([x - ob.base[0], y - ob.base[1]], ang)[1]);
    return m;
  }
  GRV.solOutil = (nom) => ({ ang: COUCHE[nom] || 0, dy: -liftOf(nom, COUCHE[nom] || 0) });   // pose couchée au sol (pour un plan qui redessine l'outil posé)
  function outilGestes(q) {
    const A = q.ang;
    if (q.epaule && has(q.tenu) && BB[q.tenu]) {                                // outil long posé sur l'épaule, main devant la poitrine
      const k = ease(clamp(q.epaule)), T = [44, -112];
      armTo(q, 'armF', T, 'bas', k); q._brasPris = true;
      const v = [-10 - T[0], -170 - T[1]], th = TETE_HAUT[q.tenu] ? Math.atan2(v[0], -v[1]) : Math.atan2(-v[0], v[1]);
      A.objet = (A.objet || 0) + lerp(0, th + (q.tilt || 0), k);
    }
    if (q.poserOutil != null && has(q.tenu) && BB[q.tenu]) {                    // se pencher, déposer l'outil couché devant soi, se relever
      const nom = q.tenu, ob = OBJ[nom], g = gripOf(ob, heldOpts(nom, q.tenuO, q));
      const ang = COUCHE[nom] || 0, H = toWorld(q, [40, -34]), gr = rot([g[0] - ob.base[0], g[1] - ob.base[1]], ang), from = { base: [H[0] - gr[0], H[1] - gr[1]], ang };
      const sx = q.solX == null ? 130 : q.solX;
      deposer(q, nom, q.tenuO, clamp(q.poserOutil), from, { base: [sx, -liftOf(nom, ang)], ang }, 0.6);
      q._charge.g2 = null; q.tenu = 'rien'; q._brasPris = true;
    }
  }

  // =====================================================================
  // LÉA (aujourd'hui) — manteau camel, écharpe rouille, jean, baskets, chignon châtain, sac en bandoulière, montre
  // =====================================================================
  const LE = { peau: '#e6c4a2', peauD: '#c9a382', manteau: '#B98A5A', manteauD: '#9c7148', echarpe: '#A4512E', jean: '#2E3A55', jeanD: '#252f45', basket: '#e8e4da', cheveux: '#6b4a32', sac: '#5b3a28' };
  const LEA_HEAD = [[-14, 16], [10, 16], [11, 2], [15, -5], [22, -9], [26, -15], [25, -21], [27, -25], [26, -29], [29, -33], [34, -39, 1], [31, -46], [28, -56], [28, -64], [25, -78], [14, -92], [-6, -97], [-24, -88], [-33, -68], [-32, -46], [-24, -28], [-17, -8]];
  CH.grvLea = body({
    seed: 8100, torso: torsoPts(0.98, 112, 0), coat: LE.manteau, sleeve: LE.manteau, sleeveB: LE.manteauD, skin: LE.peau, skinD: LE.peauD, cuff: LE.manteauD,
    thigh: LE.jean, thighB: LE.jeanD, shoe: LE.basket, foot: 'basket', head: LEA_HEAD,
    torsoPaint: () => {
      fillPts([[16, -176], [28, -150], [32, -112], [22, -104], [14, -140]], LE.manteauD);
      strokePts([[22, -104], [28, -40], [34, 112]], 'rgba(80,50,25,0.5)', 1.4);
      for (const y of [-80, -30, 20]) dot(30, y, 3, '#5a3a22');
      fillPts(box(-36, -20, 36, -8), LE.manteauD); strokePts([[-6, 50], [20, 50]], 'rgba(80,50,25,0.5)', 1.2);
      strokePts([[10, -150], [-30, 8]], LE.sac, 4);                              // bandoulière
      hatch([[-50, -170], [-12, -170], [-10, 112], [-50, 112]], 0.75, 4.2, 0.26); shade(40, 0, -40, 0, 0.26);
    },
    lo: (p, back) => { if (!back) { fillPts(box(-13, 64, 13, 72), '#3a2c24'); if (!SIL()) { dot(13, 68, 4.5, '#c9a24a'); dot(13, 68, 3, '#f2ead8'); } } },
    headPaint: (p) => face(p, { joue: 'rgba(210,120,110,0.22)', lip: 'rgba(150,60,60,0.95)', browW: 2 }),
    parts: {
      cheveux: { parent: 'head', at: [0, 0], noRivet: true, base: LE.cheveux, seed: 8130, pts: [[32, -80], [30, -92], [18, -102], [-4, -106], [-26, -98], [-38, -80], [-40, -58], [-36, -36], [-28, -30], [-22, -40], [-18, -56], [-12, -70], [2, -78], [18, -80], [26, -74]],
        paint: () => { for (const a of [0, 1, 2]) strokePts([[24 - a * 4, -84 + a * 2], [0, -96 + a * 4], [-30, -80 + a * 6]], 'rgba(255,220,180,0.25)', 1.2); hatch(null, 0.5, 3.4, 0.25); } },
      chignon: { parent: 'head', at: [0, 0], noRivet: true, base: LE.cheveux, seed: 8131, pts: ell(-40, -92, 18, 16, 14), paint: () => { strokePts(ep(-40, -92, 10, 9, 10, 0, 5), 'rgba(40,25,15,0.5)', 1.2); hatch(null, 0.8, 3.4, 0.25); } },
      echarpe: { parent: 'torso', at: [0, 0], noRivet: true, base: LE.echarpe, seed: 8132, pts: [[-24, -184], [8, -190], [26, -176], [28, -158], [32, -100, 1], [16, -96, 1], [12, -146], [-14, -150], [-28, -166]],
        paint: () => { for (const y of [-180, -170, -160]) strokePts([[-20, y], [22, y + 2]], 'rgba(60,20,10,0.35)', 1); strokePts([[18, -140], [22, -100]], 'rgba(60,20,10,0.35)', 1); hatch(null, 0.6, 3.4, 0.2); } },
      sac: { parent: 'torso', at: [0, 0], noRivet: true, base: LE.sac, seed: 8133, pts: rrect(-52, -6, 2, 40, 6), paint: () => { fillPts(box(-52, -6, 2, 8), '#4a2e20'); dot(-25, 8, 3, '#c9a24a'); hatch(null, 0.6, 4, 0.2); } },
    },
    heads: ['cheveux', 'chignon'], fronts: ['echarpe', 'sac'],
  });
  GRV.lea = mkWrap('grvLea', (q, ph) => {
    if (ph === 'avant' && q.montre) {                                           // regarde sa montre : poignet avant devant la poitrine, tête baissée
      const k = ease(clamp(q.montre)); armTo(q, 'armF', [70, -122], 'bas', k); add(q, 'head', 0.24 * k); q._brasPris = true;
    }
  }, 0.9);

  // =====================================================================
  // HUGO (aujourd'hui, candidat) — veste bleu marine, chemise blanche, pantalon gris, dossier ocre sous le bras
  // =====================================================================
  const HU = { peau: '#dcb592', peauD: '#bf9672', veste: '#2F3E5C', vesteD: '#26324b', chemise: '#f0eee8', pant: '#7a7c82', pantD: '#66686e', soulier: '#3a2a22', cheveux: '#2a2018' };
  CH.grvHugo = body({
    seed: 8200, torso: torsoPts(1, 40, 0), coat: HU.veste, sleeve: HU.veste, sleeveB: HU.vesteD, skin: HU.peau, skinD: HU.peauD, cuff: HU.chemise,
    thigh: HU.pant, thighB: HU.pantD, shoe: HU.soulier, head: X.GR_HEAD,
    torsoPaint: () => {
      fillPts([[4, -184], [18, -170], [24, -130], [14, -116], [6, -160]], HU.chemise);
      fillPts([[16, -176], [28, -148], [30, -112], [22, -104], [14, -140]], HU.vesteD);
      strokePts([[22, -104], [26, -40], [28, 40]], 'rgba(10,15,30,0.6)', 1.4); for (const y of [-80, -46]) dot(27, y, 2.6, '#1a2234');
      strokePts([[-6, -20], [22, -20]], 'rgba(10,15,30,0.6)', 1.2);
      hatch([[-50, -170], [-12, -170], [-10, 42], [-50, 42]], 0.75, 4.2, 0.3, 1.05, '220,225,240'); shade(40, 0, -40, 0, 0.3);
    },
    headPaint: (p) => face(p, { joue: 'rgba(205,120,105,0.16)', browCol: 'rgba(30,20,14,0.95)' }),
    parts: { cheveux: { parent: 'head', at: [0, 0], noRivet: true, base: HU.cheveux, seed: 8230, pts: [[28, -80], [26, -92], [12, -101], [-8, -104], [-28, -94], [-36, -74], [-34, -50], [-26, -46], [-22, -60], [-10, -74], [8, -82], [22, -84]],
      paint: () => { strokePts([[20, -92], [-4, -98], [-26, -86]], 'rgba(255,230,200,0.2)', 1.2); hatch(null, 0.4, 3, 0.3); } } },
    heads: ['cheveux'],
  });
  GRV.hugo = mkWrap('grvHugo', (q, ph) => {
    if (ph === 'avant' && q.sousBras !== false && !has(q.tenu)) {                // dossier serré sous le bras avant
      q._charge = { nom: 'dossier', posT: [6, -62], ang: 0.06, g1: null, g2: null };
      blend(q, 'armF_up', 0.06, 1); blend(q, 'armF_lo', -0.55, 1); q._brasPris = true;
    }
  }, 0.9);

  // =====================================================================
  // LE BATELIER (XVIIIe) — chemise écrue manches roulées, gilet brun, bonnet de laine bleu (rond, à revers : PAS de bonnet phrygien), culotte, sabots
  // =====================================================================
  const BA = { peau: '#c99a72', peauD: '#ad7f5a', chemise: '#D8CBB0', chemiseD: '#c0b294', gilet: '#6B4A2E', bonnet: '#4F6478', culotte: '#5c5248', culotteD: '#4c443c', bas: '#b8ad98', sabot: '#a07a48' };
  CH.grvBatelier = body({
    seed: 8300, torso: torsoPts(1.05, 34, 4), coat: BA.chemise, sleeve: BA.chemise, sleeveB: BA.chemiseD, skin: BA.peau, skinD: BA.peauD, roule: 34, cuff: BA.chemiseD, armW: 16,
    thigh: BA.culotte, thighB: BA.culotteD, shin: BA.bas, shoe: BA.sabot, foot: 'sabot', head: X.GR_HEAD,
    shinPaint: () => { fillPts(box(-20, -18, 20, 14), BA.culotte); fillPts(box(-20, 10, 20, 15), '#3a3028'); },
    torsoPaint: () => {
      fillPts([[-40, -150], [-14, -166], [6, -150], [20, -150], [36, -112], [40, -40], [38, 34, 1], [-42, 36, 1]], BA.gilet);
      fillPts([[6, -176], [18, -166], [16, -140], [8, -152]], BA.chemise);
      strokePts([[22, -140], [30, -60], [32, 30]], 'rgba(30,18,8,0.6)', 1.3); for (const y of [-100, -60, -20]) dot(30, y, 2.6, '#c9a870');
      fillPts(box(-42, 22, 40, 34), '#3a2c20');
      hatch([[-50, -170], [-12, -170], [-10, 40], [-50, 40]], 0.75, 4.2, 0.3); shade(40, 0, -40, 0, 0.3);
    },
    headPaint: (p) => { face(p, { joue: 'rgba(190,90,70,0.22)' }); for (let i = 0; i < 26; i++) dot(-14 + hash(i * 1.7) * 40, -26 + hash(i * 3.3) * 34, 0.9, 'rgba(50,35,25,0.5)'); strokePts([[-2, -66], [8, -64]], 'rgba(90,50,30,0.35)', 1); },
    parts: { bonnet: { parent: 'head', at: [0, 0], noRivet: true, base: BA.bonnet, seed: 8330, pts: [[30, -74], [31, -88], [24, -104], [4, -114], [-20, -110], [-36, -96], [-40, -78], [-38, -62], [-28, -60], [30, -66]],
      paint: () => { fillPts([[-40, -78], [31, -86], [31, -66], [-38, -60]], '#435568'); for (let x = -36; x < 30; x += 5) strokePts([[x, -80 + x * -0.1], [x, -64]], 'rgba(20,30,45,0.45)', 1); hatch([[-40, -116], [32, -116], [32, -84], [-40, -84]], 0.4, 3.2, 0.25); } } },
    heads: ['bonnet'],
  });
  GRV.batelier = mkWrap('grvBatelier', (q, ph) => {
    if (ph !== 'apres' || !q.porter) return;
    const nom = q.porter === true ? 'ble' : q.porter, k = clamp(q.poser || 0);
    const k1 = smooth(0, 0.35, k), k2 = smooth(0.38, 0.72, k), k3 = smooth(0.76, 1, k);
    const DOS = { base: [-120, -440], ang: PI / 2, g1: [40, -130], g2: [52, -70] };
    const POI = { base: [72, -252], ang: 0, g1: [44, -110], g2: [-44, -40] };
    const SOL = { base: [104, 0], ang: 0 };
    plier(q, 0.62 * ease(k2) * (1 - ease(k3)));
    let w, ang;
    if (k2 <= 0) { const u = ease(k1); w = [lerp(DOS.base[0], POI.base[0], u), lerp(DOS.base[1], POI.base[1], u) - 120 * Math.sin(k1 * PI)]; ang = lerp(DOS.ang, POI.ang, u); }
    else { const u = ease(k2); w = [lerp(POI.base[0], SOL.base[0], u), lerp(POI.base[1], SOL.base[1], u)]; ang = 0; }
    const gl = (a, b) => [lerp(a[0], b[0], ease(k1)), lerp(a[1], b[1], ease(k1))];
    q._charge = { nom, o: q.porterO || {}, w, ang, dos: k1 < 0.45, libre: k3, g1: gl(DOS.g1, POI.g1), g2: gl(DOS.g2, POI.g2), kB: smooth(0.3, 0.7, k1) };
    q._brasPris = true; add(q, 'head', k1 < 0.5 ? 0.06 : 0);
  }, 0.9);
  GRV.SAC_SOL = 104;                                                             // après poser:1, le sac est au sol en x + dir·104·s

  // =====================================================================
  // JACQUES (le sans-travail) — même visage et même chapeau mou ; epoque 1750 (veste verte rapiécée, culotte, besace) | 1840 (blouse bleue)
  // =====================================================================
  const JA = { peau: '#dcb48e', peauD: '#bd9370', veste: '#5E6B4A', vesteD: '#4f5a3e', piece1: '#77805c', piece2: '#4a4a3a', chemise: '#d6ccb4', chapeau: '#4A3B2C',
    culotte: '#6e6150', bas: '#9a958a', soulier: '#3e2e22', besace: '#8a7454', blouse: '#3F5A7A', blouseD: '#344b66', pant: '#707276', pantD: '#5e6064', cheveux: '#5a4030' };
  const JA_HAT = [[-58, -78], [-50, -86], [-28, -90], [-26, -104], [-18, -118], [0, -124], [16, -120], [24, -106], [26, -92], [46, -88], [62, -80, 1], [56, -72], [38, -78], [0, -82], [-34, -78], [-52, -68, 1]];
  const jaHead = (p) => {
    fillPts([[-34, -80], [-20, -84], [-6, -82], [-12, -66], [-22, -52], [-34, -40], [-40, -60]], JA.cheveux);
    face(p, { ear: [-6, -44] });
    fillPts([[2, -40], [16, -36], [14, -20], [2, -16], [-6, -28]], 'rgba(120,80,60,0.18)');           // joue creuse
    for (let i = 0; i < 22; i++) dot(-8 + hash(i * 2.3) * 36, -22 + hash(i * 5.1) * 30, 0.8, 'rgba(60,45,35,0.45)');
  };
  const jaHat = { parent: 'head', at: [0, 0], noRivet: true, base: JA.chapeau, seed: 8430, pts: JA_HAT,
    paint: () => { fillPts([[-27, -98], [25, -98], [26, -90], [-28, -90]], '#33291f'); strokePts([[-50, -80], [0, -86], [56, -78]], 'rgba(255,230,190,0.18)', 1.4); fillPts([[6, -118], [14, -112], [8, -104]], 'rgba(255,230,190,0.12)'); hatch(null, 0.5, 3.4, 0.3); } };
  function mkJacques(ep1840) {
    const o = ep1840 ? {
      seed: 8460, torso: torsoPts(0.92, 96, 0), coat: JA.blouse, sleeve: JA.blouse, sleeveB: JA.blouseD, cuff: JA.blouseD, thigh: JA.pant, thighB: JA.pantD,
      torsoPaint: () => {
        fillPts([[-32, -160], [-14, -172], [8, -178], [18, -166], [28, -146], [30, -128], [-34, -126]], JA.blouseD);
        for (const x of [-24, -10, 4, 18]) strokePts([[x, -126], [x * 1.15, 96]], 'rgba(15,25,40,0.35)', 1.1);
        fillPts([[4, -184], [16, -172], [12, -160], [2, -170]], JA.chemise);
        hatch([[-50, -170], [-12, -170], [-10, 96], [-50, 96]], 0.75, 4.2, 0.3); shade(40, 0, -40, 0, 0.3);
      } } : {
      seed: 8400, torso: torsoPts(0.9, 70, 0), coat: JA.veste, sleeve: JA.veste, sleeveB: JA.vesteD, cuff: JA.vesteD, thigh: JA.culotte, shin: JA.bas,
      shinPaint: () => fillPts(box(-20, -18, 20, 14), JA.culotte),
      torsoPaint: () => {
        fillPts([[4, -184], [16, -170], [12, -150], [2, -166]], JA.chemise);
        fillPts([[16, -176], [26, -150], [30, -112], [22, -104], [14, -140]], JA.vesteD);
        strokePts([[22, -104], [28, -40], [32, 70]], 'rgba(30,35,20,0.6)', 1.3); for (const y of [-80, -40, 0]) dot(29, y, 2.4, '#3a3a2a');
        for (const [x0, y0, w, h, col] of [[-30, -70, 22, 26, JA.piece1], [4, 20, 20, 18, JA.piece2]]) {    // pièces rapiécées + points de couture
          fillPts(box(x0, y0, x0 + w, y0 + h), col);
          for (let i = 0; i <= 4; i++) { strokePts([[x0 + i * w / 4, y0 - 2], [x0 + i * w / 4, y0 + 2]], '#d6ccb4', 0.9); strokePts([[x0 + i * w / 4, y0 + h - 2], [x0 + i * w / 4, y0 + h + 2]], '#d6ccb4', 0.9); }
        }
        strokePts([[10, -150], [-30, 10]], '#6a5638', 4);                       // sangle de la besace
        hatch([[-50, -170], [-12, -170], [-10, 70], [-50, 70]], 0.75, 4.2, 0.32); shade(40, 0, -40, 0, 0.3);
      } };
    Object.assign(o, { skin: JA.peau, skinD: JA.peauD, shoe: JA.soulier, head: X.AR_HEAD, headPaint: jaHead, heads: ['chapeau'], parts: { chapeau: jaHat } });
    if (!ep1840) { o.parts = Object.assign({}, o.parts, { besace: { parent: 'torso', at: [0, 0], noRivet: true, base: JA.besace, seed: 8433, pts: [[-58, -4], [-6, -8], [-4, 30], [-14, 44, 1], [-50, 46, 1], [-60, 30]],
      paint: () => { fillPts([[-58, -4], [-6, -8], [-8, 16], [-58, 18]], '#7a6648'); dot(-30, 14, 3, '#3a2c20'); hatch(null, 0.7, 4, 0.22); } } }); o.fronts = ['besace']; }
    return body(o);
  }
  CH.grvJacques = mkJacques(false); CH.grvJacques1840 = mkJacques(true);
  const jacq = mkWrap('grvJacques', (q, ph) => { if (ph === 'apres') outilGestes(q); }, 0.9);
  const jacq40 = mkWrap('grvJacques1840', (q, ph) => { if (ph === 'apres') outilGestes(q); }, 0.9);
  GRV.jacques = (p, x, y, s, o) => ((p && p.epoque === 1840) ? jacq40 : jacq)(p, x, y, s, o);
  GRV.jacques.pose = (p) => ((p && p.epoque === 1840) ? jacq40 : jacq).pose(p);
  GRV.jacques.def = (p) => CH[(p && p.epoque === 1840) ? 'grvJacques1840' : 'grvJacques'];

  // =====================================================================
  // MARTIN (costaud) — chemise rouge passée, tablier de cuir, casquette de toile grise (PAS de bonnet phrygien), barbe courte
  // =====================================================================
  const MA = { peau: '#d8ab86', peauD: '#b88b66', chemise: '#8E4B3E', chemiseD: '#773e33', tablier: '#9a7448', pant: '#4e4a44', pantD: '#3e3b36', casquette: '#a8a294', soulier: '#33261c', barbe: '#3e2a1e' };
  CH.grvMartin = body({
    seed: 8500, torso: torsoPts(1.18, 30, 8), coat: MA.chemise, sleeve: MA.chemise, sleeveB: MA.chemiseD, skin: MA.peau, skinD: MA.peauD, roule: 40, cuff: MA.chemiseD, armW: 17.5, th: 1.12,
    thigh: MA.pant, thighB: MA.pantD, shoe: MA.soulier, head: X.NAP_HEAD,
    torsoPaint: () => { fillPts([[4, -184], [18, -172], [14, -150], [2, -168]], MA.chemiseD); strokePts([[16, -160], [22, -120]], 'rgba(40,15,10,0.5)', 1.2);
      hatch([[-56, -170], [-12, -170], [-10, 34], [-56, 34]], 0.75, 4.2, 0.32); shade(44, 0, -46, 0, 0.3); },
    headPaint: (p) => { face(p, { joue: 'rgba(200,100,80,0.2)', browW: 3.2, browCol: 'rgba(40,25,15,0.95)' });
      fillPts([[0, -40], [10, -34], [22, -34], [30, -20], [28, -10], [22, 4], [6, 12], [-14, 10], [-22, -14], [-14, -36]], MA.barbe);
      strokePts([[20, -28], [30, -27]], 'rgba(120,40,35,0.9)', 1.6); },
    parts: {
      casquette: { parent: 'head', at: [0, 0], noRivet: true, base: MA.casquette, seed: 8530, pts: [[-36, -70], [-40, -96], [-30, -116], [-6, -124], [20, -118], [32, -100], [34, -86], [52, -82, 1], [48, -76], [30, -78], [-30, -72]],
        paint: () => { fillPts([[30, -86], [52, -82], [48, -76], [30, -78]], '#7e7a6e'); dot(-4, -122, 4, '#7e7a6e'); strokePts([[-34, -80], [30, -84]], 'rgba(40,40,40,0.4)', 1.2); for (const x of [-20, 0, 18]) strokePts([[x, -108], [x + 4, -84]], 'rgba(40,40,40,0.25)', 1); hatch(null, 0.5, 3.4, 0.22); } },
      tablier: { parent: 'torso', at: [0, 0], noRivet: true, base: MA.tablier, seed: 8531, pts: [[-14, -14], [48, -18], [50, 40], [52, 118, 1], [-10, 120, 1], [-16, 40]],
        paint: () => { strokePts([[-16, -12], [50, -16]], '#4a3320', 4); for (const y of [30, 80]) strokePts([[-8, y], [48, y - 2]], 'rgba(60,40,20,0.3)', 1); strokePts([[30, -120], [40, 100]], 'rgba(255,220,180,0.18)', 2); hatch(null, 0.9, 4, 0.22); shade(46, 0, -10, 0, 0.3, [-20, -140, 50, 120]); } },
    },
    heads: ['casquette'], fronts: ['tablier'],
  });
  GRV.martin = mkWrap('grvMartin', (q, ph) => { if (ph === 'apres') outilGestes(q); }, 0.82);

  // =====================================================================
  // PAULIN (jeune) — blouse beige, foulard bleu, tête nue cheveux en épi, sabots
  // =====================================================================
  const PA = { peau: '#ecc9a6', peauD: '#cfa784', blouse: '#C7B38A', blouseD: '#ae9a72', foulard: '#4C6A8A', pant: '#6a6a58', pantD: '#585848', cheveux: '#b0703a', sabot: '#9a7444' };
  CH.grvPaulin = body({
    seed: 8600, torso: torsoPts(0.94, 84, 0), coat: PA.blouse, sleeve: PA.blouse, sleeveB: PA.blouseD, skin: PA.peau, skinD: PA.peauD, cuff: PA.blouseD,
    thigh: PA.pant, thighB: PA.pantD, shoe: PA.sabot, foot: 'sabot', head: X.GR_HEAD,
    torsoPaint: () => { for (const x of [-22, -6, 10, 24]) strokePts([[x, -140], [x * 1.12, 84]], 'rgba(90,70,40,0.3)', 1); strokePts([[-36, -10], [36, -12]], '#8a7550', 3);
      hatch([[-50, -170], [-12, -170], [-10, 86], [-50, 86]], 0.75, 4.2, 0.28); shade(40, 0, -40, 0, 0.28); },
    headPaint: (p) => face(p, { joue: 'rgba(220,120,100,0.28)' }),
    parts: {
      cheveux: { parent: 'head', at: [0, 0], noRivet: true, base: PA.cheveux, seed: 8630, pts: [[32, -78], [34, -90], [24, -100], [8, -106], [-6, -108], [-10, -126, 1], [-2, -110], [-20, -106], [-34, -96], [-42, -84], [-40, -62], [-34, -46], [-26, -52], [-22, -66], [-10, -74], [6, -76], [18, -72], [24, -80]],
        paint: () => { strokePts([[20, -90], [0, -96], [-24, -88]], 'rgba(255,230,190,0.3)', 1.2); hatch(null, 0.6, 3.2, 0.25); } },
      foulard: { parent: 'torso', at: [0, 0], noRivet: true, base: PA.foulard, seed: 8631, pts: [[-22, -180], [8, -186], [24, -172], [22, -160], [30, -146], [24, -126, 1], [14, -146], [-12, -152], [-26, -166]],
        paint: () => { for (let i = 0; i < 5; i++) dot(-14 + i * 8, -170 + (i % 2) * 6, 1.6, 'rgba(240,235,220,0.7)'); hatch(null, 0.6, 3.4, 0.2); } },
    },
    heads: ['cheveux'], fronts: ['foulard'],
  });
  GRV.paulin = mkWrap('grvPaulin', (q, ph) => { if (ph === 'apres') outilGestes(q); }, 0.78);

  // =====================================================================
  // LE PATRON EMBAUCHEUR (XVIIIe) — habit long prune, gilet crème, tricorne noir à galon doré, perruque grise à catogan, ventre rond, canne à pommeau
  // =====================================================================
  const PT = { peau: '#e6bea0', peauD: '#c99c7c', habit: '#5A3550', habitD: '#4a2a42', parement: '#43263c', gilet: '#e8dcc0', bas: '#ece6d8', soulier: '#1e1a1a', perruque: '#b8b6b0', tricorne: '#1e1a1a', galon: '#c9a24a' };
  CH.grvPatron = body({
    seed: 8700, torso: torsoPts(1.08, 60, 20, 132), coat: PT.habit, sleeve: PT.habit, sleeveB: PT.habitD, skin: PT.peau, skinD: PT.peauD, armW: 16,
    thigh: PT.habit, thighB: PT.habitD, shin: PT.bas, shoe: PT.soulier, foot: 'boucle', head: X.NAP_HEAD,
    lo: (p, back) => { fillPts(box(-17, 40, 17, 66), back ? '#3a2032' : PT.parement); if (!SIL()) { dot(8, 52, 2.2, PT.galon); dot(8, 60, 2.2, PT.galon); } fillPts([[-14, 66], [14, 66], [16, 80], [0, 76], [-14, 80]], '#f2eee4'); },
    shinPaint: () => fillPts(box(-20, -18, 20, 10), PT.habit),
    torsoPaint: () => {
      fillPts([[12, -160], [28, -146], [38, -110], [56, -60], [56, -20], [42, 12], [20, 18], [14, -40]], PT.gilet);
      for (const y of [-120, -96, -72, -48, -24]) dot(26 + (y > -80 ? 14 + (y + 80) * 0.1 : 0), y, 2.2, PT.galon);
      fillPts([[4, -184], [20, -174], [26, -150], [16, -136], [8, -150]], '#f4f0e6');               // jabot de dentelle
      strokePts([[10, -176], [20, -150], [14, -140]], 'rgba(150,140,120,0.5)', 1);
      strokePts([[12, -160], [16, 60]], 'rgba(30,10,25,0.5)', 1.4); strokePts([[-30, 40], [-36, 130]], 'rgba(30,10,25,0.4)', 1.2);
      dot(-20, 30, 2.6, PT.galon); dot(-28, 30, 2.6, PT.galon);
      hatch([[-50, -170], [-12, -170], [-10, 132], [-50, 132]], 0.75, 4.2, 0.3); shade(50, 0, -40, 0, 0.3);
    },
    headPaint: (p) => { face(p, { joue: 'rgba(210,90,80,0.32)', browCol: 'rgba(110,105,100,0.95)' }); strokePts([[-2, 4], [14, 8], [22, 2]], 'rgba(120,70,50,0.45)', 1.4); fillPts(ell(10, 6, 12, 7, 10), 'rgba(170,110,90,0.18)'); },
    parts: {
      perruque: { parent: 'head', at: [0, 0], noRivet: true, base: PT.perruque, seed: 8730, pts: [[24, -86], [16, -100], [-4, -106], [-26, -100], [-40, -84], [-46, -60], [-44, -36], [-36, -26], [-26, -32], [-20, -50], [-14, -70], [4, -84]],
        paint: () => { for (const y of [-60, -44]) { fillPts(ell(-26, y, 12, 6, 10), '#cfcdc6'); strokePts(ep(-26, y, 12, 6, 10, PI, TAU), 'rgba(90,88,84,0.5)', 1); } hatch(null, 0.3, 3, 0.22); } },
      catogan: { parent: 'head', at: [0, 0], noRivet: true, base: PT.tricorne, seed: 8731, pts: [[-40, -46], [-58, -58], [-56, -34], [-42, -40], [-50, -6, 1], [-40, -8], [-36, -38]] },
      tricorne: { parent: 'head', at: [0, 0], noRivet: true, base: PT.tricorne, seed: 8732, pts: [[-50, -84, 1], [-36, -106], [-14, -118], [14, -116], [36, -102], [50, -86, 1], [30, -92], [0, -96], [-30, -92]],
        paint: () => { strokePts([[-50, -84], [-36, -106], [-14, -118], [14, -116], [36, -102], [50, -86]], PT.galon, 3.2); strokePts([[-30, -92], [0, -96], [30, -92]], 'rgba(255,255,255,0.12)', 1.4); hatch(null, -0.3, 3.4, 0.3); } },
    },
    heads: ['perruque', 'catogan', 'tricorne'],
  });
  GRV.patron = mkWrap('grvPatron', (q, ph) => {
    if (ph === 'avant') {
      if (q.tenu == null) q.tenu = 'canne';
      if (q.menton && q.tenu === 'canne') { q.tenu = 'rien'; q.tenuB = 'canne'; armTo(q, 'armB', [-2, 2], 'bas', 1); add(q, 'objetB', -0.04); }
      return;
    }
    if (q.tenu !== 'canne') return;
    const k = ease(clamp(q.designe || 0)), R0 = [42, -2], D1 = [102, -150];
    armTo(q, 'armF', [lerp(R0[0], D1[0], k), lerp(R0[1], D1[1], k)], 'bas', 1); q._brasPris = true;
    q.tenuO = Object.assign({ glisse: smooth(0.1, 0.6, clamp(q.designe || 0)) }, q.tenuO);
    q.ang.objet = (q.ang.objet || 0) + lerp(-0.1, 1.38, k) + (q.tilt || 0);
  }, 0.9);

  // =====================================================================
  // OUVRIERS DE 1840 (A, B) — blouses de bleus différents, casquettes différentes
  // =====================================================================
  function mkOuvrier(o) {
    return body({
      seed: o.seed, torso: torsoPts(o.w, 94, o.belly || 0), coat: o.blouse, sleeve: o.blouse, sleeveB: o.blouseD, skin: o.peau, skinD: o.peauD, cuff: o.blouseD,
      thigh: o.pant, thighB: o.pantD, shoe: '#2e241c', head: o.head, th: o.th || 1,
      torsoPaint: () => {
        fillPts([[-34, -158], [-14, -172], [8, -178], [18, -166], [28, -146], [31, -126], [-35, -124]], o.blouseD);
        for (const x of [-24, -10, 4, 18]) strokePts([[x, -124], [x * 1.15, 94]], 'rgba(15,25,40,0.35)', 1.1);
        if (o.ceinture) strokePts([[-38, -6], [38, -8]], o.ceinture, 4);
        fillPts([[4, -184], [16, -172], [12, -160], [2, -170]], o.col || '#e0d8c4');
        hatch([[-50, -170], [-12, -170], [-10, 96], [-50, 96]], 0.75, 4.2, 0.3); shade(40, 0, -40, 0, 0.3);
      },
      headPaint: o.headPaint, parts: o.parts, heads: Object.keys(o.parts),
    });
  }
  CH.grvOuvrierA = mkOuvrier({ seed: 8800, w: 1.02, belly: 6, blouse: '#556E8C', blouseD: '#475d77', peau: '#d9ae8a', peauD: '#ba8e6a', pant: '#6c6e72', pantD: '#5a5c60', head: X.NAP_HEAD, ceinture: '#3a3028',
    headPaint: (p) => { face(p, { browCol: 'rgba(150,150,150,0.95)', browW: 2.8 }); strokePts([[-8, -40], [4, -36]], 'rgba(120,80,60,0.35)', 1); },
    parts: {
      moustache: { parent: 'head', at: [0, 0], noRivet: true, base: '#bdbab2', seed: 8830, pts: [[34, -30], [28, -36], [16, -37], [8, -30], [14, -25], [26, -27], [36, -23, 1]] },
      casquette: { parent: 'head', at: [0, 0], noRivet: true, base: '#33343a', seed: 8831, pts: [[-34, -72], [-36, -88], [-20, -100], [10, -102], [30, -92], [52, -84, 1], [48, -78], [26, -80], [-30, -74]],
        paint: () => { fillPts([[28, -88], [52, -84], [48, -78], [26, -80]], '#1e1f24'); strokePts([[-30, -92], [26, -96]], 'rgba(255,255,255,0.12)', 1.2); hatch(null, 0.4, 3.2, 0.25); } },
    } });
  CH.grvOuvrierB = mkOuvrier({ seed: 8900, w: 0.96, blouse: '#2F4560', blouseD: '#26384f', peau: '#efcfae', peauD: '#d0ab88', pant: '#8a8c90', pantD: '#76787c', head: X.AR_HEAD, col: '#c9a24a',
    headPaint: (p) => { face(p, { joue: 'rgba(215,110,90,0.25)' }); fillPts([[-12, -50], [-4, -50], [0, -28], [10, -16], [24, -12], [28, -4], [12, 6], [-6, 4], [-14, -16]], '#5a3a24'); },
    parts: {
      casquette: { parent: 'head', at: [0, 0], noRivet: true, base: '#6b5233', seed: 8930, pts: [[-32, -74], [-34, -98], [-26, -112], [0, -118], [22, -110], [30, -94], [54, -88, 1], [50, -80], [28, -82], [-28, -76]],
        paint: () => { fillPts([[28, -92], [54, -88], [50, -80], [28, -82]], '#3e2f1e'); fillPts([[-34, -90], [30, -96], [30, -88], [-33, -82]], '#55412a'); hatch(null, 0.4, 3.2, 0.22); } },
    } });
  GRV.ouvrierA = mkWrap('grvOuvrierA', (q, ph) => { if (ph === 'apres') outilGestes(q); }, 0.8);
  GRV.ouvrierB = mkWrap('grvOuvrierB', (q, ph) => { if (ph === 'apres') outilGestes(q); }, 0.8);

  // =====================================================================
  // LE GENDARME (XIXe) — habit bleu foncé à parements rouges, buffleteries blanches, SHAKO (pas de bicorne : ni le préfet Poubelle ni Napoléon),
  // grosse moustache noire et favoris, bottes. Geste : noter dans un carnet tenu devant lui.
  // =====================================================================
  const GE = { peau: '#e0b896', peauD: '#c29876', habit: '#23324F', habitD: '#1b2740', rouge: '#9e2b25', buffle: '#f0ece2', pant: '#8f99ad', pantD: '#7a8498', botte: '#1a1818', shako: '#1b1a1e', argent: '#c8ccd0' };
  CH.grvGendarme = body({
    seed: 9000, torso: torsoPts(1.04, 36, 4, 118), coat: GE.habit, sleeve: GE.habit, sleeveB: GE.habitD, skin: GE.peau, skinD: GE.peauD,
    thigh: GE.pant, thighB: GE.pantD, shin: GE.botte, shoe: GE.botte, foot: 'botte', head: X.NAP_HEAD,
    lo: (p, back) => { fillPts(box(-17, 44, 17, 68), GE.rouge); if (!SIL()) dot(10, 56, 2.2, GE.argent); },
    shinPaint: () => { fillPts(box(-22, -18, 22, -4), '#2a2626'); strokePts([[-8, 0], [-8, 110]], 'rgba(255,255,255,0.18)', 2); },
    torsoPaint: () => {
      fillPts([[0, -184], [18, -174], [18, -158], [-4, -164]], GE.rouge);                         // col rouge
      fillPts([[-40, 30], [-26, 30], [-24, 118], [-40, 118]], GE.rouge);                           // retroussis
      strokePts([[20, -160], [26, -40], [26, 34]], 'rgba(0,0,10,0.6)', 1.4); for (const y of [-130, -100, -70, -40, -10]) dot(27, y, 2.6, GE.argent);
      fillPts([[-30, -154], [-14, -162], [36, 10], [24, 16]], GE.buffle);                          // baudrier blanc en écharpe
      fillPts([[-40, 0], [38, -4], [38, 10], [-40, 14]], GE.buffle); fillPts(box(16, -4, 30, 12), GE.argent);   // ceinturon
      hatch([[-50, -170], [-12, -170], [-10, 120], [-50, 120]], 0.75, 4.2, 0.3, 1.05, '200,210,230'); shade(40, 0, -40, 0, 0.32);
    },
    headPaint: (p) => { const f = Object.assign({ brow: 'frown' }, p.face); face(Object.assign({}, p, { face: f }), { browW: 3.2, browCol: 'rgba(20,14,10,0.95)' });
      fillPts([[-4, -56], [2, -56], [6, -36], [2, -28], [-2, -36]], '#2a1e18'); },
    parts: {
      moustache: { parent: 'head', at: [0, 0], noRivet: true, base: '#1e1612', seed: 9030, pts: [[38, -28], [30, -37], [16, -38], [6, -32], [0, -24], [10, -22], [22, -27], [32, -22], [42, -20, 1]] },
      shako: { parent: 'head', at: [0, 0], noRivet: true, base: GE.shako, seed: 9031, pts: [[-28, -80], [-32, -138], [-28, -146, 1], [28, -148, 1], [32, -140], [28, -84], [50, -80, 1], [46, -72], [26, -76], [-26, -74]],
        paint: () => { fillPts([[26, -84], [50, -80], [46, -72], [26, -76]], '#0c0c10'); strokePts([[30, -82], [46, -78]], 'rgba(255,255,255,0.35)', 1.4);
          fillPts([[-32, -146], [32, -148], [32, -140], [-32, -138]], '#2c2a30'); strokePts([[-26, -84], [26, -88]], GE.argent, 2);
          fillPts(ell(4, -114, 12, 12, 12), GE.argent); strokePts([[-4, -120], [6, -122]], 'rgba(255,255,255,0.8)', 1.4);
          strokePts([[-12, -138], [-10, -86]], 'rgba(255,255,255,0.1)', 3); } },
      pompon: { parent: 'head', at: [0, 0], noRivet: true, base: GE.rouge, seed: 9032, pts: ell(8, -156, 9, 9, 12) },
    },
    heads: ['moustache', 'shako', 'pompon'],
  });
  GRV.gendarme = mkWrap('grvGendarme', (q, ph) => {
    if (ph !== 'apres' || !q.note) return;
    const k = ease(clamp(q.note)), t = q.t || 0, ob = OBJ.carnet;
    const posT = [lerp(10, 66, k), lerp(-10, -64, k)], ang = lerp(0.2, -0.3, k);
    q._charge = { nom: 'carnet', posT, ang, g1: null, g2: [-30, 26] };
    const page = (() => { const r = rot([16 - ob.base[0], -4 - ob.base[1]], ang); return [posT[0] + r[0], posT[1] + r[1]]; })();
    q.tenu = 'crayon'; q.tenuO = q.tenuO || {}; q.ang.objet = (q.ang.objet || 0) + 0.25;
    const sc = k > 0.9 ? 1 : 0;
    armTo(q, 'armF', [page[0] - 6 + sc * 6 * Math.sin(t * 9), page[1] - 38 + sc * 2 * Math.cos(t * 14)], 'bas', k); q._brasPris = true;
    add(q, 'head', 0.16 * k);
  }, 0.9);

  // =====================================================================
  // ACCESSOIRES DE DÉCOR ET DÉCORS — pré-rendus dans GRV.init(), posés ensuite (fonctions pures du temps ; ambiance en temps GLOBAL)
  // =====================================================================
  const ST = M.ST, W = 1080;
  const K = (GRV.K = {});
  const flatCv = (w, h, fn, sh) => { const cv = M.cutFlat(w, h, w / 2, h - 10, fn); cv.padB = 10; return sh === false ? cv : M.withShadow(cv, 8); };
  const lin = (x0, y0, x1, y1, stops) => { const g = cx_().createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; };
  function voile(x0, y0, x1, y1, col) { const c = cx_(); c.save(); c.globalCompositeOperation = 'source-atop'; c.fillStyle = col; c.fillRect(x0, y0, x1 - x0, y1 - y0); c.restore(); }
  function les(h) { for (let x = 180; x < W; x += 180) strokePts([[x, 0], [x + 2, h]], 'rgba(90,70,50,0.10)', 1.2); }   // coutures des lés de toile
  function fenetre(x, y, w, h, o) {                                              // fenêtre (x,y) = milieu du bas
    o = o || {};
    const top = o.arc ? ep(x, y - h + w / 2, w / 2, w / 2, 6, PI, TAU) : [[x - w / 2, y - h, 1], [x + w / 2, y - h, 1]];
    fillPts([[x - w / 2 - 3, y + 3, 1]].concat(o.arc ? ep(x, y - h + w / 2, w / 2 + 3, w / 2 + 3, 6, PI, TAU) : [[x - w / 2 - 3, y - h - 3, 1], [x + w / 2 + 3, y - h - 3, 1]], [[x + w / 2 + 3, y + 3, 1]]), o.cadre || '#f2ece0');
    fillPts([[x - w / 2, y, 1]].concat(top, [[x + w / 2, y, 1]]), o.vitre || '#4c5a6a');
    strokePts([[x, y], [x, y - h + (o.arc ? w / 2 : 0)]], o.cadre || '#f2ece0', 1.4); strokePts([[x - w / 2, y - h * 0.45], [x + w / 2, y - h * 0.45]], o.cadre || '#f2ece0', 1.2);
    fillPts([[x - w / 2 + 2, y - h * 0.45 - 2], [x - 2, y - h * 0.8], [x - 2, y - h * 0.62], [x - w / 2 + 2, y - h * 0.3]], 'rgba(255,255,255,0.18)');
    if (o.appui) fillPts(box(x - w / 2 - 6, y + 2, x + w / 2 + 6, y + 7), o.cadre || '#e4dccb');
  }
  function toit(pts, col) { const b = M.bbox(pts.map((p) => [p[0], p[1]])); pc(pts.map((p) => [p[0], p[1], 1]), col || '#66717f', () => { for (let y = b[1] + 8; y < b[3]; y += 9) strokePts([[b[0] - 2, y], [b[2] + 2, y]], 'rgba(30,35,45,0.25)', 0.9); }, 9900 + Math.round(b[0]), { drop: false }); }
  const flagsAt = [];

  // ---------------------------------------------------------------- HÔTEL DE VILLE néo-Renaissance (aujourd'hui) — 980 × 640, origine bas-centre
  function drawHdvNeo() {
    const PIERRE = '#e3dccb', PIERRED = '#cfc6b2', ARD = '#66717f';
    // pavillons d'angle : toits à forte pente
    for (const sx of [-1, 1]) {
      const x0 = sx * 330, x1 = sx * 480;
      pc([[x0, 0, 1], [x1, 0, 1], [x1, -340, 1], [x0, -340, 1]], PIERRE, () => { for (const fy of [-40, -140, -240]) for (const fx of [0.3, 0.7]) fenetre(lerp(x0, x1, fx), fy, 24, 52, { arc: fy === -40, appui: true }); strokePts([[x0, -110], [x1, -110]], PIERRED, 3); strokePts([[x0, -210], [x1, -210]], PIERRED, 3); }, 9101 + sx);
      toit([[x0 - 6, -340, 1], [x1 + 6 * sx, -340, 1], [lerp(x0, x1, 0.62), -470], [lerp(x0, x1, 0.38), -470]], ARD);
      fillPts(box(lerp(x0, x1, 0.5) - 3, -500, lerp(x0, x1, 0.5) + 3, -470), '#4a525e');
      fenetre(lerp(x0, x1, 0.5), -370, 18, 26, { arc: true, cadre: '#d9d2c2' });
    }
    // corps principal
    pc([[-330, 0, 1], [330, 0, 1], [330, -300, 1], [-330, -300, 1]], PIERRE, () => {
      for (const fy of [-40, -140, -235]) for (let fx = -300; fx <= 300; fx += 50) if (Math.abs(fx) > 120) fenetre(fx, fy, 22, fy === -40 ? 56 : 48, { arc: fy === -40, appui: fy !== -40 });
      for (const ny of [-170]) for (const nx of [-275, -225, -175, 175, 225, 275]) { fillPts(ep(nx, ny - 26, 8, 8, 6, PI, TAU).concat([[nx + 8, ny], [nx - 8, ny]]), '#b9b09c'); fillPts([[nx - 3, ny], [nx + 3, ny], [nx + 3, ny - 18], [nx, ny - 26], [nx - 3, ny - 18]], '#f0eadc'); }   // niches et statues
      strokePts([[-330, -105], [330, -105]], PIERRED, 3); strokePts([[-330, -205], [330, -205]], PIERRED, 3);
      hatch([[-330, -300], [330, -300], [330, -280], [-330, -280]], 0, 3, 0.2);
    }, 9103);
    toit([[-336, -300, 1], [336, -300, 1], [318, -370], [-318, -370]], ARD);
    for (let fx = -280; fx <= 280; fx += 70) if (Math.abs(fx) > 110) { pc([[fx - 14, -300], [fx + 14, -300], [fx + 14, -342], [fx, -356], [fx - 14, -342]], '#d9d2c2', () => fenetre(fx, -306, 14, 26, { arc: true, cadre: '#d9d2c2' }), 9110 + fx); }
    // pavillon central + campanile à horloge (sans chiffres)
    pc([[-120, 0, 1], [120, 0, 1], [120, -360, 1], [-120, -360, 1]], '#e8e2d2', () => {
      fenetre(0, -6, 60, 90, { arc: true, vitre: '#3e4a58' }); for (const fx of [-70, 70]) fenetre(fx, -30, 26, 60, { arc: true });
      for (const fy of [-150, -250]) for (const fx of [-70, 0, 70]) fenetre(fx, fy, 26, 56, { appui: true });
      for (const fx of [-104, 104]) { fillPts(box(fx - 6, -360, fx + 6, 0), PIERRED); }
      strokePts([[-120, -120], [120, -120]], PIERRED, 3); strokePts([[-120, -300], [120, -300]], PIERRED, 3);
    }, 9120);
    toit([[-126, -360, 1], [126, -360, 1], [86, -430], [-86, -430]], ARD);
    pc([[-46, -380, 1], [46, -380, 1], [46, -470, 1], [-46, -470, 1]], '#e8e2d2', () => {
      fillPts(ell(0, -424, 30, 30, 24), '#2e3a4a'); fillPts(ell(0, -424, 25, 25, 24), '#f2ead6');
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; strokePts([[Math.cos(a) * 20, -424 + Math.sin(a) * 20], [Math.cos(a) * 24, -424 + Math.sin(a) * 24]], '#2e3a4a', i % 3 ? 1.2 : 2.2); }
    }, 9121);
    toit([[-52, -470, 1], [52, -470, 1], [30, -520], [0, -540], [-30, -520]], ARD);
    fillPts(box(-6, -568, 6, -536), '#4a525e');
    fillPts(box(-480, -6, 480, 0), '#b9b09c');
    voile(-490, -620, 490, 10, 'rgba(190,200,215,0.28)');                      // lointain : pâli
  }
  const HDV_NEO = { w: 980, h: 640, horloge: [0, -424], drapeaux: [[-405, -500], [0, -568], [405, -500]] };

  // ---------------------------------------------------------------- ANCIEN HÔTEL DE VILLE Renaissance (1750 et 1840) — 640 × 600, origine bas-centre
  function drawHdv1750() {
    const PIERRE = '#ece2c8', PIERRED = '#d6c9a8', ARD = '#5e6876';
    for (const sx of [-1, 1]) {                                                // pavillons latéraux à hauts toits
      const x0 = sx * 200, x1 = sx * 310;
      pc([[x0, 0, 1], [x1, 0, 1], [x1, -300, 1], [x0, -300, 1]], PIERRE, () => { for (const fy of [-50, -150, -240]) fenetre(lerp(x0, x1, 0.5), fy, 28, 58, { arc: fy === -50, cadre: '#f4ecd8', vitre: '#55606c', appui: true }); strokePts([[x0, -110], [x1, -110]], PIERRED, 3); strokePts([[x0, -200], [x1, -200]], PIERRED, 3); }, 9201 + sx);
      toit([[x0 - 4, -300, 1], [x1 + 4 * sx, -300, 1], [lerp(x0, x1, 0.7), -440], [lerp(x0, x1, 0.3), -440]], ARD);
      fillPts(box(lerp(x0, x1, 0.5) - 4, -470, lerp(x0, x1, 0.5) + 4, -440), '#4a525e');
    }
    pc([[-200, 0, 1], [200, 0, 1], [200, -300, 1], [-200, -300, 1]], PIERRE, () => {
      for (let i = -3; i <= 3; i++) { const x = i * 54; fillPts([[x - 20, 0, 1]].concat(ep(x, -62, 20, 20, 8, PI, TAU), [[x + 20, 0, 1]]), '#6a6458'); }   // arcades
      for (let i = -3; i <= 3; i++) { fillPts(box(i * 54 + 25, -100, i * 54 + 29, 0), PIERRED); }
      for (const fy of [-150, -245]) for (let i = -3; i <= 3; i++) fenetre(i * 54, fy, 24, 52, { cadre: '#f4ecd8', vitre: '#55606c', appui: true });
      strokePts([[-200, -100], [200, -100]], PIERRED, 4); strokePts([[-200, -195], [200, -195]], PIERRED, 3);
      for (let i = -3; i <= 3; i++) fillPts(ep(i * 54, -280, 10, 8, 6, PI, TAU), '#c9bc9a');
    }, 9203);
    toit([[-206, -300, 1], [206, -300, 1], [176, -400], [-176, -400]], ARD);
    for (const fx of [-130, -50, 50, 130]) pc([[fx - 13, -300], [fx + 13, -300], [fx + 13, -336], [fx, -350], [fx - 13, -336]], '#e4d8bc', () => fenetre(fx, -305, 12, 24, { arc: true, cadre: '#e4d8bc' }), 9210 + fx);
    // campanile central : tour, galerie, dôme et lanterne
    pc([[-40, -380, 1], [40, -380, 1], [40, -470, 1], [-40, -470, 1]], PIERRE, () => { fillPts(ep(0, -436, 16, 16, 8, PI, TAU).concat([[16, -400], [-16, -400]]), '#3c3a38'); strokePts([[-40, -470], [40, -470]], PIERRED, 3); }, 9220);
    pc(ep(0, -470, 46, 50, 14, PI, TAU).concat([[46, -470], [-46, -470]]), ARD, () => { for (let i = -2; i <= 2; i++) strokePts([[i * 18, -470], [i * 6, -516]], 'rgba(30,35,45,0.4)', 1); }, 9221);
    pc([[-10, -516, 1], [10, -516, 1], [8, -548], [0, -566], [-8, -548]], '#4a525e', () => dot(0, -536, 3, '#c9a24a'), 9222);
    fillPts(box(-310, -6, 310, 0), '#bcae8c');
    voile(-320, -580, 320, 10, 'rgba(225,215,200,0.22)');
  }
  const HDV_1750 = { w: 640, h: 590 };

  // ---------------------------------------------------------------- arbres, lampadaires, mobilier d'aujourd'hui
  function drawPlatane(seed) {
    const R = M.rng(seed);
    pc([[-26, 0, 1], [26, 0, 1], [20, -300], [30, -460], [10, -470], [6, -340], [-8, -400], [-26, -390], [-12, -300]], '#a8a08a', () => {
      for (let i = 0; i < 26; i++) fillPts(ell(-14 + R() * 34, -20 - R() * 400, 6 + R() * 8, 4 + R() * 6, 8), i % 2 ? '#7e7a68' : '#d2ccb6');   // écorce en plaques
      shade(26, 0, -26, 0, 0.3, [-40, -480, 40, 5]);
    }, seed);
    const cols = ['#c9a640', '#a99a3e', '#8a8a3c', '#d4b24c', '#b88a34'];
    for (let i = 0; i < 16; i++) {
      const a = R() * TAU, r = R() * 170, cx = Math.cos(a) * r * 1.2, cy = -600 + Math.sin(a) * r * 0.75, rr = 70 + R() * 50;
      pc(ell(cx, cy, rr, rr * 0.8, 14), cols[i % cols.length], () => { for (let j = 0; j < 12; j++) fillPts(ell(cx - rr * 0.7 + R() * rr * 1.4, cy - rr * 0.5 + R() * rr, 7, 5, 6), 'rgba(255,240,180,0.35)'); hatch(null, 0.7, 5, 0.12); }, seed + 10 + i, { drop: false });
    }
  }
  const PLATANE = { feuillage: [0, -600, 230, 150] };
  function drawLampadaire() {
    const F = '#2b302c';
    pc([[-16, 0, 1], [16, 0, 1], [12, -30], [6, -40], [5, -420], [-5, -420], [-6, -40], [-12, -30]], F, () => strokePts([[-2, -40], [-2, -410]], 'rgba(255,255,255,0.15)', 1.5), 9301);
    for (const sx of [-1, 1]) strokePts([[0, -400], [sx * 30, -420], [sx * 38, -440]], F, 4);
    pc([[-20, -470], [20, -470], [26, -436, 1], [-26, -436, 1]], '#efe2b8', () => { strokePts([[0, -470], [0, -436]], F, 1.5); fillPts(box(-26, -440, 26, -434), F); }, 9302);
    pc([[-28, -470, 1], [28, -470, 1], [14, -490], [0, -500], [-14, -490]], F, () => dot(0, -504, 4, F), 9303);
  }
  function drawAbri() {                                                           // abri de bus 420 × 540 : verre, banc, poteau (sans texte)
    const F = '#3a3d42', VERRE = 'rgba(190,215,225,0.30)';
    for (const x of [-190, 70, 180]) pc(box(x - 5, -520, x + 5, 0), F, null, 9310 + x);
    pc(box(-190, -510, 180, -150), VERRE, () => { for (const x of [-120, -20, 80]) strokePts([[x - 40, -480], [x + 30, -190]], 'rgba(255,255,255,0.35)', 3); strokePts([[-60, -500], [-60, -160]], F, 3); }, 9311, { texA: 0.15, drop: false });
    pc([[180, -510, 1], [200, -505, 1], [200, -150, 1], [180, -150, 1]], 'rgba(160,190,205,0.4)', null, 9312, { drop: false });
    pc([[70, -480, 1], [176, -480, 1], [176, -250, 1], [70, -250, 1]], '#e9eef0', () => { fillPts(box(78, -470, 168, -270), '#9cb7a8'); for (const y of [-440, -400, -360, -320]) strokePts([[86, y], [160, y + 10]], '#e9eef0', 3); strokePts([[100, -470], [120, -270]], '#c9a24a', 3); dot(150, -300, 5, '#2e5f8a'); }, 9313);   // plan de quartier sans texte
    pc([[-214, -520, 1], [214, -540, 1], [214, -556, 1], [-214, -536, 1]], '#2e3136', () => strokePts([[-210, -528], [210, -548]], 'rgba(255,255,255,0.2)', 1.5), 9314);
    // banc
    pc(box(-160, -120, 40, -100), '#9a6a40', () => { strokePts([[-160, -112], [40, -112]], 'rgba(60,35,15,0.5)', 1); }, 9315);
    pc(box(-160, -190, 40, -170), '#9a6a40', null, 9316);
    for (const x of [-140, 20]) pc(box(x - 4, -170, x + 4, 0), F, null, 9317 + x);
    // poteau d'arrêt : disque coloré nu
    pc(box(236, -560, 244, 0), '#8a8e94', null, 9320);
    pc(ell(240, -580, 34, 34, 20), '#2f6e5a', () => { fillPts(ell(240, -580, 26, 26, 18), '#e9eef0'); fillPts(ell(240, -580, 14, 14, 14), '#2f6e5a'); }, 9321);
    pc(box(244, -530, 300, -500), '#e9eef0', () => fillPts(box(250, -524, 294, -506), '#c9a24a'), 9322);
  }
  const ABRI = { w: 520, h: 620, toit: [-214, -546, 214], banc: [-60, -120] };
  function drawMorris() {
    const V = '#2f4a3a';
    pc([[-56, 0, 1], [56, 0, 1], [56, -40, 1], [48, -50], [48, -330], [-48, -330], [-48, -50], [-56, -40, 1]], V, () => {
      const cols = ['#c9a24a', '#a4512e', '#4c6a8a', '#e6dcc6', '#7a8a4a', '#b0302a'];
      let k = 0; for (let y = -320; y < -60; y += 66) for (let x = -44; x < 40; x += 44) { const c1 = cols[(k++ * 7) % 6]; fillPts(box(x, y, x + 40, y + 60), c1); fillPts(ell(x + 20, y + 26, 12, 12, 10), cols[(k * 3) % 6]); strokePts([[x + 6, y + 48], [x + 34, y + 48]], 'rgba(30,30,30,0.4)', 2); }
      shade(48, -200, -48, -200, 0.35, [-60, -340, 60, 0]);
    }, 9330);
    pc([[-62, -330, 1], [62, -330, 1], [56, -350], [40, -380], [0, -398], [-40, -380], [-56, -350]], V, () => strokePts([[-50, -350], [50, -350]], '#c9a24a', 2), 9331);
    pc([[-8, -396], [8, -396], [4, -420], [0, -428], [-4, -420]], V, null, 9332);
  }
  function drawPoubelle() {
    pc(box(-4, -150, 4, 0), '#2f4a3a', null, 9340);
    pc([[-34, -138], [34, -138], [30, -40], [24, -30], [-24, -30], [-30, -40]], 'rgba(200,220,215,0.55)', () => { strokePts([[-20, -130], [-14, -40]], 'rgba(255,255,255,0.5)', 2); fillPts([[-24, -60], [24, -60], [22, -32], [-22, -32]], 'rgba(120,110,90,0.35)'); }, 9341, { texA: 0.2 });
    pc(box(-38, -146, 38, -134), '#2f4a3a', null, 9342);
  }
  function drawVelo() {
    const R0 = 46, F = '#3e5a6e';
    for (const x of [-70, 70]) { strokePts(ell(x, -R0, R0, R0, 24).concat([[x + R0, -R0]]), '#1e1e22', 4); for (let i = 0; i < 8; i++) { const a = i / 8 * PI; strokePts([[x + Math.cos(a) * R0, -R0 + Math.sin(a) * R0], [x - Math.cos(a) * R0, -R0 - Math.sin(a) * R0]], 'rgba(180,180,185,0.6)', 0.8); } }
    strokePts([[-70, -R0], [-10, -R0], [-30, -110], [50, -110], [-10, -R0]], F, 4); strokePts([[50, -110], [70, -R0]], F, 4); strokePts([[50, -110], [44, -136], [64, -140]], F, 3.4);
    strokePts([[-30, -110], [-34, -122]], F, 3); fillPts([[-50, -128], [-20, -126], [-24, -120], [-48, -120]], '#2a2420');
    fillPts(box(-110, -84, -50, -78), '#555a60');
  }
  function drawManege() {                                                        // petit manège (au loin) — chevaux animés à part
    pc([[-110, -150], [110, -150], [0, -230]], '#a4512e', () => { for (let i = -4; i <= 4; i++) fillPts([[i * 24 - 12, -150], [i * 24 + 12, -150], [0, -230]], i % 2 ? '#e6dcc6' : '#a4512e'); }, 9350);
    fillPts(box(-112, -156, 112, -146), '#c9a24a'); fillPts(box(-4, -250, 4, -228), '#5b3d22');
    for (const x of [-90, -30, 30, 90]) fillPts(box(x - 1.5, -146, x + 1.5, -20), '#c9a24a');
    pc([[-116, -20, 1], [116, -20, 1], [116, 0, 1], [-116, 0, 1]], '#6b4a2e', () => strokePts([[-116, -12], [116, -12]], '#c9a24a', 2), 9351);
    voile(-130, -260, 130, 10, 'rgba(200,205,215,0.25)');
  }
  const MANEGE = { chevaux: [-90, -30, 30, 90] };

  // ---------------------------------------------------------------- port de Grève (XVIIIe) : ponton, pieux, grue à roue, tonneaux, sacs, foin, brouette, lanterne, cordages
  function drawPort1750() {
    const B = '#6e4e32', BL = '#8a6a48', BD = '#4e3622';
    // grue à roue (à gauche, derrière le ponton)
    pc([[-404, -120, 1], [-388, -120, 1], [-384, -640, 1], [-400, -640, 1]], BD, () => hatch(null, 0.2, 4, 0.2), 9401);
    strokePts([[-396, -630], [-250, -700], [-170, -720]], B, 9); strokePts([[-396, -560], [-250, -700]], BD, 5);
    strokePts([[-176, -718], [-176, -470]], '#3a3028', 1.6); strokePts([[-182, -470], [-176, -460], [-170, -470], [-176, -478]], '#3a3028', 2.4);
    const RW = 110, CX = -330, CY = -250;
    strokePts(ell(CX, CY, RW, RW, 36).concat([[CX + RW, CY]]), B, 10); strokePts(ell(CX, CY, RW - 16, RW - 16, 36).concat([[CX + RW - 16, CY]]), BD, 3);
    for (let i = 0; i < 8; i++) { const a = i / 8 * PI; strokePts([[CX + Math.cos(a) * RW, CY + Math.sin(a) * RW], [CX - Math.cos(a) * RW, CY - Math.sin(a) * RW]], BL, 3); }
    for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; strokePts([[CX + Math.cos(a) * (RW - 4), CY + Math.sin(a) * (RW - 4)], [CX + Math.cos(a) * (RW - 14), CY + Math.sin(a) * (RW - 14)]], BD, 2); }
    pc(ell(CX, CY, 12, 12, 10), BD, null, 9402);
    strokePts([[CX - 70, -120], [CX, CY], [CX + 70, -120]], BD, 7);
    // ponton : planches sur pilotis
    for (let x = -490; x <= -110; x += 54) pc(box(x - 7, -114, x + 7, 0), BD, () => hatch(null, 0.2, 3, 0.25), 9410 + x);
    pc([[-500, -124, 1], [-100, -124, 1], [-100, -108, 1], [-500, -108, 1]], BL, () => { for (let x = -490; x < -100; x += 22) strokePts([[x, -124], [x, -108]], 'rgba(40,25,10,0.45)', 1); }, 9420);
    for (const x of [-450, -270, -140]) pc([[x - 9, -124], [x + 9, -124], [x + 9, -176], [x, -186], [x - 9, -176]], BD, () => strokePts([[x - 9, -160], [x + 9, -160]], '#8a7a5a', 3), 9421 + x);
    // cordage enroulé sur le ponton
    for (let i = 0; i < 4; i++) strokePts(ep(-210, -132 + i * 2, 26 - i * 5, 6, 12, 0, TAU), '#b8a070', 2.2);
    // lanterne sur poteau
    pc(box(-96, -380, -88, -110), BD, null, 9430); strokePts([[-92, -380], [-70, -390]], BD, 4);
    pc([[-82, -392], [-58, -392], [-56, -350, 1], [-84, -350, 1]], '#d9c88a', () => { strokePts([[-70, -392], [-70, -350]], '#3a3028', 1.2); }, 9431);
    pc([[-86, -392, 1], [-54, -392, 1], [-70, -410]], '#3a3028', null, 9432);
    // marchandises sur la rive (à droite)
    const c = cx_();
    const posA = (x, y, s, fn) => { c.save(); c.translate(x, y); c.scale(s, s); fn({}); c.restore(); };
    posA(330, 0, 0.8, drawTonneau); posA(408, 0, 0.8, drawTonneau); posA(370, -99, 0.8, drawTonneau);
    posA(250, 0, 0.75, (o) => drawSac(o)); posA(204, 0, 0.75, (o) => drawSac(o)); posA(228, -110, 0.7, (o) => drawSac(o));
    posA(470, 0, 0.75, drawFoin); posA(470, -66, 0.75, drawFoin);
    // brouette
    pc([[100, -70], [176, -64], [182, -36, 1], [104, -36, 1]], B, () => hatch(null, 0.3, 4, 0.2), 9440);
    strokePts([[104, -40], [60, -24]], BD, 4); strokePts([[150, -36], [150, -4]], BD, 3);
    strokePts(ell(176, -18, 18, 18, 14).concat([[194, -18]]), BD, 4);
  }
  const PORT = { pieux: [[-450, -186], [-270, -186], [-140, -186]], lanterne: [-70, -372], ponton: [-500, -100, -124] };   // repère : x écran = 540 + x, y écran = ST.back + y (port en place)

  // ---------------------------------------------------------------- 1840 : réverbère, charrette, colonne d'affichage, parapet, cheminée d'usine
  function drawReverbere() {
    const F = '#2a2a2c';
    pc([[-14, 0, 1], [14, 0, 1], [8, -30], [5, -380], [-5, -380], [-8, -30]], F, null, 9501);
    strokePts([[0, -380], [26, -390], [40, -404]], F, 4);
    pc([[24, -404], [56, -404], [50, -446], [30, -446]], 'rgba(240,215,150,0.7)', () => { strokePts([[40, -404], [40, -446]], F, 1.2); }, 9502, { texA: 0.2 });
    pc([[22, -446, 1], [58, -446, 1], [40, -470]], F, () => dot(40, -474, 3, F), 9503);
    fillPts(box(22, -406, 58, -400), F);
  }
  const REVERB = { flamme: [40, -412] };
  function drawCharrette() {
    const B = '#7a5a3a', BD = '#4e3622';
    pc([[-150, -110, 1], [90, -110, 1], [90, -60, 1], [-150, -60, 1]], B, () => { for (let x = -140; x < 90; x += 30) strokePts([[x, -110], [x, -60]], 'rgba(40,25,10,0.45)', 1); hatch(null, 0.2, 4, 0.18); }, 9510);
    strokePts([[90, -80], [220, -40]], BD, 6); strokePts([[90, -66], [220, -26]], BD, 5);
    strokePts(ell(-30, -48, 48, 48, 24).concat([[18, -48]]), BD, 6); for (let i = 0; i < 6; i++) { const a = i / 6 * PI; strokePts([[-30 + Math.cos(a) * 46, -48 + Math.sin(a) * 46], [-30 - Math.cos(a) * 46, -48 - Math.sin(a) * 46]], B, 3); }
    const c = cx_(); c.save(); c.translate(-90, -110); c.scale(0.55, 0.55); drawTonneau({}); c.restore();
    c.save(); c.translate(10, -110); c.scale(0.55, 0.55); drawSac({}); c.restore();
  }
  function drawColonne1840() {                                                    // colonne d'affichage d'époque : motifs de couleur, aucune lettre
    pc([[-40, 0, 1], [40, 0, 1], [40, -20, 1], [34, -26], [34, -300], [-34, -300], [-34, -26], [-40, -20, 1]], '#5a5a50', () => {
      const cols = ['#c9a24a', '#a4512e', '#e6dcc6', '#4c6a8a', '#8a6a48'];
      for (let i = 0; i < 5; i++) { const y = -290 + i * 54; fillPts(box(-30, y, 30, y + 48), cols[i]); fillPts(box(-22, y + 8, 22, y + 18), 'rgba(30,25,20,0.35)'); for (let j = 0; j < 3; j++) strokePts([[-22, y + 26 + j * 6], [18, y + 26 + j * 6]], 'rgba(30,25,20,0.25)', 1.4); }
      shade(34, -150, -34, -150, 0.35, [-40, -310, 40, 0]);
    }, 9520);
    pc([[-44, -300, 1], [44, -300, 1], [30, -330], [0, -344], [-30, -330]], '#4a4a42', null, 9521);
  }
  function drawCheminee() { pc([[-22, 0, 1], [22, 0, 1], [14, -340, 1], [-14, -340, 1]], '#8a5a44', () => { for (let y = -330; y < 0; y += 14) strokePts([[-22, y], [22, y]], 'rgba(60,30,20,0.3)', 1); fillPts(box(-17, -340, 17, -326), '#5a3a2c'); }, 9530); }

  // ---------------------------------------------------------------- toiles de fond : ciel + rive d'en face + Seine
  function maisonsPansDeBois(R, x0, x1, yb, hMin, hMax, colsT) {
    let x = x0;
    while (x < x1) {
      const w = 46 + R() * 34, h = hMin + R() * (hMax - hMin), col = colsT[Math.floor(R() * colsT.length)];
      fillPts([[x, yb, 1], [x + w, yb, 1], [x + w, yb - h, 1], [x + w / 2, yb - h - w * 0.75, 1], [x, yb - h, 1]], col);
      fillPts([[x - 2, yb - h + 2, 1], [x + w / 2, yb - h - w * 0.78, 1], [x + w + 2, yb - h + 2, 1], [x + w / 2, yb - h - w * 0.6, 1]], '#7a7270');
      for (let fy = yb - h + 18; fy < yb - 18; fy += 30) { strokePts([[x, fy], [x + w, fy]], 'rgba(90,60,40,0.55)', 1.5); for (let fx = x + 10; fx < x + w - 8; fx += 18) fillPts(box(fx, fy + 6, fx + 8, fy + 18), '#5a6070'); }
      strokePts([[x + 3, yb], [x + 3, yb - h]], 'rgba(90,60,40,0.5)', 1.4); strokePts([[x + 2, yb - 10], [x + w * 0.4, yb - h * 0.5]], 'rgba(90,60,40,0.3)', 1);
      if (R() < 0.6) { const cxm = x + w * (0.25 + R() * 0.5); fillPts(box(cxm - 4, yb - h - w * 0.5 - 22, cxm + 4, yb - h - w * 0.4), '#6a5a52'); if (GRV._chem) GRV._chem.push([cxm, yb - h - w * 0.5 - 22]); }
      x += w + 2;
    }
  }
  function paintSeine(y0, y1, cTop, cBot) {
    fillPts(box(0, y0, W, y1), cTop); const c = cx_(); c.fillStyle = lin(0, y0, 0, y1, [[0, cTop], [1, cBot]]); c.fillRect(0, y0, W, y1 - y0);
    for (let i = 0; i < 40; i++) { const x = hash(i * 3.7) * W, y = y0 + 6 + hash(i * 1.9) * (y1 - y0 - 10); strokePts([[x, y], [x + 30 + hash(i) * 40, y]], 'rgba(255,255,255,0.18)', 1.2); }
  }
  function drawFond(kind) {
    return M.pre(W, ST.back + 6, (c) => {
      const R = M.rng(kind === '1840' ? 1840 : 1750);
      const sky = kind === '1840' ? [[0, '#a9b4bc'], [0.6, '#d6d2c4'], [1, '#e2d8c0']] : [[0, '#9fbcd0'], [0.55, '#e8dcc0'], [1, '#f1d9b4']];
      c.fillStyle = lin(0, 0, 0, 1100, sky); c.fillRect(0, 0, W, ST.back + 6);
      for (let i = 0; i < 7; i++) { const y = 360 + i * 70; strokePts([[0, y], [W, y + 6]], 'rgba(255,250,235,0.12)', 6); }
      les(ST.back);
      GRV._chem = [];
      // rive d'en face : maisons, clocher, pont couvert de maisons (1750) ou pont de pierre + usine (1840)
      const yb = 1060;
      fillPts(box(0, yb - 4, W, yb + 8), '#a8987a');
      if (kind !== '1840') {
        pc([[200, yb, 1], [200, yb - 120, 1], [250, yb - 160, 1], [250, yb - 250, 1], [294, yb - 250, 1], [294, yb, 1]], '#c9bea6', () => { fillPts(ep(272, yb - 200, 9, 9, 6, PI, TAU).concat([[281, yb - 172], [263, yb - 172]]), '#6a6460'); fillPts(ep(224, yb - 60, 10, 10, 6, PI, TAU).concat([[234, yb - 30], [214, yb - 30]]), '#6a6460'); }, 9601, { drop: false });
        toit([[246, yb - 250], [298, yb - 250], [272, yb - 360]], '#7d8590'); toit([[196, yb - 118], [254, yb - 160], [254, yb - 118]], '#7d8590');
        maisonsPansDeBois(R, -10, 760, yb, 90, 170, ['#e3d6bc', '#d9c9a8', '#eadfca', '#cdbf9f']);
        for (let i = 0; i < 4; i++) { const x = 790 + i * 78; fillPts([[x, yb + 20]].concat(ep(x + 39, yb + 20, 39, 34, 8, PI, TAU), [[x + 78, yb + 20], [x + 78, yb - 30], [x, yb - 30]]), '#b8ab90'); }   // arches du pont
        maisonsPansDeBois(R, 786, 1100, yb - 30, 60, 110, ['#e3d6bc', '#d9c9a8', '#cdbf9f']);
      } else {
        pc([[180, yb], [180, yb - 330, 1], [196, yb - 330, 1], [204, yb]], '#8a5a44', () => { for (let y = yb - 320; y < yb; y += 14) strokePts([[180, y], [204, y]], 'rgba(60,30,20,0.3)', 1); }, 9602, { drop: false });
        GRV._usine = [192, yb - 334];
        fillPts(box(120, yb - 90, 290, yb), '#9a8a7a'); for (let x = 130; x < 280; x += 24) fillPts(box(x, yb - 70, x + 12, yb - 40), '#5a6070');
        maisonsPansDeBois(R, 290, 780, yb, 120, 200, ['#d8cfbf', '#cfc4ae', '#e0d8c6', '#c6bba4']);
        maisonsPansDeBois(R, -10, 118, yb, 100, 160, ['#d8cfbf', '#cfc4ae']);
        for (let i = 0; i < 4; i++) { const x = 790 + i * 78; fillPts([[x, yb + 20]].concat(ep(x + 39, yb + 20, 39, 30, 8, PI, TAU), [[x + 78, yb + 20], [x + 78, yb - 18], [x, yb - 18]]), '#c4b9a2'); }
        strokePts([[786, yb - 22], [1080, yb - 22]], '#9a907c', 4);
      }
      voile(0, 700, W, yb + 10, 'rgba(215,215,215,0.32)');
      paintSeine(yb + 8, 1240, '#8aa0aa', '#6a8590');
      fillPts(box(0, 1236, W, ST.back + 6), '#6a8590');
    });
  }

  // ---------------------------------------------------------------- tapis de sol (dessinés APRÈS M.drawFloor) : grève, quai 1840, pavés d'aujourd'hui
  function drawSol(kind) {
    return M.pre(W, 70, (c) => {
      const R = M.rng(kind.length * 31 + 7), top = 0, bot = 46;
      const bord = []; for (let x = 0; x <= W; x += 30) bord.push([x, bot - 4 + Math.sin(x * 0.05) * 3 + R() * 4]);
      const poly = [[0, top, 1], [W, top, 1]].concat(bord.reverse());
      if (kind === 'pave') {
        fillPts(poly, '#7a7f88');
        for (let row = 0; row < 3; row++) for (let x = -20 + row * 14; x < W; x += 42) fillPts(rrect(x, 3 + row * 14, x + 38, 15 + row * 14, 4), row % 2 ? '#6E7480' : '#858b96');
      } else if (kind === 'quai') {
        fillPts(poly, '#c7b591');
        for (let x = 0; x < W; x += 3) dot(x, 4 + R() * 38, 0.8 + R() * 1.6, R() < 0.5 ? 'rgba(110,95,70,0.5)' : 'rgba(250,240,220,0.5)');
        for (let x = 520; x < W; x += 40) fillPts(rrect(x, 2, x + 36, 16, 4), x % 80 ? '#6E7480' : '#7d838e');   // pavés neufs au bord du gravier
      } else {
        fillPts(poly, '#cdbb98');
        for (let x = 0; x < W; x += 2.5) dot(x, 3 + R() * 40, 0.7 + R() * 1.4, R() < 0.5 ? 'rgba(120,100,70,0.5)' : 'rgba(255,245,225,0.55)');
        for (let i = 0; i < 26; i++) { const x = R() * W, y = 8 + R() * 30; fillPts(ell(x, y, 6 + R() * 8, 3 + R() * 4, 10), ['#9c9283', '#b5ab9a', '#8a8070'][i % 3]); }
      }
    });
  }

  // ---------------------------------------------------------------- coupe du sol (plan 7) : pavés au-dessus, lit de gravier dessous ; (x,y) = milieu du dessus des pavés
  function drawCoupe() {
    const w = 700, hp = 60, hg = 200;
    pc([[-w / 2, 0, 1], [w / 2, 0, 1], [w / 2, hp + hg, 1], [-w / 2, hp + hg + 8, 1]], '#d6c4a0', () => {
      const R = M.rng(707);
      for (let i = 0; i < 900; i++) dot(-w / 2 + R() * w, hp + R() * hg, 1 + R() * 2.2, ['#b9a47e', '#e6d8bb', '#a8957a', '#cbb894'][i % 4]);
      for (let i = 0; i < 40; i++) fillPts(ell(-w / 2 + R() * w, hp + 10 + R() * (hg - 20), 5 + R() * 7, 4 + R() * 4, 8), ['#9c9283', '#b5ab9a', '#8a8070'][i % 3]);
      fillPts(box(-w / 2, hp - 6, w / 2, hp + 8), '#bfae88');                    // lit de sable sous les pavés
      for (let x = -w / 2 + 2; x < w / 2 - 50; x += 58) pc(rrect(x, 4, x + 54, hp - 4, 6), '#6E7480', () => { strokePts([[x + 6, 10], [x + 44, 10]], 'rgba(255,255,255,0.22)', 2); hatch(null, 0.8, 4, 0.18); }, 9700 + x, { drop: false });
      strokePts([[-w / 2, 0], [w / 2, 0]], '#4e535c', 2.5);
      hatch([[-w / 2, hp], [-w / 2 + 30, hp], [-w / 2 + 30, hp + hg], [-w / 2, hp + hg]], 0.6, 4, 0.2);
    }, 9699);
  }
  const COUPE = { w: 700, pave: 60, gravier: 200 };

  // ---------------------------------------------------------------- petits êtres animés du décor
  function pigeon(x, y, s, ph, pick, dir) {                                     // pigeon posé qui picore ; pick 0..1
    const c = cx_(); c.save(); c.translate(x, y); c.scale(s * (dir || 1), s);
    const hd = Math.max(0, Math.sin(ph)) * 0.6 * pick;
    fillPts([[-16, -8], [-4, -16], [10, -14], [16, -6], [10, 0], [-10, 0], [-22, -4]], '#8d929c');
    fillPts([[-14, -10], [4, -14], [8, -8], [-8, -6]], '#a7acb5');
    c.save(); c.translate(10, -14); c.rotate(hd); fillPts(ell(4, -4, 6, 5, 8), '#6f7480'); dot(6, -6, 1.2, '#e8d070'); fillPts([[9, -4], [14, -2], [9, -1]], '#c9a080'); c.restore();
    strokePts([[0, 0], [0, 6]], '#c47a6a', 1.4); strokePts([[4, 0], [5, 6]], '#c47a6a', 1.4);
    c.restore();
  }
  function oiseauPose(x, y, s, dir, col, fold) {                                // mouette / pigeon qui vole puis se pose (fold 0 = ailes ouvertes, 1 = repliées)
    const c = cx_(); c.save(); c.translate(x, y); c.scale(s * dir, s);
    fillPts([[-18, -8], [-2, -14], [12, -12], [18, -6], [10, -2], [-12, -2], [-26, -4]], col);
    fillPts(ell(14, -14, 6, 5, 8), col); fillPts([[19, -14], [26, -12], [19, -11]], '#d8a040'); dot(16, -16, 1.2, '#222');
    if (fold < 1) { const a = (1 - fold) * (0.6 + 0.6 * Math.sin(x * 0.3)); fillPts([[-6, -10], [4, -10], [-10 - 20 * (1 - fold), -10 - 34 * a]], col); }
    strokePts([[0, -2], [0, 6]], '#c4846a', 1.3);
    c.restore();
  }
  function feuilles(t, x0, x1, y0, n, seed) {                                    // feuilles de platane qui tombent en tournoyant
    const R = M.rng(seed);
    for (let i = 0; i < n; i++) {
      const per = 6 + R() * 4, off = R() * per, sx = x0 + R() * (x1 - x0), u = ((t + off) % per) / per, y = y0 + u * (ST.back - 20 - y0), x = sx + Math.sin(u * 9 + i) * 30 - u * 40;
      const fl = Math.cos(u * 14 + i), col = ['#c9a640', '#b88a34', '#d4b24c'][i % 3];
      const c = cx_(); c.save(); c.globalAlpha = Math.min(1, (1 - u) * 6); c.translate(x, y); c.rotate(u * 6 + i); c.scale(fl, 1);
      fillPts([[0, -8], [6, -2], [3, 6], [-3, 6], [-6, -2]], col); strokePts([[0, -6], [0, 8]], 'rgba(90,60,20,0.6)', 0.8); c.restore();
    }
  }
  function eauVive(t, x0, x1, y0, y1, n, seed) {                                  // reflets qui scintillent sur l'eau
    const R = M.rng(seed);
    for (let i = 0; i < n; i++) {
      const x = x0 + R() * (x1 - x0), y = y0 + R() * (y1 - y0), ph = R() * TAU, l = 14 + R() * 30, a = 0.18 + 0.18 * Math.sin(t * 1.6 + ph);
      strokePts([[x + Math.sin(t * 0.7 + ph) * 8, y], [x + l + Math.sin(t * 0.7 + ph) * 8, y]], `rgba(255,252,235,${a})`, 1.5);
    }
  }
  function barque(x, y, s, dir) {
    const c = cx_(); c.save(); c.translate(x, y); c.scale(s * dir, s);
    fillPts([[-60, -14], [60, -14], [70, -24, 1], [52, 0], [-50, 0], [-66, -20, 1]], '#6a5040');
    strokePts([[-20, -14], [-26, -50]], '#3a3028', 2); fillPts(ell(-26, -54, 5, 5, 8), '#5a4a40');
    strokePts([[10, -14], [40, -40]], '#3a3028', 1.6);
    c.restore();
  }
  function poule(x, y, s, ph) {
    const c = cx_(); c.save(); c.translate(x, y - Math.abs(Math.sin(ph)) * 3 * s); c.scale(-s, s);
    fillPts([[-20, -16], [-8, -26], [10, -24], [18, -16], [14, -4], [-12, -4], [-26, -22, 1]], '#d8cbb0');
    fillPts([[12, -24], [20, -36], [26, -30], [20, -22]], '#d8cbb0'); fillPts([[18, -38], [22, -42], [26, -38]], '#a3261f'); fillPts([[26, -32], [32, -30], [26, -28]], '#d8a040'); dot(22, -33, 1.4, '#222');
    strokePts([[0, -4], [-2 + Math.sin(ph) * 5, 8]], '#c9a040', 1.6); strokePts([[6, -4], [6 - Math.sin(ph) * 5, 8]], '#c9a040', 1.6);
    c.restore();
  }
  function chat(x, y, s, ph) {
    const c = cx_(); c.save(); c.translate(x, y); c.scale(s, s);
    fillPts([[-26, -16], [-6, -22], [16, -20], [24, -14], [20, -4], [-22, -4]], '#3a3430');
    fillPts([[18, -20], [24, -32], [28, -24], [34, -32], [36, -18], [28, -10], [18, -10]], '#3a3430'); dot(30, -20, 1.4, '#c9c060');
    strokePts([[-24, -14], [-38, -26], [-42, -40]], '#3a3430', 3);
    for (const [lx, p] of [[-16, 0], [-8, PI], [10, PI / 2], [16, PI * 1.5]]) strokePts([[lx, -6], [lx + Math.sin(ph + p) * 5, 4]], '#3a3430', 3);
    c.restore();
  }

  // =====================================================================
  // GRV.init : pré-rendus (une seule fois, dans S.init)
  // =====================================================================
  GRV.init = function () {
    K.hdvNeo = flatCv(HDV_NEO.w, HDV_NEO.h, drawHdvNeo);
    K.hdv1750 = flatCv(HDV_1750.w, HDV_1750.h, drawHdv1750);
    K.platane = flatCv(560, 800, () => drawPlatane(9300));
    K.platane2 = flatCv(560, 800, () => drawPlatane(9340));
    K.lampadaire = flatCv(110, 530, drawLampadaire);
    K.abri = flatCv(ABRI.w, ABRI.h, drawAbri);
    K.morris = flatCv(140, 450, drawMorris);
    K.poubelle = flatCv(90, 170, drawPoubelle);
    K.velo = flatCv(260, 160, drawVelo);
    K.manege = flatCv(270, 270, drawManege, false);
    K.port1750 = flatCv(W, 760, drawPort1750);
    K.reverbere = flatCv(130, 500, drawReverbere);
    K.charrette = flatCv(480, 220, drawCharrette);
    K.colonne1840 = flatCv(100, 360, drawColonne1840);
    K.cheminee = flatCv(60, 360, drawCheminee, false);
    K.coupe = M.cutFlat(720, 290, 360, 10, drawCoupe);
    K.fond1750 = drawFond('1750'); K.chem1750 = GRV._chem;
    K.fond1840 = drawFond('1840'); K.chem1840 = GRV._chem; K.usine = GRV._usine;
    K.ciel0 = M.pre(W, ST.back + 6, (c) => {
      c.fillStyle = lin(0, 0, 0, 1200, [[0, '#9fb0c0'], [0.6, '#cfd3d2'], [1, '#d9d6cc']]); c.fillRect(0, 0, W, ST.back + 6); les(ST.back);
      fillPts(box(0, 1120, W, ST.back + 6), '#b8b4aa');                            // parvis au loin
      for (let i = 0; i < 14; i++) strokePts([[540 + (i - 7) * 50, 1120], [540 + (i - 7) * 160, ST.back + 6]], 'rgba(120,115,105,0.35)', 1);
      for (const y of [1150, 1200, 1270, 1350]) strokePts([[0, y], [W, y]], 'rgba(120,115,105,0.3)', 1);
    });
    // grève 1750 (berge de sable) et eau proche
    K.berge = flatCv(W, 200, () => {
      const R = M.rng(1751), top = [];
      for (let x = -540; x <= 540; x += 30) top.push([x, x < -150 ? 10 : -150 + 12 * Math.sin(x * 0.02) + (x + 150) * -0.04 - R() * 8]);
      pc([[-540, 10, 1]].concat([[-170, 10], [-120, -60], [-60, -120]], top.filter((p) => p[0] > -60), [[540, 10, 1]]), '#cdbb98', () => {
        for (let i = 0; i < 700; i++) dot(-200 + R() * 740, -170 + R() * 180, 0.7 + R() * 1.5, R() < 0.5 ? 'rgba(120,100,70,0.45)' : 'rgba(255,245,225,0.5)');
        for (let i = 0; i < 26; i++) fillPts(ell(-120 + R() * 640, -110 + R() * 110, 6 + R() * 10, 3 + R() * 5, 10), ['#9c9283', '#b5ab9a', '#8a8070'][i % 3]);
        for (const [x, y] of [[40, -40], [260, -70], [430, -20]]) { fillPts(ell(x, y, 46, 9, 14), '#8aa0aa'); strokePts([[x - 24, y - 2], [x + 10, y - 3]], 'rgba(255,255,255,0.5)', 1.4); }   // flaques
        fillPts([[-170, 10], [-120, -60], [-60, -120], [-40, -110], [-96, -50], [-140, 10]], 'rgba(110,95,70,0.35)');   // sable mouillé
        for (const [x, y] of [[-20, -116], [150, -118], [330, -126], [500, -140]]) for (let j = 0; j < 6; j++) strokePts([[x + j * 3, y], [x + j * 4 - 6, y - 14 - (j % 3) * 4]], '#7e8a3a', 1.6);   // touffes d'herbe
      }, 9800, { drop: false });
    }, false);
    K.quai = flatCv(W, 220, () => {                                               // quai empierré 1840 : mur, parapet, escalier, puis berge à droite
      pc([[-540, 10, 1], [40, 10, 1], [40, -150, 1], [-540, -150, 1]], '#b9ae98', () => {
        for (let y = -140; y < 10; y += 22) for (let x = -540 + ((y / 22) % 2 ? 0 : 20); x < 40; x += 40) strokePts([[x, y], [x + 38, y], [x + 38, y + 20]], 'rgba(90,80,60,0.4)', 1);
        hatch(null, 0.8, 5, 0.12);
      }, 9810);
      pc(box(-546, -170, 46, -150), '#d2c8b2', () => strokePts([[-546, -164], [46, -164]], 'rgba(255,255,255,0.35)', 2), 9811);
      for (let i = 0; i < 5; i++) pc(box(40 + i * 18, -150 + i * 32, 140, -118 + i * 32), '#b0a58e', null, 9812 + i);
      pc([[140, 10, 1], [140, -150], [540, -170], [540, 10, 1]], '#cdbb98', () => { const R = M.rng(1841); for (let i = 0; i < 500; i++) dot(140 + R() * 400, -160 + R() * 170, 0.7 + R() * 1.4, R() < 0.5 ? 'rgba(120,100,70,0.45)' : 'rgba(255,245,225,0.5)'); for (let x = 150; x < 540; x += 44) fillPts(rrect(x, -40, x + 40, -24, 4), '#7d838e'); }, 9817, { drop: false });
    });
    K.solGreve = drawSol('greve'); K.solQuai = drawSol('quai'); K.solPave = drawSol('pave');
    return K;
  };
  GRV.QUAI = { parapet: 1225, x1: 586 };                                        // dessus du parapet (y écran) de x 0 à 586 quand le quai est en place

  // =====================================================================
  // DÉCORS COMPLETS — à appeler avant M.drawFloor ; t = temps LOCAL du plan (converti en global à l'intérieur)
  // =====================================================================
  // aujourd'hui : GRV.aujourdhui(t, { abri (true), bus (0..1 : passage du bus « hors service » au loin), pigeonAbri (0..1 : un pigeon vient se poser sur l'abri) })
  GRV.aujourdhui = function (t, o) {
    o = o || {}; const g = M.tg(t), c = cx_();
    c.drawImage(K.ciel0, 0, 0);
    M.nuages(t, { y0: 300, y1: 560, n: 4, vit: 12, seed: 21, col: '#e4e6e6', brume: 0.2 });
    M.oiseaux(g, { x0: -80, x1: 1160, y: 520, t0: 0, dur: 16, n: 4, s: 0.6, seed: 4, boucle: true, col: '#6f7480' });
    M.flat(K.hdvNeo, 540, 1130);
    const hx = (p) => 540 + p[0], hy = (p) => 1130 + p[1];
    for (const [i, p] of HDV_NEO.drapeaux.entries()) M.drapeau(hx(p), hy(p) + 2, 0.32, t, i * 1.3, 80);
    if (!SIL()) {                                                                 // aiguilles de l'horloge (sans chiffres)
      const cxh = hx(HDV_NEO.horloge), cyh = hy(HDV_NEO.horloge), a1 = g * 0.02, a2 = g * 0.25;
      strokePts([[cxh, cyh], [cxh + Math.sin(a1) * 13, cyh - Math.cos(a1) * 13]], '#2e3a4a', 2.4); strokePts([[cxh, cyh], [cxh + Math.sin(a2) * 20, cyh - Math.cos(a2) * 20]], '#2e3a4a', 1.6);
    }
    M.passants(t, { y: 1172, s: 0.24, n: 5, per: 18, x0: 120, x1: 960, brume: 0.5, seed: 31 });
    if (o.bus != null && o.bus > 0 && o.bus < 1) {                               // bus « hors service » au loin : silhouette, phares éteints, aucun texte
      const x = lerp(1200, -260, o.bus), y = 1196;
      c.save(); c.translate(x, y); c.scale(0.5, 0.5);
      fillPts(rrect(-170, -150, 170, -20, 14), '#5f8a7a'); fillPts(box(-150, -130, 150, -84), '#3c4a52'); fillPts(box(-170, -150, 170, -138), '#2f3a40');
      fillPts(box(-168, -146, -110, -132), '#262a2e');                              // girouette éteinte, sans texte
      for (const xw of [-110, 110]) { fillPts(ell(xw, -20, 24, 24, 14), '#1e1e22'); fillPts(ell(xw, -20, 10, 10, 10), '#77736b'); }
      fillPts(ell(-166, -40, 6, 5, 8), '#8a8a80');
      c.restore();
    }
    // plan intermédiaire : platanes, lampadaires, manège
    M.flat(K.platane, 150, 1330, { rot: 0.004 * Math.sin(g * 0.7), cast: { a: 0.2, dx: 14, dy: 4 } });
    M.flat(K.platane2, 960, 1320, { rot: 0.004 * Math.sin(g * 0.6 + 1), cast: { a: 0.2, dx: 14, dy: 4 } });
    M.flat(K.manege, 820, 1262, { scale: 0.85 });
    for (const [i, xm] of MANEGE.chevaux.entries()) { const y = 1262 - 0.85 * 70 + Math.sin(g * 2 + i * 1.6) * 6, x = 820 + xm * 0.85; c.save(); c.translate(x, y); c.scale(0.5 * (i % 2 ? 1 : -1), 0.5); fillPts([[-20, -6], [12, -10], [22, -26], [30, -24], [24, -8], [16, 6], [-18, 6], [-26, 14], [-30, 0]], ['#e6dcc6', '#c9a24a', '#a4512e', '#e6dcc6'][i]); c.restore(); }
    M.flat(K.lampadaire, 470, 1340, { scale: 0.9, cast: { a: 0.25, dx: 12, dy: 4 } });
    M.flat(K.lampadaire, 680, 1300, { scale: 0.75 });
    feuilles(g, 40, 330, 520, 7, 61); feuilles(g, 820, 1060, 520, 6, 62);
    // premier plan : abri (x 230), poubelle, vélo, colonne Morris
    if (o.abri !== false) M.flat(K.abri, 230, ST.back, { cast: { a: 0.3, dx: 16, dy: 6 } });
    M.flat(K.poubelle, 560, ST.back, { cast: { a: 0.3 } });
    M.flat(K.velo, 690, ST.back, { cast: { a: 0.25 } });
    M.flat(K.morris, 905, ST.back, { cast: { a: 0.3 } });
    if (o.pigeonAbri != null && o.pigeonAbri > 0) {                               // pigeon qui vient se poser sur le toit de l'abri
      const k = clamp(o.pigeonAbri), u = ease(Math.min(1, k / 0.7)), x = lerp(520, 300, u), y = lerp(760, ST.back - 556 * 1 - 2 + 230 * 0.0, u) - Math.sin(u * PI) * 60;
      oiseauPose(x, y, 1.7, -1, '#8d929c', smooth(0.6, 0.85, k));
    }
    M.oiseaux(g, { x0: 1100, x1: -100, y: 760, t0: 3, dur: 9, n: 3, s: 0.7, seed: 5, boucle: true, col: '#7d828c', brume: 0.2 });
  };
  // après M.drawFloor : pavés + pigeons qui picorent devant (o.pigeons : false pour les retirer)
  GRV.aujourdhuiSol = function (t, o) {
    o = o || {}; const g = M.tg(t);
    cx_().drawImage(K.solPave, 0, ST.back - 2);
    if (o.pigeons !== false) { pigeon(600, ST.back + 36, 1.7, g * 5, 1, -1); pigeon(668, ST.back + 32, 1.55, g * 4 + 2, 1, 1); pigeon(880, ST.back + 38, 1.6, g * 6 + 1, 1, -1); }
    feuilles(g + 3, 300, 900, ST.back - 8, 0, 63);
  };

  // la grève (XVIIIe) : GRV.greve1750(t, { facade 0..1 (0 = dans les cintres, 1 = en place ; valeurs > 1 permises pour le rebond), facadeDy (px),
  //   port 0..1 (0 = sous la trappe, 1 = en place), mouette 0..1 (se pose sur un pieu, p2), tonneau 0..1 (roule puis s'arrête, p3), poule 0..1 (traverse au fond, p4) })
  GRV.FACADE = { x: 760, y: 1262, s: 1, haut: 590 };                              // façade : M.flat(GRV.K.hdv1750, 760, 1262) une fois en place
  GRV.greve1750 = function (t, o) {
    o = o || {}; const g = M.tg(t), c = cx_();
    c.drawImage(K.fond1750, 0, 0);
    M.sun(860, 420, 58, t);
    M.nuages(t, { y0: 280, y1: 520, n: 4, vit: 10, seed: 17, col: '#f4ead8' });
    for (const [i, p] of K.chem1750.entries()) if (i % 2 === 0) M.fumee(t, { x: p[0], y: p[1], s: 0.35, n: 4, haut: 120, vent: 24, col: '#d8d2c8', a: 0.5, seed: 40 + i });
    eauVive(g, 0, W, 1080, 1230, 34, 77);
    barque(((g * 18) % 1400) - 160, 1150, 0.55, 1); barque(1240 - ((g * 11 + 600) % 1500), 1196, 0.7, -1);
    M.oiseaux(g, { x0: -80, x1: 1160, y: 560, t0: 0, dur: 14, n: 4, s: 0.7, seed: 8, boucle: true, col: '#e9e4d8', brume: 0.15 });
    // façade de l'ancien Hôtel de Ville (descend des cintres)
    const f = o.facade == null ? 1 : o.facade;
    if (f > 0) {
      const y = GRV.FACADE.y - (1 - f) * 1250 + (o.facadeDy || 0);
      if (!SIL() && f < 1.2) { c.save(); c.strokeStyle = 'rgba(30,25,20,0.55)'; c.lineWidth = 1.4; for (const dx of [-230, 230]) { c.beginPath(); c.moveTo(GRV.FACADE.x + dx, y - 560); c.lineTo(GRV.FACADE.x + dx, 0); c.stroke(); } c.restore(); }
      M.flat(K.hdv1750, GRV.FACADE.x, y, { cast: { a: 0.25, dx: 14, dy: 6 } });
    }
    // eau proche (gauche) et berge de sable (droite)
    c.fillStyle = lin(0, 1230, 0, ST.back, [[0, '#6f8a96'], [1, '#56707c']]); c.fillRect(0, 1236, 560, ST.back - 1236 + 6);
    eauVive(g + 5, 20, 520, 1250, 1390, 22, 78);
    M.flat(K.berge, 540, ST.back + 2);
    // port (monte de la trappe)
    const p = o.port == null ? 1 : o.port;
    if (p > 0) {
      const y = ST.back + (1 - p) * 780;
      M.flat(K.port1750, 540, y, { clipY: ST.back + 1, cast: { a: 0.28, dx: 14, dy: 6 } });
      if (o.mouette != null && o.mouette > 0 && p >= 1) {                           // mouette qui se pose sur le pieu du milieu
        const k = clamp(o.mouette), u = ease(Math.min(1, k / 0.7)), px = 540 + PORT.pieux[1][0], py = ST.back + PORT.pieux[1][1];
        oiseauPose(lerp(1000, px, u), lerp(620, py, u) - Math.sin(u * PI) * 50, 1.2, -1, '#ece8de', smooth(0.62, 0.9, k));
      }
      if (p >= 1) {                                                               // tonneau couché qui roule un peu puis s'arrête
        const k = o.tonneau == null ? 0 : clamp(o.tonneau), d = 70 * ease(k) - 6 * M.wob(k, 0.95, 1, 2, 6), x = 772 - d;
        c.save(); c.translate(x, ST.back - 2); c.scale(0.62, 0.62); drawTonneau({ couche: true, roule: -d / (50 * 0.62) }); c.restore();
      }
    }
    if (o.poule != null && o.poule > 0 && o.poule < 1) poule(lerp(1060, 420, o.poule), 1262 + 0 * o.poule, 1, g * 9);
  };
  GRV.PORT = PORT;
  // eau devant le bateau (à dessiner APRÈS GRV.toue, avant M.drawFloor) : petite bande de vaguelettes, x 0–560
  GRV.eauAvant = function (t) {
    const g = M.tg(t), c = cx_();
    c.save(); c.beginPath(); c.moveTo(0, ST.back + 6);
    for (let x = 0; x <= 560; x += 10) c.lineTo(x, ST.back - 26 + Math.sin(x * 0.045 - g * 2.2) * 4 + Math.sin(x * 0.11 + g * 1.3) * 2);
    c.lineTo(560, ST.back + 6); c.closePath(); c.fillStyle = 'rgba(86,112,124,0.92)'; c.fill();
    c.strokeStyle = 'rgba(235,240,235,0.45)'; c.lineWidth = 1.4; c.beginPath();
    for (let x = 0; x <= 560; x += 10) { const y = ST.back - 26 + Math.sin(x * 0.045 - g * 2.2) * 4 + Math.sin(x * 0.11 + g * 1.3) * 2; x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); c.restore();
  };
  // après M.drawFloor : tapis de grève (sable, gravier, galets), ou quai 1840, ou pavés
  GRV.sol = function (t, kind) { cx_().drawImage(kind === 'quai' ? K.solQuai : kind === 'pave' ? K.solPave : K.solGreve, 0, ST.back - 2); };

  // la même place vers 1840 : GRV.greve1840(t, { fenetre 0..1 (une fenêtre s'ouvre en face, p5), chat 0..1 (passe sur le parapet, p6) })
  GRV.greve1840 = function (t, o) {
    o = o || {}; const g = M.tg(t), c = cx_();
    c.drawImage(K.fond1840, 0, 0);
    M.nuages(t, { y0: 280, y1: 520, n: 5, vit: 12, seed: 23, col: '#e8e4dc', brume: 0.15 });
    M.fumee(t, { x: K.usine[0], y: K.usine[1], s: 0.8, n: 7, haut: 300, vent: 60, col: '#7a7470', a: 0.6, seed: 51 });
    for (const [i, p] of K.chem1840.entries()) if (i % 3 === 0) M.fumee(t, { x: p[0], y: p[1], s: 0.3, n: 3, haut: 100, vent: 20, col: '#d0cac0', a: 0.45, seed: 60 + i });
    eauVive(g, 0, W, 1080, 1230, 30, 79);
    barque(((g * 14 + 300) % 1400) - 160, 1170, 0.6, 1);
    // linge qui sèche et fenêtre qui s'ouvre (rive d'en face)
    M.voilage(t, { x: 360, y: 905, w: 46, h: 60, amp: 5, col: '#efe8da' });
    { const k = clamp(o.fenetre || 0), x = 600, y = 930; fillPts(box(x, y, x + 20, y + 34), '#3c4450'); c.save(); c.translate(x, y); c.scale(1 - 1.6 * ease(k), 1); fillPts(box(0, 0, 20, 34), '#6a7a5a'); strokePts([[0, 11], [20, 11]], 'rgba(0,0,0,0.3)', 1); strokePts([[0, 22], [20, 22]], 'rgba(0,0,0,0.3)', 1); c.restore(); if (k > 0.6) fillPts(ell(x + 10, y + 12, 5, 6, 8), '#d8b090'); }
    M.flat(K.hdv1750, GRV.FACADE.x, GRV.FACADE.y, { cast: { a: 0.25, dx: 14, dy: 6 } });
    M.flat(K.quai, 540, ST.back + 2, { cast: { a: 0.25 } });
    M.flat(K.colonne1840, 160, ST.back - 8, { cast: { a: 0.3 } });
    M.flat(K.reverbere, 470, ST.back - 160, { cast: { a: 0.25 } });
    M.flat(K.reverbere, 980, ST.back, { cast: { a: 0.25 } });
    M.flamme(t, { x: 470 + REVERB.flamme[0], y: ST.back - 160 + REVERB.flamme[1], s: 0.6, r: 60, seed: 3 });
    M.flamme(t, { x: 980 + REVERB.flamme[0], y: ST.back + REVERB.flamme[1], s: 0.6, r: 60, seed: 4 });
    M.flat(K.charrette, 840, ST.back, { cast: { a: 0.3 } });
    for (const [x, s] of [[700, 0.7], [748, 0.7]]) { c.save(); c.translate(x, ST.back); c.scale(s, s); drawTonneau({}); c.restore(); }
    if (o.chat != null && o.chat > 0 && o.chat < 1) chat(lerp(60, 600, o.chat), GRV.QUAI.parapet, 1, g * 10);
    pigeon(300, GRV.QUAI.parapet, 0.9, g * 5, 1, 1);
    M.oiseaux(g, { x0: 1120, x1: -80, y: 620, t0: 2, dur: 11, n: 3, s: 0.7, seed: 12, boucle: true, col: '#7d828c', brume: 0.2 });
  };

  // =====================================================================
  // ACCESSOIRES DE DÉCOR POSABLES À LA MAIN
  // =====================================================================
  // abri de bus (+ banc, poteau) : (x,y) = sol ; 420 × 556 à s 1 (toit à y − 546·s) ; o.cast
  GRV.abri = (x, y, s, o) => M.flat(K.abri, x, y, Object.assign({ scale: s || 1 }, o || {}));
  // coupe du sol (plan 7) : (x,y) = milieu du DESSUS des pavés ; 700 × 268 à s 1 ; o.caillou (true) {x (local, défaut 120), s (1), lid, dort (true), noirci, t}
  GRV.coupe = function (t, x, y, s, o) {
    o = o || {}; s = s || 1;
    M.flat(K.coupe, x, y + 280 * s - 10 * s, { scale: s });
    if (o.caillou !== false) { const cc = o.caillou || {}; GRV.caillou(x + (cc.x == null ? 120 : cc.x) * s, y + (COUPE.pave + 150) * s, (cc.s || 1) * s, Object.assign({ dort: true, t: M.tg(t) }, cc)); }
  };
  GRV.COUPE = COUPE;
  // la toue (bateau plat de Seine) : (x,y) = ligne de flottaison au milieu ; 520 de long à s 1 ; o.cargo = liste de 'foin'|'ble'|'tonneau'|'charbon' (4 places),
  // o.t (balancement), o.mat (true)
  function drawToue(o) {
    const t = o.t || 0, c = cx_();
    c.save(); c.translate(0, Math.sin(t * 1.6) * 3); c.rotate(Math.sin(t * 1.1) * 0.012);
    if (o.mat !== false) { pc(box(-6, -250, 6, -40), '#5a4030', () => strokePts([[-2, -246], [-2, -44]], 'rgba(255,220,170,0.3)', 1.2), 9901); strokePts([[0, -240], [-200, -60]], '#8a7a5a', 1.2); strokePts([[0, -240], [220, -70]], '#8a7a5a', 1.2); strokePts([[-70, -232], [40, -232]], '#5a4030', 4); pc([[-66, -236], [36, -236], [30, -220], [-60, -220]], '#d8cbb0', () => { for (const x of [-40, -10, 18]) strokePts([[x, -236], [x + 2, -220]], 'rgba(90,70,40,0.5)', 1.2); }, 9902); }
    const SL = [-190, -95, 95, 190], cg = o.cargo || [];
    for (let i = 0; i < Math.min(4, cg.length); i++) if (cg[i] && OBJ[cg[i]]) { c.save(); c.translate(SL[i], -36); c.scale(0.85, 0.85); OBJ[cg[i]].draw({ t }); c.restore(); }
    pc([[-262, -70, 1], [-240, -56], [200, -56], [262, -88, 1], [250, -40], [226, 20], [-236, 20], [-260, -10]], '#7A5A3A', () => {
      for (const y of [-40, -22, -4, 12]) strokePts([[-258, y], [240, y - 2]], 'rgba(40,25,10,0.45)', 1.2);
      fillPts([[-262, -70], [-240, -56], [200, -56], [262, -88], [258, -76], [200, -46], [-240, -46], [-262, -60]], '#5e4430');
      for (let x = -220; x < 220; x += 60) dot(x, -51, 2, '#3a2a1a');
      hatch(null, 0.15, 4.5, 0.2); shade(0, -60, 0, 20, 0.35, [-270, -90, 270, 25]);
    }, 9903);
    c.restore();
  }
  OBJ.toue = { draw: drawToue, grip: [0, 0], pts: { proue: [262, -88], poupe: [-262, -70], pont: [0, -56] }, base: [0, 0] };
  GRV.toue = (x, y, s, o) => accRaw('toue', (oo) => drawToue(oo), x, y, s == null ? 1 : s, Object.assign({ slot: y + 40 }, o || {}));
  GRV.TOUE = { long: 520, places: [-190, -95, 95, 190], pont: -36 };
})();
