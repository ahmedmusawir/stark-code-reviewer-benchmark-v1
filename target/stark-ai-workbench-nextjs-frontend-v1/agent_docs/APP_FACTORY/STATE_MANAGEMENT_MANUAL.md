# STATE MANAGEMENT MANUAL

> **Stark Industries Software Factory**  
> *The definitive guide to managing client-side state with Zustand in Next.js applications.*

---

## Table of Contents

1. [Philosophy & Strategy](#1-philosophy--strategy)
2. [Store Architecture](#2-store-architecture)
3. [Core Patterns](#3-core-patterns)
4. [Persistence](#4-persistence)
5. [Hydration & SSR](#5-hydration--ssr)
6. [Store Templates](#6-store-templates)
7. [Integration Patterns](#7-integration-patterns)
8. [Common Stores Reference](#8-common-stores-reference)
9. [Best Practices Checklist](#9-best-practices-checklist)

---

## 1. Philosophy & Strategy

### The Three-Layer State Model

In a Next.js application, state exists in three distinct layers. Understanding when to use each is critical for performance and maintainability.

```
┌─────────────────────────────────────────────────────────────────┐
│                     LOCAL UI STATE                              │
│   useState, useReducer                                          │
│   Scope: Single component                                       │
│   Examples: Form inputs, toggles, modal open/close              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   GLOBAL CLIENT STATE                           │
│   Zustand stores                                                │
│   Scope: Entire client-side application                         │
│   Examples: Cart, checkout data, user preferences, auth state   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SERVER STATE                               │
│   Database, external APIs (fetched via Service Layer)           │
│   Scope: Backend systems                                        │
│   Examples: Products, orders, user profiles, CRM data           │
└─────────────────────────────────────────────────────────────────┘
```

### When to Use Zustand vs useState vs Server State

| Scenario | Solution | Why |
|----------|----------|-----|
| Form input value | `useState` | Local to one component, no sharing needed |
| Modal open/close | `useState` | UI state, doesn't need persistence |
| Shopping cart | Zustand + persist | Shared across pages, needs persistence |
| Checkout form data | Zustand | Shared across checkout steps |
| User auth state | Zustand | Needed globally for route protection |
| Product list | Server State (ISR) | Comes from database, rarely changes |
| User profile | Server State | Fetched from Supabase, RLS protected |
| Real-time notifications | Zustand + Supabase Realtime | Hybrid: server pushes, client stores |

### Why Zustand

We chose Zustand over Redux, Jotai, or Context API for these reasons:

1. **Minimal Boilerplate**: No providers, reducers, or action creators
2. **Small Bundle**: ~1KB gzipped
3. **TypeScript-First**: Excellent type inference
4. **Selector Pattern**: Built-in support for preventing re-renders
5. **Middleware Support**: Persistence, devtools, immer out of the box
6. **No Context Hell**: Works outside React components (services, utilities)
7. **SSR Compatible**: Works with Next.js App Router

```typescript
// Redux: ~50 lines for a simple counter
// Zustand: 10 lines
import { create } from 'zustand';

interface CounterStore {
  count: number;
  increment: () => void;
  decrement: () => void;
}

export const useCounterStore = create<CounterStore>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}));
```

---

## 2. Store Architecture

### Domain-Oriented Store Design

Organize stores by business domain, not by technical function. Each store owns a specific slice of your application's state.

```
src/store/
├── useAuthStore.ts           # Authentication state
├── useCartStore.ts           # Shopping cart
├── useCheckoutStore.ts       # Checkout flow data
├── useProductStore.ts        # Product cache/filters
├── usePaginationStore.ts     # Cursor-based pagination
├── useUIStore.ts             # UI state (modals, sidebars)
└── index.ts                  # Re-exports all stores
```

### Store File Structure

Every store file follows this structure:

```typescript
// src/store/useExampleStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// 1. Define the state interface
interface ExampleState {
  // State properties
  items: Item[];
  selectedId: string | null;
  isLoading: boolean;
  
  // Actions
  addItem: (item: Item) => void;
  removeItem: (id: string) => void;
  selectItem: (id: string) => void;
  clearSelection: () => void;
  reset: () => void;
}

// 2. Define initial state (for reset functionality)
const initialState = {
  items: [],
  selectedId: null,
  isLoading: false,
};

// 3. Create the store
export const useExampleStore = create<ExampleState>()(
  persist(
    (set, get) => ({
      // Spread initial state
      ...initialState,

      // Actions
      addItem: (item) =>
        set((state) => ({
          items: [...state.items, item],
        })),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),

      selectItem: (id) =>
        set({ selectedId: id }),

      clearSelection: () =>
        set({ selectedId: null }),

      reset: () =>
        set(initialState),
    }),
    {
      name: 'example-storage', // localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist these fields
        items: state.items,
      }),
    }
  )
);

// 4. Export selectors for optimized subscriptions
export const selectItems = (state: ExampleState) => state.items;
export const selectSelectedId = (state: ExampleState) => state.selectedId;
export const selectIsLoading = (state: ExampleState) => state.isLoading;
```

### State Shape Best Practices

```typescript
// ✅ GOOD: Flat, normalized state
interface CartState {
  items: CartItem[];           // Array of items
  couponCode: string | null;   // Simple value
  shippingMethodId: string;    // Reference ID, not nested object
}

// ❌ BAD: Deeply nested state
interface CartState {
  cart: {
    items: {
      products: CartItem[];
      metadata: {
        lastUpdated: string;
        version: number;
      };
    };
  };
}
```

### Action Naming Conventions

| Action Type | Prefix | Example |
|-------------|--------|---------|
| Add/Create | `add`, `create` | `addItem`, `createOrder` |
| Remove/Delete | `remove`, `delete` | `removeItem`, `deleteAddress` |
| Update/Set | `update`, `set` | `updateQuantity`, `setShippingMethod` |
| Toggle | `toggle` | `toggleSidebar`, `toggleDarkMode` |
| Clear/Reset | `clear`, `reset` | `clearCart`, `resetCheckout` |
| Fetch/Load | `fetch`, `load` | `fetchProducts`, `loadMore` |

---

## 3. Core Patterns

### Selector Pattern (Minimize Re-renders)

**This is the most important pattern in this manual.**

When you subscribe to a Zustand store, your component re-renders whenever *any* part of the store changes. Selectors let you subscribe to *only* the data you need.

```typescript
// ❌ BAD: Component re-renders on ANY store change
const Component = () => {
  const store = useCartStore(); // Subscribes to entire store
  return <div>{store.items.length} items</div>;
};

// ✅ GOOD: Component only re-renders when items change
const Component = () => {
  const items = useCartStore((state) => state.items);
  return <div>{items.length} items</div>;
};

// ✅ EVEN BETTER: Derived value with shallow comparison
import { shallow } from 'zustand/shallow';

const Component = () => {
  const itemCount = useCartStore((state) => state.items.length);
  return <div>{itemCount} items</div>;
};
```

#### Selector Examples

```typescript
// src/store/useCartStore.ts

// Basic selectors (export these from your store file)
export const selectCartItems = (state: CartState) => state.items;
export const selectCouponCode = (state: CartState) => state.couponCode;
export const selectShippingMethodId = (state: CartState) => state.shippingMethodId;

// Derived selectors (computed values)
export const selectCartItemCount = (state: CartState) => state.items.length;
export const selectCartSubtotal = (state: CartState) =>
  state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
export const selectHasItems = (state: CartState) => state.items.length > 0;

// Usage in components
const CartIcon = () => {
  const itemCount = useCartStore(selectCartItemCount);
  return <Badge count={itemCount} />;
};

const CartTotal = () => {
  const subtotal = useCartStore(selectCartSubtotal);
  return <span>${subtotal.toFixed(2)}</span>;
};
```

#### Multiple Selectors with Shallow Comparison

When you need multiple values, use `shallow` to prevent unnecessary re-renders:

```typescript
import { shallow } from 'zustand/shallow';

const CheckoutSummary = () => {
  // Only re-renders if items OR couponCode changes
  const { items, couponCode } = useCartStore(
    (state) => ({
      items: state.items,
      couponCode: state.couponCode,
    }),
    shallow
  );

  return (
    <div>
      <ItemList items={items} />
      {couponCode && <CouponBadge code={couponCode} />}
    </div>
  );
};
```

### Derived State Pattern (Computed Values)

**Never store computed values.** Calculate them from base state.

```typescript
// ❌ BAD: Storing computed values
interface CartState {
  items: CartItem[];
  subtotal: number;      // Computed - don't store!
  itemCount: number;     // Computed - don't store!
}

// ✅ GOOD: Compute in selectors or utility functions
interface CartState {
  items: CartItem[];
}

// Selector for derived value
export const selectSubtotal = (state: CartState) =>
  state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

// Or utility function for complex calculations
export const calculateCartTotals = (items: CartItem[], coupon?: Coupon) => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = coupon ? calculateDiscount(subtotal, coupon) : 0;
  const shipping = calculateShipping(items);
  const tax = (subtotal - discount) * 0.08;
  const total = subtotal - discount + shipping + tax;

  return { subtotal, discount, shipping, tax, total };
};
```

### Composite Key Pattern (Complex Identifiers)

For items that can have variations (size, color, custom options), use composite keys:

```typescript
interface CartItem {
  id: string;              // Composite key
  productId: number;
  variationId?: number;
  customFields?: Record<string, string>;
  quantity: number;
  price: number;
  name: string;
}

// Generate composite key
const generateCartItemId = (
  productId: number,
  variationId?: number,
  customFields?: Record<string, string>
): string => {
  const base = `${productId}`;
  const variation = variationId ? `-${variationId}` : '';
  const custom = customFields ? `-${JSON.stringify(customFields)}` : '';
  return `${base}${variation}${custom}`;
};

// Usage in addItem action
addItem: (product, variationId, customFields) => {
  const id = generateCartItemId(product.id, variationId, customFields);
  
  set((state) => {
    const existingIndex = state.items.findIndex((item) => item.id === id);
    
    if (existingIndex >= 0) {
      // Update quantity of existing item
      const newItems = [...state.items];
      newItems[existingIndex].quantity += 1;
      return { items: newItems };
    }
    
    // Add new item
    return {
      items: [
        ...state.items,
        {
          id,
          productId: product.id,
          variationId,
          customFields,
          quantity: 1,
          price: product.price,
          name: product.name,
        },
      ],
    };
  });
};
```

### Immutable Update Pattern

Zustand uses immer under the hood when you use the `immer` middleware, but by default, you must update state immutably:

```typescript
// ✅ CORRECT: Immutable updates
updateQuantity: (id, quantity) =>
  set((state) => ({
    items: state.items.map((item) =>
      item.id === id ? { ...item, quantity } : item
    ),
  })),

removeItem: (id) =>
  set((state) => ({
    items: state.items.filter((item) => item.id !== id),
  })),

// ❌ WRONG: Mutating state directly
updateQuantity: (id, quantity) =>
  set((state) => {
    const item = state.items.find((i) => i.id === id);
    if (item) item.quantity = quantity; // MUTATION!
    return state;
  }),
```

#### Using Immer Middleware (Optional)

If you prefer mutable-style updates:

```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export const useCartStore = create<CartState>()(
  immer((set) => ({
    items: [],

    // Now you can "mutate" directly (immer handles immutability)
    updateQuantity: (id, quantity) =>
      set((state) => {
        const item = state.items.find((i) => i.id === id);
        if (item) item.quantity = quantity; // OK with immer!
      }),
  }))
);
```

---

## 4. Persistence

### The `persist` Middleware

Zustand's `persist` middleware automatically saves state to storage and rehydrates on page load.

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => set((state) => ({ items: [...state.items, item] })),
    }),
    {
      name: 'cart-storage',                              // localStorage key
      storage: createJSONStorage(() => localStorage),   // Storage engine
    }
  )
);
```

### `partialize` - What to Persist

**Never persist everything.** Use `partialize` to select only UX-critical state:

```typescript
export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set) => ({
      // Persisted
      billingAddress: null,
      shippingAddress: null,
      
      // NOT persisted (transient)
      isProcessing: false,
      validationErrors: {},
      paymentIntent: null,
    }),
    {
      name: 'checkout-storage',
      partialize: (state) => ({
        // Only persist addresses (user convenience)
        billingAddress: state.billingAddress,
        shippingAddress: state.shippingAddress,
        // DO NOT persist: isProcessing, validationErrors, paymentIntent
      }),
    }
  )
);
```

#### What to Persist vs What NOT to Persist

| Persist ✅ | Don't Persist ❌ |
|-----------|-----------------|
| Cart items | Loading states |
| User preferences | Validation errors |
| Form drafts | API responses |
| Selected filters | Temporary UI state |
| Theme preference | Payment intents |
| Recently viewed | Session tokens |

### localStorage vs IndexedDB Decision

| Storage | Use When | Limit |
|---------|----------|-------|
| localStorage | Small data (<5MB), simple values | ~5MB |
| IndexedDB (localforage) | Large data, complex objects, offline-first | ~50MB+ |

```typescript
// For large data, use localforage (IndexedDB wrapper)
import localforage from 'localforage';
import { createJSONStorage } from 'zustand/middleware';

// Configure localforage
localforage.config({
  name: 'stark-app',
  storeName: 'app_state',
});

// Custom storage adapter
const indexedDBStorage = createJSONStorage(() => ({
  getItem: async (name) => {
    const value = await localforage.getItem(name);
    return value as string | null;
  },
  setItem: async (name, value) => {
    await localforage.setItem(name, value);
  },
  removeItem: async (name) => {
    await localforage.removeItem(name);
  },
}));

export const useProductCacheStore = create<ProductCacheState>()(
  persist(
    (set) => ({
      products: [],
      // ... actions
    }),
    {
      name: 'product-cache',
      storage: indexedDBStorage,
    }
  )
);
```

### Storage Size Considerations

```typescript
// Utility to check storage usage
export const getStorageUsage = () => {
  let total = 0;
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length * 2; // UTF-16 = 2 bytes per char
    }
  }
  return {
    bytes: total,
    kb: (total / 1024).toFixed(2),
    mb: (total / (1024 * 1024)).toFixed(2),
  };
};

