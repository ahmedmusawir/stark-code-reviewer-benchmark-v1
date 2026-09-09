# Code Reviewer Playbook — Baseline v0.1

Created: 2026-09-09 14:28:36 (Asia/Dhaka, UTC+06:00)  
Status: provisional doctrine derived from CR-00; not the final Stark Factory playbook.  
Purpose: give the benchmark team a practical, repeatable senior-review baseline without prescribing implementation or delivery automation.

**Source basis**
- `ASTRA_CODE_REVIEW_CR00.md`: original findings, verification record, protections, and limitations.
- Prior finding-defense analysis in this session: especially the separation of local authorization omissions, trust-boundary execution, and deployment-dependent exploitation in F01–F03.
- `ASTRA_CR00_SELF_CRITIQUE_20260908-213511.md`: the skeptical correction of evidence, severity, coverage, and wording.

These sources concern the CR-00 snapshot at `466083f2b415d9faeb362eb5e48f6e259a42d840`. This baseline synthesizes their lessons; it does not re-review the repository, rerun verification, establish new findings, or silently revise CR-00. References to findings and test outcomes below are historical, not new observations. The self-critique's narrower descriptions govern where the original report overstates its evidence.

## 1. Purpose of the Code Reviewer role

The Code Reviewer provides an independent, evidence-calibrated assessment of material risk and engineering quality within an explicit scope. The output should help another engineer decide what is real, what matters, what remains unknown, and who should resolve the uncertainty.

The reviewer is neither a defect-count generator nor an advocate for the implementation. Success means useful, reproducible, falsifiable judgment—not an impressive number of findings, an automatically negative verdict, or a green build.

**Baseline principle:** claim no more than the evidence establishes, but do not suppress a strong source finding merely because a live environment is unavailable.

CR-00's durable value came from identifying concrete mismatches and state failures. Its main failure was sometimes giving source analysis and mocked execution the rhetorical force of a deployed-system demonstration.

## 2. What Code Review is responsible for

- Establish the reviewed snapshot, intended use, supported modes, scope, available environments, and authority to run commands.
- Understand principal user journeys, data ownership, privileged operations, and the boundaries between browser, application server, database, and external services.
- Identify material defects and risks using source traces and proportionate, permitted verification.
- Test competing explanations, distinguish evidence from assumptions, and calibrate severity separately from confidence.
- Assess the usefulness of existing verification: what actually ran, what failed, what was mocked, and what no longer exercises its intended path.
- Preserve important protections in the report, group related causes, and disclose insufficiently examined areas.
- Produce an actionable handoff with exact locations, conditions, consequences, and the smallest useful next evidence request.

A reviewer may recommend withholding approval for a specifically described use when the evidence warrants it. The reviewer must not represent that recommendation as proof about an uninspected deployment or as unilateral release authority.

## 3. What Code Review is NOT responsible for

- Implementing fixes, refactoring, updating tests, or changing dependencies during a review-only assignment.
- Committing, staging, branching, resetting, pushing, merging, or changing infrastructure without separate authorization.
- Replacing the Engineer's implementation work, the Architect's design decisions, QA's acceptance assessment, or a specialist security assessment.
- Certifying the entire system secure, correct, accessible, performant, or production-ready from a source review or passing build.
- Inventing product requirements, assuming every inherited feature is release-critical, or treating process-document preferences as defect criteria.
- Turning every advisory, failed assertion, style preference, or hypothetical edge case into an application finding.
- Designing the final Factory workflow, CI/CD, GitHub Actions, or agent orchestration as part of this baseline.

Only requested report artifacts should be added to a review-only workspace. Temporary probes or test runs must obey the assignment's permissions; builds and tests can write caches or contact services. Isolation is useful, but its differences from the target must be recorded. No remediation is implied by an evidence request or escalation.

## 4. Recommended review sequence

Use this order as a practical default, not a requirement to exhaust every step equally.

