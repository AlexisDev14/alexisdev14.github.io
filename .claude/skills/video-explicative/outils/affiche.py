# Affiche (couverture TikTok) : pose une enseigne de théâtre, suspendue à deux fils, avec le titre, sur une image de scène
# rendue par le kit (render.cjs … --stills N). La couleur de l'enseigne suit le thème Clark de la question.
# Usage : python3 -I affiche.py <scene.png> <sortie.png> <THEME> "LIGNE 1" ["petite ligne"] ["LIGNE 3"] [--y 300] [--police chemin.ttf|woff]
#   Une ligne écrite en minuscules (« de la ») passe en petit, entre deux filets. Chaque ligne est ajustée à la largeur
#   de l'enseigne avec une marge fixe : le titre ne déborde jamais.
import os, sys, random
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops

# couleurs des thèmes Clark (packages/shared/src/constants/themeVisuals.ts) : primary, dark
THEMES = {'HIST': ('#7C2D12', '#5B1A0E'), 'GEO': ('#15803D', '#14532D'), 'SCI': ('#06B6D4', '#0E7490'),
          'ART': ('#C026D3', '#86198F'), 'MUS': ('#7C3AED', '#5B21B6'), 'POP': ('#FCAF3C', '#92560B'),
          'SPORT': ('#F97316', '#C2410C'), 'VIE': ('#EC4899', '#BE185D'), 'ECO': ('#334155', '#0F172A'),
          'LANG': ('#4D7C0F', '#365314'), 'ACTU': ('#DC2626', '#991B1B')}
ICI = os.path.dirname(os.path.abspath(__file__))
X = 2                                   # sur-échantillonnage (bords nets)
OR_C, OR_F, BRUN = (226, 192, 120), (150, 108, 46), (52, 34, 14)


def rgb(h): h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
def mix(a, b, k): return tuple(round(a[i] * (1 - k) + b[i] * k) for i in range(3))


def peinture(theme):
    # fond de l'enseigne : la couleur du thème, assourdie (palette du théâtre) ; plus clair au centre
    p, d = map(rgb, THEMES[theme])
    gris = (58, 46, 38)
    vif = (max(p) - min(p)) / 255 * max(p) / 255          # couleurs vives (cyan, rose, ambre) : plus assourdies
    k = 0.2 + 0.35 * vif
    clair, fonce = mix(mix(p, d, 0.5), gris, k), mix(d, gris, k + 0.15)
    lum = (0.3 * clair[0] + 0.59 * clair[1] + 0.11 * clair[2]) / 255
    if lum > 0.36:                                         # fond trop clair pour des lettres dorées (ambre, orange) : on fonce
        f = 1 - (lum - 0.36) / lum; clair, fonce = tuple(round(v * f) for v in clair), tuple(round(v * f) for v in fonce)
    return clair, fonce


def degrade_v(w, h, haut, bas):
    g = Image.new('RGB', (1, h))
    for y in range(h): g.putpixel((0, y), mix(haut, bas, y / max(1, h - 1)))
    return g.resize((w, h))


