import { describe, expect, it } from "vitest";
import { addExclusionItem, availableExclusionLibrary, defaultExclusionItems, groupVisibleExclusions } from "./exclusionsRules";

describe("Exclusiones y supuestos", () => {
  it("loads the historical catalog with its presentation defaults", () => {
    const items = defaultExclusionItems();
    expect(items).toHaveLength(24);
    expect(items[0]).toMatchObject({ id: "EX-001", item: "Trámites y licencias", estado: "Excluido", mostrar: true });
    expect(items.at(-1)).toMatchObject({ id: "EX-024", mostrar: false });
    expect(items.filter(item => item.mostrar)).toHaveLength(13);
    expect(availableExclusionLibrary(items)).toHaveLength(0);
  });

  it("exports only displayed items grouped in the historical order", () => {
    const items = defaultExclusionItems();
    const groups = groupVisibleExclusions(items);
    expect(Object.keys(groups)).toEqual(["Excluido", "Supuesto", "Revisión"]);
    expect(Object.values(groups).flat()).toHaveLength(13);
    const hidden = items.map(item => item.id === "EX-001" ? { ...item, mostrar: false } : item);
    expect(groupVisibleExclusions(hidden).Excluido.some(item => item.id === "EX-001")).toBe(false);
    expect(availableExclusionLibrary(items.slice(1)).some(item => item.item === "Trámites y licencias")).toBe(true);
  });

  it("preserves the library text fallback and custom text when adding rows", () => {
    const items = defaultExclusionItems().slice(1);
    const fromLibrary = addExclusionItem(items, { id: "EX-123", cat: "Exclusiones generales", item: "Trámites y licencias", estado: "Excluido", texto: "" });
    expect(fromLibrary.at(-1)).toMatchObject({ id: "EX-123", mostrar: true, texto: "No incluye gestión municipal, licencias ni aprobación ante entidades." });
    const custom = addExclusionItem(items, { id: "EX-124", cat: "Supuestos técnicos", item: "Condición especial", estado: "Supuesto", texto: "Texto propio" });
    expect(custom.at(-1)).toMatchObject({ texto: "Texto propio", mostrar: true });
    expect(addExclusionItem(items, { id: "EX-125", cat: "", item: " ", estado: "", texto: "" })).toBe(items);
  });
});
