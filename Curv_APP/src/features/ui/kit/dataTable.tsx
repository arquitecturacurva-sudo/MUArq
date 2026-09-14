import type { ReactNode } from "react";
export interface DataTableColumn<T> {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  rowHeader?: boolean;
}
export interface DataTableProps<T> {
  caption: string;
  rows: readonly T[];
  columns: readonly DataTableColumn<T>[];
  rowKey: (row: T) => string;
  emptyState: ReactNode;
}
// Pure semantic presentation. Sorting, paging and selection stay with the feature.
export function DataTable<T>({ caption, rows, columns, rowKey, emptyState }: DataTableProps<T>) {
  return <table data-slot="data-table" className="kit-data-table">
    <caption>{caption}</caption>
    <thead><tr>{columns.map(column => <th key={column.id} scope="col">{column.header}</th>)}</tr></thead>
    <tbody>{rows.length ? rows.map(row => <tr key={rowKey(row)}>
      {columns.map(column => column.rowHeader
        ? <th key={column.id} scope="row">{column.cell(row)}</th>
        : <td key={column.id}>{column.cell(row)}</td>)}
    </tr>) : <tr><td colSpan={columns.length}>{emptyState}</td></tr>}</tbody>
  </table>;
}
