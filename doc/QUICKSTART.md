# Quick Start - Local Setup

Get the project running on your local machine in 5 minutes.

## Prerequisites

- Node.js 22 or higher
- Docker Desktop (for local PostgreSQL database)

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
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/smithai?sslmode=disable
NODE_ENV=local_development
PORT=3000

# Add these keys manually later (required for full functionality)
# STEDI_API_KEY=your-stedi-key-here
# ENCRYPTION_KEY=your-encryption-key-here
```

**Note:** The app will start without these keys, but you'll need to add them manually later for:
- `STEDI_API_KEY` - Insurance verification API integration
- `ENCRYPTION_KEY` - Encrypting sensitive patient data (SSN, birth dates)

**Generate Encryption Key:**
```bash
# Generate a secure 32-byte encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output and add it to your `.env.local` as `ENCRYPTION_KEY=<generated-key>`

### 4. Start the Application
```bash
npm run dev:local
```

This command will:
- Start Docker PostgreSQL container
- Wait for database to be ready
- Push database schema
- Start the development server

### 5. Access the Application
Open your browser: `http://localhost:3000`

### 6. Create Admin User (First Time Only)

**Important:** You need to manually create an admin user in the database with an encrypted password.

```bash
# Step 1: Generate a bcrypt hash for your password
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('youcantypeAdminPasswordHereWhaterver', 10));"

# Step 2: Copy the output hash from above

# Step 3: Connect to the database
docker exec -it pjt-smith-postgres psql -U postgres -d smithai

# Step 4: In the PostgreSQL prompt, paste this command (replace HASH with your generated hash):
INSERT INTO users (email, username, password, role, "dataSource")
VALUES ('admin@example.com', 'admin', 'PASTE_YOUR_HASH_HERE', 'admin', 'local');

# Step 5: Exit PostgreSQL
\q
```

**Login Credentials:**
- Email: `admin@example.com`
- Password: Whatever you used in Step 1 (e.g., `admin123`)

### 7. Interface Tables for AI (Important)

The AI system checks **3 interface tables** for verification workflows:

1. **Call Transaction Interface** (`if_call_transaction_list`) - Tracks AI call center transactions
2. **Coverage Code Data** (`if_call_coverage_code_list`) - Procedure codes and coverage verification data
3. **Call Message Logs** (`if_call_message_list`) - Communication logs from AI-insurance rep conversations

**Access Interface Tables:**
- Login as admin
- Navigate to `/admin/interface-tables`
- View and manage interface table data
- AI will automatically read/write to these tables during verification

**Note:** These tables are automatically created when you run `npm run db:push`. The AI uses them to coordinate verification workflows and store results.

## Common Commands

```bash
# Start everything (Docker + Server)
npm run dev:local

# Clean restart (stops Docker first)
npm run dev:clean

# Stop Docker containers
npm run docker:down

# Push database schema changes
npm run db:push

# Seed sample data (optional)
npm run seed:transactions
```

## Troubleshooting

### Port Already in Use
If port 5432 is already in use:
```bash
npm run docker:down
npm run dev:clean
```

### Database Connection Issues
Make sure Docker Desktop is running and the container is healthy:
```bash
docker ps
```

### Fresh Start
To completely reset:
```bash
npm run docker:down
docker volume prune -f
npm run dev:clean
```

## Project Structure
```
pjt-smith-demo/
├── backend/          # Express.js API server
├── frontend/         # React application
├── shared/           # Shared schema & types
├── db/               # Database migrations
└── doc/              # Documentation
```

## Next Steps

- See `doc/README.md` for complete documentation
- See `doc/DOCKER_SETUP.md` for Docker troubleshooting
