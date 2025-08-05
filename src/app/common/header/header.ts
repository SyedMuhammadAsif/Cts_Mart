import { Component } from '@angular/core';
import { UserProfile } from "../../pages/user-profile/user-profile";
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [UserProfile, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {

}
