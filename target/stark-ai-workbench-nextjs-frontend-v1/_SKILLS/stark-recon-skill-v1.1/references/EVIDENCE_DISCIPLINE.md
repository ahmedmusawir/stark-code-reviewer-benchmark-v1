# EVIDENCE DISCIPLINE

> Every finding in a Recon Report carries one of five labels. Without labels, the Architect can't tell what was verified from what was guessed — and authoring against a guess is the exact failure this skill prevents.

---

## The Five Labels

- **EVIDENCE** — directly found on disk, with a citation (file path + line, or the exact command + its output). The strongest claim. *"`useAuthStore.user` is typed `SupabaseUser | null` — EVIDENCE: src/store/useAuthStore.ts:12."*

- **INFERENCE** — a reasonable conclusion drawn from observed structure, with the basis stated. *"The kit gets away with the server-only AppRole import because every value-level usage is in a server component — INFERENCE from grep of import sites."*

- **CLAIM** — a doc or the operator says it; NOT independently verified. Always flag claims for verification. *"Handbook says the kit uses Vitest — CLAIM; see EVIDENCE below where package.json shows Jest."*

- **GAP** — an expected thing was not found. State what was expected and where you searched. *"No `src/middleware.ts` — GAP (expected per pre-Next-16 convention); `src/proxy.ts` present instead, which is correct for Next 16."*

- **QUESTION** — needs operator clarification; phrased as an explicit question. *"`DashboardCard.tsx` has zero consumers — QUESTION: delete as orphan, or keep as a Phase-2 starter pattern?"*

---

## The Governing Rule: Disk Wins

When any doc (handbook, APP_BRIEF, prior session log) and the filesystem disagree, **the filesystem is truth.** The doc gets flagged as drift; the report records reality.

This is non-negotiable. The entire reason `stark-recon` exists is that docs drift out of true and Architects author against them. Recon's job is to surface every such drift so the Architect authors from disk, not from a stale claim.

## Read-Only

Recon **reports** drift; it never **fixes** it. Finding a defect (a `: any`, an orphan file, a stale env name) means logging it with a label and a recommendation — not patching it. Fixing is a separate, explicitly-authorized pass (a cleanup cluster or an FFM build), never part of recon. The recon must leave the repo byte-for-byte unchanged and run zero git operations.

## Citation Style

- File facts: `path:line` (`src/utils/app-role.ts:1`).
- Command facts: the command + the salient output (`grep -E '"test":' package.json → "test": "jest"`).
- Absence facts: the command that found nothing (`find src/app -type d -name "(superadmin)" → no results`).

A finding the Architect can't trace to a citation is not EVIDENCE — downgrade it to INFERENCE or CLAIM and say so.
