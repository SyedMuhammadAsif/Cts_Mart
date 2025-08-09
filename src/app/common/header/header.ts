import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ProductService } from '../../services/product-service';
import { CartService } from '../../services/cart-service';
import { UserProfile } from '../../pages/user-profile/user-profile';
import { UserAuth } from '../../services/user-auth';
import { AdminAuthService } from '../../services/admin-auth.service';
import { Admin, AdminLoginData } from '../../models/admin';
import { AddressStateService, AddressInfoState } from '../../services/address-state.service';
import { ManageProfileService } from '../../services/manage-profile.service';

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
  
  // Admin-related properties
  adminLoginData: AdminLoginData = {
    email: '',
    password: ''
  };
  currentAdmin: Admin | null = null;
  
  isSidebarOpen = false;
  wishlistCount = 2;
  categoryName: string = '';
  selectedCategory: any = null;
  isDataReceived: boolean = false;
  idArray: number[] = [];
  categories: any = [];

  // Address display state
  addressInfo: AddressInfoState | null = null;

  constructor(
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private auth: UserAuth,
    public adminAuth: AdminAuthService,
    private addressState: AddressStateService,
    private manageProfileService: ManageProfileService
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

    // Subscribe to admin authentication changes
    const adminSub = this.adminAuth.currentAdmin$.subscribe(admin => {
      this.currentAdmin = admin;
    });
    this.subscription.add(adminSub);

    // Subscribe to address changes
    const addrSub = this.addressState.addressInfo$.subscribe(info => {
      this.addressInfo = info;
    });
    this.subscription.add(addrSub);

    // Seed initial address if user is logged in and no address broadcast yet
    if (this.auth.isLoggedIn()) {
      this.manageProfileService.getUserProfile().subscribe({
        next: (user) => {
          const addr = (user.addresses && user.addresses.length > 0) ? user.addresses[0] : null;
          if (addr) {
            const info = { city: addr.city, postalCode: addr.postalCode } as AddressInfoState;
            this.addressState.setAddressInfo(info);
          } else {
            this.addressState.setAddressInfo(null);
          }
        },
        error: () => {
          this.addressState.setAddressInfo(null);
        }
      });
    }

    this.productService.getCategory().subscribe((res: { name: string; slug: string; }[]) => {
      this.categories = res;
      console.log(this.categories);
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  get addressDisplay(): string {
    if (this.addressInfo && this.addressInfo.city && this.addressInfo.postalCode) {
      return `${this.addressInfo.city}`;
    }
    return 'no address is provided by user';
  }

  get pincodeDisplay(): string {
    return this.addressInfo?.postalCode || '';
  }

  onSearch(): void {
    if (!this.searchQuery.trim()) {
      return;
    }

    this.productService.getProducts().subscribe(response => {
      const products = response.products || [];
      const searchTerm = this.searchQuery.toLowerCase();
      
      const matchingProducts = products.filter((product: any) => {
        // Search in product title
        if (product.title && product.title.toLowerCase().includes(searchTerm)) {
          return true;
        }
        
        // Search in product description
        if (product.description && product.description.toLowerCase().includes(searchTerm)) {
          return true;
        }
        
        // Search in product brand
        if (product.brand && product.brand.toLowerCase().includes(searchTerm)) {
          return true;
        }
        
        // Search in category
        if (product.category && product.category.toLowerCase().includes(searchTerm)) {
          return true;
        }
        
        // Search in tags
        if (product.tags && Array.isArray(product.tags)) {
          return product.tags.some((tag: string) => 
            tag.toLowerCase().includes(searchTerm)
          );
        }
        
        return false;
      });

      if (matchingProducts.length > 0) {
        // Pass the matching product IDs to the product service
        const productIds = matchingProducts.map((product: any) => product.id);
        this.productService.setSearchResults(productIds);
        
        // Navigate to search results page
        this.router.navigate(['/search'], { 
          queryParams: { q: this.searchQuery } 
        });
      } else {
        alert('No products found for: ' + this.searchQuery);
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

  // Admin authentication methods
  isAdminLoggedIn(): boolean {
    return this.adminAuth.isLoggedIn();
  }

  onAdminLogin(): void {
    if (!this.adminLoginData.email || !this.adminLoginData.password) {
      alert('Please enter both email and password');
      return;
    }

    this.adminAuth.login(this.adminLoginData).subscribe({
      next: (admin) => {
        console.log('Admin login successful:', admin);
        // Clear the form
        this.adminLoginData = { email: '', password: '' };
        // Navigate to admin dashboard
        this.router.navigate(['/admin/dashboard']);
      },
      error: (error) => {
        console.error('Admin login error:', error);
        alert('Invalid admin credentials. Please try again.');
      }
    });
  }

  onAdminLogout(): void {
    this.adminAuth.logout();
    this.router.navigate(['/']);
  }

  onAddressClick(): void {
    if (this.auth.isLoggedIn()) {
      // Navigate to manage-profile page with address section
      this.router.navigate(['/manage-profile'], { fragment: 'address' });
    } else {
      // Redirect to login page
      this.router.navigate(['/login']);
    }
  }
} 