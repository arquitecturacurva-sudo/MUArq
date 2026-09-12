# Project snapshot contract v1

`ProjectSnapshot` is the only payload allowed to move project tool state between local storage and Firestore.

## Envelope

| Field | Contract |
|---|---|
| `projectId` | Non-empty and equal to the target project on cloud writes |
| `clientId` | Non-empty and equal to the target tenant on cloud writes |
| `version` | Exactly `1`; other versions require an explicit migration |
| `revision` | Optional only for legacy/local snapshots; otherwise a non-negative safe integer |
| `updatedAt` | Parseable ISO timestamp |
| `baseMeta` | JSON-safe object |
| `tools` | JSON-safe object containing allow-listed project keys only |

Allowed key prefixes are `project.`, `app.tools.`, `calc.`, `matrix.`, `excl.`, `cron.`, `cot.`, `obra.`, `cronobra.`, `brief.`, `val.`, and `oc.`. Unknown keys are rejected on writes and removed from legacy reads. `project.snapshotUpdatedAt` is local synchronization metadata and is never cloud content.

The full envelope is capped at 8 MB, nesting at 32 levels, and 20,000 keys. Firestore applies tighter write limits: 900 KB per tool document, 200 KB for the parent/index document, and 8 MB for one commit. Values must survive JSON serialization; `undefined`, functions, symbols, non-finite numbers, and cycles are invalid.

## Firestore shape

The parent `clients/{clientId}/projects/{projectId}` stores project metadata, `syncRevision`, and a `snapshotIndex`. Each canonical tool has one `toolData/{toolId}` document. A tool document is accepted for hydration only when its version, tenant, project, tool id, revision, fingerprint, and key ownership all match the parent index. Reassembly must match the parent fingerprint before local data is replaced.

Legacy blob snapshots remain readable during the dual-write migration. Readers sanitize them into this contract; writers always enforce the current contract.

## Conflict rule

Cloud revision is authoritative only when local work is clean. Divergent content at the same revision is a conflict. A remote tombstone never silently deletes dirty local work. See [project sync recovery](../operations/project-sync-recovery.md).
