/**
 * Mock message histories — keyed by session_id.
 *
 * One canonical session per agent, seeded with 2-4 messages each covering
 * the edge cases required by `_project/DATA_CONTRACT.md` §3.3:
 *   - Plain text exchange         → greeting_agent session
 *   - Markdown formatting         → jarvis_agent session (bold, italic, lists)
 *   - Code block                  → calc_agent session (Python)
 *   - Markdown table (CRITICAL)   → ghl_mcp_agent session (Phase 5 rendering test)
 *   - Tool-use disclosure pattern → ghl_mcp_agent session
 *   - Long text                   → product_agent session
 *   - Empty session               → handled implicitly by getHistory returning [] for unknown session_id
 */

import type { AgentName, Message } from '@/types';

export const seededSessionByAgent: Record<AgentName, string> = {
  greeting_agent: 'mock-session-greeting-001',
  jarvis_agent: 'mock-session-jarvis-001',
  calc_agent: 'mock-session-calc-001',
  product_agent: 'mock-session-product-001',
  ghl_mcp_agent: 'mock-session-ghl-001',
};

export const mockMessagesBySession: Record<string, Message[]> = {
  [seededSessionByAgent.greeting_agent]: [
    { role: 'user', content: 'Hey there!' },
    {
      role: 'assistant',
      content:
        "Hi there! I'm here to help — anything from quick questions to a deeper conversation about your day. What's on your mind?",
    },
  ],

  [seededSessionByAgent.jarvis_agent]: [
    {
      role: 'user',
      content: 'Look up the latest news on tariffs in trade policy.',
    },
    {
      role: 'assistant',
      content:
        'Of course, sir. Searching for **recent developments** on trade policy tariffs...\n\n- *Quick summary:* Several major economies announced revised tariff schedules in the past quarter.\n- The most consequential changes involve **agricultural** and **semiconductor** categories.\n- Effective dates vary by jurisdiction; most go into effect within 60 days.\n\nWould you like me to pull a deeper analysis, Mr. Stark?',
    },
    { role: 'user', content: 'Yes, focus on semiconductors.' },
    {
      role: 'assistant',
      content:
        'Right away, sir. Compiling the semiconductor-specific tariff changes now...',
    },
  ],

  [seededSessionByAgent.calc_agent]: [
    {
      role: 'user',
      content:
        'What is the compound interest on $5000 at 4.5% over 7 years?',
    },
    {
      role: 'assistant',
      content:
        'Rico here. Let me work that out:\n\n```python\nprincipal = 5000\nrate = 0.045\nyears = 7\nfinal = principal * (1 + rate) ** years\ninterest = final - principal\nprint(f"Final amount: ${final:,.2f}")\nprint(f"Interest earned: ${interest:,.2f}")\n```\n\n**Final amount: $6,801.91**\n**Interest earned: $1,801.91**\n\nNeed me to chart that or run a different scenario?',
    },
  ],

  [seededSessionByAgent.product_agent]: [
    {
      role: 'user',
      content:
        'Tell me about the differences between the Pro and Enterprise plans.',
    },
    {
      role: 'assistant',
      content:
        "Happy to break that down for you. The **Pro** and **Enterprise** plans share the same core product surface — same API access, same SLA targets, same regional availability. Where they diverge is at the operational tier: Enterprise includes a dedicated account manager, a private Slack channel with our support engineering team, custom contract terms (including BAAs for HIPAA-adjacent use cases), and an annual review with our product team. The Pro plan is self-service across all of those. If your use case involves regulated data, custom contract language, or you expect to need direct engineering support more than once a quarter, Enterprise is the lower-friction option. If you're confident in self-service and want the lower price point, Pro covers the same technical capability.",
    },
  ],

  [seededSessionByAgent.ghl_mcp_agent]: [
    { role: 'user', content: 'Show me contacts in the marketing tag.' },
    {
      role: 'assistant',
      content:
        "Tool I'm using: `contacts_get_contacts`   Reason: To retrieve all contacts tagged with 'marketing' from the GHL CRM.\n\n| Name | Email | Phone | Last Activity |\n|------|-------|-------|---------------|\n| Alex Mercer | alex.mercer@example.com | +1-555-0101 | 2026-05-20 |\n| Jordan Lee | jordan.lee@example.com | +1-555-0102 | 2026-05-18 |\n| Priya Patel | priya.patel@example.com | +1-555-0103 | 2026-05-15 |\n| Marcus Chen | marcus.chen@example.com | +1-555-0104 | 2026-05-10 |\n\nFour contacts matching. Want me to filter further by activity date or pull a specific contact's full record?",
    },
  ],
};
