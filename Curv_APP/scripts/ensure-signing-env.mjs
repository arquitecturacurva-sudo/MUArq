const requiresSigning =
  process.env.REQUIRE_SIGNING === "true" || process.env.CI === "true";

if (!requiresSigning) {
  console.log("Code signing check skipped (local unsigned build allowed).");
  process.exit(0);
}

const requiredVars = ["CSC_LINK", "CSC_KEY_PASSWORD"];
const missing = requiredVars.filter((name) => !process.env[name]);

if (missing.length) {
  console.error(
    `Missing required signing environment variables: ${missing.join(", ")}`
  );
  process.exit(1);
}

console.log("Code signing environment variables detected.");
