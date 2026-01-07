# -*- coding: utf-8 -*-
"""
Email service for sending notifications using Resend API
"""
import resend
import logging
from django.conf import settings
from django.template.loader import render_to_string
from decimal import Decimal

logger = logging.getLogger(__name__)

# Configure Resend API key
resend.api_key = settings.RESEND_API_KEY


def send_quote_request_notification(order):
    """
    Send email notification to admin when a new quote request is received
    
    Args:
        order: Order instance with order_type='Quote' and status='QuoteRequested'
    """
    try:
        # Prepare data
        customer_name = order.shipping_recipient_name or order.customer_email.split('@')[0]
        order_number = order.order_number
        customer_email = order.customer_email
        customer_phone = order.customer_phone or "No proporcionado"
        
        # Format date
        created_date = order.created_at.strftime('%d/%m/%Y %H:%M')
        
        # Build shipping address
        shipping_parts = []
        if order.shipping_street_address:
            shipping_parts.append(order.shipping_street_address)
        if order.shipping_apartment:
            shipping_parts.append(f"Depto/Casa: {order.shipping_apartment}")
        if order.shipping_commune:
            shipping_parts.append(order.shipping_commune)
        if order.shipping_city:
            shipping_parts.append(order.shipping_city)
        if order.shipping_region:
            shipping_parts.append(order.shipping_region)
        
        shipping_address = ", ".join(shipping_parts) if shipping_parts else "No proporcionada"
        
        # Admin panel URL
        admin_url = f"{settings.FRONTEND_URL}/admin/orders"
        
        # Generate HTML manually with Gmail compatibility
        html_content = f"""<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#fafafa;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#fafafa">
<tr>
<td align="center" style="padding:40px 20px;">
<table width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="max-width:600px;">
<!-- Header -->
<tr>
<td align="center" bgcolor="#8b5cf6" style="padding:48px 40px;">
<h1 style="margin:0 0 12px 0;color:#ffffff;font-size:32px;font-weight:bold;font-family:Arial,Helvetica,sans-serif;">🔔 Nueva Solicitud de Cotización</h1>
<p style="margin:0;color:#ffffff;font-size:16px;font-family:Arial,Helvetica,sans-serif;">Un cliente ha solicitado una cotización</p>
<table cellpadding="8" cellspacing="0" border="0" bgcolor="rgba(255,255,255,0.2)" style="margin-top:20px;">
<tr>
<td style="color:#ffffff;font-size:13px;font-weight:bold;font-family:Arial,Helvetica,sans-serif;">ACCIÓN REQUERIDA</td>
</tr>
</table>
</td>
</tr>
<!-- Body -->
<tr>
<td style="padding:40px;">
<p style="margin:0 0 32px 0;font-size:16px;color:#4b5563;font-family:Arial,Helvetica,sans-serif;">Has recibido una nueva solicitud de cotización. Revisa los detalles a continuación y responde desde el panel de administración.</p>

<!-- Order Info -->
<table width="100%" cellpadding="20" cellspacing="0" border="0" bgcolor="#f9fafb" style="margin-bottom:32px;border-left:4px solid #8b5cf6;">
<tr>
<td>
<table width="100%" cellpadding="8" cellspacing="0" border="0">
<tr>
<td style="color:#6b7280;font-size:14px;font-family:Arial,Helvetica,sans-serif;">Número de Cotización:</td>
<td align="right" style="color:#111827;font-size:14px;font-weight:bold;font-family:Arial,Helvetica,sans-serif;">{order_number}</td>
</tr>
<tr>
<td style="color:#6b7280;font-size:14px;font-family:Arial,Helvetica,sans-serif;">Fecha de Solicitud:</td>
<td align="right" style="color:#111827;font-size:14px;font-weight:bold;font-family:Arial,Helvetica,sans-serif;">{created_date}</td>
</tr>
</table>
</td>
</tr>
</table>

<!-- Customer Info -->
<h3 style="margin:0 0 16px 0;font-size:18px;font-weight:bold;color:#111827;font-family:Arial,Helvetica,sans-serif;">👤 Información del Cliente</h3>
<table width="100%" cellpadding="16" cellspacing="0" border="0" bgcolor="#eff6ff" style="margin-bottom:32px;">
<tr>
<td>
<table width="100%" cellpadding="6" cellspacing="0" border="0">
<tr>
<td style="color:#1e40af;font-size:14px;font-family:Arial,Helvetica,sans-serif;"><strong>Nombre:</strong></td>
<td style="color:#1e3a8a;font-size:14px;font-family:Arial,Helvetica,sans-serif;">{customer_name}</td>
</tr>
<tr>
<td style="color:#1e40af;font-size:14px;font-family:Arial,Helvetica,sans-serif;"><strong>Email:</strong></td>
<td style="color:#1e3a8a;font-size:14px;font-family:Arial,Helvetica,sans-serif;">{customer_email}</td>
</tr>
<tr>
<td style="color:#1e40af;font-size:14px;font-family:Arial,Helvetica,sans-serif;"><strong>Teléfono:</strong></td>
<td style="color:#1e3a8a;font-size:14px;font-family:Arial,Helvetica,sans-serif;">{customer_phone}</td>
</tr>
</table>
</td>
</tr>
</table>

<!-- Shipping Address -->
<h3 style="margin:0 0 16px 0;font-size:18px;font-weight:bold;color:#111827;font-family:Arial,Helvetica,sans-serif;">📍 Dirección de Envío</h3>
<table width="100%" cellpadding="16" cellspacing="0" border="0" bgcolor="#f0fdf4" style="margin-bottom:32px;">
<tr>
<td style="color:#166534;font-size:14px;font-family:Arial,Helvetica,sans-serif;">{shipping_address}</td>
</tr>
</table>

<!-- Products -->
<h3 style="margin:0 0 16px 0;font-size:18px;font-weight:bold;color:#111827;font-family:Arial,Helvetica,sans-serif;">📦 Productos Solicitados</h3>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
<tr bgcolor="#f9fafb">
<td style="padding:12px;color:#6b7280;font-size:13px;font-weight:bold;font-family:Arial,Helvetica,sans-serif;border-bottom:2px solid #e5e7eb;">Producto</td>
<td align="center" style="padding:12px;color:#6b7280;font-size:13px;font-weight:bold;font-family:Arial,Helvetica,sans-serif;border-bottom:2px solid #e5e7eb;">Cantidad</td>
<td align="right" style="padding:12px;color:#6b7280;font-size:13px;font-weight:bold;font-family:Arial,Helvetica,sans-serif;border-bottom:2px solid #e5e7eb;">SKU</td>
</tr>"""
        
        # Add product items
        items = order.items.all()
        for item in items:
            variant_info = f" - {item.variant_name}" if item.variant_name else ""
            html_content += f"""
<tr>
<td style="padding:12px;color:#111827;font-size:14px;font-family:Arial,Helvetica,sans-serif;border-bottom:1px solid #e5e7eb;">{item.product_name}{variant_info}</td>
<td align="center" style="padding:12px;color:#111827;font-size:14px;font-family:Arial,Helvetica,sans-serif;border-bottom:1px solid #e5e7eb;">{item.quantity}</td>
<td align="right" style="padding:12px;color:#6b7280;font-size:13px;font-family:Arial,Helvetica,sans-serif;border-bottom:1px solid #e5e7eb;">{item.sku}</td>
</tr>"""
        
        # Add customer notes if present
        notes_section = ""
        if order.customer_notes:
            notes_section = f"""
<!-- Customer Notes -->
<h3 style="margin:32px 0 16px 0;font-size:18px;font-weight:bold;color:#111827;font-family:Arial,Helvetica,sans-serif;">💬 Notas del Cliente</h3>
<table width="100%" cellpadding="16" cellspacing="0" border="0" bgcolor="#fef3c7" style="margin-bottom:32px;border-left:4px solid #f59e0b;">
<tr>
<td style="color:#78350f;font-size:14px;font-family:Arial,Helvetica,sans-serif;">{order.customer_notes}</td>
</tr>
</table>"""
        
        html_content += f"""
</table>
{notes_section}
<!-- Action Button -->
<table width="100%" cellpadding="24" cellspacing="0" border="0" bgcolor="#7c3aed" style="margin-bottom:24px;">
<tr>
<td align="center">
<a href="{admin_url}" style="display:inline-block;padding:16px 32px;background-color:#ffffff;color:#7c3aed;text-decoration:none;font-weight:bold;font-size:16px;font-family:Arial,Helvetica,sans-serif;">🔗 Ir al Panel de Administración</a>
</td>
</tr>
</table>

<!-- Instructions -->
<table width="100%" cellpadding="20" cellspacing="0" border="0" bgcolor="#eff6ff" style="margin-bottom:24px;">
<tr>
<td>
<div style="font-weight:bold;color:#1e40af;margin-bottom:12px;font-size:15px;font-family:Arial,Helvetica,sans-serif;">📋 Próximos Pasos</div>
<table width="100%" cellpadding="4" cellspacing="0" border="0">
<tr>
<td style="color:#1e40af;font-size:14px;font-family:Arial,Helvetica,sans-serif;">1. Revisa los productos solicitados</td>
</tr>
<tr>
<td style="color:#1e40af;font-size:14px;font-family:Arial,Helvetica,sans-serif;">2. Verifica disponibilidad de stock</td>
</tr>
<tr>
<td style="color:#1e40af;font-size:14px;font-family:Arial,Helvetica,sans-serif;">3. Ingresa los precios en el panel de admin</td>
</tr>
<tr>
<td style="color:#1e40af;font-size:14px;font-family:Arial,Helvetica,sans-serif;">4. Envía la cotización al cliente</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
<!-- Footer -->
<tr>
<td align="center" bgcolor="#fafafa" style="padding:32px 40px;border-top:1px solid #e5e7eb;">
<p style="margin:0 0 8px 0;font-size:15px;font-weight:bold;color:#111827;font-family:Arial,Helvetica,sans-serif;">Panel de Administración Zumi</p>
<p style="margin:0;font-size:12px;color:#9ca3af;font-family:Arial,Helvetica,sans-serif;">Este es un email automático del sistema de cotizaciones.</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>"""
        
        # Send email
        # Use Resend's sandbox domain which doesn't require verification
        params = {
            "from": "Zumi Store <onboarding@resend.dev>",
            "to": settings.ADMIN_EMAIL if hasattr(settings, 'ADMIN_EMAIL') else "admin@empresa.cl",
            "subject": f"🔔 Nueva Solicitud de Cotización - {order.order_number}",
            "html": html_content,
        }
        
        response = resend.Emails.send(params)
        logger.info(f"Quote request email sent for order {order.order_number}: {response}")
        return response
        
    except Exception as e:
        logger.error(f"Failed to send quote request email for order {order.order_number}: {e}")
        # Don't raise exception - email failure shouldn't break order creation
        return None


