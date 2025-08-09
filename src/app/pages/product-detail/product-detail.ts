import { Component, ElementRef, ViewChild } from '@angular/core';
import { ProductDetailService } from '../../services/product-detail-service';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Product } from '../../models/product';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { SimilarProducts } from '../similar-products/similar-products';
import { Wishlist } from '../../services/wishlist';
import { WishlistItems } from '../../models/wishlist-items';
import { CartService } from '../../services/cart-service';
declare var bootstrap: any;

@Component({
  selector: 'app-product-detail',
  imports: [CommonModule,RouterModule,SimilarProducts],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css'
})
export class ProductDetail {
   product: Product | null =null ;
 selectedImage: string | undefined;
 loading = true;
 quantityAdded:number=0;
 isInWishlist: boolean = false;
 wishlistItem: WishlistItems | undefined;
   constructor(
    private productService: ProductDetailService, 
    private route: ActivatedRoute, 
    private wishlist: Wishlist,
    private cartService: CartService
  ) {}


ngOnInit(): void {
  
    this.route.paramMap.subscribe(params => {
      const productId = Number(params.get('id')); // Getting the ID from route
      console.log('Attempting to load product with ID:', productId);
      window.scrollTo({top:0,behavior:'smooth'});
      if (productId) {
        this.loadProduct(productId);
      } else {
        this.loading = false;
        console.error('No product ID provided in route.');
        
      }
    });
    
  }

  loadProduct(id: number): void {
    this.loading = true; 
    this.productService.getProductById(id).subscribe({
      next: data => {
        this.product = data; 
        this.selectedImage = data.images?.[0]; 
        this.quantityAdded = 0; 
        this.loading = false; 
        console.log('Product loaded:', this.product);
        console.log('Product loaded successfully (hardcoded ID):', this.product);
      
      console.log('Passing category to similar products:', this.product.category);
      console.log('Passing product ID to exclude:', this.product.id);
      
      // Check if this product is in the wishlist
      this.checkWishlistStatus(this.product.id);
      },
      error: err => {
        console.error('Error loading product:', err);
        this.product = null; 
        this.loading = false; 
        
      }
    });
  }

  // Check if the current product is in the wishlist
  checkWishlistStatus(productId: number): void {
    this.wishlist.isProductInWishlist(productId).subscribe({
      next: (inWishlist) => {
        this.isInWishlist = inWishlist;
        console.log(`Product ${productId} is ${inWishlist ? 'in' : 'not in'} wishlist`);
        
        // If it's in wishlist, get the wishlist item details
        if (inWishlist) {
          this.wishlist.getWishlistItemByProductId(productId).subscribe({
            next: (item) => {
              this.wishlistItem = item;
            }
          });
        }
      },
      error: (err) => {
        console.error('Error checking wishlist status:', err);
      }
    });
  }

  selectImage(img: string): void {
    this.selectedImage = img;
  }

  @ViewChild('toastElem', { static: false }) toastElem!: ElementRef;

  showToast(): void {
    
    if (this.toastElem) {
      const toast = new bootstrap.Toast(this.toastElem.nativeElement);
      toast.show();
    }
  }

    addToCart(): void {
     if (this.product && this.quantityAdded === 0 && this.product.stock > 0) {
       this.cartService.addToCart(this.product.id, 1).subscribe({
         next: () => {
           this.quantityAdded = 1;
           // Decrease local stock so bindings like "Only X left" update immediately
           if (this.product) { this.product.stock = Math.max(0, (this.product.stock || 0) - 1); }
           this.showToast(); // Call showToast when item is added to cart
           console.log('Product added to cart successfully');
         },
         error: (error) => {
           console.error('Error adding to cart:', error);
           alert('Failed to add to cart. Please try again.');
         }
       });
     }
   }

    increaseQty(): void {
     if (this.product && this.quantityAdded < this.product.stock + this.quantityAdded) {
       this.cartService.addToCart(this.product.id, 1).subscribe({
         next: () => {
           this.quantityAdded++;
           if (this.product) { this.product.stock = Math.max(0, (this.product.stock || 0) - 1); }
           console.log('Quantity increased in cart');
         },
         error: (error) => {
           console.error('Error updating cart:', error);
         }
       });
     }
   }

   decreaseQty(): void {
     if (this.product) { 
       if (this.quantityAdded > 1) {
         // Find the cart item and update quantity
         this.cartService.cart$.subscribe(cart => {
           const cartItem = cart.items.find(item => item.ProductID === this.product!.id);
           if (cartItem && cartItem.id) {
             this.cartService.updateQuantity(cartItem.id, this.quantityAdded - 1).subscribe({
               next: () => {
                 this.quantityAdded--;
                 if (this.product) { this.product.stock = (this.product.stock || 0) + 1; }
                 console.log('Quantity decreased in cart');
               },
               error: (error) => {
                 console.error('Error updating cart:', error);
               }
             });
           }
         }).unsubscribe();
       } else {
         // Remove from cart
         const qtyToReturn = this.quantityAdded;
         this.cartService.cart$.subscribe(cart => {
           const cartItem = cart.items.find(item => item.ProductID === this.product!.id);
           if (cartItem && cartItem.id) {
             this.cartService.removeFromCart(cartItem.id).subscribe({
               next: () => {
                 this.quantityAdded = 0;
                 if (this.product) { this.product.stock = (this.product.stock || 0) + qtyToReturn; }
                 console.log('Item removed from cart');
               },
               error: (error) => {
                 console.error('Error removing from cart:', error);
               }
             });
           }
         }).unsubscribe();
       }
     }
   }


  //handling wishlist toggle
  toggleWishlist(): void {
    if (!this.product) return;

    if (this.isInWishlist) {
      // Remove from wishlist
      if (this.wishlistItem) {
        this.wishlist.removeFromWishlist(this.wishlistItem.id).subscribe({
          next: () => {
            console.log('Removed from wishlist');
            this.isInWishlist = false;
            this.wishlistItem = undefined;
            alert('Removed from wishlist');
          },
          error: (error) => {
            console.log('Failed to remove from wishlist', error);
            alert('Failed to remove from wishlist');
          }
        });
      }
    } else {
      // Add to wishlist
      console.log('type of id sent in product-detail to wishlist : ',typeof this.product.id);
      this.wishlist.addWishlistItems(this.product.id).subscribe({
        next: (response) => {
          console.log('Added to wishlist', response);
          console.log('type of response : ',typeof response.productId);
          this.isInWishlist = true;
          this.wishlistItem = response;
          alert('Added to wishlist');
        },
        error: (error) => {
          console.log('Failed to add', error);
          alert('Failed to add to wishlist');
        }
      });
    }
  }

  // Keeping the old method for backwards compatibility (you can remove this if not needed)
  addWishlistItems() : void{
    this.toggleWishlist();
  }


}