# CR-BENCH-01 — Cost / Operational Demand Analysis

Status: FINAL — reveal closeout 2026-09-10
Scope: operator-observed operational evidence reconnected to contestant identity AFTER blind quality scoring was frozen. Quality scores are from `reports/FINAL_SCORECARD.md`.

## Interpretation boundary (read first)

Percentage-point usage movements are provider-displayed operational meters (Ollama Cloud dashboard, operator-observed). They are NOT token counts, dollars, normalized compute, or benchmark scores. No monetary cost is inferred.

Specific limitations of these meters:

- The Ollama session and weekly meters are cumulative account-level gauges read from screenshots at run boundaries. Deltas attribute the movement in an interval to the contestant that ran in that interval; nothing else was running, but the meters are not per-model instruments.
- Meter resolution is 0.1 percentage point as displayed. Readings are not timestamped by the provider.
- The session meter has a 100% ceiling. Where it was reached, the delta is a lower bound.
- Request counts are the per-model counters shown on the dashboard, operator-read.
- Token counts, API dollar cost, and wall-clock time were UNAVAILABLE for every contestant run and are not estimated.
- The referee (Astra) ran on a different provider and meter (OpenAI 5-hour/weekly allowances). Its figures are not comparable to the contestant meters and are recorded separately.

## Contestant operational evidence (operator-supplied at reveal)

| Contestant | Quality score | Requests | Observed session-usage delta | Observed weekly delta | Incidents |
|---|---|---|---|---|---|
| glm-5.3 | 76.0 | 235 | +26.5 percentage points | +4.7 percentage points | none |
| glm-5.3-flash | 73.2 | 58 | +3.2 percentage points | +0.5 percentage points | none |
| deepseek-v4-pro | 55.0 | 59 (final) | ≥ +74.8 percentage points combined (lower bound; first segment reached the 100% session ceiling) | +13.4 percentage points | one HTTP 429 quota interruption; ~1.5 h operator-observed recovery delay; required two quota windows |
| deepseek-v4-flash | 54.6 | 76 | +15.8 percentage points | +2.8 percentage points | none |
| minimax-3 | 45.4 | 79 | +5.7 percentage points | N/A (no pre-run weekly reading) | none |
| kimi-k2.7-code | 40.8 | 88 | approximately +10.0 percentage points (approximate, operator-observed) | N/A | none |

### DeepSeek V4 Pro quota incident

Segment 1: session 45.4% → 100.0% (≥ +54.6 percentage points, meter capped), weekly 14.5% → 24.3%, 44 requests at interruption. HTTP 429 "session usage limit reached"; automatic retries observed; contestant had not declared completion. Ollama UI displayed approximately "Resets in 1 hour"; usable capacity returned after approximately 1.5 hours (discrepancy preserved without interpretation). Same session resumed. Segment 2 ended at session 20.2%, weekly 27.9%. The combined figure ≥ 74.8 is the operator's reveal-time figure (54.6 + 20.2); the run notes record that the post-reset baseline reading was not observed, so the combination assumes the reset returned the meter to 0%. Full record: `contestants/deepseek-v4-pro/RUN_NOTES.md`.

## Data reconciliation against frozen run notes

The reveal-time operator figures above were compared with the values recorded in each contestant's `RUN_NOTES.md` at closeout. The run notes are the raw evidence and were not modified. Differences:

| Contestant | Field | RUN_NOTES (closeout) | Reveal-time operator figure | Note |
|---|---|---|---|---|
| glm-5.3-flash | requests | 57 | 58 | +1; operator to confirm which dashboard reading is canonical |
| deepseek-v4-pro | requests (final) | 58 | 59 | +1; same |
| minimax-3 | requests | 78 | 79 | +1; same |
| kimi-k2.7-code | requests | UNAVAILABLE | 88 | newly supplied at reveal |
| minimax-3 | session delta | not recorded as a delta (cumulative 15.7% after run; ~10% harness usage observed after Kimi) | +5.7 percentage points | derived by operator as 15.7 − ~10.0 |
| kimi-k2.7-code | session delta | "approximately 10%" operator-observed harness usage | approximately +10.0 percentage points | same observation, restated as a delta |
| deepseek-v4-pro | combined session | "cannot be calculated exactly"; 74.8 preserved for transparent calculation | ≥ +74.8 percentage points | operator adopted the reset-baseline assumption at reveal |

No figure in either column has been altered by the scribe.

## Referee (Astra) usage — recorded separately

This is referee cost evidence, NOT contestant quality evidence.

| Referee | Reasoning | Allowance | Before | After | Observed consumption |
|---|---|---|---|---|---|
| GPT-6 Astra (Codex CLI 0.154.0) | HIGH | 5-hour | 100% left | 60% left | approximately 40 percentage points |
| GPT-6 Astra (Codex CLI 0.154.0) | HIGH | weekly | 85% left | 79% left | approximately 6 percentage points |

One referee session; no usage reset required.

## Observations (factual, not recommendations)

- The two highest-scoring contestants differ by 2.8 quality points but by roughly 23 session-meter percentage points and about 4× in request count (235 vs 58) in this run.
- The highest observed session demand (deepseek-v4-pro, lower-bounded) coincided with a mid-tier quality score and the only harness interruption of the round.
- Quality score and observed meter movement are not monotonically related across the six contestants.

Recommendations drawn from these observations are in `reports/MODEL_ROLE_RECOMMENDATIONS.md` and are explicitly bounded as hypotheses.
