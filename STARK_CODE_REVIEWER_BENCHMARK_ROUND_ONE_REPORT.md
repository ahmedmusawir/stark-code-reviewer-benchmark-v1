# STARK CODE REVIEWER BENCHMARK --- ROUND ONE REPORT

**Benchmark ID:** CR-BENCH-01\
**Date:** September 9--10, 2026\
**Status:** COMPLETE / CLOSED\
**Operator:** Tony Stark --- Cyberize Engineering\
**Benchmark:** Raw, uncoached AI senior code review\
**Target:** `stark-ai-workbench-nextjs-frontend-v1`\
**Pinned commit:** `466083f2b415d9faeb362eb5e48f6e259a42d840`\
**Blind referee:** GPT-6 Astra, High reasoning\
**Final adjudication:** Astra result accepted without score modification

------------------------------------------------------------------------

## 1. Executive Summary

CR-BENCH-01 compared six AI coding models acting as independent senior
code reviewers on the same frozen real Stark codebase. The experiment
intentionally measured **natural reviewer ability**. Contestants
received no Stark reviewer playbook, predefined checklist, Astra
findings, expected defect list, scoring criteria, or coaching.

### Final leaderboard

    Rank Model                    Score  Grade
  ------ ------------------- ---------- --------
       1 **GLM 5.3**           **76.0**  **B**
       2 **GLM 5.3 Flash**     **73.2**  **B-**
       3 DeepSeek V4 Pro           55.0    C-
       4 DeepSeek V4 Flash         54.6    D
       5 MiniMax 3                 45.4    D
       6 Kimi K2.7 Code            40.8    F

The most important result is not simply that GLM 5.3 won. **GLM 5.3
Flash finished only 2.8 quality points behind the winner while showing
dramatically lower observed provider session-meter movement in this
run.**

### Operational evidence

  --------------------------------------------------------------------------
  Model             Score     Requests      Session     Weekly Δ Incident
                                            Usage Δ              
  ---------- ------------ ------------ ------------ ------------ -----------
  GLM 5.3            76.0          235     +26.5 pp      +4.7 pp ---

  **GLM 5.3      **73.2**       **58**  **+3.2 pp**  **+0.5 pp** ---
  Flash**                                                        

  DeepSeek           55.0           59    ≥+74.8 pp     +13.4 pp HTTP 429;
  V4 Pro                                                         \~1.5 h
                                                                 recovery;
                                                                 two quota
                                                                 windows

  DeepSeek           54.6           76     +15.8 pp      +2.8 pp ---
  V4 Flash                                                       

  MiniMax 3          45.4           79      +5.7 pp          N/A ---

  Kimi K2.7          40.8           88    ≈+10.0 pp          N/A ---
  Code                                                           
  --------------------------------------------------------------------------

These percentage-point movements are provider-displayed operational
usage meters. They are **not token counts, dollars, normalized compute
units, or quality scores**.

### Decision signal

CR-BENCH-01 supports three evidence-bounded deployment hypotheses:

-   **GLM 5.3 Flash** is the strongest candidate for routine tactical
    BIM/FFM review because it combined near-top quality with extremely
    low observed session-meter movement.
-   **GLM 5.3** is the strongest candidate for deeper phase review
    because it achieved the highest raw quality score and strongest
    overall balance of coverage and verification judgment.
-   **GPT-6 Astra** remains appropriate for selected principal/strategic
    adjudication, security-sensitive review, disputed findings, and
    release-level challenges rather than routine low-cost review.

No contestant demonstrated sufficient evidence to be the sole
principal-level sign-off authority.

This benchmark does **not** establish universal model superiority. It
establishes performance on one controlled real-code specimen under one
raw-review protocol.

------------------------------------------------------------------------

## 2. What CR-BENCH-01 Asked

The benchmark question was:

> **Which model is naturally the strongest and most operationally useful
> senior code reviewer on the same real Stark codebase?**

It did **not** ask which model could best follow a Stark Code Reviewer
playbook.

Contestants had to decide independently what deserved inspection, which
findings mattered, how much verification was necessary, how to calibrate
severity, when to express uncertainty, and how to reason across
security, state, architecture, concurrency, tests, and operational
behavior.

Therefore, 76/100 does not mean the winner possesses "76% of code-review
capability." It means the reviewer earned 76 weighted points under a
demanding instrument that rewarded useful findings while penalizing
misses, false positives, weak evidence, severity errors, poor confidence
discipline, and noise.

------------------------------------------------------------------------

## 3. Target Provenance and Freeze

