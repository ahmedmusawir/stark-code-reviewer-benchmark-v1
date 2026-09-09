# AUTHENTICATION & SUPABASE INTEGRATION MANUAL

**Project:** Cyber Bugs Next.js Starter Kit  
**Version:** 1.0  
**Last Updated:** December 30, 2025  
**Purpose:** Complete guide for authentication, authorization, and Supabase integration patterns

---

## Table of Contents

1. [Overview & Architecture](#overview--architecture)
2. [Supabase Client Setup](#supabase-client-setup)
3. [Authentication Flow](#authentication-flow)
4. [API Routes Reference](#api-routes-reference)
5. [Client-Side Auth (Zustand Store)](#client-side-auth-zustand-store)
6. [Server-Side Protection (RBAC)](#server-side-protection-rbac)
7. [Session Management & Middleware](#session-management--middleware)
8. [Role-Based Access Control](#role-based-access-control)
9. [Auth Components](#auth-components)
10. [Common Patterns & Recipes](#common-patterns--recipes)
11. [Troubleshooting](#troubleshooting)
12. [Security Best Practices](#security-best-practices)

---

## Overview & Architecture

### Authentication Stack

**Backend:**
- Supabase Auth (PostgreSQL + JWT)
- Server-side session validation
- Cookie-based authentication

**Frontend:**
- Zustand for client state
- React Hook Form + Zod validation
- Hard page reloads for session sync

**Middleware:**
- Next.js middleware for session refresh
- Automatic cookie synchronization
- Route-level protection

### Key Principles

1. **Server-side first** - All auth checks happen on the server
2. **Session persistence** - Middleware keeps sessions alive
3. **Role-based access** - Three-tier role system (superadmin, admin, member)
4. **Hard reloads** - Force full page reload after auth changes to sync server/client state
5. **Metadata-driven roles** - Roles stored in `user_metadata`, not separate tables

---

## Supabase Client Setup

### Three Client Types

We use **three different Supabase clients** depending on the context:

| Client | Location | Use Case | Async? |
|--------|----------|----------|--------|
| Server | `src/utils/supabase/server.ts` | Server Components, API Routes | ✅ Yes |
| Browser | `src/utils/supabase/client.ts` | Client Components | ❌ No |
| Middleware | `src/utils/supabase/middleware.ts` | Session refresh | ✅ Yes |

---

### 1. Server Client (Server Components & API Routes)

**File:** `src/utils/supabase/server.ts`

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component - can't set cookies
          }
        },
      },
    }
  );
};
```

**Key Points:**
- ✅ **Must be async** (Next.js 15 + React 19 requirement)
- ✅ **Must await `cookies()`** before using
- Uses `@supabase/ssr` for server-side rendering
- Handles cookie get/set operations
- Try/catch for Server Components (can't set cookies)

**Usage:**
```typescript
// In Server Component
export default async function MyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  // ...
}

// In API Route
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  // ...
}
```

---

### 2. Browser Client (Client Components)

**File:** `src/utils/supabase/client.ts`

```typescript
import { createBrowserClient } from "@supabase/ssr";

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
```

**Key Points:**
- ❌ **Not async** - synchronous function
- Uses `@supabase/ssr` browser client
- Automatically handles browser cookies
- Use in client components only

**Usage:**
```typescript
"use client";

import { createClient } from "@/utils/supabase/client";

export default function MyComponent() {
  const supabase = createClient();
  
  const handleAction = async () => {
    const { data } = await supabase.auth.getUser();
    // ...
  };
}
```

---

### 3. Middleware Client (Session Refresh)

**File:** `src/utils/supabase/middleware.ts`

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return supabaseResponse;
}
```

**Key Points:**
- Runs on **every request** (via Next.js middleware)
- Syncs cookies between request and response
- Calls `getUser()` to refresh session
- Prevents session expiration during active use

**Middleware Entry:** `src/middleware.ts`

```typescript
import { updateSession } from "@/utils/supabase/middleware";
import { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

---

## Authentication Flow

### Complete Login Flow

```
1. User enters credentials in LoginForm
   ↓
2. LoginForm calls useAuthStore.login()
   ↓
3. Zustand store calls POST /api/auth/login
   ↓
4. API route calls supabase.auth.signInWithPassword()
   ↓
5. Supabase validates credentials & sets cookies
   ↓
6. API returns user data with metadata
   ↓
7. Store updates state with user & roles
   ↓
8. Store determines redirect based on role
   ↓
9. Store saves redirect to localStorage
   ↓
10. Store forces window.location.reload()
   ↓
11. Page reloads, middleware refreshes session
   ↓
12. LoginForm useEffect reads localStorage redirect
   ↓
13. Router navigates to role-specific portal
```

### Why Hard Reload?

**Problem:** Server and client can have different session states

**Solution:** Force full page reload after login/logout

```typescript
// In useAuthStore.ts
window.location.reload();
```

**Benefits:**
- ✅ Server and client sessions always in sync
- ✅ Middleware runs to refresh cookies
- ✅ Server Components get fresh user data
- ✅ No stale auth state

**Tradeoff:**
- ❌ Not SPA-like (full page reload)
- ❌ Loses client state
- ✅ But ensures security and consistency

---

### Complete Registration Flow

```
1. User fills RegisterForm
   ↓
2. Form validates with Zod schema
   ↓
3. Form calls POST /api/auth/signup
   ↓
4. API route calls supabase.auth.signUp() with user_metadata
   ↓
5. Supabase creates user with default role (is_qr_member: 1)
   ↓
6. User receives confirmation email (if enabled)
   ↓
7. Form redirects to /dashboard (⚠️ currently 404s)
```

**Default User Metadata:**
```typescript
{
  name: "User Name",
  is_qr_superadmin: 0,
  is_qr_admin: 0,
  is_qr_member: 1
}
```

---

### Logout Flow

```
1. User clicks Logout button
   ↓
2. Button calls useAuthStore.logout()
   ↓
3. Store calls POST /api/auth/logout
   ↓
4. API route calls supabase.auth.signOut()
   ↓
5. Supabase clears session cookies
   ↓
6. Store clears user state
   ↓
7. Store forces window.location.reload()
   ↓
8. Page reloads, user redirected to /auth
```

---

## API Routes Reference

All auth routes are in `src/app/api/auth/`.

### POST /api/auth/login

**Purpose:** Authenticate user with email/password

**Request:**
```typescript
{
  email: string;
  password: string;
}
```

**Response (Success):**
```typescript
{
  user: {
    id: string;
    email: string;
    user_metadata: {
      name: string;
      is_qr_superadmin: 0 | 1;
      is_qr_admin: 0 | 1;
      is_qr_member: 0 | 1;
    }
  }
}
```

**Response (Error):**
```typescript
{
  error: string;
}
```

**Implementation:**
```typescript
export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  return NextResponse.json({ user: data.user }, { 
    status: 200,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    }
  });
}
```

---

### POST /api/auth/logout

**Purpose:** Sign out current user

**Request:** Empty body

**Response:**
```typescript
{
  message: "Logged out successfully"
}
```

**Implementation:**
```typescript
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  return NextResponse.json(
    { message: "Logged out successfully" },
    { status: 200 }
  );
}
```

---

### POST /api/auth/signup

**Purpose:** Register new user

**Request:**
```typescript
{
  email: string;
  password: string;
  user_metadata: {
    name: string;
    is_qr_superadmin: 0 | 1;
    is_qr_admin: 0 | 1;
    is_qr_member: 0 | 1;
  }
}
```

**Response (Success):**
```typescript
{
  user: {
    id: string;
    email: string;
    user_metadata: { ... }
  }
}
```

**Implementation:**
```typescript
export async function POST(req: NextRequest) {
  const { email, password, user_metadata } = await req.json();
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: user_metadata,
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ user: data.user }, { status: 201 });
}
```

---

### GET /api/auth/confirm

**Purpose:** Confirm email via OTP token

**Query Parameters:**
- `token_hash` - OTP token from email
- `type` - Confirmation type (usually "signup")
- `next` - Redirect URL after confirmation (optional)

**Response:** Redirects to `next` or `/error`

**Implementation:**
```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/";

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    });

    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  return NextResponse.redirect(new URL("/error", request.url));
}
```

---

### POST /api/auth/superadmin-add-user

**Purpose:** Admin endpoint to create users with custom roles

**Request:**
```typescript
{
  email: string;
  password: string;
  user_metadata: {
    name: string;
    is_qr_superadmin: 0 | 1;
    is_qr_admin: 0 | 1;
    is_qr_member: 0 | 1;
  }
}
```

**⚠️ Security Note:** Should be protected with admin-only middleware (not currently implemented)

---

## Client-Side Auth (Zustand Store)

**File:** `src/store/useAuthStore.ts`

### Store Structure

```typescript
interface AuthState {
  user: any | null;
  roles: {
    is_qr_superadmin: number;
    is_qr_admin: number;
    is_qr_member: number;
  };
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}
```

### Login Method

```typescript
login: async (email, password) => {
  set({ isLoading: true });
  
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.error || "Login failed");
  }

  const { user } = await response.json();
  const roles = {
    is_qr_superadmin: user.user_metadata?.is_qr_superadmin || 0,
    is_qr_admin: user.user_metadata?.is_qr_admin || 0,
    is_qr_member: user.user_metadata?.is_qr_member || 0,
  };

  set({
    user,
    roles,
    isAuthenticated: true,
    isLoading: false,
  });

  // Determine redirect based on role hierarchy
  let redirectPath = "/members-portal";
  if (roles.is_qr_superadmin === 1) {
    redirectPath = "/superadmin-portal";
  } else if (roles.is_qr_admin === 1) {
    redirectPath = "/admin-portal";
  }

  localStorage.setItem("redirectAfterLogin", redirectPath);
  
  // Force reload to sync server/client state
  window.location.reload();
}
```

**Role Priority:**
1. Superadmin (highest)
2. Admin
3. Member (default)

---

### Logout Method

```typescript
logout: async () => {
  await fetch("/api/auth/logout", { method: "POST" });

  set({
    user: null,
    roles: {
      is_qr_superadmin: 0,
      is_qr_admin: 0,
      is_qr_member: 0,
    },
    isAuthenticated: false,
  });

  window.location.reload();
}
```

---

### Usage in Components

```typescript
"use client";

