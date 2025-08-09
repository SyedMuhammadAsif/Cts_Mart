import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AddressInfoState {
  city: string;
  postalCode: string;
}

@Injectable({ providedIn: 'root' })
export class AddressStateService {
  private addressInfoSubject = new BehaviorSubject<AddressInfoState | null>(null);
  public readonly addressInfo$: Observable<AddressInfoState | null> = this.addressInfoSubject.asObservable();

  setAddressInfo(address: AddressInfoState | null): void {
    this.addressInfoSubject.next(address);
  }
} 