Target repository:

`stark-ai-workbench-nextjs-frontend-v1`

Pinned source commit:

`466083f2b415d9faeb362eb5e48f6e259a42d840`

The benchmark snapshot was independently compared with a fresh checkout
using `diff -qr --exclude=.git`.

One initial discrepancy was found: `BACKEND_SWAP_NOTES.md` was missing.
The exact file from the verified checkout was restored. The recursive
comparison was repeated and produced no output.

Final state:

**TARGET VERIFIED --- IDENTICAL TO PINNED SOURCE COMMIT, EXCLUDING
`.git`**

The target then became an immutable dead snapshot.

A SHA-256 manifest contained **357 entries**. Integrity checks were
repeated throughout contestant execution, blind packaging, referee
execution, referee closeout, and reveal.

Final verification:

**357 / 357 OK**

This is foundational. A benchmark cannot compare reviewers meaningfully
if the code changes between runs.

------------------------------------------------------------------------

## 4. Experimental Controls

### Equal-Track Principle

Every contestant received the same frozen target, substantive prompt,
boundaries, output expectations, opportunity to inspect files, and
opportunity to run permitted non-destructive verification.

No contestant received another contestant's work, Astra CR-00 findings,
Stark reviewer doctrine, expected defects, severity answers, scoring
criteria, or referee criteria.

### Raw Reviewer Rule

The prompt deliberately said to use independent senior engineering
judgment. It did not provide a review checklist.

Contestants were told not to manufacture findings to appear
comprehensive and to separate demonstrated problems from concerns,
tradeoffs, and optional improvements.

### Review-Only Boundary

Contestants could inspect files, search, reason, and run non-destructive
verification. They could not repair findings, refactor, change tests,
alter dependencies, modify the frozen target, or perform git writes.

### Raw Artifact Preservation

Each completed `REVIEW_REPORT.md` became benchmark evidence and was
preserved. Weak reports were not improved after the fact.

### Operator Trust Boundary

Operator interventions were treated as evidence. Mechanical assistance
and substantive coaching were distinct. Any substantive assistance had
to remain visible.

This produced an important doctrine lesson:

> **The operator is part of the benchmark system.**

------------------------------------------------------------------------

## 5. Evaluation Instrument

The scorecard used twelve 0--5 dimensions totaling 100 weighted points.

  Dimension                                  Weight
  --------------------------------------- ---------
  Finding Validity                               15
  Important-Issue Coverage                       15
  Evidence Quality                               10
  Severity Calibration                            7
  Confidence / Epistemic Discipline               7
  Security / Trust-Boundary Reasoning             8
  Logic / State / Concurrency Reasoning           8
  Architecture / Root-Cause Reasoning             8
  Test-Quality Reasoning                          6
  Scope Discipline / Signal-to-Noise              5
  Operational Usefulness                          6
  Independent Reviewer Judgment                   5
  **TOTAL**                                 **100**

The instrument explicitly rejected raw finding count as a quality
metric.

Findings could be adjudicated as VALID, PARTIALLY VALID, INVALID,
DUPLICATE/SAME ROOT CAUSE, or NOT ADJUDICABLE.

Evidence strength was separated from severity:

-   E1 --- Source evidence
-   E2 --- Isolated reproduction
-   E3 --- Integrated local reproduction
-   E4 --- Real-service reproduction
-   E5 --- Deployed reproduction

A severe issue may initially have source-only evidence. A thoroughly
reproduced issue may still be low severity.

### Grade bands

  Grade        Score
  ------- ----------
  A+         95--100
  A           90--94
  A-          85--89
  B+          80--84
  B           75--79
  B-          70--74
  C+          65--69
  C           60--64
  C-          55--59
  D           45--54
  F         below 45

Letter grades summarize the weighted result; they do not replace the
evidence.

------------------------------------------------------------------------

## 6. Blind Referee Protocol

After all six contestant runs were mechanically closed, reports were
randomized into `REVIEWER_A` through `REVIEWER_F`.

Identity-only redactions were mechanically verified. The referee package
excluded model identities, economics, requests, quota behavior,
preliminary rankings, other contestant work, and Astra's prior CR-00
material.

Astra was instructed to judge the **reviewers**, not perform a fresh
application review. It had to consolidate issue families, adjudicate
validity and severity, identify false positives and important misses,
credit novel valid findings, distinguish evidence from speculation,
score all twelve dimensions, explain close calls, assign behavior-based
roles, and disclose its own uncertainty.

