import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { ReservarComponent } from './components/reservar/reservar.component';
import { TurnosComponent } from './components/turnos/turnos.component';
import { RegistroComponent } from './components/registro/registro.component';
import { HomeComponent } from './components/layouts/home/home.component';
import { AgendaComponent } from './components/agenda/agenda.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { EstadisticaComponent } from './components/estadistica/estadistica.component';
import { AdministradorComponent } from './components/administrador/administrador.component';

import { ReprogramarComponent } from './components/reprogramar/reprogramar.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard()] },
  { path: 'misTurnos', component: TurnosComponent, canActivate: [authGuard('paciente')] },
  { path: 'reservarTurno', component: ReservarComponent, canActivate: [authGuard()] },
  { path: 'agenda', component: AgendaComponent, canActivate: [authGuard('dentista')] },
  { path: 'reprogramar', component: ReprogramarComponent, canActivate: [authGuard('dentista')] },
  { path: 'estadisticas', component: EstadisticaComponent, canActivate: [authGuard()] },
  { path: 'admin', component: AdministradorComponent, canActivate: [authGuard('administrador')] },
];
