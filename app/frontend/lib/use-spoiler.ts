import { useState, useEffect } from "react";

const KEY = "wlog_spoiler";

function read(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

function write(value: boolean) {
  try {
    localStorage.setItem(KEY, value ? "1" : "0");
  } catch {}
}

export function useSpoiler() {
  const [spoiler, setSpoiler] = useState(read);

  useEffect(() => {
    write(spoiler);
  }, [spoiler]);

  return { spoiler, setSpoiler } as const;
}
