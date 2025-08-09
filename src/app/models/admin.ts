// Admin interface for authentication and authorization
export interface Admin {
  id?: string;
  adminID: string;
  name: string;
  email: string;
  password?: string;
  role: AdminRole;
  permissions: AdminPermission[];
  createdAt?: string;
  lastLogin?: string;
}

// Admin roles with different permission levels
export type AdminRole = 'super_admin' | 'admin' | 'product_manager' | 'customer_manager' | 'order_manager';

// Admin permissions for different actions
export type AdminPermission = 
  | 'manage_products' 
  | 'manage_orders' 
  | 'manage_customers' 
  | 'view_analytics' 
  | 'manage_admins';

// Admin login credentials
export interface AdminLoginData {
  email: string;
  password: string;
}

// Dashboard statistics
export interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  pendingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
}

// Sales analytics data
export interface SalesAnalytics {
  dailySales: { date: string; amount: number }[];
  monthlySales: { month: string; amount: number }[];
  topProducts: { productId: string; title: string; sales: number }[];
  orderStatusDistribution: { status: string; count: number }[];
}

// Product management for admin
export interface AdminProduct {
  id?: string;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage?: number;
  rating?: number;
  stock: number;
  tags: string[];
  brand?: string;
  sku?: string;
  weight?: number;
  dimensions?: {
    width: number;
    height: number;
    depth: number;
  };
  warrantyInformation?: string;
  shippingInformation?: string;
  availabilityStatus: string;
  returnPolicy?: string;
  minimumOrderQuantity?: number;
  images: string[];
  thumbnail: string;
  meta?: {
    createdAt: string;
    updatedAt: string;
    barcode?: string;
    qrCode?: string;
  };
} 