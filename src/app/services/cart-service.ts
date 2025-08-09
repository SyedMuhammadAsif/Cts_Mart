import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { CartItem, Cart } from '../models/cart-items';
import { Product } from '../models/product';
import { ToastService } from './toast-service';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = 'http://localhost:3000';
  private cartSubject = new BehaviorSubject<Cart>({ items: [], totalItems: 0, totalPrice: 0 });

  public cart$ = this.cartSubject.asObservable();

  constructor(private http: HttpClient, private toastService: ToastService) {
    this.loadCart();
  }

  loadCart(): void {
    this.http.get<CartItem[]>(`${this.apiUrl}/cart`).pipe(
      switchMap(cartItems => {
        if (cartItems.length === 0) {
          return [cartItems];
        }

        // Get product details for each cart item
        const productRequests = cartItems.map(item =>
          this.http.get<Product>(`${this.apiUrl}/products/${item.ProductID}`)
        );

        return forkJoin(productRequests).pipe(
          map(products => {
            return cartItems.map((item, index) => ({
              ...item,
              Product: products[index]
            }));
          })
        );
      }),
      map(cartItemsWithProducts => this.calculateCartTotals(cartItemsWithProducts))
    ).subscribe({
      next: (cart) => this.cartSubject.next(cart),
      error: (error) => {
        console.error('Error loading cart:', error);
        this.cartSubject.next({ items: [], totalItems: 0, totalPrice: 0 });
      }
    });
  }

  // Helper: adjust product stock (delta can be negative to reduce, positive to add back)
  private adjustProductStock(productId: number, delta: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/products/${productId}`).pipe(
      switchMap((product) => {
        const current = Number(product.stock || 0);
        const next = current + delta;
        if (next < 0) {
          return of(product); // Do not allow negative stock; noop
        }
        return this.http.put<Product>(`${this.apiUrl}/products/${productId}`, {
          ...product,
          stock: next
        });
      })
    );
  }

  addToCart(productId: number, quantity: number = 1): Observable<any> {
    return this.http.get<Product>(`${this.apiUrl}/products/${productId}`).pipe(
      switchMap(product => {
        // Ensure there is enough stock for this add
        const available = Number(product.stock || 0);
        if (available < quantity) {
          throw new Error('Insufficient stock');
        }

        const currentCart = this.cartSubject.value;
        const existingItem = currentCart.items.find(item => item.ProductID === productId);

        if (existingItem) {
          // Update existing item
          const newQuantity = existingItem.Quantity + quantity;
          const newTotalPrice = (product.price || 0) * newQuantity;

          if (!existingItem.id) {
            throw new Error('Existing cart item missing ID');
          }

          return this.http.put<CartItem>(`${this.apiUrl}/cart/${existingItem.id}`, {
            ...existingItem,
            Quantity: newQuantity,
            TotalPrice: newTotalPrice
          }).pipe(
            switchMap(() => this.adjustProductStock(productId, -quantity))
          );
        } else {
          // Create new cart item
          const newCartItem: Omit<CartItem, 'id'> = {
            ProductID: productId,
            Quantity: quantity,
            TotalPrice: (product.price || 0) * quantity,
            CartItemID: Date.now() // Temporary ID, JSON-server will generate the real one
          };

          return this.http.post<CartItem>(`${this.apiUrl}/cart`, newCartItem).pipe(
            switchMap(() => this.adjustProductStock(productId, -quantity))
          );
        }
      }),
      tap(() => {
        this.loadCart();
        this.toastService.showSuccess('Item added to cart successfully!');
      })
    );
  }

  removeFromCart(cartItemId: string): Observable<any> {
    // Read the item first to know quantity and product id, then delete and give stock back
    return this.http.get<CartItem>(`${this.apiUrl}/cart/${cartItemId}`).pipe(
      switchMap((item) => {
        const qty = Number(item?.Quantity || 0);
        const productId = Number(item?.ProductID);
        return this.http.delete<void>(`${this.apiUrl}/cart/${cartItemId}`).pipe(
          switchMap(() => qty > 0 && productId ? this.adjustProductStock(productId, +qty) : of(null))
        );
      }),
      tap(() => {
        this.loadCart();
        this.toastService.showInfo('Item removed from cart');
      })
    );
  }

  updateQuantity(cartItemId: string, newQuantity: number): Observable<any> {
    const currentCart = this.cartSubject.value;
    const item = currentCart.items.find(item => item.id === cartItemId);

    if (!item) {
      throw new Error('Cart item not found');
    }

    if (newQuantity <= 0) {
      return this.removeFromCart(cartItemId);
    }

    const oldQuantity = Number(item.Quantity || 0);
    const delta = newQuantity - oldQuantity; // positive means increase → reduce stock; negative → add back

    return this.http.get<Product>(`${this.apiUrl}/products/${item.ProductID}`).pipe(
      switchMap((product) => {
        // If increasing, ensure stock is sufficient
        if (delta > 0 && Number(product.stock || 0) < delta) {
          throw new Error('Insufficient stock for requested quantity');
        }
        const newTotalPrice = (product.price || 0) * newQuantity;
        return this.http.put<CartItem>(`${this.apiUrl}/cart/${cartItemId}`, {
          ...item,
          Quantity: newQuantity,
          TotalPrice: newTotalPrice
        }).pipe(
          switchMap(() => delta !== 0 ? this.adjustProductStock(item.ProductID, -delta) : of(null))
        );
      }),
      tap(() => this.loadCart())
    );
  }

  clearCart(): Observable<any> {
    const currentCart = this.cartSubject.value;
    const items = (currentCart.items || []).filter(i => !!i && !!i.id);

    if (items.length === 0) {
      this.loadCart();
      return of(true);
    }

    const deletes = items.map(item => this.http.delete<void>(`${this.apiUrl}/cart/${item.id}`));

    return forkJoin(deletes).pipe(
      tap(() => {
        this.loadCart();
        this.toastService.showInfo('Cart cleared successfully');
      }),
      map(() => true),
      catchError(() => {
        // Even if some deletes fail, refresh the cart to reflect server state
        this.loadCart();
        return of(true);
      })
    );
  }

  getCurrentCart(): Cart {
    return this.cartSubject.value;
  }

  getCartItemCount(): Observable<number> {
    return this.cart$.pipe(
      map(cart => cart.items.length) // Return number of unique products instead of total quantity
    );
  }

  getCartTotal(): Observable<number> {
    return this.cart$.pipe(map(cart => cart.totalPrice));
  }

  private calculateCartTotals(items: CartItem[]): Cart {
    const totalItems = items.reduce((sum, item) => sum + item.Quantity, 0);
    const totalPrice = items.reduce((sum, item) => sum + item.TotalPrice, 0);

    return {
      items,
      totalItems,
      totalPrice: Number(totalPrice.toFixed(2))
    };
  }

  isProductInCart(productId: number): Observable<boolean> {
    return this.cart$.pipe(
      map(cart => cart.items.some(item => item.ProductID === productId))
    );
  }

  getProductQuantityInCart(productId: number): Observable<number> {
    return this.cart$.pipe(
      map(cart => {
        const item = cart.items.find(item => item.ProductID === productId);
        return item ? item.Quantity : 0;
      })
    );
  }
} 