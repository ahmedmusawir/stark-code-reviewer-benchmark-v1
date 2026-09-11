<div align="center">

# STARK CODE REVIEWER BENCHMARK

### CR-BENCH-01 — Round One

**Six AI coding models. One frozen, real production-style codebase.**<br>
**One identical raw review prompt. One blind independent referee.**

<br>

| | |
|:--|:--|
| **Status** | ✅ COMPLETE / CLOSED |
| **Date** | 9–10 September 2026 |
| **Operator** | Tony Stark — Cyberize Engineering / Stark Industries App Factory |
| **Target** | `stark-ai-workbench-nextjs-frontend-v1` @ `466083f2` |
| **Referee** | GPT-6 Astra (High reasoning), blind · audited by Jarvis |

</div>

<br>

> ### 🏆 The result
>
> **Quality winner: GLM 5.3 — 76.0 / B**
>
> **Operational discovery: GLM 5.3 Flash — 73.2 / B-**
>
> Only **2.8 quality points** separated them. In this run, GLM 5.3 Flash moved the provider session meter **+3.2 percentage points** against **+26.5** for GLM 5.3.
>
> **Factory direction (hypothesis, not doctrine):** validate GLM 5.3 Flash for routine BIM / FFM review, GLM 5.3 for deeper phase review, and reserve GPT-6 Astra for strategic or high-risk gates.

<br>

