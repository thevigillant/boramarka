-- CreateTable
CREATE TABLE "admin" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "scheduling_links" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "token" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Agendamento',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "time_slots" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "link_id" INTEGER NOT NULL,
    CONSTRAINT "time_slots_link_id_fkey" FOREIGN KEY ("link_id") REFERENCES "scheduling_links" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "client_name" TEXT NOT NULL,
    "client_phone" TEXT NOT NULL,
    "time_slot_id" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bookings_time_slot_id_fkey" FOREIGN KEY ("time_slot_id") REFERENCES "time_slots" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_username_key" ON "admin"("username");

-- CreateIndex
CREATE UNIQUE INDEX "scheduling_links_token_key" ON "scheduling_links"("token");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_time_slot_id_key" ON "bookings"("time_slot_id");
