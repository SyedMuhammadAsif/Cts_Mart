import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ewaste-policy',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ewaste-policy.html',
  styleUrl: './ewaste-policy.css'
})
export class EwastePolicy implements OnInit {
  lastUpdated = 'January 1, 2024';

  ngOnInit(): void {
    this.scrollToTop();
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
} 