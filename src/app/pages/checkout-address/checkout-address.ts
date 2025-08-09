import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart-service';
import { Address } from '../../models/address';
import { Cart } from '../../models/cart-items';
import { ManageProfileService } from '../../services/manage-profile.service';
import { UserAddress, User } from '../../models/user';

@Component({
  selector: 'app-checkout-address',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout-address.html',
  styleUrl: './checkout-address.css'
})
export class CheckoutAddressComponent implements OnInit {
  cart: Cart = { items: [], totalItems: 0, totalPrice: 0 };
  
  // Address being entered for "new address" flow
  address: Address = {
    fullName: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'USA',
    isDefault: false
  };

  // Saved addresses
  userAddresses: UserAddress[] = [];
  selectedAddressId: string | 'new' | '' = '';
  useNewAddress = false;
  currentUserEmail: string = '';

  states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  constructor(
    private router: Router,
    private cartService: CartService,
    private manageProfileService: ManageProfileService
  ) {}

  ngOnInit(): void {
    // Load cart data when component starts
    this.cartService.cart$.subscribe(cart => {
      this.cart = cart;
      
      // If cart is empty, redirect to cart page
      if (cart.items.length === 0) {
        this.router.navigate(['/cart']);
      }
    });

    // Load user saved addresses
    this.manageProfileService.getUserProfile().subscribe({
      next: (user: User) => {
        this.currentUserEmail = user.email;
        this.userAddresses = user.addresses || [];
        if (this.userAddresses.length > 0) {
          // Default to first saved address
          this.selectedAddressId = this.userAddresses[0].id || '';
          this.useNewAddress = false;
        } else {
          // No saved addresses → show new address form
          this.selectedAddressId = 'new';
          this.useNewAddress = true;
          this.address.email = this.currentUserEmail;
        }
      },
      error: () => {
        // Fallback to new address form if profile fails (shouldn't happen due to guard)
        this.selectedAddressId = 'new';
        this.useNewAddress = true;
      }
    });
  }

  onAddressChoiceChange(value: string): void {
    if (value === 'new') {
      this.useNewAddress = true;
      this.selectedAddressId = 'new';
      // Prefill email for convenience
      this.address.email = this.currentUserEmail;
    } else {
      this.useNewAddress = false;
      this.selectedAddressId = value;
    }
  }

  onSubmit(form: NgForm): void {
    // This submit is only for new address flow
    if (!this.useNewAddress) {
      return;
    }

    if (form.valid) {
      // Map "Address" to "UserAddress" for saving
      const toSave: UserAddress = {
        fullName: this.address.fullName,
        addressLine1: this.address.addressLine1,
        addressLine2: this.address.addressLine2,
        city: this.address.city,
        state: this.address.state,
        postalCode: this.address.postalCode,
        country: this.address.country,
        phone: this.address.phone,
        isDefault: this.address.isDefault
      };

      this.manageProfileService.updateAddress(toSave).subscribe({
        next: (user) => {
          // Use newly saved address for checkout
          const latest = (user.addresses || []).slice(-1)[0];
          const addressForCheckout: Address = {
            ...this.address,
            email: this.currentUserEmail
          };
          // Persist for payment step
          sessionStorage.setItem('checkoutAddress', JSON.stringify(addressForCheckout));
          this.router.navigate(['/checkout/payment']);
        },
        error: () => {
          // Even if saving to profile fails, allow proceeding with entered address
          const addressForCheckout: Address = { ...this.address, email: this.currentUserEmail };
          sessionStorage.setItem('checkoutAddress', JSON.stringify(addressForCheckout));
          this.router.navigate(['/checkout/payment']);
        }
      });
    } else {
      // If form is invalid, show error messages
      this.markFormGroupTouched(form);
    }
  }

  useSelectedAddress(): void {
    if (!this.selectedAddressId || this.selectedAddressId === 'new') {
      return;
    }
    const found = this.userAddresses.find(a => a.id === this.selectedAddressId);
    if (!found) return;

    const addressForCheckout: Address = {
      fullName: found.fullName,
      email: this.currentUserEmail,
      phone: found.phone,
      addressLine1: found.addressLine1,
      addressLine2: found.addressLine2 || '',
      city: found.city,
      state: found.state,
      postalCode: found.postalCode,
      country: found.country,
      isDefault: !!found.isDefault
    };

    sessionStorage.setItem('checkoutAddress', JSON.stringify(addressForCheckout));
    this.router.navigate(['/checkout/payment']);
  }

  private markFormGroupTouched(form: NgForm): void {
    Object.keys(form.controls).forEach(key => {
      form.controls[key].markAsTouched();
    });
  }

  goBackToCart(): void {
    this.router.navigate(['/cart']);
  }

  formatPrice(price: number): string {
    return `$${price.toFixed(2)}`;
  }

  // Format phone number to only allow digits
  formatPhoneNumber(event: any): void {
    let value = event.target.value.replace(/\D/g, ''); // Remove non-digits
    value = value.substring(0, 10); // Limit to 10 digits
    this.address.phone = value;
    event.target.value = value;
  }

  // Format ZIP code to only allow digits
  formatZipCode(event: any): void {
    let value = event.target.value.replace(/\D/g, ''); // Remove non-digits
    value = value.substring(0, 6); // Limit to 6 digits
    this.address.postalCode = value;
    event.target.value = value;
  }
} 
