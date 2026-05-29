import { Database } from "bun:sqlite";
import crypto from "node:crypto";

const VILLAGE_NAME = process.argv[2] || "AI生成テスト村";
const CHARACTER_COUNT = parseInt(process.argv[3] || "10", 10);

const db = new Database("storage/development.sqlite3");

const jobId = crypto.randomBytes(8).toString("hex");
const now = new Date().toISOString();

const payload = JSON.stringify({ village_name: VILLAGE_NAME, character_count: CHARACTER_COUNT });

db.prepare(`
  INSERT INTO jobs (id, type, payload, status, created_at, updated_at)
  VALUES (?, 'generate_village', ?, 'pending', ?, ?)
`).run(jobId, payload, now, now);

db.close();

console.log(`Job queued: ${jobId}`);
console.log(`  type: generate_village`);
console.log(`  village_name: ${VILLAGE_NAME}`);
console.log(`  character_count: ${CHARACTER_COUNT}`);
console.log(`\nRun 'mise run worker' to process.`);
console.log(`Check status: sqlite3 storage/development.sqlite3 "SELECT * FROM jobs WHERE id='${jobId}'"`);
