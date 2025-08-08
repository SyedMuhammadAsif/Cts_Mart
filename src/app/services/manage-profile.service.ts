import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
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

  // Delete account
  deleteAccount(): Observable<any> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('User not logged in'));
    }

    return this.getUserProfile().pipe(
      switchMap(user => {
        return this.http.delete(`${EnvVariables.apiBaseUrl}/users/${user.id}`)
          .pipe(
            map(() => {
              localStorage.removeItem('isLoggedIn');
              localStorage.removeItem('userId');
              return { success: true, message: 'Account deleted successfully' };
            })
          );
      }),
      catchError(error => throwError(() => error))
    );
  }
} 