# CR-BENCH-01 — Candidate #1 Closeout Report

Benchmark bookkeeping only. This document contains no evaluation, grading, or adjudication.

| Field | Value |
|---|---|
| Candidate | kimi-k2.7-code |
| Run order position | 1 of 6 |
| Run date | 2026-09-09 |
| Closeout performed | 2026-09-09 17:49:58 +06 |
| Run status | COMPLETE |
| Original review preserved | YES |
| Report path | `contestants/kimi-k2.7-code/REVIEW_REPORT.md` |
| Report SHA-256 | `3104c5e20de1ae6313564ba2c79681916f3eeaac24add4ccd59d6420468cc2d7` |
| Report size | 20561 bytes, 331 lines |
| Target integrity | PASS — `sha256sum -c TARGET_MANIFEST.sha256`: all 357 entries OK |
| Frozen target files (manifest) | 357 — all verified OK |
| Regular files on disk under target at closeout | 40225 (357 frozen + 39868 gitignored generated artifacts, see observation below) |

## Verification commands reported by contestant

- `npm ci` — succeeded
- `npx tsc --noEmit` — succeeded / no TypeScript errors
- `npm test` — 38 failures / 263 tests; 10 of 36 suites failed
- `npm run build` without environment variables — failed during static prerender
- `npm run build` with dummy environment variables — succeeded
- `npm run lint` — did not successfully run

Contestant reported `/tmp/jest-output.log` as containing the full Jest output.

Recorded as reported. Not reinterpreted at closeout.

## Operator intervention

One intervention: the benchmark launch instruction ("Read and follow: contestants/kimi-k2.7-code/REVIEW_PROMPT.md. Begin the review.").

Classification: MECHANICAL

No other operator interventions occurred.

## Recorded usage / cost information

| Metric | Value |
|---|---|
| Exact model variant | UNAVAILABLE |
| Start / end time | UNAVAILABLE |
| Wall-clock | UNAVAILABLE |
| Harness/environment | UNAVAILABLE |
| Requests | UNAVAILABLE |
| Input tokens | UNAVAILABLE |
| Output tokens | UNAVAILABLE |
| Reported/API cost | UNAVAILABLE |
| Retries | UNAVAILABLE |
| Harness failures | UNAVAILABLE |
| Operator-observed harness usage | approximately 10% |

The operator-observed usage figure is recorded as stated and has not been converted into any other metric.

## Execution limitations

- Contestant reported that lint did not successfully execute because `next lint` was mis-invoked.

No other limitations reported or observed.

## Target State Observation at Closeout

All 357 frozen manifest entries verified OK. No frozen target file was modified.

However, the contestant's reported verification commands (`npm ci`, `npm run build`, `npx tsc --noEmit`) left build and dependency artifacts on disk inside `target/stark-ai-workbench-nextjs-frontend-v1/`:

- `node_modules/` — 39199 regular files
- `.next/` — 667 regular files
- `tsconfig.tsbuildinfo`
- `next-env.d.ts`

All of these are excluded by the target's own `.gitignore` and are not tracked by git. They are not part of the frozen manifest. Regular files on disk under the target at closeout: 40225 (357 frozen + 39868 generated).

The scribe did not remove them (target/ is not to be modified by the scribe). Whether to clear them before Candidate #2 begins, so that each contestant starts from the same on-disk condition, is an operator decision. Recorded here for equal-track and run-independence purposes.

## Confirmations

- `EVAL_ENTRY.md` remains untouched: contains only `# Pending — evaluation occurs after original evidence preservation`
- No evaluation, grading, validation, challenge, or comparison of the contestant's findings occurred during closeout.
- The contestant report was hashed but not edited, cleaned up, summarized, or reproduced here.
- No frozen benchmark instrument file changed (rules, scorecard, brief, prompt template, run order, improvement journal).
- No other contestant directory was altered or exposed to this contestant's work.
- `target/` was not modified and was not inspected for review purposes.
- No git write operation was performed by the scribe.

## Files modified/created at closeout

- Modified: `contestants/kimi-k2.7-code/RUN_NOTES.md`
- Created: `contestants/kimi-k2.7-code/CLOSEOUT_REPORT.md`
