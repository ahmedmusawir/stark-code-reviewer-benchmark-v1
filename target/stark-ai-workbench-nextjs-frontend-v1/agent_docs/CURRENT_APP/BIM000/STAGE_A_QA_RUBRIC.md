# BIM-001 — STAGE A: ARCHITECT QA RUBRIC
## How the Recon Report Gets Graded (any Architect, any session)

> Read by the **Architect** after Claudy delivers the Stage A recon report. Claudy does not execute this file — but he may read it to know what his report will be judged against. The Coordinator uses the verdict this produces to authorize (or not) Stage B.

---

## The Seven Checks (fail any → report returned for correction, no verdict issued)

| # | Check | Pass condition |
|---|-------|----------------|
| Q1 | **Label discipline** | Every finding carries one of the skill's five labels (EVIDENCE / INFERENCE / CLAIM / GAP / QUESTION). Zero unlabeled claims. Zero EVIDENCE without a file:line or verbatim command output. |
| Q2 | **Checklist complete** | All twelve assumptions A1–A12 answered, each with a label and evidence. No silent skips — an unverifiable item is a labeled GAP with a reason, not a missing row. |
| Q3 | **Read-only integrity** | Git capture (before/after) shows zero source changes — only the report, the pointer file, node_modules, and the session log may differ. **Any other diff = mission failure regardless of report quality.** |
| Q4 | **Conflicts preserved, never resolved** | Every doc-vs-disk drift quotes BOTH sides verbatim. If Claudy picked a winner or "fixed" anything, fail. |
| Q5 | **Baseline is verbatim** | Real output blocks from the test/lint/build runs — not paraphrase, not summary prose. Failures carry IDs and the words "logged, not fixed." |
| Q6 | **Verdict is earned** | The recommended GO/AMEND/BLOCK follows from the evidence table and names its supporting findings by ID. A verdict that doesn't cite findings is an opinion, not a verdict. |
| Q7 | **No scope leak** | Zero Stage B implementation content, zero fixes, zero refactors, zero "suggestions implemented." The Surprises section exists and was genuinely attempted (an empty Surprises section with no sweep evidence is a red flag, not a clean bill). |

## Then: the Binding Verdict

If all seven pass, the Architect rules — and may **disagree** with Claudy's recommendation (the evidence binds, not the Engineer's read of it):

- **GO** — every load-bearing Stage B assumption (A1–A11) holds; drift, if any, touches nothing Stage B builds on. Stage B files stand as written.
- **AMEND** — Stage B is viable but the Architect edits the Stage B brief and/or amendment with **named** changes (assumption → observed reality → edit made), bumps their version, and records the amendments in the verdict doc.
- **BLOCK** — a specific finding makes execution unsafe (wrapper down, contract tests red at baseline, forbidden zones missing as named, or an unexpected structural surprise). Name the blocker and the exact unblock condition. Nothing proceeds until it clears.

## Output: the Verdict Document

Write `STAGE_A_ARCHITECT_QA_VERDICT.md` into this folder:

1. **Verdict:** GO / AMEND / BLOCK (one line, top of file)
2. **Rubric results:** Q1–Q7, one line each
3. **Findings accepted / rejected:** any rejected finding named with the reason
4. **Amendments made** (AMEND only): the named list + which files were edited
5. **Decision items for the Coordinator:** D1 sentinel ruling (if still open) + the plain-words Stage B authorization request
6. **One-paragraph decision brief** in plain language — what recon found, what was ruled, what Tony signs

The Coordinator authorizes Stage B only after this document exists.

---

**Version 1.0** · 2026-07-15 · Restored from the retired BIM-000 brief §11 into the unified module (self-containment fix — Coordinator catch). After 2–3 BIM runs this rubric graduates into `BIM_ARCHITECT_QA_RUBRIC.md` in the factory playbook kit.
