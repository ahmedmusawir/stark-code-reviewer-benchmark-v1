# CR-BENCH-01 — Run Notes

Model: kimi-k2.7-code
Exact variant: UNAVAILABLE
Date: 2026-09-09
Start time: UNAVAILABLE
End time: UNAVAILABLE
Wall-clock: UNAVAILABLE
Harness/environment: UNAVAILABLE (not supplied by operator at closeout)

## Target

Repository: stark-ai-workbench-nextjs-frontend-v1
Pinned source commit: 466083f2b415d9faeb362eb5e48f6e259a42d840

## Execution

Requests: UNAVAILABLE
Input tokens: UNAVAILABLE
Output tokens: UNAVAILABLE
Reported/API cost: UNAVAILABLE
Retries: UNAVAILABLE
Harness failures: UNAVAILABLE

Operator-observed harness usage: approximately 10%

(Operator observation of the usage allowance visible in the harness. Not converted to tokens, dollars, or any other metric.)

Use UNAVAILABLE where metrics cannot be obtained.

## Verification Performed

As reported by the contestant:

- `npm ci` — succeeded
- `npx tsc --noEmit` — succeeded / no TypeScript errors
- `npm test` — 38 failures / 263 tests; 10 of 36 suites failed
- `npm run build` without environment variables — failed during static prerender
- `npm run build` with dummy environment variables — succeeded
- `npm run lint` — did not successfully run

Contestant reported that `/tmp/jest-output.log` contains the full Jest output.

These results are recorded as reported by the contestant and were not reinterpreted at closeout.

## Operator Interventions

1. Benchmark launch instruction supplied by Tony (verbatim):

   > Read and follow:
   >
   > contestants/kimi-k2.7-code/REVIEW_PROMPT.md
   >
   > Begin the review.

   Classification: MECHANICAL

No other operator interventions occurred.

If intervention occurs, preserve it verbatim or as faithfully as technically possible and classify it as:

- MECHANICAL
- SUBSTANTIVE

## Execution Limitations

- Contestant reported that lint did not successfully execute because `next lint` was mis-invoked.

No other limitations were reported by the contestant or observed by the operator.

## Target State Observation at Closeout

All 357 frozen manifest entries verified OK. No frozen target file was modified.

However, the contestant's reported verification commands (`npm ci`, `npm run build`, `npx tsc --noEmit`) left build and dependency artifacts on disk inside `target/stark-ai-workbench-nextjs-frontend-v1/`:

- `node_modules/` — 39199 regular files
- `.next/` — 667 regular files
- `tsconfig.tsbuildinfo`
- `next-env.d.ts`

All of these are excluded by the target's own `.gitignore` and are not tracked by git. They are not part of the frozen manifest. Regular files on disk under the target at closeout: 40225 (357 frozen + 39868 generated).

The scribe did not remove them (target/ is not to be modified by the scribe). Whether to clear them before Candidate #2 begins, so that each contestant starts from the same on-disk condition, is an operator decision. Recorded here for equal-track and run-independence purposes.

## Completion

Status: COMPLETE
Original review preserved: YES
Original review SHA-256: 3104c5e20de1ae6313564ba2c79681916f3eeaac24add4ccd59d6420468cc2d7
Original review size: 20561 bytes, 331 lines
Closeout performed: 2026-09-09 17:49:58 +06
