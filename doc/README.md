# Project Smith - Dental Insurance Verification System

## Overview
A comprehensive dental insurance verification system that automates patient data management, insurance verification, and benefits analysis using AI-powered tools.

## Project Structure

```
pjt-smith-demo/
├── backend/          # Express.js server (formerly 'server')
├── frontend/         # React frontend (formerly 'client')
├── shared/           # Shared code and database schema
├── db/              # Database migrations
├── doc/             # All project documentation
├── mockupdata/      # Sample data for testing
└── script/          # Build and utility scripts
```

## Database Schema

The application uses PostgreSQL with Drizzle ORM. The schema is defined in `shared/schema.ts`.

### Core Tables

#### Users
- **Purpose**: Authentication and user management
- **Fields**: id, email, username, password, role, dataSource
- **Relations**: One-to-many with patients and coverageByCode

#### Patients
- **Purpose**: Patient demographic information
- **Fields**: id, userId, active, givenName, familyName, gender, birthDate (encrypted), ssn (encrypted)
- **HIPAA Sensitive**: birthDate and ssn are encrypted
- **Relations**:
  - One-to-many with patientTelecoms, patientAddresses, insurances, appointments, treatments, coverageDetails, verificationStatuses, aiCallHistory, transactions, coverageByCode

#### Patient Telecoms
- **Purpose**: Patient contact information (phone/email)
- **Fields**: id, patientId, system, value

#### Patient Addresses
- **Purpose**: Patient address information
- **Fields**: id, patientId, line1, line2, city, state, postalCode

#### Insurances
- **Purpose**: Patient insurance policy information
- **Fields**: id, patientId, type (Primary/Secondary), provider, policyNumber, groupNumber, subscriberName, subscriberId, relationship, effectiveDate, expirationDate, deductible, deductibleMet, maxBenefit, preventiveCoverage, basicCoverage, majorCoverage

#### Appointments
- **Purpose**: Patient appointment scheduling
- **Fields**: id, patientId, date, time, type, status (scheduled/completed/cancelled), provider

#### Treatments
- **Purpose**: Patient treatment history
- **Fields**: id, patientId, name, date, cost

#### Coverage Details
- **Purpose**: Insurance coverage financial details
- **Fields**: id, patientId, annualMaximum, annualUsed, deductible, deductibleMet
- **Relations**: One-to-many with procedures

#### Procedures
- **Purpose**: Dental procedure coverage information
- **Fields**: id, coverageId, code, name, category (Preventive/Basic/Major/Orthodontic), coverage, estimatedCost, patientPays

#### Verification Statuses
- **Purpose**: Track verification workflow status
- **Fields**: id, patientId, fetchPMS (fetch from PMS), documentAnalysis, apiVerification, callCenter, saveToPMS
- **Status Values**: completed, in_progress, pending

#### Transactions
- **Purpose**: Track all verification transactions
- **Fields**:
  - Core: id, requestId, patientId, type (FETCH/API/CALL/FAX/SAVE), method, startTime, endTime, duration, status (SUCCESS/PARTIAL/FAILED)
  - Patient Info: patientName, insuranceProvider, insuranceRep, runBy
  - Metrics: verificationScore, fetchStatus, saveStatus, responseCode, endpoint, phoneNumber, errorMessage
  - Data: eligibilityCheck, benefitsVerification, coverageDetails, deductibleInfo, transcript, rawResponse
- **Relations**: One-to-many with callCommunications and transactionDataVerified

#### Call Communications
- **Purpose**: Track AI call center conversation details
- **Fields**: id, transactionId, timestamp, speaker (AI/InsuranceRep/System), message, type (question/answer/confirmation/hold/transfer/note)

#### Transaction Data Verified
- **Purpose**: Track which data items were verified in a transaction
- **Fields**: id, transactionId, item

#### AI Call History
- **Purpose**: Track AI call center interaction history
- **Fields**: id, patientId, topic, date, time, summary, duration, agent, status

#### Coverage By Code
- **Purpose**: Detailed coverage verification by procedure code
- **Fields**: id, patientId, userId, saiCode, refInsCode, category, fieldName, preStepValue, verified, verifiedBy, comments, timestamp, coverageData (JSON)

## Technology Stack

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL (Docker for local dev, Neon/Supabase for remote)
- **ORM**: Drizzle ORM
- **Authentication**: Passport.js with local strategy
- **Session**: express-session with connect-pg-simple
- **OCR**: Tesseract.js for insurance card scanning
- **API Documentation**: Swagger/OpenAPI

### Frontend
- **Framework**: React 19
- **Router**: Wouter
- **State Management**: TanStack Query
- **UI Components**: Radix UI
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts
- **Themes**: next-themes

### Development Tools
- **Build**: Vite + esbuild
- **Type Checking**: TypeScript
- **Database Migrations**: Drizzle Kit
- **Containerization**: Docker + Docker Compose (local development)

## Environment Setup

### Prerequisites
- Node.js 22+
- **Database Options:**
  - **Local Development**: Docker + Docker Compose (recommended for local dev)
  - **Remote Development**: PostgreSQL 16 (Neon, Supabase, etc.)

### Environment Variables

#### Local Development with Docker
Create a `.env.local` file:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/smithai?sslmode=disable
NODE_ENV=local_development
PORT=3000
```

#### Development Server with Remote Database
Create a `.env.local` file:

```env
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
NODE_ENV=development
PORT=3000
```

See `doc/DOCKER_SETUP.md` for detailed Docker configuration and troubleshooting.

### Installation

```bash
# Install dependencies
npm install

