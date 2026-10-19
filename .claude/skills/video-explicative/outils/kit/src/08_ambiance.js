// ---------------------------------------------------------------- ambiance : la vie du décor (souhait de l'utilisateur, 19/10)
// Petits éléments qui bougent EN CONTINU pendant tout le plan, sans voler la vedette : flamme de bougie ou de lanterne avec
// sa lueur, fumée qui monte, pendule murale, voilage de fenêtre, nuages qui défilent, passants en ombre chinoise au fond,
// poussière dans un rayon. Fonctions pures du temps GLOBAL (TG : elles continuent d'un plan à l'autre sans saut à la coupe),
// à dessiner dans le décor, AVANT les marionnettes (sauf la lueur d'une flamme tenue). Jamais de texte ni de chiffre.

// Flamme de bougie, lampe ou lanterne. o : { x, y (pied de la flamme, sur la mèche), s=1, lueur=true, r=90 (rayon de la lueur), seed }
M.flamme = function (t, o = {}) {
  t = TG(t);
  const R = rng(o.seed || 3), ph = R() * TAU, s = o.s || 1, x = o.x || 540, y = o.y || 800;
  const fl = 1 + 0.12 * Math.sin(t * 13 + ph) + 0.07 * Math.sin(t * 29 + ph * 2), sw = 0.12 * Math.sin(t * 7 + ph);
  if (o.lueur !== false && !SIL) {
    const r = (o.r || 90) * s * (0.94 + 0.06 * fl);
    const g = c.createRadialGradient(x, y - 12 * s, 2, x, y - 12 * s, r);
    g.addColorStop(0, 'rgba(255,200,110,0.34)'); g.addColorStop(0.45, 'rgba(255,170,80,0.12)'); g.addColorStop(1, 'rgba(255,160,70,0)');
    c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(x - r, y - 12 * s - r, 2 * r, 2 * r); c.restore();
  }
  c.save(); c.translate(x, y); c.scale(s, s * fl); c.rotate(sw);
  const goutte = (h, w) => { c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(w, -h * 0.25, w * 0.5, -h * 0.75, 0, -h); c.bezierCurveTo(-w * 0.5, -h * 0.75, -w, -h * 0.25, 0, 0); };
  goutte(30, 9); c.fillStyle = SIL ? '#000' : '#e0782a'; c.fill();
  if (!SIL) { goutte(20, 6); c.fillStyle = '#f6c34e'; c.fill(); goutte(10, 3); c.fillStyle = '#fff3c4'; c.fill(); }
  c.restore();
};

// Fumée qui monte (cheminée, pipe, tasse, marmite, forge). o : { x, y (point de départ), s=1, n=6, haut=220, vent=30, col='#d9d2c4', a=0.7, per=3.2, seed }
M.fumee = function (t, o = {}) {
  if (SIL) return;
  t = TG(t);
  const R = rng(o.seed || 5), n = o.n || 6, per = o.per || 3.2, s = o.s || 1, haut = (o.haut || 220) * s, vent = (o.vent ?? 30) * s;
  const x = o.x || 540, y = o.y || 800, col = o.col || '#d9d2c4', a0 = o.a ?? 0.7;
  for (let i = 0; i < n; i++) {
    const off = (i / n) * per + R() * 0.2, u = (((t + off) % per) + per) % per / per, ph = R() * TAU;
    const px = x + vent * u + Math.sin(u * 5 + ph) * 10 * s, py = y - haut * u, r = (12 + 34 * u) * s;
    c.save(); c.globalAlpha = a0 * Math.sin(Math.PI * Math.min(1, u * 1.4)) * (1 - u * 0.6);
    c.beginPath();
    for (let k = 0; k < 7; k++) { const aa = k / 7 * TAU, rr = r * (0.82 + 0.18 * Math.sin(k * 2.3 + ph)); c.lineTo(px + Math.cos(aa) * rr, py + Math.sin(aa) * rr * 0.8); }
    c.closePath(); c.fillStyle = col; c.fill(); c.strokeStyle = 'rgba(245,236,214,0.5)'; c.lineWidth = 1; c.stroke();
    c.restore();
  }
};

