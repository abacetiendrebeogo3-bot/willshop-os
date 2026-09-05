/**
 * WILLShop OS — Supabase Production Data Core Repositories
 * Infrastructure Layer.
 */

import { SupabaseClient } from '@supabase/supabase-js';
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

export class SupabaseCustomerRepository implements ICustomerRepository {
  constructor(private readonly client: SupabaseClient) {}

  async create(dto: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    const { data, error } = await this.client
      .from('customers')
      .insert({
        organization_id: dto.organizationId,
        first_name: dto.firstName,
        last_name: dto.lastName,
        phone: dto.phone,
        email: dto.email,
        whatsapp_phone: dto.whatsappPhone,
        address: dto.address,
        city: dto.city,
        zone_id: dto.zoneId,
        notes: dto.notes,
        source: dto.source,
        status: dto.status,
      })
      .select('*')
      .single();

    if (error || !data) throw new Error(`Failed to create customer: ${error?.message}`);
    return this.mapToCustomer(data);
  }

  async findById(id: string, orgId: string): Promise<Customer | null> {
    const { data, error } = await this.client
      .from('customers')
      .select('*')
      .eq('id', id)
      .eq('organization_id', orgId)
      .is('deleted_at', null)
      .single();

    if (error || !data) return null;
    return this.mapToCustomer(data);
  }

  async findByPhone(phone: string, orgId: string): Promise<Customer | null> {
    const { data, error } = await this.client
      .from('customers')
      .select('*')
      .eq('phone', phone)
      .eq('organization_id', orgId)
      .is('deleted_at', null)
      .single();

    if (error || !data) return null;
    return this.mapToCustomer(data);
  }

  async listByOrg(orgId: string): Promise<Customer[]> {
    const { data, error } = await this.client
      .from('customers')
      .select('*')
      .eq('organization_id', orgId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map(this.mapToCustomer);
  }

  private mapToCustomer(row: Record<string, unknown>): Customer {
    return {
      id: row.id as string,
      organizationId: row.organization_id as string,
      firstName: row.first_name as string,
      lastName: row.last_name as string,
      fullName: row.full_name as string,
      phone: row.phone as string,
      email: row.email as string | null,
      whatsappPhone: row.whatsapp_phone as string | null,
      address: row.address as string | null,
      city: row.city as string,
      zoneId: row.zone_id as string | null,
      notes: row.notes as string | null,
      source: row.source as string,
      status: row.status as string,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
      createdBy: row.created_by as string | null,
      deletedAt: row.deleted_at ? new Date(row.deleted_at as string) : null,
    };
  }
}

export class SupabaseProductRepository implements IProductRepository {
  constructor(private readonly client: SupabaseClient) {}

  async create(dto: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const { data, error } = await this.client
      .from('products')
      .insert({
        organization_id: dto.organizationId,
        sku: dto.sku,
        name: dto.name,
        description: dto.description,
        category: dto.category,
        purchase_price: dto.purchasePrice,
        selling_price: dto.sellingPrice,
        currency: dto.currency,
        minimum_stock: dto.minimumStock,
        unit: dto.unit,
        status: dto.status,
      })
      .select('*')
      .single();

    if (error || !data) throw new Error(`Failed to create product: ${error?.message}`);
    return this.mapToProduct(data);
  }

  async findById(id: string, orgId: string): Promise<Product | null> {
    const { data, error } = await this.client
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('organization_id', orgId)
      .is('deleted_at', null)
      .single();

    if (error || !data) return null;
    return this.mapToProduct(data);
  }

  async findBySku(sku: string, orgId: string): Promise<Product | null> {
    const { data, error } = await this.client
      .from('products')
      .select('*')
      .eq('sku', sku)
      .eq('organization_id', orgId)
      .is('deleted_at', null)
      .single();

    if (error || !data) return null;
    return this.mapToProduct(data);
  }

  async listByOrg(orgId: string): Promise<Product[]> {
    const { data, error } = await this.client
      .from('products')
      .select('*')
      .eq('organization_id', orgId)
      .is('deleted_at', null);

    if (error || !data) return [];
    return data.map(this.mapToProduct);
  }

  private mapToProduct(row: Record<string, unknown>): Product {
    return {
      id: row.id as string,
      organizationId: row.organization_id as string,
      sku: row.sku as string,
      name: row.name as string,
      description: row.description as string | null,
      category: row.category as string,
      purchasePrice: Number(row.purchase_price),
      sellingPrice: Number(row.selling_price),
      currency: row.currency as string,
      minimumStock: Number(row.minimum_stock),
      unit: row.unit as string,
      status: row.status as string,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
      createdBy: row.created_by as string | null,
      deletedAt: row.deleted_at ? new Date(row.deleted_at as string) : null,
    };
  }
}

export class SupabaseFinanceRepository implements IFinanceRepository {
  constructor(private readonly client: SupabaseClient) {}

