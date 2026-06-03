import { useSpoiler } from "@/lib/use-spoiler";
import { qs } from "@/lib/links";
import { router } from "@inertiajs/react";

export function SpoilerToggle() {
  const { spoiler, setSpoiler } = useSpoiler();

  return (
    <label className="inline-flex cursor-pointer items-center gap-2">
      <span className="text-xs font-medium text-stone-400">ネタバレ</span>
      <button
        role="switch"
        aria-checked={spoiler}
        onClick={() => {
          const next = !spoiler;
          setSpoiler(next);
          const params = new URLSearchParams(window.location.search);
          if (next) {
            params.set("spoiler", "true");
          } else {
            params.delete("spoiler");
          }
          const url = window.location.pathname + (params.toString() ? `?${params.toString()}` : "");
          router.visit(url, { preserveState: true, preserveScroll: true });
        }}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${
          spoiler ? "bg-amber-500" : "bg-stone-300"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ${
            spoiler ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </label>
  );
}
