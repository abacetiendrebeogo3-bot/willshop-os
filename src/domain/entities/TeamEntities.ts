/**
 * WILLShop OS — Team & Productivity Engine Entities
 * Pure Domain Layer — ZERO external dependencies.
 */

export type EmployeeRole = 'OWNER' | 'MANAGER' | 'COMMERCIAL' | 'LIVREUR' | 'VIEWER';
export type EmploymentStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'ARCHIVED';
export type EmployeeActivityStatus = 'ONLINE' | 'OFFLINE' | 'IN_FIELD' | 'BUSY';

export interface TeamEmployee {
  id: string;
  organizationId: string;
  userId?: string | null;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  role: EmployeeRole;
  employmentStatus: EmploymentStatus;
  joinedAt: Date;
  managerId?: string | null;
  teamId?: string | null;
  skills: string[];
  responsibilities: string[];
  activityStatus: EmployeeActivityStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface Team {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  leaderId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatus =
  | 'BACKLOG'
  | 'TODO'
  | 'IN_PROGRESS'
  | 'BLOCKED'
  | 'DONE'
  | 'CANCELLED'
  | 'ARCHIVED';

export type TaskSource =
  | 'MANUAL'
  | 'CEO_AI'
  | 'AUTOMATION'
  | 'ORDER'
  | 'DELIVERY'
  | 'CUSTOMER'
  | 'MARKETING'
  | 'FINANCE'
  | 'STOCK'
  | 'GOAL'
  | 'SYSTEM';

export type RelatedEntityType =
  | 'customer'
  | 'order'
  | 'delivery'
  | 'product'
  | 'campaign'
  | 'transaction'
  | 'goal'
  | 'employee'
  | 'AI_recommendation';

export interface TeamTask {
  id: string;
  organizationId: string;
  title: string;
  description?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  source: TaskSource;
  createdBy: string;
  assignedTo?: string | null;
  teamId?: string | null;
  dueAt?: Date | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
  relatedEntityType?: RelatedEntityType | null;
  relatedEntityId?: string | null;
  parentTaskId?: string | null;
  blockerReason?: string | null;
  blockedBy?: string | null;
  blockedAt?: Date | null;
  recurrence?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskComment {
  id: string;
  organizationId: string;
  taskId: string;
  authorId: string;
  content: string;
  createdAt: Date;
}

export type TaskActionType =
  | 'CREATED'
  | 'ASSIGNED'
  | 'REASSIGNED'
  | 'STATUS_CHANGED'
  | 'PRIORITY_CHANGED'
  | 'BLOCKED'
  | 'UNBLOCKED'
  | 'DEADLINE_UPDATED'
  | 'COMMENTED';

export interface TaskActivity {
  id: string;
  organizationId: string;
  taskId: string;
  actorId: string;
  action: TaskActionType;
  details: Record<string, unknown>;
  createdAt: Date;
}

export interface TaskDependency {
  id: string;
  organizationId: string;
  taskId: string;
  dependsOnTaskId: string;
  createdAt: Date;
}

export type GoalScope = 'COMPANY' | 'TEAM' | 'EMPLOYEE';
export type GoalStatus = 'ON_TRACK' | 'AT_RISK' | 'OFF_TRACK' | 'ACHIEVED' | 'FAILED' | 'CANCELLED';

export interface TeamGoal {
  id: string;
  organizationId: string;
  scope: GoalScope;
  teamId?: string | null;
  employeeId?: string | null;
  parentGoalId?: string | null;
  name: string;
  description?: string | null;
  targetValue: number;
  currentValue: number;
  unit: string;
  startDate: Date;
  targetDate: Date;
  status: GoalStatus;
  forecastValue?: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export type WorkloadStatus = 'UNDERUTILIZED' | 'BALANCED' | 'OVERLOADED';

export interface WorkloadSummary {
  employeeId: string;
  employeeName: string;
  role: EmployeeRole;
  openTasksCount: number;
  urgentTasksCount: number;
  overdueTasksCount: number;
  blockedTasksCount: number;
  estimatedHours: number;
  status: WorkloadStatus;
}

export interface EmployeePerformanceScorecard {
  employeeId: string;
  employeeName: string;
  role: EmployeeRole;
  period: string;
  activityScore: number; // 0-100
  qualityScore: number; // 0-100
  resultScore: number; // 0-100
  reliabilityScore: number; // 0-100
  goalScore: number; // 0-100
  overallScore: number; // 0-100
  kpis: Record<string, number>;
  contextualNotes: string[];
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface EscalationRecord {
  id: string;
  organizationId: string;
  taskId: string;
  escalationLevel: number; // 1: reminder, 2: manager, 3: CEO
  reason: string;
  triggeredAt: Date;
  resolvedAt?: Date | null;
  status: 'ACTIVE' | 'RESOLVED' | 'EXPIRED';
}
