jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}));

import { AppRole, getUserRole } from '@/utils/get-user-role';
import { createClient } from '@/utils/supabase/server';

const createClientMock = createClient as jest.MockedFunction<typeof createClient>;

describe('getUserRole', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function mockRoleQuery(result: { data: { role: string } | null; error: any }) {
    const single = jest.fn().mockResolvedValue(result);
    const eq = jest.fn().mockReturnValue({ single });
    const select = jest.fn().mockReturnValue({ eq });
    const from = jest.fn().mockReturnValue({ select });

    createClientMock.mockResolvedValue({ from } as any);

    return { from, select, eq, single };
  }

  it('returns AppRole.SUPERADMIN when database returns superadmin', async () => {
    const query = mockRoleQuery({ data: { role: 'superadmin' }, error: null });

    await expect(getUserRole('user-1')).resolves.toBe(AppRole.SUPERADMIN);
    expect(query.from).toHaveBeenCalledWith('user_roles');
    expect(query.select).toHaveBeenCalledWith('role');
    expect(query.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(query.single).toHaveBeenCalled();
  });

  it('returns AppRole.ADMIN when database returns admin', async () => {
    mockRoleQuery({ data: { role: 'admin' }, error: null });

    await expect(getUserRole('user-2')).resolves.toBe(AppRole.ADMIN);
  });

  it('returns AppRole.MEMBER when database returns member', async () => {
    mockRoleQuery({ data: { role: 'member' }, error: null });

    await expect(getUserRole('user-3')).resolves.toBe(AppRole.MEMBER);
  });

  it('returns null when database query fails', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockRoleQuery({ data: null, error: { message: 'db exploded' } });

    await expect(getUserRole('user-4')).resolves.toBeNull();
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('returns null when no role row exists', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockRoleQuery({ data: null, error: null });

    await expect(getUserRole('user-5')).resolves.toBeNull();
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('returns null when no user id is provided', async () => {
    await expect(getUserRole('')).resolves.toBeNull();
    expect(createClientMock).not.toHaveBeenCalled();
  });
});
