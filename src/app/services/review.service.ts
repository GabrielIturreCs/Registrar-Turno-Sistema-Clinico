import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Review {
  id: string;
  nombre: string;
  email: string;
  rating: number;
  comentario: string;
  fecha: Date;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  respuesta?: string;
  fechaRespuesta?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private reviewsKey = 'dental_reviews';
  private reviewsSubject = new BehaviorSubject<Review[]>([]);
  public reviews$ = this.reviewsSubject.asObservable();

  constructor() {
    this.loadReviews();
  }

  private loadReviews(): void {
    const stored = localStorage.getItem(this.reviewsKey);
    if (stored) {
      const reviews = JSON.parse(stored).map((review: any) => ({
        ...review,
        fecha: new Date(review.fecha),
        fechaRespuesta: review.fechaRespuesta ? new Date(review.fechaRespuesta) : undefined
      }));
      this.reviewsSubject.next(reviews);
    }
  }

  private saveReviews(reviews: Review[]): void {
    localStorage.setItem(this.reviewsKey, JSON.stringify(reviews));
    this.reviewsSubject.next(reviews);
  }

  // Crear nueva reseña
  createReview(reviewData: Omit<Review, 'id' | 'fecha' | 'estado'>): Review {
    const newReview: Review = {
      ...reviewData,
      id: this.generateId(),
      fecha: new Date(),
      estado: 'pendiente'
    };

    const currentReviews = this.reviewsSubject.value;
    const updatedReviews = [...currentReviews, newReview];
    this.saveReviews(updatedReviews);

    return newReview;
  }

  // Obtener todas las reseñas (para administrador)
  getAllReviews(): Review[] {
    return this.reviewsSubject.value;
  }

  // Obtener reseñas por estado
  getReviewsByStatus(estado: Review['estado']): Review[] {
    return this.reviewsSubject.value.filter(review => review.estado === estado);
  }

  // Obtener reseñas aprobadas (para mostrar públicamente)
  getApprovedReviews(limit?: number): Review[] {
    const approved = this.reviewsSubject.value
      .filter(review => review.estado === 'aprobado')
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    
    return limit ? approved.slice(0, limit) : approved;
  }

  // Actualizar estado de una reseña
  updateReviewStatus(id: string, estado: Review['estado'], respuesta?: string): Review | null {
    const currentReviews = this.reviewsSubject.value;
    const reviewIndex = currentReviews.findIndex(review => review.id === id);
    
    if (reviewIndex === -1) return null;

    const updatedReview = {
      ...currentReviews[reviewIndex],
      estado,
      respuesta,
      fechaRespuesta: new Date()
    };

    currentReviews[reviewIndex] = updatedReview;
    this.saveReviews(currentReviews);

    return updatedReview;
  }

  // Eliminar reseña
  deleteReview(id: string): boolean {
    const currentReviews = this.reviewsSubject.value;
    const filteredReviews = currentReviews.filter(review => review.id !== id);
    
    if (filteredReviews.length === currentReviews.length) {
      return false; // No se encontró la reseña
    }

    this.saveReviews(filteredReviews);
    return true;
  }

  // Obtener estadísticas
  getReviewStats(): {
    total: number;
    promedio: number;
    pendientes: number;
    aprobadas: number;
    rechazadas: number;
    porRating: { [key: number]: number };
  } {
    const reviews = this.reviewsSubject.value;
    const total = reviews.length;
    
    if (total === 0) {
      return {
        total: 0,
        promedio: 0,
        pendientes: 0,
        aprobadas: 0,
        rechazadas: 0,
        porRating: {}
      };
    }

    const promedio = reviews.reduce((sum, review) => sum + review.rating, 0) / total;
    const pendientes = reviews.filter(r => r.estado === 'pendiente').length;
    const aprobadas = reviews.filter(r => r.estado === 'aprobado').length;
    const rechazadas = reviews.filter(r => r.estado === 'rechazado').length;

    const porRating: { [key: number]: number } = {};
    for (let i = 1; i <= 5; i++) {
      porRating[i] = reviews.filter(r => r.rating === i).length;
    }

    return {
      total,
      promedio: Math.round(promedio * 10) / 10,
      pendientes,
      aprobadas,
      rechazadas,
      porRating
    };
  }

  // Generar ID único
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Exportar reseñas (para backup)
  exportReviews(): string {
    return JSON.stringify(this.reviewsSubject.value, null, 2);
  }

  // Importar reseñas (para restore)
  importReviews(jsonData: string): boolean {
    try {
      const reviews = JSON.parse(jsonData);
      if (Array.isArray(reviews)) {
        this.saveReviews(reviews);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing reviews:', error);
      return false;
    }
  }
} 