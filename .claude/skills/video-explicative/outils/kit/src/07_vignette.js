
// ---------------------------------------------------------------- vignette (second lieu) et envoi
// Une action à distance (envoyer, écrire à, appeler, penser à quelqu'un) montre DEUX lieux : la scène principale et une
// vignette, médaillon ovale doré qui s'ouvre en iris, suspendu à deux fils, où l'on voit l'autre lieu et l'autre personnage.
// Le destinataire n'entre jamais dans la pièce de l'expéditeur.
//
// M.vignette(t, { x, y, rx=210, ry=260, t0, t1=99, dur=0.6, fond='#e9dcc0', draw })
//   x, y   : centre du médaillon ; rx, ry : demi-axes (garder ≥ 180 × 220 pour la lecture sur téléphone)
//   t0     : début de l'ouverture (iris), t1 : début de la fermeture ; dur : durée de chacune
//   draw(cx, cy, rx, ry, p) : dessine l'intérieur (décor + personnage, à petite échelle ≈ 0,45–0,6), déjà découpé dans
//            l'ovale ; p = ouverture 0→1 (utile pour faire apparaître le personnage un peu après l'ouverture)
//   Le médaillon descend légèrement des cintres en s'ouvrant (fils visibles jusqu'en y 0) et oscille à peine.
// M.envoi(t, { de:[x,y], a:[x,y], t0, t1, haut=220, draw })
//   Objet qui vole d'un lieu à l'autre « comme un oiseau » (lettre, carte, pigeon, colis) : arc de t0 à t1, battement
//   léger, se pose à t1. draw(x, y, ang, k) dessine l'objet (k = 0→1 le long du trajet). Avant t0 et après t1 : rien.
//   Ensuite, l'objet est dessiné par la scène à sa place d'arrivée (dans la vignette, par draw de M.vignette).
M.vignette = function (t, o) {
  const rx0 = o.rx || 210, ry0 = o.ry || 260, dur = o.dur || 0.6, t1 = o.t1 == null ? 99 : o.t1;
  const p = Math.min(ease((t - o.t0) / dur), 1 - ease((t - t1) / dur));
  if (p <= 0.001) return 0;
  const sw = wob(t, o.t0, 6, 1.6, 3);
  const cx = o.x, cy = o.y - (1 - p) * 60 + sw, rx = rx0 * (0.25 + 0.75 * p), ry = ry0 * (0.25 + 0.75 * p);
  c.save();
  c.globalAlpha = Math.min(1, p * 1.6);
  // fils jusqu'aux cintres
  c.strokeStyle = 'rgba(40,30,20,0.55)'; c.lineWidth = 2;
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx + s * rx * 0.45, 0); c.lineTo(cx + s * rx * 0.45, cy - ry * 0.93); c.stroke(); }
  // ombre portée
  c.fillStyle = 'rgba(0,0,0,0.28)'; c.beginPath(); c.ellipse(cx + 14, cy + 12, rx + 20, ry + 20, 0, 0, TAU); c.fill();
  // cadre doré
  c.fillStyle = goldGradH(c, cx - rx - 22, cx + rx + 22); c.beginPath(); c.ellipse(cx, cy, rx + 22, ry + 22, 0, 0, TAU); c.fill();
  c.strokeStyle = '#4a3412'; c.lineWidth = 2; c.stroke();
  c.fillStyle = '#f3ead6'; c.beginPath(); c.ellipse(cx, cy, rx + 6, ry + 6, 0, 0, TAU); c.fill();
  // intérieur : ouverture en iris
  c.beginPath(); c.ellipse(cx, cy, rx * p, ry * p, 0, 0, TAU); c.clip();
  c.fillStyle = o.fond || '#e9dcc0'; c.fillRect(cx - rx, cy - ry, rx * 2, ry * 2);
  if (o.draw) o.draw(cx, cy, rx, ry, p);
  // léger voile sur le bord, pour l'effet de médaillon
  const g2 = c.createRadialGradient(cx, cy, Math.min(rx, ry) * 0.6, cx, cy, Math.max(rx, ry));
  g2.addColorStop(0, 'rgba(0,0,0,0)'); g2.addColorStop(1, 'rgba(60,40,15,0.35)');
  c.fillStyle = g2; c.fillRect(cx - rx, cy - ry, rx * 2, ry * 2);
  c.restore();
  // petit fleuron en haut du cadre
  c.save(); c.globalAlpha = Math.min(1, p * 1.6);
  c.fillStyle = goldGradH(c, cx - 22, cx + 22); c.beginPath(); c.ellipse(cx, cy - ry - 24, 22, 12, 0, 0, TAU); c.fill();
  c.restore();
  return p;
};
M.envoi = function (t, o) {
  if (t < o.t0 || t > o.t1) return null;
  const k = ease((t - o.t0) / (o.t1 - o.t0)), h = o.haut == null ? 220 : o.haut;
  const x = lerp(o.de[0], o.a[0], k), y = lerp(o.de[1], o.a[1], k) - Math.sin(Math.PI * k) * h + Math.sin(t * 22) * 6 * Math.sin(Math.PI * k);
  const dx = o.a[0] - o.de[0], dy = (o.a[1] - o.de[1]) - Math.cos(Math.PI * k) * Math.PI * h;
  const ang = Math.atan2(dy, dx) * 0.35 + Math.sin(t * 22) * 0.12 * Math.sin(Math.PI * k);
  if (o.draw) o.draw(x, y, ang, k);
  return [x, y];
};
