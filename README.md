# Shisha Flavor Atlas

Vercel の Production デプロイから、公開バンドルで確認できる現行挙動をソース形式へ復元したベースラインです。

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

以下は Vercel の環境変数として設定してください。値はリポジトリへコミットしません。

- `NUXT_PUBLIC_SUPABASE_URL`
- `NUXT_PUBLIC_SUPABASE_KEY`

## Baseline scope

- フレーバー一覧、検索、カテゴリ絞り込み、国内流通確認済み絞り込み
- おすすめ MIX レシピ表示
- `%` / `g` 配合による MIX レシピ投稿
- 現行 Production と同等の主要 UI / メタ情報 / SVG アセット

このコミットは SEO 改修前の基準点です。
