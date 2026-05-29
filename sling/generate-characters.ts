import { readFileSync, writeFileSync } from "fs";

const characters = JSON.parse(readFileSync("sling/seeds/wlog/characters.json", "utf-8"));

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
