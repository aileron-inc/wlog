export type AssignedRole = {
  name: string;
  role: string;
  team: "villager" | "werewolf";
  personality: string;
};

const ROLE_POOL: { role: string; team: "villager" | "werewolf" }[] = [
  { role: "人狼", team: "werewolf" },
  { role: "人狼", team: "werewolf" },
  { role: "占い師", team: "villager" },
  { role: "霊能者", team: "villager" },
  { role: "騎士", team: "villager" },
];

export function assignRoles(
  characters: { name: string; personality: string }[],
): AssignedRole[] {
  const n = characters.length;
  let pool: { role: string; team: "villager" | "werewolf" }[] = [];

  if (n >= 8) {
    pool = [...ROLE_POOL, { role: "村人", team: "villager" }];
  } else if (n === 7) {
    pool = [...ROLE_POOL];
  } else if (n === 6) {
    pool = [
      { role: "人狼", team: "werewolf" },
      { role: "人狼", team: "werewolf" },
      { role: "占い師", team: "villager" },
      { role: "騎士", team: "villager" },
      { role: "村人", team: "villager" },
    ];
  } else if (n === 5) {
    pool = [
      { role: "人狼", team: "werewolf" },
      { role: "占い師", team: "villager" },
      { role: "騎士", team: "villager" },
      { role: "村人", team: "villager" },
    ];
  } else {
    throw new Error(`Minimum 5 characters required, got ${n}`);
  }

  // Fill remaining villagers
  while (pool.length < n) {
    pool.push({ role: "村人", team: "villager" });
  }

  // Shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return characters.map((c, i) => ({
    name: c.name,
    role: pool[i].role,
    team: pool[i].team,
    personality: c.personality,
  }));
}
