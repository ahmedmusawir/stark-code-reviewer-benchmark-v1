# CR-BENCH-01 — Blind Redaction Log

Created: 2026-09-10 12:13:41 +06

Rule applied: only text that directly reveals contestant identity was replaced, using the neutral marker `[BLINDED REVIEWER]`. Replacements were line-anchored to the specific identity-bearing lines found by a case-insensitive scan for contestant model names and contestant directory paths. No wording, grammar, Markdown, style, ordering, severity, evidence, or finding content was changed. Blinded files have the same line count as their originals.

Note: this log names source report paths (which contain contestant identity). It is control-plane material and is NOT part of Astra's input.

## REVIEWER_A

- Source report path: `contestants/minimax-3/REVIEW_REPORT.md`
- Blinded report path: `referee/blind/REVIEWER_A.md`
- Identity redactions: 1
- Identity categories removed: model name self-identification in report header
- Lines affected (original line numbers): L4
- Substantive review content intentionally changed: NO

## REVIEWER_B

- Source report path: `contestants/deepseek-v4-pro/REVIEW_REPORT.md`
- Blinded report path: `referee/blind/REVIEWER_B.md`
- Identity redactions: 0
- Identity categories removed: none (report contained no contestant-identifying text)
- Substantive review content intentionally changed: NO

## REVIEWER_C

- Source report path: `contestants/glm-5.3-flash/REVIEW_REPORT.md`
- Blinded report path: `referee/blind/REVIEWER_C.md`
- Identity redactions: 1
- Identity categories removed: model name self-identification in report header
- Lines affected (original line numbers): L1
- Substantive review content intentionally changed: NO

## REVIEWER_D

- Source report path: `contestants/deepseek-v4-flash/REVIEW_REPORT.md`
- Blinded report path: `referee/blind/REVIEWER_D.md`
- Identity redactions: 2
- Identity categories removed: model name self-identification in report header; report path containing model identity
- Lines affected (original line numbers): L3 L313
- Substantive review content intentionally changed: NO

## REVIEWER_E

- Source report path: `contestants/kimi-k2.7-code/REVIEW_REPORT.md`
- Blinded report path: `referee/blind/REVIEWER_E.md`
- Identity redactions: 2
- Identity categories removed: model name self-identification in report header; report path containing model identity
- Lines affected (original line numbers): L4 L331
- Substantive review content intentionally changed: NO

## REVIEWER_F

- Source report path: `contestants/glm-5.3/REVIEW_REPORT.md`
- Blinded report path: `referee/blind/REVIEWER_F.md`
- Identity redactions: 1
- Identity categories removed: model name self-identification in report header
- Lines affected (original line numbers): L3
- Substantive review content intentionally changed: NO

