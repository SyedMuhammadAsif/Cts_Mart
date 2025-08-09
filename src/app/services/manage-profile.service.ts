import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { EnvVariables } from '../env/env-variables';
import { User, UserAddress, UserPaymentMethod, PasswordResetRequest } from '../models/user';
import { Md5 } from 'ts-md5';

@Injectable({
  providedIn: 'root'
})
export class ManageProfileService {

  constructor(private http: HttpClient) { }

  private getCurrentUserId(): string | null {
    return localStorage.getItem('userId');
  }

  // Get current user data
  getUserProfile(): Observable<User> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('User not logged in'));
    }

    return this.http.get<User[]>(`${EnvVariables.apiBaseUrl}/users?user_id=${userId}`)
      .pipe(
        map(users => {
          if (users.length === 0) {
            throw new Error('User not found');
          }
          return users[0];
        }),
        catchError(error => throwError(() => error))
      );
  }

  // Update account information
  updateAccountInfo(accountData: Partial<User>): Observable<User> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('User not logged in'));
    }

    return this.getUserProfile().pipe(
      switchMap(user => {
        const updatedUser = { ...user, ...accountData };
        return this.http.put<User>(`${EnvVariables.apiBaseUrl}/users/${user.id}`, updatedUser);
      }),
      catchError(error => throwError(() => error))
    );
  }

  // Add or update address
  updateAddress(addressData: UserAddress): Observable<User> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('User not logged in'));
    }

    return this.getUserProfile().pipe(
      switchMap(user => {
        const addresses = user.addresses || [];
        
        if (addressData.id) {
          // Update existing address
          const index = addresses.findIndex(addr => addr.id === addressData.id);
          if (index !== -1) {
            addresses[index] = addressData;
          }
        } else {
          // Add new address
          addressData.id = Date.now().toString();
          addresses.push(addressData);
        }

        const updatedUser = { ...user, addresses };
        return this.http.put<User>(`${EnvVariables.apiBaseUrl}/users/${user.id}`, updatedUser);
      }),
      catchError(error => throwError(() => error))
    );
  }

  // Remove address
  removeAddress(addressId: string): Observable<User> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('User not logged in'));
    }

    return this.getUserProfile().pipe(
      switchMap(user => {
        const addresses = (user.addresses || []).filter(addr => addr.id !== addressId);
        const updatedUser = { ...user, addresses };
        return this.http.put<User>(`${EnvVariables.apiBaseUrl}/users/${user.id}`, updatedUser);
      }),
      catchError(error => throwError(() => error))
    );
  }

  // Add or update payment method
  updatePaymentMethod(paymentData: UserPaymentMethod): Observable<User> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('User not logged in'));
    }

    return this.getUserProfile().pipe(
      switchMap(user => {
        const paymentMethods = user.paymentMethods || [];
        
        if (paymentData.id) {
          // Update existing payment method
          const index = paymentMethods.findIndex(pm => pm.id === paymentData.id);
          if (index !== -1) {
            paymentMethods[index] = paymentData;
          }
        } else {
          // Add new payment method
          paymentData.id = Date.now().toString();
          paymentMethods.push(paymentData);
        }

        const updatedUser = { ...user, paymentMethods };
        return this.http.put<User>(`${EnvVariables.apiBaseUrl}/users/${user.id}`, updatedUser);
      }),
      catchError(error => throwError(() => error))
    );
  }

  // Remove payment method
  removePaymentMethod(paymentMethodId: string): Observable<User> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('User not logged in'));
    }

    return this.getUserProfile().pipe(
      switchMap(user => {
        const paymentMethods = (user.paymentMethods || []).filter(pm => pm.id !== paymentMethodId);
        const updatedUser = { ...user, paymentMethods };
        return this.http.put<User>(`${EnvVariables.apiBaseUrl}/users/${user.id}`, updatedUser);
      }),
      catchError(error => throwError(() => error))
    );
  }

  // Reset password
  resetPassword(passwordData: PasswordResetRequest): Observable<any> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('User not logged in'));
    }

    return this.getUserProfile().pipe(
      switchMap(user => {
        const currentPasswordHash = Md5.hashStr(passwordData.currentPassword);
        
        if (user.password !== currentPasswordHash) {
          throw new Error('Current password is incorrect');
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
          throw new Error('New passwords do not match');
        }

        const newPasswordHash = Md5.hashStr(passwordData.newPassword);
        const updatedUser = { ...user, password: newPasswordHash };
        
        return this.http.put<User>(`${EnvVariables.apiBaseUrl}/users/${user.id}`, updatedUser)
          .pipe(
            map(() => ({ success: true, message: 'Password updated successfully' }))
          );
      }),
      catchError(error => throwError(() => error))
    );
  }

  // Delete account (with cascade delete of related data)
  deleteAccount(): Observable<any> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('User not logged in'));
    }

    const baseUrl = EnvVariables.apiBaseUrl;

    return this.getUserProfile().pipe(
      switchMap(user => {
        const userEmail = user.email;
        const userPhone = (user as any).phone;

        // 1) Delete wishlist items (no user scoping available → delete all client-side for now)
        const deleteWishlist$ = this.http.get<any[]>(`${baseUrl}/wishlist`).pipe(
          switchMap(items => items.length ? forkJoin(items.map(i => this.http.delete(`${baseUrl}/wishlist/${i.id}`))) : of([]))
        );

        // 2) Delete cart items (cart is global in current implementation)
        const deleteCart$ = this.http.get<any[]>(`${baseUrl}/cart`).pipe(
          switchMap(items => items.length ? forkJoin(items.map(i => this.http.delete(`${baseUrl}/cart/${i.id}`))) : of([]))
        );

        // 3) Delete this user's orders (match by email or phone)
        const deleteOrders$ = this.http.get<any[]>(`${baseUrl}/orders`).pipe(
          switchMap(orders => {
            const mine = orders.filter(o => (o?.userId === user.user_id) || (o?.customerInfo?.email === userEmail) || (userPhone && o?.customerInfo?.phone === userPhone));
            return mine.length ? forkJoin(mine.map(o => this.http.delete(`${baseUrl}/orders/${o.id}`))) : of([]);
          })
        );

        return forkJoin([deleteWishlist$, deleteCart$, deleteOrders$]).pipe(
          switchMap(() => this.http.delete(`${baseUrl}/users/${user.id}`)),
          map(() => {
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userId');
            return { success: true, message: 'Account and related data deleted successfully' };
          })
        );
      }),
      catchError(error => throwError(() => error))
    );
  }
} 