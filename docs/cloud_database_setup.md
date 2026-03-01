# Cloud Database Setup (PostgreSQL)

This guide explains how to transition the Habit Tracker application from a local SQLite database to a cloud-hosted PostgreSQL database (e.g., Supabase, Neon, AWS RDS, or Heroku Postgres).

## Prerequisites

- A cloud provider account (Supabase and Neon offer excellent free tiers).
- The updated application code (which supports PostgreSQL via the `pg` driver).

## Step 1: Provision a Cloud Database

### Option A: Supabase (Recommended)
1. Go to [supabase.com](https://supabase.com/) and sign up.
2. Create a new project.
3. Once the project is ready, go to **Project Settings** -> **Database**.
4. Under **Connection String**, select **Node.js**.
5. Copy the connection string (URI). It looks like:
   `postgresql://postgres:[YOUR-PASSWORD]@db.xyz.supabase.co:5432/postgres`
   *(Remember to replace `[YOUR-PASSWORD]` with the password you set during project creation)*.

### Option B: Neon
1. Go to [neon.tech](https://neon.tech/) and sign up.
2. Create a project.
3. Copy the **Connection String** from the dashboard.

## Step 2: Update Environment Variables

1. Open your `.env` file in the `Habit_Tracker_Web_App` directory.
2. Add the `DATABASE_URL` variable:

```env
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
```

3. (Optional) If you want to continue using SQLite locally, simply remove or comment out `DATABASE_URL`. The application defaults to SQLite if `DATABASE_URL` is not present.

## Step 3: Application Migration

The application has been updated to support both SQLite (default) and PostgreSQL. When `DATABASE_URL` is detected:
1. It connects to the Postgres database.
2. It automatically creates the necessary tables (`habits`, `users`, etc.) if they don't exist.
3. **Note**: Existing data in your local SQLite file (`habits.db`) will **not** be automatically transferred to the cloud database. You start with a fresh database.

## Troubleshooting

- **Connection Errors**: Ensure your IP address is allowed in the database provider's settings (or use `0.0.0.0/0` for testing).
- **Special Characters**: If your password contains special characters (e.g., `@`, `:`, `/`), you must URL-encode them in the connection string. For example, replace `@` with `%40`.
- **SSL**: Cloud providers usually require SSL. Ensure `?sslmode=require` (or similar) is appended to the connection string, or `ssl: { rejectUnauthorized: false }` is configured in the client (already handled in `server/db/postgres.js`).
- **Docker & IPv6**: Docker containers on Windows/macOS may fail to connect to IPv6-only hosts (like Supabase's direct connection `db.project.supabase.co`) with `ENOTFOUND` or `Network is unreachable`. Use the **Connection Pooler** (Supavisor) URL instead, which supports IPv4. It looks like `postgresql://postgres.project:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`.
