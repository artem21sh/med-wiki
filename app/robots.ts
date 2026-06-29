import { MetadataRoute } from 'next';

const SITE_URL = 'https://med-wiki.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/outstatic', '/api/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
