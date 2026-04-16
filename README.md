# ⚖️ LexVault — IP Case Management Platform

A full-featured intellectual property case management platform built with Node.js, Express, EJS, Supabase, and Stripe.

## Features

- **Role-Based Access** — Admin, Attorney, and Client dashboards with distinct permissions
- **Case Management** — Full CRUD for trademark, patent, copyright, and trade secret cases
- **Deadline Engine** — Automated tracking with cron-based email alerts at 30/14/7 day thresholds
- **Client Portal** — Read-only case access for clients with status updates
- **Stripe Billing** — Subscription plans (Starter/Pro/Firm) with webhook handling
- **Premium UI** — Dark sidebar, stat cards, urgency indicators, responsive design

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express |
| Views | EJS + express-ejs-layouts |
| Database | Supabase (PostgreSQL + Auth) |
| Payments | Stripe (Subscriptions) |
| Email | Nodemailer |
| Cron | node-cron |

## Quick Start

1. **Clone and install**
   ```bash
   git clone <repo-url>
   cd lexvault
   npm install
   ```

2. **Setup environment**
   ```bash
   cp .env.example .env
   # Fill in your Supabase and Stripe credentials
   ```

3. **Setup database**
   - Go to your Supabase project → SQL Editor
   - Paste and run `supabase/schema.sql`

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open browser**
   Navigate to `http://localhost:3000`

## Default Roles

- The **first user** to register automatically becomes **Admin**
- Subsequent users choose **Attorney** or **Client** during registration
- Admins can change any user's role from the Admin Dashboard

## Project Structure

```
lexvault/
├── src/
│   ├── config/         # Env, Supabase, Stripe initialization
│   ├── middleware/      # Auth, role guard, error handler
│   ├── routes/          # Express routes
│   ├── controllers/     # Route handlers
│   ├── services/        # Cron jobs, email, Stripe helpers
│   ├── views/           # EJS templates
│   ├── public/          # CSS, client-side JS
│   ├── app.js           # Express setup
│   └── server.js        # Entry point
├── supabase/
│   └── schema.sql       # Database schema
├── .env.example
└── package.json
```

## License

ISC