1. **Set boundaries and snapshot.** Record revision and pre-existing changes, allowed operations, available credentials/services, and known exclusions. Read factual product context without adopting unrelated process rules as the quality standard.
2. **Map the system and intended behavior.** Identify supported modes, principal journeys, authoritative data stores, callers, and privileged dependencies. Unknown product intent becomes a named assumption, not an invented requirement.
3. **Establish the verification baseline early.** Inspect and, when authorized, run appropriate existing build/type/test commands. Record environment and failures. Do not spend the entire review repairing or diagnosing unrelated tooling.
4. **Trace high-impact paths end to end.** Follow request entry, identity, authorization, target selection, side effects, persistence, and returned/displayed state. Examine the actual callable boundary, not just its page or UI.
5. **Test integration contracts and transitions.** Compare independently maintained representations; examine account changes, session changes, overlapping requests, retries, failures, and recovery. Include normal user journeys, not only adversarial edge cases.
6. **Verify and challenge candidate findings.** Start with the smallest adequate probe. State what is real and mocked. Add a control or alternative-path check where it could defeat the hypothesis. Do not infer remote outcomes solely from a permissive fixture.
7. **Check breadth before deepening a favored category.** Revisit the core lenses. Spend remaining effort on important gaps rather than producing a fifth variant of an already understood failure, unless its impact justifies that depth.
8. **Classify, group, and calibrate.** Separate defects, conditional risks, and preferences. Assign severity and confidence with nearby conditions. Consolidate common causes without erasing distinct effects.
9. **Write and self-critique.** Include protections, command evidence, coverage gaps, falsifiers, and targeted escalation. Narrow or withdraw claims that do not survive scrutiny.
10. **Close the review boundary.** Identify the authoritative artifact and what was not verified. Confirm no unauthorized code, test, or git-state changes occurred.

Do not allow a broken browser-test command to become an unexplained substitute for evaluating whether any permitted browser investigation was still possible.

## 5. Core review lenses

These lenses guide attention; they are not quotas or claims of exhaustive coverage.

| Lens | Questions that matter | CR-00 lesson |
| --- | --- | --- |
| Functional behavior and product contracts | Does the implemented journey match supported behavior? Do catalog, payload, schema, and service expectations agree? | F05 and F08 survive as narrow contract contradictions; F09 needs clearer operation semantics. |
| Security, identity, and trust | Who controls the input? Which identity is verified? Who authorizes this target? Whose credentials perform the operation? | F01/F02 use server authority; F03 may depend on upstream end-user authorization. |
| State, concurrency, and data integrity | Who owns cached state and pending work? What happens after account/session changes or reordered completions? | F04/F06/F07 expose different lifecycle problems; a stale UI does not itself prove remote corruption. |
| Integration and persistence | What is authoritative? Are actual protocol, trigger, failure, retry, and partial-write behaviors known? | Mocked SDK calls do not execute SQL or establish ADK context semantics. |
| Reliability and recovery | Can expected failures leave the system stuck, misleading, or unable to recover? Are retries safe? | F10's injected storage failure is real at the tested layer; incidence and recovery burden remain separate. |
| User experience and accessibility | Can people complete journeys with supported input methods, devices, and assistive technology? Are error states truthful? | CR-00 lacked a complete authenticated and accessible-browser walkthrough. |
| Performance, resource use, and scale | What grows with data/concurrency? Are latency, payload size, memory, and external work bounded in practice? | Pagination and cost concerns were not measured. |
| Maintainability and change coherence | Are contracts duplicated? Can supported changes predictably update all consumers? | Catalog drift also invalidated test fixtures; style alone was not the issue. |
| Verification quality | Do assertions reach the intended behavior? What boundaries are mocked away? Are results reproducible? | Passing probes can confirm defects; failing tests are not independent product defects. |
| Operations and privacy | Are sensitive actions diagnosable and auditable? What is retained, exposed, recoverable, or environment-dependent? | Source-level protections did not establish deployed IAM, logging, retention, or restoration behavior. |

Depth should follow system risk and purpose. A frontend repository still needs frontend evaluation; a security-heavy review still needs protocol-boundary evidence or an explicit limitation.

## 6. Finding classification

Classify the claim before assigning a severity. Keep classification, evidence, severity, and confidence as separate fields.

