import assert from "node:assert/strict";
import test from "node:test";
import { canManageBrand } from "./brandAccess.js";
import { normalizeLogoFile, sanitizeLogoFilename } from "./logoFile.js";

test("rejects files whose real content is not an allowed image", () => {
  assert.throws(
    () => normalizeLogoFile(Buffer.from("this is not an image")),
    /contenido real/
  );
});

test("rejects active SVG content", () => {
  const activeSvg = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100"><script>alert(1)</script></svg>'
  );
  assert.throws(() => normalizeLogoFile(activeSvg), /contenido activo/);
});

test("rasterizes a safe SVG to a PNG", () => {
  const safeSvg = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100"><rect width="300" height="100" fill="#111111"/></svg>'
  );
  const normalized = normalizeLogoFile(safeSvg);
  assert.equal(normalized.contentType, "image/png");
  assert.equal(normalized.width, 300);
  assert.equal(normalized.height, 100);
  assert.deepEqual([...normalized.bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
});

test("uses a safe server-owned filename", () => {
  assert.equal(sanitizeLogoFilename("Mi logo ágil (final).svg"), "Mi-logo-agil-final");
});

test("does not let another workspace member manage the logo", () => {
  assert.equal(canManageBrand("attacker", "owner", "attacker", "viewer"), false);
  assert.equal(canManageBrand("attacker", "owner", "owner", "admin"), false);
  assert.equal(canManageBrand("owner", "owner", undefined, undefined), true);
  assert.equal(canManageBrand("admin", "owner", "admin", "admin"), true);
});
