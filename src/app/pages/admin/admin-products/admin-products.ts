import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AdminAuthService } from '../../../services/admin-auth.service';
import { EnvVariables } from '../../../env/env-variables';
import { AdminNavComponent } from '../../../components/admin-nav/admin-nav';

interface Product {
  id?: string;
  title: string;
  description: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  brand: string;
  category: string;
  thumbnail: string;
  images: string[];
  tags?: string[];
  sku?: string;
  weight?: number;
  dimensions?: {
    width: number;
    height: number;
    depth: number;
  };
  warrantyInformation?: string;
  shippingInformation?: string;
  availabilityStatus?: string;
  reviews?: any[];
}

interface ProductFilters {
  title: string;
  category: string;
  brand: string;
  availabilityStatus: string;
  minPrice: number | null;
  maxPrice: number | null;
  minStock: number | null;
  maxStock: number | null;
}

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, AdminNavComponent],
  templateUrl: './admin-products.html',
  styleUrls: ['./admin-products.css', '../admin-global.css']
})
export class AdminProductsComponent implements OnInit {
  // All products from database
  allProducts: Product[] = [];
  
  // Filtered and paginated products
  filteredProducts: Product[] = [];
  displayedProducts: Product[] = [];

  // Loading state
  isLoading = true;
  errorMessage = '';
  successMessage = '';

  // Form states
  showAddForm = false;
  showEditForm = false;
  showViewModal = false;
  selectedProduct: Product | null = null;

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;
  totalItems = 0;

  // Filters for each column
  filters: ProductFilters = {
    title: '',
    category: '',
    brand: '',
    availabilityStatus: '',
    minPrice: null,
    maxPrice: null,
    minStock: null,
    maxStock: null
  };
  
  // Unique values for dropdown filters
  categories: string[] = [];
  brands: string[] = [];
  availabilityStatuses: string[] = [];
  
