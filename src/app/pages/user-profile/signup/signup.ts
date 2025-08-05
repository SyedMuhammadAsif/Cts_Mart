import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserAuth } from '../../../services/user-auth';

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.css'
})
export class Signup {
  signupForm = new FormGroup({
    name: new FormControl('',[Validators.required, Validators.minLength(5), Validators.pattern(/^[a-zA-Z0-9]+$/)]),
    email: new FormControl('',[Validators.required, Validators.email]),
    password: new FormControl('',[Validators.required, Validators.minLength(8),Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])[A-Za-z\d\S]{8,}$/)]),
    confirmPassword: new FormControl('',[Validators.required, Validators.minLength(8),Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])[A-Za-z\d\S]{8,}$/)]),
  });

  errorMessage: string = '';
  registerMessage: string = '';

  constructor(private router: Router, private auth: UserAuth) {}

  onSubmit() {
    const password = this.signupForm.value.password?.trim();
    const confirmPassword = this.signupForm.value.confirmPassword?.trim();

    if (password && password === confirmPassword) {
      this.auth.register(this.signupForm.value).subscribe({
        next: () => {
          this.errorMessage = ''; 
          this.registerMessage = 'Signup Success, Now Login'
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 5000);
        },
        error: err => {
          this.signupForm.markAllAsTouched();
          this.errorMessage = err.message; 
        }
      });
    }
    else {
      this.signupForm.get('password')?.markAsTouched();
      this.signupForm.get('confirmPassword')?.markAsTouched();
    }
  }

  closeModal() {
    this.router.navigate(['']);
  }

}
