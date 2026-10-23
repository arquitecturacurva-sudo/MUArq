# Document heading contrast QA — 2026-10-23

The quotation screenshot showed black column labels against a dark header. Legacy branding CSS detected the header through substrings of inline styles; browser serialization inserts spaces and converts hex backgrounds to rgb(), so those selectors did not match the live or cloned DOM.

Dark document bands now have an explicit `data-document-band="dark"` marker. Shared document branding CSS keeps those bands dark and their labels white, regardless of the studio accent or paper color. Applied to quotation, valuation, fees totals, deliverables, exclusions, stage schedules, architectural program (client and internal), and change order sections. The construction schedule has no dark document band.

Verification on Chromium / Electron 37:

- Rendered all nine tools for four accents (`#000000`, `#FFFFFF`, `#315A8C`, `#D6B368`) on both light and dark paper.
- Checked computed text/background contrast of actual labels in both the live React document and the cloned print portal: 752 assertions passed at a minimum ratio of 4.5:1.
- Generated print PDFs for every tool/theme combination and a standalone quotation export with a black studio accent.
- Visually reviewed the black-accent quotation preview: all seven column labels are white and legible, with body text, amounts, layout and footer preserved.
- `npm run build`: pass.
- `npm run test -- --exclude '**/tmp/**'`: 73 suites / 491 tests pass.
- ESLint on all modified TSX files: pass.

No production deployment or physical printer test was performed.
