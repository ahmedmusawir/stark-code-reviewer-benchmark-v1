/**
 * @jest-environment jsdom
 */

/**
 * FIX-001 — chatStore persistence (gates F4 + F5).
 * Intent: the agent→session pointer survives reloads via localStorage key
 * `adk-session-map`; message content NEVER reaches localStorage (F4); corrupt
 * or absent stored values degrade to today's behavior; no `window` → no crash.
 */

const STORAGE_KEY = "adk-session-map-mock";

describe("chatStore persistence (FIX-001)", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.resetModules();
  });

  it("round-trip: setSession writes the map under adk-session-map (F5)", () => {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { useChatStore } = require("@/store/chatStore");
      useChatStore.getState().setSession("greeting_agent", "sess-123");

      const raw = localStorage.getItem(STORAGE_KEY);
      expect(raw).not.toBeNull();
      const stored = JSON.parse(raw as string);
      expect(stored.state.agentSessions).toEqual({
        greeting_agent: "sess-123",
      });
    });
  });

  it("partialize: message content never reaches localStorage (F4)", () => {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { useChatStore } = require("@/store/chatStore");
      const state = useChatStore.getState();
      state.appendMessageForAgent("greeting_agent", {
        role: "user",
        content: "SECRET-TRANSCRIPT-CONTENT",
      });
      state.setSession("greeting_agent", "sess-123");

      const raw = localStorage.getItem(STORAGE_KEY) as string;
      expect(raw).not.toBeNull();
      const stored = JSON.parse(raw);
      // FIX-002a: the persisted shape is the bookmark + the selected agent —
      // and NOTHING else. Message content stays out (F4/X4 fence).
      expect(stored.state).toEqual({
        agentSessions: { greeting_agent: "sess-123" },
        selectedAgent: "greeting_agent",
      });
      expect(stored.state.messagesByAgent).toBeUndefined();
      expect(raw).not.toContain("SECRET-TRANSCRIPT-CONTENT");
    });
  });

  it("hydration: a pre-seeded map is restored on store creation (F5)", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: { agentSessions: { jarvis_agent: "sess-restored" } },
        version: 0,
      }),
    );
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { useChatStore } = require("@/store/chatStore");
      expect(useChatStore.getState().agentSessions).toEqual({
        jarvis_agent: "sess-restored",
      });
      // Non-persisted state untouched by hydration
      expect(useChatStore.getState().messagesByAgent).toEqual({});
    });
  });

  it("round-trip: setSelectedAgent persists the selection (FIX-002a / X1)", () => {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { useChatStore } = require("@/store/chatStore");
      useChatStore.getState().setSelectedAgent("jarvis_agent");

      const raw = localStorage.getItem(STORAGE_KEY) as string;
      expect(raw).not.toBeNull();
      const stored = JSON.parse(raw);
      expect(stored.state.selectedAgent).toBe("jarvis_agent");
      // lastSelectedAgent is UI-transient — never persisted
      expect(stored.state.lastSelectedAgent).toBeUndefined();
    });
  });

  it("hydration: a pre-seeded selectedAgent wins over the default (FIX-002a / X1)", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: {
          agentSessions: { jarvis_agent: "sess-restored" },
          selectedAgent: "jarvis_agent",
        },
        version: 0,
      }),
    );
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { useChatStore } = require("@/store/chatStore");
      expect(useChatStore.getState().selectedAgent).toBe("jarvis_agent");
    });
  });

  it("hydration: stored value without selectedAgent keeps the default (back-compat)", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: { agentSessions: { jarvis_agent: "sess-restored" } },
        version: 0,
      }),
    );
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { useChatStore } = require("@/store/chatStore");
      expect(useChatStore.getState().selectedAgent).toBe("greeting_agent");
    });
  });

  it("corrupt stored value degrades to an empty map, no throw (F5)", () => {
    localStorage.setItem(STORAGE_KEY, "{not-valid-json!!");
    jest.isolateModules(() => {
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { useChatStore } = require("@/store/chatStore");
        expect(useChatStore.getState().agentSessions).toEqual({});
      }).not.toThrow();
    });
  });

  it("SSR guard: storage getter throws (server: no window) → store still creates and works in-memory (F5)", () => {
    // jsdom's `window` itself can't be removed; the server condition reaches
    // createJSONStorage as "the storage getter throws" — simulate exactly that.
    const windowSpy = jest
      .spyOn(window, "localStorage", "get")
      .mockImplementation(() => {
        throw new ReferenceError("window is not defined");
      });
    try {
      jest.isolateModules(() => {
        expect(() => {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const { useChatStore } = require("@/store/chatStore");
          useChatStore.getState().setSession("greeting_agent", "sess-ssr");
          expect(useChatStore.getState().agentSessions).toEqual({
            greeting_agent: "sess-ssr",
          });
        }).not.toThrow();
      });
    } finally {
      windowSpy.mockRestore();
    }
  });
});
