import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { EnvVariables } from '../env/env-variables';
import { map } from 'rxjs/operators';

export interface Notification {
  id: string;
  orderNumber?: string;
  customerEmail?: string;
  customerName?: string;
  type: 'order_removed' | 'order_deleted_by_customer' | 'order_cancelled_by_customer' | 'order_refund_notification' | 'order_cancellation_no_refund';
  title: string;
  message: string;
  reason?: string;
  amount?: number;
  createdAt: string;
  read: boolean;
  adminNotification?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get notifications for a specific user (admin or customer)
   */
  getNotifications(userEmail: string, isAdmin: boolean = false): Observable<Notification[]> {
    // Fetch all relevant notifications and filter client-side to be robust to case differences
    const url = `${EnvVariables.apiBaseUrl}/notifications`;
    
    return this.http.get<Notification[]>(url).pipe(
      map((notifications) => {
        if (isAdmin) {
          return notifications.filter(n => n.adminNotification === true);
        }
        const emailLower = (userEmail || '').toLowerCase();
        return notifications.filter(n => (n.customerEmail || '').toLowerCase() === emailLower);
      })
    );
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): Observable<any> {
    return this.http.patch(`${EnvVariables.apiBaseUrl}/notifications/${notificationId}`, { read: true });
  }

  /**
   * Get unread notification count
   */
  getUnreadCount(userEmail: string, isAdmin: boolean = false): Observable<number> {
    const url = isAdmin 
      ? `${EnvVariables.apiBaseUrl}/notifications?adminNotification=true&read=false`
      : `${EnvVariables.apiBaseUrl}/notifications?customerEmail=${userEmail}&read=false`;
    
    return this.http.get<Notification[]>(url).pipe(
      map(notifications => notifications.length)
    );
  }

  /**
   * Refresh notifications
   */
  refreshNotifications(userEmail: string, isAdmin: boolean = false): void {
    this.getNotifications(userEmail, isAdmin).subscribe({
      next: (notifications) => {
        this.notificationsSubject.next(notifications);
      },
      error: (error) => {
        console.error('Error refreshing notifications:', error);
      }
    });
  }
} 