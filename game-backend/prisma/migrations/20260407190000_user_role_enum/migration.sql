-- Create the enum type used by User.role.
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- Normalize legacy string values before converting the column type.
UPDATE "User"
SET "role" = 'USER'
WHERE "role" IS NULL OR "role" NOT IN ('USER', 'ADMIN');

-- Convert the existing role column to the enum without dropping data.
ALTER TABLE "User"
ALTER COLUMN "role" DROP DEFAULT,
ALTER COLUMN "role" TYPE "Role" USING (("role"::text)::"Role"),
ALTER COLUMN "role" SET DEFAULT 'USER';
