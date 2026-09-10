# CR-BENCH-01 — Final Scorecard (Unblinded)

Status: FINAL — reveal closeout 2026-09-10
Source of scores: `referee/ASTRA_REFEREE_REPORT.md` (preserved, SHA-256 `08d7108da6c91a7cab56332fd9631975851fdac2da6c638efb057ca88cbf4641`), scored blind under the frozen `EVAL_SCORECARD.md` v1.0.
Adjudication: `referee/JARVIS_ADJUDICATION.md` — **ACCEPT ASTRA REFEREE RESULT WITHOUT SCORE MODIFICATION** (confidence MEDIUM-HIGH). No score or grade below differs from Astra's blind output.
Mapping source: `referee/BLIND_MAPPING.md` (opened by operator after adjudication freeze).

## Canonical unblinded quality ranking

| Rank | Contestant | Blind ID | Weighted Quality Score / 100 | Frozen grade |
|---|---|---|---|---|
| 1 | glm-5.3 | REVIEWER_F | 76.0 | B |
| 2 | glm-5.3-flash | REVIEWER_C | 73.2 | B- |
| 3 | deepseek-v4-pro | REVIEWER_B | 55.0 | C- |
| 4 | deepseek-v4-flash | REVIEWER_D | 54.6 | D |
| 5 | minimax-3 | REVIEWER_A | 45.4 | D |
| 6 | kimi-k2.7-code | REVIEWER_E | 40.8 | F |

Blind ranking as accepted by Jarvis: F > C > B > D > A > E.

Grade-band note preserved from the referee: bands were applied on unrounded totals using stated lower-bound thresholds, so 54.6 remains D rather than rounding into C-.

## Close-call caveats (preserved from the referee, not statistical claims)

- **glm-5.3 vs glm-5.3-flash is a close result.** The blind score difference is 2.8 points. Astra: "F versus C is a close 2.8-point comparison, not a categorical capability distinction. … A one-point change in the 15-weight validity dimension contributes 3 points and could reverse this order."
- **deepseek-v4-pro vs deepseek-v4-flash is effectively close**: 55.0 vs 54.6. Astra: "B versus D is effectively a near tie at 0.4 points. … The letter-grade boundary exaggerates their tiny numerical difference. Any single one-point dimension reassessment is larger than the gap."
- No statistical significance is claimed for any gap. CR-BENCH-01 is a single-run, single-referee round.

## Scope of what these scores measure

CR-BENCH-01 measured RAW, UNCOACHED senior code-review behavior on one frozen target under one identical prompt, judged blind on review quality only. Economics, model identity, request counts, and runtime were not used in scoring or ranking (referee statement, §E). Economics are reconnected separately in `reports/COST_ANALYSIS.md`.

## Referee procedural findings carried forward

- RF-001 — Blinding Isolation Weakness (recorded; Jarvis: does not invalidate CR-BENCH-01).
- RF-002 — Source-Independent Verification Limitation (recorded; Jarvis: does not justify retroactive score changes).

Per-dimension scores and written justifications remain in the preserved Astra report, §D.
