const DAY_LABELS: Record<string, string> = {
  prologue: "プロローグ",
  "1": "第1日目",
  "2": "第2日目",
  "3": "第3日目",
  "4": "第4日目",
  "5": "第5日目",
  "6": "第6日目",
  "7": "第7日目",
  "8": "第8日目",
  "9": "第9日目",
  "10": "第10日目",
  epilogue: "エピローグ",
};

export { DAY_LABELS };

export function dayLabel(day: string): string {
  return DAY_LABELS[day] || day;
}

export function qs(params: Record<string, string>): string {
  const s = new URLSearchParams(params).toString();
  return s ? `?${s}` : "";
}

export function dayUrl(params: Record<string, string>): string {
  const p = { ...params };
  delete p.source;
  return `/villages/day${qs(p)}`;
}

export function aboutUrl(params: Record<string, string>): string {
  const p = { ...params };
  delete p.source;
  return `/villages/about${qs(p)}`;
}