// Clear old/stale data periodically
export const cleanupStorage = () => {
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
  const now = Date.now();

  // Check each persisted store for staleness
  const cartData = localStorage.getItem('cart-storage');
  if (cartData) {
    const parsed = JSON.parse(cartData);
    if (parsed.state?.lastUpdated && now - parsed.state.lastUpdated > maxAge) {
      localStorage.removeItem('cart-storage');
    }
  }
};
```

---

## 5. Hydration & SSR

### The Hydration Problem

In Next.js with SSR, the server renders HTML without access to localStorage. When the client hydrates, there's a mismatch between server-rendered content and client state.

```
Server Render: Cart shows 0 items (no localStorage on server)
Client Hydrate: Cart shows 3 items (localStorage has data)
Result: Hydration mismatch error!
```

### Hydration Flags

Use a hydration flag to gate UI that depends on persisted state:

```typescript
// src/store/useCartStore.ts

interface CartState {
  items: CartItem[];
  hasHydrated: boolean;  // Hydration flag
  setHasHydrated: (value: boolean) => void;
  // ... other state
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      hasHydrated: false,

      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'cart-storage',
      onRehydrateStorage: () => (state) => {
        // Called when rehydration completes
        state?.setHasHydrated(true);
      },
    }
  )
);

// Selector for hydration state
export const selectHasHydrated = (state: CartState) => state.hasHydrated;
```

### `onRehydrateStorage` Callback

This callback fires when the store finishes loading from storage:

```typescript
persist(
  (set) => ({ /* ... */ }),
  {
    name: 'cart-storage',
    onRehydrateStorage: () => {
      console.log('Hydration starting...');
      
      return (state, error) => {
        if (error) {
          console.error('Hydration failed:', error);
        } else {
          console.log('Hydration complete:', state);
          state?.setHasHydrated(true);
        }
      };
    },
  }
)
```

### Gating UI on Hydration State

```typescript
// src/components/cart/CartIcon.tsx
'use client';

