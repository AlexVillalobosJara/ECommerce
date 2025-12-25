# Generated manually to add Payment models

import django.contrib.postgres.fields
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('tenants', '0001_initial'),
        ('orders', '0004_alter_order_payment_gateway_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='Payment',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('gateway', models.CharField(choices=[('Flow', 'Flow'), ('Transbank', 'Transbank WebPay Plus'), ('MercadoPago', 'Mercado Pago')], max_length=20)),
                ('status', models.CharField(choices=[('Pending', 'Pending'), ('Processing', 'Processing'), ('Completed', 'Completed'), ('Failed', 'Failed'), ('Cancelled', 'Cancelled'), ('Refunded', 'Refunded')], default='Pending', max_length=20)),
                ('amount', models.DecimalField(decimal_places=2, max_digits=18)),
                ('currency', models.CharField(default='CLP', max_length=3)),
                ('gateway_transaction_id', models.CharField(blank=True, max_length=255, null=True)),
                ('gateway_payment_url', models.TextField(blank=True, null=True)),
                ('gateway_token', models.CharField(blank=True, max_length=500, null=True)),
                ('gateway_response', models.JSONField(blank=True, null=True)),
                ('error_message', models.TextField(blank=True, null=True)),
                ('retry_count', models.IntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('order', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='payments', to='orders.order')),
                ('tenant', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='payments', to='tenants.tenant')),
            ],
            options={
                'db_table': 'payments',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='PaymentWebhookLog',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('gateway', models.CharField(choices=[('Flow', 'Flow'), ('Transbank', 'Transbank WebPay Plus'), ('MercadoPago', 'Mercado Pago')], max_length=20)),
                ('webhook_data', models.JSONField()),
                ('headers', models.JSONField(blank=True, null=True)),
                ('signature_valid', models.BooleanField(default=False)),
                ('processed', models.BooleanField(default=False)),
                ('processing_error', models.TextField(blank=True, null=True)),
                ('received_at', models.DateTimeField(auto_now_add=True)),
                ('processed_at', models.DateTimeField(blank=True, null=True)),
                ('payment', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='webhook_logs', to='orders.payment')),
                ('tenant', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='payment_webhooks', to='tenants.tenant')),
            ],
            options={
                'db_table': 'payment_webhook_logs',
                'ordering': ['-received_at'],
            },
        ),
        migrations.AddIndex(
            model_name='paymentwebhooklog',
            index=models.Index(fields=['tenant', 'received_at'], name='payment_web_tenant__9a7c3e_idx'),
        ),
        migrations.AddIndex(
            model_name='paymentwebhooklog',
            index=models.Index(fields=['payment'], name='payment_web_payment_4f8b2d_idx'),
        ),
        migrations.AddIndex(
            model_name='paymentwebhooklog',
            index=models.Index(fields=['processed'], name='payment_web_process_7e9a1c_idx'),
        ),
        migrations.AddIndex(
            model_name='payment',
            index=models.Index(fields=['tenant', 'created_at'], name='payments_tenant__5c7d9e_idx'),
        ),
        migrations.AddIndex(
            model_name='payment',
            index=models.Index(fields=['order'], name='payments_order_i_3f8a2d_idx'),
        ),
        migrations.AddIndex(
            model_name='payment',
            index=models.Index(fields=['gateway_transaction_id'], name='payments_gateway_9b6c4e_idx'),
        ),
        migrations.AddIndex(
            model_name='payment',
            index=models.Index(fields=['status'], name='payments_status_2a8f1d_idx'),
        ),
    ]
