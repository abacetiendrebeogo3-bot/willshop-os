/**
 * WILLShop OS — Team & Productivity Repositories Contracts
 * Pure Domain Interfaces — Data Core Contracts.
 */

import {
  TeamEmployee,
  Team,
  TeamTask,
  TaskComment,
  TaskActivity,
  TaskDependency,
  TeamGoal,
  EscalationRecord,
} from '../entities/TeamEntities';

export interface ITeamRepository {
  createTeam(team: Team): Promise<Team>;
  findTeamById(orgId: string, id: string): Promise<Team | null>;
  listTeams(orgId: string): Promise<Team[]>;
}

export interface ITeamEmployeeRepository {
  createEmployee(employee: TeamEmployee): Promise<TeamEmployee>;
  updateEmployee(employee: TeamEmployee): Promise<TeamEmployee>;
  findEmployeeById(orgId: string, id: string): Promise<TeamEmployee | null>;
  findEmployeeByUserId(orgId: string, userId: string): Promise<TeamEmployee | null>;
  listEmployees(orgId: string): Promise<TeamEmployee[]>;
}

export interface ITeamTaskRepository {
  createTask(task: TeamTask): Promise<TeamTask>;
  updateTask(task: TeamTask): Promise<TeamTask>;
  findTaskById(orgId: string, id: string): Promise<TeamTask | null>;
  listTasks(orgId: string, filters?: { assignedTo?: string; status?: string; source?: string }): Promise<TeamTask[]>;
}

export interface ITaskDependencyRepository {
  addDependency(dependency: TaskDependency): Promise<TaskDependency>;
  listDependencies(orgId: string, taskId?: string): Promise<TaskDependency[]>;
}

export interface ITaskCommentRepository {
  addComment(comment: TaskComment): Promise<TaskComment>;
  listComments(orgId: string, taskId: string): Promise<TaskComment[]>;
}

export interface ITaskActivityRepository {
  recordActivity(activity: TaskActivity): Promise<TaskActivity>;
  listActivities(orgId: string, taskId: string): Promise<TaskActivity[]>;
}

export interface ITeamGoalRepository {
  createGoal(goal: TeamGoal): Promise<TeamGoal>;
  updateGoal(goal: TeamGoal): Promise<TeamGoal>;
  findGoalById(orgId: string, id: string): Promise<TeamGoal | null>;
  listGoals(orgId: string): Promise<TeamGoal[]>;
}

export interface IEscalationRepository {
  createEscalation(escalation: EscalationRecord): Promise<EscalationRecord>;
  updateEscalation(escalation: EscalationRecord): Promise<EscalationRecord>;
  listEscalations(orgId: string, taskId?: string): Promise<EscalationRecord[]>;
}
