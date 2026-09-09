/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AddMemberForm from '@/app/(admin)/admin-portal/add-member/AddMemberForm';
import { useRouter } from 'next/navigation';
import { addMember } from '@/app/(admin)/admin-portal/actions';

jest.mock('@/app/(admin)/admin-portal/actions', () => ({
  addMember: jest.fn(),
}));

jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

const addMemberMock = addMember as jest.MockedFunction<typeof addMember>;
const useRouterMock = useRouter as jest.MockedFunction<typeof useRouter>;

describe('AddMemberForm', () => {
  const mockPush = jest.fn();
  const mockRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useRouterMock.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      refresh: mockRefresh,
    } as any);
  });

  it('renders all required form fields', () => {
    render(<AddMemberForm />);

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/temporary password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create member/i })).toBeInTheDocument();
  });

  it('shows loading state when form is submitted', async () => {
    addMemberMock.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({}), 100))
    );

    render(<AddMemberForm />);

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Jane Smith' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'jane@example.com' } });
    fireEvent.change(screen.getByLabelText(/temporary password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });

    // Store reference before clicking — text changes to "Creating..." when loading
    const submitButton = screen.getByRole('button', { name: /create member/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });

  it('validates that passwords match before submission', async () => {
    render(<AddMemberForm />);

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Jane Smith' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'jane@example.com' } });
    fireEvent.change(screen.getByLabelText(/temporary password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'different' } });

    fireEvent.click(screen.getByRole('button', { name: /create member/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    expect(addMemberMock).not.toHaveBeenCalled();
  });

  it('validates required fields on empty submit', async () => {
    render(<AddMemberForm />);

    fireEvent.click(screen.getByRole('button', { name: /create member/i }));

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });

    expect(addMemberMock).not.toHaveBeenCalled();
  });

  it('calls addMember with correct data on valid submission', async () => {
    addMemberMock.mockResolvedValue({});

    render(<AddMemberForm />);

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Jane Smith' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'jane@example.com' } });
    fireEvent.change(screen.getByLabelText(/temporary password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: /create member/i }));

    await waitFor(() => {
      expect(addMemberMock).toHaveBeenCalledWith({
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'password123',
      });
    });
  });

  it('redirects to admin-portal dashboard on successful creation', async () => {
    addMemberMock.mockResolvedValue({});

    render(<AddMemberForm />);

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Jane Smith' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'jane@example.com' } });
    fireEvent.change(screen.getByLabelText(/temporary password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: /create member/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin-portal');
    });
  });

  it('does not redirect when addMember returns an error', async () => {
    addMemberMock.mockResolvedValue({ error: 'A user with the email "jane@example.com" already exists.' });

    render(<AddMemberForm />);

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Jane Smith' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'jane@example.com' } });
    fireEvent.change(screen.getByLabelText(/temporary password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: /create member/i }));

    await waitFor(() => {
      expect(addMemberMock).toHaveBeenCalled();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });
});
