# wlog 現状メモ (2026-05-19)

## 目的

人狼審問（jinrou shimon）のログビューア。外部サイトにある人狼ゲームのログをスクレイピングして、自分の環境で読みやすく閲覧するツール。

## 技術スタック

| 層 | 技術 |
|---|---|
| データ取得 | sling CLI (`sling/scrape.ts`) → JSON → SQLite |
| バックエンド | Rails 8.1 + ActiveRecord + SQLite3 + Falcon |
| クエリ | 生SQL (`app/queries/villages/*.sql`) → `json_object` で JSON 直接返却 |
| フロントエンド | React 19 + Inertia 3 + Tailwind 4 + Vite 8 |
| バリデーション | weak_parameters |
| ルーティング | `params[:id]` でページ名を dispatch |

## ページ構成

1. **index** (`/villages`) — 村一覧
2. **about** (`/villages/about?village_id=...`) — 村情報・参加者・日リスト・spoiler toggle
3. **day** (`/villages/day?village_id=...&day=...&page=...`) — ログ（発言一覧）+ ページネーション

## プロジェクト構造

```
app/
  controllers/
    villages_controller.rb    # show dispatch パターン
  models/
    props_query.rb            # SQL ファイルを名前解決して実行
  queries/villages/
    index.sql                 # 村一覧
    about.sql                 # 村情報
    day.sql                   # 日次ログ
  frontend/
    pages/villages/
      index.tsx               # 村一覧
      about.tsx               # 村情報
      day.tsx                 # ログ
    data/
      characters.ts           # キャラクターデータ
sling/
  scrape.ts                   # スクレイピングスクリプト
  wlog.yaml                   # Sling パイプライン設定
  seeds/                      # スクレイピング結果の JSON
```

## 未整理事項

- README.md がデフォルトのまま
- `app/frontend/components/` `lib/` `shared/` が空
- `app/controllers/concerns/` が空
- `script/` が空
