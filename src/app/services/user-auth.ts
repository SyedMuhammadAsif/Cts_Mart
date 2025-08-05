import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, ObservedValuesFromArray, switchMap, throwError } from 'rxjs';
import { EnvVariables } from '../env/env-variables';
import { Md5 } from 'ts-md5';

@Injectable({
  providedIn: 'root'
})
export class UserAuth {

  constructor(private http: HttpClient) {}

  private generateId(): number {
    return Math.floor(100000 + Math.random() * 900000);
  }

  register(registerData: any): Observable<any> {
    const hashedPassword = Md5.hashStr(registerData.password);

    const generatedId = String(this.generateId());

    const checkUsername = this.http.get<any[]>(`${EnvVariables.apiBaseUrl}/users?name=${registerData.name}`);
    const checkEmail = this.http.get<any[]>(`${EnvVariables.apiBaseUrl}/users?email=${registerData.email}`);
    const checkUserId = this.http.get<any[]>(`${EnvVariables.apiBaseUrl}/users?user_id=${generatedId}`);

    return forkJoin([checkUsername, checkEmail, checkUserId]).pipe(
      switchMap(([usernameUsers, emailUsers, userIdUsers]) => {
        if (usernameUsers.length > 0) {
          return throwError(() => new Error('Username not available'));
        }

        if (emailUsers.length > 0) {
          return throwError(() => new Error('Email already registered'));
        }

        if (userIdUsers.length > 0) {
          // Retry with a new ID
          return this.register(registerData); // Recursive call
        }
        
        const { confirmPassword, ...cleanedRegisterData } = registerData;

        const registerPostData = {
          ...cleanedRegisterData,
          password: hashedPassword,
          user_id: generatedId
        };

        return this.http.post(`${EnvVariables.apiBaseUrl}/users`, registerPostData);
      })
    );
  }


  login(loginData: any): Observable<any> {
    const hashedPassword = Md5.hashStr(loginData.password);

    return this.http.get<any[]>(`${EnvVariables.apiBaseUrl}/users`).pipe(
      map(users => {
        const user = users.find(u => u.name === loginData.name);

        if (user) {
          if (user.password === hashedPassword) {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userId', `${user.user_id}`);
          } else {
            throw new Error('Password is incorrect');
          }
        } else {
          throw new Error('Username is incorrect');
        }
      }),
      catchError(err => throwError(() => err))
    );
  }

  logout(): void {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userId');
  }

  isLoggedIn(): boolean {
    return localStorage.getItem('isLoggedIn') === 'true';
  }  
}
