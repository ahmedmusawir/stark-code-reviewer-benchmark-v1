# CR-BENCH-01 — Candidate #6 Closeout Report

Benchmark bookkeeping only. This document contains no evaluation, grading, or adjudication.

| Field | Value |
|---|---|
| Candidate | deepseek-v4-flash |
| Dashboard identifier observed | `deepseek-v4-flash:0731` |
| Run order position | 6 of 6 |
| Run date | 2026-09-09 |
| Closeout performed | 2026-09-09 22:12:49 +06 |
| Final run status | COMPLETE |
| Original review preserved | YES |
| Report path | `contestants/deepseek-v4-flash/REVIEW_REPORT.md` |
| Report SHA-256 | `a180156b580bf2420d1962998ada3511b345c56fe910286f7f3005862b9476c1` |
| Report size | 23155 bytes, 314 lines |
| Target integrity | PASS — `sha256sum -c TARGET_MANIFEST.sha256`: all 357 entries OK |
| Frozen target files (manifest) | 357 — all verified OK |
| Regular files on disk under target at closeout | 40205 (357 frozen + 39848 gitignored generated artifacts pre-dating this run) |
| Final request count | 76 |

## Verification reported by contestant

- `npx tsc --noEmit` — passes (no type errors)
- `npx jest` — 10 suites failed, 26 passed (36 total); 38 tests failed, 225 passed (263 total)
- Middleware-active check — `src/proxy.ts`, `.next/server/middleware.js`, `PROXY_FILENAME` in installed Next.js constants; contestant concluded `proxy.ts` is the active Next 16 middleware
- Manifest contents check — `config/agents.manifest.json`
- Failing-test example inspection — `src/__tests__/chat/ChatPageContent.test.tsx:77`
- Static analysis / source inspection of API route handlers, server actions, Supabase client factories and role helpers, schema SQL, agent manifest and loader, chat / Mission Control UI, services, stores, mocks, and middleware

Recorded as reported. Not reinterpreted at closeout.

## Execution limitations

Contestant-reported:

- No `.env.local` credentials present; live-mode behavior against real Supabase / GCS / ADK backends not exercised end-to-end; live-mode findings verified statically and, where possible, against the unit test suite.
- Contestant stated this did not prevent review of any part of the system.

No other limitations reported or observed.

## Usage evidence (operator-observed Ollama Cloud dashboard)

| Metric | Value |
|---|---|
| Pre-run session usage | 20.2% |
| Post-run session usage | 36.0% |
| Observed session increase | 15.8 percentage points |
| Pre-run weekly usage | 27.9% |
| Post-run weekly usage | 30.7% |
| Observed weekly increase | 2.8 percentage points |
| Final requests shown | 76 |

Ollama usage percentages are operational quota measurements. They are not token counts, dollar costs, or benchmark quality scores.

| Metric | Value |
|---|---|
| Exact harness identifier | UNAVAILABLE |
| Start / end time | UNAVAILABLE |
| Wall-clock | UNAVAILABLE |
| Input tokens | UNAVAILABLE |
| Output tokens | UNAVAILABLE |
| Reported/API cost | UNAVAILABLE |
| Retries | UNAVAILABLE |
| Harness failures | UNAVAILABLE (none reported or observed) |

Operator screenshots: repository storage location not supplied at closeout; no path recorded.

## Operator intervention

One intervention: the benchmark launch instruction ("Read and follow: contestants/deepseek-v4-flash/REVIEW_PROMPT.md. Begin the review.").

Classification: MECHANICAL

No additional operator intervention occurred during the review.

## Confirmations

- `EVAL_ENTRY.md` remains untouched: contains only `# Pending — evaluation occurs after original evidence preservation`
- No evaluation, grading, validation, challenge, or comparison of the contestant's findings occurred during closeout.
- The contestant report was hashed but not edited, cleaned up, summarized, or reproduced here. Only its scope/method, verification-evidence, and operator-notes sections were read, to transcribe reported verification and limitations.
- No frozen benchmark instrument file changed (rules, scorecard, brief, prompt template, run order, improvement journal).
- `contestants/kimi-k2.7-code/`, `contestants/minimax-3/`, `contestants/glm-5.3/`, `contestants/glm-5.3-flash/`, and `contestants/deepseek-v4-pro/` were not modified.
- Astra reference artifacts under `reference/astra/` were not modified.
- This contestant's report was not exposed to any other contestant.
- `target/` was not modified and was not inspected for review purposes.
- No git write operation was performed by the scribe.

## Files modified/created at closeout

- Modified: `contestants/deepseek-v4-flash/RUN_NOTES.md`
- Created: `contestants/deepseek-v4-flash/CLOSEOUT_REPORT.md`
