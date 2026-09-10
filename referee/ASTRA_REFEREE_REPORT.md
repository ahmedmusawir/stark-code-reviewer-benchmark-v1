# CR-BENCH-01 — Blind Referee Report

Evaluation date: 2026-09-10. Status: COMPLETE, with the evidence limits below.

## A. Referee Executive Summary

All six anonymous reports were evaluated against the twelve dimensions and exact weights in EVAL_SCORECARD.md. The ranking is REVIEWER_F, REVIEWER_C, REVIEWER_B, REVIEWER_D, REVIEWER_A, REVIEWER_E. F and C form the strongest pair: F interprets tests and architectural tradeoffs better; C gives more attention to application state. B narrowly leads D because its smaller report requires less correction, although D covers substantially more consequential security issues. That comparison is especially sensitive to interpretation.

The strongest recurring findings concern privileged actions without caller authorization, agent endpoints without identity/ownership binding, unprotected instruction writes, agent-roster drift, and disagreement between account-creation code and the committed trigger. Their validity comes from the supplied code paths and snippets, not how many reviewers reported them.

Significant errors include treating an inactive duplicate file as critical, claiming Next.js 16 ignores proxy.ts, proposing incompatible cookie changes, confusing URL pathname assignment with an external redirect, and attributing cross-user session collisions to timestamps despite user-scoped upstream URLs. Several role-provisioning recommendations also need a safer trust boundary.

### Evidence and blinding protocol

Benchmark contents read: ASTRA_REFEREE_PROMPT.md, EVAL_SCORECARD.md, templates/REVIEW_PROMPT.template.md, and the six referee/blind/REVIEWER_A–F.md reports. I did not inspect target source, installed target dependencies, original contestant reports, identity mapping, reference reviews, rankings, economics, or run notes. The output report was overwritten without reading its previous contents.

Before reading the referee prompt, an overly broad file listing exposed benchmark filenames, including identity-bearing directory names. It exposed no mapping or original report contents. This is a procedural deviation from ideal blinding and is recorded explicitly. No identity inference or matching was attempted.

Official framework/provider documentation was consulted to resolve generic technical claims. Isolated JavaScript checks from /tmp used snippets already supplied in the anonymous reports and fictitious origins. These were not application reproductions. No target commands, tests, or source reads were performed by the referee.

VALID below means a supplied excerpt or sufficiently specific execution trace supports the mechanism. It does not independently certify that the quoted source matches the frozen repository or that a deployed exploit occurred. NOT ADJUDICABLE applies when missing evidence is necessary to resolve the central claim. Source-supported defects retain severity without requiring a live reproduction.

Evidence levels: E1 source; E2 isolated reproduction; E3 integrated local reproduction; E4 real-service reproduction; E5 deployed reproduction. Contestant Jest runs are reported local test evidence with mocked services, not integrated exploit verification. None supplies E4/E5 evidence. Referee E2 checks cover only URL and title-casing semantics.

The referee prompt overrides scorecard sections requesting identity/economics/reference comparisons. Those fields are excluded. Novelty means unique among these six reports; novelty relative to the prohibited reference review is NOT ADJUDICABLE. Operator intervention and whether self-correction was spontaneous are UNAVAILABLE. Independence scores assess investigation choices evidenced in the reports, not unseen assistance.

## B. Consolidated Issue Ledger

A–F denote REVIEWER_A–REVIEWER_F. V = VALID; P = PARTIALLY VALID; I = INVALID; U = NOT ADJUDICABLE FROM AVAILABLE EVIDENCE; D = DUPLICATE / SAME ROOT CAUSE. INFO = INFORMATIONAL / IMPROVEMENT. Evidence strength and severity are separate.

| ID / issue family | Validity / severity | Supporting reviewers and strongest evidence | Caveats, calibration, misses, compression |
| --- | --- | --- | --- |
| L01 Privileged actions omit caller authorization | V; CRITICAL | A 3.4, B 1, C F1, D C1/C2, F H1. C traces client form imports to action bodies, layout-only protection, and createAdminClient. D C2 identifies editUser writing the highest role. E1. | Used service-role mutations support full application user-administration compromise. No hostile POST, deployed action-ID discovery, credentials, or external perimeter verified. A/F's HIGH understates the capability; B/C/D's CRITICAL is defensible. E identifies target restrictions but misses this CRITICAL caller-check root. D C1/C2 are one root. |
| L02 Target-user restrictions are UI-only | V; HIGH | B 5, C F1, D C1, E H4, F M5. E identifies hidden non-member delete buttons and the action accepting arbitrary userId. E1. | E contradicts B/F's claimed normal-UI deletion path; direct action invocation still bypasses target rules. B/F's MEDIUM understates deletion of higher-privilege accounts. A omits this distinct invariant. It survives adding a caller-is-admin check to L01. Superadmin self-deletion policy is unresolved. |
| L03 Agent run/history lack identity and ownership binding | V; HIGH | C F2, D C3/C4, E C3, F H2. C traces refresh-only proxy to attacker-selected upstream user/session URLs. F distinguishes private RLS index rows from transcript access. E1. | Cross-user disclosure requires a reachable permissive backend and usable victim identifiers. A/B miss this HIGH family. D's independently CRITICAL run/history claims exceed established impact. C/F overstate ease or universality of transcript access. Two capabilities, one identity-binding root. |
| L04 Instruction GET/PUT lack authorization | V; HIGH; potentially CRITICAL downstream | C F2, D C6, E C3, F H3. F traces the role-gated page to an ungated PUT and GCS saveWithBackup. E1. | Backup supports recovery, not prevention. Credentials, external reachability, and how agents consume changed blobs are unverified. A/B miss this HIGH family. C/D/E's CRITICAL requires assumptions about shared prompt uptake; D/F's exfiltration examples do not prove downstream exfiltration capability. |
| L05 Manifest/UI/mocks/tests disagree | V; HIGH live Mission Control failure; MEDIUM test gate; LOW mock degradation | All six. C F3 supplies concrete failing suites and a service-to-400 path; A supplies counts/rendered placeholder evidence; D H2 precisely traces requireKnownAgent. All report 38 failed / 225 passed. | E's CRITICAL is inflated. A's mock-chat-unusable claim conflicts with its generic response fallback. E/D wrongly extend missing new-agent mock keys to a page requesting old keys. A 3.5/3.6, D H1/H2/M4 and E L3 share one migration root. F does not clearly trace the live instruction-editor 400 consequence. |
| L06 Account-creation/trigger contract mismatch | V; MEDIUM selected role discarded; LOW blank names | B 3/4, C F4, D H3, F H4. They juxtapose hardcoded member insertion and metadata lookup for name with full_name/role writers. C explicitly limits the deployed inference. E1. | A/E miss the contract defect. B/D's HIGH for names is inflated; B/C/F also overrate limited provisioning failure. The safe default-member trigger is not inherently wrong: the privileged creation flow fails its promised role selection. Role/name are different fields within one creation boundary. |
| L07 Browser-readable cookies and session JSON | V tradeoff/redundancy; INFO or LOW; I for incompatible SSR premise | B 6, C F5, E M4, F M4/L5. Reports show httpOnly:false and session spread into login JSON. F recognizes browser-client token access. E1. | No XSS or token disclosure to another party shown. C's default/storage explanation is wrong; E's cookie-only remedy conflicts with the browser design. B incorrectly assumes existing HttpOnly cookies. F responsibly labels architectural change a tradeoff. No important security miss charged to others. |
| L08 Fetch-error text becomes saveable instruction content | P overall; MEDIUM latent correctness risk | C F6 uniquely traces editable error text to updateInstructions. A 3.5 mentions text but not saving it. E1. | Current Mission Control uses exclusively stale names, so a later save also fails validation. A successful overwrite requires a valid agent reaching the component, a failed read, and a later successful save. Credit C's distinct state-coupling insight, not an established current overwrite. No firm miss charged to others. |
| L09 Local edits/regeneration retain old upstream context | V; MEDIUM | C F7 and F §6.1 trace truncateAfterIndex and reuse of existing session_id; F describes old messages reappearing on reload. E1 inference. | Assumes the described append-only ADK contract; no live transcript comparison. A/B/D/E miss this MEDIUM issue. F receives credit despite tradeoff labeling. Edit and regenerate share one client/server ownership mismatch. |
| L10 GCS copy/write lacks concurrency control | V conditional risk; MEDIUM | A 4.1 supplies copy/copy/write/write interleaving; F §6.3 identifies generation-conditioned writes. E1. | Both backups can preserve the old value while one accepted write disappears. Documented last-write-wins semantics affect priority, not the mechanism. B/C/D/E omit this conditional MEDIUM risk. No duplicate reward for backup and live-write symptoms. |
| L11 Optimistic archive lacks rollback | V conditional risk; MEDIUM | A 4.3 uniquely quotes fire-and-forget archiveSession and immediate local filtering, then explains reappearance on reload. F §6.6 covers generic silent index failure. E1. | A's archive-specific transition is substantive; F gets partial family coverage. B/C/D/E omit it. “Never block chat” does not provide archive failure feedback or rollback. |
| L12 Shared profile links enter admin-only route | V; MEDIUM | E M2 uniquely cites both navbars, /profile route ownership, and admin-only layout. E1 inference. | A/B/C/D/F miss the concrete link-to-gate mismatch. General observations about flat role hierarchy do not identify this path. No browser reproduction; inheritance policy remains separate. |
| L13 Superadmin edit default demotes role | P; MEDIUM if reachable | A 3.13 quotes the ternary/schema; E H2 corroborates. | A superadmin record would submit admin if unchanged, but supplied reports do not establish the record reaching the edit page when excluded from listings. A's LOW understates conditional loss; “only DB repair” is unsupported. No firm miss for B/C/D/F. |
| L14 Listing fetches all allowed IDs before pagination | V conditional scalability risk; MEDIUM | C concern 7 and F M6 cite full ID selection and .in query. E1. | Query size/backend row caps can cause failure or incomplete results; no measured threshold. A/B/D/E omit it. F's exact “hundreds → 4xx” implication is unverified. Both portal implementations share a root. |
| L15 Timestamp session IDs | V predictability/same-namespace collision concern; LOW; I cross-user collision | C concern 8, D C5, F H2 supply Date.now and app/user/session URL structure. E1. | Same session string under two different user IDs is not the same full key. D's standalone CRITICAL is inflation and double-counts L03 exploitability. F's cross-user collision assertion is wrong under its own URL model. C correctly limits collisions to the same user. |
| L16 Tooling and test-harness fidelity | V broken lint gate; MEDIUM; secondary test explanation provisional | F M1/M2 reproduces next lint failure and distinguishes localStorage-spy test behavior from real SSR fallback. E reports lint did not run. | F's installed-Zustand branch citations support reasoning but do not fully prove the test verdict without source/repro. “All 38 have one cause” overcompresses evidence in B/C/D/F; F later explicitly adds an exception. E's default node environment is preference. F's absent E2E files are asserted, not an executed E2E result. |
| L17 Debug routes, unused code, diagnostic reflection | V existence/path; LOW diagnostics; INFO inert code | All six identify cleanup; A quotes login GET discarding data and returning error.message. C F8 uniquely traces ConnectorError embedding upstream response bodies. E1. | Missing committed posts schema is not proof every deployment returns 400. No local import does not make route.ts unreachable. A's three CRITICAL cleanup findings and E's HIGH cleanup are inflated. C's connector path is a useful unique LOW finding, not proof of secrets leaked. |
| L18 Confirm open redirect | I for stated mechanism | D M3 assigns pathname on an existing absolute URL. Referee E2 tests preserve origin for its proposed inputs. | No NextURL/browser deployment reproduction, but no origin-changing operation in the supplied path. No novelty credit or miss for others. A different chained redirect would need new evidence. |
| L19 Build without public Supabase configuration | V observation; P defect assertion; INFO | C verification; E C4 reports failure without variables and success with dummy variables. Reported local build evidence. | E's CRITICAL and real-key requirement conflict with its control. Missing required configuration alone is not a product defect. useMemo still executes during render. C correctly withholds a defect verdict. |
| L20 Persisted isLoading disables login | U runtime failure; V constant store field | E H1 cites store assignments and consumer line number; B 7 says there are no readers. | No quoted consumer expression or reproduction resolves this conflict. Do not declare E false solely because B disagrees; do penalize unsupported certainty. No consequential miss assigned to others. |
| L21 Miscellaneous UI/config/hygiene | Mixed; predominantly LOW/INFO | Per-reviewer tables below | Index keys, title-casing, caching, labels, stubs and duplication receive claim-level rulings. Numerous small observations cannot offset major trust-boundary misses. |

