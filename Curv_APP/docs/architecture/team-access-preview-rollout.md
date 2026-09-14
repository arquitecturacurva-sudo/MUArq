# Team Access PR preview and Firebase rollout

Equipo y acceso is now accessible from the shared app header (dashboard, workspace,
identity and demos), inside the authenticated app navigation. It reuses the app theme
and header and loads on demand. The integrated screen now reads the real active tenant,
member directory and stored seat limits via a scoped Firebase read-only adapter.
It accepts active admin/editor memberships (including legacy owner and missing status).
Viewer directory access is denied before loading the tenant billing document.
Mutations are hidden and the repository returns not-implemented for writes.
This does not implement tenant switching or viewer project navigation.

The Vercel preview build also includes `/prototype/index.html` as a standalone QA entry.
Only `VERCEL_ENV=preview` enables this entry in the standard build. Production
and desktop builds keep their existing entry, including the integrated Team Access screen. Only the standalone QA demo stores changes in memory:
invitations, role changes and revocations do not contact Firebase or send email.

## Rules matched to the UX contract

- Active admin/editor members retain project reads and their existing writes.
- Legacy owner is an admin; legacy observer is a viewer. Missing status is
  treated as active for existing documents. Unknown roles and inactive states deny access.
- Viewers only read projects named in `accessScope: { kind: "projects", projectIds: [...] }`
  and their tool data, in the same tenant. Missing assignments deny project access.
- Viewer queries must constrain document IDs to assigned projects. Rules are not filters.
- Viewers cannot read the tenant document containing billing, list other members,
  edit identity, projects or tool data, or upload logos. Active viewers may read branding.
- Browser membership writes are closed for every role, including admin. This prevents
  removal of the owner or last admin, role escalation and assignment changes through
  direct SDK calls. It does not implement the server operations represented by the demo.
- Logo reads now require an active membership with a recognized role.

## Production rollout: 2026-09-14

Firestore and Storage rules and the three logo Functions were deployed explicitly
with user authorization to curv-app-ce938. Active rules were read back and matched
the tested source. All three Functions rejected unauthenticated requests with 401.
The pre-deploy aggregate audit found 20 tenants and 20 memberships, with zero active
viewers, inactive memberships or unknown roles. No user documents were modified.

Identity and tenant name writes now require the active canonical owner. Saving
Identity writes companyName and clients.name in one Firestore transaction.
Logo writes require that same owner, including an active admin/owner membership.

This release enables real read-only team data for existing admin/editor users.
Do not activate Viewer invitations until scoped project queries and a sanitized
summary are integrated: the existing general tenant loader cannot satisfy those
restrictions. Vercel builds do not automatically deploy Firebase rules.

Production invitations, seat accounting, role changes and revocations still require
transactional server operations that enforce actor permissions, owner protection,
last effective admin and quotas. Admin SDK bypasses security rules, so those operations
must validate the same policy independently. No such invitation endpoint is invented here.

## Verification

`npm run test:rules` uses official Firebase test tools, Firestore and Storage emulators,
and the isolated `demo-curv-team-access` project. Java 21 is required. The test runner
refuses to run without both emulator endpoints. CI installs Java and runs this suite,
frontend checks and the existing Functions tests. The added dependencies are development
only, to execute actual rules rather than rely exclusively on text assertions.

The suite covers roles and legacy aliases, inactive memberships, assigned/unassigned
projects, constrained queries, tenant isolation, billing/identity restrictions, direct
membership writes, owner/last-admin protection and logo reads/writes.

References: [rules queries](https://firebase.google.com/docs/firestore/security/rules-query),
[field access](https://firebase.google.com/docs/firestore/security/rules-fields),
[official rule tests](https://firebase.google.com/docs/rules/unit-tests).

Validation: 295 frontend tests, 14 Functions tests and 19 emulator tests passed.
Authenticated production UI workflows still require verification with the owner session;
no impersonation or test writes to real studies were performed.
Node.js 20 Functions runtime must be upgraded before its 2026-10-30 decommission.
