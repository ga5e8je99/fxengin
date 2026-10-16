# Design System
### FXENGIN — Forex Engineer | Design System & UI/UX Specification for Stitch

---

## 1. Design Direction

FXENGIN is a professional, Arabic-first FinTech education platform that unifies trading courses, market news, live data, analysis, and trading tools into a single premium destination for Arab traders. The site must read as a **serious financial technology product** — closer to a trading terminal crossed with a premium e-learning platform than to a generic "online course" website.

**Intended feeling:** confident, precise, technical, trustworthy, and quietly premium. The interface should feel like it belongs next to TradingView, not next to a generic Udemy clone. Dark, deep-navy surfaces punctuated by electric blue (technology/data) and orange (action/importance) create a "trading cockpit at night" mood — focused, low-glare, and information-dense without ever feeling cluttered.

**Core principles:**
- **Dark-first.** The brand identity is built almost entirely around a near-black navy palette (~60% of all surface usage). Light mode is not part of this identity and should not be introduced.
- **Data feels alive.** Charts, tickers, stats, and prices are the emotional core of the product — treat numbers, gains/losses, and live indicators as first-class visual citizens, not incidental content.
- **Calm authority, not hype.** No loud gradients, no casino-style flashing. Motion and color are used to draw the eye to what matters (a CTA, a live price, a new badge) and nowhere else.
- **Bilingual by design.** Arabic (RTL) is the primary language and default experience; English (LTR) is a fully supported secondary language via a language switcher — the layout system must work natively in both directions, not as an afterthought.

---

## 2. Brand & Visual Identity

The supplied visual identity is a structured brand color-kit for FXENGIN, and it is treated as the **single source of truth** for color, mood, and surface treatment. The project brief's own "Visual Identity" section names a slightly different palette (near-black `#00040C`, navy `#000D20`, `#082A5B`, and an unspecified "gold"). Where the two sources disagree, this document resolves the conflict in favor of the supplied identity image, per the brief's instruction — the image is more specific, more complete (11 documented use-cases and exact hex values), and internally consistent:

| Conflict | Brief text | Identity image | Resolution |
|---|---|---|---|
| Accent color | "gold for featured elements" | Orange `#FB8704` with a blue→orange gradient system | **Use orange `#FB8704`** as the sole brand accent/CTA color. No gold is introduced. |
| Base darks | `#00040C`, `#000D20`, `#082A5B` | `#01071E`, `#06142F`, `#00030D`, `#0A1B3D` | **Use the image's dark scale** — it is more complete (background / secondary / card / elevated-card / pure-black tiers) and was clearly produced as the production palette. |
| Market colors | "green for up, red for down" | Not shown (functional, not brand) | **Kept as-is** — this is a functional/semantic requirement, not a brand-identity color, so it layers on top of the brand palette (see §3 Success/Error). |

**Translating the identity to the website:**
- **Logo:** the FXENGIN mark (a blue-to-orange gradient bar-chart/network glyph) anchors the top-left of the navbar (top-right in RTL) and the footer. Always place it on a dark surface (`#01071E` or `#06142F`) — never on white or light backgrounds, and never re-color it.
- **Backgrounds:** dominant surface is near-black navy (`#01071E`), with a lighter navy (`#06142F`) used to separate sections and cards, and a true near-black (`#00030D`) reserved for full-bleed hero/media backgrounds and footer.
- **Blue (`#0488F8`)** is the "technology & analysis" color: links, icons, chart lines, active nav states, informational badges.
- **Orange (`#FB8704`)** is the "important & action" color: primary CTA buttons, key statistics/numbers, highlighted prices, premium/VIP badges.
- **Gradients** (blue→orange, `#0458EC → #FB8704`) are reserved for hero backgrounds, premium/VIP elements, and the brand mark itself — never used on body text or small UI chrome.
- **Cards** sit one step lighter than the page background (`#06142F` on `#01071E`), with a thin `#12315C` border and no heavy drop shadows — separation comes from color contrast and subtle borders, not shadow depth (per the "avoid excessive shadows" identity note).
- **Photography** (used for social/media backgrounds, hero imagery of traders/charts) always sits under a dark navy overlay/gradient so text stays legible — see §16.

---

## 3. Color System

