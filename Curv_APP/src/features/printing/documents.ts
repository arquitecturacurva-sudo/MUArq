/** Strip UI controls from a copy, preserving the editable source document. */
export function clonePrintableDocument(source: HTMLElement): HTMLElement {
  const clone = source.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('button, [role="button"], [data-no-print], .__pbar__').forEach((node) => node.remove());
  clone.style.width = "100%";
  clone.style.maxWidth = "none";
  clone.style.minWidth = "0";
  clone.style.overflow = "visible";
  return clone;
}

/** jsPDF otherwise swaps short custom pages to portrait and clips the image. */
export function getProposalPageSize(width: number, height: number) {
  const pageWidth = 210;
  const pageHeight = Math.max(10, height * pageWidth / width);
  return {
    pageWidth,
    pageHeight,
    orientation: pageWidth > pageHeight ? "landscape" as const : "portrait" as const,
  };
}
