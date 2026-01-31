# Quick Start - Setup Guide

Get the project running on your local machine.

## Prerequisites

- Node.js 22 or higher
- Access to a remote PostgreSQL database (e.g., Neon, Supabase, or any hosted PostgreSQL)

## Setup Steps

### 1. Clone the Repository
```bash
git clone <repository-url>
cd pjt-smith-demo
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Create Environment File
Create a file named `.env.local` in the project root:

```env
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<database>?sslmode=require
NODE_ENV=local_development
PORT=3000

# Required for full functionality (add manually)
STEDI_API_KEY=<your-stedi-key>
ENCRYPTION_KEY=<your-encryption-key>
```

**Note:** The app requires these keys for:
- `STEDI_API_KEY` - Insurance verification API integration
- `ENCRYPTION_KEY` - Encrypting sensitive patient data (SSN, birth dates)

**Generate Encryption Key:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output and add it to your `.env.local` as `ENCRYPTION_KEY=<generated-key>`

### 4. Create the Database Schema

Run the SQL schema file against your remote PostgreSQL database:

```bash
psql -h <host> -U <user> -d <database> -f script/db/createDB.sql
```

This creates all required tables. No data seeding is included -- initial data should be populated manually.

### 5. Start the Application
```bash
npm run dev
```

### 6. Access the Application
Open your browser: `http://localhost:3000`

### 7. Interface Tables for AI (Important)

The AI system uses **3 interface tables** for verification workflows:

1. **Call Transaction Interface** (`if_call_transaction_list`) - Tracks AI call center transactions
2. **Coverage Code Data** (`if_call_coverage_code_list`) - Procedure codes and coverage verification data
3. **Call Message Logs** (`if_call_message_list`) - Communication logs from AI-insurance rep conversations

**Access Interface Tables:**
- Login as admin
- Navigate to `/admin/interface-tables`
- View and manage interface table data

## Available Commands

```bash
# Start the app server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Type check
npm run check
```

## Troubleshooting

### Database Connection Issues
Verify your `DATABASE_URL` in `.env.local` is correct and the remote database is reachable:
```bash
psql "<your-database-url>"
```

### Port Already in Use
Change the port in `.env.local`:
```env
PORT=3001
```

## Project Structure
```
pjt-smith-demo/
├── backend/          # Express.js API server
├── frontend/         # React application
├── shared/           # Shared schema & types
├── script/           # Build utilities & DB schema (script/db/createDB.sql)
└── doc/              # Documentation
```

## Next Steps

- See `doc/README.md` for complete documentation
- See `doc/HIPAA_SENSITIVE_DATA_GUIDE.md` for security guidelines
