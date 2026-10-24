CREATE TABLE "agent_prospects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"place_id" text,
	"name" text NOT NULL,
	"category" text,
	"area" text,
	"website" text,
	"domain" text,
	"phone" text,
	"email" text,
	"notes" text,
	"status" text DEFAULT 'new' NOT NULL,
	"link_token" text NOT NULL,
	"contact_id" uuid,
	"signed_up_at" timestamp with time zone,
	"last_contacted_at" timestamp with time zone,
	"next_follow_up_at" timestamp with time zone,
	"active_at" timestamp with time zone DEFAULT now() NOT NULL,
	"released_at" timestamp with time zone,
	"release_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_referrals" ADD COLUMN "follow_up_consent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "agent_prospects" ADD CONSTRAINT "agent_prospects_agent_id_sales_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."sales_agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_prospects" ADD CONSTRAINT "agent_prospects_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "agent_prospects_place_active_idx" ON "agent_prospects" USING btree ("place_id") WHERE "agent_prospects"."released_at" is null and "agent_prospects"."place_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "agent_prospects_domain_active_idx" ON "agent_prospects" USING btree ("domain") WHERE "agent_prospects"."released_at" is null and "agent_prospects"."domain" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "agent_prospects_link_token_idx" ON "agent_prospects" USING btree ("link_token");--> statement-breakpoint
CREATE INDEX "agent_prospects_agent_idx" ON "agent_prospects" USING btree ("agent_id","released_at");