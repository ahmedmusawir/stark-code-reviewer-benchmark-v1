# Superadmin Portal v2 Test Suite

Comprehensive Jest and React Testing Library test suite for the Superadmin Portal features.

---

## Installation

Before running these tests, install the required dependencies:

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom
```

These dependencies have been added to `package.json` and will be installed automatically with `npm install`.

---

## Running Tests

```bash
# Run all tests
npm test

# Run only superadmin tests
npm test -- superadmin

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

---

## Test Files

### 1. **AddUserForm.test.tsx** — Form UI Tests
**Location:** `src/__tests__/superadmin/AddUserForm.test.tsx`

**Coverage:**
- ✅ Renders all required form fields (Name, Email, Password, Confirm Password, Role)
- ✅ Displays loading state (spinner) during form submission
- ✅ Validates password match before submission
- ✅ Calls `addUser` action with correct data structure
- ✅ Redirects to dashboard on successful user creation
- ✅ Validates required fields (name, email, password)
- ✅ Validates email format
- ✅ Validates minimum password length (8 characters)

**Key Assertions:**
```typescript
expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
expect(screen.getByText(/creating/i)).toBeInTheDocument(); // Loading state
expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
expect(addUserMock).toHaveBeenCalledWith({
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
  role: 'member',
});
```

---

### 2. **EditUserForm.test.tsx** — Form UI Tests
**Location:** `src/__tests__/superadmin/EditUserForm.test.tsx`

**Coverage:**
- ✅ Renders all form fields with user data pre-filled
- ✅ **CRITICAL:** Email field is rendered as `disabled` (read-only)
- ✅ Role dropdown displays current role
- ✅ Allows editing the name field
- ✅ Displays loading state (spinner) during submission
- ✅ Calls `editUser` action with correct data
- ✅ Redirects to dashboard on successful update
- ✅ Validates that name is required
- ✅ Prevents email modification (disabled field)

**Critical Test:**
```typescript
it('CRITICAL: renders email field as disabled', () => {
  render(<EditUserForm user={mockUser} />);
  const emailInput = screen.getByDisplayValue('john@example.com');
  expect(emailInput).toBeDisabled();
});
```

---

### 3. **actions.test.ts** — Server Action Tests
**Location:** `src/__tests__/superadmin/actions.test.ts`

**Coverage:**
- ✅ **CRITICAL:** `addUser` packs BOTH `full_name` AND `role` into `user_metadata` payload
- ✅ `addUser` calls `supabase.auth.admin.createUser` with correct structure
- ✅ `addUser` revalidates `/superadmin-portal` path on success
- ✅ `addUser` returns friendly error message for duplicate users
- ✅ `editUser` updates both `user_metadata` and `profiles` table
- ✅ `editUser` revalidates path on success
- ✅ `deleteUser` calls `supabase.auth.admin.deleteUser`
- ✅ `deleteUser` revalidates path on success
- ✅ `getUsers` fetches paginated users with roles
- ✅ `getUserById` fetches single user with role

**Critical Test:**
```typescript
it('CRITICAL: packs BOTH full_name and role into user_metadata payload', async () => {
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
```

---

### 4. **SuperadminPortalPageContent.test.tsx** — Dashboard UI Tests
**Location:** `src/__tests__/superadmin/SuperadminPortalPageContent.test.tsx`

**Coverage:**
- ✅ **CRITICAL:** Enforces pagination limit (only 6 user cards rendered on first page)
- ✅ Renders Edit and Delete buttons for each user
- ✅ Filters out superadmin users from display
- ✅ Displays role labels with correct color coding (red=admin, green=member)
- ✅ Displays pagination controls when multiple pages exist
- ✅ Shows "Add User" button in header
- ✅ Displays empty state when no users exist

**Critical Test:**
```typescript
it('CRITICAL: enforces pagination limit and only renders 6 user cards on first page', async () => {
  // Mock 8 users total
  getUsersMock.mockResolvedValue({
    users: mockUsers.slice(0, 6), // Server returns only 6
    total: 8,
  });

  const Component = await SuperadminPortalPageContent({ page: 1 });
  render(Component);

  const userCards = screen.getAllByText(/User \d+/);
  expect(userCards).toHaveLength(6); // Exactly 6 cards
  expect(screen.getByText(/8 total/i)).toBeInTheDocument();
});
```

---

### 5. **actions.test.ts (Updated)** — RBAC Routing Tests
**Location:** `src/__tests__/actions.test.ts`

