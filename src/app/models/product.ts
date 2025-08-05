export interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number; // Represents average rating
  stock: number;
  tags: string[]; // Array of strings for tags
  brand: string;
  sku: string;
  weight: number;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  warrantyInformation: string;
  shippingInformation: string;
  availabilityStatus: string;
  reviews: {
    rating: number;
    comment: string;
    date: string; // This is a string (ISO 8601 format)
    reviewerName: string;
    reviewerEmail: string;
  }[]; // Array of review objects
  returnPolicy: string;
  minimumOrderQuantity: number;
  meta?: {
    createdAt: string; // String (ISO 8601 format)
    updatedAt: string; // String (ISO 8601 format)
    barcode: string;
    qrCode: string;
  };
  images: string[]; // Array of image URLs
  thumbnail: string; // Main thumbnail URL
}