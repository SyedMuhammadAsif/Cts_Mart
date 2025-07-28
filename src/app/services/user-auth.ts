import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UserAuth {
  login(userAuthStatus: boolean): boolean {
    if (userAuthStatus) {
      localStorage.setItem('isLoggedIn', 'true');
      return true;
    }
    return false;
  }

  logout(): void {
    localStorage.removeItem('isLoggedIn');
  }

  isLoggedIn(): boolean {
    return localStorage.getItem('isLoggedIn') === 'true';
  }  
}
