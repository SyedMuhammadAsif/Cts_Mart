import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckoutAddress } from './checkout-address';

describe('CheckoutAddress', () => {
  let component: CheckoutAddress;
  let fixture: ComponentFixture<CheckoutAddress>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckoutAddress]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CheckoutAddress);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
