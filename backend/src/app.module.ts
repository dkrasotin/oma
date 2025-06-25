import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { OrdersModule } from './local/orders/orders.module';

@Module({
  imports: [DatabaseModule, OrdersModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
