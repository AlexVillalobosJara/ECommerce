from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('orders', '0013_order_billing_business_giro_and_more'),
    ]

    operations = [
        # Composite indexes for orders
        migrations.AddIndex(
            model_name='order',
            index=models.Index(
                fields=['tenant', 'status', '-created_at'],
                name='idx_order_tenant_stat_created'
            ),
        ),
        migrations.AddIndex(
            model_name='order',
            index=models.Index(
                fields=['tenant', 'customer_email'],
                name='idx_order_tenant_email'
            ),
        ),
        
        # Text search index for order number (PostgreSQL only)
        migrations.RunSQL(
            sql="CREATE INDEX idx_order_number_trgm ON orders USING gin (order_number gin_trgm_ops);",
            reverse_sql="DROP INDEX IF EXISTS idx_order_number_trgm;"
        ),
    ]
