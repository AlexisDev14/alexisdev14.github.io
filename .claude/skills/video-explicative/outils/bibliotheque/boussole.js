// persos.js — « La boussole, un aimant qui pointe vers un pôle sud » : marionnettes et accessoires PROPRES À CETTE VIDÉO. Espace M.bou (alias BOU). Appeler BOU.init() dans S.init.
// Aucun texte, lettre, chiffre ni logo. Déterministe (M.hash, aucun Math.random). Mode d'emploi : persos.md (ne pas lire ce fichier en entier).
// Code couleur des pôles : « nord » = ROUGE brique #a8362e, « sud » = BLEU ardoise #3f5f86.
//   BOU.capitaine(pose,x,y,s,o)  marionnette (casquette blanche à visière noire, moustache rousse cirée, caban bleu marine, pantalon crème, bottes)
//   BOU.boussole(x,y,s,o)        boussole de laiton (x,y = centre du cadran) ; o.ang, tremble, arcs, etincelles, t
//   BOU.globe(x,y,s,o)           globe-aimant sur pied (x,y = dessous du pied) ; o.ouvert, calotte, aimant, halo, t
//   BOU.aimant(x,y,s,o)          aimant-barre (x,y = milieu) ; o.ang, halo, t
(function () {
  'use strict';
  const X = M.X, P = M.P, TAU = M.TAU, PI = Math.PI, D = 180 / PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, hash } = M;
  const BOU = (M.bou = {});
  const CH = M.chars;
  const cx_ = () => M.ctx();
  const SIL = () => M._sil();
  const OFFP = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];
  const ROUGE = '#a8362e', ROUGED = '#7e2620', ROUGEL = '#c9584c', BLEU = '#3f5f86', BLEUD = '#2c4563', BLEUL = '#6383ab';
  const LAITON = '#b08d45', LAITONL = '#d9bd72', LAITOND = '#76592a';
  BOU.COUL = { rouge: ROUGE, bleu: BLEU };

  // ------------------------------------------------------------ géométrie
  function ep(cx, cy, rx, ry, n, a0, a1) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; }
  function ell(cx, cy, rx, ry, n) { const o = ep(cx, cy, rx, ry, n || 16, 0, TAU); o.pop(); return o; }
  const mp = (m, p) => [m.a * p[0] + m.c * p[1] + m.e, m.b * p[0] + m.d * p[1] + m.f];
  function rrect(x0, y0, x1, y1, r) {
    return ep(x1 - r, y0 + r, r, r, 4, -PI / 2, 0).concat(ep(x1 - r, y1 - r, r, r, 4, 0, PI / 2), ep(x0 + r, y1 - r, r, r, 4, PI / 2, PI), ep(x0 + r, y0 + r, r, r, 4, PI, PI * 1.5));
  }
  const pc = (pts, base, paint, seed, o) => piece(pts, base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));
  function clipPath(pts) { const c = cx_(); c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.clip(); }

  // bras à articulations rondes (épaule et coude en demi-cercles centrés sur le pivot)
  const R_COUDE = 12, LA = 96;
  function armR(len, wt) { wt = wt || 16; return ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1, 40], [R_COUDE + 0.5, len - 6]], ep(0, len, R_COUDE, R_COUDE, 10, 0, PI), [[-R_COUDE - 0.5, len - 6], [-wt + 1, 40]]); }
  function foreR(kind) { const f = X.forePts(kind); return ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU).concat(f.slice(2)); }

  // =====================================================================
  // AIMANT-BARRE (dessin commun : seul, dans le globe, tenu)
  //   origine = milieu ; vertical ; BLEU en haut (y < 0), ROUGE en bas
  // =====================================================================
  function drawBarreau(L, W, seed) {
    const h = L / 2, w = W / 2, r = Math.min(10, w * 0.45);
    pc(rrect(-w, -h, w, 0.5, r).slice(0, 5).concat([[w, 0.5, 1], [-w, 0.5, 1]], rrect(-w, -h, w, 0.5, r).slice(15)), BLEU, () => {
      fillPts([[-w, -h, 1], [-w + W * 0.28, -h, 1], [-w + W * 0.28, 0, 1], [-w, 0, 1]], BLEUL);
      fillPts([[w - W * 0.22, -h, 1], [w, -h, 1], [w, 0, 1], [w - W * 0.22, 0, 1]], BLEUD);
      strokePts([[-w + W * 0.16, -h + 8], [-w + W * 0.16, -8]], 'rgba(255,255,255,0.45)', 1.6);
      hatch([[w - W * 0.3, -h], [w, -h], [w, 0], [w - W * 0.3, 0]], 0.9, 3.4, 0.3);
    }, (seed || 0) + 1);
    pc([[-w, -0.5, 1], [w, -0.5, 1]].concat(rrect(-w, -1, w, h, r).slice(5, 15)), ROUGE, () => {
      fillPts([[-w, 0, 1], [-w + W * 0.28, 0, 1], [-w + W * 0.28, h, 1], [-w, h, 1]], ROUGEL);
      fillPts([[w - W * 0.22, 0, 1], [w, 0, 1], [w, h, 1], [w - W * 0.22, h, 1]], ROUGED);
      strokePts([[-w + W * 0.16, 8], [-w + W * 0.16, h - 8]], 'rgba(255,255,255,0.4)', 1.6);
      hatch([[w - W * 0.3, 0], [w, 0], [w, h], [w - W * 0.3, h]], 0.9, 3.4, 0.3);
    }, (seed || 0) + 2);
    strokePts([[-w + 1, 0], [w - 1, 0]], 'rgba(30,20,20,0.55)', 1.4);
  }
  const AIM = { L: 220, W: 46 };
  function drawAimant(o) {
    const t = o.t || 0, hl = o.halo, c = cx_();
    c.save(); c.rotate(o.ang || 0);
    if (hl && !SIL()) {
      const a = 0.45 + 0.12 * Math.sin(t * 4);
      for (const [y, col] of [[-AIM.L / 2, '110,150,215'], [AIM.L / 2, '220,110,90']]) {
        const g = c.createRadialGradient(0, y, 4, 0, y, 70); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`);
        c.fillStyle = g; c.fillRect(-80, y - 80, 160, 160);
      }
    }
    drawBarreau(AIM.L, AIM.W, 7100); c.restore();
  }

  // =====================================================================
  // BOUSSOLE — origine = centre du cadran ; boîtier R 100 ; anneau en haut (sommet y −138)
  // =====================================================================
  const BS = { R: 100, top: -138 };
  BOU.BS = BS;
  function aiguilleAng(o) { const t = o.t || 0, k = clamp(o.tremble || 0); return (o.ang || 0) + k * (0.13 * Math.sin(t * 29) + 0.07 * Math.sin(t * 47 + 1.3)); }
  function drawArcs(o) {
    const k = clamp(o.arcs || 0); if (k <= 0 || SIL()) return;
    const c = cx_(), t = o.t || 0, a = aiguilleAng(o);
    c.save(); c.rotate(a);
    c.beginPath(); c.rect(-400, -400, 800, 800); c.arc(0, 0, BS.R + 4, 0, TAU, true); c.clip('evenodd');
    c.lineCap = 'round'; c.setLineDash([14, 10]); c.lineDashOffset = -t * 40;
    for (const [i, L0] of [[0, 150], [1, 205], [2, 265]].map((v) => v)) {
      for (const sd of [1, -1]) {
        c.beginPath();
        for (let j = 0; j <= 40; j++) { const th = 0.12 + (PI - 0.24) * j / 40, rr = L0 * Math.sin(th) * Math.sin(th); const px = sd * rr * Math.sin(th), py = -rr * Math.cos(th); j ? c.lineTo(px, py) : c.moveTo(px, py); }
        c.strokeStyle = `rgba(225,238,255,${(0.75 - i * 0.18) * k})`; c.lineWidth = 3.2 - i * 0.6; c.stroke();
      }
    }
    c.restore();
  }
  function drawEtincelles(o) {
    const k = clamp(o.etincelles || 0); if (k <= 0 || SIL()) return;
    const c = cx_(), t = o.t || 0;
    for (let i = 0; i < 9; i++) {
      const ph = (t * 2.6 + hash(i * 7.1)) % 1; if (ph > 0.45) continue;
      const v = Math.sin(PI * ph / 0.45) * k, an = TAU * hash(i * 3.7 + Math.floor(t * 2.6 + hash(i * 7.1)) * 1.3), rr = BS.R + 14 + 26 * hash(i + 11);
      const x = Math.cos(an) * rr, y = Math.sin(an) * rr, z = 9 + 8 * v;
      c.save(); c.translate(x, y); c.rotate(an); c.lineCap = 'round';
      c.strokeStyle = `rgba(255,236,170,${0.95 * v})`; c.lineWidth = 2.6;
      c.beginPath(); c.moveTo(-z, 0); c.lineTo(z, 0); c.moveTo(0, -z * 0.6); c.lineTo(0, z * 0.6); c.stroke();
      c.fillStyle = `rgba(255,255,240,${v})`; c.beginPath(); c.arc(0, 0, 2.6, 0, TAU); c.fill();
      c.restore();
    }
  }
  function drawBoussole(o) {
    const R = BS.R, c = cx_();
    drawArcs(o);
    // anneau de suspension + tige moletée
    pc(ep(0, -122, 17, 17, 18, 0, TAU).concat(ep(0, -122, 9, 9, 18, TAU, 0)), LAITON, () => { strokePts(ep(0, -122, 13, 13, 8, PI, PI * 1.6), 'rgba(255,240,190,0.7)', 1.6); hatch(null, 0.6, 3, 0.25); }, 7001);
    pc([[-11, -110, 1], [11, -110, 1], [12, -92, 1], [-12, -92, 1]], LAITOND, () => { for (let x = -9; x <= 9; x += 3.5) strokePts([[x, -109], [x, -93]], 'rgba(40,28,10,0.5)', 1); }, 7002);
    // boîtier
    pc(ell(0, 0, R, R, 44), LAITON, () => {
      fillPts(ell(-6, -6, R - 4, R - 4, 40), LAITONL); fillPts(ell(4, 4, R - 6, R - 6, 40), LAITON);
      hatch([[10, -110], [120, -110], [120, 120], [-110, 120]], 0.75, 3.6, 0.28);
      shade(-60, -60, 70, 70, 0.3, [-110, -110, 110, 110]);
    }, 7003);
    fillPts(ell(0, 0, 89, 89, 40), LAITOND, 7004, 0.2);
    // cadran ivoire, graduations sans chiffres
    fillPts(ell(0, 0, 84, 84, 40), '#ece2c8', 7005, 0.2);
    fillPts(ell(0, 0, 84, 84, 40).filter((p) => p[0] + p[1] > -20).concat([[59, -59], [-59, 59]]), 'rgba(160,130,90,0.12)');
    for (let i = 0; i < 32; i++) {
      const a = i / 32 * TAU, len = i % 8 === 0 ? 15 : i % 4 === 0 ? 11 : i % 2 === 0 ? 7 : 4, s = Math.sin(a), cc = Math.cos(a);
      strokePts([[s * (82 - len), -cc * (82 - len)], [s * 82, -cc * 82]], 'rgba(40,30,25,0.85)', i % 4 === 0 ? 2.2 : 1.2);
    }
    strokePts(ell(0, 0, 66, 66, 36).concat([[66, 0]]), 'rgba(60,45,30,0.55)', 1.1);
    // rose des vents en étoile (sans lettre)
    const rose = (n, Lr, ri, off, cl, cd) => {
      for (let i = 0; i < n; i++) {
        const a = off + i / n * TAU, tip = [Math.sin(a) * Lr, -Math.cos(a) * Lr];
        const l = [Math.sin(a - PI / n) * ri, -Math.cos(a - PI / n) * ri], r = [Math.sin(a + PI / n) * ri, -Math.cos(a + PI / n) * ri];
        fillPts([[0, 0], l, tip], cl, 0, 0); fillPts([[0, 0], tip, r], cd, 0, 0);
      }
    };
    rose(4, 46, 11, PI / 4, '#cdb98a', '#8f7a4c');
    rose(4, 62, 12, 0, '#d8c79c', '#6b5a38');
    strokePts(ell(0, 0, 20, 20, 20).concat([[20, 0]]), 'rgba(60,45,30,0.5)', 1);
    // aiguille losange : ROUGE (nord) / BLEU (sud), pivot en rivet
    c.save(); c.rotate(aiguilleAng(o));
    fillPts([[0, -74], [12, 0], [-12, 0]], ROUGE, 0, 0); fillPts([[0, -74], [0, 0], [-12, 0]], ROUGEL, 0, 0);
    fillPts([[0, 74], [12, 0], [-12, 0]], BLEU, 0, 0); fillPts([[0, 74], [0, 0], [12, 0]], BLEUD, 0, 0);
    strokePts([[0, -74], [12, 0], [0, 74], [-12, 0], [0, -74]], 'rgba(30,20,20,0.6)', 1.1);
    c.restore();
    M.rivet(0, 0, 6);
    // verre bombé : reflets
    fillPts(ep(0, 0, 80, 80, 16, PI * 1.08, PI * 1.42).concat(ep(0, 0, 64, 64, 16, PI * 1.42, PI * 1.08)), 'rgba(255,255,255,0.28)', 0, 0);
    strokePts(ep(0, 0, 76, 76, 12, PI * 1.12, PI * 1.36), 'rgba(255,255,255,0.75)', 2);
    dot(40, 44, 4, 'rgba(255,255,255,0.5)');
    drawEtincelles(o);
  }

  // =====================================================================
  // GLOBE-AIMANT — origine = dessous du pied ; sphère R 200 centrée en (0, −290) ; sommet −490
  // =====================================================================
  const GL = { R: 200, cy: -290, tip: 20, barW: 50, porte: [-80, 80, -122, 122] };
  BOU.GLOBE = { R: GL.R, cy: GL.cy, haut: GL.cy - GL.R, pointe: GL.cy - GL.R - GL.tip };
  const OCEAN = '#9dbdd0', TERRE = '#6f8458', TERRED = '#56693f', GLACE = '#f3f1ea', GLACED = '#c9d3d8';
  const CONT = [
    // Amérique du Nord, Amérique du Sud, Europe-Afrique, Groenland (stylisés)
    [[-150, -120], [-118, -146], [-70, -150], [-40, -132], [-50, -104], [-74, -86], [-82, -62], [-100, -48], [-96, -30], [-118, -40], [-140, -70], [-158, -96]],
    [[-96, -14], [-70, -8], [-46, 6], [-38, 30], [-52, 64], [-64, 104], [-78, 140], [-88, 126], [-90, 82], [-104, 40], [-108, 6]],
    [[30, -138], [60, -150], [92, -140], [104, -116], [86, -100], [96, -80], [120, -66], [138, -40], [150, -6], [140, 30], [120, 64], [100, 104], [82, 122], [70, 96], [64, 56], [50, 24], [30, 6], [12, -22], [18, -50], [40, -64], [26, -86], [14, -110]],
    [[-46, -168], [-14, -180], [8, -172], [0, -152], [-24, -146], [-42, -152]],
  ];
  function paintSurface() {
    // repère de la sphère (centre 0,0)
    for (let i = 0; i < CONT.length; i++) {
      fillPts(CONT[i], TERRE, 7200 + i, 1.2);
      hatch(CONT[i], 0.8, 4.2, 0.22);
      strokePts(CONT[i].concat([CONT[i][0]]), 'rgba(40,50,30,0.45)', 1, false, 7210 + i);
    }
    // méridiens et parallèles
    for (const yy of [-150, -90, 0, 90, 150]) { const rx = Math.sqrt(GL.R * GL.R - yy * yy); strokePts(ep(0, yy, rx, rx * 0.12, 20, 0, PI), 'rgba(50,70,80,0.35)', yy === 0 ? 1.6 : 1); }
    for (const k of [0.3, 0.68]) for (const sd of [1, -1]) strokePts(ep(0, 0, GL.R * k, GL.R, 24, -PI / 2, PI / 2).map((p) => [p[0] * sd, p[1]]), 'rgba(50,70,80,0.3)', 1);
    strokePts([[0, -GL.R], [0, GL.R]], 'rgba(50,70,80,0.3)', 1);
    // glace du pôle sud géographique (fixe)
    fillPts([[-120, 168], [-80, 156], [-40, 166], [0, 158], [40, 166], [84, 156], [124, 168], [124, 240], [-120, 240]], GLACE, 7220, 1);
    hatch([[-120, 160], [124, 160], [124, 240], [-120, 240]], 0.3, 4, 0.18);
  }
  function porteShape() { const [x0, x1, y0, y1] = GL.porte; return rrect(x0, y0, x1, y1, 26); }
  function calottePts() {
    const top = ep(0, 46, 98, 70, 18, PI, TAU);
    return top.concat([[98, 46], [80, 56], [66, 50], [50, 62], [30, 52], [12, 60], [-8, 52], [-28, 62], [-46, 50], [-64, 58], [-80, 50], [-98, 46]]);
  }
  function drawGlobe(o) {
    const t = o.t || 0, R = GL.R, c = cx_(), op = clamp(o.ouvert || 0), ca = clamp(o.calotte || 0), am = o.aimant || 0;
    // halo derrière le globe
    if (o.halo && !SIL()) {
      const col = o.halo === 'bleu' ? '120,170,235' : '255,248,225', a = 0.55 + 0.12 * Math.sin(t * 3.2);
      const g = c.createRadialGradient(0, GL.cy, R * 0.9, 0, GL.cy, R * 1.55);
      g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`);
      c.fillStyle = g; c.fillRect(-R * 1.6, GL.cy - R * 1.6, R * 3.2, R * 3.2);
    }
    // pied et tige de laiton
    pc([[-112, 0, 1], [112, 0, 1], [104, -16], [70, -28], [-70, -28], [-104, -16]], LAITOND, () => { strokePts([[-96, -18], [96, -18]], 'rgba(255,230,170,0.5)', 1.6); hatch(null, 0.5, 4, 0.3); }, 7301);
    pc([[-14, -26, 1], [14, -26, 1], [11, -66, 1], [-11, -66, 1]], LAITON, () => hatch([[2, -70], [16, -70], [16, -20], [2, -20]], 0.8, 3, 0.3), 7302);
    pc(ell(0, -74, 18, 14, 14), LAITON, () => strokePts([[-10, -80], [0, -84]], 'rgba(255,240,190,0.7)', 1.5), 7303);
    // sphère
    c.save(); c.translate(0, GL.cy);
    pc(ell(0, 0, R, R, 56), OCEAN, () => {
      paintSurface();
      const g = SIL() ? null : c.createRadialGradient(-60, -70, 30, 0, 0, R);
      if (g) { g.addColorStop(0, 'rgba(255,255,255,0.12)'); g.addColorStop(0.7, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(20,30,40,0.35)'); c.fillStyle = g; c.fillRect(-R, -R, 2 * R, 2 * R); }
      hatch([[40, -R], [R, -R], [R, R], [-R, R], [-R, 120]], 0.75, 4.5, 0.18);
    }, 7304, { texA: 0.5 });
    // intérieur (volet ouvert) : cavité + barreau
    const PS = porteShape();
    if (op > 0.001) {
      fillPts(PS, '#2a1d14', 0, 0);
      c.save(); clipPath(PS);
      if (!SIL()) { const g = c.createLinearGradient(GL.porte[0], 0, GL.porte[1], 0); g.addColorStop(0, 'rgba(0,0,0,0.5)'); g.addColorStop(0.5, 'rgba(90,60,40,0.25)'); g.addColorStop(1, 'rgba(0,0,0,0.45)'); c.fillStyle = g; c.fillRect(-90, -130, 180, 260); }
      for (const yy of [-60, 60]) fillPts([[-90, yy - 5, 1], [90, yy - 5, 1], [90, yy + 5, 1], [-90, yy + 5, 1]], '#5a4430');      // nervures de carton
      c.save(); c.rotate(am); drawBarreau(2 * (R + GL.tip), GL.barW, 7400); c.restore();
      c.restore();
      fillPts([[GL.porte[0], GL.porte[2] + 26], [GL.porte[0] + 8, GL.porte[2] + 26], [GL.porte[0] + 8, GL.porte[3] - 26], [GL.porte[0], GL.porte[3] - 26]], 'rgba(200,170,120,0.6)'); // épaisseur du carton
    }
    // pointe du barreau qui sort au pôle (visible quand la calotte se soulève)
    if (ca > 0.001) {
      fillPts(ell(0, -R + 6, 30, 9, 16), '#22180f', 0, 0);
      c.save(); clipPath([[-60, -R - 80], [60, -R - 80], [60, -R + 6], [-60, -R + 6]]);
      c.save(); c.rotate(am); drawBarreau(2 * (R + GL.tip), GL.barW, 7410); c.restore();
      c.restore();
    }
    // volet sur le ventre (charnière à gauche)
    const ph = op * 1.95, cs = Math.cos(ph);
    if (op > 0.001) {
      c.save(); c.translate(GL.porte[0], 0); c.scale(Math.abs(cs) < 0.02 ? 0.02 * Math.sign(cs || 1) : cs, 1); c.translate(-GL.porte[0], 0);
      if (cs > 0) pc(PS, OCEAN, () => { paintSurface(); hatch(null, 0.75, 4.5, 0.15); }, 7305, { texA: 0.5 });
      else pc(PS, '#b49a72', () => { hatch(null, 0.4, 4, 0.3); fillPts(rrect(GL.porte[0] + 12, GL.porte[2] + 12, GL.porte[1] - 12, GL.porte[3] - 12, 18), 'rgba(120,95,60,0.25)'); }, 7306);
      dot(GL.porte[1] - 16, 0, 7, LAITOND); dot(GL.porte[1] - 16, 0, 5, LAITON); dot(GL.porte[1] - 17.5, -1.5, 1.6, '#fff3c8');
      c.restore();
    } else {
      strokePts(PS.concat([PS[0]]), 'rgba(30,40,45,0.7)', 1.5);
      strokePts(PS.map((p) => [p[0] + 1.5, p[1] + 1.5]).concat([[PS[0][0] + 1.5, PS[0][1] + 1.5]]), 'rgba(255,255,255,0.35)', 1);
      dot(GL.porte[1] - 16, 0, 7, LAITOND); dot(GL.porte[1] - 16, 0, 5, LAITON); dot(GL.porte[1] - 17.5, -1.5, 1.6, '#fff3c8');
    }
    for (const yy of [GL.porte[2] + 34, GL.porte[3] - 34]) { fillPts([[GL.porte[0] - 5, yy - 10, 1], [GL.porte[0] + 5, yy - 10, 1], [GL.porte[0] + 5, yy + 10, 1], [GL.porte[0] - 5, yy + 10, 1]], LAITOND); dot(GL.porte[0], yy, 2.2, LAITONL); }
    // berceau de laiton (demi-anneau sous l'équateur) + pivots
    pc(ep(0, 0, R + 24, R + 24, 30, 0, PI).concat(ep(0, 0, R + 10, R + 10, 30, PI, 0)), LAITON, () => {
      strokePts(ep(0, 0, R + 19, R + 19, 20, 0.25, PI - 0.25), 'rgba(255,240,190,0.55)', 1.6); hatch(null, 0.9, 3.4, 0.22);
    }, 7307);
    for (const sd of [-1, 1]) { dot(sd * (R + 17), 0, 9, LAITOND); dot(sd * (R + 17), 0, 6, LAITON); dot(sd * (R + 18), -2, 2, '#fff3c8'); }
    // calotte de glace (se soulève comme un chapeau)
    c.save(); c.translate(0, -R);
    c.translate(-ca * 26, -ca * 120); c.rotate(-ca * 0.32);
    pc(calottePts(), GLACE, () => {
      fillPts([[-100, 30], [100, 30], [100, 70], [-100, 70]], GLACED);
      strokePts(ep(0, 46, 84, 58, 10, PI * 1.15, PI * 1.45), 'rgba(255,255,255,0.95)', 2.2);
      hatch([[10, -40], [110, -40], [110, 70], [10, 70]], 0.6, 4, 0.2, 1, '60,90,110');
    }, 7308);
    c.restore();
    c.restore();
  }

  // =====================================================================
  // OBJETS — registre (grip = point tenu, p2 = seconde prise, pts = points nommés, base = origine de l'accessoire seul)
  // =====================================================================
  const GA = 1.05;                                                            // angle (rad, depuis l'horizontale vers le bas) des prises sur le boîtier
  const OBJ = {
    boussole: { draw: drawBoussole, grip: [BS.R * Math.cos(GA), BS.R * Math.sin(GA)], p2: () => [-BS.R * Math.cos(GA), BS.R * Math.sin(GA)], held: { echelle: 0.72 },
      pts: { pivot: () => [0, 0], nord: (o) => { const a = aiguilleAng(o); return [74 * Math.sin(a), -74 * Math.cos(a)]; }, sud: (o) => { const a = aiguilleAng(o); return [-74 * Math.sin(a), 74 * Math.cos(a)]; }, anneau: () => [0, -122] }, base: [0, 0] },
    aimant: { draw: drawAimant, grip: [0, 0], held: { echelle: 0.8, ang: PI / 2 },
      pts: { bleu: (o) => [AIM.L / 2 * Math.sin(o.ang || 0), -AIM.L / 2 * Math.cos(o.ang || 0)], rouge: (o) => [-AIM.L / 2 * Math.sin(o.ang || 0), AIM.L / 2 * Math.cos(o.ang || 0)], milieu: () => [0, 0] }, base: [0, 0] },
  };
  BOU.OBJ = OBJ;
  function heldOpts(name, o, p) { const ob = OBJ[name]; return Object.assign({ t: p.t || 0 }, ob.held || {}, o || {}); }
  function heldDraw(name, o, p) {
    const ob = OBJ[name]; if (!ob) return;
    const oo = heldOpts(name, o, p), g = ob.grip, c = cx_(), k = oo.echelle || 1;
    c.save(); c.scale(k, k); c.translate(-g[0], -g[1]); ob.draw(oo); c.restore();
  }
  const DOIGTS = [[-13, -9], [9, -11], [13, -4], [13, 6], [6, 12], [-6, 12], [-13, 4]];
  const doigtsPaint = () => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(70,40,30,0.5)', 1); hatch(null, 0.9, 3.4, 0.15); };
  const has = (v) => v && v !== 'rien';
  function heldParts(skin, seed) {
    return {
      objet: { parent: 'armF_lo', at: [3, 94], noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (has(p.tenu)) heldDraw(p.tenu, p.tenuO, p); } },
      doigts: { parent: 'armF_lo', at: [3, 94], noRivet: true, base: skin, seed: seed + 2, pts: (p) => (has(p.tenu) ? DOIGTS : OFFP), paint: doigtsPaint },
      objetB: { parent: 'armB_lo', at: [3, 94], noRivet: true, base: '#000', seed: seed + 3, pts: OFFP, extra: (p) => { if (has(p.tenuB)) heldDraw(p.tenuB, p.tenuBO, p); } },
      doigtsB: { parent: 'armB_lo', at: [3, 94], noRivet: true, base: skin, seed: seed + 4, pts: (p) => (has(p.tenuB) || p._deux ? DOIGTS : OFFP), paint: doigtsPaint },
    };
  }
  // point nommé de l'objet tenu (écran)
  BOU.pt = function (r, nom, arriere) {
    const name = arriere ? r.tenuB : r.tenu, ob = OBJ[name]; if (!ob || !ob.pts[nom]) return null;
    const oo = arriere ? r.tenuBO : r.tenuO, g = ob.grip, q = ob.pts[nom](oo), k = oo.echelle || 1;
    return r.w(arriere ? 'objetB' : 'objet', (q[0] - g[0]) * k, (q[1] - g[1]) * k);
  };

  // =====================================================================
  // LE CAPITAINE — casquette de marine blanche (visière noire, galon d'or), moustache rousse cirée, favoris,
  // caban bleu marine croisé à boutons d'or, pantalon crème, bottes noires. Un peu de ventre.
  // =====================================================================
  const CA = { peau: '#e2b48f', peauD: '#c4946e', caban: '#2d4675', cabanD: '#22365f', cabanDD: '#16233f', or: '#c9a24a', orL: '#ecd28a', orD: '#8a6a26',
    pant: '#e4d9bb', pantD: '#c9bd9c', botte: '#1d1a19', roux: '#b85a26', rouxD: '#8c3f18', rouxL: '#dc8a4e', gris: '#a49a8c', blanc: '#f3f0e8', blancD: '#cfcbc0', visiere: '#18171c' };
  const CA_TORSO = [[-14, -178], [8, -182], [18, -170], [30, -150], [40, -116], [48, -76], [53, -36], [52, 0], [47, 36], [48, 70, 1], [-42, 72, 1], [-43, 30], [-41, -30], [-41, -90], [-39, -130], [-35, -154], [-26, -170]];
  const CA_HEAD = [[-16, 16], [12, 16], [13, 2], [20, -6], [28, -10], [31, -17], [30, -23], [32, -29], [36, -33], [47, -40, 1], [37, -48], [31, -57], [30, -65], [27, -78], [14, -92], [-6, -97], [-24, -88], [-34, -68], [-34, -46], [-28, -26], [-20, -6]];
  const CA_MOUST = [[-14, -2], [-4, -5], [6, -6], [14, -5], [20, -5], [25, -9], [28, -16, 1], [31, -9], [29, -2], [23, 3], [12, 6], [2, 6], [-8, 5], [-14, 3]];
  const CA_CAP = [[-38, 6], [-40, -11], [-52, -21], [-52, -32], [-36, -40], [8, -43], [44, -38], [56, -30], [52, -20], [38, -12], [37, -3], [44, 1], [60, 7], [70, 13, 1], [44, 15], [24, 10]];
  const sleeveUp = (base, seed) => ({ parent: 'torso', at: null, pts: armR(LA), base, seed, paint: () => hatch([[-17, -20], [-3, -20], [-3, 100], [-17, 100]], 0.9, 3.8, 0.3, 1, '210,215,235') });
  function foreDef(parent, base, skin, back, seed) {
    const hk = (p) => (back ? p.handB : p.handF) || 'fist';
    return { parent, at: [0, LA], pts: (p) => foreR(hk(p)), base, seed, paint: (p) => {
      const k = hk(p);
      fillPts([[-24, 76, 1], [24, 76, 1], [24, 130, 1], [-24, 130, 1]], skin); X.handPaint(null, k);
      fillPts([[-13, 66, 1], [13, 66, 1], [13, 78, 1], [-13, 78, 1]], CA.blanc);                         // poignet de chemise
      strokePts([[-14, 50], [14, 50]], CA.or, 2.6); strokePts([[-14, 57], [14, 57]], CA.or, 2.6);         // galons de manche
      hatch([[-15, -10], [-3, -10], [-3, 46], [-15, 46]], 0.9, 3.8, 0.24, 1, '210,215,235');
    } };
  }
  function legDef(at, base, seed, back) {
    return { parent: 'torso', at, pts: X.legPts(1.05), base, seed, noRivet: !!back, paint: () => {
      fillPts([[-40, 138, 1], [60, 138, 1], [60, 262, 1], [-40, 262, 1]], CA.botte);                       // botte haute
      fillPts([[-26, 132, 1], [24, 132, 1], [24, 142, 1], [-26, 142, 1]], '#2e2926');                     // revers de botte
      if (!back) { strokePts([[12, 150], [14, 210]], 'rgba(255,255,255,0.22)', 1.6); strokePts([[22, 225], [44, 230]], 'rgba(255,255,255,0.25)', 1.3); hatch([[-26, -20], [-6, -20], [-6, 132], [-26, 132]], 0.8, 4, 0.22); }
      else hatch(null, 0.8, 3.6, 0.3);
    } };
  }
  function mkCapitaine() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: CA_TORSO, base: CA.caban, seed: 8001, paint: () => {
        fillPts([[3, -188], [18, -172], [12, -156], [1, -170]], CA.blanc);                                 // col de chemise
        fillPts([[12, -170], [19, -164], [14, -156], [9, -162]], '#141218');                                // nœud de cravate noire
        fillPts([[10, -182], [26, -168], [40, -140], [44, -112], [30, -104], [22, -132], [12, -158]], CA.cabanD);    // grand revers
        strokePts([[10, -182], [26, -168], [40, -140], [44, -112], [30, -104]], 'rgba(150,170,210,0.35)', 1.2);
        fillPts([[-36, -168], [-14, -182], [4, -178], [-6, -160], [-30, -150]], CA.cabanD);                // col relevé derrière la nuque
        strokePts([[30, -104], [44, -62], [50, -20], [48, 30], [44, 70]], 'rgba(10,15,30,0.6)', 1.5);      // bord croisé
        for (const y of [-86, -46, -6]) for (const bx of [38, 16]) {                                        // deux rangées de boutons d'or
          const xx = bx + (y + 86) * 0.08; dot(xx, y, 4.4, CA.orD); dot(xx, y, 3.4, CA.or); dot(xx - 1, y - 1.2, 1.2, CA.orL);
        }
        for (const [x0, y0] of [[-24, 20]]) {                                                               // poche à rabat
          fillPts([[x0, y0, 1], [x0 + 40, y0, 1], [x0 + 40, y0 + 12, 1], [x0, y0 + 12, 1]], CA.cabanDD);
          strokePts([[x0, y0 + 12], [x0 + 40, y0 + 12]], 'rgba(150,170,210,0.3)', 1);
        }
        hatch([[-50, -176], [-10, -176], [-8, 74], [-50, 74]], 0.75, 4.2, 0.34, 1.05, '200,210,235');
        shade(46, 0, -44, 0, 0.32);
      } },
      legB: legDef([-6, -2], CA.pantD, 8002, true),
      legF: legDef([6, -2], CA.pant, 8003, false),
      armB_up: Object.assign(sleeveUp(CA.cabanD, 8004), { at: [-10, -146] }),
      armB_lo: foreDef('armB_up', CA.cabanD, CA.peauD, true, 8005),
      head: { parent: 'torso', at: [6, -170], pts: CA_HEAD, base: CA.peau, seed: 8006, noRivet: true, paint: (p) => {
        const f = p.face || {};
        fillPts([[-36, -84], [-12, -84], [-14, -62], [-22, -50], [-26, -30], [-38, -28]], CA.gris, 8016);   // cheveux grisonnants sous la casquette
        fillPts([[-2, -76], [7, -76], [8, -56], [12, -38], [17, -22], [9, -16], [1, -26], [-3, -50]], CA.roux, 8017, 0.6);   // favori roux (côtelette)
        hatch([[-4, -78], [18, -78], [18, -14], [-4, -14]], 1.3, 2.8, 0.35);
        X.earPaint(-14, -46);
        dot(40, -40, 7, 'rgba(200,90,70,0.35)');                                                             // nez rougi
        dot(22, -36, 9, 'rgba(210,110,90,0.25)');                                                            // pommette
        strokePts([[28, -48], [33, -52]], 'rgba(120,70,50,0.45)', 1); strokePts([[28, -44], [33, -45]], 'rgba(120,70,50,0.4)', 1);   // pattes-d'oie
        hatch([[-20, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.26);
        X.eye(f, 19, -54);
        fillPts([[10, -60], [20, -66], [30, -62], [29, -58], [19, -61], [11, -57]], CA.rouxD, 8019, 0.4);    // sourcil broussailleux
        X.mouth(f, 30, -18);
      } },
      moustache: { parent: 'head', at: [28, -29], noRivet: true, base: CA.roux, seed: 8010, pts: CA_MOUST, paint: () => {
        fillPts([[-16, 2], [34, 2], [34, 10], [-16, 10]], CA.rouxD);
        strokePts([[-6, -3], [8, -4], [18, -3], [25, -11]], 'rgba(255,205,150,0.7)', 1.4);
        hatch(null, 1.2, 2.6, 0.3);
      } },
      casquette: { parent: 'head', at: [-2, -80], pts: CA_CAP, base: CA.blanc, seed: 8007, noRivet: true, paint: () => {
        fillPts([[-54, -26], [56, -26], [56, -12], [-54, -12]], CA.blancD);                                  // dessous du plateau
        fillPts([[-46, -12, 1], [40, -12, 1], [40, 6, 1], [-46, 6, 1]], '#1c1b22');                          // bandeau noir
        strokePts([[-42, -8], [38, -8]], CA.or, 2.4); strokePts([[-42, 2], [38, 2]], CA.or, 2.4);           // galon d'or
        fillPts([[37, -3], [44, 1], [60, 7], [70, 13], [44, 15], [24, 10], [30, 2]], CA.visiere);              // visière vernie
        strokePts([[40, 4], [62, 10]], 'rgba(255,255,255,0.45)', 1.4);
        for (const sd of [-1, 1]) fillPts([[14, -4], [14 + sd * 9, -9], [14 + sd * 12, -3], [14 + sd * 6, 0]], CA.or); // insigne : deux feuilles de chêne
        dot(14, -4, 2.6, CA.orL);
        strokePts([[-50, -32], [0, -41], [50, -34]], 'rgba(255,255,255,0.8)', 1.4);
        hatch([[-54, -44], [-10, -44], [-10, -12], [-54, -12]], 0.6, 3.6, 0.18);
      } },
      armF_up: Object.assign(sleeveUp(CA.caban, 8008), { at: [-2, -146] }),
      armF_lo: foreDef('armF_up', CA.caban, CA.peau, false, 8009),
    };
    Object.assign(parts, heldParts(CA.peau, 8020));
    return { nom: 'capitaine', hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] },
      order: ['armB_up', 'armB_lo', 'objetB', 'legB', 'legF', 'head', 'moustache', 'casquette', 'torso', 'armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsB'] };
  }
  CH.bouCapitaine = mkCapitaine();
  // variante d'ordre : avant-bras arrière DEVANT le torse (deux mains sur la boussole : l'avant-bras arrière reste entier)
  CH.bouCapitaine2 = Object.assign({}, CH.bouCapitaine, {
    order: ['armB_up', 'legB', 'legF', 'head', 'moustache', 'casquette', 'torso', 'armB_lo', 'objetB', 'armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsB'] });

  // ----- gestes (M.ik dans le repère écran ; bendSign vérifiés sur la planche, voir persos.md)
  BOU.BEND = { armF: { 1: 1, '-1': 1 }, armB: { 1: 1, '-1': 1 } };
  function prep(p) { p = p || {}; return Object.assign({}, p, { ang: Object.assign({}, p.ang), hide: Object.assign({}, p.hide), face: Object.assign({}, p.face) }); }
  const normA = (a) => { while (a > PI) a -= TAU; while (a < -PI) a += TAU; return a; };
  function armTo(def, q, x, y, s, dir, arm, T, k) {
    if (k <= 0) return;
    const sol = M.ik(def, q, x, y, s, dir, arm, T, BOU.BEND[arm][dir < 0 ? '-1' : 1]), A = q.ang;
    const a0 = A[arm + '_up'] || 0, b0 = A[arm + '_lo'] || 0;
    A[arm + '_up'] = a0 + normA(sol.up - a0) * k; A[arm + '_lo'] = b0 + normA(sol.lo - b0) * k;
  }
  BOU.BOUSSOLE_C = [116, -128];                                                // centre de la boussole tenue (repère du torse)
  BOU.capitainePose = function (p, x, y, s, dir) {
    const q = prep(p), A = q.ang, def = CH.bouCapitaine, t = q.t || 0;
    x = x || 0; y = y || 0; s = s || 0.92; dir = dir || 1;
    const bo = ease(clamp(q.boussole || 0)), sa = ease(clamp(q.salut || 0)), te = ease(clamp(q.tendre || 0));
    const ha = ease(clamp(q.hanche || 0)), hb = ease(clamp(q.hancheB || 0)), ho = clamp(q.hoche || 0), ma = clamp(q.marche || 0);
    if (bo > 0 && !has(q.tenu)) q.tenu = 'boussole';
    // marche sur place (jambes en opposition, petit rebond, bras qui balancent s'ils sont libres)
    if (ma > 0) {
      const w = Math.sin(t * 2 * PI * 1.6);
      A.legF = (A.legF || 0) - 0.3 * ma * w; A.legB = (A.legB || 0) + 0.3 * ma * w;
      q.dy = (q.dy || 0) - 7 * ma * Math.abs(Math.cos(t * 2 * PI * 1.6));
      if (!bo && !sa && !te && !ha) A.armF_up = (A.armF_up || 0) + 0.22 * ma * w;
      if (!bo && !hb) A.armB_up = (A.armB_up || 0) - 0.22 * ma * w;
    }
    if (ho > 0) A.head = (A.head || 0) + ho * 0.16 * (0.5 - 0.5 * Math.cos(t * 9));
    let mats = null;
    const torsoPt = (px, py) => { mats = mats || M.partMatrices(def, q, x, y, s, dir).mats; return M.wpt(mats.torso, px, py); };
    const headPt = (hx, hy) => { const m = new DOMMatrix().translate(6, -170).rotate((A.head || 0) * D); return torsoPt(...mp(m, [hx, hy])); };
    // poing sur la hanche (coude en arrière)
    if (ha > 0) { armTo(def, q, x, y, s, dir, 'armF', torsoPt(4, -34), ha); mats = null; }
    if (hb > 0) { armTo(def, q, x, y, s, dir, 'armB', torsoPt(-6, -34), hb); mats = null; }
    // main ouverte tendue (vers o.cible = [X,Y] écran, sinon devant à hauteur d'épaule)
    if (te > 0) {
      const T = q.cible || torsoPt(200, -150);
      armTo(def, q, x, y, s, dir, 'armF', T, te); mats = null;
      if (te > 0.4 && !has(q.tenu)) q.handF = 'open';
    }
    // salut : main ouverte au bord de la visière
    if (sa > 0) { armTo(def, q, x, y, s, dir, 'armF', headPt(44, -76), sa); mats = null; if (sa > 0.4) q.handF = 'open'; }
    // boussole tenue à deux mains devant la poitrine
    q._deux = false;
    if (has(q.tenu)) {
      const oo = heldOpts(q.tenu, q.tenuO, q), ob = OBJ[q.tenu], k = oo.echelle || 1;
      if (bo > 0 && q.tenu === 'boussole') {
        const C = [BOU.BOUSSOLE_C[0], BOU.BOUSSOLE_C[1] - (q.boussoleH || 0)];
        const gF = ob.grip, gB = ob.p2(oo);
        armTo(def, q, x, y, s, dir, 'armF', torsoPt(C[0] + gF[0] * k, C[1] + gF[1] * k), bo); mats = null;
        armTo(def, q, x, y, s, dir, 'armB', torsoPt(C[0] + gB[0] * k, C[1] + gB[1] * k), bo); mats = null;
        if (bo > 0.5) { q._deux = true; q.handB = 'fist'; }
      }
      if (q.droit == null) q.droit = true;
      if (!(q.handF && q.handF !== 'fist')) q.handF = 'fist';
    }
    if (q.deuxMains && has(q.tenu) && OBJ[q.tenu].p2 && !q._deux) {
      const oo = heldOpts(q.tenu, q.tenuO, q), ob = OBJ[q.tenu], k = oo.echelle || 1, g = ob.grip, p2 = ob.p2(oo);
      const Hf = new DOMMatrix().translate(-2, -146).rotate((A.armF_up || 0) * D).translate(0, LA).rotate((A.armF_lo || 0) * D).translate(3, 94)
        .rotate(q.droit ? -((A.armF_up || 0) + (A.armF_lo || 0) + (q.tilt || 0)) * D : (A.objet || 0) * D).scale(k, k).translate(-g[0], -g[1]);
      armTo(def, q, x, y, s, dir, 'armB', torsoPt(...mp(Hf, p2)), 1); q._deux = true; q.handB = 'fist';
    }
    if (has(q.tenuB) && !(q.handB && q.handB !== 'fist')) q.handB = 'fist';
    if (q.droitB == null && has(q.tenuB)) q.droitB = true;
    if (q.droit) A.objet = (A.objet || 0) - ((A.armF_up || 0) + (A.armF_lo || 0) + (q.tilt || 0));
    if (q.droitB) A.objetB = (A.objetB || 0) - ((A.armB_up || 0) + (A.armB_lo || 0) + (q.tilt || 0));
    return q;
  };
  BOU.capitaine = function (pose, x, y, s, o) {
    s = s == null ? 0.92 : s; o = Object.assign({ slot: M.ST.slotF, nom: 'capitaine' }, o || {});
    const dir = o.dir || 1;
    const q = BOU.capitainePose(pose, x, y, s, dir);
    const def = q._deux ? CH.bouCapitaine2 : CH.bouCapitaine;
    const r = M.puppet(def, q, x, y, s, o);
    r.tenu = q.tenu; r.tenuB = q.tenuB;
    if (has(q.tenu) && OBJ[q.tenu]) r.tenuO = heldOpts(q.tenu, q.tenuO, q);
    if (has(q.tenuB) && OBJ[q.tenuB]) r.tenuBO = heldOpts(q.tenuB, q.tenuBO, q);
    return r;
  };
  // demi-tour : o.dir = BOU.tourne(u), u de 0 (regarde à droite) à 1 (regarde à gauche) ; s'amincit puis se retourne
  BOU.tourne = (u) => { const d = Math.cos(PI * clamp(u)); return Math.abs(d) < 0.07 ? (d < 0 ? -0.07 : 0.07) : d; };

  // =====================================================================
  // ACCESSOIRES SEULS (sans tige) — M.puppet à une pièce invisible ; dessin dans l'extra (ombre portée possible)
  // =====================================================================
  const accDefs = {};
  function accDef(name, fn) { return accDefs[name] || (accDefs[name] = { hipY: 0, handLen: 10, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => fn(p.o) } }, order: ['o'] }); }
  function acc(name, draw, x, y, s, o, sDef) {
    o = o || {}; s = s == null ? sDef : s;
    const def = accDef(name, draw);
    return M.puppet(def, { o, tilt: o.rot || 0 }, x, y, s, { dir: o.dir || 1, rod: false, slot: o.slot != null ? o.slot : y + 6 * s, floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
  }
  BOU.boussole = (x, y, s, o) => acc('boussole', drawBoussole, x, y, s, o, 0.7);
  BOU.aimant = (x, y, s, o) => acc('aimant', drawAimant, x, y, s, o, 0.7);
  BOU.globe = (x, y, s, o) => acc('globe', drawGlobe, x, y, s, Object.assign({ ombre: true }, o), 1);
  // points nommés des accessoires seuls (écran ; sans rot)
  BOU.boussolePt = (x, y, s, nom, o) => { o = o || {}; s = s == null ? 0.7 : s; const d = o.dir || 1, ob = OBJ.boussole, q = ob.pts[nom](o); return [x + d * s * q[0], y + s * q[1]]; };
  BOU.aimantPt = (x, y, s, nom, o) => { o = o || {}; s = s == null ? 0.7 : s; const d = o.dir || 1, q = OBJ.aimant.pts[nom](o); return [x + d * s * q[0], y + s * q[1]]; };
  BOU.globePt = (x, y, s, nom, o) => {
    o = o || {}; s = s == null ? 1 : s; const d = o.dir || 1, a = o.aimant || 0, ca = clamp(o.calotte || 0), L = GL.R + GL.tip;
    const q = { centre: [0, GL.cy], pole: [0, GL.cy - GL.R], bleu: [L * Math.sin(a), GL.cy - L * Math.cos(a)], rouge: [-L * Math.sin(a), GL.cy + L * Math.cos(a)],
      volet: [0, GL.cy], calotte: [-ca * 26, GL.cy - GL.R - ca * 120], pied: [0, 0] }[nom];
    return q ? [x + d * s * q[0], y + s * q[1]] : null;
  };
  BOU.init = () => { BOU.K = {}; return BOU.K; };
})();
