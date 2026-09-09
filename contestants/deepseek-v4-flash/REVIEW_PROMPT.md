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

contestants/deepseek-v4-flash/REVIEW_REPORT.md

The report is the authoritative original review artifact.

It must preserve enough detail for another senior engineer to independently evaluate whether each finding is valid.

Do not make implementation changes after producing the report.

At the end of your run, tell the operator briefly:

1. that the review is complete;
2. what verification/tests you ran;
3. the exact report path;
4. whether anything prevented you from reviewing part of the system.

Do not perform additional review work after declaring the run complete unless the operator explicitly requests it.