Astra was explicitly **not an answer key**. Agreement with prior Astra
work was not the scoring criterion.

------------------------------------------------------------------------

## 7. Referee Results

Astra classified **120 substantive blocks**:

-   73 VALID
-   29 PARTIALLY VALID
-   4 INVALID
-   4 NOT ADJUDICABLE
-   10 DUPLICATE / SAME ROOT CAUSE

The blind ranking was:

1.  REVIEWER_F --- 76.0 --- B
2.  REVIEWER_C --- 73.2 --- B-
3.  REVIEWER_B --- 55.0 --- C-
4.  REVIEWER_D --- 54.6 --- D
5.  REVIEWER_A --- 45.4 --- D
6.  REVIEWER_E --- 40.8 --- F

Astra emphasized that F versus C was a close **2.8-point** comparison. A
one-point reassessment in Finding Validity, weighted at 15, contributes
three weighted points and could reverse the order.

B versus D was effectively a tie at **0.4 points**. The grade boundary
exaggerates the practical difference.

No economics, model identity, request count, runtime, or quota behavior
was used in blind scoring.

------------------------------------------------------------------------

## 8. Official Reveal

The raw Astra report was preserved first. Jarvis then performed blind
adjudication and accepted Astra's scores without modification. Only
after that adjudication was committed was the mapping revealed.

  Blind ID     Actual Model
  ------------ -------------------
  REVIEWER_A   MiniMax 3
  REVIEWER_B   DeepSeek V4 Pro
  REVIEWER_C   GLM 5.3 Flash
  REVIEWER_D   DeepSeek V4 Flash
  REVIEWER_E   Kimi K2.7 Code
  REVIEWER_F   GLM 5.3

Thus the official quality order became:

**GLM 5.3 \> GLM 5.3 Flash \> DeepSeek V4 Pro \> DeepSeek V4 Flash \>
MiniMax 3 \> Kimi K2.7 Code**

------------------------------------------------------------------------

## 9. Major Technical Issue Families

Astra consolidated the field into 21 issue families. The most
consequential were:

### L01 --- Privileged actions omit caller authorization

**VALID --- CRITICAL**

This was the benchmark's most important root issue. Used privileged
server actions could perform high-impact user administration without
adequate caller authorization.

### L02 --- Target-user restrictions are UI-only

**VALID --- HIGH**

UI visibility/filtering did not substitute for authoritative server-side
target restrictions.

### L03 --- Agent run/history lack identity and ownership binding

**VALID --- HIGH**

Several reviewers traced weaknesses involving caller identity,
user/session selection, and transcript ownership. Some overstated
exploit universality; the core identity-binding weakness survived.

### L04 --- Instruction GET/PUT lack authorization

**VALID --- HIGH; potentially CRITICAL downstream**

The instruction write path formed an important trust boundary. More
extreme downstream compromise claims depended on deployment and
agent-consumption assumptions not demonstrated here.

### L05 --- Manifest/UI/mocks/tests disagree

**VALID --- HIGH live Mission Control consequence; MEDIUM test gate; LOW
mock degradation**

All six found aspects of migration/contract drift. The stronger
reviewers went beyond counting failures and traced drift into
application behavior while compressing duplicate symptoms into a shared
root.

### L06 --- Account creation / trigger contract mismatch

**VALID --- MEDIUM selected-role loss; LOW blank-name behavior**

Quality depended on tracing the mismatch precisely without inflating
every symptom.

Other families covered fetch-error state becoming saveable content,
client edits versus upstream transcript persistence, stale GCS copy,
concurrent writes, optimistic archive rollback, shared-profile
navigation, conditional role demotion, listing scalability, timestamp
identifiers, tooling/test-harness fidelity, debug/dead-code concerns,
and lower-severity UI/configuration issues.

This demonstrated a central review principle:

> **Root-cause compression beats finding volume.**

------------------------------------------------------------------------

## 10. Model Assessments

### GLM 5.3 --- 76.0 / B --- Rank 1

**Blind role:** Broad senior / phase reviewer; systems-review support.

Blocks: 22 total; 17 valid; 5 partial; 0 invalid; 0 unadjudicable; 0
duplicate; 1 fully valid unique contribution.

Strengths included test-harness fidelity, private-index versus
transcript-protection reasoning, state/concurrency analysis, root-cause
reasoning, and balanced tradeoff labeling.

Weaknesses included secondary claims that escaped full verification,
some role/timestamp/UI-deletion subclaims, and missing the precise live
Mission Control 400 path.

