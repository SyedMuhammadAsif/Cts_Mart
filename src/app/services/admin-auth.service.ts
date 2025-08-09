import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Admin, AdminLoginData, AdminPermission } from '../models/admin';
import { EnvVariables } from '../env/env-variables';
import { Md5 } from 'ts-md5';

@Injectable({
  providedIn: 'root'
})
export class AdminAuthService {
  private currentAdminSubject = new BehaviorSubject<Admin | null>(null);
  public currentAdmin$ = this.currentAdminSubject.asObservable();

  constructor(private http: HttpClient) {
    // Check if admin is already logged in
    this.checkExistingLogin();
  }

  /**
   * Check if admin is already logged in from localStorage
   */
  private checkExistingLogin(): void {
    const adminData = localStorage.getItem('currentAdmin');
    if (adminData) {
      try {
        const admin = JSON.parse(adminData);
        this.currentAdminSubject.next(admin);
      } catch (error) {
        // Clear invalid data
        localStorage.removeItem('currentAdmin');
        localStorage.removeItem('isAdminLoggedIn');
      }
    }
  }

  /**
   * Admin login - authenticate with email and password
   * @param loginData Admin login credentials
   * @returns Observable with login result
   */
  login(loginData: AdminLoginData): Observable<Admin> {
    const hashedPassword = Md5.hashStr(loginData.password);

    return this.http.get<Admin[]>(`${EnvVariables.apiBaseUrl}/admins`).pipe(
      map(admins => {
        const admin = admins.find(a => 
          a.email === loginData.email && 
          a.password === hashedPassword
        );

        if (admin) {
          // Update last login time
          const updatedAdmin = {
            ...admin,
            lastLogin: new Date().toISOString()
          };

          // Update in database
          this.http.patch(`${EnvVariables.apiBaseUrl}/admins/${admin.id}`, {
            lastLogin: updatedAdmin.lastLogin
          }).subscribe();

          // Store in localStorage and update current admin
          localStorage.setItem('isAdminLoggedIn', 'true');
          localStorage.setItem('currentAdmin', JSON.stringify(updatedAdmin));
          this.currentAdminSubject.next(updatedAdmin);

          return updatedAdmin;
        } else {
          throw new Error('Invalid email or password');
        }
      }),
      catchError(err => throwError(() => err))
    );
  }

  /**
   * Admin logout - clear session and redirect
   */
  logout(): void {
    localStorage.removeItem('isAdminLoggedIn');
    localStorage.removeItem('currentAdmin');
    this.currentAdminSubject.next(null);
  }

  /**
   * Check if admin is currently logged in
   * @returns boolean indicating login status
   */
  isLoggedIn(): boolean {
    return localStorage.getItem('isAdminLoggedIn') === 'true' && 
           this.currentAdminSubject.value !== null;
  }

  /**
   * Get current logged-in admin
   * @returns Current admin or null
   */
  getCurrentAdmin(): Admin | null {
    return this.currentAdminSubject.value;
  }

  /**
   * Check if current admin has specific permission
   * @param permission Permission to check
   * @returns boolean indicating if admin has permission
   */
  hasPermission(permission: AdminPermission): boolean {
    const currentAdmin = this.getCurrentAdmin();
    if (!currentAdmin) return false;

    return currentAdmin.permissions.includes(permission);
  }

  /**
   * Check if current admin has any of the specified permissions
   * @param permissions Array of permissions to check
   * @returns boolean indicating if admin has at least one permission
   */
  hasAnyPermission(permissions: AdminPermission[]): boolean {
    const currentAdmin = this.getCurrentAdmin();
    if (!currentAdmin) return false;

    return permissions.some(permission => 
      currentAdmin.permissions.includes(permission)
    );
  }

  /**
   * Check if current admin is super admin
   * @returns boolean indicating if admin is super admin
   */
  isSuperAdmin(): boolean {
    const currentAdmin = this.getCurrentAdmin();
    return currentAdmin?.role === 'super_admin' || false;
  }

  /**
   * Check if current admin can manage products
   * @returns boolean indicating if admin can manage products
   */
  canManageProducts(): boolean {
    return this.hasPermission('manage_products');
  }

  /**
   * Check if current admin can manage orders
   * @returns boolean indicating if admin can manage orders
   */
  canManageOrders(): boolean {
    return this.hasPermission('manage_orders');
  }

  /**
   * Check if current admin can manage customers
   * @returns boolean indicating if admin can manage customers
   */
  canManageCustomers(): boolean {
    return this.hasPermission('manage_customers');
  }

  /**
   * Check if current admin can view analytics
   * @returns boolean indicating if admin can view analytics
   */
  canViewAnalytics(): boolean {
    return this.hasPermission('view_analytics');
  }

  /**
   * Get admin role display name
   * @returns string with role display name
   */
  getRoleDisplayName(): string {
    const currentAdmin = this.getCurrentAdmin();
    if (!currentAdmin) return 'Unknown';
    
    const roleNames: { [key: string]: string } = {
      'super_admin': 'Super Administrator',
      'admin': 'Administrator',
      'product_manager': 'Product Manager',
      'customer_manager': 'Customer Manager',
      'order_manager': 'Order Manager'
    };
    
    return roleNames[currentAdmin.role] || currentAdmin.role;
  }

  /**
   * Get all admins (super admin only)
   * @returns Observable with all admins
   */
  getAllAdmins(): Observable<Admin[]> {
    if (!this.isSuperAdmin()) {
      return throwError(() => new Error('Insufficient permissions'));
    }

    return this.http.get<Admin[]>(`${EnvVariables.apiBaseUrl}/admins`);
  }
} 