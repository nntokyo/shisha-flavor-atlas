export const SITE_NAME = 'Shisha Flavor Atlas'
export const DEFAULT_DESCRIPTION = '世界のシーシャフレーバーとMIXレシピを検索できるデータベース'

export function normalizeSiteUrl(value: string) {
  return value.replace(/\/$/, '')
}

export function absoluteUrl(siteUrl: string, path = '/') {
  const base = normalizeSiteUrl(siteUrl)
  return path === '/' ? base + '/' : base + (path.startsWith('/') ? path : '/' + path)
}

export function toSlug(value: string) {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .trim()
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '') || 'item'
}

export function flavorPath(name: string, id: number) {
  return `/flavors/${toSlug(name)}-${id}`
}

export function brandPath(name: string, id: number) {
  return `/brands/${toSlug(name)}-${id}`
}

export function mixPath(title: string, id: number) {
  return `/mixes/${toSlug(title)}-${id}`
}

export function categoryPath(category: string) {
  return `/categories/${toSlug(category)}`
}

export function idFromSlug(slug: string) {
  const match = slug.match(/-(\d+)$/)
  return match ? Number(match[1]) : null
}

export function compactDescription(value: string | null | undefined, fallback = DEFAULT_DESCRIPTION) {
  const normalized = String(value || '').replace(/\s+/g, ' ').trim()
  return normalized ? normalized.slice(0, 155) : fallback
}