**Factory hypothesis:** strongest candidate for deeper phase review. Not
established as sole principal sign-off authority.

### GLM 5.3 Flash --- 73.2 / B- --- Rank 2

**Blind role:** Broad senior / phase reviewer.

Blocks: 20 total; 15 valid; 3 partial; 1 invalid; 1 unadjudicable; 0
duplicate; 2 fully valid unique contributions.

Strengths included cross-layer application/state reasoning, privileged
action analysis, agent identity/ownership reasoning,
manifest/live-service drift, trigger contracts, transcript behavior, and
error-state analysis.

Weaknesses included incorrect cookie/SSR advice and unsafe
role-remediation assumptions.

Its operational result is the headline: **73.2 quality at +3.2 observed
session percentage points and 58 requests**, versus GLM 5.3's 76.0 at
+26.5 pp and 235 requests.

**Factory hypothesis:** strongest candidate for routine BIM/FFM review,
pending validation on more specimens.

### DeepSeek V4 Pro --- 55.0 / C- --- Rank 3

**Blind role:** Tactical portal/auth-provisioning reviewer.

Blocks: 9 total; 7 valid; 2 partial; 0 invalid.

It was concise and relatively precise in its chosen scope, especially
privileged actions and provisioning contracts, but missed the major
agent run/history and instruction-write trust boundaries.

Operationally it was the worst contestant: it hit 100% session quota,
encountered HTTP 429, required approximately 1.5 hours of observed
recovery, continued in a second quota window, and accumulated **≥74.8
pp** observed session demand.

**Factory hypothesis:** not supported as primary Stark reviewer by
CR-BENCH-01.

### DeepSeek V4 Flash --- 54.6 / D --- Rank 4

**Blind role:** Security-focused triage reviewer.

Blocks: 21 total; 12 valid; 3 partial; 1 invalid; 5 duplicate.

It found consequential security surfaces but lost ground through
severity inflation, duplicated roots, weaker claim control, and an
invalid redirect mechanism.

The 0.4-point gap from Pro is effectively a near tie.

**Factory hypothesis:** possible supplemental security triage, with
verification required.

### MiniMax 3 --- 45.4 / D --- Rank 5

**Blind role:** Tactical migration/module reviewer.

Blocks: 26 total; 13 valid; 8 partial; 0 invalid; 1 unadjudicable; 4
duplicate; 2 fully valid unique contributions.

It found useful migration, manifest, fixture, archive, state-transition,
and concurrency concerns but over-invested in lower-impact
cleanup/speculation and missed important agent trust boundaries.

**Factory hypothesis:** supplemental tactical reviewer rather than
primary authority.

### Kimi K2.7 Code --- 40.8 / F --- Rank 6

**Blind role:** Exploratory UI/integration reviewer.

Blocks: 22 total; 9 valid; 8 partial; 2 invalid; 2 unadjudicable; 1
duplicate; 1 fully valid unique contribution.

It found a useful shared-profile navigation defect and useful build/test
evidence, but central framework/security assertions included invalid or
unresolved claims while the critical caller-authorization root was
missed.

**Factory hypothesis:** exploratory supplemental pass only; not
supported as primary reviewer.

------------------------------------------------------------------------

## 11. Quality Versus Operational Usage

### GLM Flash was the major surprise

GLM 5.3 Flash delivered roughly 96% of GLM 5.3's quality score while its
observed session-meter movement was roughly 12% of GLM 5.3's movement in
this run.

Those ratios are descriptive, **not normalized cost or compute ratios**.

Still, the Factory signal is substantial: near-top quality may be
available cheaply enough to make independent review routine rather than
exceptional.

### DeepSeek Pro was the opposite surprise

DeepSeek Pro consumed the greatest observed contestant session demand,
hit quota, caused an operational interruption, and scored 55.0.

Therefore:

> **More apparent compute did not buy better review in CR-BENCH-01.**

### Requests are not compute

GLM 5.3 made 235 requests yet consumed far less observed session
allowance than DeepSeek Pro's 59 final requests.

Therefore:

> **Request count is not a reliable proxy for compute appetite.**

The Factory metric that matters is closer to:

> **quality + cost + speed + human correction burden**

CR-BENCH-01 lacked normalized billing data, so it does not fabricate
dollar costs.

------------------------------------------------------------------------

## 12. Astra Referee Economics

Astra was separate from contestant economics.

GPT-6 Astra, High reasoning:

-   5-hour allowance: 100% left → 60% left
-   ≈40 percentage points consumed
-   weekly allowance: 85% left → 79% left
-   ≈6 percentage points consumed

