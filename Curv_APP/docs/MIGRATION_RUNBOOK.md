# Migration runbook — toolData subcollection + generated tenant ids

**For whoever holds Firebase owner/editor access.** Everything in this branch is already written,
tested and merged-ready; nothing here has been deployed and no Firestore data has been touched.
This document is the deploy sequence.

All commands run from `Curv_APP/`.

---

## What is changing, and why the order matters

**Track A — project tool data moves out of the parent document.** Each project's tool content used
to live in a single `snapshot.tools` map on `clients/{clientId}/projects/{projectId}`. It now lives
in `clients/{clientId}/projects/{projectId}/toolData/{toolId}`, one document per tool.

This fixes a live correctness bug, not just a size problem: the parent write uses `{merge:true}`,
and Firestore's merge *deep-merges nested maps*. A tool key deleted locally was therefore never
removed from the cloud, so every remote `snapshot.tools` is the union of every key that has ever
existed. Tool documents are written with a full replace, so deletes now propagate.

**Track B — tenant ids are generated.** `cli_` + a Firestore auto-id, minted only by a new
`ensureTenant` callable. The `onUserCreate` auth trigger is deleted and `clients/{clientId}` becomes
`allow create: if false`.

### The ordering constraint (read this before deploying anything)

The two tracks have **opposite** rules-vs-frontend requirements:

| Track | Constraint | If violated |
|---|---|---|
| A | Rules **before** frontend | `rules_version 2` does not cascade into subcollections, so until the `toolData` block is live every tool write is denied — and the client marks the failure sticky, so users must hit Retry |
| B | Rules **after** frontend | `allow create: if false` with the old frontend still live breaks every new signup, with no server-side repair deployed yet |

So this is **two rules deploys**, not one. `docs/migration/firestore.rules.phase1` is the
intermediate state: it contains Track A's `toolData` block but leaves tenant provisioning untouched.

You can stop after Track A (step 5) and run in that state indefinitely. Track B is independent.

---

## Prerequisites

- Firebase **owner or editor** on the project (for `firestore:rules`, `firestore:indexes`,
  `functions`).
- A service account JSON for the backfill script, exported as `FIREBASE_SERVICE_ACCOUNT_JSON`
  (or base64 in `FIREBASE_SERVICE_ACCOUNT_B64`). Same credential the billing API already uses.
- Ability to deploy the frontend (Vercel is wired to GitHub; merging to `master` deploys).

If `firebase` is not on your PATH, use `npx firebase-tools` in place of `firebase` throughout.

```bash
npx firebase-tools login
npx firebase-tools use          # confirm the target project
```

---

## Step 0 — Indexes (safe, additive, do this first)

```bash
npx firebase-tools deploy --only firestore:indexes
```

This adds two single-field **exemptions** (`toolData.data`, `projects.snapshot`). Firestore
auto-indexes every subfield and array element of a map and caps a document at **40,000 index
entries** — an OCR-imported Cotización blows that well before the 1 MiB document limit.

**Worth knowing:** if large Cotización saves are currently failing in production, retry one now.
If it succeeds, the index-entry cap was the real ceiling, and that is useful information before
investing in the rest.

---

## Step 1 — Rules, phase 1 (Track A only)

```bash
cp docs/migration/firestore.rules.phase1 firestore.rules
npx firebase-tools deploy --only firestore:rules
git checkout -- firestore.rules          # restore the full rules for later
```

Adds the `toolData` block. Tenant provisioning is untouched, so **production behavior does not
change** — the deployed frontend does not write tool documents yet.

**Gate:** the deploy must report success. Rules are compiled server-side, so a syntax error fails
here rather than silently.

---

## Step 2 — Deploy the frontend

Merge the branch to `master`; Vercel deploys it.

From this point the app **dual-writes**: both the new `toolData` documents and the legacy
`snapshot` blob. That is deliberate and reversible — reverting the frontend leaves the cloud copy
current, because the blob is still being maintained.

---

## Step 3 — Verify Track A by hand

There is no Firestore emulator in this repo, so this is the real verification.

1. Open a project, edit one field in **Cotización de Obra**, save.
   → In the console, only `.../toolData/cot` and the parent document should have changed. Check
   `updatedAt` on the other tool documents — they must be untouched.
2. **Delete a line item.**
   → The key must be **gone** from `toolData/cot.data`. Under the old blob it would still be there.
   This is the delete bug, verified fixed.
3. Open the app in a second browser profile.
   → Home should paint from a small list read; tool documents are fetched only for projects that
   actually need hydrating, and metrics fill in progressively.
4. Delete a project.
   → The parent's `snapshot` field should be gone and its tool documents blanked.

If any of these fail, roll back with step R below before continuing.

