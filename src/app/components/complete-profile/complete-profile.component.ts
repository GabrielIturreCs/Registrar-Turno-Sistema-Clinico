import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-complete-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './complete-profile.component.html',
  styleUrls: ['./complete-profile.component.css']
})
export class CompleteProfileComponent implements OnInit {
  profileForm: FormGroup;
  currentUser: any;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.profileForm = this.fb.group({
      telefono: ['', [Validators.required, Validators.pattern(/^\d{8,15}$/)]],
      dni: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
      direccion: ['', [Validators.required, Validators.minLength(5)]],
      obraSocial: ['', [Validators.required, Validators.minLength(2)]]
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    // Si el usuario ya tiene perfil completo, redirigir
    if (this.currentUser.hasCompleteProfile) {
      this.authService.redirectByUserType();
      return;
    }

    // Pre-llenar el formulario con datos disponibles
    if (this.currentUser.telefono) {
      this.profileForm.patchValue({ telefono: this.currentUser.telefono });
    }
    if (this.currentUser.dni) {
      this.profileForm.patchValue({ dni: this.currentUser.dni });
    }
    if (this.currentUser.direccion) {
      this.profileForm.patchValue({ direccion: this.currentUser.direccion });
    }
    if (this.currentUser.obraSocial) {
      this.profileForm.patchValue({ obraSocial: this.currentUser.obraSocial });
    }
  }

  async onSubmit(): Promise<void> {
    if (this.profileForm.valid) {
      this.loading = true;
      
      try {
        // Crear el perfil de paciente
        const patientData = {
          nombre: this.currentUser.nombre,
          apellido: this.currentUser.apellido,
          email: this.currentUser.email,
          telefono: this.profileForm.value.telefono,
          dni: this.profileForm.value.dni,
          direccion: this.profileForm.value.direccion,
          obraSocial: this.profileForm.value.obraSocial,
          userId: this.currentUser.id
        };

        this.authService.createPatientProfile(patientData).subscribe(
          (response: any) => {
            if (response.success || response._id) {
              // Actualizar el usuario actual
              this.currentUser.hasCompleteProfile = true;
              this.currentUser.needsProfileCompletion = false;
              this.currentUser.patientId = response._id || response.patient._id;
              this.currentUser.telefono = patientData.telefono;
              this.currentUser.dni = patientData.dni;
              this.currentUser.direccion = patientData.direccion;
              this.currentUser.obraSocial = patientData.obraSocial;

              // Actualizar en el servicio y localStorage
              this.authService.setCurrentUser(this.currentUser);
              
              this.notificationService.showSuccess('¡Perfil completado exitosamente!');
              this.authService.redirectByUserType();
            } else {
              this.notificationService.showError('Error al completar el perfil. Intenta nuevamente.');
            }
          },
          (error) => {
            console.error('Error creando perfil de paciente:', error);
            this.notificationService.showError('Error al completar el perfil. Intenta nuevamente.');
          }
        );
      } catch (error) {
        console.error('Error en completar perfil:', error);
        this.notificationService.showError('Error al completar el perfil. Intenta nuevamente.');
      } finally {
        this.loading = false;
      }
    } else {
      this.notificationService.showError('Por favor, completa todos los campos requeridos.');
    }
  }

  // Getters para validaciones
  get telefono() { return this.profileForm.get('telefono'); }
  get dni() { return this.profileForm.get('dni'); }
  get direccion() { return this.profileForm.get('direccion'); }
  get obraSocial() { return this.profileForm.get('obraSocial'); }
}
