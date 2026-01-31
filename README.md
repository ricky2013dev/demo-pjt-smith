# Project Smith - Dental Insurance Verification System

AI-powered dental insurance verification system with HIPAA-compliant patient management.

## Quick Start

```bash
npm install      # Install dependencies
npm run dev      # Start the app server
```

See **[QUICKSTART.md](./doc/QUICKSTART.md)** for full setup instructions.

## Database Setup

This application connects to a **remote PostgreSQL database**. Database credentials are read from the `.env.local` file.

### 1. Create the database schema

Run the SQL file manually against your remote PostgreSQL instance:

```bash
psql -h <host> -U <user> -d <database> -f script/db/createDB.sql
```

This creates all required tables. See [createDB.sql](./script/db/createDB.sql) for the full schema.

### 2. Configure environment

Create a `.env.local` file in the project root with your remote database connection string:

```env
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<database>?sslmode=require
NODE_ENV=local_development
PORT=3000
STEDI_API_KEY=<your-stedi-key>
ENCRYPTION_KEY=<your-encryption-key>
```

**Note:** No data seeding scripts are provided. Initial data should be populated manually.

## Documentation

- **[Quick Start Guide](./doc/QUICKSTART.md)** - Get started
- **[Full Documentation](./doc/README.md)** - Complete system documentation
- **[HIPAA Compliance](./doc/HIPAA_SENSITIVE_DATA_GUIDE.md)** - Security guidelines

## Key Features

- HIPAA-compliant patient data management
- AI-powered insurance verification workflow
- OCR insurance card scanning
- Admin panel with role-based access control
- Real-time verification tracking

## Tech Stack

Node.js | Express | React 19 | PostgreSQL | Drizzle ORM | TypeScript

## License

MIT
