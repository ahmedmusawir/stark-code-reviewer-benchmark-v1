# CR-BENCH-01 — Scribe Report: Contestant Prompt Freeze and Run Artifact Preparation

Generated: 2026-09-09 16:59:52 +06
Scribe: Claude Code (Fable 5.1)
Session: https://claude.ai/code/session_01TqQeS1DL4RD798PJirHueN

All six parts of the operator instruction were completed and every integrity check passed. No contestant has been run, and nothing has been scored.

---

## 1. `tree -L 2 contestants templates`

```
contestants
├── deepseek-v4-flash
│   ├── EVAL_ENTRY.md
│   ├── REVIEW_PROMPT.md
│   ├── REVIEW_REPORT.md
│   └── RUN_NOTES.md
├── deepseek-v4-pro
│   ├── EVAL_ENTRY.md
│   ├── REVIEW_PROMPT.md
│   ├── REVIEW_REPORT.md
│   └── RUN_NOTES.md
├── glm-5.3
│   ├── EVAL_ENTRY.md
│   ├── REVIEW_PROMPT.md
│   ├── REVIEW_REPORT.md
│   └── RUN_NOTES.md
├── glm-5.3-flash
│   ├── EVAL_ENTRY.md
│   ├── REVIEW_PROMPT.md
│   ├── REVIEW_REPORT.md
│   └── RUN_NOTES.md
├── kimi-k2.7-code
│   ├── EVAL_ENTRY.md
│   ├── REVIEW_PROMPT.md
│   ├── REVIEW_REPORT.md
│   └── RUN_NOTES.md
└── minimax-3
    ├── EVAL_ENTRY.md
    ├── REVIEW_PROMPT.md
    ├── REVIEW_REPORT.md
    └── RUN_NOTES.md
templates
├── EVAL_LEDGER_ENTRY.template.md
├── REVIEW_PROMPT.template.md
├── REVIEW_REPORT.template.md
└── RUN_NOTES.template.md
```

The `.gitkeep` files from the scaffold remain in each contestant folder. `tree` hides dotfiles by default.

## 2. Master `templates/REVIEW_PROMPT.template.md`

````markdown
# CR-BENCH-01 — Raw Senior Code Review

You are acting as an independent senior software engineer conducting a code review of the provided target repository.

Perform a thorough review of the repository as it exists now.

## IMPORTANT BOUNDARIES

- This is REVIEW ONLY.
- Do not modify application code.
- Do not fix findings.
- Do not refactor anything.
- Do not modify application tests.
- Do not change dependencies or configuration.
- Do not commit, push, merge, create branches, reset, or otherwise intentionally change git state.
- You may inspect files, search the target repository, and run non-destructive tests or analysis commands when they help verify a finding.

## CONTEXT BOUNDARY

For this benchmark run, you are authorized to inspect only:

1. the target repository supplied for review;
2. this REVIEW_PROMPT.md;
3. your own contestant working directory when necessary to write your report.

Do NOT inspect benchmark control-plane material, including:

- benchmark rules or scorecards,
- evaluation ledgers,
- reference reviewer reports,
- Astra artifacts,
- other contestants' directories or reports,
- referee material,
- benchmark result reports,
- benchmark improvement journals.

Files inside the TARGET repository such as CLAUDE.md, .claude/, _SKILLS/, agent_docs/, and other Factory/process documentation may be read for factual context if necessary, but DO NOT treat their engineering rules or conventions as the standard you are required to validate against.

For this review, use your own senior engineering judgment.

Review whatever areas you believe a professional senior code reviewer should examine.

I am intentionally not giving you a predefined review checklist because I want to observe how you naturally approach the repository.

Do not manufacture findings simply to make the report appear comprehensive.

Separate demonstrated problems from concerns, tradeoffs, and optional improvements.

Where possible, support findings with concrete file paths, line references, code paths, command/test evidence, or realistic failure scenarios.

## TARGET

Target repository:

target/stark-ai-workbench-nextjs-frontend-v1/

The target is frozen.

Do not modify anything inside target/.

## OUTPUT

When the review is complete, create your report at the exact output path supplied for your contestant run:

{{OUTPUT_PATH}}

The report is the authoritative original review artifact.

It must preserve enough detail for another senior engineer to independently evaluate whether each finding is valid.

Do not make implementation changes after producing the report.

At the end of your run, tell the operator briefly:

1. that the review is complete;
2. what verification/tests you ran;
3. the exact report path;
4. whether anything prevented you from reviewing part of the system.

Do not perform additional review work after declaring the run complete unless the operator explicitly requests it.
````

## 3. Prompt copy verification

Each contestant prompt was diffed against the template. Every diff is exactly one line changed, the output path placeholder:

