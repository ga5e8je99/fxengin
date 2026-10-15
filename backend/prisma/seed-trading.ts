import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Trading Competition Plans...');

  const plans = [
    {
      planCode: 'starter-10k',
      title: 'باقة المبتدئين - $10,000',
      description: 'حساب تجريبي بقيمة 10 آلاف دولار للتداول في سوق الفوركس والذهب والمنافسة على صدارة المتداولين.',
      initialBalance: 10000,
      leverage: 500,
      brokerServer: 'FXENGIN Prime ECN',
      maxDailyDrawdown: 5.0,
      maxTotalDrawdown: 10.0,
      profitTarget: 10.0,
      pointsMultiplier: 1.0,
      linkedProductType: 'COURSE',
      isActive: true,
      sortOrder: 1,
    },
    {
      planCode: 'signals-25k',
      title: 'باقة التحليلات والتوصيات VIP - $25,000',
      description: 'حساب مسابقة رسمي بقيمة 25 ألف دولار مع رافعة مالية 1:500 ونقاط مضاعفة 1.2x في قائمة المتصدرين.',
      initialBalance: 25000,
      leverage: 500,
      brokerServer: 'FXENGIN Prime ECN',
      maxDailyDrawdown: 5.0,
      maxTotalDrawdown: 10.0,
      profitTarget: 10.0,
      pointsMultiplier: 1.2,
      linkedProductType: 'SUBSCRIPTION_PLAN',
      isActive: true,
      sortOrder: 2,
    },
    {
      planCode: 'gold-50k',
      title: 'باقة حيتان الذهب Pro - $50,000',
      description: 'حساب منافسة بحجم 50 ألف دولار للمتداولين المحترفين مع نقاط مضاعفة 1.5x وسيرفر خوارزميات فائق السرعة.',
      initialBalance: 50000,
      leverage: 500,
      brokerServer: 'FXENGIN Raw Liquidity ECN',
      maxDailyDrawdown: 6.0,
      maxTotalDrawdown: 12.0,
      profitTarget: 12.0,
      pointsMultiplier: 1.5,
      linkedProductType: 'SUBSCRIPTION_PLAN',
      isActive: true,
      sortOrder: 3,
    },
    {
      planCode: 'institutional-100k',
      title: 'باقة المتداول المؤسسي - $100,000',
      description: 'أكبر فئة حسابات منافسة بقيمة 100 ألف دولار مع مضاعف نقاط 2.0x وسبريد منعدم Raw Spreads.',
      initialBalance: 100000,
      leverage: 500,
      brokerServer: 'FXENGIN Raw Liquidity ECN',
      maxDailyDrawdown: 6.0,
      maxTotalDrawdown: 12.0,
      profitTarget: 15.0,
      pointsMultiplier: 2.0,
      linkedProductType: 'VIP_BUNDLE',
      isActive: true,
      sortOrder: 4,
    }
  ];

  for (const plan of plans) {
    await prisma.tradingCompetitionPlan.upsert({
      where: { planCode: plan.planCode },
      update: plan,
      create: plan,
    });
  }

  console.log('Seeding Demo Leaderboard Traders...');

  const topTraders = [
    {
      accountNumber: '928410',
      accountName: ' طارق الشمري',
      initialBalance: 50000,
      balance: 62450.80,
      equity: 63120.50,
      totalProfit: 12450.80,
      winRate: 82.5,
      tradesCount: 48,
      points: 2450,
      rank: 1,
      brokerServer: 'FXENGIN Raw Liquidity ECN',
    },
    {
      accountNumber: '817290',
      accountName: ' سارة المصري',
      initialBalance: 25000,
      balance: 31820.40,
      equity: 32050.00,
      totalProfit: 6820.40,
      winRate: 78.0,
      tradesCount: 36,
      points: 1980,
      rank: 2,
      brokerServer: 'FXENGIN Prime ECN',
    },
    {
      accountNumber: '739182',
      accountName: ' عمر الفاسي',
      initialBalance: 25000,
      balance: 30140.00,
      equity: 29980.00,
      totalProfit: 5140.00,
      winRate: 74.2,
      tradesCount: 29,
      points: 1620,
      rank: 3,
      brokerServer: 'FXENGIN Prime ECN',
    },
    {
      accountNumber: '648201',
      accountName: ' زياد الغامدي',
      initialBalance: 10000,
      balance: 13420.50,
      equity: 13420.50,
      totalProfit: 3420.50,
      winRate: 71.0,
      tradesCount: 22,
      points: 1380,
      rank: 4,
      brokerServer: 'FXENGIN Prime ECN',
    },
    {
      accountNumber: '592014',
      accountName: ' يوسف الدوسري',
      initialBalance: 10000,
      balance: 12890.00,
      equity: 12950.00,
      totalProfit: 2890.00,
      winRate: 69.5,
      tradesCount: 19,
      points: 1190,
      rank: 5,
      brokerServer: 'FXENGIN Prime ECN',
    }
  ];

  const firstPlan = await prisma.tradingCompetitionPlan.findFirst();

  for (const trader of topTraders) {
    await prisma.tradingAccount.upsert({
      where: { accountNumber: trader.accountNumber },
      update: {
        ...trader,
        planId: firstPlan?.id,
      },
      create: {
        ...trader,
        planId: firstPlan?.id,
        activationCode: `FXG-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'ACTIVE',
      },
    });
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
