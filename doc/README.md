# Project Smith - Dental Insurance Verification System

## Overview
A comprehensive dental insurance verification system that automates patient data management, insurance verification, and benefits analysis using AI-powered tools.

## Project Structure

```
pjt-smith-demo/
├── backend/          # Express.js server
├── frontend/         # React frontend
├── shared/           # Shared code and database schema
├── doc/             # All project documentation
└── script/          # Build utilities & DB schema (script/db/createDB.sql)
```

## Database Setup

The application uses a **remote PostgreSQL database**. All connection credentials are read from the `.env.local` file.

### Schema Creation

Run the schema file manually against your PostgreSQL instance:

```bash
psql -h <host> -U <user> -d <database> -f script/db/createDB.sql
```

The full schema is defined in `script/db/createDB.sql`. The Drizzle ORM schema definition lives in `shared/schema.ts` for type-safe database access in application code.

**Note:** No data seeding scripts are provided. Initial data should be populated manually.

### Core Tables

#### Users
- **Purpose**: Authentication and user management
- **Fields**: id, email, username, password, role, stediMode
- **Relations**: One-to-many with patients and coverageByCode

#### Patients
- **Purpose**: Patient demographic information
- **Fields**: id, userId, active, givenName, familyName, gender, birthDate (encrypted), ssn (encrypted)
- **HIPAA Sensitive**: birthDate and ssn are encrypted
- **Relations**: One-to-many with patientTelecoms, patientAddresses, insurances, appointments, treatments, coverageDetails, verificationStatuses, aiCallHistory, transactions, coverageByCode

#### Patient Telecoms
- **Purpose**: Patient contact information (phone/email)
- **Fields**: id, patientId, system, value

#### Patient Addresses
- **Purpose**: Patient address information
- **Fields**: id, patientId, line1, line2, city, state, postalCode

#### Insurances
- **Purpose**: Patient insurance policy information
- **Fields**: id, patientId, provider, payerId, employerName, groupNumber, subscriberName, subscriberId, relationship, effectiveDate, expirationDate, deductible, deductibleMet, maxBenefit, preventiveCoverage, basicCoverage, majorCoverage

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
- **Fields**: id, patientId, fetchPMS, documentAnalysis, apiVerification, callCenter, saveToPMS
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
- **Database**: PostgreSQL (remote)
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
- **Database Schema**: Drizzle Kit (schema definition in `shared/schema.ts`)

## Environment Setup

### Prerequisites
- Node.js 22+
- Remote PostgreSQL 16 database (Neon, Supabase, or any hosted provider)

### Environment Variables

Create a `.env.local` file in the project root:

```env
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<database>?sslmode=require
NODE_ENV=local_development
PORT=3000
STEDI_API_KEY=<your-stedi-key>
ENCRYPTION_KEY=<your-encryption-key>
```

### Installation

```bash
# Install dependencies
npm install

# Create the database schema (run manually)
psql -h <host> -U <user> -d <database> -f script/db/createDB.sql

# Start the development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

## Security & Compliance

### HIPAA Compliance
This system handles Protected Health Information (PHI) and must comply with HIPAA regulations.

**Encrypted Fields:**
- Patient birth dates
- Social Security Numbers (SSN)

See `doc/HIPAA_SENSITIVE_DATA_GUIDE.md` for detailed security implementation.

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
- Navigate to `/docs` endpoint
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

#### Patient Management (`/admin/patients`)
- **Unified Table View**: See all patients across all users in a single table
- **User Filter**: Filter patients by specific user or view all
- **Full Patient Details**: Patient ID, name, gender, contact info, insurance, status
- **Admin Delete**: Admins can delete any patient

#### Interface Table Management (`/admin/interface-tables`)
- Manage call transaction interface tables
- View and manage coverage code data
- Monitor call message logs

## Workflow Overview

### Insurance Verification Process

1. **Fetch PMS** - Retrieve patient data from Practice Management System
2. **Document Analysis** - OCR scan insurance cards and documents
3. **API Verification** - Automated eligibility checking via insurance APIs (Stedi/Availity)
4. **Call Center** - AI-powered phone verification with insurance providers
5. **Save to PMS** - Update verified information back to PMS

Each step is tracked in the `verification_statuses` table and detailed transactions are logged in the `transactions` table.

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

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Type check without build

## Additional Documentation

- `HIPAA_SENSITIVE_DATA_GUIDE.md` - HIPAA compliance and access control guidelines

## License
MIT
