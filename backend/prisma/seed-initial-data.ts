import { PrismaClient, SignalDirection, SignalStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Initial Data Seeding & Migration ---');

  // 1. Seed System Settings
  await prisma.systemSetting.upsert({
    where: { id: 'global' },
    update: {},
    create: {
      id: 'global',
      siteName: 'FXENGIN Core Terminal',
      currency: 'USD',
      maintenanceMode: false,
      contactEmail: 'support@fxengin.com',
      supportPhone: '+971 4 380 0000',
      telegramChannel: 'https://t.me/fxengin_official',
      whatsappNumber: '+971 50 123 4567',
      metaTitle: 'FXENGIN — منصة الفوركس والتعليم المالي العالمية',
      metaDescription: 'ارتق بتجربتك في عالم الفوركس مع FXENGIN. دورات احترافية، تحليلات يومية، وأدوات تداول متقدمة.',
    },
  });
  console.log('✓ System Settings seeded');

  // 2. Seed Initial Signals for Radar
  const existingSignalsCount = await prisma.signal.count();
  if (existingSignalsCount === 0) {
    await prisma.signal.createMany({
      data: [
        {
          symbol: 'XAU/USD',
          direction: SignalDirection.BUY,
          entryPrice: 2336.50,
          stopLoss: 2328.00,
          takeProfit1: 2352.00,
          takeProfit2: 2368.00,
          takeProfit3: 2385.00,
          status: SignalStatus.ACTIVE,
          timeframe: '1H',
          riskReward: '1:3.2',
          notes: 'شراء بعد كسر هيكلي واختبار فجوة السيولة FVG على فريم الساعة',
        },
        {
          symbol: 'EUR/USD',
          direction: SignalDirection.BUY,
          entryPrice: 1.0825,
          stopLoss: 1.0790,
          takeProfit1: 1.0875,
          takeProfit2: 1.0920,
          status: SignalStatus.ACTIVE,
          timeframe: '4H',
          riskReward: '1:2.8',
          notes: 'اتجاه عام صاعد معتدل وارتداد من منطقة دعم أسبوعية',
        },
        {
          symbol: 'GBP/USD',
          direction: SignalDirection.BUY,
          entryPrice: 1.2650,
          stopLoss: 1.2610,
          takeProfit1: 1.2720,
          takeProfit2: 1.2780,
          status: SignalStatus.ACTIVE,
          timeframe: '1H',
          riskReward: '1:2.5',
          notes: 'إعادة اختبار مستوى الدعم الرئيسي بعد صدور بيانات إيجابية',
        },
        {
          symbol: 'USD/JPY',
          direction: SignalDirection.SELL,
          entryPrice: 155.50,
          stopLoss: 156.10,
          takeProfit1: 154.60,
          takeProfit2: 153.80,
          status: SignalStatus.ACTIVE,
          timeframe: '4H',
          riskReward: '1:3.0',
          notes: 'ارتداد من سقف القناة السعرية ومقاومة تاريخية هامة',
        },
      ],
    });
    console.log('✓ Initial 4 institutional signals seeded');
  }

  // 3. Seed Initial Testimonials
  const existingTestimonialsCount = await prisma.testimonial.count();
  if (existingTestimonialsCount === 0) {
    await prisma.testimonial.createMany({
      data: [
        {
          clientName: 'م. فيصل القحطاني',
          location: 'الرياض، السعودية 🇸🇦',
          roleTitle: 'متداول VIP معتمد',
          avatarText: 'FQ',
          category: 'webinars',
          rating: 5,
          metricText: '+34% نمو المحفظة في شهرين',
          courseName: 'ورشة السيولة البنكية المباشرة (SMC)',
          reviewAr: 'حضور ورشة السيولة البنكية مع د. كريم غير طريقة نظرتي للشارت تماماً. كنت دائماً أقع في فخاخ صناع السوق وكسر القمم الكاذب، والآن أصبحت أدخل مع السيولة المؤسسية بنسب عائد تتجاوز 1:3.',
          reviewEn: 'Attending the institutional liquidity workshop with Dr. Karim completely changed how I read the charts. Now executing alongside smart money with 1:3+ risk-to-reward ratios.',
          isApproved: true,
          sortOrder: 1,
        },
        {
          clientName: 'سارة المنصوري',
          location: 'دبي، الإمارات 🇦🇪',
          roleTitle: 'خريجة الأكاديمية الاحترافية',
          avatarText: 'SM',
          category: 'funding',
          rating: 5,
          metricText: 'اجتياز حساب تمويل 100K $ (FTMO)',
          courseName: 'دورة نماذج الهارمونيك واختبارات التمويل',
          reviewAr: 'بفضل الله ثم أكاديمية FXENGIN نجحت في اجتياز تحدي شركة التمويل والحصول على حساب ممول بقيمة 100,000$. أسلوب الشرح العملي والتطبيقات المباشرة في مجتمع المتداولين منحني الانضباط النفسي وإدارة المخاطر الصارمة.',
          reviewEn: 'Thanks to FXENGIN Academy, I passed my prop firm challenge and got a $100K funded trading account.',
          isApproved: true,
          sortOrder: 2,
        },
        {
          clientName: 'أحمد خليل',
          location: 'القاهرة، مصر 🇪🇬',
          roleTitle: 'مشترك التحليلات اليومية',
          avatarText: 'AK',
          category: 'analytics',
          rating: 5,
          metricText: 'دقة إشارات 88% على الذهب XAU/USD',
          courseName: 'باقة التحليلات الفنية اللحظية والذهب',
          reviewAr: 'التحليلات اليومية لموجات الذهب واليورو دولار قمة في الدقة والواقعية. لا يكتفون بإعطاء مستويات الدخول، بل يشرحون الأسباب المنطقية وسيناريوهات البدائل.',
          reviewEn: 'The daily Gold and EUR/USD wave analyses are pinpoint accurate with detailed logical rationale.',
          isApproved: true,
          sortOrder: 3,
        },
        {
          clientName: 'خالد المطيري',
          location: 'الكويت 🇰🇼',
          roleTitle: 'متداول متقدم',
          avatarText: 'KM',
          category: 'courses',
          rating: 5,
          metricText: 'تقليص التراجع لأقل من 4%',
          courseName: 'مسار العرض والطلب المتقدم وإدارة رأس المال',
          reviewAr: 'تداولت في أسواق الفوركس لأكثر من 4 سنوات وخسرت الكثير بسبب التشتت. الكورسات وورش العمل رتبت أفكاري وعلمتني متى لا أدخل السوق أصلاً.',
          reviewEn: 'FXENGIN courses structured my edge and taught me when NOT to enter the market. Capital protection is unmatched.',
          isApproved: true,
          sortOrder: 4,
        },
      ],
    });
    console.log('✓ Initial testimonials seeded');
  }

  // 4. Migrate Articles from articles.json
  const articlesFilePath = path.join(__dirname, '..', '..', 'fx-engin', 'data', 'articles.json');
  if (fs.existsSync(articlesFilePath)) {
    try {
      const articlesData = JSON.parse(fs.readFileSync(articlesFilePath, 'utf-8'));
      if (Array.isArray(articlesData)) {
        for (const a of articlesData) {
          const slug = String(a.slug || `article-${a.id}`);
          await prisma.article.upsert({
            where: { slug },
            update: {},
            create: {
              slug,
              titleAr: a.titleAr || a.title || 'مقال تعليمي',
              titleEn: a.titleEn || a.title || null,
              excerptAr: a.excerptAr || a.excerpt || null,
              excerptEn: a.excerptEn || a.excerpt || null,
              contentAr: a.contentAr || a.content || null,
              contentEn: a.contentEn || a.content || null,
              coverImage: a.coverImage || a.imageUrl || null,
              authorName: a.authorAr || a.author || 'م. سليمان داود',
              authorRole: a.authorRoleAr || 'كبير محللي الأسواق',
              categoryKey: a.categoryKey || 'strategies',
              categoryAr: a.category || 'استراتيجيات التداول',
              categoryEn: a.categoryEn || 'Trading Strategies',
              tags: Array.isArray(a.tags) ? a.tags : ['Forex', 'Trading'],
              viewsCount: Number(a.views) || 0,
              isFeatured: Boolean(a.featured),
              status: a.status || 'PUBLISHED',
              tradingViewUrl: a.tradingViewUrl || null,
              symbol: a.symbol || null,
              sectionsData: a.sections || null,
              faqsData: a.faqs || null,
            },
          });
        }
        console.log(`✓ Migrated ${articlesData.length} articles to database`);
      }
    } catch (e) {
      console.warn('Articles migration error:', e.message);
    }
  }

  // 5. Migrate Brokers from brokers.json
  const brokersFilePath = path.join(__dirname, '..', '..', 'fx-engin', 'data', 'brokers.json');
  if (fs.existsSync(brokersFilePath)) {
    try {
      const brokersData = JSON.parse(fs.readFileSync(brokersFilePath, 'utf-8'));
      if (Array.isArray(brokersData)) {
        for (const b of brokersData) {
          const brokerSlug = String(b.id || b.name.toLowerCase().replace(/[^a-z0-9]/g, '-'));
          await prisma.broker.upsert({
            where: { brokerSlug },
            update: {},
            create: {
              brokerSlug,
              name: b.name,
              category: b.category || 'forex',
              categoryLabelAr: b.categoryLabelAr || null,
              categoryLabelEn: b.categoryLabelEn || null,
              badgeAr: b.badgeAr || null,
              badgeEn: b.badgeEn || null,
              badgeColor: b.badgeColor || '#0488F8',
              logoUrl: b.logo || '/assets/Images/brokers/xm.png',
              logoBg: b.logoBg || '#000000',
              rating: Number(b.rating) || 4.9,
              clientsCount: b.clientsCount || null,
              clientsCountEn: b.clientsCountEn || null,
              accentColor: b.accentColor || '#0488F8',
              glowBorder: b.glowBorder || null,
              descriptionAr: b.descriptionAr || null,
              descriptionEn: b.descriptionEn || null,
              specsData: b.specs || null,
              featuresAr: Array.isArray(b.featuresAr) ? b.featuresAr : [],
              featuresEn: Array.isArray(b.featuresEn) ? b.featuresEn : [],
              couponCode: b.couponCode || null,
              perksAr: b.fxenginPerksAr || b.perkAr || null,
              perksEn: b.fxenginPerksEn || b.perkEn || null,
              liveUrl: b.liveUrl || '#',
              demoUrl: b.demoUrl || '#',
              sortOrder: Number(b.order) || 0,
              isActive: b.status !== 'INACTIVE',
            },
          });
        }
        console.log(`✓ Migrated ${brokersData.length} brokers to database`);
      }
    } catch (e) {
      console.warn('Brokers migration error:', e.message);
    }
  }

  // 6. Migrate Pages from pages.json
  const pagesFilePath = path.join(__dirname, '..', '..', 'fx-engin', 'data', 'pages.json');
  if (fs.existsSync(pagesFilePath)) {
    try {
      const pagesData = JSON.parse(fs.readFileSync(pagesFilePath, 'utf-8'));
      if (Array.isArray(pagesData)) {
        for (const p of pagesData) {
          const slug = String(p.slug);
          const { titleAr, titleEn, subtitleAr, subtitleEn, badgeAr, badgeEn, category, isPublished, ...rest } = p;
          await prisma.cmsPage.upsert({
            where: { slug },
            update: {},
            create: {
              slug,
              titleAr: titleAr || slug,
              titleEn: titleEn || slug,
              subtitleAr: subtitleAr || null,
              subtitleEn: subtitleEn || null,
              badgeAr: badgeAr || null,
              badgeEn: badgeEn || null,
              category: category || 'company',
              isPublished: isPublished ?? true,
              contentData: rest,
            },
          });
        }
        console.log(`✓ Migrated ${pagesData.length} CMS pages to database`);
      }
    } catch (e) {
      console.warn('Pages migration error:', e.message);
    }
  }

  console.log('--- Initial Data Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
