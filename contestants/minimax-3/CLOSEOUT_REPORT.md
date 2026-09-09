# CR-BENCH-01 — Candidate #2 Closeout Report

Benchmark bookkeeping only. This document contains no evaluation, grading, or adjudication.

| Field | Value |
|---|---|
| Candidate | minimax-3 |
| Run order position | 2 of 6 |
| Run date | 2026-09-09 |
| Closeout performed | 2026-09-09 18:14:52 +06 |
| Run status | COMPLETE |
| Original review preserved | YES |
| Report path | `contestants/minimax-3/REVIEW_REPORT.md` |
| Report SHA-256 | `ea3b896425e9f302e1c1d154b7110ba8057f5f88ea143795c30dc31b2c4b8a1e` |
| Report size | 38848 bytes, 898 lines |
| Target integrity | PASS — `sha256sum -c TARGET_MANIFEST.sha256`: all 357 entries OK |
| Frozen target files (manifest) | 357 — all verified OK |
| Regular files on disk under target at closeout | 40225 (357 frozen + 39868 gitignored generated artifacts, see observation below) |

## Verification commands reported by contestant

- Repository/source inspection across the areas described in its report.
- `npm run test` — 10 failed suites, 26 passed suites, 36 total; 38 failed tests, 225 passed tests, 263 total; runtime reported 11.356 seconds

Contestant explicitly reported NOT running: `npm run build`, `tsc --noEmit`, Playwright E2E, `npm run lint`.

Recorded as reported. Not reinterpreted at closeout.

## Requests and usage

| Metric | Value |
|---|---|
| Requests | 78 (operator-observed) |
| Exact model variant | UNAVAILABLE |
| Start / end time | UNAVAILABLE |
| Wall-clock | UNAVAILABLE |
| Harness/environment | UNAVAILABLE |
| Input tokens | UNAVAILABLE |
| Output tokens | UNAVAILABLE |
| Reported/API cost | UNAVAILABLE |
| Retries | UNAVAILABLE |
| Harness failures | UNAVAILABLE |

OPERATOR-OBSERVED DASHBOARD VALUES (Ollama Cloud usage dashboard, read immediately after the run):

| Reading | Value |
|---|---|
| Session usage | 15.7% used |
| Weekly usage | 9.3% used |

These dashboard percentages are cumulative account/session observations at the time of reading. They are NOT attributed solely to minimax-3 and do not represent isolated per-model consumption. They have not been converted into tokens, dollars, or per-model usage.

## Operator intervention

One intervention: the benchmark launch instruction ("Read and follow: contestants/minimax-3/REVIEW_PROMPT.md. Begin the review.").

Classification: MECHANICAL

No additional operator intervention occurred during the review.

## Execution limitations

Contestant reported that it did not verify:

- deployed Supabase RLS against a live project,
- real ADK bundle behavior,
- build/typecheck,
- Playwright E2E,
- lint,
- most of agent_docs beyond project-level CHANGELOG/RECOVERY context.

No other limitations reported or observed.

## Target State Observation at Closeout

All 357 frozen manifest entries verified OK. No frozen target file was modified.

Generated artifacts left by Candidate #1's verification commands (`node_modules/`, `.next/`, `tsconfig.tsbuildinfo`, `next-env.d.ts`; 39868 files, all excluded by the target's own `.gitignore`) were present on disk when this run began and remain at closeout. They were not cleared between runs. Recorded for equal-track and run-independence purposes. The scribe did not modify target/.

## Confirmations

- `EVAL_ENTRY.md` remains untouched: contains only `# Pending — evaluation occurs after original evidence preservation`
- No evaluation, grading, validation, challenge, or comparison of the contestant's findings occurred during closeout.
- The contestant report was hashed but not edited, cleaned up, summarized, or reproduced here.
- No frozen benchmark instrument file changed (rules, scorecard, brief, prompt template, run order, improvement journal).
- `contestants/kimi-k2.7-code/` and all four future contestant directories were not modified.
- This contestant's report was not exposed to any other contestant.
- `target/` was not modified and was not inspected for review purposes.
- No git write operation was performed by the scribe.

## Files modified/created at closeout

- Modified: `contestants/minimax-3/RUN_NOTES.md`
- Created: `contestants/minimax-3/CLOSEOUT_REPORT.md`
