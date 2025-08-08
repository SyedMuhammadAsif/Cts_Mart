import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Order } from '../../models/payment';
import { UserAuth } from '../../services/user-auth';

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-history.html',
  styleUrl: './order-history.css'
})
export class OrderHistoryComponent implements OnInit {
  orders: Order[] = [];
  isLoading = true;
  error: string = '';

  constructor(
    private router: Router,
    private http: HttpClient,
    private userAuth: UserAuth
  ) {}

  ngOnInit(): void {
    // Check if user is logged in
    if (!this.userAuth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    
    this.loadOrders();
  }

  private loadOrders(): void {
    // Show loading state
    this.isLoading = true;

    // Get current user ID
    const userId = localStorage.getItem('userId');
    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }

    // Get orders from database filtered by user ID
    this.http.get<any[]>(`http://localhost:3000/orders`).toPromise()
      .then((orders) => {
        // Filter orders by current user
        this.orders = (orders || []).filter(order => 
          order.customerInfo && 
          (order.customerInfo.userId === userId || order.userId === userId)
        );
        
        // Sort orders by date (newest first)
        this.orders.sort((a, b) => {
          const dateA = a.orderDate ? new Date(a.orderDate).getTime() : 0;
          const dateB = b.orderDate ? new Date(b.orderDate).getTime() : 0;
          return dateB - dateA;
        });
        
        console.log('Loaded orders for user:', userId, this.orders);
        this.isLoading = false;
      })
      .catch((error) => {
        console.error('Error loading orders:', error);
        this.error = 'Failed to load order history';
        this.isLoading = false;
      });
  }

  viewOrderDetails(orderNumber: string): void {
    this.router.navigate(['/order-tracking', orderNumber]);
  }

  formatPrice(price: number): string {
    return `$${price.toFixed(2)}`;
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

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'pending': 'warning',
      'confirmed': 'info',
      'processing': 'primary',
      'shipped': 'success',
      'delivered': 'success',
      'cancelled': 'danger'
    };
    return colors[status] || 'secondary';
  }

  getStatusText(status: string): string {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  continueShopping(): void {
    this.router.navigate(['/']);
  }
} 