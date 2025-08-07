import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toasts = new BehaviorSubject<Toast[]>([]);
  public toasts$ = this.toasts.asObservable();
  private nextId = 1;

  // Show success toast
  showSuccess(message: string, duration: number = 4000): void {
    this.showToast(message, 'success', duration);
  }

  // Show error toast
  showError(message: string, duration: number = 4000): void {
    this.showToast(message, 'error', duration);
  }

  // Show info toast
  showInfo(message: string, duration: number = 4000): void {
    this.showToast(message, 'info', duration);
  }

  // Show warning toast
  showWarning(message: string, duration: number = 4000): void {
    this.showToast(message, 'warning', duration);
  }

  // Remove specific toast
  removeToast(id: number): void {
    const currentToasts = this.toasts.value;
    const updatedToasts = currentToasts.filter(toast => toast.id !== id);
    this.toasts.next(updatedToasts);
  }

  // Clear all toasts
  clearAll(): void {
    this.toasts.next([]);
  }

  private showToast(message: string, type: Toast['type'], duration: number): void {
    const toast: Toast = {
      id: this.nextId++,
      message,
      type,
      duration
    };

    const currentToasts = this.toasts.value;
    this.toasts.next([...currentToasts, toast]);

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.removeToast(toast.id);
      }, duration);
    }
  }
} 