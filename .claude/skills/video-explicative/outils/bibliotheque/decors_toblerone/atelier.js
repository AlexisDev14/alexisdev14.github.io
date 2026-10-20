// Décor partagé « atelier de Berne enrichi » (plans 1, 2, 3, 5, début du 6) — écrit par le plan 1.
// M.dec.atelier(t, o) dessine, de l'arrière vers l'avant : la toile TOB.K.fabrique, les nuages dans le ciel de la fenêtre, les passants minuscules,
// les voilages, les accessoires (rouleau de papier, lampe à pétrole, moules, balance, pots de miel, louche et spatule, pendule, sacs, caisse, tabouret),
// la vapeur de la bassine, le rayon de la fenêtre avec sa poussière, la table, le chat (option).
// À appeler dans S.draw à la place de ctx.drawImage(TOB.K.fabrique) + table ; puis les marionnettes, puis M.stageLight.
// Options o (toutes facultatives) :
//   table : true (défaut) pose TOB.K.table ; false (plan 5 : table-piédestal à lui)
//   chat  : [t0, t1] (secondes locales du plan) : un chat de carton traverse le rebord de la fenêtre, derrière les voilages (absent sinon)
//   lampe : t0 : la flamme de la lampe à pétrole se ravive (plus haute, lueur plus large) de t0 à t0 + 2,4 s
//   louche: t0 : la louche et la spatule pendues se balancent (choc à t0, amorti en ≈ 2 s)
//   sonne : t0 : la pendule « sonne » : balancier plus ample une seconde à partir de t0 (aiguilles et balancier du kit restent en temps global)
//   up    : décalage vertical de tout le décor (px, défaut 0)
// Animations continues en temps global (M.tg) : vapeur, flamme, pendule, poussière, nuages, passants, voilages, balance, rayon de lumière.
(function () {
  const D = M.dec;
  let K = null;                                    // pré-rendus : accessoires fixes, masque du ciel de la fenêtre
  const FEN = { x0: 330, y0: 330, x1: 710, y1: 806 };
  const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));

  // pièce de carton fine pour accessoires de petite taille (liseré clair fin, ombre de découpe, hachure légère)
  function cut(c, pts, base, o = {}) {
    c.save();
    c.translate(1.6, 2.4); M.path(pts, o.seed || 0, 0.5); c.fillStyle = 'rgba(16,9,5,0.28)'; c.fill(); c.translate(-1.6, -2.4);
    M.path(pts, o.seed || 0, 0.5);
    c.lineJoin = 'round'; c.lineWidth = o.lw || 2.6; c.strokeStyle = 'rgba(34,22,14,0.75)'; c.stroke();
    c.lineWidth = (o.lw || 2.6) - 1.2; c.strokeStyle = o.edge || 'rgba(241,233,214,0.8)'; c.stroke();
    c.fillStyle = base; c.fill();
    if (o.paint) { c.save(); c.clip(); o.paint(c); c.restore(); }
    c.restore();
  }
  function ell(c, x, y, rx, ry, col, rot = 0) { c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); c.fillStyle = col; c.fill(); }
  const line = (c, pts, col, lw) => { c.beginPath(); pts.forEach(([a, b], i) => i ? c.lineTo(a, b) : c.moveTo(a, b)); c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke(); };

  function sac(c, x, yb, w, h, ph) {              // sac de jute noué en haut
    const hw = w / 2;
    cut(c, [[x - hw + 6, yb], [x - hw - 4, yb - h * 0.45], [x - hw + 4, yb - h * 0.8], [x - 12, yb - h * 0.93, 1], [x - 14, yb - h - 8], [x, yb - h - 14, 1], [x + 14, yb - h - 8], [x + 12, yb - h * 0.93, 1], [x + hw - 4, yb - h * 0.8], [x + hw + 4, yb - h * 0.45], [x + hw - 6, yb]], '#b79a63', {
      seed: ph, paint: (q) => {
        for (let k = -hw; k < hw; k += 5) line(q, [[x + k, yb - h - 10], [x + k + (k % 7 - 3) * 0.6, yb]], 'rgba(90,62,30,0.22)', 1);
        for (let k = 0; k < 9; k++) line(q, [[x - hw, yb - 8 - k * h / 9], [x + hw, yb - 8 - k * h / 9 + (k % 2 ? 2 : -1)]], 'rgba(255,240,200,0.16)', 1);
        line(q, [[x - 14, yb - h * 0.9], [x + 14, yb - h * 0.9]], '#5a3d22', 4);
        ell(q, x - hw * 0.45, yb - h * 0.5, hw * 0.3, h * 0.35, 'rgba(255,235,190,0.12)');
        const g = q.createLinearGradient(x - hw, 0, x + hw, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(40,25,10,0.38)'); q.fillStyle = g; q.fillRect(x - hw - 8, yb - h - 20, w + 16, h + 20);
      }
    });
  }
  function caisse(c, x0, x1, yb, h) {
    cut(c, [[x0, yb, 1], [x1, yb, 1], [x1, yb - h, 1], [x0, yb - h, 1]], '#946a3e', {
      paint: (q) => {
        for (let k = 1; k < 3; k++) line(q, [[x0, yb - k * h / 3], [x1, yb - k * h / 3]], 'rgba(40,24,12,0.55)', 2);
        for (let k = x0 + 6; k < x1; k += 17) line(q, [[k, yb - h], [k + 2, yb]], 'rgba(60,36,16,0.18)', 1);
        q.fillStyle = 'rgba(40,24,12,0.5)'; q.fillRect(x0, yb - h, 7, h); q.fillRect(x1 - 7, yb - h, 7, h);
        const g = q.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(40,25,10,0.35)'); q.fillStyle = g; q.fillRect(x0, yb - h, x1 - x0, h);
      }
    });
  }
  function pot(c, x, yb, w, h, col, couv) {      // pot de miel : panse, col, couvercle de tissu noué
    cut(c, [[x - w / 2 + 3, yb], [x - w / 2, yb - h * 0.45], [x - w / 2 + 4, yb - h * 0.8], [x - w / 3, yb - h, 1], [x + w / 3, yb - h, 1], [x + w / 2 - 4, yb - h * 0.8], [x + w / 2, yb - h * 0.45], [x + w / 2 - 3, yb]], col, {
      paint: (q) => { ell(q, x - w * 0.18, yb - h * 0.5, w * 0.1, h * 0.28, 'rgba(255,255,255,0.28)'); q.fillStyle = 'rgba(70,40,10,0.22)'; q.fillRect(x + w * 0.15, yb - h, w, h); line(q, [[x - w / 2, yb - h * 0.55], [x + w / 2, yb - h * 0.55]], 'rgba(255,230,160,0.35)', 3); }
    });
    cut(c, [[x - w / 3 - 3, yb - h + 1], [x + w / 3 + 3, yb - h + 1], [x + w / 3 + 5, yb - h - 8], [x - w / 3 - 5, yb - h - 8]], couv, { lw: 2.2 });
    line(c, [[x - w / 3 - 2, yb - h - 1], [x + w / 3 + 2, yb - h - 1]], '#5a3d22', 2);
  }
  function etagere(c, x0, x1, y) {                // planche + deux consoles
    cut(c, [[x0, y, 1], [x1, y, 1], [x1, y + 12, 1], [x0, y + 12, 1]], '#7a5232', { paint: (q) => line(q, [[x0, y + 3], [x1, y + 3]], 'rgba(255,230,190,0.2)', 1.4) });
    for (const bx of [x0 + 18, x1 - 24]) cut(c, [[bx, y + 12, 1], [bx + 14, y + 12, 1], [bx, y + 40, 1]], '#6a4426', { lw: 2 });
  }

  D.init_p1 = function () {
    const ST = M.ST, T = M.tob;
    K = {};
    K.fixe = M.pre(M.W, ST.back + 5, (c) => {
      // --- rouleau de papier d'emballage (sans lettres) sur ses consoles, bout qui pend
      for (const bx of [136, 282]) cut(c, [[bx - 7, 436, 1], [bx + 7, 436, 1], [bx + 7, 478, 1], [bx - 7, 478, 1]], '#3c3430', { lw: 2 });
      cut(c, [[150, 420], [268, 420], [270, 436, 1], [270, 466, 1], [268, 482], [150, 482], [148, 466, 1], [148, 436, 1]], '#cba76c', {
        paint: (q) => { for (let k = 0; k < 7; k++) line(q, [[150, 428 + k * 8], [268, 428 + k * 8]], 'rgba(120,84,40,0.2)', 1); q.fillStyle = 'rgba(40,25,10,0.28)'; q.fillRect(150, 462, 120, 22); ell(q, 262, 451, 8, 28, 'rgba(120,84,40,0.35)'); }
      });
      cut(c, [[236, 478], [260, 478], [262, 506], [254, 520], [243, 512], [238, 498]], '#d6b57a', { paint: (q) => { line(q, [[250, 478], [251, 514]], 'rgba(120,84,40,0.22)', 1); q.fillStyle = 'rgba(40,25,10,0.16)'; q.fillRect(236, 478, 12, 50); } });
      // --- lampe à pétrole sur l'étagère du haut (pied large), la flamme est animée à part
      cut(c, [[150, 599, 1], [216, 599, 1], [212, 586, 1], [154, 586, 1]], '#a8803c', { lw: 2.2, paint: (q) => line(q, [[154, 592], [212, 592]], 'rgba(255,235,170,0.4)', 1.6) });
      cut(c, [[176, 586, 1], [190, 586, 1], [188, 574, 1], [178, 574, 1]], '#9a7332', { lw: 2 });
      cut(c, [[160, 572], [168, 556], [184, 548, 1], [200, 556], [208, 572], [198, 584], [170, 584]], 'rgba(238,176,70,0.62)', { lw: 2.2, edge: 'rgba(255,240,200,0.9)', paint: (q) => { ell(q, 174, 566, 5, 9, 'rgba(255,255,255,0.35)'); q.fillStyle = 'rgba(200,110,30,0.28)'; q.fillRect(184, 546, 30, 44); } });
      cut(c, [[174, 552, 1], [194, 552, 1], [192, 544, 1], [176, 544, 1]], '#9a7332', { lw: 2 });
      cut(c, [[177, 544], [172, 520], [176, 506], [192, 506], [196, 520], [191, 544]], 'rgba(220,235,235,0.28)', { lw: 1.8, edge: 'rgba(255,255,245,0.8)', paint: (q) => line(q, [[180, 510], [176, 536]], 'rgba(255,255,255,0.4)', 2) });
      // --- râtelier à droite : rail et crochets (louche, spatule et écumoire sont animées)
      cut(c, [[772, 636, 1], [944, 636, 1], [944, 646, 1], [772, 646, 1]], '#6e4a2c', { lw: 2.2, paint: (q) => line(q, [[772, 639], [944, 639]], 'rgba(255,230,190,0.22)', 1.2) });
      // --- étagère aux pots de miel (à droite de la fenêtre) ; la balance est animée
      etagere(c, 768, 944, 882);
      pot(c, 788, 882, 36, 44, '#d49a2a', '#e8d9b0');
      pot(c, 826, 882, 34, 56, '#c07e1c', '#d8c690');
      pot(c, 858, 882, 26, 36, '#dcae48', '#e8d9b0');
      // --- sacs de jute et caisse, à gauche au sol ; tabouret à droite
      caisse(c, 124, 214, 1404, 66);
      sac(c, 168, 1338, 74, 96, 5);
      sac(c, 232, 1404, 76, 108, 9);
      sac(c, 142, 1404, 64, 80, 13);
      // tabouret
      for (const [a, b] of [[868, 858], [920, 930]]) cut(c, [[a, 1352], [a + 8, 1352], [b + 6, 1430], [b - 2, 1430]], '#6e4a2c', { lw: 2 });
      cut(c, [[858, 1328, 1], [932, 1328, 1], [934, 1354, 1], [856, 1354, 1]], '#8a6038', { lw: 2.4, paint: (q) => { line(q, [[862, 1334], [928, 1334]], 'rgba(255,230,190,0.25)', 1.4); } });
    });
    // masque du ciel de la fenêtre : pixels gris-bleu de la toile (ni cadre, ni toits, ni tour)
    const fab = T.K.fabrique, w = FEN.x1 - FEN.x0, h = FEN.y1 - FEN.y0;
    const src = fab.getContext('2d').getImageData(FEN.x0, FEN.y0, w, h), d = src.data;
    const mk = M.mkCanvas(w, h), mc = mk.getContext('2d'), out = mc.createImageData(w, h);
    for (let i = 0; i < d.length; i += 4) {
      const sky = d[i + 2] >= d[i] - 4 && d[i + 1] >= d[i] - 4 && d[i + 3] > 200;
      out.data[i] = out.data[i + 1] = out.data[i + 2] = 255; out.data[i + 3] = sky ? 255 : 0;
    }
    mc.putImageData(out, 0, 0);
    K.ciel = mk;
  };

  // chat de carton, de profil, qui marche vers la droite (dir 1) ; (x, y) = pattes sur le rebord ; ph = phase de marche (0 = immobile)
  function chat(c, x, y, ph, queue, tete) {
    const cr = 'rgba(241,233,214,0.85)', pel = '#51433a', pelD = '#3a2f29';
    c.save(); c.translate(x, y);
    const sw = ph ? 1 : 0;
    // pattes arrière et avant (balancent autour de la hanche)
    const patte = (hx, ang, col) => { c.save(); c.translate(hx, -16); c.rotate(ang); cut(c, [[-5, 0, 1], [5, 0, 1], [5, 17, 1], [8, 17, 1], [8, 21, 1], [-5, 21, 1]], col, { lw: 2 }); c.restore(); };
    patte(-34, Math.sin(ph) * 0.5 * sw, pelD); patte(26, Math.sin(ph + 3.1) * 0.5 * sw, pelD);
    // queue : tige épaisse qui ondule
    const qa = Math.sin(queue) * 0.35;
    c.save(); c.translate(-48, -34); c.rotate(qa);
    c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-26, -12, -34, -44, -14, -64); c.strokeStyle = 'rgba(34,22,14,0.75)'; c.lineWidth = 15; c.lineCap = 'round'; c.stroke();
    c.strokeStyle = cr; c.lineWidth = 13; c.stroke(); c.strokeStyle = pel; c.lineWidth = 10.6; c.stroke();
    c.restore();
    // corps
    cut(c, [[-52, -30], [-42, -52], [-8, -58], [28, -54], [46, -40], [44, -16], [30, -9], [-30, -9], [-50, -15]], pel, {
      paint: (q) => { ell(q, 0, -14, 44, 10, 'rgba(210,190,160,0.45)'); for (let k = -30; k < 36; k += 14) line(q, [[k, -58], [k + 4, -38]], pelD, 4); }
    });
    patte(-22, Math.sin(ph + 3.1) * 0.5 * sw, pel); patte(38, Math.sin(ph) * 0.5 * sw, pel);
    // tête, oreilles, museau
    c.save(); c.translate(52, -52); c.rotate(tete);
    cut(c, [[-8, -16, 1], [-6, -34, 1], [4, -24, 1]], pelD, { lw: 2 }); cut(c, [[8, -24, 1], [18, -36, 1], [22, -18, 1]], pelD, { lw: 2 });
    cut(c, [[-12, -8], [-8, -22], [8, -26], [22, -16], [26, -2], [18, 8], [0, 12], [-10, 6]], pel, {
      paint: (q) => { ell(q, 17, 3, 8, 6, 'rgba(210,190,160,0.5)'); line(q, [[-4, -24], [-2, -16]], pelD, 3); line(q, [[6, -26], [7, -17]], pelD, 3); }
    });
    ell(c, 11, -5, 4.2, 3.2, '#d9d27a'); ell(c, 11, -5, 1.2, 3.2, '#2a2218'); ell(c, 24, 1, 2.2, 1.7, '#c78b8b');
    line(c, [[20, 4], [34, 2]], 'rgba(241,233,214,0.9)', 1); line(c, [[20, 6], [34, 9]], 'rgba(241,233,214,0.9)', 1);
    c.restore();
    c.restore();
  }
  // position, phase de marche, visibilité du chat selon t ; fenêtre sur 2 s de marche, pause au milieu
  function chatEtat(t, t0, t1) {
    const u = (t - t0) / (t1 - t0);
    if (u <= 0 || u >= 1) return null;
    const xa = 250, xb = 470, xc = 790;                    // départ et sortie derrière les voilages
    let x, marche;
    if (u < 0.35) { x = M.lerp(xa, xb, u / 0.35); marche = true; }
    else if (u < 0.55) { x = xb; marche = false; }
    else { x = M.lerp(xb, xc, (u - 0.55) / 0.45); marche = true; }
    return { x, marche, pause: u >= 0.35 && u < 0.55, u };
  }

  D.atelier = function (t, o = {}) {
    const ST = M.ST, T = M.tob, ctx = M.ctx(), g = M.tg(t), up = o.up || 0;
    if (!K) D.init_p1();
    ctx.save(); ctx.translate(0, up);
    ctx.drawImage(T.K.fabrique, 0, 0);
    // nuages dans le ciel de la fenêtre (seulement sur les pixels de ciel : le cadre et les toits restent devant)
    const nu = M.pre(FEN.x1 - FEN.x0, FEN.y1 - FEN.y0, (x) => {
      x.translate(-FEN.x0, -FEN.y0);
      M.nuages(t, { y0: 372, y1: 520, n: 4, vit: 9, s: 0.5, seed: 21, brume: 0.15 });
      x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'destination-in'; x.drawImage(K.ciel, 0, 0);
    });
    ctx.save(); ctx.globalAlpha = 0.9; ctx.drawImage(nu, FEN.x0, FEN.y0); ctx.restore();
    // passants minuscules et pâles dans la rue de Berne, derrière la vitre
    ctx.save(); ctx.beginPath(); ctx.rect(FEN.x0 + 4, 640, FEN.x1 - FEN.x0 - 8, 160); ctx.clip();
    M.passants(t, { y: 797, s: 0.11, n: 3, per: 16, x0: 340, x1: 700, brume: 0.6, seed: 7 });
    ctx.restore();
    ctx.drawImage(K.fixe, 0, 0);
    // pendule murale (hors fenêtre) ; « sonne » : balancier plus ample une seconde
    M.pendule(t, { x: 902, y: 420, s: 0.7, per: 2 });
    if (o.sonne != null) {
      const e = o.sonne, k = cl((t - e) / 0.15) * (1 - cl((t - e - 1.0) / 0.3));
      if (k > 0) { ctx.save(); ctx.globalAlpha = 0.5 * k; ctx.translate(902, 420 + 96 * 0.7); ctx.rotate(0.45 * Math.sin((t - e) * 14) * 1); ctx.fillStyle = '#b58f45'; ctx.fillRect(-1, 0, 2, 64); ctx.restore(); }
    }
    // louche, spatule, écumoire pendues au râtelier ; se balancent doucement, davantage au choc (o.louche)
    const bal = (k, amp) => 0.02 * Math.sin(g * 0.9 + k) + (o.louche != null ? M.wob(t, o.louche, amp, 1.3, 1.6) : 0);
    const crochet = (x, k, amp, dessin) => { ctx.save(); ctx.translate(x, 644); ctx.rotate(bal(k, amp)); dessin(); ctx.restore(); M.dot(x, 644, 3.4, '#2a2018'); };
    crochet(802, 0, 0.34, () => {                          // louche de cuivre
      line(ctx, [[0, 0], [0, 94]], '#5a3d22', 6); line(ctx, [[0, 0], [0, 94]], '#8a6038', 3.6);
      cut(ctx, [[-16, 92], [16, 92], [18, 108], [10, 124], [-10, 124], [-18, 108]], '#c07a3e', { lw: 2.2, paint: (q) => ell(q, -5, 104, 3, 8, 'rgba(255,230,180,0.4)') });
    });
    crochet(852, 1.7, 0.3, () => {                         // spatule de bois
      cut(ctx, [[-3.5, 0, 1], [3.5, 0, 1], [3.5, 70, 1], [10, 74], [10, 128], [-10, 128], [-10, 74], [-3.5, 70, 1]], '#c49a62', { lw: 2.2, paint: (q) => { line(q, [[0, 80], [0, 126]], 'rgba(120,80,40,0.25)', 1.2); } });
    });
    crochet(900, 3.1, 0.38, () => {                        // écumoire à trous
      line(ctx, [[0, 0], [0, 76]], '#5a3d22', 6); line(ctx, [[0, 0], [0, 76]], '#8a6038', 3.6);
      cut(ctx, [[-22, 94], [-16, 78], [0, 72], [16, 78], [22, 94], [14, 112], [-14, 112]], '#b46c36', { lw: 2.2, paint: (q) => { for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) ell(q, -10 + a * 10, 86 + b * 9, 2, 2, 'rgba(40,24,12,0.55)'); } });
    });
    // balance à plateaux sur l'étagère du miel : le fléau oscille doucement (temps global)
    ctx.save(); ctx.translate(902, 882);
    cut(ctx, [[-14, 0, 1], [14, 0, 1], [8, -8, 1], [-8, -8, 1]], '#9a7332', { lw: 2 });
    cut(ctx, [[-3, -8, 1], [3, -8, 1], [3, -74, 1], [-3, -74, 1]], '#9a7332', { lw: 2 });
    ctx.translate(0, -74); ctx.rotate(0.07 * Math.sin(g * 0.8));
    cut(ctx, [[-31, -3, 1], [31, -3, 1], [31, 3, 1], [-31, 3, 1]], '#b08a3c', { lw: 2 });
    for (const sg of [-1, 1]) {
      ctx.save(); ctx.translate(sg * 29, 0); ctx.rotate(-0.07 * Math.sin(g * 0.8));
      line(ctx, [[0, 0], [-14, 40]], 'rgba(60,40,20,0.8)', 1.6); line(ctx, [[0, 0], [14, 40]], 'rgba(60,40,20,0.8)', 1.6);
      cut(ctx, [[-20, 40, 1], [20, 40, 1], [14, 49], [-14, 49]], '#c9a650', { lw: 2.2 });
      ctx.restore();
    }
    ctx.restore();
    // lampe à pétrole : flamme et lueur (flamme plus haute quand elle se ravive)
    let fs = 0.5, lr = 100;
    if (o.lampe != null) { const k = Math.sin(Math.PI * cl((t - o.lampe) / 2.4)); fs += 0.32 * k; lr += 70 * k; }
    M.flamme(t, { x: 184, y: 552, s: fs, r: lr, seed: 4 });
    // vapeur de la bassine
    T.vapeur(t);
    // voilages de la fenêtre (animés) : le chat passe derrière
    const voil = () => {
      M.voilage(t, { x: 292, y: 316, w: 88, h: 488, cote: 1, amp: 7, col: 'rgba(238,230,210,0.8)' });
      M.voilage(t, { x: 662, y: 316, w: 88, h: 488, cote: -1, amp: 7, col: 'rgba(238,230,210,0.8)' });
    };
    if (o.chat) {
      const e = chatEtat(t, o.chat[0], o.chat[1]);
      if (e) {
        ctx.save(); ctx.beginPath(); ctx.rect(292, 640, 458, 176); ctx.clip();
        chat(ctx, e.x, 811, e.marche ? e.x * 0.12 : 0, g * 2.3, e.pause ? 0.18 * Math.sin(g * 1.7) - 0.1 : 0);
        ctx.restore();
      }
    }
    voil();
    // rayon de la fenêtre sur le mur du fond, avec sa poussière
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const gr = ctx.createLinearGradient(0, 810, 0, 1400); gr.addColorStop(0, 'rgba(255,226,160,0.10)'); gr.addColorStop(1, 'rgba(255,226,160,0.02)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(372, 812); ctx.lineTo(690, 812); ctx.lineTo(860, 1396); ctx.lineTo(520, 1396); ctx.closePath(); ctx.fill();
    ctx.restore();
    M.poussiere(t, { x: 390, y: 830, w: 420, h: 540, n: 34, a: 0.7, seed: 3 });
    if (o.table !== false) M.flat(T.K.table, T.TABLE.cx, ST.back, { cast: { dx: 22, dy: 10, a: 0.3 } });
    ctx.restore();
  };
})();
