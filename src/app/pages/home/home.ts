import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ElementRef, TrackByFunction } from '@angular/core';
import { FormsModule } from '@angular/forms';

// import { HeaderBar } from '../header-bar/header-bar';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { ProductService } from '../../services/product-service';


interface CategoryWithProducts {
  name: string;
  slug: string;
  products: any[];
  chunkedProducts: any[][];
}
@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit{
 
// This array will hold all our categories, each with its own product list.
  categoriesWithProducts: CategoryWithProducts[] = [];
  isLoading = true; // To show a loading indicator
  categories: any[] = [];
  allProducts: any[] = [];

   bannerImages: string[] = [
    'banner1.jpg',
    'banner2.jpg',
    'banner3.jpg'
  ];

  // TrackBy functions
  trackByCategory: TrackByFunction<any> = (index: number, item: any) => item.slug || index;
  trackByProduct: TrackByFunction<any> = (index: number, item: any) => item.id || index;

  constructor(
    private productService: ProductService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadCategorizedProducts();
    this.loadCategories();
    this.loadAllProducts();
  }

  loadCategorizedProducts(): void {
    this.productService.getCategories().pipe(
      // Use switchMap to switch from the categories observable to a new one
      switchMap(categories => {
        // If there are no categories, return an empty observable
        if (!categories || categories.length === 0) {
          return of([]);
        }
        // Create an array of observables, one for each category's products
        const categoryObservables = categories.slice(0, 10).map((category: any) => // Using slice(0, 10) to limit to 10 categories for performance
          this.productService.getProductsByCategory(category.slug).pipe(
            // Use map to transform the API response into our desired structure
            map(response => ({
              name: category.name,
              slug: category.slug,
              products: response.products,
              // Group products into chunks of 4 for the carousel
              chunkedProducts: this.chunkArray(response.products, 4)
            }))
          )
        );
        // Use forkJoin to run all product requests in parallel and get results when all are complete
        return forkJoin(categoryObservables);
      })
    ).subscribe({
      next: (result) => {
        this.categoriesWithProducts = result;
        this.isLoading = false;
      },
      error: (err) => {
        console.error("Failed to load products by category", err);
        this.isLoading = false;
      }
    });
  }

  // Helper function to split an array into smaller arrays
  private chunkArray(myArray: any[], chunkSize: number): any[][] {
    const results = [];
    const arrayCopy = [...myArray];
    while (arrayCopy.length) {
      results.push(arrayCopy.splice(0, chunkSize));
    }
    return results;
  }

  // Load categories for category grid
  loadCategories(): void {
    this.productService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories || [];
      },
      error: (err) => {
        console.error("Failed to load categories", err);
      }
    });
  }

  // Load all products for featured sections
  loadAllProducts(): void {
    this.productService.getProducts().subscribe({
      next: (response: any) => {
        this.allProducts = response.products || [];
      },
      error: (err) => {
        console.error("Failed to load all products", err);
      }
    });
  }



  // Navigate to category
  navigateToCategory(categorySlug: string): void {
    this.router.navigate(['/category', categorySlug]);
  }



  // Get category icon with fallback to SVG
  getCategoryIcon(categorySlug: string): string {
    const categoryIcons: { [key: string]: string } = {
      // Beauty & Personal Care
      'beauty': 'https://img.icons8.com/color/64/makeup.png',
      'fragrances': 'https://img.icons8.com/color/64/perfume.png', 
      'skin-care': 'https://img.icons8.com/color/64/spa.png',
      
      // Fashion & Clothing
      'mens-shirts': 'https://img.icons8.com/color/64/shirt.png',
      'mens-shoes': 'https://img.icons8.com/color/64/shoes.png',
      'mens-watches': 'https://img.icons8.com/color/64/wristwatch.png',
      'womens-bags': 'https://img.icons8.com/color/64/handbag.png',
      'womens-dresses': 'https://img.icons8.com/color/64/dress.png',
      'womens-jewellery': 'https://img.icons8.com/color/64/jewelry.png',
      'womens-shoes': 'https://img.icons8.com/color/64/high-heeled-shoe.png',
      'womens-watches': 'https://img.icons8.com/color/64/smartwatch.png',
      'tops': 'https://img.icons8.com/color/64/t-shirt.png',
      'sunglasses': 'https://img.icons8.com/color/64/sunglasses.png',
      
      // Electronics & Technology
      'laptops': 'https://img.icons8.com/color/64/laptop.png',
      'smartphones': 'https://img.icons8.com/color/64/smartphone.png',
      'tablets': 'https://img.icons8.com/color/64/tablet.png',
      'mobile-accessories': 'https://img.icons8.com/color/64/phone-case.png',
      
      // Home & Living
      'furniture': 'https://img.icons8.com/color/64/armchair.png',
      'home-decoration': 'https://img.icons8.com/color/64/interior.png',
      'kitchen-accessories': 'https://img.icons8.com/color/64/kitchen.png',
      'groceries': 'https://img.icons8.com/color/64/grocery-bag.png',
      
      // Vehicles & Sports
      'motorcycle': 'https://img.icons8.com/color/64/motorcycle.png',
      'vehicle': 'https://img.icons8.com/color/64/car.png',
      'sports-accessories': 'https://img.icons8.com/color/64/sports.png',
      
      // Additional categories that might exist
      'automotive': 'https://img.icons8.com/color/64/car.png',
      'books': 'https://img.icons8.com/color/64/book.png',
      'electronics': 'https://img.icons8.com/color/64/laptop.png',
      'fashion': 'https://img.icons8.com/color/64/t-shirt.png',
      'health': 'https://img.icons8.com/color/64/medical-heart.png',
      'jewelry': 'https://img.icons8.com/color/64/jewelry.png',
      'music': 'https://img.icons8.com/color/64/headphones.png',
      'shoes': 'https://img.icons8.com/color/64/shoes.png',
      'sports': 'https://img.icons8.com/color/64/sports.png',
      'toys': 'https://img.icons8.com/color/64/teddy-bear.png',
      'watches': 'https://img.icons8.com/color/64/watch.png'
    };

    return categoryIcons[categorySlug] || this.getDefaultCategoryIcon(categorySlug);
  }

  // Fallback SVG icon
  private getDefaultCategoryIcon(categorySlug: string): string {
    // Return a data URL for SVG as fallback
    const svgContent = this.getCategorySVG(categorySlug);
    return `data:image/svg+xml;base64,${btoa(svgContent)}`;
  }

  // Generate category-specific SVG
  private getCategorySVG(categorySlug: string): string {
    const color = '#0078ad'; // CTS blue
    
    const svgMappings: { [key: string]: string } = {
      'beauty': `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="${color}"><path d="M9 10c0-.6.4-1 1-1s1 .4 1 1-.4 1-1 1-1-.4-1-1zm5 0c0-.6.4-1 1-1s1 .4 1 1-.4 1-1 1-1-.4-1-1zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm7 10c0 3.87-3.13 7-7 7s-7-3.13-7-7 3.13-7 7-7 7 3.13 7 7z"/><path d="M8 15s1 2 4 2 4-2 4-2"/></svg>`,
      'fragrances': `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="${color}"><path d="M12 6c-1.11 0-2-.89-2-2 0-.55.22-1.05.59-1.41C11 2.22 11.45 2 12 2s1 .22 1.41.59C13.78 2.95 14 3.45 14 4c0 1.11-.89 2-2 2zm4 2h-1V7h-2v1H9V7H7v1H6c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2z"/><path d="M9 12h6v2H9z"/></svg>`,
      'electronics': `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="${color}"><path d="M21 2H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7l-2 3v1h8v-1l-2-3h7c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 12H3V4h18v10z"/></svg>`,
      'fashion': `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="${color}"><path d="M16 4l4 4-4 4V9h-4V7h4V4zM10 7v2H6V4l-4 4 4 4v-3h4v2l4-4-4-4z"/></svg>`,
      'home': `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="${color}"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`,
      'sports': `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="${color}"><path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.5L12 7.77c.66-.26 1.01-.91 1.01-1.57v-.73c-.02-.85-.22-1.56-.64-2.14L12 3l-5.27 5.27c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L9.8 8.5z"/></svg>`,
      'vehicles': `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="${color}"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>`,
      'kitchen': `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="${color}"><path d="M18 2.01L6 2c-1.1 0-2 .89-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.11-.9-1.99-2-1.99zM18 20H6V4h2v7l2-1 2 1V4h6v16z"/></svg>`,
      'furniture': `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="${color}"><path d="M7 11v2c0 .55.45 1 1 1s1-.45 1-1v-2h6v2c0 .55.45 1 1 1s1-.45 1-1v-2c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2H7c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2z"/><path d="M7 18v2h10v-2H7zM9 15v2h6v-2H9z"/></svg>`,
      'groceries': `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="${color}"><path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>`,
      'watches': `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="${color}"><path d="M20 12c0-2.54-1.19-4.81-3.04-6.27L16 0H8l-.95 5.73C5.19 7.19 4 9.46 4 12s1.19 4.81 3.05 6.27L8 24h8l.96-5.73C18.81 16.81 20 14.54 20 12zM6 12c0-3.31 2.69-6 6-6s6 2.69 6 6-2.69 6-6 6-6-2.69-6-6z"/></svg>`,
      'shoes': `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="${color}"><path d="M2 18h20c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2zm1.86-9.52c-.51 0-.95-.35-1.06-.84-.84-3.46 2.32-6.64 5.78-5.8l4.49.69V7H9.5c-.69 0-1.32.3-1.75.79l-.93 1.21L3.86 8.48z"/><path d="M22 10h-2l-3.2-4.53c-.34-.48-.89-.76-1.48-.76h-3.84L13 7h6l3 3z"/></svg>`
    };

    // Get category-specific icon or default to a shopping bag
    const categoryType = this.getCategoryType(categorySlug);
    return svgMappings[categorySlug] || svgMappings[categoryType] || `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="${color}"><path d="M19 7h-2V6a5 5 0 0 0-10 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM9 6a3 3 0 0 1 6 0v1H9V6zm8 13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h4v1a1 1 0 0 0 2 0V9h2v10z"/></svg>`;
  }

  // Determine category type for better fallback
  private getCategoryType(categorySlug: string): string {
    if (categorySlug.includes('men') || categorySlug.includes('women') || categorySlug.includes('fashion') || categorySlug.includes('shirt') || categorySlug.includes('dress')) {
      return 'fashion';
    }
    if (categorySlug.includes('phone') || categorySlug.includes('laptop') || categorySlug.includes('tablet') || categorySlug.includes('electronic')) {
      return 'electronics';
    }
    if (categorySlug.includes('beauty') || categorySlug.includes('skin') || categorySlug.includes('fragrance')) {
      return 'beauty';
    }
    if (categorySlug.includes('home') || categorySlug.includes('furniture') || categorySlug.includes('kitchen')) {
      return 'home';
    }
    if (categorySlug.includes('sport') || categorySlug.includes('vehicle') || categorySlug.includes('motorcycle')) {
      return 'sports';
    }
    if (categorySlug.includes('watch')) {
      return 'watches';
    }
    if (categorySlug.includes('shoe')) {
      return 'shoes';
    }
    return 'electronics'; // default fallback
  }

  // Handle image load errors with multiple fallback attempts
  onImageError(event: any, categorySlug: string): void {
    const currentSrc = event.target.src;
    
    // Try alternative URLs before falling back to SVG
    const alternativeUrls = this.getAlternativeUrls(categorySlug);
    const currentIndex = alternativeUrls.indexOf(currentSrc);
    
    if (currentIndex < alternativeUrls.length - 1) {
      // Try next alternative URL
      event.target.src = alternativeUrls[currentIndex + 1];
    } else {
      // Use SVG fallback
      event.target.src = this.getDefaultCategoryIcon(categorySlug);
    }
  }

  // Get alternative URLs for categories
  private getAlternativeUrls(categorySlug: string): string[] {
    const alternatives: { [key: string]: string[] } = {
      'beauty': [
        'https://img.icons8.com/color/64/makeup.png',
        'https://img.icons8.com/color/64/lipstick.png',
        'https://img.icons8.com/color/64/cosmetics.png',
        'https://img.icons8.com/fluency/64/beauty.png'
      ],
      'fragrances': [
        'https://img.icons8.com/color/64/perfume.png',
        'https://img.icons8.com/color/64/fragrance.png',
        'https://img.icons8.com/fluency/64/perfume.png',
        'https://img.icons8.com/color/64/cologne.png'
      ]
    };
    
    return alternatives[categorySlug] || [this.getCategoryIcon(categorySlug)];
  }

}