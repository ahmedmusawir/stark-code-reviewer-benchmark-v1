/**
 * Agent manifest loader — BIM-003 (Amendment A3).
 *
 * `config/agents.manifest.json` is the single source of truth for which
 * agents exist and which bundle serves each one. The manifest carries
 * env-var NAMES only (AM-2): real bundle URLs live in `.env.local`, one
 * server-side var per bundle, never in git.
 *
 * Validation runs at module load (M1) — a malformed manifest fails the dev
 * server / build loudly, listing every problem at once. No schema deps;
 * hand-rolled guards by design.
 */

import manifestJson from '../../config/agents.manifest.json';

export interface BundleEntry {
  id: string;
  label: string;
  urlEnv: string;
}

export interface AgentEntry {
  name: string;
  bundle: string;
  label: string;
}

export interface AgentManifest {
  bundles: BundleEntry[];
  agents: AgentEntry[];
}

/**
 * Pure structural validation — throws one Error naming EVERY problem found.
 * Exported for unit tests (M-G5); production runs it once at module load.
 */
export function validateManifest(data: unknown): AgentManifest {
  const problems: string[] = [];
  const candidate = data as Partial<AgentManifest> | null;

  const bundles = Array.isArray(candidate?.bundles) ? candidate.bundles : null;
  const agents = Array.isArray(candidate?.agents) ? candidate.agents : null;

  if (!bundles) problems.push('`bundles` must be an array');
  else if (bundles.length === 0) problems.push('`bundles` must not be empty');
  if (!agents) problems.push('`agents` must be an array');
  else if (agents.length === 0) problems.push('`agents` must not be empty');

  const bundleIds = new Set<string>();
  for (const [i, bundle] of (bundles ?? []).entries()) {
    for (const field of ['id', 'label', 'urlEnv'] as const) {
      if (typeof bundle?.[field] !== 'string' || bundle[field].length === 0) {
        problems.push(`bundles[${i}].${field} must be a non-empty string`);
      }
    }
    if (typeof bundle?.id === 'string') {
      if (bundleIds.has(bundle.id)) {
        problems.push(`duplicate bundle id "${bundle.id}"`);
      }
      bundleIds.add(bundle.id);
    }
  }

  const agentNames = new Set<string>();
  for (const [i, agent] of (agents ?? []).entries()) {
    for (const field of ['name', 'bundle', 'label'] as const) {
      if (typeof agent?.[field] !== 'string' || agent[field].length === 0) {
        problems.push(`agents[${i}].${field} must be a non-empty string`);
      }
    }
    if (typeof agent?.name === 'string') {
      if (agentNames.has(agent.name)) {
        problems.push(`duplicate agent name "${agent.name}"`);
      }
      agentNames.add(agent.name);
    }
    if (typeof agent?.bundle === 'string' && !bundleIds.has(agent.bundle)) {
      problems.push(
        `agents[${i}] ("${agent.name}") references unknown bundle "${agent.bundle}"`,
      );
    }
  }

  if (problems.length > 0) {
    throw new Error(
      `Invalid agents.manifest.json — fix before continuing:\n- ${problems.join('\n- ')}`,
    );
  }
  return candidate as AgentManifest;
}

/** The validated manifest — importing this module validates it (M-G5). */
export const MANIFEST: AgentManifest = validateManifest(manifestJson);

/** Every declared agent name — load-time replacement for the dead union. */
export const KNOWN_AGENTS: string[] = MANIFEST.agents.map((a) => a.name);

/** Manifest order is meaningful: the first agent is the default (FLAG-B). */
export const DEFAULT_AGENT: string = MANIFEST.agents[0].name;

/** Sidebar items (M4): name is identity, label is what humans read. */
export function agentsForUi(): Array<{ name: string; label: string }> {
  return MANIFEST.agents.map(({ name, label }) => ({ name, label }));
}

/**
 * Pure resolution against any manifest — unit-testable (M-G3 table).
 * Returns the bundle's env-var NAME, or null for unknown agents.
 */
export function resolveBundleEnvVarIn(
  manifest: AgentManifest,
  agentName: string,
): string | null {
  const agent = manifest.agents.find((a) => a.name === agentName);
  if (!agent) return null;
  const bundle = manifest.bundles.find((b) => b.id === agent.bundle);
  return bundle ? bundle.urlEnv : null;
}

/**
 * Server-side resolution (M3) against the committed manifest: agent name →
 * env-var NAME. Returns null for unknown agents — the route emits a 400.
 */
export function resolveBundleEnvVar(agentName: string): string | null {
  return resolveBundleEnvVarIn(MANIFEST, agentName);
}