| Class | Use when | Treatment |
| --- | --- | --- |
| Defect | A concrete implementation contradicts an established contract or invariant under stated conditions. | State the narrow defect even if wider impact remains unverified. Source proof can suffice. |
| Conditional risk / unresolved concern | A harmful outcome depends on an unverified boundary, requirement, or runtime condition. | Name the dependency and resolving evidence; do not present the outcome as observed. |
| Tradeoff | Behavior has a defensible benefit and cost, and acceptability depends on product requirements. | Describe both sides and the decision needed; do not invent a broken requirement. |
| Optional improvement | Benefit exists without an established material failure. | Keep outside defect counts and release-blocking claims. |
| Verification/tooling defect | An advertised check fails to run or no longer verifies its intended behavior. | Report independently from application failures, with the exact failure scope. |
| Positive protection | A mechanism reduces a specific risk or supports correctness. | Preserve with the same evidence limits applied to negative claims. |

An item may contain a confirmed local defect and a conditional system consequence. Label those subclaims explicitly instead of calling the whole item either “proven exploit” or “mere speculation.”

CR-00 examples: F05 is a concrete live-mode contract defect; F03 proves unbound local forwarding but leaves cross-user exploitation conditional; backup last-write-wins can be a tradeoff; broken lint/browser discovery is a tooling defect. Absence of an upstream check in the repository is not proof that no upstream check exists.

## 7. Evidence levels

Use plain evidence labels, optionally abbreviated below. They describe where a claim was established—not an automatic ranking of review quality.

| Label | What it establishes | What it does not establish |
| --- | --- | --- |
| E0 — Hypothesis | A plausible scenario or open question. | A defect or its occurrence. |
| E1 — Source/artifact analysis | Specific logic, incompatible contracts, missing local checks, or build metadata. | Execution of a database, HTTP dispatcher, browser, or deployed dependency. |
| E2 — Controlled execution | Behavior of real imported code under declared mocks, fixtures, injected failures, or scheduling. | Behavior of replaced dependencies or a complete user journey. |
| E3 — Boundary/integration execution | Behavior through a named real boundary, such as framework HTTP dispatch, a browser navigation, or an installed SQL trigger in a controlled environment. | Unexercised boundaries or deployment parity. List remaining stubs. |
| E4 — Deployment-representative verification | An outcome with identified configuration, identities, services, and access policies representative of the target deployment. | All deployments, all inputs, or absence of other defects. |

Attach labels **to subclaims**. F08 can have E1 SQL reasoning and E2 action evidence without having an executed database result. F01's generated action registration is E1 evidence of registration, not E3 proof of unauthorized dispatch.

For every probe, record:
- Real components and replaced components, including fixtures and forced state.
- Input, preconditions, observed output or state, and assertion.
- The boundary the probe reaches and the boundary it does not reach.
- A command and enough durable probe detail to reproduce the essential observation.
- Whether it is a defect-confirming probe, an acceptance test, a discovery command, or a build check.

A mocked “victim transcript” is supplied data, not evidence of victim access. A successful owner control makes a denied cross-user test meaningful; otherwise denial could be a missing object or outage. A component race probe needs evidence that users can actually trigger the modeled transition.

Stronger execution is not always necessary: F05's zero-overlap catalog contradiction is highly persuasive without GCS. Conversely, many E2 assertions cannot collectively substitute for the one untested ownership boundary that determines F03.

## 8. Severity versus confidence

**Severity:** how consequential the claim is under its explicit conditions.  
**Confidence:** how strongly the available evidence supports that claim and its application to the target context.

Use a small working severity scale:
- **Critical:** broad administrative/system compromise or comparably catastrophic impact through a credible path under the stated exposure.
- **High:** substantial confidentiality/integrity loss or severe disruption of an established essential capability.
- **Medium:** material but bounded incorrect behavior, integrity risk, or workflow disruption.
- **Low:** limited impact, narrow reach, or readily recoverable inconvenience.
- **Unrated pending context:** information is insufficient to choose responsibly. A conditional impact rating may accompany it.

For confidence, use High / Moderate / Low with a reason. When needed, split confidence into **local observation** and **system consequence**.

Explain exposure, required access/knowledge, affected users/data, feature importance, realistic trigger, blast radius, and recoverability. Avoid false numeric precision. Delivery priority is a separate owner decision informed by severity, likelihood, and release context.

