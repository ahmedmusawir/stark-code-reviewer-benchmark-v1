/**
 * POST /api/agent/run — native ADK connector (BIM-002; upstream is now the
 * ADK bundle's api_server directly — the Python wrapper is retired).
 *
 * External contract FROZEN and identical to A1: accepts RunAgentRequest →
 * `{ response, session_id }`; 500 config fault, 502 upstream/parse fault;
 * optional Authorization passed through (reserved slot, R2). Internals port
 * the wrapper's session bootstrap, not-found→create→retry-once loop, and
 * reversed-event-scan response selection.
 *
 * @see agent_docs/CURRENT_APP/BIM002/DATA_CONTRACT_AMENDMENT_A2.md
 */

import { NextResponse } from 'next/server';

import { resolveBundleEnvVar } from '@/config/manifest';
import type { RunAgentRequest } from '@/types';

import { ConnectorError, runAgentFlow } from '../_lib/adk';

// Create + run + retry share a 90s budget (A2.3 §5); maxDuration keeps a
// future serverless host from imposing a shorter default.
export const maxDuration = 90;

export async function POST(req: Request) {
  const auth = req.headers.get('authorization'); // reserved auth slot (R2)

  try {
    const body = (await req.json()) as RunAgentRequest;

    // BIM-003 (M3): the manifest decides which bundle serves this agent.
    const urlEnv = resolveBundleEnvVar(body.agent_name);
    if (!urlEnv) {
      return NextResponse.json(
        { error: `Unknown agent: ${body.agent_name}` },
        { status: 400 },
      );
    }
    const baseUrl = process.env[urlEnv];
    if (!baseUrl) {
      return NextResponse.json(
        { error: `${urlEnv} is not configured` },
        { status: 500 },
      );
    }

    const result = await runAgentFlow({ baseUrl, auth }, body);
    return NextResponse.json(result, { status: 200 });
  } catch (e) {
    if (e instanceof ConnectorError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
