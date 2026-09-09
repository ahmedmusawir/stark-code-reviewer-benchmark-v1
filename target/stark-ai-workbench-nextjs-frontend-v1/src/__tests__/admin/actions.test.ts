jest.mock('@/utils/supabase/admin', () => ({
  createAdminClient: jest.fn(),
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

import { addMember, editUser } from '@/app/(admin)/admin-portal/actions';
import { createAdminClient } from '@/utils/supabase/admin';
import { revalidatePath } from 'next/cache';

const createAdminClientMock = createAdminClient as jest.MockedFunction<typeof createAdminClient>;
const revalidatePathMock = revalidatePath as jest.MockedFunction<typeof revalidatePath>;

describe('Admin Portal Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addMember', () => {
    it('creates a user with role "member" in user_metadata', async () => {
      const mockCreateUser = jest.fn().mockResolvedValue({
        data: { user: { id: 'new-member-id' } },
        error: null,
      });

      createAdminClientMock.mockReturnValue({
        auth: { admin: { createUser: mockCreateUser } },
      } as any);

      await addMember({
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'password123',
      });

      expect(mockCreateUser).toHaveBeenCalledWith({
        email: 'jane@example.com',
        password: 'password123',
        email_confirm: true,
        user_metadata: {
          full_name: 'Jane Smith',
          role: 'member',
        },
      });
    });

    it('CRITICAL: capitalizes name before saving (title case)', async () => {
      const mockCreateUser = jest.fn().mockResolvedValue({
        data: { user: { id: 'new-member-id' } },
        error: null,
      });

      createAdminClientMock.mockReturnValue({
        auth: { admin: { createUser: mockCreateUser } },
      } as any);

      await addMember({
        name: 'john doe',
        email: 'john@example.com',
        password: 'password123',
      });

      const callArgs = mockCreateUser.mock.calls[0][0];
      expect(callArgs.user_metadata.full_name).toBe('John Doe');
    });

    it('CRITICAL: capitalizes all-caps input correctly', async () => {
      const mockCreateUser = jest.fn().mockResolvedValue({
        data: { user: { id: 'new-member-id' } },
        error: null,
      });

      createAdminClientMock.mockReturnValue({
        auth: { admin: { createUser: mockCreateUser } },
      } as any);

      await addMember({
        name: 'TONY STARK',
        email: 'tony@stark.com',
        password: 'password123',
      });

      const callArgs = mockCreateUser.mock.calls[0][0];
      expect(callArgs.user_metadata.full_name).toBe('Tony Stark');
    });

    it('revalidates the admin-portal path on success', async () => {
      const mockCreateUser = jest.fn().mockResolvedValue({
        data: { user: { id: 'new-member-id' } },
        error: null,
      });

      createAdminClientMock.mockReturnValue({
        auth: { admin: { createUser: mockCreateUser } },
      } as any);

      await addMember({
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'password123',
      });

      expect(revalidatePathMock).toHaveBeenCalledWith('/admin-portal');
    });

    it('returns a friendly error for duplicate email', async () => {
      const mockCreateUser = jest.fn().mockResolvedValue({
        data: { user: null },
        error: { message: 'User with this email has already been registered' },
      });

      createAdminClientMock.mockReturnValue({
        auth: { admin: { createUser: mockCreateUser } },
      } as any);

      const result = await addMember({
        name: 'Jane Smith',
        email: 'duplicate@example.com',
        password: 'password123',
      });

      expect(result.error).toBe('A user with the email "duplicate@example.com" already exists.');
    });

    it('returns error message on general failure', async () => {
      const mockCreateUser = jest.fn().mockResolvedValue({
        data: { user: null },
        error: { message: 'Service unavailable' },
      });

      createAdminClientMock.mockReturnValue({
        auth: { admin: { createUser: mockCreateUser } },
      } as any);

      const result = await addMember({
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('error', 'Service unavailable');
    });
  });

  describe('editUser', () => {
    it('CRITICAL: capitalizes name before saving', async () => {
      const mockUpdateUserById = jest.fn().mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const mockEq = jest.fn().mockResolvedValue({ data: {}, error: null });

      createAdminClientMock.mockReturnValue({
        auth: { admin: { updateUserById: mockUpdateUserById } },
        from: jest.fn().mockReturnValue({
          update: jest.fn().mockReturnValue({ eq: mockEq }),
        }),
      } as any);

      await editUser('user-123', { name: 'peter parker' });

      expect(mockUpdateUserById).toHaveBeenCalledWith('user-123', {
        user_metadata: { full_name: 'Peter Parker' },
      });
    });

    it('updates the profiles table with capitalized name', async () => {
      const mockUpdateUserById = jest.fn().mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const mockEq = jest.fn().mockResolvedValue({ data: {}, error: null });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });

      createAdminClientMock.mockReturnValue({
        auth: { admin: { updateUserById: mockUpdateUserById } },
        from: jest.fn().mockReturnValue({ update: mockUpdate }),
      } as any);

      await editUser('user-123', { name: 'peter parker' });

      expect(mockUpdate).toHaveBeenCalledWith({ full_name: 'Peter Parker' });
    });

    it('revalidates the admin-portal path on success', async () => {
      const mockUpdateUserById = jest.fn().mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const mockEq = jest.fn().mockResolvedValue({ data: {}, error: null });

      createAdminClientMock.mockReturnValue({
        auth: { admin: { updateUserById: mockUpdateUserById } },
        from: jest.fn().mockReturnValue({
          update: jest.fn().mockReturnValue({ eq: mockEq }),
        }),
      } as any);

      await editUser('user-123', { name: 'Test User' });

      expect(revalidatePathMock).toHaveBeenCalledWith('/admin-portal');
    });

    it('returns error if auth update fails', async () => {
      const mockUpdateUserById = jest.fn().mockResolvedValue({
        data: { user: null },
        error: { message: 'User not found' },
      });

      createAdminClientMock.mockReturnValue({
        auth: { admin: { updateUserById: mockUpdateUserById } },
        from: jest.fn(),
      } as any);

      const result = await editUser('bad-id', { name: 'Someone' });

      expect(result).toHaveProperty('error', 'User not found');
    });
  });
});