This supports a plausible role separation: expensive high-reasoning
adjudication can be valuable at selected strategic gates without being
appropriate for every BIM.

------------------------------------------------------------------------

## 13. Referee Adjudication

Jarvis blind adjudication concluded:

**ACCEPT ASTRA REFEREE RESULT WITHOUT SCORE MODIFICATION**

Confidence:

**MEDIUM-HIGH**

### RF-001 --- Blinding Isolation Weakness

Before reading the referee prompt, Astra disclosed that an overly broad
file listing exposed identity-bearing contestant directory names.

Astra stated that the mapping was not inspected, original contestant
reports were not inspected, and no identity inference/matching was
attempted.

No material mapping contamination was established; the run was not
invalidated.

**vNext:** physically isolate the referee workspace so it contains only
authorized inputs.

### RF-002 --- Source-Independent Verification Limitation

The frozen referee design did not authorize target-source inspection.
Astra therefore adjudicated from anonymous reports, the scorecard, the
raw prompt, permitted generic documentation, and isolated checks.

This was **not an Astra protocol violation**, but it limits independent
authentication of exact source excerpts, installed versions, search
completeness, and reported command outcomes.

**vNext:** consider read-only access to an isolated frozen target for
the blind referee.

------------------------------------------------------------------------

## 14. Instrument Lessons

1.  **Freeze before the race.** Discoveries during execution belong to
    vNext.
2.  **Provenance matters.** Pin and independently verify the specimen.
3.  **Raw outputs are evidence.** Preserve them.
4.  **The operator is part of the trust boundary.** Log interventions.
5.  **Blind quality before economics.** Model reputation and cost should
    not influence technical scoring.
6.  **Physically isolate the referee.** Prompt-only isolation is weaker.
7.  **Referee the referee.** Adjudicators are fallible.
8.  **Evidence and severity are separate.**
9.  **Novel valid findings count.** No reference review is scripture.
10. **Root causes beat symptom counts.**
11. **Automated evidence is reproducible, not infallible.**
12. **Request count does not equal compute appetite.**
13. **Provider quota behavior is operational evidence.**
14. **Cost per useful review and human correction burden matter more
    than advertised token price.**
15. **Grade boundaries should be mathematically explicit for decimal
    scores.**
16. **Document status metadata must match actual freeze state.**

A useful doctrine line:

> **Evidence beats assertion. Reproducibility beats confidence.**

------------------------------------------------------------------------

## 15. What This Benchmark Proves --- and Does Not

### Supported

-   GLM 5.3 achieved the highest raw-review score among these six
    contestants.
-   GLM 5.3 Flash formed the same practical top tier and finished 2.8
    points behind.
-   GLM 5.3 Flash showed dramatically lower observed session-meter
    movement in this run.
-   Both GLM variants materially outperformed both DeepSeek variants,
    MiniMax, and Kimi under this instrument.
-   DeepSeek V4 Pro imposed the largest observed contestant operational
    burden and suffered a quota interruption.
-   No contestant demonstrated sufficient evidence to serve as sole
    principal sign-off authority.
-   Blinding successfully separated quality judgment from
    identity/economics.

### Not established

-   universal GLM superiority across repositories;
-   normalized dollar cost or compute efficiency;
-   statistical significance across repeated stochastic runs;
-   performance after receiving Stark reviewer doctrine;
-   deployed exploitability for every security finding;
-   that 76 is a ceiling on AI code-review quality.

------------------------------------------------------------------------

## 16. Factory Role Recommendation

### Routine BIM / FFM review --- GLM 5.3 Flash candidate

Proposed flow:

**Engineer → tests/regression → GLM 5.3 Flash review → justified
remediation → regression → QA → Gate Q**

Why: near-top raw quality plus a very favorable observed operational
profile.

This is a deployment hypothesis pending more benchmark validation.

### Phase review --- GLM 5.3 candidate

Use at phase completion to review accumulated implementation across
modules.

Why: highest raw quality and strongest overall balance of coverage,
root-cause reasoning, and verification judgment.

### Principal / strategic review --- GPT-6 Astra candidate

Reserve for high-risk authorization/security boundaries, architecture
challenges, release-level review, disputed findings, and benchmark
adjudication.

The goal is not Astra everywhere. It is stronger reasoning where
expected value justifies the expense.

### Risk triggers for escalation

Deeper review should be considered when changes touch
authentication/authorization, RLS or tenant boundaries, payments,
database migrations, external APIs, agent/tool authority, sensitive
persistence, concurrency, major cross-cutting state, large refactors, or
security-sensitive configuration.

