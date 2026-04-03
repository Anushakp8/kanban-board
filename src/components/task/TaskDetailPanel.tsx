import { useState, useEffect, useCallback } from 'react';
import { useBoard } from '../../context/BoardContext';
import { UpdateTaskSchema } from '../../types';
import type { Task, Comment, ActivityLog, Priority, Status } from '../../types';
import { COLUMNS } from '../../types';
import { formatRelativeTime, getDueDateInfo } from '../../lib/dateUtils';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FlagIcon from '@mui/icons-material/Flag';
import SendIcon from '@mui/icons-material/Send';
import HistoryIcon from '@mui/icons-material/History';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LabelIcon from '@mui/icons-material/Label';

interface Props {
  task: Task;
  onClose: () => void;
}

type Tab = 'comments' | 'activity';

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string }> = {
  high: { label: 'High', color: '#ef4444' },
  normal: { label: 'Normal', color: '#3b82f6' },
  low: { label: 'Low', color: '#94a3b8' },
};

function getColumnInfo(status: Status) {
  const col = COLUMNS.find(c => c.id === status);
  return { label: col?.label ?? status, iconColor: col?.iconColor ?? '#94a3b8' };
}

export function TaskDetailPanel({ task, onClose }: Props) {
  const {
    updateTask, deleteTask,
    teamMembers, getTaskAssignees, assignMember, unassignMember,
    labels, getTaskLabels, addLabelToTask, removeLabelFromTask,
    fetchComments, addComment, deleteComment,
    fetchActivity,
  } = useBoard();

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc, setEditDesc] = useState(task.description ?? '');
  const [editPriority, setEditPriority] = useState<Priority>(task.priority);
  const [editDueDate, setEditDueDate] = useState(task.due_date ?? '');
  const [editStatus, setEditStatus] = useState<Status>(task.status);

  const [tab, setTab] = useState<Tab>('comments');
  const [comments, setComments] = useState<Comment[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(true);
  const [showAssignees, setShowAssignees] = useState(false);
  const [showLabelsMenu, setShowLabelsMenu] = useState(false);

  const assignees = getTaskAssignees(task.id);
  const taskLabelList = getTaskLabels(task.id);
  const dueDateInfo = getDueDateInfo(task.due_date, task.status === 'done');
  const statusInfo = getColumnInfo(task.status);

  const loadComments = useCallback(async () => {
    setLoadingComments(true);
    try {
      const data = await fetchComments(task.id);
      setComments(data);
    } catch {
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  }, [fetchComments, task.id]);

  const loadActivity = useCallback(async () => {
    try {
      const data = await fetchActivity(task.id);
      setActivities(data);
    } catch {
      setActivities([]);
    }
  }, [fetchActivity, task.id]);

  useEffect(() => {
    loadComments();
    loadActivity();
  }, [loadComments, loadActivity]);

  useEffect(() => {
    setEditTitle(task.title);
    setEditDesc(task.description ?? '');
    setEditPriority(task.priority);
    setEditDueDate(task.due_date ?? '');
    setEditStatus(task.status);
  }, [task]);

  const handleSave = async () => {
    const parsed = UpdateTaskSchema.safeParse({
      title: editTitle.trim(),
      description: editDesc.trim() || null,
      priority: editPriority,
      due_date: editDueDate || null,
      status: editStatus,
    });
    if (!parsed.success) return;

    const success = await updateTask(task.id, parsed.data);
    if (success) {
      setIsEditing(false);
      loadActivity();
    }
  };

  const handleDelete = async () => {
    await deleteTask(task.id);
    onClose();
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    const comment = await addComment(task.id, newComment.trim());
    if (comment) {
      setComments(prev => [...prev, comment]);
      setNewComment('');
      loadActivity();
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const prev = [...comments];
    setComments(c => c.filter(x => x.id !== commentId));
    try {
      await deleteComment(commentId);
    } catch {
      setComments(prev);
    }
  };

  const handleToggleAssignee = async (memberId: string) => {
    const isAssigned = assignees.some(a => a.id === memberId);
    if (isAssigned) {
      await unassignMember(task.id, memberId);
    } else {
      await assignMember(task.id, memberId);
    }
    loadActivity();
  };

  const handleToggleLabel = async (labelId: string) => {
    const hasLabel = taskLabelList.some(l => l.id === labelId);
    if (hasLabel) {
      await removeLabelFromTask(task.id, labelId);
    } else {
      await addLabelToTask(task.id, labelId);
    }
    loadActivity();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={onClose}
        role="presentation"
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-label={`Task details: ${task.title}`}
        className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Chip
              label={statusInfo.label}
              size="small"
              style={{ backgroundColor: statusInfo.iconColor, color: 'white' }}
            />
          </div>
          <div className="flex items-center gap-1">
            {!isEditing ? (
              <Tooltip title="Edit task">
                <IconButton size="small" onClick={() => setIsEditing(true)} aria-label="Edit task">
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="Save changes">
                <IconButton size="small" onClick={handleSave} color="primary" aria-label="Save changes">
                  <SaveIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Delete task">
              <IconButton size="small" onClick={handleDelete} aria-label="Delete task">
                <DeleteOutlineIcon fontSize="small" className="!text-rose-400" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Close">
              <IconButton size="small" onClick={onClose} aria-label="Close panel">
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Title */}
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              aria-label="Task title"
              className="w-full text-lg font-bold text-slate-900 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <h2 className="text-lg font-bold text-slate-900">{task.title}</h2>
          )}

          {/* Description */}
          {isEditing ? (
            <textarea
              value={editDesc}
              onChange={e => setEditDesc(e.target.value)}
              placeholder="Add a description..."
              rows={4}
              aria-label="Task description"
              className="w-full text-sm text-slate-600 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          ) : (
            <p className="text-sm text-slate-500 leading-relaxed whitespace-pre-wrap">
              {task.description || 'No description'}
            </p>
          )}

          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Status */}
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</span>
              {isEditing ? (
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value as Status)}
                  aria-label="Task status"
                  className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {COLUMNS.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              ) : (
                <Chip
                  label={statusInfo.label}
                  size="small"
                  style={{ backgroundColor: statusInfo.iconColor, color: 'white' }}
                />
              )}
            </div>

            {/* Priority */}
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Priority</span>
              {isEditing ? (
                <select
                  value={editPriority}
                  onChange={e => setEditPriority(e.target.value as Priority)}
                  aria-label="Task priority"
                  className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold">
                  <FlagIcon style={{ fontSize: 14, color: PRIORITY_CONFIG[task.priority].color }} />
                  {PRIORITY_CONFIG[task.priority].label}
                </span>
              )}
            </div>

            {/* Due date */}
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Due Date</span>
              {isEditing ? (
                <input
                  type="date"
                  value={editDueDate}
                  onChange={e => setEditDueDate(e.target.value)}
                  aria-label="Due date"
                  className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <span className={`text-xs font-semibold ${dueDateInfo ? dueDateInfo.text : 'text-slate-400'}`}>
                  {dueDateInfo ? dueDateInfo.label : 'No due date'}
                </span>
              )}
            </div>

            {/* Created */}
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Created</span>
              <span className="text-xs text-slate-500">{formatRelativeTime(task.created_at)}</span>
            </div>
          </div>

          {/* Assignees */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assignees</span>
              {teamMembers.length > 0 && (
                <Tooltip title="Manage assignees">
                  <IconButton size="small" onClick={() => setShowAssignees(!showAssignees)} aria-label="Manage assignees">
                    <PersonAddIcon style={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              )}
            </div>
            {assignees.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {assignees.map(member => (
                  <Chip
                    key={member.id}
                    label={member.name}
                    size="small"
                    onDelete={() => handleToggleAssignee(member.id)}
                    avatar={
                      <div
                        className="!w-5 !h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ backgroundColor: member.color }}
                      >
                        {(member.name[0] ?? '?').toUpperCase()}
                      </div>
                    }
                    className="!text-xs"
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                {teamMembers.length > 0 ? 'No assignees — click + to add' : 'Add team members first'}
              </p>
            )}
            {showAssignees && teamMembers.length > 0 && (
              <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-100 animate-fade-in" role="listbox" aria-label="Team members">
                {teamMembers.map(member => {
                  const isAssigned = assignees.some(a => a.id === member.id);
                  return (
                    <button
                      key={member.id}
                      type="button"
                      role="option"
                      aria-selected={isAssigned}
                      onClick={() => handleToggleAssignee(member.id)}
                      className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs transition-colors ${
                        isAssigned ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ backgroundColor: member.color }}
                      >
                        {(member.name[0] ?? '?').toUpperCase()}
                      </div>
                      {member.name}
                      {isAssigned && <span className="ml-auto text-blue-500">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Labels */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Labels</span>
              {labels.length > 0 && (
                <Tooltip title="Manage labels">
                  <IconButton size="small" onClick={() => setShowLabelsMenu(!showLabelsMenu)} aria-label="Manage labels">
                    <LabelIcon style={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              )}
            </div>
            {taskLabelList.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {taskLabelList.map(label => (
                  <Chip
                    key={label.id}
                    label={label.name}
                    size="small"
                    onDelete={() => handleToggleLabel(label.id)}
                    style={{ backgroundColor: label.color, color: 'white' }}
                    className="!text-xs !font-semibold"
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                {labels.length > 0 ? 'No labels — click tag icon to add' : 'Create labels first'}
              </p>
            )}
            {showLabelsMenu && labels.length > 0 && (
              <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-100 animate-fade-in" role="listbox" aria-label="Labels">
                {labels.map(label => {
                  const hasLabel = taskLabelList.some(l => l.id === label.id);
                  return (
                    <button
                      key={label.id}
                      type="button"
                      role="option"
                      aria-selected={hasLabel}
                      onClick={() => handleToggleLabel(label.id)}
                      className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs transition-colors ${
                        hasLabel ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: label.color }} />
                      {label.name}
                      {hasLabel && <span className="ml-auto text-blue-500">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tabs: Comments & Activity */}
          <div className="border-t border-slate-100 pt-4">
            <div className="flex gap-4 mb-4" role="tablist">
              <button
                role="tab"
                aria-selected={tab === 'comments'}
                onClick={() => setTab('comments')}
                className={`flex items-center gap-1.5 text-xs font-semibold pb-2 border-b-2 transition-colors ${
                  tab === 'comments' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <ChatBubbleOutlineIcon style={{ fontSize: 14 }} />
                Comments ({comments.length})
              </button>
              <button
                role="tab"
                aria-selected={tab === 'activity'}
                onClick={() => setTab('activity')}
                className={`flex items-center gap-1.5 text-xs font-semibold pb-2 border-b-2 transition-colors ${
                  tab === 'activity' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <HistoryIcon style={{ fontSize: 14 }} />
                Activity ({activities.length})
              </button>
            </div>

            {tab === 'comments' && (
              <div role="tabpanel" className="space-y-3">
                {loadingComments ? (
                  <p className="text-xs text-slate-400">Loading comments...</p>
                ) : comments.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No comments yet. Start the conversation!</p>
                ) : (
                  comments.map(comment => (
                    <div key={comment.id} className="group flex gap-2 animate-fade-in">
                      <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 flex-shrink-0 mt-0.5">
                        G
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-700">Guest</span>
                          <span className="text-[10px] text-slate-400">{formatRelativeTime(comment.created_at)}</span>
                          <button
                            type="button"
                            aria-label="Delete comment"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                          >
                            <DeleteOutlineIcon style={{ fontSize: 14 }} className="text-slate-300 hover:text-rose-400" />
                          </button>
                        </div>
                        <p className="text-sm text-slate-600 mt-0.5 whitespace-pre-wrap break-words">{comment.content}</p>
                      </div>
                    </div>
                  ))
                )}

                {/* Comment input */}
                <div className="flex gap-2 mt-3">
                  <input
                    type="text"
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                    placeholder="Write a comment..."
                    aria-label="Write a comment"
                    className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-300 bg-slate-50"
                  />
                  <Tooltip title="Send">
                    <IconButton
                      size="small"
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      color="primary"
                      aria-label="Send comment"
                    >
                      <SendIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </div>
              </div>
            )}

            {tab === 'activity' && (
              <div role="tabpanel" className="space-y-2">
                {activities.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No activity yet</p>
                ) : (
                  activities.map(activity => (
                    <div key={activity.id} className="flex gap-2 py-1.5 animate-fade-in">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-600">
                          <span className="font-medium">{activity.details ?? activity.action}</span>
                        </p>
                        <span className="text-[10px] text-slate-400">{formatRelativeTime(activity.created_at)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