import { useCartStore, selectHasHydrated, selectCartItemCount } from '@/store/useCartStore';
import { Skeleton } from '@/components/ui/skeleton';

export const CartIcon = () => {
  const hasHydrated = useCartStore(selectHasHydrated);
  const itemCount = useCartStore(selectCartItemCount);

  // Show skeleton until hydrated to prevent flash
  if (!hasHydrated) {
    return <Skeleton className="h-6 w-6 rounded-full" />;
  }

  return (
    <div className="relative">
      <ShoppingCartIcon />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {itemCount}
        </span>
      )}
    </div>
  );
};
```

### Alternative: Suspense-Style Loading

```typescript
// Custom hook that throws promise until hydrated
export const useHydratedStore = <T,>(
  store: UseBoundStore<StoreApi<T & { hasHydrated: boolean }>>,
  selector: (state: T) => unknown
) => {
  const hasHydrated = store((state) => state.hasHydrated);
  
  if (!hasHydrated) {
    // Return null or default during SSR
    return null;
  }
  
  return store(selector as (state: T & { hasHydrated: boolean }) => unknown);
};
```

---

## 6. Store Templates

### Basic Store Template

```typescript
// src/store/useBasicStore.ts

import { create } from 'zustand';

interface BasicState {
  value: string;
  setValue: (value: string) => void;
  reset: () => void;
}

