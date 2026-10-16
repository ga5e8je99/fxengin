# FXENGIN Ecosystem — Formal Master Test Cases Specification (81/81 Executed)

> **Document Version:** 1.0.0  
> **QA Engineering Standard:** Senior QA Architect / Lead Automation Engineer  
> **Execution Status:** 81 / 81 Executed | **81 Passed (100.0%)** | 0 Failed | 0 Blocked  
> **Target Environment:** Development / Pre-Production Staging  
> **Engines Verified:**  
> - Core Engine REST/WebSockets API (`fx-backenf`, NestJS 10, Port 5001, Swagger `/docs`)  
> - Public Trading & Educational Portal (`fx-engin`, Next.js 16, Port 3000)  
> - Sovereign Admin Studio Control Center (`fxengin-admin`, Next.js 16, Port 3001)  
> - Database Engine (PostgreSQL 16, Prisma ORM, 30 Entities)

---

## 1. Automated API, Database, Authentication & RBAC Test Cases (64 Tests)

| Test ID | Module / Feature | Scenario Description | Preconditions | Test Steps & Payloads | Expected Response / DB State | Actual Result | Severity | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-SYS-001** | System Infrastructure | Backend Health & PostgreSQL Ping | NestJS running on port 5001 | `GET /health` | HTTP 200, `{ status: 'ok', info: { database: { status: 'up' } } }` | HTTP 200, DB latency 4ms | P0 | ✅ PASSED |
| **TC-SYS-002** | Public Web Portal | Frontend SSR & Document Delivery | Next.js running on port 3000 | `GET http://localhost:3000/` | HTTP 200, HTML contains `<title>`, `<meta>`, and root element | HTTP 200 OK, full HTML delivered | P0 | ✅ PASSED |
| **TC-SYS-003** | Admin Studio | Admin Protected Route Redirect | Next.js running on port 3001 | `GET http://localhost:3001/` unauthenticated | HTTP 307 Redirect to `/login` | HTTP 307 redirect enforced | P0 | ✅ PASSED |
| **TC-AUTH-001** | Authentication | Trader Account Registration | Valid unique email | `POST /auth/register` with name, email, password, phone, role USER | HTTP 201 Created, user record created in DB, password hashed | HTTP 201 Created, ID returned | P0 | ✅ PASSED |
| **TC-AUTH-002** | Authentication | Duplicate Email Registration Defense | Existing registered email | `POST /auth/register` with identical email | HTTP 409 Conflict, duplicate rejected | HTTP 409 Conflict returned | P0 | ✅ PASSED |
| **TC-AUTH-003** | Authentication | Valid Trader Authentication | Pre-registered trader | `POST /auth/login` with email and valid password | HTTP 200 OK, returns JWT `access_token` and user object | HTTP 200, valid JWT token returned | P0 | ✅ PASSED |
| **TC-AUTH-004** | Authentication | Invalid Password Rejection | Pre-registered trader | `POST /auth/login` with valid email and wrong password | HTTP 401 Unauthorized | HTTP 401 Unauthorized returned | P0 | ✅ PASSED |
| **TC-AUTH-005** | Authentication | Case-Insensitive Email Login | Email registered in lowercase | `POST /auth/login` with UPPERCASE email | HTTP 200 OK, matches lowercase email in DB | HTTP 200, JWT returned | P2 | ✅ PASSED |
| **TC-AUTH-006** | Admin Authentication | Super Admin Master Login | Super Admin seeded in DB | `POST /admin/auth/login` with admin credentials | HTTP 200 OK, returns Admin JWT with role SUPER_ADMIN | HTTP 200, admin token returned | P0 | ✅ PASSED |
| **TC-AUTH-007** | Authentication | Trader Profile Verification | Active Trader JWT | `GET /auth/me` with Bearer token header | HTTP 200 OK, returns profile matching authenticated user ID | HTTP 200, correct ID & email | P1 | ✅ PASSED |
| **TC-RBAC-001** | Authorization / RBAC | Public Access to Admin Settings (Blocked) | Unauthenticated client | `GET /admin/settings` | HTTP 401 Unauthorized | HTTP 401 Unauthorized | P0 | ✅ PASSED |
| **TC-RBAC-002** | Authorization / RBAC | Standard Trader Access to Admin Users (Blocked) | Authenticated as USER role | `GET /admin/users` with USER JWT token | HTTP 403 Forbidden | HTTP 403 Forbidden | P0 | ✅ PASSED |
| **TC-RBAC-003** | Authorization / RBAC | Standard Trader Course Creation (Blocked) | Authenticated as USER role | `POST /admin/courses` with valid course payload | HTTP 403 Forbidden | HTTP 403 Forbidden | P0 | ✅ PASSED |
| **TC-RBAC-004** | Authorization / RBAC | Standard Trader Broker Creation (Blocked) | Authenticated as USER role | `POST /admin/brokers` with broker payload | HTTP 403 Forbidden | HTTP 403 Forbidden | P0 | ✅ PASSED |
| **TC-RBAC-005** | Authorization / RBAC | Super Admin User Directory Access | Authenticated as SUPER_ADMIN | `GET /admin/users` with admin token | HTTP 200 OK, returns array of platform users | HTTP 200, array of 14 users | P0 | ✅ PASSED |
| **TC-RBAC-006** | Authorization / RBAC | Super Admin Settings Access | Authenticated as SUPER_ADMIN | `GET /admin/settings` with admin token | HTTP 200 OK, returns system configuration | HTTP 200, system settings payload | P0 | ✅ PASSED |
| **TC-CRUD-001** | Courses Management | Course Creation by Super Admin | Authenticated as SUPER_ADMIN | `POST /admin/courses` with title, slug, price, tier | HTTP 201 Created, course persisted in database | HTTP 201 Created, course CUID returned | P0 | ✅ PASSED |
| **TC-CRUD-002** | Courses Management | Course Duplication Defense | Existing course slug | `POST /admin/courses` with same slug | HTTP 409 Conflict, duplicate slug prevented | HTTP 409 Conflict returned | P1 | ✅ PASSED |
| **TC-CRUD-003** | Courses Management | Missing Required Fields Defense | Super Admin token | `POST /admin/courses` with empty payload `{}` | HTTP 400 Bad Request (ValidationPipe) | HTTP 400 Bad Request | P1 | ✅ PASSED |
| **TC-CRUD-004** | Courses Management | Course Read by Slug | Published course | `GET /courses/{slug}` public endpoint | HTTP 200 OK, returns course details | HTTP 200, matching slug details | P0 | ✅ PASSED |
| **TC-CRUD-005** | Courses Management | Course Update by Admin | Created test course | `PATCH /admin/courses/{id}` with updated title & price | HTTP 200 OK, updated fields reflected in DB | HTTP 200, updated price saved | P1 | ✅ PASSED |
| **TC-CRUD-006** | Courses Management | Course Soft/Hard Delete | Created test course | `DELETE /admin/courses/{id}` with admin token | HTTP 200/204, course removed from catalog | HTTP 200 OK, deleted successfully | P1 | ✅ PASSED |
| **TC-CRUD-007** | Courses Management | Verification of Deleted Course | Deleted course ID | `GET /courses/{slug}` after deletion | HTTP 404 Not Found | HTTP 404 Not Found returned | P1 | ✅ PASSED |
| **TC-CRUD-008** | Brokers Management | Broker Creation by Super Admin | Super Admin token | `POST /admin/brokers` with name, brokerSlug, rating | HTTP 201 Created, broker record persisted | HTTP 201 Created, broker ID returned | P0 | ✅ PASSED |
| **TC-CRUD-009** | Brokers Management | Broker Duplicate Slug Defense | Existing brokerSlug | `POST /admin/brokers` with duplicate brokerSlug | HTTP 409 Conflict | HTTP 409 Conflict returned | P1 | ✅ PASSED |
| **TC-CRUD-010** | Brokers Management | Broker Public Directory Listing | Active brokers | `GET /brokers` public API | HTTP 200 OK, returns array including newly created broker | HTTP 200, array of brokers | P0 | ✅ PASSED |
| **TC-CRUD-011** | Brokers Management | Broker Detail by Slug | Valid brokerSlug | `GET /brokers/{slug}` | HTTP 200 OK, returns broker matrix specifications | HTTP 200 OK, details returned | P1 | ✅ PASSED |
| **TC-CRUD-012** | Brokers Management | Broker Update by ID or Slug | Created test broker | `PUT /admin/brokers/{idOrSlug}` with modified rating | HTTP 200 OK, rating updated in DB | HTTP 200, rating updated (BUG-001 Fix) | P1 | ✅ PASSED |
| **TC-CRUD-013** | Brokers Management | Broker Deletion by ID or Slug | Created test broker | `DELETE /admin/brokers/{idOrSlug}` | HTTP 200 OK, broker removed from DB | HTTP 200 OK (BUG-001 Fix) | P1 | ✅ PASSED |
| **TC-CRUD-014** | Brokers Management | Verification of Deleted Broker | Deleted brokerSlug | `GET /brokers/{slug}` after deletion | HTTP 404 Not Found | HTTP 404 Not Found returned | P1 | ✅ PASSED |
| **TC-CRUD-015** | Articles Management | Article Creation by Super Admin | Super Admin token | `POST /admin/articles` with title, slug, content, status | HTTP 201 Created, article persisted | HTTP 201 Created, article ID returned | P0 | ✅ PASSED |
| **TC-CRUD-016** | Articles Management | Article Duplicate Slug Defense | Existing article slug | `POST /admin/articles` with duplicate slug | HTTP 409 Conflict | HTTP 409 Conflict returned | P1 | ✅ PASSED |
| **TC-CRUD-017** | Articles Management | Public Article Feed | Published articles | `GET /articles?status=PUBLISHED` | HTTP 200 OK, returns articles list | HTTP 200, articles array | P0 | ✅ PASSED |
| **TC-CRUD-018** | Articles Management | Article Read by Slug | Valid slug | `GET /articles/{slug}` | HTTP 200 OK, returns article body | HTTP 200 OK | P1 | ✅ PASSED |
| **TC-CRUD-019** | Articles Management | Article Update | Created test article | `PATCH /admin/articles/{id}` with updated title | HTTP 200 OK, title updated in DB | HTTP 200 OK | P1 | ✅ PASSED |
| **TC-CRUD-020** | Articles Management | Article Deletion | Created test article | `DELETE /admin/articles/{id}` | HTTP 200 OK, article deleted | HTTP 200 OK | P1 | ✅ PASSED |
| **TC-CRUD-021** | Articles Management | Verification of Deleted Article | Deleted article slug | `GET /articles/{slug}` | HTTP 404 Not Found | HTTP 404 Not Found returned | P1 | ✅ PASSED |
| **TC-API-001** | Discovery APIs | Public Forex Calendar Feed | Backend active | `GET /economic-calendar` | HTTP 200 OK, returns macroeconomic events array | HTTP 200, economic events returned | P2 | ✅ PASSED |
| **TC-API-002** | Discovery APIs | Public Market Quotes Ticker | Backend active | `GET /markets/quotes` | HTTP 200 OK, returns currency pair bid/ask | HTTP 200, quotes array returned | P1 | ✅ PASSED |
| **TC-API-003** | Discovery APIs | Live Broadcast Sessions Directory | Backend active | `GET /live` | HTTP 200 OK, returns `{ liveNow, upcoming, replays }` | HTTP 200, live payload returned | P1 | ✅ PASSED |
| **TC-API-004** | Discovery APIs | Public System Settings (Branding) | Backend active | `GET /admin/settings/public` | HTTP 200 OK, returns safe branding and contact channels | HTTP 200, branding metadata | P2 | ✅ PASSED |
| **TC-API-005** | Discovery APIs | Swagger OpenAPI Documentation | Backend active | `GET /docs` and `GET /docs-json` | HTTP 200 OK, returns valid OpenAPI 3.0 schema | HTTP 200, valid OpenAPI schema | P2 | ✅ PASSED |
| **TC-API-006** | Discovery APIs | Invalid Non-Existent API Endpoint | Backend active | `GET /api/v1/invalid-route-xyz` | HTTP 404 Not Found with JSON error format | HTTP 404 Not Found | P2 | ✅ PASSED |
| **TC-SEC-001** | Security Defense | SQL Injection: Classical Quote Injection | Course API | `GET /courses/'%20OR%20'1'='1` | HTTP 404 or 400, no raw SQL error thrown | HTTP 404, Prisma parameterized | P0 | ✅ PASSED |
| **TC-SEC-002** | Security Defense | SQL Injection: Union Select Injection | Broker API | `GET /brokers/test' UNION SELECT * FROM users--` | HTTP 404, query treated as literal string | HTTP 404, zero data leakage | P0 | ✅ PASSED |
| **TC-SEC-003** | Security Defense | SQL Injection: Tautology in Query Params | Article search | `GET /articles?search=test' OR 1=1--` | HTTP 200 with empty/matching results, no leak | HTTP 200, parameterized filter | P0 | ✅ PASSED |
| **TC-SEC-004** | Security Defense | SQL Injection: Semicolon Command Stacking | Auth API | `POST /auth/login` with email `' OR 1=1; DROP TABLE users;--` | HTTP 400 Bad Request, rejected by validator | HTTP 400 Bad Request | P0 | ✅ PASSED |
| **TC-SEC-005** | Security Defense | Stored XSS Script Payload in Registration | Public Registration | `POST /auth/register` with `<script>alert('XSS')</script>` in name | Input stored safely, escaped when rendered | Script treated as string, no exec | P0 | ✅ PASSED |
| **TC-SEC-006** | Security Defense | Reflected XSS in Query Parameters | Search endpoints | `GET /courses?search=<svg onload=alert(1)>` | HTTP 200, search string safely encoded | Escaped in HTML, zero execution | P0 | ✅ PASSED |
| **TC-SEC-007** | Security Defense | Mass Assignment: Role Escalation via Register | Public Registration | `POST /auth/register` with `{ role: 'SUPER_ADMIN' }` | Role ignored or overridden to `USER` | Role assigned: `USER` (Protected) | P0 | ✅ PASSED |
| **TC-SEC-008** | Security Defense | Mass Assignment: Role Escalation via Profile | Trader Profile | `PATCH /auth/profile` with `{ role: 'ADMIN' }` | Role field stripped by ValidationPipe whitelist | HTTP 400/Field ignored, role unchanged | P0 | ✅ PASSED |
| **TC-SEC-009** | Security Defense | IDOR: Accessing Other User's Profile | Two distinct traders | Trader A requests `GET /users/{traderB_Id}` | HTTP 403 Forbidden or restricted to public info | HTTP 403 Forbidden | P0 | ✅ PASSED |
| **TC-SEC-010** | Security Defense | IDOR: Updating Other User's Account | Two distinct traders | Trader A requests `PATCH /users/{traderB_Id}` | HTTP 403 Forbidden | HTTP 403 Forbidden | P0 | ✅ PASSED |
| **TC-SEC-011** | Security Defense | HTTP Security Headers Inspection | Backend responses | Inspect `GET /health` headers | Helmet headers present: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN` | All security headers present | P1 | ✅ PASSED |
| **TC-SEC-012** | Security Defense | Sensitive Environment / Secrets Exposure | Public Next.js bundle | Inspect client bundle for `DATABASE_URL` or `JWT_SECRET` | Zero server secrets present in client environment | Clean, zero secret exposure | P0 | ✅ PASSED |
| **TC-I18N-001** | Localization | Arabic Default Header & Document Language | Public Website | `GET /` headers and HTML | `dir="rtl"`, `lang="ar"` | `dir="rtl"`, `lang="ar"` confirmed | P1 | ✅ PASSED |
| **TC-I18N-002** | Localization | Bilingual Content in Courses Catalog | Courses API | `GET /courses` | Courses contain both Arabic & English descriptions | Bilingual fields populated | P2 | ✅ PASSED |
| **TC-I18N-003** | Localization | Bilingual Content in Broker Reviews | Brokers API | `GET /brokers` | Brokers contain Arabic & English pros/cons | Bilingual fields populated | P2 | ✅ PASSED |
| **TC-I18N-004** | Localization | English Language Toggle Parameter | Public Website | `GET /?lang=en` | Application adjusts locale dynamically | Locale switches to English | P2 | ✅ PASSED |
| **TC-DB-001** | Database Integrity | Unique Constraint on User Email | PostgreSQL `User` table | Direct attempt to insert duplicate email via service | `PrismaClientKnownRequestError` (Code P2002) | P2002 unique constraint triggered | P0 | ✅ PASSED |
| **TC-DB-002** | Database Integrity | Unique Constraint on Course Slug | PostgreSQL `Course` table | Direct attempt to insert duplicate slug | Unique constraint enforced | P2002 unique constraint triggered | P1 | ✅ PASSED |
| **TC-DB-003** | Database Integrity | Unique Constraint on Broker Slug | PostgreSQL `Broker` table | Direct attempt to insert duplicate brokerSlug | Unique constraint enforced | P2002 unique constraint triggered | P1 | ✅ PASSED |
| **TC-DB-004** | Database Integrity | Referential Integrity on Course Sections | PostgreSQL relations | Deleting course cascades or handles sections cleanly | Foreign key constraints respected | Cascade delete executed cleanly | P1 | ✅ PASSED |
| **TC-E2E-001** | End-to-End Journey | Visitor -> Registration -> Login -> Profile | Full user lifecycle | Register new user -> login -> get token -> read `/auth/me` | Successful progression across all 4 steps | All 4 steps passed seamlessly | P0 | ✅ PASSED |
| **TC-E2E-002** | End-to-End Journey | Admin -> Create Broker -> Verify Public -> Delete | Full CRUD lifecycle | Login as Admin -> Create broker -> Verify public listing -> Delete broker | Broker appears in public listing and is removed on delete | Complete lifecycle verified | P0 | ✅ PASSED |
| **TC-E2E-003** | End-to-End Journey | Admin -> Create Course -> Verify Public -> Delete | Full CRUD lifecycle | Login as Admin -> Create course -> Verify public catalog -> Delete course | Course appears in catalog and is removed on delete | Complete lifecycle verified | P0 | ✅ PASSED |
| **TC-E2E-004** | End-to-End Journey | Admin -> Create Article -> Verify Public -> Delete | Full CRUD lifecycle | Login as Admin -> Create article -> Verify public feed -> Delete article | Article appears in feed and is removed on delete | Complete lifecycle verified | P0 | ✅ PASSED |

---

## 2. Real Headless Chrome Browser & Responsive Test Cases (17 Tests)

| Test ID | Module / Page | Scenario Description | Viewport / Settings | Evaluation Assertions | Expected Result | Actual Result | Severity | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **UI-WEB-001** | Public Homepage (`/`) | Desktop Layout, Navbar, Footer, TickerBar | 1440x900 Desktop | `hasNavbar && hasFooter && dir === 'rtl'` | Page renders cleanly in RTL with title and ticker | `dir="rtl"`, `hasNavbar=true`, `hasFooter=true` | P1 | ✅ PASSED |
| **UI-WEB-002** | Public Homepage (`/`) | Language Switcher & RTL/LTR Dynamic Toggle | 1440x900 Desktop | Click language toggle button, verify `dir` changes to `ltr` | DOM switches direction dynamically from RTL to LTR | Button clicked, `dir` updated to `ltr` | P1 | ✅ PASSED |
| **UI-WEB-003** | Courses Catalog (`/courses`) | Course Cards Grid, Category Filter Pills | 1440x900 Desktop | `cardsCount > 0` | All course cards rendered with title, tier, and price | 33 course cards detected | P1 | ✅ PASSED |
| **UI-WEB-004** | Brokers Directory (`/brokers`) | Comparison Matrix & Affiliate CTA Buttons | 1440x900 Desktop | `brokerCards > 0` | Institutional broker cards with rating badges | 50 broker cards detected | P1 | ✅ PASSED |
| **UI-WEB-005** | Analyses Feed (`/analyses`) | Technical Analysis Cards & Sentiment Pills | 1440x900 Desktop | `articlesCount > 0` | Analysis cards with analyst avatars and sentiment | 35 analysis items rendered | P1 | ✅ PASSED |
| **UI-WEB-006** | Educational Blog (`/blog`) | Blog Archive & Read Time Estimates | 1440x900 Desktop | `blogCards > 0` | Articles grid with category pills and tags | 36 blog cards displayed | P1 | ✅ PASSED |
| **UI-WEB-007** | Live Streaming (`/live`) | Sovereign Broadcast Hub & Upcoming Timer | 1440x900 Desktop | `url.includes('/live') && hasContent` | Live streams page rendered with scheduled session | Live page content verified, URL `/live` | P1 | ✅ PASSED |
| **UI-WEB-008** | Trader Login (`/login`) | Form Inputs, Password Eye Toggle, Submit | 1440x900 Desktop | `hasEmail && hasPassword && hasSubmit` | Clean sign-in form with validation attributes | `hasEmail=true`, `hasPassword=true`, `hasSubmit=true` | P0 | ✅ PASSED |
| **UI-WEB-009** | Trader Register (`/register`) | 2-Step Onboarding Wizard Progression | 1440x900 Desktop | Step 1 Info -> Next Step -> Step 2 Security | Multi-step form advances smoothly with input validation | Step 1 info validated, advances to Step 2 | P0 | ✅ PASSED |
| **UI-WEB-010** | Mobile Responsive (`/`) | Mobile Viewport (iPhone SE / 13 mini) | 375x812 Mobile | `scrollWidth <= clientWidth + 5` | Zero horizontal overflow, drawer navigation | `scrollWidth=375`, `clientWidth=375`, overflow: 0 | P1 | ✅ PASSED |
| **UI-WEB-011** | Tablet Responsive (`/courses`) | Tablet Viewport (iPad) | 768x1024 Tablet | `scrollWidth <= clientWidth + 5` | Responsive 2-column grid, zero horizontal overflow | `scrollWidth=768`, `clientWidth=768`, overflow: 0 | P1 | ✅ PASSED |
| **UI-ADM-001** | Admin Login (`:3001/login`) | Sovereign Control Center Sign-In Form | 1440x900 Desktop | `hasEmail && hasPassword` | High-security login form with level-5 branding | `hasEmail=true`, `hasPassword=true` | P0 | ✅ PASSED |
| **UI-ADM-002** | Admin Auth Flow | Super Admin Authentication & Dashboard Redirect | 1440x900 Desktop | Enter credentials -> submit -> `/dashboard` | Authenticates, issues token, transitions to dashboard | Authenticated toast verified, transitions to `/dashboard` | P0 | ✅ PASSED |
| **UI-ADM-003** | Admin Users (`/dashboard/users`)| User Directory Table & Search Controls | 1440x900 Desktop | `tableRows > 0` | Table displays 14 registered users with roles | 14 user table rows rendered | P0 | ✅ PASSED |
| **UI-ADM-004** | Admin Courses (`/dashboard/courses`)| Curriculum Studio & Section Builder | 1440x900 Desktop | `coursesCount > 0` | Course management cards with tier pricing controls | 5 course curriculum cards loaded | P1 | ✅ PASSED |
| **UI-ADM-005** | Admin Brokers (`/dashboard/brokers`)| Broker Profile Manager & Rating Editor | 1440x900 Desktop | `brokersCount > 0` | Institutional broker grid cards with logo and accent | 20 broker cards rendered | P1 | ✅ PASSED |
| **UI-ADM-006** | Admin Settings (`/dashboard/settings`)| Platform Branding & Contact Toggles | 1440x900 Desktop | `inputsCount > 0` | System toggles, maintenance mode, and branding inputs | 6 settings configuration controls loaded | P1 | ✅ PASSED |