import { useAuthStore } from "@/store/useAuthStore";

export default function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuthStore();

  const handleLogin = async () => {
    try {
      await login("user@example.com", "password");
    } catch (error) {
      console.error(error.message);
    }
  };

  return (
    <div>
      {isAuthenticated ? (
        <>
          <p>Welcome, {user.email}</p>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
```

---

## Server-Side Protection (RBAC)

### protectPage Function

**File:** `src/utils/supabase/actions.ts`

```typescript
import { createClient } from "./server";
import { redirect } from "next/navigation";
import { getUserRole, AppRole } from "@/utils/get-user-role";

export async function protectPage(allowedRoles: AppRole[]) {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const userRole = getUserRole(user);

  if (!userRole || !allowedRoles.includes(userRole)) {
    redirect("/auth");
  }

  return user;
}
```

**Key Points:**
- ✅ Runs on server (Server Component or layout)
- ✅ Checks authentication first
- ✅ Then checks role authorization
- ✅ Redirects to /auth if unauthorized
- ✅ Returns user object if authorized

---

### Usage in Layouts

**Members Layout:**
```typescript
// src/app/(members)/layout.tsx
import { protectPage } from "@/utils/supabase/actions";

export default async function MemberLayout({ children }) {
  await protectPage(["member"]);

  return (
    <div>
      <Navbar />
      <Sidebar />
      {children}
    </div>
  );
}
```

**Admin Layout:**
```typescript
// src/app/(admin)/layout.tsx
export default async function AdminLayout({ children }) {
  await protectPage(["admin"]);
  // ...
}
```

**Superadmin Layout:**
```typescript
// src/app/(superadmin)/layout.tsx
export default async function SuperadminLayout({ children }) {
  await protectPage(["superadmin"]);
  // ...
}
```

---

### Multiple Roles

```typescript
// Allow both admin and superadmin
await protectPage(["admin", "superadmin"]);

// Allow all authenticated users
await protectPage(["member", "admin", "superadmin"]);
```

---

## Role-Based Access Control

### Role Definition

**File:** `src/utils/get-user-role.ts`

```typescript
export type AppRole = "superadmin" | "admin" | "member";

export function getUserRole(user: any): AppRole | null {
  if (!user?.user_metadata) return null;

  const {
    is_qr_superadmin,
    is_qr_admin,
    is_qr_member,
  } = user.user_metadata;

  // Check in priority order
  if (
    is_qr_superadmin === 1 ||
    is_qr_superadmin === true ||
    is_qr_superadmin === "1" ||
    is_qr_superadmin === "true"
  ) {
    return "superadmin";
  }

  if (
    is_qr_admin === 1 ||
    is_qr_admin === true ||
    is_qr_admin === "1" ||
    is_qr_admin === "true"
  ) {
    return "admin";
  }

  if (
    is_qr_member === 1 ||
    is_qr_member === true ||
    is_qr_member === "1" ||
    is_qr_member === "true"
  ) {
    return "member";
  }

  return null;
}
```

**Supported Value Types:**
- Numeric: `1` / `0`
- Boolean: `true` / `false`
- String: `"1"` / `"0"` / `"true"` / `"false"`

---

### Role Hierarchy

```
superadmin (highest privilege)
    ↓
  admin
    ↓
  member (lowest privilege)
```

**Access Rules:**
- Superadmin can access superadmin routes only (unless explicitly allowed)
- Admin can access admin routes only
- Member can access member routes only

**⚠️ Important:** Roles are **exclusive** by default. If you want superadmin to access admin routes, you must explicitly allow it:

```typescript
await protectPage(["admin", "superadmin"]);
```

---

### User Metadata Schema

Stored in Supabase `auth.users.user_metadata`:

```typescript
{
  name: string;                    // User's display name
  is_qr_superadmin: 0 | 1;        // Superadmin flag
  is_qr_admin: 0 | 1;             // Admin flag
  is_qr_member: 0 | 1;            // Member flag
}
```

**Best Practice:** Only one role flag should be `1`, others should be `0`.

**Default for new signups:**
```typescript
{
  name: "John Doe",
  is_qr_superadmin: 0,
  is_qr_admin: 0,
  is_qr_member: 1
}
```

---

## Session Management & Middleware

### Middleware Flow

```
Every Request
    ↓
Next.js Middleware (src/middleware.ts)
    ↓
updateSession() (src/utils/supabase/middleware.ts)
    ↓
Create Supabase client with cookie handlers
    ↓
Call supabase.auth.getUser()
    ↓
Refresh session if needed
    ↓
Sync cookies between request/response
    ↓
Continue to route handler
```

### Session Lifecycle

**Session Creation:**
1. User logs in via `/api/auth/login`
2. Supabase sets session cookies
3. Cookies include access token + refresh token

**Session Refresh:**
1. Middleware runs on every request
2. Calls `getUser()` which auto-refreshes if needed
3. Updates cookies with new tokens
4. Session stays alive during active use

**Session Expiration:**
- Access token expires after 1 hour (default)
- Refresh token expires after 7 days (default)
- Middleware auto-refreshes before expiration
- User must re-login after refresh token expires

---

### Cookie Configuration

**Cookie Names:**
- `sb-<project-ref>-auth-token` - Access token
- `sb-<project-ref>-auth-token-code-verifier` - PKCE verifier

**Cookie Options:**
- `httpOnly: true` - Not accessible via JavaScript
- `secure: true` - HTTPS only (production)
- `sameSite: 'lax'` - CSRF protection
- `path: '/'` - Available site-wide

---

## Auth Components

### AuthTabs Component

**File:** `src/components/auth/AuthTabs.tsx`

**Purpose:** Tab switcher for Login/Register forms

```typescript
const AuthTabs = () => {
  const [selectedTab, setSelectedTab] = useState("login");

  return (
    <Tabs defaultValue="login" className="w-[400px] mt-16">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="login">Login</TabsTrigger>
        <TabsTrigger value="register">Register</TabsTrigger>
      </TabsList>
      
      <TabsContent value="login">
        <LoginForm />
      </TabsContent>
      
      <TabsContent value="register">
        <RegisterForm />
      </TabsContent>
    </Tabs>
  );
};
```

**Features:**
- Two-tab interface
- Active tab highlighting
- Smooth transitions
- Dark mode support

---

### LoginForm Component

**File:** `src/components/auth/LoginForm.tsx`

**Features:**
- React Hook Form validation
- Zod schema validation
- Error handling
- Loading states
- Redirect after login

**Form Schema:**
```typescript
const formSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
```

**Submit Handler:**
```typescript
const handleSubmit = async (data) => {
  setError(null);
  setIsLoading(true);
  
  try {
    await login(data.email, data.password);
    // Store triggers reload
  } catch (error) {
    setError(error.message);
    setIsLoading(false);
  }
};
```

**Redirect Logic:**
```typescript
useEffect(() => {
  const target = localStorage.getItem("redirectAfterLogin");
  if (target) {
    localStorage.removeItem("redirectAfterLogin");
    router.replace(target);
  }
}, [router]);
```

---

### RegisterForm Component

**File:** `src/components/auth/RegisterForm.tsx`

**Features:**
- Name, email, password, confirm password fields
- Password matching validation
- Default member role assignment
- Error display

**Form Schema:**
```typescript
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().min(1, "Email is required").email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
  passwordConfirm: z.string().min(1, "Password confirmation is required"),
}).refine((data) => data.password === data.passwordConfirm, {
  message: "Passwords don't match",
  path: ["passwordConfirm"],
});
```

**Submit Handler:**
```typescript
const handleSubmit = async (data) => {
  const user_metadata = {
    name: data.name,
    is_qr_superadmin: 0,
    is_qr_admin: 0,
    is_qr_member: 1,
  };

  const response = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: data.email,
      password: data.password,
      user_metadata,
    }),
  });

  if (response.ok) {
    router.push("/dashboard"); // ⚠️ Currently 404s
  } else {
    const result = await response.json();
    setError(result.error);
  }
};
```

---

### Auth Page Layout

**File:** `src/app/(auth)/layout.tsx`

```typescript
const AuthLayout = ({ children }) => {
  return (
    <>
      <NavbarLoginReg />
      <div className="h-[100vh] flex items-center justify-center relative">
        {children}
      </div>
    </>
  );
};
```

**Features:**
- Full-height centered layout
- Minimal navbar
- Clean, focused design

---

## Common Patterns & Recipes

### Pattern 1: Get Current User (Server)

```typescript
// In Server Component or API Route
import { createClient } from "@/utils/supabase/server";

