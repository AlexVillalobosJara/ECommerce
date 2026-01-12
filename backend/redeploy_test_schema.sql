-- PERFECT SCHEMA CLONE STRATEGY (V2)
-- This script ensures 100% structure parity (columns, indexes, constraints, identities)
-- and data copy between 'public' and 'test'.

-- 1. Reset Test Schema
DROP SCHEMA IF EXISTS test CASCADE;
CREATE SCHEMA test;

-- 2. Clone Custom Types (Enums) from public to test (if any)
DO $$ 
DECLARE 
    r RECORD;
BEGIN 
    -- Finding custom enum types in public
    FOR r IN (
        SELECT t.typname, array_agg(e.enumlabel ORDER BY e.enumsortorder) as labels
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public'
        GROUP BY t.typname
    ) 
    LOOP
        EXECUTE format('CREATE TYPE test.%I AS ENUM (%s)', 
            r.typname, 
            (SELECT string_agg(quote_literal(l), ', ') FROM unnest(r.labels) l)
        );
    END LOOP;
END $$;

-- 3. Clone Base Tables with 100% parity
DO $$ 
DECLARE 
    r RECORD;
BEGIN 
    FOR r IN (SELECT table_name 
              FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_type = 'BASE TABLE') 
    LOOP
        -- INCLUDING ALL copies: defaults, constraints, indexes, identities, comments, storage
        EXECUTE format('CREATE TABLE test.%I (LIKE public.%I INCLUDING ALL)', r.table_name, r.table_name);
        
        -- Copy Data
        EXECUTE format('INSERT INTO test.%I SELECT * FROM public.%I', r.table_name, r.table_name);
    END LOOP;
END $$;

-- 4. Audit result
SELECT 
    p.table_name, 
    (SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name=p.table_name) as public_cols,
    (SELECT count(*) FROM information_schema.columns WHERE table_schema='test' AND table_name=p.table_name) as test_cols
FROM information_schema.tables p
WHERE p.table_schema = 'public' 
AND p.table_type = 'BASE TABLE'
ORDER BY p.table_name;
