#!/bin/bash
set -a
source .env.local
set +a
npx drizzle-kit push --force

# Seed test users after db push
echo "Seeding test users..."
npx tsx scripts/seed-users.ts
