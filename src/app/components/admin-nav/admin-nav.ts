import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminAuthService } from '../../services/admin-auth.service';

@Component({
  selector: 'app-admin-nav',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="admin-nav">
      <a routerLink="/admin/dashboard" class="btn btn-outline-light me-2">Dashboard</a>
      <a routerLink="/admin/products" class="btn btn-outline-light me-2" *ngIf="adminAuth.canManageProducts()">Products</a>
      <a routerLink="/admin/orders" class="btn btn-outline-light me-2" *ngIf="adminAuth.canManageOrders()">Orders</a>
      <a routerLink="/admin/customers" class="btn btn-outline-light me-2" *ngIf="adminAuth.canManageCustomers()">Customers</a>
      <a routerLink="/admin/settings" class="btn btn-outline-light me-2">Settings</a>
      <button (click)="onAdminLogout()" class="btn btn-outline-danger me-2">
        <svg width="16" height="16" fill="currentColor" class="me-1" viewBox="0 0 16 16">
          <path fill-rule="evenodd" d="M6 12.5a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5h-8a.5.5 0 0 0-.5.5v2a.5.5 0 0 1-1 0v-2A1.5 1.5 0 0 1 6.5 2h8A1.5 1.5 0 0 1 16 3.5v9a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 5 12.5v-2a.5.5 0 0 1 1 0v2z"/>
          <path fill-rule="evenodd" d="M.146 8.354a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L1.707 7.5H10.5a.5.5 0 0 1 0 1H1.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3z"/>
        </svg>
        Logout
      </button>
      <a routerLink="/" class="btn btn-light back-store">Back to Store</a>
    </div>
  `,
  styles: [`
    .admin-nav {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      align-items: center;
      gap: 0.5rem;
    }

    .admin-nav .btn {
      border-radius: 6px;
      font-weight: 500;
      transition: all 0.3s ease;
      white-space: nowrap;
    }

    .admin-nav .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }

    .btn-outline-light {
      color: white;
      border-color: rgba(255, 255, 255, 0.5);
    }

    .btn-outline-light:hover {
      background-color: white;
      color: #1e40af;
      border-color: white;
    }

    .btn-outline-danger {
      color: #ef4444;
      border-color: #ef4444;
    }

    .btn-outline-danger:hover {
      background-color: #ef4444;
      border-color: #ef4444;
      color: white;
    }

    .btn-light {
      background-color: white;
      border-color: white;
      color: #1e40af;
    }

    .btn-light:hover {
      background-color: #f8fafc;
      border-color: #f8fafc;
      color: #1e40af;
    }

    .back-store { order: 99; }

    @media (max-width: 1200px) {
      .back-store { flex-basis: 100%; text-align: right; }
    }
  `]
})
export class AdminNavComponent {
  constructor(public adminAuth: AdminAuthService) {}

  onAdminLogout(): void {
    this.adminAuth.logout();
    // Redirect to admin login
    window.location.href = '/admin/login';
  }
} 