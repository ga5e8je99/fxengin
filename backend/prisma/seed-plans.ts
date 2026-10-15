import { PrismaClient, BillingPeriod } from '@prisma/client';

const prisma = new PrismaClient();

export const PLANS_TO_SEED = [
  {
    slug: 'gold',
    name: 'مجموعة الذهب',
    description: 'جروب وتغطية حصرية لتحليلات وإشارات الذهب (XAU/USD) الحية لحظة بلحظة من شارتات MT5 مع مناطق الدخول ووقف الخسارة وجني الأرباح ونماذج السيولة الذكية SMC.',
    price: 200,
    currency: 'USD',
    billingPeriod: BillingPeriod.MONTHLY,
    badge: 'الأكثر طلباً • مجموعة الذهب 🟡',
    highlightColor: '#FB8704',
    isActive: true,
    sortOrder: 1,
    features: [
      'تغطية حية ومباشرة لتحليلات صفقات الذهب (XAU/USD)',
      'شارتات MT5 لحظية ملتقطة مباشرة من خوادم التداول',
      'مصفوفة إحداثيات رقمية دقيقة: الدخول، TP1، TP2، والوقف',
      'تحليل السيولة البنكية SMC ونماذج Order Blocks و FVG',
      'تحديثات فورية وتنبيهات مستمرة على مدار 24/5',
      'طلب لقطة شارت جديدة لحظياً (Fresh Snapshot)',
      'اشتراك شهري مباشر وتفعيل فوري للتحليلات',
    ],
    permissions: [
      'GOLD_VIP_SIGNALS',
      'BOT_SIGNALS_ACCESS',
      'INSTITUTIONAL_DESK',
      'TELEGRAM_VIP_COMMUNITY',
      'LIVE_CHAT_PRIVILEGE',
    ],
  },
  {
    slug: 'indices',
    name: 'مجموعة Index',
    description: 'جروب التحليلات الخاص بمؤشرات الأسهم الأمريكية (داو جونز US30 وناسداك NAS100) وأسواق الطاقة (النفط والغاز) والمعادن الثمينة (الفضة).',
    price: 100,
    currency: 'USD',
    billingPeriod: BillingPeriod.MONTHLY,
    badge: 'المؤشرات والسلع 🟣',
    highlightColor: '#A855F7',
    isActive: true,
    sortOrder: 2,
    features: [
      'تحليلات مؤشرات وول ستريت العالمية (US30 Dow و NAS100 Nasdaq)',
      'تغطية صفقات أسواق الطاقة: النفط الأمريكي والغاز الطبيعي',
      'إشارات وتحليلات معدن الفضة (XAG/USD)',
      'إحداثيات ومستويات الوقف والأهداف ونسب المخاطرة للعائد',
      'تنبيهات خاصة بفترات السيولة في افتتاح الجلسات الأمريكية والأوروبية',
      'اشتراك شهري مباشر وتفعيل فوري للتحليلات',
    ],
    permissions: [
      'INDICES_VIP_SIGNALS',
      'COMMODITIES_VIP_SIGNALS',
      'INSTITUTIONAL_DESK',
      'TELEGRAM_VIP_COMMUNITY',
      'LIVE_CHAT_PRIVILEGE',
    ],
  },
  {
    slug: 'forex',
    name: 'مجموعة الفوريكس',
    description: 'جروب تحليلات أزواج العملات الأجنبية الرئيسية والتقاطعات اللحظية بمستويات دخول وخروج دقيقة وهيكل السيولة البنكية.',
    price: 50,
    currency: 'USD',
    billingPeriod: BillingPeriod.MONTHLY,
    badge: 'أزواج العملات 🔵',
    highlightColor: '#0488F8',
    isActive: true,
    sortOrder: 3,
    features: [
      'تغطية أزواج العملات الرئيسية (EUR/USD, GBP/USD, USD/JPY...)',
      'إحداثيات دخول وخروج لحظية مع مستويات وقف الخسارة والأهداف',
      'تحديثات هيكل السوق والسيولة البنكية (SMC Structure)',
      'تنبيهات فورية عند تشكل فرص التداول اللحظية على مدار 24/5',
      'اشتراك شهري مباشر وتفعيل فوري للتحليلات',
    ],
    permissions: [
      'FOREX_VIP_SIGNALS',
      'INSTITUTIONAL_DESK',
      'TELEGRAM_VIP_COMMUNITY',
      'LIVE_CHAT_PRIVILEGE',
    ],
  },
];

async function seedPlans() {
  console.log('🌱 Seeding VIP Subscription Plans...');
  for (const plan of PLANS_TO_SEED) {
    const upserted = await prisma.subscriptionPlan.upsert({
      where: { slug: plan.slug },
      update: {
        name: plan.name,
        description: plan.description,
        price: plan.price,
        currency: plan.currency,
        billingPeriod: plan.billingPeriod,
        badge: plan.badge,
        highlightColor: plan.highlightColor,
        isActive: plan.isActive,
        sortOrder: plan.sortOrder,
        features: plan.features,
        permissions: plan.permissions,
      },
      create: {
        slug: plan.slug,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        currency: plan.currency,
        billingPeriod: plan.billingPeriod,
        badge: plan.badge,
        highlightColor: plan.highlightColor,
        isActive: plan.isActive,
        sortOrder: plan.sortOrder,
        features: plan.features,
        permissions: plan.permissions,
      },
    });
    console.log(`✅ Upserted plan: ${upserted.name} (${upserted.price} ${upserted.currency})`);
  }
  console.log('🎉 Subscription plans seeded successfully!');
}

seedPlans()
  .catch((e) => {
    console.error('Error seeding plans:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
