import { Test, TestingModule } from '@nestjs/testing';
import { IdGeneratorService } from '../id-generator.service';

describe('IdGeneratorService', () => {
  let service: IdGeneratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IdGeneratorService],
    }).compile();

    service = module.get<IdGeneratorService>(IdGeneratorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateSecureOrderId', () => {
    it('should generate an ID with default length of 8 characters', () => {
      const id = service.generateSecureOrderId();
      expect(id).toBeDefined();
      expect(id.length).toBe(8);
    });

    it('should generate an ID with custom length', () => {
      const customLength = 12;
      const id = service.generateSecureOrderId(customLength);
      expect(id).toBeDefined();
      expect(id.length).toBe(customLength);
    });

    it('should generate an ID with only characters from default charset', () => {
      const defaultCharset = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
      const id = service.generateSecureOrderId();
      
      for (const char of id) {
        expect(defaultCharset).toContain(char);
      }
    });

    it('should generate an ID with only characters from custom charset', () => {
      const customCharset = 'ABC123';
      const id = service.generateSecureOrderId(8, customCharset);
      
      for (const char of id) {
        expect(customCharset).toContain(char);
      }
    });

    it('should generate unique IDs on multiple calls', () => {
      const ids = new Set();
      const iterations = 1000;
      
      for (let i = 0; i < iterations; i++) {
        const id = service.generateSecureOrderId();
        ids.add(id);
      }
      
      // With 8 characters from 32-char charset, collision probability is very low
      // We expect at least 99% unique IDs in 1000 iterations
      expect(ids.size).toBeGreaterThan(iterations * 0.99);
    });

    it('should handle edge case of length 1', () => {
      const id = service.generateSecureOrderId(1);
      expect(id).toBeDefined();
      expect(id.length).toBe(1);
    });

    it('should handle edge case of length 0', () => {
      const id = service.generateSecureOrderId(0);
      expect(id).toBeDefined();
      expect(id.length).toBe(0);
      expect(id).toBe('');
    });

    it('should handle single character charset', () => {
      const singleCharCharset = 'A';
      const id = service.generateSecureOrderId(5, singleCharCharset);
      expect(id).toBeDefined();
      expect(id.length).toBe(5);
      expect(id).toBe('AAAAA');
    });

    it('should not contain confusing characters (0, O, 1, I)', () => {
      const confusingChars = ['0', 'O', '1', 'I'];
      const id = service.generateSecureOrderId(100); // Generate longer ID for better coverage
      
      for (const confusingChar of confusingChars) {
        expect(id).not.toContain(confusingChar);
      }
    });

    it('should generate different IDs with same parameters', () => {
      const id1 = service.generateSecureOrderId(8);
      const id2 = service.generateSecureOrderId(8);
      
      // While theoretically they could be the same, the probability is extremely low
      expect(id1).not.toBe(id2);
    });

    it('should work with large custom charset', () => {
      const largeCharset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
      const id = service.generateSecureOrderId(10, largeCharset);
      
      expect(id).toBeDefined();
      expect(id.length).toBe(10);
      
      for (const char of id) {
        expect(largeCharset).toContain(char);
      }
    });
  });
}); 