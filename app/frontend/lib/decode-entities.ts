const entities: Record<string, string> = {
  "&gt;": ">",
  "&lt;": "<",
  "&amp;": "&",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": "\u00A0",
};

const entityPattern = new RegExp(
  Object.keys(entities).join("|") + "|&#(\\d+);|&#x([0-9a-fA-F]+);",
  "g"
);

export function decodeEntities(text: string): string {
  return text.replace(entityPattern, (match, dec, hex) => {
    if (dec) return String.fromCharCode(parseInt(dec, 10));
    if (hex) return String.fromCharCode(parseInt(hex, 16));
    return entities[match] || match;
  });
}
