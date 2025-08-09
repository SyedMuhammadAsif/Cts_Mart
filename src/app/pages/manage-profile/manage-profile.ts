import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { ManageProfileService } from '../../services/manage-profile.service';
import { ToastService } from '../../services/toast-service';
import { User, UserAddress, UserPaymentMethod, PasswordResetRequest } from '../../models/user';
import { AddressStateService } from '../../services/address-state.service';

@Component({
  selector: 'app-manage-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
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

  // Reactive form for address editing
  addressForm: FormGroup = new FormGroup({
    fullName: new FormControl('', [Validators.required, Validators.minLength(3)]),
    phone: new FormControl('', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]),
    addressLine1: new FormControl('', [Validators.required, Validators.minLength(5)]),
    addressLine2: new FormControl(''),
    city: new FormControl('', [Validators.required, Validators.minLength(2)]),
    state: new FormControl('', [Validators.required, Validators.minLength(2)]),
    postalCode: new FormControl('', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]),
    country: new FormControl('', [Validators.required, Validators.minLength(2)])
  });

  // Reactive form for account editing
  accountForm: FormGroup = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    phone: new FormControl('', [Validators.pattern(/^[0-9]{10}$/)]),
    dateOfBirth: new FormControl(''),
    gender: new FormControl('')
  });

  constructor(
    private manageProfileService: ManageProfileService,
    private toastService: ToastService,
    private router: Router,
    private route: ActivatedRoute,
    private addressState: AddressStateService
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
        
        // Seed account form with user data
        this.accountForm.patchValue({
          name: this.user.name,
          email: this.user.email,
          phone: this.user.phone || '',
          dateOfBirth: this.user.dateOfBirth || '',
          gender: this.user.gender || ''
        });
        
        // Seed address form with default or first address if exists
        const addr = (this.user.addresses && this.user.addresses.length > 0) ? this.user.addresses[0] : null;
        if (addr) {
          this.addressForm.patchValue({
            fullName: addr.fullName || this.user.name,
            phone: addr.phone || this.user.phone || '',
            addressLine1: addr.addressLine1,
            addressLine2: addr.addressLine2 || '',
            city: addr.city,
            state: addr.state,
            postalCode: addr.postalCode,
            country: addr.country
          });
          // Broadcast address to header on load as well
          this.addressState.setAddressInfo({ city: addr.city, postalCode: addr.postalCode });
        } else {
          this.addressState.setAddressInfo(null);
        }
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
    // Ensure form is up to date with user data when entering edit mode
    this.accountForm.patchValue({
      name: this.user.name,
      email: this.user.email,
      phone: this.user.phone || '',
      dateOfBirth: this.user.dateOfBirth || '',
      gender: this.user.gender || ''
    });
  }

  saveAccountInfo(): void {
    if (this.accountForm.invalid) {
      this.accountForm.markAllAsTouched();
      this.toastService.showError('Please correct the errors in the profile form');
      return;
    }

    const payload = this.accountForm.value as Partial<User>;

    this.loading = true;
    this.manageProfileService.updateAccountInfo(payload).subscribe({
      next: (updatedUser) => {
        this.user = { ...this.user, ...payload } as User;
        this.editingAccount = false;
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
  }

  // Address Methods
  startEditingAddress(address?: UserAddress): void {
    this.editingAddress = true;
    if (address) {
      this.selectedAddress = address;
      this.addressForm.reset({
        fullName: address.fullName || this.user.name,
        phone: address.phone || this.user.phone || '',
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2 || '',
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country,
      });
    } else {
      this.selectedAddress = null;
      this.addressForm.reset({
        fullName: this.user.name,
        phone: this.user.phone || '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: ''
      });
    }
  }

  saveAddress(): void {
    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      this.toastService.showError('Please correct the errors in the address form');
      return;
    }

    const formValue = this.addressForm.value;
    const updated: UserAddress = {
      ...(this.selectedAddress ? { id: this.selectedAddress.id } : {}),
      fullName: formValue.fullName,
      addressLine1: formValue.addressLine1,
      addressLine2: formValue.addressLine2,
      city: formValue.city,
      state: formValue.state,
      postalCode: formValue.postalCode,
      country: formValue.country,
      phone: formValue.phone
    } as UserAddress;

    this.loading = true;
    this.manageProfileService.updateAddress(updated).subscribe({
      next: (updatedUser) => {
        this.loadUserProfile();
        this.editingAddress = false;
        this.selectedAddress = null;
        this.toastService.showSuccess('Address updated successfully');
        this.loading = false;
        // Broadcast to header immediately
        this.addressState.setAddressInfo({ city: updated.city, postalCode: updated.postalCode });
      },
      error: (error) => {
        this.toastService.showError('Error updating address: ' + error.message);
        this.loading = false;
      }
    });
  }

  cancelEditingAddress(): void {
    this.editingAddress = false;
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
          // If we removed the only address, clear the header display
          const remaining = (this.user.addresses || []).filter(a => a.id !== addressId);
          if (remaining.length === 0) {
            this.addressState.setAddressInfo(null);
          }
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