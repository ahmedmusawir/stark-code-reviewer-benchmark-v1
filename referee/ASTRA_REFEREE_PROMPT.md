# CR-BENCH-01 — Blind Referee Review

You are acting as the independent senior referee for CR-BENCH-01.

Six anonymous reviewers independently reviewed the exact same frozen
software repository under the same raw senior-code-review instructions.

Your job is to evaluate the QUALITY of those six reviews.

You are not reviewing the application from scratch for this task.
You are judging the reviewers.

The six anonymous reports are:

- referee/blind/REVIEWER_A.md
- referee/blind/REVIEWER_B.md
- referee/blind/REVIEWER_C.md
- referee/blind/REVIEWER_D.md
- referee/blind/REVIEWER_E.md
- referee/blind/REVIEWER_F.md

You may also read:

- EVAL_SCORECARD.md
- templates/REVIEW_PROMPT.template.md

Do NOT inspect any other benchmark file unless explicitly authorized
by the operator.

## BLINDING BOUNDARY

You must NOT attempt to discover the identity of any reviewer.

Do NOT inspect:

- referee/BLIND_MAPPING.md
- contestants/
- run notes
- closeout reports
- usage information
- request counts
- token information
- cost information
- model names
- benchmark result reports
- prior rankings or opinions

Judge review quality without knowing model identity or economics.

## IMPORTANT: YOU ARE NOT THE ANSWER KEY

Do not grade a reviewer based on whether it agrees with a review you
might personally have produced.

A reviewer may identify a valid problem another reviewer missed.

A reviewer may disagree with another reviewer and still be correct.

Novel valid findings must receive credit based on technical merit.

Likewise, repeated findings are not automatically correct merely
because several reviewers reported them.

Evaluate the underlying technical claim.

## EVIDENCE STANDARD

For each material finding you adjudicate, distinguish where possible:

- VALID
- PARTIALLY VALID
- INVALID
- DUPLICATE / SAME ROOT CAUSE
- NOT ADJUDICABLE FROM AVAILABLE EVIDENCE

Also distinguish:

- demonstrated behavior
- source-supported inference
- conditional/deployment-dependent risk
- unsupported speculation

Do not force certainty where the available evidence does not justify it.

## SEVERITY

Assess practical severity independently from the contestant's stated
severity.

Use:

- CRITICAL
- HIGH
- MEDIUM
- LOW
- INFORMATIONAL / IMPROVEMENT

Severity and evidence strength are separate.

Explicitly call out severity inflation or understatement.

## CROSS-REVIEWER ADJUDICATION

Build a consolidated understanding of the important issues identified
across all six reports.

For each major issue family:

1. identify which anonymous reviewers found it;
2. determine whether the issue is technically valid;
3. identify the strongest evidence supplied;
4. determine practical severity;
5. identify reviewers that overstated or understated it;
6. identify meaningful reviewers that missed it;
7. note whether multiple reported findings are actually one shared
   root cause.

Do not reward duplicate symptoms as independent insight.

## REVIEWER QUALITY EVALUATION

Evaluate each anonymous reviewer using the frozen EVAL_SCORECARD.md.

Score every dimension 0–5 with written justification:

- Finding Validity
- Important-Issue Coverage
- Evidence Quality
- Severity Calibration
- Confidence / Epistemic Discipline
- Security / Trust-Boundary Reasoning
- Logic / State / Concurrency Reasoning
- Architecture / Root-Cause Reasoning
- Test-Quality Reasoning
- Scope Discipline / Signal-to-Noise
- Operational Usefulness
- Independent Reviewer Judgment

Apply the frozen scorecard weights exactly.

Calculate a Weighted Quality Score / 100 for REVIEWER_A through
REVIEWER_F.

Do not modify weights or grade bands.

## FALSE POSITIVES

For each reviewer identify meaningful false positives or materially
unsupported claims.

Do not penalize a reviewer merely for raising a clearly labeled concern
or tradeoff.

The important distinction is whether the report presents an uncertain
claim as a demonstrated defect.

## IMPORTANT MISSES

Identify consequential issues each reviewer missed.

A miss does NOT need to have appeared in every other report.

If one anonymous reviewer identifies a novel issue that you determine is
valid and important, it may become part of the known issue set against
which other reviewers are assessed.

Be conservative: do not manufacture a "miss" from a weak or unresolved
claim.

## NOVEL CONTRIBUTIONS

Explicitly identify reviewers that surfaced technically valid,
substantive findings not present in the other reports.

Novelty alone is not quality.
Validity and importance matter.

## REVIEWER STRENGTHS

Do not produce a negativity-only evaluation.

For each reviewer identify:

- strongest behavior
- weakest behavior
- most important valid finding
- most important miss
- notable false positive, if any
- novel contribution, if any
- evidence discipline
- overall reviewer character

Examples of reviewer character could include:

- precise but narrow
- broad but noisy
- strong security reviewer
- strong systems thinker
- strong verifier
- useful tactical reviewer
- deep but expensive-looking behavior

Do NOT infer actual cost or model identity.

## SELF-CHECK

Before finalizing:

1. Challenge your own strongest adjudications.
2. Identify findings where reasonable senior engineers could disagree.
3. Identify any place where your judgment depends on an unverified
   framework/runtime/deployment assumption.
4. Do not pretend static analysis proves a live exploit when it does not.
5. Do not downgrade a source-proven defect merely because it was not
   reproduced live.
6. Check your arithmetic for all weighted scores.

## OUTPUT ARTIFACT

Write the final referee report to:

referee/ASTRA_REFEREE_REPORT.md

The report must include:

### A. Referee Executive Summary

A concise overview of the anonymous field.

### B. Consolidated Issue Ledger

Major issue families discovered across the six reports, with:

- adjudicated validity
- adjudicated severity
- supporting anonymous reviewers
- strongest evidence
- important caveats

### C. Per-Reviewer Adjudication

For REVIEWER_A through REVIEWER_F:

- substantive finding count
- valid findings
- partially valid findings
- invalid findings
- non-adjudicable findings
- important misses
- novel valid findings
- material severity-calibration errors
- strengths
- weaknesses

### D. Scorecard

For every reviewer:

- all 12 dimension scores
- weighted quality score / 100
- letter grade using the frozen scorecard
- written justification

### E. Comparative Ranking

Rank REVIEWER_A through REVIEWER_F by review quality.

Explain close calls.

Do NOT consider economics, runtime, token usage, request count, or model
identity.

### F. Reviewer Role Assessment

Based on review behavior alone, state what engineering-review role each
anonymous reviewer appears best suited for.

Examples:

- tactical module reviewer
- phase reviewer
- security-focused reviewer
- broad senior reviewer
- principal/system reviewer

Do not assume only one reviewer can fit a role.

### G. Referee Uncertainty / Potential Referee Errors

List:

- unresolved adjudications
- assumptions that materially affected scoring
- findings requiring live verification
- places where your own confidence is limited
- any score you consider especially sensitive to interpretation

This section is mandatory.

## COMPLETION MESSAGE

When finished, tell the operator only:

1. referee review complete;
2. report path;
3. whether all six anonymous reports were evaluated;
4. whether anything materially limited adjudication.

Do not reveal or guess model identities.
