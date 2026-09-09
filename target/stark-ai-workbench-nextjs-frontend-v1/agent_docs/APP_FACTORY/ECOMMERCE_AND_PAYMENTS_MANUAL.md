# ECOMMERCE AND PAYMENTS MANUAL

> **Stark Industries Software Factory**  
> *The E-commerce Module: Stripe integration, WooCommerce backend, cart logic, and checkout flows.*

---

## Table of Contents

1. [Payment Architecture Overview](#1-payment-architecture-overview)
2. [Stripe Setup](#2-stripe-setup)
3. [PaymentIntent Flow](#3-paymentintent-flow)
4. [Checkout Implementation](#4-checkout-implementation)
5. [Order Management](#5-order-management)
6. [Cart Logic](#6-cart-logic)
7. [Checkout Store](#7-checkout-store)
8. [Coupon System](#8-coupon-system)
9. [Webhook Handling](#9-webhook-handling)
10. [Testing Payments](#10-testing-payments)
11. [Security Checklist](#11-security-checklist)

---

## 1. Payment Architecture Overview

### The Payment Flow (High-Level)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CUSTOMER JOURNEY                                   │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
    │  Browse  │ ──► │   Cart   │ ──► │ Checkout │ ──► │ Thank You│
    │ Products │     │   Page   │     │   Flow   │     │   Page   │
    └──────────┘     └──────────┘     └──────────┘     └──────────┘
                                            │
                                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CHECKOUT FLOW DETAIL                               │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
    │   Contact    │ ──► │   Shipping   │ ──► │   Payment    │
    │    Info      │     │   Address    │     │   Details    │
    └──────────────┘     └──────────────┘     └──────────────┘
                                                     │
                                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PAYMENT PROCESSING                                 │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
    │ Create Order │ ──► │   Create     │ ──► │   Confirm    │
    │ (WooCommerce)│     │PaymentIntent │     │   Payment    │
    └──────────────┘     │   (Stripe)   │     │   (Stripe)   │
                         └──────────────┘     └──────────────┘
                                                     │
                                                     ▼
                                              ┌──────────────┐
                                              │Update Order  │
                                              │   Status     │
                                              └──────────────┘
```

### Key Principle: Order-First Pattern

**Always create the order BEFORE processing payment.**

This ensures:
1. Order exists in your system regardless of payment outcome
2. Order ID can be attached to PaymentIntent metadata
3. Failed payments can be retried against existing order
4. Inventory is reserved before payment

### System Components

| Component | Technology | Purpose |
|-----------|------------|---------|
| Product Catalog | WooCommerce REST API | Product data, inventory, pricing |
| Shopping Cart | Zustand (client-side) | Cart state, persistence |
| Checkout Form | React Hook Form + Zod | Form validation, data collection |
| Payment Processing | Stripe | Secure payment handling |
| Order Management | WooCommerce REST API | Order creation, status updates |
| Webhooks | Next.js API Routes | Async payment confirmations |

### Security Principles

1. **Never expose secret keys** - Stripe Secret Key stays server-side only
2. **Validate on server** - Never trust client-side totals
3. **Use HTTPS** - All payment pages must be HTTPS
4. **PCI Compliance** - Use Stripe Elements (never handle raw card data)
5. **Idempotency** - Use idempotency keys for retries

---

## 2. Stripe Setup

### Environment Variables

```bash
# .env.local

# Public key (safe for client-side)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# Secret key (server-side ONLY)
STRIPE_SECRET_KEY=sk_test_xxx

# Webhook secret (for verifying webhook signatures)
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### Dependencies

```bash
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
```

| Package | Purpose | Environment |
|---------|---------|-------------|
| `stripe` | Server-side Stripe SDK | Server only |
| `@stripe/stripe-js` | Client-side Stripe.js loader | Client only |
| `@stripe/react-stripe-js` | React components (Elements) | Client only |

### Client-Side Initialization

```typescript
// src/lib/stripe/client.ts
'use client';

import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
    );
  }
  return stripePromise;
};
```

### Server-Side Initialization

```typescript
// src/lib/stripe/server.ts

import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16', // Use latest stable version
  typescript: true,
});
```

---

## 3. PaymentIntent Flow

### Overview

Stripe's PaymentIntent API is the modern way to handle payments. The flow:

1. **Server creates PaymentIntent** → Returns `clientSecret`
2. **Client confirms payment** → Uses `clientSecret` with card details
3. **Stripe processes payment** → Returns result
4. **Server updates order** → Based on payment result

### Creating PaymentIntent (Server)

```typescript
// src/app/api/create-payment-intent/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';
import { calculateOrderTotal } from '@/lib/utils/pricing';

interface CreatePaymentIntentRequest {
  orderId: number;
  items: Array<{
    productId: number;
    quantity: number;
    price: number;
  }>;
  shipping: {
    cost: number;
    method: string;
  };
  coupon?: {
    code: string;
    discount: number;
  };
  customerEmail: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreatePaymentIntentRequest = await request.json();

    // CRITICAL: Recalculate total on server - never trust client
    const { subtotal, shipping, discount, tax, total } = calculateOrderTotal({
      items: body.items,
      shippingCost: body.shipping.cost,
      couponDiscount: body.coupon?.discount || 0,
    });

    // Validate minimum amount (Stripe requires at least $0.50 USD)
    if (total < 50) {
      return NextResponse.json(
        { error: 'Order total must be at least $0.50' },
        { status: 400 }
      );
    }

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: total, // Amount in cents
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        orderId: body.orderId.toString(),
        customerEmail: body.customerEmail,
        subtotal: subtotal.toString(),
        shipping: shipping.toString(),
        discount: discount.toString(),
        tax: tax.toString(),
      },
      receipt_email: body.customerEmail,
      description: `Order #${body.orderId}`,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: total,
    });
  } catch (error) {
    console.error('Error creating PaymentIntent:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
```

### Confirming Payment (Client)

```typescript
// src/components/checkout/payments/StripePaymentForm.tsx
'use client';

import { useState } from 'react';
import {
  useStripe,
  useElements,
  PaymentElement,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';

interface Props {
  clientSecret: string;
  orderId: number;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
}

export const StripePaymentForm = ({
  clientSecret,
  orderId,
  onSuccess,
  onError,
}: Props) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/thankyou?order=${orderId}`,
        },
        redirect: 'if_required',
      });

      if (error) {
        // Show error to customer
        setErrorMessage(error.message || 'Payment failed');
        onError(error.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment successful
        onSuccess(paymentIntent.id);
      } else if (paymentIntent && paymentIntent.status === 'processing') {
        // Payment is processing (bank transfers, etc.)
        setErrorMessage('Payment is processing. You will be notified when complete.');
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred');
      onError('An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        options={{
          layout: 'tabs',
        }}
      />

      {errorMessage && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
          {errorMessage}
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || !elements || isProcessing}
        className="w-full"
      >
        {isProcessing ? 'Processing...' : 'Pay Now'}
      </Button>
    </form>
  );
};
```

### Handling Payment Results

```typescript
// Payment result handling in checkout flow

const handlePaymentSuccess = async (paymentIntentId: string) => {
  try {
    // Update order status
    await fetch('/api/update-order-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        status: 'processing',
        paymentIntentId,
      }),
    });

    // Clear cart
    useCartStore.getState().clearCart();

    // Clear checkout data
    useCheckoutStore.getState().reset();

    // Redirect to thank you page
    router.push(`/thankyou?order=${orderId}`);
  } catch (error) {
    console.error('Error updating order:', error);
    // Still redirect - order exists, payment succeeded
    router.push(`/thankyou?order=${orderId}`);
  }
};
```

---

## 4. Checkout Implementation

### Elements Provider Setup

Wrap your checkout page with the Stripe Elements provider:

```typescript
// src/app/(public)/checkout/page.tsx

import { CheckoutPageContent } from './CheckoutPageContent';

export default function CheckoutPage() {
  return <CheckoutPageContent />;
}

// src/app/(public)/checkout/CheckoutPageContent.tsx
'use client';

import { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/stripe/client';
import { useCartStore, selectCartItems, selectCartSubtotal } from '@/store/useCartStore';
import { useCheckoutStore } from '@/store/useCheckoutStore';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { OrderSummary } from '@/components/checkout/OrderSummary';

export const CheckoutPageContent = () => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);
  const items = useCartStore(selectCartItems);
  const subtotal = useCartStore(selectCartSubtotal);

  // Create order and payment intent when ready to pay
  const initializePayment = async () => {
    // 1. Create order in WooCommerce
    const orderResponse = await fetch('/api/place-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items,
        billing: useCheckoutStore.getState().billingAddress,
        shipping: useCheckoutStore.getState().shippingAddress,
        customerEmail: useCheckoutStore.getState().email,
      }),
    });

    const { order } = await orderResponse.json();
    setOrderId(order.id);

    // 2. Create PaymentIntent
    const paymentResponse = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: order.id,
        items,
        shipping: {
          cost: useCheckoutStore.getState().shippingCost,
          method: useCheckoutStore.getState().shippingMethodId,
        },
        customerEmail: useCheckoutStore.getState().email,
      }),
    });

    const { clientSecret } = await paymentResponse.json();
    setClientSecret(clientSecret);
  };

  const stripeOptions = {
    clientSecret: clientSecret || undefined,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#0f172a',
        colorBackground: '#ffffff',
        colorText: '#1e293b',
        colorDanger: '#ef4444',
        fontFamily: 'Poppins, system-ui, sans-serif',
        borderRadius: '6px',
      },
    },
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Checkout Form */}
        <div>
          <CheckoutForm onReadyToPay={initializePayment} />

          {/* Payment Form (only shown when clientSecret is ready) */}
          {clientSecret && (
            <Elements stripe={getStripe()} options={stripeOptions}>
              <StripePaymentForm
                clientSecret={clientSecret}
                orderId={orderId!}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </Elements>
          )}
        </div>

        {/* Right: Order Summary */}
        <div>
          <OrderSummary />
        </div>
      </div>
    </div>
  );
};
```

### PaymentElement Component

The `PaymentElement` is Stripe's all-in-one payment UI:

```typescript
// Features included automatically:
// - Credit/debit cards
// - Apple Pay / Google Pay (if enabled)
// - Bank transfers (if enabled)
// - Buy now, pay later (if enabled)
// - Automatic localization
// - Built-in validation
// - PCI compliant

<PaymentElement
  options={{
    layout: 'tabs',           // or 'accordion'
    paymentMethodOrder: ['card', 'apple_pay', 'google_pay'],
    defaultValues: {
      billingDetails: {
        name: customerName,
        email: customerEmail,
        address: {
          country: 'US',
        },
      },
    },
  }}
/>
```

### Form Validation Flow

```typescript
// src/components/checkout/left-pane/BillingForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCheckoutStore } from '@/store/useCheckoutStore';

const billingSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  address1: z.string().min(1, 'Address is required'),
  address2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(2, 'State is required').max(2),
  postcode: z.string().min(5, 'Valid ZIP code required'),
  country: z.string().default('US'),
  phone: z.string().optional(),
});

type BillingFormData = z.infer<typeof billingSchema>;

export const BillingForm = () => {
  const setBillingAddress = useCheckoutStore((state) => state.setBillingAddress);
  const billingAddress = useCheckoutStore((state) => state.billingAddress);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BillingFormData>({
    resolver: zodResolver(billingSchema),
    defaultValues: billingAddress || undefined,
  });

  const onSubmit = (data: BillingFormData) => {
    setBillingAddress(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">First Name</label>
          <input
            {...register('firstName')}
            className="w-full px-3 py-2 border rounded-md"
          />
          {errors.firstName && (
            <p className="text-sm text-destructive mt-1">
              {errors.firstName.message}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Last Name</label>
          <input
            {...register('lastName')}
            className="w-full px-3 py-2 border rounded-md"
          />
          {errors.lastName && (
            <p className="text-sm text-destructive mt-1">
              {errors.lastName.message}
            </p>
          )}
        </div>
      </div>

      {/* Additional fields... */}

      <Button type="submit">Save Billing Address</Button>
    </form>
  );
};
```

### Error Handling & Display

```typescript
// Common Stripe error codes and user-friendly messages

const STRIPE_ERROR_MESSAGES: Record<string, string> = {
  card_declined: 'Your card was declined. Please try a different card.',
  expired_card: 'Your card has expired. Please use a different card.',
  incorrect_cvc: 'The CVC code is incorrect. Please check and try again.',
  processing_error: 'An error occurred while processing. Please try again.',
  incorrect_number: 'The card number is incorrect. Please check and try again.',
  insufficient_funds: 'Insufficient funds. Please try a different card.',
  invalid_expiry_month: 'The expiration month is invalid.',
  invalid_expiry_year: 'The expiration year is invalid.',
};

const getErrorMessage = (error: StripeError): string => {
  if (error.code && STRIPE_ERROR_MESSAGES[error.code]) {
    return STRIPE_ERROR_MESSAGES[error.code];
  }
  return error.message || 'An unexpected error occurred. Please try again.';
};
```

---

## 5. Order Management

### Order-First Pattern Implementation

```typescript
// src/app/api/place-order/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createWooCommerceOrder } from '@/services/orderServices';

interface PlaceOrderRequest {
  items: Array<{
    productId: number;
    variationId?: number;
    quantity: number;
  }>;
  billing: {
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    email: string;
    phone?: string;
  };
  shipping: {
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  shippingMethod: {
    id: string;
    title: string;
    cost: string;
  };
  couponCode?: string;
  customerNotes?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: PlaceOrderRequest = await request.json();

    // Transform to WooCommerce order format
    const orderData = {
      payment_method: 'stripe',
      payment_method_title: 'Credit Card (Stripe)',
      set_paid: false, // Will be set to true after payment
      status: 'pending', // Pending until payment confirmed
      billing: {
        first_name: body.billing.firstName,
        last_name: body.billing.lastName,
        address_1: body.billing.address1,
        address_2: body.billing.address2 || '',
        city: body.billing.city,
        state: body.billing.state,
        postcode: body.billing.postcode,
        country: body.billing.country,
        email: body.billing.email,
        phone: body.billing.phone || '',
      },
      shipping: {
        first_name: body.shipping.firstName,
        last_name: body.shipping.lastName,
        address_1: body.shipping.address1,
        address_2: body.shipping.address2 || '',
        city: body.shipping.city,
        state: body.shipping.state,
        postcode: body.shipping.postcode,
        country: body.shipping.country,
      },
      line_items: body.items.map((item) => ({
        product_id: item.productId,
        variation_id: item.variationId || 0,
        quantity: item.quantity,
      })),
      shipping_lines: [
        {
          method_id: body.shippingMethod.id,
          method_title: body.shippingMethod.title,
          total: body.shippingMethod.cost,
        },
      ],
      coupon_lines: body.couponCode
        ? [{ code: body.couponCode }]
        : [],
      customer_note: body.customerNotes || '',
    };

    const order = await createWooCommerceOrder(orderData);

    return NextResponse.json({
      order: {
        id: order.id,
        number: order.number,
        total: order.total,
        status: order.status,
      },
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
```

### Order Status Updates

```typescript
// src/app/api/update-order-status/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { updateWooCommerceOrder } from '@/services/orderServices';

interface UpdateOrderRequest {
  orderId: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'failed';
  paymentIntentId?: string;
  transactionId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: UpdateOrderRequest = await request.json();

    const updateData: Record<string, unknown> = {
      status: body.status,
    };

    // If payment succeeded, mark as paid
    if (body.status === 'processing' && body.paymentIntentId) {
      updateData.set_paid = true;
      updateData.transaction_id = body.paymentIntentId;
    }

    const order = await updateWooCommerceOrder(body.orderId, updateData);

    return NextResponse.json({
      order: {
        id: order.id,
        status: order.status,
      },
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
```

### Order Data Transformation

```typescript
// src/services/orderServices.ts

import axios from 'axios';

const wooClient = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_BACKEND_URL}/wp-json/wc/v3`,
  auth: {
    username: process.env.WOOCOM_CONSUMER_KEY!,
    password: process.env.WOOCOM_CONSUMER_SECRET!,
  },
});

export interface WooCommerceOrder {
  id: number;
  number: string;
  status: string;
  total: string;
  currency: string;
  date_created: string;
  billing: WooCommerceBilling;
  shipping: WooCommerceShipping;
  line_items: WooCommerceLineItem[];
  shipping_lines: WooCommerceShippingLine[];
  coupon_lines: WooCommerceCouponLine[];
}

export const createWooCommerceOrder = async (
  orderData: Record<string, unknown>
): Promise<WooCommerceOrder> => {
  const response = await wooClient.post('/orders', orderData);
  return response.data;
};

export const updateWooCommerceOrder = async (
  orderId: number,
  updateData: Record<string, unknown>
): Promise<WooCommerceOrder> => {
  const response = await wooClient.put(`/orders/${orderId}`, updateData);
  return response.data;
};

export const fetchOrder = async (orderId: number): Promise<WooCommerceOrder> => {
  const response = await wooClient.get(`/orders/${orderId}`);
  return response.data;
};
```

---

## 6. Cart Logic

### Cart Store Structure

```typescript
// src/store/useCartStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  id: string;                    // Composite key
  productId: number;
  variationId?: number;
  name: string;
  slug: string;
  price: number;                 // Unit price in cents
  regularPrice: number;
  quantity: number;
  image?: string;
  attributes?: Record<string, string>;  // e.g., { color: 'Red', size: 'Large' }
  customFields?: Record<string, string>;
}

interface CartState {
  items: CartItem[];
  hasHydrated: boolean;

  // Actions
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  incrementQuantity: (id: string) => void;
  decrementQuantity: (id: string) => void;
  clearCart: () => void;
  setHasHydrated: (value: boolean) => void;
}

// Generate composite key for cart items
const generateCartItemId = (
  productId: number,
  variationId?: number,
  attributes?: Record<string, string>
): string => {
  let id = `${productId}`;
  if (variationId) id += `-${variationId}`;
  if (attributes) id += `-${JSON.stringify(attributes)}`;
  return id;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      hasHydrated: false,

      addItem: (item) => {
        const id = generateCartItemId(
          item.productId,
          item.variationId,
          item.attributes
        );

        set((state) => {
          const existingIndex = state.items.findIndex((i) => i.id === id);

          if (existingIndex >= 0) {
            // Update quantity of existing item
            const newItems = [...state.items];
            newItems[existingIndex] = {
              ...newItems[existingIndex],
              quantity: newItems[existingIndex].quantity + item.quantity,
            };
            return { items: newItems };
          }

          // Add new item
          return {
            items: [...state.items, { ...item, id }],
          };
        });
      },

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),

      updateQuantity: (id, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return { items: state.items.filter((item) => item.id !== id) };
          }
          return {
            items: state.items.map((item) =>
              item.id === id ? { ...item, quantity } : item
            ),
          };
        }),

      incrementQuantity: (id) => {
        const item = get().items.find((i) => i.id === id);
        if (item) {
          get().updateQuantity(id, item.quantity + 1);
        }
      },

      decrementQuantity: (id) => {
        const item = get().items.find((i) => i.id === id);
        if (item && item.quantity > 1) {
          get().updateQuantity(id, item.quantity - 1);
        } else if (item) {
          get().removeItem(id);
        }
      },

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

### Adding Items to Cart

```typescript
// src/components/shop/product-page/AddToCartButton.tsx
'use client';

import { useState } from 'react';
import { useCartStore } from '@/store/useCartStore';
import { Button } from '@/components/ui/button';
import type { Product } from '@/types/product';

interface Props {
  product: Product;
  selectedVariation?: {
    id: number;
    price: number;
    attributes: Record<string, string>;
  };
  quantity?: number;
}

export const AddToCartButton = ({
  product,
  selectedVariation,
  quantity = 1,
}: Props) => {
  const addItem = useCartStore((state) => state.addItem);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = () => {
    setIsAdding(true);

    // Determine price (variation price or product price)
    const price = selectedVariation?.price || product.price;

    addItem({
      productId: product.id,
      variationId: selectedVariation?.id,
      name: product.name,
      slug: product.slug,
      price: Math.round(price * 100), // Convert to cents
      regularPrice: Math.round(product.regularPrice * 100),
      quantity,
      image: product.images[0]?.src,
      attributes: selectedVariation?.attributes,
    });

    // Visual feedback
    setTimeout(() => setIsAdding(false), 500);
  };

  return (
    <Button
      onClick={handleAddToCart}
      disabled={isAdding}
      className="w-full"
    >
      {isAdding ? 'Added!' : 'Add to Cart'}
    </Button>
  );
};
```

### Quantity Management

```typescript
// src/components/cart/CartItem.tsx
'use client';

import { useCartStore } from '@/store/useCartStore';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2 } from 'lucide-react';

interface Props {
  item: CartItem;
}

export const CartItemRow = ({ item }: Props) => {
  const incrementQuantity = useCartStore((state) => state.incrementQuantity);
  const decrementQuantity = useCartStore((state) => state.decrementQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  return (
    <div className="flex items-center gap-4 py-4 border-b">
      {/* Product Image */}
      <img
        src={item.image}
        alt={item.name}
        className="w-20 h-20 object-cover rounded"
      />

      {/* Product Info */}
      <div className="flex-1">
        <h3 className="font-medium">{item.name}</h3>
        {item.attributes && (
          <p className="text-sm text-muted-foreground">
            {Object.entries(item.attributes)
              .map(([key, value]) => `${key}: ${value}`)
              .join(', ')}
          </p>
        )}
        <p className="text-sm font-medium">
          ${(item.price / 100).toFixed(2)}
        </p>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => decrementQuantity(item.id)}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-8 text-center">{item.quantity}</span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => incrementQuantity(item.id)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Remove Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => removeItem(item.id)}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>

      {/* Line Total */}
      <div className="w-24 text-right font-medium">
        ${((item.price * item.quantity) / 100).toFixed(2)}
      </div>
    </div>
  );
};
```

### Price Normalization

Always store prices in cents to avoid floating-point issues:

```typescript
// src/lib/utils/pricing.ts

/**
 * Convert dollars to cents
 */
export const toCents = (dollars: number): number => {
  return Math.round(dollars * 100);
};

/**
 * Convert cents to dollars
 */
export const toDollars = (cents: number): number => {
  return cents / 100;
};

/**
 * Format cents as currency string
 */
export const formatPrice = (cents: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(toDollars(cents));
};

/**
 * Calculate cart totals
 */
export const calculateCartTotals = (
  items: CartItem[],
  options: {
    shippingCost?: number;      // In cents
    couponDiscount?: number;    // In cents
    taxRate?: number;           // Decimal (0.08 = 8%)
  } = {}
) => {
  const { shippingCost = 0, couponDiscount = 0, taxRate = 0 } = options;

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const discountedSubtotal = Math.max(0, subtotal - couponDiscount);
  const tax = Math.round(discountedSubtotal * taxRate);
  const total = discountedSubtotal + shippingCost + tax;

  return {
    subtotal,
    discount: couponDiscount,
    shipping: shippingCost,
    tax,
    total,
  };
};
```

---

## 7. Checkout Store

See the `STATE_MANAGEMENT_MANUAL.md` for the full checkout store implementation. Key points:

### Checkout Data Structure

```typescript
interface CheckoutState {
  // Customer
  email: string;
  
  // Addresses
  billingAddress: Address | null;
  shippingAddress: Address | null;
  sameAsShipping: boolean;
  
  // Shipping
  shippingMethodId: string | null;
  shippingCost: number;
  
  // Payment
  paymentMethodId: string | null;
  
  // Coupon
  couponCode: string | null;
  couponDiscount: number;
  
  // Order
  customerNotes: string;
  
  // UI State
  currentStep: number;
  isProcessing: boolean;
  validationErrors: Record<string, string>;
}
```

### Totals Calculation

```typescript
// src/lib/utils/checkoutTotals.ts

import { useCartStore, selectCartItems } from '@/store/useCartStore';
import { useCheckoutStore } from '@/store/useCheckoutStore';
import { calculateCartTotals } from './pricing';

export const useCheckoutTotals = () => {
  const items = useCartStore(selectCartItems);
  const shippingCost = useCheckoutStore((state) => state.shippingCost);
  const couponDiscount = useCheckoutStore((state) => state.couponDiscount);

  return calculateCartTotals(items, {
    shippingCost,
    couponDiscount,
    taxRate: 0.08, // 8% tax
  });
};
```

---

## 8. Coupon System

### Coupon Validation

```typescript
// src/app/api/get-coupon-by-code/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { validateCoupon } from '@/services/couponServices';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');

  if (!code) {
    return NextResponse.json(
      { error: 'Coupon code is required' },
      { status: 400 }
    );
  }

  try {
    const coupon = await validateCoupon(code);

    if (!coupon) {
      return NextResponse.json(
        { error: 'Invalid coupon code' },
        { status: 404 }
      );
    }

    // Check if coupon is expired
    if (coupon.date_expires && new Date(coupon.date_expires) < new Date()) {
      return NextResponse.json(
        { error: 'This coupon has expired' },
        { status: 400 }
      );
    }

    // Check usage limits
    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      return NextResponse.json(
        { error: 'This coupon has reached its usage limit' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      coupon: {
        code: coupon.code,
        discountType: coupon.discount_type,
        amount: coupon.amount,
        freeShipping: coupon.free_shipping,
        minimumAmount: coupon.minimum_amount,
        maximumAmount: coupon.maximum_amount,
      },
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    return NextResponse.json(
      { error: 'Failed to validate coupon' },
      { status: 500 }
    );
  }
}
```

### Discount Calculation

```typescript
// src/lib/utils/couponCalculations.ts

interface Coupon {
  code: string;
  discountType: 'percent' | 'fixed_cart' | 'fixed_product';
  amount: string;
  freeShipping: boolean;
  minimumAmount?: string;
  maximumAmount?: string;
}

export const calculateCouponDiscount = (
  coupon: Coupon,
  subtotal: number // In cents
): { discount: number; freeShipping: boolean } => {
  const amount = parseFloat(coupon.amount);

  // Check minimum amount
  if (coupon.minimumAmount) {
    const minimum = parseFloat(coupon.minimumAmount) * 100;
    if (subtotal < minimum) {
      return { discount: 0, freeShipping: false };
    }
  }

  let discount = 0;

  switch (coupon.discountType) {
    case 'percent':
      discount = Math.round(subtotal * (amount / 100));
      break;
    case 'fixed_cart':
      discount = Math.round(amount * 100); // Convert to cents
      break;
    case 'fixed_product':
      // Per-product discount - handled differently
      discount = Math.round(amount * 100);
      break;
  }

  // Check maximum discount
  if (coupon.maximumAmount) {
    const maximum = parseFloat(coupon.maximumAmount) * 100;
    discount = Math.min(discount, maximum);
  }

  // Discount cannot exceed subtotal
  discount = Math.min(discount, subtotal);

  return {
    discount,
    freeShipping: coupon.freeShipping,
  };
};
```

### Coupon UI Component

```typescript
// src/components/checkout/right-pane/ApplyCoupon.tsx
'use client';

import { useState } from 'react';
import { useCheckoutStore } from '@/store/useCheckoutStore';
import { useCartStore, selectCartSubtotal } from '@/store/useCartStore';
import { calculateCouponDiscount } from '@/lib/utils/couponCalculations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const ApplyCoupon = () => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = useCartStore(selectCartSubtotal);
  const couponCode = useCheckoutStore((state) => state.couponCode);
  const setCoupon = useCheckoutStore((state) => state.setCoupon);
  const clearCoupon = useCheckoutStore((state) => state.clearCoupon);

  const handleApply = async () => {
    if (!code.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/get-coupon-by-code?code=${encodeURIComponent(code)}`
      );
      const data = await response.json();

      if (!response.ok) {
        setError(data.error);
        return;
      }

      const { discount, freeShipping } = calculateCouponDiscount(
        data.coupon,
        subtotal
      );

      setCoupon({
        code: data.coupon.code,
        discount,
        freeShipping,
      });

      setCode('');
    } catch (err) {
      setError('Failed to apply coupon');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = () => {
    clearCoupon();
    setError(null);
  };

  if (couponCode) {
    return (
      <div className="flex items-center justify-between p-3 bg-green-50 rounded-md">
        <div>
          <span className="font-medium text-green-800">{couponCode}</span>
          <span className="text-sm text-green-600 ml-2">Applied</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleRemove}>
          Remove
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter coupon code"
          className="flex-1"
        />
        <Button onClick={handleApply} disabled={isLoading}>
          {isLoading ? 'Applying...' : 'Apply'}
        </Button>
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};
```

---

## 9. Webhook Handling

### Webhook Endpoint Setup

```typescript
// src/app/api/webhooks/stripe/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe/server';
import { updateWooCommerceOrder } from '@/services/orderServices';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
      break;

    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
      break;

    case 'charge.refunded':
      await handleRefund(event.data.object as Stripe.Charge);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata.orderId;

  if (!orderId) {
    console.error('No orderId in PaymentIntent metadata');
    return;
  }

  try {
    await updateWooCommerceOrder(parseInt(orderId), {
      status: 'processing',
      set_paid: true,
      transaction_id: paymentIntent.id,
    });

    console.log(`Order ${orderId} marked as processing`);
  } catch (error) {
    console.error(`Failed to update order ${orderId}:`, error);
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata.orderId;

  if (!orderId) return;

  try {
    await updateWooCommerceOrder(parseInt(orderId), {
      status: 'failed',
    });

    console.log(`Order ${orderId} marked as failed`);
  } catch (error) {
    console.error(`Failed to update order ${orderId}:`, error);
  }
}

async function handleRefund(charge: Stripe.Charge) {
  // Handle refund logic
  console.log('Refund processed:', charge.id);
}
```

### Signature Verification

**Always verify webhook signatures.** This prevents attackers from sending fake events.

```typescript
// The signature verification happens in constructEvent()
// It uses your STRIPE_WEBHOOK_SECRET to verify the request came from Stripe

try {
  event = stripe.webhooks.constructEvent(
    body,           // Raw request body (must be string, not parsed JSON)
    signature,      // stripe-signature header
    webhookSecret   // Your webhook secret from Stripe Dashboard
  );
} catch (err) {
  // Invalid signature - reject the request
  return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
}
```

### Event Types

| Event | When It Fires | Action |
|-------|---------------|--------|
| `payment_intent.succeeded` | Payment completed | Update order to "processing" |
| `payment_intent.payment_failed` | Payment failed | Update order to "failed" |
| `charge.refunded` | Refund processed | Update order, notify customer |
| `charge.dispute.created` | Chargeback initiated | Flag order, notify admin |

---

## 10. Testing Payments

### Test Card Numbers

| Card Number | Scenario |
|-------------|----------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Card declined |
| `4000 0000 0000 9995` | Insufficient funds |
| `4000 0000 0000 9987` | Lost card |
| `4000 0000 0000 9979` | Stolen card |
| `4000 0027 6000 3184` | Requires authentication (3D Secure) |
| `4000 0000 0000 0077` | Charge succeeds, then disputed |

Use any future expiration date and any 3-digit CVC.

### Test Scenarios

```typescript
// Test file: __tests__/checkout.test.ts

describe('Checkout Flow', () => {
  it('should complete checkout with valid card', async () => {
    // 1. Add items to cart
    // 2. Fill checkout form
    // 3. Submit with test card 4242...
    // 4. Verify order created
    // 5. Verify redirect to thank you page
  });

  it('should handle declined card', async () => {
    // 1. Add items to cart
    // 2. Fill checkout form
    // 3. Submit with test card 4000 0000 0000 0002
    // 4. Verify error message displayed
    // 5. Verify order status is "pending" or "failed"
  });

  it('should handle 3D Secure authentication', async () => {
    // 1. Add items to cart
    // 2. Fill checkout form
    // 3. Submit with test card 4000 0027 6000 3184
    // 4. Verify 3DS modal appears
    // 5. Complete authentication
    // 6. Verify order completed
  });
});
```

### Error Simulation

```typescript
// Trigger specific errors for testing

// Insufficient funds
const testInsufficientFunds = async () => {
  // Use card: 4000 0000 0000 9995
  // Error code: insufficient_funds
};

// Expired card
const testExpiredCard = async () => {
  // Use any card with past expiration date
  // Error code: expired_card
};

// Invalid CVC
const testInvalidCVC = async () => {
  // Use card: 4000 0000 0000 0127
  // Error code: incorrect_cvc
};
```

---

## 11. Security Checklist

### API Key Security

- [ ] `STRIPE_SECRET_KEY` is in `.env.local` (not committed)
- [ ] `STRIPE_SECRET_KEY` does NOT have `NEXT_PUBLIC_` prefix
- [ ] Secret key is only used in server-side code (`src/app/api/`, `src/services/`)
- [ ] Publishable key (`pk_`) is used on client-side
- [ ] Webhook secret is stored securely

### PCI Compliance

- [ ] Using Stripe Elements (never handling raw card data)
- [ ] Not logging card numbers or CVCs
- [ ] Not storing card data in database
- [ ] HTTPS enabled on all payment pages
- [ ] Using `PaymentElement` or `CardElement` from Stripe

### Input Validation

- [ ] Server-side validation of all checkout data
- [ ] Server-side recalculation of totals (never trust client)
- [ ] Coupon validation on server
- [ ] Order amount validation (minimum $0.50)
- [ ] Email format validation

### Order Security

- [ ] Order created before payment (Order-First Pattern)
- [ ] Order ID in PaymentIntent metadata
- [ ] Order status updated via webhook (not just client callback)
- [ ] Idempotency keys for retries

### Webhook Security

- [ ] Signature verification enabled
- [ ] Webhook endpoint not publicly documented
- [ ] Raw body used for signature verification (not parsed JSON)
- [ ] Proper error handling without leaking info

### Environment Security

```bash
# .env.local (NEVER commit this file)

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx  # OK to expose
STRIPE_SECRET_KEY=sk_test_xxx                    # NEVER expose
STRIPE_WEBHOOK_SECRET=whsec_xxx                  # NEVER expose

# WooCommerce
WOOCOM_CONSUMER_KEY=ck_xxx                       # NEVER expose
WOOCOM_CONSUMER_SECRET=cs_xxx                    # NEVER expose
```

### Production Checklist

- [ ] Switch from `sk_test_` to `sk_live_` keys
- [ ] Switch from `pk_test_` to `pk_live_` keys
- [ ] Update webhook endpoint in Stripe Dashboard
- [ ] Test with real (small) transaction
- [ ] Enable fraud protection in Stripe Dashboard
- [ ] Set up Stripe Radar rules
- [ ] Configure email receipts
- [ ] Set up dispute notifications

---

*This manual is part of the Stark Industries Software Factory documentation suite.*
