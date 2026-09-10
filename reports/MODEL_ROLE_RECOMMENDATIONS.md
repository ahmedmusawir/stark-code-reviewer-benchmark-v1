# CR-BENCH-01 — Model Role Recommendations

Status: FINAL for Round One — reveal closeout 2026-09-10
Evidence base: one frozen target, one identical raw prompt, one run per contestant, one blind referee (Astra) accepted without modification by Jarvis. Every recommendation below is bounded by that evidence. None claims universal model superiority.

Reading guide: **Observed** = fact from the frozen record. **Referee** = Astra's blind judgment. **Recommendation** = Factory role hypothesis derived from the two. **Pending** = what would be needed to promote a hypothesis.

## glm-5.3

- Observed: highest raw-review quality score in CR-BENCH-01 (76.0, B). Highest request count and second-highest session-meter movement among contestants.
- Referee: "best balance of important coverage, test interpretation, root-cause reasoning and tradeoff labeling"; timestamp and role-metadata errors still need correction.
- Recommendation: candidate stronger / phase reviewer.
- Not established: sole principal sign-off authority. A B-grade single-run result with noted errors does not prove that.
- Pending: repeat runs, a second target, and a coached/playbook condition.

## glm-5.3-flash

- Observed: second raw-review quality score (73.2, B-), 2.8 points behind glm-5.3. Dramatically lower observed session-meter movement in this run (+3.2 vs +26.5 percentage points) and roughly a quarter of the requests.
- Referee: strongest client/server state analysis alongside broad security coverage; cookie/remediation errors prevented the lead. Referee explicitly states a one-point validity change could reverse the order with glm-5.3.
- Recommendation: strong candidate tactical / BIM / FFM reviewer.
- Status: this is a deployment hypothesis pending additional benchmark validation, not a proven assignment.

## deepseek-v4-pro

- Observed: 55.0, C-. Materially weaker raw-review score than both GLM variants (−21.0 and −18.2 points). Highest observed contestant operational demand (session meter lower-bounded at ≥ 74.8 percentage points across two quota windows). The only HTTP 429 interruption of the round, with about 1.5 hours of operator-observed recovery delay.
- Referee: concise, comparatively precise portal review; serious gaps in agent-API security coverage. Near tie with deepseek-v4-flash (0.4 points).
- Recommendation: not supported as a primary or phase reviewer by this round. The quota interruption materially affected harness operation and would need to be engineered around before any routine role.

## deepseek-v4-flash

- Observed: 54.6, D (band applied on unrounded total). Middle/lower result. Cheaper than Pro operationally in this run (+15.8 vs ≥ +74.8 session percentage points) but did not approach GLM quality.
- Referee: broader important security coverage than Pro, offset by severity inflation, an invalid redirect claim, and weaker claim control; found issues Pro missed.
- Recommendation: not supported as a primary reviewer. Possible supplemental security-coverage pass, subject to false-positive burden; hypothesis only.

## minimax-3

- Observed: 45.4, D. Lower raw-review result. Low observed meter movement (+5.7 percentage points, derived).
- Referee: useful migration/state concerns; critical cleanup labels, repetition, important security omissions.
- Recommendation: may have supplemental / exploratory value. Not supported as a primary reviewer by this benchmark.

## kimi-k2.7-code

- Observed: 40.8, F. Lowest raw-review result. Highest request count among the non-GLM contestants (88); meter movement approximate (~+10 percentage points).
- Referee: a valid unique profile defect and build control, outweighed by a critical miss, invalid framework/edit claims, and unsupported priorities.
- Recommendation: not supported as a primary code reviewer by CR-BENCH-01.

## Cross-cutting limits on all recommendations

- Single run per contestant; no repeat-run variance measured.
- Single target repository; domain transfer is untested.
- Raw/uncoached condition only; playbook-guided behavior was deliberately not tested in Round One.
- Referee did not inspect target source (RF-002); referee blinding had a filename-level weakness (RF-001). Jarvis ruled neither invalidates the round.
- Two of the five adjacent-rank gaps (1–2 and 3–4) are inside the referee's own stated one-dimension sensitivity.
- Meter movements are provider gauges, not costs. No dollar figures exist in this record.
