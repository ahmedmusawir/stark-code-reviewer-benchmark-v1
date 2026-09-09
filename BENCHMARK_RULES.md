# CR-BENCH-01 — Benchmark Rules

**Version:** 1.0
**Status:** DRAFT — PENDING RULES FREEZE

---

## 1. Benchmark Objective

CR-BENCH-01 measures the natural ability of candidate AI models to act as independent senior software engineers conducting professional code review.

The benchmark asks:

> "Which model is naturally the strongest and most operationally useful senior code reviewer on the same real Stark codebase?"

This round evaluates raw reviewer capability.

It does **NOT** evaluate which model can best follow a Stark Code Reviewer playbook.

No contestant receives Astra's reviewer methodology, Astra's findings, Stark Code Reviewer doctrine, or another contestant's work.

## 2. Frozen Target

| Field | Value |
|---|---|
| Target repository | `stark-ai-workbench-nextjs-frontend-v1` |
| Benchmark target location | `target/stark-ai-workbench-nextjs-frontend-v1/` |
| Pinned source commit | `466083f2b415d9faeb362eb5e48f6e259a42d840` |

The target was independently verified against a fresh checkout of the pinned source commit using:

```
diff -qr --exclude=.git
```

An initial discrepancy was discovered: `BACKEND_SWAP_NOTES.md` was absent from the benchmark snapshot.

The exact file from the verified checkout was restored.

The recursive comparison was rerun and produced no output.

Final state:

**TARGET VERIFIED — IDENTICAL TO PINNED SOURCE COMMIT, EXCLUDING .git**

The target is frozen for the entire benchmark round.

No contestant, operator assistant, scribe, referee, or other benchmark participant may modify `target/` during the round.

## 3. Contestant Roster

The six contestants are:

1. kimi-k2.7-code
2. minimax-3
3. glm-5.3
4. glm-5.3-flash
5. deepseek-v4-pro
6. deepseek-v4-flash

Every contestant reviews the exact same frozen target.

## 4. Equal-Track Principle

Every contestant must receive:

- the same frozen target,
- the same substantive review prompt,
- the same review boundaries,
- the same output expectations,
- the same opportunity to inspect repository files,
- the same opportunity to run permitted non-destructive verification.

No contestant receives findings, hints, corrections, reviewer doctrine, or privileged review context unavailable to the others.

Model-specific technical differences in harness, context handling, tool availability, billing, or execution environment must be recorded rather than silently normalized.

## 5. Contestant Context Boundary

During its benchmark run, a contestant is authorized to inspect only:

1. `target/stark-ai-workbench-nextjs-frontend-v1/`
2. its own contestant workspace and `REVIEW_PROMPT.md`

A contestant must **NOT** inspect:

- `BENCHMARK_BRIEF.md`
- `BENCHMARK_RULES.md`
- `EVAL_SCORECARD.md`
- `EVAL_LEDGER.md`
- `reference/`
- another contestant's directory
- `referee/`
- `reports/`
- benchmark improvement journals
- Astra CR-00 artifacts
- Astra reviewer playbooks
- prior contestant reports

The root benchmark documents are operator/control-plane material, not contestant context.

All rules required for contestant execution must therefore be contained in the frozen contestant `REVIEW_PROMPT.md`.

## 6. Raw Reviewer Rule

CR-BENCH-01 intentionally tests native reviewer behavior.

Contestants are **NOT** given:

- a predefined code-review checklist,
- Astra's CR-00 findings,
- Astra's self-critique,
- Astra's reviewer playbook,
- Stark Code Reviewer doctrine,
- a list of expected defects,
- expected severity ratings,
- scoring criteria,
- referee criteria.

Contestants must decide for themselves what a professional senior code review should examine.

This rule exists to observe natural reviewer behavior before imposing a reviewer methodology.

## 7. Review-Only Boundary

Contestants perform **REVIEW ONLY**.

They must not:

- modify application code,
- repair findings,
- refactor code,
- modify application tests,
- change configuration,
- change dependencies,
- create commits,
- push,
- merge,
- create branches,
- reset git state,
- otherwise intentionally alter the frozen target.

Contestants may inspect files, search the repository, reason across code paths, and run permitted non-destructive verification.

## 8. Verification and Testing

Contestants may run non-destructive tests, static analysis, searches, or targeted reproductions when useful for validating a finding.

What a contestant actually runs must be recorded.

A claim that verification occurred is not equivalent to evidence that it occurred.

Benchmark records should distinguish:

- source inspection,
- inferred behavior,
- isolated reproduction,
- integrated local reproduction,
- real-service verification,
- deployed verification,

when those distinctions are observable from the contestant's work.

A contestant is not required to run every available test.

The benchmark evaluates the judgment used in deciding what verification is necessary as part of a professional review.

## 9. Original Artifact Preservation

Each contestant's original review output is evidence.

Once a contestant completes its report:

- preserve the original report,
- do not rewrite it,
- do not improve its wording,
- do not remove false positives,
- do not add missed findings,
- do not silently correct severity,
- do not merge operator interpretation into the original artifact.

Formatting or transport work must never change the substantive review.

Any later analysis, grading, challenge, or correction belongs in separate benchmark artifacts.

## 10. Operator Intervention Rule

