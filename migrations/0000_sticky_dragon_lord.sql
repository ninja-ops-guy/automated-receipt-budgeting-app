CREATE TABLE "budgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" text NOT NULL,
	"monthly_limit" numeric(10, 2) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"email" text NOT NULL,
	"status" text DEFAULT 'connected' NOT NULL,
	"preview_mode" boolean DEFAULT true NOT NULL,
	"connected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_synced_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"file_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"file_data" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merchant" text NOT NULL,
	"note" text,
	"amount" numeric(10, 2) NOT NULL,
	"category" text DEFAULT 'Other' NOT NULL,
	"purchased_at" timestamp with time zone DEFAULT now() NOT NULL,
	"payment_method" text,
	"source" text DEFAULT 'manual' NOT NULL,
	"source_reference" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "budgets_category_unique" ON "budgets" USING btree ("category");--> statement-breakpoint
CREATE UNIQUE INDEX "email_connections_email_unique" ON "email_connections" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "receipts_transaction_id_unique" ON "receipts" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "transactions_purchased_at_idx" ON "transactions" USING btree ("purchased_at");--> statement-breakpoint
CREATE UNIQUE INDEX "transactions_source_reference_unique" ON "transactions" USING btree ("source_reference");