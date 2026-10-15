import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const COURSES = [
  {
    slug: 'forex-101-basics',
    title: 'دورة أساسيات الفوركس الشاملة: من الصفر حتى أول صفقة',
    subtitle: 'المسار التعليمي الأول للمبتدئين للتعرف على مصطلحات سوق العملات',
    description:
      'تعلم أسس تداول الفوركس من البداية، أنواع العملات، أوقات جلسات التداول العالمية (لندن ونيويورك وطوكيو)، حساب اللوت والنقاط والهامش، وقراءة الشموع اليابانية لتنفيذ أول صفقة تداول بثقة واحترافية.',
    price: 0,
    discountPrice: 0,
    currency: 'USD',
    accessTier: 'FREE' as const,
    difficulty: 'BEGINNER' as const,
    category: 'أساسيات التداول',
    adminRating: 4.9,
    adminReviewCount: 1420,
    thumbnailUrl: '/assets/Images/test/course1.png',
    promoVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    isPublished: true,
    sections: [
      {
        title: 'الفصل الأول: مقدمة في أسواق الصرف الأجنبي',
        orderIndex: 0,
        lessons: [
          { title: 'ما هو سوق الفوركس وكيف يعمل؟', durationSeconds: 900, isFreePreview: true, orderIndex: 0 },
          { title: 'أزواج العملات الرئيسية والثانوية والمتقاطعة', durationSeconds: 1200, isFreePreview: true, orderIndex: 1 },
          { title: 'أوقات وجلسات التداول وأفضل أوقات النشاط', durationSeconds: 1100, isFreePreview: false, orderIndex: 2 },
        ],
      },
      {
        title: 'الفصل الثاني: الحسابات الرياضية وأحجام العقود',
        orderIndex: 1,
        lessons: [
          { title: 'حساب النقاط (Pips) والهامش (Margin) والرافعة المالية', durationSeconds: 1500, isFreePreview: false, orderIndex: 0 },
          { title: 'أنواع العقود: اللوت القياسي، الميني، والميكرو', durationSeconds: 1300, isFreePreview: false, orderIndex: 1 },
          { title: 'كيف تفتح وتغلق أول صفقة على منصة MT4/MT5', durationSeconds: 1800, isFreePreview: false, orderIndex: 2 },
        ],
      },
    ],
  },
  {
    slug: 'price-action-mastery',
    title: 'احتراف التحليل الفني وسلوك السعر (Price Action Mastery)',
    subtitle: 'تعلم قراءة حركة الأسعار بدون مؤشرات معقدة وتحديد مناطق الدعم والمقاومة',
    description:
      'دورة متخصصة في فهم سلوك السعر المجرد (Naked Price Action)، تحديد كسر القنوات السعرية، الاتجاهات العامة والفرعية، والتعامل مع مناطق السيولة العالية بمعدلات عائد لمخاطرة تفوق 1:2.',
    price: 199,
    discountPrice: 159,
    currency: 'USD',
    accessTier: 'STARTER' as const,
    difficulty: 'INTERMEDIATE' as const,
    category: 'التحليل الفني',
    adminRating: 4.95,
    adminReviewCount: 2150,
    thumbnailUrl: '/assets/Images/test/course1.png',
    promoVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    isPublished: true,
    sections: [
      {
        title: 'الفصل الأول: قواعد سلوك السعر المتقدمة',
        orderIndex: 0,
        lessons: [
          { title: 'بنية السوق الحقيقية: القمم والقيعان الصاعدة والهابطة', durationSeconds: 1600, isFreePreview: true, orderIndex: 0 },
          { title: 'مناطق الدعم والمقاومة الديناميكية ومستويات العرض والطلب', durationSeconds: 2100, isFreePreview: false, orderIndex: 1 },
          { title: 'النماذج السعرية الانعكاسية والاستمرارية الاحترافية', durationSeconds: 1800, isFreePreview: false, orderIndex: 2 },
        ],
      },
      {
        title: 'الفصل الثاني: خطط الدخول والخروج ونسبة العائد للمخاطرة',
        orderIndex: 1,
        lessons: [
          { title: 'استراتيجية الكسر وإعادة الاختبار (Break & Retest)', durationSeconds: 2400, isFreePreview: false, orderIndex: 0 },
          { title: 'تحديد وقف الخسارة المحمي وجني الأرباح المتعدد', durationSeconds: 1900, isFreePreview: false, orderIndex: 1 },
        ],
      },
    ],
  },
  {
    slug: 'fundamental-macro-analysis',
    title: 'التحليل الأساسي والاقتصادي المتقدم لأسواق المال',
    subtitle: 'فهم قرارات البنوك المركزية، بيانات التضخم وأسعار الفائدة',
    description:
      'كيف تؤثر الأخبار الاقتصادية الكبرى (NFP، CPI، FOMC) على حركة أزواج العملات والذهب. استراتيجيات تداول الأحداث الاقتصادية وقراءة المفكرة الاقتصادية مثل المحترفين في البنوك العالمية.',
    price: 249,
    discountPrice: 199,
    currency: 'USD',
    accessTier: 'PRO' as const,
    difficulty: 'ADVANCED' as const,
    category: 'التحليل الأساسي',
    adminRating: 4.88,
    adminReviewCount: 980,
    thumbnailUrl: '/assets/Images/test/course1.png',
    promoVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    isPublished: true,
    sections: [
      {
        title: 'الفصل الأول: البنوك المركزية والسياسات النقدية',
        orderIndex: 0,
        lessons: [
          { title: 'الفيدرالي الأمريكي والبنك المركزي الأوروبي: تأثير الفائدة والتيسير الكمي', durationSeconds: 2200, isFreePreview: true, orderIndex: 0 },
          { title: 'مؤشرات التضخم (CPI & PPI) وتأثيرها المباشر على الدولار والذهب', durationSeconds: 1900, isFreePreview: false, orderIndex: 1 },
        ],
      },
    ],
  },
  {
    slug: 'gold-oil-scalping-pro',
    title: 'استراتيجيات تداول وسكالبينج الذهب والنفط (Gold & Oil Pro)',
    subtitle: 'استراتيجيات مخصصة للتحركات السريعة في معدن الذهب والنفط الخام',
    description:
      'أسرار حركة الذهب والنفط اليومية، جلسات لندن ونيويورك المتفجرة، ونماذج السكالبينج اللحظية لاقتناص من 30 إلى 100 نقطة بأقل انعكاس ممكن مع قواعد وقف خسارة محكمة.',
    price: 299,
    discountPrice: 249,
    currency: 'USD',
    accessTier: 'PRO' as const,
    difficulty: 'INTERMEDIATE' as const,
    category: 'تداول المعادن والطاقة',
    adminRating: 4.97,
    adminReviewCount: 3400,
    thumbnailUrl: '/assets/Images/test/course1.png',
    promoVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    isPublished: true,
    sections: [
      {
        title: 'الفصل الأول: دورة حركة الذهب اليومية (Gold Intraday Cycle)',
        orderIndex: 0,
        lessons: [
          { title: 'أوقات سيولة الذهب وسلوك افتتاح بورصة لندن ونيويورك', durationSeconds: 1800, isFreePreview: true, orderIndex: 0 },
          { title: 'إعدادات مؤشرات السيولة والفوليوم لمعدن الذهب XAUUSD', durationSeconds: 2300, isFreePreview: false, orderIndex: 1 },
        ],
      },
    ],
  },
  {
    slug: 'risk-management-psychology',
    title: 'إدارة رأس المال الصارمة وعلم النفس للمتداول الناجح',
    subtitle: 'الركيزة الأساسية لكل متداول: التحكم في المشاعر وإدارة المحفظة',
    description:
      'تغطية شاملة لعلم النفس التداولي (Trading Psychology)، التخلص من الطمع والخوف والانتقام من السوق، وضع خطة إدارة مخاطر صارمة تمنع تصفير الحسابات وتضمن النمو التراكمي المستدام.',
    price: 149,
    discountPrice: 119,
    currency: 'USD',
    accessTier: 'STARTER' as const,
    difficulty: 'BEGINNER' as const,
    category: 'إدارة المخاطر',
    adminRating: 4.92,
    adminReviewCount: 1120,
    thumbnailUrl: '/assets/Images/test/course1.png',
    promoVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    isPublished: true,
    sections: [
      {
        title: 'الفصل الأول: قواعد النجاة والاستمرارية في التداول',
        orderIndex: 0,
        lessons: [
          { title: 'قاعدة الـ 1% والـ 2%: كيف تحمي رأس مالك من الانهيارات', durationSeconds: 1500, isFreePreview: true, orderIndex: 0 },
          { title: 'سيكولوجية تقبل الخسارة والتغلب على فخ Revenge Trading', durationSeconds: 2000, isFreePreview: false, orderIndex: 1 },
        ],
      },
    ],
  },
  {
    slug: 'algo-trading-ai-bots',
    title: 'التداول الخوارزمي والذكاء الاصطناعي وبناء الروبوتات',
    subtitle: 'بناء وبرمجة واختبار استراتيجيات التداول الآلي باستخدام الذكاء الاصطناعي',
    description:
      'تعلم كيفية أتمتة استراتيجياتك التداولية باستخدام بايثون و Pine Script لمنصة TradingView، واختبار الأداء التاريخي (Backtesting) وتنصيب خوارزميات تنفيذية تعمل على مدار الساعة.',
    price: 499,
    discountPrice: 399,
    currency: 'USD',
    accessTier: 'VIP' as const,
    difficulty: 'VIP_ELITE' as const,
    category: 'التداول الخوارزمي',
    adminRating: 4.96,
    adminReviewCount: 870,
    thumbnailUrl: '/assets/Images/test/course1.png',
    promoVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    isPublished: true,
    sections: [
      {
        title: 'الفصل الأول: أساسيات بناء الخوارزميات واستراتيجيات المؤشرات',
        orderIndex: 0,
        lessons: [
          { title: 'مقدمة في كتابة سكربتات Pine Script v5 على TradingView', durationSeconds: 2500, isFreePreview: true, orderIndex: 0 },
          { title: 'ربط تنبيهات الاستراتيجيات بوسطاء التداول عبر Webhooks', durationSeconds: 2800, isFreePreview: false, orderIndex: 1 },
        ],
      },
    ],
  },
  {
    slug: 'smc-institutional-order-flow',
    title: 'منهجية صناع السوق والسيولة الذكية (Smart Money Concepts)',
    subtitle: 'تتبع آثار المؤسسات المالية وصناديق التحوط واقتناص مناطق السيولة',
    description:
      'شرح شامل ومفصل لمفاهيم SMC الحديثة: Order Blocks، Fair Value Gaps (FVG)، Break of Structure (BOS)، Change of Character (CHoCH)، والدخول مع صناع السوق عند مناطق السيولة العالية.',
    price: 399,
    discountPrice: 319,
    currency: 'USD',
    accessTier: 'VIP' as const,
    difficulty: 'ADVANCED' as const,
    category: 'السيولة الذكية SMC',
    adminRating: 4.98,
    adminReviewCount: 2890,
    thumbnailUrl: '/assets/Images/test/course1.png',
    promoVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    isPublished: true,
    sections: [
      {
        title: 'الفصل الأول: خريطة السيولة المؤسسية وصناع السوق',
        orderIndex: 0,
        lessons: [
          { title: 'تحديد قيعان وقمم السيولة (Liquidity Sweeps & Purges)', durationSeconds: 2600, isFreePreview: true, orderIndex: 0 },
          { title: 'مناطق الخلل السعري Fair Value Gaps وكيفية اقتناصها', durationSeconds: 2400, isFreePreview: false, orderIndex: 1 },
          { title: 'نماذج الكتل السعرية المؤسسية (Order Blocks & Breaker Blocks)', durationSeconds: 2700, isFreePreview: false, orderIndex: 2 },
        ],
      },
    ],
  },
  {
    slug: 'harmonic-patterns-elliott-wave',
    title: 'نماذج الهارمونيك التوافقية وموجات إليوت الاحترافية',
    subtitle: 'توقع الانعكاسات السعرية الكبرى عبر نسب فيبوناتشي وموجات إليوت',
    description:
      'إتقان نماذج الهارمونيك الأكثر دقة (Bat، Gartley، Butterfly، Crab) مع دمج موجات إليوت الدافعة والتصحيحية لحساب مستويات الدخول والأهداف بدقة هندسية متناهية.',
    price: 349,
    discountPrice: 279,
    currency: 'USD',
    accessTier: 'PRO' as const,
    difficulty: 'ADVANCED' as const,
    category: 'نماذج الهارمونيك',
    adminRating: 4.91,
    adminReviewCount: 1650,
    thumbnailUrl: '/assets/Images/test/course1.png',
    promoVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    isPublished: true,
    sections: [
      {
        title: 'الفصل الأول: نسب فيبوناتشي الذهبية ونماذج الهارمونيك',
        orderIndex: 0,
        lessons: [
          { title: 'النسب الذهبية لفيبوناتشي: 61.8% و 78.6% و 88.6%', durationSeconds: 1900, isFreePreview: true, orderIndex: 0 },
          { title: 'نموذج الفراشة (Butterfly) والخفاش (Bat) وشروط اكتمالها', durationSeconds: 2300, isFreePreview: false, orderIndex: 1 },
        ],
      },
    ],
  },
];

