/**
 * WILLShop OS — Team & Productivity Engine Application Services
 * Orchestrates team tasks, workloads, briefings, performance scorecards, task state machine transitions,
 * escalations, CEO AI tool queries, and automation event dispatches.
 * Application Layer.
 */

import { SystemEvent } from '../../domain/entities/SystemEvent';
import {
  TeamEmployee,
  Team,
  TeamTask,
  TaskStatus,
  TaskPriority,
  TaskSource,
  RelatedEntityType,
  TaskDependency,
  TaskComment,
  TaskActivity,
  TeamGoal,
  WorkloadSummary,
  EmployeePerformanceScorecard,
  EscalationRecord,
  EmployeeRole,
} from '../../domain/entities/TeamEntities';
import {
  ITeamRepository,
  ITeamEmployeeRepository,
  ITeamTaskRepository,
  ITaskDependencyRepository,
  ITaskCommentRepository,
  ITaskActivityRepository,
  ITeamGoalRepository,
  IEscalationRepository,
} from '../../domain/interfaces/ITeamRepositories';
import { TaskStateMachine } from '../../domain/services/TaskStateMachine';
import { TaskAssignmentService } from '../../domain/services/TaskAssignmentService';
import { WorkloadService } from '../../domain/services/WorkloadService';
import { DailyWorkPlanService, DailyWorkPlan } from '../../domain/services/DailyWorkPlanService';
import { TeamBriefingService, TeamBriefing } from '../../domain/services/TeamBriefingService';
import { EmployeePerformanceService, PerformanceContext } from '../../domain/services/EmployeePerformanceService';
import { EscalationService } from '../../domain/services/EscalationService';
import { ProcessBottleneckEngine, BottleneckAnalysis } from '../../domain/services/ProcessBottleneckEngine';

export interface TeamApplicationServiceDependencies {
  teamRepo: ITeamRepository;
  employeeRepo: ITeamEmployeeRepository;
  taskRepo: ITeamTaskRepository;
  dependencyRepo: ITaskDependencyRepository;
  commentRepo: ITaskCommentRepository;
  activityRepo: ITaskActivityRepository;
  goalRepo: ITeamGoalRepository;
  escalationRepo: IEscalationRepository;
  recordEvent?: (event: Omit<SystemEvent, 'id' | 'createdAt' | 'status'>) => Promise<SystemEvent>;
}

export class TeamApplicationService {
  constructor(private deps: TeamApplicationServiceDependencies) {}

  // --- TEAM EMPLOYEES & TEAMS ---

  public async createEmployee(
    orgId: string,
    firstName: string,
    lastName: string,
    phone: string,
    role: EmployeeRole,
    skills: string[] = [],
    responsibilities: string[] = [],
    email?: string,
    teamId?: string,
    managerId?: string
  ): Promise<TeamEmployee> {
    const employee: TeamEmployee = {
      id: `emp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      organizationId: orgId,
      firstName,
      lastName,
      phone,
      email,
      role,
      employmentStatus: 'ACTIVE',
      joinedAt: new Date(),
      managerId,
      teamId,
      skills,
      responsibilities,
      activityStatus: 'ONLINE',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.deps.employeeRepo.createEmployee(employee);
  }

  public async listEmployees(orgId: string): Promise<TeamEmployee[]> {
    return this.deps.employeeRepo.listEmployees(orgId);
  }

  // --- TASKS & LIFECYCLE ---

  public async createTask(
    orgId: string,
    createdBy: string,
    title: string,
    priority: TaskPriority = 'MEDIUM',
    source: TaskSource = 'MANUAL',
    description?: string,
    assignedTo?: string,
    teamId?: string,
    dueAt?: Date,
    relatedEntityType?: RelatedEntityType,
    relatedEntityId?: string,
    parentTaskId?: string
  ): Promise<TeamTask> {
    const task: TeamTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      organizationId: orgId,
      title,
      description,
      priority,
      status: 'TODO',
      source,
      createdBy,
      assignedTo,
      teamId,
      dueAt,
      relatedEntityType,
      relatedEntityId,
      parentTaskId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const created = await this.deps.taskRepo.createTask(task);

    // Record activity
    await this.deps.activityRepo.recordActivity({
      id: `act_${Date.now()}`,
      organizationId: orgId,
      taskId: created.id,
      actorId: createdBy,
      action: 'CREATED',
      details: { title, priority, source, assignedTo },
      createdAt: new Date(),
    });

    return created;
  }

  public async transitionTaskStatus(
    orgId: string,
    taskId: string,
    actorId: string,
    newStatus: TaskStatus,
    blockerReason?: string
  ): Promise<TeamTask> {
    const task = await this.deps.taskRepo.findTaskById(orgId, taskId);
    if (!task) {
      throw new Error(`Tâche '${taskId}' introuvable.`);
    }

    const dependencies = await this.deps.dependencyRepo.listDependencies(orgId, taskId);
    const allTasks = await this.deps.taskRepo.listTasks(orgId);

    // Validate state machine transition & dependency completion
    TaskStateMachine.assertTransition(task, newStatus, dependencies, allTasks);

    const updated: TeamTask = {
      ...task,
      status: newStatus,
      updatedAt: new Date(),
    };

    if (newStatus === 'IN_PROGRESS' && !task.startedAt) {
      updated.startedAt = new Date();
    } else if (newStatus === 'DONE') {
      updated.completedAt = new Date();
    } else if (newStatus === 'BLOCKED') {
      updated.blockerReason = blockerReason || 'Blocage général non précisé';
      updated.blockedBy = actorId;
      updated.blockedAt = new Date();

      // Dispatch event
      if (this.deps.recordEvent) {
        await this.deps.recordEvent({
          organizationId: orgId,
          eventType: 'team.task_blocked',
          payload: { taskId: task.id, title: task.title, blockerReason: updated.blockerReason },
        });
      }
    }

    const saved = await this.deps.taskRepo.updateTask(updated);

    // Record activity
    await this.deps.activityRepo.recordActivity({
      id: `act_${Date.now()}`,
      organizationId: orgId,
      taskId,
      actorId,
      action: newStatus === 'BLOCKED' ? 'BLOCKED' : 'STATUS_CHANGED',
      details: { from: task.status, to: newStatus, blockerReason },
      createdAt: new Date(),
    });

    return saved;
  }

  public async addDependency(
    orgId: string,
    taskId: string,
    dependsOnTaskId: string
  ): Promise<TaskDependency> {
    const dep: TaskDependency = {
      id: `dep_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      organizationId: orgId,
      taskId,
      dependsOnTaskId,
      createdAt: new Date(),
    };
    return this.deps.dependencyRepo.addDependency(dep);
  }

