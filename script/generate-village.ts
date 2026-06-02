import { db } from "./lib/db";
import * as crypto from "node:crypto";

const VILLAGE_NAME = process.argv[2] || "AI生成テスト村";
const CHARACTER_COUNT = parseInt(process.argv[3] || "10", 10);

async function main() {
  const jobId = crypto.randomBytes(8).toString("hex");
  const now = new Date().toISOString();

  const payload = JSON.stringify({ village_name: VILLAGE_NAME, character_count: CHARACTER_COUNT });

  await db.execute({
    sql: `
      INSERT INTO jobs (id, type, payload, status, created_at, updated_at)
      VALUES (?, 'generate_village', ?, 'pending', ?, ?)
    `,
    args: [jobId, payload, now, now]
  });

  console.log(`Job queued: ${jobId}`);
  console.log(`  type: generate_village`);
  console.log(`  village_name: ${VILLAGE_NAME}`);
  console.log(`  character_count: ${CHARACTER_COUNT}`);
  console.log(`\nRun 'mise run worker' to process.`);
  console.log(`Check status: sqlite3 storage/development.sqlite3 "SELECT * FROM jobs WHERE id='${jobId}'"`);
}

main().catch(console.error);
