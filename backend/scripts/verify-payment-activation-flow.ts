import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { OrdersService } from '../src/orders/orders.service';
import { PaymentsService } from '../src/payments/payments.service';
import { ActivationService } from '../src/activation/activation.service';
import { CoursesService } from '../src/courses/courses.service';
import { ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { ActivationCodeStatus, OrderStatus, CourseAccessTier, PaymentMethodType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

async function runVerification() {
  console.log('===============================================================');
  console.log('🚀 STARTING FXENGIN PAYMENT & ACTIVATION SECURITY TEST SUITE 🚀');
  console.log('===============================================================\n');

  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const prisma = app.get(PrismaService);
  const ordersService = app.get(OrdersService);
  const paymentsService = app.get(PaymentsService);
  const activationService = app.get(ActivationService);
  const coursesService = app.get(CoursesService);

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✅ [PASS] ${testName}`);
    } else {
      console.error(`  ❌ [FAIL] ${testName} - Details: ${details || 'Assertion failed'}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  const cleanupIds: { users: string[]; courses: string[]; orders: string[] } = {
    users: [],
    courses: [],
    orders: [],
  };

  try {
    // -------------------------------------------------------------------------
    // Setup Test Data
    // -------------------------------------------------------------------------
    console.log('📦 Setting up test fixtures in PostgreSQL...');
    const passwordHash = await bcrypt.hash('TestPass123!@#', 10);

    // 1. Create Admin
    const admin = await prisma.user.upsert({
      where: { email: 'e2e-admin@fxengin.local' },
      update: { role: 'SUPER_ADMIN' },
      create: {
        email: 'e2e-admin@fxengin.local',
        fullName: 'E2E Super Admin',
        passwordHash,
        role: 'SUPER_ADMIN',
      },
    });
    cleanupIds.users.push(admin.id);

    // 2. Create Student A
    const studentA = await prisma.user.upsert({
      where: { email: 'student-a-sec@fxengin.local' },
      update: { role: 'USER' },
      create: {
        email: 'student-a-sec@fxengin.local',
        fullName: 'Student Alice',
        passwordHash,
        role: 'USER',
      },
    });
    cleanupIds.users.push(studentA.id);

    // 3. Create Student B (Attacker / Unauthorized user)
    const studentB = await prisma.user.upsert({
      where: { email: 'student-b-sec@fxengin.local' },
      update: { role: 'USER' },
      create: {
        email: 'student-b-sec@fxengin.local',
        fullName: 'Student Bob',
        passwordHash,
        role: 'USER',
      },
    });
    cleanupIds.users.push(studentB.id);

    // 4. Create Paid Test Course with 1 section and 1 lesson
    const testCourseSlug = `e2e-course-${Date.now()}`;
    const testCourse = await prisma.course.create({
      data: {
        title: 'E2E High-Security Recorded Course',
        slug: testCourseSlug,
        description: 'Testing zero trust activation security',
        price: 199.99,
        isPublished: true,
        accessTier: CourseAccessTier.ONE_TIME,
        sections: {
          create: [
            {
              title: 'Section 1: Foundations',
              orderIndex: 1,
              lessons: {
                create: [
                  {
                    title: 'Secret Master Lesson',
                    orderIndex: 1,
                    durationSeconds: 600,
                    isFreePreview: false,
                    videoUrl: 'https://example.com/vault-video-123.mp4',
                  },
                ],
              },
            },
          ],
        },
      },
    });
    cleanupIds.courses.push(testCourse.id);
    console.log(`   Created course: ${testCourse.title} (Slug: ${testCourse.slug}, Price: $${testCourse.price})\n`);

    // -------------------------------------------------------------------------
    // TEST 1: Zero-Trust Access Control BEFORE Purchase
    // -------------------------------------------------------------------------
    console.log('🧪 TEST 1: Zero-Trust Classroom Gatekeeping (Pre-Purchase)');
    let blockedAsExpected = false;
    try {
      const room = await coursesService.getCourseLearnRoom(studentA.id, testCourse.slug);
      console.log('UNEXPECTED SUCCESS: Got room:', room);
    } catch (err: any) {
      console.log('Caught error in Test 1:', err?.status, err?.message, err?.constructor?.name);
      if (err instanceof ForbiddenException || err?.status === 403) {
        blockedAsExpected = true;
      }
    }
    assert(blockedAsExpected, 'Student A is strictly BLOCKED (403 Forbidden) before purchase');

    // -------------------------------------------------------------------------
    // TEST 2: Order Creation & Server-side Pricing
    // -------------------------------------------------------------------------
    console.log('\n🧪 TEST 2: Order Creation with Server-Calculated Price');
    const orderRes = await ordersService.createOrder(studentA.id, {
      productType: 'RECORDED_COURSE',
      productId: testCourse.id,
      paymentMethod: PaymentMethodType.CRYPTO_USDT_TRC20,
    });
    const order = orderRes.order;
    cleanupIds.orders.push(order.id);

    assert(order.status === 'PENDING', 'Order initialized with PENDING status');
    assert(Number(order.finalAmount) === 199.99, 'Server strictly computed original course price ($199.99)');
    assert(order.orderNumber.startsWith('FX-'), `Generated unique order tracking number: ${order.orderNumber}`);

    // -------------------------------------------------------------------------
    // TEST 3: Payment Submission & Transition to UNDER_REVIEW
    // -------------------------------------------------------------------------
    console.log('\n🧪 TEST 3: Payment Proof Submission');
    const paymentResult = await ordersService.submitPayment(order.id, studentA.id, {
      paymentMethod: PaymentMethodType.CRYPTO_USDT_TRC20,
      txId: '0xABC123DEF4567890FEDCBA',
      customerNotes: 'Sent 199.99 USDT on TRC20 network',
    });

    assert(paymentResult.order?.status === 'UNDER_REVIEW', 'Order transitioned to UNDER_REVIEW');

    // -------------------------------------------------------------------------
    // TEST 4: Student Still Blocked During UNDER_REVIEW
    // -------------------------------------------------------------------------
    console.log('\n🧪 TEST 4: Zero-Trust Check During UNDER_REVIEW');
    blockedAsExpected = false;
    try {
      await coursesService.getCourseLearnRoom(studentA.id, testCourse.slug);
    } catch (err: any) {
      if (err instanceof ForbiddenException) {
        blockedAsExpected = true;
      }
    }
    assert(blockedAsExpected, 'Student A STILL BLOCKED while payment is under review');

    // -------------------------------------------------------------------------
    // TEST 5: Admin Orders Listing
    // -------------------------------------------------------------------------
    console.log('\n🧪 TEST 5: Admin Payments Desk Retrieval');
    const pendingOrders = await paymentsService.listAdminOrders({ status: 'UNDER_REVIEW' });
    const targetOrder = pendingOrders.data.find((o: any) => o.id === order.id);
    assert(!!targetOrder, 'Admin can see submitted order on Payments Desk');
    assert(targetOrder?.user?.email === studentA.email, 'Order accurately associates buyer profile');

    // -------------------------------------------------------------------------
    // TEST 6: Admin Approves Order -> Code Generation & Cryptographic Hashing
    // -------------------------------------------------------------------------
    console.log('\n🧪 TEST 6: Admin Approval, Code Issuance & HMAC Storage');
    const approvalResult = await paymentsService.approveOrder(order.id, admin.id, {
      adminNotes: 'USDT payment verified on TRON Explorer.',
    });

    // Check order status in DB
    const freshOrder = await prisma.order.findUnique({ where: { id: order.id } });
    assert(freshOrder!.status === OrderStatus.PAID, 'Order transitioned to PAID in database');
    assert(!!approvalResult.activationCode, 'Admin response contains generated activation code');
    const rawActivationCode = approvalResult.activationCode as string;
    assert(/^FXG-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(rawActivationCode), `Code matches FXG format: ${rawActivationCode}`);

    // Verify HMAC-SHA256 Hash at rest (Plaintext code must NEVER be in database)
    const codeInDb = await prisma.activationCode.findFirst({
      where: { orderId: order.id },
    });
    assert(!!codeInDb, 'Activation code record exists in PostgreSQL');
    assert(codeInDb!.codeHash.length === 64, `Code is stored as 64-char HMAC-SHA256 hex digest: ${codeInDb!.codeHash}`);
    assert((codeInDb as any).code === undefined, 'Plaintext code field does NOT exist in schema');
    assert(codeInDb!.status === ActivationCodeStatus.UNUSED, 'Activation code initialized with status UNUSED');
    assert(codeInDb!.userId === studentA.id, 'Code strictly bound to Student A user ID');

    // -------------------------------------------------------------------------
    // TEST 7: Security Test - Invalid / Malicious Code Attempt
    // -------------------------------------------------------------------------
    console.log('\n🧪 TEST 7: Security - Malicious / Non-Existent Code Rejection');
    let rejectedInvalidCode = false;
    try {
      await activationService.activateCode(studentA.id, 'FXG-FAKE-1234-FAKE');
    } catch (err: any) {
      if (err instanceof NotFoundException || err instanceof BadRequestException) {
        rejectedInvalidCode = true;
      }
    }
    assert(rejectedInvalidCode, 'Fake activation code strictly rejected with 404/400');

    // -------------------------------------------------------------------------
    // TEST 8: Security Test - Account Hijacking / Cross-Account Code Theft
    // -------------------------------------------------------------------------
    console.log('\n🧪 TEST 8: Security - Cross-Account Theft Prevention (Student B activates Student A code)');
    let rejectedTheftAttempt = false;
    try {
      // Student B attempts to use Alice's code
      await activationService.activateCode(studentB.id, rawActivationCode);
    } catch (err: any) {
      if ((err instanceof ForbiddenException || err instanceof BadRequestException) && err.message.includes('حساب مستخدم آخر')) {
        rejectedTheftAttempt = true;
      }
    }
    assert(rejectedTheftAttempt, 'Student B BLOCKED: Code is cryptographically bound to Student A');

    // -------------------------------------------------------------------------
    // TEST 9: Legitimate Activation by Student A
    // -------------------------------------------------------------------------
    console.log('\n🧪 TEST 9: Legitimate Code Activation by Owner (Student A)');
    const activationResult = await activationService.activateCode(studentA.id, rawActivationCode);

    assert(activationResult.success === true, 'Activation succeeded for Student A');
    assert(activationResult.productType === 'RECORDED_COURSE', 'Product type confirmed as RECORDED_COURSE');
    assert(activationResult.productId === testCourse.id, 'Product ID correctly bound to test course');

    // Check PostgreSQL state post-activation
    const updatedCode = await prisma.activationCode.findUnique({
      where: { id: codeInDb!.id },
    });
    assert(updatedCode!.status === ActivationCodeStatus.ACTIVATED, 'Activation code marked as ACTIVATED in PostgreSQL');
    assert(!!updatedCode!.activatedAt, 'Activation timestamp recorded');

    // Verify Entitlement table
    const entitlement = await prisma.entitlement.findFirst({
      where: {
        userId: studentA.id,
        productId: testCourse.id,
        status: 'ACTIVE',
      },
    });
    assert(!!entitlement, 'Active Entitlement created in PostgreSQL');
    assert(entitlement!.activationCodeId === updatedCode!.id, 'Entitlement points to activation code audit trail');

    // -------------------------------------------------------------------------
    // TEST 10: Security Test - Replay Attack (Duplicate Activation Attempt)
    // -------------------------------------------------------------------------
    console.log('\n🧪 TEST 10: Security - Replay Attack Prevention (Second use of same code)');
    let rejectedReplay = false;
    try {
      await activationService.activateCode(studentA.id, rawActivationCode);
    } catch (err: any) {
      if (err instanceof BadRequestException && (err.message.includes('تم استخدام') || err.message.includes('مسبقاً'))) {
        rejectedReplay = true;
      }
    }
    assert(rejectedReplay, 'Replay attack BLOCKED: Already activated code cannot be used again');

    // -------------------------------------------------------------------------
    // TEST 11: Access Control AFTER Successful Activation
    // -------------------------------------------------------------------------
    console.log('\n🧪 TEST 11: Classroom Access Granted After Activation');
    const classroom = await coursesService.getCourseLearnRoom(studentA.id, testCourse.slug);
    assert(!!classroom && classroom.course.id === testCourse.id, 'Student A granted instant access to Classroom');
    assert(classroom.sections.length > 0, 'Curriculum & lessons unlocked for authorized student');

    // -------------------------------------------------------------------------
    // TEST 12: Admin Activation Codes Vault & Revocation
    // -------------------------------------------------------------------------
    console.log('\n🧪 TEST 12: Admin Activation Vault & Code Revocation');
    const vaultCodes = await paymentsService.listAdminActivationCodes({ search: 'student-a-sec' });
    assert(vaultCodes.data.length > 0, 'Admin can query codes in Activation Vault');

    // Revoke the code
    await paymentsService.revokeActivationCode(
      codeInDb!.id,
      admin.id,
      'Security audit revocation test'
    );
    const revokedCode = await prisma.activationCode.findUnique({ where: { id: codeInDb!.id } });
    assert(revokedCode!.status === ActivationCodeStatus.REVOKED, 'Code marked as REVOKED by Admin');

    // Verify revoked code cannot be activated
    let rejectedRevoked = false;
    try {
      await activationService.activateCode(studentA.id, rawActivationCode);
    } catch (err: any) {
      if (err instanceof ForbiddenException || err instanceof BadRequestException) {
        rejectedRevoked = true;
      }
    }
    assert(rejectedRevoked, 'Revoked code cannot be activated');

    console.log('\n===============================================================');
    console.log(`🎉 ALL ${passedTests}/${totalTests} SECURITY & FUNCTIONAL TESTS PASSED SUCCESSFULLY! 🎉`);
    console.log('===============================================================\n');
  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED WITH ERROR:', error);
    process.exitCode = 1;
  } finally {
    console.log('🧹 Cleaning up test fixtures from PostgreSQL...');
    try {
      if (cleanupIds.orders.length > 0) {
        await prisma.entitlement.deleteMany({ where: { orderId: { in: cleanupIds.orders } } });
        await prisma.activationCode.deleteMany({ where: { orderId: { in: cleanupIds.orders } } });
        await prisma.payment.deleteMany({ where: { orderId: { in: cleanupIds.orders } } });
        await prisma.order.deleteMany({ where: { id: { in: cleanupIds.orders } } });
      }
      if (cleanupIds.courses.length > 0) {
        await prisma.courseEnrollment.deleteMany({ where: { courseId: { in: cleanupIds.courses } } });
        await prisma.courseLesson.deleteMany({ where: { section: { courseId: { in: cleanupIds.courses } } } });
        await prisma.courseSection.deleteMany({ where: { courseId: { in: cleanupIds.courses } } });
        await prisma.course.deleteMany({ where: { id: { in: cleanupIds.courses } } });
      }
      if (cleanupIds.users.length > 0) {
        await prisma.courseEnrollment.deleteMany({ where: { userId: { in: cleanupIds.users } } });
        await prisma.entitlement.deleteMany({ where: { userId: { in: cleanupIds.users } } });
        await prisma.activationCode.deleteMany({ where: { userId: { in: cleanupIds.users } } });
        await prisma.user.deleteMany({ where: { id: { in: cleanupIds.users } } });
      }
      console.log('✨ Cleanup complete.');
    } catch (cleanupError) {
      console.warn('⚠️ Non-fatal cleanup warning:', cleanupError);
    }
    await app.close();
  }
}

runVerification();
