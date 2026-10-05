import ts from "typescript";
import { expect, it } from "vitest";

const sources = import.meta.glob<string>(["/src/domain/construction-schedule/*.ts", "/src/application/construction-schedule/*.ts"], { eager: true, query: "?raw", import: "default" });
const view = import.meta.glob<string>("/src/features/construction-schedule/ConstructionScheduleView.tsx", { eager: true, query: "?raw", import: "default" });

it("keeps construction planning and application contracts pure", () => {
  for (const [path, source] of Object.entries(sources)) {
    if (path.includes(".test.")) continue;
    const ast = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);
    for (const statement of ast.statements) {
      if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
      expect(statement.moduleSpecifier.text, path).not.toMatch(/react|runtime|infrastructure|firebase|features|composition/);
    }
    expect(source, path).not.toMatch(/\blocalStorage\b|\bwindow\./);
  }
});

it("keeps the view independent of project storage and the runtime facade", () => {
  const source = Object.values(view)[0];
  expect(source).toBeDefined();
  expect(source).not.toMatch(/from ["'][^"']*runtime|from ["'][^"']*browserStorage|\blocalStorage\b/);
});
