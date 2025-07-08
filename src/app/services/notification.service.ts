import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor() { }

  // Mostrar mensaje de éxito
  showSuccess(message: string, duration: number = 3000): void {
    this.showNotification(message, 'success', duration);
  }

  // Mostrar mensaje de error
  showError(message: string, duration: number = 5000): void {
    this.showNotification(message, 'error', duration);
  }

  // Mostrar mensaje de advertencia
  showWarning(message: string, duration: number = 4000): void {
    this.showNotification(message, 'warning', duration);
  }

  // Mostrar mensaje de información
  showInfo(message: string, duration: number = 3000): void {
    this.showNotification(message, 'info', duration);
  }

  // Mostrar notificación personalizada
  private showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info', duration: number): void {
    // Crear el elemento de notificación
    const notification = document.createElement('div');
    notification.className = `custom-notification custom-notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">${this.getIcon(type)}</span>
        <span class="notification-message">${message}</span>
        <button class="notification-close">&times;</button>
      </div>
    `;

    // Agregar estilos dinámicamente si no existen
    this.addNotificationStyles();

    // Agregar al contenedor
    let container = document.querySelector('.notifications-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'notifications-container';
      document.body.appendChild(container);
    }

    container.appendChild(notification);

    // Animación de entrada
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    // Manejar el botón de cerrar
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn?.addEventListener('click', () => {
      this.removeNotification(notification);
    });

    // Auto-remove después del tiempo especificado
    setTimeout(() => {
      this.removeNotification(notification);
    }, duration);
  }

  private removeNotification(notification: Element): void {
    notification.classList.add('hide');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }

  private getIcon(type: string): string {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      case 'info': return 'ℹ';
      default: return 'ℹ';
    }
  }

  private addNotificationStyles(): void {
    if (document.querySelector('#notification-styles')) return;

    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
      .notifications-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        pointer-events: none;
      }

      .custom-notification {
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        margin-bottom: 10px;
        transform: translateX(100%);
        transition: all 0.3s ease;
        pointer-events: auto;
        min-width: 300px;
        max-width: 500px;
      }

      .custom-notification.show {
        transform: translateX(0);
      }

      .custom-notification.hide {
        transform: translateX(100%);
        opacity: 0;
      }

      .custom-notification-success {
        border-left: 4px solid #4caf50;
      }

      .custom-notification-error {
        border-left: 4px solid #f44336;
      }

      .custom-notification-warning {
        border-left: 4px solid #ff9800;
      }

      .custom-notification-info {
        border-left: 4px solid #2196f3;
      }

      .notification-content {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        font-family: 'Segoe UI', Arial, sans-serif;
      }

      .notification-icon {
        font-size: 18px;
        margin-right: 12px;
        font-weight: bold;
      }

      .custom-notification-success .notification-icon {
        color: #4caf50;
      }

      .custom-notification-error .notification-icon {
        color: #f44336;
      }

      .custom-notification-warning .notification-icon {
        color: #ff9800;
      }

      .custom-notification-info .notification-icon {
        color: #2196f3;
      }

      .notification-message {
        flex: 1;
        color: #333;
        font-size: 14px;
        line-height: 1.4;
      }

      .notification-close {
        background: none;
        border: none;
        font-size: 20px;
        color: #999;
        cursor: pointer;
        padding: 0;
        margin-left: 12px;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .notification-close:hover {
        color: #666;
      }

      @media (max-width: 480px) {
        .notifications-container {
          left: 10px;
          right: 10px;
          top: 10px;
        }

        .custom-notification {
          min-width: auto;
          transform: translateY(-100%);
        }

        .custom-notification.show {
          transform: translateY(0);
        }

        .custom-notification.hide {
          transform: translateY(-100%);
        }
      }
    `;

    document.head.appendChild(style);
  }
}
