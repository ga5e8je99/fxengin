import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export type OtpPurpose = 'LOGIN' | 'REGISTER' | 'RESET_PASSWORD';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly senderEmail: string;
  private readonly frontendUrl: string;

  constructor() {
    this.senderEmail = process.env.GMAIL_USER || 'ga138989@gmail.com';
    this.frontendUrl = process.env.PROD_FRONTEND_URL || process.env.FRONTEND_URL || 'https://fxengen.com';
    this.initTransporter();
  }

  private initTransporter() {
    // 1. Check for standard generic SMTP configuration first
    const smtpHost = process.env.SMTP_HOST?.trim();
    const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465;
    const smtpUser = process.env.SMTP_USER?.trim();
    const smtpPass = (process.env.SMTP_PASS || process.env.SMTP_PASSWORD)?.trim();
    const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;

    // 2. Fallback to Gmail SMTP
    const gmailUser = (process.env.GMAIL_USER || this.senderEmail)?.trim();
    const gmailAppPassword = (process.env.GMAIL_APP_PASSWORD || '').trim().replace(/\s+/g, '');

    if (smtpHost && smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
      this.logger.log(`📧 Custom SMTP Transporter initialized successfully for: ${smtpHost}:${smtpPort} (${smtpUser})`);
    } else if (gmailAppPassword) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: gmailUser,
          pass: gmailAppPassword,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
      this.logger.log(`📧 Gmail SMTP Transporter initialized for: ${gmailUser}`);
    } else {
      this.logger.warn(
        `⚠️ No valid SMTP password set (GMAIL_APP_PASSWORD or SMTP_PASS). Outgoing emails will be simulated in server terminal for ${this.senderEmail}`,
      );
      return;
    }

    // Verify SMTP connection on startup so errors are detected immediately
    this.transporter.verify((err) => {
      if (err) {
        this.logger.error(`❌ SMTP Verification Failed: ${err.message}`);
        this.logger.warn(
          `💡 Tip: If using Gmail, verify that 2-Step Verification is ON and generate a new 16-character App Password at https://myaccount.google.com/apppasswords`,
        );
      } else {
        this.logger.log(`✅ SMTP Connection Verified! Server is ready to dispatch emails directly to Inbox.`);
      }
    });
  }

  /**
   * Universal mail dispatcher with anti-spam transactional headers and fallback to terminal logging.
   */
  async sendMail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<boolean> {
    const fromName = process.env.SMTP_FROM_NAME || 'FXENGIN';
    const fromEmail = process.env.SMTP_FROM || this.senderEmail;
    const fromHeader = `"${fromName}" <${fromEmail}>`;
    const replyTo = process.env.SMTP_REPLY_TO || fromEmail;

    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: fromHeader,
          to: options.to,
          replyTo: replyTo,
          subject: options.subject,
          text: options.text || options.subject,
          html: options.html,
        });
        this.logger.log(`✅ Email sent successfully to ${options.to} (MessageId: ${info.messageId})`);
        return true;
      } catch (err: any) {
        this.logger.error(`❌ Failed to send email via SMTP: ${err.message}`, err.stack);
        this.logEmailToConsole(options);
        return false;
      }
    } else {
      this.logEmailToConsole(options);
      return true;
    }
  }

  private logEmailToConsole(options: { to: string; subject: string; html: string; text?: string }) {
    console.log('\n' + '═'.repeat(70));
    console.log(`📨 [SIMULATED EMAIL DISPATCH] From: ${this.senderEmail} -> To: ${options.to}`);
    console.log(`📌 Subject: ${options.subject}`);
    console.log(`ℹ️ Text Preview: ${options.text || options.subject}`);
    console.log('═'.repeat(70) + '\n');
  }

  /**
   * 1. Send OTP Verification Email (Anti-Spam Optimized)
   */
  async sendOtpEmail(toEmail: string, otpCode: string, purpose: OtpPurpose): Promise<boolean> {
    const isRegister = purpose === 'REGISTER';
    const isReset = purpose === 'RESET_PASSWORD';

    let titleAr = 'كود التحقق لتسجيل الدخول';
    let subtitleAr = 'تم طلب تسجيل الدخول إلى حسابك في منصة FXENGIN. استخدم الكود التالي لتأكيد هويتك والمتابعة.';
    let btnTextAr = 'تفعيل الكود والدخول بنقرة واحدة';
    let verifyUrl = `${this.frontendUrl}/login?email=${encodeURIComponent(toEmail)}&otp=${otpCode}`;
    let subject = `كود التحقق لتسجيل الدخول (${otpCode}) - FXENGIN`;

    if (isRegister) {
      titleAr = 'كود تفعيل حسابك الجديد';
      subtitleAr = 'شكراً لانضمامك إلى مجتمع متداولي FXENGIN. استخدم الكود التالي لتأكيد بريدك الإلكتروني وتفعيل حسابك.';
      btnTextAr = 'تفعيل الحساب والمتابعة';
      verifyUrl = `${this.frontendUrl}/register?email=${encodeURIComponent(toEmail)}&otp=${otpCode}`;
      subject = `كود تفعيل حسابك في FXENGIN (${otpCode})`;
    } else if (isReset) {
      titleAr = 'كود استعادة كلمة المرور';
      subtitleAr = 'تم استلام طلب لإعادة تعيين كلمة المرور لحسابك في منصة FXENGIN. استخدم الكود التالي لإكمال تعيين كلمة المرور الجديدة.';
      btnTextAr = 'الانتقال لتعيين كلمة المرور';
      verifyUrl = `${this.frontendUrl}/forgot-password?email=${encodeURIComponent(toEmail)}&otp=${otpCode}`;
      subject = `كود استعادة كلمة المرور (${otpCode}) - FXENGIN`;
    }

    const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titleAr}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #01040d; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E2E8F0; direction: rtl; text-align: right;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #01040d; width: 100%; margin: 0; padding: 40px 10px;">
    <tr>
      <td align="center">
        <!-- Main Brand Card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 580px; background: linear-gradient(180deg, #071026 0%, #030816 100%); border: 1px solid rgba(4, 136, 248, 0.4); border-radius: 18px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.85);">
          
          <!-- Header with Logo and Brand Identity -->
          <tr>
            <td align="center" style="background: linear-gradient(180deg, #0b1736 0%, #060e22 100%); padding: 34px 20px 26px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
              <img src="https://fxengen.com/assets/Images/Logo/logo.png" width="60" height="60" alt="FXENGIN Logo" style="display: block; margin: 0 auto 12px auto; border-radius: 12px;" />
              <div style="font-size: 26px; font-weight: 900; letter-spacing: 2px; color: #FFFFFF; margin: 0 0 2px 0;">
                FX<span style="color: #FB8704;">ENGIN</span>
              </div>
              <div style="font-size: 11px; font-weight: 700; color: #94A3B8; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 14px;">
                FOREX ENGINEER • مهندس الفوركس
              </div>
              <div style="display: inline-block; background-color: rgba(251, 135, 4, 0.14); border: 1px solid #FB8704; color: #FB8704; padding: 4px 16px; border-radius: 20px; font-size: 11px; font-weight: 800;">
                🛡️ نظام التحقق الآمن • SECURITY OTP
              </div>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 38px 30px; text-align: center;">
              <h2 style="font-size: 22px; font-weight: 800; color: #FFFFFF; margin: 0 0 12px 0; line-height: 1.3;">
                ${titleAr}
              </h2>
              <p style="font-size: 14.5px; color: #94A3B8; line-height: 1.65; margin: 0 auto 28px auto; max-width: 460px;">
                ${subtitleAr}
              </p>
              
              <!-- OTP Box with Cyan Glowing Border -->
              <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto 20px auto;">
                <tr>
                  <td align="center" style="background: rgba(4, 136, 248, 0.08); border: 2px dashed #0488F8; border-radius: 14px; padding: 18px 40px;">
                    <div style="font-size: 11px; font-weight: 700; color: #38BDF8; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px;">رمز التحقق الخاص بك</div>
                    <span style="font-family: 'Consolas', 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #38BDF8; display: inline-block;">
                      ${otpCode}
                    </span>
                  </td>
                </tr>
              </table>

              <p style="font-size: 12.5px; color: #64748B; margin: 0 0 28px 0;">
                💡 انسخ الرمز أعلاه والصقه مباشرة في صفحة التحقق لتأكيد طلبك.
              </p>

              <!-- High-Converting Branded Gradient Action Button -->
              <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto 30px auto;">
                <tr>
                  <td align="center" style="border-radius: 10px; background: linear-gradient(135deg, #FB8704 0%, #EA580C 100%);">
                    <a href="${verifyUrl}" target="_blank" style="display: inline-block; padding: 15px 36px; font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 15px; font-weight: 800; color: #FFFFFF !important; text-decoration: none; border-radius: 10px; background: linear-gradient(135deg, #FB8704 0%, #EA580C 100%);">
                      ${btnTextAr}
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Expiry Alert -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color: rgba(251, 135, 4, 0.08); border: 1px solid rgba(251, 135, 4, 0.3); border-radius: 10px; padding: 14px 18px; font-size: 12.5px; color: #FB8704; line-height: 1.6; text-align: right;">
                    ⏳ <strong>تنبيه الأمان:</strong> هذا الرمز صالح لمدة <strong>10 دقائق فقط</strong> للاستخدام لمرة واحدة. لا تشارك هذا الرمز مع أي شخص لحماية حسابك ومعلوماتك المالية.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #020612; padding: 24px 20px; border-top: 1px solid rgba(255, 255, 255, 0.06); font-size: 12px; color: #64748B; line-height: 1.7;">
              <p style="margin: 0 0 8px 0; color: #94A3B8;">
                <a href="https://fxengen.com" target="_blank" style="color: #0488F8; text-decoration: none; margin: 0 8px; font-weight: 700;">الرئيسية</a> •
                <a href="https://fxengen.com/courses" target="_blank" style="color: #0488F8; text-decoration: none; margin: 0 8px; font-weight: 700;">التدريب</a> •
                <a href="https://fxengen.com/open-account" target="_blank" style="color: #0488F8; text-decoration: none; margin: 0 8px; font-weight: 700;">شركاء الوساطة</a> •
                <a href="https://fxengen.com/live" target="_blank" style="color: #0488F8; text-decoration: none; margin: 0 8px; font-weight: 700;">البث المباشر</a>
              </p>
              <p style="margin: 0 0 4px 0;">© ${new Date().getFullYear()} FXENGIN Financial Technologies. جميع الحقوق محفوظة.</p>
              <p style="margin: 0; font-size: 11px;">هذه رسالة أمنية مشفرة تم إرسالها تلقائياً لتأكيد العمليات على حسابك. يرجى عدم الرد على هذا البريد.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const text = `
${titleAr} - منصة FXENGIN
==================================================
عزيزنا المشترك،

${subtitleAr}

رمز التحقق (OTP) الخاص بك هو:
>>> ${otpCode} <<<

- صلاحية الكود: 10 دقائق فقط للاستخدام لمرة واحدة.
- رابط التفعيل السريع: ${verifyUrl}

إذا لم تكن أنت من طلب هذا الرمز، يرجى تجاهل هذه الرسالة فوراً.

مع تحيات،
فريق أمان FXENGIN Financial Technologies
https://fxengen.com
`.trim();

    return this.sendMail({
      to: toEmail,
      subject,
      text,
      html,
    });
  }

  /**
   * 2. Send Subscription Confirmation Email
   */
  async sendSubscriptionEmail(
    toEmail: string,
    userName: string,
    planName: string,
    amount: string,
    expiryDate?: string,
  ): Promise<boolean> {
    const dashboardUrl = `${this.frontendUrl}/analyses`;

    const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <title>تأكيد اشتراكك في باقة ${planName}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #00030a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #E6EDF3; direction: rtl; }
    .email-container { max-width: 600px; margin: 30px auto; background: #070d1e; border: 1px solid rgba(251, 135, 4, 0.3); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 3, 13, 0.8); }
    .header { background: linear-gradient(180deg, #130f04 0%, #070d1e 100%); padding: 36px 24px 24px; text-align: center; border-bottom: 1px solid rgba(251, 135, 4, 0.2); }
    .brand-title { font-size: 26px; font-weight: 900; letter-spacing: 2px; color: #FFFFFF; margin: 12px 0 4px; }
    .brand-title span { color: #FB8704; }
    .badge { display: inline-block; background: rgba(251, 135, 4, 0.15); border: 1px solid #FB8704; color: #FB8704; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; }
    .content { padding: 36px 28px; }
    .headline { font-size: 22px; font-weight: 800; color: #FFFFFF; margin-bottom: 12px; text-align: center; }
    .card { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 20px; margin: 24px 0; }
    .card-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 14px; }
    .card-row:last-child { border-bottom: none; }
    .label { color: #8B949E; }
    .value { font-weight: 700; color: #FFFFFF; }
    .btn-action { display: block; text-align: center; background: linear-gradient(135deg, #FB8704 0%, #FA5A04 100%); color: #FFFFFF !important; text-decoration: none; font-size: 15px; font-weight: 800; padding: 14px 34px; border-radius: 10px; margin-top: 24px; box-shadow: 0 8px 24px rgba(251, 135, 4, 0.4); }
    .footer { background: #040814; padding: 24px; text-align: center; font-size: 12px; color: #5B6575; border-top: 1px solid rgba(255, 255, 255, 0.05); }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <span class="badge">تأكيد الاشتراك الرسمي • VIP ACCESS</span>
      <div class="brand-title">FX<span>ENGIN</span></div>
    </div>
    <div class="content">
      <div class="headline">مرحباً بك يا ${userName || 'متداولنا العزيز'}! تم تفعيل اشتراكك بنجاح 🚀</div>
      <p style="color: #8B949E; text-align: center; line-height: 1.6;">يسرنا انضمامك إلى النخبة في باقة <strong>${planName}</strong>. يمكنك الآن الوصول المباشر لشارتات MT5 اللحظية وإحداثيات الدخول والأهداف الذكية.</p>
      
      <div class="card">
        <div class="card-row">
          <span class="label">اسم الباقة:</span>
          <span class="value">${planName}</span>
        </div>
        <div class="card-row">
          <span class="label">حالة الاشتراك:</span>
          <span class="value" style="color: #16C784;">نشط ومفعل (Active)</span>
        </div>
        <div class="card-row">
          <span class="label">القيمة المدفوعة:</span>
          <span class="value">${amount}</span>
        </div>
        ${expiryDate ? `
        <div class="card-row">
          <span class="label">تاريخ التجديد القادم:</span>
          <span class="value">${expiryDate}</span>
        </div>` : ''}
      </div>

      <a href="${dashboardUrl}" class="btn-action">
        📊 الانتقال إلى لوحة التحليلات والإشارات الآن
      </a>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} FXENGIN Financial Technologies. جميع الحقوق محفوظة.</p>
    </div>
  </div>
</body>
</html>
    `;

    return this.sendMail({
      to: toEmail,
      subject: `تأكيد تفعيل اشتراكك في باقة ${planName} - FXENGIN`,
      text: `مرحباً ${userName}، تم تفعيل اشتراكك في باقة ${planName} بنجاح بقيمة ${amount}. تفضل بزيارة: ${dashboardUrl}`,
      html,
    });
  }

  /**
   * 3. Send Course Enrollment Email
   */
  async sendCourseEnrollmentEmail(
    toEmail: string,
    userName: string,
    courseTitle: string,
    isFree: boolean,
    courseSlug?: string,
  ): Promise<boolean> {
    const courseUrl = `${this.frontendUrl}/courses/${courseSlug || ''}/learn`;

    const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <title>تم تسجيلك في دورة: ${courseTitle}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #00030a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #E6EDF3; direction: rtl; }
    .email-container { max-width: 600px; margin: 30px auto; background: #070d1e; border: 1px solid rgba(4, 136, 248, 0.3); border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(180deg, #091a38 0%, #070d1e 100%); padding: 36px 24px 24px; text-align: center; border-bottom: 1px solid rgba(4, 136, 248, 0.2); }
    .brand-title { font-size: 26px; font-weight: 900; letter-spacing: 2px; color: #FFFFFF; margin: 12px 0 4px; }
    .brand-title span { color: #FB8704; }
    .badge { display: inline-block; background: rgba(4, 136, 248, 0.15); border: 1px solid #0488F8; color: #0488F8; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; }
    .content { padding: 36px 28px; text-align: center; }
    .headline { font-size: 22px; font-weight: 800; color: #FFFFFF; margin-bottom: 12px; }
    .btn-action { display: inline-block; background: linear-gradient(135deg, #0488F8 0%, #0458EC 100%); color: #FFFFFF !important; text-decoration: none; font-size: 15px; font-weight: 800; padding: 14px 34px; border-radius: 10px; margin-top: 24px; box-shadow: 0 8px 24px rgba(4, 136, 248, 0.4); }
    .footer { background: #040814; padding: 24px; text-align: center; font-size: 12px; color: #5B6575; border-top: 1px solid rgba(255, 255, 255, 0.05); }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <span class="badge">أكاديمية التداول • FXENGIN ACADEMY</span>
      <div class="brand-title">FX<span>ENGIN</span></div>
    </div>
    <div class="content">
      <div class="headline">مرحباً ${userName || 'المتداول'}! تم تأكيد تسجيلك في الدورة 🎓</div>
      <p style="color: #8B949E; line-height: 1.6; font-size: 15px;">
        أنت الآن مسجل رسمي في دورة: <strong style="color: #FFFFFF;">${courseTitle}</strong>.
        ${isFree ? 'تم منحك الوصول الكامل للمحتوى مجاناً.' : 'تم تأكيد عملية الشراء وتفعيل كافة الدروس وملفات التدريب.'}
      </p>
      
      <a href="${courseUrl}" class="btn-action">
        🎓 دخول قاعة المحاضرات والبدء الآن
      </a>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} FXENGIN Financial Technologies. جميع الحقوق محفوظة.</p>
    </div>
  </div>
</body>
</html>
    `;

    return this.sendMail({
      to: toEmail,
      subject: `تأكيد تسجيلك في دورة: ${courseTitle} - FXENGIN`,
      text: `مرحباً ${userName}، تم تسجيلك في دورة ${courseTitle}. ادخل إلى قاعة المحاضرات عبر: ${courseUrl}`,
      html,
    });
  }

  /**
   * 4. Send Live Webinar Booking Email
   */
  async sendWebinarConfirmationEmail(
    toEmail: string,
    userName: string,
    sessionTitle: string,
    startTime: string,
    accessCode?: string,
    sessionSlug?: string,
  ): Promise<boolean> {
    const roomUrl = `${this.frontendUrl}/live/${sessionSlug || ''}`;

    const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <title>تأكيد حجز مقعدك في الويبنار المباشر</title>
  <style>
    body { margin: 0; padding: 0; background-color: #00030a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #E6EDF3; direction: rtl; }
    .email-container { max-width: 600px; margin: 30px auto; background: #070d1e; border: 1px solid rgba(246, 70, 93, 0.3); border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(180deg, #2b0b12 0%, #070d1e 100%); padding: 36px 24px 24px; text-align: center; border-bottom: 1px solid rgba(246, 70, 93, 0.2); }
    .brand-title { font-size: 26px; font-weight: 900; letter-spacing: 2px; color: #FFFFFF; margin: 12px 0 4px; }
    .brand-title span { color: #FB8704; }
    .badge { display: inline-block; background: rgba(246, 70, 93, 0.15); border: 1px solid #F6465D; color: #F6465D; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; }
    .content { padding: 36px 28px; text-align: center; }
    .headline { font-size: 22px; font-weight: 800; color: #FFFFFF; margin-bottom: 12px; }
    .ticket-box { background: rgba(255, 255, 255, 0.03); border: 1px dashed rgba(246, 70, 93, 0.4); border-radius: 12px; padding: 18px; margin: 24px 0; }
    .btn-action { display: inline-block; background: linear-gradient(135deg, #F6465D 0%, #E02842 100%); color: #FFFFFF !important; text-decoration: none; font-size: 15px; font-weight: 800; padding: 14px 34px; border-radius: 10px; margin-top: 16px; box-shadow: 0 8px 24px rgba(246, 70, 93, 0.4); }
    .footer { background: #040814; padding: 24px; text-align: center; font-size: 12px; color: #5B6575; border-top: 1px solid rgba(255, 255, 255, 0.05); }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <span class="badge">بث حي وتدريب مباشر • LIVE MASTERCLASS</span>
      <div class="brand-title">FX<span>ENGIN</span></div>
    </div>
    <div class="content">
      <div class="headline">تم حجز مقعدك بنجاح في الجلسة المباشرة 🔴</div>
      <p style="color: #8B949E; line-height: 1.6;">
        عزيزنا ${userName || 'المتداول'}، يسعدنا تأكيد حجز مقعدك في الويبنار المباشر:
        <br><strong style="color: #FFFFFF; font-size: 16px;">${sessionTitle}</strong>
      </p>
      
      <div class="ticket-box">
        <div style="font-size: 13px; color: #8B949E; margin-bottom: 6px;">موعد انطلاق البث:</div>
        <div style="font-size: 16px; font-weight: 700; color: #16C784;">${startTime}</div>
        ${accessCode ? `
        <div style="margin-top: 14px; font-size: 13px; color: #8B949E;">كود تذكرة الدخول الخاصة بك:</div>
        <div style="font-size: 20px; font-weight: 900; color: #FB8704; letter-spacing: 2px; font-family: monospace;">${accessCode}</div>` : ''}
      </div>

      <a href="${roomUrl}" class="btn-action">
        🔴 فتح قاعة البث المباشر
      </a>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} FXENGIN Financial Technologies. جميع الحقوق محفوظة.</p>
    </div>
  </div>
</body>
</html>
    `;

    return this.sendMail({
      to: toEmail,
      subject: `تأكيد حجز مقعدك في الويبنار المباشر: ${sessionTitle} - FXENGIN`,
      text: `مرحباً ${userName}، تم حجز مقعدك في الويبنار: ${sessionTitle} في موعد ${startTime}. رابط القاعة: ${roomUrl}`,
      html,
    });
  }

  /**
   * 5. Send Activation Code Email after Payment Approval
   */
  async sendActivationCodeEmail(
    toEmail: string,
    userName: string,
    productTitle: string,
    activationCode: string,
    productType: string,
  ): Promise<boolean> {
    const activateUrl = `${this.frontendUrl}/activate`;
    const typeLabel =
      productType === 'RECORDED_COURSE'
        ? 'دورة تدريبية مسجلة'
        : productType === 'LIVE_COURSE'
        ? 'جلسة بث وتدريب مباشر'
        : 'اشتراك مجتمع وقنوات VIP';

    const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>كود تفعيل اشتراكك: ${productTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #020713; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E2E8F0; direction: rtl; text-align: right;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #020713; width: 100%; margin: 0; padding: 30px 10px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 580px; background-color: #070e22; border: 1px solid rgba(251, 135, 4, 0.4); border-radius: 16px; overflow: hidden; box-shadow: 0 15px 40px rgba(0, 0, 0, 0.7);">
          <!-- Header -->
          <tr>
            <td align="center" style="background: linear-gradient(180deg, #1f1105 0%, #070e22 100%); padding: 32px 20px 24px; border-bottom: 1px solid rgba(251, 135, 4, 0.25);">
              <div style="font-size: 26px; font-weight: 900; letter-spacing: 2px; color: #FFFFFF; margin-bottom: 6px;">
                FX<span style="color: #FB8704;">ENGIN</span>
              </div>
              <div style="display: inline-block; background-color: rgba(251, 135, 4, 0.15); border: 1px solid #FB8704; color: #FB8704; padding: 4px 16px; border-radius: 20px; font-size: 11px; font-weight: 700;">
                تم تأكيد السداد وإصدار كود التفعيل • PAYMENT APPROVED
              </div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 36px 28px; text-align: center;">
              <h2 style="font-size: 20px; font-weight: 800; color: #FFFFFF; margin: 0 0 12px 0;">تهانينا ${userName || 'المتداول'}! تم تأكيد طلبك بنجاح</h2>
              <p style="font-size: 14.5px; color: #94A3B8; line-height: 1.6; margin: 0 0 24px 0;">
                تمت مراجعة واعتماد إيصال السداد الخاص بك للمنتج:
                <br><strong style="color: #FFFFFF; font-size: 16px;">${productTitle}</strong> (${typeLabel})
              </p>
              
              <!-- Code Box -->
              <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto 24px auto;">
                <tr>
                  <td align="center" style="background-color: rgba(251, 135, 4, 0.08); border: 2px dashed #FB8704; border-radius: 12px; padding: 18px 36px;">
                    <div style="font-size: 12px; color: #A7AFBF; margin-bottom: 6px; font-weight: 600;">كود التفعيل الخاص بحسابك (Activation Code):</div>
                    <span style="font-family: 'Courier New', Courier, monospace; font-size: 28px; font-weight: 900; letter-spacing: 4px; color: #FFFFFF; display: inline-block;">
                      ${activationCode}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Steps -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 16px 20px; font-size: 13.5px; line-height: 1.8; color: #8B949E; text-align: right;">
                    <strong style="color: #FFFFFF; display: block; margin-bottom: 6px;">📋 خطوات تفعيل المحتوى:</strong>
                    <ol style="margin: 0; padding-right: 20px;">
                      <li>انسخ كود التفعيل الموضح أعلاه.</li>
                      <li>اضغط على زر "تفعيل الكود الآن" بالأسفل للانتقال لصفحة التفعيل الرسمية.</li>
                      <li>الصق الكود واضغط "تفعيل" لفك القفل التلقائي وبدء التعلم فوراً.</li>
                    </ol>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto 28px auto;">
                <tr>
                  <td align="center" style="border-radius: 8px; background: #FB8704;">
                    <a href="${activateUrl}" target="_blank" style="display: inline-block; padding: 14px 34px; font-family: sans-serif; font-size: 15px; font-weight: 800; color: #FFFFFF; text-decoration: none; border-radius: 8px; background: linear-gradient(135deg, #FB8704 0%, #FA5A04 100%);">
                      الانتقال لصفحة التفعيل وتأكيد الدخول
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #030712; padding: 22px; border-top: 1px solid rgba(255, 255, 255, 0.05); font-size: 11.5px; color: #64748B; line-height: 1.6;">
              <p style="margin: 0 0 6px 0;">هذا الكود مشفر وخاص بحسابك فقط، ولا يمكن استخدامه من قبل أي حساب آخر.</p>
              <p style="margin: 0;">© ${new Date().getFullYear()} FXENGIN Financial Technologies. جميع الحقوق محفوظة.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const text = `
كود تفعيل اشتراكك في FXENGIN
==================================================
تهانينا ${userName || 'المتداول'}! تم تأكيد طلبك بنجاح.

المنتج: ${productTitle} (${typeLabel})
كود التفعيل الخاص بك:
>>> ${activationCode} <<<

خطوات التفعيل:
1. انسخ الكود أعلاه.
2. توجه لصفحة التفعيل: ${activateUrl}
3. الصق الكود واضغط "تفعيل" لبدء الاستفادة فوراً.

مع تحيات،
إدارة منصة FXENGIN
https://fxengen.com
`.trim();

    return this.sendMail({
      to: toEmail,
      subject: `كود تفعيل اشتراكك: ${productTitle} (${activationCode})`,
      text,
      html,
    });
  }

  /**
   * 6. Send Payment Rejection Notification Email
   */
  async sendPaymentRejectedEmail(
    toEmail: string,
    userName: string,
    orderNumber: string,
    productTitle: string,
    reason?: string,
  ): Promise<boolean> {
    const checkoutUrl = `${this.frontendUrl}/checkout`;

    const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <title>تحديث بشأن طلب السداد</title>
  <style>
    body { margin: 0; padding: 0; background-color: #00030a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #E6EDF3; direction: rtl; }
    .email-container { max-width: 600px; margin: 30px auto; background: #070d1e; border: 1px solid rgba(246, 70, 93, 0.4); border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(180deg, #23080e 0%, #070d1e 100%); padding: 36px 24px 24px; text-align: center; border-bottom: 1px solid rgba(246, 70, 93, 0.25); }
    .brand-title { font-size: 26px; font-weight: 900; letter-spacing: 2px; color: #FFFFFF; margin: 12px 0 4px; }
    .brand-title span { color: #F6465D; }
    .badge { display: inline-block; background: rgba(246, 70, 93, 0.15); border: 1px solid #F6465D; color: #F6465D; padding: 4px 16px; border-radius: 20px; font-size: 12px; font-weight: 700; }
    .content { padding: 36px 28px; text-align: center; }
    .headline { font-size: 22px; font-weight: 800; color: #FFFFFF; margin-bottom: 12px; }
    .reason-box { background: rgba(246, 70, 93, 0.08); border: 1px solid rgba(246, 70, 93, 0.3); border-radius: 12px; padding: 18px; margin: 24px 0; text-align: right; }
    .footer { background: #040814; padding: 24px; text-align: center; font-size: 12px; color: #5B6575; border-top: 1px solid rgba(255, 255, 255, 0.05); }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <span class="badge">تحديث حالة السداد • PAYMENT STATUS</span>
      <div class="brand-title">FX<span>ENGIN</span></div>
    </div>
    <div class="content">
      <div class="headline">مرحباً ${userName || 'المتداول'}، تعذر اعتماد إيصال الدفع</div>
      <p style="color: #8B949E; line-height: 1.6;">
        نحيطكم علماً بأنه تمت مراجعة بيانات السداد للطلب رقم: <strong style="color: #FFFFFF;">${orderNumber}</strong> (${productTitle}).
      </p>
      
      <div class="reason-box">
        <div style="font-weight: 700; color: #F6465D; margin-bottom: 6px;">سبب عدم القبول من قبل الإدارة المالية:</div>
        <div style="color: #E6EDF3; font-size: 14px;">${reason || 'إيصال السداد غير واضح أو رقم العملية غير مطابق للحساب المصرفي/المحفظة.'}</div>
      </div>

      <p style="color: #8B949E; font-size: 14px;">
        يمكنك التواصل مع فريق الدعم الفني أو إعادة تقديم إثبات السداد الصحيح من خلال صفحة الدفع.
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} FXENGIN Financial Technologies. جميع الحقوق محفوظة.</p>
    </div>
  </div>
</body>
</html>
    `;

    return this.sendMail({
      to: toEmail,
      subject: `[FXENGIN] تحديث بشأن طلب السداد: ${orderNumber}`,
      text: `مرحباً ${userName}، تعذر اعتماد إيصال السداد للطلب ${orderNumber}. السبب: ${reason || 'يرجى مراجعة الدعم'}.`,
      html,
    });
  }

  /**
   * 8. Send Instant Notification to all Admin Gmails when a customer wants to complete payment
   */
  async sendAdminNewOrderAlert(
    adminEmails: string[],
    data: {
      orderNumber: string;
      customerName: string;
      customerEmail: string;
      customerPhone?: string;
      customerTelegram?: string;
      productTitle: string;
      productType: string;
      amount: number;
      currency: string;
      paymentMethod: string;
      adminDashboardUrl?: string;
    },
  ): Promise<boolean> {
    const dashboardLink = data.adminDashboardUrl || `${this.frontendUrl}/dashboard/activation-codes`;
    const cleanPhone = (data.customerPhone || '').replace(/[^0-9]/g, '');
    const waLink = cleanPhone ? `https://wa.me/${cleanPhone}` : '#';
    const tgLink = data.customerTelegram
      ? (data.customerTelegram.startsWith('@') ? `https://t.me/${data.customerTelegram.slice(1)}` : `https://t.me/${data.customerTelegram}`)
      : cleanPhone
      ? `https://t.me/+${cleanPhone}`
      : '#';

    const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <title>طلب سداد وتفعيل جديد: #${data.orderNumber}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #020713; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #E6EDF3; direction: rtl; }
    .email-container { max-width: 620px; margin: 30px auto; background: #070e22; border: 1px solid rgba(251, 135, 4, 0.4); border-radius: 18px; overflow: hidden; box-shadow: 0 12px 40px rgba(0,0,0,0.7); }
    .header { background: linear-gradient(180deg, #121c38 0%, #070e22 100%); padding: 32px 24px 20px; text-align: center; border-bottom: 1px solid rgba(251, 135, 4, 0.25); }
    .badge { display: inline-block; background: rgba(251, 135, 4, 0.15); border: 1px solid #FB8704; color: #FB8704; padding: 5px 16px; border-radius: 20px; font-size: 12px; font-weight: 800; }
    .brand-title { font-size: 26px; font-weight: 900; letter-spacing: 2px; color: #FFFFFF; margin: 12px 0 4px; }
    .brand-title span { color: #FB8704; }
    .content { padding: 32px 26px; }
    .headline { font-size: 20px; font-weight: 800; color: #FFFFFF; margin-bottom: 16px; text-align: center; }
    .info-card { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; padding: 18px; margin-bottom: 20px; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed rgba(255, 255, 255, 0.07); font-size: 13.5px; }
    .info-row:last-child { border-bottom: none; }
    .label { color: #8B949E; font-weight: 600; }
    .value { color: #FFFFFF; font-weight: 800; }
    .price-value { color: #16C784; font-size: 18px; font-family: monospace; font-weight: 900; }
    .btn-action { display: block; text-align: center; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: #000000 !important; text-decoration: none; font-size: 15px; font-weight: 900; padding: 16px 28px; border-radius: 12px; margin: 26px 0 14px; box-shadow: 0 8px 24px rgba(16, 185, 129, 0.35); }
    .quick-links { text-align: center; margin-top: 14px; font-size: 13px; }
    .quick-links a { color: #38BDF8; text-decoration: none; margin: 0 10px; font-weight: 700; }
    .footer { background: #030712; padding: 20px; text-align: center; font-size: 11.5px; color: #5B6575; border-top: 1px solid rgba(255, 255, 255, 0.05); }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <span class="badge">🔔 إشعار إداري عاجل • NEW ORDER ALERT</span>
      <div class="brand-title">FX<span>ENGIN</span></div>
    </div>
    <div class="content">
      <div class="headline">طلب سداد واشتراك جديد بحاجة للاعتماد 🚨</div>
      <p style="color: #94A3B8; font-size: 14px; line-height: 1.6; text-align: center; margin-bottom: 22px;">
        قام أحد المشتركين للتو بتأكيد رغبته في إتمام الدفع والاشتراك في المنصة. يرجى مراجعة بيانات المشترك أدناه وتفعيل حسابه فور تأكيد الاستلام:
      </p>

      <div class="info-card">
        <div class="info-row">
          <span class="label">📋 رقم الطلب:</span>
          <span class="value" style="color: #FB8704; font-family: monospace;">#${data.orderNumber}</span>
        </div>
        <div class="info-row">
          <span class="label">👤 اسم المشترك:</span>
          <span class="value">${data.customerName}</span>
        </div>
        <div class="info-row">
          <span class="label">📧 البريد الإلكتروني:</span>
          <span class="value" style="direction: ltr;">${data.customerEmail}</span>
        </div>
        <div class="info-row">
          <span class="label">📱 رقم الهاتف:</span>
          <span class="value" style="direction: ltr;">${data.customerPhone || '—'}</span>
        </div>
        <div class="info-row">
          <span class="label">✈️ معرف تيليجرام:</span>
          <span class="value">${data.customerTelegram || (cleanPhone ? `+${cleanPhone}` : '—')}</span>
        </div>
        <div class="info-row">
          <span class="label">📦 الكورس / الباقة:</span>
          <span class="value">${data.productTitle}</span>
        </div>
        <div class="info-row">
          <span class="label">💳 طريقة الدفع:</span>
          <span class="value">${data.paymentMethod}</span>
        </div>
        <div class="info-row">
          <span class="label">💰 المبلغ المطلوب:</span>
          <span class="price-value">${data.amount} ${data.currency}</span>
        </div>
      </div>

      <a href="${dashboardLink}" class="btn-action">
        ⚡ الانتقال إلى خزينة التفعيل واعتماد الكود بنقرة واحدة
      </a>

      <div class="quick-links">
        ${cleanPhone ? `<a href="${waLink}" target="_blank">💬 مراسلة المشترك عبر WhatsApp</a>` : ''}
        ${tgLink !== '#' ? `<a href="${tgLink}" target="_blank">✈️ مراسلة المشترك عبر Telegram</a>` : ''}
      </div>
    </div>
    <div class="footer">
      <p>مرسل تلقائياً من نظام FXENGIN المركزي إلى إدارة المنصة عبر: ${this.senderEmail}</p>
      <p>© ${new Date().getFullYear()} FXENGIN Financial Technologies. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    for (const adminEmail of adminEmails) {
      if (!adminEmail || !adminEmail.includes('@')) continue;
      await this.sendMail({
        to: adminEmail,
        subject: `[FXENGIN] 🚨 طلب سداد واشتراك جديد: #${data.orderNumber} (${data.customerName})`,
        text: `طلب سداد جديد برقم #${data.orderNumber} للعميل ${data.customerName} (${data.customerEmail} - ${data.customerPhone || ''}) للمنتج ${data.productTitle} بمبلغ ${data.amount} ${data.currency}. رابط لوحة الإدارة: ${dashboardLink}`,
        html,
      }).catch((e) => this.logger.error(`Failed to send order email to ${adminEmail}: ${e.message}`));
    }

    return true;
  }
}

