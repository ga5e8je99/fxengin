/**
 * @file brokerService.js
 * Service for managing Brokers & Prop Trading Firms data from Admin Dashboard
 * Communicates with the main platform API (http://localhost:3000/api/brokers)
 * and maintains reactive LocalStorage synchronization.
 */

const MAIN_API_BASE = process.env.NEXT_PUBLIC_MAIN_SITE_URL || 'http://localhost:3000';
const STORAGE_KEY = 'fxengin_admin_brokers';

export const DEFAULT_BROKERS_DATA = [
  {
    id: 'xm',
    name: 'XM Global',
    category: 'forex',
    categoryLabelAr: 'وسيط فوركس وعقود فروقات مرخص عالمياً',
    categoryLabelEn: 'Multi-Regulated Global Forex & CFD Broker',
    badgeAr: 'الأكثر موثوقية عالمياً • فئة أولى Tier-1',
    badgeEn: 'Most Trusted Globally • Tier-1 Regulated',
    badgeColor: '#10B981',
    logo: '/assets/Images/brokers/xm.webp',
    logoBg: '#000000',
    rating: 4.95,
    clientsCount: '10M+ المتداولين',
    clientsCountEn: '10M+ Traders Worldwide',
    accentColor: '#10B981',
    glowBorder: 'rgba(16, 185, 129, 0.25)',
    descriptionAr:
      'الوسيط العالمي الرائد الحاصل على أرفع التراخيص الدولية (FCA، CySEC، ASIC). يوفر بيئة تداول فائقة الأمان مع عدم وجود إعادة تسعير وسبريد ضيق وتنفيذ صفقات بنسبة 99.35% في أقل من ثانية.',
    descriptionEn:
      'Industry-leading global broker with Tier-1 regulations (FCA, CySEC, ASIC). Zero re-quotes, tight spreads, and 99.35% of orders executed in under one second.',
    specs: [
      { labelAr: 'الحد الأدنى للإيداع', labelEn: 'Min Deposit', valueAr: '$5 فقط', valueEn: '$5 Only' },
      { labelAr: 'أقصى رافعة مالية', labelEn: 'Max Leverage', valueAr: 'تصل إلى 1:1000', valueEn: 'Up to 1:1000' },
      { labelAr: 'السبريد', labelEn: 'Spread', valueAr: 'من 0.6 نقطة (بدون عمولة)', valueEn: 'From 0.6 pips (Zero Commission)' },
      { labelAr: 'المنصات', labelEn: 'Platforms', valueAr: 'MT4, MT5, XM App, Web', valueEn: 'MT4, MT5, XM App, Web' },
      { labelAr: 'الحساب الإسلامي', labelEn: 'Islamic Account', valueAr: 'متوفر 100% (Swap-Free)', valueEn: '100% Swap-Free Available' },
      { labelAr: 'التراخيص الرقابية', labelEn: 'Licenses', valueAr: 'FCA, CySEC, ASIC, FSC', valueEn: 'FCA, CySEC, ASIC, FSC' },
    ],
    featuresAr: [
      'بونص ترحيبي 100% مضاعف للإيداع حتى 500$',
      'سحب وإيداع فوري بدون أي رسوم عبر البطاقات والمحافظ الرقمية',
      'حسابات إسلامية خالية تماماً من الفوائد الربوية ورسوم التبييت',
      'خادم VPS مجاني لأصحاب التداول الآلي والإكسبيرتات',
    ],
    featuresEn: [
      '100% Welcome Deposit Bonus up to $500',
      'Instant zero-fee deposits & withdrawals via Cards & Digital Wallets',
      'Fully certified swap-free Islamic accounts',
      'Free VPS hosting for algorithmic and EA traders',
    ],
    couponCode: 'KTW63',
    fxenginPerksAr: 'بونص ترحيبي 100% حتى $500 (كود الشريك: KTW63) + إشارات وتوصيات VIP مجانية فور الإيداع',
    fxenginPerksEn: '100% Welcome Deposit Bonus up to $500 (Partner Code: KTW63) + Free Lifetime VIP Signals Channel access',
    liveUrl: 'https://clicks.pipaffiliates.com/c?c=655286&l=ar&p=0',
    demoUrl: 'https://clicks.pipaffiliates.com/c?c=655286&l=ar&p=0',
    status: 'ACTIVE',
    order: 1,
  },
  {
    id: 'ywo',
    name: 'YWO Markets',
    category: 'forex',
    categoryLabelAr: 'وسيط ECN حديث بحسابات سبريد خام 0.0',
    categoryLabelEn: 'Ultra-Low Raw ECN Spread Broker',
    badgeAr: 'سبريد خام 0.0 • رافعة عالية وسرعة فائقة',
    badgeEn: '0.0 Raw Spreads • High Leverage Execution',
    badgeColor: '#00D06C',
    logo: '/assets/Images/brokers/ywo.webp',
    logoBg: '#02DA77',
    rating: 4.88,
    clientsCount: '150K+ متداول نشط',
    clientsCountEn: '150K+ Active Traders',
    accentColor: '#00D06C',
    glowBorder: 'rgba(0, 208, 108, 0.28)',
    descriptionAr:
      'وسيط تداول مبتكر يقدم أفضل شروط تنفيذ صفقات السكالبينج والتداول اليومي، مع سبريد خام يبدأ من 0.0 نقطة وسيولة بنكية مباشرة من كبرى المؤسسات المالية ومزودي السيولة العالميين.',
    descriptionEn:
      'Next-generation broker optimized for scalpers and day traders, offering raw spreads starting from 0.0 pips and direct institutional Tier-1 liquidity connectivity.',
    specs: [
      { labelAr: 'الحد الأدنى للإيداع', labelEn: 'Min Deposit', valueAr: '$10 فقط', valueEn: '$10 Only' },
      { labelAr: 'أقصى رافعة مالية', labelEn: 'Max Leverage', valueAr: 'تصل إلى 1:1000', valueEn: 'Up to 1:1000' },
      { labelAr: 'السبريد الخام', labelEn: 'Raw Spread', valueAr: 'يبدأ من 0.0 نقطة', valueEn: 'Starts from 0.0 pips' },
      { labelAr: 'المنصات', labelEn: 'Platforms', valueAr: 'MetaTrader 5 (MT5)', valueEn: 'MetaTrader 5 (MT5)' },
      { labelAr: 'سرعة التنفيذ', labelEn: 'Execution Speed', valueAr: 'أقل من 35 مللي ثانية', valueEn: '< 35 ms low latency' },
      { labelAr: 'التراخيص الرقابية', labelEn: 'Regulations', valueAr: 'FSCA, FSC, MISA', valueEn: 'FSCA, FSC, MISA' },
    ],
    featuresAr: [
      'سبريد خام 0.0 نقطة مخصص لسكالبينج الذهب والمؤشرات والعملات',
      'تنفيذ مباشر بدون غرفة مقاصة (STP/ECN No Dealing Desk)',
      'إيداع وسحب فوري عبر USDT (TRC20/ERC20) والتحويلات البنكية',
      'رافعة مالية مرنة تناسب جميع أحجام المحافظ الاستثمارية',
    ],
    featuresEn: [
      '0.0 Raw pip spreads tailored for Gold, Indices and Majors',
      'Direct Non-Dealing Desk (STP/ECN) market execution',
      'Instant USDT & local bank transfers deposits/withdrawals',
      'Flexible leverage suited for both small and large accounts',
    ],
    couponCode: '',
    fxenginPerksAr: 'خصم خاص 25% على عمولة التداول مدى الحياة + إشارات قناص الذهب اللحظية',
    fxenginPerksEn: '25% Lifetime commission rebate + Intraday Gold Scalper VIP signals',
    liveUrl: 'https://portal.ywo.com/links/go/5583',
    demoUrl: 'https://portal.ywo.com/links/go/5583',
    status: 'ACTIVE',
    order: 2,
  },
  {
    id: 'propxp',
    name: 'PropXP',
    category: 'prop',
    categoryLabelAr: 'شركة تمويل المتداولين المحترفين (Prop Firm)',
    categoryLabelEn: 'Leading Proprietary Funded Trader Firm',
    badgeAr: 'تمويل حتى $200,000 • نسبة أرباح تصل 95%',
    badgeEn: 'Funding up to $200K • Up to 95% Profit Split',
    badgeColor: '#00A3FF',
    logo: '/assets/Images/brokers/propxp.webp',
    logoBg: '#0E1528',
    rating: 4.92,
    clientsCount: 'تمويل أكثر من 50,000 حساب',
    clientsCountEn: '50,000+ Funded Accounts',
    accentColor: '#00A3FF',
    glowBorder: 'rgba(0, 163, 255, 0.25)',
    descriptionAr:
      'الخيار الأول للمتداولين الموهوبين الساعين لإدارة رؤوس أموال ضخمة بدون المخاطرة بأموالهم الخاصة. توفر برامج تقييم مرنة (1-Step أو 2-Step) أو تمويل فوري (Instant Funding) مع سحب أرباح قياسي وسريع.',
    descriptionEn:
      'The premier destination for skilled traders to manage substantial capital without personal downside risk. Features 1-Step, 2-Step evaluations and Instant Funding with rapid payout processing.',
    specs: [
      { labelAr: 'أحجام التمويل', labelEn: 'Account Sizes', valueAr: 'من $5,000 حتى $200,000', valueEn: '$5,000 to $200,000' },
      { labelAr: 'نسبة مشاركة الأرباح', labelEn: 'Profit Split', valueAr: 'من 80% حتى 95%', valueEn: '80% up to 95%' },
      { labelAr: 'نماذج التمويل', labelEn: 'Funding Models', valueAr: 'خطوة واحدة، خطوتين، وتمويل فوري', valueEn: '1-Step, 2-Step & Instant' },
      { labelAr: 'المنصات', labelEn: 'Trading Platform', valueAr: 'MetaTrader 5 (MT5)', valueEn: 'MetaTrader 5 (MT5)' },
      { labelAr: 'سرعة سحب الأرباح', labelEn: 'Payout Speed', valueAr: 'معالجة فورية خلال 24 ساعة عبر USDT', valueEn: 'Within 24 Hours via USDT' },
      { labelAr: 'أيام التداول', labelEn: 'Trading Days', valueAr: 'بدون حد أدنى في باقات مختارة', valueEn: 'No minimum days on select models' },
    ],
    featuresAr: [
      'تداول برأس مال يصل حتى 200,000 دولار واحتفظ بـ 95% من أرباحك',
      'شروط تراجع عادلة وشفافة وثابتة (Static Equity Drawdown)',
      'استرداد كامل لرسوم التحدي بنسبة 100% مع أول سحب للأرباح',
      'مسموح التداول وقت الأخبار والاحتفاظ بالصفقات خلال عطلة نهاية الأسبوع',
    ],
    featuresEn: [
      'Trade up to $200,000 capital and retain up to 95% of generated profits',
      'Transparent and static drawdown parameters',
      '100% refund of evaluation fees with your first payout',
      'News trading and weekend holding permitted',
    ],
    couponCode: 'ENG',
    fxenginPerksAr: 'كود خصم حصري على كافة الاختبارات (كوبون: ENG) + استرداد الرسوم 100%',
    fxenginPerksEn: 'Exclusive discount coupon (Code: ENG) + 100% Fee Refund',
    liveUrl: 'https://app.propxp.com/register?referral_id=85fdc2fcf727',
    demoUrl: 'https://app.propxp.com/register?referral_id=85fdc2fcf727',
    status: 'ACTIVE',
    order: 3,
  },
  {
    id: 'multibank',
    name: 'MultiBank Group',
    category: 'forex',
    categoryLabelAr: 'مجموعة مالية رائدة عالمياً حاصلة على أكثر من 14 ترخيصاً',
    categoryLabelEn: 'Multi-Regulated Global Financial Derivatives Group',
    badgeAr: 'تأسست 2005 • أكثر من 14 ترخيصاً دولياً',
    badgeEn: 'EST. 2005 • 14+ Global Tier-1 Regulations',
    badgeColor: '#D4AF37',
    logo: '/assets/Images/brokers/multibank.webp',
    logoBg: '#FFFFFF',
    rating: 4.93,
    clientsCount: '1M+ متداول حول العالم',
    clientsCountEn: '1M+ Clients Worldwide',
    accentColor: '#C5A059',
    glowBorder: 'rgba(197, 160, 89, 0.28)',
    descriptionAr:
      'مجموعة MultiBank Group إحدى أضخم وأعرق المؤسسات المالية للمشتقات في العالم منذ عام 2005، برأس مال مدفوع يتجاوز 322 مليون دولار وأكثر من 14 ترخيصاً دولياً (ASIC، BaFin، SCA، CIMA). سبريد خام يبدأ من 0.0 نقطة وأمان مصرفي كامل لأموال العملاء.',
    descriptionEn:
      'Established in 2005, MultiBank Group is one of the largest global financial institutions with over $322M paid-up capital and 14+ tier-1 regulators (ASIC, BaFin, SCA). Ultra-low raw spreads from 0.0 pips with institutional segregated security.',
    specs: [
      { labelAr: 'الحد الأدنى للإيداع', labelEn: 'Min Deposit', valueAr: '$50 فقط', valueEn: '$50 Only' },
      { labelAr: 'أقصى رافعة مالية', labelEn: 'Max Leverage', valueAr: 'تصل إلى 1:500', valueEn: 'Up to 1:500' },
      { labelAr: 'السبريد', labelEn: 'Spread', valueAr: 'يبدأ من 0.0 نقطة على ECN', valueEn: 'From 0.0 pips on ECN' },
      { labelAr: 'المنصات', labelEn: 'Platforms', valueAr: 'MT4, MT5, MultiBank-Plus', valueEn: 'MT4, MT5, MultiBank-Plus' },
      { labelAr: 'الحساب الإسلامي', labelEn: 'Islamic Account', valueAr: 'خالٍ تماماً من الفوائد الربوية', valueEn: '100% Certified Swap-Free' },
      { labelAr: 'التراخيص الرقابية', labelEn: 'Regulations', valueAr: 'ASIC, BaFin, FMA, SCA, CIMA', valueEn: 'ASIC, BaFin, FMA, SCA, CIMA' },
    ],
    featuresAr: [
      'أكثر من 14 هيئة رقابية معتمدة تضمن أقصى معايير الأمان المالي',
      'بونص إيداع ترحيبي 20% مضاعف لقوة التداول الشرائية',
      'حسابات إسلامية خالية تماماً من رسوم التبييت والسواب',
      'تنفيذ فوري للأوامر بنسبة 100% بدون إعادة تسعير أو غرفة مقاصة',
    ],
    featuresEn: [
      'Regulated by 14+ prestigious international financial authorities',
      '20% Deposit Bonus to boost your trading leverage',
      'Certified 100% swap-free Islamic trading accounts',
      '100% instant market execution with zero slippage or requotes',
    ],
    couponCode: '7711309',
    fxenginPerksAr: 'بونص إيداع 20% إضافي (رقم الشريك: 7711309) + تأمين كامل للمحفظة + وصول فوري مجاني لقناة إشارات الـ VIP',
    fxenginPerksEn: '20% Deposit Bonus (Partner IB: 7711309) + Capital Protection + Free Lifetime VIP Signals access',
    liveUrl: 'https://multibankfx.com/account/live-account?ibNum=7711309',
    demoUrl: 'https://multibankfx.com/account/live-account?ibNum=7711309',
    status: 'ACTIVE',
    order: 4,
  },
  {
    id: 'hfm',
    name: 'HFM (HF Markets)',
    category: 'forex',
    categoryLabelAr: 'وسيط عالمي رائد حائز على أكثر من 60 جائزة دولية',
    categoryLabelEn: 'Multi-Award Winning Global Broker (FCA, CySEC, DFSA)',
    badgeAr: 'بدون حد أدنى للإيداع • رافعة تصل 1:2000',
    badgeEn: 'Zero Min Deposit • Leverage up to 1:2000',
    badgeColor: '#10B981',
    logo: '/assets/Images/brokers/hfm.webp',
    logoBg: '#000000',
    rating: 4.90,
    clientsCount: '3.5M+ حساب نشط',
    clientsCountEn: '3.5M+ Active Accounts',
    accentColor: '#10B981',
    glowBorder: 'rgba(16, 185, 129, 0.25)',
    descriptionAr:
      'وسيط مالي عالمي مرموق منذ 2010 مع أكثر من 3.5 مليون متداول حول العالم وتراخيص كبرى من بريطانيا (FCA)، قبرص (CySEC)، ودبي (DFSA). يوفر حسابات Zero Spread بسبريد منعدم وبدون حد أدنى للإيداع وسرعة سحب فورية.',
    descriptionEn:
      'Trusted by over 3.5 million traders worldwide since 2010. Multi-regulated by FCA (UK), CySEC, and DFSA. Features Zero Spread accounts with zero minimum deposit and rapid automated withdrawals.',
    specs: [
      { labelAr: 'الحد الأدنى للإيداع', labelEn: 'Min Deposit', valueAr: '$0 (بدون حد أدنى)', valueEn: '$0 (Zero Minimum)' },
      { labelAr: 'أقصى رافعة مالية', labelEn: 'Max Leverage', valueAr: 'تصل إلى 1:2000', valueEn: 'Up to 1:2000' },
      { labelAr: 'السبريد', labelEn: 'Spread', valueAr: 'Zero Spread يبدأ من 0.0 نقطة', valueEn: 'Zero Spread from 0.0 pips' },
      { labelAr: 'المنصات', labelEn: 'Platforms', valueAr: 'MT4, MT5, HFM App, Web', valueEn: 'MT4, MT5, HFM App, Web' },
      { labelAr: 'الحساب الإسلامي', labelEn: 'Islamic Account', valueAr: 'متوفر بدون فوائد تبييت', valueEn: 'Available (Swap-Free)' },
      { labelAr: 'التراخيص الرقابية', labelEn: 'Regulations', valueAr: 'FCA, CySEC, FSCA, DFSA, CMA', valueEn: 'FCA, CySEC, FSCA, DFSA, CMA' },
    ],
    featuresAr: [
      'بدون حد أدنى للإيداع - ابدأ التداول بأي مبلغ يناسب خطتك',
      'رافعة مالية مرنة وقوية تصل حتى 1:2000 لتعظيم العوائد',
      'تأمين أموال العملاء بحماية إضافية ضد الرصيد السلبي',
      'تطبيق تداول مخصص ومتطور حائز على جوائز الابتكار التقني',
    ],
    featuresEn: [
      'Zero minimum deposit - trade on your own terms with any budget',
      'Flexible leverage up to 1:2000 for maximized trading power',
      'Civil liability insurance and negative balance protection',
      'Award-winning native mobile trading app with built-in tools',
    ],
    couponCode: '',
    fxenginPerksAr: 'استرداد كاش باك حتى 2$ لكل لوت + بونص تداول 20% ووصول كامل لجميع كورسات الأكاديمية',
    fxenginPerksEn: 'Up to $2/lot cashback rebate + 20% Top-Up bonus and full FXENGIN Academy access',
    liveUrl: 'https://www.hfm.com',
    demoUrl: 'https://www.hfm.com',
    status: 'ACTIVE',
    order: 5,
  },
  {
    id: 'doo-prime',
    name: 'Doo Prime',
    category: 'forex',
    categoryLabelAr: 'وسيط فوركس وعقود فروقات مرخص عالمياً',
    categoryLabelEn: 'Multi-Regulated Global Forex & CFD Broker',
    badgeAr: 'الأكثر موثوقية عالمياً • فئة أولى Tier-1',
    badgeEn: 'Most Trusted Globally • Tier-1 Regulated',
    badgeColor: '#10B981',
    logo: '/assets/Images/brokers/dooprime.svg',
    logoBg: '#FFFFFF',
    rating: 4.95,
    clientsCount: 'تنوع ضخم +10,000 أداة • دعم TradingView وبونص 100%',
    clientsCountEn: '10,000+ Instruments • TradingView & 100% Bonus',
    accentColor: '#10B981',
    glowBorder: 'rgba(16, 185, 129, 0.25)',
    descriptionAr:
      'وسيط مالي دولي رائد منذ 2014 مع أكثر من 130,000 عميل وتراخيص كبرى من بريطانيا (FCA)، أستراليا (ASIC)، وسيشيل (FSA). يوفر سبريد فائق الانخفاض يبدأ من 0.0 نقطة ورافعة مالية تصل إلى 1:1000 مع ربط مباشر بمنصة TradingView.',
    descriptionEn:
      'Leading international broker established in 2014, multi-regulated by FCA, ASIC, and FSA. Features raw spreads from 0.0 pips, up to 1:1000 leverage, and direct TradingView platform integration.',
    specs: [
      { labelAr: 'الحد الأدنى للإيداع', labelEn: 'Min Deposit', valueAr: '$10 فقط', valueEn: '$10 Only', val: '$10' },
      { labelAr: 'أقصى رافعة مالية', labelEn: 'Max Leverage', valueAr: 'تصل إلى 1:1000', valueEn: 'Up to 1:1000', val: '1:1000' },
      { labelAr: 'السبريد', labelEn: 'Spread', valueAr: 'يبدأ من 0.0 نقطة', valueEn: 'From 0.0 pips', val: '0.0 Pip' },
      { labelAr: 'المنصات', labelEn: 'Platforms', valueAr: 'MT4, MT5, TradingView, Web', valueEn: 'MT4, MT5, TradingView, Web', val: 'MT4 / MT5 / TV' },
      { labelAr: 'الحساب الإسلامي', labelEn: 'Islamic Account', valueAr: 'متوفر 100% (Swap-Free)', valueEn: '100% Swap-Free Available', val: 'Swap-Free' },
      { labelAr: 'التراخيص الرقابية', labelEn: 'Regulations', valueAr: 'FCA, ASIC, FSA, FSC', valueEn: 'FCA, ASIC, FSA, FSC', val: 'FCA, ASIC' },
    ],
    featuresAr: [
      'سبريد خام يبدأ من 0.0 نقطة لسكالبينج الذهب والعملات',
      'دعم وربط كامل ومباشر مع حسابات TradingView الرسمية',
      'رافعة مالية مرنة وقوية تصل حتى 1:1000',
      'سحب وإيداع فوري وآلي بدون أي رسوم لمتداولي المنظومة',
    ],
    featuresEn: [
      'Ultra-low raw spreads starting from 0.0 pips for Gold & FX',
      'Full direct integration with official TradingView charts & accounts',
      'Flexible leverage up to 1:1000 for maximized market positioning',
      'Instant automated deposits and withdrawals with 0% extra fees',
    ],
    couponCode: 'DOO-FXENG',
    fxenginPerksAr: 'بونص إيداع إضافي + إشارات وتوصيات VIP مجانية فور الإيداع (كود: DOO-FXENG)',
    fxenginPerksEn: 'Exclusive Deposit Bonus + Instant VIP Signals access (Code: DOO-FXENG)',
    liveUrl: 'https://user.dooprime.com/register',
    demoUrl: 'https://user.dooprime.com/register',
    status: 'ACTIVE',
    order: 6,
  },
];

