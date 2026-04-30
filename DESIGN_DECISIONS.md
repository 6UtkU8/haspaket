# HasPaket — Tasarım ve Mimari Kararlar



Bu dosya, bilinçli seçimleri kayıt altına alır. Yeni UI veya mimari eklerken önce burayı kontrol et; çelişen kararlar için önce burayı güncelle.



## Görsel kimlik



- **Ana renk:** `#FF6B00` — birincil butonlar, vurgular, önemli metin aksanları.

- **Tema:** Varsayılan **koyu (dark)** zemin; **açık (light)** mod panelde seçilebilir. Kökte hem **`data-theme="dark" | "light"`** hem de **`html` + `body` üzerinde `theme-dark` / `theme-light`** sınıfları (`ThemeService.applyDom`); token’lar `_tokens.scss` + `src/styles/_theme-palettes.scss` (`html.theme-light` ve `html[data-theme='light']` ile aynı override seti); `ThemeService` + `localStorage` anahtarı `haspaket_theme_v1`; ilk boyama öncesi `main.ts` ile depodan okuma; `App` kök bileşeninde `ThemeService` inject ile servis önceliği. Panel üst çubukta ortak **`hp-theme-toggle`** (`:host` ile görünür kutu; açık modda güneş, koyu modda ay ikonu).

- **Light mode (premium palet, 2026-04-02):** Saf beyaz + siyah değil; **sıcak nötr kağıt** (`#f1f0ed` civarı), **gradient gövde**, kartlar **beyaza yakın yüzey** + **katmanlı gölge** (`--hp-shadow-card` / `--hp-shadow-card-hover`). **Sidebar** dikey **gradient** (`--hp-shell-sidebar-bg`), **topbar** buzlu cam (`backdrop-filter` light’ta `_layout.scss`), turuncu **#FF6B00** kontrollü (`--hp-color-primary-soft` / muted). Semantik yardımcılar: `--hp-color-input-bg`, `--hp-shell-header-bg`, `--hp-backdrop`, `--hp-shadow-sidebar`, `--hp-badge-success-*`, `--hp-color-muted-track`, `--hp-color-nav-hover-bg` vb. (dark’ta `:root` ile tanımlı, light’ta override). Form/select **açık yüzey**; **Leaflet** attribution light’ta açık kart; dashboard **rozet/skeleton** token tabanlı.

- **Efektler:** Yumuşak glow (abartısız); kart ve önemli bölgelerde derinlik. Global token’larda glow ve gölge yoğunlukları düşük tutulur; göz yormayan SaaS hissi hedeflenir.

- **Kartlar:** Modern, net hiyerarşi; tutarlı padding ve köşe yarıçapı; hover’da hafif yükselme ve yumuşak gölge (agresif turuncu glow yerine ince highlight çizgisi).

- **Tipografi ve spacing:** Startup/modern çizgi; section başlığı / lead / gövde için net ölçek; dikey ritim `--hp-space-section` ve `--hp-space-section-tight` ile kontrol edilir.



## Logo



- Resmi **HasPaket** logosu (projede seçilmiş asset) kullanılacak; metin-only veya rastgele ikon yerine bu logo öncelikli.

- **Tema uyumlu iki PNG:** Açık zeminde “Has” kelimesi okunması için iki dosya kullanılır — **`haspaket-logo-dark.png`** (koyu arka plan / mevcut görünüm: “Has” açık ton) ve **`haspaket-logo-light.png`** (açık arka plan: “Has” koyu gri; ikon ve “Paket” turuncusu aynı). Kaynak: `haspaket-logo.png`; light varyantı `scripts/build-logo-light.py` (Pillow) ile üretilir — marka formu değişmez, yalnızca wordmark kontrastı.

- **Uygulama:** `core/brand/brand-assets.ts` yolları; **`hp-brand-logo`** (`shared/ui`) `ThemeService.mode()` ile `src` seçer — tema değişince (toggle, `localStorage` senkronu) **yenileme gerekmez**.

- Logo ölçüleri: navbar/footer yükseklikleri bileşen SCSS + `--hp-logo-nav-max-width` / `--hp-logo-footer-*` (`_tokens.scss`); `object-fit: contain`; **ekstra kapsayıcı kutu (cam çerçeve) kullanılmaz** — logo doğrudan navbar/footer akışında.

