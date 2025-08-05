import { Routes } from '@angular/router';
import { NotFound } from './pages/not-found/not-found';
import { Login } from './pages/user-profile/login/login';
import { Signup } from './pages/user-profile/signup/signup';
import { ProductDetails } from './pages/product-details/product-details';
import { Home } from './pages/home/home';
import { ProductList } from './pages/product-list/product-list';

export const routes: Routes = [
    {path: 'login', component: Login},
    {path: 'signup', component: Signup},
    {path: 'home', component: Home},
    {path:'category/:categoryName', component:ProductList},
    {path: 'product_details', component: ProductDetails},
    {path: '', component: Home},
    {path: '**', component: NotFound}
];
