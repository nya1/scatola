/*
  Warnings:

  - The primary key for the `Context` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Context` table. All the data in the column will be lost.
  - You are about to drop the column `authData` on the `Source` table. All the data in the column will be lost.
  - Added the required column `settings` to the `Source` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Context" (
    "name" TEXT NOT NULL PRIMARY KEY,
    "tags" TEXT NOT NULL
);
INSERT INTO "new_Context" ("name", "tags") SELECT "name", "tags" FROM "Context";
DROP TABLE "Context";
ALTER TABLE "new_Context" RENAME TO "Context";
CREATE UNIQUE INDEX "Context_name_key" ON "Context"("name");
CREATE TABLE "new_Source" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "importType" TEXT NOT NULL,
    "settings" TEXT NOT NULL,
    "defaultContextToUse" TEXT,
    "defaultTags" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Source_defaultContextToUse_fkey" FOREIGN KEY ("defaultContextToUse") REFERENCES "Context" ("name") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Source" ("createdAt", "defaultContextToUse", "defaultTags", "id", "importType", "type", "updatedAt") SELECT "createdAt", "defaultContextToUse", "defaultTags", "id", "importType", "type", "updatedAt" FROM "Source";
DROP TABLE "Source";
ALTER TABLE "new_Source" RENAME TO "Source";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
