import { pdfTextItemsToLines } from "../../domain/project/quotationImport";

export interface EmbeddedPdfDocument {
  numPages: number;
  getPage: (pageNumber: number) => Promise<{ getTextContent: () => Promise<{ items: unknown[] }> }>;
}

export const extractEmbeddedPdfText = async (
  doc: EmbeddedPdfDocument,
  onPage?: (pageIndex: number, totalPages: number) => void
) => {
  const chunks: string[] = [];
  let textPages = 0;
  for (let pageIndex = 1; pageIndex <= doc.numPages; pageIndex += 1) {
    onPage?.(pageIndex, doc.numPages);
    const page = await doc.getPage(pageIndex);
    const content = await page.getTextContent();
    const lines = pdfTextItemsToLines(Array.isArray(content?.items) ? content.items : []);
    const pageText = lines.join("\n").trim();
    if (pageText) {
      chunks.push(pageText);
      textPages += 1;
    }
  }
  return {
    rawText: chunks.join("\n").trim(),
    textPages,
  };
};
