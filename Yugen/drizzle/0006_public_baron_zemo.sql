CREATE TABLE "api_cache" (
	"key" text PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"payload" text NOT NULL,
	"status_code" integer DEFAULT 200 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"stale_until" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_translations" (
	"id" text PRIMARY KEY NOT NULL,
	"source_hash" text NOT NULL,
	"source_language" text NOT NULL,
	"target_language" text NOT NULL,
	"source_text" text NOT NULL,
	"translated_text" text NOT NULL,
	"provider" text DEFAULT 'automatic' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "api_cache_provider_expiry_idx" ON "api_cache" USING btree ("provider","expires_at");--> statement-breakpoint
CREATE INDEX "api_cache_stale_idx" ON "api_cache" USING btree ("stale_until");--> statement-breakpoint
CREATE UNIQUE INDEX "content_translations_source_target_uq" ON "content_translations" USING btree ("source_hash","target_language");--> statement-breakpoint
CREATE INDEX "content_translations_language_idx" ON "content_translations" USING btree ("source_language","target_language","updated_at");