export default async function MyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/auth");
  }
  
  return <div>Welcome, {user.email}</div>;
}
```

---

### Pattern 2: Get Current User (Client)

```typescript
"use client";

import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";

export default function MyComponent() {
  const [user, setUser] = useState(null);
  const supabase = createClient();
  
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);
  
  return <div>{user?.email}</div>;
}
```

---

### Pattern 3: Protected Page (Server Component)

```typescript
import { protectPage } from "@/utils/supabase/actions";

export default async function ProtectedPage() {
  const user = await protectPage(["member"]);
  
  return (
    <div>
      <h1>Protected Content</h1>
      <p>User: {user.email}</p>
    </div>
  );
}
```

---

### Pattern 4: Role-Based UI (Client)

```typescript
"use client";

import { useAuthStore } from "@/store/useAuthStore";

export default function Dashboard() {
  const { roles } = useAuthStore();
  
  return (
    <div>
      {roles.is_qr_superadmin === 1 && (
        <button>Superadmin Action</button>
      )}
      
      {roles.is_qr_admin === 1 && (
        <button>Admin Action</button>
      )}
      
      <button>Member Action</button>
    </div>
  );
}
```

---

### Pattern 5: Conditional Navbar Links

```typescript
"use client";

import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const supabase = createClient();
  
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);
  
  return (
    <nav>
      {user ? (
        <>
          <Link href="/dashboard">Dashboard</Link>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <Link href="/auth">Login</Link>
      )}
    </nav>
  );
}
```

---

### Pattern 6: Fetch User-Specific Data

```typescript
// Server Component
import { createClient } from "@/utils/supabase/server";

