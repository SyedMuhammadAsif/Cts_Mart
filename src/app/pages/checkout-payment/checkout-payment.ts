import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CartService } from '../../services/cart-service';
import { ProductService } from '../../services/product-service';
import { ToastService } from '../../services/toast-service';
import { Address } from '../../models/address';
import { PaymentMethod, Order, OrderResponse, PaymentType } from '../../models/payment';
import { Cart } from '../../models/cart-items';

@Component({
  selector: 'app-checkout-payment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './checkout-payment.html',
  styleUrl: './checkout-payment.css'
})
export class CheckoutPaymentComponent implements OnInit {
  cart: Cart = { items: [], totalItems: 0, totalPrice: 0 };
  shippingAddress: Address | null = null;
  isProcessing = false;
  orderNum:string='';
  
  // Selected payment method type
  selectedPaymentType: PaymentType = 'card';
  
  // Simple reactive form - beginner friendly!
  paymentForm: any;
  
  payment: PaymentMethod = {
    type: 'card',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: '',
    upiId: ''
  };

  months = [
    '01', '02', '03', '04', '05', '06',
    '07', '08', '09', '10', '11', '12'
  ];

  years: string[] = [];

  constructor(
    private router: Router,
    private cartService: CartService,
    private productService: ProductService,
    private http: HttpClient,
    private toastService: ToastService,
    private ngZone: NgZone,
    private fb: FormBuilder
  ) {
    // Generate years (current year + 10 years)
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 11; i++) {
      this.years.push((currentYear + i).toString());
    }
  }

  ngOnInit(): void {
    // Create the simple form here - much easier for beginners!
    this.paymentForm = this.fb.group({
      cardholderName: [''],
      cardNumber: [''],
      expiryMonth: [''],
      expiryYear: [''],
      cvv: [''],
      upiId: ['']
    });

    // Load cart data
    this.cartService.cart$.subscribe(cart => {
      this.cart = cart;
      
      // If cart is empty, redirect to cart page
      if (cart.items.length === 0) {
        this.router.navigate(['/cart']);
        return;
      }
    });

    // Load shipping address from session storage
    const savedAddress = sessionStorage.getItem('checkoutAddress');
    if (!savedAddress) {
      // If no address, redirect back to address step
      this.router.navigate(['/checkout/address']);
      return;
    }
    
    this.shippingAddress = JSON.parse(savedAddress);
  }

  // Simple form submission - easy to understand!
  onSubmit(): void {
    if (!this.isProcessing) {
      // Get form values and put them in payment object
      const formValues = this.paymentForm.value;
      this.payment.cardholderName = formValues.cardholderName || '';
      this.payment.cardNumber = formValues.cardNumber || '';
      this.payment.expiryMonth = formValues.expiryMonth || '';
      this.payment.expiryYear = formValues.expiryYear || '';
      this.payment.cvv = formValues.cvv || '';
      this.payment.upiId = formValues.upiId || '';
      
      // Check if we have the required fields based on payment type
      let isValid = true;
      let errorMessage = '';
      
      if (this.selectedPaymentType === 'card') {
        if (!this.payment.cardholderName || !this.payment.cardNumber || 
            !this.payment.expiryMonth || !this.payment.expiryYear || !this.payment.cvv) {
          isValid = false;
          errorMessage = 'Please fill in all card details';
        }
      } else if (this.selectedPaymentType === 'upi') {
        if (!this.payment.upiId) {
          isValid = false;
          errorMessage = 'Please enter your UPI ID';
        } else if (!this.isValidUPI(this.payment.upiId)) {
          isValid = false;
          errorMessage = 'UPI ID must end with @gpay, @phonepe, or @paytm';
        }
      }
      // COD doesn't need any fields
      
      if (isValid) {
        this.checkStockAvailability().then(hasStock => {
          if (hasStock) {
            this.processPayment();
          } else {
            this.toastService.showError('Some items in your cart are out of stock. Please update your cart.');
          }
        });
      } else {
        alert(errorMessage);
      }
    }
  }

  // Simple UPI validator - beginner friendly!
  isValidUPI(upiId: string): boolean {
    if (!upiId) return false;
    
    // Convert to lowercase for checking
    const lowerUpiId = upiId.toLowerCase();
    
    // Check if it ends with any of the valid UPI providers
    return lowerUpiId.endsWith('@gpay') || 
           lowerUpiId.endsWith('@phonepe') || 
           lowerUpiId.endsWith('@paytm');
  }

  /**
   * Check if all items in the cart have sufficient stock
   * @returns Promise<boolean> - true if all items have enough stock, false otherwise
   */
  private checkStockAvailability(): Promise<boolean> {
    // Step 1: Create an array of promises to check stock for each cart item
    const stockCheckPromises = this.cart.items.map(cartItem => {
      // Get the current product details from the database
      return this.http.get<any>(`http://localhost:3000/products/${cartItem.ProductID}`).toPromise()
        .then(product => {
          // Return an object with stock information for this item
          return {
            productId: cartItem.ProductID,
            productName: product.title,
            requestedQuantity: cartItem.Quantity,
            availableStock: product.stock,
            hasEnoughStock: cartItem.Quantity <= product.stock
          };
        });
    });

    // Step 2: Wait for all stock checks to complete
    return Promise.all(stockCheckPromises).then(stockResults => {
      // Step 3: Find any item that doesn't have enough stock
      const itemWithInsufficientStock = stockResults.find(result => !result.hasEnoughStock);
      
      if (itemWithInsufficientStock) {
        // Log detailed information about the stock issue
        console.warn('Stock check failed:', {
          productId: itemWithInsufficientStock.productId,
          productName: itemWithInsufficientStock.productName,
          requested: itemWithInsufficientStock.requestedQuantity,
          available: itemWithInsufficientStock.availableStock
        });
        return false; // Not enough stock
      }
      
      return true; // All items have sufficient stock
    });
  }

  /**
   * Process the payment and complete the order
   * This method handles the entire payment flow
   */
  private processPayment(): void {
    // Show loading state to prevent multiple submissions
    this.isProcessing = true;

    // Step 1: Create the order object with all necessary information
    const order: Order = {
      orderNumber: this.generateOrderNumber(),
      customerInfo: {
        fullName: this.shippingAddress!.fullName,
        email: this.shippingAddress!.email,
        phone: this.shippingAddress!.phone
      },
      shippingAddress: this.shippingAddress!,
      items: this.cart.items,
      subtotal: this.cart.totalPrice,
      tax: this.cart.totalPrice * 0.08, // 8% tax rate
      shipping: 0, // Free shipping
      total: this.cart.totalPrice * 1.08, // Subtotal + tax
      paymentMethod: { ...this.payment },
      orderStatus: 'confirmed',
      // Set payment status based on payment method
      paymentStatus: this.payment.type === 'cod' ? 'pending' : 'completed',
      orderDate: new Date().toISOString(),
      estimatedDelivery: this.calculateDeliveryDate()
    };

   this.orderNum=order.orderNumber?order.orderNumber:'0';

    // Step 2: Simulate payment processing with a 2-second delay
    console.log(' Processing payment...');
    setTimeout(() => {
      console.log('⏰ Payment processing timeout completed');
      // Step 3: Save the order to the database
      this.saveOrder(order).then((orderResponse) => {
        console.log('💾 Save order response:', orderResponse);
        if (orderResponse.success) {
  
       
          console.log('✅ Payment successful, order saved');
          
          // Step 4: Show success toast message
          this.toastService.showSuccess('Payment successful! Your order has been placed.', 6000);
          
          // Step 5: Clean up session storage
          sessionStorage.removeItem('checkoutAddress');
          console.log('🧹 Session storage cleaned');
          
          // Step 6: Navigate to order tracking page with order number IMMEDIATELY
          console.log('🚀 About to navigate to order tracking with order number:', order.orderNumber);
          console.log('🚀 Navigation route will be:', ['/order-tracking', order.orderNumber]);
          
          // Use the dedicated Angular navigation method
          setTimeout(() => {
            this.navigateToOrderTracking(order.orderNumber!);
          }, 100);
          
          // Step 7: Clear the shopping cart (do this after navigation to prevent blocking)
          this.cartService.clearCart().subscribe({
            next: () => {
              console.log(' Cart cleared successfully');
            },
            error: (error) => {
              console.error(' Error clearing cart:', error);
              // Navigation already happened, so this won't block the user
            }
          });
           
        } else {
          // Payment failed - show error message
          console.error(' Payment failed:', orderResponse.message);
          this.toastService.showError('Payment failed. Please try again.');
        }
        
        // Always hide the loading state
        this.isProcessing = false;
      }).catch((error) => {
        // Handle any errors during payment processing
        console.error(' Payment processing error:', error);
        this.toastService.showError('Payment failed. Please try again.');
        this.isProcessing = false;
      });
    }, 2000); // 2-second delay to simulate payment processing
  }

  /**
   * Save the order to the database and update product stock
   * @param order - The order object to save
   * @returns Promise<OrderResponse> - Success/failure response
   */
  private saveOrder(order: Order): Promise<OrderResponse> {
    // Send the order to the database
    return this.http.post<Order>('http://localhost:3000/orders', order).toPromise()
      .then((response) => {
        console.log('✅ Order saved successfully:', response?.orderNumber);
        
        // Update stock levels for all products in this order
        this.updateProductStock(order.items);
        
        // Return success response
        return {
          success: true,
          order: response,
          trackingNumber: response?.orderNumber
        };
      })
      .catch((error) => {
        // Handle any errors when saving the order
        console.error('❌ Error saving order:', error);
        return {
          success: false,
          message: 'Failed to save order'
        };
      });
  }

  /**
   * Update the stock levels for all products in the order
   * @param items - Array of cart items that were purchased
   */
  private updateProductStock(items: any[]): void {
    // Process each item in the order
    items.forEach(cartItem => {
      // Step 1: Get the current product information from the database
      this.http.get<any>(`http://localhost:3000/products/${cartItem.ProductID}`).subscribe({
        next: (product) => {
          // Step 2: Calculate the new stock level
          const currentStock = product.stock;
          const orderedQuantity = cartItem.Quantity;
          const newStock = Math.max(0, currentStock - orderedQuantity); // Prevent negative stock
          
          // Step 3: Determine the new availability status
          let newAvailabilityStatus: string;
          if (newStock === 0) {
            newAvailabilityStatus = 'Out of Stock';
          } else if (newStock <= 10) {
            newAvailabilityStatus = 'Low Stock';
          } else {
            newAvailabilityStatus = 'In Stock';
          }
          
          // Step 4: Update the product in the database
          const updateData = {
            stock: newStock,
            availabilityStatus: newAvailabilityStatus
          };
          
          this.http.patch<any>(`http://localhost:3000/products/${cartItem.ProductID}`, updateData).subscribe({
            next: () => {
              console.log(`✅ Stock updated successfully:`, {
                productId: cartItem.ProductID,
                productName: product.title,
                oldStock: currentStock,
                newStock: newStock,
                quantityOrdered: orderedQuantity,
                newStatus: newAvailabilityStatus
              });
            },
            error: (error) => {
              console.error(`❌ Error updating stock for product ${cartItem.ProductID}:`, error);
            }
          });
        },
        error: (error) => {
          console.error(`❌ Error fetching product ${cartItem.ProductID} for stock update:`, error);
        }
      });
    });
  }

  /**
   * Generate a unique order number
   * @returns string - A unique order number in format ORD-timestamp-random
   */
  private generateOrderNumber(): string {
    const timestamp = Date.now(); // Current timestamp
    const random = Math.floor(Math.random() * 1000); // Random number 0-999
    return `ORD-${timestamp}-${random}`; // Format: ORD-1234567890-123
  }

  /**
   * Calculate the estimated delivery date (5 business days from now)
   * @returns string - Delivery date in YYYY-MM-DD format
   */
  private calculateDeliveryDate(): string {
    const deliveryDate = new Date(); // Start with today
    deliveryDate.setDate(deliveryDate.getDate() + 5); // Add 5 days
    return deliveryDate.toISOString().split('T')[0]; // Return date part only (YYYY-MM-DD)
  }

  // Simple payment method change - easy to understand!
  onPaymentTypeChange(type: PaymentType): void {
    this.selectedPaymentType = type;
    this.payment.type = type;
    
    // Clear all form fields when switching
    this.paymentForm.patchValue({
      cardholderName: '',
      cardNumber: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: '',
      upiId: ''
    });
    
    // Clear payment object too
    this.payment.cardNumber = '';
    this.payment.expiryMonth = '';
    this.payment.expiryYear = '';
    this.payment.cvv = '';
    this.payment.cardholderName = '';
    this.payment.upiId = '';
  }

  // Angular-way navigation to order tracking
  private navigateToOrderTracking(orderNumber: string): void {
    console.log('🚀 Starting Angular navigation to order tracking');
    
    this.ngZone.run(() => {
      // Method 1: Try navigateByUrl with explicit options
      this.router.navigateByUrl(`/order-tracking/${orderNumber}`, {
        skipLocationChange: false,
        replaceUrl: false
      }).then((success) => {
        if (success) {
          console.log('✅ Navigation successful via navigateByUrl');
          return Promise.resolve(true);
        } else {
          console.log('⚠️ navigateByUrl returned false, trying navigate method');
          // Method 2: Fallback to navigate with array
          return this.router.navigate(['/order-tracking', orderNumber]);
        }
      }).catch((error) => {
        console.error('❌ navigateByUrl failed:', error);
        // Method 3: Final fallback
        this.router.navigate(['/order-tracking', orderNumber]).then((success) => {
          console.log('🔄 Fallback navigation result:', success);
        });
      });
    });
  }

  // Simple card number formatting
  formatCardNumber(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    this.paymentForm.patchValue({ cardNumber: value });
  }

  // Simple CVV formatting  
  formatCVV(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    value = value.substring(0, 4); // Max 4 digits
    this.paymentForm.patchValue({ cvv: value });
  }

  goBackToAddress(): void {
    this.router.navigate(['/checkout/address']);
  }

  formatPrice(price: number): string {
    return `$${price.toFixed(2)}`;
  }

} 