Any remediation must preserve Factory regression discipline: targeted
verification plus the full existing test suite before closeout.

------------------------------------------------------------------------

## 17. Future Experiments --- Parked Until Round One Reporting Is Complete

### CR-BENCH-02 --- Championship / Expanded Field

Candidate field:

-   GLM 5.3
-   GLM 5.3 Flash
-   Fable
-   Sol

Purpose: compare the current top tier against additional premium
reviewers under a new frozen round.

### CR-BENCH-03 --- Stark Playbook Round

Potentially the more important experiment.

Question:

> **How much can a frozen Stark Code Reviewer Playbook improve these
> models beyond raw behavior?**

Potential doctrine to supply:

-   evidence ladder;
-   severity/evidence separation;
-   trust-boundary sweep;
-   state/concurrency sweep;
-   root-cause compression;
-   test-fidelity checks;
-   confidence labels;
-   false-positive controls;
-   review-role boundaries;
-   remediation/regression handoff.

A raw 73 or 76 is therefore a **baseline, not a demonstrated ceiling**.

------------------------------------------------------------------------

## 18. Final Decision

CR-BENCH-01 is complete.

**Quality winner:** GLM 5.3 --- 76.0 / B.

**Most important operational discovery:** GLM 5.3 Flash --- 73.2 / B- at
only +3.2 observed session percentage points in this run.

The experiment does not justify replacing senior engineering judgment
with a single model.

It **does** justify moving toward a tiered Factory review architecture
in which inexpensive independent review can occur frequently, stronger
review is reserved for phase boundaries, and principal-level reasoning
is reserved for strategic risk.

The larger lesson is that a disciplined harness can reveal differences
that model reputation, apparent size, request count, and compute
appetite do not predict reliably.

That is the real value of CR-BENCH-01.

------------------------------------------------------------------------

## Appendix A --- Canonical Results

  ----------------------------------------------------------------------------------------
       Rank Model          Score    Grade      Requests Session Δ  Weekly Δ Experimental
                                                                            Role
  --------- ---------- --------- ----------- ---------- --------- --------- --------------
          1 GLM 5.3         76.0      B             235  +26.5 pp   +4.7 pp Phase reviewer

          2 GLM 5.3         73.2     B-              58   +3.2 pp   +0.5 pp Tactical
            Flash                                                           BIM/FFM
                                                                            reviewer

          3 DeepSeek        55.0     C-              59 ≥+74.8 pp  +13.4 pp Narrow
            V4 Pro                                                          tactical only

          4 DeepSeek        54.6      D              76  +15.8 pp   +2.8 pp Security
            V4 Flash                                                        triage /
                                                                            supplemental

          5 MiniMax 3       45.4      D              79   +5.7 pp       N/A Supplemental
                                                                            tactical

          6 Kimi K2.7       40.8      F              88 ≈+10.0 pp       N/A Exploratory
            Code                                                            supplemental
  ----------------------------------------------------------------------------------------

------------------------------------------------------------------------

## Appendix B --- Measurement Caveats

Request-count reconciliation differences were preserved rather than
rewritten:

-   GLM 5.3 Flash: 57 in earlier notes versus 58 at reveal.
-   DeepSeek V4 Pro: 58 versus final 59.
-   MiniMax 3: 78 versus 79.
-   Kimi K2.7 Code: earlier notes unavailable versus 88 at reveal.

MiniMax's +5.7 pp and Kimi's ≈+10.0 pp session movements were
operator-derived from cumulative readings.

DeepSeek Pro's ≥74.8 pp adopts the reset-baseline assumption retained in
final cost analysis and is a lower bound because its first segment
reached the 100% session ceiling.

No monetary cost is inferred from these values.

------------------------------------------------------------------------

## Appendix C --- Integrity Summary

-   Pinned source provenance established.
-   Snapshot verified against fresh checkout.
-   Target `.git` excluded.
-   357-entry SHA-256 manifest.
-   Final target verification: 357/357 OK.
-   Six original contestant reports preserved.
-   Blind copies mechanically verified.
-   Blind mapping randomized.
-   Astra quality evaluation completed before reveal.
-   Economics withheld from referee.
-   Jarvis adjudication completed before reveal.
-   Astra scores accepted without modification.
-   Identity and economics reconnected only after blind adjudication.
-   Raw evidence preserved through final closeout.

**CR-BENCH-01 STATUS: CLOSED**
