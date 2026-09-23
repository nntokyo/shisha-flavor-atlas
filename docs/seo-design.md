# SEO 基盤設計

Issue #1 の実装設計をコード側にも残す。

## 基本設計

- Nuxt SSR で公開フレーバー / MIX データを初期HTMLへ出力する。
- canonical / OGP / Twitter Card / JSON-LD をページ単位でSSR出力する。
- `robots.txt` / `sitemap.xml` をNitro server routeで配信する。
- フレーバー、ブランド、カテゴリ、MIXに恒久URLを付与する。
- 現行の検索、絞り込み、MIX投稿UIは維持する。

## 詳細設計

- canonical origin: `NUXT_PUBLIC_SITE_URL`
- Supabase: publishable key + RLSのみ。service-role keyは使用しない。
- slug: Unicodeを維持した正規化文字列。flavor / brand / mix は末尾DB IDを正として衝突を避ける。
- sitemap: published MIXのみ。DB障害時はホームURLだけでも有効XMLを返す。
- 構造化データ: WebSite / WebPage / CollectionPage / CreativeWork / BreadcrumbList / ItemList のみ。
- 事実根拠のない価格、評価、在庫等は構造化データに含めない。

## セキュリティ

- 秘密値や実環境の接続情報は公開リポジトリへコミットしない。
- `.env` はGit管理外。
- `.env.example` はプレースホルダーのみ。
- 対象DBテーブルはシーシャ機能4テーブルに限定する。
