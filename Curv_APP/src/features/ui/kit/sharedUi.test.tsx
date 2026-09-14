import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SaveState, type SaveStatus } from "./saveState";
import { DataTable } from "./dataTable";
import { StatusPill } from "./statusPill";
import * as runtime from "../../runtime/runtime";
import * as primitives from "../form-primitives";
import * as tokens from "../tokens";

describe("shared UI compatibility", () => {
  it("keeps the existing runtime exports as identical shared definitions", () => {
    for (const key of ["Btn", "Fld", "Inp", "Sel", "InlineEmptyStateCard"] as const) expect(runtime[key]).toBe(primitives[key]);
    for (const key of ["G", "DK", "BG", "UI", "si", "lb", "cardS", "panelS", "badgeS", "metricS"] as const) expect(runtime[key]).toBe(tokens[key]);
  });
  it.each([["dk", "default"], ["ol", "outline"], ["gd", "brand"]] as const)("preserves legacy button variant %s", (v, variant) => {
    const html = renderToStaticMarkup(<primitives.Btn v={v} sm onClick={() => {}}>Accion</primitives.Btn>);
    expect(html).toContain('data-variant="' + variant + '"');
    expect(html).toContain('data-size="sm"');
  });
  it("preserves native input values/min and option order", () => {
    const html = renderToStaticMarkup(<><primitives.Inp type="number" value={12} min="0" onChange={() => {}} />
      <primitives.Sel value="B" options={["A", "B"]} onChange={() => {}} /></>);
    expect(html).toContain('value="12"');
    expect(html).toContain('min="0"');
    expect(html).toContain('<option selected="">B</option>');
    expect(html.indexOf(">A</option>")).toBeLessThan(html.indexOf(">B</option>"));
  });
  it.each<SaveStatus>(["saving", "saved_local", "saved_cloud", "offline", "retrying", "conflict", "error"])("preserves save controls for %s", status => {
    const html = renderToStaticMarkup(<SaveState saveState={{ status, label: status, detail: "Detalle" }}
      onRetrySave={() => {}} onUseCloudCopy={() => {}} onKeepBothCopies={() => {}} conflictBusy />);
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('data-tour-id="saved-state"');
    expect(html.includes("Reintentar")).toBe(status === "error" || status === "offline");
    expect(html.includes("Usar nube")).toBe(status === "conflict");
    expect(html.includes("Conservar ambas")).toBe(status === "conflict");
    expect((html.match(/disabled=""/g) ?? []).length).toBe(status === "conflict" ? 2 : 0);
  });
  it("retains caption, column headers, row headers and an honest empty row", () => {
    const columns = [{ id: "name", header: "Miembro", rowHeader: true, cell: (row: { id: string }) => row.id }];
    const html = renderToStaticMarkup(<DataTable caption="Estudio / Equipo" rows={[{ id: "Ana" }]} columns={columns}
      rowKey={row => row.id} emptyState="Sin miembros" />);
    expect(html).toContain("<caption>Estudio / Equipo</caption>");
    expect(html).toContain('scope="col"');
    expect(html).toContain('<th scope="row">Ana</th>');
    const empty = renderToStaticMarkup(<DataTable caption="Equipo" rows={[]} columns={columns} rowKey={row => row.id} emptyState="Sin miembros" />);
    expect(empty).toContain('<td colSpan="1">Sin miembros</td>');
  });
  it("always renders the status label independently of its colour", () => {
    const html = renderToStaticMarkup(<StatusPill label="Sin conexion" tone="warning" />);
    expect(html).toContain("Sin conexion");
    expect(html).toContain('aria-hidden="true"');
  });
});
