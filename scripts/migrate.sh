#!/bin/bash
echo "Waiting for database..."
until pg_isready -d $DATABASE_URL; do sleep 1; done
echo "Running migrations..."
npx prisma migrate deploy
echo "Checking if seed needed..."
COUNT=$(psql $DATABASE_URL -tAc "SELECT COUNT(*) FROM users")
if [ "$COUNT" = "0" ]; then
  echo "Seeding..."
  npm run seed
fi
echo "Done."
