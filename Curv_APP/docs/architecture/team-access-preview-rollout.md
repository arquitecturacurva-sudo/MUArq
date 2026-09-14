# Team Access PR preview and Firebase rollout

Equipo y acceso is now accessible from the shared app header (dashboard, workspace,
identity and demos), inside the authenticated app navigation. It reuses the app theme
and header, loads on demand, and labels its example data explicitly. Navigating away
unmounts the demo and resets its in-memory changes on the next visit.

The Vercel preview build also includes `/prototype/index.html` as a standalone QA entry.
Only `VERCEL_ENV=preview` enables this entry in the standard build. Production
and desktop builds keep their existing entry, including the integrated Team Access screen. The demo stores changes in memory:
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

## Deployment gate

This PR and the Vercel preview do not deploy Firestore or Storage rules. Do not roll
these rules out to existing users until the viewer adapter issues scoped queries and
uses a sanitized tenant summary: the existing general tenant/project loader cannot
satisfy those restrictions. Existing observer documents also need explicit project
assignments; no documents are migrated by this PR.

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
