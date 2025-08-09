import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Header } from "./common/header/header";
import { Footer } from "./common/footer/footer";
import { AutoCleanupService } from './services/auto-cleanup.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('MEGA_Mart');
  
  // Track if we're on an admin page
  isAdminPage = false;
  private routerSubscription: Subscription = new Subscription();

  constructor(
    private router: Router,
    private autoCleanup: AutoCleanupService
  ) {}

  ngOnInit(): void {
    // Listen to route changes to determine if we're on admin pages
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        // Check if current route starts with '/admin'
        this.isAdminPage = event.url.startsWith('/admin');
        console.log('Route changed:', event.url, 'Is Admin Page:', this.isAdminPage);
      });

    // Check initial route
    this.isAdminPage = this.router.url.startsWith('/admin');

    // Start auto-cleanup service
    this.autoCleanup.startAutoCleanup();
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }
}
