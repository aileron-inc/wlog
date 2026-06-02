import { createClient } from "@libsql/client";
import { readFileSync, existsSync } from "fs";

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
  console.error("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required");
  process.exit(1);
}

const db = createClient({
  url: TURSO_DATABASE_URL,
  authToken: TURSO_AUTH_TOKEN,
});

function readNdJson<T>(path: string): T[] {
  if (!existsSync(path)) return [];
  const text = readFileSync(path, "utf-8");
  return text.split("\n").filter(Boolean).map((line) => JSON.parse(line));
}

async function chunkInsert(tableName: string, columns: string[], rows: any[][], chunkSize = 100) {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const placeholders = chunk.map(() => `(${columns.map(() => "?").join(",")})`).join(",");
    const sql = `INSERT INTO ${tableName} (${columns.join(",")}) VALUES ${placeholders}`;
    const args = chunk.flat();
    await db.execute({ sql, args });
  }
}

async function main() {
  const seedDir = "sling/seeds/wlog";

  console.log("Reading seeds...");
  const characterSets = readNdJson<{ id: string }>(`${seedDir}/character_sets.json`);
  const villages = readNdJson<any>(`${seedDir}/villages.json`);
  const posts = readNdJson<any>(`${seedDir}/posts.json`);
  const avatars = readNdJson<any>(`${seedDir}/avatars.json`);

  console.log(`Loaded seeds:
  - character_sets: ${characterSets.length} records
  - villages: ${villages.length} records
  - posts: ${posts.length} records
  - avatars: ${avatars.length} records`);

  // トランザクション内でテーブル削除、及びインサートを行う
  const tx = await db.transaction("write");
  try {
    console.log("Cleaning up existing data...");
    await tx.execute("DELETE FROM posts");
    await tx.execute("DELETE FROM villages");
    await tx.execute("DELETE FROM avatars");
    await tx.execute("DELETE FROM character_sets");

    await tx.commit();
  } catch (e) {
    await tx.rollback();
    console.error("Failed to clean up tables:", e);
    process.exit(1);
  }

  // テーブルのクリーンアップが終わったので、マルチバリューインサートを順次実行
  try {
    console.log("Inserting character_sets...");
    if (characterSets.length > 0) {
      const rows = characterSets.map((cs) => [cs.id]);
      await chunkInsert("character_sets", ["id"], rows, 100);
    }

    console.log("Inserting villages...");
    if (villages.length > 0) {
      const rows = villages.map((v) => [
        v.id,
        v.village_number,
        v.name,
        v.characters,
        v.character_set_id,
        v.created_at,
      ]);
      await chunkInsert(
        "villages",
        ["id", "village_number", "name", "characters", "character_set_id", "created_at"],
        rows,
        50
      );
    }

    console.log("Inserting avatars...");
    if (avatars.length > 0) {
      const rows = avatars.map((a) => [a.name, a.avatar_url, a.set_id]);
      await chunkInsert("avatars", ["name", "avatar_url", "set_id"], rows, 100);
    }

    console.log("Inserting posts (this may take a while)...");
    if (posts.length > 0) {
      const rows = posts.map((p) => [
        p.village_id,
        p.character,
        p.day,
        p.sequence,
        p.body,
        p.timestamp,
        p.post_type,
        p.source,
        p.created_at,
      ]);
      await chunkInsert(
        "posts",
        ["village_id", "character", "day", "sequence", "body", "timestamp", "post_type", "source", "created_at"],
        rows,
        100
      );
    }

    console.log("Seeding complete successfully!");
  } catch (e) {
    console.error("Failed to seed database:", e);
    process.exit(1);
  } finally {
    db.close();
  }
}

main().catch(console.error);
