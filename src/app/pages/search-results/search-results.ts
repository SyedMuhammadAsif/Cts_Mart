import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductService } from '../../services/product-service';
import { Product } from '../../models/product';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './search-results.html',
  styleUrl: './search-results.css'
})
export class SearchResults implements OnInit {
  searchQuery: string = '';
  searchResults: Product[] = [];
  loading: boolean = false;
  noResults: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Get search query from URL params
    this.route.queryParams.subscribe(params => {
      this.searchQuery = params['q'] || '';
      this.loadSearchResults();
    });
  }

  private loadSearchResults(): void {
    this.loading = true;
    this.noResults = false;
    
    this.productService.searchResults.subscribe(productIds => {
      if (productIds && productIds.length > 0) {
        this.loadProductsByIds(productIds);
      } else {
        this.searchResults = [];
        this.noResults = true;
        this.loading = false;
      }
    });
  }

  private loadProductsByIds(productIds: number[]): void {
    const productRequests = productIds.map(id => 
      this.productService.getProductById(id)
    );

    // Use Promise.all to fetch all products
    Promise.all(productRequests.map(req => import('rxjs').then(({ firstValueFrom }) => firstValueFrom(req))))
      .then(products => {
        this.searchResults = products.filter(product => product != null) as Product[];
        this.noResults = this.searchResults.length === 0;
        this.loading = false;
      })
      .catch(error => {
        console.error('Error loading search results:', error);
        this.searchResults = [];
        this.noResults = true;
        this.loading = false;
      });
  }

  getDiscountedPrice(product: Product): number {
    if (product.discountPercentage > 0) {
      return product.price * (1 - product.discountPercentage / 100);
    }
    return product.price;
  }

  formatPrice(price: number): string {
    return price.toFixed(2);
  }

  getRatingStars(rating: number): string[] {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push('full');
    }
    
    if (hasHalfStar) {
      stars.push('half');
    }
    
    while (stars.length < 5) {
      stars.push('empty');
    }
    
    return stars;
  }
} 