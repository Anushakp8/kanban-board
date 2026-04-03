import { supabase, getCurrentUserId } from '../lib/supabase';
import type { Comment } from '../types';

export const CommentService = {
  async fetchByTask(taskId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async create(taskId: string, content: string): Promise<Comment> {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('comments')
      .insert({ task_id: taskId, content, user_id: userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  async delete(commentId: string): Promise<void> {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);
    if (error) throw new Error(error.message);
  },
};
