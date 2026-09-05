/**
 * WILLShop OS — Supabase Team Repositories
 * Production Supabase PostgreSQL implementation.
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

  public async createTeam(team: Team): Promise<Team> {
    const { data, error } = await this.client.from('teams').insert(team).select().single();
    if (error) throw new Error(`Supabase error creating team: ${error.message}`);
    return data as Team;
  }

  public async findTeamById(orgId: string, id: string): Promise<Team | null> {
    const { data, error } = await this.client
      .from('teams')
      .select('*')
      .eq('organization_id', orgId)
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(`Supabase error fetching team: ${error.message}`);
    return data ? (data as Team) : null;
  }

  public async listTeams(orgId: string): Promise<Team[]> {
    const { data, error } = await this.client
      .from('teams')
      .select('*')
      .eq('organization_id', orgId);
    if (error) throw new Error(`Supabase error listing teams: ${error.message}`);
    return (data || []) as Team[];
  }

  public async createEmployee(employee: TeamEmployee): Promise<TeamEmployee> {
    const { data, error } = await this.client.from('team_employees').insert(employee).select().single();
    if (error) throw new Error(`Supabase error creating employee: ${error.message}`);
    return data as TeamEmployee;
  }

  public async updateEmployee(employee: TeamEmployee): Promise<TeamEmployee> {
    const { data, error } = await this.client
      .from('team_employees')
      .update(employee)
      .eq('organization_id', employee.organizationId)
      .eq('id', employee.id)
      .select()
      .single();
    if (error) throw new Error(`Supabase error updating employee: ${error.message}`);
    return data as TeamEmployee;
  }

  public async findEmployeeById(orgId: string, id: string): Promise<TeamEmployee | null> {
    const { data, error } = await this.client
      .from('team_employees')
      .select('*')
      .eq('organization_id', orgId)
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(`Supabase error fetching employee: ${error.message}`);
    return data ? (data as TeamEmployee) : null;
  }

  public async findEmployeeByUserId(orgId: string, userId: string): Promise<TeamEmployee | null> {
    const { data, error } = await this.client
      .from('team_employees')
      .select('*')
      .eq('organization_id', orgId)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw new Error(`Supabase error fetching employee by userId: ${error.message}`);
    return data ? (data as TeamEmployee) : null;
  }

  public async listEmployees(orgId: string): Promise<TeamEmployee[]> {
    const { data, error } = await this.client
      .from('team_employees')
      .select('*')
      .eq('organization_id', orgId)
      .is('deleted_at', null);
    if (error) throw new Error(`Supabase error listing employees: ${error.message}`);
    return (data || []) as TeamEmployee[];
  }

  public async createTask(task: TeamTask): Promise<TeamTask> {
    const { data, error } = await this.client.from('team_tasks').insert(task).select().single();
    if (error) throw new Error(`Supabase error creating task: ${error.message}`);
    return data as TeamTask;
  }

  public async updateTask(task: TeamTask): Promise<TeamTask> {
    const { data, error } = await this.client
      .from('team_tasks')
      .update(task)
      .eq('organization_id', task.organizationId)
      .eq('id', task.id)
      .select()
      .single();
    if (error) throw new Error(`Supabase error updating task: ${error.message}`);
    return data as TeamTask;
  }

  public async findTaskById(orgId: string, id: string): Promise<TeamTask | null> {
    const { data, error } = await this.client
      .from('team_tasks')
      .select('*')
      .eq('organization_id', orgId)
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(`Supabase error fetching task: ${error.message}`);
    return data ? (data as TeamTask) : null;
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
    return (data || []) as TeamTask[];
  }

  public async addDependency(dependency: TaskDependency): Promise<TaskDependency> {
    const { data, error } = await this.client.from('task_dependencies').insert(dependency).select().single();
    if (error) throw new Error(`Supabase error adding task dependency: ${error.message}`);
    return data as TaskDependency;
  }

  public async listDependencies(orgId: string, taskId?: string): Promise<TaskDependency[]> {
    let query = this.client.from('task_dependencies').select('*').eq('organization_id', orgId);
    if (taskId) query = query.eq('task_id', taskId);
    const { data, error } = await query;
    if (error) throw new Error(`Supabase error listing task dependencies: ${error.message}`);
    return (data || []) as TaskDependency[];
  }

  public async addComment(comment: TaskComment): Promise<TaskComment> {
    const { data, error } = await this.client.from('task_comments').insert(comment).select().single();
    if (error) throw new Error(`Supabase error adding task comment: ${error.message}`);
    return data as TaskComment;
  }

  public async listComments(orgId: string, taskId: string): Promise<TaskComment[]> {
    const { data, error } = await this.client
      .from('task_comments')
      .select('*')
      .eq('organization_id', orgId)
      .eq('task_id', taskId);
    if (error) throw new Error(`Supabase error listing comments: ${error.message}`);
    return (data || []) as TaskComment[];
  }

  public async recordActivity(activity: TaskActivity): Promise<TaskActivity> {
    const { data, error } = await this.client.from('task_activities').insert(activity).select().single();
    if (error) throw new Error(`Supabase error recording task activity: ${error.message}`);
    return data as TaskActivity;
  }

  public async listActivities(orgId: string, taskId: string): Promise<TaskActivity[]> {
    const { data, error } = await this.client
      .from('task_activities')
      .select('*')
      .eq('organization_id', orgId)
      .eq('task_id', taskId);
    if (error) throw new Error(`Supabase error listing activities: ${error.message}`);
    return (data || []) as TaskActivity[];
  }

  public async createGoal(goal: TeamGoal): Promise<TeamGoal> {
    const { data, error } = await this.client.from('team_goals').insert(goal).select().single();
    if (error) throw new Error(`Supabase error creating team goal: ${error.message}`);
    return data as TeamGoal;
  }

  public async updateGoal(goal: TeamGoal): Promise<TeamGoal> {
    const { data, error } = await this.client
      .from('team_goals')
      .update(goal)
      .eq('organization_id', goal.organizationId)
      .eq('id', goal.id)
      .select()
      .single();
    if (error) throw new Error(`Supabase error updating team goal: ${error.message}`);
    return data as TeamGoal;
  }

  public async findGoalById(orgId: string, id: string): Promise<TeamGoal | null> {
    const { data, error } = await this.client
      .from('team_goals')
      .select('*')
      .eq('organization_id', orgId)
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(`Supabase error fetching goal: ${error.message}`);
    return data ? (data as TeamGoal) : null;
  }

  public async listGoals(orgId: string): Promise<TeamGoal[]> {
    const { data, error } = await this.client
      .from('team_goals')
      .select('*')
      .eq('organization_id', orgId);
    if (error) throw new Error(`Supabase error listing goals: ${error.message}`);
    return (data || []) as TeamGoal[];
  }

  public async createEscalation(escalation: EscalationRecord): Promise<EscalationRecord> {
    const { data, error } = await this.client.from('task_escalations').insert(escalation).select().single();
    if (error) throw new Error(`Supabase error creating escalation: ${error.message}`);
    return data as EscalationRecord;
  }

  public async updateEscalation(escalation: EscalationRecord): Promise<EscalationRecord> {
    const { data, error } = await this.client
      .from('task_escalations')
      .update(escalation)
      .eq('organization_id', escalation.organizationId)
      .eq('id', escalation.id)
      .select()
      .single();
    if (error) throw new Error(`Supabase error updating escalation: ${error.message}`);
    return data as EscalationRecord;
  }

  public async listEscalations(orgId: string, taskId?: string): Promise<EscalationRecord[]> {
    let query = this.client.from('task_escalations').select('*').eq('organization_id', orgId);
    if (taskId) query = query.eq('task_id', taskId);
    const { data, error } = await query;
    if (error) throw new Error(`Supabase error listing escalations: ${error.message}`);
    return (data || []) as EscalationRecord[];
  }
}
