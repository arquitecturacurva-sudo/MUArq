import process from "node:process";

const baseUrl = String(process.argv[2] || "").replace(/\/$/, "");
const expectedCommit = String(process.argv[3] || process.env.EXPECTED_COMMIT || "").trim();
if (!baseUrl || !expectedCommit) {
  console.error("Usage: npm run verify:deployment -- <base-url> <expected-commit>");
  process.exit(2);
}

const checks = [];
const record = (name, passed, evidence) => checks.push({ name, passed, evidence });

try {
  const response = await fetch(`${baseUrl}/build-provenance.json`, { redirect: "follow" });
  const payload = await response.json();
  record(
    "build provenance matches expected commit",
    response.ok && payload.commit === expectedCommit,
    { status: response.status, commit: payload.commit, buildId: payload.buildId }
  );
} catch (error) {
  record("build provenance matches expected commit", false, { error: error.message });
}

for (const endpoint of ["create-checkout", "cancel-subscription"]) {
  try {
    const response = await fetch(`${baseUrl}/api/billing/${endpoint}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ clientId: "deployment-probe", plan: "BASE" }),
    });
    record(
      `${endpoint} rejects unauthenticated requests`,
      response.status === 401 && Boolean(response.headers.get("x-curv-request-id")),
      {
        status: response.status,
        requestId: response.headers.get("x-curv-request-id"),
      }
    );
  } catch (error) {
    record(`${endpoint} rejects unauthenticated requests`, false, { error: error.message });
  }
}

console.log(JSON.stringify({ baseUrl, expectedCommit, checkedAt: new Date().toISOString(), checks }, null, 2));
if (checks.some((check) => !check.passed)) process.exit(1);
