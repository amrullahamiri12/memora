-- CreateEnum
CREATE TYPE "AuditSource" AS ENUM ('APP', 'DB_TRIGGER');

-- gen_random_uuid() for trigger-generated audit row ids
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateTable
CREATE TABLE "audit_events" (
    "id" TEXT NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" "AuditSource" NOT NULL DEFAULT 'APP',
    "action" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "actor_email" TEXT,
    "actor_role" TEXT,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "target_user_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "metadata" JSONB,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_events_occurred_at_idx" ON "audit_events"("occurred_at" DESC);

-- CreateIndex
CREATE INDEX "audit_events_action_idx" ON "audit_events"("action");

-- CreateIndex
CREATE INDEX "audit_events_actor_user_id_idx" ON "audit_events"("actor_user_id");

-- CreateIndex
CREATE INDEX "audit_events_target_user_id_idx" ON "audit_events"("target_user_id");

-- CreateIndex
CREATE INDEX "audit_events_entity_type_entity_id_idx" ON "audit_events"("entity_type", "entity_id");

-- BEFORE DELETE on users: archive row snapshot for direct SQL deletes
CREATE OR REPLACE FUNCTION audit_user_before_delete()
RETURNS TRIGGER AS $$
DECLARE
  snapshot JSONB;
BEGIN
  snapshot := jsonb_build_object(
    'id', OLD.id,
    'name', OLD.name,
    'email', OLD.email,
    'role', OLD.role,
    'google_id', OLD.google_id,
    'email_verified_at', OLD.email_verified_at,
    'deactivated_at', OLD.deactivated_at,
    'created_at', OLD.created_at
  );

  INSERT INTO audit_events (
    id,
    occurred_at,
    source,
    action,
    target_user_id,
    entity_type,
    entity_id,
    actor_email,
    actor_role,
    metadata
  ) VALUES (
    gen_random_uuid()::text,
    NOW(),
    'DB_TRIGGER',
    'USER_DELETED_DB',
    OLD.id,
    'user',
    OLD.id,
    OLD.email,
    OLD.role::text,
    jsonb_build_object('snapshot', snapshot)
  );

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_audit_before_delete
  BEFORE DELETE ON users
  FOR EACH ROW
  EXECUTE FUNCTION audit_user_before_delete();