def send_quote_response_notification(order):
    """
    Send email notification to customer when admin responds to their quote
    Includes PDF attachment with full quote details
    
    Args:
        order: Order instance with order_type='Quote' and status='QuoteSent'
    """
    try:
        # Generate PDF
        from .pdf_generator import generate_quote_pdf
        pdf_content = generate_quote_pdf(order)
        
        # Convert PDF to base64 for Resend
        import base64
        pdf_base64 = base64.b64encode(pdf_content).decode()
        
        # Prepare data
        customer_name = order.shipping_recipient_name or order.customer_email.split('@')[0]
        order_number = order.order_number
        total = float(order.total)
        
        # Format date
        valid_until = ""
        if order.quote_valid_until:
            valid_until = order.quote_valid_until.strftime('%d/%m/%Y')
        
        # Generate HTML manually with better Gmail compatibility
        html_content = f"""<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#fafafa;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#fafafa">
<tr>
<td align="center" style="padding:40px 20px;">
<table width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="max-width:600px;">
<!-- Header -->
<tr>
<td align="center" bgcolor="#8b5cf6" style="padding:48px 40px;">
<h1 style="margin:0 0 12px 0;color:#ffffff;font-size:32px;font-weight:bold;font-family:Arial,Helvetica,sans-serif;">📄 Tu Cotización está Lista</h1>
<p style="margin:0;color:#ffffff;font-size:16px;font-family:Arial,Helvetica,sans-serif;">Hemos preparado tu cotización personalizada</p>
<table cellpadding="8" cellspacing="0" border="0" bgcolor="rgba(255,255,255,0.2)" style="margin-top:20px;">
<tr>
<td style="color:#ffffff;font-size:13px;font-weight:bold;font-family:Arial,Helvetica,sans-serif;">COTIZACIÓN ENVIADA</td>
</tr>
</table>
</td>
</tr>
<!-- Body -->
<tr>
<td style="padding:40px;">
<p style="margin:0 0 12px 0;font-size:16px;color:#1f2937;font-family:Arial,Helvetica,sans-serif;">Hola <strong>{customer_name}</strong>,</p>
<p style="margin:0 0 32px 0;font-size:16px;color:#4b5563;font-family:Arial,Helvetica,sans-serif;">Nos complace informarte que tu cotización está lista. Encontrarás todos los detalles en el PDF adjunto.</p>
<!-- PDF Notice -->
<table width="100%" cellpadding="20" cellspacing="0" border="2" bordercolor="#8b5cf6" bgcolor="#f3e8ff" style="margin-bottom:32px;">
<tr>
<td align="center">
<div style="font-size:24px;margin-bottom:8px;">📎</div>
<div style="font-weight:bold;color:#6b21a8;margin-bottom:4px;font-size:16px;font-family:Arial,Helvetica,sans-serif;">Cotización Adjunta</div>
<p style="margin:0;color:#7c3aed;font-size:14px;font-family:Arial,Helvetica,sans-serif;">Revisa el archivo PDF adjunto para ver todos los detalles</p>
</td>
</tr>
</table>
<!-- Order Info -->
<table width="100%" cellpadding="20" cellspacing="0" border="0" bgcolor="#f9fafb" style="margin-bottom:32px;border-left:4px solid #8b5cf6;">
<tr>
<td>
<table width="100%" cellpadding="8" cellspacing="0" border="0">
<tr>
<td style="color:#6b7280;font-size:14px;font-family:Arial,Helvetica,sans-serif;">Número de Cotización:</td>
<td align="right" style="color:#111827;font-size:14px;font-weight:bold;font-family:Arial,Helvetica,sans-serif;">{order_number}</td>
</tr>"""
        
        if valid_until:
            html_content += f"""
<tr>
<td style="color:#6b7280;font-size:14px;font-family:Arial,Helvetica,sans-serif;">Válida hasta:</td>
<td align="right" style="color:#111827;font-size:14px;font-weight:bold;font-family:Arial,Helvetica,sans-serif;">{valid_until}</td>
</tr>"""
        
        html_content += f"""
<tr>
<td style="color:#6b7280;font-size:14px;font-family:Arial,Helvetica,sans-serif;">Total:</td>
<td align="right" style="color:#8b5cf6;font-size:18px;font-weight:bold;font-family:Arial,Helvetica,sans-serif;">${total:,.0f}</td>
</tr>
</table>
</td>
</tr>
</table>"""
        
        if valid_until:
            html_content += f"""
<!-- Alert -->
<table width="100%" cellpadding="20" cellspacing="0" border="0" bgcolor="#fef3c7" style="margin-bottom:24px;border-left:4px solid #f59e0b;">
<tr>
<td>
<div style="font-weight:bold;color:#92400e;margin-bottom:8px;font-size:15px;font-family:Arial,Helvetica,sans-serif;">⏰ Validez de la Cotización</div>
<p style="margin:0;color:#78350f;font-size:14px;font-family:Arial,Helvetica,sans-serif;">Esta cotización es válida hasta el <strong>{valid_until}</strong>. Después de esta fecha, los precios podrían variar.</p>
</td>
</tr>
</table>"""
        
        html_content += f"""
<!-- Next Steps -->
<table width="100%" cellpadding="24" cellspacing="0" border="0" bgcolor="#eff6ff" style="margin-bottom:24px;">
<tr>
<td>
<div style="font-weight:bold;color:#1e40af;margin-bottom:16px;font-size:16px;font-family:Arial,Helvetica,sans-serif;">📋 Próximos Pasos</div>
<table width="100%" cellpadding="6" cellspacing="0" border="0">
<tr>
<td style="color:#1e40af;font-size:14px;font-family:Arial,Helvetica,sans-serif;">• Revisa el PDF adjunto con todos los detalles</td>
</tr>
<tr>
<td style="color:#1e40af;font-size:14px;font-family:Arial,Helvetica,sans-serif;">• Si estás de acuerdo, contáctanos para proceder</td>
</tr>
<tr>
<td style="color:#1e40af;font-size:14px;font-family:Arial,Helvetica,sans-serif;">• Coordinaremos el pago y la entrega</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
</table>

        # Build payment link using tenant's custom domain if available
        if order.tenant.custom_domain:
            base_url = order.tenant.custom_domain
            if not base_url.startswith(('http://', 'https://')):
                base_url = f"https://{base_url}"
        else:
            base_url = settings.FRONTEND_URL
        
        if base_url.endswith('/'):
            base_url = base_url[:-1]
        
        payment_link = f"{base_url}/payment?order={order.id}&tenant={order.tenant.slug}"
        
        html_content += f"""
