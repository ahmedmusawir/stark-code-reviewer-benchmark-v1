# CR-BENCH-01 — Code Reviewer Evaluation Scorecard

**Version:** 1.0
**Status:** DRAFT — PENDING INSTRUMENT FREEZE

---

## 1. Purpose

This scorecard evaluates how useful each contestant is as an independent senior code reviewer.

It does **NOT** score agreement with Astra.

Astra's CR-00 review is reference evidence, not an answer key.

A contestant may receive credit for a valid finding Astra missed.
A contestant may be penalized for an invalid finding even if Astra made a similar claim.

Technical validity and evidence control the score.

## 2. Scoring Philosophy

The benchmark rewards:

- important real problems,
- strong evidence,
- correct severity,
- disciplined confidence,
- systemic reasoning,
- useful review judgment.

The benchmark penalizes:

- false positives,
- unsupported certainty,
- severity inflation,
- important misses,
- noise,
- unnecessary operator assistance.

Raw finding count is **NOT** a quality metric.

A smaller set of important, well-supported findings may outperform a larger speculative report.

Severity and evidence strength are separate dimensions.

## 3. Finding Classification

Every substantive contestant finding evaluated by the referee/adjudicator should be classified as one of:

- **VALID**
- **PARTIALLY VALID**
- **INVALID**
- **DUPLICATE / SAME ROOT CAUSE**
- **NOT ADJUDICABLE FROM AVAILABLE EVIDENCE**

A novel finding is not invalid merely because Astra did not report it.

## 4. Finding Importance

Valid findings should be evaluated by practical importance:

- **CRITICAL**
- **HIGH**
- **MEDIUM**
- **LOW**
- **INFORMATIONAL / IMPROVEMENT**

The adjudicated importance may differ from the contestant's stated severity.

Severity calibration is scored separately.

## 5. Evidence Strength

Where possible, classify the strongest evidence supporting a finding:

| Level | Evidence |
|---|---|
| E1 | Source evidence |
| E2 | Isolated reproduction |
| E3 | Integrated local reproduction |
| E4 | Real-service reproduction |
| E5 | Deployed reproduction |

Evidence level does **NOT** automatically determine severity.

A severe issue may initially have low-level evidence.
A strongly reproduced issue may still be low severity.

The scorecard must preserve that distinction.

## 6. Core Evaluation Dimensions

Score each dimension from 0–5.

| Score | Meaning |
|---|---|
| 0 | absent / actively harmful |
| 1 | poor |
| 2 | weak |
| 3 | competent |
| 4 | strong |
| 5 | exceptional |

Use evidence and written justification for every score.

| Dimension | Weight |
|---|---|
| A. Finding Validity | 15 |
| B. Important-Issue Coverage | 15 |
| C. Evidence Quality | 10 |
| D. Severity Calibration | 7 |
| E. Confidence / Epistemic Discipline | 7 |
| F. Security / Trust-Boundary Reasoning | 8 |
| G. Logic / State / Concurrency Reasoning | 8 |
| H. Architecture / Root-Cause Reasoning | 8 |
| I. Test-Quality Reasoning | 6 |
| J. Scope Discipline / Signal-to-Noise | 5 |
| K. Operational Usefulness | 6 |
| L. Independent Reviewer Judgment | 5 |
| **TOTAL WEIGHT** | **100** |

### A. Finding Validity — Weight 15

Measures whether reported defects/risks are technically real.

Consider:

- proportion of substantive findings that survive adjudication,
- correctness of claimed mechanism,
- avoidance of manufactured findings.

**High score:** Mostly valid findings with accurate technical mechanisms.

**Low score:** Frequent false positives, imagined behavior, or incorrect mechanisms.

### B. Important-Issue Coverage — Weight 15

Measures whether the reviewer found the most consequential issues available in the target.

Consider:

- critical/high-risk misses,
- major correctness misses,
- major security/trust-boundary misses,
- whether review attention was spent on important areas.

Do not require agreement with Astra's exact finding list.

The adjudicator may recognize important issues discovered by any contestant or referee.

### C. Evidence Quality — Weight 10

Measures how well findings are supported.

Consider:

