import { expect, it } from "vitest";
import { buildQuoteDrafts, SPANISH_QUOTE_EXAMPLE } from "./documentImport";
import { isQuoteReviewed, selectQuoteRows } from "./quoteReview";

it("deselecting and reselecting preserves review, corrected data and accepted differences",()=>{
  const rows=buildQuoteDrafts(SPANISH_QUOTE_EXAMPLE.document);
  rows[0]={...rows[0],reviewed:true,precioUnitario:11,acceptPartialDifference:true};
  const none=selectQuoteRows(rows,"none");
  expect(none.every(row=>!row.selected)).toBe(true);
  expect(selectQuoteRows(none,"all")).toEqual(rows);
  expect(rows[0].selected).toBe(true);
});

it("selects only reviewed valid rows, excluding incomplete rows even with a stale reviewed flag",()=>{
  const rows=buildQuoteDrafts(SPANISH_QUOTE_EXAMPLE.document);
  rows[0].reviewed=true;
  rows[1]={...rows[1],reviewed:true,cantidad:null};
  expect(selectQuoteRows(rows,"reviewed").map(row=>row.selected)).toEqual([true,false]);
  expect(rows.map(isQuoteReviewed)).toEqual([true,false]);
});
