import { Component, type OnInit, type OnDestroy } from "@angular/core"
import { Input } from '@angular/core';
import { Subject } from "rxjs"
import { takeUntil } from "rxjs/operators"
import { OdontogramaService, PiezaDental, OdontogramaData } from "../../services/odontograma.service"
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PiezaDentalComponent } from './pieza-dental.component';

@Component({
  selector: "app-odontograma",
  standalone: true,
  imports: [CommonModule, FormsModule, PiezaDentalComponent],
  templateUrl: "./odontograma.component.html",
  styleUrls: ["./odontograma.component.css"],
})
export class OdontogramaComponent implements OnInit, OnDestroy {
  @Input() odontograma: any;
  @Input() paciente: any;
  private destroy$ = new Subject<void>()

  odontogramaData!: OdontogramaData
  herramientaActual = "pintar"
  estadoActual = "a_realizar"

  herramientas: any[] = [];
  coloresEstado: any = {};

  // Organización de dientes por cuadrantes
  cuadrantes = {
    1: [18, 17, 16, 15, 14, 13, 12, 11], // Superior Derecho
    2: [21, 22, 23, 24, 25, 26, 27, 28], // Superior Izquierdo
    3: [38, 37, 36, 35, 34, 33, 32, 31], // Inferior Izquierdo
    4: [41, 42, 43, 44, 45, 46, 47, 48], // Inferior Derecho
    5: [55, 54, 53, 52, 51], // Temporal Superior Derecho
    6: [61, 62, 63, 64, 65], // Temporal Superior Izquierdo
    7: [75, 74, 73, 72, 71], // Temporal Inferior Izquierdo
    8: [81, 82, 83, 84, 85], // Temporal Inferior Derecho
  }

  odontologos = ["Dr. Juan Pérez", "Dra. María González", "Dr. Carlos Rodríguez", "Dra. Ana Martínez"]

  mostrarTemporales = false
  guardando = false

  constructor(private odontogramaService: OdontogramaService) {
    this.herramientas = this.odontogramaService.getHerramientas();
    this.coloresEstado = this.odontogramaService.getColoresEstado();
  }

  ngOnInit(): void {
    this.odontogramaService.odontograma$.pipe(takeUntil(this.destroy$)).subscribe((data: OdontogramaData) => {
      this.odontogramaData = data
    })

    this.odontogramaService.herramientaActual$.pipe(takeUntil(this.destroy$)).subscribe((herramienta: string) => {
      this.herramientaActual = herramienta
    })

    this.odontogramaService.estadoActual$.pipe(takeUntil(this.destroy$)).subscribe((estado: string) => {
      this.estadoActual = estado
    })
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  seleccionarHerramienta(herramienta: string): void {
    this.odontogramaService.setHerramientaActual(herramienta)
  }

  seleccionarEstado(estado: string): void {
    this.odontogramaService.setEstadoActual(estado)
  }

  onZonaClic(event: { numeroPieza: number; zona: "superior" | "inferior" | "izquierda" | "derecha" | "centro" }): void {
    this.odontogramaService.aplicarHerramienta(event.numeroPieza, event.zona)
  }

  onNotasChange(event: any): void {
    this.odontogramaService.actualizarNotas(event.target.value)
  }

  onOdontologoChange(event: any): void {
    this.odontogramaService.actualizarOdontologo(event.target.value)
  }

  toggleTemporales(): void {
    this.mostrarTemporales = !this.mostrarTemporales
  }

  getPiezasPorCuadrante(cuadrante: number): PiezaDental[] {
    return this.cuadrantes[cuadrante as keyof typeof this.cuadrantes]
      .map((numero) => this.odontogramaData.piezas[numero])
      .filter((pieza) => pieza)
  }

  guardarOdontograma(): void {
    this.guardando = true
    this.odontogramaService
      .guardarOdontograma()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          console.log("Guardado exitoso:", response)
          this.guardando = false
          // Aquí podrías mostrar un toast de éxito
        },
        error: (error: any) => {
          console.error("Error al guardar:", error)
          this.guardando = false
          // Aquí podrías mostrar un toast de error
        },
      })
  }

  imprimirGrafico(): void {
    window.print()
  }

  imprimirDatos(): void {
    const datos = this.odontogramaService.exportarDatos()
    const ventana = window.open("", "_blank")
    if (ventana) {
      ventana.document.write(`
        <html>
          <head><title>Datos del Odontograma</title></head>
          <body>
            <h2>Odontograma - ${datos.odontologo}</h2>
            <p><strong>Fecha:</strong> ${datos.fecha.toLocaleDateString()}</p>
            <p><strong>Notas:</strong> ${datos.notas}</p>
            <h3>Tratamientos por pieza:</h3>
            <ul>
              ${Object.values(datos.piezas)
                .map((pieza: any) => {
                  const tratamientos = Object.entries(pieza.zonas)
                    .filter(([_, zona]) => zona !== null)
                    .map(([nombreZona, zona]: [string, any]) => `${nombreZona}: ${zona?.herramienta}`)
                    .join(", ")
                  return tratamientos ? `<li>Pieza ${pieza.numero}: ${tratamientos}</li>` : ""
                })
                .join("")}
            </ul>
          </body>
        </html>
      `)
      ventana.print()
    }
  }

  limpiarOdontograma(): void {
    if (confirm("¿Está seguro de que desea limpiar todo el odontograma?")) {
      this.odontogramaService.limpiarOdontograma()
    }
  }

  exportarImagen(): void {
    // Implementación para exportar como imagen usando html2canvas
    console.log("Exportar imagen - implementar con html2canvas")
  }

  keyToString(key: unknown): string {
    return String(key);
  }
}
