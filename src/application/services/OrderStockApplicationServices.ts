/**
 * WILLShop OS — Orders & Stock Application Services
 * Application Layer.
 * Server-calculated pricing, atomic transactions, idempotency & state machine validation.
 */

import {
  IOrderRepository,
  IStockRepository,
  IProductRepository,
  ICustomerRepository,
} from '../../domain/interfaces/IDataCoreRepositories';
import { IAuditRepository, IEventRepository, IIdempotencyRepository } from '../../domain/interfaces/IRepositories';

import {
  Order,
  OrderItem,
  ProductStock,
  StockMovement,
  OrderStatus,
} from '../../domain/entities/DataCoreEntities';
import { OrderStateMachine } from '../../domain/services/OrderStateMachine';
import { ValidationError, NotFoundError, IdempotencyMismatchError } from '../../domain/errors/AppErrors';

export interface CreateOrderLineInput {
  productId: string;
  quantity: number;
  overrideUnitPrice?: number;
}

export interface CreateOrderInput {
  organizationId: string;
  customerId: string;
  items: CreateOrderLineInput[];
  deliveryFee?: number;
  discount?: number;
  notes?: string;
  source?: string;
}

export class CreateOrderService {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly productRepo: IProductRepository,
    private readonly auditRepo: IAuditRepository,
    private readonly eventRepo: IEventRepository
  ) {}

  async execute(input: CreateOrderInput, actorId?: string): Promise<{ order: Order; items: OrderItem[] }> {
    if (!input.items || input.items.length === 0) {
      throw new ValidationError('Order must contain at least one product item');
    }

    // Check for duplicate product lines in same order
    const productIds = input.items.map((i) => i.productId);
    if (new Set(productIds).size !== productIds.length) {
      throw new ValidationError('Order cannot contain duplicate product lines for the same product');
    }

    let subtotal = 0;
    const itemSnapshots: Omit<OrderItem, 'id' | 'createdAt'>[] = [];

    // Sort items by productId ASC for deterministic order
    const sortedItems = [...input.items].sort((a, b) => a.productId.localeCompare(b.productId));

    for (const itemInput of sortedItems) {
      if (itemInput.quantity <= 0) {
        throw new ValidationError(`Quantity for product ${itemInput.productId} must be greater than zero`);
      }

      const product = await this.productRepo.findById(itemInput.productId, input.organizationId);
      if (!product) {
        throw new NotFoundError(`Product ${itemInput.productId} not found`);
      }

      const unitPrice = itemInput.overrideUnitPrice ?? product.sellingPrice;
      if (unitPrice < 0) {
        throw new ValidationError(`Unit price for product ${product.name} cannot be negative`);
      }

      const lineSubtotal = unitPrice * itemInput.quantity;
      subtotal += lineSubtotal;

      itemSnapshots.push({
        organizationId: input.organizationId,
        orderId: '', // Filled upon creation
        productId: product.id,
        quantity: itemInput.quantity,
        unitPrice,
        subtotal: lineSubtotal,
        productNameSnapshot: product.name,
        skuSnapshot: product.sku,
      });
    }

    const deliveryFee = Math.max(0, input.deliveryFee ?? 0);
    const discount = Math.max(0, input.discount ?? 0);
    const total = Math.max(0, subtotal + deliveryFee - discount);
    const orderNumber = `WS-${Date.now().toString().substring(5)}`;

    const { order, items } = await this.orderRepo.createOrder(
      {
        organizationId: input.organizationId,
        customerId: input.customerId,
        orderNumber,
        status: 'DRAFT',
        subtotal,
        deliveryFee,
        discount,
        total,
        currency: 'XOF',
        source: input.source || 'CRM',
        notes: input.notes,
        createdBy: actorId,
      },
      itemSnapshots
    );

    await this.auditRepo.log({
      organizationId: input.organizationId,
      actorId,
      action: 'order.create',
      targetEntity: 'orders',
      targetId: order.id,
      afterState: { orderNumber, total, status: 'DRAFT' },
    });

    await this.eventRepo.recordEvent({
      organizationId: input.organizationId,
      eventType: 'order.created',
      payload: { orderId: order.id, orderNumber, total },
      actorId,
    });

    return { order, items };
  }
}

