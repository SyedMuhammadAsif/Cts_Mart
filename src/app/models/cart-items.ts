import { Product } from "./product";

export interface CartItem {
  id?: string; // JSON-server generated ID
  CartItemID: number;
  ProductID: number;
  Quantity: number;
  TotalPrice: number;
  Product?: Product; // Optional product details for display
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
} 