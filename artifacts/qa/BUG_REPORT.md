# FXENGIN QA Master Bug Report & Defect Tracking Dossier

> **Engineering Role:** Senior Quality Architect & Lead Automation Engineer  
> **Repository:** `ga5e8je99/fxengin`  
> **Environment:** Development & Staging (`localhost:5001`, `localhost:3000`, `localhost:3001`, PostgreSQL 16)  
> **Audit Status:** All Blockers & High Severity Defects Resolved & Verified by Regression Testing  

---

## Executive Bug Metrics Summary

| Severity Level | Total Logged | Resolved / Verified | Open (Low Risk / Cosmetic) |
| :--- | :---: | :---: | :---: |
| **P0 (Critical / Blocker)** | 1 | 1 | 0 |
| **P1 (High)** | 2 | 2 | 0 |
| **P2 (Medium)** | 1 | 1 | 0 |
| **P3 (Low / Informational)** | 2 | 0 | 2 (Seed Data & Minor Notes) |
| **Total Defect Count** | **6** | **4 Fixed & Verified** | **2 Documented** |

---

## Bug Dossier BUG-001: Broker Slug vs Internal CUID Mismatch on Update & Delete

- **BUG ID:** BUG-001  
- **Title:** Broker Update and Deletion APIs Fail with 404 When Passing `brokerSlug` Instead of Database `id`  
- **Severity:** P0 (Critical Production Blocker)  
- **Priority:** P0  
- **Area:** Backend REST Engine (`fx-backenf/src/brokers/brokers.service.ts`) & Admin Broker Management  
- **Preconditions:** A broker is created via Admin API with a custom slug (e.g., `exness-pro` or `qa-broker-123`).  
- **Steps to Reproduce:**
  1. Create a broker via `POST /admin/brokers` with payload `{"name": "Broker Test", "brokerSlug": "broker-test-123"}`.
  2. Public API and Admin API list this broker with its primary identifier mapped to `brokerSlug`.
  3. Attempt to update or delete the broker via `DELETE /admin/brokers/broker-test-123` or `PUT /admin/brokers/broker-test-123`.
- **Expected Result:** The backend should identify the broker whether the caller supplies the internal CUID (`cmub...`) or the public `brokerSlug`, updating or removing the record cleanly.  
- **Actual Result:** HTTP 404 Not Found error: `"Broker with ID broker-test-123 not found"`. Admin users were unable to delete or edit brokers created via the UI.  
- **Root Cause Analysis:**  
  In `fx-backenf/src/brokers/brokers.service.ts`, `formatBroker` mapped `id: b.brokerSlug || b.id`. Consequently, the frontend admin interface used the slug as the resource key. However, the `remove` and `update` methods in the service executed:
  ```typescript
  const broker = await this.prisma.broker.findUnique({
    where: { id },
  });
  ```
  Since `id` is a CUID primary key in PostgreSQL, passing a slug like `xm-global` never matched `where: { id }`.
- **Code Fix Applied:**  
  Updated `remove` and `update` in `fx-backenf/src/brokers/brokers.service.ts` to locate the record using an `OR` condition supporting both `id` and `brokerSlug`:
  ```typescript
  const broker = await this.prisma.broker.findFirst({
    where: {
      OR: [
        { id: idOrSlug },
        { brokerSlug: idOrSlug }
      ]
    }
  });
  ```
- **Regression Verification:**  
  - Tested via automated test `TC-CRUD-012` (Broker Update by Slug) -> **PASSED (HTTP 200)**.
  - Tested via automated test `TC-CRUD-013` (Broker Deletion by Slug) -> **PASSED (HTTP 200)**.
  - Retested via Browser UI `UI-ADM-005` -> **PASSED**.
- **Status:** ✅ **CLOSED / VERIFIED FIXED**

---

## Bug Dossier BUG-002: Broken Font Asset Path Triggers 404 on Every Page

- **BUG ID:** BUG-002  
- **Title:** Missing Font File `Inter-VariableFont_slnt-wght.ttf` Causes Console 404 Errors on Every Public Page  
- **Severity:** P1 (High Quality Issue)  
- **Priority:** P1  
- **Area:** Public Website Styling & Assets (`fx-engin/app/globals.css`)  
- **Preconditions:** Start `fx-engin` and navigate to any page (e.g., `/`, `/courses`, `/brokers`).  
- **Steps to Reproduce:**
  1. Open Chrome DevTools Network Tab.
  2. Navigate to `http://localhost:3000/`.
  3. Observe network request for `Inter-VariableFont_slnt-wght.ttf`.
- **Expected Result:** All declared font assets in `@font-face` resolve with HTTP 200 OK.  
- **Actual Result:** Network request returns HTTP 404 Not Found, logging console errors and causing fallback font flash.  
- **Root Cause Analysis:**  
  In `fx-engin/app/globals.css`, the `@font-face` definition declared:
  ```css
  @font-face {
    font-family: 'Inter';
    src: url('/assets/fonts/en/Inter-VariableFont_slnt-wght.ttf') format('truetype');
  }
  ```
  Inspection of the physical filesystem in `fx-engin/public/assets/fonts/en/` revealed that the actual filename is `Inter-VariableFont_opsz,wght.ttf`.
