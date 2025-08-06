import { Routes } from '@angular/router';
import { NotFound } from './pages/not-found/not-found';
import { Login } from './pages/user-profile/login/login';
import { Signup } from './pages/user-profile/signup/signup';
import { ProductDetail } from './pages/product-detail/product-detail';
import { Home } from './pages/home/home';
import { ProductList } from './pages/product-list/product-list';
import { WishList } from './pages/wish-list/wish-list';

export const routes: Routes = [
    {path: 'login', component: Login},
    {path: 'signup', component: Signup},
    {path: 'home', component: Home},
    {path: 'category/:categoryName', component:ProductList},
    {path: 'product/:id', component: ProductDetail},
    {path: 'wishlist', component: WishList},
    {path: '', component: Home},
    {path: '**', component: NotFound}
];
