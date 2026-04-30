-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'STAFF');
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'CARD', 'OTHER');
CREATE TYPE "ExpenseCategory" AS ENUM ('RENT', 'SHIPPING', 'SUPPLIES', 'UTILITIES', 'MARKETING', 'SALARIES', 'MAINTENANCE', 'OTHER');

-- CreateTable: users
CREATE TABLE "users" (
    "id"        TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "email"     TEXT NOT NULL,
    "password"  TEXT NOT NULL,
    "role"      "Role" NOT NULL DEFAULT 'STAFF',
    "isActive"  BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateTable: categories
CREATE TABLE "categories" (
    "id"        TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "nameAr"    TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateTable: abayas
CREATE TABLE "abayas" (
    "id"            TEXT NOT NULL,
    "name"          TEXT NOT NULL,
    "nameAr"        TEXT,
    "description"   TEXT,
    "categoryId"    TEXT NOT NULL,
    "quantity"      INTEGER NOT NULL DEFAULT 0,
    "costPrice"     DECIMAL(10,2) NOT NULL,
    "sellingPrice"  DECIMAL(10,2) NOT NULL,
    "sku"           TEXT,
    "lowStockAlert" INTEGER NOT NULL DEFAULT 5,
    "isActive"      BOOLEAN NOT NULL DEFAULT true,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,
    CONSTRAINT "abayas_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "abayas_sku_key" ON "abayas"("sku");

-- CreateTable: abaya_images
CREATE TABLE "abaya_images" (
    "id"        TEXT NOT NULL,
    "abayaId"   TEXT NOT NULL,
    "url"       TEXT NOT NULL,
    "publicId"  TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "abaya_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable: stock_logs
CREATE TABLE "stock_logs" (
    "id"        TEXT NOT NULL,
    "abayaId"   TEXT NOT NULL,
    "change"    INTEGER NOT NULL,
    "reason"    TEXT NOT NULL,
    "before"    INTEGER NOT NULL,
    "after"     INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stock_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: sales
CREATE TABLE "sales" (
    "id"            TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "userId"        TEXT NOT NULL,
    "subtotal"      DECIMAL(10,2) NOT NULL,
    "discount"      DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total"         DECIMAL(10,2) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "notes"         TEXT,
    "customerName"  TEXT,
    "customerPhone" TEXT,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "sales_invoiceNumber_key" ON "sales"("invoiceNumber");

-- CreateTable: sale_items
CREATE TABLE "sale_items" (
    "id"         TEXT NOT NULL,
    "saleId"     TEXT NOT NULL,
    "abayaId"    TEXT NOT NULL,
    "quantity"   INTEGER NOT NULL,
    "unitPrice"  DECIMAL(10,2) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable: expenses
CREATE TABLE "expenses" (
    "id"          TEXT NOT NULL,
    "userId"      TEXT NOT NULL,
    "category"    "ExpenseCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "amount"      DECIMAL(10,2) NOT NULL,
    "date"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receipt"     TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- Foreign Keys
ALTER TABLE "abayas"      ADD CONSTRAINT "abayas_categoryId_fkey"     FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "abaya_images" ADD CONSTRAINT "abaya_images_abayaId_fkey"  FOREIGN KEY ("abayaId")   REFERENCES "abayas"("id")      ON DELETE CASCADE  ON UPDATE CASCADE;
ALTER TABLE "stock_logs"  ADD CONSTRAINT "stock_logs_abayaId_fkey"     FOREIGN KEY ("abayaId")   REFERENCES "abayas"("id")      ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sales"       ADD CONSTRAINT "sales_userId_fkey"           FOREIGN KEY ("userId")    REFERENCES "users"("id")       ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sale_items"  ADD CONSTRAINT "sale_items_saleId_fkey"      FOREIGN KEY ("saleId")    REFERENCES "sales"("id")       ON DELETE CASCADE  ON UPDATE CASCADE;
ALTER TABLE "sale_items"  ADD CONSTRAINT "sale_items_abayaId_fkey"     FOREIGN KEY ("abayaId")   REFERENCES "abayas"("id")      ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expenses"    ADD CONSTRAINT "expenses_userId_fkey"         FOREIGN KEY ("userId")    REFERENCES "users"("id")       ON DELETE RESTRICT ON UPDATE CASCADE;
