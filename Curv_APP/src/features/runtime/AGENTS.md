# Frozen compatibility facade

runtime.tsx is a TEMPORARY compatibility facade. Do not add new features,
new domain contracts or new UI primitives to it. Team Access must never be
implemented here or import this facade.

Preserve every existing export, localStorage key, migration, ProjectSnapshot
contract and document export behavior. Only approved incremental extractions
or targeted bug fixes may edit this file. Document temporary reexports.

Phase 1: extract shared UI gradually into components/ui and features/ui/kit.
Phase 2: separate pure domain, application ports and infrastructure.
Phase 3 tool order: fees, deliverables, exclusions, stage schedule, quotation,
construction schedule, architectural program, valuation, change order.

See docs/architecture/phase-0-team-access.md for dependency boundaries.
