import { db } from "../lib/db";
import * as crypto from "node:crypto";
import { mkdirSync, appendFileSync, existsSync, readFileSync } from "node:fs";
import { client, MODEL } from "../lib/llm";
import { CHARACTER_POOL, shuffle } from "../lib/characters";
import { assignRoles, type AssignedRole } from "../lib/roles";
import { buildProloguePrompt, buildDayPrompt, type GeneratedPost } from "../lib/prompts";
import { logJob } from "../lib/logger";

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 5000;
const LOG_DIR = "log/villages";

type NDJSONMeta = {
  type: "meta";
  village_id: string;
  name: string;
  characters: AssignedRole[];
  character_count: number;
};

type NDJSONPost = {
  type: "post";
  day: string;
  sequence: number;
  character: string | null;
  post_type: string;
  source: string;
  body: string;
  timestamp: string | null;
};

type NDJSONEntry = NDJSONMeta | NDJSONPost;

function isMeta(entry: NDJSONEntry): entry is NDJSONMeta {
  return entry.type === "meta";
}

function ensureDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function appendEntry(path: string, entry: NDJSONEntry) {
  ensureDir(LOG_DIR);
  appendFileSync(path, JSON.stringify(entry) + "\n");
}

function readEntries(path: string): NDJSONEntry[] {
  if (!existsSync(path)) return [];
  const raw = readFileSync(path, "utf-8");
  return raw.trim().split("\n").filter(Boolean).map(line => JSON.parse(line));
}

function ndjsonPath(jobId: string) {
  return `${LOG_DIR}/${jobId}.ndjson`;
}

