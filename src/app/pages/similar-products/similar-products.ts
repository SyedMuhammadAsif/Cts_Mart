import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostListener, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { ProductDetailService } from '../../services/product-detail-service';
import { Product } from '../../models/product';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';


declare var bootstrap: any;

@Component({
  selector: 'app-similar-products',
  imports: [CommonModule,RouterModule],
  templateUrl: './similar-products.html',
  styleUrl: './similar-products.css'
})
export class SimilarProducts implements OnChanges, AfterViewInit ,OnDestroy {
  @Input() category: string | undefined;
  @Input() excludeProductId: number | undefined;

  similarProducts: Product[] = [];
  slides: Product[][] = [];
  carouselInstance: any;

  @ViewChild('productCarousel', { static: false }) carouselElement!: ElementRef;

  cardsPerSlideConfig = {
    xl: 4,
    lg: 4,
    md: 4,
    sm: 2,
    xs: 1
  };
   private resizeTimeout: any;

  // Inject ChangeDetectorRef
  constructor(private productService: ProductDetailService, private cdr: ChangeDetectorRef) { } 

  ngOnChanges(changes: SimpleChanges): void {
    console.log('SimilarProducts ngOnChanges triggered. Inputs:', { category: this.category, excludeProductId: this.excludeProductId });
    if (changes['category'] || changes['excludeProductId']) {
      this.loadSimilarProducts();
    }
  }

  ngAfterViewInit(): void {
    console.log('SimilarProducts ngAfterViewInit: Initial carousel check.');
   
  }
  ngOnDestroy(): void {
    if (this.carouselInstance) {
      this.carouselInstance.dispose();
      this.carouselInstance = null;
    }
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
  }

   @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => { 
      console.log('SimilarProducts onResize: Re-grouping and re-initializing carousel.');
      this.groupProductsIntoSlides();
      
      this.cdr.detectChanges(); 
      this.initCarousel();
    }, 500); 
  }

  initCarousel(): void {
    console.log('SimilarProducts initCarousel called. Element:', this.carouselElement?.nativeElement, 'Slides length:', this.slides.length);

    // Dispose any existing carousel instance first
    if (this.carouselInstance) {
      this.carouselInstance.dispose();
      this.carouselInstance = null;
      console.log('SimilarProducts initCarousel: Disposed old carousel instance.');
    }

    // Initialize only if element exists AND there are slides
    if (this.carouselElement && this.carouselElement.nativeElement && this.slides.length > 0) {
      try {
        
        this.carouselInstance = new (window as any).bootstrap.Carousel(this.carouselElement.nativeElement, {
        
          interval: 5000 
        });
        this.carouselInstance.to(0);
        console.log('SimilarProducts initCarousel: Successfully created new Bootstrap Carousel instance.');
        console.log('SimilarProducts initCarousel: Carousel instance:', this.carouselInstance);
      } catch (e) {
        console.error('SimilarProducts initCarousel: Error initializing Bootstrap Carousel:', e);
      }
    } else {
      console.warn('SimilarProducts initCarousel: Cannot initialize carousel. Either element not found or no slides to display.');
    }
  }

   loadSimilarProducts(): void {
    console.log('SimilarProducts loadSimilarProducts called for category:', this.category, 'exclude ID:', this.excludeProductId);

    if (this.category && this.excludeProductId !== undefined) {
      this.productService.getSimilarProducts(this.category, this.excludeProductId).subscribe(
        products => {
          this.similarProducts = products;
          console.log('SimilarProducts: Received similar products:', this.similarProducts.length, 'products.');
          this.groupProductsIntoSlides();
          console.log('SimilarProducts: Slides generated. Total slides:', this.slides.length);

          
          this.cdr.detectChanges(); 

          
          setTimeout(() => {
            console.log('SimilarProducts: Attempting to initCarousel after delay.'); // Added for debugging
            this.initCarousel();
          }, 50); 

        },
        error => {
          console.error('SimilarProducts: Error loading similar products:', error);
          this.similarProducts = [];
          this.slides = [];
          this.cdr.detectChanges(); 
          setTimeout(() => {
            console.log('SimilarProducts: Attempting to initCarousel after delay (error path).'); // Added for debugging
            this.initCarousel(); 
          }, 50); 
        }
      );
    } else {
      console.warn('SimilarProducts: Cannot load similar products: category or excludeProductId is missing/undefined.');
      this.similarProducts = [];
      this.slides = [];
      this.cdr.detectChanges(); 
      setTimeout(() => {
        console.log('SimilarProducts: Attempting to initCarousel after delay (no data path).'); // Added for debugging
        this.initCarousel();
      }, 50); 
    }
  }
  getCardsPerCurrentBreakpoint(): number {
    const width = window.innerWidth;
    const cards = (() => {
      if (width >= 1200) return this.cardsPerSlideConfig.xl;
      if (width >= 992) return this.cardsPerSlideConfig.lg;
      if (width >= 768) return this.cardsPerSlideConfig.md;
      if (width >= 576) return this.cardsPerSlideConfig.sm;
      return this.cardsPerSlideConfig.xs;
    })();
    return cards;
  }

  groupProductsIntoSlides(): void {
    this.slides = [];
    if (!this.similarProducts || this.similarProducts.length === 0) {
      console.log('SimilarProducts: No similar products to group into slides.');
      return;
    }
    const cardsPerBreakpoint = this.getCardsPerCurrentBreakpoint();
    for (let i = 0; i < this.similarProducts.length; i += cardsPerBreakpoint) {
      this.slides.push(this.similarProducts.slice(i, i + cardsPerBreakpoint));
    }
  }
}