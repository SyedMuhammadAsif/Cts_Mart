import { Component, OnInit } from '@angular/core';
import { ProductDetailService } from '../../services/product-detail-service';
import { Wishlist } from '../../services/wishlist';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-wish-list',
  imports: [CommonModule,RouterModule],
  templateUrl: './wish-list.html',
  styleUrl: './wish-list.css'
})
export class WishList implements OnInit{
  wishlistItems: any[] =[];
  loading : boolean =true;
  
  constructor( private productService : ProductDetailService, private wishlist : Wishlist){}

  ngOnInit(): void{
    this.loadWishlist();
  }

  loadWishlist(): void{

    this.loading=true;

    this.wishlist.getWishlistItems().subscribe(
      wishlistItems=>{
        console.log('wish list items :',wishlistItems);
        if(wishlistItems.length ===0){
          this.wishlistItems =[];
          this.loading=false;
          return;
        }

        let completedRequests =0;
        this.wishlistItems=[];

        wishlistItems.forEach(item =>
        {
          const productId= Number(item.productId);

          this.productService.getProductById(productId).subscribe(
            product =>{
              this.wishlistItems.push({
                  ...item,
                  product:product
                });

                completedRequests++;

                if(completedRequests === wishlistItems.length){
                  this.loading=false;
                  console.log('the wish list items are', this.wishlistItems)
                }
            },
            error =>{
              console.error('error loading poducts',error);
              completedRequests++;
              if(completedRequests === wishlistItems.length){
                this.loading=false;
              }
            }
          );

        }
        );

      },
      error=> {
        console.error('error loading wishlists',error);
        this.loading= false;
      }

    );

  }



  deleteFromWishlist(itemId:string) : void{
    if(confirm('Do you want to remove this product from Wishlist?')){
      this.wishlist.removeFromWishlist(itemId).subscribe(
        res => {
          console.log('Removed from wishlist',res);
          alert('Item Removed');
          this.loadWishlist();
        },
        error=>{
          console.error('Cannot remove the item',error);
          alert('cannot remove item');
        }

      )
    }

  }
}