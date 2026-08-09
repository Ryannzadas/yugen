import {
  boolean,
  doublePrecision,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
};

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  username: text("username").notNull(),
  displayName: text("display_name"),
  passwordHash: text("password_hash"),
  avatarUrl: text("avatar_url"),
  bannerUrl: text("banner_url"),
  bio: text("bio").notNull().default(""),
  role: text("role", { enum: ["member", "moderator", "admin"] }).notNull().default("member"),
  suspendedAt: timestamp("suspended_at", { withTimezone: true, mode: "string" }),
  suspendedUntil: timestamp("suspended_until", { withTimezone: true, mode: "string" }),
  suspensionReason: text("suspension_reason"),
  suspendedBy: text("suspended_by"),
  ...timestamps,
}, (table) => [
  uniqueIndex("users_email_uq").on(table.email),
  uniqueIndex("users_username_uq").on(table.username),
  index("users_suspension_idx").on(table.suspendedUntil),
]);

export const studios = pgTable("studios", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
}, (table) => [uniqueIndex("studios_slug_uq").on(table.slug)]);

export const animes = pgTable("animes", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  nativeTitle: text("native_title"),
  synopsis: text("synopsis").notNull().default(""),
  format: text("format").notNull().default("TV"),
  episodeCount: integer("episode_count"),
  season: text("season"),
  seasonYear: integer("season_year"),
  airingStatus: text("airing_status").notNull().default("upcoming"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  broadcastDay: text("broadcast_day"),
  broadcastTime: text("broadcast_time"),
  posterUrl: text("poster_url"),
  bannerUrl: text("banner_url"),
  trailerUrl: text("trailer_url"),
  averageRating: doublePrecision("average_rating").notNull().default(0),
  ratingCount: integer("rating_count").notNull().default(0),
  popularityRank: integer("popularity_rank"),
  studioId: text("studio_id").references(() => studios.id, { onDelete: "set null" }),
  ...timestamps,
}, (table) => [
  uniqueIndex("animes_slug_uq").on(table.slug),
  index("animes_catalog_idx").on(table.seasonYear, table.season, table.airingStatus),
  index("animes_studio_idx").on(table.studioId),
]);

export const genres = pgTable("genres", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
}, (table) => [uniqueIndex("genres_slug_uq").on(table.slug)]);

export const animeGenres = pgTable("anime_genres", {
  animeId: text("anime_id").notNull().references(() => animes.id, { onDelete: "cascade" }),
  genreId: text("genre_id").notNull().references(() => genres.id, { onDelete: "cascade" }),
}, (table) => [
  primaryKey({ columns: [table.animeId, table.genreId] }),
  index("anime_genres_genre_idx").on(table.genreId),
]);

export const userAnimeStatuses = pgTable("user_anime_statuses", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  animeId: text("anime_id").notNull().references(() => animes.id, { onDelete: "cascade" }),
  status: text("status", { enum: ["watching", "to_watch", "watched"] }).notNull(),
  score: integer("score"),
  progressEpisodes: integer("progress_episodes").notNull().default(0),
  favorite: boolean("favorite").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.animeId] }),
  index("user_anime_status_idx").on(table.userId, table.status),
]);

export const libraryPreferences = pgTable("library_preferences", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  weeklyEpisodeGoal: integer("weekly_episode_goal").notNull().default(5),
  remindersEnabled: boolean("reminders_enabled").notNull().default(true),
  malUsername: text("mal_username"),
  lastImportedAt: timestamp("last_imported_at", { withTimezone: true, mode: "string" }),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
});

export const episodeHistory = pgTable("episode_history", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  animeId: text("anime_id").notNull().references(() => animes.id, { onDelete: "cascade" }),
  previousProgress: integer("previous_progress").notNull().default(0),
  newProgress: integer("new_progress").notNull(),
  source: text("source", { enum: ["manual", "mal_import"] }).notNull().default("manual"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
}, (table) => [
  index("episode_history_user_date_idx").on(table.userId, table.createdAt),
  index("episode_history_anime_idx").on(table.animeId, table.createdAt),
]);

