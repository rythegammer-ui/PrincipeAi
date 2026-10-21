CREATE TABLE "admin_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"added_by" text,
	"session_version" integer DEFAULT 1 NOT NULL,
	"last_login_at" timestamp with time zone,
	"removed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"metric" text DEFAULT 'sales' NOT NULL,
	"target" integer NOT NULL,
	"bonus_cents" integer DEFAULT 0 NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"cancelled_at" timestamp with time zone,
	"awarded_at" timestamp with time zone,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_commissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"order_id" uuid,
	"contact_id" uuid,
	"challenge_id" uuid,
	"sale_cents" integer DEFAULT 0 NOT NULL,
	"rate_bps" integer DEFAULT 0 NOT NULL,
	"level" text,
	"amount_cents" integer NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"status" text DEFAULT 'held' NOT NULL,
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"payout_id" uuid,
	"is_test" boolean DEFAULT false NOT NULL,
	"note" text,
	"voided_at" timestamp with time zone,
	"void_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"amount_cents" integer NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"method" text,
	"reference" text,
	"note" text,
	"created_by" text,
	"paid_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_referrals" (
	"contact_id" uuid PRIMARY KEY NOT NULL,
	"agent_id" uuid NOT NULL,
	"source" text DEFAULT 'link' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"city" text,
	"state" text,
	"code" text,
	"status" text DEFAULT 'applied' NOT NULL,
	"application" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"payout_method" text,
	"payout_handle" text,
	"show_on_leaderboard" boolean DEFAULT true NOT NULL,
	"notes" text,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"approved_at" timestamp with time zone,
	"last_sale_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_commissions" ADD CONSTRAINT "agent_commissions_agent_id_sales_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."sales_agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_commissions" ADD CONSTRAINT "agent_commissions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_commissions" ADD CONSTRAINT "agent_commissions_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_commissions" ADD CONSTRAINT "agent_commissions_challenge_id_agent_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."agent_challenges"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_commissions" ADD CONSTRAINT "agent_commissions_payout_id_agent_payouts_id_fk" FOREIGN KEY ("payout_id") REFERENCES "public"."agent_payouts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_payouts" ADD CONSTRAINT "agent_payouts_agent_id_sales_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."sales_agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_referrals" ADD CONSTRAINT "agent_referrals_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_referrals" ADD CONSTRAINT "agent_referrals_agent_id_sales_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."sales_agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "admin_members_email_idx" ON "admin_members" USING btree ("email");--> statement-breakpoint
CREATE INDEX "agent_challenges_ends_idx" ON "agent_challenges" USING btree ("ends_at");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_commissions_order_kind_idx" ON "agent_commissions" USING btree ("order_id","kind");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_commissions_challenge_agent_idx" ON "agent_commissions" USING btree ("challenge_id","agent_id");--> statement-breakpoint
CREATE INDEX "agent_commissions_agent_idx" ON "agent_commissions" USING btree ("agent_id","created_at");--> statement-breakpoint
CREATE INDEX "agent_commissions_payout_idx" ON "agent_commissions" USING btree ("payout_id");--> statement-breakpoint
CREATE INDEX "agent_payouts_agent_idx" ON "agent_payouts" USING btree ("agent_id","paid_at");--> statement-breakpoint
CREATE INDEX "agent_referrals_agent_idx" ON "agent_referrals" USING btree ("agent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sales_agents_email_idx" ON "sales_agents" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "sales_agents_code_idx" ON "sales_agents" USING btree ("code");--> statement-breakpoint
CREATE INDEX "sales_agents_status_idx" ON "sales_agents" USING btree ("status");