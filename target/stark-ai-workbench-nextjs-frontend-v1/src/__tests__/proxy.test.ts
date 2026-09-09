jest.mock('@/utils/supabase/middleware', () => ({
  updateSession: jest.fn(),
}));

import { proxy, config } from '@/proxy';
import { updateSession } from '@/utils/supabase/middleware';

const updateSessionMock = updateSession as jest.MockedFunction<typeof updateSession>;

describe('proxy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates standard routes to updateSession', async () => {
    const expectedResponse = { ok: true } as any;
    updateSessionMock.mockResolvedValue(expectedResponse);
    const request = { nextUrl: { pathname: '/admin-portal' } } as any;

    await expect(proxy(request)).resolves.toBe(expectedResponse);
    expect(updateSessionMock).toHaveBeenCalledWith(request);
  });

  it('uses a matcher that excludes static assets and images', () => {
    const matcher = config.matcher[0];

    expect(matcher).toContain('_next/static');
    expect(matcher).toContain('_next/image');
    expect(matcher).toContain('favicon.ico');
    expect(matcher).toContain('svg|png|jpg|jpeg|gif|webp');
    expect(matcher.startsWith('/((?!')).toBe(true);
  });
});