const initialState = {
  value: '',
};

export const useBasicStore = create<BasicState>((set) => ({
  ...initialState,
  setValue: (value) => set({ value }),
  reset: () => set(initialState),
}));

// Selectors
export const selectValue = (state: BasicState) => state.value;
```

### Persisted Store Template

```typescript
// src/store/usePersistedStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface PersistedState {
  // Persisted state
  items: Item[];
  preferences: UserPreferences;
  
  // Transient state (not persisted)
  isLoading: boolean;
  error: string | null;
  hasHydrated: boolean;
  
  // Actions
  addItem: (item: Item) => void;
  removeItem: (id: string) => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHasHydrated: (value: boolean) => void;
  reset: () => void;
}

const initialState = {
  items: [],
  preferences: { theme: 'light', notifications: true },
  isLoading: false,
  error: null,
  hasHydrated: false,
};

export const usePersistedStore = create<PersistedState>()(
  persist(
    (set) => ({
      ...initialState,

      addItem: (item) =>
        set((state) => ({ items: [...state.items, item] })),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),

      updatePreferences: (prefs) =>
        set((state) => ({
          preferences: { ...state.preferences, ...prefs },
        })),

      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      reset: () => set(initialState),
    }),
    {
      name: 'persisted-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        preferences: state.preferences,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// Selectors
export const selectItems = (state: PersistedState) => state.items;
export const selectPreferences = (state: PersistedState) => state.preferences;
export const selectIsLoading = (state: PersistedState) => state.isLoading;
export const selectError = (state: PersistedState) => state.error;
export const selectHasHydrated = (state: PersistedState) => state.hasHydrated;
```

### Pagination Store Template

```typescript
// src/store/usePaginationStore.ts

import { create } from 'zustand';

// Cursor-based pagination (GraphQL style)
interface CursorPaginationState {
  endCursor: string | null;
  hasNextPage: boolean;
  isLoadingMore: boolean;
  
  setEndCursor: (cursor: string | null) => void;
  setHasNextPage: (hasNext: boolean) => void;
  setIsLoadingMore: (loading: boolean) => void;
  reset: () => void;
}

export const useCursorPaginationStore = create<CursorPaginationState>((set) => ({
  endCursor: null,
  hasNextPage: true,
  isLoadingMore: false,

  setEndCursor: (endCursor) => set({ endCursor }),
  setHasNextPage: (hasNextPage) => set({ hasNextPage }),
  setIsLoadingMore: (isLoadingMore) => set({ isLoadingMore }),
  reset: () => set({ endCursor: null, hasNextPage: true, isLoadingMore: false }),
}));

// Page-number pagination (REST style)
interface PagePaginationState {
  currentPage: number;
  totalPages: number;
  perPage: number;
  isLoading: boolean;
  
  setCurrentPage: (page: number) => void;
  setTotalPages: (total: number) => void;
  setPerPage: (perPage: number) => void;
  setIsLoading: (loading: boolean) => void;
  nextPage: () => void;
  prevPage: () => void;
  reset: () => void;
}

export const usePagePaginationStore = create<PagePaginationState>((set, get) => ({
  currentPage: 1,
  totalPages: 1,
  perPage: 12,
  isLoading: false,

  setCurrentPage: (currentPage) => set({ currentPage }),
  setTotalPages: (totalPages) => set({ totalPages }),
  setPerPage: (perPage) => set({ perPage, currentPage: 1 }),
  setIsLoading: (isLoading) => set({ isLoading }),
  
  nextPage: () => {
    const { currentPage, totalPages } = get();
    if (currentPage < totalPages) {
      set({ currentPage: currentPage + 1 });
    }
  },
  
  prevPage: () => {
    const { currentPage } = get();
    if (currentPage > 1) {
      set({ currentPage: currentPage - 1 });
    }
  },
  
  reset: () => set({ currentPage: 1, totalPages: 1, isLoading: false }),
}));

// Selectors
export const selectCurrentPage = (state: PagePaginationState) => state.currentPage;
export const selectTotalPages = (state: PagePaginationState) => state.totalPages;
export const selectCanGoNext = (state: PagePaginationState) => 
  state.currentPage < state.totalPages;
export const selectCanGoPrev = (state: PagePaginationState) => 
  state.currentPage > 1;
```

### Form/Checkout Store Template

```typescript
// src/store/useCheckoutStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface Address {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  phone?: string;
}

interface CheckoutState {
  // Customer info
  email: string;
  billingAddress: Address | null;
  shippingAddress: Address | null;
  sameAsShipping: boolean;
  
  // Shipping & payment
  shippingMethodId: string | null;
  paymentMethodId: string | null;
  
  // Order notes
  customerNotes: string;
  
  // Transient state
  currentStep: number;
  isProcessing: boolean;
  validationErrors: Record<string, string>;
  hasHydrated: boolean;
  
  // Actions
  setEmail: (email: string) => void;
  setBillingAddress: (address: Address) => void;
  setShippingAddress: (address: Address) => void;
  setSameAsShipping: (same: boolean) => void;
  setShippingMethod: (id: string) => void;
  setPaymentMethod: (id: string) => void;
  setCustomerNotes: (notes: string) => void;
  setCurrentStep: (step: number) => void;
  setIsProcessing: (processing: boolean) => void;
  setValidationError: (field: string, error: string) => void;
  clearValidationError: (field: string) => void;
  clearAllErrors: () => void;
  setHasHydrated: (value: boolean) => void;
  reset: () => void;
}

const initialState = {
  email: '',
  billingAddress: null,
  shippingAddress: null,
  sameAsShipping: true,
  shippingMethodId: null,
  paymentMethodId: null,
  customerNotes: '',
  currentStep: 0,
  isProcessing: false,
  validationErrors: {},
  hasHydrated: false,
};

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set) => ({
      ...initialState,

      setEmail: (email) => set({ email }),
      setBillingAddress: (billingAddress) => set({ billingAddress }),
      setShippingAddress: (shippingAddress) => set({ shippingAddress }),
      setSameAsShipping: (sameAsShipping) => set({ sameAsShipping }),
      setShippingMethod: (shippingMethodId) => set({ shippingMethodId }),
      setPaymentMethod: (paymentMethodId) => set({ paymentMethodId }),
      setCustomerNotes: (customerNotes) => set({ customerNotes }),
      setCurrentStep: (currentStep) => set({ currentStep }),
      setIsProcessing: (isProcessing) => set({ isProcessing }),
      
      setValidationError: (field, error) =>
        set((state) => ({
          validationErrors: { ...state.validationErrors, [field]: error },
        })),
      
      clearValidationError: (field) =>
        set((state) => {
          const { [field]: _, ...rest } = state.validationErrors;
          return { validationErrors: rest };
        }),
      
      clearAllErrors: () => set({ validationErrors: {} }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      reset: () => set(initialState),
    }),
    {
      name: 'checkout-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        email: state.email,
        billingAddress: state.billingAddress,
        shippingAddress: state.shippingAddress,
        sameAsShipping: state.sameAsShipping,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// Selectors
export const selectEmail = (state: CheckoutState) => state.email;
export const selectBillingAddress = (state: CheckoutState) => state.billingAddress;
export const selectShippingAddress = (state: CheckoutState) => state.shippingAddress;
export const selectCurrentStep = (state: CheckoutState) => state.currentStep;
export const selectIsProcessing = (state: CheckoutState) => state.isProcessing;
export const selectValidationErrors = (state: CheckoutState) => state.validationErrors;
export const selectHasHydrated = (state: CheckoutState) => state.hasHydrated;

// Derived selectors
export const selectEffectiveBillingAddress = (state: CheckoutState) =>
  state.sameAsShipping ? state.shippingAddress : state.billingAddress;

export const selectIsStepValid = (step: number) => (state: CheckoutState) => {
  switch (step) {
    case 0: // Contact
      return !!state.email && !state.validationErrors.email;
    case 1: // Shipping
      return !!state.shippingAddress && !!state.shippingMethodId;
    case 2: // Payment
      return !!state.paymentMethodId;
    default:
      return false;
  }
};
```

---

## 7. Integration Patterns

### Store + Service Layer

**Keep network calls in services, not stores.** Stores manage state; services fetch data.

```typescript
// ❌ BAD: Network call inside store
const useProductStore = create((set) => ({
  products: [],
  fetchProducts: async () => {
    const response = await fetch('/api/products'); // Network call in store!
    const data = await response.json();
    set({ products: data });
  },
}));

// ✅ GOOD: Service handles network, store handles state
// src/services/productServices.ts
export const fetchProducts = async () => {
  const response = await fetch('/api/products');
  return response.json();
};

// src/store/useProductStore.ts
export const useProductStore = create((set) => ({
  products: [],
  setProducts: (products) => set({ products }),
}));

// Component orchestrates both
const ProductPage = () => {
  const setProducts = useProductStore((state) => state.setProducts);
  
  useEffect(() => {
    fetchProducts().then(setProducts);
  }, []);
};
```

### Store + API Routes

```typescript
// src/app/api/cart/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { items } = await request.json();
  
  // Validate cart items against current inventory
  const validatedItems = await validateCartItems(items);
  
  return NextResponse.json({ items: validatedItems });
}

// Client component syncs store with server
const useCartSync = () => {
  const items = useCartStore(selectCartItems);
  
  const syncCart = async () => {
    const response = await fetch('/api/cart', {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
    const { items: validatedItems } = await response.json();
    useCartStore.getState().setItems(validatedItems);
  };
  
  return { syncCart };
};
```

### Store + Server Components

Server Components cannot use hooks, but they can pass initial data to Client Components:

```typescript
// src/app/(public)/shop/page.tsx (Server Component)
import { fetchProducts } from '@/services/productServices';
import { ProductList } from '@/components/shop/ProductList';

export default async function ShopPage() {
  const products = await fetchProducts();
  
  // Pass server data to client component
  return <ProductList initialProducts={products} />;
}

// src/components/shop/ProductList.tsx (Client Component)
'use client';

import { useEffect } from 'react';
import { useProductStore, selectProducts } from '@/store/useProductStore';

interface Props {
  initialProducts: Product[];
}

export const ProductList = ({ initialProducts }: Props) => {
  const products = useProductStore(selectProducts);
  const setProducts = useProductStore((state) => state.setProducts);
  
  // Initialize store with server data on mount
  useEffect(() => {
    if (products.length === 0) {
      setProducts(initialProducts);
    }
  }, [initialProducts, products.length, setProducts]);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};
```

### Store + Client Components

```typescript
// src/components/cart/AddToCartButton.tsx
'use client';

import { useCartStore } from '@/store/useCartStore';
import { Button } from '@/components/ui/button';

interface Props {
  product: Product;
  variationId?: number;
}

export const AddToCartButton = ({ product, variationId }: Props) => {
  const addItem = useCartStore((state) => state.addItem);
  
  const handleClick = () => {
    addItem({
      productId: product.id,
      variationId,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.images[0]?.src,
    });
  };
  
  return (
    <Button onClick={handleClick}>
      Add to Cart
    </Button>
  );
};
```

---

## 8. Common Stores Reference

### Cart Store Pattern

```typescript
// src/store/useCartStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface CartItem {
  id: string;
  productId: number;
  variationId?: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CartState {
  items: CartItem[];
  hasHydrated: boolean;
  
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  setHasHydrated: (value: boolean) => void;
}

const generateId = (item: Omit<CartItem, 'id'>) =>
  `${item.productId}-${item.variationId || 'default'}`;

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      hasHydrated: false,

      addItem: (item) =>
        set((state) => {
          const id = generateId(item);
          const existing = state.items.find((i) => i.id === id);
          
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === id ? { ...i, quantity: i.quantity + item.quantity } : i
              ),
            };
          }
          
          return { items: [...state.items, { ...item, id }] };
        }),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),

      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: quantity > 0
            ? state.items.map((item) =>
                item.id === id ? { ...item, quantity } : item
              )
            : state.items.filter((item) => item.id !== id),
        })),

      clearCart: () => set({ items: [] }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// Selectors
export const selectCartItems = (state: CartState) => state.items;
export const selectCartItemCount = (state: CartState) =>
  state.items.reduce((sum, item) => sum + item.quantity, 0);
export const selectCartSubtotal = (state: CartState) =>
  state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
export const selectHasHydrated = (state: CartState) => state.hasHydrated;
```

### Auth Store Pattern

```typescript
// src/store/useAuthStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type UserRole = 'member' | 'admin' | 'superadmin';

interface User {
  id: string;
  email: string;
  role: UserRole;
  fullName?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasHydrated: boolean;
  
  setUser: (user: User | null) => void;
  setIsLoading: (loading: boolean) => void;
  setHasHydrated: (value: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      hasHydrated: false,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        }),

      setIsLoading: (isLoading) => set({ isLoading }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      
      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// Selectors
export const selectUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectUserRole = (state: AuthState) => state.user?.role;
export const selectHasHydrated = (state: AuthState) => state.hasHydrated;

// Role check helpers
export const selectIsAdmin = (state: AuthState) =>
  state.user?.role === 'admin' || state.user?.role === 'superadmin';
export const selectIsSuperAdmin = (state: AuthState) =>
  state.user?.role === 'superadmin';
```

### UI Store Pattern

```typescript
// src/store/useUIStore.ts

import { create } from 'zustand';

interface UIState {
  isSidebarOpen: boolean;
  isCartOpen: boolean;
  isMobileMenuOpen: boolean;
  activeModal: string | null;
  
  toggleSidebar: () => void;
  toggleCart: () => void;
  toggleMobileMenu: () => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
  closeAll: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: false,
  isCartOpen: false,
  isMobileMenuOpen: false,
  activeModal: null,

  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  
  toggleCart: () =>
    set((state) => ({ isCartOpen: !state.isCartOpen })),
  
  toggleMobileMenu: () =>
    set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  
  openModal: (modalId) => set({ activeModal: modalId }),
  closeModal: () => set({ activeModal: null }),
  
  closeAll: () =>
    set({
      isSidebarOpen: false,
      isCartOpen: false,
      isMobileMenuOpen: false,
      activeModal: null,
    }),
}));

