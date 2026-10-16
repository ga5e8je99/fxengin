import articlesData from '../data/articles.json';
import pagesData from '../data/pages.json';

/**
 * @file sitemap.js
 * @description Dynamic XML Sitemap generator for Next.js App Router.
 * Automatically indexed by Google, Bing, Yandex, Yahoo, Baidu, and DuckDuckGo.
 */

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fxengen.com';
  const now = new Date();

  // Core high-priority landing pages & portals
  const staticRoutes = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/courses`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/open-account`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/live`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/markets`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/news`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/analyses`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/brokers`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/join-us`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/partners`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/disclaimer`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  // Dynamic Blog & Educational Articles
  const articleRoutes = [];
  if (Array.isArray(articlesData)) {
    for (const post of articlesData) {
      if (post.slug || post.id) {
        articleRoutes.push({
          url: `${baseUrl}/blog/${encodeURIComponent(post.slug || post.id)}`,
          lastModified: post.updatedAt ? new Date(post.updatedAt) : now,
          changeFrequency: 'weekly',
          priority: 0.85,
        });
      }
    }
  }

  // Dynamic Content Pages from pages.json (excluding duplicate static pages)
  const existingSlugs = new Set(staticRoutes.map((r) => r.url.replace(baseUrl, '').replace(/^\//, '')));
  const dynamicPageRoutes = [];
  if (Array.isArray(pagesData)) {
    for (const page of pagesData) {
      if (page.slug && page.isPublished !== false && !existingSlugs.has(page.slug)) {
        dynamicPageRoutes.push({
          url: `${baseUrl}/${encodeURIComponent(page.slug)}`,
          lastModified: page.lastUpdated ? new Date(page.lastUpdated) : now,
          changeFrequency: 'monthly',
          priority: 0.7,
        });
      }
    }
  }

  return [...staticRoutes, ...articleRoutes, ...dynamicPageRoutes];
}
