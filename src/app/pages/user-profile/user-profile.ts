import { Component } from '@angular/core';
import { UserAuth } from '../../services/user-auth';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-user-profile',
  imports: [CommonModule, RouterLink],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.css'
})
export class UserProfile {
  constructor(private auth: UserAuth) {}

  logout() {
    this.auth.logout();
  }

  isLoggedIn() {
    return this.auth.isLoggedIn();
  }

  login() {
  }
}
