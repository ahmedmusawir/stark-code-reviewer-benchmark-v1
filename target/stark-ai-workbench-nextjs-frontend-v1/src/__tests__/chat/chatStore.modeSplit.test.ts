/**
 * @jest-environment jsdom
 */

/**
 * FIX-003 (F09) — mode-namespaced persistence + legacy adoption.
 * Intent (Rule K9): each mode persists to its OWN key, neither mode reads the
 * other's world, LIVE boot adopts the legacy shared key exactly once (mock
 * never adopts), corrupt values still degrade, and the hydration flag is
 * store truth that never reaches localStorage.
 */

const LEGACY_KEY = "adk-session-map";
const LIVE_KEY = "adk-session-map-live";
const MOCK_KEY = "adk-session-map-mock";

const originalMode = process.env.NEXT_PUBLIC_CHAT_MODE;

function bootStore(mode: string | undefined) {
  if (mode === undefined) delete process.env.NEXT_PUBLIC_CHAT_MODE;
  else process.env.NEXT_PUBLIC_CHAT_MODE = mode;
  let store: typeof import("@/store/chatStore") | undefined;
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    store = require("@/store/chatStore");
  });
  return store!;
}

const seed = (key: string, sessions: Record<string, string>, agent: string) =>
  localStorage.setItem(
    key,
    JSON.stringify({
      state: { agentSessions: sessions, selectedAgent: agent },
      version: 0,
    }),
  );

describe("chatStore mode-split persistence (FIX-003 F09)", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.resetModules();
  });

  afterAll(() => {
    if (originalMode === undefined) delete process.env.NEXT_PUBLIC_CHAT_MODE;
    else process.env.NEXT_PUBLIC_CHAT_MODE = originalMode;
  });

  it("live mode persists under the -live key", () => {
    const { useChatStore } = bootStore("live");
    useChatStore.getState().setSession("jarvis_agent", "session-1");
    expect(localStorage.getItem(LIVE_KEY)).not.toBeNull();
    expect(localStorage.getItem(MOCK_KEY)).toBeNull();
  });

  it("mock mode (and unset — the fail-safe) persists under the -mock key", () => {
    const { useChatStore } = bootStore(undefined);
    useChatStore.getState().setSession("jarvis_agent", "session-1");
    expect(localStorage.getItem(MOCK_KEY)).not.toBeNull();
    expect(localStorage.getItem(LIVE_KEY)).toBeNull();
  });

  it("live never reads the mock world (no cross-contamination — H1)", () => {
    seed(MOCK_KEY, { calc_agent: "mock-session-99" }, "calc_agent");

    const { useChatStore } = bootStore("live");

    expect(useChatStore.getState().agentSessions).toEqual({});
    expect(useChatStore.getState().selectedAgent).toBe("greeting_agent");
    // and the mock world is untouched
    expect(
      JSON.parse(localStorage.getItem(MOCK_KEY)!).state.agentSessions,
    ).toEqual({ calc_agent: "mock-session-99" });
  });

  it("LIVE boot adopts the legacy key when no live key exists (H2)", () => {
    seed(LEGACY_KEY, { jarvis_agent: "session-1784364468" }, "jarvis_agent");

    const { useChatStore } = bootStore("live");

    expect(useChatStore.getState().agentSessions).toEqual({
      jarvis_agent: "session-1784364468",
    });
    expect(useChatStore.getState().selectedAgent).toBe("jarvis_agent");
    // legacy left in place, dead
    expect(localStorage.getItem(LEGACY_KEY)).not.toBeNull();
  });

  it("LIVE boot does NOT adopt when a live key already exists", () => {
    seed(LEGACY_KEY, { jarvis_agent: "old-session" }, "jarvis_agent");
    seed(LIVE_KEY, { calc_agent: "live-session" }, "calc_agent");

    const { useChatStore } = bootStore("live");

    expect(useChatStore.getState().agentSessions).toEqual({
      calc_agent: "live-session",
    });
  });

  it("MOCK boot never adopts the legacy key (mock pointers were the poison)", () => {
    seed(LEGACY_KEY, { jarvis_agent: "old-session" }, "jarvis_agent");

    const { useChatStore } = bootStore("mock");

    expect(useChatStore.getState().agentSessions).toEqual({});
    // The mock key may exist (persist writes defaults on the hydration-flag
    // set) but it must NOT contain the legacy pointers.
    const mockRaw = localStorage.getItem(MOCK_KEY);
    if (mockRaw !== null) {
      expect(JSON.parse(mockRaw).state.agentSessions).toEqual({});
    }
  });

  it("corrupt stored value still degrades to defaults, no throw", () => {
    localStorage.setItem(LIVE_KEY, "{corrupt!!");
    expect(() => {
      const { useChatStore } = bootStore("live");
      expect(useChatStore.getState().agentSessions).toEqual({});
    }).not.toThrow();
  });

  it("hydration flag: true after load, never persisted (F06 plumbing)", () => {
    const { useChatStore } = bootStore("mock");
    expect(useChatStore.getState()._hasHydrated).toBe(true);

    useChatStore.getState().setSession("jarvis_agent", "s-1");
    const stored = JSON.parse(localStorage.getItem(MOCK_KEY)!);
    expect(Object.keys(stored.state).sort()).toEqual([
      "agentSessions",
      "selectedAgent",
    ]);
  });

  it("reset() does not re-suppress the UI (flag survives reset)", () => {
    const { useChatStore } = bootStore("mock");
    useChatStore.getState().reset();
    expect(useChatStore.getState()._hasHydrated).toBe(true);
  });
});