---

## Step 4 — Backfill existing projects

```bash
npm run backfill:tool-docs -- --client=<clientId>            # dry run (default)
npm run backfill:tool-docs -- --client=<clientId> --apply
```

`--client=all` iterates every tenant; it is deliberately not the default. Other flags: `--limit=N`,
`--verbose`, `--strip-blobs` (see step 7).

**Read the dry-run report before applying.** Any line warning that a tool document exceeds 900,000
bytes identifies a project that will fail client-side saves after migration — deal with those
first (the app will show a clear Spanish message naming the tool, rather than a raw Firestore
error, but the save will not go through).

The script deliberately never writes `syncRevision`. Bumping it would put every client's cached
revision behind the remote and trigger a re-hydration of every project.

**Gate:** after applying, reload the app. Every project should decide `"same"` — no re-hydration,
no conflict banners. That is the acceptance test for the backfill.

**Track A is complete here.** It is safe to stop and let this settle.

---

## Step 5 — Audit tenants (do not skip)

```bash
npm run audit:tenants
```

Read-only; writes nothing. It must print **"Clear to deploy the tenant rules."**

Step 6 removes the legacy `ownerId` read fallback. Any tenant still on the pre-rename schema
(`ownerId` instead of `ownerUid`, or member documents keyed `userId` instead of `uid`) will lock
its owner out once that happens. The audit finds exactly those, plus users whose `activeClientId`
points at a tenant that does not exist.

Fix or delete anything it flags before continuing.

---

## Step 6 — Functions, then rules phase 2

> Order is **Functions → Frontend → Rules**. Deploying rules first would leave the old frontend
> hitting `permission-denied` on signup, stranding new users with no server-side repair.

```bash
npm --prefix functions run build
npx firebase-tools deploy --only functions
```

The CLI will ask to confirm deleting `onUserCreate` — accept. This is safe: nothing calls
`ensureTenant` yet, and the old rules still permit the old client-side path.

**Treat this as the point of no return.** Check the Functions log and confirm `ensureTenant` is
deployed before continuing.

The frontend is already deployed (step 2). Then:

```bash
npx firebase-tools deploy --only firestore:rules
```

---

## Step 7 — Verify Track B

- New email signup → console shows `clients/cli_XXXX` (**not** a uid), with a matching
  `members/{uid}` document and `users/{uid}.activeClientId` pointing at it.
- Sign out, sign back in → **`ensureTenant` should not appear in the Functions log at all.** Steady
  state is a single pointer read and zero function invocations.
- Two tabs, simultaneous first login of a fresh account → exactly **one** tenant.
- Log in as a pre-existing **uid-shaped** tenant → projects, billing banner and branding all still
  work. These keep their ids permanently; document ids are opaque and both shapes coexist.
- In devtools as a signed-in user:
  `setDoc(doc(db,"clients","squat"), {...})` → **permission-denied**. Same with
  `clientId = auth.currentUser.uid` → also denied. That second one proves the old escape hatch
  is gone.
- `/api/billing/create-checkout` → 200 with a real clientId, 403 with a fabricated one.

---

## Step R — Rollback

**Rules are the cheapest thing to revert** — seconds, no build. That is why they go last.

```bash
git checkout HEAD~1 -- firestore.rules
npx firebase-tools deploy --only firestore:rules
```

Frontend rollback is a redeploy of the previous commit. Because the app dual-writes until step 8,
the cloud copy stays current and no data is lost by reverting the client.

Functions rollback would require re-adding `onUserCreate`, which is why step 6 is the point of no
return.

---

## Step 8 — Later, once this is trusted

1. Set `WRITE_LEGACY_SNAPSHOT_BLOB = false` in `src/lib/persistence/clientProjects.ts` and deploy.
   The app stops writing the legacy blob. It still *reads* it — dual-read stays forever, it costs
   nothing and preserves legacy data.
2. `npm run backfill:tool-docs -- --client=<id> --apply --strip-blobs`
   **This deletes data** (the `snapshot` field on documents that already have a matching
   `snapshotIndex`). Needs a deliberate decision; it is not required for correctness.

---

## Notes

- `npm test` (23 files / 164 tests), `npm run typecheck`, `npm run lint`, `npm run build` and
  `npm --prefix functions test` (14 tests) all pass on this branch.
- One pre-existing test was fixed along the way: `src/lib/branding/securityRules.test.ts` could
  never pass on Windows, because `core.autocrlf` makes the `?raw` rules import CRLF and every
  multi-line containment assertion silently failed to match.
- Related reading: `docs/firebase-multitenant.md` (schema and provisioning),
  `docs/STABILIZATION_NOTES.md` (what the earlier snapshot work does and does not cover).
