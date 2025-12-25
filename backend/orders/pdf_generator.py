"""
PDF Generator for Quote Documents
Generates professional PDF quotes using ReportLab with Zumi branding
"""
from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT, TA_JUSTIFY
from reportlab.pdfgen import canvas
from datetime import datetime


class QuoteCanvas(canvas.Canvas):
    """Custom canvas for header and footer"""
    
    def __init__(self, *args, **kwargs):
        canvas.Canvas.__init__(self, *args, **kwargs)
        self.pages = []
        
    def showPage(self):
        self.pages.append(dict(self.__dict__))
        self._startPage()
        
    def save(self):
        page_count = len(self.pages)
        for page_num, page in enumerate(self.pages, 1):
            self.__dict__.update(page)
            self.draw_header()
            self.draw_footer(page_num, page_count)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)
        
    def draw_header(self):
        """Draw header with gradient effect (simulated with rectangles)"""
        # Gradient background (simulated with multiple rectangles)
        self.setFillColor(colors.HexColor('#7c3aed'))
        self.rect(0, letter[1] - 2*inch, letter[0], 2*inch, fill=1, stroke=0)
        
        # Company name
        self.setFillColor(colors.white)
        self.setFont('Helvetica-Bold', 32)
        self.drawString(0.75*inch, letter[1] - 1.2*inch, 'ZUMI')
        
        self.setFont('Helvetica', 10)
        self.drawString(0.75*inch, letter[1] - 1.45*inch, 'Muebles de Calidad')
        
        # Contact info (right side)
        self.setFont('Helvetica', 9)
        contact_y = letter[1] - 1.1*inch
        self.drawRightString(letter[0] - 0.75*inch, contact_y, 'www.zumi.cl')
        self.drawRightString(letter[0] - 0.75*inch, contact_y - 0.15*inch, 'contacto@zumi.cl')
        self.drawRightString(letter[0] - 0.75*inch, contact_y - 0.3*inch, '+56 9 8765 4321')
        
    def draw_footer(self, page_num, page_count):
        """Draw footer"""
        self.setFillColor(colors.HexColor('#f9fafb'))
        self.rect(0, 0, letter[0], 0.75*inch, fill=1, stroke=0)
        
        self.setFillColor(colors.HexColor('#6b7280'))
        self.setFont('Helvetica', 8)
        footer_text = 'Gracias por confiar en Zumi. Para cualquier consulta, no dude en contactarnos.'
        self.drawCentredString(letter[0]/2, 0.45*inch, footer_text)
        
        self.setFillColor(colors.HexColor('#9ca3af'))
        self.setFont('Helvetica', 7)
        copyright_text = f'Zumi © 2025 • Todos los derechos reservados • www.zumi.cl • Página {page_num} de {page_count}'
        self.drawCentredString(letter[0]/2, 0.3*inch, copyright_text)


