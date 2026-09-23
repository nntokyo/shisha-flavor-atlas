<script setup lang="ts">
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  SITE_NAME,
  DEFAULT_DESCRIPTION,
  absoluteUrl,
  brandPath,
  categoryPath,
  flavorPath,
  mixPath
} from '#shared/utils/seo'

type Brand = { id?: number; name: string; origin_country: string | null }
type Flavor = {
  id: number
  name: string
  flavor_profile: string
  category: string | null
  tobacco_leaf: string | null
  series: string | null
  source_url: string
  japan_source_url: string | null
  japan_availability_status: string
  shisha_brands: Brand | null
}
type RecipeItem = {
  percentage: number | null
  grams: number | null
  position: number
  shisha_flavors: Flavor | null
}
type Recipe = {
  id: number
  title: string
  description: string | null
  author_name: string
  difficulty: 'easy' | 'medium' | 'hard'
  tags: string[]
  is_recommended: boolean
  recommendation_note: string | null
  measurement_mode: 'percent' | 'grams'
  target_temperature_c: number | null
  heat_notes: string | null
  total_grams: number | null
  mix_recipe_items: RecipeItem[]
}

const { $supabase } = useNuxtApp() as unknown as { $supabase: SupabaseClient }
const config = useRuntimeConfig()
const siteUrl = String(config.public.siteUrl || 'https://shisha-flavor-atlas.vercel.app')
const canonical = absoluteUrl(siteUrl, '/')

const { data, pending } = await useAsyncData('home-data', async () => {
  const [flavorResult, recipeResult] = await Promise.all([
    $supabase
      .from('shisha_flavors')
      .select('id,name,flavor_profile,category,tobacco_leaf,series,source_url,japan_source_url,japan_availability_status,shisha_brands(id,name,origin_country)')
      .order('name')
      .limit(1000),
    $supabase
      .from('mix_recipes')
      .select('id,title,description,author_name,difficulty,tags,is_recommended,recommendation_note,measurement_mode,target_temperature_c,heat_notes,total_grams,mix_recipe_items(percentage,grams,position,shisha_flavors(id,name,flavor_profile,category,tobacco_leaf,series,source_url,japan_source_url,japan_availability_status,shisha_brands(id,name,origin_country)))')
      .eq('status', 'published')
      .order('is_recommended', { ascending: false })
      .order('created_at', { ascending: false })
  ])

  return {
    flavors: (flavorResult.data || []) as unknown as Flavor[],
    recipes: (recipeResult.data || []) as unknown as Recipe[],
    error: flavorResult.error?.message || recipeResult.error?.message || ''
  }
}, {
  default: () => ({ flavors: [] as Flavor[], recipes: [] as Recipe[], error: '' })
})

const flavors = computed(() => data.value?.flavors || [])
const recipes = computed(() => data.value?.recipes || [])
const errorMessage = computed(() => data.value?.error || '')
const activeTab = ref<'flavors' | 'mix'>('flavors')
const keyword = ref('')
const category = ref('')
const japanOnly = ref(false)
const submitMessage = ref('')

useSeoMeta({
  title: 'Shisha Flavor Atlas | 世界のシーシャフレーバー・MIXデータベース',
  description: DEFAULT_DESCRIPTION,
  ogTitle: 'Shisha Flavor Atlas',
  ogDescription: DEFAULT_DESCRIPTION,
  ogType: 'website',
  ogUrl: canonical,
  ogImage: absoluteUrl(siteUrl, '/logo.svg'),
  twitterCard: 'summary',
  twitterTitle: 'Shisha Flavor Atlas',
  twitterDescription: DEFAULT_DESCRIPTION,
  twitterImage: absoluteUrl(siteUrl, '/logo.svg')
})

useHead({ link: [{ rel: 'canonical', href: canonical }] })
useHeadSafe(() => ({
  script: [{
    type: 'application/ld+json',
    textContent: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          name: SITE_NAME,
          url: canonical,
          description: DEFAULT_DESCRIPTION,
          inLanguage: 'ja'
        },
        {
          '@type': 'ItemList',
          name: 'シーシャフレーバー',
          itemListElement: flavors.value.slice(0, 100).map((flavor, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: flavor.name,
            url: absoluteUrl(siteUrl, flavorPath(flavor.name, flavor.id))
          }))
        }
      ]
    })
  }]
}))

