/**
 * WILLShop OS — In-Memory Team Repositories
 * Fast In-Memory Infrastructure implementation for testing and rapid execution.
 */

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
import {
  TeamEmployee,
  Team,
  TeamTask,
  TaskComment,
  TaskActivity,
  TaskDependency,
  TeamGoal,
  EscalationRecord,
} from '../../domain/entities/TeamEntities';

export class InMemoryTeamRepositories
  implements
    ITeamRepository,
    ITeamEmployeeRepository,
    ITeamTaskRepository,
    ITaskDependencyRepository,
    ITaskCommentRepository,
    ITaskActivityRepository,
    ITeamGoalRepository,
    IEscalationRepository
{
  private teams: Team[] = [];
  private employees: TeamEmployee[] = [];
  private tasks: TeamTask[] = [];
  private dependencies: TaskDependency[] = [];
  private comments: TaskComment[] = [];
  private activities: TaskActivity[] = [];
  private goals: TeamGoal[] = [];
  private escalations: EscalationRecord[] = [];

  // Team Methods
  public async createTeam(team: Team): Promise<Team> {
    this.teams.push(team);
    return team;
  }

  public async findTeamById(orgId: string, id: string): Promise<Team | null> {
    return this.teams.find((t) => t.organizationId === orgId && t.id === id) || null;
  }

  public async listTeams(orgId: string): Promise<Team[]> {
    return this.teams.filter((t) => t.organizationId === orgId);
  }

  // Employee Methods
  public async createEmployee(employee: TeamEmployee): Promise<TeamEmployee> {
    this.employees.push(employee);
    return employee;
  }

  public async updateEmployee(employee: TeamEmployee): Promise<TeamEmployee> {
    const index = this.employees.findIndex(
      (e) => e.organizationId === employee.organizationId && e.id === employee.id
    );
    if (index >= 0) {
      this.employees[index] = { ...employee, updatedAt: new Date() };
      return this.employees[index];
    }
    this.employees.push(employee);
    return employee;
  }

  public async findEmployeeById(orgId: string, id: string): Promise<TeamEmployee | null> {
    return this.employees.find((e) => e.organizationId === orgId && e.id === id) || null;
  }

  public async findEmployeeByUserId(orgId: string, userId: string): Promise<TeamEmployee | null> {
    return this.employees.find((e) => e.organizationId === orgId && e.userId === userId) || null;
  }

  public async listEmployees(orgId: string): Promise<TeamEmployee[]> {
    return this.employees.filter((e) => e.organizationId === orgId && !e.deletedAt);
  }

  // Task Methods
  public async createTask(task: TeamTask): Promise<TeamTask> {
    this.tasks.push(task);
    return task;
  }

  public async updateTask(task: TeamTask): Promise<TeamTask> {
    const index = this.tasks.findIndex(
      (t) => t.organizationId === task.organizationId && t.id === task.id
    );
    if (index >= 0) {
      this.tasks[index] = { ...task, updatedAt: new Date() };
      return this.tasks[index];
    }
    this.tasks.push(task);
    return task;
  }

  public async findTaskById(orgId: string, id: string): Promise<TeamTask | null> {
    return this.tasks.find((t) => t.organizationId === orgId && t.id === id) || null;
  }

  public async listTasks(
    orgId: string,
    filters?: { assignedTo?: string; status?: string; source?: string }
  ): Promise<TeamTask[]> {
    let result = this.tasks.filter((t) => t.organizationId === orgId);
    if (filters?.assignedTo) {
      result = result.filter((t) => t.assignedTo === filters.assignedTo);
    }
    if (filters?.status) {
      result = result.filter((t) => t.status === filters.status);
    }
    if (filters?.source) {
      result = result.filter((t) => t.source === filters.source);
    }
    return result;
  }

  // Dependencies
  public async addDependency(dependency: TaskDependency): Promise<TaskDependency> {
    this.dependencies.push(dependency);
    return dependency;
  }

  public async listDependencies(orgId: string, taskId?: string): Promise<TaskDependency[]> {
    let res = this.dependencies.filter((d) => d.organizationId === orgId);
    if (taskId) {
      res = res.filter((d) => d.taskId === taskId);
    }
    return res;
  }

  // Comments
  public async addComment(comment: TaskComment): Promise<TaskComment> {
    this.comments.push(comment);
    return comment;
  }

  public async listComments(orgId: string, taskId: string): Promise<TaskComment[]> {
    return this.comments.filter((c) => c.organizationId === orgId && c.taskId === taskId);
  }

  // Activities
  public async recordActivity(activity: TaskActivity): Promise<TaskActivity> {
    this.activities.push(activity);
    return activity;
  }

  public async listActivities(orgId: string, taskId: string): Promise<TaskActivity[]> {
    return this.activities.filter((a) => a.organizationId === orgId && a.taskId === taskId);
  }

  // Goals
  public async createGoal(goal: TeamGoal): Promise<TeamGoal> {
    this.goals.push(goal);
    return goal;
  }

  public async updateGoal(goal: TeamGoal): Promise<TeamGoal> {
    const index = this.goals.findIndex(
      (g) => g.organizationId === goal.organizationId && g.id === goal.id
    );
    if (index >= 0) {
      this.goals[index] = { ...goal, updatedAt: new Date() };
      return this.goals[index];
    }
    this.goals.push(goal);
    return goal;
  }

  public async findGoalById(orgId: string, id: string): Promise<TeamGoal | null> {
    return this.goals.find((g) => g.organizationId === orgId && g.id === id) || null;
  }

  public async listGoals(orgId: string): Promise<TeamGoal[]> {
    return this.goals.filter((g) => g.organizationId === orgId);
  }

  // Escalations
  public async createEscalation(escalation: EscalationRecord): Promise<EscalationRecord> {
    this.escalations.push(escalation);
    return escalation;
  }

  public async updateEscalation(escalation: EscalationRecord): Promise<EscalationRecord> {
    const index = this.escalations.findIndex(
      (e) => e.organizationId === escalation.organizationId && e.id === escalation.id
    );
    if (index >= 0) {
      this.escalations[index] = escalation;
      return this.escalations[index];
    }
    this.escalations.push(escalation);
    return escalation;
  }

  public async listEscalations(orgId: string, taskId?: string): Promise<EscalationRecord[]> {
    let res = this.escalations.filter((e) => e.organizationId === orgId);
    if (taskId) {
      res = res.filter((e) => e.taskId === taskId);
    }
    return res;
  }
}
