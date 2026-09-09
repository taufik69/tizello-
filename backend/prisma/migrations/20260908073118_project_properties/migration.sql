-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('TEXT', 'NUMBER', 'SELECT', 'MULTI_SELECT', 'DATE', 'CHECKBOX', 'URL', 'EMAIL', 'PHONE');

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "properties" JSONB;

-- CreateTable
CREATE TABLE "project_property_defs" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PropertyType" NOT NULL,
    "options" JSONB,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_property_defs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_property_defs_workspaceId_idx" ON "project_property_defs"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "project_property_defs_workspaceId_name_key" ON "project_property_defs"("workspaceId", "name");

-- AddForeignKey
ALTER TABLE "project_property_defs" ADD CONSTRAINT "project_property_defs_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

