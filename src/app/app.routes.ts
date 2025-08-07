import { Routes } from '@angular/router';
import { NotFound } from './pages/not-found/not-found';
import { Login } from './pages/user-profile/login/login';
import { Signup } from './pages/user-profile/signup/signup';
import { ProductDetail } from './pages/product-detail/product-detail';
import { Home } from './pages/home/home';
import { ProductList } from './pages/product-list/product-list';
import { WishList } from './pages/wish-list/wish-list';
import { Category } from './pages/category/category';
import { CartComponent } from './pages/cart/cart';
import { OrderHistoryComponent } from './pages/order-history/order-history';
import { OrderTrackingComponent } from './pages/order-tracking/order-tracking';
import { CheckoutPaymentComponent } from './pages/checkout-payment/checkout-payment';
import { CheckoutAddressComponent } from './pages/checkout-address/checkout-address';

export const routes: Routes = [
    {path: 'login', component: Login},
    {path: 'signup', component: Signup},
    {path: 'home', component: Home},
    {path: 'category', component: Category},
    {path: 'category/:categoryName', component:ProductList},
    {path: 'product/:id', component: ProductDetail},
    {path: 'wishlist', component: WishList},
    {path: 'cart', component: CartComponent},
    {path: 'checkout/address', component: CheckoutAddressComponent},
    {path: 'checkout/payment', component: CheckoutPaymentComponent},
    {path: 'order-tracking/:orderNumber', component: OrderTrackingComponent},
    {path: 'orders', component: OrderHistoryComponent},
    {path: '', component: Home},
    {path: '**', component: NotFound}


];
