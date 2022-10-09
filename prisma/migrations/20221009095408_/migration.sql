-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "webUrl" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduled" DATETIME,
    "due" DATETIME,
    "tags" TEXT,
    "rawImportedData" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "fromSourceId" TEXT,
    CONSTRAINT "Task_fromSourceId_fkey" FOREIGN KEY ("fromSourceId") REFERENCES "Source" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("createdAt", "description", "due", "fromSourceId", "id", "projectName", "rawImportedData", "scheduled", "tags", "title", "updatedAt", "webUrl") SELECT "createdAt", "description", "due", "fromSourceId", "id", "projectName", "rawImportedData", "scheduled", "tags", "title", "updatedAt", "webUrl" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
