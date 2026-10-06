import {
  boolean,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    merchant: text("merchant").notNull(),
    note: text("note"),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    category: text("category").notNull().default("Other"),
    purchasedAt: timestamp("purchased_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    paymentMethod: text("payment_method"),
    source: text("source").notNull().default("manual"),
    sourceReference: text("source_reference"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    purchasedAtIndex: index("transactions_purchased_at_idx").on(table.purchasedAt),
    sourceReferenceUnique: uniqueIndex("transactions_source_reference_unique").on(
      table.sourceReference,
    ),
  }),
);

export const receipts = pgTable(
  "receipts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    transactionId: uuid("transaction_id")
      .notNull()
      .references(() => transactions.id, { onDelete: "cascade" }),
    fileName: text("file_name").notNull(),
    mimeType: text("mime_type").notNull(),
    fileData: text("file_data").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    transactionUnique: uniqueIndex("receipts_transaction_id_unique").on(table.transactionId),
  }),
);

export const emailConnections = pgTable(
  "email_connections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    provider: text("provider").notNull(),
    email: text("email").notNull(),
    status: text("status").notNull().default("connected"),
    previewMode: boolean("preview_mode").notNull().default(true),
    connectedAt: timestamp("connected_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true, mode: "date" }),
  },
  (table) => ({
    emailUnique: uniqueIndex("email_connections_email_unique").on(table.email),
  }),
);

export const budgets = pgTable(
  "budgets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    category: text("category").notNull(),
    monthlyLimit: numeric("monthly_limit", { precision: 10, scale: 2 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    categoryUnique: uniqueIndex("budgets_category_unique").on(table.category),
  }),
);
