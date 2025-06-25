import { Component, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService, Order } from '../services/order.service';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './order-list.component.html',
  styleUrl: './order-list.component.less'
})
export class OrderListComponent implements OnInit {
  protected orders: Order[] = [];
  protected loading = true;
  protected error: string | null = null;
  protected countries: string[] = [];
  protected loadingCountries = false;
  
  protected paymentDescriptionFilter = '';
  protected countryFilter = '';

  constructor(private orderService: OrderService) {
    effect(() => {
      this.orders = this.orderService.orders();
      if (this.loading) {
        this.loading = false;
      }
    });

    effect(() => {
      this.countries = this.orderService.countries();
    });
  }

  async ngOnInit() {
    await this.loadCountries();
    await this.loadOrders();
  }

  private async loadCountries() {
    this.loadingCountries = true;
    try {
      await this.orderService.getCountriesForFilter();
      this.loadingCountries = false;
    } catch (err) {
      console.error('Failed to load countries:', err);
      this.loadingCountries = false;
    }
  }

  private async loadOrders() {
    this.loading = true;
    this.error = null;
    
    const paymentDescription = this.paymentDescriptionFilter || undefined;
    const country = this.countryFilter || undefined;
    
    try {
      await this.orderService.loadOrders(paymentDescription, country);
      this.loading = false;
    } catch (err: any) {
      console.error('API Error:', err);
      this.error = 'Failed to load orders: ' + err.message;
      this.loading = false;
    }
  }

  protected async applyFilters() {
    await this.loadOrders();
  }

  protected async clearFilters() {
    this.paymentDescriptionFilter = '';
    this.countryFilter = '';
    await this.loadOrders();
  }
} 