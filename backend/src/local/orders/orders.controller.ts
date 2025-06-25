import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { OrderService } from './orders.service';
import { Order } from '../../entities/order.entity';

@Controller('v1/orders')
export class OrdersController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  async findAll(
    @Query('paymentDescription') paymentDescription?: string,
    @Query('country') country?: string,
  ): Promise<Order[]> {
    return this.orderService.findAll(paymentDescription, country);
  }

  @Post()
  async create(@Body() orderData: Partial<Order>): Promise<Order> {
    return this.orderService.create(orderData);
  }

  @Get('countries')
  async getCountriesForFilter(): Promise<string[]> {
    return this.orderService.getCountriesForFilter();
  }
}
