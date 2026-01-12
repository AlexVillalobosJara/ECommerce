-- SCRIPT PARA PRODUCCIÓN REVISADO (PostgreSQL)
-- RESUELVE EL ERROR 500 AL RENOMBRAR CATEGORÍAS/PRODUCTOS
-- Versión compatible con todas las configuraciones de django_migrations

BEGIN;

--------------------------------------------------------------------------------
-- 1. CATEGORÍAS (categories)
--------------------------------------------------------------------------------
DO $$ 
BEGIN
    EXECUTE (
        SELECT 'ALTER TABLE categories DROP CONSTRAINT ' || quote_ident(constraint_name)
        FROM information_schema.constraint_column_usage 
        WHERE table_name = 'categories' AND column_name = 'slug'
        AND constraint_name LIKE '%uniq%'
        LIMIT 1
    );
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'No se pudo eliminar la restricción en categories.';
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS unique_category_slug_per_tenant 
ON categories (tenant_id, slug) 
WHERE deleted_at IS NULL;


--------------------------------------------------------------------------------
-- 2. PRODUCTOS (products)
--------------------------------------------------------------------------------
DO $$ 
BEGIN
    EXECUTE (
        SELECT 'ALTER TABLE products DROP CONSTRAINT ' || quote_ident(constraint_name)
        FROM information_schema.constraint_column_usage 
        WHERE table_name = 'products' AND column_name = 'slug'
        AND constraint_name LIKE '%uniq%'
        LIMIT 1
    );
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'No se pudo eliminar la restricción en products.';
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS unique_product_slug_per_tenant 
ON products (tenant_id, slug) 
WHERE deleted_at IS NULL;


--------------------------------------------------------------------------------
-- 3. VARIANTES (product_variants)
--------------------------------------------------------------------------------
DO $$ 
BEGIN
    EXECUTE (
        SELECT 'ALTER TABLE product_variants DROP CONSTRAINT ' || quote_ident(constraint_name)
        FROM information_schema.constraint_column_usage 
        WHERE table_name = 'product_variants' AND column_name = 'sku'
        AND constraint_name LIKE '%uniq%'
        LIMIT 1
    );
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'No se pudo eliminar la restricción en product_variants.';
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS unique_variant_sku_per_tenant 
ON product_variants (tenant_id, sku) 
WHERE deleted_at IS NULL;


--------------------------------------------------------------------------------
-- 4. CLIENTES (customers)
--------------------------------------------------------------------------------
DO $$ 
BEGIN
    EXECUTE (
        SELECT 'ALTER TABLE customers DROP CONSTRAINT ' || quote_ident(constraint_name)
        FROM information_schema.constraint_column_usage 
        WHERE table_name = 'customers' AND column_name = 'email'
        AND constraint_name LIKE '%uniq%'
        LIMIT 1
    );
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'No se pudo eliminar la restricción en customers.';
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS unique_customer_email_per_tenant 
ON customers (tenant_id, email) 
WHERE deleted_at IS NULL;


--------------------------------------------------------------------------------
-- 5. REGISTRAR MIGRACIONES EN DJANGO (Modo Seguro)
--------------------------------------------------------------------------------
INSERT INTO django_migrations (app, name, applied) 
SELECT 'products', '0004_alter_category_unique_together_and_more', NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM django_migrations WHERE app = 'products' AND name = '0004_alter_category_unique_together_and_more'
);

INSERT INTO django_migrations (app, name, applied) 
SELECT 'orders', '0012_alter_customer_unique_together_and_more', NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM django_migrations WHERE app = 'orders' AND name = '0012_alter_customer_unique_together_and_more'
);

COMMIT;
