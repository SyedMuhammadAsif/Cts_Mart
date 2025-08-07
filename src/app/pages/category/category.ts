import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../services/product-service';

@Component({
  selector: 'app-category',
  imports: [CommonModule],
  templateUrl: './category.html',
  styleUrl: './category.css'
})
export class Category implements OnInit {
  categories: any[] = [];
  selectedCategory: any = null;
  idArray: number[] = [];
  categoryName: string = '';

  constructor(
    private router: Router,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.productService.getCategory().subscribe(res => {
      this.categories = res as any[];
      console.log(this.categories);
    });
  }

  onCategoryClick(category: any): void {
    this.productService.getCategoryProducts(category.slug).subscribe(res => {
      this.categoryName = category.slug;
      this.selectedCategory = res as any;

      if (this.selectedCategory && this.selectedCategory.products) {
        this.idArray = [];
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

      this.router.navigate(['category', this.categoryName]);
    });
  }

  closeOverlay(): void {
    this.router.navigate(['/']);
  }
}