async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (e) {
      const isRetryable = e instanceof Error && (e.message.includes("429") || e.message.includes("timeout") || e.message.includes("ECONNRESET"));
      if (!isRetryable || attempt === MAX_RETRIES) throw e;
      const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
      logJob(label, `Retry ${attempt}/${MAX_RETRIES} after ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error("unreachable");
}

async function callLLM(jobId: string, prompt: { system: string; user: string }): Promise<GeneratedPost[]> {
  const response = await withRetry(async () => {
    return await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user },
      ],
    });
  }, jobId);

  const raw = response.choices[0].message.content?.trim() ?? "{}";
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as GeneratedPost[];
    if (parsed.posts && Array.isArray(parsed.posts)) return parsed.posts as GeneratedPost[];
    for (const key in parsed) {
      if (Array.isArray(parsed[key])) return parsed[key] as GeneratedPost[];
    }
    return [];
  } catch (e) {
    const jsonMatch = raw.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]) as GeneratedPost[];
    throw e;
  }
}

function buildPreviousContext(entries: NDJSONEntry[]): { alive: AssignedRole[]; dayNum: number; summary: string } {
  const posts = entries.filter((e): e is NDJSONPost => e.type === "post");
  const assigned = entries.find(isMeta)?.characters ?? [];
  const meta = entries.find(isMeta);

  const alive = [...assigned];
  let dayNum = 0;
  const dead: string[] = [];

  for (const p of posts) {
    if (p.day !== "prologue" && p.day !== "epilogue") {
      const d = parseInt(p.day, 10);
      if (d > dayNum) dayNum = d;
    }
    if (p.post_type === "death") {
      const match = p.body.match(/(\S+)が無惨な姿で発見された/);
      if (match) dead.push(match[1]);
    }
    if (p.post_type === "action" && p.character === null) {
      const match = p.body.match(/(\S+)は(人狼|人間)だったようだ/);
      if (match) dead.push(match[1]);
    }
  }

  for (const name of dead) {
    const idx = alive.findIndex(c => c.name === name);
    if (idx >= 0) alive.splice(idx, 1);
  }

  dayNum += 1;

  const summaries: string[] = [];
  for (const p of posts) {
    if (p.post_type === "talk" && p.body.includes("占い師")) summaries.push(`${p.character}: ${p.body}`);
    else if (p.post_type === "talk" && p.body.includes("▼")) summaries.push(`${p.character}の吊り希望: ${p.body}`);
    else if (p.post_type === "fortune") summaries.push(`占い結果: ${p.body}`);
    else if (p.post_type === "death") summaries.push(`死亡確認: ${p.body}`);
    else if (p.post_type === "action" && p.character === null && (p.body.includes("処刑") || p.body.includes("人狼だった") || p.body.includes("人間だった"))) {
      summaries.push(`システム: ${p.body}`);
    }
  }

  return {
    alive,
    dayNum,
    summary: summaries.slice(-15).join("\n"),
  };
}

export async function processGenerateVillage(jobId: string, payload: { village_name: string; character_count: number }) {
  const path = ndjsonPath(jobId);
  const now = new Date().toISOString();
  const existing = readEntries(path);
  const isResume = existing.length > 0;

  let villageId: string;
  let assigned: AssignedRole[];
  let allPosts: NDJSONPost[] = [];
  let startDayNum: number;

  if (isResume) {
    const meta = existing.find(isMeta)!;
    villageId = meta.village_id;
    assigned = meta.characters;
    allPosts = existing.filter((e): e is NDJSONPost => e.type === "post");
    const ctx = buildPreviousContext(existing);
    startDayNum = ctx.dayNum;
    logJob(jobId, `Resuming village: ${villageId} from day ${startDayNum}`);
  } else {
    villageId = crypto.randomUUID().slice(0, 10);
    const selectedChars = shuffle(CHARACTER_POOL, payload.character_count);
    assigned = assignRoles(selectedChars);
    startDayNum = 0;

    const meta: NDJSONMeta = {
      type: "meta",
      village_id: villageId,
      name: payload.village_name,
      characters: assigned,
      character_count: payload.character_count,
    };
    appendEntry(path, meta);
    logJob(jobId, `Creating village: ${payload.village_name} (${villageId})`);
    logJob(jobId, `Characters: ${assigned.map(c => `${c.name}(${c.role})`).join(", ")}`);
  }

  const wolfCharacters = assigned.filter(c => c.team === "werewolf");

  let sequence = allPosts.length > 0
    ? Math.max(...allPosts.map(p => p.sequence)) + 1
    : 0;

  function writePosts(posts: GeneratedPost[], day: string) {
    for (const p of posts) {
      const minutesOffset = Math.floor(Math.random() * 60) + 1;
      const timestamp = (p.post_type === "talk" || p.post_type === "whisper" || p.post_type === "monologue")
        ? new Date(Date.now() + minutesOffset * 60000).toISOString()
        : null;

      const entry: NDJSONPost = {
        type: "post",
        day,
        sequence: sequence++,
        character: p.character,
        post_type: p.post_type,
        source: p.source,
        body: p.body,
        timestamp,
      };
      allPosts.push(entry);
      appendEntry(path, entry);
    }
  }

  // Prologue
  if (startDayNum === 0) {
    logJob(jobId, "Generating Prologue...");
    const prologuePrompt = buildProloguePrompt({
      villageName: payload.village_name,
      characters: assigned,
      wolfCharacters,
      fortuneTeller: assigned.find(c => c.role === "占い師"),
      knight: assigned.find(c => c.role === "騎士"),
      medium: assigned.find(c => c.role === "霊能者"),
    });
    const prologuePosts = await callLLM(jobId, prologuePrompt);
    writePosts(prologuePosts, "prologue");
  }

  // Day loop
  let alive = [...assigned];
  let previousSummary = "";
  let lastDayExecutedCharacter: string | null = null;
  let lastDayExecutedRole: string | null = null;
  let lastDayAttackedCharacter: string | null = null;
  let lastDayFortuneResult: { teller: string; target: string; result: string } | null = null;
  let dayNum = Math.max(startDayNum, 1);

  if (isResume && dayNum > 1) {
    const ctx = buildPreviousContext(existing);
    alive = ctx.alive;
    previousSummary = ctx.summary;

    const posts = existing.filter((e): e is NDJSONPost => e.type === "post" && e.day === String(dayNum - 1));
    for (const p of posts) {
      if (p.post_type === "death") {
        const match = p.body.match(/(\S+)が無惨な姿で発見された/);
        if (match) lastDayAttackedCharacter = match[1];
      } else if (p.post_type === "fortune") {
        const match = p.body.match(/(\S+)は、(\S+)を占った/);
        if (match) {
          const targetChar = assigned.find(c => c.name === match[2]);
          if (targetChar) lastDayFortuneResult = { teller: match[1], target: match[2], result: targetChar.team === "werewolf" ? "人狼" : "人間" };
        }
      } else if (p.post_type === "action" && p.character === null) {
        const match = p.body.match(/(\S+)は(人狼|人間)だったようだ/);
        if (match) { lastDayExecutedCharacter = match[1]; lastDayExecutedRole = match[2]; }
      }
    }
  }

  let winner: string | null = null;

  while (!winner && dayNum <= 10) {
    if (dayNum <= startDayNum) {
      dayNum++;
      continue;
    }

    logJob(jobId, `Generating Day ${dayNum}...`);
    const dayInput = {
      day: dayNum,
      villageName: payload.village_name,
      characters: assigned,
      aliveCharacters: alive,
      wolfCharacters: alive.filter(c => c.team === "werewolf"),
      fortuneTeller: alive.find(c => c.role === "占い師"),
      knight: alive.find(c => c.role === "騎士"),
      medium: alive.find(c => c.role === "霊能者"),
      previousSummary,
      lastDayExecutedCharacter,
      lastDayExecutedRole,
      lastDayAttackedCharacter,
      lastDayFortuneResult,
    };

    const dayPrompt = buildDayPrompt(dayInput);
    const dayPosts = await callLLM(jobId, dayPrompt);
    writePosts(dayPosts, String(dayNum));

    lastDayAttackedCharacter = null;
    lastDayExecutedCharacter = null;
    lastDayExecutedRole = null;
    lastDayFortuneResult = null;

    const voteCounts: Record<string, number> = {};
    for (const p of dayPosts) {
      if (p.post_type === "death") {
        const match = p.body.match(/(\S+)が無惨な姿で発見された/);
        if (match) lastDayAttackedCharacter = match[1];
      } else if (p.post_type === "vote") {
        const match = p.body.match(/は(\S+)に投票しました/);
        if (match) voteCounts[match[1]] = (voteCounts[match[1]] || 0) + 1;
      } else if (p.post_type === "fortune") {
        const match = p.body.match(/(\S+)は、(\S+)を占った/);
        if (match) {
          const targetChar = assigned.find(c => c.name === match[2]);
          if (targetChar) lastDayFortuneResult = { teller: match[1], target: match[2], result: targetChar.team === "werewolf" ? "人狼" : "人間" };
        }
      } else if (p.post_type === "action" && p.character === null) {
        const match = p.body.match(/(\S+)は(人狼|人間)だったようだ/);
        if (match) { lastDayExecutedCharacter = match[1]; lastDayExecutedRole = match[2]; }
      }
    }

    if (!lastDayExecutedCharacter && Object.keys(voteCounts).length > 0) {
      lastDayExecutedCharacter = Object.entries(voteCounts).sort((a, b) => b[1] - a[1])[0][0];
      const char = assigned.find(c => c.name === lastDayExecutedCharacter);
      lastDayExecutedRole = char?.team === "werewolf" ? "人狼" : "人間";
    }

    if (lastDayAttackedCharacter) alive = alive.filter(c => c.name !== lastDayAttackedCharacter);
    if (lastDayExecutedCharacter) alive = alive.filter(c => c.name !== lastDayExecutedCharacter);

    const wolfCount = alive.filter(c => c.team === "werewolf").length;
    const villagerCount = alive.filter(c => c.team === "villager").length;

    if (wolfCount === 0) winner = "villager";
    else if (wolfCount >= villagerCount) winner = "werewolf";

    const ctx = buildPreviousContext(readEntries(path));
    previousSummary = ctx.summary;

    dayNum++;
    await new Promise(r => setTimeout(r, 1000));
  }

  // Epilogue
  const epilogueText = winner === "villager"
    ? "人狼は全滅した。\n　村人たちの勝利だ。"
    : winner === "werewolf"
    ? "人狼の数が村人側を上回った。\n　人狼たちの勝利だ。"
    : "ゲームは長引きすぎて中止された。";

  const epilogueEntry: NDJSONPost = {
    type: "post",
    day: "epilogue",
    sequence: sequence++,
    character: null,
    post_type: "action",
    source: "villager",
    body: epilogueText,
    timestamp: null,
  };
  allPosts.push(epilogueEntry);
  appendEntry(path, epilogueEntry);

  // Save to DB
  logJob(jobId, "Saving to database...");
  const characterNames = ["参加者は以下の通りです。", ...assigned.map(c => c.name)];
  const pureNames = characterNames.filter(n => !n.includes("以下の通り"));
  const characterSetIdResult = await db.execute({
    sql: `
      SELECT set_id FROM avatars
      WHERE name IN (${pureNames.map(() => "?").join(",")})
      GROUP BY set_id ORDER BY COUNT(*) DESC LIMIT 1
    `,
    args: pureNames,
  });
  const characterSetId = (characterSetIdResult.rows[0] as unknown as { set_id: string } | undefined)?.set_id ?? null;

  const tx = await db.transaction("write");
  try {
    await tx.execute({
      sql: `DELETE FROM posts WHERE village_id = ?`,
      args: [villageId]
    });
    await tx.execute({
      sql: `DELETE FROM village_characters WHERE village_id = ?`,
      args: [villageId]
    });
    await tx.execute({
      sql: `DELETE FROM villages WHERE id = ?`,
      args: [villageId]
    });

    await tx.execute({
      sql: `
        INSERT INTO villages (id, village_number, name, characters, character_set_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      args: [villageId, 9999, payload.village_name, JSON.stringify(characterNames), characterSetId, now]
    });

    for (const p of allPosts) {
      await tx.execute({
        sql: `
          INSERT INTO posts (village_id, character, day, sequence, body, post_type, source, timestamp, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [villageId, p.character, p.day, p.sequence, p.body, p.post_type, p.source, p.timestamp, now]
      });
    }

    for (const c of assigned) {
      const isAlive = alive.some(a => a.name === c.name) ? 1 : 0;
      await tx.execute({
        sql: `
          INSERT INTO village_characters (village_id, name, role, is_alive, team)
          VALUES (?, ?, ?, ?, ?)
        `,
        args: [villageId, c.name, c.role, isAlive, c.team]
      });
    }

    await tx.commit();
  } catch (e) {
    await tx.rollback();
    throw e;
  }

  const result = { village_id: villageId, posts: allPosts.length, winner };
  await db.execute({
    sql: `UPDATE jobs SET status = 'completed', result = ?, updated_at = ? WHERE id = ?`,
    args: [JSON.stringify(result), new Date().toISOString(), jobId]
  });

  logJob(jobId, `Done! Village ID: ${villageId}, Winner: ${winner}`);
}
