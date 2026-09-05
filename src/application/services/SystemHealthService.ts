/**
 * WILLShop OS — System Health Service
 * Build 14 System Integration & Consolidation.
 * 
 * Provides unified health monitoring across 6 core pillars:
 * Database, Events, Automation, AI Engine, Business Data Consistency, and Integrations.
 */

import { DataConsistencyEngine, ConsistencyAuditReport, SystemDataSnapshot } from './DataConsistencyEngine';

export type SystemHealthState = 'HEALTHY' | 'DEGRADED' | 'CRITICAL';

export interface PillarHealthReport {
  pillarName: 'DATABASE' | 'EVENTS' | 'AUTOMATION' | 'AI' | 'BUSINESS' | 'INTEGRATIONS';
  status: SystemHealthState;
  details: string;
  metrics: Record<string, number | string | boolean>;
}

export interface SystemHealthReport {
  timestamp: string;
  organizationId: string;
  globalStatus: SystemHealthState;
  summary: string;
  pillars: Record<string, PillarHealthReport>;
  dataConsistencyReport?: ConsistencyAuditReport;
}

export interface SystemHealthCheckConfig {
  dbConnected?: boolean;
  dbMigrationUpToDate?: boolean;
  eventQueueBacklog?: number;
  deadLetterEventsCount?: number;
  failedWorkflowsCount?: number;
  pendingApprovalsCount?: number;
  aiFailureRatePct?: number;
  aiTokenBudgetExceeded?: boolean;
  whatsappApiConnected?: boolean;
  metaAdsApiConnected?: boolean;
  paymentGatewayConnected?: boolean;
  deliveryProviderConnected?: boolean;
}

export class SystemHealthService {
  private consistencyEngine: DataConsistencyEngine;

  constructor() {
    this.consistencyEngine = new DataConsistencyEngine();
  }