  async createAccount(account: Omit<FinancialAccount, 'id' | 'createdAt' | 'updatedAt'>): Promise<FinancialAccount> {
    const { data, error } = await this.client
      .from('financial_accounts')
      .insert({
        organization_id: account.organizationId,
        name: account.name,
        type: account.type,
        currency: account.currency,
        opening_balance: account.openingBalance,
        current_balance: account.openingBalance,
        status: account.status,
      })
      .select('*')
      .single();

    if (error || !data) throw new Error(`Failed to create financial account: ${error?.message}`);
    return this.mapToAccount(data);
  }

  async getAccount(id: string, orgId: string): Promise<FinancialAccount | null> {
    const { data, error } = await this.client
      .from('financial_accounts')
      .select('*')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single();

    if (error || !data) return null;
    return this.mapToAccount(data);
  }

  async updateAccountBalance(id: string, orgId: string, newBalance: number): Promise<FinancialAccount> {
    const { data, error } = await this.client
      .from('financial_accounts')
      .update({ current_balance: newBalance, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', orgId)
      .select('*')
      .single();

    if (error || !data) throw new Error(`Failed to update account balance: ${error?.message}`);
    return this.mapToAccount(data);
  }

  async listAccountsByOrg(orgId: string): Promise<FinancialAccount[]> {
    const { data, error } = await this.client
      .from('financial_accounts')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map(this.mapToAccount);
  }

  async recordTransaction(transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
    const { data, error } = await this.client
      .from('transactions')
      .insert({
        organization_id: transaction.organizationId,
        financial_account_id: transaction.financialAccountId,
        type: transaction.type,
        direction: (transaction as any).direction || 'INFLOW',
        amount: transaction.amount,
        currency: transaction.currency,
        category: transaction.category,
        status: (transaction as any).status || 'POSTED',
        reference_type: transaction.referenceType,
        reference_id: transaction.referenceId,
        description: transaction.description,
        receipt_url: (transaction as any).receiptUrl,
        transfer_id: (transaction as any).transferId,
        transaction_date: transaction.transactionDate.toISOString(),
        created_by: transaction.createdBy,
      })
      .select('*')
      .single();

    if (error || !data) throw new Error(`Failed to record transaction: ${error?.message}`);
    return this.mapToTransaction(data);
  }

  async listTransactions(accountId: string, orgId: string): Promise<Transaction[]> {
    const { data, error } = await this.client
      .from('transactions')
      .select('*')
      .eq('financial_account_id', accountId)
      .eq('organization_id', orgId)
      .order('transaction_date', { ascending: false });

    if (error || !data) return [];
    return data.map(this.mapToTransaction);
  }

  async listAllTransactionsByOrg(orgId: string): Promise<Transaction[]> {
    const { data, error } = await this.client
      .from('transactions')
      .select('*')
      .eq('organization_id', orgId)
      .order('transaction_date', { ascending: false });

    if (error || !data) return [];
    return data.map(this.mapToTransaction);
  }

  async createObligation(dto: any): Promise<any> {
    const { data, error } = await this.client
      .from('financial_obligations')
      .insert({
        organization_id: dto.organizationId,
        type: dto.type,
        party_type: dto.partyType,
        party_id: dto.partyId,
        party_name: dto.partyName,
        amount: dto.amount,
        paid_amount: dto.paidAmount || 0,
        remaining_amount: dto.remainingAmount || dto.amount,
        due_date: dto.dueDate ? new Date(dto.dueDate).toISOString() : null,
        status: dto.status || 'PENDING',
        description: dto.description,
      })
      .select('*')
      .single();

    if (error || !data) throw new Error(`Failed to create obligation: ${error?.message}`);
    return this.mapToObligation(data);
  }

  async listObligationsByOrg(orgId: string, type?: any): Promise<any[]> {
    let query = this.client
      .from('financial_obligations')
      .select('*')
      .eq('organization_id', orgId);

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map(this.mapToObligation);
  }

  private mapToAccount(row: Record<string, unknown>): FinancialAccount {
    return {
      id: row.id as string,
      organizationId: row.organization_id as string,
      name: row.name as string,
      type: row.type as any,
      currency: row.currency as string,
      openingBalance: Number(row.opening_balance),
      status: row.status as string,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }

  private mapToTransaction(row: Record<string, unknown>): Transaction {
    return {
      id: row.id as string,
      organizationId: row.organization_id as string,
      financialAccountId: row.financial_account_id as string,
      type: row.type as any,
      amount: Number(row.amount),
      currency: row.currency as string,
      category: row.category as string,
      referenceType: row.reference_type as string | null,
      referenceId: row.reference_id as string | null,
      description: row.description as string | null,
      transactionDate: new Date(row.transaction_date as string),
      createdAt: new Date(row.created_at as string),
      createdBy: row.created_by as string | null,
    };
  }

  private mapToObligation(row: Record<string, unknown>): any {
    return {
      id: row.id as string,
      organizationId: row.organization_id as string,
      type: row.type,
      partyType: row.party_type,
      partyId: row.party_id as string | null,
      partyName: row.party_name as string,
      amount: Number(row.amount),
      paidAmount: Number(row.paid_amount),
      remainingAmount: Number(row.remaining_amount),
      dueDate: row.due_date ? new Date(row.due_date as string) : null,
      status: row.status,
      description: row.description as string | null,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }
}
