import { getBlogPostById } from '../blogData';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fxengen.com';

export async function generateMetadata({ params }) {
  const unwrappedParams = await params;
  const idOrSlug = unwrappedParams?.id || unwrappedParams?.articleId;
  const post = getBlogPostById(idOrSlug);

  if (!post) {
    return {
      title: 'مقال تحليلي في أسواق المال والعملات',
      description: 'مقال تحليلي متخصص في تداول الفوركس وهندسة استراتيجيات التداول من FXENGIN.',
    };
  }

  const title = post.titleAr || post.titleEn;
  const description =
    post.excerptAr ||
    post.excerptEn ||
    'دليل ودراسة فنية متقدمة في تداول الفوركس وإدارة المخاطر وهياكل السيولة من FXENGIN.';
  const postUrl = `${siteUrl}/blog/${encodeURIComponent(post.slug || post.id)}`;

  return {
    title,
    description,
    keywords: Array.isArray(post.tags)
      ? post.tags
      : ['فوركس', 'تداول العملات', 'التحليل الفني', 'سوق المال'],
    alternates: {
      canonical: postUrl,
    },
    openGraph: {
      type: 'article',
      locale: 'ar_SA',
      url: postUrl,
      title: `${title} | FXENGIN`,
      description,
      publishedTime: post.dateAr || post.dateEn,
      authors: [post.authorAr || post.authorEn || 'FXENGIN Expert'],
      images: [
        {
          url: '/assets/Images/Logo/hero2.webp',
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | FXENGIN`,
      description,
      images: ['/assets/Images/Logo/hero2.webp'],
    },
  };
}

export default async function ArticleLayout({ children, params }) {
  const unwrappedParams = await params;
  const idOrSlug = unwrappedParams?.id || unwrappedParams?.articleId;
  const post = getBlogPostById(idOrSlug);

  const articleSchema = post
    ? {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: post.titleAr || post.titleEn,
        description: post.excerptAr || post.excerptEn,
        image: [`${siteUrl}/assets/Images/Logo/hero2.webp`],
        datePublished: '2026-09-01T00:00:00+03:00',
        dateModified: new Date().toISOString(),
        author: [
          {
            '@type': 'Person',
            name: post.authorAr || post.authorEn || 'محلل أسواق FXENGIN',
            jobTitle: post.authorRoleAr || post.authorRoleEn || 'كبير محللي الأسواق',
          },
        ],
        publisher: {
          '@type': 'Organization',
          name: 'FXENGIN',
          logo: {
            '@type': 'ImageObject',
            url: `${siteUrl}/assets/Images/Logo/logo.webp`,
          },
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `${siteUrl}/blog/${encodeURIComponent(post.slug || post.id)}`,
        },
      }
    : null;

  return (
    <>
      {articleSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
        />
      )}
      {children}
    </>
  );
}
