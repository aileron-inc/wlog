import { readFileSync, writeFileSync } from "fs";

const avatarsNdJson = readFileSync("sling/seeds/wlog/avatars.json", "utf-8");
const characters = avatarsNdJson
  .split("\n")
  .filter(Boolean)
  .map((line) => {
    const a = JSON.parse(line);
    return { name: a.name, avatar: a.avatar_url };
  });

const entries = characters
  .map((c: { name: string; avatar: string }) => `  { name: "${c.name}", avatar: "${c.avatar}" }`)
  .join(",\n");

const content = [
  "type CharacterEntry = { name: string; avatar: string };",
  "",
  "const characters: CharacterEntry[] = [",
  entries,
  "];",
  "",
  "export function getCharacterAvatar(name: string | null): string | null {",
  "  if (!name) return null;",
  "  const entry = characters.find((c) => c.name === name);",
  "  return entry?.avatar ?? null;",
  "}",
  "",
].join("\n");

writeFileSync("app/frontend/data/characters.ts", content);
console.log(`Generated ${characters.length} characters -> app/frontend/data/characters.ts`);
