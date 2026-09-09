# CR-BENCH-01 — AI Code Reviewer Benchmark

## Purpose

CR-BENCH-01 is a controlled benchmark of AI coding models acting as **code reviewer agents**. Each contestant model reviews the same frozen target codebase under identical conditions so that their review output can be compared on equal footing.

## Target Identity and Provenance

**Status: TARGET FREEZE**

| Field | Value |
|---|---|
| Target repository | `stark-ai-workbench-nextjs-frontend-v1` |
| Benchmark snapshot location | `target/stark-ai-workbench-nextjs-frontend-v1/` |
| Pinned source commit | `466083f2b415d9faeb362eb5e48f6e259a42d840` |

### Verification

A fresh independent checkout of the pinned commit was compared recursively against the benchmark target snapshot using:

```
diff -qr --exclude=.git
```

An initial discrepancy was found: `BACKEND_SWAP_NOTES.md` was missing from the snapshot.

The exact file from the verified pinned checkout was copied into `target/`.

The comparison was then rerun and produced no output.

**Final target state: IDENTICAL TO PINNED SOURCE COMMIT, EXCLUDING .git**

Nothing inside `target/` may be modified after this point.

## Contestant Roster

| # | Contestant | Working directory |
|---|---|---|
| 1 | kimi-k2.7-code | `contestants/kimi-k2.7-code/` |
| 2 | minimax-3 | `contestants/minimax-3/` |
| 3 | glm-5.3 | `contestants/glm-5.3/` |
| 4 | glm-5.3-flash | `contestants/glm-5.3-flash/` |
| 5 | deepseek-v4-pro | `contestants/deepseek-v4-pro/` |
| 6 | deepseek-v4-flash | `contestants/deepseek-v4-flash/` |

## Methodology and Rules

**Status: CR-BENCH-01 v1.0 INSTRUMENT FROZEN**

The CR-BENCH-01 v1.0 instrument was frozen before Candidate #1 began. Benchmark-owned artifacts:

| Artifact | Role |
|---|---|
| `BENCHMARK_RULES.md` | Benchmark Rules v1.0 — FROZEN |
| `EVAL_SCORECARD.md` | Evaluation Scorecard v1.0 — FROZEN |
| `templates/REVIEW_PROMPT.template.md` | Raw contestant prompt (master) — FROZEN |
| `RUN_ORDER.md` | Recorded contestant run order |
| `EVAL_LEDGER.md` | Evaluation ledger |
| `FINDINGS_FOR_BENCHMARK_V1.1.md` | Append-only improvement journal for v1.1 |
| `TARGET_MANIFEST.sha256` | SHA-256 manifest of the frozen target (357 files) |

Freeze state at the time of this record:

- target frozen before Candidate #1;
- rules frozen before Candidate #1;
- scorecard frozen before Candidate #1;
- raw contestant prompt frozen before Candidate #1;
- no contestant has been run;
- no scoring has occurred.
