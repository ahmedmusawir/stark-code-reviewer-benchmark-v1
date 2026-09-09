/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProfileForm from '@/app/(members)/members-portal/profile/ProfileForm';

// Mock Supabase client
const mockUpdateUser = jest.fn();
jest.mock('@/utils/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      updateUser: mockUpdateUser,
    },
  })),
}));

const mockToast = jest.fn();
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

const mockUser = {
  id: 'member-user-id',
  email: 'member@example.com',
  user_metadata: { full_name: 'John Member', role: 'member' },
} as any;

describe('Member ProfileForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders member name, email, and role', () => {
    render(<ProfileForm user={mockUser} />);

    expect(screen.getByText('John Member')).toBeInTheDocument();
    expect(screen.getAllByDisplayValue('member@example.com').length).toBeGreaterThan(0);
    expect(screen.getByText('Member')).toBeInTheDocument();
  });

  it('renders initials avatar from full name', () => {
    render(<ProfileForm user={mockUser} />);

    // "John Member" → "JM"
    expect(screen.getByText('JM')).toBeInTheDocument();
  });

  it('renders password update form fields', () => {
    render(<ProfileForm user={mockUser} />);

    expect(screen.getByPlaceholderText(/minimum 8 characters/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/re-enter new password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update password/i })).toBeInTheDocument();
  });

  it('shows inline error when passwords do not match', async () => {
    render(<ProfileForm user={mockUser} />);

    fireEvent.change(screen.getByPlaceholderText(/minimum 8 characters/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByPlaceholderText(/re-enter new password/i), {
      target: { value: 'different123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('shows inline error when password is shorter than 8 characters', async () => {
    render(<ProfileForm user={mockUser} />);

    fireEvent.change(screen.getByPlaceholderText(/minimum 8 characters/i), {
      target: { value: 'short' },
    });
    fireEvent.change(screen.getByPlaceholderText(/re-enter new password/i), {
      target: { value: 'short' },
    });

    fireEvent.click(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });

    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('calls supabase.auth.updateUser on valid password submission', async () => {
    mockUpdateUser.mockResolvedValue({ error: null });

    render(<ProfileForm user={mockUser} />);

    fireEvent.change(screen.getByPlaceholderText(/minimum 8 characters/i), {
      target: { value: 'newpassword123' },
    });
    fireEvent.change(screen.getByPlaceholderText(/re-enter new password/i), {
      target: { value: 'newpassword123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'newpassword123' });
    });
  });

  it('shows success toast and clears fields after successful password update', async () => {
    mockUpdateUser.mockResolvedValue({ error: null });

    render(<ProfileForm user={mockUser} />);

    const newPasswordInput = screen.getByPlaceholderText(/minimum 8 characters/i);
    const confirmPasswordInput = screen.getByPlaceholderText(/re-enter new password/i);

    fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } });

    fireEvent.click(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Password updated successfully' })
      );
    });

    expect((newPasswordInput as HTMLInputElement).value).toBe('');
    expect((confirmPasswordInput as HTMLInputElement).value).toBe('');
  });

  it('shows error toast when supabase returns an error', async () => {
    mockUpdateUser.mockResolvedValue({ error: { message: 'New password should be different from the old password' } });

    render(<ProfileForm user={mockUser} />);

    fireEvent.change(screen.getByPlaceholderText(/minimum 8 characters/i), {
      target: { value: 'samepassword' },
    });
    fireEvent.change(screen.getByPlaceholderText(/re-enter new password/i), {
      target: { value: 'samepassword' },
    });

    fireEvent.click(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Error updating password', variant: 'destructive' })
      );
    });
  });

  it('disables the button while loading', async () => {
    mockUpdateUser.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
    );

    render(<ProfileForm user={mockUser} />);

    fireEvent.change(screen.getByPlaceholderText(/minimum 8 characters/i), {
      target: { value: 'newpassword123' },
    });
    fireEvent.change(screen.getByPlaceholderText(/re-enter new password/i), {
      target: { value: 'newpassword123' },
    });

    // Store reference before clicking — text changes to "Updating..." when loading
    const submitButton = screen.getByRole('button', { name: /update password/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });

  it('falls back to email prefix for display name when full_name is missing', () => {
    const userWithoutName = {
      ...mockUser,
      user_metadata: {},
    };

    render(<ProfileForm user={userWithoutName} />);

    // Should show "member" (email prefix before @)
    expect(screen.getByText('member')).toBeInTheDocument();
  });
});
