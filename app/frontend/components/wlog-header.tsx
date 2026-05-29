import type { ReactNode } from "react";

type WlogHeaderProps = {
  action?: ReactNode;
};

export function WlogHeader({ action }: WlogHeaderProps) {
  return (
    <header className="-mx-4 overflow-hidden bg-stone-900 text-white">
      <div className="relative h-32">
        <img
          src="/images/wlog-header.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/14 via-stone-950/18 to-stone-950/64" />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950/68 via-stone-950/24 to-transparent" />

        <div className="absolute inset-x-0 top-0 flex justify-end px-4 pt-4">
          {action && <div className="shrink-0">{action}</div>}
        </div>

        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
          <a href="/" className="block min-w-0">
            <span className="min-w-0">
              <span className="block text-3xl font-bold leading-none tracking-normal">
                Wlog
              </span>
              <span className="mt-1 block truncate text-xs text-stone-300">
                村の記録をひらく場所
              </span>
            </span>
          </a>
        </div>
      </div>
    </header>
  );
}
