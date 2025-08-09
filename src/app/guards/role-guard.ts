import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AdminAuthService } from '../services/admin-auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(
    private adminAuth: AdminAuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    // Check if admin is logged in
    if (!this.adminAuth.isLoggedIn()) {
      console.log('❌ Role guard: Admin not logged in');
      this.router.navigate(['/admin/login']);
      return false;
    }

    // Get required permission from route data
    const requiredPermission = route.data['permission'];
    
    if (!requiredPermission) {
      console.log('✅ Role guard: No permission required');
      return true;
    }

    // Check if admin has the required permission
    if (this.adminAuth.hasPermission(requiredPermission)) {
      console.log(`✅ Role guard: Admin has permission '${requiredPermission}'`);
      return true;
    } else {
      console.log(`❌ Role guard: Admin lacks permission '${requiredPermission}'`);
      // Redirect to dashboard with error message
      this.router.navigate(['/admin/dashboard'], { 
        queryParams: { error: 'insufficient_permissions' } 
      });
      return false;
    }
  }
} 