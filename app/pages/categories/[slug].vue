<script setup lang="ts">
import type { SupabaseClient } from '@supabase/supabase-js'
import { absoluteUrl, categoryPath, compactDescription, flavorPath, toSlug } from '#shared/utils/seo'

const route = useRoute()
const config = useRuntimeConfig()
const { $supabase } = useNuxtApp() as unknown as { $supabase: SupabaseClient }
const slug = String(route.params.slug || '')

const { data } = await useAsyncData('category-' + slug, async () => {
  const result = await $supabase
    .from('shisha_flavors')
    .select('id,name,flavor_profile,category,japan_availability_status,shisha_brands(id,name)')
    .not('category', 'is', null)
    .order('name')
  if (result.error) throw createError({ statusCode: 502, statusMessage: result.error.message })

  const rows = (result.data || []) as any[]
  const category = rows.find((row) => row.category && toSlug(row.category) === slug)?.category
  return { category, flavors: category ? rows.filter((row) => row.category === category) : [] }
})

if (!data.value?.category) throw createError({ statusCode: 404, statusMessage: 'Category not found' })

const category = data.value.category
const flavors = data.value.flavors as any[]
const siteUrl = String(config.public.siteUrl)
const path = categoryPath(category)
const canonical = absoluteUrl(siteUrl, path)
const description = compactDescription(`${category}系のシーシャフレーバー${flavors.length}件を一覧で確認できます。`)

useSeoMeta({
  title: `${category}系シーシャフレーバー一覧 | Shisha Flavor Atlas`,
  description,
  ogTitle: `${category} | Shisha Flavor Atlas`,
  ogDescription: description,
  ogType: 'website',
  ogUrl: canonical,
  twitterCard: 'summary',
  twitterTitle: category,
  twitterDescription: description
})
useHead({ link: [{ rel: 'canonical', href: canonical }] })
useHeadSafe({
  script: [{
    type: 'application/ld+json',
    textContent: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: category,
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
      <nav class="breadcrumbs"><NuxtLink to="/">トップ</NuxtLink><span>/</span><span>{{ category }}</span></nav>
      <article class="detailpanel">
        <p class="eyebrow">CATEGORY</p>
        <h1>{{ category }}</h1>
        <p class="detailtext">{{ flavors.length }}件のフレーバーを掲載しています。</p>
        <div class="collectionlist">
          <div v-for="flavor in flavors" :key="flavor.id" class="collectionitem">
            <NuxtLink :to="flavorPath(flavor.name, flavor.id)">
              <strong>{{ flavor.shisha_brands?.name }} · {{ flavor.name }}</strong><br>
              <small>{{ flavor.flavor_profile }}</small>
            </NuxtLink>
          </div>
        </div>
        <NuxtLink class="backlink" to="/">← 一覧へ戻る</NuxtLink>
      </article>
    </section>
  </main>
</template>
