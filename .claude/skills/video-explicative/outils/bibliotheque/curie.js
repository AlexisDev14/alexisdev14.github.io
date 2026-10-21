// persos.js — « Marie Curie, les carnets qui brillent encore » (1898 → 1934) : marionnettes, accessoires et décor du hangar PROPRES À CETTE VIDÉO.
// Espace M.cur (alias CUR). Mode d'emploi : persos.md (ne pas lire ce fichier en entier). CUR.init() dans S.init (pré-rendus du hangar).
// Aucun texte, lettre, chiffre ni logo. Déterministe (hash, aucun Math.random) : tout est fonction pure de t (ambiances en M.tg(t)).
// MARIONNETTES (avec tige ; (x,y) = pieds ; slot: ST.slotF/slotB) — toujours par l'enveloppe :
//   CUR.marie(pose,x,y,s,o)  (C.curMarie, s 0,9)  gestes ecrire, tenir, remuer, admirer, refus, salut, serre, parapluie, assise, marche ; humeur
//   CUR.pierre(pose,x,y,s,o) (C.curPierre, s 0,9) gestes tenir, porter(+haut), verser, bandage(+bande, tube), montrerBras, tendre, brulure, fier, epaules, marche
// ACCESSOIRES : CUR.fiole, CUR.cahier, CUR.boite, CUR.bloc, CUR.sac, CUR.tas, CUR.barre, CUR.plume, CUR.rouleau (x,y,s,o) ; points : CUR.pt(r,nom,arriere), CUR.accPt(r,objet,nom)
// DÉCOR : CUR.hangar(t, up, o) puis M.drawFloor() puis CUR.hangarSol(t, up, o) ; repères CUR.H
(function () {
  'use strict';
  const X = M.X, P = M.P, TAU = M.TAU, PI = Math.PI, D = 180 / PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, hash, smooth } = M;
  const CUR = (M.cur = {});
  const CH = M.chars;
  const cx_ = () => M.ctx();
  const SIL = () => M._sil();
  const OFFP = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];
  const LUEUR = '159,232,208';                                  // bleu-vert du radium (#9fe8d0)

  // ------------------------------------------------------------ géométrie
  function ep(cx, cy, rx, ry, n, a0, a1) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; }
  function ell(cx, cy, rx, ry, n) { const o = ep(cx, cy, rx, ry, n || 16, 0, TAU); o.pop(); return o; }
  const tr = (pts, dx, dy) => pts.map((p) => (p[2] ? [p[0] + dx, p[1] + dy, 1] : [p[0] + dx, p[1] + dy]));
  const scl = (pts, sx, sy) => { sy = sy == null ? sx : sy; return pts.map((p) => (p[2] ? [p[0] * sx, p[1] * sy, 1] : [p[0] * sx, p[1] * sy])); };
  const mp = (m, p) => [m.a * p[0] + m.c * p[1] + m.e, m.b * p[0] + m.d * p[1] + m.f];
  const rotP = (p, a) => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];
  function ribbon(line, w0, w1) {
    const L = [], R = [];
    for (let i = 0; i < line.length; i++) {
      const a = line[Math.max(0, i - 1)], b = line[Math.min(line.length - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      const w = lerp(w0, w1 == null ? w0 : w1, i / (line.length - 1)) / 2;
      L.push([line[i][0] - dy * w, line[i][1] + dx * w]); R.push([line[i][0] + dy * w, line[i][1] - dx * w]);
    }
    return L.concat(R.reverse());
  }
  function qbez(p0, p1, p2, n) { const o = []; n = n || 12; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]); } return o; }
  const normA = (a) => { while (a > PI) a -= TAU; while (a < -PI) a += TAU; return a; };
  function rrect(x0, y0, x1, y1, r) {
    return ep(x1 - r, y0 + r, r, r, 4, -PI / 2, 0).concat(ep(x1 - r, y1 - r, r, r, 4, 0, PI / 2), ep(x0 + r, y1 - r, r, r, 4, PI / 2, PI), ep(x0 + r, y0 + r, r, r, 4, PI, PI * 1.5));
  }
  const pc = (pts, base, paint, seed, o) => piece(pts, base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));
  const box = (x0, y0, x1, y1) => [[x0, y0, 1], [x1, y0, 1], [x1, y1, 1], [x0, y1, 1]];
  function blob(cx, cy, rx, ry, seed, n) { n = n || 13; const o = []; for (let i = 0; i < n; i++) { const a = i / n * TAU, k = 0.8 + 0.28 * hash(seed + i * 1.7); o.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); } return o; }
  // halo lumineux additif (dessin brut : jamais pendant la passe silhouette)
  function glow(x, y, r, col, a) {
    if (a <= 0.003 || SIL()) return;
    const c = cx_(), gr = c.createRadialGradient(x, y, 1, x, y, r);
    gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(0.35, `rgba(${col},${a * 0.45})`); gr.addColorStop(1, `rgba(${col},0)`);
    c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = gr; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.restore();
  }
  CUR.geo = { ep, ell, ribbon, qbez, rrect, tr, scl, mp, blob, glow };

  // =====================================================================
  // OBJETS — chacun dessiné dans son repère (y vers le bas), seul (accessoire) ou tenu (pièce 'objet' de l'avant-bras)
  // =====================================================================
  // ---------------- fiole de radium : origine = fond (posée) ; k = taille (1 ≈ 78 local, 70 px à s 0,9)
  function drawFiole(o) {
    const k = o.taille == null ? 1 : o.taille, lu = clamp(o.lueur || 0), g = M.tg(o.t || 0);
    const pul = 0.82 + 0.18 * Math.sin(g * 2.1 + (o.ph || 0));
    const body = [[-15, -6], [-15, -46], [-12, -52], [-6, -56], [-6, -64], [6, -64], [6, -56], [12, -52], [15, -46], [15, -6], [10, 0, 1], [-10, 0, 1]];
    const S = (pts) => scl(pts, k);
    pc(S(body), 'rgba(205,228,236,0.62)', () => {
      const lev = -20;                                                   // poudre / liquide au fond
      fillPts(S([[-16, lev], [16, lev - 2], [16, 2], [-16, 2]]), lu > 0 ? M.mixc('#6f8f86', '#c9fbe9', lu * pul) : '#6f8f86');
      if (lu > 0 && !SIL()) fillPts(S([[-16, lev], [16, lev - 2], [16, lev + 5], [-16, lev + 7]]), `rgba(230,255,245,${0.6 * lu})`);
      strokePts(S([[-10, -44], [-10, -14]]), 'rgba(255,255,255,0.75)', 1.6);  // reflet
      strokePts(S([[9, -40], [9, -30]]), 'rgba(255,255,255,0.4)', 1.2);
    }, 5101, { texA: 0.15 });
    pc(S([[-8, -62], [8, -62], [7, -76], [-7, -76]]), '#a87c4e', () => { hatch(null, 0.4, 3, 0.25); strokePts(S([[-6, -72], [6, -72]]), 'rgba(60,35,15,0.4)', 1); }, 5102);   // bouchon de liège
  }
  function glowFiole(o, gx, gy) {
    const k = o.taille == null ? 1 : o.taille, lu = clamp(o.lueur || 0), g = M.tg(o.t || 0);
    if (lu <= 0) return;
    const pul = 0.85 + 0.15 * Math.sin(g * 2.1 + (o.ph || 0));
    const cy = (gy || 0) - 20 * k, cx = gx || 0;
    glow(cx, cy, lerp(60, 90, pul) * Math.max(0.8, k * 0.75), LUEUR, 0.42 * lu);
    glow(cx, cy, 26 * k, '220,255,240', 0.5 * lu * pul);
  }
  // ---------------- cahier de laboratoire : origine = bas du dos (reliure) ; fermé : couverture x 0..W ; ouvert : pages x −W..W, de face
  const CW = 78, CHh = 104;
  function pageCourbes(x0, x1, seed) {
    // colonnes de traits ondulés + petites courbes (aucune lettre ni chiffre)
    const w = x1 - x0, R = M.rng(seed), sg = Math.sign(w) || 1, aw = Math.abs(w);
    if (aw < 6) return;
    const xa = Math.min(x0, x1) + 7, xb = Math.max(x0, x1) - 7;
    for (let i = 0; i < 6; i++) {
      const y = -CHh + 16 + i * 9; if (i === 3) continue;
      const pts = []; for (let j = 0; j <= 8; j++) { const u = j / 8; pts.push([lerp(xa, lerp(xa, xb, 0.55 + 0.4 * R()), u), y + 1.4 * Math.sin(u * 14 + i)]); }
      strokePts(pts, 'rgba(40,40,60,0.6)', 0.9);
    }
    // petit graphique : axes + courbe en cloche, ou décroissance
    const gx0 = xa + 2, gy0 = -14, gw = (xb - xa) * 0.8, gh = 30;
    strokePts([[gx0, gy0 - gh], [gx0, gy0], [gx0 + gw, gy0]], 'rgba(40,40,60,0.6)', 0.9);
    const cur = []; for (let j = 0; j <= 12; j++) { const u = j / 12; cur.push([gx0 + u * gw, gy0 - gh * (seed % 2 ? Math.exp(-3 * u) : Math.exp(-Math.pow((u - 0.45) / 0.2, 2)))]); }
    strokePts(cur, 'rgba(120,40,40,0.75)', 1.1);
    void sg;
  }
  function drawCahier(o) {
    if (o.plat) {                                                         // vu par la tranche (tenu à plat au-dessus de la tête)
      pc([[-56, -16, 1], [56, -16, 1], [56, 0, 1], [-56, 0, 1]], '#1e1d22', () => {
        fillPts([[-50, -11, 1], [52, -11, 1], [52, -4, 1], [-50, -4, 1]], '#e9e2cf');
        for (let x = -46; x < 50; x += 6) strokePts([[x, -11], [x, -4]], 'rgba(120,110,90,0.4)', 0.6);
        fillPts(box(-56, -16, -46, 0), '#b08a48'); fillPts(box(46, -16, 56, 0), '#b08a48');
      }, 5201);
      return;
    }
    const u = clamp(o.ouvert || 0), cw = CW * Math.cos(PI * u);
    // dos et couverture arrière (toile noire)
    if (u > 0.02) {
      const L = -CW * smooth(0.5, 1, u) - 4 * smooth(0.45, 0.55, u);
      pc([[L, -CHh - 4, 1], [CW + 4, -CHh - 4, 1], [CW + 4, 2, 1], [L, 2, 1]], '#1e1d22', () => {
        for (const [cx, cy] of [[CW + 4, -CHh - 4], [CW + 4, 2], [L, -CHh - 4], [L, 2]]) fillPts([[cx - 12 * Math.sign(cx || 1), cy], [cx, cy], [cx, cy + 12 * (cy < -50 ? 1 : -1)]], '#b08a48');
      }, 5202);
    }
    // page de droite (sous la couverture)
    if (u > 0.02) pc([[0, -CHh, 1], [CW, -CHh, 1], [CW, -1, 1], [0, -1, 1]], '#e9e2cf', () => { pageCourbes(0, CW, 7); shade(0, 0, 18, 0, 0.18, [0, -CHh, 20, 0]); }, 5203, { drop: false });
    // page de gauche (déjà tournée) puis couverture qui tourne autour du dos
    if (u > 0.5) pc([[cw, -CHh, 1], [0, -CHh, 1], [0, -1, 1], [cw, -1, 1]], '#e9e2cf', () => { pageCourbes(cw, 0, 8); shade(0, 0, -18, 0, 0.18, [-CW, -CHh, 0, 0]); }, 5204, { drop: false });
    if (u < 0.5) pc([[0, -CHh - 3, 1], [cw + 3, -CHh - 3, 1], [cw + 3, 2, 1], [0, 2, 1]], '#232227', () => {
      hatch(null, 0.9, 3, 0.18, 1, '120,120,140');
      fillPts([[cw + 3, -CHh - 3], [cw + 3 - 14 * Math.cos(PI * u), -CHh - 3], [cw + 3, -CHh + 11]], '#b08a48');       // coins ocre
      fillPts([[cw + 3, 2], [cw + 3 - 14 * Math.cos(PI * u), 2], [cw + 3, -12]], '#b08a48');
      fillPts(box(0, -CHh - 3, 9 * Math.cos(PI * u), 2), '#b08a48');                                                  // dos de toile ocre
      strokePts([[cw * 0.2, -CHh * 0.62], [cw * 0.8, -CHh * 0.62]], 'rgba(200,190,160,0.25)', 1);                    // étiquette vierge
      strokePts([[cw * 0.2, -CHh * 0.5], [cw * 0.8, -CHh * 0.5]], 'rgba(200,190,160,0.25)', 1);
    }, 5205);
    if (u > 0.5) strokePts([[0, -CHh], [0, -1]], 'rgba(60,50,40,0.6)', 1.4);
  }
  function glowCahier(o, gx, gy) {
    const ra = clamp(o.rayons || 0); if (ra <= 0 || SIL() || o.plat) return;
    const g = M.tg(o.t || 0), c = cx_(), u = clamp(o.ouvert == null ? 1 : o.ouvert);
    const ox = gx || 0, oy = (gy || 0) - CHh * 0.55;
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    for (let i = 0; i < 7; i++) {
      const a = -PI / 2 + (i - 3) * 0.26 + 0.05 * Math.sin(g * 1.3 + i), L = (40 + 50 * hash(i * 3.1 + 2)) * ra * (0.6 + 0.4 * u);
      const pts = []; for (let j = 0; j <= 10; j++) { const s = j / 10, w = 4 * Math.sin(s * 9 - g * 4 + i * 1.7) * s; pts.push([ox + Math.cos(a) * (CHh * 0.42 + L * s) - Math.sin(a) * w, oy + Math.sin(a) * (CHh * 0.42 + L * s) + Math.cos(a) * w]); }
      c.beginPath(); pts.forEach((p, k) => (k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
      c.strokeStyle = `rgba(${LUEUR},${0.28 * ra})`; c.lineWidth = 5; c.stroke();
      c.strokeStyle = `rgba(200,255,220,${0.7 * ra})`; c.lineWidth = 1.6; c.stroke();
    }
    c.restore();
    glow(ox, oy, 70, LUEUR, 0.22 * ra);
  }
  // ---------------- boîte en plomb : origine = milieu du bord inférieur ; 220 × 150 à s 1 ; couvercle à charnière (gauche) ; poignées latérales
  const BW = 110, BH = 120, BL = 30;
  const PLOMB = '#6e7378', PLOMBD = '#575c62', PLOMBL = '#8a9096', DOUBLURE = '#7a3a2e';
  function drawBoite(o) {
    const k = ease(clamp(o.ouvert || 0)), th = -1.75 * k;
    // poignées latérales (anneaux de fer)
    for (const sx of [-1, 1]) {
      const ring = ep(sx * (BW + 2), -70, 14, 16, 10, -PI / 2, PI / 2).map((p) => [sx * (p[0] - sx * (BW + 2)) + sx * (BW + 2), p[1]]);
      strokePts(ring, '#2e3236', 5); strokePts(ring, '#9aa2aa', 2);
      fillPts(box(sx > 0 ? BW - 2 : -BW - 6, -84, sx > 0 ? BW + 6 : -BW + 2, -56), PLOMBD);
    }
    // ouverture : doublure visible
    if (k > 0.02) pc(box(-BW + 6, -BH - 6, BW - 6, -BH + 10), DOUBLURE, () => { fillPts(box(-BW + 6, -BH + 2, BW - 6, -BH + 10), 'rgba(30,10,8,0.45)'); hatch(null, 0.3, 3, 0.2); }, 5301, { drop: false });
    pc(box(-BW, -BH, BW, 0), PLOMB, () => {
      for (let i = 0; i < 6; i++) strokePts([[-BW + 10 + i * 38, -BH + 8], [-BW + 30 + i * 38, -8]], 'rgba(180,200,230,0.16)', 6);   // reflets bleutés
      strokePts([[-BW + 4, -BH + 4], [BW - 4, -BH + 4]], 'rgba(220,230,245,0.45)', 1.6);
      for (const x of [-BW + 8, BW - 8]) for (let y = -BH + 12; y < -4; y += 22) dot(x, y, 2.6, '#4a4f55');      // rivets
      for (let x = -BW + 30; x < BW - 20; x += 30) { dot(x, -8, 2.4, '#4a4f55'); }
      fillPts(box(-BW, -16, BW, -12), PLOMBD);
      hatch(null, 0.15, 4, 0.14, 1, '30,34,40'); shade(-BW, 0, BW, 0, 0.25, [-BW, -BH, BW, 0], '20,24,30');
    }, 5302);
    // couvercle : pivote autour de la charnière arrière gauche ; dessous doublé quand il est levé
    const c = cx_(); c.save(); c.translate(-BW - 4, -BH); c.rotate(th);
    pc(box(0, -BL, 2 * BW + 8, 2), PLOMBL, () => {
      const lin = smooth(0.35, 0.75, k);
      if (lin > 0) fillPts(box(6, -BL + 6, 2 * BW + 2, -2), `rgba(122,58,46,${lin})`);
      strokePts([[4, -BL + 4], [2 * BW + 4, -BL + 4]], 'rgba(230,240,250,0.5)', 1.6);
      for (let x = 10; x < 2 * BW + 4; x += 24) dot(x, -BL + 12, 2.3, '#50555b');
      hatch(null, 0.15, 4, 0.14, 1, '30,34,40');
    }, 5303);
    c.restore();
    if (k < 0.15) { fillPts(box(-14, -BH - 10, 14, -BH + 8), '#4a4f55'); dot(0, -BH - 1, 3, '#9aa2aa'); }         // moraillon (fermé)
  }
  // ---------------- minerai : bloc de pechblende (origine = dessous, milieu)
  const BLOC = [[-44, -4], [-46, -26], [-34, -50], [-12, -62], [14, -60], [36, -48], [46, -24], [42, -2], [22, 2, 1], [-20, 2, 1]];
  function drawBloc() {
    pc(BLOC, '#24221f', () => {
      fillPts([[-34, -50], [-12, -62], [14, -60], [4, -40], [-18, -36]], '#34312c');
      fillPts([[14, -60], [36, -48], [46, -24], [22, -30], [4, -40]], '#2c2a26');
      for (const [x, y, r] of [[-20, -20, 5], [12, -14, 4], [28, -34, 3.5], [-6, -44, 3], [34, -14, 3]]) { fillPts(ell(x, y, r * 1.4, r, 7), '#5a5a3a'); dot(x - 1, y - 1, r * 0.5, 'rgba(200,210,150,0.35)'); }
      strokePts([[-18, -36], [4, -40], [22, -30]], 'rgba(255,255,255,0.18)', 1.2);
      hatch(null, 0.7, 3.4, 0.2, 1, '0,0,0');
    }, 5401);
  }
  // ---------------- sac de jute ficelé (origine = fond, milieu) ; 92 × 124 local
  const SAC = [[-38, -2], [-44, -40], [-40, -84], [-26, -104], [-12, -112], [-8, -118], [-14, -128], [0, -124], [14, -128], [8, -118], [12, -112], [26, -104], [40, -84], [44, -40], [38, -2], [18, 2, 1], [-18, 2, 1]];
  function drawSac(o) {
    const tint = o.tint || 0;
    pc(SAC, M.mixc('#b59a6a', '#a48a5c', tint), () => {
      for (let y = -100; y < 0; y += 5) strokePts([[-44, y], [44, y + 2]], 'rgba(90,70,40,0.22)', 0.8);
      for (let x = -40; x < 44; x += 5) strokePts([[x, -110], [x + 2, 0]], 'rgba(90,70,40,0.16)', 0.8);
      strokePts([[-30, -90], [-20, -60], [-26, -20]], 'rgba(90,70,40,0.4)', 1.4);
      strokePts([[24, -80], [30, -40]], 'rgba(90,70,40,0.35)', 1.2);
      dot(10, -30, 6, 'rgba(36,34,31,0.35)');                                   // poussière noire du minerai
      shade(-44, 0, 44, 0, 0.3, [-50, -130, 50, 4]);
    }, 5501 + Math.round(tint * 7));
    fillPts([[-12, -113], [12, -113], [11, -106], [-11, -106]], '#6e5432');           // ficelle
    strokePts([[0, -110], [-6, -96], [-3, -86]], '#6e5432', 1.6);
  }
  // ---------------- barre de fer (origine = prise de la main avant ; bout bas en [0, 230])
  function drawBarre() {
    pc([[-4, -72, 1], [4, -72, 1], [4, 232, 1], [-4, 232, 1]], '#3a3a3e', () => { strokePts([[-1.5, -70], [-1.5, 228]], 'rgba(220,220,230,0.45)', 1.2); }, 5601);
    pc([[-7, -78, 1], [7, -78, 1], [7, -70, 1], [-7, -70, 1]], '#2a2a2e', null, 5602);
  }
  // ---------------- plume d'oie (origine = prise ; bec en [9, 30])
  function drawPlume() {
    pc([[8, 28], [11, 31], [6, 22], [-12, -44], [-26, -72], [-22, -50], [-14, -30], [-2, 0], [2, 10]], '#ece6d6', () => {
      strokePts([[9, 30], [-20, -66]], 'rgba(120,110,90,0.7)', 1.1);
      for (let i = 1; i < 7; i++) strokePts([[-6 - i * 2.4, -14 - i * 7], [-14 - i * 2.4, -10 - i * 7]], 'rgba(150,140,120,0.45)', 0.8);
    }, 5701);
    fillPts([[6, 24], [11, 31], [8, 24]], '#1a1a20');
  }
  // ---------------- rouleau de bande (origine = centre)
  function drawRouleau() { pc(ell(0, 0, 11, 9, 12), '#ece6d6', () => { strokePts(ep(0, 0, 6, 5, 10, 0, TAU), 'rgba(140,130,110,0.6)', 1); dot(0, 0, 2.4, '#b7ad98'); }, 5801); }

  // =====================================================================
  // REGISTRE : grip = point tenu dans le poing ; p2 = seconde prise (deuxMains) ; pts = points nommés ; base = origine de l'accessoire seul
  // =====================================================================
  const OBJ = {
    fiole: { draw: drawFiole, glow: glowFiole, grip: (o) => [0, -18 * (o.taille == null ? 1 : o.taille)], pts: { bouchon: [0, -76], centre: [0, -30], fond: [0, 0] }, kpts: true, base: [0, 0] },
    cahier: { draw: drawCahier, glow: glowCahier, grip: (o) => (o.plat ? [50, -3] : [CW - 4, -CHh * 0.5]), p2: (o) => (o.plat ? [-50, -3] : [clamp(o.ouvert || 0) > 0.5 ? -CW + 4 : 6, -CHh * 0.5]),
      pts: { dos: [0, -CHh / 2], page: [CW / 2, -CHh / 2], haut: [0, -CHh], bas: [0, 0] }, base: [0, 0] },
    bloc: { draw: drawBloc, grip: [24, -4], p2: () => [-24, -4], pts: { haut: [0, -60], centre: [0, -30] }, base: [0, 0] },
    sac: { draw: drawSac, grip: [0, -112], p2: () => [-30, -14], pts: { col: [0, -124], fond: [0, 0], centre: [0, -56] }, base: [0, 0] },
    barre: { draw: drawBarre, grip: [0, 0], p2: () => [0, -58], pts: { bout: [0, 230], haut: [0, -76] }, base: [0, 230] },
    plume: { draw: drawPlume, grip: [0, 0], pts: { bec: [10, 31], barbe: [-24, -70] }, base: [10, 31] },
    rouleau: { draw: drawRouleau, grip: [0, 0], pts: { centre: [0, 0] }, base: [0, 9] },
    boite: { draw: drawBoite, grip: [BW, -70], pts: { couvercle: (o) => { const th = -1.75 * ease(clamp(o.ouvert || 0)), p = rotP([2 * BW - 4, -BL / 2], th); return [-BW - 4 + p[0], -BH + p[1]]; }, dessus: [0, -BH - BL], interieur: [0, -BH + 4], poigneeG: [-BW - 16, -70], poigneeD: [BW + 16, -70], fond: [0, 0] }, base: [0, 0] },
  };
  CUR.OBJ = OBJ;
  const gripOf = (ob, o) => (typeof ob.grip === 'function' ? ob.grip(o) : ob.grip);
  const has = (v) => v && v !== 'rien';
  function heldOpts(name, o, p) { return Object.assign({ t: p.t || 0 }, o || {}); }
  function heldDraw(name, o, p) {
    const ob = OBJ[name]; if (!ob) return;
    const oo = heldOpts(name, o, p), g = gripOf(ob, oo), c = cx_();
    c.save(); c.translate(-g[0], -g[1]); ob.draw(oo); c.restore();
  }
  function heldGlow(name, o, p) {
    const ob = OBJ[name]; if (!ob || !ob.glow) return;
    const oo = heldOpts(name, o, p), g = gripOf(ob, oo); ob.glow(oo, -g[0], -g[1]);
  }
  const DOIGTS = [[-13, -9], [9, -11], [12, -4], [12, 6], [6, 11], [-6, 11], [-13, 4]];
  const DOIGTS_FIN = [[-17, -8], [14, -9], [17, -2], [16, 6], [8, 10], [-8, 10], [-17, 3]];
  const doigtsPaint = () => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(70,40,30,0.5)', 1); hatch(null, 0.9, 3.4, 0.15); };
  const PINCE = [[-8, -8], [6, -9], [9, -2], [6, 4], [-6, 6], [-9, 0]];
  function heldParts(skin, seed) {
    const fing = (n) => (n === 'plume' ? PINCE : n === 'fiole' ? DOIGTS_FIN : DOIGTS);
    return {
      objet: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (has(p.tenu)) heldDraw(p.tenu, p.tenuO, p); } },
      doigts: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 2, pts: (p) => (has(p.tenu) ? fing(p.tenu) : OFFP), paint: doigtsPaint },
      objetB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 3, pts: OFFP, extra: (p) => { if (has(p.tenuB) && !p._devB) heldDraw(p.tenuB, p.tenuBO, p); } },
      objetB2: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 5, pts: OFFP, extra: (p) => { if (has(p.tenuB) && p._devB) heldDraw(p.tenuB, p.tenuBO, p); } },
      doigtsB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 4, pts: (p) => (has(p.tenuB) || p._deux ? fing(p.tenuB) : OFFP), paint: doigtsPaint },
      lueurF: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 6, pts: OFFP, extra: (p) => { if (has(p.tenu)) heldGlow(p.tenu, p.tenuO, p); } },
      lueurB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 7, pts: OFFP, extra: (p) => { if (has(p.tenuB)) heldGlow(p.tenuB, p.tenuBO, p); } },
    };
  }
  // point nommé de l'objet tenu, en coordonnées écran (r renvoyé par CUR.marie / CUR.pierre)
  CUR.pt = function (r, nom, arriere) {
    const name = arriere ? r.tenuB : r.tenu, ob = OBJ[name]; if (!ob || !ob.pts[nom]) return null;
    const oo = arriere ? r.tenuBO : r.tenuO, g = gripOf(ob, oo), q0 = ob.pts[nom], q = typeof q0 === 'function' ? q0(oo) : q0, k = ob.kpts ? (oo.taille == null ? 1 : oo.taille) : 1;
    return r.w(arriere ? 'objetB' : 'objet', q[0] * k - g[0], q[1] * k - g[1]);
  };

  // =====================================================================
  // BRAS À ARTICULATIONS RONDES (rivet au centre de chaque arrondi) + IK dans le repère du torse
  // =====================================================================
  const R_COUDE = 11.5, LB = Math.hypot(4, 96), PHI = Math.atan2(-4, 96);
  function armR(len, wt, wTop) { wt = wt || 15; const wT = wTop || wt; return ep(0, 0, wT, wT, 10, PI, TAU).concat([[wT - 1, 22], [wt - 1, 44], [R_COUDE + 0.5, len - 6]], ep(0, len, R_COUDE, R_COUDE, 10, 0, PI), [[-R_COUDE - 0.5, len - 6], [-wt + 1, 44], [-wT + 1, 22]]); }
  const H_BAS = [[-8, 78], [8, 78], [9, 90], [9, 105], [5, 117], [-2, 119], [-8, 114], [-10, 104], [-10, 94], [-15, 99], [-18, 95], [-12, 86]];
  function handShape(k) { return k === 'fist' ? X.HAND_FIST : k === 'bas' ? H_BAS : X.HAND_OPEN; }
  function foreR(kind) {
    const h = handShape(kind);
    return ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU).concat([[10, 40], [9, 76]], h.slice(2, -1).map((p) => [p[0] * 1.05, p[1]]), [[-9, 86], [-10, 76], [-11, 40]]);
  }
  function handPaintK(kind) {
    if (kind === 'fist') { strokePts([[0, 92], [12, 92]], 'rgba(60,30,20,0.5)', 1); strokePts([[-2, 99], [10, 99]], 'rgba(60,30,20,0.5)', 1); return; }
    if (kind === 'bas') { strokePts([[-1, 100], [-3, 113]], 'rgba(70,35,20,0.45)', 1); strokePts([[3, 100], [3, 112]], 'rgba(70,35,20,0.45)', 1); return; }
    X.handPaint(null, 'open');
    if (kind === 'paume') fillPts([[2, 88], [9, 92], [8, 108], [2, 112]], 'rgba(255,225,200,0.25)');
  }
  // IK deux segments (repère du torse) ; pick 'bas' (coude le plus bas), 'avant' (coude devant) ; le coude ne plie que vers l'avant
  function ik2(S, T, pick, LA, retry) {
    const vx = T[0] - S[0], vy = T[1] - S[1];
    const d = clamp(Math.hypot(vx, vy), Math.abs(LA - LB) + 1, LA + LB - 0.5), tv = Math.atan2(-vx, vy);
    const a1 = Math.acos(clamp((LA * LA + d * d - LB * LB) / (2 * LA * d), -1, 1));
    let best = null;
    for (const sg of [1, -1]) {
      const a = tv + sg * a1, E = [S[0] - LA * Math.sin(a), S[1] + LA * Math.cos(a)];
      const cAbs = Math.atan2(-(T[0] - E[0]), T[1] - E[1]) - PHI;
      const b = normA(cAbs - a);
      const sc = (b > 0.05 ? -1e6 : 0) + (pick === 'avant' ? E[0] : pick === 'arriere' ? -E[0] : E[1]);
      if (!best || sc > best.sc) best = { a: normA(a), b, sc };
    }
    if (best.sc < -1e5) return retry ? { a: tv, b: 0, sc: 0 } : ik2(S, [Math.max(T[0], S[0] + 12), T[1]], pick, LA, true);
    return best;
  }
  CUR.ik2 = ik2;
  function prep(p) { p = p || {}; return Object.assign({}, p, { ang: Object.assign({}, p.ang), hide: Object.assign({}, p.hide), face: Object.assign({}, p.face) }); }
  function headPt(q, KT, hx, hy) { return mp(new DOMMatrix().translate(KT.neck[0], KT.neck[1]).rotate((q.ang.head || 0) * D), [hx, hy]); }
  function armTo(q, KT, arm, T, pick, k) {
    if (k <= 0) return;
    const sol = ik2(arm === 'armF' ? KT.shF : KT.shB, T, pick, KT.LA), A = q.ang;
    const a0 = A[arm + '_up'] || 0, b0 = A[arm + '_lo'] || 0;
    A[arm + '_up'] = a0 + normA(sol.a - a0) * k; A[arm + '_lo'] = b0 + normA(sol.b - b0) * k;
  }
  // position (repère du torse) d'un point local de l'avant-bras, d'après les angles courants
  function forePt(q, KT, arm, lx, ly) {
    const A = q.ang, S = arm === 'armF' ? KT.shF : KT.shB;
    return mp(new DOMMatrix().translate(S[0], S[1]).rotate((A[arm + '_up'] || 0) * D).translate(0, KT.LA).rotate((A[arm + '_lo'] || 0) * D), [lx, ly]);
  }
  const blend = (q, n, v, k) => { q.ang[n] = lerp(q.ang[n] || 0, v, k); };
  function plier(q, th) {                                   // plie le buste aux hanches (th > 0 = vers l'avant), jambes droites
    if (!th) return;
    q.tilt = (q.tilt || 0) + th; q.dx = (q.dx || 0) - 238 * Math.sin(th); q.dy = (q.dy || 0) + 238 * (1 - Math.cos(th));
    q.ang.legF = (q.ang.legF || 0) - th; q.ang.legB = (q.ang.legB || 0) - th;
  }
  function marcher(q, cad, amp, bob, libres) {
    const m = q.marche === true ? 1 : clamp(q.marche || 0); if (m <= 0) return;
    const ph = (q.t || 0) * PI * cad, s = Math.sin(ph), A = q.ang;
    A.legF = (A.legF || 0) - amp * s * m; A.legB = (A.legB || 0) + amp * s * m;
    q.dy = (q.dy || 0) - Math.abs(Math.cos(ph)) * bob * m;
    if (libres.F) A.armF_up = (A.armF_up || 0) + 0.12 * s * m;
    if (libres.B) A.armB_up = (A.armB_up || 0) - 0.12 * s * m;
  }
  // objet droit à l'écran, seconde main sur la seconde prise
  function finish(q, KT) {
    const A = q.ang, tl = q.tilt || 0;
    if (has(q.tenu) && !(q.handF && q.handF !== 'fist')) q.handF = 'fist';
    if (has(q.tenuB) && !(q.handB && q.handB !== 'fist')) q.handB = 'fist';
    if (q.droit == null && has(q.tenu)) q.droit = true;
    if (q.droitB == null && has(q.tenuB)) q.droitB = true;
    if (q.droit) A.objet = (A.objet || 0) - ((A.armF_up || 0) + (A.armF_lo || 0) + tl);
    if (q.droitB) A.objetB = (A.objetB || 0) - ((A.armB_up || 0) + (A.armB_lo || 0) + tl);
    A.objetB2 = A.objetB; A.lueurF = A.objet; A.lueurB = A.objetB;
    q._deux = !!q._deuxL; q._devB = !!q.devantB;
    if (q.deuxMains && has(q.tenu) && OBJ[q.tenu] && OBJ[q.tenu].p2 && !has(q.tenuB)) {
      const ob = OBJ[q.tenu], oo = heldOpts(q.tenu, q.tenuO, q), g = gripOf(ob, oo);
      const Hf = new DOMMatrix().translate(KT.shF[0], KT.shF[1]).rotate((A.armF_up || 0) * D).translate(0, KT.LA).rotate((A.armF_lo || 0) * D).translate(4, 96).rotate((A.objet || 0) * D).translate(-g[0], -g[1]);
      const sol = ik2(KT.shB, mp(Hf, ob.p2(oo)), q.pickB || 'bas', KT.LA);
      const kk = q.deuxMains === true ? 1 : clamp(q.deuxMains);
      A.armB_up = lerp(A.armB_up || 0, sol.a, kk); A.armB_lo = lerp(A.armB_lo || 0, sol.b, kk); q.handB = 'fist'; q._deux = kk > 0.6;
    }
    return q;
  }
  // la main avant amène le point de prise sur T (repère du torse), objet à l'angle th (repère du corps)
  function tenirA(q, KT, T, th, pick, k) {
    armTo(q, KT, 'armF', T, pick || 'bas', k == null ? 1 : k); q.droit = true; q.ang.objet = th || 0;
  }
  function run(def, q, x, y, s, o) {
    const r = M.puppet(def, q, x, y, s, o || {});
    r.q = q; r.tenu = q.tenu; r.tenuB = q.tenuB;
    if (q.tenu && OBJ[q.tenu]) r.tenuO = heldOpts(q.tenu, q.tenuO, q);
    if (q.tenuB && OBJ[q.tenuB]) r.tenuBO = heldOpts(q.tenuB, q.tenuBO, q);
    return r;
  }
  // point écran → repère du torse (pour l'option `cible`)
  function toTorso(def, q, x, y, s, dir, Pt) {
    const T0 = cx_().getTransform();
    const root = T0.translate(x, y).scale(s * (dir || 1), s).rotate((q.tilt || 0) * D).translate(q.dx || 0, def.hipY + (q.dy || 0));
    const pp = new DOMPoint(Pt[0], Pt[1]).matrixTransform(root.inverse()); return [pp.x, pp.y];
  }
  function avecCible(def, poseFn, pose, x, y, s, o) {
    let q = poseFn(pose);
    if (pose && pose.cible) { const L = toTorso(def, q, x, y, s, (o || {}).dir, pose.cible); q = poseFn(Object.assign({}, pose, { cibleL: L })); }
    return q;
  }
  CUR.toTorso = toTorso;
  function upDef(at, LA, base, seed, paint, wt, wTop) {
    return { parent: 'torso', at, pts: armR(LA, wt, wTop), base, seed, paint: paint || (() => hatch([[-16, -20], [-3, -20], [-3, LA + 4], [-16, LA + 4]], 0.9, 3.8, 0.28)) };
  }
  function foreDef(back, LA, base, skin, seed, cuffCol, extraPaint) {
    const hk = (p) => (back ? p.handB : p.handF) || 'fist';
    return { parent: back ? 'armB_up' : 'armF_up', at: [0, LA], pts: (p) => foreR(hk(p)), base, seed, paint: (p) => {
      const k = hk(p);
      if (extraPaint) extraPaint(p);
      fillPts([[-40, 76, 1], [40, 76, 1], [40, 140, 1], [-40, 140, 1]], skin); handPaintK(k);
      if (cuffCol) fillPts([[-14, 62, 1], [14, 62, 1], [15, 78, 1], [-14, 78, 1]], cuffCol);
      hatch([[-14, -10], [-3, -10], [-3, 60], [-14, 60]], 0.9, 3.8, 0.22);
    } };
  }
  const ORDER = (avant, heads, apres) => ['armB_up', 'armB_lo', 'objetB', 'lueurB'].concat(avant || [], ['legB', 'legF', 'head'], heads, ['torso'], apres || [], ['objetB2', 'armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsB', 'lueurF']);
  // visages : yeux « rire » (plissés) et bouches propres
  function eyeK(f, x, y, sz) { if (f.eyes === 'rire') { strokePts([[x - 6, y + 1], [x, y - 2.5], [x + 6, y + 1]], 'rgba(28,16,14,0.95)', 1.8); return; } X.eye(f, x, y, sz); }

  // =====================================================================
  // MARIE CURIE — mince, profil fin, cheveux brun cendré bouffants et frisés sur le front, petit chignon HAUT (jamais de chapeau) ;
  // longue robe noire boutonnée jusqu'au cou, petit col ivoire, manches longues ; tablier gris lin noué à la taille ; bottines noires
  // =====================================================================
  const MA = { peau: '#e6c7a6', peauD: '#c9a685', cheveux: '#5a4636', cheveuxL: '#7a6450', robe: '#26262c', robeL: '#3a3a44', robeD: '#1b1b20', col: '#e9e2cf',
    tablier: '#9a9384', tablierD: '#827b6c', bottine: '#121014', bois: '#7a5a38', boisD: '#5e4428' };
  const KM = { shF: [-2, -146], shB: [-10, -146], neck: [6, -172], LA: 96 };
  const MA_TORSO = [[-12, -176], [8, -180], [15, -170], [21, -150], [27, -124], [24, -92], [18, -64], [24, -34], [32, 40], [40, 120], [46, 196], [50, 222, 1], [-46, 224, 1], [-42, 150], [-36, 60], [-28, -20], [-20, -64], [-24, -98], [-27, -130], [-27, -150], [-20, -170]];
  const MA_ASSISE = [[-12, -176], [8, -180], [15, -170], [21, -150], [27, -124], [24, -92], [18, -64], [30, -30], [58, -16], [104, -12], [118, 2], [114, 40], [118, 92], [124, 134, 1], [40, 136, 1], [-38, 60], [-36, 10], [-28, -20], [-20, -64], [-24, -98], [-27, -130], [-27, -150], [-20, -170]];
  const MA_HEAD = [[-12, 16], [9, 16], [12, 6], [18, -2], [23, -9], [25, -15], [24, -19], [26, -22], [25, -26], [26, -30], [31, -36, 1], [28, -43], [26, -52], [26, -62], [22, -76], [10, -88], [-6, -92], [-22, -86], [-31, -68], [-31, -46], [-25, -27], [-18, -8]];
  // cheveux : frange bouffante frisée sur le front, masse ramenée sur le haut du crâne, petit chignon haut
  const MA_HAIR = (function () { const o = [[26, -66]]; for (let i = 0; i <= 22; i++) { const a = -0.25 * PI - i / 22 * 1.05 * PI, r = 44 + 6 * (i % 2); o.push([-3 + Math.cos(a) * r * 1.02, -62 + Math.sin(a) * r * 0.95]); } return o.concat([[-40, -40], [-32, -28], [-24, -34], [-22, -52], [-12, -64], [2, -68], [12, -62], [20, -66]]); })();
  const MA_CHIGNON = ell(-8, -112, 16, 12, 14);
  const MA_LEG = [[-12, -10], [12, -12], [14, 40], [12, 110], [10, 160], [8, 200], [9, 216], [30, 222], [38, 232, 1], [-12, 236, 1], [-14, 222], [-12, 200], [-14, 160], [-16, 110], [-15, 40]];
  const MA_TAB = [[-40, -4], [26, -6], [30, 6], [16, 10], [18, 132, 1], [10, 132, 1], [6, 12], [-28, 12], [-30, 132, 1], [-38, 132, 1], [-36, 10]];
  function maMouth(f, x, y) {
    const m = f.mouth || 'n';
    if (m === 'smile') { strokePts([[x + 1, y - 1.5], [x - 3, y + 0.8], [x - 7, y - 1.5]], 'rgba(140,50,50,0.95)', 1.6); return; }
    if (m === 'o') { fillPts([[x - 3, y - 2.5], [x + 1, y - 3], [x + 1.5, y + 2.5], [x - 3, y + 3]], '#3a1714', 0, 0); return; }
    if (m === 'tight') { strokePts([[x + 1, y], [x - 7, y + 0.6]], 'rgba(120,45,45,0.95)', 1.8); return; }
    strokePts([[x + 1, y], [x - 3, y + 0.6], [x - 7, y + 0.2]], 'rgba(130,50,50,0.9)', 1.5);
  }
  function mkMarie() {
    const parts = {
      tabouret: { parent: 'torso', at: [-14, 4], pts: (p) => (p.assise ? MA_TAB : OFFP), base: MA.bois, seed: 6100, noRivet: true, paint: () => { strokePts([[-38, 0], [28, -2]], 'rgba(255,220,170,0.3)', 1.4); hatch(null, 0.3, 4, 0.25); } },
      torso: { parent: null, at: [0, 0], pts: (p) => (p.assise ? MA_ASSISE : MA_TORSO), base: MA.robe, seed: 6101, paint: (p) => {
        const as = !!p.assise;
        fillPts([[-10, -183], [11, -185], [17, -172], [12, -168], [-8, -170]], MA.col);                                   // petit col ivoire
        strokePts([[-6, -176], [14, -177]], 'rgba(150,140,120,0.6)', 1);
        strokePts([[16, -168], [22, -130], [20, -70]], 'rgba(0,0,0,0.5)', 1.2);                                             // boutonnage
        for (const y of [-160, -146, -132, -118, -104, -90, -76]) dot(19 + (y + 118) * 0.04, y, 1.8, '#4a4a54');
        fillPts([[-24, -70, 1], [22, -70, 1], [22, -62, 1], [-24, -62, 1]], MA.robeD);                                      // ceinture
        // tablier gris lin, noué à la taille (nœud dans le dos)
        const tab = as ? [[0, -64], [22, -62], [34, -24], [70, -12], [104, -8], [106, 26], [70, 30], [28, 10], [2, -18]] : [[-4, -64], [22, -62], [30, 0], [40, 100], [45, 200], [2, 204], [-2, 80]];
        fillPts(tab, MA.tablier); strokePts(tab.slice(1, 5), 'rgba(80,74,60,0.5)', 1.2);
        if (!as) { strokePts([[14, -40], [18, 160]], 'rgba(80,74,60,0.3)', 1); hatch([[0, -60], [24, -60], [45, 200], [2, 204]], 1.2, 4, 0.12, 1, '60,55,45'); strokePts([[2, 196], [44, 194]], 'rgba(80,74,60,0.5)', 1.2); }
        fillPts([[-2, -66, 1], [24, -64, 1], [24, -58, 1], [-2, -60, 1]], MA.tablierD);
        strokePts([[-22, -64], [-34, -44], [-30, -30]], MA.tablier, 3); strokePts([[-22, -64], [-36, -56]], MA.tablier, 3);  // cordons noués
        if (!as) { for (const [x0, x1] of [[-14, -28], [-4, -12], [-26, -40]]) strokePts([[x0, -40], [(x0 + x1) / 2, 80], [x1, 220]], 'rgba(90,90,110,0.45)', 1.2); }
        else {
          for (const x of [70, 92, 110]) strokePts([[x, 30], [x + 4, 130]], 'rgba(90,90,110,0.45)', 1.2);
          for (const dx of [0, 18]) fillPts([[102 + dx, 118], [124 + dx, 120], [134 + dx, 130], [132 + dx, 138, 1], [100 + dx, 138, 1]], MA.bottine);
        }
        strokePts([[22, -150], [26, -124], [22, -94]], 'rgba(255,255,255,0.12)', 2.2);                                      // reflet du corsage
        hatch([[-56, -170], [-14, -170], [-20, 226], [-56, 226]], 0.75, 4.4, 0.24, 1.05, '200,200,215');
        shade(40, 0, -44, 0, 0.26);
      } },
      legB: { parent: 'torso', at: [-6, -2], pts: MA_LEG, base: '#2a2630', seed: 6102, noRivet: true, paint: () => { fillPts([[-30, 196, 1], [50, 196, 1], [50, 250, 1], [-30, 250, 1]], MA.bottine); hatch(null, 0.8, 3.6, 0.3); } },
      legF: { parent: 'torso', at: [6, -2], pts: MA_LEG, base: '#34303a', seed: 6103, paint: () => { fillPts([[-30, 196, 1], [50, 196, 1], [50, 250, 1], [-30, 250, 1]], MA.bottine); strokePts([[16, 223], [34, 229]], 'rgba(255,255,255,0.25)', 1.2); for (const y of [204, 212]) dot(8, y, 1.3, '#5a5a62'); } },
      armB_up: upDef([-10, -146], 96, MA.robeD, 6104, () => hatch(null, 0.9, 3.8, 0.3, 1, '160,160,180'), 13, 15),
      armB_lo: foreDef(true, 96, MA.robeD, MA.peauD, 6105, '#2e2e36'),
      head: { parent: 'torso', at: [6, -172], pts: MA_HEAD, base: MA.peau, seed: 6106, noRivet: true, paint: (p) => {
        const f = p.face || {};
        X.earPaint(-6, -44);
        hatch([[-22, -40], [0, -28], [8, -8], [-8, 18], [-30, 4]], 0.6, 3.8, 0.2);
        dot(12, -30, 7, 'rgba(215,130,115,0.2)');
        eyeK(f, 15, -46, 0.92); strokePts([[9, -49], [7, -52]], 'rgba(28,16,14,0.9)', 1.1);
        X.brow(f, 15, -54, 'rgba(70,52,40,0.9)', 1.7);
        maMouth(f, 22, -21);
        strokePts([[14, -8], [22, -6]], 'rgba(150,100,80,0.3)', 1.1);                                                       // menton fin
      }, extra: (p) => { const e = clamp(p.eclaire || 0); if (e > 0) { glow(22, -36, 58, LUEUR, 0.32 * e); glow(18, -40, 24, '210,255,240', 0.18 * e); } } },
      cheveux: { parent: 'head', at: [0, 0], pts: MA_HAIR, base: MA.cheveux, seed: 6107, noRivet: true, paint: () => {
        for (let i = 0; i < 9; i++) strokePts(ep(22 - i * 7, -84 - (i % 2) * 6 + (i > 5 ? (i - 5) * 6 : 0), 5, 4, 8, PI, TAU * 0.95), 'rgba(150,128,106,0.55)', 1.1);   // frisure de la frange
        strokePts([[16, -88], [0, -96], [-18, -96], [-30, -84]], 'rgba(150,130,110,0.4)', 1.3);
        strokePts([[-30, -70], [-24, -50], [-28, -36]], 'rgba(30,20,15,0.4)', 1.2);
        hatch(null, 0.5, 3.4, 0.22, 1, '30,22,16');
      } },
      chignon: { parent: 'head', at: [0, 0], pts: MA_CHIGNON, base: MA.cheveux, seed: 6108, noRivet: true, paint: () => {
        strokePts(ep(-8, -112, 10, 7, 12, -PI * 0.9, PI * 0.7), 'rgba(150,130,110,0.5)', 1.3);
        strokePts(ep(-8, -112, 5, 4, 10, 0, TAU * 0.9), 'rgba(30,20,15,0.5)', 1.1);
        hatch(null, 0.9, 3.2, 0.2, 1, '30,22,16');
      } },
      armF_up: upDef([-2, -146], 96, MA.robe, 6109, () => { strokePts([[-6, -10], [-4, 80]], 'rgba(255,255,255,0.12)', 2); hatch([[-22, -20], [-3, -20], [-3, 100], [-22, 100]], 0.9, 3.8, 0.24, 1, '160,160,180'); }, 13, 15),
      armF_lo: foreDef(false, 96, MA.robe, MA.peau, 6110, '#33333c'),
    };
    Object.assign(parts, heldParts(MA.peau, 6120));
    return { hipY: -236, parts, handLen: 100, rod: { part: 'torso', at: [-18, 36] }, nom: 'Marie', order: ['tabouret'].concat(ORDER([], ['chignon', 'cheveux'])) };
  }
  CH.curMarie = mkMarie();
  const HUMEUR = { serieuse: { brow: 'n', mouth: 'tight' }, ravie: { brow: 'up', mouth: 'smile', eyes: 'rire' }, sceptique: { brow: 'frown', mouth: 'tight', eyes: 'half' }, surprise: { brow: 'up', mouth: 'o', eyes: 'wide' } };
  function humeur(q) { const h = HUMEUR[q.humeur]; if (!h) return; for (const k in h) if (q.face[k] == null) q.face[k] = h[k]; }
  // gestes : ecrire(+cible), tenir(+haut, cible), remuer, admirer, refus, salut, serre, parapluie, assise, marche ; humeur
  CUR.mariePose = function (p) {
    const q = prep(p), A = q.ang, f = q.face, t = q.t || 0, KT = KM;
    const k = (n) => ease(clamp(q[n] === true ? 1 : q[n] || 0));
    const ec = k('ecrire'), te = k('tenir'), re = k('remuer'), ad = k('admirer'), rf = k('refus'), sa = k('salut'), se = k('serre'), pa = k('parapluie');
    humeur(q);
    if (A.armF_up == null) A.armF_up = 0.04; if (A.armF_lo == null) A.armF_lo = -0.16;
    if (A.armB_up == null) A.armB_up = -0.02; if (A.armB_lo == null) A.armB_lo = -0.14;
    if (q.assise) { q.dy = (q.dy || 0) + 100; q.hide.legF = 1; q.hide.legB = 1; }
    if (te > 0 && !q.tenu) q.tenu = 'fiole';
    if (re > 0) q.tenu = 'barre';
    if (ec > 0 && !q.tenu) q.tenu = 'plume';
    if (se > 0 || pa > 0) { q.tenu = 'cahier'; q.tenuO = Object.assign({}, q.tenuO, pa > 0 ? { plat: true } : { ouvert: 0 }); }
    marcher(q, 1.1, 0.2, 3, { F: !has(q.tenu) && !rf && !ad && !sa, B: !has(q.tenuB) && !ad && !sa && !re && !se && !pa });
    if (ec > 0) {                                                                // le bec de la plume va sur la cible et griffonne
      const T0 = q.cibleL || [104, -58], th = -0.5;
      const sx = 7 * Math.sin(t * 9) + 3 * Math.sin(t * 23), sy = 2.5 * Math.sin(t * 17);
      const bec = rotP(OBJ.plume.pts.bec, th), T = [T0[0] + sx - bec[0], T0[1] + sy - bec[1]];
      if (q.tenu === 'plume') tenirA(q, KT, T, th, 'bas', ec);
      if (!has(q.tenuB)) { armTo(q, KT, 'armB', [T0[0] - 46, T0[1] + 4], 'bas', ec); q.handB = 'open'; }
      A.head = (A.head || 0) + 0.24 * ec; if (!f.eyes) f.eyes = 'half';
    }
    if (te > 0) {                                                                // fiole tenue à hauteur de poitrine (haut 0) ou près du visage (haut 1)
      const h = clamp(q.haut || 0), T = q.cibleL || [lerp(66, 64, h), lerp(-100, -186, h)];
      tenirA(q, KT, T, 0, 'bas', te);
      A.head = (A.head || 0) - 0.06 * h * te;
    }
    if (re > 0) {                                                                // longue barre de fer, deux mains, petit mouvement circulaire
      const w = t * TAU * 0.55, T = [92 + 14 * Math.cos(w), -64 + 7 * Math.sin(w)];
      tenirA(q, KT, T, (q.barreTh == null ? -0.55 : q.barreTh) + 0.06 * Math.sin(w), 'bas', re);
      q.deuxMains = re; plier(q, 0.07 * re); A.head = (A.head || 0) + 0.16 * re;
    }
    if (ad > 0) {                                                                // mains jointes sous le menton
      plier(q, 0.1 * ad); A.head = (A.head || 0) + 0.04 * ad;
      armTo(q, KT, 'armF', [44, -142], 'bas', ad); armTo(q, KT, 'armB', [40, -136], 'bas', ad);
      if (ad > 0.4) { q.handF = 'open'; q.handB = 'open'; }
      if (!f.mouth) f.mouth = 'smile'; if (!f.eyes) f.eyes = 'rire'; if (!f.brow) f.brow = 'up';
    }
    if (rf > 0) {                                                                // main ouverte levée devant la poitrine, tête qui recule
      blend(q, 'armF_up', -0.42, rf); blend(q, 'armF_lo', -1.95, rf); if (rf > 0.35) q.handF = 'open';
      A.head = (A.head || 0) - 0.07 * rf; q.dx = (q.dx || 0) - 5 * rf; q.tilt = (q.tilt || 0) - 0.035 * rf;
      if (!f.brow) f.brow = 'frown'; if (!f.mouth) f.mouth = 'tight'; if (!f.eyes) f.eyes = 'half';
    }
    if (sa > 0) {                                                                // petite révérence modeste
      plier(q, 0.13 * sa); A.head = (A.head || 0) + 0.24 * sa; q.dy = (q.dy || 0) + 6 * sa;
      armTo(q, KT, 'armF', [36, 26], 'bas', sa); armTo(q, KT, 'armB', [14, 24], 'bas', sa); q.handF = 'fist'; q.handB = 'fist';
      if (!f.eyes) f.eyes = 'half'; if (!f.mouth) f.mouth = 'smile';
    }
    if (se > 0) {                                                                // cahier fermé serré contre la poitrine, à deux mains
      tenirA(q, KT, [46, -118], 0, 'bas', se); q.deuxMains = se;
      A.head = (A.head || 0) - 0.06 * se; q.dx = (q.dx || 0) - 3 * se;
    }
    if (pa > 0) {                                                                // cahier à plat au-dessus de la tête, à deux mains (parapluie)
      tenirA(q, KT, [62, -306], 0, 'bas', pa); q.deuxMains = pa; A.head = (A.head || 0) - 0.12 * pa;
      if (!f.brow) f.brow = 'up';
    }
    return finish(q, KT);
  };
  CUR.marie = (pose, x, y, s, o) => { s = s == null ? 0.9 : s; return run(CH.curMarie, avecCible(CH.curMarie, CUR.mariePose, pose, x, y, s, o), x, y, s, o); };

  // =====================================================================
  // PIERRE CURIE — grand et mince, front haut dégarni (couronne de cheveux brun foncé courts), barbe brune courte taillée en pointe ;
  // veste longue brun tabac, gilet gris, chemise ivoire, petite lavallière noire, pantalon anthracite, chaussures noires
  // =====================================================================
  const PI_ = { peau: '#dfbd9c', peauD: '#c29d7c', cheveux: '#33251a', barbe: '#4a3424', barbeL: '#6a4c34', veste: '#6b4a2e', vesteD: '#55391f', vesteL: '#80603e',
    gilet: '#8c8b86', giletD: '#74736e', chemise: '#ece6d6', lav: '#121014', pant: '#3a3b40', pantD: '#2d2e33', chaus: '#121011', brulure: '#9e2b25', bande: '#ece6d6' };
  const KP = { shF: [-2, -156], shB: [-10, -156], neck: [6, -184], LA: 100 };
  const LEGK = 1.11;
  const PI_LEG = X.legPts(0.92).map((p) => (p[2] ? [p[0], p[1] * LEGK, 1] : [p[0], p[1] * LEGK]));
  const PI_TORSO = [[-14, -184], [6, -186], [16, -176], [30, -160], [37, -126], [38, -84], [36, -40], [35, 0], [39, 60], [43, 116, 1], [-41, 118, 1], [-41, 60], [-39, 0], [-39, -60], [-40, -120], [-37, -158], [-27, -178]];
  const PI_HEAD = [[-14, 16], [10, 16], [11, 2], [16, -6], [23, -11], [27, -17], [26, -23], [28, -27], [27, -31], [30, -36], [36, -42, 1], [32, -49], [28, -60], [28, -70], [25, -84], [13, -98], [-6, -103], [-24, -94], [-33, -72], [-32, -48], [-24, -28], [-17, -8]];
  const PI_HAIR = [[6, -101], [-8, -106], [-25, -97], [-35, -76], [-36, -54], [-29, -31], [-21, -35], [-19, -50], [-13, -60], [-9, -72], [-3, -86]];
  const PI_BARBE = [[-4, -48], [2, -46], [5, -34], [12, -27], [20, -26], [27, -30], [34, -26], [33, -12], [28, 4], [21, 24, 1], [10, 16], [-2, 6], [-12, -8], [-16, -24], [-10, -36]];
  function piLegPaint(back) {
    return () => {
      fillPts([[-40, 214 * LEGK, 1], [60, 214 * LEGK, 1], [60, 300, 1], [-40, 300, 1]], PI_.chaus);
      if (!back) { hatch([[-24, -20], [-6, -20], [-6, 230], [-24, 230]], 0.8, 4, 0.22); strokePts([[18, 247], [40, 252]], 'rgba(255,255,255,0.22)', 1.2); strokePts([[-2, 20], [2, 120], [0, 230]], 'rgba(0,0,0,0.25)', 1.2); }
      else hatch(null, 0.8, 3.6, 0.3);
    };
  }
  // avant-bras avant : manche retroussée (brûlure, bande, petit tube lumineux)
  function piForeExtra(p) {
    const nu = p._manche;
    if (nu) {
      fillPts([[-30, 18, 1], [30, 18, 1], [30, 80, 1], [-30, 80, 1]], PI_.peau);
      fillPts([[-14, 8, 1], [14, 8, 1], [14, 24, 1], [-14, 24, 1]], PI_.chemise); strokePts([[-12, 22], [12, 22]], 'rgba(120,110,90,0.6)', 1);
      hatch([[-12, 28], [-4, 28], [-4, 74], [-12, 74]], 0.9, 3.6, 0.15);
      const br = clamp(p.brulure || 0);
      if (br > 0) {                                                               // tache rouge sang ovale ≥ 40 px à s 0,9 (46 × 18 local)
        fillPts(ell(1, 50, 9.5, 23, 14), `rgba(158,43,37,${0.9 * br})`, 0, 0);
        fillPts(ell(2, 48, 5, 14, 10), `rgba(196,70,58,${0.7 * br})`, 0, 0);
        strokePts(ell(1, 50, 10.5, 24, 14).concat([[11.5, 50]]), `rgba(110,25,20,${0.6 * br})`, 1);
      }
      const tu = p.tube == null ? 0 : (p.tube === true ? 1 : clamp(p.tube));
      if (tu > 0) { fillPts([[-4, 30], [4, 30], [4, 66], [-4, 66]], `rgba(200,240,228,${0.85 * tu})`); fillPts([[-4, 56], [4, 56], [4, 66], [-4, 66]], `rgba(159,232,208,${tu})`); }
      const bd = clamp(p.bande || 0);
      if (bd > 0) {                                                               // bande ivoire enroulée de y 26 vers y 74
        const y1 = 26 + 48 * bd;
        fillPts([[-12, 26, 1], [12, 26, 1], [12, y1, 1], [-12, y1, 1]], PI_.bande);
        for (let y = 30; y < y1 - 2; y += 7) strokePts([[-12, y + 4], [12, y]], 'rgba(150,140,115,0.7)', 1.1);
      }
    }
  }
  function mkPierre() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: PI_TORSO, base: PI_.veste, seed: 6201, paint: () => {
        fillPts([[4, -190], [16, -182], [30, -160], [35, -118], [30, -78], [10, -84], [6, -140]], PI_.gilet);                // gilet gris dans l'ouverture
        for (const y of [-150, -130, -110, -92]) dot(22 + (y + 150) * 0.1, y, 1.8, '#4a4a48');
        fillPts([[6, -194], [16, -194], [22, -182], [12, -176], [4, -182]], PI_.chemise);                                    // col de chemise
        fillPts([[12, -186], [24, -192], [26, -178], [14, -180], [10, -172], [6, -178]], PI_.lav);                             // lavallière noire
        fillPts([[18, -180], [28, -166], [22, -164], [14, -176]], PI_.lav);
        fillPts([[2, -184], [14, -178], [22, -150], [26, -110], [20, -104], [12, -140]], PI_.vesteD);                        // revers
        strokePts([[20, -104], [30, -76], [32, 0], [40, 112]], 'rgba(30,20,10,0.55)', 1.4);                                   // bord de la veste
        for (const y of [-70, -40]) dot(30, y, 2.4, '#2e2016');
        fillPts([[4, 10], [34, 8], [34, 14], [4, 16]], PI_.vesteD); strokePts([[4, 10], [34, 8]], 'rgba(30,20,10,0.5)', 1);   // poche
        hatch([[-56, -180], [-12, -180], [-12, 120], [-56, 120]], 0.75, 4.2, 0.3);
        strokePts([[-36, -150], [-34, 110]], 'rgba(255,230,190,0.12)', 2.4);
        shade(42, 0, -42, 0, 0.28);
      } },
      legB: { parent: 'torso', at: [-6, -2], pts: PI_LEG, base: PI_.pantD, seed: 6202, noRivet: true, paint: piLegPaint(true) },
      legF: { parent: 'torso', at: [6, -2], pts: PI_LEG, base: PI_.pant, seed: 6203, paint: piLegPaint(false) },
      armB_up: upDef([-10, -156], 100, PI_.vesteD, 6204, null, 15, 16),
      armB_lo: foreDef(true, 100, PI_.vesteD, PI_.peauD, 6205, PI_.chemise),
      head: { parent: 'torso', at: [6, -184], pts: PI_HEAD, base: PI_.peau, seed: 6206, noRivet: true, paint: (p) => {
        const f = p.face || {};
        X.earPaint(-8, -46);
        hatch([[-24, -42], [2, -30], [12, -12], [-6, 18], [-32, 4]], 0.6, 3.6, 0.28);
        strokePts([[6, -92], [18, -86]], 'rgba(150,100,80,0.25)', 1.2); strokePts([[2, -84], [16, -79]], 'rgba(150,100,80,0.2)', 1.1);   // front haut, rides
        strokePts([[-8, -100], [10, -94], [22, -82]], 'rgba(255,240,220,0.35)', 2);                                                         // reflet du crâne
        eyeK(f, 18, -54, 1); X.brow(f, 18, -62, 'rgba(50,36,26,0.95)', 2.4);
        strokePts([[30, -36], [26, -32]], 'rgba(120,80,60,0.45)', 1.1);
      } },
      cheveux: { parent: 'head', at: [0, 0], pts: PI_HAIR, base: PI_.cheveux, seed: 6207, noRivet: true, paint: () => { for (const [a, b] of [[[-12, -88], [-28, -76]], [[-20, -70], [-30, -54]]]) strokePts([a, b], 'rgba(120,90,60,0.45)', 1.1); hatch(null, 0.5, 3.4, 0.25); } },
      barbe: { parent: 'head', at: [0, 0], pts: PI_BARBE, base: PI_.barbe, seed: 6208, noRivet: true, paint: (p) => {
        const f = p.face || {};
        for (let i = 0; i < 7; i++) strokePts([[-8 + i * 6, -20], [-2 + i * 4, 4 + i * 2]], 'rgba(20,12,8,0.45)', 1);
        strokePts([[6, -12], [14, 8], [19, 20]], 'rgba(150,110,80,0.4)', 1.2);
        fillPts([[14, -29], [28, -33], [37, -28], [34, -22], [22, -23]], '#7e5c40'); strokePts([[14, -29], [28, -33], [37, -28]], 'rgba(20,12,8,0.6)', 1);                                                          // moustache
        if (f.mouth === 'o') fillPts(ell(27, -19, 3.5, 3, 8), '#3a1714', 0, 0);
        else if (f.mouth === 'smile' || f.mouth === 'dents') strokePts([[30, -20], [25, -17], [20, -19]], 'rgba(205,125,110,0.95)', 1.7);
        else strokePts([[30, -19], [22, -19]], 'rgba(205,125,110,0.95)', 1.6);
      } },
      armF_up: upDef([-2, -156], 100, PI_.veste, 6209, null, 15, 16),
      armF_lo: foreDef(false, 100, PI_.veste, PI_.peau, 6210, PI_.chemise, piForeExtra),
    };
    Object.assign(parts, heldParts(PI_.peau, 6220));
    return { hipY: -264, parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, nom: 'Pierre', order: ORDER([], ['cheveux'], ['barbe']) };
  }
  CH.curPierre = mkPierre();
  // gestes : tenir(+cible), porter(+haut), verser, bandage(+bande, tube), montrerBras, tendre, brulure, fier, epaules, marche
  CUR.pierrePose = function (p) {
    const q = prep(p), A = q.ang, f = q.face, t = q.t || 0, KT = KP;
    const k = (n) => ease(clamp(q[n] === true ? 1 : q[n] || 0));
    const te = k('tenir'), po = k('porter'), ve = k('verser'), bd = k('bandage'), mb = k('montrerBras'), tn = k('tendre'), fi = k('fier'), es = k('epaules');
    humeur(q);
    if (A.armF_up == null) A.armF_up = 0.04; if (A.armF_lo == null) A.armF_lo = -0.18;
    if (A.armB_up == null) A.armB_up = -0.02; if (A.armB_lo == null) A.armB_lo = -0.16;
    if (po > 0 && !q.tenu) q.tenu = 'bloc';
    if (ve > 0 && !q.tenu) q.tenu = 'sac';
    if (bd > 0 && !q.tenuB) q.tenuB = 'rouleau';
    q._manche = !!(q.manche || bd > 0 || mb > 0 || tn > 0 || (q.brulure || 0) > 0 || (q.bande || 0) > 0 || q.tube);
    marcher(q, 1.5, 0.3, 6, { F: !has(q.tenu) && !bd && !mb && !tn && !fi && !es, B: !has(q.tenuB) && !q.deuxMains && !po && !bd && !es });
    if (te > 0) { const T = q.cibleL || [82, -92]; tenirA(q, KT, T, 0, 'bas', te); }
    if (po > 0) {                                                                // bloc tenu par en dessous, deux mains ; haut 1 = bras avant tendu vers la lumière
      const h = ease(clamp(q.haut || 0)), T = q.cibleL || [lerp(86, 150, h), lerp(-66, -172, h)];
      tenirA(q, KT, T, 0, 'bas', po); q.deuxMains = po * (1 - smooth(0.35, 0.8, h)); A.head = (A.head || 0) - 0.14 * h;
    }
    if (ve > 0) {                                                                // sac tenu au col, la main arrière sous le fond ; il bascule col vers le bas
      tenirA(q, KT, q.cibleL || [118, -64], 2.0 * ve, 'bas', 1); q.deuxMains = 1; A.head = (A.head || 0) + 0.12 * ve;
    }
    if (bd > 0) {                                                                // avant-bras avant à l'horizontale devant lui, la main arrière tourne autour
      blend(q, 'armF_up', -0.62, bd); blend(q, 'armF_lo', -0.98, bd); q.handF = 'open';
      const C = forePt(q, KT, 'armF', 0, 46), w = t * TAU * 1.1;
      armTo(q, KT, 'armB', [C[0] + 6 * Math.cos(w), C[1] + 6 + 18 * Math.sin(w)], 'bas', bd);
      A.objetB = 0; q.droitB = true; A.head = (A.head || 0) + 0.16 * bd;
      q._bandeFil = bd > 0.5;
    }
    if (mb > 0) {                                                                // avant-bras levé devant lui, paume vers lui : il regarde sa brûlure
      blend(q, 'armF_up', -0.5, mb); blend(q, 'armF_lo', -1.85, mb); if (mb > 0.4) q.handF = 'open';
      A.head = (A.head || 0) + 0.06 * mb; if (!f.brow) f.brow = 'up';
    }
    if (tn > 0) {                                                                // bras tendu devant (vers le public / la vignette), fier
      blend(q, 'armF_up', -1.42, tn); blend(q, 'armF_lo', -0.22, tn); if (tn > 0.4) q.handF = 'paume';
      A.head = (A.head || 0) - 0.1 * tn; if (!f.mouth) f.mouth = 'smile';
    }
    if (fi > 0) {                                                                // menton levé, main sur le revers
      plier(q, -0.05 * fi); A.head = (A.head || 0) - 0.18 * fi; q.dy = (q.dy || 0) - 3 * fi;
      if (!has(q.tenu) && !mb && !tn && !bd) { armTo(q, KT, 'armF', [30, -132], 'bas', fi); q.handF = 'fist'; }
      if (!has(q.tenuB) && !q.deuxMains && !bd) { armTo(q, KT, 'armB', [16, -4], 'bas', fi); q.handB = 'fist'; }
      if (!f.mouth) f.mouth = 'smile'; if (!f.eyes) f.eyes = 'half';
    }
    if (es > 0) {                                                                // haussement d'épaules, mains ouvertes paumes en l'air
      q.dy = (q.dy || 0) - 5 * es; A.head = (A.head || 0) + 0.1 * es;
      if (!has(q.tenu)) { armTo(q, KT, 'armF', [72, -36], 'bas', es); q.handF = 'paume'; }
      if (!has(q.tenuB)) { armTo(q, KT, 'armB', [58, -30], 'bas', es); q.handB = 'paume'; }
      if (!f.brow) f.brow = 'up'; if (!f.mouth) f.mouth = 'tight';
    }
    return finish(q, KT);
  };
  CUR.pierre = (pose, x, y, s, o) => {
    s = s == null ? 0.9 : s;
    const q = avecCible(CH.curPierre, CUR.pierrePose, pose, x, y, s, o), r = run(CH.curPierre, q, x, y, s, o);
    if (q._bandeFil && !SIL()) {                                                // fil de bande : du rouleau (main arrière) à l'avant-bras
      const a = r.w('objetB', 0, 0), b = r.w('armF_lo', 0, 26 + 48 * clamp(q.bande || 0));
      const c = cx_(); c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
      c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo((a[0] + b[0]) / 2, Math.max(a[1], b[1]) + 10 * s, b[0], b[1]);
      c.strokeStyle = '#d8d0bc'; c.lineWidth = 7 * s; c.stroke(); c.strokeStyle = PI_.bande; c.lineWidth = 5 * s; c.stroke(); c.restore();
    }
    return r;
  };
  CUR.KIT = { marie: KM, pierre: KP };

  // =====================================================================
  // TAS DE SACS (n 3–12) : pyramide de sacs de jute ; origine = sol, milieu
  // =====================================================================
  function drawTas(o) {
    const n = Math.max(1, Math.min(12, Math.round(o.n == null ? 8 : o.n)));
    let b = 1; while (b * (b + 1) / 2 < n) b++;
    const rows = []; let left = n;
    for (let r = 0; left > 0; r++) { const m = Math.min(b - r, left); rows.push(m); left -= m; }
    const c = cx_();
    rows.forEach((m, r) => {
      for (let i = 0; i < m; i++) {
        const id = r * 13 + i, x = (i - (m - 1) / 2) * 80 + 6 * (hash(id * 2.3) - 0.5), y = -r * 84 + 4 * hash(id);
        c.save(); c.translate(x, y); c.rotate(0.12 * (hash(id * 5.1) - 0.5) + (r ? 0 : 0.04 * (i - (m - 1) / 2)));
        if (r) c.scale(1, 0.94);
        drawSac({ tint: hash(id * 7.7) }); c.restore();
      }
    });
  }
  OBJ.tas = { draw: drawTas, grip: [0, 0], pts: { haut: [0, -360], fond: [0, 0] }, base: [0, 0] };

  // =====================================================================
  // ACCESSOIRES SEULS — M.puppet à une pièce invisible ; l'objet se dessine dans l'extra (ombre portée possible)
  // =====================================================================
  const accDefs = {};
  function accDef(name, fn) { return accDefs[name] || (accDefs[name] = { hipY: 0, handLen: 10, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => fn(p.o) } }, order: ['o'] }); }
  function acc(name, x, y, s, o, sDef) {
    o = o || {}; s = s == null ? (sDef || 1) : s;
    const ob = OBJ[name];
    const def = accDef(name, (oo) => { const c = cx_(); c.save(); c.translate(-ob.base[0], -ob.base[1]); ob.draw(oo); c.restore(); if (ob.glow) ob.glow(oo, -ob.base[0], -ob.base[1]); });
    const r = M.puppet(def, { o, tilt: o.rot || 0 }, x, y, s, { dir: o.dir || 1, rod: false, slot: o.slot != null ? o.slot : y + 6 * s, floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
    r.obj = name; r.oo = o; return r;
  }
  // (x,y) : fiole, sac, bloc, tas, boîte = sol sous l'objet ; cahier = bas du dos (reliure) ; barre = bout bas ; plume = bec ; rouleau = dessous
  CUR.fiole = (x, y, s, o) => acc('fiole', x, y, s, o, 0.9);
  CUR.cahier = (x, y, s, o) => acc('cahier', x, y, s, o, 1);
  CUR.bloc = (x, y, s, o) => acc('bloc', x, y, s, o, 0.9);
  CUR.sac = (x, y, s, o) => acc('sac', x, y, s, o, 0.9);
  CUR.tas = (x, y, s, o) => acc('tas', x, y, s, o, 1);
  CUR.barre = (x, y, s, o) => acc('barre', x, y, s, o, 0.9);
  CUR.plume = (x, y, s, o) => acc('plume', x, y, s, o, 0.9);
  CUR.rouleau = (x, y, s, o) => acc('rouleau', x, y, s, o, 0.9);
  // boîte en plomb : o.ouvert 0..1 ; o.cables (true) = deux câbles des poignées jusqu'à o.cablesY (défaut 0 : haut du cadre)
  CUR.boite = (x, y, s, o) => {
    o = o || {}; s = s == null ? 1 : s;
    const r = acc('boite', x, y, s, o, 1);
    if (o.cables && !SIL()) {
      const c = cx_(), top = o.cablesY == null ? 0 : o.cablesY;
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
      for (const nm of ['poigneeG', 'poigneeD']) {
        const q = CUR.accPt(r, 'boite', nm);
        c.beginPath(); c.moveTo(q[0], q[1]); c.lineTo(q[0] + (nm === 'poigneeG' ? 1 : -1) * 6 * s, top);
        c.strokeStyle = '#1e1c1c'; c.lineWidth = 3.4; c.stroke(); c.strokeStyle = 'rgba(200,190,170,0.5)'; c.lineWidth = 1; c.stroke();
      }
      c.restore();
    }
    return r;
  };
  // point nommé d'un accessoire seul (r renvoyé par CUR.fiole/cahier/boite/…)
  CUR.accPt = (r, name, nom) => { const ob = OBJ[name], q0 = ob && ob.pts[nom]; if (!q0) return null; const q = typeof q0 === 'function' ? q0(r.oo || {}) : q0; const k = ob.kpts ? ((r.oo && r.oo.taille) || 1) : 1; return r.w('o', q[0] * k - ob.base[0], q[1] * k - ob.base[1]); };

  // =====================================================================
  // DÉCOR : LE HANGAR DE LA RUE LHOMOND (1898–1906, 1934) — trois couches
  //   fond : planches verticales brun gris, verrière inclinée sur les toits de Paris (jour / nuit), tableau noir à courbes, bec de gaz
  //   milieu : poêle en fonte à long tuyau, sacs de jute, chaudron sur trépied et braises, paillasse (cornues, ballons, balance sous cloche,
  //            lampe à pétrole), étagère de 5 fioles ; sol (CUR.hangarSol) : bassine, seau en zinc, tabouret, caisse, pelle, pots de grès
  // =====================================================================
  const BACK = M.ST.back;
  const H = {
    verriere: { xt0: 222, xt1: 858, yt: 176, xb0: 110, xb1: 970, yb: 548 },
    tableau: { x0: 384, y0: 574, x1: 640, y1: 700 },
    bec: { x: 712, y: 650 },
    poele: { x: 204, y: BACK, porte: [204, 1302], raccord: [204, 880], tuyauHaut: 604 },
    sacs: { x0: 40, x1: 150 },
    chaudron: { x: 336, y: BACK, bord: 1238, surface: 1246 },
    paillasse: { x0: 640, x1: 1010, y: 1150, libre: [646, 740] },
    etagere: { x0: 748, x1: 972, y: 968, fioles: [[778, 968], [818, 968], [858, 968], [898, 968], [938, 968]] },
    lampe: { x: 920, y: 1150, flamme: [920, 1062] },
    balance: { x: 862, y: 1150 },
    goutte: { x: 690, y0: 556, y1: 1146 },
    libre: { x0: 300, x1: 760, y0: 700, y1: 1400 },
  };
  CUR.H = H;
  const rect = (x0, y0, x1, y1) => [[x0, y0, 1], [x1, y0, 1], [x1, y1, 1], [x0, y1, 1]];
  const bar = (a, b, w) => ribbon([a, b], w, w);
  function gradRect(c, x0, y0, x1, y1, stops, horiz) {
    const g = horiz ? c.createLinearGradient(x0, 0, x1, 0) : c.createLinearGradient(0, y0, 0, y1);
    for (const [k, col] of stops) g.addColorStop(k, col); c.fillStyle = g; c.fillRect(x0, y0, x1 - x0, y1 - y0);
  }
  const V = H.verriere;
  const vTrap = () => [[V.xt0, V.yt], [V.xt1, V.yt], [V.xb1, V.yb], [V.xb0, V.yb]];
  function clipTrap(c) { c.beginPath(); vTrap().forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.clip(); }
  // ---- vue par la verrière : toits de zinc, cheminées, dôme du Panthéon au loin
  function toits(c, nuit) {
    const zinc = nuit ? '#161c2e' : '#8d979e', zincD = nuit ? '#10152a' : '#76828a', brique = nuit ? '#1a1a28' : '#9a6a4c', dome = nuit ? '#1a2034' : '#a2abb2';
    // dôme du Panthéon (tambour à colonnade, lanterne)
    fillPts(ep(560, 454, 62, 58, 20, PI, TAU).concat([[622, 456], [498, 456]]), dome);
    fillPts(rect(492, 454, 628, 500), dome); fillPts(rect(552, 380, 568, 400), dome); fillPts(ep(560, 382, 9, 12, 10, PI, TAU), dome);
    if (!nuit) for (let i = 0; i < 9; i++) fillPts(rect(498 + i * 15, 462, 503 + i * 15, 496), 'rgba(110,120,128,0.6)');
    for (const [x, w, h, col] of [[V.xb0 - 30, 150, 66, zinc], [230, 120, 86, zincD], [340, 130, 58, zinc], [450, 90, 40, zincD], [620, 120, 70, zinc], [730, 110, 92, zincD], [830, 170, 60, zinc]]) {
      const yb = V.yb + 4, y0 = yb - h;
      fillPts([[x, yb], [x, y0 + 16], [x + 14, y0], [x + w - 14, y0], [x + w, y0 + 16], [x + w, yb]], col);
      for (let i = 0; i < Math.floor(w / 30); i++) {                                                // lucarnes
        const lx = x + 12 + i * 30;
        fillPts(rect(lx, y0 + 22, lx + 12, y0 + 36), nuit ? (hash(lx) > 0.55 ? '#d9a85a' : '#0c1020') : '#4f5962');
        fillPts([[lx - 2, y0 + 22], [lx + 6, y0 + 14], [lx + 14, y0 + 22]], nuit ? '#10152a' : '#5d6770');
      }
      for (const cxx of [x + 16, x + w - 28]) { fillPts(rect(cxx, y0 - 24, cxx + 14, y0 + 2), brique); for (let j = 0; j < 3; j++) fillPts(rect(cxx + 1 + j * 4, y0 - 30, cxx + 4 + j * 4, y0 - 24), nuit ? '#141420' : '#b07a52'); }
    }
  }
  function makeVue(nuit) {
    return M.pre(1080, 600, (c) => {
      if (!nuit) gradRect(c, 0, 150, 1080, 560, [[0, '#8f9eab'], [0.55, '#bcc6ca'], [1, '#dcdad0']]);
      else {
        gradRect(c, 0, 150, 1080, 560, [[0, '#121a34'], [0.6, '#1e2a4a'], [1, '#2c3a5a']]);
        for (let i = 0; i < 40; i++) dot(120 + 840 * hash(i * 3.7), 180 + 260 * hash(i * 9.1), 1 + hash(i) * 1.2, `rgba(240,240,220,${0.4 + 0.5 * hash(i * 2.2)})`);
        fillPts(ell(770, 340, 24, 24, 20), '#ece8d0'); fillPts(ell(780, 256, 22, 24, 16), 'rgba(18,26,52,0.0)');
        for (const [x, y, r] of [[762, 332, 5], [778, 348, 4], [768, 354, 3]]) dot(x, y, r, 'rgba(180,176,150,0.5)');
      }
      toits(c, nuit);
    });
  }
  // ---- toile de fond : planches, charpente, châssis de la verrière (trou), tableau noir, bec de gaz, étagère
  function makeFond() {
    return M.pre(1080, 1400, (c) => {
      // planches verticales brun gris
      for (let x = 30, i = 0; x < 1060; x += 52, i++) {
        const v = hash(i * 3.3), col = M.mixc('#7a6f62', '#665c50', v);
        c.fillStyle = col; c.fillRect(x, 140, 52, 1262);
        c.fillStyle = 'rgba(30,22,16,0.55)'; c.fillRect(x, 140, 2.4, 1262);
        c.fillStyle = 'rgba(255,240,220,0.08)'; c.fillRect(x + 3, 140, 2, 1262);
        for (let k = 0; k < 7; k++) { const y = 200 + k * 180 + 30 * hash(i * 7 + k); strokePts([[x + 10 + 8 * hash(k + i), y], [x + 14 + 10 * hash(k * 2 + i), y + 60 + 30 * hash(k)]], 'rgba(40,30,20,0.18)', 1); }
        if (hash(i * 5.5) > 0.5) { const ky = 400 + 800 * hash(i * 2.1); fillPts(ell(x + 26, ky, 6, 9, 10), 'rgba(50,36,24,0.45)'); strokePts(ep(x + 26, ky, 9, 13, 10, 0, TAU), 'rgba(50,36,24,0.25)', 1); }
        for (const y of [612, 1000, 1360]) { dot(x + 12, y, 1.8, '#2e2a26'); dot(x + 40, y, 1.8, '#2e2a26'); }
      }
      // traverse horizontale (lisse) et sablière sous la verrière
      pc(rect(30, 992, 1060, 1012), '#5e5448', () => strokePts([[30, 994], [1060, 994]], 'rgba(255,240,210,0.18)', 1.4), 8001, { drop: false });
      gradRect(c, 0, 1100, 1080, 1402, [[0, 'rgba(30,22,14,0)'], [1, 'rgba(30,22,14,0.5)']]);
      // dessous du toit (voliges sombres) autour de la verrière
      fillPts([[30, 140], [1060, 140], [1060, 566], [V.xb1 + 20, 566], [V.xt1 + 14, V.yt - 10], [V.xt0 - 14, V.yt - 10], [V.xb0 - 20, 566], [30, 566]], '#3e362e');
      for (let i = 0; i < 12; i++) { const u = i / 11; strokePts([[lerp(30, V.xb0 - 20, u), 566], [lerp(30, V.xt0 - 14, u) + 6, 150]], 'rgba(0,0,0,0.3)', 1.5); strokePts([[lerp(V.xb1 + 20, 1060, u), 566], [lerp(V.xt1 + 14, 1060, u) - 6, 150]], 'rgba(0,0,0,0.3)', 1.5); }
      // châssis de fer de la verrière
      pc([[V.xt0 - 16, V.yt - 14], [V.xt1 + 16, V.yt - 14], [V.xb1 + 22, V.yb + 6], [V.xb0 - 22, V.yb + 6]], '#3a3c3e', null, 8002, { drop: false });
      c.save(); c.globalCompositeOperation = 'destination-out'; c.beginPath(); vTrap().forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.fill(); c.restore();
      // carreaux : teinte légère, petits bois de fer (perspective : rangs serrés vers le haut)
      const NC = 10, NR = 6, ry = (j) => lerp(V.yt, V.yb, Math.pow(j / NR, 1.25));
      for (let i = 0; i < NC; i++) for (let j = 0; j < NR; j++) {
        const v = hash(i * 7 + j * 13), u0 = i / NC, u1 = (i + 1) / NC, y0 = ry(j), y1 = ry(j + 1), w0 = (y0 - V.yt) / (V.yb - V.yt), w1 = (y1 - V.yt) / (V.yb - V.yt);
        const xa = (u, w) => lerp(lerp(V.xt0, V.xt1, u), lerp(V.xb0, V.xb1, u), w);
        c.fillStyle = `rgba(${200 + 30 * v},${214 + 20 * v},225,${0.06 + 0.12 * v})`;
        c.beginPath(); c.moveTo(xa(u0, w0), y0); c.lineTo(xa(u1, w0), y0); c.lineTo(xa(u1, w1), y1); c.lineTo(xa(u0, w1), y1); c.closePath(); c.fill();
        if (v > 0.86) strokePts([[xa(u0, w0) + 4, y0 + 4], [xa(u1, w1) - 6, y1 - 4]], 'rgba(40,40,40,0.35)', 1);   // carreau fêlé
      }
      for (let i = 0; i <= NC; i++) { const u = i / NC; c.beginPath(); c.moveTo(lerp(V.xt0, V.xt1, u), V.yt); c.lineTo(lerp(V.xb0, V.xb1, u), V.yb); c.strokeStyle = '#2e3032'; c.lineWidth = i % 5 ? 3.2 : 7; c.stroke(); }
      for (let j = 0; j <= NR; j++) { const y = ry(j), w = (y - V.yt) / (V.yb - V.yt); c.beginPath(); c.moveTo(lerp(V.xt0, V.xb0, w), y); c.lineTo(lerp(V.xt1, V.xb1, w), y); c.strokeStyle = '#2e3032'; c.lineWidth = j % NR ? 2.6 + 2 * w : 8; c.stroke(); }
      for (let i = 0; i < 8; i++) strokePts([[lerp(V.xt0, V.xb0, 0.2) + i * 90, V.yt + 40], [lerp(V.xt0, V.xb0, 0.4) + i * 92, V.yt + 110]], 'rgba(255,255,255,0.16)', 2);
      // poutre de la sablière
      pc(rect(30, 548, 1060, 576), '#584a3c', () => { hatch(null, 0.05, 4, 0.2); strokePts([[30, 551], [1060, 551]], 'rgba(255,230,190,0.22)', 1.6); }, 8003);
      pc(rect(V.xb0 + 40, 576, V.xb0 + 64, 1402), '#5a4c3e', () => hatch(null, 0.05, 4, 0.18), 8004, { drop: false });   // poteau gauche
      pc(rect(V.xb1 - 30, 576, V.xb1 - 6, 1402), '#5a4c3e', () => hatch(null, 0.05, 4, 0.18), 8005, { drop: false });    // poteau droit
      // tableau noir à courbes (craie, sans chiffre)
      const T = H.tableau;
      pc(rect(T.x0 - 10, T.y0 - 10, T.x1 + 10, T.y1 + 10), '#6a4a2c', () => hatch(null, 0.1, 4, 0.2), 8006);
      pc(rect(T.x0, T.y0, T.x1, T.y1), '#22282a', () => {
        c.fillStyle = 'rgba(200,210,200,0.06)'; c.fillRect(T.x0 + 20, T.y0 + 10, 120, 60);                       // traces effacées
        const chalk = 'rgba(232,232,222,0.85)', W2 = T.x1 - T.x0;
        strokePts([[T.x0 + 20, T.y0 + 14], [T.x0 + 20, T.y1 - 16], [T.x0 + W2 * 0.48, T.y1 - 16]], chalk, 1.6);
        const e1 = []; for (let i = 0; i <= 16; i++) { const u = i / 16; e1.push([T.x0 + 24 + u * (W2 * 0.44), T.y1 - 18 - 80 * Math.exp(-3.2 * u)]); } strokePts(e1, chalk, 1.8);
        for (let i = 1; i < 5; i++) strokePts([[T.x0 + 24 + i * 24, T.y1 - 20], [T.x0 + 24 + i * 24, T.y1 - 13]], chalk, 1);
        const e2 = []; for (let i = 0; i <= 24; i++) { const u = i / 24; e2.push([T.x0 + W2 * 0.56 + u * W2 * 0.4, T.y0 + 58 + 26 * Math.sin(u * TAU * 1.5) * Math.exp(-1.2 * u)]); } strokePts(e2, chalk, 1.6);
        const sp = []; for (let i = 0; i <= 30; i++) { const a = i / 30 * TAU * 2.2, rr = 3 + i * 0.55; sp.push([T.x0 + W2 * 0.8 + Math.cos(a) * rr, T.y1 - 30 + Math.sin(a) * rr * 0.8]); } strokePts(sp, chalk, 1.2);
        strokePts([[T.x0 + W2 * 0.6, T.y1 - 40], [T.x0 + W2 * 0.66, T.y1 - 30], [T.x0 + W2 * 0.7, T.y1 - 46]], chalk, 1.4);
      }, 8007, { drop: false });
      pc(rect(T.x0 + 30, T.y1 + 10, T.x0 + 120, T.y1 + 16), '#6a4a2c', null, 8008);
      fillPts(rect(T.x0 + 44, T.y1 + 4, T.x0 + 62, T.y1 + 10), '#eae6da');
      // bec de gaz mural : tuyau col de cygne + globe
      const B = H.bec;
      pc(bar([B.x - 40, B.y + 60], [B.x - 40, B.y + 20], 7), '#2e2c2a', null, 8009);
      pc(ribbon(qbez([B.x - 40, B.y + 22], [B.x - 36, B.y - 10], [B.x, B.y + 12], 10), 6, 5), '#3a3634', null, 8010);
      pc(rect(B.x - 52, B.y + 56, B.x - 28, B.y + 70), '#4a4440', null, 8011);
      pc(rect(B.x - 8, B.y + 10, B.x + 8, B.y + 18), '#3a3634', null, 8013); pc(ell(B.x, B.y - 6, 17, 19, 16), 'rgba(235,232,215,0.55)', () => { strokePts([[B.x - 9, B.y - 16], [B.x - 11, B.y - 2]], 'rgba(255,255,255,0.7)', 1.6); hatch(null, 0.6, 4, 0.1); }, 8012, { texA: 0.1 }); pc(rect(B.x - 6, B.y - 30, B.x + 6, B.y - 22), '#3a3634', null, 8015);
      // étagère murale (planche + consoles) — les fioles sont dessinées vivantes
      const E = H.etagere;
      pc(rect(E.x0, E.y, E.x1, E.y + 14), '#7a5634', () => { strokePts([[E.x0, E.y + 2], [E.x1, E.y + 2]], 'rgba(255,230,190,0.35)', 1.4); hatch(null, 0.05, 4, 0.2); }, 8013);
      for (const x of [E.x0 + 30, E.x1 - 30]) pc([[x - 4, E.y + 14], [x + 4, E.y + 14], [x + 4, E.y + 60], [x - 30, E.y + 14]], '#2e2c2a', null, 8014 + x);
      // seconde planche haute : flacons bruns, mortier
      pc(rect(E.x0 + 30, E.y - 150, E.x1, E.y - 138), '#7a5634', () => hatch(null, 0.05, 4, 0.2), 8020);
      for (let i = 0; i < 5; i++) { const x = E.x0 + 50 + i * 40, h = 30 + 14 * hash(i * 4); pc(rrect(x - 11, E.y - 150 - h, x + 11, E.y - 150, 5), i % 2 ? '#5a3a22' : '#3e4a3a', () => { fillPts(rect(x - 11, E.y - 150 - h * 0.6, x + 11, E.y - 150 - h * 0.3), '#d8d0bc'); strokePts([[x - 6, E.y - 150 - h + 4], [x - 6, E.y - 154]], 'rgba(255,255,255,0.3)', 1.2); }, 8021 + i); }
    });
  }
  // ---- plan intermédiaire : poêle, tuyau, sacs, chaudron (sans contenu), paillasse et instruments
  function makeMilieu() {
    return M.pre(1080, 1400, (c) => {
      const Po = H.poele;
      // tuyau du poêle : de la plaque jusqu'au collier dans le mur, raccord à mi-hauteur
      pc(rect(Po.x - 13, Po.tuyauHaut, Po.x + 13, 1196), '#2c2a2a', () => { strokePts([[Po.x - 6, Po.tuyauHaut], [Po.x - 6, 1196]], 'rgba(255,255,255,0.18)', 2.2); }, 8101);
      pc(rect(Po.x - 18, Po.raccord[1] - 8, Po.x + 18, Po.raccord[1] + 8), '#3a3836', null, 8102);
      pc(ribbon(qbez([Po.x, Po.tuyauHaut + 10], [Po.x, Po.tuyauHaut - 30], [Po.x - 44, Po.tuyauHaut - 34], 10), 26, 26), '#2c2a2a', null, 8103);
      pc(ell(Po.x - 52, Po.tuyauHaut - 34, 8, 22, 12), '#4a4440', null, 8104);
      // poêle en fonte (cylindre, couronne, pieds)
      pc([[Po.x - 44, 1196], [Po.x + 44, 1196], [Po.x + 48, 1214], [Po.x + 44, 1372], [Po.x - 44, 1372], [Po.x - 48, 1214]], '#2a2828', () => {
        for (let y = 1226; y < 1366; y += 18) strokePts([[Po.x - 44, y], [Po.x + 44, y]], 'rgba(255,255,255,0.08)', 1.4);
        strokePts([[Po.x - 30, 1206], [Po.x - 30, 1366]], 'rgba(255,255,255,0.16)', 3);
        fillPts(rect(Po.x - 30, Po.porte[1] - 30, Po.x + 30, Po.porte[1] + 28), '#151313');
        shade(Po.x - 48, 0, Po.x + 48, 0, 0.3, [Po.x - 50, 1190, Po.x + 50, 1380]);
      }, 8105);
      pc([[Po.x - 54, 1184], [Po.x + 54, 1184], [Po.x + 48, 1198], [Po.x - 48, 1198]], '#3a3836', null, 8106);
      for (const dx of [-34, 34]) pc([[Po.x + dx - 6, 1370], [Po.x + dx + 6, 1370], [Po.x + dx + 10, BACK + 4], [Po.x + dx - 10, BACK + 4]], '#222020', null, 8107 + dx);
      fillPts(rect(Po.x + 32, Po.porte[1] - 8, Po.x + 40, Po.porte[1] + 8), '#8a7a5a');                       // poignée de porte
      // sacs de jute entassés à gauche
      const sacs = [[64, BACK + 2, 0.06], [140, BACK + 4, -0.05], [98, BACK - 84, 0.04], [36, BACK - 70, -0.08], [76, BACK - 160, 0.1]];
      sacs.forEach(([x, y, a], i) => { c.save(); c.translate(x, y); c.rotate(a); c.scale(0.92, 0.92); drawSac({ tint: hash(i * 3.3) }); c.restore(); });
      // chaudron de fonte sur trépied
      const Ch = H.chaudron;
      for (const [dx, a] of [[-56, -0.18], [56, 0.18], [0, 0]]) pc(bar([Ch.x + dx * 0.4, Ch.bord + 40], [Ch.x + dx, BACK + 2], dx ? 9 : 7), '#262424', null, 8110 + dx + a);
      pc(ep(Ch.x, Ch.bord, 64, 74, 16, 0, PI).concat([[Ch.x - 68, Ch.bord - 2], [Ch.x + 68, Ch.bord - 2]]), '#2a2828', () => {
        strokePts(ep(Ch.x, Ch.bord, 52, 60, 12, 0.3, 1.2), 'rgba(255,255,255,0.18)', 3);
        hatch(null, 0.5, 4, 0.2, 1, '0,0,0'); shade(Ch.x - 64, 0, Ch.x + 64, 0, 0.3, [Ch.x - 70, Ch.bord - 4, Ch.x + 70, Ch.bord + 80]);
      }, 8115);
      pc(ell(Ch.x, Ch.bord, 70, 9, 16), '#3a3836', () => fillPts(ell(Ch.x, Ch.bord + 1, 60, 6, 16), '#141212'), 8116);
      for (const sx of [-1, 1]) strokePts(ep(Ch.x + sx * 70, Ch.bord + 10, 10, 12, 8, -PI / 2, PI / 2).map((p) => [Ch.x + sx * 70 + sx * (p[0] - Ch.x - sx * 70), p[1]]), '#2a2828', 4);
      // pierres du foyer sous le chaudron
      for (let i = 0; i < 7; i++) pc(blob(Ch.x - 54 + i * 18, BACK - 6, 11, 8, 900 + i, 9), '#5a544c', () => hatch(null, 0.6, 3, 0.2), 8120 + i);
      // paillasse de bois : plateau, pieds, traverse, tiroirs
      const Pa = H.paillasse;
      pc(rect(Pa.x0, Pa.y, Pa.x1, Pa.y + 22), '#8a6238', () => { hatch(null, 0.05, 4, 0.2); strokePts([[Pa.x0, Pa.y + 2], [Pa.x1, Pa.y + 2]], 'rgba(255,230,190,0.35)', 1.6); for (const x of [700, 820, 940]) fillPts(ell(x, Pa.y + 10, 10, 3, 8), 'rgba(40,30,20,0.25)'); }, 8130);
      pc(rect(Pa.x0 + 160, Pa.y + 22, Pa.x1 - 10, Pa.y + 80), '#76522e', () => { for (const x of [Pa.x0 + 160, Pa.x0 + 260]) { strokePts(rect(x + 6, Pa.y + 28, x + 94, Pa.y + 74).concat([[x + 6, Pa.y + 28]]), 'rgba(30,20,10,0.45)', 1.2); dot(x + 50, Pa.y + 50, 3, '#c9a24e'); } }, 8131);
      for (const x of [Pa.x0 + 14, Pa.x1 - 24]) pc(rect(x - 10, Pa.y + 22, x + 10, BACK + 4), '#6e4c2a', () => hatch(null, 0.1, 4, 0.2), 8132 + x);
      pc(rect(Pa.x0 + 14, 1330, Pa.x1 - 24, 1342), '#6e4c2a', null, 8134);
      // cornues et ballons sur support
      const y0 = Pa.y;
      pc(bar([768, y0], [768, y0 - 130], 4), '#3a3836', null, 8140); pc(rect(748, y0 - 4, 790, y0), '#3a3836', null, 8141); pc(bar([768, y0 - 96], [800, y0 - 96], 3), '#3a3836', null, 8142);
      pc(ep(800, y0 - 76, 22, 20, 14, -PI * 0.2, PI * 1.6).concat([[814, y0 - 92]]), 'rgba(200,226,232,0.55)', () => { fillPts(ep(800, y0 - 70, 20, 14, 10, 0.2, PI - 0.2), 'rgba(170,120,60,0.55)'); strokePts([[790, y0 - 88], [786, y0 - 74]], 'rgba(255,255,255,0.7)', 1.4); }, 8143, { texA: 0.12 });
      pc(ribbon([[816, y0 - 90], [832, y0 - 116], [846, y0 - 128]], 8, 4), 'rgba(200,226,232,0.6)', null, 8144, { texA: 0.12 });       // col de cornue
      pc(ep(990, y0 - 22, 20, 20, 14, -PI * 0.35, PI * 1.35).concat([[995, y0 - 40], [995, y0 - 62], [985, y0 - 62], [985, y0 - 40]]), 'rgba(200,226,232,0.55)', () => { fillPts(ep(990, y0 - 18, 19, 14, 10, 0.1, PI - 0.1), 'rgba(120,160,90,0.5)'); }, 8145, { texA: 0.12 });
      // balance de précision sous cloche de verre
      const Ba = H.balance;
      pc(rect(Ba.x - 38, Ba.y - 12, Ba.x + 38, Ba.y), '#5a3a22', () => strokePts([[Ba.x - 36, Ba.y - 10], [Ba.x + 36, Ba.y - 10]], 'rgba(255,230,190,0.3)', 1.2), 8150);
      strokePts([[Ba.x, Ba.y - 12], [Ba.x, Ba.y - 84]], '#b08d45', 2.4); strokePts([[Ba.x - 24, Ba.y - 80], [Ba.x + 24, Ba.y - 80]], '#b08d45', 2);
      for (const sx of [-1, 1]) { strokePts([[Ba.x + sx * 22, Ba.y - 80], [Ba.x + sx * 22, Ba.y - 46]], '#8a7040', 1); fillPts(ep(Ba.x + sx * 22, Ba.y - 46, 11, 4, 8, 0, PI), '#b08d45'); }
      pc(ep(Ba.x, Ba.y - 64, 32, 54, 18, PI, TAU).concat([[Ba.x + 32, Ba.y - 12], [Ba.x - 32, Ba.y - 12]]), 'rgba(220,235,240,0.22)', () => { strokePts(ep(Ba.x, Ba.y - 64, 26, 46, 12, PI * 1.1, PI * 1.45), 'rgba(255,255,255,0.65)', 2); }, 8151, { texA: 0.08 });
      dot(Ba.x, Ba.y - 122, 4, 'rgba(220,235,240,0.5)');
      // lampe à pétrole (pied de laiton, réservoir, verre de lampe) — la flamme est vivante
      const L = H.lampe;
      pc([[L.x - 18, L.y], [L.x + 18, L.y], [L.x + 8, L.y - 18], [L.x + 4, L.y - 40], [L.x - 4, L.y - 40], [L.x - 8, L.y - 18]], '#a8843e', () => strokePts([[L.x - 3, L.y - 38], [L.x - 6, L.y - 4]], 'rgba(255,240,200,0.6)', 1.4), 8160);
      pc(ell(L.x, L.y - 54, 20, 16, 14), 'rgba(170,200,190,0.6)', () => fillPts(ep(L.x, L.y - 52, 18, 12, 10, 0.3, PI - 0.3), 'rgba(160,120,50,0.55)'), 8161, { texA: 0.12 });
      pc(rect(L.x - 10, L.y - 74, L.x + 10, L.y - 66), '#8a6c32', null, 8162);
      pc([[L.x - 9, L.y - 74], [L.x + 9, L.y - 74], [L.x + 12, L.y - 90], [L.x + 7, L.y - 112], [L.x - 7, L.y - 112], [L.x - 12, L.y - 90]], 'rgba(230,240,240,0.3)', () => strokePts([[L.x - 5, L.y - 108], [L.x - 8, L.y - 80]], 'rgba(255,255,255,0.7)', 1.3), 8163, { texA: 0.08 });
      // carnets empilés et mortier sur la paillasse (côté droit)
      pc(rect(912, y0 - 16, 940, y0), '#2a2a30', null, 8170); pc(rect(910, y0 - 26, 938, y0 - 16), '#4a3a2a', null, 8171);
    });
  }
  // ---- premier plan (CUR.hangarSol) : bassine, seau en zinc, tabouret, caisse, pelle, pots de grès
  function makeSol() {
    const S = {};
    S.base = M.pre(1080, 1600, (c) => {
      // bassine de zinc (gauche)
      pc([[52, 1430], [152, 1430], [142, 1468], [62, 1468]], '#8e979c', () => { strokePts([[56, 1434], [148, 1434]], 'rgba(255,255,255,0.5)', 1.6); hatch(null, 0.2, 4, 0.15); }, 8201);
      pc(ell(102, 1430, 52, 7, 16), '#9aa3a8', () => fillPts(ell(102, 1431, 44, 4, 14), '#5a6870'), 8202);
      // caisse en bois (droite) + pelle appuyée + pots de grès
      pc(rect(846, 1388, 950, 1470), '#9a7444', () => { for (const y of [1412, 1440]) strokePts([[846, y], [950, y]], 'rgba(40,25,10,0.45)', 1.4); strokePts([[846, 1388], [950, 1470]], 'rgba(40,25,10,0.3)', 3); for (const [x, y] of [[852, 1394], [944, 1394], [852, 1464], [944, 1464]]) dot(x, y, 2, '#3a3028'); hatch(null, 0.05, 4, 0.18); }, 8203);
      pc(bar([958, 1470], [930, 1250], 7), '#7a5a36', null, 8204);
      pc([[946, 1468], [976, 1468], [980, 1436], [972, 1420], [950, 1422], [944, 1440]], '#4a4a4e', () => strokePts([[950, 1430], [974, 1430]], 'rgba(255,255,255,0.3)', 1.2), 8205);
      for (const [x, h, col] of [[1000, 70, '#b39a72'], [1030, 52, '#9a7e58']]) pc(ep(x, 1470 - h * 0.55, 18, h * 0.55, 12, -PI * 0.42, PI * 1.42).concat([[x - 8, 1470 - h], [x + 8, 1470 - h]]), col, () => { strokePts([[x - 14, 1470 - h * 0.6], [x + 14, 1470 - h * 0.6]], 'rgba(90,60,30,0.5)', 1.6); hatch(null, 0.9, 3.6, 0.2); }, 8206 + x);
      // éclats de minerai noir sur le plancher
      for (let i = 0; i < 14; i++) { const x = i < 7 ? 60 + i * 26 + 10 * hash(i) : 800 + (i - 7) * 22 + 10 * hash(i), y = 1476 + 30 * hash(i * 3.1); fillPts(blob(x, y, 4 + 3 * hash(i * 2), 3, 950 + i, 6), '#24221f'); }
    });
    S.seau = M.pre(1080, 1600, () => {
      pc([[176, 1388], [230, 1388], [224, 1458], [182, 1458]], '#9aa3a8', () => { for (const y of [1404, 1440]) strokePts([[178, y], [228, y]], 'rgba(60,70,76,0.5)', 1.6); strokePts([[186, 1394], [190, 1452]], 'rgba(255,255,255,0.4)', 2.4); }, 8210);
      pc(ell(203, 1388, 28, 5, 14), '#aab3b8', () => fillPts(ell(203, 1389, 24, 3, 12), '#4a5860'), 8211);
      strokePts(ep(203, 1392, 30, 34, 12, PI * 1.05, PI * 1.95), '#4a4f54', 2);
    });
    S.tabouret = M.pre(1080, 1600, () => {
      pc(rect(760, 1376, 830, 1388), '#7a5634', () => strokePts([[762, 1378], [828, 1378]], 'rgba(255,230,190,0.3)', 1.2), 8220);
      for (const [a, b] of [[[768, 1388], [756, 1462]], [[822, 1388], [834, 1462]], [[795, 1388], [795, 1456]]]) pc(bar(a, b, 6), '#6a4a2c', null, 8221 + a[0]);
      pc(bar([762, 1430], [828, 1430], 4), '#6a4a2c', null, 8224);
    });
    return S;
  }
  let K = null;
  CUR.init = function () {
    if (K) return CUR;
    K = CUR.K = { vueJ: makeVue(false), vueN: makeVue(true), fond: makeFond(), milieu: makeMilieu(), sol: makeSol() };
    return CUR;
  };
  // fiole d'étagère (vivante : lueur qui pulse en temps global)
  function fioleEtagere(i, x, y, lu, t) {
    const c = cx_(); c.save(); c.translate(x, y); c.scale(0.82, 0.82);
    drawFiole({ lueur: lu, t, ph: i * 1.3, taille: 0.9 + 0.12 * hash(i * 4.4) }); c.restore();
  }
  // goutte : u 0..1 (0–0,3 elle se forme au bord de la verrière, puis tombe jusqu'à y1) ; renvoie [x, y]
  CUR.gouttePt = function (u, o) {
    o = o || {}; const x = o.goutteX == null ? H.goutte.x : o.goutteX, y0 = o.goutteY0 == null ? H.goutte.y0 : o.goutteY0, y1 = o.goutteY == null ? H.goutte.y1 : o.goutteY;
    u = clamp(u); const f = u < 0.3 ? 0 : Math.pow((u - 0.3) / 0.7, 2);
    return [x, lerp(y0, y1, f)];
  };
  function goutte(u, o) {
    if (u <= 0 || u >= 1 || SIL()) return;
    const p = CUR.gouttePt(u, o), grow = smooth(0, 0.3, u), fall = u > 0.3;
    const r = lerp(3, 8, grow), el = fall ? 1.5 : lerp(1, 1.3, grow);
    const c = cx_(); c.save(); c.translate(p[0], p[1] + (fall ? 0 : r * el));
    c.beginPath(); c.moveTo(0, -r * el * 1.6); c.quadraticCurveTo(r * 1.1, -r * 0.2, r, r * 0.3); c.arc(0, r * 0.3, r, 0, PI); c.quadraticCurveTo(-r * 1.1, -r * 0.2, 0, -r * el * 1.6);
    c.fillStyle = '#a8d8f2'; c.fill(); c.strokeStyle = '#2a4a66'; c.lineWidth = 1.6; c.stroke();
    c.beginPath(); c.arc(-r * 0.35, 0, r * 0.28, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.9)'; c.fill();
    c.restore();
  }
  // CUR.hangar(t, up, o) — toute la toile de fond et le plan intermédiaire (avant M.drawFloor)
  //   o : nuit 0..1 · pluie 0..1 · fiolesLueur 0..1 · goutte 0..1 (+ goutteX, goutteY0, goutteY) · lampe 0..1 (défaut : allumée la nuit) · bec 0..1 (défaut 0)
  //       vapeur 0..1 (chaudron, défaut 0,6) · bouffee 0..1 (bouffée du raccord du poêle) · dore 0..1 (lumière basse dorée) · fioles (false : étagère vide)
  CUR.hangar = function (t, up, o) {
    o = o || {}; up = up || 0; CUR.init();
    const c = cx_(), g = M.tg(t), nu = clamp(o.nuit || 0), pl = clamp(o.pluie || 0), fl = clamp(o.fiolesLueur || 0);
    const lampe = o.lampe == null ? smooth(0.3, 0.7, nu) : clamp(o.lampe), bec = clamp(o.bec || 0), vap = o.vapeur == null ? 0.6 : clamp(o.vapeur);
    c.save(); c.translate(0, -up);
    // 1) la vue par la verrière
    c.save(); clipTrap(c);
    c.drawImage(K.vueJ, 0, 0);
    if (nu > 0) { c.globalAlpha = nu; c.drawImage(K.vueN, 0, 0); c.globalAlpha = 1; }
    if (nu < 1) { c.globalAlpha = 1 - nu; M.nuages(t, { y0: V.yt + 20, y1: V.yt + 160, n: 4, vit: 9, s: 0.55, seed: 17, brume: 0.2 + 0.3 * pl }); c.globalAlpha = 1; }
    M.fumee(t, { x: 262, y: V.yb - 70, s: 0.26, n: 5, haut: 150, vent: 50, col: nu > 0.5 ? '#3a4058' : '#c9c6c0', a: 0.5, seed: 4 });
    M.fumee(t, { x: 746, y: V.yb - 96, s: 0.24, n: 5, haut: 140, vent: 50, col: nu > 0.5 ? '#3a4058' : '#c9c6c0', a: 0.45, seed: 8 });
    if (pl > 0) { c.fillStyle = `rgba(60,70,84,${0.38 * pl})`; c.fillRect(0, 140, 1080, 420); }
    c.restore();
    // 2) toile de fond
    c.drawImage(K.fond, 0, 0);
    // pluie sur la verrière : gouttes qui glissent le long des carreaux
    if (pl > 0 && !SIL()) {
      c.save(); clipTrap(c);
      for (let i = 0; i < 46; i++) {
        const s = hash(i * 3.17), u = (g * (0.22 + 0.18 * hash(i * 5.3)) + hash(i * 7.1)) % 1, w = Math.pow(u, 1.2);
        const x = lerp(lerp(V.xt0, V.xt1, s), lerp(V.xb0, V.xb1, s), w), y = lerp(V.yt, V.yb, w);
        const x2 = lerp(lerp(V.xt0, V.xt1, s), lerp(V.xb0, V.xb1, s), Math.max(0, w - 0.06)), y2 = lerp(V.yt, V.yb, Math.max(0, w - 0.06));
        strokePts([[x2, y2], [x, y]], `rgba(220,236,246,${0.45 * pl})`, 1.4); dot(x, y, 2.2, `rgba(235,245,252,${0.75 * pl})`);
      }
      for (let i = 0; i < 40; i++) { const s = hash(i * 9.7), w = hash(i * 4.9); dot(lerp(lerp(V.xt0, V.xt1, s), lerp(V.xb0, V.xb1, s), w), lerp(V.yt, V.yb, w), 1.5, `rgba(235,245,252,${0.5 * pl})`); }
      c.restore();
    }
    // 3) plan intermédiaire
    c.drawImage(K.milieu, 0, 0);
    const Ch = H.chaudron, Po = H.poele;
    // chaudron : bain sombre qui bout (bulles), braises, petites flammes
    fillPts(ell(Ch.x, Ch.bord + 1, 58, 5.5, 16), '#3e4a3a');
    if (!SIL()) for (let i = 0; i < 6; i++) { const u = (g * 1.4 + hash(i * 2.7)) % 1, bx = Ch.x - 44 + 88 * hash(i * 5.1); if (u < 0.75) strokePts(ep(bx, Ch.bord, 3 + 6 * u, 2 + 3 * u, 8, PI, TAU), `rgba(150,170,140,${0.8 * (1 - u)})`, 1.4); }
    for (let i = 0; i < 10; i++) dot(Ch.x - 54 + i * 12, BACK - 16 + 3 * Math.sin(i * 2), 5, `rgba(${225 + 25 * Math.sin(g * 3 + i)},${80 + 40 * Math.sin(g * 2.3 + i * 1.7)},36,0.95)`);
    M.flamme(t, { x: Ch.x - 22, y: BACK - 18, s: 0.5, r: 110, seed: 3 }); M.flamme(t, { x: Ch.x + 20, y: BACK - 16, s: 0.42, r: 80, seed: 6 });
    M.fumee(t, { x: Ch.x, y: Ch.bord - 6, s: 0.5 + 0.3 * vap, n: 6, haut: 220 + 200 * vap, vent: 26, col: '#dcd8d0', a: 0.3 + 0.45 * vap, per: 3.4, seed: 21 });
    // poêle : porte rougeoyante, fumée qui s'échappe du raccord du tuyau, bouffée
    if (!SIL()) { const fk = 0.75 + 0.25 * Math.sin(g * 9) * Math.sin(g * 3.3); for (let x = -22; x <= 22; x += 11) fillPts(rect(Po.x + x - 3, Po.porte[1] - 18, Po.x + x + 3, Po.porte[1] + 18), `rgba(255,${120 + 50 * fk},50,${0.55 + 0.3 * fk})`); }
    M.fumee(t, { x: Po.raccord[0] + 14, y: Po.raccord[1], s: 0.3, n: 4, haut: 160, vent: 24, col: '#bdb6aa', a: 0.42, per: 4, seed: 9 });
    if (o.bouffee > 0 && o.bouffee < 1 && !SIL()) {
      const u = clamp(o.bouffee);
      for (let i = 0; i < 7; i++) { const a = -PI / 2 + (i - 3) * 0.4, d = 20 + 90 * Math.sqrt(u) * (0.7 + 0.5 * hash(i)); fillPts(blob(Po.raccord[0] + 20 + Math.cos(a) * d * 0.6 + 40 * u, Po.raccord[1] + Math.sin(a) * d, 18 + 30 * u, 16 + 24 * u, 700 + i, 9), `rgba(70,64,60,${0.7 * (1 - u)})`); }
    }
    // fioles de l'étagère
    if (o.fioles !== false) H.etagere.fioles.forEach((p, i) => fioleEtagere(i, p[0], p[1], fl, t));
    // 4) nuit : tout s'assombrit, puis les sources de lumière
    if (nu > 0) { c.fillStyle = `rgba(10,14,36,${0.62 * nu})`; c.fillRect(0, 140, 1080, BACK + 8 - 140); }
    if (o.dore > 0) { c.fillStyle = `rgba(150,90,30,${0.22 * clamp(o.dore)})`; c.fillRect(0, 140, 1080, BACK + 8 - 140); }
    if (nu > 0.05) { c.save(); clipTrap(c); glow(770, 340, 90, '220,220,190', 0.3 * nu); c.restore(); }
    glow(Ch.x, BACK - 20, 110, '255,130,50', 0.22 + 0.08 * Math.sin(g * 5));
    glow(Po.porte[0], Po.porte[1], 70, '255,130,50', 0.18 + 0.2 * nu);
    if (fl > 0 && o.fioles !== false) H.etagere.fioles.forEach((p, i) => glowFiole({ lueur: fl, t, ph: i * 1.3, taille: 0.8 }, p[0], p[1] - 4));
    if (lampe > 0) { c.save(); c.globalAlpha = lampe; M.flamme(t, { x: H.lampe.flamme[0], y: H.lampe.flamme[1], s: 0.42, r: 160, seed: 14 }); c.restore(); glow(H.lampe.flamme[0], H.lampe.flamme[1] - 8, 230, '255,200,120', 0.25 * lampe); }
    if (bec > 0) { c.save(); c.globalAlpha = bec; M.flamme(t, { x: H.bec.x, y: H.bec.y + 4, s: 0.38, r: 120, seed: 15 }); c.restore(); glow(H.bec.x, H.bec.y - 4, 190, '255,220,150', 0.22 * bec); }
    // 5) rayon de la verrière + poussière (le jour)
    const ra = (1 - nu) * (1 - 0.7 * pl) * (o.rayon == null ? 1 : clamp(o.rayon));
    if (ra > 0.02 && !SIL()) {
      const poly = [[V.xb0 + 290, V.yb], [V.xb1 - 250, V.yb], [760, BACK], [380, BACK]];
      c.save(); c.globalCompositeOperation = 'lighter'; c.beginPath(); poly.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
      const gr = c.createLinearGradient(0, V.yb, 0, BACK); gr.addColorStop(0, `rgba(255,240,210,${0.13 * ra})`); gr.addColorStop(1, 'rgba(255,240,210,0.015)'); c.fillStyle = gr; c.fill(); c.clip();
      M.poussiere(t, { x: 360, y: V.yb, w: 420, h: BACK - V.yb, n: 40, a: 0.7 * ra, seed: 31 });
      c.restore();
    }
    // 6) goutte qui tombe du toit (tache d'humidité sur la sablière quand il pleut)
    if (pl > 0 || o.goutte > 0) { const gx = o.goutteX == null ? H.goutte.x : o.goutteX; fillPts(ell(gx, (o.goutteY0 == null ? H.goutte.y0 : o.goutteY0) - 4, 16, 6, 10), `rgba(30,40,50,${0.35 * Math.max(pl, o.goutte > 0 ? 1 : 0)})`); }
    goutte(o.goutte || 0, o);
    c.restore();
  };
  // CUR.hangarSol(t, up, o) — premier plan, APRÈS M.drawFloor() et avant les marionnettes ; o.seau / o.tabouret (false = retirés)
  CUR.hangarSol = function (t, up, o) {
    o = o || {}; up = up || 0; CUR.init();
    const c = cx_(); c.save(); c.translate(0, -up);
    if (!SIL()) { c.fillStyle = 'rgba(40,30,20,0.16)'; c.fillRect(46, BACK, 988, 250); }
    c.drawImage(K.sol.base, 0, 0);
    if (o.seau !== false) c.drawImage(K.sol.seau, 0, 0);
    if (o.tabouret !== false) c.drawImage(K.sol.tabouret, 0, 0);
    c.restore();
  };
})();
