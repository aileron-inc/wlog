import { WlogHeader } from "@/components/wlog-header";
import { dayLabel, dayUrl, aboutUrl } from "@/lib/links";
import { SpoilerToggle } from "@/components/spoiler-toggle";
import { useSpoiler } from "@/lib/use-spoiler";
import { PostCard, Avatar } from "./_post";
import type { PostData } from "./_post";
import { Pagination } from "./_pagination";
import { DayNav } from "./_day-nav";
import type { VillageDayProps } from "./_props";

type PostGroup =
  | { type: "system"; posts: [PostData] }
  | { type: "character"; posts: PostData[] };

function groupPosts(posts: PostData[]): PostGroup[] {
  const groups: PostGroup[] = [];
  let i = 0;
  while (i < posts.length) {
    const post = posts[i];
    const isSystem =
      !post.character && !["talk", "narration"].includes(post.post_type);
    if (isSystem) {
      groups.push({ type: "system", posts: [post] });
      i++;
    } else {
      const charPosts: PostData[] = [post];
      while (i + 1 < posts.length) {
        const nextPost = posts[i + 1];
        const nextIsSystem =
          !nextPost.character &&
          !["talk", "narration"].includes(nextPost.post_type);
        if (
          !nextIsSystem &&
          nextPost.character === post.character &&
          nextPost.character !== null
        ) {
          charPosts.push(nextPost);
          i++;
        } else {
          break;
        }
      }
      groups.push({ type: "character", posts: charPosts });
      i++;
    }
  }
  return groups;
}

export default function Page({
  village_id,
  day,
  source,
  spoiler: serverSpoiler,
  page,
  total_count,
  total_pages,
  available_days = [],
  posts,
}: VillageDayProps) {
  const { spoiler } = useSpoiler();

  const base: Record<string, string> = {
    village_id,
    day,
    ...(spoiler ? { spoiler: "true" } : {}),
  };

  return (
    <div className="village-page-bg">
      <div className="village-phone-shell px-4 pb-8">
        <WlogHeader action={<SpoilerToggle />} />

        <a
          href={aboutUrl({
            village_id,
            ...(spoiler ? { spoiler: "true" } : {}),
          })}
          className="mt-5 inline-block text-sm text-stone-500 hover:underline"
        >
          &larr; 村情報
        </a>

        <div className="mt-2 flex items-start justify-between gap-3">
          <h1 className="text-xl font-bold text-stone-800">{dayLabel(day)}</h1>
          <div className="flex shrink-0 flex-col items-end gap-1">
            {total_pages > 1 && (
              <span className="text-right text-xs text-stone-400">
                {total_count}件 / {page}/{total_pages}ページ
              </span>
            )}
          </div>
        </div>

        <DayNav base={base} day={day} available_days={available_days} />

        <div className="mt-6 space-y-4">
          {groupPosts(posts).map((group, groupIndex) =>
            group.type === "system" ? (
              <PostCard
                key={`${group.posts[0].source}-${group.posts[0].sequence}`}
                post={group.posts[0]}
                spoiler={spoiler}
              />
            ) : (
              <div key={groupIndex} className="flex gap-3">
                <div className="w-16 shrink-0">
                  <div className="sticky top-3">
                    <Avatar post={group.posts[0]} />
                  </div>
                </div>
                <div className="min-w-0 flex-1 space-y-4">
                  {group.posts.map((post, i) => (
                    <PostCard
                      key={`${post.source}-${post.sequence}`}
                      post={post}
                      compact
                      spoiler={spoiler}
                      isFirstInGroup={i === 0}
                    />
                  ))}
                </div>
              </div>
            ),
          )}
        </div>

        <Pagination base={base} page={page} total_pages={total_pages} />
      </div>
    </div>
  );
}

