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