Tony is the benchmark operator.

Routine mechanical actions necessary to operate the harness are permitted.

Examples include:

- starting a model,
- providing the frozen prompt,
- handling file transport,
- resolving a purely mechanical harness issue,
- requesting the model to save an output that it already produced.

Substantive assistance is different.

Any operator intervention that could influence review quality must be recorded verbatim or as faithfully as technically possible.

Examples include:

- hints about a defect,
- directing attention to a file or subsystem,
- suggesting a security issue,
- challenging a finding,
- asking the model to reconsider severity,
- supplying missing technical reasoning,
- prompting the model to search for additional findings.

Such intervention does not automatically invalidate a run, but it becomes part of the benchmark evidence and must be considered during evaluation.

## 11. No Mid-Run Coaching

The operator must not coach a contestant toward Astra's findings or another contestant's findings.

If a contestant misses something, the miss remains evidence.

If a contestant makes a weak claim, the weak claim remains evidence.

If a contestant naturally self-corrects without substantive operator guidance, that behavior may be recorded as self-correction.

## 12. Scribe Boundary

Claude Code / Claudy may act as Benchmark Scribe.

The scribe may:

- prepare benchmark-owned file structure,
- place preserved artifacts,
- record operator-supplied runtime/cost/token data,
- maintain run notes,
- maintain the evaluation ledger,
- perform mechanical completeness checks,
- prepare blinded copies after contestant runs are complete.

The scribe must **NOT**:

- perform the contestant's review,
- improve a contestant's report,
- grade contestants unless explicitly assigned in a later separate protocol,
- reinterpret findings as if they were contestant findings,
- leak findings between contestants,
- expose Astra reference material to contestants,
- alter the frozen target,
- silently repair benchmark evidence.

## 13. Run Record

Every contestant run must have a durable run record.

At minimum, preserve:

- contestant/model identity,
- exact model variant when known,
- date/time,
- harness/environment,
- exact frozen prompt,
- target identity,
- output report,
- verification/tests executed,
- operator interventions,
- execution problems,
- wall-clock time when available,
- token/request usage when available,
- billing/cost information when available,
- incomplete or inaccessible review areas declared by the contestant.

Unavailable metrics must be marked unavailable rather than estimated without disclosure.

## 14. Instrument Freeze

`BENCHMARK_RULES.md` v1.0, the scoring instrument, and the contestant prompt must be frozen before Candidate #1 begins.

Once Candidate #1 begins:

- benchmark rules do not change,
- scoring criteria do not change,
- contestant prompt does not change,
- target does not change.

If a methodology improvement is discovered during the round, record it in:

`FINDINGS_FOR_BENCHMARK_V1.1.md`

Do not patch the active v1.0 instrument mid-round.

This protects comparability across all six contestants.

## 15. Referee Principle

After all contestant reports are complete, they may be presented to Astra through a separate referee protocol.

Where practical, contestant identities should be blinded during comparative judging.

Astra is a reference reviewer and referee.

Astra is **NOT** an unquestionable answer key.

A contestant does not receive credit merely for agreeing with Astra.

A contestant does not lose credit merely for disagreeing with Astra.

Novel findings must be evaluated on their own evidence and technical validity.

If a contestant discovers a valid issue Astra missed, the contestant receives appropriate credit.

If Astra makes a referee error, that error must be recorded.

## 16. Benchmark Instrument Is Also Under Test

CR-BENCH-01 evaluates more than the contestants.

The benchmark instrument, scoring system, operator process, and referee process are themselves subject to scrutiny.

Observed benchmark flaws must not be hidden to protect the apparent quality of the experiment.

Examples include:

- ambiguous scoring criteria,
- contamination risk,
- inconsistent model access,
- harness differences,
- operator-induced bias,
- referee false positives,
- referee misses,
- inadequate evidence categories,
- poor cost measurement.

Such findings belong in the benchmark improvement journal and final report.

## 17. Cost and Human Burden

Raw token price is not sufficient to determine reviewer value.

Where data is available, final analysis should consider:

- model/API cost,
- request/token consumption,
- wall-clock time,
- useful findings produced,
- false-positive burden,
- missed-risk burden,
- operator intervention required,
- human correction/adjudication burden.

The benchmark should ultimately care about operational value and effective cost per useful review, not price per million tokens alone.

## 18. Run Independence

Each contestant run is independent.

A contestant must not inherit:

- another contestant's report,
- another contestant's conversation,
- another contestant's hints,
- Astra findings,
- referee analysis,
- operator conclusions from prior runs.

The operator should begin each contestant from the same frozen benchmark starting condition as closely as the available harness allows.

Any unavoidable difference must be recorded.

## 19. Completion Boundary

A contestant run is complete when:

- the contestant has completed its independent review,
- its original report has been durably preserved,
- required run metadata has been captured,
- any operator intervention has been logged,
- any execution limitation has been recorded.

Evaluation and grading occur after preservation of the original evidence.

## 20. Rules Freeze Declaration

This document becomes:

**CR-BENCH-01 BENCHMARK RULES v1.0 — FROZEN**

only after Tony / Benchmark Operator explicitly approves it.

Until that approval is given, its status remains:

**DRAFT — PENDING RULES FREEZE**
