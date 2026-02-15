-- CreateEnum
CREATE TYPE "TicketCategory" AS ENUM ('BILLING', 'TECHNICAL', 'FEATURE_REQUEST');

-- CreateEnum
CREATE TYPE "TicketUrgency" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('PENDING', 'TRIAGED', 'RESOLVED', 'FAILED');

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "category" "TicketCategory",
    "sentiment" INTEGER,
    "urgency" "TicketUrgency",
    "ai_draft" TEXT,
    "agent_draft" TEXT,
    "status" "TicketStatus" NOT NULL DEFAULT 'PENDING',
    "triage_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);