### Technical checks affecting adjudication

Next.js requires authorization inside Server Functions callable by direct POST. Action IDs and unused-action elimination also mean “every export is certainly exposed in every build” is too broad. This does not undermine the used mutation paths traced for L01. [Next.js mutating data](https://nextjs.org/docs/app/getting-started/mutating-data), [Next.js data security](https://nextjs.org/docs/app/guides/data-security).

Next.js 16 renamed middleware to proxy and removed next lint: E C2 is false, F M2's executed failure has a coherent cause, and A's utility-filename concern is cosmetic. [Next.js 16 migration guide](https://nextjs.org/docs/app/guides/upgrading/version-16).

Supabase's browser side needs access to session/refresh tokens in its shared-cookie SSR design. A server-only architecture is possible, but simply toggling HttpOnly is not a compatible fix for the described application. [Supabase advanced SSR guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide), [Supabase sessions](https://supabase.com/docs/guides/auth/sessions).

B/C/F propose letting the trigger read role from user metadata as one option. Signup clients can supply user metadata, and users can update it. Enum validation alone still allows selecting a privileged role. Prefer the reports' alternative of a properly authorized server-side role assignment, without converting client metadata into authority. This critiques remediation; it is not a new defect in the existing default-member trigger. [Supabase user data](https://supabase.com/docs/guides/auth/managing-user-data), [Supabase RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security).

Custom no-store headers do not override all immutable asset caching headers in Next.js. Other responses and deployment header behavior remain unverified. [Next.js headers configuration](https://nextjs.org/docs/pages/api-reference/config/next-config-js/headers). App Router metadata should use its Metadata API, supporting the reports' narrow next/head migration observation. [Next.js App Router migration](https://nextjs.org/docs/15/pages/guides/migrating/app-router-migration).

Referee isolated URL check: assigning //evil.com or slash-backslash-evil.com to pathname yielded https://app.example//evil.com; assigning https://evil.com yielded https://app.example/https://evil.com. All retained https://app.example as origin. This tests the supplied mechanism, not an integrated Next.js redirect. [Node.js URL API](https://nodejs.org/api/url.html).

Referee isolated title-case check copied A's exact regex/function. “Étienne Ó hAilín” became “ÉTienne Ó HailíN”; Cyrillic “Мария” and CJK “张伟” remained unchanged. A found real accented-name damage, but its claimed outputs and blanket non-ASCII mechanism are wrong.

## C. Per-Reviewer Adjudication

### Counting convention

The unit is a numbered report finding or independently separated concern, not every sentence/file. Composite findings receive P where a material part fails; surviving parts are stated. D gets no extra discovery credit. Core lists are A §3, B §3, C F1–F9, D C1–L2, E C1–L5, F H1–L6. Supplemental concerns/improvements are separately identified and included in totals. D's positive parser observation is excluded. Summaries, praise, and repeated verification are not counted again.

A V at INFO means a correct observation or explicitly labeled improvement, not a demonstrated application failure. Properly qualified concerns are not false positives merely because they are conditional. These counts describe report blocks, not independent product defects. Supplemental observations do not inflate important-issue coverage.

| Reviewer | Total substantive blocks | Core | Supplemental | Valid | Partial | Invalid | Non-adjudicable | Duplicate | Fully valid unique contributions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| REVIEWER_A | 26 | 15 | 11 | 13 | 8 | 0 | 1 | 4 | 2 |
| REVIEWER_B | 9 | 9 | 0 | 7 | 2 | 0 | 0 | 0 | 0 |
| REVIEWER_C | 20 | 9 | 11 | 15 | 3 | 1 | 1 | 0 | 2 |
| REVIEWER_D | 21 | 15 | 6 | 12 | 3 | 1 | 0 | 5 | 0 |
| REVIEWER_E | 22 | 22 | 0 | 9 | 8 | 2 | 2 | 1 | 1 |
| REVIEWER_F | 22 | 16 | 6 | 17 | 5 | 0 | 0 | 0 | 1 |

There are 120 classified blocks: 86 core and 34 supplemental. Totals reconcile to 73 V, 29 P, 4 I, 4 U and 10 D. A valid INFO observation is not a proved product defect. Composite block granularity means subclaim false positives also appear within P, not just the Invalid column.

Unique-contribution counts are deliberately narrow: A's failed-archive transition and role-lookup outage UX; C's connector-error reflection and stale persistence copy; E's shared profile link; F's error-sentinel/alert divergence. A's title-casing claim and C's error-overwrite claim are partial rather than fully valid additions. F's unique SSR-test analysis remains provisional, so is not included in the fully valid novelty count. Novelty against the forbidden reference review is unavailable for every reviewer.

For the frozen scorecard's optional precision record, use core findings only: (V + 0.5 × P) / (V + P + I). U and D are excluded. This accounting convention is not a calibrated probability and is not directly comparable across different composite/INFO granularity. It does not include severity or misses and was not used to compute weighted quality.

| Reviewer | Core V / P / I / U / D | Core adjudicated denominator | Core partial-credit precision |
| --- | --- | --- | --- |
| REVIEWER_A | 7 / 6 / 0 / 1 / 1 | 13 | 76.9% |
| REVIEWER_B | 7 / 2 / 0 / 0 / 0 | 9 | 88.9% |
| REVIEWER_C | 6 / 2 / 1 / 0 / 0 | 9 | 77.8% |
| REVIEWER_D | 8 / 2 / 1 / 0 / 4 | 11 | 81.8% |
| REVIEWER_E | 9 / 8 / 2 / 2 / 1 | 19 | 68.4% |
| REVIEWER_F | 12 / 4 / 0 / 0 / 0 | 16 | 87.5% |


### REVIEWER_A

| Finding | Class | Severity | Ruling |
| --- | --- | --- | --- |
| 3.1 Login GET debug query | V | LOW | Quoted handler; no returned posts data or CRITICAL exploit. Deployed missing-table error is conditional. |
| 3.2 Duplicate logout | V | INFO | Inert source duplication; hypothetical future wrong-file editing is not a present outage. |
| 3.3 Uncalled superadmin route | P | INFO | No local caller supported; “never reached” and zero authorization value do not follow for an HTTP route. |
| 3.4 Privileged actions | V | CRITICAL | Correct caller-check/RLS-bypass path; calling it defense in depth understates the missing required boundary. |
| 3.5 Manifest/mock/live drift | P | HIGH | Live rejection and stale seeds valid; generic responses and empty history do not make mock chat unusable. |
| 3.6 Red tests | D | MEDIUM | Valid verification, same migration root as 3.5. |
| 3.7 Middleware utility naming | V | INFO | Explicitly says no behavioral defect; MEDIUM label is unhelpful. |
| 3.8 Role errors collapse to null | V | LOW | Quoted branch supports misleading outage UX. Fail-closed authorization itself is appropriate. |
| 3.9 Wrong-role redirect | V | LOW | Confusing UX supported; inheritance remains policy. |
| 3.10 Unused login redirect return | V | INFO | Correctly acknowledges that a deliberate /chat landing is valid. |
| 3.11 Repeated user-ID extraction | P | INFO | Weak typing supported; hypothetical SDK shape change proves no current misrouting. |
| 3.12 Unrecorded logout choice | U | INFO | Neither a contradictory implementation nor completeness of decision-log search established. |
| 3.13 Demoting role default | P | MEDIUM conditional | Exact expression supports danger; record reachability and claimed sole DB recovery path unproved. |
| 3.14 Title-casing names | P | LOW | Referee reproduction confirms accented-name damage but refutes claimed outputs and Cyrillic/CJK description. |
| 3.15 Rename focus trap | P | LOW conditional | Unmount-on-blur suggests focus loss; no keyboard trace proves trapping. Heading misidentifies control. |
| 4.1 Concurrent GCS saves | V | MEDIUM conditional | Concrete losing-write/missing-intermediate-backup interleaving; responsible concern labeling. |
| 4.2 Proxy refresh overhead | P | INFO | Call per matched request supported; network round-trip on every request is not established for absent/cached sessions. |
| 4.3 Archive rollback | V | MEDIUM conditional | Quoted fire-and-forget mutation and immediate local removal support reappearance on reload. |
| 4.4 Further matcher exclusions | D | INFO | Same refresh-overhead concern as 4.2. |
| 4.5 Unused second bundle | V | INFO | Correctly allows intentional future use. |
| 4.6 Generic mock voice | D | LOW | Already 3.5; fallback is functioning behavior. |
| 5.1 Alleged dead mock variable | P | INFO | Both quoted variables are returned; title is false. Stale comment observation survives. |
| 5.2 Unused lastSelectedAgent | V | INFO | Unused-state observation, no user failure claimed. |
| 5.3 Unused reset helper | V | INFO | Optional cleanup, no demonstrated failure or need to gate export. |
| 5.4 Effect dependency suppressions | V | INFO | Explicit maintenance suggestion, no race shown. |
| 5.5 Rename keyboard concern | D | LOW | Repeats 3.15; blur-to-save is not automatically a trap. |

Strongest behavior: concrete migration evidence, a useful GCS interleaving, and archive rollback reasoning. Weakest behavior: three cleanup items are CRITICAL while both HIGH agent API families are omitted.

Most important valid finding: L01. Most important misses: L03 and L04 (HIGH). Other omissions: L02 target restrictions (HIGH), L06 provisioning, L09 transcript divergence, L12 profile navigation, and L14 listing scalability (MEDIUM; scalability conditional).

Novel contribution: L11's archive-specific transition is a useful conditional MEDIUM finding; F covers generic index errors but not this exact transition. Role-lookup failure UX and accented-name corruption are additional narrow contributions. L13 is shared with E and conditional.

False-positive record: no wholly invalid core block after separating subclaims, but meaningful false assertions occur in 3.3, 3.5, 3.11, 3.14 and 5.1. Severity inflation is substantial independently of validity. Evidence is source excerpts plus one reported Jest run; later scenarios are often hypothetical. An occasional appeal to Factory rules exceeds factual-context use.

Overall character: detail-oriented migration reviewer with some state reasoning, weak prioritization, and excessive cleanup noise. Correction burden is high for ordering and conditional assertions.

### REVIEWER_B

| Finding | Class | Severity | Ruling |
| --- | --- | --- | --- |
| 1 Privileged actions | V | CRITICAL | Clear service-role path and protected REST comparison; no hostile POST reproduced. |
| 2 Roster/test/live drift | V | HIGH | Good shared-root grouping and references; attributing all 38 failures to one cause exceeds per-test evidence. |
| 3 Selected role ignored | V | MEDIUM | Direct trigger/action mismatch. Limit universal wording to identified creation paths. |
| 4 Name mismatch | V | LOW | Direct metadata-key mismatch, not proof every possible user record has a null name. |
| 5 Delete target restriction | P | HIGH | Missing server check valid; ordinary-UI deletion conflicts with E's hidden-button evidence. Filtering UI is not a secure alternative fix. |
| 6 Session JSON / debug GET | P | LOW | Redundant token exposure, but existing cookies are not shown HttpOnly. Secondary debug GET valid; deployed missing table conditional. |
| 7 Dead files/state | V | INFO | Explicit concern; lack of UI references does not mean unreachable HTTP capability. |
| 8 Duplicated reads | V | INFO | Legitimate maintenance concern, no independent operational failure. |
| 9 App Router next/head | V | LOW | Narrow migration observation valid; next/document is not a general App Router metadata substitute. |

Strongest behavior: concise account-creation contract analysis. Weakest behavior: misses the entire agent trust boundary despite identifying portal authorization.

Most important valid finding: L01. Most important misses: L03 and L04 (HIGH). MEDIUM misses: L09 transcript divergence, L10 concurrent saves, L11 archive rollback, L12 profile navigation, L14 listing scalability and L16 broken lint. Conditional scalability/concurrency omissions weigh less than the security misses.

Novel contribution: no important family uniquely established. Separate name/role symptoms are useful but shared with C/D/F; session JSON is also in F.

Calibration: HIGH for names/provisioning is inflated; target-account deletion is understated at MEDIUM. UI filtering as a security fix and reading role metadata in the trigger need correction.

Evidence discipline: paths, lines, SQL, typecheck/Jest, and installed-framework convention verification are useful. Cookie and ordinary-UI assumptions are not controlled. No live evidence. Overall character: useful tactical portal reviewer, comparatively concise but too narrow for sole system-wide coverage.

### REVIEWER_C

| Finding | Class | Severity | Ruling |
| --- | --- | --- | --- |
| F1 Privileged actions | V | CRITICAL | Strong used-action/layout/client trace. Every-export exposure and privileged creation via the broken add path are overbroad; editUser still establishes escalation. |
| F2 Agent endpoints | V | HIGH | Strong proxy/handler/backend identity reasoning; L03 and L04 both credited. Universal disclosure/prompt uptake are deployment-dependent. |
| F3 Roster drift | V | HIGH | Concrete failure list and live 400 path; mocks masking live drift is useful root-cause analysis. |
| F4 Trigger contract | V | MEDIUM | Clear fields/role mismatch and explicit deployed-schema caveat. |
| F5 HttpOnly false as SSR defect | I | INFO tradeoff only | Central default/browser-storage premise and cookie-only remedy are wrong for the described shared-session design. No XSS shown. |
| F6 Save fetch-error text | P | MEDIUM conditional | Distinct bad state coupling; stale-agent rejection blocks proposed successful overwrite in the frozen page. |
| F7 Client edit/server history | V | MEDIUM | Same-session trace; append-only upstream behavior not live-tested. |
| F8 Upstream diagnostics | V | LOW | Concrete catch/body-construction path; actual sensitive values not demonstrated. |
| F9 Dead/debug auth code | P | LOW / INFO | Debug GET and duplicate valid; missing local imports do not prove route unreachability. |
| Concern 1 Stale GCS copy | V | LOW | Product text conflicts with supplied live service path and can mislead operators. |
| Concern 2 next/head | V | LOW | Valid narrow metadata migration concern. |
| Concern 3 Global no-store | P | INFO | Broad configuration exists; all immutable assets are not shown affected. Tradeoff labeling appropriate. |
| Concern 4 Flat roles | V | INFO | Explicitly leaves inheritance to policy. |
| Concern 5 Persisted auth state | V | LOW | Plausible stale UI; correctly preserves server authorization distinction. |
| Concern 6 Duplication | V | INFO | Concrete maintenance divergence, no extra creation-root credit. |
| Concern 7 Listing all IDs | V | MEDIUM conditional | Useful query-shape/scaling concern; no measured threshold. |
| Concern 8 Timestamp collision | V | LOW conditional | Correct same-user qualification; no separate auth bypass. |
| Concern 9 Import storage effects | V | INFO | Safe degradation and test coupling acknowledged, no claimed crash. |
| Concern 10 Undefined initials | U | LOW if confirmed | No complete map/join/reduction expression. Undefined elements need not become visible text. |
| Concern 11 Node test default | V | INFO | Deliberate configuration is valid; no missing docblock or actual resulting bug shown. |

Strongest behavior: connects UI protection, endpoint exposure, mock/live drift, schema contract, and transcript ownership. Weakest behavior: confident cookie advice and unsafe role-remediation assumptions weaken otherwise strong security analysis.

Most important valid finding: L01, with substantial L03/L04 coverage. No confirmed CRITICAL/HIGH family wholly missed. MEDIUM omissions: L10 concurrent saves, L11 archive rollback, L12 profile navigation and L16 broken lint. Conditional L13 is not a firm miss.

Novel contribution: L17's connector error-reflection path is a supported LOW finding; stale GCS persistence copy is another LOW contribution. L08 is a unique substantive latent state defect, but the claimed current MEDIUM overwrite is only partially adjudicated. No unqualified novel current overwrite credited.

Calibration: CRITICAL for combined agent APIs exceeds separately established impact; HIGH for trigger provisioning is inflated. F5 is a real false positive, not a cautiously raised concern. Role metadata must not become trusted authorization.

Evidence discipline: SQL deployment caveat, explicit live limits, and withholding a defect verdict for missing build variables are strong. Detailed local test evidence helps. Overall character: broad senior reviewer with strong state/root-cause reasoning, requiring provider-specific review before implementing security advice.

### REVIEWER_D

| Finding | Class | Severity | Ruling |
| --- | --- | --- | --- |
| C1 Admin actions | V | CRITICAL family | Missing caller checks valid. Deletion/listing alone do not prove takeover; C2 supplies escalation for the shared family. |
| C2 Superadmin mutations | D | CRITICAL family | Important additional capability/evidence for C1, not another root. Persistence of invalid role strings beyond DB constraints is unverified. |
| C3 Agent run | V | HIGH | Concrete route/forwarding path; backend exposure and policy remain conditional. |
| C4 Agent history | D | HIGH | Read capability through C3's identity-binding root; retain coverage without a second discovery count. |
| C5 Predictable IDs | P | LOW | Timestamp predictable; feasible victim enumeration not shown or independently CRITICAL. |
| C6 Instruction writes | V | HIGH | Strong ungated write path; automatic uptake/exfiltration not established. |
| H1 Red tests | V | MEDIUM | Reported aggregate supported; later suite list conflicts with A/C and its own summary. |
| H2 Live Mission Control | D | HIGH | Good service-to-400 trace, same migration root as H1. |
| H3 Trigger mismatch | V | MEDIUM role / LOW name | Direct source contract contradiction; deployed trigger unverified, name severity inflated. |
| M1 Debug login GET | V | LOW | Committed missing table does not establish every deployed 400; selected rows not returned. |
| M2 Duplicate logout | V | INFO | Inert file cleanup, not MEDIUM risk. |
| M3 Confirm redirect | I | None established | Pathname assignment preserves origin in isolated checks; no alternate chain supplied. |
| M4 Old mock keys | D | LOW | Same H1/H2 root; current Mission Control asks for old keys still present in mocks. |
| L1 Public demo | V | INFO | Optional cleanup; public demo existence harmless by itself. |
| L2 Index keys | P | LOW conditional | Potential state-reuse concern, not demonstrated corruption. “Stateless bubbles” ignores possible descendant state noted by F. |
| Concern: no-store | P | INFO | Immutable static assets are an exception to the sweeping claim. |
| Concern: fresh role-query client | V | INFO | Optional local cleanup; no measured cost or need for cross-request client sharing. |
| Concern: persisted full user | V | LOW | Proper stale/PII client-storage concern, not auth bypass. |
| Concern: no DELETE policy | V | INFO | Explicit archive-only choice; growth/purge policy is not a demonstrated defect. |
| Concern: forwarded Authorization | D | HIGH family | Valid pass-through distinction already C3/C4. |
| Concern: image allowlist | V | INFO | Recognizes no current defect; future requirement earns no coverage credit. |

Strongest behavior: important server trust boundaries and the highest-role mutation establishing escalation. Weakest behavior: six CRITICAL headings flatten full account administration, conditional transcript access, and timestamp predictability into the same urgency.

Most important valid finding: L01. No confirmed CRITICAL/HIGH family wholly missed. MEDIUM misses: L09 transcript mismatch, L10 concurrent saves, L11 archive rollback, L12 profile navigation, L14 listing scalability and L16 broken lint.

Novel contribution: no unique validated substantive family. Proposed novel redirect fails; timestamp risk is shared and much less severe.

False-positive/calibration record: M3 invalid. Enumeration, takeover from C1 alone, automatic exfiltration and universal missing-table failure are overstated subclaims. Its later ten-suite list differs from concrete A/C lists and then adds “plus others”; exact suite-level verification is unreliable even though aggregate totals agree.

Evidence discipline: useful paths/snippets, tests/typecheck, and framework activation check; no exploit reproduction. Conditional security scenarios are frequently labeled demonstrated. Overall character: broad security triage reviewer needing rigorous severity and claim validation.

### REVIEWER_E

| Finding | Class | Severity | Ruling |
| --- | --- | --- | --- |
| C1 Manifest drift | P | HIGH | Migration/live failure valid; old-key mock editors do not become undefined merely because manifest changes. CRITICAL inflated. |
| C2 Missing middleware | I | None | Next.js 16 recognizes proxy.ts; older filename rule misapplied. |
| C3 Agent endpoints | V | HIGH | Important identity/instruction authorization paths, with useful identifier caveat. |
| C4 Missing build variables | P | INFO | Real local failure/control; not a CRITICAL product defect. Dummy-config success contradicts real-key requirement; useMemo not prerender fix. |
| H1 Loading disables login | U | HIGH only if shown | Store constant supported; consumer conflicts with B and is not quoted/reproduced. |
| H2 Roles / demoting default | P | MEDIUM conditional | Raw inputs/default merit attention. addUser does not perform claimed later role write; invalid-value persistence, zero-row impact and form reachability unproved. |
| H3 List excludes superadmins | P | INFO / policy-dependent | Filter/comment mismatch real; inability to manage every superadmin does not follow, nor is inclusion necessarily intended. |
| H4 Delete target checks | V | HIGH | Strong UI-versus-server distinction; omits caller-auth root. Self-delete prohibition is policy. |
| H5 Dead/debug auth | V | LOW / INFO | Core cleanup valid; HIGH inflated. GET discards data; no concrete data leak/500 demonstrated. |
| M1 All caching disabled | P | INFO | Broad configuration, but immutable framework assets are an exception; no header trace. |
| M2 Shared profile link | V | MEDIUM | Concrete navbar/route/role-gate path; unique valid product finding. |
| M3 Persisted auth/redirect | V | LOW / INFO | Recognizes authoritative server gate; stale-UI/unused-return concerns valid. |
| M4 Cookies/any/errors | P | INFO | Typing/debug tradeoffs observable; HttpOnly-only remedy incompatible, swallowed render-time writes may be intentional. |
| M5 Chat UI/accessibility | P | LOW / INFO | Attachment stubs and accessible-name concern useful; no concrete index-key glitch/DOM-prop harm. Missing visible label alone does not prove missing accessible name. |
| M6 Edit first message | I | None | Index zero has no earlier context to preserve. Truncating superseded suffix before resend is consistent edit-from-here behavior. |
| M7 Dependency advisories | U | MEDIUM if applicable | Counts/warnings lack advisory IDs, affected paths, reachability or reproduced incompatibility. Inventory signal only. |
| M8 Jest node default | V | INFO | Valid deliberate config with overrides; no actual missing directive failure. |
| L1 Unused code | V | INFO | Cleanup supported; unused by chat alone would not establish global deadness. |
| L2 Duplication | V | INFO | Structural observation, no independent feature failure. |
| L3 Stale comment | D | LOW | Same migration root as C1. |
| L4 Feedback/attachments | V | INFO | New feedback-stub observation survives; attachments already M5, no extra credit. Shipping intent unverified. |
| L5 Input limits/sanitization | P | LOW conditional | Limits potentially useful; no proven size abuse or HTML injection context warrants stronger sanitization claim. |

Strongest behavior: controlled build experiment and unique profile navigation finding. Weakest behavior: elevates framework assumptions and valid design choices into urgent defects.

Most important valid finding: L03/L04 agent authorization (HIGH). Most important miss: L01 CRITICAL caller authorization; H4 target checks are no substitute. MEDIUM misses: L06 provisioning, L09 transcript divergence, L10 concurrent saves, L11 archive rollback and L14 listing scalability.

Novel contribution: L12 is a supported MEDIUM issue missed by the other five. Dummy-config build is useful novel evidence, not a novel critical defect. L13 default is shared with A and conditional.

False positives: C2 and M6 invalid; H1 unresolved, not declared false because B disagrees. M7 cannot establish a specific vulnerability from anonymous audit totals. Cookie/useMemo recommendations need correction. CRITICAL/HIGH cleanup and configuration priorities materially reduce usefulness.

Evidence discipline: tests/typecheck/build control/lint failure reported; several central claims lack comparable verification. npm ci is setup, not quality by itself. No unavailable process evidence is used to infer a target-write violation. Overall character: exploratory UI/integration reviewer who finds overlooked product issues, but needs extensive filtering before implementation.

### REVIEWER_F

| Finding | Class | Severity | Ruling |
| --- | --- | --- | --- |
| H1 Privileged actions | V | CRITICAL | Strong boundary and caller/target remediation; HIGH understates full unrestricted capability. |
| H2 Agent identity/session IDs | P | HIGH | Strong identity bypass and index/transcript distinction. Same timestamp under different users does not merge upstream sessions; enumeration ease unproved. |
| H3 Instruction authorization | V | HIGH | Good page/handler distinction and credential caveat; malicious-prompt example not proof of exfiltration. |
| H4 Trigger contract | V | MEDIUM role / LOW name | Good SQL/code/docs comparison; metadata-trusting trigger alternative needs correction. |
| M1 Red tests / SSR harness | V | MEDIUM | Better analysis than failure totals; library-branch reasoning supports a provisional test-harness diagnosis, not complete exoneration without source/repro. Opening universal cause sentence conflicts with later exception. |
| M2 Lint/E2E tooling | V | MEDIUM | Executed lint failure/cause strong. Absent E2E files are source claims, not executed E2E failure; lint would not necessarily catch SQL/comment drift. |
| M3 Orphaned routes | V | LOW / INFO | Recognizes two live implementations and environment-dependent signup policy; “every GET 400” assumes deployed schema. |
| M4 Cookie tradeoff | V | INFO | Explicitly recognizes browser-client need. Server-only architecture is an option, not obligatory standard hardening. |
| M5 Target-role checks | P | HIGH | Valid independent policy requirement after H1. Ordinary-UI delete claim conflicts with E. |
| M6 Listing scalability | V | MEDIUM conditional | Good query/root-cause analysis; threshold unverified, row caps may change failure shape. |
| L1 Duplication | V | INFO | Maintenance observations, intentional theme variants acknowledged. |
| L2 Unused modules/dependencies | V | INFO | Cleanup supported, not a runtime vulnerability; no-import alone does not imply unreachable route. Metadata migration useful. |
| L3 Index-key state | P | LOW conditional | Descendant state makes concern stronger than D's account. Whether truncation unmounts or batching reuses state is not reproduced. |
| L4 Persisted auth UI | V | LOW | Correct stale UI versus server gate distinction. |
| L5 Session JSON | V | LOW / INFO | Excess-data observation without assumed HttpOnly boundary; no third-party token leak shown. |
| L6 Miscellaneous | P | LOW / INFO | Typo/negative-page acceptance concrete. Type-only import no current bundle defect; all-static no-store overbroad; double rename/render impacts need event evidence. |
| §6.1 Edit/server append | V | MEDIUM | Credited despite “by design”: concrete persistent transcript mismatch. |
| §6.2 Error sentinel/alert | V | LOW | Supported competing error-display paths; accepted tradeoff, no proved higher-severity loss. |
| §6.3 Concurrent instruction saves | V | MEDIUM conditional | Correct non-atomic sequence and useful conditional-write direction. |
| §6.4 Missing-role fallback | P | INFO | Fallback may mask missing roles, but getUsers filters through role rows; reachability differs by read path and is unproved. |
| §6.5 Flat role hierarchy | V | INFO | Appropriate policy caveat, no assumed inheritance requirement. |
| §6.6 Silent index failures | V | LOW / MEDIUM conditional | Invisible index failures/missing lists identified; partial overlap with A's more precise archive scenario. |

Strongest behavior: private index versus unprotected transcript distinction, test-harness fidelity, and balanced state/concurrency analysis. Weakest behavior: secondary claims escape verification, notably cross-user collisions, UI deletion, and metadata-role advice.

Most important valid finding: L01; strong L03/L04 coverage. Most important miss: L05's precise live Mission Control 400 path, a HIGH consequence of a root F otherwise identifies. General mentions of Mission Control/stale mocks are partial coverage, not the full route trace. L12 profile navigation is a MEDIUM miss. Generic index failure coverage does not fully replace A's archive transition.

Novel contribution: broken lint gate is most clearly substantiated here but E also reports it, so not unique. Specific localStorage-spy versus real-SSR analysis is unique useful test reasoning, with full confirmation unavailable. Error-sentinel/alert divergence is a unique supported LOW contribution. Minor rename/pagination observations earn no major novelty credit.

Calibration: HIGH understates L01 and overstates narrower provisioning; target deletion deserves HIGH. Most remaining issues distinguish cleanup, inference and accepted tradeoffs better than the field.

Evidence discipline: Jest/typecheck/lint, targeted reruns and installed-library inspection reported. No real-service or deployed verification. Positive architecture observations distinguish sound design from defects. Overall character: broad senior reviewer with systems/verification instincts, strongest here for phase review, with security-remediation checks still needed.

## D. Scorecard

The frozen weights total 100. Every dimension uses an integer score from 0 to 5 with the frozen meanings (0 absent/harmful, 1 poor, 2 weak, 3 competent, 4 strong, 5 exceptional). Contribution = dimension score × weight / 5. Scores were assigned from the evidence above; no dimension was adjusted to force a grade.

Grade bands use their stated lower-bound thresholds on unrounded totals: 54.6 remains below 55, rather than rounding into C-. Decimal gaps in the printed integer band labels are interpreted as extending up to the next threshold.

### REVIEWER_A — 45.4 / 100 — D

| Dimension | Weight | Score / 5 | Contribution | Written justification |
| --- | --- | --- | --- | --- |
| A. Finding Validity | 15 | 3 | 9.0 | Many excerpts support real observations, but mock-unusable, dead-route, Unicode and focus claims contain material errors. |
| B. Important-Issue Coverage | 15 | 2 | 6.0 | Finds critical action authorization and migration; omits both high agent API families and provisioning. |
| C. Evidence Quality | 10 | 3 | 6.0 | Quotes code and detailed Jest failures; several failure explanations remain guesses and no targeted product verification is supplied. |
| D. Severity Calibration | 7 | 1 | 1.4 | Three critical cleanup labels badly invert risk; some conditional role loss is understated. |
| E. Confidence / Epistemic Discipline | 7 | 2 | 2.8 | Labels many concerns carefully, but speculative outcomes also enter the demonstrated-problems list. |
| F. Security / Trust-Boundary Reasoning | 8 | 2 | 3.2 | Recognizes service-role bypass, but misses transcript identity and instruction-write boundaries. |
| G. Logic / State / Concurrency Reasoning | 8 | 2 | 3.2 | Useful concurrent-save and archive sequences; weak focus and identity-shape scenarios reduce reliability. |
| H. Architecture / Root-Cause Reasoning | 8 | 3 | 4.8 | Connects manifest consumers and mocks; repeats migration symptoms and gives substantial space to local cleanup. |
| I. Test-Quality Reasoning | 6 | 3 | 3.6 | Explains several stale fixture/default failures; guesses persistence failures and does not isolate the harness issue. |
| J. Scope Discipline / Signal-to-Noise | 5 | 1 | 1.0 | Long low-impact list, repeated concerns and process-rule appeals distract from omitted urgent issues. |
| K. Operational Usefulness | 6 | 2 | 2.4 | Precise locations help implementation, but priorities and several failure scenarios need significant correction. |
| L. Independent Reviewer Judgment | 5 | 2 | 2.0 | Independent archive/concurrency investigation useful; strongest attention is directed toward migration/hygiene rather than live boundaries. |
| **Total** | **100** | — | **45.4** | **D** |

### REVIEWER_B — 55.0 / 100 — C-

| Dimension | Weight | Score / 5 | Contribution | Written justification |
| --- | --- | --- | --- | --- |
| A. Finding Validity | 15 | 4 | 12.0 | Core action, trigger and roster findings survive; weaker cookie/UI subclaims do not dominate the short report. |
| B. Important-Issue Coverage | 15 | 2 | 6.0 | Misses the high agent run/history and instruction-write families despite covering privileged actions and provisioning. |
| C. Evidence Quality | 10 | 3 | 6.0 | Provides SQL, line references, test/typecheck results and a framework convention check; no targeted behavioral reproductions. |
| D. Severity Calibration | 7 | 2 | 2.8 | High blank-name/provisioning ratings and medium target deletion misprioritize impact. |
| E. Confidence / Epistemic Discipline | 7 | 2 | 2.8 | Demonstrated labels hide cookie, UI and universal-failure assumptions; live limits alone do not cure those claims. |
| F. Security / Trust-Boundary Reasoning | 8 | 3 | 4.8 | Strong service-role boundary, but major agent omissions and unsafe UI-filter/metadata repair options. |
| G. Logic / State / Concurrency Reasoning | 8 | 1 | 1.6 | Little investigation of state ownership, asynchronous failures, transcript divergence or concurrent saves. |
| H. Architecture / Root-Cause Reasoning | 8 | 3 | 4.8 | Groups manifest drift and identifies creation-contract divergence; shared authorization policy could be analyzed more fully. |
| I. Test-Quality Reasoning | 6 | 3 | 3.6 | Explains stale roster assertions and test fixtures, but overclaims a single cause and does not assess harness fidelity. |
| J. Scope Discipline / Signal-to-Noise | 5 | 4 | 4.0 | Short, navigable findings with optional cleanup explicitly separated; limited repetition. |
| K. Operational Usefulness | 6 | 3 | 3.6 | Locations and remedy directions useful; target-filter and metadata suggestions require security correction. |
| L. Independent Reviewer Judgment | 5 | 3 | 3.0 | Good investigation of SQL callers and active UI versus alternate REST path; strategy remains narrow. |
| **Total** | **100** | — | **55.0** | **C-** |

### REVIEWER_C — 73.2 / 100 — B-

| Dimension | Weight | Score / 5 | Contribution | Written justification |
| --- | --- | --- | --- | --- |
| A. Finding Validity | 15 | 4 | 12.0 | Most important mechanisms survive; cookie defect is invalid and error-overwrite/dead-route claims are only partial. |
| B. Important-Issue Coverage | 15 | 4 | 12.0 | Finds all principal critical/high roots plus transcript divergence; misses several medium state/operational paths. |
| C. Evidence Quality | 10 | 4 | 8.0 | Detailed action/route/SQL traces, actual suite list and build-environment caveat; no integrated security test. |
| D. Severity Calibration | 7 | 3 | 4.2 | Critical actions appropriate, but agent-wide critical and high provisioning overstate separately established reach. |
| E. Confidence / Epistemic Discipline | 7 | 3 | 4.2 | Strong schema/build/live caveats coexist with confidently wrong cookie advice and overly broad endpoint claims. |
| F. Security / Trust-Boundary Reasoning | 8 | 3 | 4.8 | Connects UI, server handlers and caller identity well; provider-cookie and role-metadata advice prevents a strong rating. |
| G. Logic / State / Concurrency Reasoning | 8 | 4 | 6.4 | Traces client/server transcript ownership and editable-error state, plus same-user collisions and listing costs. |
| H. Architecture / Root-Cause Reasoning | 8 | 4 | 6.4 | Compresses migration and creation-contract roots, explaining mock masking and differing trust boundaries. |
| I. Test-Quality Reasoning | 6 | 3 | 3.6 | Concrete failing-suite and fixture analysis; no demonstrated isolation of storage harness issue or lint diagnosis. |
| J. Scope Discipline / Signal-to-Noise | 5 | 4 | 4.0 | Focused major list with optional observations separated; some low-value concerns remain. |
| K. Operational Usefulness | 6 | 3 | 3.6 | Actionable paths and priorities, but cookie and trigger alternatives need correction and current overwrite reachability is missing. |
| L. Independent Reviewer Judgment | 5 | 4 | 4.0 | Finds non-obvious error reflection/state coupling and avoids turning missing build configuration into a conclusive defect. |
| **Total** | **100** | — | **73.2** | **B-** |

### REVIEWER_D — 54.6 / 100 — D

| Dimension | Weight | Score / 5 | Contribution | Written justification |
| --- | --- | --- | --- | --- |
| A. Finding Validity | 15 | 3 | 9.0 | Important source mechanisms real; redirect invalid, enumeration and several impact statements inaccurate or unsupported. |
| B. Important-Issue Coverage | 15 | 4 | 12.0 | Covers principal critical/high action, identity, prompt and migration families; medium logic/operations coverage remains limited. |
| C. Evidence Quality | 10 | 3 | 6.0 | Useful snippets and typecheck/tests/framework check; inconsistent failing-suite list and no exploit trace. |
| D. Severity Calibration | 7 | 1 | 1.4 | Six critical headings include low-strength timestamp enumeration; medium dead-code severity adds substantial inflation. |
| E. Confidence / Epistemic Discipline | 7 | 2 | 2.8 | Conditional disclosure, prompt uptake and enumeration are frequently presented as demonstrated behavior. |
| F. Security / Trust-Boundary Reasoning | 8 | 3 | 4.8 | Finds broad authorization surfaces, but false redirect and weak exploitability analysis need security filtering. |
| G. Logic / State / Concurrency Reasoning | 8 | 2 | 3.2 | Limited client state analysis; timestamp concern is poorly scoped and index-key behavior not traced. |
| H. Architecture / Root-Cause Reasoning | 8 | 2 | 3.2 | Recognizes systemic authorization and migration, but splits shared roots into multiple top-severity findings. |
| I. Test-Quality Reasoning | 6 | 3 | 3.6 | Explains fixture drift and tests correctly at aggregate level; exact suite list inconsistent and harness fidelity unexplored. |
| J. Scope Discipline / Signal-to-Noise | 5 | 2 | 2.0 | Repeated critical roots and speculative exploit detail create noise despite generally readable organization. |
| K. Operational Usefulness | 6 | 3 | 3.6 | Good locations and urgent surfaces, but severity and proposed exploit claims require significant senior correction. |
| L. Independent Reviewer Judgment | 5 | 3 | 3.0 | Independent investigation reaches important boundaries; novel redirect/timestamp avenues lack needed verification. |
| **Total** | **100** | — | **54.6** | **D** |

### REVIEWER_E — 40.8 / 100 — F

| Dimension | Weight | Score / 5 | Contribution | Written justification |
| --- | --- | --- | --- | --- |
| A. Finding Validity | 15 | 2 | 6.0 | Multiple central claims invalid or unresolved; surviving drift/auth/profile observations coexist with many partial assertions. |
| B. Important-Issue Coverage | 15 | 3 | 9.0 | Finds high agent authorization and profile navigation, but misses critical caller checks and provisioning mismatch. |
| C. Evidence Quality | 10 | 3 | 6.0 | Test/typecheck/build control and lint observation useful; claimed loading/security failures lack matching proof. |
| D. Severity Calibration | 7 | 1 | 1.4 | Critical missing configuration/middleware and high cleanup undermine the priority order; many medium preferences inflated. |
| E. Confidence / Epistemic Discipline | 7 | 1 | 1.4 | States framework and UI assumptions as facts despite absent or contradictory evidence. |
| F. Security / Trust-Boundary Reasoning | 8 | 2 | 3.2 | Agent caller binding and target checks useful; caller-auth omission, middleware mistake and cookie remedy are substantial weaknesses. |
| G. Logic / State / Concurrency Reasoning | 8 | 1 | 1.6 | First-message edit false positive and unproved loading consumer; little transcript or concurrency analysis. |
| H. Architecture / Root-Cause Reasoning | 8 | 2 | 3.2 | Groups manifest drift/duplication but fails to distinguish several policy, framework and actual root-cause questions. |
| I. Test-Quality Reasoning | 6 | 3 | 3.6 | Explains stale fixtures and runs controls; audit counts/default test environment do not establish relevant defects. |
| J. Scope Discipline / Signal-to-Noise | 5 | 1 | 1.0 | Large mixed list of speculation, policy choices, dead code and actual failures; priorities demand filtering. |
| K. Operational Usefulness | 6 | 2 | 2.4 | Several useful locations and one distinctive navigation path, but top recommendations could cause unnecessary or wrong changes. |
| L. Independent Reviewer Judgment | 5 | 2 | 2.0 | Controlled build and profile-link trace show initiative; verification effort not consistently applied to central assertions. |
| **Total** | **100** | — | **40.8** | **F** |

### REVIEWER_F — 76.0 / 100 — B

| Dimension | Weight | Score / 5 | Contribution | Written justification |
| --- | --- | --- | --- | --- |
| A. Finding Validity | 15 | 4 | 12.0 | Core security/contract findings survive; cross-user collision and UI-delete subclaims plus minor assertions need correction. |
| B. Important-Issue Coverage | 15 | 4 | 12.0 | Covers major trust boundaries, provisioning, state/concurrency and tooling; live Mission Control consequence only partial and profile link missed. |
| C. Evidence Quality | 10 | 4 | 8.0 | Jest/typecheck/lint and targeted suite/library analysis give concrete evidence; secondary event and scaling claims lack reproduction. |
| D. Severity Calibration | 7 | 4 | 5.6 | Usually differentiates high security, medium contracts and low cleanup; action criticality understated and provisioning/target deletion uneven. |
| E. Confidence / Epistemic Discipline | 7 | 3 | 4.2 | Explicit tradeoffs/live limits strong, but easy enumeration, cross-user collisions and universal summaries overreach. |
| F. Security / Trust-Boundary Reasoning | 8 | 4 | 6.4 | Strong index-versus-transcript and page-versus-handler distinctions; role-metadata advice and namespace mistake limit the ceiling. |
| G. Logic / State / Concurrency Reasoning | 8 | 3 | 4.8 | Good transcript and concurrent-save reasoning; index-key/rename scenarios unverified and cross-user collision wrong. |
| H. Architecture / Root-Cause Reasoning | 8 | 4 | 6.4 | Connects divergent creation paths, data ownership, migration and conditional writes; minor laundry-list fragmentation remains. |
| I. Test-Quality Reasoning | 6 | 4 | 4.8 | Best distinction between a failing test and faithful SSR simulation, plus broken lint; detailed harness verdict still provisional. |
| J. Scope Discipline / Signal-to-Noise | 5 | 3 | 3.0 | Core priorities useful and tradeoffs separated, but long miscellaneous/unused-code lists lower signal. |
| K. Operational Usefulness | 6 | 4 | 4.8 | Clear locations, failure paths and conditional-write direction; some unsafe or overbroad recommendations need correction. |
| L. Independent Reviewer Judgment | 5 | 4 | 4.0 | Strong independent choice to examine actual storage fallback, tooling and index/transcript authority rather than trust green historical claims. |
| **Total** | **100** | — | **76.0** | **B** |

## E. Comparative Ranking

| Rank | Anonymous reviewer | Weighted score / 100 | Frozen grade | Comparative judgment |
| --- | --- | --- | --- | --- |
| 1 | REVIEWER_F | 76.0 | B | Best balance of important coverage, test interpretation, root-cause reasoning and tradeoff labeling. |
| 2 | REVIEWER_C | 73.2 | B- | Strongest client/server state analysis alongside broad security coverage; cookie/remediation errors prevent the lead. |
| 3 | REVIEWER_B | 55.0 | C- | Concise, comparatively precise portal review; serious gaps in agent API security coverage. |
| 4 | REVIEWER_D | 54.6 | D | Broader important security coverage than B, offset by severity inflation, invalid redirect and weaker claim control. |
| 5 | REVIEWER_A | 45.4 | D | Useful migration/state concerns, but critical cleanup labels, repetition and important security omissions. |
| 6 | REVIEWER_E | 40.8 | F | Useful profile finding/build control, outweighed by a critical miss, invalid framework/edit claims and unsupported priorities. |

F versus C is a close 2.8-point comparison, not a categorical capability distinction. C traces live Mission Control failure better, identifies error reflection, and investigates saveable error state. F supplies stronger test-harness reasoning, separates RLS index privacy from transcript protection, handles cookie design more accurately, and covers concurrent writes. F's timestamp and role-metadata errors still need correction. A one-point change in the 15-weight validity dimension contributes 3 points and could reverse this order.

B versus D is effectively a near tie at 0.4 points. B wins under the frozen weights through higher validity, calibration, root-cause compression and signal-to-noise; D earns substantially more coverage credit. This is not a recommendation to use B alone for whole-system security: D finds L03/L04, which B misses. The letter-grade boundary exaggerates their tiny numerical difference. Any single one-point dimension reassessment is larger than the gap.

A and E both need substantial correction. A's poor priorities do not erase real service-role authorization and useful archive/concurrency reasoning. E's valid unique profile defect and build control do not compensate for missing the caller-authorization root and incorrectly prioritizing a middleware “fix.” These rankings reflect evidence quality and usefulness, not report length or operational economics.

No economics, model identity, token/request counts or runtime were used in scoring or ranking.

## F. Reviewer Role Assessment

| Reviewer | Best-supported engineering-review role | Appropriate responsibility and review support |
| --- | --- | --- |
| REVIEWER_A | Tactical migration/module reviewer | Useful for manifest, fixtures, state transitions and cleanup inventory; needs another reviewer to establish security coverage and priorities. |
| REVIEWER_B | Tactical portal/auth-provisioning reviewer | Useful for scoped action/SQL contract work; pair with agent-API/state coverage and verify security remediation. |
| REVIEWER_C | Broad senior / phase reviewer | Strong at cross-layer application and state reasoning; validate provider-specific security assumptions and role-provisioning advice. |
| REVIEWER_D | Security-focused triage reviewer | Useful at locating exposed privileged surfaces; have a verifier check exploit mechanisms, severity and shared roots before escalation. |
| REVIEWER_E | Exploratory UI/integration reviewer | Useful as an additional pass for navigation and build setup; findings need technical verification before implementation. |
| REVIEWER_F | Broad senior / phase reviewer; systems-review support | Best overall coverage and verification judgment here; suited to leading a phase review with focused checks on security repairs and missed product paths. |

These are overlapping behavior-based roles, not claims about intrinsic capability or identity. The evidence does not establish any reviewer as a sufficient sole principal-level sign-off authority.

## G. Referee Uncertainty / Potential Referee Errors

### Material limitations

1. **Source fidelity is unverified.** The authorized benchmark inputs were reports, not target code or deployment configuration. Exact excerpts, search completeness, installed versions and reported command outcomes cannot be independently authenticated. This materially limits adjudication; it is not a reason to dismiss internally coherent source proofs.
2. **Blinding was imperfect at filename level.** The initial listing exposed identity-bearing directory names before the prompt was read. It did not reveal anonymous mappings or report contents, and no matching was attempted. A fresh evaluator could avoid even that exposure.
3. **No real-service/deployed evidence.** None of the six reports demonstrates authenticated/unauthenticated action invocation against a configured service, a live cross-user transcript read, or instruction uptake by a running agent. L01 remains CRITICAL from its traced unrestricted capability; a live exploit is not required to establish severity.
4. **Generic documentation is not installed-source verification.** Official Next.js/Supabase documentation resolved framework claims. Target package versions/overrides were not inspected. Node URL checks were isolated and did not exercise NextURL, redirects, proxies or browsers.
5. **Counts have mixed granularity.** Some blocks contain several subclaims; valid INFO observations increase raw block precision without increasing important coverage. A partial-credit equivalent of 0.5 is disclosed as accounting, not a probabilistic validity estimate. Neither counts nor precision determined the weighted ranking.

### Unresolved or interpretation-sensitive adjudications

| Question | Current ruling | Evidence needed / potential referee error |
| --- | --- | --- |
| Does the loading flag disable a consumer? | U, L20 | Actual LoginForm/store subscription or a targeted browser test. B's no-reader assertion and E's consumer claim conflict; either could be wrong. |
| Can a superadmin reach the demoting form? | P, L13 | Full getUserById/page guards and a direct-route flow. The default expression is real evidence, but inaccessible inputs would remove the proposed current user scenario. |
| Can current Mission Control save fetch-error text? | P, L08 | A valid-agent component path in the frozen app, failed read and successful subsequent save. Current stale-roster rejection appears to block both requests. Fixing roster drift could expose the latent defect, but hypothetical future work is not a current reproduction. |
| Is the SSR localStorage test truly faulty? | Provisional supporting credit in F M1 | Complete test, module import/reset sequence and actual storage branch reproduction. F's library-aware reasoning is good evidence, not final proof that all product storage paths are safe. |
| What causes every one of the 38 test failures? | Aggregate accepted; universal single cause not accepted | Per-test traces. F identifies an exception; A speculates about persistence; D gives an inconsistent suite list. Consensus on totals does not settle each mechanism. |
| Does initials handling render “undefined”? | U, C concern 10 | Full expression or an isolated test. A join can suppress undefined elements, unlike explicit string conversion. |
| Are audit advisories exploitable/relevant? | U, E M7 | Advisory IDs, package/version paths, use/reachability and severity. Peer warnings alone do not establish runtime incompatibility. |
| Does changing pathname redirect off-site here? | I for D's supplied mechanism | A NextURL/browser trace could challenge the ruling if additional normalization or a chained redirect changes authority. Generic pathname assignment alone did not. |
| Are old messages retained by the real agent? | V source inference, L09 | Real-service edit/regenerate/reload trace. Assumes the connector's described append-only session semantics; a hidden upstream rewrite facility could change impact. |
| Do two administrators require conflict detection? | V conditional risk, L10 | Product concurrency/recovery requirements and GCS interleaving test. Last-write-wins may be an accepted priority tradeoff, but still loses an intermediate write/backup in the supplied sequence. |
| What are actual cache/row/query limits? | Qualified LOW/INFO or conditional MEDIUM | Response headers and deployment/API limits. Immutable asset exceptions, backend row caps and URL limits prevent universal assertions. |
| Are list exclusion, self-delete and flat roles bugs? | Policy-dependent, no manufactured misses | Product requirements. Avoid confusing unfamiliar but deliberate access policy with a technical authorization defect. |
| Do index keys/double rename lose UI state? | P conditional subclaims | Actual batching, unmount and blur/Enter sequence. F identifies descendant state; no report demonstrates the full event schedule. |
| Does deployed SQL match committed setup? | V committed contract mismatch, L06 | Current trigger definition/migration history. A newer live trigger changes runtime consequence but not the supplied code/schema disagreement. |
| Do backend prompts cause global compromise? | HIGH direct write; CRITICAL conditional impact | Prompt-consumption lifecycle, tools/data available to agents, service permissions and deployment perimeter. Writing text is not proof of automatic exfiltration. |

### Challenges to my strongest judgments

- **L01 CRITICAL:** The supplied used-action and service-role paths justify this despite no live exploit. However, external access restrictions and build-specific action exposure could reduce actual deployment reach. I have not assumed that all exports or anonymous action-ID discovery were independently demonstrated.
- **Cookie false-positive ruling:** C's statement is judged on its central claim that the existing SSR/browser architecture needlessly breaks a default HttpOnly boundary. JavaScript token exposure remains a real XSS tradeoff. F is not penalized for presenting that tradeoff explicitly. An intentionally server-only application would merit a different recommendation.
- **Novel findings:** E's profile path receives full source-supported credit despite the report's other errors. A's archive transition receives credit despite weak prioritization. C's save-error insight receives partial rather than full current-overwrite credit because its reachability is blocked by another reported defect. No novelty relative to the prohibited reference review is claimed.
- **Dangerous remediation:** B/C/F also give the safer explicit-update option. Their metadata-reading option is penalized as incomplete/unsafe advice, not as proof they necessarily would deploy an insecure trigger or that the existing trigger already escalates privileges.
- **F's “by design” labels:** A documented tradeoff does not erase a valid correctness concern; coverage credit includes transcript divergence and concurrency. Conversely, explicitly conditional observations are not treated as false positives just because product owners might accept them.
- **B/D ordering:** Coverage-heavy human judgment could reasonably prefer D; the frozen weighted arithmetic slightly favors B. This near tie should not be used to claim categorical superiority. F/C ordering is also sensitive to one dimension change.

Evaluator confidence is medium overall: stronger for quoted SQL/metadata mismatch, identity-binding omissions, framework conventions and isolated URL semantics; lower for unquoted UI consumers, exact failing-test attribution, deployment exploitability and product policy. No new issue was added solely from external news or advisories.

### Completion and validation record

All six anonymous reports were read in full and adjudicated. Each material finding block and technical concern has a classification; important subclaim errors remain visible inside partial findings. Scores include written justification for all 72 reviewer-dimension cells. The exact frozen weights and all weighted contributions were checked programmatically, and ranking, grade thresholds, finding counts and partial-credit arithmetic were recomputed independently from the report tables.

No target source, tests, configuration, dependencies or git state were intentionally modified. Only this report and temporary referee calculation files were written. No identities were inferred or disclosed.
