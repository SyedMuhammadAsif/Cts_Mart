import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ProductService } from '../../services/product-service';
import { CartService } from '../../services/cart-service';
import { UserProfile } from '../../pages/user-profile/user-profile';
import { UserAuth } from '../../services/user-auth';

@Component({
  selector: 'app-header',
  imports: [RouterLink, CommonModule, FormsModule, UserProfile],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header implements OnInit, OnDestroy {
  searchQuery: string = '';
  cartCount: number = 0;
  private subscription = new Subscription();
  
  isSidebarOpen = false;
  wishlistCount = 2;
  categoryName: string = '';
  selectedCategory: any = null;
  isDataReceived: boolean = false;
  idArray: number[] = [];
  categories: any = [];

  constructor(
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private auth: UserAuth
  ) {}

  ngOnInit(): void {
    const cartSub = this.cartService.getCartItemCount().subscribe({
      next: (count) => {
        this.cartCount = count;
      },
      error: (error) => {
        console.error('Error getting cart count:', error);
      }
    });
    this.subscription.add(cartSub);

    this.productService.getCategory().subscribe(res => {
      this.categories = res;
      console.log(this.categories);
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onSearch(): void {
    if (!this.searchQuery.trim()) {
      return;
    }

    this.productService.getProducts().subscribe(response => {
      const products = response.products || [];
      const searchTerm = this.searchQuery.toLowerCase();
      
      const matchingProducts = products.filter((product: any) => {
        if (product.category && product.category.toLowerCase().includes(searchTerm)) {
          return true;
        }
        
        if (product.tags && Array.isArray(product.tags)) {
          return product.tags.some((tag: string) => 
            tag.toLowerCase().includes(searchTerm)
          );
        }
        
        return false;
      });

      if (matchingProducts.length > 0) {
        const firstProduct = matchingProducts[0];
        if (firstProduct.category) {
          this.router.navigate(['/category', firstProduct.category]);
        } else {
          alert('Product found but no category available');
        }
      } else {
        alert('No products found with tag or category: ' + this.searchQuery);
      }
    });
  }

  onSearchSubmit(event: Event): void {
    event.preventDefault();
    this.onSearch();
  }

  toggleSidebar(): void {
    this.isSidebarOpen = true;
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
    this.selectedCategory = null;
  }

  onClick(cate: string): void {
    this.productService.getCategoryProducts(cate).subscribe(res => {
      this.categoryName = cate;
      this.selectedCategory = res;

      if (this.selectedCategory && this.selectedCategory.products) {
        for (let product of this.selectedCategory.products) {
          if (product.id) {
            this.idArray.push(product.id);
          }
        }
      }
      console.log(this.selectedCategory);
      console.log(this.idArray);
      this.selectedCategory = null;

      if (this.idArray) {
        this.productService.updateIDArray(this.idArray);
      }
      this.closeSidebar();
      this.router.navigate(['category', this.categoryName]);
    });
  }
  isLoggedIn() {
    return this.auth.isLoggedIn();
  }
} 