/**
 * WILLShop OS — Data Core Repository Interfaces
 * Pure Domain Layer — ZERO external dependencies.
 */

import {
  Customer,
  Supplier,
  Product,
  ProductStock,
  StockMovement,
  Order,
  OrderItem,
  Payment,
  Zone,
  Driver,
  Delivery,
  FinancialAccount,
  Transaction,
  Employee,
  Task,
  Campaign,
  Creative,
  AIMemory,
  AIAction,
  Goal,
} from '../entities/DataCoreEntities';

export interface ICustomerRepository {
  create(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer>;
  findById(id: string, orgId: string): Promise<Customer | null>;
  findByPhone(phone: string, orgId: string): Promise<Customer | null>;
  listByOrg(orgId: string): Promise<Customer[]>;
}

export interface IProductRepository {
  create(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product>;
  findById(id: string, orgId: string): Promise<Product | null>;
  findBySku(sku: string, orgId: string): Promise<Product | null>;
  listByOrg(orgId: string): Promise<Product[]>;
}

export interface IStockRepository {
  initializeStock(stock: Omit<ProductStock, 'id' | 'availableStock' | 'createdAt' | 'updatedAt'>): Promise<ProductStock>;
  getStock(productId: string, orgId: string): Promise<ProductStock | null>;
  listByOrg(orgId: string): Promise<ProductStock[]>;
  recordMovement(movement: Omit<StockMovement, 'id' | 'createdAt'>): Promise<StockMovement>;
  getMovements(productId: string, orgId: string): Promise<StockMovement[]>;
}

export interface IOrderRepository {
  createOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>, items: Omit<OrderItem, 'id' | 'createdAt'>[]): Promise<{ order: Order; items: OrderItem[] }>;
  findById(id: string, orgId: string): Promise<{ order: Order; items: OrderItem[] } | null>;
  listByOrg(orgId: string): Promise<Order[]>;
}

export interface IPaymentRepository {
  createPayment(payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Payment>;
  findById(id: string, orgId: string): Promise<Payment | null>;
  listByOrder(orderId: string, orgId: string): Promise<Payment[]>;
}

export interface IDeliveryRepository {
  createDelivery(delivery: Omit<Delivery, 'id' | 'createdAt' | 'updatedAt'>): Promise<Delivery>;
  findByOrderId(orderId: string, orgId: string): Promise<Delivery | null>;
  listByOrg(orgId: string): Promise<Delivery[]>;
}

import {
  ProductPerformanceSummary,
  CustomerRfmSegment,
  DriverPerformanceMetrics,
  ZoneDeliveryMetrics,
  DataQualityIssue,
} from '../entities/BIEntities';

export interface IAnalyticsRepository {
  getProductPerformance(orgId: string): Promise<ProductPerformanceSummary[]>;
  getCustomerRfmSegments(orgId: string): Promise<CustomerRfmSegment[]>;
  getDriverPerformance(orgId: string): Promise<DriverPerformanceMetrics[]>;
  getZonePerformance(orgId: string): Promise<ZoneDeliveryMetrics[]>;
  getDataQualityIssues(orgId: string): Promise<DataQualityIssue[]>;
  recordDataQualityIssue(issue: Omit<DataQualityIssue, 'id' | 'detectedAt'>): Promise<DataQualityIssue>;
}

import { FinancialObligationEntity, ObligationType } from '../entities/FinanceEntities';

export interface IFinanceRepository {
  createAccount(account: Omit<FinancialAccount, 'id' | 'createdAt' | 'updatedAt'>): Promise<FinancialAccount>;
  getAccount(id: string, orgId: string): Promise<FinancialAccount | null>;
  updateAccountBalance(id: string, orgId: string, newBalance: number): Promise<FinancialAccount>;
  listAccountsByOrg(orgId: string): Promise<FinancialAccount[]>;
  recordTransaction(transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction>;
  listTransactions(accountId: string, orgId: string): Promise<Transaction[]>;
  listAllTransactionsByOrg(orgId: string): Promise<Transaction[]>;
  createObligation(obligation: Omit<FinancialObligationEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<FinancialObligationEntity>;
  listObligationsByOrg(orgId: string, type?: ObligationType): Promise<FinancialObligationEntity[]>;
}

export interface IAIMemoryRepository {
  saveMemory(memory: Omit<AIMemory, 'id' | 'createdAt' | 'updatedAt'>): Promise<AIMemory>;
  getMemories(subjectType: string, subjectId: string, orgId?: string): Promise<AIMemory[]>;
}

export interface IAIActionRepository {
  recordAction(action: Omit<AIAction, 'id' | 'createdAt'>): Promise<AIAction>;
  getActionsByOrg(orgId: string): Promise<AIAction[]>;
}

export interface IGoalRepository {
  createGoal(goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Goal>;
  listGoals(orgId: string): Promise<Goal[]>;
}
