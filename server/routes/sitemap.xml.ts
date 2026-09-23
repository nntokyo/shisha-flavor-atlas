import { getServerSupabase } from '../utils/supabase'

function slugify(value: string) {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .trim()
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '') || 'item'
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const siteUrl = String(config.public.siteUrl || 'https://shisha-flavor-atlas.vercel.app').replace(/\/$/, '')
  const urls = new Set<string>([siteUrl + '/'])

  try {
    const supabase = getServerSupabase(event)
    const [flavorsResult, brandsResult, mixesResult] = await Promise.all([
      supabase.from('shisha_flavors').select('id,name,category').order('id'),
      supabase.from('shisha_brands').select('id,name').order('id'),
      supabase.from('mix_recipes').select('id,title').eq('status', 'published').order('id')
    ])

    for (const flavor of flavorsResult.data || []) {
      urls.add(`${siteUrl}/flavors/${slugify(flavor.name)}-${flavor.id}`)
      if (flavor.category) urls.add(`${siteUrl}/categories/${slugify(flavor.category)}`)
    }
    for (const brand of brandsResult.data || []) {
      urls.add(`${siteUrl}/brands/${slugify(brand.name)}-${brand.id}`)
    }
    for (const mix of mixesResult.data || []) {
      urls.add(`${siteUrl}/mixes/${slugify(mix.title)}-${mix.id}`)
    }
  } catch (error) {
    console.error('sitemap generation fallback:', error)
  }

  const body = [...urls]
    .map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`)
    .join('\n')

  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  setHeader(event, 'cache-control', 'public, max-age=900, s-maxage=900')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
})
