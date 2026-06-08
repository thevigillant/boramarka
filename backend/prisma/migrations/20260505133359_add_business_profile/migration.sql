-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_admin" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "business_name" TEXT NOT NULL DEFAULT '',
    "cnpj" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "photo_url" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "operating_hours" TEXT NOT NULL DEFAULT '',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_admin" ("id", "password_hash", "username") SELECT "id", "password_hash", "username" FROM "admin";
DROP TABLE "admin";
ALTER TABLE "new_admin" RENAME TO "admin";
CREATE UNIQUE INDEX "admin_username_key" ON "admin"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
