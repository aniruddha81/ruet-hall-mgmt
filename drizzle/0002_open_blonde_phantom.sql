ALTER TABLE "refresh_tokens" RENAME COLUMN "token" TO "token_hash";--> statement-breakpoint
ALTER TABLE "refresh_tokens" ALTER COLUMN "expires_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD COLUMN "jti" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD COLUMN "ip" varchar(45);--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD COLUMN "user_agent" varchar(512);--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD COLUMN "replaced_by" varchar(255);--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD COLUMN "revoked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_token_hash_unique" UNIQUE("token_hash");