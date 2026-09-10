# CR-BENCH-01 — Astra Input Manifest

Created: 2026-09-10 12:13:41 +06
Status: PREPARED — pending operator review before any Astra invocation

This file defines what the referee (Astra) is permitted to receive for blind quality evaluation. It contains no contestant identity and no operational economics.

## Blind review inputs (required)

| Blind ID | File | SHA-256 |
|---|---|---|
| REVIEWER_A | `referee/blind/REVIEWER_A.md` | `4943c7a8e20edff37d6391438cd591e8898f20cc5750a41f71cc078fe8ec8748` |
| REVIEWER_B | `referee/blind/REVIEWER_B.md` | `b4005b5acc7f96337f0f80ad6988e768fbb04a3df63c75543b639914e143ecc5` |
| REVIEWER_C | `referee/blind/REVIEWER_C.md` | `008d3b0494afdf0752373470f48ca8ac74ba36fa1e4c604c920af28414fc646b` |
| REVIEWER_D | `referee/blind/REVIEWER_D.md` | `9e7d73478aec1e0d68640ce67736da2408b7eb0a78e87200d8a7ad4663dca2eb` |
| REVIEWER_E | `referee/blind/REVIEWER_E.md` | `dc1390ed8c01b717855bc5ca1b6acc653480535aac27ee07a870ced9f835d738` |
| REVIEWER_F | `referee/blind/REVIEWER_F.md` | `855f0c19683e2a34d00a6f7b566273bfed640a4b6665a12311a96d486234d682` |

Each file is one contestant's original review with only contestant-identity text replaced by `[BLINDED REVIEWER]`. Substantive content is unaltered (see `referee/BLIND_FIDELITY_REPORT.md`).

## Frozen benchmark evaluation documents that MAY be provided in the NEXT step

Identified here for the operator's decision. None is included automatically.

| Document | Identity-term scan | Note |
|---|---|---|
| `EVAL_SCORECARD.md` | 0 contestant-identity terms | Frozen v1.0 scoring instrument. Candidate for referee context. |
| `templates/REVIEW_PROMPT.template.md` | 0 contestant-identity terms | The exact frozen prompt every contestant received. Candidate for referee context. |
| `BENCHMARK_RULES.md` | CONTAINS contestant roster (section 3) | Frozen v1.0 rules. Do not provide as-is; would require a roster-redacted excerpt if any part is given. Operator decision. |
| `BENCHMARK_BRIEF.md` | CONTAINS contestant roster | Do not provide as-is. Operator decision. |

## Explicitly EXCLUDED from Astra's input

- `referee/BLIND_MAPPING.md` (CONFIDENTIAL)
- `referee/BLIND_REDACTION_LOG.md` (names source paths containing identity)
- contestant model names, families, or directory names
- `contestants/` directory contents (RUN_NOTES, CLOSEOUT_REPORT, EVAL_ENTRY, original REVIEW_REPORT files)
- Ollama usage data, request counts, token data, API pricing, session or weekly quota consumption
- wall-clock comparisons
- 429 / interruption history tied to a contestant identity
- previous informal Tony/Jarvis opinions
- model rankings or any preliminary score
- `EVAL_ENTRY.md` contents
- `reports/COST_ANALYSIS.md`, `reports/MODEL_ROLE_RECOMMENDATIONS.md`
- Astra's own CR-00 report, self-critique, finding defense, or reviewer playbook as an answer key (`reference/astra/`); whether any Astra reference artifact is provided as referee context is a separate operator decision, not part of this package

The referee must judge review QUALITY before operational economics are reconnected.

## Not yet done (by design)

- No Astra referee prompt has been prepared.
- Astra has not been invoked.
