/**
 * Unit tests for the agent manifest loader (BIM-003).
 * Intent (Rule K9): the validator fails LOUDLY on every malformed shape
 * (M-G5), resolution routes each agent to its own bundle's env var (M-G3),
 * and the committed manifest itself is valid and complete.
 */

import {
  DEFAULT_AGENT,
  KNOWN_AGENTS,
  MANIFEST,
  agentsForUi,
  resolveBundleEnvVar,
  resolveBundleEnvVarIn,
  validateManifest,
} from '@/config/manifest';

const VALID = {
  bundles: [
    { id: 'v1', label: 'Bundle One', urlEnv: 'URL_ONE' },
    { id: 'v2', label: 'Bundle Two', urlEnv: 'URL_TWO' },
  ],
  agents: [
    { name: 'alpha_agent', bundle: 'v1', label: 'Alpha' },
    { name: 'beta_agent', bundle: 'v2', label: 'Beta' },
  ],
};

describe('validateManifest (M-G5 — loud failures)', () => {
  it('accepts a valid manifest', () => {
    expect(() => validateManifest(VALID)).not.toThrow();
  });

  it('rejects duplicate agent names, naming the duplicate', () => {
    const bad = {
      ...VALID,
      agents: [...VALID.agents, { name: 'alpha_agent', bundle: 'v1', label: 'Dup' }],
    };
    expect(() => validateManifest(bad)).toThrow(/duplicate agent name "alpha_agent"/);
  });

  it('rejects duplicate bundle ids, naming the duplicate', () => {
    const bad = {
      ...VALID,
      bundles: [...VALID.bundles, { id: 'v1', label: 'Again', urlEnv: 'URL_X' }],
    };
    expect(() => validateManifest(bad)).toThrow(/duplicate bundle id "v1"/);
  });

  it('rejects an unknown bundle reference, naming agent and bundle', () => {
    const bad = {
      ...VALID,
      agents: [{ name: 'ghost_agent', bundle: 'nope', label: 'Ghost' }],
    };
    expect(() => validateManifest(bad)).toThrow(
      /"ghost_agent"\) references unknown bundle "nope"/,
    );
  });

  it('rejects empty lists', () => {
    expect(() => validateManifest({ bundles: [], agents: [] })).toThrow(
      /`bundles` must not be empty[\s\S]*`agents` must not be empty/,
    );
  });

  it('rejects missing/empty fields with the exact path', () => {
    const bad = {
      bundles: [{ id: 'v1', label: '', urlEnv: 'URL_ONE' }],
      agents: [{ name: 'a', bundle: 'v1' }],
    };
    expect(() => validateManifest(bad)).toThrow(/bundles\[0\]\.label/);
    expect(() => validateManifest(bad)).toThrow(/agents\[0\]\.label/);
  });

  it('rejects non-object input without crashing', () => {
    expect(() => validateManifest(null)).toThrow(/must be an array/);
    expect(() => validateManifest('nope')).toThrow(/must be an array/);
  });

  it('lists ALL problems in one throw (not first-error-only)', () => {
    const bad = {
      bundles: [{ id: 'v1', label: 'One', urlEnv: 'URL_ONE' }],
      agents: [
        { name: 'a', bundle: 'v1', label: 'A' },
        { name: 'a', bundle: 'missing', label: 'A2' },
      ],
    };
    try {
      validateManifest(bad);
      throw new Error('expected validateManifest to throw');
    } catch (e) {
      const message = String(e);
      expect(message).toContain('duplicate agent name "a"');
      expect(message).toContain('references unknown bundle "missing"');
    }
  });
});

describe('resolution (M-G3 — each agent to its own bundle)', () => {
  it('routes agents to their own bundle env vars in a two-bundle manifest', () => {
    const manifest = validateManifest(VALID);
    expect(resolveBundleEnvVarIn(manifest, 'alpha_agent')).toBe('URL_ONE');
    expect(resolveBundleEnvVarIn(manifest, 'beta_agent')).toBe('URL_TWO');
  });

  it('returns null for unknown agents (routes turn this into 400)', () => {
    const manifest = validateManifest(VALID);
    expect(resolveBundleEnvVarIn(manifest, 'ghost_agent')).toBeNull();
  });
});

describe('the committed manifest', () => {
  // ROSTER-AGNOSTIC by design (BIM-004 baseline repair; landed on both
  // lineages, unified at the bim-004→bim-005 merge): M-G2 promises that
  // adding an agent is a JSON edit with ZERO code changes — so these tests
  // assert structural invariants, never an exact roster. The original five
  // must be PRESENT; extras added via the four-line test are legitimate.
  it('is valid, includes the original five agents, and declares v1 + v2-local', () => {
    for (const original of [
      'greeting_agent',
      'jarvis_agent',
      'calc_agent',
      'product_agent',
      'ghl_mcp_agent',
    ]) {
      expect(KNOWN_AGENTS).toContain(original);
    }
    expect(MANIFEST.bundles.map((b) => b.id)).toEqual(
      expect.arrayContaining(['v1', 'v2-local']),
    );
  });

  it('every declared agent resolves to a declared bundle env var', () => {
    const declaredEnvVars = MANIFEST.bundles.map((b) => b.urlEnv);
    for (const agent of KNOWN_AGENTS) {
      expect(declaredEnvVars).toContain(resolveBundleEnvVar(agent));
    }
  });

  it('defaults to the first manifest agent, whichever it is (FLAG-B)', () => {
    expect(DEFAULT_AGENT).toBe(MANIFEST.agents[0].name);
  });

  it('exposes one ui item per agent with a non-empty label', () => {
    const items = agentsForUi();
    expect(items).toHaveLength(KNOWN_AGENTS.length);
    for (const item of items) {
      expect(item.label.length).toBeGreaterThan(0);
    }
  });

  it('carries env-var NAMES, never URLs (AM-2)', () => {
    const raw = JSON.stringify(MANIFEST);
    expect(raw).not.toMatch(/https?:\/\//);
  });
});
