import { MetadataRoute } from 'next';
import { getNosologies } from '@/lib/content';

const SITE_URL = 'https://med-wiki.vercel.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const nosologies = await getNosologies();

  const nosologyUrls: MetadataRoute.Sitemap = nosologies.map(n => ({
    url: `${SITE_URL}/nosologies/${n.slug}`,
    lastModified: new Date(n.updatedAt),
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...nosologyUrls,
  ];
}
