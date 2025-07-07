import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Turno, Estadisticas } from '../interfaces';
import { Review } from './review.service';

interface EstadisticaTratamiento {
  tratamiento: string;
  cantidad: number;
  ingresos: number;
}

@Injectable({
  providedIn: 'root'
})
export class PdfExportService {

  constructor() { }

  async exportarEstadisticasPDF(
    estadisticas: Estadisticas,
    estadisticasPorTratamiento: EstadisticaTratamiento[],
    turnosRecientes: Turno[],
    fechaDesde: string,
    fechaHasta: string
  ): Promise<void> {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Título
    pdf.setFontSize(24);
    pdf.setTextColor(0, 191, 255);
    pdf.text('Reporte de Estadísticas', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Fecha del reporte
    pdf.setFontSize(12);
    pdf.setTextColor(100, 100, 100);
    const fechaReporte = new Date().toLocaleDateString('es-ES');
    pdf.text(`Generado el: ${fechaReporte}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // Período
    if (fechaDesde && fechaHasta) {
      pdf.text(`Período: ${fechaDesde} al ${fechaHasta}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;
    }

    // Resumen
    yPosition = this.saltoSiNecesario(pdf, yPosition, 50, pageHeight, margin);
    yPosition = this.agregarResumenEstadisticas(pdf, estadisticas, yPosition, pageWidth, margin);

    // Tratamientos
    yPosition = this.saltoSiNecesario(pdf, yPosition, (estadisticasPorTratamiento.length + 2) * 8 + 20, pageHeight, margin);
    yPosition = this.agregarEstadisticasPorTratamiento(pdf, estadisticasPorTratamiento, yPosition, pageWidth, margin);

    // Turnos recientes
    yPosition = this.saltoSiNecesario(pdf, yPosition, (Math.min(turnosRecientes.length, 10) + 2) * 8 + 20, pageHeight, margin);
    this.agregarTurnosRecientes(pdf, turnosRecientes, yPosition, pageWidth, margin);

    // Guardar
    const nombreArchivo = `estadisticas_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(nombreArchivo);
  }

  async exportarAgendaPDF(
    turnos: Turno[],
    fecha: string,
    estadisticas: {
      total: number;
      completados: number;
      pendientes: number;
      cancelados: number;
      ingresos: number;
    },
    filtroEstado?: string
  ): Promise<void> {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Título
    pdf.setFontSize(24);
    pdf.setTextColor(0, 191, 255);
    pdf.text('Agenda del Dentista', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Fecha del reporte
    pdf.setFontSize(12);
    pdf.setTextColor(100, 100, 100);
    const fechaReporte = new Date().toLocaleDateString('es-ES');
    pdf.text(`Generado el: ${fechaReporte}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // Fecha de la agenda
    pdf.text(`Agenda del: ${new Date(fecha).toLocaleDateString('es-ES')}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // Información del filtro si aplica
    if (filtroEstado && filtroEstado !== 'todos') {
      pdf.text(`Filtro: Turnos ${filtroEstado}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;
    }

    yPosition += 5;

    // Resumen del día
    yPosition = this.saltoSiNecesario(pdf, yPosition, 50, pageHeight, margin);
    yPosition = this.agregarResumenAgenda(pdf, estadisticas, yPosition, pageWidth, margin);

    // Lista de turnos
    yPosition = this.saltoSiNecesario(pdf, yPosition, (turnos.length + 2) * 8 + 20, pageHeight, margin);
    this.agregarTurnosAgenda(pdf, turnos, yPosition, pageWidth, margin);

    // Guardar
    const nombreArchivo = filtroEstado && filtroEstado !== 'todos' 
      ? `agenda_${fecha.replace(/-/g, '')}_${filtroEstado}.pdf`
      : `agenda_${fecha.replace(/-/g, '')}.pdf`;
    pdf.save(nombreArchivo);
  }

  async exportarResenasPDF(
    reviews: Review[],
    estadisticas: {
      total: number;
      promedio: number;
      pendientes: number;
      aprobadas: number;
      rechazadas: number;
    },
    filtroEstado?: string
  ): Promise<void> {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Título
    pdf.setFontSize(24);
    pdf.setTextColor(0, 191, 255);
    pdf.text('Reporte de Reseñas', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Fecha del reporte
    pdf.setFontSize(12);
    pdf.setTextColor(100, 100, 100);
    const fechaReporte = new Date().toLocaleDateString('es-ES');
    pdf.text(`Generado el: ${fechaReporte}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // Información del filtro si aplica
    if (filtroEstado && filtroEstado !== '') {
      pdf.text(`Filtro: Reseñas ${filtroEstado}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;
    }

    yPosition += 5;

    // Resumen de reseñas
    yPosition = this.saltoSiNecesario(pdf, yPosition, 50, pageHeight, margin);
    yPosition = this.agregarResumenResenas(pdf, estadisticas, yPosition, pageWidth, margin);

    // Lista de reseñas
    yPosition = this.saltoSiNecesario(pdf, yPosition, (reviews.length + 2) * 8 + 20, pageHeight, margin);
    this.agregarResenas(pdf, reviews, yPosition, pageWidth, margin);

    // Guardar
    const nombreArchivo = filtroEstado && filtroEstado !== '' 
      ? `resenas_${new Date().toISOString().split('T')[0]}_${filtroEstado}.pdf`
      : `resenas_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(nombreArchivo);
  }

  private saltoSiNecesario(pdf: jsPDF, y: number, espacioNecesario: number, pageHeight: number, margin: number): number {
    if (y + espacioNecesario > pageHeight - margin) {
      pdf.addPage();
      return margin;
    }
    return y;
  }

  private agregarResumenEstadisticas(
    pdf: jsPDF, 
    estadisticas: Estadisticas, 
    yPosition: number, 
    pageWidth: number, 
    margin: number
  ): number {
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Resumen General', margin, yPosition);
    yPosition += 10;

    const datosResumen = [
      ['Total Turnos', estadisticas.total.toString()],
      ['Completados', estadisticas.completados.toString()],
      ['Pendientes', estadisticas.reservados.toString()],
      ['Cancelados', estadisticas.cancelados.toString()],
      ['Ingresos Totales', `$${estadisticas.ingresos.toLocaleString()}`]
    ];

    this.crearTabla(pdf, datosResumen, margin, yPosition, pageWidth - 2 * margin);
    yPosition += datosResumen.length * 8 + 10;

    return yPosition;
  }

  private agregarEstadisticasPorTratamiento(
    pdf: jsPDF, 
    estadisticasPorTratamiento: EstadisticaTratamiento[], 
    yPosition: number, 
    pageWidth: number, 
    margin: number
  ): number {
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Estadísticas por Tratamiento', margin, yPosition);
    yPosition += 10;

    const datosTratamientos = estadisticasPorTratamiento.map(item => [
      item.tratamiento,
      item.cantidad.toString(),
      `$${item.ingresos.toLocaleString()}`
    ]);

    const tablaCompleta = [
      ['Tratamiento', 'Cantidad', 'Ingresos'],
      ...datosTratamientos
    ];

    // Definir anchos de columna proporcionales para tratamientos
    const columnWidths = [0.50, 0.25, 0.25]; // Tratamiento, Cantidad, Ingresos
    this.crearTablaFlexible(pdf, tablaCompleta, margin, yPosition, pageWidth - 2 * margin, columnWidths, margin);
    yPosition += tablaCompleta.length * 8 + 10;

    return yPosition;
  }

  private agregarTurnosRecientes(
    pdf: jsPDF, 
    turnosRecientes: Turno[], 
    yPosition: number, 
    pageWidth: number, 
    margin: number
  ): void {
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Turnos Recientes', margin, yPosition);
    yPosition += 10;

    const datosTurnos = turnosRecientes.slice(0, 10).map(turno => [
      new Date(turno.fecha).toLocaleDateString('es-ES'),
      `${turno.nombre} ${turno.apellido}`,
      turno.tratamiento,
      turno.estado,
      `$${turno.precioFinal.toLocaleString()}`
    ]);

    const tablaCompleta = [
      ['Fecha', 'Paciente', 'Tratamiento', 'Estado', 'Precio'],
      ...datosTurnos
    ];

    // Definir anchos de columna proporcionales para turnos
    const columnWidths = [0.15, 0.25, 0.25, 0.15, 0.20]; // Fecha, Paciente, Tratamiento, Estado, Precio
    this.crearTablaFlexible(pdf, tablaCompleta, margin, yPosition, pageWidth - 2 * margin, columnWidths, margin);
  }

  private agregarResumenAgenda(
    pdf: jsPDF, 
    estadisticas: {
      total: number;
      completados: number;
      pendientes: number;
      cancelados: number;
      ingresos: number;
    }, 
    yPosition: number, 
    pageWidth: number, 
    margin: number
  ): number {
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Resumen del Día', margin, yPosition);
    yPosition += 10;

    const datosResumen = [
      ['Total Turnos', estadisticas.total.toString()],
      ['Completados', estadisticas.completados.toString()],
      ['Pendientes', estadisticas.pendientes.toString()],
      ['Cancelados', estadisticas.cancelados.toString()],
      ['Ingresos del Día', `$${estadisticas.ingresos.toLocaleString()}`]
    ];

    this.crearTabla(pdf, datosResumen, margin, yPosition, pageWidth - 2 * margin);
    yPosition += datosResumen.length * 8 + 10;

    return yPosition;
  }

  private agregarTurnosAgenda(
    pdf: jsPDF, 
    turnos: Turno[], 
    yPosition: number, 
    pageWidth: number, 
    margin: number
  ): void {
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Lista de Turnos', margin, yPosition);
    yPosition += 10;

    if (turnos.length === 0) {
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text('No hay turnos programados para esta fecha', margin, yPosition);
      return;
    }

    const datosTurnos = turnos.map(turno => [
      turno.hora,
      `${turno.nombre} ${turno.apellido}`,
      turno.tratamiento,
      turno.estado,
      `$${turno.precioFinal.toLocaleString()}`
    ]);

    const tablaCompleta = [
      ['Hora', 'Paciente', 'Tratamiento', 'Estado', 'Precio'],
      ...datosTurnos
    ];

    // Definir anchos de columna proporcionales para agenda
    const columnWidths = [0.10, 0.25, 0.25, 0.15, 0.25]; // Hora, Paciente, Tratamiento, Estado, Precio
    this.crearTablaFlexible(pdf, tablaCompleta, margin, yPosition, pageWidth - 2 * margin, columnWidths, margin);
  }

  private agregarResumenResenas(
    pdf: jsPDF, 
    estadisticas: {
      total: number;
      promedio: number;
      pendientes: number;
      aprobadas: number;
      rechazadas: number;
    }, 
    yPosition: number, 
    pageWidth: number, 
    margin: number
  ): number {
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Resumen de Reseñas', margin, yPosition);
    yPosition += 10;

    const datosResumen = [
      ['Total Reseñas', estadisticas.total.toString()],
      ['Calificación Promedio', `${estadisticas.promedio}/5`],
      ['Pendientes', estadisticas.pendientes.toString()],
      ['Aprobadas', estadisticas.aprobadas.toString()],
      ['Rechazadas', estadisticas.rechazadas.toString()]
    ];

    this.crearTabla(pdf, datosResumen, margin, yPosition, pageWidth - 2 * margin);
    yPosition += datosResumen.length * 8 + 10;

    return yPosition;
  }

  private agregarResenas(
    pdf: jsPDF, 
    reviews: Review[], 
    yPosition: number, 
    pageWidth: number, 
    margin: number
  ): void {
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Lista de Reseñas', margin, yPosition);
    yPosition += 10;

    if (reviews.length === 0) {
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text('No hay reseñas para mostrar', margin, yPosition);
      return;
    }

    // Definir anchos de columna proporcionales para reseñas
    const columnWidths = [0.15, 0.20, 0.10, 0.10, 0.45]; // Fecha, Cliente, Calificación, Estado, Comentario
    const tableWidth = pageWidth - 2 * margin;
    
    const datosResenas = reviews.map(review => [
      new Date(review.fecha).toLocaleDateString('es-ES'),
      review.nombre,
      `${review.rating}/5`,
      review.estado,
      review.comentario
    ]);

    const tablaCompleta = [
      ['Fecha', 'Cliente', 'Calificación', 'Estado', 'Comentario'],
      ...datosResenas
    ];

    this.crearTablaFlexible(pdf, tablaCompleta, margin, yPosition, tableWidth, columnWidths, margin);
  }

  private crearTablaFlexible(
    pdf: jsPDF, 
    datos: string[][], 
    x: number, 
    y: number, 
    ancho: number,
    columnWidths: number[],
    margin: number
  ): void {
    const filaAltura = 8;
    const maxFilaAltura = 20; // Altura máxima para filas con texto largo
    const columnAnchos = columnWidths.map(width => width * ancho);

    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);

    // Encabezados
    pdf.setFillColor(0, 191, 255);
    pdf.rect(x, y, ancho, filaAltura, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    
    let currentX = x;
    datos[0].forEach((texto, index) => {
      const colWidth = columnAnchos[index];
      // Truncar texto si es muy largo para encabezados
      const textoMostrar = texto.length > 15 ? texto.substring(0, 12) + '...' : texto;
      pdf.text(textoMostrar, currentX + 2, y + 5);
      currentX += colWidth;
    });

    // Datos
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');
    
    let currentY = y + filaAltura;
    
    for (let i = 1; i < datos.length; i++) {
      const fila = datos[i];
      let maxAlturaFila = filaAltura;
      
      // Calcular altura necesaria para esta fila
      currentX = x;
      for (let j = 0; j < fila.length; j++) {
        const texto = fila[j];
        const colWidth = columnAnchos[j];
        const alturaTexto = this.calcularAlturaTexto(pdf, texto, colWidth - 4, filaAltura);
        maxAlturaFila = Math.max(maxAlturaFila, alturaTexto);
      }
      
      // Limitar altura máxima
      maxAlturaFila = Math.min(maxAlturaFila, maxFilaAltura);
      
      // Fondo alternado
      if (i % 2 === 0) {
        pdf.setFillColor(240, 248, 255);
        pdf.rect(x, currentY, ancho, maxAlturaFila, 'F');
      }
      
      // Dibujar contenido de la fila
      currentX = x;
      for (let j = 0; j < fila.length; j++) {
        const texto = fila[j];
        const colWidth = columnAnchos[j];
        
        // Truncar texto si es muy largo
        let textoMostrar = texto;
        if (j === 4 && texto.length > 100) { // Columna de comentario
          textoMostrar = texto.substring(0, 100) + '...';
        }
        
        // Envolver texto si es necesario
        const lineas = this.envolverTexto(pdf, textoMostrar, colWidth - 4);
        const alturaLinea = 4;
        const alturaContenido = lineas.length * alturaLinea;
        
        // Centrar verticalmente si hay espacio extra
        const yOffset = (maxAlturaFila - alturaContenido) / 2;
        
        lineas.forEach((linea, lineaIndex) => {
          pdf.text(linea, currentX + 2, currentY + yOffset + (lineaIndex * alturaLinea) + 3);
        });
        
        currentX += colWidth;
      }
      
      currentY += maxAlturaFila;
      
      // Verificar si necesitamos nueva página
      if (currentY + maxFilaAltura > pdf.internal.pageSize.getHeight() - margin) {
        pdf.addPage();
        currentY = margin;
      }
    }
    
    // Borde de la tabla
    pdf.setDrawColor(0, 191, 255);
    pdf.rect(x, y, ancho, currentY - y, 'S');
  }

  private calcularAlturaTexto(pdf: jsPDF, texto: string, ancho: number, alturaBase: number): number {
    const lineas = this.envolverTexto(pdf, texto, ancho);
    return Math.max(alturaBase, lineas.length * 4);
  }

  private envolverTexto(pdf: jsPDF, texto: string, ancho: number): string[] {
    const palabras = texto.split(' ');
    const lineas: string[] = [];
    let lineaActual = '';
    
    for (const palabra of palabras) {
      const lineaPrueba = lineaActual + (lineaActual ? ' ' : '') + palabra;
      const anchoLinea = pdf.getTextWidth(lineaPrueba);
      
      if (anchoLinea <= ancho) {
        lineaActual = lineaPrueba;
      } else {
        if (lineaActual) {
          lineas.push(lineaActual);
          lineaActual = palabra;
        } else {
          // Palabra muy larga, cortarla
          let palabraCortada = palabra;
          while (pdf.getTextWidth(palabraCortada) > ancho && palabraCortada.length > 1) {
            palabraCortada = palabraCortada.slice(0, -1);
          }
          lineas.push(palabraCortada);
          lineaActual = '';
        }
      }
    }
    
    if (lineaActual) {
      lineas.push(lineaActual);
    }
    
    return lineas.length > 0 ? lineas : [texto];
  }

  private crearTabla(
    pdf: jsPDF, 
    datos: string[][], 
    x: number, 
    y: number, 
    ancho: number
  ): void {
    const filaAltura = 8;
    const columnaAncho = ancho / datos[0].length;

    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);

    // Encabezados
    pdf.setFillColor(0, 191, 255);
    pdf.rect(x, y, ancho, filaAltura, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    datos[0].forEach((texto, index) => {
      const xPos = x + (index * columnaAncho) + 2;
      // Truncar texto si es muy largo para encabezados
      const textoMostrar = texto.length > 15 ? texto.substring(0, 12) + '...' : texto;
      pdf.text(textoMostrar, xPos, y + 5);
    });

    // Datos
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');
    for (let i = 1; i < datos.length; i++) {
      const yPos = y + (i * filaAltura);
      if (i % 2 === 0) {
        pdf.setFillColor(240, 248, 255);
        pdf.rect(x, yPos, ancho, filaAltura, 'F');
      }
      datos[i].forEach((texto, index) => {
        const xPos = x + (index * columnaAncho) + 2;
        // Truncar texto si es muy largo
        const textoMostrar = texto.length > 20 ? texto.substring(0, 17) + '...' : texto;
        pdf.text(textoMostrar, xPos, yPos + 5);
      });
    }
    pdf.setDrawColor(0, 191, 255);
    pdf.rect(x, y, ancho, datos.length * filaAltura, 'S');
  }
}
