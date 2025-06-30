import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { ReservarComponent } from './components/reservar/reservar.component';
import { TurnosComponent } from './components/turnos/turnos.component';
import { RegistroComponent } from './components/registro/registro.component';
import { HomeComponent } from './components/layouts/home/home.component';
import { AgendaComponent } from './components/agenda/agenda.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { EstadisticaComponent } from './components/estadistica/estadistica.component';
import { AdminComponent } from './components/administrador/administrador.component';
import { PacientesComponent } from './components/pacientes/pacientes.component';
import { DentistaComponent } from './components/dentista/dentista.component';

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
  { path: 'estadistica', component: EstadisticaComponent, canActivate: [authGuard('administrador')] },
  { path: 'admin', component: AdminComponent, canActivate: [authGuard('administrador')] },
  { path: 'pacientes', component: PacientesComponent, canActivate: [authGuard('dentista')] },
  { path: 'dentista', component: DentistaComponent, canActivate: [authGuard('administrador')] },
];
