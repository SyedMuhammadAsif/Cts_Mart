import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserAuth } from '../../services/user-auth';
import { NotificationService, Notification } from '../../services/notification.service';

@Component({
  selector: 'app-customer-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="notifications.length > 0" class="alert alert-info">
      <h6>📧 Notifications</h6>
      <div *ngFor="let notification of notifications" class="notification-item mb-2">
        <div class="d-flex justify-content-between align-items-start">
          <div class="flex-grow-1">
            <strong>{{ notification.title }}</strong>
            <p class="mb-1 small">{{ notification.message }}</p>
            <small class="text-muted">{{ formatDate(notification.createdAt) }}</small>
          </div>
          <button 
            *ngIf="!notification.read"
            class="btn btn-sm btn-outline-primary"
            (click)="markAsRead(notification.id)">
            Mark Read
          </button>
        </div>
        <hr *ngIf="notifications.indexOf(notification) < notifications.length - 1">
      </div>
    </div>
  `,
  styles: [`
    .notification-item {
      padding: 8px;
      border-radius: 4px;
      background-color: rgba(13, 110, 253, 0.1);
    }
  `]
})
export class CustomerNotificationsComponent implements OnInit {
  notifications: Notification[] = [];

  constructor(
    private userAuth: UserAuth,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    if (this.userAuth.isLoggedIn()) {
      const userEmail = this.userAuth.getCurrentUserEmail();
      if (userEmail) {
        this.loadNotifications(userEmail);
      }
    }
  }

  private loadNotifications(userEmail: string): void {
    this.notificationService.getNotifications(userEmail, false).subscribe({
      next: (notifications) => {
        // Show only unread notifications
        this.notifications = notifications
          .filter(n => !n.read)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },
      error: (error) => {
        console.error('Error loading customer notifications:', error);
      }
    });
  }

  markAsRead(notificationId: string): void {
    this.notificationService.markAsRead(notificationId).subscribe({
      next: () => {
        // Remove from local array
        this.notifications = this.notifications.filter(n => n.id !== notificationId);
      },
      error: (error) => {
        console.error('Error marking notification as read:', error);
      }
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
} 