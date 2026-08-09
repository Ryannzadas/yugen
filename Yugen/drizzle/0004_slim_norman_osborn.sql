CREATE TABLE "anime_reminders" (
	"user_id" text NOT NULL,
	"anime_id" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "anime_reminders_user_id_anime_id_pk" PRIMARY KEY("user_id","anime_id")
);
--> statement-breakpoint
CREATE TABLE "episode_history" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"anime_id" text NOT NULL,
	"previous_progress" integer DEFAULT 0 NOT NULL,
	"new_progress" integer NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "library_imports" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"provider" text DEFAULT 'myanimelist' NOT NULL,
	"external_username" text NOT NULL,
	"imported_count" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"error_message" text,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "library_preferences" (
	"user_id" text PRIMARY KEY NOT NULL,
	"weekly_episode_goal" integer DEFAULT 5 NOT NULL,
	"reminders_enabled" boolean DEFAULT true NOT NULL,
	"mal_username" text,
	"last_imported_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "animes" ADD COLUMN "broadcast_day" text;--> statement-breakpoint
ALTER TABLE "animes" ADD COLUMN "broadcast_time" text;--> statement-breakpoint
ALTER TABLE "anime_reminders" ADD CONSTRAINT "anime_reminders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_reminders" ADD CONSTRAINT "anime_reminders_anime_id_animes_id_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."animes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "episode_history" ADD CONSTRAINT "episode_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "episode_history" ADD CONSTRAINT "episode_history_anime_id_animes_id_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."animes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_imports" ADD CONSTRAINT "library_imports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_preferences" ADD CONSTRAINT "library_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "episode_history_user_date_idx" ON "episode_history" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "episode_history_anime_idx" ON "episode_history" USING btree ("anime_id","created_at");--> statement-breakpoint
CREATE INDEX "library_imports_user_idx" ON "library_imports" USING btree ("user_id","created_at");