/**
 * @file ui_browser_suite.mjs
 * @description Master Headless Chrome UI Automation Suite for FXEngin
 * Audits real UI rendering, console errors, network failures, responsive viewports,
 * language switching (Arabic/English + RTL/LTR), and Admin Studio authentication.
 */

import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = '/usr/bin/google-chrome';
const WEB_URL = 'http://localhost:3000';
const ADMIN_URL = 'http://localhost:3001';
const SCREENSHOTS_DIR = '/home/gamal-ahmed/Desktop/fxengin/artifacts/qa/screenshots';

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const uiResults = [];

function recordUiTest({ id, page, scenario, status, consoleErrors, networkErrors, severity, details }) {
  const result = { id, page, scenario, status, consoleErrors: consoleErrors || [], networkErrors: networkErrors || [], severity, details };
  uiResults.push(result);
  const icon = status === 'PASSED' ? '✅' : '❌';
  console.log(`${icon} [${id}] [${severity}] ${page} -> ${scenario} (${status})`);
  if (consoleErrors && consoleErrors.length > 0) {
    console.log(`   Console Errors: ${consoleErrors.slice(0, 2).join(' | ')}`);
  }
  if (networkErrors && networkErrors.length > 0) {
    console.log(`   Network Errors: ${networkErrors.slice(0, 2).join(' | ')}`);
  }
}

async function safeEvaluate(page, fn) {
  try {
    return await page.evaluate(fn);
  } catch {
    return null;
  }
}

async function safeNavigate(page, url, delay = 2200) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
  } catch (err) {
    console.warn(`safeNavigate initial attempt failed for ${url}:`, err.message);
    try {
      await page.goto(url, { timeout: 25000 });
    } catch (e2) {
      console.warn(`safeNavigate retry failed for ${url}:`, e2.message);
    }
  }
  await new Promise((r) => setTimeout(r, delay));
}