<!-- Payment Action -->
<table width="100%" cellpadding="24" cellspacing="0" border="0" bgcolor="#f0fdf4" style="margin-bottom:24px;border:1px solid #bbf7d0;border-radius:8px;">
<tr>
<td align="center">
<div style="font-weight:bold;color:#166534;margin-bottom:12px;font-size:18px;font-family:Arial,Helvetica,sans-serif;">Listo para comprar?</div>
<p style="margin:0 0 20px 0;color:#15803d;font-size:14px;font-family:Arial,Helvetica,sans-serif;">Puedes pagar tu cotizacion directamente en linea de forma segura.</p>
<a href="{payment_link}" style="display:inline-block;padding:16px 32px;background-color:#16a34a;color:#ffffff;text-decoration:none;font-weight:bold;font-size:16px;font-family:Arial,Helvetica,sans-serif;border-radius:6px;">Pagar Cotizacion Ahora</a>
</td>
</tr>
</table>"""
        
        if order.internal_notes:
            html_content += f"""
<!-- Notes -->
<h3 style="margin:32px 0 12px 0;font-size:16px;font-weight:bold;color:#111827;font-family:Arial,Helvetica,sans-serif;">💬 Notas Adicionales</h3>
<table width="100%" cellpadding="20" cellspacing="0" border="0" bgcolor="#f9fafb">
<tr>
<td style="color:#4b5563;font-size:14px;font-family:Arial,Helvetica,sans-serif;">{order.internal_notes}</td>
</tr>
</table>"""
        
        html_content += """
