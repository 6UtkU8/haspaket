# Logo varlıkları

## Dosyalar

| Dosya | Kullanım |
|--------|----------|
| `haspaket-logo.png` | Kaynak asset; `scripts/build-logo-light.py` bu dosyadan türetir. |
| `haspaket-logo-dark.png` | **Koyu tema** — orijinal wordmark (“Has” açık gri/turuncu Paket). `haspaket-logo.png` ile aynı içerik. |
| `haspaket-logo-light.png` | **Açık tema** — “Has” koyu gri; ikon ve “Paket” turuncusu korunur. Script ile üretilir. |

Uygulama `ThemeService` + `hp-brand-logo` ile `dark` → `haspaket-logo-dark.png`, `light` → `haspaket-logo-light.png` seçer.

## Light varyantı yeniden üretme

```bash
python scripts/build-logo-light.py
```

(Pillow gerekir: `pip install Pillow`.)

## Marka

Tasarım veya yazım değiştirilmez; yalnızca açık zeminde okunabilirlik için “Has” rengi light PNG’de koyulaştırılır.
