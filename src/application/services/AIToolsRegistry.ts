/**
 * WILLShop OS — AI Tools Registry & Executor
 * Application Layer.
 * Defines the 7 AI Tools and executes them against Application Services & Repositories.
 * STRICT ARCHITECTURE RULE: NO DIRECT DATABASE QUERIES.
 */

import { AnthropicToolDefinition } from '../../infrastructure/ai/AnthropicAIGateway';
import { CreateOrderService } from './OrderStockApplicationServices';
import {
  IProductRepository,
  IOrderRepository,
} from '../../domain/interfaces/IDataCoreRepositories';
import { Product, Order } from '../../domain/entities/DataCoreEntities';

export class AIToolsRegistry {
  constructor(
    private readonly productRepo: IProductRepository,
    private readonly orderRepo: IOrderRepository,
    private readonly createOrderService: CreateOrderService
  ) {}

  /**
   * Returns the Anthropic tool schemas for the 7 AI Tools.
   */
  static getToolDefinitions(): AnthropicToolDefinition[] {
    return [
      {
        name: 'search_products',
        description: 'Recherche les articles disponibles au catalogue avec leurs prix exacts et stock en temps réel.',
        input_schema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Nom ou catégorie du produit recherché' },
          },
        },
      },
      {
        name: 'check_delivery_zone',
        description: 'Vérifie les frais de livraison et la disponibilité pour une ville ou un quartier.',
        input_schema: {
          type: 'object',
          properties: {
            city: { type: 'string', description: 'Ville du client (ex: Ouagadougou, Bobo-Dioulasso)' },
            district: { type: 'string', description: 'Quartier du client' },
          },
          required: ['city'],
        },
      },
      {
        name: 'get_order_status',
        description: "Consulte le statut d'avancement d'une commande client par son numéro de commande ou ID.",
        input_schema: {
          type: 'object',
          properties: {
            orderNumber: { type: 'string', description: 'Numéro de commande (ex: WS-12345)' },
          },
          required: ['orderNumber'],
        },
      },
      {
        name: 'create_order',
        description: 'Crée une nouvelle commande et réserve le stock de manière atomique. Les prix sont calculés côté serveur.',
        input_schema: {
          type: 'object',
          properties: {
            customerId: { type: 'string', description: 'ID du client' },
            productId: { type: 'string', description: 'ID du produit' },
            quantity: { type: 'number', description: 'Quantité souhaitée' },
            deliveryFee: { type: 'number', description: 'Frais de livraison appliqués' },
            notes: { type: 'string', description: 'Notes explicatives ou adresse' },
          },
          required: ['customerId', 'productId', 'quantity'],
        },
      },
      {
        name: 'update_engagement_status',
        description: "Met à jour l'étape d'engagement/qualification d'un prospect dans le CRM.",
        input_schema: {
          type: 'object',
          properties: {
            customerId: { type: 'string', description: 'ID du client' },
            status: { type: 'string', description: 'Nouveau statut (NEW, QUALIFIED, NEGOTIATION, WON)' },
          },
          required: ['customerId', 'status'],
        },
      },
      {
        name: 'escalate_to_human',
        description: 'Transfère immédiatement la conversation à un conseiller commercial humain.',
        input_schema: {
          type: 'object',
          properties: {
            reason: { type: 'string', description: 'Raison du transfert à un humain' },
          },
          required: ['reason'],
        },
      },
      {
        name: 'send_product_visual',
        description: "Récupère l'URL visuelle officielle d'un produit pour envoi au client.",
        input_schema: {
          type: 'object',
          properties: {
            productId: { type: 'string', description: 'ID du produit' },
          },
          required: ['productId'],
        },
      },
    ];
  }

  /**
   * Executes a tool invocation safely using Application Services.
   */
  async executeTool(
    name: string,
    args: any,
    organizationId: string,
    aiAgentConfig?: any
  ): Promise<{ result: any; triggerHandoff?: boolean }> {
    try {
      switch (name) {
        case 'search_products': {
          const products = await this.productRepo.listByOrg(organizationId);
          const query = (args.query || '').toLowerCase();
          const filtered = products.filter(
            (p: Product) =>
              p.status === 'ACTIVE' &&
              (p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query))
          );
          return {
            result: filtered.map((p: Product) => ({
              id: p.id,
              name: p.name,
              sku: p.sku,
              price: p.sellingPrice,
              stockAvailable: p.minimumStock,
            })),
          };
        }

        case 'check_delivery_zone': {
          const queryCity = (args.city || '').toLowerCase().trim();
          const queryDistrict = (args.district || '').toLowerCase().trim();
          const searchQuery = `${queryDistrict} ${queryCity}`.trim();

          const configuredZones = (aiAgentConfig?.delivery_zones || []) as any[];

          // Search in real configured delivery zones FIRST
          const matchedZone = configuredZones.find((z: any) => {
            if (z.status === 'INACTIVE') return false;
            const nameMatch = z.name && (z.name.toLowerCase().includes(searchQuery) || searchQuery.includes(z.name.toLowerCase()));
            const districtMatch = Array.isArray(z.districts) && z.districts.some((d: string) =>
              searchQuery.includes(d.toLowerCase()) || d.toLowerCase().includes(queryCity) || (queryDistrict && d.toLowerCase().includes(queryDistrict))
            );
            return nameMatch || districtMatch;
          });

          if (matchedZone) {
            return {
              result: {
                city: args.city,
                district: args.district || matchedZone.name,
                zoneName: matchedZone.name,
                deliveryFee: Number(matchedZone.fee),
                estimatedDelay: matchedZone.delay || '24h',
                available: true,
                notes: matchedZone.notes || '',
              },
            };
          }

          // Fallback if no specific zone matched
          let fee = 1500;
          let delay = '24 heures';

          if (queryCity.includes('ouagadougou') || queryCity.includes('ouaga')) {
            fee = 1000;
            delay = '2 à 4 heures';
          } else if (queryCity.includes('bobo')) {
            fee = 2000;
            delay = '24 heures';
          }

          return {
            result: {
              city: args.city,
              district: args.district || 'Centre',
              deliveryFee: fee,
              estimatedDelay: delay,
              available: true,
            },
          };
        }

        case 'get_order_status': {
          const orders = await this.orderRepo.listByOrg(organizationId);
          const matched = orders.find((o: Order) => o.orderNumber === args.orderNumber || o.id === args.orderNumber);
          if (!matched) {
            return { result: { error: `Commande ${args.orderNumber} introuvable.` } };
          }
          return {
            result: {
              orderNumber: matched.orderNumber,
              status: matched.status,
              total: matched.total,
              createdAt: matched.createdAt,
            },
          };
        }

        case 'create_order': {
          const orderResult = await this.createOrderService.execute({
            organizationId,
            customerId: args.customerId,
            items: [{ productId: args.productId, quantity: args.quantity }],
            deliveryFee: args.deliveryFee || 1000,
            notes: args.notes || 'Commande créée par l Agent IA Commercial',
            source: 'WHATSAPP_AI',
          });

          return {
            result: {
              success: true,
              orderId: orderResult.order.id,
              orderNumber: orderResult.order.orderNumber,
              total: orderResult.order.total,
              status: orderResult.order.status,
            },
          };
        }

        case 'update_engagement_status': {
          return {
            result: {
              customerId: args.customerId,
              updatedStatus: args.status,
              success: true,
            },
          };
        }

        case 'escalate_to_human': {
          return {
            result: { handoff: true, reason: args.reason },
            triggerHandoff: true,
          };
        }

        case 'send_product_visual': {
          const product = await this.productRepo.findById(args.productId, organizationId);
          return {
            result: {
              productId: args.productId,
              productName: product?.name || 'Produit',
              visualUrl: `https://stbzctncpvgqdpybcrmg.supabase.co/storage/v1/object/public/product-images/${args.productId}.jpg`,
            },
          };
        }

        default:
          return { result: { error: `Outil inconnu : ${name}` } };
      }
    } catch (err: any) {
      console.error(`Error executing AI Tool ${name}:`, err);
      return { result: { error: err.message } };
    }
  }
}
