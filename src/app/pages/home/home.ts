import { CommonModule, ViewportScroller } from '@angular/common';
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
  selector: 'app-category-scroll',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit{
 
// This array will hold all our categories, each with its own product list.
  @ViewChild('categoryGrid', { static: false }) categoryGrid!: ElementRef;
  
  categoriesWithProducts: CategoryWithProducts[] = [];
  isLoading = true; // To show a loading indicator
  categories: any[] = [];
  allProducts: any[] = [];

  // Simplified banner images array
  bannerImages: string[] = [
    '/banner1.jpg',
    '/banner2.jpg',
    '/banner3.jpg',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop'
  ];

  // Category images - using a single array for consistency
  categoryImages: string[] = ["https://www.centuryply.com/assets/img/blog/25-08-22/blog-home-decoration-3.jpg",
"https://cdn.dummyjson.com/product-images/fragrances/calvin-klein-ck-one/1.webp",
"https://cdn.dummyjson.com/product-images/furniture/annibale-colombo-bed/1.webp",
"https://cdn.dummyjson.com/product-images/groceries/apple/thumbnail.webp",
"https://cdn.dummyjson.com/product-images/home-decoration/decoration-swing/2.webp",
"https://cdn.dummyjson.com/product-images/kitchen-accessories/bamboo-spatula/thumbnail.webp",
"https://cdn.dummyjson.com/product-images/laptops/apple-macbook-pro-14-inch-space-grey/thumbnail.webp",
"https://cdn.dummyjson.com/product-images/mens-shirts/blue-&-black-check-shirt/1.webp",
"https://cdn.dummyjson.com/product-images/mens-shoes/nike-air-jordan-1-red-and-black/1.webp",
"https://cdn.dummyjson.com/product-images/mens-watches/brown-leather-belt-watch/2.webp",
"https://cdn.dummyjson.com/product-images/mobile-accessories/amazon-echo-plus/thumbnail.webp",
"https://cdn.dummyjson.com/product-images/motorcycle/generic-motorcycle/2.webp",
"https://cdn.dummyjson.com/product-images/skin-care/attitude-super-leaves-hand-soap/3.webp",
"https://cdn.dummyjson.com/product-images/smartphones/iphone-5s/2.webp",
"https://cdn.dummyjson.com/product-images/sports-accessories/american-football/thumbnail.webp",
"https://cdn.dummyjson.com/product-images/sunglasses/black-sun-glasses/3.webp",
"https://cdn.dummyjson.com/product-images/tablets/ipad-mini-2021-starlight/thumbnail.webp",
"https://cdn.dummyjson.com/product-images/tops/blue-frock/thumbnail.webp",
"https://cdn.dummyjson.com/product-images/vehicle/300-touring/6.webp",
"https://cdn.dummyjson.com/product-images/womens-bags/blue-women's-handbag/thumbnail.webp",
"https://cdn.dummyjson.com/product-images/womens-dresses/black-women's-gown/thumbnail.webp",
"https://cdn.dummyjson.com/product-images/womens-jewellery/green-crystal-earring/thumbnail.webp",
"https://cdn.dummyjson.com/product-images/womens-shoes/black-&-brown-slipper/thumbnail.webp",
"https://cdn.dummyjson.com/product-images/womens-watches/iwc-ingenieur-automatic-steel/thumbnail.webp"
];

  // Customer testimonials data
  testimonials = [

    {
      name: "Michael Chen",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      rating: 5,
      review: "Great customer service and excellent prices. The product arrived exactly as described.",
      date: "1 week ago"
    },
    {
      name: "Emily Rodriguez",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      rating: 4,
      review: "Love the variety of products available. Easy to navigate website and secure checkout process.",
      date: "2 weeks ago"
    },
    {
      name: "David Thompson",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      rating: 5,
      review: "Outstanding shopping experience! Fast shipping and the product quality exceeded my expectations.",
      date: "3 weeks ago"
    }
  ];

  // TrackBy functions
  trackByCategory: TrackByFunction<any> = (index: number, item: any) => item.slug || index;
  trackByProduct: TrackByFunction<any> = (index: number, item: any) => item.id || index;

  constructor(
    private productService: ProductService,
    private router: Router,private scroller:ViewportScroller
  ) { }

  ngOnInit(): void {
    this.loadCategorizedProducts();
    this.loadCategories();
    this.loadAllProducts();
  }

  scrollToCategoryGrid(): void {
    if (this.categoryGrid) {
      const headerHeight = 140; // Header height to position "Shop by Category" right below header
      const elementPosition = this.categoryGrid.nativeElement.offsetTop;
      const offsetPosition = elementPosition - headerHeight+200;

     this.scroller.scrollToPosition([0,offsetPosition]);
    }
  }

  getCategoryImage(index: number): string {
    return this.categoryImages[index % this.categoryImages.length];
  }

  getStars(rating: number): number[] {
    return Array(rating).fill(0);
  }

  getBannerGroups(): string[][] {
    const groups: string[][] = [];
    for (let i = 0; i < this.bannerImages.length; i += 3) {
      const group = this.bannerImages.slice(i, i + 3);
      groups.push(group);
    }
    console.log('Banner groups:', groups); // Debug log for banner grouping
    return groups;
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
}