- İletişim CTA kartında üst etiket: `hp-section__eyebrow` ile diğer bölüm başlıklarıyla aynı tipografi (uppercase, turuncu, letter-spacing).



## Anasayfa (landing) — ilk üst blok



- **Sticky navbar:** scroll ile arka plan opaklığı ve gölge artar; blur ile hafif cam hissi; scrolled gölge ve border yumuşatılmıştır.

- **Hero:** iki sütunlu grid (geniş ekranda); mobilde tek sütun, mockup kartı metnin altında. Hero glow radials daha düşük opaklıkta; mock kartında ağır ambient glow yerine kontrollü gölge + ince ışık halkası.

- **CTA:** birincil aksiyon turuncu (gradient + inset highlight), ikincil hayalet (ghost) buton; metinler Türkçe ve operasyon odaklı.

- **Navigasyon:** menü öğeleri için bölüm anchor’ları (`#ozellikler`, `#nasil-calisir`, `#iletisim`) ile uyumlu bölümler ve footer bağlantıları.

- **Orta ve alt blok:** dört özellik kartı, üç adımlı “Nasıl çalışır” akışı, iletişim/CTA bandı, ardından footer. Bölümler arası geçiş: özellikler bandında çok hafif turuncu wash; “Nasıl çalışır” üstünde tam genişlikte ince gradient çizgi (düz border yerine).

- **Üretim bütçesi:** landing bileşen stilleri için `anyComponentStyle` üst sınırı güncellendi (bkz. `angular.json`).



## Giriş ekranı (`/auth/login`)

- **Layout:** Geniş ekranda iki sütun — sol yalnızca büyük logo (hafif arka glow), sağda cam/blur login kartı; dar ekranda tek sütun (üstte marka, altta kart). Kabuk `hp-container hp-container--auth` + `--hp-auth-shell-max`; kart `max-width` ekran genişliğine göre kademelenir (tablet / desktop / wide).
- **Form:** E-posta, şifre, “Beni hatırla”, “Şifremi unuttum” (placeholder), birincil “Giriş Yap”; alan validasyonu (boş / e-posta formatı); yükleme durumunda buton devre dışı ve metin geri bildirimi.
- **Rol seçimi:** `Firma` / `Admin` / `Kurye` — üç hücreli segment; aktif sekme arkasında turuncu **pill** `transform: translateX(index * 100%)` ile kayar (~280ms, `--hp-ease-out`). `prefers-reduced-motion` ve bileşen `reduce-motion` sınıfında geçiş kapalı.
- **Demo auth (geçici):** `DemoAuthService` — `role`: `firma` | `admin` | `courier`; yönlendirme `/firma`, `/admin`, `/courier`. Storage anahtarı `haspaket_demo_auth_v1`; şifre saklanmaz.
- **Koruma:** `demoFirmaGuard`, `demoAdminGuard`, `demoCourierGuard` + `demoLoginPageGuard`; yanlış rolde ilgili panele veya login’e yönlendirme. `returnUrl` güvenli iç path’lerle.
- **Stil:** Global token’lar; segment `--hp-auth-segment-slide` ile süre/easing.
- **Logo:** `hp-brand-logo` — tema göre `haspaket-logo-dark.png` / `haspaket-logo-light.png` (landing ile aynı mantık).

## Firma paneli (`/firma`)

