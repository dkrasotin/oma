import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from '../orders.controller';
import { OrderService } from '../orders.service';
import { Order } from '../../../entities/order.entity';
import { UnprocessableEntityException } from '@nestjs/common';

describe('OrdersController', () => {
  let controller: OrdersController;
  let service: OrderService;

  const mockOrder: Order = {
    id: 1,
    orderId: 'ORD-12345678',
    orderNumber: 'ON-001',
    paymentDescription: 'Test payment',
    street: '123 Test St',
    town: 'Test Town',
    country: 'Estonia',
    amount: 100.50,
    currency: 'EUR',
    paymentDueDate: new Date('2024-12-31'),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOrderService = {
    findAll: jest.fn(),
    create: jest.fn(),
    getCountriesForFilter: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrderService,
          useValue: mockOrderService,
        },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
    service = module.get<OrderService>(OrderService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return an array of orders without filters', async () => {
      const expectedOrders = [mockOrder];
      mockOrderService.findAll.mockResolvedValue(expectedOrders);

      const result = await controller.findAll();

      expect(result).toEqual(expectedOrders);
      expect(service.findAll).toHaveBeenCalledWith(undefined, undefined);
    });

    it('should return filtered orders by payment description', async () => {
      const expectedOrders = [mockOrder];
      const paymentDescription = 'test';
      mockOrderService.findAll.mockResolvedValue(expectedOrders);

      const result = await controller.findAll(paymentDescription);

      expect(result).toEqual(expectedOrders);
      expect(service.findAll).toHaveBeenCalledWith(paymentDescription, undefined);
    });

    it('should return filtered orders by country', async () => {
      const expectedOrders = [mockOrder];
      const country = 'Estonia';
      mockOrderService.findAll.mockResolvedValue(expectedOrders);

      const result = await controller.findAll(undefined, country);

      expect(result).toEqual(expectedOrders);
      expect(service.findAll).toHaveBeenCalledWith(undefined, country);
    });

    it('should return filtered orders by both payment description and country', async () => {
      const expectedOrders = [mockOrder];
      const paymentDescription = 'test';
      const country = 'Estonia';
      mockOrderService.findAll.mockResolvedValue(expectedOrders);

      const result = await controller.findAll(paymentDescription, country);

      expect(result).toEqual(expectedOrders);
      expect(service.findAll).toHaveBeenCalledWith(paymentDescription, country);
    });

    it('should return empty array when no orders match filters', async () => {
      mockOrderService.findAll.mockResolvedValue([]);

      const result = await controller.findAll('nonexistent', 'NonExistentCountry');

      expect(result).toEqual([]);
      expect(service.findAll).toHaveBeenCalledWith('nonexistent', 'NonExistentCountry');
    });
  });

  describe('create', () => {
    it('should create a new order successfully', async () => {
      const orderData: Partial<Order> = {
        orderNumber: 'ON-002',
        paymentDescription: 'New payment',
        country: 'Latvia',
        amount: 200.00,
        currency: 'EUR',
      };
      const createdOrder = { ...mockOrder, ...orderData };
      mockOrderService.create.mockResolvedValue(createdOrder);

      const result = await controller.create(orderData);

      expect(result).toEqual(createdOrder);
      expect(service.create).toHaveBeenCalledWith(orderData);
    });

    it('should handle order creation with minimal data', async () => {
      const orderData: Partial<Order> = {
        orderNumber: 'ON-003',
      };
      const createdOrder = { ...mockOrder, ...orderData };
      mockOrderService.create.mockResolvedValue(createdOrder);

      const result = await controller.create(orderData);

      expect(result).toEqual(createdOrder);
      expect(service.create).toHaveBeenCalledWith(orderData);
    });

    it('should propagate service errors', async () => {
      const orderData: Partial<Order> = {
        orderNumber: 'ON-001', // Duplicate order number
      };
      const error = new UnprocessableEntityException("Order number 'ON-001' already exists");
      mockOrderService.create.mockRejectedValue(error);

      await expect(controller.create(orderData)).rejects.toThrow(error);
      expect(service.create).toHaveBeenCalledWith(orderData);
    });
  });

  describe('getCountriesForFilter', () => {
    it('should return an array of unique countries', async () => {
      const expectedCountries = ['Estonia', 'Latvia', 'Lithuania'];
      mockOrderService.getCountriesForFilter.mockResolvedValue(expectedCountries);

      const result = await controller.getCountriesForFilter();

      expect(result).toEqual(expectedCountries);
      expect(service.getCountriesForFilter).toHaveBeenCalledWith();
    });

    it('should return empty array when no countries exist', async () => {
      mockOrderService.getCountriesForFilter.mockResolvedValue([]);

      const result = await controller.getCountriesForFilter();

      expect(result).toEqual([]);
      expect(service.getCountriesForFilter).toHaveBeenCalledWith();
    });

    it('should handle service errors', async () => {
      const error = new Error('Database connection failed');
      mockOrderService.getCountriesForFilter.mockRejectedValue(error);

      await expect(controller.getCountriesForFilter()).rejects.toThrow(error);
      expect(service.getCountriesForFilter).toHaveBeenCalledWith();
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
}); 