# Sıradaki Adım

## Önerilen sıradaki iş

**Gerçek backend auth:** REST veya GraphQL ile giriş; access/refresh token; `DemoAuthService` ve guard mantığının `AuthService` + HTTP interceptor ile değiştirilmesi; hata mesajlarının API yanıtlarına bağlanması.

1. Ortam değişkenleri (`environment`) ile API tabanı.
2. `HttpInterceptor` ile `Authorization` başlığı; 401’de logout / login yönlendirmesi.
3. Admin/kurye panellerinde çıkış (`logout`) ve kullanıcı özeti (isteğe bağlı).
4. `TASKS.md` ve `CHANGELOG.md` güncelle.

## Alternatif

- Admin veya kurye dashboard’da ilk işlevsel ekranlar (auth hazır olduktan sonra).

## Başlamadan önce

- `DESIGN_DECISIONS.md` (giriş + demo auth) ve `core/auth` kaynakları.

## Son güncelleme

- 2026-04-02 — **Tema uyumlu logo:** `/` (navbar + footer), `/auth/login`, `/firma/*`, `/admin/*`, `/courier/*` sidebar — light modda “Has” okunur; `python scripts/build-logo-light.py` ile light PNG yenilenebilir.

- 2026-04-02 — **Panel fluid responsive scale** (`_panel-scale.scss`): viewport’a göre tipografi, ikon, spacing, sidebar ve içerik max; dashboard ve shell’lerde tutarlı büyüme. Doğrulama: tarayıcıda **390, 768, 1024, 1280, 1440, 1600+** px genişliklerinde `/admin/dashboard`, `/firma/dashboard`, `/courier/dashboard` (ve isteğe bağlı tema toggle). Sıradaki: gerçek auth; landing/login light ince ayarı (isteğe bağlı); harita API.

- 2026-04-02 — **Light mode premium paleti** (`_theme-palettes.scss` + `_tokens.scss` semantik token’lar): sıcak nötr kağıt, gradient, katmanlı kart gölgeleri, sidebar gradient + topbar buzlu blur; form/select, KPI/panel card, dashboard rozet/track, Leaflet attribution, theme toggle light gölgesi. Dark mode dokunulmadı.
