import { Component, Input, Output, EventEmitter } from "@angular/core"
import type { PiezaDental } from '../../services/odontograma.service';
import { CommonModule } from "@angular/common"

@Component({
  selector: "app-pieza-dental",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pieza-dental" [class.temporal]="pieza.tipo === 'temporal'">
      <div class="numero-pieza">{{ pieza.numero }}</div>
      <div class="diente-container">
        <div class="zona zona-superior" 
             [style.background-color]="pieza.zonas.superior?.color || 'transparent'"
             (click)="onZonaClick('superior')"
             [title]="getTooltip('superior')">
        </div>
        <div class="zona-media">
          <div class="zona zona-izquierda" 
               [style.background-color]="pieza.zonas.izquierda?.color || 'transparent'"
               (click)="onZonaClick('izquierda')"
               [title]="getTooltip('izquierda')">
          </div>
          <div class="zona zona-centro" 
               [style.background-color]="pieza.zonas.centro?.color || 'transparent'"
               (click)="onZonaClick('centro')"
               [title]="getTooltip('centro')">
          </div>
          <div class="zona zona-derecha" 
               [style.background-color]="pieza.zonas.derecha?.color || 'transparent'"
               (click)="onZonaClick('derecha')"
               [title]="getTooltip('derecha')">
          </div>
        </div>
        <div class="zona zona-inferior" 
             [style.background-color]="pieza.zonas.inferior?.color || 'transparent'"
             (click)="onZonaClick('inferior')"
             [title]="getTooltip('inferior')">
        </div>
      </div>
    </div>
  `,
  styleUrls: ["./pieza-dental.component.css"],
})
export class PiezaDentalComponent {
  @Input() pieza!: PiezaDental
  @Output() zonaClic = new EventEmitter<{ numeroPieza: number; zona: "superior" | "inferior" | "izquierda" | "derecha" | "centro" }>()

  onZonaClick(zona: "superior" | "inferior" | "izquierda" | "derecha" | "centro"): void {
    this.zonaClic.emit({
      numeroPieza: this.pieza.numero,
      zona: zona,
    })
  }

  getTooltip(zona: string): string {
    const zonaEstado = this.pieza.zonas[zona as keyof typeof this.pieza.zonas]
    if (zonaEstado) {
      return `${zonaEstado.herramienta} - ${zonaEstado.estado}`
    }
    return `Pieza ${this.pieza.numero} - ${zona}`
  }
} 