# SchemaCraft — Schema-Driven CRUD Platform

> Upload a JSON schema → get a fully working CRUD application instantly.

## What It Does

SchemaCraft is a **metadata-driven application runtime**. You define your data structure once as a JSON config file, and the platform automatically generates:

- A dynamic form UI for data entry
- A data table to browse, edit, and delete records
- Full backend CRUD API routes with automatic validation
- CSV bulk import with row-level error reporting

No hardcoding. No code generation. Everything is driven by the schema at runtime.

---

## Features

- Upload any JSON schema → working CRUD app in seconds
- Dynamic form rendering with 8 field types (text, number, email, select, checkbox, date, textarea, password)
- Automatic validation on both frontend and backend from the same schema definition
- Per-user data isolation — users only see their own schemas and records
- CSV bulk import with per-row validation and error reporting
- Paginated record table with inline edit and delete
- JWT authentication via HTTP-only cookies (XSS-safe)
- Graceful degradation — unknown or broken field types never crash the app
- Fully responsive layout

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Backend | Next.js API Routes |
| Database | PostgreSQL + Prisma ORM |
| Auth | Custom JWT + bcrypt (HTTP-only cookies) |
| Validation | Zod (dynamic schema generation at runtime) |
| Deployment | Vercel + Neon |

---

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/kishnasinghcode/schema-craft
cd schema-craft
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Fill in `.env`:

```env
DATABASE_URL="postgresql://..."    # from Neon (neon.tech)
NEXTAUTH_SECRET="..."              # any long random string, e.g: myrandomsecret123abc
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Set up the database

```bash
# Generate Prisma client
npx prisma generate

# Create all tables
npx prisma migrate deploy
```

> If `migrate deploy` fails, try `npx prisma db push` instead — it does the same thing without needing migration history.

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → sign up → upload a schema → done.

---

## Schema Format

This is the JSON you upload to define an entity:

```json
{
  "entity": "students",
  "title": "Student Management",
  "fields": [
    {
      "name": "fullName",
      "label": "Full Name",
      "type": "text",
      "required": true,
      "minLength": 3,
      "maxLength": 50
    },
    {
      "name": "age",
      "label": "Age",
      "type": "number",
      "required": true,
      "min": 16,
      "max": 100
    },
    {
      "name": "course",
      "label": "Course",
      "type": "select",
      "required": true,
      "options": ["Computer Science", "Engineering", "Business"]
    },
    {
      "name": "email",
      "label": "Email",
      "type": "email",
      "required": true
    },
    {
      "name": "enrolled",
      "label": "Is Enrolled",
      "type": "checkbox"
    },
    {
      "name": "notes",
      "label": "Notes",
      "type": "textarea"
    }
  ]
}
```

### Supported Field Types

| Type | Description | Extra Options |
|---|---|---|
| `text` | Single-line text input | `minLength`, `maxLength` |
| `number` | Numeric input | `min`, `max` |
| `email` | Email with format validation | — |
| `password` | Masked text input | `minLength`, `maxLength` |
| `textarea` | Multi-line text input | `minLength`, `maxLength` |
| `select` | Dropdown with options | `options: string[]` (required) |
| `checkbox` | Boolean toggle | `defaultChecked` |
| `date` | Date picker | — |

> Unknown field types show a graceful warning instead of crashing.

---

## API Reference

### Auth

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register a new account |
| POST | `/api/auth/login` | Log in |
| POST | `/api/auth/logout` | Log out (clears cookie) |
| GET | `/api/auth/me` | Get current logged-in user |

### Schemas

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/schemas` | List all schemas for current user |
| POST | `/api/schemas` | Upload and save a new schema |
| GET | `/api/schemas/:id` | Get a single schema by ID |
| PUT | `/api/schemas/:id` | Update a schema |
| DELETE | `/api/schemas/:id` | Delete schema and all its records |

### Runtime — Dynamic CRUD (works for any entity)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/runtime/:entity` | List records (paginated, `?page=1&limit=20`) |
| POST | `/api/runtime/:entity` | Create a new record |
| GET | `/api/runtime/:entity/:id` | Get one record |
| PUT | `/api/runtime/:entity/:id` | Update a record |
| DELETE | `/api/runtime/:entity/:id` | Delete a record |
| POST | `/api/runtime/:entity/import` | Bulk import rows from CSV |

