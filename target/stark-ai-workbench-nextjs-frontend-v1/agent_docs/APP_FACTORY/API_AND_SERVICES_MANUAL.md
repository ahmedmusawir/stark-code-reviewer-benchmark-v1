# API AND SERVICES MANUAL

> **Stark Industries Software Factory**  
> *The definitive guide to building scalable, maintainable service layers for any external API integration.*

---

## Table of Contents

1. [Philosophy & Architecture](#1-philosophy--architecture)
2. [Folder Structure](#2-folder-structure)
3. [Service Layer Implementation](#3-service-layer-implementation)
4. [API Route Patterns](#4-api-route-patterns)
5. [External API Integration](#5-external-api-integration)
6. [Supabase Service Pattern](#6-supabase-service-pattern)
7. [Data Transformation](#7-data-transformation)
8. [Error Handling Strategy](#8-error-handling-strategy)
9. [Performance Patterns](#9-performance-patterns)
10. [Quick Reference](#10-quick-reference)

---

## 1. Philosophy & Architecture

### The Service Layer Pattern

The Service Layer is the **single most important architectural decision** in this codebase. It enforces a strict separation between UI components and data-fetching logic.

**The Rule:** Components render. Services fetch.

```
┌─────────────────────────────────────────────────────────────────┐
│                        UI COMPONENTS                            │
│   (React components only handle rendering and user interaction) │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SERVICE LAYER                             │
│   (All API calls, data transformation, error handling)          │
│   Location: src/services/                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       API ROUTES                                │
│   (Next.js API routes act as secure middleware/proxy)           │
│   Location: src/app/api/                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                            │
│   (WooCommerce, Stripe, WordPress, Supabase, CRM APIs, etc.)    │
└─────────────────────────────────────────────────────────────────┘
```

### Why This Matters

1. **Testability**: Services can be unit tested without rendering components
2. **Reusability**: Multiple components can share the same service functions
3. **Maintainability**: API changes only require updates in one place
4. **Security**: Credentials never leak to the client
5. **Type Safety**: Response types are defined once and enforced everywhere

### Server vs Client Data Fetching Decision Tree

```
START: Where does this data come from?
│
├─► External API with credentials (API keys, secrets)
│   └─► ALWAYS use API Route → Service Layer (Server-side)
│
├─► Supabase with RLS (Row Level Security)
│   └─► Can use Client OR Server depending on context
│       ├─► Server Component → Use server createClient
│       └─► Client Component → Use browser createClient
│
├─► Public data (no auth required)
│   └─► Server Component with direct fetch (SSR/SSG)
│
└─► User-triggered action (button click, form submit)
    └─► Client Component → API Route → Service Layer
```

### API Route as Proxy Pattern

**Never expose credentials to the client.** API routes act as a secure proxy:

```typescript
// ❌ WRONG: Credentials in client code
const response = await fetch('https://api.external.com/data', {
  headers: { 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_KEY}` }
});

// ✅ CORRECT: Credentials stay on server
// Client calls our API route
const response = await fetch('/api/external-data');

// API route handles credentials
// src/app/api/external-data/route.ts
export async function GET() {
  const data = await externalService.fetchData(); // Uses server-only env vars
  return NextResponse.json(data);
}
```

---

## 2. Folder Structure

### Standard Layout

```
src/
├── app/
│   └── api/                          # API route handlers
│       ├── create-payment-intent/
│       │   └── route.ts
│       ├── place-order/
│       │   └── route.ts
│       ├── sync-contact/             # Future: CRM sync endpoints
│       │   └── route.ts
│       └── [resource]/
│           └── route.ts
│
├── services/                         # Service layer functions
│   ├── productServices.ts            # Product-related API calls
│   ├── orderServices.ts              # Order-related API calls
│   ├── blogServices.ts               # Blog/content API calls
│   ├── paymentServices.ts            # Payment processing
│   ├── supabaseServices.ts           # Supabase data operations
│   └── crmServices.ts                # Future: CRM integrations
│
├── constants/
│   └── apiEndpoints.ts               # Centralized endpoint definitions
│
├── types/
│   ├── product.ts                    # Product type definitions
│   ├── order.ts                      # Order type definitions
│   ├── api-responses.ts              # External API response types
│   └── supabase.ts                   # Supabase-generated types
│
└── lib/
    └── utils.ts                      # Shared utilities (cn, formatters)
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Service file | `{domain}Services.ts` | `productServices.ts` |
| Service function | `fetch{Resource}`, `create{Resource}`, `update{Resource}` | `fetchProductBySlug()` |
| API route folder | `kebab-case` | `create-payment-intent/` |
| Type file | `{domain}.ts` | `product.ts` |
| Constant file | `camelCase.ts` | `apiEndpoints.ts` |

---

## 3. Service Layer Implementation

### Creating a Service File

Every service file follows this structure:

```typescript
// src/services/productServices.ts

import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import type { Product, ProductsResponse } from '@/types/product';

/**
 * Fetches all products with pagination
 * @param page - Page number (1-indexed)
 * @param perPage - Items per page
 * @returns ProductsResponse with items and pagination info
 */
export const fetchProducts = async (
  page: number = 1,
  perPage: number = 12
): Promise<ProductsResponse> => {
  try {
    const response = await fetch(
      `${API_ENDPOINTS.PRODUCTS}?page=${page}&per_page=${perPage}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        next: { revalidate: 3600 }, // ISR: revalidate every hour
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return {
      items: data.products || [],
      totalPages: parseInt(response.headers.get('X-WP-TotalPages') || '1'),
      totalItems: parseInt(response.headers.get('X-WP-Total') || '0'),
    };
  } catch (error) {
    console.error('Error fetching products:', error);
    return {
      items: [],
      totalPages: 0,
      totalItems: 0,
    };
  }
};

/**
 * Fetches a single product by slug
 * @param slug - Product URL slug
 * @returns Product or null if not found
 */
export const fetchProductBySlug = async (
  slug: string
): Promise<Product | null> => {
  try {
    const response = await fetch(
      `${API_ENDPOINTS.PRODUCTS}?slug=${slug}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data[0] || null;
  } catch (error) {
    console.error(`Error fetching product with slug "${slug}":`, error);
    return null;
  }
};
```

### Function Naming Conventions

| Action | Prefix | Example |
|--------|--------|---------|
| Read single | `fetch{Resource}` | `fetchProductBySlug()` |
| Read multiple | `fetch{Resources}` or `fetchAll{Resources}` | `fetchProducts()`, `fetchAllProductSlugs()` |
| Create | `create{Resource}` | `createOrder()` |
| Update | `update{Resource}` | `updateOrderStatus()` |
| Delete | `delete{Resource}` | `deleteCartItem()` |
| Validate | `validate{Resource}` | `validateCoupon()` |
| Sync | `sync{Resource}` | `syncContactToCRM()` |

### TypeScript Interface Patterns

Define response types that match your service return values:

```typescript
// src/types/product.ts

export interface Product {
  id: number;
  name: string;
  slug: string;
  price: string;
  regular_price: string;
  sale_price: string;
  description: string;
  short_description: string;
  images: ProductImage[];
  categories: ProductCategory[];
  attributes: ProductAttribute[];
  variations: number[];
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
}

export interface ProductImage {
  id: number;
  src: string;
  alt: string;
}

export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
}

export interface ProductAttribute {
  id: number;
  name: string;
  options: string[];
}

// Response wrapper for paginated data
export interface ProductsResponse {
  items: Product[];
  totalPages: number;
  totalItems: number;
}
```

### Error Handling Template

**The Golden Rule:** Services should never throw errors that crash the UI. Return safe defaults.

```typescript
export const fetchResource = async (): Promise<ResourceResponse> => {
  try {
    const response = await fetch(API_ENDPOINT);

    if (!response.ok) {
      // Log for debugging, but don't crash
      console.error(`API Error: ${response.status} ${response.statusText}`);
      return { items: [], error: `Failed to fetch: ${response.status}` };
    }

    const data = await response.json();

    // Validate response structure
    if (!data || !Array.isArray(data.items)) {
      console.error('Invalid response structure:', data);
      return { items: [], error: 'Invalid response format' };
    }

    return { items: data.items, error: null };
  } catch (error) {
    // Network errors, JSON parse errors, etc.
    console.error('Service error:', error);
    return { 
      items: [], 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};
```

### Return Type Consistency

Always return the same shape, even on error:

```typescript
// ✅ CORRECT: Consistent return shape
interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export const fetchUser = async (id: string): Promise<ServiceResponse<User>> => {
  try {
    const user = await db.users.findUnique({ where: { id } });
    return { data: user, error: null, success: true };
  } catch (error) {
    return { data: null, error: 'Failed to fetch user', success: false };
  }
};

// ❌ WRONG: Inconsistent returns
export const fetchUser = async (id: string) => {
  try {
    return await db.users.findUnique({ where: { id } }); // Returns User
  } catch (error) {
    throw error; // Throws Error - different shape!
  }
};
```

---

## 4. API Route Patterns

### GET Route Template

```typescript
// src/app/api/products/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { fetchProducts } from '@/services/productServices';

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '12');
    const category = searchParams.get('category') || undefined;

    // Validate parameters
    if (page < 1 || perPage < 1 || perPage > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    // Call service layer
    const result = await fetchProducts(page, perPage, category);

    // Return response with cache headers
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### POST Route Template

```typescript
// src/app/api/orders/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createOrder } from '@/services/orderServices';
import { OrderCreateSchema } from '@/types/order';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate request body (using Zod or manual validation)
    const validation = OrderCreateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    // Call service layer
    const result = await createOrder(validation.data);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Return success response
    return NextResponse.json(
      { order: result.data },
      { status: 201 }
    );
  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Request Validation with Zod

```typescript
// src/types/order.ts

import { z } from 'zod';

export const OrderCreateSchema = z.object({
  customer: z.object({
    email: z.string().email(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    phone: z.string().optional(),
  }),
  billing: z.object({
    address1: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(2).max(2),
    postcode: z.string().min(5),
    country: z.string().default('US'),
  }),
  items: z.array(z.object({
    productId: z.number(),
    quantity: z.number().min(1),
    variationId: z.number().optional(),
  })).min(1),
  paymentMethod: z.enum(['stripe', 'paypal', 'cod']),
});

export type OrderCreateInput = z.infer<typeof OrderCreateSchema>;
```

### Response Formatting Standards

```typescript
// Success responses
{ data: T }                           // Single resource
{ items: T[], total: number }         // Collection with count
{ success: true, message: string }    // Action confirmation

// Error responses
{ error: string }                     // Simple error
{ error: string, code: string }       // Error with code
{ error: string, details: object }    // Validation errors
```

### Caching Headers

```typescript
// Static data (products, categories)
headers: {
  'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
}

// User-specific data (cart, orders)
headers: {
  'Cache-Control': 'private, no-cache, no-store, must-revalidate',
}

// Real-time data (inventory, prices)
headers: {
  'Cache-Control': 'no-store',
}
```

---

## 5. External API Integration

### REST API Pattern

For REST APIs like WooCommerce, payment gateways, or CRM systems:

```typescript
// src/services/externalApiServices.ts

import axios from 'axios';

// Create a configured client for the external API
const apiClient = axios.create({
  baseURL: process.env.EXTERNAL_API_URL,
  auth: {
    username: process.env.EXTERNAL_API_KEY!,
    password: process.env.EXTERNAL_API_SECRET!,
  },
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add response interceptor for consistent error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('External API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });
    return Promise.reject(error);
  }
);

export const fetchExternalResource = async (id: string) => {
  try {
    const response = await apiClient.get(`/resources/${id}`);
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: 'Failed to fetch resource' };
  }
};

export const createExternalResource = async (payload: ResourcePayload) => {
  try {
    const response = await apiClient.post('/resources', payload);
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: 'Failed to create resource' };
  }
};
```

### GraphQL Pattern

For GraphQL APIs like WordPress/WPGraphQL:

```typescript
// src/services/graphqlServices.ts

const GRAPHQL_ENDPOINT = process.env.WORDPRESS_GRAPHQL_URL!;

interface GraphQLResponse<T> {
  data: T;
  errors?: Array<{ message: string }>;
}

export const executeGraphQL = async <T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<{ data: T | null; error: string | null }> => {
  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: GraphQLResponse<T> = await response.json();

    if (result.errors?.length) {
      console.error('GraphQL Errors:', result.errors);
      return { data: null, error: result.errors[0].message };
    }

    return { data: result.data, error: null };
  } catch (error) {
    console.error('GraphQL request failed:', error);
    return { data: null, error: 'GraphQL request failed' };
  }
};

// Usage example
const GET_POSTS_QUERY = `
  query GetPosts($first: Int!, $after: String) {
    posts(first: $first, after: $after) {
      nodes {
        id
        title
        slug
        excerpt
        date
        featuredImage {
          node {
            sourceUrl
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const fetchBlogPosts = async (first: number, after?: string) => {
  const result = await executeGraphQL<{ posts: PostsConnection }>(
    GET_POSTS_QUERY,
    { first, after }
  );

  if (result.error || !result.data) {
    return { items: [], hasNextPage: false, endCursor: null };
  }

  return {
    items: result.data.posts.nodes,
    hasNextPage: result.data.posts.pageInfo.hasNextPage,
    endCursor: result.data.posts.pageInfo.endCursor,
  };
};
```

### Authentication Handling

**Server-side only.** Never expose API keys to the client.

```typescript
// src/constants/apiEndpoints.ts

// Base URL from environment
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// Public endpoints (safe for client)
export const API_ENDPOINTS = {
  PRODUCTS: `${BACKEND_URL}/wp-json/wc/v3/products`,
  CATEGORIES: `${BACKEND_URL}/wp-json/wc/v3/products/categories`,
  GRAPHQL: `${BACKEND_URL}/graphql`,
};

// Server-only credentials (never import in client components)
export const getServerCredentials = () => {
  if (typeof window !== 'undefined') {
    throw new Error('Server credentials accessed on client!');
  }
  
  return {
    wooConsumerKey: process.env.WOOCOM_CONSUMER_KEY!,
    wooConsumerSecret: process.env.WOOCOM_CONSUMER_SECRET!,
    stripeSecretKey: process.env.STRIPE_SECRET_KEY!,
    crmApiKey: process.env.CRM_API_KEY!,
  };
};
```

### Environment Variable Management

```bash
# .env.local

# Public (exposed to browser via NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_BACKEND_URL=https://api.example.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# Private (server-only, no NEXT_PUBLIC_ prefix)
WOOCOM_CONSUMER_KEY=ck_xxx
WOOCOM_CONSUMER_SECRET=cs_xxx
STRIPE_SECRET_KEY=sk_test_xxx
CRM_API_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
```

---

## 6. Supabase Service Pattern

This section documents how to integrate Supabase within the service layer architecture, using the existing `createClient` utilities from this starter kit.

### Client Types Recap

```typescript
// Browser client - for client components
import { createClient } from '@/utils/supabase/client';

// Server client - for server components, API routes, server actions
import { createClient } from '@/utils/supabase/server';
```

### Supabase Service File Structure

```typescript
// src/services/supabaseServices.ts

import { createClient } from '@/utils/supabase/server';
import type { Database } from '@/types/supabase';

type Tables = Database['public']['Tables'];
type Profile = Tables['profiles']['Row'];
type ProfileInsert = Tables['profiles']['Insert'];
type ProfileUpdate = Tables['profiles']['Update'];

/**
 * Fetches a user profile by ID
 * Server-side only - uses server createClient
 */
export const fetchProfile = async (
  userId: string
): Promise<{ data: Profile | null; error: string | null }> => {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Supabase error fetching profile:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Service error:', error);
    return { data: null, error: 'Failed to fetch profile' };
  }
};

/**
 * Updates a user profile
 * Server-side only
 */
export const updateProfile = async (
  userId: string,
  updates: ProfileUpdate
): Promise<{ data: Profile | null; error: string | null }> => {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Supabase error updating profile:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Service error:', error);
    return { data: null, error: 'Failed to update profile' };
  }
};

/**
 * Fetches records with pagination
 * Demonstrates the standard pagination pattern
 */
export const fetchPaginatedRecords = async <T extends keyof Tables>(
  table: T,
  options: {
    page?: number;
    perPage?: number;
    orderBy?: string;
    ascending?: boolean;
    filters?: Record<string, unknown>;
  } = {}
): Promise<{
  data: Tables[T]['Row'][];
  count: number;
  error: string | null;
}> => {
  const { page = 1, perPage = 10, orderBy = 'created_at', ascending = false, filters = {} } = options;
  
  try {
    const supabase = await createClient();
    
    // Calculate range for pagination
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let query = supabase
      .from(table)
      .select('*', { count: 'exact' })
      .order(orderBy, { ascending })
      .range(from, to);

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });

    const { data, count, error } = await query;

    if (error) {
      console.error(`Supabase error fetching ${table}:`, error);
      return { data: [], count: 0, error: error.message };
    }

    return { data: data || [], count: count || 0, error: null };
  } catch (error) {
    console.error('Service error:', error);
    return { data: [], count: 0, error: 'Failed to fetch records' };
  }
};
```

### Client-Side Supabase Service

For operations that need to run in client components (real-time subscriptions, user-triggered actions):

```typescript
// src/services/supabaseClientServices.ts
'use client';

import { createClient } from '@/utils/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Subscribe to real-time changes on a table
 * Client-side only
 */
export const subscribeToTable = (
  table: string,
  callback: (payload: unknown) => void
): RealtimeChannel => {
  const supabase = createClient();
  
  const channel = supabase
    .channel(`${table}_changes`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      callback
    )
    .subscribe();

  return channel;
};

/**
 * Unsubscribe from a channel
 */
export const unsubscribeFromChannel = async (channel: RealtimeChannel) => {
  const supabase = createClient();
  await supabase.removeChannel(channel);
};
```

### Using Supabase Services in API Routes

```typescript
// src/app/api/profiles/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { fetchProfile, updateProfile } from '@/services/supabaseServices';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  const result = await fetchProfile(id);
  
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  
  if (!result.data) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }
  
  return NextResponse.json({ profile: result.data });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  
  const result = await updateProfile(id, body);
  
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  
  return NextResponse.json({ profile: result.data });
}
```

### Using Supabase Services in Server Components

```typescript
// src/app/(public)/profile/page.tsx

import { fetchProfile } from '@/services/supabaseServices';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/auth/login');
  }
  
  const { data: profile, error } = await fetchProfile(user.id);
  
  if (error || !profile) {
    return <div>Error loading profile</div>;
  }
  
  return (
    <div>
      <h1>Welcome, {profile.full_name}</h1>
      {/* Profile content */}
    </div>
  );
}
```

---

## 7. Data Transformation

### Normalizing External Responses

External APIs often return data in formats that don't match your internal types. Transform at the service layer:

```typescript
// src/services/productServices.ts

import type { Product } from '@/types/product';
import type { WooCommerceProduct } from '@/types/api-responses';

/**
 * Transforms WooCommerce product to internal Product type
 */
const normalizeProduct = (wooProduct: WooCommerceProduct): Product => ({
  id: wooProduct.id,
  name: wooProduct.name,
  slug: wooProduct.slug,
  price: parseFloat(wooProduct.price) || 0,
  regularPrice: parseFloat(wooProduct.regular_price) || 0,
  salePrice: wooProduct.sale_price ? parseFloat(wooProduct.sale_price) : null,
  description: wooProduct.description,
  shortDescription: wooProduct.short_description,
  images: wooProduct.images.map((img) => ({
    id: img.id,
    src: img.src,
    alt: img.alt || wooProduct.name,
  })),
  categories: wooProduct.categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
  })),
  inStock: wooProduct.stock_status === 'instock',
  stockQuantity: wooProduct.stock_quantity,
});

export const fetchProducts = async (): Promise<Product[]> => {
  const response = await fetch(API_ENDPOINTS.PRODUCTS);
  const wooProducts: WooCommerceProduct[] = await response.json();
  
  // Transform each product to internal format
  return wooProducts.map(normalizeProduct);
};
```

### Mapping to Internal Types

```typescript
// src/types/api-responses.ts

// External API response (what the API returns)
export interface WooCommerceProduct {
  id: number;
  name: string;
  slug: string;
  price: string;           // WooCommerce returns strings
  regular_price: string;
  sale_price: string;
  description: string;
  short_description: string;
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  stock_quantity: number | null;
  images: Array<{
    id: number;
    src: string;
    alt: string;
  }>;
  categories: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
}

// src/types/product.ts

// Internal type (what your app uses)
export interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;           // Converted to number
  regularPrice: number;
  salePrice: number | null;
  description: string;
  shortDescription: string;
  inStock: boolean;        // Simplified boolean
  stockQuantity: number | null;
  images: ProductImage[];
  categories: ProductCategory[];
}
```

### Pagination Handling

#### Cursor-Based Pagination (GraphQL style)

```typescript
export interface CursorPaginatedResponse<T> {
  items: T[];
  hasNextPage: boolean;
  endCursor: string | null;
}

export const fetchWithCursor = async <T>(
  endpoint: string,
  cursor: string | null,
  limit: number
): Promise<CursorPaginatedResponse<T>> => {
  const params = new URLSearchParams({
    first: limit.toString(),
    ...(cursor && { after: cursor }),
  });

  const response = await fetch(`${endpoint}?${params}`);
  const data = await response.json();

  return {
    items: data.nodes,
    hasNextPage: data.pageInfo.hasNextPage,
    endCursor: data.pageInfo.endCursor,
  };
};
```

#### Page-Number Pagination (REST style)

```typescript
export interface PagedResponse<T> {
  items: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export const fetchWithPagination = async <T>(
  endpoint: string,
  page: number,
  perPage: number
): Promise<PagedResponse<T>> => {
  const response = await fetch(
    `${endpoint}?page=${page}&per_page=${perPage}`
  );

  const items: T[] = await response.json();
  
  return {
    items,
    currentPage: page,
    totalPages: parseInt(response.headers.get('X-WP-TotalPages') || '1'),
    totalItems: parseInt(response.headers.get('X-WP-Total') || '0'),
  };
};
```

---

## 8. Error Handling Strategy

### Client-Side Error Boundaries

```typescript
// src/components/common/ErrorBoundary.tsx
'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Send to error tracking service (Sentry, etc.)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-destructive/10 rounded-md">
          <h2 className="text-lg font-semibold text-destructive">
            Something went wrong
          </h2>
          <p className="text-sm text-muted-foreground">
            Please try refreshing the page.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Server-Side Error Logging

```typescript
// src/lib/logger.ts

type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

export const logger = {
  info: (message: string, context?: Record<string, unknown>) => {
    log('info', message, context);
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    log('warn', message, context);
  },
  error: (message: string, context?: Record<string, unknown>) => {
    log('error', message, context);
  },
};

const log = (level: LogLevel, message: string, context?: Record<string, unknown>) => {
  const entry: LogEntry = {
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
  };

  if (process.env.NODE_ENV === 'development') {
    console[level](JSON.stringify(entry, null, 2));
  } else {
    // In production, send to logging service
    console[level](JSON.stringify(entry));
  }
};
```

### Graceful Degradation Pattern

```typescript
// src/app/(public)/shop/page.tsx

import { fetchProducts } from '@/services/productServices';
import { ProductList } from '@/components/shop/ProductList';
import { EmptyState } from '@/components/common/EmptyState';

export default async function ShopPage() {
  const { items: products, error } = await fetchProducts();

  // Graceful degradation: show empty state instead of crashing
  if (error || products.length === 0) {
    return (
      <EmptyState
        title="No products available"
        description="Please check back later or try refreshing the page."
        action={{
          label: 'Refresh',
          href: '/shop',
        }}
      />
    );
  }

  return <ProductList products={products} />;
}
```

### User-Friendly Error Messages

```typescript
// src/lib/errorMessages.ts

export const ERROR_MESSAGES = {
  // Network errors
  NETWORK_ERROR: 'Unable to connect. Please check your internet connection.',
  TIMEOUT: 'The request took too long. Please try again.',
  
  // Auth errors
  UNAUTHORIZED: 'Please log in to continue.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  
  // Validation errors
  INVALID_INPUT: 'Please check your input and try again.',
  REQUIRED_FIELD: 'This field is required.',
  
  // Resource errors
  NOT_FOUND: 'The requested item could not be found.',
  ALREADY_EXISTS: 'This item already exists.',
  
  // Payment errors
  PAYMENT_FAILED: 'Payment could not be processed. Please try again.',
  CARD_DECLINED: 'Your card was declined. Please use a different payment method.',
  
  // Generic
  UNKNOWN: 'Something went wrong. Please try again later.',
} as const;

export const getErrorMessage = (code: string): string => {
  return ERROR_MESSAGES[code as keyof typeof ERROR_MESSAGES] || ERROR_MESSAGES.UNKNOWN;
};
```

---

## 9. Performance Patterns

### ISR and Revalidation

```typescript
// Static generation with revalidation
export const fetchProducts = async () => {
  const response = await fetch(API_ENDPOINT, {
    next: { 
      revalidate: 3600, // Revalidate every hour
    },
  });
  return response.json();
};

// On-demand revalidation (for admin updates)
// src/app/api/revalidate/route.ts
import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { path, tag, secret } = await request.json();

  // Verify secret
  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  if (path) {
    revalidatePath(path);
  }
  
  if (tag) {
    revalidateTag(tag);
  }

  return NextResponse.json({ revalidated: true });
}
```

### Response Caching

```typescript
// Tag-based caching for granular invalidation
export const fetchProduct = async (slug: string) => {
  const response = await fetch(`${API_ENDPOINT}/${slug}`, {
    next: { 
      tags: ['products', `product-${slug}`],
      revalidate: 3600,
    },
  });
  return response.json();
};

// Invalidate specific product
revalidateTag(`product-${slug}`);

// Invalidate all products
revalidateTag('products');
```

### Selective Field Fetching

```typescript
// GraphQL: Only request needed fields
const MINIMAL_PRODUCT_QUERY = `
  query GetProducts {
    products {
      id
      name
      slug
      price
      images(first: 1) {
        src
      }
    }
  }
`;

// REST: Use _fields parameter if supported
const response = await fetch(
  `${API_ENDPOINT}/products?_fields=id,name,slug,price,images`
);
```

### Batch Operations

```typescript
// Batch multiple IDs into single request
export const fetchProductsByIds = async (ids: number[]): Promise<Product[]> => {
  if (ids.length === 0) return [];
  
  // WooCommerce supports include parameter
  const response = await fetch(
    `${API_ENDPOINT}/products?include=${ids.join(',')}`
  );
  
  return response.json();
};

// Parallel fetching for independent data
export const fetchPageData = async (slug: string) => {
  const [product, relatedProducts, reviews] = await Promise.all([
    fetchProductBySlug(slug),
    fetchRelatedProducts(slug),
    fetchProductReviews(slug),
  ]);

  return { product, relatedProducts, reviews };
};
```

---

## 10. Quick Reference

### Service Function Template

```typescript
// src/services/{domain}Services.ts

import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import type { Resource, ResourceResponse } from '@/types/{domain}';

/**
 * [Description of what this function does]
 * @param param1 - [Description]
 * @returns [Description of return value]
 */
export const fetchResource = async (
  param1: string
): Promise<ResourceResponse> => {
  try {
    const response = await fetch(`${API_ENDPOINTS.RESOURCE}/${param1}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    console.error('fetchResource error:', error);
    return { data: null, error: 'Failed to fetch resource' };
  }
};
```

### API Route Template

```typescript
// src/app/api/{resource}/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { fetchResource } from '@/services/{domain}Services';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const param = searchParams.get('param');

    if (!param) {
      return NextResponse.json(
        { error: 'Missing required parameter' },
        { status: 400 }
      );
    }

    const result = await fetchResource(param);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate body...

    const result = await createResource(body);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { data: result.data },
      { status: 201 }
    );
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Common Patterns Cheat Sheet

