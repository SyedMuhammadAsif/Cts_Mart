import { Component } from '@angular/core';
import { UserProfile } from "../../pages/user-profile/user-profile";

@Component({
  selector: 'app-header',
  imports: [UserProfile],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {

}
