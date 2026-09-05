/**
 * WILLShop OS — In-Memory Data Core Repositories for Unit & Integration Testing
 * Infrastructure Layer.
 */

import {
  ICustomerRepository,
  IProductRepository,
  IStockRepository,
  IOrderRepository,
  IPaymentRepository,
  IDeliveryRepository,
  IFinanceRepository,
  IAIMemoryRepository,
  IAIActionRepository,
  IGoalRepository,
} from '../../domain/interfaces/IDataCoreRepositories';

import {
  Customer,
  Product,
  ProductStock,
  StockMovement,
  Order,
  OrderItem,
  Payment,
  Delivery,
  FinancialAccount,
  Transaction,
  AIMemory,
  AIAction,
  Goal,
} from '../../domain/entities/DataCoreEntities';

export class InMemoryCustomerRepository implements ICustomerRepository {
  private customers: Map<string, Customer> = new Map();

  async create(dto: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    const customer: Customer = {
      ...dto,
      id: `cust-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      fullName: `${dto.firstName} ${dto.lastName}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.customers.set(customer.id, customer);
    return customer;
  }

  async findById(id: string, orgId: string): Promise<Customer | null> {
    const cust = this.customers.get(id);
    if (cust && cust.organizationId === orgId && !cust.deletedAt) return cust;
    return null;
  }

  async findByPhone(phone: string, orgId: string): Promise<Customer | null> {
    for (const cust of this.customers.values()) {
      if (cust.phone === phone && cust.organizationId === orgId && !cust.deletedAt) return cust;
    }
    return null;
  }

  async listByOrg(orgId: string): Promise<Customer[]> {
    return Array.from(this.customers.values()).filter(
      (c) => c.organizationId === orgId && !c.deletedAt
    );
  }
}

export class InMemoryProductRepository implements IProductRepository {
  private products: Map<string, Product> = new Map();

  async create(dto: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const product: Product = {
      ...dto,
      id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.products.set(product.id, product);
    return product;
  }

  async findById(id: string, orgId: string): Promise<Product | null> {
    const prod = this.products.get(id);
    if (prod && prod.organizationId === orgId && !prod.deletedAt) return prod;
    return null;
  }

  async findBySku(sku: string, orgId: string): Promise<Product | null> {
    for (const prod of this.products.values()) {
      if (prod.sku === sku && prod.organizationId === orgId && !prod.deletedAt) return prod;
    }
    return null;
  }

  async listByOrg(orgId: string): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (p) => p.organizationId === orgId && !p.deletedAt
    );
  }
}

export class InMemoryStockRepository implements IStockRepository {
  private stocks: Map<string, ProductStock> = new Map();
  private movements: StockMovement[] = [];

  private key(productId: string, orgId: string) {
    return `${orgId}:${productId}`;
  }