| Pattern | When to Use | Example |
|---------|-------------|---------|
| Service Layer | All external API calls | `fetchProducts()` |
| API Route Proxy | Protecting credentials | `/api/create-payment-intent` |
| ISR | Static data that changes occasionally | Products, blog posts |
| No-cache | User-specific or real-time data | Cart, inventory |
| Graceful Degradation | Any data fetch | Return empty array on error |
| Type Transformation | External API responses | `normalizeProduct()` |
| Batch Fetching | Multiple independent calls | `Promise.all([...])` |
| Cursor Pagination | GraphQL, infinite scroll | `after: endCursor` |
| Page Pagination | REST APIs, numbered pages | `page=2&per_page=12` |

---

## 11. Webhook Integration Patterns

Webhooks allow external systems to push data to your application in real-time.

### Webhook Endpoint Structure

```typescript
// src/app/api/webhooks/[provider]/route.ts

import { NextRequest, NextResponse } from 'next/server';

interface WebhookPayload {
  type: string;
  data: unknown;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Parse payload
    const payload: WebhookPayload = await request.json();

    // 2. Validate webhook (signature, required fields)
    const isValid = await validateWebhook(request, payload);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid webhook' }, { status: 401 });
    }

    // 3. Extract relevant data
    const extractedData = extractWebhookData(payload);
    if (!extractedData) {
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
    }

    // 4. Process webhook (main business logic)
    const result = await processWebhook(extractedData);

    // 5. Trigger async follow-up (non-blocking)
    triggerAsyncFollowUp(extractedData);

    // 6. Return success quickly (external systems expect fast responses)
    return NextResponse.json({
      message: 'Webhook processed successfully',
      ...result,
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
```

