CREATE TABLE "FollowUpTask" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "companyId" TEXT NOT NULL REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 "customerId" TEXT NOT NULL REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 "jobId" TEXT REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE,
 "assigneeId" TEXT REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
 "title" TEXT NOT NULL, "notes" TEXT NOT NULL DEFAULT '', "messageDraft" TEXT NOT NULL DEFAULT '',
 "checklist" JSONB NOT NULL DEFAULT '[]', "dueAt" TIMESTAMP(3) NOT NULL,
 "status" TEXT NOT NULL DEFAULT 'OPEN' CHECK ("status" IN ('OPEN','COMPLETED','CANCELLED')),
 "completedAt" TIMESTAMP(3), "aiResultId" TEXT, "version" INTEGER NOT NULL DEFAULT 1,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "FollowUpTask_companyId_status_dueAt_idx" ON "FollowUpTask"("companyId","status","dueAt");
CREATE INDEX "FollowUpTask_customerId_idx" ON "FollowUpTask"("customerId");
CREATE INDEX "FollowUpTask_jobId_idx" ON "FollowUpTask"("jobId");