const INITIAL_COUPONS = [
  {
    code: 'FX20',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    minPurchase: 50,
    maxDiscount: 100,
    maxUses: 500,
    isActive: true,
  },
  {
    code: 'WELCOME50',
    discountType: 'FIXED',
    discountValue: 50,
    minPurchase: 140,
    maxDiscount: 50,
    maxUses: 200,
    isActive: true,
  },
  {
    code: 'VIP100',
    discountType: 'FIXED',
    discountValue: 100,
    minPurchase: 290,
    maxDiscount: 100,
    maxUses: 100,
    isActive: true,
  },
  {
    code: 'PRO30',
    discountType: 'PERCENTAGE',
    discountValue: 30,
    minPurchase: 100,
    maxDiscount: 150,
    maxUses: 300,
    isActive: true,
  },
];

async function main() {
  console.log('🚀 Starting Courses & Coupons Seeder...');

  // 1. Seed Courses
  for (const c of COURSES) {
    const { sections, ...courseData } = c;

    const upserted = await prisma.course.upsert({
      where: { slug: c.slug },
      update: {
        ...courseData,
        isPublished: true,
      },
      create: {
        ...courseData,
        isPublished: true,
      },
    });

    console.log(`✓ Course upserted: ${upserted.title} (${upserted.slug})`);

    // Seed sections & lessons
    for (const sec of sections) {
      let existingSec = await prisma.courseSection.findFirst({
        where: { courseId: upserted.id, title: sec.title },
      });

      if (!existingSec) {
        existingSec = await prisma.courseSection.create({
          data: {
            courseId: upserted.id,
            title: sec.title,
            orderIndex: sec.orderIndex,
          },
        });
      }

      for (const les of sec.lessons) {
        const existingLes = await prisma.courseLesson.findFirst({
          where: { sectionId: existingSec.id, title: les.title },
        });

        if (!existingLes) {
          await prisma.courseLesson.create({
            data: {
              sectionId: existingSec.id,
              title: les.title,
              durationSeconds: les.durationSeconds,
              isFreePreview: les.isFreePreview,
              orderIndex: les.orderIndex,
              videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
            },
          });
        }
      }
    }
  }

  // 2. Seed Initial Coupons
  for (const coup of INITIAL_COUPONS) {
    const existing = await prisma.coupon.findUnique({
      where: { code: coup.code },
    });

    if (!existing) {
      await prisma.coupon.create({
        data: coup,
      });
      console.log(`✓ Coupon created: ${coup.code} (${coup.discountType} - ${coup.discountValue})`);
    } else {
      await prisma.coupon.update({
        where: { code: coup.code },
        data: coup,
      });
      console.log(`✓ Coupon updated: ${coup.code}`);
    }
  }

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
