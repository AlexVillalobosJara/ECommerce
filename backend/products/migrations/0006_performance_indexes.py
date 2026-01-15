from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('products', '0005_product_min_shipping_days'),
    ]

    operations = [
        # Composite index for common product filters
        migrations.AddIndex(
            model_name='product',
            index=models.Index(
                fields=['tenant', 'status', '-created_at'],
                name='idx_prod_tenant_status_created'
            ),
        ),
        migrations.AddIndex(
            model_name='product',
            index=models.Index(
                fields=['tenant', 'category', 'status'],
                name='idx_prod_tenant_cat_status'
            ),
        ),
        migrations.AddIndex(
            model_name='product',
            index=models.Index(
                fields=['tenant', 'is_featured', 'status'],
                name='idx_prod_tenant_feat_status'
            ),
        ),
        
        # Indexes for variants
        migrations.AddIndex(
            model_name='productvariant',
            index=models.Index(
                fields=['product', 'is_active'],
                name='idx_var_product_active'
            ),
        ),
        
        # Text search indexes (PostgreSQL only)
        migrations.RunSQL(
            sql="CREATE INDEX idx_product_name_trgm ON products USING gin (name gin_trgm_ops);",
            reverse_sql="DROP INDEX IF EXISTS idx_product_name_trgm;"
        ),
        migrations.RunSQL(
            sql="CREATE INDEX idx_variant_sku_trgm ON product_variants USING gin (sku gin_trgm_ops);",
            reverse_sql="DROP INDEX IF EXISTS idx_variant_sku_trgm;"
        ),
    ]
