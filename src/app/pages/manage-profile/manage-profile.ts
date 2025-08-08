import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ManageProfileService } from '../../services/manage-profile.service';
import { ToastService } from '../../services/toast-service';
import { User, UserAddress, UserPaymentMethod, PasswordResetRequest } from '../../models/user';

@Component({
  selector: 'app-manage-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-profile.html',
  styleUrls: ['./manage-profile.css']
})
export class ManageProfile implements OnInit {
  user: User = {} as User;
  loading = false;
  
  // Active section
  activeSection = 'account';
  
  // Edit modes
  editingAccount = false;
  editingAddress = false;
  editingPayment = false;
  
  // Temporary edit data
  tempAccountData: Partial<User> = {};
  tempAddressData: UserAddress = {} as UserAddress;
  tempPaymentData: UserPaymentMethod = {} as UserPaymentMethod;
  
  // Password reset data
  passwordData: PasswordResetRequest = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  
  // Selected items for editing
  selectedAddress: UserAddress | null = null;
  selectedPayment: UserPaymentMethod | null = null;
  
  // Confirmation modals
  showDeleteAccountModal = false;
  showResetPasswordModal = false;

  constructor(
    private manageProfileService: ManageProfileService,
    private toastService: ToastService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
    
    // Handle URL fragment to open specific section
    this.route.fragment.subscribe(fragment => {
      if (fragment) {
        this.setActiveSection(fragment);
      }
    });
  }

  loadUserProfile(): void {
    this.loading = true;
    this.manageProfileService.getUserProfile().subscribe({
      next: (user) => {
        this.user = user;
        this.loading = false;
      },
      error: (error) => {
        this.toastService.showError('Error loading profile: ' + error.message);
        this.loading = false;
      }
    });
  }

  // Account Information Methods
  startEditingAccount(): void {
    this.editingAccount = true;
    this.tempAccountData = {
      name: this.user.name,
      email: this.user.email,
      phone: this.user.phone || '',
      dateOfBirth: this.user.dateOfBirth || '',
      gender: this.user.gender || ''
    };
  }

  saveAccountInfo(): void {
    this.loading = true;
    this.manageProfileService.updateAccountInfo(this.tempAccountData).subscribe({
      next: (updatedUser) => {
        this.user = { ...this.user, ...this.tempAccountData };
        this.editingAccount = false;
        this.tempAccountData = {};
        this.toastService.showSuccess('Account information updated successfully');
        this.loading = false;
      },
      error: (error) => {
        this.toastService.showError('Error updating account: ' + error.message);
        this.loading = false;
      }
    });
  }

  cancelEditingAccount(): void {
    this.editingAccount = false;
    this.tempAccountData = {};
  }

  // Address Methods
  startEditingAddress(address?: UserAddress): void {
    this.editingAddress = true;
    if (address) {
      this.selectedAddress = address;
      this.tempAddressData = { ...address };
    } else {
      this.selectedAddress = null;
      this.tempAddressData = {
        fullName: this.user.name,
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
        phone: this.user.phone || ''
      } as UserAddress;
    }
  }

  saveAddress(): void {
    this.loading = true;
    this.manageProfileService.updateAddress(this.tempAddressData).subscribe({
      next: (updatedUser) => {
        this.loadUserProfile(); // Reload to get updated addresses
        this.editingAddress = false;
        this.tempAddressData = {} as UserAddress;
        this.selectedAddress = null;
        this.toastService.showSuccess('Address updated successfully');
        this.loading = false;
      },
      error: (error) => {
        this.toastService.showError('Error updating address: ' + error.message);
        this.loading = false;
      }
    });
  }

  cancelEditingAddress(): void {
    this.editingAddress = false;
    this.tempAddressData = {} as UserAddress;
    this.selectedAddress = null;
  }

  removeAddress(addressId: string): void {
    if (confirm('Are you sure you want to remove this address?')) {
      this.loading = true;
      this.manageProfileService.removeAddress(addressId).subscribe({
        next: () => {
          this.loadUserProfile();
          this.toastService.showSuccess('Address removed successfully');
          this.loading = false;
        },
        error: (error) => {
          this.toastService.showError('Error removing address: ' + error.message);
          this.loading = false;
        }
      });
    }
  }

