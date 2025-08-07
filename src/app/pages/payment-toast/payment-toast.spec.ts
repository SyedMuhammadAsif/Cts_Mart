import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentToast } from './payment-toast';

describe('PaymentToast', () => {
  let component: PaymentToast;
  let fixture: ComponentFixture<PaymentToast>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentToast]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentToast);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
