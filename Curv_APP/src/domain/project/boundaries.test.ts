import { describe, expect, it } from "vitest";
import ts from "typescript";

const files = import.meta.glob<string>([
  "/src/domain/project/**/*.ts", "/src/application/project/**/*.ts",
  "/src/infrastructure/project/**/*.ts", "/src/infrastructure/firebase/projectRepository.ts",
], { query: "?raw", import: "default", eager: true });

describe("phase 2 project boundaries", () => {
  for (const [path, text] of Object.entries(files)) {
    if (path.endsWith(".test.ts")) continue;
    it(path, () => {
      const source = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
      const visit = (node: ts.Node) => {
        if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
          const dependency = node.moduleSpecifier.text;
          const resolved = dependency.startsWith(".") ? new URL(dependency, "file://" + path).pathname : dependency;
          expect(resolved).not.toMatch(/features|lib\/persistence|lib\/tenant/);
          if (path.includes("/domain/")) expect(resolved).toMatch(/^\/src\/domain\//);
          if (path.includes("/application/")) expect(resolved).toMatch(/^\/src\/(domain|application)\//);
        }
        if ((path.includes("/domain/") || path.includes("/application/")) && ts.isIdentifier(node)) {
          expect(["window", "document", "sessionStorage"].includes(node.text)).toBe(false);
        }
        ts.forEachChild(node, visit);
      };
      visit(source);
    });
  }
});
