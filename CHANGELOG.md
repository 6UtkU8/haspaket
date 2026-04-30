# Changelog

Tüm önemli proje değişiklikleri burada tarih sırasıyla tutulur (Keep a Changelog tarzı, sade).

## [Unreleased]

### Added

- **Tema uyumlu logo:** `haspaket-logo-dark.png` / `haspaket-logo-light.png` (`haspaket-logo.png` kaynak + `scripts/build-logo-light.py`); `core/brand/brand-assets.ts`; **`hp-brand-logo`** — `ThemeService` ile anında varyant. Kullanım: landing navbar/footer, login, firma/admin/kurye sidebar.

- **Panel fluid responsive scale:** `src/styles/_panel-scale.scss` — ortak `--hp-panel-*` token’ları (`clamp()` + içerik genişliği için `@media` kademeleri); shell (sidebar genişliği, logo, nav yazı/ikon, header, menü, kullanıcı, CTA), sayfa gap/padding, KPI, `hp-panel-card`, formlar, tablo/badge, harita bloğu, drawer, çıkış. `styles.scss` import sırası: `tokens` → `panel-scale` → `theme-palettes`. Firma/admin/kurye shell ve dashboard + ortak bileşen stilleri bu token’lara bağlandı; kurye dashboard sayfa/rozet metni güncellendi. Renk / light-dark / **#FF6B00** değişmedi.

- **Light mode premium paleti:** `src/styles/_theme-palettes.scss` — sıcak nötr zemin, gradient gövde, katmanlı kart gölgeleri, **#FF6B00** ile uyumlu yumuşak primary soft; `--hp-shell-sidebar-bg` (gradient), `--hp-shell-header-bg` (buzlu); semantik token’lar: `--hp-color-input-bg`, `--hp-color-select-trigger-bg`, `--hp-color-option-hover-bg`, `--hp-badge-*`, `--hp-color-muted-track`, `--hp-color-subtle-row`, `--hp-backdrop`, `--hp-shadow-sidebar*`, `--hp-color-nav-hover-bg`, `--hp-color-text-secondary`, `--hp-color-divider`, `--hp-glow-kpi-icon`. `src/styles/_tokens.scss` (dark varsayılanları) ile eşleşen genişletme.
- **Panel tema (light / dark):** `ThemeService` (`core/theme/theme.service.ts`) — `data-theme` + **`theme-dark` / `theme-light`** sınıfları (`html` ve `body`), `localStorage` anahtarı `haspaket_theme_v1`, `main.ts` ile ilk boyama öncesi okuma; `App` içinde `ThemeService` inject (açılışta senkron). **`hp-theme-toggle`** (`shared/ui`, `:host` ile düzen) — üst çubukta güneş (açık) / ay (koyu) ikonu; **firma / admin / kurye** shell header’larında. Token override: `src/styles/_theme-palettes.scss` (`html.theme-light` + `html[data-theme='light']`), `--hp-body-gradient` ve yüzey/metin renkleri. `body` ve `hp-panel-card` için hafif arka plan geçişi; `prefers-reduced-motion` ile sınırlı veya kapalı.
- **Harita + tema:** `hp-leaflet-map` — CARTO `light_all` / `dark_all` katman değişimi `ThemeService` ile senkron.

### Changed

- **Light mode polish:** Shell’ler `--hp-shell-sidebar-bg` / `--hp-backdrop` / gölge token’ları; formlar ve `hp-select` `--hp-color-input-bg` / hover; `hp-panel-card` hover `var(--hp-shadow-card-hover)`; dashboard rozet/skeleton/track satırları token’a bağlandı; `_leaflet-panel.scss` light attribution + nokta sınırı; `_layout.scss` light topbar `backdrop-filter`; `hp-theme-toggle` light’ta hafif gölge (`:host-context`).

