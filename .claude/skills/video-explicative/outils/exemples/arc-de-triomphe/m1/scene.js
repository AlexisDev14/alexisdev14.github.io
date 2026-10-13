// Extrait m1 — « Pas debout » (théâtre de marionnettes à tiges) — l'accroche
const SCENE = (() => {
  const S = {}, E = TL.EVENTS, C = M.chars, ST = M.ST;
  const { clamp, lerp, ease, easeOut, easeIn, smooth, wob, TAU } = M;
  let K;
  S.init = () => {
    K = {
      sky: M.makeSky('paris'), row: M.makeParisRow(), wingL: M.makeTreeWing(5, false), wingR: M.makeTreeWing(9, true),
      cloud1: M.makeCloud(1, 1), cloud2: M.makeCloud(2, 0.8), vrai: M.makeArc(false),
    };
  };
  const cast = { dx: 22, dy: 10, a: 0.3 };
  const FEET = ST.slotF - 34, FEETB = ST.slotB - 30;
  const ARCX = 500, AS = 0.9, NS = 0.96, NAPX = 690, FLOORH = 1418, BACK = 44;   // BACK : épaisseur du dos (il se pose à plat sur le plancher)
  const ctx = () => M.ctx();
  function clipAbove(y, fn) { const x = ctx(); x.save(); x.beginPath(); x.rect(0, 0, M.W, y); x.clip(); fn(); x.restore(); }

  // ---------- rideau (ouverture en drapé, comme m4)
  function curtainState(t) {
    const u = (t - E.curtain0) / (E.curtain1 - E.curtain0);
    const f = ease(u);
    const vel = (ease(u + 0.02) - ease(u - 0.02)) / (0.04 * (E.curtain1 - E.curtain0));
    return { f, swing: -vel * 9 + wob(t, E.curtain1, 26, 0.85, 2.6) };
  }

  // ---------- Napoléon : position, pose, bascule
  function napState(t) {
    let x, dy = Math.sin(t * 2.0) * 1.2, legF = 0, legB = 0, tilt = 0;
    if (t < E.walk0) {
      const u = smooth(E.enter0, E.enter1, t);
      x = lerp(-260, 250, u);
      dy += -Math.abs(Math.sin(t * 9)) * 4 * (u > 0 && u < 1 ? 1 : 0);
      tilt = 0.03 * Math.sin(Math.PI * u);
    } else {
      const p = clamp((t - E.walk0) / (E.walk1 - E.walk0)) * 4;      // 4 pas cadencés
      const k = Math.min(3, Math.floor(p)), f = p - k;
      x = lerp(250, NAPX, (k + ease(f)) / 4);
      const on = t < E.walk1 ? 1 : 0;
      dy += -Math.sin(Math.PI * f) * 16 * on + wob(t, E.walk1, 5, 3, 7);
      const sw = Math.sin(Math.PI * f) * 0.3 * on * (k % 2 ? -1 : 1);
      legF = sw; legB = -sw; tilt = 0.04 * on;
    }
    const pose = { tuck: true, dy, tilt, ang: { armF_up: 0.18, armF_lo: -1.85, armB_up: 0.35, armB_lo: -0.4, legF, legB, head: -0.12 }, face: { brow: 'frown', mouth: 'n' } };
    // « vainqueur » : menton haut
    if (t > E.proud - 0.1) pose.ang.head = lerp(-0.12, -0.18, smooth(E.proud - 0.1, E.proud + 0.2, t));
    // il lève les yeux vers l'arc, satisfait
    const lk = smooth(E.look0, E.look1, t) * (1 - smooth(E.attn0 - 0.15, E.attn0 + 0.05, t));
    if (t > E.look0) { pose.ang.head = lerp(pose.ang.head, -0.34, lk); if (lk > 0.4) pose.face = { brow: 'n', mouth: 'smile' }; }
    // garde-à-vous : bras le long du corps, petit écrasement
    let rot = 0, jolt = 0;
    if (t > E.attn0) {
      const a = smooth(E.attn0, E.attn0 + 0.14, t);
      pose.tuck = a < 0.35; pose.handF = 'fist';
      Object.assign(pose.ang, { armF_up: lerp(0.18, 0.03, a), armF_lo: lerp(-1.85, -0.04, a), armB_up: lerp(0.35, -0.03, a), armB_lo: lerp(-0.4, 0, a), head: lerp(-0.18, -0.1, a) });
      pose.dy += 9 * Math.sin(Math.PI * clamp((t - E.attn0) / 0.17)) + wob(t, E.attn1, -4, 3, 8);
      pose.face = { brow: 'frown', mouth: 'tight' };
    }
    // « Et pas debout » : bascule raide en arrière autour du rivet de la tige
    if (t > 7.8) rot = 0.035 * Math.sin(Math.PI * clamp((t - 7.8) / 0.2));
    if (t > E.fall0) {
      const u = clamp((t - E.fall0) / (E.fallLand - E.fall0));
      rot = -Math.PI / 2 * Math.pow(u, 2.3);
      if (t > E.fallLand) rot = -Math.PI / 2 + wob(t, E.fallLand, 0.05, 2.6, 7);
      jolt = -Math.abs(Math.sin((t - E.fallLand) * 12)) * 9 * Math.exp(-8 * (t - E.fallLand)) * (t > E.fallLand ? 1 : 0);
      if (t > E.fall0 + 0.08) pose.face = { brow: 'n', mouth: 'tight', eyes: 'closed' };
    }
    if (t > E.hatOff) pose.hide = { hat: 1 };
    return { x, pose, rot, jolt };
  }
  // matrice de bascule autour du rivet de la tige (pivot sur le torse)
  function napFrame(t) {
    const st = napState(t);
    const c = ctx(); c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    const m0 = M.partMatrices(C.napoleon, st.pose, st.x, FEET, NS, 1).mats;
    c.restore();
    const piv = M.wpt(m0.torso, -26, 18);
    let R;
    if (t > E.fall0) {
      const hx = st.x - 18 * NS, hy = FEET;                       // talon arrière
      const lift = -BACK * NS * Math.sin(-st.rot) + st.jolt;
      R = new DOMMatrix().translate(0, lift).translate(hx, hy).rotate(st.rot * 180 / Math.PI).translate(-hx, -hy);
    } else R = new DOMMatrix().translate(piv[0], piv[1]).rotate(st.rot * 180 / Math.PI).translate(-piv[0], -piv[1]);
    return { st, piv, R };
  }
  function hatMats(t) {
    const nf = napFrame(t);
    const c = ctx(); c.save(); c.setTransform(nf.R);
    const pose = Object.assign({}, nf.st.pose, { hide: null });
    const m = M.partMatrices(C.napoleon, pose, nf.st.x, FEET, NS, 1).mats.hat;
    c.restore();
    return { p: M.wpt(m, 0, 0), rot: Math.atan2(m.b, m.a) };
  }
  // trajectoire du bicorne libre : glisse de la tête, tombe derrière lui, roule un peu et se pose
  let HAT = null;
  function freeHat(t) {
    if (!HAT) {
      const h0 = hatMats(E.hatOff);
      const vx = 215, vy = -460, g = 4200;
      const yL = FLOORH - 30;
      const uL = (-vy + Math.sqrt(vy * vy + 2 * g * (yL - h0.p[1]))) / g;
      HAT = { h0, vx, vy, g, uL, xL: h0.p[0] + vx * uL, landRot: 0.42 + TAU };
    }
    const { h0, vx, vy, g, uL, xL, landRot } = HAT;
    const u = t - E.hatOff;
    let x, y, r;
    if (u < uL) { x = h0.p[0] + vx * u; y = h0.p[1] + vy * u + 0.5 * g * u * u; r = lerp(h0.rot, landRot, u / uL); }
    else {
      const v = u - uL;
      x = xL + 45 * (1 - Math.exp(-6 * v));
      r = 0.07 + (0.42 - 0.07) * Math.cos(TAU * 1.8 * v) * Math.exp(-6.5 * v);
      y = FLOORH - Math.abs(Math.sin(v * 14)) * 12 * Math.exp(-9 * v) - Math.abs(Math.sin(r)) * 62 * NS;
    }
    return { x, y, r, landT: E.hatOff + uL };
  }
  S.hatLandT = () => freeHat(E.hatOff + 0.01).landT;

  let RPIV = null;
  function rodPiv() { if (!RPIV) RPIV = napFrame(E.fall0 - 0.001).piv; return RPIV; }
  // nuage de poussière de papier à l'impact, le long du corps
  const DUST = []; { const R = M.rng(17); for (let i = 0; i < 26; i++) DUST.push({ f: R(), a: R() * Math.PI, sp: 40 + R() * 70, r: 6 + R() * 8 }); }
  function dust(t) {
    const u = t - E.fallLand; if (u < 0 || u > 1.0) return;
    const x = ctx(), x0 = NAPX - 500 * NS, x1 = NAPX - 60;
    for (const d of DUST) {
      const px = lerp(x0, x1, d.f) + Math.cos(d.a) * d.sp * u * 1.2, py = ST.slotF - 30 - Math.sin(d.a) * d.sp * u * 0.6 + 25 * u * u;
      x.beginPath(); x.arc(px, py, d.r + 22 * u, 0, TAU); x.fillStyle = `rgba(214,200,170,${0.32 * (1 - u)})`; x.fill();
    }
  }
  function drawRodV(px, py, lean = 0.06) {
    const x = ctx(), len = ST.slotF - py, ex = px - lean * len;
    if (len <= 0) return;
    const ang = Math.atan2(ex - px, len);
    x.save(); x.translate(px, py); x.rotate(-ang);
    const w = 7.9, L = Math.hypot(ex - px, len);
    const gr = x.createLinearGradient(-w / 2, 0, w / 2, 0); gr.addColorStop(0, '#5b3d22'); gr.addColorStop(0.45, '#c8a06a'); gr.addColorStop(1, '#6e4a2a');
    x.fillStyle = gr; x.fillRect(-w / 2, 0, w, L); x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(w / 2 - 1, 0, 1, L);
    x.restore();
    x.beginPath(); x.ellipse(ex, ST.slotF, w * 1.6, 2.6, 0, 0, TAU); x.fillStyle = 'rgba(8,4,2,0.6)'; x.fill();
  }

  // ---------- foule (rêvée) : monte de la fente arrière, puis redescend
  const CROWD = [
    ['garde', 165, 1, 0.0, 'flag'], ['bourgeois', 232, 1, 0.7, 'hat'], ['dame', 298, 1, 1.4, null],
    ['grenadier', 738, -1, 0.4, null], ['dame', 802, -1, 1.1, null], ['garde', 866, -1, 2.5, 'flag'],
  ];
  function crowd(t) {
    for (const [kind, cx, d, ph, prop] of CROWD) {
      const u = easeOut((t - E.crowd0 - ph * 0.05) / (E.crowd1 - E.crowd0)) * (1 - easeIn((t - E.crowdSink0 - ph * 0.03) / (E.crowdSink1 - E.crowdSink0)));
      if (u <= 0.001) continue;
      const cheer = smooth(E.crowd1 - 0.2, E.crowd1, t) * (1 - smooth(E.crowdSink0 - 0.2, E.crowdSink0, t));
      const bob = -Math.abs(Math.sin(t * 5 + ph)) * 7 * cheer;
      const def = C[kind], sc = kind === 'grenadier' ? 0.66 : 0.72;
      const pose = { dy: ((1 - u) * 430 + bob) / sc, ang: {}, face: {} };
      if (kind === 'grenadier') pose.ang = { musket: 0.2 };
      if (prop === 'hat') { pose.ang.armF_up = -2.5 + Math.sin(t * 6 + ph) * 0.22 * cheer; pose.ang.armF_lo = -0.3; }
      if (prop === 'flag') { pose.ang.armF_up = -1.2 + Math.sin(t * 5 + ph) * 0.12 * cheer; pose.ang.armF_lo = -1.1; }
      pose.ang.head = 0.05 * Math.sin(t * 1.3 + ph);
      clipAbove(ST.slotB, () => {
        const r = M.puppet(def, pose, cx, FEETB, sc, { dir: d, slot: ST.slotB, cast: { dx: 16, dy: 8, a: 0.22 } });
        if (prop === 'flag') { const hp = r.w('armF_lo', 0, 96); M.drapeau(hp[0] - d * 4, hp[1] + 60, 0.62, t, ph * 2, 200); }
      });
    }
  }

  S.draw = (t) => {
    const x = ctx();
    // ---- fond peint, nuages pendus, coulisses, ferme de Paris
    x.drawImage(K.sky, 0, 0);
    M.hung(K.cloud1, 270, 470, t, { amp: 0.025, cast });
    M.hung(K.cloud2, 800, 380, t, { ph: 2, amp: 0.03, cast });
    M.flat(K.wingL, 120, ST.back, { rot: 0.006 * Math.sin(t * 0.9), cast });
    M.flat(K.wingR, 960, ST.back, { rot: 0.006 * Math.sin(t * 0.8 + 1), cast });
    M.flat(K.row, 540, ST.back + 2 * Math.sin(t * 1.3));

    // ---- le vrai arc descend des cintres sur ses câbles (pavoisé)
    const p = easeOut((t - E.arc0) / (E.arc1 - E.arc0));
    const ay = ST.back - (1 - p) * 1250 + wob(t, E.arc1, -12, 2.2, 5.5);
    const rot = wob(t, E.arc1, 0.008, 1.6, 4) + 0.006 * Math.sin(t * 4) * (p > 0 && p < 1 ? 1 : 0);
    if (t > E.arc0 - 0.05) {
      x.strokeStyle = 'rgba(60,50,40,0.85)'; x.lineWidth = 2.2;
      for (const d of [-1, 1]) { const cx = ARCX + d * 360; x.beginPath(); x.moveTo(cx, ay - M.ARC.h * AS + 6); x.lineTo(cx + d * 4, 0); x.stroke(); }
      M.flat(K.vrai, ARCX, ay, { rot, scale: AS, clipY: ST.back + 1, cast: { dx: 18, dy: 8, a: 0.4 } });
      for (const [fx, ph] of [[ARCX - 300, 0], [ARCX - 40, 1.3], [ARCX + 220, 2.4]]) M.drapeau(fx, ay - M.ARC.h * AS + 2, 0.9, t, ph, 170);
    }
    M.drawFloor();
    crowd(t);

    // ---- Napoléon (fente avant), tige propre (il pivote sur son rivet)
    const nf = napFrame(t);
    if (nf.st.x > -200) {
      // la tige : solidaire jusqu'à la bascule, puis l'opérateur la lâche — elle glisse sous la scène par la fente
      const RP = rodPiv(), drop = t > E.fall0 ? easeIn((t - E.fall0) / (E.rodGone - E.fall0)) : 0;
      if (drop < 1) clipAbove(ST.slotF, () => drawRodV(t > E.fall0 ? RP[0] : nf.piv[0], (t > E.fall0 ? RP[1] : nf.piv[1]) + drop * 300));
      // ombre au sol quand il est couché
      if (t > E.fall0) {
        const k = smooth(E.fall0 + 0.2, E.fallLand, t), fx = nf.st.x - 270 * NS, fy = ST.slotF - 6;
        const g = x.createRadialGradient(fx, fy, 2, fx, fy, 300); g.addColorStop(0, `rgba(15,8,3,${0.4 * k})`); g.addColorStop(1, 'rgba(15,8,3,0)');
        x.save(); x.translate(fx, fy); x.scale(1, 0.06); x.translate(-fx, -fy); x.fillStyle = g; x.fillRect(fx - 320, fy - 320, 640, 640); x.restore();
      }
      x.save(); x.setTransform(nf.R);
      const ca = Object.assign({}, cast, { a: 0.3 * (1 - smooth(E.fall0, E.fall0 + 0.25, t)) });
      const r = M.puppet(C.napoleon, nf.st.pose, nf.st.x, FEET, NS, { dir: 1, slot: ST.slotF, cast: ca.a > 0.01 ? ca : null, rod: false, floorShadow: t < E.fall0 });
      x.setTransform(r.mats.torso); M.rivet(-26, 10, 3); M.rivet(-26, 28, 3);
      x.restore();
      dust(t);
    }
    // bicorne libre : saute, fait un tour, retombe au-delà des bottes et roule un peu
    if (t > E.hatOff) { const h = freeHat(t); M.bicorne(h.x, h.y, NS, h.r, 1); }

    const sx = lerp(clamp(nf.st.x - 20, 260, 620), NAPX - 230, smooth(E.fall0, E.fallLand, t));
    const tight = smooth(E.attn0, E.fall0, t);
    M.stageLight(t, { spot: { x: sx, y: lerp(1080, 1150, tight), r: lerp(480, 400, tight), a: lerp(0.36, 0.5, tight) } });
    const cs = curtainState(t);
    M.curtain(t, cs.f, { swing: cs.swing });
    M.drawFrame(t);
  };
  return S;
})();
