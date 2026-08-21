# Project Smith — Dental Insurance Verification System

AI-powered dental insurance verification with HIPAA-compliant patient management.
Automates patient data intake, eligibility verification and benefits analysis.

**On this page** — [Quick Start](#quick-start) · [Project Structure](#project-structure) · [Tech Stack](#tech-stack) · [Commands](#commands)

**Documentation**

| Guide | Covers |
| --- | --- |
| [Database](./docs/database.md) | The in-memory mockup database, editing and regenerating the seed data, and the full table reference |
| [Verification Workflow & API](./docs/api.md) | The five verification steps, the REST endpoints, and roles and the admin panel |
| [HIPAA & Sensitive Data](./docs/hipaa-sensitive-data.md) | Encryption, masking, the decrypt endpoints, and the patterns to follow when adding a sensitive field |
| [Troubleshooting](./docs/troubleshooting.md) | What to check when data, decryption or the dev server misbehaves |
| [Seed data reference](./mockupdata/db/README.md) | Per-table breakdown of the sample rows |

---

## Quick Start

**Prerequisites:** Node.js 22 or higher. No database server is needed.

```bash
git clone <repository-url>
cd pjt-smith-demo
npm install
npm run dev
```

Open `http://localhost:3000`.

### Environment

Create a `.env.local` file in the project root:

```env
NODE_ENV=local_development
PORT=3000
STEDI_API_KEY=<your-stedi-key>
ENCRYPTION_KEY=<your-encryption-key>

# Optional: write API changes back to the mockup JSON files
# MOCK_DB_PERSIST=true

# Optional: load the mockup data from somewhere else
# MOCK_DB_DIR=/absolute/path/to/db
```

- `STEDI_API_KEY` — insurance verification API integration.
- `ENCRYPTION_KEY` — **required**; protects the HIPAA-sensitive fields, including
  the ones encrypted while seeding the mockup database.

Generate an encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Sample logins

One account per role. Passwords are stored in plaintext in `users.json` and
bcrypt-hashed during seeding, so `/api/auth/login` still compares hashes.

| Email | Password | Role | Clinic |
| --- | --- | --- | --- |
| `admin01@inspline.com` | `Admin@123` | admin (system) | — |
| `manager01@inspline.com` | `Manager@123` | manager | Bright Smile Dental Group |
| `dental01@inspline.com` | `Dental@123` | dental | Bright Smile Dental Group |

`admin` is the InSpline system administrator: it belongs to no clinic and signs
in through the admin portal. `manager` and `dental` are the clinic roles and use
the B2B portal; only a manager may edit the clinic's own details.

All 10 sample patients belong to `dental01`. An admin's own `/api/patients` list
is empty; admins read any user's patients through `/api/admin/users/:userId/patients`.

---

## Project Structure

```
pjt-smith-demo/
├── backend/          # Express API, mockup database, auth, OCR, storage
├── frontend/         # React application (src/, index.html, public/)
├── mockupdata/       # Sample data: db/ (one JSON per table) + fixtures
├── shared/           # Drizzle schema and shared types
├── script/           # Build utilities and the mockup data generator
└── docs/             # Guides linked from this README
```

---

## Tech Stack

**Backend** — Node.js, Express, TypeScript, in-memory mockup database
(`backend/mock-db.ts`), Drizzle table definitions (`shared/schema.ts`),
Passport.js local strategy, express-session with memorystore, Tesseract.js OCR
for insurance card scanning, Swagger/OpenAPI.

**Frontend** — React 19, Wouter router, TanStack Query, Radix UI, Tailwind CSS,
React Hook Form with Zod, Recharts, next-themes.

**Tooling** — Vite + esbuild, TypeScript type checking.

The application is fully typed; database types are inferred from the Drizzle
schema using `$inferSelect`.

---

## Commands

```bash
npm run dev        # Start the development server
npm run build      # Build for production
npm run start      # Start the production server
npm run check      # Type check without building
npm run lint       # ESLint
npm run lint:fix   # ESLint with autofix

npx tsx script/db/build-mockupdata.ts   # Regenerate the mockup dataset
```

---

## License

MIT
