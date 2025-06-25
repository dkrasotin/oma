import { Repository } from 'typeorm';
import { Order } from '../../entities/order.entity';
import { IdGeneratorService } from '../../utils/id-generator.service';
import { Injectable, Logger, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);
  
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private idGeneratorService: IdGeneratorService,
  ) {}

  /**
   * Retrieves all orders with optional filtering by payment description and country.
   * Orders are sorted with Estonia first, then by payment due date in ascending order.
   * 
   * @param paymentDescription Optional filter for payment description (partial match, case-insensitive)
   * @param country Optional filter for exact country match
   * @returns Promise<Order[]> Array of orders matching the filter criteria
   */
  async findAll(paymentDescription?: string, country?: string): Promise<Order[]> {
    // Put Estonia first
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .orderBy('CASE WHEN order.country = :estonia THEN 0 ELSE 1 END', 'ASC')
      .addOrderBy('order.paymentDueDate', 'ASC')
      .setParameters({ estonia: 'Estonia' });

    // Filter by paymentDescription (partial match, case-insensitive)
    if (paymentDescription) {
      queryBuilder.andWhere('LOWER(order.paymentDescription) LIKE LOWER(:paymentDescription)', {
        paymentDescription: `%${paymentDescription}%`
      });
    }

    // Filter by country (exact match)
    if (country) {
      queryBuilder.andWhere('order.country = :country', { country });
    }

    return queryBuilder.getMany();
  }

  /**
   * Creates a new order with a guaranteed unique order ID.
   * 
   * @param orderData Partial order data containing orderNumber and other properties
   * @returns Promise<Order> The created order
   * @throws UnprocessableEntityException if orderNumber already exists
   */
  async create(orderData: Partial<Order>): Promise<Order> {
    try {
      // Check if orderNumber is provided and unique
      if (orderData.orderNumber) {
        const existingOrder = await this.orderNumberExists(orderData.orderNumber);
        if (existingOrder) {
          throw new UnprocessableEntityException(`Order number '${orderData.orderNumber}' already exists`);
        }
      }

      // Generate a guaranteed unique order ID
      const orderId = await this.generateUniqueOrderId(8);
      
      const order = this.orderRepository.create({
        ...orderData,
        orderId,
      });
      
      const savedOrder = await this.orderRepository.save(order);
      this.logger.log(`Created order with ID: ${orderId}`);
      return savedOrder;
      
    } catch (error) {
      this.logger.error('Error creating order:', error);
      throw error;
    }
  }

  /**
   * Get a list of distinct countries from all orders
   * @returns Array of unique country names
   */
  async getCountriesForFilter(): Promise<string[]> {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select('DISTINCT order.country', 'country')
      .where('order.country IS NOT NULL')
      .andWhere('order.country != :empty', { empty: '' })
      .orderBy('order.country', 'ASC')
      .getRawMany();

    return result.map(row => row.country);
  }

  /**
   * Check if an order number already exists in the database
   * @param orderNumber The order number to check
   * @returns True if the order number exists, false otherwise
   */
  async orderNumberExists(orderNumber: string): Promise<boolean> {
    const count = await this.orderRepository.count({ where: { orderNumber } });
    return count > 0;
  }

  /**
   * Check if an order ID already exists in the database
   * @param orderId The order ID to check
   * @returns True if the order ID exists, false otherwise
   */
  async orderIdExists(orderId: string): Promise<boolean> {
    const count = await this.orderRepository.count({ where: { orderId } });
    return count > 0;
  }

  /**
   * Generate a guaranteed unique order ID
   * @param length Length of the order ID
   * @param maxAttempts Maximum number of attempts before giving up
   * @returns A unique order ID
   */
  async generateUniqueOrderId(length: number = 8, maxAttempts: number = 10): Promise<string> {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      // Increment the order ID length by 1 if first two attempts fail
      const orderId = this.idGeneratorService.generateSecureOrderId(length + (attempts > 1 ? attempts - 1 : 0));
      const exists = await this.orderIdExists(orderId);
      
      if (!exists) {
        return orderId;
      }
      
      attempts++;
      this.logger.warn(`Order ID ${orderId} already exists, retry attempt ${attempts}/${maxAttempts}`);
    }
    
    throw new Error(`Failed to generate unique order ID after ${maxAttempts} attempts`);
  }
}