export default async function MyPosts() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect("/auth");
  
  // Fetch user's posts
  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .eq("user_id", user.id);
  
  return (
    <div>
      {posts?.map(post => (
        <div key={post.id}>{post.title}</div>
      ))}
    </div>
  );
}
```

---

### Pattern 7: Update User Metadata

```typescript
// API Route
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { name } = await req.json();
  
  const { data, error } = await supabase.auth.updateUser({
    data: { name }
  });
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  
  return NextResponse.json({ user: data.user });
}
```

---

## Troubleshooting

### Issue 1: "cookies() should be awaited"

**Error:**
```
Error: Route "/api/auth/login" used cookies().get(...). 
cookies() should be awaited before using its value.
```

**Cause:** Next.js 15 + React 19 requires `await cookies()`

**Fix:**
```typescript
// ❌ Wrong
export const createClient = () => {
  const cookieStore = cookies();
  // ...
}

// ✅ Correct
export const createClient = async () => {
  const cookieStore = await cookies();
  // ...
}
```

**Also update all call sites:**
```typescript
// ❌ Wrong
const supabase = createClient();

// ✅ Correct
const supabase = await createClient();
```

---

### Issue 2: Session not persisting

**Symptoms:**
- User logs in but appears logged out on refresh
- Session cookies not being set

**Causes:**
1. Middleware not running
2. Cookie settings incorrect
3. HTTPS required but using HTTP

**Fixes:**
1. Check `src/middleware.ts` is present and configured
2. Verify `NEXT_PUBLIC_SITE_URL` is set correctly
3. Use HTTPS in production
4. Check browser cookie settings

---

### Issue 3: Infinite redirect loop

**Symptoms:**
- Page keeps redirecting to /auth
- Browser shows "too many redirects"

**Causes:**
1. `protectPage()` in wrong place
2. Middleware interfering with auth routes
3. Role check failing

**Fixes:**
1. Only use `protectPage()` in layouts, not in /auth routes
2. Exclude /auth from middleware matcher
3. Check user has correct role in metadata

---

### Issue 4: Hard reload loses state

**Symptoms:**
- Client state lost after login
- Form data cleared

**This is expected behavior:**
- Hard reload is intentional for session sync
- Use localStorage for persistence if needed
- Or refactor to avoid hard reload (advanced)

---

### Issue 5: Role not recognized

**Symptoms:**
- User has role but `getUserRole()` returns null
- Access denied despite correct metadata

**Causes:**
1. Metadata not set during signup
2. Metadata format incorrect
3. Role flag is string instead of number

**Fixes:**
1. Check user metadata in Supabase dashboard
2. Ensure flags are numeric (0 or 1)
3. `getUserRole()` handles multiple formats, but prefer numbers

---

## Security Best Practices

### ✅ DO

1. **Always validate on server**
   - Never trust client-side auth state
   - Use `protectPage()` in layouts
   - Validate user in API routes

2. **Use environment variables**
   - Store Supabase keys in `.env.local`
   - Never commit secrets to git
   - Use different keys for dev/prod

3. **Implement RLS policies**
   - Add Row Level Security in Supabase
   - Restrict data access by user ID
   - Enforce at database level

4. **Validate all inputs**
   - Use Zod schemas
   - Sanitize user input
   - Check for SQL injection

5. **Use HTTPS in production**
   - Required for secure cookies
   - Prevents man-in-the-middle attacks

6. **Set proper cookie options**
   - `httpOnly: true`
   - `secure: true` (production)
   - `sameSite: 'lax'`

7. **Implement rate limiting**
   - Prevent brute force attacks
   - Limit login attempts
   - Use Supabase rate limiting or middleware

---

### ❌ DON'T

1. **Don't trust client state**
   - Client can be manipulated
   - Always verify on server

2. **Don't store sensitive data in localStorage**
   - Accessible via JavaScript
   - Use secure cookies instead

3. **Don't expose API keys**
   - Never commit to git
   - Don't log in production
   - Use environment variables

4. **Don't skip validation**
   - Validate all user input
   - Check roles on every request
   - Don't assume data is safe

5. **Don't use weak passwords**
   - Enforce password requirements
   - Consider password strength meter
   - Implement password reset

6. **Don't ignore errors**
   - Log authentication errors
   - Monitor failed login attempts
   - Alert on suspicious activity

---

### Security Checklist

**Before Production:**
- [ ] RLS policies implemented on all tables
- [ ] Environment variables secured
- [ ] HTTPS enabled
- [ ] Rate limiting configured
- [ ] Password requirements enforced
- [ ] Email verification enabled
- [ ] Session timeout configured
- [ ] Error logging implemented
- [ ] Security headers set
- [ ] CORS configured properly
- [ ] API routes protected
- [ ] User input sanitized
- [ ] SQL injection prevented
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented (if needed)

---

## Advanced Topics

### Custom Email Templates

Configure in Supabase Dashboard:
1. Go to Authentication > Email Templates
2. Customize confirmation, reset, invite emails
3. Use variables: `{{ .ConfirmationURL }}`, `{{ .Token }}`

---

### Password Reset Flow

**Not currently implemented. To add:**

1. Create `/api/auth/reset-password` route
2. Call `supabase.auth.resetPasswordForEmail()`
3. User receives email with reset link
4. Create password reset page
5. Call `supabase.auth.updateUser({ password })`

---

### Email Verification

**Currently optional. To enforce:**

1. Enable in Supabase Dashboard
2. Users must confirm email before login
3. Handle unverified state in login flow
4. Show "verify email" message

---

### OAuth Providers

**To add Google/GitHub login:**

1. Configure provider in Supabase Dashboard
2. Add OAuth button to LoginForm
3. Call `supabase.auth.signInWithOAuth({ provider: 'google' })`
4. Handle callback in `/api/auth/callback`

---

### Multi-Factor Authentication

**To add 2FA:**

1. Enable in Supabase Dashboard
2. Call `supabase.auth.mfa.enroll()`
3. User scans QR code
4. Verify with `supabase.auth.mfa.verify()`
5. Require on login

---

## Quick Reference

### Import Statements

```typescript
// Server Components / API Routes
import { createClient } from "@/utils/supabase/server";
import { protectPage } from "@/utils/supabase/actions";
import { getUserRole } from "@/utils/get-user-role";