export const animeReminders = pgTable("anime_reminders", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  animeId: text("anime_id").notNull().references(() => animes.id, { onDelete: "cascade" }),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
}, (table) => [primaryKey({ columns: [table.userId, table.animeId] })]);

export const libraryImports = pgTable("library_imports", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider", { enum: ["myanimelist"] }).notNull().default("myanimelist"),
  externalUsername: text("external_username").notNull(),
  importedCount: integer("imported_count").notNull().default(0),
  status: text("status", { enum: ["running", "completed", "failed"] }).notNull().default("running"),
  errorMessage: text("error_message"),
  completedAt: timestamp("completed_at", { withTimezone: true, mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
}, (table) => [index("library_imports_user_idx").on(table.userId, table.createdAt)]);

export const collections = pgTable("collections", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  privacy: text("privacy", { enum: ["public", "private", "unlisted"] }).notNull().default("public"),
  ...timestamps,
}, (table) => [
  index("collections_owner_idx").on(table.ownerId),
  index("collections_visibility_idx").on(table.privacy, table.createdAt),
]);

export const collectionItems = pgTable("collection_items", {
  collectionId: text("collection_id").notNull().references(() => collections.id, { onDelete: "cascade" }),
  animeId: text("anime_id").notNull().references(() => animes.id, { onDelete: "cascade" }),
  position: integer("position").notNull().default(0),
  note: text("note"),
  addedAt: timestamp("added_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.collectionId, table.animeId] }),
  index("collection_items_order_idx").on(table.collectionId, table.position),
]);

export const collectionCollaborators = pgTable("collection_collaborators", {
  collectionId: text("collection_id").notNull().references(() => collections.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["editor"] }).notNull().default("editor"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.collectionId, table.userId] }),
  index("collection_collaborators_user_idx").on(table.userId),
]);

export const reviews = pgTable("reviews", {
  id: text("id").primaryKey(),
  animeId: text("anime_id").notNull().references(() => animes.id, { onDelete: "cascade" }),
  authorId: text("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body").notNull(),
  score: integer("score").notNull(),
  spoiler: boolean("spoiler").notNull().default(false),
  helpfulCount: integer("helpful_count").notNull().default(0),
  hiddenAt: timestamp("hidden_at", { withTimezone: true, mode: "string" }),
  deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
  moderatedBy: text("moderated_by").references(() => users.id, { onDelete: "set null" }),
  moderationNote: text("moderation_note"),
  ...timestamps,
}, (table) => [
  uniqueIndex("reviews_author_anime_uq").on(table.authorId, table.animeId),
  index("reviews_anime_idx").on(table.animeId, table.createdAt),
]);

export const reviewHelpfulVotes = pgTable("review_helpful_votes", {
  reviewId: text("review_id").notNull().references(() => reviews.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.reviewId, table.userId] }),
  index("review_helpful_votes_user_idx").on(table.userId),
]);

