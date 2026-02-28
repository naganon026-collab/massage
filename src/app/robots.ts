import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/', '/auth/'],
        },
        sitemap: 'https://seo-generator.vercel.app/sitemap.xml', // 実際のデプロイ先URLに置き換えてください
    }
}
