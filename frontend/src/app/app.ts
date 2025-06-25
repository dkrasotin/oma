import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OrderCreateComponent } from './order-create/order-create.component';
import { OrderListComponent } from './order-list/order-list.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, OrderCreateComponent, OrderListComponent],
  templateUrl: './app.html',
  styleUrl: './app.less'
})
export class App {
  protected title = 'Orders management';
}
