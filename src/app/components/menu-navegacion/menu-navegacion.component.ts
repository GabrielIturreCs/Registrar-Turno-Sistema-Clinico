import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { User } from '../../interfaces';

@Component({
  selector: 'app-menu-navegacion',
  imports: [CommonModule],
  templateUrl: './menu-navegacion.component.html',
  styleUrl: './menu-navegacion.component.css'
})
export class MenuNavegacionComponent {
  @Input() user: User | null = null;
  @Input() currentView: string = 'dashboard';

  constructor(private router: Router) {}

  navigateTo(view: string): void {
    
    switch (view) {
      case 'dashboard':
        this.router.navigate(['/dashboard']);
        break;
      case 'registrar-turno':
        this.router.navigate(['/reservarTurno']);
        break;
      case 'mis-turnos':
        this.router.navigate(['/misTurnos']);
        break;
      case 'admin':
        this.router.navigate(['/admin']);
        break;
      default:
        this.router.navigate([`/${view}`]);
    }
  }
}
