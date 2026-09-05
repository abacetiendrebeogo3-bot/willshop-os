/**
 * WILLShop OS — Supabase Team Repositories
 * Production Supabase PostgreSQL implementation with snake_case DB mapping.
 */

import { SupabaseClient } from '@supabase/supabase-js';
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

export class SupabaseTeamRepositories
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
  constructor(private client: SupabaseClient) {}

  // --- MAPPER HELPERS ---

  private mapDBToEmployee(row: any): TeamEmployee {
    return {
      id: row.id,
      organizationId: row.organization_id,
      userId: row.user_id,
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone,
      email: row.email,
      role: row.role,
      employmentStatus: row.employment_status,
      joinedAt: row.joined_at ? new Date(row.joined_at) : new Date(),
      managerId: row.manager_id,
      teamId: row.team_id,
      skills: row.skills || [],
      responsibilities: row.responsibilities || [],
      activityStatus: row.activity_status || 'OFFLINE',
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
      updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
      deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
    };
  }

  private mapEmployeeToDB(emp: Partial<TeamEmployee>): any {
    const dbObj: any = {};
    if (emp.id !== undefined) dbObj.id = emp.id;
    if (emp.organizationId !== undefined) dbObj.organization_id = emp.organizationId;
    if (emp.userId !== undefined) dbObj.user_id = emp.userId;
    if (emp.firstName !== undefined) dbObj.first_name = emp.firstName;
    if (emp.lastName !== undefined) dbObj.last_name = emp.lastName;
    if (emp.phone !== undefined) dbObj.phone = emp.phone;
    if (emp.email !== undefined) dbObj.email = emp.email;
    if (emp.role !== undefined) dbObj.role = emp.role;
    if (emp.employmentStatus !== undefined) dbObj.employment_status = emp.employmentStatus;
    if (emp.joinedAt !== undefined) dbObj.joined_at = emp.joinedAt;
    if (emp.managerId !== undefined) dbObj.manager_id = emp.managerId;
    if (emp.teamId !== undefined) dbObj.team_id = emp.teamId;
    if (emp.skills !== undefined) dbObj.skills = emp.skills;
    if (emp.responsibilities !== undefined) dbObj.responsibilities = emp.responsibilities;
    if (emp.activityStatus !== undefined) dbObj.activity_status = emp.activityStatus;
    if (emp.createdAt !== undefined) dbObj.created_at = emp.createdAt;
    if (emp.updatedAt !== undefined) dbObj.updated_at = emp.updatedAt;
    if (emp.deletedAt !== undefined) dbObj.deleted_at = emp.deletedAt;
    return dbObj;
  }

  private mapDBToTask(row: any): TeamTask {
    return {
      id: row.id,
      organizationId: row.organization_id,
      title: row.title,
      description: row.description,
      priority: row.priority,
      status: row.status,
      source: row.source,
      createdBy: row.created_by,
      assignedTo: row.assigned_to,
      teamId: row.team_id,
      dueAt: row.due_at ? new Date(row.due_at) : null,
      startedAt: row.started_at ? new Date(row.started_at) : null,
      completedAt: row.completed_at ? new Date(row.completed_at) : null,
      relatedEntityType: row.related_entity_type,
      relatedEntityId: row.related_entity_id,
      parentTaskId: row.parent_task_id,
      blockerReason: row.blocker_reason,
      blockedBy: row.blocked_by,
      blockedAt: row.blocked_at ? new Date(row.blocked_at) : null,
      recurrence: row.recurrence,
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
      updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
    };
  }

  private mapTaskToDB(task: Partial<TeamTask>): any {
    const dbObj: any = {};
    if (task.id !== undefined) dbObj.id = task.id;
    if (task.organizationId !== undefined) dbObj.organization_id = task.organizationId;
    if (task.title !== undefined) dbObj.title = task.title;
    if (task.description !== undefined) dbObj.description = task.description;
    if (task.priority !== undefined) dbObj.priority = task.priority;
    if (task.status !== undefined) dbObj.status = task.status;
    if (task.source !== undefined) dbObj.source = task.source;
    if (task.createdBy !== undefined) dbObj.created_by = task.createdBy;
    if (task.assignedTo !== undefined) dbObj.assigned_to = task.assignedTo;
    if (task.teamId !== undefined) dbObj.team_id = task.teamId;
    if (task.dueAt !== undefined) dbObj.due_at = task.dueAt;
    if (task.startedAt !== undefined) dbObj.started_at = task.startedAt;
    if (task.completedAt !== undefined) dbObj.completed_at = task.completedAt;
    if (task.relatedEntityType !== undefined) dbObj.related_entity_type = task.relatedEntityType;
    if (task.relatedEntityId !== undefined) dbObj.related_entity_id = task.relatedEntityId;
    if (task.parentTaskId !== undefined) dbObj.parent_task_id = task.parentTaskId;
    if (task.blockerReason !== undefined) dbObj.blocker_reason = task.blockerReason;
    if (task.blockedBy !== undefined) dbObj.blocked_by = task.blockedBy;
    if (task.blockedAt !== undefined) dbObj.blocked_at = task.blockedAt;
    if (task.recurrence !== undefined) dbObj.recurrence = task.recurrence;
    if (task.createdAt !== undefined) dbObj.created_at = task.createdAt;
    if (task.updatedAt !== undefined) dbObj.updated_at = task.updatedAt;
    return dbObj;
  }

  private mapDBToEscalation(row: any): EscalationRecord {
    return {
      id: row.id,
      organizationId: row.organization_id,
      taskId: row.task_id,
      escalationLevel: row.escalation_level,
      reason: row.reason,
      triggeredAt: row.triggered_at ? new Date(row.triggered_at) : new Date(),
      resolvedAt: row.resolved_at ? new Date(row.resolved_at) : null,
      status: row.status,
    };
  }

  private mapEscalationToDB(esc: Partial<EscalationRecord>): any {
    const dbObj: any = {};
    if (esc.id !== undefined) dbObj.id = esc.id;
    if (esc.organizationId !== undefined) dbObj.organization_id = esc.organizationId;
    if (esc.taskId !== undefined) dbObj.task_id = esc.taskId;
    if (esc.escalationLevel !== undefined) dbObj.escalation_level = esc.escalationLevel;
    if (esc.reason !== undefined) dbObj.reason = esc.reason;
    if (esc.triggeredAt !== undefined) dbObj.triggered_at = esc.triggeredAt;
    if (esc.resolvedAt !== undefined) dbObj.resolved_at = esc.resolvedAt;
    if (esc.status !== undefined) dbObj.status = esc.status;
    return dbObj;
  }

  // --- TEAMS ---

  public async createTeam(team: Team): Promise<Team> {
    const dbPayload = {
      id: team.id,
      organization_id: team.organizationId,
      name: team.name,
      description: team.description,
      leader_id: team.leaderId,
      created_at: team.createdAt,
      updated_at: team.updatedAt,
    };
    const { data, error } = await this.client.from('teams').insert(dbPayload).select().single();
    if (error) throw new Error(`Supabase error creating team: ${error.message}`);
    return {
      id: data.id,
      organizationId: data.organization_id,
      name: data.name,
      description: data.description,
      leaderId: data.leader_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  public async findTeamById(orgId: string, id: string): Promise<Team | null> {
    const { data, error } = await this.client
      .from('teams')
      .select('*')
      .eq('organization_id', orgId)
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(`Supabase error fetching team: ${error.message}`);
    return data
      ? {
          id: data.id,
          organizationId: data.organization_id,
          name: data.name,
          description: data.description,
          leaderId: data.leader_id,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        }
      : null;
  }

  public async listTeams(orgId: string): Promise<Team[]> {
    const { data, error } = await this.client
      .from('teams')
      .select('*')
      .eq('organization_id', orgId);
    if (error) throw new Error(`Supabase error listing teams: ${error.message}`);
    return (data || []).map((row: any) => ({
      id: row.id,
      organizationId: row.organization_id,
      name: row.name,
      description: row.description,
      leaderId: row.leader_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  }

  // --- EMPLOYEES ---

  public async createEmployee(employee: TeamEmployee): Promise<TeamEmployee> {
    const dbPayload = this.mapEmployeeToDB(employee);
    const { data, error } = await this.client.from('team_employees').insert(dbPayload).select().single();
    if (error) throw new Error(`Supabase error creating employee: ${error.message}`);
    return this.mapDBToEmployee(data);
  }

  public async updateEmployee(employee: TeamEmployee): Promise<TeamEmployee> {
    const dbPayload = this.mapEmployeeToDB(employee);
    const { data, error } = await this.client
      .from('team_employees')
      .update(dbPayload)
      .eq('organization_id', employee.organizationId)
      .eq('id', employee.id)
      .select()
      .single();
    if (error) throw new Error(`Supabase error updating employee: ${error.message}`);
    return this.mapDBToEmployee(data);
  }

  public async findEmployeeById(orgId: string, id: string): Promise<TeamEmployee | null> {
    const { data, error } = await this.client
      .from('team_employees')
      .select('*')
      .eq('organization_id', orgId)
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(`Supabase error fetching employee: ${error.message}`);
    return data ? this.mapDBToEmployee(data) : null;
  }

  public async findEmployeeByUserId(orgId: string, userId: string): Promise<TeamEmployee | null> {
    const { data, error } = await this.client
      .from('team_employees')
      .select('*')
      .eq('organization_id', orgId)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw new Error(`Supabase error fetching employee by userId: ${error.message}`);
    return data ? this.mapDBToEmployee(data) : null;
  }

  public async listEmployees(orgId: string): Promise<TeamEmployee[]> {
    const { data, error } = await this.client
      .from('team_employees')
      .select('*')
      .eq('organization_id', orgId)
      .is('deleted_at', null);
    if (error) throw new Error(`Supabase error listing employees: ${error.message}`);
    return (data || []).map((row: any) => this.mapDBToEmployee(row));
  }

  // --- TASKS ---

  public async createTask(task: TeamTask): Promise<TeamTask> {
    const dbPayload = this.mapTaskToDB(task);
    const { data, error } = await this.client.from('team_tasks').insert(dbPayload).select().single();
    if (error) throw new Error(`Supabase error creating task: ${error.message}`);
    return this.mapDBToTask(data);
  }

  public async updateTask(task: TeamTask): Promise<TeamTask> {
    const dbPayload = this.mapTaskToDB(task);
    const { data, error } = await this.client
      .from('team_tasks')
      .update(dbPayload)
      .eq('organization_id', task.organizationId)
      .eq('id', task.id)
      .select()
      .single();
    if (error) throw new Error(`Supabase error updating task: ${error.message}`);
    return this.mapDBToTask(data);
  }

  public async findTaskById(orgId: string, id: string): Promise<TeamTask | null> {
    const { data, error } = await this.client
      .from('team_tasks')
      .select('*')
      .eq('organization_id', orgId)
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(`Supabase error fetching task: ${error.message}`);
    return data ? this.mapDBToTask(data) : null;
  }

  public async listTasks(
    orgId: string,
    filters?: { assignedTo?: string; status?: string; source?: string }
  ): Promise<TeamTask[]> {
    let query = this.client.from('team_tasks').select('*').eq('organization_id', orgId);
    if (filters?.assignedTo) query = query.eq('assigned_to', filters.assignedTo);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.source) query = query.eq('source', filters.source);

    const { data, error } = await query;
    if (error) throw new Error(`Supabase error listing tasks: ${error.message}`);
    return (data || []).map((row: any) => this.mapDBToTask(row));
  }

  // --- TASK DEPENDENCIES & COMMENTS & ACTIVITIES ---

  public async addDependency(dependency: TaskDependency): Promise<TaskDependency> {
    const dbPayload = {
      id: dependency.id,
      organization_id: dependency.organizationId,
      task_id: dependency.taskId,
      depends_on_task_id: dependency.dependsOnTaskId,
      created_at: dependency.createdAt,
    };
    const { data, error } = await this.client.from('task_dependencies').insert(dbPayload).select().single();
    if (error) throw new Error(`Supabase error adding task dependency: ${error.message}`);
    return {
      id: data.id,
      organizationId: data.organization_id,
      taskId: data.task_id,
      dependsOnTaskId: data.depends_on_task_id,
      createdAt: new Date(data.created_at),
    };
  }

  public async listDependencies(orgId: string, taskId?: string): Promise<TaskDependency[]> {
    let query = this.client.from('task_dependencies').select('*').eq('organization_id', orgId);
    if (taskId) query = query.eq('task_id', taskId);
    const { data, error } = await query;
    if (error) throw new Error(`Supabase error listing task dependencies: ${error.message}`);
    return (data || []).map((row: any) => ({
      id: row.id,
      organizationId: row.organization_id,
      taskId: row.task_id,
      dependsOnTaskId: row.depends_on_task_id,
      createdAt: new Date(row.created_at),
    }));
  }

  public async addComment(comment: TaskComment): Promise<TaskComment> {
    const dbPayload = {
      id: comment.id,
      organization_id: comment.organizationId,
      task_id: comment.taskId,
      author_id: comment.authorId,
      content: comment.content,
      created_at: comment.createdAt,
    };
    const { data, error } = await this.client.from('task_comments').insert(dbPayload).select().single();
    if (error) throw new Error(`Supabase error adding task comment: ${error.message}`);
    return {
      id: data.id,
      organizationId: data.organization_id,
      taskId: data.task_id,
      authorId: data.author_id,
      content: data.content,
      createdAt: new Date(data.created_at),
    };
  }

  public async listComments(orgId: string, taskId: string): Promise<TaskComment[]> {
    const { data, error } = await this.client
      .from('task_comments')
      .select('*')
      .eq('organization_id', orgId)
      .eq('task_id', taskId);
    if (error) throw new Error(`Supabase error listing comments: ${error.message}`);
    return (data || []).map((row: any) => ({
      id: row.id,
      organizationId: row.organization_id,
      taskId: row.task_id,
      authorId: row.author_id,
      content: row.content,
      createdAt: new Date(row.created_at),
    }));
  }

  public async recordActivity(activity: TaskActivity): Promise<TaskActivity> {
    const dbPayload = {
      id: activity.id,
      organization_id: activity.organizationId,
      task_id: activity.taskId,
      actor_id: activity.actorId,
      action: activity.action,
      details: activity.details,
      created_at: activity.createdAt,
    };
    const { data, error } = await this.client.from('task_activities').insert(dbPayload).select().single();
    if (error) throw new Error(`Supabase error recording task activity: ${error.message}`);
    return {
      id: data.id,
      organizationId: data.organization_id,
      taskId: data.task_id,
      actorId: data.actor_id,
      action: data.action,
      details: data.details,
      createdAt: new Date(data.created_at),
    };
  }

  public async listActivities(orgId: string, taskId: string): Promise<TaskActivity[]> {
    const { data, error } = await this.client
      .from('task_activities')
      .select('*')
      .eq('organization_id', orgId)
      .eq('task_id', taskId);
    if (error) throw new Error(`Supabase error listing activities: ${error.message}`);
    return (data || []).map((row: any) => ({
      id: row.id,
      organizationId: row.organization_id,
      taskId: row.task_id,
      actorId: row.actor_id,
      action: row.action,
      details: row.details,
      createdAt: new Date(row.created_at),
    }));
  }

  // --- GOALS ---

  public async createGoal(goal: TeamGoal): Promise<TeamGoal> {
    const dbPayload = {
      id: goal.id,
      organization_id: goal.organizationId,
      scope: goal.scope,
      team_id: goal.teamId,
      employee_id: goal.employeeId,
      parent_goal_id: goal.parentGoalId,
      name: goal.name,
      description: goal.description,
      target_value: goal.targetValue,
      current_value: goal.currentValue,
      unit: goal.unit,
      start_date: goal.startDate,
      target_date: goal.targetDate,
      status: goal.status,
      forecast_value: goal.forecastValue,
      created_by: goal.createdBy,
      created_at: goal.createdAt,
      updated_at: goal.updatedAt,
    };
    const { data, error } = await this.client.from('team_goals').insert(dbPayload).select().single();
    if (error) throw new Error(`Supabase error creating team goal: ${error.message}`);
    return {
      id: data.id,
      organizationId: data.organization_id,
      scope: data.scope,
      teamId: data.team_id,
      employeeId: data.employee_id,
      parentGoalId: data.parent_goal_id,
      name: data.name,
      description: data.description,
      targetValue: data.target_value,
      currentValue: data.current_value,
      unit: data.unit,
      startDate: new Date(data.start_date),
      targetDate: new Date(data.target_date),
      status: data.status,
      forecastValue: data.forecast_value,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  public async updateGoal(goal: TeamGoal): Promise<TeamGoal> {
    const dbPayload = {
      id: goal.id,
      organization_id: goal.organizationId,
      scope: goal.scope,
      team_id: goal.teamId,
      employee_id: goal.employeeId,
      parent_goal_id: goal.parentGoalId,
      name: goal.name,
      description: goal.description,
      target_value: goal.targetValue,
      current_value: goal.currentValue,
      unit: goal.unit,
      start_date: goal.startDate,
      target_date: goal.targetDate,
      status: goal.status,
      forecast_value: goal.forecastValue,
      created_by: goal.createdBy,
      created_at: goal.createdAt,
      updated_at: goal.updatedAt,
    };
    const { data, error } = await this.client
      .from('team_goals')
      .update(dbPayload)
      .eq('organization_id', goal.organizationId)
      .eq('id', goal.id)
      .select()
      .single();
    if (error) throw new Error(`Supabase error updating team goal: ${error.message}`);
    return {
      id: data.id,
      organizationId: data.organization_id,
      scope: data.scope,
      teamId: data.team_id,
      employeeId: data.employee_id,
      parentGoalId: data.parent_goal_id,
      name: data.name,
      description: data.description,
      targetValue: data.target_value,
      currentValue: data.current_value,
      unit: data.unit,
      startDate: new Date(data.start_date),
      targetDate: new Date(data.target_date),
      status: data.status,
      forecastValue: data.forecast_value,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  public async findGoalById(orgId: string, id: string): Promise<TeamGoal | null> {
    const { data, error } = await this.client
      .from('team_goals')
      .select('*')
      .eq('organization_id', orgId)
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(`Supabase error fetching goal: ${error.message}`);
    return data
      ? {
          id: data.id,
          organizationId: data.organization_id,
          scope: data.scope,
          teamId: data.team_id,
          employeeId: data.employee_id,
          parentGoalId: data.parent_goal_id,
          name: data.name,
          description: data.description,
          targetValue: data.target_value,
          currentValue: data.current_value,
          unit: data.unit,
          startDate: new Date(data.start_date),
          targetDate: new Date(data.target_date),
          status: data.status,
          forecastValue: data.forecast_value,
          createdBy: data.created_by,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        }
      : null;
  }

  public async listGoals(orgId: string): Promise<TeamGoal[]> {
    const { data, error } = await this.client
      .from('team_goals')
      .select('*')
      .eq('organization_id', orgId);
    if (error) throw new Error(`Supabase error listing goals: ${error.message}`);
    return (data || []).map((row: any) => ({
      id: row.id,
      organizationId: row.organization_id,
      scope: row.scope,
      teamId: row.team_id,
      employeeId: row.employee_id,
      parentGoalId: row.parent_goal_id,
      name: row.name,
      description: row.description,
      targetValue: row.target_value,
      currentValue: row.current_value,
      unit: row.unit,
      startDate: new Date(row.start_date),
      targetDate: new Date(row.target_date),
      status: row.status,
      forecastValue: row.forecast_value,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  }

  // --- ESCALATIONS ---

  public async createEscalation(escalation: EscalationRecord): Promise<EscalationRecord> {
    const dbPayload = this.mapEscalationToDB(escalation);
    const { data, error } = await this.client.from('task_escalations').insert(dbPayload).select().single();
    if (error) throw new Error(`Supabase error creating escalation: ${error.message}`);
    return this.mapDBToEscalation(data);
  }

  public async updateEscalation(escalation: EscalationRecord): Promise<EscalationRecord> {
    const dbPayload = this.mapEscalationToDB(escalation);
    const { data, error } = await this.client
      .from('task_escalations')
      .update(dbPayload)
      .eq('organization_id', escalation.organizationId)
      .eq('id', escalation.id)
      .select()
      .single();
    if (error) throw new Error(`Supabase error updating escalation: ${error.message}`);
    return this.mapDBToEscalation(data);
  }

  public async listEscalations(orgId: string, taskId?: string): Promise<EscalationRecord[]> {
    let query = this.client.from('task_escalations').select('*').eq('organization_id', orgId);
    if (taskId) query = query.eq('task_id', taskId);
    const { data, error } = await query;
    if (error) throw new Error(`Supabase error listing escalations: ${error.message}`);
    return (data || []).map((row: any) => this.mapDBToEscalation(row));
  }
}
