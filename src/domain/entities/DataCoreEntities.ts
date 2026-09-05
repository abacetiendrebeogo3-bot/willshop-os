/**
 * WILLShop OS — Data Core Domain Entities
 * Pure Domain Layer — ZERO external dependencies.
 */

export interface Customer {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  phone: string;
  email?: string | null;
  whatsappPhone?: string | null;
  address?: string | null;
  city: string;
  zoneId?: string | null;
  notes?: string | null;
  source: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  deletedAt?: Date | null;
}

export interface Supplier {
  id: string;
  organizationId: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  deletedAt?: Date | null;
}

export interface Product {
  id: string;
  organizationId: string;
  sku: string;
  name: string;
  description?: string | null;
  category: string;
  purchasePrice: number;
  sellingPrice: number;
  currency: string;
  minimumStock: number;
  unit: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  deletedAt?: Date | null;
}

export interface ProductImage {
  id: string;
  organizationId: string;
  productId: string;
  storagePath: string;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductStock {
  id: string;
  organizationId: string;
  productId: string;
  physicalStock: number;
  reservedStock: number;
  minimumStock: number;
  availableStock: number; // physicalStock - reservedStock
  createdAt: Date;
  updatedAt: Date;
}

export type StockMovementType = 'RESERVATION' | 'RELEASE' | 'SALE' | 'CANCELLATION' | 'RESTOCK' | 'ADJUSTMENT' | 'RETURN';
export type StockMovementDirection = 'IN' | 'OUT' | 'RESERVE' | 'RELEASE';

export interface StockMovement {
  id: string;
  organizationId: string;
  productId: string;
  movementType: StockMovementType;
  direction: StockMovementDirection;
  quantity: number;
  referenceType?: string | null;
  referenceId?: string | null;
  reason?: string | null;
  createdAt: Date;
  createdBy?: string | null;
}

export type OrderStatus =
  | 'DRAFT'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED'
  | 'RETURNED'
  | 'RESCHEDULED';

export interface Order {
  id: string;
  organizationId: string;
  customerId: string;
  orderNumber: string;
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  currency: string;
  source: string;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  deletedAt?: Date | null;
}

export interface OrderItem {
  id: string;
  organizationId: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  productNameSnapshot: string;
  skuSnapshot: string;
  createdAt: Date;
}

export type PaymentMethod = 'CASH' | 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'CARD' | 'OTHER';
export type PaymentStatus = 'PENDING' | 'RECEIVED' | 'VERIFIED' | 'RECONCILED' | 'FAILED';

export interface Payment {
  id: string;
  organizationId: string;
  orderId?: string | null;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  provider?: string | null;
  providerReference?: string | null;
  receivedAt?: Date | null;
  verifiedAt?: Date | null;
  reconciledAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Zone {
  id: string;
  organizationId: string;
  name: string;
  city: string;
  deliveryFee: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Driver {
  id: string;
  organizationId: string;
  userId?: string | null;
  name: string;
  phone: string;
  vehicle?: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export type DeliveryStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CLOSED'
  | 'FAILED'
  | 'RESCHEDULED'
  | 'RETURNED'
  | 'CANCELLED';

export interface Delivery {
  id: string;
  organizationId: string;
  orderId: string;
  driverId?: string | null;
  zoneId?: string | null;
  status: DeliveryStatus;
  deliveryAddress: string;
  deliveryFee: number;
  assignedAt?: Date | null;
  pickedUpAt?: Date | null;
  deliveredAt?: Date | null;
  failedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type FinancialAccountType = 'CASH_REGISTER' | 'BANK_ACCOUNT' | 'MOBILE_MONEY' | 'OTHER_PRO';

export interface FinancialAccount {
  id: string;
  organizationId: string;
  name: string;
  type: FinancialAccountType;
  currency: string;
  openingBalance: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export interface Transaction {
  id: string;
  organizationId: string;
  financialAccountId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  category: string;
  referenceType?: string | null;
  referenceId?: string | null;
  description?: string | null;
  transactionDate: Date;
  createdAt: Date;
  createdBy?: string | null;
}

export interface Employee {
  id: string;
  organizationId: string;
  userId?: string | null;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  employmentStatus: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface Task {
  id: string;
  organizationId: string;
  assignedTo?: string | null;
  title: string;
  description?: string | null;
  priority: string;
  status: string;
  dueAt?: Date | null;
  completedAt?: Date | null;
  createdBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Campaign {
  id: string;
  organizationId: string;
  name: string;
  platform: string;
  status: string;
  budget: number;
  startAt?: Date | null;
  endAt?: Date | null;
  createdBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Creative {
  id: string;
  organizationId: string;
  campaignId?: string | null;
  name: string;
  type: string;
  assetUrl?: string | null;
  status: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export type MemoryType = 'short_term' | 'customer' | 'business' | 'marketing' | 'decision' | 'strategic' | 'experience' | 'personal';
export type MemoryScope = 'business' | 'personal';

export interface AIMemory {
  id: string;
  organizationId?: string | null;
  memoryType: MemoryType;
  scope: MemoryScope;
  subjectType: string;
  subjectId?: string | null;
  content: string;
  confidence: number;
  source: string;
  expiresAt?: Date | null;
  supersededBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type PermissionLevel = 'GREEN' | 'YELLOW' | 'RED';

export interface AIAction {
  id: string;
  organizationId: string;
  actionType: string;
  permissionLevel: PermissionLevel;
  status: string;
  requestedBy: string;
  approvedBy?: string | null;
  approvalAt?: Date | null;
  idempotencyKey?: string | null;
  correlationId?: string | null;
  inputSummary: string;
  resultSummary?: string | null;
  errorMessage?: string | null;
  createdAt: Date;
  executedAt?: Date | null;
  verifiedAt?: Date | null;
}

export interface Goal {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  type: string;
  targetValue: number;
  currentValue?: number | null;
  unit: string;
  startDate: Date;
  targetDate: Date;
  status: string;
  createdBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
