#!/bin/bash
set -a
source .env.local
set +a
npx drizzle-kit push
