export default defineNuxtConfig({
  compatibilityDate: '2026-09-01',
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://shisha-flavor-atlas.vercel.app',
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL || '',
      supabaseKey: process.env.NUXT_PUBLIC_SUPABASE_KEY || ''
    }
  },
  app: {
    head: {
      htmlAttrs: { lang: 'ja' },
      title: 'Shisha Flavor Atlas',
      meta: [
        {
          name: 'description',
          content: '世界のシーシャフレーバーとMIXレシピを検索できるデータベース'
        },
        { name: 'theme-color', content: '#103b2f' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'apple-touch-icon', href: '/logo.svg' }
      ]
    }
  }
})
