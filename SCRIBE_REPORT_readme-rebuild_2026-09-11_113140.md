# SCRIBE REPORT — CR-BENCH-01 README Rebuild

- **Generated:** 2026-09-11 11:31:40 +0600
- **Scribe:** Claudy (Claude Fable 5.1) — Benchmark Scribe + Documentation Editor
- **Session:** https://claude.ai/code/session_016bCHcyeKGsYBFRBGnh32Hr
- **HEAD at time of report:** `b387885f3d7ad82b51d0bf47c36df6429ae72009`
- **Benchmark status:** CR-BENCH-01 COMPLETE / CLOSED (unchanged)

## What was done

`README.md` was replaced from scratch as the definitive public landing page for CR-BENCH-01. The previous two-line README was not preserved beyond its repository identity (six models, code-reviewer benchmark, Ollama Cloud provider).

Primary sources used:

- `STARK_CODE_REVIEWER_BENCHMARK_ROUND_ONE_REPORT.md` — factual detail, methodology, scores, findings, limitations, economics, referee process, recommendations, future experiments.
- `STARK_CODE_REVIEWER_BENCHMARK_ROUND_ONE_EXECUTIVE_BRIEF_v3.pdf` — narrative arc, hierarchy, emphasis, tone.

Verification sources inspected (read-only): `reports/FINAL_SCORECARD.md`, `reports/COST_ANALYSIS.md`, `reports/MODEL_ROLE_RECOMMENDATIONS.md`, `reports/ROUND_ONE_REPORT.md`, `referee/ASTRA_REFEREE_REPORT.md` (role table §F, block-count table, close calls §E), `referee/JARVIS_ADJUDICATION.md`, `referee/BLIND_MAPPING.md`, `referee/BLIND_FIDELITY_REPORT.md`, `BENCHMARK_BRIEF.md`, `EVAL_SCORECARD.md` headings, `TARGET_MANIFEST.sha256` (357 lines).

## Source-conflict check

No factual disagreement was found between the Markdown report and the PDF. Scores, grades, request counts, session/weekly deltas, the DeepSeek V4 Pro incident, block tallies, issue families L01–L06, RF-001/RF-002, the Jarvis verdict and confidence, and the Factory tiers all agree.

## README contents (16 sections)

Hero and result · Why the benchmark exists · Final leaderboard (with Astra role labels and both close-call caveats) · GLM 5.3 Flash surprise (96% / 12% ratios labeled descriptive only) · Operational usage table (≥ +74.8 pp lower bound, ≈ +10.0 pp approximate, pp ≠ tokens/dollars) · 12 scoring dimensions with correct weights · Issue families and 120-block tally · Six model profiles · Fairness and blinding · Referee and Jarvis adjudication · Limitations (RF-001, RF-002, one-repo/one-round) · Factory decision (three tiers, routine flow, escalation triggers, labeled hypothesis) · Proves / does not prove · Next experiments (labeled future) · Artifact map (28 relative links, all verified to exist) · Closing doctrine line and CLOSED status.

## Quality gate results

- All six scores and grades match the canonical leaderboard.
- All six request counts and usage deltas match `reports/COST_ANALYSIS.md`.
- No blind IDs are presented as final identities; they appear only in the mapping table, the Jarvis ranking line, and the blind-flow diagram.
- No percentage-point value is described as tokens or dollars.
- 28 relative links checked: all resolve.
- Markdown tables: pipe counts consistent in every row.
- No duplicated headings; jump-link anchors follow GitHub slug rules.
- Explicit `<br>` breaks added inside HTML cells so labels do not collapse on GitHub.

## Editorial choices worth a glance

- Provider named as Ollama Cloud (from `reports/COST_ANALYSIS.md` and the PDF).
- BIM / FFM left unexpanded; the target docs confirm FFM = Frontend-First Module but record no expansion for BIM.
- `referee/BLIND_MAPPING.md` is linked because the mapping is already public in the final report; the file's own "confidential" banner refers to the pre-reveal referee package.

## Not done (by rule)

No git write commands were run. Benchmark evidence files were not modified.

## Suggested commit block (operator runs this)

```bash
git add README.md SCRIBE_REPORT_readme-rebuild_2026-09-11_113140.md
git commit -m "CR-BENCH-01: rebuild README as definitive Round One landing page"
git push
```

The two untracked final deliverables (`STARK_CODE_REVIEWER_BENCHMARK_ROUND_ONE_REPORT.md` and the v3 executive PDF) are referenced by the README and are still untracked; add them in the same commit if they are meant to ship together.
