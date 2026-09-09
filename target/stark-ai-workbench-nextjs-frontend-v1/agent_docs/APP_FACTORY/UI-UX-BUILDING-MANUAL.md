# UI/UX BUILDING MANUAL

**Project:** Cyber Bugs Next.js Starter Kit  
**Version:** 1.0  
**Last Updated:** December 30, 2025  
**Purpose:** Standardized guide for building pages and components consistently across all projects

---

## Philosophy & Approach

This manual documents the **proven patterns** used in this starter kit. The goal is to build apps **faster and better** by:

1. **Separating concerns** - Keep `page.tsx` minimal, content in dedicated files
2. **Reusing components** - Use common layout components for consistency
3. **Mobile-first responsive** - Every layout must work on all screen sizes
4. **Consistent naming** - Follow strict file and component naming conventions
5. **Composition over complexity** - Build with simple, composable pieces

**Core Principle:** If vibe coders can ship fast without deep knowledge, we as engineers should ship **faster and better** with our structured approach.

---

## Table of Contents

1. [Folder Structure](#folder-structure)
2. [Common Components (Reusable Building Blocks)](#common-components)
3. [Global Components (Site-Wide)](#global-components)
4. [Layout Components (Navigation)](#layout-components)
5. [Page Building Pattern](#page-building-pattern)
6. [File Naming Conventions](#file-naming-conventions)
7. [Responsive Design Patterns](#responsive-design-patterns)
8. [Complete Page Examples](#complete-page-examples)
9. [Quick Reference Checklist](#quick-reference-checklist)
10. [Suggestions for Improvement](#suggestions-for-improvement)

---

## Folder Structure

### Component Organization

```
src/components/
├── common/              # Reusable layout primitives (Page, Row, Box, etc.)
├── global/              # Site-wide components (Navbar, ThemeToggler)
├── layout/              # Navigation components (Sidebar, AdminSidebar)
├── ui/                  # shadcn/ui components (Button, Card, etc.)
├── auth/                # Authentication components
├── admin/               # Admin-specific components
├── members/             # Member-specific components
└── [feature]/           # Feature-specific components
```

### App Directory Organization

```
src/app/
├── (public)/            # Public routes (no auth required)
│   ├── page.tsx         # Minimal - imports PageContent
│   ├── PageContent.tsx  # Actual content implementation
│   └── demo/
│       ├── page.tsx
│       └── DemoPageContent.tsx
├── (auth)/              # Auth routes
├── (members)/           # Member-protected routes
│   ├── layout.tsx       # Navbar + Sidebar layout
│   └── members-portal/
│       ├── page.tsx
│       └── MembersPortalPageContent.tsx
├── (admin)/             # Admin-protected routes
│   ├── layout.tsx       # Navbar + AdminSidebar layout
│   └── admin-portal/
│       ├── page.tsx
│       └── AdminPortalPageContent.tsx
└── (superadmin)/        # Superadmin-protected routes
    ├── layout.tsx
    └── superadmin-portal/
        ├── page.tsx
        └── SuperadminPortalPageContent.tsx
```

---

## Common Components

These are your **building blocks** for every page. Located in `src/components/common/`.

### 1. Page Component

**Purpose:** Main page container with responsive width control

**File:** `src/components/common/Page.tsx`

```typescript
interface Props {
  children: ReactNode;
  FULL: boolean;           // true = full width, false = centered with margins
  className?: string;
  customYMargin?: string;  // Override default "my-10"
}
```

**Usage:**
```tsx
// Centered page with auto margins (most common)
<Page FULL={false} className="">
  {/* content */}
</Page>

// Full-width page
<Page FULL={true} className="">
  {/* content */}
</Page>

// Custom vertical margin
<Page FULL={false} customYMargin="my-20">
  {/* content */}
</Page>
```

**Responsive Behavior:**
- `FULL={false}`: Width is `w-11/12` (91%) on all screens, centered with `mx-auto`
- `FULL={true}`: Full width `min-w-full`
- Default vertical margin: `my-10`

---

### 2. Row Component

**Purpose:** Horizontal container for grouping content

**File:** `src/components/common/Row.tsx`

```typescript
interface Props {
  children: ReactNode;
  className?: string;
}
```

**Usage:**
```tsx
// Basic row
<Row className="">
  <h1>Title</h1>
  <p>Content</p>
</Row>

// Row with flex layout
<Row className="flex flex-wrap">
  <Box>Item 1</Box>
  <Box>Item 2</Box>
</Row>

// Row with grid
<Row className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <Box>Card 1</Box>
  <Box>Card 2</Box>
  <Box>Card 3</Box>
</Row>
```

**Default Styles:**
- `min-w-full` - Takes full width
- `p-5` - Padding on all sides

---

### 3. Box Component

**Purpose:** Generic container for any content (most flexible)

**File:** `src/components/common/Box.tsx`

```typescript
interface Props {
  children: ReactNode;
  className?: string;
}
```

**Usage:**
```tsx
// Simple box
<Box className="p-5">
  <p>Content</p>
</Box>

// Box with fixed width (responsive cards)
<Box className="w-80 p-5">
  <img src="..." />
  <p>Card content</p>
</Box>

// Box in grid
<Box className="p-3">
  <img src="..." className="mb-3 min-w-full rounded-full" />
  <p>Text</p>
</Box>
```

**Key Points:**
- No default styles (completely customizable)
- Use for cards, content blocks, grid items
- Add your own width, padding, margins via className

---

### 4. Container Component

**Purpose:** Similar to Page but for nested sections

**File:** `src/components/common/Container.tsx`

```typescript
interface Props {
  children: ReactNode;
  className: string;       // Required
  FULL: boolean;
}
```

**Usage:**
```tsx
<Container FULL={false} className="my-8">
  {/* nested content */}
</Container>
```

**Note:** Less commonly used than Page. Use Page for top-level, Container for nested sections.

---

### 5. Main Component

**Purpose:** Semantic `<main>` wrapper with flex-grow

**File:** `src/components/common/Main.tsx`

```typescript
interface Props {
  children: ReactNode;
  className: string;       // Required
}
```

**Usage:**
```tsx
<Main className="bg-gray-50">
  {/* page content */}
</Main>
```

**Default Styles:**
- `min-w-full flex flex-grow` - Takes full width and grows to fill space

---

### 6. BackButton Component

**Purpose:** Consistent back navigation button

**File:** `src/components/common/BackButton.tsx`

```typescript
interface BackButtonProps {
  text: string;
  link: string;
}
```

**Usage:**
```tsx
<BackButton text="Go Back" link="/admin-portal" />
```

**Renders:** Link with arrow icon and hover effect

---

### 7. Spinner Component

**Purpose:** Loading indicator

**File:** `src/components/common/Spinner.tsx`

**Usage:**
```tsx
{isLoading && <Spinner />}
```

**Renders:** Centered animated spinner with accessibility support

---

## Global Components

Site-wide components used across all pages. Located in `src/components/global/`.

### Navbar Components

**Files:**
- `Navbar.tsx` - Default navbar (members/admin)
- `NavbarHome.tsx` - Public home navbar
- `NavbarSuperadmin.tsx` - Superadmin navbar
- `NavbarLoginReg.tsx` - Auth pages navbar

**Common Features:**
- User authentication state display
- Avatar dropdown with profile/logout
- Theme toggler integration
- Active link highlighting
- Responsive design (hidden on mobile, visible on md+)

**Usage in Layouts:**
```tsx
import Navbar from "@/components/global/Navbar";

export default async function MemberLayout({ children }) {
  await protectPage(["member"]);
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      {/* rest of layout */}
    </div>
  );
}
```

---

### ThemeToggler Component

**File:** `src/components/global/ThemeToggler.tsx`

**Purpose:** Dark/light mode toggle button

**Usage:**
```tsx
import ThemeToggler from "@/components/global/ThemeToggler";

<ThemeToggler />
```

**Automatically included in all Navbar components**

---

## Layout Components

Navigation sidebars for different user roles. Located in `src/components/layout/`.

### Sidebar Component (Members)

**File:** `src/components/layout/Sidebar.tsx`

**Features:**
- Command palette interface (shadcn/ui Command component)
- Search functionality
- Grouped navigation items
- Keyboard shortcuts display
- Lucide icons

**Structure:**
```tsx
<Command className="bg-secondary">
  <CommandInput placeholder="Type a command or search..." />
  <CommandList className="px-8">
    <CommandGroup heading="Suggestions">
      <CommandItem>
        <Icon className="mr-2 h-4 w-4" />
        <Link href="/path">Label</Link>
      </CommandItem>
    </CommandGroup>
    <CommandSeparator />
    <CommandGroup heading="Settings">
      {/* settings items */}
    </CommandGroup>
  </CommandList>
</Command>
```

**Usage in Layout:**
```tsx
<div className="hidden md:block h-auto flex-shrink-0 border-4 w-[25rem]">
  <Sidebar />
</div>
```

**Key Points:**
- Hidden on mobile (`hidden md:block`)
- Fixed width: `w-[25rem]` (400px)
- Flex-shrink-0 prevents compression
- Border for visual separation

---

### AdminSidebar Component

**File:** `src/components/layout/AdminSidebar.tsx`

**Same structure as Sidebar but with admin-specific links:**
- `/admin-portal` - Dashboard
- `/admin-booking` - New Booking
- `/posts` - Bookings list
- Settings items

---

## Page Building Pattern

> **⚠️ MANDATORY PATTERN — DO NOT SKIP**
>
> This is the **most important pattern** in this codebase. Every page MUST follow this structure.
> Never put page content directly in `page.tsx`. The filename `page.tsx` tells you nothing about what the page does.
> Always create a descriptive `*PageContent.tsx` file for the actual implementation.

### The Two-File Pattern

**Every page follows this structure:**

```
feature-name/
├── page.tsx              # Minimal wrapper (3-8 lines)
└── FeatureNamePageContent.tsx  # Actual implementation
```

### Step 1: Create Minimal page.tsx

**File:** `src/app/(group)/feature-name/page.tsx`

```tsx
import FeatureNamePageContent from "./FeatureNamePageContent";

const FeatureName = () => {
  return <FeatureNamePageContent />;
};

export default FeatureName;
```

**Rules:**
- Keep it minimal (3-8 lines max)
- Only imports and returns the PageContent component
- Component name matches the feature (PascalCase)
- No logic, no styling, no data fetching here

---

### Step 2: Create PageContent Component

**File:** `src/app/(group)/feature-name/FeatureNamePageContent.tsx`

```tsx
import React from "react";
import Head from "next/head";
import Page from "@/components/common/Page";
import Row from "@/components/common/Row";
import Box from "@/components/common/Box";
import { Button } from "@/components/ui/button";

const FeatureNamePageContent = () => {
  return (
    <>
      <Head>
        <title>Feature Name</title>
        <meta name="description" content="Description of the page" />
      </Head>
      
      <Page FULL={false} className="">
        <Row className="">
          <h1 className="h1">Page Title</h1>
          {/* content */}
        </Row>
        
        <Row className="flex flex-wrap">
          <Box className="w-80 p-5">
            {/* card content */}
          </Box>
        </Row>
      </Page>
    </>
  );
};

export default FeatureNamePageContent;
```

**Structure:**
1. **Head section** - SEO metadata
2. **Page wrapper** - Controls page width
3. **Row sections** - Organize content horizontally
4. **Box components** - Individual content blocks

---

## File Naming Conventions

### Strict Rules

| Type | Pattern | Example |
|------|---------|---------|
| Page wrapper | `page.tsx` | `page.tsx` |
| Page content | `[FeatureName]PageContent.tsx` | `AdminPortalPageContent.tsx` |
| Layout | `layout.tsx` | `layout.tsx` |
| Component | `[ComponentName].tsx` | `BackButton.tsx` |
| Sidebar | `[Role]Sidebar.tsx` | `AdminSidebar.tsx` |
| Navbar | `Navbar[Variant].tsx` | `NavbarHome.tsx` |

### Examples

**✅ Correct:**
```
admin-portal/
├── page.tsx
└── AdminPortalPageContent.tsx

members-portal/
├── page.tsx
└── MembersPortalPageContent.tsx

user-profile/
├── page.tsx
└── UserProfilePageContent.tsx
```

**❌ Incorrect:**
```
admin-portal/
├── page.tsx
└── content.tsx              # Too generic

members-portal/
├── index.tsx                # Wrong name
└── MembersPortal.tsx        # Missing "PageContent"
```

---

## Responsive Design Patterns

### Mobile-First Approach

**Always build mobile-first, then add breakpoints:**

```tsx
// Mobile: stack vertically
// Tablet+: 2 columns
// Desktop: 3 columns
<Row className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <Box>Item 1</Box>
  <Box>Item 2</Box>
  <Box>Item 3</Box>
</Row>
```

### Tailwind Breakpoints

| Breakpoint | Min Width | Usage |
|------------|-----------|-------|
| `sm:` | 640px | Small tablets |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Laptops |
| `xl:` | 1280px | Desktops |
| `2xl:` | 1536px | Large screens |

---

### Common Responsive Patterns

#### 1. Hide/Show Elements

```tsx
// Hidden on mobile, visible on tablet+
<div className="hidden md:block">
  <Sidebar />
</div>

// Visible on mobile, hidden on tablet+
<div className="block md:hidden">
  <MobileMenu />
</div>
```

#### 2. Responsive Flexbox

```tsx
// Stack on mobile, row on desktop
<Row className="flex flex-col md:flex-row gap-4">
  <Box>Left</Box>
  <Box>Right</Box>
</Row>

// Wrap items responsively
<Row className="flex flex-wrap">
  <Box className="w-full md:w-1/2 lg:w-1/3">Item</Box>
</Row>
```

#### 3. Responsive Grid (Recommended)

```tsx
// 1 column mobile, 2 tablet, 3 laptop, 4 desktop, 5 large screens
<Row className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
  <Box className="p-3">
    <img src="..." className="mb-3 min-w-full rounded-full" />
    <p>Content</p>
  </Box>
  {/* repeat */}
</Row>
```

#### 4. Auto-Fit Grid (Plugin)

**Uses:** `@shrutibalasa/tailwind-grid-auto-fit`

```tsx
// Automatically fits items based on min-width (250px default)
<Row className="grid gap-3 grid-auto-fit p-3">
  <Box className="p-3">
    <img src="..." />
    <p>Content</p>
  </Box>
  {/* items auto-arrange */}
</Row>
```

**Benefits:**
- No breakpoint management needed
- Items automatically wrap
- Maintains consistent sizing

---

### Responsive Width Patterns

#### Fixed Width Cards

```tsx
// Cards with fixed width, wrap on overflow
<Row className="flex flex-wrap">
  <Box className="w-80 p-5">Card 1</Box>
  <Box className="w-80 p-5">Card 2</Box>
  <Box className="w-80 p-5">Card 3</Box>
</Row>
```

#### Percentage Width

```tsx
// Full width on mobile, half on tablet, third on desktop
<Box className="w-full md:w-1/2 lg:w-1/3 p-5">
  Content
</Box>
```

#### Max Width Containers

```tsx
// Prose content with max width
<Row className="prose max-w-3xl mx-auto">
  <h1>Article Title</h1>
  <p>Long form content...</p>
</Row>
```

---

### Responsive Images

```tsx
// Full width, responsive height, rounded
<img 
  src="https://picsum.photos/id/12/350/300" 
  className="mb-3 min-w-full rounded-full" 
  alt="Description"
/>

// Next.js Image component (preferred)
<Image
  src="/path/to/image.jpg"
  alt="Description"
  width={350}
  height={300}
  className="mb-3 w-full rounded-full"
/>
```

---

### Layout Patterns

#### Sidebar Layout (Desktop Only)

```tsx
<div className="flex flex-col min-h-screen">
  <Navbar />
  <section className="flex flex-1">
    {/* Sidebar: hidden mobile, visible tablet+ */}
    <div className="hidden md:block h-auto flex-shrink-0 border-4 w-[25rem]">
      <Sidebar />
    </div>
    {/* Main content: grows to fill space */}
    <div className="flex-grow">{children}</div>
  </section>
</div>
```

**Key Classes:**
- `flex flex-col min-h-screen` - Full height vertical layout
- `flex flex-1` - Content area grows
- `hidden md:block` - Sidebar only on tablet+
- `flex-shrink-0` - Sidebar doesn't compress
- `flex-grow` - Main content fills remaining space

---

## Complete Page Examples

### Example 1: Admin Portal Page

**File:** `src/app/(admin)/admin-portal/page.tsx`
```tsx
import AdminPortalPageContent from "./AdminPortalPageContent";

const AdminPortal = () => {
  return <AdminPortalPageContent />;
};

export default AdminPortal;
```

**File:** `src/app/(admin)/admin-portal/AdminPortalPageContent.tsx`
```tsx
import AdminBookingList from "@/components/admin/AdminBookingList";
import BackButton from "@/components/common/BackButton";
import Page from "@/components/common/Page";
import Row from "@/components/common/Row";
import { Button } from "@/components/ui/button";
import Head from "next/head";
import Link from "next/link";
import React from "react";

const AdminPortalPageContent = () => {
  return (
    <>
      <Head>
        <title>Admin Portal</title>
        <meta name="description" content="Admin portal dashboard" />
      </Head>
      
      <Page className="" FULL={false}>
        {/* Action button - floated right */}
        <Link className="float-end" href="/admin-booking">
          <Button className="bg-gray-700 hover:bg-gray-600 text-white">
            Create Booking
          </Button>
        </Link>
        
        {/* Main content - prose styling for typography */}
        <Row className="prose max-w-3xl mx-auto">
          <h1 className="h1">Admin Portal</h1>
          <h2 className="h2">Booked events list:</h2>
          <AdminBookingList />
        </Row>
      </Page>
    </>
  );
};

export default AdminPortalPageContent;
```

**Key Patterns:**
- Minimal `page.tsx` wrapper
- SEO metadata in Head
- Page with `FULL={false}` for centered layout
- Float button for actions
- Prose class for readable typography
- Max-width for content readability

---

### Example 2: Demo Page (Responsive Showcase)

**File:** `src/app/(public)/demo/page.tsx`
```tsx
import DemoPageContent from "./DemoPageContent";

const Home = () => {
  return <DemoPageContent />;
};

export default Home;
```

**File:** `src/app/(public)/demo/DemoPageContent.tsx`
```tsx
import React from "react";
import Head from "next/head";
import Page from "@/components/common/Page";
import Row from "@/components/common/Row";
import Box from "@/components/common/Box";
import { Button } from "@/components/ui/button";

const Demo = () => {
  return (
    <>
      <Head>
        <title>Demo Page</title>
        <meta name="description" content="UI component showcase" />
      </Head>
      
      <Page className="justify-center" FULL={false}>
        {/* Typography & Buttons Row */}
        <Row className="">
          <h1 className="h1">Main Heading</h1>
          <Button className="bg-red-700 hover:bg-red-600 text-white" size="sm">
            Small Button
          </Button>
          <Button className="bg-red-700 hover:bg-red-600 text-white ml-3">
            Default Button
          </Button>
          <Button className="bg-red-700 hover:bg-red-600 text-white ml-3" size="lg">
            Large Button
          </Button>
          
          <h2 className="h2">Subheading</h2>
          <h3 className="h3">Smaller Heading</h3>
          <p>Body text content...</p>
        </Row>
        
        {/* Flex Wrap Cards */}
        <Row className="flex flex-wrap">
          <Box className="w-80 p-5">
            <img 
              src="https://picsum.photos/id/12/350/300" 
              className="mb-3 min-w-full rounded-full" 
              alt=""
            />
            <p>Card content with fixed width (w-80)</p>
          </Box>
          <Box className="w-80 p-5">
            <img 
              src="https://picsum.photos/id/16/350/300" 
              className="mb-3 min-w-full rounded-full" 
              alt=""
            />
            <p>Another card - wraps automatically</p>
          </Box>
        </Row>
        
        {/* Responsive Grid */}
        <Row className="min-w-full text-center prose my-5">
          <h2>Responsive Grid Example</h2>
        </Row>
        
        <Row className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1">
          <Box className="p-3">
            <img 
              src="https://picsum.photos/id/62/350/300" 
              className="mb-3 min-w-full rounded-full" 
              alt=""
            />
            <p>Grid item - 1 col mobile, 5 cols desktop</p>
          </Box>
          {/* Repeat for more items */}
        </Row>
        
        {/* Auto-Fit Grid (Plugin) */}
        <Row className="min-w-full text-center prose my-5">
          <h2>Auto-Fit Grid (No Breakpoints)</h2>
        </Row>
        
        <Row className="grid gap-3 grid-auto-fit p-3">
          <Box className="p-3">
            <img 
              src="https://picsum.photos/id/67/350/300" 
              className="mb-3 min-w-full rounded-full" 
              alt=""
            />
            <p>Auto-arranges based on available space</p>
          </Box>
          {/* More items */}
        </Row>
      </Page>
    </>
  );
};

export default Demo;
```

**Demonstrates:**
- Typography hierarchy (h1, h2, h3, p)
- Button variants and sizes
- Fixed-width flex cards (`w-80`)
- Responsive grid (1-5 columns)
- Auto-fit grid (plugin)
- Image handling
- Proper spacing

---

### Example 3: Members Portal with Layout

**File:** `src/app/(members)/layout.tsx`
```tsx
import { ReactNode } from "react";
import Navbar from "@/components/global/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { protectPage } from "@/utils/supabase/actions";

interface LayoutProps {
  children: ReactNode;
}

export default async function MemberLayout({ children }: LayoutProps) {
  // Server-side protection
  await protectPage(["member"]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar at top */}
      <Navbar />
      
      {/* Content area with sidebar */}
      <section className="flex flex-1">
        {/* Sidebar: hidden mobile, visible tablet+ */}
        <div className="hidden md:block h-auto flex-shrink-0 border-4 w-[25rem]">
          <Sidebar />
        </div>
        
        {/* Main content area */}
        <div className="flex-grow">{children}</div>
      </section>
    </div>
  );
}
```

**File:** `src/app/(members)/members-portal/page.tsx`
```tsx
import MembersPortalPageContent from "./MembersPortalPageContent";

export default function MembersPortalPage() {
  return <MembersPortalPageContent />;
}
```

**File:** `src/app/(members)/members-portal/MembersPortalPageContent.tsx`
```tsx
import Page from "@/components/common/Page";
import Row from "@/components/common/Row";
import Head from "next/head";

const MembersPortalPageContent = () => {
  return (
    <>
      <Head>
        <title>Members Portal</title>
        <meta name="description" content="Members dashboard" />
      </Head>
      
      <Page FULL={false} className="">
        <Row className="">
          <h1 className="h1">Members Portal</h1>
          <p className="text-muted-foreground">
            Welcome to the Members Portal.
          </p>
        </Row>
        
        {/* Add more rows for dashboard widgets */}
      </Page>
    </>
  );
};

export default MembersPortalPageContent;
```

**Layout Hierarchy:**
1. Layout wraps all pages in route group
2. Layout provides Navbar + Sidebar
3. Page content renders in `{children}` slot
4. PageContent component contains actual UI

---

## Quick Reference Checklist

### Creating a New Page

- [ ] Create folder: `src/app/(group)/feature-name/`
- [ ] Create `page.tsx` (minimal wrapper, 3-8 lines)
- [ ] Create `FeatureNamePageContent.tsx` (actual implementation)
- [ ] Import common components: `Page`, `Row`, `Box`
- [ ] Add Head section with title and meta
- [ ] Wrap content in `<Page FULL={false}>`
- [ ] Organize content in `<Row>` sections
- [ ] Use `<Box>` for individual content blocks
- [ ] Test responsive behavior (mobile, tablet, desktop)
- [ ] Verify layout works with sidebar (if applicable)

---

### Component Import Checklist

```tsx
// Common components (layout)
import Page from "@/components/common/Page";
import Row from "@/components/common/Row";
import Box from "@/components/common/Box";
import BackButton from "@/components/common/BackButton";
import Spinner from "@/components/common/Spinner";

// UI components (shadcn/ui)
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Next.js
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";

// React
import React from "react";
```

---

### Responsive Testing Checklist

- [ ] Mobile (320px-640px): Content stacks vertically
- [ ] Tablet (768px-1024px): Sidebar appears, 2-3 columns
- [ ] Desktop (1280px+): Full layout, 3-5 columns
- [ ] Images scale properly
- [ ] Text remains readable
- [ ] Buttons accessible on touch
- [ ] Navigation works on all sizes
- [ ] No horizontal scroll
- [ ] Proper spacing maintained

---

## Suggestions for Improvement

### Current Strengths
1. ✅ Clean separation of page.tsx and PageContent
2. ✅ Reusable common components
3. ✅ Consistent naming conventions
4. ✅ Responsive patterns established
5. ✅ Layout composition with Navbar + Sidebar

### Potential Enhancements

#### 1. Add Header Component
**Current:** No dedicated Header component in common folder

**Suggestion:** Create `src/components/common/Header.tsx`
```tsx
interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;  // Optional action button
  className?: string;
}

const Header = ({ title, subtitle, action, className }: HeaderProps) => {
  return (
    <div className={`mb-6 ${className}`}>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="h1">{title}</h1>
          {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
};
```

**Usage:**
```tsx
<Header 
  title="Admin Portal" 
  subtitle="Manage your bookings"
  action={<Button>Create Booking</Button>}
/>
```

---

#### 2. Create Section Component
**Purpose:** Semantic sections with consistent spacing

```tsx
interface SectionProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

const Section = ({ children, title, className }: SectionProps) => {
  return (
    <section className={`my-8 ${className}`}>
      {title && <h2 className="h2 mb-4">{title}</h2>}
      {children}
    </section>
  );
};
```

---

#### 3. Add Grid Component
**Purpose:** Simplified responsive grid wrapper

```tsx
interface GridProps {
  children: ReactNode;
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: number;
  className?: string;
}

const Grid = ({ children, cols = {}, gap = 4, className }: GridProps) => {
  const { mobile = 1, tablet = 2, desktop = 3 } = cols;
  
  return (
    <div className={`grid grid-cols-${mobile} md:grid-cols-${tablet} lg:grid-cols-${desktop} gap-${gap} ${className}`}>
      {children}
    </div>
  );
};
```

**Usage:**
```tsx
<Grid cols={{ mobile: 1, tablet: 2, desktop: 4 }} gap={4}>
  <Card>Item 1</Card>
  <Card>Item 2</Card>
</Grid>
```

---

#### 4. Component Library Documentation
**Suggestion:** Create Storybook or component showcase

- Visual documentation of all components
- Interactive props playground
- Responsive preview
- Code examples
- Accessibility notes

---

#### 5. Page Templates
**Create starter templates for common page types:**

```
src/templates/
├── DashboardPageTemplate.tsx
├── ListPageTemplate.tsx
├── DetailPageTemplate.tsx
├── FormPageTemplate.tsx
└── README.md
```

**Benefits:**
- Faster page creation
- Consistent structure
- Built-in best practices
- Copy-paste starting point

---

#### 6. Responsive Utilities
**Create helper functions for common responsive patterns:**

```typescript
// src/utils/responsive.ts

export const responsiveGrid = (cols: number) => {
  const breakpoints = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
  };
  return breakpoints[cols] || breakpoints[3];
};

// Usage
<Row className={`grid ${responsiveGrid(4)} gap-4`}>
```

---

#### 7. Layout Variants
**Add more layout options:**

- Full-width hero sections
- Split-screen layouts
- Masonry grid layouts
- Sticky sidebar option
- Collapsible sidebar for mobile

---

#### 8. Performance Optimizations
**Suggestions:**

1. **Lazy load images** in grid layouts
2. **Virtual scrolling** for long lists
3. **Skeleton loaders** for better perceived performance
4. **Memoize** expensive components
5. **Code split** large PageContent files

---

#### 9. Accessibility Improvements
**Add to checklist:**

- [ ] Semantic HTML (header, main, section, article)
- [ ] ARIA labels where needed
- [ ] Keyboard navigation support
- [ ] Focus indicators
- [ ] Screen reader testing
- [ ] Color contrast validation

---

#### 10. Developer Experience Tools

**CLI Tool for Page Generation:**
```bash
npm run create:page admin/users
# Creates:
# - src/app/(admin)/users/page.tsx
# - src/app/(admin)/users/UsersPageContent.tsx
```

**VS Code Snippets:**
```json
{
  "Page Content Component": {
    "prefix": "pagecontent",
    "body": [
      "import React from 'react';",
      "import Head from 'next/head';",
      "import Page from '@/components/common/Page';",
      "import Row from '@/components/common/Row';",
      "",
      "const ${1:ComponentName}PageContent = () => {",
      "  return (",
      "    <>",
      "      <Head>",
      "        <title>${2:Page Title}</title>",
      "        <meta name='description' content='${3:Description}' />",
      "      </Head>",
      "      <Page FULL={false} className=''>",
      "        <Row className=''>",
      "          <h1 className='h1'>${2:Page Title}</h1>",
      "          $0",
      "        </Row>",
      "      </Page>",
      "    </>",
      "  );",
      "};",
      "",
      "export default ${1:ComponentName}PageContent;"
    ]
  }
}
```

---

## Questions & Discussion Points

### For Team Discussion

1. **Component Granularity:** Should we create more specialized components (Header, Section, Grid) or keep it minimal?

2. **Naming Conventions:** Are we happy with `FeatureNamePageContent.tsx` or prefer alternatives like:
   - `FeatureName.content.tsx`
   - `_content.tsx`
   - `index.content.tsx`

3. **Grid System:** Should we standardize on:
   - Manual Tailwind classes (current)
   - Grid component wrapper (proposed)
   - CSS Grid utility classes
   - Combination approach

4. **Mobile Navigation:** How should sidebar work on mobile?
   - Drawer/slide-in menu
   - Bottom navigation
   - Hamburger menu
   - Tab bar

5. **Page Templates:** Which page types should we create templates for?
   - Dashboard
   - List/Table
   - Detail/View
   - Form/Create
   - Settings
   - Profile

6. **Documentation:** How to keep this manual updated?
   - Automated from code comments
   - Manual updates per PR
   - Living Storybook
   - Wiki/Notion

---

## Final Thoughts

This manual captures the **proven patterns** from the starter kit. The approach is:

**Simple → Composable → Consistent → Fast**

By following these patterns, we can:
- ✅ Build pages in 10-15 minutes
- ✅ Maintain consistency across projects
- ✅ Onboard new developers quickly
- ✅ Scale to hundreds of pages
- ✅ Ship faster than vibe coders with better quality

**Remember:** These are guidelines, not rigid rules. Adapt as needed, but document changes here.

---

## Appendix: Common Patterns Quick Copy

### Basic Page Structure
```tsx
<Page FULL={false} className="">
  <Row className="">
    <h1 className="h1">Title</h1>
  </Row>
</Page>
```

### Card Grid
```tsx
<Row className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <Box className="p-5">Card 1</Box>
  <Box className="p-5">Card 2</Box>
  <Box className="p-5">Card 3</Box>
</Row>
```

### Image Card
```tsx
<Box className="w-80 p-5">
  <img src="..." className="mb-3 min-w-full rounded-full" alt="" />
  <h3 className="h3">Title</h3>
  <p>Description</p>
</Box>
```

### Action Header
```tsx
<Row className="flex justify-between items-center mb-6">
  <h1 className="h1">Page Title</h1>
  <Button>Action</Button>
</Row>
```

### Prose Content
```tsx
<Row className="prose max-w-3xl mx-auto">
  <h1>Article Title</h1>
  <p>Long form content...</p>
</Row>
```

---

## 10. Advanced Design Patterns

This section covers advanced patterns extracted from production-grade applications built on this starter kit. These patterns enable scalable, maintainable, and consistent UI development.

---

### 10.1 CVA (Class Variance Authority)

CVA enables type-safe component variants with Tailwind CSS. Instead of conditional class logic scattered throughout components, CVA centralizes variant definitions.

#### What is CVA?

```typescript
// Without CVA: Messy conditional classes
<button
  className={`
    px-4 py-2 rounded-md
    ${variant === 'primary' ? 'bg-primary text-primary-foreground' : ''}
    ${variant === 'secondary' ? 'bg-secondary text-secondary-foreground' : ''}
    ${variant === 'ghost' ? 'bg-transparent hover:bg-accent' : ''}
    ${size === 'sm' ? 'h-8 text-sm' : ''}
    ${size === 'md' ? 'h-10 text-base' : ''}
    ${size === 'lg' ? 'h-12 text-lg' : ''}
  `}
>
  {children}
</button>

// With CVA: Clean, type-safe variants
<Button variant="primary" size="md">{children}</Button>
```

#### Creating Variant Recipes

```typescript
// src/components/ui/button.tsx

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import * as React from 'react';

// Define the variant recipe
export const buttonVariants = cva(
  // Base classes (always applied)
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      // Intent variants
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      // Size variants
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    // Default values
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

// Type-safe props
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

// Component implementation
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
```

#### Type-Safe Props

CVA automatically generates TypeScript types from your variants:

```typescript
// These are automatically typed!
<Button variant="primary" />     // ✅ Valid
<Button variant="secondary" />   // ✅ Valid
<Button variant="invalid" />     // ❌ TypeScript error

<Button size="sm" />             // ✅ Valid
<Button size="xl" />             // ❌ TypeScript error
```

#### CVA Best Practices

| Do ✅ | Don't ❌ |
|-------|---------|
| Keep variant sets small (3-5 options) | Create giant variant matrices |
| Use semantic token classes (`bg-primary`) | Hardcode hex colors |
| Co-locate recipe with component | Scatter variants across files |
| Use `cn()` for className merging | Concatenate strings manually |

---

### 10.2 Design Tokens

Design tokens are the single source of truth for visual design decisions. They're defined as CSS variables and mapped to Tailwind classes.

#### CSS Variables in globals.scss

```scss
// src/app/globals.scss

@layer base {
  :root {
    // Background & Foreground
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;

    // Card
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;

    // Popover
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;

    // Primary (brand color)
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;

    // Secondary
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;

    // Muted (subtle backgrounds)
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;

    // Accent (hover states)
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;

    // Destructive (errors, delete actions)
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;

    // Border, Input, Ring
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;

    // Border Radius
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    // ... dark mode overrides
  }
}
```

#### Tailwind Token Mapping

```typescript
// tailwind.config.ts

export default {
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
};
```

#### Using Tokens in Components

```tsx
// ✅ CORRECT: Use semantic tokens
<div className="bg-background text-foreground">
  <div className="bg-card text-card-foreground rounded-lg border border-border p-4">
    <h2 className="text-foreground">Title</h2>
    <p className="text-muted-foreground">Subtitle</p>
    <Button className="bg-primary text-primary-foreground">Action</Button>
  </div>
</div>

// ❌ WRONG: Hardcoded colors
<div className="bg-white text-gray-900">
  <div className="bg-gray-50 text-gray-800 rounded-lg border border-gray-200 p-4">
    <h2 className="text-gray-900">Title</h2>
    <p className="text-gray-500">Subtitle</p>
    <Button className="bg-blue-600 text-white">Action</Button>
  </div>
</div>
```

#### Dark Mode with Tokens

Because tokens use CSS variables, dark mode works automatically:

```tsx
// This component automatically adapts to dark mode
<div className="bg-background text-foreground">
  {/* In light mode: white background, dark text */}
  {/* In dark mode: dark background, light text */}
</div>

// Toggle dark mode by adding/removing class on html element
document.documentElement.classList.toggle('dark');
```

---

### 10.3 Component Catalogue Pattern

Organize components by domain and document their APIs for team consistency.

#### Domain-Based Organization

```
src/components/
├── ui/                    # Base primitives (shadcn/ui style)
│   ├── button.tsx
│   ├── input.tsx
│   ├── dialog.tsx
│   └── ...
│
├── global/                # App-wide components
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   └── ...
│
├── common/                # Shared utilities
│   ├── Container.tsx
│   ├── Spinner.tsx
│   └── ...
│
├── shop/                  # E-commerce domain
│   ├── ProductList.tsx
│   ├── ProductCard.tsx
│   └── product-page/
│       ├── ProductInfo.tsx
│       └── ...
│
├── cart/                  # Cart domain
│   ├── CartSlide.tsx
│   └── CartItem.tsx
│
└── checkout/              # Checkout domain
    ├── left-pane/
    ├── right-pane/
    └── payments/
```

#### Props and APIs Documentation

Document critical component APIs:

```typescript
// src/components/shop/ProductCard.tsx

/**
 * ProductCard displays a product in a grid or list view.
 *
 * @example
 * ```tsx
 * <ProductCard
 *   product={product}
 *   variant="compact"
 *   onAddToCart={(p) => addToCart(p)}
 * />
 * ```
 */
interface ProductCardProps {
  /** The product data to display */
  product: Product;
  
  /** Display variant */
  variant?: 'default' | 'compact' | 'featured';
  
  /** Callback when add to cart is clicked */
  onAddToCart?: (product: Product) => void;
  
  /** Additional CSS classes */
  className?: string;
}

export const ProductCard = ({
  product,
  variant = 'default',
  onAddToCart,
  className,
}: ProductCardProps) => {
  // Implementation
};
```

#### Component Inventory Template

Keep a living inventory of key components:

| Component | Location | Props | Store Integration |
|-----------|----------|-------|-------------------|
| `Navbar` | `global/Navbar.tsx` | None | `useCartStore` (item count) |
| `ProductCard` | `shop/ProductCard.tsx` | `product`, `variant`, `onAddToCart` | None |
| `CartSlide` | `cart/CartSlide.tsx` | `open`, `onOpenChange` | `useCartStore` |
| `StripePaymentForm` | `checkout/payments/` | `clientSecret`, `onSuccess` | `useCheckoutStore` |

---

### 10.4 Class Ordering Convention

Consistent class ordering improves readability and reduces merge conflicts.

#### Recommended Order

1. **Layout/Display**: `container`, `flex`, `grid`, `block`, `hidden`
2. **Position/Overflow**: `relative`, `absolute`, `z-10`, `overflow-hidden`
3. **Box Model**: `w-`, `h-`, `p-`, `m-`, `gap-`, `space-`
4. **Typography**: `font-`, `text-`, `leading-`, `tracking-`
5. **Visuals**: `bg-`, `border-`, `shadow-`, `ring-`
6. **Effects/Animation**: `transition-`, `duration-`, `animate-`
7. **State Modifiers**: `hover:`, `focus:`, `disabled:`, `aria-`
8. **Responsive**: `sm:`, `md:`, `lg:`, `xl:`

#### Example

```tsx
// ✅ CORRECT: Ordered classes
<button
  className="
    inline-flex items-center justify-center
    relative
    w-full sm:w-auto px-4 py-2 gap-2
    text-sm font-medium
    bg-primary text-primary-foreground
    rounded-md border border-border shadow-sm
    transition-colors
    hover:bg-primary/90 focus-visible:ring-2
    disabled:opacity-50 disabled:pointer-events-none
    md:px-5 md:py-2.5
  "
>
  Continue
</button>

// ❌ WRONG: Random order
<button
  className="
    hover:bg-primary/90 px-4 text-sm
    bg-primary inline-flex md:px-5
    rounded-md w-full transition-colors
    font-medium py-2 items-center
    disabled:opacity-50 border-border
  "
>
  Continue
</button>
```

---

### 10.5 Dark Mode Best Practices

#### Token-Based Approach (Recommended)

```tsx
// Automatically adapts to dark mode
<div className="bg-background text-foreground">
  <div className="bg-card border-border">
    Content
  </div>
</div>
```

#### Explicit Dark Variants (When Needed)

```tsx
// For cases where tokens don't cover your needs
<div className="bg-white dark:bg-gray-900">
  <p className="text-gray-600 dark:text-gray-400">
    This text adapts to dark mode
  </p>
</div>
```

#### Dark Mode Toggle

```typescript
// src/lib/theme.ts

export const toggleDarkMode = () => {
  document.documentElement.classList.toggle('dark');
  
  // Persist preference
  const isDark = document.documentElement.classList.contains('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
};

export const initializeTheme = () => {
  const stored = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (stored === 'dark' || (!stored && prefersDark)) {
    document.documentElement.classList.add('dark');
  }
};
```

---

### 10.6 Touch Device Considerations

#### Tap Target Sizing

Ensure interactive elements are at least 44×44px:

```tsx
// ✅ CORRECT: Adequate tap target
<button className="h-11 px-4 py-3">
  Click me
</button>

// ✅ CORRECT: Icon button with proper size
<button className="h-11 w-11 flex items-center justify-center">
  <Icon className="h-5 w-5" />
</button>

// ❌ WRONG: Too small for touch
<button className="h-6 px-2">
  Click me
</button>
```

#### Focus States

Don't rely solely on hover; provide visible focus states:

```tsx
<button
  className="
    bg-primary text-primary-foreground
    hover:bg-primary/90
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
  "
>
  Action
</button>
```

#### Scroll and Gesture Handling

```tsx
// Horizontal scroll for carousels
<div className="overflow-x-auto scrollbar-hide">
  <div className="flex gap-4 min-w-max">
    {items.map((item) => (
      <Card key={item.id} className="w-64 flex-shrink-0" />
    ))}
  </div>
</div>

// Prevent scroll traps
<div className="overflow-y-auto max-h-[80vh]">
  {/* Scrollable content */}
</div>
```

---

### 10.7 The `cn()` Utility

The `cn()` function merges Tailwind classes intelligently, handling conflicts:

```typescript
// src/lib/utils.ts

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

#### Usage Examples

```tsx
// Merge base classes with props
<div className={cn('p-4 bg-card', className)}>

// Conditional classes
<div className={cn(
  'p-4 rounded-md',
  isActive && 'bg-primary text-primary-foreground',
  isDisabled && 'opacity-50 pointer-events-none'
)}>

// Override conflicts (twMerge handles this)
cn('p-4', 'p-6')  // Result: 'p-6' (not 'p-4 p-6')
cn('text-red-500', 'text-blue-500')  // Result: 'text-blue-500'
```

---

### 10.8 Quick Reference: Do's and Don'ts

#### Do ✅

- Use semantic tokens (`bg-primary`, `text-foreground`)
- Use CVA for components with variants
- Follow class ordering convention
- Ensure 44×44px minimum tap targets
- Use `cn()` for class merging
- Test at custom `lg` breakpoint (1150px)

#### Don't ❌

- Hardcode hex colors (`bg-[#1a1a1a]`)
- Create ad-hoc global CSS classes
- Rely solely on hover states
- Use inline styles for theming
- Duplicate variant logic across components
- Ignore dark mode compatibility

---

**End of Manual**

*Let's build better, faster, together.* 🚀
