# CR-BENCH-01 — Candidate #5 Closeout Report

Benchmark bookkeeping only. This document contains no evaluation, grading, or adjudication.

| Field | Value |
|---|---|
| Candidate | deepseek-v4-pro |
| Run order position | 5 of 6 |
| Run date | 2026-09-09 |
| Closeout performed | 2026-09-09 21:14:12 +06 |
| Final run status | COMPLETE (after one session-quota interruption and resume of the same session) |
| Original review preserved | YES |
| Report path | `contestants/deepseek-v4-pro/REVIEW_REPORT.md` |
| Report SHA-256 | `b4005b5acc7f96337f0f80ad6988e768fbb04a3df63c75543b639914e143ecc5` |
| Report size | 16971 bytes, 211 lines |
| Target integrity | PASS — `sha256sum -c TARGET_MANIFEST.sha256`: all 357 entries OK |
| Frozen target files (manifest) | 357 — all verified OK |
| Regular files on disk under target at closeout | 40205 (357 frozen + 39848 gitignored generated artifacts pre-dating this run) |
| Harness model identifier observed at launch | `deepseek-v4-pro:cloud` |
| Ollama dashboard identifier observed | `deepseek-v4-pro:0813` |

## Verification performed (as reported by contestant)

- `npx tsc --noEmit` — clean / exit 0
- `npx jest` — 38 failed, 225 passed; 10 failing suites
- Targeted manifest test — executed; failed on roster assertions
- Targeted agent-run test — executed; failed with old jarvis_agent assumptions
- Dead-code/reference scans — performed
- Installed Next.js internals inspected to verify middleware/proxy convention — contestant concluded `proxy.ts` is valid under Next 16 and did not manufacture a finding from it
- Static inspection of Supabase, auth, GCS, ADK, server actions, manifest, Mission Control, mocks, tests, and related code paths

Recorded as reported. Not reinterpreted at closeout.

## Two-segment quota history (operator-observed Ollama Cloud dashboard)

### Segment 1

| Reading | Value |
|---|---|
| Session usage before interval (post-GLM-5.3-Flash) | 45.4% |
| Session usage at cap | 100.0% |
| Observed Segment 1 session delta | ≥ +54.6 percentage points (LOWER BOUND; meter hit its 100% ceiling) |
| Weekly usage before → at interruption | 14.5% → 24.3% |
| Observed Segment 1 weekly delta | +9.8 percentage points |
| Requests shown at interruption | 44 |

### Interruption

- Harness error: HTTP 429 — session usage limit reached
- Automatic retries observed
- Contestant had NOT declared completion at interruption
- Run state became: INTERRUPTED — RESUMABLE (interim record made 2026-09-09 19:41:16 +06)

### Recovery

- Displayed reset estimate: approximately 1 hour (UI displayed approximately "Resets in 1 hour")
- Operator-observed usable recovery time: approximately 1.5 hours
- The discrepancy is preserved as observed, without interpretation
- The same contestant session was resumed; the benchmark was not restarted
- Manual continuation instruction: not confirmed as issued at closeout; not recorded as issued

### Segment 2 / completion

| Reading | Value |
|---|---|
| Session usage after completion | 20.2% |
| Weekly usage after completion | 27.9% |
| Final DeepSeek V4 Pro requests shown | 58 |
| Additional requests after interruption snapshot | 14 (58 − 44) |

### Whole-run weekly evidence

| Reading | Value |
|---|---|
| Weekly usage, before run → after completion | 14.5% → 27.9% |
| Observed total weekly delta | +13.4 percentage points |

### Session consumption across segments

| Item | Value |
|---|---|
| Segment 1 observed lower-bound delta | ≥ +54.6 percentage points |
| Session reading at resume, before Segment 2 | UNAVAILABLE (not observed) |
| Segment 2 final reading | 20.2% |
| Combined session demand | Cannot be calculated exactly: the session quota reset during the run and the post-reset baseline reading is not in evidence. The arithmetic sum 54.6 + 20.2 = 74.8 percentage points is preserved only for transparent later calculation under a reset-to-0% baseline assumption; it is not recorded as an established figure. |

### Provider-displayed operational metadata

The operator's final screenshot displayed an Ollama notice stating that most session usage was from `deepseek-v4-pro:0813`, characterized as "an extra high usage model", and suggesting glm-5.3-flash or glm-5.3 as lower-usage alternatives. Preserved as PROVIDER-DISPLAYED OPERATIONAL METADATA only. Not benchmark evaluation; not used to grade the contestant; no review-quality inference drawn.

### Interpretation boundary

Dashboard percentages are operational quota measurements. They are not token counts and are not dollar cost. Ollama session usage, weekly usage, request count, token counts, API cost, wall-clock time, and quota interruption/recovery time are kept as separate metrics. No API cost is calculated. Economic evaluation occurs later.

| Metric | Value |
|---|---|
| Exact model variant | UNAVAILABLE |
| Start / end time | UNAVAILABLE |
| Wall-clock | UNAVAILABLE |
| Input tokens | UNAVAILABLE |
| Output tokens | UNAVAILABLE |
| Reported/API cost | UNAVAILABLE |
| Retry count | UNAVAILABLE (retries observed) |

Operator screenshots: repository storage location not supplied at closeout; no path recorded.

## Operator interventions

1. Launch instruction ("Read and follow: contestants/deepseek-v4-pro/REVIEW_PROMPT.md. Begin the review.") — MECHANICAL
2. Quota-resume continuation instruction — NOT CONFIRMED as issued; not recorded as issued. If it was issued, it is to be appended verbatim to RUN_NOTES.md and classified MECHANICAL.

No additional operator intervention was recorded.

## Execution limitations

Contestant-reported:

- live Supabase behavior not exercised end-to-end
- live GCS instruction persistence not exercised
- live ADK bundle behavior not exercised
- no credentials/endpoints available for those live paths
- RLS policies reviewed statically rather than verified against live Supabase

Operational:

- review was interrupted by Ollama HTTP 429 session quota exhaustion
- completion required waiting for quota recovery and resuming the existing session

## Confirmations

- `EVAL_ENTRY.md` remains untouched: contains only `# Pending — evaluation occurs after original evidence preservation`
- No evaluation, grading, validation, challenge, or comparison of the contestant's findings occurred during closeout.
- The contestant report was hashed but not edited, cleaned up, summarized, or reproduced here.
- The interim interruption record (Event 1) was preserved verbatim in RUN_NOTES.md.
- No frozen benchmark instrument file changed (rules, scorecard, brief, prompt template, run order, improvement journal).
- `contestants/kimi-k2.7-code/`, `contestants/minimax-3/`, `contestants/glm-5.3/`, `contestants/glm-5.3-flash/`, and `contestants/deepseek-v4-flash/` were not modified.
- This contestant's report was not exposed to DeepSeek V4 Flash or any other contestant.
- `target/` was not modified and was not inspected for review purposes.
- No git write operation was performed by the scribe.

## Files modified/created at closeout

- Modified: `contestants/deepseek-v4-pro/RUN_NOTES.md`
- Created: `contestants/deepseek-v4-pro/CLOSEOUT_REPORT.md`
