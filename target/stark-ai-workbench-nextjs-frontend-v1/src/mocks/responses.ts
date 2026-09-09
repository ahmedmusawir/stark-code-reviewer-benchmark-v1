/**
 * Mock response generator for `chatService.sendMessage`.
 *
 * Deterministic: same (agentName, userMessage) → same response text.
 * The session_id is fresh on first call (input.session_id === null) using
 * Date.now() — session IDs are conventionally fresh per session.
 *
 * Phase 5.5 update: per-agent content showcases — each agent demonstrates a
 * different formatted output to exercise the chat UI's rendering features:
 *   - greeting_agent → copyable prompt-style code block (text language)
 *   - jarvis_agent   → typescript code block with copy icon
 *   - calc_agent     → Python code block (existing showcase)
 *   - product_agent  → table + numbered list with bold highlights
 *   - ghl_mcp_agent  → markdown table (existing canonical case)
 *
 * @see _project/DATA_CONTRACT.md §3.4
 */

import type { AgentName, RunAgentResponse } from "@/types";

export function generateMockResponse(
  agentName: AgentName,
  userMessage: string,
  sessionId: string | null,
): RunAgentResponse {
  const session_id = sessionId ?? `mock-session-${Date.now()}`;
  const response = composeAgentVoiceResponse(agentName, userMessage);
  return { response, session_id };
}

function composeAgentVoiceResponse(
  agentName: AgentName,
  userMessage: string,
): string {
  const trimmed = userMessage.trim();
  const echo = trimmed.length > 0 ? trimmed : "(empty message)";

  switch (agentName) {
    case "greeting_agent":
      return [
        `Hey, got it — you said "${echo}".`,
        ``,
        `Here's a prompt you can copy and paste anywhere:`,
        ``,
        "```text",
        `Help me with the following: ${echo}`,
        ``,
        `Be concise. Use plain language. Surface trade-offs honestly.`,
        "```",
        ``,
        `Anything else I can help with?`,
      ].join("\n");

    case "jarvis_agent":
      return [
        `Of course, sir. Regarding "${echo}" — here's a sketch you can run with:`,
        ``,
        "```typescript",
        `// Stub for: ${echo}`,
        `export function executeStarkRequest(input: string): string {`,
        `  const normalized = input.trim().toLowerCase();`,
        `  return \`Processed: \${normalized}\`;`,
        `}`,
        "```",
        ``,
        `Shall I extend with a test harness, Mr. Stark?`,
      ].join("\n");

    case "calc_agent":
      return [
        `Rico here. Let me work on "${echo}":`,
        ``,
        "```python",
        `# Computing based on your input`,
        `import math`,
        ``,
        `def compute(value: str) -> float:`,
        `    # Mock calculation — replace with real logic`,
        `    return math.pi * len(value)`,
        ``,
        `result = compute(${JSON.stringify(echo)})`,
        `print(f"Result: {result:.4f}")`,
        "```",
        ``,
        `**Result: ~42.0** (mock)`,
        ``,
        `Need me to refine or run another scenario?`,
      ].join("\n");

    case "product_agent":
      return [
        `Good question on "${echo}". Here's the breakdown by tier:`,
        ``,
        `| Feature | Starter | Pro | Enterprise |`,
        `|---------|---------|-----|------------|`,
        `| API access | ✅ | ✅ | ✅ |`,
        `| Priority email | ❌ | ✅ | ✅ |`,
        `| Dedicated support | ❌ | ❌ | ✅ |`,
        `| Custom SLA | ❌ | ❌ | ✅ |`,
        `| BAA available | ❌ | ❌ | ✅ |`,
        ``,
        `Quick rundown:`,
        ``,
        `1. **Starter** — DIY, community support, lowest price`,
        `2. **Pro** — Same product surface, priority email response`,
        `3. **Enterprise** — Dedicated team, custom contracts, regulated-data ready`,
        ``,
        `Which tier are you sizing for?`,
      ].join("\n");

    case "ghl_mcp_agent":
      return [
        `Tool I'm using: \`contacts_get_contacts\`   Reason: To address "${echo}" via the CRM.`,
        ``,
        `| Name | Email | Phone | Last Activity |`,
        `|------|-------|-------|---------------|`,
        `| Alex Mercer | alex@example.com | +1-555-0101 | 2026-05-22 |`,
        `| Jordan Lee | jordan@example.com | +1-555-0102 | 2026-05-20 |`,
        `| Priya Patel | priya@example.com | +1-555-0103 | 2026-05-18 |`,
        ``,
        `Let me know if you want to filter further or pull a specific contact's full record.`,
      ].join("\n");

    // BIM-003: agents come from the manifest now, so names beyond the five
    // showcase cases above are legitimate — give them a generic voice
    // (required for the four-line manifest test to work in mock mode).
    default:
      return [
        `[${agentName}] Mock mode — I received: "${echo}".`,
        ``,
        `This agent has no showcase script yet; live mode routes it to its`,
        `manifest bundle as usual.`,
      ].join("\n");
  }
}
