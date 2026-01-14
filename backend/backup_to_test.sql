-- Backup script: public -> test schema

-- 1. Create test schema if it does not exist
CREATE SCHEMA IF NOT EXISTS test;

-- 2. Backup categories
DROP TABLE IF EXISTS test.categories;
CREATE TABLE test.categories AS SELECT * FROM public.categories;

-- 3. Backup products
DROP TABLE IF EXISTS test.products;
CREATE TABLE test.products AS SELECT * FROM public.products;

-- 4. Backup product_images
DROP TABLE IF EXISTS test.product_images;
CREATE TABLE test.product_images AS SELECT * FROM public.product_images;

-- 5. Backup product_variants
DROP TABLE IF EXISTS test.product_variants;
CREATE TABLE test.product_variants AS SELECT * FROM public.product_variants;

-- 6. Backup shipping_zones
DROP TABLE IF EXISTS test.shipping_zones;
CREATE TABLE test.shipping_zones AS SELECT * FROM public.shipping_zones;

-- Optional: Verify row counts (to be checked in console or logs)
SELECT 'categories' as tbl, count(*) FROM test.categories
UNION ALL
SELECT 'products', count(*) FROM test.products
UNION ALL
SELECT 'product_images', count(*) FROM test.product_images
UNION ALL
SELECT 'product_variants', count(*) FROM test.product_variants
UNION ALL
SELECT 'shipping_zones', count(*) FROM test.shipping_zones;