// Client Components
import { createClient } from "@/utils/supabase/client";
import { useAuthStore } from "@/store/useAuthStore";

// Middleware
import { updateSession } from "@/utils/supabase/middleware";
```

---

### Common Commands

```typescript
// Get current user (server)
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();

// Get current user (client)
const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();

// Protect page
const user = await protectPage(["member"]);

// Get user role
const role = getUserRole(user);

// Login (via store)
await useAuthStore.getState().login(email, password);

// Logout (via store)
await useAuthStore.getState().logout();
```

---

## Environment Variables

Required in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Production:**
```bash
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

---

## File Structure Reference

```
src/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx              # Auth page layout
│   │   └── auth/
│   │       └── page.tsx            # Login/Register page
│   └── api/
│       └── auth/
│           ├── login/route.ts      # POST login
│           ├── logout/route.ts     # POST logout
│           ├── signup/route.ts     # POST signup
│           ├── confirm/route.ts    # GET email confirm
│           └── superadmin-add-user/route.ts
├── components/
│   └── auth/
│       ├── AuthTabs.tsx            # Tab switcher
│       ├── LoginForm.tsx           # Login form
│       ├── RegisterForm.tsx        # Register form
│       └── Logout.tsx              # Logout button
├── store/
│   └── useAuthStore.ts             # Zustand auth store
├── utils/
│   ├── get-user-role.ts            # Role derivation
│   └── supabase/
│       ├── server.ts               # Server client
│       ├── client.ts               # Browser client
│       ├── middleware.ts           # Session refresh
│       ├── actions.ts              # protectPage
│       └── fetchUserData.ts        # User data helper
└── middleware.ts                   # Next.js middleware
```

