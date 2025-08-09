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
import { ManageProfile } from './pages/manage-profile/manage-profile';
import { AuthGuard } from './services/auth-guard';
import { AdminGuard } from './guards/admin-guard';
import { RoleGuard } from './guards/role-guard';
import { AdminDashboardComponent } from './pages/admin/admin-dashboard/admin-dashboard';
import { AdminProductsComponent } from './pages/admin/admin-products/admin-products';
import { AdminOrdersComponent } from './pages/admin/admin-orders/admin-orders';
import { AdminCustomersComponent } from './pages/admin/admin-customers/admin-customers';
import { AdminLoginComponent } from './pages/admin/admin-login/admin-login';
import { AdminSettingsComponent } from './pages/admin/admin-settings/admin-settings';
import { AboutUs } from './pages/about-us/about-us';
import { FAQ } from './pages/faq/faq';
import { TermsConditions } from './pages/terms-conditions/terms-conditions';
import { PrivacyPolicy } from './pages/privacy-policy/privacy-policy';
import { EwastePolicy } from './pages/ewaste-policy/ewaste-policy';
import { SearchResults } from './pages/search-results/search-results';
import { DebugTestComponent } from './pages/debug-test/debug-test';

export const routes: Routes = [
    {path: 'login', component: Login},
    {path: 'signup', component: Signup},
    {path: 'admin/login', component: AdminLoginComponent},
    {path: 'home', component: Home},
    {path: 'category', component: Category},
    {path: 'category/:categoryName', component:ProductList},
    {path: 'search', component: SearchResults},
    {path: 'product/:id', component: ProductDetail},
    {path: 'wishlist', component: WishList, canActivate: [AuthGuard]},
    {path: 'cart', component: CartComponent, canActivate: [AuthGuard]},
    {path: 'checkout/address', component: CheckoutAddressComponent, canActivate: [AuthGuard]},
    {path: 'checkout/payment', component: CheckoutPaymentComponent, canActivate: [AuthGuard]},
    {path: 'order-tracking/:orderNumber', component: OrderTrackingComponent, canActivate: [AuthGuard]},
    {path: 'orders', component: OrderHistoryComponent, canActivate: [AuthGuard]},
    {path: 'manage-profile', component: ManageProfile, canActivate: [AuthGuard]},
    {path: 'debug-test', component: DebugTestComponent},
    
      // Admin Routes - Protected by AdminGuard
  {path: 'admin/dashboard', component: AdminDashboardComponent, canActivate: [AdminGuard]},
  {path: 'admin/products', component: AdminProductsComponent, canActivate: [AdminGuard, RoleGuard], data: { permission: 'manage_products' }},
  {path: 'admin/orders', component: AdminOrdersComponent, canActivate: [AdminGuard, RoleGuard], data: { permission: 'manage_orders' }},
  {path: 'admin/customers', component: AdminCustomersComponent, canActivate: [AdminGuard, RoleGuard], data: { permission: 'manage_customers' }},
  {path: 'admin/settings', component: AdminSettingsComponent, canActivate: [AdminGuard]},
    
    {path: 'about-us', component: AboutUs},
    {path: 'faq', component: FAQ},
    {path: 'terms-conditions', component: TermsConditions},
    {path: 'privacy-policy', component: PrivacyPolicy},
    {path: 'ewaste-policy', component: EwastePolicy},
    {path: '', component: Home},
    {path: '**', component: NotFound}


];
