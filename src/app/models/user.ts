export interface User {
  id?: string;
  user_id: string;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  addresses?: UserAddress[];
  paymentMethods?: UserPaymentMethod[];
}

export interface UserAddress {
  id?: string;
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault?: boolean;
}

export interface UserPaymentMethod {
  id?: string;
  type: 'card' | 'upi';
  cardNumber?: string;
  cardholderName?: string;
  expiryMonth?: string;
  expiryYear?: string;
  upiId?: string;
  isDefault?: boolean;
}

export interface PasswordResetRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
} 