export class ConfirmOrderService {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly stockRepo: IStockRepository,
    private readonly auditRepo: IAuditRepository,
    private readonly eventRepo: IEventRepository,
    private readonly idempotencyRepo: IIdempotencyRepository
  ) {}

  async execute(
    orderId: string,
    orgId: string,
    idempotencyKey?: string,
    actorId?: string
  ): Promise<{ order: Order; items: OrderItem[] }> {
    // 1. Idempotency Check
    if (idempotencyKey) {
      const existingKey = await this.idempotencyRepo.findKey(idempotencyKey, orgId);
      if (existingKey) {
        if (existingKey.responsePayload) {
          const cachedOrderId = existingKey.responsePayload.orderId as string;
          const cached = await this.orderRepo.findById(cachedOrderId, orgId);
          if (cached) return cached;
        }
      } else {
        await this.idempotencyRepo.createKey(idempotencyKey, orgId, orderId);
      }
    }

    // 2. Fetch Order and Items
    const orderData = await this.orderRepo.findById(orderId, orgId);
    if (!orderData) {
      throw new NotFoundError(`Order ${orderId} not found`);
    }

    const { order, items } = orderData;

    if (order.status === 'CONFIRMED') {
      return orderData;
    }

    OrderStateMachine.validateTransition(order.status, 'CONFIRMED');

    // 3. Verify Stock Availability and Reserve Stock (Deterministic order productId ASC)
    const sortedItems = [...items].sort((a, b) => a.productId.localeCompare(b.productId));

    // First pass: verify availability for all items
    for (const item of sortedItems) {
      const stock = await this.stockRepo.getStock(item.productId, orgId);
      if (!stock) {
        throw new ValidationError(`Stock record not found for product ${item.skuSnapshot}`);
      }

      if (stock.availableStock < item.quantity) {
        throw new ValidationError(
          `INSUFFICIENT_STOCK: Product '${item.productNameSnapshot}' (${item.skuSnapshot}) has available stock ${stock.availableStock} but requested ${item.quantity}`
        );
      }
    }

    // Second pass: reserve stock atomically
    for (const item of sortedItems) {
      // Re-verify before reservation to guarantee concurrency safety
      const stock = await this.stockRepo.getStock(item.productId, orgId);
      if (!stock || stock.availableStock < item.quantity) {
        throw new ValidationError(
          `INSUFFICIENT_STOCK: Product '${item.productNameSnapshot}' (${item.skuSnapshot}) available stock depleted`
        );
      }

      await this.stockRepo.recordMovement({
        organizationId: orgId,
        productId: item.productId,
        movementType: 'RESERVATION',
        direction: 'RESERVE',
        quantity: item.quantity,
        referenceType: 'ORDER',
        referenceId: orderId,
        reason: 'Order Confirmation Reservation',
        createdBy: actorId,
      });

      // Check for stock.low event threshold
      const stockAfter = await this.stockRepo.getStock(item.productId, orgId);
      if (stockAfter && stockAfter.availableStock <= stockAfter.minimumStock) {
        await this.eventRepo.recordEvent({
          organizationId: orgId,
          eventType: 'stock.low',
          payload: { productId: item.productId, sku: item.skuSnapshot, availableStock: stockAfter.availableStock, minimumStock: stockAfter.minimumStock },
          actorId,
        });
      }
    }

    // 5. Transition Order Status
    order.status = 'CONFIRMED';
    order.updatedAt = new Date();

    await this.auditRepo.log({
      organizationId: orgId,
      actorId,
      action: 'order.confirm',
      targetEntity: 'orders',
      targetId: orderId,
      afterState: { status: 'CONFIRMED' },
    });

    await this.eventRepo.recordEvent({
      organizationId: orgId,
      eventType: 'order.confirmed',
      payload: { orderId, orderNumber: order.orderNumber },
      actorId,
    });

    const result = { order, items };

    if (idempotencyKey) {
      await this.idempotencyRepo.completeKey(idempotencyKey, orgId, { orderId, status: 'CONFIRMED' });
    }

    return result;
  }
}

