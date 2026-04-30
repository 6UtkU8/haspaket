"""
HasPaket wordmark: 'Has' açık gri → light arka plan için koyu griye çevrilir.
'Paket' turuncusu ve kutu ikonu korunur. Çıktı: haspaket-logo-light.png
"""
from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public" / "assets" / "logo" / "haspaket-logo.png"
OUT_DARK = ROOT / "public" / "assets" / "logo" / "haspaket-logo-dark.png"
OUT_LIGHT = ROOT / "public" / "assets" / "logo" / "haspaket-logo-light.png"

# Wordmark bandı (ikon üstte); bu satırlarda 'Has' metni işlenir
Y_MIN_RATIO = 0.74

# Hedef: açık zeminde okunur nötr koyu (marka turuncusu değişmez)
DARK_TEXT = (32, 32, 36)


def is_orange_spectrum(r: int, g: int, b: int) -> bool:
    """Paket / ikon turuncusu — dokunma."""
    if b > 145:
        return False
    if r < 175:
        return False
    if g < 55:
        return False
    if r > g > b * 0.9:
        return True
    return r > 215 and g > 95 and b < 125


def should_darken_has(r: int, g: int, b: int, a: int, y: int, h: int) -> bool:
    if a < 28:
        return False
    if y < int(h * Y_MIN_RATIO):
        return False
    if is_orange_spectrum(r, g, b):
        return False
    mx, mn = max(r, g, b), min(r, g, b)
    if mx - mn > 52:
        return False
    if mx < 95:
        return False
    return True


def main() -> None:
    if not SRC.is_file():
        raise SystemExit(f"Kaynak bulunamadı: {SRC}")
    shutil.copyfile(SRC, OUT_DARK)
    im = Image.open(SRC).convert("RGBA")
    w, h = im.size
    px = im.load()
    for yy in range(h):
        for xx in range(w):
            r, g, b, a = px[xx, yy]
            if not should_darken_has(r, g, b, a, yy, h):
                continue
            # Kenar yumuşatması: çok saydam piksellerde karıştır
            t = a / 255.0
            nr = int(DARK_TEXT[0] * t + r * (1 - t))
            ng = int(DARK_TEXT[1] * t + g * (1 - t))
            nb = int(DARK_TEXT[2] * t + b * (1 - t))
            na = max(a, 200) if t > 0.15 else a
            px[xx, yy] = (nr, ng, nb, na)
    im.save(OUT_LIGHT, optimize=True)
    print(f"OK: {OUT_DARK.name} (kopya), {OUT_LIGHT.name} (Has koyulaştırıldı)")


if __name__ == "__main__":
    main()
