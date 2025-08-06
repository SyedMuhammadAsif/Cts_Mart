import { Product } from "./product";
export interface WishlistItems{
    id : string;
    productId : number;
    addedAt : string;
}

export interface WishlistItemsWithProduct extends WishlistItems{
    product:Product;
}