### Data Extraction Pattern

```typescript
// src/app/api/webhooks/crm/dataExtraction.ts

export interface ExtractedWebhookData {
  orderId: string;
  contactId: string;
  productId: string;
}

export function extractWebhookData(payload: any): ExtractedWebhookData | null {
  try {
    const orderId = payload.order?._id;
    const contactId = payload.order?.contactId;
    const productId = payload.order?.items?.[0]?.product?._id;

    // Validate required fields
    if (!orderId || !contactId || !productId) {
      console.warn('Missing required webhook fields:', { orderId, contactId, productId });
      return null;
    }

    return { orderId, contactId, productId };
  } catch (error) {
    console.error('Error extracting webhook data:', error);
    return null;
  }
}
```

### Webhook Security

```typescript
// Signature verification
const validateWebhook = async (
  request: NextRequest,
  payload: unknown
): Promise<boolean> => {
  // Option 1: Webhook secret header
  const webhookSecret = request.headers.get('x-webhook-secret');
  if (webhookSecret !== process.env.WEBHOOK_SECRET) {
    return false;
  }

  // Option 2: HMAC signature (more secure)
  const signature = request.headers.get('x-signature');
  const body = JSON.stringify(payload);
  const expectedSignature = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET!)
    .update(body)
    .digest('hex');

  return signature === expectedSignature;
};
```