---

## Project Structure

```
schema-craft/
├── app/
│   ├── api/
│   │   ├── auth/                   # signup, login, logout, me
│   │   ├── schemas/                # schema CRUD
│   │   └── runtime/[entity]/       # dynamic CRUD engine + CSV import
│   ├── login/
│   ├── signup/
│   └── dashboard/
│       ├── layout.tsx              # sidebar navigation + auth guard
│       ├── page.tsx                # overview with stats
│       ├── schemas/                # schema management page
│       └── entity/[entity]/        # dynamic entity page (form + table + import)
│
├── components/
│   ├── fields/
│   │   ├── field-components.tsx    # TextField, NumberField, SelectField, etc.
│   │   └── field-registry.ts       # maps field type string → React component
│   └── forms/
│       ├── dynamic-form.tsx        # renders any schema as a working form
│       ├── dynamic-table.tsx       # renders any records as a paginated table
│       ├── schema-uploader.tsx     # JSON editor with live validation
│       └── csv-importer.tsx        # CSV file upload + bulk import
│
├── contexts/
│   └── auth-context.tsx            # global auth state (login, logout, user)
│
├── lib/
│   ├── prisma.ts                   # Prisma client singleton
│   ├── auth.ts                     # bcrypt password hashing + JWT sign/verify
│   ├── get-current-user.ts         # reads JWT from cookie in API routes
│   ├── types.ts                    # shared TypeScript types
│   ├── utils.ts                    # cn(), formatDate(), safeJsonParse()
│   └── validators/
│       ├── schema-validator.ts     # validates the uploaded schema JSON structure
│       └── record-validator.ts     # dynamically builds Zod schema from field definitions
│
└── prisma/
    ├── schema.prisma               # DB models: User, EntityConfig, EntityRecord
    └── migrations/                 # SQL migration files
```

---

## Architecture Decisions

### Why JSONB storage instead of dynamic table creation?

Dynamically creating a new PostgreSQL table for every schema a user uploads would require raw SQL string generation, which is dangerous and hard to maintain. Instead, all records are stored in a single `entity_records` table with a `dataJson JSONB` column. This approach is safe, predictable, and scales well.

### Why custom JWT instead of a library like NextAuth?

For this use case, NextAuth adds unnecessary complexity. Custom JWT with `jose` + `bcryptjs` is straightforward — sign a token on login, store it in an HTTP-only cookie, verify it on every API request. HTTP-only cookies mean JavaScript on the page can never read the token, which prevents XSS-based token theft.

### Why a component registry pattern?

```typescript
const fieldRegistry = {
  text: TextField,
  number: NumberField,
  select: SelectField,
  // add new types here — nothing else changes
};
```

The form renderer just does `registry[field.type]` to get the right component. Adding a new field type means creating one component and registering it — no changes anywhere else. This makes the system genuinely extensible.

### Why dual validation on both frontend and backend?

The frontend validates for instant UX feedback. The backend validates for security — you can never trust the client. Both use the same schema field definitions as the source of truth, so validation rules are never duplicated or out of sync.

---

## Deployment

### Vercel + Neon (recommended)

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → import your repo
3. Add environment variables in the Vercel dashboard:
   - `DATABASE_URL` — your Neon connection string
   - `NEXTAUTH_SECRET` — same random string from your `.env`
   - `NEXTAUTH_URL` — your Vercel deployment URL (e.g. `https://schema-craft-xyz.vercel.app`)
4. From your local terminal, run the migration against the production database:
   ```bash
   npx prisma migrate deploy
   ```
5. Vercel deploys automatically on every push to `main`

---

## Scripts

```bash
npm run dev          # start development server
npm run build        # production build
npm run start        # start production server
npx prisma generate  # regenerate Prisma client after schema changes
npx prisma db push   # sync schema to database (dev shortcut)
npx prisma studio    # open Prisma visual DB browser
```
