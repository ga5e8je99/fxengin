/**
 * @file JsonLd.js
 * @description Schema.org JSON-LD Structured Data for High-Grade Search Engine Optimization (Google, Bing, Yandex, Yahoo)
 * Powers Google Knowledge Graph, Rich Snippets, Sitelinks, and FAQ Rich Cards for:
 * - FXENGIN / fxengin
 * - مهندس الفوركس / مهندس الفوريكس
 * - التداول / الفوركس
 */

export default function JsonLd() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fxengen.com';

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    '@id': `${siteUrl}/#organization`,
    name: 'FXENGIN — مهندس الفوركس',
    legalName: 'FXENGIN Financial Technologies & Academy',
    alternateName: [
      'FXENGIN',
      'fxengin',
      'مهندس الفوركس',
      'مهندس الفوريكس',
      'المهندس فوركس',
      'مهندس التداول',
      'اف اكس انجن',
      'أف أكس أنجن',
      'FX Engin',
      'Forex Engineer',
      'ForexEngin',
    ],
    url: siteUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${siteUrl}/assets/Images/Logo/logo.webp`,
      width: 512,
      height: 512,
      caption: 'شعار منصة FXENGIN مهندس الفوركس',
    },
    image: `${siteUrl}/assets/Images/Logo/hero2.webp`,
    description:
      'منصة FXENGIN الرائدة بإشراف مهندس الفوركس: المنظومة المتكاملة لتعليم التداول واحتراف أسواق الفوركس والعملات والذهب والسلع، استراتيجيات السيولة المؤسسية SMC، والتحليلات الفنية اللحظية.',
    foundingDate: '2024',
    founder: {
      '@type': 'Person',
      '@id': `${siteUrl}/#founder`,
      name: 'مهندس الفوركس',
      alternateName: ['مهندس الفوريكس', 'Forex Engineer', 'FXENGIN Founder', 'كبير محللي FXENGIN'],
      jobTitle: 'كبير محللي ومدربي التداول والأسواق المالية',
      description: 'خبير واستشاري أسواق المال والتحليل الفني المؤسسي، مؤسس منصة FXENGIN لتعليم التداول والفوركس.',
      url: `${siteUrl}/about`,
      image: `${siteUrl}/assets/Images/Main/expert1.webp`,
    },
    sameAs: [
      'https://t.me/fxengin',
      'https://twitter.com/fxengin',
      'https://youtube.com/@fxengin',
      'https://instagram.com/fxengin',
      'https://linkedin.com/company/fxengin',
      'https://facebook.com/fxengin',
    ],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: '+971-4-000-0000',
        contactType: 'customer service',
        availableLanguage: ['Arabic', 'English'],
        areaServed: ['AE', 'SA', 'EG', 'KW', 'QA', 'BH', 'OM', 'JO', 'Global'],
      },
    ],
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'AE',
      addressLocality: 'Dubai',
    },
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    url: siteUrl,
    name: 'FXENGIN | مهندس الفوركس',
    alternateName: [
      'FXENGIN',
      'منصة مهندس الفوركس',
      'منصة FXENGIN للتعليم المالي والتداول',
      'Forex Engineer Trading Academy',
    ],
    headline: 'FXENGIN | مهندس الفوركس — المنصة الأولى لتعليم واحتراف التداول والفوركس',
    keywords:
      'FXENGIN, fxengin, مهندس الفوركس, مهندس الفوريكس, التداول, تداول, الفوركس, الفوريكس, تعليم التداول, دورات فوركس, تداول الذهب, Smart Money Concepts, أفضل وسيط فوركس',
    publisher: {
      '@id': `${siteUrl}/#organization`,
    },
    inLanguage: ['ar', 'en'],
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/courses?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'ما هي منصة FXENGIN ومن هو مهندس الفوركس؟',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'منصة FXENGIN هي المنظومة العربية الشاملة لتعليم التداول واحتراف الفوركس والأسواق المالية، يقودها مهندس الفوركس لتقديم دبلومات تدريبية معتمدة، استراتيجيات السيولة المؤسسية (Smart Money Concepts)، تحليلات فنية يومية مباشرة، وغرف تداول تفاعلية لتمكين المتداولين من تحقيق الاستقلال المالي والربحية المستدامة.',
        },
      },
      {
        '@type': 'Question',
        name: 'كيف أبدأ تعلم التداول والفوركس من الصفر مع مهندس الفوركس؟',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'يمكنك البدء مباشرة عبر التسجيل في منصة FXENGIN واستكشاف مسارات التدريب من الصفر التي تغطي أساسيات أسواق العملات (Forex)، حركة السعر Price Action، وإدارة رأس المال والمخاطر الصارمة، وصولاً إلى استراتيجيات كتل الأوامر والمناطق المؤسسية SMC.',
        },
      },
      {
        '@type': 'Question',
        name: 'ما هي استراتيجيات التداول التي يتم تدريسها في أكاديمية FXENGIN؟',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'تركز الأكاديمية على استراتيجيات صناع السوق والسيولة الذكية Smart Money Concepts (SMC)، هندسة تدفق الأوامر Order Flow، واقتناص كتل الأوامر Order Blocks، ونماذج فيبوناتشي المتقدمة لتحديد أفضل نسب عائد إلى مخاطرة (Risk-to-Reward Ratio).',
        },
      },
      {
        '@type': 'Question',
        name: 'كيف أختار أفضل وسيط تداول فوركس موثوق عبر FXENGIN؟',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'توفر صفحة شركاء الوساطة في FXENGIN دليلاً شاملاً لأقوى وسطاء الفوركس وشركات التمويل المرخصة بأعلى الهيئات الرقابية الدولية (FCA, CySEC, ASIC)، مع سبريد خام 0.0، وبونص إيداع ترحيبي، وعروض كاش باك حصرية لعملاء المنصة.',
        },
      },
      {
        '@type': 'Question',
        name: 'هل توفر منصة FXENGIN بثاً مباشراً وتحليلات حية لفرص التداول؟',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'نعم، تقدم FXENGIN استوديو بث مباشر تفاعلي يومي مع كبار المحللين والمدربين لمتابعة افتتاح الجلسات العالمية (لندن ونيويورك)، تحليل الذهب والعملات، وتطبيق الصفقات الحية ومشاركة الشاشات بصوت وصورة عالية الجودة.',
        },
      },
    ],
  };

  const financialServiceSchema = {
    '@context': 'https://schema.org',
    '@type': 'FinancialService',
    '@id': `${siteUrl}/#financialService`,
    name: 'FXENGIN Financial Education & Forex Analytics — مهندس الفوركس',
    url: siteUrl,
    currenciesAccepted: 'USD, EUR, SAR, AED, EGP',
    paymentAccepted: 'Credit Card, Crypto (USDT), Bank Transfer, PayPal',
    priceRange: '$$',
    areaServed: 'Worldwide',
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'FXENGIN Courses & Trading Mentorship',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Course',
            name: 'دبلوم التداول المؤسسي وهياكل السيولة SMC المتقدمة — مهندس الفوركس',
            description: 'دورة شاملة في استراتيجيات Smart Money Concepts، إدارة المخاطر، وبناء المحافظ الاستثمارية الناجحة.',
            provider: {
              '@type': 'Organization',
              name: 'FXENGIN',
            },
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Course',
            name: 'احتراف تداول الذهب والعملات الأجنبية Forex & Gold Trading',
            description: 'تحليل سلوك حركة السعر Price Action وأسرار السيولة البنكية واقتناص أفضل الفرص اليومية.',
            provider: {
              '@type': 'Organization',
              name: 'FXENGIN',
            },
          },
        },
      ],
    },
  };

  const siteNavigationSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: [
      {
        '@type': 'SiteNavigationElement',
        position: 1,
        name: 'الرئيسية — FXENGIN مهندس الفوركس',
        url: siteUrl,
      },
      {
        '@type': 'SiteNavigationElement',
        position: 2,
        name: 'التدريب والكورسات',
        url: `${siteUrl}/courses`,
      },
      {
        '@type': 'SiteNavigationElement',
        position: 3,
        name: 'شركاء الوساطة وفتح حساب',
        url: `${siteUrl}/open-account`,
      },
      {
        '@type': 'SiteNavigationElement',
        position: 4,
        name: 'البث المباشر وغرفة التداول',
        url: `${siteUrl}/live`,
      },
      {
        '@type': 'SiteNavigationElement',
        position: 5,
        name: 'الأسواق وأسعار العملات المباشرة',
        url: `${siteUrl}/markets`,
      },
      {
        '@type': 'SiteNavigationElement',
        position: 6,
        name: 'التحليلات الفنية والتوصيات',
        url: `${siteUrl}/analyses`,
      },
      {
        '@type': 'SiteNavigationElement',
        position: 7,
        name: 'المقالات ومدونة التداول',
        url: `${siteUrl}/blog`,
      },
      {
        '@type': 'SiteNavigationElement',
        position: 8,
        name: 'من نحن — مهندس الفوركس',
        url: `${siteUrl}/about`,
      },
      {
        '@type': 'SiteNavigationElement',
        position: 9,
        name: 'اتصل بنا',
        url: `${siteUrl}/contact`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(financialServiceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(siteNavigationSchema) }}
      />
    </>
  );
}
