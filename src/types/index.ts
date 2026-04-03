import { z } from 'zod/v4';

// ─── Status & Priority Enums ─────────────────────────────────
export const StatusEnum = z.enum(['todo', 'in_progress', 'in_review', 'done']);
export type Status = z.infer<typeof StatusEnum>;

export const PriorityEnum = z.enum(['low', 'normal', 'high']);
export type Priority = z.infer<typeof PriorityEnum>;

// ─── Task Schema ─────────────────────────────────────────────
export const TaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().nullable(),
  status: StatusEnum,
  priority: PriorityEnum,
  due_date: z.string().nullable(),
  user_id: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
  position: z.number().int(),
});
export type Task = z.infer<typeof TaskSchema>;

export const CreateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(2000).optional(),
  priority: PriorityEnum.default('normal'),
  due_date: z.string().optional(),
  status: StatusEnum.default('todo'),
});
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;

export const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  status: StatusEnum.optional(),
  priority: PriorityEnum.optional(),
  due_date: z.string().nullable().optional(),
  position: z.number().int().optional(),
});
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;

// ─── Team Member Schema ──────────────────────────────────────
export const TeamMemberSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  avatar_url: z.string().nullable(),
  color: z.string(),
  user_id: z.string().uuid(),
  created_at: z.string(),
});
export type TeamMember = z.infer<typeof TeamMemberSchema>;

export const CreateTeamMemberSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  color: z.string().default('#6366f1'),
});
export type CreateTeamMemberInput = z.infer<typeof CreateTeamMemberSchema>;

// ─── Task Assignee Schema ────────────────────────────────────
export const TaskAssigneeSchema = z.object({
  id: z.string().uuid(),
  task_id: z.string().uuid(),
  team_member_id: z.string().uuid(),
  user_id: z.string().uuid(),
});
export type TaskAssignee = z.infer<typeof TaskAssigneeSchema>;

// ─── Label Schema ────────────────────────────────────────────
export const LabelSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50),
  color: z.string(),
  user_id: z.string().uuid(),
  created_at: z.string(),
});
export type Label = z.infer<typeof LabelSchema>;

export const CreateLabelSchema = z.object({
  name: z.string().min(1, 'Label name is required').max(50),
  color: z.string().default('#6366f1'),
});
export type CreateLabelInput = z.infer<typeof CreateLabelSchema>;

// ─── Task Label Schema ───────────────────────────────────────
export const TaskLabelSchema = z.object({
  id: z.string().uuid(),
  task_id: z.string().uuid(),
  label_id: z.string().uuid(),
  user_id: z.string().uuid(),
});
export type TaskLabel = z.infer<typeof TaskLabelSchema>;

// ─── Comment Schema ──────────────────────────────────────────
export const CommentSchema = z.object({
  id: z.string().uuid(),
  task_id: z.string().uuid(),
  content: z.string().min(1).max(2000),
  user_id: z.string().uuid(),
  created_at: z.string(),
});
export type Comment = z.infer<typeof CommentSchema>;

export const CreateCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(2000),
  task_id: z.string().uuid(),
});
export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;

// ─── Activity Log Schema ─────────────────────────────────────
export const ActivityLogSchema = z.object({
  id: z.string().uuid(),
  task_id: z.string().uuid(),
  action: z.string(),
  details: z.string().nullable(),
  user_id: z.string().uuid(),
  created_at: z.string(),
});
export type ActivityLog = z.infer<typeof ActivityLogSchema>;

// ─── Column Configuration ────────────────────────────────────
export interface ColumnConfig {
  id: Status;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  dotColor: string;
  iconColor: string;
}

export const COLUMNS: ColumnConfig[] = [
  {
    id: 'todo',
    label: 'To Do',
    color: 'text-slate-700',
    bgColor: 'bg-slate-50/80',
    borderColor: 'border-slate-200',
    dotColor: 'bg-slate-400',
    iconColor: '#94a3b8',
  },
  {
    id: 'in_progress',
    label: 'In Progress',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50/80',
    borderColor: 'border-blue-200',
    dotColor: 'bg-blue-500',
    iconColor: '#3b82f6',
  },
  {
    id: 'in_review',
    label: 'In Review',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50/80',
    borderColor: 'border-amber-200',
    dotColor: 'bg-amber-500',
    iconColor: '#f59e0b',
  },
  {
    id: 'done',
    label: 'Done',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50/80',
    borderColor: 'border-emerald-200',
    dotColor: 'bg-emerald-500',
    iconColor: '#10b981',
  },
];

// ─── Filter Types ────────────────────────────────────────────
export interface BoardFilters {
  search: string;
  priority: Priority | 'all';
  assignee: string | 'all';
  label: string | 'all';
}

export const DEFAULT_FILTERS: BoardFilters = {
  search: '',
  priority: 'all',
  assignee: 'all',
  label: 'all',
};

// ─── Color Presets for Team Members & Labels ─────────────────
export const COLOR_PRESETS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#ef4444', '#f97316',
  '#eab308', '#84cc16', '#22c55e', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#64748b',
] as const;
