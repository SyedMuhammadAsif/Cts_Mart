import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Order } from '../../models/payment';
import { PaymentToastComponent } from '../../pages/payment-toast/payment-toast';

@Component({
  selector: 'app-order-tracking',
  standalone: true,
  imports: [CommonModule, PaymentToastComponent],
  templateUrl: './order-tracking.html',
  styleUrl: './order-tracking.css'
})
export class OrderTrackingComponent implements OnInit {
  order: Order | null = null;
  orderNumber: string = '';
  isLoading = true;
  error: string = '';

  trackingSteps = [
    { id: 'confirmed', title: 'Order Confirmed', description: 'We have received your order', completed: false },
    { id: 'processing', title: 'Processing', description: 'Your order is being prepared', completed: false },
    { id: 'shipped', title: 'Shipped', description: 'Your order is on its way', completed: false },
    { id: 'delivered', title: 'Delivered', description: 'Your order has been delivered', completed: false }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {
    console.log('🏗️ OrderTrackingComponent constructor called');
  }

  ngOnInit(): void {
    console.log('🎯 OrderTrackingComponent ngOnInit called');
    this.route.params.subscribe(params => {
      console.log('📊 Route params received:', params);
      this.orderNumber = params['orderNumber'];
      console.log('📋 Order number extracted:', this.orderNumber);
      if (this.orderNumber) {
        console.log('✅ Order number found, loading order...');
        this.loadOrder();
      } else {
        console.log('❌ No order number provided');
        this.error = 'No order number provided';
        this.isLoading = false;
      }
    });
  }

  private loadOrder(): void {
    console.log('📦 loadOrder method called');
    // Show loading state
    this.isLoading = true;
    console.log('⏳ Loading state set to true');

    // Get all orders from database
    console.log('🌐 Making HTTP request to: http://localhost:3000/orders');
    this.http.get<Order[]>(`http://localhost:3000/orders`).toPromise()
      .then((orders) => {
        console.log('📥 Received orders from API:', orders);
        // Find the specific order by order number
        this.order = orders?.find(order => order.orderNumber === this.orderNumber) || null;
        console.log('🔍 Found order:', this.order);
        
        if (this.order) {
          console.log('✅ Order found, updating tracking steps...');
          // Update the tracking steps based on order status
          this.updateTrackingSteps();
        } else {
          console.log('❌ Order not found');
          this.error = 'Order not found';
        }
        this.isLoading = false;
        console.log('⏳ Loading state set to false');
      })
      .catch((error) => {
        console.error('❌ Error loading order:', error);
        this.error = 'Failed to load order information';
        this.isLoading = false;
        console.log('⏳ Loading state set to false (due to error)');
      });
  }

  private updateTrackingSteps(): void {
    if (!this.order) return;

    const statusMap: { [key: string]: number } = {
      'pending': 0,
      'confirmed': 1,
      'processing': 2,
      'shipped': 3,
      'delivered': 4
    };

    const currentStatusIndex = statusMap[this.order.orderStatus] || 0;
    
    this.trackingSteps.forEach((step, index) => {
      step.completed = index <= currentStatusIndex;
    });
  }

  continueShopping(): void {
    this.router.navigate(['/']);
  }

  viewOrderDetails(): void {
    // Could implement a detailed order view
    console.log('Order details:', this.order);
  }

  formatPrice(price: number): string {
    if (!price || isNaN(price)) return '$0.00';
    return `$${price.toFixed(2)}`;
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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
} 