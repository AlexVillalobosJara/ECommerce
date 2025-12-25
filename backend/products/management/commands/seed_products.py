"""
Management command to seed the database with sample products for testing.
Run with: python manage.py seed_products
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from tenants.models import Tenant
from products.models import Category, Product, ProductVariant, ProductImage


class Command(BaseCommand):
    help = 'Seeds the database with sample products for testing'

    def handle(self, *args, **kwargs):
        # Get the first active tenant
        tenant = Tenant.objects.filter(status='Active', deleted_at__isnull=True).first()
        
        if not tenant:
            self.stdout.write(self.style.ERROR('No active tenant found. Please create a tenant first.'))
            return
        
        self.stdout.write(f'Using tenant: {tenant.name} ({tenant.slug})')
        
        # Create categories
        self.stdout.write('Creating categories...')
        
        mesas = Category.objects.create(
            tenant=tenant,
            name='Mesas de Trabajo',
            slug='mesas-de-trabajo',
            description='Mesas de trabajo profesionales en acero inoxidable',
            image_url='/categories/work-tables.jpg',
            sort_order=1,
            is_active=True
        )
        
        repisas = Category.objects.create(
            tenant=tenant,
            name='Repisas Murales',
            slug='repisas-murales',
            description='Repisas murales de acero inoxidable',
            image_url='/categories/wall-shelves.jpg',
            sort_order=2,
            is_active=True
        )
        
        escurridores = Category.objects.create(
            tenant=tenant,
            name='Escurridores',
            slug='escurridores',
            description='Escurridores de platos y utensilios',
            image_url='/categories/dish-racks.jpg',
            sort_order=3,
            is_active=True
        )
        
        estanterias = Category.objects.create(
            tenant=tenant,
            name='Estanterías',
            slug='estanterias',
            description='Estanterías industriales',
            image_url='/categories/storage-units.jpg',
            sort_order=4,
            is_active=True
        )
        
        self.stdout.write(self.style.SUCCESS(f'Created {Category.objects.filter(tenant=tenant).count()} categories'))
        
        # Create products
        self.stdout.write('Creating products...')
        
        # Product 1: Mesa de Trabajo (with variants)
        mesa1 = Product.objects.create(
            tenant=tenant,
            category=mesas,
            name='Mesa de Trabajo Acero Inoxidable',
            slug='mesa-trabajo-acero-inoxidable',
            short_description='Mesa de trabajo profesional en acero inoxidable 304',
            description='Mesa de trabajo de alta calidad fabricada en acero inoxidable 304. Ideal para cocinas industriales, restaurantes y talleres. Estructura robusta con patas regulables.',
            sku='MESA-001',
            brand='ProChef',
            is_quote_only=False,
            manage_stock=True,
            status='Published',
            is_featured=True,
            published_at=timezone.now()
        )
        
        # Variants for mesa1
        ProductVariant.objects.create(
            tenant=tenant,
            product=mesa1,
            sku='MESA-001-120',
            name='120cm x 60cm',
            attributes={'Largo': '120cm', 'Ancho': '60cm'},
            price=450000,
            stock_quantity=10,
            is_active=True,
            is_default=True
        )
        
        ProductVariant.objects.create(
            tenant=tenant,
            product=mesa1,
            sku='MESA-001-150',
            name='150cm x 70cm',
            attributes={'Largo': '150cm', 'Ancho': '70cm'},
            price=550000,
            stock_quantity=5,
            is_active=True
        )
        
        # Images for mesa1
        ProductImage.objects.create(
            tenant=tenant,
            product=mesa1,
            url='/products/stainless-work-table.jpg',
            alt_text='Mesa de trabajo acero inoxidable',
            sort_order=1,
            is_primary=True
        )
        
        # Product 2: Repisa Mural
        repisa1 = Product.objects.create(
            tenant=tenant,
            category=repisas,
            name='Repisa Mural Acero Inoxidable',
            slug='repisa-mural-acero-inoxidable',
            short_description='Repisa mural de acero inoxidable con soporte reforzado',
            description='Repisa mural fabricada en acero inoxidable 304. Ideal para almacenamiento en cocinas. Incluye soportes de montaje.',
            sku='REP-001',
            brand='ProChef',
            is_quote_only=False,
            manage_stock=True,
            status='Published',
            published_at=timezone.now()
        )
        
        ProductVariant.objects.create(
            tenant=tenant,
            product=repisa1,
            sku='REP-001-100',
            name='100cm',
            attributes={'Largo': '100cm'},
            price=89000,
            stock_quantity=15,
            is_active=True,
            is_default=True
        )
        
        ProductImage.objects.create(
            tenant=tenant,
            product=repisa1,
            url='/products/stainless-wall-shelf.jpg',
            alt_text='Repisa mural acero inoxidable',
            sort_order=1,
            is_primary=True
        )
        
        # Product 3: Estantería (quote only)
        estanteria1 = Product.objects.create(
            tenant=tenant,
            category=estanterias,
            name='Estantería Industrial Acero Inoxidable',
            slug='estanteria-industrial-acero-inoxidable',
            short_description='Estantería industrial a medida',
            description='Estantería industrial fabricada a medida según sus necesidades. Acero inoxidable 304. Precio por cotización.',
            sku='EST-001',
            brand='ProChef',
            is_quote_only=True,
            manage_stock=False,
            status='Published',
            published_at=timezone.now()
        )
        
        ProductVariant.objects.create(
            tenant=tenant,
            product=estanteria1,
            sku='EST-001-CUSTOM',
            name='A medida',
            attributes={'Tipo': 'Personalizado'},
            price=None,  # No price for quote-only
            stock_quantity=999,
            is_active=True,
            is_default=True
        )
        
        ProductImage.objects.create(
            tenant=tenant,
            product=estanteria1,
            url='/products/stainless-storage-unit.jpg',
            alt_text='Estantería industrial',
            sort_order=1,
            is_primary=True
        )
        
        # Product 4: Escurridor
        escurridor1 = Product.objects.create(
            tenant=tenant,
            category=escurridores,
            name='Escurridor de Platos Acero Inoxidable',
            slug='escurridor-platos-acero-inoxidable',
            short_description='Escurridor de platos con bandeja recolectora',
            description='Escurridor de platos en acero inoxidable con bandeja recolectora de agua. Capacidad para 50 platos.',
            sku='ESC-001',
            brand='ProChef',
            is_quote_only=False,
            manage_stock=True,
            status='Published',
            published_at=timezone.now()
        )
        
        ProductVariant.objects.create(
            tenant=tenant,
            product=escurridor1,
            sku='ESC-001-STD',
            name='Estándar',
            attributes={'Capacidad': '50 platos'},
            price=125000,
            stock_quantity=8,
            is_active=True,
            is_default=True
        )
        
        ProductImage.objects.create(
            tenant=tenant,
            product=escurridor1,
            url='/products/stainless-dish-rack.jpg',
            alt_text='Escurridor de platos',
            sort_order=1,
            is_primary=True
        )
        
        # Product 5: Mesa Doble Nivel (out of stock)
        mesa2 = Product.objects.create(
            tenant=tenant,
            category=mesas,
            name='Mesa de Trabajo Doble Nivel',
            slug='mesa-trabajo-doble-nivel',
            short_description='Mesa de trabajo con repisa inferior',
            description='Mesa de trabajo con repisa inferior para almacenamiento adicional. Acero inoxidable 304.',
            sku='MESA-002',
            brand='ProChef',
            is_quote_only=False,
            manage_stock=True,
            status='Published',
            published_at=timezone.now()
        )
        
        ProductVariant.objects.create(
            tenant=tenant,
            product=mesa2,
            sku='MESA-002-140',
            name='140cm x 70cm',
            attributes={'Largo': '140cm', 'Ancho': '70cm'},
            price=180000,
            stock_quantity=0,  # Out of stock
            is_active=True,
            is_default=True
        )
        
        ProductImage.objects.create(
            tenant=tenant,
            product=mesa2,
            url='/products/stainless-double-table.jpg',
            alt_text='Mesa doble nivel',
            sort_order=1,
            is_primary=True
        )
        
        self.stdout.write(self.style.SUCCESS(f'Created {Product.objects.filter(tenant=tenant).count()} products'))
        self.stdout.write(self.style.SUCCESS(f'Created {ProductVariant.objects.filter(tenant=tenant).count()} variants'))
        self.stdout.write(self.style.SUCCESS(f'Created {ProductImage.objects.filter(tenant=tenant).count()} images'))
        self.stdout.write(self.style.SUCCESS('Database seeded successfully!'))
