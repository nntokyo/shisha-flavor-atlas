<script setup lang="ts">
const props = defineProps<{ error: { statusCode?: number; statusMessage?: string; message?: string } }>()

useSeoMeta({
  title: `${props.error.statusCode || 404} | Shisha Flavor Atlas`,
  robots: 'noindex, nofollow'
})
</script>

<template>
  <main class="shell">
    <section class="errorpage">
      <p class="eyebrow">ERROR</p>
      <h1>{{ error.statusCode || 404 }}</h1>
      <p class="detailtext">{{ error.statusMessage || error.message || 'ページが見つかりません。' }}</p>
      <NuxtLink class="backlink" to="/">← トップへ戻る</NuxtLink>
    </section>
  </main>
</template>
