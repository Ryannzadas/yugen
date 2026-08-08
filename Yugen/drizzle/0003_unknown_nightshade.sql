ALTER TABLE "anime_revisions" ADD COLUMN "status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "anime_revisions" ADD COLUMN "reviewer_id" text;--> statement-breakpoint
ALTER TABLE "anime_revisions" ADD COLUMN "review_note" text;--> statement-breakpoint
ALTER TABLE "anime_revisions" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "anime_revisions" ADD CONSTRAINT "anime_revisions_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "anime_revisions_moderation_idx" ON "anime_revisions" USING btree ("status","created_at");