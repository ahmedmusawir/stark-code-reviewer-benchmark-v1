# CR-BENCH-01 — Run Notes

Model: deepseek-v4-pro
Exact variant: UNAVAILABLE (harness model identifier observed at launch: `deepseek-v4-pro:cloud`; Ollama dashboard identifier observed: `deepseek-v4-pro:0813`)
Date: 2026-09-09
Start time: UNAVAILABLE
End time: UNAVAILABLE
Wall-clock: UNAVAILABLE (run spanned two session-quota segments separated by a recovery wait; see Execution Events)
Harness/environment: Ollama Cloud (model served as `deepseek-v4-pro:cloud`); further harness details UNAVAILABLE

## Target

Repository: stark-ai-workbench-nextjs-frontend-v1
Pinned source commit: 466083f2b415d9faeb362eb5e48f6e259a42d840

## Execution

Requests: 58 final DeepSeek V4 Pro requests shown on the Ollama dashboard after completion (operator-observed). 44 shown at the interruption snapshot; 14 additional requests after that snapshot (58 − 44 = 14).
Input tokens: UNAVAILABLE
Output tokens: UNAVAILABLE
Reported/API cost: UNAVAILABLE
Retries: automatic retries were observed following the HTTP 429 responses; count UNAVAILABLE
Harness failures: HTTP 429 — session usage limit reached (Segment 1; see Execution Events)

Use UNAVAILABLE where metrics cannot be obtained.

### Usage / cost interpretation boundary

The following metrics are kept separate and are not equated with one another: Ollama session usage; Ollama weekly usage; request count; token counts (UNAVAILABLE); API dollar pricing/cost (UNAVAILABLE); wall-clock time (UNAVAILABLE); quota interruption/recovery time. Ollama usage percentages are not token counts and are not dollar cost. No API cost is calculated. This record preserves operational consumption only. Economic evaluation occurs later.

Pricing/cost interpretation: NOT EVALUATED DURING RUN RECORDING.

## Execution Events

This review required TWO Ollama session-quota segments.

### Event 1 — Interruption by Ollama Cloud session usage limit

Recorded: 2026-09-09 19:41:16 +06

Run state: INTERRUPTED — RESUMABLE

Reason: Ollama Cloud session usage limit reached.

Observed harness error: HTTP 429 — session usage limit reached.

Automatic retries were observed.

The contestant had NOT declared the review complete when the interruption occurred. `REVIEW_REPORT.md` still contains the pending placeholder at the time of this record.

#### Operator-observed dashboard state (Ollama Cloud)

| Reading | Previous post-GLM-5.3-Flash state | At interruption | Observed delta |
|---|---|---|---|
| Session usage | 45.4% | 100.0% | at least +54.6 percentage points |
| Weekly usage | 14.5% | 24.3% | +9.8 percentage points |
| DeepSeek V4 Pro requests shown | — | 44 | — |

The session meter reached its 100% ceiling. The +54.6 percentage-point session delta is therefore a LOWER BOUND on DeepSeek V4 Pro's session demand during this run. The uncapped amount is not inferred.

These are operator-observed dashboard readings. They are not converted into tokens, dollars, or API cost, and Ollama session usage is not described as equivalent to API pricing.

Pricing/cost interpretation: NOT EVALUATED DURING RUN RECORDING.

The Ollama session-usage meter is preserved as an operational quota measurement, not as a direct dollar-cost measurement.

#### Run continuation protocol

- preserve the existing DeepSeek session;
- do not restart the review;
- after the session allowance resets, resume the same session;
- if a manual continuation instruction becomes necessary, Tony may send:

  > Continue the benchmark review from where you were interrupted by the session usage limit.

- classify that instruction as MECHANICAL;
- preserve it verbatim in Operator Interventions if used.


### Event 2 — Reset / recovery and resume

Displayed reset estimate: approximately 1 hour (Ollama UI displayed approximately "Resets in 1 hour")
Operator-observed usable recovery time: approximately 1.5 hours

The observed discrepancy between the displayed estimate and the observed recovery time is preserved as recorded, without interpretation.

The existing DeepSeek session was resumed rather than restarting the benchmark from scratch.

Manual continuation instruction: whether the protocol's continuation instruction was manually issued was not confirmed by the operator at closeout. It is therefore NOT recorded as issued. If it was issued, it is to be appended verbatim under Operator Interventions and classified MECHANICAL.

### Event 3 — Segment 2 / completion

Recorded: 2026-09-09 21:14:12 +06

The contestant completed the review in the resumed session and wrote `REVIEW_REPORT.md`.

#### Operator-observed final post-completion dashboard state (Ollama Cloud)

| Reading | Value |
|---|---|
| Session usage | 20.2% |
| Weekly usage | 27.9% |
| DeepSeek V4 Pro requests shown | 58 |

