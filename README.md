# Belle Mirage — E-commerce Web Application

**[View the live application](https://belle-mirage-store.vercel.app)**

Belle Mirage is a full-stack fashion e-commerce application built with React and Supabase. It brings together product discovery, customer accounts, cart management, checkout, order history, and administrative product and order workflows.

## Screenshots

### Homepage

<img width="1323" alt="Belle Mirage homepage" src="https://github.com/user-attachments/assets/c255edc0-a0e3-4df3-a996-975d82a748f7" />

### Product details

<img width="1323" alt="Belle Mirage product details" src="https://github.com/user-attachments/assets/f6b5e9a9-fcc5-4586-8daf-0364da6eb314" />

### Admin dashboard
<img width="1323" height="942" alt="Screenshot from 2026-11-17 16-54-15" src="https://github.com/user-attachments/assets/bd2f88d2-8545-4861-ae07-005ea95edcdd" />


## What it includes

- **Product discovery:** Men's and women's collections, product detail pages, and search results.
- **Customer accounts:** Sign-up, login, authentication callbacks, password recovery, and password reset.
- **Cart and checkout:** Cart state management, shipping details, and a checkout flow integrated with Razorpay.
- **Order workflows:** Order confirmation and customer order history.
- **Admin workflows:** Separate views for product management and order management.
- **Responsive UI:** Layouts designed for desktop and mobile screens.

## Technology

| Area | Tools |
|---|---|
| Frontend | React, TypeScript, Vite |
| UI | Tailwind CSS, shadcn/ui |
| Routing | React Router |
| Server state | TanStack Query |
| Backend services | Supabase |
| Payments | Razorpay |

## Run locally

### Requirements

- Node.js and npm
- A Supabase project
- Razorpay test credentials and the required Supabase Edge Function configuration

### Setup

```bash
git clone https://github.com/MOHAMMEDFAYIZT/belle-mirage-store.git
cd belle-mirage-store
npm install
```

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

Configure the Supabase Edge Function and its server-side secrets separately. Do not put private Razorpay secrets in frontend environment variables or commit credentials to Git.

Start the development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

## Payment note

The repository's checkout flow creates an order through a Supabase Edge Function, opens Razorpay Checkout, and sends the payment response for server-side verification. The project has been configured for Razorpay test-mode use; it should not be presented as a live-payment store.

## Project focus

This project demonstrates the integration of a React storefront with hosted authentication and data services, customer and admin workflows, and a third-party payment checkout.

---

**Developer:** [Mohammed Fayiz T](https://github.com/MOHAMMEDFAYIZT)