# Local Development (with Docker)
npm run dev:local          # Starts Docker PostgreSQL + application server
npm run dev:clean          # Clean restart (stops Docker first)

# Development Server (without Docker, remote DB)
npm run dev                # Starts application server only

# Database Management
npm run db:push            # Push database schema
npm run seed:transactions  # Seed transaction data (optional)
npm run docker:down        # Stop Docker containers

# Production
npm run build              # Build for production
npm run start              # Start production server
```

## Database Migrations

Database migrations are managed by Drizzle Kit and stored in `db/migrations/`.

To create a new migration:
```bash
npx drizzle-kit generate
```

To apply migrations:
```bash
npm run db:push
```

See `doc/MIGRATION_GUIDE.md` for detailed migration instructions.

## Security & Compliance

### HIPAA Compliance
This system handles Protected Health Information (PHI) and must comply with HIPAA regulations.

**Encrypted Fields:**
- Patient birth dates
- Social Security Numbers (SSN)

See `doc/HIPAA_SENSITIVE_DATA_GUIDE.md` and `doc/SSN_FIELD_IMPLEMENTATION.md` for detailed security implementation.

### Authentication & Authorization
- Passport.js local strategy
- Password hashing with bcrypt
- Session-based authentication stored in PostgreSQL
- Role-based access control (RBAC)
  - Admin middleware (`requireAdmin`) for admin-only endpoints
  - User ownership validation for resource access
  - Admins can access/modify resources across all users

## API Documentation

API documentation is available via Swagger UI when running the development server:
- Navigate to `/api-docs` endpoint
- Interactive API testing interface
- Complete endpoint documentation

### Key API Endpoints

#### Admin Endpoints (Require Admin Role)
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `GET /api/admin/users/:userId/patients` - Get all patients for a specific user
- `GET /api/admin/interface-tables` - View interface table data

#### Patient Endpoints
- `GET /api/patients` - List patients (user's own or all if admin)
- `POST /api/patients` - Create new patient
- `GET /api/patients/:id` - Get patient details
- `DELETE /api/patients/:id` - Delete patient (owner or admin only)
- `POST /api/patients/:id/decrypt` - Decrypt sensitive patient fields

#### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify current session

## User Roles & Permissions

### Available Roles
- **admin**: Full system access including user and patient management across all users
- **user**: Standard access to own patients and verification workflows
- **dental**: Dental practice-specific role with patient access

### Admin Panel Features

The admin panel provides system-wide management capabilities accessible only to users with admin role.

#### User Management (`/admin/users`)
- View all system users
- Create new users with assigned roles
- Manage user data sources
- Monitor user activity

#### Patient Management (`/admin/patients`)
- **Unified Table View**: See all patients across all users in a single table
- **User Filter**: Filter patients by specific user or view all
- **User Column**: Shows which user each patient belongs to (username + email)
- **Full Patient Details**: Patient ID, name, gender, contact info, insurance, status
- **Admin Delete**: Admins can delete any patient (regular users can only delete their own)
- **Cascade Delete**: Patient deletion removes all related data (appointments, treatments, transactions, etc.)

#### Interface Table Management (`/admin/interface-tables`)
- Manage call transaction interface tables
- View and manage coverage code data
- Monitor call message logs
- Export/sync with external systems

## Workflow Overview

### Insurance Verification Process

1. **Fetch PMS** - Retrieve patient data from Practice Management System
2. **Document Analysis** - OCR scan insurance cards and documents
3. **API Verification** - Automated eligibility checking via insurance APIs (Stedi/Availity)
4. **Call Center** - AI-powered phone verification with insurance providers
5. **Save to PMS** - Update verified information back to PMS

Each step is tracked in the `verificationStatuses` table and detailed transactions are logged in the `transactions` table.

### Transaction Types

- **FETCH**: Retrieve data from PMS
- **API**: Insurance eligibility API calls
- **CALL**: AI call center verification
- **FAX**: Fax-based verification (legacy)
- **SAVE**: Save verified data back to PMS

## Development

### Code Organization

- **backend/**: API routes, database, authentication, OCR, storage
- **frontend/src/**: React components, services, contexts
- **shared/**: Database schema and shared types
- **mockupdata/**: Sample data for development

### Type Safety

The application is fully typed with TypeScript. Database types are automatically inferred from the Drizzle schema using `$inferSelect`.

### Scripts

#### Development
- `npm run dev:local` - Start local development with Docker PostgreSQL
- `npm run dev` - Start server only (for development server with remote DB)
- `npm run dev:clean` - Stop Docker and restart fresh

#### Docker Management
- `npm run docker:up` - Start Docker PostgreSQL only
- `npm run docker:down` - Stop all Docker containers
- `npm run db:wait` - Wait for Docker PostgreSQL to be ready

#### Database
- `npm run db:push` - Push schema changes to database
- `npm run db:setup` - Run database migrations
- `npm run seed:transactions` - Seed sample transaction data

#### Build & Production
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Type check without build

#### Utilities
- `npm run refresh-dates` - Update mockup data with current dates

## Additional Documentation

- `DOCKER_SETUP.md` - Docker setup guide for local development
- `HIPAA_SENSITIVE_DATA_GUIDE.md` - HIPAA compliance and access control guidelines
- `MOCKUPDATA_README.md` - Sample data documentation

## License
MIT
