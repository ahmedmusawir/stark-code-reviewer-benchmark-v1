jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/utils/supabase/admin', () => ({
  createAdminClient: jest.fn(),
}));

jest.mock('@/utils/get-user-role', () => ({
  getUserRole: jest.fn(),
}));

import { POST } from '@/app/api/auth/superadmin-add-user/route';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getUserRole } from '@/utils/get-user-role';

const createClientMock = createClient as jest.MockedFunction<typeof createClient>;
const createAdminClientMock = createAdminClient as jest.MockedFunction<typeof createAdminClient>;
const getUserRoleMock = getUserRole as jest.MockedFunction<typeof getUserRole>;

describe('POST /api/auth/superadmin-add-user', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeRequest(body: Record<string, unknown>) {
    return {
      json: jest.fn().mockResolvedValue(body),
    } as any;
  }

  function mockAuthenticatedCaller(user: any, authError: any = null) {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user },
          error: authError,
        }),
      },
    } as any);
  }

  it('allows a superadmin to create an admin and update role', async () => {
    mockAuthenticatedCaller({ id: 'super-1' });
    getUserRoleMock.mockResolvedValue('superadmin' as any);

    const createUser = jest.fn().mockResolvedValue({
      data: { user: { id: 'new-admin-id' } },
      error: null,
    });
    const eq = jest.fn().mockResolvedValue({ error: null });
    const update = jest.fn().mockReturnValue({ eq });
    const from = jest.fn().mockReturnValue({ update });

    createAdminClientMock.mockReturnValue({
      auth: { admin: { createUser } },
      from,
    } as any);

    const response = await POST(
      makeRequest({ email: 'admin@example.com', password: 'secret123', role: 'admin' })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.user.id).toBe('new-admin-id');
    expect(createAdminClientMock).toHaveBeenCalledTimes(1);
    expect(createUser).toHaveBeenCalledWith({
      email: 'admin@example.com',
      password: 'secret123',
      email_confirm: true,
    });
    expect(from).toHaveBeenCalledWith('user_roles');
    expect(update).toHaveBeenCalledWith({ role: 'admin' });
    expect(eq).toHaveBeenCalledWith('user_id', 'new-admin-id');
  });

  it('returns 403 and never calls admin client when caller is a member', async () => {
    mockAuthenticatedCaller({ id: 'member-1' });
    getUserRoleMock.mockResolvedValue('member' as any);

    const response = await POST(
      makeRequest({ email: 'admin@example.com', password: 'secret123', role: 'admin' })
    );
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error).toMatch(/Only superadmins/);
    expect(createAdminClientMock).not.toHaveBeenCalled();
  });

  it('returns 403 and never calls admin client when caller is an admin', async () => {
    mockAuthenticatedCaller({ id: 'admin-1' });
    getUserRoleMock.mockResolvedValue('admin' as any);

    const response = await POST(
      makeRequest({ email: 'admin2@example.com', password: 'secret123', role: 'admin' })
    );

    expect(response.status).toBe(403);
    expect(createAdminClientMock).not.toHaveBeenCalled();
  });

  it('returns 401 when unauthenticated and never calls admin client', async () => {
    mockAuthenticatedCaller(null, { message: 'no session' });

    const response = await POST(
      makeRequest({ email: 'admin@example.com', password: 'secret123', role: 'admin' })
    );
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error).toBe('Unauthorized');
    expect(getUserRoleMock).not.toHaveBeenCalled();
    expect(createAdminClientMock).not.toHaveBeenCalled();
  });

  it('returns 400 when required fields are missing', async () => {
    mockAuthenticatedCaller({ id: 'super-1' });
    getUserRoleMock.mockResolvedValue('superadmin' as any);

    const response = await POST(makeRequest({ email: 'admin@example.com' }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toMatch(/Missing required fields/);
    expect(createAdminClientMock).not.toHaveBeenCalled();
  });
});
