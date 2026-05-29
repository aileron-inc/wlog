import { decodeEntities } from "@/lib/decode-entities";

export type PostData = {
  sequence: number;
  character: string | null;
  avatar_url: string | null;
  body: string;
  timestamp: string | null;
  post_type: string;
  source: string;
};

export function formatTime(ts: string | null): string {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleString("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function Avatar({ post }: { post: PostData }) {
  const isCanceled = post.post_type === "canceled";
  return (
    <div
      className={`flex h-24 w-16 items-end justify-center border bg-stone-100 ${isCanceled ? "border-stone-300 opacity-50" : "border-stone-200"}`}
    >
      {post.avatar_url ? (
        <img
          src={post.avatar_url}
          alt=""
          className={`h-full w-auto object-contain object-bottom ${isCanceled ? "opacity-50" : ""}`}
        />
      ) : (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-stone-200 text-base font-semibold text-stone-500">
          {post.character?.slice(0, 1)}
        </div>
      )}
    </div>
  );
}

type PostCardProps = {
  post: PostData;
  isContinuation?: boolean;
  spoiler: boolean;
  compact?: boolean;
  isFirstInGroup?: boolean;
};

export function PostCard({
  post,
  isContinuation,
  spoiler,
  compact,
  isFirstInGroup,
}: PostCardProps) {
  let body = decodeEntities(post.body);
  if (!spoiler && post.post_type === "vote") {
    body = body.replace(/^(.+は).+に投票しました.*$/, "$1投票しました");
  }

  const isSystem =
    !post.character && !["talk", "narration"].includes(post.post_type);

  if (isSystem) {
    const systemStyles: Record<string, string> = {
      vote: "border-amber-200 bg-amber-50 text-amber-800",
      fortune: "border-sky-200 bg-sky-50 text-sky-800",
      death: "border-gray-300 bg-gray-50 text-gray-600",
      join: "border-gray-200 bg-gray-50 text-gray-500",
      action: "border-stone-200 bg-stone-50 text-stone-600",
    };
    const style = systemStyles[post.post_type] || systemStyles.action;
    const badgeLabel =
      post.post_type === "vote"
        ? "投票"
        : post.post_type === "fortune"
          ? "占い"
          : null;

    return (
      <div
        className={`mx-auto max-w-2xl rounded-md border px-4 py-2 text-center ${style}`}
      >
        <div className="flex items-center justify-center gap-2">
          {badgeLabel && (
            <span className="rounded bg-white/50 px-1 py-0.5 text-[10px] font-bold uppercase tracking-wider opacity-70">
              {badgeLabel}
            </span>
          )}
          <p className="whitespace-pre-wrap text-xs leading-relaxed">{body}</p>
        </div>
        {post.timestamp && (
          <p className="mt-1 text-[10px] opacity-60">
            {formatTime(post.timestamp)}
          </p>
        )}
      </div>
    );
  }

  const isCanceled = post.post_type === "canceled";
  const cardStyles: Record<string, string> = {
    talk: "border-stone-200 bg-white",
    narration: "border-indigo-200 bg-indigo-50/50",
    whisper: "border-red-200 bg-red-50",
    monologue: "border-purple-200 bg-purple-50",
    canceled: "border-dashed border-stone-300 bg-white opacity-60",
  };
  const style = cardStyles[post.post_type] || cardStyles.talk;

  const badge =
    post.post_type === "whisper"
      ? { label: "ささやき", className: "bg-red-100 text-red-600" }
      : post.post_type === "monologue"
        ? { label: "独り言", className: "bg-purple-100 text-purple-600" }
        : post.post_type === "narration"
          ? { label: "ナレーション", className: "bg-indigo-100 text-indigo-700" }
          : null;

  const content = (
    <div className={`relative rounded-lg border px-4 py-3 shadow-sm ${style}`}>
      {((compact && isFirstInGroup) || (!compact && !isContinuation)) && (
        <span
          className={`absolute left-[-6px] top-5 h-3 w-3 rotate-45 border-b border-l ${style.split(" ")[1]} ${style.split(" ")[0]}`}
        />
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-stone-800">
            {post.character}
            {isCanceled && (
              <span className="ml-2 text-xs font-normal text-stone-400">
                （削除済み）
              </span>
            )}
          </p>
          {badge && (
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${badge.className}`}
            >
              {badge.label}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {post.timestamp && (
            <span className="text-[10px] text-stone-400">
              {formatTime(post.timestamp)}
            </span>
          )}
        </div>
      </div>
      {isCanceled ? (
        <p className="mt-1 text-xs text-stone-400 line-through">{body}</p>
      ) : (
        <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-stone-700">
          {body}
        </p>
      )}
    </div>
  );

  if (compact) {
    return content;
  }

  return (
    <article className="flex gap-3">
      <div className="w-16 shrink-0">
        {!isContinuation ? (
          <div className="sticky top-3">
            <Avatar post={post} />
          </div>
        ) : (
          <div className="mx-auto mt-2 h-full w-px bg-stone-200" />
        )}
      </div>

      <div className="min-w-0 flex-1">{content}</div>
    </article>
  );
}

