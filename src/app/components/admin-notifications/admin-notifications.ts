import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../services/notification.service';

@Component({
  selector: 'app-admin-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Notifications</h5>
        <span class="badge bg-primary">{{ notifications.length }}</span>
      </div>
      <div class="card-body">
        <div *ngIf="notifications.length === 0" class="text-center text-muted">
          <p>No notifications</p>
        </div>
        <div *ngFor="let notification of notifications" class="notification-item border-bottom pb-2 mb-2">
          <div class="d-flex justify-content-between align-items-start">
            <div class="flex-grow-1">
              <h6 class="mb-1">{{ notification.title }}</h6>
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
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notification-item {
      transition: background-color 0.2s;
      background-color: #f8fafc;
      color: #0f172a;
      border-radius: 6px;
      padding: 6px 8px;
    }
    .notification-item:hover {
      background-color: #eef2f7;
    }
  `]
})
export class AdminNotificationsComponent implements OnInit {
  notifications: Notification[] = [];

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    // Load admin notifications
    this.notificationService.getNotifications('admin', true).subscribe({
      next: (notifications) => {
        this.notifications = notifications.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
      }
    });
  }

  markAsRead(notificationId: string): void {
    this.notificationService.markAsRead(notificationId).subscribe({
      next: () => {
        // Update local notification
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
          notification.read = true;
        }
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