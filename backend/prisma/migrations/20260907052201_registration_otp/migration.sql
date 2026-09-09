-- CreateTable
CREATE TABLE "registration_codes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registration_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "registration_codes_userId_idx" ON "registration_codes"("userId");

-- CreateIndex
CREATE INDEX "registration_codes_expiresAt_idx" ON "registration_codes"("expiresAt");

-- AddForeignKey
ALTER TABLE "registration_codes" ADD CONSTRAINT "registration_codes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