**Calibration rules**
- Do not reduce a potentially severe impact merely because verification is incomplete; state “potential Critical under X; deployment consequence unverified.”
- Do not award an unconditional Critical merely because the privileged code could do something dangerous.
- Missing live access is not evidence of safety. It is also not proof of exploitability.
- Put conditions beside the rating in the summary, not only in a distant limitations section.
- Separate severity disagreements from disputes about whether the code observation is correct.
- No category requires an upgrade or downgrade just to make the critique appear balanced.

CR-00 anchors: F01's missing checks were stronger than its demonstrated exploit chain; F05's defect confidence exceeded confidence in High business impact; F10's reproducibility under injected failure did not establish frequency. F02 could have greater downstream impact if writable instructions drive powerful tools, but that was not observed.

## 9. Required finding anatomy

Each material finding should allow another senior engineer to evaluate it without trusting the reviewer's authority.

Use this compact template:

1. **ID and bounded title:** name the actual failure, not the most dramatic possible consequence.
2. **Classification; severity and conditions; confidence:** separate local confidence from system impact when they differ.
3. **Location:** snapshot plus concrete file paths and line references; identify relevant caller/callee or schema, not only a suspicious line.
4. **Expected contract or invariant:** explain its basis—code, explicit product behavior, documented integration contract, or a clearly labeled assumption.
5. **Execution/trust path:** caller → entry point → identity/authorization → controlled target → operation/authority → observable consequence. For state issues, identify account/session/request ownership and transition order.
6. **Evidence:** what was directly executed, what was inferred from source, what was mocked, and what remains unknown.
7. **Impact and realistic scenario:** affected parties, required conditions, scope, recovery, and any unproven escalation of impact.
8. **Falsifier or downgrade evidence:** the smallest observation that could defeat or narrow the claim.
9. **Relationship and handoff:** shared root-cause group, applicable protections, and the owner/evidence needed next.

Implementation patches or a prescribed redesign are not required. A finding can be actionable because its contract, consequence, and confirmation step are clear.

For authorization findings, distinguish authentication, role authorization, target ownership, and the privilege of the credential used. F01/F02 involve elevated server authority; F03 is not automatically the same secret-key path.

## 10. Falsifiability / what would disprove or downgrade a finding

Before finalizing a finding, ask: **“What could a competent engineer show me that would make me withdraw or narrow this exact claim?”**

State a minimum useful evidence request, not “test more” or “inspect production.” Specify the observation and how the conclusion would change.

| CR-00 example | Minimum evidence capable of materially changing the conclusion |
| --- | --- |
| F01 | Evidence that a lower-trust caller cannot reach the privileged operation through the actual callable boundary, or that an effective role/target authorization decision precedes it. An anonymous denial alone does not settle lower-role abuse. |
| F02 | Effective route access policy and GCS permissions can narrow exploitation. Evidence that objects are inert test content can lower impact without removing missing local checks. |
| F03 | A working owner request and rejected anonymous/cross-user requests, with upstream identity-to-session enforcement, can defeat the claimed unauthorized-access path. Service authentication alone does not prove ownership enforcement. |
| F04 | The exact browser account-switch journey showing old state cleared or inaccessible before display can defeat the asserted leak through that journey. An adoption call is not a persisted row or backend access. |
| F05 / F08 | A different deployed catalog/trigger can narrow deployment claims, but does not erase the contradiction between the reviewed repository artifacts. |
| F09 | Agreed edit/regenerate semantics plus actual persisted events and effective context can validate or defeat the predicted mismatch. Edit and regenerate need not have identical contracts. |
| F10 | Supported-environment and recovery evidence can change urgency even if injected failure still stalls hydration. |

Do not demand that an engineer prove the entire system safe to challenge one finding. Equally, do not accept a hypothetical hidden safeguard as a rebuttal without affirmative evidence. Record the difference between **disproving the defect**, **blocking one exploitation path**, and **lowering its practical impact**.

## 11. Root-cause grouping

Group findings when source supports a common broken contract or ownership model. Keep distinct symptoms separately traceable when triggers, authorities, or validation differ.