export const discussions = pgTable("discussions", {
  id: text("id").primaryKey(),
  animeId: text("anime_id").notNull().references(() => animes.id, { onDelete: "cascade" }),
  authorId: text("author_id").references(() => users.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  kind: text("kind", { enum: ["general", "episode", "theory", "recommendation"] }).notNull().default("general"),
  episodeNumber: integer("episode_number"),
  locked: boolean("locked").notNull().default(false),
  pinned: boolean("pinned").notNull().default(false),
  ...timestamps,
}, (table) => [index("discussions_anime_idx").on(table.animeId, table.pinned, table.createdAt)]);

export const comments = pgTable("comments", {
  id: text("id").primaryKey(),
  discussionId: text("discussion_id").notNull().references(() => discussions.id, { onDelete: "cascade" }),
  authorId: text("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  parentId: text("parent_id"),
  body: text("body").notNull(),
  likeCount: integer("like_count").notNull().default(0),
  editedAt: timestamp("edited_at", { withTimezone: true, mode: "string" }),
  hiddenAt: timestamp("hidden_at", { withTimezone: true, mode: "string" }),
  deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
  moderatedBy: text("moderated_by").references(() => users.id, { onDelete: "set null" }),
  moderationNote: text("moderation_note"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
}, (table) => [
  index("comments_thread_idx").on(table.discussionId, table.createdAt),
  index("comments_parent_idx").on(table.parentId),
]);

export const commentLikes = pgTable("comment_likes", {
  commentId: text("comment_id").notNull().references(() => comments.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
}, (table) => [primaryKey({ columns: [table.commentId, table.userId] })]);

export const follows = pgTable("follows", {
  followerId: text("follower_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  followingId: text("following_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.followerId, table.followingId] }),
  index("follows_following_idx").on(table.followingId),
]);

export const moderationReports = pgTable("moderation_reports", {
  id: text("id").primaryKey(),
  reporterId: text("reporter_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  commentId: text("comment_id").references(() => comments.id, { onDelete: "cascade" }),
  reviewId: text("review_id").references(() => reviews.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  status: text("status", { enum: ["open", "reviewing", "resolved", "dismissed"] }).notNull().default("open"),
  resolvedBy: text("resolved_by").references(() => users.id, { onDelete: "set null" }),
  resolutionNote: text("resolution_note"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true, mode: "string" }),
  ...timestamps,
}, (table) => [index("reports_status_idx").on(table.status, table.createdAt)]);

export const moderationActions = pgTable("moderation_actions", {
  id: text("id").primaryKey(),
  moderatorId: text("moderator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  targetType: text("target_type", { enum: ["report", "comment", "review", "user", "discussion"] }).notNull(),
  targetId: text("target_id").notNull(),
  action: text("action").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
}, (table) => [index("moderation_actions_date_idx").on(table.moderatorId, table.createdAt)]);

export const animeRevisions = pgTable("anime_revisions", {
  id: text("id").primaryKey(),
  animeId: text("anime_id").notNull().references(() => animes.id, { onDelete: "cascade" }),
  editorId: text("editor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  summary: text("summary").notNull(),
  snapshotJson: text("snapshot_json").notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  reviewerId: text("reviewer_id").references(() => users.id, { onDelete: "set null" }),
  reviewNote: text("review_note"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: "string" }),
  approvedAt: timestamp("approved_at", { withTimezone: true, mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
}, (table) => [
  index("anime_revisions_history_idx").on(table.animeId, table.createdAt),
  index("anime_revisions_moderation_idx").on(table.status, table.createdAt),
]);

export const apiCache = pgTable("api_cache", {
  key: text("key").primaryKey(),
  provider: text("provider", { enum: ["jikan", "shikimori"] }).notNull(),
  payload: text("payload").notNull(),
  statusCode: integer("status_code").notNull().default(200),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }).notNull(),
  staleUntil: timestamp("stale_until", { withTimezone: true, mode: "string" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
}, (table) => [
  index("api_cache_provider_expiry_idx").on(table.provider, table.expiresAt),
  index("api_cache_stale_idx").on(table.staleUntil),
]);

export const contentTranslations = pgTable("content_translations", {
  id: text("id").primaryKey(),
  sourceHash: text("source_hash").notNull(),
  sourceLanguage: text("source_language", { enum: ["en", "ru"] }).notNull(),
  targetLanguage: text("target_language", { enum: ["pt", "es", "en"] }).notNull(),
  sourceText: text("source_text").notNull(),
  translatedText: text("translated_text").notNull(),
  provider: text("provider").notNull().default("automatic"),
  ...timestamps,
}, (table) => [
  uniqueIndex("content_translations_source_target_uq").on(table.sourceHash, table.targetLanguage),
  index("content_translations_language_idx").on(table.sourceLanguage, table.targetLanguage, table.updatedAt),
]);