- **Landing hero mock kartı:** Üst başlık satırı (mock title + header bandı) kaldırıldı; yalnızca sağ üstte **“Canlı”** rozeti (`hp-hero__mock-badge--float`); içerik doğrudan istatistik/mock satırlarla başlar.
- **Yakında sayfaları (firma / admin / kurye):** Üst lead paragrafları kaldırıldı; tek `hp-panel-card` odaklı içerik; admin/kurye için `hp-shell-stagger` ile firma ile aynı giriş animasyonu.
- **Panel üst alan:** Admin ve kurye shell’de **HasPaket · Merkez**, sayfa başlığı ve alt başlık (`pageTitle` / route `data`) kaldırıldı; üst çubuk firma ile aynı mantıkta — menü, `header-spacer`, kullanıcı (+ admin’de **Yeni Firma**). `admin.routes.ts` / `courier.routes.ts` içindeki `adminPageTitle` / `courierPageSubtitle` verileri silindi. Ana içerik üst padding’i firma/admin/kurye’de hizalı sıkılaştırıldı.
- **Dashboard kartları:** Harita kartında uzun başlık yerine `hp-panel-card` **`toolbar`** + rozet; firma/admin’de operasyon/grafik kartlarındaki açıklama lead paragrafları kaldırıldı veya kısaltıldı (ör. **Durum**, **Başvurular**, **Sistem**). **Kurye dashboard:** “Görev özeti” kart başlığı ve uzun açıklama kaldırıldı; tek satır placeholder + `toolbar` + `Önizleme` rozeti.
- **Harita (Leaflet):** `leaflet` paketi; `hp-leaflet-map` (`shared/ui`) — CARTO `dark_all` karo, `circleMarker` + tooltip, `fitBounds`, legend; `PanelMapMarker` (`lat`/`lng`/`kind`). `hp-firma-operation-map` ve `hp-admin-live-map` ince sarmalayıcı. Global stiller `_leaflet-panel.scss`; `leaflet.css` + `allowedCommonJsDependencies: leaflet` (`angular.json`). Eski CSS-only harita katmanları kaldırıldı.
- **Panel tasarım sistemi:** `src/styles/_panel-forms.scss` — ortak `.hp-field`, `.hp-input`, `.hp-textarea`; `_tokens.scss` içinde `--hp-shadow-dropdown`, `--hp-radius-dropdown`. `hp-select` (`shared/ui`) — koyu tema ile uyumlu özel açılır liste, Angular CDK `ConnectedOverlay` + `reposition` scroll stratejisi; `angular.json` styles’a `overlay-prebuilt.css` eklendi. `@angular/cdk` bağımlılığı. Firma **Yeni Sipariş** drawer: metin alanları ortak sınıflara taşındı; üç alan `hp-select` ile değiştirildi (üstteki çift/uppercase etiket + placeholder sadeleştirildi). Admin/kurye shell: firma ile hizalı ortalanmış logo, `100dvh` sidebar + kaydırılabilir `nav`, admin eyebrow’da hafif turuncu ton; kurye içerik padding’i mobilde sıkılaştırıldı. Admin dashboard “Canlı” rozeti firma ile aynı yeşil ton. `_layout.scss`: `.hp-shell-inner` yardımcısı.
- **Firma shell:** **Yeni Sipariş** üst çubuktan kaldırıldı; sidebar’da menü listesinin altında, **Çıkış Yap**’ın üstünde (`hp-firma__sidebar-cta`); kesikli kenarlık + soluk dolgu (`hp-firma__cta--sidebar`). Drawer: scrollbar kaynaklı yatay sıçramayı azaltmak için kilit sırasında `body` `padding-right` telafisi; backdrop’tan `backdrop-filter` kaldırıldı; drawer katmanında gereksiz blur yok. `html` için `scrollbar-gutter: stable` (`_base.scss`). Üst çubukta yalnız kullanıcı alanı.
- **Harita kartları (`hp-firma-operation-map`, `hp-admin-live-map`):** Katmanlı arka plan (radial wash, blok kontrastı, hafif “yol” tekrarı maskeli, ince grid), iç gölge ve sınır; pinler hafifçe küçültüldü ve gölgelendi; mock konumlar daha yayılmış; alt açıklama kısaltıldı; taşmayı önlemek için `max-width: 100%` / `min-width: 0`.
- **Firma üst çubuk:** **Yeni Sipariş** kullanıcı bloğunun solunda; düşük doygunluklu turuncu arka plan + ince border (agresif gradient CTA kaldırıldı); hover çok hafif.
- **Firma + admin sidebar:** `100dvh` sabit yükseklik, içerik `overflow: hidden`, menü alanı kaydırılabilir, **Çıkış Yap** `margin-top: auto` ile alt kenarda; `safe-area-inset-bottom` desteği.
- **Firma paneli:** Sidebar’da yalnız ortalanmış logo (wordmark kaldırıldı). Üst çubukta eyebrow / sayfa başlığı / alt açıklama yok — tüm firma sayfalarında yalnız menü + kullanıcı + **Yeni Sipariş**. **Yeni Sipariş** shell’de sağ drawer (dar ekranda alttan sheet): backdrop, form, `prefers-reduced-motion`, `Escape`.
- **Firma “yakında” sayfaları:** `hp-shell-page` + `hp-shell-stagger` (dashboard ile aynı `_panel-shell-animations` girişi) ve `hp-panel-card`; `--hp-content-max` ile genişlik hizası.
- **Firma dashboard:** KPI altında **Canlı operasyon haritası** — `hp-firma-operation-map` (CSS/mock pinler, `FirmaMapMarker`, `@defer on idle`), admin haritasıyla aynı hafif yaklaşım.
- **`hp-panel-card`:** Hover’da çok hafif `translateY(-1px)` (reduced-motion’da yok).
- **Panel shell (firma / admin / kurye):** Sidebar’da rozet metinleri kaldırıldı, logo büyütüldü; alt kısımda **Çıkış Yap** (`DemoAuthService.logout()` → `/auth/login`); hafif sayfa girişi (`hp-shell-page`, `hp-shell-stagger`) ve `prefers-reduced-motion` desteği (`_panel-shell-animations.scss`); KPI hover’da hafif `translateY` yalnızca hareket tercihinde.
- **Kurye:** `CourierShellComponent` + güncel `COURIER_ROUTES` (dashboard, görevler, ayarlar), sayfa bileşenleri `pages/` altında.
- **Admin dashboard:** `hp-admin-live-map` (CSS/mock pinler, `OnPush`, `AdminMapMarker` tipi); `@defer (on idle)` ile harita parçası ayrı chunk; KPI altında “Canlı operasyon haritası” kartı.
- **Admin panel:** `AdminShellComponent` (7 maddelik menü, mobil sidebar), `admin.routes.ts` (dashboard + yakında sayfaları), `AdminDashboardPageComponent` — platform KPI’ları, son aktiviteler tablosu, dört statülü operasyon özeti (Sorunlu vurgusu), başvuru ve sistem özet kartları; `shared/ui` içinde `hp-panel-card` ve `hp-kpi-card` firma dashboard ile paylaşılır; eski kök `admin-dashboard-page` kaldırıldı.
- **Firma dashboard:** SaaS/lojistik tarzı yeniden düzenlendi — `FirmaKpiCardComponent`, `FirmaPanelCardComponent`; shell üst bar’da route `data` ile başlık/açıklama, mock kullanıcı + **Yeni Sipariş**; KPI grid, son siparişler + operasyon durumu (Yolda / Teslim edildi / Planlandı), alt kısımda mock sütun grafik ve kurye performans çubukları (harici chart kütüphanesi yok).
- **Responsive layout:** global `--hp-pad-x`, `--hp-auth-shell-max`, `--hp-content-max` breakpoint’leri (1280px / 1536px); `src/styles/_layout.scss` (`.hp-container`, `.hp-container--auth`, `.hp-container--narrow`, `.hp-page`). Landing yatay padding artık `var(--hp-pad-x)` (host’taki `--hp-landing-pad-x` kaldırıldı).
- `/auth/login`: kabuk genişliği ve iki sütun grid gap’leri büyük ekranda artırıldı; kart ve logo ölçekleri viewport’a göre kademeli; tablet (768–959px) tek sütunda daha ferah kart.
- `/auth/login`: rol seçimi **Firma / Admin / Kurye**; kayar turuncu pill animasyonu; sol alanda yalnız büyütülmüş logo (tagline kaldırıldı). Demo auth ve guard’lar `firma` rolü ve `/firma` route’u ile genişletildi.

