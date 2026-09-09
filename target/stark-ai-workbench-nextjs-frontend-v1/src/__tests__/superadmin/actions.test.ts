jest.mock('@/utils/supabase/admin', () => ({
  createAdminClient: jest.fn(),
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

import { addUser, editUser, deleteUser, getUsers, getUserById } from '@/app/(superadmin)/superadmin-portal/actions';
import { createAdminClient } from '@/utils/supabase/admin';
import { revalidatePath } from 'next/cache';

const createAdminClientMock = createAdminClient as jest.MockedFunction<typeof createAdminClient>;
const revalidatePathMock = revalidatePath as jest.MockedFunction<typeof revalidatePath>;

describe('Superadmin Portal Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addUser', () => {
    it('CRITICAL: calls createUser with full_name and role in user_metadata', async () => {
      const mockCreateUser = jest.fn().mockResolvedValue({
        data: { user: { id: 'new-user-id' } },
        error: null,
      });

      createAdminClientMock.mockReturnValue({
        auth: {
          admin: {
            createUser: mockCreateUser,
          },
        },
      } as any);

      const formData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'admin',
      };

      await addUser(formData);

      expect(mockCreateUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        email_confirm: true,
        user_metadata: {
          full_name: 'Test User',
          role: 'admin',
        },
      });
    });

    it('CRITICAL: packs BOTH full_name and role into user_metadata payload', async () => {
      const mockCreateUser = jest.fn().mockResolvedValue({
        data: { user: { id: 'new-user-id' } },
        error: null,
      });

      createAdminClientMock.mockReturnValue({
        auth: {
          admin: {
            createUser: mockCreateUser,
          },
        },
      } as any);

      await addUser({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'securepass',
        role: 'member',
      });

      const callArgs = mockCreateUser.mock.calls[0][0];
      expect(callArgs.user_metadata).toHaveProperty('full_name', 'John Doe');
      expect(callArgs.user_metadata).toHaveProperty('role', 'member');
    });

    it('revalidates the superadmin-portal path on success', async () => {
      const mockCreateUser = jest.fn().mockResolvedValue({
        data: { user: { id: 'new-user-id' } },
        error: null,
      });

      createAdminClientMock.mockReturnValue({
        auth: {
          admin: {
            createUser: mockCreateUser,
          },
        },
      } as any);

      await addUser({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'admin',
      });

      expect(revalidatePathMock).toHaveBeenCalledWith('/superadmin-portal');
    });

    it('returns error message when createUser fails', async () => {
      const mockCreateUser = jest.fn().mockResolvedValue({
        data: { user: null },
        error: { message: 'User already exists' },
      });

      createAdminClientMock.mockReturnValue({
        auth: {
          admin: {
            createUser: mockCreateUser,
          },
        },
      } as any);

      const result = await addUser({
        name: 'Test User',
        email: 'existing@example.com',
        password: 'password123',
        role: 'admin',
      });

      expect(result).toHaveProperty('error');
      expect(result.error).toContain('already exists');
    });

    it('returns friendly error for duplicate user', async () => {
      const mockCreateUser = jest.fn().mockResolvedValue({
        data: { user: null },
        error: { message: 'User with this email has already been registered' },
      });

      createAdminClientMock.mockReturnValue({
        auth: {
          admin: {
            createUser: mockCreateUser,
          },
        },
      } as any);

      const result = await addUser({
        name: 'Test User',
        email: 'duplicate@example.com',
        password: 'password123',
        role: 'admin',
      });

      expect(result.error).toBe('A user with the email "duplicate@example.com" already exists.');
    });
  });

  describe('editUser', () => {
    it('updates user metadata and profiles table', async () => {
      const mockUpdateUserById = jest.fn().mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const mockProfileUpdate = jest.fn().mockResolvedValue({
        data: {},
        error: null,
      });

      const mockRoleUpdate = jest.fn().mockResolvedValue({
        data: {},
        error: null,
      });

      const mockProfileEq = jest.fn().mockResolvedValue({
        data: {},
        error: null,
      });

      const mockRoleEq = jest.fn().mockResolvedValue({
        data: {},
        error: null,
      });

      createAdminClientMock.mockReturnValue({
        auth: {
          admin: {
            updateUserById: mockUpdateUserById,
          },
        },
        from: jest.fn((table) => {
          if (table === 'profiles') {
            return {
              update: jest.fn().mockReturnValue({
                eq: mockProfileEq,
              }),
            };
          }
          if (table === 'user_roles') {
            return {
              update: jest.fn().mockReturnValue({
                eq: mockRoleEq,
              }),
            };
          }
        }),
      } as any);

      await editUser('user-123', {
        name: 'Updated Name',
        role: 'admin',
      });

      expect(mockUpdateUserById).toHaveBeenCalledWith('user-123', {
        user_metadata: {
          full_name: 'Updated Name',
        },
      });
    });

    it('revalidates the superadmin-portal path on success', async () => {
      const mockUpdateUserById = jest.fn().mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const mockUpdate = jest.fn().mockResolvedValue({
        data: {},
        error: null,
      });

      const mockEq = jest.fn().mockResolvedValue({
        data: {},
        error: null,
      });

      createAdminClientMock.mockReturnValue({
        auth: {
          admin: {
            updateUserById: mockUpdateUserById,
          },
        },
        from: jest.fn().mockReturnValue({
          update: jest.fn().mockReturnValue({
            eq: mockEq,
          }),
        }),
      } as any);

      await editUser('user-123', {
        name: 'Updated Name',
        role: 'member',
      });

      expect(revalidatePathMock).toHaveBeenCalledWith('/superadmin-portal');
    });
  });

  describe('deleteUser', () => {
    it('successfully calls supabase.auth.admin.deleteUser', async () => {
      const mockDeleteUser = jest.fn().mockResolvedValue({
        data: {},
        error: null,
      });

      createAdminClientMock.mockReturnValue({
        auth: {
          admin: {
            deleteUser: mockDeleteUser,
          },
        },
      } as any);

      await deleteUser('user-to-delete');

      expect(mockDeleteUser).toHaveBeenCalledWith('user-to-delete');
    });

    it('revalidates the superadmin-portal path on success', async () => {
      const mockDeleteUser = jest.fn().mockResolvedValue({
        data: {},
        error: null,
      });

      createAdminClientMock.mockReturnValue({
        auth: {
          admin: {
            deleteUser: mockDeleteUser,
          },
        },
      } as any);

      await deleteUser('user-to-delete');

      expect(revalidatePathMock).toHaveBeenCalledWith('/superadmin-portal');
    });

    it('returns error message when deleteUser fails', async () => {
      const mockDeleteUser = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'User not found' },
      });

      createAdminClientMock.mockReturnValue({
        auth: {
          admin: {
            deleteUser: mockDeleteUser,
          },
        },
      } as any);

      const result = await deleteUser('nonexistent-user');

      expect(result).toHaveProperty('error', 'User not found');
    });
  });

  describe('getUsers', () => {
    it('fetches paginated non-superadmin users with roles', async () => {
      // getUsers now has 3 queries:
      // 1. user_roles.neq("role","superadmin")  → allowed IDs
      // 2. profiles.in("id", allowedIds).order().range() → page profiles + count
      // 3. user_roles.in("user_id", ids) → roles for this page
      const mockAllowedIds = [{ user_id: 'user-1' }, { user_id: 'user-2' }];
      const mockProfiles = [
        { id: 'user-1', full_name: 'User One', email: 'one@example.com', created_at: '2024-01-01' },
        { id: 'user-2', full_name: 'User Two', email: 'two@example.com', created_at: '2024-01-02' },
      ];
      const mockRoles = [
        { user_id: 'user-1', role: 'admin' },
        { user_id: 'user-2', role: 'member' },
      ];

      let userRolesCallCount = 0;

      createAdminClientMock.mockReturnValue({
        from: jest.fn((table) => {
          if (table === 'profiles') {
            return {
              select: jest.fn().mockReturnValue({
                in: jest.fn().mockReturnValue({
                  order: jest.fn().mockReturnValue({
                    range: jest.fn().mockResolvedValue({
                      data: mockProfiles,
                      error: null,
                      count: 2,
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === 'user_roles') {
            userRolesCallCount++;
            if (userRolesCallCount === 1) {
              // First call: filter non-superadmin IDs
              return {
                select: jest.fn().mockReturnValue({
                  neq: jest.fn().mockResolvedValue({ data: mockAllowedIds, error: null }),
                }),
              };
            } else {
              // Second call: fetch roles for page profiles
              return {
                select: jest.fn().mockReturnValue({
                  in: jest.fn().mockResolvedValue({ data: mockRoles, error: null }),
                }),
              };
            }
          }
        }),
      } as any);

      const result = await getUsers(1);

      expect(result.users).toHaveLength(2);
      expect(result.users[0]).toMatchObject({ id: 'user-1', full_name: 'User One', role: 'admin' });
      expect(result.total).toBe(2);
    });
  });

  describe('getUserById', () => {
    it('fetches a single user with role', async () => {
      const mockProfile = {
        id: 'user-123',
        full_name: 'Test User',
        email: 'test@example.com',
        created_at: '2024-01-01',
      };

      const mockRole = { role: 'admin' };

      const mockProfileSingle = jest.fn().mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      const mockRoleSingle = jest.fn().mockResolvedValue({
        data: mockRole,
        error: null,
      });

      createAdminClientMock.mockReturnValue({
        from: jest.fn((table) => {
          if (table === 'profiles') {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: mockProfileSingle,
                }),
              }),
            };
          }
          if (table === 'user_roles') {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: mockRoleSingle,
                }),
              }),
            };
          }
        }),
      } as any);

      const result = await getUserById('user-123');

      expect(result).toMatchObject({
        id: 'user-123',
        full_name: 'Test User',
        email: 'test@example.com',
        role: 'admin',
      });
    });
  });
});
