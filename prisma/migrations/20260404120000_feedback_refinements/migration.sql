-- CreateTable: clients
CREATE TABLE "clients" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "mobility_aid" "MobilityAid" NOT NULL DEFAULT 'none',
    "assistance_in_out" BOOLEAN NOT NULL DEFAULT false,
    "general_notes" TEXT,
    "picture_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- AlterTable: users - add address and picture_url
ALTER TABLE "users" ADD COLUMN "address" TEXT;
ALTER TABLE "users" ADD COLUMN "picture_url" TEXT;

-- AlterTable: rides - add new columns before enum migration
ALTER TABLE "rides" ADD COLUMN "client_id" UUID;
ALTER TABLE "rides" ADD COLUMN "facility_name" TEXT;
ALTER TABLE "rides" ADD COLUMN "volunteer_notes" TEXT;
ALTER TABLE "rides" ADD COLUMN "km_driven" DOUBLE PRECISION;
ALTER TABLE "rides" ADD COLUMN "actual_duration_minutes" INTEGER;
ALTER TABLE "rides" ADD COLUMN "confirmed_at" TIMESTAMP(3);
ALTER TABLE "rides" ADD COLUMN "completed_at" TIMESTAMP(3);

-- AddForeignKey: rides.client_id -> clients.id
ALTER TABLE "rides" ADD CONSTRAINT "rides_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Migrate RideStatus enum: available->open, claimed->booked, in_progress->confirmed, cancelled->deleted
ALTER TYPE "RideStatus" RENAME VALUE 'available' TO 'open';
ALTER TYPE "RideStatus" RENAME VALUE 'claimed' TO 'booked';
ALTER TYPE "RideStatus" RENAME VALUE 'in_progress' TO 'confirmed';
ALTER TYPE "RideStatus" RENAME VALUE 'cancelled' TO 'deleted';

-- Migrate NotificationType enum: add new values, remove old
ALTER TYPE "NotificationType" ADD VALUE 'ride_booked';
ALTER TYPE "NotificationType" ADD VALUE 'ride_confirmed';
ALTER TYPE "NotificationType" ADD VALUE 'call_reminder';

-- Migrate existing 'confirmation' notifications to 'ride_confirmed'
UPDATE "notifications" SET "type" = 'ride_confirmed' WHERE "type" = 'confirmation';

-- Now we can safely rename: we need to handle removing 'confirmation'
-- PostgreSQL doesn't support DROP VALUE from enum directly,
-- so we recreate via a new type
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
CREATE TYPE "NotificationType" AS ENUM ('new_ride', 'ride_booked', 'ride_confirmed', 'cancellation', 'reminder', 'call_reminder');
ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "NotificationType" USING ("type"::text::"NotificationType");
DROP TYPE "NotificationType_old";
