import { supabase, getCurrentUserId } from '../lib/supabase';
import type { Task, CreateTaskInput, UpdateTaskInput, Status } from '../types';

export const TaskService = {
  async fetchAll(): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async create(input: CreateTaskInput): Promise<Task> {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: input.title,
        description: input.description ?? null,
        priority: input.priority ?? 'normal',
        due_date: input.due_date ?? null,
        status: input.status ?? 'todo',
        user_id: userId,
        position: Math.floor(Date.now() / 1000) % 2000000000,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  async update(taskId: string, input: UpdateTaskInput): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .update(input)
      .eq('id', taskId);
    if (error) throw new Error(error.message);
  },

  async updateStatus(taskId: string, status: Status): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .update({ status })
      .eq('id', taskId);
    if (error) throw new Error(error.message);
  },

  async delete(taskId: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);
    if (error) throw new Error(error.message);
  },
};