---

## 12. SuperAdmin User Management

SuperAdmin users have elevated privileges to create, view, and delete other users.

### SuperAdmin Role Definition

```typescript
// User metadata flags
interface UserRoleFlags {
  is_qr_superadmin: 0 | 1;  // Full access + user management
  is_qr_admin: 0 | 1;       // Admin portal access
  is_qr_member: 0 | 1;      // Member/read-only access
}
```

### SuperAdmin API: Create User

```typescript
// src/app/api/superadmin/add-user/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Verify requester is SuperAdmin
    const { data: { user: requester } } = await supabase.auth.getUser();
    if (!requester) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requesterMeta = requester.user_metadata;
    if (requesterMeta?.is_qr_superadmin !== 1) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Parse request body
    const { email, password, is_qr_superadmin, is_qr_admin, is_qr_member } = await req.json();

    // 3. Validate at least one role
    if (!is_qr_superadmin && !is_qr_admin && !is_qr_member) {
      return NextResponse.json(
        { error: 'At least one role must be assigned' },
        { status: 400 }
      );
    }

    // 4. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        is_qr_superadmin: is_qr_superadmin || 0,
        is_qr_admin: is_qr_admin || 0,
        is_qr_member: is_qr_member || 0,
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // 5. Optionally create in mirror table (see next section)
    await supabase.from('app_users').insert({
      id: authData.user.id,
      email,
      role: is_qr_superadmin ? 'SuperAdmin' : is_qr_admin ? 'Admin' : 'Member',
    });

    return NextResponse.json({ user: authData.user }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### SuperAdmin API: Delete User

```typescript
// src/app/api/superadmin/delete-user/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Verify requester is SuperAdmin
    const { data: { user: requester } } = await supabase.auth.getUser();
    if (!requester || requester.user_metadata?.is_qr_superadmin !== 1) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Get user ID to delete
    const { userId } = await req.json();

    // 3. Prevent deleting SuperAdmins (safety)
    const { data: targetUser } = await supabase.auth.admin.getUserById(userId);
    if (targetUser?.user?.user_metadata?.is_qr_superadmin === 1) {
      return NextResponse.json(
        { error: 'Cannot delete SuperAdmin users' },
        { status: 400 }
      );
    }

    // 4. Delete from mirror table first
    await supabase.from('app_users').delete().eq('id', userId);

    // 5. Delete from Supabase Auth
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### SuperAdmin API: Get All Users

