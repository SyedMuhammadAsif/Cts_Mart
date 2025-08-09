import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AdminAuthService } from '../services/admin-auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(
    private adminAuth: AdminAuthService,
    private router: Router
  ) {}

  /**
   * Check if admin is logged in before allowing access to admin routes
   * Simple and beginner-friendly implementation!
   */
  canActivate(): boolean {
    // Check if admin is logged in
    if (this.adminAuth.isLoggedIn()) {
      console.log('✅ Admin access granted');
      return true;
    } else {
      console.log('❌ Admin access denied - redirecting to home');
      // Redirect to home page if not logged in as admin
      this.router.navigate(['/']);
      return false;
    }
  }
} 