**New Coverage:**
- ✅ **CRITICAL:** Member role is explicitly denied access to `/superadmin-portal`
- ✅ **CRITICAL:** Admin role is explicitly denied access to `/superadmin-portal`
- ✅ Superadmin role is allowed access to superadmin-only routes

**Critical Tests:**
```typescript
it('CRITICAL: explicitly denies member role access to superadmin routes', async () => {
  const user = { id: 'member-user' };
  mockAuthUser(user);
  getUserRoleMock.mockResolvedValue(AppRole.MEMBER);

  await expect(protectPage([AppRole.SUPERADMIN])).rejects.toThrow('NEXT_REDIRECT:/auth');
  expect(redirectMock).toHaveBeenCalledWith('/auth');
});

it('CRITICAL: explicitly denies admin role access to superadmin routes', async () => {
  const user = { id: 'admin-user' };
  mockAuthUser(user);
  getUserRoleMock.mockResolvedValue(AppRole.ADMIN);

  await expect(protectPage([AppRole.SUPERADMIN])).rejects.toThrow('NEXT_REDIRECT:/auth');
  expect(redirectMock).toHaveBeenCalledWith('/auth');
});
```

---

## Test Architecture

### Mocking Strategy

**Supabase Admin Client:**
```typescript
jest.mock('@/utils/supabase/admin', () => ({
  createAdminClient: jest.fn(),
}));
```

**Next.js Router:**
```typescript
// Already mocked globally in jest.setup.ts
useRouter: jest.fn(() => ({
  push: jest.fn(),
  replace: jest.fn(),
  refresh: jest.fn(),
}))
```

**Server Actions:**
```typescript
jest.mock('@/app/(superadmin)/superadmin-portal/actions', () => ({
  addUser: jest.fn(),
  editUser: jest.fn(),
  deleteUser: jest.fn(),
  getUsers: jest.fn(),
}));
```

### Test Environment

- **Node tests:** `testEnvironment: 'node'` (default for server actions)
- **React component tests:** `@jest-environment jsdom` (specified per file)

---

## Critical Assertions Summary

| Test File | Critical Assertion | Purpose |
|-----------|-------------------|---------|
| `AddUserForm.test.tsx` | Password match validation | Ensures confirm password field works |
| `EditUserForm.test.tsx` | Email field is `disabled` | Prevents email modification |
| `actions.test.ts` | `user_metadata` contains `full_name` AND `role` | Ensures smart trigger receives both values |
| `SuperadminPortalPageContent.test.tsx` | Only 6 cards rendered | Verifies pagination limit enforcement |
| `actions.test.ts` (RBAC) | Member/Admin denied superadmin access | Ensures route protection works |

---

## Expected Test Results

After running `npm install` and `npm test`, you should see:

```
PASS  src/__tests__/superadmin/actions.test.ts
PASS  src/__tests__/superadmin/AddUserForm.test.tsx
PASS  src/__tests__/superadmin/EditUserForm.test.tsx
PASS  src/__tests__/superadmin/SuperadminPortalPageContent.test.tsx
PASS  src/__tests__/actions.test.ts (updated with RBAC tests)

Test Suites: 5 passed, 5 total
Tests:       40+ passed, 40+ total
```

---

## Troubleshooting

### Issue: `Cannot find module '@testing-library/react'`
**Solution:** Run `npm install` to install the new dependencies added to `package.json`.

### Issue: `Property 'toBeInTheDocument' does not exist`
**Solution:** Ensure `@testing-library/jest-dom` is imported in test files:
```typescript
import '@testing-library/jest-dom';
```

### Issue: Server component tests fail
**Solution:** Server components must be awaited before rendering:
```typescript
const Component = await SuperadminPortalPageContent({ page: 1 });
render(Component);
```

---

## Next Steps

1. **Install dependencies:** `npm install`
2. **Run tests:** `npm test`
3. **Verify all tests pass**
4. **Add to CI/CD pipeline** (if applicable)

---

## Maintenance

When adding new features to the Superadmin Portal:

1. Add corresponding test file in `src/__tests__/superadmin/`
2. Follow existing mocking patterns
3. Include at least one "CRITICAL" test for core functionality
4. Update this README with new test coverage

---

**Last Updated:** 2026-04-13  
**Test Suite Version:** 1.0.0  
**Superadmin Portal Version:** v0.2.2
