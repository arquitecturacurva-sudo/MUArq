import { describe, expect, it } from "vitest";
import { CHANGE_ORDER_CONDITIONS, formatChangeOrderAmount, hasChangeOrderContent } from "./changeOrderRules";

describe("change-order rules", () => {
  it("recognizes content without counting whitespace", () => {
    expect(hasChangeOrderContent("  ", "", "", "")).toBe(false);
    expect(hasChangeOrderContent("", "", "Ampliar terraza", "")).toBe(true);
  });

  it("preserves the legacy displayed amount fallbacks", () => {
    expect(formatChangeOrderAmount("", "S/", "zero")).toBe("S/ 0.00");
    expect(formatChangeOrderAmount("", "$", "dash")).toBe("—");
    expect(formatChangeOrderAmount("450.00", "$", "dash")).toBe("$ 450.00");
  });

  it("keeps the explicit approval condition in the document", () => {
    expect(CHANGE_ORDER_CONDITIONS).toHaveLength(4);
    expect(CHANGE_ORDER_CONDITIONS[3]).toContain("aprobación expresa del cliente");
  });
});
