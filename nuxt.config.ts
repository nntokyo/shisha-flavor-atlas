const supabaseUrl =
  process.env.NUXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  ''

// Only browser-safe Supabase keys belong in public runtime config.
// Never add SUPABASE_SECRET_KEY or service-role keys here.
const supabaseKey =
  process.env.NUXT_PUBLIC_SUPABASE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  ''

export default defineNuxtConfig({
  compatibilityDate: '2026-09-01',
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://shisha-flavor-atlas.vercel.app',
      supabaseUrl,
      supabaseKey
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
