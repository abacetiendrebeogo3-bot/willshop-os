/**
 * WILLShop OS — BUILD 11 : TEAM & PRODUCTIVITY ENGINE TEST SUITE
 * Comprehensive integration & domain unit tests.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { InMemoryTeamRepositories } from '../src/infrastructure/repositories/InMemoryTeamRepositories';
import { TeamApplicationService } from '../src/application/services/TeamApplicationServices';
import { TaskStateMachine } from '../src/domain/services/TaskStateMachine';
import { WorkloadService } from '../src/domain/services/WorkloadService';
import { EmployeePerformanceService } from '../src/domain/services/EmployeePerformanceService';
import { EscalationService } from '../src/domain/services/EscalationService';
import { ProcessBottleneckEngine } from '../src/domain/services/ProcessBottleneckEngine';
import { AIToolRegistry } from '../src/domain/services/AIToolRegistry';
import { SystemEvent } from '../src/domain/entities/SystemEvent';

describe('Build 11 — Team & Productivity Engine Automated Test Suite', () => {
  const orgId = 'org_willshop_test';
  const repo = new InMemoryTeamRepositories();

  const recordedEvents: Omit<SystemEvent, 'id' | 'createdAt' | 'status'>[] = [];
  const mockRecordEvent = async (event: Omit<SystemEvent, 'id' | 'createdAt' | 'status'>) => {
    recordedEvents.push(event);
    return {
      id: `evt_${Date.now()}`,
      createdAt: new Date(),
      status: 'PROCESSED',
      ...event,
    } as SystemEvent;
  };

  const service = new TeamApplicationService({
    teamRepo: repo,
    employeeRepo: repo,
    taskRepo: repo,
    dependencyRepo: repo,
    commentRepo: repo,
    activityRepo: repo,
    goalRepo: repo,
    escalationRepo: repo,
    recordEvent: mockRecordEvent,
  });

  it('1. Task CRUD & State Machine: Valid transitions allowed, illegal jumps rejected', async () => {
    const employees = await service.seedInitialTeamData(orgId);
    assert.strictEqual(employees.length, 3);

    const task = await service.createTask(
      orgId,
      employees[0].id,
      'Traiter commande urgente',
      'HIGH',
      'ORDER',
      'Paiement vérifié',
      employees[1].id
    );

    assert.strictEqual(task.status, 'TODO');

    // Valid transition TODO -> IN_PROGRESS
    const inProgress = await service.transitionTaskStatus(orgId, task.id, employees[1].id, 'IN_PROGRESS');
    assert.strictEqual(inProgress.status, 'IN_PROGRESS');

    // Valid transition IN_PROGRESS -> DONE
    const done = await service.transitionTaskStatus(orgId, task.id, employees[1].id, 'DONE');
    assert.strictEqual(done.status, 'DONE');

    // Illegal jump test directly via TaskStateMachine
    const backlogTask = { ...task, status: 'BACKLOG' as const };
    assert.throws(() => {
      TaskStateMachine.assertTransition(backlogTask, 'DONE');
    }, /Transition de statut invalide/);
  });

  it('2. Task Dependencies & Blockers: Cannot complete task if prerequisite dependency is not DONE', async () => {
    const employees = await service.listEmployees(orgId);
    const taskA = await service.createTask(orgId, employees[0].id, 'Créer visuels pub', 'MEDIUM', 'MARKETING');
    const taskB = await service.createTask(orgId, employees[0].id, 'Lancer campagne Meta', 'HIGH', 'MARKETING');

    // Task B depends on Task A
    await service.addDependency(orgId, taskB.id, taskA.id);

    // Attempting to move Task B to IN_PROGRESS should fail because Task A is still TODO
    await assert.rejects(async () => {
      await service.transitionTaskStatus(orgId, taskB.id, employees[0].id, 'IN_PROGRESS');
    }, /des tâches dépendantes ne sont pas terminées/);

    // Complete Task A
    await service.transitionTaskStatus(orgId, taskA.id, employees[0].id, 'IN_PROGRESS');
    await service.transitionTaskStatus(orgId, taskA.id, employees[0].id, 'DONE');

    // Now Task B can transition to IN_PROGRESS
    const taskBStarted = await service.transitionTaskStatus(orgId, taskB.id, employees[0].id, 'IN_PROGRESS');
    assert.strictEqual(taskBStarted.status, 'IN_PROGRESS');
  });

  it('3. Automatic Task Assignment: Recommends employee based on role, skills, and lowest workload', async () => {
    const employees = await service.listEmployees(orgId);
    const newTask = await service.createTask(orgId, employees[0].id, 'Problème de livraison client', 'URGENT', 'DELIVERY');

    const assigned = await service.autoAssignTask(orgId, newTask.id, 'LIVREUR', 'LOGISTICS');
    assert.strictEqual(assigned.assignedTo, employees[2].id); // Moussa Ndiaye (LIVREUR)
  });

  it('4. Workload Engine: Detects OVERLOADED status when open tasks or hours exceed thresholds', async () => {
    const employees = await service.listEmployees(orgId);
    const empLivreur = employees[2];

    // Create 7 additional tasks for the livreur
    for (let i = 0; i < 7; i++) {
      await service.createTask(
        orgId,
        employees[0].id,
        `Livraison Express ${i}`,
        'URGENT',
        'DELIVERY',
        undefined,
        empLivreur.id
      );
    }

    const workload = await service.getEmployeeWorkload(orgId, empLivreur.id);
    assert.strictEqual(workload.status, 'OVERLOADED');
    assert.ok(workload.urgentTasksCount >= 3);
  });

  it('5. Contextual Performance Safeguard: Low lead volume buffers evaluation score', async () => {
    const employees = await service.listEmployees(orgId);
    const commercial = employees[1];

    const tasks = await repo.listTasks(orgId);
    const goals = await repo.listGoals(orgId);

    // Evaluate performance with very low lead volume (5 leads)
    const scorecard = EmployeePerformanceService.generateScorecard(
      commercial,
      'CURRENT_MONTH',
      tasks,
      goals,
      { result_score: 50 },
      { leadsVolume: 5 }
    );

    assert.strictEqual(scorecard.confidenceLevel, 'MEDIUM');
    assert.ok(scorecard.contextualNotes.some((n) => n.includes('Volume de leads très faible')));
    assert.ok(scorecard.overallScore >= 70, 'Fairness buffer prevented score from crashing');
  });

  it('6. Escalation Engine: Triggers multi-level escalation thresholds without duplication', async () => {
    const employees = await service.listEmployees(orgId);
    const overdueDate = new Date(Date.now() - 50 * 3600 * 1000); // 50 hours overdue

    const overdueTask = await service.createTask(
      orgId,
      employees[0].id,
      'Livraison bloquée à Fann',
      'URGENT',
      'DELIVERY',
      undefined,
      employees[2].id,
      undefined,
      overdueDate
    );

    const escalations = await service.processOverdueEscalations(orgId);
    assert.ok(escalations.length > 0);

    const esc = escalations.find((e) => e.taskId === overdueTask.id);
    assert.ok(esc);
    assert.strictEqual(esc?.escalationLevel, 2); // 48h+ threshold -> Level 2 Manager

    // Re-running escalation engine should not produce duplicate Level 2 escalation
    const secondPass = await service.processOverdueEscalations(orgId);
    const duplicate = secondPass.find((e) => e.taskId === overdueTask.id);
    assert.strictEqual(duplicate, undefined, 'Prevented duplicate escalation');
  });

  it('7. Process Bottlenecks & CEO AI Tools Registration', async () => {
    const bottlenecks = await service.getProcessBottlenecks(orgId);
    assert.ok(Array.isArray(bottlenecks));

    // Verify CEO AI tools are registered
    const tools = AIToolRegistry.listTools();
    const snapshotTool = tools.find((t) => t.name === 'get_team_snapshot');
    const workloadTool = tools.find((t) => t.name === 'get_employee_workload');
    const scorecardTool = tools.find((t) => t.name === 'get_employee_scorecard');

    assert.ok(snapshotTool);
    assert.ok(workloadTool);
    assert.ok(scorecardTool);
  });

  it('8. Multi-Tenant RLS & Data Isolation: Org B cannot access Org A tasks', async () => {
    const orgB = 'org_other_tenant';

    // List tasks for Org B
    const tasksOrgB = await repo.listTasks(orgB);
    assert.strictEqual(tasksOrgB.length, 0);

    // List employees for Org B
    const employeesOrgB = await repo.listEmployees(orgB);
    assert.strictEqual(employeesOrgB.length, 0);
  });
});
