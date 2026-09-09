/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EditUserForm from '@/app/(superadmin)/superadmin-portal/edit/[id]/EditUserForm';
import { useRouter } from 'next/navigation';
import { editUser } from '@/app/(superadmin)/superadmin-portal/actions';

// Mock the server action
jest.mock('@/app/(superadmin)/superadmin-portal/actions', () => ({
  editUser: jest.fn(),
}));

// Mock toast
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

const editUserMock = editUser as jest.MockedFunction<typeof editUser>;
const useRouterMock = useRouter as jest.MockedFunction<typeof useRouter>;

describe('EditUserForm', () => {
  const mockPush = jest.fn();
  const mockRefresh = jest.fn();

  const mockUser = {
    id: 'user-123',
    full_name: 'John Doe',
    email: 'john@example.com',
    role: 'admin',
    created_at: '2024-01-01',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useRouterMock.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      refresh: mockRefresh,
    } as any);
  });

  it('renders all form fields with user data', () => {
    render(<EditUserForm user={mockUser} />);

    expect(screen.getByLabelText(/full name/i)).toHaveValue('John Doe');
    expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('CRITICAL: renders email field as disabled', () => {
    render(<EditUserForm user={mockUser} />);

    const emailInput = screen.getByDisplayValue('john@example.com');
    expect(emailInput).toBeDisabled();
  });

  it('renders role dropdown with current role selected', () => {
    render(<EditUserForm user={mockUser} />);

    // The combobox trigger should display the current role value
    const combobox = screen.getByRole('combobox');
    expect(combobox).toBeInTheDocument();
    // The hidden select should have the correct value selected
    const hiddenSelect = document.querySelector('select[aria-hidden="true"]') as HTMLSelectElement;
    expect(hiddenSelect?.value).toBe('admin');
  });

  it('allows editing the name field', async () => {
    render(<EditUserForm user={mockUser} />);

    const nameInput = screen.getByLabelText(/full name/i) as HTMLInputElement;
    
    expect(nameInput).not.toBeDisabled();
    
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
    
    await waitFor(() => {
      expect(nameInput.value).toBe('Jane Doe');
    });
  });

  it('displays loading state (spinner) when form is submitted', async () => {
    editUserMock.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({}), 100)));

    render(<EditUserForm user={mockUser} />);

    const nameInput = screen.getByLabelText(/full name/i);
    const submitButton = screen.getByRole('button', { name: /save changes/i });

    fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });

  it('calls editUser action with correct data on submission', async () => {
    editUserMock.mockResolvedValue({});

    render(<EditUserForm user={mockUser} />);

    const nameInput = screen.getByLabelText(/full name/i);
    const submitButton = screen.getByRole('button', { name: /save changes/i });

    fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(editUserMock).toHaveBeenCalledWith('user-123', {
        name: 'Updated Name',
        role: 'admin',
      });
    });
  });

  it('redirects to dashboard on successful update', async () => {
    editUserMock.mockResolvedValue({});

    render(<EditUserForm user={mockUser} />);

    const nameInput = screen.getByLabelText(/full name/i);
    const submitButton = screen.getByRole('button', { name: /save changes/i });

    fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/superadmin-portal');
    });
  });

  it('validates that name is required', async () => {
    render(<EditUserForm user={mockUser} />);

    const nameInput = screen.getByLabelText(/full name/i);
    const submitButton = screen.getByRole('button', { name: /save changes/i });

    fireEvent.change(nameInput, { target: { value: '' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });

    expect(editUserMock).not.toHaveBeenCalled();
  });

  it('does not allow changing email (field is disabled)', () => {
    render(<EditUserForm user={mockUser} />);

    const emailInput = screen.getByDisplayValue('john@example.com') as HTMLInputElement;
    
    // Attempt to change disabled field should have no effect
    fireEvent.change(emailInput, { target: { value: 'newemail@example.com' } });
    
    // Value should remain unchanged because field is disabled
    expect(emailInput.value).toBe('john@example.com');
    expect(emailInput).toBeDisabled();
  });
});