</td>
</tr>
<!-- Footer -->
<tr>
<td align="center" bgcolor="#fafafa" style="padding:32px 40px;border-top:1px solid #e5e7eb;">
<p style="margin:0 0 8px 0;font-size:15px;font-weight:bold;color:#111827;font-family:Arial,Helvetica,sans-serif;">¿Tienes preguntas?</p>
<p style="margin:0 0 20px 0;font-size:14px;color:#6b7280;font-family:Arial,Helvetica,sans-serif;">Responde a este email o contáctanos directamente.</p>
<p style="margin:0;font-size:12px;color:#9ca3af;font-family:Arial,Helvetica,sans-serif;">Este es un email automático del sistema de cotizaciones de <strong style="color:#8b5cf6;">Zumi</strong>.</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>"""
        
        # IMPORTANT: Resend test mode only allows sending to verified email
        # In production, verify your domain to send to any email
        # For now, send to admin email for testing
        recipient_email = settings.ADMIN_EMAIL  # Always send to admin for testing
        
        # Prepare PDF filename
        pdf_filename = f"Cotizacion_{order.order_number}.pdf"
        
        # Send email with PDF attachment
        # Use Resend's sandbox domain which doesn't require verification
        params = {
            "from": "Zumi Store <onboarding@resend.dev>",
            "to": recipient_email,  # Using admin email for testing
            "subject": f"Tu Cotización está Lista - {order.order_number} (Test: {order.customer_email})",
            "html": html_content,
            "attachments": [
                {
                    "filename": pdf_filename,
                    "content": pdf_base64
                }
            ]
        }
        
        response = resend.Emails.send(params)
        logger.info(f"Quote response email with PDF sent for order {order.order_number} to {recipient_email} (customer: {order.customer_email}): {response}")
        return response
        
    except Exception as e:
        logger.error(f"Failed to send quote response email for order {order.order_number}: {e}")
        return None


def send_order_confirmation_email(order):
    """
    Send order confirmation email to customer after successful payment
    
    Args:
        order: Order instance
    """
    try:
        # Prepare data
        customer_name = order.shipping_recipient_name or order.customer_email.split('@')[0]
        order_number = order.order_number
        total = float(order.total)
        
        # Format date
        created_date = order.created_at.strftime('%d/%m/%Y %H:%M')
        
        # Build shipping address
        shipping_parts = []
        if order.shipping_street_address:
            shipping_parts.append(order.shipping_street_address)
        if order.shipping_apartment:
            shipping_parts.append(f"Depto/Casa: {order.shipping_apartment}")
        if order.shipping_commune:
            shipping_parts.append(order.shipping_commune)
        if order.shipping_city:
            shipping_parts.append(order.shipping_city)
        if order.shipping_region:
            shipping_parts.append(order.shipping_region)
        
        shipping_address = ", ".join(shipping_parts) if shipping_parts else "Retiro en tienda"
        
        # Generate HTML manually
        html_content = f"""<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#fafafa;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#fafafa">