  // Sorting
  sortField: keyof Product = 'title';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Product form
  productForm: FormGroup;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    public adminAuth: AdminAuthService,
    private router: Router
  ) {
    this.productForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      price: ['', [Validators.required, Validators.min(0)]],
      discountPercentage: ['', [Validators.min(0), Validators.max(100)]],
      rating: ['', [Validators.min(0), Validators.max(5)]],
      stock: ['', [Validators.required, Validators.min(0)]],
      brand: ['', [Validators.required]],
      category: ['', [Validators.required]],
      thumbnail: ['', [Validators.required]],
      images: [''],
      tags: [''],
      sku: ['', [Validators.required]],
      weight: ['', [Validators.min(0)]],
      warrantyInformation: [''],
      shippingInformation: [''],
      availabilityStatus: ['In Stock']
    });
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  /**
   * Load all products from the database
   */
  loadProducts(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.http.get<Product[]>(`${EnvVariables.apiBaseUrl}/products`).subscribe({
      next: (products) => {
        this.allProducts = products;
        this.extractFilterOptions();
        this.applyFilters();
        this.isLoading = false;
        console.log(`✅ Loaded ${products.length} products successfully`);
      },
      error: (error) => {
        console.error('❌ Error loading products:', error);
        this.errorMessage = 'Failed to load products';
        this.isLoading = false;
      }
    });
  }

  /**
   * Extract unique values for filter dropdowns
   */
  extractFilterOptions(): void {
    this.categories = [...new Set(this.allProducts.map(p => p.category))].sort();
    this.brands = [...new Set(this.allProducts.map(p => p.brand).filter((brand): brand is string => Boolean(brand)))].sort();
    this.availabilityStatuses = [...new Set(this.allProducts.map(p => p.availabilityStatus || 'In Stock'))].sort();
  }

  /**
   * Apply all filters to the product list
   */
  applyFilters(): void {
    this.filteredProducts = this.allProducts.filter(product => {
      // Text filters
      if (this.filters.title && !product.title.toLowerCase().includes(this.filters.title.toLowerCase())) {
        return false;
      }
      
      if (this.filters.category && product.category !== this.filters.category) {
        return false;
      }
      
      if (this.filters.brand && product.brand !== this.filters.brand) {
        return false;
      }
      
      if (this.filters.availabilityStatus && (product.availabilityStatus || 'In Stock') !== this.filters.availabilityStatus) {
        return false;
      }
      
      // Price range filters
      if (this.filters.minPrice !== null && product.price < this.filters.minPrice) {
        return false;
      }
      
      if (this.filters.maxPrice !== null && product.price > this.filters.maxPrice) {
        return false;
      }
      
      // Stock range filters
      if (this.filters.minStock !== null && product.stock < this.filters.minStock) {
        return false;
      }
      
      if (this.filters.maxStock !== null && product.stock > this.filters.maxStock) {
        return false;
      }
      
      return true;
    });
    
    // Apply sorting
    this.sortProducts();
    
    // Update pagination
    this.updatePagination();
  }

  /**
   * Sort products by specified field and direction
   */
  sortProducts(): void {
    this.filteredProducts.sort((a, b) => {
      const aValue = a[this.sortField];
      const bValue = b[this.sortField];
      
      let comparison = 0;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      }
      
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * Update pagination based on filtered results
   */
  updatePagination(): void {
    this.totalItems = this.filteredProducts.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    
    // Reset to first page if current page is out of range
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
    
    // Calculate displayed products for current page
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.displayedProducts = this.filteredProducts.slice(startIndex, endIndex);
  }

  /**
   * Change current page
   */
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  /**
   * Change items per page
   */
  changeItemsPerPage(items: number): void {
    this.itemsPerPage = items;
    this.currentPage = 1;
    this.updatePagination();
  }

  /**
   * Sort by column header click
   */
  sortBy(field: keyof Product): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.filters = {
      title: '',
      category: '',
      brand: '',
      availabilityStatus: '',
      minPrice: null,
      maxPrice: null,
      minStock: null,
      maxStock: null
    };
    this.applyFilters();
  }

  /**
   * Get sort arrow icon
   */
  getSortIcon(field: keyof Product): string {
    if (this.sortField !== field) return '↕️';
    return this.sortDirection === 'asc' ? '⬆️' : '⬇️';
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`;
  }

  /**
   * Get stock status badge class
   */
  getStockBadgeClass(stock: number): string {
    if (stock <= 0) return 'badge-danger';
    if (stock <= 10) return 'badge-warning';
    if (stock <= 50) return 'badge-info';
    return 'badge-success';
  }

  /**
   * Get availability status badge class
   */
  getAvailabilityBadgeClass(status: string | undefined): string {
    if (!status) return 'badge-secondary';
    
    switch (status.toLowerCase()) {
      case 'in stock': return 'badge-success';
      case 'low stock': return 'badge-warning';
      case 'out of stock': return 'badge-danger';
      default: return 'badge-secondary';
    }
  }

  /**
   * View product details
   */
  viewProduct(product: Product): void {
    this.selectedProduct = product;
    this.showViewModal = true;
  }

  /**
   * Close view modal
   */
  closeViewModal(): void {
    this.showViewModal = false;
    this.selectedProduct = null;
  }

  /**
   * Add new product
   */
  addProduct(): void {
    if (this.productForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    const productData = this.prepareProductData();

    this.http.post<Product>(`${EnvVariables.apiBaseUrl}/products`, productData).subscribe({
      next: (newProduct) => {
        this.allProducts.unshift(newProduct);
        this.applyFilters();
        this.successMessage = 'Product added successfully!';
        this.closeForms();
        this.isLoading = false;
        console.log('✅ Product added:', newProduct);
      },
      error: (error) => {
        console.error('❌ Error adding product:', error);
        this.errorMessage = 'Failed to add product';
        this.isLoading = false;
      }
    });
  }

  /**
   * Edit product
   */
  editProduct(): void {
    if (this.productForm.invalid || !this.selectedProduct?.id) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    const productData = this.prepareProductData();

    this.http.put<Product>(`${EnvVariables.apiBaseUrl}/products/${this.selectedProduct.id}`, productData).subscribe({
      next: (updatedProduct) => {
        const index = this.allProducts.findIndex(p => p.id === updatedProduct.id);
        if (index !== -1) {
          this.allProducts[index] = updatedProduct;
        }
        this.applyFilters();
        this.successMessage = 'Product updated successfully!';
        this.closeForms();
        this.isLoading = false;
        console.log('✅ Product updated:', updatedProduct);
      },
      error: (error) => {
        console.error('❌ Error updating product:', error);
        this.errorMessage = 'Failed to update product';
        this.isLoading = false;
      }
    });
  }

  /**
   * Delete product
   */
  deleteProduct(product: Product): void {
    if (!product.id || !confirm('Are you sure you want to delete this product?')) {
      return;
    }

    this.isLoading = true;
    this.http.delete(`${EnvVariables.apiBaseUrl}/products/${product.id}`).subscribe({
      next: () => {
        this.allProducts = this.allProducts.filter(p => p.id !== product.id);
        this.applyFilters();
        this.successMessage = 'Product deleted successfully!';
        this.isLoading = false;
        console.log('✅ Product deleted:', product.id);
      },
      error: (error) => {
        console.error('❌ Error deleting product:', error);
        this.errorMessage = 'Failed to delete product';
        this.isLoading = false;
      }
    });
  }

  /**
   * Prepare product data from form
   */
  private prepareProductData(): any {
    const formValue = this.productForm.value;
    
    // Convert tags string to array
    const tags = formValue.tags ? formValue.tags.split(',').map((tag: string) => tag.trim()) : [];
    
    // Convert images string to array
    const images = formValue.images ? formValue.images.split(',').map((img: string) => img.trim()) : [];

    return {
      ...formValue,
      tags,
      images,
      id: this.selectedProduct?.id || Date.now().toString()
    };
  }

  /**
   * Open add product form
   */
  openAddForm(): void {
    this.showAddForm = true;
    this.showEditForm = false;
    this.selectedProduct = null;
    this.productForm.reset({
      availabilityStatus: 'In Stock',
      discountPercentage: 0,
      rating: 0,
      stock: 0,
      price: 0
    });
  }

  /**
   * Open edit product form
   */
  openEditForm(product: Product): void {
    this.showEditForm = true;
    this.showAddForm = false;
    this.showViewModal = false;
    this.selectedProduct = product;
    
    // Convert arrays to strings for form
    const formData = {
      ...product,
      tags: product.tags ? product.tags.join(', ') : '',
      images: product.images ? product.images.join(', ') : ''
    };
    
    this.productForm.patchValue(formData);
  }

  /**
   * Close all forms
   */
  closeForms(): void {
    this.showAddForm = false;
    this.showEditForm = false;
    this.showViewModal = false;
    this.selectedProduct = null;
    this.productForm.reset();
    this.errorMessage = '';
    this.successMessage = '';
    
    // Ensure products are reloaded to refresh button states
    this.loadProducts();
  }

  /**
   * Mark all form controls as touched
   */
  private markFormGroupTouched(): void {
    Object.keys(this.productForm.controls).forEach(key => {
      const control = this.productForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Get field error message
   */
  getFieldError(fieldName: string): string {
    const field = this.productForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['minlength']) return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
      if (field.errors['min']) return `${fieldName} must be at least ${field.errors['min'].min}`;
      if (field.errors['max']) return `${fieldName} must be at most ${field.errors['max'].max}`;
    }
    return '';
  }

  /**
   * Admin logout
   */
  onAdminLogout(): void {
    this.adminAuth.logout();
    this.router.navigate(['/']);
  }

  /**
   * Track by function for ngFor optimization
   */
  trackByProductId(index: number, product: Product): string {
    return product.id || '';
  }

  /**
   * Expose Math for template usage
   */
  Math = Math;
} 