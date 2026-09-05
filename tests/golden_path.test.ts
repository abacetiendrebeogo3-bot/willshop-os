/**
 * WILLShop OS — BUILD 14 Golden Path Test Suite
 * Validates Scenario A: "WhatsApp to Cash" End-to-End Golden Path across all 13 modules.
 */

import { describe, test, beforeEach } from 'node:test';
import assert from 'node:assert';

import { CustomerIdentificationService } from '../src/application/services/CustomerIdentificationService';
import { CreateOrderService, ConfirmOrderService, MarkOutForDeliveryService } from '../src/application/services/OrderStockApplicationServices';
import { DeliveryAssignmentService, CompleteDeliveryService } from '../src/application/services/DeliveryApplicationServices';
import { CreateFinancialAccountService } from '../src/application/services/FinanceApplicationServices';
import { GetSalesAnalyticsService } from '../src/application/services/AnalyticsApplicationServices';
import { AutomationEngineService, ApprovalCenterService, ActionExecutorService } from '../src/application/services/AutomationApplicationServices';
import { CEOBriefingService } from '../src/application/services/CEOAIApplicationServices';
import { StrategyApplicationService } from '../src/application/services/StrategyApplicationServices';
import { DataConsistencyEngine } from '../src/application/services/DataConsistencyEngine';
import { SystemHealthService } from '../src/application/services/SystemHealthService';

import {
  InMemoryProductRepository,
  InMemoryOrderRepository,
  InMemoryStockRepository,
  InMemoryCustomerRepository,
  InMemoryPaymentRepository,
  InMemoryDeliveryRepository,
  InMemoryFinanceRepository,
} from '../src/infrastructure/repositories/InMemoryDataCoreRepositories';

import {
  InMemoryAutomationRuleRepository,
  InMemoryAutomationExecutionRepository,
  InMemoryApprovalCenterRepository,
  InMemoryKillSwitchRepository,
} from '../src/infrastructure/repositories/InMemoryAutomationRepositories';

import {
  InMemoryCEORecommendationRepository,
  InMemoryCEODecisionRepository,
  InMemoryAIUsageLogRepository,
} from '../src/infrastructure/repositories/InMemoryCEOAIRepositories';

import { InMemoryStrategyRepositories } from '../src/infrastructure/repositories/InMemoryStrategyRepositories';

import {
  InMemoryConversationRepository,
} from '../src/infrastructure/repositories/InMemoryWhatsAppCRMRepositories';

import { AuditService } from '../src/application/services/AuditService';
import { InMemoryAuditRepository, InMemoryEventRepository, InMemoryIdempotencyRepository } from '../src/infrastructure/repositories/InMemoryRepositories';
import { IdempotencyService, EventDispatcherService } from '../src/application/services/IdempotencyService';
import { setMockContext } from '../src/application/services/OrganizationContextService';

