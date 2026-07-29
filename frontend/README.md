# Frontend - React SPA

## Tech Stack

- **Framework:** React 19 with TypeScript 5.9
- **Build:** Vite 7.2
- **Routing:** React Router 7
- **Styling:** Tailwind CSS 4.1 + Radix UI components (Shadcn pattern)
- **Forms:** React Hook Form
- **Payments:** Stripe.js + React Stripe.js
- **Icons:** Lucide React
- **Notifications:** Sonner (toast)
- **SEO:** React Helmet Async

## Project Structure

```
src/
  api/           API client modules (auth, events, payments, users, etc.)
  assets/        Images and responsive variants
  components/    Reusable UI components (~60 files)
    ui/          Radix/Shadcn primitives (button, card, input, select, etc.)
  context/       React Context providers (Auth, Config, Navigation)
  data/          Static data
  forms/         React Hook Form components (10 forms)
  pages/         Route pages
    upfront_flow/           Multi-year plan creation (steps 1-6)
    subscription_flow/      Subscription creation (steps 2-5)
    single_delivery_flow/   One-time delivery (steps 2-5)
    user_dashboard/         Authenticated user area
      upfront_management/   Plan editing pages
      subscription_management/
    articles/               SEO blog content
    admin/                  Admin dashboard (stub)
  types/         TypeScript interfaces (~90 files)
  utils/         Helpers (validation, debounce, formatting)
```

## Key Patterns

### API Client (`api/`)
- `apiClient.ts` - JWT-authenticated fetch wrapper with automatic token refresh
- Domain-organized modules (auth, events, payments, etc.)
- Centralized error handling via `helpers.ts`
- Barrel export from `index.ts`

### Authentication (Context)
- JWT tokens stored in `localStorage` (access + refresh)
- `AuthContext` manages user state, login, logout
- Automatic token refresh on 401 responses
- Global `auth-failure` event triggers logout on expired refresh token

### Editor Pattern
Reusable editor wrappers (`RecipientEditor`, `PreferencesEditor`, `StructureEditor`, `MessagesEditor`) that:
- Accept generic `getPlan()` and `updatePlan()` functions as props
- Handle loading, saving, navigation internally
- Used across all three plan creation flows and dashboard editing

### Plan Types
Three user-facing flows share backend infrastructure:
- **Upfront Plan:** Multi-year prepaid (years > 1, any frequency)
- **Single Delivery:** Special case upfront plan (years=1, frequency=annually)
- **Subscription:** Recurring Stripe billing

### Payment Flow
1. User completes plan details through step-by-step flow
2. Confirmation page shows summary and initiates payment
3. `PaymentInitiatorButton` creates PaymentIntent/Subscription via API
4. Redirects to `/checkout` with Stripe Elements
5. On completion, redirects to `/payment-status`

## Scripts

- `npm run dev` - Start Vite dev server
- `npm run build` - TypeScript check + production build
- `npm run lint` - ESLint
- `npm run preview` - Preview production build

## Pages

### Public
`/` Home | `/login` | `/contact` | `/florists` | `/terms-and-conditions` | `/forgot-password` | `/reset-password-confirm/:uid/:token` | `/articles/*` (regional SEO content)

### Order Flow
`/` (the brief) -> `/order/recipient` -> `/order/confirmation` -> `/checkout`

Guest checkout: the draft order is authorized by an httponly `guest_checkout_token`
cookie and resolved from it server-side, so these URLs carry no order id.
`/order/preferences` and `/order/structure` are edit targets reached from the
confirmation summary, not numbered steps. `/order` itself redirects to `/`.

### Dashboard (Authenticated)
`/dashboard` Home | `/dashboard/account` | `/dashboard/orders/:planId/*` | `/dashboard/refunds` | `/dashboard/florist/* | /dashboard/affiliate/*` | `/dashboard/admin/*`

### Checkout
`/checkout` | `/payment-status`
