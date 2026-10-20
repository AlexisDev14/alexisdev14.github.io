// Décor partagé « cabaret parisien riche et vivant » (plans 4 et fin du 6) — écrit par le plan 4.
// Deux fonctions, à appeler dans cet ordre dans S.draw :
//   M.dec.cabaret(t, o)       toile TOB.K.cabaret (arc de lampes, colonnes dorées, tentures) + plumes des colonnes + tour Eiffel + lampes qui scintillent
//                             + éclairage de nuit (option nuit) + poussière. À dessiner avant M.drawFloor().
//   M.dec.cabaretAvant(t, o)  premier plan, à dessiner juste après M.drawFloor() et avant les marionnettes : assombrissement du plancher (nuit),
//                             rampe de petites lampes, guéridons de spectateurs en ombre (sans visage) bas de scène à gauche et à droite,
//                             bouteille, coupes, éventail posé, fumée légère d'un cigare.
// Options o (toutes facultatives) :
//   nuit   : 0..1 (défaut 0) scène de nuit : tout est plongé dans le bleu sombre, seuls restent les petites lampes, l'arc qui brille doucement
//            et un projecteur (cône + flaque de lumière sur le fond et le plancher, centrée sur o.spot) ; 0 = cabaret éclairé
//   proj   : 0..1 (défaut 1) intensité du projecteur de nuit (cône + flaques) : il s'allume en faisant croître la valeur
//   spot   : { x, y, r } flaque du projecteur de nuit (défaut x 540, y 1230, r 300 ; y = centre sur le fond)
//   eiffel : 0..1 (défaut 1) dévoilement de la tour Eiffel (TOB.K.eiffel, TOB.CAB.eiffel) : 0 = absente (hors cadre à droite), 1 = en place ; elle glisse
//            depuis la coulisse de droite sur ≈ 0,8 s quand on fait croître la valeur (easeOut ; bascule légère à l'arrivée)
//   lampe  : t0 (secondes locales) : la lampe n° 14 de l'arc (≈ x 706, y 616) grésille (clignote, étincelles) de t0 à t0 + 0,55, reste éteinte
//            0,3 s, se rallume en un éclat à t0 + 0,85 ; absent si non donné
//   up     : décalage vertical du décor (px, défaut 0)
// Animations continues en temps global (M.tg) : scintillement de l'arc (alpha par lampe), plumes des colonnes, poussière, fumée du cigare, braise,
// lampes de la rampe. (Les gestes — eiffel, lampe — se pilotent en temps local.)
(function () {
  const D = M.dec, TAU = Math.PI * 2;
  let K = null;
  const A = { cx: 540, cy: 980, r: 400 };               // = TOB.CAB.arc
  const NL = 22;                                         // lampes de l'arc : k = 0 … 22
  const lampe = (k) => { const a = Math.PI + Math.PI * k / NL; return [A.cx + A.r * Math.cos(a), A.cy + A.r * Math.sin(a)]; };
  const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const ell = (c, x, y, rx, ry, col) => { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fillStyle = col; c.fill(); };
  const line = (c, pts, col, lw) => { c.beginPath(); pts.forEach(([a, b], i) => i ? c.lineTo(a, b) : c.moveTo(a, b)); c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke(); };
  const ENCRE = 'rgba(30,18,12,0.8)';
  // pièce de carton : ombre de découpe, contour sombre, liseré clair, remplissage
  function cut(c, pts, base, o = {}) {
    c.save();
    c.translate(1.6, 2.4); M.path(pts, o.seed || 0, 0.4); c.fillStyle = 'rgba(10,4,4,0.3)'; c.fill(); c.translate(-1.6, -2.4);
    M.path(pts, o.seed || 0, 0.4);
    c.lineJoin = 'round'; c.lineWidth = o.lw || 2.6; c.strokeStyle = ENCRE; c.stroke();
    if (o.edge) { c.lineWidth = (o.lw || 2.6) - 1.2; c.strokeStyle = o.edge; c.stroke(); }
    c.fillStyle = base; c.fill();
    if (o.paint) { c.save(); c.clip(); o.paint(c); c.restore(); }
    c.restore();
  }
  // silhouette d'ombre chinoise : liseré de lumière chaude côté scène, corps presque noir
  function sil(c, pts, seed, dx = 1.6, dy = 2.4) {
    c.save();
    M.path(pts, seed, 0.3); c.fillStyle = 'rgba(214,150,96,0.55)'; c.fill();
    c.translate(dx, dy); M.path(pts, seed, 0.3); c.fillStyle = '#150a0e'; c.fill();
    c.restore();
  }

  // ---------------------------------------------------------------- pré-rendus
  function coupe(c, x, y, s, col = 'rgba(244,222,160,0.92)') {          // coupe à champagne (x, y = pied)
    line(c, [[x, y], [x, y - 14 * s]], 'rgba(120,90,40,0.9)', 2.2 * s);
    line(c, [[x - 7 * s, y], [x + 7 * s, y]], 'rgba(120,90,40,0.9)', 2.2 * s);
    c.beginPath(); c.moveTo(x - 11 * s, y - 36 * s); c.quadraticCurveTo(x - 10 * s, y - 14 * s, x, y - 14 * s); c.quadraticCurveTo(x + 10 * s, y - 14 * s, x + 11 * s, y - 36 * s); c.closePath();
    c.fillStyle = col; c.fill(); c.lineWidth = 1.8; c.strokeStyle = ENCRE; c.stroke();
    line(c, [[x - 7 * s, y - 30 * s], [x + 7 * s, y - 30 * s]], 'rgba(255,255,235,0.8)', 1.4);
  }
  function guéridon(c, x, y, rx) {                                       // x, y = centre du plateau
    line(c, [[x, y + 12], [x, y + 90]], '#2a1410', 8);
    for (const sg of [-1, 1]) line(c, [[x, y + 86], [x + sg * rx * 0.55, y + 112]], '#2a1410', 6);
    line(c, [[x - rx * 0.3, y + 108], [x + rx * 0.3, y + 108]], '#2a1410', 5);
    cut(c, [[x - rx, y, 1], [x - rx + 6, y + 12, 1], [x + rx - 6, y + 12, 1], [x + rx, y, 1], [x + rx - 10, y - 12], [x, y - 17], [x - rx + 10, y - 12]], '#4a2218', { lw: 2.4, edge: 'rgba(214,170,90,0.9)', paint: (q) => line(q, [[x - rx + 8, y - 8], [x + rx - 8, y - 8]], 'rgba(255,214,150,0.28)', 1.6) });
  }
  function fabriquerAvant() {
    return M.pre(M.W, 1700, (c) => {
      c.save(); c.translate(46, 0);
      // ---- spectateur de gauche : chapeau haut de forme, assis derrière son guéridon (ombre, sans visage)
      sil(c, [[56, 1600, 1], [60, 1520], [74, 1470], [100, 1448], [136, 1448], [164, 1470], [180, 1520], [184, 1600, 1]], 31);
      sil(c, [[108, 1440, 1], [132, 1440, 1], [130, 1456, 1], [110, 1456, 1]], 32);                        // cou
      c.save(); ell(c, 120, 1412, 25, 31, 'rgba(214,150,96,0.55)'); ell(c, 121.5, 1414.4, 25, 31, '#150a0e'); c.restore();
      sil(c, [[102, 1388, 1], [138, 1388, 1], [134, 1334, 1], [106, 1334, 1]], 33);                         // haut de forme
      sil(c, [[80, 1388, 1], [160, 1388, 1], [158, 1380, 1], [82, 1380, 1]], 34);                           // bord
      line(c, [[106, 1372], [134, 1372]], 'rgba(214,170,90,0.7)', 3);                                       // ruban doré
      sil(c, [[160, 1478, 1], [182, 1484], [200, 1498, 1], [194, 1506, 1], [176, 1496], [156, 1492, 1]], 35); // bras qui tient le cigare
      guéridon(c, 130, 1536, 80);
      // bouteille (vert sombre, col doré) et deux coupes sur le plateau
      cut(c, [[78, 1536, 1], [78, 1498, 1], [84, 1480], [84, 1458, 1], [96, 1458, 1], [96, 1480], [102, 1498, 1], [102, 1536, 1]], '#23402c', { lw: 2.2, paint: (q) => { line(q, [[82, 1500], [82, 1532]], 'rgba(200,240,210,0.35)', 2); q.fillStyle = '#b39250'; q.fillRect(82, 1458, 18, 9); } });
      coupe(c, 124, 1530, 1); coupe(c, 156, 1526, 0.9);
      c.restore(); c.save(); c.translate(-50, 0);
      // ---- spectatrice de droite : chapeau à plumes, éventail posé sur le guéridon
      sil(c, [[900, 1600, 1], [906, 1524], [924, 1472], [952, 1450], [982, 1456], [1004, 1480], [1014, 1530], [1018, 1600, 1]], 41);
      sil(c, [[942, 1440, 1], [966, 1440, 1], [964, 1458, 1], [944, 1458, 1]], 42);
      c.save(); ell(c, 954, 1414, 24, 30, 'rgba(214,150,96,0.55)'); ell(c, 955.5, 1416.4, 24, 30, '#150a0e'); ell(c, 934, 1392, 16, 14, '#150a0e'); c.restore();   // chignon
      sil(c, [[906, 1392, 1], [930, 1378], [960, 1372], [992, 1380], [1008, 1394, 1], [980, 1402], [940, 1404]], 43);                         // large chapeau
      sil(c, [[928, 1384, 1], [942, 1360], [972, 1356], [988, 1380, 1]], 44);                                                              // calotte
      guéridon(c, 950, 1540, 80);
      // éventail posé (cartonné, ivoire et rouge, vu en perspective)
      c.save(); c.translate(980, 1528); c.scale(1, 0.42);
      for (let k = 0; k < 7; k++) {
        const a0 = Math.PI * (1.08 + k * 0.1), a1 = a0 + Math.PI * 0.1;
        c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 58, a0, a1); c.closePath(); c.fillStyle = k % 2 ? '#8a2a24' : '#efe3c6'; c.fill(); c.lineWidth = 1.6; c.strokeStyle = ENCRE; c.stroke();
      }
      ell(c, 0, 0, 5, 5, '#b39250'); c.restore();
      coupe(c, 918, 1530, 1); cut(c, [[1000, 1542, 1], [1004, 1530], [1018, 1530], [1022, 1542, 1]], '#7a5a3a', { lw: 2 });
      c.restore();
    });
  }
  function fabriquerRampe() {                                            // petites ampoules de la rampe (corps fixe ; la lueur est animée)
    return M.pre(M.W, 90, (c) => {
      line(c, [[70, 45], [1010, 45]], 'rgba(30,18,12,0.85)', 8);
      line(c, [[70, 43], [1010, 43]], 'rgba(179,146,80,0.9)', 3);
      for (let k = 0; k < 26; k++) {
        const x = lerp(78, 1002, k / 25);
        cut(c, [[x - 7, 56, 1], [x + 7, 56, 1], [x + 5, 49, 1], [x - 5, 49, 1]], '#6a4a2a', { lw: 1.6 });
        ell(c, x, 41, 7.5, 8.5, '#f6e2a8'); c.lineWidth = 1.6; c.strokeStyle = ENCRE; c.stroke();
        ell(c, x - 2, 38, 2.4, 3, 'rgba(255,255,255,0.9)');
      }
    });
  }
  const lerp = (a, b, t) => a + (b - a) * t;

  D.init_p4 = function () {
    K = { avant: fabriquerAvant(), rampe: fabriquerRampe() };
  };

  // ---------------------------------------------------------------- animations
  function plume(c, x, y, ang, L, ph, g, col, edge) {                    // plume d'autruche qui ondule (x, y = pied)
    const n = 14, spine = [], w = 15;
    for (let i = 0; i <= n; i++) {
      const u = i / n, a = ang + 0.5 * u * u * Math.sin(g * 1.5 + ph) + 0.35 * u * u * Math.sin(g * 2.6 + ph * 2);
      const px = i ? spine[i - 1][0] + Math.sin(a) * (L / n) : x, py = i ? spine[i - 1][1] - Math.cos(a) * (L / n) : y;
      spine.push([px, py, a]);
    }
    const L1 = [], L2 = [];
    spine.forEach(([px, py, a], i) => { const u = i / n, wd = w * Math.sin(Math.PI * Math.min(1, 0.18 + u * 0.95)) * (1 - u * 0.25); L1.push([px - Math.cos(a) * wd, py - Math.sin(a) * wd]); L2.push([px + Math.cos(a) * wd, py + Math.sin(a) * wd]); });
    c.beginPath(); L1.forEach(([a, b], i) => i ? c.lineTo(a, b) : c.moveTo(a, b)); L2.reverse().forEach(([a, b]) => c.lineTo(a, b)); c.closePath();
    c.lineJoin = 'round'; c.lineWidth = 2.4; c.strokeStyle = ENCRE; c.stroke(); c.fillStyle = col; c.fill();
    line(c, spine.map(([a, b]) => [a, b]), edge, 1.6);
    for (let i = 2; i < n; i += 2) { const [px, py, a] = spine[i]; const wd = w * 0.8 * Math.sin(Math.PI * Math.min(1, 0.18 + i / n * 0.95)); line(c, [[px, py], [px - Math.cos(a) * wd, py - Math.sin(a) * wd - 4]], 'rgba(60,40,30,0.35)', 1); line(c, [[px, py], [px + Math.cos(a) * wd, py + Math.sin(a) * wd - 4]], 'rgba(60,40,30,0.35)', 1); }
  }
  function etat(t, t0) {                                                // lampe qui grésille : 1 allumée … 0 éteinte, + éclat final
    if (t0 == null || t < t0) return { on: 1, eclat: 0, crepite: 0 };
    const u = t - t0;
    if (u < 0.55) { const f = Math.floor(u * 16), on = M.hash(f * 3.7 + 11) > 0.35 + 0.5 * (u / 0.55); return { on: on ? 0.9 : 0.12, eclat: 0, crepite: 1 - u / 0.55 + 0.4 }; }
    if (u < 0.85) return { on: 0, eclat: 0, crepite: 0 };
    if (u < 1.2) { const e = 1 - (u - 0.85) / 0.35; return { on: 1, eclat: e, crepite: 0 }; }
    return { on: 1, eclat: 0, crepite: 0 };
  }

  D.cabaret = function (t, o = {}) {
    const ST = M.ST, T = M.tob, c = M.ctx(), g = M.tg(t);
    const nuit = cl(o.nuit || 0), up = o.up || 0, eif = o.eiffel == null ? 1 : cl(o.eiffel);
    const sp = Object.assign({ x: 540, y: 1230, r: 300 }, o.spot || {}), pr = o.proj == null ? 1 : cl(o.proj);
    c.save(); c.translate(0, up);
    c.drawImage(T.K.cabaret, 0, 0);
    // plumes d'autruche aux chapiteaux des colonnes dorées (ondulent en temps global)
    const cols = T.CAB.colonnes, pl = [['#efe6d2', 'rgba(150,120,90,0.9)'], ['#d9a0a4', 'rgba(140,70,80,0.9)'], ['#bcd0d8', 'rgba(90,110,130,0.9)']];
    cols.forEach((cx, ci) => {
      [-0.5, 0.05, 0.55].forEach((a0, k) => plume(c, cx + (k - 1) * 12, 410, a0 * (ci ? -1 : 1) + (ci ? 0.1 : -0.1), 104 + (k === 1 ? 24 : 0), k * 1.7 + ci * 2.3, g, pl[(k + ci) % 3][0], pl[(k + ci) % 3][1]));
    });
    // tour Eiffel : glisse depuis la coulisse de droite (plan intermédiaire, devant l'arc, derrière les gradins)
    if (eif > 0.001) {
      const p = M.easeOut(eif), E = T.CAB.eiffel;
      M.flat(T.K.eiffel, E.x + (1 - p) * 360, E.y, { rot: 0.05 * (1 - p) * (1 - p) + (eif >= 1 ? 0 : 0), cast: { dx: 22, dy: 10, a: 0.3 } });
    }
    // nuit : tout se plonge dans le bleu sombre
    if (nuit > 0.001) { c.fillStyle = `rgba(7,10,30,${0.86 * nuit})`; c.fillRect(0, 0, M.W, ST.back + 5); }
    // lampes de l'arc : scintillement doux (alpha par lampe, temps global) ; la lampe n° 14 grésille (option lampe)
    const ev = etat(t, o.lampe), K14 = 14;
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let k = 0; k <= NL; k++) {
      const [lx, ly] = lampe(k);
      let a = 0.1 + 0.2 * (0.5 + 0.5 * M.noise(g * 2.2 + k * 3.7, k + 3)) + 0.05 * Math.sin(g * 5 + k * 1.9);
      if (k === K14) a = a * ev.on + ev.eclat * 0.9;
      if (a < 0.01) continue;
      const r = 34 + (k === K14 ? 40 * ev.eclat : 0);
      const gr = c.createRadialGradient(lx, ly, 2, lx, ly, r); gr.addColorStop(0, `rgba(255,222,150,${a * (1 - 0.15 * nuit)})`); gr.addColorStop(1, 'rgba(255,200,120,0)');
      c.fillStyle = gr; c.fillRect(lx - r, ly - r, 2 * r, 2 * r);
    }
    c.restore();
    if (o.lampe != null && ev.on < 0.5) {                                 // ampoule éteinte : verre terne sur la lampe d'origine
      const [lx, ly] = lampe(K14), k = 1 - ev.on;
      const gr = c.createRadialGradient(lx, ly, 2, lx, ly, 36); gr.addColorStop(0, `rgba(58,20,28,${0.96 * k})`); gr.addColorStop(0.7, `rgba(58,20,28,${0.75 * k})`); gr.addColorStop(1, 'rgba(58,20,28,0)');
      c.fillStyle = gr; c.fillRect(lx - 36, ly - 36, 72, 72);
      ell(c, lx, ly, 10, 10, `rgba(112,96,80,${k})`); c.lineWidth = 2; c.strokeStyle = `rgba(30,18,12,${0.8 * k})`; c.stroke();
    }
    if (ev.crepite > 0.01) {                                              // étincelles qui crépitent
      const [lx, ly] = lampe(K14), f = Math.floor((t - o.lampe) * 20);
      c.save(); c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 5; i++) {
        const a = M.hash(f * 5.3 + i * 9.1) * TAU, L = (8 + M.hash(f + i * 3.3) * 22) * ev.crepite;
        line(c, [[lx + Math.cos(a) * 10, ly + Math.sin(a) * 10], [lx + Math.cos(a) * (10 + L), ly + Math.sin(a) * (10 + L)]], `rgba(255,240,190,${0.9 * Math.min(1, ev.crepite)})`, 2.2);
      }
      c.restore();
    }
    // projecteur de nuit : cône de lumière + flaque sur le fond
    if (nuit > 0.001) {
      c.save(); c.globalCompositeOperation = 'lighter';
      const gc = c.createLinearGradient(0, 160, 0, ST.back); gc.addColorStop(0, `rgba(255,236,196,${0.34 * nuit * pr})`); gc.addColorStop(1, `rgba(255,230,180,${0.10 * nuit * pr})`);
      c.fillStyle = gc; c.beginPath(); c.moveTo(sp.x - 26, 160); c.lineTo(sp.x + 26, 160); c.lineTo(sp.x + sp.r * 0.95, ST.back); c.lineTo(sp.x - sp.r * 0.95, ST.back); c.closePath(); c.fill();
      const gp = c.createRadialGradient(sp.x, sp.y, sp.r * 0.25, sp.x, sp.y, sp.r);
      gp.addColorStop(0, `rgba(255,236,196,${0.78 * nuit * pr})`); gp.addColorStop(0.7, `rgba(255,226,176,${0.46 * nuit * pr})`); gp.addColorStop(1, 'rgba(255,220,170,0)');
      c.fillStyle = gp; c.fillRect(sp.x - sp.r, sp.y - sp.r, 2 * sp.r, 2 * sp.r);
      c.restore();
    }
    // poussière qui flotte dans la lumière des lampes
    M.poussiere(t, { x: 300, y: 700, w: 480, h: 640, n: 34, a: 0.55 * (1 - 0.6 * nuit), seed: 9 });
    c.restore();
  };

  D.cabaretAvant = function (t, o = {}) {
    const ST = M.ST, c = M.ctx(), g = M.tg(t);
    const nuit = cl(o.nuit || 0), up = o.up || 0;
    const sp = Object.assign({ x: 540, y: 1230, r: 300 }, o.spot || {}), pr = o.proj == null ? 1 : cl(o.proj);
    c.save(); c.translate(0, up);
    if (nuit > 0.001) {                                                    // plancher dans l'ombre, flaque du projecteur
      c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = `rgb(${255 - Math.round(218 * nuit)},${255 - Math.round(214 * nuit)},${255 - Math.round(168 * nuit)})`;
      c.fillRect(ST.L, ST.back, ST.R - ST.L, ST.front - ST.back); c.restore();
      c.save(); c.globalCompositeOperation = 'lighter'; c.translate(sp.x, 1440); c.scale(1, 0.28);
      const gp = c.createRadialGradient(0, 0, 20, 0, 0, sp.r * 0.95); gp.addColorStop(0, `rgba(255,232,186,${0.55 * nuit * pr})`); gp.addColorStop(1, 'rgba(255,220,170,0)');
      c.fillStyle = gp; c.fillRect(-sp.r, -sp.r, 2 * sp.r, 2 * sp.r); c.restore();
    }
    // rampe de petites lampes au bord du plancher (la lueur scintille doucement)
    c.drawImage(K.rampe, 0, 1590);
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 26; k++) {
      const x = lerp(78, 1002, k / 25), a = 0.35 + 0.25 * M.noise(g * 3 + k * 2.3, k + 40);
      const gr = c.createRadialGradient(x, 1631, 2, x, 1631, 26); gr.addColorStop(0, `rgba(255,214,140,${a})`); gr.addColorStop(1, 'rgba(255,200,120,0)');
      c.fillStyle = gr; c.fillRect(x - 26, 1605, 52, 52);
    }
    c.restore();
    // guéridons de spectateurs en ombre (bas des côtés)
    c.drawImage(K.avant, 0, 0);
    // braise du cigare et petite fumée légère (spectateur de gauche)
    const br = 0.7 + 0.3 * Math.sin(g * 2.1) + 0.2 * M.noise(g * 4, 9);
    c.save(); c.globalCompositeOperation = 'lighter';
    const gb = c.createRadialGradient(246, 1500, 1, 246, 1500, 16); gb.addColorStop(0, `rgba(255,150,60,${0.9 * Math.min(1, br)})`); gb.addColorStop(1, 'rgba(255,120,40,0)');
    c.fillStyle = gb; c.fillRect(226, 1480, 40, 40); c.restore();
    M.fumee(t, { x: 248, y: 1496, s: 0.5, n: 5, haut: 190, vent: 26, a: 0.35, per: 4, seed: 21 });
    c.restore();
  };
})();
