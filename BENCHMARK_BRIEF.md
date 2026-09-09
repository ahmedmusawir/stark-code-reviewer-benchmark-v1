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

Benchmark methodology, scoring, and rules are **pending freeze**. See `BENCHMARK_RULES.md`.

# Placeholder — content pending benchmark design
