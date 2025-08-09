import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Order } from '../../models/payment';
import { UserAuth } from '../../services/user-auth';
import { EnvVariables } from '../../env/env-variables';
import { DataPersistenceService } from '../../services/data-persistence.service';
import { forkJoin, of, Observable, firstValueFrom } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './order-history.html',
  styleUrl: './order-history.css'
})
export class OrderHistoryComponent implements OnInit {
  orders: Order[] = [];
  isLoading = true;
  error: string = '';

  // Cancel order modal
  showCancelModal = false;
  selectedOrderForCancellation: Order | null = null;
  cancellationReason = '';
  customReason = '';

  constructor(
    private router: Router,
    private http: HttpClient,
    private userAuth: UserAuth,
    private dataPersistence: DataPersistenceService
  ) {}

  ngOnInit(): void {
    // Check if user is logged in
    if (!this.userAuth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    
    // Log application state for debugging
    this.dataPersistence.logApplicationState();
    
    // Verify database connection before loading orders
    this.dataPersistence.verifyDatabaseConnection().subscribe({
      next: (isConnected) => {
        if (isConnected) {
          this.loadOrders();
        } else {
          this.error = 'Database connection failed. Please try again.';
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('❌ Database connection error:', error);
        this.error = 'Unable to connect to database. Please check your connection.';
        this.isLoading = false;
      }
    });
  }

  private loadOrders(): void {
    // Show loading state
    this.isLoading = true;

    // Get current user ID
    const userId = localStorage.getItem('userId');
    console.log('🔍 Current userId from localStorage:', userId);
    
    if (!userId) {
      console.log('❌ No userId found in localStorage, redirecting to login');
      this.router.navigate(['/login']);
      return;
    }

    // First get the current user's email, then filter orders by email
    firstValueFrom(this.http.get<any[]>(`${EnvVariables.apiBaseUrl}/users`))
      .then((users) => {
        console.log('👥 All users from database:', users);
        
        // Find current user by user_id to get their email
        const currentUser = users?.find(user => user.user_id === userId);
        console.log('🔍 Looking for user with user_id:', userId);
        console.log('👤 Found current user:', currentUser);
        
        if (!currentUser) {
          console.error('❌ Current user not found');
          this.error = 'User not found';
          this.isLoading = false;
          return;
        }

        const userEmail = currentUser.email;
        console.log('Loading orders for user email:', userEmail);

        // Now get orders and filter by user email
        return firstValueFrom(this.http.get<any[]>(`${EnvVariables.apiBaseUrl}/orders`))
          .then((orders) => {
            console.log('All orders from database:', orders);
            
            // Filter orders by current user's email (case-insensitive) and only those visible to customer
            let filteredOrders = (orders || []).filter(order => {
              const orderEmail = order.customerInfo?.email?.toLowerCase().trim();
              const userEmailLower = userEmail?.toLowerCase().trim();
              const matches = orderEmail === userEmailLower;
              const visible = order.visibleToCustomer !== false;
              console.log(`Order ${order.orderNumber}: order email = "${orderEmail}", user email = "${userEmailLower}", matches = ${matches}, visibleToCustomer = ${visible}, status = ${order.orderStatus}`);
              return order.customerInfo && matches && visible;
            });
            
            // If no orders found by email, try to find by user ID (fallback)
            if (filteredOrders.length === 0) {
              console.log('No orders found by email, trying to find by user ID...');
              // This is a fallback - in a real system, you might want to add a userId field to orders
              // For now, we'll just log this for debugging
              console.log('Available orders for debugging:', orders);
            }
            
            this.orders = filteredOrders;
            
            // Sort orders by date (newest first)
            this.orders.sort((a, b) => {
              const dateA = a.orderDate ? new Date(a.orderDate).getTime() : 0;
              const dateB = b.orderDate ? new Date(b.orderDate).getTime() : 0;
              return dateB - dateA;
            });
            
            console.log('Loaded orders for user:', userEmail, this.orders);
            this.isLoading = false;
          });
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

  /**
   * Open cancel order modal
   */
  openCancelModal(order: Order): void {
    this.selectedOrderForCancellation = order;
    this.cancellationReason = '';
    this.customReason = '';
    this.showCancelModal = true;
  }

  /**
   * Cancel order (archive it)
   */
  cancelOrder(): void {
    if (!this.selectedOrderForCancellation || !this.selectedOrderForCancellation.id) return;

    const finalReason = this.cancellationReason === 'Other' ? this.customReason : this.cancellationReason;
    
    if (!finalReason) {
      alert('Please provide a reason for cancellation');
      return;
    }

    // Calculate auto-delete date (30 days from now)
    const autoDeleteDate = new Date();
    autoDeleteDate.setDate(autoDeleteDate.getDate() + 30);

    const isCOD = (this.selectedOrderForCancellation.paymentMethod?.type || '').toLowerCase?.() === 'cod';

    // Update order to cancelled (keep visible)
    const updatedOrder: Order = {
      ...this.selectedOrderForCancellation,
      orderStatus: 'cancelled' as const,
      cancelledAt: new Date().toISOString(),
      cancelledBy: 'customer',
      cancellationReason: finalReason,
      visibleToAdmin: true,
      visibleToCustomer: true
    };

    this.http.put(`${EnvVariables.apiBaseUrl}/orders/${this.selectedOrderForCancellation.id}`, updatedOrder).subscribe({
      next: () => {
        console.log('✅ Order cancelled and archived by customer:', this.selectedOrderForCancellation?.orderNumber);

        // Restock products for this cancelled order
        this.restockOrderItems(updatedOrder).subscribe({
          next: () => console.log('♻️ Stock restored for cancelled order items'),
          error: (err: any) => console.warn('⚠️ Failed to restore stock for some items', err)
        });
        
        // Notify customer depending on payment method
        if (!isCOD) {
          this.sendCustomerRefundNotification(finalReason);
        }
        
        // Send notification to admin about customer cancellation
        this.sendAdminNotification(finalReason);
        
        // Inline message so the user sees policy immediately
        if (!isCOD) {
          alert(`Your order has been cancelled. A refund of ${this.formatPrice(this.selectedOrderForCancellation?.total || 0)} will be processed within 7 business days.`);
        } else {
          alert('Your order has been cancelled. As the payment method was Cash on Delivery, no refund is applicable.');
        }
        
        // Keep the order visible with status cancelled
        const idx = this.orders.findIndex(o => o.id === this.selectedOrderForCancellation?.id);
        if (idx !== -1) {
          this.orders[idx] = updatedOrder;
        }
        
        this.closeCancelModal();
        
        // Resort so cancelled orders appear last
        this.orders.sort((a, b) => {
          const rank = (s: string) => s === 'cancelled' ? 2 : 0;
          const rA = rank(a.orderStatus as any);
          const rB = rank(b.orderStatus as any);
          if (rA !== rB) return rA - rB;
          const da = new Date(a.orderDate || '').getTime();
          const db = new Date(b.orderDate || '').getTime();
          return db - da;
        });
      },
      error: (error) => {
        console.error('❌ Error archiving order:', error);
        alert('Failed to archive order. Please try again.');
      }
    });
  }

/**
   * Send automatic refund notification to customer
   */
  private sendCustomerRefundNotification(reason: string): void {
    if (!this.selectedOrderForCancellation) return;

    const refundNotification = {
      id: Date.now().toString(),
      orderNumber: this.selectedOrderForCancellation.orderNumber,
      customerEmail: this.selectedOrderForCancellation.customerInfo.email,
      customerName: this.selectedOrderForCancellation.customerInfo.fullName,
      type: 'order_refund_notification',
      title: 'Order Cancelled - Refund Processing',
      message: `Dear ${this.selectedOrderForCancellation.customerInfo.fullName}, your order ${this.selectedOrderForCancellation.orderNumber} has been cancelled as requested. Reason: ${reason}. A full refund of ${this.formatPrice(this.selectedOrderForCancellation.total || 0)} will be processed within 7 business days and credited back to your original payment method.`,
      reason: reason,
      amount: this.selectedOrderForCancellation.total,
      refundTimeline: '7 business days',
      createdAt: new Date().toISOString(),
      read: false,
      customerNotification: true
    };

    console.log('📧 Sending automatic refund notification to customer:', refundNotification);

    // Save notification to database
    this.http.post(`${EnvVariables.apiBaseUrl}/notifications`, refundNotification).subscribe({
      next: (response) => {
        console.log('✅ Customer refund notification sent successfully:', response);
      },
      error: (error) => {
        console.error('❌ Error sending customer refund notification:', error);
      }
    });
  }

  /**
   * Send notification to admin about customer cancellation
   */
  private sendAdminNotification(reason: string): void {
    if (!this.selectedOrderForCancellation) return;

    const notification = {
      id: Date.now().toString(),
      orderNumber: this.selectedOrderForCancellation.orderNumber,
      customerEmail: this.selectedOrderForCancellation.customerInfo.email,
      customerName: this.selectedOrderForCancellation.customerInfo.fullName,
      type: 'order_deleted_by_customer',
      title: 'Order Deleted by Customer',
      message: `Customer ${this.selectedOrderForCancellation.customerInfo.fullName} has deleted order ${this.selectedOrderForCancellation.orderNumber}. Reason: ${reason}`,
      reason: reason,
      amount: this.selectedOrderForCancellation.total,
      createdAt: new Date().toISOString(),
      read: false,
      adminNotification: true
    };

    console.log('📧 Sending admin notification:', notification);

    // Save notification to database
    this.http.post(`${EnvVariables.apiBaseUrl}/notifications`, notification).subscribe({
      next: (response) => {
        console.log('✅ Admin notification sent successfully:', response);
      },
      error: (error) => {
        console.error('❌ Error sending admin notification:', error);
      }
    });
  }

  /**
   * Close cancel modal
   */
  closeCancelModal(): void {
    this.showCancelModal = false;
    this.selectedOrderForCancellation = null;
    this.cancellationReason = '';
    this.customReason = '';
  }

  /**
   * Check if order can be cancelled by customer
   */
  canCancelOrder(order: Order): boolean {
    const cancellableStatuses = ['confirmed', 'processing'];
    return cancellableStatuses.includes(order.orderStatus);
  }

  /** Add back product stock for all items in an order (if not delivered) */
  private restockOrderItems(order: Order): Observable<any> {
    if (!order || order.orderStatus === 'delivered' || !Array.isArray(order.items)) {
      return of(null);
    }

    const ops = order.items.map((it: any) => {
      const productId = Number(it?.ProductID || it?.Product?.id);
      const qty = Number(it?.Quantity || 0);
      if (!productId || qty <= 0) { return of(null); }
      const productUrl = `${EnvVariables.apiBaseUrl}/products/${productId}`;
      return this.http.get<any>(productUrl).pipe(
        switchMap((product) => {
          const next = Number(product?.stock || 0) + qty;
          return this.http.put(productUrl, { ...product, stock: next });
        })
      );
    });

    return ops.length ? forkJoin(ops) as Observable<any> : of(null);
  }
} 