import { supabase, getCurrentUserId } from '../lib/supabase';
import type { Label, TaskLabel } from '../types';

export const LabelService = {
  async fetchAll(): Promise<Label[]> {
    const { data, error } = await supabase
      .from('labels')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async create(name: string, color: string): Promise<Label> {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('labels')
      .insert({ name, color, user_id: userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  async delete(labelId: string): Promise<void> {
    const { error } = await supabase
      .from('labels')
      .delete()
      .eq('id', labelId);
    if (error) throw new Error(error.message);
  },

  async fetchTaskLabels(): Promise<TaskLabel[]> {
    const { data, error } = await supabase
      .from('task_labels')
      .select('*');
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async addLabelToTask(taskId: string, labelId: string): Promise<TaskLabel> {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('task_labels')
      .insert({ task_id: taskId, label_id: labelId, user_id: userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  async removeLabelFromTask(taskId: string, labelId: string): Promise<void> {
    const { error } = await supabase
      .from('task_labels')
      .delete()
      .eq('task_id', taskId)
      .eq('label_id', labelId);
    if (error) throw new Error(error.message);
  },
};
