import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserAuth } from '../../../services/user-auth';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  loginForm = new FormGroup({
    name: new FormControl('',[Validators.required, Validators.minLength(5), Validators.pattern(/^[a-zA-Z0-9]+$/)]),
    password: new FormControl('',[Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])[A-Za-z\d\S]{8,}$/)]),
  });

  errorMessage: string = '';

  constructor(private router: Router, private auth: UserAuth) {}

  onSubmit() {
    this.auth.login(this.loginForm.value).subscribe({
      next: () => {
        this.errorMessage = ''; 
        this.router.navigate(['/home']); 
      },
      error: err => {
        this.loginForm.markAllAsTouched();
        this.errorMessage = err.message; 
      }
    });
  }

  closeModal() {
    this.router.navigate(['']);
  }
}
