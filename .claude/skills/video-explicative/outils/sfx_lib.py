# Bruitages du théâtre de marionnettes : bibliothèque CC0 (dossier sons/, voir sons/LICENCES.md) + synthèse.
# Usage dans le mixage.py d'un plan :
#   import sys; sys.path.insert(0, '<outils>'); from sfx_lib import Mix, events
#   E = events('timeline.js'); m = Mix(mots=[(4.3, 4.9), ...])   # mots-clés de la voix à laisser libres
#   m.rideau_ouvre(E['rideau0'], E['rideau1']); m.decor_monte(1.6, 2.85, poids='lourd'); m.apparition(4.4)
#   m.write('sfx.wav')
# Tous les niveaux sont des crêtes en dBFS. Les préréglages sont calibrés pour rester SOUS la voix off :
# un bruitage « principal » ≈ −28, un détail ≈ −34 à −40. Plafond global −24 dBFS (jamais plus fort).
import numpy as np, wave, os, subprocess, re

SR, DUR = 48000, 10
N = SR * DUR
SONS = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sons')
PLAFOND = -24.0


class Mix:
    def __init__(self, sons=SONS, seed=1, mots=()):
        self.dir = sons
        self.buf = np.zeros((N, 2))
        self.rng = np.random.default_rng(seed)
        self.mots = list(mots)          # [(t0, t1)] mots-clés de la voix : aucun bruitage marqué dessus
        self.cache = {}
        self.log = []

    # ------------------------------------------------------------ bas niveau
    def load(self, nom, af=None):
        """Charge sons/<nom>.mp3 (48 kHz stéréo), avec un filtre ffmpeg optionnel (ex. 'lowpass=f=2000')."""
        k = (nom, af)
        if k not in self.cache:
            cmd = ['ffmpeg', '-loglevel', 'error', '-i', os.path.join(self.dir, nom + '.mp3')]
            if af: cmd += ['-af', af]
            raw = subprocess.run(cmd + ['-ar', str(SR), '-ac', '2', '-f', 's16le', '-'], capture_output=True, check=True).stdout
            self.cache[k] = np.frombuffer(raw, dtype=np.int16).reshape(-1, 2).astype(float) / 32768
        return self.cache[k]

    def _put(self, st, at, label):
        i0 = int(round(at * SR))
        if i0 < 0: st = st[-i0:]; i0 = 0
        i1 = min(N, i0 + len(st))
        if i1 > i0: self.buf[i0:i1] += st[:i1 - i0]
        self.log.append((round(at, 2), label))

    @staticmethod
    def _pan(x, pan):
        return np.stack([x * np.cos((pan + 1) * np.pi / 4), x * np.sin((pan + 1) * np.pi / 4)], 1) * 1.41

    def place(self, nom, at, db, pan=0.0, start=0.0, end=None, af=None, rate=1.0, fin=0.004, fout=0.08, label=None):
        """Pose un échantillon (crête = db) à l'instant at. rate < 1 = plus grave et plus lent."""
        if rate != 1.0:
            af = ((af + ',') if af else '') + f'asetrate={int(SR * rate)},aresample={SR}'
        src = self.load(nom, af)
        seg = src[int(start * SR):int(end * SR) if end else None].mean(1)
        if not len(seg): return
        seg = seg / (np.abs(seg).max() + 1e-9) * 10 ** (db / 20)
        n = len(seg); env = np.ones(n); fi, fo = min(n, int(fin * SR)), min(n, int(fout * SR))
        if fi: env[:fi] = np.linspace(0, 1, fi)
        if fo: env[-fo:] *= np.linspace(1, 0, fo)
        self._put(self._pan(seg * env, pan), at, label or nom)

    def add(self, sig, at, db, pan=0.0, label='synth'):
        sig = sig / (np.abs(sig).max() + 1e-9) * 10 ** (db / 20)
        self._put(self._pan(sig, pan), at, label)

    def bandpass(self, x, lo, hi):
        X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
        g = np.clip((f - lo * 0.7) / (lo * 0.3 + 1e-9), 0, 1) * np.clip((hi * 1.4 - f) / (hi * 0.4), 0, 1)
        return np.fft.irfft(X * g, len(x))

    # ------------------------------------------------------------ synthèse (matières du théâtre)
    def swish(self, t0, t1, db, pan=0.0, lo=250, hi=2600, forme=1.4, label='frottement'):
        """Frottement de tissu / de carton : bruit filtré, enveloppe en cloche, grain irrégulier."""
        n = max(1, int((t1 - t0) * SR)); d = np.arange(n) / n
        x = self.bandpass(self.rng.standard_normal(n), lo, hi)
        grain = np.clip(0.7 + 0.3 * np.abs(self.bandpass(self.rng.standard_normal(n), 3, 18)) / 0.05, 0, 1.6)
        self.add(x * np.sin(np.pi * d) ** forme * grain, t0, db, pan, label)

    def rings(self, t0, t1, db, pan=0.0, n=9, label='anneaux de tringle'):
        """Anneaux de laiton qui roulent sur la tringle : cliquetis métalliques irréguliers."""
        out = np.zeros(int((t1 - t0 + 0.2) * SR)); L = int(0.05 * SR); tt = np.arange(L) / SR
        for k in range(n):
            f0 = self.rng.uniform(2100, 3300)
            cl = sum(a * np.sin(2 * np.pi * f0 * r * tt) for r, a in [(1, 1), (1.51, 0.5), (2.37, 0.3)]) * np.exp(-tt / 0.012)
            i0 = max(0, int((k / n * (t1 - t0) + self.rng.uniform(-0.03, 0.03)) * SR))
            out[i0:i0 + L] += cl[:len(out) - i0] * self.rng.uniform(0.4, 1)
        self.add(out, t0, db, pan, label)

    def creak(self, t0, t1, db, f0=520, pan=0.0, rate=32, label='poulie'):
        """Poulie / corde qui grince : impulsions de frottement (stick-slip) résonantes."""
        n = max(1, int((t1 - t0) * SR)); out = np.zeros(n)
        L = int(0.03 * SR); tt = np.arange(L) / SR; t = 0.0
        while t < t1 - t0:
            f = f0 * (1 + 0.12 * np.sin(2 * np.pi * 1.3 * t)) * self.rng.uniform(0.97, 1.03)
            g = sum(a * np.sin(2 * np.pi * f * r * tt) for r, a in [(1, 1), (2, 0.45), (3.1, 0.25)]) * np.exp(-tt / 0.008)
            i0 = int(t * SR); i1 = min(n, i0 + L); out[i0:i1] += g[:i1 - i0] * self.rng.uniform(0.5, 1)
            t += 1 / (rate * self.rng.uniform(0.8, 1.25))
        d = np.arange(n) / n
        out *= np.minimum(1, d / 0.08) * np.minimum(1, (1 - d) / 0.15) * (0.6 + 0.4 * np.sin(np.pi * d * 3) ** 2)
        self.add(out, t0, db, pan, label)

    def clac(self, at, db, pan=0.0, f=900, label='clac de bois'):
        """Petit claquement sec de marionnette en bois."""
        L = int(0.06 * SR); tt = np.arange(L) / SR
        x = self.bandpass(self.rng.standard_normal(L * 4), 1200, 5000)[:L] * np.exp(-tt / 0.006) + 0.8 * np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.018)
        self.add(x * np.minimum(1, tt / 0.0008), at, db, pan, label)

    def carillon(self, at, db=-34, pan=0.0, notes=(1318.5, 1975.5)):
        """Petit carillon (boîte à musique) : réservé à un « ding » de satisfaction, après le mot."""
        L = int(1.2 * SR); tt = np.arange(L) / SR; x = np.zeros(L)
        for k, f in enumerate(notes):
            i0 = int(k * 0.11 * SR); e = np.exp(-tt[:L - i0] / 0.35)
            x[i0:] += (np.sin(2 * np.pi * f * tt[:L - i0]) + 0.3 * np.sin(2 * np.pi * 2.76 * f * tt[:L - i0]) * np.exp(-tt[:L - i0] / 0.08)) * e
        self.add(x, at, db, pan, 'carillon')

    def murmure(self, t0, t1, db=-40, pan=0.0):
        """Rumeur polie de foule de marionnettes (bruit rose filtré « voix », vagues lentes)."""
        n = int((t1 - t0) * SR)
        p = np.cumsum(self.rng.standard_normal(n)); p -= np.convolve(p, np.ones(4800) / 4800, 'same')
        x = self.bandpass(p + 0.4 * self.rng.standard_normal(n), 250, 1300); d = np.arange(n) / SR
        x *= (0.75 + 0.25 * np.sin(2 * np.pi * 0.7 * d) * np.sin(2 * np.pi * 1.9 * d + 1)) * np.minimum(1, d / 0.5) * np.minimum(1, (t1 - t0 - d) / 0.7)
        self.add(x, t0, db, pan, 'murmure de foule')

    def applaudissements(self, t0, t1, db=-36, n_people=30):
        """Applaudissements polis (impulsions filtrées) — seulement s'ils sont visibles à l'image."""
        out = np.zeros(int((t1 - t0 + 0.3) * SR))
        for _ in range(n_people):
            rate = self.rng.uniform(3.2, 5.0); lo = self.rng.uniform(700, 1500)
            L = int(0.1 * SR); tt = np.arange(L) / SR
            cl = self.bandpass(self.rng.standard_normal(L * 4), lo, lo * 2.8)[:L] * np.minimum(1, tt / 0.001) * np.exp(-tt / self.rng.uniform(0.012, 0.03))
            t = self.rng.uniform(0, 0.4)
            while t < t1 - t0 - self.rng.uniform(0, 0.4):
                i0 = int(t * SR); i1 = min(len(out), i0 + L); out[i0:i1] += cl[:i1 - i0] * self.rng.uniform(0.5, 1)
                t += 1 / rate * self.rng.uniform(0.85, 1.15)
        d = np.arange(len(out)) / SR
        out *= np.minimum(1, d / 0.3) * np.minimum(1, np.maximum(0, (t1 - t0 - d)) / 0.6)
        self.add(out, t0, db, 0.0, 'applaudissements')

    # ------------------------------------------------------------ PRÉRÉGLAGES (à utiliser en priorité)
    def rideau_ouvre(self, t0, t1, db=-28):
        """Le rideau de velours s'ouvre (deux pans qui glissent vers les côtés) :
        velours grave et lent sur chaque pan, anneaux de laiton sur la tringle, le tissu se pose à la fin."""
        d = t1 - t0
        for pan, dl in ((-0.55, 0.0), (0.55, 0.04)):
            self.place('velours', t0 + dl, db - 1, pan, rate=0.72, af='lowpass=f=3200', fin=0.12, fout=0.35, label='rideau (velours)')
            self.rings(t0 + 0.05 + dl, t0 + 0.05 + dl + d * 0.8, db - 12, pan * 1.3, n=max(6, int(d * 9)))
        self.swish(t0, t1 + 0.15, db - 6, 0.0, lo=180, hi=1800, label='rideau (souffle)')
        self.place('velours', t1 - 0.05, db - 9, 0.0, start=1.6, rate=0.6, af='lowpass=f=1500', fin=0.05, fout=0.4, label='rideau (le tissu se pose)')

    def rideau_ferme(self, t0, t1, db=-28):
        """Le rideau se ferme : les deux pans glissent vers le centre et se rejoignent avec un « flomp » feutré."""
        d = t1 - t0
        for pan, dl in ((-0.5, 0.0), (0.5, 0.03)):
            self.place('velours', t0 + dl, db - 1, pan * 0.7, rate=0.75, af='lowpass=f=3000', fin=0.1, fout=0.25, label='rideau (velours)')
            self.rings(t0 + dl, t0 + dl + d * 0.85, db - 12, pan, n=max(6, int(d * 9)))
        self.swish(t0, t1, db - 6, 0.0, lo=180, hi=1800, label='rideau (souffle)')
        self.place('choc_sourd', t1 - 0.01, db - 6, 0.0, af='lowpass=f=450', fin=0.003, fout=0.3, label='rideau (les pans se rejoignent)')

    def rideau_change(self, t_ferme0, t_ferme1, t_ouvre0, t_ouvre1, db=-29):
        """Changement de scène par le rideau (fermeture puis réouverture rapides)."""
        self.rideau_ferme(t_ferme0, t_ferme1, db)
        self.rideau_ouvre(t_ouvre0, t_ouvre1, db - 1)

    def decor_monte(self, t0, t1, pan=0.0, poids='leger', db=-30):
        """Un décor en carton monte de la trappe (ou descend des cintres, voir decor_descend) :
        poulie qui grince + corde, puis butée de bois à l'arrivée (t1) avec un petit tremblement."""
        lourd = poids == 'lourd'
        self.creak(t0, t1, db - 8, f0=430 if lourd else 640, pan=pan, rate=26 if lourd else 36)
        self.swish(t0, t1, db - 12, pan, lo=900, hi=4200, forme=0.8, label='corde')
        if lourd: self.place('bois_grince', t0 + (t1 - t0) * 0.3, db - 8, pan, end=0.9, af='highpass=f=200,lowpass=f=3500', fin=0.05, fout=0.25)
        self.place('bois_butee' if lourd else 'bois_petit', t1 - 0.01, db, pan, af='lowpass=f=5000', label='butée')
        self.clac(t1 + 0.11, db - 10, pan, f=640); self.clac(t1 + 0.2, db - 15, pan, f=700)

    def decor_descend(self, t0, t1, pan=0.0, poids='leger', db=-30):
        """Un décor descend des cintres sur ses câbles : corde qui file + poulie, butée douce à l'arrivée."""
        self.swish(t0, t1, db - 9, pan, lo=1200, hi=5000, forme=0.9, label='câbles qui filent')
        self.creak(t0, t1, db - 10, f0=560 if poids == 'lourd' else 720, pan=pan, rate=40)
        self.place('bois_butee' if poids == 'lourd' else 'bois_petit', t1 - 0.01, db - 1, pan, af='lowpass=f=4000', label='butée')
        self.clac(t1 + 0.12, db - 13, pan, f=620)

    def decor_tombe(self, t, pan=0.0, db=-27):
        """Un décor de carton bascule et tombe à plat (« flomp » + bois)."""
        self.place('choc_sourd', t - 0.02, db, pan, af='lowpass=f=900', fout=0.35, label='décor qui tombe')
        self.place('bois_petit', t + 0.03, db - 6, pan * 1.2, label='décor qui tombe (bois)')

    def apparition(self, t, pan=0.0, db=-33):
        """Une marionnette entre en scène / apparaît par la fente : la tige glisse, petit clac à l'arrêt (t)."""
        self.swish(t - 0.28, t + 0.02, db - 7, pan, lo=700, hi=3800, forme=1.0, label='tige qui glisse')
        self.clac(t, db, pan, f=820)

    def disparition(self, t, pan=0.0, db=-35):
        """Une marionnette quitte la scène par la fente (t = début) : glissement descendant, toc sous la scène."""
        self.swish(t, t + 0.3, db - 6, pan, lo=500, hi=2600, forme=1.0, label='tige qui descend')
        self.place('bois_petit', t + 0.3, db - 2, pan, af='lowpass=f=1500', label='toc sous la scène')

    def glisse(self, t0, t1, pan0=0.0, pan1=0.0, db=-38, sauts=()):
        """Déplacement d'une marionnette sur sa tige : frottement léger + clacs aux sautillements."""
        self.swish(t0, t1, db, (pan0 + pan1) / 2, lo=400, hi=2000, forme=0.6, label='glissement')
        for k, ts in enumerate(sauts):
            u = (ts - t0) / max(1e-3, t1 - t0)
            self.clac(ts, db + 4 - (k % 2), pan0 + (pan1 - pan0) * u, f=760 + 40 * (k % 3))

    def pas(self, instants, pan=0.0, db=-31):
        for k, t in enumerate(instants): self.place(f'pas{k % 3 + 1}', t - 0.005, db - (k % 2), pan, label='pas')

    def objet_pose(self, t, pan=0.0, db=-33):
        """Un petit accessoire posé / attrapé (couronne, chapeau, rouleau)."""
        self.place('bois_petit', t - 0.005, db, pan, af='lowpass=f=3000', label='objet posé')

    def chute(self, t, pan=0.0, db=-26):
        """Une marionnette tombe à plat sur le plancher."""
        self.place('chute_corps', t - 0.01, db, pan, af='lowpass=f=2400', fout=0.25, label='chute')

    def papier(self, t, pan=0.0, long=False, db=-30):
        self.place('papier_deroule_long' if long else 'papier_deroule_court', t - 0.01, db, pan, af='highpass=f=150', fout=0.12, label='papier')

    def ambiance(self, nom, t0, t1, db=-42, pan=0.0, af=None):
        """Ambiance du lieu seulement si elle est visible (vent avec neige, mer, herbe) ; très basse."""
        self.place(nom, t0, db, pan, end=t1 - t0, af=af, fin=0.5, fout=0.8, label=f'ambiance {nom}')

    # ------------------------------------------------------------ sortie
    def verifier(self):
        """Signale tout bruitage marqué (> −32 dBFS localement) qui démarre sur un mot-clé de la voix."""
        alertes = []
        for (t, lab) in self.log:
            for (a, b) in self.mots:
                if a - 0.05 <= t <= b:
                    i0, i1 = int(t * SR), int(min(DUR, t + 0.2) * SR)
                    if i1 > i0 and 20 * np.log10(np.abs(self.buf[i0:i1]).max() + 1e-9) > -32:
                        alertes.append(f'{t:.2f} s « {lab} » sur un mot-clé ({a:.2f}–{b:.2f})')
        return alertes

    def write(self, out):
        pk = np.abs(self.buf).max()
        if pk > 10 ** (PLAFOND / 20): self.buf *= 10 ** (PLAFOND / 20) / pk
        o = wave.open(out, 'wb'); o.setnchannels(2); o.setsampwidth(2); o.setframerate(SR)
        o.writeframes((np.clip(self.buf, -1, 1) * 32767).astype(np.int16).tobytes()); o.close()
        print('crête', round(20 * np.log10(np.abs(self.buf).max() + 1e-9), 1), 'dBFS —', len(self.log), 'bruitages')
        for a in self.verifier(): print('ATTENTION', a)
        for t, lab in sorted(self.log): print(f'  {t:5.2f} s  {lab}')


def events(timeline_js):
    """Lit TL.EVENTS de timeline.js → {nom: instant}."""
    s = open(timeline_js).read()
    return {k: float(v) for k, v in re.findall(r"(\w+):\s*(-?[\d.]+)", s.split('TL.EVENTS =')[1].split('};')[0])}


def mux(video, sfx, sortie):
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', video, '-i', sfx, '-map', '0:v', '-map', '1:a', '-c:v', 'copy',
                    '-c:a', 'aac', '-b:a', '192k', '-ac', '2', '-shortest', sortie], check=True)
    print('→', sortie)
