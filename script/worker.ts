import { Database } from "bun:sqlite";
import { MODEL } from "./lib/llm";
import { processGenerateVillage } from "./jobs/generate-village";
import { log } from "./lib/logger";

const POLL_INTERVAL = parseInt(process.env.WORKER_POLL_INTERVAL || "3000", 10);
const DB_PATH = "storage/development.sqlite3";

const handlers: Record<string, (jobId: string, payload: any) => Promise<void>> = {
  generate_village: processGenerateVillage,
};

async function main() {
  log("info", `Worker started (model: ${MODEL}, poll: ${POLL_INTERVAL}ms)`);

  const db = new Database(DB_PATH);

  while (true) {
    const job = db.prepare(`
      SELECT * FROM jobs WHERE status = 'pending' ORDER BY created_at ASC LIMIT 1
    `).get() as { id: string; type: string; payload: string } | undefined;

    if (job) {
      log("info", `--- Job: ${job.id} (type: ${job.type}) ---`);
      const updatedAt = new Date().toISOString();
      db.prepare(`UPDATE jobs SET status = 'running', updated_at = ? WHERE id = ?`).run(updatedAt, job.id);

      try {
        const payload = JSON.parse(job.payload);
        const handler = handlers[job.type];
        if (!handler) throw new Error(`Unknown job type: ${job.type}`);
        await handler(job.id, payload);
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : String(e);
        log("error", `[${job.id}] ${errMsg}`);
        if (e instanceof Error && e.stack) console.error(e.stack);
        const errUpdatedAt = new Date().toISOString();
        db.prepare(`UPDATE jobs SET status = 'failed', error = ?, updated_at = ? WHERE id = ?`).run(errMsg, errUpdatedAt, job.id);
      }
    }

    await new Promise(r => setTimeout(r, POLL_INTERVAL));
  }
}

main().catch(console.error);
