# Generated manually for TenantMarketingConfig

from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('tenants', '0010_tenant_khipu_receiver_id_tenant_khipu_secret_key_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='TenantMarketingConfig',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('gtm_container_id', models.CharField(blank=True, help_text='Format: GTM-XXXXXXX', max_length=50, null=True)),
                ('ga4_measurement_id', models.CharField(blank=True, help_text='Format: G-XXXXXXXXXX', max_length=50, null=True)),
                ('meta_pixel_id', models.CharField(blank=True, help_text='Format: 16-digit number', max_length=50, null=True)),
                ('tiktok_pixel_id', models.CharField(blank=True, help_text='TikTok Pixel ID', max_length=50, null=True)),
                ('google_merchant_id', models.CharField(blank=True, help_text='Google Merchant Center ID', max_length=50, null=True)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('tenant', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='marketing_config', to='tenants.tenant')),
            ],
            options={
                'verbose_name': 'Tenant Marketing Configuration',
                'verbose_name_plural': 'Tenant Marketing Configurations',
                'db_table': 'tenant_marketing_config',
            },
        ),
    ]
