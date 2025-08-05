import { ChangeDetectionStrategy, Component, OnInit, TrackByFunction } from '@angular/core';
import { CommonModule, ViewportScroller } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductService } from '../../services/product-service';
import { Product } from '../../models/product';

@Component({
  selector: 'app-product-list',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
  changeDetection: ChangeDetectionStrategy.Default
})
export class ProductList implements OnInit {
  // Product data
  allProducts: Product[] = [];
  filteredProducts: Product[] = [];
  displayedProducts: Product[] = [];
  
  // Filter options
  availableBrands: string[] = [];
  selectedBrands: string[] = [];
  inStockOnly: boolean = false;
  minRating: number = 0;
  minPrice: number = 0;
  maxPrice: number = 10000;
  
  // Filter state management - Angular way for proper data binding
  tempSelectedBrands: Set<string> = new Set();
  tempInStockOnly: boolean = false;
  tempMinRating: number = 0;
  tempMinPrice: number = 0;
  tempMaxPrice: number = 10000;
  
  // Sort options
  sortBy: string = '';
  sortOrder: string = 'asc';
  sortOptions = [
    { value: '', label: 'No Sorting' },
    { value: 'price', label: 'Price' },
    { value: 'rating', label: 'Rating' },
    { value: 'title', label: 'Name' }
  ];
  
  // Optimized pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0;
  
  // Chunked loading optimization
  private readonly CHUNK_SIZE = 50;
  private loadedChunks: Set<number> = new Set();
  private productCache: Map<number, Product[]> = new Map();
  
  // Loading states
  loading: boolean = false;
  loadingMore: boolean = false;
  selectedCategory: string = '';
  categoryDisplayName: string = '';
  
  // TrackBy functions for performance
  trackByProduct: TrackByFunction<Product> = (index: number, item: Product) => item.id || index;
  trackByBrand: TrackByFunction<string> = (index: number, item: string) => item;

  constructor(
    private productService: ProductService, 
    private route: ActivatedRoute,
    private viewPortScroller: ViewportScroller
  ) {}

  ngOnInit(): void {
    // Get category from route params or service
    this.route.params.subscribe(params => {
      if (params['categoryName']) {
        this.selectedCategory = params['categoryName'];
        this.categoryDisplayName = this.formatCategoryName(params['categoryName']);
        this.loadCategoryProducts(this.selectedCategory);
      } else {
        // Fallback to service subscription for IDs
        this.productService.idArrayFinal.subscribe(ids => {
          if (ids && ids.length > 0) {
            this.categoryDisplayName = 'Selected Products';
            this.loadProductsByIds(ids);
          }
        });
      }
    this.viewPortScroller.scrollToPosition([0, 0]);
    });
  }

  formatCategoryName(category: string): string {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  loadCategoryProducts(category: string): void {
    this.loading = true;
    this.clearCache();
    
    this.productService.getCategoryProducts(category).subscribe({
      next: (response: any) => {
        const products = response.products || [];
        this.processProductsInChunks(products);
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.loading = false;
      }
    });
  }

  private processProductsInChunks(products: Product[]): void {
    // Load first chunk immediately for instant display
    const firstChunk = products.slice(0, this.CHUNK_SIZE);
    this.allProducts = firstChunk;
    this.productCache.set(0, firstChunk);
    this.loadedChunks.add(0);
    
    this.initializeFilters();
    this.resetFilters();
    this.applyFilters();
    this.loading = false;
    
    // Load remaining chunks in background
    if (products.length > this.CHUNK_SIZE) {
      this.loadRemainingChunks(products);
    }
  }

  private loadRemainingChunks(products: Product[]): void {
    let chunkIndex = 1;
    const totalChunks = Math.ceil(products.length / this.CHUNK_SIZE);
    
    const loadNextChunk = () => {
      if (chunkIndex < totalChunks) {
        setTimeout(() => {
          const start = chunkIndex * this.CHUNK_SIZE;
          const end = start + this.CHUNK_SIZE;
          const chunk = products.slice(start, end);
          
          this.productCache.set(chunkIndex, chunk);
          this.loadedChunks.add(chunkIndex);
          this.allProducts = [...this.allProducts, ...chunk];
          
          // Re-initialize filters and apply them
          this.initializeFilters();
          this.applyFilters();
          
          chunkIndex++;
          loadNextChunk();
        }, 100); // Small delay to avoid blocking UI
      }
    };
    
    loadNextChunk();
  }

  private clearCache(): void {
    this.productCache.clear();
    this.loadedChunks.clear();
    this.allProducts = [];
  }

  loadProductsByIds(ids: number[]): void {
    this.loading = true;
    this.allProducts = [];
    
    // Limit concurrent requests to improve performance
    const batchSize = 3;
    const batches: number[][] = [];
    
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      batches.push(batch);
    }
    
    const loadBatch = async (batch: number[]) => {
      const requests = batch.map(id => 
        this.productService.getProductById(id).toPromise()
      );
      return Promise.all(requests);
    };
    
    const loadAllBatches = async () => {
      const results = [];
      for (const batch of batches) {
        const batchResults = await loadBatch(batch);
        results.push(...batchResults);
      }
      return results;
    };
    
    loadAllBatches().then(products => {
      this.allProducts = products.filter(p => p) as Product[];
      this.initializeFilters();
      this.resetFilters();
      this.applyFilters();
      this.loading = false;
    }).catch(error => {
      console.error('Error loading products:', error);
      this.loading = false;
    });
  }

