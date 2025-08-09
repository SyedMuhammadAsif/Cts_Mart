import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart-service';
import { Address } from '../../models/address';
import { Cart } from '../../models/cart-items';

@Component({
  selector: 'app-checkout-address',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout-address.html',
  styleUrl: './checkout-address.css'
})
export class CheckoutAddressComponent implements OnInit {
  cart: Cart = { items: [], totalItems: 0, totalPrice: 0 };
  
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

  states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  constructor(
    private router: Router,
    private cartService: CartService
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
  }

  onSubmit(form: NgForm): void {
    // Check if form is valid
    if (form.valid) {
      // Step 1: Store address in browser memory for next step
      sessionStorage.setItem('checkoutAddress', JSON.stringify(this.address));
      
      // Step 2: Navigate to payment step
      this.router.navigate(['/checkout/payment']);
    } else {
      // If form is invalid, show error messages
      this.markFormGroupTouched(form);
    }

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