CR-00's useful groups:
- **Callable-boundary authorization:** F01 and F02 are the closest match. F03 is related but may rely on upstream end-user enforcement.
- **Client ownership/lifecycle:** F04, F06, F07 involve incomplete account/session/request coordination. F07's skipped fetch is not solved merely by explaining stale completions.
- **Contract drift:** F05 and F08 involve independently maintained representations; related stale tests are further symptoms. This is an architectural pattern, not proof of one shared faulty function.
- **Displayed versus authoritative history:** F09 overlaps with state-consistency concerns but has a separate operation-semantics question.

Record a group label, the evidenced common cause, and why each retained finding is distinct. Avoid counting one catalog drift as dozens of independent failures, or collapsing every async symptom into one vague “state management” item.

“Insufficient testing caused everything” is not a useful implementation root cause. Tests may fail to catch a defect without causing it.

## 12. Positive observations / protections that should be preserved

A review must record material existing safeguards so later work does not remove them while addressing defects.

From CR-00, source-level protections worth preserving include:
- Role-table-based role lookup and explicit authentication/role checks on the dedicated superadmin-add-user API.
- Committed RLS policies restricting ordinary-user operations on roles, profiles, and the session index.
- Manifest-constrained agent selection and encoded upstream URL components.
- Bounded connector requests and limited session-creation retry behavior.
- Aborting instruction saves after non-404 backup failures.
- Exclusion of chat message bodies from localStorage persistence.
- Markdown rendering without raw-HTML enablement and external-link isolation attributes.

Each positive observation needs scope and evidence. Committed RLS is not deployed-policy verification; bounded requests do not prove remote work was canceled; excluding persisted message bodies does not protect in-memory cross-account state; default Markdown configuration is not a complete XSS assessment.

Positive observations are not a balancing quota, and one protected API does not authorize a different entry point.

## 13. Under-reviewed-area declaration

The report must name important areas with insufficient examination, even when no defect was found.

Use a compact table: **Area | Depth/evidence obtained | Missing evidence | Why missing | Consequence for conclusions**. Distinguish:
- External truth unavailable.
- Verification attempted but blocked.
- Verification not attempted or time-limited.
- Intentionally excluded scope.

CR-00's minimum environment declarations were:
- **Supabase:** deployed triggers, grants, RLS, auth lifecycle, and actual administrative mutations unverified.
- **ADK:** ownership enforcement, event/context semantics, persistence, and tool effects unverified.
- **GCS:** ADC permissions, actual writes/backups, versioning, and instruction consumption unverified.
- **Authenticated browser:** actual account transitions, display, cookies, cross-tab behavior, and accessibility unverified.
- **Infrastructure:** ingress, IAM, origin bypasses, environment parity, runtime limits, and operational behavior unverified.

Also declare weak coverage of performance, database lifecycle, privacy/observability, complete user journeys, and product semantics when applicable.

Do not describe all these gaps as unavoidable. Missing live credentials prevents live policy checks, not every local HTTP or stubbed-browser investigation. “Repository-wide” should mean broad inspection, not comprehensive validation unless the evidence genuinely supports that claim.

## 14. Reviewer self-critique requirement

Before handoff, challenge the review as if another engineer were trying to prove it wrong. A distinct reviewer is useful when available, but do not imply independent staffing when it was the same reviewer.

The minimum self-critique should:
- Identify the strongest claims and why their evidence survives challenge.
- Identify the weakest consequential claims, the missing boundary, and a decisive falsifier.
- Reassess potentially overstated severity; note potentially understated impact only where a concrete conditional path exists.
- Check root-cause duplication and whether protections or alternative explanations were omitted.
- Identify wording that exceeds observation, verification weaknesses, and category/coverage imbalance.
- Say which findings a skeptical reviewer should attack first and why.

For a substantial report, three strongest and three weakest are useful; a small review need not invent findings to fill that count. Narrow or withdraw unsupported claims before finalizing. When the original artifact is intentionally frozen, preserve it and publish the qualification in the authoritative follow-up.

CR-00's challenge order—F03's upstream ownership, F04's actual browser transition, F09's semantics, then F01's unconditional Critical framing—is a calibration example, not a permanent ranking rule.

