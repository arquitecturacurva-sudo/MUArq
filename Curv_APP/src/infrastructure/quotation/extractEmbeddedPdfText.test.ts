import { expect, it } from "vitest";
import { extractEmbeddedPdfText } from "./extractEmbeddedPdfText";

it("reads embedded PDF text page by page and reports progress", async () => {
  const pages: number[] = [];
  const result = await extractEmbeddedPdfText({
    numPages: 2,
    getPage: async page => ({ getTextContent: async () => ({ items: page === 1 ? [{ str: "PARTIDA UNO", transform: [1, 0, 0, 1, 0, 10] }] : [] }) }),
  }, page => pages.push(page));
  expect(pages).toEqual([1, 2]);
  expect(result).toEqual({ rawText: "PARTIDA UNO", textPages: 1 });
});
