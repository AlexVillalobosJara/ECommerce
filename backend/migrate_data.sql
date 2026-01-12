-- SQL Script to migrate data from public to test schema
-- Execute this in your Supabase SQL Editor

-- 1. Disable constraints temporarily
SET session_replication_role = replica;

-- 2. Clear and Copy Data
BEGIN;

-- Tenants
TRUNCATE TABLE "test"."tenants" RESTART IDENTITY CASCADE;
INSERT INTO "test"."tenants" SELECT * FROM "public"."tenants";

-- Users
TRUNCATE TABLE "test"."auth_user" RESTART IDENTITY CASCADE;
INSERT INTO "test"."auth_user" SELECT * FROM "public"."auth_user";

-- Tenant Users
TRUNCATE TABLE "test"."tenant_users" RESTART IDENTITY CASCADE;
INSERT INTO "test"."tenant_users" SELECT * FROM "public"."tenant_users";

-- Categories
TRUNCATE TABLE "test"."categories" RESTART IDENTITY CASCADE;
INSERT INTO "test"."categories" SELECT * FROM "public"."categories";

-- Products
TRUNCATE TABLE "test"."products" RESTART IDENTITY CASCADE;
INSERT INTO "test"."products" SELECT * FROM "public"."products";

-- Product Variants
TRUNCATE TABLE "test"."product_variants" RESTART IDENTITY CASCADE;
INSERT INTO "test"."product_variants" SELECT * FROM "public"."product_variants";

-- Customers
TRUNCATE TABLE "test"."customers" RESTART IDENTITY CASCADE;
INSERT INTO "test"."customers" SELECT * FROM "public"."customers";

-- Shipping Zones
TRUNCATE TABLE "test"."shipping_zones" RESTART IDENTITY CASCADE;
INSERT INTO "test"."shipping_zones" SELECT * FROM "public"."shipping_zones";

COMMIT;

-- 3. Re-enable constraints
SET session_replication_role = origin;

-- 4. Verify
SELECT 'tenants' as table, count(*) FROM "test".tenants
UNION ALL
SELECT 'auth_user' as table, count(*) FROM "test".auth_user;