const draft = reactive({
  title: '',
  description: '',
  author: '',
  difficulty: 'easy' as 'easy' | 'medium' | 'hard',
  measurement_mode: 'percent' as 'percent' | 'grams',
  temperature: '' as string | number,
  heat_notes: '',
  items: [
    { flavor_id: '', amount: 50 },
    { flavor_id: '', amount: 50 }
  ]
})

const categories = computed(() =>
  [...new Set(flavors.value.map((flavor) => flavor.category).filter(Boolean) as string[])].sort()
)

const filteredFlavors = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  return flavors.value.filter((flavor) => {
    const searchable = [
      flavor.name,
      flavor.flavor_profile,
      flavor.category,
      flavor.series,
      flavor.shisha_brands?.name,
      flavor.shisha_brands?.origin_country
    ].filter(Boolean).join(' ').toLowerCase()

    return (
      (!query || searchable.includes(query)) &&
      (!category.value || flavor.category === category.value) &&
      (!japanOnly.value || flavor.japan_availability_status === 'verified')
    )
  })
})

const recommendedRecipes = computed(() => recipes.value.filter((recipe) => recipe.is_recommended))
const totalAmount = computed(() => draft.items.reduce((sum, item) => sum + Number(item.amount || 0), 0))
const unit = computed(() => draft.measurement_mode === 'percent' ? '%' : 'g')

function addItem() {
  if (draft.items.length < 6) draft.items.push({ flavor_id: '', amount: 0 })
}
function removeItem(index: number) {
  if (draft.items.length > 2) draft.items.splice(index, 1)
}
function setMeasurementMode(mode: 'percent' | 'grams') {
  draft.measurement_mode = mode
  draft.items.forEach((item, index) => {
    item.amount = index === 0 || index === 1 ? (mode === 'percent' ? 50 : 10) : 0
  })
}
async function submitRecipe() {
  submitMessage.value = ''
  if (!draft.title.trim()) {
    submitMessage.value = 'タイトルを入力してください'
    return
  }
  if (draft.items.some((item) => !item.flavor_id)) {
    submitMessage.value = 'フレーバーを選択してください'
    return
  }
  if (draft.measurement_mode === 'percent' && totalAmount.value !== 100) {
    submitMessage.value = '配合比率の合計を100%にしてください'
    return
  }
  if (draft.measurement_mode === 'grams' && totalAmount.value <= 0) {
    submitMessage.value = 'グラム数を入力してください'
    return
  }

  const temperature = draft.temperature === '' ? null : Number(draft.temperature)
  if (temperature !== null && (temperature < 20 || temperature > 300)) {
    submitMessage.value = '温度は20〜300℃で入力してください'
    return
  }

  const items = draft.items.map((item) =>
    draft.measurement_mode === 'percent'
      ? { flavor_id: Number(item.flavor_id), percentage: Number(item.amount) }
      : { flavor_id: Number(item.flavor_id), grams: Number(item.amount) }
  )

  const { error } = await $supabase.rpc('create_mix_recipe', {
    p_title: draft.title,
    p_description: draft.description,
    p_author_name: draft.author || 'Guest',
    p_difficulty: draft.difficulty,
    p_tags: [],
    p_items: items,
    p_measurement_mode: draft.measurement_mode,
    p_temperature_c: temperature,
    p_heat_notes: draft.heat_notes
  })

  if (error) {
    submitMessage.value = '登録できませんでした: ' + error.message
    return
  }

  submitMessage.value = '登録しました。内容確認後に公開されます。'
  draft.title = ''
  draft.description = ''
  draft.author = ''
  draft.difficulty = 'easy'
  draft.temperature = ''
  draft.heat_notes = ''
  setMeasurementMode('percent')
}
function difficultyLabel(value: Recipe['difficulty']) {
  return value === 'easy' ? 'かんたん' : value === 'medium' ? '標準' : '上級'
}
function amountLabel(recipe: Recipe, item: RecipeItem) {
  return recipe.measurement_mode === 'grams' ? (item.grams ?? 0) + 'g' : (item.percentage ?? 0) + '%'
}
</script>

