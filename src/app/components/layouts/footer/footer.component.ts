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

  constructor(
    private fb: FormBuilder,
    private reviewService: ReviewService
  ) {
    this.reviewForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      comentario: ['', [Validators.required, Validators.minLength(10)]]
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
        
        // Mostrar mensaje de éxito
        alert('¡Gracias por tu reseña! Será revisada por nuestro equipo.');
        
      } catch (error) {
        console.error('Error al enviar reseña:', error);
        alert('Hubo un error al enviar tu reseña. Por favor, intenta nuevamente.');
      } finally {
        this.isSubmitting = false;
      }
    }
  }
}