def grain(w, h, force, seed):
    random.seed(seed)
    n = Image.effect_noise((w // 2, h // 2), 40).resize((w, h)).filter(ImageFilter.GaussianBlur(1))
    return n.point(lambda v: 128 + (v - 128) * force / 40)


def main(a):
    opts = {'--y': '300', '--police': os.path.join(ICI, 'polices', 'Rye-Regular.woff')}
    lignes, i = [], 0
    while i < len(a):
        if a[i] in opts: opts[a[i]] = a[i + 1]; i += 2
        else: lignes.append(a[i]); i += 1
    src, dst, theme, lignes = lignes[0], lignes[1], lignes[2].upper(), lignes[3:]
    base = Image.open(src).convert('RGBA'); W, H = base.size
    big = base.resize((W * X, H * X), Image.LANCZOS)
    police = opts['--police']

    # ---------------- dimensions de l'enseigne (en pixels finaux, puis ×X)
    L, R, T = 150, W - 150, int(opts['--y'])
    pad_x, pad_y, gap = 62, 44, 14
    larg = (R - L - 2 * pad_x) * X
    petites = [s == s.lower() for s in lignes]
    def ajuste(txt, taille_max):
        s = taille_max
        while s > 20:
            f = ImageFont.truetype(police, s * X); b = f.getbbox(txt)
            if b[2] - b[0] <= larg: return f, b
            s -= 2
        return f, b
    def taille(txt, tmax):
        s = tmax
        while s > 20 and ImageFont.truetype(police, s * X).getlength(txt) > larg * 0.97: s -= 2
        return s
    tailles = [taille(s, 54 if p else 160) for s, p in zip(lignes, petites)]
    grandes = [t for t, p in zip(tailles, petites) if not p]
    # équilibre : une grande ligne courte ne dépasse pas 1,3 × la plus petite grande ligne
    tailles = [t if p else min(t, int(min(grandes) * 1.3)) for t, p in zip(tailles, petites)]
    rangs = [ajuste(s, t) for s, t in zip(lignes, tailles)]
    hauteurs = [b[3] - b[1] for _, b in rangs]
    Hi = sum(hauteurs) + gap * X * (len(rangs) - 1) + 2 * pad_y * X
    Bt = T + Hi // X

    # ---------------- ombre portée de l'enseigne sur le décor
    sh = Image.new('RGBA', big.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle([(L + 18) * X, (T + 22) * X, (R + 18) * X, (Bt + 22) * X], 30 * X, fill=(10, 5, 0, 120))
    big = Image.alpha_composite(big, sh.filter(ImageFilter.GaussianBlur(14 * X)))
    d = ImageDraw.Draw(big)

    # ---------------- fils et anneaux (descendent des cintres, sous le lambrequin)
    for x in (L + 150, R - 150):
        d.line([(x * X, 200 * X), (x * X, (T + 4) * X)], fill=(30, 22, 14, 230), width=3 * X)
        d.ellipse([(x - 13) * X, (T - 20) * X, (x + 13) * X, (T + 6) * X], outline=OR_F, width=5 * X)
        d.ellipse([(x - 12) * X, (T - 19) * X, (x + 12) * X, (T + 5) * X], outline=OR_C, width=2 * X)

    # ---------------- cadre doré biseauté (dégradé), puis panneau peint à la couleur du thème
    box = [L * X, T * X, R * X, Bt * X]
    m = Image.new('L', big.size, 0); ImageDraw.Draw(m).rounded_rectangle(box, 28 * X, fill=255)
    big.paste(degrade_v(big.width, big.height, (240, 212, 150), (138, 96, 40)).convert('RGBA'), (0, 0), m)
    d.rounded_rectangle(box, 28 * X, outline=BRUN, width=3 * X)
    b2 = [(L + 14) * X, (T + 14) * X, (R - 14) * X, (Bt - 14) * X]
    d.rounded_rectangle(b2, 20 * X, outline=(110, 76, 30), width=2 * X)
    clair, fonce = peinture(theme)
    pw, ph = b2[2] - b2[0], b2[3] - b2[1]
    pan = Image.new('RGB', (pw, ph), fonce)
    halo = Image.new('L', (pw, ph), 0); ImageDraw.Draw(halo).ellipse([-pw * 0.1, -ph * 0.3, pw * 1.1, ph * 1.3], fill=255)
    pan.paste(Image.new('RGB', (pw, ph), clair), (0, 0), halo.filter(ImageFilter.GaussianBlur(pw // 6)))
    # coups de pinceau horizontaux + grain du papier
    stries = Image.effect_noise((pw // 40, ph), 30).resize((pw, ph)).filter(ImageFilter.GaussianBlur(1.5))
    pan = ImageChops.overlay(pan, Image.merge('RGB', [stries.point(lambda v: 128 + (v - 128) // 3)] * 3))
    pan = ImageChops.overlay(pan, Image.merge('RGB', [grain(pw, ph, 10, 3)] * 3))
    mp = Image.new('L', (pw, ph), 0); ImageDraw.Draw(mp).rounded_rectangle([0, 0, pw - 1, ph - 1], 20 * X, fill=255)
    big.paste(pan.convert('RGBA'), (b2[0], b2[1]), mp)
    d.rounded_rectangle(b2, 20 * X, outline=BRUN, width=3 * X)
    # filet doré intérieur et rivets aux coins
    b3 = [b2[0] + 12 * X, b2[1] + 12 * X, b2[2] - 12 * X, b2[3] - 12 * X]
    d.rounded_rectangle(b3, 12 * X, outline=mix(OR_C, fonce, 0.25), width=2 * X)
    for cx, cy in ((b2[0] + 30 * X, b2[1] + 30 * X), (b2[2] - 30 * X, b2[1] + 30 * X), (b2[0] + 30 * X, b2[3] - 30 * X), (b2[2] - 30 * X, b2[3] - 30 * X)):
        r = 7 * X; d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=OR_C, outline=BRUN, width=X)
        d.ellipse([cx - r // 2 - X, cy - r // 2 - X, cx, cy], fill=(250, 236, 196))

    # ---------------- texte : lettres ivoire-or en dégradé, contour brun, ombre décalée
    y = (T + pad_y) * X
    for (f, bb), txt, petit in zip(rangs, lignes, petites):
        w, h = bb[2] - bb[0], bb[3] - bb[1]
        x0 = (W * X - w) // 2 - bb[0]; y0 = y - bb[1]
        cal = Image.new('L', big.size, 0); ImageDraw.Draw(cal).text((x0, y0), txt, font=f, fill=255)
        ombre = Image.new('RGBA', big.size, (20, 8, 4, 0)); ombre.putalpha(cal.filter(ImageFilter.GaussianBlur(2 * X)).point(lambda v: v * 0.85))
        big = Image.alpha_composite(big, ImageChops.offset(ombre, 5 * X, 6 * X))
        trait = Image.new('L', big.size, 0); ImageDraw.Draw(trait).text((x0, y0), txt, font=f, fill=255, stroke_width=3 * X, stroke_fill=255)
        big.paste(Image.new('RGBA', big.size, BRUN + (255,)), (0, 0), trait)
        haut, bas = ((236, 206, 140), (176, 128, 56)) if petit else ((252, 242, 214), (226, 190, 118))
        grad = Image.new('RGBA', big.size, (0, 0, 0, 0)); grad.paste(degrade_v(big.width, h, haut, bas).convert('RGBA'), (0, y))
        big.paste(grad, (0, 0), cal)
        if petit:   # filets de part et d'autre
            dd = ImageDraw.Draw(big); ym = y + h // 2
            for s in (-1, 1):
                xa = W * X // 2 + s * (w // 2 + 22 * X); xb = xa + s * 90 * X
                dd.line([(xa, ym), (xb, ym)], fill=BRUN, width=6 * X); dd.line([(xa, ym), (xb, ym)], fill=(214, 172, 96), width=2 * X)
                dd.ellipse([xb - 5 * X, ym - 5 * X, xb + 5 * X, ym + 5 * X], fill=(214, 172, 96), outline=BRUN, width=X)
        y += h + gap * X
    out = big.resize((W, H), Image.LANCZOS).convert('RGB')
    out.save(dst)
    print('affiche :', dst, '| thème', theme, '| enseigne y', T, '→', Bt)


if __name__ == '__main__':
    main(sys.argv[1:])