- concrete file paths,
- line/code references,
- traced execution paths,
- targeted verification,
- realistic failure scenarios,
- distinction between proof and inference.

### D. Severity Calibration — Weight 7

Measures whether stated severity matches demonstrated impact and reachability.

Penalize:

- severity inflation,
- severity understatement,
- treating conditional impact as demonstrated impact.

### E. Confidence / Epistemic Discipline — Weight 7

Measures whether the reviewer distinguishes:

- demonstrated fact,
- inference,
- concern,
- deployment-dependent behavior,
- unverified hypothesis.

Reward explicit uncertainty when evidence is incomplete.

Penalize unsupported certainty.

### F. Security / Trust-Boundary Reasoning — Weight 8

Measures ability to reason about:

- authentication,
- authorization,
- identity binding,
- privilege boundaries,
- server/client trust,
- tenant boundaries,
- sensitive operations,
- realistic attack surfaces.

Do not reward speculative security language without a concrete path.

### G. Logic / State / Concurrency Reasoning — Weight 8

Measures ability to detect and explain:

- state ownership problems,
- lifecycle defects,
- asynchronous races,
- stale state,
- sequencing problems,
- concurrency issues,
- state-machine failures.

### H. Architecture / Root-Cause Reasoning — Weight 8

Measures whether the reviewer moves beyond isolated symptoms.

Reward:

- grouping related findings,
- identifying shared architectural causes,
- recognizing boundary failures,
- distinguishing systemic issues from local defects.

Do not require architectural redesign.

### I. Test-Quality Reasoning — Weight 6

Measures whether the reviewer evaluates tests intelligently rather than merely running them.

Consider:

- missing coverage,
- stale tests,
- tests proving the wrong behavior,
- weak mocks,
- contract drift,
- whether failures are interpreted correctly.

### J. Scope Discipline / Signal-to-Noise — Weight 5

Measures whether the report stays useful.

Reward:

- prioritization,
- concise high-value findings,
- separation of defects from optional improvements,
- avoidance of manufactured completeness.

Penalize:

- laundry-list reviewing,
- cosmetic noise overwhelming risk,
- irrelevant redesign.

### K. Operational Usefulness — Weight 6

Measures whether another senior engineer could act on the review.

Consider:

- clarity,
- precise locations,
- mechanism explanation,
- impact explanation,
- useful remediation direction without implementing the fix,
- report organization.

### L. Independent Reviewer Judgment — Weight 5

Measures the quality of the model's own review strategy.

Consider:

- where it chose to investigate,
- what it chose to verify,
- whether it followed important code paths,
- whether it found non-obvious issues without coaching,
- whether it used available review time intelligently.

**TOTAL WEIGHT = 100**

## 7. Weighted Score

For each dimension:

```
Weighted contribution = (Dimension score / 5) × Dimension weight
```

```
Final Quality Score = sum of all weighted contributions
```

Maximum = 100

Do **NOT** use the numeric score as the only basis for final model-role recommendations.

The written evidence and failure modes remain authoritative context.

## 8. False Positive Record

Separately record:

- total substantive findings,
- valid findings,
- partially valid findings,
- invalid findings,
- non-adjudicable findings.

Calculate when possible:

```
Finding Precision = (valid + partial-credit equivalent) / adjudicated substantive findings
```

Do not hide false positives inside the weighted score.

Preserve them as an explicit operational metric.

## 9. Important Misses

Maintain a separate record of consequential issues the contestant failed to identify.

Classify misses by adjudicated importance.

Critical/high misses must receive explicit discussion.

A miss does **NOT** require that Astra found the issue.

The benchmark's understanding of the target may expand as contestants produce novel valid findings.

## 10. Novel Valid Findings

Record findings that:

- are technically valid,
- are substantively useful,
- were not present in Astra CR-00.

Novel valid findings are positive benchmark evidence.

Astra is not the ceiling.

Track:

- number,
- importance,
- evidence quality,
- whether later referee/adjudication confirms them.

## 11. Root-Cause Compression

Record whether the contestant:

- reported related symptoms independently,
- recognized shared causes,
- correctly grouped related findings,
- over-counted one defect as many unrelated defects.

