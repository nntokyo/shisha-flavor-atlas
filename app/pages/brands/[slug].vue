<script setup lang="ts">
import type { SupabaseClient } from '@supabase/supabase-js'
import { absoluteUrl, brandPath, compactDescription, flavorPath, idFromSlug } from '~/utils/seo'

const route = useRoute()
const config = useRuntimeConfig()
const { $supabase } = useNuxtApp() as unknown as { $supabase: SupabaseClient }
const id = idFromSlug(String(route.params.slug || ''))

if (!id) throw createError({ statusCode: 404, statusMessage: 'Brand not found' })

const { data } = await useAsyncData('brand-' + id, async () => {
  const [brandResult, flavorsResult] = await Promise.all([
    $supabase.from('shisha_brands').select('id,name,origin_country,website_url').eq('id', id).maybeSingle(),
    $supabase.from('shisha_flavors').select('id,name,flavor_profile,category,japan_availability_status').eq('brand_id', id).order('name')
  ])
  if (brandResult.error) throw createError({ statusCode: 502, statusMessage: brandResult.error.message })
  return { brand: brandResult.data, flavors: flavorsResult.data || [] }
})

if (!data.value?.brand) throw createError({ statusCode: 404, statusMessage: 'Brand not found' })

const brand = data.value.brand as any
const flavors = data.value.flavors as any[]
const siteUrl = String(config.public.siteUrl)
const path = brandPath(brand.name, brand.id)
const canonical = absoluteUrl(siteUrl, path)
const description = compactDescription(
  `${brand.name}のシーシャフレーバー${flavors.length}件を掲載。原産国、風味、国内流通情報を確認できます。`
)

useSeoMeta({
  title: `${brand.name}のシーシャフレーバー一覧 | Shisha Flavor Atlas`,
  description,
  ogTitle: `${brand.name} | Shisha Flavor Atlas`,
  ogDescription: description,
  ogType: 'website',
  ogUrl: canonical,
  twitterCard: 'summary',
  twitterTitle: brand.name,
  twitterDescription: description
})
useHead({
  link: [{ rel: 'canonical', href: canonical }],
  script: [{
    type: 'application/ld+json',
    textContent: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: brand.name,
      description,
      url: canonical,
      inLanguage: 'ja',
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: flavors.length,
        itemListElement: flavors.map((flavor, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: flavor.name,
          url: absoluteUrl(siteUrl, flavorPath(flavor.name, flavor.id))
        }))
      }
    })
  }]
})
</script>

<template>
  <main class="shell">
    <section class="detail">
      <nav class="breadcrumbs"><NuxtLink to="/">トップ</NuxtLink><span>/</span><span>{{ brand.name }}</span></nav>
      <article class="detailpanel">
        <p class="eyebrow">BRAND</p>
        <h1>{{ brand.name }}</h1>
        <div class="detailmeta">
          <span v-if="brand.origin_country">{{ brand.origin_country }}</span>
          <a v-if="brand.website_url" :href="brand.website_url" target="_blank" rel="noopener noreferrer">公式サイト ↗</a>
        </div>
        <p class="detailtext">{{ flavors.length }}件のフレーバーを掲載しています。</p>
        <div class="collectionlist">
          <div v-for="flavor in flavors" :key="flavor.id" class="collectionitem">
            <NuxtLink :to="flavorPath(flavor.name, flavor.id)">
              <strong>{{ flavor.name }}</strong><br>
              <small>{{ flavor.flavor_profile }}</small>
            </NuxtLink>
          </div>
        </div>
        <NuxtLink class="backlink" to="/">← 一覧へ戻る</NuxtLink>
      </article>
    </section>
  </main>
</template>
