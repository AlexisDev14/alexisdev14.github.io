// Extrait m4 — « Le faux » (théâtre de marionnettes à tiges)
const SCENE = (() => {
  const S = {}, E = TL.EVENTS, C = M.chars, ST = M.ST;
  const { clamp, lerp, ease, easeOut, smooth, wob, noise, TAU } = M;
  let K;
  S.init = () => {
    K = {
      sky: M.makeSky('aube'), row: M.makeParisRow(), wingL: M.makeTreeWing(5, false), wingR: M.makeTreeWing(9, true),
      cloud1: M.makeCloud(1, 1), cloud2: M.makeCloud(2, 0.8), faux: M.makeArc(true),
    };
  };
  const cast = { dx: 22, dy: 10, a: 0.3 };
  const ARCX = 500, AS = 0.9, NAPX = 468, JAMB = [ARCX - 143 * 0.9 + 6, 1092];
  const FEET = ST.slotF - 34, FEETB = ST.slotB - 30;

  // ---------- rideau
  function curtainState(t) {
    const u = (t - E.curtain0) / (E.curtain1 - E.curtain0);
    const f = ease(u);
    const vel = (ease(u + 0.02) - ease(u - 0.02)) / (0.04 * (E.curtain1 - E.curtain0));
    return { f, swing: -vel * 9 + wob(t, E.curtain1, 26, 0.85, 2.6) };
  }
  // ---------- faux arc : montée, rebond, vacillement
  function flatState(t) {
    const p = easeOut((t - E.flat0) / (E.flat1 - E.flat0));
    let y = ST.back + (1 - p) * 1010 + wob(t, E.flat1, -16, 2.6, 5.5);
    let rot = 0.01 * Math.sin(t * 5.3) * (p > 0 && p < 1 ? 1 : 0) + wob(t, E.flat1, 0.006, 1.8, 4);
    // appui de Napoléon : la toile s'enfonce, l'arc oscille dangereusement sur sa charpente
    const push = smooth(E.touch - 0.08, E.touch + 0.05, t) * (1 - smooth(E.release, E.release + 0.15, t));
    rot += -0.012 * push + wob(t, E.touch, -0.03, 1.35, 4.4) + wob(t, E.release, 0.012, 1.6, 5);
    const skew = wob(t, E.touch, 0.035, 1.35, 4.6);
    const amp = (t > E.touch ? 15 * Math.exp(-4.8 * (t - E.touch)) : 0) + 1.2 * smooth(E.flat0, E.flat0 + 0.3, t) * (1 - smooth(E.flat1, E.flat1 + 0.6, t));
    return { y, rot, skew, amp, push, vis: t > E.flat0 - 0.05 };
  }
  // ---------- couple
  function coupleX(t) {
    // Napoléon mène (vers la gauche) ; Marie-Louise suit à +185
    const u = M.clamp((t - E.walk0) / (E.walk1 - E.walk0));
    const v = u < 0.15 ? u * u / 0.3 : u > 0.85 ? 1 - (1 - u) * (1 - u) / 0.3 : (u - 0.075) / 0.85;
    return lerp(1190, NAPX, v);
  }
  function hop(t, ph = 0) {
    const moving = t > E.walk0 && t < E.walk1 + 0.05;
    const p = (t - E.walk0) * 2.3 + ph;
    const env = smooth(E.walk0, E.walk0 + 0.2, t) * (1 - smooth(E.walk1 - 0.2, E.walk1 + 0.05, t));
    return { dy: -Math.abs(Math.sin(Math.PI * p)) * 11 * env, leg: Math.sin(TAU * p * 0.5) * 0.24 * env, tilt: 0.045 * env, moving };
  }

  // ---------- pétales de papier
  const PET = []; { const R = M.rng(44); for (let i = 0; i < 80; i++) PET.push({ x: 300 + R() * 640, t0: E.petals0 + R() * 1.6, v: 560 + R() * 180, ph: R() * TAU, r: R() < 0.55, s: 0.7 + R() * 0.6 }); }
  function petals(t) {
    const ctx = M.ctx();
    for (const p of PET) {
      const u = t - p.t0; if (u < 0) continue;
      const y = 150 + u * p.v; if (y > ST.slotF + 10) continue;
      const x = p.x + Math.sin(u * 3 + p.ph) * 26 - u * 20;
      const fl = Math.cos(u * 7 + p.ph);
      ctx.save(); ctx.translate(x, y); ctx.rotate(u * 2 + p.ph); ctx.scale(fl * p.s, p.s);
      ctx.beginPath(); ctx.ellipse(1, 1.4, 11, 6.5, 0, 0, TAU);
      ctx.fillStyle = 'rgba(20,10,5,0.3)'; ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, 0, 10, 6, 0, 0, TAU);
      ctx.fillStyle = p.r ? (fl > 0 ? '#b8443a' : '#8e2a26') : (fl > 0 ? '#efe7d4' : '#cfc2a3'); ctx.fill();
      ctx.restore();
    }
  }

  S.draw = (t) => {
    const ctx = M.ctx();
    // ---- fond peint, nuages pendus, coulisses, ferme de Paris
    ctx.drawImage(K.sky, 0, 0);
    M.hung(K.cloud1, 290, 470, t, { amp: 0.025, cast });
    M.hung(K.cloud2, 790, 360, t, { ph: 2, amp: 0.03, cast });
    M.flat(K.wingL, 120, ST.back, { rot: 0.006 * Math.sin(t * 0.9), cast });
    M.flat(K.wingR, 960, ST.back, { rot: 0.006 * Math.sin(t * 0.8 + 1), cast });
    M.flat(K.row, 540, ST.back + 2 * Math.sin(t * 1.3));

    // ---- le faux arc qui monte de la trappe (charpente + toile peinte)
    const fs = flatState(t);
    if (fs.vis) {
      const topY = fs.y - M.ARC.h * AS;
      // cordes des poulies (montent vers les cintres)
      ctx.save(); ctx.strokeStyle = 'rgba(150,120,80,0.85)'; ctx.lineWidth = 2.4;
      for (const d of [-1, 1]) { const rx = ARCX + d * 380 + Math.sin(fs.rot) * 860, ry = topY - 20; ctx.beginPath(); ctx.moveTo(rx, ry); ctx.quadraticCurveTo(rx + d * 6, (ry + 150) / 2, rx + d * 14, 150); ctx.stroke(); }
      ctx.restore();
      M.flat(K.faux, ARCX, fs.y, { rot: fs.rot, skew: fs.skew, clipY: ST.back + 1, cast: { dx: 18, dy: 8, a: 0.42 },
        ripple: { amp: fs.amp, t, cx: (JAMB[0] - ARCX) / AS, cy: (JAMB[1] - ST.back) / AS, k: 0.02, w: 11 }, scale: AS });
      // creux de la toile sous la main
      if (fs.push > 0.01) {
        const [jx, jy] = JAMB;
        const g2 = ctx.createRadialGradient(jx - 30, jy, 4, jx - 30, jy, 110);
        g2.addColorStop(0, `rgba(40,25,10,${0.5 * fs.push})`); g2.addColorStop(1, 'rgba(40,25,10,0)');
        ctx.fillStyle = g2; ctx.fillRect(jx - 150, jy - 120, 240, 240);
        ctx.strokeStyle = `rgba(50,30,10,${0.5 * fs.push})`; ctx.lineWidth = 1.6;
        for (let k = 0; k < 6; k++) { const a = Math.PI * 0.6 + k * 0.32; ctx.beginPath(); ctx.moveTo(jx - 14 + Math.cos(a) * 18, jy + Math.sin(a) * 18); ctx.quadraticCurveTo(jx - 14 + Math.cos(a) * 60, jy + Math.sin(a) * 50 + 6, jx - 14 + Math.cos(a) * 105, jy + Math.sin(a) * 95); ctx.stroke(); }
      }
    }
    M.drawFloor();

    // ---- l'architecte (fente arrière)
    const arPose = { ang: { armB_up: 0.25, armB_lo: -0.7 }, face: { brow: 'worry' }, dy: Math.sin(t * 1.9) * 1.2 };
    const pres = smooth(E.present0, E.present0 + 0.35, t) * (1 - smooth(4.0, 4.5, t));
    arPose.ang.armF_up = lerp(0.05, -1.25, pres); arPose.ang.armF_lo = lerp(-0.15, -0.35, pres);
    arPose.ang.head = -0.12 * pres + 0.12 * Math.sin(Math.max(0, t - E.settle) * 9) * Math.exp(-3 * Math.max(0, t - E.settle)) * (t > E.settle ? 1 : 0);
    arPose.face.mouth = t > E.settle && t < E.facepalm ? 'smile' : 'n';
    const arX = 830 + 6 * Math.sin(t * 0.7), arS = 0.96;
    if (t > E.facepalm) {
      const k = smooth(E.facepalm, E.facepalm + 0.28, t);
      const m = M.partMatrices(C.architecte, Object.assign({}, arPose, { ang: Object.assign({}, arPose.ang, { head: 0.12 * k }) }), arX, FEETB, arS, -1).mats;
      const eyeW = M.wpt(m.head, 14, -56);
      const sol = M.ik(C.architecte, arPose, arX, FEETB, arS, -1, 'armF', eyeW, 1);
      arPose.ang.armF_up = lerp(arPose.ang.armF_up, sol.up, k); arPose.ang.armF_lo = lerp(arPose.ang.armF_lo, sol.lo, k);
      arPose.ang.head = 0.12 * k; arPose.tilt = 0.05 * k * -1;
      arPose.face = { brow: 'worry', mouth: 'tight', eyes: 'closed' };
    }
    M.puppet(C.architecte, arPose, arX, FEETB, arS, { dir: -1, slot: ST.slotB, cast });

    // ---- le couple (fente avant)
    const nx = coupleX(t), mx = nx + 178;
    const hn = hop(t, 0), hm = hop(t, 0.35);
    const mlPose = { dy: hm.dy + Math.sin(t * 2.1 + 1) * 1.2, tilt: hm.tilt, ang: { armF_up: -0.12, armF_lo: -0.95, armB_up: 0.15, armB_lo: -0.2, mantle: Math.sin(t * 4.6) * 0.03 * (hm.moving ? 1 : 0.2), head: -0.06 }, face: { mouth: 'smile' } };
    if (t > E.touch) { const k = smooth(E.touch, E.touch + 0.2, t); mlPose.ang.head = lerp(-0.06, -0.2, k); mlPose.face = { mouth: t < 8.9 ? 'o' : 'n', eyes: 'wide', brow: 'up' }; }
    if (mx < 1150) M.puppet(C.marieLouise, mlPose, mx, FEET, 1, { dir: -1, slot: ST.slotF, cast });

    const napPose = { tuck: true, dy: hn.dy + Math.sin(t * 2.0) * 1.2, tilt: hn.tilt, ang: { armF_up: 0.18, armF_lo: -1.85, armB_up: 0.35, armB_lo: -0.4, legF: hn.leg, legB: -hn.leg, head: -0.1 }, face: { brow: 'frown', mouth: 'n' } };
    // geste d'appui
    const reach = smooth(E.reach0, E.touch, t) * (1 - smooth(E.release, E.release + 0.3, t));
    if (reach > 0.001) {
      const target = [JAMB[0] + 8 - 10 * smooth(E.touch - 0.05, E.touch + 0.08, t) * (1 - smooth(E.release, E.release + 0.1, t)), JAMB[1]];
      const p0 = Object.assign({}, napPose, { tuck: false });
      const sol = M.ik(C.napoleon, p0, nx, FEET, 1, -1, 'armF', target, 1);
      napPose.tuck = reach < 0.25 && t < E.touch;
      napPose.handF = 'open';
      napPose.ang.armF_up = lerp(0.18, sol.up, reach); napPose.ang.armF_lo = lerp(-1.85, sol.lo, reach);
      if (reach > 0.25 || t > E.touch) napPose.tuck = false;
      if (t > E.release && reach < 0.3) napPose.tuck = true;
      napPose.ang.head = -0.04;
    }
    if (t > E.touch) {
      const k = smooth(E.touch, E.touch + 0.15, t);
      napPose.face = { brow: 'up', eyes: 'wide', mouth: t < 8.95 ? 'o' : 'tight' };
      napPose.tilt = -0.07 * smooth(E.release, E.release + 0.2, t) * (1 - 0.6 * smooth(8.9, 9.3, t));
      napPose.ang.head = lerp(-0.04, -0.16, k);
    }
    if (nx < 1150) M.puppet(C.napoleon, napPose, nx, FEET, 1, { dir: -1, slot: ST.slotF, cast, handRod: reach > 0.05 ? ['armF_lo', 0, 70] : null, handRodAng: 0.05 });

    petals(t);
    M.stageLight(t, { spot: { x: 520, y: 1080, r: 480, a: 0.4 } });
    const cs = curtainState(t);
    M.curtain(t, cs.f, { swing: cs.swing });
    M.drawFrame(t);
  };
  return S;
})();
