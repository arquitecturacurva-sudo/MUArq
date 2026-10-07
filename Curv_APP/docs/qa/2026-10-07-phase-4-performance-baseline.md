# Phase 4 performance baseline

**Base:** `origin/master` at `ec2b301727dbb32a106b04fd55c7ee81162da8a4`

**Date:** 2026-10-07

**Environment:** Windows local checkout, Node 24.18.0, Vite 8.0.7, clean production build.

Run `npm run measure:build` from a checkout without generated `dist`. The command rejects a checkout with `dist` because Tailwind can include generated markup in its scan and inflate CSS. It builds into ignored `node_modules/.cache/phase4-measure-dist`, empties that output first, and reports raw and Node `gzipSync` byte counts for module scripts, preloads, and styles linked by `index.html`. Fonts, images, runtime downloads, network latency, and browser parse time are outside this size metric.

| Metric | Raw bytes | Gzip bytes |
| --- | ---: | ---: |
| Entry script | 1,258,288 | 364,136 |
| All initial HTML-linked JS/CSS (entry, preloads, styles) | 1,782,465 | 518,618 |
| All emitted JS/CSS (19 files) | 2,391,068 | 707,963 |
| Main stylesheet | 61,126 | 11,667 |

The initial HTML includes a preload for the Team Access chunk even on Landing. This is a candidate for later investigation, not evidence that changing its loading improves user-visible timing.

## Browser timing protocol

The local build-size result is reproducible now. Start, project-open, and export times require a fixed browser/device/network profile and an authenticated disposable QA project; no timing values are claimed yet. Record the Preview deployment ID, Firebase project, browser version, CPU/network throttling, cache state, and exact project fixture. Use one device and the same settings before/after each proposed load change.

For each scenario, capture at least five cold and five warm runs, then report the median and slowest run with a browser performance trace or equivalent timestamp evidence:

1. Landing startup: navigation start to first contentful paint and visible usable hero.
2. Dashboard/project open: click on a QA project card to visible workspace after cloud hydration; record whether local cache was empty or warm.
3. Export: click each tool's export/print action to a visible print preview or completed download; confirm the resulting document separately in the nine-tool QA matrix.

| Scenario | Preview cold median | Preview warm median | Production short check | Evidence |
| --- | --- | --- | --- | --- |
| Landing startup | Pending | Pending | Pending | Browser trace / deployment ID |
| Project open and hydrate | Pending | Pending | Pending | Browser trace / QA project ID |
| Export per tool | Pending | Pending | Pending | Browser trace / verified document |

Do not optimize loading from bundle size alone. Compare the same artifact and method after a measured change; keep the full regression and authorization gates in place.
