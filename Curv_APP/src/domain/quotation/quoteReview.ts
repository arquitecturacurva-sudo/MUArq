import { quoteDraftIssues, type QuoteDraft } from "./documentImport";

export const isQuoteReviewed = (row: QuoteDraft) => row.reviewed && quoteDraftIssues(row).length === 0;
export type QuoteSelection = "all" | "none" | "reviewed";
/** Selection changes never undo completed review or accepted partial differences. */
export function selectQuoteRows(rows: QuoteDraft[], selection: QuoteSelection): QuoteDraft[] {
  return rows.map(row => ({...row, selected:selection === "all" || (selection === "reviewed" && isQuoteReviewed(row))}));
}
