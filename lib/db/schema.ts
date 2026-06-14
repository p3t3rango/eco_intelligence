import { pgTable, text, timestamp, boolean, serial, integer, jsonb } from "drizzle-orm/pg-core"

// --- Better Auth required tables -------------------------------------------
// Column names are camelCase to match Better Auth's defaults. Do not rename.

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
})

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
})

// --- App tables ------------------------------------------------------------

// Extended public profile for each grower.
export const profiles = pgTable("profiles", {
  userId: text("userId").primaryKey(),
  displayName: text("displayName").notNull(),
  handle: text("handle").notNull(),
  bio: text("bio"),
  avatarUrl: text("avatarUrl"),
  locationLabel: text("locationLabel"),
  lat: text("lat"),
  lng: text("lng"),
  climateZone: text("climateZone"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

// A yard analysis post.
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  imageUrl: text("imageUrl").notNull(),
  title: text("title"),
  caption: text("caption"),
  // Privacy: analyses are private by default; sharing to the community is opt-in.
  isShared: boolean("isShared").notNull().default(false),
  sharedAt: timestamp("sharedAt"),
  locationLabel: text("locationLabel"),
  lat: text("lat"),
  lng: text("lng"),
  climateZone: text("climateZone"),
  // Overall Regenerative Score 0-100
  regenScore: integer("regenScore").notNull().default(0),
  // Sub-scores 0-100
  biodiversityScore: integer("biodiversityScore").notNull().default(0),
  pollinatorScore: integer("pollinatorScore").notNull().default(0),
  sunlightScore: integer("sunlightScore").notNull().default(0),
  soilScore: integer("soilScore").notNull().default(0),
  foodScore: integer("foodScore").notNull().default(0),
  waterScore: integer("waterScore").notNull().default(0),
  // Full structured AI analysis (reading + plan)
  analysis: jsonb("analysis"),
  // Phase 2: the grower's chosen goals (GoalKey[]) and flow state.
  goals: jsonb("goals").$type<string[]>().default([]),
  // "reading" once the photo is analyzed; "complete" once goals + plan exist.
  status: text("status").notNull().default("complete"),
  // Phase 3: AI planting visualization.
  renderUrl: text("renderUrl"), // Gemini-transformed "here's your yard" image
  layout: jsonb("layout"), // { markers: PlantingMarker[] } for the planting map
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  postId: integer("postId").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  postId: integer("postId").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

// Trackable action-plan items generated from the AI recommendations.
export const yardTasks = pgTable("yard_tasks", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  postId: integer("postId").notNull(),
  label: text("label").notNull(),
  detail: text("detail"),
  category: text("category"),
  impact: text("impact"),
  done: boolean("done").notNull().default(false),
  sortOrder: integer("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  completedAt: timestamp("completedAt"),
})
