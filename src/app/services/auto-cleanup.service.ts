import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timer, firstValueFrom } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { EnvVariables } from '../env/env-variables';

@Injectable({
  providedIn: 'root'
})
export class AutoCleanupService {

  constructor(private http: HttpClient) {}

  /**
   * Start auto-cleanup process
   * Runs every hour to check for orders that need to be deleted
   */
  startAutoCleanup(): void {
    console.log('🔄 Starting auto-cleanup service...');
    
    // Check every hour (3600000 ms)
    timer(0, 3600000).pipe(
      switchMap(() => this.cleanupExpiredOrders())
    ).subscribe({
      next: (result) => {
        if (result.deletedCount > 0) {
          console.log(`✅ Auto-cleanup: Deleted ${result.deletedCount} expired orders`);
        }
      },
      error: (error) => {
        console.error('❌ Auto-cleanup error:', error);
      }
    });
  }

  /**
   * Clean up orders that have passed their auto-delete date
   */
  private cleanupExpiredOrders(): Observable<{deletedCount: number}> {
    return new Observable(observer => {
      this.http.get<any[]>(`${EnvVariables.apiBaseUrl}/orders`).subscribe({
        next: (orders) => {
          const now = new Date();
          let deletedCount = 0;

          // Find orders that should be auto-deleted
          const expiredOrders = orders?.filter(order => {
            if (!order.isArchived || !order.autoDeleteDate) return false;
            
            const autoDeleteDate = new Date(order.autoDeleteDate);
            return now >= autoDeleteDate;
          }) || [];

          console.log(`🔍 Found ${expiredOrders.length} orders ready for auto-deletion`);

          // Delete expired orders
          if (expiredOrders.length > 0) {
            const deletePromises = expiredOrders.map(order => 
              firstValueFrom(this.http.delete(`${EnvVariables.apiBaseUrl}/orders/${order.id}`))
            );

            Promise.all(deletePromises).then(() => {
              deletedCount = expiredOrders.length;
              observer.next({ deletedCount });
              observer.complete();
            }).catch(error => {
              console.error('❌ Error during auto-deletion:', error);
              observer.error(error);
            });
          } else {
            observer.next({ deletedCount: 0 });
            observer.complete();
          }
        },
        error: (error) => {
          console.error('❌ Error fetching orders for cleanup:', error);
          observer.error(error);
        }
      });
    });
  }

  /**
   * Manual cleanup (can be called from admin panel)
   */
  manualCleanup(): Observable<{deletedCount: number}> {
    return this.cleanupExpiredOrders().pipe(
      tap(result => {
        console.log(`🧹 Manual cleanup completed: ${result.deletedCount} orders deleted`);
      })
    );
  }

  /**
   * Get cleanup statistics
   */
  getCleanupStats(): Observable<{
    totalArchived: number;
    expiredCount: number;
    nextCleanup: string;
  }> {
    return new Observable(observer => {
      this.http.get<any[]>(`${EnvVariables.apiBaseUrl}/orders`).subscribe({
        next: (orders) => {
          const now = new Date();
          
          const archivedOrders = orders?.filter(order => order.isArchived) || [];
          const expiredOrders = archivedOrders.filter(order => {
            if (!order.autoDeleteDate) return false;
            const autoDeleteDate = new Date(order.autoDeleteDate);
            return now >= autoDeleteDate;
          });

          // Calculate next cleanup time (1 hour from now)
          const nextCleanup = new Date(now.getTime() + 3600000);

          observer.next({
            totalArchived: archivedOrders.length,
            expiredCount: expiredOrders.length,
            nextCleanup: nextCleanup.toISOString()
          });
          observer.complete();
        },
        error: (error) => {
          console.error('❌ Error getting cleanup stats:', error);
          observer.error(error);
        }
      });
    });
  }
} 