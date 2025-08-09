import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AdminAuthService } from '../../../services/admin-auth.service';
import { DashboardStats } from '../../../models/admin';
import { AdminNavComponent } from '../../../components/admin-nav/admin-nav';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, AdminNavComponent, BaseChartDirective],
  providers: [provideCharts(withDefaultRegisterables())],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css', '../admin-global.css']
})
export class AdminDashboardComponent implements OnInit {
  // Dashboard statistics
  stats: DashboardStats = {
    totalProducts: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0
  };

  // Additional KPIs
  orderedOrders = 0;


  // Monthly aggregates (last 6-12 months)
  monthlySales: { month: string; sales: number; profit: number; }[] = [];
  cancelledOrders = 0;

  // Charts - line
  lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    elements: { point: { radius: 3 }, line: { tension: 0.25 } },
    scales: { x: { grid: { display: false } }, y: { grid: { color: '#e5e7eb' } } }
  };
  salesChartData: ChartData<'line'> = { labels: [], datasets: [{ data: [], label: 'Sales', borderColor: '#1e40af', backgroundColor: 'rgba(30,64,175,0.1)', fill: false }] };
  profitChartData: ChartData<'line'> = { labels: [], datasets: [{ data: [], label: 'Profit', borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', fill: false }] };

  // Charts - bar (order status)
  barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { grid: { display: false } }, y: { beginAtZero: true } }
  };
  statusBarData: ChartData<'bar'> = { labels: ['Processing', 'Shipped', 'Delivered', 'Cancelled'], datasets: [{ data: [0, 0, 0, 0], backgroundColor: ['#60a5fa', '#3b82f6', '#10b981', '#ef4444'] }] };

  // Charts - doughnut (stock availability)
  doughnutOptions: ChartOptions<'doughnut'> = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } };
  stockDoughnutData: ChartData<'doughnut'> = { labels: ['In Stock', 'Low Stock', 'Out of Stock'], datasets: [{ data: [0, 0, 0], backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'] }] };

  // UI state
  // notifications removed

  // Loading state
  isLoading = true;

  // Recent orders for quick view
  recentOrders: any[] = [];

  // Low stock products
  lowStockProducts: any[] = [];

  constructor(
    private http: HttpClient,
    public adminAuth: AdminAuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  /**
   * Load all dashboard data - beginner friendly approach!
   */
  loadDashboardData(): void {
    this.isLoading = true;

    // Load statistics from the database
    Promise.all([
      this.loadProducts(),
      this.loadOrders(),
      this.loadCustomers(),
    ]).then(() => {
      this.isLoading = false;
      console.log('✅ Dashboard data loaded successfully');
    }).catch(error => {
      console.error('❌ Error loading dashboard data:', error);
      this.isLoading = false;
    });
  }

  /**
   * Load products data and calculate statistics
   */
  private loadProducts(): Promise<void> {
    return firstValueFrom(this.http.get<any[]>('http://localhost:3000/products'))
      .then(products => {
        if (products) {
          this.stats.totalProducts = products.length;
          
          // Find low stock products (stock <= 10)
          this.lowStockProducts = products
            .filter(product => (product.stock ?? 0) <= 10)
            .slice(0, 5); // Show only first 5

          // Stock availability counts
          const counts = { in: 0, low: 0, out: 0 };
          products.forEach(p => {
            const s = p.stock ?? 0;
            if (s <= 0) counts.out++; else if (s <= 10) counts.low++; else counts.in++;
          });
          this.stockDoughnutData = {
            labels: ['In Stock', 'Low Stock', 'Out of Stock'],
            datasets: [{ data: [counts.in, counts.low, counts.out], backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'] }]
          };
        }
      });
  }

  /**
   * Load orders data and calculate statistics
   */
  private loadOrders(): Promise<void> {
    return firstValueFrom(this.http.get<any[]>('http://localhost:3000/orders'))
      .then(orders => {
        if (orders) {
          this.stats.totalOrders = orders.length;
          
          // Calculate revenue
          this.stats.totalRevenue = orders.reduce((total, order) => {
            return total + (order.total || 0);
          }, 0);

          // Count orders by status
          this.orderedOrders = orders.filter(order => 
            order.orderStatus === 'confirmed' || order.orderStatus === 'processing'
          ).length;

          const processing = orders.filter(o => o.orderStatus === 'processing').length;
          const shipped = orders.filter(o => o.orderStatus === 'shipped').length;
          const delivered = orders.filter(o => o.orderStatus === 'delivered').length;
          const cancelled = orders.filter(o => o.orderStatus === 'cancelled').length;

          this.stats.pendingOrders = orders.filter(order => order.orderStatus === 'pending').length;
          this.stats.shippedOrders = shipped;
          this.stats.deliveredOrders = delivered;
          this.cancelledOrders = cancelled;

          this.statusBarData = {
            labels: ['Processing', 'Shipped', 'Delivered', 'Cancelled'],
            datasets: [{ data: [processing, shipped, delivered, cancelled], backgroundColor: ['#60a5fa', '#3b82f6', '#10b981', '#ef4444'] }]
          };

          // Monthly aggregates (last 6 months)
          const byMonth: { [key: string]: { sales: number; profit: number; } } = {};
          orders.forEach(order => {
            const d = new Date(order.orderDate);
            const key = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}`;
            const sales = order.total || 0;
            // Profit rough estimate: 20% margin
            const profit = sales * 0.2;
            byMonth[key] = byMonth[key] || { sales: 0, profit: 0 };
            byMonth[key].sales += sales;
            byMonth[key].profit += profit;
          });
          this.monthlySales = Object.keys(byMonth)
            .sort()
            .slice(-6)
            .map(key => ({ month: key, sales: byMonth[key].sales, profit: byMonth[key].profit }));

          // Update line charts
          const labels = this.monthlySales.map(m => m.month);
          const salesData = this.monthlySales.map(m => m.sales);
          const profitData = this.monthlySales.map(m => m.profit);
          this.salesChartData = { labels, datasets: [{ data: salesData, label: 'Sales', borderColor: '#1e40af', backgroundColor: 'rgba(30,64,175,0.1)', fill: false }] };
          this.profitChartData = { labels, datasets: [{ data: profitData, label: 'Profit', borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', fill: false }] };

          // Get recent orders (last 5)
          this.recentOrders = orders
            .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
            .slice(0, 5);
        }
      });
  }

  /**
   * Load customers data and calculate statistics
   */
  private loadCustomers(): Promise<void> {
    return firstValueFrom(this.http.get<any[]>('http://localhost:3000/users'))
      .then(customers => {
        if (customers) {
          this.stats.totalCustomers = customers.length;
        }
      });
  }

  // UI helpers
  percent(value: number, total: number): number {
    if (!total) return 0;
    return Math.round((value / total) * 100);
  }

  /**
   * Format currency for display - beginner friendly!
   */
  formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`;
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  /**
   * Get status badge class for orders
   */
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'pending':
      case 'confirmed':
        return 'badge-warning';
      case 'processing':
        return 'badge-info';
      case 'shipped':
        return 'badge-primary';
      case 'delivered':
        return 'badge-success';
      case 'cancelled':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  }

  /**
   * Admin logout - clear session and redirect to home
   */
  onAdminLogout(): void {
    this.adminAuth.logout();
    console.log('🔓 Admin logged out successfully');
    this.router.navigate(['/']);
  }
} 