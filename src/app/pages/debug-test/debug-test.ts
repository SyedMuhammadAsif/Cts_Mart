import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { EnvVariables } from '../../env/env-variables';

@Component({
  selector: 'app-debug-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mt-4">
      <h2>Debug Test - Data Flow Check</h2>
      
      <div class="row">
        <div class="col-md-6">
          <h4>LocalStorage Data</h4>
          <pre>{{ localStorageData | json }}</pre>
        </div>
        
        <div class="col-md-6">
          <h4>Users from Database</h4>
          <pre>{{ usersData | json }}</pre>
        </div>
      </div>
      
      <div class="row mt-4">
        <div class="col-12">
          <h4>Orders from Database</h4>
          <pre>{{ ordersData | json }}</pre>
        </div>
      </div>
      
      <div class="row mt-4">
        <div class="col-12">
          <h4>Current User Analysis</h4>
          <pre>{{ userAnalysis | json }}</pre>
        </div>
      </div>
      
      <div class="row mt-4">
        <div class="col-12">
          <h4>Order Matching Analysis</h4>
          <pre>{{ orderAnalysis | json }}</pre>
        </div>
      </div>
    </div>
  `
})
export class DebugTestComponent implements OnInit {
  localStorageData: any = {};
  usersData: any[] = [];
  ordersData: any[] = [];
  userAnalysis: any = {};
  orderAnalysis: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadDebugData();
  }

  private loadDebugData(): void {
    // Get localStorage data
    this.localStorageData = {
      isLoggedIn: localStorage.getItem('isLoggedIn'),
      userId: localStorage.getItem('userId')
    };

    // Get users from database
    this.http.get<any[]>(`${EnvVariables.apiBaseUrl}/users`).subscribe({
      next: (users) => {
        this.usersData = users;
        this.analyzeUser();
      },
      error: (error) => {
        console.error('Error loading users:', error);
      }
    });

    // Get orders from database
    this.http.get<any[]>(`${EnvVariables.apiBaseUrl}/orders`).subscribe({
      next: (orders) => {
        this.ordersData = orders;
        this.analyzeOrders();
      },
      error: (error) => {
        console.error('Error loading orders:', error);
      }
    });
  }

  private analyzeUser(): void {
    const userId = localStorage.getItem('userId');
    const currentUser = this.usersData.find(user => user.user_id === userId);
    
    this.userAnalysis = {
      userId: userId,
      currentUser: currentUser,
      userFound: !!currentUser,
      userEmail: currentUser?.email,
      totalUsers: this.usersData.length
    };
  }

  private analyzeOrders(): void {
    const userId = localStorage.getItem('userId');
    const currentUser = this.usersData.find(user => user.user_id === userId);
    const userEmail = currentUser?.email;

    this.orderAnalysis = this.ordersData.map(order => {
      const orderEmail = order.customerInfo?.email;
      const matches = orderEmail === userEmail;
      
      return {
        orderNumber: order.orderNumber,
        orderEmail: orderEmail,
        userEmail: userEmail,
        matches: matches,
        customerInfo: order.customerInfo
      };
    });
  }
} 