/**
 * Fetch list of brokers from local API, fallback to main site or localStorage
 */
export async function getBrokersList() {
  // 1. Try local admin API
  try {
    const res = await fetch('/api/brokers', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(json.data));
        }
        return json.data;
      }
    }
  } catch (err) {
    console.warn('Network error reaching local /api/brokers:', err);
  }

  // 2. Try main site API fallback
  try {
    const res = await fetch(`${MAIN_API_BASE}/api/brokers`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(json.data));
        }
        return json.data;
      }
    }
  } catch (err) {
    // silent
  }

  // 3. Fallback to localStorage
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {}
    }
  }

  return DEFAULT_BROKERS_DATA;
}

/**
 * Add a new broker
 */
export async function createBroker(brokerData) {
  let created = null;

  // 1. Post to local admin API (writes directly to shared data)
  try {
    const res = await fetch('/api/brokers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(brokerData),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success) created = json.data;
    }
  } catch (err) {
    console.warn('Failed to call local POST /api/brokers:', err);
  }

  // 2. Also sync to main site API if available
  try {
    const res = await fetch(`${MAIN_API_BASE}/api/brokers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(brokerData),
    });

    if (res.ok && !created) {
      const json = await res.json();
      if (json.success) created = json.data;
    }
  } catch (err) {
    // optional
  }

  if (created) {
    const list = await getBrokersList();
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }
    return { success: true, data: created };
  }

  // Fallback offline add
  const list = await getBrokersList();
  const newBroker = {
    id: brokerData.id || `broker-${Date.now()}`,
    ...brokerData,
    status: brokerData.status || 'ACTIVE',
    order: list.length + 1,
  };
  const updated = [...list, newBroker];
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
  return { success: true, data: newBroker };
}

/**
 * Update an existing broker
 */
export async function updateBroker(brokerData) {
  let updatedData = null;

  try {
    const res = await fetch('/api/brokers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(brokerData),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success) updatedData = json.data;
    }
  } catch (err) {
    console.warn('Failed to call local PUT /api/brokers:', err);
  }

  try {
    await fetch(`${MAIN_API_BASE}/api/brokers`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(brokerData),
    });
  } catch (err) {
    // optional
  }

  const list = await getBrokersList();
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }
  return { success: true, data: updatedData || brokerData };
}

/**
 * Delete a broker by ID
 */
export async function deleteBroker(id) {
  let deleted = false;

  try {
    const res = await fetch(`/api/brokers?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success) deleted = true;
    }
  } catch (err) {
    console.warn('Failed to call local DELETE /api/brokers:', err);
  }

  try {
    await fetch(`${MAIN_API_BASE}/api/brokers?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
    });
  } catch (err) {
    // optional
  }

  const list = await getBrokersList();
  const updated = list.filter((b) => b.id !== id && b.brokerSlug !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
  return { success: true, deletedId: id };
}

/**
 * Reset list to default initial seed
 */
export async function resetBrokersToDefault() {
  try {
    const res = await fetch(`${MAIN_API_BASE}/api/brokers`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(DEFAULT_BROKERS_DATA),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_BROKERS_DATA));
        }
        return { success: true, data: DEFAULT_BROKERS_DATA };
      }
    }
  } catch (err) {
    console.warn('Failed to call PUT reset /api/brokers:', err);
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_BROKERS_DATA));
  }
  return { success: true, data: DEFAULT_BROKERS_DATA };
}

/**
 * Fetch Broker Partner Popup Configuration
 */
export async function getBrokerPopupConfig() {
  try {
    const res = await fetch('/api/brokers/popup-config', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (res.ok) {
      const json = await res.json();
      return json;
    }
  } catch (err) {
    console.warn('Failed to fetch /api/brokers/popup-config locally, trying main site:', err);
  }

  try {
    const res = await fetch(`${MAIN_API_BASE}/api/brokers/popup-config`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Failed to fetch popup config from main site:', err);
  }

  return {
    success: true,
    config: {
      isEnabled: true,
      intervalSeconds: 60,
      mode: 'rotate',
      selectedBrokerId: 'xm',
      headlineAr: 'فرصة تداول حصرية عبر شركاء FXEngin المعتمدين',
      headlineEn: 'Exclusive Trading Opportunity via FXEngin Verified Partners',
      subheadlineAr: 'احصل على بونص إيداع 100% وحسابات إسلامية خالية من الفوائد مع وصول فوري لتوصيات وتحليلات مهندس الفوركس',
      subheadlineEn: 'Claim 100% deposit bonus and swap-free Islamic accounts with instant access to VIP signals',
      badgeAr: 'شريك وساطة رسمي معتمد • فئة أولى Tier-1',
      badgeEn: 'Official Verified Partner • Tier-1 Regulated',
      ctaTextAr: 'افتح حساب حقيقي الآن',
      ctaTextEn: 'Open Live Account Now',
      demoBtnTextAr: 'حساب تجريبي مجاني',
      demoBtnTextEn: 'Free Demo Account',
      allowDismissMinutes: 1,
    },
    brokers: DEFAULT_BROKERS_DATA,
  };
}

/**
 * Update Broker Partner Popup Configuration
 */
export async function updateBrokerPopupConfig(newConfig) {
  let result = null;
  // 1. Try local admin API
  try {
    const res = await fetch('/api/brokers/popup-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(newConfig),
    });
    if (res.ok) {
      result = await res.json();
    }
  } catch (err) {
    console.warn('Failed to post /api/brokers/popup-config locally:', err);
  }

  // 2. Also broadcast/sync to main site API
  try {
    const res = await fetch(`${MAIN_API_BASE}/api/brokers/popup-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(newConfig),
    });
    if (res.ok && !result) {
      result = await res.json();
    }
  } catch (err) {
    // optional sync
  }

  if (result) return result;
  return { success: false, error: 'تعذر حفظ الإعدادات' };
}

