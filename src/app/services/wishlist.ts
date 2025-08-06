import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WishlistItems } from '../models/wishlist-items';
import { map } from 'rxjs/operators';
import { EnvVariables } from '../env/env-variables';

@Injectable({
  providedIn: 'root'
})
export class Wishlist {

  private baseUrl = `${EnvVariables.apiBaseUrl}/wishlist`;

  constructor(private http : HttpClient){ }


  getWishlistItems() : Observable<WishlistItems[]>{
    return this.http.get<WishlistItems[]>(this.baseUrl).pipe(
      map((items: WishlistItems[]) => 
        items.map(item => ({
          ...item,
          productId: Number(item.productId) // Ensure productId is always a number
        }))
      )
    );
  }

  // Check if a product is already in the wishlist
  isProductInWishlist(productId: number): Observable<boolean> {
    return this.getWishlistItems().pipe(
      map((items: WishlistItems[]) => 
        items.some(item => Number(item.productId) === Number(productId))
      )
    );
  }

  // Get a specific wishlist item by product ID
  getWishlistItemByProductId(productId: number): Observable<WishlistItems | undefined> {
    return this.getWishlistItems().pipe(
      map((items: WishlistItems[]) => 
        items.find(item => Number(item.productId) === Number(productId))
      )
    );
  }

  addWishlistItems(pId:number) : Observable<WishlistItems>{
    
    const wishlistItem = {
      productId: Number(pId), // Explicitly convert to number using Number()
      addedAt: new Date().toISOString()
    };
    
    console.log('Adding to wishlist - Original pId:', pId, 'type:', typeof pId);
    console.log('Adding to wishlist - Final wishlistItem:', wishlistItem);
    console.log('Adding to wishlist - productId type:', typeof wishlistItem.productId);
    console.log('Adding to wishlist - JSON.stringify result:', JSON.stringify(wishlistItem));
    
    return this.http.post<WishlistItems>(this.baseUrl, wishlistItem).pipe(
      map(response => {
        console.log('Wishlist response received:', response);
        console.log('Response productId type:', typeof response.productId);
        // Ensure the response productId is a number
        return {
          ...response,
          productId: Number(response.productId)
        };
      })
    );
  }
  
  removeFromWishlist(itemId:string) : Observable<any>{ 
    console.log('removed from wishlist',itemId);
    return this.http.delete(`${this.baseUrl}/${itemId}`)
  }
  
}