| Token | Hex | Usage |
|---|---|---|
| **Primary** | `#0488F8` | Links, icons, active states, chart lines, focus rings, primary informational accents |
| **Secondary** | `#01071E` | Core page background (also "Background" token below — brand's dominant dark) |
| **Accent** | `#FB8704` | Primary CTA buttons, key stats/prices, premium badges, highlighted numbers |
| **Background** | `#01071E` | Default page background |
| **Background (footer/hero)** | `#00030D` | Full-bleed hero sections, footer, cinematic media backgrounds |
| **Surface** | `#06142F` | Cards, panels, section backgrounds, secondary nav backgrounds |
| **Surface Elevated** | `#0A1B3D` | Modals, popovers, elevated/hover card state, dropdown menus |
| **Text Primary** | `#F5F7FA` | Headings, body copy, primary UI text |
| **Text Secondary** | `#A7AFBF` | Sub-headings, descriptions, secondary labels |
| **Muted** | `#687287` | Placeholder text, timestamps, disabled labels, helper text |
| **Border** | `#12315C` | Card borders, dividers, input borders, table lines |
| **Success (Bullish/Up)** | `#16C784` | Price gains, "up" indicators, success states, completed status |
| **Warning** | `#FBBF24` | Pending states, medium-impact calendar events, caution badges |
| **Error (Bearish/Down)** | `#F6465D` | Price losses, "down" indicators, form errors, failed payment |

**Brand gradients (reserved use):**

| Gradient | Values | Usage |
|---|---|---|
| Blue Gradient | `#0458EC → #0488F8` | Tech/analytical highlights, chart fills, info banners |
| Orange Gradient | `#FA5A04 → #FB8704` | Primary CTA hover states, "featured" ribbons |
| Brand Gradient | `#0458EC → #FB8704` | Hero backgrounds, VIP/Premium plan cards, logo mark, section dividers |

**Color distribution target** (mirrors the identity's documented usage ratios): dark backgrounds ~60%, cards/secondary surfaces ~20%, blue technical accents ~10%, orange action/important accents ~7%, text/icon fine detail ~3%.

---

## 4. Typography

The identity image is executed in a bold, geometric, high-legibility Arabic display face with wide letterforms suited to dashboards and data — consistent with the brief's own explicit font specification, which is honored directly:

| Role | Font | Notes |
|---|---|---|
| **Font family — Arabic (default/RTL)** | **Noto Sans Arabic** | Primary interface font; excellent numeral and data-table legibility |
| **Font family — English (LTR)** | **Inter** | Primary interface font for the English toggle |
| **Numerals / statistics / prices** | Inter (tabular figures), even inside Arabic layouts | Keeps price/percentage columns aligned; Western numerals recommended for financial data per FinTech convention |

| Element | Size (Desktop) | Weight | Line height |
|---|---|---|---|
| H1 (Hero) | 48–56px | 700–800 | 1.15 |
| H2 (Section title) | 32–36px | 700 | 1.2 |
| H3 (Card/subsection title) | 22–24px | 600–700 | 1.3 |
| H4 (Component title) | 18px | 600 | 1.4 |
| Body | 16px | 400 | 1.6 |
| Body Small / Captions | 13–14px | 400 | 1.5 |
| Labels / Overline | 12px, uppercase (LTR) or letter-spaced (RTL) | 600 | 1.2 |
| Buttons | 15–16px | 600 | 1 |
| Navigation | 15px | 500 | 1 |
| Numbers / Stats (large) | 28–40px | 700, tabular-nums | 1.1 |
| Numbers / Table data | 14–16px, tabular-nums | 500 | 1.4 |

**Weight scale:** 400 (body), 500 (nav/UI labels), 600 (subheads, buttons, badges), 700 (headings), 800 (hero/stat highlights only).

---

## 5. Layout & Grid

| Property | Spec |
|---|---|
| Max content width | 1280px (1440px for data-dense pages: Charts, Live Market, Economic Calendar) |
| Page margin (desktop) | 80px |
| Page margin (tablet) | 40px |
| Page margin (mobile) | 20px |
| Grid | 12-column, 24px gutter (desktop); 4-column, 16px gutter (mobile) |
| Column behavior | Content cards: 4/6/12-col spans on desktop; collapse to full-width single column under 768px |
| Section vertical spacing | 96px between major homepage sections (desktop), 48px (mobile) |
| Container behavior | Full-bleed background color/gradient with an inner max-width container for content |

**Breakpoints:**

| Name | Range |
|---|---|
| Mobile | < 640px |
| Tablet | 640–1023px |
| Desktop | 1024–1439px |
| Wide / Data screens | ≥ 1440px |

---

## 6. Spacing System

Base unit: **4px**, following the identity's clean, technical grid feel.

`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 80 · 96`

- 4–8px: icon-to-label gaps, inline chip padding
- 12–16px: card internal padding (mobile), form field gaps
- 24px: card internal padding (desktop), grid gutters
- 32px: gap between related components (e.g., filter bar → results)
- 48–64px: gap between sub-sections within a page
- 80–96px: gap between full homepage/page sections

---

## 7. Components

| Component | Appearance | Size / Spacing | Typography | States |
|---|---|---|---|---|
| **Navbar** | `#01071E` bg, 1px bottom border `#12315C`, sticky on scroll with subtle `#00030D` blur backdrop | 72px height desktop, 60px mobile, 80px horizontal padding desktop | Nav links 15px/500 | Default: `#A7AFBF` text → Active/Hover: `#F5F7FA` text + `#0488F8` underline (2px) |
| **Logo** | Full gradient mark + wordmark; icon-only on mobile navbar | ~40px height in navbar | — | Static; always full-color, never inverted |
| **Buttons (Primary)** | Solid `#FB8704`, `#F5F7FA` text, 8px radius | 44px height, 24px horizontal padding | 16px/600 | Hover: orange gradient + 2px lift; Active: darker `#E67300`; Disabled: 40% opacity, no pointer |
| **Buttons (Secondary)** | Transparent, 1px `#0488F8` border, `#0488F8` text | Same sizing as primary | 16px/600 | Hover: `#0488F8` 10% fill; Active: 20% fill; Disabled: `#687287` border/text |
| **Buttons (Ghost/Text)** | No border/fill, `#F5F7FA` text | 40px height | 15px/500 | Hover: `#A7AFBF`→`#F5F7FA`, underline |
| **Inputs** | `#06142F` bg, 1px `#12315C` border, 8px radius | 44px height, 16px horizontal padding | 15px/400, placeholder `#687287` | Focus: `#0488F8` border + soft glow; Error: `#F6465D` border + helper text below; Disabled: `#0A1B3D` bg, 50% opacity |
| **Selects/Dropdowns** | Same as input, chevron icon in `#A7AFBF` | 44px height | 15px | Open: `#0A1B3D` panel, `#12315C` border, elevated |
| **Cards (generic)** | `#06142F` bg, 1px `#12315C` border, 12px radius, no/low shadow | 24px padding desktop, 16px mobile | Title 18px/600, body 14–15px/400 | Hover: border → `#0488F8` 40% + 2px lift |
| **Course Cards** | Thumbnail (16:9) top, `#06142F` body below, orange price tag, instructor avatar+name, progress bar if enrolled | 320–360px width in grids | Title 16–18px/600, meta 13px/400 `#A7AFBF` | Hover: image scale 1.03, card border → `#0488F8` |
| **Blog/News Cards** | Thumbnail, category tag (pill, `#0488F8` 15% fill), title, date + read time | Same grid sizing as course cards | Title 16px/600, meta 12–13px `#687287` | Hover: title → `#0488F8` |
| **Badges (Level/Status)** | Pill, 4px radius-ish (full pill), small caps | 24px height, 10px horizontal padding | 12px/600 | Free: `#12315C` fill; Premium: `#0488F8` 15% fill/text; VIP: brand gradient fill, `#F5F7FA` text |
| **Tags (Category)** | Pill outline, `#0488F8` border/text on transparent | 28px height | 13px/500 | Hover: 10% fill |
| **Alerts/Banners** | Left 4px color bar + `#0A1B3D` bg | Full-width, 16px padding | 14px/500 | Info: blue bar; Success: green bar; Warning: amber bar; Error: red bar |
| **Modals** | `#0A1B3D` panel, `#12315C` border, 16px radius, centered, `#00030D` 70% backdrop | Max 560px width | Title 20px/700 | Enter: fade+scale 0.98→1; Exit: reverse |
| **Dropdowns (menus)** | `#0A1B3D` panel, 8px radius, 1px border | Min 200px width | 14px/500 items | Item hover: `#06142F`→`#0488F8` 10% fill |
| **Tables** (Calendar, Live Market) | `#06142F` header row (`#A7AFBF` labels, 12px/600 uppercase-style), zebra-free rows separated by 1px `#12315C` | Row height 48–56px | 14–15px/400, tabular-nums for numbers | Row hover: `#0A1B3D`; Up value: green; Down value: red |
| **Pagination** | Numbered pills, `#06142F` default, `#0488F8` fill active | 36px circle/pill | 14px/500 | Hover: `#12315C` fill |
| **Tabs** | Underline style, `#687287` inactive text, `#0488F8` underline active | 44px height | 15px/600 active, 500 inactive | Hover: text → `#F5F7FA` |
| **Accordions** | `#06142F` row, chevron rotates 180° on open, 1px border between items | 56px header height | 15–16px/600 header | Open: content fades/slides in, icon → `#0488F8` |
| **Progress Indicators** | Track `#12315C`, fill blue→orange gradient for course progress; simple `#0488F8` for linear progress | 8px height (bar), 40px (circular avatar-ring style for course completion) | Percent label 13px/600 | Complete: fill fully orange + checkmark |
| **Testimonials** | `#06142F` card, avatar (circular, 56px), quote text, 5-star rating in `#FB8704` | Carousel or 3-col grid | Quote 15–16px/400 italic-free, name 15px/600 | Hover (carousel arrows): `#0488F8` fill |
| **Footer** | `#00030D` bg, 4-column link grid, logo + tagline, social icons, legal row with 1px top border | 80px top padding, 32px bottom | Links 14px/400 `#A7AFBF` | Hover: `#F5F7FA` |
| **Newsletter Section** | Full-width band, brand gradient or `#06142F` bg, centered input+button, subtle chart-line illustration | 64–80px vertical padding | Heading 24px/700, input inline with button (stacks on mobile) | Submit success: inline check + green text |
| **Ticker Bar** (live prices strip) | `#00030D` thin bar, horizontally auto-scrolling, per-item green/red arrow | 40px height | 13px/600 tabular-nums | Item hover: pause scroll |
| **Calculators (Tools)** | Two-column card: input form left, result panel right (`#0A1B3D`, orange result figure) | Form fields per §7 Inputs | Result number 28px/700 orange | Live-update on input change |

---

## 8. Navigation

**Desktop navigation (RTL primary):**
`[شعار FXENGIN]  ——  الرئيسية · الكورسات ▾ · المدونة ▾ · الأسواق ▾ · الأدوات ▾ · التقويم الاقتصادي  ——  [🔍 بحث]  [🌐 EN]  [🔔]  [تسجيل الدخول]  [ابدأ الآن]`

- **الكورسات (Courses) dropdown:** category list (فوركس أساسي، تحليل فني، تحليل أساسي، إدارة رأس المال، إلخ) + "عرض كل الكورسات" link.
- **الأسواق (Markets) dropdown:** أخبار السوق، التحليلات، السوق المباشر، الرسوم البيانية.
- **الأدوات (Tools) dropdown:** grid of the 6 calculators + محول العملات.
- **Search:** expands into a full-width overlay searching courses/articles/news/analyses, per brief.
- **Language switcher:** `EN ⇄ AR` pill toggle; swaps entire layout direction, not just labels.
- **Notification bell:** shows unread-count dot in orange; opens dropdown panel (`#0A1B3D`) with recent notifications grouped by type (new course, new lesson, new article, new analysis, market alert).
- **CTA:** "ابدأ الآن" (Get Started) always rendered as the Primary orange button, rightmost in RTL (leftmost in LTR).
- **Logged-in state:** "تسجيل الدخول" + CTA are replaced by a user avatar menu → لوحة التحكم (Dashboard), الملف الشخصي (Profile), الاشتراك (Subscription), تسجيل الخروج (Logout).

**Mobile navigation:**
- Collapsed to: `[☰]  [شعار]  [🔔]  [🔍]`.
- Hamburger opens a full-screen `#01071E` drawer sliding from the right (RTL) with accordion-style top-level items (Courses/Blog/Markets/Tools expand in place), language switcher and login/CTA pinned at the bottom.
- Ticker bar (live prices) may render as a slim persistent strip just below the mobile navbar on market-related pages.

---

## 9. Page Architecture

### الصفحة الرئيسية (Homepage)
- **Purpose:** Convert visitors into course subscribers/leads while showcasing the full breadth of the platform (education + news + data + tools).
- **Target user:** New/returning visitor, all experience levels.
- **Layout:** Full-width stacked sections, alternating `#01071E`/`#06142F` backgrounds for rhythm.
- **Primary CTA:** "استكشف الكورسات" (Explore Courses) / "ابدأ الآن".
- **Secondary CTA:** "اشترك في النشرة البريدية" (Newsletter).
- See §10 for full section breakdown.

### الكورسات (Courses — Listing)
- **Purpose:** Browse and filter all courses.
- **Layout:** Left sidebar filters (category, level, price) + 3-column responsive course-card grid; sort bar on top.
- **Components:** Course Cards, Tags, Pagination, Search-within-results.
- **Primary CTA:** per-card "عرض الكورس"; **Secondary:** "أضف للمفضلة" (wishlist icon).

### صفحة تفاصيل الكورس (Course Detail)
- **Layout:** Hero (title, instructor, rating, price, enroll box sticky on the side on desktop) → tabs (نظرة عامة / المنهج / المدرب / التقييمات) → curriculum accordion (lessons list with lock icons for unpurchased) → instructor bio card → related courses.
- **Components:** Tabs, Accordions, Progress bar (if enrolled), Testimonials.
- **Primary CTA:** "اشترك الآن" / "أضف للسلة"; **Secondary:** "شاهد المعاينة" (preview lesson).

### مشغل الدرس (Lesson Player) — within Courses
- **Layout:** Video player (main, left/center) + curriculum sidebar (right, collapsible) showing lesson list with completion checkmarks; below player: tabs for الوصف / المرفقات / التعليقات.
- **Components:** Progress Indicators, Accordion sidebar, comments list.
- **Primary CTA:** "الدرس التالي" (Next Lesson); triggers quiz ("اختبار") at chapter end, then شهادة (certificate) on course completion.

### المدونة (Blog — Listing)
- **Layout:** Featured article (large card) + 3-column article grid, category filter tabs, sidebar with "الأكثر قراءة" (most read).
- **Components:** Blog Cards, Tags/category pills, Pagination.
- **Primary CTA:** article card click-through; **Secondary:** category tag filter.

### مقال المدونة (Blog Article Detail)
- **Layout:** Title/hero image, author + date + read-time meta row, article body (max ~720px reading column), share row (sticky side on desktop), "مقالات مشابهة" grid at bottom, comment section.
- **Components:** Alerts (for source citations), Tags, comment list/form.
- **Primary CTA:** "اشترك للحصول على مقالات حصرية" inline banner mid-article for Premium content.

### أخبار الأسواق (Market News)
- **Layout:** Filter tabs across top (الكل / فوركس / ذهب / نفط / عملات رقمية / أسهم / مؤشرات), news list (compact cards: thumbnail, headline, source, timestamp), infinite scroll or pagination.
- **Components:** Tags/filter tabs, News list cards, source attribution badges (FXStreet/Investing.com/etc.).
- **Primary CTA:** headline click-through to source/detail.

### التحليلات (Analysis)
- **Layout:** Similar to News but cards include instrument tag + bias badge (صعودي/هبوطي — green/red), filter by نوع التحليل (فني/أساسي) and الفترة (يومي/أسبوعي).
- **Components:** Analysis cards w/ mini price-chart thumbnail, bias Badges.
- **Primary CTA:** "قراءة التحليل الكامل".

### التقويم الاقتصادي (Economic Calendar)
- **Layout:** Filter bar (الدولة، العملة، التاريخ، درجة التأثير) → dense data Table (الحدث، الدولة، العملة، التأثير، القراءة السابقة، التوقعات، الفعلي) with day-grouped rows and impact indicated by 1–3 filled dots in orange/red.
- **Components:** Table, filter Selects, impact Badges.
- **Responsive:** collapses to stacked event cards on mobile (one event = one card).

### السوق المباشر (Live Market)
- **Layout:** Instrument category tabs (أزواج العملات / ذهب / فضة / نفط / مؤشرات / عملات رقمية) → data Table (السعر، % التغير in green/red, mini sparkline) → selecting a row opens/updates a large chart panel below; "قائمة المراقبة" (watchlist) as a pinned sidebar/tab (requires login).
- **Components:** Table, Tabs, embedded chart, star/watchlist icon-button per row.

### الرسوم البيانية (Charts)
- **Layout:** Full-width/full-height TradingView-style workspace: symbol search + timeframe switcher + indicator menu across a slim top toolbar, chart canvas fills remaining viewport, drawing-tools rail on the side (LTR-oriented rail regardless of page direction, per financial-charting convention), fullscreen toggle.
- **Components:** Tabs (timeframes), Dropdowns (indicators/symbol search).

### أدوات التداول (Trading Tools — Hub + individual calculators)
- **Layout:** Hub = grid of 6 tool cards (Pip/Lot-Size/Margin/PnL/Risk calculators + currency converter), each opening a two-column Calculator component (§7).
- **Primary CTA:** "احسب" (Calculate) button triggers live result panel.

### لوحة تحكم المستخدم (User Dashboard)
- **Layout:** Left sidebar nav (كورساتي، المفضلة، قائمة المراقبة، الشهادات، الإشعارات، الملف الشخصي، الاشتراك) + main content area per section; overview tab shows continue-learning cards, stats (courses in progress, certificates earned), notification feed.
- **Components:** Progress Indicators, Course Cards (compact "continue" variant), Badges, notification list.
- **Primary CTA:** "متابعة التعلم" (Continue Learning) on in-progress course.

### لوحة تحكم الإدارة (Admin Dashboard)
- **Layout:** Sidebar nav (المستخدمون، الكورسات والدروس، المقالات والأخبار، التصنيفات والاشتراكات، الوسائط والإعدادات، الإحصائيات) + data-table-centric main area with stat-card row at top (KPIs in orange numerals) and CRUD tables below.
- **Components:** Table, Modals (create/edit), Buttons, stat Cards.
- Kept visually consistent with the public site's dark system but denser (tighter row heights, smaller type scale) since it's a power-user surface.

### تسجيل الدخول / إنشاء حساب (Login / Register)
- **Layout:** Centered card (max 440px) on full-bleed dark/gradient background, logo above form, social-login row (optional), toggle link to switch login/register.
- **Primary CTA:** "تسجيل الدخول" / "إنشاء حساب"; **Secondary:** "نسيت كلمة المرور؟".

### الاشتراكات (Pricing/Subscriptions)
- **Layout:** 3-column plan comparison (مجاني / Premium / VIP) as Cards, VIP card visually elevated with brand-gradient border/background to signal premium tier; feature checklist per plan.
- **Primary CTA:** "اشترك الآن" per paid plan; **Secondary:** "ابدأ مجانًا" on Free tier.

### الدفع (Checkout / Payment)
- **Layout:** Two-column — order summary (left/aside) + payment form (main); clear payment **States** (قيد الانتظار/pending, ناجحة/success, فاشلة/failed) each with a dedicated confirmation screen (see §14).

### البحث (Search Results)
- **Layout:** Tabs to filter result type (الكل/كورسات/مقالات/أخبار/تحليلات), unified result list reusing each content type's card component.

---

## 10. Homepage — Section-by-Section

1. **Header** — sticky navbar (§8).
2. **Hero Section** — full-bleed `#00030D`/brand-gradient background with subtle chart-line/candlestick motif; large H1 ("مرجعك الاحترافي لتعلم الفوركس" style headline), supporting subtext, primary + secondary CTA, and a live mini-ticker or stat strip (e.g., "+12,000 متداول" / live price snippet) beneath the CTAs.
3. **نبذة عن المنصة (About/Value Prop)** — 3–4 column icon+text blocks (education, news, analysis, tools) on `#01071E`.
4. **الكورسات المميزة (Featured Courses)** — section header + "عرض الكل" link, horizontal-scroll or 4-col grid of Course Cards on `#06142F`.
5. **أحدث المقالات (Latest Articles)** — featured article + 3 Blog Cards.
6. **أحدث أخبار السوق (Latest Market News)** — compact list/ticker-style feed, source-badged.
7. **أحدث التحليلات (Latest Analysis)** — 3-card row with bias badges.
8. **نظرة سريعة على السوق (Market Snapshot)** — compact live-data Table/widget (top pairs, gold, indices) with green/red deltas — a taste of the full Live Market page.
9. **الأدوات الأكثر استخدامًا (Popular Tools)** — icon-grid of 4–6 tool shortcuts.
10. **آراء العملاء (Testimonials)** — 3-card or carousel, star ratings in orange.
11. **الاشتراك في النشرة البريدية (Newsletter)** — full-width gradient band.
12. **دعوة نهائية للاشتراك (Final Course CTA)** — bold closing banner before the footer, brand-gradient background, single strong CTA.
13. **Footer** — §7 Footer spec.

---

## 11. User Flows

**1. Visitor → Browse → Course → Purchase**
Homepage → "الكورسات" nav or Featured Courses → filter/browse listing → Course Detail page → review curriculum/instructor → "اشترك الآن" → (if not logged in) Register/Login → Checkout → Payment → Success screen → redirected into Lesson Player, course now visible in Dashboard "كورساتي".

**2. Visitor → Register/Login → Dashboard**
Any page → navbar "تسجيل الدخول" → Login/Register card → on success, redirect to previous page or User Dashboard overview.

**3. User → Course → Lesson → Test → Certificate**
Dashboard "كورساتي" → select in-progress course → Lesson Player → complete lesson (auto-checks progress) → repeat through chapter → end-of-chapter اختبار (quiz, multiple-choice card style) → pass → next chapter unlocks → final lesson complete → شهادة إتمام (Certificate) generated → visible/downloadable in Dashboard "الشهادات".

**4. User → Payment → Success/Failure**
Checkout form → submit payment → **Pending** state (spinner/processing screen) → **Success**: confirmation screen with order summary + "الذهاب إلى الكورس" CTA, confirmation email/notification triggered → **Failure**: error screen with reason + "إعادة المحاولة" (Retry) and "تغيير طريقة الدفع" CTAs, course remains locked.

**5. User → Language Switching**
Any page → navbar language pill → entire UI direction flips (RTL↔LTR), font swaps (Noto Sans Arabic ↔ Inter), numerals/dates reformat, user stays on the equivalent localized page (not reset to homepage).

**6. Visitor → Tool Usage (no login required)**
Navbar "الأدوات" → select calculator → fill inputs → live-updating result panel → optional "أنشئ حسابًا لحفظ النتائج" soft-prompt (non-blocking).

**7. User → Notifications**
New course/lesson/article/analysis/economic event published → bell icon shows orange dot/count → user opens dropdown → clicks item → deep-links to the relevant content.

---

## 12. Responsive Design

| Aspect | Desktop | Tablet | Mobile |
|---|---|---|---|
| Navigation | Full horizontal nav + dropdowns | Condensed nav, some items fold into a "المزيد" (More) menu | Hamburger drawer, ticker collapses to slim strip |
| Grid | 12-col, up to 4 cards/row | 6–8-col, 2–3 cards/row | 4-col, 1 card/row (courses/news), 2-col for compact badges/tools |
| Typography | Full scale (§4) | H1 → 40px, H2 → 28px | H1 → 32px, H2 → 24px, body stays 16px for readability |
| Cards | Full padding (24px), hover-lift enabled | Same, hover simplified (no lift, border-only) | 16px padding, tap states replace hover (border flash on tap) |
| Images | 16:9 course/blog thumbnails, full hero imagery | Same ratios, hero height reduced | Hero height further reduced; thumbnails remain 16:9 for consistency |
| Buttons | Inline, auto-width | Inline | Primary CTAs go full-width within their container |
| Tables (Calendar/Market) | Full multi-column table | Horizontal scroll within card, sticky first column | Convert to stacked event/instrument cards (one row → one card) |
| Forms | Multi-column where sensible (checkout) | Single column | Single column, larger 48px touch targets |
| Sections | 96px vertical rhythm | 64px | 48px |

---

## 13. RTL / Arabic Support

- **Default direction:** the entire application defaults to `dir="rtl"` with Arabic (Noto Sans Arabic) as the default language.
- **Layout mirroring:** navbar logo, primary nav order, sidebar position (Dashboard, Course Detail curriculum sidebar), drawer slide-direction, and breadcrumb/back-arrow direction all mirror between RTL and LTR.
- **Icons requiring direction-logic:** back/forward chevrons, "next lesson" arrows, share/reply arrows, pagination arrows — all flip horizontally in RTL. Icons that represent fixed real-world concepts (play button, search glass, bell, star, checkmarks, up/down market arrows) **do not** flip.
- **Charts & data tables (Live Market, Charts, Economic Calendar):** table column order flips (label columns start on the right in RTL) but candlestick/line charts themselves and numeral formatting stay LTR internally per financial-industry convention (TradingView-style tooling remains LTR even inside an RTL page) — this is a deliberate, documented exception.
- **Forms:** input text-align follows direction (right-aligned in RTL); numeric/email/price fields remain LTR-aligned even within an RTL form, per financial UI convention.
- **Language switcher:** a persistent `EN ⇄ AR` control in the navbar (and repeated in the mobile drawer + footer) toggles `dir`, font-family, number formatting, and date formatting app-wide; the toggle itself never mirrors position (stays at a predictable, findable spot).
- **Typography behavior:** Arabic headings use slightly reduced letter-spacing tracking compared to Latin equivalents (Noto Sans Arabic doesn't need artificial tracking); line-height is increased marginally (+0.1) for Arabic body copy versus English, to preserve comfortable reading of Arabic script.

---

## 14. States

| State | Treatment |
|---|---|
| **Loading** | Skeleton screens (`#06142F` blocks with subtle shimmer) for cards/tables; spinner (blue, brand-colored) for buttons/inline actions |
| **Empty** | Centered icon illustration (line-art, `#687287`) + short message + a relevant CTA (e.g., empty watchlist → "أضف رمزًا للمتابعة") |
| **Error (page/data)** | Icon + message + "إعادة المحاولة" button; inline field errors show `#F6465D` border + small helper text below the field |
| **Success** | Green check icon/toast, or full confirmation screen (checkout) |
| **Disabled** | 40–50% opacity, no hover/active transitions, cursor not-allowed |
| **Hover** | Border/color shift toward `#0488F8` (informational elements) or `#FB8704` (actionable elements), no layout shift |
| **Active** | Slightly darker fill/border than hover; pressed-button scale 0.98 |
| **Focus** | 2px `#0488F8` outline with 2px offset — always visible, never removed, for keyboard users |
| **Validation** | Inline, real-time on blur; success check icon in green for valid fields |
| **Payment pending** | Full-screen/modal spinner + "جارٍ تأكيد الدفع..." — no navigation away allowed until resolved |
| **Payment successful** | Confirmation screen: green check illustration, order summary, primary CTA to access purchased content |
| **Payment failed** | Error screen: red icon, failure reason if available, Retry + Change-payment-method CTAs |

---

## 15. Accessibility

- **Color contrast:** all body text (`#F5F7FA`/`#A7AFBF` on `#01071E`/`#06142F`) meets WCAG AA (4.5:1+); verify orange-on-dark and blue-on-dark button text meets AA for 16px+ bold UI text (3:1 minimum for large/bold text, 4.5:1 for body-size text) — use `#F5F7FA` (not dark) text on both orange and blue button fills.
- **Keyboard navigation:** full tab-order support across nav, dropdowns, forms, and modals; modals trap focus and return focus to the trigger element on close; Escape closes modals/dropdowns.
- **Focus states:** always visible 2px `#0488F8` outline (§14) — never `outline: none` without a replacement.
- **Buttons/inputs:** minimum 44×44px touch target on all interactive elements; icon-only buttons carry `aria-label`s (bell, search, watchlist star, etc.).
- **Text readability:** body text never below 14px; line length capped (~70–80 characters) in article/reading contexts (§9 Blog Article).
- **Touch targets:** 44px minimum height maintained across mobile breakpoints, with 8px minimum spacing between adjacent tappable elements (calendar filters, calculator inputs).
- **Semantic structure:** proper heading hierarchy (single H1 per page), `<nav>`/`<main>`/`<footer>` landmarks, tables use real `<table>` markup with `<th scope>` for the Economic Calendar/Live Market data (not div-grids), forms use associated `<label>`s.

---

## 16. Imagery & Iconography

- **Photography style:** dark, moody, low-saturation trading/finance photography — silhouetted traders against chart backdrops, close-ups of screens/candlesticks, abstract light trails (mirroring the identity's "cinematic dark background" social-media variant). Always paired with a dark navy gradient overlay (bottom-to-top or full-frame `#00030D` at 40–60% opacity) to preserve text legibility.
- **Illustration style:** minimal, geometric line-art in `#0488F8`/`#FB8704` on transparent/dark backgrounds — used for empty states, onboarding, and tool-hub icons. No cartoonish or flat-illustration-people style; keep it technical/abstract (network nodes, bar shapes, candlestick motifs — echoing the logo mark).
- **Icon style:** outline icons (1.5–2px stroke), rounded joins, 20–24px default size, colored `#A7AFBF` at rest and `#0488F8`/`#FB8704` on active/hover per context.
- **Image ratios:** 16:9 for course/blog thumbnails and hero media; 1:1 for instructor/user avatars; 4:5 for testimonial portraits (optional).
- **Image treatment:** subtle 8–12px corner radius consistent with card radius; no heavy borders; a thin 1px `#12315C` hairline border is acceptable on thumbnails over busy backgrounds.
- **Overlay usage:** gradient overlays only, never flat-color scrims; overlay direction follows content — bottom-up for hero text, full-frame for background/ambient imagery.

---

## 17. Motion & Interaction

Motion is subtle, fast, and purposeful — never decorative for its own sake.

| Interaction | Motion |
|---|---|
| **Hover (cards)** | 150ms ease-out: border-color shift + 2–4px translateY lift, no shadow bloom |
| **Hover (buttons)** | 120ms ease: background/gradient shift, no scale |
| **Active (buttons)** | 80ms: scale 0.98 |
| **Page transitions** | 200ms fade + 8px translateY on route change (avoid full-page flash on a dark UI) |
| **Dropdown/menu open** | 150ms ease-out: opacity 0→1 + 4px translateY settle |
| **Modal open/close** | 200ms: opacity + scale 0.96→1 in, reverse out; backdrop fades independently at 250ms |
| **Scroll animations** | Sections/cards fade+rise into view once on first scroll into viewport (staggered ~60ms per card in a grid) — disabled entirely for users with `prefers-reduced-motion` |
| **Live data ticks** | Price changes flash their cell briefly (green/red background pulse, 400ms) then settle back to transparent — draws the eye without being distracting |
| **Progress bars** | Animate fill on load/update (400ms ease-out), never instantly jump |
| **Ticker bar scroll** | Continuous linear auto-scroll, pauses on hover/tap |

---

## 18. Stitch Generation Instructions

1. Follow this design system strictly for every page and component — do not introduce alternate layouts, color palettes, or component styles not documented here.
2. Follow the supplied visual identity image as the ground-truth reference for color, tone, and surface treatment; do not reintroduce the brief's literal "gold" mention — the resolved accent color is orange `#FB8704` only (see §2).
3. Do not introduce random or ad-hoc colors outside the token table in §3, including its two gradients — no other accent hues.
4. Do not default to a generic light-mode SaaS dashboard aesthetic. This is a **dark-first, data-dense FinTech education platform** — treat every page as if it needs to sit comfortably next to a live trading terminal.
5. Maintain the 4px-based spacing scale (§6) and the section rhythm (96px desktop / 48px mobile) consistently across every page — do not compress or expand spacing ad hoc per page.
6. Maintain consistent typography per §4: Noto Sans Arabic for the RTL/Arabic build, Inter for the LTR/English build and for all tabular numerals in both.
7. Prioritize clear visual hierarchy: one obvious primary action per screen (orange), supporting actions secondary (blue outline or ghost) — never place two orange primary buttons competing in the same view.
8. Build every page listed in §9 — do not skip the Admin Dashboard, Trading Tools, Charts, or Economic Calendar; these are core, not optional, per the brief.
9. Keep all pages visually consistent: reuse the same Navbar, Footer, Card, Table, and Button components verbatim across pages rather than re-styling per page.
10. Make responsive behavior intentional per §12 — tables must convert to stacked cards on mobile, not simply shrink/scroll unreadably.
11. Fully support Arabic RTL as the default build per §13, including mirrored icons, mirrored layout, and the LTR exception for charts/financial numerals.
12. Keep the interface premium and modern: generous spacing, restrained motion (§17), no gimmicks.
13. Avoid excessive gradients, excessive shadows, excessive corner-rounding, or unnecessary decoration — gradients are reserved for hero sections, VIP/premium elements, and the logo only; shadows are minimal-to-none (separation via border/contrast); radii stay in the 8–16px range, never fully rounded "bubbly" cards.
14. Use realistic content in every mock (real-sounding Arabic course titles, plausible instructor names, real-looking price/percentage figures, real economic-calendar-style events) — never lorem ipsum or placeholder brackets.
15. Keep CTA placement clear and consistent: primary CTA always uses the orange Primary Button style from §7, always the most visually dominant interactive element on its section.
16. Ensure all components (cards, buttons, badges, tables) are built as reusable, parameterized components — not one-off, page-specific variants.
