import { WlogHeader } from "@/components/wlog-header";
import { dayLabel, dayUrl } from "@/lib/links";
import { SpoilerToggle } from "@/components/spoiler-toggle";
import { useSpoiler } from "@/lib/use-spoiler";
import { useState } from "react";
import type { VillageAboutProps } from "./_props";

type Tab = "players" | "logs" | "source";

const CRAWL_BASE = "https://asbntby.sakura.ne.jp/junalog/b1";

const TABS: { key: Tab; label: string }[] = [
  { key: "players", label: "参加者" },
  { key: "logs", label: "ログ" },
  { key: "source", label: "ソース" },
];

export default function Page({
  village,
  available_days = [],
  post_counts,
  players = [],
}: VillageAboutProps) {
  const { spoiler } = useSpoiler();
  const [activeTab, setActiveTab] = useTabState();
  const fallbackPlayers: string[] = JSON.parse(village.characters || "[]").filter(
    (n: string) => !n.includes("以下の通り")
  );
  const cast = players.length
    ? players
    : fallbackPlayers.map((name) => ({
        name,
        avatar_url: null,
        post_count: 0,
        role: null,
        is_alive: null,
        team: null,
      }));

  const base = { village_id: village.id };

  return (
    <div className="village-page-bg">
      <div className="village-phone-shell px-4 pb-8">
        <WlogHeader action={<SpoilerToggle />} />

        <a
          href="/"
          className="mt-5 inline-block text-sm text-stone-500 hover:underline"
        >
          &larr; 村一覧
        </a>

        <h1 className="mt-2 text-2xl font-bold leading-tight text-stone-800">
          ({village.village_number}) {village.name}
        </h1>

        <div className="mt-4 text-sm text-stone-500">
          村人発言: {post_counts.villager}件
          {spoiler && (
            <span className="text-amber-600">
              {" "}
              / 裏発言: {post_counts.player}件
            </span>
          )}
          {" "}
          <span className="text-stone-300">{village.id}</span>
        </div>

        {village.status === "ended" && village.winner && (
          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">
            <span className={`inline-block h-2 w-2 rounded-full ${village.winner === "villager" ? "bg-sky-400" : "bg-red-400"}`} />
            {village.winner === "villager" ? "村人勝利" : "人狼勝利"}
          </div>
        )}

        <nav className="mt-6 flex gap-1 rounded-lg bg-stone-100 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-white text-stone-800 shadow-sm"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === "players" && (
          <div className="mt-6 grid grid-cols-2 gap-3">
            {cast.map((player) => (
              <div
                key={player.name}
                className={`rounded-lg border bg-white ${player.is_alive === 0 ? "opacity-60 border-stone-200" : "border-stone-200"}`}
              >
                <div className="flex h-36 items-end justify-center bg-stone-100 px-2 pt-3">
                  {player.avatar_url ? (
                    <img
                      src={player.avatar_url}
                      alt=""
                      className="h-full w-auto object-contain object-bottom drop-shadow-sm"
                    />
                  ) : (
                    <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-stone-200 text-lg font-semibold text-stone-500">
                      {player.name.slice(0, 1)}
                    </div>
                  )}
                </div>
                <div className="px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-semibold text-stone-800">
                      {player.name}
                    </p>
                    {spoiler && player.role && (
                      <span className={`shrink-0 rounded px-1 py-0 text-[10px] font-medium ${player.team === "werewolf" ? "bg-red-100 text-red-700" : "bg-sky-100 text-sky-700"}`}>
                        {player.role}
                      </span>
                    )}
                    {spoiler && player.is_alive === 0 && (
                      <span className="shrink-0 rounded bg-gray-100 px-1 py-0 text-[10px] font-medium text-gray-500">
                        死亡
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] text-stone-400">
                    {player.post_count}発言
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "logs" && (
          <ul className="mt-6 divide-y divide-stone-100 rounded-lg border border-stone-200 bg-white">
            {available_days.map((day, i) => (
              <li key={day}>
                <a
                  href={dayUrl({
                    ...base,
                    day,
                    ...(spoiler ? { source: "player" } : {}),
                  })}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition-colors"
                >
                  <span className="shrink-0 w-6 text-right text-xs font-medium text-stone-400">
                    {i + 1}.
                  </span>
                  <span className="text-sm font-medium text-stone-800">
                    {dayLabel(day)}
                  </span>
                  <span className="ml-auto shrink-0 text-sm text-stone-400">&rarr;</span>
                </a>
              </li>
            ))}
          </ul>
        )}

        {activeTab === "source" && (
          <div className="mt-6 space-y-4">
            <dl className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm">
              <dt className="text-stone-500 text-xs uppercase tracking-wide">クロール元</dt>
              <dd className="mt-1">
                <a
                  href={`${CRAWL_BASE}/${Math.floor(village.village_number)}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all"
                >
                  {CRAWL_BASE}/{Math.floor(village.village_number)}/
                </a>
              </dd>
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}

function useTabState(defaultTab: Tab = "players"): [Tab, (tab: Tab) => void] {
  const [tab, setTab] = useState<Tab>(defaultTab);
  return [tab, setTab];
}
