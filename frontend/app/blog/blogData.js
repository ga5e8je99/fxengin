/**
 * @file blogData.js
 * @description Comprehensive Blog & Article Datasets for FXENGIN
 * Contains full in-depth articles, sections, key takeaways, and author profiles.
 */

export const CATEGORIES = [
  { key: 'all', labelAr: 'جميع المقالات', labelEn: 'All Articles' },
  { key: 'strategies', labelAr: 'استراتيجيات التداول', labelEn: 'Trading Strategies' },
  { key: 'technical', labelAr: 'التحليل الفني', labelEn: 'Technical Analysis' },
  { key: 'risk', labelAr: 'إدارة المخاطر', labelEn: 'Risk Management' },
  { key: 'algo', labelAr: 'الذكاء الاصطناعي والتداول الآلي', labelEn: 'Algo & AI' },
  { key: 'psychology', labelAr: 'سيكولوجية التداول', labelEn: 'Psychology' },
];
import initialArticles from '../../data/articles.json';

export const BLOG_POSTS = Array.isArray(initialArticles) && initialArticles.length > 0 ? initialArticles : [
  {
    id: 1,
    slug: 'forex-strategies-beginners-2026',
    category: 'استراتيجيات التداول',
    categoryEn: 'Trading Strategies',
    categoryKey: 'strategies',
    titleAr: 'أفضل 5 استراتيجيات لتداول الفوركس للمبتدئين في عام 2026',
    titleEn: 'Top 5 Forex Trading Strategies for Beginners in 2026',
    excerptAr: 'دليل شامل ومفصل يوضح لك أهم الاستراتيجيات المجربة لتحقيق أرباح مستدامة مع إدارة المخاطر وتحديد نقاط الدخول والخروج بدقة.',
    excerptEn: 'A comprehensive guide explaining proven strategies for sustainable profitability, risk management, and precise entry/exit setups.',
    authorAr: 'م. سليمان داود',
    authorEn: 'Eng. Sleman Daowed',
    authorRoleAr: 'كبير محللي الأسواق',
    authorRoleEn: 'Chief Market Strategist',
    authorImg: '/assets/Images/Avatar/avatar1.webp',
    authorBioAr: 'خبير أسواق مالية ومحلل فني معتمد بخبرة تزيد عن 14 عاماً في تداول العملات والسلع وإدارة المحافظ الاستثمارية.',
    authorBioEn: 'Certified financial analyst & market strategist with 14+ years of trading experience across global FX, commodities, and asset management.',
    dateAr: '28 أغسطس 2026',
    dateEn: 'Aug 28, 2026',
    readTimeAr: '7 دقائق قراءة',
    readTimeEn: '7 min read',
    featured: true,
    views: '14.2K',
    tags: ['Forex', 'Scalping', 'Risk Management', 'Breakouts'],
    accentColor: '#0488F8',
    coverImage: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80',
    chartImage: 'https://s3.tradingview.com/g/GDmMa9ci_big.png',
    videoUrl: 'https://www.youtube.com/watch?v=kXYiU_JCYtU',
    links: [
      {
        titleAr: 'قناة التلجرام الرسمية للتحليلات اللحظية',
        titleEn: 'Official Telegram Channel for Live Analysis',
        url: 'https://t.me/fxengin',
        type: 'telegram',
      },
      {
        titleAr: 'تحميل ملف مؤشر EMA Ribbon & Support Zones (MT5)',
        titleEn: 'Download EMA Ribbon & Support Zones Indicator (MT5)',
        url: 'https://fxengin.com/tools/ema-ribbon.zip',
        type: 'download',
      },
      {
        titleAr: 'دليل أكاديمية FXENGIN لإدارة المخاطر وحساب اللوت',
        titleEn: 'FXENGIN Academy: Risk Management & Lot Size Guide',
        url: 'https://fxengin.com/academy/risk-management',
        type: 'article',
      },
    ],
    keyTakeawaysAr: [
      'التداول بالاتجاه العام (Trend Following) هو الخيار الأكثر أماناً والأعلى احتمالية للمتداول المبتدئ.',
      'تحديد مستويات الدعم والمقاومة الديناميكية باستخدام المتوسطات المتحركة EMA 50 و EMA 200.',
      'ضرورة ألا تتجاوز نسبة المخاطرة في الصفقة الواحدة 1% إلى 1.5% من إجمالي رأس المال.',
      'أهمية انتظار تأكيد الإغلاق الشمعي (Candle Close) قبل الدخول لتفادي الاختراقات الكاذبة.',
    ],
    keyTakeawaysEn: [
      'Trend following provides the highest probability edge for novice traders.',
      'Identify dynamic support and resistance using 50 and 200 EMA ribbons.',
      'Never exceed a 1% to 1.5% risk parameter per trade execution.',
      'Always wait for confirmed candlestick closes to filter out fake breakouts.',
    ],
    sections: [
      {
        id: 'intro',
        headingAr: '1. مقدمة: لماذا تفشل الاستراتيجيات المعقدة؟',
        headingEn: '1. Introduction: Why Overcomplicated Systems Fail',
        bodyAr: `يعتقد الكثير من المبتدئين في سوق الفوركس أن النجاح يتطلب شاشات مليئة بالعشرات من المؤشرات الفنية المعقدة. في الواقع، يكمن السر في البساطة (Price Action) وفهم تدفق السيولة وإدارة رأس المال.

في هذا الدليل، سنستعرض 5 استراتيجيات أثبتت كفاءتها في أسواق 2026، حيث أصبحت الأسواق تتسم بسرعة السيولة وتأثير الخوارزميات الآلية.`,
        bodyEn: `Many beginners assume that trading mastery requires multiple overlapping complex indicators. In reality, sustained edge stems from pure Price Action, liquidity understanding, and disciplined capital preservation.

Here we review the top 5 proven strategies optimized for 2026 high-speed algorithmic market structures.`,
        tipAr: 'لا تضف مؤشراً إلى الشارت إلا إذا كان يجيبك عن سؤال محدد: هل السوق في اتجاه أم تذبذب؟',
        tipEn: 'Never add an indicator unless it answers a specific question: is the market trending or consolidating?',
      },
      {
        id: 'strategy-1',
        headingAr: '2. استراتيجية تتبع الاتجاه مع المتوسطات المتحركة (EMA Ribbon)',
        headingEn: '2. Trend Following via Exponential Moving Averages (EMA)',
        bodyAr: `تعتمد هذه الاستراتيجية على استخدام متوسطين متحركين أسيين: EMA 20 و EMA 50.

- **شرط الشراء**: عندما يكون EMA 20 أعلى من EMA 50، ويتراجع السعر ليلامس منطقة الفراغ بينهما مع ظهور شمعة انعكاسية صاعدة (Hammer أو Bullish Engulfing).
- **شرط البيع**: عندما يكون EMA 20 أدنى من EMA 50، ويرتد السعر للأعلى ليعيد اختبار المتوسطات مع ظهور شمعة هابطة (Shooting Star).
- **وقف الخسارة (Stop Loss)**: يوضع أسفل أو أعلى الشمعة الانعكاسية بـ 5 إلى 10 نقاط.
- **جني الأرباح (Take Profit)**: عند ضعف المسافة بين السعر ووقف الخسارة (Risk/Reward 1:2 على الأقل).`,
        bodyEn: `This system leverages two dynamic benchmarks: the 20 EMA and 50 EMA.

- **Long Setup**: 20 EMA crosses above 50 EMA. Wait for price pullbacks into the dynamic value zone between both averages with a bullish reversal candlestick.
- **Short Setup**: 20 EMA trades below 50 EMA. Wait for an upward retest of the value zone and an engulfing rejection candle.
- **Stop Loss**: 5-10 pips beyond the reversal swing candle.
- **Target**: Minimum 1:2 Risk-to-Reward ratio.`,
        tipAr: 'تجنب تطبيق هذه الاستراتيجية قبل صدور الأخبار الاقتصادية الكبرى مثل تقرير الوظائف غير الزراعية (NFP) أو قرارات الفائدة.',
        tipEn: 'Avoid trend execution immediately before tier-1 macroeconomic releases such as NFP or FOMC rate decisions.',
      },
      {
        id: 'strategy-2',
        headingAr: '3. استراتيجية كسر وإعادة اختبار نطاقات السيولة (Break & Retest)',
        headingEn: '3. Breakout & Pullback Retest Strategy',
        bodyAr: `تعتبر استراتيجية الكسر وإعادة الاختبار (Break & Retest) من أقوى نماذج السلوك السعري. عندما يتحرك السعر داخل نطاق عرضي (Range) بين دعم ومقاومة واضحين، فإن الخروج من هذا النطاق يولد زخماً كبيراً.

القاعدة الذهبية هنا هي: **لا تشترِ لحظة الكسر المباشرة، بل انتظر إعادة الاختبار والتأكيد.**`,
        bodyEn: `The break and retest model is an institutional staple. When market price consolidates between distinct structural support and resistance levels, expansion delivers massive velocity.

The cardinal rule: **never chase the immediate breakout spike; execute strictly upon confirmed retests.**`,
        tipAr: 'إعادة الاختبار الناجحة غالباً ما تتزامن مع تراجع في حجم التداول، يليه انفجار في الزخم مع بداية الحركة الرئيسية.',
        tipEn: 'Healthy retests typically exhibit lower volume during pullbacks followed by immediate momentum surges.',
      },
      {
        id: 'strategy-3',
        headingAr: '4. استراتيجية تداول افتتاح جلسة لندن (London Open Breakout)',
        headingEn: '4. London Open Session Breakout',
        bodyAr: `تعتبر جلسة لندن المصدر الأساسي لأكثر من 35% من سيولة الفوركس اليومية. قبل افتتاح لندن (خلال الفترة الآسيوية)، يتحرك السوق غالباً في نطاق ضيق.

مع افتتاح بورصة لندن (الساعة 08:00 بتوقيت لندن / 10:00 بتوقيت مكة):
1. حدد أعلى وأدنى سعر للجلسة الآسيوية (Asian High & Low).
2. ترقب اختراق أحد المستويين بإغلاق شمعة 15 دقيقة واضحة.
3. ادخل في اتجاه الكسر واستهدف سيولة قمم وقيعان اليوم السابق.`,
        bodyEn: `London open captures over 35% of daily FX volume. During the Asian session, pairs such as EUR/USD and GBP/USD trade within tight consolidation bands.

At 08:00 London Time:
1. Mark the exact Asian session High and Low.
2. Monitor breakout closures on the 15-minute timeframe.
3. Ride the directional impulse targeting previous day liquidity levels.`,
        tipAr: 'أزواج العملات الأنسب لهذه الاستراتيجية هي: GBP/USD, EUR/USD, GBP/JPY.',
        tipEn: 'Optimal instruments for session breakouts include GBP/USD, EUR/USD, and GBP/JPY.',
      },
      {
        id: 'conclusion',
        headingAr: '5. الخلاصة وخطة العمل للمتداول',
        headingEn: '5. Actionable Roadmap & Summary',
        bodyAr: `الاستراتيجية الرابحة ليست سراً خارقاً، بل هي مزيج من:
1. **احتمالية رياضية إيجابية (Positive Expectancy)** عبر الالتزام بنسبة عائد لمخاطرة 1:2 فما فوق.
2. **انضباط حديدي** بتسجيل كل صفقة في دفتر التداول (Trading Journal).
3. **تطبيق الاستراتيجية على حساب تجريبي (Demo)** لمدة لا تقل عن 60 صفقة قبل الانتقال للحساب الحقيقي.`,
        bodyEn: `Consistent trading is built on 3 foundational pillars:
1. **Positive Mathematical Expectancy** by adhering to minimum 1:2 R:R ratios.
2. **Rigorous documentation** within a disciplined Trading Journal.
3. **Demo backtesting** for a minimum sample size of 60 trades before committing live funds.`,
      },
    ],
    faqs: [
      {
        qAr: 'كم من الوقت أحتاج لإتقان إحدى هذه الاستراتيجيات؟',
        qEn: 'How long does it take to master one of these strategies?',
        aAr: 'يحتاج معظم المتداولين من 4 إلى 8 أسابيع من التدريب العملي اليومي وتدوين الملاحظات لفهم إشارات الاستراتيجية وفلترة الصفقات غير المجدية.',
        aEn: 'Most traders require 4 to 8 weeks of deliberate practice and journaling to intuitively filter high-probability setups.',
      },
      {
        qAr: 'ما هو رأس المال المناسب للبدء في تداول الفوركس؟',
        qEn: 'What is an optimal starting capital for forex?',
        aAr: 'يمكن البدء بمبلغ يتراوح بين 250$ إلى 1,000$ باستخدام حسابات المايكرو، مع الالتزام بألا تخاطر بأكثر من 1% من الرصيد في كل صفقة.',
        aEn: 'You can start with $250 to $1,000 on micro accounts, ensuring your risk per trade strictly remains under 1%.',
      },
    ],
  },
  {
    id: 2,
    slug: 'smart-money-concepts-smc-guide',
    category: 'التحليل الفني',
    categoryEn: 'Technical Analysis',
    categoryKey: 'technical',
    titleAr: 'أسرار استراتيجية Smart Money Concepts (SMC) وتتبع الحيتان',
    titleEn: 'Smart Money Concepts (SMC): Tracking Institutional Liquidity',
    excerptAr: 'كيف تكتشف مناطق تجميع وتصريف كبار صناع السوق والبنوك المركزية واستغلال فجوات السيولة (Fair Value Gaps) في صفقاتك.',
    excerptEn: 'Learn how to detect institutional accumulation, order blocks, and exploit Fair Value Gaps (FVG) like top hedge funds.',
    authorAr: 'م. سليمان داود',
    authorEn: 'Eng. Sleman Daowed',
    authorRoleAr: 'كبير محللي الأسواق',
    authorRoleEn: 'Chief Market Strategist',
    authorImg: '/assets/Images/Avatar/avatar2.webp',
    authorBioAr: 'باحثة في الاقتصاد المالي ومحللة هيكلية معتمدة متخصصة في سلوك السيولة المؤسسية وتدفق أوامر البنوك المركزية.',
    authorBioEn: 'Financial economist and market structure specialist focusing on institutional liquidity pools and central bank order flow.',
    dateAr: '27 أغسطس 2026',
    dateEn: 'Aug 27, 2026',
    readTimeAr: '9 دقائق قراءة',
    readTimeEn: '9 min read',
    featured: false,
    views: '11.8K',
    tags: ['SMC', 'Order Blocks', 'Liquidity', 'FVG'],
    accentColor: '#16C784',
    coverImage: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=1200&q=80',
    chartImage: 'https://s3.tradingview.com/g/GDmMa9ci_big.png',
    videoUrl: 'https://www.youtube.com/watch?v=0X2aIe8bK_Q',
    links: [
      {
        titleAr: 'مجتمع متداولي السيولة ومفاهيم SMC على تلجرام',
        titleEn: 'Institutional SMC Community on Telegram',
        url: 'https://t.me/fxengin_smc',
        type: 'telegram',
      },
      {
        titleAr: 'مؤشر كشف فجوات السيولة Fair Value Gap (FVG)',
        titleEn: 'Fair Value Gap (FVG) Detector Indicator',
        url: 'https://fxengin.com/tools/fvg-indicator.ex5',
        type: 'indicator',
      },
    ],
    keyTakeawaysAr: [
      'فهم هيكل السوق عبر كسر الهيكل (Break of Structure - BOS) وتغير الشخصية (Change of Character - CHoCH).',
      'تحديد الكتل السعرية المؤسسية (Order Blocks) التي يضع فيها صناع السوق أوامرهم الضخمة.',
      'استغلال فجوات القيمة العادلة (Fair Value Gaps - FVG) كمناطق جذب سريعة لإعادة التوازن السعري.',
      'تجنب مصائد السيولة (Liquidity Grabs) التي تستهدف ضرب نقاط وقف خسارة المتداولين الأفراد.',
    ],
    keyTakeawaysEn: [
      'Master market structure shifts through Break of Structure (BOS) and Change of Character (CHoCH).',
      'Pinpoint institutional Order Blocks containing resting bank liquidity.',
      'Exploit Fair Value Gaps (FVG) as dynamic magnet zones for price rebalancing.',
      'Evade retail liquidity sweep traps before real moves unfold.',
    ],
    sections: [
      {
        id: 'smc-intro',
        headingAr: '1. ما هي منهجية SMC وما الذي يميزها عن التحليل التقليدي؟',
        headingEn: '1. What is SMC and How Does It Differ from Traditional TA?',
        bodyAr: `تعتمد منهجية أموال المؤسسات (Smart Money Concepts) على حقيقة بسيطة: البنوك الكبرى وصناديق التحوط لا تتداول بناءً على خطوط التريند أو نماذج الرأس والكتفين البسيطة، بل تتداول بناءً على **السيولة (Liquidity)**.

لكي يقوم بنك بشراء 10,000 عقد من زوج EUR/USD، فإنه يحتاج إلى بائعين مستعدين لبيع تلك الكمية. هؤلاء البائعون هم متداولو التجزئة الذين يضعون أوامر وقف الخسارة أسفل القيعان الواضحة.`,
        bodyEn: `Smart Money Concepts (SMC) is founded on a core market reality: central institutions and liquidity providers do not trade retail trendlines. They trade **Liquidity Pools**.

To buy 10,000 lots of EUR/USD, an institution requires counterpart sellers—usually retail stop losses clustered below obvious support swings.`,
        tipAr: 'عندما ترى قاعين متساويين تماماً (Equal Lows)، اعلم أن تحتهما تتركز أوامر سيولة ضخمة سيقوم صانع السوق بسحبها قبل الصعود.',
        tipEn: 'Equal Lows signify engineered liquidity clusters waiting to be swept before the real upward impulse occurs.',
      },
      {
        id: 'smc-fvg',
        headingAr: '2. فجوة القيمة العادلة (Fair Value Gap - FVG)',
        headingEn: '2. Fair Value Gap (FVG) Mechanics',
        bodyAr: `تحدث فجوة FVG عندما يتحرك السعر بسرعة فائقة في اتجاه واحد عبر ثلاث شمعات متتالية:
- الشمعة 1 (الشمعة السابقة للاندفاع).
- الشمعة 2 (شمعة الزخم العملاقة).
- الشمعة 3 (الشمعة التالية).

إذا كانت هناك مسافة فارغة بين ذيل الشمعة 1 وذيل الشمعة 3، فهذه هي الـ FVG. يعود السعر إليها بنسبة تفوق 80% لإعادة التوازن وتقديم فرصة دخول ممتازة.`,
        bodyEn: `A Fair Value Gap represents an imbalance formed across a 3-candlestick sequence where candle 2 delivers violent expansion, leaving an unfilled price void between candle 1's wick and candle 3's wick.

The market algorithms seek to rebalance this inefficiency, offering precise high-confluence re-entry points.`,
        tipAr: 'أقوى فجوات FVG هي تلك التي تتشكل تزامناً مع كسر هيكل سعري رئيسي (BOS).',
        tipEn: 'The highest quality FVGs occur concurrently with valid structural market breaks (BOS).',
      },
    ],
    faqs: [
      {
        qAr: 'هل تعمل منهجية SMC على الفريمات الصغيرة مثل 1 دقيقة؟',
        qEn: 'Does SMC work on lower timeframes like 1-minute?',
        aAr: 'نعم، حركة الأسواق كسرية (Fractal)، ولكن من الضروري تحديد الاتجاه العام ومناطق السيولة على فريم 4 ساعات و 15 دقيقة أولاً قبل الدخول على فريم الدقيقة.',
        aEn: 'Yes, markets are fractal. However, higher timeframe bias (4H/15M) must anchor lower timeframe executions.',
      },
    ],
  },
  {
    id: 3,
    slug: 'risk-management-1-percent-golden-rule',
    category: 'إدارة المخاطر',
    categoryEn: 'Risk Management',
    categoryKey: 'risk',
    titleAr: 'قاعدة الـ 1% الذهبية: كيف تحمي رأس مالك من تقلبات السوق العنيفة؟',
    titleEn: 'The 1% Golden Rule: How to Shield Your Capital from Volatility',
    excerptAr: 'السبب الحقيقي وراء خسارة 90% من المتداولين، وكيفية حساب حجم اللوت (Lot Size) بما يتناسب مع رصيد حسابك لتجنب المارجن كول.',
    excerptEn: 'The real reason behind trader drawdowns, and mathematically sizing your lots to preserve longevity and psychological calm.',
    authorAr: 'م. سليمان داود',
    authorEn: 'Eng. Sleman Daowed',
    authorRoleAr: 'كبير محللي الأسواق',
    authorRoleEn: 'Chief Market Strategist',
    authorImg: '/assets/Images/Avatar/avatar3.webp',
    authorBioAr: 'مستشار محافظ مالية معتمد ومؤسس برامج تدريب احترافية لإدارة مخاطر التداول وصناديق التمويل (Prop Firms).',
    authorBioEn: 'Certified portfolio risk consultant and mentor specializing in prop firm challenges, drawdowns, and mathematical position sizing.',
    dateAr: '26 أغسطس 2026',
    dateEn: 'Aug 26, 2026',
    readTimeAr: '6 دقائق قراءة',
    readTimeEn: '6 min read',
    featured: false,
    views: '9.4K',
    tags: ['Capital Protection', 'Lot Sizing', 'Psychology', 'Drawdown'],
    accentColor: '#FB8704',
    videoUrl: '',
    links: [
      {
        titleAr: 'حاسبة إدارة المخاطر وحجم اللوت التفاعلية',
        titleEn: 'Interactive Position Size & Risk Calculator',
        url: 'https://fxengin.com/tools/calculator',
        type: 'download',
      },
      {
        titleAr: 'قناة التوصيات والتحليلات الرسمية',
        titleEn: 'Official Forex Signals & Analysis Channel',
        url: 'https://t.me/fxengin',
        type: 'telegram',
      },
    ],
    keyTakeawaysAr: [
      'تطبيق قاعدة الـ 1%: لا تخاطر بأكثر من 1% من رصيدك في أي صفقة منفردة.',
      'حساب حجم اللوت رياضياً بناءً على بُعد وقف الخسارة بالنقاط وليس عشوائياً.',
      'تحديد سقف يومي للخسارة (Max Daily Loss) لا يتجاوز 3% وإغلاق المنصة عنده فوراً.',
      'إدارة المخاطر هي العامل الحاسم بين المتداول الهاوي والمحترف الذي يستمر لسنوات.',
    ],
    keyTakeawaysEn: [
      'Enforce the 1% parameter: never expose more than 1% account equity on a single setup.',
      'Size positions dynamically based on stop loss distance rather than fixed lot sizes.',
      'Set an absolute daily drawdown circuit-breaker at 3% max loss.',
      'Risk management is the singular mathematical divide separating amateurs from career traders.',
    ],
    sections: [
      {
        id: 'math-of-loss',
        headingAr: '1. رياضيات الخسارة: لماذا يصعب تعويض الحسابات المنهارة؟',
        headingEn: '1. The Mathematics of Drawdowns',
        bodyAr: `إذا خسرت 10% من حسابك، فأنت بحاجة إلى ربح 11% لتعويضها.
ولكن إذا خسرت 50% من حسابك، فأنت بحاجة إلى ربح **100%** فقط لتعود لنقطة البداية!

هذه الحقيقة الرياضية البسيطة هي التي تجعل الحفاظ على رأس المال هو الأولوية الأولى لكل صندوق استثماري ومحترف في العالم.`,
        bodyEn: `A 10% loss requires an 11% gain to recover. However, a 50% drawdown requires a massive **100% net return** just to break even!

This mathematical reality establishes capital preservation as the ultimate directive of every institutional trader.`,
        tipAr: 'الهدف في التداول ليس أن تربح في كل صفقة، بل أن تضمن أن خسائرك صغيرة جداً بحيث تعوضها صفقة رابحة واحدة بسهولة.',
        tipEn: 'The objective is not a 100% win rate, but ensuring losses are mathematically negligible compared to your winners.',
      },
    ],
    faqs: [
      {
        qAr: 'كيف أحسب حجم اللوت بناءً على قاعدة 1%؟',
        qEn: 'How do I calculate lot size based on 1%?',
        aAr: 'المعادلة: حجم المخاطرة بالدولار = (رصيد الحساب × 0.01). ثم تقسم الناتج على (عدد نقاط وقف الخسارة × قيمة النقطة).',
        aEn: 'Formula: Risk ($) = Account Balance × 0.01. Divide by (Stop Loss Pips × Pip Value).',
      },
    ],
  },
  {
    id: 4,
    slug: 'algo-trading-python-mql5-expert-advisors',
    category: 'التداول الآلي والذكاء الاصطناعي',
    categoryEn: 'Algo & AI Trading',
    categoryKey: 'algo',
    titleAr: 'بناء روبوتات التداول (Expert Advisors) عبر Python و MQL5',
    titleEn: 'Building Automated Expert Advisors via Python & MQL5',
    excerptAr: 'خطوة بخطوة: كيفية برمجة خوارزميات التداول الآلي، واختبارها على البيانات التاريخية (Backtesting)، وتشغيلها على خوادم VPS على مدار الساعة.',
    excerptEn: 'Step-by-step: Program algorithmic trading bots, perform rigorous backtesting, and deploy on low-latency VPS 24/5.',
    authorAr: 'م. سليمان داود',
    authorEn: 'Eng. Sleman Daowed',
    authorRoleAr: 'كبير محللي الأسواق',
    authorRoleEn: 'Chief Market Strategist',
    authorImg: '/assets/Images/Avatar/avatar1.webp',
    authorBioAr: 'مهندس برمجيات ومطور خوارزميات مالية، متخصص في ربط واجهات MT5 و Python وبناء استراتيجيات التداول عالي التردد (HFT).',
    authorBioEn: 'Software engineer & quantitative systems architect specializing in MetaTrader 5 APIs, Python backtesting engines, and automated execution.',
    dateAr: '25 أغسطس 2026',
    dateEn: 'Aug 25, 2026',
    readTimeAr: '11 دقيقة قراءة',
    readTimeEn: '11 min read',
    featured: false,
    views: '16.5K',
    tags: ['Python', 'MQL5', 'Algo Bots', 'MetaTrader'],
    accentColor: '#A855F7',
    keyTakeawaysAr: [
      'فصل استراتيجية التداول عن المشاعر البشرية عبر التنفيذ البرمجي الدقيق.',
      'أهمية اختبار الاستراتيجية (Backtesting) على بيانات تاريخية بدقة 99% (Tick Data).',
      'تجنب ظاهرة الإفراط في الملاءمة (Overfitting) التي تجعل البوت ينجح في الماضي ويفشل في المستقبل.',
      'استخدام خوادم VPS ذات زمن استجابة منخفض جداً (Low Latency) لضمان سرعة التنفيذ.',
    ],
    keyTakeawaysEn: [
      'Eliminate emotional friction through disciplined programmatic trade execution.',
      'Conduct rigorous 99% tick-quality backtesting across varying market cycles.',
      'Prevent curve-fitting and overfitting traps that degrade forward performance.',
      'Deploy on ultra-low latency VPS environments adjacent to broker liquidity engines.',
    ],
    sections: [
      {
        id: 'algo-basics',
        headingAr: '1. لماذا يتجه العالم نحو التداول الآلي؟',
        headingEn: '1. Why the World is Moving to Algorithmic Execution',
        bodyAr: `أكثر من 75% من حجم التداول في بورصات وول ستريت وأسواق العملات العالمية ينفذ حالياً بواسطة روبوتات وخوارزميات مبرمجة.

تتميز الروبوتات بالقدرة على:
- مراقبة عشرات الأدوات المالية في أجزاء من الثانية.
- تنفيذ أوامر وقف الخسارة وجني الأرباح دون تردد أو خوف أو طمع.
- تطبيق إدارة مخاطر صارمة لا يمكن كسرها بدافع الانفعال.`,
        bodyEn: `Over 75% of global market volume across major exchanges is executed by algorithmic systems.

Key benefits:
- Scanning dozens of currency pairs in milliseconds.
- Flawless risk execution free from greed and fear.
- Automated mathematical position management 24 hours a day.`,
        tipAr: 'لا تشتري روبوتات تداول جاهزة من الإنترنت تدعي أرباحاً خيالية، بل تعلم الأساسيات وابنِ استراتيجيتك بنفسك.',
        tipEn: 'Never buy black-box commercial bots promising unrealistic gains; build and thoroughly test your own edge.',
      },
    ],
    faqs: [
      {
        qAr: 'أيهما أفضل لبدء التداول الآلي: Python أم MQL5؟',
        qEn: 'Which is better to start with: Python or MQL5?',
        aAr: 'تتميز لغة MQL5 بأنها مدمجة ومباشرة في منصة MT5 مع اختبار استراتيجيات فائق السرعة، بينما تتفوق Python في التحليل الإحصائي ودمج نماذج الذكاء الاصطناعي.',
        aEn: 'MQL5 is native to MT5 with instant tick-testing; Python excels at machine learning and data science integrations.',
      },
    ],
  },
  {
    id: 5,
    slug: 'trading-psychology-conquering-fomo-fear',
    category: 'سيكولوجية التداول',
    categoryEn: 'Trading Psychology',
    categoryKey: 'psychology',
    titleAr: 'علم النفس السلوكي في الأسواق: كيف تتغلب على الخوف والطمع؟',
    titleEn: 'Trading Psychology: Conquering FOMO, Greed, and Fear',
    excerptAr: 'التداول ليس مجرد شارت وأرقام، بل صراع ذهني. اكتشف كيف تبني عقلية المتداول المحترف وتلتزم بخطتك دون تردد أو انتقام من السوق.',
    excerptEn: 'Trading is mental discipline. Discover cognitive routines to master emotional composure and execute flawlessly without revenge trading.',
    authorAr: 'م. سليمان داود',
    authorEn: 'Eng. Sleman Daowed',
    authorRoleAr: 'كبير محللي الأسواق',
    authorRoleEn: 'Chief Market Strategist',
    authorImg: '/assets/Images/Avatar/avatar2.webp',
    authorBioAr: 'أخصائية في السلوك المالي وعلم النفس العصبي للقرارات الاستثمارية، مدربة متداولين محترفين في كبرى المؤسسات المالية.',
    authorBioEn: 'Behavioral finance psychologist and performance coach working with elite institutional traders to optimize cognitive decision-making.',
    dateAr: '24 أغسطس 2026',
    dateEn: 'Aug 24, 2026',
    readTimeAr: '8 دقائق قراءة',
    readTimeEn: '8 min read',
    featured: false,
    views: '8.7K',
    tags: ['Discipline', 'Mindset', 'Emotional Control', 'FOMO'],
    accentColor: '#06B6D4',
    keyTakeawaysAr: [
      'التخلص من متلازمة فوات الفرصة (FOMO) عبر إدراك أن السوق يقدم فرصاً لا تنتهي كل يوم.',
      'تجنب التداول الانتقامي (Revenge Trading) بعد الصفقات الخاسرة.',
      'وضع خطة تداول مكتوبة تتضمن شروط الدخول والخروج بدقة قبل فتح أي صفقة.',
      'التركيز على جودة التنفيذ بدلاً من النتيجة المالية المؤقتة للصفقة المنفردة.',
    ],
    keyTakeawaysEn: [
      'Eliminate FOMO by recognizing the infinite abundance of daily market opportunities.',
      'Severely curb revenge trading tendencies following inevitable losing sessions.',
      'Operate strictly with a written trading plan defining every parameter before entry.',
      'Focus relentlessly on execution quality rather than temporary single-trade P&L.',
    ],
    sections: [
      {
        id: 'psych-fomo',
        headingAr: '1. فخ الـ FOMO وكيفية التغلب عليه',
        headingEn: '1. The FOMO Trap & Mindset Shifts',
        bodyAr: `الخوف من فوات الفرصة (Fear Of Missing Out) هو الدافع الأكبر وراء دخول المتداولين في قمم وقيعان السوق بعد فوات الأوان.

عندما يرى المتداول شمعة صاعدة عملاقة، يشعر بالاندفاع للدخول خشية أن يفوته الربح السريع، وهو بالضبط التوقيت الذي يبدأ فيه كبار الحيتان بجني أرباحهم، فينعكس السعر فوراً.`,
        bodyEn: `Fear Of Missing Out (FOMO) drives retail traders to buy tops and sell bottoms after the true expansion has concluded.

Seeing an extended green candle sparks anxiety. Entering at that instant hands liquidity directly to institutional players taking profit.`,
        tipAr: 'إذا فاتتك الصفقة، لا تطارد السعر أبداً. السوق مفتوح 24/5 وسيقدم لك فرصة أفضل غداً.',
        tipEn: 'Never chase runaway moves. The market operates 24/5 and will present higher-quality setups shortly.',
      },
    ],
    faqs: [
      {
        qAr: 'ماذا أفعل عندما أشعر بالانزعاج الشديد بعد خسارة صفقة؟',
        qEn: 'What should I do after experiencing a frustrating loss?',
        aAr: 'أغلق شاشة التداول فوراً وابتعد لمدة لا تقل عن ساعتين. قم بالمشي أو ممارسة نشاط بدني لإعادة توازن كيمياء الدماغ قبل العودة.',
        aEn: 'Step away from all screens for at least 2 hours. Reset your neurological state before reviewing charts.',
      },
    ],
  },
  {
    id: 6,
    slug: 'rsi-divergence-mastery-guide',
    category: 'التحليل الفني',
    categoryEn: 'Technical Analysis',
    categoryKey: 'technical',
    titleAr: 'الدليل الاحترافي لمؤشر RSI ودايفرجنس الأسعار الخفي',
    titleEn: 'Mastering the RSI Indicator and Hidden Divergence Signals',
    excerptAr: 'شرح متقدم لكيفية استخدام مؤشر القوة النسبية لتوقع انعكاسات الاتجاه واستخراج صفقات عالية الدقة بنسب مخاطرة إلى عائد ممتازة.',
    excerptEn: 'Advanced guide on utilizing Relative Strength Index for pinpoint reversal detection and high Risk-to-Reward trade execution.',
    authorAr: 'م. سليمان داود',
    authorEn: 'Eng. Sleman Daowed',
    authorRoleAr: 'كبير محللي الأسواق',
    authorRoleEn: 'Chief Market Strategist',
    authorImg: '/assets/Images/Avatar/avatar1.webp',
    authorBioAr: 'كبير محللي الأسواق في FXENGIN ومحاضر مالي معتمد بخبرة واسعة في مؤشرات الزخم والتحليل الفني الكلاسيكي والحديث.',
    authorBioEn: 'Chief Market Strategist at FXENGIN specializing in momentum oscillators, classical chart patterns, and algorithmic technical models.',
    dateAr: '23 أغسطس 2026',
    dateEn: 'Aug 23, 2026',
    readTimeAr: '7 دقائق قراءة',
    readTimeEn: '7 min read',
    featured: false,
    views: '12.1K',
    tags: ['RSI', 'Divergence', 'Price Action', 'Momentum'],
    accentColor: '#16C784',
    keyTakeawaysAr: [
      'فهم الفرق بين الدايفرجنس العادي (الانعكاسي) والدايفرجنس الخفي (الاستمراري).',
      'تجنب التداول بناءً على مناطق ذروة الشراء والبيع (70/30) وحدها دون دايفرجنس.',
      'دمج إشارات RSI مع مناطق الدعم والمقاومة لزيادة نسبة نجاح الصفقات إلى أكثر من 70%.',
    ],
    keyTakeawaysEn: [
      'Distinguish between Regular Reversal Divergence and Hidden Continuation Divergence.',
      'Never trade overbought/oversold (70/30) levels blindly in strong trending markets.',
      'Combine RSI divergence with major support/resistance to achieve high win-rate confluence.',
    ],
    sections: [
      {
        id: 'rsi-divergence',
        headingAr: '1. ما هو الدايفرجنس وكيف يعكس ضعف الزخم؟',
        headingEn: '1. What is Divergence and Why Does It Signal Exhaustion?',
        bodyAr: `يحدث الدايفرجنس عندما يتحرك السعر في اتجاه، بينما يتحرك مؤشر القوة النسبية (RSI) في الاتجاه المعاكس.
- **دايفرجنس سلبي**: السعر يشكل قمة أعلى من قمة سابقة (Higher High)، بينما يشكل المؤشر قمة أدنى (Lower High). هذا يدل على أن الصعود الحالي ضعيف وقريب من الانعكاس.
- **دايفرجنس إيجابي**: السعر يشكل قاعاً أدنى (Lower Low)، بينما يشكل المؤشر قاعاً أعلى (Higher Low). يشير إلى احتمال ارتداد صاعد وشيك.`,
        bodyEn: `Divergence occurs when price action and momentum oscillator trajectory diverge:
- **Bearish Divergence**: Price records a Higher High while RSI stamps a Lower High, signaling upward exhaustion.
- **Bullish Divergence**: Price prints a Lower Low while RSI registers a Higher Low, signaling seller exhaustion.`,
        tipAr: 'أقوى إشارات الدايفرجنس تظهر على فريمات 4 ساعات واليومي عند ملامسة مناطق عرض وطلب رئيسية.',
        tipEn: 'The highest confluence divergence setups occur on 4H and Daily timeframes at major institutional zones.',
      },
    ],
    faqs: [
      {
        qAr: 'هل الدايفرجنس الخفي أفضل أم العادي؟',
        qEn: 'Is Hidden Divergence better than Regular Divergence?',
        aAr: 'الدايفرجنس الخفي أقوى لأنه يتماشى مع الاتجاه الأصلي للسوق (Trend Continuation)، بينما الدايفرجنس العادي يعاكس الاتجاه في بدايته.',
        aEn: 'Hidden divergence offers higher statistical follow-through because it trades in alignment with the macro trend.',
      },
    ],
  },
  {
    id: 7,
    slug: 'gold-scalping-london-newyork-sessions',
    category: 'استراتيجيات التداول',
    categoryEn: 'Trading Strategies',
    categoryKey: 'strategies',
    titleAr: 'تداول الذهب (XAU/USD): استراتيجيات قناص جلسة نيويورك ولندن',
    titleEn: 'Gold Scalping Secrets: London & New York Session Volatility',
    excerptAr: 'خصائص الذهب الفريدة وكيفية الاستفادة من فترات تداخل الجلسات الكبرى لاقتناص تحركات سريعة ومربحة بأقل سبريد ممكن.',
    excerptEn: 'Unlocking gold session overlaps to scalp high-momentum moves during major market open liquidity surges.',
    authorAr: 'م. سليمان داود',
    authorEn: 'Eng. Sleman Daowed',
    authorRoleAr: 'كبير محللي الأسواق',
    authorRoleEn: 'Chief Market Strategist',
    authorImg: '/assets/Images/Avatar/avatar3.webp',
    authorBioAr: 'متداول ذهب وسلع محترف ومستشار استثماري ذو باع طويل في اقتناص سيولة المعادن الثمينة خلال افتتاح الأسواق العالمية.',
    authorBioEn: 'Commodities and precious metals specialist with deep focus on gold (XAU/USD) intraday market dynamics and volatility spikes.',
    dateAr: '22 أغسطس 2026',
    dateEn: 'Aug 22, 2026',
    readTimeAr: '8 دقائق قراءة',
    readTimeEn: '8 min read',
    featured: false,
    views: '19.3K',
    tags: ['Gold', 'Scalping', 'Sessions', 'XAU/USD'],
    accentColor: '#FB8704',
    keyTakeawaysAr: [
      'الذهب يتحرك بناءً على السيولة اللحظية وحساسيته العالية لعوائد السندات الأمريكية ومؤشر الدولار (DXY).',
      'فترة تداخل جلستي لندن ونيويورك (من 13:00 إلى 17:00 UTC) هي قمة السيولة اليومية.',
      'تجنب التداول أثناء صدور بيانات مؤشر أسعار المستهلك (CPI) وقرارات الفائدة إلا بعد هدوء السبريد.',
    ],
    keyTakeawaysEn: [
      'Gold moves with immense speed influenced by US Treasury yields and DXY dynamics.',
      'London / New York overlap (13:00 - 17:00 UTC) produces the highest intraday liquidity.',
      'Never hold scalp positions directly through CPI releases until spreads stabilize.',
    ],
    sections: [
      {
        id: 'gold-volatility',
        headingAr: '1. لماذا يعتبر الذهب المفضل للمتداولين اليوميين؟',
        headingEn: '1. Why Gold Dominates Intraday Scalping',
        bodyAr: `الذهب (XAU/USD) هو السلعة الأكثر تقلباً وسيولة في العالم. متوسط تحركاته اليومية تتجاوز 250 إلى 400 نقطة، مما يتيح للمتداول اقتناص صفقات سريعة في دقائق معدودة.

لكن هذه السيولة العالية سيف ذو حدين، وتتطلب انضباطاً صارماً في حجم اللوت ووضع أوامر وقف الخسارة قبل الدخول.`,
        bodyEn: `Gold is the ultimate volatility asset. Daily average true ranges routinely exceed 250 to 400 pips, allowing scalpers to hit targets within minutes.

However, unchecked leverage on gold causes swift liquidations; strict stop discipline is mandatory.`,
        tipAr: 'راقب دائماً العائد على السندات الأمريكية لأجل 10 سنوات؛ العلاقة بينها وبين الذهب عكسية بنسبة كبيرة.',
        tipEn: 'Constantly monitor US 10Y Yields; gold maintains an inverse correlation with real yields.',
      },
    ],
    faqs: [
      {
        qAr: 'ما هو أفضل فريم زمني لسالبينج الذهب؟',
        qEn: 'What is the best timeframe for gold scalping?',
        aAr: 'فريم 5 دقائق للدخول والخروج، مع الاستعانة بفريم 15 دقيقة وساعة لتحديد اتجاه السيولة والدعوم والمقاومات.',
        aEn: 'The 5-minute timeframe for entries/exits, anchored by the 15M and 1H for directional liquidity.',
      },
    ],
  },
  {
    id: 8,
    slug: 'genai-llm-forecasting-markets-2026',
    category: 'التداول الآلي والذكاء الاصطناعي',
    categoryEn: 'Algo & AI Trading',
    categoryKey: 'algo',
    titleAr: 'كيف يغير الذكاء الاصطناعي التوليدي التنبؤ باتجاهات الأسواق في 2026؟',
    titleEn: 'How GenAI and LLMs Are Reshaping Market Sentiment Forecasting',
    excerptAr: 'تحليل الأخبار والبيانات اللحظية باستخدام نماذج الذكاء الاصطناعي لفهم معنويات السوق والتفوق على التحليلات التقليدية.',
    excerptEn: 'Harnessing real-time NLP sentiment analysis to outpace traditional market lagging indicators.',
    authorAr: 'م. سليمان داود',
    authorEn: 'Eng. Sleman Daowed',
    authorRoleAr: 'كبير محللي الأسواق',
    authorRoleEn: 'Chief Market Strategist',
    authorImg: '/assets/Images/Avatar/avatar1.webp',
    authorBioAr: 'مهندس برمجيات ومطور خوارزميات مالية، باحث في استخدام النماذج اللغوية الكبيرة (LLMs) لمعالجة الأخبار الاقتصادية.',
    authorBioEn: 'Lead quantitative engineer specializing in machine learning, NLP financial pipelines, and algorithmic market modeling.',
    dateAr: '20 أغسطس 2026',
    dateEn: 'Aug 20, 2026',
    readTimeAr: '10 دقائق قراءة',
    readTimeEn: '10 min read',
    featured: false,
    views: '15.8K',
    tags: ['AI Models', 'Sentiment', 'FinTech', 'GenAI'],
    accentColor: '#A855F7',
    keyTakeawaysAr: [
      'النماذج اللغوية قادرة على قراءة محاضر الفيدرالي وتصريحات البنوك المركزية في ثوانٍ وتقييم نبرتها (Hawkish vs Dovish).',
      'دمج التحليل النوعي للنصوص مع البيانات الرقمية للشارت لتوليد إشارات أكثر دقة.',
      'تطور روبوتات التداول التكيفية التي تعدل معاييرها تلقائياً مع تغير نظام السوق (Market Regime Shift).',
    ],
    keyTakeawaysEn: [
      'LLMs evaluate central bank statements and monetary transcripts within milliseconds (Hawkish vs Dovish).',
      'Combining qualitative textual sentiment with quantitative price data yields superior signals.',
      'Adaptive algorithmic execution bots automatically recalibrate during regime shifts.',
    ],
    sections: [
      {
        id: 'ai-revolution',
        headingAr: '1. عصر التحليل اللحظي للمشاعر المالية',
        headingEn: '1. The Real-time Sentiment Analytics Era',
        bodyAr: `في الماضي، كان المحللون يستغرقون ساعات لقراءة بيان البنك الفيدرالي الأمريكي وفهم تبعاته. اليوم، تقوم نماذج الذكاء الاصطناعي بتحليل الكلمات، واستخراج مؤشرات النبرة التشددية أو التيسيرية وتغذية خوارزميات التداول في غضون أجزاء من الثانية.`,
        bodyEn: `Historically, institutional economists spent hours dissecting FOMC rate statements. Modern financial LLMs parse semantics, tone, and policy subtleties within microseconds, routing orders instantly.`,
        tipAr: 'الذكاء الاصطناعي أداة مساعدة قوية، لكنه لا يلغي دور الإشراف البشري وإدارة المخاطر الصارمة.',
        tipEn: 'AI is a powerful computational force-multiplier, but human oversight and risk boundaries remain paramount.',
      },
    ],
    faqs: [
      {
        qAr: 'هل يمكن للمتداول الفردي استخدام أدوات الذكاء الاصطناعي في تداوله؟',
        qEn: 'Can individual retail traders utilize AI tools?',
        aAr: 'نعم، عبر استخدام روبوتات تحليل المشاعر وأدوات فحص الأخبار المبرمجة بلغة Python وربطها بمنصات MT5 عبر واجهات API.',
        aEn: 'Yes, via Python-based sentiment scanners and modern MT5 API algorithmic pipelines.',
      },
    ],
  },
];

/**
 * Helper to fetch a blog post by ID or Slug
 * @param {string|number} identifier
 * @returns {Object|null}
 */
export function getBlogPostById(identifier) {
  if (!identifier) return BLOG_POSTS[0];
  const post = BLOG_POSTS.find(
    (p) => String(p.id) === String(identifier) || p.slug === String(identifier)
  );
  return post || BLOG_POSTS[0];
}

/**
 * Helper to get related posts for a given article
 * @param {string|number} currentId
 * @param {string} categoryKey
 * @param {number} limit
 * @returns {Array}
 */
export function getRelatedPosts(currentId, categoryKey, limit = 3) {
  return BLOG_POSTS
    .filter((p) => String(p.id) !== String(currentId) && (p.categoryKey === categoryKey || !categoryKey))
    .slice(0, limit);
}
