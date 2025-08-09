import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EnvVariables } from '../env/env-variables';

// Interface for the API response when fetching products by category
export interface ProductApiResponse {
  products: any[];
  total?: number;
  skip?: number;
  limit?: number;
}


@Injectable({
  providedIn: 'root'
})
export class ProductService {

  
  //Category Images
  images:string[]=["https://www.centuryply.com/assets/img/blog/25-08-22/blog-home-decoration-3.jpg",
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




// *******************************************************************************



  constructor(private http:HttpClient){}

  private baseUrl = `${EnvVariables.apiBaseUrl}`;

  // Local state for selections/search
  private idArraySource=new BehaviorSubject<number[]>([]);
  idArrayFinal=this.idArraySource.asObservable();
  updateIDArray(ids:number[]){
    this.idArraySource.next(ids);
  }

  // Search results functionality
  private searchResultsSource = new BehaviorSubject<number[]>([]);
  searchResults = this.searchResultsSource.asObservable();
  setSearchResults(productIds: number[]): void {
    this.searchResultsSource.next(productIds);
  }

  // Categories from local products, shaped as { name, slug }
  getCategories(): Observable<{ name: string; slug: string; }[]> {
    return this.http.get<any[]>(`${this.baseUrl}/products`).pipe(
      map(products => {
        const unique = Array.from(new Set((products || []).map(p => p.category).filter(Boolean)));
        return unique.map((slug: string) => ({ name: this.titleCase(slug), slug }));
      })
    );
  }

  // Back-compat alias used by some components
  getCategory(): Observable<{ name: string; slug: string; }[]> {
    return this.getCategories();
  }

  // Products list shaped to { products } to match existing consumers
  getProducts(): Observable<ProductApiResponse> {
    return this.http.get<any[]>(`${this.baseUrl}/products`).pipe(
      map(products => ({ products }))
    );
  }

  // Get products by category slug, shaped to { products }
  getProductsByCategory(categorySlug: string): Observable<ProductApiResponse> {
    return this.http.get<any[]>(`${this.baseUrl}/products`).pipe(
      map(products => ({ products: (products || []).filter(p => p.category === categorySlug) }))
    );
  }

  // Back-compat alias
  getCategoryProducts(category:string): Observable<ProductApiResponse> {
    return this.getProductsByCategory(category);
  }

  getCategoryImages(index:number){
    return this.images[index];
  }

  getProductById(id:number){
    return this.http.get(`${this.baseUrl}/products/${id}`);
  }

  private titleCase(input: string): string {
    return (input || '')
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}