<tr>
<td align="center" style="padding:40px 20px;">
<table width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="max-width:600px;">
<!-- Header -->
<tr>
<td align="center" bgcolor="#4f46e5" style="padding:48px 40px;">
<h1 style="margin:0 0 12px 0;color:#ffffff;font-size:32px;font-weight:bold;font-family:Arial,Helvetica,sans-serif;">🎉 ¡Gracias por tu compra!</h1>
<p style="margin:0;color:#ffffff;font-size:16px;font-family:Arial,Helvetica,sans-serif;">Tu pedido ha sido confirmado exitosamente</p>
</td>
</tr>
<!-- Body -->
<tr>
<td style="padding:40px;">
<p style="margin:0 0 12px 0;font-size:16px;color:#1f2937;font-family:Arial,Helvetica,sans-serif;">Hola <strong>{customer_name}</strong>,</p>
<p style="margin:0 0 32px 0;font-size:16px;color:#4b5563;font-family:Arial,Helvetica,sans-serif;">Hemos recibido tu pedido y ya estamos trabajando en ello. A continuación encontrarás el resumen de tu compra.</p>

<!-- Order Info -->
<table width="100%" cellpadding="20" cellspacing="0" border="0" bgcolor="#f9fafb" style="margin-bottom:32px;border-left:4px solid #4f46e5;">
<tr>
<td>
<table width="100%" cellpadding="8" cellspacing="0" border="0">
<tr>
<td style="color:#6b7280;font-size:14px;font-family:Arial,Helvetica,sans-serif;">Número de Pedido:</td>
<td align="right" style="color:#111827;font-size:14px;font-weight:bold;font-family:Arial,Helvetica,sans-serif;">{order_number}</td>
</tr>
<tr>
<td style="color:#6b7280;font-size:14px;font-family:Arial,Helvetica,sans-serif;">Fecha:</td>
<td align="right" style="color:#111827;font-size:14px;font-weight:bold;font-family:Arial,Helvetica,sans-serif;">{created_date}</td>
</tr>
</table>
</td>
</tr>
</table>

