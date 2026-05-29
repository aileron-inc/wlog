import { appendFileSync, mkdirSync } from "node:fs";

type LogLevel = "info" | "warn" | "error";

const LOG_PATH = "log/worker.ndjson";

function ensureDir() {
  mkdirSync("log", { recursive: true });
}

type LogEntry = {
  timestamp: string;
  level: LogLevel;
  job_id?: string;
  message: string;
};

function write(entry: LogEntry) {
  ensureDir();
  appendFileSync(LOG_PATH, JSON.stringify(entry) + "\n");
}

export function log(level: LogLevel, message: string) {
  const entry: LogEntry = { timestamp: new Date().toISOString(), level, message };
  write(entry);
  console.log(`${entry.timestamp.slice(11, 19)} ${level.toUpperCase().padEnd(3)} ${message}`);
}

export function logJob(jobId: string, message: string) {
  const entry: LogEntry = { timestamp: new Date().toISOString(), level: "info", job_id: jobId, message };
  write(entry);
  console.log(`${entry.timestamp.slice(11, 19)} INF [${jobId}] ${message}`);
}

export function logError(jobId: string, error: unknown) {
  const msg = error instanceof Error ? error.message : String(error);
  const entry: LogEntry = { timestamp: new Date().toISOString(), level: "error", job_id: jobId, message: msg };
  write(entry);
  console.error(`${entry.timestamp.slice(11, 19)} ERR [${jobId}] ${msg}`);
  if (error instanceof Error && error.stack) {
    console.error(error.stack);
  }
}