  async initializeStock(dto: Omit<ProductStock, 'id' | 'availableStock' | 'createdAt' | 'updatedAt'>): Promise<ProductStock> {
    const stock: ProductStock = {
      ...dto,
      id: `stock-${Date.now()}`,
      availableStock: dto.physicalStock - dto.reservedStock,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.stocks.set(this.key(dto.productId, dto.organizationId), stock);
    return stock;
  }

  async getStock(productId: string, orgId: string): Promise<ProductStock | null> {
    return this.stocks.get(this.key(productId, orgId)) || null;
  }

  async recordMovement(dto: Omit<StockMovement, 'id' | 'createdAt'>): Promise<StockMovement> {
    const movement: StockMovement = {
      ...dto,
      id: `mvt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date(),
    };
    this.movements.push(movement);

    // Update current product stock accordingly
    const current = await this.getStock(dto.productId, dto.organizationId);
    if (current) {
      if (dto.direction === 'IN') current.physicalStock += dto.quantity;
      if (dto.direction === 'OUT') current.physicalStock -= dto.quantity;
      if (dto.direction === 'RESERVE') current.reservedStock += dto.quantity;
      if (dto.direction === 'RELEASE') current.reservedStock -= dto.quantity;

      current.availableStock = current.physicalStock - current.reservedStock;
      current.updatedAt = new Date();
      this.stocks.set(this.key(dto.productId, dto.organizationId), current);
    }

    return movement;
  }

  async getMovements(productId: string, orgId: string): Promise<StockMovement[]> {
    return this.movements.filter((m) => m.productId === productId && m.organizationId === orgId);
  }
}

export class InMemoryOrderRepository implements IOrderRepository {
  private orders: Map<string, Order> = new Map();
  private items: OrderItem[] = [];

  async createOrder(
    orderDto: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>,
    itemsDto: Omit<OrderItem, 'id' | 'createdAt'>[]
  ): Promise<{ order: Order; items: OrderItem[] }> {
    const order: Order = {
      ...orderDto,
      id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.orders.set(order.id, order);

    const createdItems: OrderItem[] = itemsDto.map((it) => ({
      ...it,
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      orderId: order.id,
      createdAt: new Date(),
    }));

    this.items.push(...createdItems);
    return { order, items: createdItems };
  }

  async findById(id: string, orgId: string): Promise<{ order: Order; items: OrderItem[] } | null> {
    const order = this.orders.get(id);
    if (!order || order.organizationId !== orgId || order.deletedAt) return null;
    const items = this.items.filter((i) => i.orderId === id && i.organizationId === orgId);
    return { order, items };
  }

  async listByOrg(orgId: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      (o) => o.organizationId === orgId && !o.deletedAt
    );
  }
}

export class InMemoryPaymentRepository implements IPaymentRepository {
  private payments: Payment[] = [];

  async createPayment(dto: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Payment> {
    const payment: Payment = {
      ...dto,
      id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.payments.push(payment);
    return payment;
  }

  async findById(id: string, orgId: string): Promise<Payment | null> {
    return this.payments.find((p) => p.id === id && p.organizationId === orgId) || null;
  }

  async listByOrder(orderId: string, orgId: string): Promise<Payment[]> {
    return this.payments.filter((p) => p.orderId === orderId && p.organizationId === orgId);
  }
}

export class InMemoryDeliveryRepository implements IDeliveryRepository {
  private deliveries: Delivery[] = [];

  async createDelivery(dto: Omit<Delivery, 'id' | 'createdAt' | 'updatedAt'>): Promise<Delivery> {
    const existingActive = this.deliveries.find(
      (d) => d.orderId === dto.orderId && d.organizationId === dto.organizationId && !['DELIVERED', 'CLOSED', 'CANCELLED'].includes(d.status)
    );
    if (existingActive) {
      throw new Error(`Active delivery already exists for order ${dto.orderId}`);
    }

    const delivery: Delivery = {
      ...dto,
      id: `deliv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.deliveries.push(delivery);
    return delivery;
  }

  async findByOrderId(orderId: string, orgId: string): Promise<Delivery | null> {
    return this.deliveries.find((d) => d.orderId === orderId && d.organizationId === orgId) || null;
  }

  async listByOrg(orgId: string): Promise<Delivery[]> {
    return this.deliveries.filter((d) => d.organizationId === orgId);
  }
}

export class InMemoryFinanceRepository implements IFinanceRepository {
  private accounts: Map<string, FinancialAccount> = new Map();
  private transactions: Transaction[] = [];

  async createAccount(dto: Omit<FinancialAccount, 'id' | 'createdAt' | 'updatedAt'>): Promise<FinancialAccount> {
    const account: FinancialAccount = {
      ...dto,
      id: `acc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.accounts.set(account.id, account);
    return account;
  }

  async getAccount(id: string, orgId: string): Promise<FinancialAccount | null> {
    const acc = this.accounts.get(id);
    if (acc && acc.organizationId === orgId) return acc;
    return null;
  }

  async recordTransaction(dto: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
    const tx: Transaction = {
      ...dto,
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date(),
    };
    this.transactions.push(tx);
    return tx;
  }

  async listTransactions(accountId: string, orgId: string): Promise<Transaction[]> {
    return this.transactions.filter(
      (t) => t.financialAccountId === accountId && t.organizationId === orgId
    );
  }
}

export class InMemoryAIMemoryRepository implements IAIMemoryRepository {
  private memories: AIMemory[] = [];

  async saveMemory(dto: Omit<AIMemory, 'id' | 'createdAt' | 'updatedAt'>): Promise<AIMemory> {
    const memory: AIMemory = {
      ...dto,
      id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.memories.push(memory);
    return memory;
  }

  async getMemories(subjectType: string, subjectId: string, orgId?: string): Promise<AIMemory[]> {
    return this.memories.filter((m) => {
      const subjectMatch = m.subjectType === subjectType && m.subjectId === subjectId;
      if (!subjectMatch) return false;
      if (m.scope === 'personal') return true;
      return m.organizationId === orgId;
    });
  }
}

export class InMemoryAIActionRepository implements IAIActionRepository {
  private actions: AIAction[] = [];

  async recordAction(dto: Omit<AIAction, 'id' | 'createdAt'>): Promise<AIAction> {
    const action: AIAction = {
      ...dto,
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date(),
    };
    this.actions.push(action);
    return action;
  }

  async getActionsByOrg(orgId: string): Promise<AIAction[]> {
    return this.actions.filter((a) => a.organizationId === orgId);
  }
}

export class InMemoryGoalRepository implements IGoalRepository {
  private goals: Goal[] = [];

  async createGoal(dto: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Goal> {
    const goal: Goal = {
      ...dto,
      id: `goal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.goals.push(goal);
    return goal;
  }

  async listGoals(orgId: string): Promise<Goal[]> {
    return this.goals.filter((g) => g.organizationId === orgId);
  }
}