// Pendule murale (cadran sans chiffres, aiguilles qui tournent, balancier). o : { x, y (haut du boîtier), s=1, per=2 (aller-retour, s), bois='#6b4526' }
M.pendule = function (t, o = {}) {
  t = TG(t);
  const s = o.s || 1, x = o.x || 540, y = o.y || 400, bois = o.bois || '#6b4526';
  c.save(); c.translate(x, y); c.scale(s, s);
  const box = [[-46, 0], [46, 0], [46, 210], [24, 250], [-24, 250], [-46, 210]];
  c.beginPath(); box.forEach(([a, b], i) => i ? c.lineTo(a, b) : c.moveTo(a, b)); c.closePath();
  c.fillStyle = SIL ? '#000' : bois; c.fill();
  if (!SIL) {
    c.strokeStyle = 'rgba(245,236,214,0.6)'; c.lineWidth = 1.5; c.stroke();
    c.beginPath(); c.arc(0, 48, 34, 0, TAU); c.fillStyle = '#efe4c8'; c.fill(); c.strokeStyle = '#b58f45'; c.lineWidth = 3; c.stroke();
    for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; c.beginPath(); c.moveTo(Math.sin(a) * 26, 48 - Math.cos(a) * 26); c.lineTo(Math.sin(a) * 31, 48 - Math.cos(a) * 31); c.strokeStyle = '#3a2a1c'; c.lineWidth = k % 3 ? 1 : 2.2; c.stroke(); }
    const aig = (ang, L, w) => { c.save(); c.translate(0, 48); c.rotate(ang); c.beginPath(); c.moveTo(-w, 4); c.lineTo(0, -L); c.lineTo(w, 4); c.closePath(); c.fillStyle = '#2a1e14'; c.fill(); c.restore(); };
    aig(t * 0.02 + 1.1, 16, 2.4); aig(t * 0.25 + 0.3, 24, 1.6);
    c.beginPath(); c.rect(-30, 92, 60, 120); c.fillStyle = 'rgba(30,20,12,0.55)'; c.fill();
  }
  const th = 0.32 * Math.sin(t * TAU / (o.per || 2));
  c.save(); c.translate(0, 96); c.rotate(th);
  c.fillStyle = SIL ? '#000' : '#b58f45'; c.fillRect(-1.5, 0, 3, 92);
  c.beginPath(); c.arc(0, 98, 12, 0, TAU); c.fill();
  if (!SIL) { c.beginPath(); c.arc(-3, 95, 4, 0, TAU); c.fillStyle = '#f3dc9a'; c.fill(); }
  c.restore();
  if (!SIL) { c.beginPath(); c.arc(0, 48, 3, 0, TAU); c.fillStyle = '#b58f45'; c.fill(); }
  c.restore();
};

// Voilage de fenêtre qui ondule doucement (courant d'air). o : { x (bord gauche), y (tringle), w=140, h=320, col='rgba(240,232,214,0.55)', cote=1 (1 : attaché à gauche, −1 : à droite), amp=10 }
M.voilage = function (t, o = {}) {
  t = TG(t);
  const x = o.x || 400, y = o.y || 400, w = o.w || 140, h = o.h || 320, amp = o.amp ?? 10, cote = o.cote || 1;
  const N = 14, pts = [];
  for (let k = 0; k <= N; k++) { const v = k / N, d = Math.sin(t * 1.3 + v * 3) * amp * v + Math.sin(t * 2.7 + v * 7) * amp * 0.3 * v; pts.push([d, v * h]); }
  c.save(); c.translate(x, y);
  c.beginPath(); c.moveTo(0, 0); c.lineTo(w, 0);
  for (let k = 0; k <= N; k++) c.lineTo(w * (cote > 0 ? 0.85 : 1) + pts[k][0], pts[k][1]);
  for (let k = N; k >= 0; k--) c.lineTo((cote > 0 ? 0 : w * 0.15) + pts[k][0] * 0.4, pts[k][1]);
  c.closePath(); c.fillStyle = SIL ? '#000' : (o.col || 'rgba(240,232,214,0.55)'); c.fill();
  if (!SIL) {
    c.strokeStyle = 'rgba(160,140,110,0.35)'; c.lineWidth = 1;
    for (let f = 1; f < 6; f++) { c.beginPath(); for (let k = 0; k <= N; k++) { const px = w * f / 6 + pts[k][0] * (f / 6); k ? c.lineTo(px, pts[k][1]) : c.moveTo(px, pts[k][1]); } c.stroke(); }
    c.fillStyle = '#6b4526'; c.fillRect(-6, -5, w + 12, 6);
  }
  c.restore();
};