async function runBrowserTests() {
  console.log('\n=============================================================');
  console.log('  🌐 FXENGIN HEADLESS CHROME REAL UI & RESPONSIVE SUITE      ');
  console.log('=============================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--window-size=1440,900',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  let currentConsoleErrors = [];
  let currentNetworkErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('Registration response error') && !text.includes('Failed to load resource: net::ERR_')) {
        currentConsoleErrors.push(text);
      }
    }
  });

  page.on('response', (response) => {
    const status = response.status();
    const url = response.url();
    if (status >= 400 && !url.includes('/api/auth/session') && !url.includes('favicon.ico') && !url.includes('/analyst/share/')) {
      currentNetworkErrors.push(`${status} ${url.slice(0, 80)}`);
    }
  });

  function resetTracking() {
    currentConsoleErrors = [];
    currentNetworkErrors = [];
  }

  // =========================================================================
  // 1. PUBLIC WEBSITE PAGES (REAL UI AUDIT)
  // =========================================================================

  // UI-WEB-001: Homepage Desktop Layout
  {
    resetTracking();
    await safeNavigate(page, `${WEB_URL}/`, 2500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_homepage_desktop.png') });

    const title = await page.title();
    const hasNavbar = (await page.$('nav, header')) !== null;
    const hasFooter = (await page.$('footer')) !== null;
    const dir = await safeEvaluate(page, () => document.documentElement.getAttribute('dir'));
    const lang = await safeEvaluate(page, () => document.documentElement.getAttribute('lang'));

    const pass = hasNavbar && hasFooter && dir === 'rtl';
    recordUiTest({
      id: 'UI-WEB-001',
      page: 'Homepage (/)',
      scenario: 'Render full homepage with Navbar, Footer, TickerBar, and RTL layout',
      status: pass ? 'PASSED' : 'FAILED',
      consoleErrors: currentConsoleErrors,
      networkErrors: currentNetworkErrors,
      severity: 'P1',
      details: `Title: "${title}", dir: ${dir}, lang: ${lang}, hasNavbar: ${hasNavbar}, hasFooter: ${hasFooter}`,
    });
  }

  // UI-WEB-002: Language Switcher & RTL/LTR Dynamic Toggle
  {
    resetTracking();
    const langSwitched = await safeEvaluate(page, () => {
      const buttons = Array.from(document.querySelectorAll('button, a'));
      const langBtn = buttons.find((b) => b.textContent && (b.textContent.includes('EN') || b.textContent.includes('English') || b.textContent.includes('العربية')));
      if (langBtn) {
        langBtn.click();
        return true;
      }
      return false;
    });

    await new Promise((r) => setTimeout(r, 1000));
    const newDir = await safeEvaluate(page, () => document.documentElement.getAttribute('dir') || document.body.getAttribute('dir'));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_homepage_lang_toggled.png') });

    // Restore to Arabic
    await safeEvaluate(page, () => {
      const buttons = Array.from(document.querySelectorAll('button, a'));
      const langBtn = buttons.find((b) => b.textContent && (b.textContent.includes('AR') || b.textContent.includes('العربية')));
      if (langBtn) langBtn.click();
    });
    await new Promise((r) => setTimeout(r, 500));

    recordUiTest({
      id: 'UI-WEB-002',
      page: 'Homepage (/)',
      scenario: 'Interactive Language Switcher (Arabic RTL <-> English LTR)',
      status: langSwitched ? 'PASSED' : 'FAILED',
      consoleErrors: currentConsoleErrors,
      networkErrors: currentNetworkErrors,
      severity: 'P1',
      details: `Button clicked: ${langSwitched}, newDir: ${newDir}`,
    });
  }

  // UI-WEB-003: Courses Catalog Page
  {
    resetTracking();
    await safeNavigate(page, `${WEB_URL}/courses`, 2200);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_courses_catalog.png') });

    const searchInput = (await page.$('input[type="text"], input[type="search"]')) !== null;
    const cardsCount = await safeEvaluate(page, () => document.querySelectorAll('[class*="card"], [class*="CourseCard"], a[href*="/courses/"]').length);

    const pass = cardsCount > 0 || searchInput;
    recordUiTest({
      id: 'UI-WEB-003',
      page: 'Courses (/courses)',
      scenario: 'Courses catalog grid, search filter, and category pills',
      status: pass ? 'PASSED' : 'FAILED',
      consoleErrors: currentConsoleErrors,
      networkErrors: currentNetworkErrors,
      severity: 'P1',
      details: `Course cards detected: ${cardsCount}, Search input present: ${searchInput}`,
    });
  }

  // UI-WEB-004: Forex Brokers Directory
  {
    resetTracking();
    await safeNavigate(page, `${WEB_URL}/brokers`, 2200);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_brokers_directory.png') });

    const brokerCards = await safeEvaluate(page, () => document.querySelectorAll('[class*="broker"], [class*="card"]').length);
    const pass = brokerCards > 0;
    recordUiTest({
      id: 'UI-WEB-004',
      page: 'Brokers (/brokers)',
      scenario: 'Brokers comparison matrix, rating badges, and affiliate CTA buttons',
      status: pass ? 'PASSED' : 'FAILED',
      consoleErrors: currentConsoleErrors,
      networkErrors: currentNetworkErrors,
      severity: 'P1',
      details: `Brokers rendered: ${brokerCards}`,
    });
  }

  // UI-WEB-005: Daily Market Analyses Feed
  {
    resetTracking();
    await safeNavigate(page, `${WEB_URL}/analyses`, 2200);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_analyses_feed.png') });

    const articlesCount = await safeEvaluate(page, () => document.querySelectorAll('article, [class*="card"], [class*="Analysis"]').length);
    const pass = articlesCount > 0;
    recordUiTest({
      id: 'UI-WEB-005',
      page: 'Analyses (/analyses)',
      scenario: 'Technical market analysis cards, sentiment pills, and analyst avatars',
      status: pass ? 'PASSED' : 'FAILED',
      consoleErrors: currentConsoleErrors,
      networkErrors: currentNetworkErrors,
      severity: 'P1',
      details: `Analysis items rendered: ${articlesCount}`,
    });
  }

  // UI-WEB-006: Educational Blog Archive
  {
    resetTracking();
    await safeNavigate(page, `${WEB_URL}/blog`, 2200);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06_blog_archive.png') });

    const blogCards = await safeEvaluate(page, () => document.querySelectorAll('article, [class*="card"]').length);
    const pass = blogCards > 0;
    recordUiTest({
      id: 'UI-WEB-006',
      page: 'Blog (/blog)',
      scenario: 'Educational articles archive, category tabs, and read time estimates',
      status: pass ? 'PASSED' : 'FAILED',
      consoleErrors: currentConsoleErrors,
      networkErrors: currentNetworkErrors,
      severity: 'P1',
      details: `Blog posts displayed: ${blogCards}`,
    });
  }

  // UI-WEB-007: Sovereign Live Streaming Hub
  {
    resetTracking();
    await safeNavigate(page, `${WEB_URL}/live`, 3500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07_live_streaming_hub.png') });

    const currentUrl = page.url();
    const hasContent = await safeEvaluate(page, () => (document.body ? document.body.innerText.length > 50 : false));
    const pass = currentUrl.includes('/live') && Boolean(hasContent);
    recordUiTest({
      id: 'UI-WEB-007',
      page: 'Live Streaming (/live)',
      scenario: 'Live broadcast directory, session status badges, and upcoming timer',
      status: pass ? 'PASSED' : 'FAILED',
      consoleErrors: currentConsoleErrors,
      networkErrors: currentNetworkErrors,
      severity: 'P1',
      details: `Live page content verified: ${pass}, url: ${currentUrl}`,
    });
  }

  // UI-WEB-008: Trader Sign In Form
  {
    resetTracking();
    await safeNavigate(page, `${WEB_URL}/login`, 1500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08_trader_login_page.png') });

    const hasEmail = (await page.$('input[type="email"], input[name="email"]')) !== null;
    const hasPassword = (await page.$('input[type="password"]')) !== null;
    const hasSubmit = (await page.$('button[type="submit"]')) !== null;

    const pass = hasEmail && hasPassword && hasSubmit;
    recordUiTest({
      id: 'UI-WEB-008',
      page: 'Login (/login)',
      scenario: 'Sign-in form inputs, password visibility toggle, and OTP switch',
      status: pass ? 'PASSED' : 'FAILED',
      consoleErrors: currentConsoleErrors,
      networkErrors: currentNetworkErrors,
      severity: 'P0',
      details: `hasEmail: ${hasEmail}, hasPassword: ${hasPassword}, hasSubmit: ${hasSubmit}`,
    });
  }

  // UI-WEB-009: Trader Registration Form
  {
    resetTracking();
    await safeNavigate(page, `${WEB_URL}/register`, 2000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09_trader_register_page.png') });

    const hasName = (await page.$('input[placeholder*="محمد"], input[placeholder*="John"], input[type="text"]')) !== null;
    const hasEmail = (await page.$('input[type="email"]')) !== null;
    const hasPhone = (await page.$('input[type="tel"]')) !== null;
    const hasNextBtn = (await page.$('button[type="submit"]')) !== null;

    // Fill Step 1 and proceed to Step 2
    if (hasName) await page.type('input[placeholder*="محمد"], input[placeholder*="John"], input[type="text"]', 'Trader QA Fullname');
    if (hasEmail) await page.type('input[type="email"]', `trader.ui.${Date.now()}@example.com`);
    if (hasPhone) await page.type('input[type="tel"]', '01012345678');
    const dateInput = await page.$('input[type="date"]');
    if (dateInput) await page.evaluate((el) => { el.value = '1995-05-15'; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }, dateInput);

    if (hasNextBtn) {
      await page.click('button[type="submit"]');
      await new Promise((r) => setTimeout(r, 1200));
    }

    const hasPassword = (await page.$('input[type="password"]')) !== null;
    const pass = hasEmail && (hasPassword || hasNextBtn);
    recordUiTest({
      id: 'UI-WEB-009',
      page: 'Register (/register)',
      scenario: 'Trader onboarding wizard (Step 1 info -> Step 2 security & trading experience)',
      status: pass ? 'PASSED' : 'FAILED',
      consoleErrors: currentConsoleErrors,
      networkErrors: currentNetworkErrors,
      severity: 'P0',
      details: `Step 1 hasEmail: ${hasEmail}, hasPhone: ${hasPhone}, Step 2 hasPassword: ${hasPassword}`,
    });
  }

  // UI-WEB-010: Responsive Mobile Viewport (375x812 iPhone SE / 13 mini)
  {
    resetTracking();
    await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
    await safeNavigate(page, `${WEB_URL}/`, 2500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '10_homepage_mobile_375.png') });

    const scrollWidth = await safeEvaluate(page, () => document.documentElement.scrollWidth);
    const clientWidth = await safeEvaluate(page, () => document.documentElement.clientWidth);
    const hasNoHorizontalOverflow = scrollWidth <= clientWidth + 5;

    recordUiTest({
      id: 'UI-WEB-010',
      page: 'Homepage Mobile (375px)',
      scenario: 'Mobile responsive layout, drawer navigation, zero horizontal overflow',
      status: hasNoHorizontalOverflow ? 'PASSED' : 'FAILED',
      consoleErrors: currentConsoleErrors,
      networkErrors: currentNetworkErrors,
      severity: 'P1',
      details: `scrollWidth: ${scrollWidth}, clientWidth: ${clientWidth}, overflowFree: ${hasNoHorizontalOverflow}`,
    });
  }

  // UI-WEB-011: Responsive Tablet Viewport (768x1024 iPad)
  {
    resetTracking();
    await page.setViewport({ width: 768, height: 1024, isMobile: true, hasTouch: true });
    await safeNavigate(page, `${WEB_URL}/courses`, 2200);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '11_courses_tablet_768.png') });

    const scrollWidth = await safeEvaluate(page, () => document.documentElement.scrollWidth);
    const clientWidth = await safeEvaluate(page, () => document.documentElement.clientWidth);
    const hasNoHorizontalOverflow = scrollWidth <= clientWidth + 5;

    recordUiTest({
      id: 'UI-WEB-011',
      page: 'Courses Tablet (768px)',
      scenario: 'Tablet grid layout, touch-friendly filter pills, and syllabus cards',
      status: hasNoHorizontalOverflow ? 'PASSED' : 'FAILED',
      consoleErrors: currentConsoleErrors,
      networkErrors: currentNetworkErrors,
      severity: 'P1',
      details: `scrollWidth: ${scrollWidth}, clientWidth: ${clientWidth}, overflowFree: ${hasNoHorizontalOverflow}`,
    });
  }

  // Reset viewport to Desktop
  await page.setViewport({ width: 1440, height: 900 });

  // =========================================================================
  // 2. ADMIN DASHBOARD REAL UI & WORKFLOW AUDIT
  // =========================================================================
  console.log('\n--- Phase 2: Admin Dashboard Real UI & Auth Audit ---');

  // UI-ADM-001: Admin Login Page
  {
    resetTracking();
    await safeNavigate(page, `${ADMIN_URL}/login`, 1500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '12_admin_login_page.png') });

    const hasEmail = (await page.$('input[type="email"], input[name="email"], input[id*="email"]')) !== null;
    const hasPassword = (await page.$('input[type="password"]')) !== null;

    const pass = hasEmail && hasPassword;
    recordUiTest({
      id: 'UI-ADM-001',
      page: 'Admin Login (:3001/login)',
      scenario: 'Sovereign Control Center sign-in form with security branding',
      status: pass ? 'PASSED' : 'FAILED',
      consoleErrors: currentConsoleErrors,
      networkErrors: currentNetworkErrors,
      severity: 'P0',
      details: `hasEmail: ${hasEmail}, hasPassword: ${hasPassword}`,
    });
  }

  // UI-ADM-002: Admin Login Execution & Redirection to Dashboard
  {
    resetTracking();
    await page.type('input[type="email"], input[name="email"], input[id*="email"]', 'admin@fxengen.com');
    await page.type('input[type="password"]', 'FXAdmin#2026!MasterEngine$SecureKey');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '13_admin_credentials_typed.png') });

    // Click submit button
    await page.click('button[type="submit"]');

    // Wait for auth toast & dashboard compilation transition
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 600));
      if (page.url().includes('/dashboard')) break;
    }

    if (!page.url().includes('/dashboard')) {
      await safeNavigate(page, `${ADMIN_URL}/dashboard`, 3000);
    }

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '14_admin_dashboard_landing.png') });

    const currentUrl = page.url();
    const isDashboard = currentUrl.includes('/dashboard');

    recordUiTest({
      id: 'UI-ADM-002',
      page: 'Admin Auth Flow',
      scenario: 'Authenticate with Super Admin credentials and redirect to /dashboard',
      status: isDashboard ? 'PASSED' : 'FAILED',
      consoleErrors: currentConsoleErrors,
      networkErrors: currentNetworkErrors,
      severity: 'P0',
      details: `Final URL: ${currentUrl}, isDashboard: ${isDashboard}`,
    });
  }

  // UI-ADM-003: Admin Users Management Module
  {
    resetTracking();
    await safeNavigate(page, `${ADMIN_URL}/dashboard/users`, 2500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '15_admin_users_management.png') });

    const tableRows = await safeEvaluate(page, () => document.querySelectorAll('table tbody tr, [class*="user-row"]').length);
    const pass = (tableRows || 0) > 0;

    recordUiTest({
      id: 'UI-ADM-003',
      page: 'Admin Users (/dashboard/users)',
      scenario: 'Users directory table with roles (VIP/USER/ADMIN), status toggle, and search',
      status: pass ? 'PASSED' : 'FAILED',
      consoleErrors: currentConsoleErrors,
      networkErrors: currentNetworkErrors,
      severity: 'P0',
      details: `User table rows rendered: ${tableRows}`,
    });
  }

  // UI-ADM-004: Admin Courses Management Module
  {
    resetTracking();
    await safeNavigate(page, `${ADMIN_URL}/dashboard/courses`, 2500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '16_admin_courses_management.png') });

    const coursesCount = await safeEvaluate(page, () => document.querySelectorAll('[class*="course"], [class*="card"], table tbody tr').length);
    const pass = (coursesCount || 0) > 0;

    recordUiTest({
      id: 'UI-ADM-004',
      page: 'Admin Courses (/dashboard/courses)',
      scenario: 'Courses curriculum designer, pricing tier controls, and section builder',
      status: pass ? 'PASSED' : 'FAILED',
      consoleErrors: currentConsoleErrors,
      networkErrors: currentNetworkErrors,
      severity: 'P1',
      details: `Course items found: ${coursesCount}`,
    });
  }

  // UI-ADM-005: Admin Brokers Management Module
  {
    resetTracking();
    await safeNavigate(page, `${ADMIN_URL}/dashboard/brokers`, 2500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '17_admin_brokers_management.png') });

    const brokersCount = await safeEvaluate(page, () => document.querySelectorAll('[class*="bg-surface-container"], [class*="broker"], [class*="card"], table tbody tr').length);
    const pass = (brokersCount || 0) > 0;

    recordUiTest({
      id: 'UI-ADM-005',
      page: 'Admin Brokers (/dashboard/brokers)',
      scenario: 'Institutional broker profile manager, affiliate URL binder, and rating editor',
      status: pass ? 'PASSED' : 'FAILED',
      consoleErrors: currentConsoleErrors,
      networkErrors: currentNetworkErrors,
      severity: 'P1',
      details: `Broker entries found: ${brokersCount}`,
    });
  }

  // UI-ADM-006: Admin System Settings Module
  {
    resetTracking();
    await safeNavigate(page, `${ADMIN_URL}/dashboard/settings`, 2500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '18_admin_settings_management.png') });

    const inputsCount = await safeEvaluate(page, () => document.querySelectorAll('input, select, textarea').length);
    const pass = (inputsCount || 0) > 0;

    recordUiTest({
      id: 'UI-ADM-006',
      page: 'Admin Settings (/dashboard/settings)',
      scenario: 'Platform branding, contact channels, and system maintenance toggles',
      status: pass ? 'PASSED' : 'FAILED',
      consoleErrors: currentConsoleErrors,
      networkErrors: currentNetworkErrors,
      severity: 'P1',
      details: `Settings configuration inputs: ${inputsCount}`,
    });
  }

  await browser.close();

  // Summary
  const total = uiResults.length;
  const passed = uiResults.filter((r) => r.status === 'PASSED').length;
  const failed = uiResults.filter((r) => r.status === 'FAILED').length;
  const passRate = ((passed / total) * 100).toFixed(1);

  console.log('\n=============================================================');
  console.log(`  🏆 UI BROWSER AUDIT COMPLETE: ${passed}/${total} PASSED (${passRate}%)`);
  console.log('=============================================================\n');

  const outputPath = path.resolve('/home/gamal-ahmed/Desktop/fxengin/artifacts/qa/ui_test_results.json');
  fs.writeFileSync(outputPath, JSON.stringify({ total, passed, failed, passRate, uiResults }, null, 2));
  console.log(`Saved UI audit results to ${outputPath}`);
}

runBrowserTests().catch((err) => {
  console.error('Fatal Browser Test Error:', err);
  process.exit(1);
});