  /**
   * Diagnoses the health of the entire system across all 6 core pillars.
   */
  public diagnose(
    orgId: string,
    config: SystemHealthCheckConfig = {},
    dataSnapshot?: SystemDataSnapshot
  ): SystemHealthReport {
    const pillars: Record<string, PillarHealthReport> = {};

    // 1. DATABASE Pillar
    const dbConnected = config.dbConnected ?? true;
    const dbMigrationUpToDate = config.dbMigrationUpToDate ?? true;
    const dbStatus: SystemHealthState = !dbConnected
      ? 'CRITICAL'
      : !dbMigrationUpToDate
      ? 'DEGRADED'
      : 'HEALTHY';
    pillars['DATABASE'] = {
      pillarName: 'DATABASE',
      status: dbStatus,
      details: dbConnected
        ? dbMigrationUpToDate
          ? 'PostgreSQL connected & schemas aligned.'
          : 'Pending database migration detected.'
        : 'Database connection failed.',
      metrics: { connected: dbConnected, migrationUpToDate: dbMigrationUpToDate },
    };

    // 2. EVENTS Pillar
    const eventQueueBacklog = config.eventQueueBacklog ?? 0;
    const deadLetterCount = config.deadLetterEventsCount ?? 0;
    const eventsStatus: SystemHealthState = deadLetterCount > 0
      ? 'CRITICAL'
      : eventQueueBacklog > 50
      ? 'DEGRADED'
      : 'HEALTHY';
    pillars['EVENTS'] = {
      pillarName: 'EVENTS',
      status: eventsStatus,
      details: deadLetterCount > 0
        ? `${deadLetterCount} dead-letter / orphan events detected.`
        : eventQueueBacklog > 50
        ? `High event backlog: ${eventQueueBacklog} pending events.`
        : 'Event dispatcher functioning normally.',
      metrics: { queueBacklog: eventQueueBacklog, deadLetterEvents: deadLetterCount },
    };

    // 3. AUTOMATION Pillar
    const failedWorkflows = config.failedWorkflowsCount ?? 0;
    const pendingApprovals = config.pendingApprovalsCount ?? 0;
    const autoStatus: SystemHealthState = failedWorkflows > 0
      ? 'DEGRADED'
      : 'HEALTHY';
    pillars['AUTOMATION'] = {
      pillarName: 'AUTOMATION',
      status: autoStatus,
      details: failedWorkflows > 0
        ? `${failedWorkflows} workflows failed.`
        : pendingApprovals > 0
        ? `${pendingApprovals} actions pending approval.`
        : 'Automation engine operational.',
      metrics: { failedWorkflows, pendingApprovals },
    };

    // 4. AI Pillar
    const aiFailureRate = config.aiFailureRatePct ?? 0;
    const aiBudgetExceeded = config.aiTokenBudgetExceeded ?? false;
    const aiStatus: SystemHealthState = aiFailureRate > 20
      ? 'CRITICAL'
      : aiFailureRate > 5 || aiBudgetExceeded
      ? 'DEGRADED'
      : 'HEALTHY';
    pillars['AI'] = {
      pillarName: 'AI',
      status: aiStatus,
      details: aiFailureRate > 20
        ? `High AI call failure rate (${aiFailureRate}%).`
        : aiBudgetExceeded
        ? 'AI Token budget exceeded threshold.'
        : 'CEO AI Engine operating cleanly.',
      metrics: { failureRatePct: aiFailureRate, budgetExceeded: aiBudgetExceeded },
    };

    // 5. BUSINESS DATA CONSISTENCY Pillar
    let consistencyReport: ConsistencyAuditReport | undefined;
    let bizStatus: SystemHealthState = 'HEALTHY';
    let bizDetails = 'No data consistency audit requested.';

    if (dataSnapshot) {
      consistencyReport = this.consistencyEngine.auditSystemData(orgId, dataSnapshot);
      if (consistencyReport.criticalCount > 0) {
        bizStatus = 'CRITICAL';
        bizDetails = `${consistencyReport.criticalCount} critical data inconsistencies detected across engines.`;
      } else if (consistencyReport.warningCount > 0) {
        bizStatus = 'DEGRADED';
        bizDetails = `${consistencyReport.warningCount} warning level inconsistencies detected.`;
      } else {
        bizStatus = 'HEALTHY';
        bizDetails = 'All cross-domain data sources are 100% consistent.';
      }
    }

    pillars['BUSINESS'] = {
      pillarName: 'BUSINESS',
      status: bizStatus,
      details: bizDetails,
      metrics: {
        inconsistenciesCount: consistencyReport?.inconsistenciesFound ?? 0,
        criticalCount: consistencyReport?.criticalCount ?? 0,
      },
    };

    // 6. INTEGRATIONS Pillar
    const whatsapp = config.whatsappApiConnected ?? true;
    const meta = config.metaAdsApiConnected ?? true;
    const payment = config.paymentGatewayConnected ?? true;
    const delivery = config.deliveryProviderConnected ?? true;

    const offlineCount = [whatsapp, meta, payment, delivery].filter((c) => !c).length;
    const intStatus: SystemHealthState = offlineCount > 1
      ? 'CRITICAL'
      : offlineCount === 1
      ? 'DEGRADED'
      : 'HEALTHY';

    pillars['INTEGRATIONS'] = {
      pillarName: 'INTEGRATIONS',
      status: intStatus,
      details: offlineCount === 0
        ? 'All external integration adapters online (WhatsApp, Meta, Payment, Delivery).'
        : `${offlineCount} external integration adapter(s) offline.`,
      metrics: { whatsapp, metaAds: meta, paymentGateway: payment, deliveryProvider: delivery },
    };

    // Global Status Determination
    const allStatuses = Object.values(pillars).map((p) => p.status);
    let globalStatus: SystemHealthState = 'HEALTHY';
    if (allStatuses.includes('CRITICAL')) {
      globalStatus = 'CRITICAL';
    } else if (allStatuses.includes('DEGRADED')) {
      globalStatus = 'DEGRADED';
    }

    const summary = globalStatus === 'HEALTHY'
      ? 'WillShop OS is 100% HEALTHY across all 6 integration pillars.'
      : globalStatus === 'DEGRADED'
      ? 'WillShop OS is DEGRADED. Review highlighted pillar warnings.'
      : 'WillShop OS is in CRITICAL state. Immediate executive attention required.';

    return {
      timestamp: new Date().toISOString(),
      organizationId: orgId,
      globalStatus,
      summary,
      pillars,
      dataConsistencyReport: consistencyReport,
    };
  }
}