Final model request count shown: 58
Additional requests after first interruption snapshot: 58 − 44 = 14

#### Whole-run weekly usage

| Reading | Before run (post-GLM-5.3-Flash) | After completion | Observed total weekly delta |
|---|---|---|---|
| Weekly usage | 14.5% | 27.9% | +13.4 percentage points |

#### Session usage across both segments

| Segment | Reading | Value |
|---|---|---|
| Segment 1 | session before interval | 45.4% |
| Segment 1 | session at cap | 100.0% |
| Segment 1 | observed delta (lower bound; meter hit ceiling) | ≥ +54.6 percentage points |
| Reset | session reading at resume, before Segment 2 | UNAVAILABLE (not observed/recorded) |
| Segment 2 | session reading after completion | 20.2% |

Combined session demand: cannot be calculated exactly because the session quota reset during the run. The session reading immediately after reset and before resume was not observed, so the available evidence does not establish whether the reset restored the meter to a fresh 0% baseline. The arithmetic sum of the Segment 1 lower bound and the Segment 2 final reading (54.6 + 20.2 = 74.8 percentage points) is preserved here only so that later evaluation can make that calculation transparently if it adopts the reset-baseline assumption; it is not recorded as an established figure.

#### Provider-displayed operational metadata

PROVIDER-DISPLAYED OPERATIONAL METADATA (Ollama dashboard notice in operator's final screenshot): the notice stated that most session usage was from `deepseek-v4-pro:0813` and characterized it as "an extra high usage model". The dashboard also suggested glm-5.3-flash or glm-5.3 as lower-usage alternatives.

This is preserved as provider-displayed metadata only. It is not benchmark evaluation, is not used to grade the contestant, and no review-quality inference is drawn from it.

Operator screenshots: repository storage location not supplied at closeout; no path recorded.

## Verification Performed

As reported by the contestant:

- `npx tsc --noEmit` — clean / exit 0
- `npx jest` — 38 failed, 225 passed; 10 failing suites
- Targeted manifest test — executed; failed on roster assertions
- Targeted agent-run test — executed; failed with old jarvis_agent assumptions
- Dead-code/reference scans — performed
- Installed Next.js internals inspected to verify middleware/proxy convention — contestant concluded `proxy.ts` is valid under Next 16 and did not manufacture a finding from it
- Static inspection of Supabase, auth, GCS, ADK, server actions, manifest, Mission Control, mocks, tests, and related code paths

These results are recorded as reported by the contestant and were not reinterpreted at closeout.

## Operator Interventions

1. Benchmark launch instruction supplied by Tony (verbatim):

   > Read and follow:
   >
   > contestants/deepseek-v4-pro/REVIEW_PROMPT.md
   >
   > Begin the review.

   Classification: MECHANICAL

2. Quota-resume continuation instruction: NOT CONFIRMED as issued at closeout; not recorded as issued. If Tony did issue "Continue the benchmark review from where you were interrupted by the session usage limit.", it is to be appended here verbatim and classified MECHANICAL.

No additional operator intervention was recorded.

If intervention occurs, preserve it verbatim or as faithfully as technically possible and classify it as:

- MECHANICAL
- SUBSTANTIVE

## Execution Limitations

Contestant-reported limitations:

- live Supabase behavior not exercised end-to-end
- live GCS instruction persistence not exercised
- live ADK bundle behavior not exercised
- no credentials/endpoints available for those live paths
- RLS policies reviewed statically rather than verified against live Supabase

Operational limitation:

- review was interrupted by Ollama HTTP 429 session quota exhaustion
- completion required waiting for quota recovery and resuming the existing session

No other limitations were reported by the contestant or observed by the operator.

## Target State Observation at Closeout

All 357 frozen manifest entries verified OK. No frozen target file was modified.

On-disk state of `target/stark-ai-workbench-nextjs-frontend-v1/` at closeout: 40205 regular files (357 frozen + 39848 gitignored generated artifacts: `node_modules/` 39199 files, `.next/` 647 files, plus next-env.d.ts tsconfig.tsbuildinfo ). These artifacts pre-date this run (`node_modules/` from Candidate #1; `.next/` last modified during Candidate #4) and were unchanged in count during this run. All are excluded by the target's own `.gitignore` and are not part of the frozen manifest. Recorded for equal-track and run-independence purposes. The scribe did not modify target/.

## Completion

Status: COMPLETE
Original review preserved: YES
Original review SHA-256: b4005b5acc7f96337f0f80ad6988e768fbb04a3df63c75543b639914e143ecc5
Original review size: 16971 bytes, 211 lines
Closeout performed: 2026-09-09 21:14:12 +06
Prior run state (superseded): INTERRUPTED — RESUMABLE (Event 1, recorded 2026-09-09 19:41:16 +06)
