import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CartService } from '../../services/cart-service';
import { Cart as CartModel, CartItem } from '../../models/cart-items';

@Component({
  selector: 'app-cart',
  imports: [CommonModule, FormsModule],
  templateUrl: './cart.html',
  styleUrl: './cart.css'
})
export class CartComponent implements OnInit, OnDestroy {
  cart: CartModel = { items: [], totalItems: 0, totalPrice: 0 };
  private subscription = new Subscription();

  constructor(
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to cart updates
    const cartSub = this.cartService.cart$.subscribe({
      next: (cart) => {
        this.cart = cart;
        console.log('Cart updated:', cart);
      },
      error: (error) => {
        console.error('Error loading cart:', error);
      }
    });
    this.subscription.add(cartSub);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  // Update item quantity in cart
  updateQuantity(item: CartItem, newQuantity: number): void {
    // If quantity is less than 1, remove the item
    if (newQuantity < 1) {
      this.removeItem(item);
      return;
    }

    // Check if item has an ID (required for database update)
    if (!item.id) {
      console.error('Cart item missing ID');
      alert('Error: Cart item missing ID. Please refresh the page.');
      return;
    }

    // Update quantity in database
    this.cartService.updateQuantity(item.id, newQuantity).subscribe({
      next: () => {
        console.log('Quantity updated successfully');
      },
      error: (error) => {
        console.error('Error updating quantity:', error);
        alert('Failed to update quantity. Please try again.');
      }
    });
  }

  // Remove item from cart
  removeItem(item: CartItem): void {
    // Check if item has an ID (required for database update)
    if (!item.id) {
      console.error('Cart item missing ID');
      alert('Error: Cart item missing ID. Please refresh the page.');
      return;
    }

    // Ask user for confirmation before removing
    if (confirm('Are you sure you want to remove this item from cart?')) {
      // Remove item from database
      this.cartService.removeFromCart(item.id).subscribe({
        next: () => {
          console.log('Item removed successfully');
        },
        error: (error) => {
          console.error('Error removing item:', error);
          alert('Failed to remove item. Please try again.');
        }
      });
    }
  }

  // Clear entire cart
  clearCart(): void {
    if (confirm('Are you sure you want to clear the entire cart?')) {
      this.cartService.clearCart().subscribe({
        next: () => {
          console.log('Cart cleared successfully');
        },
        error: (error) => {
          console.error('Error clearing cart:', error);
          alert('Failed to clear cart. Please try again.');
        }
      });
    }
  }

  // Continue shopping
  continueShopping(): void {
    this.router.navigate(['/']);
  }

  // Proceed to checkout
  proceedToCheckout(): void {
    if (this.cart.items.length === 0) {
      alert('Your cart is empty. Please add some items before checkout.');
      return;
    }
    
    // Navigate to checkout/address page (to be created later)
    this.router.navigate(['/checkout/address']);
  }

  // Go to order tracking
  goToOrderTracking(): void {
    // Navigate to order history page
    this.router.navigate(['/orders']);
  }

  // Increment quantity
  incrementQuantity(item: CartItem): void {
    const newQuantity = item.Quantity + 1;
    this.updateQuantity(item, newQuantity);
  }

  // Decrement quantity
  decrementQuantity(item: CartItem): void {
    const newQuantity = item.Quantity - 1;
    this.updateQuantity(item, newQuantity);
  }

  // Get product image or fallback
  getProductImage(item: CartItem): string {
    return item.Product?.images?.[0] || 'assets/placeholder.jpg';
  }

  // Format price
  formatPrice(price: number): string {
    return `$${price.toFixed(2)}`;
  }
} 