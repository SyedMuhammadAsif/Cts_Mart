import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminAuthService } from '../../../services/admin-auth.service';
import { EnvVariables } from '../../../env/env-variables';
import { HttpClient } from '@angular/common/http';
import { Md5 } from 'ts-md5';
import { AdminNavComponent } from '../../../components/admin-nav/admin-nav';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AdminNavComponent],
  templateUrl: './admin-settings.html',
  styleUrls: ['./admin-settings.css', '../admin-global.css']
})
export class AdminSettingsComponent implements OnInit {
  changePasswordForm: FormGroup;
  profileForm: FormGroup;
  currentAdmin: any = null;
  isLoading = false;
  successMessage = '';
  errorMessage = '';
  showPasswordChange = false;
  showProfileEdit = false;

  constructor(
    private fb: FormBuilder,
    public adminAuth: AdminAuthService,
    private http: HttpClient,
    private router: Router
  ) {
    this.changePasswordForm = this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [
        Validators.required, 
        Validators.minLength(6),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    this.currentAdmin = this.adminAuth.getCurrentAdmin();
    if (!this.currentAdmin) {
      this.router.navigate(['/admin/login']);
      return;
    }

    // Initialize profile form with current admin data
    this.profileForm.patchValue({
      name: this.currentAdmin.name,
      email: this.currentAdmin.email
    });
  }

  /** Handle profile photo upload */
  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files && input.files[0];
    if (!file) { return; }

    const reader = new FileReader();
    reader.onload = () => {
      const photoUrl = reader.result as string; // data URL
      const updatedAdmin = { ...this.currentAdmin, photoUrl };
      this.http.put(`${EnvVariables.apiBaseUrl}/admins/${this.currentAdmin.id}`, updatedAdmin).subscribe({
        next: () => {
          this.currentAdmin = updatedAdmin;
          localStorage.setItem('currentAdmin', JSON.stringify(updatedAdmin));
          this.successMessage = 'Profile photo updated successfully!';
        },
        error: (error) => {
          console.error('❌ Error updating profile photo:', error);
          this.errorMessage = 'Failed to update photo. Please try again.';
        }
      });
    };
    reader.readAsDataURL(file);
  }

  /**
   * Custom validator to check if passwords match and meet security requirements
   */
  passwordMatchValidator(form: FormGroup) {
    const currentPassword = form.get('currentPassword')?.value;
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    
    // Check if new password matches current password
    if (currentPassword && newPassword && currentPassword === newPassword) {
      form.get('newPassword')?.setErrors({ sameAsCurrent: true });
      return { sameAsCurrent: true };
    }
    
    // Check if passwords match
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  /**
   * Change admin password
   */
  onChangePassword(): void {
    if (this.changePasswordForm.invalid) {
      this.errorMessage = 'Please fill all fields correctly';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formData = this.changePasswordForm.value;
    const currentPasswordHash = Md5.hashStr(formData.currentPassword);
    const newPasswordHash = Md5.hashStr(formData.newPassword);

    // Verify current password
    if (currentPasswordHash !== this.currentAdmin.password) {
      this.errorMessage = 'Current password is incorrect';
      this.isLoading = false;
      return;
    }

    // Update password in database
    const updatedAdmin = {
      ...this.currentAdmin,
      password: newPasswordHash
    };

    this.http.put(`${EnvVariables.apiBaseUrl}/admins/${this.currentAdmin.id}`, updatedAdmin).subscribe({
      next: () => {
        this.successMessage = 'Password changed successfully!';
        this.changePasswordForm.reset();
        this.showPasswordChange = false;
        this.isLoading = false;
        
        // Update local storage
        localStorage.setItem('currentAdmin', JSON.stringify(updatedAdmin));
        this.currentAdmin = updatedAdmin;
      },
      error: (error) => {
        console.error('❌ Error changing password:', error);
        this.errorMessage = 'Failed to change password. Please try again.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Update admin profile
   */
  onUpdateProfile(): void {
    if (this.profileForm.invalid) {
      this.errorMessage = 'Please fill all fields correctly';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formData = this.profileForm.value;
    const updatedAdmin = {
      ...this.currentAdmin,
      name: formData.name,
      email: formData.email
    };

    this.http.put(`${EnvVariables.apiBaseUrl}/admins/${this.currentAdmin.id}`, updatedAdmin).subscribe({
      next: () => {
        this.successMessage = 'Profile updated successfully!';
        this.showProfileEdit = false;
        this.isLoading = false;
        
        // Update local storage
        localStorage.setItem('currentAdmin', JSON.stringify(updatedAdmin));
        this.currentAdmin = updatedAdmin;
      },
      error: (error) => {
        console.error('❌ Error updating profile:', error);
        this.errorMessage = 'Failed to update profile. Please try again.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Toggle password change form
   */
  togglePasswordChange(): void {
    this.showPasswordChange = !this.showPasswordChange;
    this.showProfileEdit = false;
    this.changePasswordForm.reset();
    this.errorMessage = '';
    this.successMessage = '';
  }

  /**
   * Toggle profile edit form
   */
  toggleProfileEdit(): void {
    this.showProfileEdit = !this.showProfileEdit;
    this.showPasswordChange = false;
    this.errorMessage = '';
    this.successMessage = '';
  }

  /**
   * Get field error message
   */
  getFieldError(fieldName: string): string {
    const field = this.changePasswordForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['minlength']) return `${fieldName} must be at least 6 characters`;
      if (field.errors['pattern']) return 'Password must contain uppercase, lowercase, number, and special character';
      if (field.errors['email']) return 'Please enter a valid email';
      if (field.errors['passwordMismatch']) return 'Passwords do not match';
      if (field.errors['sameAsCurrent']) return 'New password cannot be the same as current password';
    }
    return '';
  }

  /**
   * Get profile field error message
   */
  getProfileFieldError(fieldName: string): string {
    const field = this.profileForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['minlength']) return `${fieldName} must be at least 2 characters`;
      if (field.errors['email']) return 'Please enter a valid email';
    }
    return '';
  }

  /**
   * Admin logout
   */
  onAdminLogout(): void {
    this.adminAuth.logout();
    this.router.navigate(['/']);
  }
} 