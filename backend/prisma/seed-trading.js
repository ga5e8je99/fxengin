const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Trading Competition Plans...');

  const plans = [
    {
      titleAr: 'باقة المبتدئين - $10,000',
      titleEn: 'Starter Trader - $10,000',
      descriptionAr: 'حساب تجريبي بقيمة 10 آلاف دولار للتداول في سوق الفوركس والذهب والمنافسة على صدارة المتداولين.',
      descriptionEn: 'Demo account with $10,000 balance for trading forex and gold.',
      initialBalance: 10000,
      leverage: 500,
      brokerServer: 'FXENGIN Prime ECN',
      maxDailyDrawdown: 5.0,
      maxTotalDrawdown: 10.0,
      pointsPerPip: 1.0,
      badgeName: 'STARTER',
      isActive: true,
    },
    {
      titleAr: 'باقة التحليلات والتوصيات VIP - $25,000',
      titleEn: 'VIP Signals & Analysis - $25,000',
      descriptionAr: 'حساب مسابقة رسمي بقيمة 25 ألف دولار مع رافعة مالية 1:500 ونقاط مضاعفة 1.2x في قائمة المتصدرين.',
      descriptionEn: 'VIP competition account with $25,000 balance and 1.2x points multiplier.',
      initialBalance: 25000,
      leverage: 500,
      brokerServer: 'FXENGIN Prime ECN',
      maxDailyDrawdown: 5.0,
      maxTotalDrawdown: 10.0,
      pointsPerPip: 1.2,
      badgeName: 'VIP PRO',
      isActive: true,
    },
    {
      titleAr: 'باقة حيتان الذهب Pro - $50,000',
      titleEn: 'Gold Whale Pro - $50,000',
      descriptionAr: 'حساب منافسة بحجم 50 ألف دولار للمتداولين المحترفين مع نقاط مضاعفة 1.5x وسيرفر خوارزميات فائق السرعة.',
      descriptionEn: 'Pro competition account with $50,000 balance and 1.5x points multiplier.',
      initialBalance: 50000,
      leverage: 500,
      brokerServer: 'FXENGIN Raw Liquidity ECN',
      maxDailyDrawdown: 6.0,
      maxTotalDrawdown: 12.0,
      pointsPerPip: 1.5,
      badgeName: 'GOLD WHALE',
      isActive: true,
    },
    {
      titleAr: 'باقة المتداول المؤسسي - $100,000',
      titleEn: 'Institutional Master - $100,000',
      descriptionAr: 'أكبر فئة حسابات منافسة بقيمة 100 ألف دولار مع مضاعف نقاط 2.0x وسبريد منعدم Raw Spreads.',
      descriptionEn: 'Institutional account with $100,000 balance and 2.0x multiplier.',
      initialBalance: 100000,
      leverage: 500,
      brokerServer: 'FXENGIN Raw Liquidity ECN',
      maxDailyDrawdown: 6.0,
      maxTotalDrawdown: 12.0,
      pointsPerPip: 2.0,
      badgeName: 'INSTITUTIONAL',
      isActive: true,
    }
  ];

  for (const plan of plans) {
    const existing = await prisma.tradingCompetitionPlan.findFirst({
      where: { titleAr: plan.titleAr }
    });
    if (!existing) {
      await prisma.tradingCompetitionPlan.create({ data: plan });
    }
  }

  console.log('Plans created/verified.');

  const user = await prisma.user.findFirst();
  if (!user) {
    console.log('No user found to link accounts, skipping demo traders.');
    return;
  }

  const createdPlans = await prisma.tradingCompetitionPlan.findMany();
  const defaultPlan = createdPlans[0];

  const topTraders = [
    {
      accountNumber: '928410',
      accountName: 'طارق الشمري',
      initialBalance: 50000,
      balance: 62450.80,
      equity: 63120.50,
      totalTrades: 48,
      winTrades: 40,
      lossTrades: 8,
      points: 2450,
      totalPips: 840,
      brokerServer: 'FXENGIN Raw Liquidity ECN',
    },
    {
      accountNumber: '817290',
      accountName: 'سارة المصري',
      initialBalance: 25000,
      balance: 31820.40,
      equity: 32050.00,
      totalTrades: 36,
      winTrades: 28,
      lossTrades: 8,
      points: 1980,
      totalPips: 620,
      brokerServer: 'FXENGIN Prime ECN',
    },
    {
      accountNumber: '739182',
      accountName: 'عمر الفاسي',
      initialBalance: 25000,
      balance: 30140.00,
      equity: 29980.00,
      totalTrades: 29,
      winTrades: 22,
      lossTrades: 7,
      points: 1620,
      totalPips: 510,
      brokerServer: 'FXENGIN Prime ECN',
    },
    {
      accountNumber: '648201',
      accountName: 'زياد الغامدي',
      initialBalance: 10000,
      balance: 13420.50,
      equity: 13420.50,
      totalTrades: 22,
      winTrades: 16,
      lossTrades: 6,
      points: 1380,
      totalPips: 430,
      brokerServer: 'FXENGIN Prime ECN',
    },
    {
      accountNumber: '592014',
      accountName: 'يوسف الدوسري',
      initialBalance: 10000,
      balance: 12890.00,
      equity: 12950.00,
      totalTrades: 19,
      winTrades: 13,
      lossTrades: 6,
      points: 1190,
      totalPips: 380,
      brokerServer: 'FXENGIN Prime ECN',
    }
  ];

  for (const trader of topTraders) {
    const existing = await prisma.tradingAccount.findUnique({
      where: { accountNumber: trader.accountNumber }
    });
    if (!existing) {
      await prisma.tradingAccount.create({
        data: {
          ...trader,
          userId: user.id,
          competitionPlanId: defaultPlan?.id,
          status: 'ACTIVE',
        }
      });
    }
  }

  console.log('✅ Trading competition seed completed successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
