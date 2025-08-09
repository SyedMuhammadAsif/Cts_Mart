import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-delivery-policy',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './delivery-policy.html',
  styleUrl: './delivery-policy.css'
})
export class DeliveryPolicy implements OnInit {
  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
} 