  // --- AUTOMATIC & MANUAL ASSIGNMENT ---

  public async autoAssignTask(
    orgId: string,
    taskId: string,
    requiredRole: EmployeeRole,
    requiredSkill?: string
  ): Promise<TeamTask> {
    const task = await this.deps.taskRepo.findTaskById(orgId, taskId);
    if (!task) throw new Error(`Tâche '${taskId}' introuvable.`);

    const employees = await this.deps.employeeRepo.listEmployees(orgId);
    const tasks = await this.deps.taskRepo.listTasks(orgId);
    const workloads = WorkloadService.computeAllWorkloads(employees, tasks);

    const recommended = TaskAssignmentService.recommendAssignee(
      task.priority,
      requiredRole,
      requiredSkill,
      employees,
      workloads
    );

    if (!recommended) {
      throw new Error(`Aucun employé disponible avec le rôle '${requiredRole}' pour réassignation.`);
    }

    task.assignedTo = recommended.id;
    task.updatedAt = new Date();

    const saved = await this.deps.taskRepo.updateTask(task);

    await this.deps.activityRepo.recordActivity({
      id: `act_${Date.now()}`,
      organizationId: orgId,
      taskId,
      actorId: 'SYSTEM_AI',
      action: 'ASSIGNED',
      details: { assignedTo: recommended.id, employeeName: `${recommended.firstName} ${recommended.lastName}` },
      createdAt: new Date(),
    });

    return saved;
  }

  // --- WORKLOAD & BRIEFINGS ---

  public async getEmployeeWorkload(orgId: string, employeeId: string): Promise<WorkloadSummary> {
    const employee = await this.deps.employeeRepo.findEmployeeById(orgId, employeeId);
    if (!employee) throw new Error(`Employé '${employeeId}' introuvable.`);
    const tasks = await this.deps.taskRepo.listTasks(orgId);
    return WorkloadService.computeEmployeeWorkload(employee, tasks);
  }

  public async getAllWorkloads(orgId: string): Promise<WorkloadSummary[]> {
    const employees = await this.deps.employeeRepo.listEmployees(orgId);
    const tasks = await this.deps.taskRepo.listTasks(orgId);
    return WorkloadService.computeAllWorkloads(employees, tasks);
  }

  public async getDailyWorkPlan(orgId: string, employeeId: string): Promise<DailyWorkPlan> {
    const employee = await this.deps.employeeRepo.findEmployeeById(orgId, employeeId);
    if (!employee) throw new Error(`Employé '${employeeId}' introuvable.`);
    const tasks = await this.deps.taskRepo.listTasks(orgId);
    return DailyWorkPlanService.generateWorkPlan(employee, tasks);
  }

  public async getTeamBriefing(orgId: string): Promise<TeamBriefing> {
    const employees = await this.deps.employeeRepo.listEmployees(orgId);
    const tasks = await this.deps.taskRepo.listTasks(orgId);
    const goals = await this.deps.goalRepo.listGoals(orgId);
    return TeamBriefingService.generateBriefing(employees, tasks, goals);
  }

  // --- PERFORMANCE & BOTTLENECKS ---

