# Project sync recovery

## User-visible recovery

| Condition | Safe action |
|---|---|
| Remote revision is newer and local state is clean | Hydrate the cloud snapshot after identity, schema, tool-document, and fingerprint validation |
| Same revision, different content | Keep local data and show a persistent revision conflict |
| Remote tombstone with clean local state | Remove the local project after reconciliation |
| Remote tombstone with dirty local state | Keep local data and show a persistent `remote-deleted` conflict |
| Transient network/service failure | Keep local dirty state and retry with bounded backoff |
| Schema, size, or integrity failure | Stop automatic writes/hydration, keep local data, and expose the error in diagnostics |

“Usar nube” replaces the original local scope only after the latest remote entry is read and the local revision has not changed during confirmation. “Conservar ambas” snapshots the latest local state under a new project id, marks that copy dirty for a new cloud write, and then applies the remote state to the original project.

## Operator procedure

1. Ask the user to export local diagnostics before clearing browser data. Capture the project id, operation, failure kind/code, app commit, and approximate time. Do not collect project contents in logs.
2. Find the matching structured API request by `X-Curv-Request-Id` for billing failures. For sync, inspect the parent project revision/index and only the nine `toolData` documents for that project.
3. Compare `syncRevision`, tool document revisions, identities, and fingerprints. Never edit a project in place to force fingerprints to match.
4. If cloud data is corrupt, preserve the affected documents and restore a known-good export under a new project id. Tombstone the corrupt original only after the recovered copy is verified.
5. If the local copy is the only good copy, use “Conservar ambas”; verify the recovered project opens before resolving or deleting the original.
6. Record the deployment commit and recovery outcome in the dated QA matrix.

Clearing local storage, deleting a tombstone, lowering a revision, or editing fingerprints manually are not recovery steps because each can resurrect stale data or hide the source of corruption.