<!-- Shipping Address -->
<h3 style="margin:0 0 16px 0;font-size:18px;font-weight:bold;color:#111827;font-family:Arial,Helvetica,sans-serif;">📍 Dirección de Envío</h3>
<table width="100%" cellpadding="16" cellspacing="0" border="0" bgcolor="#f0fdf4" style="margin-bottom:32px;">
<tr>
<td style="color:#166534;font-size:14px;font-family:Arial,Helvetica,sans-serif;">{shipping_address}</td>
</tr>
</table>

<!-- Products -->
<h3 style="margin:0 0 16px 0;font-size:18px;font-weight:bold;color:#111827;font-family:Arial,Helvetica,sans-serif;">📦 Tu Compra</h3>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
<tr bgcolor="#f9fafb">
<td style="padding:12px;color:#6b7280;font-size:13px;font-weight:bold;font-family:Arial,Helvetica,sans-serif;border-bottom:2px solid #e5e7eb;">Producto</td>
<td align="center" style="padding:12px;color:#6b7280;font-size:13px;font-weight:bold;font-family:Arial,Helvetica,sans-serif;border-bottom:2px solid #e5e7eb;">Cant.</td>
<td align="right" style="padding:12px;color:#6b7280;font-size:13px;font-weight:bold;font-family:Arial,Helvetica,sans-serif;border-bottom:2px solid #e5e7eb;">Precio</td>
</tr>"""
        
        # Add product items
        items = order.items.all()
        for item in items:
            variant_info = f" - {item.variant_name}" if item.variant_name else ""
            item_total = float(item.total)
            html_content += f"""
