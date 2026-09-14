import { describe, expect, it } from "vitest";
import ts from "typescript";

// Parse imports rather than matching comments/strings. Includes lazy imports,
// reexports and import types so a new dependency cannot bypass the boundary.
const files = import.meta.glob<string>([
  "/src/domain/tenant/**/*.ts", "/src/application/tenant/**/*.ts",
  "/src/infrastructure/tenant/**/*.ts", "/src/infrastructure/firebase/**/*.ts",
  "/src/features/team-access/**/*.{ts,tsx}",
], { query: "?raw", import: "default", eager: true });

describe("phase 0 dependency boundaries", () => {
  for (const [path, text] of Object.entries(files)) {
    if (path.endsWith(".test.ts") || path.endsWith(".test.tsx")) continue;
    it(path, () => {
      const source = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true,
        path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
      const imports: string[] = [];
      const visit = (node: ts.Node) => {
        if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node))
          && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) imports.push(node.moduleSpecifier.text);
        if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword
          || (ts.isIdentifier(node.expression) && node.expression.text === "require"))) {
          const arg = node.arguments[0];
          expect(arg && ts.isStringLiteral(arg), "Dynamic dependencies must be statically auditable").toBe(true);
          if (arg && ts.isStringLiteral(arg)) imports.push(arg.text);
        }
        if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument) && ts.isStringLiteral(node.argument.literal)) imports.push(node.argument.literal.text);
        if (ts.isIdentifier(node) && !path.includes("/features/")) {
          expect(["localStorage", "sessionStorage", "window", "document"].includes(node.text)).toBe(false);
        }
        ts.forEachChild(node, visit);
      };
      visit(source);
      for (const dependency of imports) {
        const resolved = dependency.startsWith(".")
          ? new URL(dependency, "file://" + path).pathname
          : dependency.startsWith("@/") ? "/src/" + dependency.slice(2) : dependency;
        expect(resolved).not.toMatch(/runtime|lib\/tenant|lib\/persistence/);
        if (path.includes("/domain/")) expect(resolved.startsWith("/src/domain/tenant/")).toBe(true);
        if (path.includes("/application/")) expect(resolved).toMatch(/^\/src\/(application|domain)\/tenant\//);
        if (path.includes("/infrastructure/")) expect(resolved).not.toMatch(/features|application|react/);
        if (path.includes("/features/")) expect(resolved).toMatch(/^(react$|\/src\/(features\/(team-access|ui\/kit)|application\/tenant|domain\/tenant|components\/ui)\/)/);
      }
    });
  }
});
