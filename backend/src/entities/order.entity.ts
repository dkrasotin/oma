import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  orderId: string;

  @Column({ unique: true })
  orderNumber: string;

  @Column({ nullable: true })
  paymentDescription: string;

  @Column({ nullable: true })
  street: string;

  @Column({ nullable: true })
  town: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ nullable: true })
  currency: string;

  @Column({ nullable: true })
  paymentDueDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}