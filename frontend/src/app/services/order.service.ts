import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface Order {
  id: number;
  orderId: string;
  orderNumber: string;
  paymentDescription?: string;
  street?: string;
  town?: string;
  country?: string;
  amount?: number;
  currency?: string;
  paymentDueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrderRequest {
  orderNumber: string;
  paymentDescription?: string;
  street?: string;
  town?: string;
  country?: string;
  amount?: number;
  currency?: string;
  paymentDueDate?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly apiUrl = this.getApiUrl();
  
  private ordersSignal = signal<Order[]>([]);
  private countriesSignal = signal<string[]>([]);
  
  public readonly orders = this.ordersSignal.asReadonly();
  public readonly countries = this.countriesSignal.asReadonly();

  constructor(private http: HttpClient) {}

  private getApiUrl(): string {
    return 'http://localhost:3000';
  }

  async loadOrders(paymentDescription?: string, country?: string): Promise<Order[]> {
    let params = new HttpParams();
    
    if (paymentDescription && paymentDescription.trim()) {
      params = params.set('paymentDescription', paymentDescription.trim());
    }
    
    if (country && country.trim()) {
      params = params.set('country', country.trim());
    }

    try {
      const orders = await firstValueFrom(this.http.get<Order[]>(`${this.apiUrl}/v1/orders`, { params }));
      if (orders) {
        this.ordersSignal.set(orders);
        return orders;
      }
      return [];
    } catch (error) {
      throw error;
    }
  }

  async getCountriesForFilter(): Promise<string[]> {
    try {
      const countries = await firstValueFrom(this.http.get<string[]>(`${this.apiUrl}/v1/orders/countries`));
      if (countries) {
        const sortedCountries = countries.sort();
        this.countriesSignal.set(sortedCountries);
        return sortedCountries;
      }
      return [];
    } catch (error) {
      throw error;
    }
  }

  async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    try {
      const newOrder = await firstValueFrom(this.http.post<Order>(`${this.apiUrl}/v1/orders`, orderData));
      if (newOrder) {
        await this.reloadOrdersAndCountries();
        return newOrder;
      }
      throw new Error('Failed to create order');
    } catch (error) {
      throw error;
    }
  }

  async reloadOrdersAndCountries(paymentDescription?: string, country?: string): Promise<void> {
    try {
      await Promise.all([
        this.loadOrders(paymentDescription, country),
        this.getCountriesForFilter()
      ]);
    } catch (error) {
      console.error('Failed to reload orders and countries:', error);
      throw error;
    }
  }

  getOrdersValue(): Order[] {
    return this.ordersSignal();
  }

  getCountriesValue(): string[] {
    return this.countriesSignal();
  }
} 