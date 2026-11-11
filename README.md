# Belle Mirage — E-commerce Platform

Belle Mirage is a full-stack e-commerce application built to provide an online shopping experience with customer authentication, product discovery, cart management, checkout, and order tracking.

## Features

- **Product Catalog:** Browse men's and women's collections and explore individual product details.
- **Search:** Find products through the search interface.
- **Authentication:** Customer signup, login, password recovery, and password reset.
- **Shopping Cart:** Add and manage products before checkout.
- **Checkout:** Complete the checkout flow with Razorpay payment integration in test mode.
- **Order Management:** View customer orders and order confirmation details.
- **Admin Dashboard:** Manage products and review customer orders.
- **Responsive Interface:** Shopping experience designed for different screen sizes.

## Tech Stack

- **Frontend:** React, TypeScript, Vite
- **Styling:** Tailwind CSS, shadcn/ui
- **Backend & Authentication:** Supabase
- **Database:** Supabase
- **Payments:** Razorpay (Test Mode)
- **Routing:** React Router
- **Data Fetching:** TanStack Query

## Getting Started

### Prerequisites

- Node.js
- npm
- A Supabase project
- Razorpay test API credentials

### Installation

```bash
git clone https://github.com/MOHAMMEDFAYIZT/belle-mirage-store.git
cd belle-mirage-store
npm install
```

### Environment Variables

Create a `.env` file in the project root and configure the required environment variables.

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Add any additional Razorpay or backend configuration required by the payment implementation. Never commit secret API keys or credentials.

### Run Locally

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

## Payment Integration

Razorpay is integrated using its test environment. The checkout flow can be tested without processing real payments. Live payment processing is not enabled.

## Project Purpose

This project demonstrates practical full-stack development, including frontend development, backend integration, authentication, database interaction, checkout workflows, and administrative functionality.

---

**Built by [Mohammed Fayiz T](https://github.com/MOHAMMEDFAYIZT)**
