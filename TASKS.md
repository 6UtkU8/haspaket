# HasPaket — Görev Listesi

## Dokümantasyon

- [x] `PROJECT_CONTEXT.md`, `DESIGN_DECISIONS.md`, `TASKS.md`, `CHANGELOG.md`, `NEXT_STEP.md` dosyalarını oluştur ve proje bilgileriyle doldur

## Anasayfa

- [x] Teknoloji stack’ini seç ve projeyi başlat (Angular + TypeScript + standalone, routing, SCSS)
- [x] Temel Angular klasör/route iskeleti (`core`, `shared`, `layout`, `features/*`) kuruldu
- [x] Global tema/token başlangıç dosyaları oluşturuldu
- [x] Üst blok: sticky navbar + hero (premium dark, Türkçe metin, mockup kartı)
- [x] Orta ve alt blok: Özellikler, Nasıl Çalışır, İletişim/CTA, footer (anchor uyumlu)
- [x] Logo entegrasyonu (`public/assets/logo/haspaket-logo.png`, marka görseli değiştirilmeden)
- [x] Landing motion polish (logo intro, scroll reveal, reduced-motion)
- [x] Landing premium polish (spacing, tipografi, kart/buton/glow, navbar, responsive token’lar; içerik/route sabit)

## Login

- [x] Login sayfası route’u (`/auth/login`)
- [x] Premium login UI: iki sütunlu düzen (desktop), form, Beni hatırla, şifremi unuttum placeholder, Admin/Kurye segment
- [x] Demo auth: `DemoAuthService`, storage, rol bazlı yönlendirme (`firma` / `admin` / `courier`), guard’lar, validasyon + loading
- [x] Login UI: üçlü rol segmenti (kayar pill), sol marka yalnız logo; `/firma` firma paneli shell + dashboard
- [ ] Gerçek auth API entegrasyonu (JWT/refresh, hata kodları, `DemoAuthService` yerine üretim servisi)

## Firma paneli

- [x] Shell layout (sidebar + header + outlet), responsive mobil menü (960px altı backdrop)
- [x] Dashboard SaaS sürümü: KPI kartları, panel kartları, operasyon hatları, mock grafikler; shell başlık/CTA/kullanıcı
- [x] Sidebar marka: ortalanmış yalnız logo; shell üst çubukta başlık/eyebrow yok (tüm firma rotaları)
- [x] **Yeni Sipariş** drawer (backdrop, form mock, mobil sheet, reduced-motion); buton sidebar’da, scroll kilidi + scrollbar telafisi
- [x] Firma dashboard operasyon haritası önizlemesi (`hp-firma-operation-map`, `@defer`, marker modeli; katmanlı CSS önizleme, admin haritasıyla görsel hizalı)
- [x] Menü alt route’ları (`siparisler`, `kuryeler`, `raporlar`, `ayarlar`) — şimdilik “yakında” sayfası
- [ ] Sipariş / kurye / rapor ekranları ve API ile canlı veri; drawer **Kaydet** → gerçek API

## Admin paneli

- [x] Shell + `ADMIN_ROUTES` (dashboard, firmalar, kuryeler, siparisler, basvurular, raporlar, ayarlar)
- [x] Yönetim dashboard v1 (KPI, aktivite tablosu, operasyon 4 statü, başvuru/sistem kartları; mock)
- [ ] Admin modül ekranları (firma/kurye/sipariş listeleri) ve API

## Kurye paneli

- [x] Shell (sidebar + header + çıkış), route’lar (`/courier/dashboard`, görevler, ayarlar)
- [ ] Kurye panel gerçek görev/teslimat ekranları ve harita

## Genel

- [x] Landing: responsive kırılımlar ve `prefers-reduced-motion` ile uyum (polish turunda gözden geçirildi)
- [x] Ortak responsive layout sistemi (`--hp-pad-x`, `--hp-content-max`, `--hp-auth-shell-max`, `_layout.scss`); login + landing hizalı
- [x] Panel **fluid scale** (`_panel-scale.scss`, `--hp-panel-*`): shell, KPI, kart, form, tablo, harita, drawer; firma/admin/kurye dashboard ve ortak bileşenler
- [x] Panel ortak UI: `_panel-forms`, `hp-select` (CDK overlay), firma/admin/kurye shell ve kart dili hizası (`DESIGN_DECISIONS` güncel)
- [x] Shell üst başlık sadeleştirme (admin/kurye); dashboard kart lead’leri; Leaflet harita (`hp-leaflet-map`) + dokümantasyon
- [x] Panel **light/dark** tema: `ThemeService`, `data-theme`, `_theme-palettes.scss`, `hp-theme-toggle` (firma/admin/kurye üst bar), `localStorage` kalıcılığı; Leaflet karo katmanı tema ile senkron
- [x] Logo: dark/light PNG + `hp-brand-logo` (landing, login, shell sidebar)
- [x] **Light mode premium paleti:** sıcak nötr zemin, katmanlı gölge, shell/sidebar/topbar token’ları, form/select/dashboard/leaflet uyumu (`DESIGN_DECISIONS` / `CHANGELOG`)
- [x] Yakında sayfaları ve landing hero mock’unda istenen üst metin / “Operasyon özeti” temizliği
- [ ] Diğer sayfalar için responsive ve erişilebilirlik kontrolleri (yeni ekranlarda `.hp-container` / token kullanımı)
