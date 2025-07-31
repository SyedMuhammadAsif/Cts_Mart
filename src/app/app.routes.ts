import { Routes } from '@angular/router';
import { NotFound } from './pages/not-found/not-found';
import { Login } from './pages/user-profile/login/login';
import { Signup } from './pages/user-profile/signup/signup';
import { ProductDetails } from './pages/product-details/product-details';

export const routes: Routes = [
    {path: 'login', component: Login},
    {path: 'signup', component: Signup},
    {path: 'product_details', component: ProductDetails},
    {path: '', component: NotFound},
    {path: '**', component: NotFound}
];
