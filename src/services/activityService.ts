import { supabase, getCurrentUserId } from '../lib/supabase';
import type { ActivityLog } from '../types';

export const ActivityService = {
  async fetchByTask(taskId: string): Promise<ActivityLog[]> {
    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async log(taskId: string, action: string, details?: string): Promise<void> {
    const userId = await getCurrentUserId();
    const { error } = await supabase
      .from('activity_log')
      .insert({
        task_id: taskId,
        action,
        details: details ?? null,
        user_id: userId,
      });
    if (error) throw new Error(error.message);
  },
};
