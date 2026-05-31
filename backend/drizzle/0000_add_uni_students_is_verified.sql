ALTER TABLE "uni_students" ADD COLUMN IF NOT EXISTS "is_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE "uni_students" SET "is_verified" = true;