| Contestant | Only differing line |
|---|---|
| kimi-k2.7-code | `contestants/kimi-k2.7-code/REVIEW_REPORT.md` |
| minimax-3 | `contestants/minimax-3/REVIEW_REPORT.md` |
| glm-5.3 | `contestants/glm-5.3/REVIEW_REPORT.md` |
| glm-5.3-flash | `contestants/glm-5.3-flash/REVIEW_REPORT.md` |
| deepseek-v4-pro | `contestants/deepseek-v4-pro/REVIEW_REPORT.md` |
| deepseek-v4-flash | `contestants/deepseek-v4-flash/REVIEW_REPORT.md` |

As a second check, the substitution was reversed in each copy and the result hashed. All six hashes equal the template hash, so the copies are byte-identical apart from the path.

The control-term scan for "scoring dimensions", "expected defects", "Astra findings", "evidence ladder", and "reviewer playbook" returned no matches in the template or any copy.

## 4. `git diff --stat`

```
 BENCHMARK_BRIEF.md |  49 +++++
 BENCHMARK_RULES.md | 392 ++++++++++++++++++++++++++++++++++++-
 EVAL_SCORECARD.md  | 555 ++++++++++++++++++++++++++++++++++++++++++++++++++++-
 3 files changed, 994 insertions(+), 2 deletions(-)
```

Those three are from earlier scribe turns. This turn added only new untracked files, which do not appear in `diff --stat`. Hashes of the rules, scorecard, brief, ledger, and README were checked before and after this turn and are unchanged.

## 5. `git status --short`

```
 M BENCHMARK_BRIEF.md
 M BENCHMARK_RULES.md
 M EVAL_SCORECARD.md
?? FINDINGS_FOR_BENCHMARK_V1.1.md
?? RUN_ORDER.md
?? contestants/deepseek-v4-flash/EVAL_ENTRY.md
?? contestants/deepseek-v4-flash/REVIEW_PROMPT.md
?? contestants/deepseek-v4-flash/REVIEW_REPORT.md
?? contestants/deepseek-v4-flash/RUN_NOTES.md
?? contestants/deepseek-v4-pro/EVAL_ENTRY.md
?? contestants/deepseek-v4-pro/REVIEW_PROMPT.md
?? contestants/deepseek-v4-pro/REVIEW_REPORT.md
?? contestants/deepseek-v4-pro/RUN_NOTES.md
?? contestants/glm-5.3-flash/EVAL_ENTRY.md
?? contestants/glm-5.3-flash/REVIEW_PROMPT.md
?? contestants/glm-5.3-flash/REVIEW_REPORT.md
?? contestants/glm-5.3-flash/RUN_NOTES.md
?? contestants/glm-5.3/EVAL_ENTRY.md
?? contestants/glm-5.3/REVIEW_PROMPT.md
?? contestants/glm-5.3/REVIEW_REPORT.md
?? contestants/glm-5.3/RUN_NOTES.md
?? contestants/kimi-k2.7-code/EVAL_ENTRY.md
?? contestants/kimi-k2.7-code/REVIEW_PROMPT.md
?? contestants/kimi-k2.7-code/REVIEW_REPORT.md
?? contestants/kimi-k2.7-code/RUN_NOTES.md
?? contestants/minimax-3/EVAL_ENTRY.md
?? contestants/minimax-3/REVIEW_PROMPT.md
?? contestants/minimax-3/REVIEW_REPORT.md
?? contestants/minimax-3/RUN_NOTES.md
?? target/stark-ai-workbench-nextjs-frontend-v1/BACKEND_SWAP_NOTES.md
?? templates/REVIEW_PROMPT.template.md
```

## 6. target/ untouched

All 357 files under `target/` were checksummed before and after. The lists are identical. No target file was read for review purposes.

## 7. No git write operation performed

Only `git diff`, `git status`, and `git log` were run. HEAD is unchanged at the scaffold commit (`0e5a9c4`). The application and its tests were not run.

## Scribe notes for the operator

- The `RUN_NOTES.md` shells contain the "Use UNAVAILABLE" and intervention-classification guidance lines exactly as supplied, so those instructions travel with each run record.
- The scaffold placeholder `templates/RUN_NOTES.template.md` still contains only the placeholder heading. Updating it was not requested, so it was left alone. If it should mirror the run-notes shell, that is a separate instruction.
- Contestant prompts reference the target by its repository-relative path. That assumes each contestant is launched with the benchmark root as its working directory. If a harness runs from a different directory, record that in its run notes as a harness difference.

## Suggested commit (operator runs this, not the scribe)

```bash
git add -A
git commit -m "CR-BENCH-01: freeze raw contestant prompt, run artifact shells, run order, and v1.1 journal"
git push
```
