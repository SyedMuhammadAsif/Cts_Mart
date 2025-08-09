import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { Order, OrderTracking, ProcessingLocation } from '../models/payment';
import { AdminAuthService } from './admin-auth.service';
import { EnvVariables } from '../env/env-variables';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class OrderProcessingService {
  private orderUpdateSubject = new BehaviorSubject<Order | null>(null);
  public orderUpdate$ = this.orderUpdateSubject.asObservable();

  constructor(
    private http: HttpClient,
    private adminAuth: AdminAuthService
  ) {}

  /**
   * Get all processing locations from database
   */
  getProcessingLocations(): Observable<ProcessingLocation[]> {
    return this.http.get<ProcessingLocation[]>(`${EnvVariables.apiBaseUrl}/processingLocations`);
  }

  /**
   * Update order status with location tracking
   */
  updateOrderStatus(
    orderId: string, 
    newStatus: Order['orderStatus'], 
    locationId?: string,
    notes?: string
  ): Observable<Order> {
    const currentAdmin = this.adminAuth.getCurrentAdmin();
    const timestamp = new Date().toISOString();

    // Get current order to update
    return new Observable(observer => {
      this.http.get<Order>(`${EnvVariables.apiBaseUrl}/orders/${orderId}`).subscribe({
        next: (order) => {
          // Get location details if provided
          if (locationId) {
            this.getProcessingLocations().subscribe({
              next: (locations) => {
                const location = locations.find(loc => loc.id === locationId);
                this.updateOrderWithLocation(order, newStatus, location, notes, currentAdmin, timestamp, observer);
              },
              error: (error) => {
                console.error('❌ Error fetching locations:', error);
                this.updateOrderWithLocation(order, newStatus, undefined, notes, currentAdmin, timestamp, observer);
              }
            });
          } else {
            this.updateOrderWithLocation(order, newStatus, undefined, notes, currentAdmin, timestamp, observer);
          }
        },
        error: (error) => {
          console.error('❌ Error fetching order for update:', error);
          observer.error(error);
        }
      });
    });
  }

  /**
   * Helper method to update order with location
   */
  private updateOrderWithLocation(
    order: Order,
    newStatus: Order['orderStatus'],
    location: ProcessingLocation | undefined,
    notes: string | undefined,
    currentAdmin: any,
    timestamp: string,
    observer: any
  ): void {
    // Create tracking entry
    const trackingEntry: OrderTracking = {
      status: newStatus,
      location: location ? `${location.name}, ${location.city}` : undefined,
      description: this.getStatusDescription(newStatus, location),
      timestamp: timestamp,
      updatedBy: currentAdmin?.name || 'System'
    };

    // Update order with new status and tracking info
    const updatedOrder: Order = {
      ...order,
      orderStatus: newStatus,
      currentLocation: location,
      processingNotes: notes || order.processingNotes,
      lastUpdated: timestamp,
      updatedBy: currentAdmin?.name || 'System',
      trackingHistory: [
        ...(order.trackingHistory || []),
        trackingEntry
      ]
    };

    // Save updated order
    this.http.put<Order>(`${EnvVariables.apiBaseUrl}/orders/${order.id}`, updatedOrder).subscribe({
      next: (savedOrder) => {
        console.log('✅ Order status updated:', savedOrder.orderNumber, newStatus);
        this.orderUpdateSubject.next(savedOrder);
        observer.next(savedOrder);
        observer.complete();
      },
      error: (error) => {
        console.error('❌ Error saving order update:', error);
        observer.error(error);
      }
    });
  }

  /**
   * Get status description based on status and location
   */
  private getStatusDescription(status: Order['orderStatus'], location?: ProcessingLocation): string {
    const statusDescriptions: { [key: string]: string } = {
      'pending': 'Order received and pending confirmation',
      'confirmed': 'Order confirmed and payment verified',
      'processing': location ? 
        `Order is being processed at ${location.name}` : 
        'Order is being processed',
      'shipped': location ? 
        `Order shipped from ${location.name}` : 
        'Order has been shipped',
      'delivered': 'Order has been delivered to customer',
      'cancelled': 'Order has been cancelled'
    };

    return statusDescriptions[status] || 'Status updated';
  }

  /**
   * Get order tracking history
   */
  getOrderTracking(orderId: string): Observable<OrderTracking[]> {
    return new Observable(observer => {
      this.http.get<Order>(`${EnvVariables.apiBaseUrl}/orders/${orderId}`).subscribe({
        next: (order) => {
          observer.next(order.trackingHistory || []);
          observer.complete();
        },
        error: (error) => {
          console.error('❌ Error fetching order tracking:', error);
          observer.error(error);
        }
      });
    });
  }

  /**
   * Add processing notes to order
   */
  addProcessingNotes(orderId: string, notes: string): Observable<Order> {
    const currentAdmin = this.adminAuth.getCurrentAdmin();
    const timestamp = new Date().toISOString();

    return new Observable(observer => {
      this.http.get<Order>(`${EnvVariables.apiBaseUrl}/orders/${orderId}`).subscribe({
        next: (order) => {
          const updatedOrder: Order = {
            ...order,
            processingNotes: notes,
            lastUpdated: timestamp,
            updatedBy: currentAdmin?.name || 'System'
          };

          this.http.put<Order>(`${EnvVariables.apiBaseUrl}/orders/${orderId}`, updatedOrder).subscribe({
            next: (savedOrder) => {
              console.log('✅ Processing notes added to order:', savedOrder.orderNumber);
              this.orderUpdateSubject.next(savedOrder);
              observer.next(savedOrder);
              observer.complete();
            },
            error: (error) => {
              console.error('❌ Error saving processing notes:', error);
              observer.error(error);
            }
          });
        },
        error: (error) => {
          console.error('❌ Error fetching order for notes update:', error);
          observer.error(error);
        }
      });
    });
  }

  /**
   * Get orders by status
   */
  getOrdersByStatus(status: Order['orderStatus']): Observable<Order[]> {
    return this.http.get<Order[]>(`${EnvVariables.apiBaseUrl}/orders`).pipe(
      map(orders => orders.filter(order => order.orderStatus === status))
    );
  }

  /**
   * Get orders that need attention (pending, processing)
   */
  getOrdersNeedingAttention(): Observable<Order[]> {
    return this.http.get<Order[]>(`${EnvVariables.apiBaseUrl}/orders`).pipe(
      map(orders => orders.filter(order => 
        ['pending', 'processing'].includes(order.orderStatus)
      ))
    );
  }

  /**
   * Get order statistics
   */
  getOrderStatistics(): Observable<{
    total: number;
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  }> {
    return this.http.get<Order[]>(`${EnvVariables.apiBaseUrl}/orders`).pipe(
      map(orders => {
        const stats = {
          total: orders.length,
          pending: 0,
          processing: 0,
          shipped: 0,
          delivered: 0,
          cancelled: 0
        };

        orders.forEach(order => {
          switch (order.orderStatus) {
            case 'pending': stats.pending++; break;
            case 'processing': stats.processing++; break;
            case 'shipped': stats.shipped++; break;
            case 'delivered': stats.delivered++; break;
            case 'cancelled': stats.cancelled++; break;
          }
        });

        return stats;
      })
    );
  }
} 