```typescript
// src/app/api/superadmin/get-users/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // 1. Verify requester is SuperAdmin
    const { data: { user: requester } } = await supabase.auth.getUser();
    if (!requester || requester.user_metadata?.is_qr_superadmin !== 1) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. List all users from Supabase Auth
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // 3. Transform for client consumption
    const transformedUsers = users.map((user) => ({
      id: user.id,
      email: user.email,
      is_qr_superadmin: user.user_metadata?.is_qr_superadmin || 0,
      is_qr_admin: user.user_metadata?.is_qr_admin || 0,
      is_qr_member: user.user_metadata?.is_qr_member || 0,
      created_at: user.created_at,
    }));

    return NextResponse.json({ users: transformedUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

---

## 13. User Mirror Table Pattern

When you need custom user data beyond what Supabase Auth provides, create a mirror table.

### Why Mirror Tables?

| Benefit | Description |
|---------|-------------|
| **Custom fields** | Store app-specific data (avatar, preferences) |
| **Query flexibility** | Join with other tables easily |
| **RLS policies** | Apply fine-grained access control |
| **Audit trail** | Track user changes separately from auth |

### Mirror Table Schema

```sql
CREATE TABLE app_users (
  -- Same ID as Supabase Auth user
  id UUID PRIMARY KEY,
  
  -- Custom fields
  display_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'member',
  preferences JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users read own profile"
ON app_users FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users update own profile"
ON app_users FOR UPDATE
USING (auth.uid() = id);
```

### Synchronized User Creation

```typescript
// Create user in both Supabase Auth and mirror table
const createUserWithProfile = async (
  email: string,
  password: string,
  profileData: { displayName: string; role: string }
) => {
  const supabase = await createClient();

  // 1. Create in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      display_name: profileData.displayName,
      role: profileData.role,
    },
  });

  if (authError) throw authError;

  // 2. Create in mirror table with SAME ID
  const { error: profileError } = await supabase.from('app_users').insert({
    id: authData.user.id, // Critical: same UUID
    display_name: profileData.displayName,
    role: profileData.role,
  });

  if (profileError) {
    // Rollback: delete auth user if profile creation fails
    await supabase.auth.admin.deleteUser(authData.user.id);
    throw profileError;
  }

  return authData.user;
};
```

### Synchronized User Deletion

```typescript
// Delete user from both systems
const deleteUserCompletely = async (userId: string) => {
  const supabase = await createClient();

  // 1. Delete from mirror table first (referential order)
  const { error: profileError } = await supabase
    .from('app_users')
    .delete()
    .eq('id', userId);

  if (profileError) {
    console.error('Failed to delete profile:', profileError);
    // Continue with auth deletion
  }

  // 2. Delete from Supabase Auth
  const { error: authError } = await supabase.auth.admin.deleteUser(userId);

  if (authError) throw authError;
};
```

### Fetch User with Profile

```typescript
// Get auth user and profile in one call
const getUserWithProfile = async () => {
  const supabase = await createClient();

  // Get auth user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get profile from mirror table
  const { data: profile } = await supabase
    .from('app_users')
    .select('*')
    .eq('id', user.id)
    .single();

  return {
    ...user,
    profile,
  };
};
```

---

## 14. HOC Route Protection Pattern

Use Higher-Order Components to protect route layouts by role.

### withRoleCheck HOC

```typescript
// src/hoc/withRoleCheck.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import Spinner from '@/components/common/Spinner';

