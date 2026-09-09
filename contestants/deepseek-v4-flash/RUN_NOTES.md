# CR-BENCH-01 — Run Notes

Model: deepseek-v4-flash
Exact variant: UNAVAILABLE (Ollama dashboard model identifier observed: `deepseek-v4-flash:0731`; exact harness identifier UNAVAILABLE)
Date: 2026-09-09
Start time: UNAVAILABLE
End time: UNAVAILABLE
Wall-clock: UNAVAILABLE
Harness/environment: Ollama Cloud (per operator dashboard evidence); further harness/environment details UNAVAILABLE

## Target

Repository: stark-ai-workbench-nextjs-frontend-v1
Pinned source commit: 466083f2b415d9faeb362eb5e48f6e259a42d840

## Execution

Requests: 76 shown for deepseek-v4-flash on the final Ollama dashboard (operator-observed)
Input tokens: UNAVAILABLE
Output tokens: UNAVAILABLE
Reported/API cost: UNAVAILABLE
Retries: UNAVAILABLE
Harness failures: UNAVAILABLE (none reported by contestant or observed by operator)

### Operator Usage Evidence (Ollama Cloud dashboard, sequential operator readings)

| Reading | Immediately before DeepSeek V4 Flash (following completion of DeepSeek V4 Pro) | Immediately after DeepSeek V4 Flash | Observed increase |
|---|---|---|---|
| Session usage | 20.2% | 36.0% | +15.8 percentage points |
| Weekly usage | 27.9% | 30.7% | +2.8 percentage points |
| deepseek-v4-flash requests shown (final) | — | 76 | — |

These measurements represent movement of Ollama's displayed operational usage meters. They are NOT token counts, dollar cost, or benchmark quality scores, and have not been converted into any of those values. Economic and quality evaluation occurs later.

Operator screenshots: repository storage location not supplied at closeout; no path recorded.

Use UNAVAILABLE where metrics cannot be obtained.

## Verification Performed

As reported by the contestant in its report (sections "Review Scope & Method", "Verification Evidence", and "Operator Notes"):

- `npx tsc --noEmit` — passes (no type errors)
- `npx jest` — 10 suites failed, 26 passed (36 total); 38 tests failed, 225 passed (263 total)
- Middleware-active check — inspected `src/proxy.ts`, `.next/server/middleware.js`, and the `PROXY_FILENAME` constant in the installed Next.js; contestant concluded `proxy.ts` is the active Next 16 middleware
- Manifest contents check — read `config/agents.manifest.json`
- Failing-test example inspection — `src/__tests__/chat/ChatPageContent.test.tsx:77`
- Static analysis / source inspection of: all route handlers under `src/app/api/`; all server actions; Supabase client factories and role helpers; database schema SQL; agent manifest and loader; chat / Mission Control UI, services, stores, and mocks; middleware (`src/proxy.ts`)

Contestant stated it did not modify any file inside `target/`.

These results are recorded as reported by the contestant and were not reinterpreted at closeout.

## Operator Interventions

1. Benchmark launch instruction supplied by Tony (verbatim):

   > Read and follow:
   >
   > contestants/deepseek-v4-flash/REVIEW_PROMPT.md
   >
   > Begin the review.

   Classification: MECHANICAL

No additional operator intervention occurred during the review.

If intervention occurs, preserve it verbatim or as faithfully as technically possible and classify it as:

- MECHANICAL
- SUBSTANTIVE

## Execution Limitations

Contestant-reported:

- No `.env.local` credentials present, so live-mode behavior against real Supabase / GCS / ADK backends could not be exercised end-to-end; findings about live-mode behavior were verified statically and, where possible, against the unit test suite.
- Contestant stated this did not prevent review of any part of the system.

No other limitations were reported by the contestant or observed by the operator.

## Target State Observation at Closeout

All 357 frozen manifest entries verified OK. No frozen target file was modified.

On-disk state of `target/stark-ai-workbench-nextjs-frontend-v1/` at closeout: 40205 regular files (357 frozen + 39848 gitignored generated artifacts: `node_modules/` 39199 files, `.next/` 647 files, plus next-env.d.ts tsconfig.tsbuildinfo ). These artifacts pre-date this run (`node_modules/` from Candidate #1; `.next/` last modified during Candidate #4) and were unchanged in count during this run. The contestant's reported middleware-active check read `.next/server/middleware.js` from that pre-existing build output. All generated artifacts are excluded by the target's own `.gitignore` and are not part of the frozen manifest. Recorded for equal-track and run-independence purposes. The scribe did not modify target/.

## Completion

Status: COMPLETE
Original review preserved: YES
Original review SHA-256: a180156b580bf2420d1962998ada3511b345c56fe910286f7f3005862b9476c1
Original review size: 23155 bytes, 314 lines
Closeout performed: 2026-09-09 22:12:49 +06
