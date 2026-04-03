import { supabase, getCurrentUserId } from '../lib/supabase';
import type { TeamMember, TaskAssignee } from '../types';

export const TeamService = {
  async fetchMembers(): Promise<TeamMember[]> {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async createMember(name: string, color: string): Promise<TeamMember> {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('team_members')
      .insert({ name, color, user_id: userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  async deleteMember(memberId: string): Promise<void> {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', memberId);
    if (error) throw new Error(error.message);
  },

  async fetchAssignees(): Promise<TaskAssignee[]> {
    const { data, error } = await supabase
      .from('task_assignees')
      .select('*');
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async assignMember(taskId: string, teamMemberId: string): Promise<TaskAssignee> {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('task_assignees')
      .insert({ task_id: taskId, team_member_id: teamMemberId, user_id: userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  async unassignMember(taskId: string, teamMemberId: string): Promise<void> {
    const { error } = await supabase
      .from('task_assignees')
      .delete()
      .eq('task_id', taskId)
      .eq('team_member_id', teamMemberId);
    if (error) throw new Error(error.message);
  },
};
