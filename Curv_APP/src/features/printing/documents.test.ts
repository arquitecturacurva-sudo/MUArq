import { describe, expect, it } from "vitest";
import { jsPDF } from "jspdf";
import { getProposalPageSize } from "./documents";

describe("proposal PDF dimensions", () => {
  it.each([
    [1588, 1150], // A short construction quotation, previously clipped at the right.
    [1588, 2400],
    [1588, 1588],
    [1588, 8000], // Multiple selected tools on the continuous proposal page.
  ])("keeps the whole canvas on the page (%i × %i)", (width, height) => {
    const { pageWidth, pageHeight, orientation } = getProposalPageSize(width, height);
    const pdf = new jsPDF({ unit: "mm", format: [pageWidth, pageHeight], orientation });
    expect(pdf.internal.pageSize.getWidth()).toBeCloseTo(pageWidth, 2);
    expect(pdf.internal.pageSize.getHeight()).toBeCloseTo(pageHeight, 2);
  });
});
