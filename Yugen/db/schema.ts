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
  ...timestamps,
}, (table) => [
  uniqueIndex("users_email_uq").on(table.email),
  uniqueIndex("users_username_uq").on(table.username),
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
  ...timestamps,
}, (table) => [
  uniqueIndex("reviews_author_anime_uq").on(table.authorId, table.animeId),
  index("reviews_anime_idx").on(table.animeId, table.createdAt),
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
  deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
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
  ...timestamps,
}, (table) => [index("reports_status_idx").on(table.status, table.createdAt)]);

export const animeRevisions = pgTable("anime_revisions", {
  id: text("id").primaryKey(),
  animeId: text("anime_id").notNull().references(() => animes.id, { onDelete: "cascade" }),
  editorId: text("editor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  summary: text("summary").notNull(),
  snapshotJson: text("snapshot_json").notNull(),
  approvedAt: timestamp("approved_at", { withTimezone: true, mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
}, (table) => [index("anime_revisions_history_idx").on(table.animeId, table.createdAt)]);
