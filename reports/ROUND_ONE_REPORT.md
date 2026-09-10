# CR-BENCH-01 — Round One Report

Status: FINAL — reveal closeout 2026-09-10
Author: Benchmark Scribe (record assembly only). Judgments are attributed to their sources throughout.

Labels used: **[FACT]** observed/recorded in the frozen evidence · **[ASTRA]** blind referee judgment · **[JARVIS]** adjudication · **[FACTORY]** Factory recommendation derived from the above · **[HYPOTHESIS]** future work, not established.

## 1. What CR-BENCH-01 tested

[FACT] Six AI models acted as independent senior code reviewers on one frozen target under one identical prompt, with no checklist, no playbook, no Astra findings, no expected-defect list, and no scoring criteria. The round tested RAW, UNCOACHED reviewer behavior (`BENCHMARK_RULES.md` §1, §6). Playbook-guided review, other model families, and other targets were not part of Round One and are not mixed into this report.

[FACT] Target: `stark-ai-workbench-nextjs-frontend-v1` at pinned commit `466083f2b415d9faeb362eb5e48f6e259a42d840`, verified identical to source excluding .git, frozen before Candidate #1, and verified 357/357 against `TARGET_MANIFEST.sha256` at every closeout including this one.

[FACT] Instrument (rules v1.0, scorecard v1.0, raw prompt, run order) was frozen before Candidate #1 and unchanged throughout.

## 2. How the round ran

[FACT] Run order: kimi-k2.7-code, minimax-3, glm-5.3, glm-5.3-flash, deepseek-v4-pro, deepseek-v4-flash (all on 2026-09-09). Each run's only operator intervention was the mechanical launch instruction. Each original report was hashed at closeout; all six hashes still match.

[FACT] Harness anomalies recorded: Candidate #1's verification commands left gitignored build/dependency artifacts inside the target directory, which were not cleared between runs (frozen files unaffected; recorded in every run's notes). Candidate #5 was interrupted by an Ollama HTTP 429 session-quota limit and resumed in the same session after about 1.5 hours. A manual continuation instruction, if issued, was not confirmed at closeout.

[FACT] Reports were blinded to REVIEWER_A–F by random assignment with identity-only redaction (1–2 lines per report, one report needing none), fidelity-verified with zero unexplained differences.

## 3. Referee and adjudication

[FACT] Referee: GPT-6 Astra, HIGH reasoning, Codex CLI 0.154.0, one session, under a frozen prompt authorizing only the six blind reports, the scorecard, and the prompt template. Raw referee report preserved at SHA-256 `08d7108da6c91a7cab56332fd9631975851fdac2da6c638efb057ca88cbf4641`.

[ASTRA] Blind result: F 76.0 (B), C 73.2 (B-), B 55.0 (C-), D 54.6 (D), A 45.4 (D), E 40.8 (F). Close calls stated by the referee: F vs C is 2.8 points and reversible by a one-point validity change; B vs D is a 0.4-point near tie exaggerated by the letter-grade boundary. "No economics, model identity, token/request counts or runtime were used in scoring or ranking."

[JARVIS] Verdict: ACCEPT ASTRA REFEREE RESULT WITHOUT SCORE MODIFICATION. Blind ranking accepted F > C > B > D > A > E. Confidence MEDIUM-HIGH. No identities or economics used; no score changed.

## 4. Referee procedural findings

**RF-001 — Blinding Isolation Weakness.** [FACT] Astra self-disclosed that an overly broad file listing before reading the prompt exposed identity-bearing contestant directory names; the mapping and original reports were not inspected and no matching was attempted. [JARVIS] Procedural weakness; no demonstrated mapping contamination; does not invalidate CR-BENCH-01; physical isolation required in vNext. [HYPOTHESIS] A future blind-referee workspace should physically contain only authorized inputs (candidate for vNext; not an active rule change).

**RF-002 — Source-Independent Verification Limitation.** [FACT] Astra did not inspect the frozen target source; it adjudicated from the reports, permitted context, generic external documentation, and isolated checks, and lists "source fidelity is unverified" as its first material limitation. [JARVIS] Caused by current referee design, not an Astra protocol failure; does not justify retroactive score changes; future referee should receive read-only access to an isolated frozen target. [HYPOTHESIS] Open vNext design question.

[JARVIS] Additional instrument findings for vNext: physically isolate referee workspace; permit independent read-only frozen-target verification; define grade bands with explicit numeric boundaries; ensure document status metadata reflects actual freeze state.

## 5. Unblinded result

[FACT] Mapping (opened by operator after adjudication freeze): A = minimax-3, B = deepseek-v4-pro, C = glm-5.3-flash, D = deepseek-v4-flash, E = kimi-k2.7-code, F = glm-5.3.

| Rank | Contestant | Score | Grade |
|---|---|---|---|
| 1 | glm-5.3 | 76.0 | B |
| 2 | glm-5.3-flash | 73.2 | B- |
| 3 | deepseek-v4-pro | 55.0 | C- |
| 4 | deepseek-v4-flash | 54.6 | D |
| 5 | minimax-3 | 45.4 | D |
| 6 | kimi-k2.7-code | 40.8 | F |

Full table with caveats: `reports/FINAL_SCORECARD.md`.

## 6. Economics reconnected

[FACT] Operator-observed Ollama meter movements and request counts per contestant, and the DeepSeek V4 Pro quota incident, are in `reports/COST_ANALYSIS.md`, together with a reconciliation table showing where reveal-time figures differ from closeout run notes (three request counts differ by +1; one was newly supplied; two deltas are operator-derived). Percentage-point usage movements are provider-displayed operational meters (Ollama Cloud dashboard, operator-observed). They are NOT token counts, dollars, normalized compute, or benchmark scores. No monetary cost is inferred. Astra's own usage (≈40 percentage points of a 5-hour allowance, ≈6 of weekly) is recorded separately as referee cost, not contestant quality.

## 7. Factory recommendations

[FACTORY] glm-5.3: candidate stronger/phase reviewer; not proven sole principal sign-off authority. glm-5.3-flash: strong candidate tactical/BIM/FFM reviewer, 2.8 points behind at dramatically lower observed meter movement; deployment hypothesis pending validation. deepseek-v4-pro: materially weaker than both GLM variants with the highest observed demand and a harness-affecting quota interruption. deepseek-v4-flash: middle/lower; cheaper than Pro but not near GLM quality. minimax-3: possible supplemental/exploratory value; not a primary reviewer. kimi-k2.7-code: not supported as primary reviewer. No universal superiority is claimed. Details and limits: `reports/MODEL_ROLE_RECOMMENDATIONS.md`.

## 8. What Round One did not establish

[HYPOTHESIS] Repeat-run variance, cross-target transfer, coached/playbook performance, dollar cost, and whether the 2.8-point and 0.4-point gaps survive a second referee or second run. Any Fable/Sol or playbook experiments are future rounds and are not part of this record.

## 9. Record integrity at close

[FACT] Six original reports, six blind reports, the Astra report, the Jarvis adjudication, the mapping, the instrument, and the target (357/357) were all verified unchanged at reveal closeout. Only the four `reports/` artifacts were populated. One cosmetic defect noted, not corrected: `referee/JARVIS_ADJUDICATION.md` line 32 has the original placeholder heading appended to its last sentence.
