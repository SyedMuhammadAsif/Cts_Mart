import { Component } from '@angular/core';
import { UserAuth } from '../../services/user-auth';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-user-profile',
  imports: [CommonModule, RouterLink],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.css'
})
export class UserProfile {
  constructor(private auth: UserAuth, private router: Router) {}

  logout() {
    this.auth.logout();
    this.router.navigate(['']);
  }

  isLoggedIn() {
    return this.auth.isLoggedIn();
  }
}