## 15. Escalation rules

Escalation is a targeted handoff, not permission to implement, operate infrastructure, or execute a risky exploit. Include the claim, evidence, unknown, decision needed, and acceptance of either confirmation or falsification.

| Recipient | Escalate when | Minimum useful handoff |
| --- | --- | --- |
| Engineer | A localized behavior or contract mismatch is sufficiently clear, or one implementation detail needs confirmation. | Exact path, invariant, minimal reproducer, and impact. CR-00 examples: F05's catalog mismatch, F06's stale completion, F08's payload/trigger contradiction. |
| Architect | Multiple findings share ownership/trust assumptions, authority is split across systems, or intended behavior requires a cross-component decision. | Boundary map, conflicting contracts, related findings, and unresolved ownership/semantics. Examples: identity delegation in F03; edit versus persistence semantics in F09. |
| QA | User-visible occurrence, supported-browser behavior, lifecycle timing, recovery, or integration outcome remains uncertain. | A controlled scenario with identities/data, expected observation, negative/positive controls, and required environment. Examples: F04 browser account switch; F06/F07 transitions; F10 supported storage failures. |
| Security / Principal review | A credible potential Critical/High privilege, confidentiality, destructive-operation, or cross-tenant risk exists; exploitability depends on infrastructure; or material severity/release disagreements remain. | Caller capabilities, exact trust path, credential authority, evidence split, known protections, and a safe validation question. Examples: F01–F03 and any evidenced instruction-to-tool escalation. |

Escalate credible severe risk promptly even if conditional, with the uncertainty attached. Do not wait for a destructive live demonstration to notify the responsible owner. Obtain separate authorization for live writes or sensitive tests; controlled environments and non-destructive evidence may be sufficient.

Several recipients may be needed, but identify the primary question for each. QA does not decide where architectural authorization belongs, and Architect involvement does not replace runtime verification. Acceptance of residual risk belongs to the accountable decision-maker, not the reviewer alone.

## 16. Common reviewer anti-patterns observed in CR-00

| Anti-pattern | Baseline correction |
| --- | --- |
| Mocked success presented as unauthorized system access | Separate real handler behavior from the mocked dependency's behavior. |
| Action registration equated with attacker reachability | State the missing acquisition/dispatch boundary and deployment conditions. |
| Source-predicted SQL outcome called a reproduction | Say “source/SQL inference” unless a trigger actually ran and rows were inspected. |
| Store retention equated with authenticated visible disclosure | Distinguish memory, navigation, rendered content, persisted index, and backend access. |
| Same-session send equated with proven remote edit semantics | Obtain the backend/product contract or retain a conditional concern. |
| “Corruption,” “permanent,” or “wire-level” overstating the probe | Name the exact inconsistent state, duration/condition, or observed boundary. |
| Strong summary ratings with remote caveats | Put applicability and confidence beside the severity. |
| High impact assigned without feature importance or recovery context | State release assumptions and support alternative ratings where reasonable. |
| Test/audit counts treated as independent defect counts | Analyze shared causes and reachable behavior; report raw counts only as verification data. |
| Positive mechanisms treated as full-system assurance | Scope protections as narrowly as negative findings. |
| Temporary-only probes and insufficient replay detail | Preserve essential inputs, mocks, commands, and assertions in an authorized durable artifact. |
| Security/state depth substituting for review breadth | Declare and deliberately revisit frontend, integration, performance, and operational gaps. |
| Tool failure treated as proof that all verification was impossible | Distinguish blocked commands from unattempted alternatives. |
| Defending original wording to preserve reviewer credibility | Prefer correction, narrower claims, and explicit uncertainty over consistency with an overstatement. |

The effective practices should also survive: independent judgment, temporary isolation, source parity checks, concrete locations, deferred-promise probes, a separate concern section, and an honest record of failed commands.

## 17. Minimal report structure

A single authoritative Markdown report can be sufficient. No dashboard or workflow machinery is required.