- **Code Fix Applied:**  
  Corrected the font path in `fx-engin/app/globals.css`:
  ```css
  @font-face {
    font-family: 'Inter';
    src: url('/assets/fonts/en/Inter-VariableFont_opsz,wght.ttf') format('truetype');
  }
  ```
- **Regression Verification:**  
  - Verified via `curl -I http://localhost:3000/assets/fonts/en/Inter-VariableFont_opsz,wght.ttf` -> **HTTP 200 OK**.
  - Verified across all 11 public pages in Headless Chrome: zero font-related 404s.
- **Status:** ✅ **CLOSED / VERIFIED FIXED**

---

## Bug Dossier BUG-003: Strict NestJS ValidationPipe Whitelist Rejection

- **BUG ID:** BUG-003  
- **Title:** Unwhitelisted Fields in Payloads (e.g., `isPublished`, top-level `minDeposit`) Fail with 400 Bad Request  
- **Severity:** P1 (High Integration Risk)  
- **Priority:** P1  
- **Area:** Core Backend NestJS DTOs & ValidationPipe (`fx-backenf/src/main.ts`)  
- **Preconditions:** Client submits payload to `/admin/articles` or `/admin/brokers`.  
- **Steps to Reproduce:**
  1. Send `POST /admin/articles` with `{ "title": "Test", "isPublished": true }`.
  2. Send `POST /admin/brokers` with `{ "name": "Test", "minDeposit": 100 }`.
- **Expected Result:** Clear handling or graceful conversion of legacy fields.  
- **Actual Result:** HTTP 400 Bad Request: `["property isPublished should not exist"]`, `["property minDeposit should not exist"]`.  
- **Root Cause Analysis:**  
  `main.ts` configures NestJS `ValidationPipe` with `whitelist: true, forbidNonWhitelisted: true`. The backend schema specifies `status: 'PUBLISHED' | 'DRAFT'` rather than boolean `isPublished`, and broker specifications must reside within the nested `specsData` JSON object.  
- **Resolution / Alignment:**  
  1. Documented strict schema contracts in `PROJECT_TEST_MAP.md`.
  2. Aligned all QA test payloads and frontend service calls in `qa_comprehensive_suite.mjs` and `fx-engin/app/services`.
  3. Validated that `forbidNonWhitelisted` is a critical security defense against Mass Assignment and parameter pollution.
- **Regression Verification:**  
  - Tested via `TC-CRUD-001`, `TC-CRUD-008`, `TC-CRUD-015` -> **All PASSED (HTTP 201)**.
- **Status:** ✅ **CLOSED / RESOLVED**

---

## Bug Dossier BUG-004: Multi-Step Trader Registration Client Wizard Flow

- **BUG ID:** BUG-004  
- **Title:** Public Registration Screen Multi-Step Progression Separation  
- **Severity:** P2 (Medium User Experience)  
- **Priority:** P2  
- **Area:** Public Website Frontend (`fx-engin/app/register/page.js`)  
- **Preconditions:** User navigates to `http://localhost:3000/register`.  
- **Steps to Reproduce:**
  1. On initial load, only Step 1 fields (Full Name, Email, Phone Number, Date of Birth) are mounted in the DOM.
  2. Password input is unmounted until Step 1 inputs pass local validation and user submits Step 1.
- **Expected Result:** Automated tests and users must complete Step 1 with valid formats before accessing Step 2 password controls.  
- **Actual Result:** Standard single-step automation scripts failed to locate the password field immediately on mount.  
- **Resolution / Fix:**  
  Updated test suite automation (`ui_browser_suite.mjs`) to simulate real human behavior: fill valid full name, email, phone number, date of birth, submit Step 1, and then verify password strength and trading experience on Step 2.
- **Regression Verification:**  
  - Verified via `UI-WEB-009` in Headless Chrome -> **PASSED**.
- **Status:** ✅ **CLOSED / RESOLVED**

---

## Observations & Informational Notes

### OBS-001: Global Splash PageLoader Animation Dismissal Timing
- **Observation:** `fx-engin` implements an ultra-smooth brand splash loader on initial application mount. The loader runs a 1200ms animation with an 1800ms safety timeout before fading out (`exit={{ opacity: 0 }}`).
- **Impact:** Automated browser tests must allow at least 2200ms after DOMContentLoaded before asserting on interactive hero elements to ensure the splash backdrop has completely unmounted.
- **Action Taken:** Handled in test harness (`safeNavigate` with configurable delay); production behavior is silky smooth and deliberate.

### OBS-002: Seed Data External Avatar URLs
- **Observation:** In `/analyses` and `/blog`, several seeded mock articles reference placeholder image URLs from external stock providers that returned 404.
- **Impact:** The UI renders fallback initials and gradient avatars gracefully without breaking page layout.
- **Recommendation:** Production deployment should populate real S3/GCS uploaded analyst headshots via the Sovereign Admin Media Manager.
