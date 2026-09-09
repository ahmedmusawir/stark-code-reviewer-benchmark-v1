-- =============================================================================
-- BIM-004 (Amendment A4): chat_sessions — the session INDEX
-- =============================================================================
-- Run this entire file ONCE in the Supabase SQL Editor (existing databases;
-- fresh databases run it after setup.sql).
--
-- DOCTRINE: the index is not the transcript. This table stores WHICH sessions
-- exist (owner, agent, ADK session id, title, timestamps, archived) — NEVER
-- message content. Transcripts live in ADK's own store and are fetched through
-- the connector. No content column may ever be added here.
-- =============================================================================

CREATE TABLE public.chat_sessions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  agent_name     text NOT NULL,
  adk_session_id text NOT NULL,
  title          text NOT NULL DEFAULT 'New chat',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  archived       boolean NOT NULL DEFAULT false,
  UNIQUE (user_id, agent_name, adk_session_id)
);

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- Users see and manage ONLY their own session index rows.
CREATE POLICY "Users can read their own chat sessions"
  ON public.chat_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat sessions"
  ON public.chat_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat sessions"
  ON public.chat_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- No DELETE policy in v1 — sessions are archived, not deleted. Retention /
-- purge jobs are a later module; the archived flag + timestamps are their
-- future handle.

-- Serves the session panel's list query (newest-first per user+agent).
CREATE INDEX chat_sessions_list_idx
  ON public.chat_sessions (user_id, agent_name, archived, updated_at DESC);
