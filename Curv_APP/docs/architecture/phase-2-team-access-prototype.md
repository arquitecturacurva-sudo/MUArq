# Phase 2A - functional Team Access prototype

## Scope and baseline

The user reordered phase 2: validate a functional Team Access window first,
then undertake broader domain/application/infrastructure extraction.
This delivery implements that first step. It does not claim to finish phase 2.

- Branch: codex/phase-0-team-access-boundary.
- Refetched origin/master: 28eac6fa31f54c6180765e1465d49a00f7181a54.
- Continues the isolated phase 0/1 worktree; unrelated original checkout
  changes remain untouched. No commits, push or deployment.
- Normative UX: docs/contracts/tenant-access-ux.md, retained unchanged.
- runtime.tsx: 4600 lines before and after this step (4692 before phase 1).
- App.tsx: 2431 lines before and after this step.
- No changes to Firestore documents/rules, billing, Functions, persistence keys,
  snapshots, exports or the nine operational tools.

## Functional prototype

Two studios, member/invitation views, name/email search, role filters, role
descriptions, edition/viewer seat usage, viewer project assignment, confirmed
role changes and revocations, undo of the exact last local mutation.
Pending invitations reserve seats. All success copy explicitly says demo.
Nothing sends email, calls Firebase or survives a page reload.

The composition root injects a local repository through the existing service.
Editor mode permits consultation without management. Viewer mode displays
only assigned projects, without the roster or management controls.
Demo identity controls deliberately exist outside that restricted feature view.
All demo data is bundled in the browser; this is not a privacy/security boundary.

The local adapter independently checks active administrator authority,
tenant/project scope, owner/last-admin protection, duplicate emails and quotas.
Writes are rolled back when capacity is exceeded. A session change invalidates
in-flight writes. Expected errors are typed results. No broad catch, any cast,
new dependency or invented production invitation endpoint was introduced.
Undo is an in-memory journal guarded by actor, tenant and exact revision;
it is NOT a promise of production invitation/revocation undo.

## Dependency diagram

    prototype/index.html
      -> src/prototypes/team-access/main.tsx
      -> Prototype (composition root + demo controls)
           -> TeamAccessView -> injected TenantAccessService
           -> createTenantAccessService -> TenantRepository port
           -> createPrototypeTenantRepository -> pure domain rules/types

    TeamAccessView -> shared UI kit / Radix Dialog / theme tokens
    domain -> no React, browser storage or Firebase
    application -> domain contracts
    infrastructure -> domain contracts
    App/runtime -> no prototype imports

Production entry and prototype entry build separately. The existing product
does not expose this feature or the simulation repository.

## UX and accessibility

- Charcoal sidebar, studio gold primary action, shared typography and theme
  tokens. Short copy identifies the action, consequence and affected studio.
- Semantic desktop table and equivalent mobile cards; text accompanies roles
  and statuses. Named projects replace anonymous counts.
- Forms have labels, ids, names, descriptions and local live errors.
- Invalid input retains its value; validation focuses the first invalid field.
- Busy submissions are locked; conflicts/permission errors refresh the effective
  roster before retry. Sensitive actions require explicit confirmation.
- Shared Radix primitive owns focus containment, Escape and initial focus.
  Existing ModalBody handles literal background inert; no manual trap.
- Close restores the opener, or the page heading if the row was removed.
- Mobile safe-area, internal modal scroll and shared reduced-motion styles.
- Fixed an input text colour defect discovered in dark-mode QA by using
  text-foreground in the shared Input primitive.

## Run the compiled prototype

    npm run build:team-access
    npm run preview:team-access -- --host 127.0.0.1 --port 4178 --strictPort

Open http://127.0.0.1:4178/prototype/index.html.
Build output: dist-team-access (ignored).
The preview listener is loopback-only; it is not a public deployment.

Use Opciones de prueba for Mateo (admin), Diego (editor), Carlos (viewer),
one-shot write failure/conflict, and confirmed reset. Taller Sur starts with
all edition seats occupied to exercise quota errors. Reload resets all data.

## Validation

- npm test: 32 files, 256 tests passed (including local repository tests).
- npm run lint: passed.
- npm run typecheck: passed.
- npm run build: passed; existing >500 kB production chunk warning remains.
- npm run build:team-access: passed, separate approximately 298 kB JS bundle.
- Functions npm test: 14 passed.
- Edge against the compiled prototype: invitation validation/project selection,
  creation, role change, cancellation, undo, retained input after simulated
  failure/retry, tenant switch, viewer scope, search/role filter, both themes,
  reset confirmation, Escape/focus restoration and Shift+Tab containment.
- At 390 x 844: document scroll width 390, desktop table hidden, cards visible;
  invite dialog 366 x 753, fits viewport; initial email focus and root inert.
- Browser runtime error collection: empty.
- Real screen-reader review and true browser zoom 200% remain release gates.

## Deliberately outside this step

No production route, authentication integration, real invitations/delivery,
acceptance/resend/expiry, server membership writes, paid seat management,
Firestore rule changes or broad legacy-domain extraction.
No claims that frontend guards enforce server authorization.
The existing Firestore access model still needs explicit tenant/member/project
server guarantees before enabling this UI in production.

## Next step after reviewing the prototype

Agree the interaction and writing details, then extract the production tenant
use cases and infrastructure adapters behind these ports. Implement atomic
owner/last-effective-admin/seat/project-scope checks on the server with emulator
tests before connecting real mutations. Continue extracting legacy domains
incrementally; keep runtime a compatibility facade.

## Exact files changed in this step

Existing files modified (12):

- .gitignore
- package.json
- src/components/ui/input.tsx
- src/features/team-access/TeamAccessView.tsx
- src/features/team-access/MemberTable.tsx
- src/features/team-access/MemberCard.tsx
- src/features/team-access/InviteMemberDialog.tsx
- src/features/team-access/ChangeRoleDialog.tsx
- src/features/team-access/RevokeAccessDialog.tsx
- src/features/team-access/TeamAccessDialog.tsx
- src/features/team-access/useTeamMembers.ts
- src/features/team-access/teamAccess.css

New files (12):

- docs/architecture/phase-2-team-access-prototype.md
- prototype/index.html
- vite.prototype.config.mjs
- src/features/team-access/MemberAccessFields.tsx
- src/features/team-access/memberPresentation.ts
- src/features/team-access/useTeamMutation.ts
- src/infrastructure/tenant/prototypeTenantRepository.ts
- src/infrastructure/tenant/prototypeTenantRepository.test.ts
- src/prototypes/team-access/main.tsx
- src/prototypes/team-access/Prototype.tsx
- src/prototypes/team-access/seed.ts
- src/prototypes/team-access/prototype.css