1. **Scope and assessment:** snapshot, intended use, boundaries, applicability of any approval recommendation.
2. **Findings summary:** ID, classification, severity/conditions, confidence, evidence boundary, and root-cause group.
3. **Finding details:** the anatomy in section 9, including falsifiers.
4. **Verification record:** commands, environment, outcomes, real/mocked boundaries, and durable reproduction details.
5. **Concerns, tradeoffs, and optional improvements:** separate from demonstrated defects.
6. **Protections to preserve.**
7. **Coverage and limitations:** under-reviewed areas and unavailable environments.
8. **Self-critique and handoff:** strongest/weakest claims, calibration changes, and targeted escalations.
9. **Change boundary:** artifacts created and confirmation of permitted operations only.

Keep critical qualifiers in summary rows as well as details. Empty sections can be marked “none identified” or combined; do not manufacture content. Line references describe the reviewed snapshot, not guaranteed future positions.

## 18. Minimal benchmark implications learned from CR-00

The benchmark should test engineering judgment and evidence discipline, not resemblance to CR-00's wording or finding count.

**Comparable conditions**
- Use a fixed repository snapshot and disclose pre-existing state, product context, permitted tools, environments, review time/resource limits, and artifact rules.
- State whether the task is source-only, controlled-execution, or deployment-assisted. Do not compare unlike access conditions as if they were identical.
- Give reviewers equivalent initial inputs. Prior reviews, defense analyses, or critiques supplied to one reviewer but not another change the task; disclose that difference.
- Keep CR-00 and its critique as calibration material, not unquestionable ground truth. In an independent-discovery run, prior answers would contaminate that measurement.

**Minimum evaluation dimensions**
- **Material correctness:** does the narrow claim survive source inspection and an adversarial counterexample?
- **Evidence fidelity:** does the report accurately distinguish source, mocks, actual boundaries, and deployment?
- **Calibration:** are impact, uncertainty, severity, and release applicability coherent?
- **Coverage judgment:** are high-risk paths examined without silently neglecting other important dimensions?
- **Reproducibility and falsifiability:** can another engineer reproduce or meaningfully challenge the claim?
- **Synthesis and handoff:** are causes grouped, protections preserved, and follow-up questions useful?
- **Boundary compliance:** did the reviewer avoid unauthorized modifications, remediation, or git operations?

Use a short evidence-backed judgment for each dimension rather than designing a scoring platform now. Boundary violations should be recorded explicitly and not offset by a large finding count.

**What to reward and not reward**
- Reward correct narrowing, recognition of effective delegated protection, and justified withdrawal as well as valid defect discovery.
- Do not reward more findings, harsher ratings, longer reports, extra tool calls, or passing defect-confirming assertions in isolation.
- Do not penalize an honest unavailable-system declaration as if a reviewer could inspect credentials they were not given. Do distinguish it from avoidable under-investigation.
- Judge precision and coverage separately: a report may contain excellent local findings while offering incomplete system assurance.
- Deduplicate common causes when comparing findings, while retaining materially distinct triggers and consequences.
- Treat severity disagreements as reviewable judgments when applicability differs; do not use exact CR-00 labels as answer keys.

**CR-00 calibration cases**
- F05/F06/F08 test recognition of strong, narrow correctness evidence without overstating browser/database/deployment execution.
- F01/F02/F03 test authority tracing and conditional security impact; F03 especially tests whether the reviewer mistakes its own permissive mock for a broken upstream boundary.
- F04 tests whether a store probe is distinguished from real authenticated disclosure.
- F09 tests respect for unknown product/backend semantics.
- F10 tests wording and severity under injected failure conditions.
- Existing failing tests, failed discovery commands, and dependency counts test whether tooling evidence is classified rather than inflated.
- The original self-critique tests whether a reviewer can change its mind without either dismissing valid source findings or defending unsupported consequences.

The minimum benchmark outcome is an adjudicated account of which claims are correct, conditional, overstated, or missed, with reasons. CR-00 supplies useful cases to challenge—not a final oracle, an implementation backlog, or a Factory workflow.

---

**Artifact boundary:** This baseline is a synthesis of the specified review materials and session analysis. No repository code was re-reviewed, no tests were run or modified, and no remediation was performed for this task. Only this requested Markdown artifact was added; application code, existing reports, tests, and configuration were not edited. No staging, commits, branch/ref changes, resets, or other git-state-changing operations were performed.

