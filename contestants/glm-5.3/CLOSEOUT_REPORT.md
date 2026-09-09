# CR-BENCH-01 — Candidate #3 Closeout Report

Benchmark bookkeeping only. This document contains no evaluation, grading, or adjudication.

| Field | Value |
|---|---|
| Candidate | glm-5.3 |
| Run order position | 3 of 6 |
| Run date | 2026-09-09 |
| Closeout performed | 2026-09-09 18:50:10 +06 |
| Run status | COMPLETE |
| Original review preserved | YES |
| Report path | `contestants/glm-5.3/REVIEW_REPORT.md` |
| Report SHA-256 | `844caff1256d1df1ff47cfca76b32a94a3ee9c190b3fd9e43fec102146d9f6c5` |
| Report size | 29522 bytes, 239 lines |
| Target integrity | PASS — `sha256sum -c TARGET_MANIFEST.sha256`: all 357 entries OK |
| Frozen target files (manifest) | 357 — all verified OK |
| Regular files on disk under target at closeout | 40225 (357 frozen + 39868 gitignored generated artifacts, see observation below) |

## Verification performed (as reported by contestant)

- `npx jest` — 36 suites (26 passed, 10 failed); 263 tests (225 passed, 38 failed)
- `npx tsc --noEmit` — clean / exit 0
- `npm run lint` — failed because the configured `next lint` command is not valid under the installed Next.js version
- Targeted individual Jest suite execution to investigate failure modes
- `node_modules/zustand/middleware.js` inspection
- Static/source inspection: routes, actions, stores, services, schema SQL, configuration, targeted cross-reference/dead-code searches

Contestant explicitly did NOT run `next build`, stating it believed doing so would write `.next/` artifacts into the frozen target. Recorded as contestant-declared execution judgment, not an operator ruling.

Recorded as reported. Not reinterpreted at closeout.

## Requests and usage (operator-observed Ollama Cloud dashboard)

| Metric | Value |
|---|---|
| glm-5.3 requests shown after run | 235 |
| glm-5.3 requests shown in prior screenshot | 134 |
| Observed request-count delta during interval | +101 |
| Session usage, before → after | 15.7% → 42.2% |
| Observed session-usage delta | +26.5 percentage points |
| Weekly usage, before → after | 9.3% → 14.0% |
| Observed weekly-usage delta | +4.7 percentage points |

The usage percentages are dashboard observations, not token counts. They have not been converted into dollar cost and are not claimed to be exact token consumption. The "before" readings are the values observed immediately before / following the preceding MiniMax run.

| Metric | Value |
|---|---|
| Exact model variant | UNAVAILABLE |
| Start / end time | UNAVAILABLE |
| Wall-clock | UNAVAILABLE |
| Harness/environment | UNAVAILABLE |
| Input tokens | UNAVAILABLE |
| Output tokens | UNAVAILABLE |
| Reported/API cost | UNAVAILABLE |
| Retries | UNAVAILABLE |
| Harness failures | UNAVAILABLE |

Operator screenshots: repository storage location not supplied at closeout; no path recorded.

## Operator intervention

One intervention: the benchmark launch instruction ("Read and follow: contestants/glm-5.3/REVIEW_PROMPT.md. Begin the review.").

Classification: MECHANICAL

No additional operator intervention occurred during the review.

## Execution limitations (contestant-declared)

- no live ADK verification
- no live Supabase verification
- no live GCS verification
- `next build` not run
- Playwright E2E not exercised
- live-mode findings based on static/code/schema reasoning where applicable

No other limitations reported or observed.

## Target State Observation at Closeout

All 357 frozen manifest entries verified OK. No frozen target file was modified.

Generated artifacts left by Candidate #1's verification commands (`node_modules/`, `.next/`, `tsconfig.tsbuildinfo`, `next-env.d.ts`; 39868 files, all excluded by the target's own `.gitignore`) were present on disk when this run began and remain at closeout. They have not been cleared between runs. Recorded for equal-track and run-independence purposes. The scribe did not modify target/.

## Confirmations

- `EVAL_ENTRY.md` remains untouched: contains only `# Pending — evaluation occurs after original evidence preservation`
- No evaluation, grading, validation, challenge, or comparison of the contestant's findings occurred during closeout.
- The contestant report was hashed but not edited, cleaned up, summarized, or reproduced here.
- No frozen benchmark instrument file changed (rules, scorecard, brief, prompt template, run order, improvement journal).
- `contestants/kimi-k2.7-code/`, `contestants/minimax-3/`, and the three future contestant directories were not modified.
- This contestant's report was not exposed to any other contestant.
- `target/` was not modified and was not inspected for review purposes.
- No git write operation was performed by the scribe.

## Files modified/created at closeout

- Modified: `contestants/glm-5.3/RUN_NOTES.md`
- Created: `contestants/glm-5.3/CLOSEOUT_REPORT.md`
