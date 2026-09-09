# ANTI-PATTERNS — stark-recon

Recon-specific failure modes. Each is a way a recon can betray its purpose.

---

### AP-1 — Trusting a doc claim without verifying on disk

**The cardinal sin.** The handbook says `app-role.ts` exists, so the recon writes "app-role.ts exists" without running `ls`. This is the exact failure the skill was built to prevent. **Every doc claim is a CLAIM until disk confirms it.** If you didn't run the command, you didn't verify it.

### AP-2 — Fixing defects during recon

The recon finds `user: any` and "helpfully" types it. NO. Recon is read-only **of the inspected codebase**. It REPORTS the defect with a label and a recommendation; a separate authorized pass fixes it. (Writing the report FILE is not a "fix" — it's the deliverable. The prohibition is on mutating the code under inspection.)

### AP-10 — Producing the report on-screen only (the file-output failure)

The recon assembles a beautiful report and prints it to chat — but never writes it to a file. **This is a failed recon.** A report that lives only in chat scrollback can't be referenced later, can't be diffed against the next recon, can't be version-tracked, and forces the Operator to copy-paste it around. The full report MUST be written to `agent_docs/recon/RECON_<project>_<phase>_<YYYY-MM-DD>.md`. On-screen gets only a short confirmation + the path + a 3-5 line headline. This anti-pattern is why v1.1 made file-output an explicit Output Contract — early runs went to screen because "read-only" was misread as "write nothing at all." Read-only protects the *inspected code*; the report file is the deliverable.

### AP-3 — Skipping the Surprises section

The mission's open-ended sweep feels optional because it has no fixed checklist. It is the OPPOSITE of optional — it's where the next unknown lesson lives (the orphan files, the unimported primitive with `as any`, the stale-doc fossil). The known questions catch known drift; the Surprises section catches what no one thought to ask.

### AP-4 — Unlabeled findings

A report that states facts without EVIDENCE/INFERENCE/CLAIM/GAP/QUESTION labels forces the Architect to guess what was verified. That reintroduces exactly the blind-authoring risk recon exists to remove. Label everything.

### AP-5 — Mutating anything / running git

`cd && git show` can trigger repo hooks. Any write changes the snapshot. Recon observes only: read, grep, build (build is read-only of source). No writes, no git, no hooks.

### AP-6 — Trickling findings instead of one assembled report

Reporting section-by-section as you go, in fragments, forces the Architect to reassemble. Run the whole mission, assemble ONE structured report in the template format, hand it off once.

### AP-7 — Treating recon as brain-drain

Brain-drain is a deep architecture extraction — 11 evidence docs, hours, full system map. Recon is fast, targeted doc-vs-disk verification — one report, ~30 min, focused only on drift that would mislead authoring. Don't write 11 docs. Don't map every function. Answer the mission and stop.

### AP-8 — Stale recon treated as current

A Recon Report is a snapshot. If a phase closed, a kit was upgraded, or branches merged since the report, it's stale — re-run before authoring. Authoring against a stale recon is the same failure as authoring against a stale handbook, one level up.

### AP-9 — Letting seeded examples read as requirements

The mission's seeded examples (the QR fossil, the `app-role.ts` lie, etc.) are ILLUSTRATIONS of drift classes from a past run, not requirements for the current repo. Replace them with what THIS repo shows. A recon that reports a past project's findings as if they were the current repo's is worse than no recon.
