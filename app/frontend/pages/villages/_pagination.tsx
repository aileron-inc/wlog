import { dayUrl } from "@/lib/links";
import { Link } from "@inertiajs/react";

type PaginationProps = {
  base: Record<string, string>;
  page: number;
  total_pages: number;
};

export function Pagination({ base, page, total_pages }: PaginationProps) {
  if (total_pages <= 1) return null;

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
    <nav className="mt-8 flex items-center justify-between">
      {page > 1 ? (
        <Link
          href={dayUrl({ ...base, page: String(page - 1) })}
          className="rounded-md border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-50 transition-colors"
        >
          前のページ
        </Link>
      ) : (
        <span />
      )}

      <div className="flex gap-1">
        {pages.map((p, i) =>
          typeof p === "number" ? (
            <Link
              key={i}
              href={dayUrl({ ...base, page: String(p) })}
              className={`min-w-[28px] rounded-md px-2 py-1 text-xs text-center transition-colors ${
                p === page
                  ? "bg-stone-800 text-white font-medium"
                  : "text-stone-500 hover:bg-stone-100"
              }`}
            >
              {p}
            </Link>
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
        <Link
          href={dayUrl({ ...base, page: String(page + 1) })}
          className="rounded-md border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-50 transition-colors"
        >
          次のページ
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
