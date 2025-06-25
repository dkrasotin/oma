import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrderService } from './orders.service';
import { Order } from '../../entities/order.entity';
import { IdGeneratorService } from '../../utils/id-generator.service';

@Module({
  imports: [TypeOrmModule.forFeature([Order])],
  controllers: [OrdersController],
  providers: [OrderService, IdGeneratorService],
  exports: [OrderService],
})
export class OrdersModule {}
