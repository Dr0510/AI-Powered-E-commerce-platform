# Full Stack E-commerce Platform

A production-ready e-commerce web application built with Next.js, React, Tailwind CSS, Neon PostgreSQL, Clerk authentication, Razorpay payments, and Cloudinary media management.

## Features

- Product catalog with product detail pages
- Shopping cart and wishlist flows
- User authentication with Clerk
- Admin product and order management
- Razorpay checkout and webhook handling
- Order history and receipt generation
- Product reviews
- AI assistant integration
- Neon PostgreSQL persistence with normalized relational tables

## Tech Stack

- **Frontend:** Next.js, React, Tailwind CSS
- **Backend:** Next.js API routes, Node.js
- **Database:** Neon PostgreSQL
- **Authentication:** Clerk
- **Payments:** Razorpay
- **Media:** Cloudinary
- **Email:** Resend

## Project Structure

```text
app/                 Next.js app routes and API routes
components/          Reusable UI components
lib/                 API, auth, database, payment, and utility helpers
db/                  PostgreSQL schema and migration notes
public/              Static assets
```

## Getting Started

### Prerequisites

- Node.js 20 or newer
- npm
- Neon PostgreSQL database
- Clerk account
- Razorpay account
- Cloudinary account

### Installation

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Update `.env` with your local credentials.

### Development

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

### Production Build

```bash
npm run build
npm start
```

## Environment Variables

```env
DATABASE_URL=
GEMINI_API_KEY=

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
ADMIN_EMAILS=

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

## GitHub Setup

This repository should include source code, configuration, public assets, package manifests, and `.env.example`.

Do not commit real environment files, build output, dependency folders, logs, or private certificates.

## License

Add your preferred license before publishing the project for public reuse.
