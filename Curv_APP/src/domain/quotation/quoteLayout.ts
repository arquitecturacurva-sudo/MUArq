/** Geometry shared by embedded PDF text and OCR. All coordinates start at the top left. */
export type QuoteToken = {
  text: string; x: number; y: number; width: number; height: number; confidence?: number;
};
export type QuotePage = {
  page: number; width: number; height: number; tokens: QuoteToken[]; method: "embedded" | "ocr" | "mixed";
};
export type QuoteLine = {
  tokens: QuoteToken[]; text: string; x: number; y: number; width: number; height: number;
};

export function tokenRegion(tokens: QuoteToken[]) {
  const x = Math.min(...tokens.map(t => t.x)), y = Math.min(...tokens.map(t => t.y));
  return {x, y, width: Math.max(...tokens.map(t => t.x + t.width)) - x, height: Math.max(...tokens.map(t => t.y + t.height)) - y};
}

/** Retain table gaps while joining OCR words into the same visual line. */
export function buildQuoteLines(tokens: QuoteToken[]): QuoteLine[] {
  const ordered = tokens.filter(t => t.text.trim() && [t.x, t.y, t.width, t.height].every(Number.isFinite) && t.width >= 0 && t.height > 0)
    .map(t => ({...t, text: t.text.trim()})).sort((a, b) => a.y - b.y || a.x - b.x);
  const lines: QuoteToken[][] = [];
  for (const token of ordered) {
    const center = token.y + token.height / 2;
    const previous = lines.findLast(line => {
      const representative = line.reduce((largest, item) => item.height > largest.height ? item : largest);
      return Math.abs(center - representative.y - representative.height / 2) <= Math.max(2, Math.min(token.height, representative.height) * .55);
    });
    if (previous) previous.push(token); else lines.push([token]);
  }
  return lines.map(line => {
    const sorted = line.sort((a, b) => a.x - b.x);
    const text = sorted.reduce((result, token, index) => {
      if (!index) return token.text;
      const previous = sorted[index - 1];
      const gap = token.x - previous.x - previous.width;
      return result + (gap > Math.max(7, Math.min(previous.height, token.height) * .9) ? "\t" : " ") + token.text;
    }, "");
    return {tokens: sorted, text, ...tokenRegion(sorted)};
  }).sort((a, b) => a.y - b.y || a.x - b.x);
}

export function quotePageText(page: QuotePage): string {
  return buildQuoteLines(page.tokens).map(line => line.text).join("\n");
}