### Async Follow-Up Pattern (Fire-and-Forget)

```typescript
// Non-blocking background task
const triggerAsyncFollowUp = (data: ExtractedWebhookData) => {
  // Fire and forget - don't await
  fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/internal/sync-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId: data.orderId }),
  })
    .then((res) => res.json())
    .then((result) => console.log('Async sync completed:', result))
    .catch((error) => console.error('Async sync failed:', error));
};
```

### Idempotency for Webhooks

External systems may retry webhooks. Handle duplicates:

```typescript
export async function POST(request: NextRequest) {
  const payload = await request.json();
  const webhookId = payload.webhookId || payload.order?._id;

  // Check if already processed
  const { data: existing } = await supabase
    .from('processed_webhooks')
    .select('id')
    .eq('webhook_id', webhookId)
    .single();

  if (existing) {
    return NextResponse.json({ message: 'Already processed' });
  }

  // Process webhook...

  // Mark as processed
  await supabase.from('processed_webhooks').insert({ webhook_id: webhookId });

  return NextResponse.json({ message: 'Processed' });
}
```

---

## 12. CRM Integration Patterns

### CRM Service Layer

```typescript
// src/services/crmServices.ts

const CRM_BASE_URL = 'https://services.leadconnectorhq.com';
const CRM_TOKEN = process.env.CRM_ACCESS_TOKEN;
const LOCATION_ID = process.env.CRM_LOCATION_ID;

const crmHeaders = {
  'Authorization': `Bearer ${CRM_TOKEN}`,
  'Content-Type': 'application/json',
  'Version': '2021-07-28',
};

// Fetch all contacts
export const fetchCRMContacts = async (): Promise<Contact[]> => {
  const response = await fetch(
    `${CRM_BASE_URL}/contacts/?locationId=${LOCATION_ID}`,
    { headers: crmHeaders }
  );

  if (!response.ok) {
    throw new Error(`CRM API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.contacts;
};

