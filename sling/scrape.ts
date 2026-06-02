import * as cheerio from "cheerio";
import { writeFileSync, mkdirSync } from "fs";

const BASE = "https://asbntby.sakura.ne.jp/junalog/b1";
const IMG_BASE = "https://asbntby.sakura.ne.jp/junalog/b1/img";

const DAY_PAGES = [
  { num: "0", label: "prologue" },
  { num: "1", label: "1" },
  { num: "2", label: "2" },
  { num: "3", label: "3" },
  { num: "4", label: "4" },
  { num: "5", label: "epilogue" },
];

interface Avatar {
  name: string;
  avatar_url: string;
  set_id: string;
}

interface Village {
  id: string;
  village_number: number;
  name: string;
  characters: string;
  character_set_id: string;
  created_at: string;
}

interface Post {
  village_id: string;
  character: string | null;
  day: string;
  sequence: number;
  body: string;
  timestamp: string | null;
  post_type: string;
  source: string;
  created_at: string;
}

async function fetchPage(url: string): Promise<cheerio.CheerioAPI> {
  const resp = await fetch(url);
  const buffer = await resp.arrayBuffer();
  const text = new TextDecoder("euc-jp").decode(buffer);
  return cheerio.load(text);
}

function parseTime(raw: string): string | null {
  const m = raw.match(/(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}+09:00`;
}

// @ts-ignore cheerio types
function extractAvatarUrl($img: cheerio.Cheerio<any>): string | null {
  const src = $img.attr("src");
  if (!src) return null;
  const m = src.match(/(?:\.\.\/)+img\/(.+)$/);
  if (!m) return null;
  return `${IMG_BASE}/${m[1]}`;
}

function sourceFor(postType: string): string {
  if (postType === "whisper" || postType === "monologue" || postType === "canceled") return "player";
  return "villager";
}

function parsePosts($: cheerio.CheerioAPI, dayLabel: string, villageId: string, now: string, startSeq: number): Post[] {
  const posts: Post[] = [];
  let seq = startSeq;

  function addSystem(bodyText: string, timestamp: string | null) {
    if (!bodyText) return;
    let postType = "action";
    if (/を占った/u.test(bodyText)) postType = "fortune";
    else if (/投票を委任/.test(bodyText)) postType = "vote";
    else if (/に投票しました/.test(bodyText)) postType = "vote";
    else if (/に襲いかかった/u.test(bodyText)) postType = "attack";
    else if (/発見された/.test(bodyText)) postType = "death";
    else if (/参加しました/.test(bodyText)) postType = "join";

    posts.push({
      village_id: villageId, character: null, day: dayLabel, sequence: seq++,
      body: bodyText, timestamp, post_type: postType, source: sourceFor(postType), created_at: now,
    });
  }

  function addMessage(character: string, body: string, timestamp: string | null, postType: string) {
    posts.push({
      village_id: villageId, character, day: dayLabel, sequence: seq++,
      body, timestamp, post_type: postType, source: sourceFor(postType), created_at: now,
    });
  }

  const selectors = [
    "div.form_normal",
    "div[id^='mes']", "div[id^='whis']", "div[id^='mono']",
    "div.mes_brown", "div.mes_gray", "div.mes_blood",
  ];
  const $all = $(selectors.join(", "));
  $all.each((_i, el) => {
    const $el = $(el);
    // Skip parent wrappers — their descendants will handle the content
    if ($el.find(selectors.join(", ")).length > 0) return;
    const attribs = (el as { attribs?: Record<string, string> }).attribs || {};
    const id = attribs.id || "";
    const cls = attribs.class || "";

    if (cls.includes("form_normal")) {
      const $pin = $el.find(".mes_base_with_pin").first();
      if ($pin.length) {
        const bodyText = ($pin.html() || "").replace(/<[^>]+>/g, "").trim();
        if (bodyText) addSystem(bodyText, null);
      }
      return;
    }

    if (/^mes\d+$/.test(id) || /^whis\d+$/.test(id) || /^mono\d+$/.test(id)) {
      const $name = $el.find(".say_name").first();
      const $block = $el.find(".say_block").first();
      const $time = $el.find(".say_time").first();
      const $thin = $el.find(".mes_thin").first();

      if ($thin.length && !$name.length) {
        addSystem(
          $thin.contents().first().text().trim(),
          parseTime($thin.find(".say_time").text()),
        );
        return;
      }

      if ($name.length && $block.length) {
        let postType = "talk";
        if (/^whis\d+$/.test(id)) postType = "whisper";
        else if (/^mono\d+$/.test(id)) postType = "monologue";
        else if ($el.find(".mes_canceled").length > 0) postType = "canceled";

        const character = $name.text().trim();
        let body = $block.html() || $block.text();
        body = body.replace(/<br\s*\/?>/g, "\n").replace(/<[^>]+>/g, "").trim();
        addMessage(character, body, parseTime($time.text()), postType);
      }
      return;
    }

    if (cls.includes("mes_brown") && !id) {
      const $thin = $el.find(".mes_thin").first();
      if ($thin.length) {
        addSystem($thin.contents().first().text().trim(), parseTime($thin.find(".say_time").text()));
        return;
      }
      const $name = $el.find(".say_name").first();
      const $block = $el.find(".say_block").first();
      const $time = $el.find(".say_time").first();
      if ($name.length && $block.length) {
        const character = $name.text().trim();
        let body = $block.html() || $block.text();
        body = body.replace(/<br\s*\/?>/g, "\n").replace(/<[^>]+>/g, "").trim();
        addMessage(character, body, $time.length ? parseTime($time.text()) : null, "narration");
      }
      return;
    }

    if (cls.includes("mes_gray") && !id) {
      const $thin = $el.find(".mes_thin").first();
      if (!$thin.length) return;
      addSystem($thin.contents().first().text().trim(), parseTime($thin.find(".say_time").text()));
      return;
    }

    if (cls.includes("mes_blood") && !id) {
      const $name = $el.find(".say_name").first();
      const $block = $el.find(".say_block").first();
      if ($name.length && $block.length) {
        const character = $name.text().trim();
        let body = $block.html() || $block.text();
        body = body.replace(/<br\s*\/?>/g, "\n").replace(/<[^>]+>/g, "").trim();
        const $time = $el.find(".say_time").first();
        const prev = $el.prev();
        const isWhisper = prev.is("a") && /^w\d+$/.test(prev.attr("name") || "");
        addMessage(character, body, $time.length ? parseTime($time.text()) : null, isWhisper ? "whisper" : "narration");
        return;
      }
      const $base = $el.find(".mes_base").first();
      addSystem($base.text().trim(), null);
    }
  });

  return posts;
}

function villageId(num: number): string {
  return Bun.hash(`${BASE}/${num}/`).toString(36).slice(0, 8);
}

async function scrapeVillage(num: number) {
  const vid = villageId(num);
  const now = new Date().toISOString();

  console.log(`Scraping village ${num} (${vid})...`);

  const $index = await fetchPage(`${BASE}/${num}/index.html`);
  const titleText = $index("title").text();
  const nameMatch = titleText.match(/\((\d+)\)(.+)/);
  const villageName = nameMatch ? nameMatch[2].trim() : `Village ${num}`;

  const playerLines: string[] = [];
  const pinHtml = $index(".mes_base_with_pin").first().html();
  if (pinHtml) {
    const lines = pinHtml.split(/<br\s*\/?>/);
    for (const line of lines) {
      const cleaned = line.replace(/<[^>]+>/g, "").trim();
      if (cleaned && !cleaned.startsWith("(") && cleaned !== villageName) {
        playerLines.push(cleaned);
      }
    }
  }

  const characterMap = new Map<string, string>();
  const allPosts: Post[] = [];

  for (const { num: dayNum, label: dayLabel } of DAY_PAGES) {
    let pageNum = 1;
    let dayPostCount = 0;
    let seq = 0;

    while (true) {
      const pageUrl = `${BASE}/${num}/player/${dayNum}_${pageNum}.html`;
      let $: cheerio.CheerioAPI;
      try {
        $ = await fetchPage(pageUrl);
      } catch {
        break;
      }

      const hasMessages = $("div[id^='mes']").length > 0
        || $("div[id^='whis']").length > 0
        || $("div[id^='mono']").length > 0
        || $("a[name^='w']").length > 0
        || $("div.form_normal").length > 0;
      if (!hasMessages) break;

      const allDivs = $("div[id^='mes'], div[id^='whis'], div[id^='mono'], div.mes_brown, div.mes_gray, div.mes_blood");
      allDivs.each((_i, el) => {
        const $el = $(el);
        const $img = $el.find(".say_face_icon").first();
        const $name = $el.find(".say_name").first();
        if ($img.length && $name.length) {
          const name = $name.text().trim();
          const avatar = extractAvatarUrl($img);
          if (avatar && !characterMap.has(name)) {
            characterMap.set(name, avatar);
          }
        }
      });

      const posts = parsePosts($, dayLabel, vid, now, seq);
      if (posts.length === 0) break;
      dayPostCount += posts.length;
      seq += posts.length;
      allPosts.push(...posts);
      pageNum++;
    }

    console.log(`  ${dayLabel}: ${dayPostCount} posts`);
  }

  const setId = determineSetId([...characterMap.values()]);
  const avatars: Avatar[] = [...characterMap.entries()].map(([name, avatar]) => ({
    name, avatar_url: avatar, set_id: setId,
  }));

  const village: Village = {
    id: vid,
    village_number: num,
    name: villageName,
    characters: JSON.stringify(playerLines),
    character_set_id: setId,
    created_at: now,
  };

  return { village, posts: allPosts, avatars };
}

function determineSetId(avatarUrls: string[]): string {
  return avatarUrls.some((url) => /\/char\d+\.png$/.test(url)) ? "char" : "num";
}

async function readNdJson<T>(path: string): Promise<T[]> {
  try {
    const text = await Bun.file(path).text();
    return text.split("\n").filter(Boolean).map((line) => JSON.parse(line));
  } catch {
    return [];
  }
}

async function main() {
  const outDir = "sling/seeds/wlog";
  mkdirSync(outDir, { recursive: true });

  const existingVillages = await readNdJson<Village>(`${outDir}/villages.json`);
  const existingPosts = await readNdJson<Post>(`${outDir}/posts.json`);
  const existingAvatars = await readNdJson<Avatar>(`${outDir}/avatars.json`);
  const existingSets = await readNdJson<{ id: string }>(`${outDir}/character_sets.json`);

  const scrapedVillageNums = new Set(existingVillages.map((v) => v.village_number));
  const avatarKeys = new Set(existingAvatars.map((a) => `${a.set_id}:${a.name}`));
  const existingSetIds = new Set(existingSets.map((s) => s.id));

  let nums = process.argv.slice(2).map(Number).filter((n) => !isNaN(n));

  if (nums.length === 0) {
    const $index = await fetchPage(BASE);
    const html = $index.html();
    const matches = html.matchAll(/\((\d+)\)\s+/g);
    const foundNums = [...new Set([...matches].map((m) => parseInt(m[1])))].sort((a, b) => b - a);

    const toScrape = foundNums.filter((n) => !scrapedVillageNums.has(n));
    console.log(`Found ${foundNums.length} villages on index, ${scrapedVillageNums.size} already scraped, scraping ${toScrape.length} new villages`);
    nums = toScrape;
  }

  let allVillages = [...existingVillages];
  let allPosts = [...existingPosts];
  const allAvatars = [...existingAvatars];
  const allSets = [...existingSets];

  for (let i = 0; i < nums.length; i++) {
    const num = nums[i];
    if (i > 0) await Bun.sleep(1500);

    const result = await scrapeVillage(num);
    const vid = result.village.id;

    // Merge: replace existing if any, otherwise append
    allVillages = [...allVillages.filter((v) => v.id !== vid), result.village];
    allPosts = [...allPosts.filter((p) => p.village_id !== vid), ...result.posts];

    for (const a of result.avatars) {
      const key = `${a.set_id}:${a.name}`;
      if (!avatarKeys.has(key)) {
        avatarKeys.add(key);
        allAvatars.push(a);
      }
      if (!existingSetIds.has(a.set_id)) {
        existingSetIds.add(a.set_id);
        allSets.push({ id: a.set_id });
      }
    }

    console.log(`[${i + 1}/${nums.length}] village ${num} (${result.village.id}) - ${result.posts.length} posts`);

    // Save to files immediately so we don't lose progress if interrupted (Resume support)
    writeFileSync(`${outDir}/character_sets.json`, allSets.map((s) => JSON.stringify(s)).join("\n") + "\n");
    writeFileSync(`${outDir}/villages.json`, allVillages.map((v) => JSON.stringify(v)).join("\n") + "\n");
    writeFileSync(`${outDir}/posts.json`, allPosts.map((p) => JSON.stringify(p)).join("\n") + "\n");
    writeFileSync(`${outDir}/avatars.json`, allAvatars.map((a) => JSON.stringify(a)).join("\n") + "\n");
  }

  if (nums.length > 0) {
    console.log(`\nTotal: ${allVillages.length} villages, ${allPosts.length} posts, ${allSets.length} sets, ${allAvatars.length} avatars`);
  }
}

main().catch(console.error);
