<script setup lang="ts">
import type { SupabaseClient } from '@supabase/supabase-js'
import { absoluteUrl, brandPath, categoryPath, compactDescription, flavorPath, idFromSlug } from '#shared/utils/seo'

const route = useRoute()
const config = useRuntimeConfig()
const { $supabase } = useNuxtApp() as unknown as { $supabase: SupabaseClient }
const slug = String(route.params.slug || '')
const id = idFromSlug(slug)

if (!id) {
  throw createError({ statusCode: 404, statusMessage: 'Flavor not found' })
}

const { data } = await useAsyncData('flavor-' + id, async () => {
  const result = await $supabase
    .from('shisha_flavors')
    .select('id,name,flavor_profile,official_description,category,tobacco_leaf,series,source_url,japan_source_url,japan_source_note,japan_availability_status,product_status,nicotine_status,strength,package_sizes,market_regions,verified_at,shisha_brands(id,name,origin_country,website_url)')
    .eq('id', id)
    .maybeSingle()

  if (result.error) throw createError({ statusCode: 502, statusMessage: result.error.message })
  return result.data
})

if (!data.value) {
  throw createError({ statusCode: 404, statusMessage: 'Flavor not found' })
}

const flavor = data.value as any
const siteUrl = String(config.public.siteUrl)
const path = flavorPath(flavor.name, flavor.id)
const canonical = absoluteUrl(siteUrl, path)
const description = compactDescription(flavor.official_description || flavor.flavor_profile)
const brand = flavor.shisha_brands

useSeoMeta({
  title: `${flavor.name} | ${brand?.name || 'シーシャフレーバー'} | Shisha Flavor Atlas`,
  description,
  ogTitle: flavor.name,
  ogDescription: description,
  ogType: 'article',
  ogUrl: canonical,
  ogImage: absoluteUrl(siteUrl, '/logo.svg'),
  twitterCard: 'summary',
  twitterTitle: flavor.name,
  twitterDescription: description,
  twitterImage: absoluteUrl(siteUrl, '/logo.svg')
})

useHead({ link: [{ rel: 'canonical', href: canonical }] })
useHeadSafe({
  script: [{
    type: 'application/ld+json',
    textContent: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          name: flavor.name,
          description,
          url: canonical,
          inLanguage: 'ja'
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Shisha Flavor Atlas', item: absoluteUrl(siteUrl, '/') },
            ...(brand?.id ? [{ '@type': 'ListItem', position: 2, name: brand.name, item: absoluteUrl(siteUrl, brandPath(brand.name, brand.id)) }] : []),
            { '@type': 'ListItem', position: brand?.id ? 3 : 2, name: flavor.name, item: canonical }
          ]
        }
      ]
    })
  }]
})
</script>

<template>
  <main class="shell">
    <section class="detail">
      <nav class="breadcrumbs">
        <NuxtLink to="/">トップ</NuxtLink><span>/</span>
        <NuxtLink v-if="brand?.id" :to="brandPath(brand.name, brand.id)">{{ brand.name }}</NuxtLink>
        <span v-if="brand?.id">/</span><span>{{ flavor.name }}</span>
      </nav>
      <article class="detailpanel">
        <p class="eyebrow">FLAVOR DETAIL</p>
        <h1>{{ flavor.name }}</h1>
        <p class="detailtext">{{ flavor.official_description || flavor.flavor_profile }}</p>
        <div class="detailmeta">
          <NuxtLink v-if="brand?.id" :to="brandPath(brand.name, brand.id)">{{ brand.name }}</NuxtLink>
          <NuxtLink v-if="flavor.category" :to="categoryPath(flavor.category)">{{ flavor.category }}</NuxtLink>
          <span v-if="flavor.japan_availability_status === 'verified'">国内流通確認済み</span>
        </div>
        <dl class="detailgrid">
          <div><dt>風味</dt><dd>{{ flavor.flavor_profile }}</dd></div>
          <div><dt>原産国</dt><dd>{{ brand?.origin_country || '—' }}</dd></div>
          <div><dt>葉</dt><dd>{{ flavor.tobacco_leaf || '—' }}</dd></div>
          <div><dt>シリーズ</dt><dd>{{ flavor.series || '—' }}</dd></div>
          <div><dt>強さ</dt><dd>{{ flavor.strength || '—' }}</dd></div>
          <div><dt>ニコチン</dt><dd>{{ flavor.nicotine_status || '—' }}</dd></div>
        </dl>
        <div class="links" style="margin-top:24px">
          <a :href="flavor.source_url" target="_blank" rel="noopener noreferrer">公式・出典情報 ↗</a>
          <a v-if="flavor.japan_source_url" :href="flavor.japan_source_url" target="_blank" rel="noopener noreferrer">国内取扱情報 ↗</a>
        </div>
        <NuxtLink class="backlink" to="/">← 一覧へ戻る</NuxtLink>
      </article>
    </section>
  </main>
</template>
