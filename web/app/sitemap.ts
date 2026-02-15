import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://magister.ai',
      lastModified: new Date(),
    },
  ];
}