### Added

- **Shared dashboard UI:** `src/app/shared/ui/hp-panel-card.component`, `hp-kpi-card.component` (ikon seti: package, check, user, money, building, users).
- **Firma paneli:** `features/firma/firma.routes.ts` — `FirmaShellComponent` (sidebar: Dashboard, Siparişler, Kuryeler, Raporlar, Ayarlar; üst bar; mobil backdrop), `FirmaDashboardPageComponent` (özet kartları, son siparişler tablosu, operasyon özeti, alt bilgi kartları; mock veri), `FirmaComingSoonPageComponent` (diğer menüler). Varsayılan rota `/firma` → `/firma/dashboard`.
- Demo kimlik doğrulama: `core/auth` — `DemoAuthService` (storage: `haspaket_demo_auth_v1`), `demoAdminGuard` / `demoCourierGuard` / `demoLoginPageGuard`, rol ile `/admin` veya `/courier` yönlendirme; giriş formu validasyonu, yükleme durumu, genel hata alanı.
- `/auth/login`: premium dark giriş ekranı — marka sütunu + cam/blur login kartı, e-posta/şifre, “Beni hatırla”, Admin/Kurye segmented control, landing ile uyumlu turuncu primary.
- Tasarım token’ları: `--hp-space-section-tight`, `--hp-shadow-card-hover`, `--hp-btn-radius` (landing buton/nav uyumu).
- “Nasıl çalışır” bölümü üst kenarında gradient çizgi ayırıcı (`::before`); özellikler bandında daha hafif arka plan wash.
- Proje bağlamı ve süreç dosyaları: `PROJECT_CONTEXT.md`, `DESIGN_DECISIONS.md`, `TASKS.md`, `NEXT_STEP.md`, `CHANGELOG.md`.
- Frontend teknoloji kararı: Angular + TypeScript + standalone mimari.
- Angular standalone + routing + SCSS proje iskeleti ve temel klasör mimarisi kuruldu.
- Public anasayfa üst blok: sticky navbar, hero, örnek operasyon kartı; `public/assets/logo/haspaket-logo.png` ile marka alanı.
- Public anasayfa orta ve alt blok: özellikler (4 kart), nasıl çalışır (3 adım), iletişim/CTA, footer.
- Landing premium motion: logo giriş animasyonu (oturumda bir kez), navbar/hero stagger, bölüm scroll reveal, `prefers-reduced-motion` desteği.
- Landing: güncel logo için token tabanlı navbar/footer ölçekleri; CTA (#iletisim) üstünde `İletişim` eyebrow etiketi.
- Landing hero: tam genişlik sarmalayıcı + `hp-hero__inner`; odak/border artefaktı kaldırıldı.
- Logo: özel SVG kaldırıldı; seçilmiş marka `haspaket-logo.png` (navbar + footer), token tabanlı boyut/hizalama.

### Changed

- Landing (`public-page.component.scss` + `_tokens.scss`): premium polish — section spacing, başlık/lead ölçekleri, hero/CTA glow ve gölgeler yumuşatıldı; feature/how kartları border/gölge/hover dengesi; primary/ghost butonlar gradient + inset highlight ve rafine hover/active; navbar menü boşluğu ve scrolled görünümü; footer hafif rafinasyon. İçerik ve route yapısı aynı kaldı.
- Router: fragment/anchor kaydırması için `withInMemoryScrolling` etkinleştirildi.
- `angular.json`: `anyComponentStyle` bütçe sınırları landing bileşen stilleri için güncellendi.

---

## Notlar

- İlk uygulama kodu veya stack seçimi sonrası buraya sürüm veya tarihli başlık eklenebilir (ör. `## 2026-04-01` veya `## [0.1.0]`).
