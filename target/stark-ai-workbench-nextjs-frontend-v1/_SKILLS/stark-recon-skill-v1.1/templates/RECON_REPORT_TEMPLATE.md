# RECON REPORT TEMPLATE — Output Format

> The format `stark-recon` answers the mission in. The Architect reads this report and authors the next brief/FFM from it. Lead with the Day-0 sweep; flag every doc-vs-disk drift; make the Surprises section rich; close with a Recommendation to Architect.
>
> **This report is WRITTEN TO A FILE — never on-screen only.** Save the full report to `agent_docs/recon/RECON_<project>_<phase>_<YYYY-MM-DD>.md` (create the folder if needed). On-screen, print only a one-line confirmation, the file path, and a 3-5 line headline summary.

---

## Recon Report Format (What Claudy Returns)

Claudy answers in this structure:

```
## RECON REPORT — <project> <phase>

### Section 1 — Stack Versions
- Next.js: <actual>
- React: <actual>
- Tailwind: <actual> → token mechanic: <HSL/config OR @theme/OKLCH>
- TypeScript: <actual>
- Node: <actual or "not pinned">

### Section 2 — Kit Structure vs Handbook
- Handbook claims verified: <list confirmed>
- DRIFT FOUND: <list every handbook claim that's false, with reality>
- Existing src/services/: <contents or "empty/absent">

### Section 3 — Auth Pattern
- User read via: <actual mechanism>
- Role resolved via: <actual mechanism + file>
- Existing auth service: <yes/no — if yes, what>
- user_metadata role smells: <count + locations, or "none">

### Section 4 — Design Reality
- Tokens live in: <path>
- Hardcoded numbered colors: <count> in <files>
- Dark mode: <class/media>
- Font setup: <current>
- Theme toggle: <present/absent>

### Section 5 — Database
- Migrations: <count>
- Tables shipped: <list>
- Triggers/functions: <list>
- RLS: <present/absent>

### Section 6 — Skills/Security/Env
- Skills present: <list + which CWD they resolve from>
- Security audit: <state>
- Required env vars: <list>
- Launch CWD: <path>

### Section 8 — Demo / Tutorial Scaffolding
- Demo features found: <list>
- Full cascade per feature: <complete file list — services, stores, components, routes, types, utils>
- Third-party demo APIs: <list, e.g. jsonplaceholder>
- Recommended deletion bucket: <which sub-phase>

### Section 9 — FFM Packaging
- tsconfig excludes agent_docs/**: <yes/no — if no, FLAG>
- Test runner excludes agent_docs: <yes/no>
- .ts files under agent_docs that would compile: <list>

### Section 10 — Surprises
- <anything unexpected — this is the highest-value section>
- cn() helper present + standard: <yes/no>

### Recommendation to Architect
- <any FFM authoring implications Claudy spotted>
- <every handbook claim that proved FALSE against the filesystem>

---