<tr>
<td style="padding:12px;color:#111827;font-size:14px;font-family:Arial,Helvetica,sans-serif;border-bottom:1px solid #e5e7eb;">{item.product_name}{variant_info}</td>
<td align="center" style="padding:12px;color:#111827;font-size:14px;font-family:Arial,Helvetica,sans-serif;border-bottom:1px solid #e5e7eb;">{item.quantity}</td>
<td align="right" style="padding:12px;color:#111827;font-size:14px;font-family:Arial,Helvetica,sans-serif;border-bottom:1px solid #e5e7eb;">${item_total:,.0f}</td>
</tr>"""
        
        html_content += f"""
<!-- Totals -->
<tr>
<td colspan="2" align="right" style="padding:12px 12px 0 0;color:#6b7280;font-size:14px;font-family:Arial,Helvetica,sans-serif;">Subtotal:</td>
<td align="right" style="padding:12px 0 0 12px;color:#111827;font-size:14px;font-family:Arial,Helvetica,sans-serif;">${float(order.subtotal):,.0f}</td>
</tr>
<tr>
<td colspan="2" align="right" style="padding:4px 12px 0 0;color:#6b7280;font-size:14px;font-family:Arial,Helvetica,sans-serif;">Envío:</td>
<td align="right" style="padding:4px 0 0 12px;color:#111827;font-size:14px;font-family:Arial,Helvetica,sans-serif;">${float(order.shipping_cost):,.0f}</td>
</tr>
<tr>
<td colspan="2" align="right" style="padding:12px 12px 0 0;color:#111827;font-size:16px;font-weight:bold;font-family:Arial,Helvetica,sans-serif;">Total:</td>
<td align="right" style="padding:12px 0 0 12px;color:#4f46e5;font-size:18px;font-weight:bold;font-family:Arial,Helvetica,sans-serif;">${total:,.0f}</td>
</tr>
</table>
</td>
</tr>
<!-- Footer -->
<tr>
<td align="center" bgcolor="#fafafa" style="padding:32px 40px;border-top:1px solid #e5e7eb;">
<p style="margin:0 0 8px 0;font-size:15px;font-weight:bold;color:#111827;font-family:Arial,Helvetica,sans-serif;">Gracias por preferirnos</p>
<p style="margin:0;font-size:12px;color:#9ca3af;font-family:Arial,Helvetica,sans-serif;">Si tienes alguna duda, responde a este correo.</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>"""
        
        # Test mode: send to admin email
        recipient_email = settings.ADMIN_EMAIL if settings.DEBUG else order.customer_email
        if hasattr(settings, 'IS_TEST_MODE') and settings.IS_TEST_MODE:
            recipient_email = settings.ADMIN_EMAIL

        # Use Resend's sandbox domain which doesn't require verification
        params = {
            "from": "Zumi Store <onboarding@resend.dev>",
            "to": recipient_email,
            "subject": f"✅ Confirmación de Pedido - {order.order_number}",
            "html": html_content,
        }
        
        response = resend.Emails.send(params)
        logger.info(f"Order confirmation email sent for order {order.order_number}: {response}")
        return response
        
    except Exception as e:
        logger.error(f"Failed to send order confirmation email for {order.order_number}: {e}")
        return None

def send_new_order_notification(order):
    """
    Send email notification to admin when a new order is placed
    
    Args:
        order: Order instance
    """
    try:
        # Prepare data
        customer_name = order.shipping_recipient_name or order.customer_email.split('@')[0]
        order_number = order.order_number
        total = float(order.total)
        items_count = order.items.count()
        
        # Admin panel URL
        admin_url = f"{settings.FRONTEND_URL}/admin/orders"
        
        # Generate HTML
        html_content = f"""<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#fafafa;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#fafafa">
