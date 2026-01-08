# -*- coding: utf-8 -*-
"""
Re-generation script for email_service.py to ensure 100% correct syntax.
This script will produce the final content of email_service.py.
"""

content = r'''# -*- coding: utf-8 -*-
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
    """
    try:
        customer_name = order.shipping_recipient_name or order.customer_email.split('@')[0]
        order_number = order.order_number
        customer_email = order.customer_email
        customer_phone = order.customer_phone or "No proporcionado"
        created_date = order.created_at.strftime('%d/%m/%Y %H:%M')
        
        shipping_parts = []
        if order.shipping_street_address: shipping_parts.append(order.shipping_street_address)
        if order.shipping_apartment: shipping_parts.append(f"Depto/Casa: {order.shipping_apartment}")
        if order.shipping_commune: shipping_parts.append(order.shipping_commune)
        if order.shipping_city: shipping_parts.append(order.shipping_city)
        if order.shipping_region: shipping_parts.append(order.shipping_region)
        shipping_address = ", ".join(shipping_parts) if shipping_parts else "No proporcionada"
        
        admin_url = f"{settings.FRONTEND_URL}/admin/orders"
        
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
<tr>
<td align="center" bgcolor="#8b5cf6" style="padding:48px 40px;">
<h1 style="margin:0 0 12px 0;color:#ffffff;font-size:32px;font-weight:bold;font-family:Arial,Helvetica,sans-serif;"> Nueva Solicitud de Cotizacion</h1>
<p style="margin:0;color:#ffffff;font-size:16px;font-family:Arial,Helvetica,sans-serif;">Un cliente ha solicitado una cotizacion</p>
</td>
</tr>
<tr>
<td style="padding:40px;">
<p style="margin:0 0 32px 0;font-size:16px;color:#4b5563;font-family:Arial,Helvetica,sans-serif;">Has recibido una nueva solicitud de cotizacion. Revisa los detalles a continuacion.</p>
<table width="100%" cellpadding="20" cellspacing="0" border="0" bgcolor="#f9fafb" style="margin-bottom:32px;border-left:4px solid #8b5cf6;">
<tr>
<td>
<table width="100%" cellpadding="8" cellspacing="0" border="0">
<tr>
<td style="color:#6b7280;font-size:14px;">Numero de Cotizacion:</td>
<td align="right" style="color:#111827;font-weight:bold;">{order_number}</td>
</tr>
<tr>
<td style="color:#6b7280;font-size:14px;">Fecha de Solicitud:</td>
<td align="right" style="color:#111827;font-weight:bold;">{created_date}</td>
</tr>
</table>
</td>
</tr>
</table>
<h3 style="margin:0 0 16px 0;font-size:18px;font-weight:bold;"> Informacion del Cliente</h3>
<table width="100%" cellpadding="16" cellspacing="0" border="0" bgcolor="#eff6ff" style="margin-bottom:32px;">
<tr>
<td><strong>Nombre:</strong> {customer_name}<br/><strong>Email:</strong> {customer_email}<br/><strong>Telefono:</strong> {customer_phone}</td>
</tr>
</table>
<h3 style="margin:0 0 16px 0;font-size:18px;font-weight:bold;"> Direccion de Envio</h3>
<table width="100%" cellpadding="16" cellspacing="0" border="0" bgcolor="#f0fdf4" style="margin-bottom:32px;">
<tr>
<td>{shipping_address}</td>
</tr>
</table>
<h3 style="margin:0 0 16px 0;font-size:18px;font-weight:bold;"> Productos Solicitados</h3>
<table width="100%" cellpadding="12" cellspacing="0" border="0" style="margin-bottom:32px;">
<tr bgcolor="#f9fafb">
<td style="font-weight:bold;border-bottom:2px solid #e5e7eb;">Producto</td>
<td align="center" style="font-weight:bold;border-bottom:2px solid #e5e7eb;">Cantidad</td>
<td align="right" style="font-weight:bold;border-bottom:2px solid #e5e7eb;">SKU</td>
</tr>"""
        
        items = order.items.all()
        for item in items:
            variant_info = f" - {item.variant_name}" if item.variant_name else ""
            html_content += f"""
<tr>
<td style="border-bottom:1px solid #e5e7eb;">{item.product_name}{variant_info}</td>
<td align="center" style="border-bottom:1px solid #e5e7eb;">{item.quantity}</td>
<td align="right" style="border-bottom:1px solid #e5e7eb;">{item.sku}</td>
</tr>"""
        
        if order.customer_notes:
            html_content += f"""
<h3 style="margin:32px 0 16px 0;font-size:18px;font-weight:bold;"> Notas del Cliente</h3>
<table width="100%" cellpadding="16" cellspacing="0" border="0" bgcolor="#fef3c7" style="margin-bottom:32px;border-left:4px solid #f59e0b;">
<tr>
<td>{order.customer_notes}</td>
</tr>
</table>"""
        
        html_content += f"""
</table>
<table width="100%" cellpadding="24" cellspacing="0" border="0" bgcolor="#7c3aed" style="margin-bottom:24px;">
<tr>
<td align="center">
<a href="{admin_url}" style="color:#ffffff;text-decoration:none;font-weight:bold;font-size:16px;">Ir al Panel de Administracion</a>
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
        
        params = {
            "from": "Zumi Store <onboarding@resend.dev>",
            "to": settings.ADMIN_EMAIL if hasattr(settings, 'ADMIN_EMAIL') else "admin@empresa.cl",
            "subject": f" Nueva Solicitud de Cotizacion - {order.order_number}",
            "html": html_content,
        }
        return resend.Emails.send(params)
    except Exception as e:
        logger.error(f"Failed to send quote request email: {e}")
        return None


def send_quote_response_notification(order):
    """
    Send email notification to customer when admin responds to their quote
    """
    try:
        from .pdf_generator import generate_quote_pdf
        import base64
        pdf_content = generate_quote_pdf(order)
        pdf_base64 = base64.b64encode(pdf_content).decode()
        
        customer_name = order.shipping_recipient_name or order.customer_email.split('@')[0]
        order_number = order.order_number
        total = float(order.total)
        total_formatted = f"${total:,.0f}"
        
        valid_until = order.quote_valid_until.strftime('%d/%m/%Y') if order.quote_valid_until else ""
        
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
<tr>
<td align="center" bgcolor="#8b5cf6" style="padding:48px 40px;">
<h1 style="margin:0 0 12px 0;color:#ffffff;font-size:32px;font-weight:bold;"> Tu Cotizacion esta Lista</h1>
<p style="margin:0;color:#ffffff;font-size:16px;">Hemos preparado tu cotizacion personalizada</p>
</td>
</tr>
<tr>
<td style="padding:40px;">
<p>Hola <strong>{customer_name}</strong>,</p>
<p>Tu cotizacion esta lista. Los detalles estan en el PDF adjunto.</p>
<table width="100%" cellpadding="20" cellspacing="0" border="0" bgcolor="#f9fafb" style="margin-bottom:32px;border-left:4px solid #8b5cf6;">
<tr>
<td>
<table width="100%" cellpadding="8" cellspacing="0" border="0">
<tr>
<td>Numero de Cotizacion:</td>
<td align="right"><strong>{order_number}</strong></td>
</tr>
<tr>
<td>Total:</td>
<td align="right"><strong style="color:#8b5cf6;">{total_formatted}</strong></td>
</tr>
</table>
</td>
</tr>
</table>"""
        
        if order.tenant.custom_domain:
            base_url = order.tenant.custom_domain
            if not base_url.startswith(('http://', 'https://')): base_url = f"https://{base_url}"
        else:
            base_url = settings.FRONTEND_URL
        if base_url.endswith('/'): base_url = base_url[:-1]
        
        payment_link = f"{base_url}/payment?order={order.id}&tenant={order.tenant.slug}"
        
        html_content += f"""
<table width="100%" cellpadding="24" cellspacing="0" border="0" bgcolor="#f0fdf4" style="margin-bottom:24px;border:1px solid #bbf7d0;border-radius:8px;">
<tr>
<td align="center">
<div style="font-weight:bold;color:#166534;margin-bottom:12px;font-size:18px;">Listo para comprar?</div>
<p style="margin:0 0 20px 0;color:#15803d;font-size:14px;">Puedes pagar tu cotizacion directamente en linea.</p>
<a href="{payment_link}" style="display:inline-block;padding:16px 32px;background-color:#16a34a;color:#ffffff;text-decoration:none;font-weight:bold;border-radius:6px;">Pagar Cotizacion Ahora</a>
</td>
</tr>
</table>"""
        
        if order.internal_notes:
            html_content += f"""
<h3 style="margin:32px 0 12px 0;font-size:16px;font-weight:bold;"> Notas Adicionales</h3>
<table width="100%" cellpadding="20" cellspacing="0" border="0" bgcolor="#f9fafb">
<tr>
<td>{order.internal_notes}</td>
</tr>
</table>"""
        
        html_content += """
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>"""
        
        params = {
            "from": "Zumi Store <onboarding@resend.dev>",
            "to": settings.ADMIN_EMAIL,
            "subject": f"Tu Cotizacion esta Lista - {order.order_number}",
            "html": html_content,
            "attachments": [{"filename": f"Cotizacion_{order.order_number}.pdf", "content": pdf_base64}]
        }
        return resend.Emails.send(params)
    except Exception as e:
        logger.error(f"Failed to send quote response notification: {e}")
        return None


def send_order_confirmation_email(order):
    """
    Send order confirmation email to customer after successful payment
    """
    try:
        customer_name = order.shipping_recipient_name or order.customer_email.split('@')[0]
        order_number = order.order_number
        total = float(order.total)
        total_formatted = f"${total:,.0f}"
        subtotal_formatted = f"${float(order.subtotal):,.0f}"
        shipping_formatted = f"${float(order.shipping_cost):,.0f}"
        created_date = order.created_at.strftime('%d/%m/%Y %H:%M')
        
        shipping_parts = []
        if order.shipping_street_address: shipping_parts.append(order.shipping_street_address)
        if order.shipping_apartment: shipping_parts.append(f"Depto/Casa: {order.shipping_apartment}")
        if order.shipping_commune: shipping_parts.append(order.shipping_commune)
        if order.shipping_city: shipping_parts.append(order.shipping_city)
        if order.shipping_region: shipping_parts.append(order.shipping_region)
        shipping_address = ", ".join(shipping_parts) if shipping_parts else "Retiro en tienda"
        
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
<tr>
<td align="center" bgcolor="#4f46e5" style="padding:48px 40px;">
<h1 style="margin:0 0 12px 0;color:#ffffff;font-size:32px;font-weight:bold;"> Gracias por tu compra!</h1>
<p style="margin:0;color:#ffffff;font-size:16px;">Tu pedido ha sido confirmado</p>
</td>
</tr>
<tr>
<td style="padding:40px;">
<p>Hola <strong>{customer_name}</strong>,</p>
<p>Hemos recibido tu pedido. A continuacion el resumen.</p>
<table width="100%" cellpadding="20" cellspacing="0" border="0" bgcolor="#f9fafb" style="margin-bottom:32px;border-left:4px solid #4f46e5;">
<tr>
<td>Pedido: <strong>{order_number}</strong><br/>Fecha: {created_date}</td>
</tr>
</table>
<h3 style="margin:0 0 16px 0;font-size:18px;font-weight:bold;"> Direccion de Envio</h3>
<table width="100%" cellpadding="16" cellspacing="0" border="0" bgcolor="#f0fdf4" style="margin-bottom:32px;">
<tr>
<td>{shipping_address}</td>
</tr>
</table>
<h3 style="margin:0 0 16px 0;font-size:18px;font-weight:bold;"> Tu Compra</h3>
<table width="100%" cellpadding="12" cellspacing="0" border="0" style="margin-bottom:32px;">
<tr bgcolor="#f9fafb">
<td style="font-weight:bold;border-bottom:2px solid #e5e7eb;">Producto</td>
<td align="center" style="font-weight:bold;border-bottom:2px solid #e5e7eb;">Cant.</td>
<td align="right" style="font-weight:bold;border-bottom:2px solid #e5e7eb;">Precio</td>
</tr>"""
        
        items = order.items.all()
        for item in items:
            variant_info = f" - {item.variant_name}" if item.variant_name else ""
            item_total_formatted = f"${float(item.total):,.0f}"
            html_content += f"""
<tr>
<td style="border-bottom:1px solid #e5e7eb;">{item.product_name}{variant_info}</td>
<td align="center" style="border-bottom:1px solid #e5e7eb;">{item.quantity}</td>
<td align="right" style="border-bottom:1px solid #e5e7eb;">{item_total_formatted}</td>
</tr>"""
        
        html_content += f"""
<tr>
<td colspan="2" align="right" style="padding:12px 12px 0 0;">Subtotal:</td>
<td align="right" style="padding:12px 0 0 12px;">{subtotal_formatted}</td>
</tr>
<tr>
<td colspan="2" align="right" style="padding:4px 12px 0 0;">Envio:</td>
<td align="right" style="padding:4px 0 0 12px;">{shipping_formatted}</td>
</tr>
<tr>
<td colspan="2" align="right" style="padding:12px 12px 0 0;font-weight:bold;">Total:</td>
<td align="right" style="padding:12px 0 0 12px;color:#4f46e5;font-size:18px;font-weight:bold;">{total_formatted}</td>
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
        
        recipient_email = settings.ADMIN_EMAIL if settings.DEBUG else order.customer_email
        params = {
            "from": "Zumi Store <onboarding@resend.dev>",
            "to": recipient_email,
            "subject": f" Confirmacion de Pedido - {order.order_number}",
            "html": html_content,
        }
        return resend.Emails.send(params)
    except Exception as e:
        logger.error(f"Failed to send order confirmation email: {e}")
        return None


def send_new_order_notification(order):
    """
    Send email notification to admin when a new order is placed
    """
    try:
        customer_name = order.shipping_recipient_name or order.customer_email.split('@')[0]
        order_number = order.order_number
        total = float(order.total)
        total_formatted = f"${total:,.0f}"
        items_count = order.items.count()
        admin_url = f"{settings.FRONTEND_URL}/admin/orders"
        
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
<tr>
<td align="center" bgcolor="#10b981" style="padding:48px 40px;">
<h1 style="margin:0 0 12px 0;color:#ffffff;font-size:32px;font-weight:bold;"> Nueva Venta Exitosa</h1>
<p style="margin:0;color:#ffffff;font-size:16px;">Se ha recibido un nuevo pedido</p>
</td>
</tr>
<tr>
<td style="padding:40px;">
<p>Nueva venta de <strong>{customer_name}</strong>.</p>
<table width="100%" cellpadding="16" cellspacing="0" border="0" bgcolor="#f0fdf4" style="margin-bottom:32px;border:1px solid #bbf7d0;">
<tr>
<td align="center" width="50%" style="border-right:1px solid #bbf7d0;">
<div style="font-size:12px;">TOTAL</div>
<div style="font-size:24px;font-weight:bold;">{total_formatted}</div>
</td>
<td align="center" width="50%">
<div style="font-size:12px;">ITEMS</div>
<div style="font-size:24px;font-weight:bold;">{items_count}</div>
</td>
</tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td align="center">
<a href="{admin_url}" style="display:inline-block;padding:16px 32px;background-color:#10b981;color:#ffffff;text-decoration:none;font-weight:bold;border-radius:4px;">Ver Pedido en Admin</a>
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
        
        params = {
            "from": "Zumi Store <onboarding@resend.dev>",
            "to": settings.ADMIN_EMAIL,
            "subject": f" Nueva Venta: {order.order_number} ({total_formatted})",
            "html": html_content,
        }
        return resend.Emails.send(params)
    except Exception as e:
        logger.error(f"Failed to send new order notification: {e}")
        return None
'''

with open('orders/email_service.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Generated email_service.py")
