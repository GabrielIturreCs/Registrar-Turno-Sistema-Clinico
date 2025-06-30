import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Turno, Estadisticas } from '../interfaces';

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

    this.crearTabla(pdf, tablaCompleta, margin, yPosition, pageWidth - 2 * margin);
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

    this.crearTabla(pdf, tablaCompleta, margin, yPosition, pageWidth - 2 * margin);
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
      pdf.text(texto, xPos, y + 5);
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
        pdf.text(texto, xPos, yPos + 5);
      });
    }
    pdf.setDrawColor(0, 191, 255);
    pdf.rect(x, y, ancho, datos.length * filaAltura, 'S');
  }
}
