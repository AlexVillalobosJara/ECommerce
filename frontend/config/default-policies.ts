export const DEFAULT_PRIVACY_POLICY = `1. Responsable del Tratamiento de Datos
El responsable de la recopilación y tratamiento de tus datos personales es [LEGAL_NAME], con domicilio en [ADDRESS] y correo electrónico de contacto [EMAIL].

2. Datos que Recopilamos
Al utilizar nuestra tienda, recopilamos la siguiente información:
Datos de Identificación: Nombre, apellidos y número de identificación (si aplica).
Datos de Contacto: Correo electrónico, número de teléfono y dirección de envío/facturación.
Datos de Pago: Información procesada de forma segura a través de nuestras pasarelas de pago (nosotros no almacenamos los datos completos de tu tarjeta).
Datos Técnicos: Dirección IP, tipo de dispositivo y datos de navegación mediante cookies.

3. Finalidad del Tratamiento
Utilizamos tus datos para:
Gestionar tus pedidos, envíos y devoluciones.
Procesar los pagos de forma segura.
Enviarte comunicaciones comerciales (solo si has dado tu consentimiento explícito).
Mejorar la experiencia de usuario en nuestra plataforma.
Cumplir con obligaciones legales y contables.

4. Base Legal para el Tratamiento
Tratamos tus datos basándonos en:
Ejecución de un contrato: Para procesar y entregarte tu compra.
Consentimiento: Para el envío de newsletters o marketing.
Interés legítimo: Para mejorar nuestros servicios y prevenir fraudes.

5. ¿Con quién compartimos tus datos?
No vendemos tus datos a terceros. Sin embargo, los compartimos con proveedores esenciales para el funcionamiento del ecommerce:
Proveedores de Hosting/SaaS: [SAAS_NAME] para la infraestructura tecnológica.
Empresas de Logística: Para entregar tus paquetes.
Pasarelas de Pago: Para procesar las transacciones.
Autoridades: Cuando exista una obligación legal.

6. Tus Derechos
Como usuario, tienes derecho a:
Acceder a tus datos personales.
Rectificar datos inexactos.
Suprimir tus datos cuando ya no sean necesarios.
Oponerte al tratamiento de tus datos para fines de marketing.
Para ejercer estos derechos, puedes escribirnos a: [EMAIL].

7. Conservación de Datos
Mantendremos tus datos personales solo durante el tiempo necesario para cumplir con los fines para los que fueron recogidos o para cumplir con requisitos legales (como la normativa tributaria).

Última fecha de actualización: [CURRENT_DATE]`;

export const DEFAULT_TERMS_AND_CONDITIONS = `1. Información General
Este sitio web es operado por [LEGAL_NAME]. En todo el sitio, los términos "nosotros", "nos" y "nuestro" se refieren a [LEGAL_NAME]. Al visitar nuestro sitio y/o comprar algo de nosotros, participas en nuestro "Servicio" y aceptas los siguientes términos y condiciones.

2. Condiciones de la Tienda Online
Al aceptar estos Términos, declaras que tienes al menos la mayoría de edad en tu estado o provincia de residencia. No puedes usar nuestros productos para ningún propósito ilegal ni violar cualquier ley en tu jurisdicción.

3. Precios y Productos
Precios: Todos los precios están sujetos a cambios sin previo aviso. Nos reservamos el derecho de modificar o discontinuar el Servicio en cualquier momento.
Impuestos: Los precios [TAX_INCLUDE] los impuestos aplicables según la legislación vigente, los cuales se detallarán en el resumen de compra.
Disponibilidad: Nos reservamos el derecho de limitar las cantidades de cualquier producto o servicio que ofrecemos.

4. Exactitud de Facturación y Cuenta
Nos reservamos el derecho de rechazar cualquier pedido que realice con nosotros. Puedes ser notificado por correo electrónico o dirección de facturación si realizamos un cambio o cancelamos un pedido. Te comprometes a proporcionar información de compra y cuenta actual, completa y precisa.

5. Envíos y Entrega
Plazos: Los tiempos de entrega estimados son de [SHIPPING_MIN] a [SHIPPING_MAX] días hábiles, dependiendo del destino.
Riesgo: El riesgo de pérdida y el título de los artículos comprados pasan a ti en el momento de la entrega al transportista.
Costos: Los gastos de envío se calcularán y mostrarán al finalizar la compra.

6. Política de Devoluciones y Reembolsos
Plazo de desistimiento: El cliente tiene derecho a devolver su compra en un plazo de [RETURN_DAYS] días naturales desde la recepción del producto.
Condiciones: El producto debe estar sin usar, en las mismas condiciones en que se recibió y en su embalaje original.
Proceso: Para iniciar una devolución, contacta a [EMAIL]. Los gastos de envío por devolución corren a cargo del [RETURN_COST].

7. Garantía
Nuestros productos cuentan con una garantía legal de [WARRANTY_PERIOD] contra defectos de fabricación. Esta garantía no cubre daños causados por mal uso, accidentes o desgaste natural.

8. Exclusión de Responsabilidad
No garantizamos que el uso de nuestro servicio sea ininterrumpido, puntual o libre de errores. En ningún caso [LEGAL_NAME] será responsable por cualquier daño, pérdida o reclamo que surja del uso de cualquiera de los productos adquiridos mediante el servicio.

9. Modificaciones
Nos reservamos el derecho de actualizar, cambiar o reemplazar cualquier parte de estos Términos y Condiciones mediante la publicación de actualizaciones en nuestro sitio web.

10. Ley Aplicable
Estos Términos y cualquier acuerdo aparte por el que te proporcionemos servicios se regirán e interpretarán de conformidad con las leyes de [COUNTRY].`;

export function formatPolicy(template: string, tenant: any): string {
    const today = new Date().toLocaleDateString('es-CL');
    return template
        .replace(/\[NOMBRE DE LA EMPRESA\/CLIENTE\]|\[LEGAL_NAME\]|\[NOMBRE DE LA EMPRESA\]/g, tenant.legal_name || tenant.name || '[Nombre Empresa]')
        .replace(/\[DIRECCIÓN COMPLETA\]|\[ADDRESS\]/g, tenant.address || '[Dirección]')
        .replace(/\[CORREO ELECTRÓNICO\]|\[CORREO ELECTRÓNICO DE SOPORTE\]|\[EMAIL\]|\[CORREO DE SOPORTE\]/g, tenant.smtp_from_email || tenant.email || '[Email]')
        .replace(/\[Nombre de tu App SaaS\]|\[SAAS_NAME\]/g, 'E-commerce SaaS')
        .replace(/\[PAÍS\/ESTADO\]|\[PAÍS\]|\[COUNTRY\]/g, tenant.country || 'Chile')

        // Terms specifics
        .replace(/\[incluyen \/ no incluyen\]|\[TAX_INCLUDE\]/g, tenant.prices_include_tax ? 'incluyen' : 'no incluyen')
        .replace(/\[X a Y\]|\[SHIPPING_MIN\] a \[SHIPPING_MAX\]/g, `${tenant.shipping_days_min || 'X'} a ${tenant.shipping_days_max || 'Y'}`)
        .replace(/\[14 o 30\]|\[RETURN_DAYS\]/g, (tenant.return_window_days || '30').toString())
        .replace(/\[cliente \/ empresa, según política\]|\[RETURN_COST\]/g, tenant.return_shipping_cost_cover === 'Company' ? 'Empresa' : 'Cliente')
        .replace(/\[X meses\/años\]|\[WARRANTY_PERIOD\]/g, tenant.warranty_period || '6 meses')

        .replace(/\[CURRENT_DATE\]/g, today);
}