  initializeFilters(): void {
    // Get unique brands
    this.availableBrands = [...new Set(
      this.allProducts
        .filter(p => p.brand)
        .map(p => p.brand!)
    )].sort();
    
    // Set price range
    const prices = this.allProducts.map(p => p.price || 0);
    this.minPrice = Math.min(...prices);
    this.maxPrice = Math.max(...prices);
    this.tempMinPrice = this.minPrice;
    this.tempMaxPrice = this.maxPrice;
  }

  resetFilters(): void {
    this.selectedBrands = [];
    this.tempSelectedBrands.clear();
    this.inStockOnly = false;
    this.tempInStockOnly = false;
    this.minRating = 0;
    this.tempMinRating = 0;
    this.currentPage = 1;
  }

  applyFilters(): void {
    // Apply current filter values using proper Angular data binding
    this.selectedBrands = Array.from(this.tempSelectedBrands);
    this.inStockOnly = this.tempInStockOnly;
    this.minRating = this.tempMinRating;
    this.minPrice = this.tempMinPrice;
    this.maxPrice = this.tempMaxPrice;

    this.filteredProducts = this.allProducts.filter(product => {
      // Brand filter
      if (this.selectedBrands.length > 0 && 
          !this.selectedBrands.includes(product.brand || '')) {
        return false;
      }
      
      // Stock filter
      if (this.inStockOnly && 
          (!product.stock || product.stock <= 0)) {
        return false;
      }
      
      // Rating filter
      if (product.rating && product.rating < this.minRating) {
        return false;
      }
      
      // Price filter
      if (product.price && 
          (product.price < this.minPrice || product.price > this.maxPrice)) {
        return false;
      }
      
      return true;
    });
    
    this.applySorting();
    this.updatePagination();
  }

  applySorting(): void {
    if (!this.sortBy) return;
    
    this.filteredProducts.sort((a, b) => {
      let valueA: any, valueB: any;
      
      switch (this.sortBy) {
        case 'price':
          valueA = a.price || 0;
          valueB = b.price || 0;
          break;
        case 'rating':
          valueA = a.rating || 0;
          valueB = b.rating || 0;
          break;
        case 'title':
          valueA = a.title || '';
          valueB = b.title || '';
          break;
        default:
          return 0;
      }
      
      if (this.sortOrder === 'desc') {
        return valueB > valueA ? 1 : -1;
      } else {
        return valueA > valueB ? 1 : -1;
      }
    });
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
    
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.displayedProducts = this.filteredProducts.slice(startIndex, endIndex);
    this.viewPortScroller.scrollToPosition([0, 0]);
  }

  onBrandChange(brand: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    const checked = target.checked;
    
    if (checked) {
      this.tempSelectedBrands.add(brand);
    } else {
      this.tempSelectedBrands.delete(brand);
    }
  }

  // Helper method for template to check if brand is selected
  isBrandSelected(brand: string): boolean {
    return this.tempSelectedBrands.has(brand);
  }

  onSortChange(): void {
    this.applySorting();
    this.updatePagination();
  }

  clearFilters(): void {
    // Angular way - just update data, template will update automatically
    this.tempSelectedBrands.clear();
    this.tempInStockOnly = false;
    this.tempMinRating = 0;
    this.tempMinPrice = this.minPrice;
    this.tempMaxPrice = this.maxPrice;
    
    this.applyFilters();
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  getPaginationArray(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  getStars(rating: number): string[] {
    const stars: string[] = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push('★');
    }
    if (hasHalfStar) {
      stars.push('☆');
    }
    while (stars.length < 5) {
      stars.push('☆');
    }
    return stars;
  }

  // Helper method for template
  getMin(a: number, b: number): number {
    return Math.min(a, b);
  }
}