def generate_quote_pdf(order):
    """
    Generate a professional PDF quote document with Zumi branding
    
    Args:
        order: Order instance with quote information
        
    Returns:
        bytes: PDF file content
    """
    buffer = BytesIO()
    
    # Create PDF document with custom canvas
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=0.75*inch,
        leftMargin=0.75*inch,
        topMargin=2.2*inch,  # Space for header
        bottomMargin=1*inch,  # Space for footer
    )
    
    # Container for PDF elements
    elements = []
    
    # Define styles
    styles = getSampleStyleSheet()
    
    # Custom styles
    badge_style = ParagraphStyle(
        'Badge',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#7c3aed'),
        alignment=TA_LEFT,
        fontName='Helvetica-Bold',
        leftIndent=10,
        rightIndent=10,
        spaceBefore=5,
        spaceAfter=5,
    )
    
    quote_number_style = ParagraphStyle(
        'QuoteNumber',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#111827'),
        spaceAfter=12,
        fontName='Helvetica-Bold'
    )
    
    heading_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontSize=12,
        textColor=colors.HexColor('#111827'),
        spaceAfter=12,
        spaceBefore=16,
        fontName='Helvetica-Bold'
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.HexColor('#4b5563'),
        spaceAfter=4
    )
    
    small_style = ParagraphStyle(
        'Small',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.HexColor('#6b7280'),
        spaceAfter=3
    )
    
    # Badge
    badge_table = Table([['COTIZACIÓN']], colWidths=[1.5*inch])
    badge_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f3e8ff')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#7c3aed')),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('ROUNDEDCORNERS', [8, 8, 8, 8]),
        ('LINEBELOW', (0, 0), (-1, -1), 1, colors.HexColor('#c4b5fd')),
    ]))
    elements.append(badge_table)
    elements.append(Spacer(1, 8))
    
    # Quote number and dates in two columns
    left_col = []
    left_col.append(Paragraph(order.order_number, quote_number_style))
    
    date_info = f"""
    <font size=9 color="#4b5563">
    <b>Fecha de emisión:</b> {datetime.now().strftime('%d de %B de %Y')}<br/>
    <b>Válido hasta:</b> {order.quote_valid_until.strftime('%d de %B de %Y') if order.quote_valid_until else 'N/A'}
    </font>
    """
    left_col.append(Paragraph(date_info, normal_style))
    
    # Customer info box
    customer_info = f"""
    <font size=7 color="#6b7280"><b>CLIENTE</b></font><br/>
    <font size=9 color="#111827"><b>{order.shipping_recipient_name or 'N/A'}</b></font><br/>
    <font size=8 color="#4b5563">{order.customer_email}</font><br/>
    <font size=8 color="#4b5563">{order.customer_phone or 'N/A'}</font><br/>
    <font size=8 color="#4b5563">────────────────</font><br/>
    <font size=8 color="#4b5563">{order.shipping_street_address}</font><br/>
    <font size=8 color="#4b5563">{order.shipping_commune}, {order.shipping_city}</font><br/>
    <font size=8 color="#4b5563">{order.shipping_region}</font>
    """
    
    customer_box = Table([[Paragraph(customer_info, normal_style)]], colWidths=[2.5*inch])
    customer_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f9fafb')),
        ('ROUNDEDCORNERS', [8, 8, 8, 8]),
        ('LINEBELOW', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb')),
        ('PADDING', (0, 0), (-1, -1), 12),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    
    # Combine left and right columns
    header_table = Table([[left_col, customer_box]], colWidths=[3.5*inch, 2.5*inch])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    
    elements.append(header_table)
    elements.append(Spacer(1, 20))
    
    # Products section
    elements.append(Paragraph("Detalle de Productos", heading_style))
    
    # Products table header
    products_data = [[
        Paragraph('<b>Producto</b>', small_style),
        Paragraph('<b>Cantidad</b>', small_style),
        Paragraph('<b>Precio Unit.</b>', small_style),
        Paragraph('<b>Total</b>', small_style)
    ]]
    
    # Add products
    for item in order.items.all():
        # Product name and details
        product_info = f"""
        <font size=9 color="#111827"><b>{item.product_name}</b></font><br/>
        <font size=8 color="#6b7280">{item.variant_name or ''}</font><br/>
        <font size=7 color="#9ca3af">SKU: {item.sku}</font>
        """
        
        products_data.append([
            Paragraph(product_info, normal_style),
            Paragraph(f'<para align=center>{item.quantity}</para>', normal_style),
            Paragraph(f'<para align=right>${float(item.unit_price):,.0f}</para>', normal_style),
            Paragraph(f'<para align=right><b>${float(item.total):,.0f}</b></para>', normal_style)
        ])
    
    products_table = Table(products_data, colWidths=[3*inch, 0.8*inch, 1.1*inch, 1.1*inch])
    products_table.setStyle(TableStyle([
        # Header
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f9fafb')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#374151')),
        ('ALIGN', (1, 0), (1, 0), 'CENTER'),
        ('ALIGN', (2, 0), (-1, 0), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 8),
        ('PADDING', (0, 0), (-1, 0), 10),
        ('LINEBELOW', (0, 0), (-1, 0), 1, colors.HexColor('#e5e7eb')),
        
        # Data rows
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor('#111827')),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('PADDING', (0, 1), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        
        # Grid
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
        ('ROUNDEDCORNERS', [8, 8, 8, 8]),
    ]))
    
    elements.append(products_table)
    elements.append(Spacer(1, 20))
    
    # Summary (right-aligned)
    tax = float(order.tax_amount)
    
    summary_data = [
        ['Subtotal', f'${float(order.subtotal):,.0f}'],
        ['Envío', f'${float(order.shipping_cost):,.0f}'],
        ['IVA (19%)', f'${tax:,.0f}'],
    ]
    
    summary_table = Table(summary_data, colWidths=[1.5*inch, 1.5*inch])
    summary_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#4b5563')),
        ('PADDING', (0, 0), (-1, -1), 4),
    ]))
    
    # Total
    total_data = [['Total', f'${float(order.total):,.0f}']]
    total_table = Table(total_data, colWidths=[1.5*inch, 1.5*inch])
    total_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (0, -1), 12),
        ('FONTSIZE', (1, 0), (1, -1), 16),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#111827')),
        ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#7c3aed')),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('LINEABOVE', (0, 0), (-1, 0), 1, colors.HexColor('#e5e7eb')),
    ]))
    
    # Right-align summary
    summary_container = Table([[summary_table], [total_table]], colWidths=[3*inch])
    summary_wrapper = Table([[None, summary_container]], colWidths=[3*inch, 3*inch])
    
    elements.append(summary_wrapper)
    elements.append(Spacer(1, 20))
    
    # Notes if any
    if order.internal_notes:
        notes_box = Table([[Paragraph(f'<b>Notas Importantes</b><br/>{order.internal_notes}', normal_style)]], 
                         colWidths=[6*inch])
        notes_box.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f3e8ff')),
            ('ROUNDEDCORNERS', [8, 8, 8, 8]),
            ('LINEBELOW', (0, 0), (-1, -1), 1, colors.HexColor('#e9d5ff')),
            ('PADDING', (0, 0), (-1, -1), 12),
        ]))
        elements.append(notes_box)
        elements.append(Spacer(1, 16))
    
    # Terms and Conditions
    elements.append(Paragraph("Términos y Condiciones", heading_style))
    
    terms = [
        f"Validez de la cotización: {order.quote_valid_until.strftime('%d de %B de %Y') if order.quote_valid_until else '30 días desde la fecha de emisión'}",
        "Forma de pago: 50% anticipo, 50% contra entrega",
        "Tiempo de fabricación: 15 días hábiles",
        "Despacho dentro de la Región Metropolitana incluido",
        "Garantía: 1 año contra defectos de fabricación",
    ]
    
    for term in terms:
        term_para = Paragraph(f'<font color="#7c3aed">•</font> <font color="#4b5563">{term}</font>', small_style)
        elements.append(term_para)
    
    # Build PDF with custom canvas
    doc.build(elements, canvasmaker=QuoteCanvas)
    
    # Get PDF content
    pdf_content = buffer.getvalue()
    buffer.close()
    
    return pdf_content
