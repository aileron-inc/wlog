# Wlog

人狼審問（jinrou shimon）のログビューア + AI 発言生成。

## セットアップ

```bash
mise run setup
```

## 開発サーバー

```bash
bin/dev
```

Rails + Vite + Worker（AI発言生成）が起動する。

## mise tasks

| タスク | 説明 |
|---|---|
| `mise run server` | 開発サーバー起動 (rails + vite + worker) |
| `mise run gen:village "村名" 10` | AI村生成ジョブを投入 |
| `mise run scrape:seed` | スクレイピング + DB投入 + キャラ表生成 |
| `mise run gen:characters` | キャラクター表 TS を生成 |

## 環境変数

| 変数 | 必須 | 説明 |
|---|---|---|
| `Z_AI_API_KEY` | ○ | Z.AI API キー |
| `Z_AI_MODEL` | - | モデル名（省略: `glm-4.7-flash`） |

## 技術スタック

| 層 | 技術 |
|---|---|
| データ取得 | sling CLI → JSON → SQLite |
| バックエンド | Rails 8.1 + ActiveRecord + SQLite3 |
| AI 発言生成 | bun + openai SDK + Z.AI API |
| フロントエンド | React 19 + Inertia 3 + Tailwind 4 + Vite |
| バリデーション | weak_parameters |