<template>
  <main class="shell">
    <header class="brandbar">
      <div class="brandlockup">
        <img src="/logo.svg" class="logo" alt="Shisha Flavor Atlas">
        <div>
          <div class="brandname">Shisha Flavor Atlas</div>
          <div class="tagline">EXPLORE AROUND THE WORLD</div>
        </div>
      </div>
      <div class="records">
        <strong>{{ flavors.length }}</strong>
        <span>flavor records</span>
      </div>
    </header>

    <section class="hero">
      <p class="eyebrow">FACT-BASED SHISHA DATABASE</p>
      <h1>世界のフレーバーとMIXを、ひとつの場所に。</h1>
      <p class="lead">フレーバー情報に加えて、%またはグラム配合・温度指定つきのMIXレシピを登録できます。</p>
    </section>

    <nav class="tabs">
      <button :class="{ active: activeTab === 'flavors' }" @click="activeTab = 'flavors'">フレーバー</button>
      <button :class="{ active: activeTab === 'mix' }" @click="activeTab = 'mix'">MIXレシピ</button>
    </nav>

    <p v-if="pending" class="state">Supabaseから読み込み中...</p>
    <p v-else-if="errorMessage" class="state error">{{ errorMessage }}</p>

    <template v-else-if="activeTab === 'flavors'">
      <section class="controls">
        <input v-model="keyword" type="search" placeholder="ブランド、フレーバー、風味で検索">
        <select v-model="category">
          <option value="">すべてのカテゴリ</option>
          <option v-for="item in categories" :key="item" :value="item">{{ item }}</option>
        </select>
        <label class="check">
          <input v-model="japanOnly" type="checkbox">
          国内流通確認済みのみ
        </label>
      </section>

      <div class="meta">{{ filteredFlavors.length }} 件表示</div>

      <section class="grid">
        <article v-for="flavor in filteredFlavors" :key="flavor.id" class="card">
          <div class="topline">
            <NuxtLink
              v-if="flavor.shisha_brands?.id"
              class="brand seo-link"
              :to="brandPath(flavor.shisha_brands.name, flavor.shisha_brands.id)"
            >
              {{ flavor.shisha_brands.name }}
            </NuxtLink>
            <span v-else class="brand">{{ flavor.shisha_brands?.name }}</span>
            <span v-if="flavor.japan_availability_status === 'verified'" class="pill">国内流通確認済み</span>
          </div>

          <h2>
            <NuxtLink class="seo-link" :to="flavorPath(flavor.name, flavor.id)">{{ flavor.name }}</NuxtLink>
          </h2>
          <p class="profile">{{ flavor.flavor_profile }}</p>
          <dl>
            <div>
              <dt>カテゴリ</dt>
              <dd>
                <NuxtLink v-if="flavor.category" class="seo-link" :to="categoryPath(flavor.category)">
                  {{ flavor.category }}
                </NuxtLink>
                <template v-else>—</template>
              </dd>
            </div>
            <div><dt>葉</dt><dd>{{ flavor.tobacco_leaf || '—' }}</dd></div>
            <div><dt>シリーズ</dt><dd>{{ flavor.series || '—' }}</dd></div>
            <div><dt>原産国</dt><dd>{{ flavor.shisha_brands?.origin_country || '—' }}</dd></div>
          </dl>
          <div class="links">
            <a :href="flavor.source_url" target="_blank" rel="noopener noreferrer">公式・出典情報 ↗</a>
            <a v-if="flavor.japan_source_url" :href="flavor.japan_source_url" target="_blank" rel="noopener noreferrer">国内取扱情報 ↗</a>
          </div>
        </article>
      </section>
    </template>

    <template v-else>
      <section class="section">
        <div class="sectionhead">
          <div>
            <p class="eyebrow">RECOMMENDED MIX</p>
            <h2>おすすめMIX</h2>
          </div>
          <p>配合単位と温度情報も表示します。</p>
        </div>

        <div class="recipegrid">
          <article v-for="recipe in recommendedRecipes" :key="recipe.id" class="recipecard">
            <div class="topline">
              <span class="pill gold">おすすめ</span>
              <span class="difficulty">{{ difficultyLabel(recipe.difficulty) }}</span>
            </div>
            <h3>
              <NuxtLink class="seo-link" :to="mixPath(recipe.title, recipe.id)">{{ recipe.title }}</NuxtLink>
            </h3>
            <p>{{ recipe.description }}</p>
            <div class="recipeMeta">
              <span>{{ recipe.measurement_mode === 'grams' ? 'グラム配合' : '%配合' }}</span>
              <span v-if="recipe.total_grams">{{ recipe.total_grams }}g total</span>
              <span v-if="recipe.target_temperature_c">温度 {{ recipe.target_temperature_c }}℃</span>
            </div>
            <div class="mixitems">
              <div
                v-for="item in [...recipe.mix_recipe_items].sort((a, b) => a.position - b.position)"
                :key="item.shisha_flavors?.id"
                class="mixrow"
              >
                <div>
                  <strong>{{ item.shisha_flavors?.shisha_brands?.name }} · {{ item.shisha_flavors?.name }}</strong>
                  <small>{{ item.shisha_flavors?.flavor_profile }}</small>
                </div>
                <b>{{ amountLabel(recipe, item) }}</b>
                <div class="miniLinks">
                  <NuxtLink
                    v-if="item.shisha_flavors"
                    :to="flavorPath(item.shisha_flavors.name, item.shisha_flavors.id)"
                  >
                    詳細
                  </NuxtLink>
                  <a :href="item.shisha_flavors?.source_url" target="_blank" rel="noopener noreferrer">公式情報</a>
                  <a v-if="item.shisha_flavors?.japan_source_url" :href="item.shisha_flavors.japan_source_url" target="_blank" rel="noopener noreferrer">国内取扱情報</a>
                </div>
              </div>
            </div>
            <p v-if="recipe.heat_notes" class="heatnote"><strong>加熱メモ:</strong> {{ recipe.heat_notes }}</p>
            <p v-if="recipe.recommendation_note" class="note">{{ recipe.recommendation_note }}</p>
          </article>
        </div>
      </section>

      <section class="section formsection">
        <div class="sectionhead">
          <div>
            <p class="eyebrow">SUBMIT YOUR MIX</p>
            <h2>MIXレシピを登録</h2>
          </div>
          <p>2〜6種類。%またはgで登録し、温度も指定できます。</p>
        </div>

        <form class="recipeform" @submit.prevent="submitRecipe">
          <div class="formgrid">
            <label>レシピ名<input v-model="draft.title" maxlength="80" placeholder="例：Citrus Mint Blend"></label>
            <label>投稿者名<input v-model="draft.author" maxlength="50" placeholder="Guest"></label>
            <label>難易度
              <select v-model="draft.difficulty">
                <option value="easy">かんたん</option>
                <option value="medium">標準</option>
                <option value="hard">上級</option>
              </select>
            </label>
            <label>温度（℃・任意）<input v-model="draft.temperature" type="number" min="20" max="300" step="1" placeholder="例：220"></label>
            <label class="wide">加熱メモ<textarea v-model="draft.heat_notes" maxlength="300" rows="2" placeholder="例：立ち上げは強め、5分後に炭を外側へ" /></label>
            <label class="wide">説明<textarea v-model="draft.description" maxlength="500" rows="3" placeholder="風味の狙い、吸い方の印象など" /></label>
          </div>

          <div class="modeSwitch">
            <span>配合単位</span>
            <button type="button" :class="{ active: draft.measurement_mode === 'percent' }" @click="setMeasurementMode('percent')">%</button>
            <button type="button" :class="{ active: draft.measurement_mode === 'grams' }" @click="setMeasurementMode('grams')">g</button>
          </div>

          <div class="ingredientTitle">
            <strong>配合</strong>
            <span :class="{ bad: draft.measurement_mode === 'percent' && totalAmount !== 100 }">合計 {{ totalAmount }}{{ unit }}</span>
          </div>

          <div class="ingredients">
            <div v-for="(item, index) in draft.items" :key="index" class="ingredient">
              <select v-model="item.flavor_id">
                <option value="">フレーバーを選択</option>
                <option v-for="flavor in flavors" :key="flavor.id" :value="String(flavor.id)">{{ flavor.shisha_brands?.name }} — {{ flavor.name }}</option>
              </select>
              <input v-model.number="item.amount" type="number" min="0.1" :max="draft.measurement_mode === 'percent' ? 100 : 500" step="0.1">
              <span>{{ unit }}</span>
              <button type="button" class="remove" @click="removeItem(index)">×</button>
            </div>
          </div>

          <button v-if="draft.items.length < 6" type="button" class="secondary" @click="addItem">＋ フレーバーを追加</button>
          <div class="submitrow">
            <button class="primary" type="submit">レシピを登録</button>
            <span>{{ submitMessage }}</span>
          </div>
        </form>
      </section>
    </template>
  </main>
</template>
