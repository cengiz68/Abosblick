-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Contract" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAddress" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL,
    "customerNumber" TEXT,
    "contractNumber" TEXT,
    "monthlyPrice" INTEGER NOT NULL,
    "startDate" DATETIME NOT NULL,
    "minTermMonths" INTEGER NOT NULL,
    "noticeValue" INTEGER NOT NULL,
    "noticeUnit" TEXT NOT NULL DEFAULT 'MONTHS',
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "renewalMonths" INTEGER NOT NULL DEFAULT 12,
    "endOfMonth" BOOLEAN NOT NULL DEFAULT false,
    "providerKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "cancelledAt" DATETIME,
    "notes" TEXT,
    "sourceFileId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Contract_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Contract" ("autoRenew", "cancelledAt", "category", "contractNumber", "createdAt", "customerNumber", "id", "minTermMonths", "monthlyPrice", "notes", "noticeUnit", "noticeValue", "provider", "providerAddress", "renewalMonths", "sourceFileId", "startDate", "status", "updatedAt", "userId") SELECT "autoRenew", "cancelledAt", "category", "contractNumber", "createdAt", "customerNumber", "id", "minTermMonths", "monthlyPrice", "notes", "noticeUnit", "noticeValue", "provider", "providerAddress", "renewalMonths", "sourceFileId", "startDate", "status", "updatedAt", "userId" FROM "Contract";
DROP TABLE "Contract";
ALTER TABLE "new_Contract" RENAME TO "Contract";
CREATE INDEX "Contract_userId_idx" ON "Contract"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");