<tr>
<td align="center" style="padding:40px 20px;">
<table width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="max-width:600px;">
<!-- Header -->
<tr>
<td align="center" bgcolor="#10b981" style="padding:48px 40px;">
<h1 style="margin:0 0 12px 0;color:#ffffff;font-size:32px;font-weight:bold;font-family:Arial,Helvetica,sans-serif;">💰 Nueva Venta Exitosa</h1>
<p style="margin:0;color:#ffffff;font-size:16px;font-family:Arial,Helvetica,sans-serif;">Se ha recibido y pagado un nuevo pedido</p>
</td>
</tr>
<!-- Body -->
<tr>
<td style="padding:40px;">
<p style="margin:0 0 24px 0;font-size:16px;color:#1f2937;font-family:Arial,Helvetica,sans-serif;">¡Buenas noticias! Tienes una nueva venta de <strong>{customer_name}</strong>.</p>

<!-- Stats Grid -->
<table width="100%" cellpadding="16" cellspacing="0" border="0" bgcolor="#f0fdf4" style="margin-bottom:32px;border:1px solid #bbf7d0;">
<tr>
<td align="center" width="50%" style="border-right:1px solid #bbf7d0;">
<div style="font-size:12px;color:#166534;margin-bottom:4px;">TOTAL</div>
<div style="font-size:24px;font-weight:bold;color:#15803d;">${total:,.0f}</div>
</td>
<td align="center" width="50%">
<div style="font-size:12px;color:#166534;margin-bottom:4px;">ITEMS</div>
<div style="font-size:24px;font-weight:bold;color:#15803d;">{items_count}</div>
</td>
</tr>
</table>

<!-- Order Details -->
<table width="100%" cellpadding="12" cellspacing="0" border="0" bgcolor="#f9fafb" style="margin-bottom:32px;">
<tr>
<td style="color:#6b7280;font-size:14px;">Pedido:</td>
<td align="right" style="color:#111827;font-weight:bold;">{order_number}</td>
</tr>
<tr>
<td style="color:#6b7280;font-size:14px;">Cliente:</td>
<td align="right" style="color:#111827;font-weight:bold;">{customer_name}</td>
</tr>
<tr>
<td style="color:#6b7280;font-size:14px;">Email:</td>
<td align="right" style="color:#111827;font-weight:bold;">{order.customer_email}</td>
</tr>
</table>

<!-- Action Button -->
<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td align="center">
<a href="{admin_url}" style="display:inline-block;padding:16px 32px;background-color:#10b981;color:#ffffff;text-decoration:none;font-weight:bold;font-size:16px;font-family:Arial,Helvetica,sans-serif;border-radius:4px;">Ver Pedido en Admin</a>
</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>"""
        
        # Use Resend's sandbox domain which doesn't require verification
        params = {
            "from": "Zumi Store <onboarding@resend.dev>",
            "to": settings.ADMIN_EMAIL if hasattr(settings, 'ADMIN_EMAIL') else "admin@empresa.cl",
            "subject": f"💰 Nueva Venta: {order.order_number} (${total:,.0f})",
            "html": html_content,
        }
        
        response = resend.Emails.send(params)
        logger.info(f"New order notification sent for {order.order_number}: {response}")
        return response
        
    except Exception as e:
        logger.error(f"Failed to send new order notification for {order.order_number}: {e}")
        return None
