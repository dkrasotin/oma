import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { OrderService, CreateOrderRequest } from '../services/order.service';

@Component({
  selector: 'app-order-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './order-create.component.html',
  styleUrl: './order-create.component.less'
})
export class OrderCreateComponent {
  protected showCreateForm = false;
  protected createOrderForm: FormGroup;
  protected submitting = false;
  protected error: string | null = null;
  protected successMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private orderService: OrderService
  ) {
    this.createOrderForm = this.fb.group({
      orderNumber: ['', [Validators.required]],
      paymentDescription: [''],
      street: [''],
      town: [''],
      country: [''],
      amount: ['', [Validators.min(0)]],
      currency: ['EUR'],
      paymentDueDate: ['']
    });
  }

  protected toggleCreateForm() {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.createOrderForm.reset();
      this.createOrderForm.patchValue({ currency: 'EUR' });
      this.error = null;
      this.successMessage = null;
    }
  }

  protected async onSubmitOrder() {
    if (this.createOrderForm.valid && !this.submitting) {
      this.submitting = true;
      this.error = null;
      this.successMessage = null;

      const formValue = this.createOrderForm.value;
      const orderData: CreateOrderRequest = {
        orderNumber: formValue.orderNumber,
        paymentDescription: formValue.paymentDescription || undefined,
        street: formValue.street || undefined,
        town: formValue.town || undefined,
        country: formValue.country || undefined,
        amount: formValue.amount ? Number(formValue.amount) : undefined,
        currency: formValue.currency || undefined,
        paymentDueDate: formValue.paymentDueDate || undefined
      };

      try {
        const createdOrder = await this.orderService.createOrder(orderData);
        this.createOrderForm.reset();
        this.createOrderForm.patchValue({ currency: 'EUR' });
        this.successMessage = `Order "${createdOrder.orderNumber}" created successfully!`;
        this.showCreateForm = false;
        this.submitting = false;
        
        setTimeout(() => {
          this.successMessage = null;
        }, 5000);
      } catch (err: any) {
        console.error('Create order error:', err);
        this.error = 'Failed to create order: ' + (err.error?.message || err.message);
        this.submitting = false;
      }
    }
  }
} 