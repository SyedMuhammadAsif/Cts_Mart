import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ToastService } from '../../services/toast-service';

@Component({
  selector: 'app-payment-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-toast.html',
  styleUrl: './payment-toast.css'
})
export class PaymentToastComponent implements OnInit, OnDestroy {
  showToast = false;
  message = '';
  private subscription = new Subscription();

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.subscription.add(
      this.toastService.toasts$.subscribe(toasts => {
        const paymentSuccessToast = toasts.find(toast => 
          toast.type === 'success' && 
          toast.message.toLowerCase().includes('order') || toast.message.toLowerCase().includes('payment')
        );
        if (paymentSuccessToast) {
          this.message = paymentSuccessToast.message;
          this.showToast = true;
          setTimeout(() => {
            this.showToast = false;
          }, 5000);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  closeToast(): void {
    this.showToast = false;
  }
} 