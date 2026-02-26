import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { tickets } from '../../../../lib/db/schema';
import { eq } from 'drizzle-orm';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id: ticketId } = body;

    if (!ticketId) {
      return NextResponse.json({ message: 'Ticket ID es requerido' }, { status: 400 });
    }

    // Obtener datos del ticket
    const ticketData = await db.query.tickets.findFirst({
      where: eq(tickets.id, ticketId),
      with: {
        user: true,
        equipment: true,
      },
    });

    if (!ticketData) {
      return NextResponse.json({ message: 'Ticket no encontrado' }, { status: 404 });
    }

    // Crear PDF con formato EXACTO del gobierno
    const doc = new PDFDocument({ size: 'LETTER', margin: 30 });
    
    // Configuración de colores y medidas exactas
    const govPurple = '#2563eb'; // Color azul clínico estándar
    const pageWidth = 612 - 60; // Ancho útil (letter - márgenes)
    const margin = 30;
    
    let yPos = 50;
    
    // ========= ENCABEZADO MODIFICADO =========
    
    // Logo placeholder (cuadro para logo del consultorio)
    // doc.image('path/to/logo.png', margin, yPos, { width: 80 }) // Placeholder para futura imagen

    // Texto del Consultorio
    doc.fontSize(14)
       .fillColor('#000000')
       .font('Helvetica-Bold')
       .text('CONSULTORIO', margin + 10, yPos + 15)
       .text('DENTAL', margin + 10, yPos + 30)
       .fontSize(10)
       .font('Helvetica')
       .text('SONRISAS', margin + 10, yPos + 45);
    
    // Título principal alineado
    doc.fontSize(16)
       .fillColor('#000000')
       .font('Helvetica-Bold')
       .text('REPORTE DE SERVICIO DENTAL', margin + 150, yPos + 25, { 
         align: 'center',
         width: pageWidth - 250 
       });
    
    // Subtítulo del departamento
    doc.fontSize(10)
       .font('Helvetica')
       .text('MANTENIMIENTO DE EQUIPOS Y CLÍNICA', margin + 150, yPos + 50, {
         align: 'center',
         width: pageWidth - 250
       });
    
    yPos += 110;
    
    // ========= SECCIÓN SUPERIOR DERECHA (No. REPORTE y FECHA) =========
    const rightX = pageWidth - 200;
    
    // Número de reporte
    doc.rect(rightX, yPos, 200, 20)
       .fillAndStroke(govPurple, govPurple);
    
    doc.fontSize(10)
       .fillColor('#FFFFFF')
       .font('Helvetica-Bold')
       .text('No. DE REPORTE:', rightX + 8, yPos + 6);
    
    doc.rect(rightX, yPos + 20, 200, 25)
       .fillAndStroke('#FFFFFF', '#CCCCCC');
    
    doc.fontSize(12)
       .fillColor('#000000')
       .font('Helvetica-Bold')
       .text(ticketData.id, rightX + 8, yPos + 30);
    
    // Fecha
    yPos += 55;
    doc.rect(rightX, yPos, 200, 20)
       .fillAndStroke(govPurple, govPurple);
    
    doc.fontSize(10)
       .fillColor('#FFFFFF')
       .font('Helvetica-Bold')
       .text('FECHA:', rightX + 8, yPos + 6);
    
    doc.rect(rightX, yPos + 20, 200, 25)
       .fillAndStroke('#FFFFFF', '#CCCCCC');
    
    const fecha = ticketData.createdAt ? new Date(ticketData.createdAt).toLocaleDateString('es-MX') : new Date().toLocaleDateString('es-MX');
    doc.fontSize(10)
       .fillColor('#000000')
       .font('Helvetica')
       .text(fecha, rightX + 8, yPos + 30);
    
    // Reiniciar Y para la columna izquierda
    yPos = 160;
    
    // ========= DATOS DE USUARIO (COLUMNA IZQUIERDA) =========
    
    // Encabezado "DATOS DE USUARIO"
    doc.rect(margin, yPos, 280, 22)
       .fillAndStroke(govPurple, govPurple);
    
    doc.fontSize(11)
       .fillColor('#FFFFFF')
       .font('Helvetica-Bold')
       .text('DATOS DE USUARIO', margin + 10, yPos + 7);
    
    yPos += 22;
    
    // Campos de usuario con formato exacto
    const nombreCompleto = ticketData.user?.name || '';
    const nombres = nombreCompleto.split(' ');
    const primerNombre = nombres[0] || '';
    const apellidos = nombres.slice(1).join(' ') || '';
    
    const userFields = [
      { label: 'NOMBRE(S):', value: primerNombre },
      { label: 'APELLIDOS:', value: apellidos },
      { label: 'NO. DE EMPLEADO:', value: ticketData.user?.id || '' },
      { label: 'DEPARTAMENTO:', value: ticketData.user?.department || '' }
    ];
    
    userFields.forEach((field, index) => {
      const fieldHeight = 20;
      
      doc.rect(margin, yPos, 280, fieldHeight)
         .fillAndStroke('#FFFFFF', '#CCCCCC');
      
      doc.fontSize(9)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text(field.label, margin + 8, yPos + 7);
      
      // Ajustar tamaño de fuente si el texto es muy largo
      let valueFontSize = 9;
      doc.font('Helvetica').fontSize(valueFontSize);
      const maxValueWidth = 160; // 280 (width) - 110 (start) - 10 (padding)
      
      while (doc.widthOfString(field.value) > maxValueWidth && valueFontSize > 5) {
        valueFontSize -= 0.5;
        doc.fontSize(valueFontSize);
      }
      
      // Centrar verticalmente si la fuente es más pequeña
      const yOffset = valueFontSize < 9 ? (9 - valueFontSize) / 2 : 0;
      
      doc.text(field.value, margin + 110, yPos + 7 + yOffset);
      
      yPos += fieldHeight;
    });
    
    // ========= DATOS DEL EQUIPO (COLUMNA DERECHA) =========
    let equipoY = 160;
    const equipoX = pageWidth - 280;
    
    // Encabezado "DATOS DEL EQUIPO"
    doc.rect(equipoX, equipoY, 280, 22)
       .fillAndStroke(govPurple, govPurple);
    
    doc.fontSize(11)
       .fillColor('#FFFFFF')
       .font('Helvetica-Bold')
       .text('DATOS DEL EQUIPO', equipoX + 10, equipoY + 7);
    
    equipoY += 22;
    
    // Campos de equipo con formato exacto
    const equipFields = [
      { label: 'TIPO:', value: ticketData.equipment?.type || '' },
      { label: 'MARCA:', value: ticketData.equipment?.brand || '' },
      { label: 'MODELO:', value: ticketData.equipment?.model || '' },
      { label: 'NO. DE INVENTARIO:', value: (ticketData.equipment as any)?.activo_fijo || ticketData.equipment?.serial || '' }
    ];
    
    equipFields.forEach((field, index) => {
      const fieldHeight = 20;
      
      doc.rect(equipoX, equipoY, 280, fieldHeight)
         .fillAndStroke('#FFFFFF', '#CCCCCC');
      
      doc.fontSize(9)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text(field.label, equipoX + 8, equipoY + 7);
      
      doc.font('Helvetica')
         .text(field.value, equipoX + 110, equipoY + 7);
      
      equipoY += fieldHeight;
    });
    
    // ========= CARACTERÍSTICAS DEL EQUIPO =========
    yPos += 30; // Espacio entre secciones
    
    // Encabezado "CARACTERÍSTICAS DEL EQUIPO"
    doc.rect(margin, yPos, 280, 22)
       .fillAndStroke(govPurple, govPurple);
    
    doc.fontSize(11)
       .fillColor('#FFFFFF')
       .font('Helvetica-Bold')
       .text('CARACTERÍSTICAS DEL EQUIPO', margin + 10, yPos + 7);
    
    yPos += 22;
    
    // Campos de características (normalmente vacíos para llenar a mano)
    const caracFields = [
      { label: 'PROCESADOR:', value: '' },
      { label: 'MEMORIA RAM:', value: '' },
      { label: 'DISCO DURO:', value: '' },
      { label: 'OTROS:', value: '' }
    ];
    
    caracFields.forEach((field, index) => {
      const fieldHeight = 20;
      
      doc.rect(margin, yPos, 280, fieldHeight)
         .fillAndStroke('#FFFFFF', '#CCCCCC');
      
      doc.fontSize(9)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text(field.label, margin + 8, yPos + 7);
      
      // Líneas punteadas para llenar a mano
      doc.font('Helvetica')
         .text('_______________________', margin + 100, yPos + 7);
      
      yPos += fieldHeight;
    });
    
    // ========= TIPO DE SERVICIO (COLUMNA DERECHA) =========
    let tipoServicioY = 270; // Posición fija para alinear con características
    
    // Encabezado "TIPO DE SERVICIO"
    doc.rect(equipoX, tipoServicioY, 280, 22)
       .fillAndStroke(govPurple, govPurple);
    
    doc.fontSize(11)
       .fillColor('#FFFFFF')
       .font('Helvetica-Bold')
       .text('TIPO DE SERVICIO', equipoX + 10, tipoServicioY + 7);
    
    tipoServicioY += 22;
    
    // Caja para checkboxes
    doc.rect(equipoX, tipoServicioY, 280, 60)
       .fillAndStroke('#FFFFFF', '#CCCCCC');
    
    // Checkboxes con formato exacto del gobierno
    const serviceTypes = [
      { label: 'PREVENTIVO', value: 'Mantenimiento Preventivo' },
      { label: 'CORRECTIVO', value: 'Reparación' },
      { label: 'INSTALACIÓN', value: 'Instalación' }
    ];
    
    let checkY = tipoServicioY + 10;
    
    serviceTypes.forEach((service, index) => {
      const isSelected = ticketData.serviceType?.toLowerCase().includes(service.value.toLowerCase()) ||
                        ticketData.serviceType?.toLowerCase().includes(service.label.toLowerCase());
      
      // Checkbox cuadrado
      doc.rect(equipoX + 15, checkY, 12, 12)
         .stroke('#000000');
      
      // Marca si está seleccionado
      if (isSelected) {
        doc.fontSize(10)
           .fillColor('#000000')
           .font('Helvetica-Bold')
           .text('✓', equipoX + 17, checkY + 2);
      }
      
      // Etiqueta del servicio
      doc.fontSize(10)
         .fillColor('#000000')
         .font('Helvetica')
         .text(service.label, equipoX + 35, checkY + 3);
      
      checkY += 18;
    });
    
    // ========= SECCIONES DE TEXTO GRANDES =========
    yPos += 40; // Espacio para la siguiente sección
    
    // DIAGNÓSTICO TÉCNICO (Ancho completo)
    doc.rect(margin, yPos, pageWidth, 22)
       .fillAndStroke(govPurple, govPurple);
    
    doc.fontSize(11)
       .fillColor('#FFFFFF')
       .font('Helvetica-Bold')
       .text('DIAGNÓSTICO TÉCNICO', margin + 10, yPos + 7);
    
    yPos += 22;
    
    // Área de texto para diagnóstico
    doc.rect(margin, yPos, pageWidth, 60)
       .fillAndStroke('#FFFFFF', '#CCCCCC');
    
    doc.fontSize(10)
       .fillColor('#000000')
       .font('Helvetica')
       .text(ticketData.diagnostic || ticketData.observations || '', margin + 10, yPos + 10, {
         width: pageWidth - 20,
         height: 50
       });
    
    yPos += 70;
    
    // TRABAJO REALIZADO
    doc.rect(margin, yPos, pageWidth, 22)
       .fillAndStroke(govPurple, govPurple);
    
    doc.fontSize(11)
       .fillColor('#FFFFFF')
       .font('Helvetica-Bold')
       .text('TRABAJO REALIZADO', margin + 10, yPos + 7);
    
    yPos += 22;
    
    // Área de texto para trabajo realizado
    doc.rect(margin, yPos, pageWidth, 60)
       .fillAndStroke('#FFFFFF', '#CCCCCC');
    
    doc.fontSize(10)
       .fillColor('#000000')
       .font('Helvetica')
       .text(ticketData.diagnostic || 'Trabajo de mantenimiento realizado según el tipo de servicio solicitado.', margin + 10, yPos + 10, {
         width: pageWidth - 20,
         height: 50
       });
    
    yPos += 70;
    
    // OBSERVACIONES
    doc.rect(margin, yPos, pageWidth, 22)
       .fillAndStroke(govPurple, govPurple);
    
    doc.fontSize(11)
       .fillColor('#FFFFFF')
       .font('Helvetica-Bold')
       .text('OBSERVACIONES', margin + 10, yPos + 7);
    
    yPos += 22;
    
    // Área de texto para observaciones
    doc.rect(margin, yPos, pageWidth, 60)
       .fillAndStroke('#FFFFFF', '#CCCCCC');
    
    doc.fontSize(10)
       .fillColor('#000000')
       .font('Helvetica')
       .text(ticketData.observations || '', margin + 10, yPos + 10, {
         width: pageWidth - 20,
         height: 50
       });
    
    yPos += 80;
    
    // ========= SECCIÓN DE FIRMAS =========
    
    // Línea divisoria antes de firmas
    doc.moveTo(margin, yPos)
       .lineTo(pageWidth + margin, yPos)
       .stroke('#CCCCCC');
    
    yPos += 30;
    
    // Firmas en dos columnas
    const firmaWidth = (pageWidth - 60) / 2;
    
    // Firma del técnico (izquierda)
    doc.fontSize(10)
       .fillColor('#000000')
       .font('Helvetica-Bold')
       .text('TÉCNICO QUE REALIZÓ EL SERVICIO', margin, yPos);
    
    yPos += 50;
    
    // Línea para firma técnico
    doc.moveTo(margin, yPos)
       .lineTo(margin + firmaWidth, yPos)
       .stroke('#000000');
    
    doc.fontSize(9)
       .font('Helvetica')
       .text('NOMBRE Y FIRMA', margin, yPos + 10);
    
    // Firma del usuario (derecha)
    const firmaDerechaX = margin + firmaWidth + 60;
    
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('USUARIO QUE RECIBE', firmaDerechaX, yPos - 50);
    
    // Línea para firma usuario
    doc.moveTo(firmaDerechaX, yPos)
       .lineTo(firmaDerechaX + firmaWidth, yPos)
       .stroke('#000000');
    
    doc.fontSize(9)
       .font('Helvetica')
       .text('NOMBRE Y FIRMA', firmaDerechaX, yPos + 10);
    
    // Información adicional en el pie
    yPos += 40;
    
    doc.fontSize(8)
       .fillColor('#666666')
       .font('Helvetica')
       .text('SECRETARÍA DE DESARROLLO SOCIAL - GOBIERNO DEL ESTADO DE SONORA', margin, yPos, {
         align: 'center',
         width: pageWidth
       });
    
    // Generar el archivo PDF
    const fileName = `reporte_oficial_${ticketId.replace(/\//g, '_')}_${Date.now()}.pdf`;
    const filePath = path.join(process.cwd(), 'public', 'reports', fileName);
    
    // Asegurar que el directorio existe
    const reportsDir = path.dirname(filePath);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    // Escribir el PDF
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    doc.end();
    
    await new Promise<void>((resolve, reject) => {
      stream.on('finish', () => resolve());
      stream.on('error', reject);
    });

    return NextResponse.json({ 
      message: 'Reporte generado exitosamente',
      filePath: `/reports/${fileName}`,
      fileName 
    });

  } catch (error) {
    console.error('Error generando reporte:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}