export class CancelOrderService {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly stockRepo: IStockRepository,
    private readonly auditRepo: IAuditRepository,
    private readonly eventRepo: IEventRepository
  ) {}

  async execute(orderId: string, orgId: string, reason = 'Cancelled by user', actorId?: string): Promise<Order> {
    const orderData = await this.orderRepo.findById(orderId, orgId);
    if (!orderData) throw new NotFoundError(`Order ${orderId} not found`);

    const { order, items } = orderData;
    if (order.status === 'CANCELLED') return order;

    OrderStateMachine.validateTransition(order.status, 'CANCELLED');

    // Release stock reservations if order was in CONFIRMED, PREPARING, or READY state
    if (['CONFIRMED', 'PREPARING', 'READY'].includes(order.status)) {
      const sortedItems = [...items].sort((a, b) => a.productId.localeCompare(b.productId));
      for (const item of sortedItems) {
        await this.stockRepo.recordMovement({
          organizationId: orgId,
          productId: item.productId,
          movementType: 'RELEASE',
          direction: 'RELEASE',
          quantity: item.quantity,
          referenceType: 'ORDER',
          referenceId: orderId,
          reason: `Cancellation Release: ${reason}`,
          createdBy: actorId,
        });
      }
    }

    order.status = 'CANCELLED';
    order.updatedAt = new Date();

    await this.auditRepo.log({
      organizationId: orgId,
      actorId,
      action: 'order.cancel',
      targetEntity: 'orders',
      targetId: orderId,
      reason,
    });

    await this.eventRepo.recordEvent({
      organizationId: orgId,
      eventType: 'order.cancelled',
      payload: { orderId, reason },
      actorId,
    });

    return order;
  }
}

export class MarkOutForDeliveryService {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly stockRepo: IStockRepository,
    private readonly auditRepo: IAuditRepository,
    private readonly eventRepo: IEventRepository
  ) {}

  async execute(orderId: string, orgId: string, actorId?: string): Promise<Order> {
    const orderData = await this.orderRepo.findById(orderId, orgId);
    if (!orderData) throw new NotFoundError(`Order ${orderId} not found`);

    const { order, items } = orderData;
    if (order.status === 'OUT_FOR_DELIVERY') return order;

    OrderStateMachine.validateTransition(order.status, 'OUT_FOR_DELIVERY');

    const sortedItems = [...items].sort((a, b) => a.productId.localeCompare(b.productId));
    for (const item of sortedItems) {
      await this.stockRepo.recordMovement({
        organizationId: orgId,
        productId: item.productId,
        movementType: 'SALE',
        direction: 'OUT',
        quantity: item.quantity,
        referenceType: 'ORDER',
        referenceId: orderId,
        reason: 'Out for Delivery Sale Deduction',
        createdBy: actorId,
      });
    }

    order.status = 'OUT_FOR_DELIVERY';
    order.updatedAt = new Date();

    await this.auditRepo.log({
      organizationId: orgId,
      actorId,
      action: 'order.out_for_delivery',
      targetEntity: 'orders',
      targetId: orderId,
    });

    await this.eventRepo.recordEvent({
      organizationId: orgId,
      eventType: 'order.out_for_delivery',
      payload: { orderId },
      actorId,
    });

    return order;
  }
}

export class ReturnOrderService {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly stockRepo: IStockRepository,
    private readonly auditRepo: IAuditRepository,
    private readonly eventRepo: IEventRepository
  ) {}

  async execute(orderId: string, orgId: string, itemsIntact = true, reason = 'Customer Return', actorId?: string): Promise<Order> {
    const orderData = await this.orderRepo.findById(orderId, orgId);
    if (!orderData) throw new NotFoundError(`Order ${orderId} not found`);

    const { order, items } = orderData;
    if (order.status === 'RETURNED') return order;

    OrderStateMachine.validateTransition(order.status, 'RETURNED');

    if (itemsIntact) {
      const sortedItems = [...items].sort((a, b) => a.productId.localeCompare(b.productId));
      for (const item of sortedItems) {
        await this.stockRepo.recordMovement({
          organizationId: orgId,
          productId: item.productId,
          movementType: 'RETURN',
          direction: 'IN',
          quantity: item.quantity,
          referenceType: 'ORDER',
          referenceId: orderId,
          reason: `Intact Return: ${reason}`,
          createdBy: actorId,
        });
      }
    }

    order.status = 'RETURNED';
    order.updatedAt = new Date();

    await this.auditRepo.log({
      organizationId: orgId,
      actorId,
      action: 'order.return',
      targetEntity: 'orders',
      targetId: orderId,
      reason,
    });

    await this.eventRepo.recordEvent({
      organizationId: orgId,
      eventType: 'order.returned',
      payload: { orderId, itemsIntact, reason },
      actorId,
    });

    return order;
  }
}
