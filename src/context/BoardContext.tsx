import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { ensureGuestSession } from '../lib/supabase';
import { TaskService } from '../services/taskService';
import { TeamService } from '../services/teamService';
import { LabelService } from '../services/labelService';
import { ActivityService } from '../services/activityService';
import { CommentService } from '../services/commentService';
import type {
  Task, CreateTaskInput, UpdateTaskInput, Status,
  TeamMember, TaskAssignee, Label, TaskLabel,
  Comment, ActivityLog, BoardFilters,
} from '../types';
import { DEFAULT_FILTERS, COLUMNS } from '../types';

interface BoardContextValue {
  // Tasks
  tasks: Task[];
  loading: boolean;
  error: string | null;
  createTask: (input: CreateTaskInput) => Promise<boolean>;
  updateTask: (taskId: string, input: UpdateTaskInput) => Promise<boolean>;
  updateTaskStatus: (taskId: string, status: Status) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  refetchTasks: () => Promise<void>;

  // Team members
  teamMembers: TeamMember[];
  taskAssignees: TaskAssignee[];
  addTeamMember: (name: string, color: string) => Promise<boolean>;
  removeTeamMember: (memberId: string) => Promise<void>;
  assignMember: (taskId: string, memberId: string) => Promise<void>;
  unassignMember: (taskId: string, memberId: string) => Promise<void>;
  getTaskAssignees: (taskId: string) => TeamMember[];

  // Labels
  labels: Label[];
  taskLabels: TaskLabel[];
  addLabel: (name: string, color: string) => Promise<boolean>;
  removeLabel: (labelId: string) => Promise<void>;
  addLabelToTask: (taskId: string, labelId: string) => Promise<void>;
  removeLabelFromTask: (taskId: string, labelId: string) => Promise<void>;
  getTaskLabels: (taskId: string) => Label[];

  // Comments
  fetchComments: (taskId: string) => Promise<Comment[]>;
  addComment: (taskId: string, content: string) => Promise<Comment | null>;
  deleteComment: (commentId: string) => Promise<void>;

  // Activity log
  fetchActivity: (taskId: string) => Promise<ActivityLog[]>;

  // Filters
  filters: BoardFilters;
  setFilters: (filters: BoardFilters) => void;
  filteredTasks: Task[];

  // Selected task
  selectedTask: Task | null;
  setSelectedTask: (task: Task | null) => void;

  // Board stats
  stats: { total: number; completed: number; overdue: number; inProgress: number };
}

const BoardContext = createContext<BoardContextValue | null>(null);

