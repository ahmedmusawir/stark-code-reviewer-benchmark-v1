/**
 * /api/agent/instructions — Mission Control LIVE (BIM-005).
 *
 * GET  ?agent=<name>            → { instructions: string }
 * PUT  { agent_name, content }  → { ok: true, backup: string | null }
 *
 * Server-side only: GCS credentials (ADC) and object paths never reach the
 * client — the client sends manifest-validated agent NAMES, nothing else.
 * Error surface: unknown agent → 400 · unset env → 500 naming the var ·
 * GCS/backup failure → 502. Backup-before-write is enforced by the lib (I3).
 * Auth posture unchanged this module (I7 — tracked risk, BIM-006 territory).
 *
 * @see agent_docs/CURRENT_APP/BIM005/CLAUDE.md
 */

import { NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';

import { KNOWN_AGENTS } from '@/config/manifest';

import { readInstructions, saveWithBackup } from './_lib/gcsInstructions';

interface GcsEnv {
  bucket: string;
  baseFolder: string;
}

function requireEnv(): GcsEnv | NextResponse {
  const bucket = process.env.GCS_BUCKET;
  if (!bucket) {
    return NextResponse.json(
      { error: 'GCS_BUCKET is not configured' },
      { status: 500 },
    );
  }
  const baseFolder = process.env.GCS_BASE_FOLDER;
  if (!baseFolder) {
    return NextResponse.json(
      { error: 'GCS_BASE_FOLDER is not configured' },
      { status: 500 },
    );
  }
  return { bucket, baseFolder };
}

function requireKnownAgent(agentName: unknown): string | NextResponse {
  if (typeof agentName !== 'string' || !KNOWN_AGENTS.includes(agentName)) {
    return NextResponse.json(
      { error: `Unknown agent: ${String(agentName)}` },
      { status: 400 },
    );
  }
  return agentName;
}

export async function GET(req: Request) {
  const agent = requireKnownAgent(new URL(req.url).searchParams.get('agent'));
  if (agent instanceof NextResponse) return agent;
  const env = requireEnv();
  if (env instanceof NextResponse) return env;

  try {
    const instructions = await readInstructions(
      new Storage(), // ADC: local gcloud login in dev, attached SA deployed
      env.bucket,
      env.baseFolder,
      agent,
    );
    return NextResponse.json({ instructions }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as {
      agent_name?: unknown;
      content?: unknown;
    };
    const agent = requireKnownAgent(body.agent_name);
    if (agent instanceof NextResponse) return agent;
    if (typeof body.content !== 'string') {
      return NextResponse.json(
        { error: 'content must be a string' },
        { status: 400 },
      );
    }
    const env = requireEnv();
    if (env instanceof NextResponse) return env;

    const backup = await saveWithBackup(
      new Storage(),
      env.bucket,
      env.baseFolder,
      agent,
      body.content,
    );
    return NextResponse.json({ ok: true, backup }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