interface RoleCheckConfig {
  allowedRoles: string[]; // e.g., ['is_qr_admin', 'is_qr_member']
  redirectTo: string;     // e.g., '/admin-login'
}

export function withRoleCheck<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  config: RoleCheckConfig
) {
  return function WithRoleCheckComponent(props: P) {
    const router = useRouter();
    const { user, roles, isLoading } = useAuthStore();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
      if (isLoading) return;

      // Not logged in
      if (!user) {
        router.push(config.redirectTo);
        return;
      }

      // Check if user has any of the allowed roles
      const hasRole = config.allowedRoles.some(
        (role) => roles[role as keyof typeof roles] === 1
      );

      if (!hasRole) {
        router.push(config.redirectTo);
        return;
      }

      setIsAuthorized(true);
    }, [user, roles, isLoading, router]);

    if (isLoading || !isAuthorized) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <Spinner />
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
}
```

### Usage in Layouts

```typescript
// src/app/(admin)/layout.tsx
import { withRoleCheck } from '@/hoc/withRoleCheck';

function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNavbar />
      <main className="p-4">{children}</main>
    </div>
  );
}

// Protect: Only admin and member roles can access
export default withRoleCheck(AdminLayout, {
  allowedRoles: ['is_qr_admin', 'is_qr_member'],
  redirectTo: '/admin-login',
});
```

```typescript
// src/app/(superadmin)/layout.tsx
import { withRoleCheck } from '@/hoc/withRoleCheck';

function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <SuperAdminNavbar />
      <main className="p-4">{children}</main>
    </div>
  );
}

// Protect: Only superadmin role can access
export default withRoleCheck(SuperAdminLayout, {
  allowedRoles: ['is_qr_superadmin'],
  redirectTo: '/superadmin-login',
});
```

### Role-Based UI Elements

```typescript
// Show/hide UI based on role
'use client';

import { useAuthStore } from '@/store/useAuthStore';

export function AdminActions() {
  const { roles } = useAuthStore();

  return (
    <div className="flex gap-2">
      {/* All admins can view */}
      <Button>View Details</Button>

      {/* Only SuperAdmins can delete */}
      {roles.is_qr_superadmin === 1 && (
        <Button variant="destructive">Delete User</Button>
      )}
    </div>
  );
}
```

---

## Summary

This authentication system provides:

✅ **Secure** - Server-side validation, secure cookies, session management  
✅ **Simple** - Three client types, clear patterns, minimal boilerplate  
✅ **Scalable** - Role-based access, metadata-driven, extensible  
✅ **Production-ready** - Middleware, error handling, type safety  
✅ **SuperAdmin Ready** - User management APIs, mirror tables, HOC protection

**Key Takeaways:**
1. Always use server-side validation
2. Three client types for different contexts
3. Hard reload ensures session sync
4. Roles stored in user_metadata
5. Middleware keeps sessions alive
6. protectPage() for route protection
7. Mirror tables for custom user data
8. HOC pattern for layout-level protection
9. SuperAdmin APIs for user management

**Next Steps:**
1. Implement RLS policies in Supabase
2. Add password reset flow
3. Enable email verification
4. Add rate limiting
5. Implement audit logging
6. Consider OAuth providers

---

**End of Manual**

*Build secure, scalable auth flows with confidence.* 🔐
