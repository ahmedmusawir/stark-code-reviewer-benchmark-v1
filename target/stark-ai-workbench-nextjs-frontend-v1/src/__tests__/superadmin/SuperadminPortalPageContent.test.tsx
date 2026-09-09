/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SuperadminPortalPageContent from '@/app/(superadmin)/superadmin-portal/SuperadminPortalPageContent';
import { getUsers } from '@/app/(superadmin)/superadmin-portal/actions';

// Mock the server action
jest.mock('@/app/(superadmin)/superadmin-portal/actions', () => ({
  getUsers: jest.fn(),
}));

const getUsersMock = getUsers as jest.MockedFunction<typeof getUsers>;

describe('SuperadminPortalPageContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('CRITICAL: enforces pagination limit and only renders 6 user cards on first page', async () => {
    // Mock 8 users total
    const mockUsers = Array.from({ length: 8 }, (_, i) => ({
      id: `user-${i + 1}`,
      full_name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      role: i % 2 === 0 ? 'admin' : 'member',
      created_at: '2024-01-01',
    }));

    // getUsers should return only 6 users for page 1 (pagination enforced server-side)
    getUsersMock.mockResolvedValue({
      users: mockUsers.slice(0, 6),
      total: 8,
    });

    const Component = await SuperadminPortalPageContent({ page: 1 });
    render(Component);

    // Should render exactly 6 user cards
    const userCards = screen.getAllByText(/User \d+/);
    expect(userCards).toHaveLength(6);

    // Verify pagination info shows total count
    expect(screen.getByText(/8 total/i)).toBeInTheDocument();
  });

  it('renders Edit and Delete buttons for each user', async () => {
    const mockUsers = [
      {
        id: 'user-1',
        full_name: 'Test User',
        email: 'test@example.com',
        role: 'admin',
        created_at: '2024-01-01',
      },
      {
        id: 'user-2',
        full_name: 'Another User',
        email: 'another@example.com',
        role: 'member',
        created_at: '2024-01-02',
      },
    ];

    getUsersMock.mockResolvedValue({
      users: mockUsers,
      total: 2,
    });

    const Component = await SuperadminPortalPageContent({ page: 1 });
    render(Component);

    // Should have 2 Edit buttons (one per user)
    const editButtons = screen.getAllByRole('link', { name: /edit/i });
    expect(editButtons).toHaveLength(2);

    // Should have 2 Delete buttons (one per user)
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    expect(deleteButtons).toHaveLength(2);
  });

  it('renders all users returned by getUsers (superadmin filtering handled at DB layer)', async () => {
    // getUsers now excludes superadmins at query level — the component renders whatever it receives
    const mockUsers = [
      {
        id: 'user-1',
        full_name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        created_at: '2024-01-01',
      },
      {
        id: 'user-2',
        full_name: 'Member User',
        email: 'member@example.com',
        role: 'member',
        created_at: '2024-01-02',
      },
    ];

    getUsersMock.mockResolvedValue({
      users: mockUsers,
      total: 2,
    });

    const Component = await SuperadminPortalPageContent({ page: 1 });
    render(Component);

    expect(screen.getByText('Admin User')).toBeInTheDocument();
    expect(screen.getByText('Member User')).toBeInTheDocument();
  });

  it('displays role labels with correct color coding', async () => {
    const mockUsers = [
      {
        id: 'user-1',
        full_name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        created_at: '2024-01-01',
      },
      {
        id: 'user-2',
        full_name: 'Member User',
        email: 'member@example.com',
        role: 'member',
        created_at: '2024-01-02',
      },
    ];

    getUsersMock.mockResolvedValue({
      users: mockUsers,
      total: 2,
    });

    const Component = await SuperadminPortalPageContent({ page: 1 });
    const { container } = render(Component);

    // Check for role labels
    expect(screen.getByText(/Role: Admin/i)).toBeInTheDocument();
    expect(screen.getByText(/Role: Member/i)).toBeInTheDocument();

    // Verify color classes are applied (red for admin, green for member)
    const adminRoleElement = screen.getByText(/Role: Admin/i);
    const memberRoleElement = screen.getByText(/Role: Member/i);

    expect(adminRoleElement).toHaveClass('text-red-600');
    expect(memberRoleElement).toHaveClass('text-green-600');
  });

  it('displays pagination controls when there are multiple pages', async () => {
    const mockUsers = Array.from({ length: 6 }, (_, i) => ({
      id: `user-${i + 1}`,
      full_name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      role: 'member',
      created_at: '2024-01-01',
    }));

    // Total 12 users = 2 pages
    getUsersMock.mockResolvedValue({
      users: mockUsers,
      total: 12,
    });

    const Component = await SuperadminPortalPageContent({ page: 1 });
    render(Component);

    // Should show page indicator
    expect(screen.getByText(/Page 1 of 2/i)).toBeInTheDocument();

    // Should show Next button (not Previous on page 1)
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /previous/i })).not.toBeInTheDocument();
  });

  it('shows "Add User" button in the header', async () => {
    getUsersMock.mockResolvedValue({
      users: [],
      total: 0,
    });

    const Component = await SuperadminPortalPageContent({ page: 1 });
    render(Component);

    expect(screen.getByRole('link', { name: /add user/i })).toBeInTheDocument();
  });

  it('displays empty state when no users exist', async () => {
    getUsersMock.mockResolvedValue({
      users: [],
      total: 0,
    });

    const Component = await SuperadminPortalPageContent({ page: 1 });
    render(Component);

    expect(screen.getByText(/no users found/i)).toBeInTheDocument();
  });
});
