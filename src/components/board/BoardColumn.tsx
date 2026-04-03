import { memo, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task, ColumnConfig } from '../../types';
import { TaskCard } from '../task/TaskCard';

interface Props {
  column: ColumnConfig;
  tasks: Task[];
}

const EMPTY_ICONS: Record<string, string> = {
  todo: '📋',
  in_progress: '⚡',
  in_review: '👁️',
  done: '✅',
};

export const BoardColumn = memo(function BoardColumn({ column, tasks }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const taskIds = useMemo(() => tasks.map(t => t.id), [tasks]);

  return (
    <div className="flex flex-col min-w-[280px] w-[300px]">
      {/* Column Header */}
      <div className="flex items-center gap-2.5 mb-3 px-1">
        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${column.dotColor}`} />
        <h2 className={`text-xs font-bold uppercase tracking-wider ${column.color}`}>
          {column.label}
        </h2>
        <span className="ml-auto text-xs font-bold text-slate-400 bg-slate-100 rounded-full px-2 py-0.5 min-w-[24px] text-center">
          {tasks.length}
        </span>
      </div>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        role="list"
        aria-label={`${column.label} column with ${tasks.length} tasks`}
        className={`flex flex-col gap-2.5 flex-1 min-h-[200px] p-2.5 rounded-xl transition-all duration-200 border ${
          isOver
            ? 'bg-blue-50/80 ring-2 ring-blue-300 border-blue-200'
            : `${column.bgColor} ${column.borderColor} border-dashed`
        }`}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
            <div className="text-3xl mb-2 opacity-25">
              {EMPTY_ICONS[column.id] ?? '📋'}
            </div>
            <p className="text-xs text-slate-400 font-medium">No tasks yet</p>
            <p className="text-xs text-slate-300 mt-0.5">Drag tasks here</p>
          </div>
        )}
      </div>
    </div>
  );
});
