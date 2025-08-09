import { Product } from "./product";

export interface CartItem {
  id?: string; // JSON-server generated ID
  CartItemID: number;
  ProductID: number;
  Quantity: number;
  TotalPrice: number;
  Product?: Product; // Optional product details for display
  user_id?: string; // Optional owner id for multi-user carts
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
} 