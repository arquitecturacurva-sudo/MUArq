import ts from "typescript";
import { expect, it } from "vitest";
const sources = import.meta.glob<string>(["/src/domain/fees/*.ts", "/src/application/fees/*.ts", "/src/features/fees/*.tsx"], { eager: true, query: "?raw", import: "default" });
it("keeps Honorarios domain/application pure and the view independent of storage and the facade", () => {
  for (const [path, source] of Object.entries(sources)) {
    if (path.includes(".test.")) continue;
    const ast = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);
    for (const statement of ast.statements) {
      if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
      const dependency = statement.moduleSpecifier.text;
      expect(dependency, path).not.toMatch(/runtime|infrastructure|firebase/);
      if (!path.includes("/features/")) expect(dependency, path).not.toMatch(/react|features|composition/);
    }
    expect(source, path).not.toMatch(/\blocalStorage\b|\bwindow\./);
  }
});
