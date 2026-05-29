# Wlog Conventions

## 開発URL

https://wlog.lvh.me/

## bin / mise

| コマンド | 説明 |
|---|---|
| `bin/dev` | overmind で Procfile.dev を起動（rails + vite + worker） |
| `bin/query <name> [key value ...]` | PropsQuery を直接実行して JSON 出力 |
| `bin/explain <name> [key value ...]` | EXPLAIN QUERY PLAN 表示 |
| `bin/sql-lint` | SQL リント（json_group_array + LIMIT の同時使用を検出） |
| `mise run server` | `bin/dev` と同じ |
| `mise run scrape` | スクレイパー実行（引数で村番号指定、省略時1969） |
| `mise run scrape:seed` | スクレイプ + sling DB投入 + キャラ表生成 |
| `mise run sling:seed` | sling で JSON → SQLite に full-refresh |
| `mise run gen:characters` | キャラクター表 TS を生成 |
| `mise run gen:village` | AI村生成ジョブを投入 |
| `mise run worker` | ワーカー手動起動（※bin/dev 経由が推奨） |

## Controller

birdseye の `show` dispatch パターンに従う。`params[:id]` で TSX/SQL を決定する。

```ruby
class VillagesController < ApplicationController
  self.defaults = { village_id: "", day: "", source: "villager", page: "1", per_page: "50" }.freeze

  validates :show do
    string :village_id, strong: true
    string :day, strong: true
    string :source, strong: true
    string :page, strong: true
    string :per_page, strong: true
  end

  def index = render(inertia: "villages/index", props: PropsQuery.find("villages/index").call)
  def show = render(inertia: "villages/#{params[:id]}", props: PropsQuery.find("villages/#{params[:id]}", defaults:, permitted_params:).call)
end
```

### ルーティング

```ruby
root "villages#index"
get "villages/:id", to: "villages#show"
```

`params[:id]` はページ名（`about`, `day` など）。データはすべてクエリパラメータで渡す。

| URL | params[:id] | 説明 |
|---|---|---|
| `/villages` | — | index |
| `/villages/about?village_id=vlg_1969` | `about` | 村情報 |
| `/villages/day?village_id=vlg_1969&day=1&page=1` | `day` | ログ |

### defaults

`self.defaults` はすべての show action に共通のデフォルト値。`PropsQuery` が `defaults.merge(permitted_params)` し、SQL の `:param` にないキーは自動で切り捨てられるため、過剰なキーを入れても問題ない。

## SQL (`app/queries/villages/`)

各 SQL は `SELECT json_object(...)` で1つの JSON オブジェクトを返す。

### ページネーション

`json_group_array` は集計関数なので、外側の `LIMIT` は効かない。サブクエリで row を先に制限する。

```sql
'posts', (
  SELECT json_group_array(json_object(...)) FROM (
    SELECT * FROM posts
    WHERE ...
    ORDER BY sequence
    LIMIT CAST(:per_page AS INTEGER)
    OFFSET (CAST(:page AS INTEGER) - 1) * CAST(:per_page AS INTEGER)
  )
)
```

### SQL 命名

- テーブルエイリアスは使わない
- カンマは行頭
- `:param` でバインド
- コメントは不要

## Pages (`app/frontend/pages/villages/`)

| ファイル | 説明 |
|---|---|
| `index.tsx` | 村一覧 |
| `about.tsx` | 村情報・参加者・日リスト・spoiler toggle |
| `day.tsx` | ログ・ページネーション |

### `_xxx.tsx` コンポーネント（Colocation）

ページごとのディレクトリに `_` プレフィックスのファイルを配置する。

| ファイル | 説明 |
|---|---|
| `_props.ts` | そのディレクトリの全ページの Props 型を集約して定義する |
| `_post.tsx` | 発言1件のレンダリング（システムメッセージ + キャラ発言） |
| `_pagination.tsx` | ページネーション（8ページ以上で省略表示） |
| `_day-nav.tsx` | 日タブ + 前/次日リンク |

### Props 型定義

各ページの Props 型は `_props.ts` に集約する。ページ本体では `import type` でインポートする。型は SQL の `json_object` と対応し、サーバー側の `PropsQuery` が生成する JSON の構造を表現する。

### URL構築

クエリパラメータは `URLSearchParams` で構築する。

```tsx
function qs(params: Record<string, string>): string {
  const s = new URLSearchParams(params).toString();
  return s ? `?${s}` : "";
}
```

### spoiler toggle

`about.tsx` で ON/OFF を切り替え、`source=player` をクエリパラメータに付与して `day` ページに渡す。

## Worker / AI発言生成

Z.AI API (OpenAI互換) で人狼ゲームの発言を生成するバックグラウンドワーカー。

### アーキテクチャ

- `script/generate-village.ts` — ジョブ投入（jobs テーブルに INSERT）
- `script/worker.ts` — jobs を poll → LLM API 呼び出し → posts に保存
- Procfile.dev の `worker` プロセスとして `bin/dev` で起動

### 環境変数

| 変数 | 説明 |
|---|---|
| `Z_AI_API_KEY` | Z.AI API キー |
| `Z_AI_MODEL` | モデル名（省略時: `glm-4.7-flash`） |
| `WORKER_POLL_INTERVAL` | poll 間隔 ms（省略時: 3000） |

### jobs テーブル

| カラム | 説明 |
|---|---|
| id | ジョブID |
| type | ジョブタイプ（`generate_village`） |
| payload | JSON（village_name, character_count） |
| status | `pending` / `running` / `completed` / `failed` |
| result | JSON（village_id, posts） |
| error | エラーメッセージ |
| created_at / updated_at | タイムスタンプ |

### ワーカー運用ルール

- ワーカーは `bin/dev` 経由（Procfile）で起動する。手動で `bun run script/worker.ts` を実行してはいけない
- ジョブ投入は `mise run gen:village "村名" 人数` のみ
- ステータス確認は `sqlite3 storage/development.sqlite3 "SELECT * FROM jobs"` で行う