// Nuages de carton qui défilent lentement sur leur rail (ciel d'extérieur). o : { y0=260, y1=520, n=4, vit=14 (px/s), s=1, seed, col='#efe7d6', brume=0 }
M.nuages = function (t, o = {}) {
  t = TG(t);
  const R = rng(o.seed || 11), n = o.n || 4, vit = o.vit ?? 14, span = 1500, col = fCol(o.col || '#efe7d6', o.brume || 0);
  for (let i = 0; i < n; i++) {
    const x0 = R() * span, y = lerp(o.y0 ?? 260, o.y1 ?? 520, R()), sc = (o.s || 1) * (0.6 + R() * 0.6), dirv = R() < 0.5 ? 1 : 0.7;
    const x = ((x0 + t * vit * dirv) % span + span) % span - 210, yb = y + Math.sin(t * 0.7 + i) * 3;
    c.save(); c.translate(x, yb); c.scale(sc, sc);
    const bulles = [[-62, -6, 30], [-28, -24, 38], [18, -30, 42], [58, -12, 32], [84, 6, 22]];
    const forme = (g) => { c.beginPath(); bulles.forEach(([cx, cy, r]) => { c.moveTo(cx + r + g, cy); c.arc(cx, cy, r + g, 0, TAU); }); c.rect(-92 - g, -4, 200 + 2 * g, 22 + g); };
    if (!SIL) { forme(2.5); c.fillStyle = 'rgba(160,140,110,0.55)'; c.fill(); }
    forme(0); c.fillStyle = SIL ? '#000' : col; c.fill();
    if (!SIL) { c.fillStyle = 'rgba(120,100,80,0.13)'; c.fillRect(-92, 8, 200, 10); }
    c.restore();
  }
};

// Passants en ombre chinoise qui traversent au fond (rue, place, quai, salle). o : { y (pieds), s=0.45, n=3, per=14 (s pour traverser), x0=150, x1=930, brume=0.45, seed, femmes=true }
M.passants = function (t, o = {}) {
  t = TG(t);
  const R = rng(o.seed || 13), n = o.n || 3, per = o.per || 14, s = o.s || 0.45, y = o.y || 1180;
  const x0 = o.x0 ?? 150, x1 = o.x1 ?? 930, col = fCol('#3b3330', o.brume ?? 0.45);
  for (let i = 0; i < n; i++) {
    const sens = R() < 0.5 ? 1 : -1, off = R() * per, u = (((t + off) % per) + per) % per / per;
    if (u > 0.92) continue;
    const x = sens > 0 ? lerp(x0, x1, u / 0.92) : lerp(x1, x0, u / 0.92), robe = o.femmes !== false && R() < 0.4, chap = R(), pas = Math.sin(t * 6 + i * 2);
    const fade = Math.min(1, u / 0.06, (0.92 - u) / 0.06);
    c.save(); c.globalAlpha = fade; c.translate(x, y + Math.abs(pas) * -3 * s); c.scale(sens * s, s); c.fillStyle = SIL ? '#000' : col;
    for (const sg of [-1, 1]) { c.save(); c.translate(sg * 8, -240); c.rotate(sg * pas * 0.3); c.fillRect(-11, 0, 22, 240); c.fillRect(-11, 228, 34, 12); c.restore(); }
    if (robe) { c.beginPath(); c.moveTo(-34, -300); c.lineTo(34, -300); c.lineTo(58, -90); c.lineTo(-58, -90); c.closePath(); c.fill(); }
    c.beginPath(); c.moveTo(-36, -440); c.lineTo(36, -440); c.lineTo(robe ? 34 : 40, -200); c.lineTo(robe ? -34 : -40, -200); c.closePath(); c.fill();
    c.save(); c.translate(0, -430); c.rotate(-pas * 0.35); c.fillRect(-11, 0, 22, 170); c.restore();
    c.fillRect(-10, -470, 20, 34); c.beginPath(); c.arc(6, -486, 30, 0, TAU); c.fill();
    if (chap < 0.45) { c.fillRect(-36, -514, 84, 10); c.fillRect(-20, -560, 52, 50); }
    else if (chap < 0.7) { c.beginPath(); c.ellipse(6, -512, 46, 12, 0, 0, TAU); c.fill(); c.beginPath(); c.arc(6, -514, 26, Math.PI, TAU); c.fill(); }
    c.restore();
  }
};

// Poussière qui flotte dans un rayon de lumière (fenêtre, lucarne, projecteur). o : { x, y, w=260, h=420, n=26, seed, a=0.7 }
M.poussiere = function (t, o = {}) {
  if (SIL) return;
  t = TG(t);
  const R = rng(o.seed || 17), n = o.n || 26, x = o.x ?? 400, y = o.y ?? 300, w = o.w || 260, h = o.h || 420;
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const bx = R(), by = R(), f = 0.05 + R() * 0.08, ph = R() * TAU, r = 1 + R() * 1.8;
    const px = x + w * ((bx + Math.sin(t * f * 3 + ph) * 0.05 + 1) % 1), py = y + h * (((by - t * f * 0.25) % 1 + 1) % 1);
    c.beginPath(); c.arc(px, py, r, 0, TAU); c.fillStyle = `rgba(255,236,190,${(o.a ?? 0.7) * (0.4 + 0.6 * Math.abs(Math.sin(t * 1.5 + ph)))})`; c.fill();
  }
  c.restore();
};
