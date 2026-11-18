# Belle Mirage — Full-Stack Fashion E-commerce

**[Visit the live application](https://belle-mirage-store.vercel.app)** · **[View source code](https://github.com/MOHAMMEDFAYIZT/belle-mirage-store)**

Belle Mirage is a responsive fashion e-commerce application built with React, TypeScript, Supabase, and Razorpay. It includes a customer-facing storefront for discovering and purchasing products, account and order features, and a separate admin area for managing the product catalog and customer orders.

## Screenshots

### Storefront — Homepage

<img width="1323" alt="Belle Mirage homepage" src="https://github.com/user-attachments/assets/c255edc0-a0e3-4df3-a996-975d82a748f7" />

### Product details

<img width="1323" alt="Belle Mirage product details" src="https://github.com/user-attachments/assets/f6b5e9a9-fcc5-4586-8daf-0364da6eb314" />

### Admin dashboard

<img width="1323" height="942" alt="Belle Mirage admin dashboard" src="https://github.com/user-attachments/assets/bd2f88d2-8545-4861-ae07-005ea95edcdd" />

## Features

### Customer storefront

- **Homepage and featured products:** Hero section, brand introduction, and latest in-stock arrivals.
- **Separate collections:** Dedicated men's and women's product listings.
- **Product discovery:** Search products by name, description, or category.
- **Collection sorting:** Sort products by newest, price (low to high or high to low), and name (A–Z).
- **Product detail pages:** Product descriptions, image carousel, availability status, and selectable sizes and colors.
- **Shopping cart:** Cart drawer with selected product variants, quantity controls, item removal, clear-cart action, and order total.
- **Responsive interface:** Layouts and navigation adapted for desktop and mobile screens.

### Customer accounts and orders

- **Authentication:** Email and password sign-up and login, with Google sign-in.
- **Account recovery:** Forgot-password email flow and password reset.
- **Order checkout:** Shipping details form and order summary, with validation for required fields, Indian mobile numbers, and PIN codes.
- **Razorpay checkout:** Server-created payment orders, server-side payment signature verification, amount and currency checks, and payment capture.
- **Order confirmation:** Confirmation page after successful payment verification.
- **Order history:** Signed-in customers can view their orders, purchased items, order status, and delivery estimate.

### Admin area

- **Admin-only access:** Admin pages check the signed-in user's role before showing management tools.
- **Admin dashboard:** Entry point to product and order management.
- **Product catalog management:** Add, edit, and delete products.
- **Product information controls:** Set product ID, name, description, category, selling price, optional original price, stock availability, sizes, and colors.
- **Product image management:** Upload and manage multiple product images.
- **Order management:** View orders and customer/shipping details, search orders, inspect purchased items, and update order status.
- **Shipping workflow:** Print order and shipping details for fulfillment.

## Technology

| Area | Tools |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling and UI | Tailwind CSS, shadcn/ui, Radix UI |
| Routing | React Router |
| Server state and data fetching | TanStack Query |
| Backend and authentication | Supabase, PostgreSQL |
| Server-side payment workflow | Supabase Edge Functions (Deno) |
| Payment gateway | Razorpay |
| Forms and validation | React Hook Form, Zod |
| Icons and charts | Lucide React, Recharts |

## How the payment flow works

1. A signed-in customer submits their cart and shipping information.
2. A Supabase Edge Function validates the cart against current product records, stock, selected variants, and database prices.
3. The function creates a Razorpay order and stores a pending order.
4. Razorpay Checkout handles the payment interaction.
5. The Edge Function verifies the payment signature and checks the order, amount, and currency with Razorpay before marking the order as paid.

**Payment configuration:** The project is set up to use Razorpay test credentials. Use test mode for demonstrations; do not represent this repository as a live-payment production store. Keep the Razorpay key secret and Supabase service-role key in server-side secrets only.

## Run locally

### Prerequisites

- Node.js and npm
- A Supabase project with the required database schema and migrations applied
- Razorpay test credentials
- Supabase CLI or another way to deploy/configure the Edge Function

### 1. Clone the repository

```bash
git clone https://github.com/MOHAMMEDFAYIZT/belle-mirage-store.git
cd belle-mirage-store
npm install
```

### 2. Configure frontend environment variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

### 3. Configure the payment Edge Function

Deploy `create-razorpay-order` and configure its server-side secrets:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

Never expose the service-role key or Razorpay key secret in frontend code, `.env` files that are committed, or public repositories.

### 4. Start the development server

```bash
npm run dev
```

### 5. Build for production

```bash
npm run build
```

## Project structure

```text
src/
├── components/       # Shared storefront and UI components
├── context/          # Shopping cart state
├── integrations/     # Supabase client and generated types
├── pages/            # Storefront, account, checkout, order, and admin pages
└── types/            # Product and order types

supabase/
├── functions/        # Server-side Razorpay order and payment verification
└── migrations/       # Database schema and updates
```

## Notes

- Checkout requires a signed-in customer.
- The cart state is managed client-side; this README does not claim that carts persist across sessions.
- Payment success is not treated as final until the server-side verification flow succeeds.
- Admin capabilities depend on the user's `admin` role in the Supabase `user_roles` table.

---

**Developer:** [Mohammed Fayiz T](https://github.com/MOHAMMEDFAYIZT)
