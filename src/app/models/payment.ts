import { Address } from './address';
import { CartItem } from './cart-items';

// Payment method types
export type PaymentType = 'card' | 'upi' | 'cod';

// Base payment method interface
export interface PaymentMethod {
  type: PaymentType;
  // Card fields (only required when type is 'card')
  cardNumber?: string;
  expiryMonth?: string;
  expiryYear?: string;
  cvv?: string;
  cardholderName?: string;
  // UPI fields (only required when type is 'upi')
  upiId?: string;
  // COD fields (no additional fields needed)
}

// Customer information for orders
export interface CustomerInfo {
  fullName: string;
  email: string;
  phone: string;
}

// Order interface
export interface Order {
  id?: string;
  orderNumber?: string;
  customerInfo: CustomerInfo;
  shippingAddress: any; // You can replace 'any' with proper Address interface
  items: any[]; // You can replace 'any[]' with proper CartItem interface
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  paymentMethod: PaymentMethod;
  orderStatus: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  orderDate: string;
  estimatedDelivery: string;
}

// Order response interface
export interface OrderResponse {
  success: boolean;
  order?: Order;
  trackingNumber?: string;
  message?: string;
} 