// Selectors
export const selectIsSidebarOpen = (state: UIState) => state.isSidebarOpen;
export const selectIsCartOpen = (state: UIState) => state.isCartOpen;
export const selectIsMobileMenuOpen = (state: UIState) => state.isMobileMenuOpen;
export const selectActiveModal = (state: UIState) => state.activeModal;
```

---

## 9. Best Practices Checklist

### Do's ✅

- **Use selectors** for every store subscription
- **Persist only UX-critical state** with `partialize`
- **Implement hydration flags** for SSR compatibility
- **Keep stores domain-focused** (cart, auth, checkout)
- **Compute derived values** in selectors, not state
- **Use composite keys** for items with variations
- **Export selectors** from store files
- **Reset stores** when appropriate (logout, order complete)

### Don'ts ❌

- **Don't subscribe to entire store** without selectors
- **Don't persist loading states** or validation errors
- **Don't make network calls** inside store actions
- **Don't store server state** that should be fetched fresh
- **Don't mutate state directly** (unless using immer)
- **Don't create one giant store** for everything
- **Don't forget hydration** in SSR apps

### Performance Tips

1. **Selector granularity**: More specific selectors = fewer re-renders
2. **Shallow comparison**: Use `shallow` for object/array selectors
3. **Memoize derived values**: Use `useMemo` for expensive computations
4. **Batch updates**: Combine related state changes in one `set()` call
5. **Lazy initialization**: Use `getState()` for one-time reads

### Debugging Zustand

```typescript
// Enable devtools in development
import { devtools } from 'zustand/middleware';

export const useCartStore = create<CartState>()(
  devtools(
    persist(
      (set) => ({ /* ... */ }),
      { name: 'cart-storage' }
    ),
    { name: 'CartStore' } // Shows in Redux DevTools
  )
);

// Log state changes
const logMiddleware = (config) => (set, get, api) =>
  config(
    (...args) => {
      console.log('Previous state:', get());
      set(...args);
      console.log('Next state:', get());
    },
    get,
    api
  );

// Access store outside React
const currentItems = useCartStore.getState().items;
useCartStore.setState({ items: [] });

// Subscribe to changes outside React
const unsubscribe = useCartStore.subscribe(
  (state) => state.items,
  (items) => console.log('Cart changed:', items)
);
```

---

*This manual is part of the Stark Industries Software Factory documentation suite.*
