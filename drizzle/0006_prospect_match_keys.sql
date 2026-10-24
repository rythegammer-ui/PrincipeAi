ALTER TABLE "agent_prospects" ADD COLUMN "name_key" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_prospects" ADD COLUMN "area_key" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_prospects" ADD COLUMN "contact_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "agent_prospects_name_key_idx" ON "agent_prospects" USING btree ("name_key") WHERE "agent_prospects"."released_at" is null;--> statement-breakpoint
UPDATE "agent_prospects" SET "name_key" = lower(regexp_replace("name", '[^a-zA-Z0-9]+', '', 'g')), "area_key" = lower(regexp_replace(split_part(coalesce("area", ''), ',', 1), '[^a-zA-Z0-9]+', '', 'g')), "contact_count" = CASE WHEN "last_contacted_at" IS NOT NULL THEN 1 ELSE 0 END;
