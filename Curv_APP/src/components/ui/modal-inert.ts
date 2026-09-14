// Shared modal lifecycle only; Radix owns focus containment and restoration.
const anchors: HTMLElement[] = [];
const previous = new Map<HTMLElement, boolean>();
let observer: MutationObserver | null = null;
function updateBackground() {
  const top = anchors.at(-1);
  for (const element of document.body.children) {
    if (!(element instanceof HTMLElement)) continue;
    if (!previous.has(element)) previous.set(element, element.inert);
    // A Select can portal through an item-aligned wrapper (not only a popper).
    // Exempt it only when a control in the active dialog owns that listbox.
    const listbox = element.matches('[data-slot="select-content"]') ? element : element.querySelector<HTMLElement>('[data-slot="select-content"]');
    const dialog = top?.closest('[role="dialog"]');
    const ownedSelect = listbox?.id && dialog && Array.from(dialog.querySelectorAll("[aria-controls]"))
      .some(control => control.getAttribute("aria-controls")?.split(" ").includes(listbox.id));
    const foreground = top && (element.contains(top)
      || ownedSelect
      || element.getAttribute("data-slot") === "dialog-overlay");
    element.inert = top && !foreground ? true : previous.get(element) ?? false;
  }
}
export function registerModalBackground(anchor: HTMLElement): () => void {
  anchors.push(anchor);
  if (!observer) {
    observer = new MutationObserver(updateBackground);
    observer.observe(document.body, { childList: true });
  }
  updateBackground();
  return () => {
    const index = anchors.indexOf(anchor);
    if (index !== -1) anchors.splice(index, 1);
    if (anchors.length) updateBackground();
    else {
      observer?.disconnect();
      observer = null;
      previous.forEach((inert, element) => { element.inert = inert; });
      previous.clear();
    }
  };
}