// Get single contact
export const fetchCRMContact = async (contactId: string): Promise<Contact> => {
  const response = await fetch(
    `${CRM_BASE_URL}/contacts/${contactId}`,
    { headers: crmHeaders }
  );

  if (!response.ok) {
    throw new Error(`CRM API error: ${response.statusText}`);
  }

  return response.json();
};

// Update contact with custom field
export const updateCRMContactField = async (
  contactId: string,
  fieldId: string,
  value: string
): Promise<void> => {
  const response = await fetch(
    `${CRM_BASE_URL}/contacts/${contactId}`,
    {
      method: 'PUT',
      headers: crmHeaders,
      body: JSON.stringify({
        customFields: [{ id: fieldId, value }],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to update CRM contact: ${response.statusText}`);
  }
};
```

### Field Mapping Table Pattern

Map external product IDs to CRM field IDs:

```typescript
// Get field mapping from database
export const getFieldMapping = async (productId: string) => {
  const { data, error } = await supabase
    .from('crm_field_mappings')
    .select('field_id, field_name')
    .eq('product_id', productId)
    .single();

  if (error || !data) {
    throw new Error(`No field mapping found for product: ${productId}`);
  }

  return data;
};

// Usage in webhook processing
const processOrderWebhook = async (data: ExtractedWebhookData) => {
  // 1. Get field mapping for this product
  const fieldMapping = await getFieldMapping(data.productId);

  // 2. Generate asset (QR code, PDF, etc.)
  const assetUrl = await generateAsset(data.orderId);

  // 3. Update CRM contact with asset
  await updateCRMContactField(
    data.contactId,
    fieldMapping.field_id,
    assetUrl
  );
};
```

---

## 13. Data Synchronization Patterns

### Manual Sync with Progress Tracking

```typescript
// src/app/api/sync/route.ts

import { NextResponse } from 'next/server';

export async function GET() {
  const io = globalThis.io; // Socket.IO instance (if available)

  try {
    // 1. Get list of items to sync
    const itemIds = await fetchItemsToSync();
    const totalItems = itemIds.length;

    // 2. Emit initial status
    if (io) {
      io.emit('sync_status', {
        syncInProgress: true,
        totalItems,
        syncedItems: 0,
        status: 'Starting',
      });
    }

    // 3. Process each item
    let syncedItems = 0;
    for (const itemId of itemIds) {
      await syncSingleItem(itemId);
      syncedItems++;

      // 4. Emit progress
      if (io) {
        io.emit('sync_progress', {
          syncInProgress: true,
          totalItems,
          syncedItems,
          status: 'Syncing',
        });
      }
    }

    // 5. Emit completion
    if (io) {
      io.emit('sync_complete', { message: 'Sync completed!' });
    }

    return NextResponse.json({ message: 'Sync completed', syncedItems });
  } catch (error) {
    if (io) {
      io.emit('sync_status', { syncInProgress: false, status: 'Error' });
    }
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
```

### Upsert Pattern for Sync

```typescript
// Sync external data to local database
const syncSingleItem = async (externalId: string) => {
  // 1. Fetch from external API
  const externalData = await fetchExternalItemDetails(externalId);

  // 2. Transform to local schema
  const localData = transformExternalData(externalData);

  // 3. Upsert to database
  const { error } = await supabase
    .from('items')
    .upsert(localData, { onConflict: 'external_id' });

  if (error) {
    throw new Error(`Failed to sync item ${externalId}: ${error.message}`);
  }
};

// Transform external API response to local schema
const transformExternalData = (external: ExternalItem): LocalItem => ({
  external_id: external._id,
  name: external.name,
  email: external.contactSnapshot?.email,
  total: external.amount?.total,
  status: external.status,
  metadata: external.customFields, // Store extras in JSONB
  synced_at: new Date().toISOString(),
});
```

### Client-Side Sync Monitoring

```typescript
// src/components/admin/SyncButton.tsx
'use client';

import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface SyncStatus {
  syncInProgress: boolean;
  totalItems: number;
  syncedItems: number;
  status: string;
}

export const SyncButton = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);

  useEffect(() => {
    const socketInstance = io();
    setSocket(socketInstance);

    socketInstance.on('sync_status', setSyncStatus);
    socketInstance.on('sync_progress', setSyncStatus);
    socketInstance.on('sync_complete', () => {
      setSyncStatus(null);
      // Refresh data
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const triggerSync = async () => {
    await fetch('/api/sync');
  };

  const progress = syncStatus
    ? (syncStatus.syncedItems / syncStatus.totalItems) * 100
    : 0;

  return (
    <div className="space-y-2">
      <Button
        onClick={triggerSync}
        disabled={syncStatus?.syncInProgress}
      >
        {syncStatus?.syncInProgress ? 'Syncing...' : 'Start Sync'}
      </Button>

      {syncStatus && (
        <div className="space-y-1">
          <Progress value={progress} />
          <p className="text-sm text-muted-foreground">
            {syncStatus.syncedItems} / {syncStatus.totalItems} items
          </p>
        </div>
      )}
    </div>
  );
};
```

---

## 10. Quick Reference

### API Route Template

```typescript
// src/app/api/[resource]/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const result = await fetchResource();

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate body...

    const result = await createResource(body);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { data: result.data },
      { status: 201 }
    );
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Common Patterns Cheat Sheet

| Pattern | When to Use | Example |
|---------|-------------|---------|
| Service Layer | All external API calls | `fetchProducts()` |
| API Route Proxy | Protecting credentials | `/api/create-payment-intent` |
| ISR | Static data that changes occasionally | Products, blog posts |
| No-cache | User-specific or real-time data | Cart, inventory |
| Graceful Degradation | Any data fetch | Return empty array on error |
| Type Transformation | External API responses | `normalizeProduct()` |
| Batch Fetching | Multiple independent calls | `Promise.all([...])` |
| Cursor Pagination | GraphQL, infinite scroll | `after: endCursor` |
| Page Pagination | REST APIs, numbered pages | `page=2&per_page=12` |
| Webhook Endpoint | Receiving external events | `/api/webhooks/stripe` |
| Field Mapping | External system integration | `crm_field_mappings` table |
| Upsert Sync | Data synchronization | `onConflict: 'external_id'` |
| Fire-and-Forget | Non-blocking async tasks | Background sync after webhook |

---

*This manual is part of the Stark Industries Software Factory documentation suite.*
