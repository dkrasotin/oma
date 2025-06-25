import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Logger, UnprocessableEntityException } from '@nestjs/common';
import { OrderService } from '../orders.service';
import { Order } from '../../../entities/order.entity';
import { IdGeneratorService } from '../../../utils/id-generator.service';

describe('OrderService', () => {
  let service: OrderService;
  let repository: jest.Mocked<Repository<Order>>;
  let idGeneratorService: jest.Mocked<IdGeneratorService>;
  let queryBuilder: jest.Mocked<SelectQueryBuilder<Order>>;

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

  beforeEach(async () => {
    // Create mock query builder
    queryBuilder = {
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      setParameters: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getRawMany: jest.fn(),
    } as any;

    const mockRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      create: jest.fn(),
      save: jest.fn(),
      count: jest.fn(),
    };

    const mockIdGeneratorService = {
      generateSecureOrderId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: getRepositoryToken(Order),
          useValue: mockRepository,
        },
        {
          provide: IdGeneratorService,
          useValue: mockIdGeneratorService,
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    repository = module.get(getRepositoryToken(Order));
    idGeneratorService = module.get(IdGeneratorService);

    // Mock Logger to avoid console output during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all orders without filters', async () => {
      const expectedOrders = [mockOrder];
      queryBuilder.getMany.mockResolvedValue(expectedOrders);

      const result = await service.findAll();

      expect(result).toEqual(expectedOrders);
      expect(repository.createQueryBuilder).toHaveBeenCalledWith('order');
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('CASE WHEN order.country = :estonia THEN 0 ELSE 1 END', 'ASC');
      expect(queryBuilder.addOrderBy).toHaveBeenCalledWith('order.paymentDueDate', 'ASC');
      expect(queryBuilder.setParameters).toHaveBeenCalledWith({ estonia: 'Estonia' });
      expect(queryBuilder.andWhere).not.toHaveBeenCalled();
    });

    it('should filter orders by payment description', async () => {
      const expectedOrders = [mockOrder];
      const paymentDescription = 'test';
      queryBuilder.getMany.mockResolvedValue(expectedOrders);

      const result = await service.findAll(paymentDescription);

      expect(result).toEqual(expectedOrders);
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'LOWER(order.paymentDescription) LIKE LOWER(:paymentDescription)',
        { paymentDescription: '%test%' }
      );
    });

    it('should filter orders by country', async () => {
      const expectedOrders = [mockOrder];
      const country = 'Estonia';
      queryBuilder.getMany.mockResolvedValue(expectedOrders);

      const result = await service.findAll(undefined, country);

      expect(result).toEqual(expectedOrders);
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('order.country = :country', { country });
    });

    it('should filter orders by both payment description and country', async () => {
      const expectedOrders = [mockOrder];
      const paymentDescription = 'test';
      const country = 'Estonia';
      queryBuilder.getMany.mockResolvedValue(expectedOrders);

      const result = await service.findAll(paymentDescription, country);

      expect(result).toEqual(expectedOrders);
      expect(queryBuilder.andWhere).toHaveBeenCalledTimes(2);
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'LOWER(order.paymentDescription) LIKE LOWER(:paymentDescription)',
        { paymentDescription: '%test%' }
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('order.country = :country', { country });
    });

    it('should return empty array when no orders found', async () => {
      queryBuilder.getMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    beforeEach(() => {
      // Mock generateUniqueOrderId to avoid complex async logic in tests
      jest.spyOn(service, 'generateUniqueOrderId').mockResolvedValue('ORD-UNIQUE123');
    });

    it('should create a new order successfully', async () => {
      const orderData: Partial<Order> = {
        orderNumber: 'ON-002',
        paymentDescription: 'New payment',
        country: 'Latvia',
        amount: 200.00,
        currency: 'EUR',
      };
      const createdOrder = { ...mockOrder, ...orderData, orderId: 'ORD-UNIQUE123' };
      
      jest.spyOn(service, 'orderNumberExists').mockResolvedValue(false);
      repository.create.mockReturnValue(createdOrder as any);
      repository.save.mockResolvedValue(createdOrder);

      const result = await service.create(orderData);

      expect(result).toEqual(createdOrder);
      expect(service.orderNumberExists).toHaveBeenCalledWith('ON-002');
      expect(service.generateUniqueOrderId).toHaveBeenCalledWith(8);
      expect(repository.create).toHaveBeenCalledWith({
        ...orderData,
        orderId: 'ORD-UNIQUE123',
      });
      expect(repository.save).toHaveBeenCalledWith(createdOrder);
    });

    it('should create order without checking orderNumber when not provided', async () => {
      const orderData: Partial<Order> = {
        paymentDescription: 'Payment without order number',
      };
      const createdOrder = { ...mockOrder, ...orderData, orderId: 'ORD-UNIQUE123' };
      
      const orderNumberExistsSpy = jest.spyOn(service, 'orderNumberExists');
      repository.create.mockReturnValue(createdOrder as any);
      repository.save.mockResolvedValue(createdOrder);

      const result = await service.create(orderData);

      expect(result).toEqual(createdOrder);
      expect(orderNumberExistsSpy).not.toHaveBeenCalled();
      expect(service.generateUniqueOrderId).toHaveBeenCalledWith(8);
    });

    it('should throw UnprocessableEntityException when orderNumber already exists', async () => {
      const orderData: Partial<Order> = {
        orderNumber: 'ON-001',
      };
      
      jest.spyOn(service, 'orderNumberExists').mockResolvedValue(true);

      await expect(service.create(orderData)).rejects.toThrow(
        new UnprocessableEntityException("Order number 'ON-001' already exists")
      );
      expect(service.orderNumberExists).toHaveBeenCalledWith('ON-001');
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should handle database errors during save', async () => {
      const orderData: Partial<Order> = {
        orderNumber: 'ON-002',
      };
      const error = new Error('Database connection failed');
      
      jest.spyOn(service, 'orderNumberExists').mockResolvedValue(false);
      repository.create.mockReturnValue(mockOrder as any);
      repository.save.mockRejectedValue(error);

      await expect(service.create(orderData)).rejects.toThrow(error);
    });
  });

  describe('getCountriesForFilter', () => {
    it('should return unique countries sorted alphabetically', async () => {
      const mockRawResult = [
        { country: 'Estonia' },
        { country: 'Latvia' },
        { country: 'Lithuania' },
      ];
      queryBuilder.getRawMany.mockResolvedValue(mockRawResult);

      const result = await service.getCountriesForFilter();

      expect(result).toEqual(['Estonia', 'Latvia', 'Lithuania']);
      expect(repository.createQueryBuilder).toHaveBeenCalledWith('order');
      expect(queryBuilder.select).toHaveBeenCalledWith('DISTINCT order.country', 'country');
      expect(queryBuilder.where).toHaveBeenCalledWith('order.country IS NOT NULL');
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('order.country != :empty', { empty: '' });
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('order.country', 'ASC');
    });

    it('should return empty array when no countries exist', async () => {
      queryBuilder.getRawMany.mockResolvedValue([]);

      const result = await service.getCountriesForFilter();

      expect(result).toEqual([]);
    });
  });

  describe('orderNumberExists', () => {
    it('should return true when order number exists', async () => {
      repository.count.mockResolvedValue(1);

      const result = await service.orderNumberExists('ON-001');

      expect(result).toBe(true);
      expect(repository.count).toHaveBeenCalledWith({ where: { orderNumber: 'ON-001' } });
    });

    it('should return false when order number does not exist', async () => {
      repository.count.mockResolvedValue(0);

      const result = await service.orderNumberExists('ON-999');

      expect(result).toBe(false);
      expect(repository.count).toHaveBeenCalledWith({ where: { orderNumber: 'ON-999' } });
    });
  });

  describe('orderIdExists', () => {
    it('should return true when order ID exists', async () => {
      repository.count.mockResolvedValue(1);

      const result = await service.orderIdExists('ORD-12345678');

      expect(result).toBe(true);
      expect(repository.count).toHaveBeenCalledWith({ where: { orderId: 'ORD-12345678' } });
    });

    it('should return false when order ID does not exist', async () => {
      repository.count.mockResolvedValue(0);

      const result = await service.orderIdExists('ORD-NONEXIST');

      expect(result).toBe(false);
      expect(repository.count).toHaveBeenCalledWith({ where: { orderId: 'ORD-NONEXIST' } });
    });
  });

  describe('generateUniqueOrderId', () => {
    beforeEach(() => {
      // Restore the original method for these tests
      jest.restoreAllMocks();
      jest.spyOn(Logger.prototype, 'log').mockImplementation();
      jest.spyOn(Logger.prototype, 'error').mockImplementation();
      jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    });

    it('should generate unique order ID on first attempt', async () => {
      const generatedId = 'ORD-ABCD1234';
      idGeneratorService.generateSecureOrderId.mockReturnValue(generatedId);
      jest.spyOn(service, 'orderIdExists').mockResolvedValue(false);

      const result = await service.generateUniqueOrderId(8);

      expect(result).toBe(generatedId);
      expect(idGeneratorService.generateSecureOrderId).toHaveBeenCalledWith(8);
      expect(service.orderIdExists).toHaveBeenCalledWith(generatedId);
    });

    it('should retry and generate unique order ID on second attempt', async () => {
      const firstId = 'ORD-ABCD1234';
      const secondId = 'ORD-EFGH5678';
      idGeneratorService.generateSecureOrderId
        .mockReturnValueOnce(firstId)
        .mockReturnValueOnce(secondId);
      jest.spyOn(service, 'orderIdExists')
        .mockResolvedValueOnce(true)  // First ID exists
        .mockResolvedValueOnce(false); // Second ID is unique

      const result = await service.generateUniqueOrderId(8);

      expect(result).toBe(secondId);
      expect(idGeneratorService.generateSecureOrderId).toHaveBeenCalledTimes(2);
      expect(service.orderIdExists).toHaveBeenCalledTimes(2);
    });

    it('should increase length after second retry attempt', async () => {
      const ids = ['ORD-1234', 'ORD-5678', 'ORD-ABCDEF'];
      idGeneratorService.generateSecureOrderId
        .mockReturnValueOnce(ids[0])
        .mockReturnValueOnce(ids[1])
        .mockReturnValueOnce(ids[2]);
      jest.spyOn(service, 'orderIdExists')
        .mockResolvedValueOnce(true)  // First attempt fails
        .mockResolvedValueOnce(true)  // Second attempt fails
        .mockResolvedValueOnce(false); // Third attempt succeeds

      const result = await service.generateUniqueOrderId(4);

      expect(result).toBe(ids[2]);
      expect(idGeneratorService.generateSecureOrderId).toHaveBeenNthCalledWith(1, 4); // Initial length
      expect(idGeneratorService.generateSecureOrderId).toHaveBeenNthCalledWith(2, 4); // Second attempt, no increase yet
      expect(idGeneratorService.generateSecureOrderId).toHaveBeenNthCalledWith(3, 5); // Third attempt, length increased
    });

    it('should throw error after maximum attempts', async () => {
      const maxAttempts = 3;
      idGeneratorService.generateSecureOrderId.mockReturnValue('ORD-DUPLICATE');
      jest.spyOn(service, 'orderIdExists').mockResolvedValue(true); // Always exists

      await expect(service.generateUniqueOrderId(8, maxAttempts)).rejects.toThrow(
        `Failed to generate unique order ID after ${maxAttempts} attempts`
      );
      expect(idGeneratorService.generateSecureOrderId).toHaveBeenCalledTimes(maxAttempts);
    });

    it('should use default parameters when not provided', async () => {
      const generatedId = 'ORD-DEFAULT1';
      idGeneratorService.generateSecureOrderId.mockReturnValue(generatedId);
      jest.spyOn(service, 'orderIdExists').mockResolvedValue(false);

      const result = await service.generateUniqueOrderId();

      expect(result).toBe(generatedId);
      expect(idGeneratorService.generateSecureOrderId).toHaveBeenCalledWith(8); // Default length
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
}); 