  // Payment Methods
  startEditingPayment(payment?: UserPaymentMethod): void {
    this.editingPayment = true;
    if (payment) {
      this.selectedPayment = payment;
      this.tempPaymentData = { ...payment };
    } else {
      this.selectedPayment = null;
      this.tempPaymentData = {
        type: 'card',
        cardNumber: '',
        cardholderName: '',
        expiryMonth: '',
        expiryYear: '',
        upiId: ''
      } as UserPaymentMethod;
    }
  }

  savePaymentMethod(): void {
    this.loading = true;
    this.manageProfileService.updatePaymentMethod(this.tempPaymentData).subscribe({
      next: () => {
        this.loadUserProfile();
        this.editingPayment = false;
        this.tempPaymentData = {} as UserPaymentMethod;
        this.selectedPayment = null;
        this.toastService.showSuccess('Payment method updated successfully');
        this.loading = false;
      },
      error: (error) => {
        this.toastService.showError('Error updating payment method: ' + error.message);
        this.loading = false;
      }
    });
  }

  cancelEditingPayment(): void {
    this.editingPayment = false;
    this.tempPaymentData = {} as UserPaymentMethod;
    this.selectedPayment = null;
  }

  removePaymentMethod(paymentId: string): void {
    if (confirm('Are you sure you want to remove this payment method?')) {
      this.loading = true;
      this.manageProfileService.removePaymentMethod(paymentId).subscribe({
        next: () => {
          this.loadUserProfile();
          this.toastService.showSuccess('Payment method removed successfully');
          this.loading = false;
        },
        error: (error) => {
          this.toastService.showError('Error removing payment method: ' + error.message);
          this.loading = false;
        }
      });
    }
  }

  // Security Methods
  openResetPasswordModal(): void {
    this.showResetPasswordModal = true;
    this.passwordData = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
  }

  resetPassword(): void {
    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      this.toastService.showError('New passwords do not match');
      return;
    }

    this.loading = true;
    this.manageProfileService.resetPassword(this.passwordData).subscribe({
      next: (response) => {
        this.showResetPasswordModal = false;
        this.passwordData = {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        };
        this.toastService.showSuccess('Password reset successfully');
        this.loading = false;
      },
      error: (error) => {
        this.toastService.showError('Error resetting password: ' + error.message);
        this.loading = false;
      }
    });
  }

  closeResetPasswordModal(): void {
    this.showResetPasswordModal = false;
    this.passwordData = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
  }

  // Account Actions
  openDeleteAccountModal(): void {
    this.showDeleteAccountModal = true;
  }

  deleteAccount(): void {
    this.loading = true;
    this.manageProfileService.deleteAccount().subscribe({
      next: (response) => {
        this.toastService.showSuccess('Account deleted successfully');
        this.router.navigate(['/home']);
        this.loading = false;
      },
      error: (error) => {
        this.toastService.showError('Error deleting account: ' + error.message);
        this.loading = false;
      }
    });
  }

  closeDeleteAccountModal(): void {
    this.showDeleteAccountModal = false;
  }

  // Utility methods
  getMaskedCardNumber(cardNumber: string): string {
    if (!cardNumber || cardNumber.length < 4) return '****';
    return '**** **** **** ' + cardNumber.slice(-4);
  }

  getCurrentYear(): number {
    return new Date().getFullYear();
  }

  getYearRange(): number[] {
    const currentYear = this.getCurrentYear();
    const years = [];
    for (let i = currentYear; i <= currentYear + 20; i++) {
      years.push(i);
    }
    return years;
  }

  // Navigation methods
  setActiveSection(section: string): void {
    // Validate section is one of the allowed sections
    const validSections = ['account', 'address', 'payment', 'security', 'danger'];
    if (validSections.includes(section)) {
      this.activeSection = section;
    } else {
      // Default to account section if invalid section provided
      this.activeSection = 'account';
    }
    
    // Cancel any ongoing edits when switching sections
    this.cancelEditingAccount();
    this.cancelEditingAddress();
    this.cancelEditingPayment();
    this.closeResetPasswordModal();
    this.closeDeleteAccountModal();
  }
} 