describe('Build 14 — Golden Path E2E Test Suite (Scenario A: WhatsApp to Cash)', () => {
  const orgId = 'org-willshop-golden';
  const userId = 'user-ceo-wilty';
  const correlationId = 'corr-wh-gold-1001';

  let customerRepo: InMemoryCustomerRepository;
  let productRepo: InMemoryProductRepository;
  let orderRepo: InMemoryOrderRepository;
  let stockRepo: InMemoryStockRepository;
  let paymentRepo: InMemoryPaymentRepository;
  let deliveryRepo: InMemoryDeliveryRepository;
  let financeRepo: InMemoryFinanceRepository;

  let ruleRepo: InMemoryAutomationRuleRepository;
  let execRepo: InMemoryAutomationExecutionRepository;
  let approvalRepo: InMemoryApprovalCenterRepository;
  let killRepo: InMemoryKillSwitchRepository;

  let recRepo: InMemoryCEORecommendationRepository;
  let decRepo: InMemoryCEODecisionRepository;
  let usageRepo: InMemoryAIUsageLogRepository;

  let strategyRepos: InMemoryStrategyRepositories;

  let auditRepo: InMemoryAuditRepository;
  let idempRepo: InMemoryIdempotencyRepository;
  let auditService: AuditService;
  let eventRepo: InMemoryEventRepository;
  let idempotencyService: IdempotencyService;
  let eventDispatcher: EventDispatcherService;

  let convRepo: InMemoryConversationRepository;

  beforeEach(() => {
    setMockContext({
      userId,
      organizationId: orgId,
      role: 'OWNER',
    });

    auditRepo = new InMemoryAuditRepository();
    idempRepo = new InMemoryIdempotencyRepository();
    eventRepo = new InMemoryEventRepository();
    auditService = new AuditService(auditRepo);
    idempotencyService = new IdempotencyService(idempRepo);
    eventDispatcher = new EventDispatcherService(eventRepo);

    customerRepo = new InMemoryCustomerRepository();
    productRepo = new InMemoryProductRepository();
    orderRepo = new InMemoryOrderRepository();
    stockRepo = new InMemoryStockRepository();
    paymentRepo = new InMemoryPaymentRepository();
    deliveryRepo = new InMemoryDeliveryRepository();
    financeRepo = new InMemoryFinanceRepository();

    ruleRepo = new InMemoryAutomationRuleRepository();
    execRepo = new InMemoryAutomationExecutionRepository();
    approvalRepo = new InMemoryApprovalCenterRepository();
    killRepo = new InMemoryKillSwitchRepository();

    recRepo = new InMemoryCEORecommendationRepository();
    decRepo = new InMemoryCEODecisionRepository();
    usageRepo = new InMemoryAIUsageLogRepository();

    strategyRepos = new InMemoryStrategyRepositories();
    convRepo = new InMemoryConversationRepository();
  });

  test('Golden Path 20-step execution: WhatsApp contact -> Order -> Stock -> Delivery -> Payment -> Finance -> BI -> Strategy', async () => {
    // 1. WhatsApp contact arrives
    const customerService = new CustomerIdentificationService(customerRepo);
    const { customer } = await customerService.identifyOrCreateCustomer(
      orgId,
      '+22670000001',
      'Amadou',
      'Diallo'
    );
    assert.strictEqual(customer.phone, '+22670000001');

    // 2. Conversation initialized
    const conversation = await convRepo.createConversation({
      organizationId: orgId,
      customerId: customer.id,
      channel: 'WHATSAPP',
      status: 'OPEN',
      assignedAgent: 'SALES_AI',
      lastMessageAt: new Date(),
      unreadCount: 1,
      priority: 'NORMAL',
      metadata: {},
    });
    assert.ok(conversation.id);

    // 3. Product & inventory seeded
    const product = await productRepo.create({
      organizationId: orgId,
      name: 'T-Shirt Oversized Premium',
      sku: 'TSHIRT-OVR-01',
      sellingPrice: 15000,
      purchasePrice: 7000,
      category: 'CLOTHING',
      currency: 'XOF',
      minimumStock: 5,
      unit: 'PCS',
      status: 'ACTIVE',
    });

    const stockItem = await stockRepo.initializeStock({
      organizationId: orgId,
      productId: product.id,
      physicalStock: 50,
      reservedStock: 0,
      minimumStock: 5,
    });
    assert.strictEqual(stockItem.physicalStock, 50);

    // 4. Order created
    const createOrderService = new CreateOrderService(orderRepo, productRepo, auditRepo, eventRepo);
    const { order } = await createOrderService.execute({
      organizationId: orgId,
      customerId: customer.id,
      items: [
        {
          productId: product.id,
          quantity: 2,
          overrideUnitPrice: 15000,
        },
      ],
      deliveryFee: 2000,
    });
    assert.strictEqual(order.total, 32000); // 2 * 15000 + 2000

    // 5. Stock reserved & Order confirmed
    const confirmOrderService = new ConfirmOrderService(orderRepo, stockRepo, auditRepo, eventRepo, idempRepo);
    const { order: confirmedOrder } = await confirmOrderService.execute(order.id, orgId);
    assert.strictEqual(confirmedOrder.status, 'CONFIRMED');

    // 6. Delivery created & Driver assigned
    const delivery = await deliveryRepo.createDelivery({
      organizationId: orgId,
      orderId: order.id,
      deliveryAddress: 'Avenue Babanguida, Ouagadougou',
      deliveryFee: 2000,
      status: 'PENDING',
    });

    const assignService = new DeliveryAssignmentService(deliveryRepo, auditRepo, eventRepo, idempRepo);
    const assignedDelivery = await assignService.assign({
      organizationId: orgId,
      deliveryId: delivery.id,
      driverId: 'driver-rasmane',
    });
    assert.strictEqual(assignedDelivery.driverId, 'driver-rasmane');

    // 7. Transit & Delivery completed
    assignedDelivery.status = 'IN_TRANSIT';
    const markOutService = new MarkOutForDeliveryService(orderRepo, stockRepo, auditRepo, eventRepo);
    const completeDeliveryService = new CompleteDeliveryService(deliveryRepo, markOutService, auditRepo, eventRepo);
    const completedDelivery = await completeDeliveryService.execute(
      delivery.id,
      orgId,
      { recipientName: 'Amadou Diallo', notes: 'Delivered in person to client' }
    );
    assert.strictEqual(completedDelivery.status, 'DELIVERED');

    // 8. Payment received & Finance ledger created
    const createAccountService = new CreateFinancialAccountService(financeRepo, auditService, eventRepo, idempotencyService);
    const mainAccount = await createAccountService.execute(
      'Compte Principal Coris Bank',
      'BANK_ACCOUNT',
      1000000
    );

    const payment = await paymentRepo.createPayment({
      organizationId: orgId,
      orderId: order.id,
      amount: 32000,
      currency: 'XOF',
      method: 'MOBILE_MONEY',
      status: 'VERIFIED',
    });

    const transaction = await financeRepo.recordTransaction({
      organizationId: orgId,
      financialAccountId: mainAccount.id,
      type: 'INCOME',
      amount: 32000,
      currency: 'XOF',
      category: 'PRODUCT_SALE',
      referenceType: 'payment',
      referenceId: payment.id,
      transactionDate: new Date(),
    });

    assert.strictEqual(payment.status, 'VERIFIED');
    assert.strictEqual(transaction.amount, 32000);

    // 9. BI Aggregates calculated
    const analyticsService = new GetSalesAnalyticsService(orderRepo);
    const biSummary = await analyticsService.execute();
    assert.ok(biSummary);

    // 10. Domain event emitted
    const systemEvent = await eventDispatcher.dispatch({
      organizationId: orgId,
      eventType: 'ORDER_COMPLETED',
      payload: { orderId: order.id, amount: 32000, customerId: customer.id },
      correlationId,
    });
    assert.strictEqual(systemEvent.eventType, 'ORDER_COMPLETED');

    // 11. Automation evaluated
    const actionExecutor = new ActionExecutorService({});
    const approvalService = new ApprovalCenterService(approvalRepo, actionExecutor);
    const automationEngine = new AutomationEngineService(ruleRepo, execRepo, killRepo, approvalService, actionExecutor);
    const executions = await automationEngine.handleEvent(systemEvent);
    assert.ok(Array.isArray(executions));

    // 12. CEO AI reasoning
    const briefing = CEOBriefingService.generateBriefing({
      organizationId: orgId,
      treasuryCash: 1000000,
      revenueToday: 32000,
      revenue7Days: 32000,
      grossProfit7Days: 17000,
      grossMarginPercent: 53.3,
      ordersTodayCount: 1,
      pendingOrdersCount: 0,
      failedDeliveriesCount: 0,
      lowStockProductsCount: 0,
      outOfStockProductsCount: 0,
      supplierDebtsTotal: 0,
      customerReceivablesTotal: 0,
      activeGoalsCount: 1,
      dataFreshness: 'REALTIME',
    });
    assert.ok(briefing.id);

    // 13. Strategy KPI updated
    const strategyService = new StrategyApplicationService({
      strategyRepo: strategyRepos,
      objectiveRepo: strategyRepos,
      goalRepo: strategyRepos,
      keyResultRepo: strategyRepos,
      initiativeRepo: strategyRepos,
      milestoneRepo: strategyRepos,
      riskRepo: strategyRepos,
      assumptionRepo: strategyRepos,
      decisionRepo: strategyRepos,
    });
    const objective = await strategyService.createObjective(
      orgId,
      userId,
      'Croissance Chiffre d\'Affaires Q3',
      'Atteindre la rentabilité opérationnelle',
      'P1_CRITICAL'
    );

    const goal = await strategyService.createGoal(
      orgId,
      userId,
      userId,
      'Chiffre d\'Affaires Mensuel',
      0,
      5000000,
      'XOF',
      new Date(),
      new Date(Date.now() + 30 * 86400000),
      'STRATEGIC',
      objective.id
    );

    const updatedGoal = await strategyService.updateGoalProgress(goal.id, 32000, orgId);
    assert.strictEqual(updatedGoal.currentValue, 32000);

    // 14. Data Consistency Engine Audit
    const consistencyEngine = new DataConsistencyEngine();
    const auditReport = consistencyEngine.auditSystemData(orgId, {
      orders: [{ id: order.id, totalAmount: 32000, status: 'DELIVERED' }],
      payments: [{ id: payment.id, orderId: order.id, amount: 32000, status: 'VERIFIED' }],
      stockItems: [{ id: stockItem.id, name: product.name, quantityAvailable: 48, reservedQuantity: 0 }],
      financialTransactions: [{ id: transaction.id, paymentId: payment.id, amount: 32000, type: 'INCOME' }],
      marketingSpends: [],
      financialMarketingExpenses: 0,
      biRevenueTotal: 32000,
      sourceOrdersRevenueTotal: 32000,
      goals: [{ id: goal.id, title: goal.title, currentValue: 32000, linkedKpiValue: 32000 }],
    });
    assert.strictEqual(auditReport.isConsistent, true);
    assert.strictEqual(auditReport.criticalCount, 0);

    // 15. System Health Service Diagnostic
    const healthService = new SystemHealthService();
    const healthReport = healthService.diagnose(orgId, {}, {
      orders: [{ id: order.id, totalAmount: 32000, status: 'DELIVERED' }],
      payments: [{ id: payment.id, orderId: order.id, amount: 32000, status: 'VERIFIED' }],
      stockItems: [{ id: stockItem.id, name: product.name, quantityAvailable: 48, reservedQuantity: 0 }],
      financialTransactions: [{ id: transaction.id, paymentId: payment.id, amount: 32000, type: 'INCOME' }],
      marketingSpends: [],
      financialMarketingExpenses: 0,
      biRevenueTotal: 32000,
      sourceOrdersRevenueTotal: 32000,
      goals: [{ id: goal.id, title: goal.title, currentValue: 32000, linkedKpiValue: 32000 }],
    });
    assert.strictEqual(healthReport.globalStatus, 'HEALTHY');
  });
});
