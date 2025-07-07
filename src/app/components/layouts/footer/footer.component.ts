import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ReviewService } from '../../../services/review.service';

@Component({
  selector: 'app-footer',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent implements OnInit {
  showBackToTop = false;
  reviewForm: FormGroup;
  isSubmitting = false;
  
  // Propiedades para los modales
  showSuccessModal = false;
  showErrorModal = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private reviewService: ReviewService
  ) {
    this.reviewForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      comentario: ['', [Validators.required, Validators.minLength(1)]]
    });
  }

  ngOnInit(): void {
    this.checkScrollPosition();
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.checkScrollPosition();
  }

  private checkScrollPosition(): void {
    this.showBackToTop = window.pageYOffset > 300;
  }

  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  setRating(rating: number): void {
    this.reviewForm.patchValue({ rating });
  }

  submitReview(): void {
    if (this.reviewForm.valid) {
      this.isSubmitting = true;
      
      const reviewData = {
        nombre: this.reviewForm.value.nombre,
        email: this.reviewForm.value.email,
        rating: this.reviewForm.value.rating,
        comentario: this.reviewForm.value.comentario
      };

      try {
        this.reviewService.createReview(reviewData);
        
        // Resetear formulario
        this.reviewForm.reset();
        this.reviewForm.patchValue({ rating: 0 });
        
        // Mostrar modal de éxito
        this.showSuccessModal = true;
        
      } catch (error) {
        console.error('Error al enviar reseña:', error);
        this.errorMessage = 'Hubo un error al enviar tu reseña. Por favor, intenta nuevamente.';
        this.showErrorModal = true;
      } finally {
        this.isSubmitting = false;
      }
    }
  }

  // Métodos para cerrar modales
  closeSuccessModal(): void {
    this.showSuccessModal = false;
  }

  closeErrorModal(): void {
    this.showErrorModal = false;
    this.errorMessage = '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.reviewForm.get(fieldName);
    return !!(field && field.invalid && (field.touched || field.dirty));
  }

  getFieldError(fieldName: string): string {
    const field = this.reviewForm.get(fieldName);
    if (field && field.errors && (field.touched || field.dirty)) {
      if (field.errors['required']) return 'Este campo es obligatorio para poder enviar la reseña';
      if (field.errors['email']) return 'Ingresa un email válido';
      if (field.errors['minlength']) return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
      if (field.errors['min']) return 'Debes seleccionar una calificación';
    }
    return '';
  }
}
