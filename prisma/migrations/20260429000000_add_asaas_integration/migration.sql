-- AddColumn: asaasCustomerId and asaasSubscriptionId to users
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "asaasCustomerId"     TEXT,
  ADD COLUMN IF NOT EXISTS "asaasSubscriptionId" TEXT;

-- CreateTable: asaas_webhook_logs
CREATE TABLE IF NOT EXISTS "asaas_webhook_logs" (
  "id"          TEXT        NOT NULL,
  "asaasEvent"  TEXT        NOT NULL,
  "paymentId"   TEXT,
  "payload"     JSONB       NOT NULL,
  "processed"   BOOLEAN     NOT NULL DEFAULT false,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "asaas_webhook_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "asaas_webhook_logs_paymentId_idx"             ON "asaas_webhook_logs"("paymentId");
CREATE INDEX IF NOT EXISTS "asaas_webhook_logs_asaasEvent_idx"            ON "asaas_webhook_logs"("asaasEvent");
CREATE INDEX IF NOT EXISTS "asaas_webhook_logs_processed_createdAt_idx"   ON "asaas_webhook_logs"("processed", "createdAt");