export function BoardProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [taskAssignees, setTaskAssignees] = useState<TaskAssignee[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [taskLabels, setTaskLabels] = useState<TaskLabel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<BoardFilters>(DEFAULT_FILTERS);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const loadAll = useCallback(async () => {
    try {
      setError(null);
      await ensureGuestSession();
      const [tasksData, membersData, assigneesData, labelsData, taskLabelsData] = await Promise.all([
        TaskService.fetchAll(),
        TeamService.fetchMembers(),
        TeamService.fetchAssignees(),
        LabelService.fetchAll(),
        LabelService.fetchTaskLabels(),
      ]);
      setTasks(tasksData);
      setTeamMembers(membersData);
      setTaskAssignees(assigneesData);
      setLabels(labelsData);
      setTaskLabels(taskLabelsData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load board data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ─── Task Operations ────────────────────────────────────────
  const createTask = useCallback(async (input: CreateTaskInput): Promise<boolean> => {
    try {
      const task = await TaskService.create(input);
      setTasks(prev => [...prev, task]);
      try {
        await ActivityService.log(task.id, 'created', `Task "${task.title}" created`);
      } catch {
        // Activity logging is non-critical
      }
      return true;
    } catch (e) {
      console.error('Failed to create task:', e);
      return false;
    }
  }, []);

  const updateTask = useCallback(async (taskId: string, input: UpdateTaskInput): Promise<boolean> => {
    try {
      await TaskService.update(taskId, input);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...input } : t));
      if (selectedTask?.id === taskId) {
        setSelectedTask(prev => prev ? { ...prev, ...input } : null);
      }

      const changes: string[] = [];
      if (input.title) changes.push(`Title updated`);
      if (input.description !== undefined) changes.push(`Description updated`);
      if (input.priority) changes.push(`Priority set to ${input.priority}`);
      if (input.due_date !== undefined) changes.push(input.due_date ? `Due date set to ${input.due_date}` : 'Due date removed');
      if (changes.length > 0) {
        await ActivityService.log(taskId, 'updated', changes.join(', '));
      }
      return true;
    } catch {
      return false;
    }
  }, [selectedTask?.id]);

  const updateTaskStatus = useCallback(async (taskId: string, status: Status) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === status) return;

    const oldStatus = COLUMNS.find(c => c.id === task.status)?.label ?? task.status;
    const newStatus = COLUMNS.find(c => c.id === status)?.label ?? status;

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
    if (selectedTask?.id === taskId) {
      setSelectedTask(prev => prev ? { ...prev, status } : null);
    }

    try {
      await TaskService.updateStatus(taskId, status);
      await ActivityService.log(taskId, 'status_changed', `Moved from ${oldStatus} to ${newStatus}`);
    } catch {
      loadAll();
    }
  }, [tasks, selectedTask?.id, loadAll]);

  const deleteTask = useCallback(async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    if (selectedTask?.id === taskId) setSelectedTask(null);
    try {
      await TaskService.delete(taskId);
    } catch {
      loadAll();
    }
  }, [selectedTask?.id, loadAll]);

  // ─── Team Operations ────────────────────────────────────────
  const addTeamMember = useCallback(async (name: string, color: string): Promise<boolean> => {
    try {
      const member = await TeamService.createMember(name, color);
      setTeamMembers(prev => [...prev, member]);
      return true;
    } catch {
      return false;
    }
  }, []);

  const removeTeamMember = useCallback(async (memberId: string) => {
    setTeamMembers(prev => prev.filter(m => m.id !== memberId));
    setTaskAssignees(prev => prev.filter(a => a.team_member_id !== memberId));
    try { await TeamService.deleteMember(memberId); } catch { loadAll(); }
  }, [loadAll]);

  const assignMember = useCallback(async (taskId: string, memberId: string) => {
    try {
      const assignee = await TeamService.assignMember(taskId, memberId);
      setTaskAssignees(prev => [...prev, assignee]);
      const member = teamMembers.find(m => m.id === memberId);
      if (member) {
        await ActivityService.log(taskId, 'assigned', `${member.name} assigned`);
      }
    } catch { /* duplicate assignment */ }
  }, [teamMembers]);

  const unassignMember = useCallback(async (taskId: string, memberId: string) => {
    setTaskAssignees(prev => prev.filter(a => !(a.task_id === taskId && a.team_member_id === memberId)));
    try {
      await TeamService.unassignMember(taskId, memberId);
      const member = teamMembers.find(m => m.id === memberId);
      if (member) {
        await ActivityService.log(taskId, 'unassigned', `${member.name} unassigned`);
      }
    } catch { loadAll(); }
  }, [teamMembers, loadAll]);

  const getTaskAssignees = useCallback((taskId: string): TeamMember[] => {
    const memberIds = taskAssignees.filter(a => a.task_id === taskId).map(a => a.team_member_id);
    return teamMembers.filter(m => memberIds.includes(m.id));
  }, [taskAssignees, teamMembers]);

  // ─── Label Operations ───────────────────────────────────────
  const addLabel = useCallback(async (name: string, color: string): Promise<boolean> => {
    try {
      const label = await LabelService.create(name, color);
      setLabels(prev => [...prev, label]);
      return true;
    } catch {
      return false;
    }
  }, []);

  const removeLabel = useCallback(async (labelId: string) => {
    setLabels(prev => prev.filter(l => l.id !== labelId));
    setTaskLabels(prev => prev.filter(tl => tl.label_id !== labelId));
    try { await LabelService.delete(labelId); } catch { loadAll(); }
  }, [loadAll]);

  const addLabelToTask = useCallback(async (taskId: string, labelId: string) => {
    try {
      const tl = await LabelService.addLabelToTask(taskId, labelId);
      setTaskLabels(prev => [...prev, tl]);
      const label = labels.find(l => l.id === labelId);
      if (label) {
        await ActivityService.log(taskId, 'label_added', `Label "${label.name}" added`);
      }
    } catch { /* duplicate */ }
  }, [labels]);

  const removeLabelFromTask = useCallback(async (taskId: string, labelId: string) => {
    setTaskLabels(prev => prev.filter(tl => !(tl.task_id === taskId && tl.label_id === labelId)));
    try {
      await LabelService.removeLabelFromTask(taskId, labelId);
      const label = labels.find(l => l.id === labelId);
      if (label) {
        await ActivityService.log(taskId, 'label_removed', `Label "${label.name}" removed`);
      }
    } catch { loadAll(); }
  }, [labels, loadAll]);

  const getTaskLabels = useCallback((taskId: string): Label[] => {
    const labelIds = taskLabels.filter(tl => tl.task_id === taskId).map(tl => tl.label_id);
    return labels.filter(l => labelIds.includes(l.id));
  }, [taskLabels, labels]);

  // ─── Comment Operations ─────────────────────────────────────
  const fetchComments = useCallback(async (taskId: string): Promise<Comment[]> => {
    return CommentService.fetchByTask(taskId);
  }, []);

  const addComment = useCallback(async (taskId: string, content: string): Promise<Comment | null> => {
    try {
      const comment = await CommentService.create(taskId, content);
      await ActivityService.log(taskId, 'comment_added', 'New comment added');
      return comment;
    } catch {
      return null;
    }
  }, []);

  const deleteComment = useCallback(async (commentId: string) => {
    await CommentService.delete(commentId);
  }, []);

  // ─── Activity Operations ────────────────────────────────────
  const fetchActivity = useCallback(async (taskId: string): Promise<ActivityLog[]> => {
    return ActivityService.fetchByTask(taskId);
  }, []);

  // ─── Filtering ──────────────────────────────────────────────
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesDesc = task.description?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc) return false;
      }
      if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
      if (filters.assignee !== 'all') {
        const memberIds = taskAssignees.filter(a => a.task_id === task.id).map(a => a.team_member_id);
        if (!memberIds.includes(filters.assignee)) return false;
      }
      if (filters.label !== 'all') {
        const labelIds = taskLabels.filter(tl => tl.task_id === task.id).map(tl => tl.label_id);
        if (!labelIds.includes(filters.label)) return false;
      }
      return true;
    });
  }, [tasks, filters, taskAssignees, taskLabels]);

  // ─── Stats ──────────────────────────────────────────────────
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'done').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      overdue: tasks.filter(t => {
        if (!t.due_date || t.status === 'done') return false;
        return new Date(t.due_date) < today;
      }).length,
    };
  }, [tasks]);

  const value: BoardContextValue = {
    tasks, loading, error, createTask, updateTask, updateTaskStatus, deleteTask, refetchTasks: loadAll,
    teamMembers, taskAssignees, addTeamMember, removeTeamMember, assignMember, unassignMember, getTaskAssignees,
    labels, taskLabels, addLabel, removeLabel, addLabelToTask, removeLabelFromTask, getTaskLabels,
    fetchComments, addComment, deleteComment,
    fetchActivity,
    filters, setFilters, filteredTasks,
    selectedTask, setSelectedTask,
    stats,
  };

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useBoard(): BoardContextValue {
  const context = useContext(BoardContext);
  if (!context) throw new Error('useBoard must be used within BoardProvider');
  return context;
}
