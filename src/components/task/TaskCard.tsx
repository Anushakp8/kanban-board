import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useBoard } from '../../context/BoardContext';
import type { Task } from '../../types';
import { getDueDateInfo } from '../../lib/dateUtils';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FlagIcon from '@mui/icons-material/Flag';

interface Props {
  task: Task;
  isDragOverlay?: boolean;
}

const PRIORITY_STYLES: Record<Task['priority'], { label: string; bg: string; text: string; flag: string }> = {
  high: { label: 'High', bg: 'bg-rose-50', text: 'text-rose-600', flag: '#ef4444' },
  normal: { label: 'Normal', bg: 'bg-blue-50', text: 'text-blue-600', flag: '#3b82f6' },
  low: { label: 'Low', bg: 'bg-slate-50', text: 'text-slate-500', flag: '#94a3b8' },
};

export const TaskCard = memo(function TaskCard({ task, isDragOverlay }: Props) {
  const { setSelectedTask, deleteTask, getTaskAssignees, getTaskLabels } = useBoard();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: isDragOverlay,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const priority = PRIORITY_STYLES[task.priority];
  const dueDateInfo = getDueDateInfo(task.due_date, task.status === 'done');
  const assignees = getTaskAssignees(task.id);
  const labels = getTaskLabels(task.id);

  const handleClick = (e: React.MouseEvent) => {
    if (isDragOverlay) return;
    e.stopPropagation();
    setSelectedTask(task);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteTask(task.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`Task: ${task.title}, Priority: ${task.priority}, Status: ${task.status}`}
      className={`task-card group bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-grab active:cursor-grabbing animate-fade-in ${
        isDragOverlay ? 'shadow-2xl border-blue-300' : ''
      }`}
    >
      {/* Labels row */}
      {labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {labels.map(label => (
            <span
              key={label.id}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: label.color }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      {/* Title & Delete */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-slate-800 leading-snug flex-1">{task.title}</p>
        {!isDragOverlay && (
          <Tooltip title="Delete task">
            <IconButton
              size="small"
              onClick={handleDelete}
              onPointerDown={e => e.stopPropagation()}
              aria-label={`Delete task: ${task.title}`}
              className="!opacity-0 group-hover:!opacity-100 !transition-opacity !-mt-1 !-mr-1"
            >
              <DeleteOutlineIcon fontSize="small" className="!text-slate-400 hover:!text-rose-500" />
            </IconButton>
          </Tooltip>
        )}
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">{task.description}</p>
      )}

      {/* Footer: priority, due date */}
      <div className="flex items-center gap-1.5 mt-3 flex-wrap">
        {/* Priority */}
        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${priority.bg} ${priority.text}`}>
          <FlagIcon style={{ fontSize: 10, color: priority.flag }} />
          {priority.label}
        </span>

        {/* Due date */}
        {dueDateInfo && (
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${dueDateInfo.bg} ${dueDateInfo.text}`}>
            <CalendarTodayIcon style={{ fontSize: 10 }} />
            {dueDateInfo.label}
          </span>
        )}
      </div>

      {/* Assignee avatars */}
      {assignees.length > 0 && (
        <div className="flex items-center mt-2.5 -space-x-1.5">
          {assignees.slice(0, 4).map(member => (
            <Tooltip key={member.id} title={member.name}>
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-white"
                style={{ backgroundColor: member.color }}
              >
                {(member.name[0] ?? '?').toUpperCase()}
              </div>
            </Tooltip>
          ))}
          {assignees.length > 4 && (
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-500 bg-slate-100 ring-2 ring-white">
              +{assignees.length - 4}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
