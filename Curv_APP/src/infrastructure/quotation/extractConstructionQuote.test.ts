import { describe, expect, it } from "vitest";
import { extractConstructionQuote, hasSubstantialImage } from "./extractConstructionQuote";

describe("local quotation file boundary", () => {
  it("rejects non-PDF, empty and oversized files before loading OCR", async () => {
    const signal=new AbortController().signal;
    await expect(extractConstructionQuote(new File(["text"],"obra.txt"),signal)).rejects.toThrow("20 MB");
    await expect(extractConstructionQuote(new File([],"empty.pdf"),signal)).rejects.toThrow("20 MB");
    await expect(extractConstructionQuote(new File([new Uint8Array(20_000_001)],"large.pdf"),signal)).rejects.toThrow("20 MB");
    await expect(extractConstructionQuote(new File(["not a PDF"],"obra.pdf"),signal)).rejects.toThrow("no es un PDF");
  });
  it("rejects an already aborted request before reading any file", async () => {
    const controller=new AbortController();controller.abort();
    await expect(extractConstructionQuote(new File(["%PDF-"],"obra.pdf"),controller.signal)).rejects.toMatchObject({name:"AbortError"});
  });
  it("routes substantial images to OCR while excluding a small logo", () => {
    const ops={save:1,restore:2,transform:3,paintImageXObject:4,paintInlineImageXObject:5,paintImageXObjectRepeat:6};
    expect(hasSubstantialImage([1,3,4,2], [[],[40,0,0,40,0,0],[],[]],600*840,ops)).toBe(false);
    expect(hasSubstantialImage([1,3,4,2], [[],[600,0,0,400,0,0],[],[]],600*840,ops)).toBe(true);
    expect(hasSubstantialImage([1,3,4,2], [[],[500,0,0,30,0,0],[],[]],600*840,ops)).toBe(true);
  });
});
