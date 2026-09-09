# CR-BENCH-01 — Run Notes

Model: minimax-3
Exact variant: UNAVAILABLE
Date: 2026-09-09
Start time: UNAVAILABLE
End time: UNAVAILABLE
Wall-clock: UNAVAILABLE
Harness/environment: UNAVAILABLE (not supplied by operator at closeout; operator referenced the Ollama Cloud usage dashboard when reporting usage)

## Target

Repository: stark-ai-workbench-nextjs-frontend-v1
Pinned source commit: 466083f2b415d9faeb362eb5e48f6e259a42d840

## Execution

Requests: 78 (operator-observed)
Input tokens: UNAVAILABLE
Output tokens: UNAVAILABLE
Reported/API cost: UNAVAILABLE
Retries: UNAVAILABLE
Harness failures: UNAVAILABLE

OPERATOR-OBSERVED DASHBOARD VALUES (Ollama Cloud usage dashboard, read by Tony immediately after the run):

- Session usage: 15.7% used
- Weekly usage: 9.3% used

These dashboard percentages are cumulative account/session observations at the time of reading. They are NOT attributed solely to minimax-3 and do not represent isolated per-model consumption. They have not been converted into tokens, dollars, or per-model usage.

Use UNAVAILABLE where metrics cannot be obtained.

## Verification Performed

As reported by the contestant:

- Repository/source inspection across the areas described in its report.
- `npm run test`
  - Suites: 10 failed, 26 passed, 36 total
  - Tests: 38 failed, 225 passed, 263 total
  - Runtime reported: 11.356 seconds

Contestant explicitly reported NOT running:

- `npm run build`
- `tsc --noEmit`
- Playwright E2E
- `npm run lint`

These results are recorded as reported by the contestant and were not reinterpreted at closeout.

## Operator Interventions

1. Benchmark launch instruction supplied by Tony (verbatim):

   > Read and follow:
   >
   > contestants/minimax-3/REVIEW_PROMPT.md
   >
   > Begin the review.

   Classification: MECHANICAL

No additional operator intervention occurred during the review.

If intervention occurs, preserve it verbatim or as faithfully as technically possible and classify it as:

- MECHANICAL
- SUBSTANTIVE

## Execution Limitations

Contestant reported that it did not verify:

- deployed Supabase RLS against a live project,
- real ADK bundle behavior,
- build/typecheck,
- Playwright E2E,
- lint,
- most of agent_docs beyond project-level CHANGELOG/RECOVERY context.

No other limitations were reported by the contestant or observed by the operator.

## Target State Observation at Closeout

All 357 frozen manifest entries verified OK. No frozen target file was modified.

On-disk state of `target/stark-ai-workbench-nextjs-frontend-v1/` at closeout: 40225 regular files (357 frozen + 39868 gitignored generated artifacts: `node_modules/` 39199 files, `.next/` 667 files, plus next-env.d.ts tsconfig.tsbuildinfo ). These artifacts were present before this run began, having been left by Candidate #1's verification commands, and were not cleared between runs. Recorded for equal-track and run-independence purposes. The scribe did not modify target/.

## Completion

Status: COMPLETE
Original review preserved: YES
Original review SHA-256: ea3b896425e9f302e1c1d154b7110ba8057f5f88ea143795c30dc31b2c4b8a1e
Original review size: 38848 bytes, 898 lines
Closeout performed: 2026-09-09 18:14:52 +06
