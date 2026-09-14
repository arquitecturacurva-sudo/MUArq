import ts from "typescript";
import { expect, it } from "vitest";

const modules = import.meta.glob<string>([
  "/src/features/ui/kit/**/*.{ts,tsx}", "/src/features/ui/tokens.ts",
  "/src/features/ui/form-primitives{,.types}.{ts,tsx}", "/src/features/ui/legacy-empty-state.tsx",
  "/src/components/ui/**/*.{ts,tsx}",
], { query: "?raw", import: "default", eager: true });
it("shared UI cannot depend on runtime, domain features, persistence or Firebase", () => {
  for (const [path, text] of Object.entries(modules)) {
    if (path.includes(".test.")) continue;
    const source = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const visit = (node: ts.Node) => {
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        const dependency = node.moduleSpecifier.text;
        const resolved = dependency.startsWith(".") ? new URL(dependency, "file://" + path).pathname
          : dependency.startsWith("@/") ? "/src/" + dependency.slice(2) : dependency;
        expect(resolved, path).not.toMatch(/runtime|firebase|persistence|team-access|application\/|domain\//);
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
});