This supports the Architecture / Root-Cause score.

Do not reward inflated finding counts caused by duplicate symptoms.

## 12. Verification Record

Record what the contestant actually used:

- source inspection only,
- static analysis,
- existing tests,
- targeted reproduction,
- newly created temporary verification,
- integrated local execution,
- real service,
- deployed system.

Also record inaccessible verification areas.

Do not infer verification that is not evidenced.

## 13. Operator Intervention

Record:

- **NONE**
- **MECHANICAL ONLY**
- **SUBSTANTIVE**

If substantive:

- preserve the intervention,
- identify what changed afterward,
- consider the intervention when judging independence.

A model requiring significant coaching may still produce a strong report, but the assistance burden must remain visible.

## 14. Self-Correction

Record whether the contestant independently:

- withdrew a weak finding,
- downgraded severity,
- strengthened evidence,
- corrected its mechanism,
- identified limitations.

Distinguish spontaneous self-correction from correction caused by operator challenge.

## 15. Operational Metrics

Record when available:

- wall-clock review time,
- model/API cost,
- input tokens,
- output tokens,
- request count,
- retries,
- harness failures,
- operator time,
- adjudication/correction burden.

Mark unavailable values as **UNAVAILABLE**.

Do not fabricate estimates.

## 16. Effective Review Value

Final analysis should consider:

```
QUALITY + COST + SPEED + HUMAN BURDEN
```

Do not declare the cheapest model the winner solely because it is cheap.

Do not declare the highest-quality model the universal winner if its cost makes it inappropriate for routine use.

The final report may recommend different models for different Factory roles.

Examples include:

- Tactical / BIM Reviewer
- Phase Reviewer
- Security Reviewer
- Principal / Strategic Reviewer

These roles are **NOT** predetermined winners.

## 17. Referee and Adjudication Discipline

Astra's referee judgment is evidence, not unquestionable truth.

The final benchmark may record:

- contestant false positives,
- contestant misses,
- Astra referee false positives,
- Astra referee misses,
- scorecard ambiguities,
- operator disagreements,
- unresolved findings.

Where a ruling remains uncertain, mark it unresolved rather than forcing certainty.

## 18. Required Per-Contestant Evaluation Summary

Each contestant evaluation should eventually contain:

```
Model:
Variant:
Harness:
Review time:
Cost:
Operator intervention:

Weighted Quality Score: __ / 100

Finding counts:
- Total substantive:
- Valid:
- Partially valid:
- Invalid:
- Non-adjudicable:
- Novel valid:

Important misses:
- Critical:
- High:
- Medium:

Dimension scores:
- Finding Validity: __ / 5
- Important-Issue Coverage: __ / 5
- Evidence Quality: __ / 5
- Severity Calibration: __ / 5
- Confidence Discipline: __ / 5
- Security Reasoning: __ / 5
- Logic/State/Concurrency: __ / 5
- Architecture/Root-Cause: __ / 5
- Test-Quality Reasoning: __ / 5
- Scope Discipline: __ / 5
- Operational Usefulness: __ / 5
- Independent Reviewer Judgment: __ / 5

Strongest behavior:
Weakest behavior:
Most important valid finding:
Most important miss:
Notable false positive:
Novel contribution:
Human correction burden:
Recommended Factory role:
Evaluator confidence:
```

## 19. Grade Bands

Numeric grades are summary labels, not substitutes for evidence.

Suggested bands:

| Grade | Score |
|---|---|
| A+ | 95–100 |
| A | 90–94 |
| A- | 85–89 |
| B+ | 80–84 |
| B | 75–79 |
| B- | 70–74 |
| C+ | 65–69 |
| C | 60–64 |
| C- | 55–59 |
| D | 45–54 |
| F | below 45 |

Do not manipulate individual dimension scores to force a desired letter grade.

## 20. Scorecard Freeze

This document becomes:

**CR-BENCH-01 EVAL SCORECARD v1.0 — FROZEN**

only after Tony / Benchmark Operator explicitly approves it as part of the complete benchmark instrument.

Until then:

**DRAFT — PENDING INSTRUMENT FREEZE**
