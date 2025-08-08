import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

// Interface for the API response when fetching products by category
export interface ProductApiResponse {
  products: any[];
  total: number;
  skip: number;
  limit: number;
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

   private api_categories_url = 'https://dummyjson.com/products/categories';
  private api_category_base_url = 'https://dummyjson.com/products/category';

  api_URL:string="https://dummyjson.com/products/categories";
  //returns only categories, name,slum,products url

  api_product:string='https://dummyjson.com/products';
 
  api_category:string="https://dummyjson.com/products/category"; 
 
//It give the products category, that is categorry/smartphone


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
  getCategory(){
    return this.http.get(this.api_URL);
  }


  //It gives the products in the category
  //slug should given as parameter to this.

  getCategoryProducts(category:string){
     return this.http.get(`${this.api_category}/${category}`);
  }

  getCategoryImages(index:number){
   return this.images[index];
   
  }

  getProductById(id:number){
    return this.http.get(`${this.api_product}/${id}`);
  }

   getProducts(): Observable<any> {
    return this.http.get(`${this.api_product}?limit=200`);
  }

  //get method to get brands based on products.


  /**
   * Fetches the list of all product category names.
   * The API returns an array of strings.
   * @returns An Observable with an array of category strings.
   */
  getCategories(): Observable<string[]> {
    return this.http.get<string[]>(this.api_categories_url);
  }

  /**
   * Fetches all products for a specific category slug.
   * @param categorySlug - The slug of the category (e.g., 'smartphones').
   * @returns An Observable with the response containing products.
   */
  getProductsByCategory(categorySlug: string): Observable<ProductApiResponse> {
    return this.http.get<ProductApiResponse>(`${this.api_category_base_url}/${categorySlug}`);
  }
}