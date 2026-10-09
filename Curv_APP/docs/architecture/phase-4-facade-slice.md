# Phase 4: first runtime-consumer migration

Base: `origin/master` at `ec2b301`. This slice changes module ownership and
imports only; no tool state, localStorage key, ProjectSnapshot shape, Firebase
rule or document markup changes.

The print portal now lives in `features/printing/openPrint.ts`; help content,
the InfoBubble component and onboarding steps live under `features/help`.
Visual tool icons live in `features/ui`, and the React tool registry lives in
`composition/toolRegistry.tsx`. `runtime.tsx` continues to reexport every
historical symbol while App and the first layout/UI consumers import the new
owners directly.

The runtime facade shrinks from 314 to about 99 lines. A TypeScript AST
comparison against the base found exactly the same 239 explicit exports, with
no removed or added names. Thirteen production files still import the facade;
move those in later small slices, then review facade deletion separately.

Local browser QA opened the fictional change-order fixture and verified that
the print portal displays the document and closes back to the form. This is
not a substitute for authenticated nine-tool Preview and production acceptance.
The clean production build keeps the initial CSS at 61.09 kB, matching a clean
`master` build. The initial JavaScript remains 1,258.28 kB minified (367.05 kB
gzip here versus 366.89 kB on `master`); this slice does not claim a
performance improvement. A repeated build over an existing `dist` directory
temporarily generated extra Tailwind CSS; removing that generated output before
both comparison builds restored the same 61.09 kB result.