  public async getEmployeeScorecard(
    orgId: string,
    employeeId: string,
    period: string = 'CURRENT_MONTH',
    context: PerformanceContext = {}
  ): Promise<EmployeePerformanceScorecard> {
    const employee = await this.deps.employeeRepo.findEmployeeById(orgId, employeeId);
    if (!employee) throw new Error(`Employé '${employeeId}' introuvable.`);

    const tasks = await this.deps.taskRepo.listTasks(orgId);
    const goals = await this.deps.goalRepo.listGoals(orgId);

    // Mock role domain KPIs (simulating dynamic BI metrics)
    const domainKPIs: Record<string, number> = {
      result_score: 82,
      quality_score: 88,
      sales_conversion: 24.5,
      delivery_success_rate: 94.0,
    };

    return EmployeePerformanceService.generateScorecard(employee, period, tasks, goals, domainKPIs, context);
  }

  public async getProcessBottlenecks(orgId: string): Promise<BottleneckAnalysis[]> {
    const tasks = await this.deps.taskRepo.listTasks(orgId);
    return ProcessBottleneckEngine.analyzeBottlenecks(tasks);
  }

  // --- ESCALATION ENGINE ---

  public async processOverdueEscalations(orgId: string): Promise<EscalationRecord[]> {
    const tasks = await this.deps.taskRepo.listTasks(orgId);
    const existingEscalations = await this.deps.escalationRepo.listEscalations(orgId);

    const createdEscalations: EscalationRecord[] = [];

    for (const task of tasks) {
      const result = EscalationService.evaluateTaskEscalation(task, existingEscalations);
      if (result && result.shouldEscalate) {
        const escalation: EscalationRecord = {
          id: `esc_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          organizationId: orgId,
          taskId: task.id,
          escalationLevel: result.nextLevel,
          reason: result.reason,
          triggeredAt: new Date(),
          status: 'ACTIVE',
        };

        const saved = await this.deps.escalationRepo.createEscalation(escalation);
        createdEscalations.push(saved);

        // Dispatch event
        if (this.deps.recordEvent) {
          await this.deps.recordEvent({
            organizationId: orgId,
            eventType: 'team.escalation_required',
            payload: { taskId: task.id, title: task.title, level: result.nextLevel, reason: result.reason },
          });
        }
      }
    }

    return createdEscalations;
  }

  // --- GOALS ---

  public async createGoal(
    orgId: string,
    createdBy: string,
    name: string,
    targetValue: number,
    unit: string,
    targetDate: Date,
    scope: 'COMPANY' | 'TEAM' | 'EMPLOYEE' = 'COMPANY',
    teamId?: string,
    employeeId?: string
  ): Promise<TeamGoal> {
    const goal: TeamGoal = {
      id: `goal_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      organizationId: orgId,
      scope,
      teamId,
      employeeId,
      name,
      targetValue,
      currentValue: 0,
      unit,
      startDate: new Date(),
      targetDate,
      status: 'ON_TRACK',
      forecastValue: targetValue,
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.deps.goalRepo.createGoal(goal);
  }

  public async listGoals(orgId: string): Promise<TeamGoal[]> {
    return this.deps.goalRepo.listGoals(orgId);
  }

  // --- SEED INITIAL TEAM DATA ---

  public async seedInitialTeamData(orgId: string): Promise<TeamEmployee[]> {
    const existing = await this.deps.employeeRepo.listEmployees(orgId);
    if (existing.length > 0) return existing;

    const emp1 = await this.createEmployee(
      orgId,
      'Amadou',
      'Fall',
      '+221771234567',
      'OWNER',
      ['MANAGEMENT', 'STRATEGY'],
      ['Direction générale', 'Vision commercial']
    );

    const emp2 = await this.createEmployee(
      orgId,
      'Fatou',
      'Diop',
      '+221772345678',
      'COMMERCIAL',
      ['SALES', 'CRM', 'WHATSAPP'],
      ['Conversion leads', 'Relance prospects']
    );

    const emp3 = await this.createEmployee(
      orgId,
      'Moussa',
      'Ndiaye',
      '+221773456789',
      'LIVREUR',
      ['LOGISTICS', 'NAVIGATION'],
      ['Livraison colis', 'Encaissement Cash']
    );

    // Create reference initial tasks
    await this.createTask(
      orgId,
      emp1.id,
      'Relancer 15 prospects chauds WhatsApp',
      'HIGH',
      'CUSTOMER',
      'Campagne relance suite aux demandes de catalogue',
      emp2.id
    );

    await this.createTask(
      orgId,
      emp1.id,
      'Livrer commande ORD-2026-0042 à Fann',
      'URGENT',
      'DELIVERY',
      'Livraison express contre paiement Mobile Money',
      emp3.id
    );

    // Create initial goal
    await this.createGoal(
      orgId,
      emp1.id,
      'Atteindre 300 commandes confirmées ce mois',
      300,
      'commandes',
      new Date(Date.now() + 30 * 86400000),
      'COMPANY'
    );

    return [emp1, emp2, emp3];
  }
}