**Jump to:**
[Why](#-why-this-benchmark-exists) ·
[Leaderboard](#-final-leaderboard) ·
[The Flash surprise](#-the-big-surprise--glm-53-flash) ·
[Usage](#-operational-usage) ·
[Scoring](#-what-the-reviewers-were-judged-on) ·
[Findings](#-what-they-actually-had-to-find) ·
[Profiles](#-model-profiles) ·
[Fairness](#-how-the-benchmark-stayed-fair) ·
[Referee](#-the-referee) ·
[Limitations](#-limitations) ·
[Factory decision](#-factory-decision) ·
[Proves / does not prove](#-what-cr-bench-01-proves--and-does-not) ·
[Next](#-next-experiments) ·
[Artifacts](#-benchmark-artifacts)

---

## 🎯 Why this benchmark exists

We were **not** asking:

> *"Which model can follow our reviewer checklist?"*

We were asking:

> **"Which model naturally behaves like the strongest senior code reviewer?"**

So Round One was deliberately **raw and uncoached**. Every contestant received the same frozen codebase and the same prompt, which told it to use independent senior engineering judgment. It had to decide on its own what deserved inspection, which findings mattered, how much verification was enough, how to calibrate severity, and when to admit uncertainty.

Contestants received **none** of the following:

| Withheld from every contestant | |
|:--|:--|
| ❌ Stark reviewer playbook | ❌ Expected defect list |
| ❌ Astra CR-00 reference findings | ❌ Scoring rubric or referee criteria |
| ❌ Mid-run coaching | ❌ Any other contestant's work |

That is why a score of 76 does not mean "76% of code-review capability." It means 76 weighted points under a demanding instrument that rewarded useful, evidenced findings and penalized misses, false positives, weak evidence, severity errors, poor confidence discipline, and noise.

---

## 🏁 Final leaderboard

Scored blind by GPT-6 Astra on review quality only. Accepted by Jarvis without score modification. Identities and economics were reconnected only afterwards.

| Rank | Model | Score | Grade | Blind referee role | Factory signal |
|:---:|:--|:---:|:---:|:--|:--|
| 🥇 **1** | **GLM 5.3** | **76.0** | **B** | Broad senior / phase reviewer; systems-review support | **Phase-review candidate** |
| 🥈 **2** | **GLM 5.3 Flash** | **73.2** | **B-** | Broad senior / phase reviewer | **Routine BIM / FFM candidate** |
| 3 | DeepSeek V4 Pro | 55.0 | C- | Tactical portal / auth-provisioning reviewer | Not supported as primary reviewer |
| 4 | DeepSeek V4 Flash | 54.6 | D | Security-focused triage reviewer | Possible supplemental security triage (verification required) |
| 5 | MiniMax 3 | 45.4 | D | Tactical migration / module reviewer | Supplemental tactical only |
| 6 | Kimi K2.7 Code | 40.8 | F | Exploratory UI / integration reviewer | Exploratory supplemental pass only |

**Two close calls the referee flagged, preserved here on purpose:**

- **GLM 5.3 vs GLM 5.3 Flash is a 2.8-point comparison, not a categorical gap.** Finding Validity carries weight 15, so a one-point reassessment there moves three weighted points and could reverse the order.
- **DeepSeek V4 Pro vs DeepSeek V4 Flash is effectively a tie at 0.4 points.** The C- / D boundary makes the difference look larger than it is. Grade bands were applied to unrounded totals with lower-bound thresholds, so 54.6 stays D.

The blind roles are Astra's behavior-based labels for the reports it read. They are not claims about intrinsic capability. **No contestant demonstrated sufficient evidence to serve as sole principal-level sign-off authority.**

---

## ⚡ The big surprise — GLM 5.3 Flash

GLM 5.3 won. That was not the headline.

<table>
<tr>
<th align="left">GLM 5.3 — the winner</th>
<th align="left">GLM 5.3 Flash — the discovery</th>
</tr>
<tr>
<td>

**76.0 / B**<br>
235 requests<br>
+26.5 pp observed session usage

</td>
<td>

**73.2 / B-**<br>
58 requests<br>
+3.2 pp observed session usage

</td>
</tr>
</table>

In this run, GLM 5.3 Flash produced **roughly 96% of the winner's quality score** while its observed session-meter movement was **roughly 12% of GLM 5.3's movement**.

> ⚠️ **These ratios are descriptive only.** They compare provider-displayed meter movements from one run. They are **not** normalized compute ratios and **not** dollar-cost ratios.

**Why this matters to the Factory.** Independent senior-grade review has been treated as an expensive, occasional event. If near-top review quality is available at this operational profile, then **review on every BIM / FFM may become economically realistic** instead of exceptional. That would change the shape of the Factory pipeline, not just the model choice.

**What this is.** A deployment hypothesis backed by one controlled run. Astra itself called the 2.8-point gap reversible by a single one-point validity change. Further rounds must confirm it on more specimens before it becomes doctrine.

---

## 📊 Operational usage

Operator-observed Ollama Cloud dashboard readings taken at run boundaries. Quality scores are shown for context only. Economics played **no part** in blind scoring.

| Model | Score | Requests | Session Δ | Weekly Δ | Incident / note |
|:--|:---:|:---:|:---:|:---:|:--|
| GLM 5.3 | 76.0 | 235 | +26.5 pp | +4.7 pp | — |
| **GLM 5.3 Flash** | **73.2** | **58** | **+3.2 pp** | **+0.5 pp** | — |
| DeepSeek V4 Pro | 55.0 | 59 | **≥ +74.8 pp** (lower bound) | +13.4 pp | ⚠️ **HTTP 429 quota interruption**; ≈ 1.5 h observed recovery; required two quota windows; session meter hit 100% |
| DeepSeek V4 Flash | 54.6 | 76 | +15.8 pp | +2.8 pp | — |
| MiniMax 3 | 45.4 | 79 | +5.7 pp | N/A | Session delta operator-derived from cumulative readings; no pre-run weekly reading |
| Kimi K2.7 Code | 40.8 | 88 | ≈ +10.0 pp (approximate) | N/A | Session delta approximate, operator-observed; no pre-run weekly reading |

> ⚠️ **Read the units correctly.** Percentage-point (pp) values are provider-displayed operational meters. They are **not** token counts, **not** dollars, **not** normalized compute, and **not** benchmark scores. No monetary cost is inferred anywhere in CR-BENCH-01.

**Two lessons this table teaches:**

- **Request count is not compute appetite.** GLM 5.3 made 235 requests for +26.5 pp. DeepSeek V4 Pro made 59 requests for ≥ +74.8 pp, hit the session ceiling, and stalled the harness.
- **More apparent compute did not buy better review.** The most operationally demanding contestant finished third at 55.0. The lightest observed reviewer finished second at 73.2.

<details>
<summary><strong>Measurement caveats (preserved, not rewritten)</strong></summary>

<br>

- Request counts for three contestants differ by +1 between closeout run notes and reveal-time dashboard readings (GLM 5.3 Flash 57 → 58, DeepSeek V4 Pro 58 → 59, MiniMax 3 78 → 79). Kimi's count was unavailable at closeout and supplied at reveal (88). Both columns are preserved in the cost analysis.
- MiniMax's +5.7 pp and Kimi's ≈ +10.0 pp were derived by the operator from cumulative readings.
- DeepSeek V4 Pro's ≥ +74.8 pp combines two segments (≥ 54.6 capped at the 100% ceiling, then 20.2) and assumes the quota reset returned the meter to 0%. It is a lower bound.
- Token counts, API dollar cost, and wall-clock time were unavailable for every contestant run and are not estimated.
- The referee ran on a different provider and meter. Astra consumed ≈ 40 percentage points of a 5-hour allowance and ≈ 6 of a weekly allowance. That is referee cost, not contestant evidence, and is not comparable to the table above.

Full record: [`reports/COST_ANALYSIS.md`](reports/COST_ANALYSIS.md)

</details>

---

## 📐 What the reviewers were judged on

The frozen scorecard used **twelve dimensions**, each scored 0–5 and weighted to a **100-point** total.

| # | Dimension | Weight |
|:---:|:--|:---:|
| A | Finding Validity | **15** |
| B | Important-Issue Coverage | **15** |
| C | Evidence Quality | 10 |
| D | Severity Calibration | 7 |
| E | Confidence / Epistemic Discipline | 7 |
| F | Security / Trust-Boundary Reasoning | 8 |
| G | Logic / State / Concurrency Reasoning | 8 |
| H | Architecture / Root-Cause Reasoning | 8 |
| I | Test-Quality Reasoning | 6 |
| J | Scope Discipline / Signal-to-Noise | 5 |
| K | Operational Usefulness | 6 |
| L | Independent Reviewer Judgment | 5 |
| | **Total** | **100** |

**Raw finding count could not win this benchmark.** False positives, important misses, weak evidence, inflated severity, and duplicated symptoms all cost points. A smaller, precise report could and did outperform a larger speculative one.

<details>
<summary><strong>Finding classification, evidence ladder, and grade bands</strong></summary>

<br>

Every substantive block was adjudicated as **VALID**, **PARTIALLY VALID**, **INVALID**, **DUPLICATE / SAME ROOT CAUSE**, or **NOT ADJUDICABLE**.

Evidence strength was scored **separately** from severity:

| Level | Meaning |
|:---:|:--|
| E1 | Source evidence |
| E2 | Isolated reproduction |
| E3 | Integrated local reproduction |
| E4 | Real-service reproduction |
| E5 | Deployed reproduction |

A severe issue may initially carry source-only evidence. A thoroughly reproduced issue may still be low severity. That separation penalized reviewers who turned every concern into a crisis.

| Grade | Score | Grade | Score |
|:---:|:---:|:---:|:---:|
| A+ | 95–100 | C+ | 65–69 |
| A | 90–94 | C | 60–64 |
| A- | 85–89 | C- | 55–59 |
| B+ | 80–84 | D | 45–54 |
| B | 75–79 | F | below 45 |
| B- | 70–74 | | |

Letter grades summarize the weighted result. They do not replace the evidence.

Full instrument: [`EVAL_SCORECARD.md`](EVAL_SCORECARD.md)

</details>

---

## 🔍 What they actually had to find

Astra consolidated all six reports into **21 issue families** and adjudicated **120 substantive blocks**:

| 120 blocks | 73 VALID | 29 PARTIAL | 4 INVALID | 4 NOT ADJUDICABLE | 10 DUPLICATE / SAME ROOT |
|:---:|:---:|:---:|:---:|:---:|:---:|

The families that separated strong reviewers from weak ones:

| ID | Issue family | Verdict | Severity |
|:---:|:--|:---:|:--|
| **L01** | Privileged actions omit caller authorization | ✅ VALID | 🔴 **CRITICAL** |
| **L02** | Target-user restrictions are UI-only | ✅ VALID | 🟠 HIGH |
| **L03** | Agent run / history lack identity and ownership binding | ✅ VALID | 🟠 HIGH |
| **L04** | Instruction GET / PUT lack authorization | ✅ VALID | 🟠 HIGH (potentially CRITICAL downstream) |
| **L05** | Manifest / UI / mocks / tests disagree | ✅ VALID | 🟡 Mixed: HIGH live Mission Control failure · MEDIUM test gate · LOW mock degradation |
| **L06** | Account creation / trigger contract mismatch | ✅ VALID | 🟡 Mixed: MEDIUM selected-role loss · LOW blank-name behavior |

**L01 was the benchmark's most important root issue.** Used privileged server actions could perform high-impact user administration without adequate caller authorization. Missing it was the single most expensive omission in the field.

**L05 was found by all six.** The difference was what they did with it. Stronger reviewers traced the drift into live application behavior and compressed duplicate symptoms into one shared root. Weaker reviewers counted failures.

Other families covered fetch-error state becoming saveable content, client edits versus upstream transcript persistence, stale cloud-storage copies, concurrent writes, optimistic archive rollback, shared-profile navigation, conditional role demotion, listing scalability, timestamp identifiers, test-harness fidelity, dead code, and lower-severity UI and configuration issues.

> ### The scoring lesson
> **Root-cause compression beats finding volume.** The benchmark rewarded evidence and judgment, not verbosity.

---

## 🃏 Model profiles

Six models, six review personalities. Block counts are Astra's per-report adjudication tallies.

<table>
<tr>
<td width="50%" valign="top">

### 🥇 GLM 5.3 — 76.0 / B

**Blind role:** Broad senior / phase reviewer; systems-review support<br>
**Blocks:** 22 total · 17 valid · 5 partial · 0 invalid · 1 fully valid unique contribution

**What worked**<br>
Best balance of coverage, root-cause reasoning, test-harness fidelity, and verification judgment. Separated private-index privacy from transcript protection. Handled cookie design accurately and covered concurrent writes.

**What held it back**<br>
Some secondary claims escaped full verification (cross-user collisions, UI deletion, role-metadata advice). Missed the precise live Mission Control 400 path.

**Likely role:** Phase-review candidate. Not established as sole principal sign-off.

</td>
<td width="50%" valign="top">

### 🥈 GLM 5.3 Flash — 73.2 / B-

**Blind role:** Broad senior / phase reviewer<br>
**Blocks:** 20 total · 15 valid · 3 partial · 1 invalid · 1 not adjudicable · 2 fully valid unique contributions

**What worked**<br>
Strongest cross-layer application and state reasoning. Connected UI protection, endpoint exposure, mock/live drift, schema contract, and transcript ownership. Traced the live Mission Control failure path best.

**What held it back**<br>
Incorrect cookie / SSR advice and unsafe role-remediation assumptions. One real false positive.

**Likely role:** Routine BIM / FFM review candidate, pending validation on more specimens.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 3 · DeepSeek V4 Pro — 55.0 / C-

**Blind role:** Tactical portal / auth-provisioning reviewer<br>
**Blocks:** 9 total · 7 valid · 2 partial · 0 invalid

**What worked**<br>
Concise and relatively precise inside its chosen scope, especially privileged actions and provisioning contracts. Its small report needed comparatively little correction.

**What held it back**<br>
Missed the major agent run / history and instruction-write trust boundaries. Operationally the worst contestant: 100% session quota, HTTP 429, ≈ 1.5 h recovery, two quota windows.

**Likely role:** Not supported as a primary Stark reviewer by this round.

</td>
<td width="50%" valign="top">

### 4 · DeepSeek V4 Flash — 54.6 / D

**Blind role:** Security-focused triage reviewer<br>
**Blocks:** 21 total · 12 valid · 3 partial · 1 invalid · 5 duplicate

**What worked**<br>
Found consequential exposed privileged surfaces, including issues Pro missed. Broader important security coverage than Pro.

**What held it back**<br>
Severity inflation (six CRITICAL headings), duplicated roots, weaker claim control, and an invalid redirect mechanism. 0.4 points behind Pro is effectively a tie.

**Likely role:** Possible supplemental security triage, with a verifier checking mechanisms and severity first.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 5 · MiniMax 3 — 45.4 / D

**Blind role:** Tactical migration / module reviewer<br>
**Blocks:** 26 total · 13 valid · 8 partial · 0 invalid · 1 not adjudicable · 4 duplicate · 2 fully valid unique contributions

**What worked**<br>
Useful migration, manifest, fixture, archive-transition, state, and concurrency observations. Unique archive-rollback finding.

**What held it back**<br>
Over-invested in low-impact cleanup and speculation. Labeled cleanup items CRITICAL. Missed important agent trust boundaries.

**Likely role:** Supplemental tactical reviewer, not primary authority.

</td>
<td width="50%" valign="top">

### 6 · Kimi K2.7 Code — 40.8 / F

**Blind role:** Exploratory UI / integration reviewer<br>
**Blocks:** 22 total · 9 valid · 8 partial · 2 invalid · 2 not adjudicable · 1 duplicate · 1 fully valid unique contribution

**What worked**<br>
A unique, valid shared-profile navigation defect and useful build / test evidence.

**What held it back**<br>
Central framework and security assertions included invalid or unresolved claims. Missed the CRITICAL caller-authorization root and prioritized a middleware "fix" incorrectly.

**Likely role:** Exploratory supplemental pass only.

</td>
</tr>
</table>

> **The thing model reputation did not predict.** The most operationally demanding contestant did not win. The lightest observed reviewer nearly did. That is exactly why the benchmark was blinded and why economics were reconnected only after technical scoring.

---

## ⚖️ How the benchmark stayed fair

A benchmark cannot compare reviewers if the code changes between runs, if one contestant sees more than another, or if the judge knows who wrote what. CR-BENCH-01 controlled all three.

### The specimen

| Control | Observed |
|:--|:--|
| Pinned source commit | `466083f2b415d9faeb362eb5e48f6e259a42d840` |
| Snapshot verification | Fresh checkout compared recursively, `.git` excluded. One missing file (`BACKEND_SWAP_NOTES.md`) restored from the verified checkout, then re-compared with no output. |
| Integrity manifest | 357-entry SHA-256 manifest |
| Final verification | **357 / 357 OK**, re-checked at every closeout through reveal |
| Mutability | Dead snapshot. Nothing inside `target/` changed after freeze. |

### The track

- **Same frozen target** and **same substantive raw prompt** for all six contestants.
- **Review-only boundary.** Contestants could inspect, search, reason, and run non-destructive verification. They could not repair, refactor, change tests, alter dependencies, or perform git writes.
- **No leakage.** No contestant saw another contestant's work, Astra's CR-00 findings, Stark doctrine, expected defects, or scoring criteria.
- **Originals preserved.** Each completed review report was hashed at closeout and never improved after the fact. All six hashes still match.
- **Operator interventions logged.** The only intervention per run was the mechanical launch instruction. The operator is part of the benchmark system.

### The blind

<table>
<tr>
<td align="center"><b>1</b><br>Six original reports<br>hashed and preserved</td>
<td align="center">→</td>
<td align="center"><b>2</b><br>Randomized to<br><code>REVIEWER_A</code> … <code>REVIEWER_F</code><br>identity-only redaction</td>
<td align="center">→</td>
<td align="center"><b>3</b><br>Astra scores quality<br>with identities and<br>economics withheld</td>
<td align="center">→</td>
<td align="center"><b>4</b><br>Astra report frozen;<br>Jarvis audits blind</td>
<td align="center">→</td>
<td align="center"><b>5</b><br>Mapping opened;<br>economics reconnected</td>
</tr>
</table>

Blinding replaced one or two identity-bearing lines per report (one report needed none) with a neutral marker. Each blinded file was diffed line-by-line against its original with **zero unexplained differences**. A post-blinding scan of the blind package for all four model-family names returned zero occurrences.

Astra's package excluded model identities, request counts, quota behavior, preliminary rankings, other contestant material, and Astra's own prior CR-00 work. The mapping was opened by the operator only after the Jarvis adjudication was committed.

---

## 🧑‍⚖️ The referee

**GPT-6 Astra, High reasoning, served as the blind referee.** It received a frozen prompt authorizing only the six blind reports, the scorecard, and the raw prompt template.

Astra was told to **judge the reviewers, not re-review the application.** It had to consolidate issue families, adjudicate validity and severity, name false positives and important misses, credit novel valid findings, separate evidence from speculation, score all twelve dimensions, explain close calls, assign behavior-based roles, and disclose its own uncertainty.

> **Astra was not treated as scripture.** Novel valid findings counted. Agreement with Astra's earlier CR-00 work was explicitly **not** the answer key, and that work was withheld from the referee.

**Jarvis then audited Astra while identities remained sealed.**

| Jarvis blind adjudication | |
|:--|:--|
| **Verdict** | **ACCEPT ASTRA REFEREE RESULT WITHOUT SCORE MODIFICATION** |
| **Blind ranking accepted** | F > C > B > D > A > E |
| **Confidence** | **MEDIUM-HIGH** |
| **Identities used** | None |
| **Economics used** | None |
| **Scores changed** | None |

<details>
<summary><strong>Blind-to-model mapping (opened after adjudication freeze)</strong></summary>

<br>

| Blind ID | Model | Blind score |
|:---:|:--|:---:|
| REVIEWER_A | MiniMax 3 | 45.4 |
| REVIEWER_B | DeepSeek V4 Pro | 55.0 |
| REVIEWER_C | GLM 5.3 Flash | 73.2 |
| REVIEWER_D | DeepSeek V4 Flash | 54.6 |
| REVIEWER_E | Kimi K2.7 Code | 40.8 |
| REVIEWER_F | GLM 5.3 | 76.0 |

Assignment was a random shuffle, not alphabetical, run order, or any capability attribute. Source: [`referee/BLIND_MAPPING.md`](referee/BLIND_MAPPING.md)

</details>

---

## ⚠️ Limitations

These are carried forward openly. Neither procedural finding invalidated the round, and neither justified retroactive score changes.

### RF-001 — Referee workspace isolation weakness

Before reading the referee prompt, Astra ran an overly broad file listing that exposed **identity-bearing contestant directory names**. Astra self-disclosed this immediately.

- The mapping file was **not** inspected.
- The original contestant reports were **not** inspected.
- No identity inference or matching was attempted.
- Jarvis: procedural weakness, **no demonstrated mapping contamination**, result accepted.
- **vNext:** physically isolate the referee workspace so it contains only authorized inputs. Prompt-only isolation is weaker than physical isolation.

### RF-002 — Target-source verification limitation

The frozen referee protocol did **not** authorize Astra to inspect the target source. Astra adjudicated from the anonymous reports, the scorecard, the raw prompt, permitted generic documentation, and isolated checks on snippets already in the reports.

- This was **not an Astra protocol violation.** It followed the design it was given.
- It limits independent verification of exact source excerpts, installed versions, search completeness, and reported command outcomes at the finding level.
- **vNext:** consider read-only access to an isolated frozen target for the blind referee.

### Scope limits on everything above

| | |
|:--|:--|
| **One repository** | Domain transfer is untested. |
| **One benchmark round** | One run per contestant. No repeat-run variance measured. |
| **One referee** | Astra scored; Jarvis audited. No second independent scorer. |
| **No statistical claim** | Two of five adjacent-rank gaps (1–2 and 3–4) sit inside the referee's own stated one-dimension sensitivity. |
| **No universal-superiority claim** | Results describe this specimen under this raw protocol. |
| **No normalized cost claim** | Meter movements are provider gauges. No dollar figure exists in this record. |

---

## 🏭 Factory decision

CR-BENCH-01 does **not** justify replacing senior engineering judgment with a single model. It **does** justify moving toward a tiered review architecture in which inexpensive independent review happens often, stronger review is reserved for phase boundaries, and principal-level reasoning is reserved for strategic risk.

> 🧪 **Everything in this section is a benchmark-derived deployment hypothesis. It is not yet permanent Factory doctrine.**

### Proposed experimental operating model

| Tier | Reviewer candidate | Why |
|:--|:--|:--|
| **Routine BIM / FFM review** | **GLM 5.3 Flash** | 73.2 raw quality plus the strongest observed efficiency signal in the field |
| **Phase completion review** | **GLM 5.3** | Highest raw score; broadest senior / systems-review behavior; best balance of coverage, root cause, and verification judgment |
| **Strategic / high-risk / disputed findings** | **GPT-6 Astra** | Principal challenge and adjudication where expected value justifies the expense |

The goal is not Astra everywhere. It is stronger reasoning where it pays for itself.

### Proposed routine flow

<table>
<tr>
<td align="center"><b>Engineer</b></td>
<td align="center">→</td>
<td align="center"><b>Tests / regression</b></td>
<td align="center">→</td>
<td align="center"><b>GLM 5.3 Flash review</b></td>
<td align="center">→</td>
<td align="center"><b>Justified remediation</b></td>
<td align="center">→</td>
<td align="center"><b>Regression</b></td>
<td align="center">→</td>
<td align="center"><b>QA</b></td>
<td align="center">→</td>
<td align="center"><b>Gate Q</b></td>
</tr>
</table>

Any remediation keeps Factory regression discipline: targeted verification plus the full existing test suite before closeout.

### Escalate to deeper review when a change touches

| | | |
|:--|:--|:--|
| 🔒 Authentication / authorization | 🔒 RLS or tenant boundaries | 💳 Payments |
| 🗄️ Database migrations | 🌐 External APIs | 🤖 Agent / tool authority |
| 💾 Sensitive persistence | 🔀 Concurrency | 🧩 Major cross-cutting state |
| 🏗️ Large refactors | ⚙️ Security-sensitive configuration | |

Full reasoning and per-model limits: [`reports/MODEL_ROLE_RECOMMENDATIONS.md`](reports/MODEL_ROLE_RECOMMENDATIONS.md)

---

## ✅ What CR-BENCH-01 proves — and does not

<table>
<tr>
<th align="left" width="50%">✅ Supported by this round</th>
<th align="left" width="50%">❌ Not proven by this round</th>
</tr>
<tr>
<td valign="top">

- GLM 5.3 achieved the highest raw-review score among these six contestants.
- GLM 5.3 Flash formed the same practical top tier, 2.8 points behind.
- GLM 5.3 Flash produced a major observed efficiency signal in this run.
- Both GLM variants materially outperformed both DeepSeek variants, MiniMax 3, and Kimi K2.7 Code under this instrument.
- DeepSeek V4 Pro imposed the greatest observed operational burden and suffered the round's only quota interruption.
- No open contestant demonstrated sole principal-signoff quality.
- Blinding successfully separated quality judgment from identity and economics.

</td>
<td valign="top">

- Universal GLM superiority across repositories.
- Normalized dollar cost or compute efficiency.
- Statistical significance across repeated stochastic runs.
- Performance after receiving Stark reviewer doctrine (playbook-assisted review).
- Deployed exploitability for every security finding.
- That 76 is a ceiling on AI code-review quality.

</td>
</tr>
</table>

---

## 🔭 Next experiments

> 🚧 **FUTURE WORK — NOT PART OF ROUND ONE.** Nothing below is in this record. Parked until Round One reporting is complete.

### CR-BENCH-02 — Championship / expanded field

Compare the current top tier against additional premium reviewers under a new frozen round.

Potential field: **GLM 5.3 · GLM 5.3 Flash · Fable · Sol**

### CR-BENCH-03 — Stark Code Reviewer Playbook Round

Potentially the more important experiment.

> **Can engineered review doctrine turn raw 73 / 76 performance into materially stronger reviewer performance?**

Candidate doctrine to supply: evidence ladder, severity / evidence separation, trust-boundary sweep, state / concurrency sweep, root-cause compression, test-fidelity checks, confidence labels, false-positive controls, review-role boundaries, and remediation / regression handoff.

A raw 73 or 76 is a **baseline, not a demonstrated ceiling.**

---

## 📁 Benchmark artifacts

Everything below is in this repository. Evidence files were preserved as written and are not edited after closeout.

### Start here

| Artifact | What it is |
|:--|:--|
| [`STARK_CODE_REVIEWER_BENCHMARK_ROUND_ONE_EXECUTIVE_BRIEF_v3.pdf`](STARK_CODE_REVIEWER_BENCHMARK_ROUND_ONE_EXECUTIVE_BRIEF_v3.pdf) | Eight-page executive decision brief |
| [`STARK_CODE_REVIEWER_BENCHMARK_ROUND_ONE_REPORT.md`](STARK_CODE_REVIEWER_BENCHMARK_ROUND_ONE_REPORT.md) | Full detailed Round One report |

### Final results

| Artifact | What it is |
|:--|:--|
| [`reports/FINAL_SCORECARD.md`](reports/FINAL_SCORECARD.md) | Unblinded canonical ranking with close-call caveats |
| [`reports/COST_ANALYSIS.md`](reports/COST_ANALYSIS.md) | Operational usage evidence, quota incident, reconciliation table |
| [`reports/MODEL_ROLE_RECOMMENDATIONS.md`](reports/MODEL_ROLE_RECOMMENDATIONS.md) | Per-model Factory role hypotheses and their limits |
| [`reports/ROUND_ONE_REPORT.md`](reports/ROUND_ONE_REPORT.md) | Scribe's labeled record of the round (FACT / ASTRA / JARVIS / FACTORY / HYPOTHESIS) |

### Referee and adjudication

| Artifact | What it is |
|:--|:--|
| [`referee/ASTRA_REFEREE_REPORT.md`](referee/ASTRA_REFEREE_REPORT.md) | Raw blind referee report, preserved (issue families, per-dimension scores, close calls, uncertainty) |
| [`referee/JARVIS_ADJUDICATION.md`](referee/JARVIS_ADJUDICATION.md) | Blind adjudication of the referee result |
| [`referee/ASTRA_REFEREE_PROMPT.md`](referee/ASTRA_REFEREE_PROMPT.md) | The frozen referee prompt |
| [`referee/ASTRA_INPUT_MANIFEST.md`](referee/ASTRA_INPUT_MANIFEST.md) | Exactly what the referee was permitted to receive, with hashes |
| [`referee/BLIND_FIDELITY_REPORT.md`](referee/BLIND_FIDELITY_REPORT.md) | Line-by-line proof that blinding changed only identity text |
| [`referee/BLIND_REDACTION_LOG.md`](referee/BLIND_REDACTION_LOG.md) | Which lines were redacted in each report |
| [`referee/BLIND_MAPPING.md`](referee/BLIND_MAPPING.md) | Blind ID → contestant mapping, opened after adjudication |
| [`referee/blind/`](referee/blind/) | The six anonymized reports the referee actually read |

### Instrument and provenance

| Artifact | What it is |
|:--|:--|
| [`BENCHMARK_RULES.md`](BENCHMARK_RULES.md) | Benchmark Rules v1.0 — frozen before Candidate #1 |
| [`EVAL_SCORECARD.md`](EVAL_SCORECARD.md) | Evaluation Scorecard v1.0 — the twelve dimensions and weights |
| [`BENCHMARK_BRIEF.md`](BENCHMARK_BRIEF.md) | Target identity, provenance verification, roster, instrument freeze |
| [`TARGET_MANIFEST.sha256`](TARGET_MANIFEST.sha256) | 357-entry SHA-256 manifest of the frozen target |
| [`RUN_ORDER.md`](RUN_ORDER.md) | Contestant run order, recorded before Candidate #1 |
| [`templates/REVIEW_PROMPT.template.md`](templates/REVIEW_PROMPT.template.md) | The raw contestant prompt every model received |
| [`target/stark-ai-workbench-nextjs-frontend-v1/`](target/stark-ai-workbench-nextjs-frontend-v1/) | The frozen target snapshot |

### Contestant evidence

Each directory holds the prompt as issued, the original review report, run notes, closeout report, and evaluation entry.

[`contestants/glm-5.3/`](contestants/glm-5.3/) ·
[`contestants/glm-5.3-flash/`](contestants/glm-5.3-flash/) ·
[`contestants/deepseek-v4-pro/`](contestants/deepseek-v4-pro/) ·
[`contestants/deepseek-v4-flash/`](contestants/deepseek-v4-flash/) ·
[`contestants/minimax-3/`](contestants/minimax-3/) ·
[`contestants/kimi-k2.7-code/`](contestants/kimi-k2.7-code/)

### Reference

[`reference/astra/`](reference/astra/) — Astra's earlier CR-00 raw review package. Withheld from every contestant and from the blind referee. Not the answer key.

---

<div align="center">

<br>

> ### **Evidence beats assertion. Reproducibility beats confidence.**

<br>

**CR-BENCH-01 — CLOSED**

<sub>Stark Industries App Factory · Cyberize Engineering · September 2026</sub>

</div>
