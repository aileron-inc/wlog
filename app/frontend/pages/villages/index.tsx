import { WlogHeader } from "@/components/wlog-header";
import { qs } from "@/lib/links";
import type { VillageIndexProps } from "./_props";

export default function Page({
  villages,
  tags,
  total_count,
  page,
  per_page,
}: VillageIndexProps) {
  const params = new URLSearchParams(window.location.search);
  const currentTag = params.get("tag") || "";

  const total_pages = Math.ceil(total_count / per_page);
  const base: Record<string, string> = {};
  if (currentTag) base.tag = currentTag;

  const getPages = () => {
    if (total_pages <= 7) {
      return Array.from({ length: total_pages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];
    pages.push(1);

    const start = Math.max(2, page - 2);
    const end = Math.min(total_pages - 1, page + 2);

    if (start > 2) {
      pages.push("...");
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < total_pages - 1) {
      pages.push("...");
    }

    pages.push(total_pages);
    return pages;
  };

  const pages = getPages();

  return (
    <div className="village-page-bg">
      <div className="village-phone-shell px-4 pb-8">
        <WlogHeader />

        <section className="mt-6">
          <p className="text-xs font-medium text-amber-700">VILLAGE RECORDS</p>
          <h1 className="mt-2 text-2xl font-bold leading-tight text-stone-800">
            村の記録を、物語として読む。
          </h1>
          <p className="mt-3 text-sm leading-6 text-stone-500">
            発言、日付、参加者をたどりながら、ひとつの村で起きた時間を開きます。
          </p>
        </section>

        <div className="mt-8">
          <div className="flex flex-wrap gap-2">
            <a
              href="/villages"
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                currentTag === ""
                  ? "bg-amber-600 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              すべて
            </a>
            {tags.map((tag) => (
              <a
                key={tag.id}
                href={`/villages${qs({ tag: tag.id })}`}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  currentTag === tag.id
                    ? "bg-amber-600 text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                #{tag.name}
              </a>
            ))}
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-stone-700">村一覧</h2>
          <span className="rounded-full bg-stone-200 px-2.5 py-1 text-[11px] font-medium text-stone-600">
            {total_count}件
          </span>
        </div>

        <ul className="mt-3 divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
          {villages.map((v) => (
            <li key={v.id}>
              <a
                href={`/villages/about?village_id=${v.id}`}
                className="flex items-center justify-between gap-3 px-4 py-4 hover:bg-stone-50 transition-colors"
              >
                <span>
                  <span className="block text-[11px] font-medium text-stone-400">
                    No. {v.village_number}
                  </span>
                  <span className="mt-0.5 block text-base font-semibold text-stone-800">
                    {v.name}
                  </span>
                  <span className="mt-1 flex flex-wrap gap-1.5">
                    {v.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="text-[10px] font-medium text-amber-600"
                      >
                        #{tag.name}
                      </span>
                    ))}
                  </span>
                </span>
                <span className="shrink-0 text-sm text-stone-400">&rarr;</span>
              </a>
            </li>
          ))}
        </ul>

        {total_pages > 1 && (
          <nav className="mt-8 flex items-center justify-between">
            {page > 1 ? (
              <a
                href={`/villages${qs({ ...base, page: String(page - 1) })}`}
                className="rounded-md border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-50 transition-colors"
              >
                前のページ
              </a>
            ) : (
              <span />
            )}

            <div className="flex gap-1">
              {pages.map((p, i) =>
                typeof p === "number" ? (
                  <a
                    key={i}
                    href={`/villages${qs({ ...base, page: String(p) })}`}
                    className={`min-w-[28px] rounded-md px-2 py-1 text-xs text-center transition-colors ${
                      p === page
                        ? "bg-stone-800 text-white font-medium"
                        : "text-stone-500 hover:bg-stone-100"
                    }`}
                  >
                    {p}
                  </a>
                ) : (
                  <span
                    key={i}
                    className="min-w-[28px] px-2 py-1 text-xs text-center text-stone-400"
                  >
                    {p}
                  </span>
                )
              )}
            </div>

            {page < total_pages ? (
              <a
                href={`/villages${qs({ ...base, page: String(page + 1) })}`}
                className="rounded-md border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-50 transition-colors"
              >
                次のページ
              </a>
            ) : (
              <span />
            )}
          </nav>
        )}
      </div>
    </div>
  );
}
