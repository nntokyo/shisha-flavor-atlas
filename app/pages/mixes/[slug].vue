<script setup lang="ts">
import type { SupabaseClient } from '@supabase/supabase-js'
import { absoluteUrl, compactDescription, flavorPath, idFromSlug, mixPath } from '#shared/utils/seo'

const route = useRoute()
const config = useRuntimeConfig()
const { $supabase } = useNuxtApp() as unknown as { $supabase: SupabaseClient }
const id = idFromSlug(String(route.params.slug || ''))

if (!id) throw createError({ statusCode: 404, statusMessage: 'Mix not found' })

const { data } = await useAsyncData('mix-' + id, async () => {
  const result = await $supabase
    .from('mix_recipes')
    .select('id,title,description,author_name,difficulty,tags,is_recommended,recommendation_note,measurement_mode,target_temperature_c,heat_notes,total_grams,created_at,mix_recipe_items(percentage,grams,position,shisha_flavors(id,name,flavor_profile,source_url,shisha_brands(id,name)))')
    .eq('id', id)
    .eq('status', 'published')
    .maybeSingle()
  if (result.error) throw createError({ statusCode: 502, statusMessage: result.error.message })
  return result.data
})

if (!data.value) throw createError({ statusCode: 404, statusMessage: 'Mix not found' })

const mix = data.value as any
const items = [...(mix.mix_recipe_items || [])].sort((a: any, b: any) => a.position - b.position)
const siteUrl = String(config.public.siteUrl)
const path = mixPath(mix.title, mix.id)
const canonical = absoluteUrl(siteUrl, path)
const description = compactDescription(mix.description || mix.recommendation_note || mix.heat_notes)

useSeoMeta({
  title: `${mix.title} | シーシャMIXレシピ | Shisha Flavor Atlas`,
  description,
  ogTitle: mix.title,
  ogDescription: description,
  ogType: 'article',
  ogUrl: canonical,
  twitterCard: 'summary',
  twitterTitle: mix.title,
  twitterDescription: description
})
useHead({ link: [{ rel: 'canonical', href: canonical }] })
useHeadSafe({
  script: [{
    type: 'application/ld+json',
    textContent: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'CreativeWork',
          name: mix.title,
          description,
          url: canonical,
          author: { '@type': 'Person', name: mix.author_name || 'Guest' },
          inLanguage: 'ja'
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Shisha Flavor Atlas', item: absoluteUrl(siteUrl, '/') },
            { '@type': 'ListItem', position: 2, name: mix.title, item: canonical }
          ]
        }
      ]
    })
  }]
})

function amountLabel(item: any) {
  return mix.measurement_mode === 'grams' ? `${item.grams ?? 0}g` : `${item.percentage ?? 0}%`
}
</script>

<template>
  <main class="shell">
    <section class="detail">
      <nav class="breadcrumbs"><NuxtLink to="/">トップ</NuxtLink><span>/</span><span>{{ mix.title }}</span></nav>
      <article class="detailpanel">
        <p class="eyebrow">MIX RECIPE</p>
        <h1>{{ mix.title }}</h1>
        <p class="detailtext">{{ mix.description }}</p>
        <div class="detailmeta">
          <span>{{ mix.measurement_mode === 'grams' ? 'グラム配合' : '%配合' }}</span>
          <span v-if="mix.target_temperature_c">温度 {{ mix.target_temperature_c }}℃</span>
          <span>投稿者 {{ mix.author_name }}</span>
        </div>
        <h2>配合</h2>
        <div class="collectionlist">
          <div v-for="item in items" :key="item.shisha_flavors?.id" class="collectionitem">
            <NuxtLink v-if="item.shisha_flavors" :to="flavorPath(item.shisha_flavors.name, item.shisha_flavors.id)">
              <strong>{{ item.shisha_flavors.shisha_brands?.name }} · {{ item.shisha_flavors.name }}</strong>
              — {{ amountLabel(item) }}<br>
              <small>{{ item.shisha_flavors.flavor_profile }}</small>
            </NuxtLink>
          </div>
        </div>
        <p v-if="mix.heat_notes" class="heatnote"><strong>加熱メモ:</strong> {{ mix.heat_notes }}</p>
        <p v-if="mix.recommendation_note" class="note">{{ mix.recommendation_note }}</p>
        <NuxtLink class="backlink" to="/">← 一覧へ戻る</NuxtLink>
      </article>
    </section>
  </main>
</template>