- **Routing:** `loadChildren` → `FIRMA_ROUTES`; kök `/firma` boş path ile `dashboard`’a yönlendirilir. Shell: `FirmaShellComponent` (sol sidebar + üst bar + `router-outlet`). Alt sayfalar lazy: `dashboard`, `siparisler`, `kuryeler`, `raporlar`, `ayarlar`.
- **Sidebar marka:** Üst blokta yalnızca ortalanmış logo (ek metin yok); logo yüksekliği **`--hp-panel-logo-h`** (`src/styles/_panel-scale.scss`, `clamp()` ile viewport’a göre); `object-position: center`; mobilde sidebar davranışı aynı (off-canvas). Sidebar genişliği **`--hp-panel-sidebar-w`**. Sidebar `height: 100dvh`, iç flex sütun: logo → `nav` (`flex: 1 1 0`, kaydırılabilir) → **Yeni Sipariş** (tam genişlik, kesikli çerçeve / düşük doygunluklu dolgu, `hp-firma__cta--sidebar`) → **Çıkış Yap** (`margin-top: auto`, en alt); `env(safe-area-inset-bottom)` ile alt dolgu.
- **Üst bar:** Sayfa başlığı / eyebrow / alt açıklama yok — menü (mobil), esnek boşluk, sağda yalnızca kullanıcı özeti; **Yeni Sipariş** üst çubukta değil, sidebar’da.
- **Yeni Sipariş:** Ayrı sayfaya gitmez; shell içinde **sağ drawer** (≤599px’te alttan sheet). Açılışta `html` + `body` overflow kilidi; kaydırma çubuğu genişliği `body` üzerinde `padding-right` ile telafi edilir (layout shift azaltma); global `html { scrollbar-gutter: stable }` (`_base.scss`). Backdrop: opaklık animasyonu, **backdrop-filter yok** (performans). `Escape` / backdrop ile kapanır; `prefers-reduced-motion` ile animasyon kapalı. Mobil drawer öncesi mobil sidebar kapanır. Form mock; **Kaydet** ileride API.
- **Dashboard (`/firma/dashboard`):** Dört **KPI**; harita kartı (`hp-firma-operation-map` → **`hp-leaflet-map`**, Leaflet + CARTO koyu katman, `PanelMapMarker` lat/lng, `@defer (on idle)`); orta bölüm iki sütun: **Son siparişler**, **Durum**; alt bölümde mock **sütun grafik** ve **kurye performans**. `hp-panel-card` + `toolbar` ile harita üst şeridi (uzun kart başlığı yok).
- **Diğer menüler:** `FirmaComingSoonPageComponent` — `hp-shell-page` + `hp-shell-stagger`; `hp-panel-card` ile kısa ipucu + Dashboard linki; üst eyebrow / uzun lead yok (admin/kurye yakında sayfaları aynı mantık).
- **Responsive:** Sidebar masaüstünde sabit; &lt;960px’te off-canvas, hamburger + backdrop, navigasyon sonrası kapanır; KPI ve grafik grid’leri mobilde tek sütun.
- **Stil:** Global `--hp-color-*` (#FF6B00 aksan), yumuşak border/shadow/glow; landing/login ile uyumlu; önekler `hp-firma*`, `hp-fdash*`.

## Admin paneli (`/admin`)

- **Routing:** `loadChildren` → `ADMIN_ROUTES`; kök `/admin` → `dashboard`. Shell: `AdminShellComponent` (`hp-admin*`), menü: Dashboard, Firmalar, Kuryeler, Siparişler, Başvurular, Raporlar, Ayarlar. Sidebar düzeni firma ile aynı mantık: `100dvh` flex sütun, kaydırılabilir `nav`, **Çıkış Yap** altta (`margin-top: auto`), `safe-area` alt dolgu.
- **Üst bar:** Eyebrow / sayfa başlığı / route `data` ile alt başlık **yok** — firma ile aynı sade üst çubuk: mobil menü, esnek boşluk, sağda kullanıcı + **Yeni Firma** (ileride kayıt/davet akışı).
- **Dashboard (`/admin/dashboard`):** `hp-kpi-card`, `hp-panel-card`; KPI; harita (`hp-admin-live-map` → `hp-leaflet-map`); **Son aktiviteler**; **Durum** (operasyon hatları); **Başvurular** ve **Sistem** kartları. Mock veri; gereksiz kart lead paragrafları kaldırıldı.
- **Diğer sayfalar:** `AdminComingSoonPageComponent` — shell’de başlık yok; `hp-panel-card` + kısa ipucu (üst lead yok).
- **Ayrışma (firma vs admin):** Üst çubukta metin bloğu yok; menü genişliği ve merkezi içerik farkı sidebar + CTA ile kalır.

## Hareket (motion) — landing polish



- **Logo girişi:** `hp-logo-enter` — opacity, hafif blur ve scale; oturum başına bir kez (`sessionStorage` anahtarı `haspaket_lp_intro_v1`, animasyon bitince yazılır).

- **Navbar + hero:** aynı yüklemede yumuşak fade/stagger; `prefers-reduced-motion` veya `introSkip` ile animasyonlar devre dışı.

- **Scroll reveal:** özellikler, nasıl çalışır, CTA ve footer için `IntersectionObserver` + `.hp-reveal--visible` (hafif fade + `translateY`).

- **Erişilebilirlik:** `prefers-reduced-motion: reduce` için CSS yedeği; bileşende `reduceMotion` ile reveal’lar anında görünür; buton `:active` translate bu modda kapatılır.

- **Performans:** Logo girişinde kısa süreli `filter: blur`; ağır sürekli animasyon yok.



## Panel shell (firma / admin / kurye — ortak)

- **Çıkış:** Sidebar altında `hp-shell-logout` — `DemoAuthService.logout()` + `Router` ile `/auth/login`. Storage `haspaket_demo_auth_v1` temizlenir.
- **Marka alanı (firma / admin / kurye):** Yan menü üstünde yalnızca ortalanmış logo; logo boyutu **`--hp-panel-logo-h`** (ortak panel ölçek sistemi).
- **Üst çubuk (2026-04-02):** **Firma, admin ve kurye** — eyebrow / sayfa başlığı / alt başlık **yok**; mobil menü (varsa), `header-spacer`, sağda **tema toggle** (`hp-theme-toggle`), kullanıcı (+ admin’de **Yeni Firma**). Route `data` ile shell başlığı taşınmaz.
- **Animasyon:** `_panel-shell-animations.scss` — `.hp-shell-page` (fade + hafif `translateY`), `.hp-shell-stagger` (KPI grid çocukları için gecikme); `prefers-reduced-motion: reduce` ile animasyon kapalı; mobil sidebar `transition: none` aynı medya sorgusunda.
- **Kurye:** `CourierShellComponent` + `COURIER_ROUTES` (dashboard, görevler, ayarlar); firma/admin ile aynı shell deseni.
- **Sidebar hizası (2026-04-02 UI turu):** Admin ve kurye yan menüleri firma ile aynı mantıkta — `100dvh`, iç `nav` alanı `flex: 1 1 0` + `min-height: 0` + kaydırma, üstte **ortalanmış logo** (`object-position: center`), alt boşluk ve border ritmi firma ile uyumlu; ana içerik üst padding’i üç panelde hizalı (mobilde biraz sıkı).

## Panel UI — ortak form ve select (2026-04-02)

- **Global form sınıfları:** `src/styles/_panel-forms.scss` — `.hp-field`, `.hp-field__label` (tek satır, sentence case; agresif uppercase etiket kaldırıldı), `.hp-input`, `.hp-textarea`; token ile uyumlu border/focus.
- **Select / dropdown:** Native `<select>` yerine **`hp-select`** (`shared/ui/hp-select.component`) — koyu yüzey, yumuşak border/gölge (`--hp-shadow-dropdown`, `--hp-radius-dropdown`), hover ve seçili satırda turuncu aksan (`#FF6B00`), ince scrollbar. Liste, taşma ve drawer içi konum için **Angular CDK `ConnectedOverlay`** ile tetikleyiciye bağlanır (liste üst katmanda, `overlay-prebuilt.css` `angular.json` styles’ta).
- **Kart / KPI:** `hp-panel-card`, `hp-kpi-card` paneller arasında ortak; **`toolbar`** girişi — başlık olmadan üst şeritte yalnız `[panel-actions]` (ör. harita kartı).
- **Layout yardımcısı:** `_layout.scss` içinde `.hp-shell-inner` — isteğe bağlı max genişlik + dikey gap (dashboard ile aynı ritim).

## Panel harita — Leaflet (2026-04-02)

- **`hp-leaflet-map` (`shared/ui`):** **Leaflet** + **CARTO** karo katmanı — tema ile uyum: koyu modda `dark_all`, açık modda `light_all`; `ThemeService` değişiminde katman yenilenir; marker renkleri temaya göre ayarlanır. `PanelMapMarker` (`id`, `kind`: kurye / sipariş / teslim, `lat`, `lng`, `label`); `circleMarker` + tooltip; `fitBounds` ile çerçeve. Stiller: `src/styles/_leaflet-panel.scss`, `leaflet.css` `angular.json` styles’ta. İstemci yalnız tarayıcıda (`isPlatformBrowser`); `@defer (on idle)` ile dashboard’da ağır parça gecikmeli yüklenir.
- **`hp-firma-operation-map` / `hp-admin-live-map`:** İnce sarmalayıcılar — mock `PanelMapMarker[]` (İstanbul çevresi örnek koordinatlar); harita mantığı tek yerde.

## Admin canlı harita (legacy not)

- Eski CSS-only önizleme kaldırıldı; yerine `hp-leaflet-map` kullanılır.

## Firma operasyon haritası (legacy not)

- Eski CSS-only önizleme kaldırıldı; yerine `hp-leaflet-map` kullanılır.

## Responsive layout (ortak sistem)

- **Yatay padding:** `--hp-pad-x` — `src/styles/_panel-scale.scss` içinde `clamp()`; landing navbar/section/footer ve panel ana içerik aynı kaynağı paylaşır.
- **İçerik üst sınırı:** `--hp-content-max` — taban `72rem`; medya ile **1024 / 1280 / 1440 / 1600 / 1920px** üzerinde kademeli artış (`76` → `92rem`); geniş ekranda tuval büyür, metin satırı aşırı uzamaz.
- **Auth / login kabuğu:** `--hp-auth-shell-max` — `min(92rem, …)`; **1536px+** üst sınır `100rem`; iki sütunlu giriş büyük monitörde küçük kalmaz.
- **Yardımcı sınıflar:** `src/styles/_layout.scss` — `.hp-page`, `.hp-container`, `.hp-container--auth`, `.hp-container--narrow`.

## Panel fluid scale (2026-04-02)

- **Kaynak:** `src/styles/_panel-scale.scss` — `:root` altında **`--hp-panel-*`** token’ları; çoğu değer `clamp(min, vw + sabit, max)` ile küçük ekranda taşma, büyük ekranda “küçük kalmama” dengesi.
- **Import sırası:** `styles.scss` içinde `_tokens.scss` sonrası, `_theme-palettes.scss` öncesi (`--hp-pad-x`, `--hp-content-max`, `--hp-navbar-height` burada tanımlanır; renk paleti değişmez, **#FF6B00** korunur).
- **Kapsam:** shell (**sidebar genişliği**, logo, nav yazı/ikon/padding/gap, header yüksekliği, menü butonu, kullanıcı avatar/isim/e-posta, ikon butonları, header CTA); sayfa (**page gap**, içerik üst/alt padding, KPI grid gap); **KPI** (etiket, değer, ikon kutusu, hint); **hp-panel-card** başlık/gövde padding ve başlık fontu; **form/drawer** (alan aralığı, etiket, input font/padding); **tablo / gövde / caption / badge**; **harita** bloğu (yükseklik, gap, legend); **çıkış** butonu; **drawer** başlık/padding.
- **Dashboard sayfaları:** `admin-dashboard-page`, `firma-dashboard-page` — KPI grid gap, rozetler, tablolar, pipe/stats; **kurye** `courier-dashboard-page` — sayfa gap, tag, placeholder metin aynı token’lara bağlandı.
- **Breakpoint referansı (test):** ~**390** (dar telefon), ~**768** (tablet), ~**1024** (küçük laptop), ~**1280**, ~**1440**, ~**1600+** (geniş / ultra-wide). Fluid değişkenler sürekli ölçeklenir; `--hp-content-max` kademeleri özellikle geniş ekran yoğunluğunu artırır.



## Teknik yön (bağlayıcı)



- Frontend stack: **Angular + TypeScript** (modern standalone mimari).

- Uygulama bootstrapping: `bootstrapApplication` + standalone bileşenler.

- Route yaklaşımı: `loadComponent` ve `loadChildren` ile feature-first ve lazy yükleme.

- Stil altyapısı: global SCSS + merkezi token dosyaları (renk, radius, shadow, glow).

- Tasarım token’ları tek kaynaktan türetilecek; ana aksan renk `#FF6B00`.



## Uyumluluk



- Yeni ekranlar mevcut koyu tema + turuncu aksan + kontrollü glow + kart diline uymalıdır.

- Önceki kararları değiştiren her değişiklik bu dosyada tarih/not ile işlenmelidir.



## Karar günlüğü



| Tarih | Karar | Kısa gerekçe |

|-------|--------|----------------|

| 2026-04-01 | İlk tasarım çerçevesi: dark + #FF6B00 + glow + kartlar | Marka ve kullanıcı isteği uyumu |

| 2026-04-01 | Geliştirme sırası: anasayfa → login → admin → kurye | Önce görünürlük ve akış, sonra paneller |

| 2026-04-01 | Frontend: Angular + TypeScript, standalone mimari | Uzun vadeli sürdürülebilirlik, panel ve canlı veri uyumu |

| 2026-04-01 | Anasayfa üst blok: sticky navbar + hero, token tabanlı SCSS, seçilmiş logo PNG | Premium dark ilk izlenim; anchor’lar sonraki bölümler için hazır |

| 2026-04-01 | Landing orta/alt: özellikler, nasıl çalışır, CTA, footer | Tek sayfa anchor uyumu; kart ve glow dili hero ile hizalı |

| 2026-04-01 | Landing motion: logo girişi, hero/nav stagger, scroll reveal, reduced-motion | Premium polish; oturumda tek logo intro |

| 2026-04-01 | Marka logosu: yalnızca seçilmiş `haspaket-logo.png`; özel SVG/wordmark yok | Marka kimliği korunur; yalnızca boyut/hizalama entegrasyonu |

| 2026-04-02 | Landing premium polish turu: spacing, tipografi, kart/buton/hero/CTA rafinasyonu, glow dengeleme, section geçişleri | Daha ferah ritim, daha az agresif glow, profesyonel SaaS hissi; içerik/route değişmedi |

| 2026-04-02 | `/auth/login` premium UI: split layout, glass kart, Admin/Kurye segment, token uyumlu form | Landing ile görsel tutarlılık; auth backend sonraki adım |

| 2026-04-02 | Demo auth: `DemoAuthService`, storage, role yönlendirme, route guard’lar | Backend öncesi çalışan akış; API ile servis değişimi planlandı |

| 2026-04-02 | Login: Firma + kayar segment pill; sol sadece logo; `/firma` demo route + `demoFirmaGuard` | Üç rol; premium segment hareketi; firma paneli placeholder |

| 2026-04-02 | Ortak responsive layout: `--hp-pad-x`, `--hp-auth-shell-max`, içerik max breakpoint’leri; `_layout.scss`; login + landing aynı padding/max-width mantığı | Tutarlı ölçekleme; büyük ekranda login/landing dengeli; sürdürülebilir yeni sayfalar |

| 2026-04-02 | Firma paneli: shell + dashboard + menü route’ları; mock özet/tablı içerik; mobil sidebar | Ürün içi ilk ekran; API öncesi tutarlı premium UI |

| 2026-04-02 | Firma dashboard SaaS yenilemesi: KPI kartları, panel-card, operasyon hatları, mock grafikler; shell’de başlık + kullanıcı + CTA | Veri odaklı modern panel; marka paleti korunur |

| 2026-04-02 | `shared/ui`: `hp-panel-card`, `hp-kpi-card`; admin shell + dashboard (merkezi KPI, aktivite, 4’lü operasyon, başvuru/sistem kartları) | Firma ile ortak bileşen; admin yönetim odaklı içerik |

| 2026-04-02 | Panel shell: çıkış (`hp-shell-logout`), sade logo, `_panel-shell-animations`; kurye tam shell; admin `hp-admin-live-map` + `@defer` | Tutarlı UX; harita önizleme + canlı veri hazırlığı |

| 2026-04-02 | Firma: ortalanmış logo + wordmark; dashboard’da `firmaHidePageHeading`; **Yeni Sipariş** sağ drawer / mobil sheet; firma dashboard `hp-firma-operation-map` + `@defer`; `hp-panel-card` hover’da hafif `translateY` | Premium sade dashboard; hafif animasyon; harita için genişletilebilir marker modeli |

| 2026-04-02 | Firma: sidebar’da yalnız logo; shell’de üst başlık metni tamamen kaldırıldı; yakında sayfaları `hp-shell-page` / `hp-shell-stagger` + `hp-panel-card` ile dashboard animasyonuyla hizalı | Tek tip panel girişi; sade üst bar |

| 2026-04-02 | Harita önizleme (firma + admin): wash/blocks/roads/grid katmanları; dengeli mock pin; sade alt not; firma **Yeni Sipariş** yumuşak ikincil görünüm; firma/admin sidebar `100dvh` flex + çıkış altında | Daha dolu harita hissi; üst bar ve sidebar rafinasyonu |

| 2026-04-02 | Firma **Yeni Sipariş** sidebar’da (nav altı, çıkış üstü), dashed CTA; drawer body padding + `scrollbar-gutter` ile shift azaltma; backdrop blur kaldırıldı | Sabit layout; net görev ayrımı üst/sol panel |

| 2026-04-02 | Panel UI birliği: `_panel-forms`, `hp-select` (CDK overlay), admin/kurye shell firma ile hizalı sidebar + token; kurye dashboard `hp-panel-card`; admin canlı rozeti yeşil aile | Tek tasarım sistemi; native select listesi kaldırıldı |

| 2026-04-02 | Üst başlık sadeleştirme: admin/kurye shell’de eyebrow + sayfa başlığı + alt başlık kaldırıldı; route `data` başlık alanları temizlendi; içerik padding üstü sıkılaştırıldı; dashboard kartlarında gereksiz lead metinleri ve uzun harita başlığı kaldırıldı (`hp-panel-card` `toolbar`) | İçerik doğrudan KPI / kartlarla başlar |

| 2026-04-02 | Harita: Leaflet + CARTO koyu karo; `hp-leaflet-map`, `PanelMapMarker` lat/lng; `allowedCommonJsDependencies: leaflet` | Gerçek harita hissi, API’ye hazır koordinat modeli |

| 2026-04-02 | Panel **light/dark**: `ThemeService`, `data-theme`, `_theme-palettes.scss`, `hp-theme-toggle` üç shell üst çubuğunda; `haspaket_theme_v1` kalıcılığı; `body`/kartlarda hafif geçiş, `prefers-reduced-motion` ile sınırlı; Leaflet `light_all` / `dark_all` senkronu | Kullanıcı tercihi; landing/login ile uyumlu premium dil |

| 2026-04-02 | Yakında sayfaları + landing hero mock: uzun üst lead / “Operasyon özeti” kaldırıldı veya nötr kısa metinle değiştirildi; içerik doğrudan kartla başlar | İstenen sade panel girişi |

| 2026-04-02 | Tema: `html`/`body` + `theme-dark` / `theme-light` + `data-theme`; `_theme-palettes` hem sınıf hem attribute seçicileri; `hp-theme-toggle` host görünürlüğü | Kullanıcı isteği ile uyum; seçici özgürlüğü |

| 2026-04-02 | **Light premium:** sıcak nötr zemin + gradient; shell sidebar/topbar token’ları; katmanlı `--hp-shadow-*`; form/select/input ve dashboard/track rozetleri semantik token; Leaflet attribution light kart; topbar `backdrop-filter` (reduced-motion’da kapalı) | Modern SaaS; dark ile aynı aile |

| 2026-04-02 | **Panel fluid responsive scale:** `_panel-scale.scss` — `--hp-panel-*` + `clamp()`; sidebar/header/KPI/kart/form/tablo/harita/drawer/çıkış; `--hp-content-max` kademeleri 1024–1920px; firma/admin/kurye shell ve dashboard SCSS token bağlantıları; tema renkleri / #FF6B00 değişmedi | Büyük ekranda içerik orantılı büyür; premium yoğunluk |

| 2026-04-02 | **Logo dark/light:** `haspaket-logo-dark.png` / `haspaket-logo-light.png`, `hp-brand-logo` + `ThemeService`; light’ta “Has” koyu — açık zeminde okunur; marka şekli aynı | Light mode logo bozulması giderildi |

