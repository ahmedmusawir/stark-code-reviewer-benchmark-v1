jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/utils/get-user-role', () => ({
  AppRole: {
    SUPERADMIN: 'superadmin',
    ADMIN: 'admin',
    MEMBER: 'member',
  },
  getUserRole: jest.fn(),
}));

import { redirect } from 'next/navigation';
import { protectPage } from '@/utils/supabase/actions';
import { createClient } from '@/utils/supabase/server';
import { AppRole, getUserRole } from '@/utils/get-user-role';

const createClientMock = createClient as jest.MockedFunction<typeof createClient>;
const getUserRoleMock = getUserRole as jest.MockedFunction<typeof getUserRole>;
const redirectMock = redirect as unknown as jest.Mock;

describe('protectPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function mockAuthUser(user: any, error: any = null) {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user },
          error,
        }),
      },
    } as any);
  }

  it('allows an admin to access admin-only routes', async () => {
    const user = { id: 'admin-user' };
    mockAuthUser(user);
    getUserRoleMock.mockResolvedValue(AppRole.ADMIN as any);

    await expect(protectPage([AppRole.ADMIN as any])).resolves.toEqual(user);
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('redirects a member trying to access an admin route', async () => {
    const user = { id: 'member-user' };
    mockAuthUser(user);
    getUserRoleMock.mockResolvedValue(AppRole.MEMBER as any);

    await expect(protectPage([AppRole.ADMIN as any])).rejects.toThrow('NEXT_REDIRECT:/auth');
    expect(redirectMock).toHaveBeenCalledWith('/auth');
  });

  it('redirects an unauthenticated user to auth', async () => {
    mockAuthUser(null);

    await expect(protectPage([AppRole.ADMIN as any])).rejects.toThrow('NEXT_REDIRECT:/auth');
    expect(getUserRoleMock).not.toHaveBeenCalled();
    expect(redirectMock).toHaveBeenCalledWith('/auth');
  });

  it('redirects when role lookup returns null', async () => {
    const user = { id: 'orphan-user' };
    mockAuthUser(user);
    getUserRoleMock.mockResolvedValue(null as any);

    await expect(protectPage([AppRole.ADMIN as any])).rejects.toThrow('NEXT_REDIRECT:/auth');
    expect(redirectMock).toHaveBeenCalledWith('/auth');
  });

  it('CRITICAL: explicitly denies member role access to superadmin routes', async () => {
    const user = { id: 'member-user' };
    mockAuthUser(user);
    getUserRoleMock.mockResolvedValue(AppRole.MEMBER as any);

    await expect(protectPage([AppRole.SUPERADMIN as any])).rejects.toThrow('NEXT_REDIRECT:/auth');
    expect(redirectMock).toHaveBeenCalledWith('/auth');
  });

  it('CRITICAL: explicitly denies admin role access to superadmin routes', async () => {
    const user = { id: 'admin-user' };
    mockAuthUser(user);
    getUserRoleMock.mockResolvedValue(AppRole.ADMIN as any);

    await expect(protectPage([AppRole.SUPERADMIN as any])).rejects.toThrow('NEXT_REDIRECT:/auth');
    expect(redirectMock).toHaveBeenCalledWith('/auth');
  });

  it('allows superadmin to access superadmin-only routes', async () => {
    const user = { id: 'superadmin-user' };
    mockAuthUser(user);
    getUserRoleMock.mockResolvedValue(AppRole.SUPERADMIN as any);

    await expect(protectPage([AppRole.SUPERADMIN as any])).resolves.toEqual(user);
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
